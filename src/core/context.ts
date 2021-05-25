import {
  Dimension,
  FontSize,
  Glue,
  MacroDictionary,
  Registers,
  RegisterValue,
  Style,
} from '../public/core';
import { highlight } from './color';

import { FontMetrics, FONT_SCALE } from './font-metrics';
import { D, Dc, Mathstyle, MathstyleName, MATHSTYLES } from './mathstyle';
import { Box } from './box';
import { convertDimensionToEm } from './registers-utils';

// Using boxes and glue in TeX and LaTeX:
// https://www.math.utah.edu/~beebe/reports/2009/boxes.pdf

export interface ContextInterface {
  macros?: MacroDictionary;
  registers: Registers;
  atomIdsSettings?: {
    overrideID?: string;
    groupNumbers: boolean;
    seed: string | number;
  };
  smartFence?: boolean;
  isSelected?: boolean;
  renderPlaceholder?: (context: Context) => Box;
}

export type PrivateStyle = Style & {
  verbatimColor?: string;
  verbatimBackgroundColor?: string;
  mathStyle?: MathstyleName;
};

/**
 * This structure contains the rendering context of the current parse level.
 *
 * It keeps a reference to the parent context which is necessary to calculate
 * the proper scaling/fontsize since all sizes are specified in em and the
 * absolute value of an em depends of the fontsize of the parent context.
 *
 * When a new context is entered, a clone of the context is created with
 * `new()` so that any further changes remain local to the scope.
 *
 * When a context is exited, a 'wrapper' box is created to adjust the
 * fontsize on entry, and adjust the height/depth of the box to account for
 * the new fontsize (if applicable).
 *
 * The effective font size is determined by:
 * - the 'size' property, which represent a size set by a sizing command
 * (e.g. `\Huge`, `\tiny`, etc...)
 * - a size delta from the mathstyle (-1 for scriptstyle for example)
 *
 *
 * A context is defined for example by:
 * - an explicit group enclosed in braces `{...}`
 * - a semi-simple group enclosed in `\bgroup...\endgroup`
 * - the cells of a tabular environment
 * - the numerator or denominator of a fraction
 * - the root and radix of a fraction
 *
 */
export class Context implements ContextInterface {
  macros: MacroDictionary;

  // If not undefined, unique IDs should be generated for each box so they can
  // be mapped back to an atom.
  // The `seed` field should be a number to generate a specific range of
  // IDs or the string "random" to generate a random number.
  // Optionally, if a `groupNumbers` property is set to true, an additional
  // box will enclose strings of digits. This is used by read aloud to properly
  // pronounce (and highlight) numbers in expressions.

  atomIdsSettings?: {
    overrideID?: string;
    groupNumbers: boolean;
    seed: string | number;
  };
  smartFence: boolean;
  renderPlaceholder?: (context: Context) => Box;

  isSelected: boolean;

  // Rendering to construct a phantom: don't bind the box.
  readonly isPhantom: boolean;

  // Inherithed from `Style`: size, letterShapeStyle, color and backgroundColor.
  // Size is the "base" font size (need to add mathstyle.sizeDelta to get effective size)
  readonly letterShapeStyle: 'tex' | 'french' | 'iso' | 'upright';
  readonly color?: string;
  readonly backgroundColor?: string;

  readonly _size?: FontSize;
  private _mathstyle?: Mathstyle;
  registers: Registers;

  parent?: Context;

