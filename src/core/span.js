/*global require:false*/
/*global define:false*/

/**
 * @module span
 * @private
 */

define(['mathlive/core/fontMetrics'],
    function(FontMetrics) {

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumSignificantDigits: 5
});

/**
 * Return a string made up of the concatenated arguments.
 * Each arguments can be either a string, which is unchanged,
 * or a number, which is converted to a string with at most 5 fractional digits.
 * 
 * @param {...string} args
 * @return {string}
 * @memberof module:span
 * @private
 */
function toString() {
    let result = '';
    for (const arg of arguments) {
        if (typeof arg === 'number') {
            result += NUMBER_FORMATTER.format(arg);
        } else if (typeof arg === 'string') {
            result += arg;
        } else if (Array.isArray(arg)) {
            for (const elem of arg) {
                result += toString(elem);
            }
        } else if (arg) {
            result += arg.toString();
        }
    }
    return result;
}


//----------------------------------------------------------------------------
// SPAN
//----------------------------------------------------------------------------

/**
 * A span is the most elementary element that can be rendered.
 * It is composed of an optional body of text and an optional list
 * of children (other spans). Each span can be decorated with
 * CSS classes and style attributes.
 * 
 * @param {string|Span|Span[]} content the items 'contained' by this node
 * @param {string} classes list of classes attributes associated with this node
 * @return {void}
 * @class
 * @global
 * @memberof module:span
 * @property {string} type - For example, `'command'`, `'mrel'`, etc...
 * @property {string} classes - A string of space separated CSS classes 
 * associated with this element
 * @property {Span[]} children - An array, potentially empty, of spans which 
 * this span encloses
 * @property {string} body - Content of this span. Can be empty.
 * @property {Object} style - A set of key/value pairs specifying CSS properties
 * associated with this element.
 * @property {number} height - The measurement from baseline to top, in em.
 * @property {number} depth - The measurement from baseline to bottom, in em.
 * @private
 */
function Span(content, classes) {
    // CLASSES
    this.classes = classes || '';

    console.assert(typeof this.classes === 'string');

    // CONTENT
    if (Array.isArray(content)) {
        // Check if isArray first, since an array is also an object
        // Flatten it (i.e. [[a1, a2], b1, b2] -> [a1, a2, b1, b2]
        this.children = [].concat.apply([], content);
    } else if (typeof content === 'string') {
        this.body = content;
    } else if (content && typeof content === 'object') {
        this.children = [content];
    }

    // STYLE
    // CSS style, as an array of key value pairs. 
    // Use this.setStyle() to modify it.
    this.style = null;

    // Calculate the dimensions of this span based on its children
    this.updateDimensions();
}

/**
 * Update the dimensions of this node based on its children:
 * - height: distance from bottom to top
 * - depth: distance from bottom to baseline
 * - maxFontSize:  
 * @method module:span.Span#updateDimensions
 * @private
 */
Span.prototype.updateDimensions = function() {
    let height = 0;
    let depth = 0;
    let maxFontSize = 0;
    if (this.children) {
        for (const child of this.children) {
            if (child) {
                console.assert(!isNaN(child.height));
                if (child.height > height) height = child.height;
                if (child.depth > depth) depth = child.depth;
                if (child.maxFontSize > maxFontSize) maxFontSize = child.maxFontSize;
            }
        }
    }
    this.height = height;
    this.depth = depth;
    this.maxFontSize = maxFontSize;
}



/**
 * Set the value of a CSS property associated with this span.
 * For example, setStyle('border-right', 5.6, 'em');
 * 
 * @param {string} prop the CSS property to set
 * @param {Object} value a series of strings and numbers that will be concatenated.
 * @return {string}
 * @method module:span.Span#setStyle
 * @private
 */
Span.prototype.setStyle = function(prop, ...value) {
    const v = toString(value);
    if (v.length > 0) {
        if (!this.style) this.style = {};
        this.style[prop] = v;
    }
}

Span.prototype.setTop = function(top) {
    if (top && top !== 0) {
        if (!this.style) this.style = {};
        this.style['top'] = toString(top) + 'em';
        this.height -= top;
        this.depth += top;
    }
}

