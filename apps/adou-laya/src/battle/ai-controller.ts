// The enemy AI controller (the bundle's `mn`) + its two strategy helpers
// (`gn` place strategy, `dn`/`Ln` merge strategy) + the trivial base (`tn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~26525-27121 (gn/dn) and ~26798-27121 (mn). `GeneralAIController` runs on a
// throttled per-frame tick (`update`/`AY`) stepping through a 5-phase loop:
//   1 refresh / buy decision, 2 place spawn-box units (`gn.DO`), 3 sweep merge
//   candidates (`gn.zO`), 4 plan merges + value-rank a placement order
//   (`dn.qO`/`QO`/`ZO`/`JO`), 5 execute placements (`dn.hY`). It also opens
//   expansion cells (`EY`/`CellPicker`), uses props (`IU`/`tk` via the AI prop
//   strategies), and earns income on schedule (`kY`). Difficulty (`battleState.ki`)
//   selects the `iO` mode and the placement weighting. Opaque names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { MathE } from "../core/math-e";
import { BoardMgr } from "./board-mgr";
import { EntityRegistry } from "./entity-registry";
import { BattlePropsMgr } from "./battle-props-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { BaseSoldier } from "./base-soldier";
import { GeneralPart } from "./general-part";
import { Farmer } from "./farmer";
import { PlacementTables, CellPicker } from "./ai-placement";
import { PropUseBase, PropUseStrongest, PropUseRanged, PropUseWeakest, PropUsePath } from "./ai-prop-strategy";

const C = Singleton;
const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const f = MathE;
const wi = BoardMgr;
const Ki = EntityRegistry;
const Zi = BattlePropsMgr;
const K = SceneMgr;
const j = UpdateMgr;
const zs = BaseSoldier;
const gi = GeneralPart;
const ki = Farmer;
const pn = PlacementTables;
const fn = CellPicker;
const rn = PropUseBase;
const on = PropUseStrongest;
const ln = PropUseRanged;
const cn = PropUseWeakest;
const un = PropUsePath;

/** Trivial controller base. (`tn`) */
export class AIControllerBase extends C {
  init(): void {}
  refresh(_t?: any, _s?: any): void {}
  IU(): void {}
  click(): void {}
  DU(): void {}
}

/** AI placement strategy — decides what to place where. (`gn`) */
class AIPlaceStrategy {
  private IO: any;
  constructor(t: any) {
    this.IO = t;
  }

  DO(): void {
    const t = this.IO;
    let s: any;
    for (let i = t.TO; i < t.VF.size; i++) {
      t.TO += 1;
      s = t.VF.getItem(i);
      if (s == null) {
        const cells = fn.vO(1, t.RO);
        if (cells.length > 0) return void y.instance.event(u.At, false, cells[0].x, cells[0].y);
      } else {
        if (s instanceof zs) {
          if (this.CO(s)) return;
          return void (t.UO("1_1", s.Qd) && t.FO(s, t.OO[0].x, t.OO[0].y));
        }
        if (s instanceof gi) {
          if (this.YO(s)) return void this.CO(s);
          const i2 = this.XO(s);
          if (t.UO("1_1", s.Qd)) {
            if (F.instance().battleState.ki < 2 && i2 < 2) return;
            return void t.FO(s, t.OO[0].x, t.OO[0].y);
          }
          return void this.GO(s, i2);
        }
        if (s instanceof ki) {
          if (this.CO(s)) return;
          return void (t.UO("2_1")
            ? (t.FO(s, t.OO[0].x, t.OO[0].y), console.log("放置农民到可扩展格子上"))
            : t.UO("1_1", s.Qd) &&
              (t.FO(s, t.OO[0].x, t.OO[0].y), console.log("放置农民到可放置格子上")));
        }
      }
    }
  }

