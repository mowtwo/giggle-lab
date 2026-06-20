import {
  ADOU_AI_RULES,
  ADOU_BATTLE_RULES,
  ADOU_BOSS_DEFS,
  ADOU_ENEMY_RULES,
  adouWaveSize,
  adouWeightedPick,
  normalizeAdouAiDifficulty,
  packAdouBossSlot,
  unpackAdouBossSlot,
  type AdouAiDifficulty,
  type AdouWavePhase,
} from "./battle-rules";
import {
  adouCardKind,
  createAdouCardPool,
  type AdouCardPool,
  type AdouSide,
} from "./cards";
import {
  refreshAdouHandItems,
  type AdouHandItem,
} from "./hand";
import {
  ADOU_MAPS,
  makeAdouTiles,
  type AdouMapDefinition,
  type AdouMapId,
  type AdouTile,
} from "./map";
import type { AdouBoardUnit } from "./placement";
import {
  getAdouSkill,
  type AdouSkillId,
} from "./skills";
import {
  getDefaultAdouWeaponAssignments,
  normalizeAdouLoadout,
  type AdouLoadout,
} from "./loadout";

export type AdouGameStatus = "ready" | "playing" | "ended";

export type AdouActiveSkillSlot = {
  skillId: AdouSkillId;
  cooldownSeconds: number;
  remainingSeconds: number;
};

export type AdouSideRuntime = {
  hp: number;
  maxHp: number;
  hurtTimer: number;
  entryTimer: number;
  mantou: number;
  refreshCost: number;
  cardPool: AdouCardPool;
  hand: readonly (AdouHandItem | null)[];
  activeSkills: readonly AdouActiveSkillSlot[];
  passiveSkills: readonly AdouSkillId[];
  weaponAssignments: ReturnType<typeof getDefaultAdouWeaponAssignments>;
  attackSpeedBonus: number;
  rangeBonus: number;
  enemySlowTimer: number;
  enemyMoveMultiplier: number;
  blindTimer: number;
  mergeLockTimer: number;
  bossBackfireChance: number;
  recruitBonus: boolean;
  shovelFindsTreasure: boolean;
  meteorEnabled: boolean;
  superShovelTimer: number;
  promotionChance: number;
  bulldozerRoundUsed: number;
};

export type AdouEnemy = {
  uid: number;
  targetSide: AdouSide;
  kind: "mob" | "boss";
  bossId?: number;
  label: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  progress: number;
  skillTimer: number;
  stunTimer: number;
  burnTimer: number;
  speedMultiplier: number;
};

export type AdouBattleUnit = AdouBoardUnit & {
  hp: number;
  maxHp: number;
  cooldown: number;
  attackCount: number;
  attackSpeedMultiplier: number;
  incomeTimer: number;
  lockTimer: number;
  knockdownTimer: number;
  chaosTimer: number;
  weaponId?: number | null;
};

export type AdouTrap = {
  uid: number;
  side: AdouSide;
  col: number;
  row: number;
  kind: "trap" | "landmine";
  damage: number;
  ttl: number;
};

export type AdouBattleEvent =
  | { type: "phase"; phase: AdouWavePhase; round: number }
  | { type: "enemy-spawned"; enemy: AdouEnemy }
  | { type: "hand-refreshed"; side: AdouSide }
  | { type: "adou-damaged"; side: AdouSide; hp: number }
  | { type: "ended"; winner: AdouSide | null };

export type AdouBattleState = {
  status: AdouGameStatus;
  winner: AdouSide | null;
  elapsedSeconds: number;
  aiDifficulty: AdouAiDifficulty;
  aiTimer: number;
  aiBonusRoundsClaimed: readonly number[];
  map: AdouMapDefinition;
  tiles: readonly AdouTile[];
  round: number;
  roundTimer: number;
  spawnTimer: number;
  wavePhase: AdouWavePhase;
  waveTimer: number;
  waveSize: number;
  waveSpawned: number;
  bossSlots: Record<AdouSide, number>;
  sides: Record<AdouSide, AdouSideRuntime>;
  units: readonly AdouBattleUnit[];
  enemies: readonly AdouEnemy[];
  traps: readonly AdouTrap[];
  enemyHpMultipliers: readonly number[];
  nextUid: number;
  message: string;
};

