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
        const result = new Span(
            this.value,
            this.isSuggestion
                ? 'ML__suggestion'
                : this.isError
                ? 'ML__error'
                : '',
            'command'
        );
        if (this.caret) result.caret = this.caret;
        this.bind(context, result);
        return [result];
    }
}
