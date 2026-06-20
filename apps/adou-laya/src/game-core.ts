import {
  packBossSlot,
  resetOriginalBattleFlow,
  startOriginalBattleFlow,
  updateOriginalBattleFlow,
} from "./original-port/battle-flow";
import {
  ORIGINAL_AI_RULES,
  ORIGINAL_BATTLE_RULES,
  ORIGINAL_BOSS_RULES,
  ORIGINAL_DECK,
  ORIGINAL_ENEMY_RULES,
} from "./original-port/rules";

export type Side = "player" | "ai";
export type GameStatus = "ready" | "playing" | "ended";
export type MapId = "yuncheng" | "jingyang" | "liangshan" | "bianliang";
export type CellKind = "plot" | "road" | "grass" | "blocked";
export type UnitArchetype =
  | "blade"
  | "bow"
  | "pike"
  | "cavalry"
  | "sword"
  | "farmer"
  | "civilian"
  | "general";
export type AttackStyle = "single" | "pierce" | "area" | "rapid";
export type TokenKind = "unit" | "name" | "prop";
export type WavePhase = "prepare" | "spawning" | "cooldown";
export type WeaponId =
  | "longBow"
  | "ironBow"
  | "hornBow"
  | "eagleBow"
  | "ironFetalBow"
  | "divineArmBow"
  | "overlordBow"
  | "sunsetBow"
  | "repeatingCrossbow"
  | "shortPike"
  | "longPike"
  | "ironPike"
  | "greatHalberd"
  | "hookSicklePike"
  | "steelPike"
  | "pearFlowerPike"
  | "tigerHeadPike"
  | "serpentPike"
  | "silverDragonPike"
  | "woodBlade"
  | "shortBlade"
  | "longBlade"
  | "ironBlade"
  | "wolfFangClub"
  | "tridentBlade"
  | "ironThornClub"
  | "ancientBlade"
  | "tigerBlade"
  | "sevenStarBlade"
  | "greenDragonBlade"
  | "skyPiercer"
  | "shortSword"
  | "longSword"
  | "ironSword"
  | "giantGateSword"
  | "dragonSpringSword"
  | "dragonAbyssSword"
  | "twinSword"
  | "greenSteelSword"
  | "sevenStarSword"
  | "heavenSword"
  | "moyeSword"
  | "ganjiangSword"
  | "xuanyuanSword";
export type WeaponClass = "bow" | "pike" | "blade" | "sword";
export type WeaponRarity = 0 | 1 | 2 | 3 | 4;
export type PropId =
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

export type PropSlot = {
  propId: PropId;
  cooldown: number;
  remaining: number;
};

export type PropDef = {
  text: string;
  cost: number;
  rarity: 0 | 1 | 2 | 3;
  target: "none" | "cell" | "unit" | "road" | "hand";
  description: string;
};

export type WeaponDef = {
  id: WeaponId;
  name: string;
  text: string;
  type: WeaponClass;
  description: string;
  rangeBonus: number;
  damageBonus: number;
  color: number;
};

export type WeaponCodexEntry = WeaponDef & {
  rarity: WeaponRarity;
};

export type WeaponAssignments = Partial<Record<string, WeaponId>>;

export type GameLoadout = {
  activeProps: PropId[];
  passiveProps: PropId[];
  weaponAssignments: WeaponAssignments;
};

type NormalizedLoadout = {
  activeProps: PropId[];
  passiveProps: PropId[];
  weaponAssignments: Record<string, WeaponId>;
};

export type GeneralCodexEntry = {
  id: string;
  display: string;
  parts: [string, string];
  archetype: UnitArchetype;
  style: AttackStyle;
  hp: number;
  damage: number;
  range: number;
  interval: number;
  maxLevel: 3 | 5;
  color: number;
  description: string;
  defaultWeaponId: WeaponId;
};

type RawTile = "0_0" | "0_1" | "1_0" | "1_1" | "2_0" | "2_1";
type Point = { col: number; row: number };

type RawMapDef = {
  id: MapId;
  name: string;
  subtitle: string;
  palette: MapDef["palette"];
  matrix: RawTile[][];
  playerStart: Point;
  playerEnd: Point;
  aiStart: Point;
  aiEnd: Point;
};

export type Tile = {
  col: number;
  row: number;
  kind: CellKind;
  owner: Side;
  tone: number;
};

export type MapDef = {
  id: MapId;
  name: string;
  subtitle: string;
  palette: {
    paper: number;
    plot: number;
    road: number;
    grass: number;
    blocked: number;
    player: number;
    ai: number;
  };
  matrix: RawTile[][];
  routes: Record<Side, Point[]>;
};

export type HandCard = {
  uid: number;
  kind: TokenKind;
  text: string;
  cost: number;
  rarity: 0 | 1 | 2 | 3;
  tier: number;
  parts: [string, string] | null;
  propId?: PropId;
};

export type Unit = {
  id: number;
  side: Side;
  text: string;
  parts: [string, string] | null;
  col: number;
  row: number;
  width: 1 | 2;
  tier: number;
  archetype: UnitArchetype;
  attackStyle: AttackStyle;
  weaponId: WeaponId | null;
  attackCount: number;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  interval: number;
  attackSpeedBoost: number;
  cooldown: number;
  incomeTimer: number;
  chaosTimer: number;
  knockdownTimer: number;
  lockTimer: number;
  pulse: number;
};

export type Enemy = {
  id: number;
  targetSide: Side;
  label: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  progress: number;
  radius: number;
  bossId?: number;
  skillTimer: number;
  stunTimer: number;
  burnTimer: number;
  speedMultiplier: number;
  pulse: number;
};

export type Trap = {
  id: number;
  side: Side;
  col: number;
  row: number;
  kind: "trap" | "landmine";
  damage: number;
  ttl: number;
};

export type VisualEffect = {
  id: number;
  type:
    | "hit"
    | "slash"
    | "arrow"
    | "merge"
    | "upgrade"
    | "smoke"
    | "gold"
    | "dig"
    | "boss"
    | "ink"
    | "fire"
    | "ice"
    | "seal";
  x: number;
  y: number;
  fromX?: number;
  fromY?: number;
  color: number;
  text?: string;
  ttl: number;
  maxTtl: number;
};

export type FloatText = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: number;
  ttl: number;
  maxTtl: number;
};

export type SongjiangAudioEvent =
  | { id: number; kind: "sound"; name: string }
  | { id: number; kind: "music"; name: string }
  | { id: number; kind: "stopMusic" };

export type SideRuntime = {
  hp: number;
  maxHp: number;
  hurtTimer: number;
  entryTimer: number;
  gold: number;
  refreshCost: number;
  hand: Array<HandCard | null>;
  deck: string[];
  aiTimer: number;
  rangeBonus: number;
  attackSpeedBonus: number;
  enemySlowTimer: number;
  mergeLockTimer: number;
  blindTimer: number;
  bossBackfire: number;
  activeProps: PropSlot[];
  passiveProps: PropId[];
  weaponSlots: WeaponId[];
  weaponAssignments: Record<string, WeaponId>;
  aiBonusRoundsClaimed: number[];
  aiActivePropTimer: number;
  recruitBonus: boolean;
  siltFactor: number;
  shovelGold: boolean;
  meteor: boolean;
  meteorTimer: number;
  superShovelTimer: number;
  promotionChance: number;
  bulldozerRoundUsed: number;
};

export type SongjiangDuelGameState = {
  status: GameStatus;
  winner: Side | null;
  elapsed: number;
  round: number;
  roundTimer: number;
  spawnTimer: number;
  wavePhase: WavePhase;
  waveTimer: number;
  waveSize: number;
  waveSpawned: number;
  bossSlots: Record<Side, number>;
  awaitingFirstPlacement: boolean;
  map: MapDef;
  tiles: Tile[];
  units: Unit[];
  enemies: Enemy[];
  traps: Trap[];
  effects: VisualEffect[];
  floatTexts: FloatText[];
  audioEvents: SongjiangAudioEvent[];
  side: Record<Side, SideRuntime>;
  enemyHpMultipliers: readonly number[];
  nextId: number;
  message: string;
};

export type PlayTarget =
  | { type: "cell"; col: number; row: number }
  | { type: "hand"; index: number }
  | { type: "none" };

export type PlayResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      reason:
        | "ended"
        | "notStarted"
        | "noCard"
        | "gold"
        | "target"
        | "occupied"
        | "mergeLocked"
        | "invalidProp";
      message: string;
    };

export const BOARD_COLS = 8;
export const BOARD_ROWS = 10;
export const HAND_SIZE = 5;
export const BASE_HP = 3;
export const ROUND_SECONDS = 24;

const SIDES: Side[] = ["player", "ai"];
const PREPARE_SECONDS = ORIGINAL_BATTLE_RULES.prepareMs / 1000;
const NON_CONSUMING_TOKENS = new Set<string>();

