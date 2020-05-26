import { isArray } from '../common/types';

import { Context, ContextInterface, ParseModePrivate } from './context';
import {
    Style,
    ParseMode,
    Variant,
    VariantStyle,
    FontShape,
    FontSeries,
} from '../public/core';
import { MATHSTYLES } from './mathstyle';
import { METRICS as FONTMETRICS } from './font-metrics';
import {
    makeSpan,
    makeVlist,
    depth as spanDepth,
    height as spanHeight,
    italic as spanItalic,
    SpanType,
    isSpanType,
    Span,
} from './span';
import { makeSizedDelim } from './delimiters';
import { atomToLatex } from './atom-to-latex';

export type Notations = {
    downdiagonalstrike?: boolean;
    updiagonalstrike?: boolean;
    verticalstrike?: boolean;
    horizontalstrike?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
    top?: boolean;
    circle?: boolean;
    roundedbox?: boolean;
    madruwb?: boolean;
    actuarial?: boolean;
    box?: boolean;
};
export type AtomType =
    | ''
    | 'array'
    | 'box'
    | 'command'
    | 'delim'
    | 'enclose'
    | 'error'
    | 'first'
    | 'genfrac'
    | 'group'
    | 'leftright'
    | 'mathstyle' // @revisit
    | 'mbin'
    | 'mclose'
    | 'minner'
    | 'mop'
    | 'mopen'
    | 'mord'
    | 'mpunct'
    | 'mrel'
    | 'msubsup'
    | 'none' // @revisit
    | 'overlap'
    | 'overunder'
    | 'placeholder'
    | 'root'
    | 'rule'
    | 'sizeddelim'
    | 'space'
    | 'spacing'
    | 'surd'
    | 'textord';

export type Colspec = {
    gap?: number | Atom[];
    // 'm' is a special alignement for multline: left on first row, right on last
    // row, centered otherwise
    align?: 'l' | 'c' | 'r' | 'm';
    rule?: boolean;
};
export type BBoxParam = {
    backgroundcolor?: string;
    padding?: number;
    border?: string;
};

export const ATOM_REGISTRY = {};

