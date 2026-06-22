// AI placement weight tables (`pn`) + reachable-cell picker (`yn`/`fn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~26233-26525. `PlacementTables` (pn) precomputes, per spawnable character, a
// per-cell "coverage" score — how many enemy-path points a unit placed there
// would threaten (`fO`/`aO`), keyed by map index and cached by the AI
// controller. `CellPicker` (yn/fn) selects expansion cells (`2_1`) to open,
// ranking by adjacency to the road and distance to the enemy path, with the
// ranking sharpening as difficulty rises. Opaque method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { MathE } from "../core/math-e";


/** Per-character per-cell coverage-score tables. (`pn`) */
export class PlacementTables {
  /** Group/closest-end weighted coverage map (used for AoE / piercing). (`aO`) */
  static aO(s: number): Map<any, number[][]> {
    const i = GameMgr.instance().map;
    const h = i.Me(s);
    const { nO: e, rO: a, oO: n } = PlacementTables.lO(s);
    const r = PlacementTables.cO(a, n);
    const o: any = GameMgr.instance().generals;
    const l = o.Aa.concat(o.generalNames);
    if (o.Xa) l.push("平民");
    const c = new Map<any, number[][]>();
    const u = i.gridWid;
    const p = i.gridHei;
    const y = h[0].length / 2;
    for (let s2 = 0; s2 < l.length; s2++) {
      const i2 = s2 >= o.Aa.length;
      let n2: number;
      let fTarget = "nearest";
      let g = "单体";
      let d = 1;
      if (i2)
        if (l[s2] !== "平民") {
          const t = o.generalAttackConfigs[s2 - o.Aa.length];
          n2 = t.Da;
          fTarget = t.Ua || "nearest";
          g = t.Ca;
          d = l[s2].length;
        } else {
          n2 = o.Ga.Da;
          d = 2;
        }
      else {
        const t = o.soldierAttackConfigs[s2];
        n2 = t.Da;
        fTarget = t.Ua || "nearest";
        g = t.Ca;
      }
      const L = n2 * u;
      const m = g === "范围" ? r.group : fTarget === "closest_end" ? r.uO : r.pO;
      c.set(l[s2], PlacementTables.yO(h, y, d, i2, L, u, p, e, a, m));
    }
    return c;
  }

  /** Plain per-cell coverage map (single-target nearest). (`fO`) */
  static fO(s: number): Map<any, number[][]> {
    const i = GameMgr.instance().map;
    const h = i.Me(s);
    const { nO: e, rO: a } = PlacementTables.lO(s);
    const n: any = GameMgr.instance().generals;
    const r = n.Aa.concat(n.generalNames);
    if (n.Xa) r.push("平民");
    const o = new Map<any, number[][]>();
    const l = i.gridWid;
    const c = i.gridHei;
    const u = h[0].length / 2;
    for (let s2 = 0; s2 < r.length; s2++) {
      const i2 = s2 >= n.Aa.length;
      let p: number;
      let y = 1;
      if (i2)
        if (r[s2] !== "平民") {
          p = n.generalAttackConfigs[s2 - n.Aa.length].Da;
          y = r[s2].length;
        } else {
          p = n.Ga.Da;
          y = 2;
        }
      else p = n.soldierAttackConfigs[s2].Da;
      const g = p * l;
      const d: number[][] = [];
      for (let s3 = 0; s3 < h.length; s3++) {
        d.push([]);
        const n2 = s3 * l + l / 2;
        for (let r2 = 0; r2 < u; r2++) {
          if (!PlacementTables.gO(h, s3, r2, u, i2, y)) {
            d[s3].push(0);
            continue;
          }
          const o2 = r2 * c + c / 2;
          let count = 0;
          for (let t = 0; t < a; t++)
            if (MathE.circleRectOverlap(g, n2, o2, e[t].x, e[t].y, e[t].bB, e[t].MB)) count += 1;
          d[s3].push(count);
        }
      }
      o.set(r[s2], d);
    }
    return o;
  }

