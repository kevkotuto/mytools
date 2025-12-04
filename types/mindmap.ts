// Types pour le Mindmap Workspace

export type Tool =
  | "select"
  | "pan"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "text"
  | "sticky"
  | "connection"
  | "pencil"
  | "image";

export type ConnectionStyle = "straight" | "curved" | "elbow" | "step";
export type ConnectionEndpoint = "none" | "arrow" | "dot" | "diamond";

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Points d'ancrage pour les connexions magnétiques
export type AnchorPosition = "top" | "right" | "bottom" | "left" | "center";

export interface Anchor {
  position: AnchorPosition;
  point: Point;
}

// Élément de base
export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

// Formes géométriques
export interface ShapeElement extends BaseElement {
  type: "rectangle" | "ellipse" | "diamond" | "triangle";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  opacity: number;
  // Texte dans la forme
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  textShadow?: string;
}

// Élément texte
export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  color: string;
  width: number;
  textAlign: "left" | "center" | "right";
  textShadow?: string;
  letterSpacing?: number;
  lineHeight?: number;
}

// Post-it / Sticky note
export interface StickyElement extends BaseElement {
  type: "sticky";
  width: number;
  height: number;
  content: string;
  backgroundColor: string;
  fontSize: number;
}

// Connexion / Flèche
export interface ConnectionElement extends BaseElement {
  type: "connection";
  startElementId: string | null;
  endElementId: string | null;
  startAnchor: AnchorPosition;
  endAnchor: AnchorPosition;
  startPoint: Point;
  endPoint: Point;
  controlPoints: Point[];
  style: ConnectionStyle;
  startEndpoint: ConnectionEndpoint;
  endEndpoint: ConnectionEndpoint;
  stroke: string;
  strokeWidth: number;
  label?: string;
}

// Dessin libre
export interface PencilElement extends BaseElement {
  type: "pencil";
  points: Point[];
  stroke: string;
  strokeWidth: number;
}

// Image
export interface ImageElement extends BaseElement {
  type: "image";
  width: number;
  height: number;
  src: string; // Base64 data URL
  opacity: number;
  originalWidth: number;
  originalHeight: number;
}

// Union de tous les types d'éléments
export type CanvasElement =
  | ShapeElement
  | TextElement
  | StickyElement
  | ConnectionElement
  | PencilElement
  | ImageElement;

// État du canvas
export interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  panX: number;
  panY: number;
}

// Historique pour undo/redo
export interface HistoryState {
  past: CanvasElement[][];
  present: CanvasElement[];
  future: CanvasElement[][];
}

// Configuration du workspace
export interface WorkspaceConfig {
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapToElements: boolean;
  showMinimap: boolean;
  backgroundColor: string;
}

export const defaultWorkspaceConfig: WorkspaceConfig = {
  gridEnabled: true,
  gridSize: 20,
  snapToGrid: false,
  snapToElements: true,
  showMinimap: false,
  backgroundColor: "#ffffff",
};

// Couleurs prédéfinies pour les sticky notes
export const stickyColors = [
  "#fef08a", // Jaune
  "#fed7aa", // Orange
  "#fecaca", // Rouge
  "#d9f99d", // Vert clair
  "#a5f3fc", // Cyan
  "#ddd6fe", // Violet
  "#fbcfe8", // Rose
  "#e5e7eb", // Gris
];

// Couleurs prédéfinies pour les formes
export const shapeColors = [
  "#ffffff", // Blanc
  "#f3f4f6", // Gris clair
  "#3b82f6", // Bleu
  "#10b981", // Vert
  "#f59e0b", // Orange
  "#ef4444", // Rouge
  "#8b5cf6", // Violet
  "#ec4899", // Rose
  "#0f172a", // Noir
];

// Labels pour les outils
export const toolLabels: Record<Tool, string> = {
  select: "Sélection",
  pan: "Déplacer",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  diamond: "Losange",
  triangle: "Triangle",
  text: "Texte",
  sticky: "Post-it",
  connection: "Connexion",
  pencil: "Crayon",
  image: "Image",
};

