export interface ExcelFileInfo {
  name: string;
  size: number;
  type: string;
}

export type ProtectionType =
  | "sheet"
  | "workbook"
  | "workbook_structure"
  | "vba";

export interface ProtectionInfo {
  type: ProtectionType;
  location: string;
  removed: boolean;
}

export type UnlockStatus =
  | "idle"
  | "accepted"
  | "uploading"
  | "analyzing"
  | "processing"
  | "complete"
  | "error";

export interface UnlockProgress {
  status: UnlockStatus;
  step: string;
  progress: number;
  protectionsFound: ProtectionInfo[];
  error?: string;
}

export const protectionTypeLabels: Record<ProtectionType, string> = {
  sheet: "Protection de feuille",
  workbook: "Protection du classeur",
  workbook_structure: "Protection de la structure",
  vba: "Protection VBA",
};

export const statusMessages: Record<UnlockStatus, string> = {
  idle: "En attente",
  accepted: "Conditions acceptées",
  uploading: "Chargement du fichier...",
  analyzing: "Analyse du fichier...",
  processing: "Suppression des protections...",
  complete: "Traitement terminé",
  error: "Une erreur est survenue",
};
