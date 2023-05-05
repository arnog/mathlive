import type { MathstyleName, ParseMode, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import type { Box } from '../core/box';
import type { BoxType } from '../core/types';
import { Argument } from '../core-definitions/definitions-utils';

export class GroupAtom extends Atom {
  boxType?: BoxType;
  mathstyleName?: MathstyleName;

  latexOpen?: string;
  latexClose?: string;

  // This CSS class is used only during rendering
  renderClass?: string;

  cssId?: string;
  htmlData?: string;
  htmlStyle?: string;
  // This CSS class is user-provided
  customClass?: string;

  constructor(
    arg: Atom[] | undefined,
    options?: {
      command?: string;
      args?: (Argument | null)[];
      mode?: ParseMode;
      style?: Style;
      boxType?: BoxType;
      mathstyleName?: MathstyleName;
      latexOpen?: string;
      latexClose?: string;
      cssId?: string;
      htmlData?: string;
      htmlStyle?: string;
      customClass?: string;
      renderClass?: string;
      captureSelection?: boolean;
    }
  ) {
    super('group', {
      command: options?.command,
      args: options?.args,
      mode: options?.mode ?? 'math',
      style: options?.style,
    });
    this.body = arg;
    this.mathstyleName = options?.mathstyleName;

    this.latexOpen = options?.latexOpen;
    this.latexClose = options?.latexClose;
    // this.cssId = options?.cssId;
    // this.htmlData = options?.htmlData;
    // this.htmlStyle = options?.htmlStyle;
    // this.customClass = options?.customClass;
    this.renderClass = options?.renderClass;

    this.boxType = options?.boxType;
    this.skipBoundary = true;
    this.captureSelection = options?.captureSelection ?? false;
    this.displayContainsHighlight = false;

    // French decimal point
    if (arg && arg.length === 1 && arg[0].command === ',')
      this.captureSelection = true;
  }

  static fromJson(json: AtomJson): GroupAtom {
    return new GroupAtom(json.body, json as any);
  }

  toJson(): AtomJson {
    const result: { [key: string]: any } = {};
    if (this.mathstyleName) result.mathstyleName = this.mathstyleName;
    if (this.latexOpen) result.latexOpen = this.latexOpen;
    if (this.latexClose) result.latexClose = this.latexClose;
    if (this.cssId) result.cssId = this.cssId;
    if (this.htmlData) result.htmlData = this.htmlData;
    if (this.htmlStyle) result.htmlStyle = this.htmlStyle;
    if (this.customClass) result.customClass = this.customClass;
    if (this.renderClass) result.renderClass = this.renderClass;
    if (this.boxType) result.boxType = this.boxType;
    if (this.captureSelection) result.captureSelection = true;

    return { ...super.toJson(), ...result };
  }

  render(context: Context): Box | null {
    // The scope of the context is this group, so clone it
    // so that any changes to it will be discarded when finished
    // with this group.
    // Note that the mathstyle property is optional and could be undefined
    // If that's the case, clone() returns a clone of the
    // context with the same mathstyle.
    const localContext = new Context(
      { parent: context, mathstyle: this.mathstyleName },
      this.style
    );
    const classes =
      this.customClass || this.renderClass
        ? `${this.customClass ?? ''} ${this.renderClass ?? ''}`
        : '';

    const box = Atom.createBox(localContext, this.body, {
      type: this.boxType,
      classes,
      mode: this.mode,
      style: { backgroundColor: this.style.backgroundColor },
    });
    if (!box) return null;
    if (this.cssId) box.cssId = this.cssId;
    if (this.htmlData) box.htmlData = this.htmlData;
    if (this.htmlStyle) box.htmlStyle = this.htmlStyle;
    if (this.caret) box.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    return this.bind(context, box);
  }

  serialize(options: ToLatexOptions): string {
    let result = super.serialize(options);

    if (typeof this.latexOpen === 'string')
      result = this.latexOpen + result + this.latexClose;

    if (this.htmlData) result = `\\htmlData{${this.htmlData}}{${result}}`;

    if (this.htmlStyle) result = `\\htmlStyle{${this.htmlStyle}}{${result}}`;

    if (this.customClass) result = `\\class{${this.customClass}}{${result}}`;

    if (this.cssId) result = `\\cssId{${this.cssId}}{${result}}`;

    return result;
  }
}
