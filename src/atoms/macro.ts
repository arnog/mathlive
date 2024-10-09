import { Atom } from '../core/atom-class';
import { Context } from '../core/context';
import { Box } from '../core/box';
import type { Style } from '../public/core-types';
import type { AtomJson, ToLatexOptions } from 'core/types';

export class MacroAtom extends Atom {
  readonly macroArgs: null | string;
  // If false, even if `expandMacro` is true, do not expand.
  private readonly expand: boolean;

  constructor(
    macro: string,
    options: {
      expand?: boolean;
      args: null | string;
      body: Readonly<Atom[]>;
      captureSelection?: boolean;
      style: Style;
    }
  ) {
    super({ type: 'macro', command: macro, style: options.style });
    this.body = options.body;
    // Set the `captureSelection` attribute to true so that the atom is handled
    // as an unbreakable unit
    if (options.captureSelection === undefined) {
      if (options.args) this.captureSelection = false;
      else this.captureSelection = true;
    } else this.captureSelection = options.captureSelection;

    // Don't use verbatimLatex to save the macro, as it can get wiped when
    // the atom is modified (adding super/subscript, for example).
    this.macroArgs = options.args;

    this.expand = options.expand ?? false;
  }

  static fromJson(json: AtomJson): MacroAtom {
    return new MacroAtom(json.command, json as any);
  }

  toJson(): AtomJson {
    const options = super.toJson();
    if (this.expand) options.expand = true;
    if (this.captureSelection !== undefined)
      options.captureSelection = this.captureSelection;
    if (this.macroArgs) options.args = this.macroArgs;
    return options;
  }

  _serialize(options: ToLatexOptions): string {
    return options.expandMacro && this.expand
      ? this.bodyToLatex(options)
      : this.command + (this.macroArgs ?? '');
  }

  applyStyle(style: Style, options?: { unstyledOnly: boolean }): void {
    // For macros, we only allow color styling. The macro itself has control
    // over the other style attributes
    const allowedStyle: Style = {};
    if (style.color) allowedStyle.color = style.color;
    if (style.backgroundColor)
      allowedStyle.backgroundColor = style.backgroundColor;

    super.applyStyle(allowedStyle, options);
  }

  render(context: Context): Box | null {
    const result = Atom.createBox(context, this.body, { type: 'lift' });
    if (!result) return null;
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}

export class MacroArgumentAtom extends Atom {
  constructor() {
    super({ type: 'macro-argument' });
  }

  static fromJson(_json: AtomJson): MacroArgumentAtom {
    return new MacroArgumentAtom();
  }

  toJson(): AtomJson {
    const options = super.toJson();
    return options;
  }

  _serialize(_options: ToLatexOptions): string {
    return '';
  }

  render(_context: Context): Box | null {
    // const result = Atom.createBox(context, this.body);
    // if (!result) return null;
    // if (this.caret) result.caret = this.caret;
    // return this.bind(context, result);

    return null;
  }
}
