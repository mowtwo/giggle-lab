// SimpleHitAreaBullet (ui) + PikeBullet (pi) + KnifeBullet (yi).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~11127-11227. A beam/area bullet that grows along a rotation and damages the
// enemy on hit; PikeBullet/KnifeBullet add the pike/knife/cavalry hit FX.
// Opaque beam-config fields kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Bullet } from "./bullet";
import { HitStrategy103 } from "./hit-strategy";
import { GameMgr } from "../core/game-mgr";
import { EffectMgr } from "./effect-mgr";

export class SimpleHitAreaBullet extends Bullet {
  static sw = "SimpleHitAreaBullet";

  protected Rw = new Laya.Point(); // owner position
  protected Uw = 0;
  protected Fw = 0;
  protected Ow = 0;
  protected Yw = 0;
  protected Xw = false;
  BL = false;

  constructor(poolKey?: string) {
    super(poolKey);
    this.km = HitStrategy103.AL;
  }

  protected Zd(): void {
    this.Pm.size(20, 20);
    this.Pm.anchor(0.5, 0.5);
  }

  protected onReset(spec: any): boolean | void {
    if (!this.bm || !this.bm.root) return false;
    this.Rw.copy(this.dg.toLocal(this.bm.root, true));
    if (!spec.Cw) return;
    const cw = spec.Cw;
    this.Pm.size(2 * cw.bold, cw.length + 2 * cw.bold);
    this.Pm.anchor(0.5, 1);
    this.Pm.rotation = cw.rotation;
    this.Pm.pos(cw.pos.x, cw.pos.y);
    this.Uw = cw.Uw ?? 0;
    this.Fw = cw.Fw ?? cw.length;
    this.Ow = cw.Ow ?? cw.rotation;
    this.Yw = cw.Yw ?? cw.bold;
    this.BL = cw.BL ?? false;
    this.Xw = cw.Gw ?? false;
  }

  protected Hm(): void {
    if (this.Uw) {
      Laya.Tween.create(this.Pm)
        .duration(this.Uw)
        .to("rotation", this.Ow)
        .to("height", this.Fw + 2 * this.Yw)
        .to("width", 2 * this.Yw)
        .then(() => {
          if (this.Xw) this.Am();
        });
    }
  }

  protected onUpdate(_delta: number): void {}

  protected $m(enemy: any): void {
    enemy.hit(this.Sm, this.bm);
  }

  protected qm(): void {
    if (this.BL) this.Am();
  }

  protected Zm(): void {}
  protected tw(): void {}

  /** Angle from the owner to an enemy. (`Hw`) */
  protected Hw(enemy: any): number {
    const s = GameMgr.instance().toLocal(enemy.enemy, true, false);
    const dx = this.Rw.x - s.x;
    const dy = this.Rw.y - s.y;
    let e = -1 * Math.atan2(-dx, dy);
    e = (180 * e) / Math.PI;
    if (e > 180) e -= 360;
    if (e < -180) e += 360;
    return e;
  }
}

/** PikeBullet — area beam + pike/cavalry hit FX. (`pi`) */
export class PikeBullet extends SimpleHitAreaBullet {
  static sw = "PikeBullet";
  private Ww = false;

  protected onReset(spec: any): boolean | void {
    super.onReset(spec);
    this.Ww = !!spec.Cw?.Ww;
  }

  protected $m(enemy: any): void {
    super.$m(enemy);
    const s = enemy.enemy;
    if (this.Ww) {
      const angle = this.Hw(enemy);
      EffectMgr.instance().playCavalryHit(s, s.width / 2, s.height / 2, -angle);
    } else {
      EffectMgr.instance().playPikeHit(s, s.width / 2, s.height / 2);
    }
  }
}

/** KnifeBullet — area beam + knife/cavalry hit FX. (`yi`) */
export class KnifeBullet extends SimpleHitAreaBullet {
  static sw = "KnifeBullet";
  private zw = false;

  protected onReset(spec: any): boolean | void {
    super.onReset(spec);
  }

  protected $m(enemy: any): void {
    super.$m(enemy);
    const angle = this.Hw(enemy);
    const i = enemy.enemy;
    if (this.zw) {
      EffectMgr.instance().playCavalryHit(i, i.width / 2, i.height / 2, -angle);
    } else {
      EffectMgr.instance().playKnifeHit(i, i.width / 2, i.height / 2, -angle);
    }
  }
}
