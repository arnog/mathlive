import { Atom, ToLatexOptions } from './atom-class';
import type { Box } from './box';
import type {
  FontSeries,
  FontShape,
  FontSize,
  ParseMode,
  Style,
  Variant,
  VariantStyle,
} from '../public/core-types';
import {
  TokenDefinition,
  getDefinition,
} from '../core-definitions/definitions-utils';
import { joinLatex, latexCommand } from './tokenizer';
import { FontName } from './font-metrics';

export abstract class Mode {
  static _registry: Record<string, Mode> = {};
  constructor(name: string) {
    Mode._registry[name] = this;
  }

  static createAtom(
    mode: ParseMode,
    command: string,
    style?: Style
  ): Atom | null {
    return Mode._registry[mode].createAtom(
      command,
      getDefinition(command, mode),
      style
    );
  }

  static serialize(atoms: Atom[] | undefined, options: ToLatexOptions): string {
    if (!atoms || atoms.length === 0) return '';

    if (options.skipStyles ?? false) {
      const body: string[] = [];
      for (const run of getModeRuns(atoms)) {
        const mode = Mode._registry[run[0].mode];
        body.push(...mode.serialize(run, options));
      }
      return joinLatex(body);
    }

    return joinLatex(emitFontSizeRun(atoms, options));
  }

  static getFont(
    mode: ParseMode,
    box: Box,
    style: {
      // For math mode
      letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright';
      variant?: Variant;
      variantStyle?: VariantStyle;

      // For text mode
      fontFamily?: string;
      fontShape?: FontShape;
      fontSeries?: FontSeries;
    }
  ): FontName | null {
    return Mode._registry[mode].getFont(box, style);
  }

  abstract createAtom(
    command: string,
    info: TokenDefinition | null,
    style?: Style
  ): Atom | null;

  abstract serialize(run: Atom[], options: ToLatexOptions): string[];

  /*
   * Calculate the effective font name to be used for metrics
   * ('Main-Regular', 'Caligraphic-Regular' etc...)
   */
  abstract getFont(
    box: Box,
    style: {
      variant?: Variant;
      variantStyle?: VariantStyle;
      fontFamily?: string;
      fontShape?: FontShape;
      fontSeries?: FontSeries;
      fontSize?: FontSize | 'auto';
      letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright';
    }
  ): FontName | null;
}

/*
 * Return an array of runs with the same mode
 */
export function getModeRuns(atoms: Atom[]): Atom[][] {
  const result: Atom[][] = [];
  let run: Atom[] = [];
  let currentMode = 'NONE';
  for (const atom of atoms) {
    if (atom.type !== 'first') {
      if (atom.mode !== currentMode) {
        if (run.length > 0) result.push(run);
        run = [atom];
        currentMode = atom.mode;
      } else run.push(atom);
    }
  }
  // Push whatever is left
  if (run.length > 0) result.push(run);
  return result;
}

/*
 * Return an array of runs (array of atoms with the same value
 *   for the specified property)
 */
export function getPropertyRuns(
  atoms: Atom[],
  property: keyof Style
): Atom[][] {
  const result: Atom[][] = [];
  let run: Atom[] = [];
  let currentValue: string | number | undefined = undefined;
  for (const atom of atoms) {
    if (atom.type !== 'first' && atom.style) {
      let value: string | number | undefined;
      if (property === 'variant') {
        value = atom.style.variant;
        if (atom.style.variantStyle && atom.style.variantStyle !== 'up')
          value += '-' + atom.style.variantStyle;
      } else value = atom.style[property];

      if (value === currentValue) {
        // Same value, add it to the current run
        run.push(atom);
      } else {
        // The value of property for this atom is different from the
        // current value, start a new run
        if (run.length > 0) result.push(run);
        run = [atom];
        currentValue = value;
      }
    }
  }

  // Push whatever is left
  if (run.length > 0) result.push(run);
  return result;
}

function emitColorRun(run: Atom[], options: ToLatexOptions): string[] {
  const { parent } = run[0];
  const parentColor = parent?.computedStyle.color;

  const result: string[] = [];
  // Since `\textcolor{}` applies to both text and math mode, wrap mode first, then
  // textcolor
  for (const modeRun of getModeRuns(run)) {
    const mode = options.defaultMode;

    for (const colorRun of getPropertyRuns(modeRun, 'color')) {
      const style = colorRun[0].computedStyle;
      const body = Mode._registry[colorRun[0].mode].serialize(colorRun, {
        ...options,
        defaultMode: mode === 'text' ? 'text' : 'math',
      });
      if (
        !options.skipStyles &&
        style.color &&
        style.color !== 'none' &&
        (!parent || parentColor !== style.color)
      ) {
        result.push(
          latexCommand(
            '\\textcolor',
            style.verbatimColor ?? style.color,
            joinLatex(body)
          )
        );
      } else result.push(joinLatex(body));
    }
  }

  return result;
}

function emitBackgroundColorRun(
  run: Atom[],
  options: ToLatexOptions
): string[] {
  const { parent } = run[0];
  const parentColor = parent?.computedStyle.backgroundColor;
  return getPropertyRuns(run, 'backgroundColor').map((x) => {
    if (x.length > 0 || x[0].type !== 'box') {
      const style = x[0].computedStyle;
      if (
        style.backgroundColor &&
        style.backgroundColor !== 'none' &&
        (!parent || parentColor !== style.backgroundColor)
      ) {
        return latexCommand(
          '\\colorbox',
          style.verbatimBackgroundColor ?? style.backgroundColor,
          joinLatex(emitColorRun(x, { ...options, defaultMode: 'text' }))
        );
      }
    }
    return joinLatex(emitColorRun(x, options));
  });
}

function emitFontSizeRun(run: Atom[], options: ToLatexOptions): string[] {
  if (run.length === 0) return [];
  const { parent } = run[0];
  const contextFontsize = parent?.computedStyle.fontSize;
  const result: string[] = [];
  for (const sizeRun of getPropertyRuns(run, 'fontSize')) {
    const fontsize = sizeRun[0].computedStyle.fontSize;
    const body = emitBackgroundColorRun(sizeRun, options);
    if (body) {
      if (
        fontsize &&
        fontsize !== 'auto' &&
        (!parent || contextFontsize !== fontsize)
      ) {
        result.push(
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
          ][fontsize],
          ...body
        );
      } else result.push(...body);
    }
  }

  return result;
}
