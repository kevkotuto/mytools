# MyTools

Collection d'outils web gratuits, rapides et respectueux de la vie privee. Tout se passe dans votre navigateur, aucune donnee n'est stockee sur nos serveurs.

## Features

- **100% Client-side** - Aucune donnee envoyee a un serveur
- **Gratuit & sans inscription** - Utilisation immediate
- **Design moderne** - Interface flat design epuree
- **Responsive** - Fonctionne sur desktop, tablette et mobile

## Outils disponibles

### Generateur QR Code
Creez des QR codes professionnels avec personnalisation avancee :
- Types de contenu : URL, vCard, Email, WiFi, SMS, Telephone, Texte
- Personnalisation des couleurs (uni ou degrade)
- Styles de pixels : carre, rond, arrondi, diamant, etoile
- Styles de coins personnalisables
- Upload de logo avec bordures arrondies
- Cadre avec texte personnalise
- Export en PNG, SVG, JPG, WEBP
- Copie dans le presse-papier

### Autres outils (a venir)
- Convertisseur de couleurs
- Convertisseur d'images
- Transformateur de texte
- Convertisseur d'unites
- Formateur JSON
- Encodeur/Decodeur Base64
- Generateur de hash
- Generateur Lorem Ipsum
- Generateur de mots de passe

## Stack technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router)
- **UI** : [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icones** : [Lucide React](https://lucide.dev/)
- **QR Code** : [qrcode-generator](https://github.com/nicolestandifer3/qr-code-generator-js-fix)
- **Typage** : TypeScript

## Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/mytools.git
cd mytools

# Installer les dependances
pnpm install

# Lancer le serveur de developpement
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lance le serveur de developpement |
| `pnpm build` | Build de production |
| `pnpm start` | Lance le serveur de production |
| `pnpm lint` | Verifie le code avec ESLint |

## Structure du projet

```
mytools/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Page d'accueil
│   └── tools/             # Pages des outils
│       └── qr-generator/  # Generateur QR Code
├── components/            # Composants React
│   ├── ui/               # Composants shadcn/ui
│   └── ToolsGrid.tsx     # Grille des outils
├── config/               # Configuration
│   └── tools.ts          # Liste des outils
├── lib/                  # Utilitaires
│   └── qr-utils.ts       # Fonctions pour QR codes
├── types/                # Types TypeScript
│   ├── tool.ts           # Types pour les outils
│   └── qr.ts             # Types pour QR codes
└── public/               # Assets statiques
```

## Philosophie

1. **Privacy-first** - Aucune donnee utilisateur n'est collectee ou envoyee
2. **Offline-capable** - Les outils fonctionnent sans connexion internet
3. **Performance** - Chargement rapide, pas de dependances lourdes
4. **Accessibilite** - Interface utilisable par tous

## Contribuer

Les contributions sont les bienvenues ! N'hesitez pas a :
1. Fork le projet
2. Creer une branche (`git checkout -b feature/nouvel-outil`)
3. Commit vos changements (`git commit -m 'Ajout d'un nouvel outil'`)
4. Push sur la branche (`git push origin feature/nouvel-outil`)
5. Ouvrir une Pull Request

## Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de details.

---

Fait avec Next.js et React
