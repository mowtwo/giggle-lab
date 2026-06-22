// DragVisualMgr — the player's drag/interaction visual layer (the bundle's
// `An`) plus its four pointer-region mappers (`xn`/`Sn`/`bn`/`Mn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~27443-28216. The region mappers translate a stage point into a (containerType,
// x, y) cell for the map / refresh box / props bars. `DragVisualMgr` owns the
// drag-ghost, the highlight overlays (placeable cells, merge targets), the drag
// guide line, and forwards raw pointer events into the `BoardInputMgr` input handler. It is
// pure presentation on top of the placement controller. Opaque method / field
// names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { BoardMgr } from "./board-mgr";
import { EntityRegistry } from "./entity-registry";
import { EffectMgr } from "./effect-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { LayerZ } from "../core/layer-z";
import { MathE } from "../core/math-e";
import { PrefabFactory } from "./prefab-factory";
import { PlacementMgr } from "./placement-mgr";
import { BoardInputMgr } from "./board-input-mgr";
import { Soldier } from "./soldier";
import { BaseSoldier } from "./base-soldier";
import { Farmer } from "./farmer";
import { GeneralPart } from "./general-part";
import { PropBase } from "./props";
import { Prop } from "./prop";

const C = Singleton;
const u = GameEvent;
const X = LayerZ;
const Ws = Soldier;
const zs = BaseSoldier;
const ki = Farmer;
const gi = GeneralPart;
const Si = PropBase;
const xi = Prop;

/** Refresh-box region mapper (rows by fd). (`xn`) */
export class RegionRefresh {
  element: any;
  containerType: number;
  LX: number;
  yd: number;
  fd: number;
  constructor(t: any, s: number, i: number, h: number, e = 0) {
    this.element = t;
    this.containerType = s;
    this.LX = i;
    this.yd = h;
    this.fd = e;
  }
  mX(t: number, s: number): { x: number; y: number } | null {
    if (!this.element.hitTestPoint(t, s)) return null;
    return {
      x: Math.floor(this.element.mouseX / this.yd),
      y: this.fd > 0 ? Math.floor(this.element.mouseY / this.fd) : 0,
    };
  }
}

/** Map region mapper (offsetY-adjusted). (`Sn`) */
export class RegionMap {
  element: any;
  containerType: number;
  LX: number;
  yd: number;
  fd: number;
  offsetY: number;
  constructor(t: any, s: number, i: number, h: number, e: number, a = 0) {
    this.element = t;
    this.containerType = s;
    this.LX = i;
    this.yd = h;
    this.fd = e;
    this.offsetY = a;
  }
  mX(t: number, s: number): { x: number; y: number } | null {
    if (!this.element.hitTestPoint(t, s)) return null;
    return {
      x: Math.floor(this.element.mouseX / this.yd),
      y: Math.floor((this.element.mouseY - this.offsetY) / this.fd),
    };
  }
}

/** AI props-bar region mapper (two row widths). (`bn`) */
export class RegionPropsAi {
  element: any;
  containerType: number;
  LX: number;
  wX: number;
  vX: number;
  fd: number;
  offsetY: number;
  constructor(t: any, s: number, i: number, h: number, e: number, a: number, n = 0) {
    this.element = t;
    this.containerType = s;
    this.LX = i;
    this.wX = h;
    this.vX = e;
    this.fd = a;
    this.offsetY = n;
  }
  mX(t: number, s: number): { x: number; y: number } | null {
    if (!this.element.hitTestPoint(t, s)) return null;
    const i = Math.floor((this.element.mouseY - this.offsetY) / this.fd);
    const h = i === 0 ? this.wX : this.vX;
    return { x: Math.floor(this.element.mouseX / h), y: i };
  }
}

