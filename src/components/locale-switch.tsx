"use client";

import { Button } from "animal-island-ui";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LocaleSwitch() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale: AppLocale = locale === "zh" ? "en" : "zh";

  return (
    <Button
      type="default"
      onClick={() => {
        router.replace(pathname, { locale: nextLocale });
      }}
    >
      {nextLocale === "zh" ? "中文" : "English"}
    </Button>
  );
}
