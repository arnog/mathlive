/*global require:false*/
/*global define:false*/

/**
 * This file contains information and classes for the various kinds of styles
 * used in TeX. It provides a generic `Mathstyle` class, which holds information
 * about a specific style. It then provides instances of all the different kinds
 * of styles possible, and provides functions to move between them and get
 * information about them.
 * @module mathstyle
 */

define(['mathlive/core/fontMetrics'], function(FontMetrics){ 

const sigmas = FontMetrics.sigmas;

const metrics = [{}, {}, {}]; /* textstyle, scriptstyle, scriptscriptstyle */
let i;
for (const key in sigmas) {
    if (sigmas.hasOwnProperty(key)) {
        for (i = 0; i < 3; i++) {
            metrics[i][key] = sigmas[key][i];
        }
    }
}
for (i = 0; i < 3; i++) {
    metrics[i].emPerEx = sigmas.xHeight[i] / sigmas.quad[i];
}

/**
 * The main mathstyle class.
 * Contains:
 * @param {number} id unique id for the style
 * @param {number} size (which is the same for cramped and uncramped version of a style)
 * @param {number}  size multiplier, which gives the size difference between a style and
 * textstyle.
 * @param {boolean}  cramped flag

 * @class
 */
function Mathstyle(id, size, multiplier, cramped) {
    this.id = id;
    this.size = size;
    this.cramped = cramped;
    this.sizeMultiplier = multiplier;
    this.metrics = metrics[size > 0 ? size - 1 : 0];
}

/**
 * Get the style of a superscript given a base in the current style.
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.sup = function() {
    return styles[sup[this.id]];
};

/**
 * Get the style of a subscript given a base in the current style.
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.sub = function() {
    return styles[sub[this.id]];
};

/**
 * Get the style of a fraction numerator given the fraction in the current
 * style.
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.fracNum = function() {
    return styles[fracNum[this.id]];
};

/**
 * Get the style of a fraction denominator given the fraction in the current
 * style.
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.fracDen = function() {
    return styles[fracDen[this.id]];
};

/**
 * Get the cramped version of a style (in particular, cramping a cramped style
 * doesn't change the style).
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.cramp = function() {
    return styles[cramp[this.id]];
};

/**
 * HTML class name, like 'displaystyle cramped'
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.cls = function() {
    return sizeNames[this.size] + (this.cramped ? ' cramped' : ' uncramped');
};


/**
 * HTML Reset class name, like 'reset-textstyle'
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.adjustTo = function(newStyle) {
    let result = ADJUST_NAMES[this.size][newStyle.size];
    if (result.length > 0) result = ' ' + result;
    if (this.cramped !== newStyle.cramped) {
        result += this.cramped ? ' cramped' : ' uncramped';
    }
    return result;
};

/**
 * Return if this style is tightly spaced (scriptstyle/scriptscriptstyle)
 * @memberof Mathstyle
 * @instance
 */
Mathstyle.prototype.isTight = function() {
    return this.size >= 2;
};

// IDs of the different styles
const D = 0;
const Dc = 1;
const T = 2;
const Tc = 3;
const S = 4;
const Sc = 5;
const SS = 6;
const SSc = 7;

// Instances of the different styles
const styles = [
    new Mathstyle(D, 0, 1.0, false),
    new Mathstyle(Dc, 0, 1.0, true),
    new Mathstyle(T, 1, 1.0, false),
    new Mathstyle(Tc, 1, 1.0, true),
    new Mathstyle(S, 2, 0.7, false),
    new Mathstyle(Sc, 2, 0.7, true),
    new Mathstyle(SS, 3, 0.5, false),
    new Mathstyle(SSc, 3, 0.5, true)
];

/**
 * Maps a string (or a Mathstyle) to an actual Mathstyle object.
 * @param {(Mathstyle|string)} s 
 * @return {Mathstyle}
 * @memberof mathstyle
 */
function toMathstyle(s) {
    if (!s) return s;

    if (s instanceof Mathstyle) return s;

    const STYLE_NAMES = {
        'displaystyle': styles[D],
        'textstyle': styles[T], 
        'scriptstyle': styles[S], 
        'scriptscriptstyle': styles[SS]
    }

    console.assert(STYLE_NAMES[s]);
    return STYLE_NAMES[s];
}



// String names for the different sizes
const sizeNames = [
    'displaystyle textstyle',
    'textstyle',
    'scriptstyle',
    'scriptscriptstyle'
];


const ADJUST_NAMES = [
    [   
        '', // 'reset-textstyle displaystyle textstyle', 
        'reset-textstyle textstyle', 
        'reset-textstyle scriptstyle', 
        'reset-textstyle scriptscriptstyle'
    ],

    [   
        'reset-textstyle displaystyle textstyle', 
        '',        // 'reset-textstyle textstyle', 
        'reset-textstyle scriptstyle', 
        'reset-textstyle scriptscriptstyle'
    ],

    [   
        'reset-scriptstyle textstyle displaystyle', 
        'reset-scriptstyle textstyle', 
        '', // 'reset-scriptstyle scriptstyle', 
        'reset-scriptstyle scriptscriptstyle'
    ],

    [   
        'reset-scriptscriptstyle textstyle displaystyle', 
        'reset-scriptscriptstyle textstyle', 
        'reset-scriptscriptstyle scriptstyle', 
        '' // 'reset-scriptscriptstyle scriptscriptstyle'
    ],
];


// Lookup tables for switching from one style to another
const sup = [S, Sc, S, Sc, SS, SSc, SS, SSc];
const sub = [Sc, Sc, Sc, Sc, SSc, SSc, SSc, SSc];
const fracNum = [T, Tc, S, Sc, SS, SSc, SS, SSc];
const fracDen = [Tc, Tc, Sc, Sc, SSc, SSc, SSc, SSc];
const cramp = [Dc, Dc, Tc, Tc, Sc, Sc, SSc, SSc];

// We only export some of the styles. Also, we don't export the `Mathstyle` 
// class so no more styles can be generated.
return {
    DISPLAY: styles[D],
    TEXT: styles[T],
    SCRIPT: styles[S],
    SCRIPTSCRIPT: styles[SS],
    toMathstyle: toMathstyle
}



})