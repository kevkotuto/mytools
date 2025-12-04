// Wireframe Paper Size configurations
export interface PaperSize {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  dpi: number;
}

export const paperSizes: PaperSize[] = [
  { id: "a4", name: "A4", width: 210, height: 297, dpi: 96 },
  { id: "a3", name: "A3", width: 297, height: 420, dpi: 96 },
  { id: "letter", name: "Letter (US)", width: 216, height: 279, dpi: 96 },
  { id: "legal", name: "Legal (US)", width: 216, height: 356, dpi: 96 },
  { id: "tabloid", name: "Tabloid (US)", width: 279, height: 432, dpi: 96 },
];

// Device Frame configurations
export interface DeviceFrame {
  id: string;
  name: string;
  category: DeviceCategory;
  screenWidth: number; // in px
  screenHeight: number; // in px
  frameWidth?: number; // total frame width including bezels
  frameHeight?: number;
  cornerRadius?: number;
  hasNotch?: boolean;
  hasDynamicIsland?: boolean;
  hasHomeButton?: boolean;
  bezelTop?: number;
  bezelBottom?: number;
  bezelSide?: number;
}

export type DeviceCategory =
  | "iphone"
  | "android"
  | "tablet"
  | "watch"
  | "desktop"
  | "browser";

export const deviceCategoryLabels: Record<DeviceCategory, string> = {
  iphone: "iPhone",
  android: "Android",
  tablet: "Tablettes",
  watch: "Montres",
  desktop: "Desktop",
  browser: "Navigateurs",
};

// iPhone Models
export const iphoneDevices: DeviceFrame[] = [
  // iPhone 16 Pro Max
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    category: "iphone",
    screenWidth: 440,
    screenHeight: 956,
    cornerRadius: 55,
    hasDynamicIsland: true,
  },
  // iPhone 16 Pro
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    category: "iphone",
    screenWidth: 402,
    screenHeight: 874,
    cornerRadius: 55,
    hasDynamicIsland: true,
  },
  // iPhone 16 / 16 Plus
  {
    id: "iphone-16",
    name: "iPhone 16 / 15 / 14",
    category: "iphone",
    screenWidth: 390,
    screenHeight: 844,
    cornerRadius: 47,
    hasDynamicIsland: true,
  },
  // iPhone SE
  {
    id: "iphone-se",
    name: "iPhone SE",
    category: "iphone",
    screenWidth: 375,
    screenHeight: 667,
    cornerRadius: 0,
    hasHomeButton: true,
  },
  // iPhone X/11/12/13 style
  {
    id: "iphone-x",
    name: "iPhone X / 11 / 12 / 13",
    category: "iphone",
    screenWidth: 375,
    screenHeight: 812,
    cornerRadius: 40,
    hasNotch: true,
  },
];

// Android Models
export const androidDevices: DeviceFrame[] = [
  {
    id: "pixel-8-pro",
    name: "Pixel 8 Pro",
    category: "android",
    screenWidth: 412,
    screenHeight: 915,
    cornerRadius: 40,
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    category: "android",
    screenWidth: 393,
    screenHeight: 873,
    cornerRadius: 40,
  },
  {
    id: "samsung-s24-ultra",
    name: "Samsung S24 Ultra",
    category: "android",
    screenWidth: 412,
    screenHeight: 915,
    cornerRadius: 35,
  },
  {
    id: "samsung-s24",
    name: "Samsung S24",
    category: "android",
    screenWidth: 360,
    screenHeight: 780,
    cornerRadius: 35,
  },
  {
    id: "android-generic",
    name: "Android Générique",
    category: "android",
    screenWidth: 360,
    screenHeight: 800,
    cornerRadius: 20,
  },
];

// Tablet Models
export const tabletDevices: DeviceFrame[] = [
  {
    id: "ipad-pro-13",
    name: "iPad Pro 13\"",
    category: "tablet",
    screenWidth: 1024,
    screenHeight: 1366,
    cornerRadius: 18,
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11\"",
    category: "tablet",
    screenWidth: 834,
    screenHeight: 1194,
    cornerRadius: 18,
  },
  {
    id: "ipad-air",
    name: "iPad Air",
    category: "tablet",
    screenWidth: 820,
    screenHeight: 1180,
    cornerRadius: 18,
  },
  {
    id: "ipad-mini",
    name: "iPad Mini",
    category: "tablet",
    screenWidth: 744,
    screenHeight: 1133,
    cornerRadius: 18,
  },
  {
    id: "ipad-10",
    name: "iPad (10th gen)",
    category: "tablet",
    screenWidth: 820,
    screenHeight: 1180,
    cornerRadius: 18,
  },
  {
    id: "android-tablet",
    name: "Android Tablet",
    category: "tablet",
    screenWidth: 800,
    screenHeight: 1280,
    cornerRadius: 8,
  },
];

