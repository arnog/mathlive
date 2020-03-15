import { defineFunction } from './definitions-utils.js';

defineFunction('color', '{:color}', { allowedInText: true }, (_name, args) => {
    return { color: args[0] };
});

// From the xcolor package.
// As per xcolor, this command does not set the mode to text
// (unlike what its name might suggest)
defineFunction(
    'textcolor',
    '{:color}{content:auto*}',
    { allowedInText: true },
    (_name, args) => {
        return { color: args[0] };
    }
);

// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
defineFunction('boxed', '{content:math}', null, function(name, args) {
    return {
        type: 'box',
        framecolor: 'black',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction(
    'colorbox',
    '{background-color:color}{content:auto}',
    { allowedInText: true },
    function(name, args) {
        return {
            type: 'box',
            backgroundcolor: args[0],
            skipBoundary: true,
            body: args[1],
        };
    }
);

defineFunction(
    'fcolorbox',
    '{frame-color:color}{background-color:color}{content:auto}',
    { allowedInText: true },
    function(name, args) {
        return {
            type: 'box',
            framecolor: args[0],
            backgroundcolor: args[1],
            skipBoundary: true,
            body: args[2],
        };
    }
);

// \bbox, MathJax extension
// The first argument is a CSS border property shorthand, e.g.
// \bbox[red], \bbox[5px,border:2px solid red]
// The MathJax syntax is
// arglist ::= <arg>[,<arg>[,<arg>]]
// arg ::= [<background:color>|<padding:dimen>|<style>]
// style ::= 'border:' <string>

defineFunction('bbox', '[:bbox]{body:auto}', { allowedInText: true }, function(
    name,
    args
) {
    if (args[0]) {
        return {
            type: 'box',
            padding: args[0].padding,
            border: args[0].border,
            backgroundcolor: args[0].backgroundcolor,
            skipBoundary: true,
            body: args[1],
        };
    }
    return {
        type: 'box',
        skipBoundary: true,
        body: args[1],
    };
});

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
    { allowedInText: true },
    function(name, _args) {
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
``;
// SERIES: weight
defineFunction(
    'fontseries',
    '{:text}',
    { allowedInText: true },
    (_name, args) => {
        return { fontSeries: parseArgAsString(args[0]) };
    }
);

defineFunction('bf', '', { allowedInText: true }, (_name, _args) => {
    return { fontSeries: 'b' };
});

defineFunction('bm', '{:math*}', { allowedInText: true }, (_name, _args) => {
    return { fontSeries: 'b' };
});

// Note: switches to math mode
defineFunction('bold', '', { allowedInText: true }, (_name, _args) => {
    return { mode: 'math', fontSeries: 'b' };
});

defineFunction(
    ['mathbf', 'boldsymbol'],
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return { mode: 'math', fontSeries: 'b', fontShape: 'n' };
    }
);

defineFunction('bfseries', '', { allowedInText: true }, (_name, _args) => {
    return { fontSeries: 'b' };
});

defineFunction(
    'textbf',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontSeries: 'b' };
    }
);

defineFunction(
    'mathmd',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return { mode: 'math', fontSeries: 'm', fontShape: 'n' };
    }
);

defineFunction('mdseries', '', { allowedInText: true }, (_name, _args) => {
    return { fontSeries: 'm' };
});

defineFunction(
    'textmd',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontSeries: 'm' };
    }
);

// @todo \textlf

// SHAPE: italic, small caps
defineFunction(
    'fontshape',
    '{:text}',
    { allowedInText: true },
    (_name, args) => {
        return { fontShape: parseArgAsString(args[0]) };
    }
);

defineFunction('it', '', { allowedInText: true }, (_name, _args) => {
    return { fontShape: 'it' };
});

defineFunction(
    'mathit',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return { mode: 'math', fontSeries: 'm', fontShape: 'it' };
    }
);

defineFunction('upshape', '', { allowedInText: true }, (_name, _args) => {
    return { fontShape: 'n' };
});

