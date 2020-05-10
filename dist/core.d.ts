/**
 * The mode that indicates how a portion of content is interpreted
 *
 * @deprecated The 'command'mode will be dropped in a future release
 */
export declare type ParseMode = 'math' | 'text' | 'command';
/**
 * Error code passed to the [[`ParserErrorListener`]] function.
 *
 * See [[`MathfieldConfig`]], [[`latexToMarkup`]],  [[`latexToMathML`]],  [[`latexToAST`]],
 *
 *
    |  | |
    | ------------------ | ---      |
    | `unknown-command`             | There is no definition available for this command, e.g. `\zin`  |
    | `invalid-command`             | This command is not valid in the current mode (e.g. text command in math mode)  |
    | `unbalanced-braces`           |  There are too many or too few `{` or `}`  |
    | `unbalanced-environment`      |  An environment was open but never closed (`\begin{array}`}  |
    | `missing-argument`            |  A required argument is missing, e.g. `\frac{2}` |
    | `too-many-infix-commands`     | A group can include only one infix command (i.e. `\choose`, `\atop`). In general it's best to avoid infix commands.  |
    | `unexpected-command-in-string`| A command expected a string argument, but there was a command instead  |
    | `missing-unit`                |  An argument requiring a dimension was missing an unit.  |
    | `unexpected-delimiter`        |  An invalid symbol or command was used as a delimiter.  |
    | `unexpected-token`            |  An unexpected character was encountered.  |
    | `unexpected-end-of-string`    |  The end of the string was reached, but some required arguments were missing. |
 */
export declare type ParserErrorCode = 'unknown-command' | 'invalid-command' | 'unbalanced-braces' | 'unbalanced-environment' | 'missing-argument' | 'too-many-infix-commands' | 'unexpected-command-in-string' | 'missing-unit' | 'unexpected-delimiter' | 'unexpected-token' | 'unexpected-end-of-string';
export declare type ParserErrorListener = (err: {
    latex?: string;
    before?: string;
    after?: string;
    code: ParserErrorCode;
    arg?: string;
}) => void;
/**
 * Variants indicate a stylistic alternate for some characters.
 *
 * Typically, those are controlled with explicit commands, such as `\mathbb{}` or
 * `\mathfrak{}`. This type is used with the [[`$applyStyle`]] method to change
 * the styling of a range of selected characters.
 *
 * In mathematical notation these variants are used not only for visual
 * presentation, but they may have semantic significance.
 *
 * For example, the set ℂ should not be confused with the physical unit 𝖢 (Coulomb).
 *
 * When rendered, these variants can map to some built-in fonts.
 * Latex supports a limited set of characters. However, MathLive will
 * map characters not supported by Latex  fonts(double-stuck variant for digits
 * for example) to a Unicode character (see [Mathematical Alphanumeric Symbols on Wikipedia](https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols) ).
 *
 * `normal` is a synthetic variant that maps either to `main` (roman) or
 * `math` (italic) depending on the symbol and the `letterShapeStyle`.
 *
 * The `math` variant has italic characters as well as slightly different
 * letter shape and spacing (a bit more space after the "f" for example), so
 * it's not completely equivalent to a `main` variant with `italic` variant style
 * applied.
 */
export declare type Variant = 'ams' | 'double-struck' | 'calligraphic' | 'script' | 'fraktur' | 'sans-serif' | 'monospace' | 'normal' | 'main' | 'math';
/**
 * Some variants support stylistic variations.
 *
 * Note that these stylistic variations support a limited set of characters,
 * typically just uppercase and lowercase letters, and digits 0-9 in some cases.
 *
    | variant            | `up`       | `bold`       | `italic` | `bolditalic` |
    | ------------------ | ---        | ---          | ---      | --- |
    | `normal`           | ABCabc012  | 𝐀𝐁𝐂𝐚𝐛𝐜𝟎𝟏𝟐    | 𝐴𝐵𝐶𝑎𝑏𝑐   | 𝑨𝑩𝑪𝒂𝒃𝒄  |
    | `double-struck`    | 𝔸𝔹ℂ𝕒𝕓𝕔𝟘𝟙𝟚  | n/a          | n/a      | n/a  |
    | `calligraphic`     | 𝒜ℬ𝒞𝒶𝒷𝒸   | 𝓐𝓑𝓒𝓪𝓫𝓬      | n/a      | n/a  |
    | `fraktur`          | 𝔄𝔅ℭ𝔞𝔟𝔠     | 𝕬𝕭𝕮𝖆𝖇𝖈       | n/a      | n/a  |
    | `sans-serif`       | 𝖠𝖡𝖢𝖺𝖻𝖼𝟢𝟣𝟤   | 𝗔𝗕𝗖𝗮𝗯𝗰𝟬𝟭𝟮    | 𝘈𝘉𝘊𝘢𝘣𝘤    | 𝘼𝘽𝘾𝙖𝙗𝙘  |
    | `monospace`        | 𝙰𝙱𝙲𝚊𝚋𝚌     | n/a          | n/a      | n/a  |

 */
export declare type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';
export declare type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';
export declare type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';
export interface Style {
    mode?: ParseMode | string;
    color?: string;
    backgroundColor?: string;
    variant?: Variant;
    variantStyle?: VariantStyle;
    fontFamily?: string;
    fontShape?: FontShape;
    fontSeries?: FontSeries;
    fontSize?: string;
    cssId?: string;
    cssClass?: string;
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
}
export declare type MacroDefinition = {
    def: string;
    args?: number;
};
/**
 * A dictionary of LaTeX macros to be used to interpret and render the content.
 *
 * For example:
```typescript
mf.$setConfig({
    macros: {
        smallfrac: '^{#1}\\!\\!/\\!_{#2}',
    },
});
```
The code above will support the following notation:
```latex
\smallfrac{5}{16}
```
*/
export declare type MacroDictionary = {
    [name: string]: string | MacroDefinition;
};
