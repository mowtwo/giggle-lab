import type { LucideIcon } from "lucide-react";
import { BadgePercent, Drama, Laugh, WandSparkles } from "lucide-react";

export type MiniApp = {
  title: string;
  slug: string;
  summary: string;
  status: "ready" | "idea";
  color: "pink" | "purple" | "blue" | "yellow" | "teal" | "green" | "red" | "lime";
  icon: LucideIcon;
};

export const miniApps: MiniApp[] = [
  {
    title: "Excuse Blender",
    slug: "excuse-blender",
    summary: "Emergency-grade nonsense for late replies and tiny disasters.",
    status: "idea",
    color: "yellow",
    icon: WandSparkles,
  },
  {
    title: "Drama Thermometer",
    slug: "drama-thermometer",
    summary: "Measures how theatrical a message feels before you hit send.",
    status: "idea",
    color: "purple",
    icon: Drama,
  },
  {
    title: "Discount Oracle",
    slug: "discount-oracle",
    summary: "Turns questionable deals into confident shopping prophecies.",
    status: "idea",
    color: "teal",
    icon: BadgePercent,
  },
  {
    title: "Tiny Roast Desk",
    slug: "tiny-roast-desk",
    summary: "A compact station for gentle, low-stakes verbal chaos.",
    status: "ready",
    color: "pink",
    icon: Laugh,
  },
];
