// WeaponComponent — base class for a general's equipped weapon (the bundle's `ge`).
//
// Faithful reconstruction of the bundle's `ge` (reconstruction/reference/
// bundle.pretty.js lines ~19462-19691). Owns the weapon visual (`Hn`), attaches
// to a General, runs its idle sway / attack state machine, and exposes the hooks
// concrete weapons use to spawn bullets with a movement (`Om`) + hit strategy
// (`Um`) toward a target. Opaque field / method names kept verbatim (the weapon
// subclasses + factory rely on this exact contract).
//
//   visual=Hn  general=general  attack=attack  spawnHook=AI  strategyOverride=iI/EI
//   movementOverride=tI/BI  buildStrategy=dI  applyStrategy=DI  applyMovement=TI
//   aimAngle=CI  trackTween=UI  trackBullet=FI

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { MathE } from "../core/math-e";
import { LayerZ } from "../core/layer-z";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BulletSpawnMgr } from "./bullet-spawn-mgr";
import { HitStrategyFactory } from "./hit-strategy";

const F = GameMgr;
const f = MathE;
const X = LayerZ;
const Eh = EnemySpatialMgr;
const fe = BulletSpawnMgr;
const si = HitStrategyFactory;

export class WeaponComponent {
  protected JB = true;
  protected tI: any = null;
  protected sI = true;
  protected iI: any = null;
  protected hI: any[] = [-1];
  protected eI: any = null;
  id = 0;
  weaponId = -1;
  txt = "";
  rarity = 0;
  intro = "";
  protected aI = 0;
  protected fL = 1;
  protected nI: any = null;
  protected rI = 0;
  protected oI = 0;
  protected lI = new Laya.Point(0, 0);
  protected Yv = new Laya.Point();
  protected cI = 0;
  protected uI: any[] = [];
  protected pI: any[] = [];

  type = 0;
  Hn: any; // weapon visual sprite (built by concrete weapon subclasses)
  protected general: any;
  protected currentState = -1;
  protected _I: any;
  protected LI: any;
  protected GI: any;
  protected xE: any;
  protected xw: any;
  protected dg: any;

  get yI(): boolean {
    return this.tI != null;
  }
  get fI(): boolean {
    return this.iI != null;
  }
  get gI(): any {
    if (this.fI) {
      const t = this.dI(this.iI, this.LI);
      this.iI = null;
      return t;
    }
    return null;
  }
  get name(): string {
    return (this.constructor as any).weaponName;
  }

  pos(t: number, s: number): void {
    this.Hn.pos(t, s);
  }
  get rotation(): number {
    return this.Hn.rotation;
  }
  set rotation(t: number) {
    this.Hn.rotation = t;
  }
  get x(): number {
    return this.Hn.x;
  }
  get y(): number {
    return this.Hn.y;
  }

  init(t: number, s: number): void {
    this.weaponId = t;
    this.type = s;
    this.xE = fe.instance();
    this.xw = Eh.instance();
    this.dg = F.instance();
    if (t >= 0) {
      const cfg = this.dg.weaponData.weapons.get(t);
      this.type = cfg.type;
      this.txt = cfg.txt;
      this.rarity = cfg.rarity;
      this.intro = cfg.intro;
      this.aI = Number(cfg.addAttPower);
    }
  }

  /** Attach to a general. (`mI`) */
  mI(t: any): void {
    this.general = t;
    t.leftWord.addChild(this.Hn);
    this.Hn.zIndex = X.Lr;
    this.pos(0, 0);
    this.wI();
    if (t.currentState === "GeneralIdle" || t.currentState === "UnitIdle") this.changeState(0);
  }

  changeState(t: number): void {
    if (t === this.currentState) return;
    if (this.currentState === 0) this.vI();
    else if (this.currentState === 1) this.kI();
    this.currentState = t;
    if (t === 0) {
      if (this.lI.x === 0 && this.lI.y === 0) {
        this.lI.x = this.Hn.x;
        this.lI.y = this.Hn.y;
      }
      this._I = Laya.Tween.create(this.Hn).duration(1000).then(this.xI, this);
    } else if (t === 1) {
      if (this._I) {
        this._I.kill(false);
        this._I = null;
      }
      this.SI();
    }
  }

  gameOver(): void {}

