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
// (`$a`), the board-container mgr (`BoardMgr`) and the battle-props mgr (`BattlePropsMgr`) — which
// are ported alongside those classes. This file currently provides the registry
// data layer + the map-only queries that the buff system and spatial manager
// depend on; the spawn logic is layered on once the entity classes exist.
//
//   soldiers=hS  props=eS  farmers=aS  generals=Qk  mergeMembers=nS  groupBuffs=rS

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { BattlePropsMgr } from "./battle-props-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { MathE } from "../core/math-e";
import { EffectMgr } from "./effect-mgr";
import { BuffMgr } from "./buff-mgr";
import { BoardMgr } from "./board-mgr";
import { PoolFactory } from "./pool-factory";
import { di } from "./soldier-types";
import { GeneralMergeFactory } from "./general-merge-factory";
import { BaseSoldier } from "./base-soldier";
import { GeneralPart } from "./general-part";
import { Farmer } from "./farmer";

const u = GameEvent;
const $a = GeneralMergeFactory;
const zs = BaseSoldier;
const gi = GeneralPart;
const ki = Farmer;

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
    EventMgr.instance.on(u.m, this, this.oS);
    EventMgr.instance.on(u._, this, this.lS);
    EventMgr.instance.on(u.j, this, this.cS);
    EventMgr.instance.on(u.q, this, this.pS);
    EventMgr.instance.on(u.st, this, this.SL);
    EventMgr.instance.on(u.it, this, this.bL);
    EventMgr.instance.on(u.ts, this, this.gS);
    EventMgr.instance.on(u.ns, this, this.dS);
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
    EffectMgr.instance().toggleTargetCircle(false);
  }

  // --- queries --------------------------------------------------------------

  /** Whether a general of type `t` on side `s` exists. (`US`) */
  US(t: any, s: any): boolean {
    for (const i of this.Qk) if (t === i[1].type && s === i[1].qd) return true;
    return false;
  }

  /** Other members of `t`'s merge recipe. (`OS`) */
  OS(t: any): any[] {
    const s = GameMgr.instance().generals.mergeRecipes;
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
      if (a.qd === h && MathE.circleRectOverlap(i, t, s, r.x, r.y, r.width, r.height)) e.push({ id: n, x: r.x, y: r.y });
    });
    return e;
  }

  /** Soldiers on side `h` overlapping a circle. (`GS`) */
  GS(t: number, s: number, i: number, h: any): any[] {
    const e: any[] = [];
    this.hS.forEach((a, n) => {
      const r = a.Yn;
      if (a.qd === h && MathE.circleRectOverlap(i, t, s, r.x, r.y, r.width, r.height)) e.push({ id: n, x: r.x, y: r.y });
    });
    return e;
  }

  /** Props on side `h` overlapping a circle. (`HS`) */
  HS(t: number, s: number, i: number, h: any): any[] {
    const e: any[] = [];
    this.eS.forEach((a, n) => {
      const r = a.Yn;
      if (a.qd === h && MathE.circleRectOverlap(i, t, s, r.x, r.y, r.width, r.height)) e.push({ id: n, x: r.x, y: r.y });
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
          (h + a.Yn.x) / GameMgr.instance().map.gridWid === t &&
          (e + a.Yn.y) / GameMgr.instance().map.gridHei === s
        )
          return { x: h / GameMgr.instance().map.gridWid + 0.5, y: e / GameMgr.instance().map.gridHei };
    }
    return { x: -1, y: -1 };
  }

  /** Highest-level, un-locked soldier on side `t`. (`NS`) */
  NS(t: any): { id: number; Xe: number } | null {
    let s: any;
    for (const i of this.hS)
      if (t === i[1].qd && i[1].Td === 1 && !BuffMgr.instance().qS(i[1].id, 16)) {
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
        if (!(e && s[k].type === 0)) BuffMgr.instance().applyBuff(i.id, s[k].Lg, s[k].num, s[k].CS);
  }

  // --- area group buffs over the unit set -----------------------------------

  /** Register + apply an area group buff to all side-`s` units. (`F_`) */
  F_(t: any, s: any, i: any, h: number, e: any, a: number): void {
    const n: any = { sign: t, qd: s, Lg: i, num: h, CS: e, time: a, map: new Map() };
    this.rS.push(n);
    for (const x of this.hS) {
      if (x[1].qd !== s) continue;
      n.map.set(x[1].id, BuffMgr.instance().applyBuff(x[1].id, i, h, e, a));
    }
    for (const x of this.Qk) {
      if (x[1].qd !== s) continue;
      n.map.set(x[1].id, BuffMgr.instance().applyBuff(x[1].id, i, h, e, a));
    }
  }

  /** Remove a registered area group buff. (`O_`) */
  O_(t: any): void {
    const s = this.rS.findIndex((x) => x.sign === t);
    if (s < 0) return;
    const i = this.rS[s];
    for (const x of i.map) if (x[1] >= 0) BuffMgr.instance().kg(x[0], i.Lg, x[1]);
    this.rS.splice(s, 1);
  }

  /** Drop the "rain" group buffs from a unit. (`dS`) */
  dS(t: number): void {
    for (let s = 0; s < this.rS.length; s++) {
      const i = this.rS[s];
      if (!i.sign.startsWith("rain")) continue;
      const h = i.map.get(t);
      if (h === undefined || h < 0) continue;
      BuffMgr.instance().kg(t, i.Lg, h);
      i.map.delete(t);
    }
  }

  /** Re-apply active area group buffs to a fresh unit. (`MS`) */
  MS(t: any): void {
    for (let s = 0; s < this.rS.length; s++) {
      if (t.qd !== this.rS[s].qd) continue;
      const i = BuffMgr
        .instance()
        .applyBuff(t.id, this.rS[s].Lg, this.rS[s].num, this.rS[s].CS, this.rS[s].time);
      this.rS[s].map.set(t.id, i);
    }
  }

  /** Remove a soldier by id (clears its board cell). (`Lx`) */
  Lx(t: number): void {
    const s = this.hS.get(t);
    if (!s) return;
    const i = BoardMgr.instance().Mv(s.Td, s.qd);
    if (i) i.removeItem(s.Cd.x, s.Cd.y);
    s.gameOver();
    this.hS.delete(t);
  }
  /** Remove a prop unit by id. (`gx`) */
  gx(t: number): void {
    const s = this.eS.get(t);
    if (!s) return;
    const i = BoardMgr.instance().Mv(s.Td, s.qd);
    if (i) i.removeItem(s.Cd.x, s.Cd.y);
    s.gameOver();
    this.eS.delete(t);
  }
  /** Remove a farmer by id. (`uk`) */
  uk(t: number): void {
    const s = this.aS.get(t);
    if (!s) return;
    const i = BoardMgr.instance().Mv(s.Td, s.qd);
    if (i) i.removeItem(s.Cd.x, s.Cd.y);
    s.gameOver();
    this.aS.delete(t);
  }

  // --- spawn / merge / level ------------------------------------------------

  /** Build a spawn request + create the unit. (`C_`) */
  C_(t: number, s: string, i: any, h: number, e = 0, a = 1, n: any = null): any {
    return this.LS({ containerType: t, text: s, qd: i, x: h, y: e, Xe: a, Xd: n });
  }

  /** Create + register a unit from a spawn request. (`LS`) */
  LS(t: any): any {
    if (GameMgr.instance().battleState.Vi) return null;
    const { containerType: s, text: i, qd: h, x: e, y: a, Xe: n = 1, Xd: r } = t;
    const o = this.mS(i);
    const l = this.wS(o, i);
    this.vS(l, s, i, h, e, a);
    this.kS(l, o);
    if (r) this._S(l.id, r);
    this.xS(l, s, h, e, a);
    this.SS(l, s, h, e, a, o);
    let c = n;
    if (o === "Soldier" && s === 3 && n === 1) c = this.bS(h, n);
    if (c > 1) l.cL(c - l.level, false);
    this.MS(l);
    return l;
  }

  /** Shovel-prop (22) chance to spawn a soldier at level 2 instead. (`bS`) */
  bS(t: any, s: number): number {
    if (t) {
      if (!BattlePropsMgr.instance().iS(t, 22)) return s;
      const i = BattlePropsMgr.instance().Nx(22);
      const h = 0.01 * GameMgr.instance().props.Ue[22].Ge[i - 1];
      if (h > 0 && MathE.rand() < h) return 2;
    } else {
      for (const [, p] of BattlePropsMgr.instance().kx)
        if (p.type === 22 && !p.qd) {
          const lv = p.level || 1;
          const i = 0.01 * GameMgr.instance().props.Ue[22].Ge[lv - 1];
          if (i > 0 && MathE.rand() < i) return 2;
          break;
        }
    }
    return s;
  }

  /** Map a unit's display text to its kind. (`mS`) */
  mS(t: string): string {
    if (t === "农") return "Farmer";
    const s = GameMgr.instance().generals;
    return s.soldierTypes.indexOf(t) !== -1 ? "Soldier" : s.nameChars.indexOf(t) !== -1 ? "GeneralPart" : "Soldier";
  }

  /** Pool-produce the right entity for a kind. (`wS`) */
  wS(t: string, s: string): any {
    switch (t) {
      case "Farmer":
        return PoolFactory.instance().produce(ki);
      case "GeneralPart":
        return PoolFactory.instance().produce(di.rv[4]);
      case "Soldier": {
        const i = GameMgr.instance().generals.soldierTypes.indexOf(s);
        return PoolFactory.instance().produce(di.rv[i]);
      }
      default:
        throw new Error(`未知的单位类型: ${t}`);
    }
  }

  /** Set the unit's cell + initialise it. (`vS`) */
  vS(t: any, s: number, i: string, h: any, e: number, a: number): void {
    t.aL(s, e, a);
    t.init(i, h);
  }

  /** Register the unit into the right map by its class. (`kS`) */
  kS(t: any, _s: string): void {
    if (t instanceof zs) this.hS.set(t.id, t);
    else if (t instanceof gi) this.eS.set(t.id, t);
    else if (t instanceof ki) this.aS.set(t.id, t);
  }

  /** Place the unit in its board container. (`xS`) */
  xS(t: any, s: number, i: any, h: number, e: number): void {
    const a = BoardMgr.instance().Mv(s, i);
    if (a) a.setItem(t, h, e);
  }

  /** Emit the place event for the container type. (`SS`) */
  SS(t: any, s: number, i: any, h: number, e: number, a: string): void {
    switch (s) {
      case 3:
        this.AS(t, i, h);
        break;
      case 1:
        this.ES(t, i, h, e, a);
        break;
      case 5:
        this.BS(t, h, e, a);
    }
  }
  AS(t: any, s: any, i: number): void {
    if (s) EventMgr.instance.event(u.Mt, t.Yn, i);
    else EventMgr.instance.event(u.bt, t.Yn, 4, -5);
  }
  ES(t: any, s: number, i: number, _h: number, e: string): void {
    EventMgr.instance.event(u.bt, t.Yn, s, i);
    if (e === "GeneralPart") {
      t.changeState("GeneralPartWait");
      EventMgr.instance.event(u.ts, t);
    }
  }
  BS(t: any, s: number, i: number, h: string): void {
    EventMgr.instance.event(u.ss, t.Yn, s, i);
    if (h === "GeneralPart") {
      t.changeState("GeneralPartWait");
      EventMgr.instance.event(u.ts, t);
    }
  }

  /** Disband the general that member `t` belongs to (by id). (`IS`) */
  IS(t: number): void {
    const s = this.Qk.get(t);
    if (s) this.cS(s.va[0].id);
  }

  /** Merge a set of general-parts into a General. (`DS`) */
  DS(t: any[], s = true): any {
    for (let k = 0; k < t.length; k++) t[k].changeState("GeneralPartMerge");
    const h = t[0].qd;
    let e = t[0].Id;
    let a = "";
    for (let k = 0; k < t.length; k++) {
      a += t[k].Qd;
      if (e < t[k].Id) e = t[k].Id;
    }
    const n = GameMgr.instance().generals.generalNames.findIndex((g: any) => g === a);
    const r = $a.TS(n);
    if (s) {
      if (h) r.weaponId = GameMgr.instance().player.equip[n];
      else {
        const ai = GameMgr.instance().battleState.Pi.Ai;
        for (let k = 0; k < ai.length; k++)
          if (GameMgr.instance().generals.generalNames[n] === ai[k].general) {
            const wid = ai[k].Hn;
            const wt = GameMgr.instance().weaponData.weapons.get(wid)?.type;
            if (wt !== undefined && wt !== 4) {
              r.weaponId = wid;
              break;
            }
          }
      }
    } else r.weaponId = 20;
    r.init(t, h, n);
    r.RS(e);
    const l: number[] = [];
    for (let k = 0; k < t.length; k++) {
      const o = t[k];
      l.push(o.id);
      o.Zw = r.id;
      for (let m = 0; m < o.Xd.length; m++) BuffMgr.instance().applyBuff(r.id, o.Xd[m].Lg, o.Xd[m].num, o.Xd[m].CS);
    }
    this.nS.set(r.id, l);
    this.MS(r);
    if (h && s) GameMgr.instance().player.addMergedGeneral(n);
    return r;
  }

  /** Level a unit up/down (soldier/prop/farmer/general). (`pS`) */
  pS(t: number, s: number, i = true): void {
    let jS = this.hS.get(t);
    if (jS) {
      jS.cL(s, i);
      return;
    }
    jS = this.eS.get(t);
    if (jS) {
      const g = this.Qk.get(this.uS(jS.id));
      if (g) {
        const e = GameMgr.instance().generals;
        const table = g.Ya ? e.Wa : e.Ha;
        if (g.level + s - 1 < 0 || g.level + s - 1 >= table.length) return;
        g.RS(table[g.level + s - 1] - g.Id, i);
      } else jS.cL(s, i);
      return;
    }
    jS = this.aS.get(t);
    if (jS) jS.cL(s, i);
  }

  /** Replace a unit with a random different unit type. (`fS`) */
  fS(t: number): void {
    let jS = this.hS.get(t);
    let s = true;
    if (!jS) {
      jS = this.eS.get(t);
      s = false;
    }
    const i = jS.qd;
    const h = jS.Td;
    const e = jS.Cd.x;
    const a = jS.Cd.y;
    const n = jS.level;
    const r = jS.Xd.concat();
    if (s) this.Lx(t);
    else this.gx(t);
    this.C_(h, this.$S(jS.Qd), i, e, a, n, r);
  }
  /** Pick a random different unit type from the merged pool. (`$S`) */
  $S(t: string): string {
    const s = GameMgr.instance().soldierPool.hh;
    this.ma.length = 0;
    for (let i = 0; i < s.length; i++) if (s[i] !== t && s[i] !== "铲") this.ma.push(s[i]);
    return this.ma[MathE.range(0, this.ma.length, true) as number];
  }

  /** Auto-merge check when a general-part lands. (`gS`) */
  gS(t: any): void {
    if (t.Zw !== -1) return;
    const s = GameMgr.instance().generals.mergeRecipes;
    const i = t.Td;
    let h: any;
    let e: number;
    let a: number;
    if (i === 5) {
      const grid = BoardMgr.instance().Mv(5, t.qd)!;
      h = grid.mv;
      e = h.length;
      a = h[0].length;
    } else {
      h = BoardMgr.instance().Mv(1, t.qd)!.mv;
      e = GameMgr.instance().map.ue.length;
      a = GameMgr.instance().map.ue[0].length;
    }
    void a;
    const n: any[] = [];
    for (let k = 0; k < s.length; k++)
      for (let m = 0; m < s[k].length; m++)
        if (t.Qd === s[k][m]) {
          n.push({ arr: s[k], i: m, type: k });
          break;
        }
    let r: number;
    let o: any[] = [];
    for (let k = 0; k < n.length; k++) {
      let ok = true;
      o.length = 0;
      for (let m = 0; m < n[k].arr.length; m++) {
        r = t.Cd.x + (m - n[k].i);
        if (r < 0 || r >= e) {
          ok = false;
          continue;
        }
        const l = h[r][t.Cd.y];
        if (l && l.Qd === n[k].arr[m]) o.push(l);
        else ok = false;
      }
      if (ok) {
        if (this.US(n[k].type, t.qd)) continue;
        this.DS(o);
        return;
      }
    }
    if (!GameMgr.instance().generals.Xa) return;
    if (i === 5) return;
    o.length = 0;
    if (GameMgr.instance().generals.familyNames.indexOf(t.Qd) >= 0) {
      r = t.Cd.x + 1;
      if (r >= e) return;
      const l = h[r][t.Cd.y];
      if (!l || GameMgr.instance().generals.givenNames.indexOf(l.Qd) < 0) return;
      o.push(t);
      o.push(l);
    } else if (GameMgr.instance().generals.givenNames.indexOf(t.Qd) >= 0) {
      r = t.Cd.x - 1;
      if (r < 0) return;
      const l = h[r][t.Cd.y];
      if (!l || GameMgr.instance().generals.familyNames.indexOf(l.Qd) < 0) return;
      o.push(l);
      o.push(t);
    }
    this.DS(o, false);
  }

  gameOver(): void {
    this.ma.length = 0;
    for (const t of this.Qk) t[1].gameOver();
    this.Qk.clear();
    this.nS.clear();
    this.ma.length = 0;
    for (const t of this.hS) this.ma.push(t[0]);
    for (const t of this.ma) this.Lx(t);
    this.ma.length = 0;
    for (const t of this.eS) this.ma.push(t[0]);
    for (const t of this.ma) this.gx(t);
    this.ma.length = 0;
    for (const t of this.aS) this.ma.push(t[0]);
    for (const t of this.ma) this.uk(t);
    this.hS.clear();
    this.eS.clear();
    this.aS.clear();
    this.rS.length = 0;
  }
}
