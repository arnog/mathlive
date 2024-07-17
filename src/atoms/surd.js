"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.SurdAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var font_metrics_1 = require("../core/font-metrics");
var box_1 = require("../core/box");
var v_box_1 = require("../core/v-box");
var context_1 = require("../core/context");
var delimiters_1 = require("../core/delimiters");
var tokenizer_1 = require("../core/tokenizer");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var SurdAtom = /** @class */ (function (_super) {
    __extends(SurdAtom, _super);
    function SurdAtom(options) {
        var _this = this;
        var _a;
        _this = _super.call(this, __assign(__assign({}, options), { type: 'surd', mode: (_a = options.mode) !== null && _a !== void 0 ? _a : 'math', style: options.style, displayContainsHighlight: true, body: options.body })) || this;
        _this.above = options.index;
        return _this;
    }
    SurdAtom.fromJson = function (json) {
        return new SurdAtom(__assign(__assign({}, json), { index: json.above }));
    };
    SurdAtom.prototype._serialize = function (options) {
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        var command = this.command;
        var body = this.bodyToLatex(options);
        if (this.above && !this.hasEmptyBranch('above'))
            return (0, tokenizer_1.latexCommand)("".concat(command, "[").concat(this.aboveToLatex(options), "]"), body);
        if (/^[0-9]$/.test(body))
            return "".concat(command).concat(body);
        return (0, tokenizer_1.latexCommand)(command, body);
    };
    Object.defineProperty(SurdAtom.prototype, "children", {
        // Custom implementation so that the navigation of the index feels natural
        get: function () {
            if (this._children)
                return this._children;
            var result = [];
            if (this.above) {
                for (var _i = 0, _a = this.above; _i < _a.length; _i++) {
                    var x = _a[_i];
                    result.push.apply(result, x.children);
                    result.push(x);
                }
            }
            if (this.body) {
                for (var _b = 0, _c = this.body; _b < _c.length; _b++) {
                    var x = _c[_b];
                    result.push.apply(result, x.children);
                    result.push(x);
                }
            }
            this._children = result;
            return result;
        },
        enumerable: false,
        configurable: true
    });
    SurdAtom.prototype.render = function (context) {
        // See the TeXbook pg. 443, Rule 11.
        // http://www.ctex.org/documents/shredder/src/texbook.pdf
        var _a;
        //
        // 1. Render the inner box
        //
        // > 11. If the current item is a Rad atom (from \radical, e.g., \sqrt),
        // > set box x to the nucleus in style C′
        // -- TeXBook p.443
        // > Math accents, and the operations \sqrt and \overline, change
        // > uncramped styles to their cramped counterparts; for example, D
        // > changes to D′, but D′ stays as it was.
        // -- TeXBook p. 152
        var innerContext = new context_1.Context({ parent: context, mathstyle: 'cramp' }, this.style);
        // In TeX, the type is 'rac'
        var innerBox = (_a = atom_class_1.Atom.createBox(innerContext, this.body, { type: 'inner' })) !== null && _a !== void 0 ? _a : new box_1.Box(null);
        //
        // 2. Render the radical line
        //
        var factor = innerContext.scalingFactor;
        var ruleWidth = innerContext.metrics.defaultRuleThickness / factor;
        // > let φ=σ5 if C>T (TeXBook p. 443)
        var phi = context.isDisplayStyle ? font_metrics_1.X_HEIGHT : ruleWidth;
        var line = new box_1.Box(null, { classes: 'ML__sqrt-line', style: this.style });
        line.height = ruleWidth;
        line.softWidth = innerBox.width;
        //
        // 3. Create a radical delimiter of the required minimum size
        //
        // Calculate the clearance between the body and line
        // > Set ψ = θ + 1/4 |φ|
        var lineClearance = factor * (ruleWidth + phi / 4);
        var innerTotalHeight = Math.max(factor * 2 * phi, innerBox.height + innerBox.depth);
        var minDelimiterHeight = innerTotalHeight + lineClearance + ruleWidth;
        var delimContext = new context_1.Context({ parent: context }, this.style);
        var delimBox = this.bind(delimContext, new box_1.Box((0, delimiters_1.makeCustomSizedDelim)('inner', // @todo not sure if that's the right type
        '\\surd', minDelimiterHeight, false, delimContext, { isSelected: this.isSelected }), {
            isSelected: this.isSelected,
            classes: 'ML__sqrt-sign',
            style: this.style
        }));
        if (!delimBox)
            return null;
        var delimDepth = delimBox.height + delimBox.depth - ruleWidth;
        // Adjust the clearance based on the delimiter size
        if (delimDepth > innerBox.height + innerBox.depth + lineClearance) {
            lineClearance =
                (lineClearance + delimDepth - (innerBox.height + innerBox.depth)) / 2;
        }
        // Shift the delimiter so that its top lines up with the top of the line
        delimBox.setTop(delimBox.height - innerBox.height - lineClearance);
        //
        // 4. Render the body (inner + line)
        //
        var bodyBox = this.bind(context, new v_box_1.VBox({
            firstBaseline: [
                { box: new box_1.Box(innerBox) },
                lineClearance - 2 * ruleWidth,
                { box: line },
                ruleWidth,
            ]
        }));
        //
        // 5. Assemble the body and the delimiter
        //
        //
        // 5.1. Handle the optional root index
        //
        // The index is always in scriptscript style
        // TeXBook p. 360:
        // > \def\root#1\of{\setbox\rootbox=
        // > \hbox{$\m@th \scriptscriptstyle{#1}$}\mathpalette\r@@t}
        var indexBox = atom_class_1.Atom.createBox(new context_1.Context({ parent: context, mathstyle: 'scriptscriptstyle' }), this.above, { type: 'ignore' });
        if (!indexBox) {
            //
            // 5.2. There's no root index (sqrt)
            //
            var result_1 = new box_1.Box([delimBox, bodyBox], {
                classes: this.containsCaret ? 'ML__contains-caret' : '',
                type: 'inner'
            });
            result_1.setStyle('display', 'inline-block');
            result_1.setStyle('height', result_1.height + result_1.depth, 'em');
            if (this.caret)
                result_1.caret = this.caret;
            return this.bind(context, result_1);
        }
        // Build a stack with the index shifted up correctly.
        // The amount the index is shifted by is taken from the TeX
        // source, in the definition of `\r@@t`.
        var indexStack = new v_box_1.VBox({
            shift: -0.6 *
                (Math.max(delimBox.height, bodyBox.height) -
                    Math.max(delimBox.depth, bodyBox.depth)),
            children: [{ box: indexBox }]
        });
        // Add a class surrounding it so we can add on the appropriate
        // kerning
        var result = new box_1.Box([
            new box_1.Box(indexStack, { classes: 'ML__sqrt-index', type: 'ignore' }),
            delimBox,
            bodyBox,
        ], {
            type: 'inner',
            classes: this.containsCaret ? 'ML__contains-caret' : ''
        });
        result.height = delimBox.height;
        result.depth = delimBox.depth;
        if (this.caret)
            result.caret = this.caret;
        return this.bind(context, result);
    };
    return SurdAtom;
}(atom_class_1.Atom));
exports.SurdAtom = SurdAtom;
