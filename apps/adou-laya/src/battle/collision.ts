// Oriented-bounding-box (SAT) collision helpers for bullet hit-testing.
//
// Faithful reconstruction of the bundle's `ue` (2D vector), `pe` (SAT box
// projection) and `ye` (separating-axis tester) — reconstruction/reference/
// bundle.pretty.js lines ~19154-19286. `SatCollision` tests two rotated rects
// for overlap, with a cached cos/sin table keyed by integer degrees. Opaque
// field names kept verbatim.
//
//   Vec2=ue  SatBox=pe  SatCollision=ye  rotatedRect=Es  overlap=mB  test=test
//   spriteVsRectWorld=AB  spriteVsRectLocal=EB

/* eslint-disable @typescript-eslint/no-explicit-any */

export class Vec2 {
  x: number;
  y: number;
  constructor(t = 0, s = 0) {
    this.x = t;
    this.y = s;
  }
}

/** Projection box: center + half-extents along two axes. (`pe`) */
export class SatBox {
  lB = new Vec2(0, 0);
  cB = [0, 0];
  uB = [0, 0];
  pB = [0, 0];
  yB = [0, 0];

  set(t: { x: number; y: number }, s: number, i: number, h: number): void {
    this.lB.x = t.x;
    this.lB.y = t.y;
    const e = SatCollision.fB(h);
    const a = e.gB;
    const n = e.dB;
    this.uB[0] = a;
    this.uB[1] = n;
    this.pB[0] = -n;
    this.pB[1] = a;
    this.yB[0] = this.cB[0] = s / 2;
    this.yB[1] = this.cB[1] = i / 2;
  }

  /** Project the box's half-size onto axis (t,s). (`LB`) */
  LB(t: number, s: number): number {
    const [i, h] = this.uB;
    const [e, a] = this.pB;
    const n = Math.abs(t * i + s * h);
    const r = Math.abs(t * e + s * a);
    return this.yB[0] * n + this.yB[1] * r;
  }
}

interface RectSpec {
  x: number;
  y: number;
  bB: number;
  MB: number;
  r: number;
  BB?: number;
  IB?: number;
}

export class SatCollision {
  static kB = Math.PI / 180;
  static DB = new Vec2(0, 0);
  static TB = new Vec2(0, 0);
  static wB: number | null = null;
  static _B = { gB: 0, dB: 0 };
  static vB = { gB: 1, dB: 0 };
  static SB: RectSpec = { x: 0, y: 0, bB: 0, MB: 0, r: 0 };
  static PB: RectSpec = { x: 0, y: 0, bB: 0, MB: 0, r: 0 };
  static RB = new SatBox();
  static CB = new SatBox();

  /** Separating-axis overlap test between two SatBoxes. (`mB`) */
  static mB(t: SatBox, s: SatBox): boolean {
    const i = t.lB.x - s.lB.x;
    const h = t.lB.y - s.lB.y;
    const e = (a: number, b: number) => Math.abs(i * a + h * b);
    const a = t.uB;
    if (t.cB[0] + s.LB(a[0], a[1]) <= e(a[0], a[1])) return false;
    const n = t.pB;
    if (t.cB[1] + s.LB(n[0], n[1]) <= e(n[0], n[1])) return false;
    const r = s.uB;
    if (t.LB(r[0], r[1]) + s.cB[0] <= e(r[0], r[1])) return false;
    const o = s.pB;
    return !(t.LB(o[0], o[1]) + s.cB[1] <= e(o[0], o[1]));
  }

  /** Cached cos/sin for an integer degree. (`fB`) */
  static fB(t: number): { gB: number; dB: number } {
    t = Math.round(t);
    if (t !== this.wB) {
      if (t === 0) return this.vB;
      const s = t * this.kB;
      this._B.gB = Math.cos(s);
      this._B.dB = Math.sin(s);
      this.wB = t;
    }
    return this._B;
  }

  /** Rotated rect anchor → world point. (`Es`) */
  static Es(t: number, s: number, i: number, h: number, e: number, a: Vec2, n?: number, r?: number): void {
    const o = n !== undefined ? n : i / 2;
    const l = r !== undefined ? r : h / 2;
    const c = i / 2 - o;
    const u = h / 2 - l;
    const p = this.fB(e);
    const y = c * p.gB - u * p.dB;
    const f = c * p.dB + u * p.gB;
    a.x = t + o + y;
    a.y = s + l + f;
  }

  static xB(t: any, s: any): boolean {
    this.SB.x = t.x;
    this.SB.y = t.y;
    this.SB.bB = t.width;
    this.SB.MB = t.height;
    this.SB.r = t.rotation;
    this.PB.x = s.x;
    this.PB.y = s.y;
    this.PB.bB = s.width;
    this.PB.MB = s.height;
    this.PB.r = s.rotation;
    return this.test(this.SB, this.PB);
  }

  /** Sprite (with parent transform) vs a rect spec. (`AB`) */
  static AB(t: any, s: RectSpec): boolean {
    Laya.Point.TEMP.setTo(t.parent.x + t.x - t.pivotX, t.parent.y + t.y - t.pivotY);
    this.SB.x = Laya.Point.TEMP.x;
    this.SB.y = Laya.Point.TEMP.y;
    this.SB.bB = t.width * t.scaleX * t.parent.scaleX;
    this.SB.MB = t.height * t.scaleY * t.parent.scaleY;
    this.SB.r = t.rotation;
    return this.test(this.SB, s);
  }

  /** Sprite (local) vs a rect spec. (`EB`) */
  static EB(t: any, s: RectSpec): boolean {
    const i = this.SB;
    i.x = t.x - t.pivotX;
    i.y = t.y - t.pivotY;
    i.bB = t.width * t.scaleX;
    i.MB = t.height * t.scaleY;
    i.r = t.rotation;
    i.BB = t.pivotX;
    i.IB = t.pivotY;
    return this.test(i, s);
  }

  static test(t: RectSpec, s: RectSpec): boolean {
    this.Es(t.x, t.y, t.bB, t.MB, t.r, this.DB, t.BB, t.IB);
    this.Es(s.x, s.y, s.bB, s.MB, s.r, this.TB, s.BB, s.IB);
    this.RB.set(this.DB, t.bB, t.MB, t.r);
    this.CB.set(this.TB, s.bB, s.MB, s.r);
    return this.mB(this.RB, this.CB);
  }

  static UB(t: RectSpec): void {
    console.log("x", t.x, "y", t.y, "wei", t.bB, "hei", t.MB, "r", t.r);
  }
}