const RAW_MAPS: RawMapDef[] = [
  {
    id: "yuncheng",
    name: "长坂坡",
    subtitle: "乱军阵式",
    palette: {
      paper: 0xf1dfbf,
      plot: 0xe8d2a8,
      road: 0xb78c62,
      grass: 0xc3c38d,
      blocked: 0x6e6259,
      player: 0x2f74c0,
      ai: 0xb64b3d,
    },
    matrix: [
      ["0_1", "0_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0"],
      ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_0", "0_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
      ["0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "0_0", "0_0"],
    ],
    playerStart: { col: 0, row: 8 },
    playerEnd: { col: 7, row: 9 },
    aiStart: { col: 7, row: 1 },
    aiEnd: { col: 0, row: 0 },
  },
  {
    id: "jingyang",
    name: "荆州渡",
    subtitle: "水岸阵式",
    palette: {
      paper: 0xe7dec3,
      plot: 0xd6c497,
      road: 0xa38364,
      grass: 0x9ea666,
      blocked: 0x75685c,
      player: 0x2f766c,
      ai: 0xa4523a,
    },
    matrix: [
      ["0_1", "0_1", "0_1", "0_1", "0_1", "2_0", "0_0", "0_0", "0_0", "0_0"],
      ["2_1", "2_1", "2_1", "2_1", "0_1", "2_0", "0_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "2_1", "0_1", "2_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_1", "2_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "2_1", "0_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "2_1", "0_0", "2_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "0_1", "2_1", "0_0", "2_0", "2_0", "2_0", "2_0"],
      ["0_1", "0_1", "0_1", "0_1", "2_1", "0_0", "0_0", "0_0", "0_0", "0_0"],
    ],
    playerStart: { col: 0, row: 8 },
    playerEnd: { col: 7, row: 9 },
    aiStart: { col: 7, row: 1 },
    aiEnd: { col: 0, row: 0 },
  },
  {
    id: "liangshan",
    name: "虎牢关",
    subtitle: "夹道阵式",
    palette: {
      paper: 0xdfe4cf,
      plot: 0xc8d5b6,
      road: 0x8fae9f,
      grass: 0x86aa79,
      blocked: 0x627373,
      player: 0x287f9b,
      ai: 0xaf5034,
    },
    matrix: [
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["0_1", "0_1", "2_1", "2_1", "2_1", "2_0", "1_0", "1_0", "0_0", "2_0"],
      ["0_1", "2_1", "1_1", "1_1", "2_1", "2_0", "1_0", "1_0", "0_0", "0_0"],
      ["0_1", "0_1", "1_1", "1_1", "2_1", "2_0", "1_0", "1_0", "2_0", "0_0"],
      ["2_1", "0_1", "1_1", "1_1", "2_1", "2_0", "2_0", "2_0", "0_0", "0_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
    ],
    playerStart: { col: 0, row: 6 },
    playerEnd: { col: 7, row: 5 },
    aiStart: { col: 7, row: 3 },
    aiEnd: { col: 0, row: 4 },
  },
  {
    id: "bianliang",
    name: "赤壁",
    subtitle: "火攻阵式",
    palette: {
      paper: 0xe4ccc4,
      plot: 0xd6b49e,
      road: 0x9b7162,
      grass: 0x9aa071,
      blocked: 0x6d5550,
      player: 0x2d7090,
      ai: 0xbf3e31,
    },
    matrix: [
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["1_1", "1_1", "1_1", "2_1", "0_1", "0_0", "2_0", "1_0", "1_0", "1_0"],
      ["1_1", "1_1", "1_1", "2_1", "0_1", "0_0", "2_0", "1_0", "1_0", "1_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
    ],
    playerStart: { col: 0, row: 6 },
    playerEnd: { col: 7, row: 5 },
    aiStart: { col: 7, row: 3 },
    aiEnd: { col: 0, row: 4 },
  },
];

const STARTING_DECK = [...ORIGINAL_DECK];

const GENERAL_PAIRS: Record<
  string,
  {
    display: string;
    archetype: UnitArchetype;
    style: AttackStyle;
    hp: number;
    damage: number;
    range: number;
    interval: number;
    maxLevel: 3 | 5;
    color: number;
    description: string;
  }
> = {
  赵云: { display: "赵云", archetype: "general", style: "pierce", hp: 70, damage: 6, range: 2.5, interval: 0.8, maxLevel: 5, color: 0x58a7d8, description: "长枪突阵，穿透前排，适合守住阿斗面前的窄路。" },
  张飞: { display: "张飞", archetype: "general", style: "area", hp: 100, damage: 10, range: 2.5, interval: 1, maxLevel: 5, color: 0x2f2f2f, description: "高血量近战，范围震击，适合挡住敌军成群冲脸。" },
  马超: { display: "马超", archetype: "general", style: "single", hp: 92, damage: 10, range: 2.5, interval: 1, maxLevel: 5, color: 0xd7b45a, description: "骑将点杀，单体伤害高，适合处理精英和漏网敌军。" },
  关羽: { display: "关羽", archetype: "general", style: "area", hp: 90, damage: 8, range: 2.5, interval: 1, maxLevel: 5, color: 0x4aa465, description: "大刀横扫，兼顾输出和清群，是阿斗前线的稳定核心。" },
  黄忠: { display: "黄忠", archetype: "general", style: "pierce", hp: 58, damage: 6, range: 4.5, interval: 0.8, maxLevel: 5, color: 0xd6a143, description: "远射穿透，覆盖范围大，适合在后排提前削弱敌军。" },
  关平: { display: "关平", archetype: "general", style: "single", hp: 72, damage: 7, range: 2.5, interval: 1, maxLevel: 3, color: 0x6aa86f, description: "稳健刀将，成型快，适合补齐阿斗阵线空缺。" },
  关兴: { display: "关兴", archetype: "general", style: "single", hp: 72, damage: 7, range: 2.5, interval: 1, maxLevel: 3, color: 0x73b17a, description: "刀兵副将，升级成本低，适合早期守格和过渡。" },
  张苞: { display: "张苞", archetype: "general", style: "single", hp: 72, damage: 7, range: 2.5, interval: 1, maxLevel: 3, color: 0x8c7d6a, description: "枪兵副将，出手稳定，适合填补穿刺火力。" },
  张翼: { display: "张翼", archetype: "general", style: "single", hp: 72, damage: 7, range: 2.5, interval: 1, maxLevel: 3, color: 0x7b9fdd, description: "剑系副将，节奏灵活，适合搭配攻速和补刀。" },
  黄盖: { display: "黄盖", archetype: "general", style: "area", hp: 82, damage: 8, range: 2.5, interval: 1, maxLevel: 3, color: 0xd8782f, description: "范围压制型守将，适合处理贴近阿斗的密集敌军。" },
  刘备: { display: "刘备", archetype: "general", style: "single", hp: 86, damage: 10, range: 2.5, interval: 0.8, maxLevel: 5, color: 0xdccf63, description: "剑系主将，攻速快，适合在阿斗核心阵地持续输出。" },
  黄祖: { display: "黄祖", archetype: "general", style: "pierce", hp: 56, damage: 6, range: 3.5, interval: 0.8, maxLevel: 3, color: 0xc99a4b, description: "低成本远射，能在早期帮阿斗争取布阵时间。" },
};

export const BOSS_DEFS = [
  { name: "张角", skill: "摄魂", intro: "使我方小兵陷入混乱，无法攻击。", color: 0xbf6f35, hpScale: 7 },
  { name: "张梁", skill: "招魂", intro: "做法复活死亡的小兵。", color: 0x9d68d9, hpScale: 10 },
  { name: "董卓", skill: "鼓舞", intro: "激励身边单位，大幅提升血量和移速。", color: 0xd66b42, hpScale: 14 },
  { name: "曹操", skill: "拆迁", intro: "将空白地块转化为不可用。", color: 0xe27c9f, hpScale: 7 },
  { name: "甄宓", skill: "巫山云雨", intro: "战场下雨，降低所有单位攻速。", color: 0x67a8d9, hpScale: 10 },
  { name: "貂蝉", skill: "裙下之臣", intro: "将最低等级的小兵纳入麾下。", color: 0xc78645, hpScale: 14 },
  { name: "西凉军", skill: "铁骑号令", intro: "召唤快兵冲阵。", color: 0xe08f3c, hpScale: 7 },
  { name: "吕布", skill: "方天画戟", intro: "降低最高级单位等级并禁止合成。", color: 0xb5523a, hpScale: 10 },
  { name: "董卓", skill: "饕餮", intro: "吞噬周围单位，恢复血量并膨胀。", color: 0x8159bf, hpScale: 14 },
  { name: "夏侯惇", skill: "彻底疯狂", intro: "击倒数名单位，使其无法动弹。", color: 0xd74336, hpScale: 7 },
  { name: "夏侯惇", skill: "噬目", intro: "视野变暗，难以看清局势。", color: 0xd5b55b, hpScale: 10 },
  { name: "曹操", skill: "一代枭雄", intro: "封印最高等级小兵。", color: 0x4d8ed6, hpScale: 14 },
] as const;

export const PROP_DEFS: Record<PropId, PropDef> = {
  shovel: { text: "铲", cost: 999, rarity: 3, target: "cell", description: "开荒己方草地，把它变成可放兵的格子。" },
  bulldozer: { text: "车", cost: 999, rarity: 3, target: "none", description: "把逼近阿斗的敌军往回推一段距离。" },
  writingBrush: { text: "笔", cost: 50, rarity: 2, target: "hand", description: "拖到刷新栏，重写那一格文字。" },
  trainingSpell: { text: "练", cost: 60, rarity: 2, target: "unit", description: "拖到己方单位上尝试升级，失败时可能降级。" },
  upLvlSpell: { text: "神", cost: 90, rarity: 3, target: "unit", description: "拖到己方单位上稳定提升一级。" },
  lifePill: { text: "包", cost: 50, rarity: 1, target: "none", description: "给阿斗续命，有成功和失败两种结果。" },
  longRange: { text: "远", cost: 30, rarity: 0, target: "none", description: "临时扩大己方攻击范围，让远处敌军更早挨打。" },
  inkstone: { text: "砚", cost: 30, rarity: 0, target: "none", description: "泼墨减速，拖慢正在冲向阿斗的敌军。" },
  trap: { text: "坑", cost: 35, rarity: 0, target: "road", description: "放在己方道路上，踩中的敌军会被短暂控住。" },
  landmine: { text: "雷", cost: 50, rarity: 1, target: "road", description: "放在己方道路上，对踩中的敌军造成大量伤害。" },
  attSpeedSpell: { text: "速", cost: 80, rarity: 2, target: "unit", description: "拖到一个己方单位上，永久提升它的攻速。" },
  exorcismSpell: { text: "降", cost: 80, rarity: 2, target: "none", description: "干扰 Boss 施法，使它的技能有概率反噬。" },
  farmer: { text: "农", cost: 90, rarity: 2, target: "cell", description: "可放在己方地块或草地，持续产出馒头。" },
  recruit: { text: "贤", cost: 60, rarity: 1, target: "none", description: "提高武将字出现概率，更容易合出护卫阿斗的武将。" },
  allAttSpeedSpell: { text: "齐", cost: 60, rarity: 1, target: "none", description: "双方攻速都提升，适合己方阵容已经成型时冒险加速。" },
  goingHandInHand: { text: "进", cost: 90, rarity: 2, target: "none", description: "己方攻速提升更多，但敌方也会得到一点增益。" },
  xuMingPill: { text: "续", cost: 50, rarity: 0, target: "none", description: "双方都回血，阿斗获得更多生命。" },
  daBuPill: { text: "补", cost: 40, rarity: 0, target: "none", description: "直接恢复阿斗生命，适合危急时续住阵线。" },
  silt: { text: "泥", cost: 40, rarity: 0, target: "none", description: "让敌军道路泥泞，整体移动速度下降。" },
  superShovel: { text: "洛", cost: 120, rarity: 3, target: "none", description: "洛阳铲周期性补铲子，持续扩张阿斗阵地。" },
  meteor: { text: "陨", cost: 150, rarity: 3, target: "none", description: "危险敌军接近阿斗时，陨石会自动清场。" },
  trashCan: { text: "桶", cost: 150, rarity: 3, target: "hand", description: "拖到刷新栏，回收该格文字并返还馒头。" },
  promotionOrder: { text: "升", cost: 100, rarity: 1, target: "none", description: "新放下的单位有概率直接二级入场。" },
  marchPill: { text: "行", cost: 40, rarity: 0, target: "none", description: "立刻获得馒头，用来继续刷新和布阵。" },
  goldSeeker: { text: "摸", cost: 150, rarity: 3, target: "none", description: "之后用铲子开荒时额外挖出馒头。" },
};

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  longBow: {
    id: "longBow",
    name: "长弓",
    text: "弓",
    type: "bow",
    description: "攻击距离 +0.5",
    rangeBonus: 0.5,
    damageBonus: 0,
    color: 0x66c5ff,
  },
  ironBow: {
    id: "ironBow",
    name: "铁弓",
    text: "弓",
    type: "bow",
    description: "10% 概率击退",
    rangeBonus: 0,
    damageBonus: 0,
    color: 0x7dd8ff,
  },
  hornBow: {
    id: "hornBow",
    name: "角弓",
    text: "弓",
    type: "bow",
    description: "攻击同一个单位时，每攻击一次，攻速 +5%。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0x8ed7ff,
  },
  eagleBow: {
    id: "eagleBow",
    name: "射雕弓",
    text: "弓",
    type: "bow",
    description: "10% 概率打出一只缓慢飞行的老鹰，对沿途敌人造成 3 倍伤害。",
    rangeBonus: 1,
    damageBonus: 0,
    color: 0x8bc8ff,
  },
  ironFetalBow: {
    id: "ironFetalBow",
    name: "铁胎弓",
    text: "弓",
    type: "bow",
    description: "10% 概率打出一道火龙，点燃路径并持续造成伤害。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0x74bfff,
  },
  divineArmBow: {
    id: "divineArmBow",
    name: "神臂弓",
    text: "弓",
    type: "bow",
    description: "攻击同一个单位时，每攻击一次，攻速 +15%。",
    rangeBonus: 1,
    damageBonus: 1,
    color: 0x5ab4ff,
  },
  overlordBow: {
    id: "overlordBow",
    name: "霸王弓",
    text: "弓",
    type: "bow",
    description: "每击中一个单位，有 50% 概率弹射一次。",
    rangeBonus: 0,
    damageBonus: 3,
    color: 0xffc857,
  },
  sunsetBow: {
    id: "sunsetBow",
    name: "落日弓",
    text: "弓",
    type: "bow",
    description: "打出火凤凰；打得越远，凤凰越大，伤害越高。",
    rangeBonus: 1.5,
    damageBonus: 0,
    color: 0xff8e56,
  },
  repeatingCrossbow: {
    id: "repeatingCrossbow",
    name: "诸葛连弩",
    text: "弩",
    type: "bow",
    description: "每射击 10 次，会连续射出 10 支火箭。",
    rangeBonus: 0.5,
    damageBonus: 1,
    color: 0xe9f56a,
  },
  shortPike: {
    id: "shortPike",
    name: "短枪",
    text: "枪",
    type: "pike",
    description: "基础枪兵武器。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xb9edff,
  },
  longPike: {
    id: "longPike",
    name: "长枪",
    text: "枪",
    type: "pike",
    description: "攻击距离 +0.5",
    rangeBonus: 0.5,
    damageBonus: 0,
    color: 0x9fe9ff,
  },
  ironPike: {
    id: "ironPike",
    name: "铁枪",
    text: "枪",
    type: "pike",
    description: "首次攻击某个单位时，20% 概率从地下戳出枪阵，造成 3 倍伤害并短暂眩晕。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0x8ed8ec,
  },
  greatHalberd: {
    id: "greatHalberd",
    name: "大戟",
    text: "戟",
    type: "pike",
    description: "攻击距离 +1。",
    rangeBonus: 1,
    damageBonus: 0,
    color: 0xcfd3ff,
  },
  hookSicklePike: {
    id: "hookSicklePike",
    name: "钩镰枪",
    text: "枪",
    type: "pike",
    description: "首次攻击某个单位时，20% 概率使其跌倒 2 秒。",
    rangeBonus: 0,
    damageBonus: 0,
    color: 0x93e5c8,
  },
  steelPike: {
    id: "steelPike",
    name: "点钢枪",
    text: "枪",
    type: "pike",
    description: "每击杀一个敌人，攻速 +50%，持续 2 秒。",
    rangeBonus: 0,
    damageBonus: 3,
    color: 0xddeaff,
  },
  pearFlowerPike: {
    id: "pearFlowerPike",
    name: "梨花枪",
    text: "枪",
    type: "pike",
    description: "每击杀一个敌人，飞出 8 朵梨花随机打击敌人，沿途敌人也会受伤。",
    rangeBonus: 1,
    damageBonus: 1,
    color: 0xf6f3d8,
  },
  tigerHeadPike: {
    id: "tigerHeadPike",
    name: "虎头湛金枪",
    text: "枪",
    type: "pike",
    description: "首次攻击某个单位时，20% 概率从地下戳出 3 个枪阵；马超可触发 5 个。",
    rangeBonus: 0,
    damageBonus: 4,
    color: 0xffcf63,
  },
  serpentPike: {
    id: "serpentPike",
    name: "丈八蛇矛",
    text: "矛",
    type: "pike",
    description: "初始释放一条灵蛇拦路攻击敌人；武将每升一级会释放一条新灵蛇。",
    rangeBonus: 0.5,
    damageBonus: 4,
    color: 0xbfd2ff,
  },
  silverDragonPike: {
    id: "silverDragonPike",
    name: "龙胆亮银枪",
    text: "枪",
    type: "pike",
    description: "每次攻击有 10% 概率召唤飞枪，对所有敌人无差别打击；赵云触发概率为 5%。",
    rangeBonus: 1,
    damageBonus: 3,
    color: 0xb9f2ff,
  },
  woodBlade: {
    id: "woodBlade",
    name: "木刀",
    text: "刀",
    type: "blade",
    description: "基础刀兵武器",
    rangeBonus: 0,
    damageBonus: 0,
    color: 0xd0a86f,
  },
  shortBlade: {
    id: "shortBlade",
    name: "短刀",
    text: "刀",
    type: "blade",
    description: "基础短刀。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xf1c45d,
  },
  longBlade: {
    id: "longBlade",
    name: "长刀",
    text: "刀",
    type: "blade",
    description: "攻击距离 +0.5",
    rangeBonus: 0.5,
    damageBonus: 0,
    color: 0xffda63,
  },
  ironBlade: {
    id: "ironBlade",
    name: "铁刀",
    text: "刀",
    type: "blade",
    description: "攻击同一个单位时，每攻击一次，攻速 +5%。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0xe9d894,
  },
  wolfFangClub: {
    id: "wolfFangClub",
    name: "狼牙棒",
    text: "棒",
    type: "blade",
    description: "每次攻击有 10% 概率获得狼啸，提升周围单位 20% 攻速，持续 10 秒。",
    rangeBonus: 0,
    damageBonus: 3,
    color: 0xcfb381,
  },
  tridentBlade: {
    id: "tridentBlade",
    name: "三尖刀",
    text: "刀",
    type: "blade",
    description: "每攻击 10 次释放刀气，造成 2 倍群体伤害。",
    rangeBonus: 0.5,
    damageBonus: 2,
    color: 0xffdc86,
  },
  ironThornClub: {
    id: "ironThornClub",
    name: "铁蒺藜骨朵",
    text: "棒",
    type: "blade",
    description: "有 10% 概率造成眩晕。",
    rangeBonus: 0,
    damageBonus: 3,
    color: 0xd6d0a6,
  },
  ancientBlade: {
    id: "ancientBlade",
    name: "古锭刀",
    text: "刀",
    type: "blade",
    description: "首次攻击某单位可获得 1 个馒头。",
    rangeBonus: 0,
    damageBonus: 4,
    color: 0xf7b150,
  },
  tigerBlade: {
    id: "tigerBlade",
    name: "虎啸战刀",
    text: "刀",
    type: "blade",
    description: "每次攻击有 10% 概率获得虎啸，提升周围单位 30% 攻速，持续 10 秒。",
    rangeBonus: 0.5,
    damageBonus: 3,
    color: 0xffb347,
  },
  sevenStarBlade: {
    id: "sevenStarBlade",
    name: "七星刀",
    text: "刀",
    type: "blade",
    description: "每次攻击有 10% 概率触发流星雨，随机轰击敌人造成 2 倍范围伤害。",
    rangeBonus: 0,
    damageBonus: 5,
    color: 0xead6ff,
  },
  greenDragonBlade: {
    id: "greenDragonBlade",
    name: "青龙偃月刀",
    text: "刀",
    type: "blade",
    description: "武将斩杀敌人时释放刀气无差别攻击所有敌人；关羽跳劈也会释放。",
    rangeBonus: 1,
    damageBonus: 4,
    color: 0x79d98a,
  },
  skyPiercer: {
    id: "skyPiercer",
    name: "方天画戟",
    text: "戟",
    type: "blade",
    description: "每次攻击按等级概率挑起敌人，造成 5 倍伤害，并瞬杀血量低于 20% 的敌人。",
    rangeBonus: 1,
    damageBonus: 5,
    color: 0xff6b57,
  },
  shortSword: {
    id: "shortSword",
    name: "短剑",
    text: "剑",
    type: "sword",
    description: "基础短剑。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xaee8ff,
  },
  longSword: {
    id: "longSword",
    name: "长剑",
    text: "剑",
    type: "sword",
    description: "攻击距离 +0.5",
    rangeBonus: 0.5,
    damageBonus: 0,
    color: 0x9cdcff,
  },
  ironSword: {
    id: "ironSword",
    name: "铁剑",
    text: "剑",
    type: "sword",
    description: "攻击力 +3。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0xc4def4,
  },
  giantGateSword: {
    id: "giantGateSword",
    name: "巨阙剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xd4c6ff,
  },
  dragonSpringSword: {
    id: "dragonSpringSword",
    name: "龙泉剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xbdd7ff,
  },
  dragonAbyssSword: {
    id: "dragonAbyssSword",
    name: "龙渊剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xc7b5ff,
  },
  twinSword: {
    id: "twinSword",
    name: "双股剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑；双股剑固定偏向小人剑触发。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xaee8ff,
  },
  greenSteelSword: {
    id: "greenSteelSword",
    name: "青钢剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xb8f1ff,
  },
  sevenStarSword: {
    id: "sevenStarSword",
    name: "七星剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 1,
    color: 0xd0b6ff,
  },
  heavenSword: {
    id: "heavenSword",
    name: "倚天剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0xffa46e,
  },
  moyeSword: {
    id: "moyeSword",
    name: "莫邪",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0xffb275,
  },
  ganjiangSword: {
    id: "ganjiangSword",
    name: "干将",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 2,
    color: 0xffc16d,
  },
  xuanyuanSword: {
    id: "xuanyuanSword",
    name: "轩辕剑",
    text: "剑",
    type: "sword",
    description: "每 10 次攻击触发君子剑或小人剑，概率各 50%。刘备只触发君子剑，曹操只触发小人剑。",
    rangeBonus: 0,
    damageBonus: 3,
    color: 0xffd35f,
  },
};

export const WEAPON_RARITY_COLORS = [
  "#ffffff",
  "#85de85",
  "#94bcf7",
  "#b090f0",
  "#ffdd00",
] as const;

export const WEAPON_RARITY_NAMES = [
  "凡品",
  "良品",
  "精品",
  "奇品",
  "神品",
] as const;

export const WEAPON_TYPE_LABELS: Record<WeaponClass, string> = {
  bow: "弓",
  pike: "枪",
  blade: "刀",
  sword: "剑",
};

export const WEAPON_RARITIES: Record<WeaponId, WeaponRarity> = {
  longBow: 0,
  ironBow: 1,
  hornBow: 1,
  eagleBow: 2,
  ironFetalBow: 2,
  divineArmBow: 3,
  overlordBow: 4,
  sunsetBow: 4,
  repeatingCrossbow: 4,
  shortPike: 0,
  longPike: 1,
  ironPike: 1,
  greatHalberd: 2,
  hookSicklePike: 2,
  steelPike: 3,
  pearFlowerPike: 3,
  tigerHeadPike: 4,
  serpentPike: 4,
  silverDragonPike: 4,
  woodBlade: 0,
  shortBlade: 0,
  longBlade: 1,
  ironBlade: 1,
  wolfFangClub: 2,
  tridentBlade: 2,
  ironThornClub: 3,
  ancientBlade: 3,
  tigerBlade: 3,
  sevenStarBlade: 4,
  greenDragonBlade: 4,
  skyPiercer: 4,
  shortSword: 0,
  longSword: 1,
  ironSword: 1,
  giantGateSword: 2,
  dragonSpringSword: 2,
  dragonAbyssSword: 3,
  twinSword: 3,
  greenSteelSword: 3,
  sevenStarSword: 3,
  heavenSword: 4,
  moyeSword: 4,
  ganjiangSword: 4,
  xuanyuanSword: 4,
};

export function getWeaponRarity(weaponId: WeaponId) {
  return WEAPON_RARITIES[weaponId] ?? 0;
}

export function getWeaponRarityColor(weaponId: WeaponId) {
  return WEAPON_RARITY_COLORS[getWeaponRarity(weaponId)];
}

const NAME_TOKENS = new Set([
  "刘",
  "赵",
  "云",
  "关",
  "羽",
  "平",
  "兴",
  "马",
  "超",
  "张",
  "飞",
  "苞",
  "翼",
  "黄",
  "忠",
  "盖",
  "祖",
  "备",
]);
const DEFAULT_ACTIVE_PROPS: PropId[] = ["inkstone", "attSpeedSpell"];
const DEFAULT_PASSIVE_PROPS: PropId[] = [
  "farmer",
  "recruit",
  "promotionOrder",
  "superShovel",
  "goldSeeker",
];
const DEFAULT_WEAPON_SLOTS: WeaponId[] = [
  "longBow",
  "longPike",
  "longBlade",
  "twinSword",
];
const ACTIVE_PROP_COOLDOWNS: Partial<Record<PropId, number>> = {
  inkstone: 90,
  attSpeedSpell: 90,
};
const GENERAL_WEAPONS: Record<string, WeaponId> = {
  赵云: "longPike",
  张飞: "longPike",
  马超: "longPike",
  张苞: "longPike",
  关羽: "longBlade",
  关平: "longBlade",
  关兴: "longBlade",
  黄忠: "longBow",
  黄祖: "longBow",
  刘备: "twinSword",
  黄盖: "twinSword",
  张翼: "twinSword",
};

export const DEFAULT_GAME_LOADOUT: GameLoadout = {
  activeProps: [...DEFAULT_ACTIVE_PROPS],
  passiveProps: [...DEFAULT_PASSIVE_PROPS],
  weaponAssignments: { ...GENERAL_WEAPONS },
};

export function getGeneralCodex(): GeneralCodexEntry[] {
  return Object.entries(GENERAL_PAIRS).map(([id, def]) => ({
    id,
    ...def,
    parts: [id.charAt(0), id.charAt(1)] as [string, string],
    defaultWeaponId: GENERAL_WEAPONS[def.display] ?? "longPike",
  }));
}

export function getWeaponCodex(): WeaponCodexEntry[] {
  return Object.values(WEAPON_DEFS).map((weapon) => ({
    ...weapon,
    rarity: getWeaponRarity(weapon.id),
  }));
}

export function getCompatibleWeaponsForGeneral(generalText: string) {
  const defaultWeapon = WEAPON_DEFS[GENERAL_WEAPONS[generalText] ?? "longPike"];
  return Object.values(WEAPON_DEFS).filter((weapon) => weapon.type === defaultWeapon.type);
}

const ENEMY_HP = [
  10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917,
  5680, 8235, 11941, 17315,
];
const WAVE_COUNTS: number[] = [...ORIGINAL_BATTLE_RULES.waveCounts];
const BOSS_ROUNDS: number[] = [...ORIGINAL_BATTLE_RULES.bossRounds];
const BOSS_PROBABILITY: number[] = [...ORIGINAL_BATTLE_RULES.bossProbabilities];
const FARMER_INTERVALS = [20, 10, 5, 3, 2];
const TIER_DAMAGE_SCALE = [1, 1.5, 1.9, 2.2, 2.45];
const ORIGINAL_AI_DIFFICULTY = 2;

function opponent(side: Side): Side {
  return side === "player" ? "ai" : "player";
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function randomItem<T>(items: readonly T[], rng = Math.random) {
  return items[Math.floor(rng() * items.length)];
}

function weightedPick<T>(items: readonly T[], weights: readonly number[], rng = Math.random) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) return items[index] ?? items[0];
  }
  return items[items.length - 1] ?? items[0];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function tileKey(col: number, row: number) {
  return `${col}:${row}`;
}

function rawAt(matrix: RawTile[][], point: Point) {
  return matrix[point.col]?.[point.row] ?? null;
}

function findRoute(matrix: RawTile[][], code: "0_0" | "0_1", start: Point, end: Point) {
  const queue: Point[] = [start];
  const previous = new Map<string, string | null>([[tileKey(start.col, start.row), null]]);
  const points = new Map<string, Point>([[tileKey(start.col, start.row), start]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current.col === end.col && current.row === end.row) break;
    const next = [
      { col: current.col + 1, row: current.row },
      { col: current.col - 1, row: current.row },
      { col: current.col, row: current.row + 1 },
      { col: current.col, row: current.row - 1 },
    ];
    for (const point of next) {
      if (point.col < 0 || point.col >= BOARD_COLS || point.row < 0 || point.row >= BOARD_ROWS) continue;
      if (rawAt(matrix, point) !== code) continue;
      const key = tileKey(point.col, point.row);
      if (previous.has(key)) continue;
      previous.set(key, tileKey(current.col, current.row));
      points.set(key, point);
      queue.push(point);
    }
  }

  const endKey = tileKey(end.col, end.row);
  if (!previous.has(endKey)) return [start, end];

  const route: Point[] = [];
  let key: string | null = endKey;
  while (key) {
    const point = points.get(key);
    if (point) route.push(point);
    key = previous.get(key) ?? null;
  }
  return route.reverse();
}

function buildMap(raw: RawMapDef): MapDef {
  return {
    id: raw.id,
    name: raw.name,
    subtitle: raw.subtitle,
    palette: raw.palette,
    matrix: raw.matrix,
    routes: {
      player: findRoute(raw.matrix, "0_0", raw.playerStart, raw.playerEnd),
      ai: findRoute(raw.matrix, "0_1", raw.aiStart, raw.aiEnd),
    },
  };
}

const MAPS = Object.fromEntries(RAW_MAPS.map((map) => [map.id, buildMap(map)])) as Record<MapId, MapDef>;

function makeTiles(map: MapDef): Tile[] {
  const tiles: Tile[] = [];
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const raw = map.matrix[col][row];
      const kind: CellKind = raw.startsWith("0")
        ? "road"
        : raw.startsWith("1")
          ? "plot"
          : "grass";
      const owner: Side = raw.endsWith("_0") ? "player" : "ai";
      tiles.push({ col, row, kind, owner, tone: (col * 17 + row * 31) % 5 });
    }
  }
  return tiles;
}

