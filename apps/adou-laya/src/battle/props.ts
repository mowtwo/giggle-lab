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

const F = GameMgr;
const X = LayerZ;
const y = EventMgr;
const u = GameEvent;
const tt = TipMgr;
const Ki = EntityRegistry;

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
