

/**
 * This module contains the definition of a data structure representing a
 * math list that can be edited. It is an in-memory representation of a 
 * mathematical expression whose elements, math atoms, can be removed,
 * inserted or re-arranged. In addition, the data structure keeps track 
 * of a selection, which can be either an insertion point — the selection is 
 * then said to be _collapsed_ — or a range of atoms.
 * 
 * See {@linkcode EditableMathlist}
 * 
 * @module editor/editableMathlist
 * @private
 */
define([
    'mathlive/core/definitions', 
    'mathlive/core/mathAtom', 
    'mathlive/core/lexer', 
    'mathlive/core/parser', 
    'mathlive/editor/editor-mathpath'], 
    function(Definitions, MathAtom, Lexer, ParserModule, MathPath) {


/**
 * 
 * **Note**
 * - Method names that _begin with_ an underbar `_` are private and meant
 * to be used only by the implementation of the class.
 * - Method names that _end with_ an underbar `_` are selectors. They can 
 * be invoked by calling the `perform()` function of a `MathField` object.
 * They will be dispatched to an instance of `MathEditableList` as necessary.
 * Note that the selector name does not include the underbar.
 * 
 * For example:
 * ```
 *    mf.perform('selectAll');
 * ```
 * 
 * @param {Object} config
 * @property {Array.<MathAtom>} root - The root element of the math expression.
 * @property {Array.<Object>} path - The path to the element that is the 
 * anchor for the selection.
 * @property {number} extent - Number of atoms in the selection. `0` if the
 * selection is collapsed.
 * @property {Object} config
 * @property {boolean} suppressSelectionChangeNotifications - If true, 
 * the handlers for notification change won't be called. @todo This is an 
 * inelegant solution to deal with iterating the expression, which has the 
 * side effect of temporarily changing the path. We should have an iterator
 * that doesn't change the path instead.
 * @class
 * @global
 * @memberof module:editor/editableMathlist
 */
function EditableMathlist(config) {
    this.root = MathAtom.makeRoot();
    
    this.path = [{relation: 'children', offset: 0}];
    this.extent = 0;

    this.config = Object.assign({}, config);
    
    this.contentIsChanging = false;
    this.suppressSelectionChangeNotifications = false;
}


/**
 * Iterate over each atom in the expression, starting with the focus.
 * 
 * Return an array of all the paths for which the callback predicate
 * returned true.
 * 
 * @param {function} cb - A predicate being passed a path and the atom at this
 * path. Return true to include the designated atom in the result.
 * @param {number} dir - `+1` to iterate forward, `-1` to iterate backward.
 * @return {MathAtom[]} The atoms for which the predicate is true
 * @method EditableMathlist#filter
 * @private
 */
EditableMathlist.prototype.filter = function(cb, dir) {
    const suppressed = this.suppressSelectionChangeNotifications;
    this.suppressSelectionChangeNotifications = true;

    dir = dir === +1 ? +1 : -1;

    const result = [];
    const originalExtent = this.extent;
    if (dir >= 0) {
        this.collapseForward();
    } else {
        this.collapseBackward();
    }
    const initialPath = MathPath.pathToString(this.path);
    do {
        if (cb.bind(this)(this.path, this.anchor())) {
            result.push(this.toString());
        }
        if (dir >= 0) {
            this.next();
        } else {
            this.previous();
        }
    } while (initialPath !== MathPath.pathToString(this.path));

    this.extent = originalExtent;

    this.suppressSelectionChangeNotifications = suppressed;

    return result;
}


/**
 * Return a string representation of the selection.
 * @todo This is a bad name for this function, since it doesn't return 
 * a representation of the content, which one might expect...
 * 
 * @return {string}
 * @method EditableMathlist#toString
 * @private
 */
EditableMathlist.prototype.toString = function() {
    let result = MathPath.pathToString(this.path);
    if (this.extent !== 0) {
        result += '#' + this.extent;
    }
    return result;
}


/** 
 * When changing the selection, if the former selection is an empty list,
 * insert a placeholder if necessary. For example, if in an empty numerator.
*/
EditableMathlist.prototype.adjustPlaceholder = function() {
    // Should we insert a placeholder?
    // Check if we're an empty list that is the child of a fraction
    const siblings = this.siblings();
    if (siblings.length <= 1) {
        if (this.relation() === 'numer') {
            const mathlist = [new MathAtom.MathAtom('math', 'placeholder', 'numerator')];
            Array.prototype.splice.apply(siblings, [1, 0].concat(mathlist));
        } else if (this.relation() === 'denom') {
            const mathlist = [new MathAtom.MathAtom('math', 'placeholder', 'denominator')];
            Array.prototype.splice.apply(siblings, [1, 0].concat(mathlist));
        } else if (this.relation() === 'body') {
            // Surd (roots)
            const mathlist = [new MathAtom.MathAtom('math', 'placeholder', 'root')];
            Array.prototype.splice.apply(siblings, [1, 0].concat(mathlist));
        }
}

}

EditableMathlist.prototype.selectionWillChange = function() {
    if (!this.suppressSelectionChangeNotifications) {
        if (this.config.onSelectionWillChange) this.config.onSelectionWillChange();
    }
}

EditableMathlist.prototype.selectionDidChange = function() {
    if (!this.suppressSelectionChangeNotifications) {
        if (this.config.onSelectionDidChange) this.config.onSelectionDidChange();
    }
}

EditableMathlist.prototype.setPath = function(selection, extent) {
    // Convert to a path array if necessary
    if (typeof selection === 'string') {
        selection = MathPath.pathFromString(selection);
    } else if (Array.isArray(selection)) {
        // need to temporarily change the path of this to use 'sibling()'
        const newPath = MathPath.clone(selection);
        const oldPath = this.path;
        this.path = newPath;
        if (extent === 0 && this.anchor().type === 'placeholder') {
            extent = 1;             // select the placeholder
        }
        selection = {
            path: newPath,
            extent: extent || 0
        };
        this.path = oldPath;
    }

    const pathChanged = MathPath.pathDistance(this.path, selection.path) !== 0;
    const extentChanged = selection.extent !== this.extent;

    if (pathChanged || extentChanged) {
        if (pathChanged) {
            this.adjustPlaceholder();
        }
        this.selectionWillChange();

        this.path = MathPath.clone(selection.path);
        
        console.assert(this.siblings().length >= this.anchorOffset());

        this.setExtent(selection.extent);

        this.selectionDidChange();
    }
}

/**
 * Extend the selection between `to` and `from` nodes
 * 
 * @param {string[]} from
 * @param {string[]} to
 * @method EditableMathlist#setRange
 * @private
 */
EditableMathlist.prototype.setRange = function(from, to) {

    // Measure the 'distance' between `from` and `to`
    const distance = MathPath.pathDistance(from, to);
    if (distance === 0) {
        // `from` and `to` are equal.
        // Set the path to a collapsed insertion point
        this.setPath(from, 0);
    } else if (distance === 1) {
        // They're siblings, set an extent
        const extent = to[to.length - 1].offset - from[from.length - 1].offset;
        const path = MathPath.clone(from);
        path[path.length - 1] = { 
            relation : path[path.length - 1].relation,
            offset : path[path.length - 1].offset + 1,
        }
        this.setPath(path, extent);
    } else {
        // They're neither identical, not siblings.
        
        // Find the common ancestor between the nodes
        let commonAncestor = MathPath.pathCommonAncestor(from, to);
        const ancestorDepth = commonAncestor.length;
        if (from.length === ancestorDepth || to.length === ancestorDepth ||
            from[ancestorDepth].relation !== to[ancestorDepth].relation) {
            this.setPath(commonAncestor, 1);
        } else {
            commonAncestor.push(from[ancestorDepth]);
            commonAncestor = MathPath.clone(commonAncestor);

            let extent = to[ancestorDepth].offset - from[ancestorDepth].offset;

            if (extent <= 0) {
                if (to.length > ancestorDepth + 1) {
                    commonAncestor[ancestorDepth].relation = to[ancestorDepth].relation;
                    commonAncestor[ancestorDepth].offset = to[ancestorDepth].offset;
                    extent = -extent;
                } else {
                    commonAncestor[ancestorDepth].relation = to[ancestorDepth].relation;
                    commonAncestor[ancestorDepth].offset = to[ancestorDepth].offset + 1;
                    extent = -extent - 1;
                }
            } else if (to.length > from.length) {
                commonAncestor = MathPath.clone(commonAncestor);
                commonAncestor[commonAncestor.length - 1].offset +=  1;
                extent -= 1;
            }

            this.setPath(commonAncestor, extent + 1);
        }
    }
}




/**
 * @param {number} ancestor distance from self to ancestor. 
 * - `ancestor` = 0: self
 * - `ancestor` = 1: parent
 * - `ancestor` = 2: grand-parent
 * - etc...
 * @method EditableMathlist#ancestor
 * @private
 */
EditableMathlist.prototype.ancestor = function(ancestor) {
    // If the requested ancestor goes beyond what's available, 
    // return null
    if (ancestor > this.path.length) return null;

    // Start with the root
    let result = this.root;

    // Iterate over the path segments, selecting the appropriate 
    for (let i = 0; i < (this.path.length - ancestor); i++) {
        const segment = this.path[i];
        if (segment.relation === 'array') {
            result = result.array[segment.row][segment.col];
        } else {
            result = result[segment.relation][segment.offset];
        }
    }

    return result;
}

/**
 * The atom where the selection starts. When the selection is extended 
 * the anchor remains fixed. The anchor could be either before or 
 * after the focus.
 * 
 * @method EditableMathlist#anchor
 * @private
 */
EditableMathlist.prototype.anchor = function() {
    return this.siblings()[this.anchorOffset()];
}

/**
 * The atom which is the focus of the selection.
 * 
 * A new item would be inserted **after** the focus.
 * Note that when the selection is collapsed, that is when it it a single 
 * insertion point, the anchor and the focus are the same.
 * 
 * If the focus is before the first element in the root mathlist, it is null.
 * @method EditableMathlist#focus
 * @private
 */
EditableMathlist.prototype.focus = function() {
    return this.sibling(this.extent);
}

EditableMathlist.prototype.parent = function() {
    return this.ancestor(1);
}

EditableMathlist.prototype.relation = function() {
    return this.path[this.path.length - 1].relation;
}

EditableMathlist.prototype.anchorOffset = function() {
    return this.path[this.path.length - 1].offset;
}

EditableMathlist.prototype.focusOffset = function() {
    return this.path[this.path.length - 1].offset + this.extent;
}

/**
 * Offset of the first atom included in the selection
 * i.e. `=1` => selection starts with and includes first atom
 * With expression _x=_ and atoms :
 * - 0: _<first>_
 * - 1: _x_
 * - 2: _=_
 * 
 * - if caret is before _x_:  `start` = 0, `end` = 0
 * - if caret is after _x_:   `start` = 1, `end` = 1
 * - if _x_ is selected:      `start` = 1, `end` = 2
 * - if _x=_ is selected:   `start` = 1, `end` = 3
 * @method EditableMathlist#startOffset
 * @private
 */
EditableMathlist.prototype.startOffset = function() {
    return Math.min(this.path[this.path.length - 1].offset, 
                    this.path[this.path.length - 1].offset + this.extent);
}

/**
 * Offset of the first atom not included in the selection
 * i.e. max value of `siblings.length`  
 * `endOffset - startOffset = extent`
 * @method EditableMathlist#endOffset
 * @private
 */
EditableMathlist.prototype.endOffset = function() {
    return Math.max(this.path[this.path.length - 1].offset, 
                    this.path[this.path.length - 1].offset + this.extent);
}

/**
 * If necessary, insert a `first` atom in the sibling list.
 * If there's already a `first` atom, do nothing.
 * The `first` atom is used as a 'placeholder' to hold the blinking caret when
 * the caret is positioned at the very beginning of the mathlist.
 * @method EditableMathlist#insertFirstAtom
 * @private
 */
EditableMathlist.prototype.insertFirstAtom = function() {
    this.siblings();
}


/**
 * @return {MathAtom[]} array of children of the parent
 * @method EditableMathlist#siblings
 * @private
 */
EditableMathlist.prototype.siblings = function() {
    const siblings = this.parent()[this.relation()];

    // If the 'first' math atom is missing, insert it
    if (siblings.length === 0 || siblings[0].type !== 'first') {
        const firstAtom = new MathAtom.MathAtom(this.parent().parseMode, 'first', null);
        siblings.unshift(firstAtom);
    }

    return siblings;
}


/**
 * Sibling, relative to `anchor`
 * `sibling(0)` = anchor
 * `sibling(-1)` = sibling immediately left of anchor
 * @return {MathAtom}
 * @method EditableMathlist#sibling
 * @private
 */
EditableMathlist.prototype.sibling = function(offset) {
    const siblingOffset = this.anchorOffset() + offset;
    const siblings = this.siblings();
    if (siblingOffset < 0 || siblingOffset > siblings.length) return null;

    return siblings[siblingOffset]
}


/**
 * @return {boolean} True if the selection is an insertion point.
 * @method EditableMathlist#isCollapsed
 */
EditableMathlist.prototype.isCollapsed = function() {
    return this.extent === 0;
}

/**
 * @param {number} extent
 * @method EditableMathlist#setExtent
 * @private
 */
EditableMathlist.prototype.setExtent = function(extent) {
    // const anchorOffset = this.anchorOffset();
    // extent = Math.max(-anchorOffset,
    //         Math.min(extent, this.siblings().length - anchorOffset));
    this.extent = extent;
}

EditableMathlist.prototype.collapseForward = function() {
    if (this.isCollapsed()) return false;

    // this.setSelection(
    //     Math.max(this.anchorOffset() - 2, this.focusOffset() - 2));
    this.setSelection(
        Math.max(this.anchorOffset(), this.focusOffset()) - 1);
    return true;
}

EditableMathlist.prototype.collapseBackward = function() {
    if (this.isCollapsed()) return false;

    this.setSelection( 
        Math.min(this.anchorOffset(), this.focusOffset()));
    return true;
}



/**
 * Select all the atoms in the current group, that is all the siblings.
 * When the selection is in a numerator, the group is the numerator. When 
 * the selection is a superscript or subscript, the group is the supsub.
 * @method EditableMathlist#selectGroup_
 */
EditableMathlist.prototype.selectGroup_ = function() {
    this.setSelection(1, 'end');
}


/**
 * Select all the atoms in the math field.
 * @method EditableMathlist#selectAll_
 */
EditableMathlist.prototype.selectAll_ = function() {
    this.path = [{relation: 'children', offset: 0}];
    this.setSelection(1, 'end');
}

/**
 * 
 * @param {MathAtom} atom 
 * @param {MathAtom} target 
 * @return {boolean} True if  `atom` is the target, or if one of the 
 * children of `atom` contains the target
 * @function atomContains
 * @private
 */
function atomContains(atom, target) {
    if (!atom) return false;
    if (Array.isArray(atom)) {
        for (const child of atom) {
            if (atomContains(child, target)) return true;
        }
    } else {
        if (atom === target) return true;

        if (['array', 'children', 'numer', 'denom', 
            'body', 'offset', 'subscript', 'superscript']
            .some(function(value) { 
                return value === target || atomContains(atom[value], target)
            } )) return true;
    }
    return false;
}


/**
 * @param {MathAtom} atom
 * @return {boolean} True if `atom` is within the selection range
 * @todo: poorly named, since this is specific to the selection, not the math 
 * field
 * @method EditableMathlist#contains
 * @private
 */
EditableMathlist.prototype.contains = function(atom) {
    if (this.isCollapsed()) return false;
    if (this.relation() === 'array') {
        return false;   /// @TODO
    }
    const siblings = this.siblings()
    const firstOffset = this.startOffset();
    const lastOffset = this.endOffset();
    for (let i = firstOffset; i < lastOffset; i++) {
        if (atomContains(siblings[i], atom)) return true;
    }
    return false;
}

/**
 * @return {MathAtom[]} The currently selected atoms, or `null` if the 
 * selection is collapsed
 * @method EditableMathlist#extractContents
 * @private
 */
EditableMathlist.prototype.extractContents = function() {
    if (this.isCollapsed()) return null;
    const result = [];

    const siblings = this.siblings();
    const firstOffset = this.startOffset();
    if (firstOffset < siblings.length) {
        // const lastOffset = Math.min(siblings.length, this.endOffset());
        const endOffset = Math.min(siblings.length, this.endOffset());
        for (let i = firstOffset; i < endOffset; i++) {
            result.push(siblings[i]);
        }
    }
    return result;
}

EditableMathlist.prototype.extractGroupBeforeSelection = function() {
    const siblings = this.siblings();    
    if (siblings.length <= 1) return null;

    const result = [];

    const lastOffset = !this.isCollapsed() ? this.startOffset() - 1 : this.startOffset(); 
    for (let i = 1; i <= lastOffset; i++) {
        if (siblings[i].type !== 'first') {
            result.push(siblings[i]);
        }
    }

    return result.length > 0 ? result : null;
}

EditableMathlist.prototype.extractGroupAfterSelection = function() {
    const siblings = this.siblings();    
    if (siblings.length <= 1) return null;

    const result = [];

    const lastOffset = siblings.length - 1;
    const start = !this.isCollapsed() ? this.endOffset() : this.endOffset() + 1;
    for (let i = start; i <= lastOffset; i++) {
        if (siblings[i].type !== 'first') {
            result.push(siblings[i]);
        }
    }

    return result.length > 0 ? result : null;
}

/**
 * @return {string} 
 * @method EditableMathlist#extractGroupStringBeforeInsertionPoint
 * @private
 */
EditableMathlist.prototype.extractGroupStringBeforeInsertionPoint = function() {
    const siblings = this.siblings();    
    if (siblings.length <= 1) return '';

    let result = '';
    const lastOffset = this.startOffset();
    for (let i = 1; i <= lastOffset; i++) {
        // If the sibling has no value (for example it's a compound math atom)
        // use the REPLACEMENT CHARACTER as a placeholder. This will prevent
        // the sequence "-1/x=" to match "-=" with "\\equiv"
        if (['mord', 'mbin', 'mrel', 'mopen', 'mclose', 'minner'].includes(siblings[i].type)) {
            result += siblings[i].value || '\ufffd';
        } else {
            result += '\ufffd';
        }
    }
    return result;
}


/**
 * Return a `{start:, end:}` for the offsets of the command around the insertion
 * point, or null.
 * - `start` is the first atom which is of type `command`
 * - `end` is after the last atom of type `command`
 * @return {Object}
 * @method EditableMathlist#commandOffsets
 * @private
 */
EditableMathlist.prototype.commandOffsets = function() {
    const siblings = this.siblings();    
    if (siblings.length <= 1) return null;

    let start = Math.min(this.endOffset(), siblings.length - 1);
    // let start = Math.max(0, this.endOffset());
    if (siblings[start].type !== 'command') return null;
    while (start > 0 && siblings[start].type === 'command') start -= 1;

    let end = this.startOffset() + 1;
    while (end <= siblings.length - 1 && siblings[end].type === 'command') end += 1;
    if (end > start) {
        return {start: start + 1, end: end};
    }
    return null;
}

/**
 * @return {string} 
 * @method EditableMathlist#extractCommandStringAroundInsertionPoint
 * @private
 */
EditableMathlist.prototype.extractCommandStringAroundInsertionPoint = function() {
    let result = '';

    const command = this.commandOffsets();
    if (command) {
        const siblings = this.siblings();    
        for (let i = command.start; i < command.end; i++) {
            result += siblings[i].value || '';
        }
    }
    return result;
}

/**
 * @param {boolean} value If true, decorate the command string around the 
 * insertion point with an error indicator (red dotted underline). If false,
 * remove it.
 * @method EditableMathlist#decorateCommandStringAroundInsertionPoint
 * @private
 */
EditableMathlist.prototype.decorateCommandStringAroundInsertionPoint = function(value) {
    const command = this.commandOffsets();
    if (command) {
        const siblings = this.siblings();
        // if (siblings[command.start].value === '\\' || 
        //     siblings[command.start].value === '\u0027') {
        //     command.start += 1;
        // }
        for (let i = command.start; i < command.end; i++) {
            siblings[i].error = value;
        }
    }
}

/**
 * @return {string} 
 * @method EditableMathlist#commitCommandStringBeforeInsertionPoint
 * @private
 */
EditableMathlist.prototype.commitCommandStringBeforeInsertionPoint = function() {
    const command = this.commandOffsets();
    if (command) {
        const siblings = this.siblings();
        const anchorOffset = this.anchorOffset() + 1;
        for (let i = command.start; i < anchorOffset; i++) {
            siblings[i].suggestion = false;
        }
    }
}


EditableMathlist.prototype.spliceCommandStringAroundInsertionPoint = function(mathlist) {
    const command = this.commandOffsets();
    if (command) {
        Array.prototype.splice.apply(this.siblings(), 
            [command.start, command.end - command.start].concat(mathlist));

        let newPlaceholders = [];
        for (const atom of mathlist) {
            newPlaceholders = newPlaceholders.concat(atom.filter(
                atom => atom.type === 'placeholder'));
        }
        this.setExtent(0);

        // Set the anchor offset to a reasonable value that can be used by 
        // leap(). In particular, the current offset value may be invalid
        // if the length of the mathlist is shorter than the name of the command
        this.path[this.path.length - 1].offset = command.start - 1;

        if (newPlaceholders.length === 0 || !this.leap()) {
            this.setSelection(command.start + mathlist.length - 1);
        }
    }
}

/**
 * @return {string} 
 * @method EditableMathlist#extractContentsOrdInGroupBeforeInsertionPoint
 * @private
 */
EditableMathlist.prototype.extractContentsOrdInGroupBeforeInsertionPoint = function() {
    const result = [];
    const siblings = this.siblings();
    
    if (siblings.length <= 1) return [];

    let i = this.startOffset();
    while (i >= 1 && siblings[i].type === 'mord') {
        result.unshift(siblings[i]);
        i--
    }

    return result;
}


/**
 * @param {number} offset
 * - &gt;0: index of the child in the group where the selection will start from
 * - <0: index counting from the end of the group
 * @param {number|string} [extent=0] Number of items in the selection:
 * - 0: collapsed selection, single insertion point
 * - &gt;0: selection extending _after_ the offset
 * - <0: selection extending _before_ the offset
 * - `'end'`: selection extending to the end of the group
 * - `'start'`: selection extending to the beginning of the group
 * @param {string} relation e.g. `'children'`, `'superscript'`, etc...
 * @return {boolean} False if the relation is invalid (no such children)
 * @method EditableMathlist#setSelection
 * @private
 */
EditableMathlist.prototype.setSelection = function(offset, extent, relation) {
    // If no relation ("children", "superscript", etc...) is specified
    // keep the current relation
    const oldRelation = this.path[this.path.length - 1].relation;
    if (!relation) relation = oldRelation;

    // If the relation is invalid, exit and return false    
    const parent = this.parent();
    if (!parent && relation !== 'children') return false;
    if (!parent[relation]) return false;

    const relationChanged = relation !== oldRelation;

    offset = offset || 0;

    // Temporarily set the path to the potentially new relation to get the 
    // right siblings
    this.path[this.path.length - 1].relation = relation;

    // Invoking siblings() will have the side-effect of adding the 'first' 
    // atom if necessary
    const siblings = this.siblings();

    // Restore the relation
    this.path[this.path.length - 1].relation = oldRelation;


    // Calculate the new offset
    if (offset < 0) {
        offset = siblings.length + offset;
    }
    offset = Math.max(0, Math.min(offset, siblings.length));

    const oldOffset = this.path[this.path.length - 1].offset;
    const offsetChanged = oldOffset !== offset;

    const oldExtent = this.extent;
    extent = extent || 0;
    if (extent === 'end') {
        extent = siblings.length - offset;
        if (extent === 0) {
            offset -= 1;
        }
    } else if (extent === 'start') {
        extent = -offset;
        if (extent === 0) {
            offset -= 1;
        }
    }
    this.setExtent(extent);
    const extentChanged = this.extent !== oldExtent;
    this.setExtent(oldExtent);

    if (relationChanged || offsetChanged || extentChanged) {
        if (relationChanged) {
            this.adjustPlaceholder();
        }
        this.selectionWillChange();

        this.path[this.path.length - 1].relation = relation;
        this.path[this.path.length - 1].offset = offset;
        this.setExtent(extent);

        this.selectionDidChange();
    }

    return true;
} 

/**
 * Move the anchor to the next permissible atom
 * @method EditableMathlist#next
 * @private
 */
EditableMathlist.prototype.next = function() {
    const NEXT_RELATION = {
        'children': 'array',
        'array': 'numer',
        'numer': 'denom',
        'denom': 'index',
        'index': 'body',
        'body': 'subscript',
        'subscript': 'superscript'
    }
    if (this.anchorOffset() === this.siblings().length - 1) {
        // We've reached the end of these siblings.
        // Is there another set of siblings to consider?
        let relation = NEXT_RELATION[this.relation()];
        while (relation && !this.setSelection(0, 0, relation)) {
            relation = NEXT_RELATION[relation];
        }
        // We found a new relation/set of siblings...
        if (relation) return;

        this.adjustPlaceholder();

        this.selectionWillChange();

        // No more siblings, go up to the parent.
        if (this.path.length === 1) {
            // Invoke handler and perform default if they return true.
            if (this.suppressSelectionChangeNotifications || 
                !this.config.onMoveOutOf || 
                this.config.onMoveOutOf(this, +1)) {
                // We're at the root, so loop back
                this.path[0].offset = 0;
            }
        } else {
            this.path.pop();
        }

        this.selectionDidChange();
        return;
    }

    // Still some siblings to go through. Move on to the next one.
    this.setSelection(this.anchorOffset() + 1);

    // If the new anchor is a compound atom, dive into its components
    const anchor = this.anchor();
    if (!anchor.captureSelection) {
        // Only dive in if the atom allows capture of the selection by 
        // its sub-elements
        let relation = 'children';
        while (relation) {
            if (anchor[relation]) {
                this.path.push({relation:relation, offset: 0});
                this.insertFirstAtom();
                return;
            }
            relation = NEXT_RELATION[relation];
        }
    }
}

EditableMathlist.prototype.previous = function() {
    const PREVIOUS_RELATION = {
        'array': 'children',
        'numer': 'array',
        'denom': 'numer',
        'index': 'denom',
        'body': 'index',
        'subscript': 'body',
        'superscript': 'subscript'
    }
    if (this.anchorOffset() < 1) {
        // We've reached the first of these siblings.
        // Is there another set of siblings to consider?
        let relation = PREVIOUS_RELATION[this.relation()];
        while (relation && !this.setSelection(-1, 0 , relation)) {
            relation = PREVIOUS_RELATION[relation];
        }
        // We found a new relation/set of siblings...
        if (relation) return;

        this.adjustPlaceholder();

        this.selectionWillChange();

        // No more siblings, go up to the parent.
        if (this.path.length === 1) {
            // Invoke handler and perform default if they return true.
            if (this.suppressSelectionChangeNotifications || 
                !this.config.onMoveOutOf || 
                this.config.onMoveOutOf(this, -1)) {
                // We're at the root, so loop back
                this.path[0].offset = this.root.children.length - 1;
            }
        } else {
            this.path.pop();
            this.setSelection(this.anchorOffset() - 1);
        }

        this.selectionDidChange();
        return;
    }

    // If the new anchor is a compound atom, dive into its components
    const anchor = this.anchor();
    if (!anchor.captureSelection) {
        // Only dive in if the atom allows capture of the selection by 
        // its sub-elements
        let relation = 'superscript';
        while (relation) {
            if (anchor[relation]) {
                
                this.path.push({relation:relation, 
                    offset: anchor[relation].length - 1});

                this.setSelection(-1, 0, relation);
                return;
            }
            relation = PREVIOUS_RELATION[relation];
        }
    }
    // There wasn't a component to navigate to, so...
    // Still some siblings to go through: move on to the previous one.
    this.setSelection(this.anchorOffset() - 1);
}

EditableMathlist.prototype.move = function(dist, options) {
    options = options || {extend: false};
    const extend = options.extend || false;

    this.removeSuggestion();

    if (extend) {
        this.extend(dist, options);
    } else {
        const previousParent = this.parent();
        const previousRelation = this.relation();
        const previousSiblings = this.siblings();

        if (dist > 0) {
            if (this.collapseForward()) dist--;
            while (dist > 0) {
                this.next();
                dist--;
            }
        } else if (dist < 0) {
            this.collapseBackward();
            while (dist !== 0) {
                this.previous();
                dist++;
            }
        }

        // If the siblings list we left was empty, remove the relation
        if (previousSiblings.length <= 1) {
            if (['superscript', 'subscript', 'index'].includes(previousRelation)) {
                previousParent[previousRelation] = null;
            }
        }
    }
    this.config.announceChange("move");
}

EditableMathlist.prototype.up = function(options) {
    options = options || {extend: false};
    const extend = options.extend || false;

    this.collapseForward();

    if (this.relation() === 'denom') {
        if (extend) {
            this.path.pop();
            this.setExtent(1);
        } else {
            this.setSelection(this.anchorOffset(), 0, 'numer');
        }
        this.config.announceChange("moveUp");
    } else {
        this.config.announceChange("line");
    }
}

EditableMathlist.prototype.down = function(options) {
    options = options || {extend: false};
    const extend = options.extend || false;

    this.collapseForward();

    if (this.relation() === 'numer') {
        if (extend) {
            this.path.pop();
            this.setExtent(1);
        } else {
            this.setSelection(this.anchorOffset(), 0, 'denom');
        }
        this.config.announceChange("moveDown");
    } else {
        this.config.announceChange("line");       
    }
}

/**
 * Change the range of the selection
 * 
 * @param {number} dist - The change (positive or negative) to the extent
 * of the selection. The anchor point does not move.
 * @method EditableMathlist#extend
 * @private
 */
EditableMathlist.prototype.extend = function(dist) {
    let offset = this.path[this.path.length - 1].offset;
    let extent = 0;

    // If the selection is collapsed, the anchor indicates where
    // the *following* item should be inserted, so move to that item
    // and start selecting
    if (this.isCollapsed()) {
        offset += 1;
    }

    extent = this.extent + dist;
    const newFocusOffset = offset + extent;
    if (newFocusOffset <= 0) {
        // We're trying to extend beyond the first element.
        // Go up to the parent.
        if (this.path.length > 1) {
            this.path.pop();
            offset = this.path[this.path.length - 1].offset + 1;
            extent = -1;
        } else {
            // @todo exit left extend
            // offset -= 1;
            if (this.isCollapsed()) {
                offset -= 1;
            }
            extent -= dist;
        }
        
    } else if (newFocusOffset > this.siblings().length) {
        // We're trying to extend beyond the last element.
        // Go up to the parent
        if (this.path.length > 1) {
            this.path.pop();
            offset = this.anchorOffset();
            extent = 1;
        } else {
            // @todo exit right extend
            if (this.isCollapsed()) {
                offset -= 1;
            }
            extent -= 1;
        }

    }

    this.setSelection(offset, extent);
    this.config.announceChange("move");
}



/**
 * Move the selection focus to the next/previous point of interest.
 * A point of interest is an atom of a different type (mbin, mord, etc...)
 * than the current focus.
 * If `extend` is true, the selection will be extended. Otherwise, it is 
 * collapsed, then moved.
 * @param {number} dir +1 to skip forward, -1 to skip back
 * @param {Object} options
 * @method EditableMathlist#skip
 * @private
 */
EditableMathlist.prototype.skip = function(dir, options) {
    options = options || {extend: false};
    const extend = options.extend || false;
    dir = dir < 0 ? -1 : +1;

    const siblings = this.siblings();
    const focus = this.focusOffset();
    let offset = focus + (dir > 0 ? 1 : 0);
    offset = Math.max(0, Math.min(offset, siblings.length - 1));
    const type = siblings[offset].type;
    if ((offset === 0 && dir < 0) || 
        (offset === siblings.length - 1 && dir > 0)) {
        // If we've reached the end, just moved out of the list
        this.move(dir, options);
        return;
    } else if ((type === 'mopen' && dir > 0) || 
                (type === 'mclose' && dir < 0)) {
        // We're right before (or after) an opening (or closing)
        // fence. Skip to the balanced element (in level, but not necessarily in 
        // fence symbol). 
        let level = type === 'mopen' ? 1 : -1;
        offset += dir > 0 ? 1 : -1;
        while (offset >= 0 && offset < siblings.length && level !== 0) {
            if (siblings[offset].type === 'mopen') {
                level += 1;
            } else if (siblings[offset].type === 'mclose') {
                level -= 1;
            }
            offset += dir;
        }
        if (level !== 0) {
            // We did not find a balanced element. Just move a little.
            offset = focus + dir;
        }
        if (dir > 0) offset = offset - 1;
    } else {
        while (offset >= 0 && offset < siblings.length && siblings[offset].type === type) {
            offset += dir;
        }
        offset -= (dir > 0 ? 1 : 0);
    }
    if (extend) {
        this.extend(offset - focus);
    } else {
        this.setSelection(offset);
    }
    this.config.announceChange("move");
}

/**
 * Move to the next/previous expression boundary
 * @method EditableMathlist#jump
 * @private
 */
EditableMathlist.prototype.jump = function(dir, options) {
    options = options || {extend: false};
    const extend = options.extend || false;
    dir = dir < 0 ? -1 : +1;

    const siblings = this.siblings();
    let focus = this.focusOffset();
    if (dir > 0) focus = Math.min(focus + 1, siblings.length - 1);

    const offset = dir < 0 ? 0 : siblings.length - 1;

    if (extend) {
        this.extend(offset - focus);
    } else {
        this.move(offset - focus);
    }
    this.config.announceChange("move");
}

EditableMathlist.prototype.jumpToMathFieldBoundary = function(dir, options) {
    options = options || {extend: false};
    const extend = options.extend || false;
    dir = dir || +1;
    dir = dir < 0 ? -1 : +1;

    const path = [this.path[0]];
    let extent;

    if (!extend) {
        // Change the anchor to the end/start of the root expression
        path[0].offset = dir < 0 ? 0 : this.root.children.length - 1;
        extent = 0;
    } else {
        // Don't change the anchor, but update the extent
        if (dir < 0) {
            if (path[0].offset > 0) {
                // path[0].offset++;
                extent = -path[0].offset;
            } else {
                // @todo exit left extend
            }
        } else {
            if (path[0].offset < this.siblings().length - 1) {
                path[0].offset++;
                extent = this.siblings().length - path[0].offset;
            } else {
                // @todo exit right extend
            }
        }
    }

    this.setPath(path, extent);
    this.config.announceChange("move");
}

/**
 * Move to the next/previous placeholder or empty child list.
 * @return {boolean} False if no placeholder found and did not move
 * @method EditableMathlist#leap
 * @private
 */
EditableMathlist.prototype.leap = function(dir) {
    dir = dir || +1;    
    dir = dir < 0 ? -1 : +1;

    const placeholders = this.filter(function(path, atom) {
        return atom.type === 'placeholder' || this.siblings().length === 1;
    }, dir);
    
    // If no placeholders were found, call handler
    if (placeholders.length === 0) {
        if (this.config.onTabOutOf) {
            this.config.onTabOutOf(this, dir);
        } else {
            if (document.activeElement) {
                const focussableElements = 'a:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
                const focussable = Array.prototype.filter.call(document.querySelectorAll(focussableElements), function (element) {
                    return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
                });
                let index = focussable.indexOf(document.activeElement) + dir;
                if (index < 0) index = focussable.length - 1;
                focussable[index].focus();
            }
        }
        return false;
    }

    this.move(dir);

    if (this.anchor().type === 'placeholder') {
        // If we're already at a placeholder, move by one more (the placeholder
        // is right after the insertion point)
        this.move(dir);
    }


    // Set the selection to the next placeholder
    this.setPath(placeholders[0]);
    if (this.anchor().type === 'placeholder') this.setExtent(1);
    this.config.announceChange("move");
    return true;
}



EditableMathlist.prototype.parseMode = function() {
    const context = this.anchor();
    if (context) {
        if (context.type === 'commandliteral' || 
            context.type === 'esc' || 
            context.type === 'command') return 'command';
    }
    return 'math';
}



/**
 * @param {string} s
 * @param {Object} options
 * @param {string} options.insertionMode - One of 'replaceSelection', 
 * 'replaceAll', 'insertBefore' or 'insertAfter'.
 * @param {string} options.selectionMode - Describes where the selection 
 * will be after the insertion. One of 'placeholder' (the selection will be 
 * the first available placeholder in the item that has been inserted), 
 * 'after' (the selection will be an insertion point after the item that has 
 * been inserted), 'before' (the selection will be an insertion point before 
 * the item that has been inserted) or 'item' (the item that was inserted will
 * be selected).
 * @param {string} options.format - The format of the string `s`, one of 
 * `auto` (the string is interpreted as a latex fragment or command), `latex`
 * (the string is interpreted strictly as a latex fragment)
 * @method EditableMathlist#insert
 */
EditableMathlist.prototype.insert = function(s, options) {
    // Dispatch notifications
    if (this.config.onContentWillChange && !this.contentIsChanging) this.config.onContentWillChange();
    const contentWasChanging = this.contentIsChanging;
    this.contentIsChanging = true;

    options = options || {};
    
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';

    const parseMode = this.parseMode();
    let mathlist;

    // Save the content of the selection, if any
    const args = [this.extractContents()];

    // Delete any selected items
    if (options.insertionMode === 'replaceSelection') {
        this.delete_();
    } else if (options.insertionMode === 'replaceAll') {
        // Remove all the children of root, save for the 'first' atom
        this.root.children.splice(1);
        this.path = [{relation: 'children', offset: 0}];
    } else if (options.insertionMode === 'insertBefore') {
        this.collapseBackward();
    } else if (options.insertionMode === 'insertAfter') {
        this.collapseForward();
    }

    // Delete any placeholders before or after the insertion point
    const siblings = this.siblings();
    const firstOffset = this.startOffset();
    if (firstOffset + 1 < siblings.length && siblings[firstOffset + 1].type === 'placeholder') {
        this.delete_(1);
    } else if (firstOffset > 0 && siblings[firstOffset].type === 'placeholder') {
        this.delete_(-1);
    }

    if (options.format === 'auto') {
        if (parseMode === 'command') {
            // Short-circuit the tokenizer and parser if in command mode
            mathlist = [];
            for (const c of s) {
                const symbol = Definitions.matchSymbol('command', c);
                if (symbol) {
                    mathlist.push(new MathAtom.MathAtom('command', 'command', 
                        symbol.value, 'main'));
                }
            }
        } else if (s === '\u0027') {
            mathlist = [new MathAtom.MathAtom('command', 'command', '\\', 'main')];
        } else {
            // If we're inserting a fraction, and there was no selected content, 
            // use as the argument the `mord` atoms before the insertion point
            if (s === '\\frac{#0}{#?}' && (!args[0] || args[0].length === 0)) {
                args[0] = this.extractContentsOrdInGroupBeforeInsertionPoint();
                // Delete the implicit argument
                this.delete(-args[0].length - 1);
            }
            mathlist = ParserModule.parseTokens(Lexer.tokenize(s), parseMode, args);
        }
    } else if (options.format === 'latex') {
        mathlist = ParserModule.parseTokens(Lexer.tokenize(s), parseMode, args);
    }

    // Insert the mathlist at the position following the anchor
    Array.prototype.splice.apply(this.siblings(), 
        [this.anchorOffset() + 1, 0].concat(mathlist));

    // If needed, make sure there's a first atom in the siblings list
    this.insertFirstAtom();

    // Update the anchor's location
    if (options.selectionMode === 'placeholder') {
        // Move to the next placeholder
        let newPlaceholders = [];
        for (const atom of mathlist) {
            newPlaceholders = newPlaceholders.concat(atom.filter(
                atom => atom.type === 'placeholder'));
        }
        if (newPlaceholders.length === 0 || !this.leap()) {
            // No placeholder found, move to right after what we just inserted
            this.setSelection(this.anchorOffset() + mathlist.length);
            // this.path[this.path.length - 1].offset += mathlist.length;
        } else {
            this.config.announceChange("move");   // should have placeholder selected
        }
    } else if (options.selectionMode === 'before') {
        // Do nothing: don't change the anchorOffset.
    } else if (options.selectionMode === 'after') {
        this.setSelection(this.anchorOffset() + mathlist.length);        
    } else if (options.selectionMode === 'item') {
        this.setSelection(this.anchorOffset() + 1, mathlist.length);        
    }

    // Dispatch notifications
    this.contentIsChanging = contentWasChanging;
    if (this.config.onContentDidChange && !this.contentIsChanging) this.config.onContentDidChange();
}



EditableMathlist.prototype.positionInsertionPointAfterCommitedCommand = function() {
    const siblings = this.siblings();
    const command = this.commandOffsets();
    let i = command.start;
    while (i < command.end && !siblings[i].suggestion) {
        i++;
    }
    this.setSelection(i - 1);
}



EditableMathlist.prototype.removeSuggestion = function() {
    const siblings = this.siblings();
    // Remove all `suggestion` atoms
    for (let i = siblings.length - 1; i >= 0; i--) {
        if (siblings[i].suggestion) {
            siblings.splice(i, 1);
        }
    }
}

EditableMathlist.prototype.insertSuggestion = function(s, l) {
    this.removeSuggestion();

    const mathlist = [];

    // Make a mathlist from the string argument with the `suggestion` property set
    const subs = s.substr(l);
    for (const c of subs) {
        const atom = new MathAtom.MathAtom('command', 'command', c, 'main');
        atom.suggestion = true;
        mathlist.push(atom);
    }

    // Splice in the mathlist after the insertion point, but don't change the 
    // insertion point
    Array.prototype.splice.apply(this.siblings(), 
        [this.anchorOffset() + 1, 0].concat(mathlist));

}


/**
 * Delete multiple characters
 * @method EditableMathlist#delete
 */
EditableMathlist.prototype.delete = function(count) {
    count = count || 0;

    if (count === 0) {
        this.delete_(0);
    } else if (count > 0) {
        while (count > 1) {
            this.delete_(+1);
            count--;
        }
    } else {
        while (count < -1) {
            this.delete_(-1);
            count++;
        }
    }
}

/**
 * @param {number} dir If the selection is not collapsed, and dir is 
 * negative, delete backward, starting with the anchor atom. 
 * That is, delete(-1) will delete only the anchor atom.
 * If dir = 0, delete only if the selection is not collapsed
 * @method EditableMathlist#delete_
 * @instance
 */
EditableMathlist.prototype.delete_ = function(dir) {
    // Dispatch notifications
    if (this.config.onContentWillChange && !this.contentIsChanging) this.config.onContentWillChange();
    const contentWasChanging = this.contentIsChanging;
    this.contentIsChanging = true;

    dir = dir || 0;
    dir = dir < 0 ? -1 : (dir > 0 ? +1 : dir);

    this.removeSuggestion();

    const siblings = this.siblings();

    if (this.isCollapsed()) {
        const anchorOffset = this.anchorOffset();
        if (dir < 0) {
            if (anchorOffset !== 0) {
                // We're in the middle of the siblings
                this.config.announceChange("delete", siblings.slice(anchorOffset,anchorOffset + 1));
                siblings.splice(anchorOffset, 1);
                this.setSelection(anchorOffset - 1);
            } else {
                // We're at the beginning of the sibling list, delete what comes
                // before
                const relation = this.relation();
                if (relation === 'superscript' || relation === 'subscript') {
                    this.parent()[relation] = null;
                    this.path.pop();
                    this.config.announceChange("deleted: " + relation);
                } else if (relation === 'denom') {
                    // Fraction denominator
                    const numer = this.parent()['numer'];
                    numer.shift();    // Remove the 'first' atom
                    this.path.pop();
                    Array.prototype.splice.apply(this.siblings(), 
                        [this.anchorOffset(), 1].concat(numer));
                    this.setSelection(this.anchorOffset() + numer.length - 1);
                    this.config.announceChange("deleted: denominator");
                } else if (relation === 'body') {
                    // Root
                    const body = this.siblings();
                    body.shift();    // Remove the 'first' atom
                    this.path.pop();
                    Array.prototype.splice.apply(this.siblings(), 
                        [this.anchorOffset(), 1].concat(body));
                    this.setSelection(this.anchorOffset() + body.length - 1);
                    this.config.announceChange("deleted: root");
                } else {
                    // Numer, index, children
                    // @todo
                }

            }
        } else if (dir > 0) {
            if (anchorOffset !== siblings.length - 1) {
                this.config.announceChange("deleted", siblings.slice(anchorOffset + 1, anchorOffset + 2));
                siblings.splice(anchorOffset + 1, 1);
            } else {
                // We're at the end of the sibling list, delete what comes next
                const relation = this.relation();
                if (relation === 'superscript' || relation === 'subscript') {
                    this.parent()[relation] = null;
                    this.path.pop();
                    this.config.announceChange("deleted: " + relation);
                } else if (relation === 'numer') {
                    const denom = this.parent()['denom'];
                    denom.shift(); // Remove 'first' atom
                    this.path.pop();
                    Array.prototype.splice.apply(this.siblings(), 
                        [this.anchorOffset(), 1].concat(denom));
                    this.setSelection(this.anchorOffset() - 1);
                    this.config.announceChange("deleted: numerator");
                } else {
                    // @todo

                }
            }
        }
    } else {
        // There is a selection extent. Delete all the atoms within it.
        const first = this.startOffset();
        const last = this.endOffset();

        this.config.announceChange("deleted", siblings.slice(first, last));
        siblings.splice(first, last - first);

        // Adjust the anchor
        this.setSelection(first - 1);
    }

    // Dispatch notifications
    this.contentIsChanging = contentWasChanging;
    if (this.config.onContentDidChange && !this.contentIsChanging) this.config.onContentDidChange();
}


/**
 * @method EditableMathlist#moveToNextPlaceholder_
 */
EditableMathlist.prototype.moveToNextPlaceholder_ = function() { 
    this.leap(+1); 
}

/**
 * @method EditableMathlist#moveToPreviousPlaceholder_
 */
EditableMathlist.prototype.moveToPreviousPlaceholder_ = function() { 
    this.leap(-1); 
}

/**
 * @method EditableMathlist#moveToNextChar_
 */
EditableMathlist.prototype.moveToNextChar_ = function() { 
    this.move(+1);
}

/**
 * @method EditableMathlist#moveToPreviousChar_
 */
EditableMathlist.prototype.moveToPreviousChar_ = function() { 
    this.move(-1);
}

/**
 * @method EditableMathlist#moveUp_
 */
EditableMathlist.prototype.moveUp_ = function() { 
    this.up();
}

/**
 * @method EditableMathlist#moveDown_
 */
EditableMathlist.prototype.moveDown_ = function() { 
    this.down();
}

/**
 * @method EditableMathlist#moveToNextWord_
 */
EditableMathlist.prototype.moveToNextWord_ = function() { 
    this.skip(+1);
}

/**
 * @method EditableMathlist#moveToPreviousWord_
 */
EditableMathlist.prototype.moveToPreviousWord_ = function() { 
    this.skip(-1);
}

/**
 * @method EditableMathlist#moveToGroupStart_
 */
EditableMathlist.prototype.moveToGroupStart_ = function() { 
    this.setSelection(0);
}

/**
 * @method EditableMathlist#moveToGroupEnd_
 */
EditableMathlist.prototype.moveToGroupEnd_ = function() { 
    this.setSelection(-1);
}

/**
 * @method EditableMathlist#moveToMathFieldStart_
 */
EditableMathlist.prototype.moveToMathFieldStart_ = function() { 
    this.jumpToMathFieldBoundary(-1);
}

/**
 * @method EditableMathlist#moveToMathFieldEnd_
 */
EditableMathlist.prototype.moveToMathFieldEnd_ = function() { 
    this.jumpToMathFieldBoundary(+1);
}

/**
 * @method EditableMathlist#deleteNextChar_
 */
EditableMathlist.prototype.deleteNextChar_ = function() { 
    this.delete_(+1); 
}

/**
 * @method EditableMathlist#deletePreviousChar_
 */
EditableMathlist.prototype.deletePreviousChar_ = function() { 
    this.delete_(-1); 
}

/**
 * @method EditableMathlist#deleteNextWord_
 */
EditableMathlist.prototype.deleteNextWord_ = function() { 
    this.extendToNextBoundary();
    this.delete_();
}

/**
 * @method EditableMathlist#deletePreviousWord_
 */
EditableMathlist.prototype.deletePreviousWord_ = function() { 
    this.extendToPreviousBoundary();
    this.delete_();
}

/**
 * @method EditableMathlist#deleteToGroupStart_
 */
EditableMathlist.prototype.deleteToGroupStart_ = function() { 
    this.extendToGroupStart();
    this.delete_();
}

/**
 * @method EditableMathlist#deleteToGroupEnd_
 */
EditableMathlist.prototype.deleteToGroupEnd_ = function() { 
    this.extendToMathFieldStart();
    this.delete_();
}

/**
 * @method EditableMathlist#deleteToMathFieldEnd_
 */
EditableMathlist.prototype.deleteToMathFieldEnd_ = function() { 
    this.extendToMathFieldEnd();
    this.delete_();
}

/**
 * Swap the characters to either side of the insertion point and advances
 * the insertion point past both of them. Does nothing to a selected range of
 * text.
 * @method EditableMathlist#transpose_
 */
EditableMathlist.prototype.transpose_ = function() { 
    // @todo
}

/**
 * @method EditableMathlist#extendToNextChar_
 */
EditableMathlist.prototype.extendToNextChar_ = function() { 
    this.extend(+1);
}

/**
 * @method EditableMathlist#extendToPreviousChar_
 */
EditableMathlist.prototype.extendToPreviousChar_ = function() { 
    this.extend(-1);
}

/**
 * @method EditableMathlist#extendToNextWord_
 */
EditableMathlist.prototype.extendToNextWord_ = function() { 
    this.skip(+1, {extend:true});
}

/**
 * @method EditableMathlist#extendToPreviousWord_
 */
EditableMathlist.prototype.extendToPreviousWord_ = function() { 
    this.skip(-1, {extend:true});
}

/**
 * If the selection is in a denominator, the selection will be extended to
 * include the numerator.
 * @method EditableMathlist#extendUp_
 */
EditableMathlist.prototype.extendUp_ = function() { 
    this.up({extend:true});
}

/**
 * If the selection is in a numerator, the selection will be extended to
 * include the denominator.
 * @method EditableMathlist#extendDown_
 */
EditableMathlist.prototype.extendDown_ = function() { 
    this.down({extend:true});
}

/**
 * Extend the selection until the next boundary is reached. A boundary 
 * is defined by an atom of a different type (mbin, mord, etc...)
 * than the current focus. For example, in "1234+x=y", if the focus is between 
 * "1" and "2", invoking `extendToNextBoundary_` would extend the selection
 * to "234".
 * @method EditableMathlist#extendToNextBoundary_
 */
EditableMathlist.prototype.extendToNextBoundary_ = function() { 
    this.skip(+1, {extend:true});
}

/**
 * Extend the selection until the previous boundary is reached. A boundary 
 * is defined by an atom of a different type (mbin, mord, etc...)
 * than the current focus. For example, in "1+23456", if the focus is between 
 * "5" and "6", invoking `extendToPreviousBoundary` would extend the selection
 * to "2345".
 * @method EditableMathlist#extendToPreviousBoundary_
 */
EditableMathlist.prototype.extendToPreviousBoundary_ = function() { 
    this.skip(-1, {extend:true});
}

/**
 * @method EditableMathlist#extendToGroupStart_
 */
EditableMathlist.prototype.extendToGroupStart_ = function() { 
    this.setExtent(-this.anchorOffset());
}

/**
 * @method EditableMathlist#extendToGroupEnd_
 */
EditableMathlist.prototype.extendToGroupEnd_ = function() { 
    this.setExtent(this.siblings().length - this.anchorOffset());
}

/**
 * @method EditableMathlist#extendToMathFieldStart_
 */
EditableMathlist.prototype.extendToMathFieldStart_ = function() { 
    this.jumpToMathFieldBoundary(-1, {extend:true});
}

/**
 * Extend the selection to the end of the math field.
 * @method EditableMathlist#extendToMathFieldEnd_
 */
EditableMathlist.prototype.extendToMathFieldEnd_ = function() { 
    this.jumpToMathFieldBoundary(+1, {extend:true});
}

/**
 * Switch the cursor to the superscript and select it. If there is no subscript
 * yet, create one.
 * @method EditableMathlist#moveToSuperscript_
 */
EditableMathlist.prototype.moveToSuperscript_ = function() {
    this.collapseForward();
    if (!this.anchor().superscript) {
        if (this.anchor().subscript) {
            this.anchor().superscript = 
                [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)];
        } else {
            const sibling = this.sibling(1);
            if (sibling && sibling.superscript) {
                this.path[this.path.length - 1].offset += 1;
    //            this.setSelection(this.anchorOffset() + 1);
            } else if (sibling && sibling.subscript) {
                this.path[this.path.length - 1].offset += 1;
    //            this.setSelection(this.anchorOffset() + 1);
                this.anchor().superscript = 
                    [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)];
            } else {
                this.siblings().splice(
                    this.anchorOffset() + 1,
                    0,
                    new MathAtom.MathAtom(this.parent().parseMode, 'mord', '\u200b'));
                this.path[this.path.length - 1].offset += 1;
    //            this.setSelection(this.anchorOffset() + 1);
                this.anchor().superscript = 
                    [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)];
            }
        }
    }
    this.path.push({relation: 'superscript', offset: 0});
    this.selectGroup_();
}

