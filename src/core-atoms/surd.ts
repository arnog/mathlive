import { Atom, ToLatexOptions } from '../core/atom-class';
import { MATHSTYLES } from '../core/mathstyle';
import {
  METRICS as FONTMETRICS,
  SIZING_MULTIPLIER,
} from '../core/font-metrics';
import { makeVlist, Span } from '../core/span';
import { Context } from '../core/context';

import { makeCustomSizedDelim } from '../core/delimiters';
import { ParseMode, Style } from '../public/core';

export class SurdAtom extends Atom {
  constructor(
    command: string,
    options: { mode?: ParseMode; body: Atom[]; index: Atom[]; style: Style }
  ) {
    super('surd', {
      command,
      mode: options.mode ?? 'math',
      style: options.style,
    });
    this.body = options.body;
    this.above = options.index;
  }

  toLatex(options: ToLatexOptions): string {
    let args = '';
    if (this.above) {
      args += `[${this.aboveToLatex(options)}]`;
    }

    args += `{${this.bodyToLatex(options)}}`;
    return this.command + args;
  }

  render(context: Context): Span {
    // See the TeXbook pg. 443, Rule 11.
    // http://www.ctex.org/documents/shredder/src/texbook.pdf
    const { mathstyle } = context;
    // First, we do the same steps as in overline to build the inner group
    // and line
    const inner = Atom.render(context.cramp(), this.body) ?? new Span('');
    const ruleWidth =
      FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
    let phi = ruleWidth;
    if (mathstyle.id < MATHSTYLES.textstyle.id) {
      phi = mathstyle.metrics.xHeight;
    }

    const factor = SIZING_MULTIPLIER[this.style.fontSize] ?? 1;

    // Calculate the clearance between the body and line
    let lineClearance = factor * (ruleWidth + phi / 4);
    const innerTotalHeight = Math.max(
      factor * 2 * phi,
      inner.height + inner.depth
    );
    const minDelimiterHeight = innerTotalHeight + (lineClearance + ruleWidth);

    const delimContext = context.withFontsize(this.style?.fontSize ?? 'size5');
    // Create a \surd delimiter of the required minimum size
    const delim = this.bind(
      context,
      new Span(
        makeCustomSizedDelim(
          null,
          '\\surd',
          minDelimiterHeight,
          false,
          delimContext
        ),
        { classes: 'sqrt-sign', mode: this.mode, style: this.style }
      )
    );

    const delimDepth = delim.height + delim.depth - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > inner.height + inner.depth + lineClearance) {
      lineClearance =
        (lineClearance + delimDepth - (inner.height + inner.depth)) / 2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    delim.setTop(delim.height - inner.height - (lineClearance + ruleWidth));
    const line = new Span(null, {
      classes: context.mathstyle.adjustTo(MATHSTYLES.textstyle) + ' sqrt-line',
      mode: this.mode,
      style: this.style,
    });
    line.height = ruleWidth;

    const body = makeVlist(context, [
      new Span(inner),
      lineClearance,
      line,
      ruleWidth,
    ]);

    let className = 'sqrt';
    if (this.containsCaret) className += ' ML__contains-caret';

    if (!this.above) {
      const result = new Span([delim, body], {
        classes:
          className + context.parentMathstyle.adjustTo(context.mathstyle),
        type: 'mord',
      });
      if (this.caret) result.caret = this.caret;
      return this.bind(context, result);
    }

    // Handle the optional root index
    // The index is always in scriptscript style
    const root = Atom.render(
      context.clone({
        mathstyle: MATHSTYLES.scriptscriptstyle,
      }),
      this.above
    );
    // Figure out the height and depth of the inner part
    const innerRootHeight = Math.max(delim.height, body.height);
    const innerRootDepth = Math.max(delim.depth, body.depth);
    // The amount the index is shifted by. This is taken from the TeX
    // source, in the definition of `\r@@t`.
    const toShift = 0.6 * (innerRootHeight - innerRootDepth);
    // Build a VList with the superscript shifted up correctly
    const rootVlist = makeVlist(context, [root], 'shift', {
      initialPos: -toShift,
    });

    // Add a class surrounding it so we can add on the appropriate
    // kerning

    const result = new Span(
      [new Span(rootVlist, { classes: 'root' }), delim, body],
      {
        classes:
          className + context.parentMathstyle.adjustTo(context.mathstyle),
        type: 'mord',
      }
    );
    result.height = delim.height;
    result.depth = delim.depth;
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}
