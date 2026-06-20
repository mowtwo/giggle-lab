// MathE — static math / geometry / random helpers.
//
// Faithful reconstruction of the original bundle's `f` class
// (reconstruction/reference/bundle.pretty.js, lines ~155-460). All arithmetic is
// copied verbatim from the bundle; only identifiers are de-mangled. Names are
// derived from behaviour and from the embedded error strings ("[MathE].range()",
// "[MathE.weightedRandom]"). The original minified name for each member is noted
// so the port can be audited against the bundle:
//
//   distance=Ss  distanceSq=bs  range  weightedRandom=Ms  weightedIndex=Ps
//   circleRectOverlap=As  rotateOffset=Es  angle  normalizeDeg=Is  deltaAngle=Ds
//   bezierTangentRad=Ts  bezierTangentDeg=Rs  quadraticBezierPoint=Cs
//   quickSort=Us  pointInPolygon=Fs  shuffle=Os  startOfDay=Ys  daysBetween=Xs
//   angleToDirection=Gs  isEven=Hs  pointAtAngle=Ws  pointAtAngle2=zs
//   lineRectIntersections=js  setColor  rectOverlap=$s  sample=Ns  rgbToHex=qs
//   distribute=Vs  lookupZs=Qs  formationGridCell=Ks
//   RAD2DEG=Bs  formationCol=Js  formationRow=ti  zsTable=Zs

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Vec2Like {
  x: number;
  y: number;
}

export class MathE {
  /** Radians-to-degrees constant (`Bs`). */
  static readonly RAD2DEG = 180 / Math.PI;

  // Formation lookup tables. formationGridCell(i) -> {x: col, y: row}; index 1..9
  // maps to a 3x3 grid using columns/rows 3..5. (`Js`/`ti`)
  private static readonly formationCol = [0, 3, 4, 5, 3, 4, 5, 3, 4, 5];
  private static readonly formationRow = [0, 3, 3, 3, 4, 4, 4, 5, 5, 5];
  // lookupZs(i) returns zsTable[i] - 48. (`Zs`/`Qs`)
  private static readonly zsTable = [54, 52, 52, 56, 50, 54, 57, 54, 56, 57, 52];

  /** Euclidean distance between two points. (`Ss`) */
  static distance(a: Vec2Like, b: Vec2Like): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  /** Squared distance between two points. (`bs`) */
  static distanceSq(a: Vec2Like, b: Vec2Like): number {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  }

  /** Random value in [min, max). `asInt` floors the result. (`range`) */
  static range(min: number, max: number, asInt = false): number | null {
    if (max < min) {
      console.error(`[MathE].range(): 错误的输入! [${min},${max})`);
      return null;
    }
    return asInt
      ? Math.floor(min + (max - min) * Math.random())
      : min + (max - min) * Math.random();
  }

