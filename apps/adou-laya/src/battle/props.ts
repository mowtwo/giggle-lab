// Props — the battle items (shovel/spell/bulldozer…) base + factory.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js: the
// PropsFactory (`_i`, ~12018), the prop base `Si` (~12151) and the concrete
// props (`bi` shovel, … registered with the factory). Each prop extends Prop,
// drives its cooldown ring, and on drop runs its `tk` use-effect. The remaining
// concrete props are layered into this file. Opaque names kept verbatim.
//
//   PropsFactory=_i  PropBase=Si  ShovelProp=bi  cooldown=cd  useEffect=tk

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Prop } from "./prop";
import { GameMgr } from "../core/game-mgr";
import { LayerZ } from "../core/layer-z";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { TipMgr } from "../core/tip-mgr";
import { EntityRegistry } from "./entity-registry";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BuffMgr } from "./buff-mgr";
import { BowSoldier } from "./soldier-types";
import { GeneralPart } from "./general-part";
import { AudioMgr } from "../core/audio-mgr";
import { EffectMgr } from "./effect-mgr";

const F = GameMgr;
const X = LayerZ;
const y = EventMgr;
const u = GameEvent;
const tt = TipMgr;
const Ki = EntityRegistry;
const Eh = EnemySpatialMgr;
const th = BuffMgr;
const ci = BowSoldier;
const gi = GeneralPart;
const $ = AudioMgr;
const q = EffectMgr;

/** Pools + produces prop instances by enum type. (`_i`) */
export class PropsFactory {
  private ag = new Map<number, () => any>();
  private static _instance: PropsFactory;

  static instance(): PropsFactory {
    if (!PropsFactory._instance) {
      PropsFactory._instance = new PropsFactory();
      PropsFactory._instance.init();
    }
    return PropsFactory._instance;
  }
  init(): void {}
  produce(cls: any): any {
    return Laya.Pool.createByClass(cls);
  }
  recover(obj: any): void {
    Laya.Pool.recoverByClass(obj);
  }
  register(t: number, s: () => any): void {
    this.ag.set(t, s);
  }
  ng(t: number): any {
    const s = this.ag.get(t);
    if (!s) throw new Error(`PropsFactory：未为枚举类型 ${t} 注册创建函数`);
    return s();
  }
}
const _i = PropsFactory;

/** Base for a draggable, cooldown-gated battle item. (`Si`) */
export class PropBase extends Prop {
  protected zv = true;
  protected Qv = 0;
  protected Zv = false;
  protected Kv = 0;
  protected bd = new Laya.Point(0, 0);
  protected cd = 0;
  protected parent: any;
  protected cd0?: any;

  init(qd: any, type: number): void {
    super.init(qd, type);
    console.log(F.instance().props.Ue[this.type].txt);
    this.cd = F.instance().props.Ue[type].cd;
    this.props.zIndex = X.wr;
  }
  start(): void {
    super.start();
    if (this.cd <= 0 && this.Hv.containerType === 4)
      y.instance.event(u.jt, this.qd, this.Xv, this.Gv, 360);
  }
  /** Whether the prop can be used at the drop target. (`Jv`) */
  Jv(_t: any, _s: any = null): boolean {
    return true;
  }
  /** Use the prop (announces enemy use, then runs the effect). (`tk`) */
  tk(t: any, s: any = null): void {
    if (!this.qd) tt.instance().showTip(`敌方使用了${F.instance().props.Ue[this.type].txt}`);
    this.Nv(t, s);
  }
  update(t: number): void {
    super.update(t);
    this.hk(t);
  }
  /** Whether the cooldown is still charging. (`ek`) */
  ek(): boolean {
    return this.Kv < this.cd;
  }
  setParent(t: number, s: number, i: number): void {
    super.setParent(t, s, i);
  }
  /** Advance the cooldown ring. (`hk`) */
  hk(t: number): void {
    this.Kv += t;
    if (this.Kv > this.cd) return;
    let s = this.Kv / this.cd;
    if (1 - s < 0.01) {
      s = 1;
      this.Kv = this.cd;
    }
    y.instance.event(u.jt, this.qd, this.Xv, this.Gv, 360 * s);
  }
  ak(): void {
    this.props.x = this.bd.x;
    this.props.y = this.bd.y;
  }
  reset(): void {
    super.reset();
    this.Kv = 0;
    y.instance.event(u.$t, this.qd, this.Xv, this.Gv);
  }
  gameOver(): void {
    this.cd = 0;
    super.gameOver();
  }
  onMouseDown(): void {
    this.parent = this.props.parent;
    this.bd.x = this.props.x;
    this.bd.y = this.props.y;
  }
  onMouseMove(): void {
    if (!this.ek()) this.Ed = true;
  }
  onMouseUp(): void {
    super.onMouseUp();
  }
}