  GO(t: any, s: number): void {
    const i = this.IO;
    const h = i.hS.mv;
    const e: any = { Yn: null, value: 100 };
    for (let a = 0; a < h.length; a++)
      for (let n = 0; n < h.length; n++) {
        if (F.instance().map.ue[a][n] !== "1_1" || !h[a][n]) continue;
        let v: number;
        if (h[a][n] instanceof gi) {
          const extra = this.HO(h[a][n].Qd);
          v = extra > 0 ? F.instance().generals.charWeaponIds.get(h[a][n].Qd)![h[a][n].level - 1] + extra : 0;
        } else v = F.instance().generals.charWeaponIds.get(h[a][n].Qd)![h[a][n].level - 1];
        if (v < e.value) {
          e.Yn = h[a][n];
          e.value = v;
        }
      }
    if (e.value === 100) return void console.log("没有找到最小价值的  就很有趣");
    const a = e.Yn instanceof zs ? 2 : 3;
    if (Math.random() < (s - e.value) * a * 0.1) i.FO(t, e.Yn.Cd.x, e.Yn.Cd.y);
  }

  CO(t: any): boolean {
    const s = this.IO;
    const i = s.hS.mv;
    for (let h = 0; h < i.length; h++)
      for (let e = 0; e < i[h].length; e++)
        if (i[h][e] && t.id !== i[h][e].id)
          if (t instanceof gi) {
            if (F.instance().battleState.ki < 2) return false;
            if (t.Qd === i[h][e].Qd && i[h][e].Zw !== -1)
              return (
                i[h][e].level !== 5
                  ? s.FO(t, h, e)
                  : t.Td === 1 && (s.WO(t), s.XF.delete(t.id)),
                true
              );
          } else if (t instanceof zs) {
            const a = t;
            if (a.type === i[h][e].type && a.level === i[h][e].level) return (s.FO(t, h, e), true);
          } else if (t instanceof ki && i[h][e] instanceof ki && t.level === i[h][e].level)
            return (s.FO(t, h, e), true);
    return false;
  }

  XO(t: any): number {
    const s = this.HO(t.Qd);
    let i = s > 0 ? t.qa + s : 0;
    const h = F.instance().battleState.ki;
    if (h < 2) i *= [0.2, 0.3][h];
    return i;
  }

  YO(t: any): boolean {
    if (F.instance().battleState.ki < 2) return false;
    let s: any[] = [];
    if (F.instance().generals.familyGivenNames.has(t.Qd)) s.push(t.Qd);
    else if (((s = F.instance().generals.mergeCandidates(t.Qd)), s.length === 0)) return false;
    const i = this.IO.hS.mv;
    for (let t2 = 0; t2 < i.length; t2++)
      for (let h = 0; h < i[t2].length; h++) if (i[t2][h] && s.includes(i[t2][h].Qd)) return true;
    return false;
  }

  zO(): void {
    const t = this.IO;
    const s = t.hS.mv;
    const [i, h] = t.jO;
    let e = true;
    for (let a = i; a < s.length; a++) {
      const start = e ? h : 0;
      e = false;
      for (let k = start; k < s[a].length; k++) {
        t.jO[0] = k + 1 >= s[a].length ? a + 1 : a;
        t.jO[1] = k + 1 >= s[a].length ? 0 : k + 1;
        const item = s[a][k];
        if (item) {
          if (this.CO(item)) return;
          if (item instanceof gi) t.ma.push(item);
        }
      }
    }
  }

  HO(t: any): number {
    const s = Ki.instance().OS(t);
    let i = 0;
    for (const c of s) {
      i += this.$O(c);
      for (const [, v] of this.IO.XF) if (v.Qd === c) i += 1;
    }
    return i;
  }

  $O(t: any): number {
    const s = F.instance().soldierPool.ah;
    let i = 0;
    for (let h = 0; h < s.length; h++) for (let e = 0; e < s[h].length; e++) if (s[h][e] === t) i += 1;
    return i;
  }
}

/** AI merge strategy — plans merges + value-ranks the placement order. (`dn`/`Ln`) */
class AIMergeStrategy {
  static KO = ["刀", "骑", "枪", "弓"];
  static sY = 3;
  static iY = 0.62;

