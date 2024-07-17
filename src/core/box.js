"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.makeSVGBox = exports.makeStruts = exports.coalesce = exports.Box = exports.atomsBoxType = exports.boxType = void 0;
var types_1 = require("../common/types");
var font_metrics_1 = require("./font-metrics");
var svg_box_1 = require("./svg-box");
var color_1 = require("./color");
var modes_utils_1 = require("./modes-utils");
function boxType(type) {
    if (!type)
        return undefined;
    var result = {
        mord: 'ord',
        mbin: 'bin',
        mop: 'op',
        mrel: 'rel',
        mopen: 'open',
        mclose: 'close',
        mpunct: 'punct',
        minner: 'inner',
        spacing: 'ignore',
        latex: 'latex',
        composition: 'inner',
        error: 'inner',
        placeholder: 'ord',
        supsub: 'ignore'
    }[type];
    return result;
}
exports.boxType = boxType;
function atomsBoxType(atoms) {
    if (atoms.length === 0)
        return 'ord';
    var first = boxType(atoms[0].type);
    var last = boxType(atoms[atoms.length - 1].type);
    if (first && first === last)
        return first;
    return 'ord';
}
exports.atomsBoxType = atomsBoxType;
function toString(arg1, arg2) {
    if (typeof arg1 === 'string')
        return arg1;
    if (typeof arg1 === 'number') {
        console.assert(Number.isFinite(arg1));
        var numValue = Math.ceil(1e2 * arg1) / 1e2;
        if (numValue === 0)
            return '0';
        return numValue.toString() + (arg2 !== null && arg2 !== void 0 ? arg2 : '');
    }
    return '';
}
//----------------------------------------------------------------------------
// BOX
//----------------------------------------------------------------------------
/**
 * A box is the most elementary element that can be rendered.
 * It is composed of an optional body of text and an optional list
 * of children (other boxes). Each box can be decorated with
 * CSS classes and style attributes.
 *
 * @param content the items 'contained' by this node
 * @param classes list of classes attributes associated with this node


 * @property  type - For example, `"latex"`, `"mrel"`, etc...
 * @property classes - A string of space separated CSS classes
 * associated with this element
 * @property cssId - A CSS ID assigned to this box (optional)
 * @property htmlData - data fields assigned to this box (optional)
 * @property children - An array, potentially empty, of boxes which
 * this box encloses
 * @property cssProperties - A set of key/value pairs specifying CSS properties
 * associated with this element.
 * @property height - The measurement from baseline to top, in em.
 * @property depth - The measurement from baseline to bottom, in em.
 */
