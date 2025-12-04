"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  RotateCcw,
  ImageIcon,
  Check,
  Package,
} from "lucide-react";
import JSZip from "jszip";

interface FaviconSize {
  size: number;
  name: string;
  description: string;
  selected: boolean;
}

const defaultSizes: FaviconSize[] = [
  { size: 16, name: "favicon-16x16.png", description: "Standard favicon", selected: true },
  { size: 32, name: "favicon-32x32.png", description: "Standard favicon", selected: true },
  { size: 48, name: "favicon-48x48.png", description: "Windows site icon", selected: true },
  { size: 64, name: "favicon-64x64.png", description: "Safari Reading List", selected: false },
  { size: 96, name: "favicon-96x96.png", description: "Google TV", selected: false },
  { size: 128, name: "favicon-128x128.png", description: "Chrome Web Store", selected: false },
  { size: 180, name: "apple-touch-icon.png", description: "Apple Touch Icon", selected: true },
  { size: 192, name: "android-chrome-192x192.png", description: "Android Chrome", selected: true },
  { size: 512, name: "android-chrome-512x512.png", description: "Android Chrome", selected: true },
];

export default function FaviconGeneratorPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [sizes, setSizes] = useState<FaviconSize[]>(defaultSizes);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [borderRadius, setBorderRadius] = useState(0);
  const [padding, setPadding] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const toggleSize = (index: number) => {
    setSizes(prev => prev.map((size, i) =>
      i === index ? { ...size, selected: !size.selected } : size
    ));
  };

  const selectAll = () => {
    setSizes(prev => prev.map(size => ({ ...size, selected: true })));
  };

  const deselectAll = () => {
    setSizes(prev => prev.map(size => ({ ...size, selected: false })));
  };

  const generateFavicon = async (
    img: HTMLImageElement,
    size: number,
    canvas: HTMLCanvasElement
  ): Promise<Blob> => {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = backgroundColor;
    if (borderRadius > 0) {
      const r = (borderRadius / 100) * (size / 2);
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(size - r, 0);
      ctx.quadraticCurveTo(size, 0, size, r);
      ctx.lineTo(size, size - r);
      ctx.quadraticCurveTo(size, size, size - r, size);
      ctx.lineTo(r, size);
      ctx.quadraticCurveTo(0, size, 0, size - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.clip();
    } else {
      ctx.fillRect(0, 0, size, size);
    }

    // Image with padding
    const paddingPx = (padding / 100) * size;
    const drawSize = size - paddingPx * 2;
    ctx.drawImage(img, paddingPx, paddingPx, drawSize, drawSize);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    });
  };

  const generateICO = async (
    img: HTMLImageElement,
    canvas: HTMLCanvasElement
  ): Promise<Blob> => {
    const icoSizes = [16, 32, 48];
    const images: { size: number; data: Uint8Array }[] = [];

    for (const size of icoSizes) {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      images.push({ size, data: new Uint8Array(imageData.data.buffer) });
    }

    // Create ICO file
    const headerSize = 6;
    const directorySize = 16 * images.length;
    let dataOffset = headerSize + directorySize;

    const entries: { size: number; offset: number; data: Uint8Array }[] = [];
    for (const img of images) {
      const bmpDataSize = 40 + img.size * img.size * 4;
      entries.push({ size: img.size, offset: dataOffset, data: img.data });
      dataOffset += bmpDataSize;
    }

    const totalSize = dataOffset;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // ICO header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, images.length, true); // Number of images

    // Directory entries
    let offset = headerSize;
    for (const entry of entries) {
      view.setUint8(offset, entry.size); // Width
      view.setUint8(offset + 1, entry.size); // Height
      view.setUint8(offset + 2, 0); // Color palette
      view.setUint8(offset + 3, 0); // Reserved
      view.setUint16(offset + 4, 1, true); // Color planes
      view.setUint16(offset + 6, 32, true); // Bits per pixel
      view.setUint32(offset + 8, 40 + entry.size * entry.size * 4, true); // Size
      view.setUint32(offset + 12, entry.offset, true); // Offset
      offset += 16;
    }

    // Image data (BMP format)
    for (const entry of entries) {
      const size = entry.size;
      const bmpOffset = entry.offset;

      // BMP header
      view.setUint32(bmpOffset, 40, true); // Header size
      view.setInt32(bmpOffset + 4, size, true); // Width
      view.setInt32(bmpOffset + 8, size * 2, true); // Height (doubled for mask)
      view.setUint16(bmpOffset + 12, 1, true); // Planes
      view.setUint16(bmpOffset + 14, 32, true); // Bits per pixel
      view.setUint32(bmpOffset + 16, 0, true); // Compression
      view.setUint32(bmpOffset + 20, size * size * 4, true); // Image size
      view.setInt32(bmpOffset + 24, 0, true); // X pixels per meter
      view.setInt32(bmpOffset + 28, 0, true); // Y pixels per meter
      view.setUint32(bmpOffset + 32, 0, true); // Colors used
      view.setUint32(bmpOffset + 36, 0, true); // Important colors

      // Pixel data (bottom-up, BGRA)
      const pixelOffset = bmpOffset + 40;
      for (let y = size - 1; y >= 0; y--) {
        for (let x = 0; x < size; x++) {
          const srcIdx = (y * size + x) * 4;
          const dstIdx = pixelOffset + ((size - 1 - y) * size + x) * 4;
          view.setUint8(dstIdx, entry.data[srcIdx + 2]); // B
          view.setUint8(dstIdx + 1, entry.data[srcIdx + 1]); // G
          view.setUint8(dstIdx + 2, entry.data[srcIdx]); // R
          view.setUint8(dstIdx + 3, entry.data[srcIdx + 3]); // A
        }
      }
    }

    return new Blob([buffer], { type: "image/x-icon" });
  };

  const generateWebmanifest = (): string => {
    return JSON.stringify({
      name: "My App",
      short_name: "App",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: backgroundColor,
      background_color: backgroundColor,
      display: "standalone"
    }, null, 2);
  };

  const generateBrowserconfig = (): string => {
    return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${backgroundColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
  };

  const generateHTMLCode = (): string => {
    return `<!-- Favicons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="msapplication-TileColor" content="${backgroundColor}">
<meta name="theme-color" content="${backgroundColor}">`;
  };

  const downloadAll = async () => {
    if (!imageUrl) return;

    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const zip = new JSZip();

      // Generate selected PNG sizes
      for (const sizeConfig of sizes.filter(s => s.selected)) {
        const blob = await generateFavicon(img, sizeConfig.size, canvas);
        zip.file(sizeConfig.name, blob);
      }

      // Generate ICO
      const icoBlob = await generateICO(img, canvas);
      zip.file("favicon.ico", icoBlob);

      // Generate config files
      zip.file("site.webmanifest", generateWebmanifest());
      zip.file("browserconfig.xml", generateBrowserconfig());
      zip.file("html-code.txt", generateHTMLCode());

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favicons.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating favicons:", error);
      alert("Erreur lors de la génération des favicons");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImageUrl("");
    setSizes(defaultSizes);
    setBackgroundColor("#ffffff");
    setBorderRadius(0);
    setPadding(0);
  };

  const selectedCount = sizes.filter(s => s.selected).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-lg font-semibold">Favicon Generator</h1>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          {!imageFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 hover:border-primary/50"
            >
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">Déposez une image carrée</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Idéalement 512x512 ou plus
              </p>
              <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                Choisir un fichier
              </label>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
              {/* Preview & Settings */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Aperçu</h3>
                  <div className="flex justify-center">
                    <div
                      className="overflow-hidden"
                      style={{
                        backgroundColor,
                        borderRadius: `${borderRadius}%`,
                        padding: `${padding}%`,
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="h-32 w-32 object-cover"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImageUrl("");
                    }}
                    className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
                  >
                    Changer d'image
                  </button>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Style</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 flex items-center justify-between text-sm">
                        <span>Couleur de fond</span>
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-6 w-8 cursor-pointer rounded border border-border"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="mb-2 flex justify-between text-sm">
                        <span>Coins arrondis</span>
                        <span className="text-muted-foreground">{borderRadius}%</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={borderRadius}
                        onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex justify-between text-sm">
                        <span>Marge intérieure</span>
                        <span className="text-muted-foreground">{padding}%</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={padding}
                        onChange={(e) => setPadding(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadAll}
                  disabled={isProcessing || selectedCount === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      Télécharger ({selectedCount + 1} fichiers)
                    </>
                  )}
                </button>
              </div>

              {/* Sizes selection */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Tailles à générer</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* ICO (always included) */}
                  <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">favicon.ico</span>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                          Inclus
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ICO multi-tailles (16, 32, 48)
                      </p>
                    </div>
                  </div>

                  {/* PNG sizes */}
                  {sizes.map((size, index) => (
                    <button
                      key={size.size}
                      onClick={() => toggleSize(index)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        size.selected
                          ? "border-primary/30 bg-primary/5"
                          : "border-border hover:bg-accent/50"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          size.selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground"
                        }`}
                      >
                        {size.selected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{size.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {size.size}×{size.size}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {size.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* HTML code preview */}
                <div className="mt-6">
                  <h4 className="mb-2 text-sm font-medium">Code HTML</h4>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                    <code>{generateHTMLCode()}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>
    </div>
  );
}
