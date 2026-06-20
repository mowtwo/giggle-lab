// PropsMgr — battle props (道具) definitions + pools.
//
// Faithful reconstruction of the original bundle's `B` class
// (reconstruction/reference/bundle.pretty.js lines ~2348-2727). Plain class held
// by the game hub (F.props). The prop-definition objects keep the original field
// keys verbatim (opaque drop-weight fields) to avoid any translation risk:
//
//   Fe = price        Oe = dropWeightA   Ye = dropWeightB
//   Xe = upgrade levels   Ge = upgrade values   He = upgrade rarities
//   We = upgrade prices   ze = upgrade dropWeightA   je = upgrade dropWeightB
//
// Other members -> name:
//   props=Ue  cdProps=$e  nonCdProps=Ne  qe  sellableProps=Ve
//   spawnCountA=Je  spawnCountB=ta  rarityNames=sa  rarityColors=ia  ha
//   isUpgradeable=ea  rarityAtLevel=aa  introAtLevel=na  priceAtLevel=ra
//   dropWeightAAtLevel=oa  dropWeightBAtLevel=la

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PropDef {
  name: string;
  txt: string;
  intro: string;
  Fe: number;
  cd: number;
  rarity: number;
  Oe?: number;
  Ye?: number;
  Xe?: number[];
  Ge?: number[];
  He?: number[];
  We?: number[];
  ze?: number[];
  je?: number[];
}

export class PropsMgr {
  Re = 1;
  Ce = 0;

  readonly Ue: PropDef[] = [
    { name: "shovel", txt: "铲子", intro: "一把可以开荒的铲子", Fe: 999, cd: 0, rarity: 3 },
    { name: "bulldozer", txt: "推土车", intro: "将敌人向后推,阿斗安全无忧", Fe: 999, cd: 0, rarity: 3 },
    { name: "writingBrush", txt: "毛笔", intro: "可以逆天改字", Fe: 50, cd: 30000, rarity: 2, Oe: 10, Ye: 12 },
    { name: "trainingSpell", txt: "练兵符", intro: "拖到单位上有概率升一级或降一级", Fe: 60, cd: 65000, rarity: 2, Oe: 8, Ye: 8 },
    { name: "upLvlSpell", txt: "神兵符", intro: "拖到单位上升一级", Fe: 90, cd: 55000, rarity: 3, Oe: 5, Ye: 3 },
    { name: "lifePill", txt: "包子", intro: "55%概率给阿斗续一条命，45%概率减少一条命", Fe: 50, cd: 90000, rarity: 1, Oe: 10, Ye: 12 },
    { name: "longRange", txt: "御敌千里", intro: "使远程单位攻击范围翻倍，全局生效", Fe: 30, cd: 60000, rarity: 0, Oe: 20, Ye: 25 },
    { name: "inkstone", txt: "砚台", intro: "打翻砚台，泼出墨汁，使敌方部队攻速缓慢，持续5秒", Fe: 30, cd: 90000, rarity: 0, Oe: 20, Ye: 25 },
    { name: "trap", txt: "陷阱", intro: "敌人掉下去一时会爬不出来", Fe: 35, cd: 50000, rarity: 0, Oe: 15, Ye: 20 },
    { name: "landmine", txt: "地雷", intro: "可炸死敌人", Fe: 50, cd: 55000, rarity: 1, Oe: 10, Ye: 12 },
    { name: "attSpeedSpell", txt: "攻速符", intro: "单位攻速+40%，全局生效", Fe: 80, cd: 90000, rarity: 2, Oe: 6, Ye: 4 },
    { name: "exorcismSpell", txt: "降妖符", intro: "boss施法有50%失败率，并反噬boss自身血量", Fe: 80, cd: -1, rarity: 2, Oe: 6, Ye: 4 },
    { name: "farmer", txt: "农民", intro: "可以刷出农民，每20秒+1金币，升级生产速度翻倍", Fe: 90, cd: -1, rarity: 2, Oe: 5, Ye: 3 },
    { name: "recruit", txt: "招贤榜", intro: "武将刷出概率x2", Fe: 60, cd: -1, rarity: 1, Oe: 8, Ye: 8 },
    { name: "allAttSpeedSpell", txt: "攻速符(全体)", intro: "双方所有单位攻速+10%，全局生效", Fe: 60, cd: -1, rarity: 1, Oe: 8, Ye: 8 },
    { name: "goingHandInHand", txt: "齐头并进", intro: "我方单位攻速+50%，对方单位攻速+30%，全局生效", Fe: 90, cd: -1, rarity: 2, Oe: 5, Ye: 3 },
    { name: "xuMingPill", txt: "续命丹", intro: "我方阿斗+5条命，对方阿斗+3条命", Fe: 50, cd: -1, rarity: 0, Oe: 10, Ye: 12 },
    { name: "daBuPill", txt: "大补丸", intro: "我方阿斗+3条命", Fe: 40, cd: -1, rarity: 0, Oe: 12, Ye: 15 },
    { name: "silt", txt: "淤泥", intro: "道路泥泞，我方敌人移速-10%，全局生效", Fe: 40, cd: -1, rarity: 0, Oe: 12, Ye: 15 },
    { name: "superShovel", txt: "洛阳铲", intro: "每60秒生成一个铲子", Fe: 120, cd: -1, rarity: 3, Oe: 3, Ye: 1 },
    { name: "meteor", txt: "陨石", intro: "当敌人接近阿斗时，会落下陨石消灭敌人", Fe: 150, cd: -1, rarity: 3, Oe: 2, Ye: 1 },
    { name: "trashCan", txt: "垃圾桶", intro: "1馒头回收无用文字", Fe: 150, cd: 0, rarity: 3, Oe: 2, Ye: 1 },
    {
      name: "promotionOrder", txt: "升职令", intro: "刷出的兵有$%概率升到2级",
      Fe: 100, cd: -1, rarity: 1, Oe: 8, Ye: 5,
      Xe: [1, 2, 3], Ge: [5, 10, 15], He: [1, 2, 3], We: [100, 100, 150], ze: [8, 5, 3], je: [5, 3, 2],
    },
    { name: "marchPill", txt: "行军丹", intro: "体力+10", Fe: 40, cd: 0, rarity: 0, Oe: 12, Ye: 15 },
    { name: "goldSeeker", txt: "摸金校尉", intro: "让所有铲子变成金铲子，铲出宝箱", Fe: 150, cd: -1, rarity: 3, Oe: 2, Ye: 1 },
  ];

