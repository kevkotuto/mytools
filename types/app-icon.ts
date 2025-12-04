export interface IconSize {
  name: string;
  width: number;
  height: number;
  scale?: string;
  idiom?: string;
  filename?: string;
}

export interface PlatformConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sizes: IconSize[];
  filenamePrefix?: string;
  folderName?: string;
}

// iOS Icon Sizes (Apple Human Interface Guidelines)
export const iPhoneSizes: IconSize[] = [
  { name: "iPhone Notification @2x", width: 40, height: 40, scale: "2x", idiom: "iphone" },
  { name: "iPhone Notification @3x", width: 60, height: 60, scale: "3x", idiom: "iphone" },
  { name: "iPhone Settings @2x", width: 58, height: 58, scale: "2x", idiom: "iphone" },
  { name: "iPhone Settings @3x", width: 87, height: 87, scale: "3x", idiom: "iphone" },
  { name: "iPhone Spotlight @2x", width: 80, height: 80, scale: "2x", idiom: "iphone" },
  { name: "iPhone Spotlight @3x", width: 120, height: 120, scale: "3x", idiom: "iphone" },
  { name: "iPhone App @2x", width: 120, height: 120, scale: "2x", idiom: "iphone" },
  { name: "iPhone App @3x", width: 180, height: 180, scale: "3x", idiom: "iphone" },
  { name: "App Store iOS", width: 1024, height: 1024, scale: "1x", idiom: "ios-marketing" },
];

export const iPadSizes: IconSize[] = [
  { name: "iPad Notification @1x", width: 20, height: 20, scale: "1x", idiom: "ipad" },
  { name: "iPad Notification @2x", width: 40, height: 40, scale: "2x", idiom: "ipad" },
  { name: "iPad Settings @1x", width: 29, height: 29, scale: "1x", idiom: "ipad" },
  { name: "iPad Settings @2x", width: 58, height: 58, scale: "2x", idiom: "ipad" },
  { name: "iPad Spotlight @1x", width: 40, height: 40, scale: "1x", idiom: "ipad" },
  { name: "iPad Spotlight @2x", width: 80, height: 80, scale: "2x", idiom: "ipad" },
  { name: "iPad App @1x", width: 76, height: 76, scale: "1x", idiom: "ipad" },
  { name: "iPad App @2x", width: 152, height: 152, scale: "2x", idiom: "ipad" },
  { name: "iPad Pro App @2x", width: 167, height: 167, scale: "2x", idiom: "ipad" },
];

export const watchOSSizes: IconSize[] = [
  { name: "Apple Watch 38mm", width: 80, height: 80, scale: "2x", idiom: "watch" },
  { name: "Apple Watch 40mm", width: 88, height: 88, scale: "2x", idiom: "watch" },
  { name: "Apple Watch 41mm", width: 92, height: 92, scale: "2x", idiom: "watch" },
  { name: "Apple Watch 42mm", width: 80, height: 80, scale: "2x", idiom: "watch" },
  { name: "Apple Watch 44mm", width: 100, height: 100, scale: "2x", idiom: "watch" },
  { name: "Apple Watch 45mm", width: 102, height: 102, scale: "2x", idiom: "watch" },
  { name: "Apple Watch 49mm", width: 108, height: 108, scale: "2x", idiom: "watch" },
  { name: "App Store watchOS", width: 1024, height: 1024, scale: "1x", idiom: "watch-marketing" },
];

export const macOSSizes: IconSize[] = [
  { name: "macOS 16x16 @1x", width: 16, height: 16, scale: "1x", idiom: "mac" },
  { name: "macOS 16x16 @2x", width: 32, height: 32, scale: "2x", idiom: "mac" },
  { name: "macOS 32x32 @1x", width: 32, height: 32, scale: "1x", idiom: "mac" },
  { name: "macOS 32x32 @2x", width: 64, height: 64, scale: "2x", idiom: "mac" },
  { name: "macOS 128x128 @1x", width: 128, height: 128, scale: "1x", idiom: "mac" },
  { name: "macOS 128x128 @2x", width: 256, height: 256, scale: "2x", idiom: "mac" },
  { name: "macOS 256x256 @1x", width: 256, height: 256, scale: "1x", idiom: "mac" },
  { name: "macOS 256x256 @2x", width: 512, height: 512, scale: "2x", idiom: "mac" },
  { name: "macOS 512x512 @1x", width: 512, height: 512, scale: "1x", idiom: "mac" },
  { name: "macOS 512x512 @2x", width: 1024, height: 1024, scale: "2x", idiom: "mac" },
];

