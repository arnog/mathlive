import { LatexAtom } from '../core-atoms/latex';
import { Atom, ToLatexOptions } from './atom';
/* eslint-disable no-new */
import { Mode } from './modes-utils';

export class LatexMode extends Mode {
  constructor() {
    super('latex');
  }

  createAtom(command: string): Atom | null {
    return new LatexAtom(command);
  }

  serialize(run: Atom[], _options: ToLatexOptions): string[] {
    return run
      .filter((x) => x instanceof LatexAtom && !x.isSuggestion)
      .map((x) => x.value);
  }

  getFont(): null {
    return null;
  }
}

new LatexMode();
