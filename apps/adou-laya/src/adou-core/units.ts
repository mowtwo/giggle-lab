import type { AdouGeneralId } from "./cards";
import type { AdouPlacedUnit } from "./merge";
import { getAdouWeapon, type AdouWeaponDefinition } from "./weapons";

export type AdouUnitArchetype =
  | "blade"
  | "bow"
  | "pike"
  | "cavalry"
  | "sword"
  | "farmer"
  | "civilian"
  | "general";

export type AdouAttackStyle = "single" | "pierce" | "area" | "rapid";

export type AdouBaseUnitStats = {
  archetype: AdouUnitArchetype;
  attackStyle: AdouAttackStyle;
  hp: number;
  damage: number;
  range: number;
  interval: number;
  maxTier: 3 | 5;
  color: number;
  description: string;
};

export type AdouResolvedUnitStats = AdouBaseUnitStats & {
  tier: number;
  attackRange: number;
  attackInterval: number;
  attackSpeedMultiplier: number;
  weaponDamage: number;
  weapon?: AdouWeaponDefinition;
  farmerIncomeInterval?: number;
};

export const ADOU_TIER_DAMAGE_SCALE = [1, 1.5, 1.9, 2.2, 2.45] as const;
export const ADOU_FARMER_INTERVALS = [20, 10, 5, 3, 2] as const;

export const ADOU_GENERAL_COMBAT_STATS: Record<AdouGeneralId, AdouBaseUnitStats> = {
  "zhao-yun": {
    archetype: "general",
    attackStyle: "pierce",
    hp: 70,
    damage: 6,
    range: 2.5,
    interval: 0.8,
    maxTier: 5,
    color: 0x58a7d8,
    description: "长枪突阵，穿透前排，适合守住阿斗面前的窄路。",
  },
  "zhang-fei": {
    archetype: "general",
    attackStyle: "area",
    hp: 100,
    damage: 10,
    range: 2.5,
    interval: 1,
    maxTier: 5,
    color: 0x2f2f2f,
    description: "高血量近战，范围震击，适合挡住敌军成群冲脸。",
  },
  "ma-chao": {
    archetype: "general",
    attackStyle: "single",
    hp: 92,
    damage: 10,
    range: 2.5,
    interval: 1,
    maxTier: 5,
    color: 0xd7b45a,
    description: "骑将点杀，单体伤害高，适合处理精英和漏网敌军。",
  },
  "guan-yu": {
    archetype: "general",
    attackStyle: "area",
    hp: 90,
    damage: 8,
    range: 2.5,
    interval: 1,
    maxTier: 5,
    color: 0x4aa465,
    description: "大刀横扫，兼顾输出和清群，是阿斗前线的稳定核心。",
  },
  "huang-zhong": {
    archetype: "general",
    attackStyle: "pierce",
    hp: 58,
    damage: 6,
    range: 4.5,
    interval: 0.8,
    maxTier: 5,
    color: 0xd6a143,
    description: "远射穿透，覆盖范围大，适合在后排提前削弱敌军。",
  },
  "guan-ping": {
    archetype: "general",
    attackStyle: "single",
    hp: 72,
    damage: 7,
    range: 2.5,
    interval: 1,
    maxTier: 3,
    color: 0x6aa86f,
    description: "稳健刀将，成型快，适合补齐阿斗阵线空缺。",
  },
  "guan-xing": {
    archetype: "general",
    attackStyle: "single",
    hp: 72,
    damage: 7,
    range: 2.5,
    interval: 1,
    maxTier: 3,
    color: 0x73b17a,
    description: "刀兵副将，升级成本低，适合早期守格和过渡。",
  },
  "zhang-bao": {
    archetype: "general",
    attackStyle: "single",
    hp: 72,
    damage: 7,
    range: 2.5,
    interval: 1,
    maxTier: 3,
    color: 0x8c7d6a,
    description: "枪兵副将，出手稳定，适合填补穿刺火力。",
  },
  "zhang-yi": {
    archetype: "general",
    attackStyle: "single",
    hp: 72,
    damage: 7,
    range: 2.5,
    interval: 1,
    maxTier: 3,
    color: 0x7b9fdd,
    description: "剑系副将，节奏灵活，适合搭配攻速和补刀。",
  },
  "huang-gai": {
    archetype: "general",
    attackStyle: "area",
    hp: 82,
    damage: 8,
    range: 2.5,
    interval: 1,
    maxTier: 3,
    color: 0xd8782f,
    description: "范围压制型守将，适合处理贴近阿斗的密集敌军。",
  },
  "liu-bei": {
    archetype: "general",
    attackStyle: "single",
    hp: 86,
    damage: 10,
    range: 2.5,
    interval: 0.8,
    maxTier: 5,
    color: 0xdccf63,
    description: "剑系主将，攻速快，适合在阿斗核心阵地持续输出。",
  },
  "huang-zu": {
    archetype: "general",
    attackStyle: "pierce",
    hp: 56,
    damage: 6,
    range: 3.5,
    interval: 0.8,
    maxTier: 3,
    color: 0xc99a4b,
    description: "低成本远射，能在早期帮阿斗争取布阵时间。",
  },
};

