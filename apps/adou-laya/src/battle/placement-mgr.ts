// PlacementMgr — the board operation queue + drag/merge/buy controller
// (the bundle's `hn`/`en`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~25631-25959. Operations (`{type}`: 0=tap, 1=move/swap/merge, 2=buy) are
// enqueued (`LF`) and processed one at a time (`mF`), with type-1/2 ops awaiting
// an animation callback (`wF`) before the next runs. `gF`/`MF`/`EF` resolve a
// drag into a merge (soldiers / generals / farmers), a swap, or a prop use,
// validating placement via the shared `PlacementValidator` rules engine (`pF`). `dF` handles the
// buy-a-unit action and (for the AI) refills the spawn box (`YF`). Opaque method
// names kept verbatim — they encode the drag-resolution decision tree.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { BoardMgr } from "./board-mgr";
import { EntityRegistry } from "./entity-registry";
import { BattlePropsMgr } from "./battle-props-mgr";
import { GameMgr } from "../core/game-mgr";
import { TipMgr } from "../core/tip-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { SpawnQueueMgr } from "./spawn-queue-mgr";
import { CellReservationMgr } from "./cell-reservation-mgr";
import { BuffMgr } from "./buff-mgr";
import { Soldier } from "./soldier";
import { BaseSoldier } from "./base-soldier";
import { Farmer } from "./farmer";
import { GeneralPart } from "./general-part";
import { PropBase } from "./props";
import { PlacementValidator } from "./placement-validator";

const C = Singleton;
const $ = AudioMgr;
const u = GameEvent;
const Oi = CellReservationMgr;
const Ws = Soldier;
const zs = BaseSoldier;
const ki = Farmer;
const gi = GeneralPart;
const Si = PropBase;

export class PlacementMgr extends C {
  static _F = "这个家伙好像不对劲";

  private rF: any[] = [];
  private oF: any = null;
  private lF = false;
  ma: any[] = [];
  private CU!: any;
  private cF!: any;
  private uF!: any;
  private dg!: any;
  private pF!: any;

  init(): void {
    this.CU = BoardMgr.instance();
    this.cF = EntityRegistry.instance();
    this.uF = BattlePropsMgr.instance();
    this.dg = GameMgr.instance();
    this.pF = new PlacementValidator(this.CU, this.dg);
  }

  yF(t: any): any {
    return t.type === 0
      ? this.fF(t)
      : t.type === 1
        ? this.gF(t)
        : t.type === 2
          ? this.dF(t)
          : { success: false, reason: "未知的操作类型" };
  }

  LF(t: any): void {
    this.rF.push(t);
    if (!this.lF) this.mF();
  }

  mF(): void {
    if (this.rF.length === 0) {
      this.lF = false;
      this.oF = null;
      return;
    }
    this.lF = true;
    this.oF = this.rF.shift();
    const t = this.yF(this.oF);
    if (!t.success) console.warn("操作失败:", t.reason);
    if (this.oF.type === 0) this.mF();
  }

  wF(): void {
    if (this.oF && (this.oF.type === 1 || this.oF.type === 2)) {
      this.oF.onComplete?.call(this.oF);
    }
    this.mF();
  }

  fF(s: any): any {
    const i = this.CU.Mv(s.vF, s.qd).getItem(s.targetX, s.targetY);
    return i
      ? i instanceof Ws && this.kF(i.id)
        ? (TipMgr.instance().showTip(PlacementMgr._F), { success: false, reason: "目标处于魅惑状态" })
        : { success: true }
      : { success: false, reason: "目标位置没有物体" };
  }

  gF(t: any): any {
    const s = this.CU.Mv(t.xF, t.qd);
    const i = s.getItem(t.SF, t.bF);
    return i
      ? i instanceof Ws
        ? this.MF(t, i, s)
        : i instanceof Si
          ? this.PF(t, i)
          : { success: false, reason: "未知的物体类型" }
      : { success: false, reason: "源位置没有物体" };
  }

  MF(t: any, s: any, i: any): any {
    const h = this.CU.Mv(t.vF, t.qd);
    const e = h.getItem(t.targetX, t.targetY);
    const a = this.AF(s, t.xF, t.SF, t.bF, t.vF, t.targetX, t.targetY, t.qd, e);
    return a.success
      ? e instanceof Ws
        ? this.EF(s, e, i, h, t)
        : this.BF(s, i, h, t)
      : a;
  }

