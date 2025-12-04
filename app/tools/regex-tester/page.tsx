"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, Copy, Check, Flag, AlertTriangle, BookOpen, Zap } from "lucide-react";
import Link from "next/link";

interface Match {
  text: string;
  index: number;
  groups: string[];
}

interface RegexFlag {
  flag: string;
  name: string;
  description: string;
  enabled: boolean;
}

const commonPatterns = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", description: "Adresses email" },
  { name: "URL", pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", description: "URLs HTTP/HTTPS" },
  { name: "Téléphone FR", pattern: "(?:(?:\\+|00)33|0)\\s*[1-9](?:[\\s.-]*\\d{2}){4}", description: "Numéros français" },
  { name: "Date", pattern: "\\d{2}/\\d{2}/\\d{4}", description: "Format JJ/MM/AAAA" },
  { name: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", description: "Adresses IP v4" },
  { name: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", description: "Couleurs hexadécimales" },
  { name: "Code Postal", pattern: "\\b\\d{5}\\b", description: "Codes postaux français" },
  { name: "Mot", pattern: "\\b\\w+\\b", description: "Tous les mots" },
];

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState<RegexFlag[]>([
    { flag: "g", name: "Global", description: "Trouver toutes les correspondances", enabled: true },
    { flag: "i", name: "Insensible", description: "Ignorer la casse", enabled: false },
    { flag: "m", name: "Multiligne", description: "^ et $ pour chaque ligne", enabled: false },
    { flag: "s", name: "Dotall", description: ". correspond aussi aux sauts de ligne", enabled: false },
    { flag: "u", name: "Unicode", description: "Support Unicode complet", enabled: false },
  ]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [highlightedText, setHighlightedText] = useState<React.ReactNode>("");

  const activeFlags = useMemo(() => {
    return flags.filter((f) => f.enabled).map((f) => f.flag).join("");
  }, [flags]);

  const toggleFlag = (flag: string) => {
    setFlags(flags.map((f) =>
      f.flag === flag ? { ...f, enabled: !f.enabled } : f
    ));
  };

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError("");
      setHighlightedText(testString);
      return;
    }

    try {
      const regex = new RegExp(pattern, activeFlags);
      setError("");

      const foundMatches: Match[] = [];
      let match;

      if (activeFlags.includes("g")) {
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);

      // Build highlighted text
      if (foundMatches.length > 0 && testString) {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        foundMatches.forEach((m, i) => {
          if (m.index > lastIndex) {
            parts.push(
              <span key={`text-${i}`}>{testString.slice(lastIndex, m.index)}</span>
            );
          }
          parts.push(
            <mark key={`match-${i}`} className="bg-emerald-500/30 text-emerald-300 px-0.5">
              {m.text}
            </mark>
          );
          lastIndex = m.index + m.text.length;
        });

        if (lastIndex < testString.length) {
          parts.push(<span key="end">{testString.slice(lastIndex)}</span>);
        }

        setHighlightedText(<>{parts}</>);
      } else {
        setHighlightedText(testString);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Expression régulière invalide");
      setMatches([]);
      setHighlightedText(testString);
    }
  }, [pattern, testString, activeFlags]);

  const copyPattern = async () => {
    await navigator.clipboard.writeText(pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPattern = (p: string) => {
    setPattern(p);
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
            <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Regex Tester</h1>
              <p className="text-sm text-zinc-500">Testeur d&apos;expressions régulières</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Pattern Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-zinc-400">Expression régulière</label>
            <button
              onClick={copyPattern}
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <div className="flex items-center bg-zinc-900 border border-zinc-700 focus-within:border-zinc-500">
            <span className="px-3 text-zinc-500 font-mono">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Entrez votre regex ici..."
              className="flex-1 bg-transparent py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono"
            />
            <span className="px-3 text-zinc-500 font-mono">/{activeFlags}</span>
          </div>
        </div>

        {/* Flags */}
        <div className="mb-6">
          <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Options (flags)
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {flags.map((f) => (
              <button
                key={f.flag}
                onClick={() => toggleFlag(f.flag)}
                className={`px-3 py-2 border text-sm transition-colors ${
                  f.enabled
                    ? "bg-violet-500/20 border-violet-500 text-violet-400"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}
                title={f.description}
              >
                <span className="font-mono font-bold">{f.flag}</span>
                <span className="ml-2 hidden sm:inline">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-mono text-sm">{error}</span>
          </div>
        )}

        {/* Common Patterns */}
        <div className="mb-6">
          <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Patterns courants
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {commonPatterns.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPattern(p.pattern)}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                title={p.description}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Test String */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Texte de test
            </label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Entrez le texte à tester..."
              className="w-full h-64 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
            />
          </div>

          {/* Highlighted Result */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400">
                Résultat ({matches.length} correspondance{matches.length !== 1 ? "s" : ""})
              </label>
            </div>
            <div className="w-full h-64 bg-zinc-900 border border-zinc-700 px-4 py-3 overflow-auto font-mono text-sm whitespace-pre-wrap">
              {highlightedText || <span className="text-zinc-600">Le résultat apparaîtra ici...</span>}
            </div>
          </div>
        </div>

        {/* Matches Table */}
        {matches.length > 0 && (
          <div className="mt-6 bg-zinc-900 border border-zinc-800">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Détails des correspondances
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-zinc-500 font-medium">#</th>
                    <th className="px-4 py-3 text-left text-zinc-500 font-medium">Match</th>
                    <th className="px-4 py-3 text-left text-zinc-500 font-medium">Index</th>
                    <th className="px-4 py-3 text-left text-zinc-500 font-medium">Groupes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {matches.slice(0, 100).map((match, i) => (
                    <tr key={i} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{match.text}</td>
                      <td className="px-4 py-3 text-zinc-400">{match.index}</td>
                      <td className="px-4 py-3 font-mono text-amber-400">
                        {match.groups.length > 0
                          ? match.groups.map((g, j) => (
                              <span key={j} className="mr-2">
                                ${j + 1}: {g}
                              </span>
                            ))
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matches.length > 100 && (
                <div className="p-4 text-center text-sm text-zinc-500 border-t border-zinc-800">
                  Affichage limité aux 100 premières correspondances ({matches.length} au total)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cheat Sheet */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-medium">Aide-mémoire Regex</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 text-sm">
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Caractères</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-violet-400">.</span> - N&apos;importe quel caractère</li>
                <li><span className="text-violet-400">\d</span> - Chiffre [0-9]</li>
                <li><span className="text-violet-400">\w</span> - Mot [a-zA-Z0-9_]</li>
                <li><span className="text-violet-400">\s</span> - Espace blanc</li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Quantificateurs</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-violet-400">*</span> - 0 ou plus</li>
                <li><span className="text-violet-400">+</span> - 1 ou plus</li>
                <li><span className="text-violet-400">?</span> - 0 ou 1</li>
                <li><span className="text-violet-400">{"{n,m}"}</span> - Entre n et m</li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Ancres</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-violet-400">^</span> - Début de ligne</li>
                <li><span className="text-violet-400">$</span> - Fin de ligne</li>
                <li><span className="text-violet-400">\b</span> - Limite de mot</li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Groupes</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-violet-400">(abc)</span> - Groupe capturant</li>
                <li><span className="text-violet-400">(?:abc)</span> - Non-capturant</li>
                <li><span className="text-violet-400">[abc]</span> - Classe de caractères</li>
                <li><span className="text-violet-400">a|b</span> - Alternance</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
