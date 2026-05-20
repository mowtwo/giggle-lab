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
    titleKey: "powerOnDetector.title",
    slug: "power-on-detector",
    summaryKey: "powerOnDetector.summary",
    status: "ready",
    color: "app-yellow",
    icon: "icon-diy",
    href: "/power-on-detector",
  },
];
