// AI prop-use targeting strategies (the bundle's `nn`/`rn` base + `on`/`ln`/
// `cn`/`un`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~25961-26233. `PropUseBase` (nn/rn) holds the shared targeting toolkit used
// when the AI decides where to drop a prop: scan the board (`qF`/`QF`/`ZF`),
// scan the enemy path (`KF`), test attack overlap (`tO`/`JF`), and probe outward
// from a preferred lane index for a valid cell (`sO`). The four concrete
// strategies override `WF` for each prop family:
//   on — buff/target the strongest unit (prop types 3/4/10)
//   ln — target a ranged unit, weighted by reachable enemies (type 6)
//   cn — target the weakest enemy unit (type 2)
//   un — target a path cell (types 8/9)
// The `iO` mode (0 random / 1 weighted / 2 optimal) scales with difficulty.
// Opaque method / field names kept verbatim — they encode AI heuristics.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { MathE } from "../core/math-e";
import { EntityRegistry } from "./entity-registry";
import { Soldier } from "./soldier";
import { BaseSoldier } from "./base-soldier";
import { GeneralPart } from "./general-part";
import { BowSoldier } from "./soldier-types";
import { General } from "./general";

const F = GameMgr;
const f = MathE;
const Ki = EntityRegistry;
const Ws = Soldier;
const zs = BaseSoldier;
const gi = GeneralPart;
const ci = BowSoldier;
const va = General;
const an = Laya.Point;

/** Shared AI prop-targeting toolkit. (`nn`/`rn`) */
export class PropUseBase {
  static iO = 0;
  static GF: any = null;
  static Mo = new an(0, 0);
  static Po = new an(0, 0);
  static hO: any[] = [];
  static jF: any = { containerType: 0, x: 0, y: 0 };
  static HF: any = null;
  static yd = 0;
  static fd = 0;

  static use(s: any): any {
    if (!PropUseBase.GF) {
      console.error("PropUseBase.use: aiCtr == null");
      return PropUseBase.HF;
    }
    const i = F.instance().map;
    PropUseBase.yd = i.gridWid;
    PropUseBase.fd = i.gridHei;
    return (this as any).WF(s);
  }

  static WF(_s: any): any {
    return PropUseBase.HF;
  }

  static zF(s: number, i: number, h = true): any {
    PropUseBase.jF.containerType = h ? 2 : 1;
    PropUseBase.jF.x = s;
    PropUseBase.jF.y = i;
    return PropUseBase.jF;
  }

  static $F(s: any): any {
    PropUseBase.jF.containerType = s.Td;
    PropUseBase.jF.x = s.Cd.x;
    PropUseBase.jF.y = s.Cd.y;
    return PropUseBase.jF;
  }

  static NF(s: any): any {
    if (s instanceof zs) PropUseBase.$F(s);
    else {
      if (!(s instanceof va)) return PropUseBase.HF;
      PropUseBase.$F(s.va[0]);
    }
    return PropUseBase.jF;
  }

  static qF(s: (t: any) => any, i = Infinity, h = false): any[] {
    const e: any[] = [];
    const a = PropUseBase.GF.hS.mv;
    for (let t = 0; t < a.length; t++)
      for (let k = 0; k < a[t].length; k++) {
        const h2 = a[t][k];
        if (h2 && s(h2) != null) e.push(h2);
      }
    if (h)
      PropUseBase.GF.VF.mv.forEach((t: any) => {
        if (t instanceof Ws && s(t) != null) e.push(t);
      });
    e.sort((t, k) => s(k) - s(t));
    e.length = Math.min(e.length, i);
    return e;
  }

  static QF(s: (t: any) => any, i = Infinity, h = false, e = false): any[] {
    const a: any[] = [];
    const n = PropUseBase.GF.hS.mv;
    const r = Ki.instance().Qk;
    let o = -1;
    for (let t = 0; t < n.length; t++)
      for (let k = 0; k < n[t].length; k++) {
        const e2 = n[t][k];
        if (e2)
          if (e2 instanceof gi) {
            if (e2.Zw == o) continue;
            o = e2.Zw;
            const g = r.get(e2.Zw);
            if (!g || s(g) == null) continue;
            a.push(g);
          } else if (!h && e2 instanceof zs && s(e2) != null) a.push(e2);
      }
    if (e)
      PropUseBase.GF.VF.mv.forEach((t: any) => {
        if (t instanceof zs && s(t) != null) a.push(t);
      });
    a.sort((t, k) => s(k) - s(t));
    a.length = Math.min(a.length, i);
    return a;
  }

  static ZF(s: (t: any) => any, i = Infinity): any[] {
    const h: any[] = [];
    const e = PropUseBase.GF.hS.mv;
    for (let t = 0; t < e.length; t++)
      for (let k = 0; k < e[t].length; k++) {
        const a = e[t][k];
        if (a && a instanceof gi && s(a) != null) h.push(a);
      }
    h.sort((t, k) => s(k) - s(t));
    h.length = Math.min(h.length, i);
    return h;
  }

  static KF(t: (s: any) => any, s = Infinity): any[] {
    const i = F.instance().map.Le!.filter((x: any) => t(x) != null);
    i.sort((x: any, k: any) => t(k) - t(x));
    i.length = Math.min(i.length, s);
    return i;
  }

  static JF(s: number, i: number, _h = false): any[] {
    return PropUseBase.QF((h) => (PropUseBase.tO(h, s, i) ? 0 : null));
  }