  private IO: any;
  constructor(t: any) {
    this.IO = t;
  }

  qO(): void {
    const t = this.IO;
    t.ma = t.ma.sort((a: any, b: any) => b.qa - a.qa);
    for (let s = 0; s < t.ma.length; s++) {
      const i = F.instance().generals.familyGivenNames.get(t.ma[s].Qd);
      if (!i) continue;
      let h = false;
      for (const e of i)
        for (let k = 0; k < t.ma.length; k++)
          if (t.ma[k].Qd === e) {
            if (h) {
              t.WO(t.ma[k]);
              t.ma.splice(k, 1);
              k -= 1;
            } else {
              t.VO.push([t.ma[s], t.ma[k]]);
              t.ma.splice(k, 1);
              if (k < s) s -= 1;
              t.ma.splice(s, 1);
              s -= 1;
              h = true;
            }
            break;
          }
    }
  }

  QO(): void {
    const t: any = F.instance().generals;
    if (!t.Xa) return;
    const s = this.IO;
    const i: any[] = [];
    const h: any[] = [];
    for (const e of s.ma) (t.familyNames.includes(e.Qd) ? i : h).push(e);
    if (i.length !== 0 && h.length !== 0) {
      i.sort((a, b) => b.qa - a.qa);
      h.sort((a, b) => b.qa - a.qa);
      for (let k = 0; k < i.length && h[k]; k++) {
        s.VO.push([i[k], h[k]]);
        console.log("获得一个武将", i[k].Qd + h[k].Qd);
        let e = s.ma.indexOf(i[k]);
        let a = s.ma.indexOf(h[k]);
        s.ma.splice(e, 1);
        if (e < a) a -= 1;
        s.ma.splice(a, 1);
      }
    }
  }

  ZO(): void {
    const i = this.IO;
    i.ma.length = 0;
    for (const t of i.VO) {
      const h = t;
      const e = h.map((x: any) => x.Qd).join("");
      const a = F.instance().generals.generalValues.get(e) ?? 10;
      i.ma.push({ general: h, value: a });
    }
    i.ma.sort((a: any, b: any) => b.value - a.value);
    i.VO.length = 0;
    for (const t of i.ma) i.VO.push(t.general);
    const h = i.hS.mv;
    for (const s of AIMergeStrategy.KO)
      for (const t of h) for (const cell of t) if (cell?.Qd === s) i.VO.push(cell);
  }

  JO(): void {
    const i = this.IO;
    const h = F.instance().map.ue;
    const e = h[0].length / 2;
    const a = F.instance().battleState.ki;
    const n = Array.from({ length: h.length }, () => new Array(e).fill(1));
    const r = { x: 0, y: 0, value: -1 };
    for (let o = 0; o < i.VO.length; o++) {
      const l = i.VO[o] instanceof Array;
      let c: any;
      if (l) {
        const key = i.VO[o].map((x: any) => x.Qd).join("");
        c = i.RO.get(key) ?? i.RO.get("平民");
      } else c = i.RO.get(i.VO[o].Qd);
      r.value = -1;
      for (let t = 0; t < h.length; t++)
        for (let s = 0; s < e; s++) {
          if (h[t][s] !== "1_1" || i.tY[t][s]) continue;
          const score = c[t][s] * n[t][s];
          if (!(score <= r.value))
            if (l) {
              const len = i.VO[o].length;
              let cnt = 0;
              for (let k = 1; k < len; k++)
                if (t + k < h.length && h[t + k][s] === "1_1" && !i.tY[t + k][s]) cnt += 1;
              if (cnt === len - 1) {
                r.x = t;
                r.y = s;
                r.value = score;
              }
            } else {
              r.x = t;
              r.y = s;
              r.value = score;
            }
        }
      if (!(r.value < 0)) {
        if (l) {
          const parts = i.VO[o];
          for (let s = 0; s < parts.length; s++) i.tY[r.x + s][r.y] = parts[s].id;
        } else i.tY[r.x][r.y] = i.VO[o].id;
        if (a >= 2)
          for (let s = 0; s < h.length; s++)
            for (let k = 0; k < e; k++)
              if (Math.abs(s - r.x) + Math.abs(k - r.y) <= AIMergeStrategy.sY) n[s][k] *= AIMergeStrategy.iY;
      }
    }
  }

