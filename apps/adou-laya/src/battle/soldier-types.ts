// Concrete soldier types + the soldier-class registry (`di`).
//
// Faithful reconstruction of the bundle's `di.rv` map (reconstruction/reference/
// bundle.pretty.js lines ~11441-11765): knife (0), bow (1 = `ci`), pike (2),
// cavalry (3) and the GeneralPart (4 = `gi`). Each extends BaseSoldier and
// implements its attack — spawning the right bullet via the bullet spawn
// manager with the matching hit strategy + movement. Opaque field names kept
// verbatim.
//
//   KnifeSoldier=di.rv[0]  BowSoldier=ci  PikeSoldier=di.rv[2]  CavalrySoldier=di.rv[3]

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseSoldier } from "./base-soldier";
import { GeneralPart } from "./general-part";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BulletSpawnMgr } from "./bullet-spawn-mgr";
import { HitStrategyFactory } from "./hit-strategy";
import { KnifeBullet, PikeBullet } from "./bullets-area";
import { SimpleDynamicArrow } from "./bullet";
import { TargetEnemyBezierMovement, TargetObjectInstantaneous } from "./movements";

const F = GameMgr;
const $ = AudioMgr;
const f = MathE;
const li = Laya.Point;

/** Knife soldier (melee arc onto the nearest enemy). (`di.rv[0]`) */
export class KnifeSoldier extends BaseSoldier {
  constructor() {
    super();
    this.vL = "knife";
  }
  attack(): void {
    this.ov();
  }
  init(t: any, s: any): void {
    this.vL = "knife";
    super.init(t, s);
  }
  protected setupAnim(): void {
    super.setupAnim();
    this.hL.scale(1, 1);
  }
  protected ov(): void {
    this.Ew = EnemySpatialMgr.instance().lv(
      this.Yn.x + this.Yn.width / 2,
      this.Yn.y + this.Yn.height / 2,
      this.Da,
      this.qd,
    );
    if (!this.Ew || this.Ew.length <= 0) {
      this.changeState("UnitIdle");
      return;
    }
    let t = this.Ew[0];
    let s = f.distance({ x: this.Yn.x, y: this.Yn.y }, { x: t.x, y: t.y });
    for (let i = 1; i < this.Ew.length; i++) {
      const h = f.distance(
        { x: this.Yn.x + this.Yn.width / 2, y: this.Yn.y + this.Yn.height / 2 },
        { x: this.Ew[i].x + F.instance().map.gridWid / 2, y: this.Ew[i].y + F.instance().map.gridHei / 2 },
      );
      if (h < s) {
        t = this.Ew[i];
        s = h;
      }
    }
    const spec = {
      type: KnifeBullet,
      bm: this,
      Sm: this.Ta,
      Um: HitStrategyFactory.produce(100, { FL: t.id, BL: true, IL: "hitEnable", DL: 500 / this.fL }),
      xm: "knifeSoliderAttack",
    };
    BulletSpawnMgr.instance().Tw(spec).Xm();
    $.instance().playSound("knife_attack");
    this.hL.on(Laya.Event.STOPPED, this, () => {
      this.hL.offAll(Laya.Event.STOPPED);
    });
    this.hL.play("attack", false);
  }
}

/** Bow soldier (homing arrow at the closest visible target). (`ci`) */
export class BowSoldier extends BaseSoldier {
  private Mw = 0;
  private Iw = 0;
  private config: any;

