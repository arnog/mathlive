import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class SpacingAtom extends Atom {
    private width: number;

    constructor(command: string, style: Style, width?: number) {
        super('spacing', { command, style });
        this.width = width;
    }
    render(context: Context): Span[] {
        let result: Span;
        // A spacing command (\quad, etc...)
        // @revisit: is value needed? Is it ever set?
        if (this.value === '\u200b') {
            // ZERO-WIDTH SPACE
            result = this.makeSpan(context, '\u200b');
        } else if (this.value === '\u00a0') {
            if (this.mode === 'math') {
                result = this.makeSpan(context, ' ');
            } else {
                result = this.makeSpan(context, '\u00a0');
            }
        } else if (isFinite(this.width)) {
            result = new Span('\u200b', 'mspace ');
            result.left = this.width;
        } else {
            const spacingCls =
                {
                    '\\qquad': 'qquad',
                    '\\quad': 'quad',
                    '\\enspace': 'enspace',
                    '\\;': 'thickspace',
                    '\\:': 'mediumspace',
                    '\\,': 'thinspace',
                    '\\!': 'negativethinspace',
                }[this.command] ?? 'mediumspace';
            result = new Span('\u200b', 'mspace ' + spacingCls);
        }
        if (this.caret) result.caret = this.caret;
        return [result];
    }
    toLatex(_options: ToLatexOptions): string {
        // Three kinds of spacing commands:
        // \hskip and \kern which take one implicit parameter
        // \hspace and hspace* with take one *explicit* parameter
        // \quad, etc... which take no parameters.
        let result = this.command;
        if (this.command === '\\hspace' || this.command === '\\hspace*') {
            result += '{';
            if (isFinite(this.width)) {
                result += Number(this.width).toString() + 'em';
            } else {
                result += '0em';
            }
            result += '}';
        } else {
            result += ' ';
            if (isFinite(this.width)) {
                result += Number(this.width).toString() + 'em ';
            }
        }
        return result;
    }
}
