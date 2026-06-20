import { ADOU_AI_RULES, ADOU_ENEMY_RULES } from "./battle-rules";
import { chooseAdouAiAction, getAdouThreatLevel, type AdouAiAction } from "./ai";
import {
  damageAdou,
  refreshAdouBattleHand,
  updateAdouBattleFlow,
  type AdouBattleEvent,
  type AdouBattleState,
  type AdouBattleUnit,
} from "./battle-state";
import type { AdouBossSkillIntent, AdouBossSkillPlan } from "./boss-skills";
import type { AdouSide } from "./cards";
import {
  applyAdouAttackPlan,
  getAdouEnemyPoint,
  planAdouUnitAttack,
  type AdouAttackPlan,
} from "./combat";
import { updateAdouEnemies, type AdouEnemyUpdateEvent } from "./enemies";
import {
  createAdouHandCardItem,
  createAdouHandUnitItem,
  drawAdouHandItem,
  mergeAdouHandSlots,
  returnAdouHandItemToPool,
  type AdouHandItem,
} from "./hand";
import {
  createAdouPlacedUnitFromCard,
  type AdouPlacedUnit,
} from "./merge";
import type { AdouPoint } from "./map";
import {
  getAdouUnitAt,
  moveAdouUnit,
  placeAdouUnit,
  upgradeAdouBoardUnitWithCard,
} from "./placement";
import {
  planAdouSkillUse,
  type AdouSkillIntent,
  type AdouSkillPlan,
  type AdouSkillUseTarget,
} from "./skill-effects";
import type { AdouSkillId } from "./skills";
import {
  getAdouFarmerIncomeInterval,
  getAdouMaxTierForUnit,
  resolveAdouUnitStats,
} from "./units";
import { getAdouAttackVisualSpec, type AdouAttackVisualSpec } from "./attack-effects";

export type AdouCoreEvent =
  | AdouBattleEvent
  | AdouEnemyUpdateEvent
  | { type: "hand-merged"; side: AdouSide; sourceIndex: number; targetIndex: number }
  | { type: "hand-card-created"; side: AdouSide; handIndex: number; item: AdouHandItem }
  | { type: "unit-placed"; side: AdouSide; unit: AdouBattleUnit }
  | { type: "unit-moved"; side: AdouSide; unit: AdouBattleUnit; from: AdouPoint }
  | { type: "unit-swapped"; side: AdouSide; first: AdouBattleUnit; second: AdouBattleUnit }
  | { type: "unit-returned"; side: AdouSide; unit: AdouBattleUnit; handIndex: number }
  | { type: "unit-upgraded"; side: AdouSide; unit: AdouBattleUnit }
  | { type: "unit-attack"; side: AdouSide; plan: AdouAttackPlan; visual: AdouAttackVisualSpec }
  | { type: "skill-used"; side: AdouSide; plan: Extract<AdouSkillPlan, { ok: true }> }
  | { type: "ai-action"; action: AdouAiAction }
  | { type: "mantou"; side: AdouSide; amount: number; point?: AdouPoint }
  | { type: "trap-triggered"; side: AdouSide; trapUid: number }
  | { type: "action-failed"; side: AdouSide; message: string };

function nextUid(state: AdouBattleState) {
  const uid = state.nextUid;
  state.nextUid += 1;
  return uid;
}

function boardOf(state: AdouBattleState) {
  return { map: state.map, tiles: state.tiles, units: state.units };
}

function toPlacedUnit(unit: AdouBattleUnit): AdouPlacedUnit {
  if (unit.kind === "general") {
    return {
      uid: unit.uid,
      kind: "general",
      generalId: unit.generalId,
      name: unit.name,
      parts: unit.parts,
      tier: unit.tier,
      width: unit.width,
      weaponClass: unit.weaponClass,
    };
  }
  if (unit.kind === "soldier") {
    return {
      uid: unit.uid,
      kind: "soldier",
      token: unit.token,
      name: unit.name,
      tier: unit.tier,
      width: unit.width,
      weaponClass: unit.weaponClass,
    };
  }
  if (unit.kind === "farmer") {
    return {
      uid: unit.uid,
      kind: "farmer",
      token: "农",
      name: "农",
      tier: unit.tier,
      width: unit.width,
    };
  }
  return {
    uid: unit.uid,
    kind: "civilian",
    token: unit.token,
    name: unit.name,
    tier: unit.tier,
    width: unit.width,
  };
}

