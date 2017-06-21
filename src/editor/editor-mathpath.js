/**
 * @module editor/mathpath
 * @private
 */
define([], 
    function() {



/**
 * 
 * @memberof module:editor/mathpath
 * @param {*} path 
 */
function pathToString(path) {
    let result = '';
    for (const segment of path) {
        if (segment.relation === 'array') {
            result += 'array:' + segment.col + ',' + segment.row;
        } else {
            result += segment.relation;
            result += ':';
            result += segment.offset;
        }
        result += '/';
    }
    return result;
}


/**
 * 
 * @memberof module:editor/mathpath
 * @param {*} string 
 * @private
 */
function pathFromString(string) {
    // Reset the path
    const result = {};
    result.path = [];

    // Parse the selection extent, if present
    const m = string.match(/@([^,]*)$/);
    if (m) {
        string = string.match(/([^@]*)@/)[1];
    }

    // Parse the segments
    const segments = string.split('/');
    for (const segment of segments) {
        const m2 = segment.match(/([^:]*):(.*)/);
        if (m2) {
            const e = {relation: m2[1]};
            if (m2[1] === 'array') {
                const p = m2[2].split(',');
                e.col = parseInt(p[0]);
                e.row = parseInt(p[1]);
            } else {
                e.offset = parseInt(m2[2]);
            }
            result.path.push(e);
        }
    }


    result.extent = m ? parseInt(m[1]) : 0;

    return result;
}

/**
 * Given two paths, return a path representing their common ancestor.
 * 
 * @param {Array.<string>} p 
 * @param {Array.<string>} q 
 * @return {Array.<string>}
 * @memberof module:editor/mathpath
 * @private
 */
function pathCommonAncestor(p, q) {
    const result = [];
    const maxIndex = Math.min(p.length - 1, q.length - 1);
    let i = 0;
    while ( i <= maxIndex && 
            p[i].relation === q[i].relation && 
            p[i].offset === q[i].offset) {
        result.push(p[i]);
        i += 1;
    }
    return result;
}

/**
 * 
 * @param {Array.<string>} p 
 * @param {Array.<string>} q 
 * @return {number} 0 if the paths are identical
 *  - 1 if they are sibiling
 *  - >1 if they are not sibilings
 * @memberof module:editor/mathpath
 * @private
 */
function pathDistance(p, q) {
     let result = 0;
     let i = -1;
     let done = false;
     while (!done) {
        i += 1;
        done = i >= p.length || i >= q.length;
        done = done || 
            !(p[i].relation === q[i].relation && 
            p[i].offset === q[i].offset);
     }
    if (i === p.length && i === q.length) {
        // They're identical
        result = 0;     
    } else if (i + 1 === p.length && i + 1 === q.length &&
        p[i].relation === q[i].relation ) {
        // They're siblings
        result = 1;
    } else {
        result = 2;
    }

     return result;
}

// function MathIterator(root, path) {
//     this.root = root;
//     this.path = path ? path : [{relation: 'children', offset: 0}];
// }

/**
 * Move to the next permissible atom
 */
// MathIterator.prototype.next = function() {
//     const NEXT_RELATION = {
//         'children': 'array',
//         'array': 'numer',
//         'numer': 'denom',
//         'denom': 'index',
//         'index': 'body',
//         'body': 'subscript',
//         'subscript': 'superscript'
//     }
//     if (this.anchorOffset() === this.siblings().length - 1) {
//         // We've reached the end of these siblings.
//         // Is there another set of siblings to consider?
//         let relation = NEXT_RELATION[this.relation()];
//         while (relation && !this.setSelection(0, 0, relation)) {
//             relation = NEXT_RELATION[relation];
//         }
//         // We found a new relation/set of siblings...
//         if (relation) return;

//         // No more siblings, go up to the parent.
//         if (this.path.length === 1) {
//             // We're at the root, so loop back
//             this.path[0].offset = 0;
//             // @todo exit right not extend
//         } else {
//             this.path.pop();
//         }
//         return;
//     }

//     // Still some siblings to go through. Move on to the next one.
//     this.setSelection(this.anchorOffset() + 1);

//     // If the new anchor is a compound atom, dive into its components
//     const anchor = this.anchor();
//     let relation = 'children';
//     while (relation) {
//         if (anchor[relation]) {
//             this.path.push({relation:relation, offset: 0});
//             this.insertFirstAtom();
//             return;
//         }
//         relation = NEXT_RELATION[relation];
//     }
// }

// MathIterator.prototype.previous = function() {
//     const PREVIOUS_RELATION = {
//         'array': 'children',
//         'numer': 'array',
//         'denom': 'numer',
//         'index': 'denom',
//         'body': 'index',
//         'subscript': 'body',
//         'superscript': 'subscript'
//     }
//     if (this.anchorOffset() < 1) {
//         // We've reached the first of these siblings.
//         // Is there another set of siblings to consider?
//         let relation = PREVIOUS_RELATION[this.relation()];
//         while (relation && !this.setSelection(-1, 0 , relation)) {
//             relation = PREVIOUS_RELATION[relation];
//         }
//         // We found a new relation/set of siblings...
//         if (relation) return;

//         // No more siblings, go up to the parent.
//         if (this.path.length === 1) {
//             // We're at the root, so loop back
//             this.path[0].offset = this.root.children.length - 1;
//             // @todo exit left not extend
//         } else {
//             this.path.pop();
//             this.setSelection(this.anchorOffset() - 1);
//         }
//         return;
//     }

//     // If the new anchor is a compound atom, dive into its components
//     const anchor = this.anchor();
//     let relation = 'superscript';
//     while (relation) {
//         if (anchor[relation]) {
            
//             this.path.push({relation:relation, 
//                 offset: anchor[relation].length - 1});

//             this.setSelection(-1, 0, relation);
//             return;
//         }
//         relation = PREVIOUS_RELATION[relation];
//     }

//     // There wasn't a component to navigate to, so...
//     // Still some siblings to go through: move on to the previous one.
//     this.setSelection(this.anchorOffset() - 1);
// }


function clone(path) {
    return pathFromString(pathToString(path)).path;
}

return {
    pathFromString,
    pathToString,
    pathDistance,
    pathCommonAncestor,
    clone

}


})
