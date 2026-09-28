/** Schulte Hive
 *
 * A Schulte grid is an attention test: find 1..N in order. This board is a
 * hex disk instead of a square, so there are no rows to scan along.
 *
 * Cell counts follow hex rings: 3R(R+1)+1.
 *   spark  R2  19   warm-up
 *   steady R3  37   daily round, between a 5×5 (25) and 7×7 (49) square
 *   deep   R4  61   the field no longer fits in one glance
 *   apex   R5  91   the three-minute clock is the limit
 */

const ROUND_MS = 3 * 60 * 1000;
export const FLASH_MS = 200;
export const REPEAT_GUARD_MS = 220;
const MAX_HEX_SIZE = 64;
const SQRT3 = Math.sqrt(3);

export type DifficultyId = "spark" | "steady" | "deep" | "apex";

type Difficulty = {
  id: DifficultyId;
  radius: number;
  count: number;
};

export const DIFFICULTY_IDS: readonly DifficultyId[] = [
  "spark",
  "steady",
  "deep",
  "apex",
];

function hexCount(radius: number) {
  return 3 * radius * (radius + 1) + 1;
}

const DIFFICULTIES: readonly Difficulty[] = [
  { id: "spark", radius: 2, count: hexCount(2) },
  { id: "steady", radius: 3, count: hexCount(3) },
  { id: "deep", radius: 4, count: hexCount(4) },
  { id: "apex", radius: 5, count: hexCount(5) },
];

type Phase = "ready" | "playing" | "cleared" | "expired";

type HexCell = {
  id: string;
  q: number;
  r: number;
  value: number | null;
};

type Flash = {
  id: string;
  kind: "hit" | "miss";
  token: number;
};

export type RoundState = {
  difficultyId: DifficultyId;
  phase: Phase;
  cells: HexCell[];
  next: number;
  misses: number;
  startedAt: number | null;
  endedAt: number | null;
  flash: Flash | null;
};

export function difficultyById(id: DifficultyId) {
  const found = DIFFICULTIES.find((item) => item.id === id);
  return found ?? DIFFICULTIES[1];
}

function shuffleValues(count: number, random: () => number = Math.random) {
  const values = Array.from({ length: count }, (_, index) => index + 1);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = values[index] ?? 0;
    values[index] = values[swap] ?? 0;
    values[swap] = current;
  }
  return values;
}

function axialCells(radius: number): HexCell[] {
  const cells: HexCell[] = [];
  for (let q = -radius; q <= radius; q += 1) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r += 1) {
      cells.push({ id: `${q},${r}`, q, r, value: null });
    }
  }
  return cells;
}

export function createReady(difficultyId: DifficultyId): RoundState {
  const difficulty = difficultyById(difficultyId);
  return {
    difficultyId,
    phase: "ready",
    cells: axialCells(difficulty.radius),
    next: 1,
    misses: 0,
    startedAt: null,
    endedAt: null,
    flash: null,
  };
}

export function startRound(
  difficultyId: DifficultyId,
  now: number,
  random?: () => number,
): RoundState {
  const difficulty = difficultyById(difficultyId);
  const values = shuffleValues(difficulty.count, random);
  return {
    difficultyId,
    phase: "playing",
    cells: axialCells(difficulty.radius).map((cell, index) => ({
      ...cell,
      value: values[index] ?? null,
    })),
    next: 1,
    misses: 0,
    startedAt: now,
    endedAt: null,
    flash: null,
  };
}

export function clearFlash(state: RoundState, token: number): RoundState {
  if (state.flash?.token !== token) return state;
  return { ...state, flash: null };
}

export function expireRound(state: RoundState, now: number): RoundState {
  if (state.phase !== "playing" || state.startedAt == null) return state;
  if (now - state.startedAt < ROUND_MS) return state;
  return {
    ...state,
    phase: "expired",
    endedAt: state.startedAt + ROUND_MS,
    flash: null,
  };
}

export function applyPick(
  state: RoundState,
  cellId: string,
  now: number,
  token: number,
): RoundState | null {
  if (state.phase !== "playing" || state.startedAt == null) return null;
  if (now - state.startedAt >= ROUND_MS) {
    return expireRound(state, now);
  }

  const cell = state.cells.find((item) => item.id === cellId);
  if (!cell || cell.value == null) return null;

  if (cell.value !== state.next) {
    return {
      ...state,
      misses: state.misses + 1,
      flash: { id: cellId, kind: "miss", token },
    };
  }

  const total = difficultyById(state.difficultyId).count;
  const done = state.next >= total;
  return {
    ...state,
    next: done ? state.next : state.next + 1,
    phase: done ? "cleared" : "playing",
    endedAt: done ? now : null,
    flash: { id: cellId, kind: "hit", token },
  };
}

