/* eslint-disable no-new */
import type { Mathfield } from './public/mathfield';
import type {
  MathfieldOptions,
  RemoteVirtualKeyboardOptions,
  TextToSpeechOptions,
} from './public/options';
import type {
  ErrorListener,
  ParserErrorCode,
  MathfieldErrorCode,
} from './public/core';

import { Atom } from './core/atom-class';
import { parseLatex } from './core/parser';
import { coalesce, makeStruts, Span } from './core/span';
import { MACROS, MacroDictionary } from './core-definitions/definitions';
import { MathfieldPrivate } from './editor-mathfield/mathfield-private';
import AutoRender, { AutoRenderOptionsPrivate } from './addons/auto-render';
import {
  MathJsonLatexOptions,
  MathJson,
  atomtoMathJson,
  jsonToLatex,
} from './addons/math-json';
import MathLiveDebug, {
  asciiMathToLatex,
  latexToAsciiMath,
} from './addons/debug';
import { MATHSTYLES } from './core/mathstyle';
import { defaultSpeakHook } from './editor/speech';
import {
  defaultReadAloudHook,
  readAloudStatus,
  pauseReadAloud,
  resumeReadAloud,
  playReadAloud,
} from './editor/speech-read-aloud';
import { atomToSpeakableText } from './editor/atom-to-speakable-text';
import { atomsToMathML } from './addons/math-ml';

import './addons/definitions-metadata';

import './editor/virtual-keyboard-commands';
import { RemoteVirtualKeyboard } from './editor-mathfield/remote-virtual-keyboard';

export { MathfieldElement } from './public/mathfield-element';

export function makeMathField(
  element: HTMLElement,
  options: Partial<MathfieldOptions> = {}
): Mathfield {
  options.speakHook = options.speakHook ?? defaultSpeakHook;
  options.readAloudHook = options.readAloudHook ?? defaultReadAloudHook;
  return new MathfieldPrivate(getElement(element), options);
}

export function makeSharedVirtualKeyboard(
  options: Partial<RemoteVirtualKeyboardOptions>
): void {
  new RemoteVirtualKeyboard(options);
}

/** @deprecated */
function latexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode>;
    format?: string;
  }
): string {
  return convertLatexToMarkup(text, options);
}

export function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode>;
    format?: string;
  }
): string {
  options = options ?? {};
  options.mathstyle = options.mathstyle || 'displaystyle';
  options.letterShapeStyle = options.letterShapeStyle || 'auto';
  options.macros = { ...MACROS, ...(options.macros ?? {}) };

  //
  // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
  //

  const atoms = parseLatex(
    text,
    'math',
    null,
    options.macros,
    false,
    options.onError
  );

  //
  // 2. Transform the math atoms into elementary spans
  //    for example from genfrac to vlist.
  //
  let spans = Atom.render(
    {
      mathstyle: MATHSTYLES[options.mathstyle],
      letterShapeStyle: options.letterShapeStyle,
    },
    atoms
  );

  //
  // 3. Simplify by coalescing adjacent nodes
  //    for example, from <span>1</span><span>2</span>
  //    to <span>12</span>
  //
  spans = coalesce(spans);

  //
  // 4. Wrap the expression with struts
  //
  const wrapper = makeStruts(new Span(spans, 'ML__base'), 'ML__mathlive');

  //
  // 5. Generate markup
  //

  return wrapper.toMarkup({ hscale: 1 });
}

export function convertLatexToMathMl(
  latex: string,
  options: Partial<{
    macros: MacroDictionary;
    onError: ErrorListener<ParserErrorCode>;
    generateID: boolean;
  }> = {}
): string {
  options.macros = { ...MACROS, ...(options.macros ?? {}) };

  return atomsToMathML(
    parseLatex(latex, 'math', [], options.macros, false, options.onError),
    options
  );
}

/** @deprecated */
function latexToMathML(
  latex: string,
  options?: Partial<{
    macros: MacroDictionary;
    onError: ErrorListener<ParserErrorCode>;
    generateID: boolean;
  }>
): string {
  return convertLatexToMathMl(latex, options);
}

