"use client";

import { Button, Card, Divider } from "animal-island-ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AnimaleseText } from "@/components/animalese-text";
import { playSfx } from "@/lib/audio/state";

import { BoardCanvas, Confetti } from "./board-shared";
import { type Bottle } from "./game-logic";
import { JUICE_COLORS } from "./palette";
import { useJuiceBoard } from "./use-board";

type TierConfig = {
  colors: number;
  emptyBottles: number;
  patienceMs: number;
};

const CAPACITY = 4;
const ORDER_SLOTS = 3;
const ORDERS_PER_TIER = 5;
const BASE_REWARD = 20;
const FAST_BONUS = 25;
const EXPIRE_PENALTY = 5;
const TIER_UP_BONUS = 30;
const BEST_KEY = "islandJuiceSort.orders.best";

const TIER_CONFIGS: TierConfig[] = [
  { colors: 4, emptyBottles: 2, patienceMs: 60000 },
  { colors: 5, emptyBottles: 2, patienceMs: 56000 },
  { colors: 6, emptyBottles: 2, patienceMs: 52000 },
  { colors: 7, emptyBottles: 2, patienceMs: 48000 },
  { colors: 8, emptyBottles: 2, patienceMs: 44000 },
  { colors: 9, emptyBottles: 3, patienceMs: 40000 },
  { colors: 10, emptyBottles: 3, patienceMs: 36000 },
];

type Order = {
  id: number;
  color: number;
  patienceMs: number;
  spawnedAt: number;
};

function rand() {
  return Math.random();
}

function shuffleDeal(colorCount: number, emptyBottles: number): Bottle[] {
  const tokens: number[] = [];
  for (let c = 0; c < colorCount; c += 1) {
    for (let k = 0; k < CAPACITY; k += 1) tokens.push(c);
  }
  for (let i = tokens.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }
  const bottles: Bottle[] = [];
  for (let i = 0; i < colorCount; i += 1) {
    bottles.push(tokens.slice(i * CAPACITY, (i + 1) * CAPACITY));
  }
  for (let i = 0; i < emptyBottles; i += 1) bottles.push([]);
  return bottles;
}

function mixedBottleFromPool(colorCount: number): Bottle {
  const tokens: number[] = [];
  for (let i = 0; i < CAPACITY; i += 1) {
    tokens.push(Math.floor(rand() * colorCount));
  }
  return tokens;
}

let ORDER_ID = 1;
function makeOrder(colorCount: number, patienceMs: number): Order {
  return {
    id: ORDER_ID++,
    color: Math.floor(rand() * colorCount),
    patienceMs,
    spawnedAt: Date.now(),
  };
}

function bumpStoredBest(score: number) {
  const stored = Number.parseInt(
    window.localStorage.getItem(BEST_KEY) ?? "0",
    10,
  );
  if (score > stored) {
    window.localStorage.setItem(BEST_KEY, String(score));
    return score;
  }
  return stored;
}