  AF(s: any, _i: any, _h: any, _e: any, a: number, n: number, r: number, o: any, l: any): any {
    if (s.jd) {
      if (this.kF(s.id)) TipMgr.instance().showTip(PlacementMgr._F);
      return { success: false, reason: "该单位不可拖动" };
    }
    // 修复原版卡死老 bug:已合成武将由两个 GeneralPart(占两格)组成,但拖拽只会
    // 选中其中一格。走通用交换(RF)只移动这一个 part,会让武将占格/视图错乱——
    // 表现为"换不过来 / 换过去后武将睡眠卡死 / 吃掉其他格子"。禁止单格拖动已合成
    // 武将(Zw!==-1),拖动会按既有失败路径弹回原位;未合成的 part(Zw===-1)仍可
    // 正常拖动去合成。
    if (s instanceof gi && s.Zw !== -1) {
      TipMgr.instance().showTip("已合成的武将不能移动位置");
      return { success: false, reason: "已合成的武将不能移动位置" };
    }
    if (a !== 1 && a !== 3) return { success: false, reason: "士兵只能放置到地图或刷新栏" };
    const c = this.dg.map.ue;
    if (s instanceof ki) {
      if (a === 1) {
        const cell = c[n][r];
        if ((o && cell === "0_0") || (!o && cell === "0_1"))
          return { success: false, reason: "农民不能放到路上" };
        if (
          !(
            (o && (cell === "1_0" || cell === "2_0")) ||
            (!o && (cell === "1_1" || cell === "2_1"))
          )
        )
          return { success: false, reason: "农民不能放到对方区域" };
      }
    } else if (a === 1) {
      const cell = c[n][r];
      if ((o && cell !== "1_0") || (!o && cell !== "1_1"))
        return { success: false, reason: "士兵不能放到该格子" };
    }
    return !l || l instanceof Ws
      ? l instanceof Ws && l.jd
        ? (this.kF(l.id) && TipMgr.instance().showTip(PlacementMgr._F), { success: false, reason: "目标单位不可拖动" })
        : { success: true }
      : { success: false, reason: "不能与道具交换位置" };
  }

  EF(t: any, s: any, i: any, h: any, e: any): any {
    const { xF: _a, SF: n, bF: r, vF: o } = e;
    if (
      t instanceof zs &&
      s instanceof zs &&
      t.Qd === s.Qd &&
      t.level === s.level &&
      t.id !== s.id &&
      s.level < 5 &&
      !t.$d &&
      !s.$d
    ) {
      this.IF(t, s, i, e);
      return { success: true };
    }
    if (t instanceof gi && o === 1) {
      const merged = this.cF.YS(t, s);
      if (merged && merged.level < merged.maxLevel) {
        this.DF(t, s, merged, i, e);
        return { success: true };
      }
    }
    if (
      t instanceof ki &&
      s instanceof ki &&
      t.Qd === s.Qd &&
      t.level === s.level &&
      t.id !== s.id &&
      s.level < 5 &&
      !t.$d &&
      !s.$d
    ) {
      this.TF(t, s, i, e);
      return { success: true };
    }
    if (t instanceof ki) {
      const cell = this.dg.map.ue[n][r];
      if (((t.qd && cell === "2_0") || (!t.qd && cell === "2_1")) && !(s instanceof ki))
        return { success: false, reason: "农民在未开扩格子不能与士兵交换" };
    }
    this.RF(t, s, i, h, e);
    return { success: true };
  }

  IF(t: any, s: any, _i: any, h: any): void {
    const { vF: e, targetX: a, targetY: n, xF: r, SF: o, bF: l } = h;
    t.nL(
      e,
      a,
      n,
      () => {
        t.Td = r;
        t.Cd.setTo(o, l);
        this.cF._S(s.id, t.Xd);
        this.cF.Lx(t.id);
        s.cL();
        BattlePropsMgr.instance().mx();
        this.wF();
      },
      true,
    );
  }

  DF(t: any, s: any, i: any, _h: any, e: any): void {
    const { vF: a, targetX: n, targetY: r, xF: o, SF: l, bF: c } = e;
    t.nL(
      a,
      n,
      r,
      () => {
        i.RS(this.dg.generals.Wa[i.level] - this.dg.generals.Wa[i.level - 1]);
        t.Td = o;
        t.Cd.setTo(l, c);
        this.cF._S(s.id, t.Xd);
        this.cF.gx(t.id);
        this.wF();
      },
      true,
    );
  }

  TF(t: any, s: any, _i: any, h: any): void {
    const { vF: e, targetX: a, targetY: n, xF: r, SF: o, bF: l } = h;
    t.nL(
      e,
      a,
      n,
      () => {
        t.Td = r;
        t.Cd.setTo(o, l);
        this.cF.uk(t.id);
        s.cL();
        BattlePropsMgr.instance().mx();
        this.wF();
      },
      true,
    );
  }

  RF(t: any, s: any, i: any, h: any, e: any): void {
    const { xF: _a, SF: n, bF: r, vF: o, targetX: l, targetY: c, qd: u2 } = e;
    i.removeItem(n, r);
    h.removeItem(l, c);
    i.setItem(s, n, r);
    h.setItem(t, l, c);
    t.lL(o, l, c);
    s.lL(_a, n, r);
    if (u2) BattlePropsMgr.instance().mx();
    this.wF();
  }