/** @deprecated Use MathJSON */
function latexToAST(
  latex: string,
  options?: MathJsonLatexOptions & {
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode | string>;
  }
): MathJson {
  options = options ?? {};
  options.macros = { ...MACROS, ...(options.macros ?? {}) };

  // Return parseLatex(latex, options);

  return atomtoMathJson(
    parseLatex(latex, 'math', null, options.macros, false, options.onError),
    options
  );
}

/** @deprecated Use MathJSON */
export function astToLatex(
  expr: MathJson,
  options: MathJsonLatexOptions
): string {
  return jsonToLatex(
    typeof expr === 'string' ? JSON.parse(expr) : expr,
    options
  );
  // Return emitLatex(expr, options);
}

export function convertLatexToSpeakableText(
  latex: string,
  options: Partial<
    TextToSpeechOptions & {
      macros?: MacroDictionary;
      onError?: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
    }
  > = {}
): string {
  options.macros = options.macros ?? {};
  Object.assign(options.macros, MACROS);

  const mathlist = parseLatex(
    latex,
    'math',
    null,
    options.macros,
    false,
    options.onError
  );

  return atomToSpeakableText(
    mathlist,
    options as Required<TextToSpeechOptions>
  );
}

/** @deprecated */
function latexToSpeakableText(
  latex: string,
  options?: Partial<
    TextToSpeechOptions & {
      macros?: MacroDictionary;
      onError?: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
    }
  >
): string {
  return convertLatexToSpeakableText(latex, options);
}

export function renderMathInDocument(options: AutoRenderOptionsPrivate): void {
  renderMathInElement(document.body, options);
}

function getElement(element: string | HTMLElement): HTMLElement {
  if (typeof element === 'string') {
    const result: HTMLElement = document.getElementById(element);
    if (result === null) {
      throw new Error(`The element with ID "${element}" could not be found.`);
    }

    return result;
  }

  return element;
}

export function renderMathInElement(
  element: HTMLElement,
  options: AutoRenderOptionsPrivate
): void {
  options = options ?? {};
  options.renderToMarkup = options.renderToMarkup ?? convertLatexToMarkup;
  options.renderToMathML = options.renderToMathML ?? convertLatexToMathMl;
  options.renderToSpeakableText =
    options.renderToSpeakableText ?? convertLatexToSpeakableText;
  options.macros = options.macros ?? MACROS;
  AutoRender.renderMathInElement(getElement(element), options);
}

function validateNamespace(options): void {
  if (typeof options.namespace === 'string') {
    if (!/^[a-z]+-?$/.test(options.namespace)) {
      throw new Error(
        'options.namespace must be a string of lowercase characters only'
      );
    }

    if (!options.namespace.endsWith('-')) {
      options.namespace += '-';
    }
  }
}

/** @deprecated */
function revertToOriginalContent(
  element: string | HTMLElement,
  options: AutoRenderOptionsPrivate
): void {
  deprecatedDefaultImport('revertToOriginalContent');
  //  If (element instanceof MathfieldPrivate) {
  //      element.$revertToOriginalContent();
  //    } else {
  // element is a pair: accessible span, math -- set it to the math part
  element = getElement(element).children[1] as HTMLElement;
  options = options ?? {};
  validateNamespace(options);
  const html = element.getAttribute(
    'data-' + (options.namespace ?? '') + 'original-content'
  );
  element.innerHTML =
    typeof options.createHTML === 'function' ? options.createHTML(html) : html;
  //  }
}

/** @deprecated */
function getOriginalContent(
  element: string | HTMLElement,
  options: AutoRenderOptionsPrivate
): string {
  deprecatedDefaultImport('getOriginalContent');
  if (element instanceof MathfieldPrivate) {
    return element.originalContent;
  }

  // Element is a pair: accessible span, math -- set it to the math part
  element = getElement(element).children[1] as HTMLElement;
  options = options ?? {};
  validateNamespace(options);
  return element.getAttribute(
    'data-' + (options.namespace ?? '') + 'original-content'
  );
}

// This SDK_VERSION variable will be replaced during the build process.
const version = '{{SDK_VERSION}}';

function deprecated(method: string, remedy: string) {
  console.warn(`"${method}" is deprecated. 
${remedy ?? ''}`);
}

