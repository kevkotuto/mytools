"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Minus,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

type CalculatorMode = "difference" | "add" | "workdays" | "age";

interface DateDifference {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
}

export default function CalendarCalculatorPage() {
  const [mode, setMode] = useState<CalculatorMode>("difference");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [birthDate, setBirthDate] = useState("");
  const [addDays, setAddDays] = useState(0);
  const [addWeeks, setAddWeeks] = useState(0);
  const [addMonths, setAddMonths] = useState(0);
  const [addYears, setAddYears] = useState(0);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [excludeHolidays, setExcludeHolidays] = useState(false);

  // French holidays (approximate - some vary by year)
  const getHolidays = (year: number): string[] => {
    const holidays: string[] = [
      `${year}-01-01`, // Jour de l'an
      `${year}-05-01`, // Fête du travail
      `${year}-05-08`, // Victoire 1945
      `${year}-07-14`, // Fête nationale
      `${year}-08-15`, // Assomption
      `${year}-11-01`, // Toussaint
      `${year}-11-11`, // Armistice
      `${year}-12-25`, // Noël
    ];
    return holidays;
  };

  const calculateDifference = (start: Date, end: Date): DateDifference => {
    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = totalDays / 7;
    const totalHours = diffMs / (1000 * 60 * 60);
    const totalMinutes = diffMs / (1000 * 60);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return {
      years,
      months,
      days,
      totalDays: Math.abs(totalDays),
      totalWeeks: Math.abs(totalWeeks),
      totalHours: Math.abs(totalHours),
      totalMinutes: Math.abs(totalMinutes),
    };
  };

  const dateDifference = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return calculateDifference(start, end);
  }, [startDate, endDate]);

  const resultDate = useMemo(() => {
    if (!startDate) return null;

    const date = new Date(startDate);
    const multiplier = operation === "add" ? 1 : -1;

    date.setFullYear(date.getFullYear() + addYears * multiplier);
    date.setMonth(date.getMonth() + addMonths * multiplier);
    date.setDate(date.getDate() + (addDays + addWeeks * 7) * multiplier);

    return date;
  }, [startDate, addDays, addWeeks, addMonths, addYears, operation]);

  const workdaysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return 0;

    let count = 0;
    const holidays = [
      ...getHolidays(start.getFullYear()),
      ...getHolidays(end.getFullYear()),
    ];

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split("T")[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(dateStr);

      if (excludeWeekends && isWeekend) {
        // Skip weekends
      } else if (excludeHolidays && isHoliday) {
        // Skip holidays
      } else {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }, [startDate, endDate, excludeWeekends, excludeHolidays]);

  const ageInfo = useMemo(() => {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    const today = new Date();
    const diff = calculateDifference(birth, today);

    // Calculate next birthday
    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    const daysUntilBirthday = Math.ceil(
      (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Zodiac sign
    const month = birth.getMonth() + 1;
    const day = birth.getDate();
    let zodiac = "";

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiac = "Bélier ♈";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiac = "Taureau ♉";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiac = "Gémeaux ♊";
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiac = "Cancer ♋";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiac = "Lion ♌";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiac = "Vierge ♍";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiac = "Balance ♎";
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiac = "Scorpion ♏";
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiac = "Sagittaire ♐";
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiac = "Capricorne ♑";
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiac = "Verseau ♒";
    else zodiac = "Poissons ♓";

    return {
      ...diff,
      daysUntilBirthday,
      zodiac,
    };
  }, [birthDate]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
        <h1 className="text-lg font-semibold">Calculateur de Dates</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          {/* Mode selector */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "difference" as const, label: "Différence", icon: ArrowRight },
              { id: "add" as const, label: "Ajouter/Soustraire", icon: Plus },
              { id: "workdays" as const, label: "Jours ouvrés", icon: CalendarDays },
              { id: "age" as const, label: "Calculer l'âge", icon: Calendar },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Difference calculator */}
          {mode === "difference" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  />
                </div>
              </div>

              {dateDifference && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold">Résultat</h3>

                  <div className="mb-6 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {dateDifference.years > 0 && `${dateDifference.years} an${dateDifference.years > 1 ? "s" : ""} `}
                      {dateDifference.months > 0 && `${dateDifference.months} mois `}
                      {dateDifference.days} jour{dateDifference.days > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-2xl font-bold">{dateDifference.totalDays}</p>
                      <p className="text-xs text-muted-foreground">Jours</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-2xl font-bold">{dateDifference.totalWeeks.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Semaines</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-2xl font-bold">{Math.floor(dateDifference.totalHours)}</p>
                      <p className="text-xs text-muted-foreground">Heures</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-2xl font-bold">{Math.floor(dateDifference.totalMinutes)}</p>
                      <p className="text-xs text-muted-foreground">Minutes</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add/Subtract calculator */}
          {mode === "add" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <label className="mb-2 block text-sm font-medium">Date de départ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setOperation("add")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                    operation === "add"
                      ? "bg-green-500 text-white"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
                <button
                  onClick={() => setOperation("subtract")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                    operation === "subtract"
                      ? "bg-red-500 text-white"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  Soustraire
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Années</label>
                  <input
                    type="number"
                    value={addYears}
                    onChange={(e) => setAddYears(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    min={0}
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Mois</label>
                  <input
                    type="number"
                    value={addMonths}
                    onChange={(e) => setAddMonths(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    min={0}
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Semaines</label>
                  <input
                    type="number"
                    value={addWeeks}
                    onChange={(e) => setAddWeeks(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    min={0}
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Jours</label>
                  <input
                    type="number"
                    value={addDays}
                    onChange={(e) => setAddDays(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    min={0}
                  />
                </div>
              </div>

              {resultDate && (
                <div className="rounded-lg border border-primary bg-primary/5 p-6 text-center">
                  <p className="mb-2 text-sm text-muted-foreground">Résultat</p>
                  <p className="text-2xl font-bold capitalize">{formatDate(resultDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Workdays calculator */}
          {mode === "workdays" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-medium">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 font-medium">Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={excludeWeekends}
                      onChange={(e) => setExcludeWeekends(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Exclure les week-ends (samedi, dimanche)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={excludeHolidays}
                      onChange={(e) => setExcludeHolidays(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Exclure les jours fériés français</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-primary bg-primary/5 p-6 text-center">
                <p className="mb-2 text-sm text-muted-foreground">
                  {excludeWeekends || excludeHolidays ? "Jours ouvrés" : "Jours calendaires"}
                </p>
                <p className="text-4xl font-bold text-primary">{workdaysCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  jour{workdaysCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {/* Age calculator */}
          {mode === "age" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <label className="mb-2 block text-sm font-medium">Date de naissance</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {ageInfo && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-primary bg-primary/5 p-6 text-center">
                    <p className="mb-2 text-sm text-muted-foreground">Votre âge</p>
                    <p className="text-3xl font-bold text-primary">
                      {ageInfo.years} an{ageInfo.years > 1 ? "s" : ""}
                      {ageInfo.months > 0 && `, ${ageInfo.months} mois`}
                      {ageInfo.days > 0 && ` et ${ageInfo.days} jour${ageInfo.days > 1 ? "s" : ""}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <p className="text-2xl font-bold">{ageInfo.totalDays.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Jours vécus</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <p className="text-2xl font-bold">{Math.floor(ageInfo.totalWeeks).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Semaines</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <p className="text-2xl font-bold">{Math.floor(ageInfo.totalHours).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Heures</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <p className="text-2xl font-bold">{ageInfo.daysUntilBirthday}</p>
                      <p className="text-xs text-muted-foreground">Jours avant anniversaire</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">Signe astrologique</p>
                    <p className="text-xl font-medium">{ageInfo.zodiac}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
