export interface ArchiveFileInfo {
  name: string;
  size: number;
  type: "zip" | "rar";
  isEncrypted: boolean;
  fileCount?: number;
  files?: ArchiveEntry[];
}

export interface ArchiveEntry {
  name: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  isEncrypted: boolean;
}

export type UnlockMethod = "dictionary" | "bruteforce" | "known";

export type UnlockStatus =
  | "idle"
  | "accepted"
  | "analyzing"
  | "cracking"
  | "extracting"
  | "complete"
  | "failed"
  | "error";

export interface UnlockProgress {
  status: UnlockStatus;
  step: string;
  progress: number;
  attemptedPasswords: number;
  currentPassword?: string;
  foundPassword?: string;
  error?: string;
}

export interface CrackConfig {
  method: UnlockMethod;
  knownPassword?: string;
  maxLength: number;
  charset: CharsetOption[];
  customWordlist?: string[];
  useCommonPasswords: boolean;
}

export type CharsetOption =
  | "lowercase"
  | "uppercase"
  | "digits"
  | "special";

export const charsetLabels: Record<CharsetOption, string> = {
  lowercase: "Minuscules (a-z)",
  uppercase: "Majuscules (A-Z)",
  digits: "Chiffres (0-9)",
  special: "Spéciaux (!@#...)",
};

export const methodLabels: Record<UnlockMethod, string> = {
  dictionary: "Dictionnaire",
  bruteforce: "Force brute",
  known: "Mot de passe connu",
};

export const statusMessages: Record<UnlockStatus, string> = {
  idle: "En attente",
  accepted: "Conditions acceptées",
  analyzing: "Analyse de l'archive...",
  cracking: "Recherche du mot de passe...",
  extracting: "Extraction des fichiers...",
  complete: "Mot de passe trouvé !",
  failed: "Mot de passe non trouvé",
  error: "Une erreur est survenue",
};

// Common passwords dictionary (basic list for demonstration)
export const commonPasswords = [
  "123456", "password", "12345678", "qwerty", "123456789",
  "12345", "1234", "111111", "1234567", "dragon",
  "123123", "baseball", "abc123", "football", "monkey",
  "letmein", "696969", "shadow", "master", "666666",
  "qwertyuiop", "123321", "mustang", "1234567890", "michael",
  "654321", "pussy", "superman", "1qaz2wsx", "7777777",
  "fuckyou", "121212", "000000", "qazwsx", "123qwe",
  "killer", "trustno1", "jordan", "jennifer", "zxcvbnm",
  "asdfgh", "hunter", "buster", "soccer", "harley",
  "batman", "andrew", "tigger", "sunshine", "iloveyou",
  "fuckme", "2000", "charlie", "robert", "thomas",
  "hockey", "ranger", "daniel", "starwars", "klaster",
  "112233", "george", "asshole", "computer", "michelle",
  "jessica", "pepper", "1111", "zxcvbn", "555555",
  "11111111", "131313", "freedom", "777777", "pass",
  "fuck", "maggie", "159753", "aaaaaa", "ginger",
  "princess", "joshua", "cheese", "amanda", "summer",
  "love", "ashley", "6969", "nicole", "chelsea",
  "biteme", "matthew", "access", "yankees", "987654321",
  "dallas", "austin", "thunder", "taylor", "matrix",
  "test", "admin", "root", "toor", "user",
  "guest", "default", "welcome", "password1", "password123",
  "azerty", "motdepasse", "secret", "private", "public",
  // French common passwords
  "bonjour", "soleil", "amour", "france", "paris",
  "marseille", "lyon", "toulouse", "bordeaux", "nantes",
  // Years
  "2020", "2021", "2022", "2023", "2024", "2025",
  "1990", "1991", "1992", "1993", "1994", "1995",
  "1996", "1997", "1998", "1999", "2000", "2001",
  "2002", "2003", "2004", "2005", "2006", "2007",
  "2008", "2009", "2010", "2011", "2012", "2013",
  "2014", "2015", "2016", "2017", "2018", "2019",
];

export const defaultCrackConfig: CrackConfig = {
  method: "dictionary",
  maxLength: 6,
  charset: ["lowercase", "digits"],
  useCommonPasswords: true,
};
