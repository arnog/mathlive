import type {
  Dimension,
  FontSize,
  Glue,
  Registers,
  Style,
  MathstyleName,
  LatexValue,
  MacroDefinition,
} from '../public/core-types';
import type { ContextInterface, BoxInterface, FontMetrics } from './types';

import { DEFAULT_FONT_SIZE, FONT_SCALE, PT_PER_EM } from './font-metrics';
import { D, Dc, Mathstyle, MATHSTYLES } from './mathstyle';
import { convertDimensionToEm, convertDimensionToPt } from './registers-utils';
import { getDefaultContext } from './context-utils';

// Using boxes and glue in TeX and LaTeX:
// https://www.math.utah.edu/~beebe/reports/2009/boxes.pdf

export type AtomIdsSettings = {
  // **overrideID** If not undefined, unique IDs should be generated for each
  // box so they can be mapped back to an atom.
  overrideID?: string;
  // If `groupNumbers` is true, an additional box will enclose strings of
  // digits. This is used by read aloud to properly pronounce
  // (and highlight) numbers in expressions.
  groupNumbers: boolean;
  // **seed** A number to generate a specific range of IDs or the string
  // "random" to generate a random number.
  seed: 'random' | number;
};

/**
 * The `Context` represents the rendering context of the current rendering
 * subtree.
 *
 * It keeps a reference to the parent context which is necessary to calculate
 * the proper scaling/fontsize since all sizes are specified in em and the
 * absolute value of an em depends of the fontsize of the parent context.
 *
 * A new subtree is entered for example by:
 * - an explicit group enclosed in braces `{...}`
 * - a semi-simple group enclosed in `\bgroup...\endgroup`
 * - the cells of a tabular environment
 * - the numerator or denominator of a fraction
 * - the root and radix of a fraction
 *
 * When a new subtree is entered, a new Context is created, linked to the
 * parent context.
 *
 * When the subtree is exited, a 'wrapper' box is created to adjust the
 * fontsize on entry, and adjust the height/depth of the box to account for
 * the new fontsize (if applicable).
 *
 * The effective font size is determined by:
 * - the 'size' property, which represent a size set by a sizing command
 * (e.g. `\Huge`, `\tiny`, etc...)
 * - a size delta from the mathstyle (-1 for scriptstyle for example)
 */
export class Context implements ContextInterface {
  // The parent context is used to access inherited properties, namely,
  // registers
  readonly parent?: Context;

  readonly registers: Registers;

  readonly atomIdsSettings: AtomIdsSettings;

  readonly renderPlaceholder?: (context: Context) => BoxInterface;

  // Rendering to construct a phantom: don't bind the box.
  readonly isPhantom: boolean;

  // Inherited from `Style`: size, letterShapeStyle, color and backgroundColor.
  readonly letterShapeStyle: 'tex' | 'french' | 'iso' | 'upright';
  readonly smartFence: boolean;

  readonly color: string;
  readonly backgroundColor: string;
  readonly minFontScale: number;

  // `size` is the "base" font size (need to add `mathstyle.sizeDelta`
  // to get effective size)
  /** @internal */
  readonly size: FontSize;

  readonly mathstyle: Mathstyle;

  readonly placeholderSymbol: string;
  readonly colorMap: (name: string) => string | undefined;
  readonly backgroundColorMap: (name: string) => string | undefined;
  readonly getMacro: (token: string) => MacroDefinition | null;

