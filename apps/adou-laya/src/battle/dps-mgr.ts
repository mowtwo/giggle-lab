// DamageStatsMgr — per-side damage / DPS tracker (the bundle's `ah`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~15143-15191. Accumulates damage dealt by the player vs the enemy side and
// notifies registered listeners on a throttled schedule.
//
//   frameDmg=eM total=aM listeners=nM throttleMs=rM  addDamage=uM addListener=pM

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { UpdateMgr } from "../core/update-mgr";

export class DamageStatsMgr extends Singleton {
  private eM = [0, 0];
  private aM = [0, 0];
  private nM: any[] = [];
  private _time = 0;
  private rM = 50;

  init(): void {}

  startGame(): void {
    UpdateMgr.instance().register("DapDataMgr", this, this.update);
  }

  gameOver(): void {
    UpdateMgr.instance().unregister("DpsDataMgr");
    this.oM(0, true);
    this.oM(0, false);
    this.nM.length = 0;
  }

  update(delta: number): void {
    this._time += delta;
    if (this._time >= 1000) {
      this.eM[0] = 0;
      this.eM[1] = 0;
      Laya.timer.once(this.rM, this, this.lM, [0], false);
      Laya.timer.once(this.rM, this, this.cM, [0], false);
      this._time = 0;
    }
  }

  private lM(v: number): void {
    this.oM(v, true);
  }
  private cM(v: number): void {
    this.oM(v, false);
  }
  private oM(v: number, isPlayer: boolean): void {
    for (let i = 0; i < this.nM.length; i++) {
      const h = this.nM[i];
      h[1].call(h[0], v, isPlayer);
    }
  }

  /** Record damage dealt by a side. (`uM`) */
  uM(amount: number, isPlayer: boolean): void {
    this.aM[isPlayer ? 0 : 1] += amount;
    this.eM[isPlayer ? 0 : 1] += amount;
    if (isPlayer) Laya.timer.once(this.rM, this, this.lM, [this.eM[0]]);
    else Laya.timer.once(this.rM, this, this.cM, [this.eM[1]]);
  }

  /** Register a (caller, callback) damage listener. (`pM`) */
  pM(caller: any, cb: any): void {
    this.nM.push([caller, cb]);
  }
}
