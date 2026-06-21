// BoardInputMgr — translates raw pointer events on the board into placement
// operations (the bundle's `Pn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~27524-27664. `onMouseDown` picks up the unit/prop under the pointer (unless
// it is mid-move or on cooldown), `onMouseMove` promotes a press into a drag,
// and `onMouseUp` resolves it into either a tap (`BX`, op type 0) or a drag
// (`EX`, op type 1) enqueued on the placement controller. `refresh` spawns the
// just-bought unit into the refresh box. Opaque field / method names kept
// verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AIControllerBase } from "./ai-controller";
import { PlacementMgr } from "./placement-mgr";
import { BoardMgr } from "./board-mgr";
import { EffectMgr } from "./effect-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { GameMgr } from "../core/game-mgr";
import { EntityRegistry } from "./entity-registry";
import { BattlePropsMgr } from "./battle-props-mgr";
import { Soldier } from "./soldier";
import { PropBase } from "./props";
import { Prop } from "./prop";

const en = PlacementMgr;
const wi = BoardMgr;
const q = EffectMgr;
const y = EventMgr;
const u = GameEvent;
const F = GameMgr;
const Ki = EntityRegistry;
const Zi = BattlePropsMgr;
const Ws = Soldier;
const Si = PropBase;
const xi = Prop;

export class BoardInputMgr extends AIControllerBase {
  private bX: any = null;
  private Hv: any = { LX: 0, containerType: 0, x: 0, y: 0 };
  private Hl: any = { LX: 0, containerType: 0, x: 0, y: 0 };
  private MX = false;
  private PX!: any;
  private CU!: any;

  init(): void {
    this.PX = en.instance();
    this.CU = wi.instance();
  }

  onMouseDown(t: any): any {
    this.Hv.LX = t.LX;
    this.Hv.containerType = t.containerType;
    this.Hv.x = t.x;
    this.Hv.y = t.y;
    q.instance().toggleTargetCircle(false);
    q.instance().showUnitInfo(false);
    if (this.Hv.LX === 0) {
      this.bX = null;
      y.instance.event(u.us, null);
      return null;
    }
    const s = this.AX(this.Hv.LX, this.Hv.y);
    const i = this.CU.Mv(this.Hv.containerType, s);
    this.bX = i.getItem(this.Hv.x, this.Hv.y);
    if (!this.bX) {
      y.instance.event(u.us, null);
      return null;
    }
    if (this.bX instanceof Ws) {
      if (this.bX.currentState === "skip") {
        console.log("单位正在移动中，不能拖动");
        this.bX = null;
        return null;
      }
      this.bX.onMouseDown();
      this.MX = false;
      return this.bX;
    }
    if (this.bX instanceof Si) {
      if (this.bX.ek()) return null;
      this.bX.onMouseDown();
      this.MX = false;
      return this.bX;
    }
    if (this.bX instanceof xi) {
      this.bX.onMouseDown();
      this.MX = false;
      return this.bX;
    }
    return null;
  }

  onMouseMove(_t: any): any {
    if (this.bX && !this.MX) {
      if (this.bX instanceof Ws)
        return this.bX.qd ? ((this.MX = true), this.bX.onMouseMove(), this.bX.Yn) : null;
      if (this.bX instanceof Si)
        return this.bX.qd ? ((this.MX = true), this.bX.onMouseMove(), this.bX.Wv) : null;
      if (this.bX instanceof xi) return null;
    }
    return null;
  }

  onMouseUp(t: any): void {
    this.Hl.LX = t.LX;
    this.Hl.containerType = t.containerType;
    this.Hl.x = t.x;
    this.Hl.y = t.y;
    if (this.bX) {
      if (this.MX) this.EX();
      else this.BX();
      this.IX();
    }
  }

  BX(): void {
    if (!this.bX) return;
    const t = this.AX(this.Hv.LX, this.Hv.y);
    const s = {
      type: 0,
      vF: this.Hv.containerType,
      targetX: this.Hv.x,
      targetY: this.Hv.y,
      qd: t,
    };
    const i = this.PX.yF(s);
    if (!i.success) console.log("点击操作失败:", i.reason);
    if (this.bX instanceof Ws || this.bX instanceof xi) this.bX.onMouseUp();
  }

  EX(): void {
    if (!this.bX) return;
    q.instance().toggleTargetCircle(false);
    if (this.bX instanceof Ws && !this.DX(this.Hl.LX)) return void this.bX.onMouseUp();
    if (this.Hl.LX === 0)
      return void ((this.bX instanceof Ws || this.bX instanceof Si) && this.bX.onMouseUp());
    const t = this.AX(this.Hv.LX, this.Hv.y);
    const s = {
      type: 1,
      xF: this.Hv.containerType,
      SF: this.Hv.x,
      bF: this.Hv.y,
      vF: this.Hl.containerType,
      targetX: this.Hl.x,
      targetY: this.Hl.y,
      qd: t,
      onComplete: () => {
        console.log("拖动操作完成");
      },
    };
    const i = this.PX.yF(s);
    if (i.success) return;
    console.log("拖动操作失败:", i.reason);
    if (this.bX instanceof Ws || this.bX instanceof Si) this.bX.onMouseUp();
  }

  IX(): void {
    this.bX = null;
    this.MX = false;
    this.Hv.LX = 0;
    this.Hv.containerType = 0;
    this.Hv.x = 0;
    this.Hv.y = 0;
    this.Hl.LX = 0;
    this.Hl.containerType = 0;
    this.Hl.x = 0;
    this.Hl.y = 0;
  }

  refresh(t: any, s: any): void {
    if (t !== "铲") Ki.instance().C_(3, t, true, s);
    else Zi.instance().Zx(true, 0, 3, s);
  }

  DX(t: number): boolean {
    return t === 1 || t === 2;
  }

  AX(t: number, s: number): boolean {
    return !(t === 1 && s < F.instance().map.ue[0].length / 2) && t !== 4;
  }

  gameOver(): void {
    this.IX();
  }
}

/** Alias. (`Pn`) */
export const Pn = BoardInputMgr;
