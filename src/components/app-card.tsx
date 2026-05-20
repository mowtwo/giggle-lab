import { ArrowUpRight } from "lucide-react";

import type { MiniApp } from "@/lib/apps";
import { cn } from "@/lib/utils";

type AppCardProps = {
  app: MiniApp;
};

const palette: Record<MiniApp["color"], string> = {
  pink: "bg-[#f8a6b2] text-white",
  purple: "bg-[#b77dee] text-white",
  blue: "bg-[#889df0] text-white",
  yellow: "bg-[#f7cd67] text-[#725d42]",
  teal: "bg-[#82d5bb] text-white",
  green: "bg-[#8ac68a] text-white",
  red: "bg-[#fc736d] text-white",
  lime: "bg-[#d1da49] text-[#3d5a1a]",
};

export function AppCard({ app }: AppCardProps) {
  const Icon = app.icon;

  return (
    <article className="group grid min-h-56 content-between rounded-[28px] border-2 border-[#e8dcc8] bg-[#f7f3df] p-5 text-card-foreground island-card-shadow transition-all duration-300 hover:-translate-y-1 hover:border-[#d4c4a8]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-[22px] border-[5px] border-[#f8f8f0] shadow-[0_4px_0_rgba(107,92,67,0.18)]",
              palette[app.color],
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <span
            className={cn(
              "rounded-full border-2 px-3 py-1 text-xs font-bold",
              app.status === "ready"
                ? "border-[#6fba2c] bg-[#e6f6db] text-[#5a9e1e]"
                : "border-[#f5c31c] bg-[#fff6bf] text-[#8b7355]",
            )}
          >
            {app.status === "ready" ? "Ready" : "Idea"}
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold tracking-[0.01em]">
            {app.title}
          </h2>
          <p className="text-sm leading-6 text-[#8a7b66]">
            {app.summary}
          </p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between rounded-full bg-[#fffdf2] px-4 py-2 text-sm font-bold text-[#19c8b9]">
        <span>/{app.slug}</span>
        <ArrowUpRight
          className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
