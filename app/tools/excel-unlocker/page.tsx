"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileCheck,
  Lock,
  Unlock,
  Search,
  Check,
  Square,
  CheckSquare,
} from "lucide-react";
import JSZip from "jszip";
import type {
  ExcelFileInfo,
  UnlockProgress,
  ProtectionInfo,
  UnlockStatus,
} from "@/types/excel-unlocker";
import { protectionTypeLabels, statusMessages } from "@/types/excel-unlocker";

const DISCLAIMER_TEXT = `ATTESTATION SUR L'HONNEUR - CONDITIONS D'UTILISATION

Je soussigné(e), utilisateur de cet outil, atteste sur l'honneur que :

1. PROPRIÉTÉ DU FICHIER
   Le fichier Excel que je m'apprête à traiter m'appartient légitimement, OU j'ai reçu l'autorisation explicite de son propriétaire pour effectuer cette opération.

2. PERTE DU MOT DE PASSE
   J'ai perdu ou oublié le mot de passe de protection de ce fichier et j'ai besoin d'y accéder pour des raisons légitimes (travail, données personnelles, archives, etc.).

3. USAGE LICITE
   Je m'engage à utiliser cet outil uniquement à des fins légales et éthiques. Je ne cherche pas à accéder à des données confidentielles appartenant à des tiers sans leur consentement.

4. RESPONSABILITÉ
   Je comprends que l'utilisation de cet outil relève de ma seule responsabilité. L'éditeur de cet outil ne pourra être tenu responsable de toute utilisation abusive ou illégale.

5. DONNÉES LOCALES
   Je comprends que le traitement s'effectue entièrement dans mon navigateur. Aucun fichier n'est envoyé à un serveur externe.

⚠️ AVERTISSEMENT LÉGAL
L'accès non autorisé à des fichiers protégés peut constituer une infraction selon les lois en vigueur dans votre pays. En cas de doute sur la légitimité de votre démarche, consultez un conseiller juridique.

En cliquant sur "J'accepte les conditions", vous confirmez avoir lu, compris et accepté l'intégralité de ces conditions.`;

interface SheetInfo {
  id: string;
  name: string;
  path: string;
  isProtected: boolean;
  selected: boolean;
}

interface WorkbookAnalysis {
  sheets: SheetInfo[];
  hasWorkbookProtection: boolean;
  hasStructureProtection: boolean;
  hasVbaProtection: boolean;
  zip: JSZip;
}

