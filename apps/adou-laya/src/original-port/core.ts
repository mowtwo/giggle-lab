import {
  packBossSlot,
  resetOriginalBattleFlow,
  startOriginalBattleFlow,
  updateOriginalBattleFlow,
  type OriginalBattleFlowState,
} from "./battle-flow";
import {
  ORIGINAL_BATTLE_RULES,
  ORIGINAL_BOSS_RULES,
  ORIGINAL_DECK,
  ORIGINAL_ENEMY_RULES,
} from "./rules";
import { createOriginalNullPorts, type OriginalRuntimePorts } from "./ports";

export type OriginalSide = "player" | "ai";
export type OriginalGameStatus = "ready" | "playing" | "ended";
export type OriginalWavePhase = "prepare" | "spawning" | "cooldown";

export type OriginalCard = {
  id: number;
  text: string;
  source: "soldier" | "generalPart" | "prop";
};

export type OriginalEnemy = {
  id: number;
  side: OriginalSide;
  kind: "mob" | "boss";
  bossId?: number;
  hp: number;
  maxHp: number;
  speed: number;
  progress: number;
};

export type OriginalSideState = {
  hp: number;
  maxHp: number;
  gold: number;
  refreshCost: number;
  deck: string[];
  refreshSlots: Array<OriginalCard | null>;
};

export type OriginalGameState = OriginalBattleFlowState & {
  nextId: number;
  winner: OriginalSide | null;
  sides: Record<OriginalSide, OriginalSideState>;
  enemies: OriginalEnemy[];
  enemyHpMultipliers: readonly number[];
  bossCursor: number;
};

type OriginalGameEvent =
  | { type: "enemySpawned"; enemy: OriginalEnemy }
  | { type: "refreshed"; side: OriginalSide }
  | { type: "ended"; winner: OriginalSide | null };

type Listener = (event: OriginalGameEvent) => void;

function createSideState(): OriginalSideState {
  return {
    hp: 3,
    maxHp: 3,
    gold: 0,
    refreshCost: ORIGINAL_BATTLE_RULES.startingRefreshCost,
    deck: [...ORIGINAL_DECK],
    refreshSlots: Array.from({ length: 5 }, (): OriginalCard | null => null),
  };
}

function cardSource(text: string): OriginalCard["source"] {
  if (text === "铲") return "prop";
  if (["刀", "弓", "枪", "骑", "农"].includes(text)) return "soldier";
  return "generalPart";
}

function drawToken(deck: string[], rng: () => number) {
  if (deck.length <= 0) return "刀";
  const index = Math.floor(rng() * deck.length);
  const token = deck[index] ?? "刀";
  if (!["刀", "弓", "枪", "骑", "铲", "农"].includes(token)) deck.splice(index, 1);
  return token;
}

function weightedPick<T>(items: readonly T[], weights: readonly number[], rng: () => number) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) return items[index] ?? items[0];
  }
  return items[items.length - 1] ?? items[0];
}

function createState(rng: () => number): OriginalGameState {
  const state: OriginalGameState = {
    status: "ready",
    round: 1,
    roundTimer: ORIGINAL_BATTLE_RULES.prepareMs / 1000,
    spawnTimer: 0,
    wavePhase: "prepare",
    waveTimer: ORIGINAL_BATTLE_RULES.prepareMs / 1000,
    waveSize: ORIGINAL_BATTLE_RULES.waveCounts[0],
    waveSpawned: 0,
    bossSlots: { player: -1, ai: -1 },
    message: "配置武将与技能",
    side: {
      player: { gold: 0 },
      ai: { gold: 0 },
    },
    nextId: 1,
    winner: null,
    sides: {
      player: createSideState(),
      ai: createSideState(),
    },
    enemies: [],
    enemyHpMultipliers:
      weightedPick(
        ORIGINAL_ENEMY_RULES.enemyHpMultiplierPatterns,
        ORIGINAL_ENEMY_RULES.enemyHpMultiplierWeights,
        rng,
      ) ?? ORIGINAL_ENEMY_RULES.enemyHpMultiplierPatterns[0],
    bossCursor: 0,
  };
  resetOriginalBattleFlow(state);
  return state;
}

