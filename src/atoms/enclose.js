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
exports.EncloseAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var context_1 = require("../core/context");
var tokenizer_1 = require("../core/tokenizer");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var font_metrics_1 = require("../core/font-metrics");
var EncloseAtom = /** @class */ (function (_super) {
    __extends(EncloseAtom, _super);
    function EncloseAtom(command, body, notation, options) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, { type: 'enclose', command: command, style: options.style }) || this;
        _this.body = body;
        _this.backgroundcolor = options.backgroundcolor;
        if (notation.updiagonalarrow)
            notation.updiagonalstrike = false;
        if (notation.box) {
            notation.left = false;
            notation.right = false;
            notation.bottom = false;
            notation.top = false;
        }
        _this.notation = notation;
        _this.shadow = (_a = options.shadow) !== null && _a !== void 0 ? _a : 'none';
        _this.strokeWidth = (_b = options.strokeWidth) !== null && _b !== void 0 ? _b : '0.06em';
        if (!_this.strokeWidth)
            _this.strokeWidth = '0.06em';
        _this.strokeStyle = options.strokeStyle;
        _this.svgStrokeStyle = options.svgStrokeStyle;
        _this.strokeColor = options.strokeColor;
        _this.borderStyle = options.borderStyle;
        _this.padding = options.padding;
        _this.captureSelection = false;
        return _this;
    }
    EncloseAtom.fromJson = function (json) {
        return new EncloseAtom(json.command, json.body, json.notation, json);
    };
    EncloseAtom.prototype.toJson = function () {
        return __assign(__assign({}, _super.prototype.toJson.call(this)), { notation: this.notation, shadow: this.shadow, strokeWidth: this.strokeWidth, strokeStyle: this.strokeStyle, svgStrokeStyle: this.svgStrokeStyle, strokeColor: this.strokeColor, borderStyle: this.borderStyle, padding: this.padding });
    };
    EncloseAtom.prototype._serialize = function (options) {
        var _a;
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        var command = (_a = this.command) !== null && _a !== void 0 ? _a : '';
        if (this.command === '\\enclose') {
            command += '{' + Object.keys(this.notation).join(' ') + '}';
            // \enclose can have optional parameters...
            var style = '';
            var sep = '';
            if (this.backgroundcolor && this.backgroundcolor !== 'transparent') {
                style += sep + 'mathbackground="' + this.backgroundcolor + '"';
                sep = ',';
            }
            if (this.shadow && this.shadow !== 'auto') {
                style += sep + 'shadow="' + this.shadow + '"';
                sep = ',';
            }
            if (this.strokeWidth || this.strokeStyle !== 'solid') {
                style += sep + this.borderStyle;
                sep = ',';
            }
            else if (this.strokeColor && this.strokeColor !== 'currentColor') {
                style += sep + 'mathcolor="' + this.strokeColor + '"';
                sep = ',';
            }
            if (style)
                command += "[".concat(style, "]");
        }
        return (0, tokenizer_1.latexCommand)(command, this.bodyToLatex(options));
    };
    EncloseAtom.prototype.render = function (parentContext) {
        var context = new context_1.Context({ parent: parentContext }, this.style);
        var base = atom_class_1.Atom.createBox(context, this.body);
        if (!base)
            return null;
        var borderWidth = borderDim(this.borderStyle);
        // Calculate the padding
        var padding = context.toEm(!this.padding || this.padding === 'auto'
            ? { register: 'fboxsep' }
            : { string: this.padding });
        base.setStyle('position', 'relative');
        base.setStyle('display', 'inline-block');
        base.setStyle('top', padding, 'em');
        base.setStyle('height', base.height + base.depth, 'em');
        base.setStyle('width', base.width, 'em');
        var notation = new box_1.Box(null, { classes: 'ML__notation' });
        // The 'ML__notation' class is required to prevent the box from being
        // omitted during rendering (otherwise it would look like an empty, no-op
        // box)
        var h = base.height + base.depth + 2 * padding;
        var w = base.width + 2 * padding;
        var svg = '';
        if (this.notation.horizontalstrike)
            svg += this.line(3, 50, 97, 50);
        if (this.notation.verticalstrike)
            svg += this.line(50, 3, 50, 97);
        if (this.notation.updiagonalstrike)
            svg += this.line(3, 97, 97, 3);
        if (this.notation.downdiagonalstrike)
            svg += this.line(3, 3, 97, 97);
        if (this.notation.updiagonalarrow) {
            svg += this.line(padding.toString(), (padding + base.depth + base.height).toString(), (padding + base.width).toString(), padding.toString());
            var t = 1;
            var length_1 = Math.sqrt(w * w + h * h);
            var f = 0.03 * length_1 * t;
            var wf = base.width * f;
            var hf = (base.depth + base.height) * f;
            var x = padding + base.width;
            var y = padding;
            if (y + hf - 0.4 * wf < 0)
                y = 0.4 * wf - hf;
            svg += '<polygon points="';
            svg += "".concat(x, ",").concat(y, " ").concat(x - wf - 0.4 * hf, ",").concat(y + hf - 0.4 * wf, " ");
            svg += "".concat(x - 0.7 * wf, ",").concat(y + 0.7 * hf, " ").concat(x - wf + 0.4 * hf, ",").concat(y + hf + 0.4 * wf, " ");
            svg += "".concat(x, ",").concat(y);
            svg += "\" stroke='none' fill=\"".concat(this.strokeColor, "\"");
            svg += '/>';
        }
        var wDelta = 0;
        if (this.notation.phasorangle) {
            var clearance = getClearance(context);
            var bot = (base.height +
                base.depth +
                2 * clearance +
                padding).toString();
            var angleWidth = (base.height + base.depth) / 2;
            // Horizontal line
            svg += this.line(padding.toString(), bot, (padding + angleWidth + base.width).toString(), bot);
            // Angle line
            svg += this.line(padding.toString(), bot, (padding + angleWidth).toString(), (padding - clearance).toString());
            // Increase height to account for clearance
            h += clearance;
            // Increase the width to account for the angle
            wDelta = angleWidth;
            base.left += h / 2 - padding;
        }
        // if (this.notation.radical) {
        //   svg += '<path d="';
        //   svg += `M 0,${0.6 * h} L1,${h} L${
        //     convertDimensionToPixel(padding) * 2
        //   },1 "`;
        //   svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
        //   if (this.svgStrokeStyle) {
        //     svg += ' stroke-linecap="round"';
        //     svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
        //   }
        //   svg += '/>';
        // }
        if (this.notation.longdiv) {
            var clearance = getClearance(context);
            h += clearance;
            svg += this.line(padding.toString(), padding.toString(), (padding + base.width).toString(), padding.toString());
            var surdWidth = 0.3;
            wDelta = surdWidth + clearance;
            base.left += surdWidth + clearance;
            base.setTop(padding + clearance);
            svg += '<path d="';
            svg += "M ".concat(padding, " ").concat(padding, "  a").concat(surdWidth, " ").concat((base.depth + base.height + 2 * clearance) / 2, ", 0, 1, 1, 0 ").concat(base.depth + base.height + 2 * clearance, " \"");
            svg += " stroke-width=\"".concat(getRuleThickness(context), "\" stroke=\"").concat(this.strokeColor, "\" fill=\"none\"");
            svg += '/>';
        }
        notation.width = base.width + 2 * padding + wDelta;
        notation.height = base.height + padding;
        notation.depth = base.depth + padding;
        notation.setStyle('box-sizing', 'border-box');
        notation.setStyle('left', "calc(-".concat(borderWidth, " / 2 )"));
        notation.setStyle('height', "".concat(Math.floor(100 * h) / 100, "em"));
        notation.setStyle('top', "calc(".concat(borderWidth, " / 2 )"));
        // notation.setStyle('width', `${Math.floor(100 * w) / 100}em`);
        if (this.backgroundcolor)
            notation.setStyle('background-color', this.backgroundcolor);
        if (this.notation.box)
            notation.setStyle('border', '1px solid red');
        if (this.notation.actuarial) {
            notation.setStyle('border-top', this.borderStyle);
            notation.setStyle('border-right', this.borderStyle);
        }
        if (this.notation.madruwb) {
            notation.setStyle('border-bottom', this.borderStyle);
            notation.setStyle('border-right', this.borderStyle);
        }
        if (this.notation.roundedbox) {
            notation.setStyle('border-radius', '8px');
            notation.setStyle('border', this.borderStyle);
        }
        if (this.notation.circle) {
            notation.setStyle('border-radius', '50%');
            notation.setStyle('border', this.borderStyle);
        }
        if (this.notation.top)
            notation.setStyle('border-top', this.borderStyle);
        if (this.notation.left)
            notation.setStyle('border-left', this.borderStyle);
        if (this.notation.right)
            notation.setStyle('border-right', this.borderStyle);
        if (this.notation.bottom)
            notation.setStyle('border-bottom', this.borderStyle);
        if (svg) {
            var svgStyle = '';
            if (this.shadow === 'auto') {
                svgStyle +=
                    'filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333)';
            }
            if (this.shadow !== 'none')
                svgStyle += "filter: drop-shadow(".concat(this.shadow, ")");
            svgStyle += " stroke-width=\"".concat(this.strokeWidth, "\" stroke=\"").concat(this.strokeColor, "\"");
            svgStyle += ' stroke-linecap="round"';
            if (this.svgStrokeStyle)
                svgStyle += " stroke-dasharray=\"".concat(this.svgStrokeStyle, "\"");
            notation.svgStyle = svgStyle;
            notation.svgOverlay = svg;
        }
        // Result is a box combining the base and the notation
        var result = new box_1.Box([notation, base]);
        // Set its position as relative so that the notation can be absolute
        // positioned over the base
        result.setStyle('position', 'relative');
        result.setStyle('vertical-align', padding, 'em');
        result.setStyle('height', "".concat(Math.floor(100 * (base.height + base.depth + 2 * padding)) / 100, "em"));
        // We set the padding later with `left` and `right` so subtract it now
        // result.setStyle('width', `${Math.floor(100 * base.width) / 100}em`);
        // result.setStyle('width', `100%`);
        result.setStyle('display', 'inline-block');
        result.height = notation.height;
        result.depth = notation.depth;
        result.width = notation.width - 2 * padding;
        result.left = padding;
        result.right = padding;
        if (this.caret)
            result.caret = this.caret;
        return result.wrap(context);
    };
    EncloseAtom.prototype.line = function (x1, y1, x2, y2) {
        return "<line x1=\"".concat(coord(x1), "\"  y1=\"").concat(coord(y1), "\" x2=\"").concat(coord(x2), "\" y2=\"").concat(coord(y2), "\" vector-effect=\"non-scaling-stroke\"></line>");
    };
    return EncloseAtom;
}(atom_class_1.Atom));
exports.EncloseAtom = EncloseAtom;
function coord(c) {
    if (typeof c === 'number')
        return "".concat(Math.floor(100 * c) / 100, "%");
    return c;
}
function borderDim(s) {
    if (!s)
        return '1px';
    var m = s.match(/([0-9][a-zA-Z\%]+)/);
    if (m === null)
        return '1px';
    return m[1];
}
function getRuleThickness(ctx) {
    // Same thickness as the surd rule
    // @todo: mystery: need to divide by 10...
    return ((Math.floor((100 * ctx.metrics.sqrtRuleThickness) / ctx.scalingFactor) /
        100 /
        10).toString() + 'em');
}
function getClearance(ctx) {
    // Same clearance as for a sqrt
    var phi = ctx.isDisplayStyle ? font_metrics_1.X_HEIGHT : ctx.metrics.defaultRuleThickness;
    return ctx.metrics.defaultRuleThickness + (ctx.scalingFactor * phi) / 4;
}
