"use client";

import { Button, Card, Divider } from "animal-island-ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimaleseText } from "@/components/animalese-text";
import { playSfx } from "@/lib/audio/state";

import { BoardCanvas, Confetti } from "./board-shared";
import {
  isBottleSorted,
  solveBottles,
  type Bottle,
} from "./game-logic";
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
const TIER_TOOL_GIFT = 1;
const INITIAL_SKIPS = 2;
const INITIAL_CLEARS = 2;
const INITIAL_REFRESHES = 2;
const MAX_TOOL_STOCK = 5;
const SHIP_REFILL_DELAY_MS = 460;
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

type ToolKind = "skip" | "clear" | "refresh";

type Order = {
  id: number;
  color: number;
  patienceMs: number;
  spawnedAt: number;
};

function rand() {
  return Math.random();
}

function rawShuffleDeal(colorCount: number, emptyBottles: number): Bottle[] {
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

function solvableDeal(colorCount: number, emptyBottles: number): Bottle[] {
  const budget = colorCount <= 5 ? 40000 : 30000;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const board = rawShuffleDeal(colorCount, emptyBottles);
    const solution = solveBottles(board, CAPACITY, budget);
    if (solution && solution.length > 0) return board;
  }
  return rawShuffleDeal(colorCount, emptyBottles);
}