  readonly $e: number[] = []; // cd props pool
  readonly Ne: number[] = []; // non-cd props pool
  readonly qe: number[] = [];
  readonly Ve: number[] = []; // sellable props (all except shovel/bulldozer)
  readonly Qe = 6;
  readonly Ze = 2;
  readonly Ke = 6;

  // Spawn count ranges by round index (30 x [min,max]).
  readonly Je = [
    [0, 0], [0, 0], [0, 0], [0, 1], [0, 1], [1, 3], [1, 3], [1, 3], [1, 3], [1, 3],
    [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 5], [2, 5], [2, 5], [2, 5],
    [3, 6], [3, 6], [3, 6], [3, 6], [3, 6], [5, 8], [5, 8], [5, 8], [5, 8], [5, 8],
  ];
  readonly ta = [
    [0, 0], [0, 0], [0, 1], [0, 1], [0, 1], [1, 4], [1, 4], [1, 4], [1, 4], [1, 4],
    [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5],
    [4, 7], [4, 7], [4, 7], [4, 7], [4, 7], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8],
  ];
  readonly sa = ["稀有", "卓越", "史诗", "传说"];
  readonly ia = ["#95e45a", "#2dddff", "#D955FF", "#E99431"];
  readonly ha = [0.1, 0.1, 0.1, 0.1];

  /** Nerf the player's low-priority props, then build the pools. (`init`) */
  init(lowPrProps: number[]): void {
    for (let s = 0; s < lowPrProps.length; s++) {
      const p = this.Ue[lowPrProps[s]];
      p.Oe = 0.5 * (p.Oe as number);
      p.Ye = 0.8 * (p.Ye as number);
      if (this.isUpgradeable(lowPrProps[s])) {
        if (p.ze) p.ze = p.ze.map((v) => 0.5 * v);
        if (p.je) p.je = p.je.map((v) => 0.8 * v);
      }
    }
    for (let t = 0; t < this.Ue.length; t++) {
      if (t !== 0 && t !== 1) this.Ve.push(t);
    }
    for (let t = 0; t < this.Ue.length; t++) {
      if (t !== 0 && t !== 1 && t !== 23) {
        if (this.Ue[t].cd === -1) this.Ne.push(t);
        else this.$e.push(t);
      }
    }
  }

  /** Whether prop `i` has per-level upgrades. (`ea`) */
  isUpgradeable(i: number): boolean {
    return !!this.Ue[i].Xe;
  }

  /** Rarity of prop `i` at level `lvl`. (`aa`) */
  rarityAtLevel(i: number, lvl: number): number {
    return this.isUpgradeable(i) ? this.Ue[i].He![lvl - 1] : this.Ue[i].rarity;
  }

  /** Intro text of prop `i` at level `lvl` ($ replaced by the upgrade value). (`na`) */
  introAtLevel(i: number, lvl: number): string {
    return this.isUpgradeable(i)
      ? this.Ue[i].intro.replace("$", this.Ue[i].Ge![lvl - 1].toString())
      : this.Ue[i].intro;
  }

  /** Price of prop `i` at level `lvl`. (`ra`) */
  priceAtLevel(i: number, lvl: number): number {
    return this.isUpgradeable(i) && this.Ue[i].We ? this.Ue[i].We![lvl - 1] : this.Ue[i].Fe;
  }

  /** dropWeightA (Oe) of prop `i` at level `lvl`. (`oa`) */
  dropWeightAAtLevel(i: number, lvl: number): number {
    return this.isUpgradeable(i) && this.Ue[i].ze ? this.Ue[i].ze![lvl - 1] : (this.Ue[i].Oe as number);
  }

  /** dropWeightB (Ye) of prop `i` at level `lvl`. (`la`) */
  dropWeightBAtLevel(i: number, lvl: number): number {
    return this.isUpgradeable(i) && this.Ue[i].je ? this.Ue[i].je![lvl - 1] : (this.Ue[i].Ye as number);
  }
}
