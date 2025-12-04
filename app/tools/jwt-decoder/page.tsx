"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Key, Copy, Check, AlertTriangle, CheckCircle, Clock, User, Shield } from "lucide-react";
import Link from "next/link";

interface JWTHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  [key: string]: unknown;
}

interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  isValid: boolean;
  isExpired: boolean;
  expiresIn?: string;
}

export default function JWTDecoderPage() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [error, setError] = useState("");
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  const decodeBase64Url = (str: string): string => {
    // Replace URL-safe characters
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding
    const padding = base64.length % 4;
    if (padding) {
      base64 += "=".repeat(4 - padding);
    }
    return atob(base64);
  };

  const formatExpiresIn = (exp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = exp - now;

    if (diff < 0) {
      const absDiff = Math.abs(diff);
      if (absDiff < 60) return `Expiré il y a ${absDiff} secondes`;
      if (absDiff < 3600) return `Expiré il y a ${Math.floor(absDiff / 60)} minutes`;
      if (absDiff < 86400) return `Expiré il y a ${Math.floor(absDiff / 3600)} heures`;
      return `Expiré il y a ${Math.floor(absDiff / 86400)} jours`;
    }

    if (diff < 60) return `Expire dans ${diff} secondes`;
    if (diff < 3600) return `Expire dans ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `Expire dans ${Math.floor(diff / 3600)} heures`;
    return `Expire dans ${Math.floor(diff / 86400)} jours`;
  };

  useEffect(() => {
    if (!token.trim()) {
      setDecoded(null);
      setError("");
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Format JWT invalide. Un JWT doit avoir 3 parties séparées par des points.");
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      const header: JWTHeader = JSON.parse(decodeBase64Url(headerB64));
      const payload: JWTPayload = JSON.parse(decodeBase64Url(payloadB64));

      const isExpired = payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false;
      const expiresIn = payload.exp ? formatExpiresIn(payload.exp) : undefined;

      setDecoded({
        header,
        payload,
        signature: signatureB64,
        isValid: true,
        isExpired,
        expiresIn,
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du décodage du JWT");
      setDecoded(null);
    }
  }, [token]);

  const copyToClipboard = async (text: string, part: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPart(part);
    setTimeout(() => setCopiedPart(null), 2000);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "long",
    });
  };

  const formatJSON = (obj: object): string => {
    return JSON.stringify(obj, null, 2);
  };

  const sampleTokens = [
    {
      name: "Token expiré",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ",
    },
    {
      name: "Token valide (long)",
      token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFiYzEyMyJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBbGljZSBEdXBvbnQiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Im15LWFwcCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.signature",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">JWT Decoder</h1>
              <p className="text-sm text-zinc-500">Décodeur et analyseur de tokens JWT</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Token Input */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">Token JWT</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Collez votre token JWT ici (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
            className="w-full h-32 bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm"
          />
        </div>

        {/* Sample Tokens */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-sm text-zinc-500">Exemples :</span>
          {sampleTokens.map((sample) => (
            <button
              key={sample.name}
              onClick={() => setToken(sample.token)}
              className="text-sm px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              {sample.name}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Decoded Result */}
        {decoded && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`p-4 border flex items-center gap-3 ${
              decoded.isExpired
                ? "bg-red-500/10 border-red-500/50 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
            }`}>
              {decoded.isExpired ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span className="font-medium">
                {decoded.isExpired ? "Token expiré" : "Token valide (non expiré)"}
              </span>
              {decoded.expiresIn && (
                <span className="text-sm opacity-80">• {decoded.expiresIn}</span>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Header */}
              <div className="bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <h3 className="font-medium">Header</h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(formatJSON(decoded.header), "header")}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {copiedPart === "header" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto text-red-400">
                  {formatJSON(decoded.header)}
                </pre>
                <div className="p-4 border-t border-zinc-800 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Algorithme</span>
                    <span className="font-mono">{decoded.header.alg || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Type</span>
                    <span className="font-mono">{decoded.header.typ || "N/A"}</span>
                  </div>
                  {decoded.header.kid && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Key ID</span>
                      <span className="font-mono">{decoded.header.kid}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payload */}
              <div className="bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500"></div>
                    <h3 className="font-medium">Payload</h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(formatJSON(decoded.payload), "payload")}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {copiedPart === "payload" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto text-violet-400 max-h-64 overflow-y-auto">
                  {formatJSON(decoded.payload)}
                </pre>
              </div>
            </div>

            {/* Claims Details */}
            <div className="bg-zinc-900 border border-zinc-800">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="font-medium">Claims (Revendications)</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {decoded.payload.iss && (
                  <div className="p-4 flex items-start gap-4">
                    <Shield className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-500">Issuer (iss)</div>
                      <div className="font-mono">{decoded.payload.iss}</div>
                    </div>
                  </div>
                )}
                {decoded.payload.sub && (
                  <div className="p-4 flex items-start gap-4">
                    <User className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-500">Subject (sub)</div>
                      <div className="font-mono">{decoded.payload.sub}</div>
                    </div>
                  </div>
                )}
                {decoded.payload.aud && (
                  <div className="p-4 flex items-start gap-4">
                    <Shield className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-500">Audience (aud)</div>
                      <div className="font-mono">
                        {Array.isArray(decoded.payload.aud)
                          ? decoded.payload.aud.join(", ")
                          : decoded.payload.aud}
                      </div>
                    </div>
                  </div>
                )}
                {decoded.payload.iat && (
                  <div className="p-4 flex items-start gap-4">
                    <Clock className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-500">Issued At (iat)</div>
                      <div>{formatDate(decoded.payload.iat)}</div>
                    </div>
                  </div>
                )}
                {decoded.payload.exp && (
                  <div className="p-4 flex items-start gap-4">
                    <Clock className={`w-5 h-5 flex-shrink-0 ${decoded.isExpired ? "text-red-500" : "text-emerald-500"}`} />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-500">Expiration (exp)</div>
                      <div className={decoded.isExpired ? "text-red-400" : "text-emerald-400"}>
                        {formatDate(decoded.payload.exp)}
                      </div>
                    </div>
                  </div>
                )}
                {decoded.payload.nbf && (
                  <div className="p-4 flex items-start gap-4">
                    <Clock className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-500">Not Before (nbf)</div>
                      <div>{formatDate(decoded.payload.nbf)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Signature */}
            <div className="bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500"></div>
                  <h3 className="font-medium">Signature</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(decoded.signature, "signature")}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  {copiedPart === "signature" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <code className="text-sm font-mono text-cyan-400 break-all">
                  {decoded.signature}
                </code>
                <p className="mt-3 text-sm text-zinc-500">
                  La signature ne peut pas être vérifiée sans la clé secrète ou publique.
                  Ce décodeur affiche uniquement le contenu encodé.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!decoded && !error && (
          <div className="p-6 bg-zinc-900 border border-zinc-800">
            <h3 className="text-lg font-medium mb-4">Qu&apos;est-ce qu&apos;un JWT ?</h3>
            <p className="text-sm text-zinc-400 mb-4">
              JSON Web Token (JWT) est un standard ouvert (RFC 7519) pour transmettre des informations
              de manière sécurisée entre parties sous forme d&apos;objet JSON. Les JWT sont composés de trois parties :
            </p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">1.</span>
                <span><strong className="text-red-400">Header</strong> : Contient le type de token et l&apos;algorithme de signature</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">2.</span>
                <span><strong className="text-violet-400">Payload</strong> : Contient les claims (données) du token</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">3.</span>
                <span><strong className="text-cyan-400">Signature</strong> : Garantit l&apos;intégrité du token</span>
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