export function getMapDefs() {
  return Object.values(MAPS);
}

export function getTile(state: SongjiangDuelGameState, col: number, row: number) {
  return state.tiles.find((tile) => tile.col === col && tile.row === row) ?? null;
}

export function getUnitAt(
  state: SongjiangDuelGameState,
  col: number,
  row: number,
): Unit | null {
  return (
    state.units.find(
      (unit) =>
        unit.row === row &&
        col >= unit.col &&
        col < unit.col + unit.width,
    ) ?? null
  );
}

export function getUnitAttackRange(state: SongjiangDuelGameState, unit: Unit) {
  const weapon = unit.weaponId ? WEAPON_DEFS[unit.weaponId] : null;
  return (unit.range + (weapon?.rangeBonus ?? 0)) * state.side[unit.side].rangeBonus;
}

export function getEnemyPoint(state: SongjiangDuelGameState, enemy: Enemy) {
  const route = state.map.routes[enemy.targetSide];
  const maxProgress = route.length - 1;
  const progress = clamp(enemy.progress, 0, maxProgress);
  const index = Math.floor(progress);
  const local = progress - index;
  const from = route[index];
  const to = route[Math.min(index + 1, maxProgress)];
  return {
    x: from.col + (to.col - from.col) * local + 0.5,
    y: from.row + (to.row - from.row) * local + 0.5,
  };
}

function uniqueProps(source: PropId[], fallback: PropId[], size: number) {
  const picked: PropId[] = [];
  for (const propId of [...source, ...fallback]) {
    if (!PROP_DEFS[propId] || picked.includes(propId)) continue;
    picked.push(propId);
    if (picked.length >= size) break;
  }
  return picked;
}

function normalizeWeaponAssignments(assignments: WeaponAssignments = {}) {
  const normalized: Record<string, WeaponId> = { ...GENERAL_WEAPONS };
  for (const [generalText, weaponId] of Object.entries(assignments)) {
    if (!weaponId || !WEAPON_DEFS[weaponId]) continue;
    normalized[generalText] = weaponId;
  }
  return normalized;
}

function normalizeLoadout(loadout?: GameLoadout): NormalizedLoadout {
  const activeProps = uniqueProps(loadout?.activeProps ?? [], DEFAULT_ACTIVE_PROPS, 2);
  const passiveProps = uniqueProps(loadout?.passiveProps ?? [], DEFAULT_PASSIVE_PROPS, 5);
  const weaponAssignments = normalizeWeaponAssignments(loadout?.weaponAssignments);
  return { activeProps, passiveProps, weaponAssignments };
}

function makeSideRuntime(loadout?: GameLoadout): SideRuntime {
  const normalized = normalizeLoadout(loadout);
  const weaponSlots = Array.from(new Set(Object.values(normalized.weaponAssignments)));
  const runtime: SideRuntime = {
    hp: BASE_HP,
    maxHp: BASE_HP,
    hurtTimer: 0,
    entryTimer: 1.25,
    gold: 0,
    refreshCost: ORIGINAL_BATTLE_RULES.startingRefreshCost,
    hand: Array.from({ length: HAND_SIZE }, (): HandCard | null => null),
    deck: [...STARTING_DECK],
    aiTimer: 0.6,
    rangeBonus: 1,
    attackSpeedBonus: 1,
    enemySlowTimer: 0,
    mergeLockTimer: 0,
    blindTimer: 0,
    bossBackfire: 0,
    activeProps: normalized.activeProps.map((propId) => ({
      propId,
      cooldown: ACTIVE_PROP_COOLDOWNS[propId] ?? 60,
      remaining: 0,
    })),
    passiveProps: [...normalized.passiveProps],
    weaponSlots: weaponSlots.length > 0 ? weaponSlots : [...DEFAULT_WEAPON_SLOTS],
    weaponAssignments: normalized.weaponAssignments,
    aiBonusRoundsClaimed: [],
    aiActivePropTimer: 0,
    recruitBonus: false,
    siltFactor: 1,
    shovelGold: false,
    meteor: false,
    meteorTimer: 0,
    superShovelTimer: 0,
    promotionChance: 0,
    bulldozerRoundUsed: 0,
  };
  applyPassiveLoadout(runtime);
  return runtime;
}

function applyPassiveLoadout(runtime: SideRuntime) {
  if (runtime.passiveProps.includes("farmer")) {
    runtime.deck.push("农", "农", "农");
  }
  if (runtime.passiveProps.includes("recruit")) {
    const nameTokens = runtime.deck.filter((token) => NAME_TOKENS.has(token));
    runtime.deck.push(...nameTokens);
    runtime.recruitBonus = true;
  }
  if (runtime.passiveProps.includes("promotionOrder")) {
    runtime.promotionChance = Math.max(runtime.promotionChance, 0.15);
  }
  if (runtime.passiveProps.includes("superShovel")) {
    runtime.superShovelTimer = 60;
  }
  if (runtime.passiveProps.includes("goldSeeker")) {
    runtime.shovelGold = true;
  }
  if (runtime.passiveProps.includes("longRange")) {
    runtime.rangeBonus = Math.max(runtime.rangeBonus, 1.25);
  }
  if (runtime.passiveProps.includes("allAttSpeedSpell")) {
    runtime.attackSpeedBonus += 0.08;
  }
  if (runtime.passiveProps.includes("goingHandInHand")) {
    runtime.attackSpeedBonus += 0.14;
  }
  if (runtime.passiveProps.includes("silt")) {
    runtime.siltFactor = Math.min(runtime.siltFactor, 0.94);
  }
  if (runtime.passiveProps.includes("meteor")) {
    runtime.meteor = true;
  }
  if (runtime.passiveProps.includes("daBuPill")) {
    runtime.maxHp += 1;
    runtime.hp += 1;
  }
  if (runtime.passiveProps.includes("marchPill")) {
    runtime.gold += 8;
  }
}

