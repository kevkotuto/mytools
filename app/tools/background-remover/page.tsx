"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Wand2,
  Sparkles,
  Palette,
  Eraser,
  ZoomIn,
  ZoomOut,
  Loader2,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Sliders,
} from "lucide-react";
import type {
  BackgroundRemoverConfig,
  RemovalMode,
  BackgroundType,
  ProcessingState,
  BackgroundRemoverImageInfo,
} from "@/types/background-remover";
import {
  defaultBackgroundRemoverConfig,
  modeLabels,
  backgroundTypeLabels,
  modelQualityLabels,
} from "@/types/background-remover";

export default function BackgroundRemoverPage() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalInfo, setOriginalInfo] = useState<BackgroundRemoverImageInfo | null>(null);
  const [config, setConfig] = useState<BackgroundRemoverConfig>(defaultBackgroundRemoverConfig);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"mode" | "background" | "refine">("mode");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

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
      setResultUrl(null);
      setProcessingState("idle");
      setProgress(null);
      setErrorMessage(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
      setConfig((prev) => ({
        ...prev,
        backgroundImageUrl: img.src,
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

  const processAutoRemoval = useCallback(async () => {
    if (!originalImage) return;

    setProcessingState("loading-model");
    setProgress({ step: "Chargement du modèle IA...", percent: 0 });
    setErrorMessage(null);

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      setProcessingState("processing");
      setProgress({ step: "Suppression de l'arrière-plan...", percent: 30 });

      const canvas = document.createElement("canvas");
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");
      ctx.drawImage(originalImage, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      const resultBlob = await removeBackground(blob, {
        model: config.modelQuality === "small" ? "isnet_quint8" : "isnet_fp16",
        publicPath: `${window.location.origin}/models/bg-removal/`,
        progress: (key, current, total) => {
          const percent = Math.round((current / total) * 100);
          let step = "Traitement...";
          if (key === "compute:inference") {
            step = "Analyse de l'image...";
          } else if (key === "fetch:model") {
            step = "Chargement du modèle...";
          }
          setProgress({ step, percent: 30 + percent * 0.6 });
        },
      });

      const processedUrl = await applyPostProcessing(resultBlob);
      setResultUrl(processedUrl);
      setProcessingState("done");
      setProgress({ step: "Terminé !", percent: 100 });
    } catch (error) {
      console.error("Background removal error:", error);
      setProcessingState("error");

      let message = "Une erreur est survenue";
      if (error instanceof Error) {
        if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed to fetch")) {
          message = "Erreur de connexion. Vérifiez votre connexion internet et réessayez.";
        } else {
          message = error.message;
        }
      }
      setErrorMessage(message);
    }
  }, [originalImage, config.modelQuality]);

  const processManualRemoval = useCallback(
    (clickX: number, clickY: number) => {
      if (!originalImage || !originalCanvasRef.current) return;

      setProcessingState("processing");

      const canvas = originalCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const pixelIndex = (Math.floor(clickY) * canvas.width + Math.floor(clickX)) * 4;
      const targetR = data[pixelIndex];
      const targetG = data[pixelIndex + 1];
      const targetB = data[pixelIndex + 2];

      const tolerance = config.tolerance * 2.55;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
          Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2)
        );

        if (distance <= tolerance) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const processedUrl = await applyPostProcessing(blob);
          setResultUrl(processedUrl);
          setProcessingState("done");
        }
      }, "image/png");
    },
    [originalImage, config.tolerance]
  );

  const applyPostProcessing = async (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          resolve(URL.createObjectURL(blob));
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(URL.createObjectURL(blob));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        if (config.backgroundType === "color") {
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (config.backgroundType === "image" && backgroundImage) {
          const scale = Math.max(
            canvas.width / backgroundImage.width,
            canvas.height / backgroundImage.height
          );
          const w = backgroundImage.width * scale;
          const h = backgroundImage.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2;
          ctx.drawImage(backgroundImage, x, y, w, h);
        }

        if (config.featherAmount > 0) {
          ctx.filter = `blur(${config.featherAmount}px)`;
        }

        ctx.drawImage(img, 0, 0);
        ctx.filter = "none";

        canvas.toBlob((resultBlob) => {
          if (resultBlob) {
            resolve(URL.createObjectURL(resultBlob));
          } else {
            resolve(URL.createObjectURL(blob));
          }
        }, "image/png");
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const canvas = originalCanvasRef.current;
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(originalImage, 0, 0);
      }
    }
  }, [originalImage]);

  useEffect(() => {
    if (resultUrl && processingState === "done") {
      fetch(resultUrl)
        .then((res) => res.blob())
        .then((blob) => applyPostProcessing(blob))
        .then((newUrl) => {
          if (newUrl !== resultUrl) {
            URL.revokeObjectURL(resultUrl);
            setResultUrl(newUrl);
          }
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.backgroundType, config.backgroundColor, backgroundImage]);

  const handleProcess = () => {
    if (config.mode === "auto") {
      processAutoRemoval();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (config.mode !== "manual" || !originalCanvasRef.current || processingState === "processing")
      return;

    const rect = e.currentTarget.getBoundingClientRect();
    const canvas = originalCanvasRef.current;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    processManualRemoval(x, y);
  };

  const handleDownload = () => {
    if (!resultUrl || !originalInfo) return;

    const baseName = originalInfo.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseName}_no_bg.png`;

    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = fileName;
    a.click();
  };

  const handleReset = () => {
    if (originalImage && originalCanvasRef.current) {
      const canvas = originalCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(originalImage, 0, 0);
      }
    }
    setResultUrl(null);
    setProcessingState("idle");
    setProgress(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setOriginalInfo(null);
    setResultUrl(null);
    setProcessingState("idle");
    setProgress(null);
    setErrorMessage(null);
    setBackgroundImage(null);
    setConfig(defaultBackgroundRemoverConfig);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
        <h1 className="text-sm font-semibold">Suppresseur d&apos;Arrière-plan</h1>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone principale - Aperçu */}
        <div className="flex flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card px-3">
            <div className="flex items-center gap-2">
              {originalInfo && (
                <>
                  <span className="text-xs text-muted-foreground">{originalInfo.name}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {originalInfo.width}×{originalInfo.height}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(originalInfo.size)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              {originalImage && (
                <>
                  <div className="mx-2 h-4 w-px bg-border" />
                  <button
                    onClick={handleReset}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Réinitialiser"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleClear}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Zone d'aperçu */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
            {!originalImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex h-full w-full max-w-lg flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-8 transition-colors hover:border-primary/50"
              >
                <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">Glissez une image ici</p>
                <p className="mb-4 text-xs text-muted-foreground">ou cliquez pour sélectionner</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Sélectionner
                </button>
                <p className="mt-3 text-xs text-muted-foreground">PNG, JPEG, WebP</p>
              </div>
            ) : (
              <div
                className={`relative rounded-lg border border-border p-4 ${
                  config.backgroundType === "transparent"
                    ? "bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]"
                    : "bg-white"
                }`}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
                onClick={handleCanvasClick}
              >
                {resultUrl ? (
                  <img src={resultUrl} alt="Result" className="max-w-full" />
                ) : originalImage ? (
                  <div className={config.mode === "manual" ? "cursor-crosshair" : ""}>
                    <img src={originalImage.src} alt="Original" className="max-w-full" />
                  </div>
                ) : null}
                {(processingState === "loading-model" || processingState === "processing") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {progress && processingState !== "idle" && processingState !== "done" && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-2">
              <div className="flex items-center gap-3">
                {processingState === "error" ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{progress.step}</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="mt-1 h-1 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
                {processingState === "error" && (
                  <button
                    onClick={handleProcess}
                    className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Réessayer
                  </button>
                )}
              </div>
              {errorMessage && (
                <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
              )}
            </div>
          )}

          {/* Actions en bas */}
          {originalImage && (
            <div className="flex h-12 shrink-0 items-center justify-between border-t border-border bg-card px-3">
              <div className="flex items-center gap-2">
                {processingState === "done" && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Terminé
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!resultUrl}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger PNG
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panneau de configuration */}
        {originalImage && (
          <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
            {/* Tabs */}
            <div className="flex shrink-0 border-b border-border">
              {[
                { id: "mode" as const, label: "Mode", icon: Eraser },
                { id: "background" as const, label: "Fond", icon: Palette },
                { id: "refine" as const, label: "Affiner", icon: Sliders },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === "mode" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium">Mode de suppression</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(modeLabels) as RemovalMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setConfig((prev) => ({ ...prev, mode }))}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs transition-colors ${
                            config.mode === mode
                              ? "border-primary bg-primary/10 font-medium"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {mode === "auto" ? <Sparkles className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />}
                          {modeLabels[mode]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.mode === "auto" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs text-muted-foreground">Qualité du modèle</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["small", "medium"] as const).map((quality) => (
                            <button
                              key={quality}
                              onClick={() => setConfig((prev) => ({ ...prev, modelQuality: quality }))}
                              className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                                config.modelQuality === quality
                                  ? "border-primary bg-primary/10 font-medium"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              {modelQualityLabels[quality]}
                              <span className="block text-[10px] text-muted-foreground">
                                {quality === "small" ? "~5 MB" : "~15 MB"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950">
                        <p className="text-[10px] text-amber-800 dark:text-amber-200">
                          <strong>Note:</strong> Le modèle IA sera téléchargé au premier lancement.
                        </p>
                      </div>

                      <button
                        onClick={handleProcess}
                        disabled={processingState === "loading-model" || processingState === "processing"}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {processingState === "loading-model" || processingState === "processing" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            Supprimer l&apos;arrière-plan
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {config.mode === "manual" && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border bg-muted/50 p-2">
                        <p className="text-[10px] text-muted-foreground">
                          Cliquez sur l&apos;aperçu pour sélectionner la couleur à supprimer.
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Tolérance</span>
                          <span className="font-medium">{config.tolerance}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.tolerance}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, tolerance: parseInt(e.target.value) }))
                          }
                          className="w-full"
                        />
                        <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                          <span>Précis</span>
                          <span>Large</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "background" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium">Type de fond</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(backgroundTypeLabels) as BackgroundType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setConfig((prev) => ({ ...prev, backgroundType: type }))}
                          className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                            config.backgroundType === type
                              ? "border-primary bg-primary/10 font-medium"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {backgroundTypeLabels[type]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.backgroundType === "color" && (
                    <div>
                      <label className="mb-1.5 block text-xs text-muted-foreground">Couleur</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          className="h-8 w-10 cursor-pointer rounded border border-border"
                        />
                        <input
                          type="text"
                          value={config.backgroundColor}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {config.backgroundType === "image" && (
                    <div>
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBgFileSelect}
                        className="hidden"
                      />
                      {backgroundImage ? (
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 overflow-hidden rounded-lg border border-border">
                            <img
                              src={backgroundImage.src}
                              alt="Background"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => bgFileInputRef.current?.click()}
                            className="flex-1 rounded-lg border border-border py-2 text-xs hover:bg-accent"
                          >
                            Changer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => bgFileInputRef.current?.click()}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-xs text-muted-foreground hover:border-primary/50 hover:bg-accent"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Choisir une image
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "refine" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Adoucissement des bords</span>
                      <span className="font-medium">{config.featherAmount}px</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={config.featherAmount}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, featherAmount: parseInt(e.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Upload autre image */}
            <div className="shrink-0 border-t border-border p-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs hover:bg-accent"
              >
                <Upload className="h-3.5 w-3.5" />
                Changer d&apos;image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={originalCanvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
