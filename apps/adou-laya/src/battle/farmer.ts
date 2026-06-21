// Farmer — the gold-economy unit (`ki`) + its state enum (`vi`).
//
// Faithful reconstruction of the bundle's `ki` (reconstruction/reference/
// bundle.pretty.js lines ~11811-12043). A farmer grows crops on a farm tile
// (periodic gold) or mines a gold tile in a faster "crazy" mode; both animate
// the hoe + crop sprite and emit gold popups. Opaque field names kept verbatim.
//
//   FarmerState=vi  growTimer=Bv  growMax=Av  crazyInterval=Ev  perLevelGrowMax=Iv
//   crops=Tv  hoe=Dv  body=hL  produceGold=Ov  swing=Fv

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Soldier } from "./soldier";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { LayerZ } from "../core/layer-z";
import { EffectMgr } from "./effect-mgr";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const X = LayerZ;
const q = EffectMgr;

/** Farmer behaviour states. (`vi`) */
export const FarmerState = {
  none: "none",
  framing: "FarmerFraming",
  crazy: "FarmerCrazy",
} as const;

export class Farmer extends Soldier {
  objectType = 4;
  private Av = 20000;
  private Ev = 1000;
  private Bv = 0;
  private gold = 1;
  private step = 0;
  private fL = 1;
  private Iv = [20000, 10000, 5000, 3000, 2000];
  private Dv: any;
  private Tv: any;

  constructor() {
    super();
    this.objectType = 4;
    this.Av = 20000;
    this.Ev = 1000;
    this.Bv = 0;
    this.gold = 1;
    this.step = 0;
    this.fL = 1;
    this.Qd = "农";
    this.Iv = [20000, 10000, 5000, 3000, 2000];
  }

  protected Zd(_t?: any): void {
    this.id = F.instance().incCounter();
    this.Yn.name = "farmer_" + this.id;
    if (!this.hL) {
      this.hL = new Laya.Image();
      this.hL.name = "img";
      this.hL.skin = "resources/img/gameObject/soldier/farmer.png";
      this.hL.size(this.dg.map.gridWid, this.dg.map.gridHei);
      this.hL.anchorX = 0.425;
      this.hL.anchorY = 0.775;
    }
    this.hL.pos(34, 62);
    this.Yn.addChild(this.hL);
    if (!this.Dv) {
      this.Dv = new Laya.Image("resources/img/gameObject/soldier/hoe.png");
      this.Dv.size(this.dg.map.gridWid, this.dg.map.gridHei);
      this.Dv.anchorX = 0.5;
      this.Dv.anchorY = 0.45;
    }
    this.Yn.addChild(this.Dv);
    this.Dv.pos(40, 36);
    if (!this.Tv) {
      this.Tv = new Laya.Image("resources/img/gameObject/soldier/crops0.png");
      this.Tv.size(this.dg.map.gridWid, this.dg.map.gridHei);
    }
    this.Tv.visible = false;
    this.Tv.zIndex = -1;
    this.Yn.addChild(this.Tv);
    this.Tv.pos(0, 0);
    this.Rv();
  }

  update(t: number): void {
    if (this.currentState !== (FarmerState as any).Cv && "skip" !== this.currentState) this.Uv(t);
  }

  protected sL(t: string): void {
    this.step = 1;
    this.Fv();
    if (t === "FarmerFraming") {
      this.Tv.visible = true;
      this.Bv = 0;
      this.Tv.skin = "resources/img/gameObject/soldier/crops0.png";
      this.Tv.pos(0, 0);
      this.Tv.anchor(0, 0);
      this.Tv.scale(1, 1);
    } else if (t === "FarmerCrazy") {
      this.Tv.visible = true;
      this.jd = true;
      this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
      const cx = this.Cd.x;
      const cy = this.Cd.y;
      y.instance.event(u.Et, this.qd, cx, cy);
      Laya.timer.once(10000, this, () => {
        if (this.currentState === "FarmerCrazy") this.changeState("FarmerFraming");
      });
      this.Tv.skin = "resources/img/gameObject/soldier/goldMine.png";
      this.Tv.pos(this.Yn.width / 2, this.Yn.height / 2);
      this.Tv.anchor(0.5, 0.5);
    } else {
      this.Tv.visible = false;
    }
  }

  protected iL(t: string): void {
    if (t === "FarmerFraming") {
      this.step = 0;
      this.Tv.visible = false;
      Laya.Tween.killAll(this.hL);
      this.hL.scale(1, 1);
      this.hL.rotation = 0;
      this.Dv.rotation = 0;
    }
    if (t === "FarmerCrazy") {
      this.step = 0;
      this.Tv.visible = false;
      Laya.Tween.killAll(this.hL);
      this.hL.scale(1, 1);
      this.hL.rotation = 0;
      this.Dv.rotation = 0;
      this.jd = false;
      this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
    }
  }

