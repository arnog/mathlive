/*
 * Return an array of runs (array of atoms with the same value
 *   for the specified property)
 */
export function getPropertyRuns(atoms, property) {
    const result = [];
    let run = [];
    let currentValue;
    atoms.forEach((atom) => {
        if (atom.type !== 'first') {
            let value;
            if (property === 'variant') {
                value = atom.variant;
                if (atom.variantStyle && atom.variantStyle !== 'up') {
                    value += '-' + atom.variantStyle;
                }
            } else {
                value = atom[property];
            }
            // If the value of this atom is different from the
            // current value, start a new run
            if (value !== currentValue) {
                if (run.length > 0) result.push(run);
                run = [atom];
                currentValue = value;
            } else {
                // Same value, add it to the current run
                run.push(atom);
            }
        }
    });

    // Push whatever is left
    if (run.length > 0) result.push(run);
    return result;
}

export const MODES_REGISTRY = {};

export function register(name, definition) {
    MODES_REGISTRY[name] = { ...definition };
}

export function emitLatexRun(parent, run, expandMacro) {
    if (
        MODES_REGISTRY[run[0].mode] &&
        MODES_REGISTRY[run[0].mode].emitLatexRun
    ) {
        return MODES_REGISTRY[run[0].mode].emitLatexRun(
            parent,
            run,
            expandMacro
        );
    }
    return '';
}

export function parseTokens(mode, tokens, options) {
    if (MODES_REGISTRY[mode] && MODES_REGISTRY[mode].parse) {
        return MODES_REGISTRY[mode].parse(tokens, options);
    }
    return null;
}

/*
 * Apply the styling (bold, italic, etc..) as classes to the atom, and return
 * the effective font name to be used for metrics
 * ('Main-Regular', 'Caligraphic-Regualr' etc...)
 */
export function applyStyle(atom, style) {
    if (MODES_REGISTRY[style.mode] && MODES_REGISTRY[style.mode].applyStyle) {
        return MODES_REGISTRY[style.mode].applyStyle(atom, style);
    }
    return '';
}
