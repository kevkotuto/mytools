"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  ArrowUpDown,
  Download,
  Upload,
} from "lucide-react";

type TransformType =
  | "uppercase" | "lowercase" | "capitalize" | "titlecase" | "sentencecase"
  | "alternating" | "inverse" | "camelCase" | "PascalCase" | "snake_case"
  | "kebab-case" | "CONSTANT_CASE" | "reverse" | "shuffle" | "remove-spaces"
  | "remove-extra-spaces" | "remove-newlines" | "add-line-numbers" | "remove-duplicates"
  | "sort-lines" | "sort-lines-reverse" | "encode-uri" | "decode-uri" | "encode-html"
  | "decode-html" | "encode-base64" | "decode-base64" | "escape-json" | "unescape-json"
  | "slug" | "trim-lines" | "remove-empty-lines" | "reverse-lines";

const transforms: { category: string; items: { type: TransformType; label: string }[] }[] = [
  {
    category: "Casse",
    items: [
      { type: "uppercase", label: "MAJUSCULES" },
      { type: "lowercase", label: "minuscules" },
      { type: "capitalize", label: "Première" },
      { type: "titlecase", label: "Chaque Mot" },
      { type: "sentencecase", label: "Phrase" },
      { type: "alternating", label: "aLtErN" },
      { type: "inverse", label: "iNVERSE" },
    ],
  },
  {
    category: "Code",
    items: [
      { type: "camelCase", label: "camelCase" },
      { type: "PascalCase", label: "PascalCase" },
      { type: "snake_case", label: "snake_case" },
      { type: "kebab-case", label: "kebab-case" },
      { type: "CONSTANT_CASE", label: "CONSTANT" },
      { type: "slug", label: "slug" },
    ],
  },
  {
    category: "Texte",
    items: [
      { type: "reverse", label: "Inverser" },
      { type: "shuffle", label: "Mélanger" },
      { type: "remove-spaces", label: "Sans espaces" },
      { type: "remove-extra-spaces", label: "Nettoyer" },
      { type: "remove-newlines", label: "1 ligne" },
      { type: "trim-lines", label: "Trim" },
    ],
  },
  {
    category: "Lignes",
    items: [
      { type: "add-line-numbers", label: "Numéroter" },
      { type: "remove-duplicates", label: "Dédupliquer" },
      { type: "sort-lines", label: "Trier A-Z" },
      { type: "sort-lines-reverse", label: "Trier Z-A" },
      { type: "remove-empty-lines", label: "Sans vides" },
      { type: "reverse-lines", label: "Inverser" },
    ],
  },
  {
    category: "Encodage",
    items: [
      { type: "encode-uri", label: "URL +" },
      { type: "decode-uri", label: "URL -" },
      { type: "encode-html", label: "HTML +" },
      { type: "decode-html", label: "HTML -" },
      { type: "encode-base64", label: "Base64 +" },
      { type: "decode-base64", label: "Base64 -" },
      { type: "escape-json", label: "JSON +" },
      { type: "unescape-json", label: "JSON -" },
    ],
  },
];