  onMoved(): void {
    if (this.Td === 1) {
      const t = this.dg.map.ue[this.Cd.x][this.Cd.y];
      if (t === "2_0" || t === "2_1") this.changeState("FarmerFraming");
      else if (t === "1_0" || t === "1_1") this.changeState("FarmerCrazy");
    } else {
      this.Bv = 0;
      this.changeState("none");
    }
  }

  /** Advance the grow/mine timer. (`Uv`) */
  private Uv(t: number): void {
    this.Bv += t;
    if (this.currentState === "FarmerFraming") {
      if (this.step === 1) {
        if (this.Bv >= this.Av / 6) {
          this.step = 2;
          this.Tv.skin = "resources/img/gameObject/soldier/crops1.png";
        }
      } else if (this.step === 2) {
        if (this.Bv >= this.Av / 3) {
          this.step = 3;
          this.Tv.skin = "resources/img/gameObject/soldier/crops2.png";
        }
      } else if (this.step === 3) {
        if (this.Bv >= this.Av * (2 / 3)) {
          this.step = 4;
          this.Tv.skin = "resources/img/gameObject/soldier/crops3.png";
        }
      } else if (this.step === 4) {
        if (this.Bv >= this.Av) {
          this.step = 1;
          this.Bv = 0;
          this.Tv.skin = "resources/img/gameObject/soldier/crops0.png";
          this.Ov();
        }
      }
    } else if (this.currentState === "FarmerCrazy" && this.Bv >= this.Ev) {
      this.Bv = 0;
      this.Ov();
    }
  }

  /** Hoe-swing animation loop. (`Fv`) */
  private Fv(): void {
    const t = this.currentState === "FarmerCrazy" ? -180 : -90;
    const s = this.currentState === "FarmerCrazy" ? 0.3 : 0.1;
    Laya.Tween.create(this.hL)
      .to("scaleX", 1 - s)
      .to("scaleY", 1 + s)
      .to("rotation", -10)
      .duration(300 * this.fL)
      .chain()
      .to("scaleX", 1 + s)
      .to("scaleY", 1 - s)
      .to("rotation", 0)
      .duration(100 * this.fL)
      .then(() => {
        if (this.currentState === "FarmerCrazy") {
          this.Tv.scaleX -= (700 * this.fL) / 10000;
          this.Tv.scaleY -= (700 * this.fL) / 10000;
        }
      }, this)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(300 * this.fL)
      .then(() => {
        this.Fv();
      }, this);
    Laya.Tween.create(this.Dv)
      .to("rotation", t)
      .duration(300 * this.fL)
      .chain()
      .to("rotation", 0)
      .duration(100 * this.fL);
  }

  /** Pay out the accumulated gold. (`Ov`) */
  private Ov(): void {
    Laya.Point.TEMP.x = 40;
    Laya.Point.TEMP.y = -20;
    this.Yn.localToGlobal(Laya.Point.TEMP);
    q.instance().playGoldUp(Laya.Point.TEMP.x, Laya.Point.TEMP.y, this.gold);
    if (this.qd) this.dg.battleState.gold += this.gold;
    else this.dg.battleState.Ki += this.gold;
  }

  cL(t = 1, s = true): void {
    super.cL(t, s);
    if (t > 0) this.event("onLevelChange", [this.level, true]);
    else this.event("onLevelChange", [this.level, false]);
  }

  protected uL(): void {
    this.Av = this.Iv[this.level - 1];
    this.gold = 1;
    this.Rv();
    this.fL = this.Av / this.Iv[0];
  }

  /** Apply the side's gold bonus. (`Rv`) */
  private Rv(): void {
    if ((this.dg.battleState.Ri && this.qd) || (this.dg.battleState.Ci && !this.qd)) this.gold *= 1.2;
    this.gold = Number(this.gold.toFixed(1));
  }

  gameOver(): void {
    y.instance.event(u.j, this.id);
    super.gameOver();
    this.step = 0;
    this.Bv = 0;
    this.gold = 1;
    this.fL = 1;
    this.Av = 20000;
    Laya.Tween.killAll(this.hL);
    this.hL.scale(1, 1);
    this.hL.rotation = 0;
    Laya.Tween.killAll(this.Dv);
    this.Dv.rotation = 0;
    this.Dv.removeSelf();
    this.Tv.removeSelf();
  }
}
