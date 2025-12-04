"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Tool,
  CanvasElement,
  Point,
  WorkspaceConfig,
  defaultWorkspaceConfig,
} from "@/types/mindmap";
import { STORAGE_KEY } from "../constants";

export function useCanvasState() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [config, setConfig] = useState<WorkspaceConfig>(defaultWorkspaceConfig);

  // Colors
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [currentStrokeColor, setCurrentStrokeColor] = useState("#0f172a");

  // History for undo/redo
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.elements) setElements(data.elements);
        if (data.config) setConfig({ ...defaultWorkspaceConfig, ...data.config });
      } catch (e) {
        console.error("Failed to load workspace data:", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data = { elements, config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [elements, config]);

  // Push to history
  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Update element
  const updateElement = useCallback((id: string, updates: Record<string, unknown>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } as CanvasElement : el))
    );
  }, []);

  // Delete selected
  const deleteSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      const newElements = elements.filter((el) => !selectedIds.includes(el.id));
      setElements(newElements);
      setSelectedIds([]);
      pushHistory(newElements);
    }
  }, [elements, pushHistory, selectedIds]);

  // Duplicate selected
  const duplicateSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      const duplicates = elements
        .filter((el) => selectedIds.includes(el.id))
        .map((el) => ({
          ...el,
          id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          x: el.x + 20,
          y: el.y + 20,
          zIndex: Date.now(),
        }));
      const newElements = [...elements, ...duplicates];
      setElements(newElements);
      setSelectedIds(duplicates.map((el) => el.id));
      pushHistory(newElements);
    }
  }, [elements, pushHistory, selectedIds]);

  // Bring forward
  const bringForward = useCallback(() => {
    if (selectedIds.length === 1) {
      const maxZ = Math.max(...elements.map((el) => el.zIndex));
      updateElement(selectedIds[0], { zIndex: maxZ + 1 });
    }
  }, [elements, selectedIds, updateElement]);

  // Send backward
  const sendBackward = useCallback(() => {
    if (selectedIds.length === 1) {
      const minZ = Math.min(...elements.map((el) => el.zIndex));
      updateElement(selectedIds[0], { zIndex: minZ - 1 });
    }
  }, [elements, selectedIds, updateElement]);

  // Toggle grid
  const toggleGrid = useCallback(() => {
    setConfig((prev) => ({ ...prev, gridEnabled: !prev.gridEnabled }));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setElements([]);
    setSelectedIds([]);
    setHistory([[]]);
    setHistoryIndex(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    // State
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
    history,
    historyIndex,

    // Actions
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
  };
}
