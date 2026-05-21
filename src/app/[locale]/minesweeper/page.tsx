import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Minesweeper } from "./minesweeper";

type MinesweeperPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: MinesweeperPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Minesweeper" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function MinesweeperPage() {
  return <Minesweeper />;
}
