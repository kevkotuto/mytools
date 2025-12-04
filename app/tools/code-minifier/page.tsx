"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Minimize2, Copy, Check, FileCode, Trash2, Download, Zap } from "lucide-react";
import Link from "next/link";

type Language = "html" | "css" | "javascript" | "json";

interface MinifyResult {
  output: string;
  originalSize: number;
  minifiedSize: number;
  savings: number;
  savingsPercent: number;
}

export default function CodeMinifierPage() {
  const [language, setLanguage] = useState<Language>("html");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<MinifyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const minifyHTML = (code: string): string => {
    return code
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove whitespace between tags
      .replace(/>\s+</g, "><")
      // Remove leading/trailing whitespace
      .replace(/^\s+|\s+$/gm, "")
      // Collapse multiple spaces
      .replace(/\s{2,}/g, " ")
      // Remove newlines
      .replace(/\n/g, "")
      .trim();
  };

  const minifyCSS = (code: string): string => {
    return code
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remove whitespace around selectors and properties
      .replace(/\s*([{};:,>+~])\s*/g, "$1")
      // Remove last semicolon before }
      .replace(/;}/g, "}")
      // Remove newlines and extra spaces
      .replace(/\s+/g, " ")
      // Remove spaces around parentheses
      .replace(/\s*\(\s*/g, "(")
      .replace(/\s*\)\s*/g, ")")
      .trim();
  };

  const minifyJS = (code: string): string => {
    // Simple JS minification (not as aggressive as terser but works for basic cases)
    return code
      // Remove single-line comments (but not URLs)
      .replace(/([^:])\/\/.*$/gm, "$1")
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remove leading/trailing whitespace per line
      .replace(/^\s+|\s+$/gm, "")
      // Collapse multiple spaces (but not in strings)
      .replace(/\s{2,}/g, " ")
      // Remove spaces around operators (simplified)
      .replace(/\s*([{};,=+\-*/<>!&|?:])\s*/g, "$1")
      // Add back necessary spaces
      .replace(/\b(return|var|let|const|if|else|for|while|function|class|new|typeof|instanceof)\b/g, " $1 ")
      // Clean up extra spaces
      .replace(/\s+/g, " ")
      // Remove newlines
      .replace(/\n/g, "")
      .trim();
  };

  const minifyJSON = (code: string): string => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed);
    } catch {
      throw new Error("JSON invalide");
    }
  };

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError("Veuillez entrer du code à minifier");
      setResult(null);
      return;
    }

    setError("");

    try {
      let minified: string;

      switch (language) {
        case "html":
          minified = minifyHTML(input);
          break;
        case "css":
          minified = minifyCSS(input);
          break;
        case "javascript":
          minified = minifyJS(input);
          break;
        case "json":
          minified = minifyJSON(input);
          break;
        default:
          minified = input;
      }

      const originalSize = new Blob([input]).size;
      const minifiedSize = new Blob([minified]).size;
      const savings = originalSize - minifiedSize;
      const savingsPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0;

      setResult({
        output: minified,
        originalSize,
        minifiedSize,
        savings,
        savingsPercent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la minification");
      setResult(null);
    }
  }, [input, language]);

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (!result) return;

    const extensions: Record<Language, string> = {
      html: "min.html",
      css: "min.css",
      javascript: "min.js",
      json: "min.json",
    };

    const blob = new Blob([result.output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extensions[language]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const loadSample = () => {
    const samples: Record<Language, string> = {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page</title>
</head>
<body>
    <!-- Main content -->
    <div class="container">
        <h1>Hello World</h1>
        <p>This is a sample paragraph with some text.</p>
    </div>
</body>
</html>`,
      css: `/* Main styles */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Typography */
h1 {
    font-size: 2rem;
    color: #333;
    margin-bottom: 1rem;
}

p {
    line-height: 1.6;
    color: #666;
}

/* Responsive */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}`,
      javascript: `// Utility functions
function greet(name) {
    // Say hello
    console.log("Hello, " + name + "!");
    return true;
}

/*
 * Main initialization
 */
const users = ["Alice", "Bob", "Charlie"];

users.forEach(function(user) {
    greet(user);
});

// Export
export default greet;`,
      json: `{
    "name": "MyTools",
    "version": "1.0.0",
    "description": "A collection of web tools",
    "dependencies": {
        "react": "^18.0.0",
        "next": "^14.0.0"
    },
    "scripts": {
        "dev": "next dev",
        "build": "next build"
    }
}`,
    };

    setInput(samples[language]);
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 flex items-center justify-center">
              <Minimize2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Code Minifier</h1>
              <p className="text-sm text-zinc-500">Minificateur HTML, CSS, JS, JSON</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Language Selection */}
        <div className="flex gap-2 mb-6">
          {(["html", "css", "javascript", "json"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setResult(null);
                setError("");
              }}
              className={`px-4 py-2 border text-sm font-medium transition-colors ${
                language === lang
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={loadSample}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            Exemple
          </button>
          <button
            onClick={() => {
              setInput("");
              setResult(null);
              setError("");
            }}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Effacer
          </button>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">
            Code {language.toUpperCase()} à minifier
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Collez votre code ${language.toUpperCase()} ici...`}
            className="w-full h-64 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
          />
        </div>

        {/* Minify Button */}
        <button
          onClick={handleMinify}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center justify-center gap-2 transition-colors mb-6"
        >
          <Zap className="w-5 h-5" />
          Minifier le code
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                <div className="text-sm text-zinc-500 mb-1">Taille originale</div>
                <div className="text-xl font-mono">{formatBytes(result.originalSize)}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                <div className="text-sm text-zinc-500 mb-1">Taille minifiée</div>
                <div className="text-xl font-mono text-cyan-400">{formatBytes(result.minifiedSize)}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                <div className="text-sm text-zinc-500 mb-1">Économie</div>
                <div className="text-xl font-mono text-emerald-400">{formatBytes(result.savings)}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                <div className="text-sm text-zinc-500 mb-1">Réduction</div>
                <div className="text-xl font-mono text-emerald-400">{result.savingsPercent.toFixed(1)}%</div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Code minifié</span>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                  <button
                    onClick={downloadFile}
                    className="px-3 py-1 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              </div>
              <pre className="p-4 text-sm font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                {result.output}
              </pre>
            </div>
          </>
        )}

        {/* Info */}
        <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">À propos du Code Minifier</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>HTML</strong> : Supprime les commentaires, les espaces inutiles et compresse le markup</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>CSS</strong> : Supprime les commentaires, les espaces et optimise les sélecteurs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>JavaScript</strong> : Supprime les commentaires et compresse le code (minification basique)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>JSON</strong> : Supprime les espaces et retours à la ligne tout en validant la syntaxe</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Traitement 100% local - aucune donnée n&apos;est envoyée à un serveur</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
