import { FontSize, MacroDictionary, ParseMode } from '../public/core';
import { Mathstyle, MathStyleName, MATHSTYLES } from './mathstyle';
import { Span } from './span';

export type ArgumentType =
  | ParseMode
  | (
      | 'auto'
      | 'bbox'
      | 'color' // Color name, hex value: `'#fff'`, `'#a0a0a0'`
      | 'colspec' // Formating of a column in tabular environment, e.g. `'r@{.}l'`
      | 'delim'
      | 'dimen' // `'25mu'`, `'2pt'`
      | 'number' // `+/-12.56`
      | 'rest' // `{\foo \textsize ...}` to capture "..."
      | 'skip' // `'25mu plus 2em minus fiLll'`, `'2pt'`
      | 'string' // Delimiter is a non-literal token (e.g. `<}>` `<$>`, etc
      | 'balanced-string' // Delimiter is a balanced closing brace
    );

export interface ContextInterface {
  macros?: MacroDictionary;
  atomIdsSettings?: {
    overrideID?: string;
    groupNumbers: boolean;
    seed: string | number;
  };
  mathstyle?: Mathstyle;
  renderPlaceholder?: (context: Context) => Span;
  parentMathstyle?: Mathstyle;
  size?: FontSize | 'auto';
  parentSize?: FontSize;
  letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
  opacity?: number;
  color?: string;
  smartFence?: boolean;
  phantomBase?: Span[];
}

/**
 * This structure contains the rendering context of the current parse level.
 *
 * It also holds information about the parent context to handle scaling
 * adjustments.
 *
 * When a new scope is entered, a clone of the context is created with `.clone()`
 * so that any further changes remain local to the scope.
 *
 * A scope is defined for example by:
 * - an explicit group enclosed in braces `{...}`
 * - a semi-simple group enclosed in `\bgroup...\endgroup`
 * - an environment delimited by `\begin{<envname>}...\end{<envname>}`
 *
 * @property {Mathstyle} mathstyle
 * @property {number} opacity
 * @property {number} size
 * @property {object} atomIdsSettings - If not undefined, unique IDs should be
 * generated for each span so they can be mapped back to an atom.
 * The `seed` field should be a number to generate a specific range of
 * IDs or the string "random" to generate a random number.
 * Optionally, if a `groupNumbers` property is set to true, an additional
 * span will enclose strings of digits. This is used by read aloud to properly
 * pronounce (and highlight) numbers in expressions.
 * @property {Mathstyle} parentMathstyle
 * @property {number} parentSize
 * @property {object} macros A macros dictionary
 * @property {string} color
 */
export class Context implements ContextInterface {
  macros: MacroDictionary;
  atomIdsSettings?: {
    overrideID?: string;
    groupNumbers: boolean;
    seed: string | number;
  };

  mathstyle: Mathstyle;
  parentMathstyle?: Mathstyle;
  size?: FontSize;
  parentSize?: FontSize;
  letterShapeStyle: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
  opacity?: number;
  color?: string;
  renderPlaceholder?: (context: Context) => Span;
  smartFence?: boolean;
  phantomBase?: Span[]; // The spans to use to calculate the placement of the sup/sub
  // Used by 'msubsup' scaffolding atoms

  constructor(from: ContextInterface) {
    this.macros = from.macros ?? {};
    this.atomIdsSettings = from.atomIdsSettings;

    this.mathstyle = from.mathstyle ?? MATHSTYLES.displaystyle;

    this.letterShapeStyle = from.letterShapeStyle ?? 'tex';

    if (from.size === 'auto') {
      this.size = 'size5';
    } else {
      this.size = from.size ?? 'size5'; // Medium size
    }

    this.parentMathstyle = from.parentMathstyle ?? this.mathstyle;
    this.renderPlaceholder = from.renderPlaceholder;
    this.parentSize = from.parentSize ?? this.size;

    this.opacity = from.opacity;
    this.smartFence = from.smartFence;
    this.phantomBase = from.phantomBase;
  }

  makeID(): string {
    let result: string;
    if (this.atomIdsSettings) {
      if (typeof this.atomIdsSettings.seed === 'number') {
        result = this.atomIdsSettings.overrideID
          ? this.atomIdsSettings.overrideID
          : this.atomIdsSettings.seed.toString(36);
        this.atomIdsSettings.seed += 1;
      } else {
        result =
          Date.now().toString(36).slice(-2) +
          Math.floor(Math.random() * 0x186a0).toString(36);
      }
    }

    return result;
  }

  /**
   * Returns a new context with the same properties as 'this',
   * except for the ones provided in `override`
   */
  clone(override: ContextInterface = {}): Context {
    const result = new Context(this);
    if (override !== undefined) {
      // `'auto'` (or undefined) to indicate that the mathstyle should in
      // fact not be changed. This is used when specifying the mathstyle
      // for some environments.
      const previousMathstyle = this.mathstyle;
      Object.assign(result, override);
      if (!override.mathstyle) {
        result.mathstyle = previousMathstyle;
      } else {
        result.parentMathstyle = previousMathstyle;
        if (typeof override.mathstyle === 'string') {
          result.mathstyle = MATHSTYLES[override.mathstyle];
        }
      }
    }

    return result;
  }

  withFontsize(size: FontSize | 'auto'): Context {
    return this.clone({ size: size === 'auto' ? 'size5' : size });
  }

  withMathstyle(mathstyle: MathStyleName): Context {
    if (!mathstyle) return this;
    return this.clone({ mathstyle: MATHSTYLES[mathstyle] });
  }

  cramp(): Context {
    return this.clone({ mathstyle: this.mathstyle.cramp() });
  }

  sup(): Context {
    return this.clone({ mathstyle: this.mathstyle.sup() });
  }

  sub(): Context {
    return this.clone({ mathstyle: this.mathstyle.sub() });
  }

  classes(): string {
    const result = [
      ['', '', 'sz-10-7', 'sz-10-5'],
      ['', '', 'sz-10-7', 'sz-10-5'],
      ['sz-7-10', 'sz-7-10', '', 'sz-7-5'],
      ['sz-5-10', 'sz-5-10', 'sz-5-7', ''],
    ][this.parentMathstyle.size][this.mathstyle.size];
    if (result.length === 0) return '';
    return ' ' + result;
  }
}