  static tO(s: any, i: number, h: number, e = 0): boolean {
    if (s instanceof va)
      PropUseBase.Mo.setTo(
        s.general.x + s.general.width / 2,
        s.general.y + s.general.height / 2,
      );
    else if (s instanceof zs)
      PropUseBase.Mo.setTo(s.Yn.x + s.Yn.width / 2, s.Yn.y + s.Yn.height / 2);
    return (
      f.distanceSq(
        PropUseBase.Mo as any,
        PropUseBase.Po.setTo(
          i * PropUseBase.yd + PropUseBase.yd / 2,
          h * PropUseBase.fd + PropUseBase.fd / 2,
        ) as any,
      ) <= Math.pow(e || s.Da, 2)
    );
  }

  static sO(s: any, i: any[], h: number, e: (t: any) => any): any {
    const a = en.instance();
    if (h < 0 || h >= i.length) h = Math.max(0, Math.min(i.length - 1, h));
    const n = (idx: number) => {
      const item = i[idx];
      const cell = e(item);
      return a.CF(s, cell) ? cell : null;
    };
    let r = n(h);
    if (r) return r;
    for (let t = 1; t < i.length; t++) {
      const lo = h - t;
      if (lo >= 0 && (r = n(lo))) return r;
      const hi = h + t;
      if (hi < i.length && (r = n(hi))) return r;
    }
    return PropUseBase.HF;
  }
}

/** Alias. (`rn`) */
export const rn = PropUseBase;

/** Buff/target the strongest unit. (`on`) — prop types 3/4/10. */
export class PropUseStrongest extends PropUseBase {
  static WF(t: any): any {
    const s = this.QF((x) => x.qa);
    if (!s.length) return rn.HF;
    let i: number;
    switch (rn.iO) {
      case 2:
        i = 0;
        break;
      case 1:
        i = f.weightedRandom(s.map((x) => x.qa));
        break;
      case 0:
      default:
        i = f.range(0, s.length, true);
    }
    return this.sO(t, s, i, (x) => rn.NF(x));
  }
}

/** Target a ranged unit, weighted by reachable enemies. (`ln`) — prop type 6. */
export class PropUseRanged extends PropUseBase {
  static eO(t: any): boolean {
    if (t instanceof va) {
      if (!(t.QE instanceof zs)) return false;
    } else if (!(t instanceof ci)) return false;
    return true;
  }
  static WF(t: any): any {
    let s: any[];
    let i: number;
    switch (this.iO) {
      case 2:
        s = this.QF((x) => {
          if (!this.eO(x)) return null;
          const near = this.KF((c) => (this.tO(x, c.x, c.y) ? 0 : null)).length;
          return (
            (this.KF((c) => (this.tO(x, c.x, c.y, 2 * x.Da) ? 0 : null)).length -
              near) *
            x.qa *
            x.addAttPower
          );
        }, 1);
        if (!s.length) return this.HF;
        i = 0;
        break;
      case 1:
        s = this.QF((x) => (this.eO(x) ? x.qa : null), 1);
        if (!s.length) return this.HF;
        i = 0;
        break;
      case 0:
      default:
        s = this.QF((x) => (this.eO(x) ? x.qa : null));
        if (!s.length) return this.HF;
        i = f.range(0, s.length, true);
    }
    return this.sO(t, s, i, (x) => rn.NF(x));
  }
}

/** Target the weakest enemy unit. (`cn`) — prop type 2. */
export class PropUseWeakest extends PropUseBase {
  static WF(t: any): any {
    const s = this.qF((x) => (x instanceof gi && x.Zw != -1 ? null : -x.qa));
    if (!s.length) return this.HF;
    let i: number;
    switch (this.iO) {
      case 2:
        i = 0;
        break;
      case 1:
        if (s.length != 1) s.length = Math.floor(s.length / 2);
        i = f.weightedRandom(s.map((_x, k) => s.length - k));
        break;
      case 0:
      default:
        i = f.weightedRandom(s.map((_x, k) => s.length - k));
    }
    return this.sO(t, s, i, (x) => rn.$F(x));
  }
}

/** Target a point along the enemy path. (`un`) — prop types 8/9. */
export class PropUsePath extends PropUseBase {
  static WF(t: any): any {
    const s = F.instance().map.Le!;
    let i: number;
    switch (this.iO) {
      case 2: {
        let best = 0;
        let h = -1;
        const e: number[] = [];
        for (let k = 0; k < s.length; k++) {
          const a = s[k];
          let n = 0;
          this.JF(a.x, a.y).forEach((x: any) => (n += x.Ta));
          e.push(n);
          if (n > best) {
            best = n;
            h = k;
          }
        }
        if (best != 0) {
          let tail = 0;
          for (let k = e.length - 1; k >= 0; k--) if (e[k] == 0) tail++;
          const a = s.length - h - tail;
          i = Math.floor(h + a / 2);
        } else i = Math.floor(s.length / 2);
        break;
      }
      case 1: {
        const a: any[] = [];
        let n = false;
        s.forEach((x: any) => {
          let v = 0;
          this.JF(x.x, x.y).forEach((y: any) => (v += y.addAttPower));
          if (v != 0) n = true;
          else if (n) a.push(x);
        });
        i = a.length == 0 ? f.range(0, s.length - 1, true) : f.range(0, a.length - 1, true);
        break;
      }
      case 0:
      default:
        i = f.range(0, s.length - 1, true);
    }
    return this.sO(t, s, i, (x: any) => this.zF(x.x, x.y));
  }
}

/** Aliases matching the bundle's short names. */
export const on = PropUseStrongest;
export const ln = PropUseRanged;
export const cn = PropUseWeakest;
export const un = PropUsePath;

// Late import to avoid an import cycle at module-eval time (sO calls into the
// player placement controller only at runtime).
import { PlacementMgr as en } from "./placement-mgr";
