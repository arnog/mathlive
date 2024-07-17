"use strict";
exports.__esModule = true;
/*
 * See https://tex.stackexchange.com/questions/81752/
 * for a thorough description of the TeX atom type and their relevance to
 * proper kerning.
 *
 * See TeXBook p. 158 for a list of the "atom types"
 * Note: we are not using the following types: 'over', 'under', 'acc', 'rad',
 * 'vcent'
 */
var BOX_TYPE = [
    'ord',
    'bin',
    'op',
    'rel',
    'open',
    'close',
    'punct',
    'inner',
    'rad',
    'latex',
    'composition',
    'middle',
    'ignore',
    'lift',
    // if they were present instead of the box
    'skip', // A box that only has some horizontal spacing
]; // The const assertion prevents widening to string[]
