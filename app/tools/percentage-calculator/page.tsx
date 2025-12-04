"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Percent,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Coins,
} from "lucide-react";

type CalculatorMode = "basic" | "change" | "discount" | "tip" | "margin";

interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

const currencies: Currency[] = [
  { code: "EUR", symbol: "€", name: "Euro", locale: "fr-FR", decimals: 2 },
  { code: "USD", symbol: "$", name: "Dollar US", locale: "en-US", decimals: 2 },
  { code: "GBP", symbol: "£", name: "Livre Sterling", locale: "en-GB", decimals: 2 },
  { code: "CHF", symbol: "CHF", name: "Franc Suisse", locale: "fr-CH", decimals: 2 },
  { code: "CAD", symbol: "CA$", name: "Dollar Canadien", locale: "en-CA", decimals: 2 },
  { code: "XOF", symbol: "CFA", name: "Franc CFA (BCEAO)", locale: "fr-FR", decimals: 0 },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA (BEAC)", locale: "fr-FR", decimals: 0 },
  { code: "MAD", symbol: "DH", name: "Dirham Marocain", locale: "fr-MA", decimals: 2 },
  { code: "TND", symbol: "DT", name: "Dinar Tunisien", locale: "fr-TN", decimals: 3 },
  { code: "DZD", symbol: "DA", name: "Dinar Algérien", locale: "fr-DZ", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Yen Japonais", locale: "ja-JP", decimals: 0 },
  { code: "CNY", symbol: "¥", name: "Yuan Chinois", locale: "zh-CN", decimals: 2 },
  { code: "INR", symbol: "₹", name: "Roupie Indienne", locale: "en-IN", decimals: 2 },
  { code: "BRL", symbol: "R$", name: "Real Brésilien", locale: "pt-BR", decimals: 2 },
  { code: "MXN", symbol: "MX$", name: "Peso Mexicain", locale: "es-MX", decimals: 2 },
];

const STORAGE_KEY = "percentage-calculator-currency";

export default function PercentageCalculatorPage() {
  const [mode, setMode] = useState<CalculatorMode>("basic");
  const [currency, setCurrency] = useState("EUR");

  // Basic mode
  const [percentValue, setPercentValue] = useState("");
  const [ofValue, setOfValue] = useState("");

  // Change mode
  const [originalValue, setOriginalValue] = useState("");
  const [newValue, setNewValue] = useState("");

  // Discount mode
  const [price, setPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  // Tip mode
  const [billAmount, setBillAmount] = useState("");
  const [tipPercent, setTipPercent] = useState("15");
  const [splitBy, setSplitBy] = useState("1");

  // Margin mode
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  // Load saved currency
  useEffect(() => {
    const savedCurrency = localStorage.getItem(STORAGE_KEY);
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save currency preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  const basicResult = useMemo(() => {
    const percent = parseFloat(percentValue);
    const of = parseFloat(ofValue);
    if (isNaN(percent) || isNaN(of)) return null;
    return (percent / 100) * of;
  }, [percentValue, ofValue]);

  const changeResult = useMemo(() => {
    const original = parseFloat(originalValue);
    const newVal = parseFloat(newValue);
    if (isNaN(original) || isNaN(newVal) || original === 0) return null;
    const change = ((newVal - original) / original) * 100;
    return {
      change,
      difference: newVal - original,
      isIncrease: change >= 0,
    };
  }, [originalValue, newValue]);

  const discountResult = useMemo(() => {
    const priceVal = parseFloat(price);
    const discount = parseFloat(discountPercent);
    if (isNaN(priceVal) || isNaN(discount)) return null;
    const savings = (discount / 100) * priceVal;
    return {
      savings,
      finalPrice: priceVal - savings,
    };
  }, [price, discountPercent]);

  const tipResult = useMemo(() => {
    const bill = parseFloat(billAmount);
    const tip = parseFloat(tipPercent);
    const split = parseInt(splitBy) || 1;
    if (isNaN(bill) || isNaN(tip)) return null;
    const tipAmount = (tip / 100) * bill;
    const total = bill + tipAmount;
    return {
      tipAmount,
      total,
      perPerson: total / split,
    };
  }, [billAmount, tipPercent, splitBy]);

  const marginResult = useMemo(() => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    if (isNaN(cost) || isNaN(selling)) return null;

    const profit = selling - cost;
    const margin = selling > 0 ? (profit / selling) * 100 : 0;
    const markup = cost > 0 ? (profit / cost) * 100 : 0;

    return {
      profit,
      margin,
      markup,
    };
  }, [costPrice, sellingPrice]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (amount: number) => {
    // Special handling for CFA francs
    if (currency === "XOF" || currency === "XAF") {
      return new Intl.NumberFormat(currentCurrency.locale, {
        style: "decimal",
        maximumFractionDigits: 0,
      }).format(amount) + " " + currentCurrency.symbol;
    }

    try {
      return new Intl.NumberFormat(currentCurrency.locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: currentCurrency.decimals,
        maximumFractionDigits: currentCurrency.decimals,
      }).format(amount);
    } catch {
      return amount.toFixed(2) + " " + currentCurrency.symbol;
    }
  };

  // Show currency for modes that involve money
  const showCurrencySelector = mode === "discount" || mode === "tip" || mode === "margin";

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
        <h1 className="text-lg font-semibold">Calculateur de Pourcentages</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          {/* Mode selector */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "basic" as const, label: "Basique" },
              { id: "change" as const, label: "Variation" },
              { id: "discount" as const, label: "Remise" },
              { id: "tip" as const, label: "Pourboire" },
              { id: "margin" as const, label: "Marge" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Currency selector for money-related modes */}
          {showCurrencySelector && (
            <div className="mb-6 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Devise</span>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Basic mode */}
          {mode === "basic" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Quel est X% de Y ?
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-muted-foreground">Combien fait</span>
                  <input
                    type="number"
                    value={percentValue}
                    onChange={(e) => setPercentValue(e.target.value)}
                    placeholder="X"
                    className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-center"
                  />
                  <span className="text-muted-foreground">% de</span>
                  <input
                    type="number"
                    value={ofValue}
                    onChange={(e) => setOfValue(e.target.value)}
                    placeholder="Y"
                    className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-center"
                  />
                  <span className="text-muted-foreground">?</span>
                </div>

                {basicResult !== null && (
                  <div className="mt-6 rounded-lg bg-primary/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Résultat</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatNumber(basicResult)}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick percentages */}
              {ofValue && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Pourcentages courants de {formatNumber(parseFloat(ofValue) || 0, 0)}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20, 25, 33, 50, 75].map((p) => {
                      const val = parseFloat(ofValue);
                      if (isNaN(val)) return null;
                      return (
                        <div key={p} className="rounded-lg bg-muted p-2 text-center">
                          <p className="text-xs text-muted-foreground">{p}%</p>
                          <p className="font-medium">{formatNumber((p / 100) * val)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Change mode */}
          {mode === "change" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Calcul de variation
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Valeur initiale</label>
                    <input
                      type="number"
                      value={originalValue}
                      onChange={(e) => setOriginalValue(e.target.value)}
                      placeholder="100"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Nouvelle valeur</label>
                    <input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="120"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    />
                  </div>
                </div>

                {changeResult && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className={`rounded-lg p-4 text-center ${
                      changeResult.isIncrease ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      <div className="mb-1 flex items-center justify-center gap-1">
                        {changeResult.isIncrease ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className={`text-3xl font-bold ${
                        changeResult.isIncrease ? "text-green-500" : "text-red-500"
                      }`}>
                        {changeResult.isIncrease ? "+" : ""}{formatNumber(changeResult.change)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Variation</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-3xl font-bold">
                        {changeResult.difference >= 0 ? "+" : ""}{formatNumber(changeResult.difference)}
                      </p>
                      <p className="text-sm text-muted-foreground">Différence absolue</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discount mode */}
          {mode === "discount" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Calcul de remise
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Prix original</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="100"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currentCurrency.symbol}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Remise</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        placeholder="20"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {/* Quick discount buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 30, 50].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDiscountPercent(d.toString())}
                      className={`rounded-lg border px-3 py-1 text-sm ${
                        discountPercent === d.toString()
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      -{d}%
                    </button>
                  ))}
                </div>

                {discountResult && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-green-500/10 p-4 text-center">
                      <p className="text-3xl font-bold text-green-500">
                        -{formatCurrency(discountResult.savings)}
                      </p>
                      <p className="text-sm text-muted-foreground">Économie</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(discountResult.finalPrice)}
                      </p>
                      <p className="text-sm text-muted-foreground">Prix final</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tip mode */}
          {mode === "tip" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Calcul de pourboire
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Montant de l'addition</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="50"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currentCurrency.symbol}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Pourboire</label>
                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 18, 20, 25].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTipPercent(t.toString())}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                            tipPercent === t.toString()
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {t}%
                        </button>
                      ))}
                      <input
                        type="number"
                        value={tipPercent}
                        onChange={(e) => setTipPercent(e.target.value)}
                        className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-center"
                        placeholder="%"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Diviser par</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSplitBy(s.toString())}
                          className={`h-10 w-10 rounded-lg border text-sm font-medium ${
                            splitBy === s.toString()
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {tipResult && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-2xl font-bold">{formatCurrency(tipResult.tipAmount)}</p>
                      <p className="text-xs text-muted-foreground">Pourboire</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-2xl font-bold">{formatCurrency(tipResult.total)}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(tipResult.perPerson)}</p>
                      <p className="text-xs text-muted-foreground">Par personne</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Margin mode */}
          {mode === "margin" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Calcul de marge
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Prix d'achat (coût)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="50"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currentCurrency.symbol}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Prix de vente</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="75"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currentCurrency.symbol}
                      </span>
                    </div>
                  </div>
                </div>

                {marginResult && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className={`rounded-lg p-4 text-center ${
                      marginResult.profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      <p className={`text-2xl font-bold ${
                        marginResult.profit >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {marginResult.profit >= 0 ? "+" : ""}{formatCurrency(marginResult.profit)}
                      </p>
                      <p className="text-xs text-muted-foreground">Bénéfice</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-2xl font-bold">{formatNumber(marginResult.margin)}%</p>
                      <p className="text-xs text-muted-foreground">Marge</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-2xl font-bold">{formatNumber(marginResult.markup)}%</p>
                      <p className="text-xs text-muted-foreground">Majoration</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p><strong>Marge :</strong> Bénéfice / Prix de vente × 100</p>
                  <p><strong>Majoration :</strong> Bénéfice / Prix d'achat × 100</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
