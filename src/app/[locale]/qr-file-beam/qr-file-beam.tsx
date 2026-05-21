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

type Mode = "send" | "receive";
type TransferMeta = {
  protocol: typeof PROTOCOL;
  type: "meta";
  id: string;
  name: string;
  mime: string;
  size: number;
  total: number;
  chunkSize: number;
  encoding: "base64";
  checksum: string;
  checksumAlgorithm: "SHA-256";
  createdAt: number;
};
type TransferChunk = {
  protocol: typeof PROTOCOL;
  type: "chunk";
  id: string;
  index: number;
  total: number;
  data: string;
};
type TransferFinal = {
  protocol: typeof PROTOCOL;
  type: "final";
  id: string;
  total: number;
  checksum: string;
  size: number;
};
type TransferPacket = TransferMeta | TransferChunk | TransferFinal;
type ReceivedFile = {
  meta: TransferMeta;
  blob: Blob;
  url: string;
};
type NativeBarcodeDetector = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};
type NativeBarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => NativeBarcodeDetector;

const PROTOCOL = "giggle-lab.qr-file-beam.v1";
const DEFAULT_CHUNK_SIZE = 1200;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const QR_OPTIONS = {
  errorCorrectionLevel: "L",
  margin: 1,
  scale: 8,
} as const;

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

function createPacketId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

function parsePacket(rawValue: string): TransferPacket | null {
  try {
    const packet = JSON.parse(rawValue) as Partial<TransferPacket>;

    if (packet.protocol !== PROTOCOL) {
      return null;
    }

    if (packet.type === "meta" && typeof packet.id === "string") {
      return packet as TransferMeta;
    }

    if (
      packet.type === "chunk" &&
      typeof packet.id === "string" &&
      typeof packet.index === "number" &&
      typeof packet.data === "string"
    ) {
      return packet as TransferChunk;
    }

    if (
      packet.type === "final" &&
      typeof packet.id === "string" &&
      typeof packet.total === "number" &&
      typeof packet.checksum === "string"
    ) {
      return packet as TransferFinal;
    }
  } catch {
    return null;
  }

  return null;
}

function clampFrameMs(value: number) {
  return Math.min(1200, Math.max(120, value));
}

function clampFrameIndex(value: number, totalFrames: number) {
  if (totalFrames <= 0) {
    return 0;
  }

  return Math.min(totalFrames - 1, Math.max(0, Math.trunc(value)));
}

