import { Context } from './context.js';

export const ATOM_REGISTRY = {};

export function registerAtomType(name, decompose) {
    ATOM_REGISTRY[name] = { decompose: decompose };
}

/**
 * Return a list of spans equivalent to atoms.
 * A span is the most elementary type possible, for example 'text'
 * or 'vlist', while the input atoms may be more abstract and complex,
 * such as 'genfrac'
 *
 * @param {Context} context Font family, variant, size, color, etc...
 * @param {(Atom|Atom[])} atoms - A single atom or an array of atoms
 * @return {Span[]}
 * @private
 */
export function decompose(context, atoms) {
    function isDigit(atom) {
        return atom.type === 'mord' && /[0-9,.]/.test(atom.latex);
    }
    function isText(atom) {
        return atom.mode === 'text';
    }

    if (!(context instanceof Context)) {
        // We can be passed either a Context object, or
        // a simple object with some properties set.
        context = new Context(context);
    }

    // In most cases we want to display selection,
    // except if the generateID.groupNumbers flag is set which is used for
    // read aloud.
    const displaySelection =
        !context.generateID || !context.generateID.groupNumbers;

    let result = [];
    if (Array.isArray(atoms)) {
        if (atoms.length === 0) {
            return [];
        } else if (atoms.length === 1) {
            result = atoms[0].decompose(context);
            if (result && displaySelection && atoms[0].isSelected) {
                result.forEach(x => x.selected(true));
            }
            console.assert(!result || Array.isArray(result));
        } else {
            let previousType = 'none';
            let nextType = atoms[1].type;
            let selection = [];
            let digitOrTextStringID = null;
            let lastWasDigit = true;
            let phantomBase = null;
            for (let i = 0; i < atoms.length; i++) {
                // Is this a binary operator ('+', '-', etc...) that potentially
                // needs to be adjusted to a unary operator?
                //
                // When preceded by a mbin, mopen, mrel, mpunct, mop or
                // when followed by a mrel, mclose or mpunct
                // or if preceded or followed by no sibling, a 'mbin' becomes a
                // 'mord'
                if (atoms[i].type === 'mbin') {
                    if (
                        /first|none|mrel|mpunct|mopen|mbin|mop/.test(
                            previousType
                        ) ||
                        /none|mrel|mpunct|mclose/.test(nextType)
                    ) {
                        atoms[i].type = 'mord';
                    }
                }

                // If this is a scaffolding supsub, we'll use the
                // phantomBase from the previous atom to position the supsub.
                // Otherwise, no need for the phantomBase
                if (
                    atoms[i].body !== '\u200b' ||
                    (!atoms[i].superscript && !atoms[i].subscript)
                ) {
                    phantomBase = null;
                }

                if (
                    context.generateID.groupNumbers &&
                    digitOrTextStringID &&
                    ((lastWasDigit && isDigit(atoms[i])) ||
                        (!lastWasDigit && isText(atoms[i])))
                ) {
                    context.generateID.overrideID = digitOrTextStringID;
                }
                const span = atoms[i].decompose(context, phantomBase);
                if (context.generateID) {
                    context.generateID.overrideID = null;
                }
                if (span) {
                    // The result from decompose is always an array
                    // Flatten it (i.e. [[a1, a2], b1, b2] -> [a1, a2, b1, b2]
                    const flat = [].concat.apply([], span);
                    phantomBase = flat;

                    // If this is a digit or text run, keep track of it
                    if (context.generateID && context.generateID.groupNumbers) {
                        if (isDigit(atoms[i]) || isText(atoms[i])) {
                            if (
                                !digitOrTextStringID ||
                                lastWasDigit !== isDigit(atoms[i])
                            ) {
                                // changed from text to digits or vise-versa
                                lastWasDigit = isDigit(atoms[i]);
                                digitOrTextStringID = atoms[i].id;
                            }
                        }
                        if (
                            (!(isDigit(atoms[i]) || isText(atoms[i])) ||
                                atoms[i].superscript ||
                                atoms[i].subscript) &&
                            digitOrTextStringID
                        ) {
                            // Done with digits/text
                            digitOrTextStringID = null;
                        }
                    }

                    if (displaySelection && atoms[i].isSelected) {
                        selection = selection.concat(flat);
                        selection.forEach(x => x.selected(true));
                    } else {
                        if (selection.length > 0) {
                            // There was a selection, but we're out of it now
                            // Append the selection
                            result = [...result, ...selection];
                            selection = [];
                        }
                        result = result.concat(flat);
                    }
                }

                // Since the next atom (and this atom!) could have children
                // use getFinal...() and getInitial...() to get the closest
                // atom linearly.
                previousType = atoms[i].getFinalBaseElement().type;
                nextType = atoms[i + 1]
                    ? atoms[i + 1].getInitialBaseElement().type
                    : 'none';
            }

            // Is there a leftover selection?
            if (selection.length > 0) {
                result = [...result, ...selection];
                selection = [];
            }
        }
    } else if (atoms) {
        // This is a single atom, decompose it
        result = atoms.decompose(context);
        if (result && displaySelection && atoms.isSelected) {
            result.forEach(x => x.selected(true));
        }
    }

    if (!result || result.length === 0) return null;

    console.assert(Array.isArray(result) && result.length > 0);

    // If the mathstyle changed between the parent and the current atom,
    // account for the size difference
    if (context.mathstyle !== context.parentMathstyle) {
        const factor =
            context.mathstyle.sizeMultiplier /
            context.parentMathstyle.sizeMultiplier;
        for (const span of result) {
            console.assert(!Array.isArray(span));
            console.assert(
                typeof span.height === 'number' && isFinite(span.height)
            );
            span.height *= factor;
            span.depth *= factor;
        }
    }
    // If the size changed between the parent and the current group,
    // account for the size difference
    if (context.size !== context.parentSize) {
        const factor =
            SIZING_MULTIPLIER[context.size] /
            SIZING_MULTIPLIER[context.parentSize];
        for (const span of result) {
            console.assert(!Array.isArray(span));
            console.assert(
                typeof span.height === 'number' && isFinite(span.height)
            );
            span.height *= factor;
            span.depth *= factor;
        }
    }

    return result;
}
