"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Sparkles, Copy, Check, FileCode, Trash2, Download } from "lucide-react";
import Link from "next/link";

type Language = "javascript" | "json" | "css" | "html" | "sql";

export default function CodeBeautifierPage() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [useTabs, setUseTabs] = useState(false);

  const getIndent = useCallback((level: number): string => {
    const char = useTabs ? "\t" : " ".repeat(indentSize);
    return char.repeat(level);
  }, [indentSize, useTabs]);

  const beautifyJS = useCallback((code: string): string => {
    // Simple JS beautifier
    let result = "";
    let indentLevel = 0;
    let inString = false;
    let stringChar = "";
    let i = 0;

    // Remove existing formatting
    code = code.replace(/\s+/g, " ").trim();

    while (i < code.length) {
      const char = code[i];
      const nextChar = code[i + 1];

      // Handle strings
      if ((char === '"' || char === "'" || char === "`") && code[i - 1] !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      // Handle brackets
      if (char === "{" || char === "[" || char === "(") {
        result += char + "\n" + getIndent(++indentLevel);
        i++;
        continue;
      }

      if (char === "}" || char === "]" || char === ")") {
        result = result.trimEnd() + "\n" + getIndent(--indentLevel) + char;
        if (nextChar && nextChar !== "," && nextChar !== ";" && nextChar !== ")" && nextChar !== "]" && nextChar !== "}") {
          result += "\n" + getIndent(indentLevel);
        }
        i++;
        continue;
      }

      // Handle semicolons
      if (char === ";") {
        result += char + "\n" + getIndent(indentLevel);
        i++;
        continue;
      }

      // Handle commas
      if (char === ",") {
        result += char + "\n" + getIndent(indentLevel);
        i++;
        continue;
      }

      // Handle colons (in objects)
      if (char === ":") {
        result += char + " ";
        i++;
        continue;
      }

      // Skip extra spaces
      if (char === " " && (result.endsWith(" ") || result.endsWith("\n"))) {
        i++;
        continue;
      }

      result += char;
      i++;
    }

    return result.trim();
  }, [getIndent]);

  const beautifyJSON = useCallback((code: string): string => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, useTabs ? "\t" : indentSize);
    } catch (e) {
      throw new Error("JSON invalide: " + (e instanceof Error ? e.message : "erreur inconnue"));
    }
  }, [indentSize, useTabs]);

  const beautifyCSS = useCallback((code: string): string => {
    let result = "";
    let indentLevel = 0;

    // Remove existing formatting
    code = code.replace(/\s+/g, " ").trim();

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      if (char === "{") {
        result += " {\n" + getIndent(++indentLevel);
      } else if (char === "}") {
        result = result.trimEnd() + "\n" + getIndent(--indentLevel) + "}\n\n" + getIndent(indentLevel);
      } else if (char === ";") {
        result += ";\n" + getIndent(indentLevel);
      } else if (char === ":" && code[i + 1] !== ":") {
        result += ": ";
      } else if (char === "," && indentLevel === 0) {
        result += ",\n";
      } else if (char !== " " || !result.endsWith(" ") && !result.endsWith("\n") && !result.endsWith(": ")) {
        result += char;
      }
    }

    return result.trim();
  }, [getIndent]);

  const beautifyHTML = useCallback((code: string): string => {
    let result = "";
    let indentLevel = 0;
    const selfClosingTags = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"];

    // Remove existing formatting
    code = code.replace(/>\s+</g, "><").trim();

    let i = 0;
    while (i < code.length) {
      if (code[i] === "<") {
        const tagEnd = code.indexOf(">", i);
        if (tagEnd === -1) break;

        const fullTag = code.slice(i, tagEnd + 1);
        const tagMatch = fullTag.match(/<\/?(\w+)/);
        const tagName = tagMatch ? tagMatch[1].toLowerCase() : "";
        const isClosing = fullTag.startsWith("</");
        const isSelfClosing = fullTag.endsWith("/>") || selfClosingTags.includes(tagName);

        if (isClosing) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        if (result && !result.endsWith("\n")) {
          result += "\n";
        }
        result += getIndent(indentLevel) + fullTag;

        if (!isClosing && !isSelfClosing) {
          indentLevel++;
        }

        i = tagEnd + 1;
      } else {
        // Text content
        let textEnd = code.indexOf("<", i);
        if (textEnd === -1) textEnd = code.length;

        const text = code.slice(i, textEnd).trim();
        if (text) {
          if (!result.endsWith("\n")) result += "\n";
          result += getIndent(indentLevel) + text;
        }

        i = textEnd;
      }
    }

    return result.trim();
  }, [getIndent]);

  const beautifySQL = useCallback((code: string): string => {
    const keywords = [
      "SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY", "HAVING",
      "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "JOIN", "ON",
      "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
      "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "CREATE INDEX",
      "LIMIT", "OFFSET", "UNION", "UNION ALL", "AS", "DISTINCT",
      "IN", "NOT IN", "BETWEEN", "LIKE", "IS NULL", "IS NOT NULL"
    ];

    let result = code.toUpperCase();

    // Add newlines before main keywords
    const newlineKeywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY", "HAVING", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "ON", "LIMIT", "OFFSET", "UNION"];

    newlineKeywords.forEach(kw => {
      const regex = new RegExp(`\\s*\\b${kw}\\b`, "gi");
      result = result.replace(regex, `\n${kw}`);
    });

    // Indent after SELECT, before FROM
    result = result.replace(/SELECT\s+/gi, "SELECT\n" + getIndent(1));
    result = result.replace(/,\s*/g, ",\n" + getIndent(1));

    // Clean up
    result = result.replace(/\n\s*\n/g, "\n");
    result = result.trim();

    return result;
  }, [getIndent]);

  const handleBeautify = useCallback(() => {
    if (!input.trim()) {
      setError("Veuillez entrer du code à formater");
      setOutput("");
      return;
    }

    setError("");

    try {
      let beautified: string;

      switch (language) {
        case "javascript":
          beautified = beautifyJS(input);
          break;
        case "json":
          beautified = beautifyJSON(input);
          break;
        case "css":
          beautified = beautifyCSS(input);
          break;
        case "html":
          beautified = beautifyHTML(input);
          break;
        case "sql":
          beautified = beautifySQL(input);
          break;
        default:
          beautified = input;
      }

      setOutput(beautified);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du formatage");
      setOutput("");
    }
  }, [input, language, beautifyJS, beautifyJSON, beautifyCSS, beautifyHTML, beautifySQL]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const extensions: Record<Language, string> = {
      javascript: "js",
      json: "json",
      css: "css",
      html: "html",
      sql: "sql",
    };

    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted.${extensions[language]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    const samples: Record<Language, string> = {
      javascript: `function calculateTotal(items){const total=items.reduce((sum,item)=>{return sum+item.price*item.quantity;},0);return{total:total,itemCount:items.length,average:total/items.length};}const cart=[{name:"Apple",price:1.5,quantity:3},{name:"Banana",price:0.75,quantity:5}];console.log(calculateTotal(cart));`,
      json: `{"name":"MyTools","version":"1.0.0","description":"Collection of web tools","dependencies":{"react":"^18.0.0","next":"^14.0.0"},"scripts":{"dev":"next dev","build":"next build"}}`,
      css: `.container{max-width:1200px;margin:0 auto;padding:20px;}.header{display:flex;justify-content:space-between;align-items:center;background:#333;color:#fff;padding:1rem;}.button{background:#007bff;color:white;padding:10px 20px;border:none;cursor:pointer;}.button:hover{background:#0056b3;}`,
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Sample</title></head><body><div class="container"><header class="header"><h1>Title</h1><nav><a href="/">Home</a><a href="/about">About</a></nav></header><main><p>Content here</p></main></div></body></html>`,
      sql: `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_spent DESC LIMIT 10`,
    };

    setInput(samples[language]);
    setOutput("");
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
            <div className="w-10 h-10 bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Code Beautifier</h1>
              <p className="text-sm text-zinc-500">Formatage de code JS, JSON, CSS, HTML, SQL</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Language Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["javascript", "json", "css", "html", "sql"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOutput("");
                setError("");
              }}
              className={`px-4 py-2 border text-sm font-medium transition-colors ${
                language === lang
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">Indentation :</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              disabled={useTabs}
              className="bg-zinc-800 border border-zinc-700 px-3 py-1 text-sm text-zinc-100 focus:outline-none disabled:opacity-50"
            >
              <option value={2}>2 espaces</option>
              <option value={4}>4 espaces</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={useTabs}
              onChange={(e) => setUseTabs(e.target.checked)}
              className="accent-amber-500"
            />
            Utiliser des tabulations
          </label>
          <div className="flex-1" />
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
              setOutput("");
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
            Code {language.toUpperCase()} à formater
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Collez votre code ${language.toUpperCase()} ici...`}
            className="w-full h-48 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
          />
        </div>

        {/* Beautify Button */}
        <button
          onClick={handleBeautify}
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center justify-center gap-2 transition-colors mb-6"
        >
          <Sparkles className="w-5 h-5" />
          Formater le code
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <span className="text-sm text-zinc-400">Code formaté</span>
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
            <pre className="p-4 text-sm font-mono text-amber-300 overflow-x-auto max-h-96 overflow-y-auto">
              {output}
            </pre>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">À propos du Code Beautifier</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>JavaScript</strong> : Formate les fonctions, objets et structures de contrôle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>JSON</strong> : Valide et formate avec indentation propre</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>CSS</strong> : Formate les sélecteurs, propriétés et media queries</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>HTML</strong> : Indente les balises avec gestion des éléments auto-fermants</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>SQL</strong> : Formate les requêtes avec mots-clés en majuscules</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
