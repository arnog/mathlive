import { registerAtomType, decompose } from './atom-utils.js';
import {
    makeOrd,
    makeSVGOverlay,
    depth as spanDepth,
    height as spanHeight,
    skew as spanSkew,
    italic as spanItalic,
} from './span.js';

registerAtomType('enclose', (context, atom) => {
    const base = makeOrd(decompose(context, atom.body));
    const result = base;
    // Account for the padding
    const padding = atom.padding === 'auto' ? 0.2 : atom.padding; // em
    result.setStyle('padding', padding, 'em');
    result.setStyle('display', 'inline-block');
    result.setStyle('height', result.height + result.depth, 'em');
    result.setStyle('left', -padding, 'em');
    if (atom.backgroundcolor && atom.backgroundcolor !== 'transparent') {
        result.setStyle('background-color', atom.backgroundcolor);
    }
    let svg = '';
    if (atom.notation.box) result.setStyle('border', atom.borderStyle);
    if (atom.notation.actuarial) {
        result.setStyle('border-top', atom.borderStyle);
        result.setStyle('border-right', atom.borderStyle);
    }
    if (atom.notation.madruwb) {
        result.setStyle('border-bottom', atom.borderStyle);
        result.setStyle('border-right', atom.borderStyle);
    }
    if (atom.notation.roundedbox) {
        result.setStyle(
            'border-radius',
            (spanHeight(result) + spanDepth(result)) / 2,
            'em'
        );
        result.setStyle('border', atom.borderStyle);
    }
    if (atom.notation.circle) {
        result.setStyle('border-radius', '50%');
        result.setStyle('border', atom.borderStyle);
    }
    if (atom.notation.top) result.setStyle('border-top', atom.borderStyle);
    if (atom.notation.left) result.setStyle('border-left', atom.borderStyle);
    if (atom.notation.right) result.setStyle('border-right', atom.borderStyle);
    if (atom.notation.bottom)
        result.setStyle('border-bottom', atom.borderStyle);
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
        return makeSVGOverlay(result, svg, svgStyle);
    }
    return result;
});
