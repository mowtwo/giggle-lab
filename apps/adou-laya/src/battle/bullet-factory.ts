// BulletFactory — pools + produces every bullet instance (the bundle's `Bh`/`Ih`).
//
// Faithful reconstruction of the bundle's `Bh` (reconstruction/reference/
// bundle.pretty.js lines ~17625-17730). Concrete bullet classes register a
// creator keyed by their static `sw` type name; `produce` pools the bullet by
// (type, sprite-key), wires in the spatial mgr + game hub + its Laya sprite,
// applies any extra components, and parents it under the bullet layer.
//
//   creators=ag  poolPrefix=qA  idCounter=$A  build=jA  typeName=NA  produce=produce

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { LayerZ } from "../core/layer-z";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const X = LayerZ;

export class BulletFactory {
  static ag = new Map<string, () => any>();
  static qA = "bullet_pool";
  static $A = 0;

  /** Pool-or-build a bullet, wiring its sprite + deps on first creation. (`jA`) */
  static jA(poolKey: string, ctor: any, spec: any): any {
    let created = false;
    const bullet = Laya.Pool.getItemByCreateFun(poolKey, () => {
      const sprite = new Laya.Sprite();
      const b = new ctor(spec.xm);
      b.xw = EnemySpatialMgr.instance();
      b.dg = F.instance();
      b.Pm = sprite;
      b.init();
      created = true;
      return b;
    });
    bullet.id = this.$A++;
    if (created && spec.ow && "SimpleDynamicArrow" === spec.type.sw) bullet.hw(spec.ow);
    return bullet;
  }

  /** Resolve a bullet's pool type name from its `sw` chain. (`NA`) */
  static NA(t: any): string {
    let s = t;
    while (s && s !== Function.prototype) {
      const name = s.sw;
      if (name) return name;
      s = Object.getPrototypeOf(s);
    }
    const i = t.name;
    if (i && "type" !== i) return i;
    const h = Object.getPrototypeOf(t);
    return h && h !== Function.prototype && h.name ? h.name : "BulletUnknown";
  }

  static register(t: string, s: () => any): void {
    this.ag.set(t, s);
  }

  /** Register a class creator (no-arg `new s("")`). (`lw`) */
  static lw(t: string, s: any): void {
    this.ag.set(t, () => new s(""));
  }

  static ng(t: string): any {
    const s = this.ag.get(t);
    if (!s) throw new Error(`BulletFactory: 未为类型 ${t} 注册创建器`);
    return s();
  }

  static produce(spec: any): any {
    if (spec.ow) {
      if (!spec.ow.xm) spec.ow.xm = "";
      spec.xm = spec.ow.xm;
    }
    const i = spec.xm || "";
    const h = this.NA(spec.type);
    const poolKey = this.qA + "_" + h + "_" + i;
    const a = this.jA(poolKey, spec.type, spec);
    if (spec.VA) spec.VA.forEach((t: any) => a.Tm(t));
    if (!a.vm) y.instance.event(u.bt, a.Pm);
    a.Pm.zIndex = X.mr;
    return a;
  }

  static recover(s: any): void {
    const i = this.NA(s.constructor);
    const h = s.xm;
    const poolKey = this.qA + "_" + i + "_" + h;
    Laya.Tween.killAll(s.Pm);
    s.recover();
    s.Pm.removeSelf();
    Laya.Pool.recover(poolKey, s);
  }
}

/** Alias used throughout the battle core. (`Ih`) */
export const Ih = BulletFactory;
