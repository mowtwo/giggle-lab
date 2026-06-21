// Target-tracking bullet movements.
//
// Faithful reconstruction of the bundle's bullet movements: `oi` (homing bezier
// arc toward an enemy), `fi` (lock onto a moving object), `Kh` (straight line
// along a direction), `Xh` (sine-wave along a direction) and `Qh` (snap to an
// enemy) — reconstruction/reference/bundle.pretty.js lines ~10949-11041,
// ~11228-11274, ~17937, ~18513 and ~18596. All extend the bullet movement base
// and drive the bullet sprite each frame. Opaque field names kept verbatim.
//
//   TargetEnemyBezierMovement=oi  TargetObjectInstantaneous=fi
//   TargetDirectionLineMovement=Kh  TargetDirectionWaveMovement=Xh
//   TargetEnemyInstantaneous=Qh

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BulletMovementBase } from "./bullet-movement";
import { MathE } from "../core/math-e";
import { GameMgr } from "../core/game-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";

const f = MathE;
const F = GameMgr;
const Eh = EnemySpatialMgr;

/** Homing bezier arc toward an enemy by id. (`oi`) */
export class TargetEnemyBezierMovement extends BulletMovementBase {
  private cw = 0;
  private uw = new Laya.Point();
  private _lastPosition = new Laya.Point();
  private pw = new Laya.Point();
  private yw = new Laya.Point();
  private dw = 0;
  private Lw = false;
  private ww = false;
  private Sw = false;
  private fw = true;
  private mw = 0;
  private xw: any;

  static zL = "TargetEnemyBezierMovement";

  HL(): void {
    this.cw = 0;
    if (!this.fw) {
      this._lastPosition.setTo(this.Ym.x, this.Ym.y);
      this.uw.setTo(this.Ym.x, this.Ym.y);
      this.gw();
      this.pw.setTo(
        this.uw.x + (this.yw.x - this.uw.x) / 2,
        this.uw.y + (this.yw.y - this.uw.y) / 2 - this.dw,
      );
      if (this.Ym.fm) this.Ym.rotation = f.bezierTangentDeg(this.uw, this.pw, this.yw, 0) + 90;
    }
  }

  tm(t: number, s: number): void {
    let i = (t * this.YL * s) / 500;
    if (!this.fw) this.gw();
    if (this.Lw) {
      const total = f.distance(this.uw, this.yw);
      const remain = f.distance(this.Ym, this.yw);
      if (total > 0) {
        const h = Math.max(0.1, remain / total);
        i *= Math.sqrt(h);
      }
    }
    this.cw += i;
    const h = this.Ym.Pm;
    if (!(f.distanceSq(this.yw, h) < this.mw) && this.cw < 1) {
      f.quadraticBezierPoint(this.uw, this.pw, this.yw, h, this.cw);
      if (this.Ym.fm) {
        const s2 = f.angle(this._lastPosition, h);
        if (this.ww) {
          const i2 = h.rotation - s2;
          const e = i2 > 10;
          h.rotation = Laya.MathUtil.lerp(h.rotation, s2, e ? t / (1.5 * i2) : 1);
        } else h.rotation = s2;
      }
      this._lastPosition.setTo(h.x, h.y);
    } else this.Ym.Am();
    this.Ym.PL = this.cw >= 0.8;
  }

  /** Resolve the target enemy's center, else mark "lost". (`gw`) */
  private gw(): void {
    const t = this.xw.kw.get(this.FL);
    if (t) {
      this.yw.setTo(t.enemy.x, t.enemy.y);
      this.yw.x += F.instance().map.gridWid / 2;
      this.yw.y += F.instance().map.gridHei / 2;
    } else this.fw = true;
  }

  Zd(): void {
    this.mw = this.Sw ? this.Ym.Pm.height / 1.5 : 0;
    this.mw *= this.mw;
    if (this.fw) {
      this.Ym.Am(true);
      this.Ym.Im();
    }
  }

  jL(t: number, s: boolean, i: boolean, h: boolean): void {
    this.dw = t;
    this.Lw = s;
    this.ww = i;
    this.Sw = h;
    this.fw = true;
    this.xw = Eh.instance();
  }

  protected VL(t: number): void {
    if (this.xw.kw.get(t)) {
      this.fw = false;
      this.gw();
    } else this.fw = true;
  }

  protected NL(): void {}

  static create(t = 50, s = true, i = false, h = true): any {
    return super.create(t, s, i, h);
  }

  /** Tangent angle of the arc at its start, for a given origin. (`bw`) */
  bw(t?: any): number | null {
    if (this.fw) return null;
    if (!t) t = this.uw;
    this.gw();
    this.pw.setTo(t.x + (this.yw.x - t.x) / 2, t.y + (this.yw.y - t.y) / 2 - this.dw);
    return f.bezierTangentDeg(t, this.pw, this.yw, 0) + 90;
  }
}
TargetEnemyBezierMovement.zL = "TargetEnemyBezierMovement";

/** Lock the bullet onto a (possibly moving) display object. (`fi`) */
export class TargetObjectInstantaneous extends BulletMovementBase {
  private jw = false;
  private offsetX: any;
  private offsetY: any;
  private Vw = false;
  private Nw = false;
  private Qw = true;
  private qw: any;
  private Pm: any;

  static zL = "TargetObjectInstantaneous";

  tm(_t: number, _s: number): void {
    if (!this.jw) this.$w();
  }

