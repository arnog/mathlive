/*global require:false*/
/*global define:false*/

/**
 * 
 * See {@linkcode MathAtom}
 * @module mathAtom
 * @private
 */
define([
    'mathlive/core/mathstyle', 
    'mathlive/core/context', 
    'mathlive/core/fontMetrics', 
    'mathlive/core/span', 
    'mathlive/core/delimiters'],
    function(Mathstyle, Context, FontMetricsModule, Span, Delimiters) {


const makeSpan = Span.makeSpan;
const makeOrd = Span.makeOrd;
const makeInner = Span.makeInner;
const makeHlist = Span.makeHlist;
const makeVlist = Span.makeVlist;
const FONTMETRICS = FontMetricsModule.metrics;
const getCharacterMetrics = FontMetricsModule.getCharacterMetrics;
// const toPx = FontMetricsModule.toPx;
const toEm = FontMetricsModule.toEm;




/**
 * An atom is an object encapsulating an elementary mathematical unit, 
 * independent of its graphical representation.
 * 
 * It keeps track of the content, while the dimensions, position and style
 * are tracked by Span objects which are created by the `decompose()` functions.
 *  
 * @param {string} mode 
 * @param {string} type 
 * @param {string} value 
 * @param {?string} [fontFamily="main"]
 * @param {?Object} [extras=null] A set of additional properties to append to 
 * the atom
 * @return {MathAtom}
 * @property {string} mode `'display'`, `'command'`, etc...
 * @property {string} type - Type can be one of:
 * - **ord**: ordinary symbol, e.g. _x_, _\alpha_
 * - **bin**: binary operator: _+_, _*_, etc...
 * - **rel**: relational operator: _=_, _\ne_, etc...
 * - **punct**: punctuation: _,_, _:_, etc...
 * - **open**: opening fence: _(_, _\langle_, etc...
 * - **close**: closing fence: _)_, _\rangle_, etc...
 * - **op**: (big) operators, _\sum_, _\cap_.
 * - **inner**: special layout cases, overlap
 * - **accent**: a diacritic mark above a symbol
 * 
 * In addition to these basic types, which correspond to the TeX atom types,
 * some atoms represent more complex compounds, including:
 * - **space** and **spacing**: blank space between atoms
 * - **mathstyle**: to change the math style used: **display** or **text**. 
 * The layout rules are different for each, the latter being more compact and 
 * intended to be incorporated with surrounding non-math text.
 * - **font**: to change the font used. Used by `\mathbb`, `\mathbb`, etc...
 * - **sizing**: to change the size of the font used
 * - **color**: to change the foreground color
 * - **rule**: a line, for the `\rule` command
 * - **line**: used by `\overline` and `\underline` commands
 * - **box**: to draw a border around an expression and change its background color
 * - **overlap**: display a symbol _over_ another
 * - **overunder**: displays an annotation above or below a symbold
 * - **group**: a simple group of atoms
 * - **root**: a group, which has no parent
 * - **array**: a group, which has children arranged in columns and rows. Used
 * by environments such as `matrix`, `cases`, etc...
 * - **genfrac**: a generalized fraction: a numerator and denominator, separated
 * by an optional line, and surrounded by optional fences
 * - **surd**: a surd, aka root
 * - **leftright**: used by the `\left` and `\right` commands
 * - **delim**: some delimiter
 * - **sizeddelim**: a delimiter that can grow
 * 
 * The following types are used by the editor:
 * - **command** indicate a command being entered. The text is displayed in 
 * blue in the editor.
 * - **error**: indicate a command that is unknown, for example `\xyzy`. The text
 * is displayed with a dotted red underline in the editor.
 * - **placeholder**: indicate a temporary item. Placeholders are displayed 
 * as a pill (rounded box) in the editor.
 * - **first**: a special, empty, atom put as the first atom in math lists in 
 * order to more easily represent the cursor position. They are not displayed.
 * 
 * @property {string} value
 * @property {string} fontFamily
 * @property {MathAtom[]} body
 * @property {MathAtom[]} children
 * @property {MathAtom[]} superscript
 * @property {MathAtom[]} subscript
 * @property {MathAtom[]} numer
 * @property {MathAtom[]} denom
 * @property {boolean} captureSelection if true, this atom does not let its 
 * children be selected. Used by the enclose anotations, for example.
 * @class MathAtom
 * @global
 * @private
 */
function MathAtom(mode, type, value, fontFamily, extras) {
    this.mode = mode;
    this.type = type;
    this.value = value;
    this.fontFamily = fontFamily;

    // Append all the properties in extras to this
    // This can override the type, value, etc...
    if (extras) {
        for (const p in extras) {
            if (extras.hasOwnProperty(p)) {
                this[p] = extras[p];
            }
        }
    }


    // Determine which font family to use
    // Note that the type, fontFamily and value could have been overridden
    // by 'extras', so don't check against the parameter ('type') but 
    // the value in the object ('this.type').
    if (this.type === 'mord' || this.type === 'textord') {
        if (this.type === 'mord' && this.fontFamily === 'main' && this.value.length === 1) {
            const c = this.value.charCodeAt(0);
            if ( (c >= 65 && c <= 90) || // A-Z
                (c >= 97 && c <= 122) || //a-z
                (c >= 0x03b1 && c <= 0x03C9) || // alpha-omega
                (c === 0x03f1 || c === 0x03f5 || c === 0x03d1 || 
                c === 0x03f0 || c === 0x03d6 || c === 0x03d5)) {
                // Auto italicize alphabetic and lowercase greek symbols 
                // in math mode (European style, American style would not 
                // italicize greek letters, but it's TeX's default behavior)
                this.fontFamily = 'mathit';
            }
        }

        if (this.type === 'textord' && this.fontFamily === 'main') {
            this.fontFamily = 'mathrm';
        }
        // if (!italic && type === 'textord' && (mode === 'displaymath' || mode === 'inlinemath')) {
        //     fontFamily = 'mathit';  // This is important to get \prime to render correctly
        // }

        if (this.fontFamily === 'main') {
            this.fontFamily = type === 'mord' ? 'mathrm' : 'textrm';
        } else if (fontFamily === 'ams') {
            this.fontFamily = 'amsrm';
        }

    } else if (this.type === 'mbin' || this.type === 'mrel' || this.type === 'mopen' || 
        this.type === 'mclose' || this.type === 'minner' || this.type === 'mpunct' || 
        this.type === 'mop') {
        if (this.fontFamily === 'main') {
            this.fontFamily = 'mathrm';
        } else if (this.fontFamily === 'ams') {
            this.fontFamily = 'amsrm';
        }
    }
}



MathAtom.prototype.getBaseElement = function () {
    if ((this.type === 'group' || this.type === 'color') 
            && this.children.length === 1) {
        return this.children[0].getBaseElement();
    } 
    if (this.body && this.body.length === 1) {
        // this.type === 'accent', 'surd', 'leftright', 
        // 'line', 'font', 'color', 'box'.
        return this.body[0].getBaseElement();
    }
    return this;
}

MathAtom.prototype.getInitialBaseElement = function () {
    if (this.children && this.children.length > 0) {
        return this.children[0].getFinalBaseElement();
    }
    if (this.body && this.body.length > 0) {
        return this.body[0].getFinalBaseElement();
    }

    return this;
}

MathAtom.prototype.getFinalBaseElement = function () {
    if (this.children && this.children.length > 0) {
        return this.children[this.children.length - 1].getFinalBaseElement();
    }
    if (this.body && this.body.length > 0) {
        return this.body[this.body.length - 1].getFinalBaseElement();
    }

    return this;
}


MathAtom.prototype.isCharacterBox = function () {
    const base = this.getBaseElement();
    return base.type === 'mord' ||
        base.type === 'minner' || base.type === 'mbin' ||
        base.type === 'mrel' || base.type === 'mpunct' ||
        base.type === 'mopen' || base.type === 'mclose' ||
        base.type === 'textord';
}


MathAtom.prototype.forEach = function (cb) {

    cb(this);

    if (this.children) {
        for (const atom of this.children) atom.forEach(cb);
    }
    if (this.superscript) {
        for (const atom of this.superscript) if (atom) atom.forEach(cb);
    }
    if (this.subscript) {
        for (const atom of this.subscript) if (atom) atom.forEach(cb);
    }
    if (this.overscript) {
        for (const atom of this.overscript) if (atom) atom.forEach(cb);
    }
    if (this.underscript) {
        for (const atom of this.underscript) if (atom) atom.forEach(cb);
    }
    if (this.numer) {
        for (const atom of this.numer) if (atom) atom.forEach(cb);
    }
    if (this.denom) {
        for (const atom of this.denom) if (atom) atom.forEach(cb);
    }
    if (this.body) {
        for (const atom of this.body) atom.forEach(cb);
    }
    if (this.index) {
        for (const atom of this.index) atom.forEach(cb);
    }
    if (this.array) {
        for (const row of this.array) {
            for (const cell of row) {
                cell.forEach(cb);
            }
        }
    }
}

/**
 * Iterate over all the child atoms of this atom, this included,
 * and return an array of all the atoms for which the predicate callback
 * is true.
 * 
 * @return {MathAtom[]}
 * @method MathAtom#filter
 */
MathAtom.prototype.filter = function (cb) {
    let result = [];
    if (cb(this)) result.push(this);

    for (const relation of ['children', 'superscript', 'subscript',
        'overscript', 'underscript', 
        'numer', 'denom', 'body', 'index']) {
        if (this[relation]) {
            for (const atom of this[relation]) {
                if (atom) result = result.concat(atom.filter(cb));
            }
        }
    }
    if (this.array) {
        for (const row of this.array) {
            for (const cell of row) {
                if (cell) result = result.concat(cell.filter(cb));
            }
        }
    }

    return result;
}


MathAtom.prototype.decomposeGroup = function(context) {
    // The scope of the context is this group, so make a copy of it
    // so that any changes to it will be discarded when finished 
    // with this group.

    // Note that the mathstyle property is optional and could be undefined
    // If that's the case, withMathstyle() returns a clone of the 
    // context with the same mathstyle.
    const localContext = context.withMathstyle(this.mathstyle);

    return makeOrd(decompose(localContext, this.children));
}

/**
 * Used in decomposeArray to create a column separator span.
 * 
 * @param {number} width 
 * @memberof module:mathAtom
 * @private
 */
function makeColGap(width) {
    const separator = makeSpan(null, 'arraycolsep');
    separator.setWidth(width, 'em');
    return separator;
}

/**
 * Used in decomposeArray to create a column of repeating elements.
 * @memberof module:mathAtom
 * @private
 */
function makeColOfRepeatingElements(context, body, offset, elem) {
    const col = [];
    for (const row of body) {
        const cell = makeSpan(decompose(context, elem));
        cell.depth = row.depth;
        cell.height = row.height;
        col.push(cell);
        col.push(row.pos - offset);
    }
    return makeVlist(context, col, 'individualShift');
}

MathAtom.prototype.decomposeArray = function(context) {
    // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
    // and http://tug.ctan.org/macros/latex/base/lttab.dtx

    let colFormat = this.colFormat;
    if (colFormat && colFormat.length === 0) {
        colFormat = [{align:'l'}];
    }
    if (!colFormat) {
        colFormat = [{align:'l'}, {align:'l'}, {align:'l'}, 
        {align:'l'}, {align:'l'}, {align:'l'}, {align:'l'}, {align:'l'}, 
        {align:'l'}, {align:'l'}]
    }
    
    // Fold the array so that there are no more columns of content than
    // there are columns prescribed by the column format.
    const array = [];
    let colMax = 0; // Maximum number of columns of content
    for (const colSpec of colFormat) {
        if (colSpec.align) colMax++;
    }

    for (const row of this.array) {
        let colIndex = 0;
        while (colIndex < row.length) {
            const newRow = [];
            const lastCol = Math.min(row.length, colIndex + colMax);
            while (colIndex < lastCol) {
                newRow.push(row[colIndex++]);
            }
            array.push(newRow);
        }
    }
    

    // If the last row is empty, ignore it.
    if (array[array.length - 1].length === 1 && 
        array[array.length - 1][0].length === 0) {
        array.pop();
    }

    const mathstyle = Mathstyle.toMathstyle(this.mathstyle) ||
         context.mathstyle;

    // Row spacing
    // Default \arraystretch from lttab.dtx
    const arraystretch = this.arraystretch || 1;
    const arrayskip = arraystretch * FONTMETRICS.baselineskip;
    const arstrutHeight = 0.7 * arrayskip; 
    const arstrutDepth = 0.3 * arrayskip;  // \@arstrutbox in lttab.dtx

    let totalHeight = 0;
    let nc = 0;
    const body = [];
    const nr = array.length;
    for (let r = 0; r < nr; ++r) {
        const inrow = array[r];
        nc = Math.max(nc, inrow.length);

        let height = arstrutHeight; // \@array adds an \@arstrut
        let depth = arstrutDepth;   // to each row (via the template)

        const outrow = [];
        for (let c = 0; c < inrow.length; ++c) {
            const localContext = context.withMathstyle(this.mathstyle || 'auto');
            const cell = decompose(localContext, inrow[c]);
            if (cell) {
                const elt = [makeOrd(null)].concat(cell);
                depth = Math.max(depth, Span.depth(elt));
                height = Math.max(height, Span.height(elt));
                outrow.push(elt);
            }
        }

        let jot = r === nr - 1 ? 0 : (this.jot || 0);
        if (this.rowGaps && this.rowGaps[r]) {
            jot = this.rowGaps[r]; 
            if (jot > 0) { // \@argarraycr
                jot += arstrutDepth;
                if (depth < jot) {
                    depth = jot; // \@xargarraycr
                }
                jot = 0;
            }
        }

        outrow.height = height;
        outrow.depth = depth;
        totalHeight += height;
        outrow.pos = totalHeight;
        totalHeight += depth + jot; // \@yargarraycr
        body.push(outrow);
    }

    const offset = totalHeight / 2 + mathstyle.metrics.axisHeight;

    const contentCols = [];
    for (let colIndex = 0; colIndex < nc; colIndex++) {
        const col = [];
        for (const row of body) {
            const elem = row[colIndex];
            if (!elem) {
                continue;
            }
            elem.depth = row.depth;
            elem.height = row.height;
            col.push(elem);
            col.push(row.pos - offset);
        }
        if (col.length > 0) {
            contentCols.push(makeVlist(context, col, 'individualShift'));
        }
    }


    // Iterate over each column description.
    // Each `colDesc` will indicate whether to insert a gap, a rule or
    // a column from 'contentCols'
    const cols = [];
    let prevColContent = false;
    let prevColRule = false;
    let currentContentCol = 0
    let firstColumn = !this.lFence;

    for (const colDesc of colFormat) {
        if (colDesc.align && currentContentCol >= contentCols.length) {
            break;
        } else if (colDesc.align && currentContentCol < contentCols.length) {
            // If an alignment is specified, insert a column of content
            if (prevColContent) {
                // If no gap was provided, insert a default gap between 
                // consecutive columns of content
                cols.push(makeColGap(2 * FONTMETRICS.arraycolsep));
            } else if (prevColRule || firstColumn) {
                // If the previous column was a rule or this is the first column
                // add a smaller gap
                cols.push(makeColGap(FONTMETRICS.arraycolsep));
            }
            cols.push(makeSpan(contentCols[currentContentCol], 
                'col-align-' + colDesc.align));

            currentContentCol++;
            prevColContent = true;
            prevColRule = false;
            firstColumn = false;
        } else if (typeof colDesc.gap !== 'undefined') {
            // Something to insert in between columns of content
            if (typeof colDesc.gap === 'number') {
                // It's a number, indicating how much space, in em,
                // to leave in between columns
                cols.push(makeColGap(colDesc.gap));
            } else {
                // It's a mathlist
                // Create a column made up of the mathlist
                // as many times as there are rows.
                cols.push(makeColOfRepeatingElements(context, body, offset, colDesc.gap));
            }
            prevColContent = false;
            prevColRule = false;
            firstColumn = false;
        } else if (colDesc.rule) {
            // It's a rule.
            const separator = makeSpan(null, 'vertical-separator');
            separator.setStyle('height', totalHeight, 'em');
        // result.setTop((1 - context.mathstyle.sizeMultiplier) *
        //     context.mathstyle.metrics.axisHeight);
            separator.setStyle('margin-top', 
                3 * context.mathstyle.metrics.axisHeight - offset, 'em');
            separator.setStyle('vertical-align', 'top');
            // separator.setStyle('display', 'inline-block');
            let gap = 0;
            if (prevColRule) {
                gap = FONTMETRICS.doubleRuleSep - FONTMETRICS.arrayrulewidth;
            } else if (prevColContent) {
                gap = FONTMETRICS.arraycolsep - FONTMETRICS.arrayrulewidth;
            }

            separator.setLeft(gap, 'em');
            cols.push(separator);

            prevColContent = false;
            prevColRule = true;
            firstColumn = false;
        }
    }
    if (prevColContent && !this.rFence) {
        // If the last column was content, add a small gap
        cols.push(makeColGap(FONTMETRICS.arraycolsep));
    }

    if (!this.lFence && !this.rFence) {
        // There are no delimiters around the array, just return what
        // we've built so far.
        return makeOrd(cols, 'mtable');
    }

    // There is at least one delimiter. Wrap the core of the array with 
    // appropriate left and right delimiters
    // const inner = makeSpan(makeSpan(cols, 'mtable'), 'mord');
    const inner = makeSpan(cols, 'mtable');
    const innerHeight = Span.height(inner);
    const innerDepth = Span.depth(inner);

    return makeOrd([
        Delimiters.makeLeftRightDelim(
            'mopen', this.lFence, innerHeight, innerDepth, context),
        inner,
        Delimiters.makeLeftRightDelim(
            'mclose', this.rFence, innerHeight, innerDepth, context)
        ]);
}


/**
 * GENFRAC -- Generalized fraction
 * 
 * Decompose fractions, binomials, and in general anything made
 * of two expressions on top of each other, optionally separated by a bar,
 * and optionally surrounded by fences (parentheses, brackets, etc...)
 * 
 * Depending on the type of fraction the mathstyle is either
 * display math or inline math (which is indicated by 'textstyle'). This value can
 * also be set to 'auto', which indicates it should use the current mathstyle
 * 
 * @method MathAtom#decomposeGenfrac
 */
MathAtom.prototype.decomposeGenfrac = function(context) {
    const mathstyle = this.mathstyle === 'auto' ? 
        context.mathstyle : Mathstyle.toMathstyle(this.mathstyle);
    const newContext = context.withMathstyle(mathstyle);

    let numer = [];
    if (this.numerPrefix) {
        numer.push(makeOrd(this.numerPrefix, 'mathrm'));
    }
    const numeratorStyle = this.continuousFraction ? 
        mathstyle : mathstyle.fracNum();
    numer = numer.concat(decompose(
        newContext.withMathstyle(numeratorStyle), this.numer));
    const numerReset = makeHlist(numer, context.mathstyle.adjustTo(numeratorStyle));


    let denom = [];
    if (this.denomPrefix) {
        denom.push(makeOrd(this.denomPrefix, 'mathrm'));
    }
    const denominatorStyle = this.continuousFraction ? 
        mathstyle : mathstyle.fracDen();
    denom = denom.concat(decompose(
        newContext.withMathstyle(denominatorStyle), this.denom));
    const denomReset = makeHlist(denom, context.mathstyle.adjustTo(denominatorStyle));

    const ruleWidth = !this.hasBarLine ? 0 : FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;


    // Rule 15b from Appendix G
    let numShift;
    let clearance;
    let denomShift;

    if (mathstyle.size === Mathstyle.DISPLAY.size) {
        numShift = mathstyle.metrics.num1;
        if (ruleWidth > 0) {
            clearance = 3 * ruleWidth;
        } else {
            clearance = 7 * FONTMETRICS.defaultRuleThickness;
        }
        denomShift = mathstyle.metrics.denom1;
    } else {
        if (ruleWidth > 0) {
            numShift = mathstyle.metrics.num2;
            clearance = ruleWidth;
        } else {
            numShift = mathstyle.metrics.num3;
            clearance = 3 * FONTMETRICS.defaultRuleThickness;
        }
        denomShift = mathstyle.metrics.denom2;
    }


    let frac;
    if (ruleWidth === 0) {
        // Rule 15c from Appendix G
        // No bar line between numerator and denominator
        const candidateClearance =
            (numShift - numerReset.depth) - (denomReset.height - denomShift);
        if (candidateClearance < clearance) {
            numShift += 0.5 * (clearance - candidateClearance);
            denomShift += 0.5 * (clearance - candidateClearance);
        }

        frac = makeVlist(
                newContext, 
                [numerReset, -numShift, denomReset, denomShift], 
                'individualShift'
        );
    } else {
        // Rule 15d from Appendix G
        // There is a bar line between the numerator and the denominator
        const axisHeight = mathstyle.metrics.axisHeight;

        if ((numShift - numerReset.depth) - (axisHeight + 0.5 * ruleWidth) <
                clearance) {
            numShift +=
                clearance - ((numShift - numerReset.depth) -
                            (axisHeight + 0.5 * ruleWidth));
        }

        if ((axisHeight - 0.5 * ruleWidth) - (denomReset.height - denomShift) <
                clearance) {
            denomShift +=
                clearance - ((axisHeight - 0.5 * ruleWidth) -
                            (denomReset.height - denomShift));
        }

        const mid = makeSpan('',
            /* newContext.mathstyle.adjustTo(Mathstyle.TEXT) + */ ' frac-line');        
            // @todo: do we really need to reset the size?
        // Manually set the height of the line because its height is
        // created in CSS
        mid.height = ruleWidth;
        
        frac = makeVlist(newContext,
            [
                numerReset, -numShift,
                mid, ruleWidth / 2 - axisHeight,
                denomReset, denomShift,
            ], 'individualShift')
    }

    // Add a 'mfrac' class to provide proper context for 
    // other css selectors (such as 'frac-line')
    frac.classes += ' mfrac';

    // Since we manually change the style sometimes (with \dfrac or \tfrac),
    // account for the possible size change here.
    frac.height *= mathstyle.sizeMultiplier / context.mathstyle.sizeMultiplier;
    frac.depth *= mathstyle.sizeMultiplier / context.mathstyle.sizeMultiplier;

    // if (!this.leftDelim && !this.rightDelim) {
    //     return makeOrd(frac, 
    //         context.parentMathstyle.adjustTo(mathstyle) + 
    //         ((context.parentSize !== context.size) ? 
    //             (' sizing reset-' + context.parentSize + ' ' + context.size) : ''));
    // }

    // Rule 15e of Appendix G
    const delimSize = mathstyle.size === Mathstyle.DISPLAY.size ? 
        mathstyle.metrics.delim1 : 
        mathstyle.metrics.delim2;

    // Optional delimiters
    const leftDelim = Delimiters.makeCustomSizedDelim(
            'mopen', this.leftDelim, delimSize, true,
            context.withMathstyle(mathstyle));

    const rightDelim = Delimiters.makeCustomSizedDelim(
            'mclose', this.rightDelim, delimSize, true,
            context.withMathstyle(mathstyle));

    const result = this.bind(context, makeOrd([leftDelim, frac, rightDelim], 
        ((context.parentSize !== context.size) ? 
            ('sizing reset-' + context.parentSize + ' ' + context.size) : 'genfrac')));
    return result;
}


 /**
  *  \left....\right 
  *
 * @method MathAtom#decomposeLeftright
  */
MathAtom.prototype.decomposeLeftright = function(context) {
    // The scope of the context is this group, so make a copy of it
    // so that any changes to it will be discarded when finished 
    // with this group.
    const localContext = context.clone();

    const inner = decompose(localContext, this.body);
    const mathstyle = localContext.mathstyle;

    let innerHeight = 0;
    let innerDepth = 0;

    // Calculate its height and depth
    // The size of delimiters is the same, regardless of what mathstyle we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.
    innerHeight = Span.height(inner) * mathstyle.sizeMultiplier;
    innerDepth = Span.depth(inner) * mathstyle.sizeMultiplier;

    // Add the left delimiter to the beginning of the expression
    let result = [];
    result.push(Delimiters.makeLeftRightDelim('mopen',
        this.leftDelim, innerHeight, innerDepth, localContext));

    // Replace the delim (\middle) spans with proper ones now that we know 
    // the height/depth
    for (let i = 0; i < inner.length - 1; i++) {
        if (inner[i].delim) {
            inner[i] = Delimiters.makeLeftRightDelim(
                '', inner[i].delim, innerHeight, innerDepth, localContext);
        }
    }
    result  = result.concat(inner);

    // Add the right delimiter to the end of the expression.
    result.push(Delimiters.makeLeftRightDelim('mclose',
        this.rightDelim, innerHeight, innerDepth, localContext));

    return makeInner(result, mathstyle.cls());
}


MathAtom.prototype.decomposeSurd = function(context) {
    // Square roots are handled in the TeXbook pg. 443, Rule 11.
    const mathstyle = context.mathstyle;

    // First, we do the same steps as in overline to build the inner group
    // and line
    const inner = decompose(context.cramp(), this.body)
    // const inner = decompose(context, this.body)

    const ruleWidth = FONTMETRICS.defaultRuleThickness /
        mathstyle.sizeMultiplier;

    const line = makeSpan('',
        context.mathstyle.adjustTo(Mathstyle.TEXT) + ' sqrt-line');

    line.height = ruleWidth;
    line.maxFontSize = 1.0;

    let phi = ruleWidth;
    if (mathstyle.id < Mathstyle.TEXT.id) {
        phi = mathstyle.metrics.xHeight;
    }

    // Calculate the clearance between the body and line
    let lineClearance = ruleWidth + phi / 4;

    const innerHeight = (Span.height(inner) + Span.depth(inner)) * mathstyle.sizeMultiplier;
    const minDelimiterHeight = innerHeight + (lineClearance + ruleWidth);

    // Create a \surd delimiter of the required minimum size
    const delim = makeSpan(
        Delimiters.makeCustomSizedDelim('', '\\surd', minDelimiterHeight,
                                   false, context), 'sqrt-sign');

    const delimDepth = (delim.height + delim.depth) - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > Span.height(inner) + Span.depth(inner) + lineClearance) {
        lineClearance =
            (lineClearance + delimDepth - Span.height(inner) - Span.depth(inner)) / 2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    delim.setTop((delim.height - Span.height(inner)) - 
                    (lineClearance + ruleWidth));

    // We add a special case here, because even when `inner` is empty, we
    // still get a line. So, we use a simple heuristic to decide if we
    // should omit the body entirely. (note this doesn't work for something
    // like `\sqrt{\rlap{x}}`, but if someone is doing that they deserve for
    // it not to work.
    let body;
    if (Span.height(inner) === 0 && Span.depth(inner) === 0) {
        body = makeSpan();
    } else {
        body = makeVlist(context, [inner, lineClearance, line, ruleWidth]);
    }

    if (!this.index) {
        return makeOrd([delim, body], 'sqrt');
    }
    // Handle the optional root index

    // The index is always in scriptscript style
    const newcontext = context.withMathstyle(Mathstyle.SCRIPTSCRIPT);

    const root = makeSpan(decompose(newcontext, this.index), 
        mathstyle.adjustTo(Mathstyle.SCRIPTSCRIPT));

    // Figure out the height and depth of the inner part
    const innerRootHeight = Math.max(delim.height, body.height);
    const innerRootDepth = Math.max(delim.depth, body.depth);

    // The amount the index is shifted by. This is taken from the TeX
    // source, in the definition of `\r@@t`.
    const toShift = 0.6 * (innerRootHeight - innerRootDepth);

    // Build a VList with the superscript shifted up correctly
    const rootVlist = makeVlist(context, [root], 'shift', -toShift);

    // Add a class surrounding it so we can add on the appropriate
    // kerning

    return makeOrd([makeSpan(rootVlist, 'root'), delim, body], 'sqrt');
 }

MathAtom.prototype.decomposeAccent = function(context) {
    // Accents are handled in the TeXbook pg. 443, rule 12.
    const mathstyle = context.mathstyle;

    // Build the base atom
    let base = decompose(context.cramp(), this.body);
    if (this.superscript || this.subscript) {
        // If there is a supsub attached to the accent
        // apply it to the base.
        // Note this does not give the same result as TeX when there 
        // are stacked accents, e.g. \vec{\breve{\hat{\acute{...}}}}^2

        base = this.attachSupsub(context, makeOrd(base), 'mord');
    }

    // Calculate the skew of the accent. This is based on the line "If the
    // nucleus is not a single character, let s = 0; otherwise set s to the
    // kern amount for the nucleus followed by the \skewchar of its font."
    // Note that our skew metrics are just the kern between each character
    // and the skewchar.
    let skew = 0;
    if (this.body.length === 1 && this.body[0].isCharacterBox()) {
        skew = Span.skew(base);
    }
    
    // calculate the amount of space between the body and the accent
    const clearance = Math.min(Span.height(base), mathstyle.metrics.xHeight);

    // Build the accent
    const accent = Span.makeSymbol('Main-Regular', this.accent, 'math');

    // Remove the italic correction of the accent, because it only serves to
    // shift the accent over to a place we don't want.
    accent.italic = 0;

    // The \vec character that the fonts use is a combining character, and
    // thus shows up much too far to the left. To account for this, we add a
    // specific class which shifts the accent over to where we want it.
    const vecClass = this.accent === '\u20d7' ? ' accent-vec' : '';

    let accentBody = makeSpan(makeSpan(accent), 'accent-body' + vecClass);

    accentBody = makeVlist(context, [base, -clearance, accentBody]);

    // Shift the accent over by the skew. Note we shift by twice the skew
    // because we are centering the accent, so by adding 2*skew to the left,
    // we shift it to the right by 1*skew.
    accentBody.children[1].setLeft(2 * skew);

    return makeOrd(accentBody, 'accent');
}  

/**
 * \overline and \underline
 * 
 * @method MathAtom#decomposeLine
 */
MathAtom.prototype.decomposeLine = function(context) {
    const mathstyle = context.mathstyle;
    // TeXBook:443. Rule 9 and 10
    const inner = decompose(context.cramp(), this.body);
    const ruleWidth = FONTMETRICS.defaultRuleThickness /
        mathstyle.sizeMultiplier;

    const line = makeSpan('', context.mathstyle.adjustTo(Mathstyle.TEXT) + 
        ' ' + this.position + '-line');
    line.height = ruleWidth;
    line.maxFontSize = 1.0;

    let vlist;
    if (this.position === 'overline') {
        vlist = makeVlist(context, [inner, 3 * ruleWidth, line, ruleWidth]);
    } else {
        const innerSpan = makeSpan(inner);
        vlist = makeVlist(context, [ruleWidth, line, 3 * ruleWidth, innerSpan], 
            'top', Span.height(innerSpan));
    }

    return makeOrd(vlist, this.position);
}


MathAtom.prototype.decomposeOverunder = function(context) {
    const base = decompose(context, this.body);
    const annotationStyle = context.withMathstyle('scriptstyle');
    const above = this.overscript ? makeSpan(decompose(annotationStyle, this.overscript),
        context.mathstyle.adjustTo(annotationStyle.mathstyle)) : null;
    const below = this.underscript ? makeSpan(decompose(annotationStyle, this.underscript),
        context.mathstyle.adjustTo(annotationStyle.mathstyle)) : null;
    
    return makeStack(context, base, 0, 0, above, below, this.mathtype || 'mrel');
}

MathAtom.prototype.decomposeOverlap = function(context) {
    const inner = makeSpan(decompose(context, this.body), 'inner');

    return makeOrd([inner, makeSpan('', 'fix')], 
        (this.align === 'left' ? 'llap' : 'rlap'));
}


/**
 * \rule
 * @memberof MathAtom
 * @instance
 */
MathAtom.prototype.decomposeRule = function(context) {
    const mathstyle = context.mathstyle;

    const result = makeOrd('', 'rule');

    let shift = this.shift && !isNaN(this.shift) ? this.shift : 0; 
    shift =  shift / mathstyle.sizeMultiplier;
    const width = (this.width) / mathstyle.sizeMultiplier;
    const height = (this.height) / mathstyle.sizeMultiplier;

    result.setStyle('border-right-width', width, 'em');
    result.setStyle('border-top-width', height, 'em');
    result.setStyle('margin-top', -(height - shift), 'em');
    if (context.color) result.setStyle('border-color', context.color);

    result.width = width;
    result.height = height + shift;
    result.depth = -shift;

    return result;
}

MathAtom.prototype.decomposeFont = function(context) {
    let result = [];
    if (this.font === 'emph') {
        // This command will toggle italic. Need to check the current font
        // @todo: this doesn't quite work. The \textit command can change the italic style,
        // but this won't be reflected in the context (it simply add a class to the span).
        // We'd need to way of tracking weight, style (shape) in context...
        if (context.font === 'mathit') {
            result = decompose(context.fontFamily('mathrm'), this.body);
        } else {
            result = decompose(context.fontFamily('textit'), this.body);
        }
    } else if (this.font === 'textit' || this.font === 'textbf') {
        // The commands are additive
        result = decompose(context, this.body);
        // Add a bolding or italicizing class to the decomposed atoms
        if (this.font === 'textit') {
            result.forEach(span => { span.classes += 'mathit' });
        } else if (this.font === 'textbf') {
            result.forEach(span => { span.classes += 'mathbf' });
        }
    } else {
        result = decompose(context.fontFamily(this.font), this.body);
    }
    return makeOrd(result);
}

MathAtom.prototype.decomposeOp = function(context) {
    // Operators are handled in the TeXbook pg. 443-444, rule 13(a).

    const mathstyle = context.mathstyle;

    let large = false;
    if (mathstyle.size === Mathstyle.DISPLAY.size &&
        this.value && this.value !== '\\smallint') {

        // Most symbol operators get larger in displaystyle (rule 13)
        large = true;
    }

    let base;
    let baseShift = 0;
    let slant = 0;
    if (this.symbol) {
        // If this is a symbol, create the symbol.
        const fontName = large ? 'Size2-Regular' : 'Size1-Regular';
        base = Span.makeSymbol(fontName, this.value,
            'op-symbol ' + (large ? 'large-op' : 'small-op'));
        base.type = 'mop';

        // Shift the symbol so its center lies on the axis (rule 13). It
        // appears that our fonts have the centers of the symbols already
        // almost on the axis, so these numbers are very small. Note we
        // don't actually apply this here, but instead it is used either in
        // the vlist creation or separately when there are no limits.
        baseShift = (base.height - base.depth) / 2 -
            mathstyle.metrics.axisHeight * mathstyle.sizeMultiplier;

        // The slant of the symbol is just its italic correction.
        slant = base.italic;

        // Bind the generated span and this atom so the atom can be retrieved
        // from the span later.
        this.bind(context, base);
    } else if (this.children) {
        // If this is a list, decompose that list.

        base = Span.makeOp(decompose(context, this.children));

        // Bind the generated span and this atom so the atom can be retrieved
        // from the span later.
        this.bind(context, base);
    } else {
        // Otherwise, this is a text operator. Build the text from the
        // operator's name.
        console.assert(this.type === 'mop');
        base = this.makeSpan(context.fontFamily('mainrm'), this.value);
    }

    if (this.superscript || this.subscript) {
        const limits = this.limits || 'auto';
        if (this.alwaysHandleSupSub || 
            limits === 'limits' || 
            (limits === 'auto' && mathstyle.size === Mathstyle.DISPLAY.size)) {
            return this.attachLimits(context, base, baseShift, slant);
        }
        return this.attachSupsub(context, base, 'mop');
    }

    if (this.symbol) base.setTop(baseShift);

    return base;
}



MathAtom.prototype.applySizing = function(context) {
    // A sizing operation
    const fontSize = {
        'size1': 0.5,
        'size2': 0.7,
        'size3': 0.8,
        'size4': 0.9,
        'size5': 1.0,
        'size6': 1.2,
        'size7': 1.44,
        'size8': 1.73,
        'size9': 2.07,
        'size10': 2.49
    }[this.size] * context.mathstyle.sizeMultiplier;

    context.size = this.size;
    context.sizeMultiplier = fontSize;

    return [];
}


MathAtom.prototype.decomposeColor = function(context) {
    let result = null;
    // A color operation
    if (this.color) {
        context.color = this.color;
    } else {
        result = makeOrd(decompose(context, this.body));

        if (this.textcolor) result.setStyle('color', this.textcolor);
        if (this.backgroundcolor) result.setStyle('background-color', this.backgroundcolor);

        // Make sure that the span takes the full height of the enclosed children
        // otherwise the background color will not completely cover it.
        result.setStyle('padding-top', Span.height(result) - Span.depth(result), 'em');
        result.setStyle('padding-bottom', Span.depth(result), 'em');
    }

    return result;
}


MathAtom.prototype.decomposeBox = function(context) {
    const result = makeOrd(decompose(context, this.body));

    const padding = this.padding ? this.padding : FONTMETRICS.fboxsep;

    // Make sure that the span takes the full height of the enclosed children
    // otherwise the background color will not completely cover it.
    result.setStyle('padding-top', Span.height(result) - Span.depth(result) + padding, 'em');
    result.setStyle('padding-bottom', Span.depth(result) + padding, 'em');

    if (this.backgroundcolor) result.setStyle('background-color', this.backgroundcolor);
    if (this.framecolor) result.setStyle('border', FONTMETRICS.fboxrule + 'em solid ' + this.framecolor);
    if (this.border) result.setStyle('border', this.border);
    result.setStyle('padding-left', padding, 'em');
    result.setStyle('padding-right', padding, 'em');

    result.setStyle('display', 'inline-block');

    return result;
}

MathAtom.prototype.decomposeEnclose = function(context) {
    const body = makeOrd(decompose(context, this.body));
    const padding = this.padding === 'auto' ? .2 : this.padding; // em
    // Make sure that the span takes the full height of the enclosed children

    if (Span.height(body) >= 1.0) {
        // If the body is short (i.e. a single line of digits, characters)
        // use no vertical padding, it looks better.
        body.setStyle('padding-top', Span.height(body) - Span.depth(body) + padding, 'em');
        body.setStyle('padding-bottom', Span.depth(body) - padding, 'em');
    }
    body.setStyle('padding-left', padding, 'em');
    body.setStyle('padding-right', padding, 'em');

    if (this.backgroundcolor && this.backgroundcolor !== 'transparent') {
        body.setStyle('background-color', this.backgroundcolor);
    }

    // Account for the padding
    body.height += padding + toEm(this.strokeWidth, 'px');
    body.depth += padding + toEm(this.strokeWidth, 'px');

    let svg = '';

    if (this.notation.box) body.setStyle('border', this.borderStyle);

    if (this.notation.actuarial) {
        body.setStyle('border-top', this.borderStyle);
        body.setStyle('border-right', this.borderStyle);
    }

    if (this.notation.madruwb) {
        body.setStyle('border-bottom', this.borderStyle);
        body.setStyle('border-right', this.borderStyle);
    }

    if (this.notation.roundedbox) {
        body.setStyle('border-radius', (Span.height(body) + Span.depth(body)) / 2, 'em');
        body.setStyle('border', this.borderStyle);        
    }

    if (this.notation.circle) {
        body.setStyle('border-radius', '50%');
        body.setStyle('border', this.borderStyle);        
    }

    if (this.notation.top) body.setStyle('border-top', this.borderStyle);
    if (this.notation.left) body.setStyle('border-left', this.borderStyle);
    if (this.notation.right) body.setStyle('border-right', this.borderStyle);
    if (this.notation.bottom) body.setStyle('border-bottom', this.borderStyle);

    if (this.notation.horizontalstrike) {
        svg += '<line x1="3%"  y1="50%" x2="97%" y2="50%"';
        svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (this.svgStrokeStyle) {
            svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    if (this.notation.verticalstrike) {
        svg += '<line x1="50%"  y1="3%" x2="50%" y2="97%"';
        svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (this.svgStrokeStyle) {
            svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
        }
        svg += '/>';
    }

    if (this.notation.updiagonalstrike) {
        svg += '<line x1="3%"  y1="97%" x2="97%" y2="3%"';
        svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (this.svgStrokeStyle) {
            svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    if (this.notation.downdiagonalstrike) {
        svg += '<line x1="3%"  y1="3%" x2="97%" y2="97%"';
        svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (this.svgStrokeStyle) {
            svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    // if (this.notation.updiagonalarrow) {
    //     const t = 1;
    //     const length = Math.sqrt(w * w + h * h);
    //     const f = 1 / length / 0.075 * t;
    //     const wf = w * f;
    //     const hf = h * f;
    //     const x = w - t / 2;
    //     let y = t / 2;
    //     if (y + hf - .4 * wf < 0 ) y = 0.4 * wf - hf;

    //     svg += '<line ';
    //     svg += `x1="1" y1="${h - 1}px" x2="${x - .7 * wf}px" y2="${y + .7 * hf}px"`;
    //     svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
    //     svg += ' stroke-linecap="round"';
    //     if (this.svgStrokeStyle) {
    //         svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';

    //     svg += '<polygon points="';
    //     svg += `${x},${y} ${x - wf - .4 * hf},${y + hf - .4 * wf} `;
    //     svg += `${x - .7 * wf},${y + .7 * hf} ${x - wf + .4 * hf},${y + hf + .4 * wf} `;
    //     svg += `${x},${y}`;
    //     svg += `" stroke='none' fill="${this.strokeColor}"`;

    //     svg += '/>';
    // }
    // if (this.notation.phasorangle) {
    //     svg += '<path d="';
    //     svg += `M ${h / 2},1 L1,${h} L${w},${h} "`; 
    //     svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
    //     if (this.svgStrokeStyle) {
    //         svg += ' stroke-linecap="round"';
    //         svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    // }
    // if (this.notation.radical) {
    //     svg += '<path d="';
    //     svg += `M 0,${.6 * h} L1,${h} L${emToPx(padding) * 2},1 "`; 
    //     svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
    //     if (this.svgStrokeStyle) {
    //         svg += ' stroke-linecap="round"';
    //         svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    // }
    // if (this.notation.longdiv) {
    //     svg += '<path d="';
    //     svg += `M ${w} 1 L1 1 a${emToPx(padding)} ${h / 2}, 0, 0, 1, 1 ${h} "`; 
    //     svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
    //     if (this.svgStrokeStyle) {
    //         svg += ' stroke-linecap="round"';
    //         svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    // }

    if (svg) {
        let svgStyle;
        if (this.shadow !== 'none') {
            if (this.shadow === 'auto') {
                svgStyle = 'filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333)';
            } else {
                svgStyle = 'filter: drop-shadow(' + this.shadow + ')';
            }
        }
        return Span.makeSVG(body, svg, svgStyle);
    }
    return body;
}

/**
 * Return a representation of this, but decomposed in an array of Spans
 * 
 * @param {Context} context Font variant, size, color, etc...
 * @return {Span[]}
 * @method MathAtom#decompose
 */
MathAtom.prototype.decompose = function(context) {
    console.assert(context instanceof Context.Context);

    let result = null;

    if (this.type === 'group' || this.type === 'root') {
        result = this.decomposeGroup(context);

    } else if (this.type === 'array') {
        result = this.decomposeArray(context);

    } else if (this.type === 'genfrac') {
        result = this.decomposeGenfrac(context);
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'surd') {
        result = this.decomposeSurd(context);
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'accent') {
        result = this.decomposeAccent(context);
        
    } else if (this.type === 'leftright') {
        result = this.decomposeLeftright(context);
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'delim') {
        result = makeSpan('', '');
        result.delim = this.delim;
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'sizeddelim') {
        result = Delimiters.makeSizedDelim(
                this.cls, this.delim, this.size, context);

    } else if (this.type === 'line') {
        result = this.decomposeLine(context);

    } else if (this.type === 'overunder') {
        result = this.decomposeOverunder(context);
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'overlap') {
        // For llap (18), rlap (270), clap (0)
        // smash (common), mathllap (0), mathrlap (0), mathclap (0)
        // See https://www.tug.org/TUGboat/tb22-4/tb72perlS.pdf
        // and https://tex.stackexchange.com/questions/98785/what-are-the-different-kinds-of-vertical-spacing-and-horizontal-spacing-commands
        result = this.decomposeOverlap(context);

    } else if (this.type === 'rule') {
        result = this.decomposeRule(context);


    } else if (this.type === 'styling') {
        //
        // STYLING
        //
     

    } else if (this.type === 'mord' || 
        this.type === 'minner' || this.type === 'mbin' ||
        this.type === 'mrel' || this.type === 'mpunct' ||
        this.type === 'mopen' || this.type === 'mclose' ||
        this.type === 'textord'
        ) {
        // Any of those atoms can be made up of either a simple string,
        // stored in this.value or a list of children.
        if (this.value) {
            result = this.makeSpan(context, this.value);
            result.type = this.type;
        } else {
            result = this.makeSpan(context, decompose(context, this.children));
        }

    } else if (this.type === 'op' || this.type === 'mop') {
        console.assert(this.type === 'mop');
        result = this.decomposeOp(context);
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'font') {
        result = this.decomposeFont(context);
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'space') {
        // A space litteral
        result = this.makeSpan(context, ' ');
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'spacing') {
        // A spacing command (\quad, etc...)
        
        if (this.value === '\u200b') {
            // ZERO-WIDTH SPACE
            result = this.makeSpan(context, '\u200b');
        } else if (this.value === '\u00a0') {
            if (this.mode === 'math') {
                result = this.makeSpan(context, ' ');
            } else {
                result = this.makeSpan(context, '\u00a0');
            }
        } else if (this.width) {
            result = makeSpan('', 'mspace ');
            if (this.width > 0) {
                result.setWidth(this.width);            
            } else {
                result.setStyle('margin-left', this.width, 'em');
            }
        } else {
            const spacingCls = {
                'qquad': 'qquad',
                'quad': 'quad',
                'enspace': 'enspace',
                ';': 'thickspace',
                ':': 'mediumspace',
                ',': 'thinspace',
                '!': 'negativethinspace'}[this.value] || 'quad'
            result = makeSpan('', 'mspace ' + spacingCls);
        }
        if (this.hasCaret) result.hasCaret = true;

    } else if (this.type === 'color') {
        result = this.decomposeColor(context);

    } else if (this.type === 'sizing') {
        this.applySizing(context);

    } else if (this.type === 'mathstyle') {
        context.setMathstyle(this.mathstyle);

    } else if (this.type === 'box') {
        result = this.decomposeBox(context);

    } else if (this.type === 'enclose') {
        result = this.decomposeEnclose(context);
        if (this.hasCaret) result.hasCaret = true;


    } else if (this.type === 'esc' || this.type === 'command' || 
        this.type === 'error' || this.type === 'placeholder' ) {
        result = this.makeSpan(context, this.value);
        if (this.error) {
            result.classes += ' ML__error';
        }
        if (this.suggestion) {
            result.classes += ' ML__suggestion';
        }

    } else if (this.type === 'first') {
        // the `first` pseudo-type is used as a placeholder as 
        // the first element in a children list. This makes 
        // managing the list, and the caret selection, easier. 
        // ZERO-WIDTH SPACE
        result = this.makeSpan(context, '\u200b');

    } else {
        //
        // DEFAULT
        //
        console.assert(false, 'Unknown MathAtom type: "' + this.type + '"');
    }

    if (!result) return result;

    // console.assert(!Array.isArray(result));
    // At this point, result is a single Span

    // Finally, attach any necessary superscript, subscripts
    if (!this.limits && (this.superscript || this.subscript)) {
        // If limits is set, the attachment of sup/sub was handled
        // in the atom decomposition (e.g. decomposeOp, decomposeAccent)
        if (Array.isArray(result)) {
            const lastSpan = result[result.length - 1];
            result[result.length - 1] = 
                this.attachSupsub(context, lastSpan, lastSpan.type);
        } else {
         result = [this.attachSupsub(context, result, result.type)];
        }
    }

    return Array.isArray(result) ? result : [result];
}



MathAtom.prototype.attachSupsub = function(context, nucleus, type) {
    // If no superscript or subscript, nothing to do.
    if (!this.superscript && !this.subscript) return nucleus;

    // Superscript and subscripts are discussed in the TeXbook 
    // on page 445-446, rules 18(a-f).
    // TeX:14859-14945

    const mathstyle = context.mathstyle;
    let supmid = null;
    let submid = null;

    if (this.superscript) {
        const sup = decompose(context.sup(), this.superscript);
        supmid = makeSpan(sup, mathstyle.adjustTo(mathstyle.sup()));
    }
    if (this.subscript) {
        const sub = decompose(context.sub(), this.subscript);
        submid = makeSpan(sub, mathstyle.adjustTo(mathstyle.sub()));
    }

    // Rule 18a
    let supShift = 0;
    let subShift = 0;
    if (!this.isCharacterBox()) {
        supShift = Span.height(nucleus) - mathstyle.metrics.supDrop;
        subShift = Span.depth(nucleus) + mathstyle.metrics.subDrop;
    }

    // Rule 18c
    let minSupShift;
    if (mathstyle === Mathstyle.DISPLAY) {
        minSupShift = mathstyle.metrics.sup1;
    } else if (mathstyle.cramped) {
        minSupShift = mathstyle.metrics.sup3;
    } else {
        minSupShift = mathstyle.metrics.sup2;
    }

    // scriptspace is a font-size-independent size, so scale it
    // appropriately
    const multiplier = Mathstyle.TEXT.sizeMultiplier *
            mathstyle.sizeMultiplier;
    const scriptspace =
        (0.5 / FONTMETRICS.ptPerEm) / multiplier;


    let supsub = null;
    
    if (submid && supmid) {
        // Rule 18e
        supShift = Math.max(
            supShift, minSupShift, supmid.depth + 0.25 * mathstyle.metrics.xHeight);
        subShift = Math.max(subShift, mathstyle.metrics.sub2);

        const ruleWidth = FONTMETRICS.defaultRuleThickness;

        if ((supShift - Span.depth(supmid)) - (Span.height(submid) - subShift) <
                4 * ruleWidth) {
            subShift = 4 * ruleWidth - (supShift - supmid.depth) + Span.height(submid);
            const psi = 0.8 * mathstyle.metrics.xHeight - (supShift - Span.depth(supmid));
            if (psi > 0) {
                supShift += psi;
                subShift -= psi;
            }
        }

        supsub = makeVlist(context, [
            submid, subShift,
            supmid, -supShift
        ], 'individualShift');

        // Subscripts shouldn't be shifted by the nucleus' italic correction.
        // Account for that by shifting the subscript back the appropriate
        // amount. Note we only do this when the nucleus is a single symbol.
        if (this.symbol) {
            supsub.children[0].setLeft(-Span.italic(nucleus));
        }

    } else if (submid && !supmid) {
        // Rule 18b
        subShift = Math.max(
            subShift, mathstyle.metrics.sub1,
            Span.height(submid) - 0.8 * mathstyle.metrics.xHeight);

        supsub = makeVlist(context, [submid], 'shift', subShift);
        supsub.children[0].setRight(scriptspace);

        if (this.isCharacterBox()) {
            supsub.children[0].setLeft(-Span.italic(nucleus));
        }
    } else if (!submid && supmid) {
        // Rule 18c, d
        supShift = Math.max(supShift, minSupShift,
            supmid.depth + 0.25 * mathstyle.metrics.xHeight);

        supsub = makeVlist(context, [supmid], 'shift', -supShift);
        supsub.children[0].setRight(scriptspace);
    }

    // Display the caret *following* the superscript and subscript, 
    // so attach the caret to the 'msupsub' element.
    if (this.hasCaret) supsub.hasCaret = true;

    return Span.makeSpanOfType(type, [nucleus, makeSpan(supsub, 'msupsub')]);
}


/**
 * Add an ID attribute to both the span and this atom so that the atom
 * can be retrieved from the span later on (e.g. when the span is clicked on)
 * @param {Context} context
 * @param {Span} span
 * @method MathAtom#bind
 */
MathAtom.prototype.bind = function(context, span) {
    if (context.generateID && this.type !== 'first') {
        this.id = Date.now().toString(36) + 
            Math.floor(Math.random() * 0x186a0).toString(36);

        if (!span.attributes) span.attributes = {};
        
        span.attributes['data-atom-id'] =  this.id;
    }
    return span;
}



/**
 * Create a span with the specified body and with a class attribute 
 * equal to the type ('mbin', 'inner', 'spacing', etc...)
 * 
 * @param {Context} context
 * @param {(string|Span[])} body
 * @return {Span}
 * @method MathAtom#makeSpan
 */
MathAtom.prototype.makeSpan = function(context, body) {
    const type = this.type === 'textord' ? 'mord' : this.type;
    let result = Span.makeSpanOfType(type, body);

    //
    // 1. Determine the font family (i.e. 'amsrm', 'mathit', 'mathcal', etc...)
    //
    
    // The font family is determined by:
    // - the font family associated with this atom (optional). For example,
    // some atoms such as some functions ('\sin', '\cos', etc...) or some 
    // symbols ('\Z') have an explicit font family.
    // - the font family in the current parsing context, represented by the
    // context.font argument. This can also be null.

    // In general, the font from the parsing context overrides the 
    // atom's font family
    let fontFamily = context.font || this.fontFamily;

    // Exception:  if this.fontFamily === 'amsrm', always use 'amsrm' as the
    // font family. Apply variants for bold/italic
    if (this.fontFamily === 'amsrm') {
        fontFamily = 'amsrm';
        if (context.font === 'mathbf') {
            result.setStyle('font-weight', 'bold');
        } else if (context.font === 'mathit') {
            result.setStyle('font-variant', 'italic');
        }
    } else if (type === 'mop') {
        // If it's an operator (e.g. '\sin'), prefer the operator's font family
        fontFamily = this.fontFamily || context.font;
    }


    //
    // 2. Determine the font name associated with this fontFamily
    //

    let fontName = 'Main-Regular';  // Default font
    if (fontFamily) {
        // Use either the calculcated font name or, if the font does not 
        // include the symbol, the original font associated with this symbol.
        fontName = getFontName(body, fontFamily);
        if (!fontName && this.fontFamily) {
            fontFamily = this.fontFamily;
            fontName = getFontName(body, fontFamily) || fontFamily;
        }
        if (!fontName && context.font) {
            fontFamily = context.font;
            fontName = getFontName(body, fontFamily) || fontFamily;
        }

        if (fontName === 'AMS-Regular') {
            result.classes += ' amsrm';
        } else if (fontName === 'Main-Italic') {
            result.classes += ' mainit';
        } else if (fontName === 'Math-Italic') {
            result.classes += ' mathit';
        } else if (fontFamily) {
            result.classes += ' ' + fontFamily;
        }
    }

    if (!fontName) {
        console.error('no fontname');
    }

    //
    // 3. Get the metrics information
    //

    if (body && typeof body === 'string' && body.length > 0) {
        result.height = 0;
        result.depth = 0;
        result.skew = 0;
        result.italic = 0;
        for (let i = 0; i < body.length; i++) {
            const metrics = getCharacterMetrics(body.charAt(i), fontName);
            // If we were able to get metrics info for this character, store it.
            if (metrics) {
                result.height = Math.max(result.height, metrics.height);
                result.depth = Math.max(result.depth, metrics.depth);
                result.skew = metrics.skew;
                result.italic = metrics.italic;
            }
        }
        // The italic correction applies only in math mode
        if (this.mode !== 'math') result.italic = 0;

    }

    //
    // 4. Apply size correction
    //

    if (context.parentSize !== context.size) {
        result.classes += ' sizing reset-' + context.parentSize;
        result.classes += ' ' + context.size;
    }

    //
    // 5. Set other attributes
    //

    if (context.mathstyle.isTight()) result.isTight = true;

    result.setRight(result.italic); // Italic correction

    result.setStyle('color', context.getColor());
    result.setStyle('background-color', context.getBackgroundColor());
    
    // To retrieve the atom from a span, for example when the span is clicked
    // on, attach a randomly generated ID to the span and associate it 
    // with the atom.
    this.bind(context, result);

    if (this.hasCaret) {
        // If this has a super/subscript, the caret will be attached
        // to the 'msupsub' atom, so no need to have it here.
        if (!this.superscript && !this.subscript) {
            result = Span.makeSpanOfType(type, result);
            result.hasCaret = true;
        }
        if (context.mathstyle.isTight()) result.isTight = true;
    }

    return result;
}



MathAtom.prototype.attachLimits = 
    function(context, nucleus, nucleusShift, slant) {

    const limitAbove = this.superscript ? makeSpan(decompose(context.sup(), this.superscript), 
        context.mathstyle.adjustTo(context.mathstyle.sup())) : null;
    const limitBelow = this.subscript ? makeSpan(decompose(context.sub(), this.subscript), 
        context.mathstyle.adjustTo(context.mathstyle.sub())) : null;

    return makeStack(context, nucleus, nucleusShift, slant,
        limitAbove, limitBelow, 'mop');
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/**
 * Combine a nucleus with an atom above and an atom below. Used to form
 * limits and used by \stackrel.
 * 
 * @param {Context} context 
 * @param {Span} nucleus The base over and under which the atoms will
 * be placed.
 * @param {integer} nucleusShift The vertical shift of the nucleus from 
 * the baseline.
 * @param {integer} slant For operators that have a slant, such as \int, 
 * indicate by how much to horizontally offset the above and below atoms
 * @param {Span} above 
 * @param {Span} below 
 * @param {string} type The type ('mop', 'mrel', etc...) of the result
 * @return {Span}
 * @memberof module:mathAtom
 * @private
 */
function makeStack(context, nucleus, nucleusShift, slant, above, below, type) {
    // If nothing above and nothing below, nothing to do.
    if (!above && !below) return nucleus;

    // IE 8 clips \int if it is in a display: inline-block. We wrap it
    // in a new span so it is an inline, and works.
    // @todo: revisit
    nucleus = makeSpan(nucleus);

    let aboveShift = 0;
    let belowShift = 0;

    if (above) {
        aboveShift = Math.max(
            FONTMETRICS.bigOpSpacing1,
            FONTMETRICS.bigOpSpacing3 - above.depth);
    }
    if (below) {
        belowShift = Math.max(
            FONTMETRICS.bigOpSpacing2,
            FONTMETRICS.bigOpSpacing4 - below.height);
    }

    let result = null;
    
    if (below && above) {
        const bottom = FONTMETRICS.bigOpSpacing5 +
            Span.height(below) + Span.depth(below) +
            belowShift +
            Span.depth(nucleus) + nucleusShift;

        result = makeVlist(context, [
            FONTMETRICS.bigOpSpacing5,
            below, belowShift,
            nucleus, aboveShift,
            above, FONTMETRICS.bigOpSpacing5,
        ], 'bottom', bottom);

        // Here, we shift the limits by the slant of the symbol. Note
        // that we are supposed to shift the limits by 1/2 of the slant,
        // but since we are centering the limits adding a full slant of
        // margin will shift by 1/2 that.
        result.children[0].setLeft(-slant);
        result.children[2].setLeft(slant);

    } else if (below && !above) {
        const top = Span.height(nucleus) - nucleusShift;

        result = makeVlist(context, [
            FONTMETRICS.bigOpSpacing5,
            below,
            belowShift,
            nucleus,
        ], 'top', top);

        // See comment above about slants
        result.children[0].setLeft(-slant);
    } else if (!below && above) {
        const bottom = Span.depth(nucleus) + nucleusShift;

        result = makeVlist(context, [
            nucleus, aboveShift,
            above, FONTMETRICS.bigOpSpacing5,
        ], 'bottom', bottom);

        // See comment above about slants
        result.children[1].setLeft(slant);
    }

    return Span.makeSpanOfType(type, result, 'op-limits');
}

//----------------------------------------------------------------------------
// FONTS
//----------------------------------------------------------------------------

// Map an abstract 'fontFamily' to an actual font name
const FONT_NAME = {
    'main':     'Main-Regular',
    'mainrm': 'Main-Regular',
    'mathrm': 'Main-Regular',
    'mathbf': 'Main-Bold',
    'textrm': 'Main-Regular',
    'textit': 'Main-Italic',
    'textbf': 'Main-Bold',
    // Note; 'mathit' is handled separately in getFontName
    'amsrm': 'AMS-Regular',     // pseudo-fontFamily to select AMS-Regular
    'mathbb': 'AMS-Regular',
    'mathcal': 'Caligraphic-Regular',
    'mathfrak': 'Fraktur-Regular',
    'mathscr': 'Script-Regular',
    'mathsf': 'SansSerif-Regular',
    'mathtt': 'Typewriter-Regular'
};

const GREEK_REGEX = /\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5/;


/**
 * Given a font family ('mathbf', 'mathit'...) return a corresponding
 * font name. If the font does not support the specified symbol
 * return an alternate font or null if none could be determined.
 * @param {(string|Span[])} symbol the character for which we're seeking the font
 * @param {string} fontFamily such as 'mathbf', 'mathfrak', etc...
 * @return {string} a font name
 * @memberof module:mathAtom
 * @private
 */
function getFontName(symbol, fontFamily) {
    // If this is not a single char, just do a simple fontFamily -> fontName mapping
    if (typeof symbol !== 'string' || 
        symbol.length > 1 || 
        symbol === '\u200b') {
        return FONT_NAME[fontFamily] || fontFamily;
    }

    console.assert(symbol && typeof symbol === 'string');

    // This is a single character. Do some remapping as necessary.

    let result = '';
    if (fontFamily === 'mathit') {
        // Some characters do not exist in the Math-Italic font, 
        // use Main-Italic instead
        if (/[0-9]/.test(symbol) || symbol === '\\imath' ||
            symbol === '\\jmath' || symbol === '\\pounds' ) {
            result = 'Main-Italic'
        } else if (/[A-Za-z]/.test(symbol) || GREEK_REGEX.test(symbol)) {
            result = 'Math-Italic';
        } else {
            result = 'Main-Regular';
        }
    } else if (fontFamily === 'mathrm') {
        if (GREEK_REGEX.test(symbol)) {
            result = 'Math-Regular';    // Hmmm... Math-Regular is actually an italic font!
        } else {
            result = 'Main-Regular';
        }
    } else if (fontFamily === 'mathbf') {
        if (GREEK_REGEX.test(symbol)) {
            result = 'Math-BoldItalic';
        } else {
            result = 'Main-Bold';
        }
    } else {
        // If symbol is not in the repertoire of the font,
        // return null.
        if (fontFamily === 'mathbb' || fontFamily === 'mathscr') {
            // These fonts only support [A-Z]
            if (!/^[A-Z ]$/.test(symbol)) return null;

        } else if (fontFamily === 'mathcal') {
            // Only supports uppercase latin and digits
            if (!/^[0-9A-Z ]$/.test(symbol)) return null;

        } else if (fontFamily === 'mathfrak') {
            if (!/^[0-9A-Za-z ]$|^[!"#$%&'()*+,\-./:;=?[]^’‘]$/.test(symbol)) {
                return null;
            }
        } else if (fontFamily === 'mathtt' || fontFamily === 'texttt' || fontFamily === 'textsf' || fontFamily === 'mathsf') {
            if (!/^[0-9A-Za-z ]$|^[!"&'()*+,\-./:;=?@[]^_~\u0131\u0237\u0393\u0394\u0398\u039b\u039e\u03A0\u03A3\u03A5\u03A8\u03a9’‘]$/.test(symbol)) {
                return null;
            }
        }

        result = FONT_NAME[fontFamily];
    }
    return result;
}


/**
 * Return a list of spans equivalent to atoms.
 * A span is the most elementary type possible, for example 'text'
 * or 'vlist', while the input atoms may be more abstract and complex,
 * such as 'genfrac'
 * 
 * @param {Context} context Font family, variant, size, color, etc...
 * @param {(MathAtom|MathAtom[])} atoms
 * @return {Span[]}
 * @memberof module:mathAtom
 * @private
 */
function decompose(context, atoms) {
    if (!(context instanceof Context.Context)) {
        // We can be passed either a Context object, or a simple object
        // with some properties set.
        // If those properties are not set, use default values..
        if (typeof context.generateID === 'undefined') context.generateID = false;
        context.size = context.size || 'size5'; // medium size
        context.mathstyle = context.mathstyle || 'displaystyle';

        context = new Context.Context(context);
    }
    let result = [];
    if (Array.isArray(atoms)) {
        if (atoms.length === 0) {
            return result;

        } else if (atoms.length === 1) {
            result = atoms[0].decompose(context);
            if (atoms[0].isSelected && result) {
                const isTight = result.isTight;
                let type = result.type;
                if (type === 'placeholder') type = 'mord';
                result = Span.makeSpanOfType(type, result, 'ML__selected');
                result.isTight = isTight;
                result = [result];
            }
            console.assert(!result || Array.isArray(result));

        } else {
            let previousType = 'none';
            let nextType = atoms[1].type;
            let selection =  [];
            let selectionType = '';
            let selectionIsTight = false;
            for (let i = 0; i < atoms.length; i++) {
                // Is this a binary operator ('+', '-', etc...) that potentially 
                // needs to be adjusted?
                // When preceded by a mbin, mopen, mrel, mpunct, mop or 
                // when followed by a mrel, mclose or mpunct
                // or if preceded or followed by no sibling, a 'mbin' becomes a 
                // 'mord'
                if (atoms[i].type === 'mbin') {
                    if (['none', 'mrel', 'mpunct', 'mopen', 'mbin', 'mop']
                            .includes(previousType) || 
                        ['none', 'mrel', 'mpunct', 'mclose']
                            .includes(nextType)) {
                        atoms[i].type = 'mord';
                    }
                }

                if (result.length >= 1 && atoms[i].type === 'spacing' && atoms[i].width) {
                    // This is a manual spacing command, e.g. \hspace.
                    // Adjust the margin of the previous span
                    result[result.length - 1].addMarginRight(atoms[i].width);
                } else if (result.length >= 1 && atoms[i].type === 'spacing') {
                    // This is spacing command, e.g. \,
                    // Adjust the margin of the previous span
                    const width = {
                        'qquad': 2,
                        'quad': 1,
                        'enspace': .5,
                        ';': 0.277778,
                        ':': 0.222222,
                        ',': 0.166667,
                        '!': -0.166667}[atoms[i].value] || 1;

                    result[result.length - 1].addMarginRight(width);
                } else {
                    const span = atoms[i].decompose(context);
                    // The result from decompose is an array
                    if (span) {
                        console.assert(Array.isArray(span));
                        // Flatten it (i.e. [[a1, a2], b1, b2] -> [a1, a2, b1, b2]
                        const flat = [].concat.apply([], span);
                        if (atoms[i].isSelected && !context.isSelected) {
                            selection = selection.concat(flat);
                            if (!selectionType) {
                                selectionType = span[0].type;
                                if (selectionType === 'placeholder') selectionType = 'mord';
                                selectionIsTight = span[0].isTight;
                            }
                        } else {
                            if (selection.length > 0) {
                                // There was a selection, but we're out of it now
                                // Insert the selection
                                const span = Span.makeSpanOfType(
                                        selectionType, selection, 'ML__selected');
                                span.isTight = selectionIsTight;
                                result.push(span);
                                selection = [];
                                selectionType = '';
                            }
                            result = result.concat(flat);
                        }
                    }
                }

                // Since the next atom (and this atom!) could have children
                // use getFinal...() and getInitial...() to get the closest
                // atom linearly.
                previousType = atoms[i].getFinalBaseElement().type;
                nextType = i < atoms.length - 1 ? atoms[i + 1].getInitialBaseElement().type : 'none';
            }
            // Is there a leftover selection?
            if (selection.length > 0) {
                const span = Span.makeSpanOfType(
                    selectionType, selection, 'ML__selected');
                span.isTight = selectionIsTight;
                result.push(span);
                selection = [];
                selectionType = '';
            }
        }
    } else if (atoms) {
        // This is a single atom, decompose it
        result = atoms.decompose(context);
        if (atoms.isSelected && !context.isSelected) {
            let type = result.type;
            if (type === 'placeholder') type = 'mord';
            const span = Span.makeSpanOfType(type, result, 'ML__selected');
            span.isTight = result.isTight;

            result = [span];
        }
    }
    

    if (!result) return result;

    console.assert(Array.isArray(result) && result.length > 0);

    // A table of size -> font size for the different sizing functions
    const SIZING_MULTIPLIER = {
        size1: 0.5,
        size2: 0.7,
        size3: 0.8,
        size4: 0.9,
        size5: 1.0,
        size6: 1.2,
        size7: 1.44,
        size8: 1.73,
        size9: 2.07,
        size10: 2.49,
    };

    // If the mathstyle changed between the parent and the current atom,
    // account for the size difference
    if (context.mathstyle !== context.parentMathstyle) {
        const factor = context.mathstyle.sizeMultiplier /
                context.parentMathstyle.sizeMultiplier;
        for (const span of result) {
            console.assert(!Array.isArray(span));
            console.assert(typeof span.height === 'number' && !isNaN(span.height));
            span.height *= factor;
            span.depth *= factor;
        }
    }
    // If the size changed between the parent and the current group,
    // account for the size difference
    if (context.size !== context.parentSize) {
        const factor = SIZING_MULTIPLIER[context.size] /
                SIZING_MULTIPLIER[context.parentSize];
        for (const span of result) {
            console.assert(!Array.isArray(span));
            console.assert(typeof span.height === 'number' && !isNaN(span.height));
            span.height *= factor;
            span.depth *= factor;
        }
    }

    return result;
}

function makeRoot(parseMode, children) {
    parseMode = parseMode || 'math';
    const result =  new MathAtom(parseMode, 'root', null);
    result.children = children || [];
    if (result.children.length === 0 || result.children[0].type !== 'first') {
        result.children.unshift(new MathAtom(parseMode, 'first', null));
    }
    return result;
}



// Export the public interface for this module
return { 
    MathAtom,
    decompose,
    makeRoot
}


})
