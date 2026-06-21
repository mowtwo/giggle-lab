// Special weapon bullets + bullet behaviours.
//
// Faithful reconstruction of the bundle's weapon-specific bullets and the
// behaviours they carry — reconstruction/reference/bundle.pretty.js lines
// ~17641-18650. Bullets extend Bullet (`ni`); behaviours extend BulletBehavior
// (`Dh`) and are attached via `Tm`. Each registers a creator with the
// BulletFactory by its static `sw` name. Opaque field names kept verbatim.
//
//   KnockbackBehavior=Th  SlowRecoverBehavior=Rh  EagleArrow=Ch  TrailBehavior=Oh
//   FireArrow=Yh  VirtualBullet=Gh  StaticFireBall=Hh  FireDragonArrow=Wh/zh
//   ExplosionBehavior=jh  BurnBehavior=$h  FireExplosiveArrow=Nh
//   HuoFengHuangArrow=qh  LightningChain=Vh  LightningArrow=Zh  ShenBiArrow=Jh

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Bullet, SimpleDynamicArrow } from "./bullet";
import { BulletBehavior } from "./bullet-behavior";
import { HitStrategy101, HitStrategy102, HitStrategy103, HitStrategyFactory } from "./hit-strategy";
import { GameMgr } from "../core/game-mgr";
import { MathE } from "../core/math-e";
import { LayerZ } from "../core/layer-z";
import { SpecialIndex } from "./attr-type";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { EffectMgr } from "./effect-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BulletSpawnMgr } from "./bullet-spawn-mgr";
import { BuffMgr } from "./buff-mgr";
import { Ih } from "./bullet-factory";
import { Fh } from "./bullet-trail";
import { TargetEnemyBezierMovement, TargetObjectInstantaneous, TargetDirectionWaveMovement, TargetDirectionLineMovement, TargetEnemyInstantaneous } from "./movements";
import { General } from "./general";
import { BaseSoldier } from "./base-soldier";

const ni = Bullet;
const ri = SimpleDynamicArrow;
const Js = HitStrategy103;
const Ns = HitStrategy102;
const Zs = HitStrategy101;
const si = HitStrategyFactory;
const F = GameMgr;
const f = MathE;
const X = LayerZ;
const L = SpecialIndex;
const y = EventMgr;
const u = GameEvent;
const q = EffectMgr;
const Eh = EnemySpatialMgr;
const fe = BulletSpawnMgr;
const th = BuffMgr;
const oi = TargetEnemyBezierMovement;
const fi = TargetObjectInstantaneous;
const Xh = TargetDirectionWaveMovement;
const Kh = TargetDirectionLineMovement;
const Qh = TargetEnemyInstantaneous;
const va = General;
const zs = BaseSoldier;
const n = Object.assign;

function reg(name: string, ctor: any): void {
  if (Ih && Ih.lw) Ih.lw(name, ctor);
  else console.warn(`BulletFactory not available for ${name} registration`);
}

/** Knockback behaviour: shoves the target along the bullet's travel direction. (`Th`) */
export class KnockbackBehavior extends BulletBehavior {
  private QA = new Laya.Point(0, 0);
  private ZA = new Laya.Vector2(0, 0);
  private KA: number;
  constructor(t = 1) {
    super();
    this.KA = t;
  }
  Hm(t: any): void {
    this.QA.setTo(t.x, t.y);
  }
  onUpdate(_t: any, s: any): void {
    if (!(s.x === this.QA.x && s.y === this.QA.y)) {
      this.ZA.setValue(s.x - this.QA.x, s.y - this.QA.y);
      this.QA.setTo(s.x, s.y);
    }
  }
  $m(t: any, _s: any): void {
    if (!(this.ZA.x === 0 && this.ZA.y === 0)) {
      Laya.Vector2.normalize(this.ZA, this.ZA);
      Laya.Vector2.scale(this.ZA, this.KA, this.ZA);
      th.instance().applyBuff(t.id, 12, null, false, L.Ji, this.ZA);
    }
  }
}

