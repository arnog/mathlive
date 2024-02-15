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

 */
export type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';

export type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';

export type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';

export type FontFamily = 'none' | 'roman' | 'monospace' | 'sans-serif';

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
 * * {@link mathfield/guides/macros/|Macros Guide}
 *
 * @category Macros
 */
export type MacroDefinition = {
  /** Definition of the macro as a LaTeX expression */
  def: string;
  args?: number;
  captureSelection?: boolean;
  // If false, even if `expandMacro` is true, do not expand.
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
