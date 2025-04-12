/** @category Styles */

export type MathstyleName =
  | 'displaystyle'
  | 'textstyle'
  | 'scriptstyle'
  | 'scriptscriptstyle';

/** @internal  */
export type ArgumentType =
  | ParseMode
  | (
      | 'bbox'
      | 'colspec' // Formating of a column in tabular environment, e.g. `"r@{.}l"`
      | 'delim'
      | 'value' //  LatexValue
      | 'rest' // `{\foo \textsize ...}` to capture "..."
      | 'string' // The string will end on the first non-literal token, e.g. `<}>`
      | 'balanced-string' // Delimiter is a balanced closing brace
      | 'expression' // A literal, or command with arguments, not enclosed in braces
      | 'auto'
    );

// The 'special' tokens are:
// '<space>': whitespace
// '<$$>'   : display math mode shift
// '<$>'    : inline math mode shift
// '<{>'    : begin group
// '<}>'    : end group
// '#0'-'#9': argument
// '#?'     : placeholder
// '\' + ([a-zA-Z\*]+)|([^a-zAz\*])  : command
// others: literal (not that length may be > 1, e.g. emoji)
//  See: [TeX:289](http://tug.org/texlive/devsrc/Build/source/texk/web2c/tex.web)
/** @internal  */
export type Token = string;

/**
 * The mode that indicates how a portion of content is interpreted
 *
 */
/** @internal  */
export type ParseMode = 'math' | 'text' | 'latex';

/**
 * Error codes returned by the `mf.errors` property.
 *
 *
 *
    |  | |
    | ------------------ | ---      |
    | `unknown-command`             | There is no definition available for this LaTeX command, e.g. `\zin`  |
    | `unknown-environment`         | There is no definition available for this environment, e.g. `\begin{foo}`  |
    | `invalid-command`             | This command is not valid in the current context (e.g. text command in math mode)  |
    | `unbalanced-braces`           |  There are too many or too few `{` or `}`  |
    | `unbalanced-environment`      |  An environment was open but never closed (`\begin{array}`) or the `\end` command does not match the `\begin` command (`\begin{array*}\end{array}`)  |
    | `unbalanced-mode-shift`       |  A `$`, `$$`, `\(` or `\[` was not balanced  |
    | `missing-argument`            |  A required argument is missing, e.g. `\frac{2}` |
    | `too-many-infix-commands`     | A group can include only one infix command (i.e. `\choose`, `\atop`). In general it's best to avoid infix commands.  |
    | `unexpected-command-in-string`| A command expected a string argument, but there was a command instead  |
    | `missing-unit`                |  An argument requiring a dimension was missing an unit.  |
    | `unexpected-delimiter`        |  An invalid symbol or command was used as a delimiter.  |
    | `unexpected-token`            |  An unexpected character was encountered.  |
    | `unexpected-end-of-string`    |  The end of the string was reached, but some required arguments were missing. |
    | `improper-alphabetic-constant`    | The alphabetic constant prefix `` ` `` was not followed by a letter or single character command. |
* @category Conversion 
*/
export type ParserErrorCode =
  | 'unknown-command'
  | 'invalid-command'
  | 'unbalanced-braces'
  | 'unknown-environment'
  | 'unbalanced-environment'
  | 'unbalanced-mode-shift'
  | 'missing-argument'
  | 'too-many-infix-commands'
  | 'unexpected-command-in-string'
  | 'missing-unit'
  | 'unexpected-delimiter'
  | 'unexpected-token'
  | 'unexpected-end-of-string'
  | 'improper-alphabetic-constant';

// See https://ww2.eng.famu.fsu.edu/~dommelen/l2h/errors.html
// for a reference of TeX errors.

/** @category Conversion */
export type LatexSyntaxError<T = ParserErrorCode> = {
  code: T;
  arg?: string;
  latex?: string;
  before?: string;
  after?: string;
};