/** Slow-then-recover speed behaviour. (`Rh`) */
export class SlowRecoverBehavior extends BulletBehavior {
  private JA: number;
  private tE: number;
  private sE: number;
  private iE = 0;
  constructor(t = 1, s = 1, i = 0.1) {
    super();
    this.JA = t;
    this.tE = s;
    this.sE = i;
  }
  Hm(t: any): void {
    t.rm.um = t.rm.um != null ? t.rm.um : t.um;
    this.iE = t.rm.um;
  }
  onUpdate(t: any, s: any): void {
    const i = s.rm;
    if (i.um < this.iE) i.um = Math.min(this.iE, i.um + (t / 1000) * this.tE);
  }
  $m(_t: any, s: any): void {
    const i = s.rm;
    i.um = Math.max(i.um * this.JA, this.sE);
  }
}

/** Eagle arrow: slow flapping projectile (slows on hit). (`Ch`) */
export class EagleArrow extends Bullet {
  static sw = "EagleArrow";
  private om2: any;
  private hE = 0;
  private eE: any;
  constructor(poolKey?: string) {
    super(poolKey);
    this.km = Js.AL;
  }
  protected Zd(): void {
    this.om2 = new Laya.Sprite();
    this.om2.size(44, 72);
    this.om2.pos(0, 0);
    this.om2.anchor(0, 0);
    (this as any).om = this.om2;
    this.Pm.pos(0, 0);
    this.Pm.size(187, 124);
    this.Pm.anchorX = 0.3;
    this.Pm.anchorY = 0.5;
    this.Pm.addChild(this.om2);
    const t = new Laya.Image("resources/img/weapon/bullet/eagleArrow_01.png");
    t.size(this.Pm.width, this.Pm.height);
    this.Pm.addChild(t);
    this.hE = q
      .instance()
      .registerImgLoop(
        t,
        [
          "resources/img/weapon/bullet/eagleArrow_01.png",
          "resources/img/weapon/bullet/eagleArrow_02.png",
          "resources/img/weapon/bullet/eagleArrow_03.png",
          "resources/img/weapon/bullet/eagleArrow_04.png",
        ],
        100,
      );
    this.eE = new Laya.Image("resources/img/weapon/bullet/eagleArrowAttackEff.png");
    this.eE.visible = false;
    this.eE.pos(68, -10);
    this.eE.anchorX = 0.5;
    this.eE.anchorY = 0.5;
    this.eE.scale(0.5, 0.5);
    t.addChild(this.eE);
    this.Tm(new SlowRecoverBehavior(0.2, 1, 0.1), true);
    this.Tm(new KnockbackBehavior(0.3));
  }
  protected onReset(_t: any): void {
    this.Pm.scale(1, 1);
  }
  protected onUpdate(_t: any): void {}
  protected Hm(): void {}
  protected $m(t: any): void {
    t.hit(this.Sm, this.bm);
    q.instance().playBowHit(t.enemy, t.enemy.width / 2, t.enemy.height / 2);
    Laya.Tween.create(this.eE)
      .duration(200)
      .onStart(() => {
        this.eE.visible = true;
      })
      .then(() => {
        this.eE.visible = false;
      });
  }
  protected qm(): void {}
  protected Zm(): void {}
  protected tw(): void {
    q.instance().removeEvent("imgLoop", this.hE);
  }
}
reg("EagleArrow", EagleArrow);

