import { Atom } from '../core/atom-class';
import { Span } from '../core/span';
import { Stack } from '../core/stack';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class LineAtom extends Atom {
  private readonly position: 'overline' | 'underline';
  constructor(
    command: string,
    body: Atom[],
    options: { position: 'overline' | 'underline'; style: Style }
  ) {
    super('line', { command, style: options.style });
    this.skipBoundary = true;
    this.body = body;
    this.position = options.position;
  }

  render(parentContext: Context): Span {
    // TeXBook:443. Rule 9 and 10
    const context = new Context(parentContext, this.style, 'cramp');
    const inner = Atom.render(context, this.body);
    const ruleWidth =
      context.metrics.defaultRuleThickness / context.scalingFactor;
    const line = new Span(null, { classes: this.position + '-line' });
    line.height = ruleWidth;
    line.maxFontSize = ruleWidth * 1.125 * context.scalingFactor;
    let stack: Span;
    if (this.position === 'overline') {
      stack = new Stack({
        shift: 0,
        children: [{ span: inner }, 3 * ruleWidth, { span: line }, ruleWidth],
      });
    } else {
      stack = new Stack({
        top: inner.height,
        children: [ruleWidth, { span: line }, 3 * ruleWidth, { span: inner }],
      });
    }

    if (this.caret) stack.caret = this.caret;
    return new Span(stack, {
      classes: this.position,
      type: 'mord',
    });
  }
}
