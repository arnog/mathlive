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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.fromJson = void 0;
var types_1 = require("../common/types");
var atom_class_1 = require("./atom-class");
var accent_1 = require("../atoms/accent");
var array_1 = require("../atoms/array");
var box_1 = require("../atoms/box");
var composition_1 = require("../atoms/composition");
var mhchem_1 = require("../latex-commands/mhchem");
var delim_1 = require("../atoms/delim");
var enclose_1 = require("../atoms/enclose");
var error_1 = require("../atoms/error");
var genfrac_1 = require("../atoms/genfrac");
var group_1 = require("../atoms/group");
var latex_1 = require("../atoms/latex");
var leftright_1 = require("../atoms/leftright");
var macro_1 = require("../atoms/macro");
var extensible_symbol_1 = require("../atoms/extensible-symbol");
var overlap_1 = require("../atoms/overlap");
var overunder_1 = require("../atoms/overunder");
var placeholder_1 = require("../atoms/placeholder");
var phantom_1 = require("../atoms/phantom");
var delim_2 = require("../atoms/delim");
var spacing_1 = require("../atoms/spacing");
var subsup_1 = require("../atoms/subsup");
var surd_1 = require("../atoms/surd");
var text_1 = require("../atoms/text");
var tooltip_1 = require("../atoms/tooltip");
var prompt_1 = require("../atoms/prompt");
var operator_1 = require("../atoms/operator");
__exportStar(require("./atom-class"), exports);
function fromJson(json) {
    if ((0, types_1.isArray)(json))
        return json.map(function (x) { return fromJson(x); });
    if (typeof json === 'string')
        return atom_class_1.Atom.fromJson(json);
    json = __assign({}, json);
    // Restore the branches
    for (var _i = 0, NAMED_BRANCHES_1 = atom_class_1.NAMED_BRANCHES; _i < NAMED_BRANCHES_1.length; _i++) {
        var branch = NAMED_BRANCHES_1[_i];
        if (json[branch])
            json[branch] = fromJson(json[branch]);
    }
    if (json.args)
        json.args = argumentsFromJson(json.args);
    if (json.array)
        json.array = fromJson(json.array);
    var type = json.type;
    var result = undefined;
    if (type === 'accent')
        result = accent_1.AccentAtom.fromJson(json);
    if (type === 'array')
        result = array_1.ArrayAtom.fromJson(json);
    if (type === 'box')
        result = box_1.BoxAtom.fromJson(json);
    if (type === 'chem')
        result = mhchem_1.ChemAtom.fromJson(json);
    if (type === 'composition')
        result = composition_1.CompositionAtom.fromJson(json);
    if (type === 'delim')
        result = delim_1.MiddleDelimAtom.fromJson(json);
    if (type === 'enclose')
        result = enclose_1.EncloseAtom.fromJson(json);
    if (type === 'error')
        result = error_1.ErrorAtom.fromJson(json);
    if (type === 'extensible-symbol')
        result = extensible_symbol_1.ExtensibleSymbolAtom.fromJson(json);
    if (type === 'genfrac')
        result = genfrac_1.GenfracAtom.fromJson(json);
    if (type === 'group')
        result = group_1.GroupAtom.fromJson(json);
    if (type === 'latex')
        result = latex_1.LatexAtom.fromJson(json);
    if (type === 'latexgroup')
        result = latex_1.LatexGroupAtom.fromJson(json);
    if (type === 'leftright')
        result = leftright_1.LeftRightAtom.fromJson(json);
    if (type === 'macro')
        result = macro_1.MacroAtom.fromJson(json);
    if (type === 'macro-argument')
        result = macro_1.MacroArgumentAtom.fromJson(json);
    if (type === 'operator')
        result = operator_1.OperatorAtom.fromJson(json);
    if (type === 'overlap')
        result = overlap_1.OverlapAtom.fromJson(json);
    if (type === 'overunder')
        result = overunder_1.OverunderAtom.fromJson(json);
    if (type === 'placeholder')
        result = placeholder_1.PlaceholderAtom.fromJson(json);
    if (type === 'prompt')
        result = prompt_1.PromptAtom.fromJson(json);
    if (type === 'phantom')
        result = phantom_1.PhantomAtom.fromJson(json);
    if (type === 'sizeddelim')
        result = delim_2.SizedDelimAtom.fromJson(json);
    if (type === 'spacing')
        result = spacing_1.SpacingAtom.fromJson(json);
    if (type === 'subsup')
        result = subsup_1.SubsupAtom.fromJson(json);
    if (type === 'surd')
        result = surd_1.SurdAtom.fromJson(json);
    if (type === 'text')
        result = text_1.TextAtom.fromJson(json);
    if (type === 'tooltip')
        result = tooltip_1.TooltipAtom.fromJson(json);
    // @todo root;
    // @todo space;
    if (!result) {
        console.assert(!type ||
            [
                'first',
                'mbin',
                'mrel',
                'mclose',
                'minner',
                'mop',
                'mopen',
                'mord',
                'mpunct',
                'root',
                'space',
            ].includes(type), "MathLive {{SDK_VERSION}}: an unexpected atom type \"".concat(type, "\" was encountered. Add new atom constructors to `fromJson()` in \"atom.ts\""));
        result = atom_class_1.Atom.fromJson(json);
    }
    for (var _a = 0, NAMED_BRANCHES_2 = atom_class_1.NAMED_BRANCHES; _a < NAMED_BRANCHES_2.length; _a++) {
        var branch = NAMED_BRANCHES_2[_a];
        if (json[branch])
            result.setChildren(json[branch], branch);
    }
    // Restore properties
    if (json.verbatimLatex !== undefined)
        result.verbatimLatex = json.verbatimLatex;
    if (json.subsupPlacement)
        result.subsupPlacement = json.subsupPlacement;
    if (json.explicitSubsupPlacement)
        result.explicitSubsupPlacement = true;
    if (json.isFunction)
        result.isFunction = true;
    if (json.skipBoundary)
        result.skipBoundary = true;
    if (json.captureSelection)
        result.captureSelection = true;
    return result;
}
exports.fromJson = fromJson;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function argumentsFromJson(json) {
    if (!json)
        return undefined;
    if (!Array.isArray(json))
        return undefined;
    return json.map(function (arg) {
        if (arg === '<null>')
            return null;
        if (typeof arg === 'object' && 'group' in arg)
            return { group: arg.group.map(function (x) { return fromJson(x); }) };
        if (typeof arg === 'object' && 'atoms' in arg)
            return arg.atoms.map(function (x) { return fromJson(x); });
        return arg;
    });
}
