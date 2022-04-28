/* eslint no-console:0 */
import '../core/atom';
import { MacroDictionary, getMacros } from '../core-definitions/definitions';
import { ErrorListener, ParserErrorCode, Registers } from '../public/core';
import { loadFonts } from '../core/fonts';
import { inject as injectStylesheet } from '../common/stylesheet';
// @ts-ignore-error
import coreStylesheet from '../../css/core.less';
import { parseMathString } from '../editor/parse-math-string';
import { throwIfNotInBrowser } from '../common/capabilities';
import { hashCode } from '../common/hash-code';

export type AutoRenderOptions = {
  /** Namespace that is added to `data-`  attributes to avoid collisions with other libraries.
   *
   * It is empty by default.
   *
   * The namespace should be a string of lowercase letters.
   */
  namespace?: string;

  /**
   * A URL fragment pointing to the directory containing the fonts
   * necessary to render a formula.
   *
   * These fonts are available in the `/dist/fonts` directory of the SDK.
   *
   * Customize this value to reflect where you have copied these fonts,
   * or to use the CDN version.
   *
   * The default value is './fonts'.
   *
   * Changing this setting after the mathfield has been created will have
   * no effect.
   *
   * ```javascript
   * {
   *      // Use the CDN version
   *      fontsDirectory: ''
   * }
   * ```
   * ```javascript
   * {
   *      // Use a directory called 'fonts', located next to the
   *      // `mathlive.js` (or `mathlive.mjs`) file.
   *      fontsDirectory: './fonts'
   * }
   * ```
   * ```javascript
   * {
   *      // Use a directory located at the top your website
   *      fontsDirectory: 'https://example.com/fonts'
   * }
   * ```
   *
   */
  fontsDirectory?: string;

  /**
   * Support for [Trusted Type](https://w3c.github.io/webappsec-trusted-types/dist/spec/).
   *
   * This optional function will be called whenever the DOM is modified
   * by injecting a string of HTML, allowing that string to be sanitized
   * according to a policy defined by the host.
   */
  createHTML?: (html: string) => string; // or TrustedHTML. See https://github.com/microsoft/TypeScript/issues/30024

  /** Custom LaTeX macros */
  macros?: MacroDictionary;

  /** LaTeX global register overrides */
  registers?: Registers;

  /** An array of tag names whose content will
   *  not be scanned for delimiters (unless their class matches the `processClass`
   * pattern below.
   *
   * **Default:** `['math-field', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml']`
   */
  skipTags?: string[];

  /**
   * A string used as a regular expression of class names of elements whose content will not be
   * scanned for delimiter
   *
   * **Default**: `'tex2jax_ignore'`
   */
  ignoreClass?: string;

  /**
   * A string used as a
   * regular expression of class names of elements whose content **will** be
   * scanned for delimiters,  even if their tag name or parent class name would
   * have prevented them from doing so.
   *
   * **Default**: `'tex2jax_process'`
   *
   * */
  processClass?: string;

  /**
   * `<script>` tags of the
   * indicated type will be processed while others will be ignored.
   *
   * **Default**: `'math/tex'`
   */
  processScriptType?: string;

  /** The format(s) in
   * which to render the math for screen readers:
   * - `'mathml'` MathML
   * - `'speakable-text'` Spoken representation
   *
   * You can pass an empty string to turn off the rendering of accessible content.
   * You can pass multiple values separated by spaces, e.g `'mathml speakable-text'`
   *
   * **Default**: `'mathml'`
   */
  renderAccessibleContent?: string;

  /**
   * If true, generate markup that can
   * be read aloud later using {@linkcode speak}
   *
   * **Default**: `false`
   */
  readAloud?: boolean;

  asciiMath?: {
    delimiters?: {
      display?: [openDelim: string, closeDelim: string][];
      inline?: [openDelim: string, closeDelim: string][];
    };
  };

  TeX?: {
    /**
     * If true, math expression that start with `\begin{` will automatically be
     * rendered.
     *
     * **Default**: true.
     */

    processEnvironments?: boolean;

    /**
     * Delimiter pairs that will trigger a render of the content in
     * display style or inline, respectively.
     *
     * **Default**: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`
     *
     */
    delimiters?: {
      display: [openDelim: string, closeDelim: string][];
      inline: [openDelim: string, closeDelim: string][];
    };
  };
};

