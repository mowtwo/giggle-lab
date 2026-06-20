export type AdouSkillId =
  | "shovel"
  | "bulldozer"
  | "writingBrush"
  | "trainingSpell"
  | "upLvlSpell"
  | "lifePill"
  | "longRange"
  | "inkstone"
  | "trap"
  | "landmine"
  | "attSpeedSpell"
  | "exorcismSpell"
  | "farmer"
  | "recruit"
  | "allAttSpeedSpell"
  | "goingHandInHand"
  | "xuMingPill"
  | "daBuPill"
  | "silt"
  | "superShovel"
  | "meteor"
  | "trashCan"
  | "promotionOrder"
  | "marchPill"
  | "goldSeeker";

export type AdouSkillKind = "active" | "passive" | "special" | "instant";
export type AdouSkillTarget = "none" | "cell" | "unit" | "road" | "hand";
export type AdouSkillRarity = 0 | 1 | 2 | 3;

export type AdouSkillDefinition = {
  originalId: number;
  id: AdouSkillId;
  kind: AdouSkillKind;
  battleText: string;
  title: string;
  description: string;
  cost: number;
  cooldownMs: number;
  rarity: AdouSkillRarity;
  target: AdouSkillTarget;
  shopCountWeight: number;
  shopAppearWeight: number;
  iconAtlasKey: string;
};

type SkillInput = Omit<AdouSkillDefinition, "iconAtlasKey"> & {
  icon: string;
};

function skill(input: SkillInput): AdouSkillDefinition {
  return {
    ...input,
    iconAtlasKey: `resources/img/props/${input.icon}`,
  };
}

