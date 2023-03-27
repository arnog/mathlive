/**
 * Server-side rendering exports.
 *
 * These functions do not require a DOM environment and can
 * be used from a server-side environment.
 *
 */

declare module '@cortex-js/compute-engine';

import { Atom } from '../core/atom-class';

import { ComputeEngine, SemiBoxedExpression } from '@cortex-js/compute-engine';
import { toMathML } from '../addons/math-ml';
import { Box, adjustInterAtomSpacing, coalesce, makeStruts } from '../core/box';
import { Context } from '../core/context';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';
import { parseLatex } from '../core/parser';
import { atomToSpeakableText } from '../editor/atom-to-speakable-text';
import { Expression } from './mathfield-element';
import { validateLatex as validateLatexInternal } from '../core/parser';

import { atomToAsciiMath } from '../editor/atom-to-ascii-math';
import { parseMathString } from '../editor/parse-math-string';

import type { LatexSyntaxError, ParseMode } from './core-types';

import '../core/modes';
import { defaultGlobalContext } from '../core/context-utils';

/**
 * Convert a LaTeX string to a string of HTML markup.
 *
 * **(Note)**
 *
 * This function does not interact with the DOM. The function does not load
 * fonts or inject stylesheets in the document. It can be used
 * on the server side.
 *
 * To get the output of this function to correctly display
 * in a document, use the mathlive static style sheet by adding the following
 * to the `<head>` of the document:
 *
 * ```html
 * <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
 * ```
 *
 * ---
 *
 * @param text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param options.mathstyle If `"displaystyle"` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `"textstyle"` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline"
 * with other text (on the same line).
 *
 * @param  options.macros A dictionary of LaTeX macros
 *
 *
 * @category Converting
 * @keywords convert, latex, markup
 */
export function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    format?: string;
  }
): string {
  options = options ?? {};
  options.mathstyle = options.mathstyle ?? 'displaystyle';

  const globalContext = defaultGlobalContext();

  //
  // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
  //
  const root = new Atom('root', globalContext);
  root.body = parseLatex(text, globalContext, {
    parseMode: 'math',
    mathstyle: options.mathstyle,
  });

  //
  // 2. Transform the math atoms into elementary boxes
  // for example from genfrac to VBox.
  //
  const context = new Context(
    {
      registers: globalContext.registers,
      renderPlaceholder: () => new Box(0xa0, { maxFontSize: 1.0 }),
    },
    {
      fontSize: DEFAULT_FONT_SIZE,
      letterShapeStyle: globalContext.letterShapeStyle,
    },
    options.mathstyle
  );
  const box = root.render(context);

  if (!box) return '';

  //
  // 3. Adjust to `mord` according to TeX spacing rules
  //
  adjustInterAtomSpacing(box, context);

  //
  // 2. Simplify by coalescing adjacent boxes
  //    for example, from <span>1</span><span>2</span>
  //    to <span>12</span>
  //
  coalesce(box);

  //
  // 4. Wrap the expression with struts
  //
  const wrapper = makeStruts(box, { classes: 'ML__mathlive' });

  //
  // 5. Generate markup
  //

  return wrapper.toMarkup();
}

export function validateLatex(s: string): LatexSyntaxError[] {
  return validateLatexInternal(s, defaultGlobalContext());
}

/**
 * Convert a LaTeX string to a string of MathML markup.
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param options.generateId If true, add an `"extid"` attribute
 * to the MathML nodes with a value matching the `atomID`. This can be used
 * to map items on the screen with their MathML representation or vice-versa.
 * @param options.onError Callback invoked when an error is encountered while
 * parsing the input string.
 *
 * @category Converting
 */

export function convertLatexToMathMl(
  latex: string,
  options: { generateID?: boolean } = {}
): string {
  return toMathML(
    parseLatex(latex, defaultGlobalContext(), {
      parseMode: 'math',
      args: () => '',
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
 * @category Converting
 * @keywords convert, latex, speech, speakable, text, speakable text
 */
export function convertLatexToSpeakableText(latex: string): string {
  const atoms = parseLatex(latex, defaultGlobalContext(), {
    parseMode: 'math',
    mathstyle: 'displaystyle',
  });

  return atomToSpeakableText(atoms);
}

let gComputeEngine: ComputeEngine;

export function serializeMathJsonToLatex(json: Expression): string {
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

export function convertLatexToAsciiMath(
  latex: string,
  mode: ParseMode = 'math'
): string {
  const context = defaultGlobalContext();
  const root = new Atom('root', context);
  root.body = parseLatex(latex, context, { parseMode: mode });
  return atomToAsciiMath(root);
}

export function convertAsciiMathToLatex(ascii: string): string {
  return parseMathString(ascii, { format: 'ascii-math' })[1];
}
