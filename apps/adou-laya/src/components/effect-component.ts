// EffectComponent — a generic reusable UI-motion script (the bundle's `Co`,
// @regClass K3e-0XdrRnGaQwVEqKxSSA).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~38582-38923. Attached to any sprite with an `opt` effect type: press-bounce
// (0), idle breathe (1), auto-rotate (2), jitter along facing (3), random-size
// pulse (4), or flicker (5). Plus a set of static fade/scale/fly-particle helpers
// reused across the UI. Opaque field / method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass, property } from "../laya/engine";
import { MathE } from "../core/math-e";

const Io = Laya.Tween;
const Do = Laya.Handler;
const To = Laya.Image;

/** Effect type. (`Ro`) */
export enum Ro {
  点击弹动 = 0,
  自主弹动 = 1,
  自动旋转 = 2,
  自主颤动 = 3,
  随机大小弹动 = 4,
  闪烁 = 5,
}

@regClass("K3e-0XdrRnGaQwVEqKxSSA")
export class EffectComponent extends Laya.Script {
  @property({ type: Ro })
  opt: any;
  @property({ type: Number })
  rotateSpeed = 0;

  private time = 500;
  private D1 = false;
  private c: any;
  private direction: any;

  onStart(): void {
    this.c = this.owner;
    this.option(this.opt);
    console.log("运行", this.opt);
  }

  onUpdate(): void {
    if (Laya.timer.delta > 100) return;
    if (this.D1) this.c.rotation += (this.rotateSpeed * Laya.timer.delta) / 1000;
  }

  option(t: any): void {
    if (t == null) return;
    switch (t) {
      case 0:
      default:
        this.T1();
        break;
      case 1:
        this.R1();
        break;
      case 2:
        this.rotate();
        break;
      case 3:
        this.direction = MathE.angleToDirection(this.c.rotation);
        this.C1();
        break;
      case 4:
        this.O1();
        break;
      case 5:
        this.G1();
    }
  }

  rotate(): void {
    this.D1 = true;
  }

  T1(): void {
    this.c.on(Laya.Event.MOUSE_DOWN, this, (t: number, s: number) => {
      this.c.scaleX = 0.9 * t;
      this.c.scaleY = 0.9 * s;
    }, [1, 1]);
    this.c.on(Laya.Event.MOUSE_UP, this, (t: number, s: number) => {
      this.c.scaleX = t;
      this.c.scaleY = s;
    }, [1, 1]);
    this.c.on(Laya.Event.MOUSE_OUT, this, (t: number, s: number) => {
      this.c.scaleX = t;
      this.c.scaleY = s;
    }, [1, 1]);
  }

  R1(): void {
    const t = this.c.scaleX;
    const s = this.c.scaleY;
    const i = () => {
      Laya.Tween.to(this.c, { scaleX: 1.05 * t, scaleY: 1.05 * s }, this.time, Laya.Ease.sineIn, Laya.Handler.create(this, h));
    };
    const h = () => {
      Laya.Tween.to(this.c, { scaleX: 0.95 * t, scaleY: 0.95 * s }, this.time, Laya.Ease.sineIn, Laya.Handler.create(this, i));
    };
    i();
  }

  C1(): void {
    Laya.Tween.killAll(this.c);
    const t = this.c.x + 10 * this.direction.x;
    const s = this.c.y + 10 * this.direction.y;
    const self = this;
    Laya.Tween.to(
      this.c,
      { x: t, y: s },
      300,
      Laya.Ease.linearNone,
      Laya.Handler.create(this, function (this: EffectComponent) {
        const t2 = this.c.x - 10 * this.direction.x;
        const s2 = this.c.y - 10 * this.direction.y;
        Laya.Tween.killAll(this.c);
        Laya.Tween.to(this.c, { x: t2, y: s2 }, 100, Laya.Ease.linearNone, Laya.Handler.create(self, self.C1));
      }),
    );
  }

  O1(): void {
    const t = () => {
      const scale = MathE.range(0.7, 1.1);
      const dur = 4000 * (scale - this.c.scaleX);
      Io.to(this.c, { scaleX: scale, scaleY: scale }, dur, Laya.Ease.sineIn, Laya.Handler.create(this, s));
    };
    const s = () => {
      const scale = MathE.range(0, 0.25);
      const dur = (2000 / 0.45) * (this.c.scaleX - scale);
      Io.to(this.c, { scaleX: scale, scaleY: scale }, dur, Laya.Ease.sineIn, Laya.Handler.create(this, t));
    };
    t();
  }

  G1(): void {
    this.c.alpha = MathE.range(0, 0.45);
    const t = () => {
      const a = MathE.range(0.8, 1);
      const dur = 4000 * (a - this.c.alpha);
      Io.to(this.c, { alpha: a }, dur, Laya.Ease.sineIn, Laya.Handler.create(this, s));
    };
    const s = () => {
      const a = MathE.range(0, 0.25);
      const dur = (2000 / 0.45) * (this.c.alpha - a);
      Io.to(this.c, { alpha: a }, dur, Laya.Ease.sineIn, Laya.Handler.create(this, t));
    };
    t();
  }

  static H1(t: any, s: number): void {
    t.alpha = 0;
    t.visible = true;
    Io.to(t, { alpha: 1 }, s);
  }

