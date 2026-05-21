import {
  buildBatchPackets,
  packetLabel,
  type FileMeta,
  type Packet,
} from "./protocol";

export type LayoutMode = "1x1" | "2x2" | "3x3" | "4x4";

export const LAYOUT_OPTIONS: LayoutMode[] = ["1x1", "2x2", "3x3", "4x4"];

export type ExportProgress = {
  batchIndex: number;
  batchTotal: number;
  frameInBatch: number;
  frameTotal: number;
};

export type ExportOptions = {
  layout: LayoutMode;
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
  yieldEveryFrames?: number;
};

type GridDim = { cols: number; rows: number };

function gridFromLayout(layout: LayoutMode): GridDim {
  switch (layout) {
    case "1x1":
      return { cols: 1, rows: 1 };
    case "2x2":
      return { cols: 2, rows: 2 };
    case "3x3":
      return { cols: 3, rows: 3 };
    case "4x4":
      return { cols: 4, rows: 4 };
  }
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

async function ensureNotAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("Export cancelled", "AbortError");
  }
}

// Yield to the browser so the page stays responsive during large exports.
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && "scheduler" in window) {
      const scheduler = (window as unknown as {
        scheduler: {
          postTask?: (cb: () => void, opts: { priority: string }) => void;
        };
      }).scheduler;
      if (typeof scheduler.postTask === "function") {
        scheduler.postTask(() => resolve(), { priority: "user-visible" });
        return;
      }
    }
    setTimeout(resolve, 0);
  });
}

// Draw a QR code's bit matrix to the PDF using vector rects. Adjacent black
// modules in a row are merged into a single rect for compactness.
// Draws the matrix plus a 4-module quiet zone around it (the QR spec
// requires it; without it scanners often refuse to lock on, especially when
// neighbouring cells on the page touch each other).
const QUIET_MODULES = 4;

function drawQrMatrix(
  doc: import("jspdf").jsPDF,
  matrix: { size: number; get(row: number, col: number): number },
  x: number,
  y: number,
  size: number,
) {
  const moduleCount = matrix.size;
  const outerModules = moduleCount + QUIET_MODULES * 2;
  const moduleSize = size / outerModules;
  const innerX = x + QUIET_MODULES * moduleSize;
  const innerY = y + QUIET_MODULES * moduleSize;
  doc.setFillColor(0, 0, 0);

  for (let row = 0; row < moduleCount; row += 1) {
    let runStart = -1;
    for (let col = 0; col <= moduleCount; col += 1) {
      const isBlack = col < moduleCount && matrix.get(row, col) === 1;
      if (isBlack && runStart === -1) {
        runStart = col;
      } else if (!isBlack && runStart !== -1) {
        doc.rect(
          innerX + runStart * moduleSize,
          innerY + row * moduleSize,
          (col - runStart) * moduleSize,
          moduleSize,
          "F",
        );
        runStart = -1;
      }
    }
  }
}

type PageLayout = {
  qrSize: number;
  labelHeight: number;
  cellWidth: number;
  cellHeight: number;
  marginX: number;
  marginY: number;
  headerHeight: number;
  pageWidth: number;
  pageHeight: number;
};

function computePageLayout(
  doc: import("jspdf").jsPDF,
  grid: GridDim,
): PageLayout {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36; // 0.5 inch
  const marginY = 36;
  const headerHeight = 28;
  const usableWidth = pageWidth - marginX * 2;
  const usableHeight = pageHeight - marginY * 2 - headerHeight;
  const cellWidth = usableWidth / grid.cols;
  const cellHeight = usableHeight / grid.rows;
  const labelHeight = 18;
  // QR is square, fit inside the cell minus label height.
  const qrSize = Math.min(cellWidth, cellHeight - labelHeight) - 8;

  return {
    qrSize,
    labelHeight,
    cellWidth,
    cellHeight,
    marginX,
    marginY,
    headerHeight,
    pageWidth,
    pageHeight,
  };
}

