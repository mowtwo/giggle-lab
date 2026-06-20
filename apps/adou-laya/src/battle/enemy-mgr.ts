// EnemyMgr — enemy/boss stat tables.
//
// Faithful reconstruction of the original bundle's `k` class (game hub F.enemy),
// reconstruction/reference/bundle.pretty.js lines ~963-1130. Holds the enemy HP
// progression, per-type enemy configs, the 12 boss configs (with skill name /
// intro / color), and various combat multiplier tables. Numeric tuning fields
// kept VERBATIM (consumed by battle code); boss text fields are readable.
//
//   nh = enemy hp progression   rh = round multipliers   oh = enemy-type configs
//   ph = counter   yh / fh / mh / wh / kh = tuning tables   gh = boss configs
//   boss config: uh/speed/dh/Lh verbatim, skillName/skillIntro/color readable

export class EnemyMgr {
  readonly nh = [10, 11, 12, 13, 15, 16, 18, 19, 21, 24, 26, 29, 31, 35, 38, 42, 46, 51, 56, 61];
  readonly rh = [0.6, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8];
  readonly oh = [
    { uh: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315], speed: 50 },
    { uh: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315], speed: 50 },
    { uh: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315], speed: 50 },
    { uh: [10, 16, 26, 41, 61, 92, 138, 200, 291, 421, 611, 886, 1285, 1863, 2701, 3917, 5680, 8235, 11941, 17315], speed: 50 },
  ];
  ph = 0;
  readonly yh = [3, 6, 9, 12, 15, 18];
  readonly fh = [0.1, 0.2, 0.3, 0.5, 0.9, 1];
  readonly gh = [
    { uh: 7, speed: 10, dh: 2, Lh: 8, skillName: "摄魂", skillIntro: "使我方小兵陷入混乱，无法攻击", color: "#ed462f" },
    { uh: 10, speed: 10, dh: 3, Lh: 8, skillName: "招魂", skillIntro: "做法复活死亡的小兵", color: "#32ee3a" },
    { uh: 14, speed: 10, dh: 2, Lh: 10, skillName: "鼓舞", skillIntro: "激励身边单位，大幅提升血量和移速", color: "#27c8ff" },
    { uh: 7, speed: 10, dh: 10, Lh: 10, skillName: "拆迁", skillIntro: "将空白地块转化为不可用", color: "#f16fe1" },
    { uh: 10, speed: 10, dh: 10, Lh: 3, skillName: "巫山云雨", skillIntro: "战场下雨，降低所有单位攻速，升级可驱除", color: "#68b4ff" },
    { uh: 14, speed: 10, dh: 10, Lh: 10, skillName: "裙下之臣", skillIntro: "将最低等级的小兵纳入麾下", color: "#d9207a" },
    { uh: 7, speed: 10, dh: 0, Lh: 8, skillName: "铁骑号令", skillIntro: "召唤西凉骑兵", color: "#4db678" },
    { uh: 10, speed: 10, dh: 2.5, Lh: 10, skillName: "方天画戟", skillIntro: "挥动武器，大幅降低小兵等级并禁止合成", color: "#fb4c54" },
    { uh: 14, speed: 10, dh: 1.5, Lh: 10, skillName: "饕餮", skillIntro: "吞噬范围内小兵，获得血量加成并膨胀", color: "#7447a6" },
    { uh: 7, speed: 10, dh: 2, Lh: 15, skillName: "彻底疯狂", skillIntro: "冲阵击倒小兵，使其无法动弹，升级解除", color: "#fb2500" },
    { uh: 10, speed: 10, dh: 2, Lh: 8, skillName: "噬目", skillIntro: "视野变暗，难以看清局势", color: "#21b2ff" },
    { uh: 14, speed: 10, dh: 10, Lh: 15, skillName: "一代枭雄", skillIntro: "封印最高等级小兵，升级解除", color: "#010b97" },
  ];
  readonly mh = [5, 2, 3];
  readonly wh = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.1, 1.2, 1.3, 1.2, 1.3, 1.7, 2, 1, 1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1.5, 1, 1.8, 2, 1, 1, 2, 1, 1, 1.3, 1, 1, 1.4, 1, 1, 1.5, 1, 1],
  ];
  readonly kh = [1, 1.2, 1.4, 1.6, 1.8];

  startGame(): void {}
  gameOver(): void {
    this.ph = 0;
  }
}
