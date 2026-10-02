/**
 * Clipboard support for the static math elements (`<math-span>` and
 * `<math-div>`).
 *
 * The rendered formula lives in the shadow root of the element. Left alone,
 * the browser would copy the glyphs in layout order (`b a +x 2`), and the
 * result would vary between browsers. Instead, when the selection touches a
 * single static element and no other text, its LaTeX source is copied as is.
 * When the selection also includes some text, each static element is replaced
 * with its LaTeX source wrapped in `$...$` (inline) or `$$...$$` (display, on
 * a line of its own), and the browser serializes the result as text and HTML.
 */

export type StaticMathInfo = { latex: string; display: boolean };

export type StaticCopyData = { text: string; html?: string };

/**
 * Elements whose clone should not be attached to the document, since they
 * would load their content again. They do not contribute to the text of the
 * selection.
 */
const EMBEDDED_CONTENT = 'iframe, frame, object, embed, video, audio';

/**
 * Return the data to put on the clipboard for the current selection of
 * `doc`, or `undefined` if the selection does not include any of the static
 * math `elements` (in which case the default copy behavior should be used).
 */
export function getStaticCopyData(
  doc: Document,
  elements: Element[],
  lookup: (element: Element) => StaticMathInfo
): StaticCopyData | undefined {
  const shadowRoots = elements.flatMap((element) =>
    element.shadowRoot ? [element.shadowRoot] : []
  );
  const range = getSelectionRange(doc, shadowRoots);
  if (!range) return undefined;

  // Most copies do not involve a static element: check this first
  const selected = elements
    .filter((element) => range.intersectsNode(element))
    .sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
  if (selected.length === 0) return undefined;

  // The `<math-field>` copy behavior is left unchanged
  if (
    [...doc.querySelectorAll('math-field')].some((mf) =>
      range.intersectsNode(mf)
    )
  )
    return undefined;

  // The boundaries of the range are outside of the shadow trees, so the
  // fragment contains a clone of each selected element, in document order
  const fragment = range.cloneContents();
  const tagNames = [...new Set(selected.map((element) => element.localName))];
  const clones = [...fragment.querySelectorAll(tagNames.join(', '))];
  if (clones.length !== selected.length) return undefined;

  // A single formula, without surrounding text, is copied as its LaTeX
  // source, without delimiters
  if (selected.length === 1) {
    const rest = fragment.cloneNode(true) as DocumentFragment;
    rest.querySelector(selected[0].localName)?.remove();
    if (!rest.textContent?.trim()) return { text: lookup(selected[0]).latex };
  }

  selected.forEach((element, i) => {
    const { latex, display } = lookup(element);
    if (display) {
      const block = doc.createElement('div');
      block.textContent = `$$${latex}$$`;
      clones[i].replaceWith(block);
    } else clones[i].replaceWith(doc.createTextNode(`$${latex}$`));
  });

  const container = doc.createElement('div');
  container.append(fragment);
  const html = container.innerHTML;

  // `innerText` is only computed for rendered content: attach the container,
  // out of view, for the time of the serialization
  for (const element of container.querySelectorAll(EMBEDDED_CONTENT))
    element.remove();
  // The clones of custom elements would run their `connectedCallback()`, and
  // their shadow root could hide their content: replace them with a `<span>`
  for (const element of [...container.querySelectorAll('*')].reverse()) {
    if (!element.localName.includes('-')) continue;
    const span = doc.createElement('span');
    span.append(...element.childNodes);
    element.replaceWith(span);
  }
  container.inert = true;
  container.setAttribute('aria-hidden', 'true');
  // The container is not always relative to the viewport (e.g. in a
  // transformed ancestor): keep it small and clipped so that it does not
  // overflow its parent
  container.style.cssText =
    'position: fixed; top: 0; left: 0; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); pointer-events: none';
  getSerializationParent(doc, range).append(container);
  try {
    return { text: container.innerText, html };
  } finally {
    container.remove();
  }
}

/**
 * Return the element to attach the content to while computing its text.
 *
 * The content is attached to the closest common ancestor of the selection,
 * so that the inherited styles (e.g. `white-space`) and the rules that depend
 * on an ancestor apply as they do on the page. The body is used instead if
 * the ancestor is not an HTML element, or is editable: an editor could react
 * to the mutation.
 */
function getSerializationParent(doc: Document, range: Range): HTMLElement {
  const node = range.commonAncestorContainer;
  const ancestor = node instanceof Element ? node : node.parentElement;
  if (
    ancestor instanceof HTMLElement &&
    doc.body.contains(ancestor) &&
    !ancestor.isContentEditable
  )
    return ancestor;
  return doc.body;
}

/**
 * Return the selection as a range of the document tree.
 *
 * `getRangeAt()` does not report positions inside shadow roots consistently
 * (Chrome and Safari collapse the range at the shadow host), so we use
 * `getComposedRanges()` when it is available. Boundary points inside a
 * shadow tree are then moved to just before (start) or just after (end) the
 * outermost shadow host, which includes the host in the range.
 */
function getSelectionRange(
  doc: Document,
  shadowRoots: ShadowRoot[]
): Range | undefined {
  const selection = doc.getSelection();
  if (!selection) return undefined;

  let source: AbstractRange | undefined;
  if (typeof selection.getComposedRanges === 'function') {
    try {
      source = selection.getComposedRanges({ shadowRoots })[0];
    } catch {
      // Safari 17 only supports the variadic signature
      try {
        source = (
          selection.getComposedRanges as (
            ...roots: ShadowRoot[]
          ) => StaticRange[]
        ).apply(selection, shadowRoots)[0];
      } catch {
        source = undefined;
      }
    }
  }
  // Safari reports a `rangeCount` of 0 when the selection crosses a
  // shadow boundary, even though `getComposedRanges()` returns a range
  if (!source && selection.rangeCount > 0) source = selection.getRangeAt(0);
  if (!source || source.collapsed) return undefined;

  const start = toDocumentBoundary(
    source.startContainer,
    source.startOffset,
    'start'
  );
  const end = toDocumentBoundary(source.endContainer, source.endOffset, 'end');
  if (!start || !end) return undefined;
  if (start[0].getRootNode() !== doc || end[0].getRootNode() !== doc)
    return undefined;

  const range = doc.createRange();
  range.setStart(start[0], start[1]);
  range.setEnd(end[0], end[1]);
  return range.collapsed ? undefined : range;
}

function toDocumentBoundary(
  node: Node,
  offset: number,
  edge: 'start' | 'end'
): [Node, number] | undefined {
  let root = node.getRootNode();
  while (root instanceof ShadowRoot) {
    const host = root.host;
    const parent = host.parentNode;
    if (!parent) return undefined;
    node = parent;
    offset = [...parent.childNodes].indexOf(host);
    if (edge === 'end') offset += 1;
    root = parent.getRootNode();
  }
  return [node, offset];
}
