import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GithubDanmaku } from "./github-danmaku";

type GithubDanmakuPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: GithubDanmakuPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GithubDanmaku" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function GithubDanmakuPage() {
  return <GithubDanmaku />;
}

