import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "MyTools - Outils Web Gratuits en Ligne",
    template: "%s | MyTools",
  },
  description:
    "Collection d'outils web gratuits et respectueux de la vie privée. Générateur QR Code, convertisseur d'images, calculatrices, Pomodoro timer, et plus de 30 outils pratiques. 100% client-side, aucune donnée envoyée sur un serveur.",
  keywords: [
    "outils en ligne",
    "outils gratuits",
    "générateur QR code",
    "convertisseur images",
    "pomodoro timer",
    "calculatrice",
    "outils web",
    "productivité",
    "développeur",
    "utilitaires",
    "vie privée",
    "client-side",
    "sans inscription",
  ],
  authors: [{ name: "MyTools" }],
  creator: "MyTools",
  publisher: "MyTools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://mytools.dev"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: "MyTools - Outils Web Gratuits en Ligne",
    description:
      "Collection d'outils web gratuits et respectueux de la vie privée. Plus de 30 outils pratiques, 100% client-side.",
    siteName: "MyTools",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyTools - Outils Web Gratuits",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyTools - Outils Web Gratuits en Ligne",
    description:
      "Collection d'outils web gratuits et respectueux de la vie privée. Plus de 30 outils pratiques.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyTools",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
