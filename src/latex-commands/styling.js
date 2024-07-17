"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../atoms/box");
var phantom_1 = require("../atoms/phantom");
var delim_1 = require("../atoms/delim");
var spacing_1 = require("../atoms/spacing");
var overunder_1 = require("../atoms/overunder");
var overlap_1 = require("../atoms/overlap");
require("../atoms/genfrac");
var definitions_utils_1 = require("./definitions-utils");
var tooltip_1 = require("../atoms/tooltip");
var tokenizer_1 = require("../core/tokenizer");
var box_2 = require("../core/box");
var registers_utils_1 = require("../core/registers-utils");
var context_1 = require("../core/context");
var mathstyle_1 = require("../core/mathstyle");
var v_box_1 = require("../core/v-box");
var styling_1 = require("../editor-model/styling");
(0, definitions_utils_1.defineFunction)('mathtip', '{:auto}{:math}', {
    createAtom: function (options) {
        return new tooltip_1.TooltipAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), tooltip: (0, definitions_utils_1.argAtoms)(options.args[1]), content: 'math' }));
    },
    serialize: function (atom, options) {
        return options.skipStyles
            ? atom.bodyToLatex(options)
            : "\\texttip{".concat(atom.bodyToLatex(options), "}{").concat(atom_class_1.Atom.serialize([atom.tooltip], __assign(__assign({}, options), { defaultMode: 'math' })), "}");
    }
});
(0, definitions_utils_1.defineFunction)('texttip', '{:auto}{:text}', {
    createAtom: function (options) {
        return new tooltip_1.TooltipAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), tooltip: (0, definitions_utils_1.argAtoms)(options.args[1]), content: 'text' }));
    },
    serialize: function (atom, options) {
        return options.skipStyles
            ? atom.bodyToLatex(options)
            : "\\texttip{".concat(atom.bodyToLatex(options), "}{").concat(atom_class_1.Atom.serialize([atom.tooltip], __assign(__assign({}, options), { defaultMode: 'text' })), "}");
    }
});
(0, definitions_utils_1.defineFunction)('error', '{:math}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    },
    serialize: function (atom, options) { return "\\error{".concat(atom.bodyToLatex(options), "}"); },
    render: function (atom, context) { return atom.createBox(context, { classes: 'ML__error' }); }
});
(0, definitions_utils_1.defineFunction)('ensuremath', '{:math}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    },
    serialize: function (atom, options) {
        return "".concat(atom.command, "{").concat(atom.bodyToLatex(__assign(__assign({}, options), { defaultMode: 'math' })), "}");
    }
});
(0, definitions_utils_1.defineFunction)('color', '{:value}', {
    applyStyle: function (style, _name, args, context) {
        var _a, _b;
        return (__assign(__assign({}, style), { verbatimColor: (_a = (0, registers_utils_1.serializeLatexValue)(args[0])) !== null && _a !== void 0 ? _a : undefined, color: context.toColor((_b = args[0]) !== null && _b !== void 0 ? _b : { string: 'red' }) }));
    }
});
// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to
// text. That is, it can equally be applied to math and text mode.
(0, definitions_utils_1.defineFunction)('textcolor', '{:value}{content:auto*}', {
    applyStyle: function (style, _name, args, context) {
        var _a, _b;
        return (__assign(__assign({}, style), { verbatimColor: (_a = (0, registers_utils_1.serializeLatexValue)(args[0])) !== null && _a !== void 0 ? _a : undefined, color: context.toColor((_b = args[0]) !== null && _b !== void 0 ? _b : { string: 'red' }) }));
    }
});
// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
(0, definitions_utils_1.defineFunction)('boxed', '{content:math}', {
    createAtom: function (options) {
        return new box_1.BoxAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), framecolor: { string: 'black' } }));
    }
});
// Technically, using a BoxAtom is more correct (there is a small margin
// around it). However, just changing the background color makes editing easier
(0, definitions_utils_1.defineFunction)('colorbox', '{:value}{:text*}', {
    applyStyle: function (style, _name, args, context) {
        var _a, _b;
        return __assign(__assign({}, style), { verbatimBackgroundColor: (_a = (0, registers_utils_1.serializeLatexValue)(args[0])) !== null && _a !== void 0 ? _a : undefined, backgroundColor: context.toBackgroundColor((_b = args[0]) !== null && _b !== void 0 ? _b : { string: 'yellow' }) });
    }
});
(0, definitions_utils_1.defineFunction)('fcolorbox', '{frame-color:value}{background-color:value}{content:text}', {
    applyMode: 'text',
    createAtom: function (options) {
        var _a, _b;
        return new box_1.BoxAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[2]), framecolor: (_a = options.args[0]) !== null && _a !== void 0 ? _a : { string: 'blue' }, backgroundcolor: (_b = options.args[1]) !== null && _b !== void 0 ? _b : { string: 'yellow' } }));
    },
    serialize: function (atom, options) {
        var _a, _b;
        return options.skipStyles
            ? atom.bodyToLatex(__assign(__assign({}, options), { defaultMode: 'text' }))
            : (0, tokenizer_1.latexCommand)(atom.command, (_a = (0, registers_utils_1.serializeLatexValue)(atom.framecolor)) !== null && _a !== void 0 ? _a : '', (_b = (0, registers_utils_1.serializeLatexValue)(atom.backgroundcolor)) !== null && _b !== void 0 ? _b : '', atom.bodyToLatex(__assign(__assign({}, options), { defaultMode: 'text' })));
    }
});
// \bbox, MathJax extension
// The first argument is a CSS border property shorthand, e.g.
//      \bbox[red], \bbox[5px,border:2px solid red]
// The MathJax syntax is
//      arglist ::= <arg>[,<arg>[,<arg>]]
//      arg ::= [<background:string>|<padding:dimen>|<style>]
//      style ::= 'border:' <string>
(0, definitions_utils_1.defineFunction)('bbox', '[:bbox]{body:auto}', {
    createAtom: function (options) {
        var _a;
        var arg = options.args[0];
        var body = (0, definitions_utils_1.argAtoms)(options.args[1]);
        if (!arg)
            return new box_1.BoxAtom(__assign(__assign({}, options), { body: body }));
        return new box_1.BoxAtom(__assign(__assign({}, options), { body: body, padding: arg.padding, border: arg.border, backgroundcolor: (_a = arg.backgroundcolor) !== null && _a !== void 0 ? _a : undefined }));
    },
    serialize: function (atom, options) {
        var _a, _b;
        if (options.skipStyles)
            return atom.bodyToLatex(options);
        var result = atom.command;
        if (Number.isFinite(atom.padding) ||
            atom.border !== undefined ||
            atom.backgroundcolor !== undefined) {
            var bboxParameters = [];
            if (atom.padding)
                bboxParameters.push((_a = (0, registers_utils_1.serializeLatexValue)(atom.padding)) !== null && _a !== void 0 ? _a : '');
            if (atom.border)
                bboxParameters.push("border: ".concat(atom.border));
            if (atom.backgroundcolor)
                bboxParameters.push((_b = (0, registers_utils_1.serializeLatexValue)(atom.backgroundcolor)) !== null && _b !== void 0 ? _b : '');
            result += "[".concat(bboxParameters.join(','), "]");
        }
        return (0, tokenizer_1.latexCommand)(result, atom.bodyToLatex(options));
    }
});
// The `\displaystyle` and `\textstyle` commands do not change the current size
// but they do change how some of the layout is done.
// `\scriptstyle` reduces the size by one on the FontSizeScale, and
// `\scriptscriptstyle` reduces it by two.
(0, definitions_utils_1.defineFunction)(['displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle'], '{:rest}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    },
    render: function (atom, context) {
        var ctx = new context_1.Context({ parent: context, mathstyle: atom.command.slice(1) }, atom.style);
        var box = atom_class_1.Atom.createBox(ctx, atom.body, { type: 'lift' });
        if (atom.caret)
            box.caret = atom.caret;
        return atom.bind(context, box);
    },
    serialize: function (atom, options) {
        return options.skipStyles
            ? atom.bodyToLatex(options)
            : "{".concat((0, tokenizer_1.joinLatex)([atom.command, atom.bodyToLatex(options)]), "}");
    }
});
// Size
//
// These size function are absolute. That is applying `\Large \Large X` does
// not make twice as "Large".
//
// This is unlike the `\scriptstyle` and `\scriptscriptstyle` commands, which
// are relative, that is `\scriptstyle \scriptstyle x` is smaller than
// `\scriptstyle x`.
(0, definitions_utils_1.defineFunction)([
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
], '', {
    // TeX behaves very inconsistently when sizing commands are applied
    // to math mode. We allow sizing commands to be applied in both math and
    // text mode
    applyStyle: function (style, name) {
        return __assign(__assign({}, style), { fontSize: {
                '\\tiny': 1,
                '\\scriptsize': 2,
                '\\footnotesize': 3,
                '\\small': 4,
                '\\normalsize': 5,
                '\\large': 6,
                '\\Large': 7,
                '\\LARGE': 8,
                '\\huge': 9,
                '\\Huge': 10
            }[name] });
    }
});
// \fontseries only works in text mode
(0, definitions_utils_1.defineFunction)('fontseries', '{:string}', {
    ifMode: 'text',
    applyStyle: function (style, _name, args) {
        var _a;
        return __assign(__assign({}, style), { fontSeries: (_a = args[0]) !== null && _a !== void 0 ? _a : 'auto' });
    }
});
// SHAPE: italic, small caps
(0, definitions_utils_1.defineFunction)('fontshape', '{:string}', {
    ifMode: 'text',
    applyStyle: function (style, _name, args) {
        var _a;
        return __assign(__assign({}, style), { fontShape: (_a = args[0]) !== null && _a !== void 0 ? _a : 'auto' });
    }
});
// FONT FAMILY: roman, sans-serif, monospace
(0, definitions_utils_1.defineFunction)('fontfamily', '{:string}', {
    ifMode: 'text',
    applyStyle: function (style, _name, args) {
        var _a;
        return __assign(__assign({}, style), { fontFamily: (_a = args[0]) !== null && _a !== void 0 ? _a : 'roman' });
    }
});
// In LaTeX, the \fontseries, \fontshape, \fontfamily, \fontsize commands
// do not take effect until \selectfont is encoded. In our implementation,
// they take effect immediately, and \selectfont is a no-op
(0, definitions_utils_1.defineFunction)('selectfont', '', {
    ifMode: 'text',
    applyStyle: function (style) { return style; }
});
// \bf works in any mode
// As per the LaTeX 2.09 semantics, it overrides shape, family
(0, definitions_utils_1.defineFunction)('bf', '{:rest*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontSeries: 'b', fontShape: 'n', fontFamily: 'roman' })); }
});
// In LaTeX, \boldsymbol does not preserve proper kerning between characters
(0, definitions_utils_1.defineFunction)(['boldsymbol', 'bm', 'bold'], '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variantStyle: 'bold' })); }
});
(0, definitions_utils_1.defineFunction)('bfseries', '{:rest*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontSeries: 'b' })); }
});
(0, definitions_utils_1.defineFunction)('mdseries', '{:rest*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontSeries: 'm' })); }
});
(0, definitions_utils_1.defineFunction)('upshape', '{:rest*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'n' })); }
});
(0, definitions_utils_1.defineFunction)('slshape', '{:rest*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'sl' })); }
});
// Small caps
(0, definitions_utils_1.defineFunction)('scshape', '{:rest*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'sc' })); }
});
(0, definitions_utils_1.defineFunction)('textbf', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontSeries: 'b' })); }
});
(0, definitions_utils_1.defineFunction)('textmd', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontSeries: 'm' })); }
});
(0, definitions_utils_1.defineFunction)('textup', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'n' })); }
});
// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
(0, definitions_utils_1.defineFunction)('textnormal', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'n', fontSeries: 'm' })); }
});
(0, definitions_utils_1.defineFunction)('textsl', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'sl' })); }
});
(0, definitions_utils_1.defineFunction)('textit', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'it' })); }
});
(0, definitions_utils_1.defineFunction)('textsc', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontShape: 'sc' })); }
});
(0, definitions_utils_1.defineFunction)('textrm', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontFamily: 'roman' })); }
});
(0, definitions_utils_1.defineFunction)('textsf', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontFamily: 'sans-serif' })); }
});
(0, definitions_utils_1.defineFunction)('texttt', '{:text*}', {
    applyMode: 'text',
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontFamily: 'monospace' })); }
});
// Note: \mathbf is a no-op in text mode
(0, definitions_utils_1.defineFunction)('mathbf', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'normal', variantStyle: 'bold' })); }
});
// `\mathnormal` includes italic correction, `\mathit` doesn't
(0, definitions_utils_1.defineFunction)('mathit', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'main', variantStyle: 'italic' })); }
});
// `\mathnormal` includes italic correction, `\mathit` doesn't
(0, definitions_utils_1.defineFunction)('mathnormal', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'normal', variantStyle: 'italic' })); }
});
// From the ISOMath package
(0, definitions_utils_1.defineFunction)('mathbfit', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'main', variantStyle: 'bolditalic' })); }
});
(0, definitions_utils_1.defineFunction)('mathrm', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'normal', variantStyle: 'up' })); }
});
(0, definitions_utils_1.defineFunction)('mathsf', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'sans-serif', variantStyle: 'up' })); }
});
(0, definitions_utils_1.defineFunction)('mathtt', '{:math*}', {
    applyMode: 'math',
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'monospace', variantStyle: 'up' })); }
});
(0, definitions_utils_1.defineFunction)('it', '{:rest*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontSeries: 'm', fontShape: 'it', fontFamily: 'roman', variantStyle: 'italic' })); }
});
// In LaTeX, \rmfamily, \sffamily and \ttfamily are no-op in math mode.
(0, definitions_utils_1.defineFunction)('rmfamily', '{:rest*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontFamily: 'roman' })); }
});
(0, definitions_utils_1.defineFunction)('sffamily', '{:rest*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontFamily: 'sans-serif' })); }
});
(0, definitions_utils_1.defineFunction)('ttfamily', '{:rest*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { fontFamily: 'monospace' })); }
});
// In LaTeX, \Bbb and \mathbb are no-op in text mode.
// They also map lowercase characters to different glyphs.
// Note that \Bbb has been deprecated for over 20 years (as well as \rm, \it, \bf)
(0, definitions_utils_1.defineFunction)(['Bbb', 'mathbb'], '{:math*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'double-struck', variantStyle: (0, styling_1.removeItalic)(style.variantStyle) })); }
});
(0, definitions_utils_1.defineFunction)(['frak', 'mathfrak'], '{:math*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'fraktur', variantStyle: (0, styling_1.removeItalic)(style.variantStyle) })); }
});
(0, definitions_utils_1.defineFunction)('mathcal', '{:math*}', {
    // Note that in LaTeX, \mathcal forces the 'up' variant. Use \bm to get bold
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'calligraphic', variantStyle: (0, styling_1.removeItalic)(style.variantStyle) })); }
});
(0, definitions_utils_1.defineFunction)('mathscr', '{:math*}', {
    applyStyle: function (style) { return (__assign(__assign({}, style), { variant: 'script', variantStyle: (0, styling_1.removeItalic)(style.variantStyle) })); }
});
/*
 * Rough synonym for \text{}
 * An \mbox within math mode does not use the current math font; rather it uses
 * the typeface of the surrounding running text.
 */
