/**
 * This file contains information and classes for the 'math styles' used by TeX,
 * which are specific layout
 * algorithms for math. They get progressively smaller and tighter:
 * - displaystyle is used for expressions laid out on their own (in a block)
 * - textstyle is for expressions displayed on a line (usually wiht some text
 * around)
 * - scriptstyle is for expressions displayed as a superscript for example
 * - scriptscriptstyle is for expressions displayed as a superscript of a superscript
 * - the 'cramped' variations are used in various places, for examples a subscript
 * is using the 'scriptstyle', but cramped (so it's a bit more tight than a
 * superscript which is just using the 'scriptstyle')
 *
 * See Texbook, p.441:
 *
 * A math list is a sequence of items of the various kinds listed in Chapter 17,
 * and TEX typesets a formula by converting a math list to a horizontal list.
 * When such typesetting begins, TEX has two other pieces of information in
 * addition to the math list itself. (a) The starting style tells what style
 * should be used for the math list, unless another style is specified by a
 * style item. For example, the starting style for a displayed formula is D,
 * but for an equation in the text or an equation number it is T; and for a
 * subformula it can be any one of the eight styles defined in Chapter 17.
 *
 * We shall use C to stand for the current style, and we shall say that the
 * math list is being typeset in style C. (b) The typesetting is done either
 * with or without penalties. Formulas in the text of a paragraph are converted
 * to horizontal lists in which additional penalty items are inserted after
 * binary operations and relations, in order to aid in line breaking. Such
 * penalties are not inserted in other cases, because they would serve no
 * useful function.
 *
 * The eight styles are considered to be D > D′ > T > T′ > S > S′ > SS > SS′,
 * in decreasing order. Thus, C ≤ S means that the current style is S, S , SS,
 * or SS . Style C′ means the current style with a prime added if one isn’t
 * there; for example, we have C =T if and only if C = T or C = T'.
 * Style C↑ is the superscript style for C; this means style S if C is D or T,
 * style S′ if C is D′ or T′, style SS if C is S or SS,
 * and style SS if C is S or SS.
 * Finally, style C↓ is the subscript style, which is (C↑) .
 */

import { SIGMAS } from './font-metrics';
interface Metrics {
  slant: number;
  space: number;
  stretch: number;
  shrink: number;
  xHeight: number;
  quad: number;
  extraSpace: number;
  num1: number; // 8
  num2: number; // 9
  num3: number; // 10
  denom1: number; // 11
  denom2: number; // 12
  sup1: number;
  sup2: number;
  sup3: number;
  sub1: number;
  sub2: number;
  supDrop: number;
  subDrop: number;
  delim1: number;
  delim2: number;
  axisHeight: number;
  emPerEx?: number;
} // @revisit: belongs in ./font-metrics

// IDs of the different MATHSTYLES
const D = 0; // Displaystyle
const Dc = 1; // Displaystyle, cramped
const T = 2; // Textstyle
const Tc = 3;
const S = 4; // Scriptstyle
const Sc = 5;
const SS = 6; // Scriptscriptstyle
const SSc = 7;

/**
 * @property {number} id unique id for the style
 * @property {number} size (which is the same for cramped and uncramped version
 * of a style)
 * @property {number}  multiplier, size multiplier which gives the size difference between
 * a style and textstyle.
 * @property {boolean}  cramped flag
 */
export class Mathstyle {
  id: number;
  size: number;
  cramped: boolean;
  sizeMultiplier: number; // @revisit...? Same as multiplier
  metrics: Metrics;

  constructor(id: number, size: number, multiplier: number, cramped: boolean) {
    this.id = id;
    this.size = size;
    this.cramped = cramped;
    this.sizeMultiplier = multiplier;
    this.metrics = Object.keys(SIGMAS).reduce((acc, x) => {
      return { ...acc, [x]: SIGMAS[x][this.size] };
    }, {}) as Metrics;
    this.metrics.emPerEx = SIGMAS.xHeight[this.size] / SIGMAS.quad[this.size];
  }

