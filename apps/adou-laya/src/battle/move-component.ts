// MoveComponent — an A*-pathfinding mover attached to a sprite (the bundle's
// `Xr`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~31647-31853. Computes a grid path from the owner's current cell to a target
// (`Mj`, snapping start/end to the nearest walkable cell), then steps the owner
// along it each frame at `Xu` px/s (`onUpdate`), firing `xj` and self-destroying
// on arrival. Used by BattleScene for the moving end-point banners. Opaque field
// / method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { Grid, AStar } from "./pathfinding";

const F = GameMgr;
const j = UpdateMgr;
const M = Grid;
const S = AStar;
const Yr = Laya.Vector2;

export class MoveComponent extends Laya.Script {
  private path: any[] = [];
  private pk = 0;
  private Xu = 0;
  private vM = new Yr();
  private _j = false;
  private xj: any = null;
  private Hl: any = null;
  private qd = true;
  private dg: any;

  onAwake(): void {
    this.dg = F.instance();
  }

  onStart(): void {}

  Sj(): { x: number; y: number } {
    const t: any = this.owner;
    if (!t) return { x: this.dg.map.ie.x, y: this.dg.map.ie.y };
    const s = Laya.stage.width / 2;
    if (t.x < s) {
      this.qd = true;
      return { x: this.dg.map.ie.x, y: this.dg.map.ie.y };
    }
    this.qd = false;
    return { x: this.dg.map.ae.x, y: this.dg.map.ae.y };
  }

  bj(): void {
    const t: any = this.owner;
    if (!t) return void console.warn("MoveComponent: owner 不是 Sprite 类型");
    if (!this.Hl) return void console.warn("MoveComponent: 终点未设置");
    const s = Math.floor((t.x + t.width / 2) / this.dg.map.gridWid);
    const i = Math.floor((t.y + t.height / 2) / this.dg.map.gridHei);
    this.Mj(s, i, this.Hl.x, this.Hl.y);
  }

  onUpdate(): void {
    if (!this._j || !this.Hl) return;
    const t: any = this.owner;
    if (!t) return;
    if (this.pk < 0 || this.pk >= this.path.length) {
      if (this.xj) this.xj();
      return void this.destroy();
    }
    const s = this.path[this.pk];
    const i = this.dg.map.gridWid;
    const h = this.dg.map.gridHei;
    const e = s.x * i;
    const a = s.y * h;
    const n = e - t.x;
    const r = a - t.y;
    const o = Math.sqrt(n * n + r * r);
    if (o < 5) {
      this.pk++;
      if (this.pk >= this.path.length) {
        if (this.xj) this.xj();
        this.destroy();
      }
    } else {
      const sx = n / o;
      const sy = r / o;
      this.vM.setValue(sx, sy);
      const delta = j.instance().delta;
      const e2 = (this.Xu * delta) / 1000;
      t.x += sx * e2;
      t.y += sy * e2;
    }
  }

  onDestroy(): void {
    this.path = [];
    this.xj = null;
    this.Hl = null;
  }

  Mj(t: number, s: number, i: number, h: number): void {
    const e = this.dg.map.ue;
    if (!e || e.length === 0) {
      this.path = [
        { x: t, y: s },
        { x: i, y: h },
      ];
      return void (this.pk = 0);
    }
    const a = e.length - 1;
    const n = e[0].length - 1;
    t = Math.max(0, Math.min(t, a));
    s = Math.max(0, Math.min(s, n));
    i = Math.max(0, Math.min(i, a));
    h = Math.max(0, Math.min(h, n));
    const r = new M(e.length, e[0].length);
    r.qh(t, s);
    r.Qh(i, h);
    for (let x = 0; x < e.length; x++)
      for (let y = 0; y < e[x].length; y++)
        if (e[x][y] !== "0_0" && e[x][y] !== "0_1") r.Kh(x, y, false);
    const o = r.Fh(t, s);
    const l = r.Fh(i, h);
    if (!o.Oh) {
      console.warn(`MoveComponent: 起点 (${t}, ${s}) 不可通行，尝试寻找最近的可行走点`);
      let found = false;
      for (let dx = -1; dx <= 1 && !found; dx++)
        for (let dy = -1; dy <= 1 && !found; dy++) {
          const ox = t + dx;
          const oy = s + dy;
          if (ox >= 0 && ox <= a && oy >= 0 && oy <= n) {
            if (r.Fh(ox, oy).Oh) {
              t = ox;
              s = oy;
              r.qh(t, s);
              found = true;
            }
          }
        }
      if (!found) {
        console.error("MoveComponent: 无法找到起点的可行走点");
        this.path = [
          { x: t, y: s },
          { x: i, y: h },
        ];
        return void (this.pk = 0);
      }
    }
    if (!l.Oh) {
      console.warn(`MoveComponent: 终点 (${i}, ${h}) 不可通行，尝试寻找最近的可行走点`);
      let found = false;
      for (let dx = -1; dx <= 1 && !found; dx++)
        for (let dy = -1; dy <= 1 && !found; dy++) {
          const ox = i + dx;
          const oy = h + dy;
          if (ox >= 0 && ox <= a && oy >= 0 && oy <= n) {
            if (r.Fh(ox, oy).Oh) {
              i = ox;
              h = oy;
              r.Qh(i, h);
              found = true;
            }
          }
        }
      if (!found) {
        console.error("MoveComponent: 无法找到终点的可行走点");
        this.path = [
          { x: t, y: s },
          { x: i, y: h },
        ];
        return void (this.pk = 0);
      }
    }
    const c = new S();
    if (c.Hh(r)) {
      this.path = c.path;
      this.pk = 0;
    } else {
      console.warn(`MoveComponent: AStar 找不到路径，起点 (${t}, ${s}) -> 终点 (${i}, ${h})`);
      this.path = [
        { x: t, y: s },
        { x: i, y: h },
      ];
      this.pk = 0;
    }
  }

  Pj(t: any, s?: number): void {
    this.Hl = t === null ? this.Sj() : t;
    if (s !== undefined) this.Xu = s;
    if (this.owner) {
      const o: any = this.owner;
      if (this.path.length === 0 && o.x !== 0 && o.y !== 0) this.bj();
    }
  }

  Aj(t: boolean): void {
    this.qd = t;
    if (!(this.Hl && this.Hl.x !== this.dg.map.ie.x && this.Hl.x !== this.dg.map.ae.x)) {
      this.Hl = this.Sj();
      if (this.owner && this.path.length > 0) this.bj();
    }
  }

  Ej(t: number): void {
    this.Xu = t;
  }

  Bj(): number {
    return this.Xu;
  }

  enable(): void {
    this._j = true;
    if (this.path.length === 0 && this.Hl) this.bj();
  }

  disable(): void {
    this._j = false;
  }

  isEnabled(): boolean {
    return this._j;
  }

  Ij(t: any): void {
    this.xj = t;
  }

  Dj(): number {
    const t: any = this.owner;
    if (!t || this.pk < 0 || this.pk >= this.path.length) return 0;
    const s = this.path[this.pk];
    const i = this.dg.map.gridWid;
    const h = this.dg.map.gridHei;
    const e = s.x * i;
    const a = s.y * h;
    const n = e - t.x;
    const r = a - t.y;
    return Math.sqrt(n * n + r * r) + (this.path.length - 1 - this.pk) * i;
  }

  Tj(): any {
    return this.vM;
  }

  Rj(): boolean {
    return this.pk >= this.path.length;
  }

  getPath(): any[] {
    return this.path;
  }

  Cj(): number {
    return this.pk;
  }
}

/** Alias. (`Xr`) */
export const Xr = MoveComponent;