(0, definitions_utils_1.defineFunction)('mbox', '{:text}', {
    ifMode: 'math',
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', body: (0, definitions_utils_1.argAtoms)(options.args[0]), mode: 'math' }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.latexCommand)('\\mbox', atom.bodyToLatex(__assign(__assign({}, options), { defaultMode: 'text' })));
    }
});
(0, definitions_utils_1.defineFunction)('text', '{:text}', {
    ifMode: 'math',
    applyMode: 'text'
});
/* Assign a class to the element.`class` is a MathJax extension, `htmlClass`
   is a KaTeX extension. */
(0, definitions_utils_1.defineFunction)(['class', 'htmlClass'], '{name:string}{content:auto}', {
    createAtom: function (options) { return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]) })); },
    serialize: function (atom, options) {
        if (!atom.args[0] || options.skipStyles)
            return atom.bodyToLatex(options);
        return "".concat(atom.command, "{").concat(atom.args[0], "}{").concat(atom.bodyToLatex(options), "}");
    },
    render: function (atom, context) { var _a; return atom.createBox(context, { classes: (_a = atom.args[0]) !== null && _a !== void 0 ? _a : '' }); }
});
/* Assign an ID to the element. `cssId` is a MathJax extension,
   `htmlId` is a KaTeX extension. */
