"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Image as ImageIcon,
  Settings,
  Palette,
  Maximize,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
} from "lucide-react";
import type { ImageConfig, ImageFormat, ResizeMode, RotationAngle, FlipDirection, ImageInfo } from "@/types/image";
import { defaultImageConfig, formatLabels, formatMimeTypes } from "@/types/image";

export default function ImageConverterPage() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null);
  const [config, setConfig] = useState<ImageConfig>(defaultImageConfig);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputInfo, setOutputInfo] = useState<{ size: number; width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [expandedSections, setExpandedSections] = useState({
    format: true,
    resize: true,
    transform: true,
    filters: true,
    adjustments: true,
    effects: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setOriginalInfo({
        name: file.name,
        size: file.size,
        width: img.width,
        height: img.height,
        type: file.type,
      });
      setConfig((prev) => ({
        ...prev,
        width: img.width,
        height: img.height,
      }));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const processImage = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Calculate dimensions
    let targetWidth = originalImage.width;
    let targetHeight = originalImage.height;

    if (config.resizeMode === "percentage") {
      targetWidth = Math.round(originalImage.width * (config.percentage / 100));
      targetHeight = Math.round(originalImage.height * (config.percentage / 100));
    } else if (config.resizeMode === "dimensions") {
      targetWidth = config.width;
      targetHeight = config.height;
      if (config.maintainAspectRatio) {
        const ratio = originalImage.width / originalImage.height;
        if (targetWidth / targetHeight > ratio) {
          targetWidth = Math.round(targetHeight * ratio);
        } else {
          targetHeight = Math.round(targetWidth / ratio);
        }
      }
    } else if (config.resizeMode === "width") {
      targetWidth = config.width;
      targetHeight = config.maintainAspectRatio
        ? Math.round(config.width / (originalImage.width / originalImage.height))
        : originalImage.height;
    } else if (config.resizeMode === "height") {
      targetHeight = config.height;
      targetWidth = config.maintainAspectRatio
        ? Math.round(config.height * (originalImage.width / originalImage.height))
        : originalImage.width;
    }

    // Add padding
    const paddedWidth = targetWidth + config.padding * 2;
    const paddedHeight = targetHeight + config.padding * 2;

    // Handle rotation
    const isRotated = config.rotation === 90 || config.rotation === 270;
    canvas.width = isRotated ? paddedHeight : paddedWidth;
    canvas.height = isRotated ? paddedWidth : paddedHeight;

    // Fill background/padding
    ctx.fillStyle = config.padding > 0 ? config.paddingColor : config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((config.rotation * Math.PI) / 180);

    // Apply flip
    let scaleX = 1;
    let scaleY = 1;
    if (config.flip === "horizontal" || config.flip === "both") scaleX = -1;
    if (config.flip === "vertical" || config.flip === "both") scaleY = -1;
    ctx.scale(scaleX, scaleY);

    // Build filter string
    const filters: string[] = [];
    if (config.grayscale) filters.push("grayscale(100%)");
    if (config.sepia) filters.push("sepia(100%)");
    if (config.invert) filters.push("invert(100%)");
    if (config.blur > 0) filters.push(`blur(${config.blur}px)`);
    if (config.brightness !== 100) filters.push(`brightness(${config.brightness}%)`);
    if (config.contrast !== 100) filters.push(`contrast(${config.contrast}%)`);
    if (config.saturation !== 100) filters.push(`saturate(${config.saturation}%)`);
    if (config.hue !== 0) filters.push(`hue-rotate(${config.hue}deg)`);
    if (config.opacity !== 100) filters.push(`opacity(${config.opacity}%)`);
    ctx.filter = filters.length > 0 ? filters.join(" ") : "none";

    // Draw image
    ctx.drawImage(
      originalImage,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );

    ctx.restore();

    // Apply border radius
    if (config.borderRadius > 0) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      const r = config.borderRadius;
      ctx.roundRect(0, 0, canvas.width, canvas.height, r);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    // Generate preview
    const quality = config.format === "png" || config.format === "gif" ? 1 : config.quality / 100;
    const mimeType = formatMimeTypes[config.format];

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          setOutputInfo({
            size: blob.size,
            width: canvas.width,
            height: canvas.height,
          });
        }
        setIsProcessing(false);
      },
      mimeType,
      quality
    );
  }, [originalImage, config]);

  // Process image when config changes
  useEffect(() => {
    if (originalImage) {
      const timeout = setTimeout(processImage, 100);
      return () => clearTimeout(timeout);
    }
  }, [originalImage, config, processImage]);

  const handleDownload = () => {
    if (!previewUrl || !originalInfo) return;

    const extension = config.format;
    const baseName = originalInfo.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseName}_converted.${extension}`;

    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = fileName;
    a.click();
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, "image/png");
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard API not supported
    }
  };

  const handleReset = () => {
    setConfig(defaultImageConfig);
    if (originalImage) {
      setConfig((prev) => ({
        ...defaultImageConfig,
        width: originalImage.width,
        height: originalImage.height,
      }));
    }
  };

  const handleClear = () => {
    setOriginalImage(null);
    setOriginalInfo(null);
    setPreviewUrl(null);
    setOutputInfo(null);
    setConfig(defaultImageConfig);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const SectionHeader = ({
    title,
    icon: Icon,
    section,
  }: {
    title: string;
    icon: React.ElementType;
    section: keyof typeof expandedSections;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </span>
      {expandedSections[section] ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux outils
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Convertisseur d&apos;Images</h1>
          <p className="mt-2 text-muted-foreground">
            Convertissez, redimensionnez et appliquez des filtres à vos images. Tout se passe localement.
          </p>
        </div>

        {/* Upload Zone */}
        {!originalImage && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mb-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 transition-colors hover:border-primary/50"
          >
            <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">Glissez une image ici</p>
            <p className="mb-4 text-sm text-muted-foreground">
              ou cliquez pour sélectionner
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-primary bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Sélectionner une image
            </button>
            <p className="mt-4 text-xs text-muted-foreground">
              Formats supportés: PNG, JPEG, WebP, GIF, BMP, SVG
            </p>
          </div>
        )}

        {originalImage && (
          <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
            {/* Configuration Panel */}
            <div className="space-y-4">
              {/* Original Info */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{originalInfo?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {originalInfo?.width} × {originalInfo?.height} px • {formatFileSize(originalInfo?.size || 0)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="Réinitialiser"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleClear}
                      className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Format */}
              <div className="rounded-lg border border-border bg-card">
                <div className="p-4">
                  <SectionHeader title="Format de sortie" icon={ImageIcon} section="format" />
                  {expandedSections.format && (
                    <div className="mt-3 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(formatLabels) as ImageFormat[]).map((format) => (
                          <button
                            key={format}
                            onClick={() => setConfig((prev) => ({ ...prev, format }))}
                            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                              config.format === format
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      {(config.format === "jpeg" || config.format === "webp") && (
                        <div>
                          <label className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Qualité</span>
                            <span className="font-medium">{config.quality}%</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={config.quality}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, quality: parseInt(e.target.value) }))
                            }
                            className="w-full"
                          />
                          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                            <span>Plus petit</span>
                            <span>Meilleure qualité</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Resize */}
              <div className="rounded-lg border border-border bg-card">
                <div className="p-4">
                  <SectionHeader title="Redimensionnement" icon={Maximize} section="resize" />
                  {expandedSections.resize && (
                    <div className="mt-3 space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {(["percentage", "dimensions", "width", "height"] as ResizeMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setConfig((prev) => ({ ...prev, resizeMode: mode }))}
                            className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                              config.resizeMode === mode
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            {mode === "percentage" && "%"}
                            {mode === "dimensions" && "L×H"}
                            {mode === "width" && "L"}
                            {mode === "height" && "H"}
                          </button>
                        ))}
                      </div>

                      {config.resizeMode === "percentage" && (
                        <div>
                          <label className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pourcentage</span>
                            <span className="font-medium">{config.percentage}%</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="500"
                            value={config.percentage}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, percentage: parseInt(e.target.value) }))
                            }
                            className="w-full"
                          />
                        </div>
                      )}

                      {(config.resizeMode === "dimensions" || config.resizeMode === "width") && (
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Largeur (px)</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={config.width}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, width: parseInt(e.target.value) || 1 }))
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                      )}

                      {(config.resizeMode === "dimensions" || config.resizeMode === "height") && (
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Hauteur (px)</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={config.height}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, height: parseInt(e.target.value) || 1 }))
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                      )}

                      {config.resizeMode !== "percentage" && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.maintainAspectRatio}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, maintainAspectRatio: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="text-sm">Conserver les proportions</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Transform */}
              <div className="rounded-lg border border-border bg-card">
                <div className="p-4">
                  <SectionHeader title="Transformation" icon={RotateCw} section="transform" />
                  {expandedSections.transform && (
                    <div className="mt-3 space-y-4">
                      <div>
                        <label className="mb-2 block text-xs text-muted-foreground">Rotation</label>
                        <div className="flex gap-2">
                          {([0, 90, 180, 270] as RotationAngle[]).map((angle) => (
                            <button
                              key={angle}
                              onClick={() => setConfig((prev) => ({ ...prev, rotation: angle }))}
                              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                config.rotation === angle
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "border-border bg-background hover:bg-accent"
                              }`}
                            >
                              {angle}°
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-muted-foreground">Retournement</label>
                        <div className="flex gap-2">
                          {([null, "horizontal", "vertical", "both"] as (FlipDirection | null)[]).map((flip) => (
                            <button
                              key={flip || "none"}
                              onClick={() => setConfig((prev) => ({ ...prev, flip }))}
                              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm transition-colors ${
                                config.flip === flip
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "border-border bg-background hover:bg-accent"
                              }`}
                            >
                              {flip === null && "Aucun"}
                              {flip === "horizontal" && <FlipHorizontal className="h-4 w-4" />}
                              {flip === "vertical" && <FlipVertical className="h-4 w-4" />}
                              {flip === "both" && "↔↕"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Coins arrondis</span>
                          <span className="font-medium">{config.borderRadius}px</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={config.borderRadius}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, borderRadius: parseInt(e.target.value) }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Padding</span>
                          <span className="font-medium">{config.padding}px</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.padding}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, padding: parseInt(e.target.value) }))
                          }
                          className="w-full"
                        />
                        {config.padding > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Couleur du padding</label>
                            <input
                              type="color"
                              value={config.paddingColor}
                              onChange={(e) =>
                                setConfig((prev) => ({ ...prev, paddingColor: e.target.value }))
                              }
                              className="h-6 w-8 cursor-pointer rounded border border-border bg-background"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="rounded-lg border border-border bg-card">
                <div className="p-4">
                  <SectionHeader title="Filtres" icon={Palette} section="filters" />
                  {expandedSections.filters && (
                    <div className="mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "grayscale", label: "Niveaux de gris" },
                          { key: "sepia", label: "Sépia" },
                          { key: "invert", label: "Inverser" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                [key]: !prev[key as keyof ImageConfig],
                              }))
                            }
                            className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                              config[key as keyof ImageConfig]
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Adjustments */}
              <div className="rounded-lg border border-border bg-card">
                <div className="p-4">
                  <SectionHeader title="Ajustements" icon={Settings} section="adjustments" />
                  {expandedSections.adjustments && (
                    <div className="mt-3 space-y-4">
                      {[
                        { key: "brightness", label: "Luminosité", min: 0, max: 200 },
                        { key: "contrast", label: "Contraste", min: 0, max: 200 },
                        { key: "saturation", label: "Saturation", min: 0, max: 200 },
                        { key: "hue", label: "Teinte", min: 0, max: 360, suffix: "°" },
                        { key: "blur", label: "Flou", min: 0, max: 20, suffix: "px" },
                        { key: "opacity", label: "Opacité", min: 0, max: 100 },
                      ].map(({ key, label, min, max, suffix = "%" }) => (
                        <div key={key}>
                          <label className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium">
                              {config[key as keyof ImageConfig]}
                              {suffix}
                            </span>
                          </label>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            value={config[key as keyof ImageConfig] as number}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                [key]: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium">Aperçu</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom(Math.max(25, zoom - 25))}
                      className="rounded border border-border bg-background p-1 text-muted-foreground hover:bg-accent"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">{zoom}%</span>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 25))}
                      className="rounded border border-border bg-background p-1 text-muted-foreground hover:bg-accent"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Preview Area */}
                <div className="relative mb-4 overflow-auto rounded-lg border border-border bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                  <div
                    className="flex min-h-[300px] items-center justify-center p-4"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
                  >
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full"
                      />
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Output Info */}
                {outputInfo && (
                  <div className="mb-4 rounded-lg border border-border bg-background p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions</span>
                      <span className="font-medium">
                        {outputInfo.width} × {outputInfo.height} px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taille estimée</span>
                      <span className="font-medium">{formatFileSize(outputInfo.size)}</span>
                    </div>
                    {originalInfo && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Réduction</span>
                        <span className={`font-medium ${outputInfo.size < originalInfo.size ? "text-green-600" : "text-red-600"}`}>
                          {outputInfo.size < originalInfo.size ? "-" : "+"}
                          {Math.abs(Math.round((1 - outputInfo.size / originalInfo.size) * 100))}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleDownload}
                    disabled={!previewUrl}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger ({config.format.toUpperCase()})
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={!previewUrl}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copier dans le presse-papier
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Changer d&apos;image
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </main>
    </div>
  );
}
