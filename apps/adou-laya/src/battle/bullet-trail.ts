// BulletTrailPool — pools the Trail2DRender prefab instances bullets drag behind.
//
// Faithful reconstruction of the bundle's `Uh` (aliased `Fh`) —
// reconstruction/reference/bundle.pretty.js lines ~17745-17833. Loads each trail
// prefab (`prefab/bulletTrail/<type>.lh`), caches its original config, and on
// recover either returns it to the pool or detaches it under the road layer to
// fade out gracefully before recycling. Opaque field names kept verbatim.
//
//   config=BulletTrailConfig  typeKey=nE  fadeKey=aE  pendingFade=bulletTrailPendingFade

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";

const F = GameMgr;

export class BulletTrailPool {
  static BulletTrailConfig = new Map<string, any>();
  static nE = "trailType";
  static aE = "$bulletTrailFadeRecover";
  static bulletTrailPendingFade = new Set<any>();

  static cancelBulletTrailFadeTimer(s: any): void {
    const i = s[this.aE];
    if (i) Laya.timer.clear(this, i);
    s[this.aE] = null;
    this.bulletTrailPendingFade.delete(s);
  }

  static clearAllDeferredTrails(): void {
    const s = Array.from(this.bulletTrailPendingFade);
    for (const i of s) {
      this.cancelBulletTrailFadeTimer(i);
      this.recover(i, true);
    }
  }

  static produce(s: string): any {
    const i = Laya.Pool.getItemByCreateFun(s, () => {
      const node = Laya.loader.getRes(`prefab/bulletTrail/${s}.lh`).create();
      node[this.nE] = s;
      const h = node.getComponent(Laya.Trail2DRender);
      this.BulletTrailConfig.set(s, {
        trailTime: h.time,
        trailWidthMultiplier: h.widthMultiplier,
        trailZOder: node.zIndex,
        trailColor: h.color.clone(),
      });
      return node;
    });
    this.cancelBulletTrailFadeTimer(i);
    const h = i.getComponent(Laya.Trail2DRender);
    h.clear();
    if (this.BulletTrailConfig.has(s)) {
      const e = this.getOriginalTrailConfig(s);
      h.widthMultiplier = e.trailWidthMultiplier;
      i.zIndex = e.trailZOder;
      h.color = e.trailColor;
      h.enabled = true;
      h.time = 0;
      Laya.timer.frameOnce(1, this, () => {
        h.time = e.trailTime;
      });
    }
    return i;
  }

  static getOriginalTrailConfig(s: string): any {
    return this.BulletTrailConfig.get(s);
  }

  static recover(s: any, i = false): void {
    const e = s[this.nE];
    if (typeof e !== "string") return;
    const a = s.getComponent(Laya.Trail2DRender);
    if (i) {
      this.cancelBulletTrailFadeTimer(s);
      if (a) {
        a.clear();
        a.enabled = true;
      }
      s.removeSelf();
      if (this.getOriginalTrailConfig(e)) Laya.Pool.recover(e, s);
      else s.destroy(true);
    } else {
      this.cancelBulletTrailFadeTimer(s);
      Laya.Point.TEMP.setTo(s.x, s.y);
      const root = F.instance().Qn;
      const road = root.getChildByName("road") ?? root;
      const n = s.parent;
      if (!n) {
        this.recover(s, true);
        return;
      }
      n.localToGlobal(Laya.Point.TEMP);
      road.globalToLocal(Laya.Point.TEMP);
      s.removeSelf();
      road.addChild(s);
      s.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
      s.zIndex = 1;
      const r = 1000 * a.time + 200;
      const o = () => {
        s[this.aE] = null;
        if (this.bulletTrailPendingFade.delete(s)) this.recover(s, true);
      };
      s[this.aE] = o;
      this.bulletTrailPendingFade.add(s);
      Laya.timer.once(r, this, o);
    }
  }
}

/** Alias. (`Fh`) */
export const Fh = BulletTrailPool;
