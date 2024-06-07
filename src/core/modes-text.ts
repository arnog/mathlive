/* eslint-disable no-new */

import { TextAtom } from '../atoms/text';

import type { Atom } from './atom';
import type { Box } from './box';
import { Mode, getPropertyRuns } from './modes-utils';
import type { FontSeries, FontShape, Style } from '../public/core-types';
import { joinLatex, latexCommand } from './tokenizer';
import type { TokenDefinition } from '../latex-commands/types';
import type { ToLatexOptions, FontName } from './types';

function emitStringTextRun(run: Atom[], options: ToLatexOptions): string[] {
  return run.map((x) => x._serialize(options));
}

function emitFontShapeTextRun(run: Atom[], options: ToLatexOptions): string[] {
  return getPropertyRuns(run, 'fontShape').map((x: Atom[]) => {
    const s = emitStringTextRun(x, options);
    const { fontShape } = x[0].style;

    let command = '';
    if (fontShape === 'it') command = '\\textit';
    if (fontShape === 'sl') command = '\\textsl';
    if (fontShape === 'sc') command = '\\textsc';
    if (fontShape === 'n') command = '\\textup';

    if (!command && fontShape)
      return `{${latexCommand('\\fontshape', fontShape)}${joinLatex(s)}}`;

    return command ? latexCommand(command, joinLatex(s)) : joinLatex(s);
  });
}

function emitFontSeriesTextRun(run: Atom[], options: ToLatexOptions): string[] {
  return getPropertyRuns(run, 'fontSeries').map((x) => {
    const s = emitFontShapeTextRun(x, options);
    const { fontSeries } = x[0].style;
    let command = '';
    if (fontSeries === 'b') command = '\\textbf';

    if (fontSeries === 'l') command = '\\textlf';

    if (fontSeries === 'm') command = '\\textmd';

    if (fontSeries && !command)
      return `{${latexCommand('\\fontseries', fontSeries)}${joinLatex(s)}}`;

    return command ? latexCommand(command, joinLatex(s)) : joinLatex(s);
  });
}

function emitSizeTextRun(run: Atom[], options: ToLatexOptions): string[] {
  return getPropertyRuns(run, 'fontSize').map((x: Atom[]) => {
    const s = emitFontSeriesTextRun(x, options);
    const command =
      [
        '',
        '\\tiny',
        '\\scriptsize',
        '\\footnotesize',
        '\\small',
        '\\normalsize',
        '\\large',
        '\\Large',
        '\\LARGE',
        '\\huge',
        '\\Huge',
      ][x[0].style.fontSize ?? ''] ?? '';

    return command ? `${command} ${joinLatex(s)}` : joinLatex(s);
  });
}

function emitFontFamilyTextRun(
  run: Atom[],
  options: ToLatexOptions,
  needsWrap: boolean
): string[] {
  return getPropertyRuns(run, 'fontFamily').map((x: Atom[]) => {
    needsWrap =
      needsWrap &&
      !x.every(
        (x) =>
          x.style.fontFamily ||
          x.style.fontShape ||
          x.style.fontSeries ||
          x.style.fontSize
      );
    const s = emitSizeTextRun(x, options);
    const { fontFamily } = x[0].style;
    const command =
      {
        'roman': 'textrm',
        'monospace': 'texttt',
        'sans-serif': 'textsf',
      }[fontFamily ?? ''] ?? '';
    if (command) return `\\${command}{${joinLatex(s)}}`;
    if (fontFamily)
      return `{\\fontfamily{${x[0].style.fontFamily}} ${joinLatex(s)}}`;

    if (needsWrap) return `\\text{${joinLatex(s)}}`;
    return joinLatex(s);
  });
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

  createAtom(
    command: string,
    info: TokenDefinition,
    style?: Style
  ): Atom | null {
    if (!info) return null;
    if (info.definitionType === 'symbol') {
      return new TextAtom(
        command,
        String.fromCodePoint(info.codepoint),
        style ?? {}
      );
    }
    return null;
  }

  serialize(run: Atom[], options: ToLatexOptions): string[] {
    return emitFontFamilyTextRun(
      run,
      {
        ...options,
        defaultMode: 'text',
      },
      options.defaultMode !== 'text'
    );
  }

  /**
   * Return the font-family name
   */
  getFont(
    box: Box,
    style: {
      fontFamily?: string;
      fontShape?: FontShape;
      fontSeries?: FontSeries;
    }
  ): FontName | null {
    const { fontFamily } = style;

    if (TEXT_FONT_CLASS[fontFamily!])
      box.classes += ' ' + TEXT_FONT_CLASS[fontFamily!];
    else if (fontFamily) {
      // Not a well-known family. Use a style.
      box.setStyle('font-family', fontFamily);
    }

    if (style.fontShape) {
      box.classes += ' ';
      box.classes +=
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
        box.classes += ' ';
        box.classes +=
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
        box.classes += ' ';
        box.classes +=
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
}

// Singleton class
new TextMode();
