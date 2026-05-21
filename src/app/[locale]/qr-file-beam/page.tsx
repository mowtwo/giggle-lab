import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QrFileBeam } from "./qr-file-beam";

type QrFileBeamPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: QrFileBeamPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "QrFileBeam" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function QrFileBeamPage() {
  return <QrFileBeam />;
}