function nextUid(state: SongjiangDuelGameState) {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function queueSound(state: SongjiangDuelGameState, name: string) {
  state.audioEvents.push({ id: nextUid(state), kind: "sound", name });
}

function queueMusic(state: SongjiangDuelGameState, name: string) {
  state.audioEvents.push({ id: nextUid(state), kind: "music", name });
}

function queueStopMusic(state: SongjiangDuelGameState) {
  state.audioEvents.push({ id: nextUid(state), kind: "stopMusic" });
}

export function consumeSongjiangAudioEvents(state: SongjiangDuelGameState) {
  const events = [...state.audioEvents];
  state.audioEvents.length = 0;
  return events;
}

function battleMusicForMap(mapId: MapId) {
  return mapId === "jingyang" || mapId === "bianliang"
    ? "bg_battleScene_3"
    : "bg_battleScene_0";
}

function bossSkillSound(bossId: number) {
  const sounds = [
    "zhangJiao_skill_horn",
    "boss_sweep_skill",
    "dongZhuo_skill_phantom",
    "caoCao_skill_seal",
    "zhenFu_skill_rain",
    "diaoChan_skill_charm",
    "summon_cavalry_skill",
    "luBu_skill",
    "dongZhuo_skill_phase1_suck",
    "xiahouDun_skill_cloud",
    "xiahouDun_skill_lightning",
    "chain_lock",
  ] as const;
  return sounds[bossId] ?? "boss_sweep_skill";
}

function attackSoundForUnit(unit: Unit, weapon: WeaponDef | null) {
  if (unit.archetype === "bow" || weapon?.type === "bow") {
    return unit.width === 2 || weapon ? "general_bow_attack" : "bow_attack";
  }
  if (unit.archetype === "pike" || weapon?.type === "pike") return "general_pike_attack";
  if (unit.archetype === "cavalry") return "cavalry_attack";
  if (unit.archetype === "blade" || weapon?.type === "blade") return "knife_attack";
  if (weapon?.type === "sword") return "sword_attack";
  return "enemy_hit";
}

function drawToken(state: SongjiangDuelGameState, side: Side, rng = Math.random) {
  const deck = state.side[side].deck;
  if (deck.length === 0) return randomItem(["刀", "弓", "枪", "骑"], rng);
  const index = Math.floor(rng() * deck.length);
  const token = deck[index];
  if (!NON_CONSUMING_TOKENS.has(token)) deck.splice(index, 1);
  return token;
}

function cloneCard(card: HandCard): HandCard {
  return {
    ...card,
    parts: card.parts ? [...card.parts] : null,
  };
}

function cardTier(card: HandCard) {
  return Math.max(1, card.tier || 1);
}

function returnTokenToDeck(state: SongjiangDuelGameState, side: Side, token: string) {
  if (!token) return;
  state.side[side].deck.push(token);
}

function returnCardToDeck(state: SongjiangDuelGameState, side: Side, card: HandCard | null) {
  if (!card) return;
  if (card.parts) {
    returnTokenToDeck(state, side, card.parts[0]);
    returnTokenToDeck(state, side, card.parts[1]);
    return;
  }
  if (card.propId === "shovel") {
    returnTokenToDeck(state, side, "铲");
    return;
  }
  if (card.kind === "unit" || card.kind === "name") {
    returnTokenToDeck(state, side, card.text);
  }
}

function returnHandToDeck(state: SongjiangDuelGameState, side: Side) {
  for (const card of state.side[side].hand) returnCardToDeck(state, side, card);
}

function cardFromToken(state: SongjiangDuelGameState, token: string): HandCard {
  if (token === "铲") {
    const prop = PROP_DEFS.shovel;
    return {
      uid: nextUid(state),
      kind: "prop",
      text: prop.text,
      cost: prop.cost,
      rarity: prop.rarity,
      tier: 1,
      parts: null,
      propId: "shovel",
    };
  }
  if (token === "农") {
    return {
      uid: nextUid(state),
      kind: "unit",
      text: token,
      cost: 0,
      rarity: 2,
      tier: 1,
      parts: null,
    };
  }
  if (["刀", "弓", "枪", "骑"].includes(token)) {
    return {
      uid: nextUid(state),
      kind: "unit",
      text: token,
      cost: 0,
      rarity: 0,
      tier: 1,
      parts: null,
    };
  }
  return {
    uid: nextUid(state),
    kind: "name",
    text: token,
    cost: 0,
    rarity: 1,
    tier: 1,
    parts: null,
  };
}

function makeCard(
  state: SongjiangDuelGameState,
  side: Side,
  rng = Math.random,
): HandCard {
  return cardFromToken(state, drawToken(state, side, rng));
}

function fillRefreshSlots(
  state: SongjiangDuelGameState,
  side: Side,
  rng = Math.random,
) {
  state.side[side].hand = Array.from({ length: HAND_SIZE }, () => makeCard(state, side, rng));
}

export function createSongjiangDuelGame(
  mapId: MapId = "yuncheng",
  rng = Math.random,
  loadout?: GameLoadout,
): SongjiangDuelGameState {
  const map = MAPS[mapId];
  const state: SongjiangDuelGameState = {
    status: "ready",
    winner: null,
    elapsed: 0,
    round: 1,
    roundTimer: PREPARE_SECONDS,
    spawnTimer: 0,
    wavePhase: "prepare",
    waveTimer: PREPARE_SECONDS,
    waveSize: WAVE_COUNTS[0],
    waveSpawned: 0,
    bossSlots: { player: -1, ai: -1 },
    awaitingFirstPlacement: false,
    map,
    tiles: makeTiles(map),
    units: [],
    enemies: [],
    traps: [],
    effects: [],
    floatTexts: [],
    audioEvents: [],
    side: {
      player: makeSideRuntime(loadout),
      ai: makeSideRuntime(),
    },
    enemyHpMultipliers:
      weightedPick(
        ORIGINAL_ENEMY_RULES.enemyHpMultiplierPatterns,
        ORIGINAL_ENEMY_RULES.enemyHpMultiplierWeights,
        rng,
      ) ?? ORIGINAL_ENEMY_RULES.enemyHpMultiplierPatterns[0],
    nextId: 1,
    message: "配置武将与技能",
  };
  resetOriginalBattleFlow(state);
  return state;
}

export function restartSongjiangDuelGame(
  state: SongjiangDuelGameState,
  mapId: MapId = state.map.id,
  loadout?: GameLoadout,
) {
  const next = createSongjiangDuelGame(mapId, Math.random, loadout);
  Object.assign(state, next);
}

export function startSongjiangDuelGame(
  state: SongjiangDuelGameState,
  mapId: MapId = state.map.id,
  loadout?: GameLoadout,
) {
  restartSongjiangDuelGame(state, mapId, loadout);
  startOriginalBattleFlow(state);
  state.side.ai.gold += ORIGINAL_AI_RULES.startBonusGold;
  state.side.ai.aiTimer =
    ORIGINAL_AI_RULES.tickMsByDifficulty[ORIGINAL_AI_DIFFICULTY] / 1000;
  queueMusic(state, battleMusicForMap(state.map.id));
  queueSound(state, "match_drum");
}

function addEffect(
  state: SongjiangDuelGameState,
  type: VisualEffect["type"],
  x: number,
  y: number,
  color: number,
  text?: string,
  ttl = 0.5,
) {
  state.effects.push({
    id: nextUid(state),
    type,
    x,
    y,
    color,
    text,
    ttl,
    maxTtl: ttl,
  });
}

function addProjectileEffect(
  state: SongjiangDuelGameState,
  fromX: number,
  fromY: number,
  x: number,
  y: number,
  color: number,
  text: string,
  ttl = 0.9,
) {
  state.effects.push({
    id: nextUid(state),
    type: "arrow",
    x,
    y,
    fromX,
    fromY,
    color,
    text,
    ttl,
    maxTtl: ttl,
  });
}

function addFloat(
  state: SongjiangDuelGameState,
  x: number,
  y: number,
  text: string,
  color = 0xffffff,
  ttl = 0.85,
) {
  state.floatTexts.push({
    id: nextUid(state),
    x,
    y,
    text,
    color,
    ttl,
    maxTtl: ttl,
  });
}

function unitStatsForText(text: string, tier: number) {
  const general =
    GENERAL_PAIRS[text] ??
    Object.values(GENERAL_PAIRS).find((item) => item.display === text);
  const tierIndex = clamp(tier - 1, 0, TIER_DAMAGE_SCALE.length - 1);
  const scale = TIER_DAMAGE_SCALE[tierIndex];
  if (general) {
    return {
      archetype: general.archetype,
      attackStyle: general.style,
      hp: general.hp * scale,
      damage: general.damage * scale,
      range: general.range,
      interval: general.interval,
    };
  }

  if (text === "弓") {
    return {
      archetype: "bow" as const,
      attackStyle: "single" as const,
      hp: 34 * scale,
      damage: 2 * scale,
      range: 3.5,
      interval: 0.8,
    };
  }
  if (text === "枪") {
    return {
      archetype: "pike" as const,
      attackStyle: "pierce" as const,
      hp: 38 * scale,
      damage: 2 * scale,
      range: 2.5,
      interval: 0.8,
    };
  }
  if (text === "骑") {
    return {
      archetype: "cavalry" as const,
      attackStyle: "area" as const,
      hp: 46 * scale,
      damage: 2 * scale,
      range: 2,
      interval: 0.8,
    };
  }
  if (text === "农") {
    return {
      archetype: "farmer" as const,
      attackStyle: "single" as const,
      hp: 30 * scale,
      damage: 0,
      range: 0,
      interval: 1,
    };
  }
  if (text === "刀") {
    return {
      archetype: "blade" as const,
      attackStyle: "single" as const,
      hp: 42 * scale,
      damage: 3 * scale,
      range: 1.5,
      interval: 0.8,
    };
  }
  if (NAME_TOKENS.has(text)) {
    return {
      archetype: "civilian" as const,
      attackStyle: "single" as const,
      hp: 24 * scale,
      damage: 0,
      range: 0,
      interval: 1,
    };
  }
  return {
    archetype: "civilian" as const,
    attackStyle: "single" as const,
    hp: 24 * scale,
    damage: 1 * scale,
    range: 1.2,
    interval: 1.05,
  };
}

function maxTierForText(text: string) {
  const general =
    GENERAL_PAIRS[text] ??
    Object.values(GENERAL_PAIRS).find((item) => item.display === text);
  return general?.maxLevel ?? 5;
}

function refreshUnitStats(unit: Unit, heal = true) {
  const before = unit.maxHp;
  const stats = unitStatsForText(unit.text, unit.tier);
  unit.archetype = stats.archetype;
  unit.attackStyle = stats.attackStyle;
  unit.maxHp = stats.hp;
  unit.damage = stats.damage;
  unit.range = stats.range;
  unit.interval = stats.interval;
  if (heal) {
    unit.hp = unit.maxHp;
  } else {
    unit.hp = clamp(unit.hp + (unit.maxHp - before), 1, unit.maxHp);
  }
}

function createUnit(
  state: SongjiangDuelGameState,
  side: Side,
  text: string,
  col: number,
  row: number,
  tier = 1,
  allowPromotion = true,
): Unit {
  const promoted =
    allowPromotion && tier === 1 && Math.random() < state.side[side].promotionChance ? 2 : tier;
  const stats = unitStatsForText(text, promoted);
  return {
    id: nextUid(state),
    side,
    text,
    parts: null,
    col,
    row,
    width: 1,
    tier: promoted,
    archetype: stats.archetype,
    attackStyle: stats.attackStyle,
    weaponId: state.side[side].weaponAssignments[text] ?? GENERAL_WEAPONS[text] ?? null,
    attackCount: 0,
    hp: stats.hp,
    maxHp: stats.hp,
    damage: stats.damage,
    range: stats.range,
    interval: stats.interval,
    attackSpeedBoost: 1,
    cooldown: 0.2 + Math.random() * 0.4,
    incomeTimer: text === "农" ? 1 : 20,
    chaosTimer: 0,
    knockdownTimer: 0,
    lockTimer: 0,
    pulse: Math.random() * Math.PI * 2,
  };
}

function cardFromUnit(
  state: SongjiangDuelGameState,
  unit: Unit,
  text = unit.text,
  parts: [string, string] | null = unit.parts ? [...unit.parts] : null,
): HandCard {
  const isPart = !parts && NAME_TOKENS.has(text);
  return {
    uid: nextUid(state),
    kind: parts || isPart ? "name" : "unit",
    text,
    cost: 0,
    rarity: parts ? 2 : text === "农" ? 2 : isPart ? 1 : 0,
    tier: unit.tier,
    parts,
  };
}

function generalPartsFromText(generalText: string): [string, string] | null {
  const general = GENERAL_PAIRS[generalText];
  if (!general) return null;
  return [general.display.charAt(0), general.display.charAt(1)];
}

function findOrderedGeneralPair(a: string, b: string) {
  const direct = `${a}${b}`;
  if (GENERAL_PAIRS[direct]) return direct;
  return null;
}

function isNamePart(unit: Unit) {
  return unit.width === 1 && unit.parts === null && NAME_TOKENS.has(unit.text);
}

function mergeGeneralParts(
  state: SongjiangDuelGameState,
  left: Unit,
  right: Unit,
  generalText: string,
) {
  const general = GENERAL_PAIRS[generalText];
  left.text = general.display;
  left.parts = [generalText[0], generalText[1]];
  left.col = Math.min(left.col, right.col);
  left.row = right.row;
  left.width = 2;
  left.tier = Math.max(left.tier, right.tier);
  left.weaponId =
    state.side[left.side].weaponAssignments[general.display] ??
    GENERAL_WEAPONS[general.display] ??
    null;
  left.attackCount = 0;
  refreshUnitStats(left);
  state.units = state.units.filter((unit) => unit.id !== right.id);
  addEffect(state, "boss", left.col + 1, left.row + 0.5, general.color, general.display);
  queueSound(state, "merge_general");
  return left;
}

function tryMergeAdjacentGeneral(state: SongjiangDuelGameState, unit: Unit) {
  if (!isNamePart(unit)) return false;
  const left = state.units.find(
    (candidate) =>
      candidate.id !== unit.id &&
      candidate.side === unit.side &&
      isNamePart(candidate) &&
      candidate.col === unit.col - 1 &&
      candidate.row === unit.row,
  );
  if (left) {
    const generalText = findOrderedGeneralPair(left.text, unit.text);
    if (generalText) {
      mergeGeneralParts(state, left, unit, generalText);
      return true;
    }
  }

  const right = state.units.find(
    (candidate) =>
      candidate.id !== unit.id &&
      candidate.side === unit.side &&
      isNamePart(candidate) &&
      candidate.col === unit.col + 1 &&
      candidate.row === unit.row,
  );
  if (right) {
    const generalText = findOrderedGeneralPair(unit.text, right.text);
    if (generalText) {
      mergeGeneralParts(state, unit, right, generalText);
      return true;
    }
  }

  return false;
}

function replaceHandCard(state: SongjiangDuelGameState, side: Side, index: number) {
  returnCardToDeck(state, side, state.side[side].hand[index]);
  state.side[side].hand[index] = makeCard(state, side);
}

function markPlayerReady(state: SongjiangDuelGameState, side: Side) {
  if (side !== "player" || !state.awaitingFirstPlacement) return;
  state.awaitingFirstPlacement = false;
  state.waveTimer = PREPARE_SECONDS;
  state.roundTimer = PREPARE_SECONDS;
  state.message = "点击刷新征召士兵";
}

function bumpTier(existingTier: number, incomingTier: number, text: string) {
  return clamp(Math.max(existingTier + 1, incomingTier), 1, maxTierForText(text));
}

function dropCardOntoHand(
  state: SongjiangDuelGameState,
  side: Side,
  incoming: HandCard,
  targetIndex: number,
): PlayResult {
  const runtime = state.side[side];
  if (targetIndex < 0 || targetIndex >= HAND_SIZE) {
    return { ok: false, reason: "target", message: "没有这个刷新格" };
  }

  const target = runtime.hand[targetIndex];
  const card = cloneCard(incoming);
  if (!target) {
    runtime.hand[targetIndex] = card;
    queueSound(state, "soldier_set");
    return { ok: true, message: "拖回待选区" };
  }

  if (target.kind === "prop" || card.kind === "prop") {
    return { ok: false, reason: "occupied", message: "道具不能这样合成" };
  }

  if (target.parts && card.parts && target.text === card.text) {
    if (target.tier >= maxTierForText(target.text)) {
      return { ok: false, reason: "occupied", message: "武将已满级" };
    }
    target.tier = bumpTier(target.tier, cardTier(card), target.text);
    queueSound(state, "general_level_up");
    return { ok: true, message: `${target.text} 升级` };
  }

  if (target.parts && !card.parts && target.parts.includes(card.text)) {
    if (target.tier >= maxTierForText(target.text)) {
      return { ok: false, reason: "occupied", message: "武将已满级" };
    }
    target.tier = bumpTier(target.tier, cardTier(card), target.text);
    queueSound(state, "general_level_up");
    return { ok: true, message: `${target.text} 升级` };
  }

  if (card.parts && !target.parts && card.parts.includes(target.text)) {
    if (card.tier >= maxTierForText(card.text)) {
      return { ok: false, reason: "occupied", message: "武将已满级" };
    }
    card.tier = bumpTier(card.tier, cardTier(target), card.text);
    runtime.hand[targetIndex] = card;
    queueSound(state, "general_level_up");
    return { ok: true, message: `${card.text} 升级` };
  }

  if (!target.parts && !card.parts && target.kind === "name" && card.kind === "name") {
    if (target.text === card.text) {
      return { ok: false, reason: "occupied", message: "散字不能同字合并" };
    }
    const generalText =
      findOrderedGeneralPair(target.text, card.text) ??
      findOrderedGeneralPair(card.text, target.text);
    const parts = generalText ? generalPartsFromText(generalText) : null;
    if (!generalText || !parts) {
      return { ok: false, reason: "occupied", message: "这两个字不能成将" };
    }
    const general = GENERAL_PAIRS[generalText];
    runtime.hand[targetIndex] = {
      uid: nextUid(state),
      kind: "name",
      text: general.display,
      cost: 0,
      rarity: 2,
      tier: Math.max(cardTier(target), cardTier(card)),
      parts,
    };
    queueSound(state, "merge_general");
    return { ok: true, message: "两字成将" };
  }

  if (!target.parts && !card.parts && target.text === card.text && !NAME_TOKENS.has(target.text)) {
    if (target.tier >= maxTierForText(target.text)) {
      return { ok: false, reason: "occupied", message: "已满级" };
    }
    target.tier = bumpTier(target.tier, cardTier(card), target.text);
    queueSound(state, "soldier_merge_upgrade");
    return { ok: true, message: "同字升级" };
  }

  return { ok: false, reason: "occupied", message: "不同文字不能这样合成" };
}

export function moveHandCard(
  state: SongjiangDuelGameState,
  side: Side,
  fromIndex: number,
  toIndex: number,
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }
  if (fromIndex === toIndex) return { ok: true, message: "保持原位" };

  const runtime = state.side[side];
  const card = runtime.hand[fromIndex];
  if (!card) return { ok: false, reason: "noCard", message: "这个刷新格是空的" };

  const result = dropCardOntoHand(state, side, card, toIndex);
  if (!result.ok) return result;
  runtime.hand[fromIndex] = null;
  state.message = side === "player" ? result.message ?? "整理待选区" : state.message;
  return result;
}

