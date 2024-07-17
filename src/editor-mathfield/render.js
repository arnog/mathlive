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
exports.reparse = exports.renderSelection = exports.render = exports.contentMarkup = exports.requestUpdate = void 0;
var box_1 = require("../core/box");
var utils_1 = require("./utils");
var suggestion_popover_1 = require("../editor/suggestion-popover");
var fonts_1 = require("../core/fonts");
var context_1 = require("../core/context");
var atom_class_1 = require("../core/atom-class");
var inter_box_spacing_1 = require("../core/inter-box-spacing");
var mathlive_1 = require("../public/mathlive");
var hash_code_1 = require("../common/hash-code");
var mode_editor_1 = require("./mode-editor");
function requestUpdate(mathfield, options) {
    if (!mathfield || mathfield.dirty)
        return;
    mathfield.resizeObserver.unobserve(mathfield.field);
    mathfield.dirty = true;
    requestAnimationFrame(function () {
        if ((0, utils_1.isValidMathfield)(mathfield) && mathfield.dirty) {
            mathfield.atomBoundsCache = new Map();
            render(mathfield, options);
            mathfield.atomBoundsCache = undefined;
            mathfield.resizeObserver.observe(mathfield.field);
            mathfield.resizeObserverStarted = true;
        }
    });
}
exports.requestUpdate = requestUpdate;
/**
 * Return a box representing the content of the mathfield.
 * @param mathfield
 * @param renderOptions
 */
function makeBox(mathfield, renderOptions) {
    var _a;
    renderOptions = renderOptions !== null && renderOptions !== void 0 ? renderOptions : {};
    var context = new context_1.Context({
        from: __assign(__assign({}, mathfield.context), { atomIdsSettings: {
                // Using the hash as a seed for the ID
                // keeps the IDs the same until the content of the field changes.
                seed: renderOptions.forHighlighting
                    ? (0, hash_code_1.hashCode)(atom_class_1.Atom.serialize([mathfield.model.root], {
                        expandMacro: false,
                        defaultMode: mathfield.options.defaultMode
                    }))
                    : 'random',
                // The `groupNumbers` flag indicates that extra boxes should be generated
                // to represent group of atoms, for example, a box to group
                // consecutive digits to represent a number.
                groupNumbers: (_a = renderOptions.forHighlighting) !== null && _a !== void 0 ? _a : false
            }, letterShapeStyle: mathfield.options.letterShapeStyle }),
        mathstyle: mathfield.options.defaultMode === 'inline-math'
            ? 'textstyle'
            : 'displaystyle'
    });
    var base = mathfield.model.root.render(context);
    //
    // 3. Construct struts around the boxes
    //
    var wrapper = (0, box_1.makeStruts)((0, inter_box_spacing_1.applyInterBoxSpacing)(base, context), {
        classes: mathfield.hasEditablePrompts
            ? 'ML__latex ML__prompting'
            : 'ML__latex',
        attributes: {
            // Sometimes Google Translate kicks in an attempts to 'translate' math
            // This doesn't work very well, so turn off translate
            'translate': 'no',
            // Hint to screen readers to not attempt to read this <span>.
            // They should use instead the 'aria-label' attribute.
            'aria-hidden': 'true'
        }
    });
    return wrapper;
}
function contentMarkup(mathfield, renderOptions) {
    //
    // 1. Update selection state and blinking cursor (caret)
    //
    var model = mathfield.model;
    model.root.caret = undefined;
    model.root.isSelected = false;
    model.root.containsCaret = true;
    for (var _i = 0, _a = model.atoms; _i < _a.length; _i++) {
        var atom = _a[_i];
        atom.caret = undefined;
        atom.isSelected = false;
        atom.containsCaret = false;
    }
    if (model.selectionIsCollapsed) {
        var atom = model.at(model.position);
        atom.caret = mathfield.model.mode;
        var ancestor = atom.parent;
        while (ancestor) {
            ancestor.containsCaret = true;
            ancestor = ancestor.parent;
        }
    }
    else {
        var atoms = model.getAtoms(model.selection, { includeChildren: true });
        for (var _b = 0, atoms_1 = atoms; _b < atoms_1.length; _b++) {
            var atom = atoms_1[_b];
            atom.isSelected = true;
        }
    }
    //
    // 2. Render a box representation of the mathfield content
    //
    var box = makeBox(mathfield, renderOptions);
    //
    // 3. Generate markup
    //
    return box.toMarkup();
}
exports.contentMarkup = contentMarkup;
/**
 * Layout the mathfield and generate the DOM.
 *
 * This is usually done automatically, but if the font-size, or other geometric
 * attributes are modified, outside of MathLive, this function may need to be
 * called explicitly.
 *
 */
