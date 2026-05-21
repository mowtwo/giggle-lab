export type Difficulty = "easy" | "normal" | "hard" | "endless";

export type DifficultyConfig = {
  blockWidth: number;
  blockHeight: number;
  minesPerBlock: number;
  fixedBlockCount: { cols: number; rows: number } | null;
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    blockWidth: 9,
    blockHeight: 9,
    minesPerBlock: 10,
    fixedBlockCount: { cols: 1, rows: 1 },
  },
  normal: {
    blockWidth: 16,
    blockHeight: 16,
    minesPerBlock: 40,
    fixedBlockCount: { cols: 1, rows: 1 },
  },
  hard: {
    blockWidth: 30,
    blockHeight: 16,
    minesPerBlock: 99,
    fixedBlockCount: { cols: 1, rows: 1 },
  },
  endless: {
    blockWidth: 30,
    blockHeight: 16,
    minesPerBlock: 99,
    fixedBlockCount: null,
  },
};

export type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  // -1 when not yet computed. Counts are computed lazily because they may
  // depend on neighbouring blocks that don't exist yet (endless).
  adjMines: number;
  // Set after a losing reveal to highlight the trigger cell.
  triggeredMine?: boolean;
};

export type Block = {
  bx: number;
  by: number;
  cells: Cell[]; // flat row-major: index = ly * blockWidth + lx
  minesPlaced: boolean;
  reservedSafe?: { lx: number; ly: number } | null;
};

export type GameStatus = "ready" | "playing" | "won" | "lost";

export type GameState = {
  difficulty: Difficulty;
  config: DifficultyConfig;
  blocks: Map<string, Block>;
  // Blocks the player can see and interact with.
  unlockedBlocks: Set<string>;
  flagsPlaced: number;
  revealedCount: number;
  // Total non-mine cells the player must clear to win. For endless this is
  // recomputed every time a new block unlocks: `cells in unlocked blocks` -
  // `mines in unlocked blocks`. The user only "wins" if they reveal every
  // non-mine cell across all currently-unlocked blocks — which is essentially
  // impossible for endless, but the state is still well-defined.
  targetReveals: number;
  status: GameStatus;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  // 32-bit seed for the world's mine layout. Stable across a single game.
  seed: number;
  // Bounding box of unlocked blocks (in block coords). Used by the UI to
  // render the visible grid.
  bounds: {
    minBx: number;
    maxBx: number;
    minBy: number;
    maxBy: number;
  };
};

// ─── PRNG ────────────────────────────────────────────────────────────────