  constructor(
    parent: Context | ContextInterface,
    style?: Style & {
      isSelected?: boolean;
      isPhantom?: boolean;
    },
    inMathstyle?:
      | 'cramp'
      | 'superscript'
      | 'subscript'
      | 'numerator'
      | 'denominator'
      | MathstyleName
      | ''
      | 'auto'
  ) {
    // If we don't have a parent context, we must provide an initial
    // mathstyle and fontsize
    console.assert(parent instanceof Context || style?.fontSize !== undefined);
    console.assert(parent instanceof Context || inMathstyle !== undefined);

    if (parent instanceof Context) this.parent = parent;
    if (!(parent instanceof Context)) this.registers = parent.registers ?? {};

    this.isSelected = style?.isSelected ?? parent?.isSelected ?? false;
    this.isPhantom = style?.isPhantom ?? this.parent?.isPhantom ?? false;

    const from: { -readonly [key in keyof Context]?: Context[key] } = {
      ...parent,
    };
    if (style) {
      let size: FontSize | undefined = undefined;
      if (
        style.fontSize &&
        style.fontSize !== 'auto' &&
        style.fontSize !== this.parent?._size
      ) {
        size = style.fontSize;
      }
      if (style.letterShapeStyle && style.letterShapeStyle !== 'auto') {
        from.letterShapeStyle = style.letterShapeStyle;
      }

      if (style.color && style.color !== 'none') from.color = style.color;

      if (style.backgroundColor && style.backgroundColor !== 'none') {
        from.backgroundColor = this.isSelected
          ? highlight(style.backgroundColor)
          : style.backgroundColor;
      }
      this._size = size;
    }
    this.letterShapeStyle = from.letterShapeStyle ?? 'tex';
    this.color = from.color;
    this.backgroundColor = from.backgroundColor;

    let mathstyle: Mathstyle | undefined;

    if (typeof inMathstyle === 'string') {
      if (parent instanceof Context) {
        switch (inMathstyle) {
          case 'cramp':
            mathstyle = parent.mathstyle.cramp;
            break;
          case 'superscript':
            mathstyle = parent.mathstyle.sup;
            break;
          case 'subscript':
            mathstyle = parent.mathstyle.sub;
            break;
          case 'numerator':
            mathstyle = parent.mathstyle.fracNum;
            break;
          case 'denominator':
            mathstyle = parent.mathstyle.fracDen;
            break;
        }
      }
      switch (inMathstyle) {
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

    this._mathstyle = mathstyle;

    this.atomIdsSettings = parent.atomIdsSettings;
    this.macros = from.macros ?? {};
    this.smartFence = from.smartFence ?? false;
    this.renderPlaceholder = from.renderPlaceholder;
    console.assert(
      !(parent instanceof Context) ||
        this.atomIdsSettings === parent.atomIdsSettings
    );
  }

  get mathstyle(): Mathstyle {
    let result = this._mathstyle;
    let parent = this.parent;
    while (!result) {
      result = parent!._mathstyle;
      parent = parent!.parent;
    }
    return result;
  }

  getRegister(name: string): undefined | RegisterValue {
    if (this.registers?.[name]) return this.registers[name];
    if (this.parent) return this.parent.getRegister(name);
    return undefined;
  }

  getRegisterAsGlue(name: string): Glue | undefined {
    if (this.registers?.[name]) {
      const value = this.registers[name];
      if (typeof value === 'object' && 'glue' in value) {
        return value;
      } else if (typeof value === 'object' && 'dimension' in value) {
        return { glue: { dimension: value.dimension } };
      } else if (typeof value === 'number') {
        return { glue: { dimension: value } };
      }
      return undefined;
    }
    if (this.parent) return this.parent.getRegisterAsGlue(name);
    return undefined;
  }

  getRegisterAsEm(name: string): number {
    return convertDimensionToEm(this.getRegisterAsDimension(name));
  }

  getRegisterAsDimension(name: string): Dimension | undefined {
    if (this.registers?.[name]) {
      const value = this.registers[name];
      if (typeof value === 'object' && 'glue' in value) {
        return value.glue;
      } else if (typeof value === 'object' && 'dimension' in value) {
        return value;
      } else if (typeof value === 'number') {
        return { dimension: value };
      }
      return undefined;
    }
    if (this.parent) return this.parent.getRegisterAsDimension(name);
    return undefined;
  }

  setRegister(name: string, value: RegisterValue | undefined): void {
    if (value === undefined) {
      delete this.registers[name];
      return;
    }
    this.registers[name] = value;
  }

  setGlobalRegister(name: string, value: RegisterValue): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let root: Context = this;
    while (root.parent) {
      root.setRegister(name, undefined);
      root = root.parent;
    }
    root.setRegister(name, value);
  }

  get size(): FontSize {
    let result = this._size;
    let parent = this.parent;
    while (!result) {
      result = parent!._size;
      parent = parent!.parent;
    }
    return result;
  }

  makeID(): string | undefined {
    if (!this.atomIdsSettings) return undefined;

    if (typeof this.atomIdsSettings.seed !== 'number') {
      return (
        Date.now().toString(36).slice(-2) +
        Math.floor(Math.random() * 0x186a0).toString(36)
      );
    }

    const result = this.atomIdsSettings.overrideID
      ? this.atomIdsSettings.overrideID
      : this.atomIdsSettings.seed.toString(36);
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

  // Return the font size, in em relative to the mathfield fontsize,
  // accounting both for the base font size and the mathstyle
  get effectiveFontSize(): number {
    return FONT_SCALE[
      Math.max(1, this.size + this.mathstyle.sizeDelta) as FontSize
    ];
  }

  get computedColor(): string {
    let result = this.color;
    let parent = this.parent;
    if (!result && parent) {
      result = parent.color;
      parent = parent.parent;
    }

    return result ?? '';
  }

  get computedBackgroundColor(): string {
    let result = this.backgroundColor;
    let parent = this.parent;
    if (!result && parent) {
      result = parent.backgroundColor;
      parent = parent.parent;
    }

    return result ?? '';
  }

  get metrics(): FontMetrics {
    return this.mathstyle.metrics;
  }
}
