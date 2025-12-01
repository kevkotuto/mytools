export type QRContentType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard";

export type QRDotStyle = "square" | "rounded" | "dots" | "diamond" | "star";

export type QRCornerSquareStyle = "square" | "rounded" | "dots" | "classy" | "classy-rounded";

export type QRCornerDotStyle = "square" | "rounded" | "dots";

export type QRErrorLevel = "L" | "M" | "Q" | "H";

export type QRExportFormat = "png" | "svg" | "jpg" | "webp";

export interface QRConfig {
  content: string;
  contentType: QRContentType;
  size: number;
  errorLevel: QRErrorLevel;
  // Colors
  foregroundColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  // Gradient
  useGradient: boolean;
  gradientType: "linear" | "radial";
  gradientColor1: string;
  gradientColor2: string;
  gradientRotation: number;
  // Dot style
  dotStyle: QRDotStyle;
  // Corner squares (3 big squares)
  cornerSquareStyle: QRCornerSquareStyle;
  cornerSquareColor: string;
  useCustomCornerSquareColor: boolean;
  // Corner dots (inner dots of corners)
  cornerDotStyle: QRCornerDotStyle;
  cornerDotColor: string;
  useCustomCornerDotColor: boolean;
  // Logo
  logo: string | null;
  logoSize: number;
  logoMargin: number;
  logoBorderRadius: number;
  // Frame
  showFrame: boolean;
  frameColor: string;
  frameText: string;
  frameTextColor: string;
  // Other
  margin: number;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

export interface WifiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface SMSData {
  phone: string;
  message: string;
}

export const contentTypeLabels: Record<QRContentType, string> = {
  url: "URL / Lien",
  text: "Texte libre",
  email: "Email",
  phone: "Téléphone",
  sms: "SMS",
  wifi: "WiFi",
  vcard: "Carte de visite",
};

export const dotStyleLabels: Record<QRDotStyle, string> = {
  square: "Carré",
  rounded: "Arrondi",
  dots: "Points",
  diamond: "Losange",
  star: "Étoile",
};

export const cornerSquareStyleLabels: Record<QRCornerSquareStyle, string> = {
  square: "Carré",
  rounded: "Arrondi",
  dots: "Points",
  classy: "Classique",
  "classy-rounded": "Classique arrondi",
};

export const cornerDotStyleLabels: Record<QRCornerDotStyle, string> = {
  square: "Carré",
  rounded: "Rond",
  dots: "Point",
};

export const errorLevelLabels: Record<QRErrorLevel, string> = {
  L: "Bas (7%)",
  M: "Moyen (15%)",
  Q: "Quartile (25%)",
  H: "Haut (30%)",
};

export const defaultConfig: QRConfig = {
  content: "",
  contentType: "url",
  size: 300,
  errorLevel: "M",
  foregroundColor: "#000000",
  backgroundColor: "#ffffff",
  transparentBackground: false,
  useGradient: false,
  gradientType: "linear",
  gradientColor1: "#000000",
  gradientColor2: "#3b82f6",
  gradientRotation: 0,
  dotStyle: "square",
  cornerSquareStyle: "square",
  cornerSquareColor: "#000000",
  useCustomCornerSquareColor: false,
  cornerDotStyle: "square",
  cornerDotColor: "#000000",
  useCustomCornerDotColor: false,
  logo: null,
  logoSize: 60,
  logoMargin: 5,
  logoBorderRadius: 8,
  showFrame: false,
  frameColor: "#000000",
  frameText: "SCAN ME",
  frameTextColor: "#ffffff",
  margin: 4,
};
