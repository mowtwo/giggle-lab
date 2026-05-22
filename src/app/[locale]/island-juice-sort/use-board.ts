"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { playComplete, playPour, playWin, unlockAudio } from "./audio";
import {
  applyMove,
  canPour,
  cloneBottles,
  isBottleSorted,
  isSolved,
  type Bottle,
  type Move,
} from "./game-logic";

export const POUR_DELAY_MS = 220;
export const POUR_RESET_MS = 460;

export type PourState = {
  from: number;
  to: number;
  tilt: "left" | "right";
};

export type GameSnapshot = {
  bottles: Bottle[];
  moves: number;
};

export type PourCommitInfo = {
  move: Move;
  before: Bottle[];
  after: Bottle[];
  targetCompletedNow: boolean;
  solvedNow: boolean;
};

export type PourCommitHandler = (info: PourCommitInfo) => void;

export function useJuiceBoard(initialBottles: Bottle[], capacity: number) {
  const [bottles, setBottles] = useState<Bottle[]>(() =>
    cloneBottles(initialBottles),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<GameSnapshot[]>([]);
  const [moves, setMoves] = useState(0);
  const [pour, setPour] = useState<PourState | null>(null);

  const bottleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pourCommitRef = useRef<PourCommitHandler | null>(null);

  const setBottleRef = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      bottleRefs.current[index] = node;
    },
    [],
  );

  const setOnPourCommit = useCallback(
    (handler: PourCommitHandler | null) => {
      pourCommitRef.current = handler;
    },
    [],
  );

  const won = useMemo(() => isSolved(bottles, capacity), [bottles, capacity]);
  const canUndo = history.length > 0 && !pour;

  const replaceBoard = useCallback((nextBottles: Bottle[]) => {
    setBottles(cloneBottles(nextBottles));
    setSelected(null);
    setHistory([]);
    setMoves(0);
    setPour(null);
  }, []);

  const setBottleAt = useCallback((index: number, nextBottle: Bottle) => {
    setBottles((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = cloneBottles(prev);
      next[index] = [...nextBottle];
      return next;
    });
  }, []);

  const clearBottle = useCallback(
    (index: number) => {
      setBottleAt(index, []);
    },
    [setBottleAt],
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      const snapshot = prev[prev.length - 1];
      if (!snapshot) return prev;
      setBottles(cloneBottles(snapshot.bottles));
      setSelected(null);
      setMoves(snapshot.moves);
      return prev.slice(0, -1);
    });
  }, []);

  const startPour = useCallback(
    (move: Move) => {
      if (pour) return;
      const sourceEl = bottleRefs.current[move.from];
      const targetEl = bottleRefs.current[move.to];
      let tilt: "left" | "right" = "right";
      if (sourceEl && targetEl) {
        const s = sourceEl.getBoundingClientRect();
        const tgt = targetEl.getBoundingClientRect();
        tilt =
          tgt.left + tgt.width / 2 >= s.left + s.width / 2
            ? "right"
            : "left";
      }
      setPour({ from: move.from, to: move.to, tilt });
      setSelected(null);
      playPour();

      window.setTimeout(() => {
        const before = cloneBottles(bottles);
        const after = applyMove(bottles, move, capacity);
        if (!after) {
          setPour(null);
          return;
        }
        const targetWasComplete = isBottleSorted(before[move.to], capacity);
        const targetNowComplete = isBottleSorted(after[move.to], capacity);
        const solvedNow = isSolved(after, capacity);

        setHistory((prev) => [...prev, { bottles: before, moves }]);
        setBottles(after);
        setMoves((value) => value + 1);

        if (solvedNow) window.setTimeout(playWin, 140);
        else if (!targetWasComplete && targetNowComplete)
          window.setTimeout(playComplete, 60);

        pourCommitRef.current?.({
          move,
          before,
          after,
          targetCompletedNow: !targetWasComplete && targetNowComplete,
          solvedNow,
        });
      }, POUR_DELAY_MS);

      window.setTimeout(() => setPour(null), POUR_RESET_MS);
    },
    [bottles, capacity, moves, pour],
  );

  const handleBottleClick = useCallback(
    (index: number) => {
      unlockAudio();
      if (pour) return;
      const bottle = bottles[index];
      if (!bottle) return;
      const bottleIsComplete = isBottleSorted(bottle, capacity);

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
      if (canPour(bottles, move.from, move.to, capacity)) {
        startPour(move);
        return;
      }

      if (bottle.length > 0 && !bottleIsComplete) setSelected(index);
      else setSelected(null);
    },
    [bottles, capacity, pour, selected, startPour],
  );

  return {
    bottles,
    selected,
    history,
    moves,
    pour,
    won,
    canUndo,
    setBottleRef,
    setOnPourCommit,
    handleBottleClick,
    undo,
    replaceBoard,
    setBottleAt,
    clearBottle,
  };
}