function weaponIdForUnit(state: AdouBattleState, side: AdouSide, unit: AdouPlacedUnit) {
  return unit.kind === "general" ? state.sides[side].weaponAssignments[unit.generalId] ?? null : null;
}

function hydrateAdouBattleUnit(
  state: AdouBattleState,
  side: AdouSide,
  unit: AdouPlacedUnit,
  point: AdouPoint,
): AdouBattleUnit {
  const weaponId = weaponIdForUnit(state, side, unit);
  const stats = resolveAdouUnitStats(unit, {
    weaponId,
    rangeMultiplier: state.sides[side].rangeBonus,
    attackSpeedMultiplier: state.sides[side].attackSpeedBonus,
  });
  return {
    ...unit,
    side,
    col: point.col,
    row: point.row,
    hp: stats.hp,
    maxHp: stats.hp,
    cooldown: 0,
    attackCount: 0,
    attackSpeedMultiplier: 1,
    incomeTimer: unit.kind === "farmer" ? getAdouFarmerIncomeInterval(unit.tier, null) : 0,
    lockTimer: 0,
    knockdownTimer: 0,
    chaosTimer: 0,
    weaponId,
  };
}

function refreshBattleUnitStats(
  state: AdouBattleState,
  unit: AdouBattleUnit,
  heal = true,
): AdouBattleUnit {
  const weaponId = weaponIdForUnit(state, unit.side, unit);
  const stats = resolveAdouUnitStats(unit, {
    weaponId,
    rangeMultiplier: state.sides[unit.side].rangeBonus,
    attackSpeedMultiplier: state.sides[unit.side].attackSpeedBonus,
    unitAttackSpeedMultiplier: unit.attackSpeedMultiplier,
  });
  const hpDelta = stats.hp - unit.maxHp;
  return {
    ...unit,
    weaponId,
    maxHp: stats.hp,
    hp: heal ? stats.hp : Math.max(1, Math.min(stats.hp, unit.hp + hpDelta)),
  };
}

function replaceUnit(state: AdouBattleState, unit: AdouBattleUnit) {
  state.units = state.units.map((candidate) => candidate.uid === unit.uid ? unit : candidate);
}

function itemToPlacedUnit(item: AdouHandItem) {
  if (item.type === "unit") return item.unit;
  return createAdouPlacedUnitFromCard(item.card);
}

export function mergeAdouBattleHandSlots(
  state: AdouBattleState,
  side: AdouSide,
  sourceIndex: number,
  targetIndex: number,
): AdouCoreEvent[] {
  if (state.sides[side].mergeLockTimer > 0) {
    return [{ type: "action-failed", side, message: "暂时无法合成" }];
  }
  const result = mergeAdouHandSlots(
    state.sides[side].hand,
    sourceIndex,
    targetIndex,
    () => nextUid(state),
  );
  if (result.ok === false) return [{ type: "action-failed", side, message: result.message }];
  if (!("hand" in result)) return [{ type: "action-failed", side, message: "待选区合并失败" }];
  state.sides[side].hand = result.hand;
  return [{ type: "hand-merged", side, sourceIndex, targetIndex }];
}

