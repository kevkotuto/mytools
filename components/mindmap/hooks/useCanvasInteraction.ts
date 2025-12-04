"use client";

import { useState, useCallback, RefObject } from "react";
import {
  Tool,
  CanvasElement,
  Point,
  AnchorPosition,
  createShapeElement,
  createTextElement,
  createStickyElement,
  createConnectionElement,
  createPencilElement,
  getElementBounds,
  getElementAnchors,
  findNearestAnchor,
  isPointInBounds,
} from "@/types/mindmap";
import { ResizeHandle } from "../types";
import { HANDLE_SIZE, ROTATION_HANDLE_DISTANCE, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from "../constants";

interface UseCanvasInteractionProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: Point;
  setPan: React.Dispatch<React.SetStateAction<Point>>;
  activeTool: Tool;
  setActiveTool: React.Dispatch<React.SetStateAction<Tool>>;
  currentColor: string;
  currentStrokeColor: string;
  pushHistory: (elements: CanvasElement[]) => void;
}

export function useCanvasInteraction({
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
}: UseCanvasInteractionProps) {
  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [initialBounds, setInitialBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Drawing states
  const [currentPencilPoints, setCurrentPencilPoints] = useState<Point[]>([]);
  const [connectionStart, setConnectionStart] = useState<{
    elementId: string | null;
    anchor: AnchorPosition;
    point: Point;
  } | null>(null);

  // Hover states
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [isNearCorner, setIsNearCorner] = useState(false);

  // Get canvas point from mouse event
  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // Simple calculation - pan offsets the view, zoom scales it
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [canvasRef, pan, zoom]);

  // Find element at point
  const findElementAtPoint = useCallback((point: Point): CanvasElement | null => {
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    for (const element of sortedElements) {
      const bounds = getElementBounds(element);
      if (isPointInBounds(point, bounds)) {
        return element;
      }
    }
    return null;
  }, [elements]);

  // Find elements in selection box
  const findElementsInBox = useCallback((box: { x: number; y: number; width: number; height: number }): string[] => {
    const normalizedBox = {
      x: box.width < 0 ? box.x + box.width : box.x,
      y: box.height < 0 ? box.y + box.height : box.y,
      width: Math.abs(box.width),
      height: Math.abs(box.height),
    };

    return elements
      .filter((element) => {
        const bounds = getElementBounds(element);
        return (
          bounds.x < normalizedBox.x + normalizedBox.width &&
          bounds.x + bounds.width > normalizedBox.x &&
          bounds.y < normalizedBox.y + normalizedBox.height &&
          bounds.y + bounds.height > normalizedBox.y
        );
      })
      .map((el) => el.id);
  }, [elements]);

  // Get resize handle at point
  const getResizeHandleAtPoint = useCallback((point: Point, element: CanvasElement): ResizeHandle | null => {
    if (element.type === "connection" || element.type === "pencil") return null;

    const bounds = getElementBounds(element);
    const handlePositions: { handle: ResizeHandle; x: number; y: number }[] = [
      { handle: "nw", x: bounds.x, y: bounds.y },
      { handle: "n", x: bounds.x + bounds.width / 2, y: bounds.y },
      { handle: "ne", x: bounds.x + bounds.width, y: bounds.y },
      { handle: "e", x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { handle: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { handle: "s", x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { handle: "sw", x: bounds.x, y: bounds.y + bounds.height },
      { handle: "w", x: bounds.x, y: bounds.y + bounds.height / 2 },
      { handle: "rotate", x: bounds.x + bounds.width / 2, y: bounds.y - ROTATION_HANDLE_DISTANCE / zoom },
    ];

    const threshold = HANDLE_SIZE / zoom;
    for (const { handle, x, y } of handlePositions) {
      if (Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold) {
        return handle;
      }
    }
    return null;
  }, [zoom]);

  // Update element
  const updateElement = useCallback((id: string, updates: Record<string, unknown>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } as CanvasElement : el))
    );
  }, [setElements]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const point = getCanvasPoint(e);

    switch (activeTool) {
      case "select": {
        if (selectedIds.length === 1) {
          const selectedEl = elements.find((el) => el.id === selectedIds[0]);
          if (selectedEl) {
            const handle = getResizeHandleAtPoint(point, selectedEl);
            if (handle) {
              setIsResizing(true);
              setResizeHandle(handle);
              setDragStart(point);
              const bounds = getElementBounds(selectedEl);
              setInitialBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
              return;
            }
          }
        }

        const element = findElementAtPoint(point);
        if (element) {
          if (e.shiftKey) {
            setSelectedIds((prev) =>
              prev.includes(element.id)
                ? prev.filter((id) => id !== element.id)
                : [...prev, element.id]
            );
          } else {
            setSelectedIds([element.id]);
          }
          setIsDragging(true);
          setDragStart(point);
        } else {
          setSelectedIds([]);
          setIsSelecting(true);
          setDragStart(point);
          setSelectionBox({ x: point.x, y: point.y, width: 0, height: 0 });
        }
        break;
      }

      case "pan": {
        setIsPanning(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        break;
      }

      case "rectangle":
      case "ellipse":
      case "diamond":
      case "triangle": {
        const newShape = createShapeElement(activeTool, point.x, point.y, {
          width: 0,
          height: 0,
          fill: currentColor,
          stroke: currentStrokeColor,
        });
        setElements((prev) => [...prev, newShape]);
        setSelectedIds([newShape.id]);
        setIsResizing(true);
        setResizeHandle("se");
        setDragStart(point);
        setInitialBounds({ x: point.x, y: point.y, width: 0, height: 0 });
        break;
      }

      case "text": {
        const newText = createTextElement(point.x, point.y);
        setElements((prev) => [...prev, newText]);
        setSelectedIds([newText.id]);
        pushHistory([...elements, newText]);
        setActiveTool("select");
        break;
      }

      case "sticky": {
        const newSticky = createStickyElement(point.x, point.y);
        setElements((prev) => [...prev, newSticky]);
        setSelectedIds([newSticky.id]);
        pushHistory([...elements, newSticky]);
        setActiveTool("select");
        break;
      }

      case "connection": {
        const element = findElementAtPoint(point);
        if (element && element.type !== "connection" && element.type !== "pencil") {
          const anchor = findNearestAnchor(point, element);
          if (anchor) {
            setConnectionStart({
              elementId: element.id,
              anchor: anchor.position,
              point: anchor.point,
            });
            setIsDrawing(true);
          }
        } else {
          setConnectionStart({ elementId: null, anchor: "center", point });
          setIsDrawing(true);
        }
        break;
      }

      case "pencil": {
        setCurrentPencilPoints([point]);
        setIsDrawing(true);
        break;
      }
    }
  }, [activeTool, currentColor, currentStrokeColor, elements, findElementAtPoint, getCanvasPoint, getResizeHandleAtPoint, pan, pushHistory, selectedIds, setActiveTool, setElements, setSelectedIds]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    const keepProportions = e.metaKey || e.ctrlKey;

    if (isPanning && dragStart) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    if (isResizing && dragStart && selectedIds.length > 0 && initialBounds && resizeHandle) {
      const selectedEl = elements.find((el) => el.id === selectedIds[0]);
      if (!selectedEl || selectedEl.type === "connection" || selectedEl.type === "pencil") return;

      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;

      let newX = initialBounds.x;
      let newY = initialBounds.y;
      let newWidth = initialBounds.width;
      let newHeight = initialBounds.height;

      if (resizeHandle === "rotate") {
        const centerX = initialBounds.x + initialBounds.width / 2;
        const centerY = initialBounds.y + initialBounds.height / 2;
        let angle = Math.atan2(point.y - centerY, point.x - centerX) * (180 / Math.PI) + 90;
        if (keepProportions) {
          angle = Math.round(angle / 15) * 15;
        }
        updateElement(selectedIds[0], { rotation: angle });
        return;
      }

      switch (resizeHandle) {
        case "nw": newWidth = initialBounds.width - dx; newHeight = initialBounds.height - dy; break;
        case "n": newHeight = initialBounds.height - dy; break;
        case "ne": newWidth = initialBounds.width + dx; newHeight = initialBounds.height - dy; break;
        case "e": newWidth = initialBounds.width + dx; break;
        case "se": newWidth = initialBounds.width + dx; newHeight = initialBounds.height + dy; break;
        case "s": newHeight = initialBounds.height + dy; break;
        case "sw": newWidth = initialBounds.width - dx; newHeight = initialBounds.height + dy; break;
        case "w": newWidth = initialBounds.width - dx; break;
      }

      if (keepProportions && ["nw", "ne", "se", "sw"].includes(resizeHandle)) {
        const isNewShape = initialBounds.width === 0 && initialBounds.height === 0;
        if (isNewShape) {
          const maxDimension = Math.max(Math.abs(newWidth), Math.abs(newHeight));
          newWidth = newWidth >= 0 ? maxDimension : -maxDimension;
          newHeight = newHeight >= 0 ? maxDimension : -maxDimension;
        } else {
          const aspectRatio = initialBounds.width / initialBounds.height || 1;
          if (Math.abs(dx) > Math.abs(dy)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }
      }

      if (newWidth < 20) newWidth = 20;
      if (newHeight < 20) newHeight = 20;

      switch (resizeHandle) {
        case "nw": newX = initialBounds.x + initialBounds.width - newWidth; newY = initialBounds.y + initialBounds.height - newHeight; break;
        case "n": newY = initialBounds.y + initialBounds.height - newHeight; break;
        case "ne": newY = initialBounds.y + initialBounds.height - newHeight; break;
        case "sw": newX = initialBounds.x + initialBounds.width - newWidth; break;
        case "w": newX = initialBounds.x + initialBounds.width - newWidth; break;
      }

      updateElement(selectedIds[0], { x: newX, y: newY, width: newWidth, height: newHeight });
      return;
    }

    if (isDragging && dragStart && selectedIds.length > 0) {
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      setElements((prev) =>
        prev.map((el) =>
          selectedIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
        )
      );
      setDragStart(point);
    }

    if (isDrawing && activeTool === "pencil") {
      setCurrentPencilPoints((prev) => [...prev, point]);
    }

    if (isSelecting && dragStart) {
      setSelectionBox({
        x: dragStart.x,
        y: dragStart.y,
        width: point.x - dragStart.x,
        height: point.y - dragStart.y,
      });
    }

    // Update hover states
    if (activeTool === "select" && !isDragging && !isResizing && !isSelecting && selectedIds.length === 1) {
      const selectedEl = elements.find((el) => el.id === selectedIds[0]);
      if (selectedEl) {
        const handle = getResizeHandleAtPoint(point, selectedEl);
        setHoveredHandle(handle);
      }
    } else if (!isResizing) {
      setHoveredHandle(null);
      setIsNearCorner(false);
    }
  }, [activeTool, dragStart, elements, getCanvasPoint, getResizeHandleAtPoint, initialBounds, isDragging, isDrawing, isPanning, isResizing, isSelecting, resizeHandle, selectedIds, setElements, setPan, updateElement]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setDragStart(null);
      setInitialBounds(null);
      pushHistory(elements);
      if (["rectangle", "ellipse", "diamond", "triangle"].includes(activeTool)) {
        setActiveTool("select");
      }
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      pushHistory(elements);
    }

    if (isSelecting && selectionBox) {
      const selectedElementIds = findElementsInBox(selectionBox);
      setSelectedIds(selectedElementIds);
      setIsSelecting(false);
      setSelectionBox(null);
      setDragStart(null);
    }

    if (isDrawing) {
      if (activeTool === "connection" && connectionStart) {
        const element = findElementAtPoint(point);
        let endElementId: string | null = null;
        let endAnchor: AnchorPosition = "center";
        let endPoint = point;

        if (element && element.type !== "connection" && element.type !== "pencil") {
          const anchor = findNearestAnchor(point, element);
          if (anchor) {
            endElementId = element.id;
            endAnchor = anchor.position;
            endPoint = anchor.point;
          }
        }

        const newConnection = createConnectionElement(connectionStart.point, endPoint, {
          startElementId: connectionStart.elementId,
          endElementId,
          startAnchor: connectionStart.anchor,
          endAnchor,
          stroke: currentStrokeColor,
        });
        setElements((prev) => [...prev, newConnection]);
        pushHistory([...elements, newConnection]);
        setConnectionStart(null);
      } else if (activeTool === "pencil" && currentPencilPoints.length > 1) {
        const newPencil = createPencilElement(currentPencilPoints, {
          stroke: currentStrokeColor,
        });
        setElements((prev) => [...prev, newPencil]);
        pushHistory([...elements, newPencil]);
        setCurrentPencilPoints([]);
      }

      setIsDrawing(false);
    }
  }, [activeTool, connectionStart, currentPencilPoints, currentStrokeColor, elements, findElementAtPoint, findElementsInBox, getCanvasPoint, isDragging, isDrawing, isPanning, isResizing, isSelecting, pushHistory, selectionBox, setActiveTool, setElements, setSelectedIds]);

  // Handle wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleChange = newZoom / zoom;
        const newPanX = mouseX - (mouseX - pan.x) * scaleChange;
        const newPanY = mouseY - (mouseY - pan.y) * scaleChange;

        setPan({ x: newPanX, y: newPanY });
      }

      setZoom(newZoom);
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [canvasRef, pan, setPan, setZoom, zoom]);

  // Get cursor style
  const getCursorStyle = useCallback((): string => {
    if (isPanning) return "grabbing";
    if (activeTool === "pan") return "grab";

    if (isResizing && resizeHandle) {
      if (resizeHandle === "rotate") return "grabbing";
      return `${resizeHandle}-resize`;
    }

    if (activeTool === "select") {
      if (isNearCorner || hoveredHandle === "rotate") {
        return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M21 12a9 9 0 11-9-9'/%3E%3Cpath d='M12 3l3 3-3 3'/%3E%3C/svg%3E\") 12 12, pointer";
      }

      if (hoveredHandle) {
        const cursorMap: Record<string, string> = {
          nw: "nw-resize", n: "n-resize", ne: "ne-resize", e: "e-resize",
          se: "se-resize", s: "s-resize", sw: "sw-resize", w: "w-resize",
          rotate: "grab",
        };
        return cursorMap[hoveredHandle] || "default";
      }

      return "default";
    }

    return "crosshair";
  }, [activeTool, hoveredHandle, isNearCorner, isPanning, isResizing, resizeHandle]);

  return {
    // States
    isDragging,
    isPanning,
    isDrawing,
    isResizing,
    isSelecting,
    selectionBox,
    currentPencilPoints,
    connectionStart,
    hoveredHandle,
    isNearCorner,
    resizeHandle,

    // Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getCursorStyle,
    getCanvasPoint,
    updateElement,
  };
}
