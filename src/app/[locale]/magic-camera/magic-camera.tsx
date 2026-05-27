"use client";

import { Button, Card, Cursor, Divider, Footer, Icon } from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import {
  createGestureRecognizer,
  type GestureFrame,
  type MagicGesture,
} from "./gesture-recognition";
import { HandTracker } from "./hand-tracker";
import { MagicScene } from "./magic-scene";

type RuntimeStatus = "idle" | "loading" | "running" | "error";

const TRACK_INTERVAL_MS = 42;

const GESTURE_KEYS: MagicGesture[] = [
  "pinch",
  "open-palm",
  "point",
  "circle",
];

export function MagicCamera() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("MagicCamera");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneHostRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const sceneRef = useRef<MagicScene | null>(null);
  const gestureRecognizersRef = useRef(new Map<string, ReturnType<typeof createGestureRecognizer>>());
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<(() => void) | null>(null);
  const lastTrackAtRef = useRef(0);
  const lastFramesRef = useRef<GestureFrame[]>([]);
  const lastGestureRef = useRef<MagicGesture>("idle");

  const [status, setStatus] = useState<RuntimeStatus>("idle");
  const [statusDetail, setStatusDetail] = useState(t("statusIdle"));
  const [gesture, setGesture] = useState<MagicGesture>("idle");
  const [mirrored, setMirrored] = useState(true);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    trackerRef.current?.close();
    trackerRef.current = null;
    sceneRef.current?.dispose();
    sceneRef.current = null;
    lastFramesRef.current = [];
    lastGestureRef.current = "idle";
    setGesture("idle");
    setStatus("idle");
    setStatusDetail(t("statusIdle"));
  }, [t]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const tracker = trackerRef.current;
    const scene = sceneRef.current;
    const now = performance.now();

    if (!video || !tracker || !scene) {
      return;
    }

    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      now - lastTrackAtRef.current > TRACK_INTERVAL_MS
    ) {
      lastTrackAtRef.current = now;
      const hands = tracker.detect(video, now);

      if (hands.length > 0) {
        const frames = hands.map((hand, index) => {
          const handKey = `${hand.handedness}-${index}`;
          let recognizer = gestureRecognizersRef.current.get(handKey);

          if (!recognizer) {
            recognizer = createGestureRecognizer();
            gestureRecognizersRef.current.set(handKey, recognizer);
          }

          return recognizer.update(hand.landmarks, handKey);
        });
        lastFramesRef.current = frames;
        const primaryFrame =
          frames.find((frame) => frame.gesture !== "idle") ?? frames[0];

        if (primaryFrame.gesture !== lastGestureRef.current) {
          lastGestureRef.current = primaryFrame.gesture;
          setGesture(primaryFrame.gesture);
          setStatusDetail(t(primaryFrame.labelKey));
        }
      } else {
        lastFramesRef.current = [];
        if (lastGestureRef.current !== "idle") {
          lastGestureRef.current = "idle";
          setGesture("idle");
          setStatusDetail(t("statusNoHand"));
        }
      }
    }

    scene.update(lastFramesRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      tickRef.current?.();
    });
  }, [t]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(async () => {
    if (!videoRef.current || !sceneHostRef.current || status === "loading") {
      return;
    }

    stop();
    setStatus("loading");
    setStatusDetail(t("statusLoading"));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const tracker = new HandTracker();
      trackerRef.current = tracker;
      await tracker.load();

      const scene = new MagicScene(sceneHostRef.current);
      scene.setMirrored(mirrored);
      sceneRef.current = scene;
      lastTrackAtRef.current = 0;

      setStatus("running");
      setStatusDetail(t("statusRunning"));
      rafRef.current = window.requestAnimationFrame(() => {
        tickRef.current?.();
      });
    } catch {
      stop();
      setStatus("error");
      setStatusDetail(t("statusError"));
    }
  }, [mirrored, status, stop, t]);

  useEffect(() => {
    sceneRef.current?.setMirrored(mirrored);
  }, [mirrored]);

  useEffect(() => {
    const host = sceneHostRef.current;
    if (!host) {
      return;
    }

    const observer = new ResizeObserver(() => {
      sceneRef.current?.resize();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [stop]);

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <section className="mx-auto grid max-w-7xl gap-5 py-7 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-start">
          <Card type="title" color="purple" className="p-5 sm:p-6">
            <div className="grid gap-5">
              <div className="flex items-center gap-4">
                <Icon name="icon-camera" size={64} bounce />
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[#6d56c7]">
                    Magic camera
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

              <div className="grid gap-3">
                <div className="rounded-lg border-2 border-[#d4c9b4] bg-white/75 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7b66]">
                    {t("statusLabel")}
                  </p>
                  <p className="mt-1 text-lg font-black leading-7 text-[#6d56c7]">
                    {statusDetail}
                  </p>
                </div>

                <div className="rounded-lg border-2 border-[#d4c9b4] bg-white/75 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7b66]">
                    {t("gestureLabel")}
                  </p>
                  <p className="mt-1 text-lg font-black leading-7 text-[#794f27]">
                    {t(`gesture.${gesture}`)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="primary"
                  disabled={status === "loading" || status === "running"}
                  onClick={start}
                >
                  {status === "loading" ? t("loading") : t("start")}
                </Button>
                <Button type="default" onClick={stop}>
                  {t("stop")}
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setMirrored((value) => !value)}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-black transition active:translate-y-[1px] ${
                  mirrored
                    ? "border-[#6d56c7] bg-[#ede8ff] text-[#6d56c7]"
                    : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
                }`}
              >
                {mirrored ? t("mirrorOn") : t("mirrorOff")}
              </button>

              <div className="grid gap-2">
                {GESTURE_KEYS.map((key) => (
                  <div
                    key={key}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-black transition ${
                      gesture === key
                        ? "border-[#6d56c7] bg-[#ede8ff] text-[#6d56c7]"
                        : "border-[#d4c9b4] bg-white/55 text-[#725d42]"
                    }`}
                  >
                    {t(`gestureHint.${key}`)}
                  </div>
                ))}
              </div>

              <p className="rounded-lg border-2 border-[#d4c9b4] bg-white/55 p-3 text-xs font-bold leading-5 text-[#725d42]">
                {t("assetCreditPrefix")}{" "}
                <a
                  href="https://kenney.nl/assets/particle-pack"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-2 underline-offset-2"
                >
                  Kenney Particle Pack
                </a>{" "}
                /{" "}
                <a
                  href="https://opengameart.org/content/2d-spell-effects"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-2 underline-offset-2"
                >
                  2D Spell Effects
                </a>{" "}
                {t("assetCreditMiddle")}{" "}
                <a
                  href="https://creativecommons.org/publicdomain/zero/1.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-2 underline-offset-2"
                >
                  CC0
                </a>
                {t("assetCreditSuffix")}
              </p>
            </div>
          </Card>

          <div className="grid gap-4">
            <div className="relative min-h-[520px] overflow-hidden rounded-lg border-4 border-[#794f27] bg-[#130f1f] shadow-[0_6px_0_rgba(122,97,65,0.22)] lg:min-h-[calc(100svh-132px)]">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover opacity-80 ${
                  mirrored ? "scale-x-[-1]" : ""
                }`}
              />
              <div
                ref={sceneHostRef}
                className="absolute inset-0"
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-black/55 to-transparent p-4">
                <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-sm font-black text-white">
                  {t("liveBadge")}
                </span>
                <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-sm font-black text-white">
                  {t(`gesture.${gesture}`)}
                </span>
              </div>

              {status !== "running" ? (
                <div className="absolute inset-0 grid place-items-center bg-[#130f1f]/72 p-6 text-center">
                  <div className="max-w-md space-y-4">
                    <Icon name="icon-camera" size={86} bounce />
                    <p className="text-xl font-black leading-8 text-white">
                      {status === "loading" ? t("statusLoading") : t("emptyStage")}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}
