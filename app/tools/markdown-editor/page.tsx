"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, FileText, Copy, Check, Download, Eye, Edit3, Columns, Bold, Italic, Link as LinkIcon, List, ListOrdered, Code, Quote, Image, Heading1, Heading2, Heading3 } from "lucide-react";
import Link from "next/link";

type ViewMode = "edit" | "preview" | "split";

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState(`# Bienvenue dans l'éditeur Markdown

Cet éditeur vous permet d'écrire du **Markdown** avec une prévisualisation en temps réel.

## Fonctionnalités

- Édition en temps réel
- Prévisualisation instantanée
- Export du fichier Markdown
- **Texte en gras** et *italique*
- \`Code inline\` et blocs de code

### Exemple de code

\`\`\`javascript
function hello(name) {
  console.log("Hello, " + name + "!");
}
\`\`\`

### Liste de tâches

- [x] Créer l'éditeur
- [x] Ajouter la prévisualisation
- [ ] Ajouter plus de fonctionnalités

### Citation

> Le Markdown est un langage de balisage léger créé par John Gruber.

### Tableau

| Colonne 1 | Colonne 2 | Colonne 3 |
|-----------|-----------|-----------|
| Cellule 1 | Cellule 2 | Cellule 3 |
| Cellule 4 | Cellule 5 | Cellule 6 |

### Image

![Placeholder](https://via.placeholder.com/300x200)

---

Bonne édition ! 🚀
`);

  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);

  const parseMarkdown = useCallback((md: string): string => {
    let html = md;

    // Escape HTML
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code blocks (must be first)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-zinc-800 p-4 overflow-x-auto my-4"><code class="text-sm text-emerald-400">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 text-sm text-pink-400">$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

    // Bold and Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del class="text-zinc-500">$1</del>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full my-4 rounded" />');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-zinc-600 pl-4 italic text-zinc-400 my-4">$1</blockquote>');

    // Task lists
    html = html.replace(/^- \[x\] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="accent-emerald-500" /><span class="line-through text-zinc-500">$1</span></div>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled /><span>$1</span></div>');

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/(<li class="ml-4 list-disc">.*<\/li>\n?)+/g, '<ul class="my-4">$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
    html = html.replace(/(<li class="ml-4 list-decimal">.*<\/li>\n?)+/g, '<ol class="my-4">$&</ol>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split("|").map((c: string) => c.trim());
      if (cells.every((c: string) => /^[-:]+$/.test(c))) {
        return ""; // Skip separator row
      }
      const cellType = match.includes("---") ? "th" : "td";
      const cellClass = cellType === "th" ? "px-4 py-2 bg-zinc-800 font-medium" : "px-4 py-2 border-t border-zinc-700";
      return `<tr>${cells.map((c: string) => `<${cellType} class="${cellClass}">${c}</${cellType}>`).join("")}</tr>`;
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="w-full my-4 border border-zinc-700">$&</table>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr class="my-8 border-zinc-700" />');

    // Paragraphs (lines that aren't already wrapped)
    html = html.split("\n\n").map(block => {
      if (block.trim() && !block.startsWith("<")) {
        return `<p class="my-4">${block}</p>`;
      }
      return block;
    }).join("\n");

    // Line breaks
    html = html.replace(/\n/g, "<br />");

    return html;
  }, []);

  const htmlPreview = useMemo(() => parseMarkdown(markdown), [markdown, parseMarkdown]);

  const insertText = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);

    setMarkdown(newText);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = useMemo(() => {
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    const chars = markdown.length;
    const lines = markdown.split("\n").length;
    return { words, chars, lines };
  }, [markdown]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Markdown Editor</h1>
              <p className="text-sm text-zinc-500 hidden sm:block">Éditeur avec prévisualisation live</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* View Mode Toggle */}
          <div className="flex border border-zinc-700">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                viewMode === "edit" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Éditer</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 border-x border-zinc-700 ${
                viewMode === "split" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                viewMode === "preview" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? "Copié" : "Copier"}</span>
          </button>
          <button
            onClick={downloadFile}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </button>
        </div>
      </header>

      {/* Toolbar */}
      {viewMode !== "preview" && (
        <div className="border-b border-zinc-800 px-4 py-2 flex flex-wrap gap-1 flex-shrink-0">
          <button
            onClick={() => insertText("**", "**")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("*", "*")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px bg-zinc-700 mx-1" />
          <button
            onClick={() => insertText("# ")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Titre 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("## ")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Titre 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("### ")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Titre 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <div className="w-px bg-zinc-700 mx-1" />
          <button
            onClick={() => insertText("- ")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("1. ")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px bg-zinc-700 mx-1" />
          <button
            onClick={() => insertText("[", "](url)")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Lien"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("![alt](", ")")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("`", "`")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Code inline"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText("> ")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Citation"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {viewMode !== "preview" && (
          <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} flex flex-col`}>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 bg-zinc-900 px-4 py-4 text-zinc-100 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              placeholder="Écrivez votre Markdown ici..."
            />
          </div>
        )}

        {/* Divider */}
        {viewMode === "split" && <div className="w-px bg-zinc-700" />}

        {/* Preview */}
        {viewMode !== "edit" && (
          <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} overflow-auto`}>
            <div
              className="p-6 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-zinc-800 px-4 py-2 flex items-center gap-6 text-sm text-zinc-500 flex-shrink-0">
        <span>{wordCount.words} mots</span>
        <span>{wordCount.chars} caractères</span>
        <span>{wordCount.lines} lignes</span>
      </div>
    </div>
  );
}
