"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileImage,
  Trash2,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  ScanText,
} from "lucide-react";
import {
  FileType,
  FileInfo,
  supportedConversions,
  fileTypeLabels,
  fileTypeExtensions,
  fileTypeMimeTypes,
} from "@/types/file-converter";

// Dynamic imports pour réduire le bundle initial
const loadPdfLib = () => import("pdf-lib");
const loadXlsx = () => import("xlsx");
const loadMammoth = () => import("mammoth");
const loadJsPdf = () => import("jspdf");
const loadTesseract = () => import("tesseract.js");
const loadDocx = () => import("docx");
const loadPdfJs = async () => {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  return pdfjs;
};

export default function FileConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [targetFormat, setTargetFormat] = useState<FileType | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState("fra");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = useCallback((file: File): FileType | null => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    const mimeType = file.type;

    for (const [type, extensions] of Object.entries(fileTypeExtensions)) {
      if (extensions.includes(extension)) {
        return type as FileType;
      }
    }

    for (const [type, mimes] of Object.entries(fileTypeMimeTypes)) {
      if (mimes.includes(mimeType)) {
        return type as FileType;
      }
    }

    return null;
  }, []);

  const getAvailableConversions = useCallback((type: FileType): FileType[] => {
    const conversion = supportedConversions.find((c) => c.from === type);
    return conversion?.to || [];
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const detectedType = detectFileType(selectedFile);

      setFile(selectedFile);
      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        detectedType,
      });
      setTargetFormat(null);
      setResult(null);
      setError(null);
      setPreview(null);

      // Prévisualisation pour certains types
      if (detectedType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else if (detectedType === "txt" || detectedType === "csv" || detectedType === "json" || detectedType === "xml" || detectedType === "md" || detectedType === "html") {
        const reader = new FileReader();
        reader.onload = (e) => setPreview((e.target?.result as string).slice(0, 5000));
        reader.readAsText(selectedFile);
      }
    },
    [detectFileType]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        input.files = dt.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  // Fonctions de conversion
  const convertDocxToText = async (file: File): Promise<string> => {
    const mammoth = await loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const convertDocxToHtml = async (file: File): Promise<string> => {
    const mammoth = await loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  };

  const convertXlsxToCsv = async (file: File): Promise<string> => {
    const XLSX = await loadXlsx();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(firstSheet);
  };

  const convertXlsxToJson = async (file: File): Promise<string> => {
    const XLSX = await loadXlsx();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    return JSON.stringify(jsonData, null, 2);
  };

  const convertXlsxToHtml = async (file: File): Promise<string> => {
    const XLSX = await loadXlsx();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_html(firstSheet);
  };

  const convertCsvToXlsx = async (file: File): Promise<Blob> => {
    const XLSX = await loadXlsx();
    const text = await file.text();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(
      text.split("\n").map((row) => row.split(","))
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const convertCsvToJson = async (file: File): Promise<string> => {
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i] || "";
        return obj;
      }, {} as Record<string, string>);
    });
    return JSON.stringify(data, null, 2);
  };

  const convertCsvToHtml = async (file: File): Promise<string> => {
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) =>
      line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    );

    let html = "<table border='1' cellpadding='8' cellspacing='0'>\n<thead>\n<tr>\n";
    headers.forEach((h) => (html += `  <th>${h}</th>\n`));
    html += "</tr>\n</thead>\n<tbody>\n";
    rows.forEach((row) => {
      html += "<tr>\n";
      row.forEach((cell) => (html += `  <td>${cell}</td>\n`));
      html += "</tr>\n";
    });
    html += "</tbody>\n</table>";
    return html;
  };

  const convertJsonToCsv = async (file: File): Promise<string> => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Le JSON doit être un tableau d'objets");
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row: Record<string, unknown>) =>
        headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    return csv;
  };

  const convertJsonToXlsx = async (file: File): Promise<Blob> => {
    const XLSX = await loadXlsx();
    const text = await file.text();
    const data = JSON.parse(text);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const convertJsonToXml = async (file: File): Promise<string> => {
    const text = await file.text();
    const data = JSON.parse(text);

    const jsonToXml = (obj: unknown, rootName = "root"): string => {
      let xml = "";
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          xml += `<item index="${i}">${jsonToXml(item, "")}</item>`;
        });
      } else if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
          xml += `<${safeKey}>${jsonToXml(value, safeKey)}</${safeKey}>`;
        }
      } else {
        xml += String(obj);
      }
      return rootName ? `<${rootName}>${xml}</${rootName}>` : xml;
    };

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + jsonToXml(data);
  };

  const convertXmlToJson = async (file: File): Promise<string> => {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    const xmlToJson = (node: Element): unknown => {
      const obj: Record<string, unknown> = {};

      if (node.children.length === 0) {
        return node.textContent;
      }

      for (const child of Array.from(node.children)) {
        const key = child.nodeName;
        const value = xmlToJson(child);

        if (obj[key]) {
          if (!Array.isArray(obj[key])) {
            obj[key] = [obj[key]];
          }
          (obj[key] as unknown[]).push(value);
        } else {
          obj[key] = value;
        }
      }
      return obj;
    };

    return JSON.stringify(xmlToJson(xmlDoc.documentElement), null, 2);
  };

  const convertTextToPdf = async (text: string, filename: string): Promise<Blob> => {
    const { jsPDF } = await loadJsPdf();
    const doc = new jsPDF();

    const lines = doc.splitTextToSize(text, 180);
    let y = 20;
    const pageHeight = doc.internal.pageSize.height;

    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 15, y);
      y += 7;
    });

    return doc.output("blob");
  };

  const convertHtmlToText = async (file: File): Promise<string> => {
    const html = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const convertHtmlToMd = async (file: File): Promise<string> => {
    const html = await file.text();
    // Conversion HTML vers Markdown basique
    let md = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, "\n")
      .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "```\n$1\n```\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n");
    return md.trim();
  };

  const convertMdToHtml = async (file: File): Promise<string> => {
    const md = await file.text();
    // Conversion Markdown vers HTML basique
    let html = md
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
  };

  const performOcr = async (file: File): Promise<string> => {
    const Tesseract = await loadTesseract();

    const result = await Tesseract.recognize(file, ocrLanguage, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setConversionProgress(Math.round(m.progress * 100));
        }
      },
    });

    return result.data.text;
  };

  const extractPdfText = async (file: File): Promise<{ pages: { pageNumber: number; text: string }[]; metadata: Record<string, unknown> }> => {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pages: { pageNumber: number; text: string }[] = [];
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push({ pageNumber: i, text });
      setConversionProgress(Math.round((i / totalPages) * 100));
    }

    const metadata = await pdf.getMetadata().catch(() => null);

    return {
      pages,
      metadata: (metadata?.info as Record<string, unknown>) || {},
    };
  };

  const convertPdfToText = async (file: File): Promise<string> => {
    const { pages } = await extractPdfText(file);
    return pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');
  };

  const convertPdfToJson = async (file: File): Promise<string> => {
    const { pages, metadata } = await extractPdfText(file);

    const result = {
      filename: file.name,
      totalPages: pages.length,
      metadata: {
        title: metadata.Title || null,
        author: metadata.Author || null,
        subject: metadata.Subject || null,
        creator: metadata.Creator || null,
        producer: metadata.Producer || null,
        creationDate: metadata.CreationDate || null,
        modificationDate: metadata.ModDate || null,
      },
      pages: pages.map((p) => ({
        page: p.pageNumber,
        content: p.text,
        wordCount: p.text.split(/\s+/).filter(Boolean).length,
      })),
      fullText: pages.map((p) => p.text).join(' '),
      totalWordCount: pages.reduce((acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length, 0),
    };

    return JSON.stringify(result, null, 2);
  };

  const convertPdfToImages = async (file: File): Promise<Blob> => {
    // Pour la conversion PDF vers images, on crée un ZIP avec les infos
    const { PDFDocument } = await loadPdfLib();
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    const info = `PDF Information:
- Nombre de pages: ${pageCount}
- Note: La conversion PDF vers image nécessite un moteur de rendu côté serveur.
  Utilisez un service comme pdf2img ou rendez les pages avec pdf.js pour une extraction complète.`;

    return new Blob([info], { type: "text/plain" });
  };

  const convertPdfToDocx = async (file: File): Promise<Blob> => {
    const docx = await loadDocx();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    const { pages, metadata } = await extractPdfText(file);

    const children: InstanceType<typeof Paragraph>[] = [];

    // Ajouter le titre du document si disponible
    if (metadata.Title) {
      children.push(
        new Paragraph({
          text: String(metadata.Title),
          heading: HeadingLevel.TITLE,
        })
      );
      children.push(new Paragraph({ text: "" }));
    }

    // Ajouter le contenu de chaque page
    pages.forEach((page, index) => {
      // En-tête de page
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Page ${page.pageNumber}`,
              bold: true,
              size: 24,
            }),
          ],
        })
      );

      // Contenu de la page - diviser en paragraphes
      const paragraphs = page.text.split(/\n\n+/);
      paragraphs.forEach((para) => {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: para.trim(),
                  size: 22,
                }),
              ],
            })
          );
        }
      });

      // Séparateur entre pages (sauf pour la dernière)
      if (index < pages.length - 1) {
        children.push(new Paragraph({ text: "" }));
        children.push(new Paragraph({ text: "―".repeat(50) }));
        children.push(new Paragraph({ text: "" }));
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer = await Packer.toBlob(doc);
    return buffer;
  };

  const handleConvert = async () => {
    if (!file || !fileInfo?.detectedType || !targetFormat) return;

    setIsConverting(true);
    setConversionProgress(0);
    setError(null);
    setResult(null);

    try {
      let resultBlob: Blob;
      let resultFilename: string;
      const baseName = file.name.replace(/\.[^/.]+$/, "");

      const from = fileInfo.detectedType;
      const to = targetFormat;

      // DOCX conversions
      if (from === "docx" && to === "txt") {
        const text = await convertDocxToText(file);
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}.txt`;
      } else if (from === "docx" && to === "html") {
        const html = await convertDocxToHtml(file);
        resultBlob = new Blob([html], { type: "text/html" });
        resultFilename = `${baseName}.html`;
      } else if (from === "docx" && to === "md") {
        const html = await convertDocxToHtml(file);
        // Réutiliser la logique de conversion HTML -> MD
        const tempFile = new File([html], "temp.html", { type: "text/html" });
        const md = await convertHtmlToMd(tempFile);
        resultBlob = new Blob([md], { type: "text/markdown" });
        resultFilename = `${baseName}.md`;
      } else if (from === "docx" && to === "pdf") {
        const text = await convertDocxToText(file);
        resultBlob = await convertTextToPdf(text, baseName);
        resultFilename = `${baseName}.pdf`;
      }
      // XLSX conversions
      else if (from === "xlsx" && to === "csv") {
        const csv = await convertXlsxToCsv(file);
        resultBlob = new Blob([csv], { type: "text/csv" });
        resultFilename = `${baseName}.csv`;
      } else if (from === "xlsx" && to === "json") {
        const json = await convertXlsxToJson(file);
        resultBlob = new Blob([json], { type: "application/json" });
        resultFilename = `${baseName}.json`;
      } else if (from === "xlsx" && to === "html") {
        const html = await convertXlsxToHtml(file);
        resultBlob = new Blob([html], { type: "text/html" });
        resultFilename = `${baseName}.html`;
      }
      // CSV conversions
      else if (from === "csv" && to === "xlsx") {
        resultBlob = await convertCsvToXlsx(file);
        resultFilename = `${baseName}.xlsx`;
      } else if (from === "csv" && to === "json") {
        const json = await convertCsvToJson(file);
        resultBlob = new Blob([json], { type: "application/json" });
        resultFilename = `${baseName}.json`;
      } else if (from === "csv" && to === "html") {
        const html = await convertCsvToHtml(file);
        resultBlob = new Blob([html], { type: "text/html" });
        resultFilename = `${baseName}.html`;
      }
      // JSON conversions
      else if (from === "json" && to === "csv") {
        const csv = await convertJsonToCsv(file);
        resultBlob = new Blob([csv], { type: "text/csv" });
        resultFilename = `${baseName}.csv`;
      } else if (from === "json" && to === "xlsx") {
        resultBlob = await convertJsonToXlsx(file);
        resultFilename = `${baseName}.xlsx`;
      } else if (from === "json" && to === "xml") {
        const xml = await convertJsonToXml(file);
        resultBlob = new Blob([xml], { type: "application/xml" });
        resultFilename = `${baseName}.xml`;
      } else if (from === "json" && to === "txt") {
        const text = await file.text();
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}.txt`;
      }
      // XML conversions
      else if (from === "xml" && to === "json") {
        const json = await convertXmlToJson(file);
        resultBlob = new Blob([json], { type: "application/json" });
        resultFilename = `${baseName}.json`;
      } else if (from === "xml" && to === "txt") {
        const text = await file.text();
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}.txt`;
      }
      // TXT conversions
      else if (from === "txt" && to === "pdf") {
        const text = await file.text();
        resultBlob = await convertTextToPdf(text, baseName);
        resultFilename = `${baseName}.pdf`;
      } else if (from === "txt" && to === "html") {
        const text = await file.text();
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${baseName}</title></head><body><pre>${text}</pre></body></html>`;
        resultBlob = new Blob([html], { type: "text/html" });
        resultFilename = `${baseName}.html`;
      } else if (from === "txt" && to === "md") {
        const text = await file.text();
        resultBlob = new Blob([text], { type: "text/markdown" });
        resultFilename = `${baseName}.md`;
      }
      // HTML conversions
      else if (from === "html" && to === "txt") {
        const text = await convertHtmlToText(file);
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}.txt`;
      } else if (from === "html" && to === "md") {
        const md = await convertHtmlToMd(file);
        resultBlob = new Blob([md], { type: "text/markdown" });
        resultFilename = `${baseName}.md`;
      } else if (from === "html" && to === "pdf") {
        const text = await convertHtmlToText(file);
        resultBlob = await convertTextToPdf(text, baseName);
        resultFilename = `${baseName}.pdf`;
      }
      // MD conversions
      else if (from === "md" && to === "html") {
        const html = await convertMdToHtml(file);
        resultBlob = new Blob([html], { type: "text/html" });
        resultFilename = `${baseName}.html`;
      } else if (from === "md" && to === "txt") {
        const text = await file.text();
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}.txt`;
      } else if (from === "md" && to === "pdf") {
        const text = await file.text();
        resultBlob = await convertTextToPdf(text, baseName);
        resultFilename = `${baseName}.pdf`;
      }
      // PDF conversions
      else if (from === "pdf" && to === "txt") {
        const text = await convertPdfToText(file);
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}.txt`;
      } else if (from === "pdf" && to === "json") {
        const json = await convertPdfToJson(file);
        resultBlob = new Blob([json], { type: "application/json" });
        resultFilename = `${baseName}.json`;
      } else if (from === "pdf" && to === "image") {
        resultBlob = await convertPdfToImages(file);
        resultFilename = `${baseName}_info.txt`;
      } else if (from === "pdf" && to === "docx") {
        resultBlob = await convertPdfToDocx(file);
        resultFilename = `${baseName}.docx`;
      }
      // OCR (image to text/pdf)
      else if (from === "image" && to === "txt") {
        const text = await performOcr(file);
        resultBlob = new Blob([text], { type: "text/plain" });
        resultFilename = `${baseName}_ocr.txt`;
      } else if (from === "image" && to === "pdf") {
        const text = await performOcr(file);
        resultBlob = await convertTextToPdf(text, baseName);
        resultFilename = `${baseName}_ocr.pdf`;
      }
      // Default error
      else {
        throw new Error(`Conversion ${from} → ${to} non supportée`);
      }

      setResult({ blob: resultBlob!, filename: resultFilename! });
      setConversionProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de conversion");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFile(null);
    setFileInfo(null);
    setTargetFormat(null);
    setResult(null);
    setError(null);
    setPreview(null);
    setConversionProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: FileType | null) => {
    switch (type) {
      case "xlsx":
      case "csv":
        return FileSpreadsheet;
      case "image":
        return FileImage;
      case "json":
      case "xml":
      case "html":
        return FileCode;
      default:
        return FileText;
    }
  };

  const availableFormats = fileInfo?.detectedType
    ? getAvailableConversions(fileInfo.detectedType)
    : [];

  const FileIcon = getFileIcon(fileInfo?.detectedType || null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold">Convertisseur de Fichiers</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {/* Zone d'upload */}
        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex h-[calc(100vh-200px)] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card transition-colors hover:border-primary/50"
          >
            <Upload className="mb-4 h-16 w-16 text-muted-foreground" />
            <p className="mb-2 text-xl font-medium">Glissez un fichier ici</p>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              PDF, DOCX, XLSX, CSV, JSON, XML, TXT, HTML, MD
              <br />
              ou images (PNG, JPG) pour OCR
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-primary bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sélectionner un fichier
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info fichier */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">{fileInfo?.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatFileSize(fileInfo?.size || 0)}</span>
                    {fileInfo?.detectedType && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {fileTypeLabels[fileInfo.detectedType]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Prévisualisation */}
              {preview && (
                <div className="mt-4 rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    Aperçu
                  </div>
                  {fileInfo?.detectedType === "image" ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <pre className="max-h-48 overflow-auto text-xs">
                      {preview.slice(0, 2000)}
                      {preview.length > 2000 && "..."}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Sélection du format de sortie */}
            {fileInfo?.detectedType && availableFormats.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="rounded-lg bg-secondary px-2 py-1">
                      {fileTypeLabels[fileInfo.detectedType]}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Convertir vers :
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableFormats.map((format) => {
                    const FormatIcon = getFileIcon(format);
                    return (
                      <button
                        key={format}
                        onClick={() => setTargetFormat(format)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          targetFormat === format
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <FormatIcon className="h-4 w-4" />
                        {fileTypeLabels[format]}
                      </button>
                    );
                  })}
                </div>

                {/* Options OCR */}
                {fileInfo.detectedType === "image" && targetFormat && (
                  <div className="mt-4 rounded-lg border border-border bg-background p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <ScanText className="h-4 w-4" />
                      Options OCR
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted-foreground">
                        Langue :
                      </label>
                      <select
                        value={ocrLanguage}
                        onChange={(e) => setOcrLanguage(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="fra">Français</option>
                        <option value="eng">Anglais</option>
                        <option value="deu">Allemand</option>
                        <option value="spa">Espagnol</option>
                        <option value="ita">Italien</option>
                        <option value="por">Portugais</option>
                        <option value="ara">Arabe</option>
                        <option value="chi_sim">Chinois (simplifié)</option>
                        <option value="jpn">Japonais</option>
                        <option value="kor">Coréen</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pas de conversion disponible */}
            {fileInfo?.detectedType && availableFormats.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune conversion disponible pour ce type de fichier.
                </p>
              </div>
            )}

            {/* Type non reconnu */}
            {!fileInfo?.detectedType && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive">
                  Type de fichier non reconnu. Vérifiez l&apos;extension du fichier.
                </p>
              </div>
            )}

            {/* Bouton convertir */}
            {targetFormat && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conversion en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Convertir en {fileTypeLabels[targetFormat]}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Barre de progression */}
            {isConverting && conversionProgress > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{conversionProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Erreur</p>
                    <p className="mt-1 text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Résultat */}
            {result && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Conversion réussie
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.filename} ({formatFileSize(result.blob.size)})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-lg border border-primary bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.json,.xml,.html,.htm,.md,.markdown,.png,.jpg,.jpeg,.webp,.bmp,.gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </main>

      {/* Info footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <p className="text-center text-xs text-muted-foreground">
            Toutes les conversions sont effectuées localement dans votre navigateur.
            Aucun fichier n&apos;est envoyé à un serveur.
          </p>
        </div>
      </footer>
    </div>
  );
}
