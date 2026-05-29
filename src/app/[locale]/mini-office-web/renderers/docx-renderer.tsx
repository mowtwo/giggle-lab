"use client";

import { useEffect, useRef } from "react";

import type { OfficeFile, PdfExportOptions } from "../lib/types";

export function DocxRenderer({
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
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";

    async function render() {
      if (!host) return;
      try {
        const docx = await import("docx-preview");
        await docx.renderAsync(officeFile.buffer.slice(0), host, undefined, {
          className: "mini-office-docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
        });
        if (!cancelled) onReady("DOCX rendered with paged HTML preview");
      } catch {
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.convertToHtml({
          arrayBuffer: officeFile.buffer.slice(0),
        });
        if (cancelled) return;
        host.innerHTML = `<div class="mini-office-docx-fallback">${result.value}</div>`;
        onReady("DOCX rendered with semantic fallback HTML");
      }
    }

    render().catch((error) => {
      if (!cancelled) onReady(error instanceof Error ? error.message : "DOCX render failed");
    });

    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [officeFile.buffer, onReady]);

  return (
    <div className="grid gap-3">
      <p className="rounded-lg border-2 border-[#d4c9b4] bg-white/80 p-3 text-sm font-bold text-[#725d42]">
        DOCX preview uses paged HTML. Export quality: {options.quality}; exact Word
        pagination can differ for complex floating objects.
      </p>
      <div className="overflow-auto">
        <div
          ref={hostRef}
          className="mini-office-docx-host origin-top-left"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        />
      </div>
    </div>
  );
}