/** Trail behaviour: drags a pooled Trail2DRender behind the bullet. (`Oh`) */
export class TrailBehavior extends BulletBehavior {
  private _sprite: any = null;
  private config: any = {};
  private oE: string;
  constructor(t: string, s?: any) {
    super();
    this.rE(s);
    this.oE = t;
  }
  get lE(): any {
    return this._sprite.getComponent(Laya.Trail2DRender);
  }
  get cE(): any {
    return this._sprite;
  }
  private rE(t: any, s = true): void {
    if (!t) return;
    const i = !!this._sprite;
    const h = i ? this.lE : null;
    if (t.trailColor && (s && (this.config.trailColor = t.trailColor), i)) {
      if (typeof t.trailColor === "string") {
        const c = new Laya.Color();
        c.fromArray(Laya.ColorUtils.create(t.trailColor).arrColor);
        h.color = c;
      } else h.color = t.trailColor;
    }
    if (t.trailTime) {
      if (s) this.config.trailTime = t.trailTime;
      if (i) h.time = t.trailTime;
    }
    if (t.uE) {
      if (s) this.config.uE = t.uE;
      if (i) h.widthMultiplier = t.uE / h.widthCurve[0].value;
    }
    if (t.trailZOder) {
      if (s) this.config.trailZOder = t.trailZOder;
      if (i) this._sprite.zIndex = t.trailZOder;
    } else if (i) this._sprite.zIndex = -100;
    if (t.pE) {
      if (s) this.config.pE = t.pE;
      if (i) this._sprite.pos(t.pE.x, t.pE.y);
    }
  }
  Hm(t: any): void {
    this._sprite = Fh.produce(this.oE);
    const s = n({}, this.config);
    if (!s.trailColor) s.trailColor = "#ffffff";
    this.rE(s, false);
    t.Pm.addChild(this._sprite);
    if (this.config.pE) this._sprite.pos(this.config.pE.x, this.config.pE.y);
    else {
      const sx = t.Pm.width / 2;
      const sy = t.Pm.height;
      this._sprite.pos(sx, sy);
    }
  }
  Zm(_t: any): void {
    if (this._sprite) Fh.recover(this._sprite);
    this._sprite = null;
  }
  Km(_t: any): void {
    if (this._sprite) Fh.recover(this._sprite);
    this._sprite = null;
  }
}

/** Fire arrow: animated flame + ground-fire on hit. (`Yh`) */
export class FireArrow extends Bullet {
  static sw = "FireArrow";
  private hE = 0;
  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(22, 72);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.9;
    const t = new Laya.Image("resources/img/weapon/bullet/fireArrowEff_01.jpg");
    this.Pm.addChild(t);
    t.pos(0, 0);
    t.size(22, 72);
    const s = new Laya.Image("resources/img/weapon/arrow_8.png");
    s.pos(0, 0);
    s.size(22, 72);
    this.Pm.addChild(s);
    this.hE = q
      .instance()
      .registerImgLoop(
        t,
        [
          "resources/img/weapon/bullet/fireArrowEff_01.jpg",
          "resources/img/weapon/bullet/fireArrowEff_02.jpg",
          "resources/img/weapon/bullet/fireArrowEff_03.jpg",
        ],
        200,
      );
    this.Tm(new TrailBehavior("arrowTrail"), true);
  }
  protected Hm(): void {}
  protected onReset(_t: any): void {}
  protected onUpdate(_t: any): void {}
  protected $m(t: any): void {
    t.hit(this.Sm, this.bm);
    q.instance().spawnFires(t.enemy, 3);
  }
  protected qm(): void {}
  protected Zm(): void {}
  protected tw(): void {
    q.instance().removeEvent("imgLoop", this.hE);
  }
}
reg("FireArrow", FireArrow);

/** Virtual (invisible) bullet used as a movement carrier. (`Gh`) */
export class VirtualBullet extends Bullet {
  static sw = "VirtualBullet";
  constructor(poolKey?: string) {
    super(poolKey);
    this.km = Zs.AL;
    this.fm = false;
  }
  protected Zd(): void {
    this.Pm.anchor(0.5, 0.5);
  }
  protected onReset(_t: any): void {}
  protected Hm(): void {}
  protected onUpdate(_t: any): void {}
  protected $m(_t: any): void {}
  protected qm(): void {}
  protected Zm(): void {}
  protected tw(): void {}
}
reg("VirtualBullet", VirtualBullet);

