// PoolFactory — generic Laya.Pool create/recover singleton.
//
// Faithful reconstruction of the bundle's `Gs`/`Hs` classes
// (reconstruction/reference/bundle.pretty.js lines ~10210-10219). `Gs` is an
// empty Singleton base and `Hs` adds produce/recover; collapsed here into one
// PoolFactory singleton (Gs added nothing). Used to pool soldier instances.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";

export class PoolFactory extends Singleton {
  init(): void {}
  produce(cls: any): any {
    return Laya.Pool.createByClass(cls);
  }
  recover(obj: any): void {
    Laya.Pool.recoverByClass(obj);
  }
}
