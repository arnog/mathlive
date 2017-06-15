
define(['mathlive/core/mathstyle'], function(Mathstyle) {

/**
 * This class contains the rendering context of the current parse level. 
 * This includes:
 * - mathstyle ('text' (aka 'inline'), 'display', 'script' or 'scriptscript'
 * - color
 * - size
 * - font family
 * - font style
 * - generateID: if true, unique IDs shoudl be generated for each span
 * so they can be tracked by to an atom
 * 
 * It also holds information about the parent context to handle scaling 
 * adjustments.
 *
 * When a new scope is entered, a clone of the Context is created with .clone()
 * or .cloneWith() so that any further changes remain local to the scope.
 * Other functions creating a clone include mathstyle(), fontFamily(), sup(),
 * sub(), cramp(), etc...
 * 
 * A scope is defined by 
 * - an explicit groupe enclosed in braces {...)
 * - a semi-simple group enclosed in \bgroup...\endgroup
 * - an environment delimited by \begin{<envname>}...\end{<envname>}
 * @constructor
 */
function Context(data) {
    this.mathstyle = Mathstyle.toMathstyle(data.mathstyle);
    this.color = data.color;
    this.backgroundcolor = data.backgroundcolor;
    this.size = data.size;
    this.phantom = data.phantom;
    this.font = data.font;
    this.generateID = data.generateID;
    this.isSelected = data.isSelected;

    if (typeof data.parentMathstyle === 'undefined') {
        this.parentMathstyle = this.mathstyle;
    } else {
        this.parentMathstyle = data.parentMathstyle;
    }

    if (typeof data.parentSize === 'undefined') {
        this.parentSize = this.size;
    } else {
        this.parentSize = data.parentSize;
    }
}

/**
 * Returns a new context with the same properties as 'this'.
 * @memberof Context
 * @instance
 */
Context.prototype.clone = function() {
    const result = new Context(this);
    result.parentMathstyle = this.mathstyle;
    result.parentSize = this.size;
    return result;
}


/**
 * Create a new context with the given property.
 * @memberof Context
 * @instance
 */
Context.prototype.cloneWith = function(property, value) {
    const result = this.clone();
    result[property] = value;
    return result;
}


/**
 * Change the mathstyle of this context
 * @memberof Context
 * @instance
 */
Context.prototype.setMathstyle = function(value) {
    // The special value 'auto' is used to indicate
    // that the mathstyle should in fact not be changed
    // This is used when specifying the mathstyle for
    // some environments, for example.
    if (value && value !== 'auto') {
        this.mathstyle = Mathstyle.toMathstyle(value);
    }
}

/**
 * Return a clone context with the specified mathstyle
 * @memberof Context
 * @instance
 */
Context.prototype.withMathstyle = function(value) {
    const result = this.clone();
    result.setMathstyle(value);
    return result;
}

/**
 * Return a clone context with the specified mathstyle
 * @memberof Context
 * @instance
 */
Context.prototype.withIsSelected = function(/* value */) {
    const result = this.clone();
    // if (!result.isSelected) {
    //     result.isSelected = value;
    // }
    // // result.isSelected = value || result.isSelected;
    return result;
}

Context.prototype.fontFamily = function(value) {
    const result = this.clone();
    result.font = value;
    return result;
}


Context.prototype.cramp = function() {
    return this.cloneWith('mathstyle', this.mathstyle.cramp());
}

Context.prototype.sup = function() {
    return this.cloneWith('mathstyle', this.mathstyle.sup());
}

Context.prototype.sub = function() {
    return this.cloneWith('mathstyle', this.mathstyle.sup());
}

Context.prototype.fracDen = function() {
    return this.cloneWith('mathstyle', this.mathstyle.fracDen());
}

Context.prototype.fracNum = function() {
    return this.cloneWith('mathstyle', this.mathstyle.fracNum());
}


/**
 * Gets the CSS color of this context.
 */
Context.prototype.getColor = function() {
    if (this.phantom) return 'transparent';
    return this.color;
}

/**
 * Gets the CSS background color of this context
 */
Context.prototype.getBackgroundColor = function() {
    if (this.phantom) return 'transparent';
    return this.backgroundcolor;
}


return {
    Context: Context
    }
});