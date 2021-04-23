import { ParseMode, Style } from '../public/core';

import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { MATHSTYLES, MathStyleName } from '../core/mathstyle';
import { Span, SpanType } from '../core/span';

export class GroupAtom extends Atom {
  latexOpen?: string;
  latexClose?: string;
  cssId?: string;
  htmlData?: string;
  customClass?: string;
  mathStyleName: MathStyleName;
  spanType: SpanType;
  constructor(
    arg: Atom[],
    options?: {
      spanType?: SpanType;
      changeMode?: boolean;
      mathStyleName?: MathStyleName;
      latexOpen?: string;
      latexClose?: string;
      cssId?: string;
      htmlData?: string;
      customClass?: string;
      mode?: ParseMode;
      style?: Style;
      captureSelection?: boolean;
      toLatexOverride?: (atom: GroupAtom, options: ToLatexOptions) => string;
    }
  ) {
    super('group', {
      mode: options?.mode ?? 'math',
      toLatexOverride: options?.toLatexOverride,
      style: options?.style,
    });
    this.body = arg;
    this.mathStyleName = options?.mathStyleName;

    this.latexOpen = options?.latexOpen;
    this.latexClose = options?.latexClose;
    this.cssId = options?.cssId;
    this.htmlData = options?.htmlData;
    this.customClass = options?.customClass;

    this.spanType = options?.spanType;
    this.skipBoundary = true;
    this.captureSelection = options?.captureSelection;
    this.changeMode = options?.changeMode ?? false;
  }

  render(context: Context): Span {
    // The scope of the context is this group, so clone it
    // so that any changes to it will be discarded when finished
    // with this group.
    // Note that the mathstyle property is optional and could be undefined
    // If that's the case, clone() returns a clone of the
    // context with the same mathstyle.
    const localContext = context.clone({
      mathstyle: this.mathStyleName
        ? MATHSTYLES[this.mathStyleName]
        : undefined,
    });
    const span = Atom.render(localContext, this.body, {
      type: this.spanType ?? 'mord',
      classes: this.customClass,
      mode: this.mode,
      style: {
        backgroundColor: this.style.backgroundColor,
      },
    }); // @revisit
    if (this.cssId) span.cssId = this.cssId;
    if (this.htmlData) span.htmlData = this.htmlData;
    if (this.caret) span.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    return this.bind(context, span);
  }

  toLatex(options: ToLatexOptions): string {
    let result = this.bodyToLatex(options);

    if (typeof this.latexOpen === 'string') {
      result = this.latexOpen + result + this.latexClose;
    }

    if (this.htmlData) {
      result = `\\htmlData{${this.htmlData}}${result}`;
    }
    if (this.customClass) {
      result = `\\class{${this.customClass}}${result}`;
    }
    if (this.cssId) {
      result = `\\cssId{${this.cssId}}${result}`;
    }

    return result;
  }
}
