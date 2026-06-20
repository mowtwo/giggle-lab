import type { AdouBattleState } from "./battle-state";
import { mergeAdouHandItems } from "./hand";
import type { AdouPoint } from "./map";
import { getAdouUnitAt } from "./placement";
import { getAdouSkill, type AdouSkillTarget } from "./skills";
import { resolveAdouUnitStats } from "./units";

export type AdouPlayTarget =
  | { type: "none" }
  | { type: "cell"; col: number; row: number }
  | { type: "hand"; index: number };

export type AdouAiAction =
  | { type: "wait"; reason: string; score: number }
  | { type: "refresh"; reason: string; score: number }
  | { type: "merge-hand"; sourceIndex: number; targetIndex: number; reason: string; score: number }
  | { type: "play-hand"; handIndex: number; target: AdouPlayTarget; reason: string; score: number }
  | { type: "use-active-skill"; slotIndex: number; target: AdouPlayTarget; reason: string; score: number };

export type AdouAiPlanOptions = {
  allowActiveSkills?: boolean;
};

function routeDistanceScore(state: AdouBattleState, point: AdouPoint) {
  const route = state.map.routes.ai;
  if (route.length === 0) return 0;
  const best = route.reduce((score, routePoint, index) => {
    const distance = Math.abs(routePoint.col - point.col) + Math.abs(routePoint.row - point.row);
    const progressWeight = index / route.length;
    return Math.max(score, (1 / (1 + distance)) * (1 + progressWeight));
  }, 0);
  return best;
}

export function getAdouThreatLevel(state: AdouBattleState, side: "player" | "ai" = "ai") {
  const routeEnd = Math.max(1, state.map.routes[side].length - 1);
  return state.enemies
    .filter((enemy) => enemy.targetSide === side)
    .reduce((threat, enemy) => Math.max(threat, enemy.progress / routeEnd), 0);
}

export function chooseAdouBuildTarget(state: AdouBattleState, side: "player" | "ai" = "ai") {
  const candidates = state.tiles
    .filter((tile) => tile.owner === side && tile.kind === "plot")
    .filter((tile) => !getAdouUnitAt(state.units, tile))
    .map((tile) => ({
      target: { type: "cell" as const, col: tile.col, row: tile.row },
      score: routeDistanceScore(state, tile),
    }))
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.target ?? { type: "none" as const };
}

function chooseAdouRoadTarget(state: AdouBattleState, side: "player" | "ai" = "ai") {
  const route = state.map.routes[side];
  if (route.length === 0) return { type: "none" as const };
  const danger = state.enemies
    .filter((enemy) => enemy.targetSide === side)
    .sort((a, b) => b.progress - a.progress)[0];
  const index = danger
    ? Math.max(1, Math.min(route.length - 2, Math.ceil(danger.progress + 0.75)))
    : Math.floor(route.length * 0.7);
  const point = route[index];
  return point ? { type: "cell" as const, col: point.col, row: point.row } : { type: "none" as const };
}

function chooseAdouUnitTarget(state: AdouBattleState, side: "player" | "ai" = "ai") {
  const unit = state.units
    .filter((candidate) => candidate.side === side && candidate.kind !== "farmer")
    .sort((a, b) => {
      const aStats = resolveAdouUnitStats(a, { rangeMultiplier: state.sides[side].rangeBonus });
      const bStats = resolveAdouUnitStats(b, { rangeMultiplier: state.sides[side].rangeBonus });
      return bStats.damage - aStats.damage;
    })[0];
  return unit ? { type: "cell" as const, col: unit.col, row: unit.row } : { type: "none" as const };
}

function chooseWorstHandIndex(state: AdouBattleState, side: "player" | "ai" = "ai") {
  const hand = state.sides[side].hand;
  let index = hand.findIndex((item) => item === null);
  if (index >= 0) return index;
  index = hand.findIndex((item) => item?.type === "card" && item.card.kind === "tool");
  if (index >= 0) return index;
  return Math.max(0, hand.length - 1);
}

function chooseAdouSkillTarget(
  state: AdouBattleState,
  target: AdouSkillTarget,
  side: "player" | "ai" = "ai",
): AdouPlayTarget {
  if (target === "none") return { type: "none" };
  if (target === "hand") return { type: "hand", index: chooseWorstHandIndex(state, side) };
  if (target === "unit") return chooseAdouUnitTarget(state, side);
  if (target === "road") return chooseAdouRoadTarget(state, side);
  return chooseAdouBuildTarget(state, side);
}

