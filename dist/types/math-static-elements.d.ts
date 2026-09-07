/* 0.110.0 *//**
 * Static rendering web components for MathLive.
 *
 * These components provide lightweight rendering of mathematical expressions
 * without the editing capabilities of the full MathfieldElement.
 *
 * @module math-static-elements
 */
/**
 * Format types supported by static elements
 */
export type StaticElementFormat = 'latex' | 'ascii-math' | 'math-json';
/**
 * Base class for static math rendering elements
 */
declare abstract class MathStaticElement extends HTMLElement {
    private _shadowRoot;
    private _contentSlot;
    private _renderContainer;
    private _errorFallback;
    private _mathMLContainer?;
    private _observer?;
    private _hasRendered;
    constructor();
    /**
     * Get the default mathstyle for this element type
     */
    protected abstract getDefaultMathstyle(): 'textstyle' | 'displaystyle';
    /**
     * Get the default display CSS value for this element type
     */
    protected abstract getDefaultDisplay(): string;
    /**
     * Observed attributes that trigger re-rendering
     */
    static get observedAttributes(): string[];
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Handle keyboard navigation (accessibility enhancement)
     */
    private _handleKeydown;
    /**
     * The rendering mode: 'textstyle' or 'displaystyle'
     */
    get mode(): 'textstyle' | 'displaystyle';
    set mode(value: 'textstyle' | 'displaystyle');
    /**
     * The input format: 'latex', 'ascii-math', or 'math-json'
     */
    get format(): StaticElementFormat;
    set format(value: StaticElementFormat);
    /**
     * Letter shape style option
     */
    get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright' | undefined;
    set letterShapeStyle(value: 'auto' | 'tex' | 'iso' | 'french' | 'upright' | undefined);
    /**
     * Macros to use for rendering
     */
    get macros(): string | undefined;
    set macros(value: string | undefined);
    /**
     * Minimum font scale
     */
    get minFontScale(): number | undefined;
    set minFontScale(value: number | undefined);
    /**
     * Maximum matrix columns
     */
    get maxMatrixCols(): number | undefined;
    set maxMatrixCols(value: number | undefined);
    /**
     * Manually trigger a re-render of the content
     */
    render(): void;
    /**
     * Update accessibility features (ARIA labels and MathML)
     */
    private _updateAccessibility;
    /**
     * Add hidden MathML for screen readers (accessibility enhancement)
     */
    private _addMathML;
    /**
     * Remove MathML container
     */
    private _removeMathML;
}
/**
 * `<math-span>` web component for inline mathematical expressions.
 *
 * Renders mathematical content inline using textstyle by default.
 *
 * @example
 * ```html
 * <math-span>x^2 + y^2 = z^2</math-span>
 * <math-span format="ascii-math">x^2 + y^2</math-span>
 * <math-span mode="displaystyle">\\sum_{i=1}^n i</math-span>
 * ```
 *
 * @event render - Fired when content is successfully rendered
 * @event render-error - Fired when rendering fails
 */
export declare class MathSpanElement extends MathStaticElement {
    protected getDefaultMathstyle(): 'textstyle' | 'displaystyle';
    protected getDefaultDisplay(): string;
}
/**
 * `<math-div>` web component for block-level mathematical expressions.
 *
 * Renders mathematical content as a block element using displaystyle by default.
 *
 * @example
 * ```html
 * <math-div>\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}</math-div>
 * <math-div format="ascii-math">int_0^oo e^(-x^2) dx</math-div>
 * <math-div mode="textstyle">x + y</math-div>
 * ```
 *
 * @event render - Fired when content is successfully rendered
 * @event render-error - Fired when rendering fails
 */
export declare class MathDivElement extends MathStaticElement {
    protected getDefaultMathstyle(): 'textstyle' | 'displaystyle';
    protected getDefaultDisplay(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        'math-span': MathSpanElement;
        'math-div': MathDivElement;
    }
}
export {};
