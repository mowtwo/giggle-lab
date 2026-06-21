// WeaponFragment item + WeaponFragmentMgr (the bundle's `ih` + `hh`/`eh`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~14900-15140. A WeaponFragment tracks collected pieces of a weapon; the
// manager rebuilds the fragment inventory from the player's save, binds complete
// weapons to equip slots, answers inventory queries, and rolls fragment drops.
// Opaque field / method names kept verbatim.
//
//   WeaponFragment=ih  WeaponFragmentMgr=hh/eh  fragments=bb  byType=Mb
//   byWeapon=Pb  byId=Ab  rebuild=Bb  bindEquip=Ib  rollDrop=sM

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { MathE } from "../core/math-e";

const F = GameMgr;
const f = MathE;

/** One weapon's collected fragments. (`ih`) */
export class WeaponFragment {
  weaponId: number;
  private Lb: number;
  name: string;
  rarity: number;
  type: number;
  id: number;
  private mb: number;
  private gb: number;

  constructor(weaponId: number, fragmentNum: number, name: string, rarity: number, type: number, id: number, mb: number, gb = -1) {
    this.gb = -1;
    this.weaponId = weaponId;
    this.Lb = fragmentNum;
    this.name = name;
    this.rarity = rarity;
    this.type = type;
    this.id = id;
    this.mb = mb;
    this.gb = gb;
  }
  get fragmentNum(): number {
    return this.Lb;
  }
  wb(t: number): void {
    this.Lb = t;
  }
  kb(t: number): void {
    this.Lb += t;
  }
  get isComplete(): boolean {
    return this.Lb >= this.mb;
  }
  /** Bound equip slot (-1 = unbound). (`_b`) */
  get _b(): number {
    return this.gb;
  }
  xb(t: number): void {
    this.gb = t;
  }
  get Sb(): boolean {
    return this.gb >= 0;
  }
}

export class WeaponFragmentMgr extends Singleton {
  static Kb = 3;

  private bb: WeaponFragment[] = [];
  private Mb = new Map<number, WeaponFragment[]>();
  private Pb = new Map<number, WeaponFragment[]>();
  private Ab = new Map<number, WeaponFragment>();
  private Eb = 0.065;

  init(): void {
    this.Bb();
    this.Ib();
  }
  refresh(): void {
    this.clearAll();
    this.Bb();
    this.Ib();
  }
  clearAll(): void {
    this.bb.length = 0;
    this.Mb.clear();
    this.Pb.clear();
    this.Ab.clear();
  }

