

/**
 * This module contains the definition of the commands that are displayed
 * in the command bar.
 * @module editor/commands
 * @private
 */
define([
    'mathlive/core/lexer', 
    'mathlive/core/mathAtom', 
    'mathlive/core/parser', 
    'mathlive/core/span', 
    'mathlive/editor/editor-shortcuts', 
    'mathlive/addons/outputLatex'], 
    function(Lexer, MathAtom, ParserModule, Span, Shortcuts, 
// eslint-disable-next-line no-unused-vars
    OutputLatexModule) {

// Although the OutputLatexModule is not referenced directly, 
// it is required for .toLatex() to work.

/**
 * Description of the commands displayed in the command bar.
 * @type {Array.<Object>}
 * @type {string} [].label - The static button label
 * @type {string} [[].cls] - A CSS class to add to the label
 * @type {string} [[].ariaLabel} - The accessible label for the button. Useful 
 * when the label is an icon or other graphic
 * @type {string} [[].shortcut} - Optional keyboard shortcut for the command.
 * To override the display of the shortcut for the command, use `'none'`
 * @type {string|string[]} [].selector - The selector to be performed when the 
 * command is invoked.
 * @type {number} [[].utility] - A number representing how frequently the 
 * command is expected to be invoked by the user. Used to sort commands so that
 * ones with higher utility are displayed first.
 * @type {function} [[].condition] - A predicate returning true if the command
 * should be displayed given the current context
 * @type {function} [[].arg] - A function returning a mathlist indicating 
 * what should be considered the argument to the command given the current
 * context (it could be the currently selected item, or the item before the 
 * selection or...)
 * @private
 */
const COMMANDS = [
    {
        label:          '&#x21e0',       // LEFTWARDS DASHED ARROW
        cls:            'glyph',
        ariaLabel:      'Left',
        shortcut:       'none',
        selector:       'moveToPreviousChar',
        utility:        1004
    },
    {
        label:          '&#x21e2',       // RIGHTWARDS DASHED ARROW
        cls:            'glyph',
        ariaLabel:      'Right',
        shortcut:       'none',
        selector:       'moveToNextChar',
        utility:        1003
    },
    {
        label:          '&#x21e5',       // TAB
        cls:            'glyph',
        ariaLabel:      'Tab',
        shortcut:       'none',
        selector:       'moveToNextPlaceholder',
        utility:        1002,
        condition:      notInCommandMode
    },
    {
        label:          '&#x232b',       // BACKSPACE
        cls:            'glyph',
        ariaLabel:      'Backspace',
        shortcut:       'none',
        selector:       'deletePreviousChar',
        utility:        1001
    },
    {
        label:          'Copy as LaTeX',
        shortcut:       ['mac:Meta-KeyC', '!mac:Ctrl-KeyC'],
        selector:       ['copyToClipboard'],
        condition:      selectionIsNotEmpty,
        utility:        900
    },
    {
        label:          'Fraktur',
        dynamicLabel:   '\\mathfrak{#0}',
        selector:       ['insert', '\\mathfrak{#0}'],
        condition:      selectionIsSingleUppercaseChar,
        utility:        400
    },
    {
        label:          'Calligraphic',
        dynamicLabel:   '\\mathcal{#0}',
        selector:       ['insert', '\\mathcal{#0}'],
        condition:      selectionIsSingleUppercaseChar,
        utility:        400
    },
    {
        label:          'Blackboard',
        dynamicLabel:   '\\mathbb{#0}',
        selector:       ['insert', '\\mathbb{#0}'],
        condition:      selectionIsSingleUppercaseChar,
        utility:        500
    },
    {
        label:          'Script',
        dynamicLabel:   '\\mathscr{#0}',
        selector:       ['insert', '\\mathscr{#0}'],
        condition:      selectionIsSingleUppercaseChar,
        utility:        300
    },
    {
        label:          'Sans Serif',
        dynamicLabel:   '\\mathsf{#0}',
        selector:       ['insert', '\\mathsf{#0}'],
        condition:      selectionIsSingleUppercaseCharOrDigit,
        utility:        100
    },
    {
        label:          'Typewriter',
        dynamicLabel:   '\\mathtt{#0}',
        selector:       ['insert', '\\mathtt{#0}'],
        condition:      selectionIsNotEmpty,
        utility:        100
    },
    {
        label:          'Bold',
        dynamicLabel:   '\\mathbf{#0}',
        // shortcut:       ['mac:Meta-KeyB', '!mac:Ctrl-KeyB'],,
        selector:       ['insert', '\\mathbf{#0}'],
        condition:      selectionIsNotEmpty,
        utility:        400
    },
    // {
    //     label:          'Italic',
    //     dynamicLabel:   '\\mathit{#0}',
    //     shortcut:       'Meta-KeyI',
    //     selector:       ['insert', '\\mathit{#0}'],
    //     condition:      selectionIsNotEmpty,
    //     utility:        100
    // },
    {
        label:          'Vector',
        dynamicLabel:   '\\vec{#0}',
        selector:       ['insert', '\\vec{#0}', {selectionMode: 'item'}],
        condition:      selectionIsSingleAlphaChar,
        utility:        400
    },
    {
        label:          'Bar',
        dynamicLabel:   '\\bar{#0}',
        selector:       ['insert', '\\bar{#0}'],
        condition:      selectionIsSingleAlphaChar,
        utility:        300
    },
    {
        label:          'Superscript',
        dynamicLabel:   '#0^\\unicode{"2B1A}',
        shortcut:       '^',
        selector:       'moveToSuperscript',
        condition:      supsubCandidate,
        arg:            previousSingleCharOrDigits,
        utility:        700
    },
    // {
    //     label:          'Squared',
    //     dynamicLabel:   '#0^2',
    //     shortcut:       '^',
    //     selector:       '^2',
    //     condition:      supsubCandidate,
    //     arg:            previousSingleCharOrDigits,
    //     utility:        700
    // },
    {
        label:          'Subscript',
        dynamicLabel:   '#0_\\unicode{"2B1A}',
        shortcut:       '_',
        selector:       'moveToSubscript',
        condition:      supsubCandidate,
        arg:            previousSingleCharOrDigits,
        utility:        500
    },
    {
        label:          'Command',
        // dynamicLabel:   '#0_\\unicode{"2B1A}',
        shortcut:       '\\',
        selector:       'enterCommandMode',
        condition:      notInCommandMode,
        // arg:            previousOrSelection,
        utility:        800
    },
    {
        label:          'Complete',
        selector:       'complete',
        shortcut:       'Return',
        condition:      inCommandMode,
        utility:        800
    },
    
];

function CommandContext(parsemode, environment, modifiers, parent, before, selection, after) {
    this.parsemode = parsemode;
    this.environment = environment;
    this.modifiers = modifiers;
    this.parent = parent;
    this.before = before;
    this.selection = selection;
    this.after = after;
    this.depth = 0;

}

// CommandContext.prototype.selection = 

//
// `arg` functions
//

function previousSingleCharOrDigits(ctx) {
    let result;
    if (ctx.selection && ctx.selection.length > 0) {
        result = ctx.selection;
    } else if (ctx.before && ctx.before.length > 0) {
        result = [];
        let i = ctx.before.length - 1;
        while (i >= 0 && ctx.before[i].type === 'mord' && /[0-9.]/.test(ctx.before[i].value)) {
            result.unshift(ctx.before[i]);
            i -= 1;
        }
        if (result.length === 0) {
            // We didn't find a string of digits, look at the previous atom only
            result.push(ctx.before[ctx.before.length - 1]);
        }
    }
    return result;
}

// function previousOrSelection(parent, before, selection, after) {
//         if (selection) {
//             return selection;
//         } else if (before && before.length > 0) {
//             return [before[before.length - 1]];
//         }
// }

//
// `condition` functions
//

function notInCommandMode(ctx) {
    return !ctx.selection && ctx.parsemode !== 'command';
}

function inCommandMode(ctx) {
    return ctx.parsemode === 'command';
}


function selectionIsNotEmpty(ctx) {
        return ctx.selection !== null;
}

function selectionIsSingleUppercaseCharOrDigit(ctx) {
    let result = false;
    if (ctx.selection) {
        const sel = ctx.selection.filter(function(atom) {
            return atom.type === 'mord' && /^[A-Z0-9]$/.test(atom.value);
        });
        result = sel.length === 1;
    }

    return result;
}

function selectionIsSingleUppercaseChar(ctx) {
    let result = false;
    if (ctx.selection) {
        const sel = ctx.selection.filter(function(atom) {
            return atom.type === 'mord' && /^[A-Z]$/.test(atom.value);
        });
        result = sel.length === 1;
    }

    return result;
}

function selectionIsSingleAlphaChar(ctx) {
    let result = false;
    if (ctx.selection) {
        const sel = ctx.selection.filter(function(atom) {
            return atom.type === 'mord' && /^[a-zA-Z]$/.test(atom.value);
        });
        result = sel.length === 1;
    }

    return result;
}

function supsubCandidate(ctx) {
    let result = false;
    if (ctx.before && (!ctx.parent || ctx.parent.type === 'root')) {
        const atom = ctx.before[ctx.before.length - 1];
        result = (atom.type === 'mclose') || 
            (atom.type === 'mord' /* && /^[a-zA-Z0-9]$/.test(atom.value) */);
        result = result && atom.value !== '\u200b';
    }

    return result;
}


/*
let USER_STATS = {
    commands: {
        'delete': {
            count: 100,
            timestamps: {
                keyboard: 333,
                button: 3553
            }
        }
    }
}
*/


/**
 * Return a list of suggested command based on the current insertion context
 * 
 * @param {string} parsemode e.g. `'command'`, `'math'`, etc...
 * @param {string} environment `'array'`, `'matrix'`, or `''`/`null`
 * @param {string} modifiers A string describing the state of the keyboard 
 * modifiers
 * @param {MathAtom[]} before atoms before the insertion point/selection
 * @param {MathAtom[]} selection selected atoms (or null if insertion point)
 * @param {MathAtom[]} after atoms after the insertion point/selection
 * @param {Object} config a set of key/value pairs to specify custom commands
 * @memberof module:editor/commands
 * @private
 */
function suggest(parsemode, environment, modifiers, 
    parent, before, selection, after, 
    config) {
    const result = [];

    const context = new CommandContext(parsemode, environment, modifiers, 
        parent, before, selection, after);

    let commands = [];
    if (!config || !config.overrideDefaultCommands) {
        commands = Object.assign(commands, COMMANDS);
    }
    if (config && config.commands) {
        commands = Object.assign(commands, config.commands);
    }

    for (const command of commands) {
        if (!command.condition || command.condition(context)) {
            // This command is applicable given the current context 
            // (what is selected, what is after/before the selection, etc...)

            const shortcuts = command.shortcut || Shortcuts.getShortcutsForCommand(command.selector);
            const shortcutLabel = shortcuts && shortcuts !== 'none' ? 
                Shortcuts.stringify(shortcuts) : '';

            let label = command.label || '';
            if (command.dynamicLabel) {
                const arg = !command.arg ? selection : 
                    command.arg(context);
                label = '<span class="ML__dynamicLabel">' + 
                    latexToMarkup(command.dynamicLabel, arg) +
                    '</span>';
                if (command.label) {
                    label += '<span class="ML__shortLabel">' + 
                        command.label + 
                        '<span class="ML__keyboardShortcut">' + 
                        shortcutLabel + 
                        '</span>';
                }
            } else if (shortcutLabel) {
                label += '<span class="ML__keyboardShortcut">' + 
                    shortcutLabel + 
                '</span>';
            }

            result.push({
                label: label, 
                cls: command.cls, 
                ariaLabel: command.ariaLabel, 
                selector: command.selector,
                utility: command.utility
            });
        }
    }

    result.sort(function(a, b) { return  b.utility - a.utility; } );

    return result;
}
/*

function record(modality, selector) {
    // modality = [keyboard, button]
}

function loadUserStats(stats) {
    // load de-JSON-ify
}

function saveUserStats() {
    return USER_STATS; // JSON infy
}
*/

function latexToMarkup(latex, arg) {
    const args = [];
    
    if (arg && arg.length > 0) {
        // Clone the argument mathlist, `arg`, by converting it to LaTeX, then
        // back to mathlist
        let latex = '';
        for (const atom of arg) {
            latex += atom.toLatex();
        }

        args.push(ParserModule.parseTokens(Lexer.tokenize(latex), 'math'));
    }

    const parse = ParserModule.parseTokens(Lexer.tokenize(latex), 'math', args);
    const spans = MathAtom.decompose({mathstyle: 'displaystyle'}, parse);
    
    const base = Span.makeSpan(spans, 'ML__base');

    const topStrut = Span.makeSpan('', 'ML__strut');
    topStrut.setStyle('height', base.height, 'em');
    const bottomStrut = Span.makeSpan('', 'ML__strut ML__bottom');
    bottomStrut.setStyle('height', base.height + base.depth, 'em');
    bottomStrut.setStyle('vertical-align', -base.depth, 'em');
    const wrapper = Span.makeSpan([topStrut, bottomStrut, base], 'ML__mathlive');

    return wrapper.toMarkup();
}

return {
    suggest: suggest,
    // record: record,
    // loadUserStats: loadUserStats,
    // saveUserStats: saveUserStats,

};

});