/** 铲子 — clears a board cell / removes a farmer. (`bi`) */
export class ShovelProp extends PropBase {
  protected rk = 1;
  private Gi = false;
  private lk: any;
  constructor() {
    super();
    this.rk = 1;
    this.Gi = false;
  }
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.lk = new Laya.Image("resources/img/props/shovelShadow.png");
    this.lk.size(69, 41);
    this.lk.pos(8.5, 32);
    this.lk.zIndex = 1;
    this.props.addChild(this.lk);
    this.Wv.size(63, 66);
    this.Wv.anchorX = 0.5;
    this.Wv.anchorY = 0.5;
    this.Wv.pos(this.props.width / 2, this.props.height / 2);
    this.Wv.zIndex = 2;
    this.Gi = qd ? F.instance().battleState.Gi : F.instance().battleState.Hi;
    this.Wv.skin = this.Gi ? "resources/img/props/shovel_2.png" : "resources/img/props/shovel_1.png";
    this.lk.visible = true;
  }
  ck(): void {
    this.Wv.scale(0, 0);
    Laya.Tween.to(this.Wv, { scaleX: 1, scaleY: 1 }, 300);
  }
  onMouseDown(): void {
    super.onMouseDown();
    this.lk.visible = false;
  }
  tk(t: any, s: any = null): void {
    const i = s.Mv(t.containerType, this.qd).getItem(t.x, t.y);
    if (i) {
      if (this.qd) {
        this.ak();
        tt.instance().showTip("请先妥善安置农民");
        return;
      }
      Ki.instance().uk(i.id);
    }
    s.Mv(this.Hv.containerType, this.qd).removeItem(this.Hv.x, this.Hv.y);
    y.instance.event(u.At, this.qd, t.x, t.y);
    y.instance.event(u.Lt, this.id);
  }
  gameOver(): void {
    super.gameOver();
    this.Gi = false;
    this.Wv.size(80, 80);
  }
}
_i.instance().register(0, () => Laya.Pool.createByClass(ShovelProp));

