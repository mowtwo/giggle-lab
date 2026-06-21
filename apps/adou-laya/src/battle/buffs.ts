// Concrete buff types + helpers.
//
// Faithful reconstruction of the bundle's buff helpers `rs`/`os`/`cs`/`us` and
// the buff subclasses `ls` (attribute buff) and `Ls` (callback buff)
// (reconstruction/reference/bundle.pretty.js lines ~9301-9650). Operate on unit
// entities (typed `any`; entity classes ported separately). The visual buff
// types (`ps` state, `ms` lock, …) follow.
//
//   computeStateValue=rs  revertState=os  effectStates=cs  applyStates=us
//   AttrBuff=ls (isReduction=Rg describe=Cg applyAttr=Ug)  CallbackBuff=Ls

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Buff, BuffData } from "./buff";
import { GameMgr } from "../core/game-mgr";

/** Resolve a state delta: scaled by the target's base when `scaled`. (`rs`) */
export function computeStateValue(target: any, type: any, value: number, scaled: boolean): number {
  return scaled ? target.Dg(type) * value : value;
}

/** Revert a previously-applied state delta. (`os`) */
export function revertState(target: any, type: any, value: number, scaled: boolean, emit = true): void {
  const v = computeStateValue(target, type, value, scaled);
  target.Tg(type, -v, emit);
}

/** Effect-relation state list for a type. (`cs`) */
export function effectStates(effectRelation: any, type: any): any[] {
  return effectRelation.ih.get(type) ?? [];
}

/** Apply a set of states to a target. (`us`) */
export function applyStates(target: any, states: any[], on: boolean, fg?: any): void {
  for (let i = 0; i < states.length; i++) target.setState(states[i], on, fg);
}

/** Attribute buff (att power / speed / range …). (`ls`) */
export class AttrBuff extends Buff {
  /** Whether this delta is a reduction. (`Rg`) */
  isReduction(_type: any, num: number, _i?: any): boolean {
    if (num === 0) return false;
    return !(num > 0);
  }

  /** Human-readable description (攻击力/范围/攻速 + 降低/提升). (`Cg`) */
  describe(type: any, num: number, i?: any): string | null {
    if (num === 0) return null;
    let label = "";
    switch (type) {
      case 0: label = "攻击力"; break;
      case 2: label = "范围"; break;
      case 1: label = "攻速"; break;
      default: return null;
    }
    return label + (this.isReduction(type, num, i) ? "降低" : "提升");
  }

  protected mg(data: BuffData): any {
    return this.addSubBuffData(data);
  }

  /** Apply the attribute delta to the target. (`Ug`) */
  protected applyAttr(num: number, yg: any): void {
    const value = computeStateValue(this.target, this.Lg, num, yg);
    this.target.Tg(this.Lg, value);
  }

  protected vg(data: BuffData): any {
    this.applyAttr(data.num, data.yg);
    const id = (GameMgr.instance().effectRelation.id += 1);
    this.gg.push({ id, num: data.num, yg: data.yg, time: data.time, timer: 0 });
    return id;
  }

  protected Pg(index: number): boolean {
    const sub = this.gg[index];
    revertState(this.target, this.Lg, sub.num, sub.yg, true);
    this.gg.splice(index, 1);
    return true;
  }

  protected Mg(index: number, num: any, time: any, fg: any): boolean {
    const sub = this.gg[index];
    const hasNum = num != null;
    const hasYg = time != null; // bundle: `i` (3rd arg) carries the new yg
    if (hasNum || hasYg) {
      revertState(this.target, this.Lg, sub.num, sub.yg, true);
      if (hasYg) {
        sub.yg = time;
        if (!hasNum) this.applyAttr(sub.num, time);
      }
      if (hasNum) {
        sub.num = num;
        this.applyAttr(num, sub.yg);
      }
    }
    if (fg != null) sub.time = fg;
    return true;
  }

  protected Ag(): void {}

  protected onRemove(): void {
    Laya.Pool.recoverByClass(this);
  }
}

/** Callback buff: fires onStart/onEnd/Kg hooks over its lifetime. (`Ls`) */
export class CallbackBuff extends Buff {
  constructor() {
    super();
    this.gg = [];
  }

  describe(): string {
    return "";
  }
  isReduction(): boolean {
    return true;
  }

  protected mg(data: BuffData): any {
    return this.addSubBuffData(data);
  }

  protected vg(data: BuffData): any {
    const cfg = data.fg;
    const id = (GameMgr.instance().effectRelation.id += 1);
    this.gg.push({
      id,
      time: data.time,
      timer: 0,
      Kg: cfg.Kg,
      onEnd: cfg.onEnd,
      onStart: cfg.onStart,
      num: 0,
      yg: false,
    });
    cfg?.onStart(this);
    return id;
  }

  protected Pg(index: number): boolean {
    const sub = this.gg[index];
    this.gg.splice(index, 1);
    sub?.onEnd?.call(sub, this);
    return true;
  }

  protected Mg(index: number, _num: any, _time: any, fg: any): boolean {
    const sub = this.gg[index];
    if (fg != null) sub.time = fg;
    return true;
  }

  protected Ag(): void {}
}
