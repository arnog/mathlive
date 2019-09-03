/**
 *
 * See also the class {@linkcode MathAtom}
 * @module core/mathatom
 * @private
 */
import Mathstyle from './mathstyle.js';
import Context from './context.js';
import {METRICS as FONTMETRICS} from './fontMetrics.js';
import Span from './span.js';
import Delimiters from './delimiters.js';

const makeSpan = Span.makeSpan;
const makeOrd = Span.makeOrd;
const makeInner = Span.makeInner;
const makeHlist = Span.makeHlist;
const makeVlist = Span.makeVlist;
export const GREEK_REGEX = /\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5/;

// TeX by default auto-italicize latin letters and lowercase greek letters
const AUTO_ITALIC_REGEX = /^([A-Za-z]|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5)$/;

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

/**
 * An atom is an object encapsulating an elementary mathematical unit,
 * independent of its graphical representation.
 *
 * It keeps track of the content, while the dimensions, position and style
 * are tracked by Span objects which are created by the `decompose()` functions.
 *
 * @param {string} mode
 * @param {string} type
 * @param {string|MathAtom[]} body
 * @param {Object.<string, any>} [style={}] A set of additional properties to append to
 * the atom
 * @return {MathAtom}
 * @property {string} mode `'display'`, `'command'`, etc...
 * @property {string} type - Type can be one of:
 * - `mord`: ordinary symbol, e.g. `x`, `\alpha`
 * - `textord`: ordinary characters
 * - `mop`: operators, including special functions, `\sin`, `\sum`, `\cap`.
 * - `mbin`: binary operator: `+`, `*`, etc...
 * - `mrel`: relational operator: `=`, `\ne`, etc...
 * - `mpunct`: punctuation: `,`, `:`, etc...
 * - `mopen`: opening fence: `(`, `\langle`, etc...
 * - `mclose`: closing fence: `)`, `\rangle`, etc...
 * - `minner`: special layout cases, overlap, `\left...\right`
 *
 * In addition to these basic types, which correspond to the TeX atom types,
 * some atoms represent more complex compounds, including:
 * - `space` and `spacing`: blank space between atoms
 * - `mathstyle`: to change the math style used: `display` or `text`.
 * The layout rules are different for each, the latter being more compact and
 * intended to be incorporated with surrounding non-math text.
 * - `root`: a group, which has no parent (only one per formula)
 * - `group`: a simple group of atoms, for example from a `{...}`
 * - `sizing`: set the size of the font used
 * - `rule`: draw a line, for the `\rule` command
 * - `line`: used by `\overline` and `\underline` commands
 * - `box`: a border drawn around an expression and change its background color
 * - `overlap`: display a symbol _over_ another
 * - `overunder`: displays an annotation above or below a symbol
 * - `array`: a group, which has children arranged in rows. Used
 * by environments such as `matrix`, `cases`, etc...
 * - `genfrac`: a generalized fraction: a numerator and denominator, separated
 * by an optional line, and surrounded by optional fences
 * - `surd`: a surd, aka root
 * - `leftright`: used by the `\left` and `\right` commands
 * - `delim`: some delimiter
 * - `sizeddelim`: a delimiter that can grow
 *
 * The following types are used by the editor:
 * - `command` indicate a command being entered. The text is displayed in
 * blue in the editor.
 * - `error`: indicate a command that is unknown, for example `\xyzy`. The text
 * is displayed with a wavy red underline in the editor.
 * - `placeholder`: indicate a temporary item. Placeholders are displayed
 * as a dashed square in the editor.
 * - `first`: a special, empty, atom put as the first atom in math lists in
 * order to be able to position the caret before the first element. Aside from
 * the caret, they display nothing.
 *
 * @property {string|MathAtom[]} body
 * @property {MathAtom[]} superscript
 * @property {MathAtom[]} subscript
 * @property {MathAtom[]} numer
 * @property {MathAtom[]} denom
 * 
 * @property {boolean} captureSelection if true, this atom does not let its
 * children be selected. Used by the `\enclose` annotations, for example.
 * 
 * @property {boolean} skipBoundary if true, when the caret reaches the
 * first position in this element's body, it automatically moves to the
 * outside of the element. Conversely, when the caret reaches the position
 * right after this element, it automatically moves to the last position
 * inside this element.
 * 
 * @class
 * @private
 */
class MathAtom {
    /**
     * 
     * @param {string} mode 
     * @param {string} type 
     * @param {string|Array} body 
     * @param {object} style 
     */
    constructor(mode, type, body, style) {
        this.mode = mode;
        this.type = type;
        this.body = body;

        // Append all the properties in extras to this
        // This can override the mode, type and body
        this.applyStyle(style);
    }

    getStyle() {
        return {
            color: this.phantom ? 'transparent' : this.color,
            backgroundColor: this.phantom ? 'transparent' : this.backgroundColor,
            fontFamily: this.baseFontFamily || this.fontFamily || this.autoFontFamily,
            fontShape: this.fontShape,
            fontSeries: this.fontSeries,
            fontSize: this.fontSize,
            cssId: this.cssId,
            cssClass: this.cssClass
        }
    }

