import type { RGB, HSL, HSV, CMYK, HWB, LAB, LCH, ColorValues, HarmonyType } from "@/types/color";

// ============== PARSING ==============

export function parseHex(hex: string): RGB | null {
  const clean = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{3,8}$/.test(clean)) return null;

  let r: number, g: number, b: number, a = 255;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 4) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
    a = parseInt(clean[3] + clean[3], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else if (clean.length === 8) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
    a = parseInt(clean.slice(6, 8), 16);
  } else {
    return null;
  }

  return { r, g, b, a: a / 255 };
}

export function parseRgb(str: string): RGB | null {
  const match = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (!match) return null;
  return {
    r: Math.min(255, Math.max(0, parseInt(match[1]))),
    g: Math.min(255, Math.max(0, parseInt(match[2]))),
    b: Math.min(255, Math.max(0, parseInt(match[3]))),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

export function parseHsl(str: string): HSL | null {
  const match = str.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (!match) return null;
  return {
    h: parseFloat(match[1]) % 360,
    s: Math.min(100, Math.max(0, parseFloat(match[2]))),
    l: Math.min(100, Math.max(0, parseFloat(match[3]))),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

// ============== CONVERSIONS ==============

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

export function rgbToHex8(rgb: RGB): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const alpha = Math.round((rgb.a ?? 1) * 255);
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}${toHex(alpha)}`.toUpperCase();
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: rgb.a,
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a,
  };
}

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
    a: rgb.a,
  };
}

export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r: number, g: number, b: number;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsv.a,
  };
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

export function rgbToHwb(rgb: RGB): HWB {
  const hsl = rgbToHsl(rgb);
  const w = Math.min(rgb.r, rgb.g, rgb.b) / 255 * 100;
  const b = (1 - Math.max(rgb.r, rgb.g, rgb.b) / 255) * 100;

  return {
    h: hsl.h,
    w: Math.round(w),
    b: Math.round(b),
  };
}

export function hwbToRgb(hwb: HWB): RGB {
  const h = hwb.h;
  let w = hwb.w / 100;
  let b = hwb.b / 100;

  if (w + b >= 1) {
    const gray = w / (w + b);
    return {
      r: Math.round(gray * 255),
      g: Math.round(gray * 255),
      b: Math.round(gray * 255),
    };
  }

  const rgb = hslToRgb({ h, s: 100, l: 50 });

  return {
    r: Math.round((rgb.r / 255 * (1 - w - b) + w) * 255),
    g: Math.round((rgb.g / 255 * (1 - w - b) + w) * 255),
    b: Math.round((rgb.b / 255 * (1 - w - b) + w) * 255),
  };
}

// LAB conversion (using D65 illuminant)
export function rgbToLab(rgb: RGB): LAB {
  // RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000;
  const z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;

  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + 16/116;

  return {
    l: Math.round((116 * f(y) - 16) * 100) / 100,
    a: Math.round(500 * (f(x) - f(y)) * 100) / 100,
    b: Math.round(200 * (f(y) - f(z)) * 100) / 100,
  };
}

export function labToRgb(lab: LAB): RGB {
  const y = (lab.l + 16) / 116;
  const x = lab.a / 500 + y;
  const z = y - lab.b / 200;

  const f = (t: number) => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16/116) / 7.787;
  };

  const xr = 0.95047 * f(x);
  const yr = 1.00000 * f(y);
  const zr = 1.08883 * f(z);

  let r = xr *  3.2404542 + yr * -1.5371385 + zr * -0.4985314;
  let g = xr * -0.9692660 + yr *  1.8760108 + zr *  0.0415560;
  let b = xr *  0.0556434 + yr * -0.2040259 + zr *  1.0572252;

  const gamma = (c: number) => c > 0.0031308 ? 1.055 * Math.pow(c, 1/2.4) - 0.055 : 12.92 * c;

  return {
    r: Math.round(Math.max(0, Math.min(255, gamma(r) * 255))),
    g: Math.round(Math.max(0, Math.min(255, gamma(g) * 255))),
    b: Math.round(Math.max(0, Math.min(255, gamma(b) * 255))),
  };
}

export function labToLch(lab: LAB): LCH {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (h < 0) h += 360;

  return {
    l: Math.round(lab.l * 100) / 100,
    c: Math.round(c * 100) / 100,
    h: Math.round(h * 100) / 100,
  };
}

export function lchToLab(lch: LCH): LAB {
  const hRad = lch.h * (Math.PI / 180);
  return {
    l: lch.l,
    a: Math.round(lch.c * Math.cos(hRad) * 100) / 100,
    b: Math.round(lch.c * Math.sin(hRad) * 100) / 100,
  };
}

export function rgbToLch(rgb: RGB): LCH {
  return labToLch(rgbToLab(rgb));
}

export function lchToRgb(lch: LCH): RGB {
  return labToRgb(lchToLab(lch));
}

// ============== MAIN CONVERSION ==============

export function convertColor(rgb: RGB): ColorValues {
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const hwb = rgbToHwb(rgb);
  const lab = rgbToLab(rgb);
  const lch = rgbToLch(rgb);

  return {
    hex: rgbToHex(rgb),
    hex8: rgbToHex8(rgb),
    rgb,
    hsl,
    hsv,
    cmyk,
    hwb,
    lab,
    lch,
  };
}

// ============== COLOR HARMONIES ==============

export function getHarmonyColors(hsl: HSL, type: HarmonyType): HSL[] {
  const h = hsl.h;
  const s = hsl.s;
  const l = hsl.l;

  switch (type) {
    case "complementary":
      return [
        hsl,
        { h: (h + 180) % 360, s, l },
      ];
    case "analogous":
      return [
        { h: (h - 30 + 360) % 360, s, l },
        hsl,
        { h: (h + 30) % 360, s, l },
      ];
    case "triadic":
      return [
        hsl,
        { h: (h + 120) % 360, s, l },
        { h: (h + 240) % 360, s, l },
      ];
    case "split-complementary":
      return [
        hsl,
        { h: (h + 150) % 360, s, l },
        { h: (h + 210) % 360, s, l },
      ];
    case "tetradic":
      return [
        hsl,
        { h: (h + 90) % 360, s, l },
        { h: (h + 180) % 360, s, l },
        { h: (h + 270) % 360, s, l },
      ];
    case "square":
      return [
        hsl,
        { h: (h + 90) % 360, s, l },
        { h: (h + 180) % 360, s, l },
        { h: (h + 270) % 360, s, l },
      ];
    case "monochromatic":
      return [
        { h, s, l: Math.max(0, l - 30) },
        { h, s, l: Math.max(0, l - 15) },
        hsl,
        { h, s, l: Math.min(100, l + 15) },
        { h, s, l: Math.min(100, l + 30) },
      ];
    default:
      return [hsl];
  }
}

// ============== SHADES & TINTS ==============

export function generateShades(hsl: HSL, count: number = 9): HSL[] {
  const shades: HSL[] = [];
  const step = hsl.l / (count + 1);

  for (let i = count; i >= 1; i--) {
    shades.push({
      h: hsl.h,
      s: hsl.s,
      l: Math.round(step * i),
    });
  }

  return shades;
}

export function generateTints(hsl: HSL, count: number = 9): HSL[] {
  const tints: HSL[] = [];
  const step = (100 - hsl.l) / (count + 1);

  for (let i = 1; i <= count; i++) {
    tints.push({
      h: hsl.h,
      s: hsl.s,
      l: Math.round(hsl.l + step * i),
    });
  }

  return tints;
}

export function generatePalette(hsl: HSL, count: number = 9): HSL[] {
  const palette: HSL[] = [];
  const step = 100 / (count + 1);

  for (let i = 1; i <= count; i++) {
    palette.push({
      h: hsl.h,
      s: hsl.s,
      l: Math.round(step * i),
    });
  }

  return palette;
}

// ============== CONTRAST & ACCESSIBILITY ==============

export function getLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWCAGLevel(contrastRatio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } {
  return {
    aa: contrastRatio >= 4.5,
    aaLarge: contrastRatio >= 3,
    aaa: contrastRatio >= 7,
    aaaLarge: contrastRatio >= 4.5,
  };
}

export function getTextColor(rgb: RGB): RGB {
  const luminance = getLuminance(rgb);
  return luminance > 0.179 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

// ============== FORMAT STRINGS ==============

export function formatRgbString(rgb: RGB): string {
  if (rgb.a !== undefined && rgb.a < 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a.toFixed(2)})`;
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHslString(hsl: HSL): string {
  if (hsl.a !== undefined && hsl.a < 1) {
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a.toFixed(2)})`;
  }
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function formatHsvString(hsv: HSV): string {
  return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
}

export function formatCmykString(cmyk: CMYK): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

export function formatHwbString(hwb: HWB): string {
  return `hwb(${hwb.h}, ${hwb.w}%, ${hwb.b}%)`;
}

export function formatLabString(lab: LAB): string {
  return `lab(${lab.l}, ${lab.a}, ${lab.b})`;
}

export function formatLchString(lch: LCH): string {
  return `lch(${lch.l}, ${lch.c}, ${lch.h})`;
}

// ============== RANDOM COLOR ==============

export function randomColor(): RGB {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

// ============== NAMED COLORS ==============

export const namedColors: Record<string, string> = {
  "Rouge": "#FF0000",
  "Vert": "#00FF00",
  "Bleu": "#0000FF",
  "Jaune": "#FFFF00",
  "Cyan": "#00FFFF",
  "Magenta": "#FF00FF",
  "Orange": "#FFA500",
  "Rose": "#FFC0CB",
  "Violet": "#800080",
  "Marron": "#A52A2A",
  "Gris": "#808080",
  "Noir": "#000000",
  "Blanc": "#FFFFFF",
  "Or": "#FFD700",
  "Argent": "#C0C0C0",
  "Corail": "#FF7F50",
  "Turquoise": "#40E0D0",
  "Indigo": "#4B0082",
  "Olive": "#808000",
  "Saumon": "#FA8072",
};
