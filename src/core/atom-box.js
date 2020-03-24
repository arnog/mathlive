import { registerAtomType, decompose } from './atom-utils.js';
import { METRICS as FONTMETRICS } from './font-metrics.js';
import {
    makeSpan,
    makeOrd,
    depth as spanDepth,
    height as spanHeight,
} from './span.js';

registerAtomType('box', (context, atom) => {
    // The padding extends outside of the base
    const padding =
        typeof atom.padding === 'number' ? atom.padding : FONTMETRICS.fboxsep;

    // Base is the main content "inside" the box
    const base = makeOrd(decompose(context, atom.body));

    // This span will represent the box (background and border)
    // It's positioned to overlap the base
    // The 'ML__box' class is required to prevent the span from being omitted
    // during rendering (it looks like an empty, no-op span)
    const box = makeSpan('', 'ML__box');
    box.setStyle('position', 'absolute');

    box.setStyle(
        'height',
        spanHeight(base) + spanDepth(base) + 2 * padding,
        'em'
    );
    if (padding !== 0) {
        box.setStyle('width', 'calc(100% + ' + 2 * padding + 'em)');
    } else {
        box.setStyle('width', '100%');
    }

    box.setStyle('top', -padding, 'em');
    box.setStyle('left', -padding, 'em');
    box.setStyle('z-index', '-1'); // Ensure the box is *behind* the base

    if (atom.backgroundcolor)
        box.setStyle('background-color', atom.backgroundcolor);
    if (atom.framecolor)
        box.setStyle(
            'border',
            FONTMETRICS.fboxrule + 'em solid ' + atom.framecolor
        );
    if (atom.border) box.setStyle('border', atom.border);

    base.setStyle('display', 'inline-block');
    base.setStyle('height', spanHeight(base) + spanDepth(base), 'em');
    base.setStyle('vertical-align', -spanDepth(base) + padding, 'em');

    // The result is a span that encloses the box and the base
    const result = makeSpan([box, base]);
    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('position', 'relative');
    result.setStyle('vertical-align', -padding + spanDepth(base), 'em');

    // The padding adds to the width and height of the pod
    result.height = spanHeight(base) + padding;
    result.depth = spanDepth(base) + padding;
    result.setLeft(padding);
    result.setRight(padding);

    return result;
});
