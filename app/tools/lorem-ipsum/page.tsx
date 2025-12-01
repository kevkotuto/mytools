"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Download,
  FileText,
  AlignLeft,
  List,
  Type,
} from "lucide-react";

type GenerationType = "paragraphs" | "sentences" | "words" | "characters" | "lists";
type TextStyle = "classic" | "hipster" | "corporate" | "french" | "pirate" | "bacon";

const textSources: Record<TextStyle, string[]> = {
  classic: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
    "Eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident.",
    "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Curabitur pretium tincidunt lacus.",
    "Nulla gravida orci a odio.",
    "Nullam varius, turpis et commodo pharetra.",
    "Est eros bibendum elit, nec luctus magna felis sollicitudin mauris.",
    "Integer in mauris eu nibh euismod gravida.",
    "Duis ac tellus et risus vulputate vehicula.",
    "Donec lobortis risus a elit.",
    "Etiam tempor.",
    "Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis.",
    "Id tincidunt sapien risus a quam.",
    "Maecenas fermentum consequat mi.",
    "Donec fermentum.",
    "Pellentesque malesuada nulla a mi.",
    "Duis sapien sem, aliquet sed, vulputate eget, feugiat quis, nibh.",
    "Vestibulum magna ante, varius in sollicitudin at, blandit ut lectus.",
    "Morbi in sem quis dui placerat ornare.",
    "Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam.",
    "Sed arcu.",
    "Cras consequat.",
    "Praesent dapibus, neque id cursus faucibus.",
    "Tortor neque egestas augue, eu vulputate magna eros eu erat.",
    "Aliquam erat volutpat.",
    "Nam dui mi, tincidunt quis, accumsan porttitor.",
    "Facilisis luctus, metus.",
  ],
  hipster: [
    "Artisan kale chips aesthetic, literally sriracha portland bicycle rights.",
    "Messenger bag gentrify pitchfork tattooed craft beer, iphone skateboard.",
    "Lomo locavore, next level williamsburg ethical hell of lyft.",
    "Gastropub ugh actually, prism cardigan swag vaporware air plant.",
    "Microdosing gentrify pabst leggings banjo franzen intelligentsia.",
    "Normcore occupy squid sustainable aesthetic fingerstache.",
    "Synth thundercats crucifix cray vegan taxidermy.",
    "Chicharrones beard four loko post-ironic butcher master cleanse.",
    "Bushwick glossier hammock, meggings unicorn authentic street art.",
    "Salvia mixtape vexillologist trust fund freegan disrupt activated charcoal.",
    "Pour-over humblebrag keytar live-edge cold-pressed cornhole.",
    "Hoodie dreamcatcher snackwave, chia cloud bread direct trade quinoa.",
    "Cliche distillery selvage tumeric fixie venmo jianbing.",
    "Raclette pickled bespoke man braid chambray af.",
    "Hashtag retro roof party slow-carb yuccie asymmetrical.",
  ],
  corporate: [
    "Leverage agile frameworks to provide a robust synopsis for high level overviews.",
    "Iterative approaches to corporate strategy foster collaborative thinking.",
    "Organically grow the holistic world view of disruptive innovation.",
    "At the end of the day, going forward, a new normal has emerged.",
    "Seamlessly visualize quality intellectual capital without superior collaboration.",
    "Efficiently unleash cross-media information without cross-media value.",
    "Quickly maximize timely deliverables for real-time schemas.",
    "Proactively envisioned multimedia based expertise and cross-media growth strategies.",
    "Completely synergize resource taxing relationships via premier niche markets.",
    "Professionally cultivate one-to-one customer service with robust ideas.",
    "Dynamically innovate resource-leveling customer service for state of the art.",
    "Objectively innovate empowered manufactured products whereas parallel platforms.",
    "Holisticly predominate extensible testing procedures for reliable supply chains.",
    "Dramatically engage top-line web services vis-a-vis cutting-edge deliverables.",
    "Proactively envisioned multimedia based expertise and cross-media growth strategies.",
  ],
  french: [
    "Bonjour, je suis un texte de remplissage en français.",
    "Les grandes pensées viennent du cœur.",
    "La vie est un mystère qu'il faut vivre, pas un problème à résoudre.",
    "Le temps est un grand maître, il règle bien des choses.",
    "L'imagination est plus importante que le savoir.",
    "Rien ne se perd, rien ne se crée, tout se transforme.",
    "La simplicité est la sophistication suprême.",
    "Le bonheur n'est pas une destination, c'est une façon de voyager.",
    "Chaque moment est un nouveau commencement.",
    "La créativité, c'est l'intelligence qui s'amuse.",
    "Les mots peuvent être doux comme le miel ou tranchants comme l'épée.",
    "Le savoir est la seule matière qui s'accroît quand on la partage.",
    "L'essentiel est invisible pour les yeux.",
    "La persévérance est la clé de toute réussite.",
    "Un voyage de mille lieues commence par un premier pas.",
  ],
  pirate: [
    "Ahoy! Shiver me timbers and blow the man down!",
    "Avast ye scurvy dogs, there be treasure ahead!",
    "Yo ho ho and a bottle of rum, sail the seven seas!",
    "Walk the plank ye landlubber, or face Davy Jones' locker!",
    "Hoist the Jolly Roger and prepare to board!",
    "Blimey! That be the finest booty this side of the Caribbean!",
    "By Blackbeard's ghost, we'll make them walk the plank!",
    "Arrr, the kraken lurks in these waters, matey!",
    "Dead men tell no tales, but their treasure surely does!",
    "Set sail for adventure on the high seas!",
    "The captain's quarters be full of golden doubloons!",
    "Batten down the hatches, a storm be brewing!",
    "X marks the spot where the treasure lies buried!",
    "No quarter given to those who dare oppose us!",
    "A pirate's life be the only life for me!",
  ],
  bacon: [
    "Bacon ipsum dolor amet ribeye strip steak tongue.",
    "Pork belly bresaola chicken frankfurter shankle ham hock.",
    "Landjaeger kielbasa turducken, jerky hamburger sirloin sausage.",
    "Chuck tenderloin bacon beef ribs, biltong short loin.",
    "Pastrami pig alcatra, filet mignon ground round meatball tail.",
    "Tri-tip pork belly picanha turkey, beef buffalo short loin.",
    "Capicola venison drumstick, burgdoggen shankle swine chislic.",
    "Ham hock salami prosciutto, kielbasa spare ribs andouille tongue.",
    "Boudin flank corned beef porchetta t-bone meatloaf.",
    "Cupim fatback pork chop rump ham landjaeger frankfurter.",
    "Shoulder leberkas ball tip, ham t-bone sausage kevin.",
    "Pig ribeye jowl buffalo strip steak turkey pancetta.",
    "Bacon chuck flank tail hamburger pork chop porchetta.",
    "Doner brisket pork, drumstick pig fatback sirloin tenderloin.",
    "Meatball ham hock corned beef, capicola salami tri-tip bresaola.",
  ],
};

