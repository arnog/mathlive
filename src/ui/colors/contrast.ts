import { Color } from './types';
import { asRgb } from './utils';

/**
 * Return a more accurate measure of contrast between a foreground color
 * and a background color than WCAG2.0.
 *
 * Range is approximately -108..108
 *
 * If result < 0, the foreground is lighter than the background
 *
 * If abs(result) > 90, suitable for all cases
 * If abs(result) < 60, large text
 * If abs(result) < 44, spot and non-text
 * If abs(result) < 30, minimum contrast for any text
 *
 * See https://www.myndex.com/APCA/
 */
export function apca(bgColor: Color, fgColor: Color): number {
  // APCA calculations are done in sRGB color space
  const bgRgb = asRgb(bgColor);
  const fgRgb = asRgb(fgColor);

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
    linearize(fgRgb.r / 255) * 0.2126729 +
      linearize(fgRgb.g / 255) * 0.7151522 +
      linearize(fgRgb.b / 255) * 0.072175
  );

  const Ybg = fclamp(
    linearize(bgRgb.r / 255) * 0.2126729 +
      linearize(bgRgb.g / 255) * 0.7151522 +
      linearize(bgRgb.b / 255) * 0.072175
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

/** Of two foreground colors, return the one with the highest
 *  contrast ratio with the background
 */
export function contrast(bgColor: Color, dark?: Color, light?: Color): Color {
  light ??= '#fff';
  dark ??= '#000';

  const lightContrast = apca(bgColor, light);
  const darkContrast = apca(bgColor, dark);

  return Math.abs(lightContrast) > Math.abs(darkContrast) ? light : dark;
}
