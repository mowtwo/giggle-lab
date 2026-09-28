"use client";

import { Button, Cursor, Icon } from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import {
  applyPick,
  assessRound,
  cellOrigin,
  clearFlash,
  createReady,
  DIFFICULTY_IDS,
  difficultyById,
  elapsedMs,
  expireRound,
  FLASH_MS,
  formatClock,
  formatRatePercent,
  foundCount,
  HEX_CLIP,
  hiveMetrics,
  remainingMs,
  REPEAT_GUARD_MS,
  startRound,
  TIME_BANDS_SEC,
  type DifficultyId,
  type GradeId,
  type RoundState,
} from "./game-logic";

const WAX = "#ffd56a";
const INK = "#4a3018";
const HIT = "#8ed46a";
const MISS = "#ff8a78";
const DRAW_SCALE = 0.92;

const GRADE_COLOR: Record<GradeId, string> = {
  sharp: "text-[#2f7d32]",
  good: "text-[#8a5a00]",
  pass: "text-[#4a3018]",
  again: "text-[#c4492c]",
};

export function SchulteHive() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("SchulteHive");

  const [round, setRound] = useState<RoundState>(() => createReady("steady"));
  const [now, setNow] = useState(() => Date.now());
  const [box, setBox] = useState({ width: 0, height: 0 });
  const lastPickRef = useRef<{ id: string; at: number } | null>(null);
  const flashTokenRef = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const difficulty = difficultyById(round.difficultyId);
  const playing = round.phase === "playing";
  const remaining = remainingMs(round, now);
  const clock =
    playing || round.phase === "ready"
      ? formatClock(remaining)
      : formatClock(elapsedMs(round, now), "floor");
  const urgent = playing && remaining <= 30_000;

  useEffect(() => {
    const element = boardRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setBox({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (round.phase !== "playing") return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      setRound((current) => expireRound(current, time));
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [round.phase]);

  useEffect(() => {
    const flash = round.flash;
    if (!flash) return;
    const id = window.setTimeout(() => {
      setRound((current) => clearFlash(current, flash.token));
    }, FLASH_MS);
    return () => window.clearTimeout(id);
  }, [round.flash]);

  const begin = useCallback(() => {
    const time = Date.now();
    lastPickRef.current = null;
    setNow(time);
    setRound((current) => startRound(current.difficultyId, time));
  }, []);

  const selectDifficulty = useCallback((id: DifficultyId) => {
    lastPickRef.current = null;
    setRound(createReady(id));
  }, []);

  const onPick = useCallback((cellId: string) => {
    const time = Date.now();
    const last = lastPickRef.current;
    if (last && last.id === cellId && time - last.at < REPEAT_GUARD_MS) return;
    lastPickRef.current = { id: cellId, at: time };
    flashTokenRef.current += 1;
    const token = flashTokenRef.current;
    setNow(time);
    setRound((current) => applyPick(current, cellId, time, token) ?? current);
  }, []);

  const metrics = hiveMetrics(difficulty.radius, box.width, box.height);
  const found = foundCount(round);
  const assessment = assessRound(round, now);
  const rateLabel = assessment ? formatRatePercent(assessment.missRate) : "0";
  const bands = TIME_BANDS_SEC[round.difficultyId];
  const resultLine = assessment
    ? !assessment.finished
      ? t("gradeUnfinished", { found, total: difficulty.count, rate: rateLabel })
      : assessment.speedGrade === "again"
        ? t("gradeSlow", { rate: rateLabel })
        : assessment.speedGrade !== assessment.grade
          ? t("gradeDropped", {
              speed: t(`grade.${assessment.speedGrade}`),
              rate: rateLabel,
              grade: t(`grade.${assessment.grade}`),
            })
          : t("gradeHeld", { rate: rateLabel })
    : "";
  const live =
    assessment?.finished
      ? t("clearedLive", { grade: t(`grade.${assessment.grade}`), time: clock, rate: rateLabel })
      : assessment
        ? t("expiredLive", { found, rate: rateLabel })
        : round.phase === "playing" && round.flash?.kind === "miss"
          ? t("missLive", { n: round.next, count: round.misses })
          : round.phase === "playing"
            ? t("seekLive", { n: round.next })
            : "";

  return (
    <Cursor>
      <main className="flex h-dvh flex-col overflow-hidden overscroll-none px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[#4a3018] sm:px-5">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <Button type="default" size="small" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <div className="mx-auto mt-3 w-full max-w-3xl shrink-0 [@media(max-height:560px)]:mt-1">
          <div className="flex items-center gap-3">
            {round.phase === "ready" ? (
              <span className="[@media(max-height:560px)]:hidden">
                <Icon name="icon-critterpedia" size={48} />
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-none sm:text-3xl [@media(max-height:560px)]:text-xl">
                {t("title")}
              </h1>
              {round.phase === "ready" ? (
                <p className="mt-2 text-sm font-bold leading-5 text-[#725d42] [@media(max-height:560px)]:hidden">
                  {t("description")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2 [@media(max-height:560px)]:mt-1">
            {DIFFICULTY_IDS.map((id) => {
              const item = difficultyById(id);
              const selected = id === round.difficultyId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectDifficulty(id)}
                  className={`min-h-11 rounded-lg border-2 px-1.5 py-1.5 text-center transition [@media(max-height:560px)]:min-h-0 [@media(max-height:560px)]:py-1 ${
                    selected
                      ? "border-[#e0a106] bg-[#fff1c2] text-[#6a4a12]"
                      : "border-[#e6d3a4] bg-white/75 text-[#725d42]"
                  }`}
                >
                  <span className="block text-xs font-black leading-tight sm:text-sm">
                    {t(`difficulty.${id}`)}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-bold leading-tight opacity-80">
                    {t("count", { count: item.count })}
                  </span>
                </button>
              );
            })}
          </div>

          {round.phase === "ready" ? (
            <div className="mt-2 space-y-1 [@media(max-height:560px)]:hidden">
              <p className="text-xs font-bold leading-5 text-[#725d42] sm:text-sm">
                {t(`blurb.${round.difficultyId}`)}
              </p>
              <p className="text-xs font-bold leading-5 text-[#725d42]">
                {t("standard", {
                  sharp: formatClock(bands.sharp * 1000, "floor"),
                  good: formatClock(bands.good * 1000, "floor"),
                  pass: formatClock(bands.pass * 1000, "floor"),
                })}
              </p>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 [@media(max-height:560px)]:mt-1">
            <div className="flex items-end gap-4">
              <p
                className={`text-4xl font-black tabular-nums leading-none [@media(max-height:560px)]:text-2xl ${
                  urgent ? "text-[#c4492c]" : "text-[#4a3018]"
                }`}
              >
                {clock}
              </p>
              {assessment ? (
                <div className="max-w-[16rem] pb-0.5">
                  <p className={`text-lg font-black leading-none ${GRADE_COLOR[assessment.grade]}`}>
                    {t(`grade.${assessment.grade}`)}
                  </p>
                  <p className="mt-1 text-xs font-bold leading-4 text-[#725d42] sm:text-sm sm:leading-5">
                    {resultLine}
                  </p>
                </div>
              ) : null}
            </div>
            {playing ? (
              <div className="flex items-center gap-2 pb-1">
                <p
                  className="text-xs font-medium tabular-nums leading-none text-[#9c8f7a]"
                  aria-hidden="true"
                >
                  {round.next}
                </p>
                <p className="text-sm font-black tabular-nums text-[#8a704e]">
                  {t("misses", { count: round.misses })}
                </p>
                <Button type="default" size="small" onClick={begin}>
                  {t("again")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={boardRef}
          className={`mx-auto mt-2 flex min-h-0 w-full max-w-3xl flex-1 items-center justify-center px-1 ${
            playing ? "pb-16 [@media(max-height:560px)]:pb-2" : ""
          }`}
        >
          {metrics ? (
            <div className="relative" style={{ width: metrics.boardW, height: metrics.boardH }}>
              {round.cells.map((cell) => {
                const origin = cellOrigin(cell.q, cell.r, metrics.size);
                const draw = metrics.size * DRAW_SCALE;
                const hexW = draw * Math.sqrt(3);
                const hexH = draw * 2;
                const lit = round.flash?.id === cell.id ? round.flash.kind : null;
                const fontSize = Math.max(10, Math.min(28, draw * 0.5));
                return (
                  <button
                    key={cell.id}
                    type="button"
                    aria-label={cell.value == null ? undefined : t("cellLabel", { n: cell.value })}
                    aria-hidden={cell.value == null ? true : undefined}
                    tabIndex={cell.value == null || !playing ? -1 : 0}
                    onPointerDown={(event) => {
                      if (!playing || cell.value == null) return;
                      if (event.button !== 0) return;
                      event.preventDefault();
                      onPick(cell.id);
                    }}
                    onKeyDown={(event) => {
                      if (!playing || cell.value == null) return;
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      onPick(cell.id);
                    }}
                    onContextMenu={(event) => event.preventDefault()}
                    className="absolute flex appearance-none items-center justify-center border-0 p-0 font-black tabular-nums leading-none text-[#4a3018] select-none touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a3018]"
                    style={{
                      width: hexW,
                      height: hexH,
                      left: metrics.boardW / 2 + origin.x - hexW / 2,
                      top: metrics.boardH / 2 + origin.y - hexH / 2,
                      fontSize,
                      color: INK,
                      backgroundColor: lit === "hit" ? HIT : lit === "miss" ? MISS : WAX,
                      clipPath: HEX_CLIP,
                      WebkitTouchCallout: "none",
                    }}
                  >
                    <span
                      key={lit ? `${round.flash?.token}` : "still"}
                      className={lit === "hit" ? "schulte-hive-hit" : lit === "miss" ? "schulte-hive-miss" : undefined}
                    >
                      {cell.value ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {playing ? null : (
          <div className="mx-auto mb-16 w-full max-w-3xl shrink-0 pt-2 [@media(max-height:560px)]:mb-2 [@media(max-height:560px)]:pt-1">
            <Button type="primary" size="large" block onClick={begin}>
              {round.phase === "ready" ? t("start") : t("again")}
            </Button>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </main>
    </Cursor>
  );
}
