import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MiniOfficeWeb } from "./mini-office-web";

type MiniOfficeWebPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: MiniOfficeWebPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MiniOfficeWeb" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function MiniOfficeWebPage() {
  return <MiniOfficeWeb />;
}
