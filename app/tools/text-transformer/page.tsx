"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  FileText,
  Hash,
  Type,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
} from "lucide-react";

type TransformType =
  | "uppercase"
  | "lowercase"
  | "capitalize"
  | "titlecase"
  | "sentencecase"
  | "alternating"
  | "inverse"
  | "camelCase"
  | "PascalCase"
  | "snake_case"
  | "kebab-case"
  | "CONSTANT_CASE"
  | "dot.case"
  | "path/case"
  | "reverse"
  | "shuffle"
  | "remove-spaces"
  | "remove-extra-spaces"
  | "remove-newlines"
  | "add-line-numbers"
  | "remove-duplicates"
  | "sort-lines"
  | "sort-lines-reverse"
  | "encode-uri"
  | "decode-uri"
  | "encode-html"
  | "decode-html"
  | "encode-base64"
  | "decode-base64"
  | "escape-json"
  | "unescape-json"
  | "slug"
  | "trim-lines"
  | "remove-empty-lines"
  | "reverse-lines"
  | "count-words";

const transformLabels: Record<TransformType, string> = {
  uppercase: "MAJUSCULES",
  lowercase: "minuscules",
  capitalize: "Première Lettre",
  titlecase: "Chaque Mot Majuscule",
  sentencecase: "Phrase normale",
  alternating: "aLtErNaNcE",
  inverse: "iNVERSE",
  camelCase: "camelCase",
  PascalCase: "PascalCase",
  snake_case: "snake_case",
  "kebab-case": "kebab-case",
  CONSTANT_CASE: "CONSTANT_CASE",
  "dot.case": "dot.case",
  "path/case": "path/case",
  reverse: "Inverser le texte",
  shuffle: "Mélanger les caractères",
  "remove-spaces": "Supprimer les espaces",
  "remove-extra-spaces": "Supprimer espaces superflus",
  "remove-newlines": "Supprimer les sauts de ligne",
  "add-line-numbers": "Ajouter numéros de ligne",
  "remove-duplicates": "Supprimer les doublons",
  "sort-lines": "Trier les lignes (A-Z)",
  "sort-lines-reverse": "Trier les lignes (Z-A)",
  "encode-uri": "Encoder URL",
  "decode-uri": "Décoder URL",
  "encode-html": "Encoder HTML",
  "decode-html": "Décoder HTML",
  "encode-base64": "Encoder Base64",
  "decode-base64": "Décoder Base64",
  "escape-json": "Échapper JSON",
  "unescape-json": "Déséchapper JSON",
  slug: "Créer un slug",
  "trim-lines": "Nettoyer les lignes",
  "remove-empty-lines": "Supprimer lignes vides",
  "reverse-lines": "Inverser les lignes",
  "count-words": "Compter les mots",
};

const transformCategories: Record<string, TransformType[]> = {
  "Casse": [
    "uppercase",
    "lowercase",
    "capitalize",
    "titlecase",
    "sentencecase",
    "alternating",
    "inverse",
  ],
  "Code / Développement": [
    "camelCase",
    "PascalCase",
    "snake_case",
    "kebab-case",
    "CONSTANT_CASE",
    "dot.case",
    "path/case",
    "slug",
  ],
  "Texte": [
    "reverse",
    "shuffle",
    "remove-spaces",
    "remove-extra-spaces",
    "remove-newlines",
    "trim-lines",
  ],
  "Lignes": [
    "add-line-numbers",
    "remove-duplicates",
    "sort-lines",
    "sort-lines-reverse",
    "remove-empty-lines",
    "reverse-lines",
  ],
  "Encodage": [
    "encode-uri",
    "decode-uri",
    "encode-html",
    "decode-html",
    "encode-base64",
    "decode-base64",
    "escape-json",
    "unescape-json",
  ],
};