export function returnUnitToHand(
  state: SongjiangDuelGameState,
  side: Side,
  unitId: number,
  targetIndex: number,
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }

  const unit = state.units.find((candidate) => candidate.id === unitId && candidate.side === side);
  if (!unit) return { ok: false, reason: "noCard", message: "这个单位不存在" };
  if (unit.knockdownTimer > 0 || unit.lockTimer > 0) {
    return { ok: false, reason: "mergeLocked", message: "单位暂时无法移动" };
  }

  const runtime = state.side[side];
  if (unit.width === 2 && unit.parts) {
    const preferred = [targetIndex, targetIndex + 1, targetIndex - 1];
    const slots: number[] = [];
    for (const index of preferred) {
      if (index >= 0 && index < HAND_SIZE && !runtime.hand[index] && !slots.includes(index)) {
        slots.push(index);
      }
    }
    for (let index = 0; index < HAND_SIZE && slots.length < 2; index += 1) {
      if (!runtime.hand[index] && !slots.includes(index)) slots.push(index);
    }
    if (slots.length < 2) {
      return { ok: false, reason: "occupied", message: "待选区需要两个空格拆将" };
    }
    runtime.hand[slots[0]] = cardFromUnit(state, unit, unit.parts[0], null);
    runtime.hand[slots[1]] = cardFromUnit(state, unit, unit.parts[1], null);
    state.units = state.units.filter((candidate) => candidate.id !== unit.id);
    addEffect(state, "smoke", unit.col + 1, unit.row + 0.5, 0xffffff, "拆");
    queueSound(state, "soldier_set");
    state.message = side === "player" ? "拆将回栏" : state.message;
    return { ok: true, message: "拆将回栏" };
  }

  const card = cardFromUnit(state, unit);
  const result = dropCardOntoHand(state, side, card, targetIndex);
  if (!result.ok) return result;
  state.units = state.units.filter((candidate) => candidate.id !== unit.id);
  addEffect(state, "smoke", unit.col + unit.width / 2, unit.row + 0.5, 0xffffff, "收");
  queueSound(state, "soldier_set");
  state.message = side === "player" ? result.message ?? "拖回待选区" : state.message;
  return result;
}

function fail(reason: never): never {
  throw new Error(String(reason));
}

function canUseUnitCardOnTile(side: Side, card: HandCard, tile: Tile | null) {
  if (!tile || tile.owner !== side) return false;
  if (card.text === "农") return tile.kind === "plot" || tile.kind === "grass";
  return tile.kind === "plot";
}

function canUnitStandOnTile(side: Side, unit: Unit, tile: Tile | null) {
  if (!tile || tile.owner !== side) return false;
  if (unit.archetype === "farmer" || unit.text === "农") {
    return tile.kind === "plot" || tile.kind === "grass";
  }
  return tile.kind === "plot";
}

function getBlockingUnit(
  state: SongjiangDuelGameState,
  unit: Unit,
  col: number,
  row: number,
  ignoredIds = new Set<number>(),
) {
  if (col < 0 || col + unit.width > BOARD_COLS || row < 0 || row >= BOARD_ROWS) {
    return null;
  }
  for (let offset = 0; offset < unit.width; offset += 1) {
    const blocker = getUnitAt(state, col + offset, row);
    if (blocker && !ignoredIds.has(blocker.id)) return blocker;
  }
  return null;
}

function canUnitOccupy(
  state: SongjiangDuelGameState,
  unit: Unit,
  col: number,
  row: number,
  ignoredIds = new Set<number>(),
) {
  if (col < 0 || col + unit.width > BOARD_COLS || row < 0 || row >= BOARD_ROWS) return false;
  for (let offset = 0; offset < unit.width; offset += 1) {
    if (!canUnitStandOnTile(unit.side, unit, getTile(state, col + offset, row))) return false;
  }
  return !getBlockingUnit(state, unit, col, row, ignoredIds);
}

function isSameUnitCell(unit: Unit, col: number, row: number) {
  return unit.row === row && col >= unit.col && col < unit.col + unit.width;
}

export function moveUnit(
  state: SongjiangDuelGameState,
  side: Side,
  unitId: number,
  target: Point,
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }

  const unit = state.units.find((candidate) => candidate.id === unitId && candidate.side === side);
  if (!unit) return { ok: false, reason: "noCard", message: "这个单位不存在" };
  if (unit.knockdownTimer > 0 || unit.lockTimer > 0) {
    return { ok: false, reason: "mergeLocked", message: "单位暂时无法移动" };
  }

  if (isSameUnitCell(unit, target.col, target.row)) {
    state.message = side === "player" ? "显示攻击范围" : state.message;
    return { ok: true, message: "显示攻击范围" };
  }

  const ignored = new Set<number>([unit.id]);
  const blocker = getBlockingUnit(state, unit, target.col, target.row, ignored);

  if (blocker) {
    if (blocker.side !== side) {
      return { ok: false, reason: "occupied", message: "不能移动到敌方单位上" };
    }
    if (state.side[side].mergeLockTimer > 0 || blocker.lockTimer > 0) {
      return { ok: false, reason: "mergeLocked", message: "暂时无法合成" };
    }

    if (unit.width === 1 && blocker.width === 2 && blocker.parts?.includes(unit.text)) {
      if (blocker.tier >= maxTierForText(blocker.text)) {
        return { ok: false, reason: "occupied", message: "武将已满级" };
      }
      blocker.tier = bumpTier(blocker.tier, unit.tier, blocker.text);
      refreshUnitStats(blocker);
      state.units = state.units.filter((candidate) => candidate.id !== unit.id);
      addEffect(state, "upgrade", blocker.col + 1, blocker.row + 0.5, 0xffe35b, `Lv.${blocker.tier}`);
      queueSound(state, "general_level_up");
      markPlayerReady(state, side);
      state.message = side === "player" ? `${blocker.text} 升级` : state.message;
      return { ok: true, message: `${blocker.text} 升级` };
    }

    if (
      unit.width === 1 &&
      blocker.width === 1 &&
      unit.text === blocker.text &&
      !NAME_TOKENS.has(unit.text) &&
      blocker.tier < maxTierForText(blocker.text)
    ) {
      blocker.tier = bumpTier(blocker.tier, unit.tier, blocker.text);
      refreshUnitStats(blocker);
      state.units = state.units.filter((candidate) => candidate.id !== unit.id);
      addEffect(state, "upgrade", blocker.col + 0.5, blocker.row + 0.5, 0xffe35b, `Lv.${blocker.tier}`);
      queueSound(state, "soldier_merge_upgrade");
      markPlayerReady(state, side);
      state.message = side === "player" ? "同字升级" : state.message;
      return { ok: true, message: "同字升级" };
    }

    const canSwap =
      unit.width === 1 &&
      blocker.width === 1 &&
      canUnitOccupy(state, unit, target.col, target.row, new Set([unit.id, blocker.id])) &&
      canUnitOccupy(state, blocker, unit.col, unit.row, new Set([unit.id, blocker.id]));

    if (canSwap) {
      const source = { col: unit.col, row: unit.row };
      unit.col = blocker.col;
      unit.row = blocker.row;
      blocker.col = source.col;
      blocker.row = source.row;
      addEffect(state, "merge", unit.col + 0.5, unit.row + 0.5, 0xffe066, unit.text);
      queueSound(state, "soldier_set");
      markPlayerReady(state, side);
      state.message = side === "player" ? "调换位置" : state.message;
      return { ok: true, message: "调换位置" };
    }

    return { ok: false, reason: "occupied", message: "这里已有单位" };
  }

  if (!canUnitOccupy(state, unit, target.col, target.row, ignored)) {
    return {
      ok: false,
      reason: "target",
      message: unit.text === "农" ? "农民不能移动到这里" : "士兵不能移动到这里",
    };
  }

  unit.col = target.col;
  unit.row = target.row;
  const merged = tryMergeAdjacentGeneral(state, unit);
  addEffect(state, "merge", target.col + unit.width / 2, target.row + 0.5, 0xffe066, unit.text);
  if (!merged) queueSound(state, "soldier_set");
  markPlayerReady(state, side);
  state.message = side === "player" ? (merged ? "两字成将" : "移动布阵") : state.message;
  return { ok: true, message: merged ? "两字成将" : "移动布阵" };
}

function playUnitCard(
  state: SongjiangDuelGameState,
  side: Side,
  card: HandCard,
  target: PlayTarget,
): PlayResult {
  if (target.type !== "cell") {
    return { ok: false, reason: "target", message: "把文字拖到己方格子" };
  }

  const tile = getTile(state, target.col, target.row);
  if (card.parts) {
    const unit = createUnit(state, side, card.text, target.col, target.row, cardTier(card), false);
    unit.parts = [...card.parts];
    unit.width = 2;
    unit.weaponId =
      state.side[side].weaponAssignments[card.text] ??
      GENERAL_WEAPONS[card.text] ??
      null;
    refreshUnitStats(unit);
    if (!canUnitOccupy(state, unit, target.col, target.row)) {
      return { ok: false, reason: "target", message: "武将需要横向两个己方空格" };
    }
    state.units.push(unit);
    addEffect(state, "boss", target.col + 1, target.row + 0.5, GENERAL_PAIRS[card.text]?.color ?? 0xffe066, card.text);
    queueSound(state, "merge_general");
    if (card.text === "赵云") queueSound(state, "zhaoYun_voice_entrance");
    markPlayerReady(state, side);
    return { ok: true, message: "武将入阵" };
  }

  if (!canUseUnitCardOnTile(side, card, tile)) {
    return {
      ok: false,
      reason: "target",
      message: card.text === "农" ? "农民不能放到路上或对方区域" : "士兵不能放到该格子",
    };
  }

  const existing = getUnitAt(state, target.col, target.row);
  if (!existing) {
    const unit = createUnit(state, side, card.text, target.col, target.row, cardTier(card));
    state.units.push(unit);
    const merged = tryMergeAdjacentGeneral(state, unit);
    addEffect(state, "merge", target.col + 0.5, target.row + 0.5, 0xffe066, card.text);
    if (!merged) queueSound(state, "soldier_set");
    markPlayerReady(state, side);
    return { ok: true, message: merged ? "两字成将" : "落字成兵" };
  }

  if (existing.side !== side) {
    return { ok: false, reason: "occupied", message: "这个格子已有敌方单位" };
  }

  if (state.side[side].mergeLockTimer > 0 || existing.lockTimer > 0) {
    return { ok: false, reason: "mergeLocked", message: "暂时无法合成" };
  }

  if (existing.width === 2 && existing.parts?.includes(card.text)) {
    if (existing.tier >= maxTierForText(existing.text)) {
      return { ok: false, reason: "occupied", message: "武将已满级" };
    }
    existing.tier = bumpTier(existing.tier, cardTier(card), existing.text);
    refreshUnitStats(existing);
    addEffect(state, "upgrade", existing.col + 1, existing.row + 0.5, 0xffe35b, `Lv.${existing.tier}`);
    queueSound(state, "general_level_up");
    markPlayerReady(state, side);
    return { ok: true, message: `${existing.text} 升级` };
  }

  if (
    existing.width === 1 &&
    existing.text === card.text &&
    !NAME_TOKENS.has(existing.text) &&
    existing.tier < maxTierForText(existing.text)
  ) {
    existing.tier = bumpTier(existing.tier, cardTier(card), existing.text);
    refreshUnitStats(existing);
    addEffect(state, "upgrade", existing.col + 0.5, existing.row + 0.5, 0xffe35b, `Lv.${existing.tier}`);
    queueSound(state, "soldier_merge_upgrade");
    markPlayerReady(state, side);
    return { ok: true, message: "同字升级" };
  }

  if (NAME_TOKENS.has(card.text) && isNamePart(existing)) {
    return { ok: false, reason: "occupied", message: "武将字需要放在相邻空格" };
  }

  return { ok: false, reason: "occupied", message: "不同文字不能这样合成" };
}