// A table of size -> font size for the different sizing functions
export const SIZING_MULTIPLIER = {
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

export function registerAtomType(
    name: string,
    decompose: (context: Context, atom: Atom) => Span[]
): void {
    ATOM_REGISTRY[name] = { decompose: decompose };
}

/**
 * Return a list of spans equivalent to atoms.
 * A span is the most elementary type possible, for example 'text'
 * or 'vlist', while the input atoms may be more abstract and complex,
 * such as 'genfrac'
 *
 * @param context Font family, variant, size, color, and other info useful
 * to render an expression
 * @param atoms - A single atom or an array of atoms
 */
export function decompose(
    inputContext: ContextInterface,
    atoms: Atom | Atom[]
): Span[] | null {
    function isDigit(atom: Atom): boolean {
        return (
            atom.type === 'mord' &&
            !!atom.symbol &&
            /^[0-9,.]$/.test(atom.symbol)
        );
    }
    function isText(atom: Atom): boolean {
        return atom.mode === 'text';
    }

    // We can be passed either a Context object, or
    // a simple object with some properties set.
    const context: Context =
        inputContext instanceof Context
            ? inputContext
            : new Context(inputContext);

    // In most cases we want to display selection,
    // except if the atomIdsSettings.groupNumbers flag is set which is used for
    // read aloud.
    const displaySelection =
        !context.atomIdsSettings || !context.atomIdsSettings.groupNumbers;

    let result: Span[] | null = [];
    if (isArray(atoms)) {
        if (atoms.length === 0) {
            return [];
        } else if (atoms.length === 1) {
            result = atoms[0].decompose(context);
            if (result && displaySelection && atoms[0].isSelected) {
                result.forEach((x: Span) => x.selected(true));
            }
            console.assert(!result || isArray(result));
        } else {
            let previousType = 'none';
            let nextType = atoms[1].type;
            let selection: Span[] = [];
            let digitOrTextStringID = '';
            let lastWasDigit = true;
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
                    if (
                        /first|none|mrel|mpunct|mopen|mbin|mop/.test(
                            previousType
                        ) ||
                        /none|mrel|mpunct|mclose/.test(nextType)
                    ) {
                        atoms[i].type = 'mord';
                    }
                }

                // If this is a scaffolding supsub, we'll use the
                // phantomBase from the previous atom to position the supsub.
                // Otherwise, no need for the phantomBase
                if (
                    atoms[i].body !== '\u200b' ||
                    (!atoms[i].superscript && !atoms[i].subscript)
                ) {
                    phantomBase = null;
                }

                if (
                    context.atomIdsSettings?.groupNumbers &&
                    digitOrTextStringID &&
                    ((lastWasDigit && isDigit(atoms[i])) ||
                        (!lastWasDigit && isText(atoms[i])))
                ) {
                    context.atomIdsSettings.overrideID = digitOrTextStringID;
                }
                const span = atoms[i].decompose(context, phantomBase);
                if (context.atomIdsSettings) {
                    context.atomIdsSettings.overrideID = null;
                }
                if (span) {
                    // The result from decompose is always an array
                    // Flatten it (i.e. [[a1, a2], b1, b2] -> [a1, a2, b1, b2]
                    const flat = [].concat(...span);
                    phantomBase = flat;

                    // If this is a digit or text run, keep track of it
                    if (context.atomIdsSettings?.groupNumbers) {
                        if (isDigit(atoms[i]) || isText(atoms[i])) {
                            if (
                                !digitOrTextStringID ||
                                lastWasDigit !== isDigit(atoms[i])
                            ) {
                                // changed from text to digits or vice-versa
                                lastWasDigit = isDigit(atoms[i]);
                                digitOrTextStringID = atoms[i].id;
                            }
                        }
                        if (
                            (!(isDigit(atoms[i]) || isText(atoms[i])) ||
                                atoms[i].superscript ||
                                atoms[i].subscript) &&
                            digitOrTextStringID
                        ) {
                            // Done with digits/text
                            digitOrTextStringID = '';
                        }
                    }

                    if (displaySelection && atoms[i].isSelected) {
                        selection = selection.concat(flat);
                        selection.forEach((x: Span) => x.selected(true));
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
                nextType = atoms[i + 1]
                    ? atoms[i + 1].getInitialBaseElement().type
                    : 'none';
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
            result.forEach((x: Span) => x.selected(true));
        }
    }

    if (!result || result.length === 0) return null;

    console.assert(isArray(result) && result.length > 0);

    // If the mathstyle changed between the parent and the current atom,
    // account for the size difference
    if (context.mathstyle !== context.parentMathstyle) {
        const factor =
            context.mathstyle.sizeMultiplier /
            context.parentMathstyle.sizeMultiplier;
        for (const span of result) {
            console.assert(!isArray(span));
            console.assert(
                typeof span.height === 'number' && isFinite(span.height)
            );
            span.height *= factor;
            span.depth *= factor;
        }
    }
    // If the size changed between the parent and the current group,
    // account for the size difference
    if (context.size !== context.parentSize) {
        const factor =
            SIZING_MULTIPLIER[context.size] /
            SIZING_MULTIPLIER[context.parentSize];
        for (const span of result) {
            console.assert(!isArray(span));
            console.assert(
                typeof span.height === 'number' && isFinite(span.height)
            );
            span.height *= factor;
            span.depth *= factor;
        }
    }

    return result;
}

/**
 * An atom is an object encapsulating an elementary mathematical unit,
 * independent of its graphical representation.
 *
 * It keeps track of the content, while the dimensions, position and style
 * are tracked by Span objects which are created by the `decompose()` functions.
 *
 * @param style A set of additional properties to append to
 * the atom
 * @property mode - `'display'`, `'command'`, etc...
 * @property type - Type can be one of:
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
 * @property captureSelection if true, this atom does not let its
 * children be selected. Used by the `\enclose` annotations, for example.
 *
 * @property skipBoundary if true, when the caret reaches the
 * first position in this element's body, it automatically moves to the
 * outside of the element. Conversely, when the caret reaches the position
 * right after this element, it automatically moves to the last position
 * inside this element.
 */
export class Atom implements Style {
    mode: ParseModePrivate;
    type: AtomType;
    latex?: string;
    symbol?: string; // Latex command ('\sin') or character ('a')
    readonly isSymbol?: boolean;
    isFunction?: boolean;
    isError?: boolean; // Indicate an unknown command
    isSuggestion?: boolean; // This atom is a suggestion
    readonly isPhantom?: boolean;
    readonly skipBoundary?: boolean;
    captureSelection?: boolean;

    isSelected?: boolean;
    containsCaret: boolean; // If the atom or one of its descendant includes the caret
    caret: ParseMode | '';

    latexOpen?: string; // type = 'group'
    latexClose?: string; // type = 'group'

    body?: string | Atom[];
    readonly codepoint?: number; // type = 'mord'

    readonly accent?: string; // type = 'accent'
    readonly svgAccent?: string; // type = 'accent'
    readonly svgBody?: string;
    readonly svgAbove?: string; // type = 'overunder'
    readonly svgBelow?: string; // type = 'overunder'

    index?: Atom[]; // type = 'surd'

    denom?: Atom[]; // type = 'genfrac'
    numer?: Atom[]; // type = 'genfrac'
    readonly numerPrefix?: string; // type = 'genfrac'
    readonly denomPrefix?: string; // type = 'genfrac'
    readonly continuousFraction?: boolean; // type = 'genfrac'
    readonly hasBarLine?: boolean; // type = 'genfrac'

    subscript?: Atom[];
    superscript?: Atom[];
    underscript?: Atom[];
    overscript?: Atom[];

    readonly position: string; // type = 'line'

    limits?: 'limits' | 'nolimits' | 'accent' | 'overunder';
    explicitLimits?: boolean; // True if the limits were set by a command

    // type = 'array'
    array?: Atom[][][]; // type = 'array'
    environmentName?: string; // type = 'array'
    readonly arraystretch?: number;
    readonly arraycolsep?: number;
    readonly jot?: number;
    rowGaps?: number[]; // type = 'array'
    // env: { name: string; tabular: boolean }; // type = 'array'
    readonly colFormat?: Colspec[]; // when type = 'array', formating of columns

    inner?: boolean;
    leftDelim?: string;
    rightDelim?: string;

    private size?: 1 | 2 | 3 | 4; // type = 'sizeddelim' @revisit Use maxFontSize? or fontSize?
    readonly delim?: string; // type = 'sizeddelim'

    readonly framecolor?: string; // type = 'box'
    readonly verbatimFramecolor?: string; // type = 'box'
    readonly backgroundcolor?: string; // type = 'box'
    readonly verbatimBackgroundcolor?: string; // type = 'box'
    readonly padding?: number; // type = 'box'
    readonly border?: string; // type = 'box'

    readonly notation?: Notations; // when type = 'enclose'
    readonly shadow?: string; // when type = 'enclose', CSS shadow
    readonly strokeWidth?: number; // when type = 'enclose'
    readonly strokeStyle?: string; // when type = 'enclose', CSS string
    readonly svgStrokeStyle?: string; // when type = 'enclose', CSS string
    readonly strokeColor?: string; // when type = 'enclose', CSS string
    readonly borderStyle?: string; // when type = 'enclose', CSS string

    readonly shift?: number; // type = 'rule'
    private depth?: number; // type = 'rule'
    readonly height?: number; // type = 'rule' (and others?)
    width?: number; // type = 'rule' (and others?)

    private maxFontSize?: number;
    private align?: 'left' | 'right'; // type = 'overlap'

    mathstyle?:
        | 'auto'
        | 'displaystyle'
        | 'textstyle'
        | 'scriptstyle'
        | 'scriptscriptstyle'; // type = 'genfrac', ''

    private cls?: SpanType;

    // Style
    color?: string;
    backgroundColor?: string;
    variant?: Variant;
    variantStyle?: VariantStyle;
    fontFamily?: string;
    fontShape?: FontShape;
    fontSeries?: FontSeries;
    fontSize?: string;
    cssId?: string;
    cssClass?: string;
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';

    id?: string;

    constructor(
        mode: ParseModePrivate,
        type: AtomType,
        body: string | Atom[] = '',
        style: Style = {}
    ) {
        console.assert(type === 'first' || !!mode);
        this.mode = mode;
        this.type = type;
        this.body = body;

        // Append all the properties in extras to this
        // This can override the mode, type and body
        this.applyStyle(style);
    }
    toLatex(expandMacro = false): string {
        return atomToLatex(this, expandMacro);
    }
    getStyle(): Style {
        return {
            mode: this.mode,
            color: this.isPhantom ? 'transparent' : this.color,
            backgroundColor: this.isPhantom
                ? 'transparent'
                : this.backgroundColor,
            variant: this.variant,
            variantStyle: this.variantStyle,
            fontFamily: this.fontFamily,
            fontShape: this.fontShape,
            fontSeries: this.fontSeries,
            fontSize: this.fontSize,
            cssId: this.cssId,
            cssClass: this.cssClass,
        };
    }

    applyStyle(style: Style): void {
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

        if (this.mode === 'text') {
            // @revisit. Use type = 'text' for text atoms?
            // A root can be in text mode (root created when creating a representation
            // of the selection, for copy/paste for example)
            if (this.type !== 'root') this.type = '';
        }
    }

    getInitialBaseElement(): Atom {
        let result: Atom;
        if (isArray(this.body) && this.body.length > 0) {
            if (this.body[0].type !== 'first') {
                result = this.body[0].getInitialBaseElement();
            } else if (this.body[1]) {
                result = this.body[1].getInitialBaseElement();
            }
        }
        return result || this;
    }

    getFinalBaseElement(): Atom {
        if (isArray(this.body) && this.body.length > 0) {
            return this.body[this.body.length - 1].getFinalBaseElement();
        }
        return this;
    }

    isCharacterBox(): boolean {
        const base = this.getInitialBaseElement();
        return /minner|mbin|mrel|mpunct|mopen|mclose|textord/.test(base.type);
    }

    forEach(cb: (arg0: this) => void): void {
        cb(this);
        if (isArray(this.body)) {
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
     */
    filter(cb: (atom: Atom) => boolean): Atom[] {
        let result: Atom[] = [];
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
            if (isArray(this[relation])) {
                for (const atom of this[relation]) {
                    if (atom) result = result.concat(atom.filter(cb));
                }
            }
        }
        if (isArray(this.array)) {
            for (const row of this.array) {
                for (const cell of row) {
                    if (cell) result = result.concat(cell.filter(cb));
                }
            }
        }
        return result;
    }

    decomposeGroup(context: Context): Span {
        // The scope of the context is this group, so clone it
        // so that any changes to it will be discarded when finished
        // with this group.
        // Note that the mathstyle property is optional and could be undefined
        // If that's the case, clone() returns a clone of the
        // context with the same mathstyle.
        const localContext = context.clone({
            mathstyle: this.mathstyle ? MATHSTYLES[this.mathstyle] : undefined,
        });
        const span = makeSpan(
            decompose(localContext, this.body as Atom[]),
            '',
            'mord'
        ); // @revisit
        if (this.cssId) span.cssId = this.cssId;
        span.applyStyle({
            backgroundColor: this.backgroundColor,
            cssClass: this.cssClass,
        });
        return span;
    }

    decomposeOverlap(context: Context): Span {
        const inner = makeSpan(
            decompose(context, this.body as Atom[]),
            'inner'
        ); // @revisit
        return makeSpan(
            [inner, makeSpan(null, 'fix')],
            this.align === 'left' ? 'llap' : 'rlap',
            'mord'
        );
    }

    decomposeRule(context: Context): Span {
        const mathstyle = context.mathstyle;
        const result = makeSpan('', 'rule', 'mord');
        let shift = this.shift && !isNaN(this.shift) ? this.shift : 0;
        shift = shift / mathstyle.sizeMultiplier;
        const width = this.width / mathstyle.sizeMultiplier;
        const height = this.height / mathstyle.sizeMultiplier;
        result.setStyle('border-right-width', width, 'em');
        result.setStyle('border-top-width', height, 'em');
        result.setStyle('margin-top', -(height - shift), 'em');
        result.setStyle('border-color', context['color']); // @revisit
        result.width = width;
        result.height = height + shift;
        result.depth = -shift;
        return result;
    }

    /**
     * Return a representation of this, but decomposed in an array of Spans
     *
     * @param context Font variant, size, color, etc...
     * @param phantomBase If not null, the spans to use to
     * calculate the placement of the supsub
     */
    decompose(
        context: Context,
        phantomBase: Span[] | null = null
    ): Span[] | null {
        let result: Span | Span[] | null = null;
        if (
            !this.type ||
            /mord|minner|mbin|mrel|mpunct|mopen|mclose|textord/.test(this.type)
        ) {
            // The body of these atom types is *often* a string, but it can
            // be a atom list (for example a command inside a \text{} or \mathop{})
            if (typeof this.body === 'string') {
                result = this.makeSpan(context, this.body);
            } else {
                result = this.makeSpan(
                    context,
                    decompose(context, this.body as Atom[])
                );
            }
            result.type = isSpanType(this.type) ? this.type : '';
        } else if (this.type === 'group' || this.type === 'root') {
            result = this.decomposeGroup(context);
        } else if (this.type === 'delim') {
            result = makeSpan(null, '');
            result.delim = this.delim;
        } else if (this.type === 'sizeddelim') {
            result = this.bind(
                context,
                makeSizedDelim(this.cls, this.delim, this.size, context)
            );
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
            result = makeSpan('\u200b', '', 'mord');
            if (phantomBase) {
                result.height = phantomBase[0].height;
                result.depth = phantomBase[0].depth;
            }
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
                    }[this.body as string] || 'quad';
                result = makeSpan('\u200b', 'mspace ' + spacingCls);
            }
        } else if (this.type === 'mathstyle') {
            context.setMathstyle(this.mathstyle);
        } else if (this.type === 'command' || this.type === 'error') {
            console.assert(typeof this.body === 'string');
            result = this.makeSpan(context, this.body as string);
            result.classes = ''; // Override fonts and other attributes.
            if (this.isError) {
                result.classes += ' ML__error';
            }
            if (this.isSuggestion) {
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
        if (!result) return null;
        if (
            this.caret &&
            this.type !== 'msubsup' &&
            this.type !== 'command' &&
            this.type !== 'placeholder' &&
            this.type !== 'first'
        ) {
            if (isArray(result)) {
                result[result.length - 1].caret = this.caret;
            } else {
                result.caret = this.caret;
            }
        }
        if (this.containsCaret) {
            if (isArray(result)) {
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
            // If `limits` is set, the attachment of sup/sub was handled
            // in the atom decomposition (e.g. mop, accent)
            if (isArray(result)) {
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
        return isArray(result) ? result : [result];
    }

    attachSupsub(context: Context, nucleus: Span, type: SpanType): Span {
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
        // Rule 18a, p445
        let supShift = 0;
        let subShift = 0;
        if (!this.isCharacterBox()) {
            supShift = spanHeight(nucleus) - mathstyle.metrics.supDrop;
            subShift = spanDepth(nucleus) + mathstyle.metrics.subDrop;
        }
        // Rule 18c, p445
        let minSupShift: number;
        if (mathstyle === MATHSTYLES.displaystyle) {
            minSupShift = mathstyle.metrics.sup1; // sigma13
        } else if (mathstyle.cramped) {
            minSupShift = mathstyle.metrics.sup3; // sigma15
        } else {
            minSupShift = mathstyle.metrics.sup2; // sigma14
        }
        // scriptspace is a font-size-independent size, so scale it
        // appropriately @revisit: do we really need to do this scaling? It's in em...
        const multiplier =
            MATHSTYLES.textstyle.sizeMultiplier * mathstyle.sizeMultiplier;
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
            if (this.isSymbol) {
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
            this.caret = '';
        }
        return makeSpan([nucleus, supsubContainer], '', type);
    }

    attachLimits(
        context: Context,
        nucleus: Span,
        nucleusShift: number,
        slant: number
    ): Span {
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
     */
    bind(context: Context, span: Span): Span {
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
     */
    makeSpan(context: Context, body: string | Span | Span[]): Span {
        // Ensure that the atom type is a valid Span type, or use ''
        console.assert(isSpanType(this.type));
        const type: SpanType =
            this.type === 'textord'
                ? 'mord'
                : isSpanType(this.type)
                ? this.type
                : '';
        const result = makeSpan(body, '', type);

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
        style.letterShapeStyle = context.letterShapeStyle;
        result.applyStyle(style);

        // Apply size correction
        const size = style?.fontSize ? style.fontSize : 'size5';
        if (size !== context.parentSize) {
            result.classes += ' sizing reset-' + context.parentSize;
            result.classes += ' ' + size;
        } else if (context.parentSize !== context.size) {
            result.classes += ' sizing reset-' + context.parentSize;
            result.classes += ' ' + context.size;
        }
        result.maxFontSize = Math.max(
            result.maxFontSize,
            context.mathstyle.sizeMultiplier || 1.0
        );

        // Set other attributes

        if (this.mode === 'text') result.classes += ' ML__text';
        if (context.mathstyle.isTight()) result.isTight = true;
        // The italic correction applies only in math mode
        if (this.mode !== 'math') result.italic = 0;
        result.setRight(result.italic); // Italic correction

        if (typeof context.opacity === 'number') {
            result.setStyle('opacity', context.opacity);
        }

        // To retrieve the atom from a span, for example when the span is clicked
        // on, attach a randomly generated ID to the span and associate it
        // with the atom.
        this.bind(context, result);
        if (this.caret) {
            // If this has a super/subscript, the caret will be attached
            // to the 'msubsup' atom, so no need to have it here.
            if (!this.superscript && !this.subscript) {
                result.caret = this.caret;
                this.caret = '';
                if (context.mathstyle.isTight()) result.isTight = true;
            }
        }
        return result;
    }
}

function makeID(context: Context): string {
    let result: string;
    if (context.atomIdsSettings) {
        if (typeof context.atomIdsSettings.seed === 'number') {
            result = context.atomIdsSettings.overrideID
                ? context.atomIdsSettings.overrideID
                : context.atomIdsSettings.seed.toString(36);
            context.atomIdsSettings.seed += 1;
        } else {
            result =
                Date.now().toString(36).slice(-2) +
                Math.floor(Math.random() * 0x186a0).toString(36);
        }
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
 * @param context
 * @param nucleus The base over and under which the atoms will
 * be placed.
 * @param nucleusShift The vertical shift of the nucleus from
 * the baseline.
 * @param slant For operators that have a slant, such as \int,
 * indicate by how much to horizontally offset the above and below atoms
 */
function makeLimitsStack(
    context: Context,
    nucleus: Span,
    nucleusShift: number,
    slant: number,
    above: Span,
    below: Span
): Span {
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

    let result: Span | null = null;

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
        result!.children[0].setLeft(-slant);
        result!.children[2].setLeft(slant);
    } else if (below && !above) {
        const top = spanHeight(nucleus) - nucleusShift;

        result = makeVlist(
            context,
            [FONTMETRICS.bigOpSpacing5, below, belowShift, nucleus],
            'top',
            top
        );

        // See comment above about slants
        result!.children[0].setLeft(-slant);
    } else if (!below && above) {
        const bottom = spanDepth(nucleus) + nucleusShift;

        result = makeVlist(
            context,
            [nucleus, aboveShift, above, FONTMETRICS.bigOpSpacing5],
            'bottom',
            bottom
        );

        // See comment above about slants
        result!.children[1].setLeft(slant);
    }

    return makeSpan(result, 'op-limits', 'mop');
}

/**
 * Return an atom suitable for use as the root of a formula.
 */

export function makeRoot(parseMode: ParseModePrivate, body: Atom[] = []): Atom {
    const result = new Atom(parseMode, 'root', body || []);
    if (
        isArray(result.body) &&
        (result.body.length === 0 || result.body[0].type !== 'first')
    ) {
        result.body!.unshift(new Atom('', 'first'));
    }
    return result;
}

export function isAtomArray(arg: string | Atom | Atom[]): arg is Atom[] {
    return isArray(arg);
}
