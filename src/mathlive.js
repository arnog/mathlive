
/**
 * 
 * The functions in this module are the main entry points to the MathLive 
 * public API.
 * 
 * To invoke these functions, use the global MathLive object. For example:
 * ```javascript
 * const markup = MathLive.toMarkup('e^{i\\pi}+1=0');
 * ```
 * 
 * @module mathlive
 */

define([
    'mathlive/core/lexer', 
    'mathlive/core/mathAtom', 
    'mathlive/core/parser', 
    'mathlive/core/span', 
    'mathlive/editor/editor-mathfield',
    'mathlive/addons/auto-render',
    ], 
    function(Lexer, MathAtom, ParserModule, Span, MathField, AutoRender) {

/**
 * Convert a LaTeX string to a string of HTML markup.
 * 
 * @param {string} text A string of valid LaTeX. It does not have to start 
 * with a mode token (i.e. `$$` or `\(`).
 * @param {string} displayMode If `'displaystyle'` the "display" mode of TeX
 * is used to typeset the formula. Most appropriate for formulas that are 
 * displayed in a standalone block. If `'textstyle'` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline" 
 * with other text.
 * @param {string} [format='html'] For debugging purposes, this function 
 * can also return a text representation of internal data structures
 * used to construct the markup. Valid values include `'mathlist'` and `'span'`
 * @function module:mathlive#latexToMarkup
 */
function toMarkup(text, mathstyle, format) {
    mathstyle = mathstyle || 'displaystyle'
    //
    // 1. Tokenize the text
    //
    const tokens = Lexer.tokenize(text);

    //
    // 2. Parse each token in the formula
    //    Turn the list of tokens in the formula into
    //    a tree of high-level MathAtom, e.g. 'genfrac'.
    //

    const mathlist = ParserModule.parseTokens(tokens);

    if (format === 'mathlist') return mathlist;



    //
    // 3. Transform the math atoms into elementary spans
    //    for example from genfrac to vlist.
    //
    let spans = MathAtom.decompose({mathstyle: mathstyle}, mathlist);


    // 
    // 4. Simplify by coalescing adjacent nodes
    //    for example, from <span>1</span><span>2</span> 
    //    to <span>12</span>
    //
    spans = Span.coalesce(spans);

    if (format === 'span') return spans;

    //
    // 5. Wrap the expression with struts
    //
    const base = Span.makeSpan(spans, 'ML__base');

    const topStrut = Span.makeSpan('', 'ML__strut');
    topStrut.setStyle('height', base.height, 'em');
    const bottomStrut = Span.makeSpan('', 'ML__strut ML__bottom');
    bottomStrut.setStyle('height', base.height + base.depth, 'em');
    bottomStrut.setStyle('vertical-align', -base.depth, 'em');
    const wrapper = Span.makeSpan([topStrut, bottomStrut, base], 'ML__mathlive');


    // 
    // 6. Generate markup
    //

    return wrapper.toMarkup();
}


/**
 * Convert a DOM element into an editable math field.
 * 
 * @param {Element|string} element An HTML DOM element, for example as obtained 
 * by `.getElementById()` or a string representing the ID of a DOM element.
 * @param {Object} [config] See `MathLive.config()` for details
 * @function module:mathlive#makeMathField
 */
function makeMathField(element, config) {
    if (!MathField) {
        console.log('The MathField module is not loaded.');
        return null;
    }
    return new MathField.MathField(element, config)
}

/**
 * 
 * @function module:mathlive#latexToSpeakableText
 */
function toSpeakableText() {
    if (!MathAtom.toSpeakableText) {
        console.log('The SpokenText module is not loaded.');
        return;
    }
    MathAtom.toSpeakableText();
}

/**
 * Transform all the elements in the document body that contain LaTeX code 
 * into typeset math.
 * **See:** {@tutorial USAGE_GUIDE}
 * 
 * @param {Object} options See `renderMathInElement` for details
 * @function module:mathlive#renderMathInDocument
 */
function renderMathInDocument(options) {
    if (!AutoRender) {
        console.log('The AutoRender module is not loaded.');
        return;
    }
    AutoRender.renderMathInElement(document.body, options, toMarkup);
}

/**
 * Transform all the children of element, recursively, that contain LaTeX code 
 * into typeset math.
 * **See:** {@tutorial USAGE_GUIDE}
 * 
 * @param {Element|string} element An HTML DOM element, or a string containing
 * the ID an element.
 * @param {Object} [options]
 * @param {string[]} options.skipTags an array of tag names whose content will
 *  not be scanned for delimiters
 * @param {string} [options.ignoreClass='tex2jax_ignore'] a string used as a 
 * regular expression of class names of elements whose content will not be 
 * scanned for delimiters
 * @param {string} [options.processClass='tex2jax_process']   a string used as a
 * regular expression of class names of elements whose content **will** be 
 * scanned for delimiters,  even if their tag name or parent class name would 
 * have prevented them from doing so.
 * @param {boolean} [options.preserveOriginalContent=true] if true, store the 
 * original textual content of the element in a `data-original-content` 
 * attribute. This value can be accessed for example to restore the element to 
 * its original value:
 * ```javascript
 *      elem.innerHTML = elem.dataset.originalContent;
 * ```
 * @param {boolean} options.TeX.processEnvironments if false, math expression 
 * that start with `\begin{` will not automatically be rendered. (true by default)
 * @param {Array} options.TeX.delimiters.inline
 * @param {Array} options.TeX.delimiters.display `TeX.delimiters.display` arrays 
 * of delimiters that will trigger a render of the content in 'textstyle' or 
 * 'displaystyle', respectively.
 * @function module:mathlive#renderMathInElement
 */
function renderMathInElement(element, options) {
    if (!AutoRender) {
        console.log('The AutoRender module is not loaded.');
        return;
    }
    AutoRender.renderMathInElement(element, options, toMarkup);
}

return {
    latexToMarkup: toMarkup,
    latexToSpeakableText: toSpeakableText,
    makeMathField: makeMathField,
    renderMathInDocument: renderMathInDocument,
    renderMathInElement: renderMathInElement
}


})
