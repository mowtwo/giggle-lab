import type { PdfExportOptions } from "../lib/types";

function parsePageRange(range: string, pageCount: number) {
  const trimmed = range.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const pages = new Set<number>();
  for (const part of trimmed.split(",")) {
    const [startRaw, endRaw] = part.split("-").map((value) => value.trim());
    const start = Number(startRaw);
    const end = endRaw ? Number(endRaw) : start;

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    for (let page = Math.max(1, start); page <= Math.min(pageCount, end); page += 1) {
      pages.add(page - 1);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export async function exportPdfSource(
  buffer: ArrayBuffer,
  options: PdfExportOptions,
) {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(buffer.slice(0));
  const out = await PDFDocument.create();
  const pages = parsePageRange(options.pageRange, source.getPageCount());
  const copied = await out.copyPages(source, pages);
  for (const page of copied) out.addPage(page);

  if (options.includeMetadata) {
    out.setTitle("Mini Office Web export");
    out.setProducer("Giggle Lab Mini Office Web");
    out.setCreationDate(new Date());
  }

  const bytes = await out.save();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
