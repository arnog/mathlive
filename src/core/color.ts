/**
 * This module contains some color dictionaries and algorithms to
 * parse a string into a hex RGB color value.s
 */

/**
 * First 10 predefined colors used for plotting by Mathematica.
 *
 * Also known as _indexed color scheme #97_.
 */
const MATHEMATICA_COLORS: Record<string, string> = {
  m0: '#3F3D99', // Strong blue
  m1: '#993D71', // Strong cerise
  m2: '#998B3D', // Strong gold
  m3: '#3D9956', // Malachite green
  m4: '#3D5A99', // Strong cobalt blue
  m5: '#993D90', // Strong orchid
  m6: '#996D3D', // Strong orange
  m7: '#43993D', // Strong sap green
  m8: '#3D7999', // Cornflower blue
  m9: '#843D99', // Mulberry
};
// ColorData97 (Mathematica standard lines)
// rgb(0.368417, 0.506779, 0.709798),       #5e81b5
// rgb(0.880722, 0.611041, 0.142051),
// rgb(0.560181, 0.691569, 0.194885),
// rgb(0.922526, 0.385626, 0.209179),
// rgb(0.528488, 0.470624, 0.701351),
// rgb(0.772079, 0.431554, 0.102387),
// rgb(0.363898, 0.618501, 0.782349),
// rgb(1, 0.75, 0),
// rgb(0.647624, 0.37816, 0.614037),
// rgb(0.571589, 0.586483, 0.),
// rgb(0.915, 0.3325, 0.2125),
// rgb(0.40082222609352647, 0.5220066643438841, 0.85),
// rgb(0.9728288904374106, 0.621644452187053, 0.07336199581899142),
// rgb(0.736782672705901, 0.358, 0.5030266573755369),
// rgb(0.28026441037696703, 0.715, 0.4292089322474965)

/**
 *  Matlab colors
 */
export const MATLAB_COLORS: Record<string, string> = {
  blue: '#0072BD', // [0, 0.4470, 0.7410]             blue
  orange: '#D95319', // [0.8500, 0.3250, 0.0980]        orange
  yellow: '#EDB120', // [0.9290, 0.6940, 0.1250]       yellow
  purple: '#7E2F8E', // [0.4940, 0.1840, 0.5560]       purple
  green: '#77AC30', // [0.4660, 0.6740, 0.1880]       green
  cyan: '#4DBEEE', // [0.3010, 0.7450, 0.9330]       cyan
  red: '#A2142F', // [0.6350, 0.0780, 0.1840]	    dark red
};

// Colors from Chromatic 100 design scale
export const BACKGROUND_COLORS = {
  'red': '#fbbbb6',
  'orange': '#ffe0c2',
  'yellow': '#fff1c2',
  'lime': '#d0e8b9',
  'green': '#bceac4',
  'teal': '#b9f1f1',
  'blue': '#b6d9fb',
  'indigo': '#d1c2f0',
  'purple': '#e3baf8',
  'magenta': '#f9c8e0',
  'black': '#353535',
  'dark-grey': '#8C8C8C',
  'grey': '#D0D0D0',
  'light-grey': '#F0F0F0',
  'white': '#ffffff',
};

// Colors from Chromatic 500 (and 600, 700) design scale
export const FOREGROUND_COLORS = {
  'red': '#d7170b', //<- 700, 500 ->'#f21c0d'
  'orange': '#fe8a2b',
  'yellow': '#ffc02b', // <- 600, 500 -> '#ffcf33',
  'lime': '#63b215',
  'green': '#21ba3a',
  'teal': '#17cfcf',
  'blue': '#0d80f2',
  'indigo': '#63c',
  'purple': '#a219e6',
  'magenta': '#eb4799',
  'black': '#000',
  'dark-grey': '#666',
  'grey': '#A6A6A6',
  'light-grey': '#d4d5d2',
  'white': '#ffffff',
};

// Map some of the DVIPS color names to Chromatic
const DVIPS_TO_CHROMATIC = {
  Red: 'red',
  Orange: 'orange',
  Yellow: 'yellow',
  LimeGreen: 'lime',
  Green: 'green',
  TealBlue: 'teal',
  Blue: 'blue',
  Violet: 'indigo',
  Purple: 'purple',
  Magenta: 'magenta',
  Black: 'black',
  Gray: 'grey',
  White: 'white',
};

