"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../themes/tokens";
import type { PhoneTheme } from "../themes/types";

type DeviceFrameProps = {
  theme: PhoneTheme;
  /** 每次 +1 抖一下机身。 */
  hapticPulse: number;
  hapticStrength: "light" | "medium" | "heavy";
  /** 控制中心的亮度条会真的把屏幕调暗。 */
  brightness: number;
  children: ReactNode;
};

/**
 * 机身外壳 + 等比缩放。
 * 屏幕内部永远按 390×844 的逻辑像素布局,外面整体 scale 适配容器,
 * 这样主题里可以放心写死像素值,不用每个尺寸都写一套。
 */
export function DeviceFrame({
  theme,
  hapticPulse,
  hapticStrength,
  brightness,
  children,
}: DeviceFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const { frame } = theme;
  const deviceWidth = SCREEN_WIDTH + frame.bezel * 2;
  const deviceHeight = SCREEN_HEIGHT + frame.bezel * 2;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) {
        return;
      }
      setScale(Math.min(width / deviceWidth, height / deviceHeight, 1.1));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [deviceHeight, deviceWidth]);

  const shake =
    hapticStrength === "heavy" ? 3.2 : hapticStrength === "medium" ? 2 : 1.1;

  return (
    <div ref={hostRef} className="flex h-full w-full items-center justify-center">
      <div
        key={`${theme.id}-${hapticPulse}`}
        style={{
          width: deviceWidth,
          height: deviceHeight,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          borderRadius: frame.bodyRadius,
          background: frame.bodyBackground,
          border: frame.bodyBorder,
          boxShadow: frame.bodyShadow,
          padding: frame.bezel,
          position: "relative",
          // key 变化会重放动画:每次 haptic 都真的抖一下。
          animation: hapticPulse > 0 ? `pocket-phone-haptic 180ms ease-out` : undefined,
          ["--ph-haptic" as string]: `${shake}px`,
        }}
      >
        {frame.buttons.map((button, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute"
            style={{
              [button.side]: -3,
              top: button.top,
              width: 3.5,
              height: button.length,
              borderRadius: 3,
              background: "inherit",
              filter: "brightness(0.82)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          />
        ))}

        <div
          className="relative h-full w-full overflow-hidden bg-black"
          style={{ borderRadius: frame.screenRadius }}
        >
          {children}
          {/* 亮度滑块真的作用在屏幕上。 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[80]"
            style={{
              background: "#000",
              opacity: Math.max(0, 0.62 - brightness * 0.62),
              transition: "opacity 160ms linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