Span.prototype.setLeft = function(left) {
    if (left && left !== 0) {
        if (!this.style) this.style = {};
        this.style['margin-left'] = toString(left) + 'em';
    }
}

Span.prototype.setRight = function(right) {
    if (right && right !== 0) {
        if (!this.style) this.style = {};
        this.style['margin-right'] = toString(right) + 'em';
    }
}

Span.prototype.setWidth = function(width) {
    if (width && width !== 0) {
        if (!this.style) this.style = {};
        this.style['width'] = toString(width) + 'em';
    }
}

Span.prototype.addMarginRight = function(margin) {
    if (margin && margin !== 0) {
        if (!this.style && 
            !/qquad|quad|enspace|thickspace|mediumspace|thinspace|negativethinspace/.test(this.classes)) {
            // Attempt to use a class instead of an explicit margin
            const cls = {
                '2': 'qquad',
                '1': 'quad',
                '.5': 'enspace',
                '0.277778': 'thickspace',
                '0.222222': 'mediumspace',
                '0.166667': 'thinspace',
                '-0.166667': 'negativethinspace'}[margin.toString()];
            if (cls) {
                this.classes += ' rspace ' + cls;
                return;
            }
        }
        if (!this.style) this.style = {};
        const currentMargin = parseFloat(this.style['margin-right'] || '0');
        this.style['margin-right'] = toString(currentMargin + margin) + 'em'
    }
}



/**
 * Return HTML markup representing this span, its style, classes and
 * children.
 * 
 * @param {number} [hskip] amount of whitespace to insert before this element
 * This is used to adjust the inter-spacing between spans of different types,
 * e.g. 'bin' and 'rel', according to the TeX rules.
 * @alias module:span.INTER_ATOM_SPACING
 * @private
 */
const INTER_ATOM_SPACING = {
    'mord+mop':            3,
    'mord+mbin':           4,
    'mord+mrel':           5,
    'mord+minner':         3,

    'mop+mord':             3,
    'mop+mop':              3,
    'mop+mbin':             5,
    'mop+minner':           3,

    'mbin+mord':            4,
    'mbin+mop':             4,
    'mbin+mopen':           4,
    'mbin+minner':          4,

    'mrel+mord':            5,
    'mrel+mop':             5,
    'mrel+mopen':           5,
    'mrel+minner':          5,

    'mclose+mop':           3,
    'mclose+mbin':          4,
    'mclose+mrel':          5,
    'mclose+minner':        3,

    'mpunct+mord':          3,
    'mpunct+mop':           3,
    'mpunct+mbin':          4,
    'mpunct+mrel':          5,
    'mpunct+mopen':         3,
    'mpunct+mpunct':        3,
    'mpunct+minner':        3
}

/**
 * 
 * @alias module:span.INTER_ATOM_TIGHT_SPACING
 * @private
 */
const INTER_ATOM_TIGHT_SPACING = {
    'mord+mop':             3,
    'mop+mord':             3,
    'mop+mop':              3,
    'mclose+mop':           3,
    'minner+mop':           3
}

function lastSpanType(span) {
    let result = span.type;
    if (span.classes.indexOf('ML__selected') !== -1) {
        result = span.children[span.children.length - 1].type;
    }
    if (result === 'first') return 'none';
    if (result === 'textord') return 'mord';
    return result;
}

/**
 * Generate the HTML markup to represent this span.
 * 
 * @param {?number} - If a value is provided, it will be added (in ems) to the 
 * left margin.
 * @return {string} HTML markup
 * @method module:span.Span#toMarkup
 * @private
 */
