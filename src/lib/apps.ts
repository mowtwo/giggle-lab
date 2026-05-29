import type { IconName } from "animal-island-ui";

export type MiniApp = {
  titleKey: string;
  slug: string;
  summaryKey: string;
  status: "ready" | "draft";
  color: "default" | "app-pink" | "purple" | "app-blue" | "app-yellow" | "app-orange" | "app-teal" | "app-green" | "app-red" | "lime-green" | "yellow-green" | "brown" | "warm-peach-pink";
  icon: IconName;
  href?: string;
};

export const miniApps: MiniApp[] = [
  {
    titleKey: "heartCardEditor.title",
    slug: "heart-card-editor",
    summaryKey: "heartCardEditor.summary",
    status: "ready",
    color: "app-pink",
    icon: "icon-camera",
    href: "/heart-card-editor",
  },
  {
    titleKey: "powerOnDetector.title",
    slug: "power-on-detector",
    summaryKey: "powerOnDetector.summary",
    status: "ready",
    color: "app-yellow",
    icon: "icon-diy",
    href: "/power-on-detector",
  },
  {
    titleKey: "qrFileBeam.title",
    slug: "qr-file-beam",
    summaryKey: "qrFileBeam.summary",
    status: "ready",
    color: "app-teal",
    icon: "icon-camera",
    href: "/qr-file-beam",
  },
  {
    titleKey: "magicCamera.title",
    slug: "magic-camera",
    summaryKey: "magicCamera.summary",
    status: "ready",
    color: "purple",
    icon: "icon-camera",
    href: "/magic-camera",
  },
  {
    titleKey: "miniOfficeWeb.title",
    slug: "mini-office-web",
    summaryKey: "miniOfficeWeb.summary",
    status: "ready",
    color: "app-blue",
    icon: "icon-design",
    href: "/mini-office-web",
  },
  {
    titleKey: "minesweeper.title",
    slug: "minesweeper",
    summaryKey: "minesweeper.summary",
    status: "ready",
    color: "lime-green",
    icon: "icon-diy",
    href: "/minesweeper",
  },
  {
    titleKey: "islandJuiceSort.title",
    slug: "island-juice-sort",
    summaryKey: "islandJuiceSort.summary",
    status: "ready",
    color: "app-teal",
    icon: "icon-diy",
    href: "/island-juice-sort",
  },
  {
    titleKey: "gifEditor.title",
    slug: "gif-editor",
    summaryKey: "gifEditor.summary",
    status: "ready",
    color: "app-orange",
    icon: "icon-camera",
    href: "/gif-editor",
  },
];