export default function TextTransformerPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTransform, setActiveTransform] = useState<TransformType | null>(null);

  const applyTransform = useCallback((type: TransformType, text: string): string => {
    switch (type) {
      case "uppercase": return text.toUpperCase();
      case "lowercase": return text.toLowerCase();
      case "capitalize": return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case "titlecase": return text.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase());
      case "sentencecase": return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
      case "alternating": return text.split("").map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join("");
      case "inverse": return text.split("").map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join("");
      case "camelCase": return text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, (c) => c.toLowerCase());
      case "PascalCase": return text.toLowerCase().replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (_, c) => c.toUpperCase());
      case "snake_case": return text.replace(/\s+/g, "_").replace(/[A-Z]/g, (c) => "_" + c.toLowerCase()).replace(/^_/, "").replace(/__+/g, "_").toLowerCase();
      case "kebab-case": return text.replace(/\s+/g, "-").replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()).replace(/^-/, "").replace(/--+/g, "-").toLowerCase();
      case "CONSTANT_CASE": return text.replace(/\s+/g, "_").replace(/[A-Z]/g, (c) => "_" + c).replace(/^_/, "").replace(/__+/g, "_").toUpperCase();
      case "reverse": return text.split("").reverse().join("");
      case "shuffle": return text.split("").sort(() => Math.random() - 0.5).join("");
      case "remove-spaces": return text.replace(/\s/g, "");
      case "remove-extra-spaces": return text.replace(/\s+/g, " ").trim();
      case "remove-newlines": return text.replace(/[\r\n]+/g, " ");
      case "add-line-numbers": return text.split("\n").map((line, i) => `${i + 1}. ${line}`).join("\n");
      case "remove-duplicates": return [...new Set(text.split("\n"))].join("\n");
      case "sort-lines": return text.split("\n").sort((a, b) => a.localeCompare(b)).join("\n");
      case "sort-lines-reverse": return text.split("\n").sort((a, b) => b.localeCompare(a)).join("\n");
      case "encode-uri": return encodeURIComponent(text);
      case "decode-uri": try { return decodeURIComponent(text); } catch { return "Erreur: URL invalide"; }
      case "encode-html": return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      case "decode-html": const el = document.createElement("textarea"); el.innerHTML = text; return el.value;
      case "encode-base64": try { return btoa(unescape(encodeURIComponent(text))); } catch { return "Erreur"; }
      case "decode-base64": try { return decodeURIComponent(escape(atob(text))); } catch { return "Erreur: Base64 invalide"; }
      case "escape-json": return JSON.stringify(text);
      case "unescape-json": try { return JSON.parse(text); } catch { return "Erreur: JSON invalide"; }
      case "slug": return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      case "trim-lines": return text.split("\n").map((line) => line.trim()).join("\n");
      case "remove-empty-lines": return text.split("\n").filter((line) => line.trim()).join("\n");
      case "reverse-lines": return text.split("\n").reverse().join("\n");
      default: return text;
    }
  }, []);

  const handleTransform = (type: TransformType) => {
    setActiveTransform(type);
    setOutput(applyTransform(type, input));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    setInput(output);
    setOutput(input);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setActiveTransform(null);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transformed.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setInput(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const stats = {
    chars: input.length,
    charsNoSpace: input.replace(/\s/g, "").length,
    words: input.trim().split(/\s+/).filter(Boolean).length,
    lines: input.split("\n").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Transformateur de Texte</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="flex h-[calc(100vh-88px)] flex-col gap-4 lg:flex-row">
          {/* Zone principale */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Input */}
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">Entrée</h2>
                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                    <span>{stats.chars} car.</span>
                    <span>{stats.words} mots</span>
                    <span>{stats.lines} lignes</span>
                  </div>
                  <label className="flex cursor-pointer items-center rounded border border-border bg-background p-1.5 hover:bg-accent">
                    <Upload className="h-3.5 w-3.5" />
                    <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button onClick={handleClear} className="rounded border border-border bg-background p-1.5 hover:bg-accent">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Collez ou tapez votre texte ici..."
                className="flex-1 resize-none bg-transparent p-4 text-sm focus:outline-none"
              />
            </div>

            {/* Swap */}
            <div className="flex justify-center">
              <button onClick={handleSwap} className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-accent">
                <ArrowUpDown className="h-4 w-4" />
                Échanger
              </button>
            </div>

            {/* Output */}
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">
                  Résultat
                  {activeTransform && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({transforms.flatMap(c => c.items).find(i => i.type === activeTransform)?.label})
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!output}
                    className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                  <button onClick={handleDownload} disabled={!output} className="rounded border border-border bg-background p-1.5 hover:bg-accent disabled:opacity-50">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Le texte transformé apparaîtra ici..."
                className="flex-1 resize-none bg-transparent p-4 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Panneau transformations */}
          <div className="flex w-full flex-col gap-3 overflow-y-auto lg:w-64">
            {transforms.map(({ category, items }) => (
              <div key={category} className="rounded-lg border border-border bg-card p-3">
                <h3 className="mb-2 text-xs font-medium text-muted-foreground">{category.toUpperCase()}</h3>
                <div className="grid grid-cols-2 gap-1">
                  {items.map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => handleTransform(type)}
                      disabled={!input}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                        activeTransform === type
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent disabled:opacity-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Stats */}
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">STATISTIQUES</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caractères</span>
                  <span className="font-medium">{stats.chars}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sans espaces</span>
                  <span className="font-medium">{stats.charsNoSpace}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mots</span>
                  <span className="font-medium">{stats.words}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lignes</span>
                  <span className="font-medium">{stats.lines}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
