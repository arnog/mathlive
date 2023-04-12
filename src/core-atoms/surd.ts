import type { ParseMode, Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { X_HEIGHT } from '../core/font-metrics';
import { Box } from '../core/box';
import { VBox } from '../core/v-box';
import { Context } from '../core/context';

import { makeCustomSizedDelim } from '../core/delimiters';

export class SurdAtom extends Atom {
  constructor(
    command: string,
    context: GlobalContext,
    options: { mode?: ParseMode; body: Atom[]; index: Atom[]; style: Style }
  ) {
    super('surd', context, {
      command,
      mode: options.mode ?? 'math',
      style: options.style,
      displayContainsHighlight: true,
    });
    this.body = options.body;
    this.above = options.index;
  }

  static fromJson(json: AtomJson, context: GlobalContext): SurdAtom {
    return new SurdAtom(json.command, context, {
      ...(json as any),
      index: json.above,
    });
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  serialize(options: ToLatexOptions): string {
    let args = '';
    if (this.above) args += `[${this.aboveToLatex(options)}]`;

    args += `{${this.bodyToLatex(options)}}`;
    return this.command + args;
  }

  render(parentContext: Context): Box | null {
    // See the TeXbook pg. 443, Rule 11.
    // http://www.ctex.org/documents/shredder/src/texbook.pdf

    //
    // 1. Render the inner box
    //
    // > 11. If the current item is a Rad atom (from \radical, e.g., \sqrt),
    // > set box x to the nucleus in style C′
    // TeXBook p.443

    const innerContext = new Context(parentContext, this.style, 'cramp');
    const innerBox: Box =
      Atom.createBox(innerContext, this.body, {
        style: this.style,
        newList: true,
      }) ?? new Box(null);

    //
    // 2. Render the radical line
    //

    const factor = innerContext.scalingFactor;
    const ruleWidth = innerContext.metrics.defaultRuleThickness / factor;

    // > let φ=σ5 if C>T (TeXBook p. 443)
    const phi = parentContext.isDisplayStyle ? X_HEIGHT : ruleWidth;

    const line = new Box(null, {
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
      innerBox.height + innerBox.depth
    );

    const minDelimiterHeight = innerTotalHeight + lineClearance + ruleWidth;
    const delimContext = new Context(parentContext, this.style);
    const selectClasses = this.isSelected ? ' ML__selected' : '';
    const delimBox = this.bind(
      delimContext,
      new Box(
        makeCustomSizedDelim(
          '',
          '\\surd',
          minDelimiterHeight,
          false,
          delimContext,
          { classes: selectClasses }
        ),
        {
          classes: 'ML__sqrt-sign' + selectClasses,
          style: this.style,
        }
      )
    );

    if (!delimBox) return null;

    const delimDepth = delimBox.height + delimBox.depth - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > innerBox.height + innerBox.depth + lineClearance) {
      lineClearance =
        (lineClearance + delimDepth - (innerBox.height + innerBox.depth)) / 2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    delimBox.setTop(delimBox.height - innerBox.height - lineClearance);

    //
    // 4. Render the body (inner + line)
    //

    const bodyBox = this.bind(
      parentContext,
      new VBox({
        firstBaseline: [
          { box: new Box(innerBox) }, // Need to wrap the inner for proper selection bound calculation
          lineClearance - 2 * ruleWidth,
          { box: line },
          ruleWidth,
        ],
      }).wrap(parentContext)
    );

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
    const indexBox = Atom.createBox(
      new Context(parentContext, this.style, 'scriptscriptstyle'),
      this.above,
      {
        style: this.style,
        newList: true,
      }
    );

    if (!indexBox) {
      //
      // 5.2. There's no root index (sqrt)
      //
      const result = new Box([delimBox, bodyBox], {
        classes: this.containsCaret ? 'ML__contains-caret' : '',
        type: 'mord',
      });
      if (this.caret) result.caret = this.caret;
      return this.bind(parentContext, result.wrap(parentContext));
    }

    // Build a stack with the index shifted up correctly.
    // The amount the index is shifted by is taken from the TeX
    // source, in the definition of `\r@@t`.
    const indexStack = new VBox({
      shift:
        -0.6 *
        (Math.max(delimBox.height, bodyBox.height) -
          Math.max(delimBox.depth, bodyBox.depth)),
      children: [{ box: indexBox }],
    });

    // Add a class surrounding it so we can add on the appropriate
    // kerning
    const result = new Box(
      [new Box(indexStack, { classes: 'ML__sqrt-index' }), delimBox, bodyBox],
      { type: 'mord', classes: this.containsCaret ? 'ML__contains-caret' : '' }
    );
    result.height = delimBox.height;
    result.depth = delimBox.depth;

    if (this.caret) result.caret = this.caret;
    return this.bind(parentContext, result.wrap(parentContext));
  }
}
