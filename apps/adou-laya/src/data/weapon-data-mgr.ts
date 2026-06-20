// WeaponDataMgr — weapon definitions + rarity tables.
//
// Faithful reconstruction of the original bundle's `R` class
// (reconstruction/reference/bundle.pretty.js lines ~3120-3178). Plain class held
// by the game hub (F.Hn). init() loads data/weapon.json into `weapons` (44 rows
// — the boot "打印武器数据 Map(44)" log) and data/weaponTxt.json into
// `weaponTexts`, then buckets ids by rarity x type.
//
// Original member -> name:
//   rarityNames=sa  rarityColors=ia  rarityStrokeColors=pn  levelThresholds=yn
//   rarityDropWeights=gn  dn  weapons=wn  weaponTexts=vn  byRarityType=kn
//   loadWeapons=Ln  buildByRarityType=mn  findIdByTxtRarity=_n  findIdByTxt=xn
//   getWeapon=Sn

/* eslint-disable @typescript-eslint/no-explicit-any */

export class WeaponDataMgr {
  readonly rarityNames = ["普通", "稀有", "卓越", "史诗", "传说"];
  readonly rarityColors = ["#ffffff", "#69e91e", "#29d1fb", "#a351ff", "#e99431"];
  readonly rarityStrokeColors = ["#000000", "#1c8e19", "#0a8bd1", "#a351ff", "#b85a12"];
  readonly levelThresholds = [0, 15, 35, 70, 120, 220, 400];
  // Per round-tier (7) drop weights across the 5 rarities.
  readonly rarityDropWeights = [
    [0, 40, 8, 2, 1],
    [0, 32, 12, 3, 1],
    [0, 24, 14, 4, 2],
    [0, 4, 10, 4, 1],
    [0, 2, 8, 8, 2],
    [0, 1, 5, 10, 4],
    [0, 0, 4, 12, 8],
  ];
  dn = 1;

  weapons!: Map<number, any>;
  weaponTexts!: any[];
  byRarityType!: number[][][];

  init(): void {
    this.loadWeapons();
    this.buildByRarityType();
  }

  /** Load data/weapon.json + data/weaponTxt.json. (`Ln`) */
  private loadWeapons(): void {
    const weaponRes = Laya.loader.getRes("data/weapon.json");
    this.weapons = new Map();
    for (let i = 0; i < weaponRes.data.length; i++) {
      const w = weaponRes.data[i];
      this.weapons.set(w.id, { ...w });
    }
    const txtRes = Laya.loader.getRes("data/weaponTxt.json");
    this.weaponTexts = txtRes.data.map((t: any) => ({ ...t }));
    console.log("打印武器数据", this.weapons);
  }

  /** Bucket weapon ids by [rarity][type]. (`mn`) */
  private buildByRarityType(): void {
    this.byRarityType = [];
    for (let r = 0; r < this.rarityColors.length; r++) {
      this.byRarityType.push([]);
      for (let t = 0; t < 5; t++) this.byRarityType[r].push([]);
    }
    for (const entry of this.weapons) {
      const w = entry[1];
      this.byRarityType[w.rarity][w.type].push(entry[0]);
    }
    console.log("打印不同品质不同种类的武器", this.byRarityType);
  }

  /** Weapon id by display text + rarity. (`_n`) */
  findIdByTxtRarity(txt: string, rarity: number): number | undefined {
    for (let i = 0; i < this.weaponTexts.length; i++) {
      if (this.weaponTexts[i].txt === txt && this.weaponTexts[i].rarity === rarity) {
        return this.weaponTexts[i].id;
      }
    }
    return undefined;
  }

  /** First weapon id whose text matches. (`xn`) */
  findIdByTxt(txt: string): number | undefined {
    for (const entry of this.weapons) if (entry[1].txt === txt) return entry[0];
    return undefined;
  }

  /** Weapon row by id. (`Sn`) */
  getWeapon(id: number): any {
    return this.weapons.get(id);
  }
}
