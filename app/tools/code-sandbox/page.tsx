"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Plus,
  X,
  Upload,
  Download,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  Terminal,
  Code2,
  FileCode,
  FileJson,
  FileType,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Save,
} from "lucide-react";

// Types
interface Tab {
  id: string;
  name: string;
  language: "javascript" | "python" | "html" | "css" | "json";
  content: string;
}

interface ConsoleMessage {
  type: "log" | "error" | "warn" | "info" | "result";
  content: string;
  timestamp: Date;
}

// Language configurations
const LANGUAGE_CONFIG = {
  javascript: {
    name: "JavaScript",
    icon: FileCode,
    extension: ".js",
    color: "#f7df1e",
    defaultContent: `// JavaScript Sandbox
// Écrivez votre code ici et cliquez sur Exécuter

function greeting(name) {
  return \`Bonjour, \${name} !\`;
}

console.log(greeting("Monde"));

// Exemples d'utilisation de la console
console.log("Message normal");
console.warn("Attention !");
console.error("Erreur simulée");
console.info("Information");

// Calcul
const result = [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0);
console.log("Somme:", result);
`,
  },
  python: {
    name: "Python",
    icon: FileCode,
    extension: ".py",
    color: "#3776ab",
    defaultContent: `# Python Sandbox (utilise Pyodide)
# Écrivez votre code Python ici

def greeting(name):
    return f"Bonjour, {name} !"

print(greeting("Monde"))

# Calculs
numbers = [1, 2, 3, 4, 5]
print("Somme:", sum(numbers))
print("Moyenne:", sum(numbers) / len(numbers))

# Manipulation de données
data = {"nom": "Alice", "age": 25, "ville": "Paris"}
for key, value in data.items():
    print(f"{key}: {value}")
`,
  },
  html: {
    name: "HTML",
    icon: FileType,
    extension: ".html",
    color: "#e34c26",
    defaultContent: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ma Page</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      margin: 0;
      color: white;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; }
    p { font-size: 1.2em; opacity: 0.9; }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      font-size: 1em;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 20px;
    }
    button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Hello Sandbox!</h1>
    <p>Modifiez ce HTML et voyez le résultat en temps réel.</p>
    <button onclick="alert('Ça marche !')">Cliquez-moi</button>
  </div>
</body>
</html>
`,
  },
  css: {
    name: "CSS",
    icon: FileType,
    extension: ".css",
    color: "#264de4",
    defaultContent: `/* CSS Sandbox
   Ce CSS sera appliqué à l'aperçu HTML */

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #1a1a2e;
  color: #eee;
  padding: 2rem;
  margin: 0;
  min-height: 100vh;
}

.example {
  background: #16213e;
  border: 2px solid #0f3460;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
}

.example h2 {
  color: #e94560;
  margin-top: 0;
}

.example p {
  color: #a0a0a0;
  line-height: 1.6;
}

