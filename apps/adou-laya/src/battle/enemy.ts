// Enemy — base class for every mob/boss (the bundle's `rh`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~15195-15875. Walks the lane path toward the base, takes hits (HP bar +
// floating damage numbers), supports knockback / muddy-slow / footprints / stun,
// dies (gold + weapon-fragment drop), and exposes the state machine + buff
// attribute hooks the rest of the battle relies on. Concrete enemies build
// `enemy`/`ZM` and set base stats. Opaque field names kept verbatim.
//
//   hp=Li(Qi)  maxHp=VM  speed=Xu  walkPath=path  hit=hit  knockback=back

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameObject } from "./game-object";
import { GameMgr } from "../core/game-mgr";
import { LayerZ } from "../core/layer-z";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { SceneMgr } from "../core/scene-mgr";
import { PrefabFactory } from "./prefab-factory";
import { EffectMgr } from "./effect-mgr";
import { DamageStatsMgr } from "./dps-mgr";
import { EnemyFactory } from "./enemy-factory";
import { WeaponFragmentMgr } from "./weapon-fragment-mgr";
import { General } from "./general";

const F = GameMgr;
const X = LayerZ;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const $ = AudioMgr;
const f = MathE;
const K = SceneMgr;
const z = PrefabFactory;
const q = EffectMgr;
const ah = DamageStatsMgr;
const ss = EnemyFactory;
const eh = WeaponFragmentMgr;
const va = General;

export class Enemy extends GameObject {
  qd = true;
  Bw = false;
  id = 0;
  type = 0;
  yM = false;
  protected cb = false;
  protected Mo = new Laya.Point();
  protected Po = new Laya.Point();
  protected fM = 0;
  protected gM = false;
  protected dM = 0;
  protected LM = 0;
  protected mM = 1;
  protected wM = 0;
  pk = 0;
  protected vM = new Laya.Vector2();
  protected kM = false;
  protected _M = false;
  protected xM = new Laya.Vector2();
  protected SM = 50;
  protected bM = 0;
  protected yb = 1;
  protected MM = 0;
  protected PM = 0;
  protected AM = 0;
  protected EM = 0;
  Aw = Infinity;
  protected BM = 0;
  protected Hg: any = null;
  protected IM = false;
  protected DM: any[] = [];
  protected TM = 0;
  protected RM = false;
  protected CM = 0;
  protected UM = 0;
  protected FM: any[] = [];
  protected OM = ["泥泞的地面让我寸步难行！", "我好像踩到什么了", "我要吐了"];
  protected YM = false;
  protected XM = 0;
  protected gL = 0;
  protected HM = false;
  protected WM = 0;
  protected zM = false;
  protected jM = false;
  protected $M: any[] = [];
  protected NM = new Laya.Point(0, 0);

  // Provided/assigned by concrete enemies + init.
  protected dg: any;
  enemy: any;
  protected ZM: any;
  protected QM = 0;
  protected Li = 0;
  curState = 0;
  protected Hv: any;
  protected eP: any;
  protected path: any;
  protected KM: any;
  protected JM: any;
  protected tP: any;
  protected qM: any;
  protected sP = 0;
  protected iP: any;
  protected mP = 0;
  protected wP = 0;
  protected AP: any;
  protected SP = 0;
  protected bP: any;

  get Qi(): number {
    return this.Li;
  }
  set Qi(t: number) {
    this.Li = t;
    this.qM.text = this.Qi.toFixed(0);
  }
  get VM(): number {
    return this.QM + this.LM;
  }
  get Xu(): number {
    const t = this.SM + this.bM;
    this.yb = t / this.SM;
    this.ZM.yb(this.yb);
    return t;
  }
  get centerX(): number {
    return this.enemy.x + this.enemy.width / 2;
  }
  get centerY(): number {
    return this.enemy.y + this.enemy.height / 2;
  }
  get x(): number {
    return this.enemy.x;
  }
  get y(): number {
    return this.enemy.y;
  }
  pos(t: number, s: number): any {
    return this.enemy.pos(t, s);
  }