export function placeAdouHandItem(
  state: AdouBattleState,
  side: AdouSide,
  handIndex: number,
  point: AdouPoint,
  rng: () => number = Math.random,
): AdouCoreEvent[] {
  const item = state.sides[side].hand[handIndex];
  if (!item) return [{ type: "action-failed", side, message: "这个刷新格是空的" }];

  if (item.type === "card" && item.card.kind === "tool") {
    const events = useAdouSkill(state, side, "shovel", { type: "cell", ...point }, rng);
    if (!events.some((event) => event.type === "action-failed")) {
      const hand = [...state.sides[side].hand];
      hand[handIndex] = null;
      state.sides[side].hand = hand;
    }
    return events;
  }

  const targetUnit = getAdouUnitAt(state.units, point);
  const battleTarget = targetUnit
    ? state.units.find((candidate) => candidate.uid === targetUnit.uid)
    : null;
  if (battleTarget && battleTarget.side === side && item.type === "card") {
    const upgraded = upgradeAdouBoardUnitWithCard(battleTarget, item.card);
    if (upgraded.ok === false) return [{ type: "action-failed", side, message: upgraded.message }];
    if (upgraded.action !== "upgrade") {
      return [{ type: "action-failed", side, message: "升级目标无效" }];
    }
    const unit = refreshBattleUnitStats(state, {
      ...battleTarget,
      ...upgraded.merge.unit,
      side,
      col: battleTarget.col,
      row: battleTarget.row,
      hp: battleTarget.hp,
      maxHp: battleTarget.maxHp,
      cooldown: battleTarget.cooldown,
      attackCount: battleTarget.attackCount,
      attackSpeedMultiplier: battleTarget.attackSpeedMultiplier,
      incomeTimer: battleTarget.incomeTimer,
      lockTimer: battleTarget.lockTimer,
      knockdownTimer: battleTarget.knockdownTimer,
      chaosTimer: battleTarget.chaosTimer,
      weaponId: battleTarget.weaponId,
    } as AdouBattleUnit);
    replaceUnit(state, unit);
    const hand = [...state.sides[side].hand];
    hand[handIndex] = null;
    state.sides[side].hand = hand;
    return [{ type: "unit-upgraded", side, unit }];
  }

  const placed = itemToPlacedUnit(item);
  if (!placed) return [{ type: "action-failed", side, message: "这张牌不能放置" }];

  const promoted =
    placed.tier === 1 && rng() < state.sides[side].promotionChance
      ? { ...placed, tier: 2 }
      : placed;
  const candidate = hydrateAdouBattleUnit(state, side, promoted, point);
  const result = placeAdouUnit(boardOf(state), candidate, point);
  if (result.ok === false) return [{ type: "action-failed", side, message: result.message }];

  state.units = [...state.units, candidate];
  const hand = [...state.sides[side].hand];
  hand[handIndex] = null;
  state.sides[side].hand = hand;
  return [{ type: "unit-placed", side, unit: candidate }];
}

export function moveAdouBattleUnit(
  state: AdouBattleState,
  side: AdouSide,
  unitUid: number,
  point: AdouPoint,
): AdouCoreEvent[] {
  const unit = state.units.find((candidate) => candidate.uid === unitUid && candidate.side === side);
  if (!unit) return [{ type: "action-failed", side, message: "单位不存在" }];
  const result = moveAdouUnit(boardOf(state), unit, point);
  if (result.ok === false) return [{ type: "action-failed", side, message: result.message }];

  if (result.action === "move") {
    const moved = { ...unit, col: result.unit.col, row: result.unit.row };
    replaceUnit(state, moved);
    return [{ type: "unit-moved", side, unit: moved, from: result.from }];
  }

  if (result.action === "swap") {
    const first = { ...unit, col: result.first.col, row: result.first.row };
    const second = state.units.find((candidate) => candidate.uid === result.second.uid);
    if (!second) return [{ type: "action-failed", side, message: "交换目标不存在" }];
    const movedSecond = { ...second, col: result.second.col, row: result.second.row };
    state.units = state.units.map((candidate) => {
      if (candidate.uid === first.uid) return first;
      if (candidate.uid === movedSecond.uid) return movedSecond;
      return candidate;
    });
    return [{ type: "unit-swapped", side, first, second: movedSecond }];
  }

  return [{ type: "action-failed", side, message: "单位移动失败" }];
}

export function returnAdouBoardUnitToHand(
  state: AdouBattleState,
  side: AdouSide,
  unitUid: number,
  preferredIndex?: number,
): AdouCoreEvent[] {
  const unit = state.units.find((candidate) => candidate.uid === unitUid && candidate.side === side);
  if (!unit) return [{ type: "action-failed", side, message: "单位不存在" }];
  if (unit.lockTimer > 0 || unit.knockdownTimer > 0) {
    return [{ type: "action-failed", side, message: "单位暂时无法拖回" }];
  }

  const hand = [...state.sides[side].hand];
  const handIndex = preferredIndex !== undefined && !hand[preferredIndex]
    ? preferredIndex
    : hand.findIndex((item) => item === null);
  if (handIndex < 0) return [{ type: "action-failed", side, message: "待选区没有空位" }];

  hand[handIndex] = createAdouHandUnitItem(toPlacedUnit(unit));
  state.sides[side].hand = hand;
  state.units = state.units.filter((candidate) => candidate.uid !== unit.uid);
  return [{ type: "unit-returned", side, unit, handIndex }];
}

