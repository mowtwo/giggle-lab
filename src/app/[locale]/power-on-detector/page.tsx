import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PowerOnDetector } from "./power-on-detector";

type PowerOnPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PowerOnPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PowerOn" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function PowerOnDetectorPage() {
  return <PowerOnDetector />;
}