/** 推土机 — drives down the lane shoving enemies off the path. (`Mi`) */
export class BulldozerProp extends PropBase {
  protected rk = 0;
  private path: any[] = [];
  private pk = 0;
  private Xu = 50;
  private step = 0;
  private endIndex = 0;
  private yk = 1;
  private fk = false;
  private gk = 11;
  init(qd: any, type: number): void {
    super.init(qd, type);
    const i = new Laya.Image("resources/img/gameObject/soldier/shadow2.png");
    i.name = "shadow";
    i.size(80, 20);
    i.pos(0, 60);
    i.alpha = 0.5;
    i.zIndex = -1;
    this.props.addChild(i);
    this.Wv.anchorY = 1;
    this.Wv.y += this.props.height / 2;
    i.zIndex = X.gr;
    y.instance.on(u.gs, this, this.dk);
  }
  update(t: number): void {
    if (this.step === 1) {
      this.move(t);
      const s = this.Lk();
      Eh.instance().mk(this.qd, this.props.x + this.props.width / 2, this.props.y + this.props.height / 2, s.offsetX, s.offsetY);
    } else if (this.step === 2) {
      this.props.alpha -= t / 5000;
      const s = this.Lk();
      Eh.instance().mk(this.qd, this.props.x + this.props.width / 2, this.props.y + this.props.height / 2, s.offsetX, s.offsetY);
      if (this.props.alpha <= 0) {
        this.props.alpha = 0;
        y.instance.event(u.Lt, this.id);
      }
    }
  }
  tk(): void {
    $.instance().playSound("bulldozer_land");
    this.wk();
    this.props.zIndex = X.entityZIndexFromPixelY(this.props.y, F.instance().map.gridHei);
  }
  vk(): void {
    if (this.step === 0 && this.path.length > 0) this.step = 1;
  }
  private move(t: number): void {
    if (this.path.length <= 0) return;
    const s = this.path[this.pk].x * F.instance().map.gridWid;
    const i = this.path[this.pk].y * F.instance().map.gridHei;
    const h = s - this.props.x;
    const e = i - this.props.y;
    const a = (this.Xu * t) / 1000;
    const n = Math.sqrt(Math.pow(h, 2) + Math.pow(e, 2));
    const r = a * (h / n);
    const o = a * (e / n);
    if (Math.abs(e) <= 5 && Math.abs(h) <= 5) {
      const t0 = this.path[this.pk];
      const s0 = this.path[this.pk + 1];
      if (s0.x < t0.x) {
        this.Wv.skin = "resources/img/props/bulldozer_0.png";
        this.yk = 0;
      } else if (s0.x > t0.x) {
        this.Wv.skin = "resources/img/props/bulldozer_1.png";
        this.yk = 1;
      } else if (s0.y < t0.y) {
        this.Wv.skin = "resources/img/props/bulldozer_2.png";
        this.yk = 2;
      } else if (s0.y > t0.y) {
        this.Wv.skin = "resources/img/props/bulldozer_3.png";
        this.yk = 3;
      }
      this.pk += 1;
      if (this.pk === this.path.length - 1) this.step = 2;
      return;
    }
    this.props.x += r;
    this.props.y += o;
    this.props.zIndex = X.entityZIndexFromPixelY(this.props.y, F.instance().map.gridHei);
  }
  private Lk(): { offsetX: number; offsetY: number } {
    const t = F.instance().map;
    const s = Math.floor(this.props.x / t.gridWid) * t.gridWid;
    const i = Math.floor(this.props.y / t.gridHei) * t.gridHei;
    return { offsetX: this.props.x - s, offsetY: this.props.y - i };
  }
  private wk(): void {
    const t = this.qd ? F.instance().map.de : F.instance().map.Le;
    const s = t.length - 2;
    this.props.pos(t[s].x * F.instance().map.gridWid, t[s].y * F.instance().map.gridHei);
    const i = { x: t[s].x, y: t[s].y };
    y.instance.event(u.bt, this.props, i.x, i.y);
    const h = t[s - 1];
    if (h.x < i.x) {
      this.Wv.skin = "resources/img/props/bulldozer_0.png";
      this.yk = 0;
    } else if (h.x > i.x) {
      this.Wv.skin = "resources/img/props/bulldozer_1.png";
      this.yk = 1;
    } else if (h.y < i.y) {
      this.Wv.skin = "resources/img/props/bulldozer_2.png";
      this.yk = 2;
    } else if (h.y > i.y) {
      this.Wv.skin = "resources/img/props/bulldozer_3.png";
      this.yk = 3;
    }
    this.path.length = 0;
    for (let k = s; k >= 0; k--) {
      this.path.push({ x: t[k].x, y: t[k].y });
      if (this.path.length > this.gk) {
        this.endIndex = k;
        break;
      }
    }
  }
  private dk(t: any): void {
    if (t !== this.qd || this.fk) return;
    $.instance().playSound("bulldozer_push");
    this.fk = true;
    if (this.yk === 0)
      Laya.Tween.create(this.Wv)
        .to("skewX", -20)
        .duration(50)
        .chain()
        .to("skewX", 20)
        .duration(30)
        .chain()
        .to("skewX", 0)
        .duration(50)
        .then(() => {
          this.fk = false;
        });
    else if (this.yk === 1)
      Laya.Tween.create(this.Wv)
        .to("skewX", 20)
        .duration(50)
        .chain()
        .to("skewX", -20)
        .duration(30)
        .chain()
        .to("skewX", 0)
        .duration(50)
        .then(() => {
          this.fk = false;
        });
    else if (this.yk === 2 || this.yk === 3)
      Laya.Tween.create(this.Wv)
        .to("scaleX", 1.2)
        .to("scaleY", 0.7)
        .duration(100)
        .chain()
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(100)
        .then(() => {
          this.fk = false;
        });
  }
  gameOver(): void {
    super.gameOver();
    Laya.timer.clearAll(this);
    Laya.Tween.killAll(this.Wv);
    this.props.alpha = 1;
    this.props.zIndex = 0;
    this.path.length = 0;
    this.pk = 0;
    this.step = 0;
    this.Wv.rotation = 0;
    this.Wv.anchorY = 0.5;
    this.Wv.y -= this.props.height / 2;
    this.Wv.skewX = 0;
    this.fk = false;
  }
}
PropsFactory.instance().register(1, () => Laya.Pool.createByClass(BulldozerProp));

