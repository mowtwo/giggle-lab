// EnemySpatialMgr — enemy registry, spatial hash, spawning, targeting + waves.
//
// Faithful reconstruction of the bundle's `Eh` (reconstruction/reference/
// bundle.pretty.js lines ~17145-17620). Holds every live enemy (`kw`), buckets
// them into an 80px grid for radius queries, spawns mobs / bosses / specials via
// the enemy factory, answers all the targeting queries weapons use (nearest,
// furthest, random, in-range, top-by-distance), drives the boss-wave schedule,
// and re-applies active area buffs to newly-spawned enemies. Opaque field /
// method names kept verbatim (engine + cross-module contract).
//
//   enemies=kw  grid=wA  entityCell=vA  groupBuffs=rS  spawnMob=rg  spawnBoss=TA
//   inRange=lv  nearestByDist=GA  randomTarget=XA  topByDist=OA  applyHit=sd
//   waveTick=bA  bossWave=WA  applyGroupBuff=F_  removeGroupBuff=O_  reapplyBuffs=MS

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { EnemyFactory, EnemyTypes } from "./enemy-factory";
import { BuffMgr } from "./buff-mgr";

const u = GameEvent;
const $ = AudioMgr;
const is = EnemyTypes;

export class EnemySpatialMgr extends Singleton {
  private ma: any[] = [];
  private Mo = new Laya.Point();
  private Po = new Laya.Point();
  /** id → enemy entity. (`kw`) */
  kw = new Map<number, any>();
  private mA: any[] = [];
  /** cell key → Set of entity ids. (`wA`) */
  private wA = new Map<string, Set<number>>();
  /** entity id → cell key. (`vA`) */
  private vA = new Map<number, string>();
  private gridSize = 80;
  private kA = 0;
  /** Active area-group buffs. (`rS`) */
  private rS: any[] = [];

  init(): void {
    const t = GameMgr.instance().map;
    this.gridSize = t.gridWid;
    UpdateMgr.instance().register("enemyMgr", this, this.update);
    this.addEvent();
  }

  startGame(): void {}

  addEvent(): void {
    EventMgr.instance.on(u.nt, this, this._A);
    EventMgr.instance.on(u.ot, this, this.xA);
    EventMgr.instance.on(u.ut, this, this.iA);
    EventMgr.instance.on(u.ft, this, this.SA);
  }

  update(t: number): void {
    this.bA(t);
  }

  /** Enemy added. (`_A`) */
  _A(t: number, s: any): void {
    this.kw.set(t, s);
    this.MA(t, s);
  }

  /** Enemy removed. (`xA`) */
  xA(t: number): void {
    this.PA(t);
    this.kw.delete(t);
  }

  private AA(t: number, s: number): string {
    return `${t}_${s}`;
  }

  private EA(t: any): { BA: number; IA: number } {
    const s = t.enemy.x + t.enemy.width / 2;
    const i = t.enemy.y + t.enemy.height / 2;
    return { BA: Math.floor(s / this.gridSize), IA: Math.floor(i / this.gridSize) };
  }

  private MA(t: number, s: any): void {
    this.PA(t);
    const { BA: i, IA: h } = this.EA(s);
    const e = this.AA(i, h);
    if (!this.wA.has(e)) this.wA.set(e, new Set());
    this.wA.get(e)!.add(t);
    this.vA.set(t, e);
  }

  private PA(t: number): void {
    const s = this.vA.get(t);
    if (s) {
      const i = this.wA.get(s);
      if (i) {
        i.delete(t);
        if (i.size === 0) this.wA.delete(s);
      }
      this.vA.delete(t);
    }
  }

  /** Cell changed → re-bucket. (`SA`) */
  SA(t: number, s: any): void {
    const { BA: i, IA: h } = this.EA(s);
    const e = this.AA(i, h);
    if (this.vA.get(t) !== e) this.MA(t, s);
  }

  /** Collect entity ids within radius `i` around (t,s). (`DA`) */
  private DA(t: number, s: number, i: number): Set<number> {
    const h = new Set<number>();
    const e = Math.floor((t - i) / this.gridSize);
    const a = Math.floor((t + i) / this.gridSize);
    const n = Math.floor((s - i) / this.gridSize);
    const r = Math.floor((s + i) / this.gridSize);
    for (let x = e; x <= a; x++)
      for (let y2 = n; y2 <= r; y2++) {
        const key = this.AA(x, y2);
        const set = this.wA.get(key);
        if (set) for (const id of set) h.add(id);
      }
    return h;
  }

  /** Spawn a mob of type `t` at spec `s`. (`rg`) */
  rg(t: number, s: any, i = false): any {
    const h = is.lg[t];
    const e = EnemyFactory.instance().ng(h);
    e.type = t;
    e.YM = i;
    e.init(s);
    this.MS(e);
    EventMgr.instance.event(u.Ht, s);
    return e;
  }

