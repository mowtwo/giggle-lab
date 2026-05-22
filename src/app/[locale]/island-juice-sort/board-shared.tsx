"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

import { Bottle } from "./bottle";
import { isBottleSorted, type Bottle as BottleState } from "./game-logic";
import { JUICE_COLORS } from "./palette";
import type { PourState } from "./use-board";

function hash01(seed: number, salt: number) {
  let t = ((seed >>> 0) + Math.imul(salt | 1, 0x6d2b79f5)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function Confetti({ seed, density = 42 }: { seed: number; density?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
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
    [seed, density],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ top: "-12%", opacity: 1, x: 0 }}
          animate={{
            top: "115%",
            opacity: [1, 1, 0],
            x: p.drift,
            rotate: p.rotation,
          }}
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

export type BoardCanvasProps = {
  bottles: BottleState[];
  capacity: number;
  selected: number | null;
  pour: PourState | null;
  shipping?: Set<number>;
  arriving?: Set<number>;
  disabledClick?: boolean;
  setBottleRef: (
    index: number,
  ) => (node: HTMLButtonElement | null) => void;
  onBottleClick: (index: number) => void;
};

export function BoardCanvas({
  bottles,
  capacity,
  selected,
  pour,
  shipping,
  arriving,
  disabledClick,
  setBottleRef,
  onBottleClick,
}: BoardCanvasProps) {
  return (
    <div className="relative rounded-2xl bg-[#f8f0d8]/70 p-4 sm:p-6">
      <div className="absolute inset-x-6 bottom-6 h-2 rounded-full bg-[#e3d6b8]/80" />
      <div
        className="relative grid justify-center gap-3 sm:gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(88px, 96px))",
        }}
      >
        <AnimatePresence initial={false}>
          {bottles.map((bottle, index) => {
            const isComplete = isBottleSorted(bottle, capacity);
            const pouringFrom = pour?.from === index;
            const pouringTo = pour?.to === index;
            const isShipping = shipping?.has(index) ?? false;
            const isArriving = arriving?.has(index) ?? false;
            return (
              <motion.div
                key={index}
                layout
                initial={
                  isArriving
                    ? { x: -120, opacity: 0, scale: 0.6 }
                    : { opacity: 1 }
                }
                animate={
                  isShipping
                    ? { y: -80, opacity: 0, scale: 0.7 }
                    : { x: 0, y: 0, opacity: 1, scale: 1 }
                }
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <Bottle
                  ref={setBottleRef(index)}
                  index={index}
                  bottle={bottle}
                  selected={selected === index}
                  complete={isComplete}
                  tilt={pouringFrom ? pour?.tilt ?? null : null}
                  pouringFrom={pouringFrom}
                  pouringTo={pouringTo}
                  disabled={disabledClick || !!pour || isShipping}
                  onClick={() => onBottleClick(index)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
