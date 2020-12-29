/* eslint-disable no-new */
import { Mode } from './modes-utils';
import { Atom, ToLatexOptions } from './atom';
import { LatexAtom } from '../core-atoms/latex';
import { Style } from '../public/core';

export class LatexMode extends Mode {
  constructor() {
    super('latex');
  }

  createAtom(command: string, _style: Style): Atom | null {
    return new LatexAtom(command);
  }

  toLatex(run: Atom[], _options: ToLatexOptions): string {
    return run
      .filter((x) => x instanceof LatexAtom && !x.isSuggestion)
      .map((x) => x.value)
      .join('');
  }
}

new LatexMode();
