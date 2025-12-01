"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Plus,
  Hash,
  Clock,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";

type UUIDVersion = "v1" | "v4" | "v7" | "nil" | "max";
type UUIDFormat = "standard" | "braces" | "urn" | "base64" | "short" | "no-hyphens";

const versionLabels: Record<UUIDVersion, { name: string; description: string }> = {
  v1: { name: "UUID v1", description: "Basé sur timestamp + adresse MAC (pseudo)" },
  v4: { name: "UUID v4", description: "Complètement aléatoire - Le plus utilisé" },
  v7: { name: "UUID v7", description: "Timestamp Unix ms + random - Triable" },
  nil: { name: "Nil UUID", description: "UUID vide (tous les bits à 0)" },
  max: { name: "Max UUID", description: "UUID maximum (tous les bits à 1)" },
};

const formatLabels: Record<UUIDFormat, { name: string; example: string }> = {
  standard: { name: "Standard", example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  braces: { name: "Accolades", example: "{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}" },
  urn: { name: "URN", example: "urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  base64: { name: "Base64", example: "AGVmZ2hpamtsbW5vcHE=" },
  short: { name: "Court (22 car.)", example: "Base64 URL-safe sans padding" },
  "no-hyphens": { name: "Sans tirets", example: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
};

export default function UuidGeneratorPage() {
  const [version, setVersion] = useState<UUIDVersion>("v4");
  const [format, setFormat] = useState<UUIDFormat>("standard");
  const [uppercase, setUppercase] = useState(false);
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [validateInput, setValidateInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    version: string;
    variant: string;
  } | null>(null);
  const [namespace, setNamespace] = useState("6ba7b810-9dad-11d1-80b4-00c04fd430c8"); // DNS namespace
  const [name, setName] = useState("");

  // UUID v1 implementation (pseudo - uses random instead of real MAC)
  const generateUUIDv1 = useCallback(() => {
    const timestamp = Date.now();
    const timestampHex = ((timestamp + 12219292800000) * 10000).toString(16).padStart(15, "0");

    const timeLow = timestampHex.slice(-8);
    const timeMid = timestampHex.slice(-12, -8);
    const timeHiAndVersion = "1" + timestampHex.slice(-15, -12);

    const clockSeq = (Math.random() * 0x3fff) | 0x8000;
    const clockSeqHex = clockSeq.toString(16).padStart(4, "0");

    const node = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
    ).join("");

    return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHex}-${node}`;
  }, []);

  // UUID v4 implementation
  const generateUUIDv4 = useCallback(() => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Set version (4) and variant (8, 9, a, or b)
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }, []);

  // UUID v7 implementation
  const generateUUIDv7 = useCallback(() => {
    const timestamp = Date.now();
    const timestampHex = timestamp.toString(16).padStart(12, "0");

    const array = new Uint8Array(10);
    crypto.getRandomValues(array);

    // Build UUID
    const timeLow = timestampHex.slice(0, 8);
    const timeMid = timestampHex.slice(8, 12);

    const randomA = Array.from(array.slice(0, 2), (b) => b.toString(16).padStart(2, "0")).join("");
    const versionAndRandom = "7" + randomA.slice(1);

    const variantAndRandom = ((array[2] & 0x3f) | 0x80).toString(16).padStart(2, "0") +
      Array.from(array.slice(3), (b) => b.toString(16).padStart(2, "0")).join("");

    return `${timeLow}-${timeMid}-${versionAndRandom}-${variantAndRandom.slice(0, 4)}-${variantAndRandom.slice(4)}`;
  }, []);

  const generateUUID = useCallback(() => {
    switch (version) {
      case "v1":
        return generateUUIDv1();
      case "v4":
        return generateUUIDv4();
      case "v7":
        return generateUUIDv7();
      case "nil":
        return "00000000-0000-0000-0000-000000000000";
      case "max":
        return "ffffffff-ffff-ffff-ffff-ffffffffffff";
      default:
        return generateUUIDv4();
    }
  }, [version, generateUUIDv1, generateUUIDv4, generateUUIDv7]);

  const formatUUID = useCallback(
    (uuid: string) => {
      let formatted = uuid;

      switch (format) {
        case "braces":
          formatted = `{${uuid}}`;
          break;
        case "urn":
          formatted = `urn:uuid:${uuid}`;
          break;
        case "base64":
          const bytes = uuid.replace(/-/g, "").match(/.{2}/g)?.map((h) => parseInt(h, 16)) || [];
          formatted = btoa(String.fromCharCode(...bytes));
          break;
        case "short":
          const shortBytes = uuid.replace(/-/g, "").match(/.{2}/g)?.map((h) => parseInt(h, 16)) || [];
          formatted = btoa(String.fromCharCode(...shortBytes))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
          break;
        case "no-hyphens":
          formatted = uuid.replace(/-/g, "");
          break;
        default:
          break;
      }

      return uppercase ? formatted.toUpperCase() : formatted.toLowerCase();
    },
    [format, uppercase]
  );

  const handleGenerate = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(formatUUID(generateUUID()));
    }
    setUuids(newUuids);
  }, [count, formatUUID, generateUUID]);

  const validateUUID = useCallback((input: string) => {
    const trimmed = input.trim().toLowerCase();

    // Remove common prefixes and braces
    let uuid = trimmed
      .replace(/^urn:uuid:/i, "")
      .replace(/^\{/, "")
      .replace(/\}$/, "");

    // Try to parse base64 format
    if (/^[a-zA-Z0-9+/=_-]{22,24}$/.test(uuid)) {
      try {
        const base64 = uuid.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
        const bytes = atob(padded);
        uuid = Array.from(bytes, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
      } catch {
        // Not valid base64
      }
    }

    // Add hyphens if missing
    if (/^[0-9a-f]{32}$/i.test(uuid)) {
      uuid = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
    }

    // Validate standard format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      return { valid: false, version: "Invalid", variant: "Invalid" };
    }

    // Extract version
    const versionChar = uuid.charAt(14);
    let versionStr = "Unknown";
    switch (versionChar) {
      case "1": versionStr = "v1 (Timestamp)"; break;
      case "2": versionStr = "v2 (DCE Security)"; break;
      case "3": versionStr = "v3 (MD5 Hash)"; break;
      case "4": versionStr = "v4 (Random)"; break;
      case "5": versionStr = "v5 (SHA-1 Hash)"; break;
      case "6": versionStr = "v6 (Reordered Time)"; break;
      case "7": versionStr = "v7 (Unix Epoch)"; break;
      case "8": versionStr = "v8 (Custom)"; break;
      default:
        if (uuid === "00000000-0000-0000-0000-000000000000") {
          versionStr = "Nil UUID";
        } else if (uuid === "ffffffff-ffff-ffff-ffff-ffffffffffff") {
          versionStr = "Max UUID";
        }
    }

    // Extract variant
    const variantChar = parseInt(uuid.charAt(19), 16);
    let variantStr = "Unknown";
    if ((variantChar & 0x8) === 0) {
      variantStr = "NCS (Reserved)";
    } else if ((variantChar & 0xc) === 0x8) {
      variantStr = "RFC 4122 (Standard)";
    } else if ((variantChar & 0xe) === 0xc) {
      variantStr = "Microsoft (Reserved)";
    } else {
      variantStr = "Future (Reserved)";
    }

    return { valid: true, version: versionStr, variant: variantStr };
  }, []);

  const handleValidate = () => {
    setValidationResult(validateUUID(validateInput));
  };

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(index ?? -1);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const content = uuids.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate initial UUIDs
  useEffect(() => {
    handleGenerate();
  }, []);

  // Regenerate when version or format changes
  useEffect(() => {
    handleGenerate();
  }, [version, format, uppercase]);

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
          <h1 className="text-3xl font-bold">Générateur UUID / GUID</h1>
          <p className="mt-2 text-muted-foreground">
            Générez des identifiants uniques universels (UUID) dans différentes versions et formats.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* UUID Display */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium">UUID générés</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(uuids.join("\n"))}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    {copied === -1 ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    Copier tout
                  </button>
                  {uuids.length > 1 && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {uuids.map((uuid, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <code className="flex-1 font-mono text-sm">{uuid}</code>
                    <button
                      onClick={() => copyToClipboard(uuid, i)}
                      className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {copied === i ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Nombre:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  Générer
                </button>
              </div>
            </div>

            {/* Version Selection */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">Version</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(Object.keys(versionLabels) as UUIDVersion[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`flex flex-col items-center rounded-lg border p-3 transition-colors ${
                      version === v
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <span className="text-sm font-medium">{versionLabels[v].name}</span>
                    <span className="mt-1 text-center text-xs text-muted-foreground">
                      {v === "v1" && <Clock className="inline h-3 w-3 mr-1" />}
                      {v === "v4" && <Hash className="inline h-3 w-3 mr-1" />}
                      {v === "v7" && <Globe className="inline h-3 w-3 mr-1" />}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {versionLabels[version].description}
              </p>
            </div>

            {/* Format Selection */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">Format</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(Object.keys(formatLabels) as UUIDFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      format === f
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <span className="block text-sm font-medium">{formatLabels[f].name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatLabels[f].example}
                    </span>
                  </button>
                ))}
              </div>

              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">MAJUSCULES</span>
              </label>
            </div>

            {/* Validator */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">Validateur UUID</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={validateInput}
                  onChange={(e) => {
                    setValidateInput(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="Collez un UUID à valider..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleValidate}
                  disabled={!validateInput.trim()}
                  className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Valider
                </button>
              </div>

              {validationResult && (
                <div
                  className={`mt-4 rounded-lg border p-4 ${
                    validationResult.valid
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`font-medium ${validationResult.valid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                      {validationResult.valid ? "UUID valide" : "UUID invalide"}
                    </span>
                  </div>
                  {validationResult.valid && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Version:</span>{" "}
                        <span className="font-medium">{validationResult.version}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Variant:</span>{" "}
                        <span className="font-medium">{validationResult.variant}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Informations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longueur</span>
                  <span className="font-medium">128 bits (16 octets)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">8-4-4-4-12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caractères</span>
                  <span className="font-medium">36 (32 hex + 4 tirets)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Combinaisons v4</span>
                  <span className="font-medium">~5.3×10³⁶</span>
                </div>
              </div>
            </div>

            {/* Version Details */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Détails des versions</h3>
              <div className="space-y-3 text-xs">
                <div className="rounded border border-border p-2">
                  <p className="font-medium">UUID v1</p>
                  <p className="text-muted-foreground">
                    Basé sur timestamp et adresse MAC. Peut révéler des infos sur l&apos;hôte.
                  </p>
                </div>
                <div className="rounded border border-primary/50 bg-primary/5 p-2">
                  <p className="font-medium">UUID v4 (recommandé)</p>
                  <p className="text-muted-foreground">
                    122 bits aléatoires. Le plus utilisé car totalement imprévisible.
                  </p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="font-medium">UUID v7</p>
                  <p className="text-muted-foreground">
                    Timestamp Unix + random. Triable chronologiquement, idéal pour les BDD.
                  </p>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Cas d&apos;usage</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• Identifiants de base de données</li>
                <li>• Clés de session utilisateur</li>
                <li>• Identifiants d&apos;API / tokens</li>
                <li>• Noms de fichiers uniques</li>
                <li>• Tracking d&apos;événements</li>
                <li>• Identifiants de transactions</li>
              </ul>
            </div>

            {/* Comparison */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">UUID vs autres</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UUID</span>
                  <span className="font-mono">128 bits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ULID</span>
                  <span className="font-mono">128 bits (triable)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NanoID</span>
                  <span className="font-mono">126 bits (21 car.)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ObjectId</span>
                  <span className="font-mono">96 bits (MongoDB)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
