import { isArray } from '../common/types';

import { Style, ParseMode } from '../public/core';
import { getCharacterMetrics } from './font-metrics';
import { svgBodyToMarkup, svgBodyHeight } from './svg-span';
import { applyStyle as applyStyleForMode } from './modes-utils';
import { Context } from './context';
import { Mathstyle } from './mathstyle';

/*
 * See https://tex.stackexchange.com/questions/81752/
 * for a thorough description of the TeXt atom type and their relevance to
 * proper kerning.
 */

const SPAN_TYPE = [
    '',
    'mord',
    'mbin',
    'mop',
    'mrel',
    'mopen',
    'mclose',
    'mpunct',
    'minner',
    'spacing',
    // 'mtable',
    'first',
    'command',
    'error',
    'placeholder',
    'textord', // @revisit
    'none', // @revisit. Use ''?
] as const; // The const assertion prevents widening to string[]
export type SpanType = typeof SPAN_TYPE[number];

export function isSpanType(type: string): type is SpanType {
    return ((SPAN_TYPE as unknown) as string[]).includes(type);
}

/*
 * See http://www.tug.org/TUGboat/tb30-3/tb96vieth.pdf for
 * typesetting conventions for mathematical physics (units, etc...)
 */

const INTER_ATOM_SPACING = {
    'mord+mop': 3,
    'mord+mbin': 4,
    'mord+mrel': 5,
    'mord+minner': 3,

    'mop+mord': 3,
    'mop+mop': 3,
    'mop+mbin': 5,
    'mop+minner': 3,

    'mbin+mord': 4,
    'mbin+mop': 4,
    'mbin+mopen': 4,
    'mbin+minner': 4,

    'mrel+mord': 5,
    'mrel+mop': 5,
    'mrel+mopen': 5,
    'mrel+minner': 5,

    'mclose+mop': 3,
    'mclose+mbin': 4,
    'mclose+mrel': 5,
    'mclose+minner': 3,

    'mpunct+mord': 3,
    'mpunct+mop': 3,
    'mpunct+mbin': 4,
    'mpunct+mrel': 5,
    'mpunct+mopen': 3,
    'mpunct+mpunct': 3,
    'mpunct+minner': 3,
};

// See https://www.w3.org/TR/2000/WD-MathML2-20000328/chapter6.html
// 6.1.4 Non-Marking Characters
const SPACING_CHARACTER = [
    '\u200b', // 0/18 ZERO-WIDTH SPACE
    '\u200a', // 1/18 HAIR SPACE
    '\u200a\u200a', // 2/18
    '\u2009', // 3/18 THIN SPACE
    '\u205f', // 4/18 MEDIUM MATHEMATICAL SPACE
    '\u205f\u200a', // 5/18 MEDIUM MATHEMATICAL SPACE + HAIR SPACE
    '\u2004', // 6/18 THREE-PER-EM SPACE   1/3em
    '',
    '',
    '\u2002', // 9/18 EN SPACE 1/2em = 9/18
];
const NEGATIVE_SPACING_CHARACTER = [
    '',
    '\u200a\u2063', // -1/18
    '',
    '\u2009\u2063', // -3/18
    '\u205f\u2063', // -4/18
    '\u2005\u2063', // -5/18
];

const INTER_ATOM_TIGHT_SPACING = {
    'mord+mop': 3,
    'mop+mord': 3,
    'mop+mop': 3,
    'mclose+mop': 3,
    'minner+mop': 3,
};

/**
 * Return a string made up of the concatenated arguments.
 * Each arguments can be either a string, which is unchanged,
 * or a number, which is converted to a string with at most 2 fractional digits.
 *
 */
