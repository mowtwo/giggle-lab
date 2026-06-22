// Props — the battle items (shovel/spell/bulldozer…) base + factory.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js: the
// PropsFactory (`PropsFactory`, ~12018), the prop base `Si` (~12151) and the concrete
// props (`bi` shovel, … registered with the factory). Each prop extends Prop,
// drives its cooldown ring, and on drop runs its `tk` use-effect. The remaining
// concrete props are layered into this file. Opaque names kept verbatim.
//
//   PropsFactory=PropsFactory  PropBase=Si  ShovelProp=bi  cooldown=cd  useEffect=tk

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
import { SpawnQueueMgr } from "./spawn-queue-mgr";
import { CellReservationMgr } from "./cell-reservation-mgr";
import { BoardMgr } from "./board-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { MathE } from "../core/math-e";
import { PrefabFactory } from "./prefab-factory";
import { SpecialIndex } from "./attr-type";
import { AudioMgr } from "../core/audio-mgr";
import { EffectMgr } from "./effect-mgr";
import { Soldier } from "./soldier";
import { Farmer } from "./farmer";
import { BattlePropsMgr } from "./battle-props-mgr";

const Ws = Soldier;
const ki = Farmer;
const X = LayerZ;
const u = GameEvent;
const ci = BowSoldier;
const gi = GeneralPart;
const Oi = CellReservationMgr;
const L = SpecialIndex;
const $ = AudioMgr;

