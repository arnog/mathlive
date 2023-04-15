/* eslint-disable no-new */
import { Mode } from './modes-utils';
import { Atom, ToLatexOptions } from './atom';

import { LatexAtom } from '../core-atoms/latex';
import type { GlobalContext } from '../core/types';

export class LatexMode extends Mode {
  constructor() {
    super('latex');
  }

  createAtom(command: string, context: GlobalContext): Atom | null {
    return new LatexAtom(command, context);
  }

  serialize(run: Atom[], _options: ToLatexOptions): string[] {
    return [
      run
        .filter((x) => x instanceof LatexAtom && !x.isSuggestion)
        .map((x) => x.value)
        .join(''),
    ];
  }

  applyStyle(): string | null {
    return null;
  }
}

new LatexMode();