function playPropCard(
  state: SongjiangDuelGameState,
  side: Side,
  card: HandCard,
  target: PlayTarget,
): PlayResult {
  if (!card.propId) return { ok: false, reason: "invalidProp", message: "道具无效" };
  const propId = card.propId;
  const runtime = state.side[side];
  const other = state.side[opponent(side)];

  if (propId === "shovel") {
    if (target.type !== "cell") return { ok: false, reason: "target", message: "铲子需要拖到未开荒格" };
    const tile = getTile(state, target.col, target.row);
    if (!tile || tile.owner !== side || tile.kind !== "grass" || getUnitAt(state, target.col, target.row)) {
      return { ok: false, reason: "target", message: "只能开荒己方空白未开荒格" };
    }
    tile.kind = "plot";
    addEffect(state, "dig", target.col + 0.5, target.row + 0.5, 0xf3d27a, "铲", 0.75);
    if (runtime.shovelGold) runtime.gold += 12;
    queueSound(state, runtime.shovelGold ? "shovel_treasure_box" : "shovel_use");
    markPlayerReady(state, side);
    return { ok: true, message: runtime.shovelGold ? "摸金开荒" : "开荒成功" };
  }

  if (propId === "farmer") {
    const unitCard: HandCard = { ...card, kind: "unit", text: "农", tier: cardTier(card), parts: null };
    return playUnitCard(state, side, unitCard, target);
  }

  if (propId === "trainingSpell" || propId === "upLvlSpell") {
    if (target.type !== "cell") return { ok: false, reason: "target", message: "符纸需要拖到己方单位" };
    const unit = getUnitAt(state, target.col, target.row);
    if (!unit || unit.side !== side || unit.archetype === "farmer") {
      return { ok: false, reason: "target", message: "这里没有可升级的己方士兵" };
    }
    if (propId === "trainingSpell" && Math.random() < 0.28 && unit.tier > 1) {
      unit.tier -= 1;
      refreshUnitStats(unit, false);
      addEffect(state, "ice", unit.col + 0.5, unit.row + 0.5, 0x70c9ff, "降");
      queueSound(state, "talisman_burn");
      return { ok: true, message: "练兵失手，降了一级" };
    }
    unit.tier = clamp(unit.tier + 1, 1, maxTierForText(unit.text));
    refreshUnitStats(unit);
    addEffect(state, "upgrade", unit.col + 0.5, unit.row + 0.5, 0xffe84c, "升");
    queueSound(state, "general_level_up");
    markPlayerReady(state, side);
    return { ok: true, message: "单位升级" };
  }

  if (propId === "trap" || propId === "landmine") {
    if (target.type !== "cell") return { ok: false, reason: "target", message: "需要放到己方道路上" };
    const tile = getTile(state, target.col, target.row);
    if (!tile || tile.kind !== "road" || tile.owner !== side) {
      return { ok: false, reason: "target", message: "只能放在己方道路" };
    }
    state.traps.push({
      id: nextUid(state),
      side,
      col: target.col,
      row: target.row,
      kind: propId,
      damage: propId === "landmine" ? ENEMY_HP[clamp(state.round - 1, 0, ENEMY_HP.length - 1)] * 2 : 0,
      ttl: propId === "landmine" ? 90 : 30,
    });
    addEffect(state, "seal", target.col + 0.5, target.row + 0.5, propId === "landmine" ? 0xff593d : 0x111111, propId === "landmine" ? "雷" : "坑");
    queueSound(state, "shovel_use");
    markPlayerReady(state, side);
    return { ok: true, message: propId === "landmine" ? "埋下地雷" : "挖好陷阱" };
  }

  if (propId === "writingBrush") {
    if (target.type !== "hand") return { ok: false, reason: "target", message: "毛笔要拖到一格刷新栏" };
    replaceHandCard(state, side, target.index);
    addEffect(state, "ink", 3.5, side === "player" ? 9.4 : 0.6, 0x111111, "改");
    queueSound(state, "talisman_burn");
    queueSound(state, "soldier_create");
    return { ok: true, message: "逆天改字" };
  }

  if (propId === "trashCan") {
    if (target.type !== "hand") return { ok: false, reason: "target", message: "垃圾桶要拖到一格刷新栏" };
    if (!state.side[side].hand[target.index]) {
      return { ok: false, reason: "target", message: "这个刷新格是空的" };
    }
    runtime.gold += 1;
    state.side[side].hand[target.index] = null;
    queueSound(state, "mantou_add");
    return { ok: true, message: "回收文字，馒头 +1" };
  }

  if (propId === "bulldozer") {
    for (const enemy of state.enemies) {
      if (enemy.targetSide === side) enemy.progress = Math.max(0, enemy.progress - 1.6);
    }
    addEffect(state, "smoke", 4, side === "player" ? 7.5 : 2.5, 0xffffff, "推");
    queueSound(state, "bulldozer_land");
    queueSound(state, "bulldozer_push");
    return { ok: true, message: "推土车出动" };
  }

  if (propId === "lifePill") {
    if (Math.random() < 0.55) {
      runtime.hp = clamp(runtime.hp + 1, 0, runtime.maxHp + 1);
      addFloat(state, 7.5, side === "player" ? 9.5 : 0.5, "+1", 0x66e275);
      queueSound(state, "mantou_add");
      return { ok: true, message: "包子续命成功" };
    }
    runtime.hp -= 1;
    runtime.hurtTimer = Math.max(runtime.hurtTimer, 0.55);
    addFloat(state, 7.5, side === "player" ? 9.5 : 0.5, "-1", 0xff5b55);
    queueSound(state, "adou_hit");
    return { ok: true, message: "包子续命失败" };
  }

  if (propId === "longRange") {
    runtime.rangeBonus = Math.max(runtime.rangeBonus, 2);
    queueSound(state, "holyBlade_skill");
    return { ok: true, message: "远程范围翻倍" };
  }

  if (propId === "inkstone") {
    runtime.enemySlowTimer = Math.max(runtime.enemySlowTimer, 5);
    addEffect(state, "ink", 4, side === "player" ? 7.2 : 2.8, 0x111111, "墨");
    queueSound(state, "skill_ink_splash");
    return { ok: true, message: "墨汁减速" };
  }

  if (propId === "attSpeedSpell") {
    if (target.type !== "cell") return { ok: false, reason: "target", message: "加速符需要拖到己方单位" };
    const unit = getUnitAt(state, target.col, target.row);
    if (!unit || unit.side !== side || unit.archetype === "farmer") {
      return { ok: false, reason: "target", message: "这里没有可加速的己方单位" };
    }
    unit.attackSpeedBoost += 0.4;
    addEffect(state, "upgrade", unit.col + unit.width / 2, unit.row + 0.5, 0xffe35b, "速");
    queueSound(state, "general_level_up");
    return { ok: true, message: `${unit.text} 攻速提升` };
  }

  if (propId === "exorcismSpell") {
    runtime.bossBackfire = Math.max(runtime.bossBackfire, 0.5);
    queueSound(state, "skill_ink_splash");
    return { ok: true, message: "Boss 施法可能反噬" };
  }

  if (propId === "recruit") {
    runtime.recruitBonus = true;
    for (const token of [...runtime.deck]) {
      if (NAME_TOKENS.has(token)) runtime.deck.push(token);
    }
    queueSound(state, "lottery");
    return { ok: true, message: "武将字概率提升" };
  }

  if (propId === "allAttSpeedSpell") {
    runtime.attackSpeedBonus += 0.1;
    other.attackSpeedBonus += 0.1;
    queueSound(state, "general_level_up");
    return { ok: true, message: "双方攻速提升" };
  }

  if (propId === "goingHandInHand") {
    runtime.attackSpeedBonus += 0.5;
    other.attackSpeedBonus += 0.3;
    queueSound(state, "general_level_up");
    return { ok: true, message: "齐头并进" };
  }

  if (propId === "xuMingPill") {
    runtime.hp = clamp(runtime.hp + 5, 0, runtime.maxHp + 5);
    other.hp = clamp(other.hp + 3, 0, other.maxHp + 3);
    queueSound(state, "mantou_add");
    return { ok: true, message: "双方续命，我方更多" };
  }

  if (propId === "daBuPill") {
    runtime.hp = clamp(runtime.hp + 3, 0, runtime.maxHp + 3);
    queueSound(state, "mantou_add");
    return { ok: true, message: "阿斗稳住了" };
  }

  if (propId === "silt") {
    runtime.siltFactor = Math.min(runtime.siltFactor, 0.9);
    queueSound(state, "skill_ink_splash");
    return { ok: true, message: "道路泥泞，敌军减速" };
  }

  if (propId === "superShovel") {
    runtime.superShovelTimer = 60;
    queueSound(state, "shovel_treasure_box");
    return { ok: true, message: "洛阳铲开始产铲" };
  }

  if (propId === "meteor") {
    runtime.meteor = true;
    runtime.meteorTimer = 0;
    queueSound(state, "meteor_fall");
    return { ok: true, message: "陨石守护阿斗" };
  }

  if (propId === "promotionOrder") {
    runtime.promotionChance = Math.max(runtime.promotionChance, 0.15);
    queueSound(state, "general_level_up");
    return { ok: true, message: "新兵有概率二级入场" };
  }

  if (propId === "marchPill") {
    runtime.gold += 10;
    addFloat(state, 4, side === "player" ? 9.5 : 0.5, "+10", 0xffd34d);
    queueSound(state, "mantou_add");
    return { ok: true, message: "体力转化为馒头" };
  }

  if (propId === "goldSeeker") {
    runtime.shovelGold = true;
    queueSound(state, "shovel_treasure_box");
    return { ok: true, message: "铲子会挖出宝箱" };
  }

  fail(propId);
}

export function playHandCard(
  state: SongjiangDuelGameState,
  side: Side,
  index: number,
  target: PlayTarget,
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }

  const card = state.side[side].hand[index];
  if (!card) return { ok: false, reason: "noCard", message: "这个刷新格是空的" };

  const wasAwaitingFirstPlacement = state.awaitingFirstPlacement;
  const result =
    card.kind === "prop"
      ? playPropCard(state, side, card, target)
      : playUnitCard(state, side, card, target);
  if (!result.ok) return result;

  state.side[side].hand[index] = null;
  if (side === "player") {
    state.message =
      wasAwaitingFirstPlacement && !state.awaitingFirstPlacement
        ? "点击刷新征召士兵"
        : result.message ?? "行动完成";
  }
  return result;
}

export function rerollHand(
  state: SongjiangDuelGameState,
  side: Side,
  rng = Math.random,
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }
  const runtime = state.side[side];
  const cost = runtime.refreshCost;
  if (runtime.gold < cost) {
    queueSound(state, "popup_notification");
    return { ok: false, reason: "gold", message: "馒头不足" };
  }
  runtime.gold -= cost;
  runtime.refreshCost += 2;
  returnHandToDeck(state, side);
  fillRefreshSlots(state, side, rng);
  queueSound(state, "open_deck");
  queueSound(state, "soldier_create");
  state.message = side === "player" ? "刷新五格" : state.message;
  return { ok: true, message: "刷新五格" };
}

function activateSideProp(
  state: SongjiangDuelGameState,
  side: Side,
  index: number,
  target: PlayTarget = { type: "none" },
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }
  const runtime = state.side[side];
  const slot = runtime.activeProps[index];
  if (!slot) return { ok: false, reason: "invalidProp", message: "主动技能无效" };
  if (slot.remaining > 0) {
    return {
      ok: false,
      reason: "invalidProp",
      message: `冷却中 ${Math.ceil(slot.remaining)} 秒`,
    };
  }
  const prop = PROP_DEFS[slot.propId];
  const result = playPropCard(
    state,
    side,
    {
      uid: nextUid(state),
      kind: "prop",
      text: prop.text,
      cost: 0,
      rarity: prop.rarity,
      tier: 1,
      parts: null,
      propId: slot.propId,
    },
    target,
  );
  if (!result.ok) return result;
  slot.remaining = slot.cooldown;
  if (side === "player") state.message = result.message ?? "主动技能";
  return result;
}

export function useActiveProp(
  state: SongjiangDuelGameState,
  side: Side,
  index: number,
  target: PlayTarget = { type: "none" },
): PlayResult {
  return activateSideProp(state, side, index, target);
}

export function useBulldozerAssist(
  state: SongjiangDuelGameState,
  side: Side,
): PlayResult {
  if (state.status === "ready") {
    return { ok: false, reason: "notStarted", message: "本局尚未开始" };
  }
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }
  const runtime = state.side[side];
  if (runtime.bulldozerRoundUsed === state.round) {
    return { ok: false, reason: "invalidProp", message: "推车本回合已经用过" };
  }
  runtime.bulldozerRoundUsed = state.round;
  for (const enemy of state.enemies) {
    if (enemy.targetSide === side) enemy.progress = Math.max(0, enemy.progress - 1.6);
  }
  addEffect(state, "smoke", 4, side === "player" ? 7.5 : 2.5, 0xffffff, "推");
  queueSound(state, "bulldozer_land");
  queueSound(state, "bulldozer_push");
  state.message = side === "player" ? "推车出动" : state.message;
  return { ok: true, message: "推车出动" };
}

export function endSongjiangDuelGame(
  state: SongjiangDuelGameState,
  winner: Side | null = "ai",
): PlayResult {
  if (state.status === "ended") {
    return { ok: false, reason: "ended", message: "本局已经结束" };
  }
  state.status = "ended";
  state.winner = winner;
  state.message = winner === "ai" ? "主动结束对局" : "对局结束";
  queueStopMusic(state);
  queueSound(state, winner === "player" ? "game_win" : "game_lose");
  return { ok: true, message: "主动结束对局" };
}

function bossIdForRound(state: SongjiangDuelGameState) {
  const bossIndex = BOSS_ROUNDS.indexOf(state.round);
  if (bossIndex < 0 || Math.random() > BOSS_PROBABILITY[bossIndex]) return undefined;
  const mapIndex = getMapDefs().findIndex((map) => map.id === state.map.id);
  return clamp(mapIndex * 3 + (bossIndex % 3), 0, BOSS_DEFS.length - 1);
}

