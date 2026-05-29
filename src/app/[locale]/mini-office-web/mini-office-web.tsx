"use client";

import { Button, Card, Cursor, Divider, Icon } from "animal-island-ui";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import { downloadBlob } from "./export/download";
import { exportElementToPdf } from "./export/dom-to-pdf";
import { exportPdfSource } from "./export/pdf-source";
import { detectOfficeFormat, formatBytes, safeBaseName } from "./lib/file-detection";
import type { OfficeFile, PdfExportOptions, RenderStatus } from "./lib/types";

const PdfRenderer = dynamic(
  () => import("./renderers/pdf-renderer").then((mod) => mod.PdfRenderer),
  { ssr: false, loading: () => <LoadingPanel /> },
);
const XlsxRenderer = dynamic(
  () => import("./renderers/xlsx-renderer").then((mod) => mod.XlsxRenderer),
  { ssr: false, loading: () => <LoadingPanel /> },
);
const DocxRenderer = dynamic(
  () => import("./renderers/docx-renderer").then((mod) => mod.DocxRenderer),
  { ssr: false, loading: () => <LoadingPanel /> },
);
const PptxRenderer = dynamic(
  () => import("./renderers/pptx-renderer").then((mod) => mod.PptxRenderer),
  { ssr: false, loading: () => <LoadingPanel /> },
);

const ACCEPTED = ".pdf,.docx,.xlsx,.xlsm,.xls,.pptx,application/pdf";

function LoadingPanel() {
  return (
    <div className="grid min-h-80 place-items-center rounded-lg border-2 border-dashed border-[#d4c9b4] bg-white/70 p-6 text-center text-base font-black text-[#725d42]">
      Loading renderer…
    </div>
  );
}

const DEFAULT_OPTIONS: PdfExportOptions = {
  quality: "print",
  paper: "a4",
  orientation: "auto",
  marginMm: 8,
  includeGrid: true,
  includeMetadata: true,
  pageRange: "all",
};

