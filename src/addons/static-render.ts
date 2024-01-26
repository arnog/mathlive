/* eslint no-console:0 */

import type { StaticRenderOptions } from '../public/options';
import { injectStylesheet } from '../common/stylesheet';
import { loadFonts } from '../core/fonts';
import { parseMathString } from '../formats/parse-math-string';

import '../core/atom';

/** @internal */
export type StaticRenderOptionsPrivate = StaticRenderOptions & {
  /** A function that will convert any LaTeX found to
   * HTML markup. This is only useful to override the default MathLive renderer
   */
  renderToMarkup?: (
    text: string,
    options: {
      mathstyle?: 'displaystyle' | 'textstyle';
      format?: string;
    }
  ) => string;

  /**
   * A function that will convert any LaTeX found to
   * MathML markup.
   */
  renderToMathML?: (text: string) => string;

  /** A function that will convert a LaTeX string to speakable text markup. */
  renderToSpeakableText?: (text: string) => string;

  /** A function to convert MathJSON to a LaTeX string */
  serializeToLatex?: (json: unknown) => string;

  ignoreClassPattern?: RegExp;
  processClassPattern?: RegExp;
  processScriptTypePattern?: RegExp;
  processMathJSONScriptTypePattern?: RegExp;

  texClassDisplayPattern?: RegExp;
  texClassInlinePattern?: RegExp;

  mathstyle?: string;
  format?: string;
};

function findEndOfMath(delimiter, text, startIndex: number): number {
  // Adapted from
  // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
  let index = startIndex;
  let braceLevel = 0;

  const delimLength: number = delimiter.length;

  while (index < text.length) {
    const character = text[index];

    if (braceLevel <= 0 && text.slice(index, index + delimLength) === delimiter)
      return index;

    if (character === '\\') index++;
    else if (character === '{') braceLevel++;
    else if (character === '}') braceLevel--;

    index++;
  }

  return -1;
}

function splitAtDelimiters(
  startData: { type: string; data: string }[],
  leftDelim: string,
  rightDelim: string,
  mathstyle: string,
  format: 'latex' | 'ascii-math' = 'latex'
): {
  type: string;
  data: string;
  rawData?: string;
  mathstyle?: string;
}[] {
  const finalData: {
    type: string;
    data: string;
    rawData?: string;
    mathstyle?: string;
  }[] = [];

  for (const startDatum of startData) {
    if (startDatum.type === 'text') {
      const text = startDatum.data;

      let lookingForLeft = true;
      let currIndex = 0;
      let nextIndex: number;

      nextIndex = text.indexOf(leftDelim);
      if (nextIndex !== -1) {
        currIndex = nextIndex;
        if (currIndex > 0) {
          finalData.push({
            type: 'text',
            data: text.slice(0, currIndex),
          });
        }

        lookingForLeft = false;
      }

      let done = false;
      while (!done) {
        if (lookingForLeft) {
          nextIndex = text.indexOf(leftDelim, currIndex);
          if (nextIndex === -1) {
            done = true;
            break;
          }

          if (currIndex !== nextIndex) {
            finalData.push({
              type: 'text',
              data: text.slice(currIndex, nextIndex),
            });
          }

          currIndex = nextIndex;
        } else {
          nextIndex = findEndOfMath(
            rightDelim,
            text,
            currIndex + leftDelim.length
          );
          if (nextIndex === -1) {
            done = true;
            break;
          }
          let formula = text.slice(currIndex + leftDelim.length, nextIndex);
          if (format === 'ascii-math')
            [, formula] = parseMathString(formula, { format: 'ascii-math' });

          finalData.push({
            type: 'math',
            data: formula,
            rawData: text.slice(currIndex, nextIndex + rightDelim.length),
            mathstyle,
          });

          currIndex = nextIndex + rightDelim.length;
        }

        lookingForLeft = !lookingForLeft;
      }

      if (currIndex < text.length) {
        finalData.push({
          type: 'text',
          data: text.slice(currIndex),
        });
      }
    } else finalData.push(startDatum);
  }

  return finalData;
}