function applyAdouSkillIntent(
  state: AdouBattleState,
  side: AdouSide,
  intent: AdouSkillIntent,
  rng: () => number,
): AdouCoreEvent[] {
  const runtime = state.sides[side];

  if (intent.type === "dig-tile") {
    state.tiles = state.tiles.map((tile) =>
      tile.col === intent.point.col && tile.row === intent.point.row
        ? { ...tile, kind: "plot" }
        : tile,
    );
    if (intent.treasure) runtime.mantou += 12;
    return intent.treasure ? [{ type: "mantou", side, amount: 12, point: intent.point }] : [];
  }

  if (intent.type === "push-enemies") {
    state.enemies = state.enemies.map((enemy) =>
      enemy.targetSide === side
        ? { ...enemy, progress: Math.max(0, enemy.progress - intent.distance) }
        : enemy,
    );
    return [];
  }

  if (intent.type === "redraw-hand") {
    const hand = [...runtime.hand];
    returnAdouHandItemToPool(runtime.cardPool, hand[intent.index] ?? null);
    hand[intent.index] = drawAdouHandItem(runtime.cardPool, rng, () => nextUid(state));
    runtime.hand = hand;
    return [];
  }

  if (intent.type === "recycle-hand") {
    const hand = [...runtime.hand];
    returnAdouHandItemToPool(runtime.cardPool, hand[intent.index] ?? null);
    hand[intent.index] = null;
    runtime.hand = hand;
    runtime.mantou += intent.mantouGain;
    return [{ type: "mantou", side, amount: intent.mantouGain }];
  }

  if (intent.type === "upgrade-unit") {
    const unit = state.units.find((candidate) => candidate.uid === intent.unitUid && candidate.side === side);
    if (!unit) return [{ type: "action-failed", side, message: "升级目标不存在" }];
    const maxTier = getAdouMaxTierForUnit(unit);
    const shouldDowngrade = !intent.stable && unit.tier > 1 && rng() < intent.failDowngradeChance;
    const tier = shouldDowngrade
      ? Math.max(1, unit.tier - 1)
      : Math.min(maxTier, unit.tier + 1);
    const upgraded = refreshBattleUnitStats(state, { ...unit, tier }, !shouldDowngrade);
    replaceUnit(state, upgraded);
    return [{ type: "unit-upgraded", side, unit: upgraded }];
  }

  if (intent.type === "heal-adou") {
    if (intent.failDamageChance && rng() < intent.failDamageChance) {
      return [damageAdou(state, side, 1)];
    }
    runtime.hp = Math.min(runtime.maxHp, runtime.hp + intent.amount);
    return [];
  }

  if (intent.type === "set-range-multiplier") {
    runtime.rangeBonus = Math.max(runtime.rangeBonus, intent.multiplier);
    return [];
  }

  if (intent.type === "slow-enemies") {
    runtime.enemySlowTimer = Math.max(runtime.enemySlowTimer, intent.durationSeconds);
    return [];
  }

  if (intent.type === "place-trap") {
    const roundIndex = Math.max(0, Math.min(state.round - 1, ADOU_ENEMY_RULES.mobHpByRound.length - 1));
    state.traps = [
      ...state.traps,
      {
        uid: nextUid(state),
        side,
        col: intent.point.col,
        row: intent.point.row,
        kind: intent.trapKind,
        damage: intent.trapKind === "landmine" ? (ADOU_ENEMY_RULES.mobHpByRound[roundIndex] ?? 10) * 2 : 0,
        ttl: intent.trapKind === "landmine" ? 90 : 30,
      },
    ];
    return [];
  }

  if (intent.type === "speed-up-unit") {
    const unit = state.units.find((candidate) => candidate.uid === intent.unitUid && candidate.side === side);
    if (!unit) return [{ type: "action-failed", side, message: "加速目标不存在" }];
    const boosted = {
      ...unit,
      attackSpeedMultiplier: unit.attackSpeedMultiplier + intent.addMultiplier,
    };
    replaceUnit(state, boosted);
    return [{ type: "unit-upgraded", side, unit: boosted }];
  }

  if (intent.type === "boss-backfire") {
    runtime.bossBackfireChance = Math.max(runtime.bossBackfireChance, intent.chance);
    return [];
  }

  if (intent.type === "add-mantou") {
    runtime.mantou += intent.amount;
    return [{ type: "mantou", side, amount: intent.amount }];
  }

  if (intent.type === "enable-meteor") runtime.meteorEnabled = true;
  if (intent.type === "enable-shovel-treasure") runtime.shovelFindsTreasure = true;
  if (intent.type === "enable-super-shovel") runtime.superShovelTimer = intent.intervalSeconds;
  if (intent.type === "increase-promotion") runtime.promotionChance = Math.max(runtime.promotionChance, intent.chance);
  return [];
}