  constructor() {
    super();
    this.vL = "bow";
    this.Mw = 0;
    this.Wd = 1000;
    this.config = {
      type: SimpleDynamicArrow,
      ow: { xm: "弓箭小兵箭矢", ew: "resources/img/weapon/arrow_0.png" },
      Sm: this.Ta,
      bm: this,
      Fm: 1.75,
    };
  }
  protected Zd(t?: any): void {
    super.Zd(t);
    this.hL.setInitPlaybackRate(1.25);
  }
  protected onAttackExit(): void {
    Laya.Tween.create(this.hL).to("rotation", 0).duration(650).ease(Laya.Ease.linearInOut);
  }
  /** Choose the closest (optionally still-alive) target. (`Pw`) */
  private Pw(t = false): any {
    let s = { id: -1, x: 0, y: 0, Aw: Infinity };
    for (let i = 0; i < this.Ew.length; i++) {
      const h = this.Ew[i];
      if (t) {
        const e = EnemySpatialMgr.instance().kw.get(h.id);
        if (!e || !e.Bw) continue;
      }
      if (h.Aw < s.Aw) s = h;
    }
    return s;
  }
  attack(): void {
    const t = this.Pw();
    this.Iw = t.id;
    if (t.id < 0) return;
    Laya.Point.TEMP.setTo(this.Yn.x + this.Yn.width / 2, this.Yn.y + this.Yn.height / 2);
    const s = this.bw(li.TEMP, t.id, 120);
    this.hL.on(Laya.Event.STOPPED, this, () => {
      this.hL.offAll(Laya.Event.STOPPED);
      this.Dw();
    });
    this.hL.play("attack", false, true, 0, 650);
    const i = this.hL.rotation;
    const h = f.deltaAngle(i, s);
    Laya.Tween.to(this.hL, { rotation: i + h }, 650, Laya.Ease.linearInOut);
  }
  /** Fire the arrow at the locked target. (`Dw`) */
  private Dw(): void {
    $.instance().playSound("bow_attack");
    const t = EnemySpatialMgr.instance().kw.get(this.Iw);
    if (!(t && t.Bw)) this.Iw = this.Pw(true).id;
    this.config.Um = HitStrategyFactory.produce(100, { FL: this.Iw });
    this.config.Om = TargetEnemyBezierMovement.create(120, true).qL(this.Iw);
    this.hL.play("attack", false, true, 650, 1000);
    F.instance().toLocal(this.Yn, true);
    this.config.Sm = this.Ta;
    BulletSpawnMgr.instance().Tw(this.config, Laya.Point.TEMP).Xm();
  }
  /** Target enemy center point. (`gw`) */
  private gw(t: number): any {
    const s = EnemySpatialMgr.instance().kw.get(t);
    return s
      ? li.create().setTo(s.enemy.x + F.instance().map.gridWid / 2, s.enemy.y + F.instance().map.gridHei / 2)
      : null;
  }
  /** Launch angle for the homing arc from origin `t` to target `s`. (`bw`) */
  private bw(t: any, s: number, i: number): number | null {
    const h = this.gw(s);
    if (!h) return null;
    const e = li.create();
    e.setTo(t.x + (h.x - t.x) / 2, t.y + (h.y - t.y) / 2 - i);
    const a = f.bezierTangentDeg(t, e, h, 0);
    e.recover();
    h.recover();
    return a + 90;
  }
  gameOver(): void {
    Laya.Tween.killAll(this.hL);
    this.hL.rotation = 0;
    super.gameOver();
  }
}

/** Pike soldier (rotating thrust beam). (`di.rv[2]`) */
export class PikeSoldier extends BaseSoldier {
  private cv = { x: 0, y: 0 };
  private pv: any;
  private yv: any;
  private fv: any;

