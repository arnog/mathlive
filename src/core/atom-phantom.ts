import { Atom, registerAtomType, decompose } from './atom-utils';
import { Span, makeSpan, makeVlist } from './span';
import { Context } from './context';

registerAtomType('phantom', (context: Context, atom: Atom): Span[] => {
    if (atom.phantomType === 'vphantom') {
        const content = makeSpan(
            decompose(context, atom.body as Atom[]),
            'inner'
        );
        return [makeSpan([content, makeSpan(null, 'fix')], 'rlap', 'mord')];
    } else if (
        atom.phantomType === 'hphantom' ||
        atom.phantomType === 'smash' ||
        atom.phantomType === 'bsmash' ||
        atom.phantomType === 'tsmash'
    ) {
        const content = makeSpan(
            decompose(context, atom.body as Atom[]),
            '',
            'mord'
        );
        if (atom.phantomType !== 'bsmash') {
            content.height = 0;
        }
        if (atom.phantomType !== 'tsmash') {
            content.depth = 0;
        }
        return [makeSpan(makeVlist(context, [content]), '', 'mord')];
    }

    return [makeSpan(decompose(context, atom.body as Atom[]), '', 'mord')];
});
