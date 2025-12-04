"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Clock, Copy, Check, Calendar, Play, HelpCircle } from "lucide-react";
import Link from "next/link";

interface CronPart {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  range: { min: number; max: number };
  names?: string[];
}

const cronPresets = [
  { name: "Chaque minute", cron: "* * * * *" },
  { name: "Chaque heure", cron: "0 * * * *" },
  { name: "Chaque jour à minuit", cron: "0 0 * * *" },
  { name: "Chaque jour à 9h", cron: "0 9 * * *" },
  { name: "Chaque lundi à 9h", cron: "0 9 * * 1" },
  { name: "1er du mois à 0h", cron: "0 0 1 * *" },
  { name: "Chaque 15 minutes", cron: "*/15 * * * *" },
  { name: "Chaque 6 heures", cron: "0 */6 * * *" },
  { name: "Semaine à 18h", cron: "0 18 * * 1-5" },
  { name: "Weekend à midi", cron: "0 12 * * 0,6" },
];

const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function CronBuilderPage() {
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [copied, setCopied] = useState(false);
  const [nextRuns, setNextRuns] = useState<Date[]>([]);

  const cronExpression = useMemo(() => {
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const parseCronPart = (value: string, min: number, max: number): number[] => {
    const result: number[] = [];

    if (value === "*") {
      for (let i = min; i <= max; i++) result.push(i);
      return result;
    }

    const parts = value.split(",");
    for (const part of parts) {
      if (part.includes("/")) {
        const [range, step] = part.split("/");
        const stepNum = parseInt(step);
        let start = min;
        let end = max;

        if (range !== "*") {
          if (range.includes("-")) {
            [start, end] = range.split("-").map(Number);
          } else {
            start = parseInt(range);
          }
        }

        for (let i = start; i <= end; i += stepNum) {
          result.push(i);
        }
      } else if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
      } else {
        result.push(parseInt(part));
      }
    }

    return [...new Set(result)].sort((a, b) => a - b);
  };

  const getNextRuns = (cron: string, count: number = 5): Date[] => {
    const runs: Date[] = [];
    const [minStr, hourStr, domStr, monthStr, dowStr] = cron.split(" ");

    const minutes = parseCronPart(minStr, 0, 59);
    const hours = parseCronPart(hourStr, 0, 23);
    const daysOfMonth = parseCronPart(domStr, 1, 31);
    const months = parseCronPart(monthStr, 1, 12);
    const daysOfWeek = parseCronPart(dowStr, 0, 6);

    const now = new Date();
    const checkDate = new Date(now);
    checkDate.setSeconds(0);
    checkDate.setMilliseconds(0);

    let iterations = 0;
    const maxIterations = 10000;

    while (runs.length < count && iterations < maxIterations) {
      iterations++;

      const month = checkDate.getMonth() + 1;
      const dom = checkDate.getDate();
      const dow = checkDate.getDay();
      const hour = checkDate.getHours();
      const min = checkDate.getMinutes();

      const monthMatch = months.includes(month);
      const domMatch = daysOfMonth.includes(dom);
      const dowMatch = daysOfWeek.includes(dow);
      const hourMatch = hours.includes(hour);
      const minMatch = minutes.includes(min);

      // DOM and DOW: if both are restricted, match either
      const dayMatch = (domStr === "*" && dowStr === "*")
        ? true
        : (domStr === "*" ? dowMatch : (dowStr === "*" ? domMatch : (domMatch || dowMatch)));

      if (monthMatch && dayMatch && hourMatch && minMatch && checkDate > now) {
        runs.push(new Date(checkDate));
      }

      // Increment minute
      checkDate.setMinutes(checkDate.getMinutes() + 1);
    }

    return runs;
  };

  useEffect(() => {
    try {
      const runs = getNextRuns(cronExpression);
      setNextRuns(runs);
    } catch {
      setNextRuns([]);
    }
  }, [cronExpression]);

  const describeCron = (): string => {
    const parts: string[] = [];

    // Minute
    if (minute === "*") {
      parts.push("Chaque minute");
    } else if (minute.startsWith("*/")) {
      parts.push(`Toutes les ${minute.slice(2)} minutes`);
    } else if (minute === "0") {
      // Will be combined with hour
    } else {
      parts.push(`À la minute ${minute}`);
    }

    // Hour
    if (hour === "*") {
      if (minute !== "*") parts.push("de chaque heure");
    } else if (hour.startsWith("*/")) {
      parts.push(`toutes les ${hour.slice(2)} heures`);
    } else {
      parts.push(`à ${hour}h${minute !== "0" && minute !== "*" ? minute : "00"}`);
    }

    // Day of month
    if (dayOfMonth !== "*") {
      if (dayOfMonth.includes(",")) {
        parts.push(`les ${dayOfMonth} du mois`);
      } else if (dayOfMonth.includes("-")) {
        const [start, end] = dayOfMonth.split("-");
        parts.push(`du ${start} au ${end} du mois`);
      } else {
        parts.push(`le ${dayOfMonth} du mois`);
      }
    }

    // Month
    if (month !== "*") {
      const monthNums = month.split(",").map(Number);
      const monthLabels = monthNums.map(m => monthNames[m - 1]);
      parts.push(`en ${monthLabels.join(", ")}`);
    }

    // Day of week
    if (dayOfWeek !== "*") {
      if (dayOfWeek === "1-5") {
        parts.push("du lundi au vendredi");
      } else if (dayOfWeek === "0,6") {
        parts.push("le weekend");
      } else {
        const dayNums = dayOfWeek.split(",").map(Number);
        const dayLabels = dayNums.map(d => dayNames[d]);
        parts.push(`le ${dayLabels.join(", ")}`);
      }
    }

    return parts.join(" ") || "Configuration non définie";
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (cron: string) => {
    const [min, hr, dom, mon, dow] = cron.split(" ");
    setMinute(min);
    setHour(hr);
    setDayOfMonth(dom);
    setMonth(mon);
    setDayOfWeek(dow);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            <div className="w-10 h-10 bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Cron Expression Builder</h1>
              <p className="text-sm text-zinc-500">Générateur d&apos;expressions cron</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Expression Display */}
        <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-zinc-400">Expression Cron</label>
            <button
              onClick={copyToClipboard}
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <div className="flex items-center gap-2 font-mono text-3xl text-center justify-center py-4">
            <span className="text-emerald-400">{minute}</span>
            <span className="text-zinc-600">&nbsp;</span>
            <span className="text-blue-400">{hour}</span>
            <span className="text-zinc-600">&nbsp;</span>
            <span className="text-amber-400">{dayOfMonth}</span>
            <span className="text-zinc-600">&nbsp;</span>
            <span className="text-violet-400">{month}</span>
            <span className="text-zinc-600">&nbsp;</span>
            <span className="text-pink-400">{dayOfWeek}</span>
          </div>
          <div className="flex justify-center gap-4 text-xs text-zinc-500 mt-2">
            <span className="text-emerald-400">minute</span>
            <span className="text-blue-400">heure</span>
            <span className="text-amber-400">jour/mois</span>
            <span className="text-violet-400">mois</span>
            <span className="text-pink-400">jour/sem</span>
          </div>
          <p className="text-center mt-4 text-zinc-300">{describeCron()}</p>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Préréglages courants
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {cronPresets.map((preset) => (
              <button
                key={preset.cron}
                onClick={() => applyPreset(preset.cron)}
                className={`px-3 py-1.5 border text-sm transition-colors ${
                  cronExpression === preset.cron
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Builder Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Minute */}
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <label className="text-sm text-emerald-400 font-medium mb-2 block">Minute (0-59)</label>
            <input
              type="text"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              placeholder="*"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {["*", "0", "*/5", "*/15", "*/30"].map((v) => (
                <button
                  key={v}
                  onClick={() => setMinute(v)}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Hour */}
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <label className="text-sm text-blue-400 font-medium mb-2 block">Heure (0-23)</label>
            <input
              type="text"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              placeholder="*"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {["*", "0", "9", "12", "18", "*/6"].map((v) => (
                <button
                  key={v}
                  onClick={() => setHour(v)}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Month */}
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <label className="text-sm text-amber-400 font-medium mb-2 block">Jour du mois (1-31)</label>
            <input
              type="text"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              placeholder="*"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {["*", "1", "15", "1,15", "1-7"].map((v) => (
                <button
                  key={v}
                  onClick={() => setDayOfMonth(v)}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Month */}
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <label className="text-sm text-violet-400 font-medium mb-2 block">Mois (1-12)</label>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-violet-500"
              placeholder="*"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {["*", "1", "6", "12", "1,7"].map((v) => (
                <button
                  key={v}
                  onClick={() => setMonth(v)}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week */}
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <label className="text-sm text-pink-400 font-medium mb-2 block">Jour semaine (0-6)</label>
            <input
              type="text"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-pink-500"
              placeholder="*"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {["*", "0", "1-5", "0,6", "1,3,5"].map((v) => (
                <button
                  key={v}
                  onClick={() => setDayOfWeek(v)}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Next Runs */}
        <div className="bg-zinc-900 border border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-medium flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Prochaines exécutions
            </h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {nextRuns.length > 0 ? (
              nextRuns.map((run, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <span className="text-zinc-500 w-8">{i + 1}.</span>
                  <span className="font-mono">{formatDate(run)}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-zinc-500 text-center">
                Aucune exécution prévue
              </div>
            )}
          </div>
        </div>

        {/* Syntax Help */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Syntaxe Cron
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 text-sm">
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Caractères spéciaux</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-blue-400">*</span> - Toutes les valeurs</li>
                <li><span className="text-blue-400">,</span> - Liste (1,3,5)</li>
                <li><span className="text-blue-400">-</span> - Plage (1-5)</li>
                <li><span className="text-blue-400">/</span> - Intervalle (*/15)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Minutes</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-emerald-400">0</span> - À l&apos;heure pile</li>
                <li><span className="text-emerald-400">*/5</span> - Toutes les 5 min</li>
                <li><span className="text-emerald-400">0,30</span> - À :00 et :30</li>
                <li><span className="text-emerald-400">15-45</span> - De :15 à :45</li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Heures</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-blue-400">9</span> - À 9h00</li>
                <li><span className="text-blue-400">9-17</span> - De 9h à 17h</li>
                <li><span className="text-blue-400">*/2</span> - Toutes les 2h</li>
                <li><span className="text-blue-400">0,12</span> - Minuit et midi</li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-400 font-medium mb-2">Jours de la semaine</h4>
              <ul className="space-y-1 font-mono text-zinc-500">
                <li><span className="text-pink-400">0</span> - Dimanche</li>
                <li><span className="text-pink-400">1-5</span> - Lun-Ven</li>
                <li><span className="text-pink-400">0,6</span> - Weekend</li>
                <li><span className="text-pink-400">1,3,5</span> - Lun, Mer, Ven</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
