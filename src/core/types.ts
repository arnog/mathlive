import type {
  BoxCSSProperties,
  LatexValue,
  MacroDefinition,
  ParseMode,
  Registers,
  Style,
} from '../public/core-types';
import type { Atom } from '../core/atom-class';
import type { Context } from '../core/context';
import type { Argument } from 'latex-commands/types';

// See http://www.ntg.nl/maps/38/03.pdf for an explanation of the metrics
// and how they relate to the OpenFont math metrics
export interface FontMetrics<T = number> {
  slant: T; // σ1
  space: T; // σ2
  stretch: T; // σ3
  shrink: T; // σ4
  xHeight: T; // σ5 = accent base height
  quad: T; // σ6
  extraSpace: T; // σ7
  num1: T; // σ8 = FractionNumeratorDisplayStyleShiftUp
  num2: T; // σ9 = FractionNumeratorShiftUp
  num3: T; // σ10 = StackTopShiftUp
  denom1: T; // σ11 = StackBottomDisplayStyleShiftDown = FractionDenominatorDisplayStyleShiftDown
  denom2: T; // σ12 = StackBottomShiftDown = FractionDenominatorShiftDown
  sup1: T; //σ13 = SuperscriptShiftUp
  sup2: T; // σ14
  sup3: T; // σ15 = SuperscriptShiftUpCramped
  sub1: T; // σ16 = SubscriptShiftDown
  sub2: T; // σ17
  supDrop: T; // σ18 = SuperscriptBaselineDropMax
  subDrop: T; // σ19 = SubscriptBaselineDropMin
  delim1: T; // σ20
  delim2: T; // σ21 = DelimitedSubFormulaMinHeight
  axisHeight: T; // σ22

  // Note: xi14: offset from baseline for superscript TexBook p. 179
  // Note: xi16: offset from baseline for subscript

  defaultRuleThickness: T; // xi8
  bigOpSpacing1: T; // xi9
  bigOpSpacing2: T; // xi10
  bigOpSpacing3: T; // xi11
  bigOpSpacing4: T; // xi12
  bigOpSpacing5: T; // xi13

  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.
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
  'ignore', // A box that should be ignored during inter-box spacing, e.g. sup/sub atoms
  'lift', // For inter-box spacing, the children of the box should be lifted as
  // if they were present instead of the box
  'skip', // A box that only has some horizontal spacing
] as const; // The const assertion prevents widening to string[]
export type BoxType = (typeof BOX_TYPE)[number];

export type BoxOptions = {
  mode?: ParseMode;
  type?: BoxType;
  maxFontSize?: number;
  isTight?: boolean;
  fontFamily?: FontName;
  letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright';

  caret?: ParseMode;
  isSelected?: boolean;
  classes?: string;
  attributes?: Record<string, string>;

  style?: Style; // If a `style` option is provided, a `mode` must also be provided.
};

export interface BoxInterface {
  type: BoxType;

  parent: BoxInterface | undefined;
  children?: BoxInterface[];
  value: string;

  classes: string;

  caret?: ParseMode;
  isSelected: boolean;