export function useAdouSkill(
  state: AdouBattleState,
  side: AdouSide,
  skillId: AdouSkillId,
  target: AdouSkillUseTarget = { type: "none" },
  rng: () => number = Math.random,
): AdouCoreEvent[] {
  const plan = planAdouSkillUse(state, side, skillId, target);
  if (!plan.ok) return [{ type: "action-failed", side, message: plan.message }];
  const events: AdouCoreEvent[] = [{ type: "skill-used", side, plan }];
  for (const intent of plan.intents) events.push(...applyAdouSkillIntent(state, side, intent, rng));
  state.message = side === "player" ? plan.message : state.message;
  return events;
}

export function useAdouActiveSkillSlot(
  state: AdouBattleState,
  side: AdouSide,
  slotIndex: number,
  target: AdouSkillUseTarget = { type: "none" },
  rng: () => number = Math.random,
): AdouCoreEvent[] {
  const slot = state.sides[side].activeSkills[slotIndex];
  if (!slot) return [{ type: "action-failed", side, message: "主动技能无效" }];
  if (slot.remainingSeconds > 0) {
    return [{ type: "action-failed", side, message: `冷却中 ${Math.ceil(slot.remainingSeconds)} 秒` }];
  }
  const events = useAdouSkill(state, side, slot.skillId, target, rng);
  if (!events.some((event) => event.type === "action-failed")) {
    state.sides[side].activeSkills = state.sides[side].activeSkills.map((candidate, index) =>
      index === slotIndex ? { ...candidate, remainingSeconds: candidate.cooldownSeconds } : candidate,
    );
  }
  return events;
}

export function executeAdouAiAction(
  state: AdouBattleState,
  rng: () => number = Math.random,
  options: Parameters<typeof chooseAdouAiAction>[1] = {},
): AdouCoreEvent[] {
  const action = chooseAdouAiAction(state, options);
  const events: AdouCoreEvent[] = [{ type: "ai-action", action }];

  if (action.type === "wait") return events;

  if (action.type === "refresh") {
    const refreshed = refreshAdouBattleHand(state, "ai", rng);
    if (!refreshed) {
      return [...events, { type: "action-failed", side: "ai", message: "AI 馒头不足，无法刷新" }];
    }
    return [...events, refreshed];
  }

  if (action.type === "merge-hand") {
    return [
      ...events,
      ...mergeAdouBattleHandSlots(state, "ai", action.sourceIndex, action.targetIndex),
    ];
  }

  if (action.type === "play-hand") {
    if (action.target.type !== "cell") {
      return [...events, { type: "action-failed", side: "ai", message: "AI 没有可放置目标" }];
    }
    return [
      ...events,
      ...placeAdouHandItem(
        state,
        "ai",
        action.handIndex,
        { col: action.target.col, row: action.target.row },
        rng,
      ),
    ];
  }

  if (action.type === "use-active-skill") {
    return [
      ...events,
      ...useAdouActiveSkillSlot(state, "ai", action.slotIndex, action.target, rng),
    ];
  }

  return events;
}