(0, definitions_utils_1.defineFunction)(['cssId', 'htmlId'], '{id:string}{content:auto}', {
    createAtom: function (options) { return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]) })); },
    serialize: function (atom, options) {
        var _a;
        if (!((_a = atom.args) === null || _a === void 0 ? void 0 : _a[0]) || options.skipStyles)
            return atom.bodyToLatex(options);
        return "".concat(atom.command, "{").concat(atom.args[0], "}{").concat(atom.bodyToLatex(options), "}");
    },
    render: function (atom, context) {
        var _a;
        var box = atom.createBox(context);
        box.cssId = (_a = atom.args[0]) !== null && _a !== void 0 ? _a : '';
        return box;
    }
});
/* Assign an attribute to the element (MathJAX extension) */
(0, definitions_utils_1.defineFunction)('htmlData', '{data:string}{content:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]) }));
    },
    serialize: function (atom, options) {
        var _a;
        if (!((_a = atom.args) === null || _a === void 0 ? void 0 : _a[0]) || options.skipStyles)
            return atom.bodyToLatex(options);
        return "\\htmlData{".concat(atom.args[0], "}{").concat(atom.bodyToLatex(options), "}");
    },
    render: function (atom, context) {
        var _a;
        var box = atom.createBox(context);
        box.htmlData = (_a = atom.args[0]) !== null && _a !== void 0 ? _a : '';
        return box;
    }
});
/* Assign CSS styles to the element. `style` is a MathJax extension,
  `htmlStyle` is the KaTeX extension. */