function splitWithDelimiters(
  text: string,
  options: StaticRenderOptionsPrivate
): {
  type: string;
  data: string;
  rawData?: string;
  mathstyle?: string;
}[] {
  let data = [{ type: 'text', data: text }];

  // We need to check `display` first because `$$` is a common prefix
  // and `$` would match it first.
  if (options.TeX?.delimiters?.display) {
    options.TeX.delimiters.display.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(data, openDelim, closeDelim, 'displaystyle');
    });
  }

  if (options.TeX?.delimiters?.inline) {
    options.TeX.delimiters.inline.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(data, openDelim, closeDelim, 'textstyle');
    });
  }

  if (options.asciiMath?.delimiters?.inline) {
    options.asciiMath.delimiters.inline.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(
        data,
        openDelim,
        closeDelim,
        'textstyle',
        'ascii-math'
      );
    });
  }

  if (options.asciiMath?.delimiters?.display) {
    options.asciiMath.delimiters.display.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(
        data,
        openDelim,
        closeDelim,
        'displaystyle',
        'ascii-math'
      );
    });
  }
  return data;
}

function createMathMLNode(
  latex: string,
  options: StaticRenderOptionsPrivate
): HTMLElement {
  // Create a node for AT (Assistive Technology, e.g. screen reader) to speak, etc.
  // This node has a style that makes it be invisible to display but is seen by AT
  const span = document.createElement('span');
  span.setAttribute('translate', 'no');
  try {
    const html =
      "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
      options.renderToMathML!(latex) +
      '</math>';
    span.innerHTML = globalThis.MathfieldElement.createHTML(html);
  } catch (error: unknown) {
    console.error(
      `MathLive {{SDK_VERSION}}:  Could not convert "${latex}"' to MathML with ${error}`
    );
    span.textContent = latex;
  }

  span.className = 'ML__sr-only';
  return span;
}

function createMarkupNode(
  text: string,
  options: StaticRenderOptionsPrivate,
  mathstyle: 'displaystyle' | 'textstyle',
  createNodeOnFailure: boolean
): HTMLElement | Text | null {
  // Create a node for displaying math.
  //   This is slightly ugly because in the case of failure to create the markup,
  //   sometimes a text node is desired and sometimes not.
  //   'createTextNodeOnFailure' controls this and null is returned when no node is created.
  // This node is made invisible to AT (screen readers)

  try {
    const html = options.renderToMarkup!(text, {
      mathstyle: mathstyle,
      format: 'html',
    });
    const element = document.createElement('span');
    element.dataset.latex = text;
    element.style.display =
      mathstyle === 'displaystyle' ? 'flex' : 'inline-flex';
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('translate', 'no');
    element.innerHTML = globalThis.MathfieldElement.createHTML(html);
    return element;
  } catch (error: unknown) {
    console.error("Could not parse'" + text + "' with ", error);
    if (createNodeOnFailure) return document.createTextNode(text);
  }

  return null;
}

function createAccessibleMarkupPair(
  latex: string,
  mathstyle: 'displaystyle' | 'textstyle' | '',
  options: StaticRenderOptionsPrivate,
  createNodeOnFailure: boolean
): Node | null {
  // Create a math node (a span with an accessible component and a visual component)
  // If there is an error in parsing the latex, 'createNodeOnFailure' controls whether
  //   'null' is returned or an accessible node with the text used.
  const markupNode = createMarkupNode(
    latex,
    options,
    mathstyle ? mathstyle : 'textstyle',
    createNodeOnFailure
  );
  const accessibleContent = options.renderAccessibleContent ?? '';
  if (markupNode && /\b(mathml|speakable-text)\b/i.test(accessibleContent)) {
    const fragment = document.createElement('span');
    if (/\bmathml\b/i.test(accessibleContent) && options.renderToMathML)
      fragment.append(createMathMLNode(latex, options));

    if (
      /\bspeakable-text\b/i.test(accessibleContent) &&
      options.renderToSpeakableText
    ) {
      const span = document.createElement('span');
      span.setAttribute('translate', 'no');

      const html = options.renderToSpeakableText(latex);
      span.innerHTML = globalThis.MathfieldElement.createHTML(html);
      span.className = 'ML__sr-only';
      fragment.append(span);
    }

    fragment.append(markupNode);
    return fragment;
  }

  return markupNode;
}

