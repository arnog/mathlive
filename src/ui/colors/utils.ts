export type RgbColor = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

export type OklchColor = {
  L: number; // 0..1
  C: number; // 0.. 0.37
  h: number; //   0..360
  alpha?: number; // 0..1
};

export type HslColor = {
  h: number;
  s: number;
  l: number;
  a?: number;
};

export type LabColor = {
  L: number;
  a: number;
  b: number;
  alpha?: number;
};

export type XyzColor = {
  x: number;
  y: number;
  z: number;
};

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

export function rgbToHex(_: RgbColor): string {
  let hexString = (
    (1 << 24) +
    (clampByte(_.r) << 16) +
    (clampByte(_.g) << 8) +
    clampByte(_.b)
  )
    .toString(16)
    .slice(1);

  if (_.a !== undefined && _.a < 1.0)
    hexString += ('00' + Math.round(_.a * 255).toString(16)).slice(-2);

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
      (_.a !== undefined && _.a < 1.0 ? hexString[6] : '');
  }

  return '#' + hexString;
}

export function luma(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];

  // Source: https://www.w3.org/TR/WCAG20/#relativeluminancedef

  const conv = (n: number) =>
    n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);

  return 0.2126 * conv(r) + 0.7152 * conv(g) + 0.0722 * conv(b);
}

// https://bottosson.github.io/posts/oklab/

export function oklchToOklab(_: OklchColor): LabColor {
  const [L, C, h] = [_.L, _.C, _.h];
  const hRadians = (h * Math.PI) / 180;
  const result: LabColor = {
    L,
    a: C * Math.cos(hRadians),
    b: C * Math.sin(hRadians),
  };
  if (_.alpha !== undefined) result.alpha = _.alpha;
  return result;
}

export function oklabToRgb(_: LabColor): RgbColor {
  const [l, a, b] = [_.L, _.a, _.b];
  // const y = (l + 0.16) / 1.16;
  // const x = a / 1.16 + y;
  // const z = y - b / 1.16;
  // const r =
  //   0.9999999984496163 * x + 0.3963377777753821 * y + 0.2158037572992955 * z;
  // const g = 0.9999999939972972 * y + -0.105561345615017 * z;
  // const b2 =
  //   1.0000000088817607 * x + 2.03211193885992 * y + -0.5226657980972148 * z;

  const L = Math.pow(
    l * 0.9999999984505198 + 0.39633779217376786 * a + 0.2158037580607588 * b,
    3
  );
  const M = Math.pow(
    l * 1.00000000888176 - 0.10556134232365635 * a - 0.0638541747717059 * b,
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

  const conv = (n: number) => {
    const abs = Math.abs(n);
    if (abs > 0.0031308)
      return (Math.sign(n) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);

    return n * 12.92;
  };

  return {
    r: clampByte(conv(r) * 255),
    g: clampByte(conv(g) * 255),
    b: clampByte(conv(bl) * 255),
    a: _.alpha,
  };
}

export function oklchToRgb(_: OklchColor): RgbColor {
  return oklabToRgb(oklchToOklab(_));
}

function hueToRgbChannel(t1: number, t2: number, hue: number): number {
  if (hue < 0) hue += 6;
  if (hue >= 6) hue -= 6;

  if (hue < 1) return (t2 - t1) * hue + t1;
  else if (hue < 3) return t2;
  else if (hue < 4) return (t2 - t1) * (4 - hue) + t1;
  return t1;
}

export function hslToRgb(_: HslColor): RgbColor {
  let [hue, sat, light] = [_.h, _.s, _.l];
  hue = ((hue + 360) % 360) / 60.0;
  light = Math.max(0, Math.min(light, 1.0));
  sat = Math.max(0, Math.min(sat, 1.0));
  const t2 = light <= 0.5 ? light * (sat + 1) : light + sat - light * sat;
  const t1 = light * 2 - t2;
  return {
    r: Math.round(255 * hueToRgbChannel(t1, t2, hue + 2)),
    g: Math.round(255 * hueToRgbChannel(t1, t2, hue)),
    b: Math.round(255 * hueToRgbChannel(t1, t2, hue - 2)),
  };
}

export function rgbToHsl(_: RgbColor): HslColor {
  const [r, g, b] = [_.r / 255.0, _.g / 255.0, _.b / 255.0];
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);

  const delta = max - min;
  let h = +Infinity;
  let s: number;

  if (max === min) h = 0;
  else if (r === max) h = (g - b) / delta;
  else if (g === max) h = 2 + (b - r) / delta;
  else if (b === max) h = 4 + (r - g) / delta;

  h = Math.min(h * 60, 360);

  if (h < 0) h += 360;

  const l = (min + max) / 2;

  if (max === min) s = 0;
  else if (l <= 0.5) s = delta / (max + min);
  else s = delta / (2 - max - min);

  return { h, s, l };
}

