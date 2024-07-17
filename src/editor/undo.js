"use strict";
exports.__esModule = true;
exports.UndoManager = void 0;
var UndoManager = /** @class */ (function () {
    function UndoManager(model) {
        this.recording = false;
        this.model = model;
        this.reset();
    }
    UndoManager.prototype.reset = function () {
        this.stack = [];
        this.index = -1;
        this.lastOp = '';
    };
    UndoManager.prototype.startRecording = function () {
        this.recording = true;
    };
    UndoManager.prototype.stopRecording = function () {
        this.recording = false;
    };
    UndoManager.prototype.canUndo = function () {
        return this.index - 1 >= 0;
    };
    UndoManager.prototype.canRedo = function () {
        return this.stack.length - 1 > this.index;
    };
    /** Call this to stop coalescing future ops, for example when the selection
     * changes
     */
    UndoManager.prototype.stopCoalescing = function (selection) {
        if (selection && this.index >= 0)
            this.stack[this.index].selection = selection;
        this.lastOp = '';
    };
    UndoManager.prototype.undo = function () {
        if (!this.canUndo())
            return false;
        this.model.setState(this.stack[this.index - 1], {
            silenceNotifications: false,
            type: 'undo'
        });
        this.index -= 1;
        this.lastOp = '';
        return true;
    };
    UndoManager.prototype.redo = function () {
        if (!this.canRedo())
            return false;
        this.index += 1;
        this.model.setState(this.stack[this.index], {
            silenceNotifications: false,
            type: 'redo'
        });
        this.lastOp = '';
        return true;
    };
    UndoManager.prototype.pop = function () {
        if (!this.canUndo())
            return;
        this.stack.splice(this.index, this.stack.length - this.index);
        this.index -= 1;
    };
    /**
     * Push a snapshot of the content and selection of the mathfield onto the
     * undo stack so that it can potentially be reverted to later.
     *
     * **Return** `true` if the undo state changed
     */
    UndoManager.prototype.snapshot = function (op) {
        if (!this.recording)
            return false;
        if (op && op === this.lastOp)
            this.pop();
        // Drop any entries that are part of the redo stack
        this.stack.splice(this.index + 1, this.stack.length - this.index - 1);
        // Add a new entry
        this.stack.push(this.model.getState());
        this.index += 1;
        // If we've reached the maximum number of undo operations, forget the
        // oldest one.
        if (this.stack.length > UndoManager.maximumDepth) {
            this.stack.shift();
            this.index -= 1;
        }
        this.lastOp = op !== null && op !== void 0 ? op : '';
        return true;
    };
    // Maximum number of undo/redo states
    UndoManager.maximumDepth = 1000;
    return UndoManager;
}());
exports.UndoManager = UndoManager;
