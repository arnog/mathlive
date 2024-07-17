"use strict";
/**
 * Server-side rendering exports.
 *
 * These functions do not require a DOM environment and can
 * be used from a server-side environment.
 *
 */
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
exports.__esModule = true;
exports.convertAsciiMathToLatex = exports.convertLatexToAsciiMath = exports.convertMathJsonToLatex = exports.convertLatexToSpeakableText = exports.convertLatexToMathMl = exports.validateLatex = exports.convertLatexToMarkup = void 0;
var atom_class_1 = require("../core/atom-class");
require("../latex-commands/definitions");
var atom_to_math_ml_1 = require("../formats/atom-to-math-ml");
var box_1 = require("../core/box");
var context_1 = require("../core/context");
var parser_1 = require("../core/parser");
var atom_to_speakable_text_1 = require("../formats/atom-to-speakable-text");
var parser_2 = require("../core/parser");
var atom_to_ascii_math_1 = require("../formats/atom-to-ascii-math");
var parse_math_string_1 = require("../formats/parse-math-string");
require("../core/modes");
var context_utils_1 = require("../core/context-utils");
var inter_box_spacing_1 = require("../core/inter-box-spacing");
var definitions_1 = require("../latex-commands/definitions");
/**
 * Convert a LaTeX string to a string of HTML markup.
 *
 * :::info[Note]
 *
 * This function does not interact with the DOM. It does not load fonts or
 * inject stylesheets in the document. It can safely be used on the server side.
 * :::
 *
 * To get the output of this function to correctly display
 * in a document, use the mathlive static style sheet by adding the following
 * to the `<head>` of the document:
 *
 * ```html
 * <link
 *  rel="stylesheet"
 *  href="https://unpkg.com/mathlive/dist/mathlive-static.css"
 * />
 * ```
 *
 *
 * @param text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param options.mathstyle If `"displaystyle"` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `"textstyle"` is used, the "text" mode of TeX is used, which is most
 * appropriate when displaying math "inline" with other text (on the same line).
 *
 * @category Conversion
 * @keywords convert, latex, markup
 */
function convertLatexToMarkup(text, options) {
    var from = __assign({}, (0, context_utils_1.getDefaultContext)());
    if ((options === null || options === void 0 ? void 0 : options.letterShapeStyle) && (options === null || options === void 0 ? void 0 : options.letterShapeStyle) !== 'auto')
        from.letterShapeStyle = options.letterShapeStyle;
    if (options === null || options === void 0 ? void 0 : options.macros) {
        var macros_1 = (0, definitions_1.normalizeMacroDictionary)(options === null || options === void 0 ? void 0 : options.macros);
        from.getMacro = function (token) { return (0, definitions_1.getMacroDefinition)(token, macros_1); };
    }
    if (options === null || options === void 0 ? void 0 : options.registers)
        from.registers = options.registers;
    var parseMode = 'math';
    var mathstyle;
    if ((options === null || options === void 0 ? void 0 : options.defaultMode) === 'inline-math') {
        mathstyle = 'textstyle';
    }
    else if ((options === null || options === void 0 ? void 0 : options.defaultMode) === 'math') {
        mathstyle = 'displaystyle';
    }
    else {
        mathstyle = 'textstyle';
        parseMode = 'text';
    }
    var effectiveContext = new context_1.Context({ from: from });
    //
    // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
    //
    var root = new atom_class_1.Atom({
        type: 'root',
        mode: parseMode,
        body: (0, parser_1.parseLatex)(text, { context: effectiveContext, parseMode: parseMode, mathstyle: mathstyle })
    });
    //
    // 2. Transform the math atoms into elementary boxes
    // for example from genfrac to VBox.
    //
    var box = root.render(effectiveContext);
    if (!box)
        return '';
    //
    // 3. Simplify by coalescing adjacent boxes
    //    for example, from <span>1</span><span>2</span>
    //    to <span>12</span>
    //
    (0, box_1.coalesce)((0, inter_box_spacing_1.applyInterBoxSpacing)(box, effectiveContext));
    //
    // 4. Wrap the expression with struts
    //
    var struts = (0, box_1.makeStruts)(box, { classes: 'ML__latex' });
    //
    // 5. Generate markup
    //
    return struts.toMarkup();
}
exports.convertLatexToMarkup = convertLatexToMarkup;
function validateLatex(s) {
    return (0, parser_2.validateLatex)(s, { context: (0, context_utils_1.getDefaultContext)() });
}
exports.validateLatex = validateLatex;
/**
 * Convert a LaTeX string to a string of MathML markup.
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @param options.generateID If true, add an `"extid"` attribute
 * to the MathML nodes with a value matching the `atomID`. This can be used
 * to map items on the screen with their MathML representation or vice-versa.
 *
 * @category Conversion
 */