function render(mathfield, renderOptions) {
    if (!(0, utils_1.isValidMathfield)(mathfield))
        return;
    renderOptions !== null && renderOptions !== void 0 ? renderOptions : (renderOptions = {});
    //
    // 1. Hide the virtual keyboard toggle if not applicable
    //
    var keyboardToggle = mathfield.element.querySelector('[part=virtual-keyboard-toggle]');
    if (keyboardToggle)
        keyboardToggle.style.display = mathfield.hasEditableContent ? '' : 'none';
    // NVA tries (and fails) to read MathML, so skip it for now
    // mathfield.accessibleMathML.innerHTML = mathfield.options.createHTML(
    //   '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
    //     toMathML(model.root, mathfield.options) +
    //     '</math>'
    // );
    //
    // 2. Render the content
    //
    var field = mathfield.field;
    if (!field)
        return;
    var hasFocus = mathfield.isSelectionEditable && mathfield.hasFocus();
    var isFocused = field.classList.contains('ML__focused');
    if (isFocused && !hasFocus)
        field.classList.remove('ML__focused');
    else if (!isFocused && hasFocus)
        field.classList.add('ML__focused');
    var content = contentMarkup(mathfield, renderOptions);
    var menuToggle = mathfield.element.querySelector('[part=menu-toggle]');
    if (menuToggle) {
        var hideMenu = false;
        if (mathfield.disabled ||
            (mathfield.readOnly && !mathfield.hasEditableContent) ||
            mathfield.userSelect === 'none')
            hideMenu = true;
        // If the width of the element is less than 50px, hide the menu
        if (!hideMenu && field.offsetWidth < 50) {
            hideMenu = true;
        }
        menuToggle.style.display = hideMenu ? 'none' : '';
    }
    //
    // 3. Render the content placeholder, if applicable
    //
    // If the mathfield is empty, display a placeholder
    if (mathfield.model.atoms.length <= 1) {
        var placeholder = mathfield.options.contentPlaceholder;
        if (placeholder) {
            content += "<span part=placeholder class=\"ML__content-placeholder\">".concat((0, mathlive_1.convertLatexToMarkup)(placeholder), "</span>");
        }
    }
    field.innerHTML = globalThis.MathfieldElement.createHTML(content);
    //
    // 4. Render the selection/caret
    //
    renderSelection(mathfield, renderOptions.interactive);
    mathfield.dirty = false;
}
exports.render = render;
function renderSelection(mathfield, interactive) {
    var field = mathfield.field;
    // In some rare cases, we can get called (via a timeout) when the field
    // is either no longer ready, or not yet ready. Bail.
    if (!field)
        return;
    // Remove existing selection
    for (var _i = 0, _a = field.querySelectorAll('.ML__selection, .ML__contains-highlight'); _i < _a.length; _i++) {
        var element = _a[_i];
        element.remove();
    }
    if (!(interactive !== null && interactive !== void 0 ? interactive : false) &&
        fonts_1.gFontsState !== 'error' &&
        fonts_1.gFontsState !== 'ready') {
        // If the fonts are not loaded, or if they are still loading, schedule
        // a re-render of the selection to a bit later. If after waiting a bit
        // the fonts are still not ready,
        // Once the fonts are loaded, the layout may shift due to the glyph metrics
        // being different after font-substitution, which may affect rendering of
        // the selection
        setTimeout(function () {
            if (fonts_1.gFontsState === 'ready')
                renderSelection(mathfield);
            else
                setTimeout(function () { return renderSelection(mathfield); }, 128);
        }, 32);
        return;
    }
    var model = mathfield.model;
    // Cache the scale factor
    // In some cases we don't need it, so we want to avoid computing it
    // since it can trigger a reflow
    var _scaleFactor;
    var scaleFactor = function () {
        if (_scaleFactor !== undefined)
            return _scaleFactor;
        // Logic to accommodate mathfield hosted in an isotropically scale-transformed element.
        // Without this, the selection indicator will not be in the right place.
        // 1. Inquire how big the mathfield thinks it is
        var offsetWidth = field.offsetWidth;
        // 2. Get the actual screen width of the box
        var actualWidth = field.getBoundingClientRect().width;
        // 3. Divide the two to get the scale factor
        _scaleFactor = Math.floor(actualWidth) / offsetWidth;
        if (isNaN(_scaleFactor))
            _scaleFactor = 1;
        return _scaleFactor;
    };
    if (model.selectionIsCollapsed) {
        //
        // 1.1. Display the popover relative to the location of the caret
        //
        (0, suggestion_popover_1.updateSuggestionPopoverPosition)(mathfield, { deferred: true });
        //
        // 1.2. Display the 'contains' highlight
        //
        var atom = model.at(model.position);
        while (atom &&
            atom.type !== 'prompt' &&
            !(atom.containsCaret && atom.displayContainsHighlight))
            atom = atom.parent;
        if ((atom === null || atom === void 0 ? void 0 : atom.containsCaret) && atom.displayContainsHighlight) {
            var s = scaleFactor();
            var bounds = (0, utils_1.adjustForScrolling)(mathfield, (0, utils_1.getAtomBounds)(mathfield, atom), s);
            if (bounds) {
                bounds.left /= s;
                bounds.right /= s;
                bounds.top /= s;
                bounds.bottom /= s;
                var element = document.createElement('div');
                element.classList.add('ML__contains-highlight');
                element.style.position = 'absolute';
                element.style.left = "".concat(bounds.left + 1, "px");
                element.style.top = "".concat(Math.ceil(bounds.top), "px");
                element.style.width = "".concat(Math.ceil(bounds.right - bounds.left), "px");
                element.style.height = "".concat(Math.ceil(bounds.bottom - bounds.top), "px");
                field.insertBefore(element, field.childNodes[0]);
            }
        }
        return;
    }
    //
    // 2. Display the non-collapsed selection
    //
    for (var _b = 0, _c = unionRects((0, utils_1.getSelectionBounds)(mathfield, { excludeAtomsWithBackground: true })); _b < _c.length; _b++) {
        var x = _c[_b];
        var s = scaleFactor();
        x.left /= s;
        x.right /= s;
        x.top /= s;
        x.bottom /= s;
        var selectionElement = document.createElement('div');
        selectionElement.classList.add('ML__selection');
        selectionElement.style.position = 'absolute';
        selectionElement.style.left = "".concat(x.left, "px");
        selectionElement.style.top = "".concat(x.top, "px");
        selectionElement.style.width = "".concat(Math.ceil(x.right - x.left), "px");
        selectionElement.style.height = "".concat(Math.ceil(x.bottom - x.top - 1), "px");
        field.insertBefore(selectionElement, field.childNodes[0]);
    }
}
exports.renderSelection = renderSelection;
/**
 * Return the rects that are not entirely contained by other rects.
 */
