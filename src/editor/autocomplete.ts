import { ModelPrivate } from './model-utils';
import { Atom } from '../core/atom';
import { parseString } from '../core/parser';
import { suggest, commandAllowed } from '../core/definitions-utils';
import { register as registerCommand } from './commands';
import { hidePopover, showPopoverWithLatex } from './editor-popover';
import { insert } from './model-insert';
import {
    decorateCommandStringAroundInsertionPoint,
    extractCommandStringAroundInsertionPoint,
    spliceCommandStringAroundInsertionPoint,
} from './model-command-mode';
import { removeSuggestion } from './model-utils';
import { positionInsertionPointAfterCommitedCommand } from './model-selection';
import { Mathfield } from './mathfield-utils';
import { requestUpdate } from './mathfield-render';

export function insertSuggestion(model: ModelPrivate, s, l): void {
    removeSuggestion(model);

    const mathlist = [];

    // Make a mathlist from the string argument with the `suggestion` property set
    const subs = s.substr(l);
    for (const c of subs) {
        const atom = new Atom('command', 'command', c);
        atom.suggestion = true;
        mathlist.push(atom);
    }

    // Splice in the mathlist after the insertion point, but don't change the
    // insertion point
    Array.prototype.splice.apply(
        model.siblings(),
        [model.anchorOffset() + 1, 0].concat(mathlist)
    );
}

/**
 * When in command mode, insert the select command and return to math mode
 * If escape is true, the command is discared.
 * @param options.discard if true, the command is discarded and the
 * mode switched back to math
 * @param options.acceptSuggestion if true, accept the suggestion to
 * complete the command. Otherwise, only use what has been entered so far.
 */
export function complete(
    mathfield: Mathfield,
    options?: {
        discard?: boolean;
        acceptSuggestion?: boolean;
    }
) {
    options = options || { acceptSuggestion: false };
    hidePopover(mathfield);
    if (options.discard) {
        spliceCommandStringAroundInsertionPoint(mathfield.model, null);
        mathfield.switchMode('math');
        return true;
    }
    const command = extractCommandStringAroundInsertionPoint(
        mathfield.model,
        !options.acceptSuggestion
    );
    if (command) {
        if (command === '\\(' || command === '\\)') {
            spliceCommandStringAroundInsertionPoint(mathfield.model, []);
            insert(mathfield.model, command.slice(1), {
                mode: mathfield.mode,
            });
        } else {
            // We'll assume we want to insert in math mode
            // (commands are only available in math mode)
            const mode = 'math';
            if (commandAllowed(mode, command)) {
                const mathlist = parseString(
                    command,
                    mode,
                    null,
                    mathfield.config.macros
                );
                spliceCommandStringAroundInsertionPoint(
                    mathfield.model,
                    mathlist
                );
            } else {
                // mathfield wasn't a simple function or symbol.
                // Interpret the input as LaTeX code
                const mathlist = parseString(
                    command,
                    mode,
                    null,
                    mathfield.config.macros
                );
                if (mathlist) {
                    spliceCommandStringAroundInsertionPoint(
                        mathfield.model,
                        mathlist
                    );
                } else {
                    decorateCommandStringAroundInsertionPoint(
                        mathfield.model,
                        true
                    );
                }
            }
        }
        mathfield.undoManager.snapshot(mathfield.config);
        mathfield.model.announce('replacement');
        return true;
    }
    return false;
}

function updateSuggestion(mathfield: Mathfield): boolean {
    positionInsertionPointAfterCommitedCommand(mathfield.model);
    removeSuggestion(mathfield.model);
    const command = extractCommandStringAroundInsertionPoint(mathfield.model);
    const suggestions = suggest(command);
    if (suggestions.length === 0) {
        hidePopover(mathfield);
        decorateCommandStringAroundInsertionPoint(mathfield.model, true);
    } else {
        const index = mathfield.suggestionIndex % suggestions.length;
        const l = command.length - suggestions[index].match.length;
        if (l !== 0) {
            insertSuggestion(mathfield.model, suggestions[index].match, l);
        }
        showPopoverWithLatex(
            mathfield,
            suggestions[index].match,
            suggestions.length > 1
        );
    }
    requestUpdate(mathfield);
    return true;
}

function nextSuggestion(mathfield: Mathfield): boolean {
    mathfield.suggestionIndex += 1;
    // The modulo of the suggestionIndex is used to determine which suggestion
    // to display, so no need to worry about rolling over.
    updateSuggestion(mathfield);
    return false;
}

function previousSuggestion(mathfield: Mathfield): boolean {
    mathfield.suggestionIndex -= 1;
    if (mathfield.suggestionIndex < 0) {
        // We're rolling over
        // Get the list of suggestions, so we can know how many there are
        // Not very efficient, but simple.
        removeSuggestion(mathfield.model);
        const command = extractCommandStringAroundInsertionPoint(
            mathfield.model
        );
        const suggestions = suggest(command);
        mathfield.suggestionIndex = suggestions.length - 1;
    }
    updateSuggestion(mathfield);
    return false;
}

registerCommand(
    {
        complete: complete,
        nextSuggestion: nextSuggestion,
        previousSuggestion: previousSuggestion,
    },
    { target: 'mathfield', category: 'autocomplete' }
);
