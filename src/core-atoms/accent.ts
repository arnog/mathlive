import { Context } from '../core/context';
import { Atom } from '../core/atom-class';

import { makeSVGBox, Box } from '../core/box';
import { VBox } from '../core/v-box';
import { Style } from '../public/core';
import { X_HEIGHT } from '../core/font-metrics';

export class AccentAtom extends Atom {
  private readonly accent?: number;
  private readonly svgAccent?: string;
  constructor(
    command: string,
    body: Atom[],
    options: { accentChar?: number; svgAccent?: string; style: Style }
  ) {
    super('accent', { command, style: options.style });
    if (options.accentChar) {
      this.accent = options.accentChar;
    } else {
      this.svgAccent = options?.svgAccent;
    }

    this.body = body;
    this.skipBoundary = true;
    // this.limits = 'accent'; // This will suppress the regular
    // supsub attachment and will delegate
    // it to the decomposeAccent
    // (any non-null value would do)
  }

  render(parentContext: Context): Box {
    const context = new Context(parentContext, this.style, 'cramp');
    // Accents are handled in the TeXbook pg. 443, rule 12.

    //
    // 1. Build the base atom
    //
    const base = Atom.createBox(context, this.body) ?? new Box(null);

    //
    // 2. Skew
    //
    // Calculate the skew of the accent.
    // > If the nucleus is not a single character, let s = 0; otherwise set s
    // > to the kern amount for the nucleus followed by the \skewchar of its
    // > font.
    // Note that our skew metrics are just the kern between each character
    // and the skewchar.
    let skew = 0;
    if (
      !this.hasEmptyBranch('body') &&
      this.body!.length === 2 &&
      this.body![1].isCharacterBox()
    ) {
      skew = base.skew;
    }

    //
    // 3. Calculate the amount of space between the base and the accent
    //
    let clearance = Math.min(base.height, X_HEIGHT);

    //
    // 4. Build the accent
    //
    let accentBox: Box;
    if (this.svgAccent) {
      accentBox = makeSVGBox(this.svgAccent);
      clearance = context.metrics.bigOpSpacing1 - clearance;
    } else if (this.accent) {
      // Build the accent
      const accent = new Box(this.accent, { fontFamily: 'Main-Regular' });
      // Remove the italic correction of the accent, because it only serves to
      // shift the accent over to a place we don't want.
      accent.italic = 0;
      // The \vec character that the fonts use is a combining character, and
      // thus shows up much too far to the left. To account for this, we add a
      // specific class which shifts the accent over to where we want it.
      const vecClass = this.accent === 0x20d7 ? ' ML__accent-vec' : '';
      accentBox = new Box(new Box(accent), {
        classes: 'ML__accent-body' + vecClass,
      });
    }

    //
    // 5. Combine the base and the accent
    //

    // Shift the accent over by the skew. Note we shift by twice the skew
    // because we are centering the accent, so by adding 2*skew to the left,
    // we shift it to the right by 1*skew.
    accentBox = new VBox({
      shift: 0,
      children: [
        { box: new Box(base) },
        -clearance,
        {
          box: accentBox!,
          marginLeft: base.left + 2 * skew,
          classes: ['ML__center'],
        },
      ],
    });

    const result = new Box(accentBox, { newList: true, type: 'mord' });
    if (this.caret) result.caret = this.caret;
    this.bind(context, result.wrap(context));
    return this.attachSupsub(context, { base: result });
  }
}
