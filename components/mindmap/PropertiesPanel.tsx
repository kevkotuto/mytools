"use client";

import { ChevronUp, ChevronDown, Bold, Italic, Underline, Strikethrough } from "lucide-react";
import {
  CanvasElement,
  ShapeElement,
  TextElement,
  StickyElement,
  ImageElement,
} from "@/types/mindmap";
import { shapeColors, stickyColors } from "@/types/mindmap";

const fontFamilies = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times" },
  { value: "Courier New, monospace", label: "Courier" },
  { value: "Comic Sans MS, cursive", label: "Comic Sans" },
];

const textShadowPresets = [
  { value: "", label: "Aucune" },
  { value: "1px 1px 2px rgba(0,0,0,0.3)", label: "Légère" },
  { value: "2px 2px 4px rgba(0,0,0,0.5)", label: "Moyenne" },
  { value: "3px 3px 6px rgba(0,0,0,0.7)", label: "Forte" },
  { value: "0 0 10px rgba(59, 130, 246, 0.8)", label: "Lueur bleue" },
  { value: "0 0 10px rgba(239, 68, 68, 0.8)", label: "Lueur rouge" },
];

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, updates: Record<string, unknown>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Sélectionnez un élément
      </div>
    );
  }

  const isShape = ["rectangle", "ellipse", "diamond", "triangle"].includes(selectedElement.type);
  const isText = selectedElement.type === "text";
  const isSticky = selectedElement.type === "sticky";
  const isImage = selectedElement.type === "image";

  return (
    <div className="space-y-4">
      {/* Position */}
      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Position</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">X</label>
            <input
              type="number"
              value={Math.round(selectedElement.x)}
              onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Y</label>
            <input
              type="number"
              value={Math.round(selectedElement.y)}
              onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      {(isShape || isSticky) && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Taille</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Largeur</label>
              <input
                type="number"
                value={Math.round((selectedElement as ShapeElement | StickyElement).width)}
                onChange={(e) => onUpdateElement(selectedElement.id, { width: Number(e.target.value) })}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hauteur</label>
              <input
                type="number"
                value={Math.round((selectedElement as ShapeElement | StickyElement).height)}
                onChange={(e) => onUpdateElement(selectedElement.id, { height: Number(e.target.value) })}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rotation */}
      {(isShape || isSticky) && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Rotation</h3>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-180"
              max="180"
              value={selectedElement.rotation || 0}
              onChange={(e) => onUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs w-12 text-right">{Math.round(selectedElement.rotation || 0)}°</span>
          </div>
        </div>
      )}

      {/* Fill color for shapes */}
      {isShape && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Remplissage</h3>
          <div className="grid grid-cols-5 gap-1">
            {shapeColors.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateElement(selectedElement.id, { fill: color })}
                className={`h-6 w-6 rounded border ${
                  (selectedElement as ShapeElement).fill === color ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke color for shapes */}
      {isShape && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Contour</h3>
          <div className="grid grid-cols-5 gap-1">
            {shapeColors.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateElement(selectedElement.id, { stroke: color })}
                className={`h-6 w-6 rounded border ${
                  (selectedElement as ShapeElement).stroke === color ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-2">
            <label className="text-xs text-muted-foreground">Épaisseur</label>
            <input
              type="range"
              min="1"
              max="10"
              value={(selectedElement as ShapeElement).strokeWidth}
              onChange={(e) => onUpdateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Opacity for shapes */}
      {isShape && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Opacité</h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={(selectedElement as ShapeElement).opacity}
            onChange={(e) => onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      {/* Text inside shape */}
      {isShape && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Texte dans la forme</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Entrez du texte..."
              value={(selectedElement as ShapeElement).text || ""}
              onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            />
            {(selectedElement as ShapeElement).text && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Taille</label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={(selectedElement as ShapeElement).fontSize || 14}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Police</label>
                    <select
                      value={(selectedElement as ShapeElement).fontFamily || "Inter, sans-serif"}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Style</label>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, {
                        fontWeight: (selectedElement as ShapeElement).fontWeight === "bold" ? "normal" : "bold"
                      })}
                      className={`flex-1 flex items-center justify-center rounded border p-1.5 ${
                        (selectedElement as ShapeElement).fontWeight === "bold"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                      title="Gras"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, {
                        fontStyle: (selectedElement as ShapeElement).fontStyle === "italic" ? "normal" : "italic"
                      })}
                      className={`flex-1 flex items-center justify-center rounded border p-1.5 ${
                        (selectedElement as ShapeElement).fontStyle === "italic"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                      title="Italique"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Couleur texte</label>
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {shapeColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateElement(selectedElement.id, { textColor: color })}
                        className={`h-6 w-6 rounded border ${
                          (selectedElement as ShapeElement).textColor === color ? "border-primary ring-1 ring-primary" : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ombre texte</label>
                  <select
                    value={(selectedElement as ShapeElement).textShadow || ""}
                    onChange={(e) => onUpdateElement(selectedElement.id, { textShadow: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                  >
                    {textShadowPresets.map((preset) => (
                      <option key={preset.label} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Text properties */}
      {isText && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Texte</h3>
          <div className="space-y-3">
            {/* Font size */}
            <div>
              <label className="text-xs text-muted-foreground">Taille</label>
              <input
                type="number"
                min="8"
                max="120"
                value={(selectedElement as TextElement).fontSize}
                onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>

            {/* Font family */}
            <div>
              <label className="text-xs text-muted-foreground">Police</label>
              <select
                value={(selectedElement as TextElement).fontFamily}
                onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text style buttons */}
            <div>
              <label className="text-xs text-muted-foreground">Style</label>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => onUpdateElement(selectedElement.id, {
                    fontWeight: (selectedElement as TextElement).fontWeight === "bold" ? "normal" : "bold"
                  })}
                  className={`flex-1 flex items-center justify-center rounded border p-1.5 ${
                    (selectedElement as TextElement).fontWeight === "bold"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                  title="Gras"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onUpdateElement(selectedElement.id, {
                    fontStyle: (selectedElement as TextElement).fontStyle === "italic" ? "normal" : "italic"
                  })}
                  className={`flex-1 flex items-center justify-center rounded border p-1.5 ${
                    (selectedElement as TextElement).fontStyle === "italic"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                  title="Italique"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onUpdateElement(selectedElement.id, {
                    textDecoration: (selectedElement as TextElement).textDecoration === "underline" ? "none" : "underline"
                  })}
                  className={`flex-1 flex items-center justify-center rounded border p-1.5 ${
                    (selectedElement as TextElement).textDecoration === "underline"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                  title="Souligné"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onUpdateElement(selectedElement.id, {
                    textDecoration: (selectedElement as TextElement).textDecoration === "line-through" ? "none" : "line-through"
                  })}
                  className={`flex-1 flex items-center justify-center rounded border p-1.5 ${
                    (selectedElement as TextElement).textDecoration === "line-through"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                  title="Barré"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Text shadow */}
            <div>
              <label className="text-xs text-muted-foreground">Ombre</label>
              <select
                value={(selectedElement as TextElement).textShadow || ""}
                onChange={(e) => onUpdateElement(selectedElement.id, { textShadow: e.target.value })}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              >
                {textShadowPresets.map((preset) => (
                  <option key={preset.label} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs text-muted-foreground">Couleur</label>
              <div className="grid grid-cols-5 gap-1 mt-1">
                {shapeColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateElement(selectedElement.id, { color: color })}
                    className={`h-6 w-6 rounded border ${
                      (selectedElement as TextElement).color === color ? "border-primary ring-1 ring-primary" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky note color */}
      {isSticky && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Couleur</h3>
          <div className="grid grid-cols-4 gap-1">
            {stickyColors.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateElement(selectedElement.id, { backgroundColor: color })}
                className={`h-8 w-8 rounded border ${
                  (selectedElement as StickyElement).backgroundColor === color ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image properties */}
      {isImage && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Taille</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Largeur</label>
                <input
                  type="number"
                  value={Math.round((selectedElement as ImageElement).width)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { width: Number(e.target.value) })}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hauteur</label>
                <input
                  type="number"
                  value={Math.round((selectedElement as ImageElement).height)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { height: Number(e.target.value) })}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => {
                const img = selectedElement as ImageElement;
                onUpdateElement(selectedElement.id, {
                  width: img.originalWidth,
                  height: img.originalHeight,
                });
              }}
              className="mt-2 w-full rounded border border-border px-2 py-1.5 text-xs hover:bg-secondary"
            >
              Taille originale
            </button>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Rotation</h3>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedElement.rotation || 0}
                onChange={(e) => onUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs w-12 text-right">{Math.round(selectedElement.rotation || 0)}°</span>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Opacité</h3>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={(selectedElement as ImageElement).opacity}
              onChange={(e) => onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Z-order */}
      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Ordre</h3>
        <div className="flex gap-2">
          <button
            onClick={onBringForward}
            className="flex-1 flex items-center justify-center gap-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-secondary"
          >
            <ChevronUp className="h-3 w-3" />
            Avancer
          </button>
          <button
            onClick={onSendBackward}
            className="flex-1 flex items-center justify-center gap-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-secondary"
          >
            <ChevronDown className="h-3 w-3" />
            Reculer
          </button>
        </div>
      </div>
    </div>
  );
}
