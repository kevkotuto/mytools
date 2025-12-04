"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Upload,
  X,
  Smartphone,
  Tablet,
  Watch,
  Monitor,
  Globe,
  Loader2,
  Maximize,
  Square,
  RectangleHorizontal,
  Move,
} from "lucide-react";
import JSZip from "jszip";
import {
  type AppIconConfig,
  defaultAppIconConfig,
  androidAdaptiveSizes,
} from "@/types/app-icon";

type ResizeMode = "cover" | "contain" | "fill" | "center";
type TabType = "platforms" | "style" | "advanced";

const resizeModeLabels: Record<ResizeMode, { label: string; icon: React.ReactNode }> = {
  cover: { label: "Cover", icon: <Maximize className="h-3.5 w-3.5" /> },
  contain: { label: "Contain", icon: <Square className="h-3.5 w-3.5" /> },
  fill: { label: "Fill", icon: <RectangleHorizontal className="h-3.5 w-3.5" /> },
  center: { label: "Center", icon: <Move className="h-3.5 w-3.5" /> },
};

export default function AppIconGeneratorPage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [config, setConfig] = useState<AppIconConfig>(defaultAppIconConfig);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("cover");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("platforms");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview when settings change
  const generatePreview = useCallback(async () => {
    if (!sourceImage) {
      setPreviewUrl(null);
      return;
    }

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const previewSize = 192;
          const canvas = document.createElement("canvas");
          canvas.width = previewSize;
          canvas.height = previewSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          const paddingPx = config.padding ? Math.floor((config.padding / 100) * previewSize) : 0;
          const availableWidth = previewSize - paddingPx * 2;
          const availableHeight = previewSize - paddingPx * 2;

          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          let dx = paddingPx, dy = paddingPx, dw = availableWidth, dh = availableHeight;

          const imgAspect = img.width / img.height;
          const targetAspect = availableWidth / availableHeight;

          switch (resizeMode) {
            case "cover":
              if (imgAspect > targetAspect) {
                sw = img.height * targetAspect;
                sx = (img.width - sw) / 2;
              } else {
                sh = img.width / targetAspect;
                sy = (img.height - sh) / 2;
              }
              break;
            case "contain":
              if (imgAspect > targetAspect) {
                dh = availableWidth / imgAspect;
                dy = paddingPx + (availableHeight - dh) / 2;
              } else {
                dw = availableHeight * imgAspect;
                dx = paddingPx + (availableWidth - dw) / 2;
              }
              break;
            case "fill":
              break;
            case "center":
              if (img.width <= availableWidth && img.height <= availableHeight) {
                dw = img.width;
                dh = img.height;
                dx = paddingPx + (availableWidth - dw) / 2;
                dy = paddingPx + (availableHeight - dh) / 2;
              } else {
                if (imgAspect > targetAspect) {
                  dh = availableWidth / imgAspect;
                  dy = paddingPx + (availableHeight - dh) / 2;
                } else {
                  dw = availableHeight * imgAspect;
                  dx = paddingPx + (availableWidth - dw) / 2;
                }
              }
              break;
          }

          if (config.cornerRadius && config.cornerRadius > 0) {
            const radius = Math.floor((config.cornerRadius / 100) * previewSize / 2);
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(previewSize - radius, 0);
            ctx.quadraticCurveTo(previewSize, 0, previewSize, radius);
            ctx.lineTo(previewSize, previewSize - radius);
            ctx.quadraticCurveTo(previewSize, previewSize, previewSize - radius, previewSize);
            ctx.lineTo(radius, previewSize);
            ctx.quadraticCurveTo(0, previewSize, 0, previewSize - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.clip();
          }

          if (config.backgroundColor && config.backgroundColor !== "transparent") {
            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, previewSize, previewSize);
          }

          ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Could not create blob"));
            },
            "image/png",
            1.0
          );
        };
        img.onerror = reject;
        img.src = sourceImage;
      });

      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (error) {
      console.error("Preview generation error:", error);
    }
  }, [sourceImage, config.backgroundColor, config.cornerRadius, config.padding, resizeMode]);

  useEffect(() => {
    const timer = setTimeout(generatePreview, 100);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setSourceImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSourceImage(null);
    setImageSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePlatform = (platformId: string) => {
    setConfig((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) =>
        p.id === platformId ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  const resizeImage = async (
    sourceDataUrl: string,
    targetWidth: number,
    targetHeight: number,
    backgroundColor?: string,
    cornerRadius?: number,
    padding?: number,
    mode: ResizeMode = "cover"
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        const paddingPx = padding ? Math.floor((padding / 100) * targetWidth) : 0;
        const availableWidth = targetWidth - paddingPx * 2;
        const availableHeight = targetHeight - paddingPx * 2;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        let dx = paddingPx, dy = paddingPx, dw = availableWidth, dh = availableHeight;

        const imgAspect = img.width / img.height;
        const targetAspect = availableWidth / availableHeight;

        switch (mode) {
          case "cover":
            if (imgAspect > targetAspect) {
              sw = img.height * targetAspect;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / targetAspect;
              sy = (img.height - sh) / 2;
            }
            break;
          case "contain":
            if (imgAspect > targetAspect) {
              dh = availableWidth / imgAspect;
              dy = paddingPx + (availableHeight - dh) / 2;
            } else {
              dw = availableHeight * imgAspect;
              dx = paddingPx + (availableWidth - dw) / 2;
            }
            break;
          case "fill":
            break;
          case "center":
            if (img.width <= availableWidth && img.height <= availableHeight) {
              dw = img.width;
              dh = img.height;
              dx = paddingPx + (availableWidth - dw) / 2;
              dy = paddingPx + (availableHeight - dh) / 2;
            } else {
              if (imgAspect > targetAspect) {
                dh = availableWidth / imgAspect;
                dy = paddingPx + (availableHeight - dh) / 2;
              } else {
                dw = availableHeight * imgAspect;
                dx = paddingPx + (availableWidth - dw) / 2;
              }
            }
            break;
        }

        if (cornerRadius && cornerRadius > 0) {
          const radius = Math.floor((cornerRadius / 100) * Math.min(targetWidth, targetHeight) / 2);
          ctx.beginPath();
          ctx.moveTo(radius, 0);
          ctx.lineTo(targetWidth - radius, 0);
          ctx.quadraticCurveTo(targetWidth, 0, targetWidth, radius);
          ctx.lineTo(targetWidth, targetHeight - radius);
          ctx.quadraticCurveTo(targetWidth, targetHeight, targetWidth - radius, targetHeight);
          ctx.lineTo(radius, targetHeight);
          ctx.quadraticCurveTo(0, targetHeight, 0, targetHeight - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.closePath();
          ctx.clip();
        }

        if (backgroundColor && backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create blob"));
          },
          "image/png",
          1.0
        );
      };
      img.onerror = reject;
      img.src = sourceDataUrl;
    });
  };

  const generateContentsJson = (
    sizes: { idiom: string; size: string; scale: string; filename: string }[]
  ) => {
    return JSON.stringify(
      {
        images: sizes,
        info: {
          author: "MyTools App Icon Generator",
          version: 1,
        },
      },
      null,
      2
    );
  };

  const generateWebManifest = () => {
    return JSON.stringify(
      {
        name: "Your App Name",
        short_name: "App",
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      },
      null,
      2
    );
  };

  const generateAdaptiveForeground = async (
    sourceDataUrl: string,
    targetSize: number,
    padding: number,
    mode: ResizeMode = "cover"
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.clearRect(0, 0, targetSize, targetSize);

        const paddingPx = Math.floor((padding / 100) * targetSize);
        const availableSize = targetSize - paddingPx * 2;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        let dx = paddingPx, dy = paddingPx, dw = availableSize, dh = availableSize;

        const imgAspect = img.width / img.height;

        if (mode === "cover") {
          if (imgAspect > 1) {
            sw = img.height;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width;
            sy = (img.height - sh) / 2;
          }
        } else if (mode === "contain") {
          if (imgAspect > 1) {
            dh = availableSize / imgAspect;
            dy = paddingPx + (availableSize - dh) / 2;
          } else {
            dw = availableSize * imgAspect;
            dx = paddingPx + (availableSize - dw) / 2;
          }
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create blob"));
          },
          "image/png",
          1.0
        );
      };
      img.onerror = reject;
      img.src = sourceDataUrl;
    });
  };

  const generateAdaptiveBackground = async (
    targetSize: number,
    backgroundColor: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetSize, targetSize);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not create blob"));
        },
        "image/png",
        1.0
      );
    });
  };

  const generateAdaptiveMonochrome = async (
    sourceDataUrl: string,
    targetSize: number,
    padding: number,
    mode: ResizeMode = "cover"
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.clearRect(0, 0, targetSize, targetSize);

        const paddingPx = Math.floor((padding / 100) * targetSize);
        const availableSize = targetSize - paddingPx * 2;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        let dx = paddingPx, dy = paddingPx, dw = availableSize, dh = availableSize;

        const imgAspect = img.width / img.height;

        if (mode === "cover") {
          if (imgAspect > 1) {
            sw = img.height;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width;
            sy = (img.height - sh) / 2;
          }
        } else if (mode === "contain") {
          if (imgAspect > 1) {
            dh = availableSize / imgAspect;
            dy = paddingPx + (availableSize - dh) / 2;
          } else {
            dw = availableSize * imgAspect;
            dx = paddingPx + (availableSize - dw) / 2;
          }
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 0) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create blob"));
          },
          "image/png",
          1.0
        );
      };
      img.onerror = reject;
      img.src = sourceDataUrl;
    });
  };

  const generateAdaptiveIconXml = (filename: string) => {
    return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/${filename}_background"/>
    <foreground android:drawable="@mipmap/${filename}_foreground"/>
    <monochrome android:drawable="@mipmap/${filename}_monochrome"/>
</adaptive-icon>`;
  };

  const generateRoundAdaptiveIconXml = (filename: string) => {
    return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/${filename}_background"/>
    <foreground android:drawable="@mipmap/${filename}_foreground"/>
    <monochrome android:drawable="@mipmap/${filename}_monochrome"/>
</adaptive-icon>`;
  };

  const generateIcons = async () => {
    if (!sourceImage) return;

    setIsGenerating(true);
    setProgress(0);

    const zip = new JSZip();
    const enabledPlatforms = config.platforms.filter((p) => p.enabled);
    const totalSizes = enabledPlatforms.reduce((acc, p) => acc + p.sizes.length, 0);
    let processedCount = 0;

    try {
      const iosContentsImages: { idiom: string; size: string; scale: string; filename: string }[] = [];

      for (const platform of enabledPlatforms) {
        let folder: JSZip | null = null;

        if (platform.id === "android") {
          folder = zip.folder("android");
        } else if (platform.id === "web") {
          folder = zip.folder("web");
        } else {
          folder = zip.folder("ios")?.folder(platform.folderName || "AppIcon.appiconset") || null;
        }

        if (!folder) continue;

        for (const size of platform.sizes) {
          let filename: string;

          if (platform.id === "android") {
            const androidFolder = folder.folder(size.filename || "");
            filename = `${config.androidFilename}.png`;
            if (androidFolder) {
              const blob = await resizeImage(
                sourceImage,
                size.width,
                size.height,
                config.backgroundColor,
                config.cornerRadius,
                config.padding,
                resizeMode
              );
              androidFolder.file(filename, blob);
            }
          } else if (platform.id === "web") {
            filename = `${size.filename}.png`;
            const blob = await resizeImage(
              sourceImage,
              size.width,
              size.height,
              config.backgroundColor,
              config.cornerRadius,
              config.padding,
              resizeMode
            );
            folder.file(filename, blob);
          } else {
            const baseSize = Math.floor(size.width / (size.scale === "3x" ? 3 : size.scale === "2x" ? 2 : 1));
            filename = `icon_${size.width}x${size.height}.png`;
            const blob = await resizeImage(
              sourceImage,
              size.width,
              size.height,
              config.backgroundColor,
              config.cornerRadius,
              config.padding,
              resizeMode
            );
            folder.file(filename, blob);

            iosContentsImages.push({
              idiom: size.idiom || platform.id,
              size: `${baseSize}x${baseSize}`,
              scale: size.scale || "1x",
              filename: filename,
            });
          }

          processedCount++;
          setProgress(Math.floor((processedCount / totalSizes) * 100));
        }
      }

      const iosFolder = zip.folder("ios")?.folder("AppIcon.appiconset");
      if (iosFolder && config.generateContentsJson && iosContentsImages.length > 0) {
        const contentsJson = generateContentsJson(iosContentsImages);
        iosFolder.file("Contents.json", contentsJson);
      }

      const webFolder = zip.folder("web");
      if (webFolder && config.generateManifest && enabledPlatforms.some((p) => p.id === "web")) {
        webFolder.file("site.webmanifest", generateWebManifest());

        const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <square310x310logo src="/mstile-310x310.png"/>
      <TileColor>${config.backgroundColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
        webFolder.file("browserconfig.xml", browserConfig);
      }

      if (config.generateAdaptiveIcons && enabledPlatforms.some((p) => p.id === "android")) {
        const androidAdaptiveFolder = zip.folder("android-adaptive");

        if (androidAdaptiveFolder) {
          for (const size of androidAdaptiveSizes) {
            const densityFolder = androidAdaptiveFolder.folder(size.filename || "");
            if (!densityFolder) continue;

            const foregroundBlob = await generateAdaptiveForeground(
              sourceImage,
              size.width,
              config.adaptiveForegroundPadding,
              resizeMode
            );
            densityFolder.file(`${config.androidFilename}_foreground.png`, foregroundBlob);

            const backgroundBlob = await generateAdaptiveBackground(
              size.width,
              config.adaptiveBackgroundColor
            );
            densityFolder.file(`${config.androidFilename}_background.png`, backgroundBlob);

            const monochromeBlob = await generateAdaptiveMonochrome(
              sourceImage,
              size.width,
              config.adaptiveForegroundPadding,
              resizeMode
            );
            densityFolder.file(`${config.androidFilename}_monochrome.png`, monochromeBlob);
          }

          const anydpiFolder = androidAdaptiveFolder.folder("mipmap-anydpi-v26");
          if (anydpiFolder) {
            anydpiFolder.file(`${config.androidFilename}.xml`, generateAdaptiveIconXml(config.androidFilename));
            anydpiFolder.file(`${config.androidFilename}_round.xml`, generateRoundAdaptiveIconXml(config.androidFilename));
          }

          const playstoreBlob = await resizeImage(
            sourceImage,
            512,
            512,
            config.adaptiveBackgroundColor,
            0,
            config.adaptiveForegroundPadding,
            resizeMode
          );
          androidAdaptiveFolder.file("playstore-icon.png", playstoreBlob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "app-icons.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating icons:", error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    switch (platformId) {
      case "iphone":
        return <Smartphone className="h-4 w-4" />;
      case "ipad":
        return <Tablet className="h-4 w-4" />;
      case "watchos":
        return <Watch className="h-4 w-4" />;
      case "macos":
        return <Monitor className="h-4 w-4" />;
      case "android":
        return <Smartphone className="h-4 w-4" />;
      case "web":
        return <Globe className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const getTotalEnabledSizes = () => {
    return config.platforms.filter((p) => p.enabled).reduce((acc, p) => acc + p.sizes.length, 0);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header compact */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
        <h1 className="text-sm font-semibold">App Icon Generator</h1>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone principale - Aperçu */}
        <div className="flex flex-1 flex-col">
          {/* Zone d'upload/preview */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-6">
            {!sourceImage ? (
              <div
                className={`relative h-80 w-80 rounded-lg border-2 border-dashed transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mb-1 text-sm font-medium">
                    Glissez une image ici
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG 1024x1024 recommandé
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {/* Preview avec fond damier pour transparence */}
                <div className="relative">
                  <div
                    className="overflow-hidden rounded-xl border border-border"
                    style={{
                      backgroundImage: config.backgroundColor === "transparent"
                        ? "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)"
                        : undefined,
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      backgroundColor: config.backgroundColor !== "transparent" ? config.backgroundColor : undefined,
                    }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview icon"
                        className="h-48 w-48"
                      />
                    ) : (
                      <img
                        src={sourceImage}
                        alt="Source icon"
                        className="h-48 w-48 object-contain"
                      />
                    )}
                  </div>
                  <button
                    onClick={removeImage}
                    className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 hover:bg-accent"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Info image */}
                {imageSize && (
                  <div className="text-center">
                    <p className={`text-xs font-medium ${
                      imageSize.width >= 1024 && imageSize.height >= 1024
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}>
                      {imageSize.width} × {imageSize.height} px
                    </p>
                    {(imageSize.width < 1024 || imageSize.height < 1024) && (
                      <p className="text-xs text-muted-foreground">
                        Taille recommandée: 1024×1024
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Changer d&apos;image
                </button>
              </div>
            )}
          </div>

          {/* Barre d'actions en bas */}
          <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
            <div className="text-xs text-muted-foreground">
              {config.platforms.filter((p) => p.enabled).length} plateformes • {getTotalEnabledSizes()} fichiers
            </div>

            {isGenerating ? (
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            ) : (
              <button
                onClick={generateIcons}
                disabled={!sourceImage || getTotalEnabledSizes() === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Générer ZIP
              </button>
            )}
          </div>
        </div>

        {/* Panneau de configuration */}
        <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "platforms" as TabType, label: "Plateformes" },
              { id: "style" as TabType, label: "Style" },
              { id: "advanced" as TabType, label: "Avancé" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "platforms" && (
              <div className="space-y-3">
                {/* iOS/macOS */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">iOS & macOS</p>
                  <div className="space-y-1.5">
                    {config.platforms
                      .filter((p) => ["iphone", "ipad", "watchos", "macos"].includes(p.id))
                      .map((platform) => (
                        <label
                          key={platform.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/50"
                        >
                          <input
                            type="checkbox"
                            checked={platform.enabled}
                            onChange={() => togglePlatform(platform.id)}
                            className="rounded border-border"
                          />
                          <div className="text-muted-foreground">
                            {getPlatformIcon(platform.id)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {platform.sizes.length} tailles
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Android */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Android</p>
                  <div className="space-y-1.5">
                    {config.platforms
                      .filter((p) => p.id === "android")
                      .map((platform) => (
                        <label
                          key={platform.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/50"
                        >
                          <input
                            type="checkbox"
                            checked={platform.enabled}
                            onChange={() => togglePlatform(platform.id)}
                            className="rounded border-border"
                          />
                          <div className="text-muted-foreground">
                            {getPlatformIcon(platform.id)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">
                              mdpi à xxxhdpi
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Web */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Web / PWA</p>
                  <div className="space-y-1.5">
                    {config.platforms
                      .filter((p) => p.id === "web")
                      .map((platform) => (
                        <label
                          key={platform.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/50"
                        >
                          <input
                            type="checkbox"
                            checked={platform.enabled}
                            onChange={() => togglePlatform(platform.id)}
                            className="rounded border-border"
                          />
                          <div className="text-muted-foreground">
                            {getPlatformIcon(platform.id)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Favicons, PWA
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-4">
                {/* Mode de redimensionnement */}
                <div>
                  <p className="mb-2 text-xs font-medium">Mode de redimensionnement</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(resizeModeLabels) as ResizeMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setResizeMode(mode)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-colors ${
                          resizeMode === mode
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {resizeModeLabels[mode].icon}
                        {resizeModeLabels[mode].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur de fond */}
                <div>
                  <p className="mb-2 text-xs font-medium">Couleur de fond</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                      }
                      className="h-8 w-8 cursor-pointer rounded border border-border"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                    />
                    <button
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, backgroundColor: "transparent" }))
                      }
                      className="rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-accent"
                    >
                      Aucun
                    </button>
                  </div>
                </div>

                {/* Coins arrondis */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Coins arrondis</p>
                    <span className="text-xs text-muted-foreground">{config.cornerRadius}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={config.cornerRadius}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, cornerRadius: parseInt(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>

                {/* Marge intérieure */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Marge intérieure</p>
                    <span className="text-xs text-muted-foreground">{config.padding}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={config.padding}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, padding: parseInt(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-4">
                {/* Nom fichier Android */}
                <div>
                  <p className="mb-2 text-xs font-medium">Nom fichier Android</p>
                  <input
                    type="text"
                    value={config.androidFilename}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, androidFilename: e.target.value }))
                    }
                    placeholder="ic_launcher"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                {/* Options de génération */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.generateContentsJson}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, generateContentsJson: e.target.checked }))
                      }
                      className="rounded border-border"
                    />
                    <span className="text-xs">Contents.json (iOS)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.generateManifest}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, generateManifest: e.target.checked }))
                      }
                      className="rounded border-border"
                    />
                    <span className="text-xs">manifest.json (Web)</span>
                  </label>
                </div>

                {/* Android Adaptive Icons */}
                <div className="border-t border-border pt-4">
                  <label className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.generateAdaptiveIcons}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, generateAdaptiveIcons: e.target.checked }))
                      }
                      className="rounded border-border"
                    />
                    <span className="text-xs font-medium">Icônes adaptatives Android</span>
                  </label>

                  {config.generateAdaptiveIcons && (
                    <div className="space-y-3 pl-5">
                      <div>
                        <p className="mb-1.5 text-xs">Fond adaptatif</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.adaptiveBackgroundColor}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                adaptiveBackgroundColor: e.target.value,
                              }))
                            }
                            className="h-7 w-7 cursor-pointer rounded border border-border"
                          />
                          <input
                            type="text"
                            value={config.adaptiveBackgroundColor}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                adaptiveBackgroundColor: e.target.value,
                              }))
                            }
                            className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <p className="text-xs">Zone de sécurité</p>
                          <span className="text-xs text-muted-foreground">
                            {config.adaptiveForegroundPadding}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="30"
                          value={config.adaptiveForegroundPadding}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              adaptiveForegroundPadding: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
