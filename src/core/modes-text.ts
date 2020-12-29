/* eslint-disable no-new */
import { ErrorListener, Style, ParserErrorCode } from '../public/core';
import { Mode, ParseTokensOptions, getPropertyRuns } from './modes-utils';
import { colorToString } from './color';
import { joinLatex, Token } from './tokenizer';
import { Span } from './span';
import { Atom, ToLatexOptions } from './atom';
import { getInfo, charToLatex } from '../core-definitions/definitions';
import { TextAtom } from '../core-atoms/text';

function emitStringTextRun(run: Atom[], options: ToLatexOptions): string {
  return joinLatex(run.map((x: Atom) => Atom.toLatex(x, options)));
}

function emitFontShapeTextRun(run: Atom[], options: ToLatexOptions): string {
  return joinLatex(
    getPropertyRuns(run, 'fontShape').map((x: Atom[]) => {
      const result = emitStringTextRun(x, options);
      const { fontShape } = x[0].style;
      if (fontShape === 'it') {
        return '\\textit{' + result + '}';
      }

      if (fontShape === 'sl') {
        return '\\textsl{' + result + '}';
      }

      if (fontShape === 'sc') {
        return '\\textsc{' + result + '}';
      }

      if (fontShape === 'n') {
        return '\\textup{' + result + '}';
      }

      if (fontShape) {
        return '\\fontshape{' + x[0].style.fontShape + '}' + result;
      }

      return result;
    })
  );
}

function emitFontSeriesTextRun(run: Atom[], options: ToLatexOptions): string {
  return joinLatex(
    getPropertyRuns(run, 'fontSeries').map((x) => {
      const result = emitFontShapeTextRun(x, options);
      const { fontSeries } = x[0].style;
      if (fontSeries === 'b') {
        return '\\textbf{' + result + '}';
      }

      if (fontSeries === 'l') {
        return '\\textlf{' + result + '}';
      }

      if (fontSeries === 'm') {
        return '\\textmd{' + result + '}';
      }

      if (fontSeries) {
        return '\\fontseries{' + fontSeries + '}' + result;
      }

      return result;
    })
  );
}

function emitSizeTextRun(run: Atom[], options: ToLatexOptions): string {
  return joinLatex(
    getPropertyRuns(run, 'fontSize').map((x: Atom[]) => {
      const result = emitFontSeriesTextRun(x, options);
      const command: string =
        {
          size1: 'tiny',
          size2: 'scriptsize',
          size3: 'footnotesize',
          size4: 'small',
          size5: 'normalsize',
          size6: 'large',
          size7: 'Large',
          size8: 'LARGE',
          size9: 'huge',
          size10: 'Huge',
        }[x[0].style.fontSize] || '';
      if (command) {
        return `\\${command} ${result}`;
      }

      return result;
    })
  );
}

function emitFontFamilyTextRun(run: Atom[], options: ToLatexOptions): string {
  return joinLatex(
    getPropertyRuns(run, 'fontFamily').map((x: Atom[]) => {
      const result = emitSizeTextRun(x, options);
      const command: string =
        {
          'roman': 'textrm',
          'monospace': 'texttt',
          'sans-serif': 'textsf',
        }[x[0].style.fontFamily] || '';
      if (command) return `\\${command}{${result}}`;

      if (x[0].style.fontFamily) {
        return '\\fontfamily{' + x[0].style.fontFamily + '}' + result;
      }

      return result;
    })
  );
}

function emitStyledTextRun(run: Atom[], options: ToLatexOptions): string {
  return emitFontFamilyTextRun(run, options);
}

function emitColorRun(run: Atom[], options: ToLatexOptions): string {
  if (!run || run.length === 0) return '';
  const parentColor = run[0].parent?.style.color;
  return joinLatex(
    getPropertyRuns(run, 'color').map((x) => {
      const result = emitStyledTextRun(x, options);

      if (
        x[0].style.color &&
        x[0].style.color !== 'none' &&
        parentColor !== x[0].style.color
      ) {
        // If there is a color specified, and it is different
        // from our context color, output a command
        return (
          '\\textcolor{' + colorToString(x[0].style.color) + '}{' + result + '}'
        );
      }

      return result;
    })
  );
}

const TEXT_FONT_CLASS: Record<string, string> = {
  'roman': '',
  'sans-serif': 'ML__sans',
  'monospace': 'ML__tt',
};