  static W1(t: any, s: number): void {
    t.alpha = 1;
    Io.to(
      t,
      { alpha: 0 },
      s,
      null,
      Do.create(this, () => {
        t.visible = false;
      }),
    );
  }

  static z1(t: any, s: number, i: number): void {
    Io.to(t, { alpha: s }, i);
  }

  static j1(t: any, s: number): void {
    const i = t.scaleX;
    const h = t.scaleY;
    t.scaleX = 0;
    t.scaleY = 0;
    t.visible = true;
    Laya.timer.once(s, this, (node: any) => {
      Laya.Tween.to(node, { scaleX: i, scaleY: h }, 500, Laya.Ease.linearInOut);
    }, [t]);
  }

  static N1(t: any): void {
    const s = t.scaleX;
    const i = t.scaleY;
    t.scaleX = 0;
    t.scaleY = 0;
    t.visible = true;
    Laya.Tween.to(t, { scaleX: s, scaleY: i }, 500, Laya.Ease.linearInOut);
  }

  static q1(t: string, s: any, i: any, h: () => void): void {
    const e = new To(t);
    Laya.stage.addChild(e);
    e.x = s.x;
    e.y = s.y;
    Laya.timer.once(300, this, (node: any) => {
      Io.to(
        node,
        { x: i.x, y: i.y },
        1000,
        null,
        Do.create(this, (n: any) => {
          n.destroy();
          if (h) h();
        }, [node]),
      );
    }, [e]);
  }

  static Q1(t: number, s: string, i: any, h: number, e: number, a: number, n: number, r: any, o: any): void {
    const l = i;
    const c: any[] = [];
    const u = new Laya.Point(h, e);
    const p = new Laya.Point(a, n);
    const y = new Laya.Point();
    const fp = new Laya.Point();
    const g = new Laya.Point();
    let d = 0;
    let _ = 0;
    const w = (t1: number, s1: number, i1: number, h1: number) => {
      const e1 = i1 - t1;
      const a1 = h1 - s1;
      const n1 = Math.sqrt(e1 * e1 + a1 * a1);
      const r1 = (180 * Math.acos(e1 / n1)) / Math.PI;
      return a1 < 0 ? 360 - r1 : a1 === 0 && e1 < 0 ? 180 : r1;
    };
    const v = (t1: number, s1: number, i1: number, h1: number) =>
      Math.sqrt((i1 - t1) * (i1 - t1) + (h1 - s1) * (h1 - s1));
    const k = (vec: any, deg: number) => {
      vec.x = Math.cos((deg * Math.PI) / 180);
      vec.y = Math.sin((deg * Math.PI) / 180);
    };
    const x = (idx: number): void => {
      const item = c[idx];
      c.splice(idx, 1);
      const h1 = item[0];
      h1.scale(1.3, 1.3);
      Laya.Tween.to(
        h1,
        { scaleX: 1, scaleY: 1 },
        100,
        null,
        Laya.Handler.create(this, () => {
          if (r) r();
          _ += 1;
          if (_ === t && o) o();
          h1.destroy();
        }),
      );
    };
    const m = (idx: number): void => {
      const item = c[idx];
      const i1 = item[0];
      let h1 = item[1];
      let e1 = item[2];
      const a1 = item[3];
      if (p.distance(i1.x, i1.y) === 0) return void x(idx);
      let nDeg = w(i1.x, i1.y, p.x, p.y);
      if (Math.abs(e1 - nDeg) >= a1) {
        k(y, nDeg);
        k(fp, e1 - a1);
        k(g, e1 + a1);
        nDeg = e1 + (y.distance(fp.x, fp.y) < y.distance(g.x, g.y) ? -a1 : a1);
      }
      if (d < 10) {
        h1 = 20 - 10 * Laya.Ease.linearNone(d, 0, 1, 10);
        if (d < 5) nDeg = e1;
      } else if (d > 20 && d < 50) h1 = 20 * Laya.Ease.linearNone(d - 20, 0, 1, 30) + 10;
      e1 = nDeg;
      k(y, e1);
      let r1 = i1.x + y.x * h1;
      let o1 = i1.y + y.y * h1;
      const l1 = p.distance(i1.x, i1.y);
      if (v(i1.x, i1.y, r1, o1) > l1) {
        r1 = p.x;
        o1 = p.y;
      }
      i1.x = r1;
      i1.y = o1;
      item[1] = h1;
      item[2] = e1;
    };
    const L = (): void => {
      d++;
      for (let idx = c.length - 1; idx >= 0; idx--) m(idx);
      if (c.length === 0) {
        Laya.timer.clear(this, L);
      }
    };
    (() => {
      const count = Math.min(t, 10);
      for (let idx = 0; idx < count; idx++) {
        const sp = new Laya.Sprite();
        sp.size(50, 50);
        l.addChild(sp);
        sp.loadImage(s);
        sp.pos(u.x, u.y);
        const dist = p.distance(u.x, u.y);
        const speed = Math.max(300 - dist, 0) / 10 + 5;
        c.push([sp, 10, 360 * Math.random(), speed]);
      }
      Laya.timer.frameLoop(1, this, L);
    })();
  }
}
