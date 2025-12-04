"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ArrowUpDown,
  Ruler,
  Scale,
  Thermometer,
  Clock,
  Gauge,
  HardDrive,
  Square,
  Box,
  Zap,
  Droplet,
  RotateCw,
  Activity,
} from "lucide-react";

type UnitCategory =
  | "length"
  | "weight"
  | "temperature"
  | "time"
  | "speed"
  | "data"
  | "area"
  | "volume"
  | "energy"
  | "pressure"
  | "angle"
  | "frequency";

interface Unit {
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const categoryLabels: Record<UnitCategory, { name: string; icon: React.ElementType }> = {
  length: { name: "Longueur", icon: Ruler },
  weight: { name: "Poids", icon: Scale },
  temperature: { name: "Température", icon: Thermometer },
  time: { name: "Temps", icon: Clock },
  speed: { name: "Vitesse", icon: Gauge },
  data: { name: "Données", icon: HardDrive },
  area: { name: "Surface", icon: Square },
  volume: { name: "Volume", icon: Box },
  energy: { name: "Énergie", icon: Zap },
  pressure: { name: "Pression", icon: Droplet },
  angle: { name: "Angle", icon: RotateCw },
  frequency: { name: "Fréquence", icon: Activity },
};

const units: Record<UnitCategory, Record<string, Unit>> = {
  length: {
    meter: { name: "Mètre", symbol: "m", toBase: (v) => v, fromBase: (v) => v },
    kilometer: { name: "Kilomètre", symbol: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    centimeter: { name: "Centimètre", symbol: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    millimeter: { name: "Millimètre", symbol: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    micrometer: { name: "Micromètre", symbol: "µm", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    nanometer: { name: "Nanomètre", symbol: "nm", toBase: (v) => v / 1e9, fromBase: (v) => v * 1e9 },
    mile: { name: "Mile", symbol: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    yard: { name: "Yard", symbol: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    foot: { name: "Pied", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    inch: { name: "Pouce", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    nauticalMile: { name: "Mile nautique", symbol: "nmi", toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    lightyear: { name: "Année-lumière", symbol: "ly", toBase: (v) => v * 9.461e15, fromBase: (v) => v / 9.461e15 },
  },
  weight: {
    kilogram: { name: "Kilogramme", symbol: "kg", toBase: (v) => v, fromBase: (v) => v },
    gram: { name: "Gramme", symbol: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    milligram: { name: "Milligramme", symbol: "mg", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    microgram: { name: "Microgramme", symbol: "µg", toBase: (v) => v / 1e9, fromBase: (v) => v * 1e9 },
    tonne: { name: "Tonne", symbol: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    pound: { name: "Livre", symbol: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    ounce: { name: "Once", symbol: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    stone: { name: "Stone", symbol: "st", toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
    carat: { name: "Carat", symbol: "ct", toBase: (v) => v * 0.0002, fromBase: (v) => v / 0.0002 },
    quintal: { name: "Quintal", symbol: "q", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
  },
  temperature: {
    celsius: { name: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
    fahrenheit: { name: "Fahrenheit", symbol: "°F", toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
    kelvin: { name: "Kelvin", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    rankine: { name: "Rankine", symbol: "°R", toBase: (v) => (v - 491.67) * 5/9, fromBase: (v) => v * 9/5 + 491.67 },
    reaumur: { name: "Réaumur", symbol: "°Ré", toBase: (v) => v * 5/4, fromBase: (v) => v * 4/5 },
  },
  time: {
    second: { name: "Seconde", symbol: "s", toBase: (v) => v, fromBase: (v) => v },
    millisecond: { name: "Milliseconde", symbol: "ms", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    microsecond: { name: "Microseconde", symbol: "µs", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    nanosecond: { name: "Nanoseconde", symbol: "ns", toBase: (v) => v / 1e9, fromBase: (v) => v * 1e9 },
    minute: { name: "Minute", symbol: "min", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    hour: { name: "Heure", symbol: "h", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    day: { name: "Jour", symbol: "j", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    week: { name: "Semaine", symbol: "sem", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    month: { name: "Mois (30j)", symbol: "mois", toBase: (v) => v * 2592000, fromBase: (v) => v / 2592000 },
    year: { name: "Année", symbol: "an", toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
    decade: { name: "Décennie", symbol: "déc", toBase: (v) => v * 315360000, fromBase: (v) => v / 315360000 },
    century: { name: "Siècle", symbol: "siècle", toBase: (v) => v * 3153600000, fromBase: (v) => v / 3153600000 },
  },
  speed: {
    meterPerSecond: { name: "Mètre/seconde", symbol: "m/s", toBase: (v) => v, fromBase: (v) => v },
    kmPerHour: { name: "Kilomètre/heure", symbol: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    milePerHour: { name: "Mile/heure", symbol: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    footPerSecond: { name: "Pied/seconde", symbol: "ft/s", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    knot: { name: "Nœud", symbol: "kn", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    mach: { name: "Mach", symbol: "Ma", toBase: (v) => v * 343, fromBase: (v) => v / 343 },
    lightSpeed: { name: "Vitesse lumière", symbol: "c", toBase: (v) => v * 299792458, fromBase: (v) => v / 299792458 },
  },
  data: {
    byte: { name: "Octet", symbol: "o", toBase: (v) => v, fromBase: (v) => v },
    kilobyte: { name: "Kilooctet", symbol: "Ko", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    megabyte: { name: "Mégaoctet", symbol: "Mo", toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
    gigabyte: { name: "Gigaoctet", symbol: "Go", toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
    terabyte: { name: "Téraoctet", symbol: "To", toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
    petabyte: { name: "Pétaoctet", symbol: "Po", toBase: (v) => v * 1125899906842624, fromBase: (v) => v / 1125899906842624 },
    bit: { name: "Bit", symbol: "bit", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    kilobit: { name: "Kilobit", symbol: "Kb", toBase: (v) => v * 128, fromBase: (v) => v / 128 },
    megabit: { name: "Mégabit", symbol: "Mb", toBase: (v) => v * 131072, fromBase: (v) => v / 131072 },
    gigabit: { name: "Gigabit", symbol: "Gb", toBase: (v) => v * 134217728, fromBase: (v) => v / 134217728 },
  },
  area: {
    squareMeter: { name: "Mètre carré", symbol: "m²", toBase: (v) => v, fromBase: (v) => v },
    squareKm: { name: "Kilomètre carré", symbol: "km²", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    squareCm: { name: "Centimètre carré", symbol: "cm²", toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
    squareMm: { name: "Millimètre carré", symbol: "mm²", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    hectare: { name: "Hectare", symbol: "ha", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    are: { name: "Are", symbol: "a", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
    acre: { name: "Acre", symbol: "ac", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    squareFoot: { name: "Pied carré", symbol: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    squareInch: { name: "Pouce carré", symbol: "in²", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
    squareMile: { name: "Mile carré", symbol: "mi²", toBase: (v) => v * 2.59e6, fromBase: (v) => v / 2.59e6 },
  },
  volume: {
    liter: { name: "Litre", symbol: "L", toBase: (v) => v, fromBase: (v) => v },
    milliliter: { name: "Millilitre", symbol: "mL", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    centiliter: { name: "Centilitre", symbol: "cL", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    deciliter: { name: "Décilitre", symbol: "dL", toBase: (v) => v / 10, fromBase: (v) => v * 10 },
    hectoliter: { name: "Hectolitre", symbol: "hL", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
    cubicMeter: { name: "Mètre cube", symbol: "m³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    cubicCm: { name: "Centimètre cube", symbol: "cm³", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    gallon: { name: "Gallon US", symbol: "gal", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    gallonUK: { name: "Gallon UK", symbol: "gal UK", toBase: (v) => v * 4.54609, fromBase: (v) => v / 4.54609 },
    quart: { name: "Quart US", symbol: "qt", toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
    pint: { name: "Pinte US", symbol: "pt", toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
    cup: { name: "Tasse US", symbol: "cup", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    fluidOunce: { name: "Once liquide US", symbol: "fl oz", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    tablespoon: { name: "Cuillère à soupe", symbol: "tbsp", toBase: (v) => v * 0.0147868, fromBase: (v) => v / 0.0147868 },
    teaspoon: { name: "Cuillère à café", symbol: "tsp", toBase: (v) => v * 0.00492892, fromBase: (v) => v / 0.00492892 },
  },
  energy: {
    joule: { name: "Joule", symbol: "J", toBase: (v) => v, fromBase: (v) => v },
    kilojoule: { name: "Kilojoule", symbol: "kJ", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    calorie: { name: "Calorie", symbol: "cal", toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
    kilocalorie: { name: "Kilocalorie", symbol: "kcal", toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
    wattHour: { name: "Watt-heure", symbol: "Wh", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    kilowattHour: { name: "Kilowatt-heure", symbol: "kWh", toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
    electronvolt: { name: "Électron-volt", symbol: "eV", toBase: (v) => v * 1.602e-19, fromBase: (v) => v / 1.602e-19 },
    btu: { name: "BTU", symbol: "BTU", toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
    therm: { name: "Therm", symbol: "thm", toBase: (v) => v * 1.055e8, fromBase: (v) => v / 1.055e8 },
  },
  pressure: {
    pascal: { name: "Pascal", symbol: "Pa", toBase: (v) => v, fromBase: (v) => v },
    kilopascal: { name: "Kilopascal", symbol: "kPa", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    megapascal: { name: "Mégapascal", symbol: "MPa", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    bar: { name: "Bar", symbol: "bar", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
    millibar: { name: "Millibar", symbol: "mbar", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
    atmosphere: { name: "Atmosphère", symbol: "atm", toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
    psi: { name: "PSI", symbol: "psi", toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
    torr: { name: "Torr", symbol: "Torr", toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
    mmHg: { name: "mmHg", symbol: "mmHg", toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
  },
  angle: {
    degree: { name: "Degré", symbol: "°", toBase: (v) => v, fromBase: (v) => v },
    radian: { name: "Radian", symbol: "rad", toBase: (v) => v * (180 / Math.PI), fromBase: (v) => v * (Math.PI / 180) },
    gradian: { name: "Grade", symbol: "gon", toBase: (v) => v * 0.9, fromBase: (v) => v / 0.9 },
    arcminute: { name: "Minute d'arc", symbol: "'", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
    arcsecond: { name: "Seconde d'arc", symbol: "\"", toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
    turn: { name: "Tour", symbol: "tr", toBase: (v) => v * 360, fromBase: (v) => v / 360 },
  },
  frequency: {
    hertz: { name: "Hertz", symbol: "Hz", toBase: (v) => v, fromBase: (v) => v },
    kilohertz: { name: "Kilohertz", symbol: "kHz", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    megahertz: { name: "Mégahertz", symbol: "MHz", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    gigahertz: { name: "Gigahertz", symbol: "GHz", toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
    rpm: { name: "Tours/minute", symbol: "rpm", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
  },
};

export default function UnitConverterPage() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("kilometer");
  const [inputValue, setInputValue] = useState("1");
  const [copied, setCopied] = useState(false);

  const categoryUnits = units[category];

  const result = useMemo(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return "";

    const from = categoryUnits[fromUnit];
    const to = categoryUnits[toUnit];

    if (!from || !to) return "";

    const baseValue = from.toBase(value);
    const convertedValue = to.fromBase(baseValue);

    if (Math.abs(convertedValue) < 0.0001 || Math.abs(convertedValue) > 1e10) {
      return convertedValue.toExponential(6);
    }
    return convertedValue.toLocaleString("fr-FR", { maximumFractionDigits: 10 });
  }, [inputValue, fromUnit, toUnit, categoryUnits]);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    const unitKeys = Object.keys(units[newCategory]);
    setFromUnit(unitKeys[0]);
    setToUnit(unitKeys[1] || unitKeys[0]);
  };

  // Get all results for this input
  const allResults = useMemo(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return [];

    const from = categoryUnits[fromUnit];
    if (!from) return [];

    const baseValue = from.toBase(value);

    return Object.entries(categoryUnits)
      .filter(([key]) => key !== fromUnit)
      .map(([key, unit]) => ({
        key,
        name: unit.name,
        symbol: unit.symbol,
        value: unit.fromBase(baseValue),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inputValue, fromUnit, categoryUnits]);

  const formatValue = (value: number) => {
    if (Math.abs(value) < 0.0001 || Math.abs(value) > 1e10) {
      return value.toExponential(4);
    }
    return value.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-sm font-semibold">Convertisseur d&apos;Unités</h1>
        <div className="w-16" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Converter Area */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
            {/* From Input */}
            <div className="flex w-full max-w-md items-center gap-3">
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-40 shrink-0 rounded border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {Object.entries(categoryUnits).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 rounded border border-border bg-card px-4 py-2.5 text-center text-lg font-medium focus:border-primary focus:outline-none"
                placeholder="0"
              />
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="rounded border border-border bg-card p-2 transition-colors hover:bg-accent"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>

            {/* To Output */}
            <div className="flex w-full max-w-md items-center gap-3">
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-40 shrink-0 rounded border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {Object.entries(categoryUnits).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={result}
                  readOnly
                  className="flex-1 rounded border border-border bg-muted/30 px-4 py-2.5 text-center text-lg font-medium"
                />
                <button
                  onClick={copyResult}
                  disabled={!result}
                  className="rounded border border-border bg-card p-2.5 transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Formula Display */}
            {result && (
              <div className="rounded border border-border bg-muted/30 px-6 py-3 text-center">
                <p className="text-lg">
                  <span className="font-semibold">{inputValue}</span>{" "}
                  <span className="text-muted-foreground">{categoryUnits[fromUnit]?.symbol}</span>
                  <span className="mx-3">=</span>
                  <span className="font-semibold">{result}</span>{" "}
                  <span className="text-muted-foreground">{categoryUnits[toUnit]?.symbol}</span>
                </p>
              </div>
            )}

            {/* All Conversions Grid */}
            <div className="w-full max-w-2xl">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Toutes les conversions</p>
              <div className="grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {allResults.map(({ key, name, symbol, value }) => (
                  <button
                    key={key}
                    onClick={() => setToUnit(key)}
                    className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                      toUnit === key
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <span className="text-muted-foreground">{name}</span>
                    <span className="ml-2 font-medium">
                      {formatValue(value)} {symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Sidebar */}
        <div className="flex w-64 shrink-0 flex-col border-l border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Catégories</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(categoryLabels) as UnitCategory[]).map((cat) => {
                const { name, icon: Icon } = categoryLabels[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex flex-col items-center gap-1 rounded border px-2 py-3 text-center transition-colors ${
                      category === cat
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
