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
  // 用部署标识给 iframe 源加版本号:每次部署 ?v 变化,强制浏览器拉取最新的
  // /adou-laya/index.html(它再引用带版本号的 adou-rebuilt.js),从根上避免
  // iframe 缓存旧 index.html 导致加载到旧业务代码("函数不存在"之类)。
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "dev";
  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <iframe
        title="阿斗"
        src={`/adou-laya/index.html?v=${buildId}`}
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
        className="block h-svh w-screen border-0"
      />
    </main>
  );
}
