/**
 * Static rendering web components for MathLive.
 *
 * These components provide lightweight rendering of mathematical expressions
 * without the editing capabilities of the full MathfieldElement.
 *
 * @module math-static-elements
 */

import {
  convertLatexToMarkup,
  convertAsciiMathToLatex,
  convertLatexToSpeakableText,
  convertLatexToMathMl,
} from './mathlive-ssr';
import { mathJsonToLatex } from '../formats/math-json-to-latex';
import type { LayoutOptions } from './options';
import type { Expression } from './core-types';
import { getStylesheet, getStylesheetContent } from '../common/stylesheet';
import { loadFonts } from '../core/fonts';
import { getStaticCopyData } from '../common/static-copy';

/**
 * Format types supported by static elements
 */
export type StaticElementFormat = 'latex' | 'ascii-math' | 'math-json';

/**
 * Global font loading state (performance optimization)
 * Ensures fonts are loaded only once across all static elements
 */
let fontsLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

function ensureFontsLoaded(): void {
  if (fontsLoaded) return;

  if (!fontLoadPromise) {
    fontLoadPromise = loadFonts().then(() => {
      fontsLoaded = true;
    });
  }
}

/**
 * Convert the content of a static element to LaTeX
 */
function convertContentToLatex(
  content: string,
  format: StaticElementFormat
): string {
  if (format === 'ascii-math') return convertAsciiMathToLatex(content);
  if (format === 'math-json')
    return mathJsonToLatex(JSON.parse(content) as Expression);
  return content;
}

/**
 * The LaTeX of the static elements, so that it is not converted again on
 * each copy
 */
const gLatexCache = new WeakMap<
  MathStaticElement,
  { content: string; format: StaticElementFormat; latex: string }
>();

/**
 * The LaTeX source of a static element, as put on the clipboard. If the
 * content cannot be converted (e.g. invalid MathJSON, or MathJSON without the
 * Compute Engine), it is returned as is.
 */
function getElementLatex(element: MathStaticElement): string {
  const content = element.textContent?.trim() ?? '';
  const format = element.format;
  const cached = gLatexCache.get(element);
  if (cached?.content === content && cached.format === format)
    return cached.latex;

  let latex: string;
  try {
    latex = convertContentToLatex(content, format) || content;
  } catch {
    latex = content;
  }
  gLatexCache.set(element, { content, format, latex });
  return latex;
}

/**
 * The `copy` event is dispatched to the focused element (or the body), not to
 * the elements in the selection, so a single listener is installed on the
 * document while it contains at least one connected static element.
 */
const gConnectedElements = new Map<Document, Set<MathStaticElement>>();

function onDocumentCopy(event: ClipboardEvent): void {
  if (event.defaultPrevented || !event.clipboardData) return;

  // Leave copy from editable content (including `<math-field>`) alone
  const path = event.composedPath();
  const target = path[0];
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable) ||
    path.some(
      (node) => node instanceof Element && node.tagName === 'MATH-FIELD'
    )
  )
    return;

  const doc = event.currentTarget as Document;
  const elements = gConnectedElements.get(doc);
  if (!elements) return;

  const data = getStaticCopyData(doc, [...elements], (element) => ({
    latex: getElementLatex(element as MathStaticElement),
    display: element instanceof MathDivElement,
  }));
  if (!data) return;

  event.clipboardData.setData('text/plain', data.text);
  if (data.html !== undefined)
    event.clipboardData.setData('text/html', data.html);
  event.preventDefault();
}

function registerElement(element: MathStaticElement): void {
  const doc = element.ownerDocument;
  let elements = gConnectedElements.get(doc);
  if (!elements) {
    elements = new Set();
    gConnectedElements.set(doc, elements);
    doc.addEventListener('copy', onDocumentCopy);
  }
  elements.add(element);
}

