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

## Modularité du Code (IMPORTANT)

**Règle des 200 lignes**: Un fichier ne doit JAMAIS dépasser 200-250 lignes de code.

### Structure obligatoire pour chaque outil

```
app/tools/[tool-name]/
  ├── page.tsx              # Page principale (max 50 lignes, imports + layout)
  ├── components/           # Composants spécifiques à l'outil
  │   ├── ToolForm.tsx      # Formulaire/inputs
  │   ├── ToolPreview.tsx   # Zone de prévisualisation
  │   ├── ToolActions.tsx   # Boutons d'action (export, reset, etc.)
  │   └── [autres].tsx      # Autres composants si nécessaire
  ├── hooks/                # Hooks personnalisés
  │   └── useTool.ts        # Logique métier de l'outil
  ├── utils/                # Fonctions utilitaires
  │   └── helpers.ts        # Calculs, transformations, etc.
  └── types.ts              # Types spécifiques à l'outil
```

### Principes de découpage

1. **Séparation des responsabilités**
   - UI dans les composants
   - Logique métier dans les hooks
   - Calculs/transformations dans utils

2. **Composants atomiques**
   - Un composant = une responsabilité
   - Props typées explicitement
   - Réutilisabilité maximale

3. **Hooks personnalisés**
   - Extraire la logique d'état complexe
   - Nommer avec le préfixe `use`
   - Retourner un objet avec états et actions

4. **Exemple de découpage**
   ```tsx
   // ❌ MAUVAIS: Tout dans un seul fichier de 800 lignes
   // page.tsx avec formulaire, preview, logique, utils...

   // ✅ BON: Découpage modulaire
   // page.tsx (30 lignes)
   import { ToolForm } from './components/ToolForm'
   import { ToolPreview } from './components/ToolPreview'
   import { useTool } from './hooks/useTool'

   export default function ToolPage() {
     const { state, actions } = useTool()
     return (
       <div>
         <ToolForm {...state} {...actions} />
         <ToolPreview data={state.result} />
       </div>
     )
   }
   ```

### Checklist avant de coder

- [ ] Le fichier fait-il moins de 200 lignes ?
- [ ] Chaque composant a-t-il une seule responsabilité ?
- [ ] La logique métier est-elle dans un hook ?
- [ ] Les types sont-ils dans un fichier séparé ?
- [ ] Les fonctions utilitaires sont-elles extraites ?