  /** Idle sway loop. (`bI`) */
  protected bI(): void {
    Laya.Tween.create(this.Hn)
      .to("rotation", 3)
      .duration(600)
      .chain()
      .to("rotation", -3)
      .duration(600)
      .delay(100)
      .then(this.bI, this);
  }
  protected xI(): void {
    Laya.Tween.create(this.Hn).to("rotation", this.oI).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    Laya.Tween.killAll(this.Hn);
  }
  protected SI(): void {}
  protected kI(): void {}
  protected wI(): void {}
  MI(): void {
    this.removeSelf();
  }

  /** Hook: subclass spawns its bullet(s) at the target. (`AI`) */
  protected AI(_t: any): void {}

  attack(t: any): void {
    if (t) {
      this.hI = [t.id];
      this.eI = null;
      this.AI(t);
      if (this.fI) this.iI = null;
      this.hI = [null];
      this.eI = null;
    }
  }

  /** Override the next bullet's hit strategy. (`EI`) */
  EI(t: any, s: any): void {
    if (this.sI) {
      this.iI = t;
      this.LI = s;
    }
  }
  /** Override the next bullet's movement factory. (`BI`) */
  BI(t: any): void {
    if (this.JB) this.tI = t;
  }
  /** Set the aim direction + target ids. (`II`) */
  II(t: any, s: any): void {
    this.eI = t;
    if (s) {
      if (Array.isArray(s)) {
        if (s.length === 1) this.hI[0] = s[0];
        else this.hI = s;
      } else this.hI[0] = s;
    }
  }
  /** Apply the resolved hit strategy onto a bullet spec. (`DI`) */
  DI(t: any, s: any, i: any): void {
    if (this.fI) t.Um = this.dI(this.iI, this.LI);
    else t.Um = s ? this.dI(s, i) : undefined;
  }
  /** Apply the resolved movement onto a bullet spec. (`TI`) */
  TI(t: any, s: any): void {
    if (this.yI) t.Om = this.tI().qL(this.hI[0]).QL(this.eI);
    else t.Om = s().qL(this.hI[0]).QL(this.eI);
  }
  /** Build a hit strategy, defaulting the target list for type 100. (`dI`) */
  dI(t: any, s: any): any {
    if (t === 100) {
      if (s) {
        if (!(("FL" in s && s.FL))) s.FL = this.hI;
      } else s = { FL: this.hI };
    }
    return si.produce(t, s);
  }
  RI(t: any): any {
    return t.qL(this.hI[0]).QL(this.eI);
  }
  /** Aim angle from the weapon to enemy `t`. (`CI`) */
  CI(t: number): number {
    const s = this.xw.kw.get(t);
    if (!s) {
      console.log("敌人已经死亡 使用最近一次的角度作为武器角度");
      return this.cI;
    }
    const i = this.dg.map;
    const h = this.Yv;
    h.setTo(this.Hn.pivotX, this.Hn.pivotY);
    this.dg.toLocal(this.Hn, h);
    const e = Laya.Point.TEMP;
    e.setTo(s.x + i.gridWid / 2, s.y + i.gridHei / 2);
    let a = f.angle(h, e);
    a = f.normalizeDeg(a);
    const n = this.Hn.rotation;
    const r = f.deltaAngle(n, a);
    this.cI = n + r;
    return this.cI;
  }

  /** Track a tween for cleanup. (`UI`) */
  UI(t: any): any {
    this.uI.push(t);
    return t;
  }
  /** Track a bullet for cleanup. (`FI`) */
  FI(t: any): void {
    this.pI.push(t);
  }
  OI(t?: any): void {
    if (t) {
      const s = this.uI.indexOf(t);
      if (s >= 0) this.uI.splice(s, 1);
    } else this.uI.length = 0;
  }
  YI(t?: any): void {
    if (t) {
      const s = this.pI.indexOf(t);
      if (s >= 0) this.pI.splice(s, 1);
    } else this.pI.length = 0;
  }
  XI(): void {
    this.GI = null;
  }
  HI(t: any): void {
    this.GI = t;
  }

  removeSelf(): void {
    this.GI?.call(this);
    this.uI.forEach((t) => t.kill(true));
    this.pI.forEach((t) => t.Am());
    this.Hn.removeSelf();
    this.nI?.removeSelf();
    this.nI = null;
  }

  /** Attach a sub-visual (e.g. pike head). (`WI`) */
  WI(t: any): void {
    this.nI = t;
    if (this.type === 1) this.Hn.getChildByName("pikeWeaponImage").addChild(this.nI);
  }
}