export const ADOU_TOKEN_COMBAT_STATS: Record<string, AdouBaseUnitStats> = {
  刀: {
    archetype: "blade",
    attackStyle: "single",
    hp: 42,
    damage: 3,
    range: 1.5,
    interval: 0.8,
    maxTier: 5,
    color: 0xdf6b45,
    description: "近身斩击，基础伤害较高。",
  },
  弓: {
    archetype: "bow",
    attackStyle: "single",
    hp: 34,
    damage: 2,
    range: 3.5,
    interval: 0.8,
    maxTier: 5,
    color: 0x66c5ff,
    description: "远程射击，适合后排提前削血。",
  },
  枪: {
    archetype: "pike",
    attackStyle: "pierce",
    hp: 38,
    damage: 2,
    range: 2.5,
    interval: 0.8,
    maxTier: 5,
    color: 0x9fe9ff,
    description: "长枪穿刺，能压制直线敌军。",
  },
  骑: {
    archetype: "cavalry",
    attackStyle: "area",
    hp: 46,
    damage: 2,
    range: 2,
    interval: 0.8,
    maxTier: 5,
    color: 0xc9a060,
    description: "骑兵冲阵，适合处理贴近的敌群。",
  },
  农: {
    archetype: "farmer",
    attackStyle: "single",
    hp: 30,
    damage: 0,
    range: 0,
    interval: 1,
    maxTier: 5,
    color: 0xcfe6b8,
    description: "农民会周期性产出馒头，在草地上产出更慢。",
  },
};

const CIVILIAN_STATS: AdouBaseUnitStats = {
  archetype: "civilian",
  attackStyle: "single",
  hp: 24,
  damage: 1,
  range: 1.2,
  interval: 1.05,
  maxTier: 5,
  color: 0xf5ebd7,
  description: "未合成的散字单位，战斗能力较弱。",
};

function clampAdouTier(tier: number, maxTier: number) {
  return Math.max(1, Math.min(maxTier, Math.floor(tier)));
}

function adouTierScale(tier: number) {
  return ADOU_TIER_DAMAGE_SCALE[
    Math.max(0, Math.min(tier - 1, ADOU_TIER_DAMAGE_SCALE.length - 1))
  ];
}

function scaleAdouStats(stats: AdouBaseUnitStats, tier: number): AdouBaseUnitStats {
  const safeTier = clampAdouTier(tier, stats.maxTier);
  const scale = adouTierScale(safeTier);
  return {
    ...stats,
    hp: stats.hp * scale,
    damage: stats.damage * scale,
  };
}

export function getAdouBaseStatsForUnit(unit: AdouPlacedUnit) {
  if (unit.kind === "general") {
    return scaleAdouStats(ADOU_GENERAL_COMBAT_STATS[unit.generalId], unit.tier);
  }
  return scaleAdouStats(ADOU_TOKEN_COMBAT_STATS[unit.name] ?? CIVILIAN_STATS, unit.tier);
}

export function getAdouMaxTierForUnit(unit: AdouPlacedUnit) {
  if (unit.kind === "general") return ADOU_GENERAL_COMBAT_STATS[unit.generalId].maxTier;
  return (ADOU_TOKEN_COMBAT_STATS[unit.name] ?? CIVILIAN_STATS).maxTier;
}

export function getAdouFarmerIncomeInterval(
  tier: number,
  tileKind: "plot" | "road" | "grass" | "blocked" | null = null,
) {
  if (tileKind === "plot") return 1;
  return ADOU_FARMER_INTERVALS[
    Math.max(0, Math.min(tier - 1, ADOU_FARMER_INTERVALS.length - 1))
  ];
}

export function getAdouWeaponAdjustedRange(
  baseRange: number,
  weapon: AdouWeaponDefinition | null | undefined,
) {
  if (!weapon) return baseRange;
  if (weapon.description.includes("攻击距离翻倍")) return baseRange * 2;
  if (weapon.description.includes("攻击距离+1")) return baseRange + 1;
  if (weapon.description.includes("攻击距离+0.5")) return baseRange + 0.5;
  return baseRange;
}

export function resolveAdouUnitStats(
  unit: AdouPlacedUnit,
  options: {
    weaponId?: number | null;
    rangeMultiplier?: number;
    attackSpeedMultiplier?: number;
    unitAttackSpeedMultiplier?: number;
    tileKind?: "plot" | "road" | "grass" | "blocked" | null;
  } = {},
): AdouResolvedUnitStats {
  const baseStats = getAdouBaseStatsForUnit(unit);
  const weapon = options.weaponId === undefined || options.weaponId === null
    ? undefined
    : getAdouWeapon(options.weaponId) ?? undefined;
  const rangeMultiplier = options.rangeMultiplier ?? 1;
  const attackSpeedMultiplier =
    (options.attackSpeedMultiplier ?? 1) * (options.unitAttackSpeedMultiplier ?? 1);
  const attackRange = getAdouWeaponAdjustedRange(baseStats.range, weapon) * rangeMultiplier;
  const attackInterval = Math.max(0.18, baseStats.interval / Math.max(0.1, attackSpeedMultiplier));

  return {
    ...baseStats,
    tier: clampAdouTier(unit.tier, baseStats.maxTier),
    damage: baseStats.damage + (weapon?.addAttackPower ?? 0),
    attackRange,
    attackInterval,
    attackSpeedMultiplier,
    weaponDamage: weapon?.addAttackPower ?? 0,
    weapon,
    farmerIncomeInterval:
      baseStats.archetype === "farmer"
        ? getAdouFarmerIncomeInterval(unit.tier, options.tileKind ?? null)
        : undefined,
  };
}
