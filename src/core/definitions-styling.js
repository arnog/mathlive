import { defineFunction, parseArgAsString } from './definitions-utils.js';

defineFunction('color', '{:color}', {}, (_name, args) => {
    return { color: args[0] };
});

// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to text
defineFunction('textcolor', '{:color}{content:auto*}', {}, (_name, args) => {
    return { color: args[0] };
});

// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
defineFunction('boxed', '{content:math}', null, function (name, args) {
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
    {},
    function (name, args) {
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
    {},
    function (name, args) {
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

defineFunction('bbox', '[:bbox]{body:auto}', {}, function (name, args) {
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
    {},
    function (name, _args) {
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

// \fontseries only works in text mode
defineFunction('fontseries', '{:text}', { mode: 'text' }, (_name, args) => {
    return { fontSeries: parseArgAsString(args[0]) };
});
// SHAPE: italic, small caps
defineFunction('fontshape', '{:text}', { mode: 'text' }, (_name, args) => {
    return { fontShape: parseArgAsString(args[0]) };
});

// FONT FAMILY: Fraktur, Calligraphic, ...
defineFunction('fontfamily', '{:text}', { mode: 'text' }, (_name, args) => {
    return { fontFamily: parseArgAsString(args[0]) };
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

// \bm only works in math mode
defineFunction('bm', '{:math*}', { mode: 'math' }, (_name, _args) => {
    return {
        mode: 'math',
        fontSeries: 'b',
        fontShape: 'n',
        fontFamily: 'cmr',
    };
});

// Note: switches to math mode
defineFunction('bold', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        fontSeries: 'b',
        fontShape: 'n',
        fontFamily: 'cmr',
    };
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
    return { mode: 'text', fontFamily: 'cmr' };
});

defineFunction('textsf', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontFamily: 'cmss' };
});

defineFunction('texttt', '{:text*}', {}, (_name, _args) => {
    return { mode: 'text', fontFamily: 'cmtt' };
});

// Note: in LaTeX, \mathbf is a no-op in text mode.
defineFunction(['mathbf', 'boldsymbol'], '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', fontSeries: 'b', fontShape: 'n', fontFamily: 'cmr' };
});
defineFunction('mathmd', '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', fontSeries: 'm', fontShape: 'n', fontFamily: 'cmr' };
});
defineFunction('mathit', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        fontSeries: 'm',
        fontShape: 'it',
        fontFamily: 'cmr',
    };
});
defineFunction('mathrm', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        fontSeries: 'm',
        fontShape: 'n',
        baseFontFamily: 'cmr',
    };
});

defineFunction('mathsf', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        baseFontFamily: 'cmss',
        fontSeries: 'm',
        fontShape: 'n',
    };
});
defineFunction('mathtt', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        baseFontFamily: 'cmtt',
        fontSeries: 'm',
        fontShape: 'n',
    };
});

defineFunction('it', '', {}, (_name, _args) => {
    return {
        fontSeries: 'm',
        fontShape: 'it',
        fontFamily: 'cmr',
    };
});

// In LaTeX, \rmfamily, \sffamily and \ttfamily are no-op in math mode.
defineFunction('rmfamily', '', {}, (_name, _args) => {
    return { fontFamily: 'cmr' };
});

defineFunction('sffamily', '', {}, (_name, _args) => {
    return { fontFamily: 'cmss' };
});

defineFunction('ttfamily', '', {}, (_name, _args) => {
    return { fontFamily: 'cmtt' };
});

// In LaTeX, \Bbb and \mathbb are no-op in math mode.
// They also map lowercase characters to different glyphs.
// Note that \Bbb has been deprecated for over 20 years (as well as \rm, \it, \bf)
defineFunction(['Bbb', 'mathbb'], '{:math*}', {}, (_name, _args) => {
    return { mode: 'math', baseFontFamily: 'bb' };
});

defineFunction(['frak', 'mathfrak'], '{:math*}', {}, (_name, _args) => {
    return { baseFontFamily: 'frak' };
});

defineFunction('mathcal', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        baseFontFamily: 'cal',
        fontSeries: 'm',
        fontShape: 'n',
    };
});

defineFunction('mathscr', '{:math*}', {}, (_name, _args) => {
    return {
        mode: 'math',
        baseFontFamily: 'scr',
        fontSeries: 'm',
        fontShape: 'n',
    };
});

// Rough synomym for \text{}
/*
An \mbox within math mode does not use the current math font; rather it uses
the typeface of the surrounding running text.
*/
defineFunction('mbox', '{:text*}', null, (_name, _args) => {
    return { mode: 'text', fontFamily: 'cmr' };
});

defineFunction('text', '{:text*}', null, (_name, _args) => {
    return { mode: 'text' };
});

/* A MathJax extension: assign a class to the element */
defineFunction('class', '{name:text}{content:auto*}', null, (_name, args) => {
    return { cssClass: parseArgAsString(args[0]) };
});

/* A MathJax extension: assign an ID to the element */
defineFunction('cssId', '{id:text}{content:auto}', null, (_name, args) => {
    return {
        cssId: parseArgAsString(args[0]),
        body: args[1],
        type: 'group',
    };
});

/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
defineFunction('em', '', null, (_name, _args) => {
    return { cssClass: 'ML__emph' };
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('emph', '{:auto}', null, (_name, args) => {
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
    function (name, args) {
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
    function (name, args) {
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
    function (name, args) {
        const result = {
            type: 'mop',
            skipBoundary: true,
            body: args[0],
            isFunction: true,
        };

        result.body.forEach((x) => {
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

defineFunction('unicode', '{charcode:number}', null, function (name, args) {
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
defineFunction('overline', '{:auto}', null, function (name, args) {
    return {
        type: 'line',
        position: 'overline',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('underline', '{:auto}', null, function (name, args) {
    return {
        type: 'line',
        position: 'underline',
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction('overset', '{annotation:auto}{symbol:auto}', null, function (
    _name,
    args
) {
    return {
        type: 'overunder',
        overscript: args[0],
        skipBoundary: true,
        body: args[1],
    };
});

defineFunction('underset', '{annotation:auto}{symbol:auto}', null, function (
    _name,
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
    '{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}',
    { infix: true },
    function (_name, args) {
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
    function (name, args) {
        return {
            type: 'overunder',
            overscript: args[0],
            skipBoundary: true,
            body: args[1],
            // Set the correct spacing rule for \stackrel
            mathtype: name === '\\stackrel' ? 'mrel' : 'mbin',
        };
    }
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
