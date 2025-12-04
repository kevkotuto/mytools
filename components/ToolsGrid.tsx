"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  QrCode,
  ArrowRight,
  Sparkles,
  Zap,
  Search,
  X,
  KeyRound,
  Fingerprint,
  FileText,
  ShieldCheck,
  Palette,
  Image,
  ImageIcon,
  Scale,
  Binary,
  Braces,
  Type,
  AppWindow,
  Shapes,
  Eraser,
  FileStack,
  FileSpreadsheet,
  FolderArchive,
  FileArchive,
  Workflow,
  Lock,
  Key,
  Shield,
  Clock,
  GitCompare,
  Minimize2,
  Scissors,
  Film,
  Crop,
  Code,
  Timer,
  Columns,
  Receipt,
  PenTool,
  CalendarDays,
  Home,
  Percent,
  Globe,
  Star,
} from "lucide-react";
import { tools } from "@/config/tools";
import { categoryLabels, type ToolCategory } from "@/types/tool";
import { useFavorites } from "@/hooks/useFavorites";

const iconMap: Record<string, React.ElementType> = {
  QrCode,
  KeyRound,
  Fingerprint,
  FileText,
  ShieldCheck,
  Palette,
  Image,
  ImageIcon,
  Scale,
  Binary,
  Braces,
  Type,
  AppWindow,
  Shapes,
  Eraser,
  FileStack,
  FileSpreadsheet,
  FolderArchive,
  FileArchive,
  Workflow,
  Lock,
  Key,
  Shield,
  Clock,
  GitCompare,
  Minimize2,
  Search,
  Sparkles,
  Scissors,
  Film,
  Crop,
  Code,
  Timer,
  Columns,
  Receipt,
  PenTool,
  CalendarDays,
  Home,
  Percent,
  Globe,
};

export default function ToolsGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const { favorites, isLoaded, toggleFavorite, isFavorite } = useFavorites();

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;

    const query = searchQuery.toLowerCase().trim();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        categoryLabels[tool.category].toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const favoriteTools = useMemo(() => {
    return tools.filter((tool) => favorites.includes(tool.id));
  }, [favorites]);

  const groupedTools = useMemo(() => {
    return filteredTools.reduce(
      (acc, tool) => {
        if (!acc[tool.category]) {
          acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
      },
      {} as Record<ToolCategory, typeof tools>
    );
  }, [filteredTools]);

  const hasResults = filteredTools.length > 0;

  return (
    <>
      {/* Favorites Bar */}
      {isLoaded && favoriteTools.length > 0 && (
        <div className="border-b border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Favoris
              </span>
              <div className="flex flex-wrap gap-2">
                {favoriteTools.map((tool) => {
                  const Icon = iconMap[tool.icon] || QrCode;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-primary/50 hover:bg-accent/50"
                      title={tool.name}
                    >
                      <Icon className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium">{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un outil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-3 text-sm text-muted-foreground">
            {filteredTools.length} outil{filteredTools.length !== 1 ? "s" : ""}{" "}
            trouvé{filteredTools.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Tools Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-12">
        {hasResults ? (
          Object.entries(groupedTools).map(([category, categoryTools]) => (
            <section key={category} className="mb-12">
              <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {categoryLabels[category as ToolCategory]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => {
                  const Icon = iconMap[tool.icon] || QrCode;
                  const toolIsFavorite = isFavorite(tool.id);
                  return (
                    <div
                      key={tool.id}
                      className="group relative rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
                    >
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        className="absolute right-4 top-4 z-10 rounded-md p-1.5 transition-colors hover:bg-secondary"
                        title={
                          toolIsFavorite
                            ? "Retirer des favoris"
                            : "Ajouter aux favoris"
                        }
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            toolIsFavorite
                              ? "text-amber-500 fill-amber-500"
                              : "text-muted-foreground hover:text-amber-500"
                          }`}
                        />
                      </button>

                      {/* Badges */}
                      <div className="absolute right-12 top-4 flex gap-2">
                        {tool.isNew && (
                          <span className="flex items-center gap-1 rounded-full bg-chart-1/10 px-2 py-0.5 text-xs font-medium text-chart-1">
                            <Sparkles className="h-3 w-3" />
                            Nouveau
                          </span>
                        )}
                        {tool.isPopular && (
                          <span className="flex items-center gap-1 rounded-full bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2">
                            <Zap className="h-3 w-3" />
                            Populaire
                          </span>
                        )}
                      </div>

                      <Link href={tool.href} className="block">
                        {/* Icon */}
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-6 w-6 text-foreground" />
                        </div>

                        {/* Content */}
                        <h3 className="mb-2 text-lg font-semibold">
                          {tool.name}
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                          {tool.description}
                        </p>

                        {/* CTA */}
                        <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                          Utiliser l&apos;outil
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="py-16 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Aucun outil trouvé</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Essayez avec d&apos;autres mots-clés
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Effacer la recherche
            </button>
          </div>
        )}
      </div>
    </>
  );
}
