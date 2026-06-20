// AnimPlayer — pools animated sprites (frame-anim or spine) by id. (`Zt`)
//
// Faithful reconstruction of the bundle's `Zt` class
// (reconstruction/reference/bundle.pretty.js lines ~8806-8847). Returns a
// FrameAnimSprite when the id is a registered frame anim, otherwise a SpineSprite
// loaded from resources/anim/<id>/skeleton.json. Recovers to the matching pool.
//
//   slowModeAnims=uf  get=pf  getBoss=yf  bossAnimId=ff  recover=gf

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { hasFrameAnim } from "./frame-anim";
import { FrameAnimSprite } from "./frame-anim-sprite";
import { SpineSprite } from "./spine-sprite";

export class AnimPlayer extends Singleton {
  private readonly slowModeAnims = ["aDou", "boss0", "boss1", "grass", "huaXiong"];

  init(): void {}

  /** Get a pooled animated sprite for an anim id. (`pf`) */
  pf(id: string): any {
    if (hasFrameAnim(id)) {
      return Laya.Pool.getItemByCreateFun("fsk_" + id, () => new FrameAnimSprite(id));
    }
    const sprite = Laya.Pool.getItemByCreateFun(
      "sk_" + id,
      () => new SpineSprite("resources/anim/" + id + "/skeleton.json"),
    );
    sprite.setIsFastMode(!this.slowModeAnims.includes(id));
    return sprite;
  }

  /** Get a pooled sprite for a boss type. (`yf`) */
  yf(bossType: number): any {
    return this.pf(this.ff(bossType));
  }

  /** Map a boss type index to its anim id. (`ff`) */
  ff(bossType: number): string {
    if (bossType === 0 || bossType === 1 || bossType === 2) return "boss0";
    if (bossType === 3 || bossType === 4 || bossType === 5) return "boss1";
    if (bossType === 6) return "huaXiong";
    if (bossType === 7) return "lvBu";
    if (bossType === 8) return "dongZhuo";
    if (bossType === 9 || bossType === 10 || bossType === 11) return "boss2";
    return "boss0";
  }

  /** Recover an animated sprite to its pool. (`gf`) */
  gf(sprite: any, id: string): void {
    if (hasFrameAnim(id)) {
      sprite.resetForPool();
      Laya.Pool.recover("fsk_" + id, sprite);
      return;
    }
    Laya.Pool.recover("sk_" + id, sprite);
  }
}
