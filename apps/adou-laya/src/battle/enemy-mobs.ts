// Mobs — the mob base (`kh`) + Cavalry/Mob0-3/Puppet/Zombie.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~16619-17144. The mob base sets HP from the enemy table, plays a breathing
// animation, blows up on death (with soul-summon into the boss shield zone), and
// supports the knockback-explosion (`EP`/`BP`). Puppets are charmed transforms;
// zombies emerge from a swamp. Registered with EnemyFactory. Opaque names verbatim.
//
//   MobBase=kh Cavalry=_h Mob0=xh Mob1=Sh Mob2=bh Mob3=Mh Puppet=Ph Zombie=Ah

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Enemy } from "./enemy";
import { BossAnimSprite } from "./boss-anim-sprite";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { MathE } from "../core/math-e";
import { PrefabFactory } from "./prefab-factory";
import { EffectMgr } from "./effect-mgr";
import { EnemyFactory } from "./enemy-factory";

const sh = BossAnimSprite;
const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const f = MathE;
const z = PrefabFactory;
const q = EffectMgr;
const ss = EnemyFactory;

export class MobBase extends Enemy {
  protected ZP: any = { Gl: null, p1: null, p2: null, time: 0 };
  protected KP = 0;
  protected tA = "";

  get Xu(): number {
    const t = this.SM + this.bM;
    this.yb = t / this.SM;
    this.ZM.yb(this.yb);
    return t;
  }
  init(t: any): void {
    super.init(t);
    this.JP();
    this.qM.text = this.Qi.toFixed(0);
    this.qM.visible = false;
    this.KM.visible = false;
    this.yP();
    this.enemy.visible = false;
    this.IP(() => {
      j.instance().register("Enemy" + this.id, this, this.update);
      this.changeState(1);
      this.tP.width = 0;
      this.KM.visible = true;
      this.tP.width = this.sP;
    });
  }
  protected JP(): void {
    const t = F.instance().enemyHp(this.type, this.qd);
    if (this.type === 4) {
      this.Qi = t.uh / 2;
      this.tP.skin = "resources/img/gameObject/enemy/hp3.png";
    } else {
      this.Qi = t.uh;
      this.tP.skin = "resources/img/gameObject/enemy/hp2.png";
    }
    this.QM = t.uh;
    this.ZM = this.enemy.getChildByName("sp");
    if (!this.ZM) {
      this.ZM = new sh(this.cb, this.tA);
      this.ZM.name = "sp";
      this.enemy.addChild(this.ZM);
    }
    this.ZM.play("animation", true);
  }
  protected sA(): void {
    Laya.Tween.create(this.ZM)
      .to("scaleY", 0.98)
      .duration(130)
      .chain()
      .to("scaleY", 1.02)
      .duration(130)
      .chain()
      .to("scaleY", 1)
      .duration(130)
      .then(this.sA, this);
  }
  hit(t: number, s: any): void {
    super.hit(t, s);
    Laya.Tween.create(this.ZM)
      .to("rotation", Math.max(-30, 5 * -t))
      .duration(50)
      .chain()
      .to("rotation", Math.min(30, 5 * t))
      .duration(50)
      .chain()
      .to("rotation", 0)
      .duration(50);
  }
  protected cP(): void {
    if (this.IM) return;
    super.cP();
    let t = "#000000";
    if (this.type === 4) t = "#c1f6cb";
    q.instance().playMobDead(this.enemy.parent, this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height / 2, t, 1);
    Laya.Tween.to(
      this.enemy,
      { alpha: 0 },
      100,
      null,
      Laya.Handler.create(this, () => {
        this.enemy.alpha = 1;
        this.enemy.visible = false;
        if (this.type !== 1) {
          const slot = this.qd ? F.instance().battleState.Ii : F.instance().battleState.Ti;
          if (
            slot.Di &&
            slot.num < 3 &&
            f.distance(slot.pos, { x: this.enemy.x + this.enemy.width / 2, y: this.enemy.y + this.enemy.height / 2 }) < slot.range
          )
            this.iA();
        }
        this.gameOver();
      }),
    );
  }
  protected iA(): void {
    const slot = this.qd ? F.instance().battleState.Ii : F.instance().battleState.Ti;
    this.Mo.x = slot.pos.x;
    this.Mo.y = slot.pos.y;
    this.enemy.parent.localToGlobal(this.Mo);
    this.Po.x = this.enemy.width / 2;
    this.Po.y = this.enemy.height;
    this.enemy.localToGlobal(this.Po);
    const s = this.pk;
    const i = this.enemy.x;
    const h = this.enemy.y;
    q.instance().spawnTrail(
      this.Mo.x,
      this.Mo.y,
      this.Po.x,
      this.Po.y,
      300,
      () => {
        y.instance.event(u.ut, this.qd, i, h, s);
      },
      "#05fe77",
      "resources/img/gameObject/enemy/soulHead.png",
    );
  }
  EP(t: any, s: any, i: any): void {
    const h = this.enemy.x + this.enemy.width / 2;
    const e = this.enemy.y + this.enemy.height / 2;
    this.ZP.Gl = { x: this.enemy.x, y: this.enemy.y };
    this.ZP.p2 = { x: this.enemy.x + (h - s) / 2, y: this.enemy.y + (e - i) / 2 };
    this.ZP.p1 = { x: this.ZP.Gl.x + (this.ZP.p2.x - this.ZP.Gl.x) / 2, y: this.ZP.Gl.y - 3 * (60 - t) };
    this.ZP.time = 0;
    this.KP = 1;
    this.hit(this.Qi - 0.1, null);
    this.ZM.rotation = f.angle({ x: s, y: i }, { x: h, y: e });
    j.instance().register("blownUp" + this.id, this, this.BP);
  }
  BP(t: number): void {
    if (this.KP === 1) {
      this.ZP.time += t / 200;
      if (f.quadraticBezierPoint(this.ZP.Gl, this.ZP.p1, this.ZP.p2, this.enemy, this.ZP.time)) {
        this.hit(1, null);
        this.KP = 0;
      }
    }
  }
  gameOver(): void {
    j.instance().unregister("blownUp");
    Laya.Tween.killAll(this.ZM);
    super.gameOver();
    this.enemy.filters = null;
    this.KP = 0;
    this.ZM.scale(1, 1);
    this.ZM.skewX = 0;
    this.ZM.alpha = 1;
    this.ZM.rotation = 0;
    this.ZM.removeSelf();
    this.ZM.recover();
    this.ZM = null;
  }
}
ss.instance().register("Mob", () => Laya.Pool.createByClass(MobBase));