function adouAiTickSeconds(state: AdouBattleState) {
  return ADOU_AI_RULES.tickSecondsByDifficulty[state.aiDifficulty] ??
    ADOU_AI_RULES.tickSecondsByDifficulty[2];
}

function grantAdouAiRoundBonuses(state: AdouBattleState): AdouCoreEvent[] {
  const events: AdouCoreEvent[] = [];
  const claimed = new Set(state.aiBonusRoundsClaimed);
  for (let index = 0; index < ADOU_AI_RULES.bonusRounds.length; index += 1) {
    const round = ADOU_AI_RULES.bonusRounds[index] ?? 0;
    if (state.round < round || claimed.has(round)) continue;
    claimed.add(round);
    const amount = ADOU_AI_RULES.bonusMantouByDifficulty[state.aiDifficulty]?.[index] ?? 0;
    if (amount <= 0) continue;
    state.sides.ai.mantou += amount;
    events.push({ type: "mantou", side: "ai", amount });
  }
  state.aiBonusRoundsClaimed = [...claimed];
  return events;
}

function maybeUseAdouAiSpecialSkill(
  state: AdouBattleState,
  rng: () => number,
): AdouCoreEvent[] {
  const threat = getAdouThreatLevel(state, "ai");
  if (threat < 0.72) return [];
  if (state.sides.ai.bulldozerRoundUsed === state.round) return [];
  const chance = ADOU_AI_RULES.routeDisruptionChanceByDifficulty[state.aiDifficulty] ?? 0;
  if (rng() >= chance) return [];
  state.sides.ai.bulldozerRoundUsed = state.round;
  return useAdouSkill(state, "ai", "bulldozer", { type: "none" }, rng);
}

function updateAdouAiController(
  state: AdouBattleState,
  dt: number,
  rng: () => number,
): AdouCoreEvent[] {
  const events = grantAdouAiRoundBonuses(state);
  if (state.status !== "playing") return events;

  state.aiTimer -= dt;
  const interval = adouAiTickSeconds(state);
  let guard = 0;
  while (state.aiTimer <= 0 && state.status === "playing" && guard < 3) {
    guard += 1;
    events.push(...maybeUseAdouAiSpecialSkill(state, rng));
    const allowActiveSkills =
      rng() < (ADOU_AI_RULES.activeSkillChanceByDifficulty[state.aiDifficulty] ?? 0);
    events.push(...executeAdouAiAction(state, rng, { allowActiveSkills }));
    state.aiTimer += interval;
  }
  if (guard >= 3) state.aiTimer = interval;
  return events;
}

function updateAdouPassiveSkillTimers(state: AdouBattleState): AdouCoreEvent[] {
  const events: AdouCoreEvent[] = [];
  for (const side of ["player", "ai"] as const) {
    const runtime = state.sides[side];
    if (!runtime.passiveSkills.includes("superShovel") || runtime.superShovelTimer > 0) continue;
    const hand = [...runtime.hand];
    const handIndex = hand.findIndex((item) => item === null);
    if (handIndex < 0) {
      runtime.superShovelTimer = 5;
      continue;
    }
    const item = createAdouHandCardItem({
      uid: nextUid(state),
      token: "铲",
      kind: "tool",
      tier: 1,
    });
    hand[handIndex] = item;
    runtime.hand = hand;
    runtime.superShovelTimer = 60;
    events.push({ type: "hand-card-created", side, handIndex, item });
  }
  return events;
}

function summonAdouMob(state: AdouBattleState, side: AdouSide, label: string) {
  const roundIndex = Math.max(0, Math.min(state.round - 1, ADOU_ENEMY_RULES.mobHpByRound.length - 1));
  const hp = ADOU_ENEMY_RULES.mobHpByRound[roundIndex] ?? 10;
  state.enemies = [
    ...state.enemies,
    {
      uid: nextUid(state),
      targetSide: side,
      kind: "mob",
      label,
      hp,
      maxHp: hp,
      speed: ADOU_ENEMY_RULES.mobSpeed,
      damage: 1,
      progress: 0,
      skillTimer: 999,
      stunTimer: 0,
      burnTimer: 0,
      speedMultiplier: 1,
    },
  ];
}

