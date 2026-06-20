// Bullet — projectile base (the bundle's `ni`) + SimpleDynamicArrow (`ri`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~10763-10945. A Bullet owns a sprite (`Pm`, assigned by BulletFactory), a
// movement object (`Om`), a hit strategy (`km`) and a list of behaviours
// (`gm`). It runs a fire/hit/update/recover lifecycle and dispatches the
// BulletEvent.* events. Concrete bullets implement the hooks (Zd/Hm/$m/qm/Zm/
// onReset/onUpdate/tw). Opaque fields kept verbatim. Damage `Sm` defaults to the
// owner's attack power.

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */

import { HitStrategy102, HitStrategyFactory } from "./hit-strategy";
import { DefaultBulletMovement, BulletEvent } from "./bullet-movement";
import { EffectMgr } from "./effect-mgr";

export abstract class Bullet {
  rm: any = { om: undefined, lm: undefined, um: undefined };
  pm = false;
  ym = false;
  fm = true;
  gm: any[] = [];
  dm = new Set<any>();
  lm = 0;
  Lm = false;
  um = 1;
  wm = new Laya.Point();
  vm = false;
  km: any = HitStrategy102.AL;
  PL = true;
  _m = false;
  xm: string;

  // Assigned by BulletFactory.jA: sprite, spatial mgr, game hub, owner.
  Pm: any;
  xw: any;
  dg: any;
  bm: any;
  protected Mm = 0;
  protected Om: any;
  protected Um: any;
  protected Gm = false;
  protected Bm = false;
  protected Em = false;
  protected Jm = false;
  id = 0;

  constructor(poolKey?: string) {
    this.xm = poolKey || "";
  }

  /** Damage; defaults to the owner's attack power when not set explicitly. (`Sm`) */
  get Sm(): number {
    if (!this.pm) {
      if (!this.bm) this.Mm = 0;
      this.Mm = this.bm.Ta;
    }
    return this.Mm;
  }
  set Sm(v: number) {
    this.pm = true;
    this.Mm = v;
  }

  set rotation(r: number) {
    this.Pm.rotation = r;
  }
  once(t: string, a: any, b?: Function): any {
    return b ? this.Pm.once(t, b, a) : this.Pm.once(t, a);
  }
  on(t: string, a: any, b?: Function): any {
    return b ? this.Pm.on(t, b, a) : this.Pm.on(t, a);
  }
  off(t: string, listener: Function): any {
    return this.Pm.off(t, listener);
  }
  get x(): number {
    return this.Pm.x;
  }
  get y(): number {
    return this.Pm.y;
  }
  pos(x: number, y: number): any {
    return this.Pm.pos(x, y);
  }

  Am(flag = false): void {
    if (!this._m) {
      this.Em = flag;
      this.Bm = true;
    }
  }
  Im(): void {
    this.Pm.visible = false;
  }
  Dm(): void {
    this.Pm.visible = true;
  }

  /** Add a behaviour (persistent ones survive recover). (`Tm`) */
  Tm(behavior: any, persistent = false): any {
    behavior.Rm = persistent;
    this.gm.push(behavior);
    return behavior;
  }
  Cm(cls: any): any {
    return this.gm.find((b) => b instanceof cls);
  }

  init(): void {
    this.Um = this.km;
    this.Zd();
  }

  resetData(spec: any): void {
    this.ym = false;
    this._m = false;
    this.Bm = false;
    this.bm = spec.bm;
    if (spec.Sm !== undefined) this.Sm = spec.Sm;
    if (spec.Fm !== undefined) this.um = spec.Fm;
    if (this.onReset(spec) === false) {
      this.ym = true;
      this.Om = DefaultBulletMovement.create();
      this.Am(true);
      return;
    }
    this.Om = spec.Om ? spec.Om : DefaultBulletMovement.create();
    this.Om.Ym = this;
    this.Om.Zd();
  }

