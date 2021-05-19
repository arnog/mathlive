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
  MacroDictionary,
  Registers,
} from './public/core';

import { Atom } from './core/atom-class';
import { parseLatex } from './core/parser';
import { adjustInterAtomSpacing, coalesce, makeStruts, Box } from './core/box';
import { getMacros } from './core-definitions/definitions';
import { MathfieldPrivate } from './editor-mathfield/mathfield-private';
import {
  AutoRenderOptionsPrivate,
  autoRenderMathInElement,
} from './addons/auto-render';
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
import { Context } from './core/context';
import { DEFAULT_FONT_SIZE } from './core/font-metrics';
import { l10n } from './editor/l10n';

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

export function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    registers?: Registers;
    colorMap?: (name: string) => string;
    backgroundColorMap?: (name: string) => string;
    onError?: ErrorListener<ParserErrorCode>;
    format?: string;
  }
): string {
  options = options ?? {};
  options.mathstyle = options.mathstyle ?? 'displaystyle';
  let letterShapeStyle = options.letterShapeStyle ?? 'auto';
  if (letterShapeStyle === 'auto') {
    letterShapeStyle = l10n.locale.startsWith('fr') ? 'french' : 'tex';
  }
  options.macros = getMacros(options?.macros);

  //
  // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
  //

  const root = new Atom('root', { mode: 'math' });
  root.body = parseLatex(text, {
    parseMode: 'math',
    macros: options.macros,
    registers: options.registers,
    mathstyle: options.mathstyle,
    onError: options.onError,
    colorMap: options.colorMap,
    backgroundColorMap: options.backgroundColorMap,
  });

  //
  // 2. Transform the math atoms into elementary boxes
  // for example from genfrac to VBox.
  //
  const box = root.render(
    new Context(
      {
        macros: options.macros,
        smartFence: false,
        renderPlaceholder: () => new Box(0xa0, { maxFontSize: 1.0 }),
      },
      {
        fontSize: DEFAULT_FONT_SIZE,
        letterShapeStyle: letterShapeStyle,
      },
      options.mathstyle
    )
  );

  //
  // 3. Adjust to `mord` according to TeX spacing rules
  //
  adjustInterAtomSpacing(box);

  //
  // 2. Simplify by coalescing adjacent boxes
  //    for example, from <span>1</span><span>2</span>
  //    to <span>12</span>
  //
  coalesce(box);

  //
  // 4. Wrap the expression with struts
  //
  const wrapper = makeStruts(box, { classes: 'ML__mathlive' });

  //
  // 5. Generate markup
  //

  return wrapper.toMarkup();
}

export function convertLatexToMathMl(
  latex: string,
  options: Partial<{
    macros: MacroDictionary;
    registers?: Registers;
    colorMap?: (name: string) => string;
    backgroundColorMap?: (name: string) => string;
    onError: ErrorListener<ParserErrorCode>;
    generateID: boolean;
  }> = {}
): string {
  options.macros = getMacros(options?.macros);

  return atomsToMathML(
    parseLatex(latex, {
      parseMode: 'math',
      args: () => '',
      macros: options.macros,
      registers: options.registers,
      mathstyle: 'displaystyle',
      onError: options.onError,
      colorMap: options.colorMap,
      backgroundColorMap: options.backgroundColorMap,
    }),
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
  options.macros = getMacros(options?.macros);

  return atomtoMathJson(
    parseLatex(latex, {
      parseMode: 'math',
      macros: options.macros,
      onError: options.onError,
    }),
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
      registers?: Registers;
      colorMap?: (name: string) => string;
      backgroundColorMap?: (name: string) => string;
      onError?: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
    }
  > = {}
): string {
  options.macros = getMacros(options?.macros);

  const atoms = parseLatex(latex, {
    parseMode: 'math',
    macros: options.macros,
    registers: options.registers,
    mathstyle: 'displaystyle',
    onError: options.onError,
    colorMap: options.colorMap,
    backgroundColorMap: options.backgroundColorMap,
  });

  return atomToSpeakableText(atoms, options as Required<TextToSpeechOptions>);
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
  options?: AutoRenderOptionsPrivate
): void {
  options = options ?? {};
  options.renderToMarkup = options.renderToMarkup ?? convertLatexToMarkup;
  options.renderToMathML = options.renderToMathML ?? convertLatexToMathMl;
  options.renderToSpeakableText =
    options.renderToSpeakableText ?? convertLatexToSpeakableText;
  autoRenderMathInElement(getElement(element), options);
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
export const version = '{{SDK_VERSION}}';

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
  latexToAsciiMath,
  asciiMathToLatex,
  FUNCTIONS: MathLiveDebug.FUNCTIONS,
  MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
  TEXT_SYMBOLS: MathLiveDebug.TEXT_SYMBOLS,
  ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
  DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
  getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
  INLINE_SHORTCUTS: MathLiveDebug.INLINE_SHORTCUTS,
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
    return convertLatexToMarkup(text, options);
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
