

define([], 
    function() {

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
UndoManager.prototype.undo = function() {
    if (this.canUndo()) {
        this.restore(this.stack[this.index]);
        this.index -= 1;
    }
}

/**
 * 
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.redo = function() {
    if (this.canRedo()) {
        this.index += 1;
        this.restore(this.stack[this.index]);
    }
}


/**
 * Push a snapshot of the content and selection of the math field onto the 
 * undo stack so that it can potentially be reverted to later.
 * @memberof UndoManager
 * @instance
 * @private
 */
UndoManager.prototype.snapshot = function() {
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
UndoManager.prototype.restore = function (state) {
    // Restore the content
    this.mathlist.selectAll_();
    this.mathlist.insert(state.latex);
    
    // Restore the selection
    this.mathlist.setPath(state.selection)
}



return {
    UndoManager: UndoManager
}


})
