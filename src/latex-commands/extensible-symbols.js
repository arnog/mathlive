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
var overunder_1 = require("../atoms/overunder");
var definitions_utils_1 = require("./definitions-utils");
// Extensible (horizontally stretchy) symbols
(0, definitions_utils_1.defineFunction)([
    'overrightarrow',
    'overleftarrow',
    'Overrightarrow',
    'overleftharpoon',
    'overrightharpoon',
    'overleftrightarrow',
    'overlinesegment',
    'overgroup',
], '{:auto}', {
    createAtom: function (options) {
        var _a;
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)((_a = options.args) === null || _a === void 0 ? void 0 : _a[0]), skipBoundary: false, supsubPlacement: 'over-under', paddedBody: true, boxType: 'rel', 
            // Set the "svgAbove" to the name of a SVG object (which is the same
            // as the command name)
            svgAbove: options.command.slice(1) }));
    }
});
(0, definitions_utils_1.defineFunction)('overbrace', '{:auto}', {
    createAtom: function (options) {
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), skipBoundary: false, supsubPlacement: 'over-under', paddedBody: true, boxType: 'ord', svgAbove: options.command.slice(1) }));
    }
});
(0, definitions_utils_1.defineFunction)([
    'underrightarrow',
    'underleftarrow',
    'underleftrightarrow',
    'underlinesegment',
    'undergroup',
], '{:auto}', {
    createAtom: function (options) {
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), skipBoundary: false, supsubPlacement: 'over-under', paddedBody: true, boxType: 'rel', 
            // Set the "svgBelow" to the name of a SVG object (which is the same
            // as the command name)
            svgBelow: options.command.slice(1) }));
    }
});
(0, definitions_utils_1.defineFunction)(['underbrace'], '{:auto}', {
    createAtom: function (options) {
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), skipBoundary: false, supsubPlacement: 'over-under', paddedBody: true, boxType: 'ord', svgBelow: options.command.slice(1) }));
    }
});
(0, definitions_utils_1.defineFunction)([
    'xrightarrow',
    'longrightarrow',
    'xleftarrow',
    'longleftarrow',
    'xRightarrow',
    'xLeftarrow',
    'xleftharpoonup',
    'xleftharpoondown',
    'xrightharpoonup',
    'xrightharpoondown',
    'xlongequal',
    'xtwoheadleftarrow',
    'xtwoheadrightarrow',
    'xleftrightarrow',
    'longleftrightarrow',
    'xLeftrightarrow',
    'xrightleftharpoons',
    'longrightleftharpoons',
    'xleftrightharpoons',
    'xhookleftarrow',
    'xhookrightarrow',
    'xmapsto',
    'xtofrom',
    'xleftrightarrows',
    'longleftrightarrows',
    'xRightleftharpoons',
    'longRightleftharpoons',
    'xLeftrightharpoons',
    'longLeftrightharpoons', // From mhchem.sty package
], '[:auto]{:auto}', {
    createAtom: function (options) {
        var _a, _b, _c, _d, _e;
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { 
            // Set the "svgBody" to the name of a SVG object (which is the same
            // as the command name)
            svgBody: options.command.slice(1), 
            // The overscript is optional, i.e. `\xtofrom` is valid
            above: ((_b = (0, definitions_utils_1.argAtoms)((_a = options.args) === null || _a === void 0 ? void 0 : _a[1])) === null || _b === void 0 ? void 0 : _b.length) === 0
                ? undefined
                : (0, definitions_utils_1.argAtoms)((_c = options.args) === null || _c === void 0 ? void 0 : _c[1]), below: (_e = (0, definitions_utils_1.argAtoms)((_d = options.args) === null || _d === void 0 ? void 0 : _d[0])) !== null && _e !== void 0 ? _e : null, skipBoundary: false, supsubPlacement: 'over-under', paddedBody: true, paddedLabels: true, boxType: 'rel' }));
    },
    serialize: function (atom, options) {
        return atom.command +
            (!atom.hasEmptyBranch('below') ? "[".concat(atom.belowToLatex(options), "]") : '') +
            "{".concat(atom.aboveToLatex(options), "}").concat(atom.supsubToLatex(options));
    }
});
