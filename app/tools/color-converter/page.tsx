"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Pipette,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import type { RGB, HSL, HarmonyType, ColorFormat } from "@/types/color";
import {
  parseHex,
  parseRgb,
  parseHsl,
  convertColor,
  hslToRgb,
  rgbToHsl,
  getHarmonyColors,
  generatePalette,
  getContrastRatio,
  getWCAGLevel,
  getTextColor,
  formatRgbString,
  formatHslString,
  formatHsvString,
  formatCmykString,
  formatHwbString,
  formatLabString,
  formatLchString,
  randomColor,
  namedColors,
  rgbToHex,
} from "@/lib/color-utils";
import { harmonyLabels, formatLabels } from "@/types/color";

export default function ColorConverterPage() {
  const [currentRgb, setCurrentRgb] = useState<RGB>({ r: 59, g: 130, b: 246 });
  const [inputValue, setInputValue] = useState("#3B82F6");
  const [inputFormat, setInputFormat] = useState<"auto" | ColorFormat>("auto");
  const [copied, setCopied] = useState<string | null>(null);
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const [contrastColor, setContrastColor] = useState<RGB>({ r: 255, g: 255, b: 255 });

  const [expandedSections, setExpandedSections] = useState({
    input: true,
    conversions: true,
    harmony: true,
    palette: true,
    contrast: true,
    picker: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const colorValues = convertColor(currentRgb);
  const hsl = rgbToHsl(currentRgb);
  const harmonyColors = getHarmonyColors(hsl, harmonyType);
  const palette = generatePalette(hsl, 9);
  const textColor = getTextColor(currentRgb);
  const contrastRatio = getContrastRatio(currentRgb, contrastColor);
  const wcagLevel = getWCAGLevel(contrastRatio);

  const parseInput = useCallback((value: string) => {
    const trimmed = value.trim();

    // Try HEX
    if (trimmed.startsWith("#") || /^[0-9A-Fa-f]{3,8}$/.test(trimmed)) {
      const rgb = parseHex(trimmed);
      if (rgb) return rgb;
    }

    // Try RGB
    if (trimmed.toLowerCase().startsWith("rgb")) {
      const rgb = parseRgb(trimmed);
      if (rgb) return rgb;
    }

    // Try HSL
    if (trimmed.toLowerCase().startsWith("hsl")) {
      const hsl = parseHsl(trimmed);
      if (hsl) return hslToRgb(hsl);
    }

    // Try named color
    const namedHex = Object.entries(namedColors).find(
      ([name]) => name.toLowerCase() === trimmed.toLowerCase()
    )?.[1];
    if (namedHex) {
      const rgb = parseHex(namedHex);
      if (rgb) return rgb;
    }

    return null;
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const rgb = parseInput(value);
    if (rgb) {
      setCurrentRgb(rgb);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = parseHex(e.target.value);
    if (rgb) {
      setCurrentRgb(rgb);
      setInputValue(e.target.value.toUpperCase());
    }
  };

  const handleRandomColor = () => {
    const rgb = randomColor();
    setCurrentRgb(rgb);
    setInputValue(rgbToHex(rgb));
  };

  const handleEyeDropper = async () => {
    if ("EyeDropper" in window) {
      try {
        // @ts-expect-error EyeDropper API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const rgb = parseHex(result.sRGBHex);
        if (rgb) {
          setCurrentRgb(rgb);
          setInputValue(result.sRGBHex.toUpperCase());
        }
      } catch {
        // User cancelled
      }
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSliderChange = (channel: "h" | "s" | "l", value: number) => {
    const newHsl: HSL = {
      h: channel === "h" ? value : hsl.h,
      s: channel === "s" ? value : hsl.s,
      l: channel === "l" ? value : hsl.l,
    };
    const newRgb = hslToRgb(newHsl);
    setCurrentRgb(newRgb);
    setInputValue(rgbToHex(newRgb));
  };

  const handleRgbSliderChange = (channel: "r" | "g" | "b", value: number) => {
    const newRgb: RGB = {
      r: channel === "r" ? value : currentRgb.r,
      g: channel === "g" ? value : currentRgb.g,
      b: channel === "b" ? value : currentRgb.b,
    };
    setCurrentRgb(newRgb);
    setInputValue(rgbToHex(newRgb));
  };

  const exportPalette = () => {
    const colors = palette.map((c) => rgbToHex(hslToRgb(c)));
    const css = colors.map((c, i) => `--color-${i + 1}: ${c};`).join("\n");
    const blob = new Blob([`:root {\n${css}\n}`], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.css";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SectionHeader = ({
    title,
    section,
  }: {
    title: string;
    section: keyof typeof expandedSections;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="text-sm font-medium">{title}</span>
      {expandedSections[section] ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      title="Copier"
    >
      {copied === id ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux outils
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Convertisseur de Couleurs</h1>
          <p className="mt-2 text-muted-foreground">
            Convertissez entre HEX, RGB, HSL, HSV, CMYK, HWB, LAB, LCH et générez des palettes harmonieuses.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Configuration Panel */}
          <div className="space-y-4">
            {/* Input Section */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4">
                <SectionHeader title="Entrée de couleur" section="input" />
                {expandedSections.input && (
                  <div className="mt-3 space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="#3B82F6, rgb(59, 130, 246), hsl(217, 91%, 60%)"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                      <input
                        type="color"
                        value={colorValues.hex}
                        onChange={handleColorPickerChange}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRandomColor}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Couleur aléatoire
                      </button>
                      {"EyeDropper" in globalThis && (
                        <button
                          onClick={handleEyeDropper}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                        >
                          <Pipette className="h-4 w-4" />
                          Pipette
                        </button>
                      )}
                    </div>

                    {/* Named Colors */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Couleurs nommées
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(namedColors).slice(0, 12).map(([name, hex]) => (
                          <button
                            key={name}
                            onClick={() => handleInputChange(hex)}
                            className="h-6 w-6 rounded border border-border"
                            style={{ backgroundColor: hex }}
                            title={name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Color Picker Sliders */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4">
                <SectionHeader title="Ajustements" section="picker" />
                {expandedSections.picker && (
                  <div className="mt-3 space-y-4">
                    {/* HSL Sliders */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Teinte (H): {hsl.h}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={hsl.h}
                        onChange={(e) => handleSliderChange("h", parseInt(e.target.value))}
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right,
                            hsl(0, ${hsl.s}%, ${hsl.l}%),
                            hsl(60, ${hsl.s}%, ${hsl.l}%),
                            hsl(120, ${hsl.s}%, ${hsl.l}%),
                            hsl(180, ${hsl.s}%, ${hsl.l}%),
                            hsl(240, ${hsl.s}%, ${hsl.l}%),
                            hsl(300, ${hsl.s}%, ${hsl.l}%),
                            hsl(360, ${hsl.s}%, ${hsl.l}%))`
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Saturation (S): {hsl.s}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={hsl.s}
                        onChange={(e) => handleSliderChange("s", parseInt(e.target.value))}
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right,
                            hsl(${hsl.h}, 0%, ${hsl.l}%),
                            hsl(${hsl.h}, 100%, ${hsl.l}%))`
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Luminosité (L): {hsl.l}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={hsl.l}
                        onChange={(e) => handleSliderChange("l", parseInt(e.target.value))}
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right,
                            hsl(${hsl.h}, ${hsl.s}%, 0%),
                            hsl(${hsl.h}, ${hsl.s}%, 50%),
                            hsl(${hsl.h}, ${hsl.s}%, 100%))`
                        }}
                      />
                    </div>

                    <div className="border-t border-border pt-4">
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Rouge (R): {currentRgb.r}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={currentRgb.r}
                        onChange={(e) => handleRgbSliderChange("r", parseInt(e.target.value))}
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right,
                            rgb(0, ${currentRgb.g}, ${currentRgb.b}),
                            rgb(255, ${currentRgb.g}, ${currentRgb.b}))`
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Vert (G): {currentRgb.g}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={currentRgb.g}
                        onChange={(e) => handleRgbSliderChange("g", parseInt(e.target.value))}
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right,
                            rgb(${currentRgb.r}, 0, ${currentRgb.b}),
                            rgb(${currentRgb.r}, 255, ${currentRgb.b}))`
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Bleu (B): {currentRgb.b}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={currentRgb.b}
                        onChange={(e) => handleRgbSliderChange("b", parseInt(e.target.value))}
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right,
                            rgb(${currentRgb.r}, ${currentRgb.g}, 0),
                            rgb(${currentRgb.r}, ${currentRgb.g}, 255))`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conversions */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4">
                <SectionHeader title="Conversions" section="conversions" />
                {expandedSections.conversions && (
                  <div className="mt-3 space-y-3">
                    {[
                      { label: "HEX", value: colorValues.hex, id: "hex" },
                      { label: "HEX8", value: colorValues.hex8, id: "hex8" },
                      { label: "RGB", value: formatRgbString(colorValues.rgb), id: "rgb" },
                      { label: "HSL", value: formatHslString(colorValues.hsl), id: "hsl" },
                      { label: "HSV", value: formatHsvString(colorValues.hsv), id: "hsv" },
                      { label: "CMYK", value: formatCmykString(colorValues.cmyk), id: "cmyk" },
                      { label: "HWB", value: formatHwbString(colorValues.hwb), id: "hwb" },
                      { label: "LAB", value: formatLabString(colorValues.lab), id: "lab" },
                      { label: "LCH", value: formatLchString(colorValues.lch), id: "lch" },
                    ].map(({ label, value, id }) => (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <span className="text-xs font-medium text-muted-foreground w-12">
                          {label}
                        </span>
                        <code className="flex-1 text-sm font-mono">{value}</code>
                        <CopyButton text={value} id={id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Harmony */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4">
                <SectionHeader title="Harmonies" section="harmony" />
                {expandedSections.harmony && (
                  <div className="mt-3 space-y-4">
                    <select
                      value={harmonyType}
                      onChange={(e) => setHarmonyType(e.target.value as HarmonyType)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      {Object.entries(harmonyLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      {harmonyColors.map((color, i) => {
                        const rgb = hslToRgb(color);
                        const hex = rgbToHex(rgb);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentRgb(rgb);
                              setInputValue(hex);
                            }}
                            className="group relative flex-1"
                          >
                            <div
                              className="h-16 rounded-lg border border-border"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="mt-1 block text-center text-xs text-muted-foreground">
                              {hex}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Palette */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4">
                <SectionHeader title="Palette de nuances" section="palette" />
                {expandedSections.palette && (
                  <div className="mt-3 space-y-4">
                    <div className="flex gap-1">
                      {palette.map((color, i) => {
                        const rgb = hslToRgb(color);
                        const hex = rgbToHex(rgb);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentRgb(rgb);
                              setInputValue(hex);
                            }}
                            className="flex-1"
                          >
                            <div
                              className="h-12 rounded border border-border"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="mt-1 block text-center text-[10px] text-muted-foreground">
                              {(i + 1) * 100}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={exportPalette}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                      Exporter en CSS
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contrast Checker */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4">
                <SectionHeader title="Vérificateur de contraste" section="contrast" />
                {expandedSections.contrast && (
                  <div className="mt-3 space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Couleur de fond
                        </label>
                        <div className="flex gap-2">
                          <div
                            className="h-10 w-14 rounded-lg border border-border"
                            style={{ backgroundColor: colorValues.hex }}
                          />
                          <span className="flex items-center text-sm font-mono">
                            {colorValues.hex}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Couleur de texte
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={rgbToHex(contrastColor)}
                            onChange={(e) => {
                              const rgb = parseHex(e.target.value);
                              if (rgb) setContrastColor(rgb);
                            }}
                            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
                          />
                          <span className="flex items-center text-sm font-mono">
                            {rgbToHex(contrastColor)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div
                      className="rounded-lg border border-border p-4"
                      style={{ backgroundColor: colorValues.hex }}
                    >
                      <p
                        className="text-lg font-semibold"
                        style={{ color: rgbToHex(contrastColor) }}
                      >
                        Exemple de texte
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: rgbToHex(contrastColor) }}
                      >
                        Voici un exemple de texte plus petit pour vérifier la lisibilité.
                      </p>
                    </div>

                    {/* Ratio */}
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Ratio de contraste</span>
                        <span className="text-lg font-bold">
                          {contrastRatio.toFixed(2)}:1
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`rounded px-2 py-1 text-center ${wcagLevel.aa ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          AA Normal: {wcagLevel.aa ? "✓" : "✗"}
                        </div>
                        <div className={`rounded px-2 py-1 text-center ${wcagLevel.aaLarge ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          AA Large: {wcagLevel.aaLarge ? "✓" : "✗"}
                        </div>
                        <div className={`rounded px-2 py-1 text-center ${wcagLevel.aaa ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          AAA Normal: {wcagLevel.aaa ? "✓" : "✗"}
                        </div>
                        <div className={`rounded px-2 py-1 text-center ${wcagLevel.aaaLarge ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          AAA Large: {wcagLevel.aaaLarge ? "✓" : "✗"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium">Aperçu</h2>

              {/* Main Color */}
              <div
                className="mb-4 aspect-square w-full rounded-lg border border-border"
                style={{ backgroundColor: colorValues.hex }}
              />

              {/* Color Info */}
              <div className="mb-4 text-center">
                <p
                  className="text-2xl font-bold"
                  style={{ color: colorValues.hex }}
                >
                  {colorValues.hex}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatRgbString(colorValues.rgb)}
                </p>
              </div>

              {/* Text Preview */}
              <div
                className="mb-4 rounded-lg border border-border p-4"
                style={{ backgroundColor: colorValues.hex }}
              >
                <p
                  className="text-lg font-semibold"
                  style={{ color: rgbToHex(textColor) }}
                >
                  Texte sur cette couleur
                </p>
                <p
                  className="text-sm"
                  style={{ color: rgbToHex(textColor) }}
                >
                  {rgbToHex(textColor) === "#FFFFFF" ? "Texte blanc recommandé" : "Texte noir recommandé"}
                </p>
              </div>

              {/* Quick Copy */}
              <div className="space-y-2">
                {[
                  { label: "HEX", value: colorValues.hex },
                  { label: "RGB", value: formatRgbString(colorValues.rgb) },
                  { label: "HSL", value: formatHslString(colorValues.hsl) },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => copyToClipboard(value, `quick-${label}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{label}</span>
                    <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      {value}
                      {copied === `quick-${label}` ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
