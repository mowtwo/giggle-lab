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
    titleKey: "minesweeper.title",
    slug: "minesweeper",
    summaryKey: "minesweeper.summary",
    status: "ready",
    color: "lime-green",
    icon: "icon-diy",
    href: "/minesweeper",
  },
];