export function saturate(color: string, percent: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const hsl = rgbToHsl(rgb);
  hsl.s = Math.min(1, (hsl.s * (100 + percent)) / 100);
  return rgbToHex(hslToRgb(hsl));
}

export function lighten(color: string, percent: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.min(1, (hsl.l * (100 + percent)) / 100);
  return rgbToHex(hslToRgb(hsl));
}

/**
 * L: 0..100
 * a: -128..128
 * b: -128..128
 */

export function labToRgb(_: LabColor): RgbColor {
  let [L, aStar, bStar] = [_.L, _.a, _.b];
  L = Math.max(0, Math.min(100, L));
  aStar = Math.max(-128, Math.min(128, aStar));
  bStar = Math.max(-128, Math.min(128, bStar));
  let y = (L + 16) / 116;
  let x = aStar / 500 + y;
  let z = y - bStar / 200;

  x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787);
  y = 1.0 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787);
  z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787);

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: clampByte(r * 255),
    g: clampByte(g * 255),
    b: clampByte(b * 255),
  };
}

/**
 * r: 0..255
 * g: 0..255
 * b: 0..255
 * L: 0..100
 * a: -128..128
 * b: -128..128
 */
export function rgbToLab(_: RgbColor): LabColor {
  let [r, g, b] = [_.r, _.g, _.b];
  r = clampByte(r) / 255;
  g = clampByte(g) / 255;
  b = clampByte(b) / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

export function rgbToXyz(_: RgbColor): XyzColor {
  const [r, g, b] = [_.r, _.g, _.b];
  return {
    x: 0.430574 * r + 0.34155 * g + 0.178325 * b,
    y: 0.222015 * r + 0.706655 * g + 0.07133 * b,
    z: 0.020183 * r + 0.129553 * g + 0.93918 * b,
  };
}

export function xyzToRgb(_: XyzColor): { r: number; g: number; b: number } {
  const [x, y, z] = [_.x, _.y, _.z];
  return {
    r: 3.063218 * x - 1.393325 * y - 0.475802 * z,
    g: -0.969243 * x + 1.875966 * y + 0.041555 * z,
    b: 0.067871 * x - 0.228834 * y + 1.069251 * z,
  };
}

/**
 * Return either dark (default #000) or light (default #fff) depending on
 * the contrast ratio (as per WCAG 2.0 spec)
 * WCAG 2.0
 * - AA
 *     - small text: contrast ratio > 4.5:1
 *     - large text (18px, bold): contrast ratio > 3.1
 * - AAA
 *     - small text: contrast ratio > 7:1
 *     - large text (18px, bold): contrast ratio > 4.5.1
 */
export function contrast(base: string, dark?: string, light?: string): string {
  let darkContrast, lightContrast;
  dark ??= '#000';
  light ??= '#fff';

  // Calculate contrast ratios for each color
  // See https://www.w3.org/TR/WCAG20/#contrast-ratiodef
  const baseLuma = luma(base);
  const darkLuma = luma(dark);
  const lightLuma = luma(light);
  if (baseLuma > darkLuma) darkContrast = (baseLuma + 0.05) / (darkLuma + 0.05);
  else darkContrast = (darkLuma + 0.05) / (baseLuma + 0.05);

  if (baseLuma > lightLuma)
    lightContrast = (baseLuma + 0.05) / (lightLuma + 0.05);
  else lightContrast = (lightLuma + 0.05) / (baseLuma + 0.05);

  return darkContrast > lightContrast ? dark : light;
}
