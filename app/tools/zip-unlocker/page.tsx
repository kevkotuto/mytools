"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FolderArchive,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Unlock,
  Key,
  Zap,
  BookOpen,
  Settings,
  Play,
  Square,
  File,
  Folder,
  Info,
  Server,
  ShieldAlert,
} from "lucide-react";
import type {
  ArchiveFileInfo,
  ArchiveEntry,
  UnlockProgress,
  UnlockStatus,
  CrackConfig,
  UnlockMethod,
  CharsetOption,
} from "@/types/archive-unlocker";
import {
  commonPasswords,
  defaultCrackConfig,
  methodLabels,
  charsetLabels,
  statusMessages,
} from "@/types/archive-unlocker";

const DISCLAIMER_TEXT = `ATTESTATION SUR L'HONNEUR - CONDITIONS D'UTILISATION

Je soussigné(e), utilisateur de cet outil, atteste sur l'honneur que :

1. PROPRIÉTÉ DU FICHIER
   L'archive ZIP que je m'apprête à traiter m'appartient légitimement, OU j'ai reçu l'autorisation explicite de son propriétaire pour effectuer cette opération.

2. PERTE DU MOT DE PASSE
   J'ai perdu ou oublié le mot de passe de protection de cette archive et j'ai besoin d'y accéder pour des raisons légitimes (travail, données personnelles, archives, etc.).

3. USAGE LICITE
   Je m'engage à utiliser cet outil uniquement à des fins légales et éthiques. Je ne cherche pas à accéder à des données confidentielles appartenant à des tiers sans leur consentement.

4. RESPONSABILITÉ
   Je comprends que l'utilisation de cet outil relève de ma seule responsabilité. L'éditeur de cet outil ne pourra être tenu responsable de toute utilisation abusive ou illégale.

5. TRAITEMENT SERVEUR
   ⚠️ IMPORTANT: Pour des raisons techniques, le fichier sera temporairement envoyé à notre serveur pour le déchiffrement. Le fichier sera supprimé immédiatement après traitement et ne sera jamais stocké.

6. LIMITATIONS
   Je comprends que cet outil utilise des techniques de dictionnaire et force brute limitées. Les mots de passe complexes ou longs peuvent ne pas être trouvés.

⚠️ AVERTISSEMENT LÉGAL
L'accès non autorisé à des fichiers protégés peut constituer une infraction selon les lois en vigueur dans votre pays. En cas de doute sur la légitimité de votre démarche, consultez un conseiller juridique.

En cliquant sur "J'accepte les conditions", vous confirmez avoir lu, compris et accepté l'intégralité de ces conditions.`;

// ZIP encryption detection constants
const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_ENCRYPTION_FLAG = 0x0001;

