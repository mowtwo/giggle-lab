import type { PhoneTheme } from "./types";

export const iosTheme: PhoneTheme = {
  id: "ios",
  label: "iOS",
  blurbKey: "ios",

  frame: {
    bodyRadius: 58,
    bezel: 11,
    screenRadius: 47,
    bodyBackground:
      "linear-gradient(145deg, #55575c 0%, #24262b 26%, #3b3d42 54%, #1a1c20 82%, #4a4c51 100%)",
    bodyBorder: "1px solid rgba(255,255,255,0.28)",
    bodyShadow:
      "0 30px 70px -24px rgba(0,0,0,0.65), 0 2px 0 rgba(255,255,255,0.18) inset",
    buttons: [
      { side: "left", top: 128, length: 32 },
      { side: "left", top: 186, length: 62 },
      { side: "left", top: 262, length: 62 },
      { side: "right", top: 210, length: 96 },
    ],
  },

  statusBar: {
    height: 54,
    cutout: "island",
    cutoutSize: { width: 126, height: 36 },
    carrier: null,
    padHour: false,
    battery: "pill",
    sidePadding: 30,
    fontSize: 15,
    fontWeight: 600,
  },

  navigation: {
    defaultMode: "gesture",
    allowSwitch: false,
    indicator: { width: 140, height: 5, radius: 3 },
    height: { gesture: 26, buttons: 48 },
    buttonOrder: ["back", "home", "recents"],
    buttonGlyph: "classic",
  },

  icons: {
    shape: "squircle",
    size: 62,
    radius: 15,
    gloss: true,
    shadow: "0 4px 10px rgba(0,0,0,0.22)",
    grid: { cols: 4, rows: 6, gapX: 26, gapY: 22 },
    padding: { top: 16, bottom: 10, x: 26 },
    label: {
      show: true,
      size: 11,
      weight: 500,
      gap: 6,
      color: { light: "rgba(255,255,255,0.95)", dark: "rgba(255,255,255,0.95)" },
      shadow: {
        light: "0 1px 3px rgba(0,0,0,0.5)",
        dark: "0 1px 3px rgba(0,0,0,0.6)",
      },
    },
    badge: {
      shape: "circle",
      background: "#ff3b30",
      color: "#fff",
      size: 19,
      offset: -5,
    },
  },

  dock: {
    show: true,
    radius: 30,
    blur: 26,
    background: "rgba(255,255,255,0.22)",
    border: "1px solid rgba(255,255,255,0.18)",
    paddingY: 10,
    marginX: 10,
    marginBottom: 6,
  },

  motion: {
    launch: "zoom-from-icon",
    launchDuration: 420,
    easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    shadeDuration: 380,
    dialogDuration: 220,
  },

  surfaces: {
    shade: "split",
    dialog: "ios-alert",
    toast: "pill-bottom",
    tile: { radius: 22, gap: 12 },
    blur: 28,
  },

  typography: {
    ui: '-apple-system, "SF Pro Text", "PingFang SC", "Helvetica Neue", "Noto Sans SC", system-ui, sans-serif',
    display:
      '-apple-system, "SF Pro Display", "PingFang SC", "Helvetica Neue", system-ui, sans-serif',
    tracking: "-0.01em",
  },

  palette: {
    light: {
      accent: "#007aff",
      accentSoft: "rgba(0,122,255,0.14)",
      surface: "#f2f2f7",
      surfaceElevated: "#ffffff",
      surfaceSunken: "#e5e5ea",
      textPrimary: "#000000",
      textSecondary: "rgba(60,60,67,0.6)",
      textOnAccent: "#ffffff",
      separator: "rgba(60,60,67,0.29)",
      scrim: "rgba(0,0,0,0.28)",
      glass: "rgba(250,250,252,0.74)",
      glassBorder: "rgba(255,255,255,0.5)",
    },
    dark: {
      accent: "#0a84ff",
      accentSoft: "rgba(10,132,255,0.22)",
      surface: "#000000",
      surfaceElevated: "#1c1c1e",
      surfaceSunken: "#2c2c2e",
      textPrimary: "#ffffff",
      textSecondary: "rgba(235,235,245,0.6)",
      textOnAccent: "#ffffff",
      separator: "rgba(84,84,88,0.65)",
      scrim: "rgba(0,0,0,0.5)",
      glass: "rgba(38,38,40,0.7)",
      glassBorder: "rgba(255,255,255,0.12)",
    },
  },

  wallpapers: [
    {
      id: "sonoma",
      light:
        "radial-gradient(120% 90% at 22% 8%, #ffb36b 0%, transparent 52%), radial-gradient(110% 80% at 86% 26%, #ff6f91 0%, transparent 54%), linear-gradient(168deg, #4b2f8f 0%, #2a1a5e 46%, #120c2e 100%)",
      dark: "radial-gradient(120% 90% at 22% 8%, #7a3f9d 0%, transparent 52%), radial-gradient(110% 80% at 86% 26%, #2f4d9e 0%, transparent 54%), linear-gradient(168deg, #17133a 0%, #0a0820 58%, #050410 100%)",
    },
    {
      id: "tide",
      light:
        "radial-gradient(100% 70% at 50% 100%, #8fe3d0 0%, transparent 58%), linear-gradient(180deg, #0f6bd6 0%, #0a3f8f 58%, #062244 100%)",
      dark: "radial-gradient(100% 70% at 50% 100%, #1d6f66 0%, transparent 58%), linear-gradient(180deg, #072a52 0%, #04182f 58%, #010a16 100%)",
    },
  ],

  defaultBarStyle: { light: "light", dark: "light" },
};
