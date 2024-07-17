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
exports.Atom = exports.isCellBranch = exports.isNamedBranch = exports.NAMED_BRANCHES = void 0;
var font_metrics_1 = require("./font-metrics");
var box_1 = require("./box");
var v_box_1 = require("./v-box");
var tokenizer_1 = require("./tokenizer");
var modes_utils_1 = require("./modes-utils");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var context_1 = require("./context");
/**
 * The order of these branches specify the default keyboard navigation order.
 * It can be overriden in `get children()`
 */
exports.NAMED_BRANCHES = [
    'body',
    'above',
    'below',
    'superscript',
    'subscript',
];
/**
 * A _branch_ is a set of children of an atom.
 *
 * There are two kind of branches:
 * - **cell branches** are addressed with a column and row number and are
 * used by `ArrayAtom`
 * - **named branches** used with other kind of atoms. There is a fixed set of
 * possible named branches.
 */
function isNamedBranch(branch) {
    return typeof branch === 'string' && exports.NAMED_BRANCHES.includes(branch);
}
exports.isNamedBranch = isNamedBranch;
function isCellBranch(branch) {
    return branch !== undefined && Array.isArray(branch) && branch.length === 2;
}
exports.isCellBranch = isCellBranch;
/**
 * An atom is an object encapsulating an elementary mathematical unit,
 * independent of its graphical representation.
 *
 * It keeps track of the content, while the dimensions, position and style
 * are tracked by Box objects which are created by the `createBox()` function.
 */
