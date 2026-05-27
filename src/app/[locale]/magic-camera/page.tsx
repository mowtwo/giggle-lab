import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MagicCamera } from "./magic-camera";

type MagicCameraPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: MagicCameraPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MagicCamera" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function MagicCameraPage() {
  return <MagicCamera />;
}
