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
exports.AccentAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var context_1 = require("../core/context");
var font_metrics_1 = require("../core/font-metrics");
var v_box_1 = require("../core/v-box");
var AccentAtom = /** @class */ (function (_super) {
    __extends(AccentAtom, _super);
    function AccentAtom(options) {
        var _this = this;
        var _a;
        _this = _super.call(this, __assign(__assign({}, options), { type: 'accent', body: (_a = options.body) !== null && _a !== void 0 ? _a : undefined })) || this;
        if (options.accentChar)
            _this.accent = options.accentChar;
        else
            _this.svgAccent = options === null || options === void 0 ? void 0 : options.svgAccent;
        _this.skipBoundary = true;
        _this.captureSelection = true;
        return _this;
        // this.limits = 'accent'; // This will suppress the regular
        // supsub attachment and will delegate
        // it to the decomposeAccent
        // (any non-null value would do)
    }
    AccentAtom.fromJson = function (json) {
        return new AccentAtom(json);
    };
    AccentAtom.prototype.toJson = function () {
        return __assign(__assign({}, _super.prototype.toJson.call(this)), { accentChar: this.accent, svgAccent: this.svgAccent });
    };
    AccentAtom.prototype.render = function (parentContext) {
        // > Math accents, and the operations \sqrt and \overline, change
        // > uncramped styles to their cramped counterparts; for example, D
        // > changes to D′, but D′ stays as it was. -- TeXBook p. 152
        var _a;
        var context = new context_1.Context({ parent: parentContext, mathstyle: 'cramp' }, this.style);
        // Accents are handled in the TeXbook pg. 443, rule 12.
        //
        // 1. Build the base atom
        //
        var base = (_a = atom_class_1.Atom.createBox(context, this.body)) !== null && _a !== void 0 ? _a : new box_1.Box('▢', { style: this.style });
        //
        // 2. Skew
        //
        // Calculate the skew of the accent.
        // > If the nucleus is not a single character, let s = 0; otherwise set s
        // > to the kern amount for the nucleus followed by the \skewchar of its
        // > font.
        // Note that our skew metrics are just the kern between each character
        // and the skewchar.
        var skew = 0;
        if (!this.hasEmptyBranch('body') &&
            this.body.length === 2 &&
            this.body[1].isCharacterBox())
            skew = base.skew;
        //
        // 3. Calculate the amount of space between the base and the accent
        //
        var clearance = Math.min(base.height, font_metrics_1.X_HEIGHT);
        //
        // 4. Build the accent
        //
        var accentBox;
        if (this.svgAccent) {
            accentBox = (0, box_1.makeSVGBox)(this.svgAccent);
            clearance = context.metrics.bigOpSpacing1 - clearance;
        }
        else if (this.accent) {
            // Build the accent
            var accent = new box_1.Box(this.accent, { fontFamily: 'Main-Regular' });
            // Remove the italic correction of the accent, because it only serves to
            // shift the accent over to a place we don't want.
            accent.italic = 0;
            // The \vec character that the fonts use is a combining character, and
            // thus shows up much too far to the left. To account for this, we add a
            // specific class which shifts the accent over to where we want it.
            var vecClass = this.accent === 0x20d7 ? ' ML__accent-vec' : '';
            accentBox = new box_1.Box(new box_1.Box(accent), {
                classes: 'ML__accent-body' + vecClass
            });
        }
        //
        // 5. Combine the base and the accent
        //
        // Shift the accent over by the skew. Note we shift by twice the skew
        // because we are centering the accent, so by adding 2*skew to the left,
        // we shift it to the right by 1*skew.
        accentBox = new v_box_1.VBox({
            shift: 0,
            children: [
                { box: new box_1.Box(base) },
                -clearance,
                {
                    box: accentBox,
                    marginLeft: base.left + 2 * skew,
                    classes: ['ML__center']
                },
            ]
        });
        var result = new box_1.Box(accentBox, { type: 'lift' });
        if (this.caret)
            result.caret = this.caret;
        this.bind(context, result.wrap(context));
        return this.attachSupsub(context, { base: result });
    };
    return AccentAtom;
}(atom_class_1.Atom));
exports.AccentAtom = AccentAtom;