export type AdouBattleOptions = {
  aiDifficulty?: number;
};

function makeNextUid(state: Pick<AdouBattleState, "nextUid">) {
  return () => {
    const uid = state.nextUid;
    state.nextUid += 1;
    return uid;
  };
}

function uniqueSkillIds(
  source: readonly AdouSkillId[] | undefined,
  fallback: readonly AdouSkillId[],
  kind: "active" | "passive",
  size: number,
) {
  const picked: AdouSkillId[] = [];
  for (const skillId of [...(source ?? []), ...fallback]) {
    const skillDef = getAdouSkill(skillId);
    if (!skillDef || skillDef.kind !== kind || picked.includes(skillId)) continue;
    picked.push(skillId);
    if (picked.length >= size) break;
  }
  return picked;
}

function makeActiveSkillSlot(skillId: AdouSkillId): AdouActiveSkillSlot {
  const skillDef = getAdouSkill(skillId);
  return {
    skillId,
    cooldownSeconds: Math.max(0, (skillDef?.cooldownMs ?? 0) / 1000),
    remainingSeconds: 0,
  };
}

function applyAdouPassiveSkills(runtime: AdouSideRuntime) {
  if (runtime.passiveSkills.includes("farmer")) {
    runtime.cardPool.remaining["农"] += 3;
  }

  if (runtime.passiveSkills.includes("recruit")) {
    for (const token of Object.keys(runtime.cardPool.remaining) as Array<keyof typeof runtime.cardPool.remaining>) {
      if (adouCardKind(token) === "general-part") {
        runtime.cardPool.remaining[token] += runtime.cardPool.remaining[token];
      }
    }
    runtime.recruitBonus = true;
  }

  if (runtime.passiveSkills.includes("promotionOrder")) runtime.promotionChance = 0.15;
  if (runtime.passiveSkills.includes("superShovel")) runtime.superShovelTimer = 60;
  if (runtime.passiveSkills.includes("goldSeeker")) runtime.shovelFindsTreasure = true;
  if (runtime.passiveSkills.includes("longRange")) runtime.rangeBonus = Math.max(runtime.rangeBonus, 1.25);
  if (runtime.passiveSkills.includes("allAttSpeedSpell")) runtime.attackSpeedBonus += 0.1;
  if (runtime.passiveSkills.includes("goingHandInHand")) runtime.attackSpeedBonus += 0.5;
  if (runtime.passiveSkills.includes("xuMingPill")) {
    runtime.maxHp += 5;
    runtime.hp += 5;
  }
  if (runtime.passiveSkills.includes("silt")) runtime.enemyMoveMultiplier = Math.min(runtime.enemyMoveMultiplier, 0.9);
  if (runtime.passiveSkills.includes("meteor")) runtime.meteorEnabled = true;
  if (runtime.passiveSkills.includes("daBuPill")) {
    runtime.maxHp += 3;
    runtime.hp += 3;
  }
}

function makeAdouSideRuntime(loadout?: AdouLoadout): AdouSideRuntime {
  const normalized = normalizeAdouLoadout(loadout ?? null);
  const activeSkillIds = uniqueSkillIds(
    normalized.activeSkills,
    normalized.activeSkills,
    "active",
    2,
  );
  const passiveSkillIds = uniqueSkillIds(
    normalized.passiveSkills,
    normalized.passiveSkills,
    "passive",
    5,
  );

  const runtime: AdouSideRuntime = {
    hp: ADOU_BATTLE_RULES.playerHp,
    maxHp: ADOU_BATTLE_RULES.playerHp,
    hurtTimer: 0,
    entryTimer: 0,
    mantou: 0,
    refreshCost: ADOU_BATTLE_RULES.startingRefreshCost,
    cardPool: createAdouCardPool(),
    hand: Array.from({ length: ADOU_BATTLE_RULES.handSize }, (): AdouHandItem | null => null),
    activeSkills: activeSkillIds.map(makeActiveSkillSlot),
    passiveSkills: passiveSkillIds,
    weaponAssignments: normalized.weaponAssignments,
    attackSpeedBonus: 1,
    rangeBonus: 1,
    enemySlowTimer: 0,
    enemyMoveMultiplier: 1,
    blindTimer: 0,
    mergeLockTimer: 0,
    bossBackfireChance: 0,
    recruitBonus: false,
    shovelFindsTreasure: false,
    meteorEnabled: false,
    superShovelTimer: 0,
    promotionChance: 0,
    bulldozerRoundUsed: 0,
  };

  applyAdouPassiveSkills(runtime);
  return runtime;
}

