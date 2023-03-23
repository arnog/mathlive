import { PT_PER_EM } from './font-metrics';
import type { Dimension, Glue } from '../public/core-types';

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
  return convertDimensionToPt(value, precision) / PT_PER_EM;
}

export function convertGlueToEm(value: Glue): number {
  return convertDimensionToEm(value.glue);
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

export function addDimension(lhs: Dimension, rhs: Dimension): Dimension {
  const lhsPt = convertDimensionToPt(lhs);
  const rhsPt = convertDimensionToPt(rhs);
  return { dimension: lhsPt + rhsPt, unit: 'pt' };
}
