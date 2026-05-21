import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { HeartCardEditor } from "./heart-card-editor";

type HeartCardEditorPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HeartCardEditorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HeartCard" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function HeartCardEditorPage() {
  return <HeartCardEditor />;
}