  /** Expansion cells (`2_1`/`1_1`) adjacent to the enemy road. (`dO`) */
  static dO(t: number): Array<{ x: number; y: number }> {
    const s = GameMgr.instance().map.Me(t);
    const i = s[0].length / 2;
    const h: Array<{ x: number; y: number }> = [];
    for (let t2 = s.length - 1; t2 >= 0; t2--)
      for (let e = i - 1; e >= 0; e--) {
        const a = s[t2][e];
        if (a !== "2_1" && a !== "1_1") continue;
        let n = false;
        outer: for (let h2 = t2 - 1; h2 <= t2 + 1; h2++)
          for (let k = e - 1; k <= e + 1; k++)
            if (!(h2 < 0 || h2 >= s.length || k < 0 || k >= i) && s[h2][k] === "0_1") {
              n = true;
              break outer;
            }
        if (n) h.push({ x: t2, y: e });
      }
    return h;
  }

  /** Enemy-path rectangles + their count + end index. (`lO`) */
  static lO(t: number): { nO: any[]; rO: number; oO: number } {
    const s = GameMgr.instance().map;
    const i = s.Be(t, false);
    const h: any[] = [];
    for (let t2 = 0; t2 < i.length; t2++) {
      const e = i[t2];
      h.push({ x: e.x * s.gridWid, y: e.y * s.gridHei, bB: s.gridWid, MB: s.gridHei });
    }
    const e = h.length;
    return { nO: h, rO: e, oO: e > 1 ? e - 1 : 1 };
  }

  /** Per-path-index weights for point / closest-end / group targeting. (`cO`) */
  static cO(t: number, s: number): { pO: number[]; uO: number[]; group: number[] } {
    const i: number[] = [];
    const h: number[] = [];
    const e: number[] = [];
    for (let a = 0; a < t; a++) {
      const x = a / s;
      if (x < 0.15 || x > 0.85) {
        i[a] = 0;
        h[a] = 0;
        e[a] = 0;
      } else {
        i[a] = 1.2 * x;
        h[a] = x * x * x;
        e[a] = 4 * x * (1 - x);
      }
    }
    return { pO: i, uO: h, group: e };
  }

  /** Whether cell (s,i) is a placeable enemy cell (multi-row units fit). (`gO`) */
  static gO(t: string[][], s: number, i: number, _h: number, e: boolean, a: number): boolean {
    return (
      (t[s][i] === "1_1" || t[s][i] === "2_1") &&
      (!e || !(s + a > t.length || (t[s + a - 1][i] !== "1_1" && t[s + a - 1][i] !== "2_1")))
    );
  }

  /** Build a weighted coverage grid for one character. (`yO`) */
  static yO(
    s: string[][],
    i: number,
    h: number,
    e: boolean,
    a: number,
    n: number,
    r: number,
    o: any[],
    l: number,
    c: number[],
  ): number[][] {
    const u: number[][] = [];
    for (let p = 0; p < s.length; p++) {
      u.push([]);
      const y = p * n + n / 2;
      for (let n2 = 0; n2 < i; n2++) {
        if (!PlacementTables.gO(s, p, n2, i, e, h)) {
          u[p].push(0);
          continue;
        }
        const g = n2 * r + r / 2;
        let d = 0;
        for (let t = 0; t < l; t++) {
          const w = c[t];
          if (w !== 0 && MathE.circleRectOverlap(a, y, g, o[t].x, o[t].y, o[t].bB, o[t].MB)) d += w;
        }
        u[p].push(d);
      }
    }
    return u;
  }

  /** Coverage value at (i,h) for character `e`, falling back to the max. (`LO`) */
  static LO(s: Map<any, number[][]>, i: number, h: number, e: any): number {
    if (e) {
      const t = s.get(e);
      if (t) {
        const v = t[i]?.[h];
        if (v != null) return v;
      }
    }
    return PlacementTables.mO(s, i, h);
  }

  /** Max coverage value across all characters at (s,i). (`mO`) */
  static mO(t: Map<any, number[][]>, s: number, i: number): number {
    let e = 0;
    for (const a of t.values()) {
      const v = a[s]?.[i];
      if (v != null && v > e) e = v;
    }
    return e;
  }

