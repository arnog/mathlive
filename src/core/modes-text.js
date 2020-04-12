import { register, getPropertyRuns } from './modes-utils.js';
import { colorToString } from './color.js';
import { Atom } from './atom.ts';
import { getInfo, charToLatex, unicodeStringToLatex } from './definitions.js';

function emitStringTextRun(_context, run, _expandMacro) {
    let needSpace = false;
    return run
        .map((x) => {
            let result = '';
            let space = '';
            if (x.latex) {
                result = x.latex;
            } else if (typeof x.body === 'string') {
                result = unicodeStringToLatex('text', x.body);
            } else if (x.symbol) {
                result = x.symbol.replace(/\\/g, '\\backslash ');
            }
            if (needSpace && (!result || /^[a-zA-Z0-9*]/.test(result))) {
                space = '{}';
            }
            needSpace = /\\[a-zA-Z0-9]+\*?$/.test(result);
            return space + result;
        })
        .join('');
}

function emitFontShapeTextRun(context, run, expandMacro) {
    return getPropertyRuns(run, 'fontShape')
        .map((x) => {
            const result = emitStringTextRun(context, x, expandMacro);
            if (x[0].fontShape === 'it') {
                return '\\textit{' + result + '}';
            }
            if (x[0].fontShape === 'sl') {
                return '\\textsl{' + result + '}';
            }
            if (x[0].fontShape === 'sc') {
                return '\\textsc{' + result + '}';
            }
            if (x[0].fontShape === 'n') {
                return '\\textup{' + result + '}';
            }
            if (x[0].fontShape) {
                return '\\fontshape{' + x[0].fontShape + '}' + result;
            }
            return result;
        })
        .join('');
}

function emitFontSeriesTextRun(context, run, expandMacro) {
    return getPropertyRuns(run, 'fontSeries')
        .map((x) => {
            const result = emitFontShapeTextRun(context, x, expandMacro);
            if (x[0].fontSeries === 'b') {
                return '\\textbf{' + result + '}';
            }
            if (x[0].fontSeries === 'l') {
                return '\\textlf{' + result + '}';
            }
            if (x[0].fontSeries === 'm') {
                return '\\textmd{' + result + '}';
            }
            if (x[0].fontSeries) {
                return '\\fontseries{' + x[0].fontSeries + '}' + result;
            }
            return result;
        })
        .join('');
}

function emitSizeTextRun(context, run, expandMacro) {
    return getPropertyRuns(run, 'fontSize')
        .map((x) => {
            const result = emitFontSeriesTextRun(context, x, expandMacro);
            const command =
                {
                    size1: 'tiny',
                    size2: 'scriptsize',
                    size3: 'footnotesize',
                    size4: 'small',
                    size5: 'normalsize',
                    size6: 'large',
                    size7: 'Large',
                    size8: 'LARGE',
                    size9: 'huge',
                    size10: 'Huge',
                }[x[0].fontSize] || '';
            if (command) {
                return '\\' + command + ' ' + result;
            }
            return result;
        })
        .join('');
}

function emitFontFamilyTextRun(context, run, expandMacro) {
    return getPropertyRuns(run, 'fontFamily')
        .map((x) => {
            const result = emitSizeTextRun(context, x, expandMacro);
            const command =
                {
                    roman: 'textrm',
                    monospace: 'texttt',
                    'sans-serif': 'textsf',
                }[x[0].fontFamily] || '';
            if (command) {
                return '\\' + command + '{' + result + '}';
            }
            if (x[0].fontFamily) {
                return '\\fontfamily{' + x[0].fontFamily + '}' + result;
            }
            return result;
        })
        .join('');
}

function emitStyledTextRun(context, run, expandMacro) {
    return emitFontFamilyTextRun(context, run, expandMacro);
}

function emitColorRun(context, run, expandMacro) {
    return getPropertyRuns(run, 'color')
        .map((x) => {
            const result = emitStyledTextRun(context, x, expandMacro);

            if (
                x[0].color &&
                x[0].color !== 'none' &&
                (!context || context.color !== x[0].color)
            ) {
                // If there is a color specified, and it is different
                // from our context color, output a command
                return (
                    '\\textcolor{' +
                    colorToString(x[0].color) +
                    '}{' +
                    result +
                    '}'
                );
            }
            return result;
        })
        .join('');
}

