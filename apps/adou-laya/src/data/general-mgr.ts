// GeneralMgr — soldiers, generals, merge recipes, attack configs.
//
// Faithful reconstruction of the original bundle's `D` class
// (reconstruction/reference/bundle.pretty.js lines ~2781-3097). Plain class held
// by the game hub (F.Yn). Holds the soldier/general roster, name-merge recipes
// (赵+云→赵云 …), per-level growth multipliers, and the combat attack configs.
//
// Attack-config object keys are combat-tuning fields kept VERBATIM (shared with
// battle code; renaming risks logic drift):
//   Da = range   Ta = attack interval/speed   Ra = ratio   Oa = (general) range2
//   Ya = bool flag   Ca = attack category (单体/贯穿/范围/快攻贯穿)   Ua = targeting
//
// Other members -> name:
//   soldierTypes=wa/Aa  nameChars=va  spawnCounter=_a  hpGrowthRates=xa
//   atkGrowthRates=Sa  hpMultipliers=ba  atkMultipliers=Ma  mergeRecipes=merge
//   familyNames=familyName  givenNames=Pa  generalNames=Ea  generalTypes=Ba
//   soldierAttackConfigs=Ia  generalAttackConfigs=Fa  defaultGeneralConfig=Ga
//   growthC=za growthD=ja  multC=$a multD=Na  charWeaponIds=qa
//   generalValues=Va  familyGivenNames=Qa  mergeLookup=Za
//   buildMergeLookup=Ka  mergeCandidates=Ja  generalAttackConfig=tn
//   ma/ka/Xa/Ha/Wa kept verbatim (purpose not evident in the bundle)

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AttackConfig {
  Da: number;
  Ta: number;
  Ra: number;
  Ca: string;
  Ua: string;
  Oa?: number;
  Ya?: boolean;
}

export class GeneralMgr {
  ma: any[] = [];
  readonly soldierTypes = ["刀", "弓", "枪", "骑"];
  readonly nameChars = ["赵", "云", "张", "飞", "马", "超", "关", "羽", "平", "兴", "黄", "忠", "苞", "翼", "盖", "祖", "甄", "宓", "刘", "备"];
  ka = 0;
  spawnCounter = 0;
  readonly hpGrowthRates = [0, 0.5, 0.4, 0.3, 0.25];
  readonly atkGrowthRates = [0, 0.5, 0.4, 0.3, 0.25];
  hpMultipliers: number[] = [];
  atkMultipliers: number[] = [];

  readonly mergeRecipes = [
    ["赵", "云"], ["张", "飞"], ["马", "超"], ["关", "羽"], ["黄", "忠"], ["关", "平"],
    ["关", "兴"], ["张", "苞"], ["张", "翼"], ["黄", "盖"], ["刘", "备"], ["黄", "祖"],
  ];
  readonly familyNames = ["赵", "张", "马", "关", "黄", "刘"];
  readonly givenNames = ["云", "飞", "超", "羽", "忠", "平", "兴", "苞", "翼", "盖", "祖", "备"];
  readonly Aa = ["刀", "弓", "枪", "骑"];
  readonly generalNames = ["赵云", "张飞", "马超", "关羽", "黄忠", "关平", "关兴", "张苞", "张翼", "黄盖", "刘备", "黄祖"];
  readonly generalTypes = [
    { general: "赵云", type: 1 }, { general: "张飞", type: 1 }, { general: "马超", type: 1 },
    { general: "关羽", type: 2 }, { general: "黄忠", type: 0 }, { general: "关平", type: 2 },
    { general: "关兴", type: 2 }, { general: "张苞", type: 1 }, { general: "张翼", type: 3 },
    { general: "黄盖", type: 3 }, { general: "刘备", type: 3 }, { general: "黄祖", type: 0 },
  ];

  // Soldier attack configs by type index (刀/弓/枪/骑).
  readonly soldierAttackConfigs: AttackConfig[] = [
    { Da: 1.5, Ta: 3, Ra: 0.8, Ca: "单体", Ua: "nearest" },
    { Da: 3.5, Ta: 2, Ra: 0.8, Ca: "单体", Ua: "closest_end" },
    { Da: 2.5, Ta: 2, Ra: 0.8, Ca: "贯穿", Ua: "nearest" },
    { Da: 2, Ta: 2, Ra: 0.8, Ca: "范围", Ua: "nearest" },
  ];
  // General attack configs (12 generals).
  readonly generalAttackConfigs: AttackConfig[] = [
    { Da: 2.5, Ta: 2, Ra: 0.8, Oa: 3.5, Ya: true, Ca: "快攻贯穿", Ua: "closest_end" },
    { Da: 2.5, Ta: 10, Ra: 1, Oa: 3.5, Ya: true, Ca: "范围", Ua: "nearest" },
    { Da: 2.5, Ta: 10, Ra: 1, Oa: 3.5, Ya: true, Ca: "单体", Ua: "nearest" },
    { Da: 2.5, Ta: 20, Ra: 1, Oa: 3.5, Ya: true, Ca: "单体", Ua: "nearest" },
    { Da: 4.5, Ta: 6, Ra: 0.8, Oa: 5.5, Ya: true, Ca: "贯穿", Ua: "nearest" },
    { Da: 2.5, Ta: 3, Ra: 1, Oa: 3.5, Ya: false, Ca: "范围", Ua: "nearest" },
    { Da: 2.5, Ta: 7, Ra: 1, Oa: 3.5, Ya: false, Ca: "单体", Ua: "closest_end" },
    { Da: 2.5, Ta: 7, Ra: 1, Oa: 3.5, Ya: false, Ca: "单体", Ua: "closest_end" },
    { Da: 2.5, Ta: 7, Ra: 1, Oa: 3.5, Ya: false, Ca: "单体", Ua: "closest_end" },
    { Da: 2.5, Ta: 8, Ra: 1, Oa: 3.5, Ya: false, Ca: "单体", Ua: "nearest" },
    { Da: 2.5, Ta: 10, Ra: 0.8, Oa: 3.5, Ya: true, Ca: "单体", Ua: "nearest" },
    { Da: 3.5, Ta: 6, Ra: 0.8, Oa: 3.5, Ya: false, Ca: "单体", Ua: "closest_end" },
    { Da: 4.5, Ta: 2, Ra: 0.8, Oa: 5.5, Ya: true, Ca: "单体", Ua: "closest_end" },
  ];
  Xa = false;
  readonly Ga = { Da: 2.5, Ta: 6, Ra: 0.8, Oa: 3.5, Ya: false };
  readonly Ha = [0, 8, 23];
  readonly Wa = [0, 10, 30, 60, 110];
  readonly growthC = [0, 0.3, 0.2, 0.15, 0.1];
  readonly growthD = [0, 0.5, 0.4, 0.3, 0.2];
  multC: number[] = [];
  multD: number[] = [];

