// EntityRegistry — registry of every player-side battle unit (the bundle's `Ki`).
//
// Faithful reconstruction of the bundle's `Ki` (reconstruction/reference/
// bundle.pretty.js lines ~14136-14700). Holds the live soldiers (`hS`), props
// (`eS`), farmers (`aS`) and generals (`Qk`), plus the merged-general member
// lists (`nS`). Answers position / range / level queries and drives area group
// buffs over the unit set.
//
// NOTE: the spawn / merge / removal half of `Ki` (C_/LS/mS/wS/vS/kS/xS/SS/AS/
// ES/BS/Lx/gx/uk/IS/DS/bS/pS/fS/$S/gS/YS/Kk and the spawn-related event
// handlers) instantiates the concrete entity classes — GeneralPart (`gi`),
// Farmer (`ki`), the soldier-class registry (`di`), the general-merge factory
// (`$a`), the board-container mgr (`wi`) and the battle-props mgr (`Zi`) — which
// are ported alongside those classes. This file currently provides the registry
// data layer + the map-only queries that the buff system and spatial manager
// depend on; the spawn logic is layered on once the entity classes exist.
//
//   soldiers=hS  props=eS  farmers=aS  generals=Qk  mergeMembers=nS  groupBuffs=rS

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { MathE } from "../core/math-e";
import { EffectMgr } from "./effect-mgr";
import { BuffMgr } from "./buff-mgr";
import { BoardMgr } from "./board-mgr";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const f = MathE;
const q = EffectMgr;
const th = BuffMgr;
const wi = BoardMgr;

export class EntityRegistry extends Singleton {
  private ma: any[] = [];
  /** id → soldier. (`hS`) */
  hS = new Map<number, any>();
  /** id → prop unit. (`eS`) */
  eS = new Map<number, any>();
  /** id → general. (`Qk`) */
  Qk = new Map<number, any>();
  /** id → farmer. (`aS`) */
  aS = new Map<number, any>();
  /** merged-general id → member soldier ids. (`nS`) */
  nS = new Map<number, number[]>();
  private rS: any[] = [];
  private jS: any;

  init(): void {
    this.addEvent();
  }

  startGame(): void {}

  addEvent(): void {
    y.instance.on(u.m, this, this.oS);
    y.instance.on(u._, this, this.lS);
    y.instance.on(u.j, this, this.cS);
    y.instance.on(u.q, this, this.pS);
    y.instance.on(u.st, this, this.SL);
    y.instance.on(u.it, this, this.bL);
    y.instance.on(u.ts, this, this.gS);
    y.instance.on(u.ns, this, this.dS);
  }

  // --- registry mutation (general add/remove) -------------------------------

  /** Register a general. (`oS`) */
  oS(t: number, s: any): void {
    this.Qk.set(t, s);
  }

  /** Unregister a general. (`lS`) */
  lS(t: number): void {
    this.Qk.delete(t);
  }

  /** Disband the merged-general that member `t` belongs to. (`cS`) */
  cS(t: number): void {
    for (const s of this.nS.entries())
      for (let i = 0; i < s[1].length; i++)
        if (s[1][i] === t) {
          const general = this.Qk.get(s[0]);
          for (let k = 0; k < general.va.length; k++) {
            const part = general.va[k];
            part.changeState("GeneralPartWait");
            part.Zw = -1;
            part.jd = false;
          }
          general.gameOver();
          this.nS.delete(s[0]);
          return;
        }
  }

  /** The merged-general id that contains member `t`, else -1. (`uS`) */
  uS(t: number): number {
    for (const s of this.nS) for (let i = 0; i < s[1].length; i++) if (t === s[1][i]) return s[0];
    return -1;
  }

  /** Level-up a general + its members. (`yS`) */
  yS(t: number, s: number[], i = false): void {
    if (!i && this.Qk.has(t)) this.Qk.get(t).RS(1);
    const h = (i ? 0.2 : 0.5) / s.length;
    for (let k = 0; k < s.length; k++) if (this.Qk.has(s[k])) this.Qk.get(s[k]).RS(h);
  }

  /** Forward a "selected" pulse to the unit. (`SL`) */
  SL(t: number): void {
    let s = this.Qk.get(this.uS(t));
    if (!s) s = this.hS.get(t);
    if (s) s.SL();
  }

  /** Hide the unit-info tooltip. (`bL`) */
  bL(): void {
    q.instance().toggleTargetCircle(false);
  }

  // --- queries --------------------------------------------------------------

  /** Whether a general of type `t` on side `s` exists. (`US`) */
  US(t: any, s: any): boolean {
    for (const i of this.Qk) if (t === i[1].type && s === i[1].qd) return true;
    return false;
  }

