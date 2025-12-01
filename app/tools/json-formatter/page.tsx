"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Minimize2,
  Maximize2,
  FileJson,
  Code,
  List,
  Braces,
} from "lucide-react";

type ViewMode = "tree" | "raw" | "minified";
type IndentSize = 2 | 4 | 8;

interface JsonStats {
  keys: number;
  values: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  arrays: number;
  objects: number;
  depth: number;
}

// Fonction utilitaire pour trier les clés d'un objet récursivement
function sortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);

  return Object.keys(obj as object)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as Record<string, unknown>);
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [indentSize, setIndentSize] = useState<IndentSize>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["root"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandAll, setExpandAll] = useState(true);

  const parseResult = useMemo(() => {
    if (!input.trim()) {
      return { valid: true, data: null, error: null, formatted: "", minified: "" };
    }

    try {
      const data = JSON.parse(input);
      const sortedData = sortKeys ? sortObject(data) : data;
      const formatted = JSON.stringify(sortedData, null, indentSize);
      const minified = JSON.stringify(sortedData);
      return { valid: true, data: sortedData, error: null, formatted, minified };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de parsing JSON";
      return { valid: false, data: null, error: errorMessage, formatted: "", minified: "" };
    }
  }, [input, indentSize, sortKeys]);

  const stats = useMemo((): JsonStats | null => {
    if (!parseResult.valid || !parseResult.data) return null;

    const countStats = (obj: unknown, depth = 0): JsonStats => {
      const stats: JsonStats = {
        keys: 0,
        values: 0,
        strings: 0,
        numbers: 0,
        booleans: 0,
        nulls: 0,
        arrays: 0,
        objects: 0,
        depth,
      };

      if (obj === null) {
        stats.nulls = 1;
        stats.values = 1;
      } else if (typeof obj === "string") {
        stats.strings = 1;
        stats.values = 1;
      } else if (typeof obj === "number") {
        stats.numbers = 1;
        stats.values = 1;
      } else if (typeof obj === "boolean") {
        stats.booleans = 1;
        stats.values = 1;
      } else if (Array.isArray(obj)) {
        stats.arrays = 1;
        for (const item of obj) {
          const childStats = countStats(item, depth + 1);
          mergeStats(stats, childStats);
        }
      } else if (typeof obj === "object") {
        stats.objects = 1;
        stats.keys = Object.keys(obj).length;
        for (const value of Object.values(obj)) {
          const childStats = countStats(value, depth + 1);
          mergeStats(stats, childStats);
        }
      }

      return stats;
    };

    const mergeStats = (target: JsonStats, source: JsonStats) => {
      target.keys += source.keys;
      target.values += source.values;
      target.strings += source.strings;
      target.numbers += source.numbers;
      target.booleans += source.booleans;
      target.nulls += source.nulls;
      target.arrays += source.arrays;
      target.objects += source.objects;
      target.depth = Math.max(target.depth, source.depth);
    };

    return countStats(parseResult.data);
  }, [parseResult]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAllPaths = () => {
    if (!parseResult.data) return;
    const paths = new Set<string>(["root"]);
    const addPaths = (obj: unknown, path: string) => {
      if (Array.isArray(obj)) {
        obj.forEach((_, i) => {
          const p = `${path}[${i}]`;
          paths.add(p);
          addPaths(obj[i], p);
        });
      } else if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          const p = `${path}.${key}`;
          paths.add(p);
          addPaths((obj as Record<string, unknown>)[key], p);
        });
      }
    };
    addPaths(parseResult.data, "root");
    setExpandedPaths(paths);
    setExpandAll(true);
  };

  const collapseAllPaths = () => {
    setExpandedPaths(new Set(["root"]));
    setExpandAll(false);
  };

  const renderJsonTree = (data: unknown, path = "root", level = 0): React.ReactNode => {
    const isExpanded = expandedPaths.has(path);
    const indent = level * 16;

    if (data === null) {
      return <span className="text-orange-500">null</span>;
    }

    if (typeof data === "string") {
      const matchesSearch = searchQuery && data.toLowerCase().includes(searchQuery.toLowerCase());
      return (
        <span className={`text-green-600 ${matchesSearch ? "bg-yellow-200 dark:bg-yellow-800" : ""}`}>
          &quot;{data}&quot;
        </span>
      );
    }

    if (typeof data === "number") {
      return <span className="text-blue-600">{data}</span>;
    }

    if (typeof data === "boolean") {
      return <span className="text-purple-600">{String(data)}</span>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }

      return (
        <span>
          <button
            onClick={() => togglePath(path)}
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3 rotate-180" />
            )}
          </button>
          <span className="text-muted-foreground">
            [{!isExpanded && <span className="text-xs"> {data.length} éléments </span>}
          </span>
          {isExpanded && (
            <div style={{ marginLeft: indent + 16 }}>
              {data.map((item, i) => (
                <div key={i}>
                  <span className="text-muted-foreground">{i}: </span>
                  {renderJsonTree(item, `${path}[${i}]`, level + 1)}
                  {i < data.length - 1 && <span className="text-muted-foreground">,</span>}
                </div>
              ))}
            </div>
          )}
          <span className="text-muted-foreground">]</span>
        </span>
      );
    }

    if (typeof data === "object") {
      const keys = Object.keys(data as object);
      if (keys.length === 0) {
        return <span className="text-muted-foreground">{"{}"}</span>;
      }

      return (
        <span>
          <button
            onClick={() => togglePath(path)}
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3 rotate-180" />
            )}
          </button>
          <span className="text-muted-foreground">
            {"{"}{!isExpanded && <span className="text-xs"> {keys.length} clés </span>}
          </span>
          {isExpanded && (
            <div style={{ marginLeft: indent + 16 }}>
              {keys.map((key, i) => {
                const matchesSearch = searchQuery && key.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <div key={key}>
                    <span className={`text-red-600 ${matchesSearch ? "bg-yellow-200 dark:bg-yellow-800" : ""}`}>
                      &quot;{key}&quot;
                    </span>
                    <span className="text-muted-foreground">: </span>
                    {renderJsonTree((data as Record<string, unknown>)[key], `${path}.${key}`, level + 1)}
                    {i < keys.length - 1 && <span className="text-muted-foreground">,</span>}
                  </div>
                );
              })}
            </div>
          )}
          <span className="text-muted-foreground">{"}"}</span>
        </span>
      );
    }

    return <span>{String(data)}</span>;
  };

  const getLineNumbers = (text: string) => {
    const lines = text.split("\n").length;
    return Array.from({ length: lines }, (_, i) => i + 1);
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
          <h1 className="text-3xl font-bold">Formateur JSON</h1>
          <p className="mt-2 text-muted-foreground">
            Formatez, validez, minifiez et explorez vos données JSON avec un éditeur visuel.
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === "tree" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <List className="h-4 w-4" />
              Arbre
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === "raw" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <Code className="h-4 w-4" />
              Formaté
            </button>
            <button
              onClick={() => setViewMode("minified")}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === "minified" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <Minimize2 className="h-4 w-4" />
              Minifié
            </button>
          </div>

          <select
            value={indentSize}
            onChange={(e) => setIndentSize(parseInt(e.target.value) as IndentSize)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value={2}>2 espaces</option>
            <option value={4}>4 espaces</option>
            <option value={8}>8 espaces</option>
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Trier les clés
          </label>

          <div className="flex-1" />

          <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent">
            <Upload className="h-4 w-4" />
            Importer
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setInput("")}
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" />
            Effacer
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">Entrée JSON</h2>
                {parseResult.valid && input.trim() ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    JSON valide
                  </span>
                ) : input.trim() ? (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    JSON invalide
                  </span>
                ) : null}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='{"exemple": "Collez votre JSON ici..."}'
                className="h-96 w-full resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
                spellCheck={false}
              />
            </div>

            {/* Error Display */}
            {!parseResult.valid && parseResult.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {parseResult.error}
                </p>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium">Statistiques</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Objets</p>
                    <p className="text-lg font-semibold">{stats.objects}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tableaux</p>
                    <p className="text-lg font-semibold">{stats.arrays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clés</p>
                    <p className="text-lg font-semibold">{stats.keys}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profondeur</p>
                    <p className="text-lg font-semibold">{stats.depth}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Strings</p>
                    <p className="text-lg font-semibold">{stats.strings}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nombres</p>
                    <p className="text-lg font-semibold">{stats.numbers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booléens</p>
                    <p className="text-lg font-semibold">{stats.booleans}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nulls</p>
                    <p className="text-lg font-semibold">{stats.nulls}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">
                  {viewMode === "tree" ? "Vue arborescente" : viewMode === "raw" ? "Formaté" : "Minifié"}
                </h2>
                <div className="flex gap-2">
                  {viewMode === "tree" && parseResult.data && (
                    <>
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-32 rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                      <button
                        onClick={expandAll ? collapseAllPaths : expandAllPaths}
                        className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                      >
                        {expandAll ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                        {expandAll ? "Réduire" : "Étendre"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleCopy(viewMode === "minified" ? parseResult.minified : parseResult.formatted)}
                    disabled={!parseResult.valid}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    Copier
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(
                        viewMode === "minified" ? parseResult.minified : parseResult.formatted,
                        viewMode === "minified" ? "data.min.json" : "data.json"
                      )
                    }
                    disabled={!parseResult.valid}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="h-96 overflow-auto p-4">
                {parseResult.valid && parseResult.data ? (
                  viewMode === "tree" ? (
                    <div className="font-mono text-sm">{renderJsonTree(parseResult.data)}</div>
                  ) : (
                    <div className="flex font-mono text-sm">
                      <div className="mr-4 select-none border-r border-border pr-4 text-right text-muted-foreground">
                        {getLineNumbers(viewMode === "minified" ? parseResult.minified : parseResult.formatted).map((n) => (
                          <div key={n}>{n}</div>
                        ))}
                      </div>
                      <pre className="flex-1 whitespace-pre-wrap break-all">
                        {viewMode === "minified" ? parseResult.minified : parseResult.formatted}
                      </pre>
                    </div>
                  )
                ) : (
                  <p className="text-center text-muted-foreground">
                    {input.trim() ? "JSON invalide" : "Entrez du JSON pour commencer"}
                  </p>
                )}
              </div>
            </div>

            {/* Size comparison */}
            {parseResult.valid && parseResult.formatted && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium">Taille</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Original</p>
                    <p className="font-semibold">{formatBytes(new Blob([input]).size)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Formaté</p>
                    <p className="font-semibold">{formatBytes(new Blob([parseResult.formatted]).size)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Minifié</p>
                    <p className="font-semibold">
                      {formatBytes(new Blob([parseResult.minified]).size)}
                      <span className="ml-1 text-green-600 text-xs">
                        (-{Math.round((1 - new Blob([parseResult.minified]).size / new Blob([parseResult.formatted]).size) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sample JSON */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Exemples</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInput(JSON.stringify({ name: "John", age: 30, city: "Paris" }, null, 2))}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Objet simple
                </button>
                <button
                  onClick={() => setInput(JSON.stringify([1, 2, 3, { a: "b" }, [4, 5]], null, 2))}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Tableau mixte
                </button>
                <button
                  onClick={() =>
                    setInput(
                      JSON.stringify(
                        {
                          users: [
                            { id: 1, name: "Alice", email: "alice@example.com", roles: ["admin", "user"] },
                            { id: 2, name: "Bob", email: "bob@example.com", roles: ["user"] },
                          ],
                          pagination: { page: 1, total: 100, perPage: 10 },
                          meta: { version: "1.0", timestamp: new Date().toISOString() },
                        },
                        null,
                        2
                      )
                    )
                  }
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  API Response
                </button>
                <button
                  onClick={() =>
                    setInput(
                      JSON.stringify(
                        {
                          $schema: "https://json-schema.org/draft/2020-12/schema",
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            age: { type: "integer", minimum: 0 },
                          },
                          required: ["name"],
                        },
                        null,
                        2
                      )
                    )
                  }
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  JSON Schema
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
