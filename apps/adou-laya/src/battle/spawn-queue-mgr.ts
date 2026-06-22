// SpawnQueueMgr — draws the next unit type for each side's spawn (the bundle's `Na`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~24933-25010. Holds the per-side draw bags (`fU`/`gU`) seeded from the soldier
// pool, injects shovels by config/day, and `LU` pulls the next unit (respecting
// forced types + the no-repeat rule). Opaque field / method names kept verbatim.
//
//   playerBag=fU  enemyBag=gU  draw=LU  refill=U_  generalPreview=wU

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { MathE } from "../core/math-e";
import { GeneralMergeFactory } from "./general-merge-factory";

const $a = GeneralMergeFactory;

export class SpawnQueueMgr extends Singleton {
  pU = false;
  yU: number[] = [];
  fU!: string[] | null;
  private gU!: string[] | null;

  init(): void {
    this.fU = GameMgr.instance().soldierPool.eh;
    this.gU = GameMgr.instance().soldierPool.ah;
  }
  startGame(): void {
    const t = GameMgr.instance();
    this.fU = t.soldierPool.eh.slice();
    this.gU = t.soldierPool.ah.slice();
    t.generals.generalNames.forEach((g: any, s: number) => {
      let i = true;
      for (let k = 0; k < g.length; k++) if (!this.fU!.includes(g[k])) i = false;
      if (i) this.yU.push(s);
    });
    const s = t.config.ri[t.battleState.ki];
    if (s > 0) for (let k = 0; k < s; k++) this.gU!.push("铲");
    this.dU();
  }
  /** Draw the next unit type for a side. (`LU`) */
  LU(t: boolean): string {
    const bs = GameMgr.instance().battleState;
    if ((bs.di as any).length >= 2) return (bs.di as any)[MathE.range(0, (bs.di as any).length, true) as number];
    const s = t ? this.fU! : this.gU!;
    if (!s || s.length === 0) return "刀";
    const i = MathE.range(0, s.length, true) as number;
    const h = s[i];
    if (s[i] !== "刀" && s[i] !== "枪" && s[i] !== "弓" && s[i] !== "骑" && s[i] !== "铲" && s[i] !== "农") {
      s.splice(i, 1);
      if ((t && bs.Ui) || (!t && bs.Fi)) s.splice(s.indexOf(h), 1);
    }
    return h;
  }
  private dU(): void {
    if (GameMgr.instance().player.roundDay > 3) return;
    let t = 0;
    for (let s = 0; s < this.fU!.length; s++) if (this.fU![s] === "铲") t++;
    t = Math.floor(t / 5);
    for (let s = 0; s < t; s++) {
      this.fU!.push("铲");
      this.gU!.push("铲");
    }
  }
  /** Re-add non-base unit types to a side's bag. (`U_`) */
  U_(t: boolean): void {
    const s = ["刀", "弓", "枪", "骑", "铲", "农"];
    const i = t ? this.fU! : this.gU!;
    const h = i.length;
    for (let k = 0; k < h; k++) {
      let e = true;
      for (let m = 0; m < s.length; m++)
        if (i[k] === s[m]) {
          e = false;
          break;
        }
      if (e) i.push(i[k]);
    }
    if (t) GameMgr.instance().battleState.Ui = true;
    else GameMgr.instance().battleState.Fi = true;
  }
  gameOver(): void {
    this.fU = null;
    this.gU = null;
    this.yU = [];
  }
  mU(t: number): boolean {
    return GameMgr.instance().player.mergedGenerals.indexOf(t) !== -1;
  }
  /** Preview a general's skill name/description without spawning it. (`wU`) */
  wU(t: number): { skillName: string; description: string } | null {
    const s = $a.TS(t);
    const i = s.NP ? s.NP[0] : null;
    $a.HR(s);
    return i ? { skillName: i.name, description: i.description } : null;
  }
}
