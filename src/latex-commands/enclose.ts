import type { CreateAtomOptions } from 'core/types';
import {
  EncloseAtom,
  EncloseAtomOptions,
  Notations,
} from '../atoms/enclose';

import { argAtoms, defineFunction } from './definitions-utils';
import type { Argument } from './types';

// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
/** The notation names accepted by `\\enclose`. */
const NOTATION_NAMES: ReadonlySet<keyof Notations> = new Set<keyof Notations>([
  'downdiagonalstrike',
  'updiagonalstrike',
  'verticalstrike',
  'horizontalstrike',
  'updiagonalarrow',
  'right',
  'bottom',
  'left',
  'top',
  'circle',
  'roundedbox',
  'madruwb',
  'actuarial',
  'box',
  'phasorangle',
  'longdiv',
]);

/**
 * Split `s` at each occurrence of `separator` that is not inside parentheses
 * and not inside a double-quoted string. Empty items are dropped.
 */
export function splitTopLevel(s: string, separator: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inQuote = false;
  let current = '';
  for (const c of s) {
    if (c === '"') inQuote = !inQuote;
    else if (!inQuote && c === '(') depth += 1;
    else if (!inQuote && c === ')') depth = Math.max(0, depth - 1);
    if (c === separator && depth === 0 && !inQuote) {
      if (current.length > 0) result.push(current);
      current = '';
    } else current += c;
  }
  if (current.length > 0) result.push(current);
  return result;
}

defineFunction('enclose', '{notation:string}[style:string]{body:auto}', {
  createAtom: (
    atomOptions: CreateAtomOptions<
      [string | null, string | null, Argument | null]
    >
  ) => {
    const args = atomOptions.args!;
    const options: EncloseAtomOptions = {
      strokeColor: 'currentColor',
      strokeWidth: '',
      strokeStyle: 'solid',
      backgroundcolor: 'transparent',
      padding: 'auto',
      shadow: 'none',
      svgStrokeStyle: undefined,
      borderStyle: undefined,
      style: atomOptions.style ?? {},
    };

    // Extract info from style string
    if (args[1]) {
      // Split the string by comma delimited sub-strings, ignoring commas
      // that are inside parentheses or inside double quotes. For example
      // `x, rgb(a, b, c), shadow="1px 1px rgba(0, 0, 0, .5)"` returns
      // `['x', 'rgb(a, b, c)', 'shadow="1px 1px rgba(0, 0, 0, .5)"']`.
      const styles = splitTopLevel(args[1], ',');
      for (const s of styles) {
        // Try the `name="value"` form first. The value may contain spaces
        // (for example `shadow="1px 1px red"`), so it must be checked before
        // the `width style color` border shorthand, which also matches
        // space-separated tokens.
        const attribute = s.match(/^\s*([a-z]*)\s*=\s*"(.*)"\s*$/);
        if (attribute) {
          if (attribute[1] === 'mathbackground')
            options.backgroundcolor = attribute[2];
          else if (attribute[1] === 'mathcolor')
            options.strokeColor = attribute[2];
          else if (attribute[1] === 'padding') options.padding = attribute[2];
          else if (attribute[1] === 'shadow') options.shadow = attribute[2];
        } else {
          const shorthand = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
          if (shorthand) {
            options.strokeWidth = shorthand[1];
            options.strokeStyle = shorthand[2];
            options.strokeColor = shorthand[3];
          }
        }
      }

      if (options.strokeStyle === 'dashed') options.svgStrokeStyle = '5,5';
      else if (options.strokeStyle === 'dotted') options.svgStrokeStyle = '1,5';
    }

    options.borderStyle = `${options.strokeWidth} ${options.strokeStyle} ${options.strokeColor}`;

    // Normalize the list of notations. Only known notation names are kept:
    // the names are written into the `notation` attribute of the MathML
    // `<menclose>` element, so an arbitrary string must not get through.
    const notation: Notations = {};
    (args[0] ?? '')
      .split(/[, ]/)
      .filter((v) => v.length > 0)
      .forEach((x) => {
        const name = x.toLowerCase();
        if (NOTATION_NAMES.has(name as keyof Notations))
          notation[name as keyof Notations] = true;
      });

    return new EncloseAtom(
      atomOptions.command!,
      argAtoms(args[2]),
      notation,
      options
    );
  },
});

defineFunction('cancel', '{body:auto}', {
  createAtom: (options) =>
    new EncloseAtom(
      options.command!,
      argAtoms(options.args![0]),
      { updiagonalstrike: true },
      {
        strokeColor: 'currentColor',
        strokeWidth: '',
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'none',
        style: options.style ?? {},
      }
    ),
});

defineFunction('bcancel', '{body:auto}', {
  createAtom: (options) =>
    new EncloseAtom(
      options.command!,
      argAtoms(options.args![0]),
      { downdiagonalstrike: true },
      {
        strokeColor: 'currentColor',
        strokeWidth: '',
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'none',
        style: options.style ?? {},
      }
    ),
});

defineFunction('xcancel', '{body:auto}', {
  createAtom: (options) =>
    new EncloseAtom(
      options.command!,
      argAtoms(options.args![0]),
      { updiagonalstrike: true, downdiagonalstrike: true },
      {
        strokeColor: 'currentColor',
        strokeWidth: '',
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'none',
        style: options.style ?? {},
      }
    ),
});
