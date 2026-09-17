"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ColorScheme, PhoneTheme } from "../themes/types";

export const SQUIRCLE_CLIP_ID = "ph-squircle-clip";

/**
 * iOS 那种连续圆角是超椭圆 |x|^n + |y|^n = 1(n≈5),不是 border-radius 能画出来的。
 * 用 objectBoundingBox 单位的 clipPath 生成一次,任意尺寸都能复用。
 */
function squirclePath(n = 5, samples = 96) {
  const points: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const x = Math.sign(cos) * Math.abs(cos) ** (2 / n);
    const y = Math.sign(sin) * Math.abs(sin) ** (2 / n);
    points.push(`${(0.5 + x / 2).toFixed(5)},${(0.5 + y / 2).toFixed(5)}`);
  }
  return `M${points.join("L")}Z`;
}

const SQUIRCLE_PATH = squirclePath();

/** 挂在手机根节点里一次,给所有 squircle 图标共用。 */
export function SquircleDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <clipPath id={SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
          <path d={SQUIRCLE_PATH} />
        </clipPath>
      </defs>
    </svg>
  );
}

function shapeStyle(theme: PhoneTheme): CSSProperties {
  const { icons } = theme;
  switch (icons.shape) {
    case "squircle":
      return { clipPath: `url(#${SQUIRCLE_CLIP_ID})` };
    case "circle":
      return { borderRadius: "50%" };
    case "sticker":
      return {
        borderRadius: `${icons.radius}px ${icons.radius * 1.5}px ${icons.radius}px ${icons.radius * 1.5}px`,
        border: "3px solid rgba(255,253,244,0.92)",
      };
    case "rounded":
    default:
      return { borderRadius: icons.radius };
  }
}

type AppIconProps = {
  theme: PhoneTheme;
  scheme: ColorScheme;
  name: string;
  background: string;
  glyph: ReactNode;
  glyphColor: string;
  badge?: number;
  showLabel?: boolean;
  onOpen: () => void;
  /** 让转场知道图标在屏幕上的位置。 */
  onMeasure?: (rect: DOMRect) => void;
};

export function AppIcon({
  theme,
  scheme,
  name,
  background,
  glyph,
  glyphColor,
  badge = 0,
  showLabel = true,
  onOpen,
  onMeasure,
}: AppIconProps) {
  const { icons } = theme;

  return (
    <button
      type="button"
      className="group flex flex-col items-center focus:outline-none"
      style={{ width: icons.size + 14 }}
      onClick={(event) => {
        onMeasure?.(event.currentTarget.getBoundingClientRect());
        onOpen();
      }}
    >
      {/* 外层负责定位角标:clip-path 会裁掉子元素,角标只能画在被裁的那一层之外。 */}
      <span
        className="relative inline-block transition-transform duration-150 group-active:scale-90"
        style={{ width: icons.size, height: icons.size }}
      >
        <span
          className="absolute inset-0 inline-flex items-center justify-center"
          style={{
            background,
            color: glyphColor,
            boxShadow: icons.shadow,
            ...shapeStyle(theme),
          }}
        >
          {glyph}
          {icons.gloss && icons.shape !== "sticker" && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 42%, rgba(0,0,0,0.08) 100%)",
              }}
            />
          )}
        </span>

        {badge > 0 && (
          <span
            className="pointer-events-none absolute inline-flex items-center justify-center font-semibold"
            style={{
              top: icons.badge.offset,
              right: icons.badge.offset,
              minWidth: icons.badge.size,
              height: icons.badge.size,
              paddingInline: 5,
              borderRadius: icons.badge.shape === "circle" ? 999 : 7,
              background: icons.badge.background,
              color: icons.badge.color,
              fontSize: icons.badge.size * 0.62,
              boxShadow: "0 0 0 2px rgba(0,0,0,0.12)",
            }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>

      {showLabel && icons.label.show && (
        <span
          className="max-w-full truncate"
          style={{
            marginTop: icons.label.gap,
            fontSize: icons.label.size,
            fontWeight: icons.label.weight,
            color: icons.label.color[scheme],
            textShadow: icons.label.shadow[scheme],
            fontFamily: "var(--ph-font-ui)",
            letterSpacing: "var(--ph-tracking)",
          }}
        >
          {name}
        </span>
      )}
    </button>
  );
}
