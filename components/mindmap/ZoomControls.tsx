"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from "./constants";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

export function ZoomControls({ zoom, onZoomChange, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
      <button
        onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="Zoom arrière"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="min-w-[60px] text-center text-xs font-medium">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="Zoom avant"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        onClick={onReset}
        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="Réinitialiser vue"
      >
        100%
      </button>
    </div>
  );
}
