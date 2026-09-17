import type { PhoneTheme } from "./types";

/**
 * 站点自己的设计语言做成的一套"系统":羊皮纸、薄荷绿、木头机身、贴纸图标。
 * 它同时是主题层的压力测试——用的是另外三套主题里没出现过的变体组合
 * (sticker 图标 / 无挖孔 / unified 下拉面板 / parchment 弹窗 / bounce-in 转场)。
 */
export const animalIslandTheme: PhoneTheme = {
  id: "animal-island",
  label: "动物岛 OS",
  blurbKey: "animalIsland",

  frame: {
    bodyRadius: 40,
    bezel: 16,
    screenRadius: 26,
    bodyBackground:
      "linear-gradient(150deg, #e6c58c 0%, #c99a5c 24%, #e8cb98 52%, #b8833f 80%, #dcbb84 100%)",
    bodyBorder: "2px solid rgba(121,79,39,0.55)",
    bodyShadow:
      "0 10px 0 rgba(121,79,39,0.35), 0 30px 60px -24px rgba(90,60,25,0.55)",
    buttons: [
      { side: "right", top: 170, length: 42 },
      { side: "right", top: 230, length: 42 },
    ],
  },

  statusBar: {
    height: 42,
    cutout: "none",
    cutoutSize: { width: 0, height: 0 },
    carrier: "岛屿信号",
    padHour: false,
    battery: "leaf",
    sidePadding: 18,
    fontSize: 13,
    fontWeight: 700,
  },

  navigation: {
    defaultMode: "buttons",
    allowSwitch: true,
    indicator: { width: 110, height: 6, radius: 4 },
    height: { gesture: 26, buttons: 50 },
    buttonOrder: ["back", "home", "recents"],
    buttonGlyph: "classic",
  },

  icons: {
    shape: "sticker",
    size: 64,
    radius: 22,
    gloss: true,
    shadow: "0 4px 0 rgba(121,79,39,0.4)",
    grid: { cols: 3, rows: 4, gapX: 26, gapY: 24 },
    padding: { top: 20, bottom: 12, x: 28 },
    label: {
      show: true,
      size: 12,
      weight: 700,
      gap: 8,
      // 亮色壁纸是羊皮纸,用深棕;暗色壁纸就得翻成奶油色。
      color: { light: "#5b3d1c", dark: "#f6ecd9" },
      shadow: {
        light: "0 1px 0 rgba(255,255,255,0.7)",
        dark: "0 1px 2px rgba(0,0,0,0.55)",
      },
    },
    badge: {
      shape: "rounded",
      background: "#e8574a",
      color: "#fffaf0",
      size: 20,
      offset: -6,
    },
  },

  dock: {
    show: true,
    radius: 22,
    blur: 6,
    background: "rgba(255,250,236,0.82)",
    border: "2px solid rgba(121,79,39,0.35)",
    paddingY: 12,
    marginX: 12,
    marginBottom: 8,
  },

  motion: {
    launch: "bounce-in",
    launchDuration: 460,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    shadeDuration: 420,
    dialogDuration: 300,
  },

  surfaces: {
    shade: "unified",
    dialog: "parchment",
    toast: "parchment-bottom",
    tile: { radius: 16, gap: 10 },
    blur: 4,
  },

  typography: {
    ui: '"Zen Maru Gothic", "Nunito", "Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    display: '"Ma Shan Zheng", "Zen Maru Gothic", "Noto Sans SC", cursive',
    tracking: "0.02em",
  },

  palette: {
    light: {
      accent: "#19c8b9",
      accentSoft: "rgba(25,200,185,0.18)",
      surface: "#f8f8f0",
      surfaceElevated: "#fffdf4",
      surfaceSunken: "#efe9d8",
      textPrimary: "#794f27",
      textSecondary: "rgba(121,79,39,0.62)",
      textOnAccent: "#ffffff",
      separator: "rgba(121,79,39,0.22)",
      scrim: "rgba(90,60,25,0.32)",
      glass: "rgba(255,253,244,0.9)",
      glassBorder: "rgba(121,79,39,0.3)",
    },
    dark: {
      accent: "#ffcc00",
      accentSoft: "rgba(255,204,0,0.22)",
      surface: "#2b2119",
      surfaceElevated: "#3a2d22",
      surfaceSunken: "#221a13",
      textPrimary: "#f6ecd9",
      textSecondary: "rgba(246,236,217,0.6)",
      textOnAccent: "#4a3213",
      separator: "rgba(246,236,217,0.18)",
      scrim: "rgba(0,0,0,0.5)",
      glass: "rgba(58,45,34,0.92)",
      glassBorder: "rgba(246,236,217,0.22)",
    },
  },

  wallpapers: [
    {
      id: "meadow",
      light:
        "radial-gradient(circle at 12% 18%, rgba(255,204,0,0.35), transparent 30%), radial-gradient(circle at 84% 12%, rgba(25,200,185,0.4), transparent 28%), linear-gradient(180deg, #87d0aa 0%, #f8f8f0 52%, #ffe9b8 100%)",
      dark: "radial-gradient(circle at 12% 18%, rgba(255,204,0,0.22), transparent 30%), radial-gradient(circle at 84% 12%, rgba(25,200,185,0.2), transparent 28%), linear-gradient(180deg, #23412f 0%, #2b2119 56%, #1a130d 100%)",
    },
    {
      id: "beach",
      light:
        "radial-gradient(circle at 50% 96%, #ffe9b8 0%, transparent 46%), linear-gradient(180deg, #7fd4e8 0%, #bdeaf2 40%, #f4e2b8 100%)",
      dark: "radial-gradient(circle at 50% 96%, #5a4526 0%, transparent 46%), linear-gradient(180deg, #16414f 0%, #1d2a33 44%, #2a2015 100%)",
    },
  ],

  defaultBarStyle: { light: "dark", dark: "light" },
};
