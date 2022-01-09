import type { ParseMode, Style } from '../public/core';

import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import type { MathstyleName } from '../core/mathstyle';
import type { Box, BoxType } from '../core/box';

export class GroupAtom extends Atom {
  latexOpen?: string;
  latexClose?: string;
  cssId?: string;
  htmlData?: string;
  htmlStyle?: string;
  customClass?: string;
  mathstyleName?: MathstyleName;
  boxType?: BoxType;
  constructor(
    arg: Atom[],
    options?: {
      boxType?: BoxType;
      changeMode?: boolean;
      mathstyleName?: MathstyleName;
      latexOpen?: string;
      latexClose?: string;
      cssId?: string;
      htmlData?: string;
      htmlStyle?: string;
      customClass?: string;
      mode?: ParseMode;
      style?: Style;
      captureSelection?: boolean;
      serialize?: (atom: GroupAtom, options: ToLatexOptions) => string;
    }
  ) {
    super('group', {
      mode: options?.mode ?? 'math',
      serialize: options?.serialize,
      style: options?.style,
      displayContainsHighlight: true,
    });
    this.body = arg;
    this.mathstyleName = options?.mathstyleName;

    this.latexOpen = options?.latexOpen;
    this.latexClose = options?.latexClose;
    this.cssId = options?.cssId;
    this.htmlData = options?.htmlData;
    this.htmlStyle = options?.htmlStyle;
    this.customClass = options?.customClass;

    this.boxType = options?.boxType;
    this.skipBoundary = true;
    this.captureSelection = options?.captureSelection;
    this.changeMode = options?.changeMode ?? false;
    this.displayContainsHighlight = false;
  }

  render(context: Context): Box | null {
    // The scope of the context is this group, so clone it
    // so that any changes to it will be discarded when finished
    // with this group.
    // Note that the mathstyle property is optional and could be undefined
    // If that's the case, clone() returns a clone of the
    // context with the same mathstyle.
    const localContext = new Context(context, this.style, this.mathstyleName);
    const box = Atom.createBox(localContext, this.body, {
      type: this.boxType,
      classes: this.customClass,
      mode: this.mode,
      style: {
        backgroundColor: this.style.backgroundColor,
      },
    });
    if (!box) return box;
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
    let result = this.bodyToLatex(options);

    if (typeof this.latexOpen === 'string') {
      result = this.latexOpen + result + this.latexClose;
    }

    if (this.htmlData) {
      result = `\\htmlData{${this.htmlData}}{${result}}`;
    }
    if (this.htmlStyle) {
      result = `\\htmlStyle{${this.htmlStyle}}{${result}}`;
    }
    if (this.customClass) {
      result = `\\class{${this.customClass}}{${result}}`;
    }
    if (this.cssId) {
      result = `\\cssId{${this.cssId}}{${result}}`;
    }

    return result;
  }
}
