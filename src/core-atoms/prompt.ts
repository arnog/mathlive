import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context, GlobalContext } from '../core/context';
import { convertDimensionToEm } from '../core/registers-utils';

export class PromptAtom extends Atom {
  constructor(command: string, body: Atom[], context: GlobalContext) {
    super('prompt', context, { command });
    this.body = body;
    this.captureSelection = !context.promptMode;
  }

  // TODO: Add options
  static fromJson(
    json: { [key: string]: any },
    context: GlobalContext
  ): PromptAtom {
    return new PromptAtom(json.command, json.body, context);
  }

  toJson(): AtomJson {
    return {
      ...super.toJson(),
    };
  }

  serialize(options: ToLatexOptions): string {
    let result = this.command ?? '';

    result += `{${this.bodyToLatex(options)}}`;
    return result;
  }

  render(parentContext: Context) {
    const context = new Context(parentContext);

    const fboxsep = convertDimensionToEm(
      context.getRegisterAsDimension('fboxsep')
    );

    let padding = fboxsep;

    // Base is the main content "inside" the box
    const content = Atom.createBox(parentContext, this.body);
    if (!content) return null;

    // An empty prompt should not be too small, pretend content has height 0.5em

    !content.height && (content.height = 0.5); // CHANGE FROM BOX
    content.setStyle('vertical-align', -content.height, 'em');
    const base = new Box(content, { type: 'mord' });

    // This box will represent the box (background and border).
    // It's positioned to overlap the base.
    // The 'ML__box' class is required to prevent the box from being omitted
    // during rendering (it looks like an empty, no-op box)
    const boxClasses = this.context.promptMode
      ? this.containsCaret
        ? 'ML__focusedPromptBox'
        : 'ML__editablePromptBox'
      : ' ML__lockedPromptBox';
    const box = new Box(null, {
      classes: boxClasses,
    });
    box.height = base.height + padding;
    box.depth = base.depth + padding;
    box.setStyle('box-sizing', 'border-box');
    box.setStyle('position', 'absolute');

    box.setStyle('height', base.height + base.depth + 2 * padding, 'em');
    if (padding === 0) box.setStyle('width', '100%');
    else {
      box.setStyle('width', `calc(100% + ${2 * padding}em)`);
      box.setStyle('top', fboxsep, 'em'); // empirical
      box.setStyle('left', -padding, 'em');
    }

    base.setStyle('display', 'inline-block');
    base.setStyle('height', content.height + content.depth, 'em');
    base.setStyle('vertical-align', -padding, 'em');

    // The result is a box that encloses the box and the base
    const result = new Box([box, base]);
    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('position', 'relative');
    result.setStyle('display', 'inline-block');
    result.setStyle('line-height', 0);

    // The padding adds to the width and height of the pod
    result.height = base.height + padding + 0.2;
    result.depth = base.depth + padding;
    result.left = padding;
    result.right = padding;
    result.setStyle('height', base.height + padding, 'em');
    result.setStyle('top', base.depth - base.height, 'em');
    result.setStyle('vertical-align', base.depth + padding + 0.1, 'em');
    result.setStyle('margin-left', 0.5, 'em'); // CHANGE FROM BOX
    result.setStyle('margin-right', 0.5, 'em'); // CHANGE FROM BOX

    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(parentContext, { base: result });
  }
}