/** Static fire ball that burns the ground for a duration. (`Hh`) */
export class StaticFireBall extends Bullet {
  static sw = "StaticFireBall";
  Um: any = Js.AL;
  delay = 1000;
  duration = 2000;
  private TM = 0;
  private hE = 0;
  private gE = 0;
  protected tw(): void {
    q.instance().removeEvent("imgLoop", this.hE);
  }
  protected Hm(): void {
    this.TM = 0;
  }
  protected $m(t: any): void {
    t.hit(this.Sm, this.bm);
    Laya.Point.TEMP.setTo(this.Pm.x, this.Pm.y);
    const s = t.enemy;
    q.instance().playGroundFireTimed(s, s.width / 2, s.height / 2, 1000);
  }
  protected qm(): void {
    this.TM = Laya.timer.currTimer;
  }
  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(44, 44);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.5;
    const t = new Laya.Image("resources/img/effect/fireGround_01.png");
    t.alpha = 1;
    t.size(44, 44);
    this.Pm.addChild(t);
    this.hE = q
      .instance()
      .registerImgLoop(
        t,
        [
          "resources/img/effect/fireGround_01.png",
          "resources/img/effect/fireGround_02.png",
          "resources/img/effect/fireGround_03.png",
          "resources/img/effect/fireGround_04.png",
        ],
        70,
        f.range(0, 4, true) as number,
      );
  }
  protected onUpdate(t: any): void {
    this.PL = this.TM + this.delay < Laya.timer.currTimer;
    if (this.gE < this.duration) this.gE += t;
    else {
      this.Gm = false;
      Laya.Tween.to(
        this.Pm,
        { scaleX: 0, scaleY: 0 },
        500,
        Laya.Ease.linearInOut,
        Laya.Handler.create(this, () => {
          this.Am();
        }),
      );
    }
    this.dm.clear();
  }
  protected Zm(): void {
    this.Pm.scale(1, 1);
  }
  protected onReset(_t: any): void {
    this.gE = 0;
    this.Pm.zIndex = 0;
  }
}
reg("StaticFireBall", StaticFireBall);

/** Fire dragon: a head segment that spawns a trailing body of wave bullets. (`Wh`/`zh`) */
export class FireDragonArrow extends Bullet {
  static sw = "FireDragonArrow";
  private dE = 5000;
  private LE = false;
  private mE = false;
  private wE = false;
  private currentLength = 1;
  private vE = 22;
  private lastTime = 0;
  private kE = new Laya.Point();
  private _E: number;
  private img: any;
  private xE: any;
  XL: any;
  // wave params copied from the movement on the head segment
  private a = 0;
  private b = 0;
  private offset = 0;
  index = 0;