  /** Max neighbour coverage value (4-dir) for road cells. (`wO`) */
  static wO(s: Map<any, number[][]>, i: string[][], h: number, e: number): number {
    const a = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let n = 0;
    for (const [r, o] of a) {
      const x = h + r;
      const y = e + o;
      if (x < 0 || y < 0 || x >= i.length || y >= i[0].length) continue;
      if (i[x][y] !== "1_1") continue;
      const c = PlacementTables.mO(s, x, y);
      if (c > n) n = c;
    }
    return n;
  }
}

/** Alias. (`pn`) */
export const pn = PlacementTables;

/** Selects expansion cells for the AI to open. (`yn`/`fn`) */
export class CellPicker {
  static EO = 0.15;
  static BO = 0.85;

  /** Pick up to `s` expansion cells, ranked by difficulty heuristics. (`vO`) */
  static vO(s: number, i: any): Array<{ x: number; y: number }> {
    const h = GameMgr.instance().map;
    const e = h.ue;
    const a = h.Le;
    const n = Math.min(3, Math.max(0, GameMgr.instance().battleState.ki));
    const r = CellPicker.kO(e);
    if (r.length === 0 || s <= 0) return [];
    if (n <= 1) return CellPicker._O(r, s);
    if (n === 3 && i && i.size > 0) {
      const ranked = r.map((c) => ({
        c,
        xO: pn.wO(i, e, c.x, c.y),
        SO: CellPicker.bO(e, c.x, c.y),
      }));
      ranked.sort((t, k) => (k.xO !== t.xO ? k.xO - t.xO : k.SO - t.SO));
      return CellPicker.MO(ranked.map((t) => t.c), s);
    }
    if (!a || a.length === 0) return CellPicker._O(r, s);
    const ranked = r.map((c) => ({
      c,
      SO: CellPicker.bO(e, c.x, c.y),
      PO: CellPicker.AO(c.x, c.y, a, CellPicker.EO, CellPicker.BO),
    }));
    ranked.sort((t, k) => (k.SO !== t.SO ? k.SO - t.SO : t.PO - k.PO));
    return CellPicker.MO(ranked.map((t) => t.c), s);
  }

  /** All `2_1` expansion cells. (`kO`) */
  static kO(t: string[][]): Array<{ x: number; y: number }> {
    const s: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < t.length; i++)
      for (let h = 0; h < t[i].length; h++) if (t[i][h] === "2_1") s.push({ x: i, y: h });
    return s;
  }

  /** Count of road (`0_1`) neighbours (4-dir). (`bO`) */
  static bO(t: string[][], s: number, i: number): number {
    const h = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let e = 0;
    for (const [a, n] of h) {
      const x = s + a;
      const y = i + n;
      if (!(x < 0 || y < 0 || x >= t.length || y >= t[0].length) && t[x][y] === "0_1") e++;
    }
    return e;
  }

  /** Min Manhattan distance to the enemy path's mid section. (`AO`) */
  static AO(t: number, s: number, i: any[], h: number, e: number): number {
    const a = i.length;
    if (a === 0) return 1e9;
    const n = Math.max(0, Math.floor(h * a));
    const r = Math.min(a, Math.ceil(e * a));
    let o = 1e9;
    for (let h2 = n; h2 < r; h2++) {
      const node = i[h2];
      const d = Math.abs(t - node.x) + Math.abs(s - node.y);
      if (d < o) o = d;
    }
    return o;
  }

  /** Random sample of cells. (`_O`) */
  static _O(t: any[], s: number): any[] {
    const i = t.slice();
    MathE.shuffle(i);
    return i.slice(0, Math.min(s, i.length));
  }

  /** Dedup + take first `s`. (`MO`) */
  static MO(t: any[], s: number): any[] {
    const i = new Set<string>();
    const h: any[] = [];
    for (let e = 0; e < t.length && h.length < s; e++) {
      const key = t[e].x + "_" + t[e].y;
      if (!i.has(key)) {
        i.add(key);
        h.push(t[e]);
      }
    }
    return h;
  }
}

/** Alias. (`fn`) */
export const fn = CellPicker;
