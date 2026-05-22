"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { playAnimalese } from "@/lib/audio/state";

export type AnimaleseTextProps = {
  text: string;
  /** Characters per second for the typewriter reveal. */
  cps?: number;
  /** Voice pitch multiplier (1 = neutral). */
  pitch?: number;
  /** Delay before starting, in ms. */
  startDelay?: number;
  /** Render as a different tag. */
  as?: "span" | "p" | "div" | "h1" | "h2";
  className?: string;
  style?: CSSProperties;
  /** Re-play the reveal whenever this changes (e.g. mode tab id). */
  replayKey?: string | number;
};

export function AnimaleseText({
  text,
  cps = 22,
  pitch = 1,
  startDelay = 0,
  as = "span",
  className,
  style,
  replayKey,
}: AnimaleseTextProps) {
  const [shown, setShown] = useState("");
  const playedRef = useRef("");
  const Tag = as as React.ElementType;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown("");
    playedRef.current = "";
    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      void playAnimalese(text, {
        pitch,
        rate: cps / 13,
      });
      const interval = Math.max(20, 1000 / cps);
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i += 1;
        const slice = text.slice(0, i);
        setShown(slice);
        if (i < text.length) window.setTimeout(tick, interval);
      };
      tick();
    }, startDelay);
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
    };
  }, [text, cps, pitch, startDelay, replayKey]);

  return (
    <Tag className={className} style={style}>
      {shown}
      <span aria-hidden className="opacity-0">
        {text.slice(shown.length)}
      </span>
    </Tag>
  );
}