Span.prototype.toMarkup = function(hskip) {
    hskip = hskip || 0;
    let result = '';
    let body = this.body || '';
    if (this.children) {
        let previousType = 'none';
        for (const child of this.children) {
            let spacing = 0;
            if (previousType) {
                let type = child.type;
                if (type) {
                    if (type === 'textord') type = 'mord';
                    if (type === 'first') type = 'none';
                    if (child.isTight) { 
                        spacing = (INTER_ATOM_TIGHT_SPACING[previousType + '+' + type] || 0) / 18;
                    } else {
                        spacing = (INTER_ATOM_SPACING[previousType + '+' + type] || 0) / 18;
                    }
                }
            }
            body += child.toMarkup(spacing);
            previousType = lastSpanType(child);
        }
    }
    const tag = this.tag || 'span';

    if (tag.length === 0) {
        result = body || '';
    } else {
        result = '<' + tag;

        if (this.svgOverlay) {
            if (!this.style) this.style = {};
            this.style['position'] =  'relative';
        }

        if (this.attributes) {
            for (const attribute in this.attributes) {
                if (this.attributes.hasOwnProperty(attribute)) {  
                    result += ' ' + attribute + '="' + this.attributes[attribute] + '"';
                }
            }
        }

        const classes = this.classes.split(' ');

        // Add the type (mbin, mrel, etc...) if specified
        if (this.type) {
            classes.push({
                'command': 'ML__command',
                'placeholder': 'ML__placeholder',
                'error': 'ML__error'
            }[this.type] || '');
        }

        if (this.type === 'command' && this.hasCaret) {
            classes.push('ML__caret');
        }

        // Remove duplicate and empty classes
        // and 'mathrm' which is a no-op
        const classList = classes.filter(function (x, e, a) {
                return x.length > 0 && x !== 'mathrm' && a.indexOf(x) === e;
            }).join(' ');

        if (classList.length > 0) {
            result += ' class="' + classList + '"';
        }

        // If a `hskip` value was provided, add it to the margin-left
        if (hskip) {
            if (!this.style) this.style = {};
            if (!this.style['margin-left']) {
                this.style['margin-left'] = toString(hskip, 'em');
            } else {
                this.style['margin-left'] = toString(
                    (parseInt(this.style['margin-left']) + hskip), 'em');
            }
        }

        if (this.style) {
            let styleString = ''
            for (const style in this.style) {
                if (this.style.hasOwnProperty(style)) {
                    styleString += style + ':' + this.style[style] + ';'
                }
            }

            if (styleString.length > 0) {
                result += ' style="' + styleString + '"';
            }
        }
        result += '>';

        // If there is some SVG markup associated with this span, 
        // include it now
        if (this.svgOverlay) {
            result += body;     // @todo maybe safe encode here...? (< >)
            result += '<svg ';
            // result += ` width="${this.clientWidth()}px"`;
            // result += ` height="${this.clientHeight()}px"`;
            result += ' width="100%" height="100%"';
            result += 'style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;"';
            if (this.svgStyle) {
                result += ' style="filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333);"';
            }
            result += '>';
            result += this.svgOverlay;
            result += '</svg>';
        } else {
            result += body;     // @todo maybe safe encode here...? (< >)
        }

        result += '</' + tag + '>';
    }

    // Collapse 'empty' spans
    if (result === '<span>\u200b</span>') {
        result = '';
    }

    if (this.hasCaret && this.type !== 'command') {
        result = '<span class="ML__caret">' + result + '</span>';
    }

    return result;    
}


/**
 * Can this span be coalesced with 'span'?
 * This is used to 'coalesce' (i.e. group together) a series of spans that are 
 * identical except for their value, and to avoid generating redundant spans.
 * That is: '12' ->
 *      "<span class='mord mathrm'>12</span>"
 * rather than:
 *      "<span class='mord mathrm'>1</span><span class='mord mathrm'>2</span>"
 * @param {Span} span
 * @return {boolean} 
 * @method module:span.Span#tryCoalesceWith
 * @private
 */
