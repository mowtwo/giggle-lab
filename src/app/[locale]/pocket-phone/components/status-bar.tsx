"use client";

import type { PhoneTheme } from "../themes/types";

type StatusBarProps = {
  theme: PhoneTheme;
  /** 前景色。 */
  tint: string;
  now: Date;
  battery: number;
  charging: boolean;
  wifi: boolean;
  cellular: boolean;
  airplane: boolean;
  /** App 通过 SDK 覆盖的左上角标题。 */
  title?: string | null;
};

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function Signal({ bars, tint }: { bars: number; tint: string }) {
  return (
    <svg viewBox="0 0 18 12" width="17" height="11" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <rect
          key={index}
          x={index * 4.5}
          y={9 - index * 2.6}
          width="3.1"
          height={3 + index * 2.6}
          rx="1"
          fill={tint}
          opacity={index < bars ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}

function Wifi({ on, tint }: { on: boolean; tint: string }) {
  return (
    <svg viewBox="0 0 18 13" width="17" height="12" aria-hidden="true">
      <g fill="none" stroke={tint} strokeLinecap="round" opacity={on ? 1 : 0.3}>
        <path d="M1.4 4.6A11.4 11.4 0 0 1 16.6 4.6" strokeWidth="2" />
        <path d="M4.3 7.7a7.2 7.2 0 0 1 9.4 0" strokeWidth="2" />
      </g>
      <circle cx="9" cy="11" r="1.5" fill={tint} opacity={on ? 1 : 0.3} />
    </svg>
  );
}

function Airplane({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M8 1.2c.6 0 1 .6 1 1.3v3.7l5.2 3v1.6L9 9.4v3.2l1.7 1.2v1.1L8 14.2l-2.7.7v-1.1L7 12.6V9.4L1.8 10.8V9.2l5.2-3V2.5c0-.7.4-1.3 1-1.3Z"
        fill={tint}
      />
    </svg>
  );
}

function Battery({
  variant,
  level,
  charging,
  tint,
}: {
  variant: PhoneTheme["statusBar"]["battery"];
  level: number;
  charging: boolean;
  tint: string;
}) {
  const ratio = Math.max(0.04, Math.min(1, level / 100));
  const lowColor = level <= 20 ? "#ff453a" : tint;

  if (variant === "leaf") {
    return (
      <span className="inline-flex items-center gap-1">
        <svg viewBox="0 0 20 16" width="19" height="15" aria-hidden="true">
          <defs>
            <clipPath id="ph-leaf-clip">
              <rect x="1" y="0" width={18 * ratio} height="16" />
            </clipPath>
          </defs>
          <path
            d="M18.4 1.6C11.2.4 4.6 2.6 2.4 7.4c-1.4 3 0 6 2.6 7 3.6 1.4 9-.4 11.6-4.6 1.4-2.2 2-5.2 1.8-8.2Z"
            fill="none"
            stroke={lowColor}
            strokeWidth="1.5"
          />
          <g clipPath="url(#ph-leaf-clip)">
            <path
              d="M18.4 1.6C11.2.4 4.6 2.6 2.4 7.4c-1.4 3 0 6 2.6 7 3.6 1.4 9-.4 11.6-4.6 1.4-2.2 2-5.2 1.8-8.2Z"
              fill={lowColor}
              opacity="0.85"
            />
          </g>
        </svg>
        <span style={{ fontSize: 11 }}>{Math.round(level)}</span>
      </span>
    );
  }

  const squarish = variant === "bar";
  return (
    <span className="inline-flex items-center gap-[3px]">
      {squarish && <span style={{ fontSize: 11 }}>{Math.round(level)}</span>}
      <span
        className="relative inline-block"
        style={{
          width: 24,
          height: 12,
          borderRadius: squarish ? 3 : 4,
          border: `1.3px solid ${tint}`,
          opacity: 0.85,
        }}
      >
        <span
          className="absolute"
          style={{
            left: 1.6,
            top: 1.6,
            bottom: 1.6,
            width: `calc((100% - 3.2px) * ${ratio})`,
            borderRadius: squarish ? 1.5 : 2.4,
            background: charging ? "#30d158" : lowColor,
            transition: "width 400ms var(--ph-easing)",
          }}
        />
        <span
          className="absolute"
          style={{
            right: -3.4,
            top: "50%",
            transform: "translateY(-50%)",
            width: 2,
            height: 5,
            borderRadius: 1,
            background: tint,
            opacity: 0.85,
          }}
        />
      </span>
    </span>
  );
}

/** 顶部挖孔。island 会浮在状态栏中间,notch 从顶边挂下来,punch-hole 是个小圆点。 */
function Cutout({ theme }: { theme: PhoneTheme }) {
  const { cutout, cutoutSize, height } = theme.statusBar;
  if (cutout === "none") {
    return null;
  }

  if (cutout === "notch") {
    return (
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 bg-black"
        style={{
          width: cutoutSize.width,
          height: cutoutSize.height,
          borderBottomLeftRadius: cutoutSize.height * 0.62,
          borderBottomRightRadius: cutoutSize.height * 0.62,
        }}
      />
    );
  }

  if (cutout === "punch-hole") {
    return (
      <div
        className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
        style={{
          width: cutoutSize.width,
          height: cutoutSize.height,
          top: (height - cutoutSize.height) / 2 + 2,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
        }}
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
      style={{
        width: cutoutSize.width,
        height: cutoutSize.height,
        top: (height - cutoutSize.height) / 2 + 3,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
      }}
    />
  );
}

export function StatusBar({
  theme,
  tint,
  now,
  battery,
  charging,
  wifi,
  cellular,
  airplane,
  title,
}: StatusBarProps) {
  const { statusBar } = theme;
  const hours = statusBar.padHour ? pad2(now.getHours()) : `${now.getHours()}`;
  const time = `${hours}:${pad2(now.getMinutes())}`;
  const leftLabel = title ?? statusBar.carrier;

  return (
    <div
      // z 在下拉面板(z-40)之上:真机拉开通知栏时状态栏也还在。
      className="relative z-[45] flex w-full shrink-0 select-none items-center justify-between"
      style={{
        height: statusBar.height,
        paddingLeft: statusBar.sidePadding,
        paddingRight: statusBar.sidePadding,
        color: tint,
        fontSize: statusBar.fontSize,
        fontWeight: statusBar.fontWeight,
        fontFamily: "var(--ph-font-ui)",
        letterSpacing: "var(--ph-tracking)",
      }}
    >
      <Cutout theme={theme} />

      {/* 下拉手势交给上层那条透明热区统一处理(见 pocket-phone.tsx),
          这里不放按钮——按钮只吃 click,拖拽时不会触发,会把手势挡掉。 */}
      <div className="pointer-events-none relative z-10 flex items-center gap-1.5 tabular-nums">
        <span>{time}</span>
        {leftLabel && (
          <span
            className="max-w-[92px] truncate"
            style={{ fontWeight: 400, opacity: 0.8, fontSize: statusBar.fontSize - 2 }}
          >
            {leftLabel}
          </span>
        )}
      </div>

      <div className="pointer-events-none relative z-10 flex items-center gap-1.5">
        {airplane ? (
          <Airplane tint={tint} />
        ) : (
          <>
            <Signal bars={cellular ? 4 : 0} tint={tint} />
            <Wifi on={wifi} tint={tint} />
          </>
        )}
        <Battery
          variant={statusBar.battery}
          level={battery}
          charging={charging}
          tint={tint}
        />
      </div>
    </div>
  );
}
