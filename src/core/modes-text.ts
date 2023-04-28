/* eslint-disable no-new */

import { TextAtom } from '../core-atoms/text';

import { Atom, ToLatexOptions } from './atom';
import { Box } from './box';
import { Mode, getPropertyRuns } from './modes-utils';
import type { Style } from '../public/core-types';
import { joinLatex, latexCommand } from './tokenizer';
import { TokenDefinition } from 'core-definitions/definitions-utils';

function join(
  segments: [string[], boolean][]
): [tokens: string[], needsWrap: boolean] {
  return [
    segments.reduce((acc, x) => [...acc, ...x[0]], []),
    segments.map((x) => x[1]).some((x) => x === true),
  ];
}

/* Return a LaTeX string and a boolean indicating if the string needs to be
   wrapped with a mode changing command or not. */
function emitStringTextRun(
  run: Atom[],
  options: ToLatexOptions
): [string[], boolean] {
  return [run.map((x: Atom) => Atom.serialize(x, options)), true];
}

function emitFontShapeTextRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  return join(
    getPropertyRuns(run, 'fontShape').map((x: Atom[]) => {
      const [s, needsWrap] = emitStringTextRun(x, options);
      const { fontShape } = x[0].style;

      let command = '';
      if (fontShape === 'it') command = '\\textit';
      if (fontShape === 'sl') command = '\\textsl';
      if (fontShape === 'sc') command = '\\textsc';
      if (fontShape === 'n') command = '\\textup';

      if (!command && fontShape) {
        return [
          ['{', latexCommand('\\fontshape', fontShape), ...s, '}'],
          false,
        ];
      }
      return command ? [[latexCommand(command, ...s)], false] : [s, needsWrap];
    })
  );
}

function emitFontSeriesTextRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  return join(
    getPropertyRuns(run, 'fontSeries').map((x) => {
      const [s, needsWrap] = emitFontShapeTextRun(x, options);
      const { fontSeries } = x[0].style;
      let command = '';
      if (fontSeries === 'b') command = '\\textbf';

      if (fontSeries === 'l') command = '\\textlf';

      if (fontSeries === 'm') command = '\\textmd';

      if (fontSeries && !command) {
        return [
          [latexCommand('\\fontseries', fontSeries), '{', ...s, '}'],
          false,
        ];
      }

      return command ? [[latexCommand(command, ...s)], false] : [s, needsWrap];
    })
  );
}

function emitSizeTextRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  return join(
    getPropertyRuns(run, 'fontSize').map((x: Atom[]) => {
      const [s, needsWrap] = emitFontSeriesTextRun(x, options);
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

      return command ? [['{', command, ...s, '}'], needsWrap] : [s, needsWrap];
    })
  );
}

function emitFontFamilyTextRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  return join(
    getPropertyRuns(run, 'fontFamily').map((x: Atom[]) => {
      const [s, needsWrap] = emitSizeTextRun(x, options);
      const command: string =
        {
          'roman': 'textrm',
          'monospace': 'texttt',
          'sans-serif': 'textsf',
        }[x[0].style.fontFamily ?? ''] ?? '';
      if (command) return [[`\\${command}`, '{', ...s, '}'], false];

      if (x[0].style.fontFamily) {
        return [
          [`\\fontfamily`, '{', x[0].style.fontFamily!, '}', '{', ...s, '}'],
          needsWrap,
        ];
      }
      return [s, needsWrap];
    })
  );
}

function emitStyledTextRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  return emitFontFamilyTextRun(run, options);
}

function emitBackgroundColorRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  return join(
    getPropertyRuns(run, 'backgroundColor').map((x) => {
      const [s, needsWrap] = emitColorRun(x, options);
      const style = x[0].computedStyle;
      if (
        !(options.skipStyles ?? false) &&
        style.backgroundColor &&
        style.backgroundColor !== 'none'
      ) {
        return [
          [
            '\\colorbox',
            '{',
            style.verbatimBackgroundColor ?? style.backgroundColor,
            '}',
            '{',
            ...s,
            '}',
          ],
          false,
        ];
      }
      return [s, needsWrap];
    })
  );
}

function emitColorRun(
  run: Atom[],
  options: ToLatexOptions
): [tokens: string[], needsWrap: boolean] {
  if (!run || run.length === 0) return [[], false];
  const parentColor = run[0].parent?.style.color;
  return join(
    getPropertyRuns(run, 'color').map((x) => {
      const [s, needsWrap] = emitStyledTextRun(x, options);

      if (
        !(options.skipStyles ?? false) &&
        x[0].style.color &&
        x[0].style.color !== 'none' &&
        parentColor !== x[0].style.color
      ) {
        // If there is a color specified, and it is different
        // from our context color, output a command
        return [
          [
            '\\textcolor',
            '{',
            x[0].style.verbatimColor ?? x[0].style.color,
            '}',
            '{',
            ...s,
            '}',
          ],
          false,
        ];
      }

      return [s, needsWrap];
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
    let [result, needWrapper] = emitBackgroundColorRun(run, options);
    if ((options.skipModeCommand ?? false) === true) needWrapper = false;
    if (needWrapper) {
      result = [
        latexCommand(
          '\\text',
          joinLatex(
            result.map(
              (t) =>
                ({
                  '$': '\\$',
                  '{': '\\textbraceleft',
                  '}': '\\textbraceright',
                  '\\': '\\textbackslash',
                }[t] ?? t)
            )
          )
        ),
      ];
    }
    return result;
  }

  /**
   * Return the font-family name
   */
  applyStyle(box: Box, style: Style): string | null {
    const { fontFamily } = style;

    if (TEXT_FONT_CLASS[fontFamily!])
      box.classes += ' ' + TEXT_FONT_CLASS[fontFamily!] ?? '';
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