function applyAdouBossIntent(
  state: AdouBattleState,
  enemyUid: number,
  side: AdouSide,
  intent: AdouBossSkillIntent,
) {
  if (intent.type === "backfire") {
    state.enemies = state.enemies.map((enemy) =>
      enemy.uid === enemyUid ? { ...enemy, hp: enemy.hp - enemy.maxHp * intent.damageFraction } : enemy,
    );
    return;
  }
  if (intent.type === "chaos-units") {
    state.units = state.units.map((unit) =>
      intent.unitUids.includes(unit.uid)
        ? { ...unit, chaosTimer: Math.max(unit.chaosTimer, intent.durationSeconds) }
        : unit,
    );
    return;
  }
  if (intent.type === "buff-enemies") {
    state.enemies = state.enemies.map((enemy) =>
      enemy.targetSide === side
        ? {
            ...enemy,
            hp: Math.min(enemy.maxHp * 1.4, enemy.hp + enemy.maxHp * intent.hpFraction),
            speedMultiplier: Math.max(enemy.speedMultiplier, intent.speedMultiplier),
          }
        : enemy,
    );
    return;
  }
  if (intent.type === "summon") {
    for (let index = 0; index < intent.count; index += 1) summonAdouMob(state, side, intent.label);
    return;
  }
  if (intent.type === "block-tile") {
    state.tiles = state.tiles.map((tile) =>
      tile.col === intent.point.col && tile.row === intent.point.row
        ? { ...tile, kind: "blocked" }
        : tile,
    );
    return;
  }
  if (intent.type === "attack-speed-down") {
    state.sides[side].attackSpeedBonus = Math.max(
      intent.minMultiplier,
      state.sides[side].attackSpeedBonus - intent.subtractMultiplier,
    );
    return;
  }
  if (intent.type === "charm-unit") {
    state.units = state.units.filter((unit) => unit.uid !== intent.unitUid);
    summonAdouMob(state, side, intent.summonLabel);
    return;
  }
  if (intent.type === "downgrade-and-lock") {
    state.units = state.units.map((unit) => {
      if (unit.uid !== intent.unitUid) return unit;
      return refreshBattleUnitStats(state, {
        ...unit,
        tier: Math.max(1, unit.tier - 1),
        lockTimer: Math.max(unit.lockTimer, intent.lockSeconds),
      }, false);
    });
    state.sides[side].mergeLockTimer = Math.max(state.sides[side].mergeLockTimer, intent.mergeLockSeconds);
    return;
  }
  if (intent.type === "devour-nearby") {
    const unitIds = new Set(intent.unitUids);
    const heal = state.units
      .filter((unit) => unitIds.has(unit.uid))
      .reduce((sum, unit) => sum + unit.maxHp * intent.healFractionOfUnitHp, 0);
    state.units = state.units.filter((unit) => !unitIds.has(unit.uid));
    state.enemies = state.enemies.map((enemy) =>
      enemy.uid === enemyUid
        ? { ...enemy, hp: Math.min(enemy.maxHp * 1.35, enemy.hp + heal) }
        : enemy,
    );
    return;
  }
  if (intent.type === "knockdown-units") {
    state.units = state.units.map((unit) =>
      intent.unitUids.includes(unit.uid)
        ? { ...unit, knockdownTimer: Math.max(unit.knockdownTimer, intent.durationSeconds) }
        : unit,
    );
    return;
  }
  if (intent.type === "blind") {
    state.sides[side].blindTimer = Math.max(state.sides[side].blindTimer, intent.durationSeconds);
    return;
  }
  if (intent.type === "seal-unit") {
    state.units = state.units.map((unit) =>
      unit.uid === intent.unitUid
        ? { ...unit, lockTimer: Math.max(unit.lockTimer, intent.durationSeconds) }
        : unit,
    );
  }
}

function applyAdouBossSkillPlan(state: AdouBattleState, enemyUid: number, plan: AdouBossSkillPlan) {
  const enemy = state.enemies.find((candidate) => candidate.uid === enemyUid);
  if (!enemy) return;
  for (const intent of plan.intents) applyAdouBossIntent(state, enemyUid, enemy.targetSide, intent);
  state.enemies = state.enemies.filter((candidate) => candidate.hp > 0);
}