/** 文房四宝 — writes a character to transform a unit. (`Pi`) */
export class WritingBrushProp extends PropBase {
  protected rk = 3;
  private kk = false;
  private _k = true;
  private xk = 0;
  private path = [
    { x: 42, y: -25 },
    { x: 14, y: 5 },
    { x: 56, y: -6 },
    { x: 38, y: 22 },
    { x: 66, y: 17 },
  ];
  private pk = 0;
  private Sk: any;
  private bk: any;
  constructor() {
    super();
    this.Zv = true;
  }
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.Sk = new Laya.Image("resources/img/props/ink0.png");
    this.Sk.size(53, 44);
    this.Sk.pos(6, 7);
    this.Sk.visible = false;
    this.props.addChild(this.Sk);
    this.bk = new Laya.Image("resources/img/props/ink1.png");
    this.bk.size(74, 71);
    this.bk.pos(3, 4);
    this.bk.visible = false;
    this.props.addChild(this.bk);
  }
  protected Nv(t: any, s: any): void {
    const i = s.Mv(t.containerType, this.qd);
    this.xk = i.getItem(t.x, t.y).id;
    if (t.containerType === 2 || t.containerType === 1) y.instance.event(u.bt, this.props, t.x, t.y);
    else if (t.containerType === 3 && this.qd) y.instance.event(u.Mt, this.props, t.x);
    this.write();
  }
  private write(): void {
    Laya.Tween.create(this.Wv)
      .to("x", this.path[this.pk].x)
      .to("y", this.path[this.pk].y)
      .duration(100)
      .then(() => {
        if (this.path[Math.min(this.pk + 1, this.path.length - 1)].x > this.path[this.pk].x)
          this.Wv.skin = "resources/img/props/writingBrush_2.png";
        else this.Wv.skin = "resources/img/props/writingBrush_3.png";
        this.pk += 1;
        if (this.pk === 1) this.Sk.visible = true;
        if (this.pk === 3) this.bk.visible = true;
        if (this.pk === this.path.length) {
          y.instance.event(u.et, this.xk);
          this.reset();
          this.Wv.skin = "resources/img/props/writingBrush_1.png";
          return;
        }
        this.write();
      });
  }
  reset(): void {
    super.reset();
    this.pk = 0;
    this.Wv.pos(F.instance().map.gridWid / 2, F.instance().map.gridHei / 2);
    this.Sk.visible = false;
    this.bk.visible = false;
  }
  gameOver(): void {
    super.gameOver();
    Laya.Tween.killAll(this.Wv);
    this.Wv.pos(F.instance().map.gridWid / 2, F.instance().map.gridHei / 2);
    this.pk = 0;
    if (this.Sk) this.Sk.destroy();
    if (this.bk) this.bk.destroy();
  }
}
PropsFactory.instance().register(2, () => Laya.Pool.createByClass(WritingBrushProp));

