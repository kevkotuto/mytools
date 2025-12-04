"use client";

import { useMemo } from "react";
import {
  CanvasElement,
  ShapeElement,
  TextElement,
  StickyElement,
  ConnectionElement,
  PencilElement,
  ImageElement,
  Point,
  getElementBounds,
  getElementAnchors,
} from "@/types/mindmap";
import { ResizeHandle } from "./types";
import { HANDLE_SIZE, ROTATION_HANDLE_DISTANCE } from "./constants";

interface CanvasRendererProps {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  activeTool: string;
  hoveredHandle: ResizeHandle | null;
  isNearCorner: boolean;
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  editingTextId: string | null;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onFinishTextEditing: () => void;
}

export function CanvasRenderer({
  elements,
  selectedIds,
  zoom,
  activeTool,
  hoveredHandle,
  isNearCorner,
  isResizing,
  resizeHandle,
  editingTextId,
  editingContent,
  onEditingContentChange,
  onFinishTextEditing,
}: CanvasRendererProps) {
  const selectedElement = useMemo(() => {
    if (selectedIds.length === 1) {
      return elements.find((el) => el.id === selectedIds[0]) || null;
    }
    return null;
  }, [selectedIds, elements]);

  const renderResizeHandles = (element: CanvasElement) => {
    if (element.type === "connection" || element.type === "pencil") return null;

    const bounds = getElementBounds(element);
    const cornerHandles = ["nw", "ne", "se", "sw"];
    const handlePositions = [
      { handle: "nw", x: bounds.x, y: bounds.y },
      { handle: "n", x: bounds.x + bounds.width / 2, y: bounds.y },
      { handle: "ne", x: bounds.x + bounds.width, y: bounds.y },
      { handle: "e", x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { handle: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { handle: "s", x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { handle: "sw", x: bounds.x, y: bounds.y + bounds.height },
      { handle: "w", x: bounds.x, y: bounds.y + bounds.height / 2 },
    ];

    const handleSize = HANDLE_SIZE / zoom;
    const rotationDistance = ROTATION_HANDLE_DISTANCE / zoom;

    return (
      <g className="pointer-events-none">
        <rect
          x={bounds.x - 1}
          y={bounds.y - 1}
          width={bounds.width + 2}
          height={bounds.height + 2}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5 / zoom}
        />

        {handlePositions.map(({ handle, x, y }) => {
          const isCorner = cornerHandles.includes(handle);
          const isHovered = hoveredHandle === handle;

          return (
            <rect
              key={handle}
              x={x - handleSize / 2}
              y={y - handleSize / 2}
              width={handleSize}
              height={handleSize}
              fill={isHovered ? "#3b82f6" : "white"}
              stroke="#3b82f6"
              strokeWidth={1.5 / zoom}
              rx={isCorner ? handleSize / 4 : 0}
              className="pointer-events-auto"
              style={{ cursor: `${handle}-resize` }}
            />
          );
        })}

        <line
          x1={bounds.x + bounds.width / 2}
          y1={bounds.y}
          x2={bounds.x + bounds.width / 2}
          y2={bounds.y - rotationDistance + handleSize}
          stroke="#3b82f6"
          strokeWidth={1.5 / zoom}
        />

        <g className="pointer-events-auto" style={{ cursor: "grab" }}>
          <circle
            cx={bounds.x + bounds.width / 2}
            cy={bounds.y - rotationDistance}
            r={handleSize * 0.7}
            fill={hoveredHandle === "rotate" ? "#3b82f6" : "white"}
            stroke="#3b82f6"
            strokeWidth={1.5 / zoom}
          />
        </g>

        <foreignObject
          x={bounds.x + bounds.width / 2 - 40}
          y={bounds.y + bounds.height + 8 / zoom}
          width={80}
          height={24}
          className="pointer-events-none"
        >
          <div
            className="flex items-center justify-center rounded-full bg-primary/90 px-2 py-0.5 text-primary-foreground"
            style={{ fontSize: `${10 / zoom}px` }}
          >
            {Math.round(bounds.width)} × {Math.round(bounds.height)}
          </div>
        </foreignObject>

        {isResizing && resizeHandle === "rotate" && (
          <foreignObject
            x={bounds.x + bounds.width / 2 - 30}
            y={bounds.y - rotationDistance - handleSize * 2.5}
            width={60}
            height={20}
            className="pointer-events-none"
          >
            <div
              className="flex items-center justify-center rounded-full bg-primary/90 px-2 py-0.5 text-primary-foreground"
              style={{ fontSize: `${10 / zoom}px` }}
            >
              {Math.round(element.rotation || 0)}°
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedIds.includes(element.id);

    switch (element.type) {
      case "rectangle": {
        const shape = element as ShapeElement;
        return (
          <g key={element.id} transform={`rotate(${shape.rotation || 0} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`}>
            <rect
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rx={shape.cornerRadius}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              opacity={shape.opacity}
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {shape.text && (
              <text
                x={shape.x + shape.width / 2}
                y={shape.y + shape.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={shape.fontSize || 14}
                fontFamily={shape.fontFamily || "Inter, sans-serif"}
                fontWeight={shape.fontWeight || "normal"}
                fontStyle={shape.fontStyle || "normal"}
                fill={shape.textColor || "#0f172a"}
                style={{
                  textShadow: shape.textShadow,
                  pointerEvents: "none",
                }}
              >
                {shape.text}
              </text>
            )}
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      case "ellipse": {
        const shape = element as ShapeElement;
        return (
          <g key={element.id} transform={`rotate(${shape.rotation || 0} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`}>
            <ellipse
              cx={shape.x + shape.width / 2}
              cy={shape.y + shape.height / 2}
              rx={shape.width / 2}
              ry={shape.height / 2}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              opacity={shape.opacity}
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {shape.text && (
              <text
                x={shape.x + shape.width / 2}
                y={shape.y + shape.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={shape.fontSize || 14}
                fontFamily={shape.fontFamily || "Inter, sans-serif"}
                fontWeight={shape.fontWeight || "normal"}
                fontStyle={shape.fontStyle || "normal"}
                fill={shape.textColor || "#0f172a"}
                style={{
                  textShadow: shape.textShadow,
                  pointerEvents: "none",
                }}
              >
                {shape.text}
              </text>
            )}
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      case "diamond": {
        const shape = element as ShapeElement;
        const points = [
          `${shape.x + shape.width / 2},${shape.y}`,
          `${shape.x + shape.width},${shape.y + shape.height / 2}`,
          `${shape.x + shape.width / 2},${shape.y + shape.height}`,
          `${shape.x},${shape.y + shape.height / 2}`,
        ].join(" ");
        return (
          <g key={element.id} transform={`rotate(${shape.rotation || 0} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`}>
            <polygon
              points={points}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              opacity={shape.opacity}
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {shape.text && (
              <text
                x={shape.x + shape.width / 2}
                y={shape.y + shape.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={shape.fontSize || 14}
                fontFamily={shape.fontFamily || "Inter, sans-serif"}
                fontWeight={shape.fontWeight || "normal"}
                fontStyle={shape.fontStyle || "normal"}
                fill={shape.textColor || "#0f172a"}
                style={{
                  textShadow: shape.textShadow,
                  pointerEvents: "none",
                }}
              >
                {shape.text}
              </text>
            )}
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      case "triangle": {
        const shape = element as ShapeElement;
        const points = [
          `${shape.x + shape.width / 2},${shape.y}`,
          `${shape.x + shape.width},${shape.y + shape.height}`,
          `${shape.x},${shape.y + shape.height}`,
        ].join(" ");
        return (
          <g key={element.id} transform={`rotate(${shape.rotation || 0} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`}>
            <polygon
              points={points}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              opacity={shape.opacity}
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {shape.text && (
              <text
                x={shape.x + shape.width / 2}
                y={shape.y + shape.height * 0.6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={shape.fontSize || 14}
                fontFamily={shape.fontFamily || "Inter, sans-serif"}
                fontWeight={shape.fontWeight || "normal"}
                fontStyle={shape.fontStyle || "normal"}
                fill={shape.textColor || "#0f172a"}
                style={{
                  textShadow: shape.textShadow,
                  pointerEvents: "none",
                }}
              >
                {shape.text}
              </text>
            )}
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      case "text": {
        const text = element as TextElement;
        const isEditing = editingTextId === element.id;
        return (
          <g key={element.id}>
            {isEditing ? (
              <foreignObject x={text.x} y={text.y} width={text.width} height={text.fontSize * 2}>
                <input
                  type="text"
                  value={editingContent}
                  onChange={(e) => onEditingContentChange(e.target.value)}
                  onBlur={onFinishTextEditing}
                  onKeyDown={(e) => e.key === "Enter" && onFinishTextEditing()}
                  autoFocus
                  className="w-full bg-transparent outline-none"
                  style={{
                    fontSize: text.fontSize,
                    fontFamily: text.fontFamily,
                    fontWeight: text.fontWeight,
                    fontStyle: text.fontStyle,
                    color: text.color,
                  }}
                />
              </foreignObject>
            ) : (
              <text
                x={text.x}
                y={text.y + text.fontSize}
                fontSize={text.fontSize}
                fontFamily={text.fontFamily}
                fontWeight={text.fontWeight}
                fontStyle={text.fontStyle}
                fill={text.color}
                textDecoration={text.textDecoration}
                letterSpacing={text.letterSpacing}
                style={{
                  cursor: activeTool === "select" ? "move" : "default",
                  textShadow: text.textShadow,
                }}
              >
                {text.content}
              </text>
            )}
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      case "sticky": {
        const sticky = element as StickyElement;
        const isEditing = editingTextId === element.id;
        return (
          <g key={element.id} transform={`rotate(${sticky.rotation || 0} ${sticky.x + sticky.width / 2} ${sticky.y + sticky.height / 2})`}>
            <rect
              x={sticky.x}
              y={sticky.y}
              width={sticky.width}
              height={sticky.height}
              fill={sticky.backgroundColor}
              stroke="#00000020"
              strokeWidth={1}
              rx={4}
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {isEditing ? (
              <foreignObject x={sticky.x + 8} y={sticky.y + 8} width={sticky.width - 16} height={sticky.height - 16}>
                <textarea
                  value={editingContent}
                  onChange={(e) => onEditingContentChange(e.target.value)}
                  onBlur={onFinishTextEditing}
                  autoFocus
                  className="w-full h-full bg-transparent outline-none resize-none"
                  style={{ fontSize: sticky.fontSize }}
                />
              </foreignObject>
            ) : (
              <foreignObject x={sticky.x + 8} y={sticky.y + 8} width={sticky.width - 16} height={sticky.height - 16}>
                <div
                  className="w-full h-full overflow-hidden text-sm"
                  style={{ fontSize: sticky.fontSize }}
                >
                  {sticky.content || "Double-cliquez..."}
                </div>
              </foreignObject>
            )}
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      case "connection": {
        const conn = element as ConnectionElement;
        const { startPoint, endPoint, style, endEndpoint } = conn;
        let pathD = "";

        if (style === "straight") {
          pathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
        } else if (style === "curved") {
          const midX = (startPoint.x + endPoint.x) / 2;
          const midY = (startPoint.y + endPoint.y) / 2;
          const dx = endPoint.x - startPoint.x;
          const dy = endPoint.y - startPoint.y;
          const controlX = midX + dy * 0.2;
          const controlY = midY - dx * 0.2;
          pathD = `M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}`;
        } else {
          const midX = (startPoint.x + endPoint.x) / 2;
          pathD = `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`;
        }

        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
        const arrowSize = 10;

        return (
          <g key={element.id}>
            <path
              d={pathD}
              fill="none"
              stroke={conn.stroke}
              strokeWidth={conn.strokeWidth}
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {endEndpoint === "arrow" && (
              <polygon
                points={`
                  ${endPoint.x},${endPoint.y}
                  ${endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6)},${endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)}
                  ${endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6)},${endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)}
                `}
                fill={conn.stroke}
              />
            )}
          </g>
        );
      }

      case "pencil": {
        const pencil = element as PencilElement;
        if (pencil.points.length < 2) return null;
        const pathD = `M ${pencil.points[0].x} ${pencil.points[0].y} ${pencil.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
        return (
          <path
            key={element.id}
            d={pathD}
            fill="none"
            stroke={pencil.stroke}
            strokeWidth={pencil.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ cursor: activeTool === "select" ? "move" : "default" }}
          />
        );
      }

      case "image": {
        const img = element as ImageElement;
        return (
          <g key={element.id} transform={`rotate(${img.rotation || 0} ${img.x + img.width / 2} ${img.y + img.height / 2})`}>
            <image
              href={img.src}
              x={img.x}
              y={img.y}
              width={img.width}
              height={img.height}
              opacity={img.opacity}
              preserveAspectRatio="none"
              style={{ cursor: activeTool === "select" ? "move" : "default" }}
            />
            {isSelected && renderResizeHandles(element)}
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {elements.sort((a, b) => a.zIndex - b.zIndex).map(renderElement)}
      {activeTool === "connection" &&
        elements
          .filter((el) => el.type !== "connection" && el.type !== "pencil")
          .map((el) =>
            getElementAnchors(el).map((anchor) => (
              <circle
                key={`${el.id}-${anchor.position}`}
                cx={anchor.point.x}
                cy={anchor.point.y}
                r={6}
                fill="#3b82f6"
                opacity={0.5}
              />
            ))
          )}
    </>
  );
}
