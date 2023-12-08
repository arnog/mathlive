// RGB color in the sRGB color space
export type RgbColor = {
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
  alpha?: number; // 0..1
};

// Perceptual uniform color, can represent colors outside the sRGB gamut
export type OklchColor = {
  L: number; // perceived lightness 0..1
  C: number; // chroma 0.. 0.37
  H: number; // hue 0..360
  alpha?: number; // 0..1
};

// Perceptual uniform color, can represent colors outside the sRGB gamut
export type OklabColor = {
  L: number; // perceived lightness 0..1
  a: number; // green <-> red -0.4..0.4
  b: number; // blue <-> yellow -0.4..0.4
  alpha?: number; // 0..1
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

  if (_.alpha !== undefined && _.alpha < 1.0)
    hexString += ('00' + Math.round(_.alpha * 255).toString(16)).slice(-2);

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
      (_.alpha !== undefined && _.alpha < 1.0 ? hexString[6] : '');
  }

  return '#' + hexString;
}

/**  Generate CSS string for a color */
export function css(_: string | RgbColor | OklabColor | OklchColor): string {
  if (typeof _ === 'string') return _;
  if ('r' in _) return rgbToHex(_);
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

/** Of two foreground colors, return the one with the highest
 *  contrast ratio with the background
 */
export function contrast(
  background: string,
  dark?: string,
  light?: string
): string {
  light ??= '#fff';
  dark ??= '#000';

  const bgColor = parseHex(background)!;
  const lightContrast = apca(bgColor, parseHex(light)!);
  const darkContrast = apca(bgColor, parseHex(dark)!);

  return Math.abs(lightContrast) > Math.abs(darkContrast) ? light : dark;
}

/**
 * Return a more accurate measure of contrast between a foreground color
 * and a background color than WCAG2.0.
 *
 * If the result is negative, the foreground is lighter than the
 * background
 *
 * Range about -108..108
 * If abs(result) > 90, suitable for all cases
 * If abs(result) < 60, large text
 * If abs(result) < 44, spot and non-text
 * If abs(result) < 30, minimum contrast for any text
 *
 * See https://www.myndex.com/APCA/
 */
export function apca(background: RgbColor, foreground: RgbColor): number {
  // exponents
  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;

  // clamps
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const loClip = 0.1;
  const deltaYmin = 0.0005;

  // scalers
  // see https://github.com/w3c/silver/issues/645
  const scaleBoW = 1.14;
  const loBoWoffset = 0.027;
  const scaleWoB = 1.14;
  const loWoBoffset = 0.027;

  function fclamp(Y: number) {
    return Y >= blkThrs ? Y : Y + (blkThrs - Y) ** blkClmp;
  }

  function linearize(val: number) {
    const sign = val < 0 ? -1 : 1;
    return sign * Math.pow(Math.abs(val), 2.4);
  }

  // Calculates "screen luminance" with non-standard simple gamma EOTF
  // weights should be from CSS Color 4, not the ones here which are via Myndex and copied from Lindbloom
  const Yfg = fclamp(
    linearize(foreground.r / 255) * 0.2126729 +
      linearize(foreground.g / 255) * 0.7151522 +
      linearize(foreground.b / 255) * 0.072175
  );

  const Ybg = fclamp(
    linearize(background.r / 255) * 0.2126729 +
      linearize(background.g / 255) * 0.7151522 +
      linearize(background.b / 255) * 0.072175
  );

  let S: number, C: number, Sapc: number;

  if (Math.abs(Ybg - Yfg) < deltaYmin) C = 0;
  else {
    if (Ybg > Yfg) {
      // dark foreground on light background
      S = Ybg ** normBG - Yfg ** normTXT;
      C = S * scaleBoW;
    } else {
      // light foreground on dark background
      S = Ybg ** revBG - Yfg ** revTXT;
      C = S * scaleWoB;
    }
  }
  if (Math.abs(C) < loClip) Sapc = 0;
  else if (C > 0) Sapc = C - loWoBoffset;
  else Sapc = C + loBoWoffset;

  return Sapc * 100;
}
