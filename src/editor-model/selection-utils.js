"use strict";
exports.__esModule = true;
exports.getMode = exports.isSelection = exports.isRange = exports.isOffset = exports.range = exports.compareSelection = void 0;
function compareSelection(a, b) {
    if (a.direction === b.direction) {
        var l = a.ranges.length;
        if (b.ranges.length === l) {
            var i = 0;
            while (i < l && compareRange(a.ranges[i], b.ranges[i]) === 'equal')
                i++;
            return i === l ? 'equal' : 'different';
        }
    }
    return 'different';
}
exports.compareSelection = compareSelection;
function compareRange(a, b) {
    if (a[0] === b[0] && a[1] === b[1])
        return 'equal';
    return 'different';
}
/**
 * Return the smallest and largest offsets in a selection
 */
function range(selection) {
    var first = Infinity;
    var last = -Infinity;
    for (var _i = 0, _a = selection.ranges; _i < _a.length; _i++) {
        var range_1 = _a[_i];
        first = Math.min(first, range_1[0], range_1[1]);
        last = Math.max(last, range_1[0], range_1[1]);
    }
    return [first, last];
}
exports.range = range;
function isOffset(value) {
    return typeof value === 'number' && !Number.isNaN(value);
}
exports.isOffset = isOffset;
function isRange(value) {
    return Array.isArray(value) && value.length === 2;
}
exports.isRange = isRange;
function isSelection(value) {
    return (value !== undefined &&
        value !== null &&
        typeof value === 'object' &&
        'ranges' in value &&
        Array.isArray(value.ranges));
}
exports.isSelection = isSelection;
function getMode(model, offset) {
    var atom = model.at(offset);
    var result;
    if (atom) {
        result = atom.mode;
        var ancestor = atom.parent;
        while (!result && ancestor) {
            if (ancestor)
                result = ancestor.mode;
            ancestor = ancestor.parent;
        }
    }
    return result;
}
exports.getMode = getMode;