  /**
   * Get the style of a superscript given a base in the current style.
   */
  sup(): Mathstyle {
    return MATHSTYLES[[S, Sc, S, Sc, SS, SSc, SS, SSc][this.id]];
  }

  /**
   * Get the style of a subscript given a base in the current style.
   */
  sub(): Mathstyle {
    return MATHSTYLES[[Sc, Sc, Sc, Sc, SSc, SSc, SSc, SSc][this.id]];
  }

  /**
   * Get the style of a fraction numerator given the fraction in the current
   * style.
   */
  fracNum(): Mathstyle {
    return MATHSTYLES[[T, Tc, S, Sc, SS, SSc, SS, SSc][this.id]];
  }

  /**
   * Get the style of a fraction denominator given the fraction in the current
   * style.
   */
  fracDen(): Mathstyle {
    return MATHSTYLES[[Tc, Tc, Sc, Sc, SSc, SSc, SSc, SSc][this.id]];
  }

  /**
   * Get the cramped version of a style (in particular, cramping a cramped style
   * doesn't change the style).
   */
  cramp(): Mathstyle {
    return MATHSTYLES[[Dc, Dc, Tc, Tc, Sc, Sc, SSc, SSc][this.id]];
  }

  /**
   * CSS class name, for example `displaystyle cramped`
   */
  cls(): string {
    return [
      'displaystyle textstyle', // @revisit. Should just be 'displaystyle'
      'textstyle',
      'scriptstyle',
      'scriptscriptstyle',
    ][this.size]; // @revisit: use this.id to include 'cramped' variants
  }

  /**
   * CSS class name to adjust from one style to another, like 'reset-textstyle'
   */
  adjustTo(newStyle: Mathstyle): string {
    // @revisit the values used here
    let result = [
      [
        '', // 'reset-textstyle displaystyle textstyle',
        '', // 'reset-textstyle textstyle',
        'reset-textstyle scriptstyle',
        'reset-textstyle scriptscriptstyle',
      ],

      [
        'reset-textstyle displaystyle textstyle',
        '', // 'reset-textstyle textstyle',
        'reset-textstyle scriptstyle',
        'reset-textstyle scriptscriptstyle',
      ],

      [
        'reset-scriptstyle textstyle displaystyle',
        'reset-scriptstyle textstyle',
        '', // 'reset-scriptstyle scriptstyle',
        'reset-scriptstyle scriptscriptstyle',
      ],

      [
        'reset-scriptscriptstyle textstyle displaystyle', // @revisit. Should not have 'textstyle'
        'reset-scriptscriptstyle textstyle',
        'reset-scriptscriptstyle scriptstyle',
        '', // 'reset-scriptscriptstyle scriptscriptstyle'
      ],
    ][this.size][newStyle.size];
    if (result.length > 0) result = ' ' + result;
    return result;
  }

  /**
   * Return if this style is tightly spaced (scriptstyle/scriptscriptstyle)
   */
  isTight(): boolean {
    return this.size >= 2;
  }
}

export const MATHSTYLES: {
  [key: number]: Mathstyle;
  displaystyle?: Mathstyle;
  textstyle?: Mathstyle;
  scriptstyle?: Mathstyle;
  scriptscriptstyle?: Mathstyle;
} = {
  0: new Mathstyle(D, 0, 1, false),
  1: new Mathstyle(Dc, 0, 1, true),
  2: new Mathstyle(T, 1, 1, false),
  3: new Mathstyle(Tc, 1, 1, true),
  4: new Mathstyle(S, 2, 0.7, false),
  5: new Mathstyle(Sc, 2, 0.7, true),
  6: new Mathstyle(SS, 3, 0.5, false),
  7: new Mathstyle(SSc, 3, 0.5, true),
};

// Aliases
MATHSTYLES.displaystyle = MATHSTYLES[0];
MATHSTYLES.textstyle = MATHSTYLES[2];
MATHSTYLES.scriptstyle = MATHSTYLES[4];
MATHSTYLES.scriptscriptstyle = MATHSTYLES[6];

export type MathStyleName =
  | 'displaystyle'
  | 'textstyle'
  | 'scriptstyle'
  | 'scriptscriptstyle';