export function foundCount(state: RoundState) {
  if (state.phase === "ready") return 0;
  if (state.phase === "cleared") return difficultyById(state.difficultyId).count;
  return state.next - 1;
}

export function elapsedMs(state: RoundState, now: number) {
  if (state.startedAt == null) return 0;
  const end = state.phase === "playing" ? now : (state.endedAt ?? now);
  return Math.max(0, Math.min(ROUND_MS, end - state.startedAt));
}

export function remainingMs(state: RoundState, now: number) {
  if (state.phase === "ready" || state.startedAt == null) return ROUND_MS;
  return Math.max(0, ROUND_MS - elapsedMs(state, now));
}

export type GradeId = "sharp" | "good" | "pass" | "again";

const GRADE_ORDER: readonly GradeId[] = ["sharp", "good", "pass", "again"];

/** Whole seconds, matched to the clock the player sees (floored). */
export const TIME_BANDS_SEC: Record<DifficultyId, { sharp: number; good: number; pass: number }> = {
  spark: { sharp: 25, good: 40, pass: 70 },
  steady: { sharp: 50, good: 85, pass: 130 },
  deep: { sharp: 95, good: 140, pass: 180 },
  apex: { sharp: 120, good: 155, pass: 180 },
};

export type Assessment = {
  grade: GradeId;
  speedGrade: GradeId;
  /** misses / (found + misses). No taps counts as 1. */
  missRate: number;
  finished: boolean;
};

export function formatRatePercent(rate: number) {
  const percent = rate * 100;
  if (percent === 0 || percent >= 10) return String(Math.round(percent));
  const rounded = Math.round(percent * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function speedGradeFor(
  seconds: number,
  bands: { sharp: number; good: number; pass: number },
): GradeId {
  if (seconds <= bands.sharp) return "sharp";
  if (seconds <= bands.good) return "good";
  if (seconds <= bands.pass) return "pass";
  return "again";
}

function dropForMissRate(rate: number) {
  if (rate <= 0.05) return 0;
  if (rate <= 0.15) return 1;
  if (rate <= 0.3) return 2;
  return GRADE_ORDER.length;
}

export function assessRound(state: RoundState, now: number): Assessment | null {
  if (state.phase !== "cleared" && state.phase !== "expired") return null;
  const found = foundCount(state);
  const taps = found + state.misses;
  const rate = taps === 0 ? 1 : state.misses / taps;
  if (state.phase !== "cleared") {
    return { grade: "again", speedGrade: "again", missRate: rate, finished: false };
  }
  const seconds = Math.floor(elapsedMs(state, now) / 1000);
  const speedGrade = speedGradeFor(seconds, TIME_BANDS_SEC[state.difficultyId]);
  const nextIndex = Math.min(
    GRADE_ORDER.length - 1,
    GRADE_ORDER.indexOf(speedGrade) + dropForMissRate(rate),
  );
  return {
    grade: GRADE_ORDER[nextIndex] ?? "again",
    speedGrade,
    missRate: rate,
    finished: true,
  };
}

export function formatClock(ms: number, rounding: "ceil" | "floor" = "ceil") {
  const capped = Math.max(0, ms);
  const seconds =
    capped === 0 ? 0 : rounding === "floor" ? Math.floor(capped / 1000) : Math.ceil(capped / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

type HiveMetrics = {
  size: number;
  boardW: number;
  boardH: number;
};

export function hiveMetrics(radius: number, width: number, height: number): HiveMetrics | null {
  if (width < 16 || height < 16) return null;
  const sizeByW = width / (SQRT3 * (2 * radius + 1));
  const sizeByH = height / (3 * radius + 2);
  const size = Math.min(sizeByW, sizeByH, MAX_HEX_SIZE);
  if (size < 6) return null;
  return {
    size,
    boardW: size * SQRT3 * (2 * radius + 1),
    boardH: size * (3 * radius + 2),
  };
}

export function cellOrigin(q: number, r: number, size: number) {
  return {
    x: size * SQRT3 * (q + r / 2),
    y: size * 1.5 * r,
  };
}

export const HEX_CLIP =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