const styleLabels: Record<TextStyle, string> = {
  classic: "Classique (Lorem Ipsum)",
  hipster: "Hipster",
  corporate: "Corporate / Business",
  french: "Français",
  pirate: "Pirate 🏴‍☠️",
  bacon: "Bacon 🥓",
};

export default function LoremIpsumPage() {
  const [type, setType] = useState<GenerationType>("paragraphs");
  const [count, setCount] = useState(3);
  const [style, setStyle] = useState<TextStyle>("classic");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateText = useMemo(() => {
    const sentences = textSources[style];
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const getRandomSentence = () => sentences[Math.floor(Math.random() * sentences.length)];
    const getRandomWord = () => {
      const sentence = getRandomSentence();
      const words = sentence.split(" ");
      return words[Math.floor(Math.random() * words.length)].replace(/[.,!?]/g, "");
    };

    switch (type) {
      case "paragraphs": {
        const paragraphs: string[] = [];
        for (let i = 0; i < count; i++) {
          const sentenceCount = 4 + Math.floor(Math.random() * 4);
          let paragraph = shuffle(sentences).slice(0, sentenceCount).join(" ");
          if (i === 0 && startWithLorem && style === "classic") {
            paragraph = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + paragraph;
          }
          if (includeHtml) {
            paragraphs.push(`<p>${paragraph}</p>`);
          } else {
            paragraphs.push(paragraph);
          }
        }
        return paragraphs.join(includeHtml ? "\n" : "\n\n");
      }

      case "sentences": {
        const result: string[] = [];
        for (let i = 0; i < count; i++) {
          let sentence = getRandomSentence();
          if (i === 0 && startWithLorem && style === "classic") {
            sentence = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
          }
          result.push(sentence);
        }
        return result.join(" ");
      }

      case "words": {
        const words: string[] = [];
        if (startWithLorem && style === "classic") {
          words.push("Lorem", "ipsum", "dolor", "sit", "amet");
        }
        while (words.length < count) {
          words.push(getRandomWord().toLowerCase());
        }
        return words.slice(0, count).join(" ");
      }

      case "characters": {
        let text = "";
        while (text.length < count) {
          text += getRandomSentence() + " ";
        }
        if (startWithLorem && style === "classic") {
          text = "Lorem ipsum dolor sit amet, " + text;
        }
        return text.slice(0, count);
      }

      case "lists": {
        const items: string[] = [];
        for (let i = 0; i < count; i++) {
          items.push(getRandomSentence());
        }
        if (includeHtml) {
          return `<ul>\n${items.map((item) => `  <li>${item}</li>`).join("\n")}\n</ul>`;
        }
        return items.map((item, i) => `${i + 1}. ${item}`).join("\n");
      }

      default:
        return "";
    }
  }, [type, count, style, startWithLorem, includeHtml]);

  const stats = useMemo(() => {
    const text = generateText;
    return {
      paragraphs: text.split(/\n\n+/).filter(Boolean).length,
      sentences: text.split(/[.!?]+/).filter(Boolean).length,
      words: text.split(/\s+/).filter(Boolean).length,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
    };
  }, [generateText]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorem-ipsum.${includeHtml ? "html" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presets = [
    { label: "1 paragraphe", type: "paragraphs" as GenerationType, count: 1 },
    { label: "3 paragraphes", type: "paragraphs" as GenerationType, count: 3 },
    { label: "5 paragraphes", type: "paragraphs" as GenerationType, count: 5 },
    { label: "10 phrases", type: "sentences" as GenerationType, count: 10 },
    { label: "50 mots", type: "words" as GenerationType, count: 50 },
    { label: "100 mots", type: "words" as GenerationType, count: 100 },
    { label: "500 caractères", type: "characters" as GenerationType, count: 500 },
    { label: "Liste 5 items", type: "lists" as GenerationType, count: 5 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux outils
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Générateur Lorem Ipsum</h1>
          <p className="mt-2 text-muted-foreground">
            Générez du texte de remplissage en plusieurs styles et formats.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px,1fr]">
          {/* Controls */}
          <div className="space-y-4">
            {/* Type Selection */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Type de génération</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "paragraphs" as GenerationType, label: "Paragraphes", icon: AlignLeft },
                  { type: "sentences" as GenerationType, label: "Phrases", icon: FileText },
                  { type: "words" as GenerationType, label: "Mots", icon: Type },
                  { type: "characters" as GenerationType, label: "Caractères", icon: Type },
                  { type: "lists" as GenerationType, label: "Listes", icon: List },
                ].map(({ type: t, label, icon: Icon }) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      type === t
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">
                Nombre de {type === "paragraphs" ? "paragraphes" : type === "sentences" ? "phrases" : type === "words" ? "mots" : type === "characters" ? "caractères" : "éléments"}
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max={type === "characters" ? 2000 : type === "words" ? 500 : 20}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max={type === "characters" ? 10000 : type === "words" ? 1000 : 100}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm"
                />
              </div>
            </div>

            {/* Style */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Style de texte</h3>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as TextStyle)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(styleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={startWithLorem}
                    onChange={(e) => setStartWithLorem(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">Commencer par &quot;Lorem ipsum&quot;</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeHtml}
                    onChange={(e) => setIncludeHtml(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">Inclure les balises HTML</span>
                </label>
              </div>
            </div>

            {/* Presets */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Préréglages rapides</h3>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setType(preset.type);
                      setCount(preset.count);
                    }}
                    className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Statistiques</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Paragraphes</p>
                  <p className="text-lg font-semibold">{stats.paragraphs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phrases</p>
                  <p className="text-lg font-semibold">{stats.sentences}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mots</p>
                  <p className="text-lg font-semibold">{stats.words}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Caractères</p>
                  <p className="text-lg font-semibold">{stats.characters}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">Texte généré</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Force regeneration by toggling a state
                      const currentCount = count;
                      setCount(currentCount + 1);
                      setTimeout(() => setCount(currentCount), 0);
                    }}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Régénérer
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="max-h-[600px] overflow-auto p-4">
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {generateText}
                </div>
              </div>
            </div>

            {/* Preview (if HTML) */}
            {includeHtml && (
              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-4 py-2">
                  <h2 className="text-sm font-medium">Aperçu HTML</h2>
                </div>
                <div
                  className="prose prose-sm max-w-none p-4 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: generateText }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