// Fonctions utilitaires
export function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createShapeElement(
  type: ShapeElement["type"],
  x: number,
  y: number,
  partial?: Partial<ShapeElement>
): ShapeElement {
  return {
    id: generateId(),
    type,
    x,
    y,
    width: 150,
    height: 100,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    fill: "#ffffff",
    stroke: "#0f172a",
    strokeWidth: 2,
    cornerRadius: type === "rectangle" ? 8 : 0,
    opacity: 1,
    ...partial,
  };
}

export function createTextElement(
  x: number,
  y: number,
  content: string = "Texte",
  partial?: Partial<TextElement>
): TextElement {
  return {
    id: generateId(),
    type: "text",
    x,
    y,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    content,
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#0f172a",
    width: 200,
    textAlign: "left",
    ...partial,
  };
}

export function createStickyElement(
  x: number,
  y: number,
  partial?: Partial<StickyElement>
): StickyElement {
  return {
    id: generateId(),
    type: "sticky",
    x,
    y,
    width: 200,
    height: 200,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    content: "",
    backgroundColor: stickyColors[0],
    fontSize: 14,
    ...partial,
  };
}

export function createConnectionElement(
  startPoint: Point,
  endPoint: Point,
  partial?: Partial<ConnectionElement>
): ConnectionElement {
  return {
    id: generateId(),
    type: "connection",
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    startElementId: null,
    endElementId: null,
    startAnchor: "right",
    endAnchor: "left",
    startPoint,
    endPoint,
    controlPoints: [],
    style: "curved",
    startEndpoint: "none",
    endEndpoint: "arrow",
    stroke: "#0f172a",
    strokeWidth: 2,
    ...partial,
  };
}

export function createPencilElement(
  points: Point[],
  partial?: Partial<PencilElement>
): PencilElement {
  return {
    id: generateId(),
    type: "pencil",
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    points,
    stroke: "#0f172a",
    strokeWidth: 2,
    ...partial,
  };
}

export function createImageElement(
  x: number,
  y: number,
  src: string,
  width: number,
  height: number,
  partial?: Partial<ImageElement>
): ImageElement {
  return {
    id: generateId(),
    type: "image",
    x,
    y,
    width,
    height,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    src,
    opacity: 1,
    originalWidth: width,
    originalHeight: height,
    ...partial,
  };
}

// Calcul des points d'ancrage pour un élément
export function getElementAnchors(element: CanvasElement): Anchor[] {
  if (element.type === "connection" || element.type === "pencil") {
    return [];
  }

  const { x, y } = element;
  let width = 0;
  let height = 0;

  if (element.type === "text") {
    width = element.width;
    height = element.fontSize * 1.5;
  } else {
    width = element.width;
    height = element.height;
  }

  return [
    { position: "top", point: { x: x + width / 2, y } },
    { position: "right", point: { x: x + width, y: y + height / 2 } },
    { position: "bottom", point: { x: x + width / 2, y: y + height } },
    { position: "left", point: { x, y: y + height / 2 } },
    { position: "center", point: { x: x + width / 2, y: y + height / 2 } },
  ];
}

// Calcul des bounds d'un élément
export function getElementBounds(element: CanvasElement): Bounds {
  if (element.type === "connection") {
    const allPoints = [
      element.startPoint,
      element.endPoint,
      ...element.controlPoints,
    ];
    const xs = allPoints.map((p) => p.x);
    const ys = allPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  if (element.type === "pencil") {
    const xs = element.points.map((p) => p.x);
    const ys = element.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  if (element.type === "text") {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.fontSize * 1.5,
    };
  }

  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

// Vérifier si un point est dans les bounds
export function isPointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// Distance entre deux points
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Trouver l'ancre la plus proche
export function findNearestAnchor(
  point: Point,
  element: CanvasElement,
  threshold: number = 20
): Anchor | null {
  const anchors = getElementAnchors(element);
  let nearest: Anchor | null = null;
  let minDistance = threshold;

  for (const anchor of anchors) {
    const d = distance(point, anchor.point);
    if (d < minDistance) {
      minDistance = d;
      nearest = anchor;
    }
  }

  return nearest;
}