// Android Legacy Icon Sizes (for older Android versions)
export const androidLegacySizes: IconSize[] = [
  { name: "mdpi (48x48)", width: 48, height: 48, filename: "mipmap-mdpi" },
  { name: "hdpi (72x72)", width: 72, height: 72, filename: "mipmap-hdpi" },
  { name: "xhdpi (96x96)", width: 96, height: 96, filename: "mipmap-xhdpi" },
  { name: "xxhdpi (144x144)", width: 144, height: 144, filename: "mipmap-xxhdpi" },
  { name: "xxxhdpi (192x192)", width: 192, height: 192, filename: "mipmap-xxxhdpi" },
  { name: "Play Store (512x512)", width: 512, height: 512, filename: "playstore" },
];

// Android Adaptive Icon Sizes (108dp base, scales per density)
// The adaptive icon layers are 108x108dp with a 66x66dp safe zone centered
export const androidAdaptiveSizes: IconSize[] = [
  { name: "mdpi (108x108)", width: 108, height: 108, filename: "mipmap-mdpi" },
  { name: "hdpi (162x162)", width: 162, height: 162, filename: "mipmap-hdpi" },
  { name: "xhdpi (216x216)", width: 216, height: 216, filename: "mipmap-xhdpi" },
  { name: "xxhdpi (324x324)", width: 324, height: 324, filename: "mipmap-xxhdpi" },
  { name: "xxxhdpi (432x432)", width: 432, height: 432, filename: "mipmap-xxxhdpi" },
];

// Combined Android sizes for backward compatibility
export const androidSizes: IconSize[] = androidLegacySizes;

// Web/PWA Icon Sizes
export const webSizes: IconSize[] = [
  { name: "favicon-16", width: 16, height: 16, filename: "favicon-16x16" },
  { name: "favicon-32", width: 32, height: 32, filename: "favicon-32x32" },
  { name: "favicon-48", width: 48, height: 48, filename: "favicon-48x48" },
  { name: "apple-touch-icon", width: 180, height: 180, filename: "apple-touch-icon" },
  { name: "android-chrome-192", width: 192, height: 192, filename: "android-chrome-192x192" },
  { name: "android-chrome-512", width: 512, height: 512, filename: "android-chrome-512x512" },
  { name: "mstile-150x150", width: 150, height: 150, filename: "mstile-150x150" },
  { name: "mstile-310x310", width: 310, height: 310, filename: "mstile-310x310" },
];

// Favicon ICO sizes
export const faviconIcoSizes: IconSize[] = [
  { name: "16x16", width: 16, height: 16 },
  { name: "32x32", width: 32, height: 32 },
  { name: "48x48", width: 48, height: 48 },
];

export const defaultPlatforms: PlatformConfig[] = [
  {
    id: "iphone",
    name: "iPhone",
    description: `${iPhoneSizes.length} tailles différentes`,
    enabled: true,
    sizes: iPhoneSizes,
    folderName: "AppIcon.appiconset",
  },
  {
    id: "ipad",
    name: "iPad",
    description: `${iPadSizes.length} tailles différentes`,
    enabled: true,
    sizes: iPadSizes,
    folderName: "AppIcon.appiconset",
  },
  {
    id: "watchos",
    name: "watchOS",
    description: `${watchOSSizes.length} tailles différentes`,
    enabled: true,
    sizes: watchOSSizes,
    folderName: "AppIcon.appiconset",
  },
  {
    id: "macos",
    name: "macOS",
    description: `${macOSSizes.length} tailles différentes`,
    enabled: true,
    sizes: macOSSizes,
    folderName: "AppIcon.appiconset",
  },
  {
    id: "android",
    name: "Android",
    description: `${androidSizes.length} tailles différentes`,
    enabled: true,
    sizes: androidSizes,
    filenamePrefix: "ic_launcher",
  },
  {
    id: "web",
    name: "Web / PWA",
    description: `${webSizes.length} tailles + manifest.json`,
    enabled: true,
    sizes: webSizes,
    folderName: "web",
  },
];

export interface AppIconConfig {
  platforms: PlatformConfig[];
  androidFilename: string;
  backgroundColor: string;
  cornerRadius: number;
  padding: number;
  generateContentsJson: boolean;
  generateManifest: boolean;
  // Android Adaptive Icons
  generateAdaptiveIcons: boolean;
  adaptiveBackgroundColor: string;
  adaptiveForegroundPadding: number; // Extra padding for foreground (safe zone)
}

export const defaultAppIconConfig: AppIconConfig = {
  platforms: defaultPlatforms,
  androidFilename: "ic_launcher",
  backgroundColor: "#ffffff",
  cornerRadius: 0,
  padding: 0,
  generateContentsJson: true,
  generateManifest: true,
  // Android Adaptive Icons defaults
  generateAdaptiveIcons: true,
  adaptiveBackgroundColor: "#ffffff",
  adaptiveForegroundPadding: 20, // 20% padding to fit in safe zone
};