function scanText(
  text: string,
  options: StaticRenderOptionsPrivate
): Node | null {
  // If the text starts with '\begin'... (this is a MathJAX behavior)
  let fragment: Node | null = null;
  if (options.TeX?.processEnvironments && /^\s*\\begin/.test(text)) {
    fragment = document.createDocumentFragment();
    const node = createAccessibleMarkupPair(text, '', options, true);
    if (node) fragment.appendChild(node);
  } else {
    if (!text.trim()) return null;
    const data = splitWithDelimiters(text, options);
    if (data.length === 1 && data[0].type === 'text') {
      // This text contains no math. No need to continue processing
      return null;
    }

    fragment = document.createDocumentFragment();

    for (const datum of data) {
      if (datum.type === 'text')
        fragment.appendChild(document.createTextNode(datum.data));
      else {
        const node = createAccessibleMarkupPair(
          datum.data,
          datum.mathstyle === 'textstyle' ? 'textstyle' : 'displaystyle',
          options,
          true
        );
        if (node) fragment.appendChild(node);
      }
    }
  }

  return fragment;
}

function scanElement(
  element: HTMLElement,
  options: StaticRenderOptionsPrivate
): void {
  if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
    // This is a node with textual content only. Perhaps an opportunity
    // to simplify and avoid creating extra nested elements...
    const text = element.childNodes[0].textContent ?? '';
    if (options.TeX?.processEnvironments && /^\s*\\begin/.test(text)) {
      element.textContent = '';
      const node = createAccessibleMarkupPair(text, '', options, true);
      if (node) element.append(node);
      return;
    }

    const data = splitWithDelimiters(text, options);
    if (data.length === 1 && data[0].type === 'math') {
      // The entire content is a math expression: we can replace the content
      // with the latex markup without creating additional wrappers.
      element.textContent = '';
      const node = createAccessibleMarkupPair(
        data[0].data,
        data[0].mathstyle === 'textstyle' ? 'textstyle' : 'displaystyle',
        options,
        true
      );
      if (node) element.append(node);
      return;
    }

    if (data.length === 1 && data[0].type === 'text') {
      // This element only contained text with no math. No need to
      // do anything.
      return;
    }
  }

  // Iterate backward, as we will be replacing childNode with a documentfragment
  // which may insert multiple nodes (one for the accessible markup, one for
  // the formula)
  for (let i = element.childNodes.length - 1; i >= 0; i--) {
    const childNode = element.childNodes[i];
    if (childNode.nodeType === 3) {
      //
      // A text node
      //
      // Look for math mode delimiters inside the text

      let content = childNode.textContent ?? '';

      // Coalesce adjacent text nodes
      while (i > 0 && element.childNodes[i - 1].nodeType === 3) {
        i--;
        content = ((element.childNodes[i] as Text).textContent ?? '') + content;
      }
      content = content.trim();
      if (!content) continue;
      const frag = scanText(content, options);
      if (frag) {
        i += frag.childNodes.length - 1;
        childNode.replaceWith(frag);
      }
    } else if (childNode.nodeType === 1) {
      //
      // An element node
      //
      const el = childNode as HTMLElement;
      const tag = childNode.nodeName.toLowerCase();
      if (tag === 'script') {
        const scriptNode = childNode as HTMLScriptElement;
        let textContent: string | undefined = undefined;
        if (options.processScriptTypePattern?.test(scriptNode.type))
          textContent = scriptNode.textContent ?? '';
        else if (
          options.processMathJSONScriptTypePattern?.test(scriptNode.type)
        ) {
          try {
            textContent = options.serializeToLatex?.(
              JSON.parse(scriptNode.textContent ?? '')
            );
          } catch (e) {
            console.error(e);
          }
        }

        if (textContent) {
          let style: 'displaystyle' | 'textstyle' = 'textstyle';

          for (const l of scriptNode.type.split(';')) {
            const [key, value] = l.toLowerCase().split('=');
            if (key.trim() === 'mode')
              style = value.trim() === 'display' ? 'displaystyle' : 'textstyle';
          }

          const span = createAccessibleMarkupPair(
            textContent,
            style,
            options,
            true
          );
          if (span) scriptNode.parentNode!.replaceChild(span, scriptNode);
        }
      } else {
        if (options.texClassDisplayPattern?.test(el.className)) {
          const formula = el.textContent;
          el.textContent = '';
          const node = createAccessibleMarkupPair(
            formula ?? '',
            'displaystyle',
            options,
            true
          );
          if (node) el.append(node);
          continue;
        }

        if (options.texClassInlinePattern?.test(el.className)) {
          const formula = el.textContent;
          el.textContent = '';
          const node = createAccessibleMarkupPair(
            formula ?? '',
            'textstyle',
            options,
            true
          );
          if (node) element.append(node);
          continue;
        }

        const shouldProcess =
          (options.processClassPattern?.test(el.className) ?? false) ||
          !(
            (options.skipTags?.includes(tag) ?? false) ||
            (options.ignoreClassPattern?.test(el.className) ?? false)
          );

        if (shouldProcess) scanElement(el, options);
      }
    }
    // Otherwise, it's something else, and ignore it.
  }
}

