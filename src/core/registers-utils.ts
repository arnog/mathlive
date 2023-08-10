import { PT_PER_EM } from './font-metrics';

import type { Dimension, Glue, LatexValue } from '../public/core-types';

export function convertDimensionToPt(
  value?: Dimension,
  precision?: number
): number {
  if (!value) return 0;
  // If the units are missing, TeX assumes 'pt'
  const f = {
    pt: 1,
    mm: 7227 / 2540,
    cm: 7227 / 254,
    ex: 35271 / 8192,
    px: 3 / 4,
    em: PT_PER_EM,
    bp: 803 / 800,
    dd: 1238 / 1157,
    pc: 12,
    in: 72.27,
    mu: 10 / 18,
  }[value.unit ?? 'pt']!;

  if (Number.isFinite(precision)) {
    const factor = 10 ** precision!;
    return Math.round((value.dimension / PT_PER_EM) * f * factor) / factor;
  }

  return value.dimension * f;
}

export function convertDimensionToEm(
  value?: Dimension | null,
  precision?: number
): number {
  if (value === null) return 0;
  const result = convertDimensionToPt(value) / PT_PER_EM;
  if (Number.isFinite(precision)) {
    const factor = 10 ** precision!;
    return Math.round(result * factor) / factor;
  }
  return result;
}

export function convertGlueToEm(value: Glue): number {
  return convertDimensionToEm(value.glue);
}

export function convertGlueOrDimensionToEm(value: Glue | Dimension): number {
  if ('glue' in value) return convertDimensionToEm(value.glue);
  return convertDimensionToEm(value);
}

export function convertDimensionToPixel(value: Dimension): number {
  return convertDimensionToEm(value) * (4 / 3) * PT_PER_EM;
}

export function serializeDimension(value: Dimension): string {
  return `${value.dimension}${value.unit ?? 'pt'}`;
}

export function serializeGlue(value: Glue): string {
  let result = serializeDimension(value.glue);
  if (value.grow && value.grow.dimension !== 0)
    result += ` plus ${serializeDimension(value.grow)}`;

  if (value.shrink && value.shrink.dimension !== 0)
    result += ` minus ${serializeDimension(value.shrink)}`;

  return result;
}

export function serializeGlueOrDimention(value: Glue | Dimension): string {
  if ('glue' in value) return serializeGlue(value);
  return serializeDimension(value);
}

export function serializeLatexValue(
  value: LatexValue | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  let result = '';
  if ('dimension' in value) result = `${value.dimension}${value.unit ?? 'pt'}`;

  if ('glue' in value) result = serializeGlue(value);

  if ('number' in value) {
    if (!('base' in value) || value.base === 'decimal')
      result = Number(value.number).toString();
    else if (value.base === 'alpha')
      result = `\`${String.fromCodePoint(value.number)}`;
    else {
      const i = Math.round(value.number) >>> 0;
      if (value.base === 'hexadecimal') {
        result = Number(i).toString(16).toUpperCase();

        if (i <= 0xff) result = result.padStart(2, '0');
        else if (i <= 0xffff) result = result.padStart(4, '0');
        else if (i <= 0xffffff) result = result.padStart(6, '0');
        else result = result.padStart(8, '0');

        result = `"${result}`;
      } else if (value.base === 'octal') {
        result = Number(i).toString(8);
        if (i <= 0o77) result = result.padStart(2, '0');
        else if (i <= 0x7777) result = result.padStart(4, '0');
        else result = result.padStart(8, '0');
        result = `'${result}`;
      }
    }
  }

  if ('register' in value) {
    if ('factor' in value) {
      if (value.factor === -1) result = '-';
      else if (value.factor !== 1) result = Number(value.factor).toString();
    }
    if ('global' in value && value.global) result += '\\global';
    result += `\\${value.register}`;
  }

  if ('string' in value) result = value.string;

  if (value.relax ?? false) result += '\\relax';

  return result;
}

export function multiplyLatexValue(
  value: LatexValue | null,
  factor: number
): LatexValue | null {
  if (value === null || value === undefined) return null;

  if ('number' in value) return { ...value, number: value.number * factor };
  if ('register' in value) {
    if ('factor' in value && value.factor)
      return { ...value, factor: value.factor * factor };
    return { ...value, factor };
  }

  if ('dimension' in value)
    return { ...value, dimension: value.dimension * factor };

  if ('glue' in value) {
    if (value.shrink && value.grow) {
      return {
        glue: multiplyLatexValue(value.glue, factor) as Dimension,
        shrink: multiplyLatexValue(value.shrink, factor) as Dimension,
        grow: multiplyLatexValue(value.grow, factor) as Dimension,
      };
    }
    if (value.shrink) {
      return {
        glue: multiplyLatexValue(value.glue, factor) as Dimension,
        shrink: multiplyLatexValue(value.shrink, factor) as Dimension,
      };
    }
    if (value.grow) {
      return {
        glue: multiplyLatexValue(value.glue, factor) as Dimension,
        grow: multiplyLatexValue(value.grow, factor) as Dimension,
      };
    }
    return {
      glue: multiplyLatexValue(value.glue, factor) as Dimension,
    };
  }
  return null;
}
