import type { Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

/**
 * Atom for raw latex character, while in LaTeX editing mode
 */
export class LatexAtom extends Atom {
  isSuggestion: boolean; // Display suggestions with reduced opacity
  isError: boolean; // Display errors with wavy red line

  constructor(
    value: string,
    context: GlobalContext,
    options?: {
      isSuggestion: boolean;
    }
  ) {
    super('latex', context, { value, mode: 'latex' });
    this.isSuggestion = options?.isSuggestion ?? false;
    this.isError = false;
    this.verbatimLatex = value;
  }

  static fromJson(json: AtomJson, context: GlobalContext): LatexAtom {
    const result = new LatexAtom(json.command, context);
    if (json.isSuggestion) result.isSuggestion = true;
    if (json.isError) result.isError = true;
    return result;
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {};
    if (this.isSuggestion) options.isSuggestion = true;
    if (this.isError) options.isError = true;
    return { ...super.toJson(), ...options };
  }

  get computedStyle(): Style {
    return {};
  }

  render(context: Context): Box | null {
    const result = new Box(this.value, {
      classes: this.isSuggestion
        ? 'ML__suggestion'
        : this.isError
        ? 'ML__error'
        : '',
      type: 'latex',
      maxFontSize: 1.0,
    });
    if (!result) return null;
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}

/**
 * A group that represents a raw LaTeX editing zone.
 * There is only one LatexGroupAtom at a time in an expression.
 */
export class LatexGroupAtom extends Atom {
  constructor(latex: string, context: GlobalContext) {
    super('latexgroup', context, { mode: 'latex' });
    this.body = [...latex].map((x) => new LatexAtom(x, context));

    this.skipBoundary = false;
  }

  static fromJson(_json: AtomJson, context: GlobalContext): LatexGroupAtom {
    return new LatexGroupAtom('', context);
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box | null {
    const box = Atom.createBox(context, this.body, { newList: true });
    if (!box) return null;
    if (this.caret) box.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    return this.bind(context, box);
  }

  serialize(_options: ToLatexOptions): string {
    return this.body?.map((x) => x.value).join('') ?? '';
  }
}
