// Singleton — lazy per-subclass singleton base.
//
// Faithful reconstruction of the original bundle's `C` base class
// (reconstruction/reference/bundle.pretty.js, line ~3174):
//
//   class C { static instance() { return this.Instance || (this.Instance = new this()), this.Instance; } }
//
// Each subclass gets its OWN `Instance` because `this` is the concrete subclass
// constructor at call time. Many managers extend this (SceneMgr, AudioMgr, ...).

/* eslint-disable @typescript-eslint/no-explicit-any */

export class Singleton {
  static instance<T>(this: new () => T): T {
    const ctor = this as any;
    return ctor.Instance || (ctor.Instance = new ctor());
  }
}
