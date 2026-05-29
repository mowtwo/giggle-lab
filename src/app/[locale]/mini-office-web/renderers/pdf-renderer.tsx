"use client";

import { useEffect, useRef, useState } from "react";

import type { OfficeFile, PdfExportOptions } from "../lib/types";

type PdfInfo = {
  pageCount: number;
  rendered: number;
};

function shouldShowTextFallback(textContent: { items: Array<unknown> }) {
  return textContent.items.some((item) =>
    /[\u3400-\u9fff]/.test(
      typeof item === "object" && item && "str" in item
        ? String(item.str ?? "")
        : "",
    ),
  );
}

export function PdfRenderer({
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
  const [info, setInfo] = useState<PdfInfo>({ pageCount: 0, rendered: 0 });

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    if (!host) return;
    host.innerHTML = "";

    async function render() {
      if (!host) return;
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();
      const task = pdfjs.getDocument({
        data: officeFile.buffer.slice(0),
        cMapPacked: true,
        cMapUrl: "/pdfjs/cmaps/",
        standardFontDataUrl: "/pdfjs/standard_fonts/",
      });
      const pdf = await task.promise;
      if (cancelled) return;

      setInfo({ pageCount: pdf.numPages, rendered: 0 });
      onReady(`${pdf.numPages} PDF pages loaded`);

      const maxInitialPages = Math.min(pdf.numPages, 8);
      for (let pageNumber = 1; pageNumber <= maxInitialPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({
          scale:
            (options.quality === "archive"
              ? 1.7
              : options.quality === "print"
                ? 1.4
                : 1.1) * zoom,
        });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = "block bg-white";
        const wrapper = document.createElement("div");
        wrapper.className = "grid gap-2";
        const frame = document.createElement("div");
        frame.className =
          "relative mx-auto overflow-hidden rounded-md bg-white shadow-[0_3px_0_rgba(122,97,65,0.15)]";
        frame.style.width = `${canvas.width}px`;
        frame.style.height = `${canvas.height}px`;
        frame.style.maxWidth = "100%";
        const label = document.createElement("p");
        label.className = "text-center text-xs font-black text-[#8a7b66]";
        label.textContent = `Page ${pageNumber}`;
        frame.appendChild(canvas);
        wrapper.appendChild(frame);
        wrapper.appendChild(label);
        host.appendChild(wrapper);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const textContent = await page.getTextContent();
        const textLayer = document.createElement("div");
        textLayer.className = shouldShowTextFallback(textContent)
          ? "textLayer mini-office-pdf-text-layer mini-office-pdf-text-layer--visible"
          : "textLayer mini-office-pdf-text-layer";
        frame.appendChild(textLayer);
        await new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport,
        }).render();
        const annotations = await page.getAnnotations({ intent: "display" });
        const canvasScaleX = canvas.width / viewport.width;
        const canvasScaleY = canvas.height / viewport.height;
        for (const annotation of annotations) {
          if (annotation.subtype !== "Link" || !annotation.url || !annotation.rect) {
            continue;
          }
          const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(
            annotation.rect,
          );
          const link = document.createElement("a");
          link.href = annotation.url;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.title = annotation.url;
          link.className =
            "absolute rounded border border-transparent hover:border-[#19c8b9] hover:bg-[#19c8b9]/10";
          link.style.left = `${Math.min(x1, x2) * canvasScaleX}px`;
          link.style.top = `${Math.min(y1, y2) * canvasScaleY}px`;
          link.style.width = `${Math.abs(x2 - x1) * canvasScaleX}px`;
          link.style.height = `${Math.abs(y2 - y1) * canvasScaleY}px`;
          frame.appendChild(link);
        }
        setInfo((prev) => ({ ...prev, rendered: pageNumber }));
      }

      if (pdf.numPages > maxInitialPages) {
        const note = document.createElement("p");
        note.className =
          "rounded-lg border-2 border-[#d4c9b4] bg-white/80 p-3 text-center text-sm font-bold text-[#725d42]";
        note.textContent = `Showing first ${maxInitialPages} pages for performance. PDF export can still use the selected page range.`;
        host.appendChild(note);
      }
    }

    render().catch((error) => {
      if (!cancelled) onReady(error instanceof Error ? error.message : "PDF render failed");
    });

    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [officeFile.buffer, onReady, options.quality, zoom]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm font-black text-[#725d42]">
        <span>{info.pageCount} pages</span>
        <span>·</span>
        <span>{info.rendered} rendered</span>
      </div>
      <div ref={hostRef} className="grid gap-5" />
    </div>
  );
}
