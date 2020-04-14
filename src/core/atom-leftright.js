import { Atom, registerAtomType, decompose } from './atom-utils.js';
import { makeInner, depth as spanDepth, height as spanHeight } from './span.js';
import { makeLeftRightDelim } from './delimiters';

/**
 *  \left....\right
 *
 * Note that we can encounter malformed \left...\right, for example
 * a \left without a matching \right or vice versa. In that case, the
 * leftDelim (resp. rightDelim) will be undefined. We still need to handle
 * those cases.
 *
 * @private
 */
registerAtomType('leftright', (context, atom) => {
    if (!atom.body) {
        // No body, only a delimiter
        if (atom.leftDelim) {
            return new Atom('math', 'mopen', atom.leftDelim).decompose(context);
        }
        if (atom.rightDelim) {
            return new Atom('math', 'mclose', atom.rightDelim).decompose(
                context
            );
        }
        return null;
    }
    // The scope of the context is this group, so make a copy of it
    // so that any changes to it will be discarded when finished
    // with this group.
    const localContext = context.clone();
    const inner = decompose(localContext, atom.body);
    const mathstyle = localContext.mathstyle;
    let innerHeight = 0;
    let innerDepth = 0;
    let result = [];
    // Calculate its height and depth
    // The size of delimiters is the same, regardless of what mathstyle we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.
    innerHeight = spanHeight(inner) * mathstyle.sizeMultiplier;
    innerDepth = spanDepth(inner) * mathstyle.sizeMultiplier;
    // Add the left delimiter to the beginning of the expression
    if (atom.leftDelim) {
        result.push(
            atom.bind(
                context,
                makeLeftRightDelim(
                    'mopen',
                    atom.leftDelim,
                    innerHeight,
                    innerDepth,
                    localContext,
                    'ML__open'
                )
            )
        );
        result[result.length - 1].applyStyle(atom.getStyle());
    }
    if (inner) {
        // Replace the delim (\middle) spans with proper ones now that we know
        // the height/depth
        for (let i = 0; i < inner.length; i++) {
            if (inner[i].delim) {
                const savedCaret = inner[i].caret;
                const savedSelected = /ML__selected/.test(inner[i].classes);
                inner[i] = atom.bind(
                    context,
                    makeLeftRightDelim(
                        'minner',
                        inner[i].delim,
                        innerHeight,
                        innerDepth,
                        localContext
                    )
                );
                inner[i].caret = savedCaret;
                inner[i].selected(savedSelected);
            }
        }
        result = result.concat(inner);
    }
    // Add the right delimiter to the end of the expression.
    if (atom.rightDelim) {
        let delim = atom.rightDelim;
        let classes;
        if (delim === '?') {
            // Use a placeholder delimiter matching the open delimiter
            delim = {
                '(': ')',
                '\\{': '\\}',
                '\\[': '\\]',
                '\\lbrace': '\\rbrace',
                '\\langle': '\\rangle',
                '\\lfloor': '\\rfloor',
                '\\lceil': '\\rceil',
                '\\vert': '\\vert',
                '\\lvert': '\\rvert',
                '\\Vert': '\\Vert',
                '\\lVert': '\\rVert',
                '\\lbrack': '\\rbrack',
                '\\ulcorner': '\\urcorner',
                '\\llcorner': '\\lrcorner',
                '\\lgroup': '\\rgroup',
                '\\lmoustache': '\\rmoustache',
            }[atom.leftDelim];
            delim = delim || atom.leftDelim;
            classes = 'ML__smart-fence__close';
        }
        result.push(
            atom.bind(
                context,
                makeLeftRightDelim(
                    'mclose',
                    delim,
                    innerHeight,
                    innerDepth,
                    localContext,
                    (classes || '') + ' ML__close'
                )
            )
        );
        result[result.length - 1].applyStyle(atom.getStyle());
    }
    // If the `inner` flag is set, return the `inner` element (that's the
    // behavior for the regular `\left...\right`
    if (atom.inner) return makeInner(result, mathstyle.cls());
    // Otherwise, include a `\mathopen{}...\mathclose{}`. That's the
    // behavior for `\mleft...\mright`, which allows for tighter spacing
    // for example in `\sin\mleft(x\mright)`
    return result;
});
