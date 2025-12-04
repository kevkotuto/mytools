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
type TabType = "options" | "passphrase" | "bulk";

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

const wordList = [
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
];

export default function PasswordGeneratorPage() {
  const [options, setOptions] = useState<PasswordOptions>(defaultOptions);
  const [password, setPassword] = useState("");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [generateCount, setGenerateCount] = useState(5);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseWords, setPassphraseWords] = useState(4);
  const [passphraseSeparator, setPassphraseSeparator] = useState("-");
  const [passphraseCapitalize, setPassphraseCapitalize] = useState(true);
  const [passphraseNumbers, setPassphraseNumbers] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("options");

  const buildCharset = useCallback(() => {
    let charset = "";
    if (options.uppercase) charset += UPPERCASE;
    if (options.lowercase) charset += LOWERCASE;
    if (options.numbers) charset += NUMBERS;
    if (options.symbols) charset += SYMBOLS;
    if (options.includeCustom) charset += options.includeCustom;

    if (options.excludeAmbiguous) {
      charset = charset.split("").filter((c) => !AMBIGUOUS.includes(c)).join("");
    }
    if (options.excludeSimilar) {
      charset = charset.split("").filter((c) => !SIMILAR.includes(c)).join("");
    }
    if (options.customExclude) {
      charset = charset.split("").filter((c) => !options.customExclude.includes(c)).join("");
    }

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

      if (options.noConsecutive && result.length > 0) {
        if (char === result[result.length - 1]) continue;
      }

      if (options.noRepeating && result.includes(char)) continue;

      result += char;

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
  }, [passphraseWords, passphraseSeparator, passphraseCapitalize, passphraseNumbers]);

  const calculateStrength = useCallback((pwd: string): { strength: PasswordStrength; score: number } => {
    let score = 0;

    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (pwd.length >= 20) score += 1;

    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 2;

    if (/(.)\1{2,}/.test(pwd)) score -= 1;
    if (/^[a-zA-Z]+$/.test(pwd)) score -= 1;
    if (/^[0-9]+$/.test(pwd)) score -= 2;

    const commonPatterns = ["123", "abc", "qwerty", "password", "admin", "111", "000"];
    for (const pattern of commonPatterns) {
      if (pwd.toLowerCase().includes(pattern)) {
        score -= 2;
        break;
      }
    }

    const charsetSize = buildCharset().length;
    const entropy = pwd.length * Math.log2(charsetSize || 1);
    if (entropy > 60) score += 2;
    else if (entropy > 40) score += 1;

    let strength: PasswordStrength;
    if (score <= 2) strength = "very-weak";
    else if (score <= 4) strength = "weak";
    else if (score <= 6) strength = "fair";
    else if (score <= 8) strength = "strong";
    else strength = "very-strong";

    return { strength, score: Math.max(0, Math.min(10, score)) };
  }, [buildCharset]);

  const passwordAnalysis = useMemo(() => {
    if (!password) return null;
    return calculateStrength(password);
  }, [password, calculateStrength]);

  const handleGenerate = () => {
    setPassword(generatePassword());
  };

  const handleGenerateBulk = () => {
    const newPasswords: string[] = [];
    for (let i = 0; i < generateCount; i++) {
      newPasswords.push(generatePassword());
    }
    setPasswords(newPasswords);
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
    const content = passwords.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "passwords.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const StrengthIcon = passwordAnalysis?.strength === "very-strong" || passwordAnalysis?.strength === "strong"
    ? ShieldCheck
    : passwordAnalysis?.strength === "fair"
    ? Shield
    : ShieldAlert;

  const applyPreset = (preset: Partial<PasswordOptions>) => {
    setOptions({ ...defaultOptions, ...preset });
    setTimeout(handleGenerate, 0);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header compact */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
        <h1 className="text-sm font-semibold">Générateur de Mot de Passe</h1>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone principale */}
        <div className="flex flex-1 flex-col">
          {/* Password display + strength */}
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="w-full max-w-xl space-y-4">
              {/* Password field */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  className="w-full rounded-lg border border-border bg-card px-4 py-4 pr-24 font-mono text-lg focus:outline-none"
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

              {/* Strength meter */}
              {passwordAnalysis && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <StrengthIcon className={`h-4 w-4 ${strengthLabels[passwordAnalysis.strength].color.replace("bg-", "text-")}`} />
                      <span className="font-medium">{strengthLabels[passwordAnalysis.strength].label}</span>
                    </div>
                    <span className="text-muted-foreground">{passwordAnalysis.score}/10</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${strengthLabels[passwordAnalysis.strength].color}`}
                      style={{ width: `${passwordAnalysis.score * 10}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Length slider */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Longueur</span>
                  <span className="font-medium">{options.length}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Quick character options */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "uppercase", label: "A-Z" },
                  { key: "lowercase", label: "a-z" },
                  { key: "numbers", label: "0-9" },
                  { key: "symbols", label: "!@#" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setOptions({ ...options, [key]: !options[key as keyof PasswordOptions] })}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      options[key as keyof PasswordOptions]
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Simple", options: { length: 8, symbols: false } },
                  { label: "Standard", options: { length: 16 } },
                  { label: "Fort", options: { length: 24 } },
                  { label: "PIN 4", options: { length: 4, uppercase: false, lowercase: false, symbols: false } },
                  { label: "PIN 6", options: { length: 6, uppercase: false, lowercase: false, symbols: false } },
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset.options)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-center gap-3 border-t border-border bg-card px-4 py-3">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Générer
            </button>
            <button
              onClick={() => copyToClipboard(password)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              <Copy className="h-4 w-4" />
              Copier
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "options" as TabType, label: "Options" },
              { id: "passphrase" as TabType, label: "Phrase" },
              { id: "bulk" as TabType, label: "Masse" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "options" && (
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">Options avancées</p>

                {[
                  { key: "excludeAmbiguous", label: "Exclure ambigus ({}[]...)" },
                  { key: "excludeSimilar", label: "Exclure similaires (il1Lo0O)" },
                  { key: "beginWithLetter", label: "Commencer par une lettre" },
                  { key: "noConsecutive", label: "Pas de caractères consécutifs" },
                  { key: "noRepeating", label: "Pas de caractères répétés" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options[key as keyof PasswordOptions] as boolean}
                      onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}

                <div className="space-y-2 border-t border-border pt-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Exclure</label>
                    <input
                      type="text"
                      value={options.customExclude}
                      onChange={(e) => setOptions({ ...options, customExclude: e.target.value })}
                      placeholder="abc..."
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Inclure</label>
                    <input
                      type="text"
                      value={options.includeCustom}
                      onChange={(e) => setOptions({ ...options, includeCustom: e.target.value })}
                      placeholder="€£¥..."
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-medium text-muted-foreground uppercase">Conseils</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Min. 12 caractères</li>
                    <li>• Mélangez types de caractères</li>
                    <li>• Un mot de passe unique par compte</li>
                    <li>• Utilisez un gestionnaire</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "passphrase" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium">Phrase secrète mémorisable</p>
                </div>

                <div>
                  <input
                    type="text"
                    value={passphrase}
                    readOnly
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                    placeholder="Cliquez sur Générer"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span>Nombre de mots</span>
                    <span className="text-muted-foreground">{passphraseWords}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={passphraseWords}
                    onChange={(e) => setPassphraseWords(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs">Séparateur</label>
                  <div className="flex gap-1.5">
                    {["-", "_", ".", " ", ""].map((sep) => (
                      <button
                        key={sep}
                        onClick={() => setPassphraseSeparator(sep)}
                        className={`flex-1 rounded border py-1.5 text-xs ${
                          passphraseSeparator === sep
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {sep || "∅"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={passphraseCapitalize}
                      onChange={(e) => setPassphraseCapitalize(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Majuscules</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={passphraseNumbers}
                      onChange={(e) => setPassphraseNumbers(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Ajouter chiffres</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGeneratePassphrase}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Générer
                  </button>
                  <button
                    onClick={() => copyToClipboard(passphrase)}
                    disabled={!passphrase}
                    className="rounded-lg border border-border px-3 py-2 hover:bg-accent disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "bulk" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium">Génération en masse</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs">Nombre de mots de passe</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateBulk}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Générer
                  </button>
                  {passwords.length > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {passwords.length > 0 && (
                  <div className="max-h-64 space-y-1.5 overflow-auto">
                    {passwords.map((pwd, i) => (
                      <div key={i} className="flex items-center gap-2 rounded border border-border bg-background px-2.5 py-1.5">
                        <span className="flex-1 truncate font-mono text-xs">
                          {showPassword ? pwd : "•".repeat(Math.min(pwd.length, 20))}
                        </span>
                        <button
                          onClick={() => copyToClipboard(pwd, i)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
