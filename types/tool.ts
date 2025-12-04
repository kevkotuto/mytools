export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  href: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export type ToolCategory =
  | "generator"
  | "converter"
  | "encoder"
  | "formatter"
  | "calculator"
  | "security"
  | "developer"
  | "media"
  | "productivity"
  | "other";

export const categoryLabels: Record<ToolCategory, string> = {
  generator: "Générateurs",
  converter: "Convertisseurs",
  encoder: "Encodeurs",
  formatter: "Formateurs",
  calculator: "Calculateurs",
  security: "Sécurité & Crypto",
  developer: "Développement",
  media: "Médias",
  productivity: "Productivité",
  other: "Autres",
};
