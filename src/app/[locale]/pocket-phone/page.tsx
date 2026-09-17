import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PocketPhone } from "./pocket-phone";

type PocketPhonePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PocketPhonePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PocketPhone" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function PocketPhonePage() {
  return <PocketPhone />;
}
