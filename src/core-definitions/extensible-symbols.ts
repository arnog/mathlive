import type { ToLatexOptions } from '../core/atom-class';
import { OverunderAtom } from '../core-atoms/overunder';

import { Argument, argAtoms, defineFunction } from './definitions-utils';

// Extensible (horizontally stretchy) symbols

defineFunction(
  [
    'overrightarrow',
    'overleftarrow',
    'Overrightarrow',
    'overleftharpoon',
    'overrightharpoon',
    'overleftrightarrow',
    'overlinesegment',
    'overgroup',
  ],
  '{:auto}',
  {
    createAtom: (command, args: [Argument | null], style) =>
      new OverunderAtom(command, {
        body: argAtoms(args[0]),
        skipBoundary: false,
        supsubPlacement: 'over-under',
        paddedBody: true,
        boxType: 'rel',
        style,
        // Set the "svgAbove" to the name of a SVG object (which is the same
        // as the command name)
        svgAbove: command.slice(1),
      }),
  }
);
defineFunction('overbrace', '{:auto}', {
  createAtom: (command, args: [Argument | null], style) =>
    new OverunderAtom(command, {
      body: argAtoms(args[0]),
      skipBoundary: false,
      supsubPlacement: 'over-under',
      paddedBody: true,
      boxType: 'ord',
      style,
      svgAbove: command.slice(1),
    }),
});

defineFunction(
  [
    'underrightarrow',
    'underleftarrow',
    'underleftrightarrow',
    'underlinesegment',
    'undergroup',
  ],
  '{:auto}',
  {
    createAtom: (command, args: [Argument | null], style) =>
      new OverunderAtom(command, {
        body: argAtoms(args[0]),
        skipBoundary: false,
        supsubPlacement: 'over-under',
        paddedBody: true,
        boxType: 'rel',
        style,
        // Set the "svgBelow" to the name of a SVG object (which is the same
        // as the command name)
        svgBelow: command.slice(1),
      }),
  }
);
defineFunction(['underbrace'], '{:auto}', {
  createAtom: (command, args: [Argument | null], style) =>
    new OverunderAtom(command, {
      body: argAtoms(args[0]),
      skipBoundary: false,
      supsubPlacement: 'over-under',
      paddedBody: true,
      boxType: 'ord',
      style,
      svgBelow: command.slice(1),
    }),
});

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
    createAtom: (command, args: [Argument | null, Argument | null], style) =>
      new OverunderAtom(command, {
        style,
        // Set the "svgBody" to the name of a SVG object (which is the same
        // as the command name)
        svgBody: command.slice(1),
        // The overscript is optional, i.e. `\xtofrom` is valid
        above: argAtoms(args[1])?.length === 0 ? undefined : argAtoms(args[1]),
        below: argAtoms(args[0]) ?? null,
        skipBoundary: false,
        supsubPlacement: 'over-under',
        paddedBody: true,
        paddedLabels: true,
        boxType: 'rel',
      }),
    serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
      atom.command +
      (!atom.hasEmptyBranch('below') ? `[${atom.belowToLatex(options)}]` : '') +
      `{${atom.aboveToLatex(options)}}${atom.supsubToLatex(options)}`,
  }
);