var Atom = /** @class */ (function () {
    function Atom(options) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.type = options.type;
        if (typeof options.value === 'string')
            this.value = options.value;
        this.command = (_b = (_a = options.command) !== null && _a !== void 0 ? _a : this.value) !== null && _b !== void 0 ? _b : '';
        this.mode = (_c = options.mode) !== null && _c !== void 0 ? _c : 'math';
        if (options.isFunction)
            this.isFunction = true;
        if (options.limits)
            this.subsupPlacement = options.limits;
        this.style = __assign({}, ((_d = options.style) !== null && _d !== void 0 ? _d : {}));
        this.displayContainsHighlight = (_e = options.displayContainsHighlight) !== null && _e !== void 0 ? _e : false;
        this.captureSelection = (_f = options.captureSelection) !== null && _f !== void 0 ? _f : false;
        this.skipBoundary = (_g = options.skipBoundary) !== null && _g !== void 0 ? _g : false;
        if (options.verbatimLatex !== undefined && options.verbatimLatex !== null)
            this.verbatimLatex = options.verbatimLatex;
        if (options.args)
            this.args = options.args;
        if (options.body)
            this.body = options.body;
        this._changeCounter = 0;
    }
    /**
     * Return a list of boxes equivalent to atoms.
     *
     * While an atom represent an abstract element (for example 'genfrac'),
     * a box corresponds to something to draw on screen (a character, a line,
     * etc...).
     *
     * @param context Font family, variant, size, color, and other info useful
     * to render an expression
     */
    Atom.createBox = function (context, atoms, options) {
        var _a;
        if (!atoms)
            return null;
        var runs = getStyleRuns(atoms);
        var boxes = [];
        for (var _i = 0, runs_1 = runs; _i < runs_1.length; _i++) {
            var run = runs_1[_i];
            var style = run[0].style;
            var box = renderStyleRun(context, run, {
                style: {
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    fontSize: style.fontSize
                }
            });
            if (box)
                boxes.push(box);
        }
        if (boxes.length === 0)
            return null;
        var classes = ((_a = options === null || options === void 0 ? void 0 : options.classes) !== null && _a !== void 0 ? _a : '').trim();
        if (boxes.length === 1 && !classes && !(options === null || options === void 0 ? void 0 : options.type))
            return boxes[0].wrap(context);
        return new box_1.Box(boxes, { classes: classes, type: options === null || options === void 0 ? void 0 : options.type }).wrap(context);
    };
    /**
     * Given an atom or an array of atoms, return a LaTeX string representation
     */
    Atom.serialize = function (value, options) {
        return modes_utils_1.Mode.serialize(value, options);
    };
    /**
     * The common ancestor between two atoms
     */
    Atom.commonAncestor = function (a, b) {
        if (a === b)
            return a.parent;
        // Short-circuit a common case
        if (a.parent === b.parent)
            return a.parent;
        // Accumulate all the parents of `a`
        var parents = new WeakSet();
        var parent = a.parent;
        while (parent) {
            parents.add(parent);
            parent = parent.parent;
        }
        // Walk up the parents of `b`. If a parent of `b` is also a parent of
        // `a`, it's the common ancestor
        parent = b.parent;
        while (parent) {
            if (parents.has(parent))
                return parent;
            parent = parent.parent;
        }
        console.assert(Boolean(parent)); // Never reached
        return undefined;
    };
    Atom.fromJson = function (json) {
        if (typeof json === 'string')
            return new Atom({ type: 'mord', value: json, mode: 'math' });
        return new Atom(json);
    };
    Atom.prototype.toJson = function () {
        if (this._json)
            return this._json;
        var result = {};
        if (this.type)
            result.type = this.type;
        if (this.mode !== 'math')
            result.mode = this.mode;
        if (this.command && this.command !== this.value)
            result.command = this.command;
        if (this.value !== undefined)
            result.value = this.value;
        if (this.style && Object.keys(this.style).length > 0)
            result.style = __assign({}, this.style);
        if (this.verbatimLatex !== undefined)
            result.verbatimLatex = this.verbatimLatex;
        if (this.subsupPlacement)
            result.subsupPlacement = this.subsupPlacement;
        if (this.explicitSubsupPlacement)
            result.explicitSubsupPlacement = true;
        if (this.isFunction)
            result.isFunction = true;
        if (this.displayContainsHighlight)
            result.displayContainsHighlight = true;
        if (this.skipBoundary)
            result.skipBoundary = true;
        if (this.captureSelection)
            result.captureSelection = true;
        if (this.args)
            result.args = argumentsToJson(this.args);
        if (this._branches) {
            for (var _i = 0, _a = Object.keys(this._branches); _i < _a.length; _i++) {
                var branch = _a[_i];
                if (this._branches[branch]) {
                    result[branch] = this._branches[branch].filter(function (x) { return x.type !== 'first'; }).map(function (x) { return x.toJson(); });
                }
            }
        }
        // If the result is only `{type: "mord", value="b"}`,
        // return a shortcut
        if (result.type === 'mord') {
            if (Object.keys(result).length === 2 && 'value' in result)
                return result.value;
        }
        this._json = result;
        return result;
    };
    Object.defineProperty(Atom.prototype, "changeCounter", {
        // Used to detect changes and send appropriate notifications
        get: function () {
            if (this.parent)
                return this.parent.changeCounter;
            return this._changeCounter;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "isDirty", {
        set: function (dirty) {
            if (!dirty)
                return;
            this._json = undefined;
            if (!this.parent)
                this._changeCounter++;
            if ('verbatimLatex' in this)
                this.verbatimLatex = undefined;
            this._children = undefined;
            if (this.parent)
                this.parent.isDirty = true;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Serialize the atom  to LaTeX.
     * Used internally by Mode: does not serialize styling. To serialize
     * one or more atoms, use `Atom.serialize()`
     */
    Atom.prototype._serialize = function (options) {
        // 1/ Verbatim LaTeX. This allow non-significant punctuation to be
        // preserved when possible.
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        // 2/ Custom serializer
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        // 3/ Command and body
        if (this.body && this.command) {
            return (0, tokenizer_1.joinLatex)([
                (0, tokenizer_1.latexCommand)(this.command, this.bodyToLatex(options)),
                this.supsubToLatex(options),
            ]);
        }
        // 4/ body with no command
        if (this.body) {
            return (0, tokenizer_1.joinLatex)([
                this.bodyToLatex(options),
                this.supsubToLatex(options),
            ]);
        }
        // 5/ A string value (which is a unicode character)
        if (!this.value || this.value === '\u200B')
            return '';
        return this.command;
    };
    Atom.prototype.bodyToLatex = function (options) {
        var _a;
        var defaultMode = (_a = options.defaultMode) !== null && _a !== void 0 ? _a : (this.mode === 'math' ? 'math' : 'text');
        return modes_utils_1.Mode.serialize(this.body, __assign(__assign({}, options), { defaultMode: defaultMode }));
    };
    Atom.prototype.aboveToLatex = function (options) {
        return modes_utils_1.Mode.serialize(this.above, options);
    };
    Atom.prototype.belowToLatex = function (options) {
        return modes_utils_1.Mode.serialize(this.below, options);
    };
    Atom.prototype.supsubToLatex = function (options) {
        var result = '';
        // Super/subscript are always in math mode
        options = __assign(__assign({}, options), { defaultMode: 'math' });
        if (this.branch('subscript') !== undefined) {
            var sub = modes_utils_1.Mode.serialize(this.subscript, options);
            if (sub.length === 0)
                result += '_{}';
            else if (sub.length === 1) {
                // Using the short form without braces is a stylistic choice
                // In general, LaTeX recommends the use of braces
                if (/^[0-9]$/.test(sub))
                    result += "_".concat(sub);
                else
                    result += "_{".concat(sub, "}");
            }
            else
                result += "_{".concat(sub, "}");
        }
        if (this.branch('superscript') !== undefined) {
            var sup = modes_utils_1.Mode.serialize(this.superscript, options);
            if (sup.length === 0)
                result += '^{}';
            else if (sup.length === 1) {
                if (sup === '\u2032')
                    result += '^\\prime ';
                else if (sup === '\u2033')
                    result += '^\\doubleprime ';
                // Using the short form without braces is a stylistic choice
                // In general, LaTeX recommends the use of braces
                else if (/^[0-9]$/.test(sup))
                    result += "^".concat(sup);
                else
                    result += "^{".concat(sup, "}");
            }
            else
                result += "^{".concat(sup, "}");
        }
        return result;
    };
    Object.defineProperty(Atom.prototype, "treeDepth", {
        get: function () {
            var result = 1;
            var atom = this.parent;
            while (atom) {
                atom = atom.parent;
                result += 1;
            }
            return result;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "inCaptureSelection", {
        get: function () {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var atom = this;
            while (atom) {
                if (atom.captureSelection)
                    return true;
                atom = atom.parent;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "parentPrompt", {
        /** Return the parent editable prompt, if it exists */
        get: function () {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var atom = this.parent;
            while (atom) {
                if (atom.type === 'prompt' && !atom.captureSelection)
                    return atom;
                atom = atom.parent;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Return the atoms in the branch, if it exists, otherwise null
     */
    Atom.prototype.branch = function (name) {
        if (!isNamedBranch(name))
            return undefined;
        if (!this._branches)
            return undefined;
        return this._branches[name];
    };
    Object.defineProperty(Atom.prototype, "branches", {
        /**
         * Return all the branches that exist.
         * Some of them may be empty.
         */
        get: function () {
            if (!this._branches)
                return [];
            var result = [];
            for (var _i = 0, NAMED_BRANCHES_1 = exports.NAMED_BRANCHES; _i < NAMED_BRANCHES_1.length; _i++) {
                var branch = NAMED_BRANCHES_1[_i];
                if (this._branches[branch])
                    result.push(branch);
            }
            return result;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Return the atoms in the branch, if it exists, otherwise create it.
     *
     * Return mutable array of atoms in the branch, since isDirty is
     * set to true
     */
    Atom.prototype.createBranch = function (name) {
        var _a;
        console.assert(isNamedBranch(name));
        if (!isNamedBranch(name))
            return [];
        if (!this._branches) {
            this._branches = (_a = {},
                _a[name] = [this.makeFirstAtom(name)],
                _a);
        }
        else if (!this._branches[name])
            this._branches[name] = [this.makeFirstAtom(name)];
        this.isDirty = true;
        return this._branches[name];
    };
    Object.defineProperty(Atom.prototype, "row", {
        get: function () {
            if (!isCellBranch(this.parentBranch))
                return -1;
            return this.parentBranch[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "col", {
        get: function () {
            if (!isCellBranch(this.parentBranch))
                return -1;
            return this.parentBranch[1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "body", {
        get: function () {
            var _a;
            return (_a = this._branches) === null || _a === void 0 ? void 0 : _a.body;
        },
        set: function (atoms) {
            this.setChildren(atoms, 'body');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "superscript", {
        get: function () {
            var _a;
            return (_a = this._branches) === null || _a === void 0 ? void 0 : _a.superscript;
        },
        set: function (atoms) {
            this.setChildren(atoms, 'superscript');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "subscript", {
        get: function () {
            var _a;
            return (_a = this._branches) === null || _a === void 0 ? void 0 : _a.subscript;
        },
        set: function (atoms) {
            this.setChildren(atoms, 'subscript');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "above", {
        get: function () {
            var _a;
            return (_a = this._branches) === null || _a === void 0 ? void 0 : _a.above;
        },
        set: function (atoms) {
            this.setChildren(atoms, 'above');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "below", {
        get: function () {
            var _a;
            return (_a = this._branches) === null || _a === void 0 ? void 0 : _a.below;
        },
        set: function (atoms) {
            this.setChildren(atoms, 'below');
        },
        enumerable: false,
        configurable: true
    });
    Atom.prototype.applyStyle = function (style) {
        this.isDirty = true;
        this.style = __assign(__assign({}, this.style), style);
        if (this.style.fontFamily === 'none')
            delete this.style.fontFamily;
        if (this.style.fontShape === 'auto')
            delete this.style.fontShape;
        if (this.style.fontSeries === 'auto')
            delete this.style.fontSeries;
        if (this.style.color === 'none') {
            delete this.style.color;
            delete this.style.verbatimColor;
        }
        if (this.style.backgroundColor === 'none') {
            delete this.style.backgroundColor;
            delete this.style.verbatimBackgroundColor;
        }
        if (this.style.fontSize === 'auto')
            delete this.style.fontSize;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.applyStyle(style);
        }
    };
    Atom.prototype.getInitialBaseElement = function () {
        var _a, _b, _c;
        if (this.hasEmptyBranch('body'))
            return this;
        console.assert(((_a = this.body) === null || _a === void 0 ? void 0 : _a[0].type) === 'first');
        return (_c = (_b = this.body[1]) === null || _b === void 0 ? void 0 : _b.getInitialBaseElement()) !== null && _c !== void 0 ? _c : this;
    };
    Atom.prototype.getFinalBaseElement = function () {
        if (this.hasEmptyBranch('body'))
            return this;
        return this.body[this.body.length - 1].getFinalBaseElement();
    };
    Atom.prototype.isCharacterBox = function () {
        if (this.type === 'leftright' ||
            this.type === 'genfrac' ||
            this.type === 'subsup' ||
            this.type === 'delim' ||
            this.type === 'array' ||
            this.type === 'surd')
            return false;
        return this.getFinalBaseElement().type === 'mord';
    };
    Atom.prototype.hasEmptyBranch = function (branch) {
        var atoms = this.branch(branch);
        if (!atoms)
            return true;
        console.assert(atoms.length > 0);
        console.assert(atoms[0].type === 'first');
        return atoms.length === 1;
    };
    /*
     * Setting `null` does nothing
     * Setting `[]` adds an empty list (the branch is created)
     * The children should *not* start with a `"first"` atom:
     * the `first` atom will be added if necessary
     */
    Atom.prototype.setChildren = function (children, branch) {
        var _a;
        var _b;
        if (!children)
            return;
        console.assert(isNamedBranch(branch));
        if (!isNamedBranch(branch))
            return;
        // Update the parent
        var newBranch = ((_b = children[0]) === null || _b === void 0 ? void 0 : _b.type) === 'first'
            ? __spreadArray([], children, true) : __spreadArray([this.makeFirstAtom(branch)], children, true);
        if (this._branches)
            this._branches[branch] = newBranch;
        else
            this._branches = (_a = {}, _a[branch] = newBranch, _a);
        // Update the children
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            child.parent = this;
            child.parentBranch = branch;
        }
        this.isDirty = true;
    };
    Atom.prototype.makeFirstAtom = function (branch) {
        var result = new Atom({ type: 'first', mode: this.mode });
        result.parent = this;
        result.parentBranch = branch;
        return result;
    };
    Atom.prototype.addChild = function (child, branch) {
        console.assert(child.type !== 'first');
        this.createBranch(branch).push(child);
        this.isDirty = true;
        // Update the child
        child.parent = this;
        child.parentBranch = branch;
    };
    Atom.prototype.addChildBefore = function (child, before) {
        console.assert(before.parentBranch !== undefined);
        var branch = this.createBranch(before.parentBranch);
        branch.splice(branch.indexOf(before), 0, child);
        this.isDirty = true;
        // Update the child
        child.parent = this;
        child.parentBranch = before.parentBranch;
    };
    Atom.prototype.addChildAfter = function (child, after) {
        console.assert(after.parentBranch !== undefined);
        var branch = this.createBranch(after.parentBranch);
        branch.splice(branch.indexOf(after) + 1, 0, child);
        this.isDirty = true;
        // Update the child
        child.parent = this;
        child.parentBranch = after.parentBranch;
    };
    Atom.prototype.addChildren = function (children, branchName) {
        var branch = this.createBranch(branchName);
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var child = children_2[_i];
            child.parent = this;
            child.parentBranch = branchName;
            branch.push(child);
        }
        this.isDirty = true;
    };
    /**
     * Return the last atom that was added
     */
    Atom.prototype.addChildrenAfter = function (children, after) {
        console.assert(children.length === 0 || children[0].type !== 'first');
        console.assert(after.parentBranch !== undefined);
        var branch = this.createBranch(after.parentBranch);
        branch.splice.apply(branch, __spreadArray([branch.indexOf(after) + 1, 0], children, false));
        this.isDirty = true;
        // Update the children
        for (var _i = 0, children_3 = children; _i < children_3.length; _i++) {
            var child = children_3[_i];
            child.parent = this;
            child.parentBranch = after.parentBranch;
        }
        return children[children.length - 1];
    };
    Atom.prototype.removeBranch = function (name) {
        var children = this.branch(name);
        if (isNamedBranch(name))
            this._branches[name] = undefined;
        if (!children)
            return [];
        for (var _i = 0, children_4 = children; _i < children_4.length; _i++) {
            var child = children_4[_i];
            child.parent = undefined;
            child.parentBranch = undefined;
        }
        // Drop the 'first' element
        console.assert(children[0].type === 'first');
        var _first = children[0], rest = children.slice(1);
        this.isDirty = true;
        return rest;
    };
    Atom.prototype.removeChild = function (child) {
        console.assert(child.parent === this);
        // `first` atom cannot be deleted
        if (child.type === 'first')
            return;
        // Update the parent
        var branch = this.branch(child.parentBranch);
        var index = branch.indexOf(child);
        console.assert(index >= 0);
        branch.splice(index, 1);
        this.isDirty = true;
        // Update the child
        child.parent = undefined;
        child.parentBranch = undefined;
    };
    Object.defineProperty(Atom.prototype, "siblings", {
        get: function () {
            if (!this.parent)
                return [];
            return this.parent.branch(this.parentBranch);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "firstSibling", {
        get: function () {
            return this.siblings[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "lastSibling", {
        get: function () {
            var siblings = this.siblings;
            return siblings[siblings.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "isFirstSibling", {
        get: function () {
            return this === this.firstSibling;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "isLastSibling", {
        get: function () {
            return this === this.lastSibling;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "hasNoSiblings", {
        get: function () {
            // There is always at least one sibling, the 'first'
            // atom, but we don't count it.
            return this.siblings.length === 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "leftSibling", {
        get: function () {
            console.assert(this.parent !== undefined);
            var siblings = this.parent.branch(this.parentBranch);
            return siblings[siblings.indexOf(this) - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "rightSibling", {
        get: function () {
            console.assert(this.parent !== undefined);
            var siblings = this.parent.branch(this.parentBranch);
            return siblings[siblings.indexOf(this) + 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "hasChildren", {
        get: function () {
            return Boolean(this._branches && this.children.length > 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "firstChild", {
        get: function () {
            console.assert(this.hasChildren);
            return this.children[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "lastChild", {
        get: function () {
            console.assert(this.hasChildren);
            var children = this.children;
            return children[children.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Atom.prototype, "children", {
        /**
         * All the children of this atom.
         *
         * The order of the atoms is the order in which they
         * are navigated using the keyboard.
         */
        get: function () {
            if (this._children)
                return this._children;
            if (!this._branches)
                return [];
            var result = [];
            for (var _i = 0, NAMED_BRANCHES_2 = exports.NAMED_BRANCHES; _i < NAMED_BRANCHES_2.length; _i++) {
                var branchName = NAMED_BRANCHES_2[_i];
                if (this._branches[branchName]) {
                    for (var _a = 0, _b = this._branches[branchName]; _a < _b.length; _a++) {
                        var x = _b[_a];
                        result.push.apply(result, x.children);
                        result.push(x);
                    }
                }
            }
            this._children = result;
            return result;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Render this atom as a box.
     *
     * The parent context (color, size...) will be applied
     * to the result.
     *
     */
    Atom.prototype.render = function (parentContext) {
        if (this.type === 'first' && !parentContext.atomIdsSettings)
            return null;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.render)
            return def.render(this, parentContext);
        //
        // 1. Render the body or value
        //
        var context = new context_1.Context({ parent: parentContext }, this.style);
        var result = this.createBox(context, {
            classes: !this.parent ? 'ML__base' : ''
        });
        if (!result)
            return null;
        //
        // 2. Render any attached superscript, subscripts
        //
        if (!this.subsupPlacement && (this.superscript || this.subscript)) {
            // If there is a `subsupPlacement`, the attachment of sup/sub was handled
            // in the atom decomposition (e.g. `mop`, `accent`)
            result = this.attachSupsub(context, { base: result });
        }
        return result.wrap(context);
    };
    Atom.prototype.attachSupsub = function (parentContext, options) {
        var _a;
        var base = options.base;
        var superscript = this.superscript;
        var subscript = this.subscript;
        // If no superscript or subscript, nothing to do.
        if (!superscript && !subscript)
            return base;
        // Superscript and subscripts are discussed in the TeXbook
        // on page 445-446, rules 18(a-f).
        // TeX:14859-14945
        var supBox = null;
        var subBox = null;
        var isCharacterBox = (_a = options.isCharacterBox) !== null && _a !== void 0 ? _a : this.isCharacterBox();
        // Rule 18a, p445
        var supShift = 0;
        if (superscript) {
            var context = new context_1.Context({
                parent: parentContext,
                mathstyle: 'superscript'
            });
            supBox = Atom.createBox(context, superscript);
            if (!isCharacterBox) {
                supShift =
                    base.height - parentContext.metrics.supDrop * context.scalingFactor;
            }
        }
        var subShift = 0;
        if (subscript) {
            var context = new context_1.Context({
                parent: parentContext,
                mathstyle: 'subscript'
            });
            subBox = Atom.createBox(context, subscript);
            if (!isCharacterBox) {
                subShift =
                    base.depth + parentContext.metrics.subDrop * context.scalingFactor;
            }
        }
        // Rule 18c, p445
        var minSupShift;
        if (parentContext.isDisplayStyle)
            minSupShift = parentContext.metrics.sup1; // Sigma13
        else if (parentContext.isCramped)
            minSupShift = parentContext.metrics.sup3; // Sigma15
        else
            minSupShift = parentContext.metrics.sup2; // Sigma14
        // Scriptspace is a font-size-independent size, so scale it
        // appropriately
        var scriptspace = 0.5 / font_metrics_1.PT_PER_EM / parentContext.scalingFactor;
        var supsub = null;
        if (subBox && supBox) {
            // Rule 18e
            supShift = Math.max(supShift, minSupShift, supBox.depth + 0.25 * parentContext.metrics.xHeight);
            subShift = Math.max(subShift, parentContext.metrics.sub2);
            var ruleWidth = parentContext.metrics.defaultRuleThickness;
            if (supShift - supBox.depth - (subBox.height - subShift) <
                4 * ruleWidth) {
                subShift = 4 * ruleWidth - (supShift - supBox.depth) + subBox.height;
                var psi = 0.8 * parentContext.metrics.xHeight - (supShift - supBox.depth);
                if (psi > 0) {
                    supShift += psi;
                    subShift -= psi;
                }
            }
            // Subscripts shouldn't be shifted by the nucleus' italic correction.
            // Account for that by shifting the subscript back the appropriate
            // amount. Note we only do this when the nucleus is a single symbol.
            var slant = this.type === 'extensible-symbol' && base.italic ? -base.italic : 0;
            supsub = new v_box_1.VBox({
                individualShift: [
                    { box: subBox, shift: subShift, marginLeft: slant },
                    { box: supBox, shift: -supShift },
                ]
            }).wrap(parentContext);
        }
        else if (subBox && !supBox) {
            // Rule 18b
            subShift = Math.max(subShift, parentContext.metrics.sub1, subBox.height - 0.8 * font_metrics_1.X_HEIGHT);
            supsub = new v_box_1.VBox({
                shift: subShift,
                children: [
                    {
                        box: subBox,
                        marginRight: scriptspace,
                        marginLeft: this.isCharacterBox() ? -base.italic : 0
                    },
                ]
            });
        }
        else if (!subBox && supBox) {
            // Rule 18c, d
            supShift = Math.max(supShift, minSupShift, supBox.depth + 0.25 * font_metrics_1.X_HEIGHT);
            supsub = new v_box_1.VBox({
                shift: -supShift,
                children: [{ box: supBox, marginRight: scriptspace }]
            });
        }
        // Display the caret *following* the superscript and subscript,
        // so attach the caret to the 'subsup' element.
        return new box_1.Box([
            base,
            new box_1.Box(supsub, {
                caret: this.caret,
                isSelected: this.isSelected,
                classes: 'ML__msubsup'
            }),
        ], { type: options.type });
    };
    Atom.prototype.attachLimits = function (ctx, options) {
        var above = this.superscript
            ? Atom.createBox(new context_1.Context({ parent: ctx, mathstyle: 'superscript' }, this.style), this.superscript)
            : null;
        var below = this.subscript
            ? Atom.createBox(new context_1.Context({ parent: ctx, mathstyle: 'subscript' }, this.style), this.subscript)
            : null;
        if (!above && !below)
            return options.base.wrap(ctx);
        return (0, v_box_1.makeLimitsStack)(ctx, __assign(__assign({}, options), { above: above, below: below }));
    };
    Atom.prototype.bind = function (context, box) {
        // Don't bind to phantom boxes or "empty" atoms (\u200b)
        // (they won't be interactive, so no need for the id)
        if (!box || context.isPhantom || this.value === '\u200B')
            return box;
        var parent = this.parent;
        while (parent && !parent.captureSelection)
            parent = parent.parent;
        if (parent === null || parent === void 0 ? void 0 : parent.captureSelection)
            return box;
        if (!this.id)
            this.id = context.makeID();
        box.atomID = this.id;
        return box;
    };
    /**
     * Create a box with the specified body.
     */
    Atom.prototype.createBox = function (context, options) {
        var _a, _b, _c, _d, _e;
        var value = (_a = this.value) !== null && _a !== void 0 ? _a : this.body;
        // Get the right BoxType for this atom type
        var type = (_b = options === null || options === void 0 ? void 0 : options.boxType) !== null && _b !== void 0 ? _b : (0, box_1.boxType)(this.type);
        // The font family is determined by:
        // - the base font family associated with this atom (optional). For example,
        // some atoms such as some functions ('\sin', '\cos', etc...) or some
        // symbols ('\Z') have an explicit font family. This overrides any
        // other font family
        // - the user-specified font family that has been explicitly applied to
        // this atom
        // - the font family determined automatically in math mode, for example
        // which italicizes some characters, but which can be overridden
        var classes = (_c = options === null || options === void 0 ? void 0 : options.classes) !== null && _c !== void 0 ? _c : '';
        if (this.mode === 'text')
            classes += ' ML__text';
        var result = typeof value === 'string' || value === undefined
            ? new box_1.Box((_d = value) !== null && _d !== void 0 ? _d : null, {
                type: type,
                isSelected: this.isSelected,
                mode: this.mode,
                maxFontSize: context.scalingFactor,
                style: __assign(__assign({ variant: 'normal' }, this.style), { fontSize: Math.max(1, context.size + context.mathstyle.sizeDelta) }),
                letterShapeStyle: context.letterShapeStyle,
                classes: classes
            })
            : (_e = Atom.createBox(context, value, { type: type, classes: classes })) !== null && _e !== void 0 ? _e : new box_1.Box(null);
        // Set other attributes
        if (context.isTight)
            result.isTight = true;
        // The italic correction applies only in math mode
        if (this.mode !== 'math' || this.style.variant === 'main')
            result.italic = 0;
        result.right = result.italic;
        // To retrieve the atom from a box, for example when the box is clicked
        // on, attach a unique ID to the box and associate it with the atom.
        this.bind(context, result);
        if (this.caret) {
            // If this has a super/subscript, the caret will be attached
            // to the 'subsup' atom, so no need to have it here.
            if (!this.superscript && !this.subscript)
                result.caret = this.caret;
        }
        return result;
    };
    /** Return true if a digit, or a decimal point, or a french decimal `{,}` */
    Atom.prototype.isDigit = function () {
        var _a;
        if (this.type === 'mord' && this.value)
            return /^[\d,\.]$/.test(this.value);
        if (this.type === 'group' && ((_a = this.body) === null || _a === void 0 ? void 0 : _a.length) === 2)
            return this.body[0].type === 'first' && this.body[1].value === ',';
        return false;
    };
    Atom.prototype.asDigit = function () {
        var _a;
        if (this.type === 'mord' && this.value && /^[\d,\.]$/.test(this.value))
            return this.value;
        if (this.type === 'group' && ((_a = this.body) === null || _a === void 0 ? void 0 : _a.length) === 2) {
            if (this.body[0].type === 'first' && this.body[1].value === ',')
                return '.';
        }
        return '';
    };
    return Atom;
}());
exports.Atom = Atom;
function getStyleRuns(atoms) {
    var style = undefined;
    var runs = [];
    var run = [];
    for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
        var atom = atoms_1[_i];
        if (atom.type === 'first')
            run.push(atom);
        if (!style && !atom.style)
            run.push(atom);
        else {
            var atomStyle = atom.style;
            if (style &&
                atomStyle.color === style.color &&
                atomStyle.backgroundColor === style.backgroundColor &&
                atomStyle.fontSize === style.fontSize) {
                // Atom matches the current run
                run.push(atom);
            }
            else {
                // Start a new run
                if (run.length > 0)
                    runs.push(run);
                run = [atom];
                style = atomStyle;
            }
        }
    }
    if (run.length > 0)
        runs.push(run);
    return runs;
}
/**
 * Render a list of atoms with the same style (color, backgroundColor, size)
 */
function renderStyleRun(parentContext, atoms, options) {
    var _a, _b, _c, _d, _e;
    if (!atoms || atoms.length === 0)
        return null;
    var context = new context_1.Context({ parent: parentContext }, options.style);
    // In most cases we want to display selection,
    // except if the `atomIdsSettings.groupNumbers` flag is set which is used for
    // read aloud.
    var displaySelection = !((_a = context.atomIdsSettings) === null || _a === void 0 ? void 0 : _a.groupNumbers);
    var boxes = [];
    if (atoms.length === 1) {
        var atom = atoms[0];
        var box = atom.render(context);
        if (box) {
            if (displaySelection && atom.isSelected)
                box.selected(true);
            boxes = [box];
        }
    }
    else {
        var digitOrTextStringID = '';
        var lastWasDigit = true;
        for (var _i = 0, atoms_2 = atoms; _i < atoms_2.length; _i++) {
            var atom = atoms_2[_i];
            if (((_b = context.atomIdsSettings) === null || _b === void 0 ? void 0 : _b.groupNumbers) &&
                digitOrTextStringID &&
                ((lastWasDigit && atom.isDigit()) || (!lastWasDigit && isText(atom))))
                context.atomIdsSettings.overrideID = digitOrTextStringID;
            var box = atom.render(context);
            if (context.atomIdsSettings)
                context.atomIdsSettings.overrideID = undefined;
            if (box) {
                // If this is a digit or text run, keep track of it
                if ((_c = context.atomIdsSettings) === null || _c === void 0 ? void 0 : _c.groupNumbers) {
                    if (atom.isDigit() || isText(atom)) {
                        if (!digitOrTextStringID || lastWasDigit !== atom.isDigit()) {
                            // Changed from text to digits or vice-versa
                            lastWasDigit = atom.isDigit();
                            digitOrTextStringID = (_d = atom.id) !== null && _d !== void 0 ? _d : '';
                        }
                    }
                    if (digitOrTextStringID &&
                        (!(atom.isDigit() || isText(atom)) ||
                            !atom.hasEmptyBranch('superscript') ||
                            !atom.hasEmptyBranch('subscript'))) {
                        // Done with digits/text
                        digitOrTextStringID = '';
                    }
                }
                if (displaySelection && atom.isSelected)
                    box.selected(true);
                boxes.push(box);
            }
        }
    }
    if (boxes.length === 0)
        return null;
    var result = new box_1.Box(boxes, __assign(__assign({ isTight: context.isTight }, options), { type: (_e = options.type) !== null && _e !== void 0 ? _e : 'lift' }));
    result.isSelected = boxes.every(function (x) { return x.isSelected; });
    return result.wrap(context);
}
function isText(atom) {
    return atom.mode === 'text';
}
function argumentsToJson(args) {
    return args.map(function (arg) {
        if (arg === null)
            return '<null>';
        if (Array.isArray(arg) && arg[0] instanceof Atom)
            return { atoms: arg.map(function (x) { return x.toJson(); }) };
        if (typeof arg === 'object' && 'group' in arg)
            return { group: arg.group.map(function (x) { return x.toJson(); }) };
        return arg;
    });
}
