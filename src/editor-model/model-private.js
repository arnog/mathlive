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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports._Model = void 0;
var atom_class_1 = require("../core/atom-class");
var tokenizer_1 = require("../core/tokenizer");
var atom_1 = require("../core/atom");
var atom_to_math_ml_1 = require("../formats/atom-to-math-ml");
var atom_to_ascii_math_1 = require("../formats/atom-to-ascii-math");
var atom_to_speakable_text_1 = require("../formats/atom-to-speakable-text");
var a11y_1 = require("../editor/a11y");
var selection_utils_1 = require("./selection-utils");
var latex_1 = require("../atoms/latex");
var mathfield_proxy_1 = require("virtual-keyboard/mathfield-proxy");
require("../virtual-keyboard/global");
var utils_1 = require("../editor-mathfield/utils");
/** @internal */
var _Model = /** @class */ (function () {
    function _Model(target, mode, root) {
        this.mathfield = target;
        this.mode = mode;
        this.silenceNotifications = false;
        this._selection = { ranges: [[0, 0]], direction: 'none' };
        this._anchor = 0;
        this._position = 0;
        this.root = root;
    }
    _Model.prototype.dispose = function () {
        this.mathfield = undefined;
    };
    _Model.prototype.getState = function () {
        var selection = { ranges: __spreadArray([], this._selection.ranges, true) };
        if (this.selection.direction && this.selection.direction !== 'none')
            selection.direction = this.selection.direction;
        return {
            content: this.root.toJson(),
            selection: selection,
            mode: this.mode
        };
    };
    _Model.prototype.setState = function (state, options) {
        var _a;
        var wasSuppressing = this.silenceNotifications;
        this.silenceNotifications = (_a = options === null || options === void 0 ? void 0 : options.silenceNotifications) !== null && _a !== void 0 ? _a : true;
        var changeOption = {};
        if ((options === null || options === void 0 ? void 0 : options.type) === 'undo')
            changeOption = { inputType: 'historyUndo' };
        if ((options === null || options === void 0 ? void 0 : options.type) === 'redo')
            changeOption = { inputType: 'historyRedo' };
        // Restore the content and selection
        if (this.contentWillChange(changeOption)) {
            var didSuppress = this.silenceNotifications;
            this.silenceNotifications = true;
            this.mode = state.mode;
            this.root = (0, atom_1.fromJson)(state.content);
            this.selection = state.selection;
            this.silenceNotifications = didSuppress;
            this.contentDidChange(changeOption);
            this.selectionDidChange();
        }
        this.silenceNotifications = wasSuppressing;
    };
    Object.defineProperty(_Model.prototype, "atoms", {
        get: function () {
            return this.root.children;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Model.prototype, "selection", {
        /**
         * The selection, accounting for the common ancestors
         */
        get: function () {
            return this._selection;
        },
        set: function (value) {
            this.setSelection(value);
        },
        enumerable: false,
        configurable: true
    });
    _Model.prototype.setSelection = function (arg1, arg2) {
        var _this = this;
        if (!this.mathfield.contentEditable && this.mathfield.userSelect === 'none')
            return false;
        // Note: a side effect of changing the selection may be to change the
        // content: for example when exiting LaTeX mode, so dispatch the
        // content change as well
        return this.deferNotifications({ selection: true, content: true }, function () {
            var _a, _b, _c;
            //
            // 1/ Normalize the input
            // (account for offset < 0, etc...)
            //
            var value = _this.normalizeSelection(arg1, arg2);
            if (value === undefined)
                throw new TypeError('Invalid selection');
            //
            // 2/ Short-circuit a common case...
            //
            if (value.ranges.length === 1 &&
                value.ranges[0][0] === value.ranges[0][1]) {
                var pos = value.ranges[0][0];
                // Are we attempting to set the caret outside a prompt
                // (while in prompt mode)?
                if (!_this.mathfield.dirty &&
                    !((_a = _this.at(pos)) === null || _a === void 0 ? void 0 : _a.parentPrompt) &&
                    _this.mathfield.hasEditablePrompts) {
                    if ((_b = _this.at(pos - 1)) === null || _b === void 0 ? void 0 : _b.parentPrompt) {
                        _this._anchor = _this.normalizeOffset(pos - 1);
                        _this._position = _this._anchor;
                        _this._selection = _this.normalizeSelection(_this._anchor);
                        return;
                    }
                    if ((_c = _this.at(pos + 1)) === null || _c === void 0 ? void 0 : _c.parentPrompt) {
                        _this._anchor = _this.normalizeOffset(pos + 1);
                        _this._position = _this._anchor;
                        _this._selection = _this.normalizeSelection(_this._anchor);
                        return;
                    }
                    _this._anchor = 0;
                    _this._position = 0;
                    _this._selection = { ranges: [[0, 0]] };
                    return;
                }
                _this._anchor = pos;
                _this._position = pos;
                _this._selection = value;
                return;
            }
            //
            // 2b/ Determine the anchor and position
            // (smallest, largest offsets, oriented as per `direction`)
            //
            var selRange = (0, selection_utils_1.range)(value);
            if (value.direction === 'backward')
                _this._position = selRange[0], _this._anchor = selRange[1];
            else
                _this._anchor = selRange[0], _this._position = selRange[1];
            var first = _this.at(selRange[0] + 1);
            var last = _this.at(selRange[1]);
            var commonAncestor = atom_class_1.Atom.commonAncestor(first, last);
            if ((commonAncestor === null || commonAncestor === void 0 ? void 0 : commonAncestor.type) === 'array' &&
                first.parent === commonAncestor &&
                last.parent === commonAncestor) {
                // 3a/ If the parent of all the ranges is an array...
                // Make a rectangular selection based on the col/row of the anchor
                // and cursor
                // @todo array
                _this._selection = { ranges: [selRange], direction: value.direction };
            }
            else
                _this._selection = { ranges: [selRange], direction: value.direction };
            console.assert(_this._position >= 0 && _this._position <= _this.lastOffset);
            return;
        });
    };
    _Model.prototype.setPositionHandlingPlaceholder = function (pos) {
        var _a;
        var atom = this.at(pos);
        if ((atom === null || atom === void 0 ? void 0 : atom.type) === 'placeholder') {
            // We're going right of a placeholder: select it
            this.setSelection(pos - 1, pos);
        }
        else if (((_a = atom === null || atom === void 0 ? void 0 : atom.rightSibling) === null || _a === void 0 ? void 0 : _a.type) === 'placeholder') {
            // We're going left of a placeholder: select it
            this.setSelection(pos, pos + 1);
        }
        else
            this.position = pos;
        if (atom instanceof latex_1.LatexAtom && atom.isSuggestion)
            atom.isSuggestion = false;
        this.mathfield.stopCoalescingUndo();
    };
    Object.defineProperty(_Model.prototype, "position", {
        /**
         * The "focus" or "cursor" (i.e. not the anchor) a.k.a the insertion point
         * or caret: where things are going to be inserted next.
         *
         */
        get: function () {
            return this._position;
        },
        set: function (value) {
            this.setSelection(value, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Model.prototype, "anchor", {
        /**
         * The offset from which the selection is extended
         */
        get: function () {
            return this._anchor;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Model.prototype, "selectionIsCollapsed", {
        get: function () {
            return this._anchor === this._position;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Model.prototype, "selectionIsPlaceholder", {
        get: function () {
            if (Math.abs(this._anchor - this._position) === 1) {
                return (this.at(Math.max(this._anchor, this._position)).type === 'placeholder');
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    _Model.prototype.collapseSelection = function (direction) {
        if (direction === void 0) { direction = 'forward'; }
        if (this._anchor === this._position)
            return false;
        if (direction === 'backward')
            this.position = Math.min(this._anchor, this._position);
        else
            this.position = Math.max(this._anchor, this._position);
        return true;
    };
    Object.defineProperty(_Model.prototype, "lastOffset", {
        get: function () {
            return this.atoms.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    _Model.prototype.at = function (index) {
        return this.atoms[index];
    };
    _Model.prototype.offsetOf = function (atom) {
        return this.atoms.indexOf(atom);
    };
    _Model.prototype.getSiblingsRange = function (offset) {
        var atom = this.at(offset);
        var parent = atom.parent;
        if (!parent)
            return [0, this.lastOffset];
        var branch = atom.parent.branch(atom.parentBranch);
        return [this.offsetOf(branch[0]), this.offsetOf(branch[branch.length - 1])];
    };
    _Model.prototype.getBranchRange = function (offset, branchName) {
        var branch = this.at(offset).branch(branchName);
        return [this.offsetOf(branch[0]), this.offsetOf(branch[branch.length - 1])];
    };
    _Model.prototype.getAtoms = function (arg1, arg2, arg3) {
        var _this = this;
        var _a, _b;
        var options = arg3 !== null && arg3 !== void 0 ? arg3 : {};
        if ((0, selection_utils_1.isSelection)(arg1)) {
            options = (_a = arg2) !== null && _a !== void 0 ? _a : {};
            if (arg1.ranges.length > 1) {
                return arg1.ranges.reduce(function (acc, range) { return __spreadArray(__spreadArray([], acc, true), _this.getAtoms(range, options), true); }, []);
            }
            arg1 = arg1.ranges[0];
        }
        var start;
        var end;
        if ((0, selection_utils_1.isOffset)(arg1)) {
            start = arg1;
            if (!(0, selection_utils_1.isOffset)(arg2))
                return [];
            end = arg2;
        }
        else {
            start = arg1[0], end = arg1[1];
            options = (_b = arg2) !== null && _b !== void 0 ? _b : {};
        }
        if (!Number.isFinite(start))
            return [];
        if (options.includeChildren === undefined)
            options.includeChildren = false;
        if (start < 0)
            start = this.lastOffset - start + 1;
        if (end < 0)
            end = this.lastOffset + end + 1;
        var first = Math.min(start, end) + 1;
        var last = Math.max(start, end);
        // If this is the entire selection, return the root
        if (!options.includeChildren && first === 1 && last === this.lastOffset)
            return [this.root];
        var result = [];
        for (var i = first; i <= last; i++) {
            var atom = this.atoms[i];
            if (atomIsInRange(this, atom, first, last))
                result.push(atom);
        }
        if (!options.includeChildren) {
            // Remove any atoms whose ancestor is also included
            result = result.filter(function (atom) {
                var ancestorIncluded = false;
                var parent = atom.parent;
                while (parent && !ancestorIncluded) {
                    ancestorIncluded = atomIsInRange(_this, parent, first, last);
                    parent = parent.parent;
                }
                return !ancestorIncluded;
            });
        }
        return result;
    };
    /**
     * Unlike `getAtoms()`, the argument here is an index
     * Return all the atoms, in order, starting at startingIndex
     * then looping back at the beginning
     */
    _Model.prototype.getAllAtoms = function (startingIndex) {
        if (startingIndex === void 0) { startingIndex = 0; }
        var result = [];
        var last = this.lastOffset;
        for (var i = startingIndex; i <= last; i++)
            result.push(this.atoms[i]);
        for (var i = 0; i < startingIndex; i++)
            result.push(this.atoms[i]);
        return result;
    };
    _Model.prototype.findAtom = function (filter, startingIndex, direction) {
        if (startingIndex === void 0) { startingIndex = 0; }
        if (direction === void 0) { direction = 'forward'; }
        var atom = undefined;
        var last = this.lastOffset;
        if (direction === 'forward') {
            for (var i = startingIndex; i <= last; i++) {
                atom = this.atoms[i];
                if (filter(atom))
                    return atom;
            }
            for (var i = 0; i < startingIndex; i++) {
                atom = this.atoms[i];
                if (filter(atom))
                    return atom;
            }
            return undefined;
        }
        for (var i = startingIndex; i >= 0; i--) {
            atom = this.atoms[i];
            if (filter(atom))
                return atom;
        }
        for (var i = last; i > startingIndex; i--) {
            atom = this.atoms[i];
            if (filter(atom))
                return atom;
        }
        return undefined;
    };
    /** Remove the specified atoms from the tree.
     * **WARNING** upon return the selection may now be invalid
     */
    _Model.prototype.extractAtoms = function (range) {
        var result = this.getAtoms(range);
        if (result.length === 1 && !result[0].parent) {
            // We're trying to extract the root.
            // Don't actually delete the root, delete all the children of the root.
            if (result[0].type === 'root') {
                result = __spreadArray([], result[0].body, true);
                result.shift();
            }
            else {
                // If the root is an array, replace with a plain root
                result = this.root.cells.flat();
                this.root = new atom_class_1.Atom({ type: 'root', body: [] });
                return result;
            }
        }
        for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
            var child = result_1[_i];
            child.parent.removeChild(child);
        }
        return result;
    };
    _Model.prototype.deleteAtoms = function (range) {
        range !== null && range !== void 0 ? range : (range = [0, -1]);
        this.extractAtoms(range);
        this.position = range[0];
    };
    _Model.prototype.atomToString = function (atom, inFormat) {
        var format = inFormat !== null && inFormat !== void 0 ? inFormat : 'latex';
        if (format.startsWith('latex')) {
            return atom_class_1.Atom.serialize([atom], {
                expandMacro: format === 'latex-expanded',
                skipStyles: format === 'latex-unstyled',
                skipPlaceholders: format === 'latex-without-placeholders',
                defaultMode: this.mathfield.options.defaultMode
            });
        }
        if (format === 'math-ml')
            return (0, atom_to_math_ml_1.toMathML)(atom);
        if (format === 'spoken')
            return (0, atom_to_speakable_text_1.atomToSpeakableText)(atom);
        if (format === 'spoken-text') {
            var saveTextToSpeechMarkup = globalThis.MathfieldElement.textToSpeechMarkup;
            globalThis.MathfieldElement.textToSpeechMarkup = '';
            var result = (0, atom_to_speakable_text_1.atomToSpeakableText)(atom);
            globalThis.MathfieldElement.textToSpeechMarkup = saveTextToSpeechMarkup;
            return result;
        }
        if (format === 'spoken-ssml' ||
            format === 'spoken-ssml-with-highlighting') {
            var saveTextToSpeechMarkup = globalThis.MathfieldElement.textToSpeechMarkup;
            // Const savedAtomIdsSettings = this.config.atomIdsSettings;    // @revisit
            globalThis.MathfieldElement.textToSpeechMarkup = 'ssml';
            // If (format === 'spoken-ssml-with-highlighting') {     // @revisit
            //     this.config.atomIdsSettings = { seed: 'random' };
            // }
            var result = (0, atom_to_speakable_text_1.atomToSpeakableText)(atom);
            globalThis.MathfieldElement.textToSpeechMarkup = saveTextToSpeechMarkup;
            // This.config.atomIdsSettings = savedAtomIdsSettings;      // @revisit
            return result;
        }
        if (format === 'plain-text')
            return (0, atom_to_ascii_math_1.atomToAsciiMath)(atom, { plain: true });
        if (format === 'ascii-math')
            return (0, atom_to_ascii_math_1.atomToAsciiMath)(atom);
        console.error("MathLive {{SDK_VERSION}}: Unexpected format \"".concat(format));
        return '';
    };
    _Model.prototype.getValue = function (arg1, arg2, arg3) {
        var _this = this;
        // GetValue()
        if (arg1 === undefined)
            return this.atomToString(this.root, 'latex');
        // GetValue(format): Output format only
        if (typeof arg1 === 'string' && arg1 !== 'math-json')
            return this.atomToString(this.root, arg1);
        var ranges;
        var format;
        if ((0, selection_utils_1.isOffset)(arg1) && (0, selection_utils_1.isOffset)(arg2)) {
            ranges = [this.normalizeRange([arg1, arg2])];
            format = arg3;
        }
        else if ((0, selection_utils_1.isRange)(arg1)) {
            ranges = [this.normalizeRange(arg1)];
            format = arg2;
        }
        else if ((0, selection_utils_1.isSelection)(arg1)) {
            ranges = arg1.ranges;
            format = arg2;
        }
        else {
            ranges = [this.normalizeRange([0, -1])];
            format = arg1;
        }
        format !== null && format !== void 0 ? format : (format = 'latex');
        if (format === 'math-json') {
            if (!globalThis.MathfieldElement.computeEngine) {
                if (!window[Symbol["for"]('io.cortexjs.compute-engine')]) {
                    console.error('The CortexJS Compute Engine library is not available.\nLoad the library, for example with:\nimport "https://unpkg.com/@cortex-js/compute-engine?module"');
                }
                return '["Error", "compute-engine-not-available"]';
            }
            var latex = this.getValue({ ranges: ranges }, 'latex-unstyled');
            try {
                var expr = globalThis.MathfieldElement.computeEngine.parse(latex);
                return JSON.stringify(expr.json);
            }
            catch (e) {
                return JSON.stringify(['Error', "'".concat(e.toString(), "'")]);
            }
        }
        if (format.startsWith('latex')) {
            var options_1 = {
                expandMacro: format === 'latex-expanded',
                skipStyles: format === 'latex-unstyled',
                skipPlaceholders: format === 'latex-without-placeholders',
                defaultMode: this.mathfield.options.defaultMode
            };
            return (0, tokenizer_1.joinLatex)(ranges.map(function (range) { return atom_class_1.Atom.serialize(_this.getAtoms(range), options_1); }));
        }
        return ranges
            .map(function (range) {
            return _this.getAtoms(range)
                .map(function (atom) { return _this.atomToString(atom, format); })
                .join('');
        })
            .join('');
    };
    /**
     * Unlike `setSelection`, this method is intended to be used in response
     * to a user action, and it performs various adjustments to result
     * in a more intuitive selection.
     * For example:
     * - when all the children of an atom are selected, the atom
     * become selected.
     * - this method will *not* change the anchor, but may result
     * in a selection whose boundary is outside the anchor
     */
    _Model.prototype.extendSelectionTo = function (anchor, position) {
        var _this = this;
        if (!this.mathfield.contentEditable && this.mathfield.userSelect === 'none')
            return false;
        return this.deferNotifications({ selection: true }, function () {
            var range = _this.normalizeRange([anchor, position]);
            var start = range[0], end = range[1];
            // Include the parent if all the children are selected
            var parent = _this.at(end).parent;
            if (parent) {
                if (parent.type === 'genfrac' || parent.type === 'subsup') {
                    while (parent !== _this.root &&
                        childrenInRange(_this, parent, [start, end])) {
                        end = _this.offsetOf(parent);
                        parent = parent.parent;
                    }
                }
            }
            parent = _this.at(start).parent;
            while (parent !== _this.root &&
                childrenInRange(_this, parent, [start, end])) {
                start = _this.offsetOf(parent.leftSibling);
                parent = parent.parent;
            }
            // Now that the start has potentially changed, check again
            // if end needs to be updated
            parent = _this.at(end).parent;
            if ((parent === null || parent === void 0 ? void 0 : parent.type) === 'genfrac') {
                while (parent !== _this.root &&
                    childrenInRange(_this, parent, [start, end])) {
                    end = _this.offsetOf(parent);
                    console.assert(end >= 0);
                    parent = parent.parent;
                }
            }
            _this._position = _this.normalizeOffset(position);
            _this._selection = {
                ranges: [[start, end]],
                direction: 'none'
            };
        });
    };
    /**
     * This method is called to provide feedback when using a screen reader
     * or other assistive device, for example when changing the selection or
     * moving the insertion point.
     *
     * It can also be used with the 'plonk' command to provide an audible
     * feedback when a command is not possible.
     *
     * This method should not be called from other methods of the model
     * (such as `setSelection`) as these methods can also be called
     * programmatically and a feedback in these case would be innapropriate,
     * however they should be called from functions called as a result of a user
     * action, such as the functions in `commands.ts`
     */
    _Model.prototype.announce = function (command, previousPosition, atoms) {
        var _a, _b;
        if (atoms === void 0) { atoms = []; }
        var success = (_b = (_a = this.mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('announce', {
            detail: { command: command, previousPosition: previousPosition, atoms: atoms },
            cancelable: true,
            bubbles: true,
            composed: true
        }))) !== null && _b !== void 0 ? _b : true;
        if (success)
            (0, a11y_1.defaultAnnounceHook)(this.mathfield, command, previousPosition, atoms);
    };
    // Suppress notification while scope is executed,
    // then notify of content change, and selection change (if actual change)
    _Model.prototype.deferNotifications = function (options, f) {
        var oldSelection = this._selection;
        var oldAnchor = this._anchor;
        var oldPosition = this._position;
        var saved = this.silenceNotifications;
        this.silenceNotifications = true;
        var previousCounter = this.root.changeCounter;
        f();
        this.silenceNotifications = saved;
        // If the selection has effectively changed, notify
        // Dispatch selectionChanged first, as it may affect the content
        // for example when exiting LaTeX mode.
        var selectionChanged = oldAnchor !== this._anchor ||
            oldPosition !== this._position ||
            (0, selection_utils_1.compareSelection)(this._selection, oldSelection) === 'different';
        if (options.selection && selectionChanged)
            this.selectionDidChange();
        // Notify of content change, if requested
        var contentChanged = this.root.changeCounter !== previousCounter;
        if (options.content && contentChanged)
            this.contentDidChange({ inputType: options.type });
        return contentChanged || selectionChanged;
    };
    _Model.prototype.normalizeOffset = function (value) {
        if (value > 0)
            value = Math.min(value, this.lastOffset);
        else if (value < 0)
            value = this.lastOffset + value + 1;
        return value;
    };
    /**
     * Ensure that the range is valid and canonical, i.e.
     * - start <= end
     * - collapsed = start === end
     * - start >= 0, end >=0
     */
    _Model.prototype.normalizeRange = function (range) {
        // 1. Normalize the offsets
        var start = range[0], end = range[1];
        start = this.normalizeOffset(start);
        end = this.normalizeOffset(end);
        return start < end ? [start, end] : [end, start];
    };
    _Model.prototype.normalizeSelection = function (value, value2) {
        var _this = this;
        var _a;
        var result = undefined;
        if ((0, selection_utils_1.isOffset)(value)) {
            var offset = this.normalizeOffset(value);
            if ((0, selection_utils_1.isOffset)(value2)) {
                var offset2 = this.normalizeOffset(value2);
                result =
                    offset <= offset2
                        ? { ranges: [[offset, offset2]], direction: 'none' }
                        : {
                            ranges: [[offset2, offset]],
                            direction: 'backward'
                        };
            }
            else
                result = { ranges: [[offset, offset]], direction: 'none' };
        }
        else if ((0, selection_utils_1.isRange)(value)) {
            var start = this.normalizeOffset(value[0]);
            var end = this.normalizeOffset(value[1]);
            result =
                start <= end
                    ? { ranges: [[start, end]], direction: 'none' }
                    : { ranges: [[end, start]], direction: 'backward' };
        }
        else if ((0, selection_utils_1.isSelection)(value)) {
            result = {
                ranges: value.ranges.map(function (x) { return _this.normalizeRange(x); }),
                direction: (_a = value.direction) !== null && _a !== void 0 ? _a : 'none'
            };
        }
        console.assert(result !== undefined);
        return result;
    };
    Object.defineProperty(_Model.prototype, "parentEnvironment", {
        /** Returns the first ArrayAtom in ancestry of current position */
        get: function () {
            var parent = this.at(this.position).parent;
            if (!parent)
                return undefined;
            while (parent.parent && parent.type !== 'array')
                parent = parent.parent;
            if (parent.type !== 'array')
                return undefined;
            return parent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Model.prototype, "cell", {
        /** Return the cell (row, col) that the current selection is in */
        get: function () {
            var _a;
            var atom = this.at(this.position);
            if (!atom)
                return undefined;
            while (atom && ((_a = atom.parent) === null || _a === void 0 ? void 0 : _a.type) !== 'array')
                atom = atom.parent;
            if (!(atom === null || atom === void 0 ? void 0 : atom.parent) || atom.parent.type !== 'array')
                return undefined;
            return atom.parentBranch;
        },
        enumerable: false,
        configurable: true
    });
    _Model.prototype.contentWillChange = function (options) {
        if (options === void 0) { options = {}; }
        // The mathfield could be undefined if the mathfield was disposed
        // while the content was changing
        if (this.silenceNotifications || !this.mathfield)
            return true;
        var save = this.silenceNotifications;
        this.silenceNotifications = true;
        var result = this.mathfield.onContentWillChange(options);
        this.silenceNotifications = save;
        return result;
    };
    _Model.prototype.contentDidChange = function (options) {
        var _this = this;
        if (window.mathVirtualKeyboard.visible)
            window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(this.mathfield));
        if (this.silenceNotifications || !this.mathfield.host || !this.mathfield)
            return;
        var save = this.silenceNotifications;
        this.silenceNotifications = true;
        // In a textarea field, the 'input' event is fired after the keydown
        // event. However, in our case we're inside the 'keydown' event handler
        // so we need to 'defer' the 'input' event to the next event loop
        // iteration.
        setTimeout(function () {
            var _a;
            if (!_this.mathfield ||
                !(0, utils_1.isValidMathfield)(_this.mathfield) ||
                !_this.mathfield.host)
                return;
            _this.mathfield.host.dispatchEvent(new InputEvent('input', __assign(__assign({}, options), { 
                // To work around a bug in WebKit/Safari (the inputType property gets stripped), include the inputType as the 'data' property. (see #1843)
                data: options.data ? options.data : (_a = options.inputType) !== null && _a !== void 0 ? _a : '', bubbles: true, composed: true })));
        }, 0);
        this.silenceNotifications = save;
    };
    _Model.prototype.selectionDidChange = function () {
        // The mathfield could be undefined if the mathfield was disposed
        // while the selection was changing
        if (!this.mathfield)
            return;
        if (window.mathVirtualKeyboard.visible)
            window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(this.mathfield));
        if (this.silenceNotifications)
            return;
        var save = this.silenceNotifications;
        this.silenceNotifications = true;
        this.mathfield.onSelectionDidChange();
        this.silenceNotifications = save;
    };
    return _Model;
}());
exports._Model = _Model;
function atomIsInRange(model, atom, first, last) {
    var offset = model.offsetOf(atom);
    if (offset < first || offset > last)
        return false;
    if (!atom.hasChildren)
        return true;
    var firstOffset = model.offsetOf(atom.firstChild);
    if (firstOffset >= first && firstOffset <= last) {
        var lastOffset = model.offsetOf(atom.lastChild);
        if (lastOffset >= first && lastOffset <= last)
            return true;
    }
    return false;
}
function childrenInRange(model, atom, range) {
    if (!(atom === null || atom === void 0 ? void 0 : atom.hasChildren))
        return false;
    var start = range[0], end = range[1];
    var first = model.offsetOf(atom.firstChild);
    var last = model.offsetOf(atom.lastChild);
    if (first >= start && first <= end && last >= first && last <= end)
        return true;
    return false;
}