function emitLatexTextRun(context, run, expandMacro) {
    const result = emitColorRun(context, run, expandMacro);

    const allAtomsHaveShapeOrSeriesOrFontFamily = run.every(
        (x) => x.fontSeries || x.fontShape || x.fontFamily
    );
    if (
        !allAtomsHaveShapeOrSeriesOrFontFamily ||
        run[0].mode !== context.mode
    ) {
        // Wrap in text, only if there isn't a shape or series on
        // all the atoms, because if so, it will be wrapped in a
        // \\textbf, \\textit, etc... and the \\text would be redundant
        return `\\text{${result}}`;
    }
    return result;
}

const TEXT_FONT_CLASS = {
    roman: '',
    'sans-serif': 'ML__sans',
    monospace: 'ML__tt',
};

function applyStyle(atom, style) {
    const fontFamily = style.fontFamily;

    if (TEXT_FONT_CLASS[fontFamily]) {
        atom.classes += ' ' + TEXT_FONT_CLASS[fontFamily];
    } else if (fontFamily) {
        // Not a well-known family. Use a style.
        atom.setStyle('font-family', fontFamily);
    }

    if (style.fontShape) {
        atom.classes +=
            ' ' +
            ({
                it: 'ML__it',
                sl: 'ML__shape_sl', // slanted
                sc: 'ML__shape_sc', // small caps
                ol: 'ML__shape_ol', // outline
            }[style.fontShape] || '');
    }
    if (style.fontSeries) {
        const m = style.fontSeries.match(/(.?[lbm])?(.?[cx])?/);
        if (m) {
            atom.classes +=
                ' ' +
                ({
                    ul: 'ML__series_ul',
                    el: 'ML__series_el',
                    l: 'ML__series_l',
                    sl: 'ML__series_sl',
                    m: '', // medium (default)
                    sb: 'ML__series_sb',
                    b: 'ML__bold',
                    eb: 'ML__series_eb',
                    ub: 'ML__series_ub',
                }[m[1] || ''] || '');
            atom.classes +=
                ' ' +
                ({
                    uc: 'ML__series_uc',
                    ec: 'ML__series_ec',
                    c: 'ML__series_c',
                    sc: 'ML__series_sc',
                    n: '', // normal (default)
                    sx: 'ML__series_sx',
                    x: 'ML__series_x',
                    ex: 'ML__series_ex',
                    ux: 'ML__series_ux',
                }[m[2] || ''] || '');
        }
    }
    // Always use the metrics of 'Main-Regular' in text mode
    return 'Main-Regular';
}

// Given an array of tokens, return an array of atoms
// options.args
// options.macros
// options.smartFence
// options.style
// options.parser
function parse(tokens, options) {
    let result = [];
    let atom;

    while (tokens.length > 0) {
        const token = tokens.shift();
        if (token.type === 'space') {
            atom = new Atom('text', '', ' ', options.style);
            atom.symbol = ' ';
            result.push(atom);
        } else if (token.type === 'placeholder') {
            // RENDER PLACEHOLDER
            atom = new Atom('text', 'placeholder', token.value);
            atom.captureSelection = true;
            result.push(atom);
        } else if (token.type === 'command') {
            // Invoke the 'main' parser to handle the command
            tokens.unshift(token);
            let atoms;
            [atoms, tokens] = options.parse('text', tokens, options);
            result = [...result, ...atoms];
        } else if (token.type === 'literal') {
            const info = getInfo(token.value, 'text', options.macros);
            atom = new Atom(
                'text',
                info ? info.type : '', // @todo: revisit. Use 'text' type?
                info ? info.value : token.value,
                options.style
            );
            atom.symbol = token.value;
            atom.latex = charToLatex('text', token.value);
            result.push(atom);
        } else if (token.type === '$' || token.type === '$$') {
            // Mode-shift
            const subtokens = tokens.slice(
                0,
                tokens.findIndex((x) => x.type === token.type)
            );
            tokens = tokens.slice(subtokens.length + 1);
            const [atoms] = options.parse('math', subtokens, options);
            result = [...result, ...atoms];
        } else if (token.type === '{' || token.type === '}') {
            // Spurious braces are ignored by TeX in text mode
            // In text mode, braces are sometimes used to separate adjacent
            // commands without inserting a space, e.g. "\backlash{}command"
        } else {
            console.error('Unexpected token type in text mode ', token.type);
        }
    }
    return [result, tokens];
}

register('text', {
    emitLatexRun: emitLatexTextRun,
    applyStyle,
    parse: (tokens, options) => parse(tokens, options)[0],
});
