



/**
 * 
 * @param {MathAtom[]} mathlist
 * @class UndoManager
 * @global
 * @private
 */
function UndoManager(mathlist) {
    this.mathlist = mathlist;
    this.stack = [];
    this.index = -1;
    this.maximumDepth = 1000;
}


/**
 * 
 * @return {boolean}
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.canUndo = function() {
    return this.index >= 0;
}

/**
 * 
 * @return {boolean}
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.canRedo = function() {
    return this.index !== this.stack.length - 1;
}

/**
 * 
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.undo = function(options) {
    if (this.canUndo()) {
        if (options && options.onUndoStateWillChange) {
            options.onUndoStateWillChange('undo');
        }
        this.restore(this.stack[this.index], options);
        this.index -= 1;
        if (options && options.onUndoStateDidChange) {
            options.onUndoStateDidChange('undo');
        }
    }
}

/**
 * 
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.redo = function(options) {
    if (this.canRedo()) {
        if (options && options.onUndoStateWillChange) {
            options.onUndoStateWillChange('redo');
        }
        this.index += 1;
        this.restore(this.stack[this.index], options);
        if (options && options.onUndoStateDidChange) {
            options.onUndoStateDidChange('redo');
        }
    }
}


/**
 * Push a snapshot of the content and selection of the math field onto the 
 * undo stack so that it can potentially be reverted to later.
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.snapshot = function(options) {
    if (options && options.onUndoStateWillChange) {
        options.onUndoStateWillChange('snapshot');
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
    if (options && options.onUndoStateDidChange) {
        options.onUndoStateDidChange('snapshot');
    }
}


/**
 * Return an object capturing the state of the content and selection of the 
 * math field. Pass this object to restore() to reset the value of the math
 * field to this saved value. This does not affect the undo stack.
*/
UndoManager.prototype.save = function () {
    return {
        latex: this.mathlist.root.toLatex(),
        selection: this.mathlist.toString()
    };
}

/**
 * Set the content and selection of the math field to a value previously
 * captured with save() or stored in the undo stack. 
 * This does not affect the undo stack.
*/
UndoManager.prototype.restore = function (state, options) {
    // Restore the content
    this.mathlist.insert(state.latex, Object.assign({
            insertionMode: 'replaceAll',
            selectionMode: 'after', // Doesn't matter, we'll set the selection after
            format: 'latex'
        }, options));
    
    // Restore the selection
    this.mathlist.setPath(state.selection)
}



export default {
    UndoManager: UndoManager
}



