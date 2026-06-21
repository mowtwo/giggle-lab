// Map-background ambient components (the bundle's `Ar`/`Ir`/`Rr`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~31230-31335. These are `Laya.Box` runtime scripts attached to a map's
// background prefab that add ambient motion:
//   MapBg1 (Ar) — occasional girl walking across (mapBg1)
//   MapBg2 (Ir) — no ambient motion (mapBg2)
//   MapBg3 (Rr) — drifting ships + scrolling waves (mapBg3)
// Opaque field / method names kept verbatim; node refs bound from the prefab.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { UpdateMgr } from "../core/update-mgr";
import { MathE } from "../core/math-e";

const j = UpdateMgr;
const f = MathE;

@regClass("I1X2DTP7QtuEKv4qk8ADig")
export class MapBg1 extends Laya.Box {
  private Bz = 0;

  onAwake(): void {}

  onEnable(): void {
    j.instance().register("mapBg1", this, this.update);
  }

  update(t: number): void {
    this.Iz(t);
  }

  Iz(t: number): void {
    this.Bz += t;
    if (this.Bz < 1000) return;
    this.Bz = 0;
    if (Math.random() > 0.3) return;
    const s = new Laya.Image("resources/img/map/mapBg/mapBg1/girl.png");
    s.size(98, 87);
    s.pos(f.range(50, 600), f.range(30, 100));
    const i = s.y / 200;
    s.scale(i, i);
    this.addChild(s);
    const h = Math.random() < 0.5 ? 1 : -1;
    const e = f.range(100, 300);
    s.scaleX = h * s.scaleX;
    Laya.Tween.to(
      s,
      { x: s.x + h * e * i, alpha: 0 },
      30 * e,
      null,
      Laya.Handler.create(this, () => {
        s.destroy();
      }),
    );
  }

  onDisable(): void {
    j.instance().unregister("mapBg1");
  }
}

@regClass("wo_uSxbPRmu2BIwUD9qAEg")
export class MapBg2 extends Laya.Box {
  onAwake(): void {
    void Laya.stage.height;
  }
}

@regClass("zTfXeYvTTjKXRZ9xkCRmsw")
export class MapBg3 extends Laya.Box {
  // .ls-bound nodes
  wave!: any;

  private Dz = 0;
  private Tz = [
    { bB: 119, MB: 109 },
    { bB: 116, MB: 95 },
    { bB: 107, MB: 98 },
  ];
  private Rz: any[] = [];
  private Xz: any;

  onAwake(): void {
    this.Rz = new Array();
    this.Cz();
  }

  onEnable(): void {
    j.instance().register("mapBg3", this, this.update);
  }

  update(t: number): void {
    this.Uz(t);
    this.Fz(t);
  }

  Cz(): void {
    const t = f.range(8, 12, true);
    for (let k = 0; k < t; k++) {
      const idx = f.range(0, 3, true);
      const s = new Laya.Image("resources/img/map/mapBg/mapBg3/ship" + idx + ".png");
      s.size(this.Tz[idx].bB, this.Tz[idx].MB);
      s.anchor(0.5, 1);
      s.pos(f.range(0, 640), f.range(0, 130));
      s.zIndex = s.y;
      const i = 0.2 + (s.y / 130) * 0.4;
      s.scale(i, i);
      s.alpha = 0.5 + (s.y / 130) * 0.5;
      s.rotation = f.range(-5, 5);
      this.addChild(s);
      this.Rz.push({ Oz: s, Yz: 1 });
    }
  }

  Uz(t: number): void {
    for (let h = 0; h < this.Rz.length; h++) {
      const s = this.Rz[h];
      const i = s.Oz;
      i.x -= t / 200;
      if (i.x < -i.width) {
        i.x = 640;
        i.y = f.range(0, 130);
      }
      i.rotation += 0.1 * s.Yz;
      if (i.rotation < -5) s.Yz = 1;
      if (i.rotation > 5) s.Yz = -1;
    }
  }

  Fz(t: number): void {
    for (let s = 0; s < this.wave.numChildren; s++) {
      this.Xz = this.wave.getChildAt(s);
      this.Xz.x -= t / 500;
      if (this.Xz.x <= -this.Xz.width) this.Xz.x += 1126;
    }
  }

  onDisable(): void {
    j.instance().unregister("mapBg3");
  }
}