/**
 * 68 colors (+ white) known to dvips used in LaTeX.
 *
 * The color names are based on the names of the _Crayola Crayon_ box of
 * 64 crayons.
 *
 * See:
 * - {@link https://ctan.org/pkg/colordvi | ColorDVI.tex}
 * - {@link https://en.wikibooks.org/w/index.php?title=LaTeX/Colors | Wikibooks:LaTeX/Colors}
 *
 * We use the Matlab colors for common colors by default.
 *
 */
const DVIPS_COLORS: Record<string, string> = {
  Apricot: '#FBB982',
  Aquamarine: '#00B5BE',
  Bittersweet: '#C04F17',
  Black: '#221E1F', // Indeed.
  Blue: '#2D2F92',
  BlueGreen: '#00B3B8',
  BlueViolet: '#473992',
  Brickred: '#B6321C',
  Brown: '#792500',
  BurntOrange: '#F7921D',
  CadetBlue: '#74729A',
  CarnationPink: '#F282B4',
  Cerulean: '#00A2E3',
  CornflowerBlue: '#41B0E4',
  Cyan: '#00AEEF',
  Dandelion: '#FDBC42',
  DarkOrchid: '#A4538A',
  Emerald: '#00A99D',
  ForestGreen: '#009B55',
  Fuchsia: '#8C368C',
  Goldenrod: '#FFDF42',
  Gray: '#949698',
  Green: '#00A64F',
  GreenYellow: '#DFE674',
  JungleGreen: '#00A99A',
  Lavender: '#F49EC4',
  Limegreen: '#8DC73E',
  Magenta: '#EC008C',
  Mahogany: '#A9341F',
  Maroon: '#AF3235',
  Melon: '#F89E7B',
  MidnightBlue: '#006795',
  Mulberry: '#A93C93',
  NavyBlue: '#006EB8',
  OliveGreen: '#3C8031',
  Orange: '#F58137',
  OrangeRed: '#ED135A',
  Orchid: '#AF72B0',
  Peach: '#F7965A',
  Periwinkle: '#7977B8',
  Pinegreen: '#008B72',
  Plum: '#92268F',
  ProcessBlue: '#00B0F0',
  Purple: '#99479B',
  RawSienna: '#974006',
  Red: '#ED1B23',
  RedOrange: '#F26035',
  RedViolet: '#A1246B',
  Rhodamine: '#EF559F',
  RoyalBlue: '#0071BC',
  RoyalPurple: '#613F99',
  RubineRed: '#ED017D',
  Salmon: '#F69289',
  SeaGreen: '#3FBC9D',
  Sepia: '#671800',
  SkyBlue: '#46C5DD',
  SpringGreen: '#C6DC67',
  Tan: '#DA9D76',
  TealBlue: '#00AEB3',
  Thistle: '#D883B7',
  Turquoise: '#00B4CE',
  Violet: '#58429B',
  VioletRed: '#EF58A0',
  White: '#FFFFFF',
  WildStrawberry: '#EE2967',
  Yellow: '#FFF200',
  YellowGreen: '#98CC70',
  YellowOrange: '#FAA21A',
};