/**
 * Switch the cursor to the subscript and select it. If there is no subscript
 * yet, create one.
 * @method EditableMathlist#moveToSubscript_
 */
EditableMathlist.prototype.moveToSubscript_ = function() { 
    this.collapseForward();
    if (!this.anchor().subscript) {
        if (this.anchor().superscript) {
            this.anchor().subscript = 
                [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)];
        } else {
            const sibling = this.sibling(1);
            if (sibling && sibling.subscript) {
                this.path[this.path.length - 1].offset += 1;
                // this.setSelection(this.anchorOffset() + 1);
            } else if (sibling && sibling.superscript) {
                this.path[this.path.length - 1].offset += 1;
                // this.setSelection(this.anchorOffset() + 1);
                this.anchor().subscript = 
                    [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)];
            } else {
                this.siblings().splice(
                    this.anchorOffset() + 1,
                    0,
                    new MathAtom.MathAtom(this.parent().parseMode, 'mord', '\u200b'));
                this.path[this.path.length - 1].offset += 1;
                // this.setSelection(this.anchorOffset() + 1);
                this.anchor().subscript = 
                    [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)];
            }
        }
    }
    this.path.push({relation: 'subscript', offset: 0});
    this.selectGroup_();
}

/**
 * If cursor is currently in:
 * - superscript: move to subscript, creating it if necessary
 * - subscript: move to superscript, creating it if necessary
 * - numerator: move to denominator
 * - denominator: move to numerator
 * - otherwise: do nothing and return false
 * @return {boolean} True if the move was possible. False is there is no
 * opposite to move to, in which case the cursors is left unchanged.
 * @method EditableMathlist#moveToOpposite_
 */
