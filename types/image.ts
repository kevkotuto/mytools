// Types pour le Image Converter

export type ImageFormat = "png" | "jpeg" | "webp" | "gif" | "bmp" | "ico";

export type ResizeMode = "percentage" | "dimensions" | "width" | "height";

export type FlipDirection = "horizontal" | "vertical" | "both";

export type RotationAngle = 0 | 90 | 180 | 270;

export interface ImageConfig {
  format: ImageFormat;
  quality: number; // 0-100 pour JPEG/WebP
  resizeMode: ResizeMode;
  percentage: number;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  rotation: RotationAngle;
  flip: FlipDirection | null;
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
  blur: number; // 0-20
  brightness: number; // 0-200 (100 = normal)
  contrast: number; // 0-200 (100 = normal)
  saturation: number; // 0-200 (100 = normal)
  hue: number; // 0-360
  opacity: number; // 0-100
  sharpen: boolean;
  backgroundColor: string;
  removeBackground: boolean;
  borderRadius: number;
  padding: number;
  paddingColor: string;
}

export const defaultImageConfig: ImageConfig = {
  format: "png",
  quality: 92,
  resizeMode: "percentage",
  percentage: 100,
  width: 800,
  height: 600,
  maintainAspectRatio: true,
  rotation: 0,
  flip: null,
  grayscale: false,
  sepia: false,
  invert: false,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  opacity: 100,
  sharpen: false,
  backgroundColor: "#ffffff",
  removeBackground: false,
  borderRadius: 0,
  padding: 0,
  paddingColor: "#ffffff",
};

export const formatLabels: Record<ImageFormat, string> = {
  png: "PNG (sans perte)",
  jpeg: "JPEG (avec perte)",
  webp: "WebP (moderne)",
  gif: "GIF (256 couleurs)",
  bmp: "BMP (bitmap)",
  ico: "ICO (icône)",
};

export const formatMimeTypes: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

export interface ImageInfo {
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
}