// Other color lists: SVG colors, x11 colors
/*
aliceblue	rgb(240, 248, 255)
antiquewhite	rgb(250, 235, 215)
aqua	rgb( 0, 255, 255)
aquamarine	rgb(127, 255, 212)
azure	rgb(240, 255, 255)
beige	rgb(245, 245, 220)
bisque	rgb(255, 228, 196)
black	rgb( 0, 0, 0)
blanchedalmond	rgb(255, 235, 205)
blue	rgb( 0, 0, 255)
blueviolet	rgb(138, 43, 226)
brown	rgb(165, 42, 42)
burlywood	rgb(222, 184, 135)
cadetblue	rgb( 95, 158, 160)
chartreuse	rgb(127, 255, 0)
chocolate	rgb(210, 105, 30)
coral	rgb(255, 127, 80)
cornflowerblue	rgb(100, 149, 237)
cornsilk	rgb(255, 248, 220)
crimson	rgb(220, 20, 60)
cyan	rgb( 0, 255, 255)
darkblue	rgb( 0, 0, 139)
darkcyan	rgb( 0, 139, 139)
darkgoldenrod	rgb(184, 134, 11)
darkgray	rgb(169, 169, 169)
darkgreen	rgb( 0, 100, 0)
darkgrey	rgb(169, 169, 169)
darkkhaki	rgb(189, 183, 107)
darkmagenta	rgb(139, 0, 139)
darkolivegreen	rgb( 85, 107, 47)
darkorange	rgb(255, 140, 0)
darkorchid	rgb(153, 50, 204)
darkred	rgb(139, 0, 0)
darksalmon	rgb(233, 150, 122)
darkseagreen	rgb(143, 188, 143)
darkslateblue	rgb( 72, 61, 139)
darkslategray	rgb( 47, 79, 79)
darkslategrey	rgb( 47, 79, 79)
darkturquoise	rgb( 0, 206, 209)
darkviolet	rgb(148, 0, 211)
deeppink	rgb(255, 20, 147)
deepskyblue	rgb( 0, 191, 255)
dimgray	rgb(105, 105, 105)
dimgrey	rgb(105, 105, 105)
dodgerblue	rgb( 30, 144, 255)
firebrick	rgb(178, 34, 34)
floralwhite	rgb(255, 250, 240)
forestgreen	rgb( 34, 139, 34)
fuchsia	rgb(255, 0, 255)
gainsboro	rgb(220, 220, 220)
ghostwhite	rgb(248, 248, 255)
gold	rgb(255, 215, 0)
goldenrod	rgb(218, 165, 32)
gray	rgb(128, 128, 128)
grey	rgb(128, 128, 128)
green	rgb( 0, 128, 0)
greenyellow	rgb(173, 255, 47)
honeydew	rgb(240, 255, 240)
hotpink	rgb(255, 105, 180)
indianred	rgb(205, 92, 92)
indigo	rgb( 75, 0, 130)
ivory	rgb(255, 255, 240)
khaki	rgb(240, 230, 140)
lavender	rgb(230, 230, 250)
lavenderblush	rgb(255, 240, 245)
lawngreen	rgb(124, 252, 0)
lemonchiffon	rgb(255, 250, 205)
lightblue	rgb(173, 216, 230)
lightcoral	rgb(240, 128, 128)
lightcyan	rgb(224, 255, 255)
lightgoldenrodyellow	rgb(250, 250, 210)
lightgray	rgb(211, 211, 211)
lightgreen	rgb(144, 238, 144)
lightgrey	rgb(211, 211, 211)
lightpink	rgb(255, 182, 193)
lightsalmon	rgb(255, 160, 122)
lightseagreen	rgb( 32, 178, 170)
lightskyblue	rgb(135, 206, 250)
lightslategray	rgb(119, 136, 153)
lightslategrey	rgb(119, 136, 153)
lightsteelblue	rgb(176, 196, 222)
lightyellow	rgb(255, 255, 224)
lime	rgb( 0, 255, 0)
limegreen	rgb( 50, 205, 50)
linen	rgb(250, 240, 230)
magenta	rgb(255, 0, 255)
maroon	rgb(128, 0, 0)
mediumaquamarine	rgb(102, 205, 170)
mediumblue	rgb( 0, 0, 205)
mediumorchid	rgb(186, 85, 211)
mediumpurple	rgb(147, 112, 219)
mediumseagreen	rgb( 60, 179, 113)
mediumslateblue	rgb(123, 104, 238)
mediumspringgreen	rgb( 0, 250, 154)
mediumturquoise	rgb( 72, 209, 204)
mediumvioletred	rgb(199, 21, 133)
midnightblue	rgb( 25, 25, 112)
mintcream	rgb(245, 255, 250)
mistyrose	rgb(255, 228, 225)
moccasin	rgb(255, 228, 181)
navajowhite	rgb(255, 222, 173)
navy	rgb( 0, 0, 128)
oldlace	rgb(253, 245, 230)
olive	rgb(128, 128, 0)
olivedrab	rgb(107, 142, 35)
orange	rgb(255, 165, 0)
orangered	rgb(255, 69, 0)
orchid	rgb(218, 112, 214)
palegoldenrod	rgb(238, 232, 170)
palegreen	rgb(152, 251, 152)
paleturquoise	rgb(175, 238, 238)
palevioletred	rgb(219, 112, 147)
papayawhip	rgb(255, 239, 213)
peachpuff	rgb(255, 218, 185)
peru	rgb(205, 133, 63)
pink	rgb(255, 192, 203)
plum	rgb(221, 160, 221)
powderblue	rgb(176, 224, 230)
purple	rgb(128, 0, 128)
red	rgb(255, 0, 0)
rosybrown	rgb(188, 143, 143)
royalblue	rgb( 65, 105, 225)
saddlebrown	rgb(139, 69, 19)
salmon	rgb(250, 128, 114)
sandybrown	rgb(244, 164, 96)
seagreen	rgb( 46, 139, 87)
seashell	rgb(255, 245, 238)
sienna	rgb(160, 82, 45)
silver	rgb(192, 192, 192)
skyblue	rgb(135, 206, 235)
slateblue	rgb(106, 90, 205)
slategray	rgb(112, 128, 144)
slategrey	rgb(112, 128, 144)
snow	rgb(255, 250, 250)
springgreen	rgb( 0, 255, 127)
steelblue	rgb( 70, 130, 180)
tan	rgb(210, 180, 140)
teal	rgb( 0, 128, 128)
thistle	rgb(216, 191, 216)
tomato	rgb(255, 99, 71)
turquoise	rgb( 64, 224, 208)
violet	rgb(238, 130, 238)
wheat	rgb(245, 222, 179)
white	rgb(255, 255, 255)
whitesmoke	rgb(245, 245, 245)
yellow	rgb(255, 255, 0)
yellowgreen	rgb(154, 205, 50)
 	 
*/

