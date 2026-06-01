"use client";

import { useEffect, useMemo, useState } from "react";

import type { OfficeFile, PdfExportOptions } from "../lib/types";

type CellValue = string | number | boolean | null;

type CellData = {
  value: CellValue;
  href?: string;
  formula?: string;
  images: SheetImage[];
};

type SheetImage = {
  src: string;
  name: string;
  row: number;
  col: number;
};

type SheetView = {
  sheetNames: string[];
  activeSheet: string;
  rows: CellData[][];
  range: string;
  totalRows: number;
  totalCols: number;
};

type XlsxCell = {
  f?: string;
  w?: string;
  v?: string | number | boolean | Date | null;
  l?: {
    Target?: string;
    Tooltip?: string;
  };
};

type ZipEntry = {
  async(type: "text"): Promise<string>;
  async(type: "base64"): Promise<string>;
};

type ZipArchive = {
  file(path: string): ZipEntry | null;
};

type Relationship = {
  target: string;
  type: string;
};

const MAX_ROWS = 80;
const MAX_COLS = 20;
const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function cellToText(cell: CellData | undefined) {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  return String(cell.value);
}

function readDenseCell(sheet: unknown, rowIndex: number, colIndex: number) {
  if (!Array.isArray(sheet)) return undefined;
  const row = sheet[rowIndex];
  if (!Array.isArray(row)) return undefined;
  return row[colIndex] as XlsxCell | undefined;
}