export default function ExcelUnlockerPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<ExcelFileInfo | null>(null);
  const [analysis, setAnalysis] = useState<WorkbookAnalysis | null>(null);
  const [unlockWorkbook, setUnlockWorkbook] = useState(true);
  const [unlockStructure, setUnlockStructure] = useState(true);
  const [progress, setProgress] = useState<UnlockProgress>({
    status: "idle",
    step: "",
    progress: 0,
    protectionsFound: [],
  });
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = (updates: Partial<UnlockProgress>) => {
    setProgress((prev) => ({ ...prev, ...updates }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".xlsx"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      updateProgress({
        status: "error",
        error: "Format non supporté. Seuls les fichiers .xlsx sont acceptés.",
      });
      return;
    }

    setOriginalFile(file);
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    setUnlockedBlob(null);
    setAnalysis(null);

    // Start analysis
    await analyzeExcel(file);
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

  const analyzeExcel = async (file: File) => {
    try {
      updateProgress({
        status: "analyzing",
        step: "Analyse du fichier...",
        progress: 10,
        protectionsFound: [],
        error: undefined,
      });

      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      updateProgress({ step: "Lecture de la structure...", progress: 30 });

      // Read workbook.xml to get sheet names
      const workbookPath = "xl/workbook.xml";
      const workbookFile = zip.file(workbookPath);
      const sheets: SheetInfo[] = [];

      if (workbookFile) {
        const workbookContent = await workbookFile.async("string");

        // Extract sheet names from workbook.xml
        const sheetRegex = /<sheet[^>]+name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/?>/gi;
        let match;
        let index = 1;

        while ((match = sheetRegex.exec(workbookContent)) !== null) {
          const sheetName = match[1];
          const sheetPath = `xl/worksheets/sheet${index}.xml`;

          // Check if sheet file exists and is protected
          const sheetFile = zip.file(sheetPath);
          let isProtected = false;

          if (sheetFile) {
            const sheetContent = await sheetFile.async("string");
            isProtected = /<sheetProtection[^>]*\/?>/i.test(sheetContent);
          }

          sheets.push({
            id: `sheet${index}`,
            name: sheetName,
            path: sheetPath,
            isProtected,
            selected: isProtected, // Pre-select protected sheets
          });

          index++;
        }
      }

      updateProgress({ step: "Détection des protections...", progress: 60 });

      // Check workbook protection
      let hasWorkbookProtection = false;
      let hasStructureProtection = false;

      if (workbookFile) {
        const workbookContent = await workbookFile.async("string");
        hasWorkbookProtection = /<workbookProtection[^>]*\/?>/i.test(workbookContent);
        hasStructureProtection = /<fileSharing[^>]*\/?>/i.test(workbookContent);
      }

      // Check VBA protection
      const vbaPath = "xl/vbaProject.bin";
      const hasVbaProtection = zip.file(vbaPath) !== null;

      updateProgress({ step: "Analyse terminée", progress: 100 });

      setAnalysis({
        sheets,
        hasWorkbookProtection,
        hasStructureProtection,
        hasVbaProtection,
        zip,
      });

      setUnlockWorkbook(hasWorkbookProtection);
      setUnlockStructure(hasStructureProtection);

      updateProgress({
        status: "accepted",
        step: "Prêt pour le traitement",
        progress: 0,
      });
    } catch (error) {
      console.error("Error analyzing Excel:", error);
      updateProgress({
        status: "error",
        step: "Erreur",
        error: error instanceof Error ? error.message : "Erreur lors de l'analyse du fichier",
      });
    }
  };

  const toggleSheetSelection = (sheetId: string) => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      sheets: analysis.sheets.map((sheet) =>
        sheet.id === sheetId ? { ...sheet, selected: !sheet.selected } : sheet
      ),
    });
  };

  const selectAllProtectedSheets = () => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      sheets: analysis.sheets.map((sheet) => ({
        ...sheet,
        selected: sheet.isProtected,
      })),
    });
  };

  const deselectAllSheets = () => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      sheets: analysis.sheets.map((sheet) => ({
        ...sheet,
        selected: false,
      })),
    });
  };

  const hasAnyProtection = analysis && (
    analysis.hasWorkbookProtection ||
    analysis.hasStructureProtection ||
    analysis.sheets.some((s) => s.isProtected)
  );

  const hasSelectedItems = analysis && (
    (analysis.hasWorkbookProtection && unlockWorkbook) ||
    (analysis.hasStructureProtection && unlockStructure) ||
    analysis.sheets.some((s) => s.selected)
  );

  const removeSheetProtection = (xmlContent: string): { modified: string; found: boolean } => {
    const sheetProtectionRegex = /<sheetProtection[^>]*\/?>(<\/sheetProtection>)?/gi;
    const found = sheetProtectionRegex.test(xmlContent);
    const modified = xmlContent.replace(sheetProtectionRegex, "");
    return { modified, found };
  };

  const removeWorkbookProtection = (xmlContent: string): { modified: string; foundProtection: boolean; foundStructure: boolean } => {
    const workbookProtectionRegex = /<workbookProtection[^>]*\/?>(<\/workbookProtection>)?/gi;
    const foundProtection = workbookProtectionRegex.test(xmlContent);
    const fileSharingRegex = /<fileSharing[^>]*\/?>(<\/fileSharing>)?/gi;
    const foundStructure = fileSharingRegex.test(xmlContent);

    let modified = xmlContent.replace(workbookProtectionRegex, "");
    modified = modified.replace(fileSharingRegex, "");

    return { modified, foundProtection, foundStructure };
  };

  const processExcel = useCallback(async () => {
    if (!analysis) return;

    try {
      updateProgress({
        status: "processing",
        step: "Traitement en cours...",
        progress: 10,
        protectionsFound: [],
      });

      const zip = analysis.zip;
      const protectionsFound: ProtectionInfo[] = [];

      // Process workbook.xml for workbook-level protection
      if ((unlockWorkbook && analysis.hasWorkbookProtection) ||
          (unlockStructure && analysis.hasStructureProtection)) {
        const workbookPath = "xl/workbook.xml";
        const workbookFile = zip.file(workbookPath);

        if (workbookFile) {
          let workbookContent = await workbookFile.async("string");
          let modified = false;

          if (unlockWorkbook && analysis.hasWorkbookProtection) {
            const workbookProtectionRegex = /<workbookProtection[^>]*\/?>(<\/workbookProtection>)?/gi;
            if (workbookProtectionRegex.test(workbookContent)) {
              workbookContent = workbookContent.replace(workbookProtectionRegex, "");
              modified = true;
              protectionsFound.push({
                type: "workbook",
                location: workbookPath,
                removed: true,
              });
            }
          }

          if (unlockStructure && analysis.hasStructureProtection) {
            const fileSharingRegex = /<fileSharing[^>]*\/?>(<\/fileSharing>)?/gi;
            if (fileSharingRegex.test(workbookContent)) {
              workbookContent = workbookContent.replace(fileSharingRegex, "");
              modified = true;
              protectionsFound.push({
                type: "workbook_structure",
                location: workbookPath,
                removed: true,
              });
            }
          }

          if (modified) {
            zip.file(workbookPath, workbookContent);
          }
        }
      }

      updateProgress({
        step: "Traitement des feuilles sélectionnées...",
        progress: 30,
        protectionsFound: [...protectionsFound],
      });

      // Process selected sheets
      const selectedSheets = analysis.sheets.filter((s) => s.selected && s.isProtected);

      for (let i = 0; i < selectedSheets.length; i++) {
        const sheet = selectedSheets[i];
        const sheetFile = zip.file(sheet.path);

        if (sheetFile) {
          const sheetContent = await sheetFile.async("string");
          const { modified, found } = removeSheetProtection(sheetContent);

          if (found) {
            protectionsFound.push({
              type: "sheet",
              location: `${sheet.name} (${sheet.path})`,
              removed: true,
            });
            zip.file(sheet.path, modified);
          }
        }

        const progressValue = 30 + Math.round(((i + 1) / selectedSheets.length) * 50);
        updateProgress({
          step: `Traitement de "${sheet.name}"...`,
          progress: progressValue,
          protectionsFound: [...protectionsFound],
        });
      }

      // Note VBA protection if present (not removed)
      if (analysis.hasVbaProtection) {
        protectionsFound.push({
          type: "vba",
          location: "xl/vbaProject.bin",
          removed: false,
        });
      }

      updateProgress({
        step: "Génération du fichier...",
        progress: 90,
        protectionsFound: [...protectionsFound],
      });

      // Generate the modified file
      const modifiedContent = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      setUnlockedBlob(modifiedContent);

      updateProgress({
        status: "complete",
        step: "Traitement terminé",
        progress: 100,
        protectionsFound: [...protectionsFound],
      });
    } catch (error) {
      console.error("Error processing Excel:", error);
      updateProgress({
        status: "error",
        step: "Erreur",
        error: error instanceof Error ? error.message : "Erreur lors du traitement du fichier",
      });
    }
  }, [analysis, unlockWorkbook, unlockStructure]);

  const handleDownload = () => {
    if (!unlockedBlob || !fileInfo) return;

    const baseName = fileInfo.name.replace(/\.xlsx$/i, "");
    const fileName = `${baseName}_unlocked.xlsx`;

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
    setAnalysis(null);
    setUnlockWorkbook(true);
    setUnlockStructure(true);
    updateProgress({
      status: "idle",
      step: "",
      progress: 0,
      protectionsFound: [],
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
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "idle":
      case "accepted":
        return <Shield className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const isProcessing = ["uploading", "analyzing", "processing"].includes(progress.status);
  const isAnalyzing = progress.status === "analyzing";

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
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Déverrouilleur Excel</h1>
          </div>
          <p className="text-muted-foreground">
            Supprimez les protections de vos fichiers Excel (.xlsx) en quelques secondes.
            Tout le traitement se fait localement dans votre navigateur.
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
            {/* Supported formats info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-medium">Formats et protections supportés</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Formats acceptés</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      Excel 2007+ (.xlsx)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Protections supprimées</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <ShieldOff className="h-4 w-4 text-green-500" />
                      Protection de feuille (lecture seule, cellules verrouillées)
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldOff className="h-4 w-4 text-green-500" />
                      Protection du classeur
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldOff className="h-4 w-4 text-green-500" />
                      Protection de la structure
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      Mot de passe d&apos;ouverture (chiffrement) - Non supporté
                    </li>
                  </ul>
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
                <p className="mb-2 text-lg font-medium">Glissez votre fichier Excel ici</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  ou cliquez pour sélectionner
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                  Fichiers .xlsx uniquement (Excel 2007+)
                </p>
              </div>
            )}

            {/* File Selected */}
            {originalFile && (
              <div className="space-y-4">
                {/* File Info */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{fileInfo?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(fileInfo?.size || 0)}
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

                {/* Analyzing Progress */}
                {isAnalyzing && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="font-medium">Analyse en cours...</span>
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

                {/* Sheet Selection */}
                {analysis && progress.status === "accepted" && (
                  <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-medium">Sélectionnez les protections à supprimer</h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* No protection message */}
                      {!hasAnyProtection && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Ce fichier ne contient aucune protection détectable.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Workbook-level protections */}
                      {(analysis.hasWorkbookProtection || analysis.hasStructureProtection) && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-muted-foreground">
                            Protection du classeur
                          </p>
                          <div className="space-y-2">
                            {analysis.hasWorkbookProtection && (
                              <button
                                onClick={() => setUnlockWorkbook(!unlockWorkbook)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                  unlockWorkbook
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:bg-accent"
                                }`}
                              >
                                {unlockWorkbook ? (
                                  <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">Protection du classeur</p>
                                  <p className="text-sm text-muted-foreground">
                                    Empêche la modification de la structure du classeur
                                  </p>
                                </div>
                                <Lock className="h-4 w-4 text-amber-500" />
                              </button>
                            )}
                            {analysis.hasStructureProtection && (
                              <button
                                onClick={() => setUnlockStructure(!unlockStructure)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                  unlockStructure
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:bg-accent"
                                }`}
                              >
                                {unlockStructure ? (
                                  <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">Protection de partage</p>
                                  <p className="text-sm text-muted-foreground">
                                    Restrictions de partage du fichier
                                  </p>
                                </div>
                                <Lock className="h-4 w-4 text-amber-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sheet-level protections */}
                      {analysis.sheets.length > 0 && (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">
                              Feuilles ({analysis.sheets.filter((s) => s.isProtected).length} protégées sur {analysis.sheets.length})
                            </p>
                            {analysis.sheets.some((s) => s.isProtected) && (
                              <div className="flex gap-2">
                                <button
                                  onClick={selectAllProtectedSheets}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Tout sélectionner
                                </button>
                                <span className="text-muted-foreground">|</span>
                                <button
                                  onClick={deselectAllSheets}
                                  className="text-xs text-muted-foreground hover:underline"
                                >
                                  Tout désélectionner
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {analysis.sheets.map((sheet) => (
                              <button
                                key={sheet.id}
                                onClick={() => sheet.isProtected && toggleSheetSelection(sheet.id)}
                                disabled={!sheet.isProtected}
                                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                  !sheet.isProtected
                                    ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                                    : sheet.selected
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:bg-accent"
                                }`}
                              >
                                {sheet.isProtected ? (
                                  sheet.selected ? (
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Square className="h-5 w-5 text-muted-foreground" />
                                  )
                                ) : (
                                  <Check className="h-5 w-5 text-green-500" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{sheet.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {sheet.isProtected ? "Protégée" : "Non protégée"}
                                  </p>
                                </div>
                                {sheet.isProtected && (
                                  <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* VBA Protection Warning */}
                      {analysis.hasVbaProtection && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              Ce fichier contient du code VBA protégé. Cette protection ne peut pas être supprimée par cet outil.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Processing Progress */}
                {progress.status === "processing" && (
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

                {/* Protections Found (after processing) */}
                {progress.status === "complete" && progress.protectionsFound.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="mb-3 font-medium">Protections traitées</h3>
                    <ul className="space-y-2">
                      {progress.protectionsFound.map((protection, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {protection.removed ? (
                              <Unlock className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-amber-500" />
                            )}
                            <span>{protectionTypeLabels[protection.type]}</span>
                          </div>
                          <span
                            className={`text-xs ${
                              protection.removed
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {protection.removed ? "Supprimée" : "Non supportée"}
                          </span>
                        </li>
                      ))}
                    </ul>
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
                  {progress.status === "accepted" && hasSelectedItems && (
                    <button
                      onClick={processExcel}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
                    >
                      <ShieldOff className="h-5 w-5" />
                      Supprimer les protections sélectionnées
                    </button>
                  )}

                  {progress.status === "accepted" && !hasSelectedItems && hasAnyProtection && (
                    <button
                      disabled
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-6 py-3 font-medium text-muted-foreground opacity-50"
                    >
                      Sélectionnez au moins une protection
                    </button>
                  )}

                  {progress.status === "complete" && unlockedBlob && (
                    <>
                      <button
                        onClick={handleDownload}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
                      >
                        <Download className="h-5 w-5" />
                        Télécharger le fichier déverrouillé
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-medium transition-colors hover:bg-accent"
                      >
                        Nouveau fichier
                      </button>
                    </>
                  )}

                  {progress.status === "error" && (
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

            {/* Additional Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 font-medium">Comment ça fonctionne ?</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Les fichiers .xlsx sont en réalité des archives ZIP contenant des fichiers XML</li>
                <li>L&apos;outil décompresse le fichier et analyse sa structure</li>
                <li>Vous sélectionnez les feuilles et protections à supprimer</li>
                <li>Les balises de protection dans les fichiers XML sont supprimées</li>
                <li>Le fichier est recompressé et rendu disponible au téléchargement</li>
              </ol>
              <p className="mt-3 text-sm text-muted-foreground">
                <strong>Note :</strong> Cette méthode ne fonctionne pas pour les fichiers chiffrés
                (protégés par mot de passe à l&apos;ouverture). Elle supprime uniquement les protections
                de feuilles et de classeur.
              </p>
            </div>
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
