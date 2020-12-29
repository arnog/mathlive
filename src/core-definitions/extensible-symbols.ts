import { Argument, defineFunction } from './definitions-utils';
import type { Atom, ToLatexOptions } from '../core/atom-class';
import { OverunderAtom } from '../core-atoms/overunder';
import { Style } from '../public/core';

// Extensible (horitontally stretchy) symbols

defineFunction(
  [
    'overrightarrow',
    'overleftarrow',
    'Overrightarrow',
    'overleftharpoon',
    'overrightharpoon',
    'overleftrightarrow',
    'overbrace',
    'overlinesegment',
    'overgroup',
  ],
  '{:auto}',
  {
    createAtom: (command: string, args: Argument[], style: Style): Atom =>
      new OverunderAtom(command, {
        body: args[0] as Atom[],
        style,
        // Set the "svgAbove" to the name of a SVG object (which is the same
        // as the command name)
        svgAbove: command.slice(1),
      }),
  }
);

defineFunction(
  [
    'underrightarrow',
    'underleftarrow',
    'underleftrightarrow',
    'underbrace',
    'underlinesegment',
    'undergroup',
  ],
  '{:auto}',
  {
    createAtom: (command: string, args: Argument[], style: Style): Atom =>
      new OverunderAtom(command, {
        body: args[0] as Atom[],
        style,
        // Set the "svgBelow" to the name of a SVG object (which is the same
        // as the command name)
        svgBelow: command.slice(1),
      }),
  }
);
defineFunction(
  [
    'xrightarrow',
    'xleftarrow',
    'xRightarrow',
    'xLeftarrow',
    'xleftharpoonup',
    'xleftharpoondown',
    'xrightharpoonup',
    'xrightharpoondown',
    'xlongequal',
    'xtwoheadleftarrow',
    'xtwoheadrightarrow',
    'xleftrightarrow',
    'xLeftrightarrow',
    'xrightleftharpoons',
    'xleftrightharpoons',
    'xhookleftarrow',
    'xhookrightarrow',
    'xmapsto',
    'xtofrom',
    'xrightleftarrows', // From mhchem.sty package
    'xrightequilibrium', // From mhchem.sty package
    'xleftequilibrium', // From mhchem.sty package
  ],
  '[:auto]{:auto}',
  {
    createAtom: (command: string, args: Argument[], style: Style): Atom =>
      new OverunderAtom(command, {
        style,
        // Set the "svgBody" to the name of a SVG object (which is the same
        // as the command name)
        svgBody: command.slice(1),
        // The overscript is optional, i.e. `\xtofrom` is valid
        above: (args[1] as Atom[])?.length === 0 ? null : (args[1] as Atom[]),
        below: args[0] as Atom[],
        skipBoundary: false,
        toLatexOverride: (atom: OverunderAtom, options: ToLatexOptions) =>
          command +
          (!atom.hasEmptyBranch('below')
            ? `[${atom.belowToLatex(options)}]`
            : '') +
          `{${atom.aboveToLatex(options)}}`,
      }),
  }
);
