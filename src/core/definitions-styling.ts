import { defineFunction, ParseFunctionResult } from './definitions-utils';
import { colorToString, stringToColor } from './color';
import { Atom, BBoxParam } from './atom-utils';
import { FontShape, FontSeries } from './context';

defineFunction(
    'ensuremath',
    '{:math}',
    {},
    (_name, args) => {
        return {
            type: 'group',
            mode: 'math',
            body: args[0],
            skipBoundary: true,
            latexOpen: '\\ensuremath{',
            latexClose: '}',
        };
    },
    (_name, _parent, atom, emit) => emit(atom, atom.body as Atom[])
);

defineFunction('color', '{:color}', {}, (_name, args) => {
    return { color: args[0] as string };
});

// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to text
// That is, it can equally be applied to math and text mode.
defineFunction('textcolor', '{:color}{content:auto*}', {}, (_name, args) => {
    return { color: args[0] as string };
});

// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
defineFunction('boxed', '{content:math}', null, (_name, args) => {
    return {
        type: 'box',
        framecolor: 'black',
        skipBoundary: true,
        body: args[0],
    };
});

// In LaTeX, \colorbox sets the mode to text
defineFunction(
    'colorbox',
    '{background-color:string}{content:auto}',
    {},
    (_name, args) => {
        return {
            type: 'box',
            backgroundcolor: stringToColor(args[0] as string),
            skipBoundary: true,
            body: args[1],
            verbatimBackgroundcolor: args[0] as string, // Save this value to restore it verbatim later
        };
    },
    (name, _parent, atom, emit) =>
        `${name}{${
            atom.verbatimBackgroundcolor || colorToString(atom.backgroundcolor)
        }}{${emit(atom, atom.body as Atom[])}}`
);

defineFunction(
    'fcolorbox',
    '{frame-color:string}{background-color:string}{content:auto}',
    {},
    (_name, args) => {
        return {
            type: 'box',
            framecolor: stringToColor(args[0] as string),
            backgroundcolor: stringToColor(args[1] as string),
            skipBoundary: true,
            body: args[2],
            verbatimBackgroundcolor: args[1] as string, // Save this value to restore it verbatim later
            verbatimFramecolor: args[0] as string, // Save this value to restore it verbatim later
        };
    },
    (name, _parent, atom, emit) =>
        `${name}{${atom.verbatimFramecolor || colorToString(atom.framecolor)}{${
            atom.verbatimBackgroundcolor || colorToString(atom.backgroundcolor)
        }}{${emit(atom, atom.body as Atom[])}}`
);

// \bbox, MathJax extension
// The first argument is a CSS border property shorthand, e.g.
// \bbox[red], \bbox[5px,border:2px solid red]
// The MathJax syntax is
// arglist ::= <arg>[,<arg>[,<arg>]]
// arg ::= [<background:color>|<padding:dimen>|<style>]
// style ::= 'border:' <string>

defineFunction(
    'bbox',
    '[:bbox]{body:auto}',
    {},
    (_name, args) => {
        if (args[0]) {
            const arg = args[0] as BBoxParam;
            return {
                type: 'box',
                padding: arg.padding,
                border: arg.border,
                backgroundcolor: arg.backgroundcolor,
                skipBoundary: true,
                body: args[1],
            };
        }
        return {
            type: 'box',
            skipBoundary: true,
            body: args[1],
        };
    },
    (name, _parent, atom, emit) => {
        let result = name;
        if (
            isFinite(atom.padding) ||
            typeof atom.border !== 'undefined' ||
            typeof atom.backgroundcolor !== 'undefined'
        ) {
            const bboxParams = [];
            if (isFinite(atom.padding)) {
                bboxParams.push(Math.floor(1e2 * atom.padding) / 1e2 + 'em');
            }
            if (atom.border) {
                bboxParams.push('border:' + atom.border);
            }
            if (atom.backgroundcolor) {
                bboxParams.push(colorToString(atom.backgroundcolor));
            }
            result += `[${bboxParams.join(',')}]`;
        }

        return result + `{${emit(atom, atom.body as Atom[])}}`;
    }
);

