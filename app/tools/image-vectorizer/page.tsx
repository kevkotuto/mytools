"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Code,
  Palette,
  Sliders,
  Layers,
  Maximize,
  Move,
  MousePointer2,
  Hand,
  Undo2,
} from "lucide-react";
import type {
  VectorizerConfig,
  VectorizationMode,
  DetailLevel,
  VectorizerImageInfo,
} from "@/types/vectorizer";
import {
  defaultVectorizerConfig,
  detailPresets,
  modeLabels,
  detailLabels,
} from "@/types/vectorizer";

declare const ImageTracer: {
  imagedataToSVG: (imageData: ImageData, options: Record<string, unknown>) => string;
};

// Interactive SVG component for path selection
interface InteractiveSvgProps {
  svg: string;
  editMode: "pan" | "select";
  selectedPaths: Set<number>;
  hoveredPath: number | null;
  onHoverPath: (index: number | null) => void;
  onClickPath: (index: number, e: React.MouseEvent) => void;
}

function InteractiveSvg({
  svg,
  editMode,
  selectedPaths,
  hoveredPath,
  onHoverPath,
  onClickPath,
}: InteractiveSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parse and inject the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.querySelector("svg");

    if (!svgElement) return;

    // Clear container
    containerRef.current.innerHTML = "";

    // Add data attributes to paths for selection
    const paths = svgElement.querySelectorAll("path");
    paths.forEach((path, index) => {
      path.setAttribute("data-path-index", String(index));

      if (editMode === "select") {
        path.style.cursor = "pointer";

        // Apply selection/hover styles
        if (selectedPaths.has(index)) {
          path.style.outline = "2px solid #3b82f6";
          path.style.outlineOffset = "1px";
        } else if (hoveredPath === index) {
          path.style.outline = "2px dashed #3b82f6";
          path.style.outlineOffset = "1px";
        }
      }
    });

    // Clone and append SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    containerRef.current.appendChild(clonedSvg);

    // Add event listeners for selection mode
    if (editMode === "select") {
      const handleMouseOver = (e: Event) => {
        const target = e.target as SVGElement;
        const pathIndex = target.getAttribute("data-path-index");
        if (pathIndex !== null) {
          onHoverPath(parseInt(pathIndex));
        }
      };

      const handleMouseOut = () => {
        onHoverPath(null);
      };

      const handleClick = (e: Event) => {
        const target = e.target as SVGElement;
        const pathIndex = target.getAttribute("data-path-index");
        if (pathIndex !== null) {
          onClickPath(parseInt(pathIndex), e as unknown as React.MouseEvent);
        }
      };

      clonedSvg.addEventListener("mouseover", handleMouseOver);
      clonedSvg.addEventListener("mouseout", handleMouseOut);
      clonedSvg.addEventListener("click", handleClick);

      return () => {
        clonedSvg.removeEventListener("mouseover", handleMouseOver);
        clonedSvg.removeEventListener("mouseout", handleMouseOut);
        clonedSvg.removeEventListener("click", handleClick);
      };
    }
  }, [svg, editMode, selectedPaths, hoveredPath, onHoverPath, onClickPath]);

  return <div ref={containerRef} style={{ lineHeight: 0 }} />;
}