  BF(t: any, s: any, i: any, h: any): any {
    const { SF: e, bF: a, vF: n, targetX: r, targetY: o, qd: l } = h;
    s.removeItem(e, a);
    i.setItem(t, r, o);
    t.lL(n, r, o);
    if (l)
      Laya.timer.once(200, this, () => {
        BattlePropsMgr.instance().mx();
      });
    this.wF();
    return { success: true };
  }

  PF(t: any, s: any): any {
    if (s.ek()) return { success: false, reason: "道具在冷却中" };
    if (!s.qd) return { success: false, reason: "敌人道具不可拖动" };
    const i = { containerType: t.vF, x: t.targetX, y: t.targetY };
    const h = this.pF.validate(s, i);
    if (h.valid) {
      s.tk(i, this.CU);
      if (s.qd) {
        const c = t.vF;
        if (c === 1 || c === 2) EventMgr.instance.event(u.Nt);
      }
      this.wF();
      return { success: true };
    }
    s.ak();
    this.wF();
    const reason = h.reason || "道具不能在该位置使用";
    if (reason) TipMgr.instance().showTip(reason);
    return { success: false, reason };
  }

  CF(t: any, s: any): boolean {
    return this.pF.validate(t, s).valid;
  }

  UF(t: any, s: any): any {
    return this.pF.validate(t, s);
  }

  FF(): void {
    this.rF.length = 0;
    this.oF = null;
    this.lF = false;
  }

  dF(t: any): any {
    const { qd: s } = t;
    const i = s ? this.dg.battleState.gold : this.dg.battleState.Ki;
    const h = s ? this.dg.battleState.yi : this.dg.battleState.fi;
    if (i < h) {
      if (s) {
        TipMgr.instance().showTip("馒头不足");
        $.instance().playSound("popup_notification");
      }
      return { success: false, reason: "馒头不足" };
    }
    if (s) {
      this.dg.battleState.gold -= h;
      this.dg.battleState.yi += 2;
    } else {
      this.dg.battleState.Ki -= h;
      this.dg.battleState.fi += 2;
    }
    this.OF(s);
    if (!s) {
      this.YF();
      this.wF();
    }
    return { success: true };
  }

  YF(): void {
    const t = this.CU.Mv(3, false);
    const s = this.dg.map.ye;
    const i: any[] = [];
    const h: any[] = [];
    for (let k = 0; k < s; k++) {
      const unit = SpawnQueueMgr.instance().LU(false);
      if (this.dg.battleState.ki < 2 || unit === "铲") i.push(unit);
      else h.push(unit);
    }
    if (this.dg.battleState.ki >= 2) for (let k = 0; k < h.length; k++) i.push(h[k]);
    for (let s2 = 0; s2 < i.length; s2++) {
      const unit = i[s2];
      if (unit !== "铲") {
        const made = this.cF.C_(3, unit, false, s2);
        if (made instanceof gi) {
          const ctr = mn.instance();
          if (ctr && ctr.XF) ctr.XF.set(made.id, made);
        }
      } else t.setItem(null, s2);
    }
  }

  OF(t: any): void {
    let s: any;
    const i = this.CU.Mv(3, t);
    const h = t && BattlePropsMgr.instance().iS(t, 21);
    for (let k = 0; k < i.mv.length; k++) {
      s = i.getItem(k);
      if (s instanceof zs) {
        if (h) {
          Laya.Point.TEMP.x = 10;
          Laya.Point.TEMP.y = 0;
          s.Yn.localToGlobal(Laya.Point.TEMP);
          EffectMgr.instance().playGoldUp(Laya.Point.TEMP.x, Laya.Point.TEMP.y, s.level);
        }
        this.cF.Lx(s.id);
      } else if (s instanceof gi) {
        if (h) {
          Laya.Point.TEMP.x = 10;
          Laya.Point.TEMP.y = 0;
          s.Yn.localToGlobal(Laya.Point.TEMP);
          EffectMgr.instance().playGoldUp(Laya.Point.TEMP.x, Laya.Point.TEMP.y, s.level);
        }
        this.cF.gx(s.id);
      } else if (s instanceof ki) this.cF.uk(s.id);
      else if (s instanceof xi) this.uF.Xx(s.id);
    }
    i.removeAll();
  }

  removeProps(t: number, s: number, i: number, h: any): void {
    const e = this.CU.Mv(t, h);
    e?.removeItem(s, i);
  }

  gameOver(): void {
    this.FF();
    Oi.instance().clear();
    this.CU.clearAll();
  }

  kF(t: number): boolean {
    return BuffMgr.instance().qS(t, 19);
  }
}

/** Alias. (`en`) */
export const en = PlacementMgr;

// Runtime-only imports (cycles resolved lazily inside methods).
import { Prop as xi } from "./prop";
import { EffectMgr } from "./effect-mgr";
import { GeneralAIController as mn } from "./ai-controller";
