import type { Atom } from '../core/atom-class';
import { EncloseAtom, EncloseAtomOptions } from '../core-atoms/enclose';

import { Argument, argAtoms, defineFunction } from './definitions-utils';
import type { Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
defineFunction('enclose', '{notation:string}[style:string]{body:auto}', {
  createAtom: (
    command: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom => {
    const options: EncloseAtomOptions = {
      strokeColor: 'currentColor',
      strokeWidth: '',
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
    ((args[0] as string) ?? '')
      .split(/[, ]/)
      .filter((v) => v.length > 0)
      .forEach((x) => {
        notation[x.toLowerCase()] = true;
      });

    return new EncloseAtom(
      command,
      argAtoms(args[2]),
      notation,
      context,
      options
    );
  },
});

defineFunction('cancel', '{body:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom =>
    new EncloseAtom(
      name,
      argAtoms(args[0]),
      { updiagonalstrike: true },
      context,
      {
        strokeColor: 'currentColor',
        strokeWidth: '',
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
  createAtom: (
    name: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom =>
    new EncloseAtom(
      name,
      argAtoms(args[0]),
      { downdiagonalstrike: true },
      context,
      {
        strokeColor: 'currentColor',
        strokeWidth: '',
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
  createAtom: (
    name: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom =>
    new EncloseAtom(
      name,
      argAtoms(args[0]),
      { updiagonalstrike: true, downdiagonalstrike: true },
      context,
      {
        strokeColor: 'currentColor',
        strokeWidth: '',
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        style,
      }
    ),
});
