import type { Style } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { latexCommand } from '../core/tokenizer';
import { getDefinition } from '../latex-commands/definitions-utils';
import { X_HEIGHT } from '../core/font-metrics';
import type { AtomJson, ToLatexOptions } from 'core/types';

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
  phasorangle?: boolean;
  // radical?: boolean;
  longdiv?: boolean;
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
    body: Readonly<Atom[]>,
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
    this.shadow = options.shadow ?? 'none';
    this.strokeWidth = options.strokeWidth ?? '0.06em';
    if (!this.strokeWidth) this.strokeWidth = '0.06em';
    this.strokeStyle = options.strokeStyle;
    this.svgStrokeStyle = options.svgStrokeStyle;
    this.strokeColor = options.strokeColor;
    this.borderStyle = options.borderStyle;
    this.padding = options.padding;

    this.captureSelection = false;
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

  _serialize(options: ToLatexOptions): string {
    if (
      !(
        options.expandMacro ||
        options.skipStyles ||
        options.skipPlaceholders
      ) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

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

    const borderWidth = borderDim(this.borderStyle);

    // Calculate the padding
    const padding = context.toEm(
      !this.padding || this.padding === 'auto'
        ? { register: 'fboxsep' }
        : { string: this.padding }
    );
    base.setStyle('position', 'relative');
    base.setStyle('display', 'inline-block');
    base.setStyle('top', padding, 'em');
    base.setStyle('height', base.height + base.depth, 'em');
    base.setStyle('width', base.width, 'em');

    const notation = new Box(null, { classes: 'ML__notation' });

    // The 'ML__notation' class is required to prevent the box from being
    // omitted during rendering (otherwise it would look like an empty, no-op
    // box)
    let h = base.height + base.depth + 2 * padding;
    const w = base.width + 2 * padding;

    let svg = '';

    if (this.notation.horizontalstrike) svg += this.line(3, 50, 97, 50);

    if (this.notation.verticalstrike) svg += this.line(50, 3, 50, 97);

    if (this.notation.updiagonalstrike) svg += this.line(3, 97, 97, 3);

    if (this.notation.downdiagonalstrike) svg += this.line(3, 3, 97, 97);

    if (this.notation.updiagonalarrow) {
      svg += this.line(
        padding.toString(),
        (padding + base.depth + base.height).toString(),
        (padding + base.width).toString(),
        padding.toString()
      );

      const t = 1;
      const length = Math.sqrt(w * w + h * h);
      const f = 0.03 * length * t;
      const wf = base.width * f;
      const hf = (base.depth + base.height) * f;
      const x = padding + base.width;
      let y = padding;
      if (y + hf - 0.4 * wf < 0) y = 0.4 * wf - hf;

      svg += '<polygon points="';
      svg += `${x},${y} ${x - wf - 0.4 * hf},${y + hf - 0.4 * wf} `;
      svg += `${x - 0.7 * wf},${y + 0.7 * hf} ${x - wf + 0.4 * hf},${
        y + hf + 0.4 * wf
      } `;
      svg += `${x},${y}`;
      svg += `" stroke='none' fill="${this.strokeColor}"`;
      svg += '/>';
    }
    let wDelta = 0;
    if (this.notation.phasorangle) {
      const clearance = getClearance(context);
      const bot = (
        base.height +
        base.depth +
        2 * clearance +
        padding
      ).toString();
      const angleWidth = (base.height + base.depth) / 2;
      // Horizontal line
      svg += this.line(
        padding.toString(),
        bot,
        (padding + angleWidth + base.width).toString(),
        bot
      );
      // Angle line
      svg += this.line(
        padding.toString(),
        bot,
        (padding + angleWidth).toString(),
        (padding - clearance).toString()
      );
      // Increase height to account for clearance
      h += clearance;
      // Increase the width to account for the angle
      wDelta = angleWidth;

      base.left += h / 2 - padding;
    }
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
    if (this.notation.longdiv) {
      const clearance = getClearance(context);
      h += clearance;
      svg += this.line(
        padding.toString(),
        padding.toString(),
        (padding + base.width).toString(),
        padding.toString()
      );
      const surdWidth = 0.3;
      wDelta = surdWidth + clearance;
      base.left += surdWidth + clearance;
      base.setTop(padding + clearance);

      svg += '<path d="';
      svg += `M ${padding} ${padding}  a${surdWidth} ${
        (base.depth + base.height + 2 * clearance) / 2
      }, 0, 1, 1, 0 ${base.depth + base.height + 2 * clearance} "`;
      svg += ` stroke-width="${getRuleThickness(context)}" stroke="${
        this.strokeColor
      }" fill="none"`;
      svg += '/>';
    }
    notation.width = base.width + 2 * padding + wDelta;
    notation.height = base.height + padding;
    notation.depth = base.depth + padding;
    notation.setStyle('box-sizing', 'border-box');
    notation.setStyle('left', `calc(-${borderWidth} / 2 )`);
    notation.setStyle('height', `${Math.floor(100 * h) / 100}em`);
    notation.setStyle('top', `calc(${borderWidth} / 2 )`);
    // notation.setStyle('width', `${Math.floor(100 * w) / 100}em`);

    if (this.backgroundcolor)
      notation.setStyle('background-color', this.backgroundcolor);

    if (this.notation.box) notation.setStyle('border', '1px solid red');

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

    if (svg) {
      let svgStyle = '';
      if (this.shadow === 'auto') {
        svgStyle +=
          'filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333)';
      }
      if (this.shadow !== 'none')
        svgStyle += `filter: drop-shadow(${this.shadow})`;

      svgStyle += ` stroke-width="${this.strokeWidth}" stroke="${this.strokeColor}"`;
      svgStyle += ' stroke-linecap="round"';
      if (this.svgStrokeStyle)
        svgStyle += ` stroke-dasharray="${this.svgStrokeStyle}"`;
      notation.svgStyle = svgStyle;
      notation.svgOverlay = svg;
    }

    // Result is a box combining the base and the notation
    const result = new Box([notation, base]);
    // Set its position as relative so that the notation can be absolute
    // positioned over the base
    result.setStyle('position', 'relative');
    result.setStyle('vertical-align', padding, 'em');
    result.setStyle(
      'height',
      `${Math.floor(100 * (base.height + base.depth + 2 * padding)) / 100}em`
    );
    // We set the padding later with `left` and `right` so subtract it now
    // result.setStyle('width', `${Math.floor(100 * base.width) / 100}em`);
    // result.setStyle('width', `100%`);
    result.setStyle('display', 'inline-block');

    result.height = notation.height;
    result.depth = notation.depth;
    result.width = notation.width - 2 * padding;
    result.left = padding;
    result.right = padding;

    if (this.caret) result.caret = this.caret;

    return result.wrap(context);
  }

  line(
    x1: number | string,
    y1: number | string,
    x2: number | string,
    y2: number | string
  ): string {
    return `<line x1="${coord(x1)}"  y1="${coord(y1)}" x2="${coord(
      x2
    )}" y2="${coord(y2)}" vector-effect="non-scaling-stroke"></line>`;
  }
}

function coord(c: string | number): string {
  if (typeof c === 'number') return `${Math.floor(100 * c) / 100}%`;
  return c;
}

function borderDim(s: string | undefined): string {
  if (!s) return '1px';
  const m = s.match(/([0-9][a-zA-Z\%]+)/);
  if (m === null) return '1px';
  return m[1];
}

function getRuleThickness(ctx: Context): string {
  // Same thickness as the surd rule
  // @todo: mystery: need to divide by 10...
  return (
    (
      Math.floor((100 * ctx.metrics.sqrtRuleThickness) / ctx.scalingFactor) /
      100 /
      10
    ).toString() + 'em'
  );
}

function getClearance(ctx: Context): number {
  // Same clearance as for a sqrt

  const phi = ctx.isDisplayStyle ? X_HEIGHT : ctx.metrics.defaultRuleThickness;
  return ctx.metrics.defaultRuleThickness + (ctx.scalingFactor * phi) / 4;
}
