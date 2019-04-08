
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
 * @property {number} opacity
 * @property {number} size
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

        this.mathstyle = Mathstyle.toMathstyle(from.mathstyle || 'displaystyle');
        this.size = from.size || 'size5';   // medium size

        this.parentMathstyle = from.parentMathstyle || this.mathstyle;
        this.parentSize = from.parentSize || this.size;

        this.opacity = from.opacity;
    }

    /**
     * Returns a new context with the same properties as 'this'.
     * @return {Context}
     * @memberof Context
     * @instance
     * @private
     */
    clone(override) {
        const result = new Context(this);
        result.parentMathstyle = this.mathstyle;
        result.parentSize = this.size;
        result.macros = this.macros;
        if (override) {
            // `'auto'` (or undefined) to indicate that the mathstyle should in
            // fact not be changed. This is used when specifying the mathstyle 
            // for some environments.
            if (override.mathstyle === 'auto' || !override.mathstyle) {
                delete override.mathstyle;
            }
            Object.assign(result, override);
            if (typeof override.mathstyle === 'string') {
                result.mathstyle = Mathstyle.toMathstyle(override.mathstyle);
            }
        }
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
    cramp() {
        return this.clone({'mathstyle': this.mathstyle.cramp()});
    }
    sup() {
        return this.clone({'mathstyle': this.mathstyle.sup()});
    }
    sub() {
        return this.clone({'mathstyle': this.mathstyle.sup()});
    }
}

export default {
    Context
}
