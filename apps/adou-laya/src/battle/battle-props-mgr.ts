// BattlePropsMgr — the in-battle props controller (`Zi`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~13843-14135. It owns the live prop instances for a round (`kx`), splits the
// player's owned props into active (`xx`) and passive (`Sx`) lists, rolls the
// AI's props for the round (`tS`), spawns prop instances onto the board (`Kx`),
// relays board events to the relevant props, and drives the shovel-ad heuristic
// (`mx`). The `Bx`/`Ix`/`Dx`/`Tx`/`Rx`/`Cx`/`Ux`/`Fx` arrays back the GM custom
// AI-props debug path (`Ex`). Opaque field / method names kept verbatim.
//
//   live=kx  activeOwned=xx  passiveOwned=Sx  aiAll=bx  aiActive=Mx  aiPassive=Px
//   leveledAi=Ax  gmCustom=Ex  config=Ue

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { MathE } from "../core/math-e";
import { BoardMgr } from "./board-mgr";
import { CellReservationMgr } from "./cell-reservation-mgr";
import { PropsFactory, ShovelProp } from "./props";

const C = Singleton;
const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const f = MathE;
const wi = BoardMgr;
const Oi = CellReservationMgr;
const _i = PropsFactory;
const bi = ShovelProp;

export class BattlePropsMgr extends C {
  kx = new Map<number, any>();
  xx: any[] = [];
  Sx: any[] = [];
  private bx: any[] = [];
  Mx: any[] = [];
  Px: any[] = [];
  Ax: any[] = [];
  private Ex = false;
  private Bx: any[] = [null, null];
  private Ix: any[] = [null, null, null, null, null, null];
  private Dx: any[] = [null, null];
  private Tx: any[] = [null, null, null, null, null, null];
  private Rx: any[] = [1, 1];
  private Cx: any[] = [1, 1, 1, 1, 1, 1];
  private Ux: any[] = [1, 1];
  private Fx: any[] = [1, 1, 1, 1, 1, 1];
  private Ue: any;

  init(): void {
    this.Ue = F.instance().props;
    this.Ox();
    const t = F.instance().player.getPropsData();
    for (const s of t) {
      const type = this.getPropsType(s);
      (this.Yx(type) ? this.xx : this.Sx).push(type);
    }
    y.instance.on(u.Lt, this, this.Xx);
    y.instance.on(u.wt, this, this.Gx);
    y.instance.on(u.vt, this, this.Hx);
    y.instance.on(u.kt, this, this.Wx);
    y.instance.on(u._t, this, this.zx);
  }

  Ox(): void {
    if (F.instance().rank.currentRank.id >= this.Ue.Re) F.instance().player.openProps = true;
  }

  getPropsType(t: any): any {
    return Array.isArray(t) ? t[0] : t;
  }

  jx(): any[] {
    return F.instance()
      .player.getPropsData()
      .map((t: any) => this.getPropsType(t));
  }

  $x(t: number): boolean {
    return F.instance().player.hasProps(t);
  }

  Nx(t: number): number {
    return F.instance().player.getPropsLevel(t);
  }

  qx(): { active: any[]; passive: any[] } {
    const t = F.instance().player.getPropsData();
    const s: any[] = [
      { type: null, level: 1 } as any,
      { type: null, level: 1 } as any,
    ];
    const i: any[] = Array(6)
      .fill(null)
      .map(() => ({ type: null, level: 1 } as any));
    const h: any[] = [];
    const e: any[] = [];
    for (const x of t) {
      const type = this.getPropsType(x);
      this.Yx(type) ? h.push(type) : e.push(type);
    }
    for (let k = 0; k < 2; k++)
      if (k < h.length) {
        const id = h[k];
        s[k] = { type: id, level: this.Ue.isUpgradeable(id) ? this.Nx(id) : 1 };
      }
    for (let k = 0; k < 6; k++)
      if (k < e.length) {
        const id = e[k];
        i[k] = { type: id, level: this.Ue.isUpgradeable(id) ? this.Nx(id) : 1 };
      }
    return { active: s, passive: i };
  }

