/* eslint-disable no-new */
import { Atom } from './atom';
import { joinLatex, latexCommand } from './tokenizer';
import { getPropertyRuns, Mode } from './modes-utils';
import type { Box } from './box';
import type { Style, Variant, VariantStyle } from '../public/core-types';
import { mathVariantToUnicode } from './unicode';
import type { TokenDefinition } from 'latex-commands/types';
import type { FontName, ToLatexOptions } from './types';

// Each entry indicate the font-name (to be used to calculate font metrics)
// and the CSS classes (for proper markup styling) for each possible
// variant combinations.
const VARIANTS: Record<string, [fontName: FontName, cssClass: string]> = {
  // Handle some special characters which are only available in "main" font (not "math")
  'main': ['Main-Regular', 'ML__cmr'],
  'main-italic': ['Main-Italic', 'ML__cmr ML__it'],
  'main-bold': ['Main-Bold', 'ML__cmr ML__bold'],
  'main-bolditalic': ['Main-BoldItalic', 'ML__cmr ML__bold ML__it'],

  'normal': ['Main-Regular', 'ML__cmr'], // 'main' font. There is no 'math' regular (upright)
  'normal-bold': ['Main-Bold', 'ML__mathbf'], // 'main' font. There is no 'math' bold
  'normal-italic': ['Math-Italic', 'ML__mathit'], // Special metrics for 'math'
  'normal-bolditalic': ['Math-BoldItalic', 'ML__mathbfit'], // Special metrics for 'math'

  // Extended math symbols, arrows, etc.. at their standard Unicode codepoints
  'ams': ['AMS-Regular', 'ML__ams'],
  'ams-bold': ['AMS-Regular', 'ML__ams'],
  'ams-italic': ['AMS-Regular', 'ML__ams'],
  'ams-bolditalic': ['AMS-Regular', 'ML__ams'],

  'sans-serif': ['SansSerif-Regular', 'ML__sans'],
  'sans-serif-bold': ['SansSerif-Regular', 'ML__sans ML__bold'],
  'sans-serif-italic': ['SansSerif-Regular', 'ML__sans'],
  'sans-serif-bolditalic': ['SansSerif-Regular', 'ML__sans'],

  'calligraphic': ['Caligraphic-Regular', 'ML__cal'],
  'calligraphic-bold': ['Caligraphic-Regular', 'ML__cal ML__bold'],
  'calligraphic-italic': ['Caligraphic-Regular', 'ML__cal ML__it'],
  'calligraphic-bolditalic': ['Caligraphic-Regular', 'ML__cal ML__bold ML__it'],

  'script': ['Script-Regular', 'ML__script'],
  'script-bold': ['Script-Regular', 'ML__script ML__bold'],
  'script-italic': ['Script-Regular', 'ML__script ML__it'],
  'script-bolditalic': ['Script-Regular', 'ML__script ML__bold ML__it'],

  'fraktur': ['Fraktur-Regular', 'ML__frak'],
  'fraktur-bold': ['Fraktur-Regular', 'ML__frak'],
  'fraktur-italic': ['Fraktur-Regular', 'ML__frak'],
  'fraktur-bolditalic': ['Fraktur-Regular', 'ML__frak'],

  'monospace': ['Typewriter-Regular', 'ML__tt'],
  'monospace-bold': ['Typewriter-Regular', 'ML__tt ML__bold'],
  'monospace-italic': ['Typewriter-Regular', 'ML__tt ML__it'],
  'monospace-bolditalic': ['Typewriter-Regular', 'ML__tt ML__bold ML__it'],

  // Blackboard characters are 'A-Z' in the AMS font
  'double-struck': ['AMS-Regular', 'ML__bb'],
  'double-struck-bold': ['AMS-Regular', 'ML__bb'],
  'double-struck-italic': ['AMS-Regular', 'ML__bb'],
  'double-struck-bolditalic': ['AMS-Regular', 'ML__bb'],
};

