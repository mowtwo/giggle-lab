// CellReservationMgr — reserves board cells during async spawn flows (the `Oi`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~13268-13330. Hands out a token for a free board cell (hand grid 3 or board
// grid 1) so two spawns don't claim the same slot before placement completes.
// Opaque field / method names kept verbatim.
//
//   keyToToken=k_  tokenToKey=v_  reserveHand=A_  reserveBoard=E_  release=release

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { BoardMgr } from "./board-mgr";

const wi = BoardMgr;

export class CellReservationMgr extends Singleton {
  private v_ = new Map<string, string>();
  private k_ = new Map<string, string>();
  private __ = 1;

  private x_(t: number, s: boolean, i: number, h: number): string {
    return `${t}_${s ? "p" : "a"}_${i}_${h}`;
  }
  private S_(): string {
    return "rsv_" + this.__++;
  }
  clear(): void {
    this.v_.clear();
    this.k_.clear();
    this.__ = 1;
  }
  b_(t: number, s: boolean, i: number, h: number): boolean {
    return this.k_.has(this.x_(t, s, i, h));
  }
  M_(t: boolean, s: number): boolean {
    const i = wi.instance().Mv(3, t)!;
    return !(s < 0 || s >= i.size) && !i.getItem(s, 0) && !this.b_(3, t, s, 0);
  }
  private P_(t: boolean, s: number, i: number): boolean {
    return !wi.instance().Mv(1, t)!.getItem(s, i) && !this.b_(1, t, s, i);
  }
  A_(t: boolean, s: number): { index: number; token: string } | null {
    const reserve = (idx: number): string | null => {
      if (!this.M_(t, idx)) return null;
      const i = this.x_(3, t, idx, 0);
      const h = this.S_();
      this.k_.set(i, h);
      this.v_.set(h, i);
      return h;
    };
    if (s >= 0) {
      const tok = reserve(s);
      if (tok) return { index: s, token: tok };
    }
    const h = wi.instance().Mv(3, t)!;
    for (let k = 0; k < h.size; k++) {
      const tok = reserve(k);
      if (tok) return { index: k, token: tok };
    }
    return null;
  }
  E_(t: boolean, s: number, i: number): string | null {
    if (!this.P_(t, s, i)) return null;
    const h = this.x_(1, t, s, i);
    const e = this.S_();
    this.k_.set(h, e);
    this.v_.set(e, h);
    return e;
  }
  release(t: string): void {
    const s = this.v_.get(t);
    if (s) {
      this.v_.delete(t);
      this.k_.delete(s);
    }
  }
}
