"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Unlock,
  Printer,
  Copy,
  Edit3,
  Server,
  ShieldAlert,
  Eye,
  Ban,
} from "lucide-react";
import type {
  PdfFileInfo,
  PdfRestriction,
  UnlockProgress,
  UnlockStatus,
} from "@/types/pdf-unlocker";
import { restrictionLabels, statusMessages } from "@/types/pdf-unlocker";

const DISCLAIMER_TEXT = `ATTESTATION SUR L'HONNEUR - CONDITIONS D'UTILISATION

Je soussigné(e), utilisateur de cet outil, atteste sur l'honneur que :

1. PROPRIÉTÉ DU FICHIER
   Le fichier PDF que je m'apprête à traiter m'appartient légitimement, OU j'ai reçu l'autorisation explicite de son propriétaire pour effectuer cette opération.

2. RESTRICTIONS LÉGITIMES
   Je comprends que les restrictions sur ce PDF ont pu être mises en place pour des raisons légitimes (protection des droits d'auteur, confidentialité, etc.). Je m'engage à respecter ces considérations.

3. USAGE LICITE
   Je m'engage à utiliser cet outil uniquement à des fins légales et éthiques. Je ne cherche pas à contourner des protections pour violer les droits d'auteur ou accéder à du contenu de manière illégale.

4. RESPONSABILITÉ
   Je comprends que l'utilisation de cet outil relève de ma seule responsabilité. L'éditeur de cet outil ne pourra être tenu responsable de toute utilisation abusive ou illégale.

5. TRAITEMENT SERVEUR
   ⚠️ IMPORTANT : Ce déverrouilleur nécessite un traitement côté serveur. Votre fichier sera temporairement envoyé à notre serveur pour le traitement, puis automatiquement supprimé.

6. LIMITATIONS
   Cet outil peut supprimer les restrictions d'impression, copie et modification (owner password). Si le PDF nécessite un mot de passe pour être ouvert (user password), vous devrez le fournir.

⚠️ AVERTISSEMENT LÉGAL
Le contournement de mesures de protection peut constituer une infraction selon les lois en vigueur dans votre pays. En cas de doute sur la légitimité de votre démarche, consultez un conseiller juridique.

En cliquant sur "J'accepte les conditions", vous confirmez avoir lu, compris et accepté l'intégralité de ces conditions.`;

const restrictionIcons: Record<string, React.ElementType> = {
  print: Printer,
  modify: Edit3,
  copy: Copy,
  annotate: Edit3,
  "fill-forms": Edit3,
  extract: Copy,
  assemble: Edit3,
  "print-high-res": Printer,
};