    applyStyle(style) {
        // Always apply the style, even if null. This will also set the 
        // autoFontFamily, which account for auto-italic. This code path
        // is used by \char.
        Object.assign(this, style);

        if (this.fontFamily === 'none') {
            this.fontFamily = '';
        }
        if (this.fontShape === 'auto') {
            this.fontShape = '';
        }
        if (this.fontSeries === 'auto') {
            this.fontSeries = '';
        }
        if (this.color === 'none') {
            this.color = '';
        }
        if (this.backgroundColor === 'none') {
            this.backgroundColor = '';
        }
        if (this.fontSize === 'auto') {
            this.fontSize = '';
        }

        if (this.fontSize) {
            this.maxFontSize = SIZING_MULTIPLIER[this.fontSize] ;
        }

        if (this.mode === 'math') {
            const symbol = typeof this.body === 'string' ? this.body : '';
            this.autoFontFamily = 'cmr';
            if (AUTO_ITALIC_REGEX.test(symbol)) {
                // Auto italicize alphabetic and lowercase greek symbols
                // in math mode (European style: American style would not
                // italicize greek letters, but it's TeX's default behavior)
                this.autoFontFamily = 'math';
            } else if (/\\imath|\\jmath|\\pounds/.test(symbol)) {
                // Some characters do not exist in the Math font,
                // use Main italic instead
                this.autoFontFamily = 'mainit';
            } else if (!GREEK_REGEX.test(symbol) && this.baseFontFamily === 'math') {
                this.autoFontFamily = 'cmr';
            }
        } else if (this.mode === 'text') {
            // A root can be in text mode (root created when creating a representation
            // of the selection, for copy/paste for example)
            if (this.type !== 'root') this.type = '';
            delete this.baseFontFamily;
            delete this.autoFontFamily;
        }
    }

    getInitialBaseElement() {
        let result = this;
        if (Array.isArray(this.body) && this.body.length > 0) {
            if (this.body[0].type !== 'first') {
                result = this.body[0].getInitialBaseElement();
            } else if (this.body[1]) {
                result = this.body[1].getInitialBaseElement();
            }
        }
        return result;
    }


    getFinalBaseElement() {
        if (Array.isArray(this.body) && this.body.length > 0) {
            return this.body[this.body.length - 1].getFinalBaseElement();
        }
        return this;
    }


    isCharacterBox() {
        const base = this.getInitialBaseElement();
        return /minner|mbin|mrel|mpunct|mopen|mclose|textord/.test(base.type);
    }


