import type { ReactNode } from "react";

/**
 * 已安装应用表。
 *
 * kind:
 *   - "native" 由手机壳自己渲染(设置这类需要改系统状态的);
 *   - "web"    跑在 iframe 里,只能通过 SDK 摸到系统。
 *
 * trusted:
 *   - true  同源 iframe,宿主会把 /phone-sdk.js 直接注入进去,App 不用写任何引入;
 *   - false 沙箱 iframe(去掉 allow-same-origin,origin 为 "null"),必须自己
 *           <script src="/phone-sdk.js">,宿主只认 event.source 不认 origin。
 *   两条路走的是同一套 postMessage 协议,用来证明 SDK 不依赖同源。
 */
export type PhoneAppEntry = {
  id: string;
  /** i18n key,位于 PocketPhone.apps.<key>。 */
  nameKey: string;
  kind: "native" | "web";
  url?: string;
  trusted?: boolean;
  /** 放 dock 还是桌面网格。 */
  slot: "grid" | "dock";
  /** 图标底色。 */
  background: string;
  glyph: ReactNode;
  /** 图标前景色。 */
  glyphColor: string;
};

const stroke = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2.2,
} as const;

function SettingsGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="58%" height="58%" aria-hidden="true">
      <g stroke="currentColor" {...stroke}>
        <circle cx="16" cy="16" r="4.6" />
        <path d="M16 3.2v3.1M16 25.7v3.1M28.8 16h-3.1M6.3 16H3.2M25.05 6.95l-2.2 2.2M9.15 22.85l-2.2 2.2M25.05 25.05l-2.2-2.2M9.15 9.15l-2.2-2.2" />
      </g>
    </svg>
  );
}

function PlaygroundGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="60%" height="60%" aria-hidden="true">
      <g stroke="currentColor" {...stroke}>
        <path d="M11.6 8.4 5.4 16l6.2 7.6M20.4 8.4 26.6 16l-6.2 7.6" />
        <path d="M17.8 7.2 14.2 24.8" strokeWidth="2" opacity="0.75" />
      </g>
    </svg>
  );
}

function NotesGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="58%" height="58%" aria-hidden="true">
      <g stroke="currentColor" {...stroke}>
        <path d="M7.4 5.6h13.2l4 4v16.8H7.4z" />
        <path d="M20.2 5.8v4.2h4.2" opacity="0.7" />
        <path d="M11.4 15h9M11.4 19.4h6.4" />
      </g>
    </svg>
  );
}

function DiceGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="58%" height="58%" aria-hidden="true">
      <rect
        x="6.4"
        y="6.4"
        width="19.2"
        height="19.2"
        rx="5"
        stroke="currentColor"
        {...stroke}
      />
      <g fill="currentColor">
        <circle cx="11.8" cy="11.8" r="1.9" />
        <circle cx="20.2" cy="11.8" r="1.9" />
        <circle cx="16" cy="16" r="1.9" />
        <circle cx="11.8" cy="20.2" r="1.9" />
        <circle cx="20.2" cy="20.2" r="1.9" />
      </g>
    </svg>
  );
}

export const PHONE_APPS: PhoneAppEntry[] = [
  {
    id: "sdk-playground",
    nameKey: "playground",
    kind: "web",
    url: "/phone-apps/sdk-playground/index.html",
    trusted: true,
    slot: "grid",
    background: "linear-gradient(160deg, #6d8dff 0%, #3f4fd6 55%, #2b2f9e 100%)",
    glyphColor: "#ffffff",
    glyph: <PlaygroundGlyph />,
  },
  {
    id: "notes",
    nameKey: "notes",
    kind: "web",
    url: "/phone-apps/notes/index.html",
    trusted: true,
    slot: "grid",
    background: "linear-gradient(160deg, #ffe07a 0%, #ffbe3d 52%, #f59a10 100%)",
    glyphColor: "#6a4406",
    glyph: <NotesGlyph />,
  },
  {
    id: "dice",
    nameKey: "dice",
    kind: "web",
    url: "/phone-apps/dice/index.html",
    // 故意不给同源权限:这个 App 必须靠自己引 SDK + 纯 postMessage 活下来。
    trusted: false,
    slot: "grid",
    background: "linear-gradient(160deg, #6ce0b6 0%, #1fb98a 54%, #0d7f61 100%)",
    glyphColor: "#ffffff",
    glyph: <DiceGlyph />,
  },
  {
    id: "settings",
    nameKey: "settings",
    kind: "native",
    slot: "dock",
    background: "linear-gradient(160deg, #b9bfc9 0%, #7f8894 56%, #5a636f 100%)",
    glyphColor: "#ffffff",
    glyph: <SettingsGlyph />,
  },
];

const APP_BY_ID = new Map(PHONE_APPS.map((app) => [app.id, app]));

export function getApp(id: string | null | undefined) {
  return id ? (APP_BY_ID.get(id) ?? null) : null;
}

export const GRID_APPS = PHONE_APPS.filter((app) => app.slot === "grid");
export const DOCK_APPS = PHONE_APPS.filter((app) => app.slot === "dock");