export function createAdouBattleState(
  mapId: AdouMapId = "changban",
  rng: () => number = Math.random,
  loadout?: AdouLoadout,
  options: AdouBattleOptions = {},
): AdouBattleState {
  const aiDifficulty = normalizeAdouAiDifficulty(options.aiDifficulty);
  const state: AdouBattleState = {
    status: "ready",
    winner: null,
    elapsedSeconds: 0,
    aiDifficulty,
    aiTimer: ADOU_AI_RULES.tickSecondsByDifficulty[aiDifficulty],
    aiBonusRoundsClaimed: [],
    map: ADOU_MAPS[mapId],
    tiles: makeAdouTiles(ADOU_MAPS[mapId]),
    round: 1,
    roundTimer: ADOU_BATTLE_RULES.prepareSeconds,
    spawnTimer: 0,
    wavePhase: "prepare",
    waveTimer: ADOU_BATTLE_RULES.prepareSeconds,
    waveSize: adouWaveSize(1),
    waveSpawned: 0,
    bossSlots: { player: -1, ai: -1 },
    sides: {
      player: makeAdouSideRuntime(loadout),
      ai: makeAdouSideRuntime(),
    },
    units: [],
    enemies: [],
    traps: [],
    enemyHpMultipliers:
      adouWeightedPick(
        ADOU_ENEMY_RULES.hpMultiplierPatterns,
        ADOU_ENEMY_RULES.hpMultiplierWeights,
        rng,
      ) ?? ADOU_ENEMY_RULES.hpMultiplierPatterns[0],
    nextUid: 1,
    message: "配置武将与技能",
  };
  if (state.sides.player.passiveSkills.includes("xuMingPill")) {
    state.sides.ai.maxHp += 3;
    state.sides.ai.hp += 3;
  }
  return state;
}

export function refreshAdouBattleHand(
  state: AdouBattleState,
  side: AdouSide,
  rng: () => number = Math.random,
  free = false,
): AdouBattleEvent | null {
  const runtime = state.sides[side];
  if (!free) {
    if (runtime.mantou < runtime.refreshCost) return null;
    runtime.mantou -= runtime.refreshCost;
    runtime.refreshCost += 2;
  }

  runtime.hand = refreshAdouHandItems(
    runtime.cardPool,
    runtime.hand,
    rng,
    makeNextUid(state),
    ADOU_BATTLE_RULES.handSize,
  );
  state.message = side === "player" ? "刷新五格" : state.message;
  return { type: "hand-refreshed", side };
}

export function startAdouBattle(
  state: AdouBattleState,
  rng: () => number = Math.random,
): AdouBattleEvent[] {
  state.status = "playing";
  state.winner = null;
  state.round = 1;
  state.roundTimer = ADOU_BATTLE_RULES.prepareSeconds;
  state.spawnTimer = ADOU_BATTLE_RULES.spawnIntervalSeconds;
  state.wavePhase = "prepare";
  state.waveTimer = ADOU_BATTLE_RULES.prepareSeconds;
  state.waveSize = adouWaveSize(1);
  state.waveSpawned = 0;
  state.bossSlots = { player: -1, ai: -1 };
  state.enemies = [];
  state.elapsedSeconds = 0;
  state.aiTimer = ADOU_AI_RULES.tickSecondsByDifficulty[state.aiDifficulty];
  state.aiBonusRoundsClaimed = [];
  state.sides.player.mantou += ADOU_BATTLE_RULES.startingMantou;
  state.sides.ai.mantou += ADOU_BATTLE_RULES.startingMantou + ADOU_BATTLE_RULES.aiStartBonusMantou;
  state.sides.player.entryTimer = 1.2;
  state.sides.ai.entryTimer = 1.2;
  state.message = "点击刷新征召士兵";

  const events: AdouBattleEvent[] = [{ type: "phase", phase: "prepare", round: 1 }];
  const playerRefresh = refreshAdouBattleHand(state, "player", rng, true);
  const aiRefresh = refreshAdouBattleHand(state, "ai", rng, true);
  if (playerRefresh) events.push(playerRefresh);
  if (aiRefresh) events.push(aiRefresh);
  return events;
}

