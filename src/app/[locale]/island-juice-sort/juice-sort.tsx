"use client";

import { Button, Cursor, Footer } from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import { ChainMode } from "./mode-chain";
import { ConveyorMode } from "./mode-conveyor";
import { OrdersMode } from "./mode-orders";

type ModeId = "chain" | "orders" | "conveyor";

const MODES: { id: ModeId; tone: string }[] = [
  { id: "orders", tone: "border-[#ec4899] text-[#a3206a]" },
  { id: "conveyor", tone: "border-[#ff8c00] text-[#b85f00]" },
  { id: "chain", tone: "border-[#19c8b9] text-[#00766d]" },
];

export function IslandJuiceSort() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("IslandJuiceSort");
  const [mode, setMode] = useState<ModeId>("orders");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <div className="mx-auto max-w-6xl pt-6">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white/60 p-2 shadow-[0_2px_0_rgba(122,97,65,0.12)]">
            {MODES.map((m) => {
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex-1 rounded-xl border-2 px-4 py-2 text-left transition active:translate-y-[1px] sm:flex-none sm:min-w-[180px] ${
                    isActive
                      ? `${m.tone} bg-white shadow-[0_2px_0_rgba(0,0,0,0.08)]`
                      : "border-transparent bg-white/70 text-[#725d42] hover:border-[#d4c9b4]"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
                    {t(`mode.${m.id}.tag`)}
                  </p>
                  <p className="text-sm font-black">{t(`mode.${m.id}.name`)}</p>
                </button>
              );
            })}
          </div>
        </div>

        <section className="mx-auto max-w-6xl py-6">
          {mounted ? (
            <>
              {mode === "chain" ? <ChainMode /> : null}
              {mode === "orders" ? <OrdersMode /> : null}
              {mode === "conveyor" ? <ConveyorMode /> : null}
            </>
          ) : (
            <div className="h-[480px] rounded-2xl bg-white/30" />
          )}
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}