/** 练兵符 — burns to raise/lower a unit's level by chance. (`Ai`) */
export class TrainingSpellProp extends PropBase {
  protected rk = 3;
  protected xk = -1;
  protected Ak = 0;
  protected Ek = [
    "resources/img/props/trainingSpellBurn0.png",
    "resources/img/props/trainingSpellBurn1.png",
    "resources/img/props/trainingSpellBurn2.png",
    "resources/img/props/trainingSpellBurn3.png",
    "resources/img/props/trainingSpellBurn4.png",
    "resources/img/props/trainingSpellBurn5.png",
  ];
  constructor() {
    super();
    this.Zv = true;
  }
  protected Nv(t: any, s: any = null): void {
    if (t.containerType === 2 || t.containerType === 1) y.instance.event(u.bt, this.props, t.x, t.y);
    else if (t.containerType === 3) y.instance.event(u.Mt, this.props, t.x);
    const i = s.Mv(t.containerType, this.qd);
    this.xk = i.getItem(t.x, t.y).id;
    this.Ak = q.instance().registerImgLoop(this.Wv, this.Ek, 100, 0, 1, (id: number) => {
      q.instance().removeEvent("imgLoop", id);
      this.Bk();
      this.reset();
    });
    $.instance().playSound("talisman_burn");
  }
  protected Bk(): void {
    const t = this.Ik();
    Laya.Point.TEMP.x = 0;
    Laya.Point.TEMP.y = 0;
    this.props.localToGlobal(Laya.Point.TEMP);
    if (t > 0) q.instance().playLvlUp(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    else q.instance().playLvlDown(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    y.instance.event(u.q, this.xk, t, false);
  }
  protected Ik(): number {
    const t = EntityRegistry.instance().Dk(this.xk);
    let s = 0;
    s = t.level < 3 ? 1 : t.level === 3 ? (Math.random() <= 0.7 ? 1 : -1) : Math.random() <= 0.6 ? 1 : -1;
    return s;
  }
  reset(): void {
    super.reset();
    this.Wv.skin = "resources/img/props/trainingSpell_1.png";
  }
  gameOver(): void {
    if (this.Ak > 0) q.instance().removeEvent("imgLoop", this.Ak);
    this.Ak = 0;
    Laya.Tween.killAll(this.Wv);
    this.xk = -1;
    super.gameOver();
  }
}
PropsFactory.instance().register(3, () => Laya.Pool.createByClass(TrainingSpellProp));

/** 升级符 — always raises a unit's level. (`Ei`) */
export class UpgradeSpellProp extends TrainingSpellProp {
  constructor() {
    super();
    this.Ek = [
      "resources/img/props/upLvlSpellBurn0.png",
      "resources/img/props/upLvlSpellBurn1.png",
      "resources/img/props/upLvlSpellBurn2.png",
      "resources/img/props/upLvlSpellBurn3.png",
      "resources/img/props/upLvlSpellBurn4.png",
      "resources/img/props/upLvlSpellBurn5.png",
    ];
  }
  protected Ik(): number {
    return 1;
  }
  reset(): void {
    super.reset();
    this.Wv.skin = "resources/img/props/upLvlSpell_1.png";
  }
}
PropsFactory.instance().register(4, () => Laya.Pool.createByClass(UpgradeSpellProp));

/** 续命丹 — 55% +1 life / else -1 life, 10 charges. (`Bi`) */
export class LifePillProp extends PropBase {
  protected rk = 4;
  private count = 10;
  private Tk: any = null;
  private Rk = new Laya.Point();
  private Ck = 0;
  private Uk = false;
  private Fk: any;
  private Ok: any;
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.Fk = new Laya.Text();
    this.Fk.text = this.count.toString();
    this.Fk.size(this.props.width, this.props.height);
    this.Fk.fontSize = 30;
    this.Fk.color = "#ffffff";
    this.Fk.stroke = 5;
    this.Fk.align = "right";
    this.Fk.valign = "bottom";
    this.Fk.zIndex = 10;
    this.props.addChild(this.Fk);
    this.Ok = new Laya.Image("resources/img/props/lifePillStink.png");
    this.Ok.size(160, 168);
    this.Ok.anchorX = 0.5;
    this.Ok.anchorY = 0.5;
    this.Ok.pos(this.props.width / 2, this.props.height / 2);
    this.Ok.zIndex = 1;
    this.Ok.visible = false;
    this.props.addChild(this.Ok);
  }
  tk(t: any, s: any = null): void {
    if (this.ek() || this.count <= 0) return;
    super.tk(t, s);
  }
  protected Nv(_t: any, _s: any = null): void {
    const i = ++this.Ck;
    this.Uk = false;
    const h = Math.random() < 0.55;
    const e = h ? 1 : -1;
    const a = h ? "resources/img/props/lifePill_1.png" : "resources/img/props/lifePill_2.png";
    this.Yk();
    if (this.qd) this.ak();
    const n = this.Xk(a);
    this.Tk = n;
    y.instance.event(u.Xt, this.qd, n, () => {
      if (i === this.Ck) {
        this.Uk = true;
        this.Yk();
        this.Gk(e);
      }
    });
    Laya.timer.once(800, this, this.Hk, [i]);
  }
  private Xk(t: string): any {
    const s = new Laya.Image(t);
    s.size(this.props.width, this.props.height);
    s.anchorX = 0.5;
    s.anchorY = 0.5;
    y.instance.event(u.Ut, s, X.wr);
    const i = s.parent;
    this.Rk.x = this.props.width / 2;
    this.Rk.y = this.props.height / 2;
    this.props.localToGlobal(this.Rk);
    i.globalToLocal(this.Rk);
    s.pos(this.Rk.x, this.Rk.y);
    return s;
  }
  private Yk(): void {
    if (this.Tk) {
      Laya.Tween.killAll(this.Tk);
      this.Tk.removeSelf();
      this.Tk.destroy();
      this.Tk = null;
    }
  }
  private Hk(t: number): void {
    if (t === this.Ck && !this.Uk) {
      this.Ck++;
      this.Yk();
    }
  }
  private Gk(t: number): void {
    Laya.timer.clearAll(this);
    const s = F.instance().battleState;
    s.Xi = false;
    if (this.qd) s.playerLives += t;
    else s.enemyLives += t;
    this.count -= 1;
    this.Fk.text = this.count.toString();
    if (t < 0) this.Wk();
    this.zk();
  }
  private zk(): void {
    if (this.count <= 0) {
      this.count = 10;
      this.Fk.text = "10";
      this.Kv = 0;
      y.instance.event(u.$t, this.qd, this.Xv, this.Gv);
    }
  }
  private Wk(): void {
    this.Ok.visible = true;
    this.Ok.alpha = 1;
    this.Ok.scale(1, 1);
    Laya.Tween.killAll(this.Ok);
    Laya.Tween.to(
      this.Ok,
      { scaleX: 2, scaleY: 2, alpha: 0 },
      200,
      null,
      Laya.Handler.create(this, () => {
        this.Ok.visible = false;
        this.Ok.alpha = 1;
        this.Ok.scale(1, 1);
      }),
    );
  }
  gameOver(): void {
    this.Ck++;
    Laya.timer.clearAll(this);
    this.Yk();
    Laya.Tween.killAll(this.Ok);
    this.Ok.visible = false;
    super.gameOver();
    this.count = 10;
  }
}
PropsFactory.instance().register(5, () => Laya.Pool.createByClass(LifePillProp));

/** 鼓舞 — range-up aura applied to a soldier or general. (`Ii`) */
export class RangeUpProp extends PropBase {
  protected rk = 3;
  protected xk = 0;
  private range = 0;
  private Nk = 0;
  private qk = false;
  private Vk: any;
  constructor() {
    super();
    this.Zv = true;
  }
  init(qd: any, type: number): void {
    super.init(qd, type);
    if (!this.Vk) {
      this.Vk = new Laya.Image();
      this.Vk.skin = "resources/img/props/rangeUp.png";
    }
    this.Vk.visible = false;
  }
  protected Nv(t: any, s: any): void {
    const i = s.Mv(t.containerType, this.qd).getItem(t.x, t.y);
    let h: any;
    let e: any;
    let a = false;
    if (i instanceof ci) {
      h = i;
      e = F.instance().toLocal(i.Yn, true);
      a = false;
    } else if (i instanceof gi) {
      const g = EntityRegistry.instance().Qk.get(i.Zw);
      h = g;
      e = F.instance().toLocal(g.general, true);
      a = true;
    }
    this.xk = h.id;
    this.range = h.Da;
    this.qk = a;
    this.Vk.visible = true;
    this.Vk.size(2 * this.range, 2 * this.range);
    this.Vk.anchor(0.5, 0.5);
    this.Vk.scale(1, 1);
    this.Vk.alpha = 0;
    y.instance.event(u.bt, this.Vk);
    this.Vk.pos(e.x, e.y);
    this.Nk = 1;
    this.reset();
  }
  update(t: number): void {
    super.update(t);
    this.Zk(t);
  }
  private Zk(t: number): void {
    if (this.Nk === 1) {
      this.Vk.alpha += t / 100;
      if (this.Vk.alpha >= 1) this.Nk = 2;
    } else if (this.Nk === 2) {
      this.Vk.scaleX += t / 100;
      this.Vk.scaleY += t / 100;
      if (this.Vk.scaleX >= 2) this.Nk = 3;
    } else if (this.Nk === 3) {
      this.Vk.alpha -= t / 500;
      if (this.Vk.alpha <= 0) {
        const tid = this.xk;
        th.instance().applyBuff(tid, 2, 1, true);
        EntityRegistry.instance().Kk(tid, 0, 2, 1, true);
        this.Vk.removeSelf();
        this.Nk = 0;
      }
    }
  }
  reset(): void {
    super.reset();
    this.Wv.alpha = 1;
  }
  gameOver(): void {
    super.gameOver();
    this.Nk = 0;
    this.Wv.alpha = 1;
  }
}
PropsFactory.instance().register(6, () => Laya.Pool.createByClass(RangeUpProp));

/** 砚台 — drops ink that slows enemies in an area. (`Di`) */
export class InkstoneProp extends PropBase {
  protected rk = 0;
  private Jk: any;
  private ink: any;
  init(qd: any, type: number): void {
    super.init(qd, type);
  }
  protected Nv(t: any, _s: any): void {
    const { x: i, y: h } = t;
    this.props.visible = false;
    if (!this.Jk) {
      this.Jk = new Laya.Image("resources/img/props/inkstone_1.png");
      this.Jk.size(100, 100);
    }
    this.Jk.skin = "resources/img/props/inkstone_1.png";
    this.Jk.alpha = 1;
    this.Jk.scale(1, 1);
    this.Jk.zIndex = X.vr;
    if (!this.ink) {
      this.ink = new Laya.Image("resources/img/props/ink.png");
      this.ink.size(319, 336);
      this.ink.anchorX = 0.5;
      this.ink.anchorY = 0.5;
    }
    this.ink.removeSelf();
    this.ink.alpha = 1;
    this.ink.scale(0.5, 0.5);
    this.ink.zIndex = X.vr;
    y.instance.event(u.bt, this.Jk, i, h - 1);
    Laya.Tween.to(this.Jk, { y: this.Jk.y + F.instance().map.gridWid, scaleX: 0.8, scaleY: 0.8 }, 320);
    const e = q.instance().registerImgLoop(
      this.Jk,
      [
        "resources/img/props/inkstone_2.png",
        "resources/img/props/inkstone_3.png",
        "resources/img/props/inkstone_4.png",
        "resources/img/props/inkstone_5.png",
      ],
      80,
      0,
      1,
      () => {
        q.instance().removeEvent("imgLoop", e);
        Laya.Tween.to(this.Jk, { alpha: 0 }, 100, null, Laya.Handler.create(this, () => {}));
        y.instance.event(u.bt, this.ink, i, h);
        this.ink.pos(this.ink.x + F.instance().map.gridWid / 2, this.ink.y + F.instance().map.gridHei / 2);
        $.instance().playSound("skill_ink_splash");
        Laya.Tween.to(
          this.ink,
          { scaleX: 1, scaleY: 1 },
          200,
          Laya.Ease.cubicOut,
          Laya.Handler.create(this, () => {
            const list = EntityRegistry.instance().t_(this.ink.x, this.ink.y, 1.5 * F.instance().map.gridWid, !this.qd);
            for (let s = 0; s < list.length; s++) th.instance().applyBuff(list[s].id, 1, -0.2, true, 5000);
            Laya.Tween.to(this.ink, { alpha: 0 }, 5000);
            this.reset();
          }),
        );
      },
    );
  }
  reset(): void {
    super.reset();
    this.props.visible = true;
  }
  gameOver(): void {
    if (this.Jk) {
      Laya.Tween.killAll(this.Jk);
      Laya.Tween.killAll(this.ink);
      this.Jk.removeSelf();
      this.ink.removeSelf();
    }
    this.props.visible = true;
    super.gameOver();
  }
}
PropsFactory.instance().register(7, () => Laya.Pool.createByClass(InkstoneProp));

/** 陷阱 — a placed trap that charms an enemy that steps on it. (`Ti`) */
export class TrapProp extends PropBase {
  protected rk = 5;
  protected s_ = true;
  protected i_ = true;
  private h_!: Map<number, any>;
  private container: any;
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.h_ = new Map();
  }
  protected Nv(t: any, s: any): void {
    const { x: i, y: h } = t;
    const e = new Laya.Image("resources/img/props/trap_1.png");
    e.size(80, 80);
    y.instance.event(u.bt, e, i, h);
    this.h_.set((q.instance().So += 1), { img: e, x: i, y: h });
    const a = s.Mv(2, this.qd);
    a.setItem(this, i, h);
    this.container = a;
    this.reset();
  }
  /** Trigger the trap at cell (t,s) on enemy `i`. (`e_`) */
  e_(t: number, s: number, i: any): void {
    for (const h of this.h_)
      if (h[1].x === t && h[1].y === s) {
        this.a_(h[0], i);
        break;
      }
  }
  private a_(t: number, s: any): void {
    $.instance().playSound("trap_trigger");
    const i = this.h_.get(t);
    i.img.skin = "resources/img/props/trap_2.png";
    this.container.setItem(null, i.x, i.y);
    this.h_.delete(t);
    Eh.instance().n_(s, 5000);
    Laya.timer.once(5000, this, () => {
      i.img.removeSelf();
      i.img.destroy(true);
    });
  }
  gameOver(): void {
    super.gameOver();
    for (const t of this.h_) t[1].img.destroy(true);
  }
}
PropsFactory.instance().register(8, () => Laya.Pool.createByClass(TrapProp));

