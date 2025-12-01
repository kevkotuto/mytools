import { Zap } from "lucide-react";
import ToolsGrid from "@/components/ToolsGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">MyTools</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Mini-outils puissants
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Une collection d&apos;outils gratuits, rapides et sans inscription.
            Tout se passe dans votre navigateur, aucune donnée n&apos;est
            stockée sur nos serveurs.
          </p>
        </div>
      </section>

      {/* Search + Tools Grid */}
      <main>
        <ToolsGrid />
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Tous les outils fonctionnent localement dans votre navigateur.
            Aucune donnée n&apos;est envoyée à nos serveurs.
          </p>
        </div>
      </footer>
    </div>
  );
}