  /** Spawn a boss of type `t`. (`TA`) */
  TA(t: number, s: any): any {
    const i = is.ug[t];
    const h = EnemyFactory.instance().ng(i);
    h.type = t;
    h.init(s);
    this.MS(h);
    EventMgr.instance.event(u.Ht, s, true);
    return h;
  }

  /** All enemies matching filter `t`. (`RA`) */
  RA(t: any): any[] {
    const s: any[] = [];
    this.kw.forEach((i) => {
      if (i.aP(t)) s.push(i);
    });
    return s;
  }

  /** Enemies overlapping a circle (t,s,r=i), matching `h`. (`lv`) */
  lv(t: number, s: number, i: number, h: any): any[] {
    const e: any[] = [];
    const a = GameMgr.instance().map;
    const n = Math.floor((t - i) / this.gridSize);
    const r = Math.floor((t + i) / this.gridSize);
    const o = Math.floor((s - i) / this.gridSize);
    const l = Math.floor((s + i) / this.gridSize);
    const c = new Set<number>();
    for (let uu = n; uu <= r; uu++)
      for (let nn = o; nn <= l; nn++) {
        const rr = this.AA(uu, nn);
        const oo = this.wA.get(rr);
        if (oo)
          for (const nid of oo) {
            if (c.has(nid)) continue;
            c.add(nid);
            const rEnemy = this.kw.get(nid);
            if (
              rEnemy &&
              rEnemy.aP(h) &&
              MathE.circleRectOverlap(i, t, s, rEnemy.enemy.x, rEnemy.enemy.y, a.gridWid, a.gridHei)
            )
              e.push({ id: nid, x: rEnemy.enemy.x, y: rEnemy.enemy.y, Aw: rEnemy.Aw });
          }
      }
    return e;
  }

  /** Push enemies overlapping a circle into `e`. (`CA`) */
  CA(t: number, s: number, i: number, h: any, e: any[]): void {
    const a = GameMgr.instance().map;
    const n = this.DA(t, s, i);
    for (const r of n) {
      const enemy = this.kw.get(r);
      if (enemy && enemy.aP(h) && MathE.circleRectOverlap(i, t, s, enemy.enemy.x, enemy.enemy.y, a.gridWid, a.gridHei))
        e.push(enemy);
    }
  }

  /** Position of enemy `t`. (`UA`) */
  UA(t: number): { x: number; y: number } | null {
    const enemy = this.kw.get(t);
    return enemy ? { x: enemy.enemy.x, y: enemy.enemy.y } : null;
  }

  /** Enemies near point `t` within radius `s`, matching `i`, excluding `t.id`. (`FA`) */
  FA(t: any, s: number, i: any): any[] {
    const h: any[] = [];
    const e = GameMgr.instance().map;
    const a = this.DA(t.x, t.y, s);
    for (const n of a) {
      if (n === t.id) continue;
      const enemy = this.kw.get(n);
      if (enemy && enemy.aP(i) && MathE.circleRectOverlap(s, t.x, t.y, enemy.enemy.x, enemy.enemy.y, e.gridWid, e.gridHei))
        h.push({ id: n, x: enemy.enemy.x, y: enemy.enemy.y, Aw: enemy.Aw });
    }
    return h;
  }

  /** Apply hit `t` to a list of enemies. (`sd`) */
  sd(t: any, s: any[], i: any): void {
    let h: any;
    for (let e = 0; e < s.length; e++) {
      h = this.kw.get(s[e].id);
      if (h) h.hit(t, i);
    }
  }

  /** Force game-over an enemy. (`HP`) */
  HP(t: number): void {
    this.kw.get(t).gameOver();
  }

  /** Top `t` enemies by ascending Aw (distance metric). (`OA`) */
  OA(t: number, s: any): any[] {
    const i: Array<[number, number]> = [];
    for (const entry of this.kw) if (entry[1].aP(s)) i.push([entry[0], entry[1].Aw]);
    function swap(arr: Array<[number, number]>, a: number, b: number): void {
      [arr[a], arr[b]] = [arr[b], arr[a]];
    }
    (function quick(arr: Array<[number, number]>, lo: number, hi: number): void {
      if (lo < hi) {
        const pivot = (function partition(arr2: Array<[number, number]>, lo2: number, hi2: number): number {
          const mid = Math.floor((lo2 + hi2) / 2);
          if (arr2[lo2][1] > arr2[hi2][1]) swap(arr2, lo2, hi2);
          if (arr2[mid][1] > arr2[hi2][1]) swap(arr2, mid, hi2);
          if (arr2[mid][1] > arr2[lo2][1]) swap(arr2, mid, lo2);
          const a = arr2[lo2][1];
          let n = lo2 + 1;
          for (let s2 = n; s2 <= hi2; s2++)
            if (arr2[s2][1] <= a) {
              swap(arr2, n, s2);
              n++;
            }
          swap(arr2, lo2, n - 1);
          return n - 1;
        })(arr, lo, hi);
        quick(arr, lo, pivot - 1);
        quick(arr, pivot + 1, hi);
      }
    })(i, 0, i.length - 1);
    let e: any;
    const a: any[] = [];
    for (let s2 = 0; s2 < t && i[s2]; s2++) {
      e = this.kw.get(i[s2][0]);
      a.push({ id: e.id, x: e.enemy.x, y: e.enemy.y, Aw: e.Aw });
    }
    return a;
  }

