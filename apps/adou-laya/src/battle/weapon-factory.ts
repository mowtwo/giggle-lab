// WeaponFactory (de) + WeaponMgr (ma).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~19692-19760 (de) and ~23228-23255 (ma). WeaponFactory is a static registry
// of weapon-component creators keyed by (type, weaponId); concrete weapon
// components register themselves. WeaponMgr produces/tracks/recovers the active
// weapon components attached to generals.
//
//   registry=zI register/produce/recover/listWeapons(jI)
//   WeaponMgr: active=wR  produce=vR  list=kR  remove=_R

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";

export class WeaponFactory {
  static zI = new Map<number, Map<number, () => any>>();

  static register(type: number, weaponId: number, ctor: any): void {
    if (!this.zI.has(type)) this.zI.set(type, new Map());
    const factory = typeof ctor === "function" && ctor.prototype ? () => new ctor() : ctor;
    this.zI.get(type)!.set(weaponId, factory);
  }

  static produce(type: number, weaponId: number): any {
    let comp: any;
    let resolvedId = weaponId;
    const byId = this.zI.get(type);
    if (byId && byId.size > 0) {
      let factory = byId.get(weaponId);
      if (!factory) {
        console.warn(`[WeaponFactory] 武器类型: ${type} 索引: ${weaponId} 未找到, 返回第一个武器`);
        if (byId.has(-1)) {
          factory = byId.get(-1);
          resolvedId = -1;
        } else {
          const firstKey = byId.keys().next().value as number;
          factory = byId.get(firstKey);
          resolvedId = firstKey;
        }
      }
      comp = factory!();
    } else {
      console.warn(`[WeaponFactory] 武器类型: ${type} 未找到, 返回默认武器`);
      resolvedId = -1;
      const def = this.zI.get(0)?.get(-1);
      if (!def) throw new Error(`[WeaponFactory] 武器类型: ${type} 未注册任何创建器，且没有默认武器`);
      comp = def();
    }
    comp.init(resolvedId, type);
    return comp;
  }

  static recover(comp: any): void {
    Laya.Pool.recoverByClass(comp);
  }

  /** List {weaponId, weaponName} for a weapon type. (`jI`) */
  static jI(type: number): Array<{ weaponId: number; weaponName: string }> {
    const byId = this.zI.get(type);
    const out: Array<{ weaponId: number; weaponName: string }> = [];
    if (byId) {
      byId.forEach((factory, weaponId) => {
        let name = "未知武器";
        try {
          const inst = factory();
          if (inst.constructor && inst.constructor.weaponName) name = inst.constructor.weaponName;
          this.recover(inst);
        } catch {
          /* ignore */
        }
        out.push({ weaponId, weaponName: name });
      });
    }
    return out;
  }
}

export class WeaponMgr extends Singleton {
  private ids = 0;
  private wR!: Map<number, any>;

  init(): void {
    this.wR = new Map();
  }

  /** Produce + register an active weapon component. (`vR`) */
  vR(type: number, weaponId: number): any {
    const comp = WeaponFactory.produce(type, weaponId);
    comp.id = (this.ids += 1);
    comp.iD();
    comp.Hn.zIndex = 1;
    this.wR.set(comp.id, comp);
    return comp;
  }

  kR(type: number): any {
    return WeaponFactory.jI(type);
  }

  /** Remove + recover a weapon component. (`_R`) */
  _R(comp: any): void {
    this.wR.delete(comp.id);
    comp.gameOver();
    WeaponFactory.recover(comp);
  }

  gameOver(): void {
    for (const comp of this.wR.values()) comp.gameOver();
    this.wR.clear();
  }
}