// Size
defineFunction(
    [
        'tiny',
        'scriptsize',
        'footnotesize',
        'small',
        'normalsize',
        'large',
        'Large',
        'LARGE',
        'huge',
        'Huge',
    ],
    '',
    {},
    (name, _args) => {
        return {
            fontSize: {
                tiny: 'size1',
                scriptsize: 'size2',
                footnotesize: 'size3',
                small: 'size4',
                normalsize: 'size5',
                large: 'size6',
                Large: 'size7',
                LARGE: 'size8',
                huge: 'size9',
                Huge: 'size10',
            }[name.slice(1)],
        };
    }
);

// \fontseries only works in text mode
defineFunction('fontseries', '{:string}', { mode: 'text' }, (_name, args) => {
    return { fontSeries: (args[0] as string) as FontSeries };
});
// SHAPE: italic, small caps
defineFunction('fontshape', '{:string}', { mode: 'text' }, (_name, args) => {
    return { fontShape: args[0] as FontShape };
});

// FONT FAMILY: Fraktur, Calligraphic, ...
defineFunction('fontfamily', '{:string}', { mode: 'text' }, (_name, args) => {
    return { fontFamily: args[0] as string };
});

// In LaTeX, the \fontseries, \fontshape, \fontfamily, \fontsize commands
// do not take effect until \selectfont is encoded. In our implementation,
// they take effect immediately, and \selectfont is a no-op
defineFunction('selectfont', '', { mode: 'text' }, (_name, _args) => {
    return {};
});

// \bf works in any mode
// As per the LaTeX 2.09 semantics, it overrides shape, family
defineFunction('bf', '', {}, (_name, _args) => {
    return { fontSeries: 'b', fontShape: 'n', fontFamily: 'cmr' };
});

// Note: These function work a little bit differently than LaTex
// In LaTeX, \bm{x\mathrm{y}} yield a bold x and an upright y.
// This is not necesarily intentional, but a side effect of the (current)
// implementation of \bm
defineFunction(['boldsymbol', 'bm'], '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', cssClass: 'ML__boldsymbol' };
});

// Note: switches to math mode
defineFunction('bold', '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', variantStyle: 'bold' };
});

defineFunction('bfseries', '', { mode: 'text' }, (_name, _args) => {
    return { fontSeries: 'b' };
});
defineFunction('mdseries', '', { mode: 'text' }, (_name, _args) => {
    return { fontSeries: 'm' };
});
defineFunction('upshape', '', { mode: 'text' }, (_name, _args) => {
    return { fontShape: 'n' };
});
defineFunction('slshape', '', { mode: 'text' }, (_name, _args) => {
    return { fontShape: 'sl' };
});
// Small caps
defineFunction('scshape', '', { mode: 'text' }, (_name, _args) => {
    return { fontShape: 'sc' };
});

defineFunction('textbf', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontSeries: 'b' };
});
defineFunction('textmd', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontSeries: 'm' };
});

defineFunction('textup', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontShape: 'n' };
});

// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
defineFunction('textnormal', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontShape: 'n', fontSeries: 'm' };
});

defineFunction('textsl', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontShape: 'sl' };
});

defineFunction('textit', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontShape: 'it' };
});

defineFunction('textsc', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontShape: 'sc' };
});
defineFunction('textrm', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontFamily: 'roman' };
});

defineFunction('textsf', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontFamily: 'sans-serif' };
});

defineFunction('texttt', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontFamily: 'monospace' };
});

// Note: \mathbf is a no-op in text mode
defineFunction('mathbf', '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', variant: 'normal', variantStyle: 'bold' };
});

defineFunction('mathit', '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', variant: 'normal', variantStyle: 'italic' };
});

// From the ISOMath package
defineFunction('mathbfit', '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', variant: 'normal', variantStyle: 'bolditalic' };
});

defineFunction('mathrm', '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', variant: 'normal', variantStyle: 'up' };
});

