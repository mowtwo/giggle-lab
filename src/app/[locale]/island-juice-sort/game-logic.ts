export type Difficulty = "cozy" | "normal" | "tricky" | "expert";

export type Bottle = number[];

export type Move = {
  from: number;
  to: number;
};

export type DifficultyConfig = {
  colorCount: number;
  emptyBottleCount: number;
  capacity: number;
};

export type Puzzle = {
  bottles: Bottle[];
  seed: number;
  solution: Move[];
  config: DifficultyConfig;
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  cozy: { colorCount: 4, emptyBottleCount: 2, capacity: 4 },
  normal: { colorCount: 6, emptyBottleCount: 2, capacity: 4 },
  tricky: { colorCount: 8, emptyBottleCount: 2, capacity: 4 },
  expert: { colorCount: 10, emptyBottleCount: 2, capacity: 4 },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function cloneBottles(bottles: Bottle[]) {
  return bottles.map((bottle) => [...bottle]);
}

function topColor(bottle: Bottle) {
  return bottle.length > 0 ? bottle[bottle.length - 1] : null;
}

function topRunLength(bottle: Bottle) {
  const color = topColor(bottle);
  if (color === null) return 0;
  let count = 0;
  for (let i = bottle.length - 1; i >= 0 && bottle[i] === color; i -= 1) {
    count += 1;
  }
  return count;
}

export function canPour(
  bottles: Bottle[],
  from: number,
  to: number,
  capacity: number,
) {
  if (from === to) return false;
  const source = bottles[from];
  const target = bottles[to];
  if (!source || !target || source.length === 0 || target.length >= capacity) {
    return false;
  }
  const color = topColor(source);
  const targetColor = topColor(target);
  return targetColor === null || targetColor === color;
}

export function pourAmount(
  bottles: Bottle[],
  move: Move,
  capacity: number,
): number {
  if (!canPour(bottles, move.from, move.to, capacity)) return 0;
  const source = bottles[move.from];
  const target = bottles[move.to];
  return Math.min(topRunLength(source), capacity - target.length);
}

export function applyMove(
  bottles: Bottle[],
  move: Move,
  capacity: number,
): Bottle[] | null {
  if (!canPour(bottles, move.from, move.to, capacity)) {
    return null;
  }
  const next = cloneBottles(bottles);
  const source = next[move.from];
  const target = next[move.to];
  const amount = Math.min(topRunLength(source), capacity - target.length);
  for (let i = 0; i < amount; i += 1) {
    const color = source.pop();
    if (color === undefined) return null;
    target.push(color);
  }
  return next;
}

function isBottleComplete(bottle: Bottle, capacity: number) {
  if (bottle.length === 0) return true;
  if (bottle.length !== capacity) return false;
  return bottle.every((color) => color === bottle[0]);
}

export function isSolved(bottles: Bottle[], capacity: number) {
  return bottles.every((bottle) => isBottleComplete(bottle, capacity));
}

export function isBottleSorted(bottle: Bottle, capacity: number) {
  return isBottleComplete(bottle, capacity) && bottle.length > 0;
}

function canonicalKey(bottles: Bottle[]) {
  return bottles
    .map((bottle) => bottle.join(","))
    .sort()
    .join("|");
}

function prunedMoves(bottles: Bottle[], capacity: number): Move[] {
  const moves: Move[] = [];
  let firstEmpty = -1;
  for (let to = 0; to < bottles.length; to += 1) {
    if (bottles[to].length === 0) {
      firstEmpty = to;
      break;
    }
  }
  for (let from = 0; from < bottles.length; from += 1) {
    const source = bottles[from];
    if (source.length === 0) continue;
    if (
      source.length === capacity &&
      source.every((color) => color === source[0])
    ) {
      continue;
    }
    const topRun = topRunLength(source);
    if (topRun === source.length) {
      let needsEmpty = true;
      for (let to = 0; to < bottles.length; to += 1) {
        if (to === from) continue;
        const target = bottles[to];
        if (
          target.length > 0 &&
          target.length < capacity &&
          target[target.length - 1] === source[source.length - 1]
        ) {
          needsEmpty = false;
          break;
        }
      }
      if (needsEmpty) continue;
    }
    let emptyUsed = false;
    for (let to = 0; to < bottles.length; to += 1) {
      if (from === to) continue;
      const target = bottles[to];
      if (!canPour(bottles, from, to, capacity)) continue;
      if (target.length === 0) {
        if (emptyUsed) continue;
        if (firstEmpty !== to) continue;
        emptyUsed = true;
      }
      moves.push({ from, to });
    }
  }
  return moves;
}

function scoreMove(bottles: Bottle[], move: Move, capacity: number) {
  const next = applyMove(bottles, move, capacity);
  if (!next) return -1;
  const target = next[move.to];
  const source = next[move.from];
  let score = 0;
  if (target.length === capacity && new Set(target).size === 1) score += 1000;
  if (source.length === 0) score += 200;
  if (target.length > 0 && new Set(target).size === 1) score += 30;
  score += target.length - bottles[move.to].length;
  return score;
}

export function solveBottles(
  initial: Bottle[],
  capacity: number,
  nodeBudget = 60000,
): Move[] | null {
  if (isSolved(initial, capacity)) return [];

  const visited = new Set<string>();
  let bestPath: Move[] | null = null;
  let nodes = 0;
  const depthLimit = 120;

  const stack: { state: Bottle[]; path: Move[] }[] = [
    { state: cloneBottles(initial), path: [] },
  ];

  while (stack.length > 0) {
    if (nodes >= nodeBudget) return bestPath;
    const { state, path } = stack.pop()!;
    if (path.length >= depthLimit) continue;
    if (isSolved(state, capacity)) {
      if (!bestPath || path.length < bestPath.length) bestPath = path;
      continue;
    }
    const key = canonicalKey(state);
    if (visited.has(key)) continue;
    visited.add(key);
    nodes += 1;

    const moves = prunedMoves(state, capacity).map((move) => ({
      move,
      score: scoreMove(state, move, capacity),
    }));
    moves.sort((a, b) => a.score - b.score);

    for (const { move } of moves) {
      const next = applyMove(state, move, capacity);
      if (!next) continue;
      if (bestPath && path.length + 1 >= bestPath.length) continue;
      stack.push({ state: next, path: [...path, move] });
    }

    if (bestPath) return bestPath;
  }

  return bestPath;
}

function isInteresting(bottles: Bottle[], config: DifficultyConfig) {
  let mixed = 0;
  let alreadyComplete = 0;
  for (const bottle of bottles) {
    if (bottle.length === 0) continue;
    const colors = new Set(bottle);
    if (colors.size > 1) mixed += 1;
    if (bottle.length === config.capacity && colors.size === 1) {
      alreadyComplete += 1;
    }
  }
  const minMixed = Math.max(2, config.colorCount - 1);
  return mixed >= minMixed && alreadyComplete === 0;
}

function shuffledDeal(config: DifficultyConfig, rand: () => number): Bottle[] {
  const tokens: number[] = [];
  for (let color = 0; color < config.colorCount; color += 1) {
    for (let k = 0; k < config.capacity; k += 1) tokens.push(color);
  }
  for (let i = tokens.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }
  const bottles: Bottle[] = [];
  for (let i = 0; i < config.colorCount; i += 1) {
    bottles.push(tokens.slice(i * config.capacity, (i + 1) * config.capacity));
  }
  for (let i = 0; i < config.emptyBottleCount; i += 1) bottles.push([]);
  return bottles;
}

export function generatePuzzle(
  difficulty: Difficulty,
  seed = randomSeed(),
): Puzzle {
  const config = DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 0; attempt < 64; attempt += 1) {
    const attemptSeed = (seed + Math.imul(attempt + 1, 0x9e3779b9)) >>> 0;
    const rand = mulberry32(attemptSeed);
    const bottles = shuffledDeal(config, rand);
    if (!isInteresting(bottles, config)) continue;
    const solution = solveBottles(bottles, config.capacity);
    if (!solution || solution.length < 4) continue;
    return { bottles, seed: attemptSeed, solution, config };
  }

  const fallbackConfig = DIFFICULTY_CONFIG.cozy;
  const fallback: Bottle[] = [
    [0, 1, 0, 1],
    [2, 3, 2, 3],
    [1, 0, 1, 0],
    [3, 2, 3, 2],
    [],
    [],
  ];
  const solution = solveBottles(fallback, fallbackConfig.capacity) ?? [];
  return { bottles: fallback, seed, solution, config: fallbackConfig };
}
