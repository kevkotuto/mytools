"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  FileText,
  Building2,
  User,
  Save,
  Package,
  ChevronDown,
  Check,
  X,
  Edit2,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  siret?: string;
  vatNumber?: string;
}

interface ClientInfo {
  name: string;
  address: string;
  city: string;
  email: string;
}

interface SavedArticle {
  id: string;
  description: string;
  unitPrice: number;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

interface InvoiceData {
  number: string;
  date: string;
  dueDate: string;
  company: CompanyInfo;
  client: ClientInfo;
  items: InvoiceItem[];
  notes: string;
  taxRate: number;
  currency: string;
}

const currencies: Currency[] = [
  { code: "EUR", symbol: "€", name: "Euro", locale: "fr-FR" },
  { code: "USD", symbol: "$", name: "Dollar US", locale: "en-US" },
  { code: "GBP", symbol: "£", name: "Livre Sterling", locale: "en-GB" },
  { code: "CHF", symbol: "CHF", name: "Franc Suisse", locale: "fr-CH" },
  { code: "CAD", symbol: "CA$", name: "Dollar Canadien", locale: "en-CA" },
  { code: "XOF", symbol: "CFA", name: "Franc CFA (BCEAO)", locale: "fr-FR" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA (BEAC)", locale: "fr-FR" },
  { code: "MAD", symbol: "DH", name: "Dirham Marocain", locale: "fr-MA" },
  { code: "TND", symbol: "DT", name: "Dinar Tunisien", locale: "fr-TN" },
  { code: "DZD", symbol: "DA", name: "Dinar Algérien", locale: "fr-DZ" },
  { code: "JPY", symbol: "¥", name: "Yen Japonais", locale: "ja-JP" },
  { code: "CNY", symbol: "¥", name: "Yuan Chinois", locale: "zh-CN" },
  { code: "INR", symbol: "₹", name: "Roupie Indienne", locale: "en-IN" },
  { code: "BRL", symbol: "R$", name: "Real Brésilien", locale: "pt-BR" },
  { code: "MXN", symbol: "MX$", name: "Peso Mexicain", locale: "es-MX" },
];

const defaultCompany: CompanyInfo = {
  name: "",
  address: "",
  city: "",
  email: "",
  phone: "",
  siret: "",
  vatNumber: "",
};

const defaultInvoice: InvoiceData = {
  number: `INV-${new Date().getFullYear()}-001`,
  date: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  company: defaultCompany,
  client: {
    name: "",
    address: "",
    city: "",
    email: "",
  },
  items: [
    { id: "1", description: "", quantity: 1, unitPrice: 0 },
  ],
  notes: "",
  taxRate: 20,
  currency: "EUR",
};

const STORAGE_KEYS = {
  COMPANY: "invoice-company-info",
  ARTICLES: "invoice-saved-articles",
  CURRENCY: "invoice-currency",
};

export default function InvoiceGeneratorPage() {
  const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoice);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<SavedArticle | null>(null);
  const [newArticle, setNewArticle] = useState<{ description: string; unitPrice: string }>({
    description: "",
    unitPrice: "",
  });
  const [showArticleManager, setShowArticleManager] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Load saved data on mount
  useEffect(() => {
    const savedCompany = localStorage.getItem(STORAGE_KEYS.COMPANY);
    const savedArticlesData = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    const savedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY);

    if (savedCompany) {
      try {
        const company = JSON.parse(savedCompany);
        setInvoice((prev) => ({ ...prev, company }));
      } catch (e) {
        console.error("Error loading company info:", e);
      }
    }

    if (savedArticlesData) {
      try {
        setSavedArticles(JSON.parse(savedArticlesData));
      } catch (e) {
        console.error("Error loading saved articles:", e);
      }
    }

    if (savedCurrency) {
      setInvoice((prev) => ({ ...prev, currency: savedCurrency }));
    }
  }, []);