/** A standard image-sprite mob (Mob0-3 + Cavalry share this shape). */
abstract class ImageMob extends MobBase {
  init(t: any): void {
    this.cb = false;
    this.enemy = z.instance().getItem("mob", this);
    super.init(t);
    this.ZM.pos(this.enemy.width / 2, this.enemy.height);
  }
  protected rP(): void {
    this.sA();
  }
  protected uP(): void {
    Laya.Tween.killAll(this.ZM);
    this.ZM.scale(1, 1);
  }
  gameOver(): void {
    super.gameOver();
    z.instance().recover("mob", this.enemy);
  }
}

/** 骑兵 mob. (`_h`) */
class Cavalry extends ImageMob {
  private hA: any;
  constructor() {
    super();
    this.tA = "resources/img/gameObject/soldier/soldier_3.png";
    this.SM = 80;
  }
  init(t: any): void {
    super.init(t);
    if (!this.hA) {
      this.hA = new Laya.Image("resources/img/gameObject/enemy/yellowCircle.png");
      this.hA.size(80, 30);
      this.hA.pos(0, 40);
      this.hA.zIndex = -1;
    }
    this.enemy.addChild(this.hA);
  }
  protected uP(): void {
    Laya.Tween.killAll(this.ZM);
    this.ZM.scale(1, 1);
  }
  protected sA(): void {
    Laya.Tween.create(this.ZM)
      .to("scaleY", 0.78)
      .duration(130)
      .chain()
      .to("scaleY", 0.82)
      .duration(130)
      .chain()
      .to("scaleY", 0.8)
      .duration(130)
      .then(this.sA, this);
  }
  gameOver(): void {
    super.gameOver();
    this.hA.removeSelf();
  }
}
ss.instance().register("Cavalry", () => Laya.Pool.createByClass(Cavalry));

function makeImageMob(name: string, asset: string): void {
  const cls = class extends ImageMob {
    constructor() {
      super();
      this.tA = asset;
    }
  };
  ss.instance().register(name, () => Laya.Pool.createByClass(cls));
}
makeImageMob("Mob0", "resources/img/gameObject/enemy/mob_0.png");
makeImageMob("Mob1", "resources/img/gameObject/enemy/mob_1.png");
makeImageMob("Mob2", "resources/img/gameObject/enemy/mob_2.png");
makeImageMob("Mob3", "resources/img/gameObject/enemy/mob_3.png");