  constructor(poolKey?: string, s = 15) {
    super(poolKey);
    this.km = Js.AL;
    this.dE = 5000;
    this.LE = false;
    this.mE = false;
    this.wE = false;
    this.currentLength = 1;
    this.vE = 22;
    this.lastTime = 0;
    this.kE = new Laya.Point();
    this._E = s;
  }
  protected Zd(): void {
    if (this._E !== 0 && this._E !== -1) this.LE = true;
    else if (this._E === -1) this.wE = true;
    else this.mE = true;
    if (this.LE) {
      this.img = new Laya.Image("resources/img/weapon/bullet/dragonPartHead.png");
      this.img.size(61, 100);
      this.img.pos(0, 22);
    } else if (this.mE) {
      this.img = new Laya.Image("resources/img/weapon/bullet/dragonPartBody.png");
      this.img.size(37, 50);
    } else if (this.wE) {
      this.img = new Laya.Image("resources/img/weapon/bullet/dragonPartBody.png");
      this.img.size(45, 50);
      this.Pm.scale(0.8, 0.8);
    }
    this.Pm.anchor(0.5, 0.5);
    this.Pm.size(this.img.width, this.img.height);
    this.Pm.addChild(this.img);
    this.xE = fe.instance();
    this.dg = F.instance();
  }
  protected Hm(): void {
    if (this.LE) {
      const t: any = this.Om;
      this.b = t.b;
      this.a = t.a;
      this.offset = t.offset;
      this.XL = new Laya.Vector2(t.XL.x, t.XL.y);
      t.b *= 0.5;
      Laya.Tween.create(this.Pm).duration(500).to("scaleX", 1.5).to("scaleY", 1.5);
      const s = this.xE.Tw(
        { type: VirtualBullet, Om: fi.create(this.Pm, 0, 0), bm: this.bm, xm: "dragon_virtual_background" },
        this.wm,
      );
      y.instance.event(u.xt, s.Pm);
      s.Pm.name = "dragon_virtual_background";
      s.Tm(new TrailBehavior("fireDragonTrail"));
      s.Pm.zIndex = 555;
      s.Xm();
    }
  }
  private SE(t: number, s: number): number {
    return t <= 0 || t >= s ? 0 : Math.sin((Math.PI * t) / s);
  }
  protected onReset(_t: any): void {}
  protected onUpdate(_s: any): void {
    if (Laya.timer.currTimer - this.lastTime > 500) {
      q.instance().spawnFires(this.Pm, 1, 10);
      this.lastTime = Laya.timer.currTimer;
    }
    if (this.LE && this._E > this.currentLength) {
      Laya.Vector2.TEMP.setValue(this.Pm.x, this.Pm.y);
      const dist = f.distance(this.wm, Laya.Vector2.TEMP as any);
      Laya.Vector2.TEMP.setValue(this.Pm.width, this.Pm.height);
      this.vE = f.distance(Laya.Vector2.ZERO as any, Laya.Vector2.TEMP as any) / 4;
      if (dist > this.vE * (this.currentLength + 1)) {
        const self = FireDragonArrow;
        let s: any;
        if (this.currentLength === this._E - 1) {
          s = this.xE.Tw(
            {
              type: class extends self {
                constructor(t?: string) {
                  super(t, -1);
                }
              },
              Om: Xh.create(this.a, 0, this.offset).QL(this.XL),
              bm: this.bm,
              Fm: this.um,
              xm: "tail",
            },
            this.wm,
          );
        } else {
          s = this.xE.Tw(
            {
              type: class extends self {
                constructor(t?: string) {
                  super(t, 0);
                }
              },
              Om: Xh.create(this.a, this.b * this.SE(this.currentLength, this._E - 1), this.offset).QL(this.XL),
              bm: this.bm,
              Fm: this.um,
              xm: "body",
            },
            this.wm,
          );
          const i = 1 + (this._E - this.currentLength) / this._E;
          s.Pm.scale(i, i);
          s.index = this.currentLength;
        }
        s.PL = this.currentLength % 2 === 0;
        s.Xm();
        this.currentLength++;
        s.Pm.zIndex = 999 - this.currentLength;
      }
    } else if (this.wE && (Math.abs(this.Pm.x - this.kE.x) > 20 || Math.abs(this.Pm.y - this.kE.y) > 20)) {
      const t = this.dg.map;
      const sx = Math.floor((this.Pm.x + this.Pm.width / 2) / t.gridWid);
      const i = Math.floor((this.Pm.y + this.Pm.height / 2) / t.gridHei);
      if (!t.ue[sx]) return;
      const h = t.ue[sx][i];
      if (!h) return;
      if (h[2] === (this.bm.qd ? "0" : "1") && "0" === h[0]) {
        this.bE();
        this.kE.setTo(this.Pm.x, this.Pm.y);
      }
    }
  }
  private bE(): void {
    const t = this.xE.Tw(
      { type: StaticFireBall, Um: Js.AL, bm: this.bm },
      { x: this.Pm.x + 22 * (Math.random() - 0.5), y: this.Pm.y + 22 * (Math.random() - 0.5) },
    );
    t.duration = this.dE;
    t.Xm();
  }
  protected $m(t: any): void {
    t.hit(this.Sm, this.bm);
    q.instance().spawnFires(t.enemy, 3);
  }
  protected qm(): void {}
  protected Zm(): void {
    this.currentLength = 0;
  }
  protected tw(): void {}
}
reg("FireDragonArrow", FireDragonArrow);
export const zh = FireDragonArrow;

