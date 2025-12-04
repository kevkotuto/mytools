"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Pipette,
  Download,
} from "lucide-react";
import type { RGB, HSL, HarmonyType } from "@/types/color";
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
  randomColor,
  namedColors,
  rgbToHex,
} from "@/lib/color-utils";
import { harmonyLabels } from "@/types/color";

export default function ColorConverterPage() {
  const [currentRgb, setCurrentRgb] = useState<RGB>({ r: 59, g: 130, b: 246 });
  const [inputValue, setInputValue] = useState("#3B82F6");
  const [copied, setCopied] = useState<string | null>(null);
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const [contrastColor, setContrastColor] = useState<RGB>({ r: 255, g: 255, b: 255 });
  const [activeTab, setActiveTab] = useState<"convert" | "harmony" | "contrast">("convert");

  const colorValues = convertColor(currentRgb);
  const hsl = rgbToHsl(currentRgb);
  const harmonyColors = getHarmonyColors(hsl, harmonyType);
  const palette = generatePalette(hsl, 9);
  const textColor = getTextColor(currentRgb);
  const contrastRatio = getContrastRatio(currentRgb, contrastColor);
  const wcagLevel = getWCAGLevel(contrastRatio);

  const parseInput = useCallback((value: string) => {
    const trimmed = value.trim();

    if (trimmed.startsWith("#") || /^[0-9A-Fa-f]{3,8}$/.test(trimmed)) {
      const rgb = parseHex(trimmed);
      if (rgb) return rgb;
    }

    if (trimmed.toLowerCase().startsWith("rgb")) {
      const rgb = parseRgb(trimmed);
      if (rgb) return rgb;
    }

    if (trimmed.toLowerCase().startsWith("hsl")) {
      const hsl = parseHsl(trimmed);
      if (hsl) return hslToRgb(hsl);
    }

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

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {copied === id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Convertisseur de Couleurs</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="flex h-[calc(100vh-88px)] flex-col gap-4 lg:flex-row">
          {/* Zone principale avec aperçu */}
          <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
            {/* Aperçu couleur */}
            <div
              className="relative h-48 rounded-t-lg lg:h-64"
              style={{ backgroundColor: colorValues.hex }}
            >
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-2xl font-bold" style={{ color: rgbToHex(textColor) }}>
                  {colorValues.hex}
                </p>
                <p className="text-sm opacity-80" style={{ color: rgbToHex(textColor) }}>
                  {formatRgbString(colorValues.rgb)}
                </p>
              </div>
            </div>

            {/* Input couleur */}
            <div className="flex items-center gap-3 border-b border-border p-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="#3B82F6, rgb(59, 130, 246), blue..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="color"
                value={colorValues.hex}
                onChange={handleColorPickerChange}
                className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-background"
              />
              <button
                onClick={handleRandomColor}
                className="rounded-lg border border-border p-2.5 hover:bg-accent"
                title="Couleur aléatoire"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              {"EyeDropper" in globalThis && (
                <button
                  onClick={handleEyeDropper}
                  className="rounded-lg border border-border p-2.5 hover:bg-accent"
                  title="Pipette"
                >
                  <Pipette className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sliders HSL */}
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-6 space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Teinte</span>
                    <span className="font-medium">{hsl.h}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hsl.h}
                    onChange={(e) => handleSliderChange("h", parseInt(e.target.value))}
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, hsl(0,${hsl.s}%,${hsl.l}%), hsl(60,${hsl.s}%,${hsl.l}%), hsl(120,${hsl.s}%,${hsl.l}%), hsl(180,${hsl.s}%,${hsl.l}%), hsl(240,${hsl.s}%,${hsl.l}%), hsl(300,${hsl.s}%,${hsl.l}%), hsl(360,${hsl.s}%,${hsl.l}%))`
                    }}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Saturation</span>
                    <span className="font-medium">{hsl.s}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hsl.s}
                    onChange={(e) => handleSliderChange("s", parseInt(e.target.value))}
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`
                    }}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Luminosité</span>
                    <span className="font-medium">{hsl.l}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hsl.l}
                    onChange={(e) => handleSliderChange("l", parseInt(e.target.value))}
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`
                    }}
                  />
                </div>
              </div>

              {/* Palette de nuances */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">NUANCES</h3>
                  <button
                    onClick={exportPalette}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3 w-3" />
                    CSS
                  </button>
                </div>
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
                          className="h-10 rounded border border-border"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="mt-1 block text-center text-[10px] text-muted-foreground">
                          {(i + 1) * 100}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Couleurs nommées */}
              <div className="mt-6">
                <h3 className="mb-2 text-xs font-medium text-muted-foreground">COULEURS RAPIDES</h3>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(namedColors).slice(0, 16).map(([name, hex]) => (
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
          </div>

          {/* Panneau de configuration avec tabs */}
          <div className="flex w-full flex-col rounded-lg border border-border bg-card lg:w-80">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "convert", label: "Formats" },
                { id: "harmony", label: "Harmonies" },
                { id: "contrast", label: "Contraste" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu des tabs */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tab Formats */}
              {activeTab === "convert" && (
                <div className="space-y-2">
                  {[
                    { label: "HEX", value: colorValues.hex },
                    { label: "RGB", value: formatRgbString(colorValues.rgb) },
                    { label: "HSL", value: formatHslString(colorValues.hsl) },
                    { label: "HSV", value: formatHsvString(colorValues.hsv) },
                    { label: "CMYK", value: formatCmykString(colorValues.cmyk) },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <span className="w-12 text-xs font-medium text-muted-foreground">{label}</span>
                      <code className="flex-1 text-xs">{value}</code>
                      <CopyButton text={value} id={label} />
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Harmonies */}
              {activeTab === "harmony" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.entries(harmonyLabels) as [HarmonyType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setHarmonyType(key)}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                          harmonyType === key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
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
                          className="text-center"
                        >
                          <div
                            className="h-16 rounded-lg border border-border"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="mt-1 block text-[10px] text-muted-foreground">{hex}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab Contraste */}
              {activeTab === "contrast" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                      <span className="flex items-center font-mono text-sm">
                        {rgbToHex(contrastColor)}
                      </span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    className="rounded-lg border border-border p-4"
                    style={{ backgroundColor: colorValues.hex }}
                  >
                    <p className="text-lg font-semibold" style={{ color: rgbToHex(contrastColor) }}>
                      Exemple de texte
                    </p>
                    <p className="text-sm" style={{ color: rgbToHex(contrastColor) }}>
                      Texte plus petit pour vérifier.
                    </p>
                  </div>

                  {/* Ratio */}
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Ratio</span>
                      <span className="text-lg font-bold">{contrastRatio.toFixed(2)}:1</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className={`rounded px-2 py-1 text-center ${wcagLevel.aa ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        AA: {wcagLevel.aa ? "✓" : "✗"}
                      </div>
                      <div className={`rounded px-2 py-1 text-center ${wcagLevel.aaLarge ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        AA Large: {wcagLevel.aaLarge ? "✓" : "✗"}
                      </div>
                      <div className={`rounded px-2 py-1 text-center ${wcagLevel.aaa ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        AAA: {wcagLevel.aaa ? "✓" : "✗"}
                      </div>
                      <div className={`rounded px-2 py-1 text-center ${wcagLevel.aaaLarge ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        AAA Large: {wcagLevel.aaaLarge ? "✓" : "✗"}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground">SUGGESTIONS</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setContrastColor({ r: 255, g: 255, b: 255 })}
                        className="flex-1 rounded-lg border border-border bg-white py-2 text-xs font-medium text-black"
                      >
                        Blanc
                      </button>
                      <button
                        onClick={() => setContrastColor({ r: 0, g: 0, b: 0 })}
                        className="flex-1 rounded-lg border border-border bg-black py-2 text-xs font-medium text-white"
                      >
                        Noir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