/** 地雷 — buried mine that emerges then explodes (AoE charm) when stepped on. (`Ri`) */
export class LandmineProp extends PropBase {
  protected rk = 5;
  protected s_ = true;
  protected i_ = true;
  private o_!: Map<number, any>;
  private container: any;
  constructor() {
    super();
    this.Qv = 2;
  }
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.o_ = new Map();
  }
  protected Nv(t: any, s: any): void {
    const { x: i, y: h } = t;
    const e = new Laya.Image("resources/img/props/landmine_1.png");
    e.size(80, 80);
    e.anchorX = 0.5;
    e.anchorY = 0.5;
    y.instance.event(u.bt, e, i, h);
    e.x += e.width / 2;
    e.y += e.height / 2;
    const a = new Laya.Image("resources/img/props/mound.png");
    this.o_.set((q.instance().So += 1), { img: e, l_: a, x: i, y: h, c_: 0 });
    const n = new Laya.Image("resources/img/props/leadLight0.png");
    n.pos(56 - e.width / 2, 28 - e.height / 2);
    n.size(17, 17);
    n.anchorX = 0.5;
    n.anchorY = 0.5;
    n.visible = false;
    e.addChild(n);
    const r = F.instance().map.ue[i][h].endsWith("0");
    const o = s.Mv(2, r);
    o.setItem(this, i, h);
    this.container = o;
    this.reset();
    this.u_(e, a);
  }
  update(t: number): void {
    super.update(t);
  }
  private u_(t: any, s: any): void {
    const i = new Laya.Sprite();
    i.graphics.drawRect(0, 0, t.width, t.height, "#fff");
    t.addChild(i);
    t.mask = i;
    s.size(75, 34);
    s.anchorX = 0.5;
    s.anchorY = 1;
    s.pos(t.x, t.y + 74 - t.height / 2);
    t.parent.addChild(s);
    let h = 1;
    Laya.timer.loop(50, this, () => {
      h -= 0.1;
      t.y += (t.height - t.height * h) / 5;
      i.graphics.clear();
      i.graphics.drawRect(0, 0, t.width, t.height * h, "#fff");
      s.y += 0.9;
      s.scaleX -= 0.04;
      s.scaleY -= 0.04;
      if (h <= 0.6) {
        Laya.timer.clearAll(this);
        this.p_(t);
      }
    });
  }
  private p_(t: any): void {
    Laya.Tween.create(t)
      .to("scaleX", 1.05)
      .to("scaleY", 0.95)
      .duration(300)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(300)
      .then(() => this.p_(t), this);
  }
  e_(t: number, s: number, _i: any): void {
    for (const k of this.o_)
      if (k[1].x === t && k[1].y === s) {
        this.a_(k[0]);
        break;
      }
  }
  private a_(t: number): void {
    const s = this.o_.get(t);
    this.container.setItem(null, s.x, s.y);
    this.o_.delete(t);
    const i = s.img.getChildAt(0);
    i.visible = true;
    const h = q.instance().registerImgLoop(
      i,
      ["resources/img/props/leadLight0.png", "resources/img/props/leadLight1.png"],
      50,
    );
    Laya.Tween.to(
      i,
      { x: 43 - s.img.width / 2, y: 24 - s.img.height / 2 },
      50,
      null,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(
          i,
          { x: 41 - s.img.width / 2, y: 27 - s.img.height / 2 },
          20,
          null,
          Laya.Handler.create(this, () => {
            q.instance().removeEvent("imgLoop", h);
            i.visible = false;
            s.img.mask.removeSelf();
            s.img.mask = null;
            $.instance().playSound("landmine_explode");
            s.img.skin = "resources/img/effect/explode0.png";
            s.img.size(72, 72);
            s.img.anchorX = 0.5;
            s.img.anchorY = 1;
            s.img.x += 40 - s.img.width / 2;
            s.img.y += 56 - s.img.height / 2;
            s.c_ = q.instance().registerImgLoop(
              s.img,
              [
                "resources/img/effect/explode0.png",
                "resources/img/effect/explode1.png",
                "resources/img/effect/explode2.png",
                "resources/img/effect/explode3.png",
                "resources/img/effect/explode4.png",
                "resources/img/effect/explode5.png",
                "resources/img/effect/explode6.png",
              ],
              50,
              0,
              1,
              () => {
                Laya.Tween.to(
                  s.img,
                  { scaleX: 1.2, scaleY: 1.2, alpha: 0 },
                  100,
                  null,
                  Laya.Handler.create(this, () => {
                    s.img.removeSelf();
                    s.img.destroy(true);
                  }),
                );
              },
            );
            Laya.Tween.create(s.l_)
              .to("alpha", 0)
              .duration(100)
              .then(() => {
                s.l_.removeSelf();
                s.l_.destroy(true);
              });
            Eh.instance().y_(s.img.x, s.img.y);
          }),
        );
      }),
    );
  }
  gameOver(): void {
    super.gameOver();
    for (const t of this.o_) {
      q.instance().removeEvent("imgLoop", t[1].c_);
      t[1].img.destroy(true);
      t[1].l_.destroy(true);
    }
  }
}
PropsFactory.instance().register(9, () => Laya.Pool.createByClass(LandmineProp));

