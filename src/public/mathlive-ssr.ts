/**
 * Server-side rendering exports.
 *
 * These functions do not require a DOM environment and can
 * be used from a server-side environment.
 *
 */

import { Atom } from '../core/atom-class';

import '../latex-commands/definitions';

import type {
  ComputeEngine,
  SemiBoxedExpression,
} from '@cortex-js/compute-engine';
import { toMathML } from '../formats/atom-to-math-ml';
import { Box, coalesce, makeStruts } from '../core/box';
import { Context } from '../core/context';
import { parseLatex } from '../core/parser';
import { atomToSpeakableText } from '../formats/atom-to-speakable-text';
import { Expression } from './mathfield-element';
import { validateLatex as validateLatexInternal } from '../core/parser';

import { atomToAsciiMath } from '../formats/atom-to-ascii-math';
import { parseMathString } from '../formats/parse-math-string';

import type { LatexSyntaxError, ParseMode } from './core-types';

import '../core/modes';
import { getDefaultContext } from '../core/context-utils';
import { applyInterBoxSpacing } from '../core/inter-box-spacing';

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
 *  href="https://unpkg.com/mathlive/dist/mathlive-static.css"
 * />
 * ```
 *
 *
 * @param text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param options.mathstyle If `"displaystyle"` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `"textstyle"` is used, the "text" mode of TeX is used, which is most
 * appropriate when displaying math "inline" with other text (on the same line).
 *
 * @category Conversion
 * @keywords convert, latex, markup
 */
export function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright';
    context?: unknown /* ContextInterface */;
  }
): string {
  options ??= {};
  options.mathstyle = options.mathstyle ?? 'displaystyle';
  let { mathstyle, letterShapeStyle, context } = options ?? {};
  mathstyle = mathstyle ?? 'displaystyle';
  letterShapeStyle = letterShapeStyle ?? 'tex';
  context ??= {};

  const effectiveContext = new Context({
    from: {
      ...getDefaultContext(),
      renderPlaceholder: () => new Box(0xa0, { maxFontSize: 1.0 }),
      letterShapeStyle,
      ...(context as any),
    },
    mathstyle,
  });

  //
  // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
  //
  const root = new Atom({
    mode: 'math',
    type: 'root',
    body: parseLatex(text, {
      context: effectiveContext,
      parseMode: 'math',
      mathstyle,
    }),
  });

  //
  // 2. Transform the math atoms into elementary boxes
  // for example from genfrac to VBox.
  //
  const box = root.render(effectiveContext);

  if (!box) return '';

  //
  // 3. Simplify by coalescing adjacent boxes
  //    for example, from <span>1</span><span>2</span>
  //    to <span>12</span>
  //
  coalesce(applyInterBoxSpacing(box, effectiveContext));

  //
  // 4. Wrap the expression with struts
  //
  const struts = makeStruts(box, { classes: 'ML__latex' });

  //
  // 5. Generate markup
  //

  return struts.toMarkup();
}

export function validateLatex(s: string): LatexSyntaxError[] {
  return validateLatexInternal(s, { context: getDefaultContext() });
}

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

export function convertLatexToMathMl(
  latex: string,
  options: { generateID?: boolean } = {}
): string {
  return toMathML(
    parseLatex(latex, {
      parseMode: 'math',
      args: () => '', // Prevent #0 arguments to be replaced with placeholder (default behavior)
      mathstyle: 'displaystyle',
    }),
    options
  );
}

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
export function convertLatexToSpeakableText(latex: string): string {
  const atoms = parseLatex(latex, {
    parseMode: 'math',
    mathstyle: 'displaystyle',
  });

  return atomToSpeakableText(atoms);
}

let gComputeEngine: ComputeEngine;

/**
 * Convert a MathJSON expression to a LaTeX string.
 *
 * ```js
 * convertMathJsonToLatex(["Add", 1, 2]);
 * // -> "1 + 2"
 * ```
 * @category Conversion
 */
export function convertMathJsonToLatex(json: Expression): string {
  if (!gComputeEngine) {
    const ComputeEngineCtor =
      globalThis[Symbol.for('io.cortexjs.compute-engine')]?.ComputeEngine;

    if (ComputeEngineCtor) gComputeEngine = new ComputeEngineCtor();
    else {
      console.error(
        `MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.
        
        Load the library, for example with:
        
        import "https://unpkg.com/@cortex-js/compute-engine?module"`
      );
    }
  }
  return gComputeEngine?.box(json as SemiBoxedExpression).latex ?? '';
}

/** Convert a LaTeX string to a string of AsciiMath.
 *
 * ```js
 * convertLatexToAsciiMath("\\frac{1}{2}");
 * // -> "1/2"
 * ```
 * @category Conversion
 */
export function convertLatexToAsciiMath(
  latex: string,
  parseMode: ParseMode = 'math'
): string {
  return atomToAsciiMath(
    new Atom({ type: 'root', body: parseLatex(latex, { parseMode }) })
  );
}

/**
 * Convert an AsciiMath string to a LaTeX string.
 *
 * ```js
 * convertAsciiMathToLatex("1/2");
 * // -> "\\frac{1}{2}"
 * ```
 * @category Conversion
 */
export function convertAsciiMathToLatex(ascii: string): string {
  return parseMathString(ascii, { format: 'ascii-math' })[1];
}