  /** Other members of `t`'s merge recipe. (`OS`) */
  OS(t: any): any[] {
    const s = F.instance().generals.mergeRecipes;
    const i: any[] = [];
    for (let h = 0; h < s.length; h++)
      for (let e = 0; e < s[h].length; e++)
        if (t === s[h][e]) {
          for (let e2 = 0; e2 < s[h].length; e2++) if (t !== s[h][e2]) i.push(s[h][e2]);
          break;
        }
    for (let a = 0; a < i.length; a++)
      for (let b = a + 1; b < i.length; b++) if (i[b] === i[a]) (i.splice(b, 1), b--);
    return i;
  }

  /** A general whose member `t` matches, if `s` shares its formation slot. (`YS`) */
  YS(t: any, s: any): any {
    const i = this.Qk.get(this.uS(s.id));
    if (!i) return null;
    for (let k = 0; k < i.va.length; k++) if (i.va[k].id === t.id) return null;
    const h = i.va;
    for (let k = 0; k < h.length; k++) if (t.Qd === h[k].Qd) return i;
    return null;
  }

  /** Generals on side `h` overlapping a circle. (`XS`) */
  XS(t: number, s: number, i: number, h: any): any[] {
    const e: any[] = [];
    this.Qk.forEach((a, n) => {
      const r = a.general;
      if (a.qd === h && f.circleRectOverlap(i, t, s, r.x, r.y, r.width, r.height)) e.push({ id: n, x: r.x, y: r.y });
    });
    return e;
  }

  /** Soldiers on side `h` overlapping a circle. (`GS`) */
  GS(t: number, s: number, i: number, h: any): any[] {
    const e: any[] = [];
    this.hS.forEach((a, n) => {
      const r = a.Yn;
      if (a.qd === h && f.circleRectOverlap(i, t, s, r.x, r.y, r.width, r.height)) e.push({ id: n, x: r.x, y: r.y });
    });
    return e;
  }

  /** Props on side `h` overlapping a circle. (`HS`) */
  HS(t: number, s: number, i: number, h: any): any[] {
    const e: any[] = [];
    this.eS.forEach((a, n) => {
      const r = a.Yn;
      if (a.qd === h && f.circleRectOverlap(i, t, s, r.x, r.y, r.width, r.height)) e.push({ id: n, x: r.x, y: r.y });
    });
    return e;
  }

  /** Soldiers + generals overlapping a circle. (`t_`) */
  t_(t: number, s: number, i: number, h: any): any[] {
    return ([] as any[]).concat(this.GS(t, s, i, h), this.XS(t, s, i, h));
  }

  /** Look up a soldier / prop / farmer by id. (`Dk`) */
  Dk(t: number): any {
    let s = this.hS.get(t);
    if (!s) s = this.eS.get(t);
    if (!s) s = this.aS.get(t);
    return s;
  }

  /** Look up a general by id. (`WS`) */
  WS(t: number): any {
    return this.Qk.get(t);
  }

  /** Grid cell of a general member, mapped back to head-cell coords. (`zS`) */
  zS(t: number, s: number): { x: number; y: number } {
    for (const i of this.Qk) {
      const h = i[1].general.x;
      const e = i[1].general.y;
      for (const a of i[1].va)
        if (
          (h + a.Yn.x) / F.instance().map.gridWid === t &&
          (e + a.Yn.y) / F.instance().map.gridHei === s
        )
          return { x: h / F.instance().map.gridWid + 0.5, y: e / F.instance().map.gridHei };
    }
    return { x: -1, y: -1 };
  }

  /** Highest-level, un-locked soldier on side `t`. (`NS`) */
  NS(t: any): { id: number; Xe: number } | null {
    let s: any;
    for (const i of this.hS)
      if (t === i[1].qd && i[1].Td === 1 && !th.instance().qS(i[1].id, 16)) {
        if (s) {
          if (i[1].level > s.level) s = i[1];
        } else s = i[1];
      }
    return s ? { id: s.id, Xe: s.level } : null;
  }

  /** Lowest-level soldiers on side `t`. (`QS`) */
  QS(t: any): any[] {
    const s: any[] = [];
    let i = 5;
    for (const h of this.hS)
      if (t === h[1].qd && h[1].Td === 1 && h[1].level <= i) {
        if (h[1].level < i) {
          s.length = 0;
          i = h[1].level;
        }
        s.push({ id: h[1].id, type: h[1].type, Xe: h[1].level, x: h[1].Yn.x, y: h[1].Yn.y });
      }
    return s;
  }

  /** Whether side `t` occupies board cell (s,i). (`ZS`) */
  ZS(t: any, s: number, i: number): boolean {
    for (const h of this.hS) if (h[1].qd === t && h[1].Td === 1 && h[1].Cd.x === s && h[1].Cd.y === i) return true;
    for (const h of this.eS) if (h[1].qd === t && h[1].Td === 1 && h[1].Cd.x === s && h[1].Cd.y === i) return true;
    for (const h of this.aS) if (h[1].qd === t && h[1].Td === 1 && h[1].Cd.x === s && h[1].Cd.y === i) return true;
    return false;
  }