export function MiniOfficeWeb() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("MiniOfficeWeb");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [officeFile, setOfficeFile] = useState<OfficeFile | null>(null);
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_OPTIONS);
  const [status, setStatus] = useState<RenderStatus>({
    stage: "idle",
    message: t("statusIdle"),
  });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{
    kind: "image" | "video";
    src: string;
    label: string;
  } | null>(null);

  useEffect(
    () => () => {
      if (officeFile) URL.revokeObjectURL(officeFile.objectUrl);
    },
    [officeFile],
  );

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    function handlePreviewClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (anchor instanceof HTMLAnchorElement && anchor.href) {
        event.preventDefault();
        window.open(anchor.href, "_blank", "noopener,noreferrer");
        return;
      }

      const image = target.closest("img");
      if (image instanceof HTMLImageElement && image.currentSrc) {
        event.preventDefault();
        setMediaPreview({
          kind: "image",
          src: image.currentSrc,
          label: image.alt || "Document image",
        });
        return;
      }

      const video = target.closest("video");
      if (video instanceof HTMLVideoElement && video.currentSrc) {
        event.preventDefault();
        setMediaPreview({
          kind: "video",
          src: video.currentSrc,
          label: "Document video",
        });
      }
    }

    preview.addEventListener("click", handlePreviewClick);
    return () => preview.removeEventListener("click", handlePreviewClick);
  }, [officeFile]);

  const loadFile = useCallback(
    async (file: File) => {
      const format = detectOfficeFormat(file);
      if (format === "unknown") {
        setStatus({ stage: "error", message: t("unsupported") });
        return;
      }

      setStatus({ stage: "loading", message: t("reading") });
      const buffer = await file.arrayBuffer();
      setOfficeFile((current) => {
        if (current) URL.revokeObjectURL(current.objectUrl);
        return {
          file,
          buffer,
          format,
          objectUrl: URL.createObjectURL(file),
        };
      });
      setSettingsOpen(false);
      setZoom(1);
      setStatus({ stage: "loading", message: t("loadingRenderer") });
    },
    [t],
  );

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadFile(file);
  }

  const handleRendererReady = useCallback((message: string) => {
    setStatus({ stage: "ready", message });
  }, []);

  async function exportPdf() {
    if (!officeFile || !previewRef.current) return;
    setStatus({ stage: "exporting", message: t("exporting") });

    try {
      const name = `${safeBaseName(officeFile.file.name)}.pdf`;
      const blob =
        officeFile.format === "pdf"
          ? await exportPdfSource(officeFile.buffer, options)
          : await exportElementToPdf(previewRef.current!, options);
      downloadBlob(blob, name);
      setStatus({ stage: "ready", message: t("exportReady") });
    } catch (error) {
      setStatus({
        stage: "error",
        message: error instanceof Error ? error.message : t("exportError"),
      });
    }
  }

  const renderer = officeFile ? (
    officeFile.format === "pdf" ? (
      <PdfRenderer
        officeFile={officeFile}
        options={options}
        zoom={zoom}
        onReady={handleRendererReady}
      />
    ) : officeFile.format === "xlsx" ? (
      <XlsxRenderer
        officeFile={officeFile}
        options={options}
        zoom={zoom}
        onReady={handleRendererReady}
      />
    ) : officeFile.format === "docx" ? (
      <DocxRenderer
        officeFile={officeFile}
        options={options}
        zoom={zoom}
        onReady={handleRendererReady}
      />
    ) : officeFile.format === "pptx" ? (
      <PptxRenderer
        officeFile={officeFile}
        options={options}
        zoom={zoom}
        onReady={handleRendererReady}
      />
    ) : null
  ) : null;

  return (
    <Cursor>
      <main className="min-h-svh px-3 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileInput}
        />

        {!officeFile ? (
          <section className="mx-auto grid min-h-[calc(100svh-120px)] max-w-3xl place-items-center py-8">
            <Card type="title" color="app-teal" className="w-full p-6 text-center sm:p-8">
              <div className="grid justify-items-center gap-5">
                <Icon name="icon-design" size={82} bounce />
                <div className="space-y-3">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[#087d76]">
                    Mini office
                  </p>
                  <h1 className="text-balance text-4xl font-black leading-tight text-[#794f27] sm:text-5xl">
                    {t("title")}
                  </h1>
                  <p className="mx-auto max-w-xl text-base font-bold leading-7 text-[#725d42]">
                    {t("description")}
                  </p>
                </div>
                <Divider type="wave-yellow" />
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`w-full rounded-lg border-4 border-dashed p-6 transition ${
                    dragging
                      ? "border-[#19c8b9] bg-[#dcfbf7]"
                      : "border-[#d4c9b4] bg-white/70"
                  }`}
                >
                  <p className="text-lg font-black text-[#725d42]">
                    {t("dropTitle")}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#8a7b66]">
                    {t("dropHint")}
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    className="mt-5"
                    onClick={() => inputRef.current?.click()}
                  >
                    {t("pickFile")}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        ) : (
          <section className="mx-auto grid max-w-[1600px] gap-3 py-4">
            <div className="sticky top-2 z-20 rounded-lg border-4 border-[#794f27] bg-[#fffaf0]/95 p-2 shadow-[0_3px_0_rgba(122,97,65,0.18)] backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="default" onClick={() => inputRef.current?.click()}>
                  {t("switchFile")}
                </Button>
                <div className="min-w-0 flex-1 px-2">
                  <p className="truncate text-sm font-black text-[#794f27]">
                    {officeFile.file.name}
                  </p>
                  <p className="text-xs font-bold text-[#8a7b66]">
                    {officeFile.format.toUpperCase()} · {formatBytes(officeFile.file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border-2 border-[#d4c9b4] bg-white px-1 py-1">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-md text-lg font-black text-[#725d42]"
                    onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
                  >
                    -
                  </button>
                  <span className="w-14 text-center text-sm font-black text-[#725d42]">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-md text-lg font-black text-[#725d42]"
                    onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))}
                  >
                    +
                  </button>
                </div>
                <Button type="default" onClick={() => setSettingsOpen((value) => !value)}>
                  {t("settings")}
                </Button>
                <Button
                  type="primary"
                  disabled={status.stage === "exporting"}
                  onClick={exportPdf}
                >
                  {status.stage === "exporting" ? t("exporting") : t("exportPdf")}
                </Button>
              </div>

              {settingsOpen ? (
                <div className="mt-3 grid gap-3 border-t-2 border-[#eadfc9] pt-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm font-black text-[#725d42]">
                    {t("quality")}
                    <select
                      value={options.quality}
                      onChange={(event) =>
                        setOptions((prev) => ({
                          ...prev,
                          quality: event.target.value as PdfExportOptions["quality"],
                        }))
                      }
                      className="rounded-lg border-2 border-[#d4c9b4] bg-white px-3 py-2"
                    >
                      <option value="screen">{t("qualityScreen")}</option>
                      <option value="print">{t("qualityPrint")}</option>
                      <option value="archive">{t("qualityArchive")}</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-black text-[#725d42]">
                    {t("pageRange")}
                    <input
                      value={options.pageRange}
                      onChange={(event) =>
                        setOptions((prev) => ({ ...prev, pageRange: event.target.value }))
                      }
                      className="rounded-lg border-2 border-[#d4c9b4] bg-white px-3 py-2"
                      placeholder="all, 1-3, 5"
                    />
                  </label>
                  <label className="flex items-end gap-3 pb-2 text-sm font-black text-[#725d42]">
                    <input
                      type="checkbox"
                      checked={options.includeGrid}
                      onChange={(event) =>
                        setOptions((prev) => ({
                          ...prev,
                          includeGrid: event.target.checked,
                        }))
                      }
                    />
                    {t("includeGrid")}
                  </label>
                </div>
              ) : null}
              <p className="mt-2 truncate text-xs font-bold text-[#725d42]">
                {status.message}
              </p>
            </div>

            <div
              ref={previewRef}
              className="mini-office-preview min-h-[calc(100svh-158px)] overflow-auto rounded-lg border-4 border-[#794f27] bg-[#d8ceb8] p-3 sm:p-5"
            >
              {renderer}
            </div>
          </section>
        )}

        {mediaPreview ? (
          <div
            className="fixed inset-0 z-[1200] grid place-items-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={mediaPreview.label}
            onClick={() => setMediaPreview(null)}
          >
            <div
              className="grid max-h-[92svh] w-full max-w-5xl gap-3 rounded-lg border-4 border-[#794f27] bg-[#fffaf0] p-3 shadow-[0_6px_0_rgba(122,97,65,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-black text-[#794f27]">
                  {mediaPreview.label}
                </p>
                <Button type="default" onClick={() => setMediaPreview(null)}>
                  {tCommon("close")}
                </Button>
              </div>
              {mediaPreview.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaPreview.src}
                  alt={mediaPreview.label}
                  className="max-h-[78svh] w-full object-contain"
                />
              ) : (
                <video
                  src={mediaPreview.src}
                  controls
                  autoPlay
                  className="max-h-[78svh] w-full bg-black"
                />
              )}
            </div>
          </div>
        ) : null}
      </main>
    </Cursor>
  );
}
