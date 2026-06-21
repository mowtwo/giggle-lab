// FocusMgr — tracks the currently selected unit and drives the unit-info popup
// (the bundle's `Tn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~28702-28758. Selecting a unit (`onFocusChanged`) fires the focus-change
// events, opens `UnitInfoDialog` for soldiers/farmers/generals (skipping unbound
// general parts), and clears it on deselect or unit destruction. Opaque field /
// method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { SceneMgr } from "../core/scene-mgr";

const y = EventMgr;
const u = GameEvent;
const K = SceneMgr;

export class FocusMgr extends Singleton {
  private wH = false;
  private param: any = { vH: 0, objectType: 2 };
  private _H: any = null;

  get kH(): any {
    return this._H;
  }
  set kH(t: any) {
    this.onFocusChanged(t);
  }

  init(): void {
    y.instance.on(u.us, this, this.onFocusChanged);
  }

  startGame(): void {}

  xH(): void {
    this._H.offAllCaller(this);
    this._H = null;
  }

  onFocusChanged(t: any): void {
    if (t == this._H) return;
    if (this._H) this.xH();
    const s = this._H;
    this._H = t;
    y.instance.event(u.ys, s);
    if (t) {
      this._H.once("onDestroy", this.xH, this);
      this.SH();
      K.instance()
        .openDialog("UnitInfoDialog", false, null)
        .then((d: any) => {
          this.bH(d);
        });
    } else this.SH();
  }

  bH(t: any): void {
    switch (this._H.objectType) {
      case 1:
      case 2:
      case 4:
        break;
      case 3:
        if (this._H.Zw === -1) return void this.SH();
        break;
      default:
        return void this.SH();
    }
    this.param.vH = this._H.id;
    this.param.objectType = this._H.objectType;
    t.MH(this.param);
    this.wH = true;
  }

  SH(): void {
    K.instance().closeDialog("UnitInfoDialog");
    this.wH = false;
  }
}

/** Alias. (`Tn`) */
export const Tn = FocusMgr;
