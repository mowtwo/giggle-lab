// Buff — abstract base for stackable status effects, + small buff helpers.
//
// Faithful reconstruction of the original bundle's `ns` class and the `as`/`hs`/
// `es` helpers (reconstruction/reference/bundle.pretty.js lines ~9197-9307). A
// Buff holds a list of sub-buffs and drives their timed expiry; concrete buff
// types (`ls extends ns`, …) implement the abstract hooks. Hook names kept
// verbatim (subclass contract): mg/vg/Mg/Pg/Ag.
//
//   subBuffs=gg  makeBuffData=as  emitBuffDataChanged=hs  emitBuffTypeChanged=es
//   addSubBuff=wg  applyData=_g  addSubBuffData=xg  updateSubBuff=Sg
//   removeSubBuff=kg  onRemove=Eg  hasTimedSubBuff=Bg  tickSubBuffs=Ig

/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { SpecialIndex } from "./attr-type";
import { GameMgr } from "../core/game-mgr";

const evt = EventMgr.instance;
const u = GameEvent;
const L = SpecialIndex;

export interface BuffData {
  num: number;
  yg: any;
  time: number;
  fg: any;
}

/** Build a buff-data record. (`as`) */
export function makeBuffData(num: number, yg: any, time: number = L.Ji, fg: any = null): BuffData {
  return { num, yg, time, fg };
}

/** Notify a target that its buff data changed. (`hs`) */
export function emitBuffDataChanged(target: any): void {
  target.pg().event("onBuffDataChanged");
}

/** Notify a target that its buff types changed. (`es`) */
export function emitBuffTypeChanged(target: any): void {
  target.pg().event("onBuffTypeChanged");
}

export abstract class Buff {
  protected gg: any[] = [];
  protected dg: any;
  id = 0;
  protected target: any;
  protected Lg: any;

  apply(target: any, group: any, num: number, yg: any, time: number, fg: any): any {
    this.dg = GameMgr.instance();
    this.id = this.dg.effectRelation.id += 1;
    this.target = target;
    this.Lg = group;
    const result = this.mg(makeBuffData(num, yg, time, fg));
    emitBuffDataChanged(this.target);
    emitBuffTypeChanged(this.target);
    return result;
  }

  /** Add a sub-buff; if it expires this round, schedule removal. (`wg`) */
  addSubBuff(num: number, yg: any, time: number, fg: any): any {
    const data = makeBuffData(num, yg, time, fg);
    const sub = this.vg(data);
    if (sub != null && data.time === L.round) {
      evt.once(u.Ft, this, this.removeSubBuff.bind(this, sub));
    }
    emitBuffDataChanged(this.target);
    return sub;
  }

  /** (`_g`) */
  applyData(target: any, group: any, data: BuffData): any {
    return this.apply(target, group, data.num, data.yg, data.time, data.fg);
  }

  /** (`xg`) */
  addSubBuffData(data: BuffData): any {
    return this.addSubBuff(data.num, data.yg, data.time, data.fg);
  }

  /** (`Sg`) */
  updateSubBuff(id: number, num: any, time: any, fg: any): boolean {
    const idx = this.gg.findIndex((s) => s.id === id);
    if (idx < 0) {
      console.warn(`Buff(${this.id})中不存在ID为${id}的子Buff`);
      return false;
    }
    const ok = this.Mg(idx, num, time, fg);
    if (ok) emitBuffDataChanged(this.target);
    return ok;
  }

  /** Remove a sub-buff by id; emits "buff fully removed" when empty. (`kg`) */
  removeSubBuff(id: number): boolean {
    const idx = this.gg.findIndex((s) => s.id === id);
    if (idx < 0) {
      console.warn(`Buff(${this.id})中不存在ID为${id}的子Buff`);
      return false;
    }
    const ok = this.Pg(idx);
    if (ok && this.gg.length <= 0) {
      evt.event(u.hs, this.target, this.Lg);
    }
    return ok;
  }

  remove(): void {
    const target = this.target;
    for (let i = this.gg.length - 1; i >= 0; i--) this.Pg(i);
    this.Ag();
    this.gg.length = 0;
    if (target) {
      emitBuffDataChanged(target);
      emitBuffTypeChanged(target);
    }
    this.target = null;
    this.onRemove();
  }

  /** Hook: subclass cleanup on full removal. (`Eg`) */
  protected onRemove(): void {}

  /** Whether any sub-buff has a finite (timed) duration. (`Bg`) */
  hasTimedSubBuff(): boolean {
    for (let i = 0; i < this.gg.length; i++) {
      const time = this.gg[i].time;
      if (time !== L.Ji && time !== L.round) return true;
    }
    return false;
  }

  onUpdate(delta: number): void {
    this.tickSubBuffs(delta);
  }

  /** Advance timers and remove expired sub-buffs. (`Ig`) */
  protected tickSubBuffs(delta: number): void {
    for (let s = this.gg.length - 1; s >= 0; s--) {
      const sub = this.gg[s];
      if (sub.time !== L.Ji && sub.time !== L.round) {
        sub.timer += delta;
        if (sub.timer >= sub.time) this.removeSubBuff(sub.id);
      }
    }
  }

  // Subclass hooks (abstract contract from the bundle).
  protected abstract mg(data: BuffData): any;
  protected abstract vg(data: BuffData): any;
  protected abstract Mg(index: number, num: any, time: any, fg: any): boolean;
  protected abstract Pg(index: number): boolean;
  protected abstract Ag(): void;
}
