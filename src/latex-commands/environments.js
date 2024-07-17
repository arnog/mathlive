"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.makeEnvironment = void 0;
var atom_class_1 = require("../core/atom-class");
var placeholder_1 = require("../atoms/placeholder");
var array_1 = require("../atoms/array");
var definitions_utils_1 = require("./definitions-utils");
/*
The star at the end of the name of a displayed math environment causes that
the formula lines won't be numbered. Otherwise they would automatically get a number.

\notag will also turn off the numbering.
\shoveright and \shoveleft will force alignment of a line

The only difference between align and equation is the spacing of the formulas.
You should attempt to use equation when possible, and align when you have multi-line formulas.
Equation will have space before/after < 1em if line before/after is short enough.

Also: equation throws an error when you have an & inside the environment,
so look out for that when converting between the two.

Whereas align produces a structure whose width is the full line width, aligned
gives a width that is the actual width of the contents, thus it can be used as
a component in a containing expression, e.g. for putting the entire alignment
in a parenthesis
*/
(0, definitions_utils_1.defineEnvironment)(['math', 'displaymath'], makeEnvironment);
(0, definitions_utils_1.defineEnvironment)('center', makeEnvironment);
(0, definitions_utils_1.defineFunction)('displaylines', '', {
    parse: function (parser) {
        var lines = [];
        var line = [];
        parser.beginContext({ tabular: true });
        do {
            if (parser.end())
                break;
            if (parser.match('<}>'))
                break;
            if (parser.matchColumnSeparator() || parser.matchRowSeparator()) {
                lines.push([line]);
                line = [];
            }
            else {
                line.push.apply(line, parser.scan(function (token) {
                    return ['<}>', '&', '\\cr', '\\\\', '\\tabularnewline'].includes(token);
                }));
            }
        } while (true);
        parser.endContext();
        lines.push([line]);
        return lines;
    },
    createAtom: function (options) {
        return new array_1.ArrayAtom('lines', options.args, [], {
            // arraystretch: 1.2,
            leftDelim: '.',
            rightDelim: '.',
            columns: [{ align: 'l' }]
        });
    }
});
(0, definitions_utils_1.defineTabularEnvironment)('array', '{columns:colspec}', function (name, array, rowGaps, args) {
    return new array_1.ArrayAtom(name, defaultContent(array), rowGaps, {
        columns: args[0],
        mathstyleName: 'textstyle'
    });
});
(0, definitions_utils_1.defineTabularEnvironment)(['equation', 'equation*', 'subequations'], '', function (name, array, rowGaps) {
    return new array_1.ArrayAtom(name, defaultContent(array), rowGaps, {
        columns: [{ align: 'c' }]
    });
});
// Note spelling: MULTLINE, not multiline.
(0, definitions_utils_1.defineTabularEnvironment)(['multline', 'multline*'], '', makeEnvironment);
// An AMS-Math environment
// See amsmath.dtx:3565
// Note that some versions of AMS-Math have a gap on the left.
// More recent version suppresses that gap, but have an option to turn it back on
// for backward compatibility.
// Note that technically, 'eqnarray' behaves (slightly) differently. However,
// is is generally recommended to avoid using eqnarray and use align isntead.
// https://texblog.net/latex-archive/maths/eqnarray-align-environment/
(0, definitions_utils_1.defineTabularEnvironment)(['align', 'align*', 'aligned', 'eqnarray'], '', makeEnvironment);
// DefineEnvironment('alignat', '', function(name, args) {
//     return {
//     };
// });
// defineEnvironment('flalign', '', function(name, args) {
//     return {
//     };
// });
(0, definitions_utils_1.defineTabularEnvironment)('split', '', makeEnvironment);
// An AMS-Math environment
// %    The \env{gathered} environment is for several lines that are
// %    centered independently.
// From amstex.sty
// \newenvironment{gathered}[1][c]{%
//   \relax\ifmmode\else\nonmatherr@{\begin{gathered}}\fi
//   \null\,%
//   \if #1t\vtop \else \if#1b\vbox \else \vcenter \fi\fi
//   \bgroup\Let@\restore@math@cr
//   \ifinany@\else\openup\jot\fi\ialign
//   \bgroup\hfil\strut@$\m@th\displaystyle##$\hfil\crcr
(0, definitions_utils_1.defineTabularEnvironment)(['gather', 'gather*', 'gathered'], '', makeEnvironment);
// DefineEnvironment('cardinality', '',  function() {
//     const result = {};
//     result.mathstyle = 'textstyle';
//     result.lFence = '|';
//     result.rFence = '|';
//     return result;
// });
(0, definitions_utils_1.defineTabularEnvironment)([
    'matrix',
    'pmatrix',
    'bmatrix',
    'Bmatrix',
    'vmatrix',
    'Vmatrix',
    'matrix*',
    'pmatrix*',
    'bmatrix*',
    'Bmatrix*',
    'vmatrix*',
    'Vmatrix*',
], '[columns:colspec]', makeEnvironment);
(0, definitions_utils_1.defineTabularEnvironment)(['smallmatrix', 'smallmatrix*'], '[columns:colspec]', makeEnvironment);
// \cases is standard LaTeX
// \dcases is from the mathtools package
// \rcases is from the mathtools package
// From amstex.sty:
// \def\cases{\left\{\def\arraystretch{1.2}\hskip-\arraycolsep
//   \array{l@{\quad}l}}
// \def\endcases{\endarray\hskip-\arraycolsep\right.}
// From amsmath.dtx
// \def\env@cases{%
//   \let\@ifnextchar\new@ifnextchar
//   \left\lbrace
//   \def\arraystretch{1.2}%
//   \array{@{}l@{\quad}l@{}}%
(0, definitions_utils_1.defineTabularEnvironment)(['cases', 'dcases', 'rcases'], '', makeEnvironment);
// This is a text mode environment
/*
\begin{theorem}
Let $f$ be a function whose derivative exists in every point, then $f$
is a continuous function.
\end{theorem}
*/
// defineEnvironment('theorem', '', function () {
//     return {};
// });
function isContentEmpty(array) {
    for (var _i = 0, array_2 = array; _i < array_2.length; _i++) {
        var row = array_2[_i];
        for (var _a = 0, row_1 = row; _a < row_1.length; _a++) {
            var col = row_1[_a];
            if (col.length > 0)
                return false;
        }
    }
    return true;
}
function defaultContent(array, count) {
    if (count === void 0) { count = 1; }
    if (isContentEmpty(array)) {
        return Array(count).fill([
            [new atom_class_1.Atom({ type: 'first' }), new placeholder_1.PlaceholderAtom()],
        ]);
    }
    return array.map(function (row) {
        if (row.length === 0)
            return [[new atom_class_1.Atom({ type: 'first' })]];
        return row.map(function (cell) {
            if (cell.length === 0)
                return [new atom_class_1.Atom({ type: 'first' })];
            if (cell[0].type === 'first')
                return cell;
            return __spreadArray([new atom_class_1.Atom({ type: 'first' })], cell, true);
        });
    });
}
function makeEnvironment(name, content, rowGaps, args, maxMatrixCols) {
    if (content === void 0) { content = [[[]]]; }
    if (rowGaps === void 0) { rowGaps = []; }
    if (args === void 0) { args = []; }
    content = defaultContent(content, ['split', 'align', 'align*', 'aligned', 'eqnarray'].includes(name) ? 2 : 1);
    switch (name) {
        case 'math':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle'
            });
        case 'displaymath':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle'
            });
        case 'center':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                columns: [{ align: 'c' }]
            });
        case 'multline':
        case 'multline*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                columns: [{ align: 'm' }],
                leftDelim: '.',
                rightDelim: '.'
            });
        case 'split':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                columns: [{ align: 'r' }, { align: 'l' }],
                minColumns: 2
            });
        case 'gather':
        case 'gathered':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                columns: [{ gap: 0.25 }, { align: 'c' }, { gap: 0 }]
            });
        case 'pmatrix':
        case 'pmatrix*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle',
                leftDelim: '(',
                rightDelim: ')',
                columns: defaultColumns(args[0], maxMatrixCols)
            });
        case 'bmatrix':
        case 'bmatrix*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle',
                leftDelim: '[',
                rightDelim: ']',
                columns: defaultColumns(args[0], maxMatrixCols)
            });
        case 'Bmatrix':
        case 'Bmatrix*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle',
                leftDelim: '\\lbrace',
                rightDelim: '\\rbrace',
                columns: defaultColumns(args[0], maxMatrixCols)
            });
        case 'vmatrix':
        case 'vmatrix*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle',
                leftDelim: '\\vert',
                rightDelim: '\\vert',
                columns: defaultColumns(args[0], maxMatrixCols)
            });
        case 'Vmatrix':
        case 'Vmatrix*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle',
                leftDelim: '\\Vert',
                rightDelim: '\\Vert',
                columns: defaultColumns(args[0], maxMatrixCols)
            });
        case 'matrix':
        case 'matrix*':
            // Specifying a fence, even a null fence,
            // will prevent the insertion of an initial and final gap
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'textstyle',
                leftDelim: '.',
                rightDelim: '.',
                columns: defaultColumns(args === null || args === void 0 ? void 0 : args[0], maxMatrixCols)
            });
        case 'smallmatrix':
        case 'smallmatrix*':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: 'scriptstyle',
                columns: defaultColumns(args === null || args === void 0 ? void 0 : args[0], maxMatrixCols),
                colSeparationType: 'small',
                arraystretch: 0.5
            });
        case 'cases':
        case 'dcases':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                mathstyleName: name === 'dcases' ? 'displaystyle' : 'textstyle',
                arraystretch: 1.2,
                leftDelim: '\\lbrace',
                rightDelim: '.',
                columns: [{ align: 'l' }, { gap: 1 }, { align: 'l' }]
            });
        case 'rcases':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                arraystretch: 1.2,
                leftDelim: '.',
                rightDelim: '\\rbrace',
                columns: [{ align: 'l' }, { gap: 1 }, { align: 'l' }]
            });
        case 'lines':
            return new array_1.ArrayAtom(name, content, rowGaps, {
                // arraystretch: 1.2,
                leftDelim: '.',
                rightDelim: '.',
                columns: [{ align: 'l' }]
            });
        case 'align':
        case 'align*':
        case 'aligned':
        case 'eqnarray': {
            var colCount = 0;
            for (var _i = 0, content_1 = content; _i < content_1.length; _i++) {
                var row = content_1[_i];
                colCount = Math.max(colCount, row.length);
            }
            var columns = [
                { gap: 0 },
                { align: 'r' },
                { gap: 0.25 },
                { align: 'l' },
            ];
            var i = 2;
            while (i < colCount) {
                columns.push({ gap: 1 }, { align: 'r' }, { gap: 0.25 }, { align: 'l' });
                i += 2;
            }
            columns.push({ gap: 0 });
            return new array_1.ArrayAtom(name, content, rowGaps, {
                arraycolsep: 0,
                columns: columns,
                // colSeparationType: 'align',
                minColumns: 2
            });
        }
    }
    // 'math'
    return new array_1.ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle'
    });
}
exports.makeEnvironment = makeEnvironment;
function defaultColumns(args, maxMatrixCols) {
    var _a;
    if (maxMatrixCols === void 0) { maxMatrixCols = 10; }
    return (_a = args) !== null && _a !== void 0 ? _a : Array(maxMatrixCols).fill({ align: 'c' });
}
