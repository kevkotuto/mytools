"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Watch,
  Globe,
  Printer,
  FileText,
  Grid3X3,
  LayoutGrid,
  Minus,
  Plus,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type WireframeConfig,
  type DeviceFrame,
  type PaperSize,
  type TemplateLayout,
  type GridConfig,
  type DeviceCategory,
  defaultWireframeConfig,
  paperSizes,
  templateLayouts,
  iphoneDevices,
  androidDevices,
  tabletDevices,
  watchDevices,
  browserDevices,
  deviceCategoryLabels,
} from "@/types/wireframe";

type TabType = "device" | "template" | "paper" | "options";

export default function WireframeGeneratorPage() {
  const [config, setConfig] = useState<WireframeConfig>(defaultWireframeConfig);
  const [activeTab, setActiveTab] = useState<TabType>("device");
  const [activeDeviceCategory, setActiveDeviceCategory] = useState<DeviceCategory>("iphone");
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const devicesByCategory: Record<DeviceCategory, DeviceFrame[]> = {
    iphone: iphoneDevices,
    android: androidDevices,
    tablet: tabletDevices,
    watch: watchDevices,
    desktop: browserDevices.filter(d => d.category === "desktop"),
    browser: browserDevices.filter(d => d.category === "browser"),
  };

  const getCategoryIcon = (category: DeviceCategory) => {
    switch (category) {
      case "iphone":
      case "android":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "watch":
        return <Watch className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      case "browser":
        return <Globe className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  // Convert mm to pixels at 96 DPI
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * 96);

  // Get paper dimensions in pixels
  const getPaperDimensions = () => {
    const { paper, orientation } = config;
    const width = orientation === "portrait" ? paper.width : paper.height;
    const height = orientation === "portrait" ? paper.height : paper.width;
    return {
      width: mmToPx(width),
      height: mmToPx(height),
    };
  };

  // Draw grid pattern on canvas
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    gridConfig: GridConfig
  ) => {
    if (!gridConfig.enabled || gridConfig.type === "none") return;

    ctx.save();
    ctx.globalAlpha = gridConfig.opacity;
    ctx.fillStyle = gridConfig.color;
    ctx.strokeStyle = gridConfig.color;
    ctx.lineWidth = 0.5;

    const spacing = gridConfig.spacing;

    if (gridConfig.type === "dots") {
      for (let gx = spacing; gx < width; gx += spacing) {
        for (let gy = spacing; gy < height; gy += spacing) {
          ctx.beginPath();
          ctx.arc(x + gx, y + gy, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridConfig.type === "lines") {
      ctx.beginPath();
      for (let gx = spacing; gx < width; gx += spacing) {
        ctx.moveTo(x + gx, y);
        ctx.lineTo(x + gx, y + height);
      }
      for (let gy = spacing; gy < height; gy += spacing) {
        ctx.moveTo(x, y + gy);
        ctx.lineTo(x + width, y + gy);
      }
      ctx.stroke();
    } else if (gridConfig.type === "squares") {
      ctx.strokeStyle = gridConfig.color;
      for (let gx = 0; gx < width; gx += spacing) {
        for (let gy = 0; gy < height; gy += spacing) {
          ctx.strokeRect(x + gx, y + gy, spacing, spacing);
        }
      }
    }

    ctx.restore();
  };

  // Draw device frame
  const drawDeviceFrame = (
    ctx: CanvasRenderingContext2D,
    device: DeviceFrame,
    x: number,
    y: number,
    scale: number,
    extended: boolean = false
  ) => {
    const scaledWidth = device.screenWidth * scale;
    const scaledHeight = extended
      ? device.screenHeight * scale * 2
      : device.screenHeight * scale;
    const cornerRadius = (device.cornerRadius || 0) * scale;
    const frameThickness = 3 * scale;
    const frameCornerRadius = cornerRadius + frameThickness;

    // Draw outer frame
    if (config.showDeviceFrame) {
      ctx.save();
      ctx.fillStyle = config.frameColor;
      ctx.beginPath();

      const fx = x - frameThickness;
      const fy = y - frameThickness;
      const fw = scaledWidth + frameThickness * 2;
      const fh = scaledHeight + frameThickness * 2;

      if (frameCornerRadius > 0) {
        ctx.moveTo(fx + frameCornerRadius, fy);
        ctx.lineTo(fx + fw - frameCornerRadius, fy);
        ctx.quadraticCurveTo(fx + fw, fy, fx + fw, fy + frameCornerRadius);
        ctx.lineTo(fx + fw, fy + fh - frameCornerRadius);
        ctx.quadraticCurveTo(fx + fw, fy + fh, fx + fw - frameCornerRadius, fy + fh);
        ctx.lineTo(fx + frameCornerRadius, fy + fh);
        ctx.quadraticCurveTo(fx, fy + fh, fx, fy + fh - frameCornerRadius);
        ctx.lineTo(fx, fy + frameCornerRadius);
        ctx.quadraticCurveTo(fx, fy, fx + frameCornerRadius, fy);
      } else {
        ctx.rect(fx, fy, fw, fh);
      }
      ctx.fill();

      // Side buttons for mobile devices
      if (device.category === "iphone" || device.category === "android") {
        // Power button (right side)
        ctx.fillRect(fx + fw, fy + 80 * scale, 2 * scale, 40 * scale);
        // Volume buttons (left side)
        ctx.fillRect(fx - 2 * scale, fy + 60 * scale, 2 * scale, 25 * scale);
        ctx.fillRect(fx - 2 * scale, fy + 90 * scale, 2 * scale, 50 * scale);
      }

      ctx.restore();
    }

    // Draw screen background
    ctx.save();
    ctx.fillStyle = config.backgroundColor;
    ctx.beginPath();

    if (cornerRadius > 0) {
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + scaledWidth - cornerRadius, y);
      ctx.quadraticCurveTo(x + scaledWidth, y, x + scaledWidth, y + cornerRadius);
      ctx.lineTo(x + scaledWidth, y + scaledHeight - cornerRadius);
      ctx.quadraticCurveTo(x + scaledWidth, y + scaledHeight, x + scaledWidth - cornerRadius, y + scaledHeight);
      ctx.lineTo(x + cornerRadius, y + scaledHeight);
      ctx.quadraticCurveTo(x, y + scaledHeight, x, y + scaledHeight - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    } else {
      ctx.rect(x, y, scaledWidth, scaledHeight);
    }
    ctx.fill();

    // Clip for internal elements
    ctx.clip();

    // Draw grid inside device
    drawGrid(ctx, x, y, scaledWidth, scaledHeight, config.grid);

    ctx.restore();

    // Draw screen border
    ctx.save();
    ctx.strokeStyle = config.frameColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    if (cornerRadius > 0) {
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + scaledWidth - cornerRadius, y);
      ctx.quadraticCurveTo(x + scaledWidth, y, x + scaledWidth, y + cornerRadius);
      ctx.lineTo(x + scaledWidth, y + scaledHeight - cornerRadius);
      ctx.quadraticCurveTo(x + scaledWidth, y + scaledHeight, x + scaledWidth - cornerRadius, y + scaledHeight);
      ctx.lineTo(x + cornerRadius, y + scaledHeight);
      ctx.quadraticCurveTo(x, y + scaledHeight, x, y + scaledHeight - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    } else {
      ctx.rect(x, y, scaledWidth, scaledHeight);
    }
    ctx.stroke();
    ctx.restore();

    // Draw status bar elements
    if (config.showStatusBar && (device.category === "iphone" || device.category === "android")) {
      const statusBarHeight = 22 * scale;
      ctx.save();
      ctx.fillStyle = config.frameColor;
      ctx.globalAlpha = 0.6;
      ctx.font = `${10 * scale}px sans-serif`;

      // Time (left)
      ctx.textAlign = "left";
      ctx.fillText("9:41", x + 15 * scale, y + 15 * scale);

      // Icons (right) - battery, wifi, signal
      ctx.textAlign = "right";

      // Signal bars
      const signalX = x + scaledWidth - 15 * scale;
      for (let i = 0; i < 4; i++) {
        const barHeight = (4 + i * 2) * scale;
        ctx.fillRect(signalX - (4 - i) * 4 * scale, y + statusBarHeight - barHeight, 2 * scale, barHeight - 6 * scale);
      }

      // WiFi icon (simplified)
      ctx.beginPath();
      ctx.arc(x + scaledWidth - 40 * scale, y + 12 * scale, 4 * scale, Math.PI, 0, false);
      ctx.stroke();

      // Battery
      ctx.strokeRect(x + scaledWidth - 58 * scale, y + 7 * scale, 16 * scale, 8 * scale);
      ctx.fillRect(x + scaledWidth - 56 * scale, y + 9 * scale, 11 * scale, 4 * scale);
      ctx.fillRect(x + scaledWidth - 42 * scale, y + 9 * scale, 2 * scale, 4 * scale);

      ctx.restore();

      // Draw notch or Dynamic Island
      if (device.hasNotch) {
        ctx.save();
        ctx.fillStyle = config.frameColor;
        const notchWidth = 150 * scale;
        const notchHeight = 30 * scale;
        const notchX = x + (scaledWidth - notchWidth) / 2;
        ctx.beginPath();
        ctx.moveTo(notchX, y);
        ctx.lineTo(notchX, y + notchHeight - 10 * scale);
        ctx.quadraticCurveTo(notchX, y + notchHeight, notchX + 10 * scale, y + notchHeight);
        ctx.lineTo(notchX + notchWidth - 10 * scale, y + notchHeight);
        ctx.quadraticCurveTo(notchX + notchWidth, y + notchHeight, notchX + notchWidth, y + notchHeight - 10 * scale);
        ctx.lineTo(notchX + notchWidth, y);
        ctx.fill();
        ctx.restore();
      } else if (device.hasDynamicIsland) {
        ctx.save();
        ctx.fillStyle = config.frameColor;
        const islandWidth = 100 * scale;
        const islandHeight = 28 * scale;
        const islandX = x + (scaledWidth - islandWidth) / 2;
        const islandY = y + 10 * scale;
        const islandRadius = islandHeight / 2;
        ctx.beginPath();
        ctx.moveTo(islandX + islandRadius, islandY);
        ctx.lineTo(islandX + islandWidth - islandRadius, islandY);
        ctx.quadraticCurveTo(islandX + islandWidth, islandY, islandX + islandWidth, islandY + islandRadius);
        ctx.quadraticCurveTo(islandX + islandWidth, islandY + islandHeight, islandX + islandWidth - islandRadius, islandY + islandHeight);
        ctx.lineTo(islandX + islandRadius, islandY + islandHeight);
        ctx.quadraticCurveTo(islandX, islandY + islandHeight, islandX, islandY + islandRadius);
        ctx.quadraticCurveTo(islandX, islandY, islandX + islandRadius, islandY);
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw browser bar
    if (config.showBrowserBar && (device.category === "browser" || device.category === "desktop")) {
      const barHeight = 40 * scale;
      ctx.save();

      // Bar background
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x, y, scaledWidth, barHeight);

      // Bar border
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + barHeight);
      ctx.lineTo(x + scaledWidth, y + barHeight);
      ctx.stroke();

      // Window controls (macOS style)
      ctx.fillStyle = "#ff5f57";
      ctx.beginPath();
      ctx.arc(x + 20 * scale, y + barHeight / 2, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#febc2e";
      ctx.beginPath();
      ctx.arc(x + 40 * scale, y + barHeight / 2, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#28c840";
      ctx.beginPath();
      ctx.arc(x + 60 * scale, y + barHeight / 2, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      // URL bar
      ctx.strokeStyle = "#d0d0d0";
      ctx.lineWidth = 1;
      const urlBarX = x + 80 * scale;
      const urlBarWidth = scaledWidth - 100 * scale;
      const urlBarHeight = 24 * scale;
      const urlBarY = y + (barHeight - urlBarHeight) / 2;
      ctx.beginPath();
      ctx.roundRect(urlBarX, urlBarY, urlBarWidth, urlBarHeight, 4 * scale);
      ctx.stroke();

      // Navigation arrows
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5 * scale;
      // Back arrow
      ctx.beginPath();
      ctx.moveTo(x + scaledWidth - 45 * scale, y + barHeight / 2 - 5 * scale);
      ctx.lineTo(x + scaledWidth - 50 * scale, y + barHeight / 2);
      ctx.lineTo(x + scaledWidth - 45 * scale, y + barHeight / 2 + 5 * scale);
      ctx.stroke();
      // Forward arrow
      ctx.beginPath();
      ctx.moveTo(x + scaledWidth - 30 * scale, y + barHeight / 2 - 5 * scale);
      ctx.lineTo(x + scaledWidth - 25 * scale, y + barHeight / 2);
      ctx.lineTo(x + scaledWidth - 30 * scale, y + barHeight / 2 + 5 * scale);
      ctx.stroke();

      ctx.restore();
    }

    // Draw home indicator
    if (config.showHomeIndicator && (device.category === "iphone" && !device.hasHomeButton)) {
      ctx.save();
      ctx.fillStyle = config.frameColor;
      ctx.globalAlpha = 0.3;
      const indicatorWidth = 120 * scale;
      const indicatorHeight = 4 * scale;
      const indicatorX = x + (scaledWidth - indicatorWidth) / 2;
      const indicatorY = y + scaledHeight - 15 * scale;
      ctx.beginPath();
      ctx.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, indicatorHeight / 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw home button for older devices
    if (device.hasHomeButton && config.showDeviceFrame) {
      ctx.save();
      ctx.strokeStyle = config.frameColor;
      ctx.lineWidth = 2 * scale;
      const buttonSize = 40 * scale;
      const buttonX = x + scaledWidth / 2;
      const buttonY = y + scaledHeight + frameThickness + buttonSize / 2 + 5 * scale;
      ctx.beginPath();
      ctx.arc(buttonX, buttonY, buttonSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      // Inner square
      ctx.beginPath();
      ctx.roundRect(buttonX - 8 * scale, buttonY - 8 * scale, 16 * scale, 16 * scale, 3 * scale);
      ctx.stroke();
      ctx.restore();
    }

    return { width: scaledWidth, height: scaledHeight };
  };

  // Draw arrow between devices
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    scale: number
  ) => {
    ctx.save();
    ctx.strokeStyle = config.frameColor;
    ctx.fillStyle = config.frameColor;
    ctx.lineWidth = 1.5 * scale;
    ctx.globalAlpha = 0.4;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX - 10 * scale, toY);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 10 * scale, toY - 5 * scale);
    ctx.lineTo(toX - 10 * scale, toY + 5 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Generate wireframe preview
  const generateWireframe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paperDim = getPaperDimensions();
    canvas.width = paperDim.width;
    canvas.height = paperDim.height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate margins
    const margin = mmToPx(config.margin);
    const usableWidth = canvas.width - margin * 2;
    const usableHeight = canvas.height - margin * 2;

    // Title area
    let titleHeight = 0;
    if (config.template.showTitle || config.pageTitle) {
      titleHeight = 40;
      ctx.fillStyle = config.frameColor;
      ctx.font = "14px sans-serif";
      ctx.textAlign = "left";
      ctx.globalAlpha = 0.4;
      ctx.fillText(
        config.pageTitle || config.template.name,
        margin,
        margin + 20
      );
      ctx.globalAlpha = 1;
    }

    // Calculate device layout
    const { device, template } = config;
    const deviceCount = template.deviceCount;
    const isExtended = template.extended;
    const deviceAspect = device.screenWidth / (isExtended ? device.screenHeight * 2 : device.screenHeight);

    // Calculate available space for devices
    const contentY = margin + titleHeight;
    const contentHeight = usableHeight - titleHeight;

    // Calculate optimal scale for devices
    let scale: number = 1;
    let positions: { x: number; y: number }[] = [];
    const gap = 20;
    const frameExtra = config.showDeviceFrame ? 10 : 0;

    if (template.arrangement === "horizontal") {
      // Horizontal layout
      const totalWidthNeeded = deviceCount * device.screenWidth + (deviceCount - 1) * gap + frameExtra * 2 * deviceCount;
      const totalHeightNeeded = (isExtended ? device.screenHeight * 2 : device.screenHeight) + frameExtra * 2;

      const scaleX = usableWidth / totalWidthNeeded;
      const scaleY = contentHeight / totalHeightNeeded;
      scale = Math.min(scaleX, scaleY, 1);

      const scaledDeviceWidth = device.screenWidth * scale + frameExtra * 2 * scale;
      const totalWidth = deviceCount * scaledDeviceWidth + (deviceCount - 1) * gap * scale;
      const startX = margin + (usableWidth - totalWidth) / 2;
      const scaledDeviceHeight = (isExtended ? device.screenHeight * 2 : device.screenHeight) * scale + frameExtra * 2 * scale;
      const startY = contentY + (contentHeight - scaledDeviceHeight) / 2;

      for (let i = 0; i < deviceCount; i++) {
        positions.push({
          x: startX + i * (scaledDeviceWidth + gap * scale) + frameExtra * scale,
          y: startY + frameExtra * scale,
        });
      }
    } else if (template.arrangement === "vertical") {
      // Vertical layout
      const totalHeightNeeded = deviceCount * (isExtended ? device.screenHeight * 2 : device.screenHeight) + (deviceCount - 1) * gap + frameExtra * 2 * deviceCount;
      const totalWidthNeeded = device.screenWidth + frameExtra * 2;

      const scaleX = usableWidth / totalWidthNeeded;
      const scaleY = contentHeight / totalHeightNeeded;
      scale = Math.min(scaleX, scaleY, 1);

      const scaledDeviceHeight = (isExtended ? device.screenHeight * 2 : device.screenHeight) * scale + frameExtra * 2 * scale;
      const totalHeight = deviceCount * scaledDeviceHeight + (deviceCount - 1) * gap * scale;
      const startY = contentY + (contentHeight - totalHeight) / 2;
      const scaledDeviceWidth = device.screenWidth * scale + frameExtra * 2 * scale;
      const startX = margin + (usableWidth - scaledDeviceWidth) / 2;

      for (let i = 0; i < deviceCount; i++) {
        positions.push({
          x: startX + frameExtra * scale,
          y: startY + i * (scaledDeviceHeight + gap * scale) + frameExtra * scale,
        });
      }
    } else if (template.arrangement === "grid") {
      // Grid layout
      const cols = deviceCount <= 2 ? 2 : deviceCount <= 4 ? 2 : 3;
      const rows = Math.ceil(deviceCount / cols);

      const totalWidthNeeded = cols * device.screenWidth + (cols - 1) * gap + frameExtra * 2 * cols;
      const totalHeightNeeded = rows * device.screenHeight + (rows - 1) * gap + frameExtra * 2 * rows;

      const scaleX = usableWidth / totalWidthNeeded;
      const scaleY = contentHeight / totalHeightNeeded;
      scale = Math.min(scaleX, scaleY, 1);

      const scaledDeviceWidth = device.screenWidth * scale + frameExtra * 2 * scale;
      const scaledDeviceHeight = device.screenHeight * scale + frameExtra * 2 * scale;
      const totalWidth = cols * scaledDeviceWidth + (cols - 1) * gap * scale;
      const totalHeight = rows * scaledDeviceHeight + (rows - 1) * gap * scale;
      const startX = margin + (usableWidth - totalWidth) / 2;
      const startY = contentY + (contentHeight - totalHeight) / 2;

      for (let i = 0; i < deviceCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.push({
          x: startX + col * (scaledDeviceWidth + gap * scale) + frameExtra * scale,
          y: startY + row * (scaledDeviceHeight + gap * scale) + frameExtra * scale,
        });
      }
    }

    // Draw devices
    positions.forEach((pos, index) => {
      const result = drawDeviceFrame(ctx, device, pos.x, pos.y, scale, isExtended);

      // Draw device number label
      if (deviceCount > 1) {
        ctx.save();
        ctx.fillStyle = config.frameColor;
        ctx.globalAlpha = 0.3;
        ctx.font = `${12 * scale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${index + 1}`, pos.x + result.width / 2, pos.y - 15 * scale);
        ctx.restore();
      }
    });

    // Draw arrows for flow templates
    if (template.id.startsWith("flow-") && template.arrangement === "horizontal") {
      for (let i = 0; i < positions.length - 1; i++) {
        const fromPos = positions[i];
        const toPos = positions[i + 1];
        const deviceWidth = device.screenWidth * scale;
        const deviceHeight = (isExtended ? device.screenHeight * 2 : device.screenHeight) * scale;

        drawArrow(
          ctx,
          fromPos.x + deviceWidth + 5 * scale,
          fromPos.y + deviceHeight / 2,
          toPos.x - 5 * scale,
          toPos.y + deviceHeight / 2,
          scale
        );
      }
    }

    // Draw page number if enabled
    if (config.includePageNumbers) {
      ctx.save();
      ctx.fillStyle = config.frameColor;
      ctx.globalAlpha = 0.3;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("1", canvas.width / 2, canvas.height - margin / 2);
      ctx.restore();
    }

    // Draw light border around page
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  }, [config]);

  // Update preview when config changes
  useEffect(() => {
    generateWireframe();
  }, [generateWireframe]);

  // Download PDF
  const downloadPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamic import for jsPDF
    const { jsPDF } = await import("jspdf");

    const paperDim = getPaperDimensions();
    const { paper, orientation } = config;

    const pdf = new jsPDF({
      orientation: orientation === "portrait" ? "portrait" : "landscape",
      unit: "mm",
      format: [paper.width, paper.height],
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const imgWidth = orientation === "portrait" ? paper.width : paper.height;
    const imgHeight = orientation === "portrait" ? paper.height : paper.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`wireframe-${config.device.id}-${config.template.id}.pdf`);
  };

  // Download PNG
  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `wireframe-${config.device.id}-${config.template.id}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  // Print wireframe
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const imgData = canvas.toDataURL("image/png", 1.0);
    const { paper, orientation } = config;
    const width = orientation === "portrait" ? paper.width : paper.height;
    const height = orientation === "portrait" ? paper.height : paper.width;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wireframe - ${config.device.name}</title>
          <style>
            @page {
              size: ${width}mm ${height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              width: ${width}mm;
              height: ${height}mm;
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
        <h1 className="text-sm font-semibold">Wireframe Paper Generator</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Réinitialiser zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview area */}
        <div
          ref={previewContainerRef}
          className="flex flex-1 items-center justify-center overflow-auto bg-zinc-100 p-8"
        >
          <div
            className="shadow-lg"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
            }}
          >
            <canvas ref={canvasRef} className="bg-white" />
          </div>
        </div>

        {/* Configuration panel */}
        <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "device" as TabType, label: "Appareil", icon: <Smartphone className="h-3.5 w-3.5" /> },
              { id: "template" as TabType, label: "Modèle", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
              { id: "paper" as TabType, label: "Papier", icon: <FileText className="h-3.5 w-3.5" /> },
              { id: "options" as TabType, label: "Options", icon: <Grid3X3 className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "device" && (
              <div className="space-y-4">
                {/* Device category tabs */}
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(devicesByCategory) as DeviceCategory[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveDeviceCategory(category)}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                        activeDeviceCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {getCategoryIcon(category)}
                      {deviceCategoryLabels[category]}
                    </button>
                  ))}
                </div>

                {/* Devices list */}
                <div className="space-y-1.5">
                  {devicesByCategory[activeDeviceCategory].map((device) => (
                    <label
                      key={device.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors ${
                        config.device.id === device.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="device"
                        checked={config.device.id === device.id}
                        onChange={() => setConfig((prev) => ({ ...prev, device }))}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.screenWidth} × {device.screenHeight}
                        </p>
                      </div>
                      {config.device.id === device.id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "template" && (
              <div className="space-y-1.5">
                {templateLayouts.map((template) => (
                  <label
                    key={template.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${
                      config.template.id === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      checked={config.template.id === template.id}
                      onChange={() => setConfig((prev) => ({ ...prev, template }))}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.deviceCount} écran{template.deviceCount > 1 ? "s" : ""}
                        {template.extended && " • Étendu"}
                      </p>
                    </div>
                    {config.template.id === template.id && (
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </label>
                ))}
              </div>
            )}

            {activeTab === "paper" && (
              <div className="space-y-4">
                {/* Paper size */}
                <div>
                  <p className="mb-2 text-xs font-medium">Format de papier</p>
                  <div className="space-y-1.5">
                    {paperSizes.map((paper) => (
                      <label
                        key={paper.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors ${
                          config.paper.id === paper.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paper"
                          checked={config.paper.id === paper.id}
                          onChange={() => setConfig((prev) => ({ ...prev, paper }))}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium">{paper.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {paper.width} × {paper.height} mm
                          </p>
                        </div>
                        {config.paper.id === paper.id && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Orientation */}
                <div>
                  <p className="mb-2 text-xs font-medium">Orientation</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfig((prev) => ({ ...prev, orientation: "portrait" }))}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs transition-colors ${
                        config.orientation === "portrait"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="h-5 w-4 rounded border border-current" />
                      Portrait
                    </button>
                    <button
                      onClick={() => setConfig((prev) => ({ ...prev, orientation: "landscape" }))}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs transition-colors ${
                        config.orientation === "landscape"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="h-4 w-5 rounded border border-current" />
                      Paysage
                    </button>
                  </div>
                </div>

                {/* Margins */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Marges</p>
                    <span className="text-xs text-muted-foreground">{config.margin} mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    value={config.margin}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, margin: parseInt(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === "options" && (
              <div className="space-y-4">
                {/* Grid options */}
                <div>
                  <p className="mb-2 text-xs font-medium">Grille</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.grid.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            grid: { ...prev.grid, enabled: e.target.checked },
                          }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-xs">Afficher la grille</span>
                    </label>

                    {config.grid.enabled && (
                      <>
                        <div className="flex gap-1">
                          {(["dots", "lines", "squares"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  grid: { ...prev.grid, type },
                                }))
                              }
                              className={`flex-1 rounded-lg border py-1.5 text-xs capitalize transition-colors ${
                                config.grid.type === type
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              {type === "dots" ? "Points" : type === "lines" ? "Lignes" : "Carrés"}
                            </button>
                          ))}
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Espacement</span>
                            <span className="text-xs text-muted-foreground">{config.grid.spacing}px</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="20"
                            value={config.grid.spacing}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                grid: { ...prev.grid, spacing: parseInt(e.target.value) },
                              }))
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Opacité</span>
                            <span className="text-xs text-muted-foreground">{Math.round(config.grid.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={config.grid.opacity * 100}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                grid: { ...prev.grid, opacity: parseInt(e.target.value) / 100 },
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Frame options */}
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium">Options du cadre</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.showDeviceFrame}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, showDeviceFrame: e.target.checked }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-xs">Afficher le cadre de l&apos;appareil</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.showStatusBar}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, showStatusBar: e.target.checked }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-xs">Afficher la barre de statut</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.showHomeIndicator}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, showHomeIndicator: e.target.checked }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-xs">Afficher l&apos;indicateur home</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.showBrowserBar}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, showBrowserBar: e.target.checked }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-xs">Afficher la barre navigateur</span>
                    </label>
                  </div>
                </div>

                {/* Colors */}
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium">Couleurs</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.frameColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, frameColor: e.target.value }))
                        }
                        className="h-7 w-7 cursor-pointer rounded border border-border"
                      />
                      <span className="text-xs">Couleur du cadre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="h-7 w-7 cursor-pointer rounded border border-border"
                      />
                      <span className="text-xs">Couleur de fond</span>
                    </div>
                  </div>
                </div>

                {/* Page options */}
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium">Page</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Titre de la page (optionnel)"
                      value={config.pageTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, pageTitle: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.includePageNumbers}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includePageNumbers: e.target.checked }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-xs">Numéros de page</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="border-t border-border p-4">
            <div className="mb-3 text-center text-xs text-muted-foreground">
              {config.device.name} • {config.template.name} • {config.paper.name} {config.orientation === "landscape" ? "(Paysage)" : "(Portrait)"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium transition-colors hover:bg-accent"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button
                onClick={downloadPNG}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                PNG
              </button>
              <button
                onClick={downloadPDF}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
