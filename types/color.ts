// Types pour le Color Converter

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsv" | "cmyk" | "hwb" | "lab" | "lch";

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
  a?: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface HWB {
  h: number;
  w: number;
  b: number;
}

export interface LAB {
  l: number;
  a: number;
  b: number;
}

export interface LCH {
  l: number;
  c: number;
  h: number;
}

export interface ColorValues {
  hex: string;
  hex8: string;
  rgb: RGB;
  hsl: HSL;
  hsv: HSV;
  cmyk: CMYK;
  hwb: HWB;
  lab: LAB;
  lch: LCH;
}

export type HarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "square"
  | "monochromatic";

export const harmonyLabels: Record<HarmonyType, string> = {
  complementary: "Complémentaire",
  analogous: "Analogues",
  triadic: "Triadique",
  "split-complementary": "Complémentaire divisée",
  tetradic: "Tétradique",
  square: "Carré",
  monochromatic: "Monochromatique",
};

export const formatLabels: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  hsv: "HSV",
  cmyk: "CMYK",
  hwb: "HWB",
  lab: "LAB",
  lch: "LCH",
};
