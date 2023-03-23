/**
 * This file contains information and classes for the 'math styles' used by TeX,
 * which are specific layout algorithms for math.
 *
 * They get progressively smaller and tighter:
 * - displaystyle is used for expressions laid out on their own (in a block)
 * - textstyle is for expressions displayed on a line (usually with some text
 * around)
 * - scriptstyle is for expressions displayed as a superscript for example
 * - scriptscriptstyle is for expressions displayed as a superscript of a superscript
 * - the 'cramped' variations are used in various places, for examples a subscript
 * is using the 'scriptstyle', but cramped (so it's a bit more tight than a
 * superscript which is just using the 'scriptstyle')
 *
 * See Texbook, p.441:
 *
 * > A math list is a sequence of items of the various kinds listed in Chapter 17,
 * > and TEX typesets a formula by converting a math list to a horizontal list.
 * > When such typesetting begins, TEX has two other pieces of information in
 * > addition to the math list itself. (a) The starting style tells what style
 * > should be used for the math list, unless another style is specified by a
 * > style item. For example, the starting style for a displayed formula is D,
 * > but for an equation in the text or an equation number it is T; and for a
 * > subformula it can be any one of the eight styles defined in Chapter 17.
 * >
 * > We shall use C to stand for the current style, and we shall say that the
 * > math list is being typeset in style C. (b) The typesetting is done either
 * > with or without penalties. Formulas in the text of a paragraph are converted
 * > to horizontal lists in which additional penalty items are ed after
 * > binary operations and relations, in order to aid in line breaking. Such
 * > penalties are not ed in other cases, because they would serve no
 * > useful function.
 * >
 * > The eight styles are considered to be D > D′ > T > T′ > S > S′ > SS > SS′,
 * > in decreasing order. Thus, C ≤ S means that the current style is S, S', SS,
 * > or SS'. Style C′ means the current style with a prime added if one isn’t
 * > there; for example, we have C = T if and only if C = T or C = T'.
 * > Style C↑ is the superscript style for C; this means style S if C is D or T,
 * > style S′ if C is D′ or T′, style SS if C is S or SS,
 * > and style SS if C is S or SS.
 * > Finally, style C↓ is the subscript style, which is (C↑) .
 */

import { FONT_METRICS } from './font-metrics';
import type { FontSize } from '../public/core-types';
import { FontMetrics } from './types';

// IDs of the different MATHSTYLES
export const D = 7; // Displaystyle
export const Dc = 6; // Displaystyle, cramped
export const T = 5; // Textstyle
export const Tc = 4;
export const S = 3; // Scriptstyle
export const Sc = 2;
export const SS = 1; // Scriptscriptstyle
export const SSc = 0;

/**
 * @property {number} id unique id for the style
 * @property {number} sizeDelta (which is the same for cramped and uncramped version
 * of a style)
 * @property {boolean}  cramped flag
 */
export class Mathstyle {
  readonly id: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // How much the base font size should be modified when this
  // mathstyle is applied.
  // E.g., `scriptstyle` = base font size - 3
  readonly sizeDelta: -4 | -3 | 0;
  readonly cramped: boolean;
  metrics: FontMetrics;

  constructor(
    id: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    sizeDelta: -4 | -3 | 0,
    cramped: boolean
  ) {
    this.id = id;
    this.sizeDelta = sizeDelta;
    this.cramped = cramped;
    const metricsIndex = { '-4': 2, '-3': 1, 0: 0 }[sizeDelta];
    this.metrics = Object.keys(FONT_METRICS).reduce((acc, x) => {
      return { ...acc, [x]: FONT_METRICS[x][metricsIndex] };
    }, {}) as FontMetrics;
  }

  getFontSize(size: FontSize): FontSize {
    return Math.max(1, size + this.sizeDelta) as FontSize;
  }

  /**
   * Get the style of a superscript given a base in the current style.
   */
  get sup(): Mathstyle {
    return MATHSTYLES[[SSc, SS, SSc, SS, Sc, S, Sc, S][this.id]];
  }

  /**
   * Get the style of a subscript given a base in the current style.
   */
  get sub(): Mathstyle {
    return MATHSTYLES[[SSc, SSc, SSc, SSc, Sc, Sc, Sc, Sc][this.id]];
  }

  /**
   * Get the style of a fraction numerator given the fraction in the current
   * style.
   * See TeXBook p 141.
   */
  get fracNum(): Mathstyle {
    return MATHSTYLES[[SSc, SS, SSc, SS, Sc, S, Tc, T][this.id]];
  }

  /**
   * Get the style of a fraction denominator given the fraction in the current
   * style.
   * See TeXBook p 141.
   */
  get fracDen(): Mathstyle {
    return MATHSTYLES[[SSc, SSc, SSc, SSc, Sc, Sc, Tc, Tc][this.id]];
  }

  /**
   * Get the cramped version of a style (in particular, cramping a cramped style
   * doesn't change the style).
   */
  get cramp(): Mathstyle {
    return MATHSTYLES[[SSc, SSc, Sc, Sc, Tc, Tc, Dc, Dc][this.id]];
  }

  /**
   * Return if this style is tightly spaced (scriptstyle/scriptscriptstyle)
   */
  get isTight(): boolean {
    return this.sizeDelta < 0;
  }
}

export const MATHSTYLES: {
  [key: number]: Mathstyle;
  displaystyle?: Mathstyle;
  textstyle?: Mathstyle;
  scriptstyle?: Mathstyle;
  scriptscriptstyle?: Mathstyle;
} = {
  7: new Mathstyle(D, 0, false),
  6: new Mathstyle(Dc, 0, true),
  5: new Mathstyle(T, 0, false),
  4: new Mathstyle(Tc, 0, true),
  3: new Mathstyle(S, -3, false),
  2: new Mathstyle(Sc, -3, true),
  1: new Mathstyle(SS, -4, false),
  0: new Mathstyle(SSc, -4, true),
};

// Aliases
MATHSTYLES.displaystyle = MATHSTYLES[D];
MATHSTYLES.textstyle = MATHSTYLES[T];
MATHSTYLES.scriptstyle = MATHSTYLES[S];
MATHSTYLES.scriptscriptstyle = MATHSTYLES[SS];
