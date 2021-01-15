/* eslint no-console:0 */
import '../core/atom';
import { MACROS, MacroDictionary } from '../core-definitions/definitions';
import { AutoRenderOptions } from '../public/mathlive';
import { ErrorListener, ParserErrorCode } from '../public/core';
import { loadFonts } from '../core/fonts';
import { inject as injectStylesheet } from '../common/stylesheet';
// @ts-ignore-error
import coreStylesheet from '../../css/core.less';

export type AutoRenderOptionsPrivate = AutoRenderOptions & {
  /** A function that will convert any LaTeX found to
   * HTML markup. This is only useful to override the default MathLive renderer
   */
  renderToMarkup?: (
    text: string,
    options: {
      mathstyle?: 'displaystyle' | 'textstyle';
      letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
      macros?: MacroDictionary;
      onError?: ErrorListener<ParserErrorCode>;
      format?: string;
    }
  ) => string;

  /**
   * A function that will convert any LaTeX found to
   * MathML markup.
   */
  renderToMathML?: (
    text: string,
    options: {
      mathstyle?: string;
      format?: string;
      macros?: MacroDictionary;
    }
  ) => string;

  /** A function that will convert any LaTeX found to
   * speakable text markup. */
  renderToSpeakableText?: (
    text: string,
    options: {
      mathstyle?: string;
      format?: string;
      macros?: MacroDictionary;
    }
  ) => string;
  ignoreClassPattern?: RegExp;
  processClassPattern?: RegExp;
  processScriptTypePattern?: RegExp;

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

    if (
      braceLevel <= 0 &&
      text.slice(index, index + delimLength) === delimiter
    ) {
      return index;
    }

    if (character === '\\') {
      index++;
    } else if (character === '{') {
      braceLevel++;
    } else if (character === '}') {
      braceLevel--;
    }

    index++;
  }

  return -1;
}

function splitAtDelimiters(
  startData,
  leftDelim: string,
  rightDelim: string,
  mathstyle
): {
  type: string;
  data: string;
  rawData?: string;
  mathstyle?: string;
}[] {
  const finalData = [];

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

          finalData.push({
            type: 'math',
            data: text.slice(currIndex + leftDelim.length, nextIndex),
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
    } else {
      finalData.push(startDatum);
    }
  }

  return finalData;
}

function splitWithDelimiters(
  text: string,
  delimiters: {
    display: [openDelim: string, closeDelim: string][];
    inline: [openDelim: string, closeDelim: string][];
  }
): {
  type: string;
  data: string;
  rawData?: string;
  mathstyle?: string;
}[] {
  let data = [{ type: 'text', data: text }];
  if (delimiters.inline) {
    delimiters.inline.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(data, openDelim, closeDelim, 'textstyle');
    });
  }

  if (delimiters.display) {
    delimiters.display.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(data, openDelim, closeDelim, 'displaystyle');
    });
  }
  return data;
}

function createMathMLNode(
  latex: string,
  options: AutoRenderOptionsPrivate
): HTMLElement {
  // Create a node for AT (Assistive Technology, e.g. screen reader) to speak, etc.
  // This node has a style that makes it be invisible to display but is seen by AT
  const span = document.createElement('span');
  try {
    const html =
      "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
      options.renderToMathML(latex, options) +
      '</math>';
    span.innerHTML = options.createHTML ? options.createHTML(html) : html;
  } catch (error: unknown) {
    console.error("Could not convert '" + latex + "' to MathML with ", error);
    span.textContent = latex;
  }

  span.className = 'ML__sr-only';
  return span;
}

