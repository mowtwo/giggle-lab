"use client";

import { AnimatePresence, motion, type Transition } from "motion/react";
import { forwardRef } from "react";

import { JUICE_COLORS } from "./palette";

const BOTTLE_PATH =
  "M 28 2 L 52 2 L 52 16 L 50 18 L 50 40 Q 50 48 60 55 L 70 60 Q 72 62 72 70 L 72 192 Q 72 210 56 210 L 24 210 Q 8 210 8 192 L 8 70 Q 8 62 10 60 L 20 55 Q 30 48 30 40 L 30 18 L 28 16 Z";

const LIQUID_CLIP =
  "M 34 24 L 46 24 L 46 40 Q 46 47 55 53 L 65 58 Q 68 60 68 68 L 68 192 Q 68 207 56 207 L 24 207 Q 12 207 12 192 L 12 68 Q 12 60 15 58 L 25 53 Q 34 47 34 40 L 34 24 Z";

const CAP_PATH =
  "M 26 0 L 54 0 Q 56 0 56 2 L 56 14 Q 56 16 54 16 L 26 16 Q 24 16 24 14 L 24 2 Q 24 0 26 0 Z";

const BODY_TOP = 59;
const BODY_BOTTOM = 207;
const LAYER_HEIGHT = (BODY_BOTTOM - BODY_TOP) / 4;

export type BottleProps = {
  bottle: number[];
  selected: boolean;
  complete: boolean;
  tilt?: "left" | "right" | null;
  pouringFrom?: boolean;
  pouringTo?: boolean;
  disabled?: boolean;
  index: number;
  onClick: () => void;
};

const SPRING: Transition = { type: "spring", stiffness: 320, damping: 24 };

export const Bottle = forwardRef<HTMLButtonElement, BottleProps>(function Bottle(
  {
    bottle,
    selected,
    complete,
    tilt,
    pouringFrom,
    pouringTo,
    disabled,
    index,
    onClick,
  },
  ref,
) {
  const clipId = `juice-clip-${index}`;
  const shineId = `juice-shine-${index}`;
  const tiltDeg = tilt === "left" ? -32 : tilt === "right" ? 32 : 0;
  const lifted = selected || pouringFrom;

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label="juice bottle"
      onClick={onClick}
      disabled={disabled}
      className="group relative grid h-48 w-[88px] cursor-pointer place-items-center bg-transparent outline-none disabled:cursor-default"
      style={{ transformOrigin: "50% 92%" }}
      animate={{
        y: pouringFrom ? -34 : lifted ? -14 : 0,
        rotate: tiltDeg,
        scale: lifted ? 1.04 : 1,
      }}
      transition={SPRING}
      whileHover={!disabled && !lifted ? { y: -4 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      <svg
        viewBox="0 0 80 220"
        className="absolute inset-0 m-auto h-44 w-[88px] drop-shadow-[0_6px_0_rgba(122,97,65,0.16)]"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={LIQUID_CLIP} />
          </clipPath>
          <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="38%" stopColor="white" stopOpacity="0" />
            <stop offset="78%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Glass body fill */}
        <path d={BOTTLE_PATH} fill="rgba(255, 253, 242, 0.9)" />

        {/* Liquid layers */}
        <g clipPath={`url(#${clipId})`}>
          <AnimatePresence initial={false}>
            {bottle.map((color, idx) => {
              const c = JUICE_COLORS[color];
              const layerY = BODY_BOTTOM - (idx + 1) * LAYER_HEIGHT;
              const isTop = idx === bottle.length - 1;
              return (
                <motion.g key={`${idx}-${color}`}>
                  <motion.rect
                    x={6}
                    width={68}
                    fill={c.fill}
                    initial={{ y: layerY + 6, height: LAYER_HEIGHT, opacity: 0 }}
                    animate={{ y: layerY, height: LAYER_HEIGHT, opacity: 1 }}
                    exit={{ y: layerY - 8, opacity: 0 }}
                    transition={SPRING}
                  />
                  <motion.rect
                    x={6}
                    width={68}
                    fill={c.shadow}
                    opacity={0.18}
                    initial={{ y: layerY + 6, height: LAYER_HEIGHT, opacity: 0 }}
                    animate={{
                      y: layerY + LAYER_HEIGHT - 6,
                      height: 6,
                      opacity: 0.18,
                    }}
                    exit={{ opacity: 0 }}
                    transition={SPRING}
                  />
                  {isTop && (
                    <motion.path
                      initial={false}
                      animate={{
                        d: `M 6 ${layerY + 3} Q 18 ${layerY - 3} 30 ${layerY + 3} T 54 ${layerY + 3} T 80 ${layerY + 3} L 80 ${layerY + 8} L 6 ${layerY + 8} Z`,
                      }}
                      fill={c.highlight}
                      opacity={0.85}
                    />
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </g>

        {/* Glass shine */}
        <path d={LIQUID_CLIP} fill={`url(#${shineId})`} pointerEvents="none" />

        {/* Inner rim shadow */}
        <path
          d={LIQUID_CLIP}
          fill="none"
          stroke="rgba(122,97,65,0.18)"
          strokeWidth={1.4}
          pointerEvents="none"
        />

        {/* Bottle outline */}
        <path
          d={BOTTLE_PATH}
          fill="none"
          stroke="#7a6141"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* Cap */}
        <path d={CAP_PATH} fill="#b99b72" stroke="#7a6141" strokeWidth={2} />
        <rect x={26} y={4} width={28} height={2} fill="#d9c6a4" />

        {/* Selection halo */}
        {selected && (
          <path
            d={BOTTLE_PATH}
            fill="none"
            stroke="#19c8b9"
            strokeWidth={5}
            strokeLinejoin="round"
            opacity={0.5}
          />
        )}

        {/* Pour-target halo */}
        {pouringTo && (
          <path
            d={BOTTLE_PATH}
            fill="none"
            stroke="#ffb84a"
            strokeWidth={5}
            strokeLinejoin="round"
            opacity={0.7}
          />
        )}
      </svg>

      {/* Complete check badge */}
      <AnimatePresence>
        {complete && bottle.length > 0 && (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -bottom-1 right-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#7fbf3f] text-sm font-black text-white shadow-[0_2px_0_rgba(0,0,0,0.18)]"
          >
            ✓
          </motion.span>
        )}
      </AnimatePresence>

      {/* Sparkle on completion */}
      <AnimatePresence>
        {complete && bottle.length > 0 && (
          <motion.span
            key="sparkle"
            initial={{ opacity: 0, scale: 0.4, y: 8 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.4, 1.8], y: -32 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-lg"
          >
            ✨
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});
