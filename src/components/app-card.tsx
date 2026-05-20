"use client";

import { Button, Card, Icon } from "animal-island-ui";
import { useTranslations } from "next-intl";

import { useAppNavigation } from "@/components/navigation-provider";
import type { MiniApp } from "@/lib/apps";

type AppCardProps = {
  app: MiniApp;
};

export function AppCard({ app }: AppCardProps) {
  const { navigate } = useAppNavigation();
  const tApps = useTranslations("Apps");
  const tCommon = useTranslations("Common");

  return (
    <Card color={app.color} className="grid min-h-64 content-between gap-6 p-6">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <Icon name={app.icon} size={64} bounce />
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-[#794f27]">
            {tCommon(app.status)}
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#794f27]">
            {tApps(app.titleKey)}
          </h2>
          <p className="text-base font-bold leading-7 text-[#725d42]">
            {tApps(app.summaryKey)}
          </p>
        </div>
      </div>
      <Button
        type="primary"
        block
        disabled={!app.href}
        onClick={() => {
          if (app.href) {
            navigate(app.href);
          }
        }}
      >
        {tCommon("open")}
      </Button>
    </Card>
  );
}