function toString(arg: (string | number)[] | string | number): string {
    if (typeof arg === 'string') {
        return arg;
    }
    if (typeof arg === 'number') {
        return Number(Math.ceil(1e2 * arg) / 1e2).toString();
    }
    if (typeof arg === 'undefined') {
        return '';
    }
    if (isArray(arg)) {
        let result = '';
        for (const elem of arg) {
            result += toString(elem);
        }
        return result;
        // } else if (arg) {
        //     result += (arg as number).toString();
    }
    console.error('Span.toStringUnexpected argument type');
    return '';
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
 * @param content the items 'contained' by this node
 * @param classes list of classes attributes associated with this node


 * @property  type - For example, `'command'`, `'mrel'`, etc...
 * @property classes - A string of space separated CSS classes
 * associated with this element
 * @property cssId - A CSS ID assigned to this span (optional)
 * @property children - An array, potentially empty, of spans which
 * this span encloses
 * @property body - Content of this span. Can be empty.
 * @property style - A set of key/value pairs specifying CSS properties
 * associated with this element.
 * @property height - The measurement from baseline to top, in em.
 * @property depth - The measurement from baseline to bottom, in em.
 * @property width
 */
export class Span {
    children?: Span[];
    classes: string;
    type: SpanType;

    body: string;
    delim?: string; // @revisit
    caret: ParseMode;

    height?: number;
    depth?: number;
    width?: number;
    skew?: number;
    italic?: number;
    maxFontSize?: number;

    isTight?: boolean;

    cssId?: string;

    svgBody?: string;
    svgOverlay?: string;
    svgStyle?: string;

    style: { [key: string]: string };
    attributes?: { [key: string]: string }; // HTML attributes, for example 'data-atom-id'

    constructor(
        content: string | Span | Span[],
        classes = '',
        type: SpanType = ''
    ) {
        // CLASSES
        this.classes = classes;
        // CONTENT
        if (isArray(content)) {
            // Check if isArray first, since an array is also an object
            // Flatten it (i.e. [[a1, a2], b1, b2] -> [a1, a2, b1, b2]
            this.children = [].concat(...content);
        } else if (typeof content === 'string') {
            this.body = content;
        } else if (content && typeof content === 'object') {
            this.children = [content];
        }
        this.type = type;

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
     * - maxFontSize: a size multiplier (typically set with commands such as \huge)
     */
    updateDimensions(): void {
        let height = 0.0;
        let depth = 0.0;
        let maxFontSize = 1.0;
        if (this.children) {
            this.children.forEach((x) => {
                if (x.height > height) height = x.height;
                if (x.depth > depth) depth = x.depth;
                if (x.maxFontSize > maxFontSize) maxFontSize = x.maxFontSize;
            });
        }
        this.height = height;
        this.depth = depth;
        this.maxFontSize = maxFontSize;
    }

    selected(isSelected: boolean): void {
        if (isSelected && !/ML__selected/.test(this.classes)) {
            if (this.classes.length > 0) this.classes += ' ';
            this.classes += 'ML__selected';
        }
        if (!isSelected && /ML__selected/.test(this.classes)) {
            this.classes = this.classes.replace('ML__selected', '');
        }
        if (this.children) {
            this.children.forEach((x) => x.selected(isSelected));
        }
    }

    applyStyle(style: Style): void {
        if (!style) return;

        //
        // 1. Apply color
        //
        if (style.color) {
            if (style.color !== 'none') {
                this.setStyle('color', style.color);
            } else {
                this.setStyle('color', '');
            }
        }
        if (style.backgroundColor) {
            if (style.backgroundColor !== 'none') {
                this.setStyle('background-color', style.backgroundColor);
            } else {
                this.setStyle('background-color', '');
            }
        }

        //
        // 2. Add any custom style classes
        //

        if (style.cssClass) {
            this.classes += ' ' + style.cssClass;
        }

        // If the body is null (for example for a line), we're done.
        if (!this.body) return;

        //
        // 3. Determine the font family (i.e. 'ams', 'mathcal', etc...)
        // and apply styling by adding appropriate classes to the atom
        //

        console.assert(typeof this.body === 'string');

        const fontName = applyStyleForMode(this, style);

        //
        // 5. Get the metrics information
        //
        if (this.body && fontName) {
            this.maxFontSize =
                {
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
                }[style.fontSize] || 1.0;
            this.height = 0.0;
            this.depth = 0.0;
            this.skew = 0.0;
            this.italic = 0.0;
            for (let i = 0; i < this.body.length; i++) {
                const metrics = getCharacterMetrics(
                    this.body.charAt(i),
                    fontName
                );
                // If we were able to get metrics info for this character, store it.
                if (metrics) {
                    this.height = Math.max(this.height, metrics.height);
                    this.depth = Math.max(this.depth, metrics.depth);
                    this.skew = metrics.skew;
                    this.italic = metrics.italic;
                }
            }
        }
    }

    /**
     * Set the value of a CSS property associated with this span.
     * For example, setStyle('border-right', 5.6, 'em');
     *
     * @param prop the CSS property to set
     * @param value a series of strings and numbers that will be concatenated.
     */
    setStyle(prop: string, ...value: (string | number)[]): void {
        const v = toString(value);
        if (v.length > 0) {
            if (!this.style) this.style = {};
            this.style[prop] = v;
        }
    }

    setTop(top: number): void {
        if (top && top !== 0) {
            if (!this.style) this.style = {};
            this.style['top'] = toString(top) + 'em';
            this.height -= top;
            this.depth += top;
        }
    }

    setLeft(left: number): void {
        if (left && left !== 0) {
            if (!this.style) this.style = {};
            this.style['margin-left'] = toString(left) + 'em';
        }
    }
    setRight(right: number): void {
        if (right && right !== 0) {
            if (!this.style) this.style = {};
            this.style['margin-right'] = toString(right) + 'em';
        }
    }
    setWidth(width: number): void {
        if (width && width !== 0) {
            if (!this.style) this.style = {};
            this.style['width'] = toString(width) + 'em';
        }
    }

    /**
     * Generate the HTML markup to represent this span.
     *
     * @param hskip - Space (in mu, 1/18em) to leave on the left side
     * of the span. Implemented as a Unicode character if possible, a margin-left otherwise.
     * This is used to adjust the inter-spacing between spans of different types,
     * e.g. 'bin' and 'rel', according to the TeX rules (TexBook p.170)
     * @param hscale - If a value is provided, the margins are scaled by
     * this factor.
     * @return HTML markup
     */

    toMarkup(hskip = 1.0, hscale = 1.0): string {
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
                            spacing =
                                INTER_ATOM_TIGHT_SPACING[
                                    previousType + '+' + type
                                ] || 0;
                        } else {
                            spacing =
                                INTER_ATOM_SPACING[previousType + '+' + type] ||
                                0;
                        }
                        spacing = Math.floor(hscale * spacing);
                    }
                }
                body += child.toMarkup(spacing, hscale);
                previousType = lastSpanType(child);
            }
        }
        // Collapse 'empty' spans
        if (
            (body === '\u200b' || (!body && !this.svgBody)) &&
            (!this.classes || this.classes === 'ML__selected') &&
            !this.cssId &&
            !this.style &&
            !this.svgOverlay
        ) {
            result = '';
        } else {
            // Note: We can't omit the tag, even if it has no class and no style,
            // as some layouts (vlist) depends on the presence of the tag to function
            result = '<span';

            if (this.cssId) {
                result += ' id="' + this.cssId + '" ';
            }

            if (this.attributes) {
                result +=
                    ' ' +
                    Object.keys(this.attributes)
                        .map(
                            (attribute) =>
                                `${attribute}="${this.attributes[attribute]}"`
                        )
                        .join(' ');
            }

            const classes = this.classes.split(' ');

            // Add the type (mbin, mrel, etc...) if specified
            classes.push(
                {
                    command: 'ML__command',
                    placeholder: 'ML__placeholder',
                    error: 'ML__error',
                }[this.type] ?? ''
            );
            if (this.caret && this.type === 'command') {
                classes.push('ML__command-caret');
            }

            // Remove duplicate and empty classes
            let classList = '';
            if (classes.length > 1) {
                classList = classes
                    .filter((x, e, a) => {
                        return x.length > 0 && a.indexOf(x) === e;
                    })
                    .join(' ');
            } else {
                classList = classes[0];
            }

            if (classList.length > 0) {
                result += ` class="${classList}"`;
            }

            // If a `hskip` value was provided, add it to the margin-left
            if (hskip) {
                if (this.style && this.style['margin-left']) {
                    // There was already a margin, add to it
                    this.style['margin-left'] =
                        toString(
                            parseFloat(this.style['margin-left']) + hskip / 18
                        ) + 'em';
                } else {
                    // No margin yet. Can we encode it as a Unicode space?
                    if (hskip < 0 && NEGATIVE_SPACING_CHARACTER[-hskip]) {
                        body = NEGATIVE_SPACING_CHARACTER[-hskip] + body;
                    } else if (SPACING_CHARACTER[hskip]) {
                        body = SPACING_CHARACTER[hskip] + body;
                    } else {
                        if (!this.style) this.style = {};
                        this.style['margin-left'] = toString(hskip / 18) + 'em';
                    }
                }
            }

            if (this.style) {
                let styleString = '';
                const isSelected = /ML__selected/.test(this.classes);
                for (const style in this.style) {
                    if (
                        Object.prototype.hasOwnProperty.call(this.style, style)
                    ) {
                        // Render the style property, except the background
                        // of selected spans
                        if (style !== 'background-color' || !isSelected) {
                            styleString +=
                                style + ':' + this.style[style] + ';';
                        }
                    }
                }

                if (styleString.length > 0) {
                    result += ' style="' + styleString + '"';
                }
            }
            result += '>';

            // If there is some SVG markup associated with this span,
            // include it now
            if (this.svgBody) {
                result += svgBodyToMarkup(this.svgBody);
            } else if (this.svgOverlay) {
                result += '<span style="';
                result += 'display: inline-block;';
                result += 'height:' + (this.height + this.depth) + 'em;';
                result += 'vertical-align:' + this.depth + 'em;';
                result += '">';
                result += body;
                result += '</span>';
                result += '<svg ';
                result += 'style="position:absolute;';
                result += 'overflow:overlay;';
                result += 'height:' + (this.height + this.depth) + 'em;';
                if (this.style && this.style.padding) {
                    result += 'top:' + this.style.padding + ';';
                    result += 'left:' + this.style.padding + ';';
                    result +=
                        'width:calc(100% - 2 * ' + this.style.padding + ' );';
                } else {
                    result += 'top:0;';
                    result += 'left:0;';
                    result += 'width:100%;';
                }
                result += 'z-index:2;';
                result += '"';
                if (this.svgStyle) {
                    result += ' style="' + this.svgStyle + '"';
                }
                result += '>';
                result += this.svgOverlay;
                result += '</svg>';
            } else {
                result += body;
            }

            result = result + '</span>';
        }

        if (this.caret && this.type !== 'command') {
            if (this.caret === 'text') {
                result = result + '<span class="ML__text-caret"></span>';
            } else {
                result = result + '<span class="ML__caret"></span>';
            }
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
     */
    tryCoalesceWith(span: Span): boolean {
        // Don't coalesce if the tag or type are different
        if (this.type !== span.type) return false;

        // Don't coalesce consecutive errors, placeholders or commands
        if (
            this.type === 'error' ||
            this.type === 'placeholder' ||
            this.type === 'command'
        ) {
            return false;
        }

        // Don't coalesce if some of the content is SVG
        if (this.svgBody || !this.body) return false;
        if (span.svgBody || !span.body) return false;

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
        const classes = this.classes.trim().replace(/\s+/g, ' ').split(' ');
        const spanClasses = span.classes.trim().replace(/\s+/g, ' ').split(' ');

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
                if (
                    Object.prototype.hasOwnProperty.call(this.style, style) &&
                    Object.prototype.hasOwnProperty.call(span.style, style)
                ) {
                    if (this.style[style] !== span.style[style]) return false;
                }
            }
        }

        // OK, the attributes of those spans are compatible.
        // Merge span into this
        this.body += span.body;
        this.height = Math.max(this.height, span.height);
        this.depth = Math.max(this.depth, span.depth);
        this.maxFontSize = Math.max(this.maxFontSize, span.maxFontSize);
        // The italic correction for the coalesced spans is the
        // italic correction of the last span.
        this.italic = span.italic;
        return true;
    }
}