export default function ZipUnlockerPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serverWarningAccepted, setServerWarningAccepted] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<ArchiveFileInfo | null>(null);
  const [config, setConfig] = useState<CrackConfig>(defaultCrackConfig);
  const [progress, setProgress] = useState<UnlockProgress>({
    status: "idle",
    step: "",
    progress: 0,
    attemptedPasswords: 0,
  });
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [isCracking, setIsCracking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = (updates: Partial<UnlockProgress>) => {
    setProgress((prev) => ({ ...prev, ...updates }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".zip"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(extension)) {
      updateProgress({
        status: "error",
        error: "Format non supporté. Seuls les fichiers .zip sont acceptés.",
      });
      return;
    }

    setOriginalFile(file);
    setUnlockedBlob(null);
    setConfig(defaultCrackConfig);
    setServerWarningAccepted(false);

    await analyzeArchive(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const analyzeArchive = async (file: File) => {
    try {
      updateProgress({
        status: "analyzing",
        step: "Analyse de l'archive...",
        progress: 10,
        attemptedPasswords: 0,
        foundPassword: undefined,
        error: undefined,
      });

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      updateProgress({ step: "Lecture de la structure...", progress: 30 });

      // Check ZIP signature and encryption flag
      let isEncrypted = false;
      const entries: ArchiveEntry[] = [];

      // Parse ZIP local file headers to detect encryption
      let offset = 0;
      while (offset < bytes.length - 30) {
        const signature =
          bytes[offset] |
          (bytes[offset + 1] << 8) |
          (bytes[offset + 2] << 16) |
          (bytes[offset + 3] << 24);

        if (signature !== ZIP_LOCAL_FILE_HEADER) break;

        const flags = bytes[offset + 6] | (bytes[offset + 7] << 8);
        const compressedSize =
          bytes[offset + 18] |
          (bytes[offset + 19] << 8) |
          (bytes[offset + 20] << 16) |
          (bytes[offset + 21] << 24);
        const uncompressedSize =
          bytes[offset + 22] |
          (bytes[offset + 23] << 8) |
          (bytes[offset + 24] << 16) |
          (bytes[offset + 25] << 24);
        const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

        const fileNameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength);
        const fileName = new TextDecoder().decode(fileNameBytes);

        const fileEncrypted = (flags & ZIP_ENCRYPTION_FLAG) !== 0;
        if (fileEncrypted) isEncrypted = true;

        entries.push({
          name: fileName,
          size: uncompressedSize,
          compressedSize: compressedSize,
          isDirectory: fileName.endsWith("/"),
          isEncrypted: fileEncrypted,
        });

        // Move to next header
        offset += 30 + fileNameLength + extraFieldLength + compressedSize;
      }

      updateProgress({ step: "Analyse terminée", progress: 100 });

      setFileInfo({
        name: file.name,
        size: file.size,
        type: "zip",
        isEncrypted,
        fileCount: entries.length,
        files: entries,
      });

      if (!isEncrypted) {
        updateProgress({
          status: "complete",
          step: "Cette archive n'est pas protégée par mot de passe",
          progress: 100,
          foundPassword: "(aucun)",
        });
      } else {
        updateProgress({
          status: "accepted",
          step: "Archive protégée - Prêt pour le déverrouillage",
          progress: 0,
        });
      }
    } catch (error) {
      console.error("Error analyzing archive:", error);
      updateProgress({
        status: "error",
        step: "Erreur",
        error: error instanceof Error ? error.message : "Erreur lors de l'analyse de l'archive",
      });
    }
  };

  const crackPassword = useCallback(async () => {
    if (!originalFile || !fileInfo?.isEncrypted) return;

    setIsCracking(true);
    abortControllerRef.current = new AbortController();

    try {
      updateProgress({
        status: "cracking",
        step: "Envoi au serveur pour traitement...",
        progress: 10,
        attemptedPasswords: 0,
      });

      const formData = new FormData();
      formData.append("file", originalFile);
      formData.append("method", config.method);
      formData.append("maxLength", config.maxLength.toString());
      formData.append("charset", config.charset.join(","));
      formData.append("useCommonPasswords", config.useCommonPasswords.toString());
      if (config.knownPassword) {
        formData.append("knownPassword", config.knownPassword);
      }

      updateProgress({
        step: "Traitement en cours sur le serveur...",
        progress: 30,
      });

      const response = await fetch("/api/tools/zip-unlocker", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur serveur");
      }

      const result = await response.json();

      if (result.success && result.password) {
        updateProgress({
          status: "extracting",
          step: "Téléchargement du fichier déverrouillé...",
          progress: 80,
          foundPassword: result.password,
          attemptedPasswords: result.attemptedPasswords || 0,
        });

        // Download the unlocked file
        if (result.downloadUrl) {
          const downloadResponse = await fetch(result.downloadUrl);
          const blob = await downloadResponse.blob();
          setUnlockedBlob(blob);
        }

        updateProgress({
          status: "complete",
          step: "Mot de passe trouvé !",
          progress: 100,
          foundPassword: result.password,
          attemptedPasswords: result.attemptedPasswords || 0,
        });
      } else {
        updateProgress({
          status: "failed",
          step: "Mot de passe non trouvé",
          progress: 100,
          attemptedPasswords: result.attemptedPasswords || 0,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updateProgress({
          status: "accepted",
          step: "Recherche annulée",
        });
      } else {
        console.error("Error cracking password:", error);
        updateProgress({
          status: "error",
          step: "Erreur",
          error: error instanceof Error ? error.message : "Erreur lors du déverrouillage",
        });
      }
    } finally {
      setIsCracking(false);
      abortControllerRef.current = null;
    }
  }, [originalFile, fileInfo, config]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDownload = () => {
    if (!unlockedBlob || !fileInfo) return;

    const baseName = fileInfo.name.replace(/\.zip$/i, "");
    const fileName = `${baseName}_unlocked.zip`;

    const url = URL.createObjectURL(unlockedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setOriginalFile(null);
    setFileInfo(null);
    setUnlockedBlob(null);
    setConfig(defaultCrackConfig);
    setServerWarningAccepted(false);
    updateProgress({
      status: "idle",
      step: "",
      progress: 0,
      attemptedPasswords: 0,
      foundPassword: undefined,
      currentPassword: undefined,
      error: undefined,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: UnlockStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "idle":
      case "accepted":
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const toggleCharset = (charset: CharsetOption) => {
    setConfig((prev) => ({
      ...prev,
      charset: prev.charset.includes(charset)
        ? prev.charset.filter((c) => c !== charset)
        : [...prev.charset, charset],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux outils
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <FolderArchive className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Déverrouilleur ZIP</h1>
          </div>
          <p className="text-muted-foreground">
            Récupérez l&apos;accès à vos archives ZIP protégées par mot de passe.
          </p>
        </div>

        {/* Terms and Conditions */}
        {!termsAccepted && (
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Conditions d&apos;utilisation</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-6 max-h-[400px] overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {DISCLAIMER_TEXT}
                </pre>
              </div>
              <button
                onClick={() => setTermsAccepted(true)}
                className="w-full rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                J&apos;accepte les conditions
              </button>
            </div>
          </div>
        )}

        {/* Main Tool Interface */}
        {termsAccepted && (
          <div className="space-y-6">
            {/* Server Processing Warning */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <div className="flex items-start gap-3">
                <Server className="mt-0.5 h-5 w-5 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">
                    Traitement côté serveur
                  </h3>
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                    Pour des raisons techniques, le déchiffrement ZIP nécessite un traitement serveur.
                    Votre fichier sera envoyé de manière sécurisée, traité, puis <strong>immédiatement supprimé</strong>.
                    Aucune donnée n&apos;est conservée.
                  </p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-medium">Méthodes de déverrouillage</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Dictionnaire</p>
                    <p className="text-xs text-muted-foreground">
                      Test de mots de passe courants
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Force brute</p>
                    <p className="text-xs text-muted-foreground">
                      Test de toutes les combinaisons
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Key className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Mot de passe connu</p>
                    <p className="text-xs text-muted-foreground">
                      Vérifier un mot de passe
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            {!originalFile && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 transition-colors hover:border-primary/50"
              >
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">Glissez votre archive ZIP ici</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  ou cliquez pour sélectionner
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-primary bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  Sélectionner un fichier
                </button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Fichiers .zip uniquement (max 100 MB)
                </p>
              </div>
            )}

            {/* File Selected */}
            {originalFile && fileInfo && (
              <div className="space-y-4">
                {/* File Info */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <FolderArchive className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{fileInfo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(fileInfo.size)} • {fileInfo.fileCount} fichiers
                          {fileInfo.isEncrypted && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                              <Lock className="h-3 w-3" /> Protégé
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      disabled={isCracking}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      Changer
                    </button>
                  </div>
                </div>

                {/* Files list */}
                {fileInfo.files && fileInfo.files.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="mb-3 font-medium">Contenu de l&apos;archive</h3>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {fileInfo.files.slice(0, 20).map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          {file.isDirectory ? (
                            <Folder className="h-4 w-4" />
                          ) : (
                            <File className="h-4 w-4" />
                          )}
                          <span className="truncate flex-1">{file.name}</span>
                          {file.isEncrypted && (
                            <Lock className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="text-xs">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                      {fileInfo.files.length > 20 && (
                        <p className="text-xs text-muted-foreground">
                          ... et {fileInfo.files.length - 20} autres fichiers
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Server Warning Confirmation */}
                {fileInfo.isEncrypted && progress.status === "accepted" && !serverWarningAccepted && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-700 dark:text-amber-300">
                          Confirmation requise
                        </h3>
                        <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                          Votre fichier <strong>{fileInfo.name}</strong> ({formatFileSize(fileInfo.size)})
                          sera envoyé à notre serveur pour le traitement.
                          Confirmez-vous vouloir continuer ?
                        </p>
                        <button
                          onClick={() => setServerWarningAccepted(true)}
                          className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                        >
                          Oui, envoyer mon fichier
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuration */}
                {fileInfo.isEncrypted && progress.status === "accepted" && serverWarningAccepted && (
                  <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border p-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">Configuration</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Method selection */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Méthode de déverrouillage
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.keys(methodLabels) as UnlockMethod[]).map((method) => (
                            <button
                              key={method}
                              onClick={() => setConfig((prev) => ({ ...prev, method }))}
                              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                config.method === method
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "border-border bg-background hover:bg-accent"
                              }`}
                            >
                              {methodLabels[method]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Known password input */}
                      {config.method === "known" && (
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Mot de passe à tester
                          </label>
                          <input
                            type="text"
                            value={config.knownPassword || ""}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, knownPassword: e.target.value }))
                            }
                            placeholder="Entrez le mot de passe..."
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      )}

                      {/* Bruteforce options */}
                      {config.method === "bruteforce" && (
                        <>
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Caractères à utiliser
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(Object.keys(charsetLabels) as CharsetOption[]).map((charset) => (
                                <button
                                  key={charset}
                                  onClick={() => toggleCharset(charset)}
                                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                    config.charset.includes(charset)
                                      ? "border-primary bg-primary/5 font-medium"
                                      : "border-border bg-background hover:bg-accent"
                                  }`}
                                >
                                  {charsetLabels[charset]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium">Longueur maximale</span>
                              <span className="text-muted-foreground">{config.maxLength} caractères</span>
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="8"
                              value={config.maxLength}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  maxLength: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}

                      {/* Dictionary options */}
                      {config.method === "dictionary" && (
                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={config.useCommonPasswords}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  useCommonPasswords: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-border"
                            />
                            <span className="text-sm">
                              Utiliser le dictionnaire ({commonPasswords.length}+ mots de passe)
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {(progress.status === "cracking" || progress.status === "extracting") && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(progress.status)}
                        <span className="font-medium">{statusMessages[progress.status]}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{progress.progress}%</span>
                    </div>
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{progress.step}</p>
                  </div>
                )}

                {/* Result */}
                {progress.status === "complete" && progress.foundPassword && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                    <div className="flex items-center gap-2 mb-2">
                      <Unlock className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        {progress.foundPassword === "(aucun)"
                          ? "Archive non protégée"
                          : "Mot de passe trouvé !"}
                      </span>
                    </div>
                    {progress.foundPassword !== "(aucun)" && (
                      <div className="rounded-lg border border-green-300 bg-white p-3 font-mono text-lg dark:bg-green-900">
                        {progress.foundPassword}
                      </div>
                    )}
                    {progress.attemptedPasswords > 0 && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        {progress.attemptedPasswords.toLocaleString()} mots de passe testés
                      </p>
                    )}
                  </div>
                )}

                {progress.status === "failed" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-amber-700 dark:text-amber-300">
                        Mot de passe non trouvé
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                      {progress.attemptedPasswords.toLocaleString()} mots de passe testés.
                      Le mot de passe est probablement trop complexe ou long.
                    </p>
                  </div>
                )}

                {/* Error */}
                {progress.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <p className="text-sm text-red-600 dark:text-red-400">{progress.error}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {progress.status === "accepted" && fileInfo.isEncrypted && serverWarningAccepted && (
                    <button
                      onClick={crackPassword}
                      disabled={config.method === "known" && !config.knownPassword}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      <Play className="h-5 w-5" />
                      Lancer le déverrouillage
                    </button>
                  )}

                  {isCracking && (
                    <button
                      onClick={handleStop}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500 bg-red-500 px-6 py-3 font-medium text-white transition-colors hover:opacity-90"
                    >
                      <Square className="h-5 w-5" />
                      Arrêter
                    </button>
                  )}

                  {progress.status === "complete" && unlockedBlob && (
                    <>
                      <button
                        onClick={handleDownload}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
                      >
                        <Download className="h-5 w-5" />
                        Télécharger l&apos;archive déverrouillée
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-medium transition-colors hover:bg-accent"
                      >
                        Nouveau fichier
                      </button>
                    </>
                  )}

                  {(progress.status === "failed" || progress.status === "error") && (
                    <button
                      onClick={handleReset}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-medium transition-colors hover:bg-accent"
                    >
                      Réessayer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 font-medium">Informations</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Les fichiers sont traités sur notre serveur et supprimés immédiatement après</li>
                <li>Taille maximale : 100 MB</li>
                <li>Le temps de traitement dépend de la complexité du mot de passe</li>
                <li>Les mots de passe longs ({">"}8 caractères) peuvent ne pas être trouvés</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