function updateAdouTraps(state: AdouBattleState, dt: number): AdouCoreEvent[] {
  const events: AdouCoreEvent[] = [];
  let traps = state.traps.map((trap) => ({ ...trap, ttl: trap.ttl - dt }));
  let enemies = [...state.enemies];

  for (const trap of traps) {
    if (trap.ttl <= 0) continue;
    const enemy = enemies.find((candidate) => {
      if (candidate.targetSide !== trap.side) return false;
      const pos = getAdouEnemyPoint(state, candidate);
      return Math.abs(pos.x - (trap.col + 0.5)) < 0.35 && Math.abs(pos.y - (trap.row + 0.5)) < 0.35;
    });
    if (!enemy) continue;
    events.push({ type: "trap-triggered", side: trap.side, trapUid: trap.uid });
    traps = traps.map((candidate) => candidate.uid === trap.uid ? { ...candidate, ttl: 0 } : candidate);
    enemies = enemies.map((candidate) => {
      if (candidate.uid !== enemy.uid) return candidate;
      return trap.kind === "trap"
        ? { ...candidate, stunTimer: Math.max(candidate.stunTimer, 2.6) }
        : { ...candidate, hp: candidate.hp - trap.damage };
    });
  }

  state.traps = traps.filter((trap) => trap.ttl > 0);
  state.enemies = enemies.filter((enemy) => enemy.hp > 0);
  return events;
}

function updateAdouUnits(state: AdouBattleState, dt: number): AdouCoreEvent[] {
  const events: AdouCoreEvent[] = [];
  let units = state.units.map((unit) => ({
    ...unit,
    cooldown: Math.max(0, unit.cooldown - dt),
    lockTimer: Math.max(0, unit.lockTimer - dt),
    knockdownTimer: Math.max(0, unit.knockdownTimer - dt),
    chaosTimer: Math.max(0, unit.chaosTimer - dt),
  }));
  state.units = units;

  for (const unit of units) {
    if (unit.kind === "farmer") {
      const tile = state.tiles.find((candidate) => candidate.col === unit.col && candidate.row === unit.row);
      const incomeTimer = unit.incomeTimer - dt;
      if (incomeTimer <= 0) {
        const interval = getAdouFarmerIncomeInterval(unit.tier, tile?.kind ?? null);
        const updated = { ...unit, incomeTimer: incomeTimer + interval };
        replaceUnit(state, updated);
        state.sides[unit.side].mantou += 1;
        events.push({ type: "mantou", side: unit.side, amount: 1, point: { col: unit.col, row: unit.row } });
      } else {
        replaceUnit(state, { ...unit, incomeTimer });
      }
      continue;
    }

    if (unit.cooldown > 0 || unit.lockTimer > 0 || unit.knockdownTimer > 0 || unit.chaosTimer > 0) {
      continue;
    }

    const plan = planAdouUnitAttack(state, unit, {
      weaponId: unit.weaponId ?? null,
      unitAttackSpeedMultiplier: unit.attackSpeedMultiplier,
    });
    if (!plan) continue;

    const visual = getAdouAttackVisualSpec(plan, unit.attackCount + 1);
    applyAdouAttackPlan(state, plan);
    replaceUnit(state, {
      ...unit,
      attackCount: unit.attackCount + 1,
      cooldown: plan.stats.attackInterval,
    });
    events.push({ type: "unit-attack", side: unit.side, plan, visual });
  }

  return events;
}

export function tickAdouCore(
  state: AdouBattleState,
  dt: number,
  rng: () => number = Math.random,
): AdouCoreEvent[] {
  const events: AdouCoreEvent[] = [];
  const step = Math.min(1, Math.max(0, dt));
  events.push(...updateAdouBattleFlow(state, step, rng));
  if (state.status !== "playing") return events;
  events.push(...updateAdouAiController(state, step, rng));
  events.push(...updateAdouPassiveSkillTimers(state));
  events.push(...updateAdouUnits(state, step));
  events.push(...updateAdouTraps(state, step));
  const enemyEvents = updateAdouEnemies(state, step, rng);
  for (const event of enemyEvents) {
    events.push(event);
    if (event.type === "boss-skill") applyAdouBossSkillPlan(state, event.enemy.uid, event.plan);
  }
  return events;
}
