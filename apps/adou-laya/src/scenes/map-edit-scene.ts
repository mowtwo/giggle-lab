// MapEditScene — a developer map-painter tool (the bundle's `ro`, @regClass
// yS9mPSRtQhKucXkb9gwQjQ).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~35594-35642. Fills the map with grass cells; clicking a cell cycles
// grass(2_0) → space... → road(1_0) → empty(0_0) and the export button prints
// the resulting 2D string array to the console. Opaque field / method names kept
// verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { GameMgr } from "../core/game-mgr";


@regClass("yS9mPSRtQhKucXkb9gwQjQ")
export class MapEditScene extends Laya.Scene {
  // .ls-bound nodes
  getBtn!: any;
  map!: any;

  private result: string[][] = [];

  onOpened(_t?: any): void {
    this.result = new Array();
    this._Q();
    this.getBtn.on(Laya.Event.CLICK, this, this.xQ);
  }

  _Q(): void {
    const t = GameMgr.instance().map.gridWid;
    const s = GameMgr.instance().map.gridHei;
    const i = this.map.width / t;
    const h = this.map.height / s;
    for (let e = 0; e < i; e++) {
      this.result.push([]);
      for (let k = 0; k < h; k++) {
        this.result[e].push("2_0");
        const img = new Laya.Image("resources/img/map/grass_0_0.png");
        img.size(80, 80);
        img.pos(e * t, k * s);
        img.on(Laya.Event.CLICK, this, this.SQ, [e, k]);
        this.map.addChild(img);
      }
    }
  }

  SQ(t: number, s: number, i: any): void {
    const h = i.target;
    if (h.skin === "resources/img/map/grass_0_0.png") {
      h.skin = "resources/img/map/space_0.png";
      this.result[t][s] = "2_0";
    } else if (h.skin === "resources/img/map/space_0.png") {
      h.skin = "resources/img/map/road_0.png";
      this.result[t][s] = "1_0";
    } else if (h.skin === "resources/img/map/road_0.png") {
      h.skin = "resources/img/map/grass_0_0.png";
      this.result[t][s] = "0_0";
    }
  }

  xQ(): void {
    let t = "[\n";
    for (let s = 0; s < this.result.length; s++) {
      t += "[";
      for (let i = 0; i < this.result[s].length; i++)
        t += i !== this.result[s].length - 1 ? `"${this.result[s][i]}",` : `"${this.result[s][i]}"`;
      t += s !== this.result.length - 1 ? "],\n" : "]\n";
    }
    t += "]";
    console.log("打印数据", t);
  }
}
