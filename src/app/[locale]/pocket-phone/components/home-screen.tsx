"use client";

import { useMemo, useState } from "react";

import { DOCK_APPS, GRID_APPS, type PhoneAppEntry } from "../registry";
import type { ColorScheme, PhoneTheme } from "../themes/types";
import { isFlick, useSwipe } from "../use-gesture";
import { AppIcon } from "./app-icon";

type HomeScreenProps = {
  theme: PhoneTheme;
  scheme: ColorScheme;
  now: Date;
  badges: Record<string, number>;
  page: number;
  appName: (appId: string) => string;
  weekdayLabel: string;
  widgetHint: string;
  onSetPage: (page: number) => void;
  onOpen: (appId: string) => void;
};

function chunk(items: PhoneAppEntry[], size: number) {
  if (size <= 0) {
    return [items];
  }
  const pages: PhoneAppEntry[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages.length > 0 ? pages : [[]];
}

function ClockWidget({
  theme,
  now,
  weekdayLabel,
  hint,
}: {
  theme: PhoneTheme;
  now: Date;
  weekdayLabel: string;
  hint: string;
}) {
  const parchment = theme.surfaces.dialog === "parchment";
  return (
    <div
      className="mb-4 flex items-center justify-between"
      style={{
        padding: "14px 16px",
        borderRadius: theme.surfaces.tile.radius,
        background: parchment ? "var(--ph-glass)" : "rgba(255,255,255,0.14)",
        border: parchment
          ? "2px solid var(--ph-glass-border)"
          : "1px solid rgba(255,255,255,0.16)",
        backdropFilter: `blur(${theme.surfaces.blur}px)`,
        WebkitBackdropFilter: `blur(${theme.surfaces.blur}px)`,
        color: parchment ? "var(--ph-text)" : "#fff",
        boxShadow: parchment ? "0 4px 0 rgba(121,79,39,0.22)" : "none",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--ph-font-display)",
            fontSize: 34,
            lineHeight: 1.05,
            fontWeight: parchment ? 400 : 600,
            letterSpacing: "var(--ph-tracking)",
          }}
        >
          {now.getHours().toString().padStart(2, "0")}:
          {now.getMinutes().toString().padStart(2, "0")}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
          {now.getMonth() + 1}/{now.getDate()} · {weekdayLabel}
        </div>
      </div>
      <div
        className="max-w-[46%] text-right"
        style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.75 }}
      >
        {hint}
      </div>
    </div>
  );
}

export function HomeScreen({
  theme,
  scheme,
  now,
  badges,
  page,
  appName,
  weekdayLabel,
  widgetHint,
  onSetPage,
  onOpen,
}: HomeScreenProps) {
  const { icons, dock } = theme;
  const [dragX, setDragX] = useState(0);

  const pages = useMemo(
    () => chunk(GRID_APPS, icons.grid.cols * icons.grid.rows),
    [icons.grid.cols, icons.grid.rows],
  );
  const safePage = Math.min(page, pages.length - 1);

  const swipe = useSwipe(
    {
      onSwipeMove: ({ dx }) => setDragX(dx),
      onSwipeEnd: (delta, velocity) => {
        setDragX(0);
        const direction = isFlick(delta, velocity, "x", 70, 420);
        if (direction < 0 && safePage < pages.length - 1) {
          onSetPage(safePage + 1);
        } else if (direction > 0 && safePage > 0) {
          onSetPage(safePage - 1);
        }
      },
    },
    { disabled: pages.length <= 1 },
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div
        {...swipe}
        className="flex min-h-0 flex-1 flex-col"
        style={{
          paddingTop: icons.padding.top,
          paddingLeft: icons.padding.x,
          paddingRight: icons.padding.x,
          paddingBottom: icons.padding.bottom,
          touchAction: "pan-y",
        }}
      >
        <ClockWidget theme={theme} now={now} weekdayLabel={weekdayLabel} hint={widgetHint} />

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="flex h-full"
            style={{
              width: `${pages.length * 100}%`,
              transform: `translateX(calc(${(-safePage * 100) / pages.length}% + ${dragX}px))`,
              transition: dragX === 0 ? "transform 320ms var(--ph-easing)" : "none",
            }}
          >
            {pages.map((pageApps, index) => (
              <div
                key={index}
                className="grid h-full content-start"
                style={{
                  width: `${100 / pages.length}%`,
                  gridTemplateColumns: `repeat(${icons.grid.cols}, 1fr)`,
                  columnGap: icons.grid.gapX,
                  rowGap: icons.grid.gapY,
                  justifyItems: "center",
                }}
              >
                {pageApps.map((app) => (
                  <AppIcon
                    key={app.id}
                    theme={theme}
                    scheme={scheme}
                    name={appName(app.id)}
                    background={app.background}
                    glyph={app.glyph}
                    glyphColor={app.glyphColor}
                    badge={badges[app.id] ?? 0}
                    onOpen={() => onOpen(app.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {pages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`${index + 1}`}
                onClick={() => onSetPage(index)}
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: "#fff",
                  opacity: index === safePage ? 0.95 : 0.35,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {dock.show && DOCK_APPS.length > 0 && (
        <div
          // dock 宽度跟着图标数量走:只有一两个应用时不会摊成一条空板子。
          className="mx-auto flex w-fit shrink-0 items-center"
          style={{
            gap: icons.grid.gapX,
            maxWidth: `calc(100% - ${dock.marginX * 2}px)`,
            marginBottom: dock.marginBottom,
            paddingBlock: dock.paddingY,
            paddingInline: Math.max(dock.paddingY, 14),
            borderRadius: dock.radius,
            background: dock.background,
            border: dock.border,
            backdropFilter: `blur(${dock.blur}px)`,
            WebkitBackdropFilter: `blur(${dock.blur}px)`,
          }}
        >
          {DOCK_APPS.map((app) => (
            <AppIcon
              key={app.id}
              theme={theme}
              scheme={scheme}
              name={appName(app.id)}
              background={app.background}
              glyph={app.glyph}
              glyphColor={app.glyphColor}
              badge={badges[app.id] ?? 0}
              showLabel={false}
              onOpen={() => onOpen(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