/**
 * Return a CSS color (#rrggbb) from a string.
 *
 * Possible formats include:
 * - named colors from the DVI color set: 'Yellow', 'red'... Case sensitive.
 * - colors from the Mathematica set: 'M1'...'M9'
 * - 3-digit hex: `'#d50'`
 * - 6-digit hex: `'#dd5500'`
 * - RGB functional: `'rgb(240, 20, 10)'`
 *
 * In addition, colors can be mixed using the following syntax:
 * `<mix> = <color>![<value>][!<mix>]`
 * For example:
 * - `'Blue!20'`  = 20% blue + 80% white
 * - `'Blue!20!Black'` = 20% + 80% black
 * - `'Blue!20!Black!30!Green'` = (20% + 80% black) * 30 % + 70% green
 *
 * If the input string is prefixed with a dash, the complementary color
 * of the expression is returned.
 *
 * This creative syntax is defined by the {@link http://mirror.jmu.edu/pub/CTAN/macros/latex/contrib/xcolor/xcolor.pdf | `xcolor` LaTeX package}.
 *
 * @param s - An expression representing a color value
 * @return An RGB color expressed as a hex-triplet preceded by `#`
 */
export function defaultColorMap(s: string): string | null {
  const colorSpec = s.split('!');

  let baseRed: number;
  let baseGreen: number;
  let baseBlue: number;
  let red = 255;
  let green = 255;
  let blue = 255;
  let mix = -1;

  // If the string is prefixed with a '-', use the complementary color
  const complementary = colorSpec.length > 0 && colorSpec[0].startsWith('-');
  if (complementary) colorSpec[0] = colorSpec[0].slice(1);

  for (let i = 0; i < colorSpec.length; i++) {
    baseRed = red;
    baseGreen = green;
    baseBlue = blue;

    const colorName = colorSpec[i].trim().match(/^([A-Za-z\d]+)/)?.[1];
    const lcColorName = colorName?.toLowerCase();

    const color =
      FOREGROUND_COLORS[lcColorName] ??
      FOREGROUND_COLORS[DVIPS_TO_CHROMATIC[colorName]] ??
      MATLAB_COLORS[colorName] ??
      DVIPS_COLORS[colorName] ??
      MATHEMATICA_COLORS[colorName] ??
      colorSpec[i].trim();

    let m = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (m?.[1] && m[2] && m[3]) {
      // It's a six-digit hex number
      red = Math.max(0, Math.min(255, Number.parseInt(m[1], 16)));
      green = Math.max(0, Math.min(255, Number.parseInt(m[2], 16)));
      blue = Math.max(0, Math.min(255, Number.parseInt(m[3], 16)));
    } else {
      m = color.match(/^#([\da-f]{3})$/i);
      if (m?.[1]) {
        // It's a three-digit hex number
        const r1 = Number.parseInt(m[1][0], 16);
        const g1 = Number.parseInt(m[1][1], 16);
        const b1 = Number.parseInt(m[1][2], 16);
        red = Math.max(0, Math.min(255, r1 * 16 + r1));
        green = Math.max(0, Math.min(255, g1 * 16 + g1));
        blue = Math.max(0, Math.min(255, b1 * 16 + b1));
      } else {
        // It's a rgb functional
        m = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (m?.[1] && m[2] && m[3]) {
          red = Math.max(0, Math.min(255, Number.parseInt(m[1])));
          green = Math.max(0, Math.min(255, Number.parseInt(m[2])));
          blue = Math.max(0, Math.min(255, Number.parseInt(m[3])));
        } else {
          return null;
        }
      }
    }

    if (mix >= 0) {
      red = (1 - mix) * red + mix * baseRed;
      green = (1 - mix) * green + mix * baseGreen;
      blue = (1 - mix) * blue + mix * baseBlue;
      mix = -1;
    }

    if (i + 1 < colorSpec.length) {
      mix = Math.max(0, Math.min(100, Number.parseInt(colorSpec[++i]))) / 100;
    }
  }

  if (mix >= 0) {
    red = mix * red + (1 - mix) * baseRed;
    green = mix * green + (1 - mix) * baseGreen;
    blue = mix * blue + (1 - mix) * baseBlue;
  }

  if (complementary) {
    red = 255 - red;
    green = 255 - green;
    blue = 255 - blue;
  }

  return (
    '#' +
    ('00' + Math.round(red).toString(16)).slice(-2) +
    ('00' + Math.round(green).toString(16)).slice(-2) +
    ('00' + Math.round(blue).toString(16)).slice(-2)
  );
}

export function defaultBackgroundColorMap(s: string): string | null {
  s = s.trim();
  return (
    BACKGROUND_COLORS[s.toLowerCase()] ??
    BACKGROUND_COLORS[DVIPS_TO_CHROMATIC[s]] ??
    defaultColorMap(s)
  );
}

function parseHex(
  hex: string
): undefined | { r: number; g: number; b: number } {
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
    if (hex.length === 4) {
      result.a = parseInt(hex[3] + hex[3], 16) / 255;
    }
  } else {
    result = {
      r: parseInt(hex[0] + hex[1], 16),
      g: parseInt(hex[2] + hex[3], 16),
      b: parseInt(hex[4] + hex[5], 16),
    };
    if (hex.length === 8) {
      result.a = parseInt(hex[6] + hex[7], 16) / 255;
    }
  }
  if (result && result.a === undefined) result.a = 1.0;
  return result;
}