defineFunction(
    'textup',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontShape: 'n' };
    }
);

defineFunction(
    'textit',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontShape: 'it' };
    }
);

defineFunction('slshape', '', { allowedInText: true }, (_name, _args) => {
    return { fontShape: 'sl' };
});

defineFunction(
    'textsl',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontShape: 'sl' };
    }
);

// Small caps (switches to text mode)
defineFunction('scshape', '', { allowedInText: true }, (_name, _args) => {
    return { mode: 'text', fontShape: 'sc' };
});

defineFunction(
    'textsc',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontShape: 'sc' };
    }
);

// FONT FAMILY: Fraktur, Calligraphic, ...

defineFunction(
    'fontfamily',
    '{:text}',
    { allowedInText: true },
    (_name, args) => {
        return { fontFamily: parseArgAsString(args[0]) };
    }
);

defineFunction(
    'mathrm',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return {
            mode: 'math',
            fontFamily: 'cmr',
            fontSeries: 'm',
            fontShape: 'n',
        };
    }
);

defineFunction('rmfamily', '', { allowedInText: true }, (_name, _args) => {
    return { fontFamily: 'cmr' };
});

defineFunction(
    'textrm',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontFamily: 'cmr' };
    }
);

defineFunction(
    'mathsf',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return {
            mode: 'math',
            baseFontFamily: 'cmss',
            fontSeries: 'm',
            fontShape: 'n',
        };
    }
);

defineFunction('sffamily', '', { allowedInText: true }, (_name, _args) => {
    return { fontFamily: 'cmss' };
});

defineFunction(
    'textsf',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontFamily: 'cmss' };
    }
);

defineFunction(
    'mathtt',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return {
            mode: 'math',
            baseFontFamily: 'cmtt',
            fontSeries: 'm',
            fontShape: 'n',
        };
    }
);

defineFunction('ttfamily', '', { allowedInText: true }, (_name, _args) => {
    return { fontFamily: 'cmtt' };
});

defineFunction(
    'texttt',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontFamily: 'cmtt' };
    }
);

defineFunction(
    ['Bbb', 'mathbb'],
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return { mode: 'math', baseFontFamily: 'bb' };
    }
);

defineFunction(
    ['frak', 'mathfrak'],
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return { baseFontFamily: 'frak' };
    }
);

defineFunction(
    'mathcal',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return {
            mode: 'math',
            baseFontFamily: 'cal',
            fontSeries: 'm',
            fontShape: 'n',
        };
    }
);

defineFunction(
    'mathscr',
    '{:math*}',
    { allowedInText: true },
    (_name, _args) => {
        return {
            mode: 'math',
            baseFontFamily: 'scr',
            fontSeries: 'm',
            fontShape: 'n',
        };
    }
);

// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
defineFunction(
    'textnormal',
    '{:text*}',
    { allowedInText: true },
    (_name, _args) => {
        return { fontFamily: 'cmr', fontShape: 'n', fontSeries: 'n' };
    }
);

// Rough synomym for \text{}
/*
An \mbox within math mode does not use the current math font; rather it uses
the typeface of the surrounding running text.
*/
defineFunction('mbox', '{:text*}', null, (_name, _args) => {
    return { fontFamily: 'cmr' };
});

defineFunction('text', '{:text*}', { allowedInText: true }, (_name, _args) => {
    return {};
});

/* A MathJax extension: assign a class to the element */
defineFunction(
    'class',
    '{name:text}{content:auto*}',
    { allowedInText: true },
    (_name, args) => {
        return { cssClass: parseArgAsString(args[0]) };
    }
);

/* A MathJax extension: assign an ID to the element */
defineFunction(
    'cssId',
    '{id:text}{content:auto}',
    { allowedInText: true },
    (_name, args) => {
        return {
            cssId: parseArgAsString(args[0]),
            body: args[1],
            type: 'group',
        };
    }
);