/** 攻速符 — burns to grant a unit/general +40% attack speed. (`Ci`) */
export class AttackSpeedSpellProp extends TrainingSpellProp {
  constructor() {
    super();
    this.rk = 4;
    this.Ek = [
      "resources/img/props/attSpeedSpellBurn0.png",
      "resources/img/props/attSpeedSpellBurn1.png",
      "resources/img/props/attSpeedSpellBurn2.png",
      "resources/img/props/attSpeedSpellBurn3.png",
      "resources/img/props/attSpeedSpellBurn4.png",
      "resources/img/props/attSpeedSpellBurn5.png",
    ];
  }
  Jv(t: any, s: any = null): boolean {
    const i = s.Mv(t.containerType, this.qd).getItem(t.x, t.y);
    return !!i && !(i instanceof gi && i.Zw === -1);
  }
  protected Nv(t: any, s: any = null): void {
    if (t.containerType === 2 || t.containerType === 1) y.instance.event(u.bt, this.props, t.x, t.y);
    else if (t.containerType === 3) y.instance.event(u.Mt, this.props, t.x);
    const i = s.Mv(t.containerType, this.qd).getItem(t.x, t.y);
    if (i instanceof gi && i.Zw !== -1) this.xk = i.Zw;
    else this.xk = i.id;
    q.instance().registerImgLoop(this.Wv, this.Ek, 100, 0, 1, (id: number) => {
      q.instance().removeEvent("imgLoop", id);
      this.Bk();
      this.reset();
    });
  }
  protected Bk(): void {
    th.instance().applyBuff(this.xk, 1, 0.4, true);
    EntityRegistry.instance().Kk(this.xk, 1, 1, 0.4, true);
  }
  reset(): void {
    super.reset();
    this.Wv.skin = "resources/img/props/attSpeedSpell_1.png";
  }
}
PropsFactory.instance().register(10, () => Laya.Pool.createByClass(AttackSpeedSpellProp));