/** 傀儡 — a charmed-transform soldier (DiaoChan). (`Ph`) */
class Puppet extends MobBase {
  protected eA = 1;
  protected Aa = 0;
  private aA: any[] = [];
  private nA = 0;
  private lA: any;
  constructor() {
    super();
    this.eA = 1;
    this.SM = 10;
    this.aA = [];
    this.nA = 0;
  }
  init(t: any): void {
    this.cb = false;
    this.tA = "resources/img/gameObject/soldier/soldier_" + this.Aa + ".png";
    this.enemy = z.instance().getItem("mob", this);
    super.init(t);
    this.ZM.scale(1, 1);
    this.ZM.pos(this.enemy.width / 2, this.enemy.height);
    this.enemy.pos(this.Hv.x, this.Hv.y);
    y.instance.on(u.yt, this, this.rA);
  }
  protected JP(): void {
    const t = F.instance().enemyHp(this.type, this.qd);
    this.Qi = t.uh * this.dg.enemy.kh[this.eA - 1];
    this.tP.skin = "resources/img/gameObject/enemy/hp2.png";
    this.QM = t.uh * this.dg.enemy.kh[this.eA - 1];
    this.ZM = this.enemy.getChildByName("sp");
    if (!this.ZM) {
      this.ZM = new sh(this.cb, this.tA);
      this.ZM.name = "sp";
      this.enemy.addChild(this.ZM);
    }
    this.ZM.play("animation", true);
  }
  IP(t?: () => void): void {
    this.enemy.visible = true;
    if (t) t();
  }
  update(t: number): void {
    super.update(t);
    this.oA(t);
  }
  protected rP(): void {
    this.sA();
  }
  protected uP(): void {
    Laya.Tween.killAll(this.ZM);
    this.ZM.scale(0.9, 0.9);
  }
  private rA(t: number): void {
    this.pk = t;
  }
  private oA(t: number): void {
    this.nA += t;
    if (this.nA >= 300) {
      this.nA = 0;
      this.lA = z.instance().getItem("loveHeart", this);
      this.aA.push({ img: this.lA, scale: f.range(0.1, 0.5) });
      this.lA.scale(0, 0);
      this.lA.pos(f.range(20, this.enemy.width - 20) as number, f.range(0, this.enemy.height / 2) as number);
      this.enemy.addChild(this.lA);
    }
    for (let s = this.aA.length - 1; s >= 0; s--) {
      this.lA = this.aA[s].img;
      this.lA.scaleX += t / 3000;
      this.lA.scaleY += t / 3000;
      if (this.lA.scaleX >= this.aA[s].scale) {
        this.lA.alpha -= t / 1000;
        if (this.lA.alpha <= 0) {
          this.lA.removeSelf();
          this.lA.alpha = 1;
          z.instance().recover("loveHeart", this.lA);
          this.aA.splice(s, 1);
        }
      }
    }
  }
  gameOver(): void {
    j.instance().unregister("puppetSkip" + this.id);
    super.gameOver();
    for (let t = this.aA.length - 1; t >= 0; t--) {
      this.lA = this.aA[t].img;
      this.lA.removeSelf();
      this.lA.alpha = 1;
      z.instance().recover("loveHeart", this.lA);
    }
    this.aA.length = 0;
    z.instance().recover("mob", this.enemy);
  }
}
ss.instance().register("Puppet", () => Laya.Pool.createByClass(Puppet));

