// Vectorization modes
export type VectorizationMode = "bw" | "color" | "outline";

// Detail level presets
export type DetailLevel = "low" | "medium" | "high" | "custom";

export interface VectorizerConfig {
  // Mode
  mode: VectorizationMode;

  // Black & White options
  bwThreshold: number; // 0-255, default 128
  invertColors: boolean;

  // Color mode options
  numberOfColors: number; // 2-64, default 16
  colorQuantization: "sampling" | "palette";

  // Detail settings
  detailLevel: DetailLevel;
  lineThreshold: number; // Line simplification (0.1-10.0)
  quadThreshold: number; // Spline fitting (0.1-10.0)
  pathOmitThreshold: number; // Min path length to keep (0-100)

  // Smoothing
  blurRadius: number; // 0-5, pre-processing blur
  cornerThreshold: number; // Corner detection sensitivity (0-180)

  // Output
  strokeWidth: number; // For outline mode (0.5-5)
  scaleFactor: number; // Output scale (0.1-10)
}

export const defaultVectorizerConfig: VectorizerConfig = {
  mode: "bw",
  bwThreshold: 128,
  invertColors: false,
  numberOfColors: 16,
  colorQuantization: "sampling",
  detailLevel: "medium",
  lineThreshold: 1.0,
  quadThreshold: 1.0,
  pathOmitThreshold: 8,
  blurRadius: 0,
  cornerThreshold: 90,
  strokeWidth: 1,
  scaleFactor: 1,
};

export const detailPresets: Record<DetailLevel, Partial<VectorizerConfig>> = {
  low: { lineThreshold: 4.0, quadThreshold: 4.0, pathOmitThreshold: 16 },
  medium: { lineThreshold: 1.0, quadThreshold: 1.0, pathOmitThreshold: 8 },
  high: { lineThreshold: 0.5, quadThreshold: 0.5, pathOmitThreshold: 4 },
  custom: {},
};

export const modeLabels: Record<VectorizationMode, string> = {
  bw: "Noir & Blanc",
  color: "Couleurs",
  outline: "Contours",
};

export const detailLabels: Record<DetailLevel, string> = {
  low: "Bas",
  medium: "Moyen",
  high: "Haut",
  custom: "Personnalisé",
};

export interface VectorizerImageInfo {
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
}
