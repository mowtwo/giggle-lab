"use client";

import { Button, Card, Cursor, Divider, Footer, Icon } from "animal-island-ui";
import { useTranslations } from "next-intl";

import { AnimaleseText } from "@/components/animalese-text";
import { AppCard } from "@/components/app-card";
import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";
import { miniApps } from "@/lib/apps";

export default function Home() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const tHome = useTranslations("Home");

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button
            type="button"
            className="flex items-center gap-3 bg-transparent p-0 text-left"
            onClick={() => navigate("/")}
          >
            <Icon name="icon-diy" size={48} bounce />
            <div>
              <p className="text-xl font-black text-[#794f27]">Giggle Lab</p>
              <p className="text-sm font-bold text-[#9f927d]">
                {tCommon("brandSubtitle")}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <LocaleSwitch />
            <Button
              type="dashed"
              onClick={() => {
                window.location.href = "https://github.com/mowtwo/giggle-lab";
              }}
            >
              {tCommon("repo")}
            </Button>
          </div>
        </div>

        <section className="mx-auto grid max-w-6xl gap-8 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fffdf2] px-4 py-2 text-sm font-black text-[#794f27]">
              <Icon name="icon-chat" size={26} bounce />
              {tHome("todayOpen")}
            </div>

            <div className="space-y-4">
              <AnimaleseText
                as="h1"
                text={tHome("heroTitle")}
                cps={11}
                pitch={0.86}
                startDelay={2200}
                className="block text-balance text-5xl font-black leading-tight text-[#794f27] sm:text-7xl"
              />
              <p className="max-w-2xl text-lg font-bold leading-8 text-[#725d42]">
                {tHome("heroBody")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  if (miniApps[0]?.href) {
                    navigate(miniApps[0].href);
                  }
                }}
              >
                {tCommon("open")}
              </Button>
              <Button
                type="default"
                size="large"
                onClick={() => {
                  window.location.href = "https://github.com/mowtwo/giggle-lab";
                }}
              >
                {tCommon("source")}
              </Button>
            </div>
          </div>

          <Card type="title" color="app-teal" className="p-6">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Icon name="icon-diy" size={72} bounce />
                <div>
                  <p className="text-sm font-black text-[#00766d]">
                    {tHome("sampleLabel")}
                  </p>
                  <h2 className="text-3xl font-black text-[#794f27]">
                    {tHome("sampleTitle")}
                  </h2>
                </div>
              </div>
              <p className="text-lg font-bold leading-8 text-[#725d42]">
                {tHome("sampleBody")}
              </p>
              <Divider type="wave-yellow" />
              <p className="text-2xl font-black text-[#794f27]">
                {tHome("motto")}
              </p>
            </div>
          </Card>
        </section>

        <section id="mini-apps" className="mx-auto max-w-6xl py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#19c8b9]">
                {tHome("shelfEyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#794f27]">
                {tHome("shelfTitle")}
              </h2>
            </div>
            <span className="rounded-full bg-[#fffdf2] px-4 py-2 text-sm font-black text-[#8a7b66]">
              {tHome("shelfCount", { count: miniApps.length })}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {miniApps.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </div>
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}