/** @internal */
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
      registers?: Registers;
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
      registers?: Registers;
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
      registers?: Registers;
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
          if (format === 'ascii-math') {
            [, formula] = parseMathString(formula, { format: 'ascii-math' });
          }
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
    } else {
      finalData.push(startDatum);
    }
  }

  return finalData;
}

function splitWithDelimiters(
  text: string,
  texDelimiters?: {
    display?: [openDelim: string, closeDelim: string][];
    inline?: [openDelim: string, closeDelim: string][];
  },
  mathAsciiDelimiters?: {
    display?: [openDelim: string, closeDelim: string][];
    inline?: [openDelim: string, closeDelim: string][];
  }
): {
  type: string;
  data: string;
  rawData?: string;
  mathstyle?: string;
}[] {
  let data = [{ type: 'text', data: text }];
  if (texDelimiters?.inline) {
    texDelimiters.inline.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(data, openDelim, closeDelim, 'textstyle');
    });
  }

  if (texDelimiters?.display) {
    texDelimiters.display.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(data, openDelim, closeDelim, 'displaystyle');
    });
  }

  if (mathAsciiDelimiters?.inline) {
    mathAsciiDelimiters.inline.forEach(([openDelim, closeDelim]) => {
      data = splitAtDelimiters(
        data,
        openDelim,
        closeDelim,
        'textstyle',
        'ascii-math'
      );
    });
  }

  if (mathAsciiDelimiters?.display) {
    mathAsciiDelimiters.display.forEach(([openDelim, closeDelim]) => {
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
  options: AutoRenderOptionsPrivate
): HTMLElement {
  throwIfNotInBrowser();

  // Create a node for AT (Assistive Technology, e.g. screen reader) to speak, etc.
  // This node has a style that makes it be invisible to display but is seen by AT
  const span = document.createElement('span');
  try {
    const html =
      "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
      options.renderToMathML!(latex, options) +
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
): HTMLSpanElement | Text | null {
  throwIfNotInBrowser();

  // Create a node for displaying math.
  //   This is slightly ugly because in the case of failure to create the markup,
  //   sometimes a text node is desired and sometimes not.
  //   'createTextNodeOnFailure' controls this and null is returned when no node is created.
  // This node is made invisible to AT (screen readers)
  const element = document.createElement(
    mathstyle === 'displaystyle' ? 'div' : 'span'
  );
  element.setAttribute('aria-hidden', 'true');

  try {
    const html = options.renderToMarkup!(text, {
      mathstyle: mathstyle ?? 'displaystyle',
      format: 'html',
      macros: options.macros,
    });
    element.innerHTML = options.createHTML ? options.createHTML(html) : html;
  } catch (error: unknown) {
    console.error("Could not parse'" + text + "' with ", error);
    if (createNodeOnFailure) {
      return document.createTextNode(text);
    }
    return null;
  }

  return element;
}

function createAccessibleMarkupPair(
  latex: string,
  mathstyle: 'displaystyle' | 'textstyle' | string,
  options: AutoRenderOptionsPrivate,
  createNodeOnFailure: boolean
): Node | null {
  // Create a math node (a span with an accessible component and a visual component)
  // If there is an error in parsing the latex, 'createNodeOnFailure' controls whether
  //   'null' is returned or an accessible node with the text used.
  const markupNode = createMarkupNode(
    latex,
    options,
    mathstyle as 'displaystyle' | 'textstyle',
    createNodeOnFailure
  );
  const accessibleContent = options.renderAccessibleContent ?? '';
  if (markupNode && /\b(mathml|speakable-text)\b/i.test(accessibleContent)) {
    throwIfNotInBrowser();
    const fragment = document.createElement('span');
    if (/\bmathml\b/i.test(accessibleContent) && options.renderToMathML) {
      fragment.append(createMathMLNode(latex, options));
    }

    if (
      /\bspeakable-text\b/i.test(accessibleContent) &&
      options.renderToSpeakableText
    ) {
      const span = document.createElement('span');
      const html = options.renderToSpeakableText(latex, options);
      span.innerHTML = options.createHTML ? options.createHTML(html) : html;
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
  options: AutoRenderOptionsPrivate
): Node | null {
  throwIfNotInBrowser();

  // If the text starts with '\begin'... (this is a MathJAX behavior)
  let fragment: Node | null = null;
  if (options.TeX?.processEnvironments && /^\s*\\begin/.test(text)) {
    fragment = document.createDocumentFragment();
    const node = createAccessibleMarkupPair(text, '', options, true);
    if (node) fragment.appendChild(node);
  } else {
    if (!text.trim()) return null;
    const data = splitWithDelimiters(
      text,
      options.TeX?.delimiters,
      options.asciiMath?.delimiters
    );
    if (data.length === 1 && data[0].type === 'text') {
      // This text contains no math. No need to continue processing
      return null;
    }

    fragment = document.createDocumentFragment();

    for (const datum of data) {
      if (datum.type === 'text') {
        fragment.appendChild(document.createTextNode(datum.data));
      } else {
        const node = createAccessibleMarkupPair(
          datum.data,
          datum.mathstyle ?? '',
          options,
          true
        );
        if (node) fragment.appendChild(node);
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
    if (options.TeX?.processEnvironments && /^\s*\\begin/.test(text)) {
      element.textContent = '';
      element.append(createAccessibleMarkupPair(text, '', options, true));
      return;
    }

    const data = splitWithDelimiters(
      text,
      options.TeX?.delimiters,
      options.asciiMath?.delimiters
    );
    if (data.length === 1 && data[0].type === 'math') {
      // The entire content is a math expression: we can replace the content
      // with the latex markup without creating additional wrappers.
      element.textContent = '';
      element.append(
        createAccessibleMarkupPair(
          data[0].data,
          data[0].mathstyle ?? '',
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

  // Iterate backward, as we will be replacing childNode with a documentfragment
  // which may insert multiple nodes (one for the accessible markup, one for
  // the formula)
  for (let i = element.childNodes.length - 1; i >= 0; i--) {
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
        options.processScriptTypePattern?.test(childNode.type)
      ) {
        let style = 'displaystyle';
        for (const l of childNode.type.split(';')) {
          const v: string[] = l.split('=');
          if (v[0].toLowerCase() === 'mode') {
            style =
              v[1].toLowerCase() === 'display' ? 'displaystyle' : 'textstyle';
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
          (options.processClassPattern?.test(childNode.className) ?? false) ||
          !(
            (options.skipTags?.includes(tag) ?? false) ||
            (options.ignoreClassPattern?.test(childNode.className) ?? false)
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

const DEFAULT_AUTO_RENDER_OPTIONS: AutoRenderOptions = {
  // Optional namespace for the `data-` attributes.
  namespace: '',

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
      display: [
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
export function autoRenderMathInElement(
  element: HTMLElement | string,
  options?: AutoRenderOptions
): void {
  try {
    const optionsPrivate: AutoRenderOptionsPrivate = {
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
    optionsPrivate.macros = getMacros(optionsPrivate.macros);

    // Validate the namespace (used for `data-` attributes)
    if (optionsPrivate.namespace) {
      if (!/^[a-z]+-?$/.test(optionsPrivate.namespace)) {
        throw new Error(
          'options.namespace must be a string of lowercase characters only'
        );
      }

      if (!optionsPrivate.namespace.endsWith('-')) {
        optionsPrivate.namespace += '-';
      }
    }

    // Load the fonts and inject the stylesheet once to
    // avoid having to do it many times in the case of a `renderMathInDocument()`
    // call.
    void loadFonts(optionsPrivate.fontsDirectory);
    injectStylesheet(
      null,
      coreStylesheet,
      hashCode(coreStylesheet).toString(36)
    );

    scanElement(element, optionsPrivate);
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
