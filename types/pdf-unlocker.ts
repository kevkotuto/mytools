export interface PdfFileInfo {
  name: string;
  size: number;
  pageCount?: number;
  isEncrypted: boolean;
  hasUserPassword: boolean;
  hasOwnerPassword: boolean;
  restrictions: PdfRestriction[];
}

export type PdfRestriction =
  | "print"
  | "modify"
  | "copy"
  | "annotate"
  | "fill-forms"
  | "extract"
  | "assemble"
  | "print-high-res";

export const restrictionLabels: Record<PdfRestriction, string> = {
  print: "Impression",
  modify: "Modification",
  copy: "Copie de texte",
  annotate: "Annotations",
  "fill-forms": "Remplissage de formulaires",
  extract: "Extraction de contenu",
  assemble: "Assemblage de pages",
  "print-high-res": "Impression haute résolution",
};

export type UnlockStatus =
  | "idle"
  | "accepted"
  | "analyzing"
  | "unlocking"
  | "complete"
  | "failed"
  | "error";

export interface UnlockProgress {
  status: UnlockStatus;
  step: string;
  progress: number;
  error?: string;
}

export const statusMessages: Record<UnlockStatus, string> = {
  idle: "En attente",
  accepted: "Conditions acceptées",
  analyzing: "Analyse du PDF...",
  unlocking: "Suppression des restrictions...",
  complete: "Restrictions supprimées !",
  failed: "Échec du déverrouillage",
  error: "Une erreur est survenue",
};
