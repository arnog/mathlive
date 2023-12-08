import { RgbColor, OklchColor, OklabColor } from './types';

export function asOklch(
  color: string | RgbColor | OklchColor | OklabColor
): OklchColor {
  if (typeof color === 'string') {
    const parsed = parseHex(color);
    if (!parsed) throw new Error(`Invalid color: ${color}`);
    return rgbToOklch(parsed);
  }
  if ('C' in color) return color;
  if ('a' in color) return oklabToOklch(color);
  return rgbToOklch(color);
}

export function asRgb(
  color: string | RgbColor | OklchColor | OklabColor
): RgbColor {
  if (typeof color === 'string') {
    const parsed = parseHex(color);
    if (!parsed) throw new Error(`Invalid color: ${color}`);
    return parsed;
  }
  if ('C' in color) return oklchToRgb(color);
  if ('a' in color) return oklabToRgb(color);
  return color;
}

export function clampByte(v: number): number {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return Math.round(v);
}

export function parseHex(hex: string): RgbColor | undefined {
  if (!hex) return undefined;
  if (hex[0] !== '#') return undefined;
  hex = hex.slice(1);
  let result;
  if (hex.length <= 4) {
    result = {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
    if (hex.length === 4) result.a = parseInt(hex[3] + hex[3], 16) / 255;
  } else {
    result = {
      r: parseInt(hex[0] + hex[1], 16),
      g: parseInt(hex[2] + hex[3], 16),
      b: parseInt(hex[4] + hex[5], 16),
    };
    if (hex.length === 8) result.a = parseInt(hex[6] + hex[7], 16) / 255;
  }
  if (result && typeof result.a === 'undefined') result.a = 1.0;
  return result;
}

// oklab and oklch:
// https://bottosson.github.io/posts/oklab/

export function oklchToOklab(_: OklchColor): OklabColor {
  const [L, C, H] = [_.L, _.C, _.H];
  const hRadians = (H * Math.PI) / 180;
  const result: OklabColor = {
    L,
    a: C * Math.cos(hRadians),
    b: C * Math.sin(hRadians),
  };
  if (_.alpha !== undefined) result.alpha = _.alpha;
  return result;
}

export function oklabToOklch(_: OklabColor): OklchColor {
  const [L, a, b] = [_.L, _.a, _.b];
  const C = Math.sqrt(a * a + b * b);
  const hRadians = Math.atan2(b, a);
  const H = (hRadians * 180) / Math.PI;
  const result: OklchColor = { L, C, H };
  if (_.alpha !== undefined) result.alpha = _.alpha;
  return result;
}

export function oklabToUnclippedRgb(_: OklabColor): number[] {
  const [l, a, b] = [_.L, _.a, _.b];

  const L = Math.pow(
    0.9999999984505198 * l + 0.39633779217376786 * a + 0.2158037580607588 * b,
    3
  );
  const M = Math.pow(
    1.00000000888176 * l - 0.10556134232365635 * a - 0.0638541747717059 * b,
    3
  );
  const S = Math.pow(
    l * 1.000000054672411 - 0.0894841820949657 * a - 1.2914855378640917 * b,
    3
  );

  const r =
    +4.076741661347994 * L - 3.307711590408193 * M + 0.230969928729428 * S;
  const g =
    -1.2684380040921763 * L + 2.6097574006633715 * M - 0.3413193963102197 * S;
  const bl =
    -0.004196086541837188 * L - 0.7034186144594493 * M + 1.7076147009309444 * S;

  // Convert from linear RGB to sRGB
  const conv = (n: number) => {
    const abs = Math.abs(n);
    if (abs <= 0.0031308) return n * 12.92;
    return (Math.sign(n) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
  };

  return [conv(r), conv(g), conv(bl)];
}

function inGamut(rgb: number[]): boolean {
  const [r, g, b] = rgb;
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1;
}

function clampRgb(rgb: number[], alpha?: number): RgbColor {
  let [r, g, b] = rgb;
  r = clampByte(r * 255);
  g = clampByte(g * 255);
  b = clampByte(b * 255);
  return alpha !== undefined ? { r, g, b, alpha } : { r, g, b };
}

/** Convert an oklab color to sRGB, clipping the chroma if necessary */
export function oklabToRgb(color: OklabColor): RgbColor {
  let [r, g, b] = oklabToUnclippedRgb(color);
  if (inGamut([r, g, b])) return clampRgb([r, g, b], color.alpha);

  // Try with chroma = 0
  const oklch = oklabToOklch(color);
  oklch.C = 0;
  [r, g, b] = oklabToUnclippedRgb(oklchToOklab(oklch));

  // If even chroma 0 is not in gamut, return the clamped value
  if (!inGamut([r, g, b])) return clampRgb([r, g, b], color.alpha);

  // Use a binary search to find a chroma that is in gamut
  let low = 0;
  let high = color.L;
  let mid = (low + high) / 2;
  oklch.C = mid;
  const resolution = 0.36 / Math.pow(2, 12);
  while (high - low > resolution) {
    mid = (low + high) / 2;
    oklch.C = mid;
    [r, g, b] = oklabToUnclippedRgb(oklchToOklab(oklch));
    if (inGamut([r, g, b])) low = mid;
    else high = mid;
  }
  return clampRgb([r, g, b], color.alpha);
}

export function oklchToRgb(_: OklchColor): RgbColor {
  return oklabToRgb(oklchToOklab(_));
}

export function rgbToOklab(_: RgbColor): OklabColor {
  const [r, g, b] = [_.r, _.g, _.b];

  // Convert from sRGB to linear RGB
  const conv = (n: number) => {
    const abs = Math.abs(n);
    if (abs <= 0.04045) return n / 12.92;
    return (Math.sign(n) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
  };

  // const L =
  //   +0.4121656129659433 * conv(r / 255) +
  //   0.5362752080314703 * conv(g / 255) +
  //   0.0514575650074055 * conv(b / 255);
  // const M =
  //   +0.21185910790086805 * conv(r / 255) +
  //   0.6807189586533941 * conv(g / 255) +
  //   0.1074065798455032 * conv(b / 255);
  // const S =
  //   +0.08830979477771493 * conv(r / 255) +
  //   0.28184741736157754 * conv(g / 255) +
  //   0.6302613617667958 * conv(b / 255);

  const L =
    0.41222147079999993 * conv(r / 255) +
    0.5363325363 * conv(g / 255) +
    0.0514459929 * conv(b / 255);
  const M =
    0.2119034981999999 * conv(r / 255) +
    0.6806995450999999 * conv(g / 255) +
    0.1073969566 * conv(b / 255);
  const S =
    0.08830246189999998 * conv(r / 255) +
    0.2817188376 * conv(g / 255) +
    0.6299787005000002 * conv(b / 255);

  const L3 = Math.cbrt(L);
  const M3 = Math.cbrt(M);
  const S3 = Math.cbrt(S);

  return {
    L: 0.2104542553 * L3 + 0.793617785 * M3 - 0.0040720468 * S3,
    a: 1.9779984951 * L3 - 2.428592205 * M3 + 0.4505937099 * S3,
    b: 0.0259040371 * L3 + 0.7827717662 * M3 - 0.808675766 * S3,
    alpha: _.alpha,
  };
}

export function rgbToOklch(_: RgbColor): OklchColor {
  return oklabToOklch(rgbToOklab(_));
}
