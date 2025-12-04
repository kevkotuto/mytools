"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, GitCompare, Copy, Check, ArrowLeftRight, Trash2, FileText } from "lucide-react";
import Link from "next/link";

interface DiffLine {
  type: "added" | "removed" | "unchanged" | "header";
  content: string;
  leftLineNum?: number;
  rightLineNum?: number;
}

export default function DiffCheckerPage() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [copied, setCopied] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);

  const computeDiff = useMemo(() => {
    let left = leftText;
    let right = rightText;

    if (ignoreCase) {
      left = left.toLowerCase();
      right = right.toLowerCase();
    }

    const leftLines = left.split("\n");
    const rightLines = right.split("\n");

    // Simple LCS-based diff algorithm
    const lcs = (a: string[], b: string[]): number[][] => {
      const m = a.length;
      const n = b.length;
      const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          let lineA = a[i - 1];
          let lineB = b[j - 1];

          if (ignoreWhitespace) {
            lineA = lineA.replace(/\s+/g, " ").trim();
            lineB = lineB.replace(/\s+/g, " ").trim();
          }

          if (lineA === lineB) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      return dp;
    };

    const backtrack = (dp: number[][], a: string[], b: string[]): DiffLine[] => {
      const result: DiffLine[] = [];
      let i = a.length;
      let j = b.length;
      let leftNum = a.length;
      let rightNum = b.length;

      const stack: DiffLine[] = [];

      while (i > 0 || j > 0) {
        let lineA = i > 0 ? a[i - 1] : "";
        let lineB = j > 0 ? b[j - 1] : "";

        if (ignoreWhitespace) {
          lineA = lineA.replace(/\s+/g, " ").trim();
          lineB = lineB.replace(/\s+/g, " ").trim();
        }

        if (i > 0 && j > 0 && lineA === lineB) {
          stack.push({
            type: "unchanged",
            content: a[i - 1], // Use original line
            leftLineNum: leftNum,
            rightLineNum: rightNum,
          });
          i--;
          j--;
          leftNum--;
          rightNum--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          stack.push({
            type: "added",
            content: b[j - 1],
            rightLineNum: rightNum,
          });
          j--;
          rightNum--;
        } else if (i > 0) {
          stack.push({
            type: "removed",
            content: a[i - 1],
            leftLineNum: leftNum,
          });
          i--;
          leftNum--;
        }
      }

      return stack.reverse();
    };

    const dp = lcs(leftLines, rightLines);
    return backtrack(dp, leftLines, rightLines);
  }, [leftText, rightText, ignoreWhitespace, ignoreCase]);

  const stats = useMemo(() => {
    const added = computeDiff.filter(l => l.type === "added").length;
    const removed = computeDiff.filter(l => l.type === "removed").length;
    const unchanged = computeDiff.filter(l => l.type === "unchanged").length;
    return { added, removed, unchanged };
  }, [computeDiff]);

  const copyDiff = async () => {
    const diffText = computeDiff.map(line => {
      switch (line.type) {
        case "added": return `+ ${line.content}`;
        case "removed": return `- ${line.content}`;
        default: return `  ${line.content}`;
      }
    }).join("\n");

    await navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapTexts = () => {
    const temp = leftText;
    setLeftText(rightText);
    setRightText(temp);
  };

  const clearAll = () => {
    setLeftText("");
    setRightText("");
  };

  const loadSample = () => {
    setLeftText(`function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const users = ["Alice", "Bob"];
users.forEach(greet);`);

    setRightText(`function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return true;
}

const users = ["Alice", "Bob", "Charlie"];
users.forEach(user => greet(user));`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Diff Checker</h1>
              <p className="text-sm text-zinc-500">Comparateur de texte et code</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="accent-orange-500"
              />
              Ignorer les espaces
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="accent-orange-500"
              />
              Ignorer la casse
            </label>
          </div>
          <div className="flex-1" />
          <button
            onClick={loadSample}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Exemple
          </button>
          <button
            onClick={swapTexts}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Inverser
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Effacer
          </button>
        </div>

        {/* Input Areas */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Texte original</label>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Collez le texte original ici..."
              className="w-full h-48 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Texte modifié</label>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Collez le texte modifié ici..."
              className="w-full h-48 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        {(leftText || rightText) && (
          <div className="flex items-center gap-6 mb-6 p-4 bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500"></span>
              <span className="text-sm text-zinc-400">
                <span className="font-mono text-emerald-400">{stats.added}</span> ajoutée{stats.added !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500"></span>
              <span className="text-sm text-zinc-400">
                <span className="font-mono text-red-400">{stats.removed}</span> supprimée{stats.removed !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-zinc-600"></span>
              <span className="text-sm text-zinc-400">
                <span className="font-mono text-zinc-300">{stats.unchanged}</span> inchangée{stats.unchanged !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={copyDiff}
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié" : "Copier le diff"}
            </button>
          </div>
        )}

        {/* Diff Output */}
        {computeDiff.length > 0 && (leftText || rightText) && (
          <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-medium">Différences</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <tbody>
                  {computeDiff.map((line, i) => (
                    <tr
                      key={i}
                      className={
                        line.type === "added"
                          ? "bg-emerald-500/10"
                          : line.type === "removed"
                          ? "bg-red-500/10"
                          : ""
                      }
                    >
                      <td className="w-12 px-3 py-1 text-right text-zinc-600 select-none border-r border-zinc-800">
                        {line.leftLineNum || ""}
                      </td>
                      <td className="w-12 px-3 py-1 text-right text-zinc-600 select-none border-r border-zinc-800">
                        {line.rightLineNum || ""}
                      </td>
                      <td className="w-8 px-2 py-1 text-center select-none border-r border-zinc-800">
                        {line.type === "added" && <span className="text-emerald-400">+</span>}
                        {line.type === "removed" && <span className="text-red-400">-</span>}
                      </td>
                      <td className="px-4 py-1 whitespace-pre">
                        <span
                          className={
                            line.type === "added"
                              ? "text-emerald-300"
                              : line.type === "removed"
                              ? "text-red-300"
                              : "text-zinc-400"
                          }
                        >
                          {line.content || " "}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!leftText && !rightText && (
          <div className="p-12 bg-zinc-900 border border-zinc-800 text-center">
            <GitCompare className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium mb-2">Comparez deux textes</h3>
            <p className="text-zinc-500 mb-4">
              Collez le texte original à gauche et le texte modifié à droite pour voir les différences.
            </p>
            <button
              onClick={loadSample}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white transition-colors"
            >
              Charger un exemple
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Comment utiliser le Diff Checker</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Collez le texte original dans le champ de gauche</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Collez le texte modifié dans le champ de droite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Les lignes en <span className="text-emerald-400">vert</span> ont été ajoutées</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Les lignes en <span className="text-red-400">rouge</span> ont été supprimées</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Utilisez les options pour ignorer les espaces ou la casse</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
