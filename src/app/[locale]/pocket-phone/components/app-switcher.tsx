"use client";

import { useState } from "react";

import { getApp } from "../registry";
import type { PhoneTheme } from "../themes/types";
import { isFlick, useSwipe } from "../use-gesture";

type AppSwitcherProps = {
  theme: PhoneTheme;
  stack: string[];
  appName: (appId: string) => string;
  labels: { title: string; empty: string; closeAll: string; hint: string };
  onResume: (appId: string) => void;
  onKill: (appId: string) => void;
  onKillAll: () => void;
};

function SwitcherCard({
  theme,
  appId,
  name,
  onResume,
  onKill,
}: {
  theme: PhoneTheme;
  appId: string;
  name: string;
  onResume: () => void;
  onKill: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const entry = getApp(appId);

  const swipe = useSwipe({
    onSwipeMove: ({ dy }) => setOffset(Math.min(0, dy)),
    onSwipeEnd: (delta, velocity) => {
      if (isFlick(delta, velocity, "y", 90, 480) < 0) {
        onKill();
      }
      setOffset(0);
    },
    onTap: onResume,
  });

  return (
    <div
      {...swipe}
      role="button"
      tabIndex={0}
      aria-label={name}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onResume();
        }
      }}
      className="relative shrink-0 cursor-pointer overflow-hidden"
      style={{
        width: 168,
        height: 300,
        borderRadius: theme.surfaces.tile.radius + 6,
        background: "var(--ph-surface-elevated)",
        border:
          theme.surfaces.dialog === "parchment"
            ? "3px solid var(--ph-glass-border)"
            : "1px solid var(--ph-separator)",
        boxShadow: "0 16px 34px -18px rgba(0,0,0,0.6)",
        transform: `translateY(${offset}px)`,
        opacity: 1 + Math.max(-0.7, offset / 260),
        transition: offset === 0 ? "transform 240ms var(--ph-easing)" : "none",
        touchAction: "none",
      }}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-3"
        style={{ background: entry?.background, opacity: 0.92 }}
      >
        <span
          className="flex items-center justify-center"
          style={{
            width: 54,
            height: 54,
            borderRadius: theme.icons.shape === "circle" ? "50%" : theme.icons.radius,
            background: "rgba(255,255,255,0.22)",
            color: entry?.glyphColor ?? "#fff",
          }}
        >
          {entry?.glyph}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: entry?.glyphColor ?? "#fff",
            fontFamily: "var(--ph-font-ui)",
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

export function AppSwitcher({
  theme,
  stack,
  appName,
  labels,
  onResume,
  onKill,
  onKillAll,
}: AppSwitcherProps) {
  const [scrollX, setScrollX] = useState(0);

  // 触控板双指左右滑 / 拖拽横向滚动卡片列。
  const rail = useSwipe(
    {
      onSwipeMove: ({ dx }) => setScrollX((current) => current + dx * 0.04),
      onSwipeEnd: () => setScrollX((current) => Math.min(0, current)),
    },
    { threshold: 4 },
  );

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col"
      style={{
        background: "var(--ph-scrim)",
        backdropFilter: `blur(${Math.max(8, theme.surfaces.blur / 2)}px)`,
        WebkitBackdropFilter: `blur(${Math.max(8, theme.surfaces.blur / 2)}px)`,
        animation: "pocket-phone-fade-in 200ms linear both",
      }}
    >
      <div className="flex items-center justify-between px-5 pt-16">
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "var(--ph-font-ui)",
          }}
        >
          {labels.title}
        </span>
        {stack.length > 0 && (
          <button
            type="button"
            onClick={onKillAll}
            style={{ fontSize: 12, color: "#fff", opacity: 0.85 }}
          >
            {labels.closeAll}
          </button>
        )}
      </div>

      <div {...rail} className="flex min-h-0 flex-1 items-center" style={{ touchAction: "none" }}>
        {stack.length === 0 ? (
          <p className="w-full text-center" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            {labels.empty}
          </p>
        ) : (
          <div
            className="flex gap-3 px-5"
            style={{
              transform: `translateX(${scrollX}px)`,
              transition: "transform 260ms var(--ph-easing)",
            }}
          >
            {stack.map((appId) => (
              <SwitcherCard
                key={appId}
                theme={theme}
                appId={appId}
                name={appName(appId)}
                onResume={() => onResume(appId)}
                onKill={() => onKill(appId)}
              />
            ))}
          </div>
        )}
      </div>

      <p
        className="pb-6 text-center"
        style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}
      >
        {labels.hint}
      </p>
    </div>
  );
}
