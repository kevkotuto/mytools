"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Lock, Unlock, Copy, Check, Key, FileText, Upload, Download, Eye, EyeOff, RefreshCw } from "lucide-react";
import Link from "next/link";

type Mode = "encrypt" | "decrypt";
type InputType = "text" | "file";

export default function EncryptDecryptPage() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [inputType, setInputType] = useState<InputType>("text");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

  // Generate a random password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  // Derive key from password using PBKDF2
  const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt.buffer as ArrayBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  };

  // Encrypt text
  const encryptText = async (text: string, password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  };

  // Decrypt text
  const decryptText = async (encryptedBase64: string, password: string): Promise<string> => {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedBase64).split("").map((c) => c.charCodeAt(0))
    );

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  };

  // Encrypt file
  const encryptFile = async (data: ArrayBuffer, password: string): Promise<ArrayBuffer> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return combined.buffer;
  };

  // Decrypt file
  const decryptFile = async (data: ArrayBuffer, password: string): Promise<ArrayBuffer> => {
    const combined = new Uint8Array(data);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    return crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
  };

  const handleProcess = async () => {
    if (!password) {
      setError("Veuillez entrer un mot de passe");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      if (inputType === "text") {
        if (!inputText) {
          setError("Veuillez entrer du texte");
          setIsProcessing(false);
          return;
        }

        if (mode === "encrypt") {
          const encrypted = await encryptText(inputText, password);
          setOutputText(encrypted);
        } else {
          const decrypted = await decryptText(inputText, password);
          setOutputText(decrypted);
        }
      } else {
        if (!fileData) {
          setError("Veuillez sélectionner un fichier");
          setIsProcessing(false);
          return;
        }

        if (mode === "encrypt") {
          const encrypted = await encryptFile(fileData, password);
          downloadFile(encrypted, fileName + ".encrypted");
        } else {
          const decrypted = await decryptFile(fileData, password);
          const originalName = fileName.replace(".encrypted", "");
          downloadFile(decrypted, originalName);
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        mode === "decrypt"
          ? "Échec du déchiffrement. Vérifiez le mot de passe et les données."
          : "Échec du chiffrement. Veuillez réessayer."
      );
    }

    setIsProcessing(false);
  };

  const downloadFile = (data: ArrayBuffer, filename: string) => {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFileData(reader.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [outputText]);

  const swapInputOutput = () => {
    setInputText(outputText);
    setOutputText("");
    setMode(mode === "encrypt" ? "decrypt" : "encrypt");
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
            <div className="w-10 h-10 bg-emerald-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Encrypt / Decrypt</h1>
              <p className="text-sm text-zinc-500">Chiffrement AES-256-GCM</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("encrypt")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border transition-colors ${
              mode === "encrypt"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <Lock className="w-4 h-4" />
            Chiffrer
          </button>
          <button
            onClick={() => setMode("decrypt")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border transition-colors ${
              mode === "decrypt"
                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <Unlock className="w-4 h-4" />
            Déchiffrer
          </button>
        </div>

        {/* Input Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setInputType("text")}
            className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 border transition-colors ${
              inputType === "text"
                ? "bg-zinc-800 border-zinc-600 text-zinc-100"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            Texte
          </button>
          <button
            onClick={() => setInputType("file")}
            className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 border transition-colors ${
              inputType === "file"
                ? "bg-zinc-800 border-zinc-600 text-zinc-100"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <Upload className="w-4 h-4" />
            Fichier
          </button>
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">
            <Key className="w-4 h-4 inline mr-2" />
            Mot de passe / Clé secrète
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe sécurisé..."
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={generatePassword}
              className="px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Générer
            </button>
          </div>
        </div>

        {/* Input Section */}
        {inputType === "text" ? (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Input Text */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                {mode === "encrypt" ? "Texte à chiffrer" : "Texte chiffré (Base64)"}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={mode === "encrypt" ? "Entrez le texte à chiffrer..." : "Collez le texte chiffré en Base64..."}
                className="w-full h-64 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
              />
            </div>

            {/* Output Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-zinc-400">
                  {mode === "encrypt" ? "Résultat chiffré (Base64)" : "Texte déchiffré"}
                </label>
                <div className="flex gap-2">
                  {outputText && (
                    <>
                      <button
                        onClick={swapInputOutput}
                        className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Inverser
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copié" : "Copier"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <textarea
                value={outputText}
                readOnly
                placeholder="Le résultat apparaîtra ici..."
                className="w-full h-64 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 resize-none font-mono text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-2">
              {mode === "encrypt" ? "Fichier à chiffrer" : "Fichier à déchiffrer (.encrypted)"}
            </label>
            <div className="border-2 border-dashed border-zinc-700 p-8 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="w-12 h-12 text-zinc-500" />
                <span className="text-zinc-400">
                  {fileName || "Cliquez pour sélectionner un fichier"}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className={`w-full py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
            mode === "encrypt"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Traitement en cours...
            </>
          ) : mode === "encrypt" ? (
            <>
              <Lock className="w-5 h-5" />
              Chiffrer
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5" />
              Déchiffrer
            </>
          )}
        </button>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">À propos du chiffrement AES-256-GCM</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span><strong>AES-256-GCM</strong> : Standard de chiffrement avancé avec mode Galois/Counter pour l&apos;authentification</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span><strong>PBKDF2</strong> : Dérivation de clé avec 100 000 itérations pour résister aux attaques par force brute</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span><strong>100% local</strong> : Tout le traitement se fait dans votre navigateur, aucune donnée n&apos;est envoyée</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span><strong>Sel et IV uniques</strong> : Chaque chiffrement utilise un sel et un vecteur d&apos;initialisation aléatoires</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
