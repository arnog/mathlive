import { Color, OklabColor, OklchColor } from './types';
import { clampByte, asRgb } from './utils';

export function asHexColor(_: Color): string {
  const rgb = asRgb(_);
  let hexString = (
    (1 << 24) +
    (clampByte(rgb.r) << 16) +
    (clampByte(rgb.g) << 8) +
    clampByte(rgb.b)
  )
    .toString(16)
    .slice(1);

  if (rgb.alpha !== undefined && rgb.alpha < 1.0)
    hexString += ('00' + Math.round(rgb.alpha * 255).toString(16)).slice(-2);

  // Compress hex from hex-6 or hex-8 to hex-3 or hex-4 if possible
  if (
    hexString[0] === hexString[1] &&
    hexString[2] === hexString[3] &&
    hexString[4] === hexString[5] &&
    hexString[6] === hexString[7]
  ) {
    hexString =
      hexString[0] +
      hexString[2] +
      hexString[4] +
      (rgb.alpha !== undefined && rgb.alpha < 1.0 ? hexString[6] : '');
  }

  return '#' + hexString;
}

/**  Generate CSS string for a color */
export function css(_: Color): string {
  if (typeof _ === 'string') return _;
  if ('r' in _) return asHexColor(_);
  if ('a' in _) {
    const lab = _ as OklabColor;
    if ('alpha' in lab && typeof lab.alpha === 'number') {
      return `lab(${Math.round(lab.L * 1000) / 10}% ${
        Math.round(lab.a * 100) / 100
      } ${Math.round(lab.b * 100) / 100} / ${
        Math.round(lab.alpha * 100) / 100
      }%)`;
    }
    return `lab(${Math.round(lab.L * 1000) / 10}% ${
      Math.round(lab.a * 100) / 100
    } ${Math.round(lab.b * 100) / 100})`;
  }

  // L is a percentage, C is a number < 0.4, H is a number 0..360
  // Alpha could be 0..1 or n% (0..100)
  const oklch = _ as OklchColor;
  if ('alpha' in oklch && typeof oklch.alpha === 'number') {
    return `oklch(${Math.round(oklch.L * 1000) / 10}% ${
      Math.round(oklch.C * 1000) / 1000
    } ${Math.round(oklch.H * 10) / 10} / ${
      Math.round(oklch.alpha * 100) / 100
    }%)`;
  }

  return `oklch(${Math.round(oklch.L * 1000) / 10}% ${
    Math.round(oklch.C * 1000) / 1000
  } ${Math.round(oklch.H * 10) / 10})`;
}