  /** Up to `t` (mostly-random) enemies matching `s`. (`YA`) */
  YA(t: number, s: any): any[] {
    const i: any[] = [];
    let h = 0.8;
    if (this.kw.size < t) h = 1;
    for (const e of this.kw)
      if (e[1].aP(s) && Math.random() < h) {
        i.push({ id: e[1].id, x: e[1].enemy.x, y: e[1].enemy.y, Aw: e[1].Aw });
        if (i.length >= t) break;
      }
    return i;
  }

  /** A random enemy matching `t`. (`XA`) */
  XA(t: any): { id: number; x: number; y: number; Aw: number } {
    const s = { id: -1, x: 0, y: 0, Aw: Infinity };
    this.ma.length = 0;
    for (const e of this.kw) if (e[1].aP(t)) this.ma.push(e[1]);
    if (this.ma.length <= 0) return s;
    const i = this.ma[MathE.range(0, this.ma.length, true)!];
    return i.id === -1 ? s : { id: i.id, x: i.enemy.x, y: i.enemy.y, Aw: i.Aw };
  }

  /** Enemy with the minimum Qi matching `t`. (`GA`) */
  GA(t: any): { id: number; x: number; y: number; Aw: number } | null {
    const s = { id: -1, uh: Infinity };
    for (const i of this.kw)
      if (i[1].aP(t) && i[1].Qi < s.uh) {
        s.id = i[1].id;
        s.uh = i[1].Qi;
      }
    if (s.id < 0) return null;
    const t2 = this.kw.get(s.id);
    const i2 = t2.enemy;
    return { id: s.id, x: i2.x, y: i2.y, Aw: t2.Aw };
  }

  /** Enemy with the max pk on side `t`. (`HA`) */
  HA(t: any): { index: number; x: number; y: number } | null {
    let s: any;
    for (const i of this.kw) if (t === i[1].qd && (!s || i[1].pk > s.pk)) s = i[1];
    return s ? { index: s.pk, x: s.enemy.x, y: s.enemy.y } : null;
  }

  /** Boss-wave gate check. (`WA`) */
  WA(): void {
    const t = GameMgr.instance().battleState;
    const s = t.oi;
    if (t.gi) {
      t.Ni[s] = true;
      t.$i.push(s);
      this.zA(true, s, true);
      this.zA(false, s, false);
      t.gi = false;
      return;
    }
    const i = GameMgr.instance().enemy.yh.indexOf(s);
    if (i < 0) return;
    if (void 0 !== t.Ni[s]) return;
    const h = Math.random() < GameMgr.instance().enemy.fh[i];
    t.Ni[s] = h;
    if (h) {
      t.$i.push(s);
      this.zA(true, s, true);
      this.zA(false, s, false);
    }
  }

  /** Boss spawn for one side. (`zA`) */
  zA(t: boolean, s: number, i: boolean): void {
    const h = GameMgr.instance();
    let e: number;
    if (i) {
      e = 3 * h.map.mapIndex + h.enemy.ph;
      h.battleState.qi[s] = e;
      h.enemy.ph += 1;
      if (h.enemy.ph >= 3) h.enemy.ph = 0;
      if (t) {
        SceneMgr.instance().openDialog("BossTipDialog", true, e);
        $.instance().playSound("boss_entrance");
      }
    } else {
      e = h.battleState.qi[s];
    }
    this.TA(e, t);
  }

  /** Wave-progression tick (every 500ms). (`bA`) */
  bA(t: number): void {
    if (this.kw.size <= 0) return;
    this.kA += t;
    if (this.kA < 500) return;
    this.kA = 0;
    const s = GameMgr.instance().map.de!.length;
    let i = false;
    let h = false;
    for (const entry of this.kw)
      if (!((i && entry[1].qd) || (h && !entry[1].qd)) && s - entry[1].pk <= 5) {
        EventMgr.instance.event(u.Gt, entry[1].qd);
        if (entry[1].qd) i = true;
        else h = true;
      }
    if (!i && GameMgr.instance().map.ke) EventMgr.instance.event(u.Ot, false, 1);
  }

