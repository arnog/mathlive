import { Argument, defineFunction } from './definitions-utils';
import { convertDimenToPx } from '../core/font-metrics';
import type { Atom } from '../core/atom-class';
import { EncloseAtom, EncloseAtomOptions } from '../core-atoms/enclose';
import { Style } from '../public/core';

// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
defineFunction('enclose', '{notation:string}[style:string]{body:auto}', {
  createAtom: (command: string, args: Argument[], style: Style): Atom => {
    const options: EncloseAtomOptions = {
      strokeColor: 'currentColor',
      strokeWidth: 1,
      strokeStyle: 'solid',
      backgroundcolor: 'transparent',
      padding: 'auto',
      shadow: 'auto',
      svgStrokeStyle: undefined,
      borderStyle: undefined,
      style,
    };

    // Extract info from style string
    if (args[1]) {
      // Split the string by comma delimited sub-strings, ignoring commas
      // that may be inside (). For example"x, rgb(a, b, c)" would return
      // ['x', 'rgb(a, b, c)']
      const styles = (args[1] as string).split(
        /,(?![^(]*\)(?:(?:[^(]*\)){2})*[^"]*$)/
      );
      for (const s of styles) {
        const shorthand = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
        if (shorthand) {
          options.strokeWidth = convertDimenToPx(shorthand[1], 'px');
          if (!Number.isFinite(options.strokeWidth)) {
            options.strokeWidth = 1;
          }

          options.strokeStyle = shorthand[2];
          options.strokeColor = shorthand[3];
        } else {
          const attribute = s.match(/\s*([a-z]*)\s*=\s*"(.*)"/);
          if (attribute) {
            if (attribute[1] === 'mathbackground') {
              options.backgroundcolor = attribute[2];
            } else if (attribute[1] === 'mathcolor') {
              options.strokeColor = attribute[2];
            } else if (attribute[1] === 'padding') {
              options.padding = convertDimenToPx(attribute[2], 'px');
            } else if (attribute[1] === 'shadow') {
              options.shadow = attribute[2];
            }
          }
        }
      }

      if (options.strokeStyle === 'dashed') {
        options.svgStrokeStyle = '5,5';
      } else if (options.strokeStyle === 'dotted') {
        options.svgStrokeStyle = '1,5';
      }
    }

    options.borderStyle = `${options.strokeWidth}px ${options.strokeStyle} ${options.strokeColor}`;

    // Normalize the list of notations.
    const notation = {};
    ((args[0] as string) ?? '')
      .split(/[, ]/)
      .filter((v) => v.length > 0)
      .forEach((x) => {
        notation[x.toLowerCase()] = true;
      });

    return new EncloseAtom(command, args[2] as Atom[], notation, options);
  },
});

defineFunction('cancel', '{body:auto}', {
  createAtom: (name: string, args: Argument[], style: Style): Atom =>
    new EncloseAtom(
      name,
      args[0] as Atom[],
      { updiagonalstrike: true },
      {
        strokeColor: 'currentColor',
        strokeWidth: 1,
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        style,
      }
    ),
});

defineFunction('bcancel', '{body:auto}', {
  createAtom: (name: string, args: Argument[], style: Style): Atom =>
    new EncloseAtom(
      name,
      args[0] as Atom[],
      { downdiagonalstrike: true },
      {
        strokeColor: 'currentColor',
        strokeWidth: 1,
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        style,
      }
    ),
});

defineFunction('xcancel', '{body:auto}', {
  createAtom: (name: string, args: Argument[], style: Style): Atom =>
    new EncloseAtom(
      name,
      args[0] as Atom[],
      { updiagonalstrike: true, downdiagonalstrike: true },
      {
        strokeColor: 'currentColor',
        strokeWidth: 1,
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        style,
      }
    ),
});