function hueToRgbChannel(t1: number, t2: number, hue: number): number {
  if (hue < 0) hue += 6;
  if (hue >= 6) hue -= 6;
  if (hue < 1) return (t2 - t1) * hue + t1;
  else if (hue < 3) return t2;
  else if (hue < 4) return (t2 - t1) * (4 - hue) + t1;
  return t1;
}

function hslToRgb(hsl: { h: number; s: number; l: number }): {
  r: number;
  g: number;
  b: number;
} {
  let [hue, sat, light] = [hsl.h, hsl.s, hsl.l];
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

function clampByte(v: number): number {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return Math.round(v);
}

function rgbToHexstring(rgb: { r: number; g: number; b: number }): string {
  const { r, g, b } = rgb;
  let hexString = (
    (1 << 24) +
    (clampByte(r) << 16) +
    (clampByte(g) << 8) +
    clampByte(b)
  )
    .toString(16)
    .slice(1);
  if (
    hexString[0] === hexString[1] &&
    hexString[2] === hexString[3] &&
    hexString[4] === hexString[5] &&
    hexString[6] === hexString[7]
  ) {
    hexString = hexString[0] + hexString[2] + hexString[4];
  }
  return '#' + hexString;
}

function rgbToHsl(rgb: { r: number; g: number; b: number }): {
  h: number;
  s: number;
  l: number;
} {
  let { r, g, b } = rgb;
  r = r / 255;
  g = g / 255;
  b = b / 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  let h;
  let s;
  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) {
    h += 360;
  }
  const l = (min + max) / 2;
  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }
  return { h: h, s: s, l: l };
}

export function highlight(color: string): string {
  // eslint-disable-next-line prefer-const
  let { h, s, l } = rgbToHsl(parseHex(color));
  s += 0.1;
  l -= 0.1;
  return rgbToHexstring(hslToRgb({ h, s, l }));
}