EditableMathlist.prototype.moveToOpposite_ = function() {
    const OPPOSITE_RELATIONS = {
        'children': 'superscript',
        'superscript': 'subscript',
        'subscript': 'superscript',
        'denom': 'numer',
        'numer': 'denom', 
        'body': 'index'
    }
    const oppositeRelation = OPPOSITE_RELATIONS[this.relation()];
    if (!oppositeRelation) return false;

    if (oppositeRelation === 'superscript' || 
        oppositeRelation === 'subscript') {
        if (this.parent()[oppositeRelation]) {
            // If we have a supub, move to it
            this.path.pop();
            this.path.push({relation: oppositeRelation, offset: 1});
            this.setSelection(1, 'end');
        } else {
            // If we don't have the opposite of the supsub, add it now
            if (this.parent()[OPPOSITE_RELATIONS[oppositeRelation]]) {
                this.parent()[oppositeRelation] = [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)]; 
            } else {
                // Does the previous sibling have a \limits, if so, switch to its 
                // superscript, creating one if necessary

                // Need to add a supsub

                this.moveToSuperscript_();
            }
        }
    } else {
        if (!this.parent()[oppositeRelation]) {
            // Don't have children of the opposite relation yet
            // Add them
            this.parent()[oppositeRelation] = [new MathAtom.MathAtom(this.parent().parseMode, 'first', null)]; 
        }

        this.setSelection(1, 'end', oppositeRelation);
    }

    return true;
}

