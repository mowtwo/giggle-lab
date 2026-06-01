"use client";

import { Button, Card, Divider } from "animal-island-ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AnimaleseText } from "@/components/animalese-text";

import { BoardCanvas } from "./board-shared";
import type { Bottle } from "./game-logic";
import { isBottleSorted } from "./game-logic";
import { useJuiceBoard } from "./use-board";

const CAPACITY = 4;
const SLOT_COUNT = 8;
const INITIAL_INTERVAL_MS = 14000;
const MIN_INTERVAL_MS = 5000;
const INTERVAL_DECAY_MS = 600;
const INITIAL_COLOR_POOL = 4;
const MAX_COLOR_POOL = 10;
const COLORS_GROW_EVERY = 5;
const SHIP_DELAY_MS = 520;
const BEST_KEY = "islandJuiceSort.conveyor.best";

function rand() {
  return Math.random();
}

function randomMixedBottle(colors: number): Bottle {
  const tokens: number[] = [];
  for (let i = 0; i < CAPACITY; i += 1)
    tokens.push(Math.floor(rand() * colors));
  return tokens;
}

function makeInitialBoard(colors: number): Bottle[] {
  const board: Bottle[] = [];
  const mixed = Math.min(colors, 4);
  for (let i = 0; i < mixed; i += 1) board.push(randomMixedBottle(colors));
  while (board.length < SLOT_COUNT) board.push([]);
  return board;
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

export function ConveyorMode() {
  const t = useTranslations("IslandJuiceSort");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [running, setRunning] = useState(true);
  const [colors, setColors] = useState(INITIAL_COLOR_POOL);
  const [intervalMs, setIntervalMs] = useState(INITIAL_INTERVAL_MS);
  const [nextTickAt, setNextTickAt] = useState(
    () => Date.now() + INITIAL_INTERVAL_MS,
  );
  const [now, setNow] = useState(() => Date.now());
  const [shipping, setShipping] = useState<Set<number>>(new Set());
  const [arriving, setArriving] = useState<Set<number>>(new Set());

  const initialBoard = useMemo(
    () => makeInitialBoard(INITIAL_COLOR_POOL),
    [],
  );

  const board = useJuiceBoard(initialBoard, CAPACITY);
  const { setOnPourCommit, replaceBoard, setBottleAt } = board;

  // Register pour-commit callback every render to keep closures fresh
  useEffect(() => {
    setOnPourCommit((info) => {
      if (!info.targetCompletedNow) return;
      const slot = info.move.to;
      setShipping((prev) => new Set(prev).add(slot));
      window.setTimeout(() => {
        setShipping((prev) => {
          const next = new Set(prev);
          next.delete(slot);
          return next;
        });
        setBottleAt(slot, []);
        setScore((s) => {
          const next = s + 1;
          setBest((b) => bumpStoredBest(Math.max(b, next)));
          if (next % COLORS_GROW_EVERY === 0) {
            setColors((c) => Math.min(MAX_COLOR_POOL, c + 1));
          }
          setIntervalMs((ms) =>
            Math.max(MIN_INTERVAL_MS, ms - INTERVAL_DECAY_MS),
          );
          return next;
        });
      }, SHIP_DELAY_MS);
    });
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setBest(Number.parseInt(stored, 10) || 0);
  }, []);

  // Clock tick — just advances `now` so the inflow scheduler effect re-evaluates
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  // Inflow scheduler: when `now` crosses `nextTickAt`, slide in a new bottle or end the run
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!running) return;
    if (now < nextTickAt) return;
    let emptyIndex = -1;
    for (let i = 0; i < board.bottles.length; i += 1) {
      if (board.bottles[i].length === 0 && !shipping.has(i)) {
        emptyIndex = i;
        break;
      }
    }
    if (emptyIndex < 0) {
      setRunning(false);
      return;
    }
    setBottleAt(emptyIndex, randomMixedBottle(colors));
    setArriving((prev) => new Set(prev).add(emptyIndex));
    const target = emptyIndex;
    window.setTimeout(() => {
      setArriving((prev) => {
        const next = new Set(prev);
        next.delete(target);
        return next;
      });
    }, 500);
    setNextTickAt(now + intervalMs);
  }, [
    now,
    nextTickAt,
    running,
    board.bottles,
    shipping,
    colors,
    intervalMs,
    setBottleAt,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const startRun = useCallback(() => {
    setScore(0);
    setColors(INITIAL_COLOR_POOL);
    setIntervalMs(INITIAL_INTERVAL_MS);
    setNextTickAt(Date.now() + INITIAL_INTERVAL_MS);
    setShipping(new Set());
    setArriving(new Set());
    setRunning(true);
    replaceBoard(makeInitialBoard(INITIAL_COLOR_POOL));
  }, [replaceBoard]);

  const fillBars = useMemo(() => {
    const total = board.bottles.length;
    const filled = board.bottles.filter(
      (b, i) => b.length > 0 || shipping.has(i),
    ).length;
    const completed = board.bottles.filter((b) =>
      isBottleSorted(b, CAPACITY),
    ).length;
    return { total, filled, completed };
  }, [board.bottles, shipping]);

  const tickProgress = running
    ? Math.max(0, Math.min(1, 1 - (nextTickAt - now) / intervalMs))
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <Card type="default" color="app-yellow" className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#b85f00]">
                {t("mode.conveyor.tag")}
              </p>
              <AnimaleseText
                as="h1"
                text={t("title")}
                cps={20}
                pitch={0.9}
                className="block text-balance text-3xl font-black leading-tight text-[#794f27] sm:text-4xl"
              />
              <p className="text-sm font-bold leading-6 text-[#725d42]">
                {t("mode.conveyor.description")}
              </p>
            </div>
            <Divider type="wave-yellow" />
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-black">
              <div className="rounded-lg bg-white/70 p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#b85f00]">
                  {t("mode.conveyor.interval")}
                </p>
                <p className="text-base text-[#794f27]">
                  {(intervalMs / 1000).toFixed(1)}s
                </p>
              </div>
              <div className="rounded-lg bg-white/70 p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#b85f00]">
                  {t("mode.conveyor.colors")}
                </p>
                <p className="text-base text-[#794f27]">{colors}</p>
              </div>
            </div>
            <p className="rounded-lg bg-white/70 p-3 text-xs font-bold leading-5 text-[#725d42]">
              {t("mode.conveyor.rules")}
            </p>
            <Button type="default" onClick={startRun}>
              {t("mode.conveyor.restart")}
            </Button>
          </div>
        </Card>
      </div>

      <div className="relative min-w-0 space-y-5">
        <Card color="app-yellow" className="relative min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-11 items-center rounded-lg bg-white/85 px-4 text-base font-black text-[#794f27]">
                {t("mode.conveyor.score", { score })}
              </span>
              <span className="inline-flex h-11 items-center rounded-lg bg-white/85 px-4 text-sm font-black text-[#794f27]">
                {t("mode.conveyor.best", { score: best })}
              </span>
              <span className="inline-flex h-11 items-center rounded-lg bg-white/85 px-4 text-sm font-black text-[#794f27]">
                {t("mode.conveyor.usage", {
                  filled: fillBars.filled,
                  total: fillBars.total,
                })}
              </span>
            </div>
          </div>

          <div className="mb-4 overflow-hidden rounded-full border-2 border-[#e3d6b8] bg-white/70">
            <motion.div
              animate={{ width: `${tickProgress * 100}%` }}
              transition={{ duration: 0.12, ease: "linear" }}
              className={`h-3 ${
                fillBars.filled >= fillBars.total - 1
                  ? "bg-[#ef233c]"
                  : "bg-[#ff8c00]"
              }`}
            />
          </div>

          <BoardCanvas
            bottles={board.bottles}
            capacity={CAPACITY}
            selected={board.selected}
            pour={board.pour}
            shipping={shipping}
            arriving={arriving}
            setBottleRef={board.setBottleRef}
            onBottleClick={board.handleBottleClick}
            disabledClick={!running}
          />

          <AnimatePresence>
            {!running ? (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 z-10 grid place-items-center"
              >
                <div className="pointer-events-auto rounded-2xl border-2 border-[#794f27] bg-[#fff8e1] px-6 py-5 text-center shadow-[0_6px_0_rgba(0,0,0,0.18)]">
                  <p className="text-xs font-black uppercase tracking-widest text-[#b85f00]">
                    {t("mode.conveyor.gameOverTag")}
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#794f27]">
                    {t("mode.conveyor.gameOverScore", { score })}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#725d42]">
                    {t("mode.conveyor.gameOverBest", { score: best })}
                  </p>
                  <div className="mt-4">
                    <Button type="primary" onClick={startRun}>
                      {t("mode.conveyor.tryAgain")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <p className="text-sm font-black text-[#b85f00]">
              {t("mode.conveyor.shipTitle")}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
              {t("mode.conveyor.shipBody")}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-black text-[#b85f00]">
              {t("mode.conveyor.pressureTitle")}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
              {t("mode.conveyor.pressureBody", {
                start: INITIAL_INTERVAL_MS / 1000,
                min: MIN_INTERVAL_MS / 1000,
              })}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
