"use client";

import { useState, useRef } from "react";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Diamond,
  Triangle,
  Type,
  StickyNote,
  ArrowRight,
  Pencil,
  ImageIcon,
} from "lucide-react";
import { Tool } from "@/types/mindmap";
import { shapeColors } from "@/types/mindmap";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  currentColor: string;
  currentStrokeColor: string;
  onColorChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
  onImageUpload?: (src: string, width: number, height: number) => void;
}

const toolButtons: { tool: Tool; icon: React.ReactNode; shortcut: string; label: string }[] = [
  { tool: "select", icon: <MousePointer2 className="h-4 w-4" />, shortcut: "V", label: "Sélection" },
  { tool: "pan", icon: <Hand className="h-4 w-4" />, shortcut: "H", label: "Déplacer" },
  { tool: "rectangle", icon: <Square className="h-4 w-4" />, shortcut: "R", label: "Rectangle" },
  { tool: "ellipse", icon: <Circle className="h-4 w-4" />, shortcut: "O", label: "Ellipse" },
  { tool: "diamond", icon: <Diamond className="h-4 w-4" />, shortcut: "D", label: "Losange" },
  { tool: "triangle", icon: <Triangle className="h-4 w-4" />, shortcut: "G", label: "Triangle" },
  { tool: "text", icon: <Type className="h-4 w-4" />, shortcut: "T", label: "Texte" },
  { tool: "sticky", icon: <StickyNote className="h-4 w-4" />, shortcut: "S", label: "Post-it" },
  { tool: "image", icon: <ImageIcon className="h-4 w-4" />, shortcut: "I", label: "Image" },
  { tool: "connection", icon: <ArrowRight className="h-4 w-4" />, shortcut: "C", label: "Connexion" },
  { tool: "pencil", icon: <Pencil className="h-4 w-4" />, shortcut: "P", label: "Crayon" },
];

export function Toolbar({
  activeTool,
  onToolChange,
  currentColor,
  currentStrokeColor,
  onColorChange,
  onStrokeColorChange,
  onImageUpload,
}: ToolbarProps) {
  const [hoveredToolIndex, setHoveredToolIndex] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          onImageUpload(src, img.width, img.height);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleToolClick = (tool: Tool) => {
    if (tool === "image") {
      imageInputRef.current?.click();
    } else {
      onToolChange(tool);
    }
  };

  return (
    <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex flex-col gap-1 rounded-lg border border-border bg-background p-1.5">
      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {toolButtons.map(({ tool, icon, shortcut, label }, index) => (
        <div key={tool} className="relative">
          <button
            onClick={() => handleToolClick(tool)}
            onMouseEnter={() => setHoveredToolIndex(index)}
            onMouseLeave={() => setHoveredToolIndex(null)}
            className={`relative rounded p-2 transition-all duration-150 ${
              activeTool === tool && tool !== "image"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {icon}
          </button>
          {/* Tooltip with shortcut */}
          <div
            className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs transition-all duration-200 ${
              hoveredToolIndex === index
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-1 pointer-events-none"
            }`}
          >
            <span className="font-medium text-foreground">{label}</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              {shortcut}
            </kbd>
          </div>
        </div>
      ))}

      <div className="my-1 h-px bg-border" />

      {/* Color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="Couleurs"
        >
          <div
            className="h-4 w-4 rounded border border-border"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute left-full ml-2 rounded-lg border border-border bg-background p-2 z-20">
            <div className="mb-2 text-xs text-muted-foreground">Remplissage</div>
            <div className="grid grid-cols-3 gap-1">
              {shapeColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`h-6 w-6 rounded border ${
                    currentColor === color ? "border-primary" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-2 mb-2 text-xs text-muted-foreground">Contour</div>
            <div className="grid grid-cols-3 gap-1">
              {shapeColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onStrokeColorChange(color)}
                  className={`h-6 w-6 rounded border ${
                    currentStrokeColor === color ? "border-primary" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