function mapBossBaseId(mapId: AdouMapId) {
  return (Object.keys(ADOU_MAPS) as AdouMapId[]).indexOf(mapId) * 3;
}

function rollAdouBossSlot(
  state: AdouBattleState,
  waveSize: number,
  rng: () => number,
) {
  const bossRoundIndex = (ADOU_BATTLE_RULES.bossRounds as readonly number[]).indexOf(state.round);
  if (bossRoundIndex < 0) return -1;
  const probability = ADOU_BATTLE_RULES.bossProbabilities[bossRoundIndex] ?? 0;
  if (rng() > probability) return -1;
  const bossId = (mapBossBaseId(state.map.id) + (bossRoundIndex % 3)) % ADOU_BOSS_DEFS.length;
  return packAdouBossSlot(Math.floor(rng() * waveSize), bossId);
}

function beginAdouWave(
  state: AdouBattleState,
  rng: () => number,
  events: AdouBattleEvent[],
) {
  state.wavePhase = "spawning";
  state.waveSize = adouWaveSize(state.round);
  state.waveSpawned = 0;
  state.spawnTimer = ADOU_BATTLE_RULES.spawnIntervalSeconds;
  state.waveTimer = state.waveSize * ADOU_BATTLE_RULES.spawnIntervalSeconds;
  state.bossSlots = {
    player: rollAdouBossSlot(state, state.waveSize, rng),
    ai: rollAdouBossSlot(state, state.waveSize, rng),
  };
  state.message = `第 ${state.round} 波`;
  events.push({ type: "phase", phase: "spawning", round: state.round });
}

function spawnAdouEnemy(
  state: AdouBattleState,
  targetSide: AdouSide,
  bossId?: number,
) {
  const roundIndex = Math.max(
    0,
    Math.min(state.round - 1, ADOU_ENEMY_RULES.mobHpByRound.length - 1),
  );
  const baseHp = ADOU_ENEMY_RULES.mobHpByRound[roundIndex] ?? ADOU_ENEMY_RULES.mobHpByRound[0];
  const boss = bossId === undefined ? null : ADOU_BOSS_DEFS[bossId] ?? null;
  const hp = boss
    ? baseHp * boss.hpScale
    : baseHp * (state.enemyHpMultipliers[roundIndex] ?? 1);
  const enemy: AdouEnemy = {
    uid: makeNextUid(state)(),
    targetSide,
    kind: boss ? "boss" : "mob",
    bossId,
    label: boss?.name ?? "兵",
    hp,
    maxHp: hp,
    speed: boss?.speed ?? ADOU_ENEMY_RULES.mobSpeed,
    damage: 1,
    progress: 0,
    skillTimer: boss?.cooldownSeconds ?? 999,
    stunTimer: 0,
    burnTimer: 0,
    speedMultiplier: 1,
  };
  state.enemies = [...state.enemies, enemy];
  return enemy;
}

function spawnAdouWaveSlot(state: AdouBattleState, events: AdouBattleEvent[]) {
  for (const side of ["player", "ai"] as const) {
    const bossSlot = unpackAdouBossSlot(state.bossSlots[side]);
    const enemy = spawnAdouEnemy(
      state,
      side,
      bossSlot.slot === state.waveSpawned ? bossSlot.bossId : undefined,
    );
    events.push({ type: "enemy-spawned", enemy });
  }
  state.waveSpawned += 1;
}

function finishAdouBattle(
  state: AdouBattleState,
  winner: AdouSide | null,
  events: AdouBattleEvent[],
) {
  state.status = "ended";
  state.winner = winner;
  state.message = winner === "player" ? "胜利" : winner === "ai" ? "失败" : "同归于尽";
  events.push({ type: "ended", winner });
}

