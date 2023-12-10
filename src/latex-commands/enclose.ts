import type { CreateAtomOptions } from 'core/types';
import { EncloseAtom, EncloseAtomOptions } from '../atoms/enclose';

import { argAtoms, defineFunction } from './definitions-utils';
import type { Argument } from './types';

// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
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
      // that may be inside (). For example"x, rgb(a, b, c)" would return
      // ['x', 'rgb(a, b, c)']
      const styles = args[1].split(/,(?![^(]*\)(?:(?:[^(]*\)){2})*[^"]*$)/);
      for (const s of styles) {
        const shorthand = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
        if (shorthand) {
          options.strokeWidth = shorthand[1];
          options.strokeStyle = shorthand[2];
          options.strokeColor = shorthand[3];
        } else {
          const attribute = s.match(/\s*([a-z]*)\s*=\s*"(.*)"/);
          if (attribute) {
            if (attribute[1] === 'mathbackground')
              options.backgroundcolor = attribute[2];
            else if (attribute[1] === 'mathcolor')
              options.strokeColor = attribute[2];
            else if (attribute[1] === 'padding') options.padding = attribute[2];
            else if (attribute[1] === 'shadow') options.shadow = attribute[2];
          }
        }
      }

      if (options.strokeStyle === 'dashed') options.svgStrokeStyle = '5,5';
      else if (options.strokeStyle === 'dotted') options.svgStrokeStyle = '1,5';
    }

    options.borderStyle = `${options.strokeWidth} ${options.strokeStyle} ${options.strokeColor}`;

    // Normalize the list of notations.
    const notation = {};
    (args[0] ?? '')
      .split(/[, ]/)
      .filter((v) => v.length > 0)
      .forEach((x) => {
        notation[x.toLowerCase()] = true;
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