// Simple, fast, well-distributed 32-bit hash → seed → mulberry32 stream.
// Deterministic per (worldSeed, bx, by) so blocks regenerate identically.
function hash32(...values: number[]): number {
  let h = 0x9e3779b9 | 0;
  for (const v of values) {
    h ^= Math.imul(v | 0, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

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

// ─── Coordinate helpers ──────────────────────────────────────────────────

function modFloor(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function blockIdOf(bx: number, by: number) {
  return `${bx},${by}`;
}

export function worldToBlock(
  x: number,
  y: number,
  config: DifficultyConfig,
) {
  const bx = Math.floor(x / config.blockWidth);
  const by = Math.floor(y / config.blockHeight);
  const lx = modFloor(x, config.blockWidth);
  const ly = modFloor(y, config.blockHeight);
  return { bx, by, lx, ly };
}

export function blockToWorld(
  bx: number,
  by: number,
  lx: number,
  ly: number,
  config: DifficultyConfig,
) {
  return {
    x: bx * config.blockWidth + lx,
    y: by * config.blockHeight + ly,
  };
}

export function isInBounds(
  bx: number,
  by: number,
  config: DifficultyConfig,
) {
  const limit = config.fixedBlockCount;
  if (!limit) {
    return true;
  }
  return bx >= 0 && by >= 0 && bx < limit.cols && by < limit.rows;
}

// ─── Block lifecycle ─────────────────────────────────────────────────────

function newEmptyBlock(bx: number, by: number, config: DifficultyConfig): Block {
  const total = config.blockWidth * config.blockHeight;
  const cells: Cell[] = new Array(total);
  for (let i = 0; i < total; i += 1) {
    cells[i] = {
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjMines: -1,
    };
  }
  return { bx, by, cells, minesPlaced: false };
}

function placeBlockMines(
  block: Block,
  state: GameState,
  excluded: Set<number>,
) {
  const config = state.config;
  const total = config.blockWidth * config.blockHeight;
  const target = Math.min(config.minesPerBlock, total - excluded.size);
  const rand = mulberry32(hash32(state.seed, block.bx, block.by));

  // Reservoir-free sampling: fill an index array, partial Fisher-Yates.
  const indices: number[] = [];
  for (let i = 0; i < total; i += 1) {
    if (!excluded.has(i)) {
      indices.push(i);
    }
  }
  for (let i = 0; i < target; i += 1) {
    const j = i + Math.floor(rand() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
    block.cells[indices[i]].isMine = true;
  }

  block.minesPlaced = true;
}

// Ensure a block exists in state. Returns it. Does NOT place mines yet —
// that's deferred until the block is actually consulted for adjacency or a
// reveal happens inside it, so the very first click in a fresh world can
// guarantee a safe spawn.
function ensureBlock(state: GameState, bx: number, by: number): Block | null {
  if (!isInBounds(bx, by, state.config)) {
    return null;
  }
  const id = blockIdOf(bx, by);
  let block = state.blocks.get(id);
  if (!block) {
    block = newEmptyBlock(bx, by, state.config);
    state.blocks.set(id, block);
  }
  return block;
}

function ensureBlockWithMines(
  state: GameState,
  bx: number,
  by: number,
): Block | null {
  const block = ensureBlock(state, bx, by);
  if (!block) {
    return null;
  }
  if (!block.minesPlaced) {
    placeBlockMines(block, state, new Set());
  }
  return block;
}

// ─── Cell access ─────────────────────────────────────────────────────────

export function getCellAt(
  state: GameState,
  x: number,
  y: number,
): Cell | null {
  const { bx, by, lx, ly } = worldToBlock(x, y, state.config);
  if (!isInBounds(bx, by, state.config)) {
    return null;
  }
  const block = ensureBlock(state, bx, by);
  if (!block) {
    return null;
  }
  return block.cells[ly * state.config.blockWidth + lx];
}

function cellIsMine(state: GameState, x: number, y: number): boolean {
  const { bx, by, lx, ly } = worldToBlock(x, y, state.config);
  if (!isInBounds(bx, by, state.config)) {
    return false;
  }
  const block = ensureBlockWithMines(state, bx, by);
  if (!block) {
    return false;
  }
  return block.cells[ly * state.config.blockWidth + lx].isMine;
}

const NEIGHBOR_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],           [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
];

export function neighbors(x: number, y: number) {
  return NEIGHBOR_DELTAS.map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
}

function computeAdjMines(state: GameState, x: number, y: number): number {
  let count = 0;
  for (const [dx, dy] of NEIGHBOR_DELTAS) {
    if (cellIsMine(state, x + dx, y + dy)) {
      count += 1;
    }
  }
  return count;
}

function getOrComputeAdj(state: GameState, x: number, y: number): number {
  const cell = getCellAt(state, x, y);
  if (!cell) {
    return 0;
  }
  if (cell.adjMines < 0) {
    cell.adjMines = computeAdjMines(state, x, y);
  }
  return cell.adjMines;
}

// ─── Game lifecycle ──────────────────────────────────────────────────────

export function createGame(
  difficulty: Difficulty,
  seed = (Math.random() * 0xffffffff) >>> 0,
): GameState {
  const config = DIFFICULTY_CONFIG[difficulty];
  const targetReveals =
    (config.fixedBlockCount
      ? config.fixedBlockCount.cols *
        config.fixedBlockCount.rows *
        config.blockWidth *
        config.blockHeight
      : config.blockWidth * config.blockHeight) -
    (config.fixedBlockCount
      ? config.minesPerBlock *
        config.fixedBlockCount.cols *
        config.fixedBlockCount.rows
      : config.minesPerBlock);
  const blocks = new Map<string, Block>();
  // Create the initial (0,0) block as empty so the UI can render the grid
  // and the mine counter is meaningful before the first click — mines are
  // still placed lazily once the player clicks (for first-click safety).
  blocks.set(blockIdOf(0, 0), newEmptyBlock(0, 0, config));
  return {
    difficulty,
    config,
    blocks,
    unlockedBlocks: new Set([blockIdOf(0, 0)]),
    flagsPlaced: 0,
    revealedCount: 0,
    targetReveals,
    status: "ready",
    startedAtMs: null,
    finishedAtMs: null,
    seed,
    bounds: { minBx: 0, maxBx: 0, minBy: 0, maxBy: 0 },
  };
}

function startTimerIfNeeded(state: GameState, nowMs: number) {
  if (state.status === "ready") {
    state.status = "playing";
    state.startedAtMs = nowMs;
  }
}

function unlockBlock(state: GameState, bx: number, by: number) {
  if (!isInBounds(bx, by, state.config)) {
    return;
  }
  const id = blockIdOf(bx, by);
  if (state.unlockedBlocks.has(id)) {
    return;
  }
  ensureBlockWithMines(state, bx, by);
  state.unlockedBlocks.add(id);
  state.bounds = {
    minBx: Math.min(state.bounds.minBx, bx),
    maxBx: Math.max(state.bounds.maxBx, bx),
    minBy: Math.min(state.bounds.minBy, by),
    maxBy: Math.max(state.bounds.maxBy, by),
  };

  // Tally mines/non-mines in the newly unlocked block.
  const block = state.blocks.get(id);
  if (block) {
    let mines = 0;
    for (const cell of block.cells) {
      if (cell.isMine) {
        mines += 1;
      }
    }
    state.targetReveals +=
      state.config.blockWidth * state.config.blockHeight - mines;
  }
}

function placeFirstClickSafeMines(state: GameState, x: number, y: number) {
  const { bx, by, lx, ly } = worldToBlock(x, y, state.config);
  if (!isInBounds(bx, by, state.config)) {
    return;
  }
  const block = ensureBlock(state, bx, by);
  if (!block || block.minesPlaced) {
    return;
  }
  // Exclude the clicked cell and its 8 neighbours (clamped to this block).
  const excluded = new Set<number>();
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const nlx = lx + dx;
      const nly = ly + dy;
      if (
        nlx >= 0 &&
        nlx < state.config.blockWidth &&
        nly >= 0 &&
        nly < state.config.blockHeight
      ) {
        excluded.add(nly * state.config.blockWidth + nlx);
      }
    }
  }
  placeBlockMines(block, state, excluded);

  // Recount the initial block's target reveals now that mines exist.
  let mines = 0;
  for (const cell of block.cells) {
    if (cell.isMine) {
      mines += 1;
    }
  }
  // Reset to "just this block" baseline then add the actual non-mine count.
  state.targetReveals =
    state.config.blockWidth * state.config.blockHeight - mines;
}

// ─── Reveal & flood-fill ─────────────────────────────────────────────────

const FLOOD_CAP = 50000;

function checkWin(state: GameState) {
  if (state.status === "playing" && state.revealedCount >= state.targetReveals) {
    // In endless this requires having revealed every non-mine cell across
    // every currently-unlocked block. Possible in principle but exceedingly
    // unlikely once you've expanded.
    state.status = "won";
    state.finishedAtMs = Date.now();
  }
}

function loseAt(state: GameState, x: number, y: number) {
  const cell = getCellAt(state, x, y);
  if (cell) {
    cell.triggeredMine = true;
    cell.isRevealed = true;
  }
  state.status = "lost";
  state.finishedAtMs = Date.now();
  // Reveal every other mine in unlocked blocks for fairness/clarity.
  for (const id of state.unlockedBlocks) {
    const block = state.blocks.get(id);
    if (!block) continue;
    for (const c of block.cells) {
      if (c.isMine) {
        c.isRevealed = true;
      }
    }
  }
}

export function reveal(state: GameState, x: number, y: number, nowMs = Date.now()) {
  if (state.status === "won" || state.status === "lost") return;
  const cell = getCellAt(state, x, y);
  if (!cell || cell.isRevealed || cell.isFlagged) return;

  if (state.status === "ready") {
    // Defer mine placement until first click in the very first block so we
    // can guarantee a safe spawn (clicked cell + neighbours are excluded).
    placeFirstClickSafeMines(state, x, y);
    startTimerIfNeeded(state, nowMs);
  }

  if (cellIsMine(state, x, y)) {
    loseAt(state, x, y);
    return;
  }

  // BFS flood fill. Reveals connected 0-adj region and the border of numbered
  // cells. Crosses block boundaries: any neighbour cell in a not-yet-unlocked
  // block triggers `unlockBlock(...)` and the flood continues into it.
  const queue: Array<[number, number]> = [[x, y]];
  let processed = 0;
  while (queue.length > 0 && processed < FLOOD_CAP) {
    const [cx, cy] = queue.shift()!;
    const c = getCellAt(state, cx, cy);
    if (!c || c.isRevealed || c.isFlagged) {
      continue;
    }
    c.isRevealed = true;
    state.revealedCount += 1;
    processed += 1;

    const adj = getOrComputeAdj(state, cx, cy);
    if (adj === 0) {
      for (const [dx, dy] of NEIGHBOR_DELTAS) {
        const nx = cx + dx;
        const ny = cy + dy;
        const { bx, by } = worldToBlock(nx, ny, state.config);
        if (!isInBounds(bx, by, state.config)) continue;
        // Unlock neighbouring block if needed before queuing.
        const nid = blockIdOf(bx, by);
        if (!state.unlockedBlocks.has(nid)) {
          unlockBlock(state, bx, by);
        }
        const ncell = getCellAt(state, nx, ny);
        if (ncell && !ncell.isRevealed && !ncell.isFlagged) {
          queue.push([nx, ny]);
        }
      }
    } else {
      // Non-zero cells still unlock blocks they touch (so the player sees
      // numbers that hint at neighbouring mines), but the flood stops.
      for (const [dx, dy] of NEIGHBOR_DELTAS) {
        const { bx, by } = worldToBlock(cx + dx, cy + dy, state.config);
        if (!isInBounds(bx, by, state.config)) continue;
        const nid = blockIdOf(bx, by);
        if (!state.unlockedBlocks.has(nid)) {
          // Only unlock if the neighbour is in the same block — this keeps
          // the endless expansion driven by `0-adj` flood, not by single
          // numbered edge clicks. Otherwise every edge click would unlock.
          // (Comment-out check; the design choice is to NOT auto-unlock from
          // numbered edges.)
        }
      }
    }
  }

  checkWin(state);
}

export function toggleFlag(state: GameState, x: number, y: number) {
  if (state.status === "won" || state.status === "lost") return;
  const cell = getCellAt(state, x, y);
  if (!cell || cell.isRevealed) return;
  cell.isFlagged = !cell.isFlagged;
  state.flagsPlaced += cell.isFlagged ? 1 : -1;
}

// Chord reveal: when the player clicks a revealed numbered cell whose flagged
// neighbours equal its number, sweep the remaining non-flagged neighbours.
// Classic minesweeper convenience.
export function chord(state: GameState, x: number, y: number) {
  if (state.status !== "playing") return;
  const cell = getCellAt(state, x, y);
  if (!cell || !cell.isRevealed || cell.adjMines <= 0) return;

  let flagged = 0;
  const targets: Array<[number, number]> = [];
  for (const [dx, dy] of NEIGHBOR_DELTAS) {
    const nx = x + dx;
    const ny = y + dy;
    const ncell = getCellAt(state, nx, ny);
    if (!ncell) continue;
    if (ncell.isFlagged) {
      flagged += 1;
    } else if (!ncell.isRevealed) {
      targets.push([nx, ny]);
    }
  }
  if (flagged === cell.adjMines) {
    for (const [tx, ty] of targets) {
      reveal(state, tx, ty);
      if ((state.status as GameStatus) === "lost") {
        return;
      }
    }
  }
}

// ─── Snapshot helper for React ───────────────────────────────────────────

export function cloneState(state: GameState): GameState {
  const blocks = new Map<string, Block>();
  for (const [id, block] of state.blocks) {
    blocks.set(id, {
      bx: block.bx,
      by: block.by,
      minesPlaced: block.minesPlaced,
      cells: block.cells.map((c) => ({ ...c })),
    });
  }
  return {
    ...state,
    blocks,
    unlockedBlocks: new Set(state.unlockedBlocks),
    bounds: { ...state.bounds },
  };
}
