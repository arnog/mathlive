"use strict";
exports.__esModule = true;
exports.disposeSuggestionPopover = exports.createSuggestionPopover = exports.hideSuggestionPopover = exports.updateSuggestionPopoverPosition = exports.isSuggestionPopoverVisible = exports.showSuggestionPopover = void 0;
var stylesheet_1 = require("../common/stylesheet");
var core_1 = require("../core/core");
var utils_1 = require("../editor-mathfield/utils");
var keybindings_1 = require("./keybindings");
var autocomplete_1 = require("../editor-mathfield/autocomplete");
var mode_editor_1 = require("../editor-mathfield/mode-editor");
var inter_box_spacing_1 = require("../core/inter-box-spacing");
var shared_element_1 = require("../common/shared-element");
function latexToMarkup(mf, latex) {
    var context = new core_1.Context({ from: mf.context });
    var root = new core_1.Atom({
        mode: 'math',
        type: 'root',
        body: (0, core_1.parseLatex)(latex, { context: context })
    });
    var box = (0, core_1.coalesce)((0, inter_box_spacing_1.applyInterBoxSpacing)(new core_1.Box(root.render(context), { classes: 'ML__base' }), context));
    return (0, core_1.makeStruts)(box, { classes: 'ML__latex' }).toMarkup();
}
function showSuggestionPopover(mf, suggestions) {
    var _a;
    if (suggestions.length === 0) {
        hideSuggestionPopover(mf);
        return;
    }
    var template = '';
    for (var _i = 0, _b = suggestions.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], i = _c[0], suggestion = _c[1];
        var command = suggestion;
        var commandMarkup = latexToMarkup(mf, suggestion);
        var keybinding = (0, keybindings_1.getKeybindingsForCommand)(mf.keybindings, command).join('<br>');
        template += "<li role=\"button\" data-command=\"".concat(command, "\" ").concat(i === mf.suggestionIndex ? 'class=ML__popover__current' : '', "><span class=\"ML__popover__latex\">").concat(command, "</span><span class=\"ML__popover__command\">").concat(commandMarkup, "</span>");
        if (keybinding)
            template += "<span class=\"ML__popover__keybinding\">".concat(keybinding, "</span>");
        template += '</li>';
    }
    var panel = createSuggestionPopover(mf, "<ul>".concat(template, "</ul>"));
    if (isSuggestionPopoverVisible()) {
        (_a = panel
            .querySelector('.ML__popover__current')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    setTimeout(function () {
        var _a;
        if (panel && !isSuggestionPopoverVisible()) {
            panel.classList.add('is-visible');
            updateSuggestionPopoverPosition(mf);
            (_a = panel
                .querySelector('.ML__popover__current')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }, 32);
}
exports.showSuggestionPopover = showSuggestionPopover;
function isSuggestionPopoverVisible() {
    var panel = document.getElementById('mathlive-suggestion-popover');
    if (!panel)
        return false;
    return panel.classList.contains('is-visible');
}
exports.isSuggestionPopoverVisible = isSuggestionPopoverVisible;
function updateSuggestionPopoverPosition(mf, options) {
    var _a, _b, _c;
    // Check that the mathfield is still valid
    // (we're calling ourselves from requestAnimationFrame() and the mathfield
    // could have gotten destroyed
    if (!mf.element || mf.element.mathfield !== mf)
        return;
    if (!isSuggestionPopoverVisible())
        return;
    if (((_a = mf.model.at(mf.model.position)) === null || _a === void 0 ? void 0 : _a.type) !== 'latex') {
        hideSuggestionPopover(mf);
        return;
    }
    if (options === null || options === void 0 ? void 0 : options.deferred) {
        // Call ourselves again later, typically after the
        // rendering/layout of the DOM has been completed
        // (don't do it on next frame, it might be too soon)
        setTimeout(function () { return updateSuggestionPopoverPosition(mf); }, 32);
        return;
    }
    var position = (0, utils_1.getCaretPoint)(mf.field);
    if (!position)
        return;
    // Get screen width & height (browser compatibility)
    var viewportHeight = window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;
    var viewportWidth = window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;
    // Get scrollbar size. This would be 0 in mobile device (also no needed).
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    var scrollbarHeight = window.innerHeight - document.documentElement.clientHeight;
    var virtualkeyboardHeight = (_c = (_b = window.mathVirtualKeyboard) === null || _b === void 0 ? void 0 : _b.boundingRect.height) !== null && _c !== void 0 ? _c : 0;
    // Prevent screen overflow horizontal.
    var panel = document.getElementById('mathlive-suggestion-popover');
    if (position.x + panel.offsetWidth / 2 > viewportWidth - scrollbarWidth) {
        panel.style.left = "".concat(viewportWidth - panel.offsetWidth - scrollbarWidth, "px");
    }
    else if (position.x - panel.offsetWidth / 2 < 0)
        panel.style.left = '0';
    else
        panel.style.left = "".concat(position.x - panel.offsetWidth / 2, "px");
    // And position the popover right below or above the caret
    var spaceAbove = position.y - position.height;
    var spaceBelow = viewportHeight - scrollbarHeight - virtualkeyboardHeight - position.y;
    if (spaceBelow < spaceAbove) {
        panel.classList.add('ML__popover--reverse-direction');
        panel.classList.remove('top-tip');
        panel.classList.add('bottom-tip');
        panel.style.top = "".concat(position.y - position.height - panel.offsetHeight - 15, "px");
    }
    else {
        panel.classList.remove('ML__popover--reverse-direction');
        panel.classList.add('top-tip');
        panel.classList.remove('bottom-tip');
        panel.style.top = "".concat(position.y + 15, "px");
    }
}
exports.updateSuggestionPopoverPosition = updateSuggestionPopoverPosition;
function hideSuggestionPopover(mf) {
    mf.suggestionIndex = 0;
    var panel = document.getElementById('mathlive-suggestion-popover');
    if (panel) {
        panel.classList.remove('is-visible');
        panel.innerHTML = '';
    }
}
exports.hideSuggestionPopover = hideSuggestionPopover;
function createSuggestionPopover(mf, html) {
    var panel = document.getElementById('mathlive-suggestion-popover');
    if (!panel) {
        panel = (0, shared_element_1.getSharedElement)('mathlive-suggestion-popover');
        (0, stylesheet_1.injectStylesheet)('suggestion-popover');
        (0, stylesheet_1.injectStylesheet)('core');
        panel.addEventListener('pointerdown', function (ev) { return ev.preventDefault(); });
        panel.addEventListener('click', function (ev) {
            var el = ev.target;
            while (el && !el.dataset.command)
                el = el.parentElement;
            if (!el)
                return;
            (0, autocomplete_1.complete)(mf, 'reject');
            mode_editor_1.ModeEditor.insert(mf.model, el.dataset.command, {
                selectionMode: 'placeholder',
                format: 'latex',
                mode: 'math'
            });
            mf.dirty = true;
            mf.focus();
        });
    }
    panel.innerHTML = globalThis.MathfieldElement.createHTML(html);
    return panel;
}
exports.createSuggestionPopover = createSuggestionPopover;
function disposeSuggestionPopover() {
    if (!document.getElementById('mathlive-suggestion-popover'))
        return;
    (0, shared_element_1.releaseSharedElement)('mathlive-suggestion-popover');
    (0, stylesheet_1.releaseStylesheet)('suggestion-popover');
    (0, stylesheet_1.releaseStylesheet)('core');
}
exports.disposeSuggestionPopover = disposeSuggestionPopover;
