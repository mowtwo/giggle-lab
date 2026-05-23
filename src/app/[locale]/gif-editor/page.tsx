import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GifEditor } from "./gif-editor";

type GifEditorPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: GifEditorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GifEditor" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function GifEditorPage() {
  return <GifEditor />;
}