  /** Rebuild the fragment list from the player's saved fragments. (`Bb`) */
  private Bb(): void {
    const t = F.instance().weaponData;
    const s = this.Db();
    let i = 0;
    for (const [h, e] of s) {
      const w = t.getWeapon(h);
      if (!w || w.type === 4) continue;
      const a = w.fragmentNum;
      const n = Math.floor(e / a);
      for (let k = 0; k < n; k++) this.Tb(new WeaponFragment(h, a, w.txt, w.rarity, w.type, i++, a));
      const r = e % a;
      if (r > 0) this.Tb(new WeaponFragment(h, r, w.txt, w.rarity, w.type, i++, a));
    }
    this.Rb();
  }
  private Ib(): void {
    const t = F.instance().player.equip;
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (i >= 0) this.Cb(s, i);
    }
  }
  private Cb(t: number, s: number): void {
    const i = this.Ub(s)
      .filter((x) => x.isComplete && !x.Sb)
      .sort((a, b) => a.id - b.id);
    if (i.length > 0) i[0].xb(t);
  }
  private Tb(t: WeaponFragment): void {
    this.bb.push(t);
    if (!this.Mb.has(t.type)) this.Mb.set(t.type, []);
    this.Mb.get(t.type)!.push(t);
    if (!this.Pb.has(t.weaponId)) this.Pb.set(t.weaponId, []);
    this.Pb.get(t.weaponId)!.push(t);
    this.Ab.set(t.id, t);
  }
  private Rb(): void {
    this.bb.sort((a, b) => b.rarity - a.rarity);
    this.Mb.forEach((t) => t.sort((a, b) => b.rarity - a.rarity));
    this.Pb.forEach((t) => t.sort((a, b) => b.rarity - a.rarity));
  }

  Fb(): WeaponFragment[] {
    return this.bb;
  }
  Ob(t: number): WeaponFragment[] {
    return this.Mb.get(t) || [];
  }
  Ub(t: number): WeaponFragment[] {
    return this.Pb.get(t) || [];
  }
  Yb(t: number): WeaponFragment | undefined {
    return this.Ab.get(t);
  }
  Xb(): WeaponFragment[] {
    return this.bb.filter((t) => t.isComplete);
  }
  Gb(t: number): WeaponFragment[] {
    return this.Ob(t).filter((x) => x.isComplete);
  }
  Hb(t: number, s: number): WeaponFragment[] {
    if (s !== 0) return [];
    const i = F.instance().generals;
    const h = i.generalNames[t];
    const e = i.generalTypes.find((x: any) => x.general === h);
    return e ? this.Ob(e.type) : [];
  }
  private Db(): Array<[number, number]> {
    return F.instance().player.weaponFragments;
  }
  Wb(t: number): number {
    const s = this.Db().find((x) => x[0] === t);
    return s ? s[1] : 0;
  }
  zb(t: number): number {
    const s = this.Wb(t);
    const i = F.instance().weaponData.getWeapon(t);
    return !i || i.fragmentNum <= 0 ? 0 : Math.floor(s / i.fragmentNum);
  }
  jb(t: number, s: number, i = 0): boolean {
    if (i !== 0) return false;
    const h = this.Yb(t);
    if (!h) return false;
    const e = F.instance().generals;
    const a = e.generalNames[s];
    if (a == null) return false;
    const n = e.generalTypes.find((x: any) => x.general === a);
    return !!n && n.type === h.type;
  }
  $b(t: number): boolean {
    return this.zb(t) > 0;
  }
  Nb(): Map<string, number> {
    const t = new Map<string, number>();
    for (const s of this.bb)
      if (s.isComplete && s.Sb) t.set(`${s.weaponId}_${s.id}`, s._b);
    return t;
  }
  qb(t: number): number {
    const s = this.Yb(t);
    return s ? s._b : -1;
  }
  Vb(t: number, s: number, _i?: any): void {
    const h = this.Yb(t);
    if (!h || !h.isComplete) return;
    if (h.Sb && h._b !== s) this.Qb(h._b, t);
    const e = F.instance().player.equip[s];
    if (e >= 0) {
      const list = this.Ub(e);
      for (const item of list)
        if (item.Sb && item._b === s) {
          this.Qb(s, item.id);
          break;
        }
    }
    h.xb(s);
    F.instance().player.setEquip(s, h.weaponId);
  }
  Qb(t: number, s: number): void {
    const i = this.Yb(s);
    if (i && i._b === t) {
      i.xb(-1);
      F.instance().player.setEquip(t, -1);
    }
  }
  /** Whether the player has been registered for at least `Kb` days. (`Zb`) */
  Zb(): boolean {
    const s = F.instance().player.registerTime;
    if (!s) return false;
    return f.daysBetween(s, Date.now()) + 1 >= WeaponFragmentMgr.Kb;
  }
  Jb(): number {
    return WeaponFragmentMgr.Kb;
  }
  setWeaponFragments(t: number, s: number): void {
    const i = F.instance().player;
    const h = F.instance().weaponData.getWeapon(t);
    const e = (h && h.fragmentNum) || 1;
    const a = i.getWeaponFragmentCount(t);
    const n = Math.floor(a / e);
    i.setWeaponFragments(t, s);
    const r = a + s;
    const o = Math.floor(r / e);
    for (let k = 0; k < o - n; k++) i.addNewWeaponId(t);
  }
  /** Give one starter fragment of each base-rarity weapon type. (`tM`) */
  tM(): void {
    const t = F.instance().weaponData;
    const s = [2, 1, 0, 3];
    for (const i of s)
      for (const [id, w] of t.weapons)
        if (w.type === i && w.rarity === 0) {
          this.setWeaponFragments(id, w.fragmentNum);
          break;
        }
  }
  /** Roll a random fragment drop based on the round's rarity weights. (`sM`) */
  sM(): { weaponId: number; fragmentNum: number } {
    if (!this.Zb()) return { weaponId: -1, fragmentNum: 0 };
    const t = F.instance().weaponData;
    const s = F.instance().player.round;
    const i = t.levelThresholds;
    let h = 0;
    for (let k = i.length - 1; k >= 0; k--)
      if (s > i[k]) {
        h = k;
        break;
      }
    const e = t.rarityDropWeights[h].slice();
    e[0] = 0;
    const a = f.weightedRandom(e);
    if (a < 0) return { weaponId: -1, fragmentNum: 0 };
    const n: number[] = [];
    for (const [id, w] of t.weapons) if (w.rarity === a) n.push(id);
    return n.length === 0
      ? { weaponId: -1, fragmentNum: 0 }
      : { weaponId: n[Math.floor(Math.random() * n.length)], fragmentNum: 1 };
  }
  iM(): boolean {
    return !!this.Zb() && Math.random() < this.Eb;
  }
  hM(): void {
    const t = F.instance().battleState.Wi;
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      this.setWeaponFragments(i.weaponId, i.fragmentNum);
    }
  }
  gameOver(t?: boolean): void {
    if (t) this.hM();
  }
}

/** Alias. (`eh`) */
export const eh = WeaponFragmentMgr;