// Watch Models
export const watchDevices: DeviceFrame[] = [
  {
    id: "apple-watch-ultra",
    name: "Apple Watch Ultra",
    category: "watch",
    screenWidth: 205,
    screenHeight: 251,
    cornerRadius: 40,
  },
  {
    id: "apple-watch-49mm",
    name: "Apple Watch 49mm",
    category: "watch",
    screenWidth: 176,
    screenHeight: 215,
    cornerRadius: 36,
  },
  {
    id: "apple-watch-45mm",
    name: "Apple Watch 45mm",
    category: "watch",
    screenWidth: 198,
    screenHeight: 242,
    cornerRadius: 36,
  },
  {
    id: "apple-watch-41mm",
    name: "Apple Watch 41mm",
    category: "watch",
    screenWidth: 176,
    screenHeight: 215,
    cornerRadius: 32,
  },
];

// Browser/Desktop
export const browserDevices: DeviceFrame[] = [
  {
    id: "browser-landscape",
    name: "Browser (Paysage)",
    category: "browser",
    screenWidth: 1440,
    screenHeight: 900,
    cornerRadius: 8,
  },
  {
    id: "browser-portrait",
    name: "Browser (Portrait)",
    category: "browser",
    screenWidth: 900,
    screenHeight: 1200,
    cornerRadius: 8,
  },
  {
    id: "desktop-1920",
    name: "Desktop 1920x1080",
    category: "desktop",
    screenWidth: 1920,
    screenHeight: 1080,
    cornerRadius: 0,
  },
  {
    id: "desktop-1366",
    name: "Desktop 1366x768",
    category: "desktop",
    screenWidth: 1366,
    screenHeight: 768,
    cornerRadius: 0,
  },
  {
    id: "macbook-pro",
    name: "MacBook Pro 14\"",
    category: "desktop",
    screenWidth: 1512,
    screenHeight: 982,
    cornerRadius: 10,
  },
];

// All devices grouped
export const allDevices = [
  ...iphoneDevices,
  ...androidDevices,
  ...tabletDevices,
  ...watchDevices,
  ...browserDevices,
];

// Template Layouts
export interface TemplateLayout {
  id: string;
  name: string;
  description: string;
  deviceCount: number;
  arrangement: "horizontal" | "vertical" | "grid" | "extended";
  showTitle?: boolean;
  showNotes?: boolean;
  extended?: boolean; // For scrollable screens
}

export const templateLayouts: TemplateLayout[] = [
  {
    id: "single",
    name: "Single Mobile",
    description: "Un seul écran mobile avec espace pour annotations",
    deviceCount: 1,
    arrangement: "vertical",
    showTitle: true,
    showNotes: true,
  },
  {
    id: "2x-horizontal",
    name: "2x UP Mobiles",
    description: "Deux écrans mobiles côte à côte",
    deviceCount: 2,
    arrangement: "horizontal",
    showTitle: true,
  },
  {
    id: "3x-horizontal",
    name: "3x UP Mobiles",
    description: "Trois écrans mobiles en ligne",
    deviceCount: 3,
    arrangement: "horizontal",
    showTitle: true,
  },
  {
    id: "4x-grid",
    name: "4x Grid",
    description: "Quatre écrans en grille 2x2",
    deviceCount: 4,
    arrangement: "grid",
    showTitle: true,
  },
  {
    id: "6x-grid",
    name: "6x Grid",
    description: "Six écrans en grille 3x2",
    deviceCount: 6,
    arrangement: "grid",
    showTitle: true,
  },
  {
    id: "2x-extended",
    name: "2x UP Extended",
    description: "Deux écrans étendus pour le défilement",
    deviceCount: 2,
    arrangement: "vertical",
    extended: true,
    showTitle: true,
  },
  {
    id: "flow-3",
    name: "User Flow (3 étapes)",
    description: "Trois écrans avec flèches de connexion",
    deviceCount: 3,
    arrangement: "horizontal",
    showTitle: true,
  },
  {
    id: "flow-5",
    name: "User Flow (5 étapes)",
    description: "Cinq écrans avec flèches pour flux utilisateur",
    deviceCount: 5,
    arrangement: "horizontal",
    showTitle: true,
  },
];

// Grid configurations
export interface GridConfig {
  enabled: boolean;
  type: "dots" | "lines" | "squares" | "none";
  spacing: number; // in px
  color: string;
  opacity: number;
}

export const defaultGridConfig: GridConfig = {
  enabled: true,
  type: "dots",
  spacing: 8,
  color: "#000000",
  opacity: 0.15,
};

// Wireframe Configuration
export interface WireframeConfig {
  paper: PaperSize;
  orientation: "portrait" | "landscape";
  device: DeviceFrame;
  template: TemplateLayout;
  grid: GridConfig;
  showDeviceFrame: boolean;
  showStatusBar: boolean;
  showHomeIndicator: boolean;
  showBrowserBar: boolean;
  frameColor: string;
  backgroundColor: string;
  pageTitle: string;
  includePageNumbers: boolean;
  margin: number; // in mm
}

export const defaultWireframeConfig: WireframeConfig = {
  paper: paperSizes[0], // A4
  orientation: "portrait",
  device: iphoneDevices[2], // iPhone 16
  template: templateLayouts[1], // 2x horizontal
  grid: defaultGridConfig,
  showDeviceFrame: true,
  showStatusBar: true,
  showHomeIndicator: true,
  showBrowserBar: false,
  frameColor: "#1a1a1a",
  backgroundColor: "#ffffff",
  pageTitle: "",
  includePageNumbers: false,
  margin: 10,
};
