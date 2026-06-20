import type { AdouSide } from "./cards";

export type AdouWavePhase = "prepare" | "spawning" | "cooldown";
export type AdouAiDifficulty = 0 | 1 | 2 | 3;

export type AdouBossDefinition = {
  id: number;
  name: string;
  skillName: string;
  skillIntro: string;
  hpScale: number;
  speed: number;
  range: number;
  cooldownSeconds: number;
  color: string;
};

export const ADOU_BATTLE_RULES = {
  startingMantou: 20,
  aiStartBonusMantou: 10,
  startingRefreshCost: 10,
  prepareSeconds: 10,
  spawnIntervalSeconds: 1.5,
  cooldownSeconds: 5,
  maxWaves: 20,
  waveCounts: [
    10, 11, 12, 13, 15, 16, 18, 19, 21, 24, 26, 29, 31, 35, 38, 42,
    46, 51, 56, 61,
  ],
  bossRounds: [3, 6, 9, 12, 15, 18],
  bossProbabilities: [0.1, 0.2, 0.3, 0.5, 0.9, 1],
  handSize: 5,
  playerHp: 3,
} as const;

export const ADOU_AI_RULES = {
  bonusRounds: [3, 5, 8, 11, 14, 17],
  bonusMantouByDifficulty: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10],
    [20, 20, 20, 20, 20, 20],
  ],
  tickSecondsByDifficulty: [2, 1.5, 1, 0.5],
  activeSkillChanceByDifficulty: [0.001, 0.001, 0.001, 0.001],
  routeDisruptionChanceByDifficulty: [0.1, 0.2, 0.5, 0.8],
  bossGuardChanceByDifficulty: [0, 0, 0, 5],
} as const;

export function normalizeAdouAiDifficulty(value: number | undefined): AdouAiDifficulty {
  if (value === 0 || value === 1 || value === 2 || value === 3) return value;
  return 2;
}

export const ADOU_ENEMY_RULES = {
  mobHpByRound: [
    10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863,
    2701, 3917, 5680, 8235, 11941, 17315,
  ],
  mobSpeed: 50,
  hpMultiplierPatterns: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.1, 1.2, 1.3, 1.2, 1.3, 1.7, 2, 1, 1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1.5, 1, 1.8, 2, 1, 1, 2, 1, 1, 1.3, 1, 1, 1.4, 1, 1, 1.5, 1, 1],
  ],
  hpMultiplierWeights: [5, 2, 3],
} as const;

export const ADOU_BOSS_DEFS: readonly AdouBossDefinition[] = [
  { id: 0, name: "张角", skillName: "摄魂", skillIntro: "使我方小兵陷入混乱，无法攻击", hpScale: 7, speed: 10, range: 2, cooldownSeconds: 8, color: "#ed462f" },
  { id: 1, name: "张梁", skillName: "招魂", skillIntro: "做法复活死亡的小兵", hpScale: 10, speed: 10, range: 3, cooldownSeconds: 8, color: "#32ee3a" },
  { id: 2, name: "董卓", skillName: "鼓舞", skillIntro: "激励身边单位，大幅提升血量和移速", hpScale: 14, speed: 10, range: 2, cooldownSeconds: 10, color: "#27c8ff" },
  { id: 3, name: "曹操", skillName: "拆迁", skillIntro: "将空白地块转化为不可用", hpScale: 7, speed: 10, range: 10, cooldownSeconds: 10, color: "#f16fe1" },
  { id: 4, name: "甄宓", skillName: "巫山云雨", skillIntro: "战场下雨，降低所有单位攻速，升级可驱除", hpScale: 10, speed: 10, range: 10, cooldownSeconds: 3, color: "#68b4ff" },
  { id: 5, name: "貂蝉", skillName: "裙下之臣", skillIntro: "将最低等级的小兵纳入麾下", hpScale: 14, speed: 10, range: 10, cooldownSeconds: 10, color: "#d9207a" },
  { id: 6, name: "西凉军", skillName: "铁骑号令", skillIntro: "召唤西凉骑兵", hpScale: 7, speed: 10, range: 0, cooldownSeconds: 8, color: "#4db678" },
  { id: 7, name: "吕布", skillName: "方天画戟", skillIntro: "挥动武器，大幅降低小兵等级并禁止合成", hpScale: 10, speed: 10, range: 2.5, cooldownSeconds: 10, color: "#fb4c54" },
  { id: 8, name: "董卓", skillName: "饕餮", skillIntro: "吞噬范围内小兵，获得血量加成并膨胀", hpScale: 14, speed: 10, range: 1.5, cooldownSeconds: 10, color: "#7447a6" },
  { id: 9, name: "夏侯惇", skillName: "彻底疯狂", skillIntro: "冲阵击倒小兵，使其无法动弹，升级解除", hpScale: 7, speed: 10, range: 2, cooldownSeconds: 15, color: "#fb2500" },
  { id: 10, name: "夏侯惇", skillName: "噬目", skillIntro: "视野变暗，难以看清局势", hpScale: 10, speed: 10, range: 2, cooldownSeconds: 8, color: "#21b2ff" },
  { id: 11, name: "曹操", skillName: "一代枭雄", skillIntro: "封印最高等级小兵，升级解除", hpScale: 14, speed: 10, range: 10, cooldownSeconds: 15, color: "#010b97" },
] as const;

export function createAdouSeededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function adouWeightedPick<T>(
  items: readonly T[],
  weights: readonly number[],
  rng: () => number,
) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) return items[index] ?? items[0];
  }
  return items[items.length - 1] ?? items[0];
}

export function adouWaveSize(round: number) {
  const counts = ADOU_BATTLE_RULES.waveCounts;
  if (round <= counts.length) return counts[round - 1] ?? counts[0];
  return counts[counts.length - 1] + (round - counts.length) * 2;
}

export function packAdouBossSlot(slot: number, bossId?: number) {
  return bossId === undefined ? -1 : (bossId + 1) * 1000 + slot;
}

export function unpackAdouBossSlot(packed: number) {
  if (packed < 1000) return { slot: -1, bossId: undefined };
  return {
    slot: packed % 1000,
    bossId: Math.floor(packed / 1000) - 1,
  };
}

export function opponentAdouSide(side: AdouSide): AdouSide {
  return side === "player" ? "ai" : "player";
}