function unregisterElement(element: MathStaticElement): void {
  const doc = element.ownerDocument;
  const elements = gConnectedElements.get(doc);
  if (!elements) return;
  elements.delete(element);
  if (elements.size > 0) return;
  doc.removeEventListener('copy', onDocumentCopy);
  gConnectedElements.delete(doc);
}

/**
 * Base class for static math rendering elements
 */
abstract class MathStaticElement extends HTMLElement {
  private _shadowRoot: ShadowRoot;
  private _contentSlot: HTMLDivElement;
  private _renderContainer: HTMLDivElement;
  private _errorFallback: HTMLDivElement;
  private _mathMLContainer?: HTMLDivElement;
  private _observer?: IntersectionObserver;
  private _hasRendered = false;

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' })!;

    // Add stylesheets
    if ('adoptedStyleSheets' in this._shadowRoot) {
      (this._shadowRoot as any).adoptedStyleSheets = [
        getStylesheet('core'),
        getStylesheet('math-static-element'),
      ];
    } else {
      const styleElement = document.createElement('style');
      styleElement.textContent =
        getStylesheetContent('core') +
        getStylesheetContent('math-static-element');
      (this._shadowRoot as ShadowRoot).appendChild(styleElement);
    }

    // Create container structure
    this._contentSlot = document.createElement('div');
    this._contentSlot.style.display = 'none';
    this._contentSlot.setAttribute('part', 'content');

    this._renderContainer = document.createElement('div');
    this._renderContainer.setAttribute('part', 'render');
    this._renderContainer.setAttribute('aria-hidden', 'true');

    this._errorFallback = document.createElement('div');
    this._errorFallback.style.display = 'none';
    this._errorFallback.setAttribute('part', 'error');

    this._shadowRoot.appendChild(this._contentSlot);
    this._shadowRoot.appendChild(this._renderContainer);
    this._shadowRoot.appendChild(this._errorFallback);