const DEFAULT_AUTO_RENDER_OPTIONS: StaticRenderOptions = {
  // Name of tags whose content will not be scanned for math delimiters
  skipTags: [
    'math-field',
    'noscript',
    'style',
    'textarea',
    'pre',
    'code',
    'annotation',
    'annotation-xml',
  ],

  // <script> tags of the following types will be processed. Others, ignored.
  processScriptType: 'math/tex',

  // <script> tag with this type will be processed as MathJSON
  processMathJSONScriptType: 'math/json',

  // Regex pattern of the class name of elements whose contents should not
  // be processed
  ignoreClass: 'tex2jax_ignore',

  // Regex pattern of the class name of elements whose contents should
  // be processed when they appear inside ones that are ignored.
  processClass: 'tex2jax_process',

  // Indicate the format to use to render accessible content
  renderAccessibleContent: 'mathml',

  asciiMath: {
    delimiters: {
      inline: [
        ['`', '`'], // ASCII Math delimiters
      ],
    },
  },

  TeX: {
    processEnvironments: true,
    delimiters: {
      inline: [['\\(', '\\)']],
      display: [
        ['$$', '$$'],
        ['\\[', '\\]'],
      ],
    },
  },
};

/** @internal */
export function _renderMathInElement(
  element: HTMLElement,
  options?: StaticRenderOptions
): void {
  try {
    const optionsPrivate: StaticRenderOptionsPrivate = {
      ...DEFAULT_AUTO_RENDER_OPTIONS,
      ...options,
    };
    optionsPrivate.ignoreClassPattern = new RegExp(
      optionsPrivate.ignoreClass ?? ''
    );
    optionsPrivate.processClassPattern = new RegExp(
      optionsPrivate.processClass ?? ''
    );
    optionsPrivate.processScriptTypePattern = new RegExp(
      optionsPrivate.processScriptType ?? ''
    );

    optionsPrivate.processMathJSONScriptTypePattern = new RegExp(
      optionsPrivate.processMathJSONScriptType ?? ''
    );

    if (optionsPrivate.TeX?.className?.display) {
      optionsPrivate.texClassDisplayPattern = new RegExp(
        optionsPrivate.TeX.className.display
      );
    }
    if (optionsPrivate.TeX?.className?.inline) {
      optionsPrivate.texClassInlinePattern = new RegExp(
        optionsPrivate.TeX.className.inline
      );
    }

    // Load the fonts and inject the stylesheet once to
    // avoid having to do it many times in the case of a `renderMathInDocument()`
    // call.
    void loadFonts();
    injectStylesheet('core');

    scanElement(element, optionsPrivate);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.error('renderMathInElement(): ' + error.message);
    else {
      console.error(
        'renderMathInElement(): Could not render math for element',
        element
      );
    }
  }
}
