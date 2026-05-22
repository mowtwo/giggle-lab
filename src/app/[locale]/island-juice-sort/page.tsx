import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { IslandJuiceSort } from "./juice-sort";

type IslandJuiceSortPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: IslandJuiceSortPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "IslandJuiceSort" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function IslandJuiceSortPage() {
  return <IslandJuiceSort />;
}