    // Set up keyboard navigation if element becomes focusable
    this.addEventListener('keydown', this._handleKeydown.bind(this));
  }

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
  static get observedAttributes(): string[] {
    return [
      'mode',
      'format',
      'macros',
      'letter-shape-style',
      'min-font-scale',
      'max-matrix-cols',
    ];
  }

  connectedCallback(): void {
    // Lazy load fonts globally (performance optimization)
    ensureFontsLoaded();

    registerElement(this);

    // Use Intersection Observer for deferred rendering (performance optimization)
    if ('IntersectionObserver' in window && !this._hasRendered) {
      this._observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !this._hasRendered) {
            this.render();
            this._observer?.disconnect();
          }
        },
        { rootMargin: '50px' }
      );

      this._observer.observe(this);
    } else {
      // Fallback for browsers without IntersectionObserver or already rendered
      this.render();
    }
  }

  disconnectedCallback(): void {
    this._observer?.disconnect();
    unregisterElement(this);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue !== newValue && this._hasRendered) this.render();
  }

  /**
   * Handle keyboard navigation (accessibility enhancement)
   */
  private _handleKeydown(event: KeyboardEvent): void {
    // Only handle keyboard events if element is focusable
    const tabindex = this.getAttribute('tabindex');
    if (tabindex === null) return;

    // Space or Enter to hear formula description
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      const description = this.getAttribute('aria-label');
      if (description && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(description);
        speechSynthesis.speak(utterance);
      }
    }
  }

  /**
   * The rendering mode: 'textstyle' or 'displaystyle'
   */
  get mode(): 'textstyle' | 'displaystyle' {
    const modeAttr = this.getAttribute('mode');
    if (modeAttr === 'textstyle' || modeAttr === 'displaystyle')
      return modeAttr;

    return this.getDefaultMathstyle();
  }

  set mode(value: 'textstyle' | 'displaystyle') {
    this.setAttribute('mode', value);
  }

  /**
   * The input format: 'latex', 'ascii-math', or 'math-json'
   */
  get format(): StaticElementFormat {
    const formatAttr = this.getAttribute('format');
    if (
      formatAttr === 'latex' ||
      formatAttr === 'ascii-math' ||
      formatAttr === 'math-json'
    )
      return formatAttr;

    return 'latex';
  }

  set format(value: StaticElementFormat) {
    this.setAttribute('format', value);
  }

  /**
   * Letter shape style option
   */
  get letterShapeStyle():
    | 'auto'
    | 'tex'
    | 'iso'
    | 'french'
    | 'upright'
    | undefined {
    const value = this.getAttribute('letter-shape-style');
    if (
      value === 'auto' ||
      value === 'tex' ||
      value === 'iso' ||
      value === 'french' ||
      value === 'upright'
    )
      return value;

    return undefined;
  }

  set letterShapeStyle(
    value: 'auto' | 'tex' | 'iso' | 'french' | 'upright' | undefined
  ) {
    if (value === undefined) this.removeAttribute('letter-shape-style');
    else this.setAttribute('letter-shape-style', value);
  }

  /**
   * Macros to use for rendering
   */
  get macros(): string | undefined {
    return this.getAttribute('macros') ?? undefined;
  }

  set macros(value: string | undefined) {
    if (value === undefined) this.removeAttribute('macros');
    else this.setAttribute('macros', value);
  }

  /**
   * Minimum font scale
   */
  get minFontScale(): number | undefined {
    const value = this.getAttribute('min-font-scale');
    return value ? parseFloat(value) : undefined;
  }

  set minFontScale(value: number | undefined) {
    if (value === undefined) this.removeAttribute('min-font-scale');
    else this.setAttribute('min-font-scale', String(value));
  }

  /**
   * Maximum matrix columns
   */
  get maxMatrixCols(): number | undefined {
    const value = this.getAttribute('max-matrix-cols');
    return value ? parseInt(value, 10) : undefined;
  }

  set maxMatrixCols(value: number | undefined) {
    if (value === undefined) this.removeAttribute('max-matrix-cols');
    else this.setAttribute('max-matrix-cols', String(value));
  }

  /**
   * Manually trigger a re-render of the content
   */
  render(): void {
    try {
      // Get the content to render
      const content = this.textContent?.trim() ?? '';

      if (!content) {
        this._renderContainer.innerHTML = '';
        this._errorFallback.style.display = 'none';
        this._renderContainer.style.display = 'none';
        this._removeMathML();
        return;
      }

      // Store original content for error fallback
      this._contentSlot.textContent = content;

      // Convert content based on format
      const format = this.format;
      const latex = convertContentToLatex(content, format);
      gLatexCache.set(this, { content, format, latex: latex || content });

      // Build render options
      const options: Partial<LayoutOptions> = {
        defaultMode: this.mode === 'displaystyle' ? 'math' : 'inline-math',
      };

      if (this.letterShapeStyle)
        options.letterShapeStyle = this.letterShapeStyle;

      if (this.macros) {
        try {
          options.macros = JSON.parse(this.macros);
        } catch (e) {
          console.warn('Invalid macros JSON:', e);
        }
      }

      if (this.minFontScale !== undefined)
        options.minFontScale = this.minFontScale;

      if (this.maxMatrixCols !== undefined)
        options.maxMatrixCols = this.maxMatrixCols;

      // Render the content
      const markup = convertLatexToMarkup(latex, options);

      // Update the DOM
      this._renderContainer.innerHTML = markup;
      this._renderContainer.style.display = this.getDefaultDisplay();
      this._errorFallback.style.display = 'none';

      // Add accessibility features
      this._updateAccessibility(latex);

      this._hasRendered = true;

      // Dispatch render event
      this.dispatchEvent(
        new CustomEvent('render', {
          bubbles: true,
          composed: true,
          detail: { format, content: latex },
        })
      );
    } catch (error) {
      // Show original content on error
      console.error('MathLive static element render error:', error);

      this._renderContainer.style.display = 'none';
      this._errorFallback.textContent = this.textContent ?? '';
      this._errorFallback.style.display = 'block';
      this._removeMathML();

      // Dispatch error event
      this.dispatchEvent(
        new CustomEvent('render-error', {
          bubbles: true,
          composed: true,
          detail: { error, content: this.textContent },
        })
      );
    }
  }

  /**
   * Update accessibility features (ARIA labels and MathML)
   */
  private _updateAccessibility(latex: string): void {
    // Only set ARIA label if user hasn't provided one
    if (!this.hasAttribute('aria-label')) {
      try {
        const speakableText = convertLatexToSpeakableText(latex);
        this.setAttribute('aria-label', speakableText);
      } catch (error) {
        console.warn('Could not generate speakable text:', error);
      }
    }

    // Set role to 'img' for math formulas
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');

    // Add MathML fallback for screen readers
    this._addMathML(latex);
  }

  /**
   * Add hidden MathML for screen readers (accessibility enhancement)
   */
  private _addMathML(latex: string): void {
    try {
      const mathML = convertLatexToMathMl(latex);

      if (!this._mathMLContainer) {
        this._mathMLContainer = document.createElement('div');
        this._mathMLContainer.style.position = 'absolute';
        this._mathMLContainer.style.webkitUserSelect = 'none';
        this._mathMLContainer.style.userSelect = 'none';
        this._mathMLContainer.style.width = '1px';
        this._mathMLContainer.style.height = '1px';
        this._mathMLContainer.style.overflow = 'hidden';
        this._mathMLContainer.style.clip = 'rect(0, 0, 0, 0)';
        this._mathMLContainer.setAttribute('aria-hidden', 'false');
        this._shadowRoot.appendChild(this._mathMLContainer);
      }

      // `convertLatexToMathMl()` returns the content of a MathML expression
      // (for example `<mrow>...</mrow>`), without the `<math>` root element.
      // The HTML parser only creates MathML elements for the descendants of a
      // `<math>` element. Without this root element, `<mrow>`, `<mfrac>`, etc.
      // are parsed as unknown HTML elements, not as MathML.
      this._mathMLContainer.innerHTML =
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
        mathML +
        '</math>';
    } catch (error) {
      console.warn('Could not generate MathML:', error);
    }
  }

  /**
   * Remove MathML container
   */
  private _removeMathML(): void {
    if (this._mathMLContainer) {
      this._mathMLContainer.remove();
      this._mathMLContainer = undefined;
    }
  }
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
 * The rendered formula can be selected. When copied on its own, its LaTeX
 * source is put on the clipboard. When copied with some surrounding text, each
 * `<math-span>` is replaced with its LaTeX source wrapped in `$...$` and each
 * `<math-div>` with its LaTeX source wrapped in `$$...$$`, and the styles that
 * the surrounding text gets from the style sheets of the page are not
 * included in the copied HTML. A partially selected element is copied in full. If the selection includes a `<math-field>`, the default copy
 * behavior is used.
 *
 * @event render - Fired when content is successfully rendered
 * @event render-error - Fired when rendering fails
 */
export class MathSpanElement extends MathStaticElement {
  protected getDefaultMathstyle(): 'textstyle' | 'displaystyle' {
    return 'textstyle';
  }

  protected getDefaultDisplay(): string {
    return 'inline-flex';
  }
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
export class MathDivElement extends MathStaticElement {
  protected getDefaultMathstyle(): 'textstyle' | 'displaystyle' {
    return 'displaystyle';
  }

  protected getDefaultDisplay(): string {
    return 'flex';
  }
}

/**
 * Register the custom elements if not already registered
 */
function registerStaticElements(): void {
  if (typeof window === 'undefined') return;

  if (!window.customElements?.get('math-span'))
    window.customElements?.define('math-span', MathSpanElement);

  if (!window.customElements?.get('math-div'))
    window.customElements?.define('math-div', MathDivElement);
}

// Auto-register on module load
registerStaticElements();

// Augment global types
declare global {
  interface HTMLElementTagNameMap {
    'math-span': MathSpanElement;
    'math-div': MathDivElement;
  }
}