function spawnEnemy(state: SongjiangDuelGameState, targetSide: Side, bossId?: number, label?: string) {
  const roundIndex = clamp(state.round - 1, 0, ENEMY_HP.length - 1);
  const baseHp = ENEMY_HP[roundIndex];
  const isBoss = bossId !== undefined;
  const boss = isBoss ? BOSS_DEFS[bossId] : null;
  const bossRule = bossId === undefined ? null : ORIGINAL_BOSS_RULES[bossId];
  const hpMultiplier = state.enemyHpMultipliers[roundIndex] ?? 1;
  const hp = isBoss ? baseHp * (bossRule?.hp ?? boss?.hpScale ?? 8) : baseHp * hpMultiplier;
  const originalMobSpeed = ORIGINAL_ENEMY_RULES.mobKinds[0].speed;
  const mobSpeed = 0.62;
  const speed =
    isBoss && bossRule
      ? mobSpeed * (bossRule.speed / originalMobSpeed)
      : mobSpeed;
  state.enemies.push({
    id: nextUid(state),
    targetSide,
    label: label ?? (isBoss ? boss?.name ?? "将" : randomItem(["兵", "卒", "贼", "盾", "骑"])),
    hp,
    maxHp: hp,
    damage: 1,
    speed,
    progress: 0,
    radius: isBoss ? 0.42 : 0.28,
    bossId,
    skillTimer: isBoss ? Math.max(3.5, bossRule?.cooldown ?? 8) : 999,
    stunTimer: 0,
    burnTimer: 0,
    speedMultiplier: 1,
    pulse: Math.random() * Math.PI * 2,
  });
  if (isBoss) queueSound(state, "boss_entrance");
}

function nearestTargets(
  state: SongjiangDuelGameState,
  side: Side,
  unit: Unit,
  range: number,
) {
  const origin = { x: unit.col + 0.5, y: unit.row + 0.5 };
  return state.enemies
    .filter((enemy) => enemy.targetSide === side)
    .map((enemy) => ({ enemy, pos: getEnemyPoint(state, enemy) }))
    .filter((entry) => distance(origin, entry.pos) <= range)
    .sort((a, b) => b.enemy.progress - a.enemy.progress);
}

function attackWithUnit(state: SongjiangDuelGameState, unit: Unit) {
  const runtime = state.side[unit.side];
  const weapon = unit.weaponId ? WEAPON_DEFS[unit.weaponId] : null;
  const range = getUnitAttackRange(state, unit);
  const targets = nearestTargets(state, unit.side, unit, range);
  if (targets.length === 0) return;

  const first = targets[0];
  const damage = unit.damage + (weapon?.damageBonus ?? 0);
  const origin = { x: unit.col + unit.width / 2, y: unit.row + 0.5 };
  unit.attackCount += 1;
  queueSound(
    state,
    weapon?.id === "twinSword" && unit.attackCount % 10 === 0
      ? "swords_clash"
      : attackSoundForUnit(unit, weapon),
  );

  if (weapon?.id === "ironBow" && Math.random() < 0.1) {
    first.enemy.progress = Math.max(0, first.enemy.progress - 0.35);
    addFloat(state, first.pos.x, first.pos.y, "退", 0x9fe9ff);
  }

  if (weapon?.id === "twinSword" && unit.attackCount % 10 === 0) {
    for (const entry of targets.slice(0, 5)) {
      entry.enemy.hp -= damage * 1.6;
      addProjectileEffect(state, origin.x, origin.y, entry.pos.x, entry.pos.y, weapon.color, "sword", 0.55);
    }
    addEffect(state, "slash", first.pos.x, first.pos.y, weapon.color, "剑气");
  } else if (unit.attackStyle === "area") {
    for (const entry of targets.slice(0, 4)) {
      if (distance(first.pos, entry.pos) <= 0.9) entry.enemy.hp -= damage;
    }
    addEffect(state, "slash", first.pos.x, first.pos.y, weapon?.color ?? 0xf6ce46, weapon?.text);
  } else if (unit.attackStyle === "pierce") {
    for (const entry of targets.slice(0, 3)) entry.enemy.hp -= damage;
    addProjectileEffect(
      state,
      origin.x,
      origin.y,
      first.pos.x,
      first.pos.y,
      weapon?.color ?? 0x9fe9ff,
      weapon?.type === "pike" || unit.archetype === "pike" ? "pike" : "sword",
    );
  } else if (unit.archetype === "bow" || weapon?.type === "bow") {
    first.enemy.hp -= damage;
    addProjectileEffect(
      state,
      origin.x,
      origin.y,
      first.pos.x,
      first.pos.y,
      weapon?.color ?? 0x9fe9ff,
      "弓",
    );
  } else {
    first.enemy.hp -= damage;
    addEffect(
      state,
      unit.archetype === "blade" || weapon?.type === "blade" ? "slash" : "hit",
      first.pos.x,
      first.pos.y,
      weapon?.color ?? 0xffffff,
      weapon?.text,
    );
  }

  unit.cooldown = Math.max(0.18, unit.interval / (runtime.attackSpeedBonus * unit.attackSpeedBoost));
  if (unit.archetype !== "bow") addEffect(state, "hit", origin.x, origin.y, 0xffffff);
}

function applyBossSkill(state: SongjiangDuelGameState, enemy: Enemy) {
  if (enemy.bossId === undefined) return;
  const side = enemy.targetSide;
  const runtime = state.side[side];
  const boss = BOSS_DEFS[enemy.bossId];
  const pos = getEnemyPoint(state, enemy);

  if (runtime.bossBackfire > 0 && Math.random() < runtime.bossBackfire) {
    enemy.hp -= enemy.maxHp * 0.08;
    addEffect(state, "seal", pos.x, pos.y, 0xffe04b, "反噬");
    state.message = `${boss.name} 施法失败`;
    return;
  }

  const units = state.units.filter((unit) => unit.side === side);
  const lowest = [...units].sort((a, b) => a.tier - b.tier)[0];
  const highest = [...units].sort((a, b) => b.tier - a.tier)[0];
  state.message = `${boss.name}：${boss.skill}`;
  addEffect(state, "boss", pos.x, pos.y, boss.color, boss.skill, 0.9);
  queueSound(state, bossSkillSound(enemy.bossId));

  switch (enemy.bossId) {
    case 0:
      for (const unit of units.slice(0, 3)) unit.chaosTimer = Math.max(unit.chaosTimer, 5);
      break;
    case 1:
      spawnEnemy(state, side, undefined, "魂");
      spawnEnemy(state, side, undefined, "魂");
      break;
    case 2:
      for (const mob of state.enemies.filter((e) => e.targetSide === side)) {
        mob.hp = Math.min(mob.maxHp * 1.4, mob.hp + mob.maxHp * 0.35);
        mob.speedMultiplier = Math.max(mob.speedMultiplier, 1.28);
      }
      break;
    case 3: {
      const empty = state.tiles.filter(
        (tile) =>
          tile.owner === side &&
          tile.kind === "plot" &&
          !getUnitAt(state, tile.col, tile.row),
      );
      const tile = randomItem(empty);
      if (tile) tile.kind = "blocked";
      break;
    }
    case 4:
      runtime.attackSpeedBonus = Math.max(0.55, runtime.attackSpeedBonus - 0.24);
      break;
    case 5:
      if (lowest) {
        state.units = state.units.filter((unit) => unit.id !== lowest.id);
        spawnEnemy(state, side, undefined, "叛");
        addFloat(state, lowest.col + 0.5, lowest.row + 0.5, "魅", 0xff7bd5);
      }
      break;
    case 6:
      spawnEnemy(state, side, undefined, "骑");
      spawnEnemy(state, side, undefined, "骑");
      spawnEnemy(state, side, undefined, "骑");
      break;
    case 7:
      if (highest) {
        highest.tier = Math.max(1, highest.tier - 1);
        highest.lockTimer = Math.max(highest.lockTimer, 8);
        refreshUnitStats(highest, false);
      }
      runtime.mergeLockTimer = Math.max(runtime.mergeLockTimer, 6);
      break;
    case 8:
      for (const unit of units) {
        if (Math.abs(unit.col + 0.5 - pos.x) + Math.abs(unit.row + 0.5 - pos.y) < 2.3) {
          enemy.hp = Math.min(enemy.maxHp * 1.35, enemy.hp + unit.maxHp * 0.45);
          state.units = state.units.filter((u) => u.id !== unit.id);
        }
      }
      enemy.radius = Math.min(0.62, enemy.radius + 0.05);
      break;
    case 9:
      for (const unit of units.slice(0, 3)) unit.knockdownTimer = Math.max(unit.knockdownTimer, 5.5);
      break;
    case 10:
      runtime.blindTimer = Math.max(runtime.blindTimer, 8);
      break;
    case 11:
      if (highest) highest.lockTimer = Math.max(highest.lockTimer, 9);
      break;
    default:
      break;
  }
}

function updateTraps(state: SongjiangDuelGameState, dt: number) {
  for (const trap of state.traps) trap.ttl -= dt;
  for (const trap of [...state.traps]) {
    if (trap.ttl <= 0) continue;
    for (const enemy of state.enemies) {
      if (enemy.targetSide !== trap.side) continue;
      const pos = getEnemyPoint(state, enemy);
      if (Math.abs(pos.x - (trap.col + 0.5)) < 0.35 && Math.abs(pos.y - (trap.row + 0.5)) < 0.35) {
        if (trap.kind === "trap") {
          enemy.stunTimer = Math.max(enemy.stunTimer, 2.6);
          addEffect(state, "smoke", pos.x, pos.y, 0x111111, "坑");
          queueSound(state, "trap_trigger");
        } else {
          enemy.hp -= trap.damage;
          addEffect(state, "fire", pos.x, pos.y, 0xff4a2f, "雷");
          queueSound(state, "landmine_explode");
        }
        trap.ttl = 0;
        break;
      }
    }
  }
  state.traps = state.traps.filter((trap) => trap.ttl > 0);
}

