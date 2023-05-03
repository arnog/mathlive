import type {
  ArgumentType,
  BoxCSSProperties,
  MacroDefinition,
  NormalizedMacroDictionary,
  ParseMode,
  Registers,
  Style,
  Token,
} from '../public/core-types';
import { Atom } from '../core/atom-class';
import { Context } from '../core/context';

export interface ParseTokensOptions {
  macros: NormalizedMacroDictionary;
  smartFence: boolean;
  style: Style;
  args: (arg: string) => string;
  parse: (
    mode: ArgumentType,
    tokens: Token[],
    options: ParseTokensOptions
  ) => [Atom[], Token[]];
}

// See http://www.ntg.nl/maps/38/03.pdf for an explanation of the metrics
// and how they relate to the OpenFont math metrics
export interface FontMetrics<T = number> {
  slant: T;
  space: T;
  stretch: T;
  shrink: T;
  xHeight: T; // sigma 5 = accent base height
  quad: T;
  extraSpace: T;
  num1: T; // sigma 8 = FractionNumeratorDisplayStyleShiftUp
  num2: T; // sigma 9 = FractionNumeratorShiftUp
  num3: T; // sigma 10 = StackTopShiftUp
  denom1: T; // sigma 11 = StackBottomDisplayStyleShiftDown = FractionDenominatorDisplayStyleShiftDown
  denom2: T; // sigma 12 = StackBottomShiftDown = FractionDenominatorShiftDown
  sup1: T; //sigma 13 = SuperscriptShiftUp
  sup2: T;
  sup3: T; // sigma 15 = SuperscriptShiftUpCramped
  sub1: T; // sigma 16 = SubscriptShiftDown
  sub2: T;
  supDrop: T; // sigma 18 = SuperscriptBaselineDropMax
  subDrop: T; // sigma 19 = SubscriptBaselineDropMin
  delim1: T;
  delim2: T; // sigma 21 = DelimitedSubFormulaMinHeight
  axisHeight: T; // sigma 22

  // Note: xi14: offset from baseline for superscript TexBook p. 179
  // Note: xi16: offset from baseline for subscript

  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.

  defaultRuleThickness: T; // xi8; cmex7: 0.049
  bigOpSpacing1: T; // xi9
  bigOpSpacing2: T; // xi10
  bigOpSpacing3: T; // xi11
  bigOpSpacing4: T; // xi12; cmex7: 0.611
  bigOpSpacing5: T; // xi13; cmex7: 0.143

  sqrtRuleThickness: T;
}

/*
 * See https://tex.stackexchange.com/questions/81752/
 * for a thorough description of the TeX atom type and their relevance to
 * proper kerning.
 *
 * See TeXBook p. 158 for a list of the "atom types"
 * Note: we are not using the following types: 'over', 'under', 'acc', 'rad',
 * 'vcent'
 */

const BOX_TYPE = [
  'ord', // > is an ordinary atom like `x`
  'bin', // > is a binary operation atom like `+`
  'op', // > is a large operator atom like `\sum`
  'rel', // > is a relation atom like `=`
  'open', // > is an opening atom like `(`
  'close', // > is a closing atom like `)`
  'punct', // > is a punctuation atom like ‘,’
  'inner', // >  is an inner atom like `\frac12`
  'rad', // for radicals, like `\sqrt2`
  'latex',
  'composition',
  'middle', // A box type used by the `\middle` command
  'skip', // A box that should be skipped during inter-box spacing, e.g. sup/sub atoms
  'lift', // For inter-box spacing, the children of the box should be lifted as
  // if they were present instead of the box
] as const; // The const assertion prevents widening to string[]
export type BoxType = (typeof BOX_TYPE)[number];

export type BoxOptions = {
  mode?: ParseMode;
  type?: BoxType;
  height?: number;
  depth?: number;
  maxFontSize?: number;
  isTight?: boolean;
  fontFamily?: string;
  letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright';

  caret?: ParseMode;
  isSelected?: boolean;
  classes?: string;
  properties?: Partial<Record<BoxCSSProperties, string>>;
  attributes?: Record<string, string>;

  style?: Style; // If a `style` option is provided, a `mode` must also be provided.
};

export interface BoxInterface {
  type: BoxType;

  children?: BoxInterface[];
  value: string;

  classes: string;

  caret: ParseMode;
  isSelected: boolean;

  height: number;
  depth: number;
  skew: number;
  italic: number;
  maxFontSize: number;

  isTight?: boolean;

  cssId?: string;
  htmlData?: string;
  htmlStyle?: string;

  svgBody?: string;
  svgOverlay?: string;
  svgStyle?: string;

  delim?: string;

  attributes?: Record<string, string>;

  cssProperties?: Partial<Record<BoxCSSProperties, string>>;

  set atomID(id: string | undefined);

  selected(isSelected: boolean): void;

  setStyle(prop: BoxCSSProperties, value: string | undefined): void;
  setStyle(prop: BoxCSSProperties, value: number, unit?: string): void;
  setStyle(
    prop: BoxCSSProperties,
    value: string | number | undefined,
    unit?: string
  ): void;

  setTop(top: number): void;

  left: number;
  right: number;
  width: number;

  wrap(
    context: ContextInterface,
    options?: {
      classes: string;
      type: '' | 'open' | 'close' | 'inner';
    }
  ): BoxInterface;

  toMarkup(): string;

  tryCoalesceWith(box: BoxInterface): boolean;
}

export type PrivateStyle = Style & {
  verbatimColor?: string;
  verbatimBackgroundColor?: string;
};

/**
 * The `ContextInterface` encapsulates information needed to render atoms. Each
 * rendering group may create a new `ContextInterface`, linked to its parent.
 *
 * Registers are scoped to the current context by default, but global
 * registers can also be accessed with `\global`:
 * (https://tex.stackexchange.com/questions/94710/what-is-the-difference-between-local-and-global-in-a-tex-meaning)
 *
 */
export interface ContextInterface {
  readonly registers: Registers;
  atomIdsSettings?: {
    overrideID?: string;
    groupNumbers: boolean;
    seed: 'random' | number;
  };
  renderPlaceholder?: ((context: Context) => BoxInterface) | undefined;
  readonly smartFence: boolean;
  readonly letterShapeStyle: 'tex' | 'french' | 'iso' | 'upright';
  readonly placeholderSymbol: string;
  readonly colorMap: (name: string) => string | undefined;
  readonly backgroundColorMap: (name: string) => string | undefined;
  getMacro(token: string): MacroDefinition | null;
}

export declare function applyStyle(
  mode: ParseMode,
  box: BoxInterface,
  style: Style
): string | null;
