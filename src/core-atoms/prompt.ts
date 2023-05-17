import type { ParseMode, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { addSVGOverlay, Box } from '../core/box';
import { Context } from '../core/context';
import { latexCommand } from '../core/tokenizer';

export class PromptAtom extends Atom {
  readonly placeholderId?: string;
  correctness: 'correct' | 'incorrect' | undefined;
  locked: boolean;
  constructor(
    placeholderId?: string,
    correctness?: 'correct' | 'incorrect' | undefined,
    locked = false,
    body?: Atom[],
    options?: {
      mode?: ParseMode;
      style?: Style;
    }
  ) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    super({
      type: 'prompt',
      mode: options?.mode ?? 'math',
      style: options?.style,
      command: '\\placeholder',
    });
    this.body = body;
    this.correctness = correctness;
    this.placeholderId = placeholderId;
    this.locked = locked;
    this.captureSelection = this.locked;
  }

  static fromJson(json: AtomJson): PromptAtom {
    return new PromptAtom(
      json.placeholderId,
      json.correctness,
      json.locked,
      json.body,
      json as any
    );
  }

  toJson(): AtomJson {
    const result = super.toJson();
    if (this.placeholderId) result.placeholderId = this.placeholderId;
    if (!this.body) delete result.body;
    if (this.body) {
      result.body = this.body
        .filter((x) => x.type !== 'first')
        .map((x) => x.toJson());
    }
    if (this.correctness) result.correctness = this.correctness;
    result.locked = this.locked;
    return result;
  }

  render(parentContext: Context): Box | null {
    const context = new Context({ parent: parentContext });

    const fboxsep = context.getRegisterAsEm('fboxsep');
    const padding = fboxsep;

    // Base is the main content "inside" the box
    const content = Atom.createBox(parentContext, this.body);

    if (!content) return null;
    // An empty prompt should not be too small, pretend content has height 0.5em

    if (!content.height) content.height = 0.5;

    content.setStyle('vertical-align', -content.height, 'em');
    if (this.correctness === 'correct') {
      content.setStyle(
        'color',
        'var(--correct-color, var(--ML__correct-color))'
      );
    } else if (this.correctness === 'incorrect') {
      content.setStyle(
        'color',
        'var(--incorrect-color, var(--ML__incorrect-color))'
      );
    }
    const base = new Box(content, { type: 'ord' });

    // This box will represent the box (background and border).
    // It's positioned to overlap the base.
    // The 'ML__box' class is required to prevent the box from being omitted
    // during rendering (it looks like an empty, no-op box)
    let boxClasses = 'ML__prompt ';
    if (this.locked) {
      // The prompt is not editable
      boxClasses += ' ML__lockedPromptBox ';
    } else boxClasses += ' ML__editablePromptBox ';

    if (this.correctness === 'correct') boxClasses += ' ML__correctPromptBox ';
    else if (this.correctness === 'incorrect')
      boxClasses += ' ML__incorrectPromptBox ';

    if (this.containsCaret) boxClasses += ' ML__focusedPromptBox ';

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

    // empty prompt should be a little wider
    if (!this.body || this.body.length === 1) {
      box.setStyle('width', `calc(100% + ${3 * padding}em)`);
      box.setStyle('left', -1.5 * padding, 'em');
    }

    let svg = ''; // strike through incorrect prompt, for users with impaired color vision

    if (this.correctness === 'incorrect') {
      svg +=
        '<line x1="3%"  y1="97%" x2="97%" y2="3%" stroke-width="0.5" stroke="var(--incorrect-color, var(--ML__incorrect-color))" stroke-linecap="round" />';
    }
    if (svg) addSVGOverlay(box, svg, '');

    base.setStyle('display', 'inline-block');
    base.setStyle('height', content.height + content.depth, 'em');
    base.setStyle('vertical-align', -padding, 'em');

    // The result is a box that encloses the box and the base
    const result = new Box([box, base], { classes: 'ML__prompt-atom' });
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
    result.setStyle('vertical-align', base.depth + padding, 'em');
    result.setStyle('margin-left', 0.5, 'em');
    result.setStyle('margin-right', 0.5, 'em');

    if (this.caret) result.caret = this.caret;

    return this.bind(
      context,
      this.attachSupsub(parentContext, { base: result })
    );
  }

  _serialize(options: ToLatexOptions): string {
    const value = this.bodyToLatex(options) ?? '';
    let command = '\\placeholder';

    if (this.placeholderId) command += `[${this.placeholderId}]`;

    if (this.correctness === 'correct') command += '[correct]';
    else if (this.correctness === 'incorrect') command += '[incorrect]';

    if (this.locked) command += '[locked]';
    return latexCommand(command, value);
  }
}
