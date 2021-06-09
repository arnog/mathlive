/* eslint-disable no-new */
import type {
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
import {
  AutoRenderOptionsPrivate,
  autoRenderMathInElement,
} from './addons/auto-render';
import MathLiveDebug, {
  asciiMathToLatex,
  latexToAsciiMath,
} from './addons/debug';
import { atomToSpeakableText } from './editor/atom-to-speakable-text';
import { atomsToMathML } from './addons/math-ml';

import './addons/definitions-metadata';

import './editor/virtual-keyboard-commands';
import { RemoteVirtualKeyboard } from './editor-mathfield/remote-virtual-keyboard';
import { Context } from './core/context';
import { DEFAULT_FONT_SIZE } from './core/font-metrics';
import { l10n } from './editor/l10n';
import { typeset } from './core/typeset';
import { getDefaultRegisters } from './core/registers';
import { isBrowser, throwIfNotInBrowser } from './common/capabilities';

export { MathfieldElement } from './public/mathfield-element';

export {
  serialize as serializeMathJson,
  parse as parseMathJson,
} from '@cortex-js/math-json'; // version as mathJsonVersion,
export type {
  LatexDictionary,
  LatexDictionaryEntry,
  LatexString,
  LatexToken,
  NumberFormattingOptions,
  ParseLatexOptions,
  ParserFunction,
  SerializeLatexOptions,
  SerializerFunction,
} from '@cortex-js/math-json/dist/types/latex-syntax/public';

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
    colorMap?: (name: string) => string | undefined;
    backgroundColorMap?: (name: string) => string | undefined;
    onError?: ErrorListener<ParserErrorCode>;
    format?: string;
  }
): string {
  options = options ?? {};
  options.mathstyle = options.mathstyle ?? 'displaystyle';
  let letterShapeStyle = options.letterShapeStyle ?? 'auto';
  if (letterShapeStyle === 'auto') {
    letterShapeStyle = l10n.locale!.startsWith('fr') ? 'french' : 'tex';
  }
  options.macros = getMacros(options?.macros);

  //
  // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
  //

  const root = new Atom('root', { mode: 'math' });
  root.body = typeset(
    parseLatex(text, {
      parseMode: 'math',
      macros: options.macros,
      registers: options.registers,
      mathstyle: options.mathstyle,
      onError: options.onError,
      colorMap: options.colorMap,
      backgroundColorMap: options.backgroundColorMap,
    }),
    { registers: options.registers }
  );

  //
  // 2. Transform the math atoms into elementary boxes
  // for example from genfrac to VBox.
  //
  const box = root.render(
    new Context(
      {
        macros: options.macros,
        registers: getDefaultRegisters(),
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

  if (!box) return '';

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
    colorMap?: (name: string) => string | undefined;
    backgroundColorMap?: (name: string) => string | undefined;
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

export function convertLatexToSpeakableText(
  latex: string,
  options: Partial<
    TextToSpeechOptions & {
      macros?: MacroDictionary;
      registers?: Registers;
      colorMap?: (name: string) => string | undefined;
      backgroundColorMap?: (name: string) => string | undefined;
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

export function renderMathInDocument(options?: AutoRenderOptionsPrivate): void {
  throwIfNotInBrowser();
  renderMathInElement(document.body, options);
}

function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === 'string' && isBrowser()) {
    const result = document.getElementById(element);
    if (result === null) {
      throw new Error(`The element with ID "${element}" could not be found.`);
    }

    return result;
  }

  return typeof element === 'string' ? null : element;
}

export function renderMathInElement(
  element: HTMLElement,
  options?: AutoRenderOptionsPrivate
): void {
  const el = getElement(element);
  if (!el) return;
  options = options ?? {};
  options.renderToMarkup = options.renderToMarkup ?? convertLatexToMarkup;
  options.renderToMathML = options.renderToMathML ?? convertLatexToMathMl;
  options.renderToSpeakableText =
    options.renderToSpeakableText ?? convertLatexToSpeakableText;
  autoRenderMathInElement(el, options);
}

// This SDK_VERSION variable will be replaced during the build process.
export const version = {
  mathlive: '{{SDK_VERSION}}',
  mathJson: '', // mathJsonVersion,
};

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