/** Player props-bar region mapper (active row + passive grid). (`Mn`) */
export class RegionProps {
  element: any;
  containerType: number;
  LX: number;
  refreshBtn: any;
  kX: number;
  _X: number;
  xX: number;
  SX: number;
  constructor(t: any, s: number, i: number, h: any, e: number, a: number, n: number, r: number) {
    this.element = t;
    this.containerType = s;
    this.LX = i;
    this.refreshBtn = h;
    this.kX = e;
    this._X = a;
    this.xX = n;
    this.SX = r;
  }
  mX(t: number, s: number): { x: number; y: number } | null {
    if (!this.element.hitTestPoint(t, s)) return null;
    const i = this.element.mouseX;
    const h = this.element.mouseY;
    const e = new Laya.Point();
    e.setTo(this.refreshBtn.x, this.refreshBtn.y);
    this.refreshBtn.parent.localToGlobal(e);
    this.element.globalToLocal(e);
    if (this.element.getChildAt(0).hitTestPoint(t, s)) return { x: 0, y: 0 };
    if (this.element.getChildAt(1).hitTestPoint(t, s)) return { x: 1, y: 0 };
    if (h >= this.xX && h < this.xX + this.SX) {
      const col = Math.floor(i / this._X);
      if (col >= 0 && col < 6) return { x: col, y: 1 };
    }
    return null;
  }
}

export class DragVisualMgr extends C {
  private Yv = new Laya.Point();
  private offsetY = 10;
  private TX = false;
  private RX = 0;
  private CX = 0;
  private UX = -1;
  private FX = -1;
  private OX = -1;
  private YX = -1;
  private XX = 0;
  private GX = 0;
  private HX = 0;
  private WX = 0;
  private zX: any[][] = [];
  private jX: any[] = [];
  private Hv: any = { LX: 0, containerType: 0, x: 0, y: 0 };
  private Hl: any = { LX: 0, containerType: 0, x: 0, y: 0 };
  private $X = false;
  private NX: any[] = [];
  private ue!: any;
  private qX!: any;
  private bY!: any;
  private map!: any;
  private refreshBox!: any;
  private propsBox!: any;
  private propsBoxAi!: any;
  private aG!: any;
  private nG!: any;
  private rG!: any;
  private oG!: any;
  private lG!: any;
  private cG!: any;
  private bX: any;
  private JX: any;
  private tG: any;

  init(): void {
    this.ue = GameMgr.instance().map;
    this.XX = this.ue.gridWid;
    this.GX = this.ue.gridHei;
  }