export default function PdfUnlockerPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serverConfirmed, setServerConfirmed] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<PdfFileInfo | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [progress, setProgress] = useState<UnlockProgress>({
    status: "idle",
    step: "",
    progress: 0,
  });
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = (updates: Partial<UnlockProgress>) => {
    setProgress((prev) => ({ ...prev, ...updates }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      updateProgress({
        status: "error",
        error: "Format non supporté. Seuls les fichiers PDF sont acceptés.",
      });
      return;
    }

    setOriginalFile(file);
    setUnlockedBlob(null);
    setUserPassword("");
    setRequiresPassword(false);
    setServerConfirmed(false);

    await analyzeFile(file);
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

  const analyzeFile = async (file: File) => {
    setIsProcessing(true);

    try {
      updateProgress({
        status: "analyzing",
        step: "Analyse du PDF...",
        progress: 20,
        error: undefined,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "analyze");

      const response = await fetch("/api/tools/pdf-unlocker", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const data = await response.json();

      updateProgress({ step: "Analyse terminée", progress: 100 });

      setFileInfo({
        name: file.name,
        size: file.size,
        isEncrypted: data.isEncrypted,
        hasUserPassword: data.hasUserPassword,
        hasOwnerPassword: data.hasOwnerPassword,
        restrictions: data.restrictions as PdfRestriction[],
      });

      if (data.hasUserPassword) {
        setRequiresPassword(true);
      }

      if (!data.isEncrypted) {
        updateProgress({
          status: "complete",
          step: "Ce PDF n'a aucune restriction",
          progress: 100,
        });
      } else if (data.restrictions.length === 0 && !data.hasUserPassword) {
        updateProgress({
          status: "complete",
          step: "Ce PDF n'a pas de restrictions détectées",
          progress: 100,
        });
      } else {
        updateProgress({
          status: "accepted",
          step: "PDF avec restrictions - Prêt pour le déverrouillage",
          progress: 0,
        });
      }
    } catch (error) {
      console.error("Error analyzing file:", error);
      updateProgress({
        status: "error",
        step: "Erreur",
        error: error instanceof Error ? error.message : "Erreur lors de l'analyse",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const unlockPdf = async () => {
    if (!originalFile || !fileInfo) return;

    setIsProcessing(true);

    try {
      updateProgress({
        status: "unlocking",
        step: "Envoi au serveur...",
        progress: 20,
      });

      const formData = new FormData();
      formData.append("file", originalFile);
      formData.append("action", "unlock");
      if (userPassword) {
        formData.append("userPassword", userPassword);
      }

      updateProgress({
        step: "Suppression des restrictions...",
        progress: 50,
      });

      const response = await fetch("/api/tools/pdf-unlocker", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.requiresPassword) {
          setRequiresPassword(true);
          updateProgress({
            status: "accepted",
            step: "Mot de passe requis",
            error: errorData.message,
          });
          return;
        }

        throw new Error(errorData.message || errorData.error || "Erreur serveur");
      }

      const blob = await response.blob();
      setUnlockedBlob(blob);

      const removedRestrictions = response.headers.get("X-Removed-Restrictions") || "";

      updateProgress({
        status: "complete",
        step: `Restrictions supprimées : ${removedRestrictions || "toutes"}`,
        progress: 100,
      });
    } catch (error) {
      console.error("Error unlocking PDF:", error);
      updateProgress({
        status: "error",
        step: "Erreur",
        error: error instanceof Error ? error.message : "Erreur lors du déverrouillage",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!unlockedBlob || !fileInfo) return;

    const fileName = fileInfo.name.replace(/\.pdf$/i, "_unlocked.pdf");

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
    setUserPassword("");
    setRequiresPassword(false);
    setServerConfirmed(false);
    updateProgress({
      status: "idle",
      step: "",
      progress: 0,
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
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Déverrouilleur PDF</h1>
          </div>
          <p className="text-muted-foreground">
            Supprimez les restrictions d&apos;impression, copie et modification de vos PDF.
          </p>
        </div>

        {/* Server Processing Warning */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <Server className="mt-0.5 h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300">
                Traitement côté serveur
              </h3>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                La suppression des restrictions PDF nécessite un traitement côté serveur.
                Votre fichier sera temporairement traité puis automatiquement supprimé.
                Aucune donnée n&apos;est conservée.
              </p>
            </div>
          </div>
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
            {/* Info about what this tool does */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-medium">Ce que cet outil peut faire</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <Printer className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Débloquer l&apos;impression</p>
                    <p className="text-xs text-muted-foreground">
                      Supprimer les restrictions d&apos;impression
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Copy className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Débloquer la copie</p>
                    <p className="text-xs text-muted-foreground">
                      Permettre la copie de texte
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Edit3 className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Débloquer la modification</p>
                    <p className="text-xs text-muted-foreground">
                      Permettre les annotations et modifications
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
                <p className="mb-2 text-lg font-medium">Glissez votre PDF ici</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  ou cliquez pour sélectionner
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
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
                  Fichiers PDF uniquement
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
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{fileInfo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(fileInfo.size)}
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
                      disabled={isProcessing}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      Changer
                    </button>
                  </div>
                </div>

                {/* Detected Restrictions */}
                {fileInfo.isEncrypted && fileInfo.restrictions.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <div className="flex items-center gap-2 mb-3">
                      <Ban className="h-5 w-5 text-amber-500" />
                      <h3 className="font-medium text-amber-700 dark:text-amber-300">
                        Restrictions détectées
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fileInfo.restrictions.map((restriction) => {
                        const Icon = restrictionIcons[restriction] || Ban;
                        return (
                          <span
                            key={restriction}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          >
                            <Icon className="h-3 w-3" />
                            {restrictionLabels[restriction] || restriction}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* User Password Required */}
                {requiresPassword && progress.status !== "complete" && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">Mot de passe requis</h3>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Ce PDF nécessite un mot de passe pour être ouvert. Entrez-le ci-dessous :
                    </p>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Mot de passe du PDF..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {/* Server Confirmation */}
                {fileInfo.isEncrypted &&
                  progress.status === "accepted" &&
                  !serverConfirmed &&
                  (!requiresPassword || userPassword) && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-500 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-medium text-amber-700 dark:text-amber-300">
                            Confirmation requise
                          </h3>
                          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                            Votre fichier &quot;{fileInfo.name}&quot; ({formatFileSize(fileInfo.size)})
                            va être envoyé à notre serveur pour supprimer les restrictions.
                            Le fichier sera automatiquement supprimé après le traitement.
                          </p>
                          <button
                            onClick={() => setServerConfirmed(true)}
                            className="mt-3 rounded-lg border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                          >
                            J&apos;accepte l&apos;envoi au serveur
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Progress */}
                {(progress.status === "analyzing" || progress.status === "unlocking") && (
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
                {progress.status === "complete" && unlockedBlob && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                    <div className="flex items-center gap-2 mb-2">
                      <Unlock className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        Restrictions supprimées !
                      </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {progress.step}
                    </p>
                  </div>
                )}

                {/* No restrictions */}
                {progress.status === "complete" && !unlockedBlob && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        {progress.step}
                      </span>
                    </div>
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
                  {progress.status === "accepted" &&
                    fileInfo.isEncrypted &&
                    serverConfirmed &&
                    (!requiresPassword || userPassword) && (
                      <button
                        onClick={unlockPdf}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                      >
                        <Unlock className="h-5 w-5" />
                        Supprimer les restrictions
                      </button>
                    )}

                  {isProcessing && (
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-6 py-3 font-medium text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Traitement en cours...
                    </div>
                  )}

                  {progress.status === "complete" && unlockedBlob && (
                    <>
                      <button
                        onClick={handleDownload}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
                      >
                        <Download className="h-5 w-5" />
                        Télécharger le PDF
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
              <h3 className="mb-2 font-medium">Comment ça marche</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Les PDF ont deux types de protection : <strong>owner password</strong> (restrictions) et <strong>user password</strong> (ouverture)</li>
                <li>Cet outil supprime les restrictions (impression, copie, modification) sans connaître le mot de passe propriétaire</li>
                <li>Si le PDF nécessite un mot de passe pour s&apos;ouvrir, vous devrez le fournir</li>
                <li>Le fichier déverrouillé est identique à l&apos;original, sans les restrictions</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
