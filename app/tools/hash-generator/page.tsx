"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Upload,
  FileText,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type InputMode = "text" | "file";

interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
  time: number;
}

// MD5 implementation (not in Web Crypto API)
const md5 = (str: string): string => {
  const rotateLeft = (lValue: number, iShiftBits: number) => (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));

  const addUnsigned = (lX: number, lY: number) => {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else return lResult ^ lX8 ^ lY8;
  };

  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);

  const FF = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const GG = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const HH = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const II = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const convertToWordArray = (str: string) => {
    const lMessageLength = str.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = Array<number>(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  const wordToHex = (lValue: number) => {
    let wordToHexValue = "";
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const wordToHexValueTemp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
    }
    return wordToHexValue;
  };

  const x = convertToWordArray(str);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
};

const algorithmInfo: Record<HashAlgorithm, { bits: number; secure: boolean; description: string }> = {
  "MD5": { bits: 128, secure: false, description: "Obsolète - Ne pas utiliser pour la sécurité" },
  "SHA-1": { bits: 160, secure: false, description: "Déprécié - Vulnérable aux collisions" },
  "SHA-256": { bits: 256, secure: true, description: "Recommandé - Sécurisé pour la plupart des usages" },
  "SHA-384": { bits: 384, secure: true, description: "Haute sécurité - Variante de SHA-512" },
  "SHA-512": { bits: 512, secure: true, description: "Très haute sécurité - Le plus robuste" },
};

export default function HashGeneratorPage() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [input, setInput] = useState("");
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [results, setResults] = useState<HashResult[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<HashAlgorithm[]>(["MD5", "SHA-1", "SHA-256", "SHA-512"]);
  const [isHashing, setIsHashing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const computeHash = async (algorithm: HashAlgorithm, data: ArrayBuffer | string): Promise<string> => {
    const start = performance.now();

    if (algorithm === "MD5") {
      // MD5 uses string input
      const str = typeof data === "string" ? data : new TextDecoder().decode(data);
      return md5(str);
    }

    // Use Web Crypto API for SHA algorithms
    const buffer = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const generateHashes = async () => {
    if (!input && !fileData) return;

    setIsHashing(true);
    setVerifyResult(null);

    const data = fileData || input;
    const newResults: HashResult[] = [];

    for (const algorithm of selectedAlgorithms) {
      const start = performance.now();
      const hash = await computeHash(algorithm, data);
      const time = performance.now() - start;
      newResults.push({ algorithm, hash, time });
    }

    setResults(newResults);
    setIsHashing(false);

    // Verify hash if provided
    if (verifyHash.trim()) {
      const normalizedVerify = verifyHash.trim().toLowerCase();
      const match = newResults.some(
        (r) => r.hash.toLowerCase() === normalizedVerify
      );
      setVerifyResult(match);
    }
  };

  useEffect(() => {
    if (input || fileData) {
      const timeout = setTimeout(generateHashes, 300);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
    }
  }, [input, fileData, selectedAlgorithms]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileInfo({ name: file.name, size: file.size });

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleAlgorithm = (algo: HashAlgorithm) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo]
    );
  };

  const copyHash = async (hash: string, id: string) => {
    const text = uppercase ? hash.toUpperCase() : hash;
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setInput("");
    setFileData(null);
    setFileInfo(null);
    setResults([]);
    setVerifyHash("");
    setVerifyResult(null);
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
          <h1 className="text-3xl font-bold">Générateur de Hash</h1>
          <p className="mt-2 text-muted-foreground">
            Calculez les empreintes MD5, SHA-1, SHA-256, SHA-384, SHA-512 de texte ou fichiers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Input Section */}
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex items-center gap-4">
              <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
                <button
                  onClick={() => {
                    setInputMode("text");
                    setFileData(null);
                    setFileInfo(null);
                  }}
                  className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition-colors ${
                    inputMode === "text" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Texte
                </button>
                <button
                  onClick={() => {
                    setInputMode("file");
                    setInput("");
                  }}
                  className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition-colors ${
                    inputMode === "file" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Fichier
                </button>
              </div>

              <button
                onClick={handleClear}
                className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Trash2 className="h-4 w-4" />
                Effacer
              </button>
            </div>

            {/* Input Area */}
            <div className="rounded-lg border border-border bg-card">
              {inputMode === "text" ? (
                <>
                  <div className="border-b border-border px-4 py-2">
                    <h2 className="text-sm font-medium">Texte à hasher</h2>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Entrez le texte à hasher..."
                    className="h-48 w-full resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
                    spellCheck={false}
                  />
                </>
              ) : (
                <div
                  className="flex h-48 flex-col items-center justify-center gap-4 p-4"
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
                  {fileInfo ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <p className="font-medium">{fileInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(fileInfo.size)}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Glissez un fichier ou cliquez pour sélectionner
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {fileInfo ? "Changer de fichier" : "Sélectionner un fichier"}
                  </button>
                </div>
              )}
            </div>

            {/* Algorithms Selection */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Algorithmes</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(Object.keys(algorithmInfo) as HashAlgorithm[]).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => toggleAlgorithm(algo)}
                    className={`flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedAlgorithms.includes(algo)
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {!algorithmInfo[algo].secure && (
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                    )}
                    {algo}
                  </button>
                ))}
              </div>
            </div>

            {/* Verify Hash */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Vérifier un hash</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyHash}
                  onChange={(e) => {
                    setVerifyHash(e.target.value);
                    setVerifyResult(null);
                  }}
                  placeholder="Collez un hash à vérifier..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
                {verifyResult !== null && (
                  <div
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                      verifyResult
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {verifyResult ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Match
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Non trouvé
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Majuscules
              </label>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium">Résultats</h2>
                {isHashing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result) => {
                    const info = algorithmInfo[result.algorithm];
                    const displayHash = uppercase ? result.hash.toUpperCase() : result.hash;

                    return (
                      <div key={result.algorithm} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{result.algorithm}</span>
                            <span className="text-xs text-muted-foreground">({info.bits} bits)</span>
                            {!info.secure && (
                              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                Non sécurisé
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.time.toFixed(2)} ms
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={displayHash}
                            readOnly
                            className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => copyHash(result.hash, result.algorithm)}
                            className="rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:bg-accent"
                          >
                            {copied === result.algorithm ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Entrez du texte ou sélectionnez un fichier
                </p>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Information sur les algorithmes
              </h3>
              <div className="space-y-3 text-sm">
                {(Object.entries(algorithmInfo) as [HashAlgorithm, typeof algorithmInfo[HashAlgorithm]][]).map(
                  ([algo, info]) => (
                    <div key={algo} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 h-2 w-2 rounded-full ${
                          info.secure ? "bg-green-500" : "bg-orange-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{algo}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Common Hashes */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Tests rapides</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInput("")}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Vide
                </button>
                <button
                  onClick={() => setInput("test")}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  test
                </button>
                <button
                  onClick={() => setInput("Hello, World!")}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Hello, World!
                </button>
                <button
                  onClick={() => setInput("password123")}
                  className="rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  password123
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
