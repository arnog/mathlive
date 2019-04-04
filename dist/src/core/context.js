
import Mathstyle from './mathstyle.js';

/**
 * This class contains the rendering context of the current parse level.
 *
 * It also holds information about the parent context to handle scaling
 * adjustments.
 *
 * When a new scope is entered, a clone of the context is created with `.clone()`
 * so that any further changes remain local to the scope.
 *
 * A scope is defined for example by:
 * - an explicit group enclosed in braces `{...}`
 * - a semi-simple group enclosed in `\bgroup...\endgroup`
 * - an environment delimited by `\begin{<envname>}...\end{<envname>}`
 *
 * @property {string} mathstyle `'text'` (aka 'inline'), `'display'`,
 * `'script'` or `'scriptscript'`
 * @property {string} backgroundcolor
 * @property {string} color
 * @property {number} opacity
 * @property {number} size
 * @property {boolean} phantom
 * @property {boolean|object} generateID - If true, unique IDs should be 
 * generated for each span so they can be mapped back to an atom. 
 * Can also be an object with a `seed` field to generate a specific range of 
 * IDs. Optionally, if a `groupNumbers` property is set to true, an additional 
 * span will enclose strings of digits. This is used by read aloud to properly 
 * pronounce (and highlight) numbers in expressions.
 * @property {string} parentMathstyle
 * @property {number} parentSize
 * @property {object} macros A macros dictionary
 *
 * @class Context
 * @global
 * @private
 */
class Context {
    constructor(from) {
        this.macros = from.macros || {};
        this.generateID = from.generateID ? from.generateID : false;

        this.phantom = from.phantom;

        this.mathstyle = Mathstyle.toMathstyle(from.mathstyle || 'displaystyle');
        this.size = from.size || 'size5';   // medium size

        this.parentMathstyle = from.parentMathstyle || this.mathstyle;
        this.parentSize = from.parentSize || this.size;

        this.backgroundcolor = from.backgroundcolor;
        this.color = from.color;
        this.opacity = from.opacity;
        this.font = from.font;
    }

    /**
     * Returns a new context with the same properties as 'this'.
     * @return {Context}
     * @memberof Context
     * @instance
     * @private
     */
    clone() {
        const result = new Context(this);
        result.parentMathstyle = this.mathstyle;
        result.parentSize = this.size;
        result.macros = this.macros;
        return result;
    }
    /**
     * Create a new context, identical to this object, except for the given
     * property/value pair.
     * @param {string} property
     * @param {any} value
     * @return {Context}
     * @memberof Context
     * @instance
     * @private
     */
    cloneWith(property, value) {
        const result = this.clone();
        result[property] = value;
        return result;
    }
    /**
     * Change the mathstyle of this context
     * @param {string} value - `'auto'` to indicate that the mathstyle should in
     * fact not be changed. This is used when specifying the mathstyle for some
     * environments.
     * @memberof Context
     * @instance
     * @private
     */
    setMathstyle(value) {
        if (value && value !== 'auto') {
            this.mathstyle = Mathstyle.toMathstyle(value);
        }
    }
    /**
     * Return a clone context with the specified mathstyle
     * @param {string} value
     * @memberof Context
     * @instance
     * @private
     */
    withMathstyle(value) {
        const result = this.clone();
        result.setMathstyle(value);
        return result;
    }
    fontFamily(value) {
        const result = this.clone();
        result.font = value;
        return result;
    }
    cramp() {
        return this.cloneWith('mathstyle', this.mathstyle.cramp());
    }
    sup() {
        return this.cloneWith('mathstyle', this.mathstyle.sup());
    }
    sub() {
        return this.cloneWith('mathstyle', this.mathstyle.sup());
    }
    fracDen() {
        return this.cloneWith('mathstyle', this.mathstyle.fracDen());
    }
    fracNum() {
        return this.cloneWith('mathstyle', this.mathstyle.fracNum());
    }
    /**
     * Gets the CSS (foreground) color in effect
     * @return {string} An hexadecimal color string, e.g. "#cd0030", or `'transparent'`
     * @memberof Context
     * @instance
     * @private
     */
    getColor() {
        return this.phantom ? 'transparent' : this.color;
    }
    /**
     * Gets the CSS background color in effect
     * @return {string} An hexadecimal color string, e.g. "#cd0030", or `'transparent'`
     * @memberof Context
     * @instance
     * @private
     */
    getBackgroundColor() {
        return this.phantom ? 'transparent' : this.backgroundcolor;
    }
}

export default {
    Context
}
