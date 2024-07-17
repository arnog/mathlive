"use strict";
exports.__esModule = true;
exports.releaseSharedElement = exports.getSharedElement = void 0;
function getSharedElement(id) {
    var _a;
    var result = document.getElementById(id);
    if (result) {
        result.dataset.refcount = Number(Number.parseInt((_a = result.dataset.refcount) !== null && _a !== void 0 ? _a : '0') + 1).toString();
    }
    else {
        result = document.createElement('div');
        result.setAttribute('aria-hidden', 'true');
        result.dataset.refcount = '1';
        result.id = id;
        document.body.append(result);
    }
    return result;
}
exports.getSharedElement = getSharedElement;
function releaseSharedElement(id) {
    var _a;
    var element = document.getElementById(id);
    if (!element)
        return;
    var refcount = Number.parseInt((_a = element.getAttribute('data-refcount')) !== null && _a !== void 0 ? _a : '0');
    if (refcount <= 1)
        element.remove();
    else
        element.dataset.refcount = Number(refcount - 1).toString();
}
exports.releaseSharedElement = releaseSharedElement;
