import { Atom, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { makeLeftRightDelim } from '../core/delimiters';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import { Style } from '../public/core';

/**
 *  \left....\right
 *
 * Note that we can encounter malformed \left...\right, for example
 * a \left without a matching \right or vice versa. In that case, the
 * leftDelim (resp. rightDelim) will be undefined. We still need to handle
 * those cases.
 *
 */
export class LeftRightAtom extends Atom {
  readonly leftDelim?: string;
  rightDelim?: string;
  private readonly inner: boolean; // Indicate if it's a `\mleft` (false), or a `\left`
  constructor(
    body: Atom[],
    options: {
      inner?: boolean;
      leftDelim: string;
      rightDelim: string;
      style?: Style;
    }
  ) {
    super('leftright', {
      style: options.style,
      displayContainsHighlight: true,
    });
    this.body = body;
    this.inner = options.inner ?? false;
    this.leftDelim = options.leftDelim;
    this.rightDelim = options.rightDelim;
  }

  serialize(options: ToLatexOptions): string {
    let segments: string[] = [];
    if (this.inner) {
      segments = [
        '\\left' + (this.leftDelim ?? '.'),
        this.bodyToLatex(options),
        '\\right' + (this.rightDelim ?? '.'),
      ];
    } else if (options.expandMacro) {
      // If we're in 'expandMacro' mode (i.e. interchange format
      // used, e.g., on the clipboard for maximum compatibility
      // with other LaTeX renderers), drop the `\mleft(` and `\mright`)
      // commands
      segments = [
        !this.leftDelim || this.leftDelim === '.' ? '' : this.leftDelim,
        this.bodyToLatex(options),
        !this.rightDelim || this.rightDelim === '.' ? '' : this.rightDelim,
      ];
    } else {
      segments = [
        '\\mleft' + (this.leftDelim ?? '.'),
        this.bodyToLatex(options),
        '\\mright' + (this.rightDelim ?? '.'),
      ];
    }

    return joinLatex(segments);
  }

  render(parentContext: Context): Box | null {
    const context = new Context(parentContext, this.style);

    if (!this.body) {
      // No body, only a delimiter
      const boxes: Box[] = [];
      if (this.leftDelim) {
        boxes.push(
          new Atom('mopen', { value: this.leftDelim }).render(context)!
        );
      }

      if (this.rightDelim) {
        boxes.push(
          new Atom('mclose', { value: this.rightDelim }).render(context)!
        );
      }
      if (boxes.length === 0) return null;
      return new Box(boxes, { type: 'minner' });
    }

    // Calculate its height and depth
    // The size of delimiters is the same, regardless of what mathstyle we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.
    const delimContext = new Context(parentContext, this.style, 'textstyle');
    const inner: Box =
      Atom.createBox(context, this.body, { newList: true }) ??
      new Box(null, { newList: true });
    const innerHeight = inner.height / delimContext.scalingFactor;
    const innerDepth = inner.depth / delimContext.scalingFactor;

    const boxes: Box[] = [];
    // Add the left delimiter to the beginning of the expression
    // @revisit: we call bind() on three difference boxes. Each box should
    // have a different ID. We should have a Box.hitTest() method to properly
    // handle the different boxes.
    if (this.leftDelim) {
      boxes.push(
        this.bind(
          delimContext,
          makeLeftRightDelim(
            'mopen',
            this.leftDelim,
            innerHeight,
            innerDepth,
            delimContext,
            {
              classes:
                'ML__open' + (this.containsCaret ? ' ML__contains-caret' : ''),
              mode: this.mode,
              style: this.style,
            }
          )
        )!
      );
    }

    if (inner) {
      // Replace the delim (\middle) boxes with proper ones now that we know
      // the height/depth
      if (inner.children) {
        for (let i = 0; i < inner.children.length; i++) {
          const child = inner.children![i];
          if (child.delim) {
            const savedCaret = child.caret;
            inner.children![i] = this.bind(
              context,
              makeLeftRightDelim(
                'minner',
                child.delim,
                innerHeight,
                innerDepth,
                context
              )
            )!;
            inner.children![i].caret = savedCaret;
          }
        }
      }
      boxes.push(inner);
    }

    // Add the right delimiter to the end of the expression.
    if (this.rightDelim) {
      let delim = this.rightDelim;
      let classes = this.containsCaret ? ' ML__contains-caret' : '';
      if (delim === '?') {
        if (context.smartFence) {
          // Use a placeholder delimiter matching the open delimiter
          delim =
            {
              '(': ')',
              '[': '\\rbrack',
              '\\{': '\\}',
              '\\lbrace': '\\rbrace',
              '\\lparen': '\\rparen',
              '\\langle': '\\rangle',
              '\\lfloor': '\\rfloor',
              '\\lceil': '\\rceil',
              '\\vert': '\\vert',
              '\\lvert': '\\rvert',
              '\\Vert': '\\Vert',
              '\\lVert': '\\rVert',
              '\\lbrack': '\\rbrack',
              '\\ulcorner': '\\urcorner',
              '\\llcorner': '\\lrcorner',
              '\\lgroup': '\\rgroup',
              '\\lmoustache': '\\rmoustache',
            }[this.leftDelim ?? '.'] ??
            this.leftDelim ??
            '.';
          classes += ' ML__smart-fence__close';
        } else {
          delim = '.';
        }
      }

      boxes.push(
        this.bind(
          delimContext,
          makeLeftRightDelim(
            'mclose',
            delim,
            innerHeight,
            innerDepth,
            delimContext,
            {
              classes: classes + ' ML__close',
              mode: this.mode,
              style: this.style,
            }
          )
        )!
      );
    }

    // If the `inner` flag is set, return the `inner` element (that's the
    // behavior for the regular `\left...\right`
    // Otherwise, include a `\mathopen{}...\mathclose{}`. That's the
    // behavior for `\mleft...\mright`, which allows for tighter spacing
    // for example in `\sin\mleft(x\mright)`
    const result = new Box(boxes, {
      type: this.inner ? 'minner' : 'mclose',
      classes: 'left-right',
    });

    if (this.caret) result.caret = this.caret;

    return this.bind(context, result.wrap(context));
  }
}