/**
 * Variants indicate a stylistic alternate for some characters.
 *
 * Typically, those are controlled with explicit commands, such as
 * `\mathbb{}` or `\mathfrak{}`. This type is used with the
 * {@linkcode MathfieldElement.applyStyle} method to change the styling of a range of
 * selected characters.
 *
 * In mathematical notation these variants are used not only for visual
 * presentation, but they may have semantic significance.
 *
 * For example,
 * - the set ℂ should not be confused with
 * - the physical unit 𝖢 (Coulomb).
 *
 * When rendered, these variants can map to some built-in fonts.
 *
 * LaTeX supports a limited set of characters. However, MathLive will
 * map characters not supported by LaTeX  fonts (double-stuck variant for digits
 * for example) to a Unicode character (see [Mathematical Alphanumeric Symbols on Wikipedia](https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols) ).
 *
 * `normal` is a synthetic variant that maps either to `main` (upright) or
 * `math` (italic) depending on the symbol and the `letterShapeStyle`.
 *
 * The `math` variant has italic characters as well as slightly different
 * letter shape and spacing (a bit more space after the "f" for example), so
 * it's not equivalent to a `main` variant with `italic` variant style applied.
 *
 * **See Also**
 * * {@linkcode Style}
 *
 * @category Styles
 */
export type Variant =
  | 'ams'
  | 'double-struck'
  | 'calligraphic'
  | 'script'
  | 'fraktur'
  | 'sans-serif'
  | 'monospace'
  | 'normal' // 'main' (upright) or 'math' (italic) depending on letterShapeStyle
  | 'main' // Upright
  | 'math'; // Italic, with custom spacing for "f" and others

/**
 * Some variants support stylistic variations.
 *
 * Note that these stylistic variations support a limited set of characters,
 * typically just uppercase and lowercase letters, and digits 0-9 in some cases.
 *
| variant            | `up`       | `bold`       | `italic` | `bolditalic` |
| ------------------ | ---        | ---          | ---      | --- |
| `normal`    | ABCabc012 | 𝐀𝐁𝐂𝐚𝐛𝐜𝟎𝟏𝟐  | 𝐴𝐵𝐶𝑎𝑏𝑐  |𝑨𝑩𝑪𝒂𝒃𝒄  |
| `double-struck`    | 𝔸𝔹ℂ𝕒𝕓𝕔𝟘𝟙𝟚  | n/a          | n/a      | n/a  |
| `calligraphic`     | 𝒜ℬ𝒞𝒶𝒷𝒸   | 𝓐𝓑𝓒𝓪𝓫𝓬      | n/a      | n/a  |
| `fraktur`          | 𝔄𝔅ℭ𝔞𝔟𝔠     | 𝕬𝕭𝕮𝖆𝖇𝖈       | n/a      | n/a  |
| `sans-serif`| 𝖠𝖡𝖢𝖺𝖻𝖼𝟢𝟣𝟤 | 𝗔𝗕𝗖𝗮𝗯𝗰𝟬𝟭𝟮 | 𝘈𝘉𝘊𝘢𝘣𝘤 | 𝘼𝘽𝘾𝙖𝙗𝙘  |
| `monospace`        | 𝙰𝙱𝙲𝚊𝚋𝚌     | n/a          | n/a      | n/a  |

 * @category Styles
 */
export type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';

/**
 * @category Styles
 */
export type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';

/**
 * @category Styles
 */
export type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';

/**
 * @category Styles
 */
export type FontFamily = 'none' | 'roman' | 'monospace' | 'sans-serif';

/**
 * @category Styles
 */
export type FontSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Use a `Style` object  literal to modify the visual appearance of a
 * mathfield or a portion of a mathfield.
 *
 * You can control the color ("ink") and background color ("paper"),
 * the font variant, weight (`FontSeries`), size and more.
 *
 * **See Also**
 * * `applyStyle()`
 * * [Interacting with a Mathfield](mathfield/guides/interacting/)
 *
 * @category Styles
 */

/**
 * @category Styles
 */
export interface Style {
  // For text and math mode:
  color?: string;
  backgroundColor?: string;
  fontSize?: FontSize | 'auto'; // In TeX, fontSize only applies to text mode

  // For math mode:
  variant?: Variant;
  variantStyle?: VariantStyle;

  // For text mode:
  fontFamily?: FontFamily;
  fontShape?: FontShape;
  fontSeries?: FontSeries;
}

/**
 * **See Also**
 * * {@linkcode MacroDictionary}
 * * [Macros guide](//mathfield/guides/macros/)
 *
 * @category Macros
 */
export type MacroDefinition = {
  /** Definition of the macro as a LaTeX expression */
  def: string;
  /** Number of arguments (`#1`, etc...) in the macro definition */
  args?: number;
  /** If `false` elements inside the macro can be selected */
  captureSelection?: boolean;
  /** If `false`, even if `expandMacro` is true, do not expand. */
  expand?: boolean;
};

