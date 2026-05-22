import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AudioToggle } from "@/components/audio-toggle";
import { NavigationProvider } from "@/components/navigation-provider";
import { TanukiCompanion } from "@/components/tanuki-companion";
import { routing } from "@/i18n/routing";
import { AudioProvider } from "@/lib/audio/provider";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <AudioProvider>
        <NavigationProvider>{children}</NavigationProvider>
        <TanukiCompanion />
        <AudioToggle />
      </AudioProvider>
    </NextIntlClientProvider>
  );
}
