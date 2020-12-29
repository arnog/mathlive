import { Atom, ToLatexOptions } from '../core/atom-class';
import { MATHSTYLES } from '../core/mathstyle';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import {
  makeVlist,
  depth as spanDepth,
  height as spanHeight,
  Span,
} from '../core/span';
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

  render(context: Context): Span[] {
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

    // Calculate the clearance between the body and line
    let lineClearance = ruleWidth + phi / 4;
    const innerTotalHeight = Math.max(
      2 * phi,
      (spanHeight(inner) + spanDepth(inner)) * mathstyle.sizeMultiplier
    );
    const minDelimiterHeight = innerTotalHeight + (lineClearance + ruleWidth);

    // Create a \surd delimiter of the required minimum size
    const delim = this.bind(
      context,
      new Span(
        makeCustomSizedDelim('', '\\surd', minDelimiterHeight, false, context),
        'sqrt-sign'
      )
    );
    delim.applyStyle(this.mode, this.style);

    const delimDepth = delim.height + delim.depth - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > spanHeight(inner) + spanDepth(inner) + lineClearance) {
      lineClearance =
        (lineClearance + delimDepth - (spanHeight(inner) + spanDepth(inner))) /
        2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    delim.setTop(
      delim.height - spanHeight(inner) - (lineClearance + ruleWidth)
    );
    const line = new Span(
      null,
      context.mathstyle.adjustTo(MATHSTYLES.textstyle) + ' sqrt-line'
    );
    line.applyStyle(this.mode, this.style);
    line.height = ruleWidth;

    const body = makeVlist(context, [inner, lineClearance, line, ruleWidth]);

    let className = 'sqrt';
    if (this.containsCaret) className += ' ML__contains-caret';

    if (!this.above) {
      const result = new Span([delim, body], className, 'mord');
      if (this.caret) result.caret = this.caret;
      return [this.bind(context, result)];
    }

    // Handle the optional root index
    // The index is always in scriptscript style
    const newcontext = context.clone({
      mathstyle: MATHSTYLES.scriptscriptstyle,
    });
    const root = new Span(
      Atom.render(newcontext, this.above),
      mathstyle.adjustTo(MATHSTYLES.scriptscriptstyle)
    );
    // Figure out the height and depth of the inner part
    const innerRootHeight = Math.max(delim.height, body.height);
    const innerRootDepth = Math.max(delim.depth, body.depth);
    // The amount the index is shifted by. This is taken from the TeX
    // source, in the definition of `\r@@t`.
    const toShift = 0.6 * (innerRootHeight - innerRootDepth);
    // Build a VList with the superscript shifted up correctly
    const rootVlist = makeVlist(context, [root], 'shift', -toShift);

    // Add a class surrounding it so we can add on the appropriate
    // kerning

    const result = new Span(
      [new Span(rootVlist, 'root'), delim, body],
      className,
      'mord'
    );
    result.height = delim.height;
    result.depth = delim.depth;
    if (this.caret) result.caret = this.caret;
    return [this.bind(context, result)];
  }
}
