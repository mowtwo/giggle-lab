"use client";

import { useState, type ReactNode } from "react";

import type { PhoneNotification, QuickTileId } from "../phone-state";
import { SCREEN_HEIGHT } from "../themes/tokens";
import type { PhoneTheme } from "../themes/types";
import { isFlick, useSwipe } from "../use-gesture";

export type ShadeLabels = {
  notifications: string;
  controlCenter: string;
  empty: string;
  clearAll: string;
  brightness: string;
  volume: string;
  tiles: Record<QuickTileId, string>;
  close: string;
};

type ShadeProps = {
  theme: PhoneTheme;
  mode: "closed" | "notifications" | "control";
  notifications: PhoneNotification[];
  tiles: Record<QuickTileId, boolean>;
  brightness: number;
  volume: number;
  labels: ShadeLabels;
  appName: (appId: string) => string;
  onClose: () => void;
  onToggleTile: (tile: QuickTileId) => void;
  onBrightness: (value: number) => void;
  onVolume: (value: number) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onOpenApp: (appId: string) => void;
};

const TILE_ORDER: QuickTileId[] = [
  "wifi",
  "cellular",
  "bluetooth",
  "airplane",
  "torch",
  "rotate",
];

function TileGlyph({ id }: { id: QuickTileId }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "wifi":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <g {...common}>
            <path d="M2.6 8.4a14 14 0 0 1 18.8 0" />
            <path d="M6.4 12.4a8.6 8.6 0 0 1 11.2 0" />
          </g>
          <circle cx="12" cy="17.6" r="1.7" fill="currentColor" />
        </svg>
      );
    case "cellular":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <g fill="currentColor">
            <rect x="3" y="14" width="3.4" height="6" rx="1.2" />
            <rect x="8.5" y="11" width="3.4" height="9" rx="1.2" />
            <rect x="14" y="7.6" width="3.4" height="12.4" rx="1.2" />
            <rect x="19.5" y="4" width="3.4" height="16" rx="1.2" opacity="0.5" />
          </g>
        </svg>
      );
    case "bluetooth":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M8 7.4 16 16.6 12 20V4l4 3.4L8 16.6" {...common} />
        </svg>
      );
    case "airplane":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M12 2c.9 0 1.5.9 1.5 2v5.4l7.7 4.4v2.4l-7.7-2.1v4.7l2.5 1.8v1.6L12 21.2l-4 1v-1.6l2.5-1.8v-4.7l-7.7 2.1v-2.4l7.7-4.4V4c0-1.1.6-2 1.5-2Z"
            fill="currentColor"
          />
        </svg>
      );
    case "torch":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M8.4 3h7.2v3.6l-2 2.6V21H10.4V9.2l-2-2.6z" {...common} />
        </svg>
      );
    case "rotate":
    default:
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <g {...common}>
            <rect x="6" y="3.4" width="12" height="17.2" rx="2.6" />
            <path d="M9.6 7.4h4.8" />
          </g>
        </svg>
      );
  }
}

