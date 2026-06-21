// GeneralPart — a single general-character tile that merges into a General.
//
// Faithful reconstruction of the bundle's `gi` (reconstruction/reference/
// bundle.pretty.js lines ~11274-11440). Extends Soldier: renders the character
// portrait tile, plays the "waiting to merge" sleep animation, the level-up
// flourish, and emits the merge/disband events the EntityRegistry listens for.
// Opaque field names kept verbatim.
//
//   mergedGeneralId=Zw  portrait=hL  levelUpEff=Jw  sleepEff=sv  zEffs=nv
//   playLevelUp=uL  sleepLoop=tv  sleepZ=ev  showSleep=iv  hideSleep=hv

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Soldier } from "./soldier";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;

export class GeneralPart extends Soldier {
  /** id of the merged General this part belongs to (-1 = none). (`Zw`) */
  Zw = -1;
  objectType = 3;
  private Kw = 1;
  private Jw: any;
  private sv: any;
  private nv: any[] | undefined;

  protected Zd(_t?: any): void {
    this.id = F.instance().incCounter();
    this.Yn.name = "generalPart_" + this.id;
    if (!this.hL) {
      this.hL = new Laya.Image();
      this.hL.name = "img";
      this.hL.size(F.instance().map.gridWid, F.instance().map.gridHei);
      this.hL.anchorX = 0.5;
      this.hL.anchorY = 0.5;
      this.hL.pos(F.instance().map.gridWid / 2, F.instance().map.gridHei / 2);
    }
    this.Yn.addChild(this.hL);
    this.hL.skin = `resources/img/gameObject/soldier/generalParts_${F.instance().generals.nameChars.indexOf(this.Qd)}.png`;
    this.hL.color = "#cd8831";
  }

  update(): void {}

  /** Level-up flourish. (`uL`) */
  uL(): void {
    if (!this.Jw) {
      this.Jw = new Laya.Image("resources/img/gameObject/soldier/levelUpEff1.png");
      this.Jw.anchorX = 0.5;
      this.Jw.anchorY = 1;
    }
    this.Jw.pos(40, 80);
    this.Jw.size(60, 0);
    this.Jw.alpha = 0;
    this.Yn.addChild(this.Jw);
    Laya.Tween.create(this.Jw)
      .to("height", 80)
      .to("alpha", 1)
      .duration(300)
      .chain()
      .to("y", this.Jw.y - 30)
      .to("alpha", 0)
      .duration(100);
  }

  /** Idle "breathing/sleep" loop on the portrait. (`tv`) */
  tv(): void {
    const t = this.hL.rotation;
    Laya.Tween.create(this.hL)
      .to("rotation", t - 5)
      .to("scaleX", 1.06)
      .to("scaleY", 0.9)
      .duration(660)
      .chain()
      .to("rotation", t - 5)
      .to("scaleX", 1.11)
      .to("scaleY", 0.87)
      .duration(660)
      .chain()
      .to("rotation", t)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(660)
      .then(this.tv, this);
    Laya.Tween.create(this.sv)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(1320)
      .chain()
      .to("scaleX", 0)
      .to("scaleY", 0)
      .duration(660);
  }

  changeState(t: string): void {
    super.changeState(t);
  }

  protected sL(t: string): void {
    if (t === "GeneralPartWait") {
      this.iv();
      this.tv();
    }
  }

  protected iL(t: string): void {
    if (t === "GeneralPartWait") this.hv();
  }

  /** Floating "z" sleep glyph loop. (`ev`) */
  private ev(t: any): void {
    Laya.Tween.create(t)
      .to("x", 60)
      .to("y", 10)
      .to("scaleX", 0.7)
      .to("scaleY", 0.7)
      .to("rotation", 13)
      .duration(800)
      .chain()
      .to("x", 40)
      .to("y", 0)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .to("rotation", -15)
      .duration(800)
      .chain()
      .to("x", 70)
      .to("y", -20)
      .to("scaleX", 0)
      .to("scaleY", 0)
      .to("rotation", 20)
      .duration(1200)
      .then(() => {
        t.pos(40, 30);
        this.ev(t);
      }, this);
  }

  /** Build + show the sleep effect. (`iv`) */
  private iv(): void {
    let t: any;
    this.hL.anchorY = 1;
    this.hL.y = F.instance().map.gridHei;
    if (!this.sv) {
      this.sv = new Laya.Image("resources/img/gameObject/soldier/sleepEff1.png");
      this.sv.size(31, 27);
      this.sv.pos(50, 30);
      this.sv.anchorY = 1;
    }
    this.Yn.addChild(this.sv);
    this.sv.visible = true;
    this.sv.scale(0, 0);
    if (!this.nv) {
      this.nv = [];
      for (let s = 0; s < 2; s++) {
        t = new Laya.Image("resources/img/gameObject/soldier/z.png");
        t.name = "sleepEff2";
        t.anchorX = 0.5;
        t.anchorY = 0.5;
        this.nv.push(t);
      }
    }
    for (let s = 0; s < this.nv.length; s++) {
      t = this.nv[s];
      t.scale(0, 0);
      t.pos(40, 30);
      this.Yn.addChild(t);
      Laya.timer.once(1400 * s, this, this.ev, [t]);
    }
  }

  /** Tear down the sleep effect. (`hv`) */
  private hv(): void {
    Laya.Tween.killAll(this.hL);
    this.hL.rotation = 0;
    this.hL.scale(1, 1);
    this.hL.anchorY = 0.5;
    this.hL.y = F.instance().map.gridHei / 2;
    if (this.sv) {
      this.sv.removeSelf();
      this.sv.visible = false;
      this.sv.scale(0, 0);
      this.Kw = 1;
      Laya.Tween.killAll(this.sv);
    }
    if (this.nv)
      for (let t = 0; t < this.nv.length; t++) {
        Laya.Tween.killAll(this.nv[t]);
        this.nv[t].removeSelf();
      }
  }

  onMoved(): void {
    if (this.Td === 1 && this.currentState !== "GeneralPartMerge") {
      this.changeState("GeneralPartWait");
      y.instance.event(u.ts, this);
    } else if (this.Td === 3) {
      this.changeState("GeneralPartNone");
    }
  }

  gameOver(): void {
    y.instance.event(u.j, this.id);
    super.gameOver();
    this.Zw = -1;
    if (this.Jw) {
      Laya.Tween.killAll(this.Jw);
      this.Jw.removeSelf();
    }
    this.hv();
  }
}