function parseXml(xml: string) {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function normalizeZipPath(path: string) {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join("/");
}

function resolveTarget(ownerPath: string, target: string) {
  if (/^[a-z]+:/i.test(target)) return target;
  if (target.startsWith("/")) return normalizeZipPath(target.slice(1));
  const directory = ownerPath.slice(0, ownerPath.lastIndexOf("/"));
  return normalizeZipPath(`${directory}/${target}`);
}

function elementsByLocalName(node: ParentNode, localName: string) {
  return Array.from(node.querySelectorAll("*")).filter(
    (element) => element.localName === localName,
  );
}

function firstByLocalName(node: ParentNode, localName: string) {
  return elementsByLocalName(node, localName)[0];
}

function childTextByLocalName(node: ParentNode | undefined, localName: string) {
  if (!node) return "";
  return firstByLocalName(node, localName)?.textContent ?? "";
}

function mediaMime(path: string) {
  if (/\.jpe?g$/i.test(path)) return "image/jpeg";
  if (/\.gif$/i.test(path)) return "image/gif";
  if (/\.webp$/i.test(path)) return "image/webp";
  return "image/png";
}

async function readRelationships(zip: ZipArchive, ownerPath: string) {
  const directory = ownerPath.slice(0, ownerPath.lastIndexOf("/"));
  const basename = ownerPath.slice(ownerPath.lastIndexOf("/") + 1);
  const relsPath = `${directory}/_rels/${basename}.rels`;
  const xml = await zip.file(relsPath)?.async("text");
  const relationships = new Map<string, Relationship>();
  if (!xml) return relationships;

  const doc = parseXml(xml);
  for (const rel of Array.from(doc.getElementsByTagName("Relationship"))) {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    const type = rel.getAttribute("Type") ?? "";
    if (!id || !target) continue;
    relationships.set(id, { target: resolveTarget(ownerPath, target), type });
  }
  return relationships;
}

async function readWorkbookSheetPaths(zip: ZipArchive) {
  const workbookXml = await zip.file("xl/workbook.xml")?.async("text");
  const workbookRels = await readRelationships(zip, "xl/workbook.xml");
  const paths = new Map<string, string>();
  if (!workbookXml) return paths;

  const workbook = parseXml(workbookXml);
  for (const sheet of elementsByLocalName(workbook, "sheet")) {
    const name = sheet.getAttribute("name");
    const relId = sheet.getAttribute("r:id") ?? sheet.getAttributeNS(REL_NS, "id");
    const target = relId ? workbookRels.get(relId)?.target : undefined;
    if (name && target) paths.set(name, target);
  }
  return paths;
}

async function readSheetImages(
  zip: ZipArchive,
  sheetPath: string | undefined,
  sheetName: string,
) {
  const fallbackPath =
    sheetPath ?? `xl/worksheets/sheet${Math.max(1, Number(sheetName.match(/\d+/)?.[0] ?? 1))}.xml`;
  const sheetXml = await zip.file(fallbackPath)?.async("text");
  if (!sheetXml) return [];

  const sheetDoc = parseXml(sheetXml);
  const drawing = elementsByLocalName(sheetDoc, "drawing")[0];
  const drawingRelId =
    drawing?.getAttribute("r:id") ?? drawing?.getAttributeNS(REL_NS, "id");
  if (!drawingRelId) return [];

  const sheetRels = await readRelationships(zip, fallbackPath);
  const drawingPath = sheetRels.get(drawingRelId)?.target;
  const drawingXml = drawingPath ? await zip.file(drawingPath)?.async("text") : undefined;
  if (!drawingXml || !drawingPath) return [];

  const drawingRels = await readRelationships(zip, drawingPath);
  const drawingDoc = parseXml(drawingXml);
  const anchors = elementsByLocalName(drawingDoc, "twoCellAnchor").concat(
    elementsByLocalName(drawingDoc, "oneCellAnchor"),
  );
  const images: SheetImage[] = [];

  for (const anchor of anchors) {
    const from = firstByLocalName(anchor, "from");
    const row = Number(childTextByLocalName(from, "row"));
    const col = Number(childTextByLocalName(from, "col"));
    if (!Number.isFinite(row) || !Number.isFinite(col)) continue;

    const pic = firstByLocalName(anchor, "pic");
    const blip = pic ? firstByLocalName(pic, "blip") : undefined;
    const embedId =
      blip?.getAttribute("r:embed") ?? blip?.getAttributeNS(REL_NS, "embed");
    const target = embedId ? drawingRels.get(embedId)?.target : undefined;
    const file = target ? zip.file(target) : null;
    if (!target || !file) continue;

    const name =
      firstByLocalName(anchor, "cNvPr")?.getAttribute("name") ??
      firstByLocalName(anchor, "cNvPr")?.getAttribute("descr") ??
      "Workbook image";
    const base64 = await file.async("base64");
    images.push({
      row,
      col,
      name,
      src: `data:${mediaMime(target)};base64,${base64}`,
    });
  }

  return images;
}

export function XlsxRenderer({
  officeFile,
  options,
  zoom,
  onReady,
}: {
  officeFile: OfficeFile;
  options: PdfExportOptions;
  zoom: number;
  onReady: (info: string) => void;
}) {
  const [view, setView] = useState<SheetView | null>(null);
  const [activeSheet, setActiveSheet] = useState("");
  const [formulaTip, setFormulaTip] = useState<{
    formula: string;
    left: number;
    top: number;
  } | null>(null);

  function showFormulaTip(formula: string, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const maxLeft = Math.max(12, window.innerWidth - 360);
    const top = rect.top > 86 ? rect.top - 68 : rect.bottom + 28;
    setFormulaTip({
      formula,
      left: Math.min(Math.max(12, rect.left + 18), maxLeft),
      top: Math.min(Math.max(12, top), window.innerHeight - 96),
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ default: JSZip }, XLSX] = await Promise.all([
        import("jszip"),
        import("xlsx"),
      ]);
      const zip = await JSZip.loadAsync(officeFile.buffer.slice(0));
      const sheetPaths = await readWorkbookSheetPaths(zip);
      const workbook = XLSX.read(officeFile.buffer, {
        type: "array",
        dense: true,
        cellFormula: true,
        cellDates: true,
        cellNF: true,
        cellStyles: false,
      });
      const sheetName = activeSheet || workbook.SheetNames[0] || "";
      const sheet = workbook.Sheets[sheetName];
      const decoded = XLSX.utils.decode_range(sheet?.["!ref"] ?? "A1");
      const images = await readSheetImages(zip, sheetPaths.get(sheetName), sheetName);
      const imageMap = new Map<string, SheetImage[]>();
      for (const image of images) {
        const key = `${image.row}:${image.col}`;
        imageMap.set(key, [...(imageMap.get(key) ?? []), image]);
      }
      const denseRows = Array.isArray(sheet) ? sheet.length : 0;
      const denseCols = Array.isArray(sheet)
        ? Math.max(0, ...sheet.map((row) => (Array.isArray(row) ? row.length : 0)))
        : 0;
      const addressExtent = Object.keys((sheet as Record<string, unknown>) ?? {})
        .filter((key) => /^[A-Z]+\d+$/.test(key))
        .reduce(
          (extent, address) => {
            const cell = XLSX.utils.decode_cell(address);
            return {
              rows: Math.max(extent.rows, cell.r + 1),
              cols: Math.max(extent.cols, cell.c + 1),
            };
          },
          { rows: 0, cols: 0 },
        );
      const imageExtent = images.reduce(
        (extent, image) => ({
          rows: Math.max(extent.rows, image.row + 1),
          cols: Math.max(extent.cols, image.col + 1),
        }),
        { rows: 0, cols: 0 },
      );
      const totalRows = Math.max(decoded.e.r + 1, denseRows, addressExtent.rows, imageExtent.rows);
      const totalCols = Math.max(decoded.e.c + 1, denseCols, addressExtent.cols, imageExtent.cols);
      const rows: CellData[][] = [];
      for (let rowIndex = 0; rowIndex < Math.min(totalRows, MAX_ROWS); rowIndex += 1) {
        const row: CellData[] = [];
        for (let colIndex = 0; colIndex < Math.min(totalCols, MAX_COLS); colIndex += 1) {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          const cell =
            readDenseCell(sheet, rowIndex, colIndex) ??
            ((sheet as Record<string, XlsxCell> | undefined)?.[address]);
          const value = cell?.w ?? cell?.v ?? null;
          row.push({
            value: value instanceof Date ? value.toLocaleDateString() : value,
            href: cell?.l?.Target,
            formula: cell?.f,
            images: imageMap.get(`${rowIndex}:${colIndex}`) ?? [],
          });
        }
        rows.push(row);
      }
      if (cancelled) return;

      setView({
        sheetNames: workbook.SheetNames,
        activeSheet: sheetName,
        rows,
        range: sheet?.["!ref"] ?? "A1",
        totalRows,
        totalCols,
      });
      onReady(
        `${workbook.SheetNames.length} sheets loaded; ${images.length} images found; performance preview shows cached formula results`,
      );
    }

    load().catch((error) => {
      if (!cancelled) onReady(error instanceof Error ? error.message : "XLSX load failed");
    });

    return () => {
      cancelled = true;
    };
  }, [activeSheet, officeFile.buffer, onReady]);

  const columnCount = useMemo(
    () => Math.max(1, ...(view?.rows ?? []).map((row) => row.length)),
    [view],
  );

  if (!view) {
    return <p className="text-sm font-black text-[#725d42]">Loading workbook…</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {view.sheetNames.map((sheetName) => (
          <button
            key={sheetName}
            type="button"
            onClick={() => setActiveSheet(sheetName)}
            className={`rounded-lg border-2 px-3 py-2 text-sm font-black ${
              view.activeSheet === sheetName
                ? "border-[#19c8b9] bg-[#dcfbf7] text-[#087d76]"
                : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
            }`}
          >
            {sheetName}
          </button>
        ))}
      </div>
      <div className="rounded-lg border-2 border-[#d4c9b4] bg-white/80 p-3 text-sm font-bold text-[#725d42]">
        Range {view.range}. Showing {Math.min(view.totalRows, MAX_ROWS)} /{" "}
        {view.totalRows} rows and {Math.min(view.totalCols, MAX_COLS)} /{" "}
        {view.totalCols} columns. PDF export uses this performance preview. Grid{" "}
        {options.includeGrid ? "on" : "off"}.
      </div>
      <div className="overflow-auto rounded-lg border-4 border-[#794f27] bg-white">
        <table
          className="min-w-full origin-top-left border-collapse text-sm"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          <thead className="sticky top-0 z-10 bg-[#f7e7b6]">
            <tr>
              <th className="border border-[#d4c9b4] px-2 py-1 text-[#8a7b66]">#</th>
              {Array.from({ length: columnCount }, (_, index) => (
                <th
                  key={index}
                  className="min-w-24 border border-[#d4c9b4] px-2 py-1 text-[#8a7b66]"
                >
                  {String.fromCharCode(65 + (index % 26))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 ? "bg-[#fffdf6]" : "bg-white"}>
                <th className="sticky left-0 border border-[#d4c9b4] bg-[#f7e7b6] px-2 py-1 text-right text-[#8a7b66]">
                  {rowIndex + 1}
                </th>
                {Array.from({ length: columnCount }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    className={`max-w-72 px-2 py-1 align-top text-[#473727] ${
                      options.includeGrid ? "border border-[#eee4cf]" : ""
                    }`}
                    title={row[colIndex]?.formula ? undefined : cellToText(row[colIndex])}
                  >
                    <div className="grid gap-2">
                      {row[colIndex]?.href ? (
                        <a
                          href={row[colIndex].href}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-black text-[#087d76] underline decoration-2 underline-offset-2"
                        >
                          {cellToText(row[colIndex]) || row[colIndex].href}
                        </a>
                      ) : (
                        <span className="flex min-w-0 items-center gap-1">
                          <span className="truncate">{cellToText(row[colIndex])}</span>
                          {row[colIndex]?.formula ? (
                            <span
                              tabIndex={0}
                              onMouseEnter={(event) =>
                                showFormulaTip(row[colIndex].formula!, event.currentTarget)
                              }
                              onMouseLeave={() => setFormulaTip(null)}
                              onFocus={(event) =>
                                showFormulaTip(row[colIndex].formula!, event.currentTarget)
                              }
                              onBlur={() => setFormulaTip(null)}
                              className="rounded border border-[#19c8b9] bg-[#dcfbf7] px-1 text-[10px] font-black leading-4 text-[#087d76] outline-none"
                            >
                              fx
                            </span>
                          ) : null}
                        </span>
                      )}
                      {row[colIndex]?.images.map((image) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${image.row}-${image.col}-${image.name}`}
                          src={image.src}
                          alt={image.name}
                          title={image.name}
                          className="max-h-36 min-h-16 w-full rounded-md border border-[#d4c9b4] object-contain"
                        />
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {formulaTip ? (
        <div
          className="pointer-events-none fixed z-[1301] max-w-[min(22rem,calc(100vw-1.5rem))] whitespace-pre-wrap rounded-md border-2 border-[#794f27] bg-[#fffdf2] px-3 py-2 text-left text-xs font-black leading-5 text-[#473727] shadow-[0_4px_0_rgba(122,97,65,0.22)]"
          style={{ left: formulaTip.left, top: formulaTip.top }}
        >
          ={formulaTip.formula}
        </div>
      ) : null}
    </div>
  );
}
