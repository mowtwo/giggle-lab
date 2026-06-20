import type { AdouGeneralDefinition, AdouWeaponClass } from "./cards";

export type AdouWeaponType = "bow" | "pike" | "blade" | "sword";
export type AdouWeaponRarity = 0 | 1 | 2 | 3 | 4;

export type AdouWeaponDefinition = {
  id: number;
  type: AdouWeaponType;
  name: string;
  displayText: string;
  rarity: AdouWeaponRarity;
  rareText?: string;
  addAttackPower: number;
  exclusiveGeneralName?: string;
  scale: number;
  anchorY: number;
  description: string;
  fragmentCount: number;
  atlasKey: string;
};

export const ADOU_WEAPON_TYPE_LABELS: Record<AdouWeaponType, string> = {
  bow: "弓",
  pike: "枪",
  blade: "刀",
  sword: "剑",
};

export const ADOU_WEAPON_RARITY_LABELS: Record<AdouWeaponRarity, string> = {
  0: "普通",
  1: "精良",
  2: "稀有",
  3: "史诗",
  4: "传说",
};

export const ADOU_WEAPON_RARITY_COLORS: Record<AdouWeaponRarity, string> = {
  0: "#2d251a",
  1: "#2f7a45",
  2: "#2d64b8",
  3: "#8b45bf",
  4: "#c77922",
};

const WEAPON_TYPE_BY_ORIGINAL_CODE = {
  0: "bow",
  1: "pike",
  2: "blade",
  3: "sword",
} as const satisfies Record<number, AdouWeaponType>;

function weapon(
  id: number,
  originalType: keyof typeof WEAPON_TYPE_BY_ORIGINAL_CODE,
  name: string,
  rarity: AdouWeaponRarity,
  addAttackPower: number,
  scale: number,
  anchorY: number,
  description: string,
  fragmentCount: number,
  rareText?: string,
  exclusiveGeneralName?: string,
): AdouWeaponDefinition {
  return {
    id,
    type: WEAPON_TYPE_BY_ORIGINAL_CODE[originalType],
    name,
    displayText: rareText ?? name,
    rarity,
    rareText,
    addAttackPower,
    exclusiveGeneralName,
    scale,
    anchorY,
    description,
    fragmentCount,
    atlasKey: `resources/img/weapon/weapon_${id}.png`,
  };
}

