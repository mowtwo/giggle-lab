// PrefabName + PrefabPool.
//
// Faithful reconstruction of the original bundle's `G` enum and `H` class
// (reconstruction/reference/bundle.pretty.js lines ~3446-3491). PrefabPool.init
// caches every preloaded prefab resource keyed by name; so(name) returns the
// cached resource (callers .create() an instance). Keys with no matching .lh
// resolve to undefined exactly as in the bundle.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";

// `G` — prefab/effect name registry (values == keys).
export const PrefabName = {
  mob: "mob",
  boss: "boss",
  mapItem: "mapItem",
  damageNum: "damageNum",
  maChaoPike: "maChaoPike",
  setSoldierEff: "setSoldierEff",
  crackEff: "crackEff",
  shovelGrass: "shovelGrass",
  trail: "trail",
  talkBox: "talkBox",
  rankItem: "rankItem",
  goldUp: "goldUp",
  knifeHit: "knifeHit",
  bowHit: "bowHit",
  pikeHit: "pikeHit",
  cavalryHit: "cavalryHit",
  shopItem: "shopItem",
  heart: "heart",
  lvlUpEff: "lvlUpEff",
  lvlDownEff: "lvlDownEff",
  mapBg0: "mapBg0",
  mapBg1: "mapBg1",
  mapBg2: "mapBg2",
  mapBg3: "mapBg3",
  loveHeart: "loveHeart",
  treasure: "treasure",
  lotteryItem: "lotteryItem",
  generalEquipItem: "generalEquipItem",
  weaponSceneWeaponItem: "weaponSceneWeaponItem",
  weaponSceneGeneralItem: "weaponSceneGeneralItem",
  weaponFragment: "weaponFragment",
  attChangeTip: "attChangeTip",
} as const;

export class PrefabPool extends Singleton {
  private Jr!: Map<string, any>;

  init(): void {
    this.Jr = new Map();
    const keys = Object.keys(PrefabName);
    for (let i = 0; i < keys.length; i++) {
      this.Jr.set(keys[i], Laya.loader.getRes(`prefab/${keys[i]}.lh`));
    }
  }

  /** Cached prefab resource by name (`so`). */
  so(name: string): any {
    return this.Jr.get(name);
  }
}