  Vx(t: any[], s: any[]): void {
    const n: any[] = [];
    for (let k = 0; k < 2; k++)
      if (t[k]?.type != null) {
        const id = t[k].type;
        const lv = t[k].level ?? 1;
        n.push(this.Ue.isUpgradeable(id) ? [id, lv] : id);
      }
    for (let k = 0; k < 6; k++)
      if (s[k]?.type != null) {
        const id = s[k].type;
        const lv = s[k].level ?? 1;
        n.push(this.Ue.isUpgradeable(id) ? [id, lv] : id);
      }
    F.instance().player.setPropsData(n);
    this.xx.length = 0;
    this.Sx.length = 0;
    for (const x of F.instance().player.getPropsData()) {
      const type = this.getPropsType(x);
      (this.Yx(type) ? this.xx : this.Sx).push(type);
    }
  }

  Qx(t: number): number {
    for (const s of this.kx)
      if (s[1].type == t && !s[1].qd) {
        console.log("打印ai等级", s[1].level);
        return s[1].level;
      }
    return 1;
  }

  Zx(t: any, s: number, i = 0, h = 0, e = 0, a = 1): any {
    const n = _i.instance().ng(s);
    n.init(t, s);
    this.kx.set(n.id, n);
    if (this.Ue.isUpgradeable(s)) n.jv(a);
    if (i !== 0) {
      e = this.Yx(s) ? 0 : 1;
      wi.instance().Mv(i, t)!.setItem(n, h, e);
      n.setParent(i, h, e);
    }
    return n;
  }

  Xx(t: number): void {
    this.kx.get(t).gameOver();
    _i.instance().recover(t);
    this.kx.delete(t);
  }

  Yx(t: number): boolean {
    return this.Ue.Ue[t].cd !== -1;
  }

  Kx(t: any): void {
    let h: any[];
    let e: any[];
    if (t) {
      if (this.jx().length <= 0) return;
      h = this.xx;
      e = this.Sx;
    } else if (this.Ex) {
      h = this.Dx.filter((x) => x !== null);
      e = this.Tx.filter((x) => x !== null);
    } else {
      const src = t ? this.jx() : this.bx;
      if (src.length <= 0) return;
      h = this.Mx;
      e = this.Px;
    }
    if (h.length === 0 && e.length === 0) return;
    // 改造:主动技能栏仅 2 槽,且铲子(0)/推土车(1)是 shovelAd 救场道具,
    // 不能进常规技能栏(否则 setItem 越界 / BulldozerProp 初始化崩溃)。
    let slot = 0;
    for (let i = 0; i < h.length; i++) {
      if (h[i] === 0 || h[i] === 1) continue;
      if (slot >= 2) break;
      let lv: number;
      if (t) lv = this.Ue.isUpgradeable(h[i]) ? this.Nx(h[i]) : 1;
      else if (this.Ex && this.Ux[i] != null) lv = this.Ue.isUpgradeable(h[i]) ? this.Ux[i] : 1;
      else if (this.Ue.isUpgradeable(h[i])) {
        const max = this.Ue.Ue[h[i]].Xe?.length || 1;
        lv = f.range(1, max + 1, true);
      } else lv = 1;
      const a = this.Zx(t, h[i], 4, slot, 0, lv);
      if (!t && a.zv) this.Ax.push(a);
      slot++;
    }
    // 改造:被动技能栏仅 6 槽,超出忽略,避免 setItem 越界崩溃。
    let pslot = 0;
    for (let s = 0; s < e.length; s++) {
      if (pslot >= 6) break;
      let lv: number;
      if (t) lv = this.Ue.isUpgradeable(e[s]) ? this.Nx(e[s]) : 1;
      else if (this.Ex && this.Fx[s] != null) lv = this.Ue.isUpgradeable(e[s]) ? this.Fx[s] : 1;
      else if (this.Ue.isUpgradeable(e[s])) {
        const max = this.Ue.Ue[e[s]].Xe?.length || 1;
        lv = f.range(1, max + 1, true);
      } else lv = 1;
      this.Zx(t, e[s], 4, pslot, 1, lv);
      pslot++;
    }
  }

  Jx(): number[] {
    const t = this.jx();
    const s: number[] = [];
    for (let i = 0; i < this.Ue.Ue.length; i++) {
      if (i === 0 || i === 1) continue;
      const h = i;
      const e = t.indexOf(h) !== -1;
      if (this.Ue.isUpgradeable(h)) {
        if (!e || this.Nx(h) < this.Ue.Ue[h].Xe.length) s.push(h);
      } else if (!e) s.push(h);
    }
    return s;
  }