function unionRects(rects) {
    var result = [];
    // Remove duplicate rects
    for (var _i = 0, rects_1 = rects; _i < rects_1.length; _i++) {
        var rect = rects_1[_i];
        var found = false;
        for (var _a = 0, result_1 = result; _a < result_1.length; _a++) {
            var rect2 = result_1[_a];
            if (rect.left === rect2.left &&
                rect.right === rect2.right &&
                rect.top === rect2.top &&
                rect.bottom === rect2.bottom) {
                found = true;
                break;
            }
        }
        if (!found)
            result.push(rect);
    }
    rects = result;
    result = [];
    for (var _b = 0, rects_2 = rects; _b < rects_2.length; _b++) {
        var rect = rects_2[_b];
        var count = 0;
        for (var _c = 0, rects_3 = rects; _c < rects_3.length; _c++) {
            var rect2 = rects_3[_c];
            if (rect.left >= rect2.left &&
                rect.right <= rect2.right &&
                rect.top >= rect2.top &&
                rect.bottom <= rect2.bottom) {
                count += 1;
                if (count > 1)
                    break;
            }
        }
        if (count === 1)
            result.push(rect);
    }
    return result;
}
/**
 * Re parse the content and rerender.
 *
 * Used when context changes, for example the definition
 * of macros or the `isFunction` global option.
 *
 * @param mathfield
 */
function reparse(mathfield) {
    if (!mathfield)
        return;
    var model = mathfield.model;
    var selection = model.selection;
    var content = atom_class_1.Atom.serialize([model.root], {
        expandMacro: false,
        defaultMode: mathfield.options.defaultMode
    });
    mode_editor_1.ModeEditor.insert(model, content, {
        insertionMode: 'replaceAll',
        selectionMode: 'after',
        format: 'latex',
        silenceNotifications: true,
        mode: 'math'
    });
    var wasSilent = model.silenceNotifications;
    model.silenceNotifications = true;
    model.selection = selection;
    model.silenceNotifications = wasSilent;
    requestUpdate(mathfield);
}
exports.reparse = reparse;