  constructor(
    options?: {
      parent?: Context;
      from?: ContextInterface;
      color?: string;
      backgroundColor?: string;
      fontSize?: FontSize | 'auto';
      isPhantom?: boolean;
      mathstyle?:
        | 'cramp'
        | 'superscript'
        | 'subscript'
        | 'numerator'
        | 'denominator'
        | MathstyleName
        | ''
        | 'auto';
    },
    style?: Style
  ) {
    let template: ContextInterface;
    if (options?.parent) {
      this.parent = options.parent;
      template = options.parent;
      this.registers = {};
    } else {
      template = { ...getDefaultContext(), ...(options?.from ?? {}) };
      this.registers = template.registers;
    }

    if (template.atomIdsSettings)
      this.atomIdsSettings = { ...template.atomIdsSettings };
    this.renderPlaceholder = template.renderPlaceholder;
    this.isPhantom = options?.isPhantom ?? this.parent?.isPhantom ?? false;

    this.letterShapeStyle = template.letterShapeStyle;
    this.minFontScale = template.minFontScale;

    if (style?.color && style.color !== 'none') this.color = style.color;
    else this.color = this.parent?.color ?? '';

    if (style?.backgroundColor && style.backgroundColor !== 'none')
      this.backgroundColor = style.backgroundColor;
    else this.backgroundColor = this.parent?.backgroundColor ?? '';

    if (
      style?.fontSize &&
      style.fontSize !== 'auto' &&
      style.fontSize !== this.parent?.size
    )
      this.size = style.fontSize;
    else this.size = this.parent?.size ?? DEFAULT_FONT_SIZE;

    let mathstyle = this.parent?.mathstyle ?? MATHSTYLES.displaystyle;

    if (typeof options?.mathstyle === 'string') {
      if (template instanceof Context) {
        switch (options.mathstyle) {
          case 'cramp':
            mathstyle = mathstyle.cramp;
            break;
          case 'superscript':
            mathstyle = mathstyle.sup;
            break;
          case 'subscript':
            mathstyle = mathstyle.sub;
            break;
          case 'numerator':
            mathstyle = mathstyle.fracNum;
            break;
          case 'denominator':
            mathstyle = mathstyle.fracDen;
            break;
        }
      }
      switch (options.mathstyle) {
        case 'textstyle':
          mathstyle = MATHSTYLES.textstyle;
          break;
        case 'displaystyle':
          mathstyle = MATHSTYLES.displaystyle;
          break;
        case 'scriptstyle':
          mathstyle = MATHSTYLES.scriptstyle;
          break;
        case 'scriptscriptstyle':
          mathstyle = MATHSTYLES.scriptscriptstyle;
          break;
        case '':
        case 'auto':
          break;
      }
    }

    this.mathstyle = mathstyle;

    this.smartFence = template.smartFence;
    this.placeholderSymbol = template.placeholderSymbol;
    this.colorMap = template.colorMap ?? ((x) => x);
    this.backgroundColorMap = template.backgroundColorMap ?? ((x) => x);

    this.getMacro = template.getMacro;

    console.assert(this.parent !== undefined || this.registers !== undefined);
  }

  makeID(): string | undefined {
    if (!this.atomIdsSettings) return undefined;

    if (this.atomIdsSettings.overrideID) return this.atomIdsSettings.overrideID;

    if (typeof this.atomIdsSettings.seed !== 'number') {
      return `${Date.now().toString(36).slice(-2)}${Math.floor(
        Math.random() * 0x186a0
      ).toString(36)}`;
    }

    const result = this.atomIdsSettings.seed.toString(36);
    this.atomIdsSettings.seed += 1;
    return result;
  }

  // Scale a value, in em, to account for the fontsize and mathstyle
  // of this context
  scale(value: number): number {
    return value * this.effectiveFontSize;
  }

  get scalingFactor(): number {
    if (!this.parent) return 1.0;
    return this.effectiveFontSize / this.parent.effectiveFontSize;
  }

  get isDisplayStyle(): boolean {
    return this.mathstyle.id === D || this.mathstyle.id === Dc;
  }

  get isCramped(): boolean {
    return this.mathstyle.cramped;
  }

  get isTight(): boolean {
    return this.mathstyle.isTight;
  }

  get metrics(): FontMetrics {
    return this.mathstyle.metrics;
  }

  // Return the font size, in em relative to the mathfield fontsize,
  // accounting both for the base font size and the mathstyle
  get effectiveFontSize(): number {
    return Math.max(
      FONT_SCALE[Math.max(1, this.size + this.mathstyle.sizeDelta) as FontSize],
      this.minFontScale
    );
  }

  getRegister(name: string): undefined | number | string | LatexValue {
    if (this.registers?.[name]) return this.registers[name];
    if (this.parent) return this.parent.getRegister(name);
    return undefined;
  }

