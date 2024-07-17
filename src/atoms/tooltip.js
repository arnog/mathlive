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
exports.TooltipAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var context_1 = require("../core/context");
var box_1 = require("../core/box");
var font_metrics_1 = require("../core/font-metrics");
var atom_1 = require("../core/atom");
var inter_box_spacing_1 = require("../core/inter-box-spacing");
var TooltipAtom = /** @class */ (function (_super) {
    __extends(TooltipAtom, _super);
    function TooltipAtom(options) {
        var _this = _super.call(this, {
            type: 'tooltip',
            command: options.command,
            mode: options.mode,
            style: options.style,
            body: options.body,
            displayContainsHighlight: true
        }) || this;
        _this.tooltip = new atom_class_1.Atom({
            type: 'root',
            mode: options.content,
            body: options.tooltip,
            style: {}
        });
        _this.skipBoundary = true;
        _this.captureSelection = false;
        return _this;
    }
    TooltipAtom.fromJson = function (json) {
        return new TooltipAtom(__assign(__assign({}, json), { tooltip: (0, atom_1.fromJson)(json.tooltip) }));
    };
    TooltipAtom.prototype.toJson = function () {
        var _a;
        var tooltip = (_a = this.tooltip.body) === null || _a === void 0 ? void 0 : _a.filter(function (x) { return x.type !== 'first'; }).map(function (x) { return x.toJson(); });
        return __assign(__assign({}, _super.prototype.toJson.call(this)), { tooltip: tooltip });
    };
    TooltipAtom.prototype.render = function (context) {
        var body = atom_class_1.Atom.createBox(new context_1.Context(), this.body);
        if (!body)
            return null;
        var tooltipContext = new context_1.Context({ parent: context, mathstyle: 'displaystyle' }, { fontSize: font_metrics_1.DEFAULT_FONT_SIZE });
        var tooltip = (0, box_1.coalesce)((0, inter_box_spacing_1.applyInterBoxSpacing)(new box_1.Box(this.tooltip.render(tooltipContext), {
            classes: 'ML__tooltip-content'
        }), tooltipContext));
        var box = new box_1.Box([tooltip, body], { classes: 'ML__tooltip-container' });
        if (this.caret)
            box.caret = this.caret;
        return this.bind(context, box);
    };
    return TooltipAtom;
}(atom_class_1.Atom));
exports.TooltipAtom = TooltipAtom;
