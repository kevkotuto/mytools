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
  ImageIcon,
  Check,
  Square,
  Smartphone,
  Monitor,
  Film,
} from "lucide-react";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AspectRatio {
  name: string;
  value: number | null;
  icon: React.ReactNode;
}

const aspectRatios: AspectRatio[] = [
  { name: "Libre", value: null, icon: <Square className="h-4 w-4" /> },
  { name: "1:1", value: 1, icon: <Square className="h-4 w-4" /> },
  { name: "4:3", value: 4 / 3, icon: <Monitor className="h-4 w-4" /> },
  { name: "16:9", value: 16 / 9, icon: <Film className="h-4 w-4" /> },
  { name: "9:16", value: 9 / 16, icon: <Smartphone className="h-4 w-4" /> },
  { name: "3:2", value: 3 / 2, icon: <ImageIcon className="h-4 w-4" /> },
  { name: "2:3", value: 2 / 3, icon: <ImageIcon className="h-4 w-4" /> },
];

export default function ImageCropperPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(90);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      const size = Math.min(img.width, img.height);
      setCropArea({
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        width: size,
        height: size,
      });
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const updateCropForRatio = useCallback((ratio: number | null) => {
    if (!originalImage) return;

    setSelectedRatio(ratio);

    if (ratio === null) return;

    const imgWidth = originalImage.width;
    const imgHeight = originalImage.height;

    let newWidth: number;
    let newHeight: number;

    if (ratio > imgWidth / imgHeight) {
      newWidth = imgWidth;
      newHeight = imgWidth / ratio;
    } else {
      newHeight = imgHeight;
      newWidth = imgHeight * ratio;
    }

    setCropArea({
      x: (imgWidth - newWidth) / 2,
      y: (imgHeight - newHeight) / 2,
      width: newWidth,
      height: newHeight,
    });
  }, [originalImage]);

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !originalImage) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scaleX = originalImage.width / rect.width;
    const scaleY = originalImage.height / rect.height;

    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;

    setDragStart({ x: e.clientX, y: e.clientY });

    setCropArea((prev) => {
      let { x, y, width, height } = prev;

      if (dragType === "move") {
        x = Math.max(0, Math.min(x + dx, originalImage.width - width));
        y = Math.max(0, Math.min(y + dy, originalImage.height - height));
      } else if (dragType?.includes("resize")) {
        if (dragType.includes("e")) {
          const newWidth = Math.max(50, Math.min(width + dx, originalImage.width - x));
          if (selectedRatio) {
            height = newWidth / selectedRatio;
          } else {
            width = newWidth;
          }
          width = newWidth;
        }
        if (dragType.includes("w")) {
          const newWidth = Math.max(50, Math.min(width - dx, x + width));
          const widthDiff = width - newWidth;
          x = x + widthDiff;
          if (selectedRatio) {
            height = newWidth / selectedRatio;
          }
          width = newWidth;
        }
        if (dragType.includes("s")) {
          const newHeight = Math.max(50, Math.min(height + dy, originalImage.height - y));
          if (selectedRatio) {
            width = newHeight * selectedRatio;
          }
          height = newHeight;
        }
        if (dragType.includes("n")) {
          const newHeight = Math.max(50, Math.min(height - dy, y + height));
          const heightDiff = height - newHeight;
          y = y + heightDiff;
          if (selectedRatio) {
            width = newHeight * selectedRatio;
          }
          height = newHeight;
        }
      }

      // Clamp to image bounds
      x = Math.max(0, Math.min(x, originalImage.width - width));
      y = Math.max(0, Math.min(y, originalImage.height - height));

      return { x, y, width, height };
    });
  }, [isDragging, dragType, dragStart, originalImage, selectedRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const rotateImage = (direction: number) => {
    setRotation((prev) => (prev + direction + 360) % 360);
  };

  const cropAndDownload = () => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      originalImage,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    const mimeType = `image/${outputFormat}`;
    const qualityValue = outputFormat === "png" ? undefined : quality / 100;
    const dataUrl = canvas.toDataURL(mimeType, qualityValue);

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `cropped.${outputFormat}`;
    a.click();
  };

  const reset = () => {
    setImageFile(null);
    setImageUrl("");
    setOriginalImage(null);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setSelectedRatio(null);
  };

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
        <h1 className="text-lg font-semibold">Image Cropper</h1>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          {!imageFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 hover:border-primary/50"
            >
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">Déposez une image</p>
              <p className="mb-4 text-sm text-muted-foreground">
                ou cliquez pour sélectionner
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
            <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
              {/* Image editor */}
              <div className="space-y-4">
                <div
                  ref={containerRef}
                  className="relative overflow-hidden rounded-lg border border-border bg-[#1a1a1a]"
                  style={{ minHeight: "400px" }}
                >
                  {originalImage && (
                    <>
                      <img
                        src={imageUrl}
                        alt="Original"
                        className="w-full"
                        style={{
                          transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                        }}
                        draggable={false}
                      />

                      {/* Crop overlay */}
                      <div className="absolute inset-0">
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/50" />

                        {/* Crop area */}
                        <div
                          className="absolute cursor-move border-2 border-white"
                          style={{
                            left: `${(cropArea.x / originalImage.width) * 100}%`,
                            top: `${(cropArea.y / originalImage.height) * 100}%`,
                            width: `${(cropArea.width / originalImage.width) * 100}%`,
                            height: `${(cropArea.height / originalImage.height) * 100}%`,
                            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, "move")}
                        >
                          {/* Grid lines */}
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className="border border-white/30" />
                            ))}
                          </div>

                          {/* Resize handles */}
                          {["nw", "n", "ne", "w", "e", "sw", "s", "se"].map((pos) => (
                            <div
                              key={pos}
                              className="absolute h-3 w-3 bg-white"
                              style={{
                                cursor: `${pos}-resize`,
                                ...(pos.includes("n") ? { top: -6 } : {}),
                                ...(pos.includes("s") ? { bottom: -6 } : {}),
                                ...(pos.includes("w") ? { left: -6 } : {}),
                                ...(pos.includes("e") ? { right: -6 } : {}),
                                ...(!pos.includes("n") && !pos.includes("s") ? { top: "50%", marginTop: -6 } : {}),
                                ...(!pos.includes("w") && !pos.includes("e") ? { left: "50%", marginLeft: -6 } : {}),
                              }}
                              onMouseDown={(e) => handleMouseDown(e, `resize-${pos}`)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Transform controls */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => rotateImage(-90)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-accent"
                    title="Rotation gauche"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => rotateImage(90)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-accent"
                    title="Rotation droite"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setFlipH(!flipH)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border ${flipH ? "border-primary bg-primary/10" : "border-border"} hover:bg-accent`}
                    title="Retourner horizontalement"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setFlipV(!flipV)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border ${flipV ? "border-primary bg-primary/10" : "border-border"} hover:bg-accent`}
                    title="Retourner verticalement"
                  >
                    <FlipVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Settings panel */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Ratio d'aspect</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.name}
                        onClick={() => updateCropForRatio(ratio.value)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          selectedRatio === ratio.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {ratio.icon}
                        {ratio.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Format de sortie</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(["png", "jpeg", "webp"] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setOutputFormat(format)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm uppercase ${
                            outputFormat === format
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>

                    {outputFormat !== "png" && (
                      <div>
                        <label className="mb-2 flex justify-between text-sm">
                          <span>Qualité</span>
                          <span className="text-muted-foreground">{quality}%</span>
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Dimensions</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Largeur</span>
                      <p className="font-medium">{Math.round(cropArea.width)}px</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hauteur</span>
                      <p className="font-medium">{Math.round(cropArea.height)}px</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={cropAndDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>
    </div>
  );
}
