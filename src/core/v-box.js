"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.makeLimitsStack = exports.VBox = void 0;
var box_1 = require("./box");
// Computes the updated `children` list and the overall depth.
function getVListChildrenAndDepth(params) {
    if ('individualShift' in params) {
        var oldChildren = params.individualShift;
        var prevChild = oldChildren[0];
        if (prevChild == null)
            return [null, 0];
        var children = [prevChild];
        // Add in kerns to the list of params.children to get each element to be
        // shifted to the correct specified shift
        var depth = -prevChild.shift - prevChild.box.depth;
        var currPos = depth;
        for (var i = 1; i < oldChildren.length; i++) {
            var child = oldChildren[i];
            var diff = -child.shift - currPos - child.box.depth;
            var size = diff - (prevChild.box.height + prevChild.box.depth);
            currPos = currPos + diff;
            children.push(size);
            children.push(child);
            prevChild = child;
        }
        return [children, depth];
    }
    if ('top' in params) {
        // We always start at the bottom, so calculate the bottom by adding up
        // all the sizes
        var bottom = params.top;
        for (var _i = 0, _a = params.children; _i < _a.length; _i++) {
            var child = _a[_i];
            bottom -=
                typeof child === 'number' ? child : child.box.height + child.box.depth;
        }
        return [params.children, bottom];
    }
    else if ('bottom' in params)
        return [params.children, -params.bottom];
    else if ('firstBaseline' in params) {
        var firstChild = params.firstBaseline[0];
        if (typeof firstChild === 'number')
            throw new Error('First child must be an element.');
        return [params.firstBaseline, -firstChild.box.depth];
    }
    else if ('shift' in params) {
        var firstChild = params.children[0];
        if (typeof firstChild === 'number')
            throw new Error('First child must be an element.');
        return [params.children, -firstChild.box.depth - params.shift];
    }
    return [null, 0];
}
/**
 * Makes a vertical list by stacking elements and kerns on top of each other.
 * Allows for many different ways of specifying the positioning method.
 *
 * See VListParam documentation above.
 *
 * Return a single row if the stack is entirely above the baseline.
 * Otherwise return 2 rows, the second one representing depth below the baseline.
 * This is necessary to workaround a Safari... behavior (see vlist-s and vlist-t2)
 */
