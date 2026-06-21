// BuffMgr — applies / tracks / removes buffs on every battle entity.
//
// Faithful reconstruction of the bundle's `th` (reconstruction/reference/
// bundle.pretty.js lines ~14708-14820). Keeps a per-target map of group → buff
// instance, resolves the target via `resolveBuffTarget`, enforces the
// effect-relation conflicts (a new buff can clear the buffs it suppresses, and
// be blocked by the buffs that suppress it), and drives buff updates each frame.
//
//   targets=tb  helper=JS  effectRelation=KS  getOrCreate=eb  applyBuff=applyBuff
//   applyCustom=nb  removeGroup=sb  clearTarget=hb  has=qS  removeSub=kg  modify=modify

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { SpecialIndex } from "./attr-type";
import { makeBuffData } from "./buff";
import { EffectMgr } from "./effect-mgr";
import { BuffFactory, EffectRelationHelper, resolveBuffTarget } from "./buff-factory";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const L = SpecialIndex;
const as = makeBuffData;
const Us = BuffFactory;
const Ji = resolveBuffTarget;
const q = EffectMgr;

export class BuffMgr extends Singleton {
  private KS!: any;
  private JS!: EffectRelationHelper;
  private tb!: Map<number, Map<any, any>>;

  init(): void {
    this.KS = F.instance().effectRelation;
    this.JS = new EffectRelationHelper(this.KS);
    this.tb = new Map();
    Us.instance().init();
    y.instance.on(u.hs, this, this.sb);
    y.instance.on(u.es, this, this.hb);
  }

  startGame(): void {
    j.instance().register("BuffMgr", this, this.update);
  }

  /** Get-or-create the group→buff map for a target id. (`eb`) */
  eb(id: number): Map<any, any> {
    let map = this.tb.get(id);
    if (!map) {
      map = new Map();
      this.tb.set(id, map);
    }
    return map;
  }

  applyBuff(t: number, s: any, i: number, h: any = false, e: number = L.Ji, a: any = null): number {
    const target = Ji(t);
    if (!target) {
      console.log("没有buff作用目标");
      return -1;
    }
    const data = as(i, h, e, a);
    let map = this.eb(t);

    // Clear the buffs this group suppresses, then refresh the target map.
    this.JS.Sd(map as any, s, (effect: any) => this.sb(target, effect));
    map = this.eb(t);

    // Blocked by a present conflicting buff.
    if (this.JS._d(map as any, s)) return -1;

    let buff = map.get(s);
    let c = -1;
    if (buff) {
      c = buff.addSubBuffData(data);
    } else {
      buff = Us.instance().produce(s);
      map.set(s, buff);
      c = buff.applyData(target, s, data);
      const desc = buff.describe(s, data.num, data.yg);
      if (desc) {
        const reduce = buff.isReduction(s, data.num, data.yg);
        const node = target.pg();
        q.instance().showFloatingText(node, desc, reduce);
        reduce ? q.instance().playArrowRainDown(node) : q.instance().playArrowRainUp(node);
      }
    }
    return c;
  }

  ab(t: number, s: any, i: any): number {
    return this.applyBuff(t, s, i.num, i.yg, i.time, i.fg);
  }

  /** Apply a custom (callback) buff. (`nb`) */
  nb(t: number, s: number, i: any): void {
    const target = Ji(t);
    if (!target) {
      console.log("没有buff作用目标");
      return;
    }
    const data = as(0, false, s, i);
    const map = this.eb(t);
    let buff = map.get(7);
    if (buff) {
      buff.addSubBuffData(data);
    } else {
      buff = Us.instance().produce(7);
      map.set(7, buff);
      buff.applyData(target, 7, data);
    }
  }

  ob(t: number): Map<any, any> | undefined {
    return this.tb.get(t);
  }

  /** Remove a single group's buff from a target entity. (`sb`) */
  sb(target: any, s: any): void {
    const map = this.tb.get(target.id);
    if (!map) return;
    const buff = map.get(s);
    if (buff) {
      map.delete(s);
      buff.remove();
    }
  }

  update(t: number): void {
    for (const [, map] of this.tb) for (const [, buff] of map) if (buff.hasTimedSubBuff()) buff.onUpdate(t);
  }

  /** Whether target `t` has a buff of group `s`. (`qS`) */
  qS(t: number, s: any): boolean {
    return !!this.tb.get(t)?.get(s);
  }

  /** Remove a sub-buff by id from a target's group buff. (`kg`) */
  kg(t: number, s: any, i: number): void {
    const buff = this.tb.get(t)?.get(s);
    if (buff) buff.removeSubBuff(i);
  }

  modify(t: number, s: any, i: number, h: any, e: any, a: any): boolean {
    const buff = this.tb.get(t)?.get(s);
    return !!buff && buff.updateSubBuff(i, h, e, a);
  }

  /** Clear all buffs on a target id and drop the entry. (`hb`) */
  hb(t: number): void {
    const map = this.tb.get(t);
    if (!map) return;
    const keys = Array.from(map.keys());
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const buff = map.get(k);
      if (buff) {
        map.delete(k);
        buff.remove();
      }
    }
    this.tb.delete(t);
  }

  gameOver(): void {
    j.instance().unregister("BuffMgr");
    const keys = Array.from(this.tb.keys());
    for (let i = 0; i < keys.length; i++) this.hb(keys[i]);
    this.tb.clear();
  }
}
