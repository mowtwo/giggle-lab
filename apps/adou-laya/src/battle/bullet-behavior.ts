// BulletBehavior — base class for per-bullet effect behaviours.
//
// Faithful reconstruction of the original bundle's `Dh` class
// (reconstruction/reference/bundle.pretty.js lines ~17602-17612). A
// dependency-free base with the bullet lifecycle hooks that concrete bullet
// behaviours override. Hook names kept verbatim (overridden across many bullet
// types; the bundle only mangled them, semantics are: lifecycle callbacks).
//
//   Rm = active flag
//   jm(target) -> whether the behaviour applies (default true)
//   $m(a, b)   qm(a)   Hm(a)   onUpdate(a, b)   Zm(a)   Km(a)  -> lifecycle hooks

/* eslint-disable @typescript-eslint/no-explicit-any */

export class BulletBehavior {
  Rm = false;

  jm(_t: any): boolean {
    return true;
  }
  $m(_t: any, _s: any): void {}
  qm(_t: any): void {}
  Hm(_t: any): void {}
  onUpdate(_t: any, _s: any): void {}
  Zm(_t: any): void {}
  Km(_t: any): void {}
}
