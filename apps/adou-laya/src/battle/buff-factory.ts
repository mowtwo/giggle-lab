// Buff registry / factory + effect-relation helper + buff-target resolver.
//
// Faithful reconstruction of the bundle's buff-handler registry
// (reconstruction/reference/bundle.pretty.js lines ~9990-10153 and the `Ji`
// resolver at ~14700). `BUFF_DEFINITIONS` (As/Es) declares each buff type's
// category (0=pooled number, 1=state, 2=custom); `BUFF_PRODUCERS` (Ts) maps a
// type to its producer; `BuffFactory` (Us) validates the pairing on init and
// produces/recovers buff instances. `EffectRelationHelper` (Fs) answers
// conflict/relation queries against the effect-relation table. `resolveBuffTarget`
// (Ji) finds the entity a buff applies to across the enemy + unit registries.
//
//   BuffFactory=Us  EffectRelationHelper=Fs  resolveBuffTarget=Ji
//   producePooledNumberBuff=Is  produceCustomBuff=Ds  isPooledNumberProducer=Rs
//   BUFF_DEFINITIONS=As/Es  BUFF_PRODUCERS=Ts  inited=Cs

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { AttrType } from "./attr-type";
import { AttrBuff, CallbackBuff } from "./buffs";
import {
  StunBuff,
  ChaosBuff,
  KnockbackBuff,
  BurnBuff,
  LockBuff,
  FallBuff,
  PierceBuff,
  SpinFallBuff,
  SuppressBuff,
  HiddenStateBuff,
  CharmBuff,
  ShockBuff,
} from "./state-buffs";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { EntityRegistry } from "./entity-registry";

/** Producer for pooled attribute (number) buffs. (`Is`) */
function producePooledNumberBuff(): any {
  return Laya.Pool.createByClass(AttrBuff);
}

/** Producer for the custom (callback) buff. (`Ds`) */
function produceCustomBuff(): any {
  return new CallbackBuff();
}

/** Buff-type → category. 0=pooled number, 1=state, 2=custom. (`As`) */
const BUFF_DEFINITIONS: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [8, 1],
  [11, 1],
  [9, 1],
  [10, 1],
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 1],
  [17, 1],
  [18, 1],
  [19, 1],
  [7, 2],
];

const Es = new Map(BUFF_DEFINITIONS);

/** Buff-type → producer. (`Ts`) */
const Ts = new Map<number, () => any>([
  [0, producePooledNumberBuff],
  [1, producePooledNumberBuff],
  [2, producePooledNumberBuff],
  [3, producePooledNumberBuff],
  [4, producePooledNumberBuff],
  [5, producePooledNumberBuff],
  [6, producePooledNumberBuff],
  [8, () => new StunBuff()],
  [11, () => new ShockBuff()],
  [13, () => new ChaosBuff()],
  [12, () => new KnockbackBuff()],
  [14, () => new BurnBuff()],
  [16, () => new LockBuff()],
  [7, produceCustomBuff],
  [9, () => new FallBuff()],
  [10, () => new PierceBuff()],
  [17, () => new SpinFallBuff()],
  [18, () => new SuppressBuff()],
  [19, () => new CharmBuff()],
  [15, () => new HiddenStateBuff()],
]);

/** Whether a producer is the pooled-number producer. (`Rs`) */
function isPooledNumberProducer(producer: any): boolean {
  return producer === producePooledNumberBuff;
}

let inited = false;

function buffName(t: number): string {
  return (AttrType as any)[t];
}

export class BuffFactory extends Singleton {
  init(): void {
    if (inited) return;
    inited = true;
    for (const [t, s] of Es) {
      const producer = Ts.get(t);
      if (!producer)
        throw new Error(`[BuffHandlerRegistry] BuffDefinitions 声明了 ${buffName(t)}，但 BUFF_PRODUCERS 未注册`);
      const pooled = isPooledNumberProducer(producer);
      if (s === 0) {
        if (!pooled)
          throw new Error(`[BuffHandlerRegistry] Buff.${buffName(t)} 为 number 类型，必须使用 poolNumberBuff`);
      } else if (s === 2) {
        if (t !== 7 || producer !== produceCustomBuff)
          throw new Error("[BuffHandlerRegistry] 仅 Buff.custom 可为 custom 类型且须使用 produceCustomBuff");
      } else {
        if (pooled)
          throw new Error(`[BuffHandlerRegistry] Buff.${buffName(t)} 为 state 类型，不可使用 poolNumberBuff`);
        if (t === 7) throw new Error("[BuffHandlerRegistry] Buff.custom 必须为 custom 类型");
      }
    }
    for (const t of Ts.keys())
      if (!Es.has(t))
        throw new Error(`[BuffHandlerRegistry] BUFF_PRODUCERS 注册了 ${buffName(t)}，但 BuffDefinitions 缺少条目`);
  }

  produce(t: number): any {
    const producer = Ts.get(t);
    if (!producer) throw new Error(`[BuffHandlerRegistry] Buff(ID:${t} / ${buffName(t)}) 未实现`);
    return producer();
  }

  recover(t: any): void {
    Laya.Pool.recoverByClass(t);
  }
}

/** Effect-relation conflict/relation helper. (`Fs`) */
export class EffectRelationHelper {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  /** Whether any of `type`'s conflicting effects are present in `set`. (`_d`) */
  _d(set: Set<any>, type: any): boolean {
    const list = this.data.th.get(type);
    if (!list?.length) return false;
    for (let i = 0; i < list.length; i++) if (set.has(list[i])) return true;
    return false;
  }

  /** Effects that `type` suppresses. (`xd`) */
  xd(type: any): any[] {
    return this.data.sh.get(type) ?? [];
  }

  /** For each effect `type` suppresses that is present in `set`, run `cb`. (`Sd`) */
  Sd(set: Set<any>, type: any, cb: (effect: any) => void): void {
    const list = this.xd(type);
    for (let i = 0; i < list.length; i++) if (set.has(list[i])) cb(list[i]);
  }
}

/** Resolve the entity a buff targets across enemy + unit registries. (`Ji`) */
export function resolveBuffTarget(id: number): any {
  let target = EnemySpatialMgr.instance().kw.get(id);
  if (!target) {
    const reg = EntityRegistry.instance();
    target = reg.hS.get(id);
    if (!target) {
      target = reg.Qk.get(id);
      if (!target) target = reg.eS.get(id);
    }
  }
  return target;
}
