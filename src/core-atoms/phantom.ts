import { Atom } from '../core/atom-class';
import { Span, makeSpan, makeVlist } from '../core/span';
import { Context } from '../core/context';
import type { Style } from '../public/core';

export type PhantomType =
    | 'phantom'
    | 'vphantom'
    | 'hphantom'
    | 'smash'
    | 'bsmash'
    | 'tsmash';
export class PhantomAtom extends Atom {
    readonly phantomType: PhantomType;
    private isInvisible: boolean;
    constructor(
        command: string,
        body: Atom[],
        options: {
            phantomType?: PhantomType;
            isInvisible?: boolean;
            style: Style;
        }
    ) {
        super('phantom', { command, style: options.style });
        this.captureSelection = true;
        this.body = body;
        this.phantomType = options.phantomType;
        this.isInvisible = options.isInvisible ?? false;
    }
    render(context: Context): Span[] {
        if (this.phantomType === 'vphantom') {
            const content = makeSpan(Atom.render(context, this.body), 'inner');
            content.applyStyle('math', {
                backgroundColor: 'transparent',
                color: 'transparent',
            });
            return [makeSpan([content, makeSpan(null, 'fix')], 'rlap', 'mord')];
        } else if (
            this.phantomType === 'hphantom' ||
            this.phantomType === 'smash' ||
            this.phantomType === 'bsmash' ||
            this.phantomType === 'tsmash'
        ) {
            const content = makeSpan(
                Atom.render(context, this.body),
                '',
                'mord'
            );
            if (this.isInvisible) {
                content.applyStyle('math', {
                    backgroundColor: 'transparent',
                    color: 'transparent',
                });
            }
            if (this.phantomType !== 'bsmash') {
                content.height = 0;
            }
            if (this.phantomType !== 'tsmash') {
                content.depth = 0;
            }
            return [makeSpan(makeVlist(context, [content]), '', 'mord')];
        }

        return [makeSpan(Atom.render(context, this.body), '', 'mord')];
    }
}
