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

export type Color = string | RgbColor | OklchColor | OklabColor;