(0, definitions_utils_1.defineFunction)(['style', 'htmlStyle'], '{data:string}{content:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]) }));
    },
    serialize: function (atom, options) {
        var _a;
        if (!((_a = atom.args) === null || _a === void 0 ? void 0 : _a[0]) || options.skipStyles)
            return atom.bodyToLatex(options);
        return "".concat(atom.command, "{").concat(atom.args[0], "}{").concat(atom.bodyToLatex(options), "}");
    },
    render: function (atom, context) {
        var _a;
        var box = atom.createBox(context);
        box.htmlStyle = (_a = atom.args[0]) !== null && _a !== void 0 ? _a : '';
        return box;
    }
});
(0, definitions_utils_1.defineFunction)('href', '{url:string}{content:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]) }));
    },
    render: function (atom, context) {
        var _a;
        var box = atom.createBox(context);
        var href = (_a = atom.args[0]) !== null && _a !== void 0 ? _a : '';
        if (href)
            box.htmlData = "href=".concat(href);
        return box;
    }
});
/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
(0, definitions_utils_1.defineFunction)('em', '{:rest}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    },
    serialize: function (atom, options) {
        return options.skipStyles
            ? atom.bodyToLatex(options)
            : "{\\em ".concat(atom.bodyToLatex(options), "}");
    },
    render: function (atom, context) {
        return atom.createBox(context, { classes: 'ML__emph', boxType: 'lift' });
    }
});
/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
(0, definitions_utils_1.defineFunction)('emph', '{:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]) }));
    },
    serialize: function (atom, options) {
        return options.skipStyles
            ? atom.bodyToLatex(options)
            : "\\emph{".concat(atom.bodyToLatex(options), "}");
    },
    render: function (atom, context) {
        return atom.createBox(context, { classes: 'ML__emph', boxType: 'lift' });
    }
});
// Extra data needed for the delimiter parse function down below
var DELIMITER_SIZES = {
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
    '\\Bigg': { mclass: 'mord', size: 4 }
};
(0, definitions_utils_1.defineFunction)([
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
], '{:delim}', {
    createAtom: function (options) {
        var _a;
        return new delim_1.SizedDelimAtom(__assign(__assign({}, options), { delim: (_a = options.args[0]) !== null && _a !== void 0 ? _a : '.', size: DELIMITER_SIZES[options.command].size, delimType: DELIMITER_SIZES[options.command].mclass }));
    }
});
/*
% \hspace: register name or braced argument, glue in any unit
$$+\hspace{1ex}+$$
$$+\hspace{1em plus1ex minus 2pt}+$$
$$+\hspace\textwidth+$$
$$+\hspace{\textwidth}+$$
$$+\hspace\thinmuskip+$$ % Incompatible glue units
$$+\hspace1ex+$$         % Illegal unit of measure (pt inserted).
$$+\hspace{1}+$$         % Illegal unit of measure (pt inserted).
$$+\hspace10+$$          % Illegal unit of measure (pt inserted).
$$+\hspace1pt+$$         % Illegal unit of measure (pt inserted).
$$+\hspace1em+$$         % Illegal unit of measure (pt inserted).
*/
(0, definitions_utils_1.defineFunction)([
    'hspace',
    'hspace*',
    // \hspace* inserts a non-breakable space, but since we don't line break...
    // it's the same as \hspace.
], '{width:value}', {
    createAtom: function (options) {
        var _a;
        return new spacing_1.SpacingAtom(__assign(__assign({}, options), { width: (_a = options.args[0]) !== null && _a !== void 0 ? _a : { dimension: 0 } }));
    }
});
/*

Compared to LaTeX, we're a bit more lenient:
- we accept any units, i.e. "mu" units in non-mu variants, and non-mu
   units in mu variants
- we accept both braced and unbraced variants


% \kern: register or unbraced glue in non-mu units
$$+\kern11pt+$$
$$+\kern11pt plus2ex minus3pt+$$
$$+\kern2em+$$
$$+\kern\thinmuskip+$$   % Incompatible glue units
$$+\kern{11pt}+$$        % Missing number, treated as zero

% \mkern: register or unbraced glue in mu units
$$+\mkern11mu+$$
$$+\mkern11mu plus1mu minus2mu+$$
$$+\mkern\thinmuskip+$$
$$+\mkern{\thinmuskip}+$$ % Illegal unit of measure (mu inserted).
$$+\mkern11+$$           % Illegal unit of measure (mu inserted).
$$+\mkern{11mu}+$$       % Missing number, treated as zero.

% \mskip: register or unbraced glue in mu units
$$+\mskip5mu+$$
$$+\mskip5mu plus 1mu minus 1mu+$$
$$+\mskip\thinmuskip+$$
$$+\mskip1em+$$          % Illegal unit of measure (mu inserted).
$$+\mskip5+$$            % Illegal unit of measure (mu inserted).
$$+\mskip{5}+$$          % Missing number, treated as zero

% \hskip: register or unbraced glue in non-mu units
$$+\hskip5pt+$$
$$+\hskip5pt plus 1em minus 1ex+$$
$$+\hskip\textwidth+$$
$$+\hskip1em+$$
$$+\hskip5+$$            % Illegal unit of measure (pt inserted).
$$+\hskip{5}+$$          % Missing number, treated as zero

 From amsmath
% \mspace: require register or braced glue in mu units
$$\mspace{12mu}+$$
$$\mspace{12mu plus 1mu minus 2mu}+$$
$$\mspace12mu+$$        % Illegal unit of measure (mu inserted).
$$\mspace1em+$$         % Illegal unit of measure (mu inserted).
$$\mspace1em plus 2ex+$$% Illegal unit of measure (mu inserted).
$$\mspace{1em}+$$       % Illegal unit of measure (mu inserted).
$$\mspace12+$$          % Illegal unit of measure (mu inserted).


*/
(0, definitions_utils_1.defineFunction)(['mkern', 'kern', 'mskip', 'hskip', 'mspace'], '{width:value}', {
    createAtom: function (options) {
        var _a;
        return new spacing_1.SpacingAtom(__assign(__assign({}, options), { width: (_a = options.args[0]) !== null && _a !== void 0 ? _a : { dimension: 0 } }));
    }
});
(0, definitions_utils_1.defineFunction)('mathchoice', '{:math}{:math}{:math}{:math}', {
    // display, text, script and scriptscript
    createAtom: function (options) { return new atom_class_1.Atom(options); },
    render: function (atom, context) {
        var i = 0;
        var d = context.mathstyle.id;
        if (d === mathstyle_1.T || d === mathstyle_1.Tc)
            i = 1;
        if (d === mathstyle_1.S || d === mathstyle_1.Sc)
            i = 2;
        if (d === mathstyle_1.SS || d === mathstyle_1.SSc)
            i = 3;
        var body = (0, definitions_utils_1.argAtoms)(atom.args[i]);
        return atom_class_1.Atom.createBox(context, body);
    },
    serialize: function (atom, options) {
        return "\\mathchoice{".concat(atom_class_1.Atom.serialize(atom.args[0], options), "}{").concat(atom_class_1.Atom.serialize(atom.args[1], options), "}{").concat(atom_class_1.Atom.serialize(atom.args[2], options), "}{").concat(atom_class_1.Atom.serialize(atom.args[3], options), "}");
    }
});
(0, definitions_utils_1.defineFunction)('mathop', '{:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mop', body: (0, definitions_utils_1.argAtoms)(options.args[0]), limits: 'over-under', isFunction: true, captureSelection: true }));
    },
    render: function (atom, context) {
        var _a;
        var base = atom_class_1.Atom.createBox(context, atom.body);
        if (atom.superscript || atom.subscript) {
            var limits = (_a = atom.subsupPlacement) !== null && _a !== void 0 ? _a : 'auto';
            base =
                limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
                    ? atom.attachLimits(context, { base: base })
                    : atom.attachSupsub(context, { base: base });
        }
        return new box_2.Box(atom.bind(context, base), {
            type: 'op',
            isSelected: atom.isSelected,
            classes: 'ML__op-group'
        });
    },
    serialize: function (atom, options) {
        var result = [(0, tokenizer_1.latexCommand)(atom.command, atom.bodyToLatex(options))];
        if (atom.explicitSubsupPlacement) {
            if (atom.subsupPlacement === 'over-under')
                result.push('\\limits');
            if (atom.subsupPlacement === 'adjacent')
                result.push('\\nolimits');
            if (atom.subsupPlacement === 'auto')
                result.push('\\displaylimits');
        }
        result.push(atom.supsubToLatex(options));
        return (0, tokenizer_1.joinLatex)(result);
    }
});
(0, definitions_utils_1.defineFunction)([
    'mathbin',
    'mathrel',
    'mathopen',
    'mathclose',
    'mathpunct',
    'mathord',
    'mathinner',
], '{:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: {
                '\\mathbin': 'mbin',
                '\\mathrel': 'mrel',
                '\\mathopen': 'mopen',
                '\\mathclose': 'mclose',
                '\\mathpunct': 'mpunct',
                '\\mathord': 'mord',
                '\\mathinner': 'minner'
            }[options.command], body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    }
});
// @todo see http://mirrors.ibiblio.org/CTAN/macros/latex/required/amsmath/amsopn.pdf
// for list of additional operators
(0, definitions_utils_1.defineFunction)(['operatorname', 'operatorname*'], '{operator:math}', {
    createAtom: function (options) {
        /*
          The \operatorname commands is defined with:
    
          \gdef\newmcodes@{\mathcode`\'39\mathcode`\*42\mathcode`\."613A%
          \ifnum\mathcode`\-=45 \else
              \mathchardef\std@minus\mathcode`\-\relax
          \fi
          \mathcode`\-45\mathcode`\/47\mathcode`\:"603A\relax}
    
    
          \mathcode assigns to a character its category (2=mbin), its font
          family (0=cmr), and its character code.
    
          It basically temporarily reassigns to ":.'-/*" the values/properties
          these characters have in text mode (but importantly, not to " " (space))
    
        */
        var body = (0, definitions_utils_1.argAtoms)(options.args[0]).map(function (x) {
            var _a;
            if (x.type !== 'first') {
                x.type = 'mord';
                x.value = (_a = { '\u2217': '*', '\u2212': '-' }[x.value]) !== null && _a !== void 0 ? _a : x.value;
                x.isFunction = false;
                if (!x.style.variant && !x.style.variantStyle) {
                    // No variant as been specified (as it could have been with
                    // \operatorname{\mathit{lim}} for example)
                    // Bypass the default auto styling by specifing an upright style
                    x.style.variant = 'main';
                    x.style.variantStyle = 'up';
                }
            }
            return x;
        });
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mop', body: body, isFunction: true, limits: options.command === '\\operatorname' ? 'adjacent' : 'over-under' }));
    },
    render: function (atom, context) {
        var _a;
        var base = atom_class_1.Atom.createBox(context, atom.body);
        if (atom.superscript || atom.subscript) {
            var limits = (_a = atom.subsupPlacement) !== null && _a !== void 0 ? _a : 'auto';
            base =
                limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
                    ? atom.attachLimits(context, { base: base })
                    : atom.attachSupsub(context, { base: base });
        }
        if (atom.caret)
            base.caret = atom.caret;
        return new box_2.Box(atom.bind(context, base), {
            type: 'op',
            isSelected: atom.isSelected,
            classes: 'ML__op-group'
        });
    },
    serialize: function (atom, options) {
        var result = [(0, tokenizer_1.latexCommand)(atom.command, atom.bodyToLatex(options))];
        if (atom.explicitSubsupPlacement) {
            if (atom.subsupPlacement === 'over-under')
                result.push('\\limits');
            if (atom.subsupPlacement === 'adjacent')
                result.push('\\nolimits');
            if (atom.subsupPlacement === 'auto')
                result.push('\\displaylimits');
        }
        result.push(atom.supsubToLatex(options));
        return (0, tokenizer_1.joinLatex)(result);
    }
});
/** This is a MathJax extension */
(0, definitions_utils_1.defineFunction)(['char', 'unicode'], '{charcode:value}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: options.mode === 'text' ? 'text' : 'mord' }));
    },
    serialize: function (atom) {
        var _a;
        return "".concat(atom.command).concat((0, registers_utils_1.serializeLatexValue)((_a = atom.args[0]) !== null && _a !== void 0 ? _a : { number: 0x2753, base: 'hexadecimal' }));
    },
    render: function (atom, context) {
        var value = context.evaluate(atom.args[0]);
        if (!value || !('number' in value))
            value = { number: 0x2753, base: 'hexadecimal' }; // BLACK QUESTION MARK;
        atom.value = String.fromCodePoint(value.number);
        return atom.createBox(context);
    }
});
// A box of the width and height
(0, definitions_utils_1.defineFunction)('rule', '[raise:value]{width:value}{thickness:value}', {
    createAtom: function (options) { return new atom_class_1.Atom(options); },
    render: function (atom, context) {
        var _a, _b, _c;
        // The mathstyle sizing corrections (size delta) do not
        // apply to the dimensions of rules. Create a 'textstyle'
        // context to do the measurements without accounting for the mathstyle.
        var ctx = new context_1.Context({ parent: context, mathstyle: 'textstyle' }, atom.style);
        var shift = ctx.toEm((_a = atom.args[0]) !== null && _a !== void 0 ? _a : { dimension: 0 });
        var width = ctx.toEm((_b = atom.args[1]) !== null && _b !== void 0 ? _b : { dimension: 10 });
        var height = ctx.toEm((_c = atom.args[2]) !== null && _c !== void 0 ? _c : { dimension: 10 });
        var result = new box_2.Box(null, {
            classes: 'ML__rule',
            type: 'ord'
        });
        result.width = width;
        result.height = height + shift;
        result.depth = -shift;
        result.setStyle('border-right-width', width, 'em');
        result.setStyle('border-top-width', height, 'em');
        result.setStyle('border-color', atom.style.color);
        result.setStyle('vertical-align', shift, 'em');
        if (atom.isSelected)
            result.setStyle('opacity', '50%');
        atom.bind(ctx, result);
        if (atom.caret)
            result.caret = atom.caret;
        return result.wrap(context);
    },
    serialize: function (atom) {
        return "\\rule".concat(atom.args[0] ? "[".concat((0, registers_utils_1.serializeLatexValue)(atom.args[0]), "]") : '', "{").concat((0, registers_utils_1.serializeLatexValue)(atom.args[1]), "}{").concat((0, registers_utils_1.serializeLatexValue)(atom.args[2]), "}");
    }
});
// An overline
(0, definitions_utils_1.defineFunction)(['overline', 'underline'], '{:auto}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    },
    render: function (atom, parentContext) {
        var position = atom.command.substring(1);
        // TeXBook:443. Rule 9 and 10
        // > Math accents, and the operations \sqrt and \overline, change
        // > uncramped styles to their cramped counterparts; for example, D
        // > changes to D′, but D′ stays as it was. -- TeXBook p. 152
        var context = new context_1.Context({ parent: parentContext, mathstyle: 'cramp' }, atom.style);
        var inner = atom_class_1.Atom.createBox(context, atom.body);
        if (!inner)
            return null;
        var ruleThickness = context.metrics.defaultRuleThickness / context.scalingFactor;
        var line = new box_2.Box(null, { classes: position + '-line' });
        line.height = ruleThickness;
        line.maxFontSize = ruleThickness * 1.125 * context.scalingFactor;
        var stack;
        if (position === 'overline') {
            stack = new v_box_1.VBox({
                shift: 0,
                children: [
                    { box: inner },
                    3 * ruleThickness,
                    { box: line },
                    ruleThickness,
                ]
            });
        }
        else {
            stack = new v_box_1.VBox({
                top: inner.height,
                children: [
                    ruleThickness,
                    { box: line },
                    3 * ruleThickness,
                    { box: inner },
                ]
            });
        }
        if (atom.caret)
            stack.caret = atom.caret;
        return new box_2.Box(stack, { classes: position, type: 'ignore' });
    }
});
(0, definitions_utils_1.defineFunction)('overset', '{:auto}{base:auto}', {
    createAtom: function (options) {
        var body = (0, definitions_utils_1.argAtoms)(options.args[1]);
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { above: (0, definitions_utils_1.argAtoms)(options.args[0]), body: body, skipBoundary: false, boxType: (0, box_2.atomsBoxType)(body) }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.latexCommand)(atom.command, atom.aboveToLatex(options), atom.bodyToLatex(options));
    }
});
(0, definitions_utils_1.defineFunction)('underset', '{:auto}{base:auto}', {
    createAtom: function (options) {
        var body = (0, definitions_utils_1.argAtoms)(options.args[1]);
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { below: (0, definitions_utils_1.argAtoms)(options.args[0]), body: body, skipBoundary: false, boxType: (0, box_2.atomsBoxType)(body) }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.latexCommand)(atom.command, atom.belowToLatex(options), atom.bodyToLatex(options));
    }
});
(0, definitions_utils_1.defineFunction)('overunderset', '{above:auto}{below:auto}{base:auto}', {
    createAtom: function (options) {
        var body = (0, definitions_utils_1.argAtoms)(options.args[2]);
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { above: (0, definitions_utils_1.argAtoms)(options.args[0]), below: (0, definitions_utils_1.argAtoms)(options.args[1]), body: body, skipBoundary: false, boxType: (0, box_2.atomsBoxType)(body) }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.latexCommand)(atom.command, atom.belowToLatex(options), atom.bodyToLatex(options));
    }
});
// `\stackrel` and `\stackbin` stack an item and provide an explicit
// atom type of the result. They are considered obsolete commands.
// `\underset` and `\overset` are recommended instead, which automatically
// calculate the resulting type.
(0, definitions_utils_1.defineFunction)(['stackrel', 'stackbin'], '[below:auto]{above:auto}{base:auto}', {
    createAtom: function (options) {
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[2]), above: (0, definitions_utils_1.argAtoms)(options.args[1]), below: (0, definitions_utils_1.argAtoms)(options.args[0]), skipBoundary: false, boxType: options.command === '\\stackrel' ? 'rel' : 'bin' }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.latexCommand)(atom.command, atom.aboveToLatex(options), atom.bodyToLatex(options));
    }
});
(0, definitions_utils_1.defineFunction)('smash', '[:string]{:auto}', {
    createAtom: function (options) {
        var _a, _b, _c, _d;
        return new phantom_1.PhantomAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]), smashHeight: (_b = (_a = options.args[0]) === null || _a === void 0 ? void 0 : _a.includes('t')) !== null && _b !== void 0 ? _b : true, smashDepth: (_d = (_c = options.args[0]) === null || _c === void 0 ? void 0 : _c.includes('b')) !== null && _d !== void 0 ? _d : true }));
    }
});
(0, definitions_utils_1.defineFunction)(['vphantom'], '{:auto}', {
    createAtom: function (options) {
        return new phantom_1.PhantomAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), isInvisible: true, smashWidth: true }));
    }
});
(0, definitions_utils_1.defineFunction)(['hphantom'], '{:auto}', {
    createAtom: function (options) {
        return new phantom_1.PhantomAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), isInvisible: true, smashHeight: true, smashDepth: true }));
    }
});
(0, definitions_utils_1.defineFunction)(['phantom'], '{:auto}', {
    createAtom: function (options) {
        return new phantom_1.PhantomAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), isInvisible: true }));
    }
});
(0, definitions_utils_1.defineFunction)('not', '{:math}', {
    createAtom: function (options) {
        var body = (0, definitions_utils_1.argAtoms)(options.args[0]);
        if (body.length === 0)
            return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mrel', value: '\ue020' }));
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: __spreadArray([
                new overlap_1.OverlapAtom(__assign(__assign({}, options), { body: '\ue020', align: 'right' }))
            ], body, true), captureSelection: true }));
    },
    serialize: function (atom, options) {
        var arg = atom.args[0];
        var isGroup = arg && typeof arg === 'object' && 'group' in arg;
        if (atom.value !== '\ue020') {
            return isGroup
                ? "\\not{".concat(atom_class_1.Atom.serialize(arg.group, options), "}")
                : "\\not".concat(atom_class_1.Atom.serialize(arg, options));
        }
        return isGroup ? "\\not{}" : "\\not";
    },
    render: function (atom, context) {
        if (atom.value)
            return atom.createBox(context);
        var isGroup = atom.args[0] &&
            typeof atom.args[0] === 'object' &&
            'group' in atom.args[0];
        var type = isGroup ? 'ord' : (0, box_2.atomsBoxType)((0, definitions_utils_1.argAtoms)(atom.args[0]));
        var box = atom_class_1.Atom.createBox(context, atom.body, { type: type });
        if (atom.caret)
            box.caret = atom.caret;
        return atom.bind(context, box);
    }
});
(0, definitions_utils_1.defineFunction)(['ne', 'neq'], '', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mrel', body: [
                new overlap_1.OverlapAtom(__assign(__assign({}, options), { body: '\ue020', align: 'right', boxType: 'rel' })),
                new atom_class_1.Atom(__assign(__assign({}, options), { value: '=' })),
            ], captureSelection: true }));
    },
    serialize: function (atom) { return atom.command; }
});
(0, definitions_utils_1.defineFunction)('rlap', '{:auto}', {
    createAtom: function (options) {
        return new overlap_1.OverlapAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), align: 'right' }));
    }
});
(0, definitions_utils_1.defineFunction)('llap', '{:auto}', {
    createAtom: function (options) {
        return new overlap_1.OverlapAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), align: 'left' }));
    }
});
(0, definitions_utils_1.defineFunction)('mathrlap', '{:math}', {
    createAtom: function (options) {
        return new overlap_1.OverlapAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), align: 'right' }));
    }
});
(0, definitions_utils_1.defineFunction)('mathllap', '{:math}', {
    createAtom: function (options) {
        return new overlap_1.OverlapAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), align: 'left' }));
    }
});
(0, definitions_utils_1.defineFunction)('raisebox', '{:value}{:text}', {
    createAtom: function (options) {
        var _a;
        return new box_1.BoxAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]), padding: { dimension: 0 }, offset: (_a = options.args[0]) !== null && _a !== void 0 ? _a : { dimension: 0 } }));
    },
    serialize: function (atom, options) {
        var _a;
        return (0, tokenizer_1.latexCommand)('\\raisebox', (_a = (0, registers_utils_1.serializeLatexValue)(atom.offset)) !== null && _a !== void 0 ? _a : '0pt', atom.bodyToLatex(options));
    }
});
(0, definitions_utils_1.defineFunction)('raise', '{:value}{:auto}', {
    createAtom: function (options) {
        var _a;
        return new box_1.BoxAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]), padding: { dimension: 0 }, offset: (_a = options.args[0]) !== null && _a !== void 0 ? _a : { dimension: 0 } }));
    },
    serialize: function (atom, options) {
        var _a;
        return (0, tokenizer_1.latexCommand)('\\raise', (_a = (0, registers_utils_1.serializeLatexValue)(atom.offset)) !== null && _a !== void 0 ? _a : '0pt', atom.bodyToLatex(options));
    }
});
(0, definitions_utils_1.defineFunction)('lower', '{:value}{:auto}', {
    createAtom: function (options) {
        var _a;
        return new box_1.BoxAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]), padding: { dimension: 0 }, offset: (_a = (0, registers_utils_1.multiplyLatexValue)(options.args[0], -1)) !== null && _a !== void 0 ? _a : { dimension: 0 } }));
    },
    serialize: function (atom, options) {
        var _a, _b;
        return (0, tokenizer_1.latexCommand)('\\lower', (_b = (0, registers_utils_1.serializeLatexValue)((0, registers_utils_1.multiplyLatexValue)((_a = atom.offset) !== null && _a !== void 0 ? _a : { dimension: 0 }, -1))) !== null && _b !== void 0 ? _b : '0pt', atom.bodyToLatex(options));
    }
});
