import { Atom } from '../core/atom-class';
import { Span, makeVlist } from '../core/span';
import { Context } from '../core/context';
import type { Style } from '../public/core';

export type PhantomType =
  | 'phantom'
  | 'vphantom'
  | 'hphantom'
  | 'smash'
  | 'bsmash'
  | 'tsmash';
export class PhantomAtom extends Atom {
  readonly phantomType: PhantomType;
  private readonly isInvisible: boolean;
  constructor(
    command: string,
    body: Atom[],
    options: {
      phantomType?: PhantomType;
      isInvisible?: boolean;
      style: Style;
    }
  ) {
    super('phantom', { command, style: options.style });
    this.captureSelection = true;
    this.body = body;
    this.phantomType = options.phantomType;
    this.isInvisible = options.isInvisible ?? false;
  }

  render(context: Context): Span {
    if (this.phantomType === 'vphantom') {
      const content = new Span(Atom.render(context, this.body), {
        classes: 'inner',
      });
      content.setStyle('color', 'transparent');
      content.setStyle('backgroundColor', 'transparent');
      return new Span([content, new Span(null, { classes: 'fix' })], {
        classes: 'rlap',
        type: 'mord',
      });
    }

    if (
      this.phantomType === 'hphantom' ||
      this.phantomType === 'smash' ||
      this.phantomType === 'bsmash' ||
      this.phantomType === 'tsmash'
    ) {
      const content = new Span(Atom.render(context, this.body), {
        type: 'mord',
      });
      if (this.isInvisible) {
        content.setStyle('color', 'transparent');
        content.setStyle('backgroundColor', 'transparent');
      }

      if (this.phantomType !== 'bsmash') {
        content.height = 0;
      }

      if (this.phantomType !== 'tsmash') {
        content.depth = 0;
      }

      return new Span(makeVlist(context, [content]), { type: 'mord' });
    }

    return new Span(Atom.render(context, this.body), { type: 'mord' });
  }
}
