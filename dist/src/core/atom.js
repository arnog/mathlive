/**
 *
 * @module core/atom
 * @private
 */
import { ATOM_REGISTRY, decompose } from './atom-utils.js';
import Mathstyle from './mathstyle.js';
import { Context } from './context.js';
import { METRICS as FONTMETRICS } from './font-metrics.js';
import {
    makeSpan,
    makeOrd,
    makeInner,
    makeVlist,
    makeSymbol,
    makeSpanOfType,
    makeOp,
    depth as spanDepth,
    height as spanHeight,
    italic as spanItalic,
} from './span.js';
import Delimiters from './delimiters.js';
import './atom-genfrac.js';
import './atom-array.js';
import './atom-overunder.js';
import './atom-accent.js';
import './atom-enclose.js';

const GREEK_REGEX = /\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5/;

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
 * @param {string|Atom[]} body
 * @param {Object.<string, any>} [style={}] A set of additional properties to append to
 * the atom
 * @return {Atom}
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
 * @property {string|Atom[]} body
 * @property {Atom[]} superscript
 * @property {Atom[]} subscript
 * @property {Atom[]} numer
 * @property {Atom[]} denom
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
export class Atom {
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
            backgroundColor: this.phantom
                ? 'transparent'
                : this.backgroundColor,
            fontFamily:
                this.baseFontFamily || this.fontFamily || this.autoFontFamily,
            fontShape: this.fontShape,
            fontSeries: this.fontSeries,
            fontSize: this.fontSize,
            cssId: this.cssId,
            cssClass: this.cssClass,
        };
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
            this.maxFontSize = SIZING_MULTIPLIER[this.fontSize];
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
            } else if (
                !GREEK_REGEX.test(symbol) &&
                this.baseFontFamily === 'math'
            ) {
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
     * @return {Atom[]}
     * @method Atom#filter
     * @private
     */
    filter(cb) {
        let result = [];
        if (cb(this)) result.push(this);
        for (const relation of [
            'body',
            'superscript',
            'subscript',
            'overscript',
            'underscript',
            'numer',
            'denom',
            'index',
        ]) {
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
        const localContext = context.clone({ mathstyle: this.mathstyle });
        const span = makeOrd(decompose(localContext, this.body));
        if (this.cssId) span.cssId = this.cssId;
        span.applyStyle({
            backgroundColor: this.backgroundColor,
            cssClass: this.cssClass,
        });
        return span;
    }

    /**
     *  \left....\right
     *
     * Note that we can encounter malformed \left...\right, for example
     * a \left without a matching \right or vice versa. In that case, the
     * leftDelim (resp. rightDelim) will be undefined. We still need to handle
     * those cases.
     *
     * @method Atom#decomposeLeftright
     * @private
     */
    decomposeLeftright(context) {
        if (!this.body) {
            // No body, only a delimiter
            if (this.leftDelim) {
                return new Atom('math', 'mopen', this.leftDelim).decompose(
                    context
                );
            }
            if (this.rightDelim) {
                return new Atom('math', 'mclose', this.rightDelim).decompose(
                    context
                );
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
        innerHeight = spanHeight(inner) * mathstyle.sizeMultiplier;
        innerDepth = spanDepth(inner) * mathstyle.sizeMultiplier;
        // Add the left delimiter to the beginning of the expression
        if (this.leftDelim) {
            result.push(
                this.bind(
                    context,
                    Delimiters.makeLeftRightDelim(
                        'mopen',
                        this.leftDelim,
                        innerHeight,
                        innerDepth,
                        localContext,
                        'ML__open'
                    )
                )
            );
            result[result.length - 1].applyStyle(this.getStyle());
        }
        if (inner) {
            // Replace the delim (\middle) spans with proper ones now that we know
            // the height/depth
            for (let i = 0; i < inner.length; i++) {
                if (inner[i].delim) {
                    const savedCaret = inner[i].caret;
                    const savedSelected = /ML__selected/.test(inner[i].classes);
                    inner[i] = this.bind(
                        context,
                        Delimiters.makeLeftRightDelim(
                            'minner',
                            inner[i].delim,
                            innerHeight,
                            innerDepth,
                            localContext
                        )
                    );
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
                    '(': ')',
                    '\\{': '\\}',
                    '\\[': '\\]',
                    '\\lbrace': '\\rbrace',
                    '\\langle': '\\rangle',
                    '\\lfloor': '\\rfloor',
                    '\\lceil': '\\rceil',
                    '\\vert': '\\vert',
                    '\\lvert': '\\rvert',
                    '\\Vert': '\\Vert',
                    '\\lVert': '\\rVert',
                    '\\lbrack': '\\rbrack',
                    '\\ulcorner': '\\urcorner',
                    '\\llcorner': '\\lrcorner',
                    '\\lgroup': '\\rgroup',
                    '\\lmoustache': '\\rmoustache',
                }[this.leftDelim];
                delim = delim || this.leftDelim;
                classes = 'ML__smart-fence__close';
            }
            result.push(
                this.bind(
                    context,
                    Delimiters.makeLeftRightDelim(
                        'mclose',
                        delim,
                        innerHeight,
                        innerDepth,
                        localContext,
                        (classes || '') + ' ML__close'
                    )
                )
            );
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
        const ruleWidth =
            FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
        let phi = ruleWidth;
        if (mathstyle.id < Mathstyle.TEXT.id) {
            phi = mathstyle.metrics.xHeight;
        }
        // Calculate the clearance between the body and line
        let lineClearance = ruleWidth + phi / 4;
        const innerTotalHeight = Math.max(
            2 * phi,
            (spanHeight(inner) + spanDepth(inner)) * mathstyle.sizeMultiplier
        );
        const minDelimiterHeight =
            innerTotalHeight + (lineClearance + ruleWidth);

        // Create a \surd delimiter of the required minimum size
        const delim = makeSpan(
            Delimiters.makeCustomSizedDelim(
                '',
                '\\surd',
                minDelimiterHeight,
                false,
                context
            ),
            'sqrt-sign'
        );
        delim.applyStyle(this.getStyle());

        const delimDepth = delim.height + delim.depth - ruleWidth;

        // Adjust the clearance based on the delimiter size
        if (delimDepth > spanHeight(inner) + spanDepth(inner) + lineClearance) {
            lineClearance =
                (lineClearance +
                    delimDepth -
                    (spanHeight(inner) + spanDepth(inner))) /
                2;
        }

        // Shift the delimiter so that its top lines up with the top of the line
        delim.setTop(
            delim.height - spanHeight(inner) - (lineClearance + ruleWidth)
        );
        const line = makeSpan(
            null,
            context.mathstyle.adjustTo(Mathstyle.TEXT) + ' sqrt-line'
        );
        line.applyStyle(this.getStyle());
        line.height = ruleWidth;

        const body = makeVlist(context, [
            inner,
            lineClearance,
            line,
            ruleWidth,
        ]);

        if (!this.index) {
            return this.bind(context, makeOrd([delim, body], 'sqrt'));
        }

        // Handle the optional root index
        // The index is always in scriptscript style
        const newcontext = context.clone({ mathstyle: Mathstyle.SCRIPTSCRIPT });
        const root = makeSpan(
            decompose(newcontext, this.index),
            mathstyle.adjustTo(Mathstyle.SCRIPTSCRIPT)
        );
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
        return this.bind(
            context,
            makeOrd([makeSpan(rootVlist, 'root'), delim, body], 'sqrt')
        );
    }

    /**
     * \overline and \underline
     *
     * @method Atom#decomposeLine
     * @private
     */
    decomposeLine(context) {
        const mathstyle = context.mathstyle;
        // TeXBook:443. Rule 9 and 10
        const inner = decompose(context.cramp(), this.body);
        const ruleWidth =
            FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
        const line = makeSpan(
            null,
            context.mathstyle.adjustTo(Mathstyle.TEXT) +
                ' ' +
                this.position +
                '-line'
        );
        line.height = ruleWidth;
        line.maxFontSize = 1.0;
        let vlist;
        if (this.position === 'overline') {
            vlist = makeVlist(context, [inner, 3 * ruleWidth, line, ruleWidth]);
        } else {
            const innerSpan = makeSpan(inner);
            vlist = makeVlist(
                context,
                [ruleWidth, line, 3 * ruleWidth, innerSpan],
                'top',
                spanHeight(innerSpan)
            );
        }
        return makeOrd(vlist, this.position);
    }

    decomposeOverlap(context) {
        const inner = makeSpan(decompose(context, this.body), 'inner');
        return makeOrd(
            [inner, makeSpan(null, 'fix')],
            this.align === 'left' ? 'llap' : 'rlap'
        );
    }

    /**
     * \rule
     * @memberof Atom
     * @instance
     * @private
     */
    decomposeRule(context) {
        const mathstyle = context.mathstyle;
        const result = makeOrd('', 'rule');
        let shift = this.shift && !isNaN(this.shift) ? this.shift : 0;
        shift = shift / mathstyle.sizeMultiplier;
        const width = this.width / mathstyle.sizeMultiplier;
        const height = this.height / mathstyle.sizeMultiplier;
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
        if (
            mathstyle.size === Mathstyle.DISPLAY.size &&
            typeof this.body === 'string' &&
            this.body !== '\\smallint'
        ) {
            // Most symbol operators get larger in displaystyle (rule 13)
            large = true;
        }
        let base;
        let baseShift = 0;
        let slant = 0;
        if (this.symbol) {
            // If this is a symbol, create the symbol.
            const fontName = large ? 'Size2-Regular' : 'Size1-Regular';
            base = makeSymbol(
                fontName,
                this.body,
                'op-symbol ' + (large ? 'large-op' : 'small-op')
            );
            base.type = 'mop';
            // Shift the symbol so its center lies on the axis (rule 13). It
            // appears that our fonts have the centers of the symbols already
            // almost on the axis, so these numbers are very small. Note we
            // don't actually apply this here, but instead it is used either in
            // the vlist creation or separately when there are no limits.
            baseShift =
                (base.height - base.depth) / 2 -
                mathstyle.metrics.axisHeight * mathstyle.sizeMultiplier;
            // The slant of the symbol is just its italic correction.
            slant = base.italic;
            // Bind the generated span and this atom so the atom can be retrieved
            // from the span later.
            this.bind(context, base);
        } else if (Array.isArray(this.body)) {
            // If this is a list, decompose that list.
            base = makeOp(decompose(context, this.body));
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
            if (
                this.alwaysHandleSupSub ||
                limits === 'limits' ||
                (limits === 'auto' && mathstyle.size === Mathstyle.DISPLAY.size)
            ) {
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
        const padding =
            typeof this.padding === 'number'
                ? this.padding
                : FONTMETRICS.fboxsep;

        box.setStyle('height', base.height + base.depth + 2 * padding, 'em');
        if (padding !== 0) {
            box.setStyle('width', 'calc(100% + ' + 2 * padding + 'em)');
        } else {
            box.setStyle('width', '100%');
        }

        box.setStyle('top', -padding, 'em');
        box.setStyle('left', -padding, 'em');
        box.setStyle('z-index', '-1'); // Ensure the box is *behind* the base

        if (this.backgroundcolor)
            box.setStyle('background-color', this.backgroundcolor);
        if (this.framecolor)
            box.setStyle(
                'border',
                FONTMETRICS.fboxrule + 'em solid ' + this.framecolor
            );
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

    /**
     * Return a representation of this, but decomposed in an array of Spans
     *
     * @param {Context} context Font variant, size, color, etc...
     * @param {Span[]} [phantomBase=null] If not null, the spans to use to
     * calculate the placement of the supsub
     * @return {Span[]}
     * @method Atom#decompose
     * @private
     */
    decompose(context, phantomBase) {
        console.assert(context instanceof Context);
        let result = null;
        if (
            !this.type ||
            /mord|minner|mbin|mrel|mpunct|mopen|mclose|textord/.test(this.type)
        ) {
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
        } else if (this.type === 'surd') {
            result = this.decomposeSurd(context);
        } else if (this.type === 'leftright') {
            result = this.decomposeLeftright(context);
        } else if (this.type === 'delim') {
            result = makeSpan(null, '');
            result.delim = this.delim;
        } else if (this.type === 'sizeddelim') {
            result = this.bind(
                context,
                Delimiters.makeSizedDelim(
                    this.cls,
                    this.delim,
                    this.size,
                    context
                )
            );
        } else if (this.type === 'line') {
            result = this.decomposeLine(context);
        } else if (this.type === 'overlap') {
            // For llap (18), rlap (270), clap (0)
            // smash (common), mathllap (0), mathrlap (0), mathclap (0)
            // See https://www.tug.org/TUGboat/tb22-4/tb72perlS.pdf
            // and https://tex.stackexchange.com/questions/98785/what-are-the-different-kinds-of-vertical-spacing-and-horizontal-spacing-commands
            result = this.decomposeOverlap(context);
        } else if (this.type === 'rule') {
            result = this.decomposeRule(context);
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
                const spacingCls =
                    {
                        qquad: 'qquad',
                        quad: 'quad',
                        enspace: 'enspace',
                        ';': 'thickspace',
                        ':': 'mediumspace',
                        ',': 'thinspace',
                        '!': 'negativethinspace',
                    }[this.body] || 'quad';
                result = makeSpan('\u200b', 'mspace ' + spacingCls);
            }
        } else if (this.type === 'mathstyle') {
            context.setMathstyle(this.mathstyle);
        } else if (this.type === 'box') {
            result = this.decomposeBox(context);
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
            console.assert(
                ATOM_REGISTRY[this.type],
                'Unknown Atom type: "' + this.type + '"'
            );
            result = ATOM_REGISTRY[this.type].decompose(context, this);
        }
        if (!result) return result;
        if (
            this.caret &&
            this.type !== 'msubsup' &&
            this.type !== 'command' &&
            this.type !== 'placeholder' &&
            this.type !== 'first'
        ) {
            if (Array.isArray(result)) {
                result[result.length - 1].caret = this.caret;
            } else {
                result.caret = this.caret;
            }
        }
        if (this.containsCaret) {
            if (Array.isArray(result)) {
                // For a /mleft.../mright, tag the first and last atom in the
                // list with the "ML__contains-caret" style (it's the open and
                // closing fence, respectively)
                result[0].classes =
                    (result[0].classes || '') + ' ML__contains-caret';
                result[result.length - 1].classes =
                    (result[result.length - 1].classes || '') +
                    ' ML__contains-caret';
            } else {
                result.classes = (result.classes || '') + ' ML__contains-caret';
            }
        }
        // Finally, attach any necessary superscript, subscripts
        if (!this.limits && (this.superscript || this.subscript)) {
            // If limits is set, the attachment of sup/sub was handled
            // in the atom decomposition (e.g. decomposeOp, decomposeAccent)
            if (Array.isArray(result)) {
                const lastSpan = result[result.length - 1];
                result[result.length - 1] = this.attachSupsub(
                    context,
                    lastSpan,
                    lastSpan.type
                );
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
            supShift = spanHeight(nucleus) - mathstyle.metrics.supDrop;
            subShift = spanDepth(nucleus) + mathstyle.metrics.subDrop;
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
        const multiplier =
            Mathstyle.TEXT.sizeMultiplier * mathstyle.sizeMultiplier;
        const scriptspace = 0.5 / FONTMETRICS.ptPerEm / multiplier;
        let supsub = null;
        if (submid && supmid) {
            // Rule 18e
            supShift = Math.max(
                supShift,
                minSupShift,
                supmid.depth + 0.25 * mathstyle.metrics.xHeight
            );
            subShift = Math.max(subShift, mathstyle.metrics.sub2);
            const ruleWidth = FONTMETRICS.defaultRuleThickness;
            if (
                supShift - spanDepth(supmid) - (spanHeight(submid) - subShift) <
                4 * ruleWidth
            ) {
                subShift =
                    4 * ruleWidth -
                    (supShift - supmid.depth) +
                    spanHeight(submid);
                const psi =
                    0.8 * mathstyle.metrics.xHeight -
                    (supShift - spanDepth(supmid));
                if (psi > 0) {
                    supShift += psi;
                    subShift -= psi;
                }
            }
            supsub = makeVlist(
                context,
                [submid, subShift, supmid, -supShift],
                'individualShift'
            );
            // Subscripts shouldn't be shifted by the nucleus' italic correction.
            // Account for that by shifting the subscript back the appropriate
            // amount. Note we only do this when the nucleus is a single symbol.
            if (this.symbol) {
                supsub.children[0].setLeft(-spanItalic(nucleus));
            }
        } else if (submid && !supmid) {
            // Rule 18b
            subShift = Math.max(
                subShift,
                mathstyle.metrics.sub1,
                spanHeight(submid) - 0.8 * mathstyle.metrics.xHeight
            );
            supsub = makeVlist(context, [submid], 'shift', subShift);
            supsub.children[0].setRight(scriptspace);
            if (this.isCharacterBox()) {
                supsub.children[0].setLeft(-spanItalic(nucleus));
            }
        } else if (!submid && supmid) {
            // Rule 18c, d
            supShift = Math.max(
                supShift,
                minSupShift,
                supmid.depth + 0.25 * mathstyle.metrics.xHeight
            );
            supsub = makeVlist(context, [supmid], 'shift', -supShift);
            supsub.children[0].setRight(scriptspace);
        }
        // Display the caret *following* the superscript and subscript,
        // so attach the caret to the 'msubsup' element.
        const supsubContainer = makeSpan(supsub, 'msubsup');
        if (this.caret) {
            supsubContainer.caret = this.caret;
        }
        return makeSpanOfType(type, [nucleus, supsubContainer]);
    }

    attachLimits(context, nucleus, nucleusShift, slant) {
        const limitAbove = this.superscript
            ? makeSpan(
                  decompose(context.sup(), this.superscript),
                  context.mathstyle.adjustTo(context.mathstyle.sup())
              )
            : null;
        const limitBelow = this.subscript
            ? makeSpan(
                  decompose(context.sub(), this.subscript),
                  context.mathstyle.adjustTo(context.mathstyle.sub())
              )
            : null;
        return makeLimitsStack(
            context,
            nucleus,
            nucleusShift,
            slant,
            limitAbove,
            limitBelow
        );
    }

    /**
     * Add an ID attribute to both the span and this atom so that the atom
     * can be retrieved from the span later on (e.g. when the span is clicked on)
     * @param {Context} context
     * @param {Span} span
     * @method Atom#bind
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
     * @method Atom#makeSpan
     * @private
     */
    makeSpan(context, body) {
        const type = this.type === 'textord' ? 'mord' : this.type;
        const result = makeSpanOfType(type, body);

        // The font family is determined by:
        // - the base font family associated with this atom (optional). For example,
        // some atoms such as some functions ('\sin', '\cos', etc...) or some
        // symbols ('\Z') have an explicit font family. This overrides any
        // other font family
        // - the user-specified font family that has been explicitly applied to
        // this atom
        // - the font family automatically determined in math mode, for example
        // which italicizes some characters, but which can be overridden

        const style = this.getStyle();
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
        result.maxFontSize = Math.max(
            result.maxFontSize,
            context.sizeMultiplier || 1.0
        );

        // Set other attributes

        if (this.mode === 'text') result.classes += ' ML__text';
        if (context.mathstyle.isTight()) result.isTight = true;
        // The italic correction applies only in math mode
        if (this.mode !== 'math') result.italic = 0;
        result.setRight(result.italic); // Italic correction

        if (typeof context.opacity === 'number')
            result.setStyle('opacity', context.opacity);

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

function makeID(context) {
    let result;
    if (typeof context.generateID === 'boolean' && context.generateID) {
        result =
            Date.now()
                .toString(36)
                .slice(-2) + Math.floor(Math.random() * 0x186a0).toString(36);
    } else if (typeof context.generateID === 'object') {
        result = context.generateID.overrideID
            ? context.generateID.overrideID
            : context.generateID.seed.toString(36);
        context.generateID.seed += 1;
    }
    return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Combine a nucleus with an atom above and an atom below. Used to form
 * limits.
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
 * @return {Span}
 * @memberof module:atom
 * @private
 */
function makeLimitsStack(context, nucleus, nucleusShift, slant, above, below) {
    // If nothing above and nothing below, nothing to do.
    if (!above && !below) return nucleus;

    // IE8 clips \int if it is in a display: inline-block. We wrap it
    // in a new span so it is an inline, and works.
    // @todo: revisit
    nucleus = makeSpan(nucleus);

    let aboveShift = 0;
    let belowShift = 0;

    if (above) {
        aboveShift = Math.max(
            FONTMETRICS.bigOpSpacing1,
            FONTMETRICS.bigOpSpacing3 - spanDepth(above)
        );
    }
    if (below) {
        belowShift = Math.max(
            FONTMETRICS.bigOpSpacing2,
            FONTMETRICS.bigOpSpacing4 - spanHeight(below)
        );
    }

    let result = null;

    if (below && above) {
        const bottom =
            FONTMETRICS.bigOpSpacing5 +
            spanHeight(below) +
            spanDepth(below) +
            belowShift +
            spanDepth(nucleus) +
            nucleusShift;

        result = makeVlist(
            context,
            [
                FONTMETRICS.bigOpSpacing5,
                below,
                belowShift,
                nucleus,
                aboveShift,
                above,
                FONTMETRICS.bigOpSpacing5,
            ],
            'bottom',
            bottom
        );

        // Here, we shift the limits by the slant of the symbol. Note
        // that we are supposed to shift the limits by 1/2 of the slant,
        // but since we are centering the limits adding a full slant of
        // margin will shift by 1/2 that.
        result.children[0].setLeft(-slant);
        result.children[2].setLeft(slant);
    } else if (below && !above) {
        const top = spanHeight(nucleus) - nucleusShift;

        result = makeVlist(
            context,
            [FONTMETRICS.bigOpSpacing5, below, belowShift, nucleus],
            'top',
            top
        );

        // See comment above about slants
        result.children[0].setLeft(-slant);
    } else if (!below && above) {
        const bottom = spanDepth(nucleus) + nucleusShift;

        result = makeVlist(
            context,
            [nucleus, aboveShift, above, FONTMETRICS.bigOpSpacing5],
            'bottom',
            bottom
        );

        // See comment above about slants
        result.children[1].setLeft(slant);
    }

    return makeSpanOfType('mop', result, 'op-limits');
}

/**
 * Return an atom suitable for use as the root of a formula.
 *
 * @param {string} parseMode
 * @param {Atom[]} body
 * @return {Atom[]}
 * @memberof module:core/atom
 * @private
 */

export function makeRoot(parseMode, body) {
    parseMode = parseMode || 'math';
    const result = new Atom(parseMode, 'root', body || []);
    if (result.body.length === 0 || result.body[0].type !== 'first') {
        result.body.unshift(new Atom('', 'first'));
    }
    return result;
}