Span.prototype.tryCoalesceWith = function(span) {

    if (this.tag !== span.tag) return false;

    if (this.type !== span.type) return false;

    // Don't coalesce consecutive errors or placeholders
    if (this.type === 'error' || this.type === 'placeholder' || 
        this.type === 'command') return false;

    // If this span or the candidate span have children, we can't
    // coalesce them, but we'll try to coalesce their children
    const hasChildren = this.children && this.children.length > 0;
    const spanHasChildren = span.children && span.children.length > 0;
    if (hasChildren || spanHasChildren) return false;

    // If they have a different number of styles, can't coalesce
    const thisStyleCount = this.style ? this.style.length : 0;
    const spanStyleCount = span.style ? span.style.length : 0;

    if (thisStyleCount !== spanStyleCount) return false;

    // For the purpose of our comparison,  
    // any 'empty' classes (whitespace)
    const classes = this.classes.trim().replace(/\s+/g, ' ')
        .split(' ');
    const spanClasses = span.classes.trim().replace(/\s+/g, ' ')
        .split(' ');


    // If they have a different number of classes, can't coalesce
    if (classes.length !== spanClasses.length) return false;


    // OK, let's do the more expensive comparison now.

    // If they have different classes, can't coalesce
    classes.sort();
    spanClasses.sort();

    for (let i = 0; i < classes.length; i++) {
        // Don't coalesce vertical separators 
        // (used in column formating with {l||r} for example
        if (classes[i] === 'vertical-separator') return false;
        if (classes[i] !== spanClasses[i]) return false;
    }


    // If the styles are different, can't coalesce
    if (this.style && span.style) {
        for (const style in this.style) {
            if (this.style.hasOwnProperty(style) && 
                span.style.hasOwnProperty(style)) {
                if (this.style[style] !== span.style[style]) return false;
            }
        }
    }

    // OK, the attributes of those spans are compatible.
    // Merge span into this
    this.body += span.body;

    this.height = Math.max(this.height, span.height);
    this.depth = Math.max(this.depth, span.depth);

    // The italic correction for the coalesced spans is the 
    // italic correction of the last span.
    this.italic = span.italic;

    return true;
}

/**
 * Attempts to coalesce (merge) spans, for example consecutive text spans.
 * Return a new tree with coalesced spans.
 * 
 * @param {Span[]} spans
 * @return {Span[]} coalesced tree
 * @memberof module:span
 * @private
 */
function coalesce(spans) {
    if (!spans || spans.length === 0) return [];

    spans[0].children = coalesce(spans[0].children);
    const result = [spans[0]];

    for (let i = 1; i < spans.length; i++) {
        if (!result[result.length - 1].tryCoalesceWith(spans[i])) {
            spans[i].children = coalesce(spans[i].children);
            result.push(spans[i]); 
        }
    }
    return result;
}


//----------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------

function height(spans) {
    if (!spans) return 0;
    if (Array.isArray(spans)) {
        let result = 0;
        for (const span of spans) {
            result = Math.max(result, span.height);
        }
        return result;
    }
    return spans.height;
}

function depth(spans) {
    if (!spans) return 0;
    if (Array.isArray(spans)) {
        let result = 0;
        for (const span of spans) {
            result = Math.max(result, span.depth);
        }
        return result;
    }
    return spans.depth;
}


function skew(spans) {
    if (!spans) return 0;
    if (Array.isArray(spans)) {
        let result = 0;
        for (const span of spans) {
            result += span.skew || 0;
        }
        return result;
    }
    return spans.skew;
}

function italic(spans) {
    if (!spans) return 0;
    if (Array.isArray(spans)) {
        return spans[spans.length - 1].italic;
    }
    return spans.italic;
}


/**
 * Make an element made of a sequence of children with classes
 * @param {(string|Span|Span[])} content the items 'contained' by this node
 * @param {string} classes list of classes attributes associated with this node
 * @memberof module:span
 * @private
 */
function makeSpan(content, classes) {
    if (Array.isArray(content)) {
        const c = [];
        for (const s of content) {
            if (s) c.push(s);
        }
        if (c.length === 1) {
            return makeSpan(c[0], classes);
        }
    }
    return new Span(content, classes);
}


/**
 * 
 * @param {string} fontFamily 
 * @param {string} symbol 
 * @param {string} classes 
 * @memberof module:span
 * @private
 */
function makeSymbol(fontFamily, symbol, classes) {
    const result = new Span(symbol, classes);

    const metrics = FontMetrics.getCharacterMetrics(symbol, fontFamily);
    result.height = metrics.height;
    result.depth = metrics.depth;
    result.skew = metrics.skew;
    result.italic = metrics.italic;

    result.setRight(result.italic);

    return result;
}


/**
 * Makes an element placed in each of the vlist elements to ensure that each
 * element has the same max font size. To do this, we create a zero-width space
 * with the correct font size.
//  * Note: without this, even when fontSize = 0, the fraction bar is no 
//  * longer positioned correctly
 * @return {Span}
 * @memberof module:span
 * @private
 */
