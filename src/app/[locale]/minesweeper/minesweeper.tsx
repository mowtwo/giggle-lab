"use client";

import { Button, Card, Cursor, Divider, Footer, Icon } from "animal-island-ui";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import {
  chord,
  cloneState,
  createGame,
  DIFFICULTY_CONFIG,
  type Difficulty,
  type GameState,
  getCellAt,
  reveal,
  toggleFlag,
} from "./game-logic";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "endless"];

const NUMBER_COLOR: Record<number, string> = {
  1: "#2196f3",
  2: "#43a047",
  3: "#e53935",
  4: "#5e35b1",
  5: "#8e6c4e",
  6: "#00acc1",
  7: "#455a64",
  8: "#757575",
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${pad2(hours)}:${pad2(minutes % 60)}:${pad2(seconds)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

export function Minesweeper() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("Minesweeper");

  const [state, setState] = useState<GameState>(() => createGame("easy"));
  // Pure helper: apply a mutating function to a fresh clone of state.
  const dispatch = useCallback(
    (mutator: (draft: GameState) => void) => {
      setState((prev) => {
        const next = cloneState(prev);
        mutator(next);
        return next;
      });
    },
    [],
  );

  const [flagMode, setFlagMode] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Tick the timer once per second while playing.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  const isEndless = state.difficulty === "endless";

  const elapsedMs = useMemo(() => {
    if (state.startedAtMs === null) return 0;
    const end =
      state.finishedAtMs ?? (state.status === "playing" ? nowMs : state.startedAtMs);
    return Math.max(0, end - state.startedAtMs);
  }, [nowMs, state.finishedAtMs, state.startedAtMs, state.status]);

  // Total mines visible to the player. In classic this is fixed; in endless
  // it grows as blocks unlock.
  const totalMines = useMemo(() => {
    let count = 0;
    for (const id of state.unlockedBlocks) {
      const block = state.blocks.get(id);
      if (!block) continue;
      // If mines aren't placed yet we still report the configured count.
      if (!block.minesPlaced) {
        count += state.config.minesPerBlock;
        continue;
      }
      for (const c of block.cells) {
        if (c.isMine) count += 1;
      }
    }
    return count;
  }, [state.blocks, state.config.minesPerBlock, state.unlockedBlocks]);

  const minesRemaining = totalMines - state.flagsPlaced;

  const handleNewGame = useCallback(
    (difficulty: Difficulty) => {
      setState(createGame(difficulty));
      setFlagMode(false);
    },
    [],
  );

  const handleReveal = useCallback(
    (x: number, y: number) => {
      dispatch((s) => {
        if (s.status === "won" || s.status === "lost") return;
        const cell = getCellAt(s, x, y);
        if (!cell) return;
        if (flagMode) {
          toggleFlag(s, x, y);
          return;
        }
        if (cell.isFlagged) return;
        if (cell.isRevealed) {
          chord(s, x, y);
        } else {
          reveal(s, x, y);
        }
      });
    },
    [dispatch, flagMode],
  );

  const handleFlag = useCallback(
    (x: number, y: number) => {
      dispatch((s) => {
        if (s.status === "won" || s.status === "lost") return;
        toggleFlag(s, x, y);
      });
    },
    [dispatch],
  );

  const statusBanner = useMemo(() => {
    if (state.status === "won") return t("statusWon");
    if (state.status === "lost") return t("statusLost");
    if (state.status === "ready") return t("statusReady");
    return t("statusPlaying");
  }, [state.status, t]);

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
            <Card type="title" color="lime-green" className="p-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Icon name="icon-diy" size={64} bounce />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#3d7a32]">
                      Minesweeper
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
                  {DIFFICULTIES.map((d) => {
                    const cfg = DIFFICULTY_CONFIG[d];
                    const fixed = cfg.fixedBlockCount;
                    const label = fixed
                      ? t("difficultySpec", {
                          rows: cfg.blockHeight * fixed.rows,
                          cols: cfg.blockWidth * fixed.cols,
                          mines: cfg.minesPerBlock,
                        })
                      : t("difficultySpecEndless", {
                          rows: cfg.blockHeight,
                          cols: cfg.blockWidth,
                          mines: cfg.minesPerBlock,
                        });
                    const selected = state.difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleNewGame(d)}
                        className={`grid gap-1 rounded-lg border-2 px-3 py-2 text-left transition ${
                          selected
                            ? "border-[#7fbf3f] bg-[#e9f8d6] text-[#3d7a32]"
                            : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
                        }`}
                      >
                        <span className="text-sm font-black">
                          {t(`difficulty.${d}`)}
                        </span>
                        <span className="text-[10px] font-black leading-tight opacity-80">
                          {label}
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

          <div className="min-w-0 space-y-5">
            <Card color="lime-green" className="min-w-0 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 min-w-[80px] items-center justify-center gap-2 rounded-lg bg-white/80 px-3 text-base font-black text-[#794f27]">
                    <span>💣</span>
                    <span className="tabular-nums">{minesRemaining}</span>
                  </span>
                  <span className="inline-flex h-12 min-w-[100px] items-center justify-center gap-2 rounded-lg bg-white/80 px-3 text-base font-black text-[#794f27]">
                    <span>⏱</span>
                    <span className="tabular-nums">{formatElapsed(elapsedMs)}</span>
                  </span>
                  <span className="inline-flex h-12 items-center justify-center rounded-lg bg-white/80 px-4 text-sm font-black text-[#794f27]">
                    {statusBanner}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlagMode((v) => !v)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-black transition ${
                      flagMode
                        ? "border-[#e53935] bg-[#ffe5e3] text-[#b71c1c]"
                        : "border-[#d4c9b4] bg-white/70 text-[#725d42]"
                    }`}
                  >
                    🚩 {t(flagMode ? "flagModeOn" : "flagModeOff")}
                  </button>
                  <Button
                    type="primary"
                    onClick={() => handleNewGame(state.difficulty)}
                  >
                    {t("restart")}
                  </Button>
                </div>
              </div>
            </Card>

            <Card color="default" className="min-w-0 p-3 sm:p-4">
              {isEndless ? (
                <EndlessBoard
                  state={state}
                  onReveal={handleReveal}
                  onFlag={handleFlag}
                  flagMode={flagMode}
                />
              ) : (
                <ClassicBoard
                  state={state}
                  onReveal={handleReveal}
                  onFlag={handleFlag}
                  flagMode={flagMode}
                />
              )}
            </Card>

            {isEndless ? (
              <p className="rounded-lg bg-[#fffdf2] p-4 text-sm font-bold leading-6 text-[#725d42]">
                {t("endlessHint")}
              </p>
            ) : null}
          </div>
        </section>

        <Footer type="tree" />
      </main>
    </Cursor>
  );
}

type BoardProps = {
  state: GameState;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
  flagMode: boolean;
};

function ClassicBoard({ state, onReveal, onFlag }: BoardProps) {
  const fixed = state.config.fixedBlockCount!;
  const totalCols = state.config.blockWidth * fixed.cols;
  const totalRows = state.config.blockHeight * fixed.rows;

  // Choose a cell size that fits 95vw at most (mobile), capped at 36px.
  const cellSize = Math.min(36, Math.floor((Math.min(900, 1100) - 32) / totalCols));
  const effectiveCellSize = Math.max(20, cellSize);

  const cellsJsx: React.ReactNode[] = [];
  for (let y = 0; y < totalRows; y += 1) {
    for (let x = 0; x < totalCols; x += 1) {
      cellsJsx.push(
        <CellView
          key={`${x},${y}`}
          x={x}
          y={y}
          state={state}
          size={effectiveCellSize}
          onReveal={onReveal}
          onFlag={onFlag}
        />,
      );
    }
  }

  return (
    <div className="overflow-auto">
      <div
        role="grid"
        aria-label="minesweeper-board"
        className="mx-auto grid w-fit rounded-md bg-[#7faa3c] p-1 shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_4px_0_#5e8b27]"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, ${effectiveCellSize}px)`,
          gridTemplateRows: `repeat(${totalRows}, ${effectiveCellSize}px)`,
        }}
      >
        {cellsJsx}
      </div>
    </div>
  );
}

