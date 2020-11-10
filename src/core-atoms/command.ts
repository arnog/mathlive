import { Atom } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class CommandAtom extends Atom {
    isSuggestion?: boolean; // This atom is a suggestion
    isError?: boolean;
    constructor(
        value: string,
        options?: {
            isSuggestion: boolean;
        }
    ) {
        super('command', { value, mode: 'command' });
        if (options?.isSuggestion) {
            this.isSuggestion = true;
        }
    }
    get computedStyle(): Style {
        return {};
    }
    render(context: Context): Span[] {
        const result = this.makeSpan(context, this.value);
        result.classes = ''; // Override fonts and other attributes.
        if (this.isSuggestion) {
            result.classes = ' ML__suggestion';
        } else if (this.isError) {
            result.classes = ' ML__error';
        }
        if (this.caret) result.caret = this.caret;
        return [result];
    }
}
