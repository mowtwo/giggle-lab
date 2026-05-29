export type OfficeFormat = "pdf" | "docx" | "xlsx" | "pptx" | "unknown";

export type OfficeFile = {
  file: File;
  buffer: ArrayBuffer;
  format: OfficeFormat;
  objectUrl: string;
};

export type ExportQuality = "screen" | "print" | "archive";

export type PdfExportOptions = {
  quality: ExportQuality;
  paper: "a4" | "letter" | "slide";
  orientation: "portrait" | "landscape" | "auto";
  marginMm: number;
  includeGrid: boolean;
  includeMetadata: boolean;
  pageRange: string;
};

export type RenderStatus = {
  stage: "idle" | "loading" | "ready" | "exporting" | "error";
  message: string;
};
