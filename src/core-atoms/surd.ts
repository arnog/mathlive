import type { ParseMode, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { X_HEIGHT } from '../core/font-metrics';
import { Box } from '../core/box';
import { VBox } from '../core/v-box';
import { Context } from '../core/context';

import { makeCustomSizedDelim } from '../core/delimiters';
import { latexCommand } from '../core/tokenizer';

export class SurdAtom extends Atom {
  constructor(
    command: string,
    options: {
      mode?: ParseMode;
      body: Atom[];
      index: undefined | Atom[];
      style: Style;
    }
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

  static fromJson(json: AtomJson): SurdAtom {
    return new SurdAtom(json.command, {
      ...(json as any),
      index: json.above,
    });
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  serialize(options: ToLatexOptions): string {
    const command = this.command;
    const body = this.bodyToLatex(options);
    if (this.above && !this.hasEmptyBranch('above'))
      return latexCommand(`${command}[${this.aboveToLatex(options)}]`, body);

    if (/^[0-9]$/.test(body)) return `${command}${body}`;

    return latexCommand(command, body);
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

    // > Math accents, and the operations \sqrt and \overline, change
    // > uncramped styles to their cramped counterparts; for example, D
    // > changes to D′, but D′ stays as it was. -- TeXBook p. 152
    const innerContext = new Context(
      { parent: parentContext, mathstyle: 'cramp' },
      this.style
    );
    const innerBox: Box =
      Atom.createBox(innerContext, this.body, {
        style: this.style,
        type: 'inner', // In TeX, 'rac'
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
    const delimContext = new Context({ parent: parentContext }, this.style);

    const delimBox = this.bind(
      delimContext,
      new Box(
        makeCustomSizedDelim(
          'inner', // @todo not sure if that's the right type
          '\\surd',
          minDelimiterHeight,
          false,
          delimContext,
          { isSelected: this.isSelected }
        ),
        {
          isSelected: this.isSelected,
          classes: 'ML__sqrt-sign',
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
      new Context(
        { parent: parentContext, mathstyle: 'scriptscriptstyle' },
        this.style
      ),
      this.above,
      { style: this.style, type: 'skip' }
    );

    if (!indexBox) {
      //
      // 5.2. There's no root index (sqrt)
      //
      const result = new Box([delimBox, bodyBox], {
        classes: this.containsCaret ? 'ML__contains-caret' : '',
        type: 'inner',
      });
      result.setStyle('display', 'inline-block');
      result.setStyle('height', result.height + result.depth, 'em');

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
      [
        new Box(indexStack, { classes: 'ML__sqrt-index', type: 'skip' }),
        delimBox,
        bodyBox,
      ],
      {
        type: 'inner',
        classes: this.containsCaret ? 'ML__contains-caret' : '',
      }
    );
    result.height = delimBox.height;
    result.depth = delimBox.depth;

    if (this.caret) result.caret = this.caret;
    return this.bind(parentContext, result.wrap(parentContext));
  }
}
