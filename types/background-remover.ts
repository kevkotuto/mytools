export type RemovalMode = "auto" | "manual";

export type BackgroundType = "transparent" | "color" | "image";

export type ProcessingState =
  | "idle"
  | "loading-model"
  | "processing"
  | "done"
  | "error";

export interface BackgroundRemoverConfig {
  // Mode
  mode: RemovalMode;

  // Auto mode settings
  modelQuality: "small" | "medium";

  // Manual mode settings (magic wand)
  tolerance: number; // 0-100, color tolerance
  contiguous: boolean; // Only select connected areas

  // Edge refinement
  featherAmount: number; // 0-20px, edge blur
  edgeSmoothing: number; // 0-10, edge smoothing
  expandContract: number; // -10 to +10, expand/contract selection

  // Background replacement
  backgroundType: BackgroundType;
  backgroundColor: string; // For solid color background
  backgroundImageUrl: string | null; // For custom image background

  // Output
  outputFormat: "png"; // Always PNG for transparency
}

export const defaultBackgroundRemoverConfig: BackgroundRemoverConfig = {
  mode: "auto",
  modelQuality: "medium",
  tolerance: 32,
  contiguous: true,
  featherAmount: 0,
  edgeSmoothing: 2,
  expandContract: 0,
  backgroundType: "transparent",
  backgroundColor: "#ffffff",
  backgroundImageUrl: null,
  outputFormat: "png",
};

export const modeLabels: Record<RemovalMode, string> = {
  auto: "Automatique (IA)",
  manual: "Manuel (Baguette)",
};

export const backgroundTypeLabels: Record<BackgroundType, string> = {
  transparent: "Transparent",
  color: "Couleur unie",
  image: "Image personnalisée",
};

export const modelQualityLabels: Record<"small" | "medium", string> = {
  small: "Rapide",
  medium: "Qualité",
};

export interface BackgroundRemoverImageInfo {
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
}