export const ADOU_WEAPON_DEFS: readonly AdouWeaponDefinition[] = [
  weapon(0, 0, "短弓", 0, 1, 1, 0.5, "一把朴实无华的短弓", 1),
  weapon(1, 0, "长弓", 1, 2, 1, 0.5, "攻击距离+0.5", 2),
  weapon(2, 0, "铁弓", 1, 2, 1, 0.5, "10%概率击退", 2),
  weapon(3, 0, "角弓", 2, 3, 1.5, 0.5, "攻击同一个单位时，每攻击一次，攻速+5%", 3),
  weapon(4, 0, "射雕弓", 3, 4, 1.5, 0.5, "10%概率打出一只缓慢飞行的老鹰，对沿途敌人造成伤害", 4, "雕"),
  weapon(5, 0, "铁胎弓", 3, 5, 1.5, 0.5, "10%概率打出一道火龙，点燃路径；专属：黄忠的技能效果翻倍", 4, "胎", "黄忠"),
  weapon(6, 0, "神臂弓", 3, 5, 1.5, 0.5, "攻击同一个单位时，每攻击一次，攻速+15%", 4, "神"),
  weapon(7, 0, "霸王弓", 4, 6, 2, 0.5, "每击中一个单位，有50%概率弹射一次", 5, "霸"),
  weapon(8, 0, "落日弓", 4, 6, 1.8, 0.5, "攻击距离翻倍，且攻击距离越远，伤害越高", 5, "落"),
  weapon(9, 0, "诸葛连弩", 4, 6, 2, 0.5, "每射击10次，会射出10支火箭", 5, "弩"),
  weapon(10, 1, "短枪", 0, 1, 1, 0.73, "一把朴实无华的短枪", 1),
  weapon(11, 1, "长枪", 1, 2, 0.8, 0.61, "攻击距离+0.5", 2),
  weapon(12, 1, "铁枪", 1, 3, 0.8, 0.61, "首次攻击某个单位时，20%几率从地下戳出1个枪阵", 2),
  weapon(13, 1, "大戟", 2, 4, 1.5, 0.62, "攻击距离+1", 3),
  weapon(14, 1, "钩镰枪", 2, 4, 1.5, 0.61, "首次攻击某个单位时，20%几率使之跌倒", 3),
  weapon(15, 1, "点钢枪", 3, 5, 1.4, 0.54, "每击杀一个敌人，攻速+50%，持续2秒", 4, "点"),
  weapon(16, 1, "梨花枪", 3, 6, 1.4, 0.53, "每击杀一个敌人，飞出8朵旋转的梨花随机打击8个敌人", 4, "花"),
  weapon(17, 1, "虎头湛金枪", 3, 6, 1.4, 0.53, "首次攻击某个单位时，20%几率从地下戳出3个枪阵；专属：马超可触发5个枪阵", 4, "金", "马超"),
  weapon(18, 1, "丈八蛇矛", 4, 9, 2, 0.51, "初始释放一条灵蛇拦路攻击敌人，英雄每升一级，会释放一条新的灵蛇；专属：张飞释放大招后，所有灵蛇攻速翻倍，持续6秒。", 5, "八", "张飞"),
  weapon(19, 1, "龙胆亮银枪", 4, 10, 2, 0.51, "每次攻击有10%概率召唤飞枪，对所有敌人无差别打击；专属：赵云操纵飞枪技术高超", 5, "亮", "赵云"),
  weapon(20, 2, "短刀", 0, 1, 1, 0.69, "一把朴实无华的短刀", 1),
  weapon(21, 2, "长刀", 1, 2, 1, 0.64, "攻击距离+0.5", 2),
  weapon(22, 2, "铁刀", 1, 3, 1, 0.66, "攻击同一个单位时，每攻击一次，攻速+5%", 2),
  weapon(23, 2, "狼牙棒", 2, 4, 1.8, 0.65, "每次攻击有10%概率狼嚎，提升周围单位20%攻速，持续10秒", 3),
  weapon(24, 2, "三尖刀", 2, 4, 1.8, 0.6, "每攻击10次释放刀气", 3),
  weapon(25, 2, "铁蒺藜骨朵", 2, 5, 1.8, 0.62, "有10%概率造成晕眩", 3),
  weapon(26, 2, "古锭刀", 3, 6, 1.8, 0.59, "首次攻击某单位可获得1金币", 4, "锭"),
  weapon(27, 2, "虎啸战刀", 3, 7, 1.8, 0.6, "每次攻击有10%概率虎啸，提升周围单位30%攻速，持续10秒", 4, "战", "许褚"),
  weapon(28, 2, "七星刀", 3, 8, 1.8, 0.59, "每次攻击有10%几率触发流星雨", 4, "星"),
  weapon(29, 2, "青龙偃月刀", 4, 10, 2.2, 0.5, "武将每斩杀一个敌人，会释放数团刀气无差别攻击所有敌人；专属：关羽每次跳劈都会无差别释放刀气", 5, "月", "关羽"),
  weapon(30, 2, "方天画戟", 4, 10, 2.2, 0.5, "每次攻击有概率将敌人挑起扔在地上，造成5倍伤害，并砸倒一片敌人", 5, "画", "吕布"),
  weapon(31, 3, "短剑", 0, 1, 1, 0.7, "一把朴实无华的短剑", 1),
  weapon(32, 3, "长剑", 1, 2, 1, 0.7, "攻击距离+0.5", 2),
  weapon(33, 3, "铁剑", 1, 3, 1, 0.69, "攻击力+3", 2),
  weapon(34, 3, "巨阙剑", 2, 4, 2, 0.66, "每攻击十次触发君子剑或小人剑效果", 3),
  weapon(35, 3, "龙泉剑", 2, 5, 2, 0.62, "每攻击十次触发君子剑或小人剑效果", 3),
  weapon(36, 3, "龙渊剑", 3, 6, 2, 0.61, "每攻击十次触发君子剑或小人剑效果", 4, "渊"),
  weapon(37, 3, "双股剑", 3, 6, 2, 0.62, "每攻击十次触发君子剑或小人剑效果", 4, "股", "刘备"),
  weapon(38, 3, "青缸剑", 3, 7, 2, 0.6, "每攻击十次触发君子剑或小人剑效果", 4, "缸", "曹操"),
  weapon(39, 3, "七星剑", 3, 8, 2, 0.6, "每攻击十次触发君子剑或小人剑效果", 4, "星"),
  weapon(40, 3, "倚天剑", 4, 9, 2.5, 0.56, "每攻击十次触发君子剑或小人剑效果", 5, "倚"),
  weapon(41, 3, "莫邪", 4, 9, 2.5, 0.54, "每攻击十次触发君子剑或小人剑效果", 5, "邪"),
  weapon(42, 3, "干将", 4, 9, 2.5, 0.54, "每攻击十次触发君子剑或小人剑效果", 5, "干"),
  weapon(43, 3, "轩辕剑", 4, 10, 2.5, 0.51, "每攻击十次触发君子剑或小人剑效果", 5, "轩"),
] as const;

export const ADOU_WEAPON_BY_ID = Object.fromEntries(
  ADOU_WEAPON_DEFS.map((weaponDef) => [weaponDef.id, weaponDef]),
) as Record<number, AdouWeaponDefinition>;

export const ADOU_DEFAULT_GENERAL_WEAPONS: Record<string, number> = {
  刘备: 37,
  赵云: 19,
  关羽: 29,
  关平: 21,
  关兴: 21,
  马超: 17,
  张飞: 18,
  张苞: 11,
  张翼: 32,
  黄忠: 5,
  黄盖: 32,
  黄祖: 1,
};

export function getAdouWeapon(id: number) {
  return ADOU_WEAPON_BY_ID[id] ?? null;
}

export function getAdouWeaponsByType(type: AdouWeaponType) {
  return ADOU_WEAPON_DEFS.filter((weaponDef) => weaponDef.type === type);
}

export function isAdouWeaponTypeCompatible(
  weaponType: AdouWeaponType,
  weaponClass: AdouWeaponClass,
) {
  return weaponClass !== "cavalry" && weaponType === weaponClass;
}

export function isAdouWeaponCompatibleWithGeneral(
  general: Pick<AdouGeneralDefinition, "name" | "weaponClass">,
  weaponDef: AdouWeaponDefinition,
) {
  if (!isAdouWeaponTypeCompatible(weaponDef.type, general.weaponClass)) return false;
  return !weaponDef.exclusiveGeneralName || weaponDef.exclusiveGeneralName === general.name;
}

export function getDefaultAdouWeaponForGeneralName(generalName: string) {
  return getAdouWeapon(ADOU_DEFAULT_GENERAL_WEAPONS[generalName] ?? -1);
}