/** 僵尸 — emerges from a swamp tile. (`Ah`) */
class Zombie extends MobBase {
  private cA = 0;
  uA = { x: 0, y: 0, index: 0 };
  private bubbles: any[] = [];
  private yA: any;
  private fA: any;
  private gA: any;
  constructor() {
    super();
    this.cA = 0;
    this.uA = { x: 0, y: 0, index: 0 };
    this.bubbles = [];
  }
  init(t: any): void {
    this.cb = false;
    this.tA = "resources/img/gameObject/enemy/zombie.png";
    this.enemy = z.instance().getItem("mob", this);
    super.init(t);
    this.ZM.pos(this.enemy.width / 2, this.enemy.height);
    this.enemy.pos(this.uA.x, this.uA.y);
    this.pA();
  }
  private pA(): void {
    if (!this.yA) {
      this.yA = new Laya.Image("resources/img/gameObject/enemy/swamp.png");
      this.yA.size(64, 32);
      this.yA.pos(8, 47);
    }
    this.yA.alpha = 0;
    this.yA.zIndex = -1;
    this.enemy.addChild(this.yA);
    if (!this.fA) {
      this.fA = new Laya.Sprite();
      this.fA.graphics.drawRect(0, 0, this.enemy.width, 0, "#fff");
    }
    this.ZM.mask = this.fA;
  }
  IP(t?: () => void): void {
    this.enemy.visible = true;
    this.pk = this.uA.index;
    this.gA = t;
    this.cA = 1;
    j.instance().register(`mob1_${this.id}`, this, this.dA);
  }
  private dA(t: number): void {
    if (this.cA === 1) {
      this.yA.alpha += t / 200;
      if (this.yA.alpha >= 1) {
        this.yA.alpha = 1;
        this.ZM.y = 160;
        this.cA = 2;
      }
    } else if (this.cA === 2) {
      this.ZM.y -= (80 * t) / 1000;
      this.bubble(t);
      if (this.ZM.y <= 140) {
        this.ZM.y = 140;
        this.cA = 3;
      }
    } else if (this.cA === 3) {
      const s = (80 * t) / 1000;
      this.ZM.y -= s;
      this.fA.graphics.clear();
      this.fA.graphics.drawRect(-this.enemy.width / 2, -this.enemy.height, this.enemy.width, 140 - this.ZM.y, "#fff");
      this.yA.alpha -= t / 1000;
      this.bubble(t);
      if (this.ZM.y <= 80) {
        this.ZM.y = 80;
        if (this.gA) this.gA();
        this.LA();
      }
    }
  }
  private bubble(t: number): void {
    if (Math.random() < 0.05 && this.bubbles.length < 3) {
      const b = z.instance().getItem("bubble", this);
      this.enemy.addChild(b);
      b.pos(f.range(10, 70) as number, 40);
      this.bubbles.push(b);
    }
    for (let s = this.bubbles.length - 1; s >= 0; s--) {
      this.bubbles[s].y -= (40 * t) / 1000;
      this.bubbles[s].alpha -= (0.7 * t) / 1000;
      if (this.bubbles[s].y <= 0) {
        const b = this.bubbles[s];
        Laya.Tween.to(
          b,
          { alpha: 0 },
          100,
          null,
          Laya.Handler.create(this, () => {
            b.scale(1, 1);
            b.alpha = 1;
            b.removeSelf();
            z.instance().recover("bubble", b);
          }),
        );
        this.bubbles.splice(s, 1);
      }
    }
  }
  protected rP(): void {
    this.sA();
  }
  protected uP(): void {
    Laya.Tween.killAll(this.ZM);
    this.ZM.scale(1, 1);
  }
  protected sA(): void {
    const t = this.ZM.y;
    Laya.Tween.create(this.ZM)
      .to("scaleX", 1.06)
      .to("scaleY", 0.93)
      .to("y", t + 4)
      .duration(((2 / 15) * 1000) / this.yb)
      .chain()
      .to("scaleX", 1.08)
      .to("scaleY", 0.91)
      .to("y", t + 3)
      .duration(((1 / 30) * 1000) / this.yb)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .to("y", t)
      .duration(((1 / 6) * 1000) / this.yb)
      .then(this.sA, this);
  }
  private LA(): void {
    j.instance().unregister(`mob1_${this.id}`);
    this.ZM.mask = null;
    this.fA.graphics.clear();
    this.yA.removeSelf();
    this.yA.alpha = 0;
    this.cA = 0;
    for (let t = this.bubbles.length - 1; t >= 0; t--) {
      const b = this.bubbles[t];
      Laya.Tween.to(
        b,
        { alpha: 0 },
        100,
        null,
        Laya.Handler.create(this, () => {
          b.scale(1, 1);
          b.alpha = 1;
          b.removeSelf();
          z.instance().recover("bubble", b);
        }),
      );
      this.bubbles.splice(t, 1);
    }
  }
  gameOver(): void {
    this.LA();
    super.gameOver();
    z.instance().recover("mob", this.enemy);
  }
}
ss.instance().register("Zombie", () => Laya.Pool.createByClass(Zombie));
