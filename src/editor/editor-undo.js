/**
 *
 * @class UndoManager
 * @property {MathAtom[]} mathlist
 * @property {object[]} stack Stack of undo/redo states
 * @property {number} index Index pointing to the undo/redo stack
 * @property {number} maximumDepth Maximum number of undo/redo states
 * @global
 * @private
 */
class UndoManager {
    constructor(mathlist) {
        this.mathlist = mathlist;
        this.maximumDepth = 1000;
        this.record = false;
        this.canCoalesce = false;
        this.reset();
    }
    reset() {
        this.stack = [];
        this.index = -1;
    }
    startRecording() {
        this.record = true;
    }
    /**
     *
     * @return {boolean}
     * @memberof UndoManager
     * @instance
     * @private
     */
    canUndo() {
        return this.index > 0;
    }
    /**
     *
     * @return {boolean}
     * @memberof UndoManager
     * @instance
     * @private
     */
    canRedo() {
        return this.index !== this.stack.length - 1;
    }
    /**
     *
     * @memberof UndoManager
     * @instance
     * @private
     */
    undo(options) {
        if (this.canUndo()) {
            if (options && typeof options.onUndoStateWillChange === 'function') {
                options.onUndoStateWillChange(this.mathlist.target, 'undo');
            }
            this.restore(this.stack[this.index - 1], options);
            this.index -= 1;
            if (options && typeof options.onUndoStateDidChange === 'function') {
                options.onUndoStateDidChange(this.mathlist.target, 'undo');
            }
            this.canCoalesce = false;
        }
    }
    /**
     *
     * @memberof UndoManager
     * @instance
     * @private
     */
    redo(options) {
        if (this.canRedo()) {
            if (options && options.onUndoStateWillChange === 'function') {
                options.onUndoStateWillChange(this.mathlist.target, 'redo');
            }
            this.index += 1;
            this.restore(this.stack[this.index], options);
            if (options && typeof options.onUndoStateDidChange === 'function') {
                options.onUndoStateDidChange(this.mathlist.target, 'redo');
            }
            this.canCoalesce = false;
        }
    }
    /**
     * 
     * @memberof UndoManager
     * @instance
     * @private
     */
    pop() {
        if (this.canUndo()) {
            this.index -= 1;
            this.stack.pop();
        }
    }
    /**
     * Push a snapshot of the content and selection of the math field onto the
     * undo stack so that it can potentially be reverted to later.
     * @memberof UndoManager
     * @instance
     * @private
     */
    snapshot(options) {
        if (!this.record) return;

        if (options && options.onUndoStateWillChange === 'function') {
            options.onUndoStateWillChange(this.mathlist.target, 'snapshot');
        }
        // Drop any entries that are part of the redo stack
        this.stack.splice(this.index + 1, this.stack.length - this.index - 1);
        // Add a new entry
        this.stack.push({
            latex: this.mathlist.root.toLatex(),
            selection: this.mathlist.toString()
        });

        this.index++;
        // If we've reached the maximum number of undo operations, forget the 
        // oldest one.
        if (this.stack.length > this.maximumDepth) {
            this.stack.shift();
        }
        if (options && typeof options.onUndoStateDidChange === 'function') {
            options.onUndoStateDidChange(this.mathlist.target, 'snapshot');
        }
        this.canCoalesce = false;
    }
    /**
     * 
     * @param {Object.<any>} options 
     * @instance
     * @memberof UndoManager
     * @private
     */
    snapshotAndCoalesce(options) {
        if (this.canCoalesce) {
            this.pop();
        }
        this.snapshot(options);
        this.canCoalesce = true;
    }
    /**
     * Return an object capturing the state of the content and selection of the
     * math field. Pass this object to restore() to reset the value of the math
     * field to this saved value. This does not affect the undo stack.
     * @instance
     * @memberof UndoManager
     * @private
    */
    save() {
        return {
            latex: this.mathlist.root.toLatex(),
            selection: this.mathlist.toString()
        };
    }
    /**
     * Set the content and selection of the math field to a value previously
     * captured with save() or stored in the undo stack.
     * This does not affect the undo stack.
     * @instance
     * @memberof UndoManager
     * @private
    */
    restore(state, options) {
        const wasSuppressing = this.mathlist.suppressChangeNotifications;
        if (options.suppressChangeNotifications !== undefined) {
            this.mathlist.suppressChangeNotifications = options.suppressChangeNotifications;
        }
        
        // Restore the content
        this.mathlist.insert(state ? state.latex : '', {
            mode: 'math',
            insertionMode: 'replaceAll',
            selectionMode: 'after',
            format: 'latex',
            ...options
        });

        // Restore the selection
        this.mathlist.setPath(state ? state.selection : [{relation: 'body', offset: 0}]);

        this.mathlist.suppressChangeNotifications = wasSuppressing;
    }
}

export default {
    UndoManager
}



