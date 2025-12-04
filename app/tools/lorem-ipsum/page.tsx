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
    "Bonjour, je suis un texte de remplissage en francais.",
    "Les grandes pensees viennent du coeur.",
    "La vie est un mystere qu'il faut vivre, pas un probleme a resoudre.",
    "Le temps est un grand maitre, il regle bien des choses.",
    "L'imagination est plus importante que le savoir.",
    "Rien ne se perd, rien ne se cree, tout se transforme.",
    "La simplicite est la sophistication supreme.",
    "Le bonheur n'est pas une destination, c'est une facon de voyager.",
    "Chaque moment est un nouveau commencement.",
    "La creativite, c'est l'intelligence qui s'amuse.",
    "Les mots peuvent etre doux comme le miel ou tranchants comme l'epee.",
    "Le savoir est la seule matiere qui s'accroit quand on la partage.",
    "L'essentiel est invisible pour les yeux.",
    "La perseverance est la cle de toute reussite.",
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
  classic: "Classique",
  hipster: "Hipster",
  corporate: "Corporate",
  french: "Francais",
  pirate: "Pirate",
  bacon: "Bacon",
};

export default function LoremIpsumPage() {
  const [type, setType] = useState<GenerationType>("paragraphs");
  const [count, setCount] = useState(3);
  const [style, setStyle] = useState<TextStyle>("classic");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerateKey, setRegenerateKey] = useState(0);

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
  }, [type, count, style, startWithLorem, includeHtml, regenerateKey]);

  const stats = useMemo(() => {
    const text = generateText;
    return {
      paragraphs: text.split(/\n\n+/).filter(Boolean).length,
      sentences: text.split(/[.!?]+/).filter(Boolean).length,
      words: text.split(/\s+/).filter(Boolean).length,
      characters: text.length,
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

  const typeConfig = [
    { type: "paragraphs" as GenerationType, label: "Paragraphes", icon: AlignLeft, max: 20 },
    { type: "sentences" as GenerationType, label: "Phrases", icon: FileText, max: 50 },
    { type: "words" as GenerationType, label: "Mots", icon: Type, max: 500 },
    { type: "characters" as GenerationType, label: "Caractères", icon: Type, max: 2000 },
    { type: "lists" as GenerationType, label: "Listes", icon: List, max: 20 },
  ];

  const currentTypeConfig = typeConfig.find((t) => t.type === type)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Générateur Lorem Ipsum</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="flex h-[calc(100vh-88px)] flex-col gap-4 lg:flex-row">
          {/* Zone de prévisualisation */}
          <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{stats.paragraphs} para.</span>
                <span>{stats.sentences} phrases</span>
                <span>{stats.words} mots</span>
                <span>{stats.characters} car.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRegenerateKey((k) => k + 1)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Régénérer
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copié" : "Copier"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Texte généré */}
            <div className="flex-1 overflow-auto p-4">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {generateText}
              </div>
            </div>

            {/* Aperçu HTML si activé */}
            {includeHtml && (
              <div className="border-t border-border p-4">
                <h3 className="mb-2 text-xs font-medium text-muted-foreground">APERÇU HTML</h3>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: generateText }}
                />
              </div>
            )}
          </div>

          {/* Panneau de configuration */}
          <div className="flex w-full flex-col gap-4 lg:w-72">
            {/* Type de génération */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">TYPE</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {typeConfig.map(({ type: t, label, icon: Icon }) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      type === t
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantité */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground">QUANTITÉ</h3>
                <span className="text-xs font-semibold">{count}</span>
              </div>
              <input
                type="range"
                min="1"
                max={currentTypeConfig.max}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-2">
                <input
                  type="number"
                  min="1"
                  max={currentTypeConfig.max * 2}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Style */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">STYLE</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(styleLabels) as TextStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      style === s
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {styleLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">OPTIONS</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={startWithLorem}
                    onChange={(e) => setStartWithLorem(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Commencer par &quot;Lorem ipsum&quot;
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeHtml}
                    onChange={(e) => setIncludeHtml(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Balises HTML
                </label>
              </div>
            </div>

            {/* Presets */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">PRÉRÉGLAGES</h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "1 para", type: "paragraphs" as GenerationType, count: 1 },
                  { label: "3 para", type: "paragraphs" as GenerationType, count: 3 },
                  { label: "5 para", type: "paragraphs" as GenerationType, count: 5 },
                  { label: "10 phrases", type: "sentences" as GenerationType, count: 10 },
                  { label: "50 mots", type: "words" as GenerationType, count: 50 },
                  { label: "100 mots", type: "words" as GenerationType, count: 100 },
                ].map((preset, i) => (
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
          </div>
        </div>
      </main>
    </div>
  );
}
