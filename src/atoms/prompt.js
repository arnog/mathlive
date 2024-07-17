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
exports.PromptAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var context_1 = require("../core/context");
var tokenizer_1 = require("../core/tokenizer");
var PromptAtom = /** @class */ (function (_super) {
    __extends(PromptAtom, _super);
    function PromptAtom(placeholderId, correctness, locked, body, options) {
        if (locked === void 0) { locked = false; }
        var _this = this;
        var _a;
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        _this = _super.call(this, {
            type: 'prompt',
            mode: (_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : 'math',
            style: options === null || options === void 0 ? void 0 : options.style,
            command: '\\placeholder'
        }) || this;
        _this.body = body;
        _this.correctness = correctness;
        _this.placeholderId = placeholderId;
        _this.locked = locked;
        _this.captureSelection = _this.locked;
        return _this;
    }
    PromptAtom.fromJson = function (json) {
        return new PromptAtom(json.placeholderId, json.correctness, json.locked, json.body, json);
    };
    PromptAtom.prototype.toJson = function () {
        var result = _super.prototype.toJson.call(this);
        if (this.placeholderId)
            result.placeholderId = this.placeholderId;
        if (!this.body)
            delete result.body;
        if (this.body) {
            result.body = this.body
                .filter(function (x) { return x.type !== 'first'; })
                .map(function (x) { return x.toJson(); });
        }
        if (this.correctness)
            result.correctness = this.correctness;
        result.locked = this.locked;
        return result;
    };
    PromptAtom.prototype.render = function (parentContext) {
        var context = new context_1.Context({ parent: parentContext });
        var fboxsep = context.getRegisterAsEm('fboxsep');
        var hPadding = fboxsep;
        var vPadding = fboxsep;
        // Base is the main content "inside" the box
        var content = atom_class_1.Atom.createBox(parentContext, this.body);
        if (!content)
            return null;
        // An empty prompt should not be too small, pretend content
        // has height sigma 5 (x-height)
        if (!content.height)
            content.height = context.metrics.xHeight;
        content.setStyle('vertical-align', -content.height, 'em');
        if (this.correctness === 'correct') {
            content.setStyle('color', 'var(--correct-color, var(--ML__correct-color))');
        }
        else if (this.correctness === 'incorrect') {
            content.setStyle('color', 'var(--incorrect-color, var(--ML__incorrect-color))');
        }
        var base = new box_1.Box(content, { type: 'ord' });
        base.setStyle('display', 'inline-block');
        base.setStyle('height', content.height + content.depth, 'em');
        base.setStyle('vertical-align', -vPadding, 'em');
        // This box will represent the box (background and border).
        // It's positioned to overlap the base.
        // The 'ML__box' class is required to prevent the box from being omitted
        // during rendering (it looks like an empty, no-op box)
        var boxClasses = 'ML__prompt ';
        if (this.locked) {
            // The prompt is not editable
            boxClasses += ' ML__lockedPromptBox ';
        }
        else
            boxClasses += ' ML__editablePromptBox ';
        if (this.correctness === 'correct')
            boxClasses += ' ML__correctPromptBox ';
        else if (this.correctness === 'incorrect')
            boxClasses += ' ML__incorrectPromptBox ';
        if (this.containsCaret)
            boxClasses += ' ML__focusedPromptBox ';
        var box = new box_1.Box(null, {
            classes: boxClasses,
            attributes: { part: 'prompt' }
        });
        box.height = base.height + vPadding;
        box.depth = base.depth + vPadding;
        box.width = base.width + 2 * hPadding;
        box.setStyle('position', 'absolute');
        box.setStyle('height', "calc(".concat(base.height + base.depth + 2 * vPadding, "em - 2px)")); // @todo: remove
        if (hPadding === 0)
            box.setStyle('width', '100%'); // @todo: remove
        if (hPadding !== 0) {
            box.setStyle('width', "calc(100% + ".concat(2 * hPadding, "em)")); // @todo: remove
            box.setStyle('top', fboxsep, 'em'); // empirical
            box.setStyle('left', -hPadding, 'em');
        }
        // empty prompt should be a little wider
        if (!this.body || this.body.length === 1) {
            box.width = 3 * hPadding;
            box.setStyle('width', "calc(100% + ".concat(3 * hPadding, "em)"));
            box.setStyle('left', -1.5 * hPadding, 'em');
        }
        var svg = ''; // strike through incorrect prompt, for users with impaired color vision
        if (this.correctness === 'incorrect') {
            svg +=
                '<line x1="3%"  y1="97%" x2="97%" y2="3%" stroke-width="0.5" stroke="var(--incorrect-color, var(--ML__incorrect-color))" stroke-linecap="round" />';
        }
        if (svg)
            box.svgOverlay = svg;
        // The result is a box that encloses the box and the base
        var result = new box_1.Box([box, base], { classes: 'ML__prompt-atom' });
        // Needed for Safari (https://github.com/arnog/mathlive/issues/2152)
        base.setStyle('line-height', 1);
        // Set its position as relative so that the box can be absolute positioned
        // over the base
        result.setStyle('position', 'relative');
        result.setStyle('display', 'inline-block');
        result.setStyle('line-height', 0);
        // The padding adds to the width and height of the pod
        result.height = base.height + vPadding + 0.2;
        result.depth = base.depth + vPadding;
        result.left = hPadding;
        result.right = hPadding;
        result.setStyle('height', base.height + vPadding, 'em');
        result.setStyle('top', base.depth - base.height, 'em');
        result.setStyle('vertical-align', base.depth + vPadding, 'em');
        result.setStyle('margin-left', 0.5, 'em');
        result.setStyle('margin-right', 0.5, 'em');
        if (this.caret)
            result.caret = this.caret;
        return this.bind(context, this.attachSupsub(parentContext, { base: result }));
    };
    PromptAtom.prototype._serialize = function (options) {
        var _a;
        var value = (_a = this.bodyToLatex(options)) !== null && _a !== void 0 ? _a : '';
        if (options.skipPlaceholders)
            return value;
        var command = '\\placeholder';
        if (this.placeholderId)
            command += "[".concat(this.placeholderId, "]");
        if (this.correctness === 'correct')
            command += '[correct]';
        else if (this.correctness === 'incorrect')
            command += '[incorrect]';
        if (this.locked)
            command += '[locked]';
        return (0, tokenizer_1.latexCommand)(command, value);
    };
    return PromptAtom;
}(atom_class_1.Atom));
exports.PromptAtom = PromptAtom;