  hY(): void {
    const s = this.IO;
    const i = s.hS.mv;
    let h = true;
    for (let e = s.eY[0]; e < s.tY.length; e++) {
      const start = h ? s.eY[1] : 0;
      h = false;
      for (let k = start; k < s.tY[e].length; k++) {
        s.eY[0] = k + 1 >= s.tY[e].length ? e + 1 : e;
        s.eY[1] = k + 1 >= s.tY[e].length ? 0 : k + 1;
        const a = s.tY[e][k];
        if (a == null) continue;
        if (s.aY(a)) {
          if (i[e][k]?.id !== a) return void s.nY(a, e, k);
        } else s.tY[e][k] = null;
      }
    }
  }
}

/** Alias. (`Ln`) */
const Ln = AIMergeStrategy;

/** The enemy AI controller. (`mn`) */
export class GeneralAIController extends AIControllerBase {
  ma: any[] = [];
  private rY = 0;
  private oY: any = 1000;
  TO = 0;
  jO = [0, 0];
  eY = [0, 0];
  OO: any[] = [];
  private lY = new Map<any, any>();
  private cY: any[] = [];
  private uY = [
    { x: 2, y: 3 },
    { x: 3, y: 2 },
    { x: 5, y: 2 },
  ];
  XF: Map<number, any> | null = null;
  VO: any[] | null = null;
  private pY = new Map<string, any>();
  RO = new Map<any, any>();
  private yY = 0;
  private fY = 0;
  private gY = 0;
  private dY = false;
  private LY = false;
  private mY = 0;
  step = 1;
  private wY!: AIPlaceStrategy;
  private vY!: AIMergeStrategy;
  private tY!: any[][];
  hS!: any;
  VF!: any;
  private bY!: any;
  private map!: any;

  init(): void {
    super.init();
    if (!this.VO) this.VO = [];
    this.wY = new AIPlaceStrategy(this);
    this.vY = new Ln(this);
    if (!this.tY) {
      const t = F.instance().map.ue;
      this.tY = Array.from(new Array(t.length), () => new Array(t[0].length / 2).fill(null));
    }
    y.instance.on(u.Jt, this, this.kY);
  }

  startGame(): void {
    if (!F.instance().battleState.wi) return;
    const t = F.instance().map.mapIndex;
    const s = F.instance().battleState.ki < 2;
    this.RO = this._Y(t, s);
    this.cY = this.xY(t);
    this.SY();
    this.bY = K.instance().getScene("BattleScene").getChildByName("box");
    this.map = this.bY.getChildByName("map");
    this.hS = wi.instance().Mv(1, false);
    this.VF = wi.instance().Mv(3, false);
    F.instance().battleState.Ki += F.instance().config.ii;
    this.MY();
    this.oY = [2000, 1500, 1000, 500][Math.min(3, Math.max(0, F.instance().battleState.ki))];
    j.instance().register("AICtr", this, this.update);
    Zi.instance().Kx(false);
  }

  refresh(): void {
    const t = en.instance().yF({ type: 2, qd: false });
    if (!t.success) console.warn("AI 刷新失败:", t.reason);
  }

  PY(): void {
    for (let t = 0; t < this.VF.size; t++) {
      const s = this.VF.getItem(t);
      if (s) {
        this.WO(s);
        if (s.Nd) this.XF!.delete(s.id);
      }
    }
    this.VF.removeAll();
  }

  gameOver(): void {
    if (F.instance().battleState.wi) {
      j.instance().unregister("AICtr");
      this.OO.length = 0;
      this.rY = 0;
      this.TO = 0;
      this.jO[0] = 0;
      this.jO[1] = 0;
      this.eY[0] = 0;
      this.eY[1] = 0;
      this.step = 1;
      this.VO!.length = 0;
      this.dY = false;
      this.LY = false;
    }
  }

