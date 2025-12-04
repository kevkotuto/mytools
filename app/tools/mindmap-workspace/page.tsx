"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, PanelRightClose, PanelRight, RotateCcw } from "lucide-react";

import {
  Toolbar,
  TopToolbar,
  ZoomControls,
  PropertiesPanel,
  CanvasRenderer,
  useCanvasState,
  useCanvasInteraction,
} from "@/components/mindmap";

import { Point, getElementBounds, createImageElement } from "@/types/mindmap";

export default function MindmapWorkspacePage() {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas state
  const {
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    zoom,
    setZoom,
    pan,
    setPan,
    activeTool,
    setActiveTool,
    config,
    setConfig,
    currentColor,
    setCurrentColor,
    currentStrokeColor,
    setCurrentStrokeColor,
    historyIndex,
    history,
    pushHistory,
    undo,
    redo,
    updateElement,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    toggleGrid,
    resetView,
    clearAll,
  } = useCanvasState();

  // Canvas interaction
  const {
    selectionBox,
    currentPencilPoints,
    connectionStart,
    hoveredHandle,
    isNearCorner,
    isResizing,
    resizeHandle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getCursorStyle,
  } = useCanvasInteraction({
    canvasRef,
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    zoom,
    setZoom,
    pan,
    setPan,
    activeTool,
    setActiveTool,
    currentColor,
    currentStrokeColor,
    pushHistory,
  });

  // UI state
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Selected element
  const selectedElement = selectedIds.length === 1
    ? elements.find((el) => el.id === selectedIds[0]) || null
    : null;

  // Prevent browser zoom/scroll and swipe navigation
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleWheel = (e: WheelEvent) => {
      // Prevent all wheel events on canvas to avoid browser back/forward navigation
      if (canvas?.contains(e.target as Node)) {
        e.preventDefault();
      } else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const handleGesture = (e: Event) => e.preventDefault();

    // Prevent horizontal swipe navigation (browser back/forward)
    const handleTouchStart = (e: TouchEvent) => {
      if (canvas?.contains(e.target as Node) && e.touches.length >= 2) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("gesturestart", handleGesture);
    document.addEventListener("gesturechange", handleGesture);
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
      document.removeEventListener("touchstart", handleTouchStart);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) {
        if (e.key === "Escape") {
          finishTextEditing();
        }
        return;
      }

      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (cmdKey && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (cmdKey && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (cmdKey && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Escape") {
        setSelectedIds([]);
        setActiveTool("select");
      } else if (e.key === "v" || e.key === "V") {
        setActiveTool("select");
      } else if (e.key === "h" || e.key === "H") {
        setActiveTool("pan");
      } else if (e.key === "r" || e.key === "R") {
        setActiveTool("rectangle");
      } else if (e.key === "o" || e.key === "O") {
        setActiveTool("ellipse");
      } else if (e.key === "d" && !cmdKey) {
        setActiveTool("diamond");
      } else if (e.key === "g" || e.key === "G") {
        setActiveTool("triangle");
      } else if (e.key === "t" || e.key === "T") {
        setActiveTool("text");
      } else if (e.key === "s" && !cmdKey) {
        setActiveTool("sticky");
      } else if (e.key === "c" && !cmdKey) {
        setActiveTool("connection");
      } else if (e.key === "p" || e.key === "P") {
        setActiveTool("pencil");
      } else if (e.key === "+" || e.key === "=") {
        if (cmdKey) {
          e.preventDefault();
          setZoom((z) => Math.min(5, z + 0.1));
        }
      } else if (e.key === "-") {
        if (cmdKey) {
          e.preventDefault();
          setZoom((z) => Math.max(0.1, z - 0.1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected, duplicateSelected, editingTextId, redo, selectedIds, setActiveTool, setSelectedIds, setZoom, undo]);

  // Text editing
  const finishTextEditing = useCallback(() => {
    if (editingTextId) {
      updateElement(editingTextId, { content: editingContent });
      pushHistory(elements);
    }
    setEditingTextId(null);
    setEditingContent("");
  }, [editingTextId, editingContent, elements, pushHistory, updateElement]);

  // Double click for text editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const point: Point = {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };

    for (const element of elements) {
      const bounds = getElementBounds(element);
      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        if (element.type === "text" || element.type === "sticky") {
          setEditingTextId(element.id);
          setEditingContent(
            element.type === "text" ? element.content : element.content
          );
          break;
        }
      }
    }
  }, [elements, pan, zoom]);

  // Import/Export
  const handleExport = useCallback(() => {
    const data = JSON.stringify({ elements, config }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindmap-workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [elements, config]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.elements) {
            setElements(data.elements);
            pushHistory(data.elements);
          }
          if (data.config) {
            setConfig((prev) => ({ ...prev, ...data.config }));
          }
        } catch (err) {
          console.error("Failed to import:", err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  }, [pushHistory, setConfig, setElements]);

  // Handle image upload
  const handleImageUpload = useCallback((src: string, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate center of visible canvas
    const rect = canvas.getBoundingClientRect();
    const centerX = (rect.width / 2 - pan.x) / zoom;
    const centerY = (rect.height / 2 - pan.y) / zoom;

    // Scale image if too large (max 400px)
    const maxSize = 400;
    let finalWidth = width;
    let finalHeight = height;
    if (width > maxSize || height > maxSize) {
      const scale = maxSize / Math.max(width, height);
      finalWidth = width * scale;
      finalHeight = height * scale;
    }

    const newImage = createImageElement(
      centerX - finalWidth / 2,
      centerY - finalHeight / 2,
      src,
      finalWidth,
      finalHeight
    );
    setElements((prev) => [...prev, newImage]);
    setSelectedIds([newImage.id]);
    pushHistory([...elements, newImage]);
  }, [elements, pan, pushHistory, setElements, setSelectedIds, zoom]);

  // Render grid - optimized with SVG pattern for performance
  const renderGrid = () => {
    if (!config.gridEnabled) return null;

    // Adapt grid size based on zoom to avoid too many dots
    let gridSize = config.gridSize;
    if (zoom < 0.5) gridSize = config.gridSize * 2;
    if (zoom < 0.25) gridSize = config.gridSize * 4;

    const patternId = `grid-pattern-${gridSize}`;
    const dotRadius = 1;

    return (
      <g>
        <defs>
          <pattern
            id={patternId}
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={gridSize / 2} cy={gridSize / 2} r={dotRadius} fill="#e2e8f0" />
          </pattern>
        </defs>
        <rect
          x="-10000"
          y="-10000"
          width="20000"
          height="20000"
          fill={`url(#${patternId})`}
        />
      </g>
    );
  };

  // Render selection box
  const renderSelectionBox = () => {
    if (!selectionBox) return null;

    const x = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x;
    const y = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y;
    const width = Math.abs(selectionBox.width);
    const height = Math.abs(selectionBox.height);

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="#3b82f6"
        strokeWidth={1 / zoom}
        strokeDasharray={`${4 / zoom} ${2 / zoom}`}
      />
    );
  };

  // Render current drawing
  const renderCurrentDrawing = () => {
    if (currentPencilPoints.length > 1) {
      const pathD = `M ${currentPencilPoints[0].x} ${currentPencilPoints[0].y} ${currentPencilPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
      return (
        <path
          d={pathD}
          fill="none"
          stroke={currentStrokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      );
    }

    if (connectionStart) {
      return (
        <line
          x1={connectionStart.point.x}
          y1={connectionStart.point.y}
          x2={connectionStart.point.x}
          y2={connectionStart.point.y}
          stroke={currentStrokeColor}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold">Mindmap Workspace</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title={showPropertiesPanel ? "Masquer propriétés" : "Afficher propriétés"}
          >
            {showPropertiesPanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={clearAll}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Réinitialiser"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Canvas container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Floating toolbars */}
          <Toolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            currentColor={currentColor}
            currentStrokeColor={currentStrokeColor}
            onColorChange={setCurrentColor}
            onStrokeColorChange={setCurrentStrokeColor}
            onImageUpload={handleImageUpload}
          />

          <TopToolbar
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            hasSelection={selectedIds.length > 0}
            gridEnabled={config.gridEnabled}
            onUndo={undo}
            onRedo={redo}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
            onToggleGrid={toggleGrid}
            onImport={handleImport}
            onExport={handleExport}
          />

          <ZoomControls
            zoom={zoom}
            onZoomChange={setZoom}
            onReset={resetView}
          />

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="absolute inset-0 overflow-hidden touch-none"
            style={{
              cursor: getCursorStyle(),
              backgroundColor: config.backgroundColor,
              overscrollBehavior: "none",
              WebkitOverflowScrolling: "auto",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
          >
            <svg
              className="absolute w-full h-full"
              style={{
                overflow: "visible",
                left: 0,
                top: 0,
              }}
            >
              <g
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "0 0",
                }}
              >
              {renderGrid()}
              <CanvasRenderer
                elements={elements}
                selectedIds={selectedIds}
                zoom={zoom}
                activeTool={activeTool}
                hoveredHandle={hoveredHandle}
                isNearCorner={isNearCorner}
                isResizing={isResizing}
                resizeHandle={resizeHandle}
                editingTextId={editingTextId}
                editingContent={editingContent}
                onEditingContentChange={setEditingContent}
                onFinishTextEditing={finishTextEditing}
              />
              {renderCurrentDrawing()}
              {renderSelectionBox()}
              </g>
            </svg>
          </div>
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && (
          <div
            className="w-64 shrink-0 border-l border-border bg-background overflow-y-auto z-20"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border px-3 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Propriétés
              </h2>
            </div>
            <div className="p-3">
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdateElement={updateElement}
                onBringForward={bringForward}
                onSendBackward={sendBackward}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
