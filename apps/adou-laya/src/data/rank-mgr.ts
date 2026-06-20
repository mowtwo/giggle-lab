// RankMgr — rank ladder config + data/rank.json table.
//
// Faithful reconstruction of the original bundle's `I` class
// (reconstruction/reference/bundle.pretty.js lines ~2728-2780). Plain class held
// by the game hub (F.rank). init() loads data/rank.json into the `table` map
// (54 rows — the boot "打印测试 Map(54)" log).
//
// Original member -> name:
//   currentRank=ca  lastRank=ua  scoreRanges=pa  ya  rewardTables=fa
//   table=da  load=ga  currentMap=La

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RankRow {
  id: number;
  rank: string;
  level: number;
  reward: number;
  addHp: number;
  weapon0: any;
  weapon1: any;
  weapon2: any;
  weapon3: any;
  weapon4: any;
  Ei: [any, any, any, any];
  map: number;
}

export class RankMgr {
  currentRank = { id: 0, rank: "", level: 1, reward: 0 };
  lastRank = { id: 0, rank: "", level: 0, reward: 0 };

  // Per-rank score ranges (10 ranks).
  readonly scoreRanges: Array<[number, number]> = [
    [-25, -21],
    [-20, -16],
    [-15, -11],
    [-10, -6],
    [-5, -1],
    [0, 5],
    [6, 10],
    [11, 15],
    [16, 20],
    [21, 25],
  ];
  readonly ya = [0, 5, 10, 15];
  // Reward tables per difficulty (4 x 10).
  readonly rewardTables = [
    [0, 0, 0, 0, 10, 10, 0, 0, 0, 0],
    [0, 0, 2, 4, 10, 10, 5, 3, 0, 0],
    [0, 1, 2, 4, 10, 10, 5, 3, 2, 1],
    [1, 1, 2, 4, 10, 10, 6, 4, 3, 2],
  ];

  table!: Map<number, RankRow>;

  init(): void {
    this.load();
  }

  /** Load data/rank.json into `table`. (`ga`) */
  private load(): void {
    const rows = Laya.loader.getRes("data/rank.json").data as any[];
    this.table = new Map();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      this.table.set(r.id, {
        id: r.id,
        rank: r.rank,
        level: r.level,
        reward: r.reward,
        addHp: r.addHp,
        weapon0: r.weapon0,
        weapon1: r.weapon1,
        weapon2: r.weapon2,
        weapon3: r.weapon3,
        weapon4: r.weapon4,
        Ei: [r.difficulty0, r.difficulty1, r.difficulty2, r.difficulty3],
        map: r.map,
      });
    }
    console.log("打印测试", this.table);
  }

  /**
   * Map identifier for the current rank. (`La`)
   * TODO: the original indexed an outer maps table `x` by this map id; until the
   * maps table is ported, return the raw map id. (Off the critical path — only
   * the rank-reward map preview uses it.)
   */
  currentMap(): number {
    return this.table.get(this.currentRank.id)!.map;
  }
}