  Gx(t: any): void {
    for (const s of this.kx)
      if (s[1].type == 1 && t == s[1].qd) {
        if (s[1].vk) s[1].vk();
        break;
      }
  }

  zx(t: any): void {
    for (const s of this.kx)
      if (s[1].type == 20 && t == s[1].qd) {
        if (s[1].z_) s[1].z_();
        break;
      }
  }

  Hx(t: any, s: any, i: any): void {
    for (const x of this.kx) {
      if (x[1].type != 9) continue;
      x[1].e_(s, i);
    }
  }

  Wx(t: any, s: any, i: any, h: any): void {
    for (const e of this.kx) {
      if (e[1].type != 8) continue;
      if (t != e[1].qd) continue;
      e[1].e_(s, i, h);
    }
  }

  tS(): void {
    if (!F.instance().player.openProps) return;
    if (this.Ex) {
      const t = this.Dx.filter((x) => x !== null);
      const s = this.Tx.filter((x) => x !== null);
      this.Mx = t;
      this.Px = s;
      this.bx = t.concat(s);
      console.log("使用GM自定义AI道具", this.bx);
      return;
    }
    const t =
      F.instance().player.roundDay >= this.Ue.ta.length
        ? this.Ue.ta.length - 1
        : F.instance().player.roundDay;
    const s = j.instance().daysSinceRegister() > 1 ? this.Ue.ta[t] : this.Ue.Je[t];
    const i = f.range(s[0], s[1] + 1, true);
    const h = f.range(
      Math.max(0, i - this.Ue.Ke),
      Math.min(i + 1, this.Ue.Ze + 1),
      true,
    );
    const e = i - h;
    this.Mx = f.sample(this.Ue.$e, h);
    this.Px = f.sample(this.Ue.Ne, e);
    this.bx = this.Mx.concat(this.Px);
    console.log("打印ai道具", h, e, this.bx);
  }

  addProps(t: number): void {
    const s = this.Ue.isUpgradeable(t);
    if (s && this.$x(t)) {
      const lv = this.Ue.Ue[t].Xe.length;
      if (F.instance().player.upgradeProps(t, lv))
        for (const [, i] of this.kx)
          if (i.type === t && i.qd) {
            i.jv(this.Nx(t));
            break;
          }
      return;
    }
    F.instance().player.addProps(t, 1, s);
    this.Yx(t) ? this.xx.push(t) : this.Sx.push(t);
  }

  sS(t: number): void {
    this.Yx(t)
      ? this.xx.splice(this.xx.indexOf(t), 1)
      : this.Sx.splice(this.Sx.indexOf(t), 1);
    F.instance().player.removeProps(t);
    this.Kn(t);
  }

  Kn(t: number): void {
    F.instance().nerfLowPrProp(t);
  }

  mx(): void {
    if (F.instance().map.me) return;
    const t: any = wi.instance().Mv(1);
    const s: any = wi.instance().Mv(3);
    const i = F.instance().map.ue;
    for (let row = 0; row < t.dv.length; row++)
      for (let col = 5; col < t.dv[row].length; col++)
        if (i[row][col] == "1_0" && !t.mv[row][col])
          return void y.instance.event(u.Ot, false, 0);
    for (let k = 0; k < s.Lv.length; k++)
      if (s.mv[k] instanceof bi) return void y.instance.event(u.Ot, false, 0);
    const h = Oi.instance();
    let e = 0;
    for (let k = 0; k < s.mv.length; k++) if (h.M_(true, k)) e += 1;
    if (e > 2) e = 2;
    if (e < 1) y.instance.event(u.Ot, false, 0);
    else {
      y.instance.event(u.Ot, true, 0, e);
      console.log("显示铲子广告");
    }
  }

  iS(t: any, s: number): boolean {
    if (t) return F.instance().player.hasProps(s);
    for (const i of this.kx) if (i[1].type == s && i[1].qd == t) return true;
    return false;
  }

  gameOver(_t?: any): void {
    for (const t of this.kx) this.Xx(t[0]);
    this.kx.clear();
    this.Ox();
    this.Ax.length = 0;
  }
}