function lastSpanType(span: Span): string {
    const result = span.type;
    if (result === 'first') return 'none';
    if (result === 'textord') return 'mord';
    return result;
}

/**
 * Attempts to coalesce (merge) spans, for example consecutive text spans.
 * Return a new tree with coalesced spans.
 *
 */
export function coalesce(spans: Span[]): Span[] {
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

export function height(spans: Span | Span[]): number {
    if (!spans) return 0;
    if (isArray(spans)) {
        return spans.reduce((acc, x) => Math.max(acc, x.height), 0);
    }
    return spans.height;
}

export function depth(spans: Span | Span[]): number {
    if (!spans) return 0;
    if (isArray(spans)) {
        return spans.reduce((acc, x) => Math.max(acc, x.depth), 0);
    }
    return spans.depth;
}

export function skew(spans: Span | Span[]): number {
    if (!spans) return 0;
    if (isArray(spans)) {
        let result = 0;
        for (const span of spans) {
            result += span.skew || 0;
        }
        return result;
    }
    return spans.skew;
}

export function italic(spans: Span | Span[]): number {
    if (!spans) return 0;
    if (isArray(spans)) {
        return spans[spans.length - 1].italic;
    }
    return spans.italic;
}

/**
 * Make an element made of a sequence of children with classes
 * @param content the items 'contained' by this node
 * @param classes list of classes attributes associated with this node
 */
export function makeSpan(
    content: string | Span | Span[],
    classes = '',
    type: SpanType = ''
): Span {
    console.assert(!classes || !isSpanType(classes));
    if (isArray(content)) {
        const c = content.filter((x) => !!x);
        if (c.length === 1) {
            return new Span(c[0], classes, type);
        }
        return new Span(c, classes, type);
    }
    return new Span(content, classes, type);
}

export function makeSymbol(
    fontFamily: string,
    symbol: string,
    classes = '',
    type: SpanType = ''
): Span {
    const result = new Span(symbol, classes, type);

    const metrics = getCharacterMetrics(symbol, fontFamily);
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
 */
function makeFontSizer(context: Context, fontSize: number): Span {
    const fontSizeAdjustment = fontSize
        ? fontSize / context.mathstyle.sizeMultiplier
        : 0;
    const fontSizeInner = new Span('\u200b'); // ZERO WIDTH SPACE

    if (fontSizeAdjustment !== 1) {
        fontSizeInner.setStyle(
            'font-size',
            fontSizeAdjustment,
            fontSizeAdjustment > 0 ? 'em' : ''
        );
        fontSizeInner.attributes = {
            'aria-hidden': 'true',
        };
    }

    if (context.size !== 'size5') {
        return new Span(
            fontSizeInner,
            'fontsize-ensurer reset-' + context.size + ' size5'
        );
    }
    return fontSizeAdjustment !== 0 ? fontSizeInner : null;
}

export function makeStruts(
    content: Span | Span[],
    classes = '',
    type: SpanType = ''
): Span {
    const topStrut = makeSpan('', 'ML__strut');
    topStrut.setStyle('height', height(content), 'em');
    let bottomStrut: Span;
    if (depth(content) !== 0) {
        bottomStrut = makeSpan('', 'ML__strut--bottom');
        bottomStrut.setStyle('height', height(content) + depth(content), 'em');
        bottomStrut.setStyle('vertical-align', -depth(content), 'em');
    }
    let struts: Span[];
    if (isArray(content)) {
        struts = [topStrut, bottomStrut, ...content];
    } else {
        struts = [topStrut, bottomStrut, content];
    }
    const result = makeSpan(struts, classes, type);
    // result.setStyle('display', 'inline-block');
    return result;
}

export function makeStyleWrap(
    type: SpanType,
    children: Span | Span[],
    fromStyle: Mathstyle,
    toStyle: Mathstyle,
    classes: string
): Span {
    classes = classes || '';
    classes += ' style-wrap ';

    const result = makeHlist(children, classes + fromStyle.adjustTo(toStyle));
    result.type = type;

    const multiplier = toStyle.sizeMultiplier / fromStyle.sizeMultiplier;
    result.height *= multiplier; // @revisit. Use spanHeight()? is height set at this point?
    result.depth *= multiplier;
    result.maxFontSize = toStyle.sizeMultiplier;

    return result;
}

/**
 * Add some SVG markup to be overlaid on top of the span
 */
export function addSVGOverlay(
    body: Span,
    svgMarkup: string,
    svgStyle: string
): Span {
    body.svgOverlay = svgMarkup;
    body.svgStyle = svgStyle;
    return body;
}

export function makeHlist(
    spans: Span | Span[],
    classes = '',
    type: SpanType = ''
): Span {
    if (!classes) {
        // No decorations...
        if (spans instanceof Span) {
            // A single span, use it as the output
            return spans;
        } else if (isArray(spans) && spans.length === 1) {
            // An array, with a single span, use the single span as the output
            return spans[0];
        }
    }
    const result = new Span(spans, classes, type);

    let multiplier = 1.0;
    if (spans instanceof Span) {
        multiplier = spans.maxFontSize;
    } else {
        multiplier = spans.reduce((acc, x) => Math.max(acc, x.maxFontSize), 0);
    }
    result.height *= multiplier;
    result.depth *= multiplier;

    return result;
}

/**
 * Create a new span of type `vlist`, a set of vertically stacked items
 * @param elements  An array of Span and integer. The integer can be either some kerning information
 * or the value of an individual shift of the preceding child if in 'individualShift' mode
 * @param pos The method that will be used to position the elements in the vlist.
 *
 * One of:
 * - `"individualShift"`: each child must be followed by a number indicating how much to shift it (i.e. moved downwards)
 * - `"top"`: posData specifies the topmost point of the vlist (>0 move up)
 * - `"bottom"`: posData specifies the bottommost point of the vlist (>0 move down)
 * - `"shift"`: the baseline of the vlist will be positioned posData away from the baseline
 * of the first child. (>0 moves down)
 */
export function makeVlist(
    context: Context,
    elements: (number | Span[] | Span)[],
    pos: 'shift' | 'top' | 'bottom' | 'individualShift' = 'shift',
    posData = 0
): Span {
    let listDepth = 0;
    let currPos = 0;
    pos = pos || 'shift';

    // Normalize the elements so that they're all either a number or
    // a single span. If a child is an array of spans,
    // wrap it in a span
    for (let i = 0; i < elements.length; i++) {
        if (isArray(elements[i])) {
            if ((elements[i] as Span[]).length === 1) {
                // If that's an array made up of a single span, use that span
                elements[i] = elements[i][0];
            } else {
                // Otherwise, wrap it in a span
                elements[i] = makeSpan(elements[i] as Span[]);
            }
        }
    }

    if (pos === 'shift') {
        console.assert(elements[0] instanceof Span);
        listDepth = -(elements[0] as Span).depth - posData;
    } else if (pos === 'bottom') {
        listDepth = -posData;
    } else if (pos === 'top') {
        let bottom = posData;
        for (const element of elements) {
            if (element instanceof Span) {
                // It's a Span, use the dimension data
                bottom -= element.height + element.depth;
            } else if (typeof element === 'number') {
                // It's a kern adjustment
                bottom -= element;
            }
        }
        listDepth = bottom;
    } else if (pos === 'individualShift') {
        // Individual adjustment to each elements.
        // The elements list is made up of a Span followed
        // by a shift adjustment as an integer
        const originalElements: (number | Span)[] = elements as (
            | number
            | Span
        )[];
        elements = [originalElements[0]];

        // Add in kerns to the list of elements to get each element to be
        // shifted to the correct specified shift
        console.assert(originalElements[0] instanceof Span);
        listDepth = -originalElements[1] - (originalElements[0] as Span).depth;
        currPos = listDepth;
        for (let i = 2; i < originalElements.length; i += 2) {
            console.assert(originalElements[i] instanceof Span);
            const diff =
                -originalElements[i + 1] -
                currPos -
                (originalElements[i] as Span).depth;
            currPos = currPos + diff;

            console.assert(originalElements[i - 2] instanceof Span);
            const kern =
                diff -
                ((originalElements[i - 2] as Span).height +
                    (originalElements[i - 2] as Span).depth);

            elements.push(kern);
            elements.push(originalElements[i]);
        }
    } else {
        console.assert(false, 'makeVList with unknown method: "' + pos + '"');
    }

    // Make the fontSizer
    let maxFontSize = 1.0;
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
        } else if (element instanceof Span) {
            const wrap = makeSpan([fontSizer, element]);
            wrap.setTop(-element.depth - currPos);
            newElements.push(wrap);
            currPos += element.height + element.depth;
        }
    }

    const result = makeSpan(newElements, 'vlist');

    // Fix the final height and depth, in case there were kerns at the ends
    // since makeSpan won't take that into account.
    result.depth = Math.max(listDepth, depth(result) || 0);
    result.height = Math.max(-currPos, height(result) || 0);

    return result;
}

/**
 * Create a span that consist of a (stretchy) SVG element
 *
 * @param classes list of classes attributes associated with this node
 */
export function makeSVGSpan(svgBodyName: string): Span {
    const span = new Span(null);
    span.svgBody = svgBodyName;
    span.height = svgBodyHeight(svgBodyName) / 2;
    span.depth = span.height;
    return span;
}
