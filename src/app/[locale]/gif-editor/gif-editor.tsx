"use client";

import { Button, Card, Cursor, Divider, Footer, Icon } from "animal-island-ui";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { AnimaleseText } from "@/components/animalese-text";
import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import {
  applyChromaToFrame,
  colorToHex,
  hexToColor,
  pickColorAt,
  type ChromaConfig,
} from "./chroma";
import { decodeFile, type DecodedClip, type RGBAFrame } from "./decode";
import { encodeGif, encodeWebm, type ExportProgress } from "./encode";

const ACCEPTED_TYPES = ".gif,.webm,image/gif,video/webm";

type ExportFormat = "gif" | "webm";

function CheckerBackground({ size = 12 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 rounded-xl"
      style={{
        backgroundImage:
          "linear-gradient(45deg, #d0c6b0 25%, transparent 25%), linear-gradient(-45deg, #d0c6b0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d0c6b0 75%), linear-gradient(-45deg, transparent 75%, #d0c6b0 75%)",
        backgroundSize: `${size * 2}px ${size * 2}px`,
        backgroundPosition: `0 0, 0 ${size}px, ${size}px ${-size}px, ${-size}px 0`,
        backgroundColor: "#f3ead2",
      }}
    />
  );
}

export function GifEditor() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("GifEditor");

  const [clip, setClip] = useState<DecodedClip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [eyedropperMode, setEyedropperMode] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [transparentGif, setTransparentGif] = useState(true);
  const [chroma, setChroma] = useState<ChromaConfig>({
    color: 0x19c8b9,
    tolerance: 0.18,
    feather: 0.06,
  });
  const [trim, setTrim] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null,
  );
  const [downloadUrl, setDownloadUrl] = useState<{
    url: string;
    label: string;
    name: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Cache: processed frame data (chroma applied) for current frame index, to
  // avoid re-applying on each redraw when only viewport changes.
  const processedCache = useRef<Map<number, ImageData>>(new Map());
  const cacheKeyRef = useRef<string>("");

  useEffect(() => {
    processedCache.current.clear();
    cacheKeyRef.current = `${chroma.color}|${chroma.tolerance}|${chroma.feather}|${showOriginal}`;
  }, [chroma.color, chroma.tolerance, chroma.feather, showOriginal]);

  // Reset state on new clip
  useEffect(() => {
    if (!clip) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setFrameIndex(0);
    setTrim({ start: 0, end: clip.frames.length - 1 });
    setPlaying(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    processedCache.current.clear();
  }, [clip]);

  const drawFrame = useCallback(
    (idx: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !clip) return;
      const frame = clip.frames[idx];
      if (!frame) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== frame.width || canvas.height !== frame.height) {
        canvas.width = frame.width;
        canvas.height = frame.height;
      }

      if (showOriginal) {
        const img = new ImageData(
          new Uint8ClampedArray(frame.data),
          frame.width,
          frame.height,
        );
        ctx.clearRect(0, 0, frame.width, frame.height);
        ctx.putImageData(img, 0, 0);
        return;
      }

      const cached = processedCache.current.get(idx);
      if (cached) {
        ctx.clearRect(0, 0, frame.width, frame.height);
        ctx.putImageData(cached, 0, 0);
        return;
      }

      const processed = applyChromaToFrame(frame, chroma);
      const img = new ImageData(
        new Uint8ClampedArray(processed.data),
        frame.width,
        frame.height,
      );
      processedCache.current.set(idx, img);
      ctx.clearRect(0, 0, frame.width, frame.height);
      ctx.putImageData(img, 0, 0);
    },
    [clip, chroma, showOriginal],
  );

  // Playback loop
  useEffect(() => {
    if (!clip || !playing) return;
    const tick = (time: number) => {
      const current = frameIndexRef.current;
      const frame = clip.frames[current];
      if (!frame) return;
      const delay = frame.delayMs || 80;
      if (
        lastFrameTimeRef.current === 0 ||
        time - lastFrameTimeRef.current >= delay
      ) {
        lastFrameTimeRef.current = time;
        const trimRange = trimRef.current;
        const next =
          current + 1 > trimRange.end ? trimRange.start : current + 1;
        setFrameIndex(next);
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      lastFrameTimeRef.current = 0;
    };
  }, [clip, playing]);

  /* eslint-disable react-hooks/immutability */
  const frameIndexRef = useRef<number>(0);
  useEffect(() => {
    frameIndexRef.current = frameIndex;
  });
  const trimRef = useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  useEffect(() => {
    trimRef.current = trim;
  });
  /* eslint-enable react-hooks/immutability */

  // Render the current frame whenever it changes
  useEffect(() => {
    drawFrame(frameIndex);
  }, [frameIndex, drawFrame]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setClip(null);
    setDownloadUrl(null);
    try {
      const next = await decodeFile(file);
      setClip(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to decode this file.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!clip || !eyedropperMode) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const frame = clip.frames[frameIndex];
      const picked = pickColorAt(frame, x, y);
      setChroma((prev) => ({ ...prev, color: picked }));
      setEyedropperMode(false);
    },
    [clip, eyedropperMode, frameIndex],
  );

  const trimmedFrames = useMemo<RGBAFrame[]>(() => {
    if (!clip) return [];
    return clip.frames.slice(trim.start, trim.end + 1);
  }, [clip, trim.start, trim.end]);

  const processedFramesForExport = useCallback(() => {
    return trimmedFrames.map((f) =>
      showOriginal ? f : applyChromaToFrame(f, chroma),
    );
  }, [trimmedFrames, chroma, showOriginal]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!clip || exporting) return;
      setExporting(format);
      setExportProgress({ done: 0, total: trimmedFrames.length });
      setDownloadUrl(null);
      try {
        const frames = processedFramesForExport();
        const blob =
          format === "gif"
            ? await encodeGif(frames, {
                transparent: transparentGif && !showOriginal,
                onProgress: setExportProgress,
              })
            : await encodeWebm(frames, {
                onProgress: setExportProgress,
              });
        const url = URL.createObjectURL(blob);
        const ext = format === "gif" ? "gif" : "webm";
        setDownloadUrl({
          url,
          label: t("readyDownload"),
          name: `gif-editor-${Date.now()}.${ext}`,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Export failed.",
        );
      } finally {
        setExporting(null);
        setExportProgress(null);
      }
    },
    [
      clip,
      exporting,
      processedFramesForExport,
      showOriginal,
      t,
      transparentGif,
      trimmedFrames.length,
    ],
  );

  // Revoke download URL when replaced or unmounted
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl.url);
    };
  }, [downloadUrl]);

  const stats = clip
    ? {
        size: `${clip.width} × ${clip.height}`,
        frames: clip.frames.length,
        duration:
          (clip.frames.reduce((s, f) => s + f.delayMs, 0) / 1000).toFixed(
            1,
          ) + "s",
        source: clip.source.toUpperCase(),
      }
    : null;

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-5">
            <Card type="default" color="app-orange" className="p-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Icon name="icon-camera" size={64} bounce />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#b85f00]">
                      {t("tag")}
                    </p>
                    <AnimaleseText
                      as="h1"
                      text={t("title")}
                      cps={18}
                      pitch={0.95}
                      className="block text-balance text-3xl font-black leading-tight text-[#794f27] sm:text-4xl"
                    />
                  </div>
                </div>
                <p className="text-base font-bold leading-7 text-[#725d42]">
                  {t("description")}
                </p>
                <Divider type="wave-yellow" />
                <ul className="space-y-1 text-sm font-bold leading-6 text-[#725d42]">
                  <li>• {t("featureImport")}</li>
                  <li>• {t("featureChroma")}</li>
                  <li>• {t("featureTrim")}</li>
                  <li>• {t("featureExport")}</li>
                </ul>
                <p className="rounded-lg bg-white/70 p-3 text-xs font-bold leading-5 text-[#725d42]">
                  {t("hint")}
                </p>
              </div>
            </Card>

            {clip ? (
              <Card className="p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#b85f00]">
                  {t("clipStats")}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-[#725d42]">
                  <dt>{t("statSize")}</dt>
                  <dd className="text-right text-[#794f27]">{stats?.size}</dd>
                  <dt>{t("statFrames")}</dt>
                  <dd className="text-right text-[#794f27]">
                    {stats?.frames}
                  </dd>
                  <dt>{t("statDuration")}</dt>
                  <dd className="text-right text-[#794f27]">
                    {stats?.duration}
                  </dd>
                  <dt>{t("statSource")}</dt>
                  <dd className="text-right text-[#794f27]">{stats?.source}</dd>
                </dl>
              </Card>
            ) : null}
          </div>

          <div className="min-w-0 space-y-5">
            <Card color="app-orange" className="overflow-hidden p-4 sm:p-5">
              {!clip ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className="grid place-items-center rounded-2xl border-2 border-dashed border-[#b85f00]/60 bg-white/70 p-10 text-center"
                >
                  <div className="space-y-3">
                    <p className="text-lg font-black text-[#794f27]">
                      {t("uploadTitle")}
                    </p>
                    <p className="text-sm font-bold text-[#725d42]">
                      {t("uploadHint")}
                    </p>
                    <Button
                      type="primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {loading ? t("decoding") : t("pickFile")}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES}
                      className="hidden"
                      onChange={onFileInput}
                    />
                    {error ? (
                      <p className="text-xs font-bold text-[#c94444]">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-xl">
                    <div
                      className="relative w-full"
                      style={{
                        aspectRatio: `${clip.width} / ${clip.height}`,
                      }}
                    >
                      <CheckerBackground />
                      <canvas
                        ref={canvasRef}
                        onClick={onCanvasClick}
                        className={`relative h-full w-full ${eyedropperMode ? "cursor-crosshair" : ""}`}
                        style={{ imageRendering: "auto" }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="default"
                        onClick={() => setPlaying((p) => !p)}
                      >
                        {playing ? t("pause") : t("play")}
                      </Button>
                      <Button
                        type="default"
                        onClick={() => {
                          setClip(null);
                          setError(null);
                          setDownloadUrl(null);
                        }}
                      >
                        {t("clear")}
                      </Button>
                    </div>
                    <span className="rounded-lg bg-white/85 px-3 py-1 text-xs font-black text-[#794f27]">
                      {t("frameStatus", {
                        current: frameIndex + 1,
                        total: clip.frames.length,
                      })}
                    </span>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={0}
                      max={clip.frames.length - 1}
                      value={frameIndex}
                      onChange={(e) => {
                        setPlaying(false);
                        setFrameIndex(Number.parseInt(e.target.value, 10));
                      }}
                      className="w-full accent-[#ff8c00]"
                    />
                  </div>
                </div>
              )}
            </Card>

            {clip ? (
              <Card className="p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-black text-[#b85f00]">
                      {t("chromaTitle")}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorToHex(chroma.color)}
                        onChange={(e) =>
                          setChroma((prev) => ({
                            ...prev,
                            color: hexToColor(e.target.value),
                          }))
                        }
                        aria-label={t("chromaColor")}
                        className="h-10 w-12 cursor-pointer rounded-lg border-2 border-[#d4c9b4] bg-white"
                      />
                      <Button
                        type={eyedropperMode ? "primary" : "default"}
                        onClick={() => setEyedropperMode((v) => !v)}
                      >
                        {eyedropperMode
                          ? t("chromaEyedropperActive")
                          : t("chromaEyedropper")}
                      </Button>
                    </div>
                    <label className="block space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
                        <span>{t("chromaTolerance")}</span>
                        <span>{Math.round(chroma.tolerance * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={70}
                        value={Math.round(chroma.tolerance * 100)}
                        onChange={(e) =>
                          setChroma((prev) => ({
                            ...prev,
                            tolerance:
                              Number.parseInt(e.target.value, 10) / 100,
                          }))
                        }
                        className="w-full accent-[#ff8c00]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
                        <span>{t("chromaFeather")}</span>
                        <span>{Math.round(chroma.feather * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={Math.round(chroma.feather * 100)}
                        onChange={(e) =>
                          setChroma((prev) => ({
                            ...prev,
                            feather:
                              Number.parseInt(e.target.value, 10) / 100,
                          }))
                        }
                        className="w-full accent-[#ff8c00]"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-black text-[#7a6141]">
                      <input
                        type="checkbox"
                        checked={showOriginal}
                        onChange={(e) => setShowOriginal(e.target.checked)}
                        className="accent-[#ff8c00]"
                      />
                      {t("showOriginal")}
                    </label>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-black text-[#b85f00]">
                      {t("trimTitle")}
                    </p>
                    <label className="block space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
                        <span>{t("trimStart")}</span>
                        <span>{trim.start + 1}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={clip.frames.length - 1}
                        value={trim.start}
                        onChange={(e) => {
                          const v = Number.parseInt(e.target.value, 10);
                          setTrim((prev) => ({
                            start: v,
                            end: Math.max(v, prev.end),
                          }));
                        }}
                        className="w-full accent-[#ff8c00]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
                        <span>{t("trimEnd")}</span>
                        <span>{trim.end + 1}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={clip.frames.length - 1}
                        value={trim.end}
                        onChange={(e) => {
                          const v = Number.parseInt(e.target.value, 10);
                          setTrim((prev) => ({
                            start: Math.min(prev.start, v),
                            end: v,
                          }));
                        }}
                        className="w-full accent-[#ff8c00]"
                      />
                    </label>
                    <p className="text-xs font-bold text-[#725d42]">
                      {t("trimSummary", {
                        count: trim.end - trim.start + 1,
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-[#e3d6b8] pt-4">
                  <label className="flex items-center gap-2 text-xs font-black text-[#7a6141]">
                    <input
                      type="checkbox"
                      checked={transparentGif}
                      onChange={(e) => setTransparentGif(e.target.checked)}
                      className="accent-[#ff8c00]"
                    />
                    {t("transparentGif")}
                  </label>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                      type="default"
                      onClick={() => handleExport("webm")}
                    >
                      {exporting === "webm"
                        ? t("exporting")
                        : t("exportWebm")}
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => handleExport("gif")}
                    >
                      {exporting === "gif"
                        ? t("exporting")
                        : t("exportGif")}
                    </Button>
                  </div>
                </div>
                {exportProgress ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f4e7d8]">
                    <motion.div
                      animate={{
                        width: `${(exportProgress.done / Math.max(1, exportProgress.total)) * 100}%`,
                      }}
                      transition={{ duration: 0.1 }}
                      className="h-full bg-[#ff8c00]"
                    />
                  </div>
                ) : null}
                {downloadUrl ? (
                  <div className="mt-3 rounded-xl border-2 border-[#19c8b9]/60 bg-[#dcfbf7] p-3 text-center text-sm font-black text-[#00766d]">
                    <a
                      href={downloadUrl.url}
                      download={downloadUrl.name}
                      className="inline-flex items-center gap-2"
                    >
                      {downloadUrl.label}
                      <span aria-hidden>↓</span>
                    </a>
                  </div>
                ) : null}
                {error ? (
                  <p className="mt-3 text-xs font-bold text-[#c94444]">
                    {error}
                  </p>
                ) : null}
              </Card>
            ) : null}
          </div>
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}