export class OriginalGameCore {
  readonly ports: OriginalRuntimePorts;
  readonly rng: () => number;
  state: OriginalGameState;
  private listeners = new Set<Listener>();

  constructor(options: { rng?: () => number; ports?: OriginalRuntimePorts } = {}) {
    this.rng = options.rng ?? Math.random;
    this.ports = options.ports ?? createOriginalNullPorts();
    this.state = createState(this.rng);
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  startGame() {
    this.state = createState(this.rng);
    startOriginalBattleFlow(this.state);
    this.state.sides.player.gold = this.state.side.player.gold;
    this.state.sides.ai.gold = this.state.side.ai.gold;
    this.refresh("player", true);
    this.refresh("ai", true);
  }

  update(deltaMs: number) {
    updateOriginalBattleFlow(this.state, deltaMs / 1000, {
      chooseBossSlots: (round, waveSize) => this.chooseBossSlots(round, waveSize),
      spawnEnemy: (side, bossId) => this.spawnEnemy(side, bossId),
      completeBattle: () => this.completeBattle("player"),
    });
  }

  refresh(side: OriginalSide, free = false) {
    const sideState = this.state.sides[side];
    if (!free) {
      if (sideState.gold < sideState.refreshCost) return false;
      sideState.gold -= sideState.refreshCost;
      sideState.refreshCost += 2;
    }

    sideState.refreshSlots = sideState.refreshSlots.map(() => {
      const text = drawToken(sideState.deck, this.rng);
      return {
        id: this.nextId(),
        text,
        source: cardSource(text),
      };
    });
    this.emit({ type: "refreshed", side });
    return true;
  }

  private chooseBossSlots(round: number, waveSize: number) {
    const bossRoundIndex = (ORIGINAL_BATTLE_RULES.bossRounds as readonly number[]).indexOf(round);
    if (bossRoundIndex < 0) return { player: -1, ai: -1 };
    const probability = ORIGINAL_BATTLE_RULES.bossProbabilities[bossRoundIndex] ?? 0;
    return {
      player: this.rollBossSlot(probability, waveSize),
      ai: this.rollBossSlot(probability, waveSize),
    };
  }

  private rollBossSlot(probability: number, waveSize: number) {
    if (this.rng() > probability) return -1;
    const bossId = this.state.bossCursor % ORIGINAL_BOSS_RULES.length;
    this.state.bossCursor += 1;
    return packBossSlot(Math.floor(this.rng() * waveSize), bossId);
  }

  private spawnEnemy(side: OriginalSide, bossId?: number) {
    const roundIndex = Math.max(0, Math.min(this.state.round - 1, ORIGINAL_ENEMY_RULES.mobKinds[0].hp.length - 1));
    const baseMob = ORIGINAL_ENEMY_RULES.mobKinds[0];
    const roundMultiplier = this.state.enemyHpMultipliers[roundIndex] ?? 1;
    const kind = bossId === undefined ? "mob" : "boss";
    const bossRule = bossId === undefined ? null : ORIGINAL_BOSS_RULES[bossId];
    const hp =
      kind === "boss" && bossRule
        ? baseMob.hp[roundIndex] * bossRule.hp
        : baseMob.hp[roundIndex] * roundMultiplier;
    const enemy: OriginalEnemy = {
      id: this.nextId(),
      side,
      kind,
      bossId,
      hp,
      maxHp: hp,
      speed: kind === "boss" && bossRule ? bossRule.speed : baseMob.speed,
      progress: 0,
    };
    this.state.enemies.push(enemy);
    this.emit({ type: "enemySpawned", enemy });
  }

  private completeBattle(winner: OriginalSide | null) {
    this.state.status = "ended";
    this.state.winner = winner;
    this.emit({ type: "ended", winner });
  }

  private nextId() {
    const id = this.state.nextId;
    this.state.nextId += 1;
    return id;
  }

  private emit(event: OriginalGameEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
