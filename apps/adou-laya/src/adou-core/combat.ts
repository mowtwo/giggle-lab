import type { AdouBattleState, AdouEnemy } from "./battle-state";
import type { AdouPoint } from "./map";
import type { AdouBoardUnit } from "./placement";
import {
  resolveAdouUnitStats,
  type AdouResolvedUnitStats,
} from "./units";

export type AdouWorldPoint = {
  x: number;
  y: number;
};

export type AdouTargetCandidate = {
  enemy: AdouEnemy;
  position: AdouWorldPoint;
  distance: number;
};

export type AdouAttackPlan = {
  unit: AdouBoardUnit;
  origin: AdouWorldPoint;
  stats: AdouResolvedUnitStats;
  primary: AdouTargetCandidate;
  targets: readonly AdouTargetCandidate[];
};

export function adouDistance(a: AdouWorldPoint, b: AdouWorldPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getAdouEnemyPoint(state: Pick<AdouBattleState, "map">, enemy: AdouEnemy) {
  const route = state.map.routes[enemy.targetSide];
  const maxProgress = route.length - 1;
  const progress = Math.max(0, Math.min(enemy.progress, maxProgress));
  const index = Math.floor(progress);
  const local = progress - index;
  const from = route[index] ?? route[0] ?? { col: 0, row: 0 };
  const to = route[Math.min(index + 1, maxProgress)] ?? from;
  return {
    x: from.col + (to.col - from.col) * local + 0.5,
    y: from.row + (to.row - from.row) * local + 0.5,
  };
}

export function getAdouUnitCenter(unit: Pick<AdouBoardUnit, "col" | "row" | "width">) {
  return {
    x: unit.col + unit.width / 2,
    y: unit.row + 0.5,
  };
}

export function getAdouUnitCellsForRange(
  unit: Pick<AdouBoardUnit, "col" | "row" | "width">,
  range: number,
) {
  const center = getAdouUnitCenter(unit);
  const minCol = Math.floor(center.x - range);
  const maxCol = Math.ceil(center.x + range);
  const minRow = Math.floor(center.y - range);
  const maxRow = Math.ceil(center.y + range);
  const cells: AdouPoint[] = [];

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      const cellCenter = { x: col + 0.5, y: row + 0.5 };
      if (adouDistance(center, cellCenter) <= range) cells.push({ col, row });
    }
  }

  return cells;
}

export function getAdouAttackCandidates(
  state: Pick<AdouBattleState, "map" | "enemies" | "sides">,
  unit: AdouBoardUnit,
  stats: AdouResolvedUnitStats,
) {
  const origin = getAdouUnitCenter(unit);
  return state.enemies
    .filter((enemy) => enemy.targetSide === unit.side)
    .map((enemy) => {
      const position = getAdouEnemyPoint(state, enemy);
      return {
        enemy,
        position,
        distance: adouDistance(origin, position),
      };
    })
    .filter((entry) => entry.distance <= stats.attackRange)
    .sort((a, b) => b.enemy.progress - a.enemy.progress);
}

function distanceToLine(point: AdouWorldPoint, a: AdouWorldPoint, b: AdouWorldPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0) return adouDistance(point, a);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return adouDistance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

function selectAdouAttackTargets(
  origin: AdouWorldPoint,
  primary: AdouTargetCandidate,
  candidates: readonly AdouTargetCandidate[],
  stats: AdouResolvedUnitStats,
) {
  if (stats.attackStyle === "area") {
    return candidates
      .filter((entry) => adouDistance(primary.position, entry.position) <= 0.9)
      .slice(0, 4);
  }

  if (stats.attackStyle === "pierce") {
    return candidates
      .filter((entry) => distanceToLine(entry.position, origin, primary.position) <= 0.45)
      .slice(0, 3);
  }

  if (stats.attackStyle === "rapid") return candidates.slice(0, 2);
  return [primary];
}

export function planAdouUnitAttack(
  state: Pick<AdouBattleState, "map" | "enemies" | "sides">,
  unit: AdouBoardUnit,
  options: {
    weaponId?: number | null;
    unitAttackSpeedMultiplier?: number;
  } = {},
): AdouAttackPlan | null {
  const runtime = state.sides[unit.side];
  const stats = resolveAdouUnitStats(unit, {
    weaponId: options.weaponId ?? null,
    rangeMultiplier: runtime.rangeBonus,
    attackSpeedMultiplier: runtime.attackSpeedBonus,
    unitAttackSpeedMultiplier: options.unitAttackSpeedMultiplier ?? 1,
  });

  if (stats.damage <= 0 || stats.attackRange <= 0) return null;

  const candidates = getAdouAttackCandidates(state, unit, stats);
  const primary = candidates[0];
  if (!primary) return null;

  const origin = getAdouUnitCenter(unit);
  return {
    unit,
    origin,
    stats,
    primary,
    targets: selectAdouAttackTargets(origin, primary, candidates, stats),
  };
}

export function applyAdouAttackPlan(
  state: AdouBattleState,
  plan: AdouAttackPlan,
) {
  const targetIds = new Set(plan.targets.map((target) => target.enemy.uid));
  state.enemies = state.enemies
    .map((enemy) => {
      if (!targetIds.has(enemy.uid)) return enemy;
      return { ...enemy, hp: enemy.hp - plan.stats.damage };
    })
    .filter((enemy) => enemy.hp > 0);
}
