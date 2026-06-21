// Bullet hit strategies + factory.
//
// Faithful reconstruction of the bundle's `js`/`$s`/`qs`/`Qs`/`Ks` strategy
// classes and the `ti`/`si` factory (reconstruction/reference/bundle.pretty.js
// lines ~10621-10707). Each strategy describes how a bullet resolves collisions
// (single / pierce / area …). Flag fields kept verbatim (ML/PL/EL/BL/IL/DL/…)
// since their exact semantics are internal to the bullet collision code.
//
// Strategy types: 100 = HitEnemy (poolable, per-bullet) ; 101/102/103 = shared
// singletons. (`AL` = the shared default instance.)

/* eslint-disable @typescript-eslint/no-explicit-any */

export class HitStrategy {}

/** Strategy 102 (`$s`/`Ns`). */
export class HitStrategy102 extends HitStrategy {
  ML = false;
  PL = true;
  static readonly AL = new HitStrategy102();
}

/** Strategy 100 — hit-enemy (poolable, carries hit list + pierce). (`qs`/`Vs`) */
export class HitEnemyStrategy extends HitStrategy {
  ML = false;
  PL = false;
  EL: any[] = [];
  BL = true;
  IL = "requestRemove";
  DL = 0;
  TL = false;
  RL = false;
  KB = false;
  CL = "";
  UL = 0;
  static readonly AL = new HitEnemyStrategy();
}

/** Strategy 101 (`Qs`/`Zs`). */
export class HitStrategy101 extends HitStrategy {
  ML = true;
  PL = false;
  static readonly AL = new HitStrategy101();
}

/** Strategy 103 (`Ks`/`Js`). */
export class HitStrategy103 extends HitStrategy {
  ML = true;
  PL = true;
  static readonly AL = new HitStrategy103();
}

export class HitStrategyFactory {
  static produce(type: number, spec?: any): any {
    switch (type) {
      case 100: {
        const s = Laya.Pool.getItemByCreateFun(`HitEnemyStrategy${type}`, () => {
          const inst = new HitEnemyStrategy();
          inst.CL = "HitEnemyStrategy" + type;
          inst.UL = type;
          return inst;
        });
        if (spec) {
          if ("FL" in spec) {
            if (Array.isArray(spec.FL)) s.EL = spec.FL;
            else if (typeof spec.FL === "number") s.EL = [spec.FL];
          }
          if ("DL" in spec) s.DL = spec.DL;
          if ("BL" in spec) s.BL = spec.BL;
          s.IL = "IL" in spec ? spec.IL : "requestRemove";
        } else {
          s.DL = 0;
          s.EL = [];
          s.BL = true;
        }
        s.TL = false;
        s.RL = false;
        return s;
      }
      case 102:
        return HitStrategy102.AL;
      case 103:
        return HitStrategy103.AL;
      case 101:
      default:
        return HitStrategy101.AL;
    }
  }

  static copyFrom(src: any): any {
    const inst = HitStrategyFactory.produce(src.UL);
    return Object.assign(inst, src);
  }

  static recover(s: any): void {
    if (!s) return;
    if (s.UL === undefined) return;
    if (s instanceof HitEnemyStrategy) {
      s.EL = [];
      s.DL = -1;
      s.BL = true;
    }
    const pool = s instanceof HitEnemyStrategy ? s.CL : "";
    if (pool) Laya.Pool.recover(pool, s);
  }

  static readonly OL = new Map<any, number>([
    [HitEnemyStrategy, 100],
    [HitStrategy101, 101],
    [HitStrategy102, 102],
    [HitStrategy103, 103],
  ]);
}