  /** Snap the bullet sprite to the tracked object. (`$w`) */
  private $w(): void {
    if (this.Nw) {
      this.Pm.x = this.qw.x + this.offsetX;
      this.Pm.y = this.qw.y + this.offsetY;
    } else if (this.Pm.parent) {
      Laya.Point.TEMP.setTo(this.offsetX, this.offsetY);
      this.qw.localToGlobal(Laya.Point.TEMP);
      this.Pm.parent.globalToLocal(Laya.Point.TEMP);
      this.Pm.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    }
    if (this.Vw) this.Pm.rotation = this.qw.rotation;
  }

  HL(): void {
    this.Pm = this.Ym.Pm;
    this.$w();
  }

  Zd(): void {
    this.jw = false;
    this.offsetX = this.offsetX != null ? this.offsetX : this.qw.width / 2;
    this.offsetY = this.offsetY != null ? this.offsetY : this.qw.height / 2;
    if (this.Qw)
      this.qw.once(Laya.Event.REMOVED, this, () => {
        this.jw = true;
        this.Ym.Am();
      });
  }

  jL(t: any, s: any = undefined, i: any = undefined, h = false, e = false, a = true): void {
    this.qw = t;
    this.offsetX = s;
    this.offsetY = i;
    this.Vw = h;
    this.Nw = e;
    this.Qw = a;
  }

  static create(t: any, s?: any, i?: any, h = true, e = true, a = true): any {
    return super.create(t, s, i, h, e, a);
  }

  protected NL(): void {
    if (this.qw) {
      this.qw.offAllCaller(this);
      this.qw = null;
    }
    this.Qw = true;
    this.jw = false;
  }
}
TargetObjectInstantaneous.zL = "TargetObjectInstantaneous";

/** Straight line along a fixed direction. (`Kh`) */
export class TargetDirectionLineMovement extends BulletMovementBase {
  static zL = "TargetDirectionLineMovement";

  Zd(): void {
    Laya.Vector2.normalize(this.XL, this.XL);
  }
  HL(): void {
    if (this.Ym.fm) this.Ym.rotation = f.angle(Laya.Vector2.ZERO, this.XL);
  }
  tm(t: number, s: number): void {
    const i = this.Ym.Pm;
    i.x += this.XL.x * t * this.YL * s;
    i.y += this.XL.y * t * this.YL * s;
  }
  jL(): void {}
  protected NL(): void {}
  static create(): any {
    return super.create();
  }
}
TargetDirectionLineMovement.zL = "TargetDirectionLineMovement";

/** Sine-wave path along a fixed direction. (`Xh`) */
export class TargetDirectionWaveMovement extends BulletMovementBase {
  private _lastPosition = new Laya.Point();
  private yE = 0;
  private fE = 0;
  private a = 0;
  private b = 0;
  private offset = 0;

  static zL = "TargetDirectionWaveMovement";

  Zd(): void {
    Laya.Vector2.normalize(this.XL, this.XL);
  }
  HL(): void {
    this.yE = Laya.timer.currTimer;
    this.fE = 0;
    if (this.Ym.fm) this.Ym.rotation = f.angle(Laya.Vector2.ZERO, this.XL);
  }
  tm(t: number, s: number): void {
    this.fE += t;
    const i = (Laya.timer.currTimer - this.yE) / 50;
    const h = (this.fE / 10) * this.YL * s;
    const e = this.Ym.Pm;
    const a = this.Ym.wm.x + this.XL.x * h;
    const n = this.Ym.wm.y + this.XL.y * h;
    const r = Math.sin(i * this.a + this.offset) * this.b;
    e.x = a + r * this.XL.y;
    e.y = n - r * this.XL.x;
    e.rotation = f.angle(this._lastPosition, e);
    this._lastPosition.setTo(e.x, e.y);
  }
  jL(t: number, s: number, i: number): void {
    this.a = t;
    this.b = s;
    this.offset = i;
  }
  protected NL(): void {}
  static create(t: number, s: number, i: number): any {
    return super.create(t, s, i);
  }
}
TargetDirectionWaveMovement.zL = "TargetDirectionWaveMovement";

/** Snap the bullet onto an enemy each frame. (`Qh`) */
export class TargetEnemyInstantaneous extends BulletMovementBase {
  private ZE: any;
  private offsetX = 0;
  private offsetY = 0;
  private fw = false;
  private xw: any;

  static zL = "TargetEnemyInstantaneous";

  tm(_t: number, _s: number): void {
    if (!this.fw) this.$w();
  }
  private $w(): void {
    this.Ym.Pm.x = this.ZE.enemy.x + this.offsetX;
    this.Ym.Pm.y = this.ZE.enemy.y + this.offsetY;
  }
  HL(): void {
    this.$w();
  }
  Zd(): void {
    const t = F.instance().map;
    this.offsetX = t.gridWid / 2;
    this.offsetY = t.gridHei / 2;
    if (this.fw) {
      this.Ym.Am(true);
      this.Ym.Im();
    }
  }
  protected VL(t: number): void {
    this.ZE = this.xw.kw.get(t);
    if (this.ZE) {
      this.fw = false;
      this.ZE.once(
        "onDead",
        () => {
          this.fw = true;
          this.Ym.Am();
        },
        this,
      );
    } else this.fw = true;
  }
  jL(): void {
    this.fw = true;
    this.xw = Eh.instance();
  }
  protected NL(): void {
    if (this.ZE) {
      this.ZE.offAllCaller(this);
      this.ZE = null;
    }
  }
  static create(): any {
    return super.create();
  }
}
TargetEnemyInstantaneous.zL = "TargetEnemyInstantaneous";
