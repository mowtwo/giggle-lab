// Board containers — the placement grids for each side.
//
// Faithful reconstruction of the bundle's `mi` (a single placement grid, 1D or
// 2D) and `wi` (per-side board manager holding grids 1..5) —
// reconstruction/reference/bundle.pretty.js lines ~11650-11811. Grid type 4 (the
// general formation) uses a special index remap between its flat storage and its
// 2-row layout. Opaque field names kept verbatim.
//
//   BoardGrid=mi  BoardMgr=wi  cells2D=dv  cells1D=Lv  playerGrids=kv  enemyGrids=xv

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";

const F = GameMgr;

/** One placement grid (1D list, or 2D when `cols` given). (`mi`) */
export class BoardGrid {
  type: number;
  qd: boolean;
  private gv = false;
  private dv!: any[][];
  private Lv!: any[];

  constructor(type: number, qd: boolean, rows: number, cols = 0) {
    this.qd = false;
    this.type = type;
    this.qd = qd;
    if (cols) {
      this.gv = true;
      this.dv = Array.from(new Array(rows), () => new Array(cols).fill(null));
    } else {
      this.Lv = Array(rows).fill(null);
    }
  }

  get mv(): any {
    return this.gv ? this.dv : this.Lv;
  }

  get size(): number {
    return this.gv ? this.dv.length * this.dv[0].length : this.Lv.length;
  }

  /** Remap a (slot,row) for the flat-stored type-4 formation grid. (`wv`) */
  private wv(t: number, s: number): number {
    if (this.type === 4) {
      if (s === 0) {
        if (t === 0 || t === 1) return t;
      } else if (s === 1 && t >= 0 && t < 6) return t + 2;
      return -1;
    }
    return t;
  }

  getItem(t: number, s = 0): any {
    if (this.type === 4 && !this.gv) {
      const i = this.wv(t, s);
      return i < 0 || i >= this.Lv.length ? null : this.Lv[i];
    }
    return this.gv ? this.dv[t][s] : this.Lv[t];
  }

  setItem(t: any, s: number, i: number): void {
    if (this.type === 4 && !this.gv) {
      const h = this.wv(s, i || 0);
      if (h >= 0 && h < this.Lv.length) this.Lv[h] = t;
      return;
    }
    if (this.gv) this.dv[s][i] = t;
    else this.Lv[s] = t;
  }

  removeItem(t: number, s = 0): void {
    if (this.type === 4 && !this.gv) {
      const i = this.wv(t, s);
      if (i >= 0 && i < this.Lv.length) this.Lv[i] = null;
      return;
    }
    if (this.gv) this.dv[t][s] = null;
    else this.Lv[t] = null;
  }

  removeAll(): void {
    if (this.gv) {
      for (let t = 0; t < this.dv.length; t++) for (let s = 0; s < this.dv[t].length; s++) this.dv[t][s] = null;
    } else {
      for (let t = 0; t < this.Lv.length; t++) this.Lv[t] = null;
    }
  }

  /** Find the (x,y) of an item. (`vv`) */
  vv(t: any): { x: number; y: number } | null {
    if (this.gv) {
      for (let s = 0; s < this.dv.length; s++)
        for (let i = 0; i < this.dv[s].length; i++) if (this.dv[s][i] === t) return { x: s, y: i };
    } else {
      for (let s = 0; s < this.Lv.length; s++)
        if (this.Lv[s] === t) {
          if (this.type === 4) {
            if (s === 0 || s === 1) return { x: s, y: 0 };
            if (s >= 2 && s < 8) return { x: s - 2, y: 1 };
          }
          return { x: s, y: 0 };
        }
    }
    return null;
  }
}

/** Per-side board manager: grids 1 (board), 2 (queue), 3 (hand), 4 (formation), 5. (`wi`) */
export class BoardMgr extends Singleton {
  private kv = new Map<number, BoardGrid>();
  private xv = new Map<number, BoardGrid>();

  init(): void {
    this.Sv(true);
    this.Sv(false);
  }

  private Sv(t: boolean): void {
    const s = F.instance().map.ue;
    this.bv(1, t, s.length, s[0].length);
    this.bv(2, t, s.length, s[0].length);
    this.bv(3, t, F.instance().map.ye);
    this.bv(4, t, 6, 2);
    this.bv(5, t, 2, 1);
  }

  private bv(t: number, s: boolean, i: number, h = 0): void {
    (s ? this.kv : this.xv).set(t, new BoardGrid(t, s, i, h));
  }

  /** Get a grid by type for a side. (`Mv`) */
  Mv(t: number, s = true): BoardGrid | undefined {
    return (s ? this.kv : this.xv).get(t);
  }

  clearAll(): void {
    this.kv.forEach((t) => t.removeAll());
    this.xv.forEach((t) => t.removeAll());
  }

  static wv(t: number, s: number): number {
    if (s === 0) {
      if (t === 0 || t === 1) return t;
    } else if (s === 1 && t >= 0 && t < 6) return t + 2;
    return -1;
  }

  static Pv(t: number): { x: number; y: number } | null {
    return t === 0
      ? { x: 0, y: 0 }
      : t === 1
        ? { x: 1, y: 0 }
        : t >= 2 && t < 8
          ? { x: t - 2, y: 1 }
          : null;
  }
}
