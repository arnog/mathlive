import { registerAtomType, decompose } from './atom-utils.js';
import {
    makeSpan,
    makeVlist,
    makeOrd,
    depth as spanDepth,
    height as spanHeight,
} from './span.js';
import { METRICS as FONTMETRICS } from './fontMetrics.js';
import Delimiters from './delimiters.js';
import Mathstyle from './mathstyle.js';

registerAtomType('array', (context, atom) => {
    // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
    // and http://tug.ctan.org/macros/latex/base/lttab.dtx
    let colFormat = atom.colFormat;
    if (colFormat && colFormat.length === 0) {
        colFormat = [{ align: 'l' }];
    }
    if (!colFormat) {
        colFormat = [
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
            { align: 'l' },
        ];
    }
    // Fold the array so that there are no more columns of content than
    // there are columns prescribed by the column format.
    const array = [];
    let colMax = 0; // Maximum number of columns of content
    for (const colSpec of colFormat) {
        if (colSpec.align) colMax++;
    }
    for (const row of atom.array) {
        let colIndex = 0;
        while (colIndex < row.length) {
            const newRow = [];
            const lastCol = Math.min(row.length, colIndex + colMax);
            while (colIndex < lastCol) {
                newRow.push(row[colIndex++]);
            }
            array.push(newRow);
        }
    }
    // If the last row is empty, ignore it.
    if (
        array[array.length - 1].length === 1 &&
        array[array.length - 1][0].length === 0
    ) {
        array.pop();
    }
    const mathstyle =
        Mathstyle.toMathstyle(atom.mathstyle) || context.mathstyle;
    // Row spacing
    // Default \arraystretch from lttab.dtx
    const arraystretch = atom.arraystretch || 1;
    const arrayskip = arraystretch * FONTMETRICS.baselineskip;
    const arstrutHeight = 0.7 * arrayskip;
    const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx
    let totalHeight = 0;
    let nc = 0;
    const body = [];
    const nr = array.length;
    for (let r = 0; r < nr; ++r) {
        const inrow = array[r];
        nc = Math.max(nc, inrow.length);
        let height = arstrutHeight; // \@array adds an \@arstrut
        let depth = arstrutDepth; // to each row (via the template)
        const outrow = [];
        for (let c = 0; c < inrow.length; ++c) {
            const localContext = context.clone({
                mathstyle: atom.mathstyle,
            });
            const cell = decompose(localContext, inrow[c]) || [];
            const elt = [makeOrd(null)].concat(cell);
            depth = Math.max(depth, spanDepth(elt));
            height = Math.max(height, spanHeight(elt));
            outrow.push(elt);
        }
        let jot = r === nr - 1 ? 0 : atom.jot || 0;
        if (atom.rowGaps && atom.rowGaps[r]) {
            jot = atom.rowGaps[r];
            if (jot > 0) {
                // \@argarraycr
                jot += arstrutDepth;
                if (depth < jot) {
                    depth = jot; // \@xargarraycr
                }
                jot = 0;
            }
        }
        outrow.height = height;
        outrow.depth = depth;
        totalHeight += height;
        outrow.pos = totalHeight;
        totalHeight += depth + jot; // \@yargarraycr
        body.push(outrow);
    }
    const offset = totalHeight / 2 + mathstyle.metrics.axisHeight;
    const contentCols = [];
    for (let colIndex = 0; colIndex < nc; colIndex++) {
        const col = [];
        for (const row of body) {
            const elem = row[colIndex];
            if (!elem) {
                continue;
            }
            elem.depth = row.depth;
            elem.height = row.height;

            col.push(elem);
            col.push(row.pos - offset);
        }
        if (col.length > 0) {
            contentCols.push(makeVlist(context, col, 'individualShift'));
        }
    }
    // Iterate over each column description.
    // Each `colDesc` will indicate whether to insert a gap, a rule or
    // a column from 'contentCols'
    const cols = [];
    let prevColContent = false;
    let prevColRule = false;
    let currentContentCol = 0;
    let firstColumn = !atom.lFence;
    for (const colDesc of colFormat) {
        if (colDesc.align && currentContentCol >= contentCols.length) {
            break;
        } else if (colDesc.align && currentContentCol < contentCols.length) {
            // If an alignment is specified, insert a column of content
            if (prevColContent) {
                // If no gap was provided, insert a default gap between
                // consecutive columns of content
                cols.push(makeColGap(2 * FONTMETRICS.arraycolsep));
            } else if (prevColRule || firstColumn) {
                // If the previous column was a rule or this is the first column
                // add a smaller gap
                cols.push(makeColGap(FONTMETRICS.arraycolsep));
            }
            cols.push(
                makeSpan(
                    contentCols[currentContentCol],
                    'col-align-' + colDesc.align
                )
            );
            currentContentCol++;
            prevColContent = true;
            prevColRule = false;
            firstColumn = false;
        } else if (typeof colDesc.gap !== 'undefined') {
            // Something to insert in between columns of content
            if (typeof colDesc.gap === 'number') {
                // It's a number, indicating how much space, in em,
                // to leave in between columns
                cols.push(makeColGap(colDesc.gap));
            } else {
                // It's a mathlist
                // Create a column made up of the mathlist
                // as many times as there are rows.
                cols.push(
                    makeColOfRepeatingElements(
                        context,
                        body,
                        offset,
                        colDesc.gap
                    )
                );
            }
            prevColContent = false;
            prevColRule = false;
            firstColumn = false;
        } else if (colDesc.rule) {
            // It's a rule.
            const separator = makeSpan(null, 'vertical-separator');
            separator.setStyle('height', totalHeight, 'em');
            // result.setTop((1 - context.mathstyle.sizeMultiplier) *
            //     context.mathstyle.metrics.axisHeight);
            separator.setStyle(
                'margin-top',
                3 * context.mathstyle.metrics.axisHeight - offset,
                'em'
            );
            separator.setStyle('vertical-align', 'top');
            // separator.setStyle('display', 'inline-block');
            let gap = 0;
            if (prevColRule) {
                gap = FONTMETRICS.doubleRuleSep - FONTMETRICS.arrayrulewidth;
            } else if (prevColContent) {
                gap = FONTMETRICS.arraycolsep - FONTMETRICS.arrayrulewidth;
            }
            separator.setLeft(gap, 'em');
            cols.push(separator);
            prevColContent = false;
            prevColRule = true;
            firstColumn = false;
        }
    }
    if (prevColContent && !atom.rFence) {
        // If the last column was content, add a small gap
        cols.push(makeColGap(FONTMETRICS.arraycolsep));
    }
    if (
        (!atom.lFence || atom.lFence === '.') &&
        (!atom.rFence || atom.rFence === '.')
    ) {
        // There are no delimiters around the array, just return what
        // we've built so far.
        return makeOrd(cols, 'mtable');
    }
    // There is at least one delimiter. Wrap the core of the array with
    // appropriate left and right delimiters
    // const inner = makeSpan(makeSpan(cols, 'mtable'), 'mord');
    const inner = makeSpan(cols, 'mtable');
    const innerHeight = spanHeight(inner);
    const innerDepth = spanDepth(inner);
    return makeOrd([
        atom.bind(
            context,
            Delimiters.makeLeftRightDelim(
                'mopen',
                atom.lFence,
                innerHeight,
                innerDepth,
                context
            )
        ),
        inner,
        atom.bind(
            context,
            Delimiters.makeLeftRightDelim(
                'mclose',
                atom.rFence,
                innerHeight,
                innerDepth,
                context
            )
        ),
    ]);
});

/**
 * Used in `decomposeArray` to create a column separator span.
 *
 * @param {number} width
 * @memberof module:mathAtom
 * @private
 */
function makeColGap(width) {
    const separator = makeSpan('\u200b', 'arraycolsep');
    separator.setWidth(width, 'em');
    return separator;
}

/**
 * Used in decomposeArray to create a column of repeating elements.
 * @memberof module:mathAtom
 * @private
 */
function makeColOfRepeatingElements(context, body, offset, elem) {
    const col = [];
    for (const row of body) {
        const cell = makeSpan(decompose(context, elem));
        cell.depth = row.depth;
        cell.height = row.height;
        col.push(cell);
        col.push(row.pos - offset);
    }
    return makeVlist(context, col, 'individualShift');
}