    forEach(cb) {
        cb(this);
        if (Array.isArray(this.body)) {
            for (const atom of this.body) if (atom) atom.forEach(cb);
        } else if (this.body && typeof this.body === 'object') {
            // Note: body can be null, for example 'first' or 'rule'
            // (and null is an object)
            cb(this.body);
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
        if (this.index) {
            for (const atom of this.index) if (atom) atom.forEach(cb);
        }
        if (this.array) {
            for (const row of this.array) {
                for (const cell of row) {
                    for (const atom of cell) atom.forEach(cb);
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
     * @private
     */
    filter(cb) {
        let result = [];
        if (cb(this)) result.push(this);
        for (const relation of ['body', 'superscript', 'subscript',
            'overscript', 'underscript',
            'numer', 'denom', 'index']) {
            if (Array.isArray(this[relation])) {
                for (const atom of this[relation]) {
                    if (atom) result = result.concat(atom.filter(cb));
                }
            }
        }
        if (Array.isArray(this.array)) {
            for (const row of this.array) {
                for (const cell of row) {
                    if (cell) result = result.concat(cell.filter(cb));
                }
            }
        }
        return result;
    }


    decomposeGroup(context) {
        // The scope of the context is this group, so clone it
        // so that any changes to it will be discarded when finished
        // with this group.
        // Note that the mathstyle property is optional and could be undefined
        // If that's the case, clone() returns a clone of the
        // context with the same mathstyle.
        const localContext = context.clone({mathstyle: this.mathstyle});
        const span = makeOrd(decompose(localContext, this.body));
        if (this.cssId) span.cssId = this.cssId;
        span.applyStyle({
            backgroundColor: this.backgroundColor, 
            cssClass: this.cssClass
        });
        return span;
    }


    decomposeArray(context) {
        // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
        // and http://tug.ctan.org/macros/latex/base/lttab.dtx
        let colFormat = this.colFormat;
        if (colFormat && colFormat.length === 0) {
            colFormat = [{ align: 'l' }];
        }
        if (!colFormat) {
            colFormat = [{ align: 'l' }, { align: 'l' }, { align: 'l' },
            { align: 'l' }, { align: 'l' }, { align: 'l' }, { align: 'l' }, { align: 'l' },
            { align: 'l' }, { align: 'l' }];
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
        const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx
        let totalHeight = 0;
        let nc = 0;
        const body = [];
        const nr = array.length;
        for (let r = 0; r < nr; ++r) {
            const inrow = array[r];
            nc = Math.max(nc, inrow.length);
            let height = arstrutHeight; // \@array adds an \@arstrut
            let depth = arstrutDepth; // to each row (via the template)
            const outrow = [];
            for (let c = 0; c < inrow.length; ++c) {
                const localContext = context.clone({mathstyle: this.mathstyle});
                const cell = decompose(localContext, inrow[c]) || [];
                const elt = [makeOrd(null)].concat(cell);
                depth = Math.max(depth, Span.depth(elt));
                height = Math.max(height, Span.height(elt));
                outrow.push(elt);
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
        let currentContentCol = 0;
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
                cols.push(makeSpan(contentCols[currentContentCol], 'col-align-' + colDesc.align));
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
                separator.setStyle('margin-top', 3 * context.mathstyle.metrics.axisHeight - offset, 'em');
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
        if ((!this.lFence || this.lFence === '.') &&
            (!this.rFence || this.rFence === '.')) {
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
            this.bind(context, Delimiters.makeLeftRightDelim('mopen', this.lFence, innerHeight, innerDepth, context)),
            inner,
            this.bind(context, Delimiters.makeLeftRightDelim('mclose', this.rFence, innerHeight, innerDepth, context))
        ]);
    }


    /**
     * Gengrac -- Generalized fraction
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
     * @private
     */
    decomposeGenfrac(context) {
        const mathstyle = this.mathstyle === 'auto' ?
            context.mathstyle : Mathstyle.toMathstyle(this.mathstyle);
        const newContext = context.clone({mathstyle: mathstyle});
        let numer = [];
        if (this.numerPrefix) {
            numer.push(makeOrd(this.numerPrefix));
        }
        const numeratorStyle = this.continuousFraction ?
            mathstyle : mathstyle.fracNum();
        numer = numer.concat(decompose(newContext.clone({mathstyle: numeratorStyle}), this.numer));
        const numerReset = makeHlist(numer, context.mathstyle.adjustTo(numeratorStyle));
        let denom = [];
        if (this.denomPrefix) {
            denom.push(makeOrd(this.denomPrefix));
        }
        const denominatorStyle = this.continuousFraction ?
            mathstyle : mathstyle.fracDen();
        denom = denom.concat(decompose(newContext.clone({mathstyle: denominatorStyle}), this.denom));
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
        const numerDepth = numerReset ? numerReset.depth : 0;
        const denomHeight = denomReset ? denomReset.height : 0;
        let frac;
        if (ruleWidth === 0) {
            // Rule 15c from Appendix G
            // No bar line between numerator and denominator
            const candidateClearance = (numShift - numerDepth) - (denomHeight - denomShift);
            if (candidateClearance < clearance) {
                numShift += 0.5 * (clearance - candidateClearance);
                denomShift += 0.5 * (clearance - candidateClearance);
            }
            frac = makeVlist(newContext, [numerReset, -numShift, denomReset, denomShift], 'individualShift');
        } else {
            // Rule 15d from Appendix G
            // There is a bar line between the numerator and the denominator
            const axisHeight = mathstyle.metrics.axisHeight;
            if ((numShift - numerDepth) - (axisHeight + 0.5 * ruleWidth) <
                clearance) {
                numShift +=
                    clearance - ((numShift - numerDepth) -
                        (axisHeight + 0.5 * ruleWidth));
            }
            if ((axisHeight - 0.5 * ruleWidth) - (denomHeight - denomShift) <
                clearance) {
                denomShift +=
                    clearance - ((axisHeight - 0.5 * ruleWidth) -
                        (denomHeight - denomShift));
            }
            const mid = makeSpan(null,
            /* newContext.mathstyle.adjustTo(Mathstyle.TEXT) + */ ' frac-line');
            mid.applyStyle(this.getStyle());
            // @todo: do we really need to reset the size?
            // Manually set the height of the line because its height is
            // created in CSS
            mid.height = ruleWidth;
            const elements = [];
            if (numerReset) {
                elements.push(numerReset);
                elements.push(-numShift);
            }
            elements.push(mid);
            elements.push(ruleWidth / 2 - axisHeight);
            if (denomReset) {
                elements.push(denomReset);
                elements.push(denomShift);
            }
            frac = makeVlist(newContext, elements, 'individualShift');
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
        const leftDelim = Delimiters.makeCustomSizedDelim('mopen', 
            this.leftDelim, 
            delimSize, 
            true, 
            context.clone({mathstyle: mathstyle})
        );
        const rightDelim = Delimiters.makeCustomSizedDelim('mclose', 
            this.rightDelim, 
            delimSize, 
            true, 
            context.clone({mathstyle: mathstyle})
        );
        leftDelim.applyStyle(this.getStyle());
        rightDelim.applyStyle(this.getStyle());

        const result = makeOrd([leftDelim, frac, rightDelim], ((context.parentSize !== context.size) ?
            ('sizing reset-' + context.parentSize + ' ' + context.size) : ''));
        return this.bind(context, result);
    }


    /**
      *  \left....\right
      *
      * Note that we can encounter malformed \left...\right, for example
      * a \left without a matching \right or vice versa. In that case, the
      * leftDelim (resp. rightDelim) will be undefined. We still need to handle
      * those cases.
      *
      * @method MathAtom#decomposeLeftright
      * @private
      */
    decomposeLeftright(context) {
        if (!this.body) {
            // No body, only a delimiter
            if (this.leftDelim) {
                return new MathAtom('math', 'mopen', this.leftDelim).decompose(context);
            }
            if (this.rightDelim) {
                return new MathAtom('math', 'mclose', this.rightDelim).decompose(context);
            }
            return null;
        }
        // The scope of the context is this group, so make a copy of it
        // so that any changes to it will be discarded when finished
        // with this group.
        const localContext = context.clone();
        const inner = decompose(localContext, this.body);
        const mathstyle = localContext.mathstyle;
        let innerHeight = 0;
        let innerDepth = 0;
        let result = [];
        // Calculate its height and depth
        // The size of delimiters is the same, regardless of what mathstyle we are
        // in. Thus, to correctly calculate the size of delimiter we need around
        // a group, we scale down the inner size based on the size.
        innerHeight = Span.height(inner) * mathstyle.sizeMultiplier;
        innerDepth = Span.depth(inner) * mathstyle.sizeMultiplier;
        // Add the left delimiter to the beginning of the expression
        if (this.leftDelim) {
            result.push(Delimiters.makeLeftRightDelim(
                'mopen', 
                this.leftDelim, 
                innerHeight, innerDepth, 
                localContext
            ));
            result[result.length - 1].applyStyle(this.getStyle());
        }
        if (inner) {
            // Replace the delim (\middle) spans with proper ones now that we know
            // the height/depth
            for (let i = 0; i < inner.length; i++) {
                if (inner[i].delim) {
                    const savedCaret = inner[i].caret;
                    const savedSelected = /ML__selected/.test(inner[i].classes);
                    inner[i] = Delimiters.makeLeftRightDelim('minner', inner[i].delim, innerHeight, innerDepth, localContext);
                    inner[i].caret = savedCaret;
                    inner[i].selected(savedSelected);
                }
            }
            result = result.concat(inner);
        }
        // Add the right delimiter to the end of the expression.
        if (this.rightDelim) {
            let delim = this.rightDelim;
            let classes;
            if (delim === '?') {
                // Use a placeholder delimiter matching the open delimiter
                delim = {
                '(': ')', '\\{': '\\}', '\\[': '\\]', '\\lbrace': '\\rbrace',
                    '\\langle': '\\rangle', '\\lfloor': '\\rfloor', '\\lceil': '\\rceil',
                    '\\vert': '\\vert', '\\lvert': '\\rvert', '\\Vert': '\\Vert',
                    '\\lVert': '\\rVert', '\\lbrack': '\\rbrack',
                    '\\ulcorner': '\\urcorner', '\\llcorner': '\\lrcorner',
                    '\\lgroup': '\\rgroup', '\\lmoustache': '\\rmoustache'
                }[this.leftDelim];
                delim = delim || this.leftDelim;
                classes = 'ML__smart-fence__close';
            }
            result.push(Delimiters.makeLeftRightDelim('mclose', 
                delim, 
                innerHeight, innerDepth, 
                localContext,
                classes
            ));
            result[result.length - 1].applyStyle(this.getStyle());
        }
        // If the `inner` flag is set, return the `inner` element (that's the
        // behavior for the regular `\left...\right`
        if (this.inner) return makeInner(result, mathstyle.cls());
        // Otherwise, include a `\mathopen{}...\mathclose{}`. That's the
        // behavior for `\mleft...\mright`, which allows for tighter spacing
        // for example in `\sin\mleft(x\mright)`
        return result;
    }


    decomposeSurd(context) {
        // See the TeXbook pg. 443, Rule 11.
        // http://www.ctex.org/documents/shredder/src/texbook.pdf
        const mathstyle = context.mathstyle;
        // First, we do the same steps as in overline to build the inner group
        // and line
        const inner = decompose(context.cramp(), this.body);
        const ruleWidth = FONTMETRICS.defaultRuleThickness /
            mathstyle.sizeMultiplier;
        let phi = ruleWidth;
        if (mathstyle.id < Mathstyle.TEXT.id) {
            phi = mathstyle.metrics.xHeight;
        }
        // Calculate the clearance between the body and line
        let lineClearance = ruleWidth + phi / 4;
        const innerTotalHeight = Math.max(2 * phi, (Span.height(inner) + Span.depth(inner)) * mathstyle.sizeMultiplier);
        const minDelimiterHeight = innerTotalHeight + (lineClearance + ruleWidth);

        // Create a \surd delimiter of the required minimum size
        const delim = makeSpan(Delimiters.makeCustomSizedDelim('', '\\surd', minDelimiterHeight, false, context), 'sqrt-sign');
        delim.applyStyle(this.getStyle());

        const delimDepth = (delim.height + delim.depth) - ruleWidth;

        // Adjust the clearance based on the delimiter size
        if (delimDepth > Span.height(inner) + Span.depth(inner) + lineClearance) {
            lineClearance =
                (lineClearance + delimDepth - (Span.height(inner) + Span.depth(inner))) / 2;
        }

        // Shift the delimiter so that its top lines up with the top of the line
        delim.setTop((delim.height - Span.height(inner)) -
            (lineClearance + ruleWidth));
        const line = makeSpan(null, context.mathstyle.adjustTo(Mathstyle.TEXT) + ' sqrt-line');
        line.applyStyle(this.getStyle());
        line.height = ruleWidth;

        const body = makeVlist(context, [inner, lineClearance, line, ruleWidth]);

        if (!this.index) {
            return this.bind(context, makeOrd([delim, body], 'sqrt'));
        }

        // Handle the optional root index
        // The index is always in scriptscript style
        const newcontext = context.clone({mathstyle: Mathstyle.SCRIPTSCRIPT});
        const root = makeSpan(decompose(newcontext, this.index), mathstyle.adjustTo(Mathstyle.SCRIPTSCRIPT));
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
        return this.bind(context, makeOrd([makeSpan(rootVlist, 'root'), delim, body], 'sqrt'));
    }


    decomposeAccent(context) {
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
        if (Array.isArray(this.body) && this.body.length === 1 && this.body[0].isCharacterBox()) {
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
     * @private
     */
    decomposeLine(context) {
        const mathstyle = context.mathstyle;
        // TeXBook:443. Rule 9 and 10
        const inner = decompose(context.cramp(), this.body);
        const ruleWidth = FONTMETRICS.defaultRuleThickness /
            mathstyle.sizeMultiplier;
        const line = makeSpan(null, context.mathstyle.adjustTo(Mathstyle.TEXT) +
            ' ' + this.position + '-line');
        line.height = ruleWidth;
        line.maxFontSize = 1.0;
        let vlist;
        if (this.position === 'overline') {
            vlist = makeVlist(context, [inner, 3 * ruleWidth, line, ruleWidth]);
        } else {
            const innerSpan = makeSpan(inner);
            vlist = makeVlist(context, [ruleWidth, line, 3 * ruleWidth, innerSpan], 'top', Span.height(innerSpan));
        }
        return makeOrd(vlist, this.position);
    }


    decomposeOverunder(context) {
        const base = decompose(context, this.body);
        const annotationStyle = context.clone({mathstyle: 'scriptstyle'});
        const above = this.overscript ? makeSpan(decompose(annotationStyle, this.overscript), context.mathstyle.adjustTo(annotationStyle.mathstyle)) : null;
        const below = this.underscript ? makeSpan(decompose(annotationStyle, this.underscript), context.mathstyle.adjustTo(annotationStyle.mathstyle)) : null;
        return makeStack(context, base, 0, 0, above, below, this.mathtype || 'mrel');
    }


    decomposeOverlap(context) {
        const inner = makeSpan(decompose(context, this.body), 'inner');
        return makeOrd([inner, makeSpan(null, 'fix')], (this.align === 'left' ? 'llap' : 'rlap'));
    }


    /**
     * \rule
     * @memberof MathAtom
     * @instance
     * @private
     */
    decomposeRule(context) {
        const mathstyle = context.mathstyle;
        const result = makeOrd('', 'rule');
        let shift = this.shift && !isNaN(this.shift) ? this.shift : 0;
        shift = shift / mathstyle.sizeMultiplier;
        const width = (this.width) / mathstyle.sizeMultiplier;
        const height = (this.height) / mathstyle.sizeMultiplier;
        result.setStyle('border-right-width', width, 'em');
        result.setStyle('border-top-width', height, 'em');
        result.setStyle('margin-top', -(height - shift), 'em');
        result.setStyle('border-color', context.color);
        result.width = width;
        result.height = height + shift;
        result.depth = -shift;
        return result;
    }


    decomposeOp(context) {
        // Operators are handled in the TeXbook pg. 443-444, rule 13(a).
        const mathstyle = context.mathstyle;
        let large = false;
        if (mathstyle.size === Mathstyle.DISPLAY.size &&
            typeof this.body === 'string' && this.body !== '\\smallint') {
            // Most symbol operators get larger in displaystyle (rule 13)
            large = true;
        }
        let base;
        let baseShift = 0;
        let slant = 0;
        if (this.symbol) {
            // If this is a symbol, create the symbol.
            const fontName = large ? 'Size2-Regular' : 'Size1-Regular';
            base = Span.makeSymbol(fontName, this.body, 'op-symbol ' + (large ? 'large-op' : 'small-op'));
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
        } else if (Array.isArray(this.body)) {
            // If this is a list, decompose that list.
            base = Span.makeOp(decompose(context, this.body));
            // Bind the generated span and this atom so the atom can be retrieved
            // from the span later.
            this.bind(context, base);
        } else {
            // Otherwise, this is a text operator. Build the text from the
            // operator's name.
            console.assert(this.type === 'mop');
            base = this.makeSpan(context, this.body);
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



    decomposeBox(context) {
        // Base is the main content "inside" the box
        const base = makeOrd(decompose(context, this.body));

        // This span will represent the box (background and border)
        // It's positioned to overlap the base
        const box = makeSpan();
        box.setStyle('position', 'absolute');

        // The padding extends outside of the base
        const padding = typeof this.padding === 'number' ? this.padding : FONTMETRICS.fboxsep;

        box.setStyle('height', base.height + base.depth + 2 * padding, 'em');
        if (padding !== 0) {
            box.setStyle('width', 'calc(100% + ' + (2 * padding) + 'em)');
        } else {
            box.setStyle('width', '100%');
        }

        box.setStyle('top', -padding, 'em');
        box.setStyle('left', -padding, 'em');
        box.setStyle('z-index', '-1');  // Ensure the box is *behind* the base

        if (this.backgroundcolor) box.setStyle('background-color', this.backgroundcolor);
        if (this.framecolor) box.setStyle('border', FONTMETRICS.fboxrule + 'em solid ' + this.framecolor);
        if (this.border) box.setStyle('border', this.border);

        base.setStyle('display', 'inline-block');
        base.setStyle('height', base.height + base.depth, 'em');
        base.setStyle('vertical-align', -base.depth + padding, 'em');

        // The result is a span that encloses the box and the base
        const result = makeSpan([box, base]);
        // Set its position as relative so that the box can be absolute positioned
        // over the base
        result.setStyle('position', 'relative');
        result.setStyle('vertical-align', -padding + base.depth, 'em');

        // The padding adds to the width and height of the pod
        result.height = base.height + padding;
        result.depth = base.depth + padding;
        result.setLeft(padding);
        result.setRight(padding);

         return result;
    }


    decomposeEnclose(context) {
        const base = makeOrd(decompose(context, this.body));
        const result = base;
        // Account for the padding
        const padding = this.padding === 'auto' ? .2 : this.padding; // em
        result.setStyle('padding', padding, 'em');
        result.setStyle('display', 'inline-block');
        result.setStyle('height', result.height + result.depth, 'em');
        result.setStyle('left', -padding, 'em');
        if (this.backgroundcolor && this.backgroundcolor !== 'transparent') {
            result.setStyle('background-color', this.backgroundcolor);
        }
        let svg = '';
        if (this.notation.box) result.setStyle('border', this.borderStyle);
        if (this.notation.actuarial) {
            result.setStyle('border-top', this.borderStyle);
            result.setStyle('border-right', this.borderStyle);
        }
        if (this.notation.madruwb) {
            result.setStyle('border-bottom', this.borderStyle);
            result.setStyle('border-right', this.borderStyle);
        }
        if (this.notation.roundedbox) {
            result.setStyle('border-radius', (Span.height(result) + Span.depth(result)) / 2, 'em');
            result.setStyle('border', this.borderStyle);
        }
        if (this.notation.circle) {
            result.setStyle('border-radius', '50%');
            result.setStyle('border', this.borderStyle);
        }
        if (this.notation.top) result.setStyle('border-top', this.borderStyle);
        if (this.notation.left) result.setStyle('border-left', this.borderStyle);
        if (this.notation.right) result.setStyle('border-right', this.borderStyle);
        if (this.notation.bottom) result.setStyle('border-bottom', this.borderStyle);
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
            return Span.makeSVG(result, svg, svgStyle);
        }
        return result;
    }


    /**
     * Return a representation of this, but decomposed in an array of Spans
     *
     * @param {Context} context Font variant, size, color, etc...
     * @param {Span[]} [phantomBase=null] If not null, the spans to use to
     * calculate the placement of the supsub
     * @return {Span[]}
     * @method MathAtom#decompose
     * @private
     */
    decompose(context, phantomBase) {
        console.assert(context instanceof Context.Context);
        let result = null;
        if (!this.type || /mord|minner|mbin|mrel|mpunct|mopen|mclose|textord/.test(this.type)) {
            // The body of these atom types is *often* a string, but it can
            // be a atom list (for example a command inside a \text{})
            if (typeof this.body === 'string') {
                result = this.makeSpan(context, this.body);
            } else {
                result = this.makeSpan(context, decompose(context, this.body));
            }
            result.type = this.type;
        } else if (this.type === 'group' || this.type === 'root') {
            result = this.decomposeGroup(context);
        } else if (this.type === 'array') {
            result = this.decomposeArray(context);
        } else if (this.type === 'genfrac') {
            result = this.decomposeGenfrac(context);
        } else if (this.type === 'surd') {
            result = this.decomposeSurd(context);
        } else if (this.type === 'accent') {
            result = this.decomposeAccent(context);
        } else if (this.type === 'leftright') {
            result = this.decomposeLeftright(context);
        } else if (this.type === 'delim') {
            result = makeSpan(null, '');
            result.delim = this.delim;
        } else if (this.type === 'sizeddelim') {
            result = this.bind(context, Delimiters.makeSizedDelim(this.cls, this.delim, this.size, context));
        } else if (this.type === 'line') {
            result = this.decomposeLine(context);
        } else if (this.type === 'overunder') {
            result = this.decomposeOverunder(context);
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
        } else if (this.type === 'msubsup') {
            // The caret for this atom type is handled by its elements
            result = makeOrd('\u200b');
            if (phantomBase) {
                result.height = phantomBase[0].height;
                result.depth = phantomBase[0].depth;
            }
        } else if (this.type === 'mop') {
            result = this.decomposeOp(context);
        } else if (this.type === 'space') {
            // A space literal
            result = this.makeSpan(context, ' ');
        } else if (this.type === 'spacing') {
            // A spacing command (\quad, etc...)
            if (this.body === '\u200b') {
                // ZERO-WIDTH SPACE
                result = this.makeSpan(context, '\u200b');
            } else if (this.body === '\u00a0') {
                if (this.mode === 'math') {
                    result = this.makeSpan(context, ' ');
                } else {
                    result = this.makeSpan(context, '\u00a0');
                }
            } else if (this.width) {
                result = makeSpan('\u200b', 'mspace ');
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
                    '!': 'negativethinspace'
                }[this.body] || 'quad';
                result = makeSpan('\u200b', 'mspace ' + spacingCls);
            }
        } else if (this.type === 'mathstyle') {
            context.setMathstyle(this.mathstyle);
        } else if (this.type === 'box') {
            result = this.decomposeBox(context);
        } else if (this.type === 'enclose') {
            result = this.decomposeEnclose(context);
        } else if (this.type === 'command' || this.type === 'error') {
            result = this.makeSpan(context, this.body);
            result.classes = ''; // Override fonts and other attributes.
            if (this.error) {
                result.classes += ' ML__error';
            }
            if (this.suggestion) {
                result.classes += ' ML__suggestion';
            }
        } else if (this.type === 'placeholder') {
            result = this.makeSpan(context, '⬚');
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
        if (this.caret && this.type !== 'styling' &&
            this.type !== 'msubsup' && this.type !== 'command' &&
            this.type !== 'placeholder' && this.type !== 'first') {
            if (Array.isArray(result)) {
                result[result.length - 1].caret = this.caret;
            } else {
                result.caret = this.caret;
            }
        }
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


    attachSupsub(context, nucleus, type) {
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
        const scriptspace = (0.5 / FONTMETRICS.ptPerEm) / multiplier;
        let supsub = null;
        if (submid && supmid) {
            // Rule 18e
            supShift = Math.max(supShift, minSupShift, supmid.depth + 0.25 * mathstyle.metrics.xHeight);
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
            subShift = Math.max(subShift, mathstyle.metrics.sub1, Span.height(submid) - 0.8 * mathstyle.metrics.xHeight);
            supsub = makeVlist(context, [submid], 'shift', subShift);
            supsub.children[0].setRight(scriptspace);
            if (this.isCharacterBox()) {
                supsub.children[0].setLeft(-Span.italic(nucleus));
            }
        } else if (!submid && supmid) {
            // Rule 18c, d
            supShift = Math.max(supShift, minSupShift, supmid.depth + 0.25 * mathstyle.metrics.xHeight);
            supsub = makeVlist(context, [supmid], 'shift', -supShift);
            supsub.children[0].setRight(scriptspace);
        }
        // Display the caret *following* the superscript and subscript,
        // so attach the caret to the 'msubsup' element.
        const supsubContainer = makeSpan(supsub, 'msubsup');
        if (this.caret) {
            supsubContainer.caret = this.caret;
        }
        return Span.makeSpanOfType(type, [nucleus, supsubContainer]);
    }


    attachLimits(context, nucleus, nucleusShift, slant) {
        const limitAbove = this.superscript ? makeSpan(decompose(context.sup(), this.superscript), context.mathstyle.adjustTo(context.mathstyle.sup())) : null;
        const limitBelow = this.subscript ? makeSpan(decompose(context.sub(), this.subscript), context.mathstyle.adjustTo(context.mathstyle.sub())) : null;
        return makeStack(context, nucleus, nucleusShift, slant, limitAbove, limitBelow, 'mop');
    }


    /**
     * Add an ID attribute to both the span and this atom so that the atom
     * can be retrieved from the span later on (e.g. when the span is clicked on)
     * @param {Context} context
     * @param {Span} span
     * @method MathAtom#bind
     * @private
     */
    bind(context, span) {
        if (this.type !== 'first' && this.body !== '\u200b') {
            this.id = makeID(context);
            if (this.id) {
                if (!span.attributes) span.attributes = {};
                span.attributes['data-atom-id'] = this.id;
            }
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
     * @private
     */
    makeSpan(context, body) {
        const type = this.type === 'textord' ? 'mord' : this.type;
        const result = Span.makeSpanOfType(type, body);

        // The font family is determined by:
        // - the base font family associated with this atom (optional). For example,
        // some atoms such as some functions ('\sin', '\cos', etc...) or some
        // symbols ('\Z') have an explicit font family. This overrides any 
        // other font family
        // - the user-specified font family that has been explicitly applied to 
        // this atom
        // - the font family automatically determined in math mode, for example
        // which italicizes some characters, but which can be overridden

        const style  = this.getStyle();
        result.applyStyle(style); 

        // Apply size correction
        const size = style && style.fontSize ? style.fontSize : 'size5';
        if (size !== context.parentSize) {
            result.classes += ' sizing reset-' + context.parentSize;
            result.classes += ' ' + size;

        } else if (context.parentSize !== context.size) {
            result.classes += ' sizing reset-' + context.parentSize;
            result.classes += ' ' + context.size;
        }
        result.maxFontSize = Math.max(result.maxFontSize, context.sizeMultiplier || 1.0);

        // Set other attributes

        if (this.mode === 'text') result.classes += ' ML__text';
        if (context.mathstyle.isTight()) result.isTight = true;
        // The italic correction applies only in math mode
        if (this.mode !== 'math') result.italic = 0;
        result.setRight(result.italic); // Italic correction

        if (typeof context.opacity === 'number') result.setStyle('opacity', context.opacity);

        // To retrieve the atom from a span, for example when the span is clicked
        // on, attach a randomly generated ID to the span and associate it
        // with the atom.
        this.bind(context, result);
        if (this.caret) {
            // If this has a super/subscript, the caret will be attached
            // to the 'msubsup' atom, so no need to have it here.
            if (!this.superscript && !this.subscript) {
                result.caret = this.caret;
                if (context.mathstyle.isTight()) result.isTight = true;
            }
        }
        return result;
    }

}



/**
 * Used in `decomposeArray` to create a column separator span.
 *
 * @param {number} width
 * @memberof module:mathAtom
 * @private
 */
function makeColGap(width) {
    const separator = makeSpan('\u200b', 'arraycolsep');
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


function makeID(context) {
    let result;
    if (typeof context.generateID === 'boolean' && context.generateID) {
        result = Date.now().toString(36).slice(-2) +
            Math.floor(Math.random() * 0x186a0).toString(36);
    } else if (typeof context.generateID !== 'boolean') {
        if (context.generateID.overrideID) {
            result = context.generateID.overrideID;
        } else {
            result = context.generateID.seed.toString(36);
            context.generateID.seed += 1;
        }
    }
    return result;
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
 * @param {number} nucleusShift The vertical shift of the nucleus from 
 * the baseline.
 * @param {number} slant For operators that have a slant, such as \int, 
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



/**
 * Return a list of spans equivalent to atoms.
 * A span is the most elementary type possible, for example 'text'
 * or 'vlist', while the input atoms may be more abstract and complex,
 * such as 'genfrac'
 *
 * @param {Context} context Font family, variant, size, color, etc...
 * @param {(MathAtom|MathAtom[])} atoms
 * @return {Span[]}
 * @memberof module:core/mathatom
 * @private
 */
function decompose(context, atoms) {
    if (!(context instanceof Context.Context)) {
        // We can be passed either a Context object, or 
        // a simple object with some properties set.
        context = new Context.Context(context);
    }

    // In most cases we want to display selection,
    // except if the generateID.groupNumbers flag is set which is used for
    // read aloud.
    const displaySelection = !context.generateID || !context.generateID.groupNumbers;

    let result = [];
    if (Array.isArray(atoms)) {
        if (atoms.length === 0) {
            return result;

        } else if (atoms.length === 1) {
            result = atoms[0].decompose(context);
            if (result && displaySelection && atoms[0].isSelected) {
                result.forEach(x => x.selected(true));
            }
            console.assert(!result || Array.isArray(result));

        } else {
            let previousType = 'none';
            let nextType = atoms[1].type;
            let selection =  [];
            let digitStringID = null;
            let phantomBase = null;
            for (let i = 0; i < atoms.length; i++) {
                // Is this a binary operator ('+', '-', etc...) that potentially
                // needs to be adjusted to a unary operator?
                // 
                // When preceded by a mbin, mopen, mrel, mpunct, mop or
                // when followed by a mrel, mclose or mpunct
                // or if preceded or followed by no sibling, a 'mbin' becomes a
                // 'mord'
                if (atoms[i].type === 'mbin') {
                    if (/first|none|mrel|mpunct|mopen|mbin|mop/.test(previousType) ||
                        /none|mrel|mpunct|mclose/.test(nextType)) {
                        atoms[i].type = 'mord';
                    }
                }

                // If this is a scaffolding supsub, we'll use the
                // phantomBase from the previous atom to position the supsub.
                // Otherwise, no need for the phantomBase
                if (atoms[i].body !== '\u200b' ||
                        (!atoms[i].superscript && !atoms[i].subscript)) {
                    phantomBase = null;
                }

                if (context.generateID.groupNumbers && 
                    digitStringID &&
                    atoms[i].type === 'mord' &&
                    /[0-9,.]/.test(atoms[i].latex)) {
                    context.generateID.overrideID = digitStringID;
                }
                const span = atoms[i].decompose(context, phantomBase);
                if (context.generateID) {
                    context.generateID.overrideID = null;
                }
                if (span) {
                    // The result from decompose is always an array
                    // Flatten it (i.e. [[a1, a2], b1, b2] -> [a1, a2, b1, b2]
                    const flat = [].concat.apply([], span);
                    phantomBase = flat;

                    // If this is a digit, keep track of it
                    if (context.generateID && context.generateID.groupNumbers) {
                        if (atoms[i].type === 'mord' &&
                            /[0-9,.]/.test(atoms[i].latex)) {
                            if (!digitStringID) {
                                digitStringID = atoms[i].id;
                            }
                        }
                        if ((atoms[i].type !== 'mord' ||
                            /[0-9,.]/.test(atoms[i].latex) ||
                            atoms[i].superscript ||
                            atoms[i].subscript) && digitStringID) {
                            // Done with digits
                            digitStringID = null;
                        }
                    }


                    if (displaySelection && atoms[i].isSelected) {
                        selection = selection.concat(flat);
                        selection.forEach(x => x.selected(true));
                    } else {
                        if (selection.length > 0) {
                            // There was a selection, but we're out of it now
                            // Append the selection
                            result = [...result, ...selection];
                            selection = [];
                        }
                        result = result.concat(flat);
                    }
                }

                // Since the next atom (and this atom!) could have children
                // use getFinal...() and getInitial...() to get the closest
                // atom linearly.
                previousType = atoms[i].getFinalBaseElement().type;
                nextType = atoms[i + 1] ? atoms[i + 1].getInitialBaseElement().type : 'none';
            }

            // Is there a leftover selection?
            if (selection.length > 0) {
                result = [...result, ...selection];
                selection = [];
            }
        }
    } else if (atoms) {
        // This is a single atom, decompose it
        result = atoms.decompose(context);
        if (result && displaySelection && atoms.isSelected) {
            result.forEach(x => x.selected(true));
        }
    }


    if (!result || result.length === 0) return null;

    console.assert(Array.isArray(result) && result.length > 0);

    // If the mathstyle changed between the parent and the current atom,
    // account for the size difference
    if (context.mathstyle !== context.parentMathstyle) {
        const factor = context.mathstyle.sizeMultiplier /
                context.parentMathstyle.sizeMultiplier;
        for (const span of result) {
            console.assert(!Array.isArray(span));
            console.assert(typeof span.height === 'number' && isFinite(span.height));
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
            console.assert(typeof span.height === 'number' && isFinite(span.height));
            span.height *= factor;
            span.depth *= factor;
        }
    }

    return result;
}


/**
 * Return an atom suitable for use as the root of a formula.
 *
 * @param {string} parseMode
 * @param {MathAtom[]} body
 * @return {MathAtom[]}
 * @memberof module:core/mathatom
 * @private
 */

function makeRoot(parseMode, body) {
    parseMode = parseMode || 'math';
    const result =  new MathAtom(parseMode, 'root', body || []);
    if (result.body.length === 0 || result.body[0].type !== 'first') {
        result.body.unshift(new MathAtom('', 'first'));
    }
    return result;
}



// Export the public interface for this module
export default {
    MathAtom,
    decompose,
    makeRoot,
    GREEK_REGEX
}