function createMarkupNode(
  text: string,
  options: AutoRenderOptionsPrivate,
  mathstyle: 'displaystyle' | 'textstyle',
  createNodeOnFailure: boolean
): HTMLSpanElement | Text {
  // Create a node for displaying math.
  //   This is slightly ugly because in the case of failure to create the markup,
  //   sometimes a text node is desired and sometimes not.
  //   'createTextNodeOnFailure' controls this and null is returned when no node is created.
  // This node is made invisible to AT (screen readers)
  let span: HTMLSpanElement | Text = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  if (options.preserveOriginalContent) {
    span.setAttribute('data-' + options.namespace + 'original-content', text);
    if (mathstyle) {
      span.setAttribute(
        'data-' + options.namespace + 'original-mathstyle',
        mathstyle
      );
    }
  }

  try {
    void loadFonts(options.fontsDirectory);
    injectStylesheet(null, coreStylesheet);
    const html = options.renderToMarkup(text, {
      mathstyle: mathstyle ?? 'displaystyle',
      format: 'html',
      macros: options.macros,
    });
    span.innerHTML = options.createHTML ? options.createHTML(html) : html;
  } catch (error: unknown) {
    console.error("Could not parse'" + text + "' with ", error);
    if (createNodeOnFailure) {
      span = document.createTextNode(text);
    } else {
      return null;
    }
  }

  return span;
}

function createAccessibleMarkupPair(
  text: string,
  mathstyle: 'displaystyle' | 'textstyle' | string,
  options: AutoRenderOptionsPrivate,
  createNodeOnFailure: boolean
): Node {
  // Create a math node (a span with an accessible component and a visual component)
  // If there is an error in parsing the latex, 'createNodeOnFailure' controls whether
  //   'null' is returned or an accessible node with the text used.
  const markupNode = createMarkupNode(
    text,
    options,
    mathstyle as 'displaystyle' | 'textstyle',
    createNodeOnFailure
  );

  if (
    markupNode &&
    /\b(mathml|speakable-text)\b/i.test(options.renderAccessibleContent)
  ) {
    const fragment = document.createDocumentFragment();
    if (
      /\bmathml\b/i.test(options.renderAccessibleContent) &&
      options.renderToMathML
    ) {
      fragment.append(createMathMLNode(text, options));
    }

    if (
      /\bspeakable-text\b/i.test(options.renderAccessibleContent) &&
      options.renderToSpeakableText
    ) {
      const span = document.createElement('span');
      const html = options.renderToSpeakableText(text, options);
      span.innerHTML = options.createHTML ? options.createHTML(html) : html;
      span.className = 'ML__sr-only';
      fragment.append(span);
    }

    fragment.append(markupNode);
    return fragment;
  }

  return markupNode;
}

function scanText(text: string, options: AutoRenderOptionsPrivate): Node {
  // If the text starts with '\begin'...
  // (this is a MathJAX behavior)
  let fragment: Node = null;
  if (options.TeX.processEnvironments && /^\s*\\begin/.test(text)) {
    fragment = document.createDocumentFragment();
    fragment.appendChild(
      createAccessibleMarkupPair(text, undefined, options, true)
    );
  } else {
    if (!text.trim()) return null;
    const data = splitWithDelimiters(text, options.TeX.delimiters);
    if (data.length === 1 && data[0].type === 'text') {
      // This text contains no math. No need to continue processing
      return null;
    }

    fragment = document.createDocumentFragment();

    for (const datum of data) {
      if (datum.type === 'text') {
        fragment.appendChild(document.createTextNode(datum.data));
      } else {
        fragment.appendChild(
          createAccessibleMarkupPair(datum.data, datum.mathstyle, options, true)
        );
      }
    }
  }

  return fragment;
}

