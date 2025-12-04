// Re-export types from the main types file
export type {
  Tool,
  CanvasElement,
  ShapeElement,
  TextElement,
  StickyElement,
  ConnectionElement,
  PencilElement,
  Point,
  WorkspaceConfig,
  AnchorPosition,
  ConnectionStyle,
  ConnectionEndpoint,
} from "@/types/mindmap";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rotate";

export interface CanvasState {
  elements: import("@/types/mindmap").CanvasElement[];
  selectedIds: string[];
  zoom: number;
  pan: import("@/types/mindmap").Point;
  activeTool: import("@/types/mindmap").Tool;
}

export interface ToolButtonConfig {
  tool: import("@/types/mindmap").Tool;
  icon: React.ReactNode;
  shortcut: string;
  label: string;
}