function scoreAdouHandItemPlay(state: AdouBattleState, index: number) {
  const item = state.sides.ai.hand[index];
  if (!item) return null;
  if (item.type === "unit") {
    const target = chooseAdouBuildTarget(state);
    if (target.type === "none") return null;
    const stats = resolveAdouUnitStats(item.unit);
    return {
      type: "play-hand" as const,
      handIndex: index,
      target,
      reason: `部署 ${item.unit.name}`,
      score: 28 + item.unit.tier * 8 + stats.damage,
    };
  }

  const card = item.card;
  if (card.kind === "tool") {
    return {
      type: "play-hand" as const,
      handIndex: index,
      target: chooseAdouBuildTarget(state),
      reason: "使用铲子扩地",
      score: 42,
    };
  }

  if (card.kind === "soldier" || card.kind === "farmer") {
    const target = chooseAdouBuildTarget(state);
    if (target.type === "none") return null;
    return {
      type: "play-hand" as const,
      handIndex: index,
      target,
      reason: `部署 ${card.token}`,
      score: card.kind === "farmer" ? 22 : 30,
    };
  }

  return null;
}

function chooseAdouHandMerge(state: AdouBattleState) {
  const hand = state.sides.ai.hand;
  let uid = state.nextUid + 1000;
  let best: AdouAiAction | null = null;

  for (let sourceIndex = 0; sourceIndex < hand.length; sourceIndex += 1) {
    for (let targetIndex = 0; targetIndex < hand.length; targetIndex += 1) {
      if (sourceIndex === targetIndex) continue;
      const result = mergeAdouHandItems(
        hand[sourceIndex] ?? null,
        hand[targetIndex] ?? null,
        () => uid++,
      );
      if (!result.ok) continue;
      const tier = result.item.type === "unit" ? result.item.unit.tier : 1;
      const score = result.action === "compose-unit" ? 80 + tier * 4 : 56 + tier * 7;
      if (!best || score > best.score) {
        best = {
          type: "merge-hand",
          sourceIndex,
          targetIndex,
          reason: result.action === "compose-unit" ? "合成武将/单位" : "升级待选单位",
          score,
        };
      }
    }
  }

  return best;
}

function chooseAdouActiveSkill(state: AdouBattleState, threat: number) {
  const slots = state.sides.ai.activeSkills;
  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const slot = slots[slotIndex];
    if (!slot || slot.remainingSeconds > 0) continue;
    const skill = getAdouSkill(slot.skillId);
    if (!skill || skill.kind !== "active") continue;
    if (skill.id === "inkstone" && threat < 0.25) continue;
    if ((skill.target === "road" || skill.target === "unit") && threat < 0.08) continue;
    const target = chooseAdouSkillTarget(state, skill.target);
    if (skill.target !== "none" && target.type === "none") continue;
    return {
      type: "use-active-skill" as const,
      slotIndex,
      target,
      reason: `使用 ${skill.title}`,
      score: 48 + skill.rarity * 12 + threat * 30,
    };
  }
  return null;
}

export function chooseAdouAiAction(
  state: AdouBattleState,
  options: AdouAiPlanOptions = {},
): AdouAiAction {
  const threat = getAdouThreatLevel(state, "ai");
  const activeSkill = options.allowActiveSkills === false ? null : chooseAdouActiveSkill(state, threat);
  if (activeSkill) return activeSkill;

  const merge = chooseAdouHandMerge(state);
  if (merge && merge.score >= 60) return merge;

  const plays = state.sides.ai.hand
    .map((_item, index) => scoreAdouHandItemPlay(state, index))
    .filter((action): action is NonNullable<typeof action> => action !== null)
    .sort((a, b) => b.score - a.score);
  const bestPlay = plays[0];
  if (bestPlay && bestPlay.score >= 30) return bestPlay;

  if (state.sides.ai.mantou >= state.sides.ai.refreshCost) {
    return { type: "refresh", reason: "待选区质量不足", score: 25 + threat * 20 };
  }

  return { type: "wait", reason: "等待馒头或敌情变化", score: 0 };
}
