import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ScreenRecorder } from "./screen-recorder";

type ScreenRecorderPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ScreenRecorderPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ScreenRecorder" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function ScreenRecorderPage() {
  return <ScreenRecorder />;
}
