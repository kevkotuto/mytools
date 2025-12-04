"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  List,
  Code,
} from "lucide-react";

type ViewMode = "tree" | "raw" | "minified";
type IndentSize = 2 | 4;

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
        keys: 0, values: 0, strings: 0, numbers: 0,
        booleans: 0, nulls: 0, arrays: 0, objects: 0, depth,
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
      if (next.has(path)) next.delete(path);
      else next.add(path);
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

    if (data === null) return <span className="text-orange-500">null</span>;
    if (typeof data === "string") {
      const matchesSearch = searchQuery && data.toLowerCase().includes(searchQuery.toLowerCase());
      return <span className={`text-green-600 ${matchesSearch ? "bg-yellow-200 dark:bg-yellow-800" : ""}`}>&quot;{data}&quot;</span>;
    }
    if (typeof data === "number") return <span className="text-blue-600">{data}</span>;
    if (typeof data === "boolean") return <span className="text-purple-600">{String(data)}</span>;

    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-muted-foreground">[]</span>;
      return (
        <span>
          <button onClick={() => togglePath(path)} className="inline-flex items-center text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3 rotate-180" />}
          </button>
          <span className="text-muted-foreground">[{!isExpanded && <span className="text-xs"> {data.length} </span>}</span>
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
      if (keys.length === 0) return <span className="text-muted-foreground">{"{}"}</span>;
      return (
        <span>
          <button onClick={() => togglePath(path)} className="inline-flex items-center text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3 rotate-180" />}
          </button>
          <span className="text-muted-foreground">{"{"}{!isExpanded && <span className="text-xs"> {keys.length} </span>}</span>
          {isExpanded && (
            <div style={{ marginLeft: indent + 16 }}>
              {keys.map((key, i) => {
                const matchesSearch = searchQuery && key.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <div key={key}>
                    <span className={`text-red-600 ${matchesSearch ? "bg-yellow-200 dark:bg-yellow-800" : ""}`}>&quot;{key}&quot;</span>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Formateur JSON</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-0.5">
            {[
              { mode: "tree" as ViewMode, label: "Arbre", icon: List },
              { mode: "raw" as ViewMode, label: "Formaté", icon: Code },
              { mode: "minified" as ViewMode, label: "Mini", icon: Minimize2 },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <select
            value={indentSize}
            onChange={(e) => setIndentSize(parseInt(e.target.value) as IndentSize)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
          >
            <option value={2}>2 espaces</option>
            <option value={4}>4 espaces</option>
          </select>

          <label className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            Trier
          </label>

          <div className="flex-1" />

          {parseResult.valid && input.trim() ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Valide
            </span>
          ) : input.trim() ? (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Invalide
            </span>
          ) : null}

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent">
            <Upload className="h-3.5 w-3.5" />
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setInput("")}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-160px)] gap-4">
          {/* Input */}
          <div className="flex w-1/2 flex-col rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2">
              <h2 className="text-sm font-medium">Entrée</h2>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"exemple": "Collez votre JSON ici..."}'
              className="flex-1 resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
              spellCheck={false}
            />
            {!parseResult.valid && parseResult.error && (
              <div className="border-t border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950">
                {parseResult.error}
              </div>
            )}
          </div>

          {/* Output */}
          <div className="flex w-1/2 flex-col rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <h2 className="text-sm font-medium">Sortie</h2>
              <div className="flex items-center gap-2">
                {viewMode === "tree" && parseResult.data && (
                  <>
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-24 rounded border border-border bg-background px-2 py-1 text-xs"
                    />
                    <button
                      onClick={expandAll ? collapseAllPaths : expandAllPaths}
                      className="rounded border border-border bg-background p-1 text-xs hover:bg-accent"
                    >
                      {expandAll ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleCopy(viewMode === "minified" ? parseResult.minified : parseResult.formatted)}
                  disabled={!parseResult.valid}
                  className="rounded border border-border bg-background p-1 hover:bg-accent disabled:opacity-50"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDownload(viewMode === "minified" ? parseResult.minified : parseResult.formatted, "data.json")}
                  disabled={!parseResult.valid}
                  className="rounded border border-border bg-background p-1 hover:bg-accent disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {parseResult.valid && parseResult.data ? (
                viewMode === "tree" ? (
                  <div className="font-mono text-sm">{renderJsonTree(parseResult.data)}</div>
                ) : (
                  <pre className="whitespace-pre-wrap break-all font-mono text-sm">
                    {viewMode === "minified" ? parseResult.minified : parseResult.formatted}
                  </pre>
                )
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {input.trim() ? "JSON invalide" : "Entrez du JSON"}
                </p>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <span>{stats.objects} obj</span>
                <span>{stats.arrays} arr</span>
                <span>{stats.keys} clés</span>
                <span>prof. {stats.depth}</span>
                <div className="flex-1" />
                <span>{formatBytes(new Blob([parseResult.formatted]).size)}</span>
                <span className="text-green-600">
                  mini: {formatBytes(new Blob([parseResult.minified]).size)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Exemples */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Exemples:</span>
          {[
            { label: "Objet", data: { name: "John", age: 30 } },
            { label: "Tableau", data: [1, 2, { a: "b" }] },
            { label: "API", data: { users: [{ id: 1, name: "Alice" }], total: 1 } },
          ].map(({ label, data }) => (
            <button
              key={label}
              onClick={() => setInput(JSON.stringify(data, null, 2))}
              className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
            >
              {label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