  update(t: number): void {
    this.rY += t;
    if (this.rY >= this.oY) {
      this.rY = 0;
      this.AY(t);
    }
  }

  AY(_t: number): void {
    if (this.step === 1) {
      if (F.instance().battleState.Ki >= F.instance().battleState.fi) {
        this.refresh();
        this.TO = 0;
        this.step = 2;
      } else {
        if (Math.random() <= F.instance().config.ai[F.instance().battleState.ki]) return void this.EY();
        this.IU();
      }
    } else if (this.step === 2) {
      if (!F.instance().battleState.Yi) F.instance().battleState.Yi = true;
      this.wY.DO();
      if (this.TO >= 5) {
        this.ma.length = 0;
        this.jO[0] = 0;
        this.jO[1] = 0;
        this.step = 3;
      }
    } else if (this.step === 3) {
      if (this.jO[0] < this.hS.mv.length) this.wY.zO();
      else this.step = 4;
    } else if (this.step === 4) {
      this.ma = this.ma.filter((x) => this.aY(x.id) !== null);
      this.VO!.length = 0;
      this.vY.qO();
      this.vY.QO();
      this.vY.ZO();
      for (const t of this.tY) t.fill(null);
      this.vY.JO();
      this.eY[0] = 0;
      this.eY[1] = 0;
      this.step = 5;
    } else if (this.step === 5) {
      if (this.eY[0] < this.tY.length) this.vY.hY();
      else this.step = 1;
    }
  }

  BY(t: number, s: boolean): string {
    return t + (s ? "_s" : "_f");
  }

  _Y(t: number, s: boolean): any {
    const i = this.BY(t, s);
    let h = this.pY.get(i);
    if (!h) {
      h = s ? pn.fO(t) : pn.aO(t);
      this.pY.set(i, h);
    }
    return h;
  }

  xY(t: number): any {
    let s = this.lY.get(t);
    if (!s) {
      s = pn.dO(t);
      this.lY.set(t, s);
    }
    return s;
  }

  SY(): void {
    const t = F.instance().map.Le;
    this.yY = t ? t.length : 0;
    this.fY = Math.floor(0.15 * this.yY);
    this.gY = Math.ceil(0.85 * this.yY);
  }

  UO(t = "1_1", _s?: any): boolean {
    const i = this.hS.mv;
    this.OO.length = 0;
    for (let s = 0; s < i.length; s++)
      for (let h = 0; h < i[s].length; h++)
        if (i[s][h] == null && F.instance().map.ue[s][h] === t) this.OO.push({ x: s, y: h });
    if (this.OO.length === 0) return false;
    const h = F.instance().battleState.ki;
    if (h < 2) return (f.shuffle(this.OO), true);
    const e = F.instance().map.ue;
    const a = F.instance().map.Le!;
    const n = this.yY;
    const r = this.fY;
    const o = this.gY;
    const l = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const c = (t2: number, s2: number, i2: number, h2: number): number => {
      if (!a || n === 0) return 1e9;
      let e2 = 1e9;
      const r2 = h2 > n ? n : h2;
      for (let k = i2 < 0 ? 0 : i2; k < r2; k++) {
        const d = Math.abs(t2 - a[k].x) + Math.abs(s2 - a[k].y);
        if (d < e2) e2 = d;
      }
      return e2;
    };
    const ranked = this.OO.map((cell) => ({
      c: cell,
      SO: l.reduce((acc, [dx, dy]) => {
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        return nx >= 0 && ny >= 0 && nx < e.length && ny < e[0].length && e[nx][ny] === "0_1" ? acc + 1 : acc;
      }, 0),
      PO: c(cell.x, cell.y, r, o),
      IY: h === 3 ? pn.LO(this.RO, cell.x, cell.y, _s) : 0,
    }));
    ranked.sort((t2, s2) =>
      h === 2
        ? s2.SO !== t2.SO
          ? s2.SO - t2.SO
          : t2.PO - s2.PO
        : s2.IY !== t2.IY
          ? s2.IY - t2.IY
          : s2.SO !== t2.SO
            ? s2.SO - t2.SO
            : t2.PO - s2.PO,
    );
    if (h === 2 && ranked.length > 3) {
      const top = ranked.splice(0, Math.min(5, ranked.length));
      f.shuffle(top);
      ranked.unshift(...top);
    }
    this.OO = ranked.map((t2) => t2.c);
    return true;
  }

