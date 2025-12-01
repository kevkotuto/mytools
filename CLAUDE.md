# CLAUDE.md - MyTools App

Application de mini-outils puissants avec Next.js 16 et shadcn/ui.

## Design System

**FLAT DESIGN OBLIGATOIRE** sur toute l'application:
- Pas de shadows (box-shadow, drop-shadow)
- Pas de gradients
- Bordures fines et subtiles
- Couleurs pleines et contrastées
- Interfaces épurées et minimalistes

## Architecture

```
app/                    # Pages Next.js (App Router)
  ├── page.tsx         # Page d'accueil - Liste des tools
  ├── tools/           # Pages des différents tools
  │   ├── qr-generator/   # Générateur QR Code
  │   └── [autres]/       # Autres tools à venir
components/            # Composants réutilisables
  ├── ui/             # Composants shadcn/ui
  └── tools/          # Composants spécifiques aux tools
lib/                  # Utilitaires
types/                # Types TypeScript
```

## Philosophie de l'App

1. **Aucune sauvegarde côté serveur** - Tout est traité localement
2. **localStorage uniquement** pour persistence temporaire côté client
3. **Outils autonomes** - Chaque tool est indépendant
4. **UX simple** - L'utilisateur sélectionne, utilise, télécharge

## Tools Prévus

### 1. Générateur QR Code Professionnel
- Types de contenu: URL, vCard, Email, WiFi, SMS, Tel, Text, etc.
- Personnalisation:
  - Couleur du QR code (foreground/background)
  - Upload de logo au centre
  - Forme des pixels (carré, rond, arrondi, etc.)
  - Niveau de correction d'erreur
  - Taille/résolution
- Formats d'export: PNG, SVG, PDF
- Prévisualisation en temps réel

### 2. [Autres tools à définir]

## Commandes

```bash
pnpm dev      # Développement
pnpm build    # Build production
pnpm lint     # Linting
```

## Conventions

- Utiliser `@/` pour les imports
- Composants shadcn dans `components/ui/`
- Flat design = pas de shadow, pas de gradient
- Mobile-first responsive design
