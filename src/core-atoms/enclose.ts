import type { Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { addSVGOverlay, Box } from '../core/box';
import { Context } from '../core/context';
import { latexCommand } from '../core/tokenizer';

export type EncloseAtomOptions = {
  shadow?: string;
  strokeWidth?: string;
  strokeStyle?: string;
  svgStrokeStyle?: string;
  strokeColor?: string;
  borderStyle?: string;
  padding?: string;
  backgroundcolor?: string;
  style: Style;
};
export type Notations = {
  downdiagonalstrike?: boolean;
  updiagonalstrike?: boolean;
  verticalstrike?: boolean;
  horizontalstrike?: boolean;
  updiagonalarrow?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  top?: boolean;
  circle?: boolean;
  roundedbox?: boolean;
  madruwb?: boolean;
  actuarial?: boolean;
  box?: boolean;
  // phasorangle?: boolean;
  // radical?: boolean;
  // longdiv?: boolean;
};

export class EncloseAtom extends Atom {
  backgroundcolor?: string;
  border: string;

  private readonly notation: Notations;
  private readonly shadow?: string;
  private readonly strokeWidth?: string;
  private readonly strokeStyle?: string;
  private readonly svgStrokeStyle?: string;
  private readonly strokeColor?: string;
  private readonly borderStyle?: string;
  private readonly padding?: string;

  constructor(
    command: string,
    body: Atom[],
    notation: Notations,
    options: EncloseAtomOptions
  ) {
    super({ type: 'enclose', command, style: options.style });
    this.body = body;
    this.backgroundcolor = options.backgroundcolor;
    if (notation.updiagonalarrow) notation.updiagonalstrike = false;

    if (notation.box) {
      notation.left = false;
      notation.right = false;
      notation.bottom = false;
      notation.top = false;
    }

    this.notation = notation;
    this.shadow = options.shadow;
    this.strokeWidth = options.strokeWidth;
    this.strokeStyle = options.strokeStyle;
    this.svgStrokeStyle = options.svgStrokeStyle;
    this.strokeColor = options.strokeColor;
    this.borderStyle = options.borderStyle;
    this.padding = options.padding;

    this.captureSelection = true; // Do not let children be selected
  }

  static fromJson(json: AtomJson): EncloseAtom {
    return new EncloseAtom(
      json.command,
      json.body,
      json.notation,
      json as any as EncloseAtomOptions
    );
  }

  toJson(): AtomJson {
    return {
      ...super.toJson(),
      notation: this.notation,
      shadow: this.shadow,
      strokeWidth: this.strokeWidth,
      strokeStyle: this.strokeStyle,
      svgStrokeStyle: this.svgStrokeStyle,
      strokeColor: this.strokeColor,
      borderStyle: this.borderStyle,
      padding: this.padding,
    };
  }

  serialize(options: ToLatexOptions): string {
    let command = this.command ?? '';
    if (this.command === '\\enclose') {
      command += '{' + Object.keys(this.notation).join(' ') + '}';

      // \enclose can have optional parameters...
      let style = '';
      let sep = '';
      if (this.backgroundcolor && this.backgroundcolor !== 'transparent') {
        style += sep + 'mathbackground="' + this.backgroundcolor + '"';
        sep = ',';
      }

      if (this.shadow && this.shadow !== 'auto') {
        style += sep + 'shadow="' + this.shadow + '"';
        sep = ',';
      }

      if (this.strokeWidth || this.strokeStyle !== 'solid') {
        style += sep + this.borderStyle;
        sep = ',';
      } else if (this.strokeColor && this.strokeColor !== 'currentColor') {
        style += sep + 'mathcolor="' + this.strokeColor + '"';
        sep = ',';
      }

      if (style) command += `[${style}]`;
    }

    return latexCommand(command, this.bodyToLatex(options));
  }

  render(parentContext: Context): Box | null {
    const context = new Context({ parent: parentContext }, this.style);

    const base = Atom.createBox(context, this.body);

    if (!base) return null;

    // Account for the padding
    const padding = context.toEm(
      !this.padding || this.padding === 'auto'
        ? { register: 'fboxsep' }
        : { string: this.padding }
    );
    const borderWidth = borderDim(this.borderStyle);

    // The 'ML__notation' class is required to prevent the box from being omitted
    // during rendering (it looks like an empty, no-op box)
    const notation = new Box(null, { classes: 'ML__notation' });
    notation.setStyle('box-sizing', 'border-box');

    notation.setStyle('left', `calc(-${borderWidth} / 2 - ${padding}em)`);

    notation.setStyle(
      'height',
      `calc(${base.height + base.depth + 2 * padding}em)`
    );

    notation.height = base.height + padding;
    notation.depth = base.depth + padding;
    notation.setStyle(
      'width',
      `calc(100% + ${2 * padding}em + 2 * ${borderWidth})`
    );

    if (this.backgroundcolor) {
      notation.setStyle(
        'background-color',
        this.backgroundcolor ?? 'transparent'
      );
    }

    if (this.notation.box) notation.setStyle('border', this.borderStyle);
    if (this.notation.actuarial) {
      notation.setStyle('border-top', this.borderStyle);
      notation.setStyle('border-right', this.borderStyle);
    }

    if (this.notation.madruwb) {
      notation.setStyle('border-bottom', this.borderStyle);
      notation.setStyle('border-right', this.borderStyle);
    }

    if (this.notation.roundedbox) {
      notation.setStyle('border-radius', '8px');
      notation.setStyle('border', this.borderStyle);
    }

    if (this.notation.circle) {
      notation.setStyle('border-radius', '50%');
      notation.setStyle('border', this.borderStyle);
    }

    if (this.notation.top) notation.setStyle('border-top', this.borderStyle);

    if (this.notation.left) notation.setStyle('border-left', this.borderStyle);

    if (this.notation.right)
      notation.setStyle('border-right', this.borderStyle);

    if (this.notation.bottom)
      notation.setStyle('border-bottom', this.borderStyle);

    let svg = '';

    if (this.notation.horizontalstrike) {
      svg += '<line x1="3%"  y1="50%" x2="97%" y2="50%"';
      svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
      svg += ' stroke-linecap="round"';
      if (this.svgStrokeStyle)
        svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;

      svg += '/>';
    }

    if (this.notation.verticalstrike) {
      svg += '<line x1="50%"  y1="3%" x2="50%" y2="97%"';
      svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
      svg += ' stroke-linecap="round"';
      if (this.svgStrokeStyle)
        svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;

      svg += '/>';
    }

    if (this.notation.updiagonalstrike) {
      svg += '<line x1="3%"  y1="97%" x2="97%" y2="3%"';
      svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
      svg += ' stroke-linecap="round"';
      if (this.svgStrokeStyle)
        svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;

      svg += '/>';
    }

    if (this.notation.downdiagonalstrike) {
      svg += '<line x1="3%"  y1="3%" x2="97%" y2="97%"';
      svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
      svg += ' stroke-linecap="round"';
      if (this.svgStrokeStyle)
        svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;

      svg += '/>';
    }

    // if (this.notation.updiagonalarrow) {
    //   const t = 1;
    //   const length = Math.sqrt(w * w + h * h);
    //   const f = (1 / length / 0.075) * t;
    //   const wf = w * f;
    //   const hf = h * f;
    //   const x = w - t / 2;
    //   let y = t / 2;
    //   if (y + hf - 0.4 * wf < 0) y = 0.4 * wf - hf;
    //   svg += '<line ';
    //   svg += `x1="1" y1="${h - 1}px" x2="${x - 0.7 * wf}px" y2="${
    //     y + 0.7 * hf
    //   }px"`;
    //   svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
    //   svg += ' stroke-linecap="round"';
    //   if (this.svgStrokeStyle) {
    //     svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //   }
    //   svg += '/>';
    //   svg += '<polygon points="';
    //   svg += `${x},${y} ${x - wf - 0.4 * hf},${y + hf - 0.4 * wf} `;
    //   svg += `${x - 0.7 * wf},${y + 0.7 * hf} ${x - wf + 0.4 * hf},${
    //     y + hf + 0.4 * wf
    //   } `;
    //   svg += `${x},${y}`;
    //   svg += `" stroke='none' fill="${this.strokeColor}"`;
    //   svg += '/>';
    // }
    // if (this.notation.phasorangle) {
    //   svg += '<path d="';
    //   svg += `M ${h / 2},1 L1,${h} L${w},${h} "`;
    //   svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
    //   if (this.svgStrokeStyle) {
    //     svg += ' stroke-linecap="round"';
    //     svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //   }
    //   svg += '/>';
    // }
    // if (this.notation.radical) {
    //   svg += '<path d="';
    //   svg += `M 0,${0.6 * h} L1,${h} L${
    //     convertDimensionToPixel(padding) * 2
    //   },1 "`;
    //   svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
    //   if (this.svgStrokeStyle) {
    //     svg += ' stroke-linecap="round"';
    //     svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //   }
    //   svg += '/>';
    // }
    // if (this.notation.longdiv) {
    //   svg += '<path d="';
    //   svg += `M ${w} 1 L1 1 a${convertDimensionToPixel(padding)} ${
    //     h / 2
    //   }, 0, 0, 1, 1 ${h} "`;
    //   svg += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}" fill="none"`;
    //   if (this.svgStrokeStyle) {
    //     svg += ' stroke-linecap="round"';
    //     svg += ` stroke-dasharray="${this.svgStrokeStyle}"`;
    //   }
    //   svg += '/>';
    // }
    if (svg) {
      let svgStyle;
      if (this.shadow !== 'none') {
        svgStyle =
          this.shadow === 'auto'
            ? 'filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333)'
            : 'filter: drop-shadow(' + this.shadow + ')';
      }

      addSVGOverlay(notation, svg, svgStyle);
    }

    const result = new Box([notation, base]);
    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('position', 'relative');
    result.setStyle('display', 'inline');

    // The padding adds to the width and height of the pod
    result.height = base.height + padding;
    result.depth = base.depth + padding;
    result.left = padding;
    result.right = padding;

    if (this.caret) result.caret = this.caret;

    return result.wrap(context);
  }
}

function borderDim(s: string | undefined): string {
  if (!s) return '1px';
  const m = s.match(/([0-9][a-zA-Z\%]+)/);
  if (m === null) return '1px';
  return m[1];
}
