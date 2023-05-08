import type { Style } from '../public/core-types';

import { Atom, AtomJson } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { VBox } from '../core/v-box';

export class LineAtom extends Atom {
  readonly position: 'overline' | 'underline';
  constructor(
    command: string,
    body: Atom[],
    options: { position: 'overline' | 'underline'; style: Style }
  ) {
    super({ type: 'line', command, style: options.style });
    this.skipBoundary = true;
    this.body = body;
    this.position = options.position;
  }

  static fromJson(json: AtomJson): LineAtom {
    return new LineAtom(json.command, json.body, json as any);
  }

  toJson(): AtomJson {
    return { ...super.toJson(), position: this.position };
  }

  render(parentContext: Context): Box | null {
    // TeXBook:443. Rule 9 and 10
    // > Math accents, and the operations \sqrt and \overline, change
    // > uncramped styles to their cramped counterparts; for example, D
    // > changes to D′, but D′ stays as it was. -- TeXBook p. 152
    const context = new Context(
      { parent: parentContext, mathstyle: 'cramp' },
      this.style
    );
    const inner = Atom.createBox(context, this.body);
    if (!inner) return null;
    const ruleWidth =
      context.metrics.defaultRuleThickness / context.scalingFactor;
    const line = new Box(null, { classes: this.position + '-line' });
    line.height = ruleWidth;
    line.maxFontSize = ruleWidth * 1.125 * context.scalingFactor;
    let stack: Box;
    if (this.position === 'overline') {
      stack = new VBox({
        shift: 0,
        children: [{ box: inner }, 3 * ruleWidth, { box: line }, ruleWidth],
      });
    } else {
      stack = new VBox({
        top: inner.height,
        children: [ruleWidth, { box: line }, 3 * ruleWidth, { box: inner }],
      });
    }

    if (this.caret) stack.caret = this.caret;
    return new Box(stack, { classes: this.position, type: 'skip' });
  }
}
