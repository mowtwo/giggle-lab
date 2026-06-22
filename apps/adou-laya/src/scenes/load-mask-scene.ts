// LoadMaskScene — a spinner overlay with a 5s auto-close (the bundle's `qr`,
// @regClass K7V1RL0SQeqnS0qn8GuwsA).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~34493-34522. Spins `loadImg` each tick and closes itself after `ap` ms (or on
// `complete`). Opaque field / method names kept verbatim; node refs bound from
// the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { UpdateMgr } from "../core/update-mgr";
import { SceneMgr } from "../core/scene-mgr";


@regClass("K7V1RL0SQeqnS0qn8GuwsA")
export class LoadMaskScene extends Laya.Scene {
  // .ls-bound nodes
  loadImg!: any;

  private rY = 0;
  private ap = 5000;
  private Sq = 10;
  private bq = 0;

  onOpened(_t?: any): void {
    this.rY = 0;
    this.ap = this.ap;
    UpdateMgr.instance().register("loadMask", this, this.update);
  }

  update(t: number): void {
    this.rY += t;
    if (this.rY >= this.ap) SceneMgr.instance().closeScene("LoadMaskScene");
    this.bq += t;
    if (this.bq >= this.Sq) {
      this.bq = 0;
      this.loadImg.rotation += 1;
      if (this.loadImg.rotation >= 360) this.loadImg.rotation = 0;
    }
  }

  complete(): void {
    SceneMgr.instance().closeScene("LoadMaskScene");
  }

  onClosed(_t?: any): void {
    UpdateMgr.instance().unregister("loadMask");
  }
}
