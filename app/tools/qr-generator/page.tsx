"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Upload,
  X,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import qrcode from "qrcode-generator";
import {
  type QRConfig,
  type QRContentType,
  type QRDotStyle,
  type QRCornerSquareStyle,
  type QRCornerDotStyle,
  type QRErrorLevel,
  type VCardData,
  type WifiData,
  type EmailData,
  type SMSData,
  type QRExportFormat,
  contentTypeLabels,
  dotStyleLabels,
  cornerSquareStyleLabels,
  cornerDotStyleLabels,
  errorLevelLabels,
  defaultConfig,
} from "@/types/qr";
import {
  generateVCardString,
  generateWifiString,
  generateEmailString,
  generateSMSString,
  generatePhoneString,
  getContentPlaceholder,
} from "@/lib/qr-utils";

type TabType = "content" | "style" | "advanced";

export default function QRGeneratorPage() {
  const [config, setConfig] = useState<QRConfig>(defaultConfig);
  const [vcardData, setVcardData] = useState<VCardData>({
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  });
  const [wifiData, setWifiData] = useState<WifiData>({
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  });
  const [emailData, setEmailData] = useState<EmailData>({
    to: "",
    subject: "",
    body: "",
  });
  const [smsData, setSmsData] = useState<SMSData>({
    phone: "",
    message: "",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFinalContent = useCallback((): string => {
    switch (config.contentType) {
      case "vcard":
        return generateVCardString(vcardData);
      case "wifi":
        return generateWifiString(wifiData);
      case "email":
        return generateEmailString(emailData);
      case "sms":
        return generateSMSString(smsData);
      case "phone":
        return generatePhoneString(phoneNumber);
      default:
        return config.content;
    }
  }, [config.contentType, config.content, vcardData, wifiData, emailData, smsData, phoneNumber]);

  const isCornerSquare = (row: number, col: number, moduleCount: number): boolean => {
    return (
      (row < 7 && col < 7) ||
      (row < 7 && col >= moduleCount - 7) ||
      (row >= moduleCount - 7 && col < 7)
    );
  };

  const drawDot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    style: QRDotStyle
  ) => {
    switch (style) {
      case "dots":
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 - 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "rounded":
        drawRoundedRect(ctx, x, y, size, size, size * 0.4);
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size / 2);
        ctx.lineTo(x + size / 2, y + size);
        ctx.lineTo(x, y + size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case "star":
        drawStar(ctx, x + size / 2, y + size / 2, size / 2, size / 4, 4);
        break;
      default:
        ctx.fillRect(x, y, size, size);
    }
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    points: number
  ) => {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  const drawCornerSquare = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    style: QRCornerSquareStyle
  ) => {
    const outerSize = size * 7;

    ctx.save();

    switch (style) {
      case "rounded":
        drawRoundedRect(ctx, x, y, outerSize, outerSize, size * 2);
        ctx.globalCompositeOperation = "destination-out";
        drawRoundedRect(ctx, x + size, y + size, outerSize - size * 2, outerSize - size * 2, size * 1.5);
        ctx.globalCompositeOperation = "source-over";
        break;
      case "dots":
        ctx.beginPath();
        ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2 - size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        break;
      case "classy":
        ctx.fillRect(x, y, outerSize, outerSize);
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(x + size, y + size, outerSize - size * 2, outerSize - size * 2);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillRect(x, y, size * 2, size);
        ctx.fillRect(x, y, size, size * 2);
        break;
      case "classy-rounded":
        drawRoundedRect(ctx, x, y, outerSize, outerSize, size);
        ctx.globalCompositeOperation = "destination-out";
        drawRoundedRect(ctx, x + size, y + size, outerSize - size * 2, outerSize - size * 2, size * 0.5);
        ctx.globalCompositeOperation = "source-over";
        break;
      default:
        ctx.fillRect(x, y, outerSize, outerSize);
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(x + size, y + size, outerSize - size * 2, outerSize - size * 2);
        ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  };

  const drawCornerDot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    style: QRCornerDotStyle
  ) => {
    const dotSize = size * 3;

    switch (style) {
      case "rounded":
        ctx.beginPath();
        ctx.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "dots":
        ctx.beginPath();
        ctx.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.fillRect(x, y, dotSize, dotSize);
    }
  };

  const generateQR = useCallback(() => {
    const content = getFinalContent();
    if (!content) {
      setQrDataUrl("");
      return;
    }

    try {
      const qr = qrcode(0, config.errorLevel);
      qr.addData(content);
      qr.make();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const moduleCount = qr.getModuleCount();
      const cellSize = Math.floor((config.size - config.margin * 2) / moduleCount);
      const qrSize = cellSize * moduleCount;
      const frameHeight = config.showFrame ? 40 : 0;
      const actualWidth = qrSize + config.margin * 2;
      const actualHeight = qrSize + config.margin * 2 + frameHeight;

      canvas.width = actualWidth;
      canvas.height = actualHeight;

      if (config.transparentBackground) {
        ctx.clearRect(0, 0, actualWidth, actualHeight);
      } else {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, actualWidth, actualHeight);
      }

      if (config.showFrame) {
        ctx.fillStyle = config.frameColor;
        ctx.fillRect(0, actualHeight - frameHeight, actualWidth, frameHeight);
        ctx.fillStyle = config.frameTextColor;
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.frameText, actualWidth / 2, actualHeight - frameHeight / 2);
      }

      const offset = config.margin;

      let fillStyle: string | CanvasGradient = config.foregroundColor;
      if (config.useGradient) {
        if (config.gradientType === "linear") {
          const angle = (config.gradientRotation * Math.PI) / 180;
          const x1 = actualWidth / 2 - (Math.cos(angle) * actualWidth) / 2;
          const y1 = actualHeight / 2 - (Math.sin(angle) * actualHeight) / 2;
          const x2 = actualWidth / 2 + (Math.cos(angle) * actualWidth) / 2;
          const y2 = actualHeight / 2 + (Math.sin(angle) * actualHeight) / 2;
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, config.gradientColor1);
          gradient.addColorStop(1, config.gradientColor2);
          fillStyle = gradient;
        } else {
          const gradient = ctx.createRadialGradient(
            actualWidth / 2, actualHeight / 2, 0,
            actualWidth / 2, actualHeight / 2, actualWidth / 2
          );
          gradient.addColorStop(0, config.gradientColor1);
          gradient.addColorStop(1, config.gradientColor2);
          fillStyle = gradient;
        }
      }

      const cornerPositions = [
        { x: offset, y: offset },
        { x: offset + (moduleCount - 7) * cellSize, y: offset },
        { x: offset, y: offset + (moduleCount - 7) * cellSize },
      ];

      for (const pos of cornerPositions) {
        ctx.fillStyle = config.useCustomCornerSquareColor ? config.cornerSquareColor : fillStyle;
        drawCornerSquare(ctx, pos.x, pos.y, cellSize, config.cornerSquareStyle);

        ctx.fillStyle = config.useCustomCornerDotColor ? config.cornerDotColor : fillStyle;
        drawCornerDot(ctx, pos.x + cellSize * 2, pos.y + cellSize * 2, cellSize, config.cornerDotStyle);
      }

      ctx.fillStyle = fillStyle;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col) && !isCornerSquare(row, col, moduleCount)) {
            const x = offset + col * cellSize;
            const y = offset + row * cellSize;
            drawDot(ctx, x, y, cellSize, config.dotStyle);
          }
        }
      }

      if (config.logo) {
        const img = new Image();
        img.onload = () => {
          const logoSize = config.logoSize;
          const logoX = (actualWidth - logoSize) / 2;
          const logoY = (qrSize + config.margin * 2 - logoSize) / 2;

          if (!config.transparentBackground) {
            ctx.fillStyle = config.backgroundColor;
            const bgPadding = config.logoMargin;
            if (config.logoBorderRadius > 0) {
              drawRoundedRect(
                ctx,
                logoX - bgPadding,
                logoY - bgPadding,
                logoSize + bgPadding * 2,
                logoSize + bgPadding * 2,
                config.logoBorderRadius
              );
            } else {
              ctx.fillRect(
                logoX - bgPadding,
                logoY - bgPadding,
                logoSize + bgPadding * 2,
                logoSize + bgPadding * 2
              );
            }
          }

          if (config.logoBorderRadius > 0) {
            ctx.save();
            ctx.beginPath();
            const r = config.logoBorderRadius;
            ctx.moveTo(logoX + r, logoY);
            ctx.lineTo(logoX + logoSize - r, logoY);
            ctx.quadraticCurveTo(logoX + logoSize, logoY, logoX + logoSize, logoY + r);
            ctx.lineTo(logoX + logoSize, logoY + logoSize - r);
            ctx.quadraticCurveTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - r, logoY + logoSize);
            ctx.lineTo(logoX + r, logoY + logoSize);
            ctx.quadraticCurveTo(logoX, logoY + logoSize, logoX, logoY + logoSize - r);
            ctx.lineTo(logoX, logoY + r);
            ctx.quadraticCurveTo(logoX, logoY, logoX + r, logoY);
            ctx.closePath();
            ctx.clip();
          }

          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

          if (config.logoBorderRadius > 0) {
            ctx.restore();
          }

          setQrDataUrl(canvas.toDataURL("image/png"));
        };
        img.src = config.logo;
      } else {
        setQrDataUrl(canvas.toDataURL("image/png"));
      }
    } catch (error) {
      console.error("QR generation error:", error);
      setQrDataUrl("");
    }
  }, [config, getFinalContent]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig((prev) => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setConfig((prev) => ({ ...prev, logo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateSvgCornerSquare = (
    x: number,
    y: number,
    cellSize: number,
    style: QRCornerSquareStyle,
    color: string
  ): string => {
    const outerSize = cellSize * 7;
    const innerSize = cellSize * 5;
    const r = cellSize * 2;

    switch (style) {
      case "rounded":
        return `
          <rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" rx="${r}" fill="${color}"/>
          <rect x="${x + cellSize}" y="${y + cellSize}" width="${innerSize}" height="${innerSize}" rx="${cellSize * 1.5}" fill="${config.transparentBackground ? 'transparent' : config.backgroundColor}"/>
        `;
      case "dots":
        return `
          <circle cx="${x + outerSize / 2}" cy="${y + outerSize / 2}" r="${outerSize / 2}" fill="${color}"/>
          <circle cx="${x + outerSize / 2}" cy="${y + outerSize / 2}" r="${outerSize / 2 - cellSize}" fill="${config.transparentBackground ? 'transparent' : config.backgroundColor}"/>
        `;
      case "classy":
        return `
          <rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" fill="${color}"/>
          <rect x="${x + cellSize}" y="${y + cellSize}" width="${innerSize}" height="${innerSize}" fill="${config.transparentBackground ? 'transparent' : config.backgroundColor}"/>
        `;
      case "classy-rounded":
        return `
          <rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" rx="${cellSize}" fill="${color}"/>
          <rect x="${x + cellSize}" y="${y + cellSize}" width="${innerSize}" height="${innerSize}" rx="${cellSize * 0.5}" fill="${config.transparentBackground ? 'transparent' : config.backgroundColor}"/>
        `;
      default:
        return `
          <rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" fill="${color}"/>
          <rect x="${x + cellSize}" y="${y + cellSize}" width="${innerSize}" height="${innerSize}" fill="${config.transparentBackground ? 'transparent' : config.backgroundColor}"/>
        `;
    }
  };

  const generateSvgCornerDot = (
    x: number,
    y: number,
    cellSize: number,
    style: QRCornerDotStyle,
    color: string
  ): string => {
    const dotSize = cellSize * 3;

    switch (style) {
      case "rounded":
      case "dots":
        return `<circle cx="${x + dotSize / 2}" cy="${y + dotSize / 2}" r="${dotSize / 2}" fill="${color}"/>`;
      default:
        return `<rect x="${x}" y="${y}" width="${dotSize}" height="${dotSize}" fill="${color}"/>`;
    }
  };

  const generateSvgDot = (
    x: number,
    y: number,
    cellSize: number,
    style: QRDotStyle,
    color: string
  ): string => {
    switch (style) {
      case "dots":
        return `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${cellSize / 2 - 0.5}" fill="${color}"/>`;
      case "rounded":
        return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.4}" fill="${color}"/>`;
      case "diamond":
        return `<polygon points="${x + cellSize / 2},${y} ${x + cellSize},${y + cellSize / 2} ${x + cellSize / 2},${y + cellSize} ${x},${y + cellSize / 2}" fill="${color}"/>`;
      case "star":
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        const outer = cellSize / 2;
        const inner = cellSize / 4;
        let points = "";
        for (let i = 0; i < 8; i++) {
          const radius = i % 2 === 0 ? outer : inner;
          const angle = (i * Math.PI) / 4 - Math.PI / 2;
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);
          points += `${px},${py} `;
        }
        return `<polygon points="${points.trim()}" fill="${color}"/>`;
      default:
        return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
    }
  };

  const handleDownload = (format: QRExportFormat) => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");

    if (format === "svg") {
      const content = getFinalContent();
      const qr = qrcode(0, config.errorLevel);
      qr.addData(content);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const cellSize = 10;
      const frameHeight = config.showFrame ? 40 : 0;
      const width = moduleCount * cellSize + config.margin * 2;
      const height = width + frameHeight;

      const fgColor = config.useGradient ? config.gradientColor1 : config.foregroundColor;
      const cornerSquareColor = config.useCustomCornerSquareColor ? config.cornerSquareColor : fgColor;
      const cornerDotColor = config.useCustomCornerDotColor ? config.cornerDotColor : fgColor;

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

      if (config.useGradient) {
        if (config.gradientType === "linear") {
          const angle = config.gradientRotation;
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 - 50 * Math.cos(rad);
          const y1 = 50 - 50 * Math.sin(rad);
          const x2 = 50 + 50 * Math.cos(rad);
          const y2 = 50 + 50 * Math.sin(rad);
          svgContent += `<defs><linearGradient id="qrGradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
            <stop offset="0%" stop-color="${config.gradientColor1}"/>
            <stop offset="100%" stop-color="${config.gradientColor2}"/>
          </linearGradient></defs>`;
        } else {
          svgContent += `<defs><radialGradient id="qrGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${config.gradientColor1}"/>
            <stop offset="100%" stop-color="${config.gradientColor2}"/>
          </radialGradient></defs>`;
        }
      }

      if (!config.transparentBackground) {
        svgContent += `<rect width="100%" height="${width}" fill="${config.backgroundColor}"/>`;
      }

      if (config.showFrame) {
        svgContent += `<rect x="0" y="${width}" width="${width}" height="${frameHeight}" fill="${config.frameColor}"/>`;
        svgContent += `<text x="${width / 2}" y="${width + frameHeight / 2 + 5}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="bold" font-size="14" fill="${config.frameTextColor}">${config.frameText}</text>`;
      }

      const offset = config.margin;
      const gradientFill = config.useGradient ? "url(#qrGradient)" : fgColor;

      const cornerPositions = [
        { x: offset, y: offset },
        { x: offset + (moduleCount - 7) * cellSize, y: offset },
        { x: offset, y: offset + (moduleCount - 7) * cellSize },
      ];

      for (const pos of cornerPositions) {
        svgContent += generateSvgCornerSquare(
          pos.x,
          pos.y,
          cellSize,
          config.cornerSquareStyle,
          config.useCustomCornerSquareColor ? cornerSquareColor : gradientFill
        );
        svgContent += generateSvgCornerDot(
          pos.x + cellSize * 2,
          pos.y + cellSize * 2,
          cellSize,
          config.cornerDotStyle,
          config.useCustomCornerDotColor ? cornerDotColor : gradientFill
        );
      }

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col) && !isCornerSquare(row, col, moduleCount)) {
            const x = offset + col * cellSize;
            const y = offset + row * cellSize;
            svgContent += generateSvgDot(x, y, cellSize, config.dotStyle, gradientFill);
          }
        }
      }

      if (config.logo) {
        const qrContentHeight = moduleCount * cellSize + config.margin * 2;
        const logoSize = config.logoSize * (cellSize / 10);
        const logoX = (width - logoSize) / 2;
        const logoY = (qrContentHeight - logoSize) / 2;
        const bgPadding = config.logoMargin * (cellSize / 10);

        if (!config.transparentBackground) {
          if (config.logoBorderRadius > 0) {
            const scaledRadius = config.logoBorderRadius * (cellSize / 10);
            svgContent += `<rect x="${logoX - bgPadding}" y="${logoY - bgPadding}" width="${logoSize + bgPadding * 2}" height="${logoSize + bgPadding * 2}" rx="${scaledRadius}" fill="${config.backgroundColor}"/>`;
          } else {
            svgContent += `<rect x="${logoX - bgPadding}" y="${logoY - bgPadding}" width="${logoSize + bgPadding * 2}" height="${logoSize + bgPadding * 2}" fill="${config.backgroundColor}"/>`;
          }
        }

        if (config.logoBorderRadius > 0) {
          const clipId = "logoClip";
          const scaledRadius = config.logoBorderRadius * (cellSize / 10);
          svgContent += `<defs><clipPath id="${clipId}"><rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${scaledRadius}"/></clipPath></defs>`;
          svgContent += `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${config.logo}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`;
        } else {
          svgContent += `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${config.logo}" preserveAspectRatio="xMidYMid slice"/>`;
        }
      }

      svgContent += "</svg>";

      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      link.href = URL.createObjectURL(blob);
      link.download = "qrcode.svg";
    } else if (format === "webp") {
      const canvas = canvasRef.current;
      if (canvas) {
        link.href = canvas.toDataURL("image/webp", 0.9);
        link.download = "qrcode.webp";
      }
    } else {
      link.href = qrDataUrl;
      link.download = `qrcode.${format}`;
    }

    link.click();
  };

  const copyToClipboard = async () => {
    if (!qrDataUrl) return;

    try {
      const canvas = canvasRef.current;
      if (canvas) {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), "image/png");
        });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setVcardData({
      firstName: "",
      lastName: "",
      organization: "",
      title: "",
      email: "",
      phone: "",
      website: "",
      address: "",
    });
    setWifiData({
      ssid: "",
      password: "",
      encryption: "WPA",
      hidden: false,
    });
    setEmailData({ to: "", subject: "", body: "" });
    setSmsData({ phone: "", message: "" });
    setPhoneNumber("");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header compact */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
        <h1 className="text-sm font-semibold">Générateur de QR Code</h1>
        <button
          onClick={resetConfig}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone principale - Preview */}
        <div className="flex flex-1 flex-col">
          {/* Zone de preview */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-6">
            <div
              className="flex items-center justify-center rounded-lg p-8"
              style={{
                backgroundColor: config.transparentBackground ? undefined : "#f1f5f9",
                backgroundImage: config.transparentBackground
                  ? "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)"
                  : undefined,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
            >
              <canvas ref={canvasRef} className="hidden" />
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Preview"
                  className="max-w-full"
                  style={{ maxHeight: "300px" }}
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center text-center text-sm text-muted-foreground">
                  Entrez du contenu pour générer votre QR code
                </div>
              )}
            </div>
          </div>

          {/* Barre d'actions en bas */}
          <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              {(["png", "svg", "jpg", "webp"] as QRExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => handleDownload(format)}
                  disabled={!qrDataUrl}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium uppercase transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3 w-3" />
                  {format}
                </button>
              ))}
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!qrDataUrl}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panneau de configuration */}
        <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "content" as TabType, label: "Contenu" },
              { id: "style" as TabType, label: "Style" },
              { id: "advanced" as TabType, label: "Avancé" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "content" && (
              <div className="space-y-4">
                {/* Type de contenu */}
                <div>
                  <p className="mb-2 text-xs font-medium">Type</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(contentTypeLabels) as QRContentType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setConfig((prev) => ({ ...prev, contentType: type }))}
                        className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                          config.contentType === type
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {contentTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Champs de contenu */}
                <div>
                  <p className="mb-2 text-xs font-medium">Contenu</p>
                  {config.contentType === "url" || config.contentType === "text" ? (
                    <textarea
                      value={config.content}
                      onChange={(e) => setConfig((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder={getContentPlaceholder(config.contentType)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      rows={3}
                    />
                  ) : config.contentType === "phone" ? (
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+33612345678"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  ) : config.contentType === "email" ? (
                    <div className="space-y-1.5">
                      <input
                        type="email"
                        value={emailData.to}
                        onChange={(e) => setEmailData((prev) => ({ ...prev, to: e.target.value }))}
                        placeholder="Destinataire"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        value={emailData.subject}
                        onChange={(e) => setEmailData((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Sujet"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                      <textarea
                        value={emailData.body}
                        onChange={(e) => setEmailData((prev) => ({ ...prev, body: e.target.value }))}
                        placeholder="Corps"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                        rows={2}
                      />
                    </div>
                  ) : config.contentType === "sms" ? (
                    <div className="space-y-1.5">
                      <input
                        type="tel"
                        value={smsData.phone}
                        onChange={(e) => setSmsData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Numéro"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                      <textarea
                        value={smsData.message}
                        onChange={(e) => setSmsData((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Message"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                        rows={2}
                      />
                    </div>
                  ) : config.contentType === "wifi" ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={wifiData.ssid}
                        onChange={(e) => setWifiData((prev) => ({ ...prev, ssid: e.target.value }))}
                        placeholder="Nom du réseau"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                      <input
                        type="password"
                        value={wifiData.password}
                        onChange={(e) => setWifiData((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Mot de passe"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <select
                          value={wifiData.encryption}
                          onChange={(e) => setWifiData((prev) => ({ ...prev, encryption: e.target.value as "WPA" | "WEP" | "nopass" }))}
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Aucun</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={wifiData.hidden}
                            onChange={(e) => setWifiData((prev) => ({ ...prev, hidden: e.target.checked }))}
                            className="rounded border-border"
                          />
                          Caché
                        </label>
                      </div>
                    </div>
                  ) : config.contentType === "vcard" ? (
                    <div className="grid gap-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={vcardData.firstName}
                          onChange={(e) => setVcardData((prev) => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Prénom"
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={vcardData.lastName}
                          onChange={(e) => setVcardData((prev) => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Nom"
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={vcardData.organization}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, organization: e.target.value }))}
                        placeholder="Entreprise"
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      />
                      <input
                        type="email"
                        value={vcardData.email}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Email"
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      />
                      <input
                        type="tel"
                        value={vcardData.phone}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Téléphone"
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      />
                      <input
                        type="url"
                        value={vcardData.website}
                        onChange={(e) => setVcardData((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="Site web"
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-4">
                {/* Couleurs */}
                <div>
                  <p className="mb-2 text-xs font-medium">Couleur QR</p>
                  <label className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.useGradient}
                      onChange={(e) => setConfig((prev) => ({ ...prev, useGradient: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Dégradé</span>
                  </label>
                  {config.useGradient ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfig((prev) => ({ ...prev, gradientType: "linear" }))}
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${config.gradientType === "linear" ? "border-primary bg-primary/10" : "border-border"}`}
                        >
                          Linéaire
                        </button>
                        <button
                          onClick={() => setConfig((prev) => ({ ...prev, gradientType: "radial" }))}
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${config.gradientType === "radial" ? "border-primary bg-primary/10" : "border-border"}`}
                        >
                          Radial
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.gradientColor1}
                          onChange={(e) => setConfig((prev) => ({ ...prev, gradientColor1: e.target.value }))}
                          className="h-7 w-7 cursor-pointer rounded border border-border"
                        />
                        <input
                          type="color"
                          value={config.gradientColor2}
                          onChange={(e) => setConfig((prev) => ({ ...prev, gradientColor2: e.target.value }))}
                          className="h-7 w-7 cursor-pointer rounded border border-border"
                        />
                        {config.gradientType === "linear" && (
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={config.gradientRotation}
                            onChange={(e) => setConfig((prev) => ({ ...prev, gradientRotation: parseInt(e.target.value) }))}
                            className="flex-1"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.foregroundColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                        className="h-7 w-7 cursor-pointer rounded border border-border"
                      />
                      <input
                        type="text"
                        value={config.foregroundColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Fond */}
                <div>
                  <p className="mb-2 text-xs font-medium">Fond</p>
                  <label className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.transparentBackground}
                      onChange={(e) => setConfig((prev) => ({ ...prev, transparentBackground: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Transparent</span>
                  </label>
                  {!config.transparentBackground && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="h-7 w-7 cursor-pointer rounded border border-border"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Style pixels */}
                <div>
                  <p className="mb-2 text-xs font-medium">Style des pixels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(dotStyleLabels) as QRDotStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setConfig((prev) => ({ ...prev, dotStyle: style }))}
                        className={`rounded-lg border px-2 py-1 text-xs ${
                          config.dotStyle === style
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {dotStyleLabels[style]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style coins */}
                <div>
                  <p className="mb-2 text-xs font-medium">Style des coins</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(cornerSquareStyleLabels) as QRCornerSquareStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setConfig((prev) => ({ ...prev, cornerSquareStyle: style }))}
                        className={`rounded-lg border px-2 py-1 text-xs ${
                          config.cornerSquareStyle === style
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {cornerSquareStyleLabels[style]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <p className="mb-2 text-xs font-medium">Logo</p>
                  {config.logo ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={config.logo}
                        alt="Logo"
                        className="h-12 w-12 rounded border border-border object-contain"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span>Taille</span>
                          <span className="text-muted-foreground">{config.logoSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="120"
                          value={config.logoSize}
                          onChange={(e) => setConfig((prev) => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <button
                        onClick={removeLogo}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      Ajouter un logo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-4">
                {/* Taille */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Taille</p>
                    <span className="text-xs text-muted-foreground">{config.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    step="10"
                    value={config.size}
                    onChange={(e) => setConfig((prev) => ({ ...prev, size: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Marge */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Marge</p>
                    <span className="text-xs text-muted-foreground">{config.margin}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={config.margin}
                    onChange={(e) => setConfig((prev) => ({ ...prev, margin: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Correction d'erreur */}
                <div>
                  <p className="mb-2 text-xs font-medium">Correction d&apos;erreur</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(errorLevelLabels) as QRErrorLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfig((prev) => ({ ...prev, errorLevel: level }))}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                          config.errorLevel === level
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {errorLevelLabels[level]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cadre */}
                <div className="border-t border-border pt-4">
                  <label className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.showFrame}
                      onChange={(e) => setConfig((prev) => ({ ...prev, showFrame: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-xs font-medium">Cadre avec texte</span>
                  </label>
                  {config.showFrame && (
                    <div className="space-y-2 pl-5">
                      <input
                        type="text"
                        value={config.frameText}
                        onChange={(e) => setConfig((prev) => ({ ...prev, frameText: e.target.value }))}
                        placeholder="SCAN ME"
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.frameColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, frameColor: e.target.value }))}
                          className="h-6 w-6 cursor-pointer rounded border border-border"
                          title="Couleur du cadre"
                        />
                        <input
                          type="color"
                          value={config.frameTextColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, frameTextColor: e.target.value }))}
                          className="h-6 w-6 cursor-pointer rounded border border-border"
                          title="Couleur du texte"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Couleurs coins personnalisées */}
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-medium">Couleurs des coins</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.useCustomCornerSquareColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, useCustomCornerSquareColor: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <span className="text-xs">Carré extérieur</span>
                      {config.useCustomCornerSquareColor && (
                        <input
                          type="color"
                          value={config.cornerSquareColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, cornerSquareColor: e.target.value }))}
                          className="ml-auto h-5 w-5 cursor-pointer rounded border border-border"
                        />
                      )}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.useCustomCornerDotColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, useCustomCornerDotColor: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <span className="text-xs">Point central</span>
                      {config.useCustomCornerDotColor && (
                        <input
                          type="color"
                          value={config.cornerDotColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, cornerDotColor: e.target.value }))}
                          className="ml-auto h-5 w-5 cursor-pointer rounded border border-border"
                        />
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
