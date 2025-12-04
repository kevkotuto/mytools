"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  RotateCcw,
  ImageIcon,
  Copy,
  Check,
  Code,
  FileCode,
  Wand2,
} from "lucide-react";
import Tesseract from "tesseract.js";

type CodeLanguage = "auto" | "javascript" | "python" | "html" | "css" | "json" | "sql";

const languageExtensions: Record<CodeLanguage, string> = {
  auto: "",
  javascript: "js",
  python: "py",
  html: "html",
  css: "css",
  json: "json",
  sql: "sql",
};

export default function ScreenshotToCodePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [extractedCode, setExtractedCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<CodeLanguage>("auto");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setExtractedCode("");
    setProgress(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFileUpload(file);
        break;
      }
    }
  }, [handleFileUpload]);

  // Listen for paste events
  useState(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("paste", handlePaste);
      return () => window.removeEventListener("paste", handlePaste);
    }
  });

  const cleanupCode = (text: string): string => {
    // Remove common OCR artifacts
    let cleaned = text
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[—–]/g, "-")
      .replace(/…/g, "...")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    // Remove line numbers if present
    cleaned = cleaned
      .split("\n")
      .map((line) => {
        // Remove leading line numbers like "1 ", "12 ", "123 "
        return line.replace(/^\s*\d{1,4}\s{1,2}/, "");
      })
      .join("\n");

    // Fix common OCR mistakes in code
    cleaned = cleaned
      .replace(/\bconst\s+(\w+)\s*[=:]\s*/g, "const $1 = ")
      .replace(/\blet\s+(\w+)\s*[=:]\s*/g, "let $1 = ")
      .replace(/\bvar\s+(\w+)\s*[=:]\s*/g, "var $1 = ")
      .replace(/=>\s*{/g, "=> {")
      .replace(/}\s*else\s*{/g, "} else {")
      .replace(/if\s*\(/g, "if (")
      .replace(/for\s*\(/g, "for (")
      .replace(/while\s*\(/g, "while (")
      .replace(/function\s+(\w+)\s*\(/g, "function $1(");

    return cleaned.trim();
  };

  const detectLanguage = (code: string): string => {
    if (language !== "auto") return language;

    // Simple language detection
    if (code.includes("def ") || code.includes("import ") && code.includes(":")) {
      return "python";
    }
    if (code.includes("<!DOCTYPE") || code.includes("<html") || code.includes("<div")) {
      return "html";
    }
    if (code.includes("{") && (code.includes("color:") || code.includes("margin:") || code.includes("display:"))) {
      return "css";
    }
    if (code.includes("SELECT") || code.includes("FROM") || code.includes("WHERE")) {
      return "sql";
    }
    if (code.startsWith("{") || code.startsWith("[")) {
      try {
        JSON.parse(code);
        return "json";
      } catch {
        // Not valid JSON
      }
    }
    if (code.includes("const ") || code.includes("let ") || code.includes("function ") || code.includes("=>")) {
      return "javascript";
    }

    return "plaintext";
  };

  const extractCode = async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const cleanedCode = cleanupCode(result.data.text);
      setExtractedCode(cleanedCode);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Erreur lors de l'extraction du texte");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(extractedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const detectedLang = detectLanguage(extractedCode);
    const ext = languageExtensions[detectedLang as CodeLanguage] || "txt";
    const blob = new Blob([extractedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setImageFile(null);
    setImageUrl("");
    setExtractedCode("");
    setProgress(0);
    setLanguage("auto");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-lg font-semibold">Screenshot to Code</h1>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          {!imageFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Code className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">Déposez une capture d'écran</p>
              <p className="mb-4 text-sm text-muted-foreground">
                ou collez une image (Ctrl+V)
              </p>
              <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                Choisir un fichier
              </label>
              <p className="mt-4 text-xs text-muted-foreground">
                PNG, JPG, WebP supportés
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Image preview */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">Image source</h3>
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImageUrl("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Changer
                    </button>
                  </div>
                  <img
                    src={imageUrl}
                    alt="Screenshot"
                    className="w-full rounded border border-border"
                  />
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Options</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-sm">Langage cible</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="auto">Détection automatique</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={extractCode}
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Extraction... {progress}%
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Extraire le code
                    </>
                  )}
                </button>

                {isProcessing && (
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Code output */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Code extrait</h3>
                      {extractedCode && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">
                          {detectLanguage(extractedCode)}
                        </span>
                      )}
                    </div>
                    {extractedCode && (
                      <div className="flex gap-2">
                        <button
                          onClick={copyCode}
                          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3" />
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
                          onClick={downloadCode}
                          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Télécharger
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {extractedCode ? (
                      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                        <code>{extractedCode}</code>
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <ImageIcon className="mb-3 h-10 w-10 opacity-50" />
                        <p className="text-sm">
                          Cliquez sur "Extraire le code" pour commencer
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {extractedCode && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-2 text-sm font-medium">Statistiques</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{extractedCode.split("\n").length}</p>
                        <p className="text-xs text-muted-foreground">Lignes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{extractedCode.split(/\s+/).length}</p>
                        <p className="text-xs text-muted-foreground">Mots</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{extractedCode.length}</p>
                        <p className="text-xs text-muted-foreground">Caractères</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>Note:</strong> L'OCR peut parfois mal interpréter certains caractères.
                    Vérifiez toujours le code extrait avant de l'utiliser.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
