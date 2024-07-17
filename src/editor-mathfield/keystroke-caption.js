"use strict";
exports.__esModule = true;
exports.disposeKeystrokeCaption = exports.toggleKeystrokeCaption = exports.showKeystroke = void 0;
var stylesheet_1 = require("../common/stylesheet");
var shared_element_1 = require("../common/shared-element");
var keyboard_1 = require("ui/events/keyboard");
function showKeystroke(mathfield, keystroke) {
    if (!mathfield.isSelectionEditable || !mathfield.keystrokeCaptionVisible)
        return;
    var vb = createKeystrokeCaption();
    var bounds = mathfield.element.getBoundingClientRect();
    vb.style.left = "".concat(bounds.left, "px");
    vb.style.top = "".concat(bounds.top - 64, "px");
    vb.innerHTML = globalThis.MathfieldElement.createHTML('<span>' +
        ((0, keyboard_1.getKeybindingMarkup)(keystroke) || keystroke) +
        '</span>' +
        vb.innerHTML);
    vb.style.visibility = 'visible';
    setTimeout(function () {
        if (vb.childNodes.length > 0)
            vb.childNodes[vb.childNodes.length - 1].remove();
        if (vb.childNodes.length === 0)
            vb.style.visibility = 'hidden';
    }, 3000);
}
exports.showKeystroke = showKeystroke;
function toggleKeystrokeCaption(mathfield) {
    mathfield.keystrokeCaptionVisible = !mathfield.keystrokeCaptionVisible;
    if (!mathfield.keystrokeCaptionVisible) {
        var panel = (0, shared_element_1.getSharedElement)('mathlive-keystroke-caption-panel');
        panel.style.visibility = 'hidden';
    }
    else {
        var panel = createKeystrokeCaption();
        panel.innerHTML = '';
    }
    return false;
}
exports.toggleKeystrokeCaption = toggleKeystrokeCaption;
function createKeystrokeCaption() {
    var panel = document.getElementById('mathlive-keystroke-caption-panel');
    if (panel)
        return panel;
    (0, stylesheet_1.injectStylesheet)('keystroke-caption');
    (0, stylesheet_1.injectStylesheet)('core');
    return (0, shared_element_1.getSharedElement)('mathlive-keystroke-caption-panel');
}
function disposeKeystrokeCaption() {
    if (!document.getElementById('mathlive-keystroke-caption-panel'))
        return;
    (0, shared_element_1.releaseSharedElement)('mathlive-keystroke-caption-panel');
    (0, stylesheet_1.releaseStylesheet)('core');
    (0, stylesheet_1.releaseStylesheet)('keystroke-caption');
}
exports.disposeKeystrokeCaption = disposeKeystrokeCaption;