  height: number;
  depth: number;
  width: number;
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
  readonly minFontScale: number;
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

export type Branches = {
  [branch in BranchName]?: Atom[];
};

export type ToLatexOptions = {
  // Replace macros with their definitions
  expandMacro?: boolean;

  // Don't emit color, backgroundcolor, fontsize commands
  skipStyles?: boolean;

  // Replace placeholders with their content
  skipPlaceholders?: boolean;

  // Don't emit unnecessary style shift commands: you can assume we're in
  // this default mode.
  defaultMode: 'text' | 'math' | 'inline-math';
};

// IMPORTANT: when adding a new atom type, add its constructor to `toJson()`
// atom.ts
export type AtomType =
  | 'accent'
  | 'array' // A group, which has children arranged in rows. Used
  // by environments such as `matrix`, `cases`, etc...
  | 'box' // A border drawn around an expression and change its background color
  | 'chem' // A chemical formula (mhchem)
  | 'choice' // A \\mathchoice command
  | 'composition' // IME composition area
  | 'delim'
  | 'enclose'
  | 'extensible-symbol' // Commands such as `\int`, `\sum`, etc...
  | 'error' //  An unknown command, for example `\xyzy`. The text  is displayed with a wavy red underline in the editor.
  | 'first' // A special, empty, atom put as the first atom in math lists in
  // order to be able to position the caret before the first element. Aside from
  // the caret, they display nothing.
  | 'genfrac' // A generalized fraction: a numerator and denominator, separated
  // by an optional line, and surrounded by optional fences
  | 'group' // A simple group of atoms, for example from a `{...}`
  | 'latex' // A raw latex atom
  | 'latexgroup' // A string of raw latex atoms
  | 'leftright' // Used by the `\left` and `\right` commands
  | 'line' // Used by `\overline` and `\underline`
  | 'macro'
  | 'macro-argument'
  | 'subsup' // A carrier for a superscript/subscript
  | 'operator' // A function, including special functions, `\sin`
  | 'overlap' // Display a symbol _over_ another
  | 'overunder' // Displays an annotation above or below a symbol
  | 'placeholder' // A temporary item. Placeholders are displayed as a dashed square in the editor.
  | 'phantom'
  | 'root' // A group, which has no parent (only one per formula)
  | 'rule' // Draw a line, for the `\rule` command
  | 'sizeddelim' // A delimiter that can grow
  | 'space'
  | 'spacing'
  | 'surd' // Aka square root, nth root
  | 'text' // Text mode atom;
  | 'tooltip' // For `\mathtip` and `\texttip`
  | 'prompt'
  /** The types below confound atom type and box type. They are all indicating
   * a probable Atom class, but with a different boxType (inter-atom spacing)
   */
  | 'mbin' // Binary operator: `+`, `*`, etc...
  | 'mclose' // Closing fence: `)`, `\rangle`, etc...
  | 'minner' // Special layout cases, fraction, overlap, `\left...\right`
  | 'mop' // `mop`: symbols with some space around them
  | 'mopen' // Opening fence: `(`, `\langle`, etc...
  | 'mord' // Ordinary symbol, e.g. `x`, `\alpha`
  | 'mpunct' // Punctuation: `,`, `:`, etc...
  | 'mrel'; // Relational operator: `=`, `\ne`, etc...

export type BBoxParameter = {
  backgroundcolor?: LatexValue;
  padding?: LatexValue;
  border?: string;
};

export type CreateAtomOptions<
  T extends (Argument | null)[] = (Argument | null)[],
> = {
  mode?: ParseMode;
  command?: string;
  style?: Style;
  args?: T;
};

export type AtomOptions<T extends (Argument | null)[] = (Argument | null)[]> =
  CreateAtomOptions<T> & {
    verbatimLatex?: string | null;

    type?: AtomType;
    value?: string;
    body?: readonly Atom[];
    isFunction?: boolean;
    limits?: 'auto' | 'over-under' | 'adjacent';
    displayContainsHighlight?: boolean;
    captureSelection?: boolean;
    skipBoundary?: boolean;
  };

/**
 * This data type is used as a serialized representation of the atom tree.
 * This is used by the Undo Manager to store the state of the mathfield.
 * While in many cases the LaTeX representation of the mathfield could be used
 * there are a few cases where the atom will carry additional information
 * that is difficult/impossible to represent in pure LaTeX, for example
 * the state/content of empty branches.
 */
export type AtomJson = { type?: AtomType; [key: string]: any };

/**
 * Each atom can have one or more "branches" of child atoms.
 */
export type BranchName =
  | 'body'
  | 'above'
  | 'below'
  | 'superscript'
  | 'subscript';

/**
 * In addition to a "named" branch, a branch can also be identified as a cell
 * in a tabular atom (matrix, etc...) with a row and column number.
 */
export type Branch = BranchName | [row: number, col: number];

export type FontName =
  | 'Main-Regular'
  | 'Main-Italic'
  | 'Main-Bold'
  | 'Main-BoldItalic'
  | 'Typewriter-Regular'
  | 'Math-Italic'
  | 'Math-BoldItalic'
  | 'AMS-Regular'
  | 'SansSerif-Regular'
  | 'Caligraphic-Regular'
  | 'Script-Regular'
  | 'Fraktur-Regular'
  | 'Size1-Regular'
  | 'Size2-Regular'
  | 'Size3-Regular'
  | 'Size4-Regular';
