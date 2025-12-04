"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  Clock,
  Shield,
  Search,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  hostname?: string;
}

export default function IPLookupPage() {
  const [ip, setIp] = useState("");
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [myIp, setMyIp] = useState<IPInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Get user's IP on mount
  useEffect(() => {
    fetchIPInfo();
  }, []);

  const fetchIPInfo = async (targetIp?: string) => {
    setIsLoading(true);
    setError("");

    try {
      const url = targetIp
        ? `https://ipinfo.io/${targetIp}/json`
        : "https://ipinfo.io/json";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Impossible de récupérer les informations IP");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "IP invalide");
      }

      const info: IPInfo = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        countryCode: data.country,
        loc: data.loc,
        org: data.org,
        postal: data.postal,
        timezone: data.timezone,
        hostname: data.hostname,
      };

      if (targetIp) {
        setIpInfo(info);
      } else {
        setMyIp(info);
        setIpInfo(info);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ip.trim()) {
      fetchIPInfo(ip.trim());
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidIP = (ip: string): boolean => {
    // IPv4
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const getCountryFlag = (code?: string) => {
    if (!code) return "";
    const codePoints = code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

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
        <h1 className="text-lg font-semibold">IP Address Lookup</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          {/* Your IP */}
          {myIp && (
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Votre adresse IP</p>
                  <p className="text-2xl font-bold">{myIp.ip}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(myIp.ip)}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="Entrez une adresse IP (ex: 8.8.8.8)"
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
              {error}
            </div>
          )}

          {/* Results */}
          {ipInfo && !error && (
            <div className="space-y-4">
              {/* Main info */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {getCountryFlag(ipInfo.countryCode)}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ipInfo.ip}</p>
                    {ipInfo.hostname && (
                      <p className="text-sm text-muted-foreground">{ipInfo.hostname}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Location */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Localisation</p>
                      <p className="text-sm text-muted-foreground">
                        {[ipInfo.city, ipInfo.region, ipInfo.country].filter(Boolean).join(", ")}
                      </p>
                      {ipInfo.postal && (
                        <p className="text-xs text-muted-foreground">Code postal: {ipInfo.postal}</p>
                      )}
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Organisation / FAI</p>
                      <p className="text-sm text-muted-foreground">
                        {ipInfo.org || "Non disponible"}
                      </p>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fuseau horaire</p>
                      <p className="text-sm text-muted-foreground">
                        {ipInfo.timezone || "Non disponible"}
                      </p>
                    </div>
                  </div>

                  {/* Coordinates */}
                  {ipInfo.loc && (
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <Globe className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Coordonnées</p>
                        <p className="text-sm text-muted-foreground">{ipInfo.loc}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              {ipInfo.loc && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-medium">Carte</h3>
                  <div className="aspect-video overflow-hidden rounded-lg border border-border">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        parseFloat(ipInfo.loc.split(",")[1]) - 0.5
                      }%2C${
                        parseFloat(ipInfo.loc.split(",")[0]) - 0.5
                      }%2C${
                        parseFloat(ipInfo.loc.split(",")[1]) + 0.5
                      }%2C${
                        parseFloat(ipInfo.loc.split(",")[0]) + 0.5
                      }&layer=mapnik&marker=${ipInfo.loc.split(",")[0]}%2C${ipInfo.loc.split(",")[1]}`}
                    />
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${ipInfo.loc.split(",")[0]}&mlon=${ipInfo.loc.split(",")[1]}#map=12/${ipInfo.loc.split(",")[0]}/${ipInfo.loc.split(",")[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Voir sur OpenStreetMap →
                  </a>
                </div>
              )}

              {/* Info note */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    <p className="font-medium">Note sur la précision</p>
                    <p className="mt-1">
                      La géolocalisation par IP est approximative et peut indiquer le fournisseur d'accès
                      plutôt que l'emplacement exact de l'utilisateur.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Common IPs to test */}
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">IPs de test</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { ip: "8.8.8.8", label: "Google DNS" },
                { ip: "1.1.1.1", label: "Cloudflare" },
                { ip: "208.67.222.222", label: "OpenDNS" },
                { ip: "9.9.9.9", label: "Quad9" },
              ].map(({ ip: testIp, label }) => (
                <button
                  key={testIp}
                  onClick={() => {
                    setIp(testIp);
                    fetchIPInfo(testIp);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  {testIp} <span className="text-muted-foreground">({label})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
