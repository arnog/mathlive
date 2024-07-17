"use strict";
exports.__esModule = true;
var enclose_1 = require("../atoms/enclose");
var definitions_utils_1 = require("./definitions-utils");
// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
(0, definitions_utils_1.defineFunction)('enclose', '{notation:string}[style:string]{body:auto}', {
    createAtom: function (atomOptions) {
        var _a, _b;
        var args = atomOptions.args;
        var options = {
            strokeColor: 'currentColor',
            strokeWidth: '',
            strokeStyle: 'solid',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'none',
            svgStrokeStyle: undefined,
            borderStyle: undefined,
            style: (_a = atomOptions.style) !== null && _a !== void 0 ? _a : {}
        };
        // Extract info from style string
        if (args[1]) {
            // Split the string by comma delimited sub-strings, ignoring commas
            // that may be inside (). For example"x, rgb(a, b, c)" would return
            // ['x', 'rgb(a, b, c)']
            var styles = args[1].split(/,(?![^(]*\)(?:(?:[^(]*\)){2})*[^"]*$)/);
            for (var _i = 0, styles_1 = styles; _i < styles_1.length; _i++) {
                var s = styles_1[_i];
                var shorthand = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
                if (shorthand) {
                    options.strokeWidth = shorthand[1];
                    options.strokeStyle = shorthand[2];
                    options.strokeColor = shorthand[3];
                }
                else {
                    var attribute = s.match(/\s*([a-z]*)\s*=\s*"(.*)"/);
                    if (attribute) {
                        if (attribute[1] === 'mathbackground')
                            options.backgroundcolor = attribute[2];
                        else if (attribute[1] === 'mathcolor')
                            options.strokeColor = attribute[2];
                        else if (attribute[1] === 'padding')
                            options.padding = attribute[2];
                        else if (attribute[1] === 'shadow')
                            options.shadow = attribute[2];
                    }
                }
            }
            if (options.strokeStyle === 'dashed')
                options.svgStrokeStyle = '5,5';
            else if (options.strokeStyle === 'dotted')
                options.svgStrokeStyle = '1,5';
        }
        options.borderStyle = "".concat(options.strokeWidth, " ").concat(options.strokeStyle, " ").concat(options.strokeColor);
        // Normalize the list of notations.
        var notation = {};
        ((_b = args[0]) !== null && _b !== void 0 ? _b : '')
            .split(/[, ]/)
            .filter(function (v) { return v.length > 0; })
            .forEach(function (x) {
            notation[x.toLowerCase()] = true;
        });
        return new enclose_1.EncloseAtom(atomOptions.command, (0, definitions_utils_1.argAtoms)(args[2]), notation, options);
    }
});
(0, definitions_utils_1.defineFunction)('cancel', '{body:auto}', {
    createAtom: function (options) {
        var _a;
        return new enclose_1.EncloseAtom(options.command, (0, definitions_utils_1.argAtoms)(options.args[0]), { updiagonalstrike: true }, {
            strokeColor: 'currentColor',
            strokeWidth: '',
            strokeStyle: 'solid',
            borderStyle: '1px solid currentColor',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'none',
            style: (_a = options.style) !== null && _a !== void 0 ? _a : {}
        });
    }
});
(0, definitions_utils_1.defineFunction)('bcancel', '{body:auto}', {
    createAtom: function (options) {
        var _a;
        return new enclose_1.EncloseAtom(options.command, (0, definitions_utils_1.argAtoms)(options.args[0]), { downdiagonalstrike: true }, {
            strokeColor: 'currentColor',
            strokeWidth: '',
            strokeStyle: 'solid',
            borderStyle: '1px solid currentColor',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'none',
            style: (_a = options.style) !== null && _a !== void 0 ? _a : {}
        });
    }
});
(0, definitions_utils_1.defineFunction)('xcancel', '{body:auto}', {
    createAtom: function (options) {
        var _a;
        return new enclose_1.EncloseAtom(options.command, (0, definitions_utils_1.argAtoms)(options.args[0]), { updiagonalstrike: true, downdiagonalstrike: true }, {
            strokeColor: 'currentColor',
            strokeWidth: '',
            strokeStyle: 'solid',
            borderStyle: '1px solid currentColor',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'none',
            style: (_a = options.style) !== null && _a !== void 0 ? _a : {}
        });
    }
});
