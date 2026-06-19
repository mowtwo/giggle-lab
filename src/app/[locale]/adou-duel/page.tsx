import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type AdouDuelPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AdouDuelPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdouDuel" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default function AdouDuelPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <iframe
        title="阿斗"
        src="/adou-laya/index.html"
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
        className="block h-svh w-screen border-0"
      />
    </main>
  );
}