export const VARIANT_REPERTOIRE = {
  'double-struck': /^[A-Z ]$/,
  'script': /^[A-Z ]$/,
  'calligraphic': /^[\dA-Z ]$/,
  'fraktur': /^[\dA-Za-z ]$|^[!"#$%&'()*+,\-./:;=?[]^’‘]$/,
  'monospace':
    /^[\dA-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A8\u03A9]$/,
  'sans-serif':
    /^[\dA-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A8\u03A9]$/,
};

const GREEK_LOWERCASE = /^[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5]$/;
const GREEK_UPPERCASE =
  /^[\u0393|\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A6\u03A8\u03A9]$/;

const LETTER_SHAPE_RANGES = [
  /^[a-z]$/, // Lowercase latin
  /^[A-Z]$/, // Uppercase latin
  GREEK_LOWERCASE,
  GREEK_UPPERCASE,
];

// The letterShapeStyle property indicates which characters should be
// automatically italicized (see LETTER_SHAPE_RANGES)
const LETTER_SHAPE_MODIFIER = {
  iso: ['it', 'it', 'it', 'it'],
  tex: ['it', 'it', 'it', 'up'],
  french: ['it', 'up', 'up', 'up'],
  upright: ['up', 'up', 'up', 'up'],
};

// See http://ctan.math.illinois.edu/macros/latex/base/fntguide.pdf

export class MathMode extends Mode {
  constructor() {
    super('math');
  }

  createAtom(command: string, info: TokenDefinition, style?: Style): Atom {
    if (info === null) {
      return new Atom({
        type: 'mord',
        mode: 'math',
        command,
        value: command,
        style,
      });
    }

    const isFunction =
      globalThis.MathfieldElement?.isFunction(info.command ?? command) ?? false;

    if (info.definitionType === 'symbol') {
      const result = new Atom({
        type: info.type ?? 'mord',
        mode: 'math',
        command: info.command ?? command,
        value: String.fromCodePoint(info.codepoint),
        style,
      });
      if (isFunction) result.isFunction = true;

      if (command.startsWith('\\')) result.verbatimLatex = command;
      return result;
    }
    const result = new Atom({
      type: 'mord',
      mode: 'math',
      command: info.command ?? command,
      value: command,
      style,
    });
    if (isFunction) result.isFunction = true;
    if (command.startsWith('\\')) result.verbatimLatex = command;

    return result;
  }

  serialize(run: Atom[], options: ToLatexOptions): string[] {
    const result = emitVariantRun(run, { ...options, defaultMode: 'math' });
    if (result.length === 0 || options.defaultMode !== 'text') return result;
    return ['$ ', ...result, ' $'];
  }

  getFont(
    box: Box,
    style: {
      // For math mode
      fontFamily: string;
      letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright';
      variant: Variant;
      variantStyle?: VariantStyle;
    }
  ): FontName | null {
    console.assert(style.variant !== undefined);

    if (style.fontFamily) {
      const [fontName, classes] = VARIANTS[style.fontFamily];

      if (classes) box.classes += ' ' + classes;

      return fontName;
    }

    let { variant } = style;
    let { variantStyle } = style;

    // 1. Remap to "main" font some characters that don't exist
    // in the "math" font

    // There are two fonts that include the roman italic characters, "main-it" and "math"
    // They are similar, but the "math" font has some different kernings ('f')
    // and some slightly different character shape. It doesn't include a few
    // characters, so for those characters, "main" has to be used instead

    // \imath, \jmath and \pound don't exist in "math" font,
    // so use "main" italic instead.
    if (
      variant === 'normal' &&
      !variantStyle &&
      /[\u00A3\u0131\u0237]/.test(box.value)
    ) {
      variant = 'main';
      variantStyle = 'italic';
    }

    // 2. If no explicit variant style, auto-italicize some symbols,
    // depending on the letterShapeStyle
    if (variant === 'normal' && !variantStyle && box.value.length === 1) {
      LETTER_SHAPE_RANGES.forEach((x, i) => {
        if (
          x.test(box.value) &&
          LETTER_SHAPE_MODIFIER[style.letterShapeStyle ?? 'tex'][i] === 'it'
        )
          variantStyle = 'italic';
      });
    }

    // 3. Map the variant + variantStyle to a font
    if (variantStyle === 'up') variantStyle = undefined;

    const styledVariant = variantStyle ? variant + '-' + variantStyle : variant;

    console.assert(VARIANTS[styledVariant] !== undefined);

    const [fontName, classes] = VARIANTS[styledVariant];

    // 4. If outside the font repertoire, switch to system font
    // (return NULL to use default metrics)
    if (
      VARIANT_REPERTOIRE[variant] &&
      !VARIANT_REPERTOIRE[variant].test(box.value)
    ) {
      // Map to unicode character
      box.value = mathVariantToUnicode(box.value, variant, variantStyle);
      // Return NULL to use default metrics
      return null;
    }

    // Lowercase greek letters have an incomplete repertoire (no bold)
    // so, for \mathbf to behave correctly, add a 'lcGreek' class.
    if (GREEK_LOWERCASE.test(box.value)) box.classes += ' lcGreek';

    // 5. Assign classes based on the font
    if (classes) box.classes += ' ' + classes;

    return fontName;
  }
}

function emitVariantRun(run: Atom[], options: ToLatexOptions): string[] {
  const { parent } = run[0];
  const contextVariant = variantString(parent!);
  return getPropertyRuns(run, 'variant').map((x) => {
    const variant = variantString(x[0]);
    let command = '';
    if (variant && variant !== contextVariant) {
      command = {
        'calligraphic': '\\mathcal',
        'fraktur': '\\mathfrak',
        'double-struck': '\\mathbb',
        'script': '\\mathscr',
        'monospace': '\\mathtt',
        'sans-serif': '\\mathsf',
        'normal': '\\mathrm',
        'normal-italic': '\\mathnormal',
        'normal-bold': '\\mathbf',
        'normal-bolditalic': '\\mathbfit',
        'ams': '',
        'ams-italic': '\\mathit',
        'ams-bold': '\\mathbf',
        'ams-bolditalic': '\\mathbfit',
        'main': '',
        'main-italic': '\\mathit',
        'main-bold': '\\mathbf',
        'main-bolditalic': '\\mathbfit',
        // There are a few rare font families possible, which
        // are not supported:
        // mathbbm, mathbbmss, mathbbmtt, mathds, swab, goth
        // In addition, the 'main' and 'math' font technically
        // map to \mathnormal{}
      }[variant!]!;
      console.assert(command !== undefined);
    }

    const arg = joinLatex(x.map((x) => x._serialize(options)));
    return !command ? arg : latexCommand(command, arg);
  });
}

function variantString(atom: Atom): string {
  if (!atom) return '';
  const { style } = atom;
  if (style.variant === undefined) return '';
  let result = style.variant;
  if (
    ![
      'calligraphic',
      'fraktur',
      'double-struck',
      'script',
      'monospace',
      'sans-serif',
    ].includes(style.variant) &&
    style.variantStyle &&
    style.variantStyle !== 'up'
  )
    result += '-' + style.variantStyle;

  return result;
}

// Singleton class
new MathMode();