export class TextMode extends Mode {
  constructor() {
    super('text');
  }

  createAtom(command: string, style: Style): Atom | null {
    const info = getInfo(command, 'text');
    const value = info?.value ?? command;
    return new TextAtom(command, value, style);
  }

  toLatex(run: Atom[], options: ToLatexOptions): string {
    const result = emitColorRun(run, options);

    const allAtomsHaveShapeOrSeriesOrFontFamily = run.every(
      (x: Atom) => x.style.fontSeries || x.style.fontShape || x.style.fontFamily
    );
    if (!allAtomsHaveShapeOrSeriesOrFontFamily) {
      // Wrap in text, only if there isn't a shape or series on
      // all the atoms, because if so, it will be wrapped in a
      // \\textbf, \\textit, etc... and the \\text would be redundant
      return `\\text{${result}}`;
    }

    return result;
  }

  /**
   * Return the font-family name
   */
  applyStyle(span: Span, style: Style): string {
    const { fontFamily } = style;

    if (TEXT_FONT_CLASS[fontFamily]) {
      span.classes += ' ' + TEXT_FONT_CLASS[fontFamily];
    } else if (fontFamily) {
      // Not a well-known family. Use a style.
      span.setStyle('font-family', fontFamily);
    }

    if (style.fontShape) {
      span.classes += ' ';
      span.classes +=
        {
          it: 'ML__it',
          sl: 'ML__shape_sl', // Slanted
          sc: 'ML__shape_sc', // Small caps
          ol: 'ML__shape_ol', // Outline
        }[style.fontShape] ?? '';
    }

    if (style.fontSeries) {
      const m = style.fontSeries.match(/(.?[lbm])?(.?[cx])?/);
      if (m) {
        span.classes += ' ';
        span.classes +=
          {
            ul: 'ML__series_ul',
            el: 'ML__series_el',
            l: 'ML__series_l',
            sl: 'ML__series_sl',
            m: '', // Medium (default)
            sb: 'ML__series_sb',
            b: 'ML__bold',
            eb: 'ML__series_eb',
            ub: 'ML__series_ub',
          }[m[1] ?? ''] ?? '';
        span.classes += ' ';
        span.classes +=
          {
            uc: 'ML__series_uc',
            ec: 'ML__series_ec',
            c: 'ML__series_c',
            sc: 'ML__series_sc',
            n: '', // Normal (default)
            sx: 'ML__series_sx',
            x: 'ML__series_x',
            ex: 'ML__series_ex',
            ux: 'ML__series_ux',
          }[m[2] ?? ''] ?? '';
      }
    }

    // Always use the metrics of 'Main-Regular' in text mode
    return 'Main-Regular';
  }

  // Given an array of tokens, return an array of atoms
  // options.args
  // options.macros
  // options.smartFence
  // options.style
  // options.parser
  parse(
    tokens: Token[],
    error: ErrorListener<ParserErrorCode>,
    options: ParseTokensOptions
  ): [Atom[], Token[]] {
    let result = [];
    let atom: Atom;

    while (tokens.length > 0) {
      const token = tokens.shift();
      if (token === '<space>') {
        result.push(new TextAtom(' ', ' ', options.style));
      } else if (token.startsWith('\\')) {
        // Invoke the 'main' parser to handle the command
        tokens.unshift(token);
        let atoms: Atom[];
        [atoms, tokens] = options.parse('text', tokens, options);
        result = [...result, ...atoms];
      } else if (token === '<$>' || token === '<$$>') {
        // Mode-shift
        const subtokens = tokens.slice(
          0,
          tokens.findIndex((x: Token) => x === token)
        );
        tokens = tokens.slice(subtokens.length + 1);
        const [atoms] = options.parse('math', subtokens, options);
        result = [...result, ...atoms];
      } else if (token === '<{>' || token === '<}>') {
        // Spurious braces are ignored by TeX in text mode
        // In text mode, braces are sometimes used to separate adjacent
        // commands without inserting a space, e.g. "\backlash{}command"
      } else {
        const info = getInfo(token, 'text', options.macros);
        if (!info || (info.ifMode && !info.ifMode.includes('text'))) {
          error({ code: 'unexpected-token' });
        } else {
          atom = new TextAtom(token, info.value, options.style);
          atom.latex = charToLatex('text', token);
          result.push(atom);
        }
      }
    }

    return [result, tokens];
  }
}

// Singleton class
new TextMode();
