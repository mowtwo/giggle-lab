"use client";

import { useEffect, useRef } from "react";

type FlvPreviewProps = {
  url: string;
  onEnded: () => void;
  onError: (message: string) => void;
};

type PreviewPlayer = {
  pause: () => void;
  unload: () => void;
  detachMediaElement: () => void;
  destroy: () => void;
};

export function FlvPreview({ url, onEnded, onError }: FlvPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  // eslint-disable-next-line react-hooks/refs
  onEndedRef.current = onEnded;
  // eslint-disable-next-line react-hooks/refs
  onErrorRef.current = onError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let player: PreviewPlayer | null = null;
    const handleEnded = () => onEndedRef.current();

    void import("mpegts.js")
      .then((mod) => {
        if (cancelled) return;
        const mpegts = mod.default;
        if (!mpegts.isSupported()) {
          onErrorRef.current("FLV playback is not supported in this browser.");
          return;
        }
        const next = mpegts.createPlayer(
          { type: "mse", isLive: false, url },
          { enableWorker: false, lazyLoad: false },
        );
        player = next;
        next.attachMediaElement(video);
        next.load();
        void next.play();
        video.addEventListener("ended", handleEnded);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          onErrorRef.current(error instanceof Error ? error.message : "FLV playback failed.");
        }
      });

    return () => {
      cancelled = true;
      video.removeEventListener("ended", handleEnded);
      player?.pause();
      player?.unload();
      player?.detachMediaElement();
      player?.destroy();
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full rounded-2xl bg-black object-contain"
      controls
      playsInline
    />
  );
}
