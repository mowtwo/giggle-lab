import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SchulteHive } from "./schulte-hive";

type SchulteHivePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SchulteHivePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SchulteHive" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function SchulteHivePage() {
  return <SchulteHive />;
}
