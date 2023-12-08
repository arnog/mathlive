import { Color, OklchColor } from './types';
import { asOklch } from './utils';

/**
 * Calculate a scale of colors from a base color.
 * The base color is the 500 color in the scale.
 * The other colors range from -25, -25, -100, -200 to -900.
 * 11 colors in total.
 */
export function scale(color: Color): Color[] {
  const oklch = asOklch(color);
  delete oklch.alpha;
  const light = { ...oklch, L: 1.0 };
  const dark = { ...oklch };

  // Correct the hue for the Abney Effect
  // See https://royalsocietypublishing.org/doi/pdf/10.1098/rspa.1909.0085
  // (the human vision system perceives a hue shift as colors
  // change in colorimetric purity: mix with black or mix
  // with white)
  // and the Bezold-Brücke effect (hue shift as intensity increases)
  // See https://www.sciencedirect.com/science/article/pii/S0042698999000851

  // h: c2.h >= 60 && c2.h <= 240 ? c2.h + 30 : c2.h - 30,

  const hAngle = (oklch.H * Math.PI) / 180;
  dark.H = oklch.H - 20 * Math.sin(2 * hAngle);
  dark.C = oklch.C + 0.08 * Math.sin(hAngle);
  if (oklch.H >= 180) dark.L = oklch.L - 0.35;
  else dark.L = oklch.L - 0.3 + 0.1 * Math.sin(2 * hAngle);

  return [
    mix(light, oklch, 0.04), // color-25
    mix(light, oklch, 0.08), // color-50
    mix(light, oklch, 0.12), // color-100
    mix(light, oklch, 0.3), // color-200
    mix(light, oklch, 0.5), // color-300
    mix(light, oklch, 0.7), // color-400
    oklch, // color-500
    mix(dark, oklch, 0.85), // color-600
    mix(dark, oklch, 0.7), // color-700
    mix(dark, oklch, 0.5), // color-800
    mix(dark, oklch, 0.25), // color-900
  ];
}

function mix(c1: OklchColor, c2: OklchColor, t: number): OklchColor {
  return {
    L: c1.L * (1 - t) + c2.L * t,
    C: c1.C * (1 - t) + c2.C * t,
    H: c1.H * (1 - t) + c2.H * t,
  };
}

// Interesting article about desiging color scales:
// https://uxplanet.org/designing-systematic-colors-b5d2605b15c

// const colors = {
//   red: '#F21C0D', // hue 30 Vivid Red
//   orange: '#FE9310', // hue 61 Yellow Orange
//   brown: '#856A47', // hue 73 Raw Umber
//   yellow: '#FFCF33', // hue 90 Peach Cobbler / Sunglow
//   lime: '#63B215', // hue 130 Kelly Green
//   green: '#17CF36', // hue 144 Vivid Malachite
//   teal: '#17CFCF', // hue 195 Dark Turquoise
//   cyan: '#13A7EC', // hue 238 Vivid Cerulean
//   blue: '#0D80F2', // hue 255 Tropical Thread / Azure
//   indigo: '#6633CC', // hue 291 Strong Violet / Iris
//   purple: '#A219E6', // hue 309 Purple X11
//   magenta: '#EB4799', // hue 354 Raspberry Pink
// };

// const index = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// let result = '';

// for (const [name, color] of Object.entries(colors)) {
//   const s = scale(color);
//   for (const [i, c] of s.entries())
//     result += `--${name}-${index[i]}: ${asHexColor(c)};` + '\n';
// }
// console.info(result);