/** @category Macros */
export type NormalizedMacroDictionary = Record<string, MacroDefinition>;

/** @category Macros */
export type MacroPackageDefinition = {
  package: Record<string, string | MacroDefinition>;
  // If `primitive` is true, the macro in this package are not expanded,
  // event when `expandMacro` is true.
  primitive?: boolean;
  captureSelection?: boolean;
};

/**
 * Glue represents flexible spacing, that is a dimension that
 * can grow (by the `grow` property) or shrink (by the `shrink` property).
 *
 * @category Registers
 */
export type Glue = {
  glue: Dimension;
  shrink?: Dimension;
  grow?: Dimension;
};

/**
 * @category Registers
 */
export type DimensionUnit =
  | 'pt'
  | 'mm'
  | 'cm'
  | 'ex'
  | 'px'
  | 'em'
  | 'bp'
  | 'dd'
  | 'pc'
  | 'in'
  | 'mu'
  | 'fil'
  | 'fill'
  | 'filll';

/**
 * A dimension is used to specify the size of things
 *
 * @category Registers
 */
export type Dimension = {
  dimension: number;
  unit?: DimensionUnit; // If missing, assumes 'pt'
};

/**
 * A LaTeX expression represent a sequence of tokens that can be evaluated to
 * a value, such as a dimension.
 *
 * @category Registers
 */
export type LatexValue = { relax?: boolean } & (
  | Dimension
  | Glue
  | {
      string: string;
    }
  | {
      // For example "15"
      number: number;
      base?: 'decimal' | 'octal' | 'hexadecimal' | 'alpha'; // Default: 'decimal'
    }
  | {
      // Reference to a register
      register: string;
      factor?: number; // as in `2\thinmuskip` (default: 1)
      global?: boolean; // as in `\global\foo` (default: false)
    }
);
// | {
//     // Converts an expression to a sequence of tokens
//     type: 'the';
//     // \the<register> (a string representation of the register)
//     // \the<symbol-token> -> codepoint of this token (as a string)
//     // \the\font -> control sequence for the current font (not a string)
//     value: string; // Register or symbol (e.g. \alpha)
//   }
// | {
//     // Addition: change the value of the lhs register
//     type: 'advance';
//     lhs: string;
//     rhs: LatexValue;
//   }
// | {
//     // Multiplication: change the value of the lhs register
//     type: 'multiply';
//     lhs: string;
//     rhs: number;
//   }
// | {
//     // Division: change the value of the lhs register
//     type: 'divide';
//     lhs: string;
//     rhs: number;
//   }
// | {
//     // \register=<value>
//     type: 'assignment';
//     register: string;
//     value: LatexValue;
//   }

/**
 * TeX registers represent "variables" and "constants".
 *
 * Changing the values of some registers can modify the layout
 * of math expressions.
 *
 * The following registers might be of interest:
 *
 * - `thinmuskip`: space between items of math lists
 * - `medmuskip`: space between binary operations
 * - `thickmuskip`: space between relational operators
 * - `nulldelimiterspace`: minimum space to leave blank in delimiter constructions, for example around a fraction
 * - `delimitershortfall`: maximum space to overlap adjacent elements when a delimiter is too short
 * - `jot`: space between lines in an array, or between rows in a multiline construct
 * - `arraycolsep`: space between columns in an array
 * - `arraystretch`: factor by which to stretch the height of each row in an array
 *
 * To modify a register, use:
 *
 * ```javascript
 * mf.registers.arraystretch = 1.5;
 * mf.registers.thinmuskip = { dimension: 2, unit: "mu" };
 * mf.registers.medmuskip = "3mu";
 *```
 * @category Registers
 *
 */
export type Registers = Record<string, number | string | LatexValue>;

/**
 * A dictionary of LaTeX macros to be used to interpret and render the content.
 *
 * For example:
```javascript
mf.macros = { smallfrac: "^{#1}\\!\\!/\\!_{#2}" };
```
The code above will support the following notation:
```latex
\smallfrac{5}{16}
```
 * **See Also**
 * * [Macros Example](/mathfield/guides/macros/)
 *
 * @category Macros
 */
export type MacroDictionary = Record<
  string,
  string | Partial<MacroDefinition> | MacroPackageDefinition
>;

