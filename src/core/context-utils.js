"use strict";
exports.__esModule = true;
exports.getDefaultContext = void 0;
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var color_1 = require("./color");
var l10n_1 = require("./l10n");
var registers_1 = require("./registers");
/** @internal */
function getDefaultContext() {
    return {
        registers: (0, registers_1.getDefaultRegisters)(),
        smartFence: false,
        renderPlaceholder: undefined,
        placeholderSymbol: '▢',
        letterShapeStyle: l10n_1.l10n.locale.startsWith('fr') ? 'french' : 'tex',
        minFontScale: 0,
        maxMatrixCols: 10,
        colorMap: color_1.defaultColorMap,
        backgroundColorMap: color_1.defaultBackgroundColorMap,
        getMacro: function (token) { return (0, definitions_utils_1.getMacroDefinition)(token, (0, definitions_utils_1.getMacros)()); }
    };
}
exports.getDefaultContext = getDefaultContext;
