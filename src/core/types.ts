import {
  ArgumentType,
  BoxCSSProperties,
  MacroDefinition,
  MathstyleName,
  NormalizedMacroDictionary,
  ParseMode,
  Registers,
  Style,
  Token,
} from '../public/core-types';
import { Atom } from '../core/atom-class';
import { Context } from '../core/context';
import { TokenDefinition } from '../core-definitions/definitions-utils';

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

export const BOX_TYPE = [
  '',
  'chem',
  'mord', // > is an ordinary atom like ‘x’ ;
  'mbin', // > is a binary operation atom like ‘+’
  'mop', // > is a large operator atom like $$\sum$$
  'mrel', // > is a relation atom like ‘=’
  'mopen', // > is an opening atom like ‘(’
  'mclose', // > is a closing atom like ‘)’
  'mpunct', // > is a punctuation atom like ‘,’
  'minner', // >  is an inner atom like ‘$$\frac12$$'
  'spacing',
  'first',
  'latex',
  'composition',
  'error',
  'placeholder',
  'supsub',
  'none',
  'mathfield',
] as const; // The const assertion prevents widening to string[]
export type BoxType = (typeof BOX_TYPE)[number];

export type BoxOptions = {
  classes?: string;
  properties?: Partial<Record<BoxCSSProperties, string>>;
  attributes?: Record<string, string>;
  type?: BoxType;
  isTight?: boolean;
  height?: number;
  depth?: number;
  maxFontSize?: number;

  newList?: boolean;

  mode?: ParseMode;
  style?: Style; // If a `style` option is provided, a `mode` must also be provided.

  fontFamily?: string;
};

export interface BoxInterface {
  // constructor(
  //   content: null | number | string | Box | (Box | null)[],
  //   options?: BoxOptions
  // );
  type: BoxType;

  children?: BoxInterface[];
  newList: boolean;
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

  cssProperties: Partial<Record<BoxCSSProperties, string>>;

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
      type: '' | 'mopen' | 'mclose' | 'minner';
    }
  ): BoxInterface;

  wrapSelect(context: ContextInterface): BoxInterface;

  toMarkup(): string;

  tryCoalesceWith(box: BoxInterface): boolean;
}

export type PrivateStyle = Style & {
  verbatimColor?: string;
  verbatimBackgroundColor?: string;
  mathStyle?: MathstyleName;
};

export interface ContextInterface {
  registers: Registers;
  atomIdsSettings?: {
    overrideID?: string;
    groupNumbers: boolean;
    seed: 'random' | number;
  };
  renderPlaceholder?: (context: Context) => BoxInterface;
}

export declare function applyStyle(
  mode: ParseMode,
  box: BoxInterface,
  style: Style
): string | null;

/**
 * The Global Context encapsulates information that atoms
 * may require in order to render correctly. Unlike `ContextInterface`, these
 * values do not depend of the location of the atom in the render tree.
 */
export interface GlobalContext {
  readonly registers: Registers;
  readonly smartFence: boolean;
  readonly letterShapeStyle: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
  readonly fractionNavigationOrder:
    | 'numerator-denominator'
    | 'denominator-numerator';
  readonly placeholderSymbol: string;
  colorMap: (name: string) => string | undefined;
  backgroundColorMap: (name: string) => string | undefined;
  getDefinition(token: string, parseMode: ParseMode): TokenDefinition | null;
  getMacro(token: string): MacroDefinition | null;
}