  init(t: any): void {
    this.dg = F.instance();
    this.qd = t;
    this.gM = false;
    this.id = this.dg.incCounter();
    this.enemy.name = `enemy_${this.id}`;
    this.enemy.zIndex = X.nr;
    this.KM = this.enemy.getChildByName("hpBgImg");
    this.JM = this.KM.getChildByName("hpImg1");
    this.tP = this.KM.getChildByName("hpImg2");
    this.qM = this.KM.getChildByName("hpNum");
    this.sP = this.tP.width;
    this.JM.width = this.sP;
    this.tP.width = this.sP;
    this.iP = this.enemy.getChildByName("shadow");
    this.Hg = this.enemy.getChildByName("stun");
    this.Hg.visible = false;
    this.curState = 0;
    y.instance.event(u.bt, this.enemy);
    this.hP();
    this.enemy.pos(this.Hv.x, this.Hv.y);
    y.instance.event(u.nt, this.id, this);
  }
  protected hP(_t?: any, _s?: any, _i?: any, _h?: any): void {
    if (this.Hv && this.Hv.x !== -1) return;
    const e = this.dg.map;
    if (!this.Hv) {
      this.Hv = new Laya.Point();
      this.eP = new Laya.Point();
    }
    this.Hv.x = (this.qd ? e.te.x : e.he.x) * e.gridWid;
    this.Hv.y = (this.qd ? e.te.y : e.he.y) * e.gridWid;
    this.eP.x = (this.qd ? e.se.x : e.ee.x) * e.gridWid + this.enemy.width / 2;
    this.eP.y = (this.qd ? e.se.y : e.ee.y) * e.gridWid + this.enemy.height / 2;
  }
  aP(t: any): boolean {
    return this.curState !== 0 && this.qd === t && this.curState !== 4 && this.Bw;
  }
  update(t: number): void {
    switch (this.curState) {
      case 0:
        break;
      case 1:
        this.move(t);
    }
    this.nP();
  }
  changeState(t: number): void {
    if (this.curState !== t) {
      this.iL();
      this.curState = t;
      this.sL();
    }
  }
  protected sL(): void {
    switch (this.curState) {
      case 0:
        this.Bw = false;
        break;
      case 1:
        this.rP();
        break;
      case 2:
        this.oP();
        break;
      case 3:
        this.lP();
        break;
      case 4:
        this.Bw = false;
        this.cP();
    }
  }
  protected iL(): void {
    switch (this.curState) {
      case 0:
        this.Bw = true;
        break;
      case 1:
        this.uP();
        break;
      case 2:
        this.pP();
        break;
      case 3:
        this.Hg.visible = false;
    }
  }
  protected yP(): void {
    this.path = this.qd ? this.dg.map.de : this.dg.map.Le;
  }
  protected rP(): void {}
  protected fP(t: any): void {
    this.xM.x += t.x * this.dg.map.gridWid;
    this.xM.y += t.y * this.dg.map.gridHei;
  }
  move(t: number): void {
    this.XM = this.pk;
    if (!this._M) {
      if (this.kM) {
        this.enemy.x += (this.xM.x * t) / 1000;
        this.enemy.y += (this.xM.y * t) / 1000;
        this.xM.x *= 0.9;
        this.xM.y *= 0.9;
        const s = this.gP();
        if (Math.abs(this.xM.x) < 0.1 && Math.abs(this.xM.y) < 0.1) {
          this.kM = false;
          y.instance.event(u.hs, this, 12);
          this.pk = this.dP(s);
        }
      } else if (!this.zM) this.$f(t);
    }
    if (this.XM !== this.pk) this.LP();
    this.aL();
  }
  protected LP(): void {
    if (this.pk === this.path.length - 3) y.instance.event(u._t, this.qd);
    else if (this.pk === this.path.length - 2) y.instance.event(u.wt, this.qd);
    else if (this.pk === this.path.length - 1) this.attack();
    else if (this.pk >= this.path.length) {
      $.instance().playSound("enemy_knife_attack");
      this.gameOver();
    }
  }
  protected aL(): void {
    const t = Math.floor((this.enemy.x + this.enemy.width / 2) / F.instance().map.gridWid);
    const s = Math.floor((this.enemy.y + this.enemy.height / 2) / F.instance().map.gridHei);
    if (t === this.mP && s === this.wP) return;
    if (this.Bw) y.instance.event(u.ft, this.id, this);
    this.Mo.x = this.enemy.x;
    this.Mo.y = this.enemy.y;
    this.Po.x = t * F.instance().map.gridWid;
    this.Po.y = s * F.instance().map.gridHei;
    if (f.distance(this.Mo, this.Po) > 5) return;
    this.AM = this.mP;
    this.EM = this.wP;
    this.mP = t;
    this.wP = s;
    y.instance.event(u.vt, this.qd, this.mP, this.wP);
    y.instance.event(u.kt, this.qd, this.mP, this.wP, this.id);
  }
  protected $f(t: number): void {
    if (this.pk < 0) return;
    if (this.pk >= this.path.length) return;
    const s = this.path[this.pk];
    const i = s.x * this.dg.map.gridWid - this.enemy.x;
    const h = s.y * this.dg.map.gridHei - this.enemy.y;
    const e = Math.sqrt(i * i + h * h);
    if (e < 1) this.pk++;
    else {
      const sx = i / e;
      const a = h / e;
      this.vM.setValue(sx, a);
      this.enemy.x += (sx * this.Xu * t) / 1000;
      this.enemy.y += (a * this.Xu * t) / 1000;
    }
    this.enemy.zIndex = X.entityZIndexFromPixelY(this.enemy.y, F.instance().map.gridHei);
    this.Aw = e + (this.path.length - 1 - this.pk) * this.dg.map.gridWid;
    this.vP();
  }
  protected kP(): number {
    let t = 0;
    let s = Infinity;
    for (let i = 0; i < this.path.length; i++) {
      const h = this.path[i];
      const e = h.x * this.dg.map.gridWid - this.enemy.x;
      const a = h.y * this.dg.map.gridHei - this.enemy.y;
      const n = e * e + a * a;
      if (n < s) {
        s = n;
        t = i;
      }
    }
    return t;
  }
  protected dP(t: number): number {
    return Math.min(t + 1, this.path.length - 1);
  }
  protected gP(): number {
    const t = this.kP();
    const s = this.path[t];
    if (s) {
      const v = this._P(this.enemy, s);
      if (v !== Laya.Vector2.ZERO) {
        this.enemy.x -= v.x;
        this.enemy.y -= v.y;
      }
    }
    return t;
  }
  protected _P(t: any, s: any): any {
    const i = this.dg.map.gridWid;
    const h = this.dg.map.gridHei;
    Laya.Point.TEMP.setTo(s.x * i, s.y * h);
    const e = Laya.Point.TEMP.x - i / 2;
    const a = Laya.Point.TEMP.x + i / 2;
    const n = Laya.Point.TEMP.y - h / 2;
    const r = Laya.Point.TEMP.y + h / 2;
    const o = Math.max(e - t.x, 0);
    const l = Math.max(t.x - a, 0);
    const c = Math.max(n - t.y, 0);
    const uu = Math.max(t.y - r, 0);
    if (o === 0 && l === 0 && c === 0 && uu === 0) return Laya.Vector2.ZERO;
    const p = Math.max(o, l, c, uu);
    if (p === o) Laya.Vector2.TEMP.setValue(-p, 0);
    else if (p === l) Laya.Vector2.TEMP.setValue(p, 0);
    else if (p === c) Laya.Vector2.TEMP.setValue(0, -p);
    else if (p === uu) Laya.Vector2.TEMP.setValue(0, p);
    else return Laya.Vector2.ZERO;
    return Laya.Vector2.TEMP;
  }
  protected uP(): void {}
  protected oP(): void {}
  protected pP(): void {}
  protected $m(): void {}
  hit(t: number, s: any): void {
    if (this.Qi <= 0) return;
    const i = j.instance().elapsed;
    if (!this.fM || i - this.fM > 50) {
      $.instance().playSound("enemy_hit");
      this.fM = i;
    }
    this.Qi -= t;
    if (this.Qi < 0) this.Qi = 0;
    ah.instance().uM(t, this.qd);
    this.$m();
    this.enemy.event("onHit");
    this.tP.width = this.sP * (this.Qi / this.VM);
    Laya.Tween.create(this.JM).to("width", this.tP.width).duration(500).ease(Laya.Ease.linearIn);
    this.xP(t);
    if (this.Qi <= 0) this.changeState(4);
    if (s) {
      if (s instanceof va) {
        if (this.FM.indexOf(s.id) === -1) this.FM.push(s.id);
        if (this.Qi <= 0) {
          this.FM.splice(this.FM.indexOf(s.id), 1);
          y.instance.event(u.ht, s.id, this.FM);
        }
      } else if (this.Qi <= 0) y.instance.event(u.ht, s.id, this.FM, true);
    }
  }
  protected xP(t: number): void {
    if (!F.instance().settingData().showDamageNum) return;
    let s = 1;
    if (Laya.timer.currTimer - this.TM < 300) {
      this.SP = Math.floor(this.SP + t);
      this.bP.value = this.SP.toString();
      s = Math.min(Math.floor(this.SP / 10), 15);
      this.bP.scale(1 + 0.05 * s, 1 + 0.05 * s);
      return;
    }
    this.TM = Laya.timer.currTimer;
    const i = z.instance().getItem("damageNum", this);
    s = Math.min(Math.floor(t / 10), 15);
    i.value = t.toFixed(0);
    i.scale(1 + 0.05 * s, 1 + 0.05 * s);
    y.instance.event(u.Ut, i, X.Ur);
    if (this.IM) return;
    Laya.Point.TEMP.x = this.enemy.width / 2;
    Laya.Point.TEMP.y = this.enemy.height / 2;
    this.enemy.localToGlobal(Laya.Point.TEMP);
    i.parent.globalToLocal(Laya.Point.TEMP);
    i.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    const h = new Laya.Point(i.x, i.y);
    const e = new Laya.Point(i.x + (f.range(-50, 50) as number), i.y + (f.range(-150, -100) as number));
    const a = new Laya.Point(e.x, i.y);
    q.instance().registerBezier(h, e, a, i, 500, () => {
      i.alpha = 1;
      i.removeSelf();
      z.instance().recover("damageNum", i);
    });
    this.bP = i;
    this.SP = t;
  }
  protected lP(): void {}
  protected cP(): void {
    if (Math.random() < 0.5) $.instance().playSound("enemy_dead");
    this.IM = true;
    this.Hg.visible = false;
    this.enemy.event("onDead");
    let t = 1;
    if (this.yM) t = 10;
    if (this.qd) {
      this.Mo.x = this.enemy.x + this.enemy.width / 2;
      this.Mo.y = this.enemy.y;
      this.enemy.parent.localToGlobal(this.Mo);
      q.instance().playGoldUp(this.Mo.x, this.Mo.y, t);
      this.dg.battleState.gold += t;
    } else this.dg.battleState.Ki += t;
    this.MP();
  }
  attack(): void {
    if (Laya.timer.currTimer - this.gL >= 500) {
      if (!this.path || this.path.length < 2) return;
      let t: number;
      let s: number;
      let i: number;
      s = this.enemy.width / 2;
      if (this.path[this.path.length - 1].y - this.path[this.path.length - 2].y > 0) {
        i = this.enemy.height - 20;
        t = 240;
      } else {
        i = this.enemy.height - 20;
        t = 70;
      }
      q.instance().playEnemyKnifeAttack(this.enemy, s, i, t);
      Laya.timer.once(50, this, () => {
        if (this.Bw) {
          this.dg.battleState.Xi = true;
          if (this.qd) this.dg.battleState.playerLives -= 1;
          else this.dg.battleState.enemyLives -= 1;
        }
      });
      this.gL = Laya.timer.currTimer;
    }
  }
  back(t: number, s: number): void {
    if (this.HM || this.IM || this.pk < 1) return;
    const i = this.dg.map.gridWid;
    const h = this.dg.map.gridHei;
    const e = this.pk - 1;
    const a = this.path[e];
    const n = this.path[this.pk];
    let r = a.x * i;
    let o = a.y * h;
    const l = Math.max(0, i - this.enemy.width / 2 - 1);
    const c = Math.max(0, h - this.enemy.height / 2 - 1);
    if (n.y !== a.y) o += Math.min(Math.max(0, s), c);
    else {
      if (n.x === a.x) return;
      r += Math.min(Math.max(0, t), l);
    }
    if (Math.abs(this.enemy.x - r) < 2 && Math.abs(this.enemy.y - o) < 2) return;
    Laya.Tween.killAll(this.enemy);
    this.HM = true;
    Laya.Tween.to(
      this.enemy,
      { x: r, y: o },
      50,
      Laya.Ease.cubicOut,
      Laya.Handler.create(this, () => {
        this.enemy.pos(r, o);
        this.pk = e;
        this.HM = false;
      }),
      0,
      true,
    );
  }
  PP(): void {
    if (!this.AP) {
      this.AP = new Laya.Sprite();
      this.AP.graphics.drawPoly(0, 0, [73, -33, 47, 55, 2, 55, -28, -33], "#fff");
    }
    this.AP.pos(15, 0);
    this.enemy.mask = this.AP;
    const t = this.enemy.y;
    Laya.Tween.create(this.enemy)
      .to("y", t + 15)
      .duration(100)
      .chain()
      .to("scaleY", 0.9)
      .duration(50)
      .chain()
      .to("scaleY", 1)
      .duration(50)
      .chain()
      .delay(3800)
      .to("y", t)
      .duration(1000)
      .onStart(() => {
        this.WM = q.instance().registerShake(this.ZM, 30, 1000, () => {
          this.ZM.rotation = 0;
          this.changeState(1);
        });
      }, this);
    Laya.Tween.create(this.AP)
      .to("y", -15)
      .duration(100)
      .chain()
      .to("y", 15)
      .duration(1000)
      .delay(3900)
      .then(() => {
        this.enemy.mask = null;
      }, this);
  }
  EP(_t: any, _s: any, _i: any): void {}
  BP(_t: any): void {}
  IP(t?: () => void): void {
    this.iP.visible = false;
    this.enemy.anchorX = 0.5;
    this.enemy.anchorY = 1;
    this.enemy.scale(0, 0);
    this.enemy.visible = true;
    this.enemy.pos(this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height / 2);
    Laya.Tween.create(this.enemy)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(300)
      .then(() => {
        const s1 =
          this.Hv.y > this.eP.y
            ? this.enemy.y - F.instance().map.gridHei / 4
            : this.enemy.y + F.instance().map.gridHei * (3 / 4);
        Laya.Tween.create(this.enemy)
          .to("y", s1)
          .to("scaleX", 1.2)
          .to("scaleY", 1.2)
          .duration(300)
          .then(() => {
            const s2 =
              this.Hv.y > this.eP.y
                ? this.enemy.y - F.instance().map.gridHei / 4
                : this.enemy.y + F.instance().map.gridHei * (3 / 4);
            Laya.Tween.create(this.enemy)
              .to("y", s2)
              .to("scaleX", 1)
              .to("scaleY", 1)
              .duration(300)
              .then(() => {
                this.iP.visible = true;
                Laya.Tween.create(this.enemy)
                  .to("scaleX", 1.1)
                  .to("scaleY", 0.9)
                  .duration(100)
                  .then(() => {
                    Laya.Tween.create(this.enemy)
                      .to("scaleX", 1)
                      .to("scaleY", 1)
                      .duration(100)
                      .then(() => {
                        this.enemy.anchorX = 0;
                        this.enemy.anchorY = 0;
                        this.enemy.pos(this.enemy.x - this.enemy.width / 2, this.enemy.y - this.enemy.height);
                        if (t) t();
                      });
                    y.instance.event(u.rs);
                    this.Rv();
                  });
              });
          });
      });
  }
  Dg(t: number): any {
    return t === 3 ? this.SM : t === 4 ? this.QM : t === 6 ? this.mM : undefined;
  }
  Tg(t: number, s: number, i = false): void {
    if (t === 3) this.bM += s;
    else if (t === 4) {
      this.LM += s;
      if (!i && s > 0) this.Qi += s;
      if (this.Qi > this.VM) this.Qi = this.VM;
    } else if (t === 6) {
      this.wM += s;
      this.ZM.scale(this.mM + this.wM, this.mM + this.wM);
    }
  }
  setState(t: number, s: any, i: any): void {
    if (t === 0) this.zM = s;
    else if (t === 5) {
      if (!s) return;
      this.kM = true;
      this.fP(i);
    } else if (t === 4) {
      this.jM = s;
      if (s) this.hit(i, null);
    } else if (t === 6) this._M = s;
  }
  protected pg(): any {
    return this.enemy;
  }
  protected vP(): void {
    if (!(this.qd ? this.dg.battleState.Ri : this.dg.battleState.Ci)) return;
    this.Mo.x = this.enemy.x;
    this.Mo.y = this.enemy.y;
    if (f.distance(this.NM, this.Mo) < 30) return;
    const t = z.instance().getItem("footprint", this);
    t.zIndex = X.cr;
    y.instance.event(u.St, t);
    t.pos(this.enemy.x + this.enemy.width / 2, this.enemy.y + (3 / 4) * this.enemy.height);
    t.rotation = f.angle(this.NM, this.Mo);
    this.NM.x = this.enemy.x;
    this.NM.y = this.enemy.y;
    this.$M.push(t);
  }
  protected nP(): void {
    for (let t = this.$M.length - 1; t >= 0; t--) {
      const s = this.$M[t];
      s.alpha -= 0.01;
      if (s.alpha <= 0) {
        s.removeSelf();
        s.alpha = 1;
        z.instance().recover("footprint", s);
        this.$M.splice(t, 1);
      }
    }
  }
  protected Rv(): void {
    if (((this.dg.battleState.Ri && this.qd) || (this.dg.battleState.Ci && !this.qd)) && Math.random() < 0.01) {
      const t = this.enemy.x < this.enemy.parent.width / 2 ? this.enemy.width : 0;
      Laya.Point.TEMP.x = t;
      Laya.Point.TEMP.y = 0;
      this.enemy.localToGlobal(Laya.Point.TEMP);
      q.instance().showTalkBox(
        Laya.Point.TEMP.x,
        Laya.Point.TEMP.y,
        this.OM[f.range(0, this.OM.length, true) as number],
        this.enemy,
      );
    }
  }
  protected MP(): void {
    if (!this.YM) return;
    if (!eh.instance().Zb()) return;
    const t = eh.instance().sM();
    if (t.weaponId < 0 || t.fragmentNum <= 0) return;
    eh.instance().setWeaponFragments(t.weaponId, t.fragmentNum);
    Laya.Point.TEMP.x = this.enemy.width / 2;
    Laya.Point.TEMP.y = this.enemy.height;
    this.enemy.localToGlobal(Laya.Point.TEMP);
    const s = K.instance().getScene("BattleScene").getChildByName("box").getChildByName("effectBox");
    const i = K.instance().getScene("BattleScene").getChildByName("box").getChildByName("xBtn");
    const h = Laya.Point.TEMP.x;
    const e = Laya.Point.TEMP.y;
    Laya.Point.TEMP.x = i.width / 2;
    Laya.Point.TEMP.y = i.height / 2;
    i.localToGlobal(Laya.Point.TEMP);
    const a = Laya.Point.TEMP.x;
    const n = Laya.Point.TEMP.y;
    q.instance().flyWeaponFragment(t.weaponId, s, h, e, a, n, null, null, this.qd);
    if (this.qd) this.dg.battleState.zi.push(t);
    else this.dg.battleState.ji.push(t);
    this.dg.battleState.Wi.push(t);
  }
  gameOver(): void {
    super.gameOver();
    j.instance().unregister("Enemy" + this.id);
    y.instance.event(u.es, this.id);
    y.instance.event(u.ot, this.id);
    this.offAll();
    Laya.timer.clearAll(this);
    Laya.Tween.killAll(this.enemy);
    q.instance().removeEvent("shake", this.WM);
    Laya.Tween.killAll(this.JM);
    this.Aw = Infinity;
    this.Bw = false;
    this.kM = false;
    this.xM.x = 0;
    this.xM.y = 0;
    this.IM = false;
    this.path = null;
    this.XM = 0;
    this.pk = 0;
    this.curState = 0;
    this.enemy.visible = true;
    this.enemy.anchorX = 0;
    this.enemy.anchorY = 0;
    this.enemy.scale(1, 1);
    this.enemy.rotation = 0;
    this.enemy.removeSelf();
    this.JM.width = this.sP;
    this.tP.width = this.sP;
    this.Hv.x = -1;
    this.Hv.y = -1;
    this.eP.x = -1;
    this.eP.y = -1;
    this.FM.length = 0;
    this.Hg.visible = false;
    ss.instance().recover(this);
    this.gM = true;
    for (let t = this.$M.length - 1; t >= 0; t--) {
      const s = this.$M[t];
      s.removeSelf();
      s.alpha = 1;
      z.instance().recover("footprint", s);
    }
    this.$M.length = 0;
    this.YM = false;
  }
}
