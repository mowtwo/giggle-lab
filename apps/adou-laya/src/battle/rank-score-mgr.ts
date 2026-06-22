// RankScoreMgr — converts between a flat score and a (rank, level) pair
// (the bundle's `En`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~28216-28257. Ranks 0..49 each hold 5 levels (score = 5*rank + level); ranks
// 50..53 are the high tiers whose level spans come from the rank table (`da`).
// Opaque method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";


export class RankScoreMgr extends Singleton {
  private da: any;

  init(): void {
    this.da = GameMgr.instance().rank.table;
  }

  /** Score -> {rank, level}. (`SG`) */
  SG(t: number): { rank: number; level: number } {
    if (t <= 250) {
      let s = Math.floor(t / 5);
      let i = t - 5 * s;
      if (i === 0) {
        if (t === 0) return { rank: 0, level: 1 };
        s -= 1;
        i = 5;
      }
      return { rank: Math.min(49, Math.max(0, s)), level: i };
    }
    const s = t - 250;
    const i = this.da.get(50).level;
    const h = this.da.get(51).level;
    const e = this.da.get(52).level;
    return s <= i
      ? { rank: 50, level: s }
      : s <= h
        ? { rank: 51, level: s }
        : s <= e
          ? { rank: 52, level: s }
          : { rank: 53, level: s };
  }

  /** {rank, level} -> score. (`bG`) */
  bG(t: number, s: number): number {
    if (!this.da || this.da.size === 0) return 5 * Math.max(0, t) + s;
    if (t <= 49) return 5 * t + s;
    const i = this.da.get(50).level;
    const h = this.da.get(51).level;
    const e = this.da.get(52).level;
    return t === 50
      ? 250 + s
      : t === 51
        ? 250 + (i + s)
        : t === 52
          ? 250 + (h + s)
          : 250 + (e + s);
  }
}

/** Alias. (`En`) */
export const En = RankScoreMgr;
