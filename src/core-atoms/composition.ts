import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { ParseMode, Style } from '../public/core';

export class CompositionAtom extends Atom {
    constructor(value: string, options?: { mode: ParseMode }) {
        super('composition', { mode: options?.mode ?? 'math', value });
    }
    get computedStyle(): Style {
        return {};
    }
    render(context: Context): Span[] {
        // In theory one would like to be able to draw the clauses
        // in an active composition. Unfortunately, there are
        // no API to give access to those clauses :(
        const result = this.makeSpan(context, this.value);
        result.classes = 'ML__composition';
        if (this.caret) result.caret = this.caret;
        return [result];
    }
    toLatex(_options: ToLatexOptions): string {
        return '';
    }
}