/** Explosion behaviour: area knockback + damage with an easing falloff. (`jh`) */
export class ExplosionBehavior extends BulletBehavior {
  private ME = 1;
  private radius: number;
  private force: number;
  private Sm: number;
  private PE: any;
  private EE: boolean;
  private IE: boolean;
  private TE: boolean;
  private xw: any;
  constructor(t: any) {
    super();
    this.radius = t.radius;
    this.force = t.force != null ? t.force : 1;
    this.Sm = t.Sm != null ? t.Sm : 0;
    this.PE = t.AE != null ? t.AE : Laya.Ease.linear;
    this.EE = t.BE == null || t.BE;
    this.IE = t.DE == null || t.DE;
    this.TE = t.RE == null || t.RE;
    this.xw = Eh.instance();
  }
  $m(_t: any, s: any): void {
    if (this.IE) this.CE(s);
  }
  Zm(t: any): void {
    if (this.TE) this.CE(t);
  }
  private CE(t: any): void {
    const s: any[] = [];
    this.xw.CA(t.x, t.y, this.radius, t.bm.qd, s);
    const i = Laya.Vector2.TEMP;
    for (const h of s) {
      const yM = h.yM;
      const e = h.centerX;
      const a = h.centerY;
      const dist = f.distance(t, { x: e, y: a });
      Laya.Point.TEMP.setTo(e, a);
      i.setValue(e - t.x, a - t.y);
      Laya.Vector2.normalize(i, i);
      const r = Math.max(0, this.PE(this.radius - dist, 0, 1, this.radius)) * (yM ? this.ME : 1);
      Laya.Vector2.scale(i, r * this.force, i);
      const o = this.Sm * r;
      if (o > 0) h.hit(o, t.bm);
      th.instance().applyBuff(h.id, 12, null, false, L.Ji, i);
    }
    if (this.EE) q.instance().playRocketEffect(t.Pm.parent, t.x, t.y);
  }
}

/** Burn behaviour: applies a fire-DOT buff on hit. (`$h`) */
export class BurnBehavior extends BulletBehavior {
  private _duration: number;
  private Mm: number;
  constructor(t: number, s: number) {
    super();
    this._duration = t;
    this.Mm = s;
  }
  $m(t: any, _s: any): void {
    th.instance().applyBuff(t.id, 14, this.Mm, false, this._duration, this.Mm);
  }
}

/** Fire explosive arrow: explodes on remove + applies burn. (`Nh`) */
export class FireExplosiveArrow extends Bullet {
  static sw = "FireExplosiveArrow";
  private FE: any;
  set UE(t: number) {
    this.FE.radius = t;
  }
  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(22, 72);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.9;
    const t = new Laya.Image("resources/img/weapon/arrow_9.png");
    t.size(22, 72);
    this.Pm.addChild(t);
    this.FE = this.Tm(new ExplosionBehavior({ radius: (this as any).UE, Sm: 0, DE: false, RE: true }), true);
    this.Tm(new BurnBehavior(1000, 6));
  }
  protected Hm(): void {}
  protected onReset(t: any): void {
    this.FE.Sm = t.Sm;
  }
  protected onUpdate(_t: any): void {}
  protected $m(t: any): void {
    t.hit(this.Sm, this.bm);
  }
  protected qm(): void {}
  protected Zm(): void {}
  protected tw(): void {}
}
reg("FireExplosiveArrow", FireExplosiveArrow);

/** Fire phoenix: grows + hits harder the farther it has flown. (`qh`) */
export class HuoFengHuangArrow extends Bullet {
  static sw = "HuoFengHuangArrow";
  private dE = 2000;
  private hE = 0;
  constructor(poolKey?: string) {
    super(poolKey);
    this.km = Js.AL;
    this.dE = 2000;
  }
  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(44, 72);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.5;
    const t = new Laya.Image("resources/img/weapon/bullet/huoFengHuang_01.png");
    t.size(this.Pm.width, this.Pm.height);
    this.Pm.addChild(t);
    this.hE = q
      .instance()
      .registerImgLoop(
        t,
        [
          "resources/img/weapon/bullet/huoFengHuang_01.png",
          "resources/img/weapon/bullet/huoFengHuang_02.png",
          "resources/img/weapon/bullet/huoFengHuang_03.png",
          "resources/img/weapon/bullet/huoFengHuang_04.png",
        ],
        200,
      );
    this.Tm(new SlowRecoverBehavior(0.2, 1, 0.1), true);
    this.Tm(new BurnBehavior(this.dE, 10), true);
  }
  protected onReset(_t: any): void {
    this.Pm.scale(1, 1);
  }
  protected onUpdate(_t: any): void {
    Laya.Vector2.TEMP.setValue(this.x, this.y);
    const s = f.distance(this.wm, Laya.Vector2.TEMP as any);
    this.Pm.scale(1 + s / 500, 1 + s / 500);
  }
  protected Hm(): void {}
  protected $m(t: any): void {
    Laya.Vector2.TEMP.setValue(this.x, this.y);
    const s = f.distance(this.wm, Laya.Vector2.TEMP as any);
    t.hit(Math.min(this.Sm + Math.floor(s / 250), 2 * this.Sm), this.bm);
  }
  protected qm(): void {}
  protected Zm(): void {}
  protected tw(): void {
    q.instance().removeEvent("imgLoop", this.hE);
  }
}
reg("HuoFengHuangArrow", HuoFengHuangArrow);

