"use client";

import { useState } from "react";

import type { PhoneNotification } from "../phone-state";
import type { PhoneTheme } from "../themes/types";
import { isFlick, useSwipe } from "../use-gesture";

type LockScreenProps = {
  theme: PhoneTheme;
  now: Date;
  notifications: PhoneNotification[];
  appName: (appId: string) => string;
  labels: { unlock: string; dateFormat: string; notifications: string };
  onUnlock: () => void;
};

export function LockScreen({
  theme,
  now,
  notifications,
  appName,
  labels,
  onUnlock,
}: LockScreenProps) {
  const [offset, setOffset] = useState(0);

  const swipe = useSwipe({
    onSwipeMove: ({ dy }) => setOffset(Math.min(0, dy)),
    onSwipeEnd: (delta, velocity) => {
      if (isFlick(delta, velocity, "y", 80, 420) < 0) {
        onUnlock();
      }
      setOffset(0);
    },
    onTap: () => setOffset(0),
  });

  const parchment = theme.surfaces.dialog === "parchment";

  return (
    <div
      {...swipe}
      className="absolute inset-0 z-40 flex flex-col"
      style={{
        transform: `translateY(${offset}px)`,
        transition: offset === 0 ? "transform 320ms var(--ph-easing)" : "none",
        touchAction: "none",
        color: parchment ? "var(--ph-text)" : "#fff",
      }}
    >
      <div className="flex flex-col items-center" style={{ paddingTop: 92 }}>
        <div
          style={{
            fontFamily: "var(--ph-font-display)",
            fontSize: 74,
            lineHeight: 1,
            fontWeight: parchment ? 400 : 300,
            letterSpacing: "var(--ph-tracking)",
            textShadow: parchment ? "0 1px 0 rgba(255,255,255,0.6)" : "0 2px 18px rgba(0,0,0,0.35)",
          }}
        >
          {now.getHours().toString().padStart(2, "0")}:
          {now.getMinutes().toString().padStart(2, "0")}
        </div>
        <div style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>{labels.dateFormat}</div>
      </div>

      <div className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5">
        {notifications.slice(0, 4).map((item) => (
          <div
            key={item.id}
            style={{
              padding: "10px 13px",
              borderRadius: theme.surfaces.tile.radius,
              background: parchment ? "var(--ph-glass)" : "rgba(255,255,255,0.16)",
              border: parchment
                ? "2px solid var(--ph-glass-border)"
                : "1px solid rgba(255,255,255,0.14)",
              backdropFilter: `blur(${theme.surfaces.blur}px)`,
              WebkitBackdropFilter: `blur(${theme.surfaces.blur}px)`,
            }}
          >
            <div style={{ fontSize: 10, opacity: 0.8 }}>{appName(item.appId)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.title}</div>
            {item.body && (
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>{item.body}</div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onUnlock}
        className="flex flex-col items-center gap-2 pb-8"
        style={{ fontSize: 12, opacity: 0.85 }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: theme.navigation.indicator.width,
            height: theme.navigation.indicator.height,
            borderRadius: theme.navigation.indicator.radius,
            background: "currentColor",
            animation: "pocket-phone-nudge 1.8s var(--ph-easing) infinite",
          }}
        />
        {labels.unlock}
      </button>
    </div>
  );
}
