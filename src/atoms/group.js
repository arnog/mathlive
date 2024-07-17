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
exports.GroupAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var GroupAtom = /** @class */ (function (_super) {
    __extends(GroupAtom, _super);
    function GroupAtom(arg, mode) {
        var _this = _super.call(this, { type: 'group', mode: mode }) || this;
        _this.body = arg;
        // Non-empty groups introduce a break in the
        // inter-box spacing. Empty groups (`{}`) do not.
        _this.boxType = arg.length > 1 ? 'ord' : 'ignore';
        _this.skipBoundary = true;
        _this.displayContainsHighlight = false;
        // French decimal point, i.e. `{,}`
        if (arg && arg.length === 1 && arg[0].command === ',')
            _this.captureSelection = true;
        return _this;
    }
    GroupAtom.fromJson = function (json) {
        return new GroupAtom(json.body, json.mode);
    };
    GroupAtom.prototype.render = function (context) {
        var box = atom_class_1.Atom.createBox(context, this.body, { type: this.boxType });
        if (!box)
            return null;
        if (this.caret)
            box.caret = this.caret;
        // Need to bind the group so that the DOM element can be matched
        // and the atom iterated recursively. Otherwise, it behaves
        // as if `captureSelection === true`
        return this.bind(context, box);
    };
    GroupAtom.prototype._serialize = function (options) {
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        return "{".concat(this.bodyToLatex(options), "}");
    };
    return GroupAtom;
}(atom_class_1.Atom));
exports.GroupAtom = GroupAtom;
