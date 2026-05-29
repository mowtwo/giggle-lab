"use client";

import { useEffect, useMemo, useState } from "react";

import type { OfficeFile, PdfExportOptions } from "../lib/types";

type CellValue = string | number | boolean | null;

type CellData = {
  value: CellValue;
  href?: string;
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
  w?: string;
  v?: string | number | boolean | Date | null;
  l?: {
    Target?: string;
    Tooltip?: string;
  };
};

const MAX_ROWS = 80;
const MAX_COLS = 20;

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const XLSX = await import("xlsx");
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
      const totalRows = decoded.e.r + 1;
      const totalCols = decoded.e.c + 1;
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
        `${workbook.SheetNames.length} sheets loaded; performance preview shows cached formula results`,
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
                    className={`max-w-64 truncate px-2 py-1 text-[#473727] ${
                      options.includeGrid ? "border border-[#eee4cf]" : ""
                    }`}
                    title={cellToText(row[colIndex])}
                  >
                    {row[colIndex]?.href ? (
                      <a
                        href={row[colIndex].href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-black text-[#087d76] underline decoration-2 underline-offset-2"
                      >
                        {cellToText(row[colIndex]) || row[colIndex].href}
                      </a>
                    ) : (
                      cellToText(row[colIndex])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
