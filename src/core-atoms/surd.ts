import { Atom, ToLatexOptions } from '../core/atom-class';
import { X_HEIGHT } from '../core/font-metrics';
import { Span } from '../core/span';
import { Stack } from '../core/stack';
import { Context } from '../core/context';

import { makeCustomSizedDelim } from '../core/delimiters';
import type { ParseMode, Style } from '../public/core';

export class SurdAtom extends Atom {
  constructor(
    command: string,
    options: { mode?: ParseMode; body: Atom[]; index: Atom[]; style: Style }
  ) {
    super('surd', {
      command,
      mode: options.mode ?? 'math',
      style: options.style,
      displayContainsHighlight: true,
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

  render(parentContext: Context): Span {
    // See the TeXbook pg. 443, Rule 11.
    // http://www.ctex.org/documents/shredder/src/texbook.pdf

    //
    // 1. Render the inner span
    //
    // > 11. If the current item is a Rad atom (from \radical, e.g., \sqrt),
    // > set box x to the nucleus in style C′
    // TeXBook p.443

    const innerContext = new Context(parentContext, this.style, 'cramp');
    const innerSpan: Span =
      Atom.render(innerContext, this.body, {
        style: this.style,
        newList: true,
      }) ?? new Span(null);

    //
    // 2. Render the radical line
    //

    const factor = innerContext.scalingFactor;
    const ruleWidth = innerContext.metrics.defaultRuleThickness / factor;

    // > let φ=σ5 if C>T (TeXBook p. 443)
    const phi = parentContext.isDisplayStyle ? X_HEIGHT : ruleWidth;

    const line = new Span(null, {
      classes: 'ML__sqrt-line',
      style: this.style,
      height: ruleWidth,
    });

    //
    // 3. Create a radical delimiter of the required minimum size
    //
    // Calculate the clearance between the body and line

    // > Set ψ = θ + 1/4 |φ|
    let lineClearance = factor * (ruleWidth + phi / 4);
    const innerTotalHeight = Math.max(
      factor * 2 * phi,
      innerSpan.height + innerSpan.depth
    );

    const minDelimiterHeight = innerTotalHeight + lineClearance + ruleWidth;
    const delimContext = new Context(parentContext, this.style);
    const delimSpan = this.bind(
      delimContext,
      new Span(
        makeCustomSizedDelim(
          '',
          '\\surd',
          minDelimiterHeight,
          false,
          delimContext
        ),
        { classes: 'ML__sqrt-sign', style: this.style }
      )
    );

    const delimDepth = delimSpan.height + delimSpan.depth - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > innerSpan.height + innerSpan.depth + lineClearance) {
      lineClearance =
        (lineClearance + delimDepth - (innerSpan.height + innerSpan.depth)) / 2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    delimSpan.setTop(
      delimSpan.height - innerSpan.height - (lineClearance + ruleWidth)
    );

    //
    // 4. Render the body (inner + line)
    //

    const bodySpan = new Stack({
      firstBaseline: [
        { span: new Span(innerSpan) }, // Need to wrap the inner for proper selection bound calculation
        lineClearance,
        { span: line },
        ruleWidth,
      ],
    }).wrap(parentContext);

    //
    //  5. Assemble the body and the delimiter
    //

    //
    // 5.1. Handle the optional root index
    //
    // The index is always in scriptscript style
    // TeXBook p. 360:
    // > \def\root#1\of{\setbox\rootbox=
    // > \hbox{$\m@th \scriptscriptstyle{#1}$}\mathpalette\r@@t}
    const indexSpan = Atom.render(
      new Context(parentContext, this.style, 'scriptscriptstyle'),
      this.above,
      {
        style: this.style,
        newList: true,
      }
    );

    if (!indexSpan) {
      //
      // 5.2. There's no root index (sqrt)
      //
      const result = new Span([delimSpan, bodySpan], {
        classes: this.containsCaret ? 'ML__contains-caret' : '',
        type: 'mord',
      });
      if (this.caret) result.caret = this.caret;
      return this.bind(parentContext, result.wrap(parentContext));
    }

    // Build a stack with the index shifted up correctly.
    // The amount the index is shifted by is taken from the TeX
    // source, in the definition of `\r@@t`.
    const indexStack = new Stack({
      shift:
        -0.6 *
        (Math.max(delimSpan.height, bodySpan.height) -
          Math.max(delimSpan.depth, bodySpan.depth)),
      children: [{ span: indexSpan }],
    });

    // Add a class surrounding it so we can add on the appropriate
    // kerning
    const result = new Span(
      [
        new Span(indexStack, { classes: 'ML__sqrt-index' }),
        delimSpan,
        bodySpan,
      ],
      { type: 'mord', classes: this.containsCaret ? 'ML__contains-caret' : '' }
    );
    result.height = delimSpan.height;
    result.depth = delimSpan.depth;

    if (this.caret) result.caret = this.caret;
    return this.bind(parentContext, result.wrap(parentContext));
  }
}
