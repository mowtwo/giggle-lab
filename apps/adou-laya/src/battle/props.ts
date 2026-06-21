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
import { AudioMgr } from "../core/audio-mgr";
import { EffectMgr } from "./effect-mgr";

const F = GameMgr;
const X = LayerZ;
const y = EventMgr;
const u = GameEvent;
const tt = TipMgr;
const Ki = EntityRegistry;
const Eh = EnemySpatialMgr;
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