  aY(t: number): any {
    const s = Ki.instance().Dk(t);
    return s && s.Td !== 0 ? s : null;
  }

  DY(t: any): any {
    const s = wi.instance().Mv(t.Td, t.qd)!.vv(t);
    return s ? { containerType: t.Td, x: s.x, y: s.y } : null;
  }

  nY(t: number, s: number, i: number): boolean {
    const h = this.aY(t);
    if (!h) return false;
    const e = this.DY(h);
    if (!e) return false;
    const a = en.instance().yF({
      type: 1,
      xF: e.containerType,
      SF: e.x,
      bF: e.y,
      vF: 1,
      targetX: s,
      targetY: i,
      qd: h.qd,
    });
    if (!a.success) console.warn("AI 设置士兵位置失败:", a.reason);
    return a.success;
  }

  FO(t: any, s: number, i: number): void {
    this.nY(t.id, s, i);
  }

  WO(t: any): void {
    if (Zi.instance().Px.indexOf(21) >= 0) F.instance().battleState.Ki += t.level;
    if (t.Nd) Ki.instance().gx(t.id);
    else Ki.instance().Lx(t.id);
  }

  kY(): void {
    for (let t = 0; t < F.instance().config.hi.length; t++)
      if (F.instance().battleState.oi === F.instance().config.hi[t]) {
        F.instance().battleState.Ki += F.instance().config.si[F.instance().battleState.ki][t];
        console.log("ai加钱", F.instance().config.si[F.instance().battleState.ki][t]);
        break;
      }
  }

  MY(): void {
    if (!this.XF) this.XF = new Map();
    this.XF.clear();
  }

  IU(): void {
    const t = j.instance().elapsed;
    if (t - this.mY < 5000) return;
    const s = Zi.instance().Ax;
    if (s.length === 0) return;
    const i = s.filter((x) => !x.ek());
    if (i.length !== 0) {
      this.tk(i[f.range(0, i.length, true)]);
      this.mY = t;
    }
  }

  tk(t: any): void {
    rn.GF = this;
    rn.iO = 2;
    let s = rn.HF;
    switch (t.type) {
      case 3:
      case 4:
      case 10:
        s = on.use(t);
        break;
      case 5:
        s = rn.zF(3, 3);
        break;
      case 6:
        s = ln.use(t);
        break;
      case 2:
        s = cn.use(t);
        break;
      case 7: {
        const g = F.instance().map.ue;
        s = rn.zF(f.range(0, g.length, true), f.range(g[0].length / 2, g[0].length, true));
        break;
      }
      case 8:
      case 9:
        s = un.use(t);
    }
    if (s !== rn.HF) {
      console.log("✅AI成功使用道具 -", F.instance().props.Ue[t.type].txt);
      t.tk(s, wi.instance());
    } else console.log("❌AI使用道具失败 -", F.instance().props.Ue[t.type].txt);
  }

  EY(): void {
    if (this.dY) return;
    this.dY = true;
    const t = fn.vO(2, this.RO);
    for (const s of t) y.instance.event(u.At, false, s.x, s.y);
  }

  TY(): void {
    if (this.LY) return;
    this.LY = true;
    Zi.instance().Zx(false, 1).tk(rn.HF);
  }
}

/** Alias. (`mn`) */
export const mn = GeneralAIController;

// Runtime-only import (cycle with placement-mgr resolved lazily inside methods).
import { PlacementMgr as en } from "./placement-mgr";