function isBoardWorkable(board: Bottle[]): boolean {
  let emptySlots = 0;
  const counts = new Map<number, number>();
  for (const b of board) {
    if (b.length === 0) emptySlots += 1;
    for (const c of b) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  if (emptySlots === 0) return false;
  for (const v of counts.values()) if (v >= CAPACITY) return true;
  return false;
}

function safeReplacement(
  board: Bottle[],
  slot: number,
  colorCount: number,
): Bottle {
  const baseBoard = board.map((b, i) => (i === slot ? [] : [...b]));
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const tokens: number[] = [];
    for (let k = 0; k < CAPACITY; k += 1) {
      tokens.push(Math.floor(rand() * colorCount));
    }
    const trial = baseBoard.map((b) => [...b]);
    trial[slot] = tokens;
    if (isBoardWorkable(trial)) return tokens;
  }
  return [];
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

function findCompleteBottleByColor(board: Bottle[], color: number): number {
  for (let i = 0; i < board.length; i += 1) {
    if (isBottleSorted(board[i], CAPACITY) && board[i][0] === color) return i;
  }
  return -1;
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
  const [tools, setTools] = useState<Record<ToolKind, number>>({
    skip: INITIAL_SKIPS,
    clear: INITIAL_CLEARS,
    refresh: INITIAL_REFRESHES,
  });
  const [toolMode, setToolMode] = useState<ToolKind | null>(null);

  const tierIndexRef = useRef(tierIndex);
  useEffect(() => {
    tierIndexRef.current = tierIndex;
  });

  const initialBottles = useMemo(
    () =>
      solvableDeal(TIER_CONFIGS[0].colors, TIER_CONFIGS[0].emptyBottles),
    [],
  );

  const board = useJuiceBoard(initialBottles, CAPACITY);
  const { replaceBoard, setBottleAt, bottles } = board;

  // Reward calc based on patience remaining at fulfillment time.
  const rewardForOrder = useCallback((order: Order, elapsedMs: number) => {
    const ratio = Math.max(0, 1 - elapsedMs / order.patienceMs);
    return BASE_REWARD + Math.round(FAST_BONUS * ratio);
  }, []);

  // One unified fulfillment path. Handles ALL ways an order gets shipped:
  // player completes a bottle whose colour matches an active order, OR a new
  // order spawns (from expiry / skip / refresh) that matches a bottle that
  // was already sitting complete on the board.
  const fulfillOrder = useCallback(
    (order: Order, slot: number, snapshotBoard: Bottle[]) => {
      const elapsed = Date.now() - order.spawnedAt;
      const reward = rewardForOrder(order, elapsed);

      setScore((s) => {
        const nextScore = s + reward;
        setBest((b) => bumpStoredBest(Math.max(b, nextScore)));
        return nextScore;
      });

      setShipping((prev) => new Set(prev).add(slot));

      setOrders((prev) => {
        const without = prev.filter((o) => o.id !== order.id);
        const tier =
          TIER_CONFIGS[Math.min(tierIndexRef.current, TIER_CONFIGS.length - 1)];
        while (without.length < ORDER_SLOTS) {
          without.push(makeOrder(tier.colors, tier.patienceMs));
        }
        return without;
      });

      setOrdersFulfilled((n) => {
        const next = n + 1;
        const targetTier = Math.min(
          Math.floor(next / ORDERS_PER_TIER),
          TIER_CONFIGS.length - 1,
        );
        setTierIndex((cur) => {
          if (targetTier > cur) {
            const nt = TIER_CONFIGS[targetTier];
            setScore((s) => {
              const v = s + TIER_UP_BONUS;
              setBest((b) => bumpStoredBest(Math.max(b, v)));
              return v;
            });
            setTierUpFlash((f) => f + 1);
            setTools((prevTools) => ({
              skip: Math.min(MAX_TOOL_STOCK, prevTools.skip + TIER_TOOL_GIFT),
              clear: Math.min(
                MAX_TOOL_STOCK,
                prevTools.clear + TIER_TOOL_GIFT,
              ),
              refresh: Math.min(
                MAX_TOOL_STOCK,
                prevTools.refresh + TIER_TOOL_GIFT,
              ),
            }));
            void playSfx("tier-up");
            replaceBoard(solvableDeal(nt.colors, nt.emptyBottles));
            setOrders((prevOrders) =>
              prevOrders.map((o) => ({
                ...o,
                spawnedAt: Date.now(),
                patienceMs: nt.patienceMs,
              })),
            );
            return targetTier;
          }
          return cur;
        });
        return next;
      });

      window.setTimeout(() => {
        setShipping((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(slot);
          return nextSet;
        });
        const tier =
          TIER_CONFIGS[Math.min(tierIndexRef.current, TIER_CONFIGS.length - 1)];
        const projected = snapshotBoard.map((b, i) =>
          i === slot ? [] : [...b],
        );
        setBottleAt(
          slot,
          safeReplacement(projected, slot, tier.colors),
        );
      }, SHIP_REFILL_DELAY_MS);
    },
    [rewardForOrder, setBottleAt, replaceBoard],
  );

  // Single matching effect — replaces all the scattered cascade checks.
  // Runs whenever orders or bottles change. Picks the first
  // (order, complete-bottle-of-matching-color) pair where the bottle isn't
  // already being shipped, and fulfills it. Re-renders trigger another pass
  // for cascades.
  useEffect(() => {
    for (const order of orders) {
      const slot = findCompleteBottleByColor(bottles, order.color);
      if (slot < 0) continue;
      if (shipping.has(slot)) continue;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fulfillOrder(order, slot, bottles);
      return;
    }
  }, [orders, bottles, shipping, fulfillOrder]);

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
        const cfg =
          TIER_CONFIGS[Math.min(tierIndexRef.current, TIER_CONFIGS.length - 1)];
        while (surviving.length < ORDER_SLOTS) {
          surviving.push(makeOrder(cfg.colors, cfg.patienceMs));
        }
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
    setTools({
      skip: INITIAL_SKIPS,
      clear: INITIAL_CLEARS,
      refresh: INITIAL_REFRESHES,
    });
    setToolMode(null);
    const first = TIER_CONFIGS[0];
    setOrders(
      Array.from({ length: ORDER_SLOTS }, () =>
        makeOrder(first.colors, first.patienceMs),
      ),
    );
    replaceBoard(solvableDeal(first.colors, first.emptyBottles));
  }, [replaceBoard]);

  const applySkipOnOrder = useCallback(
    (orderId: number) => {
      const tier =
        TIER_CONFIGS[Math.min(tierIndexRef.current, TIER_CONFIGS.length - 1)];
      setOrders((prev) => {
        const without = prev.filter((o) => o.id !== orderId);
        while (without.length < ORDER_SLOTS) {
          without.push(makeOrder(tier.colors, tier.patienceMs));
        }
        return without;
      });
      setTools((prev) => ({ ...prev, skip: Math.max(0, prev.skip - 1) }));
      setToolMode(null);
    },
    [],
  );

  const applyClearOnBottle = useCallback(
    (slotIndex: number) => {
      if (bottles[slotIndex].length === 0) {
        setToolMode(null);
        return;
      }
      setBottleAt(slotIndex, []);
      setTools((prev) => ({ ...prev, clear: Math.max(0, prev.clear - 1) }));
      setToolMode(null);
      void playSfx("tap");
    },
    [bottles, setBottleAt],
  );

  const applyRefreshOnBottle = useCallback(
    (slotIndex: number) => {
      if (bottles[slotIndex].length === 0) {
        setToolMode(null);
        return;
      }
      const tier =
        TIER_CONFIGS[Math.min(tierIndexRef.current, TIER_CONFIGS.length - 1)];
      // Re-roll the bottle's contents until the resulting board is workable.
      // Length stays the same so the player keeps the breathing room they had.
      const length = bottles[slotIndex].length;
      let chosen: number[] = [];
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const tokens: number[] = [];
        for (let k = 0; k < length; k += 1) {
          tokens.push(Math.floor(Math.random() * tier.colors));
        }
        const trial = bottles.map((b, i) => (i === slotIndex ? tokens : [...b]));
        if (isBoardWorkable(trial)) {
          chosen = tokens;
          break;
        }
        chosen = tokens;
      }
      setBottleAt(slotIndex, chosen);
      setTools((prev) => ({
        ...prev,
        refresh: Math.max(0, prev.refresh - 1),
      }));
      setToolMode(null);
      void playSfx("pour");
    },
    [bottles, setBottleAt],
  );

  const handleBottleClick = useCallback(
    (i: number) => {
      if (toolMode === "clear") {
        applyClearOnBottle(i);
        return;
      }
      if (toolMode === "refresh") {
        applyRefreshOnBottle(i);
        return;
      }
      if (toolMode === "skip") {
        setToolMode(null);
        return;
      }
      board.handleBottleClick(i);
    },
    [board, toolMode, applyClearOnBottle, applyRefreshOnBottle],
  );

  const activateTool = useCallback(
    (kind: ToolKind) => {
      if (tools[kind] <= 0) return;
      setToolMode((prev) => (prev === kind ? null : kind));
    },
    [tools],
  );

  useEffect(() => {
    if (!toolMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolMode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolMode]);

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
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton
                kind="skip"
                count={tools.skip}
                active={toolMode === "skip"}
                onClick={() => activateTool("skip")}
                label={t("mode.orders.skipTool")}
              />
              <ToolButton
                kind="clear"
                count={tools.clear}
                active={toolMode === "clear"}
                onClick={() => activateTool("clear")}
                label={t("mode.orders.clearTool")}
              />
              <ToolButton
                kind="refresh"
                count={tools.refresh}
                active={toolMode === "refresh"}
                onClick={() => activateTool("refresh")}
                label={t("mode.orders.refreshTool")}
              />
            </div>
          </div>

          <AnimatePresence>
            {toolMode ? (
              <motion.div
                key={toolMode}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-3 rounded-xl border-2 border-dashed border-[#ec4899] bg-[#fdf2f8] p-2 text-center text-xs font-black text-[#a3206a]"
              >
                {toolMode === "skip"
                  ? t("mode.orders.skipPrompt")
                  : toolMode === "clear"
                    ? t("mode.orders.clearPrompt")
                    : t("mode.orders.refreshPrompt")}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {orders.map((o, i) => {
              const elapsed = now - o.spawnedAt;
              const remaining = Math.max(0, o.patienceMs - elapsed);
              const pct = Math.max(0, Math.min(1, remaining / o.patienceMs));
              const color = JUICE_COLORS[o.color];
              const isUrgent = pct < 0.3;
              const isTarget = toolMode === "skip";
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ scale: 0.6, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.4, opacity: 0, y: -12 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  onClick={isTarget ? () => applySkipOnOrder(o.id) : undefined}
                  role={isTarget ? "button" : undefined}
                  tabIndex={isTarget ? 0 : undefined}
                  className={`relative overflow-hidden rounded-xl border-2 bg-white/85 p-3 transition ${
                    isTarget
                      ? "cursor-pointer border-[#ec4899] ring-2 ring-[#ec4899]/40 hover:bg-[#fdf2f8] active:translate-y-[1px]"
                      : isUrgent
                        ? "border-[#ef233c]"
                        : "border-[#e3d6b8]"
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

          <div
            className={
              toolMode === "clear" || toolMode === "refresh"
                ? "rounded-2xl ring-2 ring-[#ec4899]/40"
                : undefined
            }
          >
            <BoardCanvas
              bottles={board.bottles}
              capacity={CAPACITY}
              selected={board.selected}
              pour={board.pour}
              shipping={shipping}
              setBottleRef={board.setBottleRef}
              onBottleClick={handleBottleClick}
            />
          </div>
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
              {t("mode.orders.toolsTitle")}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
              {t("mode.orders.toolsBody", {
                skip: INITIAL_SKIPS,
                clear: INITIAL_CLEARS,
                gift: TIER_TOOL_GIFT,
              })}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  count,
  active,
  onClick,
  label,
}: {
  kind: ToolKind;
  count: number;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  const disabled = count <= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-11 items-center gap-2 rounded-lg border-2 px-3 text-xs font-black transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-[#ec4899] bg-[#fdf2f8] text-[#a3206a] shadow-[0_2px_0_rgba(236,72,153,0.4)]"
          : "border-[#d4c9b4] bg-white/90 text-[#7a6141] hover:border-[#ec4899]/60"
      }`}
    >
      {label}
      <span
        className={`grid h-6 min-w-[24px] place-items-center rounded-full px-1 text-[10px] font-black ${
          disabled
            ? "bg-[#eadfca] text-[#a89679]"
            : "bg-[#ec4899] text-white"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