defineFunction(
    'mathsf',
    '{:math*}',
    {},
    (_name, _args): ParseFunctionResult => {
        return { mode: 'math', variant: 'sans-serif', variantStyle: 'up' };
    }
);
defineFunction(
    'mathtt',
    '{:math*}',
    {},
    (_name, _args): ParseFunctionResult => {
        return { mode: 'math', variant: 'monospace', variantStyle: 'up' };
    }
);

defineFunction(
    'it',
    '',
    {},
    (_name, _args): ParseFunctionResult => {
        return {
            fontSeries: 'm',
            fontShape: 'it',
            fontFamily: 'cmr',
            variantStyle: 'italic', // For math mode
        };
    }
);

// In LaTeX, \rmfamily, \sffamily and \ttfamily are no-op in math mode.
defineFunction(
    'rmfamily',
    '',
    {},
    (_name, _args): ParseFunctionResult => {
        return { fontFamily: 'roman' };
    }
);

defineFunction(
    'sffamily',
    '',
    {},
    (_name, _args): ParseFunctionResult => {
        return { fontFamily: 'sans-serif' };
    }
);

defineFunction(
    'ttfamily',
    '',
    {},
    (_name, _args): ParseFunctionResult => {
        return { fontFamily: 'monospace' };
    }
);

// In LaTeX, \Bbb and \mathbb are no-op in text mode.
// They also map lowercase characters to different glyphs.
// Note that \Bbb has been deprecated for over 20 years (as well as \rm, \it, \bf)
defineFunction(
    ['Bbb', 'mathbb'],
    '{:math*}',
    {},
    (_name, _args): ParseFunctionResult => {
        return { variant: 'double-struck', variantStyle: 'up' };
    }
);

defineFunction(['frak', 'mathfrak'], '{:math*}', {}, (_name, _args) => {
    return { variant: 'fraktur', variantStyle: 'up' };
});

defineFunction('mathcal', '{:math*}', {}, (_name, _args) => {
    return { variant: 'calligraphic', variantStyle: 'up' };
});

defineFunction(
    'mathscr',
    '{:math*}',
    {},
    (_name, _args): ParseFunctionResult => {
        return { variant: 'script', variantStyle: 'up' };
    }
);

// Rough synomym for \text{}
/*
An \mbox within math mode does not use the current math font; rather it uses
the typeface of the surrounding running text.
*/
defineFunction(
    'mbox',
    '{:text}',
    null,
    (_name, args): ParseFunctionResult => {
        return {
            type: 'group',
            mode: 'math',
            body: args[0],
        };
    }
);

defineFunction(
    'text',
    '{:text*}',
    null,
    (_name, _args): ParseFunctionResult => {
        return { mode: 'text' };
    }
);

/* A MathJax extension: assign a class to the element */
defineFunction(
    'class',
    '{name:string}{content:auto*}',
    null,
    (_name, args): ParseFunctionResult => {
        return { cssClass: args[0] as string };
    }
);

/* A MathJax extension: assign an ID to the element */
defineFunction(
    'cssId',
    '{id:string}{content:auto}',
    null,
    (_name, args): ParseFunctionResult => {
        return {
            type: 'group',
            body: args[1],
            cssId: args[0] as string,
        };
    }
);

/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
defineFunction(
    'em',
    '',
    null,
    (_name, _args): ParseFunctionResult => {
        return { cssClass: 'ML__emph' };
    }
);

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction(
    'emph',
    '{:auto}',
    null,
    (_name, args): ParseFunctionResult => {
        return {
            cssClass: 'ML__emph',
            body: args[0],
            type: 'group',
            skipBoundary: true,
        };
    }
);