/** Pools + produces prop instances by enum type. (`PropsFactory`) */
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
    console.log(GameMgr.instance().props.Ue[this.type].txt);
    this.cd = GameMgr.instance().props.Ue[type].cd;
    this.props.zIndex = X.wr;
  }
  start(): void {
    super.start();
    if (this.cd <= 0 && this.Hv.containerType === 4)
      EventMgr.instance.event(u.jt, this.qd, this.Xv, this.Gv, 360);
  }
  /** Whether the prop can be used at the drop target. (`Jv`) */
  Jv(_t: any, _s: any = null): boolean {
    return true;
  }
  /** Use the prop (announces enemy use, then runs the effect). (`tk`) */
  tk(t: any, s: any = null): void {
    if (!this.qd) TipMgr.instance().showTip(`敌方使用了${GameMgr.instance().props.Ue[this.type].txt}`);
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
    EventMgr.instance.event(u.jt, this.qd, this.Xv, this.Gv, 360 * s);
  }
  ak(): void {
    this.props.x = this.bd.x;
    this.props.y = this.bd.y;
  }
  reset(): void {
    super.reset();
    this.Kv = 0;
    EventMgr.instance.event(u.$t, this.qd, this.Xv, this.Gv);
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
    this.Gi = qd ? GameMgr.instance().battleState.Gi : GameMgr.instance().battleState.Hi;
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
        TipMgr.instance().showTip("请先妥善安置农民");
        return;
      }
      EntityRegistry.instance().uk(i.id);
    }
    s.Mv(this.Hv.containerType, this.qd).removeItem(this.Hv.x, this.Hv.y);
    EventMgr.instance.event(u.At, this.qd, t.x, t.y);
    EventMgr.instance.event(u.Lt, this.id);
  }
  gameOver(): void {
    super.gameOver();
    this.Gi = false;
    this.Wv.size(80, 80);
  }
}
PropsFactory.instance().register(0, () => Laya.Pool.createByClass(ShovelProp));

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
    EventMgr.instance.on(u.gs, this, this.dk);
  }
  update(t: number): void {
    if (this.step === 1) {
      this.move(t);
      const s = this.Lk();
      EnemySpatialMgr.instance().mk(this.qd, this.props.x + this.props.width / 2, this.props.y + this.props.height / 2, s.offsetX, s.offsetY);
    } else if (this.step === 2) {
      this.props.alpha -= t / 5000;
      const s = this.Lk();
      EnemySpatialMgr.instance().mk(this.qd, this.props.x + this.props.width / 2, this.props.y + this.props.height / 2, s.offsetX, s.offsetY);
      if (this.props.alpha <= 0) {
        this.props.alpha = 0;
        EventMgr.instance.event(u.Lt, this.id);
      }
    }
  }
  tk(): void {
    $.instance().playSound("bulldozer_land");
    this.wk();
    X.setEntityZIndex(this.props, GameMgr.instance().map.gridHei);
  }
  vk(): void {
    if (this.step === 0 && this.path.length > 0) this.step = 1;
  }
  private move(t: number): void {
    if (this.path.length <= 0) return;
    const s = this.path[this.pk].x * GameMgr.instance().map.gridWid;
    const i = this.path[this.pk].y * GameMgr.instance().map.gridHei;
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
    X.setEntityZIndex(this.props, GameMgr.instance().map.gridHei);
  }
  private Lk(): { offsetX: number; offsetY: number } {
    const t = GameMgr.instance().map;
    const s = Math.floor(this.props.x / t.gridWid) * t.gridWid;
    const i = Math.floor(this.props.y / t.gridHei) * t.gridHei;
    return { offsetX: this.props.x - s, offsetY: this.props.y - i };
  }
  private wk(): void {
    const t = this.qd ? GameMgr.instance().map.de : GameMgr.instance().map.Le;
    const s = t.length - 2;
    this.props.pos(t[s].x * GameMgr.instance().map.gridWid, t[s].y * GameMgr.instance().map.gridHei);
    const i = { x: t[s].x, y: t[s].y };
    EventMgr.instance.event(u.bt, this.props, i.x, i.y);
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
    if (t.containerType === 2 || t.containerType === 1) EventMgr.instance.event(u.bt, this.props, t.x, t.y);
    else if (t.containerType === 3 && this.qd) EventMgr.instance.event(u.Mt, this.props, t.x);
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
          EventMgr.instance.event(u.et, this.xk);
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
    this.Wv.pos(GameMgr.instance().map.gridWid / 2, GameMgr.instance().map.gridHei / 2);
    this.Sk.visible = false;
    this.bk.visible = false;
  }
  gameOver(): void {
    super.gameOver();
    Laya.Tween.killAll(this.Wv);
    this.Wv.pos(GameMgr.instance().map.gridWid / 2, GameMgr.instance().map.gridHei / 2);
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
    if (t.containerType === 2 || t.containerType === 1) EventMgr.instance.event(u.bt, this.props, t.x, t.y);
    else if (t.containerType === 3) EventMgr.instance.event(u.Mt, this.props, t.x);
    const i = s.Mv(t.containerType, this.qd);
    this.xk = i.getItem(t.x, t.y).id;
    this.Ak = EffectMgr.instance().registerImgLoop(this.Wv, this.Ek, 100, 0, 1, (id: number) => {
      EffectMgr.instance().removeEvent("imgLoop", id);
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
    if (t > 0) EffectMgr.instance().playLvlUp(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    else EffectMgr.instance().playLvlDown(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    EventMgr.instance.event(u.q, this.xk, t, false);
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
    if (this.Ak > 0) EffectMgr.instance().removeEvent("imgLoop", this.Ak);
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
    EventMgr.instance.event(u.Xt, this.qd, n, () => {
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
    EventMgr.instance.event(u.Ut, s, X.wr);
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
    const s = GameMgr.instance().battleState;
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
      EventMgr.instance.event(u.$t, this.qd, this.Xv, this.Gv);
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
      e = GameMgr.instance().toLocal(i.Yn, true);
      a = false;
    } else if (i instanceof gi) {
      const g = EntityRegistry.instance().Qk.get(i.Zw);
      h = g;
      e = GameMgr.instance().toLocal(g.general, true);
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
    EventMgr.instance.event(u.bt, this.Vk);
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
        BuffMgr.instance().applyBuff(tid, 2, 1, true);
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
    EventMgr.instance.event(u.bt, this.Jk, i, h - 1);
    Laya.Tween.to(this.Jk, { y: this.Jk.y + GameMgr.instance().map.gridWid, scaleX: 0.8, scaleY: 0.8 }, 320);
    const e = EffectMgr.instance().registerImgLoop(
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
        EffectMgr.instance().removeEvent("imgLoop", e);
        Laya.Tween.to(this.Jk, { alpha: 0 }, 100, null, Laya.Handler.create(this, () => {}));
        EventMgr.instance.event(u.bt, this.ink, i, h);
        this.ink.pos(this.ink.x + GameMgr.instance().map.gridWid / 2, this.ink.y + GameMgr.instance().map.gridHei / 2);
        $.instance().playSound("skill_ink_splash");
        Laya.Tween.to(
          this.ink,
          { scaleX: 1, scaleY: 1 },
          200,
          Laya.Ease.cubicOut,
          Laya.Handler.create(this, () => {
            const list = EntityRegistry.instance().t_(this.ink.x, this.ink.y, 1.5 * GameMgr.instance().map.gridWid, !this.qd);
            for (let s = 0; s < list.length; s++) BuffMgr.instance().applyBuff(list[s].id, 1, -0.2, true, 5000);
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
    EventMgr.instance.event(u.bt, e, i, h);
    this.h_.set((EffectMgr.instance().So += 1), { img: e, x: i, y: h });
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
    EnemySpatialMgr.instance().n_(s, 5000);
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
    EventMgr.instance.event(u.bt, e, i, h);
    e.x += e.width / 2;
    e.y += e.height / 2;
    const a = new Laya.Image("resources/img/props/mound.png");
    this.o_.set((EffectMgr.instance().So += 1), { img: e, l_: a, x: i, y: h, c_: 0 });
    const n = new Laya.Image("resources/img/props/leadLight0.png");
    n.pos(56 - e.width / 2, 28 - e.height / 2);
    n.size(17, 17);
    n.anchorX = 0.5;
    n.anchorY = 0.5;
    n.visible = false;
    e.addChild(n);
    const r = GameMgr.instance().map.ue[i][h].endsWith("0");
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
  e_(t: number, s: number, PropsFactory: any): void {
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
    const h = EffectMgr.instance().registerImgLoop(
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
            EffectMgr.instance().removeEvent("imgLoop", h);
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
            s.c_ = EffectMgr.instance().registerImgLoop(
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
            EnemySpatialMgr.instance().y_(s.img.x, s.img.y);
          }),
        );
      }),
    );
  }
  gameOver(): void {
    super.gameOver();
    for (const t of this.o_) {
      EffectMgr.instance().removeEvent("imgLoop", t[1].c_);
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
    if (t.containerType === 2 || t.containerType === 1) EventMgr.instance.event(u.bt, this.props, t.x, t.y);
    else if (t.containerType === 3) EventMgr.instance.event(u.Mt, this.props, t.x);
    const i = s.Mv(t.containerType, this.qd).getItem(t.x, t.y);
    if (i instanceof gi && i.Zw !== -1) this.xk = i.Zw;
    else this.xk = i.id;
    EffectMgr.instance().registerImgLoop(this.Wv, this.Ek, 100, 0, 1, (id: number) => {
      EffectMgr.instance().removeEvent("imgLoop", id);
      this.Bk();
      this.reset();
    });
  }
  protected Bk(): void {
    BuffMgr.instance().applyBuff(this.xk, 1, 0.4, true);
    EntityRegistry.instance().Kk(this.xk, 1, 1, 0.4, true);
  }
  reset(): void {
    super.reset();
    this.Wv.skin = "resources/img/props/attSpeedSpell_1.png";
  }
}
PropsFactory.instance().register(10, () => Laya.Pool.createByClass(AttackSpeedSpellProp));

/** Base for instant-use (non-cooldown, non-board) consumable props. (`Ui`) */
export class InstantProp extends Prop {
  protected zv = false;
  init(qd: any, type: number): void {
    super.init(qd, type);
  }
}

/** 驱魔符 — dispels/reflects a boss skill. (`Fi`) */
export class ExorcismSpellProp extends InstantProp {
  private f_ = 0;
  private Ek = [
    "resources/img/props/exorcismSpellBurn0.png",
    "resources/img/props/exorcismSpellBurn1.png",
    "resources/img/props/exorcismSpellBurn2.png",
    "resources/img/props/exorcismSpellBurn3.png",
    "resources/img/props/exorcismSpellBurn4.png",
    "resources/img/props/exorcismSpellBurn5.png",
  ];
  private g_: any;
  private Zg: any;
  init(qd: any, type: number): void {
    super.init(qd, type);
    if (!this.g_) {
      this.g_ = new Laya.Image("resources/img/props/exorcismSpell_1.png");
      this.g_.size(this.props.width, this.props.height);
    }
    this.g_.visible = false;
    if (!this.Zg) this.Zg = new Laya.Image("resources/img/props/fire0.png");
    this.Zg.zIndex = 1;
    this.Zg.visible = false;
    this.g_.addChild(this.Zg);
    EventMgr.instance.on(u.cs, this, this.L_);
  }
  private L_(t: any, s: any, i: number, h: number): void {
    if (s === this.qd) {
      if (Math.random() > 0.5) EnemySpatialMgr.instance().m_(t, true);
      else {
        Laya.Point.TEMP.x = i;
        Laya.Point.TEMP.y = h;
        if (!this.g_.parent) this.props.parent.addChild(this.g_);
        this.g_.parent.globalToLocal(Laya.Point.TEMP);
        this.g_.visible = true;
        Laya.Tween.to(
          this.g_,
          { x: Laya.Point.TEMP.x, y: Laya.Point.TEMP.y },
          100,
          null,
          Laya.Handler.create(this, () => {
            this.w_(t);
          }),
        );
        EnemySpatialMgr.instance().m_(t, false);
      }
    } else EnemySpatialMgr.instance().m_(t, true);
  }
  private w_(_t: any): void {
    EffectMgr.instance().registerImgLoop(this.g_, this.Ek, 50, 0, 1, (id: number) => {
      EffectMgr.instance().removeEvent("imgLoop", id);
      EffectMgr.instance().removeEvent("imgLoop", this.f_);
      this.reset();
    });
    this.Zg.visible = true;
    this.f_ = EffectMgr.instance().registerImgLoop(
      this.Zg,
      ["resources/img/props/fire0.png", "resources/img/props/fire1.png", "resources/img/props/fire2.png"],
      50,
    );
  }
  reset(): void {
    super.reset();
    this.g_.visible = false;
    this.g_.skin = "resources/img/props/trainingSpell_1.png";
    this.g_.pos(this.props.x, this.props.y);
    this.Zg.visible = false;
    this.Zg.skin = "resources/img/props/fire0.png";
  }
  gameOver(): void {
    EventMgr.instance.off(u.cs, this, this.L_);
    Laya.Tween.killAll(this.g_);
    super.gameOver();
  }
}
PropsFactory.instance().register(11, () => Laya.Pool.createByClass(ExorcismSpellProp));

/** 招贤 — periodically auto-spawns a farmer onto a free cell. (`Yi`) */
export class RecruitFarmerProp extends InstantProp {
  private B_ = 30000;
  private I_ = 0;
  update(t: number): void {
    this.D_(t);
  }
  private D_(t: number): void {
    this.I_ += t;
    if (this.I_ < this.B_) return;
    this.I_ = 0;
    const s = GameMgr.instance().map.ue;
    const i = this.qd ? s[0].length / 2 : 0;
    const h = this.qd ? s[0].length : s[0].length / 2;
    const e = this.qd ? "2_0" : "2_1";
    const a = { containerType: 0, x: -1, y: -1 };
    for (let t2 = 0; t2 < s.length; t2++)
      for (let n = i; n < h; n++)
        if (s[t2][n] === e && !this.T_(1, t2, n)) {
          a.containerType = 1;
          a.x = t2;
          a.y = n;
          this.R_(a);
          return;
        }
    for (let t2 = 0; t2 < 5; t2++)
      if (!this.T_(3, t2)) {
        a.containerType = 3;
        a.x = t2;
        a.y = 0;
        this.R_(a);
        return;
      }
  }
  private T_(t: number, s: number, i = 0): boolean {
    if (BoardMgr.instance().Mv(t, this.qd)!.getItem(s, i)) return true;
    const h = Oi.instance();
    return t === 3 ? h.b_(3, this.qd, s, 0) : t === 1 && h.b_(1, this.qd, s, i);
  }
  private R_(t: any): void {
    const s = EntityRegistry.instance().C_(t.containerType, "农", this.qd, t.x, t.y);
    this.props.parent.addChild(s.Yn);
    s.Yn.pos(0, 0);
    s.Yn.zIndex = 900;
    s.Yd = 5;
    s.lL(t.containerType, t.x, t.y);
  }
  gameOver(): void {
    super.gameOver();
    this.B_ = 0;
  }
}
PropsFactory.instance().register(12, () => Laya.Pool.createByClass(RecruitFarmerProp));

/** 增援 — refills the side's draw bag. (`Xi`) */
export class RefillProp extends InstantProp {
  init(qd: any, type: number): void {
    super.init(qd, type);
    SpawnQueueMgr.instance().U_(qd);
  }
}
PropsFactory.instance().register(13, () => Laya.Pool.createByClass(RefillProp));

/** 全军攻速 — +10% attack speed to all units (both sides). (`Gi`) */
export class AllAttackSpeedProp extends InstantProp {
  init(qd: any, type: number): void {
    super.init(qd, type);
    EntityRegistry.instance().F_("allAttSpeedSpell" + this.id, true, 1, 0.1, true, -1);
    EntityRegistry.instance().F_("allAttSpeedSpellAi" + this.id, false, 1, 0.1, true, -1);
  }
  gameOver(): void {
    super.gameOver();
    EntityRegistry.instance().O_("allAttSpeedSpell" + this.id);
    EntityRegistry.instance().O_("allAttSpeedSpellAi" + this.id);
  }
}
PropsFactory.instance().register(14, () => Laya.Pool.createByClass(AllAttackSpeedProp));

/** 同心协力 — bigger attack-speed group buff. (`Hi`) */
export class HandInHandProp extends InstantProp {
  init(qd: any, type: number): void {
    super.init(qd, type);
    EntityRegistry.instance().F_("goingHandInHand" + this.id, true, 1, 0.5, true, -1);
    EntityRegistry.instance().F_("goingHandInHandAi" + this.id, false, 1, 0.3, true, -1);
  }
  gameOver(): void {
    super.gameOver();
    EntityRegistry.instance().O_("goingHandInHand" + this.id);
    EntityRegistry.instance().O_("goingHandInHandAi" + this.id);
  }
}
PropsFactory.instance().register(15, () => Laya.Pool.createByClass(HandInHandProp));

/** 大补丸 — +5 own lives, +3 enemy lives (or swapped). (`Wi`) */
export class BigLifeProp extends InstantProp {
  init(qd: any, type: number): void {
    super.init(qd, type);
    if (this.qd) {
      GameMgr.instance().battleState.playerLives += 5;
      GameMgr.instance().battleState.enemyLives += 3;
    } else {
      GameMgr.instance().battleState.playerLives += 3;
      GameMgr.instance().battleState.enemyLives += 5;
    }
  }
}
PropsFactory.instance().register(16, () => Laya.Pool.createByClass(BigLifeProp));

/** 补丸 — +3 lives on the using side. (`zi`) */
export class LifeProp extends InstantProp {
  init(qd: any, type: number): void {
    super.init(qd, type);
    if (this.qd) GameMgr.instance().battleState.playerLives += 3;
    else GameMgr.instance().battleState.enemyLives += 3;
  }
}
PropsFactory.instance().register(17, () => Laya.Pool.createByClass(LifeProp));

/** 淤泥 — slows the side's lane end + footprint slow aura. (`ji`) */
export class SiltProp extends InstantProp {
  private Y_: any;
  private X_: any;
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.Y_ = new Laya.Image("resources/img/props/silt_1.png");
    this.Y_.size(GameMgr.instance().map.gridWid, GameMgr.instance().map.gridHei);
    this.Y_.zIndex = X.ur;
    Laya.Point.TEMP.x = qd ? GameMgr.instance().map.se.x : GameMgr.instance().map.ee.x;
    Laya.Point.TEMP.y = qd ? GameMgr.instance().map.se.y : GameMgr.instance().map.ee.y;
    EventMgr.instance.event(u.St, this.Y_, Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    this.X_ = new Laya.Image("resources/img/props/silt_2.png");
    this.X_.size(110, 60);
    this.X_.anchorX = 0.5;
    this.X_.anchorY = 1;
    this.X_.pos(40, 60);
    this.X_.visible = false;
    this.Y_.addChild(this.X_);
    if (qd) {
      GameMgr.instance().battleState.Ri = true;
      EnemySpatialMgr.instance().F_("silt" + this.id, this.qd, 3, -0.1, true, L.Ji);
    } else {
      GameMgr.instance().battleState.Ci = true;
      EnemySpatialMgr.instance().F_("siltAi" + this.id, this.qd, 3, -0.1, true, L.Ji);
    }
    EventMgr.instance.on(u.rs, this, this.G_);
  }
  private G_(): void {
    this.X_.scale(0, 0);
    this.X_.visible = true;
    Laya.Tween.to(
      this.X_,
      { scaleX: 1, scaleY: 1 },
      50,
      null,
      Laya.Handler.create(this, () => {
        this.X_.skin = "resources/img/props/silt_3.png";
        Laya.Tween.to(
          this.X_,
          { alpha: 0 },
          100,
          null,
          Laya.Handler.create(this, () => {
            this.X_.alpha = 1;
            this.X_.visible = false;
          }),
        );
      }),
    );
  }
  gameOver(): void {
    super.gameOver();
    EventMgr.instance.off(u.rs, this, this.G_);
    this.Y_.removeSelf();
    Laya.Tween.killAll(this.X_);
    this.X_.removeSelf();
    if (this.qd) EnemySpatialMgr.instance().O_("silt" + this.id);
    else EnemySpatialMgr.instance().O_("siltAi" + this.id);
  }
}
PropsFactory.instance().register(18, () => Laya.Pool.createByClass(SiltProp));

/** 藏宝图 — periodically drops treasure. (`$i`) */
export class TreasureMapProp extends InstantProp {
  private B_ = 60000;
  private I_ = 0;
  update(t: number): void {
    this.H_(t);
  }
  private H_(t: number): void {
    this.I_ += t;
    if (this.I_ < this.B_) return;
    Laya.Point.TEMP.x = 0;
    Laya.Point.TEMP.y = 0;
    this.props.localToGlobal(Laya.Point.TEMP);
    EventMgr.instance.event(u.zt, this.qd, Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    this.I_ = 0;
  }
  gameOver(): void {
    super.gameOver();
    this.B_ = 0;
  }
}
PropsFactory.instance().register(19, () => Laya.Pool.createByClass(TreasureMapProp));

/** 流星雨 — calls down a barrage of meteors over the lane. (`Ni`) */
export class MeteorShowerProp extends InstantProp {
  private W_ = false;
  protected cd = 300000;
  protected Kv = 0;
  init(qd: any, type: number): void {
    super.init(qd, type);
    this.W_ = false;
    this.Kv = 0;
  }
  tk(): void {
    this.z_();
  }
  private z_(): void {
    if (this.W_) return;
    this.W_ = true;
    const t = GameMgr.instance();
    const s = this.qd ? t.map.de : t.map.Le;
    if (!s || s.length < 10) return;
    const i = s.slice(-10);
    const h: any[] = [];
    for (let k = 0; k < i.length; k++) {
      const e = i[k];
      const a = MathE.range(1, 2, true) as number;
      for (let m = 0; m < a; m++) {
        $.instance().playSound("meteor_fall");
        const dx = MathE.range(0.3 * -t.map.gridWid, 0.3 * t.map.gridWid, true) as number;
        const dy = MathE.range(0.3 * -t.map.gridHei, 0.3 * t.map.gridHei, true) as number;
        const ax = e.x * t.map.gridWid + t.map.gridWid / 2 + dx;
        const ny = e.y * t.map.gridHei + t.map.gridHei / 2 + dy;
        let r = 0;
        let o = 0;
        const pt = this.qd ? MathE.pointAtAngle2({ x: ax, y: ny }, 1000, 210) : MathE.pointAtAngle2({ x: ax, y: ny }, 1000, 330);
        r = pt.x;
        o = pt.y;
        h.push({ j_: r, N_: o, q_: ax, V_: ny });
      }
    }
    MathE.shuffle(h);
    let e = 0;
    for (let k = 0; k < h.length; k++) {
      const s2 = h[k];
      Laya.timer.once(e, this, () => {
        this.Q_(s2.j_, s2.N_, s2.q_, s2.V_);
      });
      e += MathE.range(50, 100, true) as number;
    }
    this.Kv = 0;
    this.Wv.gray = true;
  }
  private Q_(t: number, s: number, i: number, h: number): void {
    const e = PrefabFactory.instance().getItem("meteor", this);
    const a = MathE.range(0.8, 1) as number;
    e.x = t;
    e.y = s;
    e.scale(a, a);
    e.zIndex = 1;
    EventMgr.instance.event(u.bt, e);
    const n = EffectMgr.instance().registerImgLoop(
      e,
      ["resources/img/props/meteor_2.png", "resources/img/props/meteor_3.png"],
      50,
    );
    e.rotation = MathE.angle({ x: t, y: s }, { x: i, y: h }) + 90;
    let r = 0;
    let o = 0;
    const l = 1000 * (MathE.range(0.8, 1.2, false) as number);
    Laya.Tween.create(e)
      .to("x", i)
      .to("y", h)
      .to("alpha", 1)
      .to("scaleX", a)
      .to("scaleY", a)
      .duration(l)
      .onUpdate(() => {
        r += Laya.timer.delta;
        if (!(r < 30 * o)) {
          for (let k = 0; k < 3; k++) this.Z_(e.x, e.y);
          r = 0;
          o += 0.05;
        }
      }, this)
      .then(() => {
        EffectMgr.instance().removeEvent("imgLoop", n);
        this.K_(i, h);
        this.J_(e);
        e.rotation = 0;
        e.skin = "resources/img/props/pit.png";
        e.scale(0.8 * a, 0.8 * a);
        e.x -= (0.5 - e.anchorX) * e.width;
        e.y -= (0.5 - e.anchorY) * e.height;
        Laya.Tween.create(e)
          .to("alpha", 0)
          .duration(1000)
          .delay(1000)
          .then(() => {
            e.skin = "resources/img/props/meteor_2.png";
            e.alpha = 1;
            e.removeSelf();
            PrefabFactory.instance().recover("meteor", e);
          });
      });
    const c = new Laya.Image("resources/img/props/redCircle.png");
    c.size(107, 95);
    c.anchor(0.5, 0.5);
    c.pos(i, h);
    c.scale(0, 0);
    c.alpha = 0.5;
    EventMgr.instance.event(u.bt, c);
    Laya.Tween.create(c)
      .to("scaleX", a)
      .to("scaleY", a)
      .to("alpha", 1)
      .duration(l)
      .chain()
      .to("alpha", 0)
      .to("scaleX", 1.5 * a)
      .to("scaleY", 1.5 * a)
      .duration(500)
      .then(() => {
        c.removeSelf();
      });
  }
  private Z_(t: number, s: number): void {
    const i = PrefabFactory.instance().getItem("fireParticl", this);
    EventMgr.instance.event(u.bt, i);
    i.pos(t, s);
    i.rotation = MathE.range(0, 360) as number;
    i.pos(t, s + (MathE.range(-i.height, i.height) as number));
    let h = 0;
    Laya.Tween.create(i)
      .to("alpha", 0)
      .to("scaleX", 0)
      .to("scaleY", 0)
      .duration(600)
      .onUpdate(() => {
        h += Laya.timer.delta / 600;
        i.color = MathE.rgbToHex(1, 1 - h, 1 - h);
      }, this)
      .then(() => {
        i.alpha = 1;
        i.scale(1, 1);
        i.removeSelf();
        PrefabFactory.instance().recover("fireParticl", i);
      });
  }
  private K_(t: number, s: number): void {
    const i = EnemySpatialMgr.instance();
    const h = GameMgr.instance();
    const e = h.map.gridWid;
    for (const [, n] of i.kw) {
      if (n.qd !== this.qd) continue;
      if (!n.Bw) continue;
      const dx = n.enemy.x - t;
      const dy = n.enemy.y - s;
      if (Math.sqrt(dx * dx + dy * dy) <= e) {
        const dmg = h.enemyHp(h.map.re, this.qd).uh;
        n.hit(dmg, null);
      }
    }
  }
  private J_(t: any): void {
    EffectMgr.instance().playRocketEffect(t, t.width / 2, t.height / 2, 2);
    SceneMgr.instance().shakeBattleScene(100);
  }
  update(t: number): void {
    super.update(t);
    if (this.W_ && this.Kv < this.cd) {
      this.Kv += t;
      if (this.Kv >= this.cd) {
        this.W_ = false;
        this.Kv = this.cd;
        this.Wv.gray = false;
      }
    }
  }
  gameOver(): void {
    super.gameOver();
    this.W_ = false;
    this.Kv = 0;
    this.Wv.gray = false;
  }
}
PropsFactory.instance().register(20, () => Laya.Pool.createByClass(MeteorShowerProp));

/** 占位道具 (no active effect). (`Vi`) */
export class PlaceholderProp extends InstantProp {
  private vx = 1;
  init(qd: any, type: number): void {
    super.init(qd, type);
  }
}
PropsFactory.instance().register(22, () => Laya.Pool.createByClass(PlaceholderProp));

/** 铲子强化 — upgrades the side's shovel. (`Qi`) */
export class ShovelUpgradeProp extends InstantProp {
  init(qd: any, type: number): void {
    super.init(qd, type);
    if (qd) GameMgr.instance().battleState.Gi = true;
    else GameMgr.instance().battleState.Hi = true;
  }
}
PropsFactory.instance().register(24, () => Laya.Pool.createByClass(ShovelUpgradeProp));

/**
 * 垃圾桶 — placeable trash-can that recycles a single board unit, awarding gold
 * equal to its level. Opens the lid (frame anim), pulls the unit in, removes it
 * from the registry, closes the lid, then floats the reward. (`qi`)
 */
export class TrashCanProp extends PropBase {
  private rk = 3;
  private sx = 0;
  private ix: any;
  private hx: any;
  private nx: any;
  private ox: any;
  private lx: any;
  private light: any;
  private ux: any;

  start(): void {
    super.start();
    if (!this.qd) return;
    this.Wv.skin = "";
    this.Wv.anchor(0, 0);
    this.Wv.size(this.props.width, this.props.height);
    this.Wv.pos(0, 0);
    this.ix = new Laya.Image();
    this.ix.size(56, 22);
    this.ix.skin = "resources/img/props/trashCan_3.png";
    this.ix.pos(12, 22);
    this.ix.anchor(0, 0);
    this.ix.zIndex = 0;
    this.Wv.addChild(this.ix);
    this.hx = new Laya.Image("resources/img/props/trashCanLid0.png");
    this.hx.size(51, 22);
    this.hx.pos(15, 21);
    this.Wv.addChild(this.hx);
    this.nx = new Laya.Image("resources/img/props/trashCan_2.png");
    this.nx.size(56, 34);
    this.nx.pos(12, 44);
    this.Wv.addChild(this.nx);
    this.nx.zIndex = 2;
    this.ox = new Laya.Image("resources/img/props/recyclingSign0.png");
    this.ox.size(24, 21);
    this.ox.pos(28, 48);
    this.Wv.addChild(this.ox);
    this.ox.zIndex = 2;
    this.lx = new Laya.Image("resources/img/props/recyclingSign1.png");
    this.lx.size(24, 21);
    this.ox.addChild(this.lx);
    this.lx.alpha = 0;
    this.light = new Laya.Image("resources/img/battleUI/inkLight0.png");
    this.light.size(47, 35);
    this.light.anchor(0.5, 1);
    this.light.pos(41, 51);
    this.Wv.addChild(this.light);
    this.light.alpha = 0;
    this.ux = new Laya.Sprite();
    this.ux.graphics.drawRect(0, 0, 50, 31, "#fff");
    this.light.mask = this.ux;
  }

  onMouseMove(): void {}

  Jv(t: any, s: any = null): boolean {
    if (!s) return false;
    const i = s.Mv(t.containerType, this.qd).getItem(t.x, t.y);
    return !!(i && i instanceof Ws) && !(i instanceof ki);
  }

  yx(t: any): any {
    const s = new Laya.Sprite();
    s.name = "trashCan_eatClone";
    s.size(80, 80);
    s.anchorX = 0.5;
    s.anchorY = 0.5;
    const i = new Laya.Image("resources/img/props/trashCan_3.png");
    i.size(56, 22);
    i.pos(12, 22);
    s.addChild(i);
    const h = new Laya.Image("resources/img/props/trashCanLid0.png");
    h.name = "lid";
    h.size(51, 22);
    h.pos(15, 21);
    s.addChild(h);
    const e = new Laya.Image("resources/img/props/trashCan_2.png");
    e.size(56, 34);
    e.pos(12, 44);
    s.addChild(e);
    t.addChild(s);
    return s;
  }

  tk(t: any, s: any = null): void {
    if (!s) return;
    const i = s.Mv(t.containerType, this.qd);
    const h = i.getItem(t.x, t.y);
    if (!(h instanceof Ws) || h instanceof ki) return;
    const e: any = h;
    const a = e.Yn.parent;
    const n = e.Yn.x + e.Yn.width / 2;
    const r = e.Yn.y + e.Yn.height / 2;
    i.removeItem(t.x, t.y);
    const o = this.yx(a);
    o.pos(n, r);
    this.ak();
    this.Kv = 0;
    const l = o.getChildByName("lid");
    EffectMgr.instance().registerImgLoop(
      l,
      [
        "resources/img/props/trashCanLid1.png",
        "resources/img/props/trashCanLid2.png",
        "resources/img/props/trashCanLid3.png",
      ],
      50,
      0,
      1,
      () => {
        l.pos(15, 3);
        e.Yn.zIndex = 1;
        e.Yd = 2;
        const t2 = GameMgr.instance().map.gridWid;
        const s2 = GameMgr.instance().map.gridHei;
        const i2 = o.width / 2 - t2 / 2;
        const h2 = o.height / 2 - s2 / 2;
        e.nL(
          0,
          -1,
          -1,
          () => {
            e.Nd ? EntityRegistry.instance().gx(e.id) : EntityRegistry.instance().Lx(e.id);
            EffectMgr.instance().registerImgLoop(
              l,
              [
                "resources/img/props/trashCanLid2.png",
                "resources/img/props/trashCanLid1.png",
                "resources/img/props/trashCanLid0.png",
              ],
              50,
              0,
              1,
              () => {
                l.pos(15, 21);
                Laya.Point.TEMP.setTo(40, -50);
                o.localToGlobal(Laya.Point.TEMP);
                o.removeSelf();
                GameMgr.instance().battleState.gold += e.level;
                EffectMgr.instance().playGoldUp(Laya.Point.TEMP.x, Laya.Point.TEMP.y, e.level, 1.2);
                BattlePropsMgr.instance().mx();
                EventMgr.instance.event(u.ls);
              },
            );
          },
          false,
          { parent: o, x: i2, y: h2 },
        );
      },
    );
  }

  gameOver(): void {
    super.gameOver();
    this.props.size(GameMgr.instance().map.gridWid, GameMgr.instance().map.gridHei);
    this.Wv.size(this.props.width, this.props.height);
    this.Wv.anchor(0.5, 0.5);
    this.Wv.pos(this.props.width / 2, this.props.height / 2);
  }
}
PropsFactory.instance().register(21, () => Laya.Pool.createByClass(TrashCanProp));