  startGame(): void {
    this.$X = true;
    this.qX = BoardInputMgr.instance();
    if (this.qX) this.qX.init();
    this.bY = SceneMgr.instance().getScene("BattleScene").getChildByName("box");
    this.map = this.bY.getChildByName("map");
    this.refreshBox = this.bY.getChildByName("refreshBox");
    this.propsBox = this.bY.getChildByName("propsBox");
    this.propsBoxAi = this.bY.getChildByName("propsBoxAi");
    this.HX = this.refreshBox.width / this.ue.ye;
    this.WX = this.refreshBox.height;
    this.VX();
    this.QX();
    this.ZX();
    this.bY.on(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
    this.bY.on(Laya.Event.MOUSE_MOVE, this, this.onMouseMove);
    this.bY.on(Laya.Event.MOUSE_UP, this, this.onMouseUp);
  }

  VX(): void {
    this.NX.length = 0;
    this.NX.push(new RegionRefresh(this.refreshBox, 3, 2, this.HX, this.WX));
    this.NX.push(new RegionMap(this.map, 1, 1, this.XX, this.GX, this.offsetY));
    const t = this.bY.getChildByName("refreshBtn");
    this.NX.push(
      new RegionProps(
        this.propsBox,
        4,
        3,
        t,
        this.propsBox.getChildAt(0).width,
        this.propsBox.getChildAt(this.propsBox.numChildren - 1).width,
        this.propsBox.getChildAt(this.propsBox.numChildren - 1).y,
        this.propsBox.getChildAt(this.propsBox.numChildren - 1).height,
      ),
    );
    this.NX.push(
      new RegionPropsAi(this.propsBoxAi, 4, 4, 110, 80, this.propsBoxAi.getChildAt(0).height),
    );
  }

  onMouseDown(t: any): void {
    this.KX(this.Hv, t.stageX, t.stageY);
    if (this.qX) {
      this.bX = this.qX.onMouseDown(this.Hv);
      if (this.bX) {
        if (this.bX instanceof Ws) {
          this.JX = this.bX instanceof ki ? "farmer" : "soldier";
          this.tG = null;
        } else if (this.bX instanceof Si) {
          this.JX = this.bX.type;
          this.tG = this.bX;
        }
      } else {
        this.JX = null;
        this.tG = null;
      }
    } else {
      this.bX = null;
      this.JX = null;
      this.tG = null;
    }
  }

  onMouseMove(t: any): void {
    if (this.bX && this.qX) {
      const s = this.qX.onMouseMove(t);
      if (s && !this.TX) this.sG(s);
      this.iG(t.stageX, t.stageY);
    }
  }

  onMouseUp(t: any): void {
    this.KX(this.Hl, t.stageX, t.stageY);
    if (this.qX) this.qX.onMouseUp(this.Hl);
    if (
      this.$X &&
      this.Hv.LX === 1 &&
      this.Hl.LX === 1 &&
      this.Hv.x === this.Hl.x &&
      this.Hv.y === this.Hl.y &&
      GameMgr.instance().map.De(this.Hv.x, this.Hv.y)
    )
      EffectMgr.instance().showCheatWarning();
    this.hG();
    this.bX = null;
  }

  KX(t: any, s: number, i: number): void {
    const h = this.bX instanceof Ws;
    for (const e of this.NX) {
      if (h && (e.LX === 3 || e.LX === 4)) continue;
      const a = e.mX(s, i);
      if (a !== null) {
        t.LX = e.LX;
        t.containerType = e.containerType;
        t.x = a.x;
        t.y = a.y;
        return;
      }
    }
    t.LX = 0;
    t.containerType = 0;
    t.x = 0;
    t.y = 0;
  }

  eG(t: number, s: number, i: number): any {
    const h = PrefabFactory.instance().getItem("dragTip", this);
    h.size(70, 70);
    h.pos(
      t * this.XX + (this.ue.gridWid - h.width) / 2,
      (s - Math.floor(i / 2)) * this.GX + (this.ue.gridHei - h.height) / 2,
    );
    h.alpha = 0.8;
    h.visible = false;
    this.aG.addChild(h);
    return h;
  }

  QX(): void {
    if (!this.aG) {
      this.aG = new Laya.Sprite();
      this.aG.name = "dragMaskMap";
      this.aG.size(this.map.width, this.map.height / 2);
      this.aG.pos(this.map.x, this.map.y + this.map.height / 2);
      this.aG.visible = false;
      EventMgr.instance.event(u.Ut, this.aG, X.Nr);
      const t = this.ue.ue;
      for (let s = 0; s < t.length; s++) {
        this.zX.push([]);
        for (let i = 0; i < t[s].length; i++) {
          const h = this.eG(s, i, t[s].length);
          this.zX[s].push(h);
        }
      }
    }
    if (!this.nG) {
      this.nG = new Laya.Sprite();
      this.nG.name = "dragMaskRefresh";
      this.nG.size(this.refreshBox.width, this.refreshBox.height);
      this.nG.pos(this.refreshBox.x, this.refreshBox.y);
      this.nG.visible = false;
      EventMgr.instance.event(u.Ut, this.nG, X.Nr);
      for (let t = 0; t < this.ue.ye; t++) {
        const s = PrefabFactory.instance().getItem("dragTip", this);
        s.size(80, 80);
        s.pos(t * this.HX + (this.HX - s.width) / 2, (this.WX - s.height) / 2);
        s.alpha = 0.8;
        s.visible = false;
        this.nG.addChild(s);
        this.jX.push(s);
      }
    }
    if (!this.rG) {
      this.rG = new Laya.Sprite();
      this.rG.name = "dragMapTipSp";
      this.rG.pos(this.map.x, this.map.y);
      this.rG.alpha = 0.4;
      EventMgr.instance.event(u.Ut, this.rG, X.Nr);
    }
    this.rG.visible = false;
    if (!this.oG) {
      this.oG = new Laya.Image("resources/img/battleUI/dragImg1.png");
      this.oG.size(93, 92);
      this.oG.anchorX = 0.5;
      this.oG.anchorY = 0.5;
      this.oG.visible = false;
      EventMgr.instance.event(u.Ut, this.oG, X.Nr);
    }
    if (!this.lG) {
      this.lG = new Laya.Image("resources/img/battleUI/dragImg2.png");
      this.lG.size(87, 86);
      this.lG.sizeGrid = "13,13,13,13,0";
      this.lG.anchorX = 0.5;
      this.lG.anchorY = 0.5;
      this.lG.visible = false;
      EventMgr.instance.event(u.Ut, this.lG, X.Nr);
    }
    if (!this.cG) {
      this.cG = new Laya.Sprite();
      this.cG.visible = false;
      EventMgr.instance.event(u.Ut, this.cG, X.Nr);
    }
  }

  ZX(): void {
    const t = this.ue.ue;
    for (let s = 0; s < t.length; s++)
      for (let i = 0; i < t[s].length; i++)
        this.zX[s][i].visible = t[s][i] === "1_0" || t[s][i] === "2_0";
  }

  uG(t: any): void {
    this.RX = this.CX;
    this.UX = this.OX;
    this.FX = this.YX;
    if (this.map.hitTestPoint(t.stageX, t.stageY)) {
      const x = Math.floor(this.map.mouseX / this.XX);
      const yy = Math.floor((this.map.mouseY - this.offsetY) / this.GX);
      this.CX = 1;
      this.OX = x;
      this.YX = yy;
      if (this.RX === this.CX && this.UX === this.OX && this.FX === this.YX) return;
      if (this.JX === "soldier") this.pG(false, x, yy);
      else if (this.JX === "farmer") this.pG(true, x, yy);
      else if (this.tG) {
        const i = this.tG.rk === 3 || this.tG.rk === 4 ? 1 : 2;
        if (PlacementMgr.instance().CF(this.tG, { containerType: i, x: this.OX, y: this.YX }))
          this.yG(true, 1, x, yy);
        else this.yG(false);
      }
    } else if (this.refreshBox.hitTestPoint(t.stageX, t.stageY)) {
      const x = Math.floor(this.refreshBox.mouseX / this.HX);
      this.CX = 2;
      this.OX = x;
      this.YX = 0;
      if (this.RX === this.CX && this.UX === this.OX && this.FX === this.YX) return;
      if (this.JX === "soldier" || this.JX === "farmer") this.fG(x);
      else if (this.tG) {
        if (PlacementMgr.instance().CF(this.tG, { containerType: 3, x, y: 0 })) this.yG(true, 2, x);
        else this.yG(false);
      }
    } else {
      this.CX = 0;
      this.lG.visible = false;
    }
    if (!this.lG.visible) {
      this.cG.visible = false;
      this.CX = 0;
      this.OX = -1;
      this.YX = -1;
      return;
    }
    let s: any;
    const i = this.oG;
    const h = this.lG;
    const e = MathE.distance(i, h);
    const a = Math.floor(e / 25);
    const n = MathE.angle(i, h);
    this.cG.rotation = n - 90;
    this.cG.pos(this.oG.x, this.oG.y);
    this.cG.visible = true;
    const r = this.cG.numChildren;
    if (r >= a) for (let t = 0; t < r; t++) this.cG.getChildAt(t).visible = t < a;
    else
      for (let t = 0; t < a; t++)
        if (t < r) this.cG.getChildAt(t).visible = true;
        else {
          s = PrefabFactory.instance().getItem("dragLine", this);
          s.pos(t * (s.width + 5), 0);
          this.cG.addChild(s);
        }
  }

  sG(t: any): void {
    if (!this.TX && t) {
      this.aG.visible = true;
      this.nG.visible = true;
      this.rG.visible = true;
      this.gG();
      this.oG.visible = true;
      this.Yv.x = t.x + t.width * (0.5 - t.anchorX);
      this.Yv.y = t.y + t.height * (0.5 - t.anchorY);
      this.Yv = t.parent.localToGlobal(this.Yv);
      this.Yv = this.oG.parent.globalToLocal(this.Yv);
      this.oG.pos(this.Yv.x, this.Yv.y);
      this.dG();
      this.TX = true;
    }
  }

  LG(): any {
    return this.bX ? this.bX.pg() : null;
  }

  iG(t: number, s: number): void {
    if (this.bX && this.TX) this.uG({ stageX: t, stageY: s });
  }

  hG(): void {
    if (this.TX || this.bX) {
      this.aG.visible = false;
      this.nG.visible = false;
      this.rG.visible = false;
      this.mG();
      this.oG.visible = false;
      this.lG.visible = false;
      this.cG.visible = false;
      this.TX = false;
      this.RX = 0;
      this.UX = -1;
      this.FX = -1;
      this.CX = 0;
      this.OX = -1;
      this.YX = -1;
    }
  }

  yG(t: boolean, s?: number, i?: number, h?: number): void {
    this.lG.visible = t;
    this.lG.width = this.XX + 7;
    if (t)
      if (s === 1) {
        const cell = EntityRegistry.instance().zS(i!, h!);
        let w = this.XX + 7;
        if (cell.x !== -1 && cell.y !== -1) {
          i = cell.x;
          h = cell.y;
          w += this.XX;
          this.lG.width = w;
        }
        this.Yv.x = i! * this.XX + this.XX / 2;
        this.Yv.y = h! * this.GX + this.GX / 2;
        this.map.localToGlobal(this.Yv);
        this.lG.parent.globalToLocal(this.Yv);
        this.lG.pos(this.Yv.x, this.Yv.y);
        if (this.JX === "soldier" && this.bX) {
          const sp = this.bX.pg();
          const sol = EntityRegistry.instance().hS.get(Number(sp.name.split("_")[1]));
          if (sol) {
            Laya.Point.TEMP.setTo(i! * this.XX + this.XX / 2, h! * this.GX + this.GX / 2);
            this.map.localToGlobal(Laya.Point.TEMP);
            EffectMgr.instance().toggleTargetCircle(true, sol.Da, Laya.Point.TEMP.x, Laya.Point.TEMP.y);
          }
        }
      } else if (s === 2) {
        this.Yv.x = i! * this.HX + this.HX / 2;
        this.Yv.y = this.WX / 2;
        this.refreshBox.localToGlobal(this.Yv);
        this.lG.parent.globalToLocal(this.Yv);
        this.lG.pos(this.Yv.x, this.Yv.y);
      } else;
    else EffectMgr.instance().toggleTargetCircle(false);
  }

  wG(_t: any, _s: any): void {}

  pG(t: boolean, s: number, i: number): void {
    const h = this.ue.ue[s][i];
    const e = this.bX;
    const a = !e || e.qd;
    const n = t
      ? a
        ? h === "1_0" || h === "2_0"
        : h === "1_1" || h === "2_1"
      : a
        ? h === "1_0"
        : h === "1_1";
    if (n) this.yG(true, 1, s, i);
    else this.yG(false);
  }

  fG(t: number): void {
    if (BoardMgr.instance().Mv(3)!.mv[t] instanceof xi) this.yG(false);
    else this.yG(true, 2, t);
  }

  dG(): void {
    if (this.JX === "soldier") {
      this.vG(false);
      this.kG();
    } else if (this.JX === "farmer") {
      this.vG(true);
      this.kG();
    } else if (this.tG) this._G(this.tG);
  }

  _G(t: any): void {
    const s: any = { x: 0, y: 0, containerType: 2 };
    let i: any;
    const e = this.ue.ue;
    const h = t.rk === 3 || t.rk === 4 ? 1 : 2;
    s.containerType = h;
    for (let h2 = 0; h2 < e.length; h2++)
      for (let a = 0; a < e[h2].length; a++)
        if ((i = this.zX[h2][a])) {
          s.x = h2;
          s.y = a;
          if (t.rk === 4) {
            s.containerType = 1;
            const c1 = PlacementMgr.instance().CF(t, s);
            s.containerType = 2;
            const c2 = PlacementMgr.instance().CF(t, s);
            i.visible = c1 || c2;
          } else i.visible = PlacementMgr.instance().CF(t, s);
        }
    s.containerType = 3;
    const a = BoardMgr.instance().Mv(3)!.mv;
    for (let h2 = 0; h2 < a.length; h2++)
      if ((i = this.jX[h2])) {
        s.x = h2;
        s.y = 0;
        i.visible = PlacementMgr.instance().CF(t, s);
      }
  }

  vG(t: boolean): void {
    let i: any;
    const h = this.ue.ue;
    const e = this.bX;
    const a = BoardMgr.instance().Mv(1, e?.qd ?? true);
    const n = a?.mv;
    for (let s = 0; s < h.length; s++)
      for (let aa = 0; aa < h[s].length; aa++) {
        if (!(i = this.zX[s][aa])) continue;
        let r = false;
        const o = !e || e.qd;
        r = t
          ? o
            ? h[s][aa] === "1_0" || h[s][aa] === "2_0"
            : h[s][aa] === "1_1" || h[s][aa] === "2_1"
          : o
            ? h[s][aa] === "1_0"
            : h[s][aa] === "1_1";
        i.visible = r;
        if (r && e && n && n[s] && n[s][aa]) {
          const item = n[s][aa];
          let merge = false;
          if (e instanceof zs && item instanceof zs)
            merge =
              e.Qd === item.Qd && e.level === item.level && e.id !== item.id && item.level < 5 && !e.$d && !item.$d;
          else if (e instanceof gi && item instanceof gi) {
            const m = EntityRegistry.instance().YS(e, item);
            merge = m !== null && m.level < m.maxLevel;
          } else if (e instanceof ki && item instanceof ki)
            merge =
              e.Qd === item.Qd && e.level === item.level && e.id !== item.id && item.level < 5 && !e.$d && !item.$d;
          if (merge) {
            i.skin = "resources/img/battleUI/dragBg3.png";
            i.alpha = 1;
          } else {
            i.skin = "resources/img/battleUI/dragBg2.png";
            i.alpha = 0.8;
          }
        } else {
          i.skin = "resources/img/battleUI/dragBg2.png";
          i.alpha = 0.8;
        }
      }
  }

  kG(): void {
    let t: any;
    const s = BoardMgr.instance().Mv(3)!.mv;
    const i = this.bX;
    for (let h = 0; h < s.length; h++) {
      if (!(t = this.jX[h])) continue;
      const e = !(s[h] instanceof xi);
      t.visible = e;
      if (e && i && s[h] instanceof Ws) {
        const item = s[h];
        let a = false;
        if (i instanceof zs && item instanceof zs)
          a = i.Qd === item.Qd && i.level === item.level && i.id !== item.id && item.level < 5 && !i.$d && !item.$d;
        else if (i instanceof gi && item instanceof gi) {
          const m = EntityRegistry.instance().YS(i, item);
          a = m !== null && m.level < m.maxLevel;
        } else if (i instanceof ki && item instanceof ki)
          a = i.Qd === item.Qd && i.level === item.level && i.id !== item.id && item.level < 5 && !i.$d && !item.$d;
        if (a) {
          t.skin = "resources/img/battleUI/dragBg3.png";
          t.alpha = 1;
        } else {
          t.skin = "resources/img/battleUI/dragBg2.png";
          t.alpha = 0.8;
        }
      } else {
        t.skin = "resources/img/battleUI/dragBg2.png";
        t.alpha = 0.8;
      }
    }
  }

  gG(): void {
    let t = 0.8;
    if (this.aG.alpha > 0.4) t = 0;
    Laya.Tween.to(this.aG, { alpha: t }, 1000);
    Laya.Tween.to(this.nG, { alpha: t }, 1000);
    Laya.Tween.to(
      this.rG,
      { alpha: t / 2 },
      1000,
      null,
      Laya.Handler.create(this, () => {
        this.gG();
      }),
    );
  }

  mG(): void {
    Laya.Tween.killAll(this.aG);
    Laya.Tween.killAll(this.nG);
    Laya.Tween.killAll(this.rG);
    this.aG.alpha = 0.8;
    this.nG.alpha = 0.8;
    this.rG.alpha = 0.4;
  }

  xG(): void {
    for (let t = 0; t < this.zX.length; t++)
      for (let s = 0; s < this.zX[t].length; s++)
        if (this.zX[t][s]) {
          this.zX[t][s].removeSelf();
          PrefabFactory.instance().recover("dragTip", this.zX[t][s]);
          this.zX[t][s] = null;
        }
  }

  gameOver(): void {
    if (this.$X) {
      this.bY.off(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
      this.bY.off(Laya.Event.MOUSE_MOVE, this, this.onMouseMove);
      this.bY.off(Laya.Event.MOUSE_UP, this, this.onMouseUp);
      this.mG();
      this.aG.visible = false;
      this.nG.visible = false;
      this.oG.visible = false;
      this.lG.visible = false;
      this.cG.visible = false;
    }
    this.TX = false;
    this.RX = 0;
    this.UX = -1;
    this.FX = -1;
    this.CX = 0;
    this.OX = -1;
    this.YX = -1;
    GameMgr.instance().map.Te();
  }
}

/** Alias. (`An`) */
export const An = DragVisualMgr;