export function QrFileBeam() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("QrFileBeam");
  const [mode, setMode] = useState<Mode>("send");
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<TransferMeta | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [prepareError, setPrepareError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameMs, setFrameMs] = useState(280);
  const [isPlaying, setIsPlaying] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [receivedMeta, setReceivedMeta] = useState<TransferMeta | null>(null);
  const [receivedChunks, setReceivedChunks] = useState<Map<number, string>>(
    () => new Map(),
  );
  const [receivedFinal, setReceivedFinal] = useState<TransferFinal | null>(null);
  const [receivedFile, setReceivedFile] = useState<ReceivedFile | null>(null);
  const [scanStatus, setScanStatus] = useState(t("idleScanner"));
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<NativeBarcodeDetector | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const scanFrameRef = useRef<(() => void) | null>(null);
  const lastScanAtRef = useRef(0);

  const totalFrames = meta ? meta.total + 2 : 0;
  const currentPacket = useMemo<TransferPacket | null>(() => {
    if (!meta) {
      return null;
    }

    if (frameIndex === 0) {
      return meta;
    }

    if (frameIndex === totalFrames - 1) {
      return {
        protocol: PROTOCOL,
        type: "final",
        id: meta.id,
        total: meta.total,
        checksum: meta.checksum,
        size: meta.size,
      };
    }

    const chunkIndex = frameIndex - 1;
    const data = chunks[chunkIndex];

    if (!data) {
      return meta;
    }

    return {
      protocol: PROTOCOL,
      type: "chunk",
      id: meta.id,
      index: chunkIndex,
      total: meta.total,
      data,
    };
  }, [chunks, frameIndex, meta, totalFrames]);
  const sendProgress =
    totalFrames > 0 ? Math.round(((frameIndex + 1) / totalFrames) * 100) : 0;
  const receivedCount = receivedChunks.size;
  const receiveProgress =
    receivedMeta && receivedMeta.total > 0
      ? Math.round((receivedCount / receivedMeta.total) * 100)
      : 0;
  const currentFrameKind =
    frameIndex === 0
      ? t("kindMeta")
      : frameIndex === totalFrames - 1
        ? t("kindFinal")
        : t("kindChunk", { index: frameIndex - 1 });
  const missingIndexes = useMemo(() => {
    if (!receivedMeta) {
      return [];
    }

    return Array.from({ length: receivedMeta.total }, (_, index) => index).filter(
      (index) => !receivedChunks.has(index),
    );
  }, [receivedChunks, receivedMeta]);

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

  useEffect(() => {
    if (!isPlaying || totalFrames === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % totalFrames);
    }, frameMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [frameMs, isPlaying, totalFrames]);

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
    setMeta(null);
    setChunks([]);
    setFrameIndex(0);
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

      setChunks(slicedChunks);
      setMeta({
        protocol: PROTOCOL,
        type: "meta",
        id: createPacketId(selectedFile),
        name: selectedFile.name,
        mime: selectedFile.type || "application/octet-stream",
        size: selectedFile.size,
        total: slicedChunks.length,
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

    setReceivedMeta(null);
    setReceivedChunks(new Map());
    setReceivedFinal(null);
    setReceivedFile(null);
    setScanStatus(t("idleScanner"));
  }

  const handlePacket = useCallback(
    (packet: TransferPacket) => {
      if (packet.type === "meta") {
        setReceivedMeta((current) => {
          if (current?.id && current.id !== packet.id) {
            setReceivedChunks(new Map());
            setReceivedFinal(null);
            setReceivedFile((fileResult) => {
              if (fileResult) {
                URL.revokeObjectURL(fileResult.url);
              }
              return null;
            });
          }

          return packet;
        });
        setScanStatus(t("metaScanned", { total: packet.total }));
        return;
      }

      if (packet.type === "final") {
        setReceivedFinal(packet);
        setScanStatus(t("finalScanned"));
        return;
      }

      setReceivedChunks((current) => {
        const next = new Map(current);

        if (!next.has(packet.index)) {
          next.set(packet.index, packet.data);
          setScanStatus(
            t("chunkScanned", {
              current: next.size,
              total: packet.total,
            }),
          );
        }

        return next;
      });
    },
    [t],
  );

  useEffect(() => {
    if (!receivedMeta || receivedChunks.size !== receivedMeta.total) {
      return;
    }

    const parts = Array.from({ length: receivedMeta.total }, (_, index) =>
      receivedChunks.get(index),
    );

    if (parts.some((part) => part === undefined)) {
      return;
    }

    if (!receivedFinal) {
      queueMicrotask(() => setScanStatus(t("waitingFinal")));
      return;
    }

    if (
      receivedFinal.id !== receivedMeta.id ||
      receivedFinal.total !== receivedMeta.total ||
      receivedFinal.size !== receivedMeta.size
    ) {
      queueMicrotask(() => setScanStatus(t("checksumFailed")));
      return;
    }

    const bytes = base64ToBytes(parts.join(""));
    const blob = new Blob([bytes], { type: receivedMeta.mime });
    const url = URL.createObjectURL(blob);

    let active = true;

    sha256Hex(bytes).then((checksum) => {
      if (!active) {
        URL.revokeObjectURL(url);
        return;
      }

      if (
        checksum !== receivedMeta.checksum ||
        (receivedFinal && receivedFinal.checksum !== receivedMeta.checksum) ||
        blob.size !== receivedMeta.size
      ) {
        URL.revokeObjectURL(url);
        setScanStatus(t("checksumFailed"));
        return;
      }

      setReceivedFile((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
        }

        return { meta: receivedMeta, blob, url };
      });
      setScanStatus(t("completeWithFinal"));
    });

    return () => {
      active = false;
    };
  }, [receivedChunks, receivedFinal, receivedMeta, t]);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scanRafRef.current = window.requestAnimationFrame(() => {
        scanFrameRef.current?.();
      });
      return;
    }

    const now = performance.now();

    if (now - lastScanAtRef.current < 95) {
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
          inversionAttempts: "dontInvert",
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
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

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <Card type="title" color="app-teal" className="p-6">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Icon name="icon-camera" size={76} bounce />
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                      QR file beam
                    </p>
                    <h1 className="text-balance text-4xl font-black leading-tight text-[#794f27] sm:text-5xl">
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
                      {DEFAULT_CHUNK_SIZE}
                    </p>
                    <p className="text-xs font-black text-[#8a7b66]">
                      {t("chunkUnit")}
                    </p>
                  </div>
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
            <Card color="warm-peach-pink" className="p-5 sm:p-6">
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
                  {prepareError ? (
                    <p className="text-sm font-black text-[#e05a5a]">
                      {prepareError}
                    </p>
                  ) : null}
                </div>

                {file && meta ? (
                  <div className="grid gap-5 xl:grid-cols-[minmax(260px,390px)_1fr]">
                    <div className="grid justify-items-center gap-3">
                      <div className="grid aspect-square w-full max-w-[390px] place-items-center rounded-lg border-4 border-[#794f27] bg-white p-3">
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
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/80">
                        <div
                          className="h-full rounded-full bg-[#19c8b9]"
                          style={{ width: `${sendProgress}%` }}
                        />
                      </div>
                      <p className="text-sm font-black text-[#725d42]">
                        {t("frameCounter", {
                          current: frameIndex + 1,
                          total: totalFrames,
                        })}
                      </p>
                    </div>

                    <div className="grid content-start gap-4">
                      <div className="rounded-lg bg-white/70 p-4">
                        <p className="break-all text-xl font-black text-[#794f27]">
                          {file.name}
                        </p>
                        <p className="mt-2 text-sm font-bold text-[#725d42]">
                          {formatBytes(file.size)} ·{" "}
                          {file.type || "application/octet-stream"} ·{" "}
                          {t("chunkCount", { total: meta.total })}
                        </p>
                        <p className="mt-2 break-all text-xs font-bold leading-5 text-[#8a7b66]">
                          {t("checksum")}: {meta.checksum}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Button
                          type="primary"
                          disabled={isPreparing}
                          onClick={() => setIsPlaying((current) => !current)}
                        >
                          {isPlaying ? t("pause") : t("play")}
                        </Button>
                        <Button
                          type="default"
                          onClick={() =>
                            setFrameIndex((current) =>
                              current === 0 ? totalFrames - 1 : current - 1,
                            )
                          }
                        >
                          {t("prev")}
                        </Button>
                        <Button
                          type="default"
                          onClick={() =>
                            setFrameIndex((current) => (current + 1) % totalFrames)
                          }
                        >
                          {t("next")}
                        </Button>
                        <Button type="default" onClick={() => setFrameIndex(0)}>
                          {t("metaFrame")}
                        </Button>
                      </div>

                      <div className="grid gap-3 rounded-lg bg-white/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm font-black text-[#794f27]">
                            {t("frameIndexLabel")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={Math.max(totalFrames - 1, 0)}
                            value={frameIndex}
                            className="h-10 w-28 rounded-lg border-2 border-[#c4b89e] bg-[#f8f8f0] px-3 text-right text-sm font-black text-[#725d42]"
                            onChange={(event) =>
                              setFrameIndex(
                                clampFrameIndex(
                                  Number(event.target.value),
                                  totalFrames,
                                ),
                              )
                            }
                          />
                        </div>
                        <input
                          aria-label={t("frameSlider")}
                          type="range"
                          min="0"
                          max={Math.max(totalFrames - 1, 0)}
                          step="1"
                          value={frameIndex}
                          onChange={(event) =>
                            setFrameIndex(
                              clampFrameIndex(Number(event.target.value), totalFrames),
                            )
                          }
                        />
                        <div className="flex items-center justify-between gap-3 text-xs font-black text-[#8a7b66]">
                          <span>{t("metaFrame")}: 0</span>
                          <span>{currentFrameKind}</span>
                          <span>
                            {t("finalFrame")}: {Math.max(totalFrames - 1, 0)}
                          </span>
                        </div>
                      </div>

                      <label className="grid gap-2 text-sm font-black text-[#794f27]">
                        {t("speed")}
                        <input
                          type="range"
                          min="120"
                          max="1200"
                          step="20"
                          value={frameMs}
                          onChange={(event) =>
                            setFrameMs(clampFrameMs(Number(event.target.value)))
                          }
                        />
                      </label>

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
            <Card color="app-blue" className="p-5 sm:p-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.92fr)_1fr]">
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

                <div className="grid content-start gap-4">
                  <div className="rounded-lg bg-white/70 p-4">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                      {t("receiverStatus")}
                    </p>
                    <p className="mt-2 text-lg font-black leading-7 text-[#794f27]">
                      {scanStatus}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#725d42]">
                        {receivedMeta
                          ? t("receiveCounter", {
                              current: receivedCount,
                              total: receivedMeta.total,
                            })
                          : t("waitingMeta")}
                      </p>
                      <span className="text-sm font-black text-[#19c8b9]">
                        {receiveProgress}%
                      </span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f8f8f0]">
                      <div
                        className="h-full rounded-full bg-[#19c8b9]"
                        style={{ width: `${receiveProgress}%` }}
                      />
                    </div>
                    {receivedMeta ? (
                      <div className="mt-3 space-y-2">
                        <p className="break-all text-sm font-bold leading-6 text-[#725d42]">
                          {receivedMeta.name} · {formatBytes(receivedMeta.size)} ·{" "}
                          {receivedMeta.mime}
                        </p>
                        <p className="break-all text-xs font-bold leading-5 text-[#8a7b66]">
                          {t("checksum")}: {receivedMeta.checksum}
                        </p>
                        {missingIndexes.length > 0 ? (
                          <p className="text-xs font-bold leading-5 text-[#8a7b66]">
                            {t("missingChunks")}:{" "}
                            {missingIndexes.slice(0, 18).join(", ")}
                            {missingIndexes.length > 18 ? "..." : ""}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {receivedFile ? (
                    <div className="grid gap-4 rounded-lg bg-white/70 p-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                          {t("preview")}
                        </p>
                        <p className="mt-1 break-all text-xl font-black text-[#794f27]">
                          {receivedFile.meta.name}
                        </p>
                      </div>
                      {renderPreview(receivedFile)}
                      <a
                        href={receivedFile.url}
                        download={receivedFile.meta.name}
                        className="inline-flex h-12 items-center justify-center rounded-full border-2 border-[#f8f8f0] bg-[#f8f8f0] px-6 text-base font-black text-[#794f27] shadow-[0_5px_#bdaea0]"
                      >
                        {t("download")}
                      </a>
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
