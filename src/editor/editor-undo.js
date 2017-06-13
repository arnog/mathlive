

define(['mathlive/editor/editor-editableMathlist'], 
    function(EditableMathlist) {

function UndoManager(mathlist) {
    this.mathlist = mathlist;
    this.stack = [];
    this.index = -1;
    this.maximumDepth = 1000;
}


UndoManager.prototype.canUndo = function() {
    return this.index >= 0;
}

UndoManager.prototype.canRedo = function() {
    return this.index !== this.stack.length - 1;
}

UndoManager.prototype.undo = function() {
    if (this.canUndo()) {
        // Restore the content
        this.mathlist.selectAll_();
        this.mathlist.insert(this.stack[this.index].latex);
        
        // Restore the selection
        this.mathlist.setPath(this.stack[this.index].selection)

        this.index -= 1;
    }
}

UndoManager.prototype.redo = function() {
    if (this.canRedo()) {
        this.index += 1;

        // Restore the content
        this.mathlist.selectAll_();
        this.mathlist.insert(this.stack[this.index].latex);
        
        // Restore the selection
        this.mathlist.setPath(this.stack[this.index].selection)        
    }
}


/**
 * Push a snapshot of the current atoms and of the selection onto the 
 * undo stack so that it can potentially be reverted to later.
 */
UndoManager.prototype.snapshot = function() {
    // Drop any entries that are part of the redo stack
    this.stack.splice(this.index + 1, this.index.length - this.index - 1);

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


return {
    UndoManager: UndoManager
}


})