/* Note: in TeX, \em is restricted to text mode. We extend it to math */
defineFunction('em', '', { allowedInText: true }, (_name, _args) => {
    return { cssClass: 'ML__emph', type: 'group' };
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('emph', '{:auto}', { allowedInText: true }, (_name, args) => {
    return {
        cssClass: 'ML__emph',
        body: args[0],
        type: 'group',
        skipBoundary: true,
    };
});

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
    function(name, args) {
        return {
            type: 'sizeddelim',
            size: DELIMITER_SIZES[name].size,
            cls: DELIMITER_SIZES[name].mclass,
            delim: args[0],
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
    { allowedInText: true },
    function(_name, args) {
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
    function(name, args) {
        const result = {
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
            body: parseArgAsString(args[0]) || args[0],
            captureSelection: true, // Do not let children be selected
            baseFontFamily: name === '\\mathop' ? 'math' : '',
        };
        if (name === '\\mathop') {
            result.limits = 'nolimits';
            result.isFunction = true;
        }
        return result;
    }
);

defineFunction(
    ['operatorname', 'operatorname*'],
    '{operator:math}',
    null,
    function(name, args) {
        const result = {
            type: 'mop',
            skipBoundary: true,
            body: args[0],
            isFunction: true,
        };

        result.body.forEach(x => {
            x.isFunction = false;
            x.autoFontFamily = 'cmr';
        });

        if (name === '\\operatorname') {
            result.limits = 'nolimits';
        } else if (name === '\\operatorname*') {
            result.limits = 'limits';
        }

        return result;
    }
);

defineFunction('unicode', '{charcode:number}', null, function(name, args) {
    let codepoint = parseInt(args[0]);
    if (!isFinite(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
    return {
        type: 'mord',
        body: String.fromCodePoint(codepoint),
    };
});

// A box of the width and height
defineFunction(
    'rule',
    '[raise:dimen]{width:dimen}{thickness:dimen}',
    null,
    function(name, args) {
        return {
            type: 'rule',
            shift: args[0],
            width: args[1],
            height: args[2],
        };
    }
);

// An overline
defineFunction('overline', '{:auto}', null, function(name, args) {
    return {
        type: 'line',
        position: 'overline',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('underline', '{:auto}', null, function(name, args) {
    return {
        type: 'line',
        position: 'underline',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('overset', '{annotation:auto}{symbol:auto}', null, function(
    name,
    args
) {
    return {
        type: 'overunder',
        overscript: args[0],
        skipBoundary: true,
        body: args[1],
    };
});

defineFunction('underset', '{annotation:auto}{symbol:auto}', null, function(
    name,
    args
) {
    return {
        type: 'overunder',
        underscript: args[0],
        skipBoundary: true,
        body: args[1],
    };
});

defineFunction(
    ['overwithdelims' /* 21 */, 'atopwithdelims' /* COMMON */],
    '{left-delim:delim}{right-delim:delim}',
    { infix: true },
    function(name, args) {
        return {
            type: 'genfrac',
            numer: args[0],
            denom: args[1],
            hasBarLine: false,
            leftDelim: args[2],
            rightDelim: args[3],
            mathstyle: 'auto',
        };
    }
);

defineFunction(
    ['stackrel', 'stackbin'],
    '{annotation:auto}{symbol:auto}',
    null,
    function(name, args) {
        return {
            type: 'overunder',
            overscript: args[0],
            skipBoundary: true,
            body: args[1],
            mathtype: name === '\\stackrel' ? 'mrel' : 'mbin',
        };
    }
);

defineFunction('rlap', '{:auto}', null, function(name, args) {
    return {
        type: 'overlap',
        align: 'right',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('llap', '{:auto}', null, function(name, args) {
    return {
        type: 'overlap',
        align: 'left',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('mathrlap', '{:auto}', null, function(name, args) {
    return {
        type: 'overlap',
        mode: 'math',
        align: 'right',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('mathllap', '{:auto}', null, function(name, args) {
    return {
        type: 'overlap',
        mode: 'math',
        align: 'left',
        skipBoundary: true,
        body: args[0],
    };
});