  /** Fire: run the fire hooks + emit onFire. (`Xm`) */
  Xm(): void {
    if (this.Gm || this._m || this.ym) return;
    this.Gm = true;
    if (this.Bm) return;
    this.Hm();
    this.gm.forEach((b) => b.Hm(this));
    this.Pm.event(BulletEvent.sm);
    this.wm.setTo(this.Pm.x, this.Pm.y);
    this.Om.HL();
  }

  /** Whether this bullet may hit the enemy. (`Wm`) */
  Wm(enemy: any): boolean {
    return this.zm(enemy) && !this.gm.some((b) => !b.jm(enemy));
  }

  hit(enemy: any): void {
    this.Pm.event(BulletEvent.im, enemy.id);
    this.$m(enemy);
    this.gm.forEach((b) => b.$m(enemy, this));
  }

  update(delta: number): void {
    this.onUpdate(delta);
    this.gm.forEach((b) => b.onUpdate(delta, this));
  }

  /** (`Nm`) */
  Nm(): void {
    this.qm();
    this.gm.forEach((b) => b.qm(this));
    this.Pm.event(BulletEvent.nm);
  }

  /** (`Vm`) */
  Vm(): void {
    this.Qm();
    this.Pm.event(BulletEvent.am);
  }

  recover(): void {
    if (!this.ym) this.Zm();
    this.gm.forEach((b) => {
      b.Zm(this);
      if (!b.Rm) b.Km(this);
    });
    this._m = true;
    this.Gm = false;
    this.PL = true;
    this.Bm = false;
    this.Em = false;
    this.Lm = false;
    this.Jm = false;
    this.ym = false;
    this.Om.$L();
    this.Om = null;
    this.dm.clear();
    this.gm = this.gm.filter((b) => b.Rm);
    if (this.Um !== this.km) {
      HitStrategyFactory.recover(this.Um);
      this.Um = this.km;
    }
    this.rm = { om: undefined, lm: undefined, um: undefined };
    this.Dm();
    this.Pm.event(BulletEvent.hm);
    this.Pm.offAll();
  }

  dispose(): void {
    this.tw();
  }

  /** Whether this bullet can hit `enemy` (default yes). (`zm`) */
  protected zm(_enemy: any): boolean {
    return true;
  }
  /** onRequestRemove hook (default empty). (`Qm`) */
  protected Qm(): void {}

  gameOver(): void {
    this.dispose();
  }

  // Concrete-bullet hooks.
  protected abstract Zd(): void;
  protected abstract Hm(): void;
  protected abstract $m(enemy: any): void;
  protected abstract qm(): void;
  protected abstract Zm(): void;
  protected abstract onReset(spec: any): boolean | void;
  protected abstract onUpdate(delta: number): void;
  protected abstract tw(): void;

  static sw = "";
}

/** SimpleDynamicArrow — a straight arrow that hits one enemy. (`ri`) */
export class SimpleDynamicArrow extends Bullet {
  static sw = "SimpleDynamicArrow";
  private iw = false;

  protected tw(): void {}

  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(22, 72);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.9;
  }

  /** Attach the arrow image (and optional size/scale/anchor overrides). (`hw`) */
  hw(cfg: any): void {
    const img = new Laya.Image(cfg.ew);
    img.size(22, 72);
    this.Pm.addChild(img);
    if (cfg.aw) {
      this.Pm.size(cfg.aw.x, cfg.aw.y);
      img.size(cfg.aw.x, cfg.aw.y);
    }
    if (cfg.nw) this.Pm.scale(cfg.nw.x, cfg.nw.y);
    if (cfg.rw) this.Pm.anchor(cfg.rw.x, cfg.rw.y);
  }

  protected Hm(): void {}

  protected $m(enemy: any): void {
    enemy.hit(this.Sm, this.bm);
    const s = enemy.enemy.width / 2;
    const i = enemy.enemy.height / 2;
    if (this.iw) EffectMgr.instance().playPikeHit(enemy.enemy, s, i);
    else EffectMgr.instance().playBowHit(enemy.enemy, s, i);
  }

  protected qm(): void {}
  protected Zm(): void {}
  protected onReset(spec: any): void {
    this.iw = !!spec.ow?.iw;
  }
  protected onUpdate(_delta: number): void {}
}
