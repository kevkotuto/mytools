export type FileType =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'csv'
  | 'txt'
  | 'json'
  | 'xml'
  | 'html'
  | 'md'
  | 'image';

export type ConversionType = {
  from: FileType;
  to: FileType[];
};

export const supportedConversions: ConversionType[] = [
  { from: 'pdf', to: ['txt', 'json', 'image', 'docx'] },
  { from: 'docx', to: ['txt', 'html', 'md', 'pdf'] },
  { from: 'xlsx', to: ['csv', 'json', 'html'] },
  { from: 'csv', to: ['xlsx', 'json', 'html'] },
  { from: 'txt', to: ['pdf', 'html', 'md'] },
  { from: 'json', to: ['csv', 'xlsx', 'xml', 'txt'] },
  { from: 'xml', to: ['json', 'txt'] },
  { from: 'html', to: ['txt', 'md', 'pdf'] },
  { from: 'md', to: ['html', 'txt', 'pdf'] },
  { from: 'image', to: ['txt', 'pdf'] }, // OCR
];

export const fileTypeLabels: Record<FileType, string> = {
  pdf: 'PDF',
  docx: 'Word (DOCX)',
  xlsx: 'Excel (XLSX)',
  csv: 'CSV',
  txt: 'Texte',
  json: 'JSON',
  xml: 'XML',
  html: 'HTML',
  md: 'Markdown',
  image: 'Image (OCR)',
};

export const fileTypeExtensions: Record<FileType, string[]> = {
  pdf: ['.pdf'],
  docx: ['.docx'],
  xlsx: ['.xlsx', '.xls'],
  csv: ['.csv'],
  txt: ['.txt'],
  json: ['.json'],
  xml: ['.xml'],
  html: ['.html', '.htm'],
  md: ['.md', '.markdown'],
  image: ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'],
};

export const fileTypeMimeTypes: Record<FileType, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
  csv: ['text/csv'],
  txt: ['text/plain'],
  json: ['application/json'],
  xml: ['application/xml', 'text/xml'],
  html: ['text/html'],
  md: ['text/markdown', 'text/x-markdown'],
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif'],
};

export interface ConversionResult {
  success: boolean;
  data?: Blob | string;
  filename?: string;
  error?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  detectedType: FileType | null;
}
