// GeneralMergeFactory — produces the concrete general by type, pools them.
//
// Faithful reconstruction of the bundle's `$a` (reconstruction/reference/
// bundle.pretty.js lines ~24881-24935). The original is a hardcoded switch from
// general-type → concrete general class; here it is de-mangled into a type→class
// registry that the concrete general classes register into (same behaviour). The
// concrete general classes are ported alongside their skills; until then a
// produce() for an unregistered type throws.
//
//   produce=TS  recover=HR

/* eslint-disable @typescript-eslint/no-explicit-any */

export class GeneralMergeFactory {
  private static registry = new Map<number, any>();

  /** Register a concrete general class for a type (-1 = civilian, 0..11 generals). */
  static register(type: number, ctor: any): void {
    this.registry.set(type, ctor);
  }

  /** Produce (pool) the general for a type, defaulting to type 1 when unknown. (`TS`) */
  static TS(type: number): any {
    const ctor = this.registry.get(type) ?? this.registry.get(1);
    if (!ctor) throw new Error(`[GeneralMergeFactory] 将领类型 ${type} 未注册创建器`);
    return Laya.Pool.createByClass(ctor);
  }

  /** Recover a general to its pool. (`HR`) */
  static HR(t: any): void {
    if (t) Laya.Pool.recoverByClass(t);
  }
}
