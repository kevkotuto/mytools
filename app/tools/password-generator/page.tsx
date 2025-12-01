"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Download,
  Lock,
} from "lucide-react";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  excludeSimilar: boolean;
  customExclude: string;
  includeCustom: string;
  beginWithLetter: boolean;
  noConsecutive: boolean;
  noRepeating: boolean;
}

type PasswordStrength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

const defaultOptions: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
  excludeSimilar: false,
  customExclude: "",
  includeCustom: "",
  beginWithLetter: false,
  noConsecutive: false,
  noRepeating: false,
};

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "{}[]()/\\'\"`~,;:.<>";
const SIMILAR = "il1Lo0O";

const strengthLabels: Record<PasswordStrength, { label: string; color: string }> = {
  "very-weak": { label: "Très faible", color: "bg-red-500" },
  weak: { label: "Faible", color: "bg-orange-500" },
  fair: { label: "Moyen", color: "bg-yellow-500" },
  strong: { label: "Fort", color: "bg-green-500" },
  "very-strong": { label: "Très fort", color: "bg-emerald-500" },
};

export default function PasswordGeneratorPage() {
  const [options, setOptions] = useState<PasswordOptions>(defaultOptions);
  const [password, setPassword] = useState("");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [generateCount, setGenerateCount] = useState(1);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseWords, setPassphraseWords] = useState(4);
  const [passphraseSeparator, setPassphraseSeparator] = useState("-");
  const [passphraseCapitalize, setPassphraseCapitalize] = useState(true);
  const [passphraseNumbers, setPassphraseNumbers] = useState(false);

  const wordList = useMemo(
    () => [
      "apple", "brave", "cloud", "dance", "eagle", "flame", "grape", "house", "ivory", "jolly",
      "knife", "lemon", "maple", "noble", "ocean", "peace", "queen", "river", "storm", "tiger",
      "ultra", "vivid", "water", "xenon", "yacht", "zebra", "amber", "beach", "chair", "dream",
      "earth", "frost", "giant", "happy", "image", "judge", "kite", "light", "magic", "night",
      "orbit", "piano", "quiet", "radar", "smart", "train", "unity", "voice", "world", "young",
      "alpha", "basic", "candy", "delta", "elite", "focus", "gamma", "heart", "input", "joint",
      "karma", "lunar", "metal", "north", "oxide", "power", "quest", "royal", "solid", "turbo",
      "urban", "vital", "white", "extra", "youth", "zonal", "angel", "blank", "coral", "depth",
      "event", "field", "glass", "honey", "ideal", "juice", "known", "laser", "model", "novel",
      "olive", "pixel", "quick", "realm", "shell", "tower", "under", "valve", "whale", "xenial",
    ],
    []
  );

  const buildCharset = useCallback(() => {
    let charset = "";

    if (options.uppercase) charset += UPPERCASE;
    if (options.lowercase) charset += LOWERCASE;
    if (options.numbers) charset += NUMBERS;
    if (options.symbols) charset += SYMBOLS;
    if (options.includeCustom) charset += options.includeCustom;

    // Remove excluded characters
    if (options.excludeAmbiguous) {
      charset = charset.split("").filter((c) => !AMBIGUOUS.includes(c)).join("");
    }
    if (options.excludeSimilar) {
      charset = charset.split("").filter((c) => !SIMILAR.includes(c)).join("");
    }
    if (options.customExclude) {
      charset = charset.split("").filter((c) => !options.customExclude.includes(c)).join("");
    }

    // Remove duplicates
    charset = [...new Set(charset)].join("");

    return charset;
  }, [options]);

  const generatePassword = useCallback(() => {
    const charset = buildCharset();
    if (!charset) return "";

    let result = "";
    const array = new Uint32Array(options.length * 2);
    crypto.getRandomValues(array);

    let arrayIndex = 0;

    // Start with letter if required
    if (options.beginWithLetter && (options.uppercase || options.lowercase)) {
      let letters = "";
      if (options.uppercase) letters += UPPERCASE;
      if (options.lowercase) letters += LOWERCASE;
      if (options.excludeSimilar) {
        letters = letters.split("").filter((c) => !SIMILAR.includes(c)).join("");
      }
      result += letters[array[arrayIndex++] % letters.length];
    }

    while (result.length < options.length) {
      const char = charset[array[arrayIndex++] % charset.length];

      // Check no consecutive
      if (options.noConsecutive && result.length > 0) {
        if (char === result[result.length - 1]) continue;
      }

      // Check no repeating
      if (options.noRepeating && result.includes(char)) continue;

      result += char;

      // Prevent infinite loop
      if (arrayIndex >= array.length) {
        crypto.getRandomValues(array);
        arrayIndex = 0;
      }
    }

    return result;
  }, [buildCharset, options]);

  const generatePassphrase = useCallback(() => {
    const words: string[] = [];
    const array = new Uint32Array(passphraseWords);
    crypto.getRandomValues(array);

    for (let i = 0; i < passphraseWords; i++) {
      let word = wordList[array[i] % wordList.length];
      if (passphraseCapitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (passphraseNumbers && i === passphraseWords - 1) {
        word += Math.floor(Math.random() * 100);
      }
      words.push(word);
    }

    return words.join(passphraseSeparator);
  }, [wordList, passphraseWords, passphraseSeparator, passphraseCapitalize, passphraseNumbers]);

  const calculateStrength = useCallback((pwd: string): { strength: PasswordStrength; score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    // Length scoring
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (pwd.length >= 20) score += 1;

    // Character type scoring
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 2;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(pwd)) {
      score -= 1;
      feedback.push("Évitez les caractères répétés");
    }
    if (/^[a-zA-Z]+$/.test(pwd)) {
      score -= 1;
      feedback.push("Ajoutez des chiffres ou symboles");
    }
    if (/^[0-9]+$/.test(pwd)) {
      score -= 2;
      feedback.push("Ajoutez des lettres");
    }

    // Common patterns
    const commonPatterns = ["123", "abc", "qwerty", "password", "admin", "111", "000"];
    for (const pattern of commonPatterns) {
      if (pwd.toLowerCase().includes(pattern)) {
        score -= 2;
        feedback.push("Évitez les séquences communes");
        break;
      }
    }

    // Calculate entropy bonus
    const charsetSize = buildCharset().length;
    const entropy = pwd.length * Math.log2(charsetSize || 1);
    if (entropy > 60) score += 2;
    else if (entropy > 40) score += 1;

    // Determine strength
    let strength: PasswordStrength;
    if (score <= 2) strength = "very-weak";
    else if (score <= 4) strength = "weak";
    else if (score <= 6) strength = "fair";
    else if (score <= 8) strength = "strong";
    else strength = "very-strong";

    if (pwd.length < 8) feedback.push("Utilisez au moins 8 caractères");
    if (!/[A-Z]/.test(pwd)) feedback.push("Ajoutez des majuscules");
    if (!/[0-9]/.test(pwd)) feedback.push("Ajoutez des chiffres");
    if (!/[^a-zA-Z0-9]/.test(pwd)) feedback.push("Ajoutez des symboles");

    return { strength, score: Math.max(0, Math.min(10, score)), feedback };
  }, [buildCharset]);

  const passwordAnalysis = useMemo(() => {
    if (!password) return null;
    return calculateStrength(password);
  }, [password, calculateStrength]);

  const handleGenerate = () => {
    if (generateCount === 1) {
      setPassword(generatePassword());
      setPasswords([]);
    } else {
      const newPasswords: string[] = [];
      for (let i = 0; i < generateCount; i++) {
        newPasswords.push(generatePassword());
      }
      setPasswords(newPasswords);
      setPassword(newPasswords[0] || "");
    }
  };

  const handleGeneratePassphrase = () => {
    setPassphrase(generatePassphrase());
  };

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(index ?? -1);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadAll = () => {
    const content = passwords.length > 0 ? passwords.join("\n") : password;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "passwords.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate initial password
  useEffect(() => {
    handleGenerate();
  }, []);

  const StrengthIcon = passwordAnalysis?.strength === "very-strong" || passwordAnalysis?.strength === "strong"
    ? ShieldCheck
    : passwordAnalysis?.strength === "fair"
    ? Shield
    : ShieldAlert;

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
          <h1 className="text-3xl font-bold">Générateur de Mot de Passe</h1>
          <p className="mt-2 text-muted-foreground">
            Créez des mots de passe sécurisés et personnalisés ou des phrases secrètes mémorisables.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Password Display */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    readOnly
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-20 font-mono text-lg focus:outline-none"
                  />
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(password)}
                      className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {copied === -1 ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  className="rounded-lg border border-primary bg-primary px-4 py-3 text-primary-foreground transition-colors hover:opacity-90"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {/* Strength Meter */}
              {passwordAnalysis && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StrengthIcon className={`h-4 w-4 ${strengthLabels[passwordAnalysis.strength].color.replace("bg-", "text-")}`} />
                      <span className="text-sm font-medium">
                        {strengthLabels[passwordAnalysis.strength].label}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {passwordAnalysis.score}/10
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${strengthLabels[passwordAnalysis.strength].color}`}
                      style={{ width: `${passwordAnalysis.score * 10}%` }}
                    />
                  </div>
                  {passwordAnalysis.feedback.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {passwordAnalysis.feedback.slice(0, 2).map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">Options</h3>

              {/* Length */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm">Longueur</label>
                  <span className="text-sm font-medium">{options.length}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="128"
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>4</span>
                  <span>128</span>
                </div>
              </div>

              {/* Character Types */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                {[
                  { key: "uppercase", label: "Majuscules (A-Z)" },
                  { key: "lowercase", label: "Minuscules (a-z)" },
                  { key: "numbers", label: "Chiffres (0-9)" },
                  { key: "symbols", label: "Symboles (!@#$...)" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options[key as keyof PasswordOptions] as boolean}
                      onChange={(e) =>
                        setOptions({ ...options, [key]: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>

              {/* Advanced Options */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-medium text-muted-foreground">Options avancées</h4>
                {[
                  { key: "excludeAmbiguous", label: "Exclure les caractères ambigus ({}[]()...)" },
                  { key: "excludeSimilar", label: "Exclure les caractères similaires (il1Lo0O)" },
                  { key: "beginWithLetter", label: "Commencer par une lettre" },
                  { key: "noConsecutive", label: "Pas de caractères consécutifs identiques" },
                  { key: "noRepeating", label: "Pas de caractères répétés" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options[key as keyof PasswordOptions] as boolean}
                      onChange={(e) =>
                        setOptions({ ...options, [key]: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Exclure</label>
                    <input
                      type="text"
                      value={options.customExclude}
                      onChange={(e) => setOptions({ ...options, customExclude: e.target.value })}
                      placeholder="abc..."
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Inclure</label>
                    <input
                      type="text"
                      value={options.includeCustom}
                      onChange={(e) => setOptions({ ...options, includeCustom: e.target.value })}
                      placeholder="€£¥..."
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Generation */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">Génération en masse</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Nombre:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  Générer
                </button>
                {passwords.length > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </button>
                )}
              </div>

              {passwords.length > 1 && (
                <div className="mt-4 max-h-48 space-y-2 overflow-auto">
                  {passwords.map((pwd, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2">
                      <span className="flex-1 font-mono text-sm">{showPassword ? pwd : "•".repeat(pwd.length)}</span>
                      <button
                        onClick={() => copyToClipboard(pwd, i)}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        {copied === i ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Passphrase Generator */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4" />
                Phrase secrète
              </h3>

              <div className="mb-4">
                <input
                  type="text"
                  value={passphrase}
                  readOnly
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                  placeholder="Cliquez sur Générer"
                />
              </div>

              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Nombre de mots</label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={passphraseWords}
                    onChange={(e) => setPassphraseWords(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3</span>
                    <span>{passphraseWords}</span>
                    <span>10</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Séparateur</label>
                  <div className="flex gap-2">
                    {["-", "_", ".", " ", ""].map((sep) => (
                      <button
                        key={sep}
                        onClick={() => setPassphraseSeparator(sep)}
                        className={`flex-1 rounded border px-2 py-1 text-sm ${
                          passphraseSeparator === sep
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {sep || "∅"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={passphraseCapitalize}
                    onChange={(e) => setPassphraseCapitalize(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">Majuscules</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={passphraseNumbers}
                    onChange={(e) => setPassphraseNumbers(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">Ajouter des chiffres</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePassphrase}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  Générer
                </button>
                <button
                  onClick={() => copyToClipboard(passphrase)}
                  disabled={!passphrase}
                  className="rounded-lg border border-border bg-background px-4 py-2 transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Préréglages</h3>
              <div className="space-y-2">
                {[
                  { label: "Simple (8 car.)", options: { ...defaultOptions, length: 8, symbols: false } },
                  { label: "Standard (16 car.)", options: defaultOptions },
                  { label: "Fort (24 car.)", options: { ...defaultOptions, length: 24 } },
                  { label: "Maximum (32 car.)", options: { ...defaultOptions, length: 32 } },
                  { label: "PIN (4 chiffres)", options: { ...defaultOptions, length: 4, uppercase: false, lowercase: false, symbols: false } },
                  { label: "PIN (6 chiffres)", options: { ...defaultOptions, length: 6, uppercase: false, lowercase: false, symbols: false } },
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOptions(preset.options);
                      setTimeout(handleGenerate, 0);
                    }}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Conseils de sécurité</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• Utilisez au minimum 12 caractères</li>
                <li>• Mélangez majuscules, minuscules, chiffres et symboles</li>
                <li>• N&apos;utilisez jamais le même mot de passe deux fois</li>
                <li>• Utilisez un gestionnaire de mots de passe</li>
                <li>• Activez l&apos;authentification à deux facteurs</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
