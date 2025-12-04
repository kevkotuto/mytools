"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Download,
  Hash,
  Clock,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";

type UUIDVersion = "v1" | "v4" | "v7" | "nil" | "max";
type UUIDFormat = "standard" | "braces" | "urn" | "base64" | "short" | "no-hyphens";
type TabType = "options" | "validator" | "info";

const versionLabels: Record<UUIDVersion, { name: string; description: string; icon: React.ElementType | null }> = {
  v1: { name: "v1", description: "Timestamp + MAC", icon: Clock },
  v4: { name: "v4", description: "Aléatoire", icon: Hash },
  v7: { name: "v7", description: "Unix + random", icon: Globe },
  nil: { name: "Nil", description: "Tous à 0", icon: null },
  max: { name: "Max", description: "Tous à 1", icon: null },
};

const formatLabels: Record<UUIDFormat, { name: string; example: string }> = {
  standard: { name: "Standard", example: "8-4-4-4-12" },
  braces: { name: "{Accolades}", example: "{...}" },
  urn: { name: "URN", example: "urn:uuid:..." },
  base64: { name: "Base64", example: "24 car." },
  short: { name: "Court", example: "22 car." },
  "no-hyphens": { name: "Sans tirets", example: "32 car." },
};

export default function UuidGeneratorPage() {
  const [version, setVersion] = useState<UUIDVersion>("v4");
  const [format, setFormat] = useState<UUIDFormat>("standard");
  const [uppercase, setUppercase] = useState(false);
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("options");
  const [validateInput, setValidateInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    version: string;
    variant: string;
  } | null>(null);

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

    let uuid = trimmed
      .replace(/^urn:uuid:/i, "")
      .replace(/^\{/, "")
      .replace(/\}$/, "");

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

    if (/^[0-9a-f]{32}$/i.test(uuid)) {
      uuid = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      return { valid: false, version: "Invalid", variant: "Invalid" };
    }

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

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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

  useEffect(() => {
    handleGenerate();
  }, []);

  useEffect(() => {
    handleGenerate();
  }, [version, format, uppercase]);

  const tabs: { id: TabType; label: string }[] = [
    { id: "options", label: "Options" },
    { id: "validator", label: "Validateur" },
    { id: "info", label: "Info" },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-sm font-semibold">Générateur UUID</h1>
        <div className="w-16" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* UUID Display Area */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            {/* Version Quick Select */}
            <div className="flex gap-2">
              {(Object.keys(versionLabels) as UUIDVersion[]).map((v) => {
                const { name, icon: Icon } = versionLabels[v];
                return (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors ${
                      version === v
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {name}
                  </button>
                );
              })}
            </div>

            {/* UUIDs List */}
            <div className="w-full max-w-xl space-y-2">
              {uuids.map((uuid, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded border border-border bg-card px-4 py-3"
                >
                  <code className="flex-1 text-center font-mono text-sm">{uuid}</code>
                  <button
                    onClick={() => copyToClipboard(uuid, i)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
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

            {/* Count Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Nombre:</span>
              <div className="flex items-center rounded border border-border bg-card">
                {[1, 5, 10, 25].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-3 py-1.5 text-sm ${
                      count === n
                        ? "bg-primary/10 font-medium"
                        : "hover:bg-accent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-16 rounded border border-border bg-card px-2 py-1.5 text-center text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-center gap-3 border-t border-border bg-card px-4 py-3">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Générer
            </button>
            <button
              onClick={copyAll}
              className="flex items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm hover:bg-accent"
            >
              {copiedAll ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              Copier tout
            </button>
            {uuids.length > 1 && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "options" && (
              <div className="space-y-4">
                {/* Format */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Format</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(formatLabels) as UUIDFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`rounded border px-2 py-2 text-left text-xs transition-colors ${
                          format === f
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-accent"
                        }`}
                      >
                        <span className="block font-medium">{formatLabels[f].name}</span>
                        <span className="text-muted-foreground">{formatLabels[f].example}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Uppercase */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">MAJUSCULES</span>
                </label>

                {/* Version Details */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Description</p>
                  <div className="rounded border border-border bg-background p-3 text-xs">
                    <p className="font-medium">{versionLabels[version].name}</p>
                    <p className="mt-1 text-muted-foreground">{versionLabels[version].description}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "validator" && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">UUID à valider</p>
                  <input
                    type="text"
                    value={validateInput}
                    onChange={(e) => {
                      setValidateInput(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder="Collez un UUID..."
                    className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleValidate}
                  disabled={!validateInput.trim()}
                  className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Valider
                </button>

                {validationResult && (
                  <div
                    className={`rounded border p-3 ${
                      validationResult.valid
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {validationResult.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${validationResult.valid ? "text-green-600" : "text-red-600"}`}>
                        {validationResult.valid ? "UUID valide" : "UUID invalide"}
                      </span>
                    </div>
                    {validationResult.valid && (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version</span>
                          <span className="font-medium">{validationResult.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Variant</span>
                          <span className="font-medium">{validationResult.variant}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "info" && (
              <div className="space-y-4 text-xs">
                <div className="rounded border border-border bg-background p-3">
                  <p className="font-medium mb-2">Structure UUID</p>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Longueur</span>
                      <span>128 bits (16 octets)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format</span>
                      <span>8-4-4-4-12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Caractères</span>
                      <span>36 (32 hex + 4 tirets)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Combinaisons v4</span>
                      <span>~5.3×10³⁶</span>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-border bg-background p-3">
                  <p className="font-medium mb-2">Versions</p>
                  <div className="space-y-2 text-muted-foreground">
                    <div>
                      <span className="text-foreground">v1:</span> Timestamp + MAC
                    </div>
                    <div>
                      <span className="text-foreground">v4:</span> Aléatoire (recommandé)
                    </div>
                    <div>
                      <span className="text-foreground">v7:</span> Unix timestamp + random
                    </div>
                  </div>
                </div>

                <div className="rounded border border-border bg-background p-3">
                  <p className="font-medium mb-2">Cas d&apos;usage</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Identifiants BDD</li>
                    <li>• Clés de session</li>
                    <li>• Tokens API</li>
                    <li>• Noms de fichiers</li>
                    <li>• IDs de transactions</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
