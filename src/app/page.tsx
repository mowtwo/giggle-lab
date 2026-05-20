import { ArrowRight, Beaker, Code, Leaf, Plus, Sparkles } from "lucide-react";

import { AppCard } from "@/components/app-card";
import { Button } from "@/components/ui/button";
import { miniApps } from "@/lib/apps";

export default function Home() {
  return (
    <main className="min-h-svh overflow-hidden">
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="island-organic island-panel flex items-center gap-3 px-4 py-3">
            <div className="flex size-11 items-center justify-center rounded-[18px] bg-[#f7cd67] text-[#725d42] shadow-[0_4px_0_rgba(107,92,67,0.18)]">
              <Beaker className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-none">
                Giggle Lab
              </p>
              <p className="mt-1 text-xs font-semibold text-[#9f927d]">
                Funny island workshop
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="bg-[#fffdf2]">
            <Code aria-hidden="true" />
            Repo
          </Button>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-end md:pb-20 md:pt-14">
        <div className="absolute -left-28 top-8 size-64 rounded-full bg-[#ffcc00]/25 blur-3xl" />
        <div className="absolute -right-24 top-20 size-72 rounded-full bg-[#19c8b9]/25 blur-3xl" />
        <div className="space-y-6">
          <div className="island-press inline-flex items-center gap-2 rounded-full border-2 border-[#f8f8f0] bg-[#f8f8f0] px-4 py-2 text-sm font-bold text-[#794f27]">
            <Sparkles className="size-4 text-[#f5c31c]" aria-hidden="true" />
            今日营业中
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-[0.01em] text-[#794f27] sm:text-7xl">
              小网页，大发电。
            </h1>
            <p className="max-w-2xl text-lg font-semibold leading-8 text-[#725d42] sm:text-xl">
              把离谱点子、临时脑洞和会让人笑出声的小工具都收进一个温暖的岛上实验室。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg">
              <Plus aria-hidden="true" />
              新建小应用
            </Button>
            <Button variant="secondary" size="lg">
              浏览货架
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="island-organic island-panel relative grid p-5">
          <div className="absolute -right-4 -top-4 flex size-14 rotate-12 items-center justify-center rounded-full bg-[#d1da49] text-[#3d5a1a] shadow-[0_5px_0_#9fb23b]">
            <Leaf className="size-7" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["坏点子", "半成品", "按钮"].map((label, index) => (
              <div
                key={label}
                className="rounded-[20px] border-2 border-[#e8dcc8] bg-[#fffdf2] p-4 text-center shadow-[0_3px_0_#d4c9b4]"
              >
                <p className="text-3xl font-black text-[#8b7355]">
                  {[12, 7, 42][index]}
                </p>
                <p className="mt-1 text-xs font-bold text-[#9f927d]">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[24px] bg-[#19c8b9] p-5 text-white shadow-[0_5px_0_#11a89b]">
            <p className="text-sm font-bold">Current lab motto</p>
            <p className="mt-2 text-3xl font-black tracking-[0.01em]">
              Ship the joke before it expires.
            </p>
          </div>
        </div>
      </section>

      <section className="relative border-y-2 border-[#d8d0c3] bg-[#fffdf2]/70 py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#19c8b9]">
                Mini apps
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[0.01em]">
                Lab shelf
              </h2>
            </div>
            <p className="rounded-full bg-[#f0e8d8] px-4 py-2 text-sm font-bold text-[#8a7b66]">
              {miniApps.length} experiments
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {miniApps.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
