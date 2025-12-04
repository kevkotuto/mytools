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

type Mode = "text" | "file" | "image";
type Direction = "encode" | "decode";
type TabType = "options" | "dataurl" | "info";

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
  const [activeTab, setActiveTab] = useState<TabType>("options");
  const [mimeType, setMimeType] = useState("text/plain");

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
      setError(dir === "encode" ? "Erreur lors de l'encodage" : "Base64 invalide");
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

    let dataUrl = output.trim();

    if (!dataUrl.startsWith("data:")) {
      const header = atob(dataUrl.slice(0, 16));
      let detectedMime = "image/png";

      if (header.startsWith("\xFF\xD8\xFF")) detectedMime = "image/jpeg";
      else if (header.startsWith("\x89PNG")) detectedMime = "image/png";
      else if (header.startsWith("GIF8")) detectedMime = "image/gif";
      else if (header.startsWith("RIFF") && header.includes("WEBP")) detectedMime = "image/webp";

      dataUrl = `data:${detectedMime};base64,${dataUrl}`;
    }

    setPreviewImage(dataUrl);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDataUrl = async () => {
    const dataUrl = `data:${mimeType};base64,${output.replace(/\s/g, "")}`;
    await navigator.clipboard.writeText(dataUrl);
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

  const tabs: { id: TabType; label: string }[] = [
    { id: "options", label: "Options" },
    { id: "dataurl", label: "Data URL" },
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
        <h1 className="text-sm font-semibold">Base64 Encoder / Decoder</h1>
        <div className="w-16" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Controls */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
            {/* Direction Toggle */}
            <div className="flex rounded border border-border bg-background">
              <button
                onClick={() => handleDirectionChange("encode")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
                  direction === "encode" ? "bg-primary/10 font-medium" : "hover:bg-accent"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Encoder
              </button>
              <button
                onClick={() => handleDirectionChange("decode")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
                  direction === "decode" ? "bg-primary/10 font-medium" : "hover:bg-accent"
                }`}
              >
                <Unlock className="h-3.5 w-3.5" />
                Décoder
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded border border-border bg-background">
              <button
                onClick={() => setMode("text")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-sm ${
                  mode === "text" ? "bg-primary/10 font-medium" : "hover:bg-accent"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Texte
              </button>
              <button
                onClick={() => setMode("file")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-sm ${
                  mode === "file" ? "bg-primary/10 font-medium" : "hover:bg-accent"
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                Fichier
              </button>
              <button
                onClick={() => setMode("image")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-sm ${
                  mode === "image" ? "bg-primary/10 font-medium" : "hover:bg-accent"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </button>
            </div>

            <div className="flex-1" />

            <button
              onClick={handleSwap}
              className="flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-accent"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Inverser
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-accent"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Effacer
            </button>
          </div>

          {/* Editor Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Input Panel */}
            <div className="flex flex-1 flex-col border-r border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {direction === "encode" ? "Entrée" : "Base64"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(stats.inputSize)}
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
                  className="flex-1 resize-none bg-transparent p-3 font-mono text-sm focus:outline-none"
                  spellCheck={false}
                />
              ) : (
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-3 p-4"
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
                    Glissez un fichier ou cliquez
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
                    className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Sélectionner
                  </button>

                  {input && (
                    <p className="mt-2 text-sm font-medium">{input}</p>
                  )}

                  {previewImage && direction === "encode" && (
                    <img
                      src={previewImage}
                      alt="Source"
                      className="mt-2 max-h-32 rounded border border-border"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Output Panel */}
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {direction === "encode" ? "Base64" : "Sortie"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(stats.outputSize)}
                </span>
              </div>

              <div className="relative flex-1">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Le résultat apparaîtra ici..."
                  className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm focus:outline-none"
                />

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview for Decode */}
              {direction === "decode" && mode === "image" && output && (
                <div className="border-t border-border p-3">
                  {!previewImage ? (
                    <button
                      onClick={handleImageDecode}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                    >
                      Afficher l&apos;image
                    </button>
                  ) : (
                    <img
                      src={previewImage}
                      alt="Decoded"
                      className="max-h-32 rounded border border-border"
                      onError={() => {
                        setPreviewImage(null);
                        setError("Impossible de décoder l'image");
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-center gap-3 border-t border-border bg-card px-4 py-3">
            <button
              onClick={copyToClipboard}
              disabled={!output}
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copier
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="flex items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </button>

            {/* Stats */}
            <div className="ml-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {direction === "encode" ? "+" : ""}{stats.ratio}%
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
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
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Format</p>
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
                </div>

                {direction === "encode" && !urlSafe && (
                  <div>
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

                    {lineBreaks && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Longueur:</span>
                        <select
                          value={lineLength}
                          onChange={(e) => {
                            setLineLength(parseInt(e.target.value));
                            if (input) processText(input, direction);
                          }}
                          className="rounded border border-border bg-background px-2 py-1 text-sm"
                        >
                          <option value={64}>64</option>
                          <option value={76}>76 (MIME)</option>
                          <option value={80}>80</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Examples */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Exemples</p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        handleDirectionChange("encode");
                        setTimeout(() => handleInputChange("Hello, World!"), 0);
                      }}
                      className="w-full rounded border border-border bg-background px-3 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      Hello World
                    </button>
                    <button
                      onClick={() => {
                        handleDirectionChange("decode");
                        setTimeout(() => handleInputChange("SGVsbG8sIFdvcmxkIQ=="), 0);
                      }}
                      className="w-full rounded border border-border bg-background px-3 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      SGVsbG8sIFdvcmxkIQ==
                    </button>
                    <button
                      onClick={() => {
                        handleDirectionChange("encode");
                        setTimeout(() => handleInputChange("Caractères: é, è, ê, à, ù, ç"), 0);
                      }}
                      className="w-full rounded border border-border bg-background px-3 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      Caractères UTF-8
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dataurl" && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Type MIME</p>
                  <select
                    value={mimeType}
                    onChange={(e) => setMimeType(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
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
                </div>

                <button
                  onClick={copyDataUrl}
                  disabled={!output || direction === "decode"}
                  className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Copier Data URL
                </button>

                {output && direction === "encode" && (
                  <div className="rounded border border-border bg-background p-3">
                    <p className="mb-1 text-xs text-muted-foreground">Aperçu:</p>
                    <code className="break-all text-xs">
                      data:{mimeType};base64,{output.slice(0, 30)}...
                    </code>
                  </div>
                )}
              </div>
            )}

            {activeTab === "info" && (
              <div className="space-y-4 text-xs">
                <div className="rounded border border-border bg-background p-3">
                  <p className="font-medium mb-2">Base64</p>
                  <p className="text-muted-foreground">
                    Encodage binaire-vers-texte représentant les données en ASCII.
                    Augmente la taille d&apos;environ 33%.
                  </p>
                </div>

                <div className="rounded border border-border bg-background p-3">
                  <p className="font-medium mb-2">Statistiques</p>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Entrée</span>
                      <span>{formatBytes(stats.inputSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sortie</span>
                      <span>{formatBytes(stats.outputSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ratio</span>
                      <span className={direction === "encode" ? "text-orange-500" : "text-green-500"}>
                        {direction === "encode" ? "+" : ""}{stats.ratio}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-border bg-background p-3">
                  <p className="font-medium mb-2">URL-Safe</p>
                  <p className="text-muted-foreground">
                    Remplace + par -, / par _ et supprime le padding =.
                    Utilisé pour les URLs et noms de fichiers.
                  </p>
                </div>

                {imageInfo && (
                  <div className="rounded border border-border bg-background p-3">
                    <p className="font-medium mb-2">Image</p>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span>{imageInfo.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taille</span>
                        <span>{formatBytes(imageInfo.size)}</span>
                      </div>
                      {imageInfo.dimensions && (
                        <div className="flex justify-between">
                          <span>Dimensions</span>
                          <span>{imageInfo.dimensions.width}×{imageInfo.dimensions.height}</span>
                        </div>
                      )}
                    </div>
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
