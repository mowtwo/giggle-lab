export const ORIGINAL_DECK = [
  "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀",
  "刀", "刀", "刀", "刀", "刀", "刀", "刀",
  "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓",
  "弓", "弓", "弓", "弓", "弓",
  "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪",
  "枪", "枪", "枪", "枪",
  "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑",
  "骑", "骑", "骑",
  "铲", "铲", "铲", "铲", "铲", "铲", "铲", "铲", "铲", "铲", "铲",
  "刘", "赵", "赵", "云", "关", "羽", "平", "兴", "马", "马", "超", "张", "张", "飞",
  "苞", "翼", "黄", "黄", "忠", "盖", "祖", "备",
] as const;

export const ORIGINAL_BATTLE_RULES = {
  startingGold: 20,
  startingRefreshCost: 10,
  prepareMs: 10000,
  spawnIntervalMs: 1500,
  cooldownMs: 5000,
  maxWaves: 20,
  waveCounts: [
    10, 11, 12, 13, 15, 16, 18, 19, 21, 24, 26, 29, 31, 35, 38, 42,
    46, 51, 56, 61,
  ],
  bossRounds: [3, 6, 9, 12, 15, 18],
  bossProbabilities: [0.1, 0.2, 0.3, 0.5, 0.9, 1],
} as const;

export const ORIGINAL_AI_RULES = {
  startBonusGold: 10,
  bonusRounds: [3, 5, 8, 11, 14, 17],
  bonusGoldByDifficulty: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10],
    [20, 20, 20, 20, 20, 20],
  ],
  tickMsByDifficulty: [2000, 1500, 1000, 500],
  activePropChanceByDifficulty: [0.001, 0.001, 0.001, 0.001],
  routeDisruptionChanceByDifficulty: [0.1, 0.2, 0.5, 0.8],
  bossGuardChanceByDifficulty: [0, 0, 0, 5],
} as const;

export const ORIGINAL_ENEMY_RULES = {
  roundHpScale: [0.6, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8],
  mobKinds: [
    {
      hp: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315],
      speed: 50,
    },
    {
      hp: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315],
      speed: 50,
    },
    {
      hp: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315],
      speed: 50,
    },
    {
      hp: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315],
      speed: 50,
    },
  ],
  bossHpMultipliers: [1, 1.2, 1.4, 1.6, 1.8],
  enemyHpMultiplierPatterns: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.1, 1.2, 1.3, 1.2, 1.3, 1.7, 2, 1, 1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1.5, 1, 1.8, 2, 1, 1, 2, 1, 1, 1.3, 1, 1, 1.4, 1, 1, 1.5, 1, 1],
  ],
  enemyHpMultiplierWeights: [5, 2, 3],
} as const;

export const ORIGINAL_BOSS_RULES = [
  { hp: 7, speed: 10, range: 2, cooldown: 8, skillName: "摄魂", skillIntro: "使我方小兵陷入混乱，无法攻击", color: "#ed462f" },
  { hp: 10, speed: 10, range: 3, cooldown: 8, skillName: "招魂", skillIntro: "做法复活死亡的小兵", color: "#32ee3a" },
  { hp: 14, speed: 10, range: 2, cooldown: 10, skillName: "鼓舞", skillIntro: "激励身边单位，大幅提升血量和移速", color: "#27c8ff" },
  { hp: 7, speed: 10, range: 10, cooldown: 10, skillName: "拆迁", skillIntro: "将空白地块转化为不可用", color: "#f16fe1" },
  { hp: 10, speed: 10, range: 10, cooldown: 3, skillName: "巫山云雨", skillIntro: "战场下雨，降低所有单位攻速，升级可驱除", color: "#68b4ff" },
  { hp: 14, speed: 10, range: 10, cooldown: 10, skillName: "裙下之臣", skillIntro: "将最低等级的小兵纳入麾下", color: "#d9207a" },
  { hp: 7, speed: 10, range: 0, cooldown: 8, skillName: "铁骑号令", skillIntro: "召唤西凉骑兵", color: "#4db678" },
  { hp: 10, speed: 10, range: 2.5, cooldown: 10, skillName: "方天画戟", skillIntro: "挥动武器，大幅降低小兵等级并禁止合成", color: "#fb4c54" },
  { hp: 14, speed: 10, range: 1.5, cooldown: 10, skillName: "饕餮", skillIntro: "吞噬范围内小兵，获得血量加成并膨胀", color: "#7447a6" },
  { hp: 7, speed: 10, range: 2, cooldown: 15, skillName: "彻底疯狂", skillIntro: "冲阵击倒小兵，使其无法动弹，升级解除", color: "#fb2500" },
  { hp: 10, speed: 10, range: 2, cooldown: 8, skillName: "噬目", skillIntro: "视野变暗，难以看清局势", color: "#21b2ff" },
  { hp: 14, speed: 10, range: 10, cooldown: 15, skillName: "一代枭雄", skillIntro: "封印最高等级小兵，升级解除", color: "#010b97" },
] as const;

export const ORIGINAL_PROP_RULES = [
  { id: 0, name: "shovel", text: "铲子", intro: "一把可以开荒的铲子", fee: 999, cooldownMs: 0, rarity: 3 },
  { id: 1, name: "bulldozer", text: "推土车", intro: "将敌人向后推,阿斗安全无忧", fee: 999, cooldownMs: 0, rarity: 3 },
  { id: 2, name: "writingBrush", text: "毛笔", intro: "可以逆天改字", fee: 50, cooldownMs: 30000, rarity: 2 },
  { id: 3, name: "trainingSpell", text: "练兵符", intro: "拖到单位上有概率升一级或降一级", fee: 60, cooldownMs: 65000, rarity: 2 },
  { id: 4, name: "upLvlSpell", text: "神兵符", intro: "拖到单位上升一级", fee: 90, cooldownMs: 55000, rarity: 3 },
  { id: 5, name: "lifePill", text: "包子", intro: "55%概率给阿斗续一条命，45%概率减少一条命", fee: 50, cooldownMs: 90000, rarity: 1 },
  { id: 6, name: "longRange", text: "御敌千里", intro: "使远程单位攻击范围翻倍，全局生效", fee: 30, cooldownMs: 60000, rarity: 0 },
  { id: 7, name: "inkstone", text: "砚台", intro: "打翻砚台，泼出墨汁，使敌方部队攻速缓慢，持续5秒", fee: 30, cooldownMs: 90000, rarity: 0 },
  { id: 8, name: "trap", text: "陷阱", intro: "敌人掉下去一时会爬不出来", fee: 35, cooldownMs: 50000, rarity: 0 },
  { id: 9, name: "landmine", text: "地雷", intro: "可炸死敌人", fee: 50, cooldownMs: 55000, rarity: 1 },
  { id: 10, name: "attSpeedSpell", text: "攻速符", intro: "单位攻速+40%，全局生效", fee: 80, cooldownMs: 90000, rarity: 2 },
  { id: 11, name: "exorcismSpell", text: "降妖符", intro: "boss施法有50%失败率，并反噬boss自身血量", fee: 80, cooldownMs: -1, rarity: 2 },
] as const;