// Extra data needed for the delimiter parse function down below
const DELIMITER_SIZES = {
    '\\bigl': { mclass: 'mopen', size: 1 },
    '\\Bigl': { mclass: 'mopen', size: 2 },
    '\\biggl': { mclass: 'mopen', size: 3 },
    '\\Biggl': { mclass: 'mopen', size: 4 },
    '\\bigr': { mclass: 'mclose', size: 1 },
    '\\Bigr': { mclass: 'mclose', size: 2 },
    '\\biggr': { mclass: 'mclose', size: 3 },
    '\\Biggr': { mclass: 'mclose', size: 4 },
    '\\bigm': { mclass: 'mrel', size: 1 },
    '\\Bigm': { mclass: 'mrel', size: 2 },
    '\\biggm': { mclass: 'mrel', size: 3 },
    '\\Biggm': { mclass: 'mrel', size: 4 },
    '\\big': { mclass: 'mord', size: 1 },
    '\\Big': { mclass: 'mord', size: 2 },
    '\\bigg': { mclass: 'mord', size: 3 },
    '\\Bigg': { mclass: 'mord', size: 4 },
};

defineFunction(
    [
        'bigl',
        'Bigl',
        'biggl',
        'Biggl',
        'bigr',
        'Bigr',
        'biggr',
        'Biggr',
        'bigm',
        'Bigm',
        'biggm',
        'Biggm',
        'big',
        'Big',
        'bigg',
        'Bigg',
    ],
    '{:delim}',
    null,
    function (name, args): ParseFunctionResult {
        return {
            type: 'sizeddelim',
            size: DELIMITER_SIZES[name].size,
            cls: DELIMITER_SIZES[name].mclass,
            delim: args[0] as string,
        };
    }
);

defineFunction(
    [
        'hspace',
        'hspace*',
        // \hspace* inserts a non-breakable space, but since we don't line break...
        // it's the same as \hspace.
    ],
    '{width:skip}',
    {},
    function (_name, args) {
        return {
            type: 'spacing',
            width: args[0] || 0,
        };
    }
);

defineFunction(
    [
        'mathop',
        'mathbin',
        'mathrel',
        'mathopen',
        'mathclose',
        'mathpunct',
        'mathord',
        'mathinner',
    ],
    '{:auto}',
    null,
    (name, args) => {
        const result: ParseFunctionResult = {
            type: {
                '\\mathop': 'mop',
                '\\mathbin': 'mbin',
                '\\mathrel': 'mrel',
                '\\mathopen': 'mopen',
                '\\mathclose': 'mclose',
                '\\mathpunct': 'mpunct',
                '\\mathord': 'mord',
                '\\mathinner': 'minner',
            }[name],
            body: args[0], // Pass the body as an array of atoms, not a string
            // A string would be styled as text, but these need to be interpreted
            // as 'math'
            captureSelection: true, // Do not let children be selected
        };
        if (name === '\\mathop') {
            result.limits = 'limits';
            result.isFunction = true;
        }
        return result;
    },
    (name, _parent, atom, emit) => {
        return `${name}{${emit(atom, atom.body as Atom[])}}`;
    }
);

// @todo see http://mirrors.ibiblio.org/CTAN/macros/latex/required/amsmath/amsopn.pdf
// for list of additional operators

defineFunction(
    ['operatorname', 'operatorname*'],
    '{operator:math}',
    null,
    function (name, args) {
        const result: ParseFunctionResult = {
            type: 'mop',
            captureSelection: true, // Do not let children be selected
            body: args[0],
            isFunction: true,
        };
        /*
        The \operatorname commands is defined with:

        \gdef\newmcodes@{\mathcode`\'39\mathcode`\*42\mathcode`\."613A%
        \ifnum\mathcode`\-=45 \else
            \mathchardef\std@minus\mathcode`\-\relax
        \fi
        \mathcode`\-45\mathcode`\/47\mathcode`\:"603A\relax}


        \mathcode assigns to a character its category (2=mbin), its font family (0=cmr),
        and its character code.

        It basically temporarily reassigns to ":.'-/*" the values/properties
        these characters have in text mode (but importantly, not to " " (space))

        */

        (result.body as Atom[]).forEach((x) => {
            x.isFunction = false;
            if (!x.variant && !x.variantStyle) {
                // No variant as been specified (as it could have been with
                // \operatorname{\mathit{lim}} for example)
                // Bypass the default auto styling by specifing an upright style
                x.variant = 'main';
                x.variantStyle = 'up';
            }
            x.type = 'mord';
            x.body =
                { '\u2217': '*', '\u2212': '-' }[x.body as string] || x.body;
        });

        if (name === '\\operatorname') {
            result.limits = 'nolimits';
        } else if (name === '\\operatorname*') {
            result.limits = 'limits';
        }

        return result;
    }
);