  readonly charWeaponIds = new Map<string, number[]>([
    ["刀", [1, 2, 3, 4, 5]], ["弓", [1, 2, 3, 4, 5]], ["枪", [1, 2, 3, 4, 5]], ["骑", [1, 2, 3, 4, 5]],
    ["赵", [7]], ["云", [7]], ["关", [8]], ["羽", [7]], ["兴", [4]], ["平", [4]],
    ["张", [8]], ["飞", [7]], ["苞", [4]], ["翼", [4]], ["黄", [6]], ["忠", [6]],
    ["盖", [5]], ["祖", [4]], ["马", [6]], ["超", [6]], ["刘", [7]], ["备", [6]],
    ["农", [1, 2, 3, 4, 5]],
  ]);
  readonly generalValues = new Map<string, number>([
    ["赵云", 14], ["关羽", 15], ["关平", 12], ["关兴", 12], ["马超", 13], ["张飞", 15],
    ["张苞", 12], ["张翼", 12], ["黄忠", 13], ["黄盖", 12], ["黄祖", 12], ["刘备", 13],
  ]);
  readonly familyGivenNames = new Map<string, string[]>([
    ["赵", ["云"]], ["关", ["羽", "平", "兴"]], ["马", ["超"]],
    ["张", ["飞", "苞", "翼"]], ["黄", ["忠", "盖", "祖"]], ["刘", ["备"]],
  ]);
  mergeLookup: Map<string, { text: string[][]; value: number[] }> | null = null;

  init(): void {
    this.buildMergeLookup();
    for (let t = 0; t < this.hpGrowthRates.length; t++) {
      this.hpMultipliers.push(t !== 0 ? this.hpMultipliers[t - 1] * (1 + this.hpGrowthRates[t]) : 1);
    }
    for (let t = 0; t < this.atkGrowthRates.length; t++) {
      this.atkMultipliers.push(t !== 0 ? this.atkMultipliers[t - 1] * (1 + this.atkGrowthRates[t]) : 1);
    }
    for (let t = 0; t < this.growthC.length; t++) {
      this.multC.push(t !== 0 ? this.multC[t - 1] * (1 + this.growthC[t]) : 1);
    }
    for (let t = 0; t < this.growthD.length; t++) {
      this.multD.push(t !== 0 ? this.multD[t - 1] * (1 + this.growthD[t]) : 1);
    }
  }

  startGame(): void {
    this.spawnCounter = 0;
  }

  /** Build the per-name merge hint table from generalValues. (`Ka`) */
  private buildMergeLookup(): void {
    this.mergeLookup = new Map();
    for (let t = 0; t < this.nameChars.length; t++) {
      const entry: { text: string[][]; value: number[] } = { text: [], value: [] };
      for (const gv of this.generalValues) {
        if (gv[0].includes(this.nameChars[t])) {
          const others: string[] = [];
          for (let s = 0; s < gv[0].length; s++) {
            if (gv[0][s] !== this.nameChars[t]) others.push(gv[0][s]);
          }
          entry.text.push(others);
          entry.value.push(gv[1]);
        }
      }
      this.mergeLookup.set(this.nameChars[t], entry);
    }
  }

  /** Given names a character can still merge toward (value >= current). (`Ja`) */
  mergeCandidates(char: string): string[] {
    let family: string | undefined;
    let givens: string[] | undefined;
    const result: string[] = [];
    for (const fg of this.familyGivenNames) {
      if (fg[1].indexOf(char) >= 0) {
        family = fg[0];
        givens = fg[1];
        break;
      }
    }
    const cur = this.generalValues.get((family as string) + char)!;
    for (let t = 0; t < (givens as string[]).length; t++) {
      if (this.generalValues.get((family as string) + (givens as string[])[t])! >= cur) {
        result.push((givens as string[])[t]);
      }
    }
    return result;
  }

  /** General attack config (default when index is -1). (`tn`) */
  generalAttackConfig(index: number): any {
    return index === -1 ? this.Ga : this.generalAttackConfigs[index];
  }

  gameOver(): void {}
}
