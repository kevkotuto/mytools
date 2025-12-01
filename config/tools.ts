import { Tool } from "@/types/tool";

export const tools: Tool[] = [
  // GENERATORS
  {
    id: "qr-generator",
    name: "Générateur QR Code",
    description:
      "Créez des QR codes professionnels personnalisés avec logo, couleurs, formes de pixels et plusieurs formats d'export.",
    icon: "QrCode",
    category: "generator",
    href: "/tools/qr-generator",
    isNew: false,
    isPopular: true,
  },
  {
    id: "password-generator",
    name: "Générateur de Mot de Passe",
    description:
      "Créez des mots de passe sécurisés et personnalisés avec contrôle de la force, phrases secrètes et génération en masse.",
    icon: "KeyRound",
    category: "generator",
    href: "/tools/password-generator",
    isNew: true,
    isPopular: true,
  },
  {
    id: "uuid-generator",
    name: "Générateur UUID / GUID",
    description:
      "Générez des identifiants uniques universels (UUID v1, v4, v7) dans différents formats avec validateur intégré.",
    icon: "Fingerprint",
    category: "generator",
    href: "/tools/uuid-generator",
    isNew: true,
    isPopular: false,
  },
  {
    id: "lorem-ipsum",
    name: "Générateur Lorem Ipsum",
    description:
      "Générez du texte de remplissage en plusieurs styles : classique, hipster, corporate, français, pirate et bacon.",
    icon: "FileText",
    category: "generator",
    href: "/tools/lorem-ipsum",
    isNew: true,
    isPopular: false,
  },
  {
    id: "hash-generator",
    name: "Générateur de Hash",
    description:
      "Calculez les empreintes MD5, SHA-1, SHA-256, SHA-384, SHA-512 de texte ou fichiers avec vérificateur intégré.",
    icon: "ShieldCheck",
    category: "generator",
    href: "/tools/hash-generator",
    isNew: true,
    isPopular: false,
  },

  // CONVERTERS
  {
    id: "color-converter",
    name: "Convertisseur de Couleurs",
    description:
      "Convertissez entre HEX, RGB, HSL, HSV, CMYK, HWB, LAB, LCH. Génération de palettes et vérificateur de contraste WCAG.",
    icon: "Palette",
    category: "converter",
    href: "/tools/color-converter",
    isNew: true,
    isPopular: true,
  },
  {
    id: "image-converter",
    name: "Convertisseur d'Images",
    description:
      "Convertissez, redimensionnez, compressez et appliquez des filtres. Export PNG, JPEG, WebP, GIF, BMP.",
    icon: "Image",
    category: "converter",
    href: "/tools/image-converter",
    isNew: true,
    isPopular: true,
  },
  {
    id: "unit-converter",
    name: "Convertisseur d'Unités",
    description:
      "Convertissez longueur, poids, température, temps, vitesse, données, surface, volume, énergie, pression et plus.",
    icon: "Scale",
    category: "converter",
    href: "/tools/unit-converter",
    isNew: true,
    isPopular: false,
  },

  // ENCODERS
  {
    id: "base64",
    name: "Base64 Encoder / Decoder",
    description:
      "Encodez et décodez du texte, fichiers et images en Base64. Support URL-safe et génération de Data URL.",
    icon: "Binary",
    category: "encoder",
    href: "/tools/base64",
    isNew: true,
    isPopular: false,
  },

  // FORMATTERS
  {
    id: "json-formatter",
    name: "Formateur JSON",
    description:
      "Formatez, validez, minifiez et explorez vos données JSON avec vue arborescente, statistiques et export.",
    icon: "Braces",
    category: "formatter",
    href: "/tools/json-formatter",
    isNew: true,
    isPopular: true,
  },
  {
    id: "text-transformer",
    name: "Transformateur de Texte",
    description:
      "35+ transformations : casse, code (camelCase, snake_case...), encodage URL/HTML/Base64, manipulation de lignes.",
    icon: "Type",
    category: "formatter",
    href: "/tools/text-transformer",
    isNew: true,
    isPopular: false,
  },
];
