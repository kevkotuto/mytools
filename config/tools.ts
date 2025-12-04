import { Tool } from "@/types/tool";

export const tools: Tool[] = [
  // MEDIA
  {
    id: "audio-cutter",
    name: "Audio Cutter",
    description:
      "Découpez vos fichiers audio MP3, WAV, OGG avec précision. Visualisation de la forme d'onde et export multi-formats.",
    icon: "Scissors",
    category: "media",
    href: "/tools/audio-cutter",
    isNew: true,
    isPopular: true,
  },
  {
    id: "video-to-gif",
    name: "Video to GIF",
    description:
      "Convertissez vos vidéos en GIF animés. Sélection de séquence, FPS et qualité personnalisables.",
    icon: "Film",
    category: "media",
    href: "/tools/video-to-gif",
    isNew: true,
    isPopular: true,
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description:
      "Recadrez vos images avec des ratios prédéfinis (1:1, 4:3, 16:9). Rotation et retournement inclus.",
    icon: "Crop",
    category: "media",
    href: "/tools/image-cropper",
    isNew: true,
    isPopular: false,
  },
  {
    id: "favicon-generator",
    name: "Favicon Generator",
    description:
      "Générez tous les formats de favicons : ICO, PNG multi-tailles, Apple Touch Icon. Téléchargement ZIP.",
    icon: "ImageIcon",
    category: "media",
    href: "/tools/favicon-generator",
    isNew: true,
    isPopular: true,
  },
  {
    id: "screenshot-to-code",
    name: "Screenshot to Code",
    description:
      "Extrayez du code depuis des captures d'écran avec OCR. Détection automatique du langage.",
    icon: "Code",
    category: "media",
    href: "/tools/screenshot-to-code",
    isNew: true,
    isPopular: false,
  },

  // PRODUCTIVITY
  {
    id: "pomodoro-timer",
    name: "Pomodoro Timer",
    description:
      "Timer Pomodoro avec sessions de travail, pauses courtes et longues. Statistiques et personnalisation complète.",
    icon: "Timer",
    category: "productivity",
    href: "/tools/pomodoro-timer",
    isNew: true,
    isPopular: true,
  },
  {
    id: "kanban-board",
    name: "Kanban Board",
    description:
      "Tableau Kanban local avec colonnes personnalisables, drag & drop, couleurs et stockage localStorage.",
    icon: "Columns",
    category: "productivity",
    href: "/tools/kanban-board",
    isNew: true,
    isPopular: true,
  },
  {
    id: "invoice-generator",
    name: "Invoice Generator",
    description:
      "Créez des factures professionnelles en PDF. Calcul automatique TVA, aperçu temps réel.",
    icon: "Receipt",
    category: "productivity",
    href: "/tools/invoice-generator",
    isNew: true,
    isPopular: true,
  },
  {
    id: "signature-pad",
    name: "Signature Pad",
    description:
      "Créez des signatures manuscrites ou tapées. Export PNG, JPEG, SVG avec fond transparent.",
    icon: "PenTool",
    category: "productivity",
    href: "/tools/signature-pad",
    isNew: true,
    isPopular: false,
  },
  {
    id: "calendar-calculator",
    name: "Calendar Calculator",
    description:
      "Calculez différences entre dates, ajoutez/soustrayez des jours, comptez les jours ouvrés.",
    icon: "CalendarDays",
    category: "productivity",
    href: "/tools/calendar-calculator",
    isNew: true,
    isPopular: false,
  },

  // CALCULATORS
  {
    id: "mortgage-calculator",
    name: "Simulateur de Prêt",
    description:
      "Simulez votre prêt immobilier : mensualités, tableau d'amortissement, coût total et assurance.",
    icon: "Home",
    category: "calculator",
    href: "/tools/mortgage-calculator",
    isNew: true,
    isPopular: true,
  },
  {
    id: "percentage-calculator",
    name: "Calculs de Pourcentages",
    description:
      "Calculs de pourcentages, variations, remises, pourboires et marges commerciales.",
    icon: "Percent",
    category: "calculator",
    href: "/tools/percentage-calculator",
    isNew: true,
    isPopular: true,
  },
  {
    id: "ip-lookup",
    name: "IP Address Lookup",
    description:
      "Obtenez les informations d'une adresse IP : géolocalisation, FAI, fuseau horaire.",
    icon: "Globe",
    category: "calculator",
    href: "/tools/ip-lookup",
    isNew: true,
    isPopular: false,
  },
  {
    id: "whois-lookup",
    name: "WHOIS Lookup",
    description:
      "Recherchez les informations d'un nom de domaine : registrar, dates, serveurs DNS.",
    icon: "Search",
    category: "calculator",
    href: "/tools/whois-lookup",
    isNew: true,
    isPopular: false,
  },

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
  {
    id: "app-icon-generator",
    name: "App Icon Generator",
    description:
      "Générez toutes les tailles d'icônes pour iOS, Android, macOS, watchOS et Web à partir d'une seule image 1024x1024.",
    icon: "AppWindow",
    category: "generator",
    href: "/tools/app-icon-generator",
    isNew: true,
    isPopular: true,
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
    id: "image-vectorizer",
    name: "Vectorisateur d'Image",
    description:
      "Transformez vos images PNG, JPG en fichiers SVG vectoriels. Modes noir & blanc, couleurs et contours.",
    icon: "Shapes",
    category: "converter",
    href: "/tools/image-vectorizer",
    isNew: true,
    isPopular: false,
  },
  {
    id: "background-remover",
    name: "Suppresseur d'Arrière-plan",
    description:
      "Supprimez l'arrière-plan de vos images automatiquement avec l'IA ou manuellement. Export PNG transparent.",
    icon: "Eraser",
    category: "converter",
    href: "/tools/background-remover",
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
  {
    id: "file-converter",
    name: "Convertisseur de Fichiers",
    description:
      "Convertissez entre PDF, DOCX, XLSX, CSV, JSON, XML, HTML, Markdown. OCR pour extraire le texte des images.",
    icon: "FileStack",
    category: "converter",
    href: "/tools/file-converter",
    isNew: true,
    isPopular: true,
  },

  // UTILITIES
  {
    id: "excel-unlocker",
    name: "Déverrouilleur Excel",
    description:
      "Supprimez les protections de vos fichiers Excel (.xlsx). Récupérez l'accès à vos feuilles et classeurs protégés.",
    icon: "FileSpreadsheet",
    category: "other",
    href: "/tools/excel-unlocker",
    isNew: true,
    isPopular: false,
  },
  {
    id: "zip-unlocker",
    name: "Déverrouilleur ZIP",
    description:
      "Récupérez l'accès à vos archives ZIP protégées par mot de passe. Attaque par dictionnaire ou force brute.",
    icon: "FolderArchive",
    category: "other",
    href: "/tools/zip-unlocker",
    isNew: true,
    isPopular: false,
  },
  {
    id: "rar-unlocker",
    name: "Déverrouilleur RAR",
    description:
      "Récupérez l'accès à vos archives RAR protégées par mot de passe. Attaque par dictionnaire ou force brute.",
    icon: "FileArchive",
    category: "other",
    href: "/tools/rar-unlocker",
    isNew: true,
    isPopular: false,
  },
  {
    id: "pdf-unlocker",
    name: "Déverrouilleur PDF",
    description:
      "Supprimez les restrictions d'impression, copie et modification de vos PDF. Aucun mot de passe requis.",
    icon: "FileText",
    category: "other",
    href: "/tools/pdf-unlocker",
    isNew: true,
    isPopular: true,
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

  // WORKSPACE
  {
    id: "mindmap-workspace",
    name: "Mindmap Workspace",
    description:
      "Espace de travail infini style Figma. Créez des mindmaps avec formes, connexions magnétiques, textes et post-its. Zoom pincé, raccourcis clavier.",
    icon: "Workflow",
    category: "other",
    href: "/tools/mindmap-workspace",
    isNew: true,
    isPopular: true,
  },

  // DESIGN
  {
    id: "wireframe-generator",
    name: "Wireframe Paper",
    description:
      "Générez des feuilles de wireframe imprimables pour vos croquis d'applications. iPhone, Android, tablettes, montres, desktop. Tous formats de papier.",
    icon: "PenLine",
    category: "other",
    href: "/tools/wireframe-generator",
    isNew: true,
    isPopular: true,
  },

  // SECURITY & CRYPTO
  {
    id: "encrypt-decrypt",
    name: "Encrypt / Decrypt",
    description:
      "Chiffrement et déchiffrement AES-256-GCM de texte et fichiers. Clé dérivée avec PBKDF2. 100% local.",
    icon: "Lock",
    category: "security",
    href: "/tools/encrypt-decrypt",
    isNew: true,
    isPopular: true,
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description:
      "Décodez et analysez vos tokens JWT. Visualisez header, payload, signature et vérifiez l'expiration.",
    icon: "Key",
    category: "security",
    href: "/tools/jwt-decoder",
    isNew: true,
    isPopular: true,
  },
  {
    id: "ssl-checker",
    name: "SSL Certificate Checker",
    description:
      "Analysez les certificats SSL/TLS de n'importe quel domaine. Vérifiez validité, expiration et détails.",
    icon: "Shield",
    category: "security",
    href: "/tools/ssl-checker",
    isNew: true,
    isPopular: false,
  },

  // DEVELOPER TOOLS
  {
    id: "regex-tester",
    name: "Regex Tester",
    description:
      "Testez et validez vos expressions régulières en temps réel. Surlignage, groupes capturés et aide-mémoire.",
    icon: "Search",
    category: "developer",
    href: "/tools/regex-tester",
    isNew: true,
    isPopular: true,
  },
  {
    id: "cron-builder",
    name: "Cron Expression Builder",
    description:
      "Construisez des expressions cron visuellement. Préréglages, description en français et prochaines exécutions.",
    icon: "Clock",
    category: "developer",
    href: "/tools/cron-builder",
    isNew: true,
    isPopular: false,
  },
  {
    id: "diff-checker",
    name: "Diff Checker",
    description:
      "Comparez deux textes ou codes côte à côte. Visualisez les ajouts, suppressions et modifications.",
    icon: "GitCompare",
    category: "developer",
    href: "/tools/diff-checker",
    isNew: true,
    isPopular: true,
  },
  {
    id: "code-minifier",
    name: "Code Minifier",
    description:
      "Minifiez HTML, CSS, JavaScript et JSON. Réduisez la taille de vos fichiers pour la production.",
    icon: "Minimize2",
    category: "developer",
    href: "/tools/code-minifier",
    isNew: true,
    isPopular: false,
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    description:
      "Éditeur Markdown avec prévisualisation live. Toolbar complète, export et compteur de mots.",
    icon: "FileText",
    category: "developer",
    href: "/tools/markdown-editor",
    isNew: true,
    isPopular: true,
  },
  {
    id: "code-beautifier",
    name: "Code Beautifier",
    description:
      "Formatez et embellissez JavaScript, JSON, CSS, HTML et SQL. Indentation personnalisable.",
    icon: "Sparkles",
    category: "developer",
    href: "/tools/code-beautifier",
    isNew: true,
    isPopular: false,
  },
  {
    id: "csv-json",
    name: "CSV ↔ JSON Converter",
    description:
      "Convertissez CSV vers JSON et inversement. Support des délimiteurs personnalisés et en-têtes.",
    icon: "FileSpreadsheet",
    category: "developer",
    href: "/tools/csv-json",
    isNew: true,
    isPopular: true,
  },
  {
    id: "code-sandbox",
    name: "Code Sandbox",
    description:
      "Bac à sable pour tester JavaScript, Python, HTML et CSS. Gestion d'onglets, import/export, console intégrée et aperçu temps réel.",
    icon: "Code2",
    category: "developer",
    href: "/tools/code-sandbox",
    isNew: true,
    isPopular: true,
  },
  {
    id: "api-tester",
    name: "API Tester",
    description:
      "Testez vos APIs REST, WebSocket, Socket.IO, GraphQL et SSE. Gestion d'onglets, environnements, authentification et historique.",
    icon: "Zap",
    category: "developer",
    href: "/tools/api-tester",
    isNew: true,
    isPopular: true,
  },
];