.btn {
  background: #e94560;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn:hover {
  background: #ff6b6b;
  transform: translateY(-2px);
}
`,
  },
  json: {
    name: "JSON",
    icon: FileJson,
    extension: ".json",
    color: "#000000",
    defaultContent: `{
  "name": "Code Sandbox",
  "version": "1.0.0",
  "description": "Un bac à sable pour tester du code",
  "features": [
    "JavaScript",
    "Python",
    "HTML",
    "CSS",
    "JSON"
  ],
  "config": {
    "autoRun": false,
    "theme": "dark",
    "fontSize": 14
  },
  "examples": {
    "numbers": [1, 2, 3, 4, 5],
    "nested": {
      "level1": {
        "level2": {
          "value": "deeply nested"
        }
      }
    }
  }
}
`,
  },
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function CodeSandboxPage() {
  // State
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: generateId(),
      name: "main.js",
      language: "javascript",
      content: LANGUAGE_CONFIG.javascript.defaultContent,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pyodideRef = useRef<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        newMenuRef.current &&
        !newMenuRef.current.contains(e.target as Node)
      ) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load Pyodide
  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || isPyodideLoading) return;

    setIsPyodideLoading(true);
    addConsoleMessage("info", "Chargement de Python (Pyodide)...");

    try {
      // Load Pyodide script
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      script.async = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });

      // Initialize Pyodide
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });

      pyodideRef.current = pyodide;
      setIsPyodideReady(true);
      addConsoleMessage("info", "Python prêt !");
    } catch (error) {
      addConsoleMessage("error", `Erreur de chargement Pyodide: ${error}`);
    } finally {
      setIsPyodideLoading(false);
    }
  }, [isPyodideLoading]);

  // Add console message
  const addConsoleMessage = useCallback(
    (type: ConsoleMessage["type"], content: string) => {
      setConsoleMessages((prev) => [
        ...prev,
        { type, content, timestamp: new Date() },
      ]);
    },
    []
  );

  // Clear console
  const clearConsole = useCallback(() => {
    setConsoleMessages([]);
  }, []);

  // Format value for console
  const formatValue = useCallback((value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }, []);

  // Run JavaScript
  const runJavaScript = useCallback(
    (code: string) => {
      clearConsole();
      addConsoleMessage("info", "Exécution JavaScript...");

      // Create custom console
      const customConsole = {
        log: (...args: unknown[]) =>
          addConsoleMessage(
            "log",
            args.map((a) => formatValue(a)).join(" ")
          ),
        error: (...args: unknown[]) =>
          addConsoleMessage(
            "error",
            args.map((a) => formatValue(a)).join(" ")
          ),
        warn: (...args: unknown[]) =>
          addConsoleMessage(
            "warn",
            args.map((a) => formatValue(a)).join(" ")
          ),
        info: (...args: unknown[]) =>
          addConsoleMessage(
            "info",
            args.map((a) => formatValue(a)).join(" ")
          ),
      };

      try {
        // Create function with custom console
        const fn = new Function(
          "console",
          `
          "use strict";
          ${code}
        `
        );
        const result = fn(customConsole);
        if (result !== undefined) {
          addConsoleMessage("result", `→ ${formatValue(result)}`);
        }
      } catch (error) {
        addConsoleMessage("error", `${error}`);
      }
    },
    [addConsoleMessage, clearConsole, formatValue]
  );

  // Run Python
  const runPython = useCallback(
    async (code: string) => {
      if (!pyodideRef.current) {
        await loadPyodide();
        if (!pyodideRef.current) {
          addConsoleMessage("error", "Pyodide non disponible");
          return;
        }
      }

      clearConsole();
      addConsoleMessage("info", "Exécution Python...");

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pyodide = pyodideRef.current as any;

        // Redirect stdout
        pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
        `);

        // Run code
        await pyodide.runPythonAsync(code);

        // Get output
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        const stderr = pyodide.runPython("sys.stderr.getvalue()");

        if (stdout) {
          stdout.split("\n").forEach((line: string) => {
            if (line) addConsoleMessage("log", line);
          });
        }
        if (stderr) {
          stderr.split("\n").forEach((line: string) => {
            if (line) addConsoleMessage("error", line);
          });
        }
      } catch (error) {
        addConsoleMessage("error", `${error}`);
      }
    },
    [loadPyodide, addConsoleMessage, clearConsole]
  );

  // Run HTML/CSS preview
  const runHTMLPreview = useCallback(
    (currentTabs?: Tab[]) => {
      if (!iframeRef.current) return;

      const tabsToUse = currentTabs || tabs;

      // Find HTML and CSS tabs
      const htmlTab = tabsToUse.find((t) => t.language === "html");
      const cssTabs = tabsToUse.filter((t) => t.language === "css");

      if (!htmlTab) {
        // No HTML tab, show placeholder
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
            <head><style>
              body {
                font-family: system-ui, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
                color: #666;
              }
            </style></head>
            <body>
              <div style="text-align: center;">
                <p>Créez un fichier HTML pour voir l'aperçu</p>
              </div>
            </body>
            </html>
          `);
          doc.close();
        }
        return;
      }

      let htmlContent = htmlTab.content;

      // Inject CSS if separate and HTML doesn't have closing </head>
      if (cssTabs.length > 0) {
        const cssContent = cssTabs.map((t) => t.content).join("\n");
        if (htmlContent.includes("</head>")) {
          htmlContent = htmlContent.replace(
            "</head>",
            `<style>${cssContent}</style></head>`
          );
        } else if (htmlContent.includes("<head>")) {
          htmlContent = htmlContent.replace(
            "<head>",
            `<head><style>${cssContent}</style>`
          );
        } else {
          // No head tag, add style at the beginning
          htmlContent = `<style>${cssContent}</style>${htmlContent}`;
        }
      }

      // Write to iframe
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    },
    [tabs]
  );

  // Validate JSON
  const validateJSON = useCallback(
    (code: string) => {
      clearConsole();
      addConsoleMessage("info", "Validation JSON...");

      try {
        const parsed = JSON.parse(code);
        addConsoleMessage("log", "✓ JSON valide");
        addConsoleMessage(
          "result",
          `Structure: ${typeof parsed === "object" ? (Array.isArray(parsed) ? "Array" : "Object") : typeof parsed}`
        );

        if (typeof parsed === "object" && parsed !== null) {
          const keys = Object.keys(parsed);
          addConsoleMessage("info", `Clés: ${keys.length}`);
          if (keys.length <= 10) {
            keys.forEach((key) => {
              addConsoleMessage(
                "log",
                `  - ${key}: ${typeof (parsed as Record<string, unknown>)[key]}`
              );
            });
          }
        }
      } catch (error) {
        addConsoleMessage("error", `JSON invalide: ${error}`);
      }
    },
    [addConsoleMessage, clearConsole]
  );

  // Run code
  const runCode = useCallback(async () => {
    setIsRunning(true);

    try {
      switch (activeTab.language) {
        case "javascript":
          runJavaScript(activeTab.content);
          break;
        case "python":
          await runPython(activeTab.content);
          break;
        case "html":
        case "css":
          runHTMLPreview(tabs);
          addConsoleMessage("info", "Aperçu mis à jour");
          break;
        case "json":
          validateJSON(activeTab.content);
          break;
      }
    } finally {
      setIsRunning(false);
    }
  }, [
    activeTab,
    tabs,
    runJavaScript,
    runPython,
    runHTMLPreview,
    validateJSON,
    addConsoleMessage,
  ]);

  // Tab management
  const addTab = useCallback((language: Tab["language"]) => {
    const config = LANGUAGE_CONFIG[language];
    const id = generateId();
    const newTab: Tab = {
      id,
      name: `untitled${config.extension}`,
      language,
      content: config.defaultContent,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
    setShowNewMenu(false);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      if (tabs.length === 1) return;

      const index = tabs.findIndex((t) => t.id === id);
      setTabs((prev) => prev.filter((t) => t.id !== id));

      if (activeTabId === id) {
        const newIndex = Math.max(0, index - 1);
        setActiveTabId(tabs[newIndex === index ? newIndex + 1 : newIndex]?.id);
      }
    },
    [tabs, activeTabId]
  );

  const updateTabContent = useCallback((id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content } : t))
    );
  }, []);

  const renameTab = useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }, []);

  // File operations
  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const ext = file.name.split(".").pop()?.toLowerCase();

        let language: Tab["language"] = "javascript";
        if (ext === "py") language = "python";
        else if (ext === "html" || ext === "htm") language = "html";
        else if (ext === "css") language = "css";
        else if (ext === "json") language = "json";

        const id = generateId();
        const newTab: Tab = {
          id,
          name: file.name,
          language,
          content,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(id);
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    []
  );

  const exportFile = useCallback(() => {
    const config = LANGUAGE_CONFIG[activeTab.language];
    const blob = new Blob([activeTab.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeTab.name || `code${config.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTab]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(activeTab.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeTab.content]);

  // Auto-preview for HTML/CSS
  useEffect(() => {
    if (activeTab.language === "html" || activeTab.language === "css") {
      const timer = setTimeout(() => {
        runHTMLPreview(tabs);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [tabs, activeTab.language, runHTMLPreview]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        exportFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runCode, exportFile]);

  const IconComponent = LANGUAGE_CONFIG[activeTab.language].icon;

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      <div className="container mx-auto px-4 py-6 max-w-[1800px]">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux outils
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Code Sandbox</h1>
                <p className="text-sm text-zinc-400">
                  Testez JavaScript, Python, HTML, CSS et JSON en temps réel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPyodideReady && (
                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1">
                  Python prêt
                </span>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-zinc-800 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Editor Panel */}
          <div className="border border-zinc-800 overflow-hidden bg-zinc-900">
            {/* Toolbar */}
            <div className="border-b border-zinc-800 bg-zinc-900/50 p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={runCode}
                  disabled={isRunning || isPyodideLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Exécuter
                </button>

                {/* New file dropdown */}
                <div className="relative" ref={newMenuRef}>
                  <button
                    onClick={() => setShowNewMenu(!showNewMenu)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showNewMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 z-50 min-w-[140px]">
                      {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => addTab(key as Tab["language"])}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <config.icon
                            className="w-4 h-4"
                            style={{ color: config.color }}
                          />
                          {config.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".js,.py,.html,.htm,.css,.json,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-zinc-700 transition-colors"
                  title="Importer un fichier"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={exportFile}
                  className="p-2 hover:bg-zinc-700 transition-colors"
                  title="Télécharger (Ctrl+S)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-zinc-700 transition-colors"
                  title="Copier"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-800 bg-zinc-900/30 flex items-center overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = LANGUAGE_CONFIG[tab.language].icon;
                const config = LANGUAGE_CONFIG[tab.language];
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-2 px-3 py-2 border-r border-zinc-800 cursor-pointer group hover:bg-zinc-800/50 min-w-fit ${
                      tab.id === activeTabId
                        ? "bg-zinc-800 border-b-2 border-b-blue-500"
                        : ""
                    }`}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <TabIcon
                      className="w-4 h-4"
                      style={{ color: config.color }}
                    />
                    <input
                      type="text"
                      value={tab.name}
                      onChange={(e) => renameTab(tab.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent border-none outline-none text-sm w-24 focus:ring-1 focus:ring-blue-500 px-1"
                    />
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Editor */}
            <div className="relative">
              <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400">
                <IconComponent
                  className="w-3 h-3"
                  style={{ color: LANGUAGE_CONFIG[activeTab.language].color }}
                />
                {LANGUAGE_CONFIG[activeTab.language].name}
              </div>
              <textarea
                ref={textareaRef}
                value={activeTab.content}
                onChange={(e) => updateTabContent(activeTabId, e.target.value)}
                className="w-full h-[400px] p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none outline-none border-none"
                spellCheck={false}
                placeholder="Écrivez votre code ici..."
              />
            </div>

            {/* Console */}
            <div className="border-t border-zinc-800">
              <div
                className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800/50"
                onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm font-medium">Console</span>
                  {consoleMessages.length > 0 && (
                    <span className="bg-blue-600/30 text-blue-400 text-xs px-2 py-0.5">
                      {consoleMessages.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearConsole();
                    }}
                    className="p-1 hover:bg-zinc-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {isConsoleExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </div>

              {isConsoleExpanded && (
                <div className="h-[200px] overflow-auto bg-[#1e1e1e] p-3 font-mono text-sm">
                  {consoleMessages.length === 0 ? (
                    <div className="text-zinc-500 text-center py-8">
                      La console est vide. Exécutez du code pour voir les
                      résultats.
                    </div>
                  ) : (
                    consoleMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`py-1 px-2 border-l-2 mb-1 ${
                          msg.type === "error"
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : msg.type === "warn"
                              ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                              : msg.type === "info"
                                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                : msg.type === "result"
                                  ? "border-green-500 bg-green-500/10 text-green-400"
                                  : "border-zinc-600 text-zinc-300"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap break-all">
                          {msg.content}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="border border-zinc-800 overflow-hidden bg-zinc-900">
            <div className="border-b border-zinc-800 bg-zinc-900/50 p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span className="text-sm font-medium">Aperçu</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-2 py-1 text-xs hover:bg-zinc-700"
                >
                  {showPreview ? "Masquer" : "Afficher"}
                </button>
                <button
                  onClick={() => runHTMLPreview(tabs)}
                  className="p-1 hover:bg-zinc-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showPreview && (
              <iframe
                ref={iframeRef}
                className="w-full h-[calc(100%-48px)] min-h-[600px] bg-white"
                sandbox="allow-scripts allow-modals"
                title="Preview"
              />
            )}

            {!showPreview && (
              <div className="flex items-center justify-center h-[600px] text-zinc-500">
                <div className="text-center">
                  <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aperçu masqué</p>
                  <button
                    className="mt-4 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-sm"
                    onClick={() => setShowPreview(true)}
                  >
                    Afficher l&apos;aperçu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 border border-zinc-800 bg-zinc-900/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Raccourcis clavier
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <kbd className="px-2 py-1 bg-zinc-800 text-xs font-mono">
                Ctrl + Enter
              </kbd>
              <span className="ml-2 text-zinc-400">Exécuter</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-zinc-800 text-xs font-mono">
                Ctrl + S
              </kbd>
              <span className="ml-2 text-zinc-400">Télécharger</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-zinc-800 text-xs font-mono">Tab</kbd>
              <span className="ml-2 text-zinc-400">Indentation</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-zinc-800 text-xs font-mono">
                Ctrl + /
              </kbd>
              <span className="ml-2 text-zinc-400">Commenter</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zinc-400">
            <div className="flex items-start gap-2">
              <FileCode className="w-4 h-4 mt-0.5 text-yellow-500" />
              <span>
                <strong className="text-white">JavaScript:</strong> Exécution
                instantanée avec console personnalisée
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileCode className="w-4 h-4 mt-0.5 text-blue-500" />
              <span>
                <strong className="text-white">Python:</strong> Exécuté via
                Pyodide (premier chargement ~10s)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileType className="w-4 h-4 mt-0.5 text-orange-500" />
              <span>
                <strong className="text-white">HTML/CSS:</strong> Aperçu en
                temps réel dans l&apos;iframe
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