function updateEnemies(state: SongjiangDuelGameState, dt: number) {
  for (const enemy of state.enemies) {
    enemy.pulse += dt * 4;
    enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
    enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
    enemy.skillTimer -= dt;

    if (enemy.bossId !== undefined && enemy.skillTimer <= 0) {
      applyBossSkill(state, enemy);
      enemy.skillTimer = ORIGINAL_BOSS_RULES[enemy.bossId]?.cooldown ?? 8;
    }

    if (enemy.stunTimer <= 0) {
      const runtime = state.side[enemy.targetSide];
      const slow = runtime.enemySlowTimer > 0 ? 0.42 : 1;
      enemy.progress += enemy.speed * enemy.speedMultiplier * runtime.siltFactor * slow * dt;
    }
  }

  for (const enemy of [...state.enemies]) {
    const routeEnd = state.map.routes[enemy.targetSide].length - 1;
    if (enemy.progress >= routeEnd) {
      const runtime = state.side[enemy.targetSide];
      runtime.hp -= enemy.damage;
      runtime.hurtTimer = Math.max(runtime.hurtTimer, 0.55);
      addFloat(state, 7.6, enemy.targetSide === "player" ? 6.1 : 3.9, `-${enemy.damage}`, 0xff4d42);
      queueSound(state, "enemy_knife_attack");
      queueSound(state, "adou_hit");
      state.enemies = state.enemies.filter((e) => e.id !== enemy.id);
    }
  }

  for (const enemy of state.enemies.filter((enemy) => enemy.hp <= 0)) {
    const pos = getEnemyPoint(state, enemy);
    addEffect(state, "smoke", pos.x, pos.y, enemy.bossId === undefined ? 0xffffff : BOSS_DEFS[enemy.bossId].color, enemy.bossId === undefined ? undefined : "破");
    const reward = enemy.bossId === undefined ? 1 : 10;
    state.side[enemy.targetSide].gold += reward;
    queueSound(state, "enemy_dead");
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function farmerInterval(state: SongjiangDuelGameState, unit: Unit) {
  const tile = getTile(state, unit.col, unit.row);
  if (tile?.kind === "plot") return 1;
  return FARMER_INTERVALS[clamp(unit.tier - 1, 0, FARMER_INTERVALS.length - 1)];
}

function updateUnits(state: SongjiangDuelGameState, dt: number) {
  for (const unit of state.units) {
    unit.pulse += dt * 3;
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    unit.chaosTimer = Math.max(0, unit.chaosTimer - dt);
    unit.knockdownTimer = Math.max(0, unit.knockdownTimer - dt);
    unit.lockTimer = Math.max(0, unit.lockTimer - dt);

    if (unit.archetype === "farmer") {
      unit.incomeTimer -= dt;
      if (unit.incomeTimer <= 0) {
        const interval = farmerInterval(state, unit);
        unit.incomeTimer += interval;
        state.side[unit.side].gold += 1;
        addEffect(state, "gold", unit.col + 0.5, unit.row + 0.5, 0xffd85a, "+1");
      }
      continue;
    }

    if (unit.cooldown <= 0 && unit.chaosTimer <= 0 && unit.knockdownTimer <= 0 && unit.damage > 0) {
      attackWithUnit(state, unit);
    }
  }
}

function updateSideTimers(state: SongjiangDuelGameState, dt: number) {
  for (const side of SIDES) {
    const runtime = state.side[side];
    runtime.enemySlowTimer = Math.max(0, runtime.enemySlowTimer - dt);
    runtime.hurtTimer = Math.max(0, runtime.hurtTimer - dt);
    runtime.entryTimer = Math.max(0, runtime.entryTimer - dt);
    runtime.mergeLockTimer = Math.max(0, runtime.mergeLockTimer - dt);
    runtime.blindTimer = Math.max(0, runtime.blindTimer - dt);
    runtime.meteorTimer = Math.max(0, runtime.meteorTimer - dt);
    for (const slot of runtime.activeProps) {
      slot.remaining = Math.max(0, slot.remaining - dt);
    }

    if (runtime.superShovelTimer > 0) {
      runtime.superShovelTimer -= dt;
      if (runtime.superShovelTimer <= 0) {
        const empty = runtime.hand.findIndex((card) => card === null);
        const index = empty >= 0 ? empty : Math.floor(Math.random() * HAND_SIZE);
        runtime.hand[index] = cardFromToken(state, "铲");
        runtime.superShovelTimer = 60;
        queueSound(state, "shovel_treasure_box");
      }
    }

    if (runtime.meteor && runtime.meteorTimer <= 0) {
      const routeEnd = state.map.routes[side].length - 1;
      const danger = state.enemies.find(
        (enemy) => enemy.targetSide === side && enemy.progress > routeEnd - 1.25,
      );
      if (danger) {
        const pos = getEnemyPoint(state, danger);
        danger.hp = 0;
        runtime.meteorTimer = 14;
        addEffect(state, "fire", pos.x, pos.y, 0xffcf44, "陨");
        queueSound(state, "meteor_fall");
      }
    }
  }
}

function routeWindowDistance(state: SongjiangDuelGameState, tile: Tile, side: Side) {
  const route = state.map.routes[side];
  if (route.length === 0) return 99;
  const start = Math.floor(route.length * 0.15);
  const end = Math.max(start + 1, Math.ceil(route.length * 0.85));
  let best = 99;
  for (let index = start; index < end; index += 1) {
    const point = route[index];
    if (!point) continue;
    best = Math.min(best, Math.abs(tile.col - point.col) + Math.abs(tile.row - point.row));
  }
  return best;
}

function routeAdjacencyScore(state: SongjiangDuelGameState, tile: Tile, side: Side) {
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  return offsets.reduce((score, [dc, dr]) => {
    const near = getTile(state, tile.col + dc, tile.row + dr);
    return near?.owner === side && near.kind === "road" ? score + 1 : score;
  }, 0);
}

function aiThreatLevel(state: SongjiangDuelGameState) {
  const routeEnd = Math.max(1, state.map.routes.ai.length - 1);
  const enemies = state.enemies.filter((enemy) => enemy.targetSide === "ai");
  if (enemies.length === 0) return 0;
  const maxProgress = Math.max(...enemies.map((enemy) => enemy.progress / routeEnd));
  return maxProgress + Math.min(0.5, enemies.length / 12);
}

function aiTileScore(state: SongjiangDuelGameState, tile: Tile, card: HandCard) {
  const adjacentRoads = routeAdjacencyScore(state, tile, "ai");
  const windowDistance = routeWindowDistance(state, tile, "ai");
  const centerBias = -Math.abs(tile.col - 3.5) * 0.4 - Math.abs(tile.row - 3.5) * 0.2;
  const routeScore = adjacentRoads * 16 - windowDistance * 3 + centerBias;

  if (card.text === "农") {
    return routeScore + (tile.kind === "grass" ? 10 : 3) - adjacentRoads * 4;
  }
  if (card.text === "弓") return routeScore + Math.max(0, windowDistance - 1) * 1.5;
  if (card.text === "骑") return routeScore + adjacentRoads * 2;
  return routeScore;
}

function aiBestEmptyTile(state: SongjiangDuelGameState, card: HandCard) {
  const candidates = state.tiles
    .filter((tile) => canUseUnitCardOnTile("ai", card, tile) && !getUnitAt(state, tile.col, tile.row))
    .map((tile) => ({
      tile,
      score: aiTileScore(state, tile, card),
    }))
    .sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function aiFindGeneralPairTarget(state: SongjiangDuelGameState, card: HandCard) {
  let best: { target: PlayTarget; score: number } | null = null;
  const parts = state.units.filter((unit) => unit.side === "ai" && isNamePart(unit));

  for (const unit of parts) {
    const rightPair = findOrderedGeneralPair(unit.text, card.text);
    if (rightPair) {
      const col = unit.col + 1;
      const tile = getTile(state, col, unit.row);
      if (tile && canUseUnitCardOnTile("ai", card, tile) && !getUnitAt(state, col, unit.row)) {
        const general = GENERAL_PAIRS[rightPair];
        const score = 120 + general.damage * 4 + general.range * 3 + aiTileScore(state, tile, card);
        if (!best || score > best.score) best = { target: { type: "cell", col, row: unit.row }, score };
      }
    }

    const leftPair = findOrderedGeneralPair(card.text, unit.text);
    if (leftPair) {
      const col = unit.col - 1;
      const tile = getTile(state, col, unit.row);
      if (tile && canUseUnitCardOnTile("ai", card, tile) && !getUnitAt(state, col, unit.row)) {
        const general = GENERAL_PAIRS[leftPair];
        const score = 120 + general.damage * 4 + general.range * 3 + aiTileScore(state, tile, card);
        if (!best || score > best.score) best = { target: { type: "cell", col, row: unit.row }, score };
      }
    }
  }

  return best;
}

function aiFindUpgradeTarget(state: SongjiangDuelGameState, card: HandCard) {
  const candidates = state.units
    .filter((unit) => {
      if (unit.side !== "ai" || unit.tier >= maxTierForText(unit.text)) return false;
      if (unit.width === 2) return unit.parts?.includes(card.text) ?? false;
      return unit.text === card.text && !NAME_TOKENS.has(unit.text);
    })
    .map((unit) => ({
      target: { type: "cell" as const, col: unit.col, row: unit.row },
      score:
        70 +
        unit.tier * 12 +
        (unit.width === 2 ? 45 : 0) +
        unit.damage * 2 +
        unit.range,
    }))
    .sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function aiHandCardValue(state: SongjiangDuelGameState, card: HandCard | null) {
  if (!card) return -10;
  if (card.kind === "prop") return card.propId === "shovel" ? 6 : 4 + card.rarity * 2;
  if (aiFindUpgradeTarget(state, card)) return 70;
  if (card.kind === "name" && aiFindGeneralPairTarget(state, card)) return 95;
  if (card.kind === "name") return 12;
  if (card.text === "农") return 10;
  return 18 + card.rarity * 5;
}

function aiWorstHandIndex(state: SongjiangDuelGameState) {
  let bestIndex = -1;
  let bestValue = Infinity;
  for (let index = 0; index < HAND_SIZE; index += 1) {
    const value = aiHandCardValue(state, state.side.ai.hand[index]);
    if (value < bestValue) {
      bestValue = value;
      bestIndex = index;
    }
  }
  return bestIndex >= 0 ? bestIndex : 0;
}

function aiBestUnitTarget(state: SongjiangDuelGameState) {
  const unit = state.units
    .filter((candidate) => candidate.side === "ai" && candidate.archetype !== "farmer")
    .sort(
      (a, b) =>
        b.tier - a.tier ||
        Number(b.width === 2) - Number(a.width === 2) ||
        b.damage + b.range - (a.damage + a.range),
    )[0];
  return unit ? { type: "cell" as const, col: unit.col, row: unit.row } : { type: "none" as const };
}

function aiRoadTarget(state: SongjiangDuelGameState) {
  const route = state.map.routes.ai;
  if (route.length === 0) return { type: "none" as const };
  const danger = state.enemies
    .filter((enemy) => enemy.targetSide === "ai")
    .sort((a, b) => b.progress - a.progress)[0];
  const fallbackIndex = Math.floor(route.length * 0.7);
  const index = danger
    ? clamp(Math.ceil(danger.progress + 0.75), 1, route.length - 2)
    : clamp(fallbackIndex, 1, route.length - 2);
  const point = route[index];
  return point ? { type: "cell" as const, col: point.col, row: point.row } : { type: "none" as const };
}

function aiGrassTarget(state: SongjiangDuelGameState) {
  const tile = state.tiles
    .filter((candidate) => candidate.owner === "ai" && candidate.kind === "grass" && !getUnitAt(state, candidate.col, candidate.row))
    .map((candidate) => ({
      tile: candidate,
      score: routeAdjacencyScore(state, candidate, "ai") * 10 - routeWindowDistance(state, candidate, "ai"),
    }))
    .sort((a, b) => b.score - a.score)[0]?.tile;
  return tile ? { type: "cell" as const, col: tile.col, row: tile.row } : { type: "none" as const };
}

function chooseAiPropTarget(state: SongjiangDuelGameState, propId: PropId): PlayTarget {
  const prop = PROP_DEFS[propId];
  if (prop.target === "none") return { type: "none" };
  if (prop.target === "hand") return { type: "hand", index: aiWorstHandIndex(state) };
  if (prop.target === "unit") return aiBestUnitTarget(state);
  if (prop.target === "road") return aiRoadTarget(state);
  if (propId === "shovel") return aiGrassTarget(state);

  const card: HandCard = {
    uid: 0,
    kind: "prop",
    text: prop.text,
    cost: 0,
    rarity: prop.rarity,
    tier: 1,
    parts: null,
    propId,
  };
  const tile = aiBestEmptyTile(state, card);
  return tile ? { type: "cell", col: tile.tile.col, row: tile.tile.row } : { type: "none" };
}

function chooseAiTarget(state: SongjiangDuelGameState, card: HandCard): PlayTarget {
  if (card.kind === "prop") {
    return card.propId ? chooseAiPropTarget(state, card.propId) : { type: "none" };
  }

  const upgrade = aiFindUpgradeTarget(state, card);
  if (upgrade) return upgrade.target;

  if (card.kind === "name") {
    const pair = aiFindGeneralPairTarget(state, card);
    if (pair) return pair.target;
  }

  const tile = aiBestEmptyTile(state, card);
  return tile ? { type: "cell", col: tile.tile.col, row: tile.tile.row } : { type: "none" };
}

function aiCardPlan(state: SongjiangDuelGameState, card: HandCard, index: number) {
  const target = chooseAiTarget(state, card);
  if (target.type === "none" && PROP_DEFS[card.propId as PropId]?.target !== "none") {
    return { card, index, target, score: -1 };
  }

  if (card.kind === "prop") {
    const propScore =
      card.propId === "shovel"
        ? target.type === "cell"
          ? 42
          : -1
        : 28 + card.rarity * 9 + aiThreatLevel(state) * 20;
    return { card, index, target, score: propScore };
  }

  const upgrade = aiFindUpgradeTarget(state, card);
  if (upgrade) return { card, index, target: upgrade.target, score: upgrade.score };

  if (card.kind === "name") {
    const pair = aiFindGeneralPairTarget(state, card);
    if (pair) return { card, index, target: pair.target, score: pair.score };
  }

  if (target.type === "cell") {
    const tile = getTile(state, target.col, target.row);
    return {
      card,
      index,
      target,
      score: tile ? 24 + card.rarity * 5 + aiTileScore(state, tile, card) : -1,
    };
  }

  return { card, index, target, score: -1 };
}

function grantAiOriginalRoundBonus(state: SongjiangDuelGameState) {
  const ai = state.side.ai;
  ORIGINAL_AI_RULES.bonusRounds.forEach((round, index) => {
    if (state.round < round || ai.aiBonusRoundsClaimed.includes(round)) return;
    ai.aiBonusRoundsClaimed.push(round);
    const amount =
      ORIGINAL_AI_RULES.bonusGoldByDifficulty[ORIGINAL_AI_DIFFICULTY]?.[index] ?? 0;
    if (amount <= 0) return;
    ai.gold += amount;
    addFloat(state, 4, 0.65, `+${amount}`, 0xffd34d);
  });
}

function shouldUseAiActiveProp(state: SongjiangDuelGameState, propId: PropId) {
  const threat = aiThreatLevel(state);
  if (propId === "inkstone" || propId === "bulldozer" || propId === "trap" || propId === "landmine") {
    return threat > 0.25;
  }
  if (propId === "attSpeedSpell" || propId === "longRange") {
    return state.units.some((unit) => unit.side === "ai" && unit.archetype !== "farmer") && threat > 0.05;
  }
  if (propId === "lifePill" || propId === "daBuPill" || propId === "xuMingPill") {
    return state.side.ai.hp < state.side.ai.maxHp;
  }
  if (PROP_DEFS[propId].target === "unit") {
    return state.units.some(
      (unit) => unit.side === "ai" && unit.archetype !== "farmer" && unit.tier < maxTierForText(unit.text),
    );
  }
  return threat > 0.15 || Math.random() <= ORIGINAL_AI_RULES.activePropChanceByDifficulty[ORIGINAL_AI_DIFFICULTY];
}

function tryUseAiActiveProp(state: SongjiangDuelGameState) {
  const ai = state.side.ai;
  if (ai.aiActivePropTimer > 0) return false;

  for (let index = 0; index < ai.activeProps.length; index += 1) {
    const slot = ai.activeProps[index];
    if (!slot || slot.remaining > 0 || !shouldUseAiActiveProp(state, slot.propId)) continue;
    const target = chooseAiPropTarget(state, slot.propId);
    const prop = PROP_DEFS[slot.propId];
    if (prop.target !== "none" && target.type === "none") continue;
    const result = activateSideProp(state, "ai", index, target);
    if (result.ok) {
      ai.aiActivePropTimer = 5;
      return true;
    }
  }

  ai.aiActivePropTimer = 5;
  return false;
}

function updateAi(state: SongjiangDuelGameState, dt: number) {
  const ai = state.side.ai;
  grantAiOriginalRoundBonus(state);
  ai.aiActivePropTimer = Math.max(0, ai.aiActivePropTimer - dt);
  ai.aiTimer -= dt;
  if (ai.aiTimer > 0 || state.status !== "playing") return;
  ai.aiTimer = ORIGINAL_AI_RULES.tickMsByDifficulty[ORIGINAL_AI_DIFFICULTY] / 1000;

  const plans = ai.hand
    .map((card, index) => (card ? aiCardPlan(state, card, index) : null))
    .filter((plan): plan is NonNullable<typeof plan> => plan !== null)
    .sort((a, b) => b.score - a.score);
  const bestPlan = plans[0];

  if ((!bestPlan || bestPlan.score < 58) && ai.gold >= ai.refreshCost) {
    rerollHand(state, "ai");
    return;
  }

  if (bestPlan && bestPlan.score > 0) {
    const result = playHandCard(state, "ai", bestPlan.index, bestPlan.target);
    if (result.ok) return;
  }

  if (tryUseAiActiveProp(state)) return;

  if (ai.gold >= ai.refreshCost && (!bestPlan || bestPlan.score < 30)) {
    rerollHand(state, "ai");
  }
}

function updateEffects(state: SongjiangDuelGameState, dt: number) {
  for (const effect of state.effects) effect.ttl -= dt;
  for (const text of state.floatTexts) text.ttl -= dt;
  state.effects = state.effects.filter((effect) => effect.ttl > 0);
  state.floatTexts = state.floatTexts.filter((text) => text.ttl > 0);
}

function updateWave(state: SongjiangDuelGameState, dt: number) {
  updateOriginalBattleFlow(state, dt, {
    chooseBossSlots: (_round, waveSize) => {
      const playerBoss = bossIdForRound(state);
      const aiBoss = bossIdForRound(state);
      return {
        player:
          playerBoss === undefined
            ? -1
            : packBossSlot(Math.floor(Math.random() * waveSize), playerBoss),
        ai:
          aiBoss === undefined
            ? -1
            : packBossSlot(Math.floor(Math.random() * waveSize), aiBoss),
      };
    },
    spawnEnemy: (side, bossId) => {
      spawnEnemy(state, side, bossId);
    },
    completeBattle: () => {
      state.status = "ended";
      state.winner = "player";
      state.message = "胜利";
      queueStopMusic(state);
      queueSound(state, "game_win");
    },
  });
}

function checkEnd(state: SongjiangDuelGameState) {
  if (state.status === "ended") return;
  if (state.side.player.hp <= 0 || state.side.ai.hp <= 0) {
    state.status = "ended";
    state.winner = state.side.player.hp > state.side.ai.hp ? "player" : "ai";
    if (state.side.player.hp <= 0 && state.side.ai.hp <= 0) state.winner = null;
    state.message =
      state.winner === "player"
        ? "胜利"
        : state.winner === "ai"
          ? "失败"
          : "同归于尽";
    queueStopMusic(state);
    queueSound(state, state.winner === "player" ? "game_win" : "game_lose");
  }
}

export function updateSongjiangDuelGame(state: SongjiangDuelGameState, dt: number) {
  if (state.status !== "playing") return;
  const step = Math.min(0.08, Math.max(0, dt));
  state.elapsed += step;

  updateSideTimers(state, step);
  updateTraps(state, step);
  updateUnits(state, step);
  updateEnemies(state, step);
  updateAi(state, step);
  updateWave(state, step);
  updateEffects(state, step);
  checkEnd(state);
}

export function formatGameTime(seconds: number) {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function getCardTone(card: HandCard | null) {
  if (!card) return 0xd2b982;
  if (card.kind === "prop") {
    return [0xe7f0cf, 0xffe389, 0xf7a45a, 0xef6555][card.rarity];
  }
  if (card.kind === "name") return 0xf0d6c8;
  return card.text === "农" ? 0xcfe6b8 : 0xf5ebd7;
}