/** Lightning chain beam tethered between the owner and the struck enemy. (`Vh`) */
export class LightningChain extends Bullet {
  static sw = "LightningChain";
  private OE = false;
  private Yv = new Laya.Point();
  private XE: any;
  private GE: any;
  private WE: any;
  private jE: any;
  private $E: any;
  private NE = 0;
  private qE = 0;
  private VE = 0;
  constructor(poolKey?: string) {
    super(poolKey);
    this.km = Ns.AL;
    this.lm = 600;
    this.fm = false;
    this.OE = false;
    this.Yv = new Laya.Point();
  }
  set YE(t: any) {
    if (t) {
      if (this.XE) this.XE.offAllCaller(this);
      this.Yv.setTo(t.width / 2, t.height / 2);
      t.localToGlobal(this.Yv);
      this.GE = { x: this.Yv.x, y: this.Yv.y };
      this.Pm.x = t.x;
      this.Pm.y = t.y;
      t.once(Laya.Event.REMOVED, this, () => {
        this.OE = true;
      });
    }
    this.XE = t;
  }
  HE(): void {
    this.WE.visible = true;
  }
  protected Hm(): void {}
  protected onUpdate(_t: any): void {
    if (this.WE.visible && this.XE) this.zE();
  }
  protected Zd(): void {
    this.Pm.size(44, 44);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.5;
    this.WE = new Laya.Image("resources/img/weapon/bullet/lightningChain_01.png");
    this.jE = new Laya.Image("resources/img/weapon/bullet/lightningChainStart_01.png");
    this.$E = new Laya.Image("resources/img/weapon/bullet/lightningChainEnd_01.png");
    this.NE = q
      .instance()
      .registerImgLoop(
        this.WE,
        [
          "resources/img/weapon/bullet/lightningChain_01.png",
          "resources/img/weapon/bullet/lightningChain_02.png",
          "resources/img/weapon/bullet/lightningChain_03.png",
        ],
        100,
      );
    this.qE = q
      .instance()
      .registerImgLoop(
        this.jE,
        [
          "resources/img/weapon/bullet/lightningChainStart_01.png",
          "resources/img/weapon/bullet/lightningChainStart_02.png",
          "resources/img/weapon/bullet/lightningChainStart_03.png",
        ],
        100,
      );
    this.VE = q
      .instance()
      .registerImgLoop(
        this.$E,
        [
          "resources/img/weapon/bullet/lightningChainEnd_01.png",
          "resources/img/weapon/bullet/lightningChainEnd_02.png",
          "resources/img/weapon/bullet/lightningChainEnd_03.png",
        ],
        100,
      );
    this.Pm.zIndex = X.mr;
    this.WE.anchorX = 0;
    this.WE.anchorY = 0.5;
    this.WE.width = F.instance().map.gridWid;
    this.WE.height = F.instance().map.gridHei;
    this.jE.width = this.WE.width / 2;
    this.jE.height = this.WE.height / 2;
    this.$E.width = this.WE.width / 1.5;
    this.$E.height = this.WE.height / 1.5;
    this.Pm.addChild(this.WE);
    this.WE.addChild(this.jE);
    this.WE.addChild(this.$E);
    this.$E.pos(-11, 0);
    this.WE.pos(this.Pm.width / 2, this.Pm.height / 2);
    this.WE.visible = false;
  }
  protected onReset(_t: any): void {
    this.WE.visible = false;
    if (!this.XE) {
      if (this.bm instanceof va && this.bm.QE) this.YE = this.bm.QE.Hn;
      else if (this.bm instanceof zs) this.YE = this.bm.Yn;
    }
  }
  protected $m(t: any): void {
    if (this.XE) {
      this.zE();
      this.WE.visible = true;
      t.hit(this.Sm, this.bm);
      q.instance().playElectricEffect(t.enemy, t.enemy.width / 2, t.enemy.height / 2);
    }
  }
  private zE(): void {
    if (this.OE) this.Yv.setTo(this.GE.x, this.GE.y);
    else {
      this.Yv.setTo(this.XE.width / 2, this.XE.height / 2);
      this.XE.localToGlobal(this.Yv);
      this.GE = { x: this.Yv.x, y: this.Yv.y };
    }
    Laya.Point.TEMP.setTo(0, 0);
    this.Pm.localToGlobal(Laya.Point.TEMP);
    this.WE.rotation = f.angle(Laya.Point.TEMP, this.Yv) - 90;
    this.WE.width = f.distance(this.Yv, Laya.Point.TEMP as any) / 0.96;
    this.jE.x = this.WE.width - 25;
  }
  protected qm(): void {}
  protected Zm(): void {
    this.WE.visible = false;
    (this as any).YE = null;
  }
  protected tw(): void {
    q.instance().removeEvent("imgLoop", this.NE);
    q.instance().removeEvent("imgLoop", this.qE);
    q.instance().removeEvent("imgLoop", this.VE);
  }
}
reg("LightningChain", LightningChain);

