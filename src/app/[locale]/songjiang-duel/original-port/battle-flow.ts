import { ORIGINAL_BATTLE_RULES } from "./rules";

type Side = "player" | "ai";
type GameStatus = "ready" | "playing" | "ended";
type WavePhase = "prepare" | "spawning" | "cooldown";

type BattleFlowSide = {
  gold: number;
};

export type OriginalBattleFlowState = {
  status: GameStatus;
  round: number;
  roundTimer: number;
  spawnTimer: number;
  wavePhase: WavePhase;
  waveTimer: number;
  waveSize: number;
  waveSpawned: number;
  bossSlots: Record<Side, number>;
  message: string;
  side: Record<Side, BattleFlowSide>;
};

type BattleFlowHooks = {
  chooseBossSlots: (round: number, waveSize: number) => Record<Side, number>;
  spawnEnemy: (side: Side, bossId?: number) => void;
  completeBattle: () => void;
};

const msToSeconds = (value: number) => value / 1000;

export function originalWaveSize(round: number) {
  const counts = ORIGINAL_BATTLE_RULES.waveCounts;
  if (round <= counts.length) return counts[round - 1] ?? counts[0];
  return counts[counts.length - 1] + (round - counts.length) * 2;
}

export function packBossSlot(slot: number, bossId?: number) {
  return bossId === undefined ? -1 : (bossId + 1) * 1000 + slot;
}

export function unpackBossSlot(packed: number) {
  if (packed < 1000) return { slot: -1, bossId: undefined };
  return {
    slot: packed % 1000,
    bossId: Math.floor(packed / 1000) - 1,
  };
}

export function resetOriginalBattleFlow(state: OriginalBattleFlowState) {
  state.status = "ready";
  state.round = 1;
  state.roundTimer = msToSeconds(ORIGINAL_BATTLE_RULES.prepareMs);
  state.spawnTimer = 0;
  state.wavePhase = "prepare";
  state.waveTimer = msToSeconds(ORIGINAL_BATTLE_RULES.prepareMs);
  state.waveSize = originalWaveSize(1);
  state.waveSpawned = 0;
  state.bossSlots = { player: -1, ai: -1 };
  state.message = "配置武将与技能";
}

export function startOriginalBattleFlow(state: OriginalBattleFlowState) {
  resetOriginalBattleFlow(state);
  state.status = "playing";
  state.spawnTimer = msToSeconds(ORIGINAL_BATTLE_RULES.spawnIntervalMs);
  state.side.player.gold += ORIGINAL_BATTLE_RULES.startingGold;
  state.side.ai.gold += ORIGINAL_BATTLE_RULES.startingGold;
  state.message = "点击刷新征召士兵";
}

function beginOriginalWave(state: OriginalBattleFlowState, hooks: BattleFlowHooks) {
  state.wavePhase = "spawning";
  state.waveSize = originalWaveSize(state.round);
  state.waveSpawned = 0;
  state.spawnTimer = msToSeconds(ORIGINAL_BATTLE_RULES.spawnIntervalMs);
  state.waveTimer = state.waveSize * msToSeconds(ORIGINAL_BATTLE_RULES.spawnIntervalMs);
  state.bossSlots = hooks.chooseBossSlots(state.round, state.waveSize);
  state.message = `第 ${state.round} 波`;
}

function spawnOriginalWaveSlot(state: OriginalBattleFlowState, hooks: BattleFlowHooks) {
  for (const side of ["player", "ai"] as const) {
    const bossSlot = unpackBossSlot(state.bossSlots[side]);
    hooks.spawnEnemy(side, bossSlot.slot === state.waveSpawned ? bossSlot.bossId : undefined);
  }
  state.waveSpawned += 1;
}

export function updateOriginalBattleFlow(
  state: OriginalBattleFlowState,
  dt: number,
  hooks: BattleFlowHooks,
) {
  if (state.status !== "playing") return;

  if (state.wavePhase === "prepare") {
    state.waveTimer = Math.max(0, state.waveTimer - dt);
    state.roundTimer = state.waveTimer;
    if (state.waveTimer <= 0) beginOriginalWave(state, hooks);
    return;
  }

  if (state.wavePhase === "spawning") {
    state.spawnTimer -= dt;
    state.waveTimer = Math.max(
      0,
      state.spawnTimer +
        Math.max(0, state.waveSize - state.waveSpawned - 1) *
          msToSeconds(ORIGINAL_BATTLE_RULES.spawnIntervalMs),
    );
    state.roundTimer = state.waveTimer;

    if (state.spawnTimer <= 0 && state.waveSpawned < state.waveSize) {
      spawnOriginalWaveSlot(state, hooks);
      state.spawnTimer += msToSeconds(ORIGINAL_BATTLE_RULES.spawnIntervalMs);
      if (state.waveSpawned >= state.waveSize) {
        state.wavePhase = "cooldown";
        state.waveTimer = msToSeconds(ORIGINAL_BATTLE_RULES.cooldownMs);
        state.roundTimer = state.waveTimer;
        state.message = "下一波准备";
      }
    }
    return;
  }

  state.waveTimer = Math.max(0, state.waveTimer - dt);
  state.roundTimer = state.waveTimer;
  if (state.waveTimer > 0) return;

  if (state.round >= ORIGINAL_BATTLE_RULES.maxWaves) {
    hooks.completeBattle();
    return;
  }

  state.round += 1;
  beginOriginalWave(state, hooks);
}
