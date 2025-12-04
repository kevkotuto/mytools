"use client";

import { useRef } from "react";
import {
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Grid3X3,
  Upload,
  Download,
} from "lucide-react";

interface TopToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  gridEnabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleGrid: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export function TopToolbar({
  canUndo,
  canRedo,
  hasSelection,
  gridEnabled,
  onUndo,
  onRedo,
  onDelete,
  onDuplicate,
  onToggleGrid,
  onImport,
  onExport,
}: TopToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
        title="Annuler (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
        title="Rétablir (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        onClick={onDuplicate}
        disabled={!hasSelection}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
        title="Dupliquer (Ctrl+D)"
      >
        <Copy className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      <button
        onClick={onToggleGrid}
        className={`rounded p-1.5 transition-colors ${
          gridEnabled
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
        title="Grille"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".json"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="Importer"
      >
        <Upload className="h-4 w-4" />
      </button>
      <button
        onClick={onExport}
        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="Exporter"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
