// PlacementValidator — the prop-placement rules engine (the bundle's `sn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~25332-25631. Given a prop and a target cell `{containerType,x,y}`, `validate`
// runs an ordered chain of predicate rules derived from the prop's config flags
// (rk/Qv/Zv/i_/s_/OU/Mk/YU/XU/jk/$k/kk/Pk/_k) plus the prop's own `Jv` check.
// The rule list + the flattened flag snapshot are cached by a flag-key string so
// repeated validations of identical configs skip rebuilding. Opaque method /
// flag names kept verbatim — they are config keys, not behaviour.
//
//   snapshot=UU  rulesFor=FU  flagKey=GU  buildRules=HU  reachableCells=eF

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BoardMgr } from "./board-mgr";
import { GameMgr } from "../core/game-mgr";
import { EntityRegistry } from "./entity-registry";
import { BuffMgr } from "./buff-mgr";
import { Soldier } from "./soldier";
import { BaseSoldier } from "./base-soldier";
import { GeneralPart } from "./general-part";
import { Farmer } from "./farmer";
import { BowSoldier } from "./soldier-types";
import { BowWeaponBase } from "./weapon-bow";

const Ws = Soldier;
const zs = BaseSoldier;
const gi = GeneralPart;
const ki = Farmer;
const ci = BowSoldier;
const Le = BowWeaponBase;

type Result = { valid: boolean; reason?: string };

export class PlacementValidator {
  private TU = new Map<string, Array<(t: any, s: any) => Result>>();
  private RU = new WeakMap<any, any>();
  private CU: any;
  private dg: any;

  constructor(t: any, s: any) {
    this.CU = t;
    this.dg = s;
  }

  validate(t: any, s: any): Result {
    const i = this.UU(t);
    const h = this.FU(i);
    for (const rule of h) {
      const r = rule(i, s);
      if (!r.valid) return r;
    }
    return t.Jv(s, this.CU)
      ? { valid: true }
      : { valid: false, reason: "道具自定义检查失败" };
  }

  UU(t: any): any {
    if (this.RU.has(t)) return this.RU.get(t);
    const s = {
      rk: t.rk,
      Qv: t.Qv,
      Zv: t.Zv,
      qd: t.qd,
      i_: t.i_,
      s_: t.s_,
      OU: t.OU,
      Mk: t.Mk,
      YU: t.YU,
      XU: t.XU,
      jk: t.jk,
      $k: t.$k,
      kk: t.kk,
      Pk: t.Pk,
      _k: t._k,
    };
    this.RU.set(t, s);
    return s;
  }

  FU(t: any): Array<(t: any, s: any) => Result> {
    const s = this.GU(t);
    if (this.TU.has(s)) return this.TU.get(s)!;
    const i = this.HU(t);
    this.TU.set(s, i);
    return i;
  }

  GU(t: any): string {
    return [
      t.rk,
      t.Qv,
      t.Zv ? "1" : "0",
      t.i_ ? "1" : "0",
      t.s_ ? "1" : "0",
      t.OU ?? "-",
      t.Mk ?? "-",
      t.YU ? "1" : "0",
      t.XU ? "1" : "0",
      t.jk ? "1" : "0",
      t.$k ?? "-",
      t.kk ?? "-",
      t.Pk ? "1" : "0",
      t._k ? "1" : "0",
    ].join("_");
  }

  HU(_t: any): Array<(t: any, s: any) => Result> {
    const s: Array<(t: any, s: any) => Result> = [];
    s.push((t, x) => this.WU(t, x));
    s.push((t, x) => this.zU(t, x));
    s.push((t, x) => this.jU(t, x));
    s.push((t, x) => this.$U(t, x));
    s.push((t, x) => this.NU(t, x));
    s.push((t, x) => this.qU(t, x));
    s.push((t, x) => this.VU(t, x));
    s.push((t, x) => this.QU(t, x));
    s.push((t, x) => this.ZU(t, x));
    s.push((t, x) => this.KU(t, x));
    s.push((t, x) => this.JU(t, x));
    s.push((t, x) => this.tF(t, x));
    return s;
  }

  clearCache(): void {
    this.TU.clear();
  }

