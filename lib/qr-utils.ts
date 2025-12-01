import type {
  VCardData,
  WifiData,
  EmailData,
  SMSData,
  QRContentType,
} from "@/types/qr";

export function generateVCardString(data: VCardData): string {
  // Return empty string if no name provided
  if (!data.firstName && !data.lastName) {
    return "";
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${data.lastName || ""};${data.firstName || ""};;;`,
    `FN:${[data.firstName, data.lastName].filter(Boolean).join(" ")}`,
  ];

  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.website) lines.push(`URL:${data.website}`);
  if (data.address) lines.push(`ADR:;;${data.address};;;;`);

  lines.push("END:VCARD");
  return lines.join("\n");
}

export function generateWifiString(data: WifiData): string {
  if (!data.ssid) {
    return "";
  }
  const hidden = data.hidden ? "H:true;" : "";
  return `WIFI:T:${data.encryption};S:${data.ssid};P:${data.password};${hidden};`;
}

export function generateEmailString(data: EmailData): string {
  if (!data.to) {
    return "";
  }
  const params = new URLSearchParams();
  if (data.subject) params.set("subject", data.subject);
  if (data.body) params.set("body", data.body);
  const queryString = params.toString();
  return `mailto:${data.to}${queryString ? "?" + queryString : ""}`;
}

export function generateSMSString(data: SMSData): string {
  if (!data.phone) {
    return "";
  }
  return `sms:${data.phone}${data.message ? "?body=" + encodeURIComponent(data.message) : ""}`;
}

export function generatePhoneString(phone: string): string {
  if (!phone) {
    return "";
  }
  return `tel:${phone}`;
}

export function getContentPlaceholder(type: QRContentType): string {
  switch (type) {
    case "url":
      return "https://example.com";
    case "text":
      return "Entrez votre texte ici...";
    case "email":
      return "email@example.com";
    case "phone":
      return "+33612345678";
    case "sms":
      return "+33612345678";
    case "wifi":
      return "Nom du réseau";
    case "vcard":
      return "Prénom";
    default:
      return "";
  }
}