function Slider({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  theme: PhoneTheme;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block"
        style={{ fontSize: 11, color: "var(--ph-text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="relative block overflow-hidden"
        style={{
          height: 34,
          borderRadius: Math.min(17, theme.surfaces.tile.radius),
          background: "var(--ph-surface-sunken)",
        }}
      >
        <span
          className="absolute inset-y-0 left-0"
          style={{
            width: `${value * 100}%`,
            background: "var(--ph-accent)",
            transition: "width 120ms linear",
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </span>
    </label>
  );
}

function Panel({
  theme,
  children,
  offset,
  onDrag,
  onRelease,
}: {
  theme: PhoneTheme;
  children: ReactNode;
  offset: number;
  onDrag: (dy: number) => void;
  onRelease: (close: boolean) => void;
}) {
  const swipe = useSwipe({
    onSwipeMove: ({ dy }) => onDrag(Math.min(0, dy)),
    onSwipeEnd: (delta, velocity) => onRelease(isFlick(delta, velocity, "y", 70, 400) < 0),
  });

  return (
    <div
      {...swipe}
      className="absolute inset-x-0 top-0 z-40 overflow-hidden"
      style={{
        maxHeight: "86%",
        borderBottomLeftRadius: theme.surfaces.tile.radius + 8,
        borderBottomRightRadius: theme.surfaces.tile.radius + 8,
        background: "var(--ph-glass)",
        borderBottom: `1px solid var(--ph-glass-border)`,
        backdropFilter: `blur(${theme.surfaces.blur}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${theme.surfaces.blur}px) saturate(1.4)`,
        color: "var(--ph-text)",
        transform: `translateY(${offset}px)`,
        transition: offset === 0 ? "transform var(--ph-duration-shade) var(--ph-easing)" : "none",
        boxShadow: "0 22px 44px -18px rgba(0,0,0,0.5)",
        touchAction: "none",
      }}
    >
      {children}
      <div className="flex justify-center pb-2 pt-1">
        <span
          style={{
            width: 42,
            height: 4,
            borderRadius: 2,
            background: "var(--ph-text-secondary)",
            opacity: 0.55,
          }}
        />
      </div>
    </div>
  );
}

export function Shade({
  theme,
  mode,
  notifications,
  tiles,
  brightness,
  volume,
  labels,
  appName,
  onClose,
  onToggleTile,
  onBrightness,
  onVolume,
  onDismiss,
  onClearAll,
  onOpenApp,
}: ShadeProps) {
  const [drag, setDrag] = useState(0);
  const unified = theme.surfaces.shade === "unified";
  const open = mode !== "closed";

  if (!open) {
    return null;
  }

  const showTiles = unified || mode === "control";
  const showNotifications = unified || mode === "notifications";

  const release = (shouldClose: boolean) => {
    setDrag(0);
    if (shouldClose) {
      onClose();
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className="absolute inset-0 z-30"
        style={{ background: "var(--ph-scrim)" }}
      />
      <Panel theme={theme} offset={drag} onDrag={setDrag} onRelease={release}>
        <div
          className="flex flex-col gap-3 overflow-y-auto"
          style={{
            // 顶部让出状态栏的高度,免得内容压在时间和电量上。
            padding: `${theme.statusBar.height + 6}px 16px 4px`,
            // 用屏幕的逻辑高度,不能用 vh:机身是被 scale 过的,和浏览器视口无关。
            maxHeight: SCREEN_HEIGHT * 0.86 - 22,
            // 外层面板是 touch-action:none(要接下拉手势),这里得把纵向滚动还回去。
            touchAction: "pan-y",
          }}
        >
          {showTiles && (
            <section>
              <h2
                className="mb-2"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ph-text-secondary)",
                  fontFamily: "var(--ph-font-ui)",
                }}
              >
                {labels.controlCenter}
              </h2>
              <div
                className="grid grid-cols-3"
                style={{ gap: theme.surfaces.tile.gap }}
              >
                {TILE_ORDER.map((tile) => {
                  const active = tiles[tile];
                  return (
                    <button
                      key={tile}
                      type="button"
                      onClick={() => onToggleTile(tile)}
                      className="flex flex-col items-center justify-center gap-1 transition-colors"
                      style={{
                        height: 62,
                        borderRadius: theme.surfaces.tile.radius,
                        background: active ? "var(--ph-accent)" : "var(--ph-surface-sunken)",
                        color: active ? "var(--ph-text-on-accent)" : "var(--ph-text-secondary)",
                        border:
                          theme.surfaces.dialog === "parchment"
                            ? "2px solid var(--ph-glass-border)"
                            : "none",
                      }}
                      aria-pressed={active}
                    >
                      <TileGlyph id={tile} />
                      <span style={{ fontSize: 10 }}>{labels.tiles[tile]}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-2">
                <Slider
                  theme={theme}
                  label={labels.brightness}
                  value={brightness}
                  onChange={onBrightness}
                />
                <Slider
                  theme={theme}
                  label={labels.volume}
                  value={volume}
                  onChange={onVolume}
                />
              </div>
            </section>
          )}

          {showNotifications && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ph-text-secondary)",
                    fontFamily: "var(--ph-font-ui)",
                  }}
                >
                  {labels.notifications}
                </h2>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    style={{ fontSize: 12, color: "var(--ph-accent)" }}
                  >
                    {labels.clearAll}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p
                  className="py-6 text-center"
                  style={{ fontSize: 12, color: "var(--ph-text-secondary)" }}
                >
                  {labels.empty}
                </p>
              ) : (
                <ul className="flex flex-col" style={{ gap: theme.surfaces.tile.gap }}>
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <div
                        className="flex items-start gap-2"
                        style={{
                          padding: "10px 12px",
                          borderRadius: theme.surfaces.tile.radius,
                          background: "var(--ph-surface-elevated)",
                          border:
                            theme.surfaces.dialog === "parchment"
                              ? "2px solid var(--ph-glass-border)"
                              : "1px solid var(--ph-separator)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenApp(item.appId)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--ph-text-secondary)",
                              marginBottom: 2,
                            }}
                          >
                            {appName(item.appId)} ·{" "}
                            {new Date(item.at).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                          {item.body && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--ph-text-secondary)",
                                marginTop: 2,
                              }}
                            >
                              {item.body}
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={labels.close}
                          onClick={() => onDismiss(item.id)}
                          style={{
                            color: "var(--ph-text-secondary)",
                            fontSize: 16,
                            lineHeight: 1,
                            padding: 2,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </Panel>
    </>
  );
}