  WU(t: any, s: any): Result {
    const { containerType: i } = s;
    if (t.rk === 0) return { valid: true };
    return i === 2 || i === 1
      ? { valid: true }
      : i === 3
        ? this.sF(t, s)
        : { valid: false, reason: "非战斗地图区域且不符合刷新栏使用条件" };
  }

  sF(t: any, s: any): Result {
    if (t.Zv) return { valid: true };
    if (t.rk === 3) {
      const i = this.CU.Mv(3, t.qd).getItem(s.x, s.y);
      return i && i instanceof Ws
        ? { valid: true }
        : { valid: false, reason: "刷新栏上没有文字" };
    }
    return { valid: false, reason: "不允许在刷新栏使用" };
  }

  zU(t: any, s: any): Result {
    if (t.rk === 0) return { valid: true };
    const i = this.dg.map.ue;
    const h = s.containerType === 2 || s.containerType === 1;
    const e = h ? i[s.x][s.y] : "REFRESH_BOX_AREA";
    const a = !h || e.endsWith("0");
    const n = this.iF(t, a);
    if (!n.valid) return n;
    const r = this.CU.Mv(s.containerType, a);
    return this.hF(t, s, e, r);
  }

  iF(t: any, s: boolean): Result {
    const i = t.Qv === 0 || t.Qv === 2;
    const h = t.Qv === 1 || t.Qv === 2;
    const e = (i && t.qd) || (h && !t.qd);
    const a = (i && !t.qd) || (h && t.qd);
    return (s && !e) || (!s && !a)
      ? { valid: false, reason: "阵营不匹配" }
      : { valid: true };
  }

  hF(t: any, s: any, i: string, h: any): Result {
    switch (t.rk) {
      case 1:
        if (!i.startsWith("2")) return { valid: false, reason: "不是可扩展格子" };
        break;
      case 2:
        if (!i.startsWith("1")) return { valid: false, reason: "不是普通格子" };
        break;
      case 4:
      default:
        break;
      case 3: {
        const e = h.getItem(s.x, s.y);
        if (!(e && e instanceof Ws)) return { valid: false, reason: "格子上没有单位" };
        break;
      }
      case 5:
        if (!i.startsWith("0")) return { valid: false, reason: "不是道路格子" };
    }
    return { valid: true };
  }

  eF(t: any): Array<{ x: number; y: number; containerType: number }> {
    const s: Array<{ x: number; y: number; containerType: number }> = [];
    const i = this.dg.map.ue;
    if (t.rk === 0) return s;
    for (let h = 0; h < i.length; h++)
      for (let e = 0; e < i[h].length; e++) {
        if (this.validate(t, { containerType: 2, x: h, y: e }).valid)
          s.push({ x: h, y: e, containerType: 2 });
        if (this.validate(t, { containerType: 1, x: h, y: e }).valid)
          s.push({ x: h, y: e, containerType: 1 });
      }
    return s;
  }

  jU(t: any, s: any): Result {
    if (!t._k) return { valid: true };
    const i = this.aF(t, s);
    return i && i instanceof ki
      ? { valid: false, reason: "不能对农民使用" }
      : { valid: true };
  }

  $U(t: any, s: any): Result {
    if (!t.s_) return { valid: true };
    const i = this.dg.map;
    const { x: h, y: e } = s;
    return (h === i.te.x && e === i.te.y) ||
      (h === i.he.x && e === i.he.y) ||
      (h === i.ie.x && e === i.ie.y) ||
      (h === i.ae.x && e === i.ae.y)
      ? { valid: false, reason: "不能在出入口位置使用" }
      : { valid: true };
  }

  NU(t: any, s: any): Result {
    if (!t.i_) return { valid: true };
    const i = this.dg.map.ue;
    const h = s.containerType === 2 || s.containerType === 1;
    const e = h ? i[s.x][s.y] : "REFRESH_BOX_AREA";
    const a = !h || e.endsWith("0");
    return this.CU.Mv(2, a).getItem(s.x, s.y) !== null
      ? { valid: false, reason: "格子不为空" }
      : { valid: true };
  }

  VU(t: any, s: any): Result {
    if (!t.YU) return { valid: true };
    const i = this.aF(t, s);
    return i
      ? i instanceof zs
        ? { valid: true }
        : { valid: false, reason: "只能对士兵使用" }
      : { valid: false, reason: "目标位置没有单位" };
  }

