import type { ParseMode, Style } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { latexCommand } from '../core/tokenizer';
import type { AtomJson, ToLatexOptions } from 'core/types';
import { PlaceholderAtom } from './placeholder';

export class PromptAtom extends Atom {
  readonly placeholderId?: string;
  correctness: 'correct' | 'incorrect' | undefined;
  locked: boolean;
  constructor(
    placeholderId?: string,
    correctness?: 'correct' | 'incorrect' | undefined,
    locked = false,
    body?: Readonly<Atom[]>,
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
    const hPadding = fboxsep;
    const vPadding = fboxsep;

    // Base is the main content "inside" the box
    const content = Atom.createBox(parentContext, this.body);

    if (!content) return null;

    const isEffectivelyEmpty =
      !this.body ||
      this.body.length === 0 ||
      this.body.every((atom) => atom.type === 'first');

    const placeholderMetrics = isEffectivelyEmpty
      ? new PlaceholderAtom({
          mode: this.mode,
          style: this.style,
        }).render(new Context({ parent: parentContext, isPhantom: true }))
      : null;

    const emptyHeight = placeholderMetrics?.height ?? context.metrics.xHeight;
    const emptyDepth = placeholderMetrics?.depth ?? emptyHeight / 2;

    // An empty prompt should not be too small, pretend content
    // has height sigma 5 (x-height)

    if (!content.height) {
      content.height = isEffectivelyEmpty
        ? emptyHeight
        : context.metrics.xHeight;
    }

    if (!content.depth) {
      if (isEffectivelyEmpty) content.depth = emptyDepth;
      else content.depth = context.metrics.defaultRuleThickness;
    }

    const verticalShift = isEffectivelyEmpty
      ? emptyDepth - emptyHeight
      : content.depth - content.height;
    content.setStyle('vertical-align', verticalShift, 'em');
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
    base.height = content.height;
    base.depth = content.depth;
    base.setStyle('display', 'inline-block');
    base.setStyle('height', content.height + content.depth, 'em');
    base.setStyle('vertical-align', -vPadding, 'em');
    base.setStyle('position', 'relative');
    base.setStyle('z-index', 1);

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
      attributes: { part: 'prompt' },
    });
    box.height = base.height + vPadding;
    box.depth = base.depth + vPadding;
    box.width = base.width + 2 * hPadding;
    box.setStyle('position', 'absolute');
    box.setStyle('z-index', 0);
    box.setStyle('display', 'block');
    box.setStyle('pointer-events' as any, 'auto');

    const overlayHeight = base.height + base.depth + 2 * vPadding;
    box.setStyle('height', Math.max(overlayHeight, 0.6), 'em');

    let overlayWidth = base.width + 2 * hPadding;
    if (isEffectivelyEmpty)
      overlayWidth = Math.max(overlayWidth, 3 * hPadding || 0.8);
    box.setStyle('width', Math.max(overlayWidth, 0.6), 'em');

    box.setStyle('top', fboxsep + vPadding, 'em');
    if (isEffectivelyEmpty) box.setStyle('left', -1.5 * hPadding, 'em');
    else if (hPadding !== 0) box.setStyle('left', -hPadding, 'em');
    let svg = ''; // strike through incorrect prompt, for users with impaired color vision

    if (this.correctness === 'incorrect') {
      svg +=
        '<line x1="3%"  y1="97%" x2="97%" y2="3%" stroke-width="0.5" stroke="var(--incorrect-color, var(--ML__incorrect-color))" stroke-linecap="round" />';
    }
    if (svg) box.svgOverlay = svg;

    // The result is a box that encloses the box and the base
    const result = new Box([box, base], { classes: 'ML__prompt-atom' });

    // Needed for Safari (https://github.com/arnog/mathlive/issues/2152)
    base.setStyle('line-height', 1);

    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('position', 'relative');
    result.setStyle('display', 'inline-block');
    result.setStyle('line-height', 0);

    // The padding adds to the width and height of the pod
    result.height = base.height + vPadding + 0.2;
    result.depth = base.depth + vPadding;
    result.left = hPadding;
    result.right = hPadding;
    result.setStyle('height', base.height + 2 * vPadding, 'em');
    result.setStyle('top', base.depth - base.height - vPadding / 2, 'em');
    result.setStyle('vertical-align', base.depth + vPadding / 2, 'em');
    result.setStyle('margin-left', 0.5, 'em');
    result.setStyle('margin-right', 0.5, 'em');

    if (this.caret) result.caret = this.caret;

    const withSupSub = this.attachSupsub(parentContext, { base: result });
    const bound = this.bind(context, withSupSub);

    if (bound && this.id) {
      box.atomID = this.id;
      base.atomID = this.id;
      result.atomID = this.id;
    }

    return bound;
  }

  _serialize(options: ToLatexOptions): string {
    const value = this.bodyToLatex(options) ?? '';

    if (options.skipPlaceholders) return value;

    let command = '\\placeholder';

    if (this.placeholderId) command += `[${this.placeholderId}]`;

    if (this.correctness === 'correct') command += '[correct]';
    else if (this.correctness === 'incorrect') command += '[incorrect]';

    if (this.locked) command += '[locked]';
    return latexCommand(command, value);
  }
}
