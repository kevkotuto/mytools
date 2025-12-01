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
  | "other";

export const categoryLabels: Record<ToolCategory, string> = {
  generator: "Générateurs",
  converter: "Convertisseurs",
  encoder: "Encodeurs",
  formatter: "Formateurs",
  calculator: "Calculateurs",
  other: "Autres",
};
