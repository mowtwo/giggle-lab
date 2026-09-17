import type { PhoneTheme } from "./types";

export const harmonyosTheme: PhoneTheme = {
  id: "harmonyos",
  label: "HarmonyOS",
  blurbKey: "harmonyos",

  frame: {
    bodyRadius: 50,
    bezel: 10,
    screenRadius: 41,
    bodyBackground:
      "linear-gradient(140deg, #1f4d52 0%, #0d2b30 30%, #2c6b70 56%, #0a2226 84%, #23565c 100%)",
    bodyBorder: "1px solid rgba(190,236,238,0.3)",
    bodyShadow:
      "0 28px 64px -22px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.2) inset",
    buttons: [
      { side: "right", top: 160, length: 30 },
      { side: "right", top: 210, length: 76 },
    ],
  },

  statusBar: {
    height: 50,
    cutout: "notch",
    cutoutSize: { width: 96, height: 30 },
    carrier: null,
    padHour: true,
    battery: "bar",
    sidePadding: 26,
    fontSize: 14,
    fontWeight: 500,
  },

  navigation: {
    defaultMode: "gesture",
    allowSwitch: true,
    indicator: { width: 128, height: 4, radius: 2 },
    height: { gesture: 24, buttons: 46 },
    buttonOrder: ["back", "home", "recents"],
    buttonGlyph: "harmony",
  },

  icons: {
    shape: "circle",
    size: 60,
    radius: 30,
    gloss: true,
    shadow: "0 4px 12px rgba(0,0,0,0.25)",
    grid: { cols: 4, rows: 5, gapX: 24, gapY: 20 },
    padding: { top: 18, bottom: 10, x: 24 },
    label: {
      show: true,
      size: 11,
      weight: 400,
      gap: 8,
      color: { light: "rgba(255,255,255,0.94)", dark: "rgba(255,255,255,0.94)" },
      shadow: {
        light: "0 1px 4px rgba(0,0,0,0.5)",
        dark: "0 1px 4px rgba(0,0,0,0.6)",
      },
    },
    badge: {
      shape: "circle",
      background: "#fa2a2d",
      color: "#fff",
      size: 18,
      offset: -4,
    },
  },

  dock: {
    show: true,
    radius: 34,
    blur: 30,
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.22)",
    paddingY: 11,
    marginX: 12,
    marginBottom: 8,
  },

  motion: {
    launch: "fold-up",
    launchDuration: 380,
    easing: "cubic-bezier(0.2, 0, 0.1, 1)",
    shadeDuration: 340,
    dialogDuration: 240,
  },

  surfaces: {
    shade: "split",
    dialog: "harmony-card",
    toast: "capsule-top",
    tile: { radius: 20, gap: 10 },
    blur: 24,
  },

  typography: {
    ui: '"HarmonyOS Sans SC", "HarmonyOS Sans", "Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    display:
      '"HarmonyOS Sans SC", "HarmonyOS Sans", "Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    tracking: "0.005em",
  },

  palette: {
    light: {
      accent: "#007dff",
      accentSoft: "rgba(0,125,255,0.12)",
      surface: "#f1f3f5",
      surfaceElevated: "#ffffff",
      surfaceSunken: "#e6e9ec",
      textPrimary: "#182431",
      textSecondary: "rgba(24,36,49,0.6)",
      textOnAccent: "#ffffff",
      separator: "rgba(24,36,49,0.1)",
      scrim: "rgba(0,0,0,0.3)",
      glass: "rgba(244,246,248,0.82)",
      glassBorder: "rgba(255,255,255,0.65)",
    },
    dark: {
      accent: "#3b9bff",
      accentSoft: "rgba(59,155,255,0.2)",
      surface: "#05080b",
      surfaceElevated: "#171a1d",
      surfaceSunken: "#21252a",
      textPrimary: "#e8edf2",
      textSecondary: "rgba(232,237,242,0.55)",
      textOnAccent: "#ffffff",
      separator: "rgba(255,255,255,0.09)",
      scrim: "rgba(0,0,0,0.52)",
      glass: "rgba(20,24,28,0.84)",
      glassBorder: "rgba(255,255,255,0.1)",
    },
  },

  wallpapers: [
    {
      id: "petal",
      light:
        "radial-gradient(85% 65% at 26% 14%, #9fe8ff 0%, transparent 55%), radial-gradient(75% 55% at 82% 70%, #ffc2e2 0%, transparent 52%), linear-gradient(175deg, #2f6fd0 0%, #17408c 52%, #0a1c45 100%)",
      dark: "radial-gradient(85% 65% at 26% 14%, #1f5f7a 0%, transparent 55%), radial-gradient(75% 55% at 82% 70%, #6b2a55 0%, transparent 52%), linear-gradient(175deg, #10254d 0%, #081434 54%, #030817 100%)",
    },
    {
      id: "jade",
      light:
        "radial-gradient(90% 70% at 70% 10%, #b9f5dd 0%, transparent 56%), linear-gradient(180deg, #17a08c 0%, #0c5f5c 52%, #062b30 100%)",
      dark: "radial-gradient(90% 70% at 70% 10%, #1c5c50 0%, transparent 56%), linear-gradient(180deg, #0a3f3a 0%, #052225 54%, #010c0e 100%)",
    },
  ],

  defaultBarStyle: { light: "light", dark: "light" },
};