  /** Queue an "intrinsic" buff onto a unit (or all members of a general). (`Kk`) */
  Kk(t: number, s: any, i: any, h: number, e: any): void {
    const a = this.hS.get(t);
    const n = this.Qk.get(t);
    if (a || n) {
      if (n) for (let k = 0; k < n.va.length; k++) n.va[k].Xd.push({ type: s, Lg: i, num: h, CS: e });
      else a.Xd.push({ type: s, Lg: i, num: h, CS: e });
    }
  }

  /** Attach text buffs to a soldier / prop. (`_S`) */
  _S(t: number, s: any[]): void {
    let i = this.hS.get(t);
    let h = false;
    if (!i) {
      i = this.eS.get(t);
      h = true;
    }
    if (!i) {
      console.error("没有找到文字", t);
      return;
    }
    const e = i.Xd.find((x: any) => x.type === 0);
    i.Xd = i.Xd.concat(s);
    if (!h)
      for (let k = 0; k < s.length; k++)
        if (!(e && s[k].type === 0)) th.instance().applyBuff(i.id, s[k].Lg, s[k].num, s[k].CS);
  }

  // --- area group buffs over the unit set -----------------------------------

  /** Register + apply an area group buff to all side-`s` units. (`F_`) */
  F_(t: any, s: any, i: any, h: number, e: any, a: number): void {
    const n: any = { sign: t, qd: s, Lg: i, num: h, CS: e, time: a, map: new Map() };
    this.rS.push(n);
    for (const x of this.hS) {
      if (x[1].qd !== s) continue;
      n.map.set(x[1].id, th.instance().applyBuff(x[1].id, i, h, e, a));
    }
    for (const x of this.Qk) {
      if (x[1].qd !== s) continue;
      n.map.set(x[1].id, th.instance().applyBuff(x[1].id, i, h, e, a));
    }
  }

  /** Remove a registered area group buff. (`O_`) */
  O_(t: any): void {
    const s = this.rS.findIndex((x) => x.sign === t);
    if (s < 0) return;
    const i = this.rS[s];
    for (const x of i.map) if (x[1] >= 0) th.instance().kg(x[0], i.Lg, x[1]);
    this.rS.splice(s, 1);
  }

  /** Drop the "rain" group buffs from a unit. (`dS`) */
  dS(t: number): void {
    for (let s = 0; s < this.rS.length; s++) {
      const i = this.rS[s];
      if (!i.sign.startsWith("rain")) continue;
      const h = i.map.get(t);
      if (h === undefined || h < 0) continue;
      th.instance().kg(t, i.Lg, h);
      i.map.delete(t);
    }
  }

  /** Re-apply active area group buffs to a fresh unit. (`MS`) */
  MS(t: any): void {
    for (let s = 0; s < this.rS.length; s++) {
      if (t.qd !== this.rS[s].qd) continue;
      const i = th
        .instance()
        .applyBuff(t.id, this.rS[s].Lg, this.rS[s].num, this.rS[s].CS, this.rS[s].time);
      this.rS[s].map.set(t.id, i);
    }
  }

  /** Remove a soldier by id (clears its board cell). (`Lx`) */
  Lx(t: number): void {
    const s = this.hS.get(t);
    if (!s) return;
    const i = wi.instance().Mv(s.Td, s.qd);
    if (i) i.removeItem(s.Cd.x, s.Cd.y);
    s.gameOver();
    this.hS.delete(t);
  }
  /** Remove a prop unit by id. (`gx`) */
  gx(t: number): void {
    const s = this.eS.get(t);
    if (!s) return;
    const i = wi.instance().Mv(s.Td, s.qd);
    if (i) i.removeItem(s.Cd.x, s.Cd.y);
    s.gameOver();
    this.eS.delete(t);
  }
  /** Remove a farmer by id. (`uk`) */
  uk(t: number): void {
    const s = this.aS.get(t);
    if (!s) return;
    const i = wi.instance().Mv(s.Td, s.qd);
    if (i) i.removeItem(s.Cd.x, s.Cd.y);
    s.gameOver();
    this.aS.delete(t);
  }

  // --- spawn / merge (pending the remaining entity classes; see note above) -
  // C_/LS/mS/wS/vS/kS/xS/SS/AS/ES/BS/IS/DS/bS/pS/fS/$S/gS/YS are ported
  // alongside the soldier registry (di), the merge factory ($a) and battle-props (Zi).
  pS(_t: number, _s: number, _i = true): void {}
  gS(_t: any): void {}
}