function makeFontSizer(context, fontSize) {
    const fontSizeAdjustment = fontSize ? fontSize / context.mathstyle.sizeMultiplier : 0;
    const fontSizeInner = new Span('\u200b');    // ZERO WIDTH SPACE

    if (fontSizeAdjustment !== 1) {
        fontSizeInner.setStyle('font-size', 
            fontSizeAdjustment, 
            (fontSizeAdjustment > 0) ? 'em' : '');
        fontSizeInner.attributes = {
            "aria-hidden": true
        }
    }

    if (context.size !== 'size5') { 
        return new Span(fontSizeInner, 
            'fontsize-ensurer reset-' + context.size + ' size5');
    } 
    return (fontSizeAdjustment !== 0) ? fontSizeInner : null;
}

/**
 * 
 * @param {string} type One of 'mbin', 'mop', 'mord', 'mrel' 'mclose', 
 * 'mpunct', 'minner'
 * @param {string|Span[]} content A string or an array of other Spans
 * @param {string} classes CSS classes decorating this span
 * See https://tex.stackexchange.com/questions/81752/
 * for a thorough description of the TeXt atom type and their relevance to 
 * proper kerning.
 * @memberof module:span
 * @private
 */
function makeSpanOfType(type, content, classes) {
    const result = makeSpan(content, classes);
    result.type = type;
    return result;
}

function makeOp(content, classes) {
    return makeSpanOfType('mop', content, classes);
}

function makeOrd(content, classes) {
    return makeSpanOfType('mord', content, classes);
}

function makeRel(content, classes) {
    return makeSpanOfType('mrel', content, classes);
}

function makeClose(content, classes) {
    return makeSpanOfType('mclose', content, classes);
}

function makeOpen(content, classes) {
    return makeSpanOfType('mopen', content, classes);
}

function makeInner(content, classes) {
    return makeSpanOfType('minner', content, classes);
}

function makePunct(content, classes) {
    return makeSpanOfType('mpunct', content, classes);
}


function makeStyleWrap(type, children, fromStyle, toStyle, classes) {
    classes = classes || '';
    classes += ' style-wrap ';

    const result = makeHlist(children, classes + fromStyle.adjustTo(toStyle));
    result.type = type;

    const multiplier = toStyle.sizeMultiplier / fromStyle.sizeMultiplier;

    result.height *= multiplier;
    result.depth *= multiplier;
    result.maxFontSize = toStyle.sizeMultiplier;

    return result;
}

/**
 * Add some SVG markup to be overlaid on top of the span
 * 
 * @param {Span} body 
 * @param {string} svgMarkup 
 */
function makeSVG(body, svgMarkup, svgStyle) {
    body.svgOverlay = svgMarkup;
    body.svgStyle = svgStyle;
    return body;
}

/**
 * 
 * @param {Span|Span[]} children 
 * @param {string} classes 
 * @memberof module:span
 * @private
 */
function makeHlist(children, classes) {
    if (!classes || classes.length === 0) {
        // No decorations...
        if (children instanceof Span) {
            // A single span, use it as the output
            return children;
        } else if (Array.isArray(children) && children.length === 1) {
            // An array, with a single span, use the single span as the output
            return children[0]
        }
    }
    return new Span(children, classes);
}

/**
 * Create a new span of type `vlist`, a set of vertically stacked items
 * @param {Context} context
 * @param {Array.<(number|Span)>} elements 
 * An array of Span and integer. The integer can be either some kerning information
 * or the value of an individual shift of the preceding child if in 'individualShift' mode
 * @param {string} pos The method that will be used to position the elements in the vlist. 
 * 
 * One of:
 * - `"individualShift"`: each child must be followed by a number indicating how much to shift it (i.e. moved downwards)
 * - `"top"`: posData specifies the topmost point of the vlist (>0 move up)
 * - `"bottom"`: posData specifies the bottommost point of the vlist (>0 move down)
 * - `"shift"`: the baseline of the vlist will be positioned posData away from the baseline 
 * of the first child. (>0 moves down)
 * @param {number} posData
 * @memberof module:span
 * @private
 */