  // Auto-save company info when it changes
  useEffect(() => {
    const hasCompanyInfo = Object.values(invoice.company).some((v) => v && v.trim() !== "");
    if (hasCompanyInfo) {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(invoice.company));
      setCompanySaved(true);
      const timer = setTimeout(() => setCompanySaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [invoice.company]);

  // Save currency preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, invoice.currency);
  }, [invoice.currency]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateCompany = (field: keyof CompanyInfo, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }));
  };

  const updateClient = (field: keyof ClientInfo, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      client: { ...prev.client, [field]: value },
    }));
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { id: generateId(), description: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length === 1) return;
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const selectArticle = (itemId: string, article: SavedArticle) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, description: article.description, unitPrice: article.unitPrice }
          : item
      ),
    }));
    setShowArticleDropdown(null);
  };

  const saveArticle = () => {
    if (!newArticle.description.trim()) return;

    const article: SavedArticle = {
      id: generateId(),
      description: newArticle.description.trim(),
      unitPrice: parseFloat(newArticle.unitPrice) || 0,
    };

    const updatedArticles = [...savedArticles, article];
    setSavedArticles(updatedArticles);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));
    setNewArticle({ description: "", unitPrice: "" });
  };

  const updateSavedArticle = (article: SavedArticle) => {
    const updatedArticles = savedArticles.map((a) =>
      a.id === article.id ? article : a
    );
    setSavedArticles(updatedArticles);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));
    setEditingArticle(null);
  };

  const deleteSavedArticle = (id: string) => {
    const updatedArticles = savedArticles.filter((a) => a.id !== id);
    setSavedArticles(updatedArticles);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));
  };

  const saveCurrentItemAsArticle = (item: InvoiceItem) => {
    if (!item.description.trim()) return;

    const article: SavedArticle = {
      id: generateId(),
      description: item.description.trim(),
      unitPrice: item.unitPrice,
    };

    const updatedArticles = [...savedArticles, article];
    setSavedArticles(updatedArticles);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));
  };

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;

  const currentCurrency = currencies.find((c) => c.code === invoice.currency) || currencies[0];

  const formatCurrency = (amount: number) => {
    // Special handling for CFA francs (no decimals)
    if (invoice.currency === "XOF" || invoice.currency === "XAF") {
      return new Intl.NumberFormat(currentCurrency.locale, {
        style: "decimal",
        maximumFractionDigits: 0,
      }).format(amount) + " " + currentCurrency.symbol;
    }

    try {
      return new Intl.NumberFormat(currentCurrency.locale, {
        style: "currency",
        currency: invoice.currency,
      }).format(amount);
    } catch {
      return amount.toFixed(2) + " " + currentCurrency.symbol;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const downloadPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${invoice.number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 40px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-info h1 { font-size: 24px; margin-bottom: 8px; }
            .company-info p { font-size: 14px; color: #666; line-height: 1.6; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { font-size: 28px; color: #333; margin-bottom: 8px; }
            .invoice-info p { font-size: 14px; color: #666; }
            .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .party { width: 45%; }
            .party h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
            .party p { font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f5f5f5; font-size: 12px; text-transform: uppercase; color: #666; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .totals div { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals .total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; }
            .notes { margin-top: 40px; padding: 20px; background: #f9f9f9; font-size: 14px; color: #666; }
            .notes h4 { margin-bottom: 8px; color: #333; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const reset = () => {
    if (confirm("Réinitialiser la facture ? Les informations de votre entreprise seront conservées.")) {
      const savedCompany = invoice.company;
      const savedCurrency = invoice.currency;
      setInvoice({
        ...defaultInvoice,
        company: savedCompany,
        currency: savedCurrency,
        number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
      });
    }
  };

  const clearCompanyInfo = () => {
    if (confirm("Effacer les informations de l'entreprise ?")) {
      localStorage.removeItem(STORAGE_KEYS.COMPANY);
      setInvoice((prev) => ({ ...prev, company: defaultCompany }));
    }
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
        <h1 className="text-lg font-semibold">Générateur de Factures</h1>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form */}
            <div className="space-y-6">
              {/* Invoice info + Currency */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  Informations de la facture
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Numéro</label>
                    <input
                      type="text"
                      value={invoice.number}
                      onChange={(e) => setInvoice((prev) => ({ ...prev, number: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Devise</label>
                    <select
                      value={invoice.currency}
                      onChange={(e) => setInvoice((prev) => ({ ...prev, currency: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Date</label>
                    <input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setInvoice((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Échéance</label>
                    <input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setInvoice((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Company info */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4" />
                    Votre entreprise
                    {companySaved && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        Sauvegardé
                      </span>
                    )}
                  </h3>
                  {Object.values(invoice.company).some((v) => v && v.trim() !== "") && (
                    <button
                      onClick={clearCompanyInfo}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Nom de l'entreprise"
                    value={invoice.company.name}
                    onChange={(e) => updateCompany("name", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={invoice.company.email}
                    onChange={(e) => updateCompany("email", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={invoice.company.address}
                    onChange={(e) => updateCompany("address", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Code postal, Ville"
                    value={invoice.company.city}
                    onChange={(e) => updateCompany("city", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={invoice.company.phone}
                    onChange={(e) => updateCompany("phone", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="SIRET (optionnel)"
                    value={invoice.company.siret}
                    onChange={(e) => updateCompany("siret", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Les informations sont automatiquement sauvegardées
                </p>
              </div>

              {/* Client info */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4" />
                  Client
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Nom du client"
                    value={invoice.client.name}
                    onChange={(e) => updateClient("name", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={invoice.client.email}
                    onChange={(e) => updateClient("email", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={invoice.client.address}
                    onChange={(e) => updateClient("address", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Code postal, Ville"
                    value={invoice.client.city}
                    onChange={(e) => updateClient("city", e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Prestations / Produits</h3>
                  <button
                    onClick={() => setShowArticleManager(!showArticleManager)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Package className="h-3 w-3" />
                    Gérer les articles ({savedArticles.length})
                  </button>
                </div>

                {/* Article Manager */}
                {showArticleManager && (
                  <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
                    <h4 className="mb-3 text-sm font-medium">Articles sauvegardés</h4>
                    {savedArticles.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun article sauvegardé</p>
                    ) : (
                      <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                        {savedArticles.map((article) => (
                          <div
                            key={article.id}
                            className="flex items-center justify-between rounded border border-border bg-background p-2 text-sm"
                          >
                            {editingArticle?.id === article.id ? (
                              <div className="flex flex-1 gap-2">
                                <input
                                  type="text"
                                  value={editingArticle.description}
                                  onChange={(e) =>
                                    setEditingArticle({ ...editingArticle, description: e.target.value })
                                  }
                                  className="flex-1 rounded border border-border px-2 py-1 text-xs"
                                />
                                <input
                                  type="number"
                                  value={editingArticle.unitPrice}
                                  onChange={(e) =>
                                    setEditingArticle({
                                      ...editingArticle,
                                      unitPrice: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-24 rounded border border-border px-2 py-1 text-xs"
                                />
                                <button
                                  onClick={() => updateSavedArticle(editingArticle)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingArticle(null)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 truncate">{article.description}</span>
                                <span className="mx-2 text-muted-foreground">
                                  {formatCurrency(article.unitPrice)}
                                </span>
                                <button
                                  onClick={() => setEditingArticle(article)}
                                  className="mr-1 text-muted-foreground hover:text-foreground"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => deleteSavedArticle(article.id)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={newArticle.description}
                        onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                        className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Prix"
                        value={newArticle.unitPrice}
                        onChange={(e) => setNewArticle({ ...newArticle, unitPrice: e.target.value })}
                        className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      />
                      <button
                        onClick={saveArticle}
                        disabled={!newArticle.description.trim()}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                        {savedArticles.length > 0 && (
                          <button
                            onClick={() =>
                              setShowArticleDropdown(
                                showArticleDropdown === item.id ? null : item.id
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        )}
                        {showArticleDropdown === item.id && (
                          <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                            {savedArticles.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => selectArticle(item.id, article)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                              >
                                <span className="truncate">{article.description}</span>
                                <span className="ml-2 text-muted-foreground">
                                  {formatCurrency(article.unitPrice)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        min={1}
                      />
                      <input
                        type="number"
                        placeholder="Prix"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        min={0}
                        step={0.01}
                      />
                      {item.description && (
                        <button
                          onClick={() => saveCurrentItemAsArticle(item)}
                          className="p-2 text-muted-foreground hover:text-primary"
                          title="Sauvegarder comme article"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={invoice.items.length === 1}
                        className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une ligne
                </button>
              </div>

              {/* Tax and notes */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium">TVA (%)</label>
                  <input
                    type="number"
                    value={invoice.taxRate}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Notes (optionnel)</label>
                  <textarea
                    value={invoice.notes}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Conditions de paiement, mentions légales..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <button
                onClick={downloadPDF}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Télécharger PDF
              </button>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-border bg-white p-6" ref={printRef}>
              <div className="invoice">
                {/* Header */}
                <div className="header mb-8 flex justify-between">
                  <div className="company-info">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {invoice.company.name || "Votre Entreprise"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                      {invoice.company.address && <>{invoice.company.address}<br /></>}
                      {invoice.company.city && <>{invoice.company.city}<br /></>}
                      {invoice.company.email && <>{invoice.company.email}<br /></>}
                      {invoice.company.phone && <>{invoice.company.phone}<br /></>}
                      {invoice.company.siret && <>SIRET: {invoice.company.siret}</>}
                    </p>
                  </div>
                  <div className="invoice-info text-right">
                    <h2 className="text-2xl font-bold text-gray-900">FACTURE</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      N° {invoice.number}<br />
                      Date: {formatDate(invoice.date)}<br />
                      Échéance: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>

                {/* Client */}
                <div className="mb-8 rounded bg-gray-50 p-4">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">Facturé à</h3>
                  <p className="text-sm text-gray-900">
                    <strong>{invoice.client.name || "Nom du client"}</strong><br />
                    {invoice.client.address && <>{invoice.client.address}<br /></>}
                    {invoice.client.city && <>{invoice.client.city}<br /></>}
                    {invoice.client.email}
                  </p>
                </div>

                {/* Items table */}
                <table className="mb-6 w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-gray-500">Qté</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-gray-500">Prix unit.</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">{item.description || "—"}</td>
                        <td className="py-3 text-right text-sm text-gray-600">{item.quantity}</td>
                        <td className="py-3 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="ml-auto w-64">
                  <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                    <span className="text-gray-600">TVA ({invoice.taxRate}%)</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span>Total TTC</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-8 rounded bg-gray-50 p-4">
                    <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">Notes</h4>
                    <p className="whitespace-pre-wrap text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