  /** Spawn a special (type 4) enemy. (`iA`) */
  iA(t: boolean, s: number, i: number, h: number): void {
    (t ? GameMgr.instance().battleState.Ii : GameMgr.instance().battleState.Ti).num += 1;
    const e = is.lg[4];
    const a = EnemyFactory.instance().ng(e);
    a.uA.x = s;
    a.uA.y = i;
    a.uA.index = h;
    a.init(t);
  }

  /** Spawn a type-6 enemy along a path. (`GP`) */
  GP(t: any, s: any, i: any, h: number, e: number, a: number, n: number, r: number): void {
    const o = is.lg[6];
    const l = EnemyFactory.instance().ng(o);
    l.Hv = new Laya.Point(h * GameMgr.instance().map.gridWid, e * GameMgr.instance().map.gridHei);
    l.eP = new Laya.Point(a * GameMgr.instance().map.gridWid, n * GameMgr.instance().map.gridHei);
    l.Aa = s;
    l.eA = i;
    l.pk = r;
    l.init(t);
  }

  /** Knock back enemies on side `t` near (s,i). (`mk`) */
  mk(t: any, s: number, i: number, h: any, e: any): void {
    let a = false;
    const n = GameMgr.instance().map.gridWid / 2;
    const r = this.DA(s, i, n);
    for (const o of r) {
      const enemy = this.kw.get(o);
      if (enemy && enemy.qd === t) {
        this.Mo.x = s;
        this.Mo.y = i;
        this.Po.x = enemy.enemy.x + enemy.enemy.width / 2;
        this.Po.y = enemy.enemy.y + enemy.enemy.height / 2;
        if (MathE.distance(this.Mo, this.Po) < n) {
          enemy.back(h, e);
          a = true;
        }
      }
    }
    if (a) EventMgr.instance.event(u.gs, t);
  }

  /** Trigger EP on enemies within 60px of (t,s). (`y_`) */
  y_(t: number, s: number): void {
    const i = this.DA(t, s, 60);
    for (const h of i) {
      const enemy = this.kw.get(h);
      if (!enemy) continue;
      const e = MathE.distance(
        { x: t, y: s },
        { x: enemy.enemy.x + enemy.enemy.width / 2, y: enemy.enemy.y + enemy.enemy.height / 2 },
      );
      if (e <= 60) enemy.EP(e, t, s);
    }
  }

  /** Apply charm (buff 15) to enemy `t`. (`n_`) */
  n_(t: number, s: any): void {
    const i = this.kw.get(t);
    if (i) {
      i.PP();
      BuffMgr.instance().applyBuff(t, 15, 0, false, s);
    }
  }

  /** Register + apply an area group buff to all side-`s` enemies. (`F_`) */
  F_(t: any, s: any, i: any, h: number, e: any, a: number): void {
    const n: any = { sign: t, qd: s, Lg: i, num: h, CS: e, time: a, map: new Map() };
    this.rS.push(n);
    for (const entry of this.kw) {
      if (entry[1].qd !== s) continue;
      const r = BuffMgr.instance().applyBuff(entry[1].id, i, h, e, a);
      n.map.set(entry[1].id, r);
    }
  }

  /** Remove a registered area group buff. (`O_`) */
  O_(t: any): void {
    const s = this.rS.findIndex((s2) => s2.sign === t);
    if (s < 0) return;
    const i = this.rS[s];
    for (const entry of i.map) if (entry[1] >= 0) BuffMgr.instance().kg(entry[0], i.Lg, entry[1]);
    this.rS.splice(s, 1);
  }

  /** Re-apply active area group buffs to a freshly-spawned enemy. (`MS`) */
  MS(t: any): void {
    for (let s = 0; s < this.rS.length; s++) {
      if (t.qd !== this.rS[s].qd) continue;
      const i = BuffMgr
        .instance()
        .applyBuff(t.id, this.rS[s].Lg, this.rS[s].num, this.rS[s].CS, this.rS[s].time);
      this.rS[s].map.set(t.id, i);
    }
  }

  /** Boss enrage / un-enrage. (`m_`) */
  m_(t: number, s: boolean): void {
    const i = this.kw.get(t);
    if (i) {
      if (s) i.OP();
      else i.m_();
    } else console.log("boss不存在");
  }

  gameOver(): void {
    Laya.timer.clearAll(this);
    this.ma = [];
    for (const t of this.kw) t[1].gameOver();
    this.kw.clear();
    this.mA.length = 0;
    this.wA.clear();
    this.vA.clear();
    this.rS.length = 0;
  }
}
