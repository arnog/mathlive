"use strict";
/**
 * This file contains information and classes for the 'math styles' used by TeX,
 * which are specific layout algorithms for math.
 *
 * They get progressively smaller and tighter:
 * - displaystyle is used for expressions laid out on their own (in a block)
 * - textstyle is for expressions displayed on a line (usually with some text
 * around)
 * - scriptstyle is for expressions displayed as a superscript for example
 * - scriptscriptstyle is for expressions displayed as a superscript of a superscript
 * - the 'cramped' variations are used in various places, for examples a subscript
 * is using the 'scriptstyle', but cramped (so it's a bit more tight than a
 * superscript which is just using the 'scriptstyle')
 *
 * See Texbook, p.441:
 *
 * > A math list is a sequence of items of the various kinds listed in Chapter 17,
 * > and TEX typesets a formula by converting a math list to a horizontal list.
 * > When such typesetting begins, TEX has two other pieces of information in
 * > addition to the math list itself. (a) The starting style tells what style
 * > should be used for the math list, unless another style is specified by a
 * > style item. For example, the starting style for a displayed formula is D,
 * > but for an equation in the text or an equation number it is T; and for a
 * > subformula it can be any one of the eight styles defined in Chapter 17.
 * >
 * > We shall use C to stand for the current style, and we shall say that the
 * > math list is being typeset in style C. (b) The typesetting is done either
 * > with or without penalties. Formulas in the text of a paragraph are converted
 * > to horizontal lists in which additional penalty items are ed after
 * > binary operations and relations, in order to aid in line breaking. Such
 * > penalties are not ed in other cases, because they would serve no
 * > useful function.
 * >
 * > The eight styles are considered to be D > D′ > T > T′ > S > S′ > SS > SS′,
 * > in decreasing order. Thus, C ≤ S means that the current style is S, S', SS,
 * > or SS'. Style C′ means the current style with a prime added if one isn’t
 * > there; for example, we have C = T if and only if C = T or C = T'.
 * > Style C↑ is the superscript style for C; this means style S if C is D or T,
 * > style S′ if C is D′ or T′, style SS if C is S or SS,
 * > and style SS if C is S or SS.
 * > Finally, style C↓ is the subscript style, which is (C↑) .
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
exports.MATHSTYLES = exports.Mathstyle = exports.SSc = exports.SS = exports.Sc = exports.S = exports.Tc = exports.T = exports.Dc = exports.D = void 0;
var font_metrics_1 = require("./font-metrics");
// IDs of the different MATHSTYLES
exports.D = 7; // Displaystyle
exports.Dc = 6; // Displaystyle, cramped
exports.T = 5; // Textstyle
exports.Tc = 4;
exports.S = 3; // Scriptstyle
exports.Sc = 2;
exports.SS = 1; // Scriptscriptstyle
exports.SSc = 0;
/**
 * @property {number} id unique id for the style
 * @property {number} sizeDelta (which is the same for cramped and uncramped version
 * of a style)
 * @property {boolean}  cramped flag
 */
var Mathstyle = /** @class */ (function () {
    function Mathstyle(id, sizeDelta, cramped) {
        this.id = id;
        this.sizeDelta = sizeDelta;
        this.cramped = cramped;
        var metricsIndex = { '-4': 2, '-3': 1, 0: 0 }[sizeDelta];
        this.metrics = Object.keys(font_metrics_1.FONT_METRICS).reduce(function (acc, x) {
            var _a;
            return __assign(__assign({}, acc), (_a = {}, _a[x] = font_metrics_1.FONT_METRICS[x][metricsIndex], _a));
        }, {});
    }
    Mathstyle.prototype.getFontSize = function (size) {
        return Math.max(1, size + this.sizeDelta);
    };
    Object.defineProperty(Mathstyle.prototype, "sup", {
        /**
         * Get the style of a superscript given a base in the current style.
         */
        get: function () {
            return exports.MATHSTYLES[[exports.SSc, exports.SS, exports.SSc, exports.SS, exports.Sc, exports.S, exports.Sc, exports.S][this.id]];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mathstyle.prototype, "sub", {
        /**
         * Get the style of a subscript given a base in the current style.
         */
        get: function () {
            return exports.MATHSTYLES[[exports.SSc, exports.SSc, exports.SSc, exports.SSc, exports.Sc, exports.Sc, exports.Sc, exports.Sc][this.id]];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mathstyle.prototype, "fracNum", {
        /**
         * Get the style of a fraction numerator given the fraction in the current
         * style.
         * See TeXBook p 141.
         */
        get: function () {
            return exports.MATHSTYLES[[exports.SSc, exports.SS, exports.SSc, exports.SS, exports.Sc, exports.S, exports.Tc, exports.T][this.id]];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mathstyle.prototype, "fracDen", {
        /**
         * Get the style of a fraction denominator given the fraction in the current
         * style.
         * See TeXBook p 141.
         */
        get: function () {
            return exports.MATHSTYLES[[exports.SSc, exports.SSc, exports.SSc, exports.SSc, exports.Sc, exports.Sc, exports.Tc, exports.Tc][this.id]];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mathstyle.prototype, "cramp", {
        /**
         * Get the cramped version of a style (in particular, cramping a cramped style
         * doesn't change the style).
         */
        get: function () {
            return exports.MATHSTYLES[[exports.SSc, exports.SSc, exports.Sc, exports.Sc, exports.Tc, exports.Tc, exports.Dc, exports.Dc][this.id]];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mathstyle.prototype, "isTight", {
        /**
         * Return if this style is tightly spaced (scriptstyle/scriptscriptstyle)
         */
        get: function () {
            return this.sizeDelta < 0;
        },
        enumerable: false,
        configurable: true
    });
    return Mathstyle;
}());
exports.Mathstyle = Mathstyle;
var NUMERIC_MATHSTYLES = {
    7: new Mathstyle(exports.D, 0, false),
    6: new Mathstyle(exports.Dc, 0, true),
    5: new Mathstyle(exports.T, 0, false),
    4: new Mathstyle(exports.Tc, 0, true),
    3: new Mathstyle(exports.S, -3, false),
    2: new Mathstyle(exports.Sc, -3, true),
    1: new Mathstyle(exports.SS, -4, false),
    0: new Mathstyle(exports.SSc, -4, true)
};
exports.MATHSTYLES = __assign(__assign({}, NUMERIC_MATHSTYLES), { displaystyle: NUMERIC_MATHSTYLES[exports.D], textstyle: NUMERIC_MATHSTYLES[exports.T], scriptstyle: NUMERIC_MATHSTYLES[exports.S], scriptscriptstyle: NUMERIC_MATHSTYLES[exports.SS] });
