import type { PhoneTheme } from "./types";

export const hyperosTheme: PhoneTheme = {
  id: "hyperos",
  label: "HyperOS",
  blurbKey: "hyperos",

  frame: {
    bodyRadius: 44,
    bezel: 9,
    screenRadius: 36,
    bodyBackground:
      "linear-gradient(150deg, #d8dade 0%, #8f9299 22%, #c9ccd2 48%, #6e7178 78%, #b6b9bf 100%)",
    bodyBorder: "1px solid rgba(255,255,255,0.4)",
    bodyShadow:
      "0 26px 60px -22px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.35) inset",
    buttons: [
      { side: "right", top: 150, length: 34 },
      { side: "right", top: 204, length: 70 },
    ],
  },

  statusBar: {
    height: 46,
    cutout: "punch-hole",
    cutoutSize: { width: 22, height: 22 },
    carrier: "中国移动",
    padHour: true,
    battery: "bar",
    sidePadding: 22,
    fontSize: 13,
    fontWeight: 500,
  },

  navigation: {
    defaultMode: "gesture",
    allowSwitch: true,
    indicator: { width: 118, height: 4, radius: 2 },
    height: { gesture: 22, buttons: 46 },
    buttonOrder: ["recents", "home", "back"],
    buttonGlyph: "miui",
  },

  icons: {
    shape: "rounded",
    size: 58,
    radius: 17,
    gloss: false,
    shadow: "0 3px 8px rgba(0,0,0,0.26)",
    grid: { cols: 4, rows: 5, gapX: 22, gapY: 18 },
    padding: { top: 14, bottom: 8, x: 20 },
    label: {
      show: true,
      size: 11,
      weight: 400,
      gap: 7,
      color: { light: "rgba(255,255,255,0.92)", dark: "rgba(255,255,255,0.92)" },
      shadow: {
        light: "0 1px 4px rgba(0,0,0,0.55)",
        dark: "0 1px 4px rgba(0,0,0,0.65)",
      },
    },
    badge: {
      shape: "circle",
      background: "#ff5252",
      color: "#fff",
      size: 17,
      offset: -4,
    },
  },

  dock: {
    show: true,
    radius: 26,
    blur: 20,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.12)",
    paddingY: 12,
    marginX: 8,
    marginBottom: 4,
  },

  motion: {
    launch: "scale-fade",
    launchDuration: 340,
    easing: "cubic-bezier(0.2, 0.9, 0.25, 1)",
    shadeDuration: 320,
    dialogDuration: 200,
  },

  surfaces: {
    shade: "split",
    dialog: "material",
    toast: "pill-center",
    tile: { radius: 26, gap: 10 },
    blur: 22,
  },

  typography: {
    ui: '"MiSans", "HarmonyOS Sans SC", "Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    display:
      '"MiSans", "HarmonyOS Sans SC", "Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    tracking: "0",
  },

  palette: {
    light: {
      accent: "#ff6a00",
      accentSoft: "rgba(255,106,0,0.14)",
      surface: "#f4f5f7",
      surfaceElevated: "#ffffff",
      surfaceSunken: "#e9ebef",
      textPrimary: "#16181c",
      textSecondary: "rgba(22,24,28,0.5)",
      textOnAccent: "#ffffff",
      separator: "rgba(22,24,28,0.1)",
      scrim: "rgba(0,0,0,0.32)",
      glass: "rgba(246,247,249,0.8)",
      glassBorder: "rgba(255,255,255,0.6)",
    },
    dark: {
      accent: "#ff7a2e",
      accentSoft: "rgba(255,122,46,0.22)",
      surface: "#0b0b0d",
      surfaceElevated: "#1b1b1f",
      surfaceSunken: "#242429",
      textPrimary: "#f5f5f7",
      textSecondary: "rgba(245,245,247,0.5)",
      textOnAccent: "#ffffff",
      separator: "rgba(255,255,255,0.1)",
      scrim: "rgba(0,0,0,0.55)",
      glass: "rgba(24,24,27,0.82)",
      glassBorder: "rgba(255,255,255,0.08)",
    },
  },

  wallpapers: [
    {
      id: "canyon",
      light:
        "radial-gradient(90% 70% at 18% 12%, #ffd08a 0%, transparent 56%), linear-gradient(170deg, #f0793c 0%, #b8402f 44%, #4a1c2c 100%)",
      dark: "radial-gradient(90% 70% at 18% 12%, #7c4a22 0%, transparent 56%), linear-gradient(170deg, #5c2a18 0%, #2c1218 46%, #0b0609 100%)",
    },
    {
      id: "aurora",
      light:
        "radial-gradient(80% 60% at 78% 16%, #8affd9 0%, transparent 56%), linear-gradient(190deg, #1e9ad6 0%, #1a4f9e 50%, #0d1b44 100%)",
      dark: "radial-gradient(80% 60% at 78% 16%, #1c6f5d 0%, transparent 56%), linear-gradient(190deg, #0c3b5c 0%, #0a2246 52%, #040814 100%)",
    },
  ],

  defaultBarStyle: { light: "light", dark: "light" },
};
