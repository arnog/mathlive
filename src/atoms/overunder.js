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
exports.__esModule = true;
exports.OverunderAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var v_box_1 = require("../core/v-box");
var context_1 = require("../core/context");
var delimiters_1 = require("../core/delimiters");
// An `overunder` atom has the following attributes:
// - body: atoms[]: atoms displayed on the base line
// - svgBody: string. A SVG graphic displayed on the base line (if present, the body is ignored)
// - above: atoms[]: atoms displayed above the body
// - svgAbove: string. A named SVG graphic above the element
// - below: atoms[]: atoms displayed below the body
// - svgBelow: string. A named SVG graphic below the element
var OverunderAtom = /** @class */ (function (_super) {
    __extends(OverunderAtom, _super);
    function OverunderAtom(options) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, {
            type: 'overunder',
            command: options.command,
            style: options.style,
            mode: options.mode,
            body: options.body,
            skipBoundary: (_a = options.skipBoundary) !== null && _a !== void 0 ? _a : true
        }) || this;
        _this.subsupPlacement = options.supsubPlacement;
        _this.svgAbove = options.svgAbove;
        _this.svgBelow = options.svgBelow;
        _this.svgBody = options.svgBody;
        _this.above = options.above;
        _this.below = options.below;
        _this.boxType = (_b = options.boxType) !== null && _b !== void 0 ? _b : 'ord';
        _this.paddedBody = (_c = options.paddedBody) !== null && _c !== void 0 ? _c : false;
        _this.paddedLabels = (_d = options.paddedLabels) !== null && _d !== void 0 ? _d : false;
        return _this;
    }
    OverunderAtom.fromJson = function (json) {
        return new OverunderAtom(json);
    };
    OverunderAtom.prototype.toJson = function () {
        var json = _super.prototype.toJson.call(this);
        if (!this.skipBoundary)
            json.skipBoundary = false;
        if (this.subsupPlacement)
            json.subsupPlacement = this.subsupPlacement;
        if (this.svgAbove)
            json.svgAbove = this.svgAbove;
        if (this.svgBelow)
            json.svgBelow = this.svgBelow;
        if (this.svgBody)
            json.svgBody = this.svgBody;
        if (this.boxType !== 'ord')
            json.boxType = this.boxType;
        if (this.paddedBody)
            json.paddedBody = true;
        if (this.paddedLabels)
            json.paddedLabels = true;
        return json;
    };
    /**
     * Combine a base with an atom above and an atom below.
     *
     * See http://tug.ctan.org/macros/latex/required/amsmath/amsmath.dtx
     *
     * > \newcommand{\overset}[2]{\binrel@{#2}%
     * > \binrel@@{\mathop{\kern\z@#2}\limits^{#1}}}
     *
     */
    OverunderAtom.prototype.render = function (parentContext) {
        var body = this.svgBody
            ? (0, box_1.makeSVGBox)(this.svgBody)
            : atom_class_1.Atom.createBox(parentContext, this.body, { type: 'ignore' });
        var annotationContext = new context_1.Context({ parent: parentContext, mathstyle: 'scriptstyle' }, this.style);
        var above = null;
        if (this.svgAbove)
            above = (0, box_1.makeSVGBox)(this.svgAbove);
        else if (this.above)
            above = atom_class_1.Atom.createBox(annotationContext, this.above, { type: 'ignore' });
        var below = null;
        // let belowShift: number;
        if (this.svgBelow)
            below = (0, box_1.makeSVGBox)(this.svgBelow);
        else if (this.below)
            below = atom_class_1.Atom.createBox(annotationContext, this.below, { type: 'ignore' });
        if (this.paddedBody) {
            // The base of \overset are padded, but \overbrace aren't
            body = new box_1.Box([
                (0, delimiters_1.makeNullDelimiter)(parentContext, 'ML__open'),
                body,
                (0, delimiters_1.makeNullDelimiter)(parentContext, 'ML__close'),
            ], { type: 'ignore' });
        }
        var base = makeOverunderStack(parentContext, {
            base: body,
            above: above,
            below: below,
            type: this.boxType === 'bin' || this.boxType === 'rel' ? this.boxType : 'ord',
            paddedAboveBelow: this.paddedLabels
        });
        if (!base)
            return null;
        if (this.subsupPlacement === 'over-under')
            base = this.attachLimits(parentContext, { base: base, type: base.type });
        else
            base = this.attachSupsub(parentContext, { base: base });
        if (this.caret)
            base.caret = this.caret;
        // Bind the generated box so its components can be selected
        return this.bind(parentContext, base);
    };
    return OverunderAtom;
}(atom_class_1.Atom));
exports.OverunderAtom = OverunderAtom;
/**
 * Combine a nucleus with an atom above and an atom below. Used to form
 * stacks for the 'overunder' atom type .
 *
 * @param nucleus The base over and under which the atoms will
 * be placed.
 * @param type The type ('rel', 'bin', etc...) of the result
 */
function makeOverunderStack(context, options) {
    // If no base, nothing to do
    if (!options.base)
        return null;
    // If nothing above and nothing below, nothing to do.
    if (!options.above && !options.below) {
        var box = new box_1.Box(options.base, { type: options.type });
        box.setStyle('position', 'relative');
        return box;
    }
    var aboveShift = 0;
    if (options.above)
        aboveShift = context.metrics.bigOpSpacing5; // Empirical
    var result = null;
    var base = options.base;
    var baseShift = 0;
    // (wrappedNucleus.height - wrappedNucleus.depth) / 2 -
    // context.mathstyle.metrics.axisHeight;
    var classes = ['ML__center'];
    if (options.paddedAboveBelow)
        classes.push('ML__label_padding');
    if (options.below && options.above) {
        var bottom = context.metrics.bigOpSpacing5 +
            options.below.height +
            options.below.depth +
            base.depth +
            baseShift;
        result = new v_box_1.VBox({
            bottom: bottom,
            children: [
                context.metrics.bigOpSpacing5,
                { box: options.below, classes: classes },
                { box: base, classes: ['ML__center'] },
                aboveShift,
                { box: options.above, classes: classes },
                context.metrics.bigOpSpacing5,
            ]
        });
    }
    else if (options.below) {
        result = new v_box_1.VBox({
            top: base.height - baseShift,
            children: [
                context.metrics.bigOpSpacing5,
                { box: options.below, classes: classes },
                { box: base, classes: ['ML__center'] },
            ]
        });
    }
    else if (options.above) {
        result = new v_box_1.VBox({
            bottom: base.depth + baseShift,
            children: [
                // base.depth,
                { box: base, classes: ['ML__center'] },
                aboveShift,
                { box: options.above, classes: classes },
                context.metrics.bigOpSpacing5,
            ]
        });
    }
    return new box_1.Box(result, { type: options.type });
}
