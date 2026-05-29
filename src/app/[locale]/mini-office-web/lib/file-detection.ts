import type { OfficeFormat } from "./types";

const EXTENSION_FORMATS: Record<string, OfficeFormat> = {
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  xlsm: "xlsx",
  xls: "xlsx",
  pptx: "pptx",
};

export function detectOfficeFormat(file: File): OfficeFormat {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (EXTENSION_FORMATS[extension]) {
    return EXTENSION_FORMATS[extension];
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "xlsx";
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "pptx";
  }

  return "unknown";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function safeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-") || "document";
}