/** @internal */
export type BoxCSSProperties =
  | 'background-color'
  | 'border'
  | 'border-bottom'
  | 'border-color'
  | 'border-left'
  | 'border-radius'
  | 'border-right'
  | 'border-right-width'
  | 'border-top'
  | 'border-top-width'
  | 'box-sizing'
  | 'color'
  | 'display'
  | 'font-family'
  | 'left'
  | 'height' // @todo: remove
  | 'line-height'
  | 'margin-top'
  | 'margin-left'
  | 'margin-right'
  | 'opacity'
  | 'padding'
  | 'padding-left'
  | 'padding-right'
  | 'position'
  | 'top'
  | 'bottom'
  | 'vertical-align'
  | 'width' // @todo: remove
  | 'z-index';

/** @internal */
export type MatrixEnvironment =
  | 'matrix'
  | 'matrix*'
  | 'pmatrix'
  | 'pmatrix*'
  | 'bmatrix'
  | 'bmatrix*'
  | 'Bmatrix'
  | 'Bmatrix*'
  | 'vmatrix'
  | 'vmatrix*'
  | 'Vmatrix'
  | 'Vmatrix*';

/** @internal */
export type CasesEnvironment = 'cases' | 'dcases' | 'rcases';

/** @internal */
export type TabularEnvironment =
  | 'array'
  | 'equation'
  | 'equation*'
  | 'subequations'
  | 'multline'
  | 'align'
  | 'align*'
  | 'aligned'
  | 'eqnarray'
  | 'split'
  | 'gather'
  | 'gather*'
  | 'gathered'
  | 'lines'
  | 'multline'
  | 'multline*'
  | 'cases'
  | 'dcases'
  | 'rcases'
  | 'smallmatrix'
  | 'smallmatrix*'
  | CasesEnvironment
  | MatrixEnvironment;

/** @internal */
export type AlignEnvironment =
  | 'align'
  | 'align*'
  | 'aligned'
  | 'gather'
  | 'gather*'
  | 'gathered'
  | 'split'
  | 'multline';

/** @internal */
export type Environment =
  | 'math'
  | 'displaymath'
  | 'center'
  | TabularEnvironment;

/** @category MathJSON */
export declare type Expression =
  | number
  | string
  | { [key: string]: any }
  | [Expression, ...Expression[]];

/**
 *
| Format                | Description             |
| :-------------------- | :---------------------- |
| `"ascii-math"`        | A string of [ASCIIMath](http://asciimath.org/). |
| `"latex"`             | LaTeX rendering of the content, with LaTeX macros not expanded. |
| `"latex-expanded"`    | All macros are recursively expanded to their definition. |
| `"latex-unstyled"`    | Styling (background color, color) is ignored |
| `"latex-without-placeholders"`    | Replace `\placeholder` commands with their body |
| `"math-json"`         | A MathJSON abstract syntax tree, as an object literal formated as a JSON string. Note: you must import the CortexJS Compute Engine to obtain a result. |
| `"math-ml"`           | A string of MathML markup. |
| `"plain-text"`        | A plain text rendering of the content. |
| `"spoken"`            | Spoken text rendering, using the default format defined in config, which could be either text or SSML markup. |
| `"spoken-text"`       | A plain spoken text rendering of the content. |
| `"spoken-ssml"`       | A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS. |
| `"spoken-ssml-with-highlighting"`| Like `"spoken-ssml"` but with additional annotations necessary for synchronized highlighting (read aloud). |

   To use the`"math-json"` format the Compute Engine library must be loaded. Use for example:

```js
import "https://unpkg.com/@cortex-js/compute-engine?module";
```
   * @category Mathfield
   */
export type OutputFormat =
  | 'ascii-math'
  | 'latex'
  | 'latex-expanded'
  | 'latex-unstyled'
  | 'latex-without-placeholders'
  | 'math-json'
  | 'math-ml'
  | 'plain-text'
  | 'spoken'
  | 'spoken-text'
  | 'spoken-ssml'
  | 'spoken-ssml-with-highlighting';

/**
 * @category Mathfield
 */