  getRegisterAsNumber(name: string): undefined | number {
    const val = this.getRegister(name);
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val);
    return undefined;
  }

  getRegisterAsGlue(name: string): Glue | undefined {
    if (this.registers?.[name]) {
      const value = this.registers[name];
      if (typeof value === 'object' && 'glue' in value) return value;
      else if (typeof value === 'object' && 'dimension' in value)
        return { glue: { dimension: value.dimension } };
      else if (typeof value === 'number') return { glue: { dimension: value } };

      return undefined;
    }
    if (this.parent) return this.parent.getRegisterAsGlue(name);
    return undefined;
  }

  getRegisterAsEm(name: string, precision?: number): number {
    return convertDimensionToEm(this.getRegisterAsDimension(name), precision);
  }

  getRegisterAsDimension(name: string): Dimension | undefined {
    if (this.registers?.[name]) {
      const value = this.registers[name];
      if (typeof value === 'object' && 'glue' in value) return value.glue;
      else if (typeof value === 'object' && 'dimension' in value) return value;
      else if (typeof value === 'number') return { dimension: value };

      return undefined;
    }
    if (this.parent) return this.parent.getRegisterAsDimension(name);
    return undefined;
  }

  setRegister(name: string, value: LatexValue | undefined): void {
    if (value === undefined) {
      delete this.registers[name];
      return;
    }
    this.registers[name] = value;
  }

  evaluate(value: LatexValue): LatexValue | undefined {
    if (!value || !('register' in value)) return value;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let context: Context = this;
    if ('global' in value && value.global)
      while (context.parent) context = context.parent;

    let factor = 1;
    if ('factor' in value && value.factor !== 1 && value.factor !== undefined)
      factor = value.factor;

    const val = context.getRegister(value.register);
    if (val === undefined) return undefined;
    if (typeof val === 'string')
      return { string: Number(val).toString() + val };
    if (typeof val === 'number') return { number: factor * val };

    const result = context.evaluate(val);
    if (result === undefined) return undefined;

    if ('string' in result)
      return { string: Number(val).toString() + result.string };
    if ('number' in result) return { number: factor * result.number };
    if ('dimension' in result)
      return { ...result, dimension: factor * result.dimension };
    if ('glue' in result) {
      return {
        ...result,
        glue: { ...result.glue, dimension: factor * result.glue.dimension },
        shrink: result.shrink
          ? { ...result.shrink, dimension: factor * result.shrink.dimension }
          : undefined,
        grow: result.grow
          ? { ...result.grow, dimension: factor * result.grow.dimension }
          : undefined,
      };
    }
    return value;
  }

  toDimension(value: LatexValue): Dimension | null {
    const val = this.evaluate(value);
    if (val === undefined) return null;

    if ('dimension' in val) return val;
    if ('glue' in val) return val.glue;
    if ('number' in val) return { dimension: val.number };

    return null;
  }

  toEm(value: LatexValue | null, precision?: number): number {
    if (value === null) return 0;
    const dimen = this.toDimension(value);
    if (dimen === null) return 0;
    return convertDimensionToPt(dimen, precision) / PT_PER_EM;
  }

  toNumber(value: LatexValue | null): number | null {
    if (value === null) return null;
    const val = this.evaluate(value);
    if (val === undefined) return null;
    if ('number' in val) return val.number;
    if ('dimension' in val) return val.dimension;
    if ('glue' in val) return val.glue.dimension;
    if ('string' in val) return Number(val.string);
    return null;
  }
  toColor(value: LatexValue | null): string | null {
    if (value === null) return null;
    const val = this.evaluate(value);
    if (val === undefined) return null;
    if ('string' in val) return this.colorMap?.(val.string) ?? val.string;

    return null;
  }
  toBackgroundColor(value: LatexValue | null): string | null {
    if (value === null) return null;
    const val = this.evaluate(value);
    if (val === undefined) return null;
    if ('string' in val)
      return this.backgroundColorMap?.(val.string) ?? val.string;

    return null;
  }
}