var Box = /** @class */ (function () {
    function Box(content, options) {
        var _a, _b, _c, _d, _e;
        if (typeof content === 'number')
            this.value = String.fromCodePoint(content);
        else if (typeof content === 'string')
            this.value = content;
        else if ((0, types_1.isArray)(content))
            this.children = content.filter(function (x) { return x !== null; });
        else if (content && content instanceof Box)
            this.children = [content];
        if (this.children)
            for (var _i = 0, _f = this.children; _i < _f.length; _i++) {
                var child = _f[_i];
                child.parent = this;
            }
        this.type = (_a = options === null || options === void 0 ? void 0 : options.type) !== null && _a !== void 0 ? _a : 'ignore';
        this.isSelected = (options === null || options === void 0 ? void 0 : options.isSelected) === true;
        if (options === null || options === void 0 ? void 0 : options.caret)
            this.caret = options.caret;
        this.classes = (_b = options === null || options === void 0 ? void 0 : options.classes) !== null && _b !== void 0 ? _b : '';
        this.isTight = (_c = options === null || options === void 0 ? void 0 : options.isTight) !== null && _c !== void 0 ? _c : false;
        if (options === null || options === void 0 ? void 0 : options.attributes)
            this.attributes = options.attributes;
        var fontName = options === null || options === void 0 ? void 0 : options.fontFamily;
        if ((options === null || options === void 0 ? void 0 : options.style) && this.value) {
            // Note: getFont has the side effect of changing the
            // classes property of the box to account for the font.
            fontName =
                (_e = modes_utils_1.Mode.getFont((_d = options.mode) !== null && _d !== void 0 ? _d : 'math', this, __assign(__assign({ variant: 'normal' }, options.style), { letterShapeStyle: options.letterShapeStyle }))) !== null && _e !== void 0 ? _e : undefined;
        }
        fontName || (fontName = 'Main-Regular');
        this._height = 0;
        this._depth = 0;
        this._width = 0;
        this.hasExplicitWidth = false;
        this.skew = 0;
        this.italic = 0;
        this.maxFontSize = 0;
        this.scale = 1.0;
        if ((options === null || options === void 0 ? void 0 : options.maxFontSize) !== undefined)
            this.maxFontSize = options.maxFontSize;
        horizontalLayout(this, fontName);
    }
    Object.defineProperty(Box.prototype, "atomID", {
        set: function (id) {
            if (id === undefined || id.length === 0)
                return;
            this.id = id;
        },
        enumerable: false,
        configurable: true
    });
    Box.prototype.selected = function (isSelected) {
        if (this.isSelected === isSelected)
            return;
        this.isSelected = isSelected;
        if (this.children)
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                child.selected(isSelected);
            }
    };
    Box.prototype.setStyle = function (prop, value, unit) {
        // console.assert(
        //   prop !== 'height' || typeof value !== 'number' || value >= 0
        // );
        if (value === undefined)
            return;
        var v = toString(value, unit);
        if (v.length > 0) {
            if (!this.cssProperties)
                this.cssProperties = {};
            this.cssProperties[prop] = v;
        }
    };
    Box.prototype.setTop = function (top) {
        if (Number.isFinite(top) && Math.abs(top) > 1e-2) {
            if (!this.cssProperties)
                this.cssProperties = {};
            this.cssProperties.top = toString(top, 'em');
            this.height -= top;
            this.depth += top;
        }
    };
    Object.defineProperty(Box.prototype, "left", {
        get: function () {
            var _a;
            if ((_a = this.cssProperties) === null || _a === void 0 ? void 0 : _a['margin-left'])
                return Number.parseFloat(this.cssProperties['margin-left']);
            return 0;
        },
        set: function (value) {
            if (!Number.isFinite(value))
                return;
            if (value === 0) {
                if (this.cssProperties)
                    delete this.cssProperties['margin-left'];
            }
            else {
                if (!this.cssProperties)
                    this.cssProperties = {};
                this.cssProperties['margin-left'] = toString(value, 'em');
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "right", {
        set: function (value) {
            if (!Number.isFinite(value))
                return;
            if (value === 0) {
                if (this.cssProperties)
                    delete this.cssProperties['margin-right'];
            }
            else {
                if (!this.cssProperties)
                    this.cssProperties = {};
                this.cssProperties['margin-right'] = toString(value, 'em');
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "bottom", {
        set: function (value) {
            if (!Number.isFinite(value))
                return;
            if (value === 0) {
                if (this.cssProperties)
                    delete this.cssProperties['margin-bottom'];
            }
            else {
                if (!this.cssProperties)
                    this.cssProperties = {};
                this.cssProperties['margin-bottom'] = toString(value, 'em');
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "width", {
        get: function () {
            return this._width * this.scale;
        },
        set: function (value) {
            this._width = value;
            this.hasExplicitWidth = true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "softWidth", {
        set: function (_value) {
            // See Limitation of Current Implementation
            // The width cannot be accurately calculated today because the interbox
            // spacing is not applied until later. So we can't set the width
            // accurately. Instead we rely on the CSS to lay out the boxes.
            // However we are still calculating the width, but setting it with
            // "softwidth" which means it's ignored. When we fix the limitation,
            // we can remove this method, and just call width = value.
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "height", {
        get: function () {
            return this._height * this.scale;
        },
        set: function (value) {
            this._height = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "depth", {
        get: function () {
            return this._depth * this.scale;
        },
        set: function (value) {
            this._depth = value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Apply the context (color, backgroundColor, size) to the box.
     */
    Box.prototype.wrap = function (context) {
        var parent = context.parent;
        // If we're at the root, nothing to do
        if (!parent)
            return this;
        if (context.isPhantom)
            this.setStyle('opacity', 0);
        //
        // Apply color changes to the box
        //
        var color = context.color;
        if (color && color !== parent.color)
            this.setStyle('color', color);
        var backgroundColor = context.backgroundColor;
        if (this.isSelected)
            backgroundColor = (0, color_1.highlight)(backgroundColor);
        if (backgroundColor && backgroundColor !== parent.backgroundColor) {
            this.setStyle('background-color', backgroundColor);
            this.setStyle('display', 'inline-block');
        }
        var scale = context.scalingFactor;
        this.scale = scale;
        this.skew *= scale;
        this.italic *= scale;
        return this;
    };
    /**
     * Generate the HTML markup to represent this box.
     */
    Box.prototype.toMarkup = function () {
        var _this = this;
        var _a, _b, _c, _d;
        var body = (_a = this.value) !== null && _a !== void 0 ? _a : '';
        //
        // 1. Render the children
        //
        if (this.children)
            for (var _i = 0, _e = this.children; _i < _e.length; _i++) {
                var box = _e[_i];
                body += box.toMarkup();
            }
        //
        // 2. SVG
        //
        // If there is some SVG markup associated with this box,
        // include it now
        //
        var svgMarkup = '';
        if (this.svgBody)
            svgMarkup = (0, svg_box_1.svgBodyToMarkup)(this.svgBody);
        else if (this.svgOverlay) {
            svgMarkup = '<span style="';
            svgMarkup += 'display: inline-block;';
            svgMarkup += "height:".concat(Math.floor(100 * (this.height + this.depth)) / 100, "em;");
            svgMarkup += "vertical-align:".concat(Math.floor(100 * this.depth) / 100, "em;");
            svgMarkup += '">';
            svgMarkup += body;
            svgMarkup += '</span>';
            svgMarkup += '<svg style="position:absolute;overflow:visible;';
            svgMarkup += "height:".concat(Math.floor(100 * (this.height + this.depth)) / 100, "em;");
            var padding = (_b = this.cssProperties) === null || _b === void 0 ? void 0 : _b.padding;
            if (padding) {
                svgMarkup += "top:".concat(padding, ";");
                svgMarkup += "left:".concat(padding, ";");
                svgMarkup += "width:calc(100% - 2 * ".concat(padding, " );");
            }
            else
                svgMarkup += 'top:0;left:0;width:100%;';
            svgMarkup += 'z-index:2;';
            svgMarkup += '"';
            if (this.svgStyle)
                svgMarkup += this.svgStyle;
            svgMarkup += " viewBox=\"0 0 ".concat(Math.floor(100 * this.width) / 100, " ").concat(Math.floor(100 * (this.height + this.depth)) / 100, "\"");
            svgMarkup += ">".concat(this.svgOverlay, "</svg>");
        }
        //
        // 3. Markup for props
        //
        var props = '';
        //
        // 3.1 Classes
        //
        var classes = this.classes.split(' ');
        classes.push((_c = {
            latex: 'ML__raw-latex',
            placeholder: 'ML__placeholder',
            error: 'ML__error'
        }[this.type]) !== null && _c !== void 0 ? _c : '');
        if (this.caret === 'latex')
            classes.push('ML__latex-caret');
        if (this.isSelected)
            classes.push('ML__selected');
        // Remove duplicate and empty classes
        var classList = classes.length === 1
            ? classes[0]
            : classes
                .filter(function (x, e, a) { return x.length > 0 && a.indexOf(x) === e; })
                .join(' ');
        if (classList.length > 0)
            props += " class=\"".concat(classList, "\"");
        //
        // 3.2 Id
        //
        if (this.id)
            props += " data-atom-id=".concat(this.id);
        // A (HTML5) CSS id may not contain a space
        if (this.cssId)
            props += " id=\"".concat(this.cssId.replace(/ /g, '-'), "\" ");
        //
        // 3.3 Attributes
        //
        if (this.attributes) {
            props +=
                ' ' +
                    Object.keys(this.attributes)
                        .map(function (x) { return "".concat(x, "=\"").concat(_this.attributes[x], "\""); })
                        .join(' ');
        }
        if (this.htmlData) {
            var entries = this.htmlData.split(',');
            for (var _f = 0, entries_1 = entries; _f < entries_1.length; _f++) {
                var entry = entries_1[_f];
                var matched = entry.match(/([^=]+)=(.+$)/);
                if (matched) {
                    var key = matched[1].trim().replace(/ /g, '-');
                    if (key)
                        props += " data-".concat(key, "=\"").concat(matched[2], "\" ");
                }
                else {
                    var key = entry.trim().replace(/ /g, '-');
                    if (key)
                        props += " data-".concat(key, " ");
                }
            }
        }
        //
        // 3.4 Styles
        //
        var cssProps = (_d = this.cssProperties) !== null && _d !== void 0 ? _d : {};
        if (this.hasExplicitWidth) {
            // console.assert(cssProps.width === undefined);
            if (cssProps.width === undefined)
                cssProps.width = "".concat(Math.ceil(this._width * 100) / 100, "em");
            // cssProps['height'] = `${Math.round(this.height * 100) / 100}em`;
        }
        var styles = Object.keys(cssProps).map(function (x) { return "".concat(x, ":").concat(cssProps[x]); });
        if (this.scale !== undefined &&
            this.scale !== 1.0 &&
            (body.length > 0 || svgMarkup.length > 0))
            styles.push("font-size: ".concat(Math.ceil(this.scale * 10000) / 100, "%"));
        if (this.htmlStyle) {
            var entries = this.htmlStyle.split(';');
            var styleString = '';
            for (var _g = 0, entries_2 = entries; _g < entries_2.length; _g++) {
                var entry = entries_2[_g];
                var matched = entry.match(/([^=]+):(.+$)/);
                if (matched) {
                    var key = matched[1].trim().replace(/ /g, '-');
                    if (key)
                        styleString += "".concat(key, ":").concat(matched[2], ";");
                }
            }
            if (styleString)
                props += " style=\"".concat(styleString, "\"");
        }
        if (styles.length > 0)
            props += " style=\"".concat(styles.join(';'), "\"");
        //
        // 4. Tag markup
        //
        var result = '';
        if (props.length > 0 || svgMarkup.length > 0)
            result = "<span".concat(props, ">").concat(body).concat(svgMarkup, "</span>");
        else
            result = body;
        //
        // 5. Add markup for the caret
        //
        if (this.caret === 'text')
            result += '<span class="ML__text-caret"></span>';
        else if (this.caret === 'math')
            result += '<span class="ML__caret"></span>';
        return result;
    };
    /**
     * Can this box be coalesced with 'box'?
     * This is used to 'coalesce' (i.e. group together) a series of boxes that are
     * identical except for their value, and to avoid generating redundant boxes.
     * That is: '12' ->
     *      "<span class='crm'>12</span>"
     * rather than:
     *      "<span class='crm'>1</span><span class='crm'>2</span>"
     */
    Box.prototype.tryCoalesceWith = function (box) {
        // Don't coalesce if the types are different
        // if (this.type !== box.type) return false;
        // Only coalesce some types
        // if (
        //   !/ML__text/.test(this.classes) &&
        //   !['ord', 'bin', 'rel'].includes(this.type)
        // )
        //   return false;
        // Don't coalesce if some of the content is SVG
        if (this.svgBody || !this.value)
            return false;
        if (box.svgBody || !box.value)
            return false;
        // If this box or the candidate box have children, we can't
        // coalesce them, but we'll try to coalesce their children
        var hasChildren = this.children && this.children.length > 0;
        var boxHasChildren = box.children && box.children.length > 0;
        if (hasChildren || boxHasChildren)
            return false;
        if (box.cssProperties || this.cssProperties) {
            // If it contains unmergable properties, bail
            for (var _i = 0, _a = [
                'border',
                'border-left',
                'border-right',
                'border-right-width',
                'left',
                'margin',
                'margin-left',
                'margin-right',
                'padding',
                'position',
                'width',
            ]; _i < _a.length; _i++) {
                var prop = _a[_i];
                if (box.cssProperties && prop in box.cssProperties)
                    return false;
                if (this.cssProperties && prop in this.cssProperties)
                    return false;
            }
        }
        // If they have a different number of styles, can't coalesce
        var thisStyleCount = this.cssProperties
            ? Object.keys(this.cssProperties).length
            : 0;
        var boxStyleCount = box.cssProperties
            ? Object.keys(box.cssProperties).length
            : 0;
        if (thisStyleCount !== boxStyleCount)
            return false;
        // If the styles are different, can't coalesce
        if (thisStyleCount > 0) {
            for (var _b = 0, _c = Object.keys(this.cssProperties); _b < _c.length; _b++) {
                var prop = _c[_b];
                if (this.cssProperties[prop] !== box.cssProperties[prop])
                    return false;
            }
        }
        // For the purpose of our comparison,
        // any 'empty' classes (whitespace)
        var classes = this.classes.trim().replace(/\s+/g, ' ').split(' ');
        var boxClasses = box.classes.trim().replace(/\s+/g, ' ').split(' ');
        // If they have a different number of classes, can't coalesce
        if (classes.length !== boxClasses.length)
            return false;
        // OK, let's do the more expensive comparison now.
        // If they have different classes, can't coalesce
        classes.sort();
        boxClasses.sort();
        for (var _d = 0, _e = classes.entries(); _d < _e.length; _d++) {
            var _f = _e[_d], i = _f[0], class_ = _f[1];
            // Don't coalesce vertical separators
            // (used in column formating with {l||r} for example
            if (class_ === 'ML__vertical-separator')
                return false;
            if (class_ !== boxClasses[i])
                return false;
        }
        // OK, the attributes of those boxes are compatible.
        // Merge box into this
        this.value += box.value;
        this.height = Math.max(this.height, box.height);
        this.depth = Math.max(this.depth, box.depth);
        this._width = this._width + box._width;
        this.maxFontSize = Math.max(this.maxFontSize, box.maxFontSize);
        // The italic correction for the coalesced boxes is the
        // italic correction of the last box.
        this.italic = box.italic;
        return true;
    };
    return Box;
}());
exports.Box = Box;
/**
 * Attempts to coalesce (merge) boxes, for example consecutive text boxes.
 * Return a new tree with coalesced boxes.
 *
 */
function coalesceRecursive(boxes) {
    if (!boxes || boxes.length === 0)
        return [];
    boxes[0].children = coalesceRecursive(boxes[0].children);
    var result = [boxes[0]];
    for (var i = 1; i < boxes.length; i++) {
        if (!result[result.length - 1].tryCoalesceWith(boxes[i])) {
            boxes[i].children = coalesceRecursive(boxes[i].children);
            result.push(boxes[i]);
        }
    }
    return result;
}
function coalesce(box) {
    if (box.children)
        box.children = coalesceRecursive(box.children);
    return box;
}
exports.coalesce = coalesce;
//----------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------
function makeStruts(content, options) {
    if (!content)
        return new Box(null, options);
    var topStrut = new Box(null, { classes: 'ML__strut', type: 'ignore' });
    topStrut.setStyle('height', Math.max(0, content.height), 'em');
    var struts = [topStrut];
    if (content.depth !== 0) {
        var bottomStrut = new Box(null, {
            classes: 'ML__strut--bottom',
            type: 'ignore'
        });
        bottomStrut.setStyle('height', content.height + content.depth, 'em');
        bottomStrut.setStyle('vertical-align', -content.depth, 'em');
        struts.push(bottomStrut);
    }
    struts.push(content);
    return new Box(struts, __assign(__assign({}, options), { type: 'lift' }));
}
exports.makeStruts = makeStruts;
/**
 * Create a box that consist of a (stretchy) SVG element
 */
function makeSVGBox(svgBodyName) {
    var height = (0, svg_box_1.svgBodyHeight)(svgBodyName) / 2;
    var box = new Box(null, { maxFontSize: 0 });
    box.height = height + 0.166;
    box.depth = height - 0.166; // @todo ??? that doesn't seem right
    box.svgBody = svgBodyName;
    return box;
}
exports.makeSVGBox = makeSVGBox;
function horizontalLayout(box, fontName) {
    var _a;
    //
    // Fixed width (and height) characters from "latex mode"
    //
    if (box.type === 'latex') {
        box.height = 0.9;
        box.depth = 0.2;
        box._width = 1.0;
        return;
    }
    //
    // A regular symbol
    //
    if (box.value) {
        // Get the metrics information
        box.height = -Infinity;
        box.depth = -Infinity;
        box._width = 0;
        box.skew = -Infinity;
        box.italic = -Infinity;
        // @revisit: when this.value has more than one char it can be for
        // a string like "cos", but sometimes it can be a multi-code-point grapheme. Maybe need a getStringMetrics()?
        for (var i = 0; i < box.value.length; i++) {
            var metrics = (0, font_metrics_1.getCharacterMetrics)(box.value.codePointAt(i), fontName);
            box.height = Math.max(box.height, metrics.height);
            box.depth = Math.max(box.depth, metrics.depth);
            box._width += metrics.width;
            box.skew = metrics.skew;
            box.italic = metrics.italic;
        }
        return;
    }
    //
    // A sequence of boxes
    //
    if (box.children && box.children.length > 0) {
        var height = -Infinity;
        var depth = -Infinity;
        var maxFontSize = 0;
        for (var _i = 0, _b = box.children; _i < _b.length; _i++) {
            var child = _b[_i];
            if (child.height > height)
                height = child.height;
            if (child.depth > depth)
                depth = child.depth;
            maxFontSize = Math.max(maxFontSize, (_a = child.maxFontSize) !== null && _a !== void 0 ? _a : 0);
        }
        box.height = height;
        box.depth = depth;
        box._width = box.children.reduce(function (acc, x) { return acc + x.width; }, 0);
        box.maxFontSize = maxFontSize;
    }
}
