"use client";

/* eslint-disable @next/next/no-img-element */
import { Button, Card, Cursor, Divider, Footer, Icon } from "animal-island-ui";
import jsQR from "jsqr";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import {
  buildAllBatchesZip,
  buildBatchPdf,
  downloadBlob,
  LAYOUT_OPTIONS,
  type ExportProgress,
  type LayoutMode,
} from "./export-pdf";
import {
  batchRange,
  DEFAULT_BATCH_SIZE,
  DEFAULT_CHUNK_SIZE,
  MAX_BATCH_SIZE,
  MAX_FILE_SIZE,
  MIN_BATCH_SIZE,
  PROTOCOL,
  type BatchMeta,
  type Chunk,
  type FileFinal,
  type FileMeta,
  type Packet,
} from "./protocol";

type Mode = "send" | "receive";

const QR_OPTIONS = {
  errorCorrectionLevel: "L",
  margin: 4,
  scale: 8,
} as const;

type ReceivedFile = {
  meta: FileMeta;
  blob: Blob;
  url: string;
};
type NativeBarcodeDetector = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};
type NativeBarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => NativeBarcodeDetector;

function bytesToBase64(bytes: Uint8Array) {
  const batchSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += batchSize) {
    const batch = bytes.subarray(i, i + batchSize);
    binary += String.fromCharCode(...batch);
  }

  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function sha256Hex(bytes: Uint8Array) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function getFileKind(mime: string, name: string) {
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }
  if (mime.startsWith("text/") || /\.(json|md|csv|txt|log)$/i.test(name)) {
    return "text";
  }

  return "binary";
}

function createSessionId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

function parsePacket(rawValue: string): Packet | null {
  try {
    const packet = JSON.parse(rawValue) as Partial<Packet>;

    if (packet.protocol !== PROTOCOL) {
      return null;
    }

    if (packet.type === "file-meta" && typeof packet.id === "string") {
      return packet as FileMeta;
    }

    if (
      packet.type === "batch-meta" &&
      typeof packet.id === "string" &&
      typeof packet.batchIndex === "number"
    ) {
      return packet as BatchMeta;
    }

    if (
      packet.type === "chunk" &&
      typeof packet.id === "string" &&
      typeof packet.index === "number" &&
      typeof packet.batchIndex === "number" &&
      typeof packet.data === "string"
    ) {
      return packet as Chunk;
    }

    if (
      packet.type === "batch-final" &&
      typeof packet.id === "string" &&
      typeof packet.batchIndex === "number"
    ) {
      return packet as Packet;
    }

    if (
      packet.type === "file-final" &&
      typeof packet.id === "string" &&
      typeof packet.checksum === "string"
    ) {
      return packet as FileFinal;
    }
  } catch {
    return null;
  }

  return null;
}

function clampFrameMs(value: number) {
  return Math.min(1200, Math.max(120, value));
}

