import type { ToLatexOptions } from '../core/atom-class';
import { OverunderAtom } from '../core-atoms/overunder';
import { argAtoms, defineFunction } from './definitions-utils';

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
    createAtom: (options) =>
      new OverunderAtom({
        ...options,
        body: argAtoms(options.args?.[0]),
        skipBoundary: false,
        supsubPlacement: 'over-under',
        paddedBody: true,
        boxType: 'rel',
        // Set the "svgAbove" to the name of a SVG object (which is the same
        // as the command name)
        svgAbove: options.command!.slice(1),
      }),
  }
);
defineFunction('overbrace', '{:auto}', {
  createAtom: (options) =>
    new OverunderAtom({
      ...options,
      body: argAtoms(options.args![0]),
      skipBoundary: false,
      supsubPlacement: 'over-under',
      paddedBody: true,
      boxType: 'ord',
      svgAbove: options.command!.slice(1),
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
    createAtom: (options) =>
      new OverunderAtom({
        ...options,
        body: argAtoms(options.args![0]),
        skipBoundary: false,
        supsubPlacement: 'over-under',
        paddedBody: true,
        boxType: 'rel',
        // Set the "svgBelow" to the name of a SVG object (which is the same
        // as the command name)
        svgBelow: options.command!.slice(1),
      }),
  }
);
defineFunction(['underbrace'], '{:auto}', {
  createAtom: (options) =>
    new OverunderAtom({
      ...options,
      body: argAtoms(options.args![0]),
      skipBoundary: false,
      supsubPlacement: 'over-under',
      paddedBody: true,
      boxType: 'ord',
      svgBelow: options.command!.slice(1),
    }),
});

defineFunction(
  [
    'xrightarrow',
    'longrightarrow', // From mhchem.sty package
    'xleftarrow',
    'longleftarrow', // From mhchem.sty package
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
    'longleftrightarrow', // From mhchem.sty package
    'xLeftrightarrow',
    'xrightleftharpoons', // From mhchem.sty package
    'longrightleftharpoons',
    'xleftrightharpoons',
    'xhookleftarrow',
    'xhookrightarrow',
    'xmapsto',
    'xtofrom',
    'xleftrightarrows', // From mhchem.sty package
    'longleftrightarrows', // From mhchem.sty package
    'xRightleftharpoons', // From mhchem.sty package
    'longRightleftharpoons', // From mhchem.sty package
    'xLeftrightharpoons', // From mhchem.sty package
    'longLeftrightharpoons', // From mhchem.sty package
  ],
  '[:auto]{:auto}',
  {
    createAtom: (options) =>
      new OverunderAtom({
        ...options,
        // Set the "svgBody" to the name of a SVG object (which is the same
        // as the command name)
        svgBody: options.command!.slice(1),
        // The overscript is optional, i.e. `\xtofrom` is valid
        above:
          argAtoms(options.args?.[1])?.length === 0
            ? undefined
            : argAtoms(options.args?.[1]),
        below: argAtoms(options.args?.[0]) ?? null,
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
