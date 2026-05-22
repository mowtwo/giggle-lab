"use client";

import { Button, Card, Cursor, Divider, Footer, Icon } from "animal-island-ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import { playComplete, playPour, playWin, unlockAudio } from "./audio";
import { Bottle } from "./bottle";
import {
  applyMove,
  canPour,
  cloneBottles,
  DIFFICULTY_CONFIG,
  generatePuzzle,
  isBottleSorted,
  isSolved,
  type Bottle as BottleState,
  type Difficulty,
  type Move,
  type Puzzle,
} from "./game-logic";
import { JUICE_COLORS } from "./palette";

const DIFFICULTIES: Difficulty[] = ["cozy", "normal", "tricky", "expert"];
const INITIAL_SEED = 0x51a7d00d;
const POUR_DELAY_MS = 220;
const POUR_RESET_MS = 460;

type GameSnapshot = {
  bottles: BottleState[];
  moves: number;
};

type PourState = {
  from: number;
  to: number;
  tilt: "left" | "right";
};

function hash01(seed: number, salt: number) {
  let t = ((seed >>> 0) + Math.imul(salt | 1, 0x6d2b79f5)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function Confetti({ seed }: { seed: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: hash01(seed, i * 7 + 1) * 100,
        delay: hash01(seed, i * 7 + 2) * 0.45,
        color:
          JUICE_COLORS[
            Math.floor(hash01(seed, i * 7 + 3) * JUICE_COLORS.length)
          ].fill,
        rotation: hash01(seed, i * 7 + 4) * 720 - 360,
        duration: 1.5 + hash01(seed, i * 7 + 5) * 0.9,
        shape: hash01(seed, i * 7 + 6) > 0.4 ? "square" : "circle",
        drift: hash01(seed, i * 7 + 7) * 80 - 40,
      })),
    [seed],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ top: "-12%", opacity: 1, x: 0 }}
          animate={{ top: "115%", opacity: [1, 1, 0], x: p.drift, rotate: p.rotation }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            left: `${p.left}%`,
            background: p.color,
            borderRadius: p.shape === "circle" ? "9999px" : "2px",
          }}
          className="absolute h-3 w-2 shadow-[0_1px_0_rgba(0,0,0,0.15)]"
        />
      ))}
    </div>
  );
}