  /** Pick an index by weight, with validation. Returns -1 on invalid input. (`Ms`) */
  static weightedRandom(weights: number[]): number {
    if (!weights || weights.length === 0) {
      console.error("[MathE.weightedRandom]: 权重数组不能为空");
      return -1;
    }
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      if (weights[i] < 0) {
        console.warn(
          `[MathE.weightedRandom]: 权重值不能为负数，索引${i}的权重${weights[i]}将被忽略`,
        );
      } else {
        total += weights[i];
      }
    }
    if (total <= 0) {
      console.error("[MathE.weightedRandom]: 所有权重值都为0或负数");
      return -1;
    }
    const r = Math.random() * total;
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      if (!(weights[i] < 0)) {
        acc += weights[i];
        if (r <= acc) return i;
      }
    }
    return weights.length - 1;
  }

  /** Pick an index by weight (no validation). (`Ps`) */
  static weightedIndex(weights: number[]): number | undefined {
    let total = 0;
    for (let i = 0; i < weights.length; i++) total += weights[i];
    const r = Math.random() * total;
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r <= acc) return i;
    }
    return undefined;
  }

  /**
   * Whether a circle of `radius` overlaps an axis-aligned rect. Uses (radius-1)
   * exactly as the original. (`As`)
   */
  static circleRectOverlap(
    radius: number,
    px: number,
    py: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
  ): boolean {
    radius -= 1;
    const left = rx;
    const right = rx + rw;
    const top = ry;
    const bottom = ry + rh;
    const dx = px - Math.max(left, Math.min(px, right));
    const dy = py - Math.max(top, Math.min(py, bottom));
    return dx * dx + dy * dy <= radius * radius;
  }

  /** Offset (w/2, h/2) from (x, y) rotated by `deg`. (`Es`) */
  static rotateOffset(
    x: number,
    y: number,
    w: number,
    h: number,
    deg: number,
  ): Vec2Like {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const hw = w / 2;
    const hh = h / 2;
    return { x: x + hw * cos - hh * sin, y: y + hw * sin + hh * cos };
  }

  /** Compass-style angle in degrees from `from` to `to`. (`angle`) */
  static angle(from: Vec2Like, to: Vec2Like): number {
    const dx = to.x - from.x;
    const dy = from.y - to.y;
    if (dx === 0) return dy >= 0 ? 0 : 180;
    if (dy === 0) return dx > 0 ? 90 : 270;
    return Math.atan2(dx, dy) * this.RAD2DEG;
  }

  /** Normalize an angle to (-180, 180]. (`Is`) */
  static normalizeDeg(deg: number): number {
    deg %= 360;
    if (deg > 180) deg -= 360;
    if (deg < -180) deg += 360;
    return deg;
  }

  /** Signed shortest delta between two angles, in (-180, 180]. (`Ds`) */
  static deltaAngle(from: number, to: number): number {
    let d = to - from;
    d %= 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  /** Tangent angle (radians) of a quadratic Bezier at t. (`Ts`) */
  static bezierTangentRad(
    p0: Vec2Like,
    p1: Vec2Like,
    p2: Vec2Like,
    t: number,
  ): number {
    const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    return Math.atan2(dy, dx);
  }

  /** Tangent angle (degrees) of a quadratic Bezier at t. (`Rs`) */
  static bezierTangentDeg(
    p0: Vec2Like,
    p1: Vec2Like,
    p2: Vec2Like,
    t: number,
  ): number {
    return (180 * this.bezierTangentRad(p0, p1, p2, t)) / Math.PI;
  }

  /** Quadratic Bezier point at t written into `out`. Returns whether t < 1. (`Cs`) */
  static quadraticBezierPoint(
    p0: Vec2Like,
    p1: Vec2Like,
    p2: Vec2Like,
    out: Vec2Like,
    t: number,
  ): boolean {
    const ax = p0.x + (p1.x - p0.x) * t;
    const ay = p0.y + (p1.y - p0.y) * t;
    const bx = p1.x + (p2.x - p1.x) * t;
    const by = p1.y + (p2.y - p1.y) * t;
    out.x = ax + (bx - ax) * t;
    out.y = ay + (by - ay) * t;
    return !(t < 1);
  }

  /** In-place quicksort; logs the result (verbatim behaviour). (`Us`) */
  static quickSort(arr: number[]): void {
    const swap = (a: number[], i: number, j: number) => {
      [a[i], a[j]] = [a[j], a[i]];
    };
    const partition = (a: number[], lo: number, hi: number): number => {
      const mid = Math.floor((lo + hi) / 2);
      if (a[lo] > a[hi]) swap(a, lo, hi);
      if (a[mid] > a[hi]) swap(a, mid, hi);
      if (a[mid] > a[lo]) swap(a, mid, lo);
      const pivot = a[lo];
      let n = lo + 1;
      for (let i = n; i <= hi; i++) {
        if (a[i] <= pivot) {
          swap(a, n, i);
          n++;
        }
      }
      swap(a, lo, n - 1);
      return n - 1;
    };
    const sort = (a: number[], lo: number, hi: number) => {
      if (lo < hi) {
        const p = partition(a, lo, hi);
        sort(a, lo, p - 1);
        sort(a, p + 1, hi);
      }
    };
    sort(arr, 0, arr.length - 1);
    console.log("Sorted array is:", arr);
  }

  /** Ray-cast point-in-polygon over a flat [x0,y0,x1,y1,...] vertex list. (`Fs`) */
  static pointInPolygon(verts: number[], x: number, y: number): boolean {
    let inside = false;
    for (let i = 0; i < verts.length; i += 2) {
      let ax = verts[i];
      let ay = verts[i + 1];
      let bx = verts[i + 2];
      let by = verts[i + 3];
      if (bx == null) bx = verts[0];
      if (by == null) by = verts[1];
      if (ax < x !== bx < x && y < ((by - ay) * (x - ax)) / (bx - ax) + ay) {
        inside = !inside;
      }
    }
    return inside;
  }

  /** Fisher-Yates shuffle in place; returns the same array. (`Os`) */
  static shuffle<T>(arr: T[]): T[] {
    let h = arr.length;
    while (h > 0) {
      const s = Math.floor(Math.random() * h);
      const tmp = arr[h - 1];
      arr[h - 1] = arr[s];
      arr[s] = tmp;
      h--;
    }
    return arr;
  }

  /** Timestamp at the start (00:00:00) of the day containing `time`. (`Ys`) */
  static startOfDay(time: number): number {
    const d = new Date(time);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** Whole days between two timestamps (date-only). (`Xs`) */
  static daysBetween(a: number, b: number): number {
    const da = new Date(a);
    da.setHours(0, 0, 0, 0);
    const db = new Date(b);
    db.setHours(0, 0, 0, 0);
    return Math.floor(Math.abs(da.getTime() - db.getTime()) / 864e5);
  }

  /** Unit direction vector for a compass-style angle (0 = up). (`Gs`) */
  static angleToDirection(deg: number, out: any = new Laya.Vector2()): any {
    deg = deg < 0 ? deg - 360 * Math.floor(deg / 360) : deg % 360;
    let rad = (deg / 180) * Math.PI;
    if (deg <= 90) return out.setValue(Math.sin(rad), -Math.cos(rad));
    if (deg <= 180) {
      rad -= Math.PI / 2;
      return out.setValue(Math.cos(rad), Math.sin(rad));
    }
    if (deg <= 270) {
      rad -= Math.PI;
      return out.setValue(-Math.sin(rad), Math.cos(rad));
    }
    if (deg <= 360) {
      rad -= 1.5 * Math.PI;
      return out.setValue(-Math.cos(rad), -Math.sin(rad));
    }
    return undefined;
  }

  /** Whether `n` is even. (`Hs`) */
  static isEven(n: number): boolean {
    return n % 2 === 0;
  }

  /** Point `dist` away from `p` at angle `deg`. (`Ws`) */
  static pointAtAngle(p: Vec2Like, dist: number, deg: number): Vec2Like {
    const rad = (deg * Math.PI) / 180;
    return { x: p.x + dist * Math.cos(rad), y: p.y + dist * Math.sin(rad) };
  }

  /** Duplicate of pointAtAngle in the original bundle. (`zs`) */
  static pointAtAngle2(p: Vec2Like, dist: number, deg: number): Vec2Like {
    const rad = (deg * Math.PI) / 180;
    return { x: p.x + dist * Math.cos(rad), y: p.y + dist * Math.sin(rad) };
  }

  /**
   * Intersection points of an infinite line (through (px,py) at `deg`) with an
   * axis-aligned rect, sorted by distance from (px,py), deduplicated. (`js`)
   */
  static lineRectIntersections(
    px: number,
    py: number,
    deg: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
  ): Vec2Like[] {
    const cos = Math.cos(deg * (Math.PI / 180));
    const sin = Math.sin(deg * (Math.PI / 180));
    if (Math.abs(cos) < 1e-10) {
      return px < rx || px > rx + rw
        ? []
        : [
            { x: px, y: ry },
            { x: px, y: ry + rh },
          ];
    }
    if (Math.abs(sin) < 1e-10) {
      return py < ry || py > ry + rh
        ? []
        : [
            { x: rx, y: py },
            { x: rx + rw, y: py },
          ];
    }
    const hits: Vec2Like[] = [];
    const yAtLeft = py + ((rx - px) / cos) * sin;
    if (yAtLeft >= ry && yAtLeft <= ry + rh) hits.push({ x: rx, y: yAtLeft });
    const yAtRight = py + ((rx + rw - px) / cos) * sin;
    if (yAtRight >= ry && yAtRight <= ry + rh) hits.push({ x: rx + rw, y: yAtRight });
    const xAtTop = px + ((ry - py) / sin) * cos;
    if (xAtTop >= rx && xAtTop <= rx + rw) hits.push({ x: xAtTop, y: ry });
    const xAtBottom = px + ((ry + rh - py) / sin) * cos;
    if (xAtBottom >= rx && xAtBottom <= rx + rw) hits.push({ x: xAtBottom, y: ry + rh });

    const unique: Vec2Like[] = [];
    const seen = new Set<string>();
    hits.forEach((pt) => {
      const key = `${pt.x.toFixed(5)},${pt.y.toFixed(5)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(pt);
      }
    });
    unique.sort(
      (a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py),
    );
    return unique;
  }

  /** Apply a single-color ColorFilter to a display object; returns the filter. (`setColor`) */
  static setColor(target: any, color: string): any {
    const c = Laya.ColorUtils.create(color).arrColor;
    const matrix = [
      c[0], 0, 0, 0, 0,
      0, c[1], 0, 0, 0,
      0, 0, c[2], 0, 0,
      0, 0, 0, 1, 0,
    ];
    const filter = new Laya.ColorFilter(matrix);
    target.filters = [filter];
    return filter;
  }

  /** Axis-aligned rect overlap test. (`$s`) */
  static rectOverlap(
    x: number,
    y: number,
    w: number,
    h: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number,
  ): boolean {
    return x < x2 + w2 && x + w > x2 && y < y2 + h2 && y + h > y2;
  }

  /** Random sample of `count` items. `allowRepeat` permits duplicates. (`Ns`) */
  static sample<T>(arr: T[], count: number, allowRepeat = false): T[] {
    if (!arr || arr.length === 0 || count <= 0) return [];
    if (count > arr.length && !allowRepeat) {
      return [...arr].sort(() => Math.random() - 0.5);
    }
    if (allowRepeat) {
      const out: T[] = [];
      for (let i = 0; i < count; i++) {
        out.push(arr[Math.floor(Math.random() * arr.length)]);
      }
      return out;
    }
    const pool = [...arr];
    for (let i = 0; i < count; i++) {
      const j = Math.floor(Math.random() * (pool.length - i)) + i;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  /** Float (0..1) RGB(A) to a `#rrggbb`/`#rrggbbaa` hex string. (`qs`) */
  static rgbToHex(r: number, g: number, b: number, a = 1): string {
    const channel = (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      return Math.round(255 * clamped)
        .toString(16)
        .padStart(2, "0");
    };
    const hex = `#${channel(r)}${channel(g)}${channel(b)}`;
    return a >= 1 ? hex : `${hex}${channel(a)}`;
  }

  /** Split `total` into `parts` near-equal integer buckets (remainder front-loaded). (`Vs`) */
  static distribute(total: number, parts: number): number[] {
    const out: number[] = [];
    const base = Math.floor(total / parts);
    for (let i = 0; i < parts; i++) out.push(base + (i < total % parts ? 1 : 0));
    return out;
  }

  /** zsTable[index] - 48 (purpose tied to its caller; behaviour preserved). (`Qs`) */
  static lookupZs(index: number): number {
    return this.zsTable[index] - 48;
  }

  /** 3x3 formation grid cell for slot `index` (1..9). (`Ks`) */
  static formationGridCell(index: number): Vec2Like {
    return { x: this.formationCol[index], y: this.formationRow[index] };
  }
}