export default function TextTransformerPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTransform, setActiveTransform] = useState<TransformType | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Casse": true,
    "Code / Développement": true,
    "Texte": true,
    "Lignes": true,
    "Encodage": true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const applyTransform = useCallback((type: TransformType, text: string): string => {
    switch (type) {
      case "uppercase":
        return text.toUpperCase();
      case "lowercase":
        return text.toLowerCase();
      case "capitalize":
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case "titlecase":
        return text.replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
      case "sentencecase":
        return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
      case "alternating":
        return text.split("").map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join("");
      case "inverse":
        return text.split("").map((c) =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        ).join("");
      case "camelCase":
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
          .replace(/^[A-Z]/, (c) => c.toLowerCase());
      case "PascalCase":
        return text
          .toLowerCase()
          .replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (_, c) => c.toUpperCase());
      case "snake_case":
        return text
          .replace(/\s+/g, "_")
          .replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())
          .replace(/^_/, "")
          .replace(/__+/g, "_")
          .toLowerCase();
      case "kebab-case":
        return text
          .replace(/\s+/g, "-")
          .replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())
          .replace(/^-/, "")
          .replace(/--+/g, "-")
          .toLowerCase();
      case "CONSTANT_CASE":
        return text
          .replace(/\s+/g, "_")
          .replace(/[A-Z]/g, (c) => "_" + c)
          .replace(/^_/, "")
          .replace(/__+/g, "_")
          .toUpperCase();
      case "dot.case":
        return text
          .replace(/\s+/g, ".")
          .replace(/[A-Z]/g, (c) => "." + c.toLowerCase())
          .replace(/^\./, "")
          .replace(/\.\.+/g, ".")
          .toLowerCase();
      case "path/case":
        return text
          .replace(/\s+/g, "/")
          .replace(/[A-Z]/g, (c) => "/" + c.toLowerCase())
          .replace(/^\//, "")
          .replace(/\/\/+/g, "/")
          .toLowerCase();
      case "reverse":
        return text.split("").reverse().join("");
      case "shuffle":
        return text.split("").sort(() => Math.random() - 0.5).join("");
      case "remove-spaces":
        return text.replace(/\s/g, "");
      case "remove-extra-spaces":
        return text.replace(/\s+/g, " ").trim();
      case "remove-newlines":
        return text.replace(/[\r\n]+/g, " ");
      case "add-line-numbers":
        return text.split("\n").map((line, i) => `${i + 1}. ${line}`).join("\n");
      case "remove-duplicates":
        return [...new Set(text.split("\n"))].join("\n");
      case "sort-lines":
        return text.split("\n").sort((a, b) => a.localeCompare(b)).join("\n");
      case "sort-lines-reverse":
        return text.split("\n").sort((a, b) => b.localeCompare(a)).join("\n");
      case "encode-uri":
        return encodeURIComponent(text);
      case "decode-uri":
        try {
          return decodeURIComponent(text);
        } catch {
          return "Erreur: URL invalide";
        }
      case "encode-html":
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      case "decode-html":
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        return textarea.value;
      case "encode-base64":
        try {
          return btoa(unescape(encodeURIComponent(text)));
        } catch {
          return "Erreur: Impossible d'encoder";
        }
      case "decode-base64":
        try {
          return decodeURIComponent(escape(atob(text)));
        } catch {
          return "Erreur: Base64 invalide";
        }
      case "escape-json":
        return JSON.stringify(text);
      case "unescape-json":
        try {
          return JSON.parse(text);
        } catch {
          return "Erreur: JSON invalide";
        }
      case "slug":
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      case "trim-lines":
        return text.split("\n").map((line) => line.trim()).join("\n");
      case "remove-empty-lines":
        return text.split("\n").filter((line) => line.trim()).join("\n");
      case "reverse-lines":
        return text.split("\n").reverse().join("\n");
      case "count-words":
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        const charsNoSpace = text.replace(/\s/g, "").length;
        const lines = text.split("\n").length;
        const sentences = text.split(/[.!?]+/).filter(Boolean).length;
        return `Mots: ${words}\nCaractères: ${chars}\nCaractères (sans espaces): ${charsNoSpace}\nLignes: ${lines}\nPhrases: ${sentences}`;
      default:
        return text;
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
    a.download = "transformed-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const stats = {
    chars: input.length,
    charsNoSpace: input.replace(/\s/g, "").length,
    words: input.trim().split(/\s+/).filter(Boolean).length,
    lines: input.split("\n").length,
    sentences: input.split(/[.!?]+/).filter(Boolean).length,
  };

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
          <h1 className="text-3xl font-bold">Transformateur de Texte</h1>
          <p className="mt-2 text-muted-foreground">
            Convertissez la casse, encodez, formatez et manipulez votre texte de nombreuses façons.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
          {/* Main Area */}
          <div className="space-y-4">
            {/* Input */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">Texte d&apos;entrée</h2>
                <div className="flex gap-2">
                  <label className="flex cursor-pointer items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent">
                    <Upload className="h-3 w-3" />
                    Importer
                    <input
                      type="file"
                      accept=".txt,.md,.csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    <Trash2 className="h-3 w-3" />
                    Effacer
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Collez ou tapez votre texte ici..."
                className="h-48 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              {/* Stats */}
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{stats.chars} caractères</span>
                <span>{stats.charsNoSpace} sans espaces</span>
                <span>{stats.words} mots</span>
                <span>{stats.lines} lignes</span>
                <span>{stats.sentences} phrases</span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                <ArrowUpDown className="h-4 w-4" />
                Échanger
              </button>
            </div>

            {/* Output */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  Résultat
                  {activeTransform && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({transformLabels[activeTransform]})
                    </span>
                  )}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!output}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!output}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                    Télécharger
                  </button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Le texte transformé apparaîtra ici..."
                className="h-48 w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Transformations Panel */}
          <div className="space-y-4">
            {Object.entries(transformCategories).map(([category, transforms]) => (
              <div key={category} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium">{category}</span>
                  {expandedCategories[category] ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {expandedCategories[category] && (
                  <div className="border-t border-border p-4 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {transforms.map((transform) => (
                        <button
                          key={transform}
                          onClick={() => handleTransform(transform)}
                          disabled={!input}
                          className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                            activeTransform === transform
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border bg-background hover:bg-accent disabled:opacity-50"
                          }`}
                        >
                          {transformLabels[transform]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Quick Stats */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Statistiques rapides</h3>
              <div className="space-y-2 text-sm">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phrases</span>
                  <span className="font-medium">{stats.sentences}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temps de lecture</span>
                  <span className="font-medium">~{Math.ceil(stats.words / 200)} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