export const ADOU_SKILL_DEFS: readonly AdouSkillDefinition[] = [
  skill({
    originalId: 0,
    id: "shovel",
    kind: "special",
    battleText: "铲",
    title: "铲子",
    description: "一把可以开荒的铲子",
    cost: 999,
    cooldownMs: 0,
    rarity: 3,
    target: "cell",
    shopCountWeight: 0,
    shopAppearWeight: 0,
    icon: "shovel_1.png",
  }),
  skill({
    originalId: 1,
    id: "bulldozer",
    kind: "special",
    battleText: "车",
    title: "推土车",
    description: "将敌人向后推,阿斗安全无忧",
    cost: 999,
    cooldownMs: 0,
    rarity: 3,
    target: "none",
    shopCountWeight: 0,
    shopAppearWeight: 0,
    icon: "bulldozer_0.png",
  }),
  skill({
    originalId: 2,
    id: "writingBrush",
    kind: "active",
    battleText: "笔",
    title: "毛笔",
    description: "可以逆天改字",
    cost: 50,
    cooldownMs: 30000,
    rarity: 2,
    target: "hand",
    shopCountWeight: 10,
    shopAppearWeight: 12,
    icon: "writingBrush_1.png",
  }),
  skill({
    originalId: 3,
    id: "trainingSpell",
    kind: "active",
    battleText: "练",
    title: "练兵符",
    description: "拖到单位上有概率升一级或降一级",
    cost: 60,
    cooldownMs: 65000,
    rarity: 2,
    target: "unit",
    shopCountWeight: 8,
    shopAppearWeight: 8,
    icon: "trainingSpell_1.png",
  }),
  skill({
    originalId: 4,
    id: "upLvlSpell",
    kind: "active",
    battleText: "神",
    title: "神兵符",
    description: "拖到单位上升一级",
    cost: 90,
    cooldownMs: 55000,
    rarity: 3,
    target: "unit",
    shopCountWeight: 5,
    shopAppearWeight: 3,
    icon: "upLvlSpell_1.png",
  }),
  skill({
    originalId: 5,
    id: "lifePill",
    kind: "active",
    battleText: "包",
    title: "包子",
    description: "55%概率给阿斗续一条命，45%概率减少一条命",
    cost: 50,
    cooldownMs: 90000,
    rarity: 1,
    target: "none",
    shopCountWeight: 10,
    shopAppearWeight: 12,
    icon: "lifePill_1.png",
  }),
  skill({
    originalId: 6,
    id: "longRange",
    kind: "active",
    battleText: "远",
    title: "御敌千里",
    description: "使远程单位攻击范围翻倍，全局生效",
    cost: 30,
    cooldownMs: 60000,
    rarity: 0,
    target: "none",
    shopCountWeight: 20,
    shopAppearWeight: 25,
    icon: "longRange_1.png",
  }),
  skill({
    originalId: 7,
    id: "inkstone",
    kind: "active",
    battleText: "砚",
    title: "砚台",
    description: "打翻砚台，泼出墨汁，使敌方部队攻速缓慢，持续5秒",
    cost: 30,
    cooldownMs: 90000,
    rarity: 0,
    target: "none",
    shopCountWeight: 20,
    shopAppearWeight: 25,
    icon: "inkstone_1.png",
  }),
  skill({
    originalId: 8,
    id: "trap",
    kind: "active",
    battleText: "坑",
    title: "陷阱",
    description: "敌人掉下去一时会爬不出来",
    cost: 35,
    cooldownMs: 50000,
    rarity: 0,
    target: "road",
    shopCountWeight: 15,
    shopAppearWeight: 20,
    icon: "trap_1.png",
  }),
  skill({
    originalId: 9,
    id: "landmine",
    kind: "active",
    battleText: "雷",
    title: "地雷",
    description: "可炸死敌人",
    cost: 50,
    cooldownMs: 55000,
    rarity: 1,
    target: "road",
    shopCountWeight: 10,
    shopAppearWeight: 12,
    icon: "landmine_1.png",
  }),
  skill({
    originalId: 10,
    id: "attSpeedSpell",
    kind: "active",
    battleText: "速",
    title: "攻速符",
    description: "单位攻速+40%，全局生效",
    cost: 80,
    cooldownMs: 90000,
    rarity: 2,
    target: "unit",
    shopCountWeight: 6,
    shopAppearWeight: 4,
    icon: "attSpeedSpell_1.png",
  }),
  skill({
    originalId: 11,
    id: "exorcismSpell",
    kind: "passive",
    battleText: "降",
    title: "降妖符",
    description: "boss施法有50%失败率，并反噬boss自身血量",
    cost: 80,
    cooldownMs: -1,
    rarity: 2,
    target: "none",
    shopCountWeight: 6,
    shopAppearWeight: 4,
    icon: "exorcismSpell_1.png",
  }),
  skill({
    originalId: 12,
    id: "farmer",
    kind: "passive",
    battleText: "农",
    title: "农民",
    description: "可以刷出农民，每20秒+1金币，升级生产速度翻倍",
    cost: 90,
    cooldownMs: -1,
    rarity: 2,
    target: "cell",
    shopCountWeight: 5,
    shopAppearWeight: 3,
    icon: "farmer_1.png",
  }),
  skill({
    originalId: 13,
    id: "recruit",
    kind: "passive",
    battleText: "贤",
    title: "招贤榜",
    description: "武将刷出概率x2",
    cost: 60,
    cooldownMs: -1,
    rarity: 1,
    target: "none",
    shopCountWeight: 8,
    shopAppearWeight: 8,
    icon: "recruit_1.png",
  }),
  skill({
    originalId: 14,
    id: "allAttSpeedSpell",
    kind: "passive",
    battleText: "齐",
    title: "攻速符(全体)",
    description: "双方所有单位攻速+10%，全局生效",
    cost: 60,
    cooldownMs: -1,
    rarity: 1,
    target: "none",
    shopCountWeight: 8,
    shopAppearWeight: 8,
    icon: "allAttSpeedSpell_1.png",
  }),
  skill({
    originalId: 15,
    id: "goingHandInHand",
    kind: "passive",
    battleText: "进",
    title: "齐头并进",
    description: "我方单位攻速+50%，对方单位攻速+30%，全局生效",
    cost: 90,
    cooldownMs: -1,
    rarity: 2,
    target: "none",
    shopCountWeight: 5,
    shopAppearWeight: 3,
    icon: "goingHandInHand_1.png",
  }),
  skill({
    originalId: 16,
    id: "xuMingPill",
    kind: "passive",
    battleText: "续",
    title: "续命丹",
    description: "我方阿斗+5条命，对方阿斗+3条命",
    cost: 50,
    cooldownMs: -1,
    rarity: 0,
    target: "none",
    shopCountWeight: 10,
    shopAppearWeight: 12,
    icon: "xuMingPill_1.png",
  }),
  skill({
    originalId: 17,
    id: "daBuPill",
    kind: "passive",
    battleText: "补",
    title: "大补丸",
    description: "我方阿斗+3条命",
    cost: 40,
    cooldownMs: -1,
    rarity: 0,
    target: "none",
    shopCountWeight: 12,
    shopAppearWeight: 15,
    icon: "daBuPill_1.png",
  }),
  skill({
    originalId: 18,
    id: "silt",
    kind: "passive",
    battleText: "泥",
    title: "淤泥",
    description: "道路泥泞，我方敌人移速-10%，全局生效",
    cost: 40,
    cooldownMs: -1,
    rarity: 0,
    target: "none",
    shopCountWeight: 12,
    shopAppearWeight: 15,
    icon: "silt_1.png",
  }),
  skill({
    originalId: 19,
    id: "superShovel",
    kind: "passive",
    battleText: "洛",
    title: "洛阳铲",
    description: "每60秒生成一个铲子",
    cost: 120,
    cooldownMs: -1,
    rarity: 3,
    target: "none",
    shopCountWeight: 3,
    shopAppearWeight: 1,
    icon: "superShovel_1.png",
  }),
  skill({
    originalId: 20,
    id: "meteor",
    kind: "passive",
    battleText: "陨",
    title: "陨石",
    description: "当敌人接近阿斗时，会落下陨石消灭敌人",
    cost: 150,
    cooldownMs: -1,
    rarity: 3,
    target: "none",
    shopCountWeight: 2,
    shopAppearWeight: 1,
    icon: "meteor_1.png",
  }),
  skill({
    originalId: 21,
    id: "trashCan",
    kind: "active",
    battleText: "桶",
    title: "垃圾桶",
    description: "1馒头回收无用文字",
    cost: 150,
    cooldownMs: 0,
    rarity: 3,
    target: "hand",
    shopCountWeight: 2,
    shopAppearWeight: 1,
    icon: "trashCan_1.png",
  }),
  skill({
    originalId: 22,
    id: "promotionOrder",
    kind: "passive",
    battleText: "升",
    title: "升职令",
    description: "刷出的兵有$%概率升到2级",
    cost: 100,
    cooldownMs: -1,
    rarity: 1,
    target: "none",
    shopCountWeight: 8,
    shopAppearWeight: 5,
    icon: "promotionOrder_1.png",
  }),
  skill({
    originalId: 23,
    id: "marchPill",
    kind: "instant",
    battleText: "行",
    title: "行军丹",
    description: "体力+10",
    cost: 40,
    cooldownMs: 0,
    rarity: 0,
    target: "none",
    shopCountWeight: 12,
    shopAppearWeight: 15,
    icon: "marchPill_1.png",
  }),
  skill({
    originalId: 24,
    id: "goldSeeker",
    kind: "passive",
    battleText: "摸",
    title: "摸金校尉",
    description: "让所有铲子变成金铲子，铲出宝箱",
    cost: 150,
    cooldownMs: -1,
    rarity: 3,
    target: "none",
    shopCountWeight: 2,
    shopAppearWeight: 1,
    icon: "goldSeeker_1.png",
  }),
] as const;