export function OrdersMode() {
  const t = useTranslations("IslandJuiceSort");
  const [tierIndex, setTierIndex] = useState(0);
  const [ordersFulfilled, setOrdersFulfilled] = useState(0);
  const [ordersExpired, setOrdersExpired] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [orders, setOrders] = useState<Order[]>(() => {
    const first = TIER_CONFIGS[0];
    return Array.from({ length: ORDER_SLOTS }, () =>
      makeOrder(first.colors, first.patienceMs),
    );
  });
  const [shipping, setShipping] = useState<Set<number>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [tierUpFlash, setTierUpFlash] = useState(0);

  const initialBottles = useMemo(
    () => shuffleDeal(TIER_CONFIGS[0].colors, TIER_CONFIGS[0].emptyBottles),
    [],
  );

  const board = useJuiceBoard(initialBottles, CAPACITY);
  const { setOnPourCommit, replaceBoard, setBottleAt } = board;

  // Register pour-commit callback every render to keep closures fresh
  useEffect(() => {
    setOnPourCommit((info) => {
      if (!info.targetCompletedNow) return;
      const completedColor = info.after[info.move.to][0];
      const slotIndex = info.move.to;

      setOrders((currentOrders) => {
        const matchIdx = currentOrders.findIndex(
          (o) => o.color === completedColor,
        );
        if (matchIdx < 0) return currentOrders;
        const matchedOrder = currentOrders[matchIdx];
        const elapsed = Date.now() - matchedOrder.spawnedAt;
        const ratio = Math.max(0, 1 - elapsed / matchedOrder.patienceMs);
        const reward = BASE_REWARD + Math.round(FAST_BONUS * ratio);

        setScore((s) => {
          const next = s + reward;
          setBest((b) => bumpStoredBest(Math.max(b, next)));
          return next;
        });

        setShipping((prev) => new Set(prev).add(slotIndex));

        setOrdersFulfilled((n) => {
          const next = n + 1;
          const targetTier = Math.min(
            Math.floor(next / ORDERS_PER_TIER),
            TIER_CONFIGS.length - 1,
          );
          setTierIndex((currentTier) => {
            if (targetTier > currentTier) {
              const nt = TIER_CONFIGS[targetTier];
              setScore((s) => {
                const v = s + TIER_UP_BONUS;
                setBest((b) => bumpStoredBest(Math.max(b, v)));
                return v;
              });
              setTierUpFlash((f) => f + 1);
              void playSfx("tier-up");
              replaceBoard(shuffleDeal(nt.colors, nt.emptyBottles));
              setOrders((prevOrders) =>
                prevOrders.map((o) => ({
                  ...o,
                  spawnedAt: Date.now(),
                  patienceMs: nt.patienceMs,
                })),
              );
              return targetTier;
            }
            return currentTier;
          });
          return next;
        });

        const activeTier =
          TIER_CONFIGS[Math.min(tierIndex, TIER_CONFIGS.length - 1)];
        window.setTimeout(() => {
          setShipping((prev) => {
            const next = new Set(prev);
            next.delete(slotIndex);
            return next;
          });
          setBottleAt(slotIndex, mixedBottleFromPool(activeTier.colors));
        }, 460);

        const next = currentOrders.filter((o) => o.id !== matchedOrder.id);
        next.push(makeOrder(activeTier.colors, activeTier.patienceMs));
        return next;
      });
    });
  });

  // Persisted best score: read once on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setBest(Number.parseInt(stored, 10) || 0);
  }, []);

  // Tick + expiration scan inside the same interval
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setOrders((prev) => {
        const expiredIds = prev
          .filter((o) => t - o.spawnedAt >= o.patienceMs)
          .map((o) => o.id);
        if (expiredIds.length === 0) return prev;
        const surviving = prev.filter((o) => !expiredIds.includes(o.id));
        setTierIndex((currentTier) => {
          const cfg =
            TIER_CONFIGS[Math.min(currentTier, TIER_CONFIGS.length - 1)];
          while (surviving.length < ORDER_SLOTS) {
            surviving.push(makeOrder(cfg.colors, cfg.patienceMs));
          }
          return currentTier;
        });
        setOrdersExpired((n) => n + expiredIds.length);
        setScore((s) => Math.max(0, s - EXPIRE_PENALTY * expiredIds.length));
        return surviving;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  const startRun = useCallback(() => {
    setTierIndex(0);
    setOrdersFulfilled(0);
    setOrdersExpired(0);
    setScore(0);
    setShipping(new Set());
    const first = TIER_CONFIGS[0];
    setOrders(
      Array.from({ length: ORDER_SLOTS }, () =>
        makeOrder(first.colors, first.patienceMs),
      ),
    );
    replaceBoard(shuffleDeal(first.colors, first.emptyBottles));
  }, [replaceBoard]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <Card type="title" color="app-pink" className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#a3206a]">
                {t("mode.orders.tag")}
              </p>
              <AnimaleseText
                as="h1"
                text={t("title")}
                cps={20}
                pitch={1.05}
                className="block text-balance text-3xl font-black leading-tight text-[#794f27] sm:text-4xl"
              />
              <p className="text-sm font-bold leading-6 text-[#725d42]">
                {t("mode.orders.description")}
              </p>
            </div>
            <Divider type="wave-yellow" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
              <div className="rounded-lg bg-white/70 p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#a3206a]">
                  {t("mode.orders.tier")}
                </p>
                <p className="text-base text-[#794f27]">{tierIndex + 1}</p>
              </div>
              <div className="rounded-lg bg-white/70 p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#a3206a]">
                  {t("mode.orders.fulfilled")}
                </p>
                <p className="text-base text-[#794f27]">{ordersFulfilled}</p>
              </div>
              <div className="rounded-lg bg-white/70 p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#a3206a]">
                  {t("mode.orders.expired")}
                </p>
                <p className="text-base text-[#794f27]">{ordersExpired}</p>
              </div>
            </div>
            <p className="rounded-lg bg-white/70 p-3 text-xs font-bold leading-5 text-[#725d42]">
              {t("mode.orders.rules")}
            </p>
            <Button type="default" onClick={startRun}>
              {t("mode.orders.restart")}
            </Button>
          </div>
        </Card>
      </div>

      <div className="relative min-w-0 space-y-5">
        <Card color="app-pink" className="relative min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-11 items-center rounded-lg bg-white/85 px-4 text-base font-black text-[#794f27]">
                {t("mode.orders.score", { score })}
              </span>
              <span className="inline-flex h-11 items-center rounded-lg bg-white/85 px-4 text-sm font-black text-[#794f27]">
                {t("mode.orders.best", { score: best })}
              </span>
              <AnimatePresence>
                {tierUpFlash > 0 ? (
                  <motion.span
                    key={tierUpFlash}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 360, damping: 18 }}
                    className="inline-flex h-11 items-center rounded-lg bg-[#fff1a8] px-4 text-sm font-black text-[#794f27] shadow-[0_2px_0_rgba(0,0,0,0.08)]"
                  >
                    ✨ {t("mode.orders.tierUp", { tier: tierIndex + 1 })}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {orders.map((o, i) => {
              const elapsed = now - o.spawnedAt;
              const remaining = Math.max(0, o.patienceMs - elapsed);
              const pct = Math.max(0, Math.min(1, remaining / o.patienceMs));
              const color = JUICE_COLORS[o.color];
              const isUrgent = pct < 0.3;
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ scale: 0.6, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.4, opacity: 0, y: -12 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={`relative overflow-hidden rounded-xl border-2 bg-white/85 p-3 ${
                    isUrgent ? "border-[#ef233c]" : "border-[#e3d6b8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-full border-2 border-white shadow"
                      style={{ background: color.fill }}
                    >
                      <span className="text-[10px] font-black text-white drop-shadow">
                        #{i + 1}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[#794f27]">
                        {t(`mode.orders.colorLabel.${color.labelKey}`)}
                      </p>
                      <p className="text-[10px] font-bold text-[#a3206a]">
                        {t("mode.orders.askOneBottle")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4e7d8]">
                    <motion.div
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ duration: 0.12, ease: "linear" }}
                      className={`h-full rounded-full ${isUrgent ? "bg-[#ef233c]" : "bg-[#19c8b9]"}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <BoardCanvas
            bottles={board.bottles}
            capacity={CAPACITY}
            selected={board.selected}
            pour={board.pour}
            shipping={shipping}
            setBottleRef={board.setBottleRef}
            onBottleClick={board.handleBottleClick}
          />
          {tierUpFlash > 0 ? (
            <Confetti
              key={tierUpFlash}
              seed={tierUpFlash * 9176 + tierIndex}
              density={20}
            />
          ) : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <p className="text-sm font-black text-[#a3206a]">
              {t("mode.orders.rewardTitle")}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
              {t("mode.orders.rewardBody", {
                base: BASE_REWARD,
                fast: BASE_REWARD + FAST_BONUS,
                tierBonus: TIER_UP_BONUS,
                penalty: EXPIRE_PENALTY,
              })}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-black text-[#a3206a]">
              {t("mode.orders.tierTitle")}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
              {t("mode.orders.tierBody", { every: ORDERS_PER_TIER })}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