function tickAdouSideRuntime(runtime: AdouSideRuntime, dt: number) {
  runtime.hurtTimer = Math.max(0, runtime.hurtTimer - dt);
  runtime.entryTimer = Math.max(0, runtime.entryTimer - dt);
  runtime.enemySlowTimer = Math.max(0, runtime.enemySlowTimer - dt);
  runtime.blindTimer = Math.max(0, runtime.blindTimer - dt);
  runtime.mergeLockTimer = Math.max(0, runtime.mergeLockTimer - dt);
  runtime.superShovelTimer = Math.max(0, runtime.superShovelTimer - dt);
  runtime.activeSkills = runtime.activeSkills.map((slot) => ({
    ...slot,
    remainingSeconds: Math.max(0, slot.remainingSeconds - dt),
  }));
}

export function damageAdou(
  state: AdouBattleState,
  side: AdouSide,
  amount = 1,
): AdouBattleEvent {
  const runtime = state.sides[side];
  runtime.hp = Math.max(0, runtime.hp - amount);
  runtime.hurtTimer = 0.55;
  const event: AdouBattleEvent = { type: "adou-damaged", side, hp: runtime.hp };
  return event;
}

export function updateAdouBattleFlow(
  state: AdouBattleState,
  dt: number,
  rng: () => number = Math.random,
) {
  const events: AdouBattleEvent[] = [];
  if (state.status !== "playing") return events;

  const step = Math.min(1, Math.max(0, dt));
  state.elapsedSeconds += step;
  tickAdouSideRuntime(state.sides.player, step);
  tickAdouSideRuntime(state.sides.ai, step);

  let remaining = step;
  let guard = 0;
  while (remaining > 0 && state.status === "playing" && guard < 100) {
    guard += 1;

    if (state.wavePhase === "prepare") {
      const consumed = Math.min(remaining, state.waveTimer);
      state.waveTimer -= consumed;
      state.roundTimer = state.waveTimer;
      remaining -= consumed;
      if (state.waveTimer <= 0) beginAdouWave(state, rng, events);
      continue;
    }

    if (state.wavePhase === "spawning") {
      const consumed = Math.min(remaining, state.spawnTimer);
      state.spawnTimer -= consumed;
      remaining -= consumed;
      state.waveTimer = Math.max(
        0,
        state.spawnTimer +
          Math.max(0, state.waveSize - state.waveSpawned - 1) *
            ADOU_BATTLE_RULES.spawnIntervalSeconds,
      );
      state.roundTimer = state.waveTimer;

      if (state.spawnTimer <= 0 && state.waveSpawned < state.waveSize) {
        spawnAdouWaveSlot(state, events);
        state.spawnTimer += ADOU_BATTLE_RULES.spawnIntervalSeconds;
        if (state.waveSpawned >= state.waveSize) {
          state.wavePhase = "cooldown";
          state.waveTimer = ADOU_BATTLE_RULES.cooldownSeconds;
          state.roundTimer = state.waveTimer;
          state.message = "下一波准备";
          events.push({ type: "phase", phase: "cooldown", round: state.round });
        }
      }
      continue;
    }

    const consumed = Math.min(remaining, state.waveTimer);
    state.waveTimer -= consumed;
    state.roundTimer = state.waveTimer;
    remaining -= consumed;
    if (state.waveTimer > 0) continue;

    if (state.round >= ADOU_BATTLE_RULES.maxWaves) {
      finishAdouBattle(state, "player", events);
      break;
    }

    state.round += 1;
    beginAdouWave(state, rng, events);
  }

  if (state.sides.player.hp <= 0 || state.sides.ai.hp <= 0) {
    const winner =
      state.sides.player.hp <= 0 && state.sides.ai.hp <= 0
        ? null
        : state.sides.player.hp > 0
          ? "player"
          : "ai";
    finishAdouBattle(state, winner, events);
  }

  return events;
}

export function endAdouBattle(
  state: AdouBattleState,
  winner: AdouSide | null = "ai",
) {
  const events: AdouBattleEvent[] = [];
  if (state.status !== "ended") finishAdouBattle(state, winner, events);
  return events;
}
