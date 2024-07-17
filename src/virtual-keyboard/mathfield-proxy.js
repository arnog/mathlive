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
exports.__esModule = true;
exports.makeProxy = void 0;
function makeProxy(mf) {
    return {
        value: mf.model.getValue(),
        selectionIsCollapsed: mf.model.selectionIsCollapsed,
        canUndo: mf.canUndo(),
        canRedo: mf.canRedo(),
        style: commonStyle(mf.model),
        mode: mf.model.mode
    };
}
exports.makeProxy = makeProxy;
function commonStyle(model) {
    var _a;
    if (model.selectionIsCollapsed)
        return (_a = model.at(model.position)) === null || _a === void 0 ? void 0 : _a.style;
    // Potentially multiple atoms selected, return the COMMON styles
    var selectedAtoms = model.getAtoms(model.selection);
    if (selectedAtoms.length === 0)
        return {};
    var style = __assign({}, selectedAtoms[0].style);
    for (var _i = 0, selectedAtoms_1 = selectedAtoms; _i < selectedAtoms_1.length; _i++) {
        var atom = selectedAtoms_1[_i];
        for (var _b = 0, _c = Object.entries(atom.style); _b < _c.length; _b++) {
            var _d = _c[_b], key = _d[0], value = _d[1];
            if (style[key] !== value)
                delete style[key];
        }
    }
    return style;
}