function drawHeader(
  doc: import("jspdf").jsPDF,
  layout: PageLayout,
  fileMeta: FileMeta,
  batchIndex: number,
  pageNumber: number,
  pageTotal: number,
) {
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  const left = `${fileMeta.name}  ·  batch ${batchIndex + 1}/${fileMeta.totalBatches}  ·  ${fileMeta.size} bytes`;
  const right = `page ${pageNumber}/${pageTotal}`;
  doc.text(left, layout.marginX, layout.marginY + 12);
  const rightWidth = doc.getTextWidth(right);
  doc.text(
    right,
    layout.pageWidth - layout.marginX - rightWidth,
    layout.marginY + 12,
  );
  // Hairline divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(
    layout.marginX,
    layout.marginY + layout.headerHeight - 6,
    layout.pageWidth - layout.marginX,
    layout.marginY + layout.headerHeight - 6,
  );
}

async function buildPdfForPackets(
  fileMeta: FileMeta,
  packets: Packet[],
  batchIndex: number,
  options: ExportOptions,
): Promise<Blob> {
  const [{ jsPDF }, qrcode] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);

  const grid = gridFromLayout(options.layout);
  const perPage = grid.cols * grid.rows;
  const totalPages = Math.max(1, Math.ceil(packets.length / perPage));
  const yieldEvery = options.yieldEveryFrames ?? 20;

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const layout = computePageLayout(doc, grid);

  for (let i = 0; i < packets.length; i += 1) {
    await ensureNotAborted(options.signal);

    const pageIndex = Math.floor(i / perPage);
    const cellIndex = i % perPage;
    const col = cellIndex % grid.cols;
    const row = Math.floor(cellIndex / grid.cols);

    if (cellIndex === 0) {
      if (pageIndex > 0) {
        doc.addPage();
      }
      drawHeader(doc, layout, fileMeta, batchIndex, pageIndex + 1, totalPages);
    }

    const cellX = layout.marginX + col * layout.cellWidth;
    const cellY =
      layout.marginY + layout.headerHeight + row * layout.cellHeight;
    const qrX = cellX + (layout.cellWidth - layout.qrSize) / 2;
    const qrY = cellY + 4;

    const matrix = qrcode.create(JSON.stringify(packets[i]), {
      errorCorrectionLevel: "L",
    }).modules;

    drawQrMatrix(doc, matrix, qrX, qrY, layout.qrSize);

    // Label below the QR.
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    const label = packetLabel(packets[i]);
    const labelWidth = doc.getTextWidth(label);
    doc.text(
      label,
      cellX + (layout.cellWidth - labelWidth) / 2,
      qrY + layout.qrSize + 12,
    );

    options.onProgress?.({
      batchIndex,
      batchTotal: fileMeta.totalBatches,
      frameInBatch: i + 1,
      frameTotal: packets.length,
    });

    if ((i + 1) % yieldEvery === 0) {
      await yieldToBrowser();
    }
  }

  return doc.output("blob");
}

export async function buildBatchPdf(
  fileMeta: FileMeta,
  chunks: string[],
  batchIndex: number,
  options: ExportOptions,
): Promise<{ blob: Blob; filename: string }> {
  const packets = buildBatchPackets(fileMeta, chunks, batchIndex);
  const blob = await buildPdfForPackets(fileMeta, packets, batchIndex, options);
  const base = sanitizeFilename(fileMeta.name);
  const padded = String(batchIndex + 1).padStart(
    String(fileMeta.totalBatches).length,
    "0",
  );
  const filename = `${base}.batch-${padded}-of-${fileMeta.totalBatches}.pdf`;
  return { blob, filename };
}

export async function buildAllBatchesZip(
  fileMeta: FileMeta,
  chunks: string[],
  options: ExportOptions,
): Promise<{ blob: Blob; filename: string }> {
  const JSZipMod = await import("jszip");
  const JSZip = JSZipMod.default;
  const zip = new JSZip();

  for (let batchIndex = 0; batchIndex < fileMeta.totalBatches; batchIndex += 1) {
    await ensureNotAborted(options.signal);
    const { blob, filename } = await buildBatchPdf(
      fileMeta,
      chunks,
      batchIndex,
      options,
    );
    zip.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "STORE",
    },
    (meta) => {
      options.onProgress?.({
        batchIndex: fileMeta.totalBatches,
        batchTotal: fileMeta.totalBatches,
        frameInBatch: Math.round(meta.percent),
        frameTotal: 100,
      });
    },
  );
  const base = sanitizeFilename(fileMeta.name);
  return { blob: zipBlob, filename: `${base}.qr-batches.zip` };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Defer revoke so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
