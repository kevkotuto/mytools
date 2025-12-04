"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Undo,
  PenTool,
  Eraser,
  Type,
} from "lucide-react";

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export default function SignaturePadPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [transparentBg, setTransparentBg] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg" | "svg">("png");
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [fontFamily, setFontFamily] = useState("'Brush Script MT', cursive");

  const lastPointRef = useRef<Point | null>(null);

  const fonts = [
    { name: "Brush Script", value: "'Brush Script MT', cursive" },
    { name: "Pacifico", value: "'Pacifico', cursive" },
    { name: "Dancing Script", value: "'Dancing Script', cursive" },
    { name: "Great Vibes", value: "'Great Vibes', cursive" },
    { name: "Satisfy", value: "'Satisfy', cursive" },
  ];

  const colors = [
    "#000000",
    "#1a1a1a",
    "#0000ff",
    "#000080",
    "#800000",
    "#4a4a4a",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial clear
    clearCanvas();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    if (transparentBg) {
      ctx.clearRect(0, 0, rect.width, rect.height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    // Save initial state
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryIndex(0);
  }, [backgroundColor, transparentBg]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);

    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        pressure: (touch as unknown as { force?: number }).force || 0.5,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: 0.5,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (signatureMode !== "draw") return;

    e.preventDefault();
    setIsDrawing(true);
    lastPointRef.current = getEventPos(e);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || signatureMode !== "draw") return;

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getEventPos(e);
    const lastPoint = lastPointRef.current;

    if (!lastPoint) {
      lastPointRef.current = currentPoint;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth * (currentPoint.pressure || 0.5) * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPointRef.current = currentPoint;
  }, [isDrawing, signatureMode, strokeColor, strokeWidth]);

  const stopDrawing = () => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const renderTypedSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // Clear canvas
    if (transparentBg) {
      ctx.clearRect(0, 0, rect.width, rect.height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    if (!typedSignature) return;

    // Draw text
    const fontSize = Math.min(rect.width / typedSignature.length * 1.5, 80);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = strokeColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedSignature, rect.width / 2, rect.height / 2);

    saveToHistory();
  }, [typedSignature, fontFamily, strokeColor, backgroundColor, transparentBg, saveToHistory]);

  useEffect(() => {
    if (signatureMode === "type") {
      renderTypedSignature();
    }
  }, [signatureMode, typedSignature, fontFamily, renderTypedSignature]);

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dataUrl: string;

    if (outputFormat === "svg") {
      // Create SVG from canvas
      const rect = canvas.getBoundingClientRect();
      const imageData = canvas.toDataURL("image/png");
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${rect.width}" height="${rect.height}">
  <image xlink:href="${imageData}" width="${rect.width}" height="${rect.height}"/>
</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      dataUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "signature.svg";
      a.click();
      URL.revokeObjectURL(dataUrl);
      return;
    }

    if (outputFormat === "jpeg") {
      // For JPEG, ensure white background
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.fillStyle = "#ffffff";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        dataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);
      } else {
        dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      }
    } else {
      dataUrl = canvas.toDataURL("image/png");
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `signature.${outputFormat}`;
    a.click();
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
        <h1 className="text-lg font-semibold">Signature Pad</h1>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
            {/* Canvas area */}
            <div className="space-y-4">
              {/* Mode selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSignatureMode("draw")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                    signatureMode === "draw"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  Dessiner
                </button>
                <button
                  onClick={() => setSignatureMode("type")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                    signatureMode === "type"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <Type className="h-4 w-4" />
                  Taper
                </button>
              </div>

              {/* Type mode input */}
              {signatureMode === "type" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Tapez votre signature..."
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg"
                  />
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {fonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Canvas */}
              <div
                className="overflow-hidden rounded-lg border border-border"
                style={{
                  backgroundColor: transparentBg ? undefined : backgroundColor,
                  backgroundImage: transparentBg
                    ? "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)"
                    : undefined,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="h-64 w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                  <Undo className="h-4 w-4" />
                  Annuler
                </button>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  <Eraser className="h-4 w-4" />
                  Effacer
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-medium">Couleur du trait</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setStrokeColor(color)}
                      className={`h-8 w-8 rounded-full border-2 ${
                        strokeColor === color ? "border-primary" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent"
                  />
                </div>
              </div>

              {signatureMode === "draw" && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-4 font-medium">Épaisseur du trait</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">{strokeWidth}px</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-medium">Fond</h3>
                <label className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => {
                      setTransparentBg(e.target.checked);
                      setTimeout(clearCanvas, 0);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Transparent</span>
                </label>
                {!transparentBg && (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => {
                        setBackgroundColor(e.target.value);
                        setTimeout(clearCanvas, 0);
                      }}
                      className="h-8 w-8 cursor-pointer rounded border border-border"
                    />
                    <span className="text-sm text-muted-foreground">{backgroundColor}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-medium">Format de sortie</h3>
                <div className="flex gap-2">
                  {(["png", "jpeg", "svg"] as const).map((format) => (
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
              </div>

              <button
                onClick={downloadSignature}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
