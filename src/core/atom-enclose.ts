import { registerAtomType, decompose, Atom } from './atom-utils';
import { METRICS as FONTMETRICS } from './font-metrics';
import {
    makeSpan,
    makeOrd,
    addSVGOverlay,
    depth as spanDepth,
    height as spanHeight,
    Span,
} from './span';
import { Context } from './context';

registerAtomType('enclose', (context: Context, atom: Atom): Span[] => {
    const base = makeOrd(decompose(context, atom.body as Atom[]));

    // Account for the padding
    const padding =
        typeof atom.padding === 'number' ? atom.padding : FONTMETRICS.fboxsep;

    // The 'ML__notation' class is required to prevent the span from being omitted
    // during rendering (it looks like an empty, no-op span)
    const notation = makeSpan('', 'ML__notation');
    notation.setStyle('position', 'absolute');
    notation.setStyle(
        'height',
        spanHeight(base) + spanDepth(base) + 2 * padding,
        'em'
    );
    notation.height = spanHeight(base) + padding;
    notation.depth = spanDepth(base) + padding;
    if (padding !== 0) {
        notation.setStyle('width', 'calc(100% + ' + 2 * padding + 'em)');
    } else {
        notation.setStyle('width', '100%');
    }
    notation.setStyle('top', '0');
    notation.setStyle('left', -padding, 'em');
    notation.setStyle('z-index', '-1'); // Ensure the box is *behind* the base
    if (atom.backgroundcolor) {
        notation.setStyle('background-color', atom.backgroundcolor);
    }

    if (atom.notation.box) notation.setStyle('border', atom.borderStyle);
    if (atom.notation.actuarial) {
        notation.setStyle('border-top', atom.borderStyle);
        notation.setStyle('border-right', atom.borderStyle);
    }
    if (atom.notation.madruwb) {
        notation.setStyle('border-bottom', atom.borderStyle);
        notation.setStyle('border-right', atom.borderStyle);
    }
    if (atom.notation.roundedbox) {
        notation.setStyle(
            'border-radius',
            (spanHeight(base) + spanDepth(base)) / 2,
            'em'
        );
        notation.setStyle('border', atom.borderStyle);
    }
    if (atom.notation.circle) {
        notation.setStyle('border-radius', '50%');
        notation.setStyle('border', atom.borderStyle);
    }
    if (atom.notation.top) notation.setStyle('border-top', atom.borderStyle);
    if (atom.notation.left) notation.setStyle('border-left', atom.borderStyle);
    if (atom.notation.right) {
        notation.setStyle('border-right', atom.borderStyle);
    }
    if (atom.notation.bottom) {
        notation.setStyle('border-bottom', atom.borderStyle);
    }

    let svg = '';

    if (atom.notation.horizontalstrike) {
        svg += '<line x1="3%"  y1="50%" x2="97%" y2="50%"';
        svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (atom.svgStrokeStyle) {
            svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    if (atom.notation.verticalstrike) {
        svg += '<line x1="50%"  y1="3%" x2="50%" y2="97%"';
        svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (atom.svgStrokeStyle) {
            svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    if (atom.notation.updiagonalstrike) {
        svg += '<line x1="3%"  y1="97%" x2="97%" y2="3%"';
        svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (atom.svgStrokeStyle) {
            svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    if (atom.notation.downdiagonalstrike) {
        svg += '<line x1="3%"  y1="3%" x2="97%" y2="97%"';
        svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}"`;
        svg += ' stroke-linecap="round"';
        if (atom.svgStrokeStyle) {
            svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
        }
        svg += '/>';
    }
    // if (atom.notation.updiagonalarrow) {
    //     const t = 1;
    //     const length = Math.sqrt(w * w + h * h);
    //     const f = 1 / length / 0.075 * t;
    //     const wf = w * f;
    //     const hf = h * f;
    //     const x = w - t / 2;
    //     let y = t / 2;
    //     if (y + hf - .4 * wf < 0 ) y = 0.4 * wf - hf;
    //     svg += '<line ';
    //     svg += `x1="1" y1="${h - 1}px" x2="${x - .7 * wf}px" y2="${y + .7 * hf}px"`;
    //     svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}"`;
    //     svg += ' stroke-linecap="round"';
    //     if (atom.svgStrokeStyle) {
    //         svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    //     svg += '<polygon points="';
    //     svg += `${x},${y} ${x - wf - .4 * hf},${y + hf - .4 * wf} `;
    //     svg += `${x - .7 * wf},${y + .7 * hf} ${x - wf + .4 * hf},${y + hf + .4 * wf} `;
    //     svg += `${x},${y}`;
    //     svg += `" stroke='none' fill="${atom.strokeColor}"`;
    //     svg += '/>';
    // }
    // if (atom.notation.phasorangle) {
    //     svg += '<path d="';
    //     svg += `M ${h / 2},1 L1,${h} L${w},${h} "`;
    //     svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}" fill="none"`;
    //     if (atom.svgStrokeStyle) {
    //         svg += ' stroke-linecap="round"';
    //         svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    // }
    // if (atom.notation.radical) {
    //     svg += '<path d="';
    //     svg += `M 0,${.6 * h} L1,${h} L${emToPx(padding) * 2},1 "`;
    //     svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}" fill="none"`;
    //     if (atom.svgStrokeStyle) {
    //         svg += ' stroke-linecap="round"';
    //         svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    // }
    // if (atom.notation.longdiv) {
    //     svg += '<path d="';
    //     svg += `M ${w} 1 L1 1 a${emToPx(padding)} ${h / 2}, 0, 0, 1, 1 ${h} "`;
    //     svg += ` stroke-width="${atom.strokeWidth}" stroke="${atom.strokeColor}" fill="none"`;
    //     if (atom.svgStrokeStyle) {
    //         svg += ' stroke-linecap="round"';
    //         svg += ` stroke-dasharray="${atom.svgStrokeStyle}"`;
    //     }
    //     svg += '/>';
    // }
    if (svg) {
        let svgStyle;
        if (atom.shadow !== 'none') {
            if (atom.shadow === 'auto') {
                svgStyle =
                    'filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333)';
            } else {
                svgStyle = 'filter: drop-shadow(' + atom.shadow + ')';
            }
        }
        addSVGOverlay(notation, svg, svgStyle);
    }
    const result = makeSpan([notation, base]);
    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('position', 'relative');
    result.setStyle('display', 'inline');

    // The padding adds to the width and height of the pod
    result.height = spanHeight(base) + padding;
    result.depth = spanDepth(base) + padding;
    result.setLeft(padding);
    result.setRight(padding);

    return [result];
});
