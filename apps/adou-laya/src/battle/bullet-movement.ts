// Bullet movement base + event constants.
//
// Faithful reconstruction of the bundle's `hi` (movement base), `ei` (default
// movement) and `ai` (bullet event names) — reconstruction/reference/
// bundle.pretty.js lines ~10709-10765. Movement objects are pooled (by their
// static `zL` key) and drive a bullet's per-frame position; the hook methods
// (VL/ZL/JL/HL/WL/NL/jL) are overridden by concrete movements. Opaque fields
// kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { MathE } from "../core/math-e";

export class BulletMovementBase {
  YL = 1;
  FL = -1;
  XL = new Laya.Vector2(); // direction
  GL = new Laya.Point(); // target point

  static zL = "BulletMovementBase";

  HL(): void {}
  WL(): void {}

  static create(...args: any[]): any {
    const cls: any = this;
    const item = Laya.Pool.getItemByCreateFun(cls.zL, () => new cls());
    item.jL(...args);
    return item;
  }

  /** Recover to the pool (after the cleanup hook). (`$L`) */
  $L(): void {
    this.NL();
    Laya.Pool.recover((this.constructor as any).zL, this);
  }

  qL(t: number): this {
    this.FL = t;
    this.VL(t);
    return this;
  }

  /** Set direction from a Vector2 or an angle. (`QL`) */
  QL(t: any): this {
    if (t instanceof Laya.Vector2) t.cloneTo(this.XL);
    else if (typeof t === "number") MathE.angleToDirection(t, this.XL);
    this.ZL(this.XL);
    return this;
  }

  /** Set target point. (`KL`) */
  KL(t: any): this {
    this.GL.setTo(t.x, t.y);
    this.JL(this.GL);
    return this;
  }

  // Subclass hooks.
  protected VL(_t: number): void {}
  protected ZL(_t: any): void {}
  protected JL(_t: any): void {}
  protected NL(): void {}
  jL(..._args: any[]): void {}
  Zd(..._args: any[]): void {}
  tm(_t: any, _s: any): void {}
}

export class DefaultBulletMovement extends BulletMovementBase {
  static zL = "DefaultBulletMovement";
  Zd(..._args: any[]): void {}
  tm(_t: any, _s: any): void {}
  jL(..._args: any[]): void {}
  protected NL(): void {}
}

/** Bullet lifecycle event names. (`ai`) */
export const BulletEvent = {
  sm: "onFire",
  im: "onHit",
  hm: "onRemove",
  am: "onRequestRemove",
  nm: "onHitFinished",
} as const;