  QU(t: any, s: any): Result {
    if (!t.XU) return { valid: true };
    const i = this.aF(t, s);
    return i
      ? !(i instanceof gi) || (i instanceof gi && i.Zw === -1)
        ? { valid: false, reason: "只能对武将使用" }
        : { valid: true }
      : { valid: false, reason: "目标位置没有单位" };
  }

  JU(t: any, s: any): Result {
    if (t.kk !== false) return { valid: true };
    const i = this.aF(t, s);
    return i && i instanceof gi && i.jd
      ? { valid: false, reason: "武将技能施放中，不能使用" }
      : { valid: true };
  }

  aF(t: any, s: any): any {
    const i = this.dg.map.ue;
    const h = s.containerType === 2 || s.containerType === 1;
    const e = h ? i[s.x][s.y] : "REFRESH_BOX_AREA";
    const a = !h || e.endsWith("0");
    return this.CU.Mv(s.containerType, a).getItem(s.x, s.y);
  }

  qU(t: any, s: any): Result {
    if (t.OU === undefined && t.Mk === undefined) return { valid: true };
    const i = this.aF(t, s);
    if (!i) return { valid: false, reason: "目标位置没有单位" };
    let h: number;
    if (i instanceof zs) h = i.level;
    else {
      if (!(i instanceof gi)) return { valid: true };
      if (i.Zw !== -1) {
        const e = EntityRegistry.instance().Qk.get(i.Zw);
        h = e ? e.level : 0;
      } else h = i.level;
    }
    return t.OU !== undefined && h < t.OU
      ? { valid: false, reason: `等级不足，需要至少${t.OU}级` }
      : t.Mk !== undefined && h > t.Mk
        ? { valid: false, reason: `等级过高，需要最多${t.Mk}级` }
        : { valid: true };
  }

  ZU(t: any, s: any): Result {
    if (!t.jk) return { valid: true };
    const i = this.aF(t, s);
    if (!i) return { valid: false, reason: "目标位置没有单位" };
    let h = false;
    if (i instanceof ci) h = true;
    else if (i instanceof gi && i.Zw !== -1) {
      const e = EntityRegistry.instance().Qk.get(i.Zw);
      if (e && e.QE && e.QE instanceof Le) h = true;
    }
    return h ? { valid: true } : { valid: false, reason: "只能对远程单位使用" };
  }

  KU(t: any, s: any): Result {
    if (t.$k === undefined) return { valid: true };
    const i = this.aF(t, s);
    if (!i) return { valid: true };
    let h: number;
    if (i instanceof zs) h = i.id;
    else {
      if (!(i instanceof gi && i.Zw !== -1)) return { valid: true };
      h = i.Zw;
    }
    return BuffMgr.instance().qS(h, t.$k)
      ? t.$k === 2
        ? { valid: false, reason: "该单位已经是百步穿杨了！" }
        : { valid: false, reason: "该单位已有此效果" }
      : { valid: true };
  }

  tF(t: any, s: any): Result {
    if (!t.Pk) return { valid: true };
    const i = this.aF(t, s);
    if (!i) return { valid: false, reason: "目标位置没有单位" };
    let h: number;
    let e: number;
    if (i instanceof zs) {
      h = i.level;
      e = 5;
    } else {
      if (!(i instanceof gi)) return { valid: true };
      if (i.Zw !== -1) {
        const a = EntityRegistry.instance().Qk.get(i.Zw);
        if (!a) return { valid: true };
        h = a.level;
        e = a.maxLevel;
      } else {
        h = i.level;
        e = this.nF(i);
      }
    }
    return h >= e
      ? { valid: false, reason: `该单位已达到满级（${e}级），无法使用` }
      : { valid: true };
  }

  nF(t: any): number {
    const s = this.dg;
    const i = t.Qd;
    let h = 3;
    for (let k = 0; k < s.generals.generalNames.length; k++) {
      if (s.generals.generalNames[k].indexOf(i) !== -1) {
        const e = s.generals.generalAttackConfig(k).Ya ? 5 : 3;
        h = Math.max(h, e);
      }
    }
    return h;
  }
}

/** Alias. (`sn`) */
export const sn = PlacementValidator;
