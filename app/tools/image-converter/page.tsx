"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Sun,
  Contrast,
  Droplets,
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
  const [activeTab, setActiveTab] = useState<"format" | "resize" | "adjust">("format");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const paddedWidth = targetWidth + config.padding * 2;
    const paddedHeight = targetHeight + config.padding * 2;

    const isRotated = config.rotation === 90 || config.rotation === 270;
    canvas.width = isRotated ? paddedHeight : paddedWidth;
    canvas.height = isRotated ? paddedWidth : paddedHeight;

    ctx.fillStyle = config.padding > 0 ? config.paddingColor : config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((config.rotation * Math.PI) / 180);

    let scaleX = 1;
    let scaleY = 1;
    if (config.flip === "horizontal" || config.flip === "both") scaleX = -1;
    if (config.flip === "vertical" || config.flip === "both") scaleY = -1;
    ctx.scale(scaleX, scaleY);

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

    ctx.drawImage(
      originalImage,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );

    ctx.restore();

    if (config.borderRadius > 0) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      const r = config.borderRadius;
      ctx.roundRect(0, 0, canvas.width, canvas.height, r);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

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
    if (originalImage) {
      setConfig({
        ...defaultImageConfig,
        width: originalImage.width,
        height: originalImage.height,
      });
    } else {
      setConfig(defaultImageConfig);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Convertisseur d&apos;Images</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {/* Upload Zone - Plus compacte */}
        {!originalImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex h-[calc(100vh-120px)] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card transition-colors hover:border-primary/50"
          >
            <Upload className="mb-4 h-16 w-16 text-muted-foreground" />
            <p className="mb-2 text-xl font-medium">Glissez une image ici</p>
            <p className="mb-6 text-sm text-muted-foreground">PNG, JPEG, WebP, GIF, BMP, SVG</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-primary bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sélectionner
            </button>
          </div>
        ) : (
          /* Interface principale - Layout horizontal optimisé */
          <div className="flex h-[calc(100vh-88px)] flex-col gap-4 lg:flex-row">
            {/* Zone de prévisualisation - Priorité visuelle */}
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
              {/* Toolbar preview */}
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    className="rounded border border-border p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3rem] text-center text-xs text-muted-foreground">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    className="rounded border border-border p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                {/* Info sortie compacte */}
                {outputInfo && (
                  <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                    <span>{outputInfo.width} × {outputInfo.height}</span>
                    <span>{formatFileSize(outputInfo.size)}</span>
                    {originalInfo && (
                      <span className={outputInfo.size < originalInfo.size ? "text-green-600" : "text-orange-500"}>
                        {outputInfo.size < originalInfo.size ? "−" : "+"}
                        {Math.abs(Math.round((1 - outputInfo.size / originalInfo.size) * 100))}%
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="rounded border border-border p-1.5 text-muted-foreground hover:bg-accent"
                    title="Réinitialiser"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleClear}
                    className="rounded border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Zone preview */}
              <div className="relative flex-1 overflow-auto bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                <div
                  className="flex min-h-full items-center justify-center p-4"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
                >
                  {previewUrl && <img src={previewUrl} alt="Preview" className="max-w-full" />}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions download - Toujours visible */}
              <div className="flex items-center gap-2 border-t border-border p-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  disabled={!previewUrl}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!previewUrl}
                  className="ml-auto flex items-center gap-2 rounded-lg border border-primary bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Télécharger {config.format.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Panneau de configuration - Compact avec tabs */}
            <div className="flex w-full flex-col rounded-lg border border-border bg-card lg:w-80">
              {/* Info fichier original */}
              <div className="border-b border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{originalInfo?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {originalInfo?.width} × {originalInfo?.height} • {formatFileSize(originalInfo?.size || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="flex border-b border-border">
                {[
                  { id: "format", label: "Format" },
                  { id: "resize", label: "Taille" },
                  { id: "adjust", label: "Effets" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenu des tabs - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Tab Format */}
                {activeTab === "format" && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">FORMAT DE SORTIE</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(Object.keys(formatLabels) as ImageFormat[]).map((format) => (
                          <button
                            key={format}
                            onClick={() => setConfig((prev) => ({ ...prev, format }))}
                            className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                              config.format === format
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(config.format === "jpeg" || config.format === "webp") && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">QUALITÉ</label>
                          <span className="text-xs font-semibold">{config.quality}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={config.quality}
                          onChange={(e) => setConfig((prev) => ({ ...prev, quality: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>Petit fichier</span>
                          <span>Haute qualité</span>
                        </div>
                      </div>
                    )}

                    {/* Transformations rapides */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">ROTATION</label>
                      <div className="flex gap-1.5">
                        {([0, 90, 180, 270] as RotationAngle[]).map((angle) => (
                          <button
                            key={angle}
                            onClick={() => setConfig((prev) => ({ ...prev, rotation: angle }))}
                            className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                              config.rotation === angle
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {angle}°
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">RETOURNEMENT</label>
                      <div className="flex gap-1.5">
                        {([null, "horizontal", "vertical", "both"] as (FlipDirection | null)[]).map((flip) => (
                          <button
                            key={flip || "none"}
                            onClick={() => setConfig((prev) => ({ ...prev, flip }))}
                            className={`flex flex-1 items-center justify-center rounded-lg border py-2 transition-colors ${
                              config.flip === flip
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {flip === null && <RotateCw className="h-4 w-4 opacity-30" />}
                            {flip === "horizontal" && <FlipHorizontal className="h-4 w-4" />}
                            {flip === "vertical" && <FlipVertical className="h-4 w-4" />}
                            {flip === "both" && <span className="text-xs">↔↕</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Resize */}
                {activeTab === "resize" && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">MODE</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { mode: "percentage" as ResizeMode, label: "Pourcentage" },
                          { mode: "dimensions" as ResizeMode, label: "Dimensions" },
                          { mode: "width" as ResizeMode, label: "Largeur" },
                          { mode: "height" as ResizeMode, label: "Hauteur" },
                        ].map(({ mode, label }) => (
                          <button
                            key={mode}
                            onClick={() => setConfig((prev) => ({ ...prev, resizeMode: mode }))}
                            className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                              config.resizeMode === mode
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.resizeMode === "percentage" && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">ÉCHELLE</label>
                          <span className="text-xs font-semibold">{config.percentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="500"
                          value={config.percentage}
                          onChange={(e) => setConfig((prev) => ({ ...prev, percentage: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>
                    )}

                    {(config.resizeMode === "dimensions" || config.resizeMode === "width") && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LARGEUR (PX)</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={config.width}
                          onChange={(e) => setConfig((prev) => ({ ...prev, width: parseInt(e.target.value) || 1 }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}

                    {(config.resizeMode === "dimensions" || config.resizeMode === "height") && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">HAUTEUR (PX)</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={config.height}
                          onChange={(e) => setConfig((prev) => ({ ...prev, height: parseInt(e.target.value) || 1 }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}

                    {config.resizeMode !== "percentage" && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={config.maintainAspectRatio}
                          onChange={(e) => setConfig((prev) => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Conserver les proportions
                      </label>
                    )}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">COINS ARRONDIS</label>
                        <span className="text-xs font-semibold">{config.borderRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={config.borderRadius}
                        onChange={(e) => setConfig((prev) => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">MARGE</label>
                        <span className="text-xs font-semibold">{config.padding}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.padding}
                        onChange={(e) => setConfig((prev) => ({ ...prev, padding: parseInt(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      {config.padding > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Couleur</span>
                          <input
                            type="color"
                            value={config.paddingColor}
                            onChange={(e) => setConfig((prev) => ({ ...prev, paddingColor: e.target.value }))}
                            className="h-6 w-8 cursor-pointer rounded border border-border bg-background"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Adjust (Effets) */}
                {activeTab === "adjust" && (
                  <div className="space-y-4">
                    {/* Filtres rapides */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">FILTRES</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: "grayscale", label: "N&B" },
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
                            className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                              config[key as keyof ImageConfig]
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ajustements avec icônes */}
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Sun className="h-3.5 w-3.5" /> Luminosité
                          </label>
                          <span className="text-xs font-semibold">{config.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={config.brightness}
                          onChange={(e) => setConfig((prev) => ({ ...prev, brightness: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Contrast className="h-3.5 w-3.5" /> Contraste
                          </label>
                          <span className="text-xs font-semibold">{config.contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={config.contrast}
                          onChange={(e) => setConfig((prev) => ({ ...prev, contrast: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Droplets className="h-3.5 w-3.5" /> Saturation
                          </label>
                          <span className="text-xs font-semibold">{config.saturation}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={config.saturation}
                          onChange={(e) => setConfig((prev) => ({ ...prev, saturation: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-xs text-muted-foreground">Teinte</label>
                          <span className="text-xs font-semibold">{config.hue}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={config.hue}
                          onChange={(e) => setConfig((prev) => ({ ...prev, hue: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-xs text-muted-foreground">Flou</label>
                          <span className="text-xs font-semibold">{config.blur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={config.blur}
                          onChange={(e) => setConfig((prev) => ({ ...prev, blur: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-xs text-muted-foreground">Opacité</label>
                          <span className="text-xs font-semibold">{config.opacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.opacity}
                          onChange={(e) => setConfig((prev) => ({ ...prev, opacity: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hidden elements */}
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
