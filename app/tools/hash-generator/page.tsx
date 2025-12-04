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

const algorithmInfo: Record<HashAlgorithm, { bits: number; secure: boolean }> = {
  "MD5": { bits: 128, secure: false },
  "SHA-1": { bits: 160, secure: false },
  "SHA-256": { bits: 256, secure: true },
  "SHA-384": { bits: 384, secure: true },
  "SHA-512": { bits: 512, secure: true },
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
    if (algorithm === "MD5") {
      const str = typeof data === "string" ? data : new TextDecoder().decode(data);
      return md5(str);
    }

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

    if (verifyHash.trim()) {
      const normalizedVerify = verifyHash.trim().toLowerCase();
      const match = newResults.some((r) => r.hash.toLowerCase() === normalizedVerify);
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
      {/* Header compact */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Générateur de Hash</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="flex h-[calc(100vh-88px)] flex-col gap-4 lg:flex-row">
          {/* Zone principale - Input + Résultats */}
          <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5">
                <button
                  onClick={() => {
                    setInputMode("text");
                    setFileData(null);
                    setFileInfo(null);
                  }}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    inputMode === "text" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Texte
                </button>
                <button
                  onClick={() => {
                    setInputMode("file");
                    setInput("");
                  }}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    inputMode === "file" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Fichier
                </button>
              </div>

              <div className="flex-1" />

              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                Majuscules
              </label>

              <button
                onClick={handleClear}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Zone d'input */}
            <div className="flex-1 p-4">
              {inputMode === "text" ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Entrez le texte à hasher..."
                  className="h-full w-full resize-none bg-transparent font-mono text-sm focus:outline-none"
                  spellCheck={false}
                />
              ) : (
                <div
                  className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border"
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
                      <CheckCircle className="h-12 w-12 text-green-500" />
                      <p className="text-lg font-medium">{fileInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(fileInfo.size)}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Glissez un fichier ou cliquez</p>
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
                    className="rounded-lg border border-primary bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {fileInfo ? "Changer" : "Sélectionner"}
                  </button>
                </div>
              )}
            </div>

            {/* Résultats */}
            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">Résultats</h2>
                {isHashing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result) => {
                    const info = algorithmInfo[result.algorithm];
                    const displayHash = uppercase ? result.hash.toUpperCase() : result.hash;

                    return (
                      <div key={result.algorithm} className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
                        <div className="flex min-w-[80px] items-center gap-1.5">
                          {!info.secure && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                          <span className="text-xs font-medium">{result.algorithm}</span>
                          <span className="text-[10px] text-muted-foreground">({info.bits})</span>
                        </div>
                        <input
                          type="text"
                          value={displayHash}
                          readOnly
                          className="flex-1 bg-transparent font-mono text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-muted-foreground">{result.time.toFixed(1)}ms</span>
                        <button
                          onClick={() => copyHash(result.hash, result.algorithm)}
                          className="rounded p-1.5 hover:bg-accent"
                        >
                          {copied === result.algorithm ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
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
          </div>

          {/* Panneau de configuration */}
          <div className="flex w-full flex-col gap-4 lg:w-72">
            {/* Algorithmes */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">ALGORITHMES</h3>
              <div className="space-y-1.5">
                {(Object.keys(algorithmInfo) as HashAlgorithm[]).map((algo) => {
                  const info = algorithmInfo[algo];
                  return (
                    <button
                      key={algo}
                      onClick={() => toggleAlgorithm(algo)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selectedAlgorithms.includes(algo)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!info.secure && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                        <span className="font-medium">{algo}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{info.bits} bits</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vérification */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">VÉRIFIER UN HASH</h3>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => {
                  setVerifyHash(e.target.value);
                  setVerifyResult(null);
                }}
                placeholder="Collez un hash..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
              />
              {verifyResult !== null && (
                <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  verifyResult
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {verifyResult ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Correspondance trouvée
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Aucune correspondance
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tests rapides */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">TESTS RAPIDES</h3>
              <div className="flex flex-wrap gap-1.5">
                {["", "test", "Hello, World!", "password123"].map((text, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputMode("text");
                      setInput(text);
                    }}
                    className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    {text || "Vide"}
                  </button>
                ))}
              </div>
            </div>

            {/* Info sécurité */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                SÉCURITÉ
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>SHA-256/384/512 - Sécurisés</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>MD5/SHA-1 - Non sécurisés</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
