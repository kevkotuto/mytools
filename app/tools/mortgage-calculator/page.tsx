"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Calendar,
  Coins,
} from "lucide-react";

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

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

const STORAGE_KEY = "mortgage-calculator-currency";

export default function MortgageCalculatorPage() {
  const [currency, setCurrency] = useState("EUR");
  const [loanAmount, setLoanAmount] = useState(200000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [downPayment, setDownPayment] = useState(20000);
  const [insuranceRate, setInsuranceRate] = useState(0.36);
  const [showAmortization, setShowAmortization] = useState(false);

  // Load saved currency on mount
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

  const calculations = useMemo(() => {
    const principal = loanAmount - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyInsurance = (principal * insuranceRate / 100) / 12;

    // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = principal / numberOfPayments;
    } else {
      monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    const totalMonthlyPayment = monthlyPayment + monthlyInsurance;
    const totalPayment = totalMonthlyPayment * numberOfPayments;
    const totalInterest = monthlyPayment * numberOfPayments - principal;
    const totalInsurance = monthlyInsurance * numberOfPayments;

    // Generate amortization schedule
    const amortization: AmortizationRow[] = [];
    let balance = principal;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance = Math.max(0, balance - principalPayment);

      amortization.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance,
      });
    }

    return {
      principal,
      monthlyPayment,
      monthlyInsurance,
      totalMonthlyPayment,
      totalPayment,
      totalInterest,
      totalInsurance,
      amortization,
    };
  }, [loanAmount, interestRate, loanTerm, downPayment, insuranceRate]);

  const formatCurrency = (amount: number, showDecimals: boolean = false) => {
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
        maximumFractionDigits: showDecimals ? currentCurrency.decimals : 0,
        minimumFractionDigits: showDecimals ? currentCurrency.decimals : 0,
      }).format(amount);
    } catch {
      return amount.toFixed(showDecimals ? 2 : 0) + " " + currentCurrency.symbol;
    }
  };

  // Calculate percentages for pie chart
  const principalPercent = (calculations.principal / calculations.totalPayment) * 100;
  const interestPercent = (calculations.totalInterest / calculations.totalPayment) * 100;
  const insurancePercent = (calculations.totalInsurance / calculations.totalPayment) * 100;

  // Dynamic ranges based on currency (CFA has higher amounts)
  const isCFA = currency === "XOF" || currency === "XAF";
  const maxLoanAmount = isCFA ? 500000000 : 1000000;
  const minLoanAmount = isCFA ? 1000000 : 50000;
  const stepLoanAmount = isCFA ? 1000000 : 5000;

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
        <h1 className="text-lg font-semibold">Simulateur de Prêt Immobilier</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input form */}
            <div className="space-y-4">
              {/* Currency selector */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Devise</h2>
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

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Paramètres du prêt</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 flex justify-between text-sm">
                      <span>Prix du bien</span>
                      <span className="font-medium">{formatCurrency(loanAmount)}</span>
                    </label>
                    <input
                      type="range"
                      min={minLoanAmount}
                      max={maxLoanAmount}
                      step={stepLoanAmount}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(minLoanAmount)}</span>
                      <span>{formatCurrency(maxLoanAmount)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex justify-between text-sm">
                      <span>Apport personnel</span>
                      <span className="font-medium">{formatCurrency(downPayment)}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={loanAmount * 0.5}
                      step={stepLoanAmount / 5}
                      value={downPayment}
                      onChange={(e) => setDownPayment(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(0)}</span>
                      <span>{formatCurrency(loanAmount * 0.5)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex justify-between text-sm">
                      <span>Taux d'intérêt annuel</span>
                      <span className="font-medium">{interestRate.toFixed(2)} %</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={15}
                      step={0.05}
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>0,5 %</span>
                      <span>15 %</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex justify-between text-sm">
                      <span>Durée du prêt</span>
                      <span className="font-medium">{loanTerm} ans</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>5 ans</span>
                      <span>30 ans</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex justify-between text-sm">
                      <span>Taux assurance</span>
                      <span className="font-medium">{insuranceRate.toFixed(2)} %</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={insuranceRate}
                      onChange={(e) => setInsuranceRate(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>0 %</span>
                      <span>1 %</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-medium">Répartition du coût total</h3>
                <div className="relative mx-auto mb-4 h-48 w-48">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
                    {/* Principal */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="20"
                      strokeDasharray={`${principalPercent * 2.51} 251`}
                      strokeDashoffset="0"
                    />
                    {/* Interest */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="20"
                      strokeDasharray={`${interestPercent * 2.51} 251`}
                      strokeDashoffset={-principalPercent * 2.51}
                    />
                    {/* Insurance */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="20"
                      strokeDasharray={`${insurancePercent * 2.51} 251`}
                      strokeDashoffset={-(principalPercent + interestPercent) * 2.51}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Coût total</p>
                      <p className="text-lg font-bold">{formatCurrency(calculations.totalPayment)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span>Capital</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <span>Intérêts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                    <span>Assurance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {/* Monthly payment highlight */}
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
                <p className="mb-2 text-sm text-muted-foreground">Mensualité totale</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(calculations.totalMonthlyPayment, true)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">par mois pendant {loanTerm} ans</p>
              </div>

              {/* Detailed breakdown */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-medium">Détail de la mensualité</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remboursement crédit</span>
                    <span className="font-medium">{formatCurrency(calculations.monthlyPayment, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assurance</span>
                    <span className="font-medium">{formatCurrency(calculations.monthlyInsurance, true)}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total mensuel</span>
                      <span>{formatCurrency(calculations.totalMonthlyPayment, true)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total costs */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-medium">Coût total du crédit</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant emprunté</span>
                    <span className="font-medium">{formatCurrency(calculations.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total des intérêts</span>
                    <span className="font-medium text-destructive">{formatCurrency(calculations.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total assurance</span>
                    <span className="font-medium">{formatCurrency(calculations.totalInsurance)}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Coût total du crédit</span>
                      <span>{formatCurrency(calculations.totalInterest + calculations.totalInsurance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold">{((calculations.principal / loanAmount) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Financement</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold">{loanTerm * 12}</p>
                  <p className="text-xs text-muted-foreground">Mensualités</p>
                </div>
              </div>

              {/* Amortization toggle */}
              <button
                onClick={() => setShowAmortization(!showAmortization)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium hover:bg-accent"
              >
                <Calendar className="h-4 w-4" />
                {showAmortization ? "Masquer" : "Voir"} le tableau d'amortissement
              </button>
            </div>
          </div>

          {/* Amortization table */}
          {showAmortization && (
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 font-medium">Tableau d'amortissement</h3>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium">Mois</th>
                      <th className="px-3 py-2 text-right font-medium">Mensualité</th>
                      <th className="px-3 py-2 text-right font-medium">Capital</th>
                      <th className="px-3 py-2 text-right font-medium">Intérêts</th>
                      <th className="px-3 py-2 text-right font-medium">Reste dû</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.amortization.map((row) => (
                      <tr key={row.month} className="border-b border-border/50">
                        <td className="px-3 py-2">{row.month}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(row.payment, true)}</td>
                        <td className="px-3 py-2 text-right text-primary">{formatCurrency(row.principal, true)}</td>
                        <td className="px-3 py-2 text-right text-destructive">{formatCurrency(row.interest, true)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(row.balance, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
