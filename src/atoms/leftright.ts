import type { Style } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { Box } from '../core/box';
import { makeLeftRightDelim, RIGHT_DELIM } from '../core/delimiters';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import type { AtomJson, ToLatexOptions } from 'core/types';

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
  leftDelim?: string;
  rightDelim?: string;

  // Indicate which command should the delimiters be serialized to:
  // regular delimiter, `\left...\right` or `\mleft...mright`.
  private readonly variant: '' | 'left...right' | 'mleft...mright';

  constructor(
    variant: '' | 'left...right' | 'mleft...mright',
    body: Atom[],
    options: {
      leftDelim: string;
      rightDelim: string;
      style?: Style;
    }
  ) {
    super({
      type: 'leftright',
      style: options.style,
      displayContainsHighlight: true,
    });
    this.variant = variant;
    this.body = body;
    this.leftDelim = options.leftDelim;
    this.rightDelim = options.rightDelim;
  }

  static fromJson(json: AtomJson): LeftRightAtom {
    return new LeftRightAtom(json.variant ?? '', json.body, json as any);
  }

  toJson(): AtomJson {
    const result = super.toJson();
    if (this.variant) result.variant = this.variant;
    if (this.leftDelim) result.leftDelim = this.leftDelim;
    if (this.rightDelim) result.rightDelim = this.rightDelim;
    return result;
  }

  _serialize(options: ToLatexOptions): string {
    const rightDelim = this.matchingRightDelim();

    if (this.variant === 'left...right') {
      return joinLatex([
        '\\left',
        this.leftDelim ?? '.',
        this.bodyToLatex(options),
        '\\right',
        rightDelim,
      ]);
    }

    if (this.variant === 'mleft...mright') {
      return joinLatex([
        '\\mleft',
        this.leftDelim ?? '.',
        this.bodyToLatex(options),
        '\\mright',
        rightDelim,
      ]);
    }

    return joinLatex([
      !this.leftDelim || this.leftDelim === '.' ? '' : this.leftDelim,
      this.bodyToLatex(options),
      rightDelim,
    ]);
  }

  matchingRightDelim(): string {
    if (this.rightDelim && this.rightDelim !== '?') return this.rightDelim;
    const leftDelim = this.leftDelim ?? '.';
    return RIGHT_DELIM[leftDelim] ?? leftDelim;
  }

  render(parentContext: Context): Box | null {
    const context = new Context({ parent: parentContext }, this.style);

    console.assert(this.body !== undefined);

    // Calculate its height and depth
    // The size of delimiters is the same, regardless of what mathstyle we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.
    const delimContext = new Context(
      { parent: parentContext, mathstyle: 'textstyle' },
      this.style
    );
    const inner: Box =
      Atom.createBox(context, this.body, { type: 'inner' }) ??
      new Box(null, { type: 'inner' });

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
            'open',
            this.leftDelim,
            innerHeight,
            innerDepth,
            delimContext,
            {
              isSelected: this.isSelected,
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
      // Now that we know the height/depth of the `\left...\right`,
      // replace the middle delimiter (\middle) boxes with correctly sized ones
      upgradeMiddle(inner.children, this, context, innerHeight, innerDepth);

      boxes.push(inner);
    }

    // Add the right delimiter to the end of the expression.
    if (this.rightDelim) {
      let classes = this.containsCaret ? ' ML__contains-caret' : '';
      let delim = this.rightDelim;
      if (delim === '?') {
        if (context.smartFence) {
          // Use a placeholder delimiter matching the open delimiter
          delim = this.matchingRightDelim();
          classes += ' ML__smart-fence__close';
        } else delim = '.';
      }

      boxes.push(
        this.bind(
          delimContext,
          makeLeftRightDelim(
            'close',
            delim,
            innerHeight,
            innerDepth,
            delimContext,
            {
              isSelected: this.isSelected,
              classes: classes + ' ML__close',
              mode: this.mode,
              style: this.style,
            }
          )
        )
      );
    }

    // If the left sibling is a function (e.g. `\sin`, `f`...)
    // or we use the `mleft...mright` variant,
    // use a tighter spacing
    let tightSpacing = this.variant === 'mleft...mright';

    const sibling = this.leftSibling;
    if (sibling) {
      if (!tightSpacing && sibling.isFunction) tightSpacing = true;

      if (
        !tightSpacing &&
        sibling.type === 'subsup' &&
        sibling.leftSibling?.isFunction
      )
        tightSpacing = true;
    }

    const result = new Box(boxes, {
      type: tightSpacing ? 'close' : 'inner',
      classes: 'ML__left-right',
    });
    result.setStyle('margin-top', `${-inner.depth}em`);
    result.setStyle('height', `${inner.height + inner.depth}em`);

    if (this.caret) result.caret = this.caret;

    return this.bind(context, result.wrap(context));
  }
}

function upgradeMiddle(
  boxes: Box[] | undefined,
  atom: LeftRightAtom,
  context: Context,
  height: number,
  depth: number
) {
  if (!boxes) return;
  for (let i = 0; i < boxes.length; i++) {
    const child = boxes[i];
    if (child.type === 'middle') {
      boxes[i] = atom.bind(
        context,
        makeLeftRightDelim('inner', child.value, height, depth, context, {
          isSelected: atom.isSelected,
        })
      );
      boxes[i].caret = child.caret;
      boxes[i].isSelected = child.isSelected;
      boxes[i].cssId = child.cssId;
      boxes[i].htmlData = child.htmlData;
      boxes[i].htmlStyle = child.htmlStyle;
      boxes[i].attributes = child.attributes;
      boxes[i].cssProperties = child.cssProperties;
    } else if (child.children)
      upgradeMiddle(child.children, atom, context, height, depth);
  }
}
