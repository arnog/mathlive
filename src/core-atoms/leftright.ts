import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
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
    super('leftright', { style: options.style });
    this.body = body;
    this.inner = options.inner ?? false;
    this.leftDelim = options.leftDelim;
    this.rightDelim = options.rightDelim;
  }

  toLatex(options: ToLatexOptions): string {
    let segments = [];
    if (this.inner) {
      segments = [
        '\\left' + (this.leftDelim || '.'),
        this.bodyToLatex(options),
        '\\right' + (this.rightDelim || '.'),
      ];
    } else if (options.expandMacro) {
      // If we're in 'expandMacro' mode (i.e. interchange format
      // used, e.g., on the clipboard for maximum compatibility
      // with other LaTeX renderers), drop the `\mleft(` and `\mright`)
      // commands
      segments = [
        this.leftDelim === '.' ? '' : this.leftDelim,
        this.bodyToLatex(options),
        this.rightDelim === '.' ? '' : this.rightDelim,
      ];
    } else {
      segments = [
        '\\mleft' + (this.leftDelim || '.'),
        this.bodyToLatex(options),
        '\\mright' + (this.rightDelim || '.'),
      ];
    }

    return joinLatex(segments);
  }

  render(context: Context): Span {
    if (!this.body) {
      // No body, only a delimiter
      if (this.leftDelim) {
        return new Atom('mopen', { value: this.leftDelim }).render(context);
      }

      if (this.rightDelim) {
        return new Atom('mclose', { value: this.rightDelim }).render(context);
      }

      return null;
    }

    // The scope of the context is this group, so make a copy of it
    // so that any changes to it will be discarded when finished
    // with this group.
    const inner: Span = Atom.render(context.clone(), this.body);
    const localContext = context.withFontsize(this.style?.fontSize ?? 'size5');
    const { mathstyle } = localContext;
    const spans: Span[] = [];

    // Calculate its height and depth
    // The size of delimiters is the same, regardless of what mathstyle we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.
    const innerHeight = inner.height * mathstyle.sizeMultiplier;
    const innerDepth = inner.depth * mathstyle.sizeMultiplier;

    // Add the left delimiter to the beginning of the expression
    if (this.leftDelim) {
      spans.push(
        this.bind(
          context,
          makeLeftRightDelim(
            'mopen',
            this.leftDelim,
            innerHeight,
            innerDepth,
            localContext,
            {
              classes:
                'ML__open' + (this.containsCaret ? ' ML__contains-caret' : ''),
              mode: this.mode,
              style: this.style,
            }
          )
        )
      );
    }

    if (inner) {
      // Replace the delim (\middle) spans with proper ones now that we know
      // the height/depth
      for (let i = 0; i < inner.children?.length; i++) {
        if (inner.children[i].delim) {
          const savedCaret = inner.children[i].caret;
          inner.children[i] = this.bind(
            context,
            makeLeftRightDelim(
              'minner',
              inner.children[i].delim,
              innerHeight,
              innerDepth,
              localContext
            )
          );
          inner.children[i].caret = savedCaret;
        }
      }

      spans.push(inner);
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
            }[this.leftDelim] ?? this.leftDelim;
          classes += ' ML__smart-fence__close';
        } else {
          delim = '.';
        }
      }

      spans.push(
        this.bind(
          context,
          makeLeftRightDelim(
            'mclose',
            delim,
            innerHeight,
            innerDepth,
            localContext,
            {
              classes: classes + ' ML__close',
              mode: this.mode,
              style: this.style,
            }
          )
        )
      );
    }

    // If the `inner` flag is set, return the `inner` element (that's the
    // behavior for the regular `\left...\right`
    // Otherwise, include a `\mathopen{}...\mathclose{}`. That's the
    // behavior for `\mleft...\mright`, which allows for tighter spacing
    // for example in `\sin\mleft(x\mright)`
    const result = new Span(spans, {
      classes: mathstyle.cls(),
      type: this.inner ? 'minner' : 'mclose',
    });

    if (this.caret) result.caret = this.caret;

    return this.bind(context, result);
  }
}