export function IslandJuiceSort() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("IslandJuiceSort");

  const [difficulty, setDifficulty] = useState<Difficulty>("cozy");
  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generatePuzzle("cozy", INITIAL_SEED),
  );
  const [bottles, setBottles] = useState<BottleState[]>(() =>
    cloneBottles(puzzle.bottles),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<GameSnapshot[]>([]);
  const [moves, setMoves] = useState(0);
  const [pour, setPour] = useState<PourState | null>(null);

  const bottleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const setBottleRef = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      bottleRefs.current[index] = node;
    },
    [],
  );

  const won = useMemo(
    () => isSolved(bottles, puzzle.config.capacity),
    [bottles, puzzle.config.capacity],
  );
  const canUndo = history.length > 0 && !pour;

  const startPuzzle = useCallback(
    (nextDifficulty: Difficulty, seed?: number) => {
      const nextPuzzle = generatePuzzle(nextDifficulty, seed);
      setDifficulty(nextDifficulty);
      setPuzzle(nextPuzzle);
      setBottles(cloneBottles(nextPuzzle.bottles));
      setSelected(null);
      setHistory([]);
      setMoves(0);
      setPour(null);
    },
    [],
  );

  const resetPuzzle = useCallback(() => {
    setBottles(cloneBottles(puzzle.bottles));
    setSelected(null);
    setHistory([]);
    setMoves(0);
    setPour(null);
  }, [puzzle.bottles]);

  const undo = useCallback(() => {
    if (pour) return;
    setHistory((prev) => {
      const snapshot = prev[prev.length - 1];
      if (!snapshot) return prev;
      setBottles(cloneBottles(snapshot.bottles));
      setSelected(null);
      setMoves(snapshot.moves);
      return prev.slice(0, -1);
    });
  }, [pour]);

  const startPour = useCallback(
    (move: Move) => {
      if (pour) return;
      const sourceEl = bottleRefs.current[move.from];
      const targetEl = bottleRefs.current[move.to];
      let tilt: "left" | "right" = "right";
      if (sourceEl && targetEl) {
        const s = sourceEl.getBoundingClientRect();
        const tg = targetEl.getBoundingClientRect();
        tilt = tg.left + tg.width / 2 >= s.left + s.width / 2 ? "right" : "left";
      }
      setPour({ from: move.from, to: move.to, tilt });
      setSelected(null);
      playPour();

      window.setTimeout(() => {
        const previous = cloneBottles(bottles);
        const next = applyMove(bottles, move, puzzle.config.capacity);
        if (!next) {
          setPour(null);
          return;
        }
        const targetWasComplete = isBottleSorted(
          previous[move.to],
          puzzle.config.capacity,
        );
        const targetNowComplete = isBottleSorted(
          next[move.to],
          puzzle.config.capacity,
        );
        const solvedNow = isSolved(next, puzzle.config.capacity);
        setHistory((prev) => [...prev, { bottles: previous, moves }]);
        setBottles(next);
        setMoves((value) => value + 1);
        if (solvedNow) {
          window.setTimeout(playWin, 140);
        } else if (!targetWasComplete && targetNowComplete) {
          window.setTimeout(playComplete, 60);
        }
      }, POUR_DELAY_MS);

      window.setTimeout(() => {
        setPour(null);
      }, POUR_RESET_MS);
    },
    [bottles, moves, pour, puzzle.config.capacity],
  );

  const handleBottleClick = useCallback(
    (index: number) => {
      unlockAudio();
      if (won || pour) return;
      const bottle = bottles[index];
      const bottleIsComplete = isBottleSorted(bottle, puzzle.config.capacity);

      if (selected === null) {
        if (bottle.length === 0 || bottleIsComplete) return;
        setSelected(index);
        return;
      }

      if (selected === index) {
        setSelected(null);
        return;
      }

      const move: Move = { from: selected, to: index };
      if (canPour(bottles, move.from, move.to, puzzle.config.capacity)) {
        startPour(move);
        return;
      }

      if (bottle.length > 0 && !bottleIsComplete) {
        setSelected(index);
      } else {
        setSelected(null);
      }
    },
    [bottles, pour, puzzle.config.capacity, selected, startPour, won],
  );

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-5">
            <Card type="title" color="app-teal" className="p-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Icon name="icon-diy" size={64} bounce />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                      Juice Sort
                    </p>
                    <h1 className="text-balance text-3xl font-black leading-tight text-[#794f27] sm:text-4xl">
                      {t("title")}
                    </h1>
                  </div>
                </div>
                <p className="text-base font-bold leading-7 text-[#725d42]">
                  {t("description")}
                </p>
                <Divider type="wave-yellow" />
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTIES.map((item) => {
                    const cfg = DIFFICULTY_CONFIG[item];
                    const isActive = difficulty === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => startPuzzle(item)}
                        className={`grid gap-1 rounded-lg border-2 px-3 py-2 text-left transition active:translate-y-[1px] ${
                          isActive
                            ? "border-[#19c8b9] bg-[#dcfbf7] text-[#00766d] shadow-[0_2px_0_rgba(25,200,185,0.4)]"
                            : "border-[#d4c9b4] bg-white/70 text-[#725d42] hover:border-[#19c8b9]/60"
                        }`}
                      >
                        <span className="text-sm font-black">
                          {t(`difficulty.${item}`)}
                        </span>
                        <span className="text-[10px] font-black leading-tight opacity-80">
                          {t("difficultySpec", {
                            colors: cfg.colorCount,
                            bottles: cfg.colorCount + cfg.emptyBottleCount,
                          })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="rounded-lg bg-white/70 p-3 text-xs font-bold leading-5 text-[#725d42]">
                  {t("rulesHint")}
                </p>
              </div>
            </Card>
          </div>

          <div className="relative min-w-0 space-y-5">
            <Card color="app-teal" className="relative min-w-0 overflow-hidden p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-11 items-center rounded-lg bg-white/80 px-4 text-sm font-black text-[#794f27]">
                    {t("moveCount", { count: moves })}
                  </span>
                  <span className="inline-flex h-11 items-center rounded-lg bg-white/80 px-4 text-sm font-black text-[#794f27]">
                    {t("seed", { seed: puzzle.seed })}
                  </span>
                  <AnimatePresence>
                    {won ? (
                      <motion.span
                        key="won"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="inline-flex h-11 items-center rounded-lg bg-[#fff1a8] px-4 text-sm font-black text-[#794f27] shadow-[0_2px_0_rgba(0,0,0,0.08)]"
                      >
                        🎉 {t("complete")}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="default" onClick={canUndo ? undo : undefined}>
                    {t("undo")}
                  </Button>
                  <Button type="default" onClick={resetPuzzle}>
                    {t("restart")}
                  </Button>
                  <Button type="primary" onClick={() => startPuzzle(difficulty)}>
                    {t("newPuzzle")}
                  </Button>
                </div>
              </div>

              <div className="relative rounded-2xl bg-[#f8f0d8]/70 p-4 sm:p-6">
                <div className="absolute inset-x-6 bottom-6 h-2 rounded-full bg-[#e3d6b8]/80" />
                <div
                  className="relative grid justify-center gap-3 sm:gap-4"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(88px, 96px))",
                  }}
                >
                  {bottles.map((bottle, index) => {
                    const isComplete = isBottleSorted(
                      bottle,
                      puzzle.config.capacity,
                    );
                    const pouringFrom = pour?.from === index;
                    const pouringTo = pour?.to === index;
                    return (
                      <Bottle
                        key={index}
                        ref={setBottleRef(index)}
                        index={index}
                        bottle={bottle}
                        selected={selected === index}
                        complete={isComplete}
                        tilt={pouringFrom ? pour?.tilt ?? null : null}
                        pouringFrom={pouringFrom}
                        pouringTo={pouringTo}
                        disabled={won || !!pour}
                        onClick={() => handleBottleClick(index)}
                      />
                    );
                  })}
                </div>
                {won ? <Confetti seed={puzzle.seed ^ moves} /> : null}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <p className="text-sm font-black text-[#00766d]">
                  {t("dailyTitle")}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
                  {t("dailyBody")}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-black text-[#00766d]">
                  {t("verifiedTitle")}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
                  {t("verifiedBody", { steps: puzzle.solution.length })}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-black text-[#00766d]">
                  {t("orderTitle")}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
                  {t("orderBody")}
                </p>
              </Card>
            </div>
          </div>
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}