  constructor() {
    super();
    this.vL = "pike";
    this.cv = { x: 0, y: 0 };
  }
  protected setupAnim(): void {
    super.setupAnim();
    if (!this.pv) {
      this.pv = new Laya.Image("resources/img/gameObject/soldier/pike.png");
      this.pv.size(30, 71);
      this.pv.anchorX = 0.5;
      this.pv.anchorY = 0.5;
      this.yv = new Laya.Image("resources/img/gameObject/soldier/pikeEff1.png");
      this.yv.size(30, 76);
      this.yv.pos(1, -36);
      this.pv.addChild(this.yv);
      this.fv = new Laya.Point(this.pv.width / 2, 0);
    }
    this.pv.pos(23, 38);
    this.pv.visible = true;
    this.Yn.addChild(this.pv);
    this.cv.x = this.pv.x;
    this.cv.y = this.pv.y;
    this.yv.visible = false;
  }
  protected playIdle(): void {
    super.playIdle();
    this.pv.rotation = this.pv.rotation % 360;
    if (this.pv.rotation < -180) this.pv.rotation += 360;
    else if (this.pv.rotation >= 180) this.pv.rotation -= 360;
  }
  protected idle(t: number): void {
    super.idle(t);
    if (this.pv.rotation !== 0) {
      const s = t;
      if (this.pv.rotation > 0) this.pv.rotation -= 20 * s;
      else this.pv.rotation += 20 * s;
      if (Math.abs(this.pv.rotation) < 10 * s) this.pv.rotation = 0;
    }
  }
  attack(): void {
    if (this.pv.rotation < 0) this.pv.rotation += 360;
    this.ov();
  }
  protected ov(): void {
    if (!this.Ew || this.Ew.length <= 0) return;
    let t = this.Ew[0];
    let s = f.distance({ x: this.Yn.x, y: this.Yn.y }, { x: t.x, y: t.y });
    const i = this.Yn.x + this.pv.x;
    const h = this.Yn.y + this.pv.y;
    for (let e = 1; e < this.Ew.length; e++) {
      const a = f.distance(
        { x: i, y: h },
        { x: this.Ew[e].x + F.instance().map.gridWid / 2, y: this.Ew[e].y + F.instance().map.gridHei / 2 },
      );
      if (a < s) {
        t = this.Ew[e];
        s = a;
      }
    }
    const e = f.angle(
      { x: i, y: h },
      { x: t.x + F.instance().map.gridWid / 2, y: t.y + F.instance().map.gridHei / 2 },
    );
    let a = e;
    let n = 1;
    if (a > this.pv.rotation) {
      if (Math.abs(a - this.pv.rotation) > 180) {
        n = -1;
        a = -(360 - e);
      }
    } else if (Math.abs(a - this.pv.rotation) > 180) a = 360 + e;
    else n = -1;
    void n;
    this.mL = false;
    this.hL.on(Laya.Event.STOPPED, this, () => {
      this.mL = true;
      this.hL.offAll(Laya.Event.STOPPED);
    });
    this.hL.play("attack", false);
    const r = BulletSpawnMgr.instance().Tw({
      type: PikeBullet,
      Om: TargetObjectInstantaneous.create(this.pv, this.fv.x, this.fv.y, false, false),
      bm: this,
      Sm: this.Ta,
      Cw: { pos: { x: this.fv.x, y: this.fv.y }, bold: 15, length: 71, rotation: e, BL: false },
    });
    Laya.Tween.create(this.pv)
      .duration(90 / this.fL)
      .to("rotation", a)
      .then(() => {
        this.pv.rotation = e;
      }, this)
      .chain()
      .duration(270 / this.fL)
      .to("x", this.cv.x + -10 * Math.sin(e * (Math.PI / 180)))
      .to("y", this.cv.y - -10 * Math.cos(e * (Math.PI / 180)))
      .then(() => {
        this.yv.y = -36;
        this.yv.visible = true;
        Laya.Tween.create(this.yv).to("y", -50).duration(100);
        $.instance().playSound("general_pike_attack");
      })
      .chain()
      .duration(120 / this.fL)
      .to("x", this.cv.x + 100 * Math.sin(e * (Math.PI / 180)))
      .to("y", this.cv.y - 100 * Math.cos(e * (Math.PI / 180)))
      .onStart(() => {
        r.Xm();
      }, this)
      .then(() => {
        this.yv.visible = false;
        r.Am();
      }, this)
      .chain()
      .duration(90 / this.fL)
      .to("x", this.cv.x)
      .to("y", this.cv.y);
  }
  protected onAttackExit(): void {
    super.onAttackExit();
    Laya.Tween.killAll(this.pv);
    this.pv.x = this.cv.x;
    this.pv.y = this.cv.y;
    this.yv.visible = false;
  }
  gameOver(): void {
    super.gameOver();
    Laya.Tween.killAll(this.pv);
    if (this.pv) {
      this.pv.visible = false;
      this.pv.rotation = 0;
      this.pv.removeSelf();
    }
  }
}

/** Cavalry soldier (twin wide sweeps). (`di.rv[3]`) */
export class CavalrySoldier extends BaseSoldier {
  constructor() {
    super();
    this.vL = "cavalry";
  }
  init(t: any, s: any): void {
    this.vL = "cavalry";
    super.init(t, s);
  }
  protected setupAnim(): void {
    super.setupAnim();
  }
  attack(): void {
    this.ov();
  }
  protected ov(): void {
    this.hL.play("attack", false);
    const t: any = {
      type: PikeBullet,
      bm: this,
      Sm: this.Ta / 2,
      xm: "cavalrySweep",
      Cw: {
        pos: new Laya.Point(this.Yn.x + this.Yn.width / 2, this.Yn.y + this.Yn.height / 2),
        bold: 5,
        length: this.Da / 2,
        rotation: 60,
        Uw: 300,
        Ow: -300,
        Gw: true,
        Ww: true,
      },
    };
    $.instance().playSound("cavalry_attack");
    const s = BulletSpawnMgr.instance().Tw(t);
    t.Cw.length = this.Da;
    const i = BulletSpawnMgr.instance().Tw(t);
    Laya.timer.once(150, this, () => {
      s.Xm();
      i.Xm();
    });
  }
}

/** Soldier-class registry by type index. (`di`) */
export const di: { rv: Record<number, any> } = {
  rv: {
    0: KnifeSoldier,
    1: BowSoldier,
    2: PikeSoldier,
    3: CavalrySoldier,
    4: GeneralPart,
  },
};