function clampInt(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clampBatchSize(value: number) {
  return clampInt(value, MIN_BATCH_SIZE, MAX_BATCH_SIZE);
}

export function QrFileBeam() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("QrFileBeam");

  const [mode, setMode] = useState<Mode>("send");

  // Sender state
  const [file, setFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [allChunks, setAllChunks] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [frameInBatch, setFrameInBatch] = useState(0);
  const [prepareError, setPrepareError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [frameMs, setFrameMs] = useState(280);
  const [isPlaying, setIsPlaying] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Receiver state
  const [receivedFileMeta, setReceivedFileMeta] = useState<FileMeta | null>(
    null,
  );
  const [archivedParts, setArchivedParts] = useState<
    (Uint8Array | undefined)[]
  >([]);
  const [archivedSet, setArchivedSet] = useState<Set<number>>(
    () => new Set(),
  );
  const [pendingChunks, setPendingChunks] = useState<Map<number, string>>(
    () => new Map(),
  );
  const [latestBatchMeta, setLatestBatchMeta] = useState<BatchMeta | null>(
    null,
  );
  const [receivedFileFinal, setReceivedFileFinal] =
    useState<FileFinal | null>(null);
  const [receivedFile, setReceivedFile] = useState<ReceivedFile | null>(null);
  const [scanStatus, setScanStatus] = useState(t("idleScanner"));
  const [isScanning, setIsScanning] = useState(false);

  // PDF export state
  const [pdfLayout, setPdfLayout] = useState<LayoutMode>("3x3");
  const [exportState, setExportState] = useState<
    | { kind: "idle" }
    | { kind: "running"; label: string; progress: ExportProgress | null }
    | { kind: "error"; message: string }
    | { kind: "done"; message: string }
  >({ kind: "idle" });
  const exportAbortRef = useRef<AbortController | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<NativeBarcodeDetector | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const scanFrameRef = useRef<(() => void) | null>(null);
  const lastScanAtRef = useRef(0);

  // Effective fileMeta accounting for the user-adjustable batchSize.
  const effectiveFileMeta = useMemo<FileMeta | null>(() => {
    if (!fileMeta) {
      return null;
    }

    const totalBatches = Math.max(1, Math.ceil(fileMeta.totalChunks / batchSize));

    if (totalBatches === fileMeta.totalBatches && batchSize === fileMeta.batchSize) {
      return fileMeta;
    }

    return { ...fileMeta, totalBatches, batchSize };
  }, [batchSize, fileMeta]);

  const totalBatches = effectiveFileMeta?.totalBatches ?? 0;
  const clampedBatchIndex = totalBatches > 0
    ? clampInt(currentBatchIndex, 0, totalBatches - 1)
    : 0;
  const currentBatch = useMemo(() => {
    if (!effectiveFileMeta) {
      return null;
    }

    return {
      ...batchRange(clampedBatchIndex, batchSize, effectiveFileMeta.totalChunks),
      batchIndex: clampedBatchIndex,
      batchTotal: totalBatches,
    };
  }, [batchSize, clampedBatchIndex, effectiveFileMeta, totalBatches]);

  // Build the packet sequence for the current batch.
  const batchFrames = useMemo<Packet[]>(() => {
    if (!effectiveFileMeta || !currentBatch) {
      return [];
    }

    const frames: Packet[] = [];
    frames.push(effectiveFileMeta);
    frames.push({
      protocol: PROTOCOL,
      type: "batch-meta",
      id: effectiveFileMeta.id,
      batchIndex: currentBatch.batchIndex,
      batchTotal: currentBatch.batchTotal,
      chunkStart: currentBatch.chunkStart,
      chunkCount: currentBatch.chunkCount,
    });

    for (let i = 0; i < currentBatch.chunkCount; i += 1) {
      const globalIndex = currentBatch.chunkStart + i;
      frames.push({
        protocol: PROTOCOL,
        type: "chunk",
        id: effectiveFileMeta.id,
        batchIndex: currentBatch.batchIndex,
        index: globalIndex,
        data: allChunks[globalIndex] ?? "",
      });
    }

    frames.push({
      protocol: PROTOCOL,
      type: "batch-final",
      id: effectiveFileMeta.id,
      batchIndex: currentBatch.batchIndex,
      chunkStart: currentBatch.chunkStart,
      chunkCount: currentBatch.chunkCount,
    });

    if (currentBatch.batchIndex === currentBatch.batchTotal - 1) {
      frames.push({
        protocol: PROTOCOL,
        type: "file-final",
        id: effectiveFileMeta.id,
        totalChunks: effectiveFileMeta.totalChunks,
        totalBatches: effectiveFileMeta.totalBatches,
        checksum: effectiveFileMeta.checksum,
        size: effectiveFileMeta.size,
      });
    }

    return frames;
  }, [allChunks, currentBatch, effectiveFileMeta]);

  const totalFramesInBatch = batchFrames.length;
  const safeFrameInBatch =
    totalFramesInBatch > 0 ? Math.min(frameInBatch, totalFramesInBatch - 1) : 0;
  const currentPacket = batchFrames[safeFrameInBatch] ?? null;

  const batchProgress =
    totalFramesInBatch > 0
      ? Math.round(((safeFrameInBatch + 1) / totalFramesInBatch) * 100)
      : 0;

  const currentFrameKind = useMemo(() => {
    if (!currentPacket) {
      return "";
    }

    switch (currentPacket.type) {
      case "file-meta":
        return t("kindFileMeta");
      case "batch-meta":
        return t("kindBatchMeta", { batch: currentPacket.batchIndex + 1 });
      case "chunk":
        return t("kindChunk", { index: currentPacket.index });
      case "batch-final":
        return t("kindBatchFinal", { batch: currentPacket.batchIndex + 1 });
      case "file-final":
        return t("kindFileFinal");
      default:
        return "";
    }
  }, [currentPacket, t]);

  const jumpToBatch = useCallback(
    (updater: number | ((current: number) => number)) => {
      setCurrentBatchIndex((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const ceiling = Math.max(0, totalBatches - 1);
        return clampInt(next, 0, ceiling);
      });
      setFrameInBatch(0);
    },
    [totalBatches],
  );

  // Render QR for the current packet.
  useEffect(() => {
    if (!currentPacket) {
      return;
    }

    let active = true;

    QRCode.toDataURL(JSON.stringify(currentPacket), QR_OPTIONS)
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (active) {
          setPrepareError(t("qrError"));
        }
      });

    return () => {
      active = false;
    };
  }, [currentPacket, t]);

  // Auto-play loop within the current batch.
  useEffect(() => {
    if (!isPlaying || totalFramesInBatch === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrameInBatch((current) => (current + 1) % totalFramesInBatch);
    }, frameMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [frameMs, isPlaying, totalFramesInBatch]);

  // Clean up scanner on unmount.
  const stopScanner = useCallback(() => {
    if (scanRafRef.current !== null) {
      window.cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      if (receivedFile) {
        URL.revokeObjectURL(receivedFile.url);
      }
    };
  }, [receivedFile]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setPrepareError("");
    setFile(selectedFile);
    setFileMeta(null);
    setAllChunks([]);
    setCurrentBatchIndex(0);
    setFrameInBatch(0);
    setIsPlaying(false);

    if (!selectedFile) {
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setPrepareError(t("fileTooLarge", { size: formatBytes(MAX_FILE_SIZE) }));
      return;
    }

    setIsPreparing(true);

    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const checksum = await sha256Hex(bytes);
      const base64 = bytesToBase64(bytes);
      const slicedChunks = base64.match(
        new RegExp(`.{1,${DEFAULT_CHUNK_SIZE}}`, "g"),
      ) ?? [""];

      const totalChunks = slicedChunks.length;
      const totalBatchesComputed = Math.max(
        1,
        Math.ceil(totalChunks / batchSize),
      );

      setAllChunks(slicedChunks);
      setFileMeta({
        protocol: PROTOCOL,
        type: "file-meta",
        id: createSessionId(selectedFile),
        name: selectedFile.name,
        mime: selectedFile.type || "application/octet-stream",
        size: selectedFile.size,
        totalChunks,
        totalBatches: totalBatchesComputed,
        batchSize,
        chunkSize: DEFAULT_CHUNK_SIZE,
        encoding: "base64",
        checksum,
        checksumAlgorithm: "SHA-256",
        createdAt: Date.now(),
      });
    } catch {
      setPrepareError(t("readError"));
    } finally {
      setIsPreparing(false);
    }
  }

  function resetReceiver() {
    if (receivedFile) {
      URL.revokeObjectURL(receivedFile.url);
    }

    setReceivedFileMeta(null);
    setArchivedParts([]);
    setArchivedSet(new Set());
    setPendingChunks(new Map());
    setLatestBatchMeta(null);
    setReceivedFileFinal(null);
    setReceivedFile(null);
    setScanStatus(t("idleScanner"));
  }

  const handlePacket = useCallback(
    (packet: Packet) => {
      if (packet.type === "file-meta") {
        setReceivedFileMeta((current) => {
          if (
            current?.id === packet.id &&
            current.totalBatches === packet.totalBatches &&
            current.batchSize === packet.batchSize
          ) {
            return current;
          }

          // New transfer (or batch layout changed) — reset receiver buffers.
          setArchivedParts([]);
          setArchivedSet(new Set());
          setPendingChunks(new Map());
          setLatestBatchMeta(null);
          setReceivedFileFinal(null);
          setReceivedFile((prev) => {
            if (prev) {
              URL.revokeObjectURL(prev.url);
            }
            return null;
          });

          return packet;
        });
        setScanStatus(
          t("fileMetaScanned", {
            name: packet.name,
            batches: packet.totalBatches,
          }),
        );
        return;
      }

      if (packet.type === "batch-meta") {
        setReceivedFileMeta((meta) => {
          if (!meta || meta.id !== packet.id) {
            return meta;
          }
          setLatestBatchMeta(packet);
          setScanStatus(
            t("batchMetaScanned", {
              batch: packet.batchIndex + 1,
              total: packet.batchTotal,
              count: packet.chunkCount,
            }),
          );
          return meta;
        });
        return;
      }

      if (packet.type === "chunk") {
        setReceivedFileMeta((meta) => {
          if (!meta || meta.id !== packet.id) {
            return meta;
          }

          setArchivedSet((archived) => {
            if (archived.has(packet.batchIndex)) {
              return archived;
            }
            setPendingChunks((current) => {
              if (current.has(packet.index)) {
                return current;
              }
              const next = new Map(current);
              next.set(packet.index, packet.data);
              return next;
            });
            return archived;
          });

          return meta;
        });
        return;
      }

      if (packet.type === "batch-final") {
        setReceivedFileMeta((meta) => {
          if (!meta || meta.id !== packet.id) {
            return meta;
          }

          const range = batchRange(
            packet.batchIndex,
            meta.batchSize,
            meta.totalChunks,
          );

          // Prefer the start/count carried by the packet (covers edge cases
          // where the sender adjusted the batch layout for the last batch).
          const chunkStart =
            typeof packet.chunkStart === "number"
              ? packet.chunkStart
              : range.chunkStart;
          const chunkCount =
            typeof packet.chunkCount === "number"
              ? packet.chunkCount
              : range.chunkCount;

          setPendingChunks((pending) => {
            const indexes = Array.from(
              { length: chunkCount },
              (_, i) => chunkStart + i,
            );
            const parts: string[] = [];
            for (const idx of indexes) {
              const value = pending.get(idx);
              if (value === undefined) {
                setScanStatus(
                  t("waitingBatch", {
                    batch: packet.batchIndex + 1,
                    missing: indexes.filter((i) => !pending.has(i)).length,
                  }),
                );
                return pending;
              }
              parts.push(value);
            }

            const bytes = base64ToBytes(parts.join(""));

            setArchivedParts((prev) => {
              const next = [...prev];
              while (next.length <= packet.batchIndex) {
                next.push(undefined);
              }
              next[packet.batchIndex] = bytes;
              return next;
            });
            setArchivedSet((prev) => {
              if (prev.has(packet.batchIndex)) {
                return prev;
              }
              const next = new Set(prev);
              next.add(packet.batchIndex);
              return next;
            });

            const cleared = new Map(pending);
            for (const idx of indexes) {
              cleared.delete(idx);
            }

            const isLastBatch =
              packet.batchIndex === meta.totalBatches - 1;
            setScanStatus(
              isLastBatch
                ? t("lastBatchArchived")
                : t("batchArchived", {
                    batch: packet.batchIndex + 1,
                    total: meta.totalBatches,
                  }),
            );

            return cleared;
          });

          return meta;
        });
        return;
      }

      if (packet.type === "file-final") {
        setReceivedFileMeta((meta) => {
          if (!meta || meta.id !== packet.id) {
            return meta;
          }
          setReceivedFileFinal(packet);
          return meta;
        });
        return;
      }
    },
    [t],
  );

  // Once all batches are archived and the file-final packet is in, assemble
  // and verify the full file.
  useEffect(() => {
    if (!receivedFileMeta || !receivedFileFinal) {
      return;
    }
    if (archivedSet.size !== receivedFileMeta.totalBatches) {
      return;
    }

    const parts: Uint8Array[] = [];
    for (let i = 0; i < receivedFileMeta.totalBatches; i += 1) {
      const part = archivedParts[i];
      if (!part) {
        return;
      }
      parts.push(part);
    }

    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.length;
    }

    let active = true;

    sha256Hex(merged).then((checksum) => {
      if (!active) {
        return;
      }

      if (
        checksum !== receivedFileMeta.checksum ||
        receivedFileFinal.checksum !== receivedFileMeta.checksum ||
        merged.length !== receivedFileMeta.size
      ) {
        setScanStatus(t("checksumFailed"));
        return;
      }

      const blob = new Blob([merged], { type: receivedFileMeta.mime });
      const url = URL.createObjectURL(blob);
      setReceivedFile((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
        }
        return { meta: receivedFileMeta, blob, url };
      });
      setScanStatus(t("completeWithFinal"));
    });

    return () => {
      active = false;
    };
  }, [archivedParts, archivedSet, receivedFileFinal, receivedFileMeta, t]);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      scanRafRef.current = window.requestAnimationFrame(() => {
        scanFrameRef.current?.();
      });
      return;
    }

    const now = performance.now();

    // Light throttle: jsQR already self-rate-limits via its sync cost (~30-50ms
    // per call), but BarcodeDetector can hit 60Hz and burn CPU for no extra
    // hit-rate gain. Cap to ~33Hz which still gives ~9 scans per 280ms frame.
    if (now - lastScanAtRef.current < 30) {
      scanRafRef.current = window.requestAnimationFrame(() => {
        scanFrameRef.current?.();
      });
      return;
    }

    lastScanAtRef.current = now;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      if (detectorRef.current) {
        const results = await detectorRef.current.detect(canvas);
        const packet = parsePacket(results[0]?.rawValue ?? "");

        if (packet) {
          handlePacket(packet);
        }
      } else {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        const packet = parsePacket(result?.data ?? "");

        if (packet) {
          handlePacket(packet);
        }
      }
    } catch {
      setScanStatus(t("scanError"));
    }

    scanRafRef.current = window.requestAnimationFrame(() => {
      scanFrameRef.current?.();
    });
  }, [handlePacket, t]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  async function startScanner() {
    resetReceiver();
    setScanStatus(t("cameraStarting"));

    try {
      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: NativeBarcodeDetectorConstructor;
        }
      ).BarcodeDetector;

      detectorRef.current = BarcodeDetectorCtor
        ? new BarcodeDetectorCtor({ formats: ["qr_code"] })
        : null;

      // focusMode / exposureMode / whiteBalanceMode are part of the
      // image-capture spec extension to MediaTrackConstraints and not yet in
      // lib.dom; cast through unknown so the constraint object passes through.
      const videoConstraints = {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
        // Advanced constraints are best-effort; unsupported entries are
        // ignored silently rather than rejecting the whole getUserMedia.
        advanced: [
          { focusMode: "continuous" },
          { exposureMode: "continuous" },
          { whiteBalanceMode: "continuous" },
        ],
      } as unknown as MediaTrackConstraints;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Try to apply continuous focus after the track is live, in case the
      // initial constraints didn't take effect.
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (
          track as unknown as {
            getCapabilities?: () => Record<string, unknown>;
          }
        ).getCapabilities?.();
        const supportsContinuousFocus = Array.isArray(
          capabilities?.focusMode,
        )
          ? (capabilities.focusMode as string[]).includes("continuous")
          : false;
        if (supportsContinuousFocus) {
          try {
            await track.applyConstraints({
              advanced: [{ focusMode: "continuous" }],
            } as unknown as MediaTrackConstraints);
          } catch {
            // ignore — best-effort
          }
        }
      }

      setIsScanning(true);
      setScanStatus(t("scanning"));
      scanRafRef.current = window.requestAnimationFrame(() => {
        scanFrameRef.current?.();
      });
    } catch {
      stopScanner();
      setScanStatus(t("cameraError"));
    }
  }

  function renderPreview(result: ReceivedFile) {
    const kind = getFileKind(result.meta.mime, result.meta.name);

    if (kind === "image") {
      return (
        <img
          src={result.url}
          alt={result.meta.name}
          className="max-h-80 w-full rounded-lg border-2 border-[#d4c9b4] bg-white object-contain"
        />
      );
    }

    if (kind === "video") {
      return (
        <video
          src={result.url}
          controls
          className="max-h-80 w-full rounded-lg border-2 border-[#d4c9b4] bg-black"
        />
      );
    }

    if (kind === "audio") {
      return <audio src={result.url} controls className="w-full" />;
    }

    if (kind === "text") {
      return (
        <iframe
          src={result.url}
          title={result.meta.name}
          className="h-72 w-full rounded-lg border-2 border-[#d4c9b4] bg-white"
        />
      );
    }

    return (
      <div className="rounded-lg border-2 border-dashed border-[#d4c9b4] bg-white/70 p-6 text-center text-sm font-black text-[#8a7b66]">
        {t("noPreview")}
      </div>
    );
  }

  async function runExport(
    label: string,
    task: (signal: AbortSignal) => Promise<{ blob: Blob; filename: string }>,
  ) {
    exportAbortRef.current?.abort();
    const ac = new AbortController();
    exportAbortRef.current = ac;
    setExportState({ kind: "running", label, progress: null });

    try {
      const { blob, filename } = await task(ac.signal);
      if (ac.signal.aborted) {
        return;
      }
      downloadBlob(blob, filename);
      setExportState({
        kind: "done",
        message: t("exportDone", { filename }),
      });
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        setExportState({ kind: "idle" });
        return;
      }
      const message =
        error instanceof Error ? error.message : String(error);
      setExportState({ kind: "error", message });
    } finally {
      if (exportAbortRef.current === ac) {
        exportAbortRef.current = null;
      }
    }
  }

  function exportCurrentBatch() {
    if (!effectiveFileMeta || !currentBatch) {
      return;
    }
    const targetBatch = currentBatch.batchIndex;
    void runExport(
      t("exportingBatch", { batch: targetBatch + 1 }),
      (signal) =>
        buildBatchPdf(effectiveFileMeta, allChunks, targetBatch, {
          layout: pdfLayout,
          signal,
          onProgress: (progress) =>
            setExportState((current) =>
              current.kind === "running"
                ? { ...current, progress }
                : current,
            ),
        }),
    );
  }

  function exportAllBatches() {
    if (!effectiveFileMeta) {
      return;
    }
    void runExport(t("exportingAll"), (signal) =>
      buildAllBatchesZip(effectiveFileMeta, allChunks, {
        layout: pdfLayout,
        signal,
        onProgress: (progress) =>
          setExportState((current) =>
            current.kind === "running"
              ? { ...current, progress }
              : current,
          ),
      }),
    );
  }

  function cancelExport() {
    exportAbortRef.current?.abort();
  }

  const isExporting = exportState.kind === "running";

  const archivedCount = archivedSet.size;
  const pendingCount = pendingChunks.size;
  const expectedBatchChunks = latestBatchMeta?.chunkCount ?? 0;
  const currentBatchProgress = expectedBatchChunks
    ? Math.min(100, Math.round((pendingCount / expectedBatchChunks) * 100))
    : 0;
  const overallProgress = receivedFileMeta
    ? Math.round((archivedCount / receivedFileMeta.totalBatches) * 100)
    : 0;
  const missingInBatch = useMemo(() => {
    if (!receivedFileMeta || !latestBatchMeta) {
      return [];
    }
    if (archivedSet.has(latestBatchMeta.batchIndex)) {
      return [];
    }
    const indexes = Array.from(
      { length: latestBatchMeta.chunkCount },
      (_, i) => latestBatchMeta.chunkStart + i,
    );
    return indexes.filter((i) => !pendingChunks.has(i));
  }, [archivedSet, latestBatchMeta, pendingChunks, receivedFileMeta]);

  const lastFrameIndex = Math.max(totalFramesInBatch - 1, 0);
  const lastBatchIndex = Math.max(totalBatches - 1, 0);

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
            <Card type="default" color="app-teal" className="p-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Icon name="icon-camera" size={64} bounce />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                      QR file beam
                    </p>
                    <h1 className="text-balance text-3xl font-black leading-tight text-[#794f27] sm:text-4xl">
                      {t("title")}
                    </h1>
                  </div>
                </div>
                <p className="text-base font-bold leading-7 text-[#725d42]">
                  {t("description")}
                </p>
                <Divider type="wave-yellow" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xl font-black text-[#19c8b9]">
                      {formatBytes(MAX_FILE_SIZE)}
                    </p>
                    <p className="text-xs font-black text-[#8a7b66]">
                      {t("maxFile")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xl font-black text-[#19c8b9]">
                      {batchSize}
                    </p>
                    <p className="text-xs font-black text-[#8a7b66]">
                      {t("batchUnit")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xl font-black text-[#19c8b9]">
                      {frameMs}ms
                    </p>
                    <p className="text-xs font-black text-[#8a7b66]">
                      {t("frameDelay")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`rounded-lg border-2 px-4 py-3 text-sm font-black transition ${
                  mode === "send"
                    ? "border-[#19c8b9] bg-[#e6f9f6] text-[#00766d]"
                    : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
                }`}
                onClick={() => setMode("send")}
              >
                {t("sendMode")}
              </button>
              <button
                type="button"
                className={`rounded-lg border-2 px-4 py-3 text-sm font-black transition ${
                  mode === "receive"
                    ? "border-[#19c8b9] bg-[#e6f9f6] text-[#00766d]"
                    : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
                }`}
                onClick={() => setMode("receive")}
              >
                {t("receiveMode")}
              </button>
            </div>
          </div>

          {mode === "send" ? (
            <Card color="warm-peach-pink" className="min-w-0 p-5 sm:p-6">
              <div className="grid gap-5">
                <div className="grid gap-3">
                  <label className="text-sm font-black text-[#794f27]">
                    {t("selectFile")}
                  </label>
                  <input
                    type="file"
                    className="w-full rounded-lg border-2 border-[#c4b89e] bg-[#f8f8f0] p-3 text-sm font-bold text-[#725d42]"
                    onChange={handleFileChange}
                  />
                  <label className="grid gap-2 rounded-lg bg-white/70 p-4 text-sm font-black text-[#794f27]">
                    <span className="flex items-center justify-between gap-3">
                      {t("batchSizeLabel")}
                      <span className="text-xs font-black text-[#8a7b66]">
                        {batchSize} {t("batchUnit")}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={MIN_BATCH_SIZE}
                      max={MAX_BATCH_SIZE}
                      step="10"
                      value={batchSize}
                      className="w-full accent-[#19c8b9]"
                      onChange={(event) => {
                        setBatchSize(clampBatchSize(Number(event.target.value)));
                        jumpToBatch(0);
                      }}
                    />
                    <span className="text-xs font-bold leading-5 text-[#8a7b66]">
                      {t("batchSizeHelp")}
                    </span>
                  </label>
                  {prepareError ? (
                    <p className="text-sm font-black text-[#e05a5a]">
                      {prepareError}
                    </p>
                  ) : null}
                </div>

                {file && effectiveFileMeta && currentBatch ? (
                  <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-start">
                    <div className="grid justify-items-center gap-3">
                      <div className="grid aspect-square w-full max-w-[320px] place-items-center rounded-lg border-4 border-[#794f27] bg-white p-3">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt={t("qrAlt")}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <p className="text-sm font-black text-[#8a7b66]">
                            {t("generating")}
                          </p>
                        )}
                      </div>
                      <div className="h-3 w-full max-w-[320px] overflow-hidden rounded-full bg-white/80">
                        <div
                          className="h-full rounded-full bg-[#19c8b9]"
                          style={{ width: `${batchProgress}%` }}
                        />
                      </div>
                      <p className="text-sm font-black text-[#725d42]">
                        {t("batchCounter", {
                          current: currentBatch.batchIndex + 1,
                          total: currentBatch.batchTotal,
                        })}
                      </p>
                      <p className="text-xs font-bold text-[#8a7b66]">
                        {t("frameCounter", {
                          index: safeFrameInBatch,
                          last: lastFrameIndex,
                        })}
                      </p>
                    </div>

                    <div className="grid min-w-0 content-start gap-4">
                      <div className="rounded-lg bg-white/70 p-4">
                        <p className="break-all text-lg font-black leading-snug text-[#794f27]">
                          {file.name}
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
                          {formatBytes(file.size)} ·{" "}
                          {file.type || "application/octet-stream"} ·{" "}
                          {t("chunkCount", {
                            total: effectiveFileMeta.totalChunks,
                          })}{" "}
                          ·{" "}
                          {t("batchSummary", {
                            total: effectiveFileMeta.totalBatches,
                          })}
                        </p>
                        <p className="mt-2 break-all text-xs font-bold leading-5 text-[#8a7b66]">
                          {t("checksum")}: {effectiveFileMeta.checksum}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="primary"
                          disabled={isPreparing}
                          onClick={() => setIsPlaying((current) => !current)}
                        >
                          {isPlaying ? t("pause") : t("play")}
                        </Button>
                        <Button
                          type="default"
                          onClick={() => setFrameInBatch(0)}
                        >
                          {t("firstFrame")}
                        </Button>
                        <Button
                          type="default"
                          onClick={() =>
                            setFrameInBatch((current) =>
                              totalFramesInBatch === 0
                                ? 0
                                : current === 0
                                  ? totalFramesInBatch - 1
                                  : current - 1,
                            )
                          }
                        >
                          {t("prevFrame")}
                        </Button>
                        <Button
                          type="default"
                          onClick={() =>
                            setFrameInBatch((current) =>
                              totalFramesInBatch === 0
                                ? 0
                                : (current + 1) % totalFramesInBatch,
                            )
                          }
                        >
                          {t("nextFrame")}
                        </Button>
                      </div>

                      <div className="grid gap-3 rounded-lg bg-white/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm font-black text-[#794f27]">
                            {t("batchNav")}
                          </span>
                          <span className="text-xs font-black text-[#8a7b66]">
                            {t("batchCounter", {
                              current: currentBatch.batchIndex + 1,
                              total: currentBatch.batchTotal,
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="default"
                            disabled={currentBatch.batchIndex === 0}
                            onClick={() => jumpToBatch(0)}
                          >
                            {t("firstBatch")}
                          </Button>
                          <Button
                            type="default"
                            disabled={currentBatch.batchIndex === 0}
                            onClick={() =>
                              jumpToBatch((current) => Math.max(0, current - 1))
                            }
                          >
                            {t("prevBatch")}
                          </Button>
                          <Button
                            type="primary"
                            disabled={
                              currentBatch.batchIndex >=
                              currentBatch.batchTotal - 1
                            }
                            onClick={() =>
                              jumpToBatch((current) =>
                                Math.min(lastBatchIndex, current + 1),
                              )
                            }
                          >
                            {t("nextBatch")}
                          </Button>
                        </div>
                        <input
                          aria-label={t("batchSlider")}
                          type="range"
                          min="0"
                          max={lastBatchIndex}
                          step="1"
                          value={currentBatch.batchIndex}
                          className="w-full accent-[#19c8b9]"
                          onChange={(event) =>
                            jumpToBatch(
                              clampInt(
                                Number(event.target.value),
                                0,
                                lastBatchIndex,
                              ),
                            )
                          }
                        />
                      </div>

                      <div className="grid gap-3 rounded-lg bg-white/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="text-sm font-black text-[#794f27]">
                            {t("frameIndexLabel")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={lastFrameIndex}
                            value={safeFrameInBatch}
                            className="h-10 w-24 rounded-lg border-2 border-[#c4b89e] bg-[#f8f8f0] px-3 text-right text-sm font-black text-[#725d42]"
                            onChange={(event) =>
                              setFrameInBatch(
                                clampInt(
                                  Number(event.target.value),
                                  0,
                                  lastFrameIndex,
                                ),
                              )
                            }
                          />
                        </div>
                        <input
                          aria-label={t("frameSlider")}
                          type="range"
                          min="0"
                          max={lastFrameIndex}
                          step="1"
                          value={safeFrameInBatch}
                          className="w-full accent-[#19c8b9]"
                          onChange={(event) =>
                            setFrameInBatch(
                              clampInt(
                                Number(event.target.value),
                                0,
                                lastFrameIndex,
                              ),
                            )
                          }
                        />
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-black text-[#8a7b66]">
                          <span>
                            {t("firstFrame")}: 0
                          </span>
                          <span className="text-[#00766d]">
                            {currentFrameKind}
                          </span>
                          <span>
                            {t("lastFrame")}: {lastFrameIndex}
                          </span>
                        </div>
                      </div>

                      <label className="grid gap-2 rounded-lg bg-white/70 p-4 text-sm font-black text-[#794f27]">
                        <span className="flex items-center justify-between gap-3">
                          {t("speed")}
                          <span className="text-xs font-black text-[#8a7b66]">
                            {frameMs}ms
                          </span>
                        </span>
                        <input
                          type="range"
                          min="120"
                          max="1200"
                          step="20"
                          value={frameMs}
                          className="w-full accent-[#19c8b9]"
                          onChange={(event) =>
                            setFrameMs(clampFrameMs(Number(event.target.value)))
                          }
                        />
                      </label>

                      <div className="grid gap-3 rounded-lg bg-white/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm font-black text-[#794f27]">
                            {t("exportPdfTitle")}
                          </span>
                          <span className="text-xs font-black text-[#8a7b66]">
                            {pdfLayout} · {t("perPage", {
                              count:
                                pdfLayout === "1x1"
                                  ? 1
                                  : pdfLayout === "2x2"
                                    ? 4
                                    : pdfLayout === "3x3"
                                      ? 9
                                      : 16,
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {LAYOUT_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              disabled={isExporting}
                              onClick={() => setPdfLayout(option)}
                              className={`rounded-lg border-2 px-2 py-2 text-sm font-black transition disabled:opacity-50 ${
                                pdfLayout === option
                                  ? "border-[#19c8b9] bg-[#e6f9f6] text-[#00766d]"
                                  : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="primary"
                            disabled={isExporting}
                            onClick={exportCurrentBatch}
                          >
                            {t("exportCurrentBatch")}
                          </Button>
                          <Button
                            type="default"
                            disabled={
                              isExporting ||
                              !effectiveFileMeta ||
                              effectiveFileMeta.totalBatches < 2
                            }
                            onClick={exportAllBatches}
                          >
                            {t("exportAllBatchesZip")}
                          </Button>
                        </div>
                        {exportState.kind === "running" ? (
                          <div className="grid gap-2">
                            <p className="text-xs font-bold leading-5 text-[#725d42]">
                              {exportState.label}
                              {exportState.progress
                                ? ` · ${t("exportProgress", {
                                    batch:
                                      exportState.progress.batchIndex + 1,
                                    batchTotal:
                                      exportState.progress.batchTotal,
                                    frame:
                                      exportState.progress.frameInBatch,
                                    frameTotal:
                                      exportState.progress.frameTotal,
                                  })}`
                                : ""}
                            </p>
                            <Button type="default" onClick={cancelExport}>
                              {t("exportCancel")}
                            </Button>
                          </div>
                        ) : null}
                        {exportState.kind === "done" ? (
                          <p className="break-all text-xs font-bold leading-5 text-[#00766d]">
                            {exportState.message}
                          </p>
                        ) : null}
                        {exportState.kind === "error" ? (
                          <p className="break-all text-xs font-bold leading-5 text-[#e05a5a]">
                            {exportState.message}
                          </p>
                        ) : null}
                        <p className="text-xs font-bold leading-5 text-[#8a7b66]">
                          {t("exportPdfHelp")}
                        </p>
                      </div>

                      <p className="rounded-lg bg-[#fffdf2] p-4 text-sm font-bold leading-6 text-[#725d42]">
                        {t("senderHint")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid min-h-80 place-items-center rounded-lg border-2 border-dashed border-[#d4c9b4] bg-white/60 p-6 text-center">
                    <p className="max-w-md text-base font-black leading-7 text-[#8a7b66]">
                      {isPreparing ? t("preparing") : t("emptySender")}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card color="app-blue" className="min-w-0 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start">
                <div className="grid content-start gap-4">
                  <div className="overflow-hidden rounded-lg border-4 border-[#794f27] bg-[#201b16]">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="primary"
                      disabled={isScanning}
                      onClick={startScanner}
                    >
                      {t("startScan")}
                    </Button>
                    <Button type="default" onClick={stopScanner}>
                      {t("stopScan")}
                    </Button>
                  </div>

                  <Button type="default" block onClick={resetReceiver}>
                    {t("resetReceive")}
                  </Button>
                </div>

                <div className="grid min-w-0 content-start gap-4">
                  <div className="rounded-lg bg-white/70 p-4">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                      {t("receiverStatus")}
                    </p>
                    <p className="mt-2 break-words text-lg font-black leading-7 text-[#794f27]">
                      {scanStatus}
                    </p>
                  </div>

                  {receivedFileMeta ? (
                    <div className="rounded-lg bg-white/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#725d42]">
                          {t("archivedBadge", {
                            current: archivedCount,
                            total: receivedFileMeta.totalBatches,
                          })}
                        </p>
                        <span className="text-sm font-black text-[#19c8b9]">
                          {overallProgress}%
                        </span>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f8f8f0]">
                        <div
                          className="h-full rounded-full bg-[#19c8b9]"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>

                      {latestBatchMeta &&
                      !archivedSet.has(latestBatchMeta.batchIndex) ? (
                        <div className="mt-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-black text-[#725d42]">
                              {t("currentBatchProgress", {
                                batch: latestBatchMeta.batchIndex + 1,
                                received: pendingCount,
                                total: expectedBatchChunks,
                              })}
                            </p>
                            <span className="text-xs font-black text-[#19c8b9]">
                              {currentBatchProgress}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f8f8f0]">
                            <div
                              className="h-full rounded-full bg-[#19c8b9]"
                              style={{ width: `${currentBatchProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2">
                        <p className="break-all text-sm font-bold leading-6 text-[#725d42]">
                          {receivedFileMeta.name} ·{" "}
                          {formatBytes(receivedFileMeta.size)} ·{" "}
                          {receivedFileMeta.mime}
                        </p>
                        <p className="break-all text-xs font-bold leading-5 text-[#8a7b66]">
                          {t("checksum")}: {receivedFileMeta.checksum}
                        </p>
                        {missingInBatch.length > 0 ? (
                          <p className="text-xs font-bold leading-5 text-[#8a7b66]">
                            {t("missingChunks")}:{" "}
                            {missingInBatch.slice(0, 18).join(", ")}
                            {missingInBatch.length > 18 ? "..." : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white/70 p-4">
                      <p className="text-sm font-bold leading-6 text-[#725d42]">
                        {t("waitingMeta")}
                      </p>
                    </div>
                  )}

                  {receivedFile ? (
                    <div className="grid gap-4 rounded-lg bg-white/70 p-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                          {t("preview")}
                        </p>
                        <p className="mt-1 break-all text-lg font-black leading-snug text-[#794f27]">
                          {receivedFile.meta.name}
                        </p>
                      </div>
                      {renderPreview(receivedFile)}
                      <Button
                        type="primary"
                        block
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = receivedFile.url;
                          link.download = receivedFile.meta.name;
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }}
                      >
                        {t("download")}
                      </Button>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-[#fffdf2] p-4 text-sm font-bold leading-6 text-[#725d42]">
                      {t("receiverHint")}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}
