"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, FileSpreadsheet, Copy, Check, Download, ArrowLeftRight, Upload, Table, Braces } from "lucide-react";
import Link from "next/link";

type Mode = "csv-to-json" | "json-to-csv";

export default function CsvJsonPage() {
  const [mode, setMode] = useState<Mode>("csv-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeaders, setHasHeaders] = useState(true);

  const parseCSV = useCallback((csv: string, delim: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const nextChar = csv[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentCell += '"';
            i++; // Skip next quote
          } else {
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delim) {
          currentRow.push(currentCell.trim());
          currentCell = "";
        } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
          currentRow.push(currentCell.trim());
          if (currentRow.some(cell => cell !== "")) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = "";
          if (char === "\r") i++; // Skip \n after \r
        } else if (char !== "\r") {
          currentCell += char;
        }
      }
    }

    // Handle last cell/row
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== "")) {
      rows.push(currentRow);
    }

    return rows;
  }, []);

  const csvToJson = useCallback((csv: string): string => {
    const rows = parseCSV(csv, delimiter);

    if (rows.length === 0) {
      return "[]";
    }

    if (hasHeaders && rows.length > 0) {
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });
      return JSON.stringify(data, null, 2);
    } else {
      return JSON.stringify(rows, null, 2);
    }
  }, [delimiter, hasHeaders, parseCSV]);

  const jsonToCsv = useCallback((json: string): string => {
    const data = JSON.parse(json);

    if (!Array.isArray(data)) {
      throw new Error("Le JSON doit être un tableau");
    }

    if (data.length === 0) {
      return "";
    }

    // Check if it's array of objects or array of arrays
    if (typeof data[0] === "object" && !Array.isArray(data[0])) {
      // Array of objects
      const headers = Object.keys(data[0]);
      const rows = data.map(row => {
        return headers.map(header => {
          const value = String(row[header] ?? "");
          // Escape quotes and wrap in quotes if necessary
          if (value.includes(delimiter) || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(delimiter);
      });

      if (hasHeaders) {
        return [headers.join(delimiter), ...rows].join("\n");
      }
      return rows.join("\n");
    } else if (Array.isArray(data[0])) {
      // Array of arrays
      return data.map(row => {
        return (row as string[]).map(cell => {
          const value = String(cell ?? "");
          if (value.includes(delimiter) || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(delimiter);
      }).join("\n");
    } else {
      throw new Error("Format JSON non supporté");
    }
  }, [delimiter, hasHeaders]);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError("Veuillez entrer des données à convertir");
      setOutput("");
      return;
    }

    setError("");

    try {
      if (mode === "csv-to-json") {
        setOutput(csvToJson(input));
      } else {
        setOutput(jsonToCsv(input));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la conversion");
      setOutput("");
    }
  }, [input, mode, csvToJson, jsonToCsv]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInput(event.target?.result as string);
      setOutput("");
      setError("");
    };
    reader.readAsText(file);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const extension = mode === "csv-to-json" ? "json" : "csv";
    const mimeType = mode === "csv-to-json" ? "application/json" : "text/csv";

    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const swapMode = () => {
    setMode(mode === "csv-to-json" ? "json-to-csv" : "csv-to-json");
    setInput(output);
    setOutput("");
    setError("");
  };

  const loadSample = () => {
    if (mode === "csv-to-json") {
      setInput(`nom,email,age,ville
Alice Dupont,alice@example.com,28,Paris
Bob Martin,bob@example.com,35,Lyon
Charlie Durand,charlie@example.com,42,Marseille
Diana Bernard,diana@example.com,31,Bordeaux`);
    } else {
      setInput(`[
  {
    "nom": "Alice Dupont",
    "email": "alice@example.com",
    "age": 28,
    "ville": "Paris"
  },
  {
    "nom": "Bob Martin",
    "email": "bob@example.com",
    "age": 35,
    "ville": "Lyon"
  },
  {
    "nom": "Charlie Durand",
    "email": "charlie@example.com",
    "age": 42,
    "ville": "Marseille"
  }
]`);
    }
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
            <div className="w-10 h-10 bg-teal-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">CSV ↔ JSON Converter</h1>
              <p className="text-sm text-zinc-500">Conversion bidirectionnelle CSV et JSON</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode("csv-to-json");
              setInput("");
              setOutput("");
              setError("");
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border transition-colors ${
              mode === "csv-to-json"
                ? "bg-teal-500/20 border-teal-500 text-teal-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <Table className="w-4 h-4" />
            CSV → JSON
            <Braces className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setMode("json-to-csv");
              setInput("");
              setOutput("");
              setError("");
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border transition-colors ${
              mode === "json-to-csv"
                ? "bg-teal-500/20 border-teal-500 text-teal-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <Braces className="w-4 h-4" />
            JSON → CSV
            <Table className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">Délimiteur :</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 px-3 py-1 text-sm text-zinc-100 focus:outline-none"
            >
              <option value=",">Virgule (,)</option>
              <option value=";">Point-virgule (;)</option>
              <option value="\t">Tabulation</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={(e) => setHasHeaders(e.target.checked)}
              className="accent-teal-500"
            />
            Première ligne = en-têtes
          </label>
          <div className="flex-1" />
          <label className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Importer fichier
            <input
              type="file"
              accept={mode === "csv-to-json" ? ".csv,.txt" : ".json"}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={loadSample}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            Exemple
          </button>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">
            {mode === "csv-to-json" ? "Données CSV" : "Données JSON"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "csv-to-json"
                ? "Collez vos données CSV ici...\nnom,email,age\nAlice,alice@example.com,28"
                : 'Collez votre JSON ici...\n[{"nom": "Alice", "email": "alice@example.com"}]'
            }
            className="w-full h-48 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
          />
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center justify-center gap-2 transition-colors mb-6"
        >
          <ArrowLeftRight className="w-5 h-5" />
          Convertir
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
              <span className="text-sm text-zinc-400">
                Résultat {mode === "csv-to-json" ? "JSON" : "CSV"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={swapMode}
                  className="px-3 py-1 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Inverser
                </button>
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
            <pre className="p-4 text-sm font-mono text-teal-300 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
              {output}
            </pre>
          </div>
        )}

        {/* Stats */}
        {output && (
          <div className="mt-4 flex gap-6 text-sm text-zinc-500">
            <span>
              {mode === "csv-to-json"
                ? `${(JSON.parse(output) as unknown[]).length} enregistrements`
                : `${output.split("\n").length} lignes`}
            </span>
            <span>{new Blob([output]).size} octets</span>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Guide d&apos;utilisation</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-teal-400 mb-2">CSV → JSON</h4>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li>• Convertit les données tabulaires en tableau JSON</li>
                <li>• La première ligne devient les clés des objets</li>
                <li>• Supporte les valeurs avec guillemets et virgules</li>
                <li>• Choisissez le délimiteur adapté à vos données</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-teal-400 mb-2">JSON → CSV</h4>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li>• Convertit un tableau d&apos;objets en CSV</li>
                <li>• Les clés du premier objet deviennent les en-têtes</li>
                <li>• Échappe automatiquement les caractères spéciaux</li>
                <li>• Supporte les tableaux de tableaux</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
