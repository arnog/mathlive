/* 0.110.0 *//**
 * Server-side rendering exports.
 *
 * These functions do not require a DOM environment and can
 * be used from a server-side environment.
 *
 */
import { Expression } from './core-types';
import type { LatexSyntaxError, ParseMode } from './core-types';
import { LayoutOptions } from './options';
/**
 * Convert a LaTeX string to a string of HTML markup.
 *
 * :::info[Note]
 *
 * This function does not interact with the DOM. It does not load fonts or
 * inject stylesheets in the document. It can safely be used on the server side.
 * :::
 *
 * To get the output of this function to correctly display
 * in a document, use the mathlive static style sheet by adding the following
 * to the `<head>` of the document:
 *
 * ```html
 * <link
 *  rel="stylesheet"
 *  href="https://cdn.jsdelivr.net/npm/mathlive/mathlive-static.css"
 * />
 * ```
 *
 * or
 *
 * ```html
 * <link
 *  rel="stylesheet"
 *  href="https://unpkg.com/mathlive/mathlive-static.css"
 * />
 * ```
 *
 *
 *
 * @param text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param options.defaultMode If `"displaystyle"` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `"textstyle"` is used, the "text" mode of TeX is used, which is most
 * appropriate when displaying math "inline" with other text (on the same line).
 *
 * @category Conversion
 * @keywords convert, latex, markup
 */
export declare function convertLatexToMarkup(text: string, options?: Partial<LayoutOptions>): string;
/**
 * Check if a string of LaTeX is valid and return an array of syntax errors.
 *
 * @param options.macros Custom macro definitions to recognize during validation.
 * @category Conversion
 */
export declare function validateLatex(s: string, options?: Pick<LayoutOptions, 'macros'>): LatexSyntaxError[];
/**
 * Convert a LaTeX string to a string of MathML markup.
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @param options.generateID If true, add an `"extid"` attribute
 * to the MathML nodes with a value matching the `atomID`. This can be used
 * to map items on the screen with their MathML representation or vice-versa.
 *
 * @category Conversion
 */
export declare function convertLatexToMathMl(latex: string, options?: {
    generateID?: boolean;
}): string;
/**
 * Convert a LaTeX string to a textual representation ready to be spoken
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @return The spoken representation of the input LaTeX.
 * @example
 * console.log(convertLatexToSpeakableText('\\frac{1}{2}'));
 * // 'half'
 * @category Conversion
 * @keywords convert, latex, speech, speakable, text, speakable text
 */
export declare function convertLatexToSpeakableText(latex: string): string;
/**
 * Convert a MathJSON expression to a LaTeX string.
 *
 * ```js
 * convertMathJsonToLatex(["Add", 1, 2]);
 * // -> "1 + 2"
 * ```
 * @category Conversion
 */
export declare function convertMathJsonToLatex(json: Expression): string;
/** Convert a LaTeX string to a string of AsciiMath.
 *
 * ```js
 * convertLatexToAsciiMath("\\frac{1}{2}");
 * // -> "1/2"
 * ```
 * @category Conversion
 */
export declare function convertLatexToAsciiMath(latex: string, parseMode?: ParseMode): string;
/**
 * Convert an AsciiMath string to a LaTeX string.
 *
 * ```js
 * convertAsciiMathToLatex("1/2");
 * // -> "\\frac{1}{2}"
 * ```
 * @category Conversion
 */
export declare function convertAsciiMathToLatex(ascii: string): string;