function EndlessBoard({ state, onReveal, onFlag }: BoardProps) {
  const cellSize = 28;
  const { minBx, maxBx, minBy, maxBy } = state.bounds;
  const blockW = state.config.blockWidth;
  const blockH = state.config.blockHeight;
  const visibleCols = (maxBx - minBx + 1) * blockW;
  const visibleRows = (maxBy - minBy + 1) * blockH;

  const cellsJsx: React.ReactNode[] = [];
  for (const id of state.unlockedBlocks) {
    const block = state.blocks.get(id);
    if (!block) continue;
    const baseX = block.bx * blockW;
    const baseY = block.by * blockH;
    for (let ly = 0; ly < blockH; ly += 1) {
      for (let lx = 0; lx < blockW; lx += 1) {
        const x = baseX + lx;
        const y = baseY + ly;
        cellsJsx.push(
          <CellView
            key={`${x},${y}`}
            x={x}
            y={y}
            state={state}
            size={cellSize}
            onReveal={onReveal}
            onFlag={onFlag}
            gridColumn={x - minBx * blockW + 1}
            gridRow={y - minBy * blockH + 1}
          />,
        );
      }
    }
  }

  return (
    <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-md bg-[#83b340] shadow-[inset_0_4px_0_rgba(255,255,255,0.25)]">
      <TransformWrapper
        initialScale={1}
        minScale={0.25}
        maxScale={2}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
        limitToBounds={false}
        centerOnInit={false}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ display: "block" }}
        >
          <div
            role="grid"
            aria-label="minesweeper-endless-board"
            className="grid bg-[#7faa3c] p-1"
            style={{
              gridTemplateColumns: `repeat(${visibleCols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${visibleRows}, ${cellSize}px)`,
            }}
          >
            {cellsJsx}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

type CellViewProps = {
  x: number;
  y: number;
  state: GameState;
  size: number;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
  gridColumn?: number;
  gridRow?: number;
};

function CellView({
  x,
  y,
  state,
  size,
  onReveal,
  onFlag,
  gridColumn,
  gridRow,
}: CellViewProps) {
  // Hooks must run unconditionally — keep these at the top before any early
  // return.
  const pressTimerRef = useRef<number | null>(null);
  const flaggedDuringPressRef = useRef(false);

  const cell = getCellAt(state, x, y);
  // For endless: if block isn't generated yet, render a faded placeholder.
  if (!cell) {
    return (
      <div
        className="border border-[#71993a] bg-[#8fbf4b]"
        style={{
          width: size,
          height: size,
          gridColumn,
          gridRow,
        }}
      />
    );
  }

  const isChecker = (x + y) % 2 === 0;

  let bg: string;
  let content: React.ReactNode = null;

  if (cell.isRevealed) {
    if (cell.isMine) {
      bg = cell.triggeredMine ? "#e53935" : "#d8786a";
      content = (
        <span className="leading-none" style={{ fontSize: size * 0.55 }}>
          💣
        </span>
      );
    } else {
      bg = isChecker ? "#efdfb0" : "#e0cc99";
      if (cell.adjMines > 0) {
        content = (
          <span
            className="select-none font-black leading-none"
            style={{
              color: NUMBER_COLOR[cell.adjMines] ?? "#000",
              fontSize: size * 0.6,
            }}
          >
            {cell.adjMines}
          </span>
        );
      }
    }
  } else {
    bg = isChecker ? "#b3da78" : "#9ccc5c";
    if (cell.isFlagged) {
      content = (
        <span className="leading-none" style={{ fontSize: size * 0.55 }}>
          🚩
        </span>
      );
    }
  }

  function onContextMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    onFlag(x, y);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "touch") return;
    flaggedDuringPressRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      flaggedDuringPressRef.current = true;
      onFlag(x, y);
    }, 320);
  }
  function clearPress() {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }
  function onClick() {
    if (flaggedDuringPressRef.current) {
      flaggedDuringPressRef.current = false;
      return;
    }
    onReveal(x, y);
  }

  const borderStyle = cell.isRevealed
    ? "border border-[#c4b18b]"
    : "border border-[#71993a] shadow-[inset_0_2px_0_rgba(255,255,255,0.55)]";

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      className={`flex items-center justify-center ${borderStyle} transition-colors duration-75`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        gridColumn,
        gridRow,
      }}
      aria-label={`cell ${x},${y}`}
    >
      {content}
    </button>
  );
}