/** Lightning arrow: forks to nearby enemies as lightning chains on hit. (`Zh`) */
export class LightningArrow extends Bullet {
  static sw = "LightningArrow";
  private config: any = { type: LightningChain, Om: undefined, bm: undefined };
  constructor(poolKey?: string) {
    super(poolKey);
    this.um = 2;
  }
  protected tw(): void {}
  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(22, 72);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.9;
    const t = new Laya.Image("resources/img/weapon/bullet/lightningArrow.png");
    t.size(22, 72);
    this.Pm.addChild(t);
    this.Tm(new TrailBehavior("arrowTrail"), true);
  }
  protected Hm(): void {
    this.config.bm = this.bm;
    this.config.Sm = this.Sm;
  }
  protected $m(t: any): void {
    const s = Eh.instance();
    for (let i = 0; i < s.kw.size / 2; i++)
      if (Math.random() < 0.5) {
        this.config.Sm = this.Sm;
        this.config.bm = this.bm;
        const target = s.XA(this.bm.qd);
        if (!target || target.id === t.id) continue;
        this.config.Om = Qh.create().qL(target.id);
        const h = fe.instance().Tw(this.config);
        h.YE = t.enemy;
        h.Xm();
      }
    t.hit(this.Sm, this.bm);
  }
  protected qm(): void {}
  protected Zm(): void {}
  protected onReset(_t: any): void {}
  protected onUpdate(_t: any): void {}
}
reg("LightningArrow", LightningArrow);

/** Shen-bi arrow: on fire, also looses a fan of fist projectiles. (`Jh`) */
export class ShenBiArrow extends Bullet {
  static sw = "ShenBiArrow";
  private KE = 3;
  protected tw(): void {}
  protected Zd(): void {
    this.Pm.pos(0, 0);
    this.Pm.size(22, 72);
    this.Pm.anchorX = 0.5;
    this.Pm.anchorY = 0.5;
    const t = new Laya.Image("resources/img/weapon/bullet/shenBiArrow.png");
    t.size(22, 72);
    this.Pm.addChild(t);
  }
  protected Hm(): void {
    for (let i = 0; i < this.KE; i++) {
      fe.instance().Tw(
        {
          type: ri,
          ow: {
            xm: "神臂弓拳头",
            ew: "resources/img/weapon/bullet/shenBiPunch.png",
            nw: { x: 1.2, y: 1.2 },
          },
          Om: this.Om instanceof oi ? oi.create().qL((this.Om as any).FL) : Kh.create().QL((this.Om as any).XL),
          Um: si.copyFrom(this.Um),
          bm: this.bm,
          Sm: this.Sm,
        },
        { x: this.Pm.x + f.range(-50, 50)!, y: this.Pm.y + f.range(-50, 50)! },
      ).Xm();
    }
  }
  protected onReset(_t: any): void {}
  protected onUpdate(_t: any): void {}
  protected $m(t: any): void {
    t.hit(this.Sm, this.bm);
  }
  protected qm(): void {}
  protected Zm(): void {}
}
reg("ShenBiArrow", ShenBiArrow);
