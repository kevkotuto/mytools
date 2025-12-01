"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  ArrowUpDown,
  FileText,
  Image as ImageIcon,
  FileCode,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";

type Mode = "text" | "file" | "image" | "url";
type Direction = "encode" | "decode";

export default function Base64Page() {
  const [mode, setMode] = useState<Mode>("text");
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlSafe, setUrlSafe] = useState(false);
  const [lineBreaks, setLineBreaks] = useState(false);
  const [lineLength, setLineLength] = useState(76);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    type: string;
    size: number;
    dimensions?: { width: number; height: number };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const inputSize = new Blob([input]).size;
    const outputSize = new Blob([output]).size;
    const ratio = inputSize > 0 ? ((outputSize / inputSize - 1) * 100).toFixed(1) : "0";

    return {
      inputSize,
      outputSize,
      ratio,
      inputChars: input.length,
      outputChars: output.length,
    };
  }, [input, output]);

  const processText = (text: string, dir: Direction) => {
    setError(null);

    if (!text.trim()) {
      setOutput("");
      return;
    }

    try {
      if (dir === "encode") {
        let encoded = btoa(unescape(encodeURIComponent(text)));

        if (urlSafe) {
          encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        }

        if (lineBreaks && !urlSafe) {
          encoded = encoded.match(new RegExp(`.{1,${lineLength}}`, "g"))?.join("\n") || encoded;
        }

        setOutput(encoded);
      } else {
        let toDecode = text.trim().replace(/\s/g, "");

        if (urlSafe) {
          toDecode = toDecode.replace(/-/g, "+").replace(/_/g, "/");
          while (toDecode.length % 4) {
            toDecode += "=";
          }
        }

        const decoded = decodeURIComponent(escape(atob(toDecode)));
        setOutput(decoded);
      }
    } catch {
      setError(dir === "encode" ? "Erreur lors de l'encodage" : "Base64 invalide - impossible de décoder");
      setOutput("");
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    processText(value, direction);
  };

  const handleDirectionChange = (dir: Direction) => {
    setDirection(dir);
    setInput("");
    setOutput("");
    setError(null);
    setPreviewImage(null);
    setImageInfo(null);
  };

  const handleSwap = () => {
    const newInput = output;
    const newDirection = direction === "encode" ? "decode" : "encode";
    setDirection(newDirection);
    setInput(newInput);
    processText(newInput, newDirection);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (direction === "encode") {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        let encoded = base64;

        if (urlSafe) {
          encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        }

        if (lineBreaks && !urlSafe) {
          encoded = encoded.match(new RegExp(`.{1,${lineLength}}`, "g"))?.join("\n") || encoded;
        }

        setInput(`[Fichier: ${file.name}]`);
        setOutput(encoded);

        if (file.type.startsWith("image/")) {
          setPreviewImage(reader.result as string);
          const img = new Image();
          img.onload = () => {
            setImageInfo({
              type: file.type,
              size: file.size,
              dimensions: { width: img.width, height: img.height },
            });
          };
          img.src = reader.result as string;
        } else {
          setImageInfo({ type: file.type, size: file.size });
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setInput(text);
        processText(text, "decode");
      };
      reader.readAsText(file);
    }
  };

  const handleImageDecode = () => {
    if (!output) return;

    // Try to detect if it's a data URL or raw base64
    let dataUrl = output.trim();

    if (!dataUrl.startsWith("data:")) {
      // Try to guess the image type from the base64 header
      const header = atob(dataUrl.slice(0, 16));
      let mimeType = "image/png";

      if (header.startsWith("\xFF\xD8\xFF")) mimeType = "image/jpeg";
      else if (header.startsWith("\x89PNG")) mimeType = "image/png";
      else if (header.startsWith("GIF8")) mimeType = "image/gif";
      else if (header.startsWith("RIFF") && header.includes("WEBP")) mimeType = "image/webp";

      dataUrl = `data:${mimeType};base64,${dataUrl}`;
    }

    setPreviewImage(dataUrl);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (direction === "encode") {
      const blob = new Blob([output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "encoded.txt";
      a.click();
      URL.revokeObjectURL(url);
    } else if (previewImage) {
      const a = document.createElement("a");
      a.href = previewImage;
      a.download = "decoded-image";
      a.click();
    } else {
      const blob = new Blob([output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "decoded.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setPreviewImage(null);
    setImageInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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
          <h1 className="text-3xl font-bold">Base64 Encoder / Decoder</h1>
          <p className="mt-2 text-muted-foreground">
            Encodez et décodez du texte, des fichiers et des images en Base64.
          </p>
        </div>

        {/* Mode & Direction Selection */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => handleDirectionChange("encode")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition-colors ${
                direction === "encode" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <Lock className="h-4 w-4" />
              Encoder
            </button>
            <button
              onClick={() => handleDirectionChange("decode")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition-colors ${
                direction === "decode" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <Unlock className="h-4 w-4" />
              Décoder
            </button>
          </div>

          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
                mode === "text" ? "bg-secondary" : "hover:bg-accent"
              }`}
            >
              <FileText className="h-4 w-4" />
              Texte
            </button>
            <button
              onClick={() => setMode("file")}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
                mode === "file" ? "bg-secondary" : "hover:bg-accent"
              }`}
            >
              <FileCode className="h-4 w-4" />
              Fichier
            </button>
            <button
              onClick={() => setMode("image")}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
                mode === "image" ? "bg-secondary" : "hover:bg-accent"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Image
            </button>
          </div>

          <div className="flex-1" />

          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" />
            Effacer
          </button>
        </div>

        {/* Options */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => {
                setUrlSafe(e.target.checked);
                if (input) processText(input, direction);
              }}
              className="h-4 w-4 rounded border-border"
            />
            URL-Safe (RFC 4648)
          </label>

          {direction === "encode" && !urlSafe && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lineBreaks}
                onChange={(e) => {
                  setLineBreaks(e.target.checked);
                  if (input) processText(input, direction);
                }}
                className="h-4 w-4 rounded border-border"
              />
              Sauts de ligne
            </label>
          )}

          {lineBreaks && direction === "encode" && !urlSafe && (
            <div className="flex items-center gap-2 text-sm">
              <label>Longueur:</label>
              <select
                value={lineLength}
                onChange={(e) => {
                  setLineLength(parseInt(e.target.value));
                  if (input) processText(input, direction);
                }}
                className="rounded border border-border bg-background px-2 py-1"
              >
                <option value={64}>64</option>
                <option value={76}>76 (MIME)</option>
                <option value={80}>80</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">
                  {direction === "encode" ? "Texte à encoder" : "Base64 à décoder"}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(stats.inputSize)} • {stats.inputChars} caractères
                </span>
              </div>

              {mode === "text" ? (
                <textarea
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={
                    direction === "encode"
                      ? "Entrez le texte à encoder..."
                      : "Collez le Base64 à décoder..."
                  }
                  className="h-64 w-full resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
                  spellCheck={false}
                />
              ) : (
                <div
                  className="flex h-64 flex-col items-center justify-center gap-4 p-4"
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && fileInputRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      fileInputRef.current.files = dt.files;
                      handleFileSelect({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Glissez un fichier ou cliquez pour sélectionner
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={mode === "image" ? "image/*" : "*"}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Sélectionner un fichier
                  </button>

                  {input && (
                    <p className="mt-2 text-sm font-medium">{input}</p>
                  )}
                </div>
              )}
            </div>

            {/* Image Preview (Input) */}
            {previewImage && direction === "encode" && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-sm font-medium">Aperçu de l&apos;image source</h3>
                <img
                  src={previewImage}
                  alt="Source"
                  className="max-h-48 rounded border border-border"
                />
                {imageInfo && (
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{imageInfo.type}</span>
                    <span>{formatBytes(imageInfo.size)}</span>
                    {imageInfo.dimensions && (
                      <span>{imageInfo.dimensions.width} × {imageInfo.dimensions.height}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Swap Button (Center on Desktop) */}
          <div className="flex items-center justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:hidden">
            <button
              onClick={handleSwap}
              className="rounded-full border border-border bg-card p-2 transition-colors hover:bg-accent"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">
                  {direction === "encode" ? "Résultat encodé" : "Résultat décodé"}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!output}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    Copier
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!output}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Le résultat apparaîtra ici..."
                  className="h-64 w-full resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
                />

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image Preview (Output) */}
            {direction === "decode" && output && mode === "image" && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Aperçu de l&apos;image</h3>
                  {!previewImage && (
                    <button
                      onClick={handleImageDecode}
                      className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                    >
                      Afficher l&apos;image
                    </button>
                  )}
                </div>
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Decoded"
                    className="max-h-48 rounded border border-border"
                    onError={() => {
                      setPreviewImage(null);
                      setError("Impossible de décoder l'image");
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur &quot;Afficher l&apos;image&quot; pour voir l&apos;aperçu
                  </p>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Statistiques</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Taille entrée</p>
                  <p className="font-semibold">{formatBytes(stats.inputSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taille sortie</p>
                  <p className="font-semibold">{formatBytes(stats.outputSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {direction === "encode" ? "Augmentation" : "Réduction"}
                  </p>
                  <p className={`font-semibold ${direction === "encode" ? "text-orange-600" : "text-green-600"}`}>
                    {direction === "encode" ? "+" : ""}{stats.ratio}%
                  </p>
                </div>
              </div>
            </div>

            {/* Data URL Generator */}
            {direction === "encode" && output && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium">Data URL</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      id="mimeType"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      defaultValue="text/plain"
                    >
                      <option value="text/plain">text/plain</option>
                      <option value="text/html">text/html</option>
                      <option value="text/css">text/css</option>
                      <option value="text/javascript">text/javascript</option>
                      <option value="application/json">application/json</option>
                      <option value="image/png">image/png</option>
                      <option value="image/jpeg">image/jpeg</option>
                      <option value="image/gif">image/gif</option>
                      <option value="image/svg+xml">image/svg+xml</option>
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById("mimeType") as HTMLSelectElement;
                        const dataUrl = `data:${select.value};base64,${output.replace(/\s/g, "")}`;
                        navigator.clipboard.writeText(dataUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      Copier Data URL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Examples */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Exemples</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    handleDirectionChange("encode");
                    setTimeout(() => handleInputChange("Hello, World!"), 0);
                  }}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Hello World
                </button>
                <button
                  onClick={() => {
                    handleDirectionChange("decode");
                    setTimeout(() => handleInputChange("SGVsbG8sIFdvcmxkIQ=="), 0);
                  }}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  SGVsbG8sIFdvcmxkIQ==
                </button>
                <button
                  onClick={() => {
                    handleDirectionChange("encode");
                    setTimeout(() => handleInputChange("Les caractères accentués: é, è, ê, à, ù, ç"), 0);
                  }}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Caractères UTF-8
                </button>
                <button
                  onClick={() => {
                    handleDirectionChange("encode");
                    setTimeout(() => handleInputChange(JSON.stringify({ name: "Test", value: 123 })), 0);
                  }}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
