"use strict";
exports.__esModule = true;
exports.removeComposition = exports.updateComposition = void 0;
var composition_1 = require("../atoms/composition");
/**
 * Create, remove or update a composition atom at the current location
 */
function updateComposition(model, s) {
    var cursor = model.at(model.position);
    // We're creating or updating a composition
    if (cursor.type === 'composition') {
        // Composition already in progress, update it
        cursor.value = s;
    }
    else {
        // No composition yet, create one
        // Remove previous caret
        var caret = cursor.caret;
        cursor.caret = undefined;
        // Create 'composition' atom, with caret
        var atom = new composition_1.CompositionAtom(s, { mode: cursor.mode });
        atom.caret = caret;
        cursor.parent.addChildAfter(atom, cursor);
        // Move cursor one past the composition zone
        model.position += 1;
    }
}
exports.updateComposition = updateComposition;
/**
 * Remove the composition zone
 */
function removeComposition(model) {
    var cursor = model.at(model.position);
    if (cursor.type === 'composition') {
        cursor.parent.removeChild(cursor);
        model.position -= 1;
    }
}
exports.removeComposition = removeComposition;
