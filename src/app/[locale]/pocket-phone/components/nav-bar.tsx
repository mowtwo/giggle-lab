"use client";

import { useState } from "react";

import type { NavMode, PhoneTheme } from "../themes/types";
import { isFlick, useSwipe } from "../use-gesture";

type NavBarProps = {
  theme: PhoneTheme;
  mode: NavMode;
  tint: string;
  labels: { back: string; home: string; recents: string };
  onBack: () => void;
  onHome: () => void;
  onRecents: () => void;
};

function Glyph({
  kind,
  style,
  tint,
}: {
  kind: "back" | "home" | "recents";
  style: PhoneTheme["navigation"]["buttonGlyph"];
  tint: string;
}) {
  const weight = style === "harmony" ? 1.8 : style === "classic" ? 2.8 : 2.2;
  const filled = style === "miui";

  if (kind === "back") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        {filled ? (
          <path d="M15.5 4.5 7.8 12l7.7 7.5z" fill={tint} />
        ) : (
          <path
            d="M15 5 8 12l7 7"
            fill="none"
            stroke={tint}
            strokeWidth={weight}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    );
  }

  if (kind === "home") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r={filled ? 7 : 7.2}
          fill={filled ? tint : "none"}
          stroke={filled ? "none" : tint}
          strokeWidth={weight}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect
        x="5.4"
        y="5.4"
        width="13.2"
        height="13.2"
        rx={style === "classic" ? 3.4 : 2.4}
        fill={filled ? tint : "none"}
        stroke={filled ? "none" : tint}
        strokeWidth={weight}
      />
    </svg>
  );
}

export function NavBar({
  theme,
  mode,
  tint,
  labels,
  onBack,
  onHome,
  onRecents,
}: NavBarProps) {
  const [dragY, setDragY] = useState(0);
  const height = theme.navigation.height[mode === "gesture" ? "gesture" : "buttons"];

  const swipe = useSwipe(
    {
      onSwipeMove: ({ dy }) => setDragY(Math.max(-90, Math.min(12, dy))),
      onSwipeEnd: (delta, velocity) => {
        setDragY(0);
        // 上滑得远/停顿得久 -> 多任务;轻轻上滑 -> 回桌面。
        if (delta.dy < -130 || (delta.dy < -50 && Math.abs(velocity.dy) < 260)) {
          onRecents();
        } else if (isFlick(delta, velocity, "y") < 0) {
          onHome();
        } else if (isFlick(delta, velocity, "x") > 0) {
          onBack();
        }
      },
      onTap: () => onHome(),
    },
    { disabled: mode !== "gesture" },
  );

  if (mode === "gesture") {
    const { width, height: barHeight, radius } = theme.navigation.indicator;
    return (
      <div
        {...swipe}
        className="relative z-20 flex w-full shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
        style={{ height, touchAction: "none" }}
        role="button"
        tabIndex={0}
        aria-label={labels.home}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onHome();
          }
        }}
      >
        <span
          style={{
            width,
            height: barHeight,
            borderRadius: radius,
            background: tint,
            opacity: 0.85,
            transform: `translateY(${dragY * 0.18}px) scaleX(${1 + Math.min(0.14, Math.abs(dragY) / 600)})`,
            transition: dragY === 0 ? "transform 260ms var(--ph-easing)" : "none",
          }}
        />
      </div>
    );
  }

  const actions = {
    back: { label: labels.back, run: onBack },
    home: { label: labels.home, run: onHome },
    recents: { label: labels.recents, run: onRecents },
  } as const;

  return (
    <div
      className="relative z-20 flex w-full shrink-0 items-center justify-around"
      style={{ height }}
    >
      {theme.navigation.buttonOrder.map((kind) => (
        <button
          key={kind}
          type="button"
          aria-label={actions[kind].label}
          onClick={actions[kind].run}
          className="flex h-full flex-1 items-center justify-center opacity-90 transition-opacity active:opacity-50"
        >
          <Glyph kind={kind} style={theme.navigation.buttonGlyph} tint={tint} />
        </button>
      ))}
    </div>
  );
}
