import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SongjiangDuel } from "./songjiang-duel";

type SongjiangDuelPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SongjiangDuelPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SongjiangDuel" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function SongjiangDuelPage() {
  return <SongjiangDuel />;
}