/**
 * @method EditableMathlist#moveBeforeParent_
 */
EditableMathlist.prototype.moveBeforeParent_ = function() {
    if (this.path.length > 1) {
        this.path.pop();
        this.setSelection(this.anchorOffset() - 1);
    }
}

/**
 * @method EditableMathlist#moveAfterParent_
 */
EditableMathlist.prototype.moveAfterParent_ = function() {
    if (this.path.length > 1) {
        this.path.pop();
        this.setExtent(0);
    }
}

/**
 * @method EditableMathlist#addRowAfter_
 */
EditableMathlist.prototype.addRowAfter_ = function() { 
    // @todo
}
/**
 * @method EditableMathlist#addRowBefore_
 */
EditableMathlist.prototype.addRowBefore_ = function() { 
    // @todo
}

/**
 * @method EditableMathlist#addColumnAfter_
 */
EditableMathlist.prototype.addColumnAfter_ = function() { 
    // @todo
}

/**
 * @method EditableMathlist#addColumnBefore_
 */
EditableMathlist.prototype.addColumnBefore_ = function() { 
    // @todo
}

function getSpeechOptions() {
    return {
        markup: true
    }
}

/**
 * @method EditableMathlist#speakSelection_
 */
EditableMathlist.prototype.speakSelection_ = function() {
    let text = "Nothing selected.";
    if (!this.isCollapsed()) {
        text = MathAtom.toSpeakableText(this.extractContents(), getSpeechOptions())
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

/**
 * @method EditableMathlist#speakParent_
 */
EditableMathlist.prototype.speakParent_ = function() { 
    // On ChromeOS: chrome.accessibilityFeatures.spokenFeedback
    let text = 'No parent.';
    const parent = this.parent();
    if (parent && parent.type !== 'root') {
        text = MathAtom.toSpeakableText(this.parent(), getSpeechOptions());
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

/**
 * @method EditableMathlist#speakRightSibling_
 */
EditableMathlist.prototype.speakRightSibling_ = function() { 
    let text = 'At the end.';
    const siblings = this.siblings();
    const first = this.startOffset() + 1;
    if (first < siblings.length - 1) {
        const adjSiblings = [];
        for (let i = first; i <= siblings.length - 1; i++) {
            adjSiblings.push(siblings[i]);
        }
        text = MathAtom.toSpeakableText(adjSiblings, getSpeechOptions());
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

/**
 * @method EditableMathlist#speakLeftSibling_
 */
EditableMathlist.prototype.speakLeftSibling_ = function() { 
    let text = 'At the beginning.';
    const siblings = this.siblings();
    const last = this.isCollapsed() ? this.startOffset() : this.startOffset() - 1;
    if (last >= 1) {
        const adjSiblings = [];
        for (let i = 1; i <= last; i++) {
            adjSiblings.push(siblings[i]);
        }
        text = MathAtom.toSpeakableText(adjSiblings, getSpeechOptions());
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}


/**
 * @method EditableMathlist#speakGroup_
 */
EditableMathlist.prototype.speakGroup_ = function() { 
    // On ChromeOS: chrome.accessibilityFeatures.spokenFeedback

    const utterance = new SpeechSynthesisUtterance(
            MathAtom.toSpeakableText(this.siblings(), getSpeechOptions()));
    window.speechSynthesis.speak(utterance);
}

/**
 * @method EditableMathlist#speakAll_
 */
EditableMathlist.prototype.speakAll_ = function() { 
    const utterance = new SpeechSynthesisUtterance(
        MathAtom.toSpeakableText(this.root, getSpeechOptions()));
    window.speechSynthesis.speak(utterance);
}


return {
    EditableMathlist: EditableMathlist
}


})