function convertLatexToMathMl(latex, options) {
    if (options === void 0) { options = {}; }
    return (0, atom_to_math_ml_1.toMathML)((0, parser_1.parseLatex)(latex, {
        parseMode: 'math',
        args: function () { return ''; },
        mathstyle: 'displaystyle'
    }), options);
}
exports.convertLatexToMathMl = convertLatexToMathMl;
/**
 * Convert a LaTeX string to a textual representation ready to be spoken
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @return The spoken representation of the input LaTeX.
 * @example
 * console.log(convertLatexToSpeakableText('\\frac{1}{2}'));
 * // 'half'
 * @category Conversion
 * @keywords convert, latex, speech, speakable, text, speakable text
 */
function convertLatexToSpeakableText(latex) {
    var atoms = (0, parser_1.parseLatex)(latex, {
        parseMode: 'math',
        mathstyle: 'displaystyle'
    });
    return (0, atom_to_speakable_text_1.atomToSpeakableText)(atoms);
}
exports.convertLatexToSpeakableText = convertLatexToSpeakableText;
var gComputeEngine;
/**
 * Convert a MathJSON expression to a LaTeX string.
 *
 * ```js
 * convertMathJsonToLatex(["Add", 1, 2]);
 * // -> "1 + 2"
 * ```
 * @category Conversion
 */
function convertMathJsonToLatex(json) {
    var _a, _b;
    if (!gComputeEngine) {
        var ComputeEngineCtor = (_a = globalThis[Symbol["for"]('io.cortexjs.compute-engine')]) === null || _a === void 0 ? void 0 : _a.ComputeEngine;
        if (ComputeEngineCtor)
            gComputeEngine = new ComputeEngineCtor();
        else {
            console.error("MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.\n        \n        Load the library, for example with:\n        \n        import \"https://unpkg.com/@cortex-js/compute-engine?module\"");
        }
    }
    return (_b = gComputeEngine === null || gComputeEngine === void 0 ? void 0 : gComputeEngine.box(json).latex) !== null && _b !== void 0 ? _b : '';
}
exports.convertMathJsonToLatex = convertMathJsonToLatex;
/** Convert a LaTeX string to a string of AsciiMath.
 *
 * ```js
 * convertLatexToAsciiMath("\\frac{1}{2}");
 * // -> "1/2"
 * ```
 * @category Conversion
 */
function convertLatexToAsciiMath(latex, parseMode) {
    if (parseMode === void 0) { parseMode = 'math'; }
    return (0, atom_to_ascii_math_1.atomToAsciiMath)(new atom_class_1.Atom({ type: 'root', body: (0, parser_1.parseLatex)(latex, { parseMode: parseMode }) }));
}
exports.convertLatexToAsciiMath = convertLatexToAsciiMath;
/**
 * Convert an AsciiMath string to a LaTeX string.
 *
 * ```js
 * convertAsciiMathToLatex("1/2");
 * // -> "\\frac{1}{2}"
 * ```
 * @category Conversion
 */
function convertAsciiMathToLatex(ascii) {
    return (0, parse_math_string_1.parseMathString)(ascii, { format: 'ascii-math' })[1];
}
exports.convertAsciiMathToLatex = convertAsciiMathToLatex;