export default function ImageVectorizerPage() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalInfo, setOriginalInfo] = useState<VectorizerImageInfo | null>(null);
  const [config, setConfig] = useState<VectorizerConfig>(defaultVectorizerConfig);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showCode, setShowCode] = useState(false);
  const [imageTracerLoaded, setImageTracerLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"mode" | "params" | "advanced" | "edit">("mode");

  // Viewport pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Selection mode state
  const [editMode, setEditMode] = useState<"pan" | "select">("pan");
  const [selectedPaths, setSelectedPaths] = useState<Set<number>>(new Set());
  const [hoveredPath, setHoveredPath] = useState<number | null>(null);
  const [svgColors, setSvgColors] = useState<string[]>([]);
  const [editedSvg, setEditedSvg] = useState<string | null>(null);
  const [svgHistory, setSvgHistory] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !imageTracerLoaded) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js";
      script.async = true;
      script.onload = () => setImageTracerLoaded(true);
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [imageTracerLoaded]);

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
    if (!originalImage || !canvasRef.current || !imageTracerLoaded) return;

    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);

    if (config.blurRadius > 0) {
      ctx.filter = `blur(${config.blurRadius}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = "none";
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (config.mode === "bw") {
      const data = imageData.data;
      const threshold = config.bwThreshold;
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        let value = gray < threshold ? 0 : 255;
        if (config.invertColors) {
          value = 255 - value;
        }
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
    }

    const options: Record<string, unknown> = {
      ltres: config.lineThreshold,
      qtres: config.quadThreshold,
      pathomit: config.pathOmitThreshold,
      rightangleenhance: true,
      pal: undefined as unknown,
      colorsampling: 0,
      numberofcolors: 2,
      mincolorratio: 0,
      colorquantcycles: 3,
      scale: config.scaleFactor,
      roundcoords: 1,
      viewbox: false,
      desc: false,
      lcpr: 0,
      qcpr: 0,
      layering: 0,
    };

    if (config.mode === "bw") {
      options.colorsampling = 0;
      options.numberofcolors = 2;
      options.pal = [
        { r: 0, g: 0, b: 0, a: 255 },
        { r: 255, g: 255, b: 255, a: 255 },
      ];
    } else if (config.mode === "color") {
      options.colorsampling = config.colorQuantization === "sampling" ? 2 : 1;
      options.numberofcolors = config.numberOfColors;
      options.pal = undefined;
    } else if (config.mode === "outline") {
      options.colorsampling = 0;
      options.numberofcolors = 2;
      options.strokewidth = config.strokeWidth;
      options.pal = [
        { r: 0, g: 0, b: 0, a: 255 },
        { r: 255, g: 255, b: 255, a: 255 },
      ];
    }

    setTimeout(() => {
      try {
        let svg = ImageTracer.imagedataToSVG(imageData, options);

        if (config.mode === "outline") {
          svg = svg.replace(/fill="[^"]*"/g, 'fill="none"');
          svg = svg.replace(/<path/g, `<path stroke="#000000" stroke-width="${config.strokeWidth}"`);
        }

        setSvgOutput(svg);
      } catch (error) {
        console.error("Vectorization error:", error);
      }
      setIsProcessing(false);
    }, 50);
  }, [originalImage, config, imageTracerLoaded]);

  useEffect(() => {
    if (originalImage && imageTracerLoaded) {
      const timeout = setTimeout(processImage, 200);
      return () => clearTimeout(timeout);
    }
  }, [originalImage, config, imageTracerLoaded, processImage]);

  const handleDownload = () => {
    if (!currentSvg || !originalInfo) return;

    const baseName = originalInfo.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseName}_vectorized.svg`;

    const blob = new Blob([currentSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    if (!currentSvg) return;

    try {
      await navigator.clipboard.writeText(currentSvg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not supported
    }
  };

  const handleReset = () => {
    setConfig(defaultVectorizerConfig);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setOriginalInfo(null);
    setSvgOutput(null);
    setConfig(defaultVectorizerConfig);
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
    setEditedSvg(null);
    setSvgHistory([]);
    setSelectedPaths(new Set());
    setEditMode("pan");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDetailPreset = (level: DetailLevel) => {
    if (level === "custom") {
      setConfig((prev) => ({ ...prev, detailLevel: level }));
    } else {
      setConfig((prev) => ({
        ...prev,
        detailLevel: level,
        ...detailPresets[level],
      }));
    }
  };

  // Fit SVG to viewport
  const fitToView = useCallback(() => {
    if (!viewportRef.current || !originalInfo) return;

    const viewport = viewportRef.current;
    const viewportWidth = viewport.clientWidth - 48; // padding
    const viewportHeight = viewport.clientHeight - 48;

    const svgWidth = originalInfo.width * config.scaleFactor;
    const svgHeight = originalInfo.height * config.scaleFactor;

    const scaleX = viewportWidth / svgWidth;
    const scaleY = viewportHeight / svgHeight;
    const newZoom = Math.min(scaleX, scaleY, 1) * 100; // Max 100%

    setZoom(Math.max(10, Math.round(newZoom)));
    setPanOffset({ x: 0, y: 0 });
  }, [originalInfo, config.scaleFactor]);

  // Reset view to 100%
  const resetView = useCallback(() => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom with wheel - smooth and less sensitive
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    // Normalize delta for different browsers/devices
    const normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 100);
    // Scale factor: smaller = less sensitive
    const sensitivity = 0.05;
    const delta = -normalizedDelta * sensitivity;

    setZoom((prev) => {
      const newZoom = prev * (1 + delta / 100);
      return Math.max(10, Math.min(300, Math.round(newZoom)));
    });
  }, []);

  // Auto fit when image loaded
  useEffect(() => {
    if (svgOutput && originalInfo) {
      // Small delay to ensure viewport is rendered
      const timeout = setTimeout(fitToView, 100);
      return () => clearTimeout(timeout);
    }
  }, [svgOutput, originalInfo, fitToView]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get current SVG (edited or original)
  const currentSvg = editedSvg || svgOutput;

  // Extract unique colors from SVG
  const extractColors = useCallback((svg: string): string[] => {
    const colorSet = new Set<string>();
    // Match fill colors
    const fillMatches = svg.matchAll(/fill="([^"]+)"/g);
    for (const match of fillMatches) {
      if (match[1] !== "none") {
        colorSet.add(match[1].toLowerCase());
      }
    }
    // Match stroke colors
    const strokeMatches = svg.matchAll(/stroke="([^"]+)"/g);
    for (const match of strokeMatches) {
      if (match[1] !== "none") {
        colorSet.add(match[1].toLowerCase());
      }
    }
    return Array.from(colorSet);
  }, []);

  // Update colors when SVG changes
  useEffect(() => {
    if (currentSvg) {
      setSvgColors(extractColors(currentSvg));
    }
  }, [currentSvg, extractColors]);

  // Get path indices by color
  const getPathsByColor = useCallback((svg: string, color: string): number[] => {
    const indices: number[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const paths = doc.querySelectorAll("path");
    paths.forEach((path, index) => {
      const fill = path.getAttribute("fill")?.toLowerCase();
      const stroke = path.getAttribute("stroke")?.toLowerCase();
      if (fill === color.toLowerCase() || stroke === color.toLowerCase()) {
        indices.push(index);
      }
    });
    return indices;
  }, []);

  // Select all paths with a specific color
  const selectByColor = useCallback((color: string) => {
    if (!currentSvg) return;
    const indices = getPathsByColor(currentSvg, color);
    setSelectedPaths(new Set(indices));
  }, [currentSvg, getPathsByColor]);

  // Delete selected paths
  const deleteSelectedPaths = useCallback(() => {
    if (!currentSvg || selectedPaths.size === 0) return;

    // Save to history before editing
    setSvgHistory((prev) => [...prev, currentSvg]);

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, "image/svg+xml");
    const paths = doc.querySelectorAll("path");

    // Remove selected paths (in reverse order to maintain indices)
    const sortedIndices = Array.from(selectedPaths).sort((a, b) => b - a);
    sortedIndices.forEach((index) => {
      if (paths[index]) {
        paths[index].remove();
      }
    });

    const serializer = new XMLSerializer();
    const newSvg = serializer.serializeToString(doc);
    setEditedSvg(newSvg);
    setSelectedPaths(new Set());
  }, [currentSvg, selectedPaths]);

  // Undo last edit
  const undoEdit = useCallback(() => {
    if (svgHistory.length === 0) return;
    const lastSvg = svgHistory[svgHistory.length - 1];
    setSvgHistory((prev) => prev.slice(0, -1));
    setEditedSvg(lastSvg === svgOutput ? null : lastSvg);
    setSelectedPaths(new Set());
  }, [svgHistory, svgOutput]);

  // Toggle path selection
  const togglePathSelection = useCallback((pathIndex: number, addToSelection: boolean) => {
    setSelectedPaths((prev) => {
      const newSet = addToSelection ? new Set(prev) : new Set<number>();
      if (newSet.has(pathIndex)) {
        newSet.delete(pathIndex);
      } else {
        newSet.add(pathIndex);
      }
      return newSet;
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected paths
      if ((e.key === "Delete" || e.key === "Backspace") && selectedPaths.size > 0) {
        e.preventDefault();
        deleteSelectedPaths();
      }
      // Undo
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && svgHistory.length > 0) {
        e.preventDefault();
        undoEdit();
      }
      // Escape to clear selection
      if (e.key === "Escape" && selectedPaths.size > 0) {
        e.preventDefault();
        clearSelection();
      }
      // V for select mode
      if (e.key === "v" && !e.ctrlKey && !e.metaKey && currentSvg) {
        setEditMode("select");
      }
      // H for pan mode
      if (e.key === "h" && currentSvg) {
        setEditMode("pan");
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPaths, deleteSelectedPaths, svgHistory, undoEdit, clearSelection, currentSvg]);

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
        <h1 className="text-sm font-semibold">Vectorisateur d&apos;Image</h1>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone principale - Aperçu */}
        <div className="flex flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card px-3">
            <div className="flex items-center gap-2">
              {originalImage && currentSvg && (
                <>
                  {/* Mode toggle */}
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => { setEditMode("pan"); clearSelection(); }}
                      className={`rounded-l-lg p-1.5 transition-colors ${
                        editMode === "pan"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                      title="Mode déplacement (H)"
                    >
                      <Hand className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditMode("select")}
                      className={`rounded-r-lg p-1.5 transition-colors ${
                        editMode === "select"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                      title="Mode sélection (V)"
                    >
                      <MousePointer2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mx-1 h-4 w-px bg-border" />
                </>
              )}
              {originalInfo && (
                <>
                  <span className="text-xs text-muted-foreground">{originalInfo.name}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {originalInfo.width}×{originalInfo.height}
                  </span>
                </>
              )}
              {selectedPaths.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-primary">
                    {selectedPaths.size} sélectionné{selectedPaths.size > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Selection actions */}
              {selectedPaths.size > 0 && (
                <>
                  <button
                    onClick={deleteSelectedPaths}
                    className="flex items-center gap-1 rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90"
                    title="Supprimer la sélection (Suppr)"
                  >
                    <Trash2 className="h-3 w-3" />
                    Supprimer
                  </button>
                  <button
                    onClick={clearSelection}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Désélectionner (Échap)"
                  >
                    ✕
                  </button>
                  <div className="mx-2 h-4 w-px bg-border" />
                </>
              )}
              {/* Undo */}
              {svgHistory.length > 0 && (
                <>
                  <button
                    onClick={undoEdit}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Annuler (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <div className="mx-2 h-4 w-px bg-border" />
                </>
              )}
              <button
                onClick={() => setZoom(Math.max(10, zoom - 25))}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Zoom arrière"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(300, zoom + 25))}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Zoom avant"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              {originalImage && (
                <>
                  <div className="mx-2 h-4 w-px bg-border" />
                  <button
                    onClick={fitToView}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Ajuster à la vue"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetView}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Vue 100%"
                  >
                    <Move className="h-4 w-4" />
                  </button>
                  <div className="mx-2 h-4 w-px bg-border" />
                  <button
                    onClick={handleReset}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Réinitialiser paramètres"
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

          {/* Zone d'aperçu - Viewport */}
          <div
            ref={viewportRef}
            className="relative flex-1 overflow-hidden bg-muted/30"
            onMouseDown={originalImage && editMode === "pan" ? handleMouseDown : undefined}
            onMouseMove={originalImage && editMode === "pan" ? handleMouseMove : undefined}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={originalImage ? handleWheel : undefined}
            style={{
              cursor: editMode === "select"
                ? "crosshair"
                : isPanning
                  ? "grabbing"
                  : originalImage
                    ? "grab"
                    : "default"
            }}
          >
            {!originalImage ? (
              <div className="flex h-full items-center justify-center p-4">
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
                  <p className="mt-3 text-xs text-muted-foreground">PNG, JPEG, WebP, GIF, BMP</p>
                </div>
              </div>
            ) : (
              <>
                {/* Checkered background pattern */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
                      linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
                      linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                />

                {/* SVG Content */}
                <div
                  ref={contentRef}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoom / 100})`,
                    transformOrigin: "center center",
                  }}
                >
                  <div className="rounded-lg border border-border bg-white p-4">
                    {currentSvg && (
                      <InteractiveSvg
                        svg={currentSvg}
                        editMode={editMode}
                        selectedPaths={selectedPaths}
                        hoveredPath={hoveredPath}
                        onHoverPath={setHoveredPath}
                        onClickPath={(index, e) => togglePathSelection(index, e.shiftKey)}
                      />
                    )}
                    {!currentSvg && !isProcessing && (
                      <p className="text-sm text-muted-foreground">
                        {imageTracerLoaded ? "Traitement..." : "Chargement de la bibliothèque..."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Viewport instructions */}
                <div className="absolute bottom-3 left-3 rounded bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
                  {editMode === "select"
                    ? "Cliquer pour sélectionner • Shift+clic pour ajouter • Suppr pour supprimer"
                    : "Cliquer-glisser pour déplacer • Molette pour zoomer"}
                </div>
              </>
            )}
          </div>

          {/* Actions en bas */}
          {originalImage && (
            <div className="flex h-12 shrink-0 items-center justify-between border-t border-border bg-card px-3">
              <div className="flex items-center gap-2">
                {currentSvg && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      SVG: {formatFileSize(new Blob([currentSvg]).size)}
                    </span>
                    {editedSvg && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Modifié
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    showCode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  Code
                </button>
                <button
                  onClick={handleCopyCode}
                  disabled={!currentSvg}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copié" : "Copier"}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!currentSvg}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger SVG
                </button>
              </div>
            </div>
          )}

          {/* Code SVG panel */}
          {showCode && currentSvg && (
            <div className="h-48 shrink-0 overflow-auto border-t border-border bg-muted p-3">
              <pre className="text-xs">
                <code>{currentSvg}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Panneau de configuration */}
        {originalImage && (
          <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
            {/* Tabs */}
            <div className="flex shrink-0 border-b border-border">
              {[
                { id: "mode" as const, label: "Mode", icon: Layers },
                { id: "params" as const, label: "Params", icon: Sliders },
                { id: "advanced" as const, label: "Avancé", icon: Palette },
                { id: "edit" as const, label: "Édition", icon: MousePointer2 },
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
                    <label className="mb-2 block text-xs font-medium">Mode de vectorisation</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(modeLabels) as VectorizationMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setConfig((prev) => ({ ...prev, mode }))}
                          className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                            config.mode === mode
                              ? "border-primary bg-primary/10 font-medium"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {modeLabels[mode]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.mode === "bw" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Seuil</span>
                          <span className="font-medium">{config.bwThreshold}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={config.bwThreshold}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, bwThreshold: parseInt(e.target.value) }))
                          }
                          className="w-full"
                        />
                        <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                          <span>+ noir</span>
                          <span>+ blanc</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={config.invertColors}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, invertColors: e.target.checked }))
                          }
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                        Inverser les couleurs
                      </label>
                    </div>
                  )}

                  {config.mode === "color" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Nombre de couleurs</span>
                          <span className="font-medium">{config.numberOfColors}</span>
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="64"
                          value={config.numberOfColors}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, numberOfColors: parseInt(e.target.value) }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-muted-foreground">Quantification</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["sampling", "palette"] as const).map((method) => (
                            <button
                              key={method}
                              onClick={() =>
                                setConfig((prev) => ({ ...prev, colorQuantization: method }))
                              }
                              className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                                config.colorQuantization === method
                                  ? "border-primary bg-primary/10 font-medium"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              {method === "sampling" ? "Échantillonnage" : "Palette"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {config.mode === "outline" && (
                    <div>
                      <label className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Épaisseur du trait</span>
                        <span className="font-medium">{config.strokeWidth}px</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={config.strokeWidth}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, strokeWidth: parseFloat(e.target.value) }))
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "params" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium">Niveau de détail</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(detailLabels) as DetailLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => handleDetailPreset(level)}
                          className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                            config.detailLevel === level
                              ? "border-primary bg-primary/10 font-medium"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {detailLabels[level]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Flou (pré-traitement)</span>
                      <span className="font-medium">{config.blurRadius}px</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={config.blurRadius}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, blurRadius: parseFloat(e.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Échelle de sortie</span>
                      <span className="font-medium">{config.scaleFactor}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="4"
                      step="0.1"
                      value={config.scaleFactor}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, scaleFactor: parseFloat(e.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Seuil de ligne</span>
                      <span className="font-medium">{config.lineThreshold}</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={config.lineThreshold}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          lineThreshold: parseFloat(e.target.value),
                          detailLevel: "custom",
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Seuil de courbe</span>
                      <span className="font-medium">{config.quadThreshold}</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={config.quadThreshold}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          quadThreshold: parseFloat(e.target.value),
                          detailLevel: "custom",
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Taille min. chemin</span>
                      <span className="font-medium">{config.pathOmitThreshold}px</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={config.pathOmitThreshold}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          pathOmitThreshold: parseInt(e.target.value),
                          detailLevel: "custom",
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === "edit" && (
                <div className="space-y-4">
                  {/* Mode selection */}
                  <div>
                    <label className="mb-2 block text-xs font-medium">Mode d&apos;édition</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { setEditMode("pan"); clearSelection(); }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-colors ${
                          editMode === "pan"
                            ? "border-primary bg-primary/10 font-medium"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <Hand className="h-3.5 w-3.5" />
                        Déplacer
                      </button>
                      <button
                        onClick={() => setEditMode("select")}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-colors ${
                          editMode === "select"
                            ? "border-primary bg-primary/10 font-medium"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <MousePointer2 className="h-3.5 w-3.5" />
                        Sélection
                      </button>
                    </div>
                  </div>

                  {/* Color palette */}
                  {svgColors.length > 0 && (
                    <div>
                      <label className="mb-2 block text-xs font-medium">
                        Sélectionner par couleur
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {svgColors.map((color) => {
                          const pathCount = currentSvg ? getPathsByColor(currentSvg, color).length : 0;
                          return (
                            <button
                              key={color}
                              onClick={() => selectByColor(color)}
                              className="group relative rounded border border-border p-0.5 hover:border-primary"
                              title={`${color} (${pathCount} éléments)`}
                            >
                              <div
                                className="h-6 w-6 rounded-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-medium">
                                {pathCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Cliquez sur une couleur pour sélectionner tous les éléments de cette couleur
                      </p>
                    </div>
                  )}

                  {/* Selection info */}
                  {selectedPaths.size > 0 && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="mb-2 text-xs font-medium">
                        {selectedPaths.size} élément{selectedPaths.size > 1 ? "s" : ""} sélectionné{selectedPaths.size > 1 ? "s" : ""}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={deleteSelectedPaths}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                        <button
                          onClick={clearSelection}
                          className="flex-1 rounded-lg border border-border py-1.5 text-xs hover:bg-accent"
                        >
                          Désélectionner
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Undo */}
                  {svgHistory.length > 0 && (
                    <button
                      onClick={undoEdit}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs hover:bg-accent"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Annuler ({svgHistory.length})
                    </button>
                  )}

                  {/* Tips */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-medium">Astuces</p>
                    <ul className="space-y-1 text-[10px] text-muted-foreground">
                      <li>• Cliquez sur un élément pour le sélectionner</li>
                      <li>• Shift+clic pour sélectionner plusieurs</li>
                      <li>• Touche Suppr pour supprimer la sélection</li>
                      <li>• Ctrl+Z pour annuler</li>
                    </ul>
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