function scanElement(element, options: AutoRenderOptionsPrivate): void {
  const originalContent = element.getAttribute(
    'data-' + options.namespace + 'original-content'
  );
  if (originalContent) {
    const mathstyle = element.getAttribute(
      'data-' + options.namespace + 'mathstyle'
    );
    const span = createAccessibleMarkupPair(
      originalContent,
      mathstyle,
      options,
      false
    );
    if (span !== null) {
      element.textContent = '';
      element.append(span);
    }

    return;
  }

  if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
    // This is a node with textual content only. Perhaps an opportunity
    // to simplify and avoid creating extra nested elements...
    const text = element.childNodes[0].textContent;
    if (options.TeX.processEnvironments && /^\s*\\begin/.test(text)) {
      element.textContent = '';
      element.append(
        createAccessibleMarkupPair(text, undefined, options, true)
      );
      return;
    }

    const data = splitWithDelimiters(text, options.TeX.delimiters);
    if (data.length === 1 && data[0].type === 'math') {
      // The entire content is a math expression: we can replace the content
      // with the latex markup without creating additional wrappers.
      element.textContent = '';
      element.append(
        createAccessibleMarkupPair(
          data[0].data,
          data[0].mathstyle,
          options,
          true
        )
      );
      return;
    }

    if (data.length === 1 && data[0].type === 'text') {
      // This element only contained text with no math. No need to
      // do anything.
      return;
    }
  }

  for (let i = 0; i < element.childNodes.length; i++) {
    const childNode = element.childNodes[i];
    if (childNode.nodeType === 3) {
      // A text node
      // Look for math mode delimiters inside the text
      const frag = scanText(childNode.textContent, options);
      if (frag) {
        i += frag.childNodes.length - 1;
        childNode.replaceWith(frag);
      }
    } else if (childNode.nodeType === 1) {
      // An element node
      const tag = childNode.nodeName.toLowerCase();
      if (
        tag === 'script' &&
        options.processScriptTypePattern.test(childNode.type)
      ) {
        let style = 'displaystyle';
        for (const l of childNode.type.split(';')) {
          const v = l.split('=');
          if (v[0].toLowerCase() === 'mode') {
            style =
              v[1].toLoweCase() === 'display' ? 'displaystyle' : 'textstyle';
          }
        }

        const span = createAccessibleMarkupPair(
          childNode.textContent,
          style,
          options,
          true
        );
        childNode.parentNode.replaceChild(span, childNode);
      } else if (tag !== 'script') {
        // Element node
        // console.assert(childNode.className !== 'formula');
        const shouldRender =
          options.processClassPattern.test(childNode.className) ||
          !(
            options.skipTags.includes(tag) ||
            options.ignoreClassPattern.test(childNode.className)
          );

        if (shouldRender) {
          if (
            element.childNodes.length === 1 &&
            element.childNodes[0].nodeType === 3
          ) {
            const formula = element.textContent;
            element.textContent = '';
            element.append(
              createAccessibleMarkupPair(formula, 'displaystyle', options, true)
            );
          } else {
            scanElement(childNode, options);
          }
        }
      }
    }
    // Otherwise, it's something else, and ignore it.
  }
}

const defaultOptions: AutoRenderOptions = {
  // Optional namespace for the `data-` attributes.
  namespace: '',

  // Name of tags whose content will not be scanned for math delimiters
  skipTags: [
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

  // Regex pattern of the class name of elements whose contents should not
  // be processed
  ignoreClass: 'tex2jax_ignore',

  // Regex pattern of the class name of elements whose contents should
  // be processed when they appear inside ones that are ignored.
  processClass: 'tex2jax_process',

  // Indicate whether to preserve or discard the original content of the
  // elements being rendered in a 'data-original-content' attribute.
  preserveOriginalContent: true,

  // Indicate the format to use to render accessible content
  renderAccessibleContent: 'mathml',

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

function renderMathInElement(
  element: HTMLElement | string,
  options: AutoRenderOptionsPrivate
): void {
  try {
    options = { ...defaultOptions, ...options };
    options.ignoreClassPattern = new RegExp(options.ignoreClass);
    options.processClassPattern = new RegExp(options.processClass);
    options.processScriptTypePattern = new RegExp(options.processScriptType);
    options.macros = MACROS;

    // Validate the namespace (used for `data-` attributes)
    if (options.namespace) {
      if (!/^[a-z]+-?$/.test(options.namespace)) {
        throw new Error(
          'options.namespace must be a string of lowercase characters only'
        );
      }

      if (!options.namespace.endsWith('-')) {
        options.namespace += '-';
      }
    }

    scanElement(element, options);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('renderMathInElement(): ' + error.message);
    } else {
      console.error(
        'renderMathInElement(): Could not render math for element',
        element
      );
    }
  }
}

export default {
  renderMathInElement,
};