export type InsertOptions = {
  /** If `"auto"` or omitted, the current mode is used */
  mode?: ParseMode | 'auto';
  /**
   * The format of the input string:
   *

| | |
|:------------|:------------|
|`"auto"`| The string is LaTeX fragment or command) (default)|
|`"latex"`| The string is a LaTeX fragment|
  *
  */
  format?: OutputFormat | 'auto';
  insertionMode?:
    | 'replaceSelection'
    | 'replaceAll'
    | 'insertBefore'
    | 'insertAfter';
  /**
   * Describes where the selection
   * will be after the insertion:

| | |
| :---------- | :---------- |
|`"placeholder"`| The selection will be the first available placeholder in the text that has been inserted (default)|
|`"after"`| The selection will be an insertion point after the inserted text|
|`"before"`| The selection will be an insertion point before the inserted text|
|`"item"`| The inserted text will be selected|
  */
  selectionMode?: 'placeholder' | 'after' | 'before' | 'item';

  silenceNotifications?: boolean;
  /** If `true`, the mathfield will be focused after
   * the insertion
   */
  focus?: boolean;
  /** If `true`, provide audio and haptic feedback
   */
  feedback?: boolean;
  /** If `true`, scroll the mathfield into view after insertion such that the
   * insertion point is visible
   */
  scrollIntoView?: boolean;

  style?: Style;
};

/**
 * @category Styles
 */

export type ApplyStyleOptions = {
  range?: Range;
  operation?: 'set' | 'toggle';
  silenceNotifications?: boolean;
};

/**
 * Some additional information about an element of the formula
 * returned by `mf.getElementInfo()`.
 *
 * @category Mathfield
 */

export type ElementInfo = {
  // start?: Offset;
  // end?: Offset;
  // parent?: ElementInfo;
  // kind?:
  //   | 'accent'
  //   | 'cell' // Inside a matrix or environment
  //   | 'box' // Inside a rectangular box
  //   | 'composition' // Inside an input-method composition
  //   | 'enclosure' // A more complex kind of box/annotation displayed around a subexpression
  //   | 'error'
  //   | 'numerator'
  //   | 'denominator'
  //   | 'group' // Delimited with braces
  //   | 'latex' // Raw LaTeX composition
  //   | 'overlap'
  //   | 'above'
  //   | 'below'
  //   | 'phantom'
  //   | 'placeholder'
  //   | 'superscript'
  //   | 'subscript'
  //   | 'radicand'
  //   | 'index'
  //   | 'body'
  //   | 'text';

  /** The depth in the expression tree. 0 for top-level elements */
  depth?: number;

  /** The bounding box of the element */
  bounds?: DOMRect;

  /** id associated with this element or its ancestor, set with `\htmlId` or
   `\cssId`
*/
  id?: string;

  /** HTML attributes associated with element or its ancestores, set with
   * `\htmlData`
   */
  data?: Record<string, string | undefined>;

  /** The mode (math, text or LaTeX) */
  mode?: ParseMode;

  /** A LaTeX representation of the element */
  latex?: string;

  /** The style (color, weight, variant, etc...) of this element. */
  style?: Style;
};

/**
 * Position of the caret/insertion point from the beginning of the formula.
 * The first position is 0. The last valid offset is `mf.lastOffset`.
 *
 * **See Also**
 * * {@linkcode Range}
 * @category Selection
 */
export type Offset = number;

/**
 * A pair of offsets (boundary points) that denote a fragment of a formula.
 *
 * A range is said to be **collapsed** when `start` and `end` are equal.
 *
 * When specifying a range, a negative offset can be used to indicate an
 * offset relative to the last valid offset, i.e. `-1` is the last valid
 * offset, `-2` is one offset before that, etc...
 *
 * A normalized range will always be such that start \<= end, start \>= 0,
 * end \>= 0,  start \< lastOffset, end \< lastOffset. All the methods return
 * a normalized range.
 *
 * **See Also**
 * * {@linkcode Offset}
 *
 * @category Selection
 */

export type Range = [start: Offset, end: Offset];

/**
 * A **selection** is a set of ranges (to support discontinuous selection, for
 * example when selecting a column in a matrix).
 *
 * If there is a single range and that range is collapsed, the selection is
 * collapsed.
 *
 * A selection can also have a **direction**. While many operations are
 * insensitive to the direction, a few are. For example, when selecting a
 * fragment of a formula from left to right, the direction of this range will
 * be `"forward"`.
 *
 * Pressing the left arrow key will sets the insertion at the start of the
 * range.
 *
 * Conversely, if the selection is made from right to left, the direction is
 * `"backward"` and pressing the left arrow key will set the insertion point at
 * the end of the range.
 *
 * **See Also**
 * * {@linkcode Offset}
 * * {@linkcode Range}
 * @category Selection
 */
export type Selection = {
  ranges: Range[];
  direction?: 'forward' | 'backward' | 'none';
};