export const ADOU_SKILL_BY_ID = Object.fromEntries(
  ADOU_SKILL_DEFS.map((skillDef) => [skillDef.id, skillDef]),
) as Record<AdouSkillId, AdouSkillDefinition>;

export const ADOU_DEFAULT_ACTIVE_SKILLS: readonly AdouSkillId[] = [
  "inkstone",
  "attSpeedSpell",
] as const;

export const ADOU_DEFAULT_PASSIVE_SKILLS: readonly AdouSkillId[] = [
  "farmer",
  "recruit",
  "promotionOrder",
  "superShovel",
  "goldSeeker",
] as const;

export function getAdouSkill(id: AdouSkillId) {
  return ADOU_SKILL_BY_ID[id] ?? null;
}

export function getAdouSkillsByKind(kind: AdouSkillKind) {
  return ADOU_SKILL_DEFS.filter((skillDef) => skillDef.kind === kind);
}

export function getAdouSelectableActiveSkills() {
  return getAdouSkillsByKind("active");
}

export function getAdouSelectablePassiveSkills() {
  return getAdouSkillsByKind("passive");
}

export function adouSkillAcceptsTarget(skillDef: AdouSkillDefinition, target: AdouSkillTarget) {
  return skillDef.target === target;
}

export function adouSkillCooldownSeconds(skillDef: Pick<AdouSkillDefinition, "cooldownMs">) {
  return skillDef.cooldownMs < 0 ? null : skillDef.cooldownMs / 1000;
}
