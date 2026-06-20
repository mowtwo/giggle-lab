// PreloadMgr — the LoadScene resource preload list.
//
// Faithful reconstruction of the original bundle's `_n` class + `kn()` builder
// (reconstruction/reference/bundle.pretty.js lines ~27353-27440). `dX` is the
// full list of resources LoadScene preloads: every battle/UI prefab, the data
// tables, the spine skeletons, and every soldier frame-animation image (expanded
// from the frame-anim registry). All original URLs are preserved unchanged so
// the engine loads the exact same assets (resolved via the AutoAtlas atlases).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";
import { allFrameAnimIds, frameAnimUrls } from "../battle/frame-anim";

function buildPreloadList(): Array<{ url: string; type?: string }> {
  const list: Array<{ url: string; type?: string }> = [
    { url: "prefab/mob.lh" },
    { url: "prefab/boss.lh" },
    { url: "prefab/mapItem.lh" },
    { url: "prefab/damageNum.lh" },
    { url: "prefab/maChaoPike.lh" },
    { url: "prefab/setSoldierEff.lh" },
    { url: "prefab/crackEff.lh" },
    { url: "prefab/shovelGrass.lh" },
    { url: "prefab/trail.lh" },
    { url: "prefab/talkBox.lh" },
    { url: "prefab/rankItem.lh" },
    { url: "prefab/goldUp.lh" },
    { url: "prefab/shopItem.lh" },
    { url: "prefab/heart.lh" },
    { url: "prefab/lvlUpEff.lh" },
    { url: "prefab/lvlDownEff.lh" },
    { url: "prefab/loveHeart.lh" },
    { url: "prefab/treasure.lh" },
    { url: "prefab/lotteryItem.lh" },
    { url: "prefab/generalEquipItem.lh" },
    { url: "prefab/weaponSceneWeaponItem.lh" },
    { url: "prefab/weaponSceneGeneralItem.lh" },
    { url: "prefab/weaponFragment.lh" },
    { url: "prefab/attChangeTip.lh" },
    { url: "prefab/bulletTrail/fireArrowTrail.lh" },
    { url: "prefab/bulletTrail/arrowTrail.lh" },
    { url: "prefab/bulletTrail/knifeTrail.lh" },
    { url: "prefab/bulletTrail/fireDragonTrail.lh" },
    { url: "prefab/bulletTrail/daoqiTrail.lh" },
    { url: "prefab/mapBg0.lh" },
    { url: "prefab/mapBg1.lh" },
    { url: "prefab/mapBg2.lh" },
    { url: "prefab/mapBg3.lh" },
    { url: "data/weapon.json" },
    { url: "data/weaponTxt.json" },
    { url: "data/rank.json" },
    { url: "data/agreement.txt", type: Laya.Loader.TEXT },
    { url: "data/agreement-1.txt", type: Laya.Loader.TEXT },
    { url: "data/agreement-2.txt", type: Laya.Loader.TEXT },
    { url: "data/agreement-3.txt", type: Laya.Loader.TEXT },
    { url: "resources/anim/aDou/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/thief/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/zhaoYun/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/zhangFei/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/maChao/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/dancer/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/grass/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/boss0/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/boss1/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/boss2/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/huaXiong/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/lvBu/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/dongZhuo/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/stamina/skeleton.json", type: Laya.Loader.SPINE },
    { url: "resources/anim/mihuan/skeleton.json", type: Laya.Loader.SPINE },
  ];
  // Append every soldier frame-animation image URL (deduped).
  const frameUrls = new Set<string>();
  for (const id of allFrameAnimIds()) {
    const urls = frameAnimUrls(id);
    for (let i = 0; i < urls.length; i++) frameUrls.add(urls[i]);
  }
  for (const url of frameUrls) list.push({ url });
  return list;
}

export class PreloadMgr extends Singleton {
  readonly dX = buildPreloadList();
  init(): void {}
}
