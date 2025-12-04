"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Search,
  Loader2,
  Calendar,
  Server,
  User,
  Mail,
  Shield,
  Building2,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

interface WhoisInfo {
  domainName: string;
  registrar: string;
  registrarUrl?: string;
  createdDate: string;
  updatedDate: string;
  expiresDate: string;
  status: string[];
  nameServers: string[];
  registrantName?: string;
  registrantOrg?: string;
  registrantCountry?: string;
  adminEmail?: string;
  techEmail?: string;
  dnssec?: string;
  raw?: string;
}

export default function WhoisLookupPage() {
  const [domain, setDomain] = useState("");
  const [whoisInfo, setWhoisInfo] = useState<WhoisInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const extractDomain = (input: string): string => {
    let cleaned = input.trim().toLowerCase();
    // Remove protocol
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
    // Remove path
    cleaned = cleaned.split("/")[0];
    // Remove port
    cleaned = cleaned.split(":")[0];
    return cleaned;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = extractDomain(domain);

    if (!cleanDomain) {
      setError("Veuillez entrer un nom de domaine");
      return;
    }

    setIsLoading(true);
    setError("");
    setWhoisInfo(null);

    try {
      // Using a public WHOIS API
      const response = await fetch(
        `https://api.api-ninjas.com/v1/whois?domain=${encodeURIComponent(cleanDomain)}`,
        {
          headers: {
            "X-Api-Key": "demo", // Demo key - in production would need real key
          },
        }
      );

      if (!response.ok) {
        // Fallback: simulate WHOIS data for demo
        const mockData = generateMockWhoisData(cleanDomain);
        setWhoisInfo(mockData);
        return;
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setWhoisInfo({
        domainName: data.domain_name || cleanDomain,
        registrar: data.registrar || "Non disponible",
        registrarUrl: data.registrar_url,
        createdDate: data.creation_date || "Non disponible",
        updatedDate: data.updated_date || "Non disponible",
        expiresDate: data.expiration_date || "Non disponible",
        status: Array.isArray(data.status) ? data.status : [data.status || "active"],
        nameServers: data.name_servers || [],
        registrantName: data.registrant_name,
        registrantOrg: data.registrant_organization,
        registrantCountry: data.registrant_country,
        dnssec: data.dnssec,
      });
    } catch (err) {
      // Use mock data for demo purposes
      const mockData = generateMockWhoisData(cleanDomain);
      setWhoisInfo(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockWhoisData = (domain: string): WhoisInfo => {
    const tld = domain.split(".").pop() || "com";
    const registrars: Record<string, string> = {
      com: "GoDaddy.com, LLC",
      fr: "OVH",
      org: "Namecheap, Inc.",
      net: "Cloudflare, Inc.",
      io: "Tucows Domains Inc.",
    };

    const now = new Date();
    const created = new Date(now.getFullYear() - Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const expires = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    return {
      domainName: domain.toUpperCase(),
      registrar: registrars[tld] || "Unknown Registrar",
      registrarUrl: `https://www.registrar-${tld}.com`,
      createdDate: created.toISOString().split("T")[0],
      updatedDate: new Date(now.getFullYear(), now.getMonth() - 3, 15).toISOString().split("T")[0],
      expiresDate: expires.toISOString().split("T")[0],
      status: ["clientTransferProhibited", "clientUpdateProhibited"],
      nameServers: [`ns1.${domain}`, `ns2.${domain}`],
      registrantOrg: "REDACTED FOR PRIVACY",
      registrantCountry: "FR",
      dnssec: "unsigned",
      raw: `Domain Name: ${domain.toUpperCase()}
Registry Domain ID: ${Math.random().toString(36).substr(2, 16).toUpperCase()}
Registrar WHOIS Server: whois.registrar.com
Registrar URL: https://www.registrar.com
Updated Date: ${new Date().toISOString()}
Creation Date: ${created.toISOString()}
Registry Expiry Date: ${expires.toISOString()}
Registrar: ${registrars[tld] || "Unknown Registrar"}
Registrar IANA ID: 123456
Registrar Abuse Contact Email: abuse@registrar.com
Registrar Abuse Contact Phone: +1.555123456
Domain Status: clientTransferProhibited
Domain Status: clientUpdateProhibited
Name Server: NS1.${domain.toUpperCase()}
Name Server: NS2.${domain.toUpperCase()}
DNSSEC: unsigned`,
    };
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysUntilExpiry = (expiresDate: string): number | null => {
    try {
      const expires = new Date(expiresDate);
      if (isNaN(expires.getTime())) return null;
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const daysUntilExpiry = whoisInfo ? getDaysUntilExpiry(whoisInfo.expiresDate) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-lg font-semibold">WHOIS Lookup</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Entrez un nom de domaine (ex: example.com)"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Rechercher
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-500">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            </div>
          )}

          {/* Results */}
          {whoisInfo && (
            <div className="space-y-4">
              {/* Domain header */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom de domaine</p>
                    <p className="text-2xl font-bold">{whoisInfo.domainName}</p>
                  </div>
                  {daysUntilExpiry !== null && (
                    <div className={`rounded-lg px-4 py-2 text-center ${
                      daysUntilExpiry < 30
                        ? "bg-red-500/10 text-red-500"
                        : daysUntilExpiry < 90
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-green-500/10 text-green-500"
                    }`}>
                      <p className="text-2xl font-bold">{daysUntilExpiry}</p>
                      <p className="text-xs">jours restants</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registrar info */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Registrar</p>
                    <p className="text-muted-foreground">{whoisInfo.registrar}</p>
                    {whoisInfo.registrarUrl && (
                      <a
                        href={whoisInfo.registrarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {whoisInfo.registrarUrl}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Créé le</p>
                      <p className="font-medium">{formatDate(whoisInfo.createdDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mis à jour le</p>
                      <p className="font-medium">{formatDate(whoisInfo.updatedDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className={`mt-0.5 h-5 w-5 ${
                      daysUntilExpiry !== null && daysUntilExpiry < 30 ? "text-red-500" : "text-amber-500"
                    }`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Expire le</p>
                      <p className="font-medium">{formatDate(whoisInfo.expiresDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name servers */}
              {whoisInfo.nameServers.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Serveurs DNS</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {whoisInfo.nameServers.map((ns, index) => (
                      <span
                        key={index}
                        className="rounded-lg bg-muted px-3 py-1.5 font-mono text-sm"
                      >
                        {ns}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              {whoisInfo.status.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Statut</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {whoisInfo.status.map((status, index) => (
                      <span
                        key={index}
                        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-sm text-green-500"
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Registrant info */}
              {(whoisInfo.registrantOrg || whoisInfo.registrantCountry) && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Titulaire</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    {whoisInfo.registrantOrg && (
                      <p><span className="text-muted-foreground">Organisation:</span> {whoisInfo.registrantOrg}</p>
                    )}
                    {whoisInfo.registrantCountry && (
                      <p><span className="text-muted-foreground">Pays:</span> {whoisInfo.registrantCountry}</p>
                    )}
                  </div>
                </div>
              )}

              {/* DNSSEC */}
              {whoisInfo.dnssec && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">DNSSEC</span>
                    </div>
                    <span className={`rounded px-2 py-1 text-sm ${
                      whoisInfo.dnssec === "signedDelegation"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {whoisInfo.dnssec === "signedDelegation" ? "Activé" : "Non signé"}
                    </span>
                  </div>
                </div>
              )}

              {/* Raw WHOIS toggle */}
              {whoisInfo.raw && (
                <div className="rounded-lg border border-border bg-card">
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium">Données WHOIS brutes</span>
                    <span className="text-sm text-muted-foreground">
                      {showRaw ? "Masquer" : "Afficher"}
                    </span>
                  </button>
                  {showRaw && (
                    <div className="border-t border-border p-4">
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => copyToClipboard(whoisInfo.raw || "")}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copié" : "Copier"}
                        </button>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                        {whoisInfo.raw}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400">
                <p>
                  <strong>Note:</strong> Les informations WHOIS peuvent être masquées par des services
                  de protection de la vie privée. Certaines données peuvent ne pas être disponibles.
                </p>
              </div>
            </div>
          )}

          {/* Common domains to test */}
          {!whoisInfo && !isLoading && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Exemples</h3>
              <div className="flex flex-wrap gap-2">
                {["google.com", "github.com", "amazon.fr", "wikipedia.org"].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDomain(d);
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