function makeVlist(context, elements, pos, posData) {
    let listDepth = 0;
    let currPos = 0;
    pos = pos || 'shift';
    posData = posData || 0;

    // Normalize the elements so that they're all either a number or 
    // a single span. If a child is an array of spans, 
    // wrap it in a span
    for (let i = 0; i < elements.length; i++) {
        if (Array.isArray(elements[i])) {
            if (elements[i].length === 1) {
                // If that's an array made up of a single span, use that span
                elements[i] = elements[i][0];
            } else {
                // Otherwise, wrap it in a span
                elements[i] = makeSpan(elements[i]);
            }
        }
    }

    if (pos === 'shift') {
        listDepth = -elements[0].depth - posData;
    } else if (pos === 'bottom') {
        listDepth = -posData;
    } else if (pos === 'top') {
        let bottom = posData;
        for (const element of elements) {
            if (element instanceof Span) {
                // It's a Span, use the dimension data
                bottom -= element.height + element.depth;
            } else {
                // It's a kern adjustment
                bottom -= element;
            } 
        }
        listDepth = bottom;
    } else if (pos === 'individualShift') {
        // Individual adjustment to each elements.
        // The elements list is made up of a Span followed
        // by a shift adjustment as an integer
        const originalElements = elements;
        elements = [originalElements[0]];

        // Add in kerns to the list of elements to get each element to be
        // shifted to the correct specified shift
        listDepth = -originalElements[1] - originalElements[0].depth;
        currPos = listDepth;
        for (let i = 2; i < originalElements.length; i += 2) {
            const diff = -originalElements[i + 1] - currPos -
                originalElements[i].depth;
            const kern = diff -
                (originalElements[i - 2].height +
                 originalElements[i - 2].depth);
 
            currPos = currPos + diff;

            elements.push(kern);
            elements.push(originalElements[i]);
        }
    } else {
        console.assert(false, 'makeVList with unknown method: "' + pos + '"');
    }

    // Make the fontSizer
    let maxFontSize = 0;
    for (const element of elements) {
        if (element instanceof Span) {
            maxFontSize = Math.max(maxFontSize, element.maxFontSize);
        }
    }
    const fontSizer = makeFontSizer(context, maxFontSize);

    const newElements = [];
    currPos = listDepth;
    for (const element of elements) {
        if (typeof element === 'number') {
            // It's a kern adjustment
            currPos += element; 
        } else {
            const shift = -element.depth - currPos;
            currPos += element.height + element.depth;
            const childWrap = makeSpan([fontSizer, element]);
            childWrap.setTop(shift);
            newElements.push(childWrap);

        }
    }

    const result = makeSpan(newElements, 'vlist');
    // Fix the final height and depth, in case there were kerns at the ends
    // since makeSpan won't take that into account.
    result.height = Math.max(-currPos, height(result) || 0);
    result.depth = Math.max(listDepth, depth(result) || 0);

    return result;
}

// function makeStrut(base, strutHeight, strutDepth) {
//     const bottomStrut = makeSpan('', 'ML__strut--bottom');
//     if (strutHeight !== undefined) {
//         bottomStrut.setStyle('height', strutHeight + strutDepth, 'em');
//         if (strutDepth) {
//            bottomStrut.setStyle('vertical-align', -strutDepth, 'em');
//         }
//     } else {
//         // const baseDepth = depth(base);
//         // bottomStrut.setStyle('height', height(base) + baseDepth, 'em');
//         // if (baseDepth) {
//         //     bottomStrut.setStyle('vertical-align', -baseDepth, 'em');
//         // }
//     }
//     // bottomStrut.setStyle('border', '1px solid green');

//     if (Array.isArray(base)) {
//         base.unshift(bottomStrut);
//         return base;
//     }
//     return [bottomStrut, base];
// }

// Export the public interface for this module
return { 
    coalesce,
    makeSpan,
    makeOp,
    makeOrd,
    makeRel,
    makeClose,
    makeOpen,
    makeInner,
    makePunct,

    makeSpanOfType,
    makeSymbol,
    makeVlist,
    makeHlist,
    makeStyleWrap,

    // makeStrut,

    makeSVG,

    height,
    depth,
    skew,
    italic
}

})