function makeRows(params) {
    var _a;
    var _b = getVListChildrenAndDepth(params), children = _b[0], depth = _b[1];
    if (!children)
        return [[], 0, 0];
    var pstrut = new box_1.Box(null, { classes: 'ML__pstrut' });
    // Create a strut that is taller than any list item. The strut is added to
    // each item, where it will determine the item's baseline. Since it has
    // `overflow:hidden`, the strut's top edge will sit on the item's line box's
    // top edge and the strut's bottom edge will sit on the item's baseline,
    // with no additional line-height spacing. This allows the item baseline to
    // be positioned precisely without worrying about font ascent and
    // line-height.
    var pstrutSize = 0;
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        if (typeof child !== 'number') {
            var box = child.box;
            pstrutSize = Math.max(pstrutSize, box.maxFontSize, box.height);
        }
    }
    pstrutSize += 2;
    pstrut.height = pstrutSize;
    pstrut.setStyle('height', pstrutSize, 'em');
    // Create a new list of actual children at the correct offsets
    var realChildren = [];
    var minPos = depth;
    var maxPos = depth;
    var currPos = depth;
    var width = 0;
    for (var _c = 0, children_2 = children; _c < children_2.length; _c++) {
        var child = children_2[_c];
        if (typeof child === 'number')
            currPos += child;
        else {
            var box = child.box;
            var classes = (_a = child.classes) !== null && _a !== void 0 ? _a : [];
            var childWrap = new box_1.Box([pstrut, box], {
                classes: classes.join(' '),
                style: child.style
            });
            box.setStyle('height', box.height + box.depth, 'em');
            box.setStyle('display', 'inline-block');
            childWrap.setStyle('top', -pstrutSize - currPos - box.depth, 'em');
            if (child.marginLeft)
                childWrap.setStyle('margin-left', child.marginLeft, 'em');
            if (child.marginRight)
                childWrap.setStyle('margin-right', child.marginRight, 'em');
            realChildren.push(childWrap);
            currPos += box.height + box.depth;
            width = Math.max(width, childWrap.width);
        }
        minPos = Math.min(minPos, currPos);
        maxPos = Math.max(maxPos, currPos);
    }
    realChildren.forEach(function (child) {
        child.softWidth = width;
    });
    // The vlist contents go in a table-cell with `vertical-align:bottom`.
    // This cell's bottom edge will determine the containing table's baseline
    // without overly expanding the containing line-box.
    var vlist = new box_1.Box(realChildren, { classes: 'ML__vlist' });
    vlist.softWidth = width;
    // list.children!.reduce(
    //   (acc, row) => Math.max(acc, row.width),
    //   0
    // );
    vlist.height = maxPos;
    vlist.setStyle('height', maxPos, 'em');
    // A second row is used if necessary to represent the vlist's depth.
    if (minPos >= 0)
        return [[new box_1.Box(vlist, { classes: 'ML__vlist-r' })], maxPos, -minPos];
    // We will define depth in an empty box with display: table-cell.
    // It should render with the height that we define. But Chrome, in
    // contenteditable mode only, treats that box as if it contains some
    // text content. And that min-height over-rides our desired height.
    // So we put another empty box inside the depth strut box.
    var depthStrut = new box_1.Box(new box_1.Box(null), { classes: 'ML__vlist' });
    depthStrut.height = -minPos;
    depthStrut.setStyle('height', -minPos, 'em');
    // Safari wants the first row to have inline content; otherwise it
    // puts the bottom of the *second* row on the baseline.
    var topStrut = new box_1.Box(0x200b, {
        classes: 'ML__vlist-s',
        maxFontSize: 0
    });
    topStrut.softWidth = 0;
    topStrut.height = 0;
    topStrut.depth = 0;
    return [
        [
            new box_1.Box([vlist, topStrut], { classes: 'ML__vlist-r' }),
            new box_1.Box(depthStrut, { classes: 'ML__vlist-r' }),
        ],
        maxPos,
        -minPos,
    ];
}
var VBox = /** @class */ (function (_super) {
    __extends(VBox, _super);
    function VBox(content, options) {
        var _this = this;
        var _a;
        var _b = makeRows(content), rows = _b[0], height = _b[1], depth = _b[2];
        _this = _super.call(this, rows.length === 1 ? rows[0] : rows, {
            type: options === null || options === void 0 ? void 0 : options.type,
            classes: ((_a = options === null || options === void 0 ? void 0 : options.classes) !== null && _a !== void 0 ? _a : '') +
                ' ML__vlist-t' +
                (rows.length === 2 ? ' ML__vlist-t2' : '')
        }) || this;
        _this.height = height;
        _this.depth = depth;
        _this.softWidth = rows.reduce(function (acc, row) { return Math.max(acc, row.width); }, 0);
        return _this;
        // this.width = this.children!.reduce(
        //   (acc, row) => Math.max(acc, row.width),
        //   0
        // );
        // for (const child of this.children!) child.width = this.width;
    }
    return VBox;
}(box_1.Box));
exports.VBox = VBox;
/* Combine a nucleus with an atom above and an atom below. Used to form
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
function makeLimitsStack(context, options) {
    var _a, _b, _c, _d, _e;
    // If nothing above and nothing below, nothing to do.
    // if (!options.above && !options.below) {
    //   return new Span(options.base, { type: options.boxType ?? 'mop' }).wrap(
    //     context
    //   );
    //   // return options.base;
    // }
    var metrics = context.metrics;
    // IE8 clips \int if it is in a display: inline-block. We wrap it
    // in a new box so it is an inline, and works.
    // @todo: revisit
    var base = new box_1.Box(options.base);
    var baseShift = (_a = options.baseShift) !== null && _a !== void 0 ? _a : 0;
    var slant = (_b = options.slant) !== null && _b !== void 0 ? _b : 0;
    var aboveShift = 0;
    var belowShift = 0;
    if (options.above) {
        aboveShift =
            (_c = options.aboveShift) !== null && _c !== void 0 ? _c : Math.max(metrics.bigOpSpacing1, metrics.bigOpSpacing3 - options.above.depth);
    }
    if (options.below) {
        belowShift =
            (_d = options.belowShift) !== null && _d !== void 0 ? _d : Math.max(metrics.bigOpSpacing2, metrics.bigOpSpacing4 - options.below.height);
    }
    var result = null;
    if (options.below && options.above) {
        var bottom = metrics.bigOpSpacing5 +
            options.below.height +
            options.below.depth +
            belowShift +
            base.depth +
            baseShift;
        // Here, we shift the limits by the slant of the symbol. Note
        // that we are supposed to shift the limits by 1/2 of the slant,
        // but since we are centering the limits adding a full slant of
        // margin will shift by 1/2 that.
        result = new VBox({
            bottom: bottom,
            children: [
                metrics.bigOpSpacing5,
                {
                    box: options.below,
                    marginLeft: -slant,
                    classes: ['ML__center']
                },
                belowShift,
                //  We need to center the base to account for the case where the
                // above/below is wider
                { box: base, classes: ['ML__center'] },
                aboveShift,
                {
                    box: options.above,
                    marginLeft: slant,
                    classes: ['ML__center']
                },
                metrics.bigOpSpacing5,
            ]
        }).wrap(context);
    }
    else if (options.below && !options.above) {
        result = new VBox({
            top: base.height - baseShift,
            children: [
                metrics.bigOpSpacing5,
                {
                    box: options.below,
                    marginLeft: -slant,
                    classes: ['ML__center']
                },
                belowShift,
                { box: base, classes: ['ML__center'] },
            ]
        }).wrap(context);
    }
    else if (!options.below && options.above) {
        var bottom = base.depth + baseShift;
        result = new VBox({
            bottom: bottom,
            children: [
                { box: base, classes: ['ML__center'] },
                aboveShift,
                {
                    box: options.above,
                    marginLeft: slant,
                    classes: ['ML__center']
                },
                metrics.bigOpSpacing5,
            ]
        }).wrap(context);
    }
    else {
        var bottom = base.depth + baseShift;
        result = new VBox({
            bottom: bottom,
            children: [{ box: base }, metrics.bigOpSpacing5]
        }).wrap(context);
    }
    return new box_1.Box(result, { type: (_e = options.type) !== null && _e !== void 0 ? _e : 'op' });
}
exports.makeLimitsStack = makeLimitsStack;