function deprecatedDefaultImport(method: string) {
  console.warn(`Using "${method}" as a default import is deprecated.
Instead of
    import Mathlive from 'mathlive';
    ${method}(...);
use
   import ${method} from 'mathlive;
   ${method}(...)  
`);
}

export const debug = {
  getStyle: MathLiveDebug.getStyle,
  getType: MathLiveDebug.getType,
  spanToString: MathLiveDebug.spanToString,
  hasClass: MathLiveDebug.hasClass,
  latexToAsciiMath,
  asciiMathToLatex,
  FUNCTIONS: MathLiveDebug.FUNCTIONS,
  MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
  TEXT_SYMBOLS: MathLiveDebug.TEXT_SYMBOLS,
  ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
  MACROS: MathLiveDebug.MACROS,
  DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
  getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
};

export default {
  version: (): string => {
    deprecatedDefaultImport('version');
    return version;
  },
  latexToMarkup: (
    text: string,
    options?: {
      mathstyle?: 'displaystyle' | 'textstyle';
      letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
      macros?: MacroDictionary;
      onError?: ErrorListener<ParserErrorCode>;
      format?: string;
    }
  ): string => {
    deprecatedDefaultImport('latexToMarkup');
    return latexToMarkup(text, options);
  },
  latexToMathML: (
    latex: string,
    options?: Partial<{
      macros: MacroDictionary;
      onError: ErrorListener<ParserErrorCode>;
      generateID: boolean;
    }>
  ): string => {
    deprecatedDefaultImport('latexToMathML');
    return latexToMathML(latex, options);
  },
  latexToSpeakableText: (
    latex: string,
    options: Partial<
      TextToSpeechOptions & {
        macros?: MacroDictionary;
        onError?: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
      }
    >
  ): string => {
    deprecatedDefaultImport('latexToSpeakableText');
    return latexToSpeakableText(latex, options);
  },
  latexToAST: (
    latex: string,
    options?: MathJsonLatexOptions & {
      macros?: MacroDictionary;
      onError?: ErrorListener<ParserErrorCode | string>;
    }
  ): string => {
    deprecated('latexToAST', 'Use MathJSON.');
    return latexToAST(latex, options);
  },
  astToLatex: (expr: MathJson, options: MathJsonLatexOptions): string => {
    deprecated('astToLatex', 'Use MathJSON.');
    return astToLatex(expr, options);
  },
  makeMathField: (
    element: HTMLElement,
    options: Partial<MathfieldOptions>
  ): Mathfield => {
    deprecatedDefaultImport('makeMathField');
    return makeMathField(element, options);
  },
  renderMathInDocument: (options?: AutoRenderOptionsPrivate): void => {
    deprecatedDefaultImport('renderMathInDocument');
    renderMathInDocument(options);
  },
  renderMathInElement: (
    element: HTMLElement,
    options: AutoRenderOptionsPrivate
  ): void => {
    deprecatedDefaultImport('renderMathInElement');
    renderMathInElement(element, options);
  },
  revertToOriginalContent: (
    element: string | HTMLElement,
    options: AutoRenderOptionsPrivate
  ): void => {
    deprecatedDefaultImport('revertToOriginalContent');
    revertToOriginalContent(element, options);
  },
  getOriginalContent: (
    element: string | HTMLElement,
    options: AutoRenderOptionsPrivate
  ): void => {
    deprecatedDefaultImport('getOriginalContent');
    getOriginalContent(element, options);
  },

  readAloud: (
    element: HTMLElement,
    text: string,
    config: Partial<MathfieldOptions>
  ): void => {
    deprecatedDefaultImport('readAloud');
    return defaultReadAloudHook(element, text, config);
  },
  readAloudStatus: (): string => {
    deprecatedDefaultImport('readAloudStatus');
    return readAloudStatus();
  },
  pauseReadAloud: (): void => {
    deprecatedDefaultImport('pauseReadAloud');
    pauseReadAloud();
  },
  resumeReadAloud: (): void => {
    deprecatedDefaultImport('resumeReadAloud');
    resumeReadAloud();
  },
  playReadAloud: (token: string, count: number): void => {
    deprecatedDefaultImport('playReadAloud');
    playReadAloud(token, count);
  },
};