defineFunction(
    'unicode',
    '{charcode:number}',
    null,
    (_name, args) => {
        let codepoint = parseInt(args[0] as string);
        if (!isFinite(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
        return {
            type: 'mord',
            body: String.fromCodePoint(codepoint),
            codepoint: codepoint,
        };
    },
    (name, _parent, atom, _emit) => {
        return `${name}{"${('000000' + atom.codepoint.toString(16))
            .toUpperCase()
            .substr(-6)}}`;
    }
);

// A box of the width and height
defineFunction(
    'rule',
    '[raise:dimen]{width:dimen}{thickness:dimen}',
    null,
    function (name, args) {
        return {
            type: 'rule',
            shift: args[0],
            width: args[1],
            height: args[2],
        };
    }
);

// An overline
defineFunction('overline', '{:auto}', null, (_name, args) => {
    return {
        type: 'line',
        position: 'overline',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('underline', '{:auto}', null, (_name, args) => {
    return {
        type: 'line',
        position: 'underline',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction(
    'overset',
    '{annotation:auto}{symbol:auto}',
    null,
    function (_name, args) {
        return {
            type: 'overunder',
            overscript: args[0],
            skipBoundary: true,
            body: args[1],
        };
    },
    (name, _parent, atom, emit) => {
        return `${name}{${emit(atom, atom.overscript)}}{${emit(
            atom,
            atom.body as Atom[]
        )}}`;
    }
);

defineFunction(
    'underset',
    '{annotation:auto}{symbol:auto}',
    null,
    function (_name, args) {
        return {
            type: 'overunder',
            underscript: args[0],
            skipBoundary: true,
            body: args[1],
        };
    },
    (name, _parent, atom, emit) => {
        return `${name}{${emit(atom, atom.overscript)}}{${emit(
            atom,
            atom.body as Atom[]
        )}}`;
    }
);

defineFunction(
    ['overwithdelims', 'atopwithdelims'],
    '{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}',
    { infix: true },
    function (_name, args): ParseFunctionResult {
        return {
            type: 'genfrac',
            numer: args[0] as Atom[],
            denom: args[1] as Atom[],
            hasBarLine: false,
            leftDelim: args[2] as string,
            rightDelim: args[3] as string,
            mathstyle: 'auto',
        };
    },
    (name, _parent, atom, emit) => {
        return `${emit(atom, atom.numer)} ${name}${atom.leftDelim}${
            atom.rightDelim
        }${emit(atom, atom.denom)}`;
    }
);

defineFunction(
    ['stackrel', 'stackbin'],
    '{annotation:auto}{symbol:auto}',
    null,
    function (name, args) {
        return {
            type: 'overunder',
            overscript: args[0],
            skipBoundary: true,
            body: args[1],
            // Set the correct spacing rule for \stackrel
            mathtype: name === '\\stackrel' ? 'mrel' : 'mbin',
        };
    },
    (name, _parent, atom, emit) =>
        `${name}{${emit(atom, atom.overscript)}}{${emit(
            atom,
            atom.body as Atom[]
        )}}`
);

defineFunction('rlap', '{:auto}', null, function (name, args) {
    return {
        type: 'overlap',
        align: 'right',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('llap', '{:auto}', null, function (name, args) {
    return {
        type: 'overlap',
        align: 'left',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('mathrlap', '{:auto}', null, function (name, args) {
    return {
        type: 'overlap',
        mode: 'math',
        align: 'right',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('mathllap', '{:auto}', null, function (name, args) {
    return {
        type: 'overlap',
        mode: 'math',
        align: 'left',
        skipBoundary: true,
        body: args[0],
    };
});
