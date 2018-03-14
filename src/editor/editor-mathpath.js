/**
 * @module editor/mathpath
 * @private
 */
define([], 
    function() {



/**
 * 
 * @memberof module:editor/mathpath
 * @param {Object} path 
 * @param {number} extent
 * @return {string}
 * @private
 */
function pathToString(path, extent) {
    let result = '';
    for (const segment of path) {
        result += segment.relation + ':' + segment.offset + '/';
    }
    if (extent) {
        result += '#' + extent;
    }
    return result;
}


/**
 * 
 * @memberof module:editor/mathpath
 * @param {string} string 
 * @return {Object}
 * @private
 */
function pathFromString(string) {
    // Reset the path
    const result = {path: []};

    // Parse the selection extent, if present
    const m = string.match(/@([^,]*)$/);
    if (m) {
        string = string.match(/([^@]*)@/)[1];
    }
    result.extent = m ? parseInt(m[1]) : 0;

    // Parse the segments
    const segments = string.split('/');
    for (const segment of segments) {
        const m2 = segment.match(/([^:]*):(.*)/);
        if (m2) {
            result.path.push({
                relation: m2[1],
                offset: parseInt(m2[2])
            });
        }
    }

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
 *  - 1 if they are siblings
 *  - >1 if they are not siblings
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
// }

// MathIterator.prototype.previous = function() {
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
