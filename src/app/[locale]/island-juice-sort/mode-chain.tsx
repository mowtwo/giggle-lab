"use client";

import { Button, Card, Divider } from "animal-island-ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnimaleseText } from "@/components/animalese-text";

import { BoardCanvas, Confetti } from "./board-shared";
import {
  DIFFICULTY_CONFIG,
  generatePuzzle,
  type Difficulty,
  type Puzzle,
} from "./game-logic";
import { useJuiceBoard } from "./use-board";

const DIFFICULTIES: Difficulty[] = ["cozy", "normal", "tricky", "expert"];
const BEST_KEY_PREFIX = "islandJuiceSort.chain.best.";

function useBestStreak(difficulty: Difficulty) {
  const [best, setBest] = useState(0);
  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_KEY_PREFIX + difficulty);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(stored ? Number.parseInt(stored, 10) || 0 : 0);
  }, [difficulty]);
  const update = useCallback(
    (value: number) => {
      setBest((prev) => {
        if (value > prev) {
          window.localStorage.setItem(
            BEST_KEY_PREFIX + difficulty,
            String(value),
          );
          return value;
        }
        return prev;
      });
    },
    [difficulty],
  );
  return [best, update] as const;
}

export function ChainMode() {
  const t = useTranslations("IslandJuiceSort");
  const [difficulty, setDifficulty] = useState<Difficulty>("cozy");
  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generatePuzzle("cozy", 0x51a7d00d),
  );
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useBestStreak(difficulty);
  const winLatched = useRef(false);

  const board = useJuiceBoard(puzzle.bottles, puzzle.config.capacity);

  useEffect(() => {
    if (board.won && !winLatched.current) {
      winLatched.current = true;
      setStreak((prev) => {
        const next = prev + 1;
        setBest(next);
        return next;
      });
    }
  }, [board.won, setBest]);

  const advanceToNext = useCallback(() => {
    winLatched.current = false;
    const nextPuzzle = generatePuzzle(difficulty);
    setPuzzle(nextPuzzle);
    board.replaceBoard(nextPuzzle.bottles);
  }, [board, difficulty]);

  const switchDifficulty = useCallback(
    (next: Difficulty) => {
      winLatched.current = false;
      setDifficulty(next);
      setStreak(0);
      const nextPuzzle = generatePuzzle(next);
      setPuzzle(nextPuzzle);
      board.replaceBoard(nextPuzzle.bottles);
    },
    [board],
  );

  const restart = useCallback(() => {
    winLatched.current = false;
    board.replaceBoard(puzzle.bottles);
  }, [board, puzzle.bottles]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <Card type="title" color="app-teal" className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#00766d]">
                {t("mode.chain.tag")}
              </p>
              <AnimaleseText
                as="h1"
                text={t("title")}
                cps={20}
                className="block text-balance text-3xl font-black leading-tight text-[#794f27] sm:text-4xl"
              />
              <p className="text-sm font-bold leading-6 text-[#725d42]">
                {t("mode.chain.description")}
              </p>
            </div>
            <Divider type="wave-yellow" />
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map((item) => {
                const cfg = DIFFICULTY_CONFIG[item];
                const isActive = difficulty === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => switchDifficulty(item)}
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
                {t("mode.chain.streak", { count: streak })}
              </span>
              <span className="inline-flex h-11 items-center rounded-lg bg-white/80 px-4 text-sm font-black text-[#794f27]">
                {t("mode.chain.best", { count: best })}
              </span>
              <span className="inline-flex h-11 items-center rounded-lg bg-white/80 px-4 text-sm font-black text-[#794f27]">
                {t("moveCount", { count: board.moves })}
              </span>
              <AnimatePresence>
                {board.won ? (
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
              {board.won ? (
                <Button type="primary" onClick={advanceToNext}>
                  {t("mode.chain.next")}
                </Button>
              ) : (
                <>
                  <Button
                    type="default"
                    onClick={board.canUndo ? board.undo : undefined}
                  >
                    {t("undo")}
                  </Button>
                  <Button type="default" onClick={restart}>
                    {t("restart")}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => switchDifficulty(difficulty)}
                  >
                    {t("newPuzzle")}
                  </Button>
                </>
              )}
            </div>
          </div>

          <BoardCanvas
            bottles={board.bottles}
            capacity={puzzle.config.capacity}
            selected={board.selected}
            pour={board.pour}
            setBottleRef={board.setBottleRef}
            onBottleClick={board.handleBottleClick}
            disabledClick={board.won}
          />
          {board.won ? <Confetti seed={puzzle.seed ^ streak} /> : null}
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
              {t("mode.chain.tipTitle")}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#725d42]">
              {t("mode.chain.tipBody")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
