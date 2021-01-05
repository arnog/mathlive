import { ParseMode, Style } from '../public/core';

import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { MATHSTYLES, MathStyleName } from '../core/mathstyle';
import { Span } from '../core/span';

export class GroupAtom extends Atom {
  latexOpen?: string;
  latexClose?: string;
  cssId?: string;
  htmlData?: string;
  customClass?: string;
  mathStyleName: MathStyleName;
  constructor(
    arg: Atom[],
    options?: {
      mathStyleName?: MathStyleName;
      latexOpen?: string;
      latexClose?: string;
      cssId?: string;
      htmlData?: string;
      customClass?: string;
      mode?: ParseMode;
      style?: Style;
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

    this.skipBoundary = true;
  }

  render(context: Context): Span[] {
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
    const span = new Span(Atom.render(localContext, this.body), '', 'mord'); // @revisit
    if (this.cssId) span.cssId = this.cssId;
    if (this.htmlData) span.htmlData = this.htmlData;
    span.applyStyle(
      this.mode,
      {
        backgroundColor: this.style.backgroundColor,
      },
      this.customClass
    );

    if (this.caret) span.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    this.bind(context, span);
    return [span];
  }

  toLatex(options: ToLatexOptions): string {
    const body = this.bodyToLatex(options);

    if (typeof this.latexOpen === 'string') {
      return this.latexOpen + body + this.latexClose;
    }

    if (this.cssId) {
      return `\\cssId{${this.cssId}}${body}}`;
    }
    if (this.htmlData) {
      return `\\htmlData{${this.htmlData}}${body}}`;
    }
    if (this.customClass) {
      return `\\class{${this.customClass}}${body}}`;
    }

    return body;
  }
}
