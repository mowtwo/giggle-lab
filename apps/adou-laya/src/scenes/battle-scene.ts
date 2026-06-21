// BattleScene — the in-battle HUD (the bundle's `Hr`, @regClass
// a1VsRozfQfKce35jblVR3w).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~31853-33553. Builds the map grid + background + path tips + boundary, the two
// end-point bases (Adou banners that march in via `MoveComponent`/`mN`), the HP
// heart rows (`w$`/`eN`/`addHp`), the refresh-box + deck deal animation (`p$`/
// `J$`), the props bars with cooldown masks (`I$`/`$$`/`N$`), the shovel/bulldozer
// ad placement (`u$`/`Y$`/`j$`/`rN`/`lN`), danger pulses (`H$`), talk bubbles, and
// the per-frame loop. Relays ~26 game events to its handlers (`addEvent`). Opaque
// field / method names kept verbatim; node refs bound from BattleScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { GameMgr } from "../core/game-mgr";
import { LayerZ } from "../core/layer-z";
import { EffectMgr } from "../battle/effect-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { PrefabFactory } from "../battle/prefab-factory";
import { PrefabPool, PrefabName } from "../battle/prefab-pool";
import { AnimPlayer } from "../battle/anim-player";
import { EntityRegistry } from "../battle/entity-registry";
import { CellReservationMgr } from "../battle/cell-reservation-mgr";
import { PlacementMgr } from "../battle/placement-mgr";
import { BoardInputMgr } from "../battle/board-input-mgr";
import { TutorialMgr } from "../battle/tutorial-mgr";
import { GeneralAIController } from "../battle/ai-controller";
import { SpawnQueueMgr } from "../battle/spawn-queue-mgr";
import { BoardMgr } from "../battle/board-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { TipMgr } from "../core/tip-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { BulletTrailPool } from "../battle/bullet-trail";
import { MoveComponent } from "../battle/move-component";
import { MathE } from "../core/math-e";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { gt, dt } from "../battle/analytics-mgr";

const F = GameMgr;
const X = LayerZ;
const q = EffectMgr;
const $ = AudioMgr;
const j = UpdateMgr;
const Zi = BattlePropsMgr;
const z = PrefabFactory;
const H = PrefabPool;
const G = PrefabName;
const Zt = AnimPlayer;
const Ki = EntityRegistry;
const Oi = CellReservationMgr;
const en = PlacementMgr;
const Pn = BoardInputMgr;
const wn = TutorialMgr;
const mn = GeneralAIController;
const Na = SpawnQueueMgr;
const wi = BoardMgr;
const Mt = PlatformMgr;
const tt = TipMgr;
const K = SceneMgr;
const Fh = BulletTrailPool;
const Xr = MoveComponent;
const f = MathE;
const y = EventMgr;
const u = GameEvent;

@regClass("a1VsRozfQfKce35jblVR3w")
export class BattleScene extends Laya.Scene {
  // .ls-bound nodes
  deckBtn!: any;
  end1!: any;
  end2!: any;
  map!: any;
  gameObjectBox!: any;
  round!: any;
  effectBox!: any;
  danger0!: any;
  danger1!: any;
  danger2!: any;
  danger3!: any;
  propsBox!: any;
  propsBoxAi!: any;
  shovelAd!: any;
  refreshBtn!: any;
  xBtn!: any;
  pathTip0!: any;
  pathTip1!: any;
  goldNumTxt!: any;
  refreshBtnMask!: any;
  maskImg!: any;
  goldNum!: any;
  bound!: any;
  road!: any;
  highGround!: any;
  mapTitle!: any;
  mapBgImg!: any;
  mapBgImgNew!: any;
  refreshBox!: any;
  bg!: any;
  divide!: any;
  deckLight!: any;
  roof!: any;
  shovelAdImg!: any;
  shovelNum!: any;
  shovelAdBg!: any;
  adLight!: any;
  box!: any;

  private ma: any[] = [];
  private Mo = new Laya.Point();
  private Po = new Laya.Point();
  private gM = false;
  private mapIndex = 0;
  private Uj: any[] = [];
  private Fj = new Map<string, any>();
  private Oj = 0;
  private Yj = 1000;
  private Xj = 0;
  private Gj = 0;
  private Hj = 300;
  private Wj = 0;
  private zj = 0;
  private jj: any = null;
  private $j = true;
  private Nj = false;
  private qj = 0;
  private Vj = 0;
  private Qj = 0;
  private Zj = 0;
  private Kj = 1;
  private Jj = false;
  private t$ = false;
  private s$ = false;
  private i$ = false;
  private h$ = new Laya.Point();
  private e$ = new Laya.Point();
  private se = new Laya.Point();
  private ee = new Laya.Point();
  private dg: any;
  private x$!: any;
  private S$!: any;
  private b$!: any;
  private M$!: any;
  private iN!: any;
  private gN: any;
  private Z$!: any;
  private c$!: Map<number, any>;

  onAwake(): void {
    this.dg = F.instance();
    this.deckBtn.zIndex = X.Hr;
    this.end1.zIndex = X.pr;
    this.end2.zIndex = X.pr;
    this.map.zIndex = X.lr;
    this.gameObjectBox.zIndex = X.nr;
    this.round.zIndex = X.Hr;
    this.effectBox.zIndex = X.vr;
    this.danger0.zIndex = X.Hr;
    this.danger1.zIndex = X.Hr;
    this.danger2.zIndex = X.Hr;
    this.danger3.zIndex = X.Hr;
    for (let t = 0; t < this.dg.props.Ze; t++) {
      this.propsBox.getChildAt(t).getChildByName("maskSp").zIndex = X.Wr;
      this.propsBoxAi.getChildAt(t).getChildByName("maskSp").zIndex = X.Wr;
    }
    this.a$();
    this.n$();
    this.r$();
    this.o$();
    this.addEvent();
    this.l$();
    this.c$ = new Map();
    this.shovelAd.on(Laya.Event.CLICK, this, this.u$);
    this.refreshBtn.on(Laya.Event.CLICK, this, this.p$);
    this.deckBtn.on(Laya.Event.CLICK, this, this.y$);
    this.xBtn.on(Laya.Event.CLICK, this, this.pause);
    q.instance().bindButtons([this.refreshBtn, this.deckBtn, this.xBtn]);
  }

  onOpened(): void {
    let t: string;
    this.gM = false;
    this.mapIndex = this.dg.map.mapIndex;
    this.f$();
    this.g$();
    this.d$();
    this.L$();
    this.m$(this.pathTip0, this.dg.map.te, this.dg.map.se);
    this.m$(this.pathTip1, this.dg.map.he, this.dg.map.ee);
    this.w$(true);
    this.w$(false);
    this.hP(true);
    this.hP(false);
    Laya.timer.once(1000, this, () => {
      this.v$(true);
      this.v$(false);
    });
    this.round.text = "第1波";
    this.goldNumTxt.text = this.dg.battleState.yi.toString();
    this.refreshBtnMask.graphics.drawRect(0, 0, this.maskImg.width, this.maskImg.height, "#fff");
    this.Nj = this.dg.battleState.gold >= this.dg.battleState.yi;
    this.k$();
    this._$(this.pathTip0, 0);
    this._$(this.pathTip1, 0);
    this.x$.play("idle" + this.mapIndex, true);
    this.S$.play("idle" + this.mapIndex, true);
    switch (this.mapIndex) {
      case 0:
      case 2:
      default:
        t = "bg_battleScene_0";
        break;
      case 1:
      case 3:
        t = "bg_battleScene_3";
    }
    $.instance().playMusic(t);
    if (this.dg.player.openProps) {
      this.propsBox.visible = true;
      this.propsBoxAi.visible = true;
    } else {
      this.propsBox.visible = false;
      this.propsBoxAi.visible = false;
    }
    j.instance().register("BattleScene", this, this.update);
    Zi.instance().Kx(true);
  }

  onClosed(_t?: any): void {
    j.instance().unregister("BattleScene");
    this.b$.offAllCaller(this);
    this.M$.offAllCaller(this);
  }

  addEvent(): void {
    y.instance.on(u.St, this, this.P$);
    y.instance.on(u.bt, this, this.A$);
    y.instance.on(u.xt, this, this.E$);
    y.instance.on(u.Mt, this, this.B$);
    y.instance.on(u.Pt, this, this.I$);
    y.instance.on(u.It, this, this.k$);
    y.instance.on(u.At, this, this.D$);
    y.instance.on(u.Et, this, this.T$);
    y.instance.on(u.Bt, this, this.R$);
    y.instance.on(u.Dt, this, this.gameOver);
    y.instance.on(u.Tt, this, this.C$);
    y.instance.on(u.Rt, this, this.U$);
    y.instance.on(u.Ct, this, this.F$);
    y.instance.on(u.Ut, this, this.O$);
    y.instance.on(u.Ft, this, this.uX);
    y.instance.on(u.Ot, this, this.Y$);
    y.instance.on(u.Yt, this, this.X$);
    y.instance.on(u.Xt, this, this.G$);
    y.instance.on(u.Gt, this, this.H$);
    y.instance.on(u.Ht, this, this.W$);
    y.instance.on(u.Wt, this, this.z$);
    y.instance.on(u.zt, this, this.j$);
    y.instance.on(u.jt, this, this.$$);
    y.instance.on(u.$t, this, this.N$);
    y.instance.on(u.ds, this, this.q$);
    y.instance.on(u.Nt, this, this.V$);
  }

  update(t: number): void {
    this.Q$(t);
  }

  a$(): void {
    console.log("设置格子");
    this.dg.Qn = this.map;
    const t = this.dg.map.ue;
    this.map.size(t.length * this.dg.map.gridWid, t[0].length * this.dg.map.gridHei);
    this.map.x = (this.width - this.map.width) / 2;
    for (let s = 0; s < t.length; s++) {
      this.Uj.push([]);
      for (let i = 0; i < t[s].length; i++) {
        const cell = z.instance().getItem("mapImg", this);
        cell.name = `${s}_${i}`;
        this.Uj[s].push(cell);
        cell.pos(s * cell.width, i * cell.height);
        this.Fj.set(cell.name, cell);
      }
    }
  }

  f$(): void {
    this.Z$ = this.c$.get(this.mapIndex);
    if (!this.Z$) {
      this.Z$ = H.instance().so((G as any)["mapBg" + this.mapIndex]).create();
      this.c$.set(this.mapIndex, this.Z$);
    }
    this.Z$.zIndex = X.rr;
    this.box.addChild(this.Z$);
    this.mapTitle.skin = "resources/img/map/mapBg/mapBg" + this.mapIndex + "/title.png";
    if (this.dg.map.mapIndex === 0) {
      this.mapBgImg.visible = true;
      this.mapBgImgNew.visible = false;
    } else {
      this.mapBgImg.visible = false;
      this.mapBgImgNew.visible = true;
      this.mapBgImgNew.skin = "resources/img/map/mapBg_" + this.mapIndex + ".png";
    }
    for (let t = 0; t < this.refreshBox.numChildren; t++) {
      const s = this.refreshBox.getChildAt(t);
      if (s.name === "grid")
        s.skin =
          t === 0
            ? "resources/img/map/refresh_" + this.mapIndex + "_0.png"
            : "resources/img/map/refresh_" + this.mapIndex + "_1.png";
    }
  }

  n$(): void {
    this.x$ = Zt.instance().pf("grass");
    this.map.addChild(this.x$);
    this.x$.on(Laya.Event.STOPPED, this, () => {
      this.x$.play("idle" + this.mapIndex, true);
    });
    this.x$.play("idle" + this.mapIndex, true);
    this.S$ = Zt.instance().pf("grass");
    this.map.addChild(this.S$);
    this.S$.on(Laya.Event.STOPPED, this, () => {
      this.S$.play("idle" + this.mapIndex, true);
    });
    this.S$.play("idle" + this.mapIndex, true);
    this.x$.zIndex = X.lr;
    this.S$.zIndex = X.lr;
  }

  d$(): void {
    this.bound.graphics.clear();
    const t = this.dg.map.ue;
    const s = this.dg.map.gridWid;
    const i = this.dg.map.gridHei;
    for (let h = 0; h < t.length; h++)
      for (let e = 0; e < t[h].length; e++) {
        const a = t[h][e];
        if (a === "1_0" || a === "1_1" || a === "2_0" || a === "2_1") {
          if (h - 1 >= 0 && (t[h - 1][e] === "0_0" || t[h - 1][e] === "0_1"))
            this.bound.graphics.drawLine(h * s, e * i, h * s, (e + 1) * i, "#000000", 3);
          if (h + 1 < t.length && (t[h + 1][e] === "0_0" || t[h + 1][e] === "0_1"))
            this.bound.graphics.drawLine((h + 1) * s, e * i, (h + 1) * s, (e + 1) * i, "#000000", 3);
          if (e - 1 >= 0 && (t[h][e - 1] === "0_0" || t[h][e - 1] === "0_1"))
            this.bound.graphics.drawLine(h * s, e * i, (h + 1) * s, e * i, "#000000", 3);
          if (e + 1 < t[0].length && (t[h][e + 1] === "0_0" || t[h][e + 1] === "0_1"))
            this.bound.graphics.drawLine(h * s, (e + 1) * i, (h + 1) * s, (e + 1) * i, "#000000", 3);
        }
      }
    this.bound.graphics.drawLine(0, 0, this.bound.width, 0, "#000000", 6);
    this.bound.graphics.drawLine(0, this.bound.height, this.bound.width, this.bound.height, "#000000", 6);
    this.bound.graphics.drawLine(0, 0, 0, this.bound.height, "#000000", 6);
    this.bound.graphics.drawLine(this.bound.width, 0, this.bound.width, this.bound.height, "#000000", 6);
  }

  L$(): void {
    this.K$(this.end1, this.map);
    this.K$(this.end2, this.map);
    this.end1.zIndex = X.pr;
    this.end2.zIndex = X.pr;
    this.x$.pos(
      this.dg.map.te.x * this.dg.map.gridWid + this.dg.map.gridWid / 2,
      this.dg.map.te.y * this.dg.map.gridHei + this.dg.map.gridHei,
    );
    this.S$.pos(
      this.dg.map.he.x * this.dg.map.gridWid + this.dg.map.gridWid / 2,
      this.dg.map.he.y * this.dg.map.gridHei + this.dg.map.gridHei,
    );
    this.end1.pos(this.dg.map.ie.x * this.dg.map.gridWid, this.dg.map.ie.y * this.dg.map.gridHei);
    this.end2.pos(this.dg.map.ae.x * this.dg.map.gridWid, this.dg.map.ae.y * this.dg.map.gridHei);
  }

  m$(t: any, s: any, i: any): void {
    if (i.x !== s.x) {
      t.pos(s.x * this.dg.map.gridWid + (i.x - s.x) * (t.width / 2), s.y * this.dg.map.gridHei + this.dg.map.gridHei / 2);
      if (i.x > s.x) {
        t.scaleX = 1;
        t.x += this.dg.map.gridWid;
      } else t.scaleY = -1;
    }
    if (i.y !== s.y) {
      t.pos(s.x * this.dg.map.gridWid + this.dg.map.gridWid / 2, s.y * this.dg.map.gridHei + (i.y - s.y) * (this.pathTip0.height / 2));
      if (i.y < s.y) t.scaleY = 1;
      else {
        t.scaleY = -1;
        t.y += this.dg.map.gridHei;
      }
    }
  }

  P$(t: any, s?: number, i?: number): void {
    this.map.addChild(t);
    if (s !== undefined && i !== undefined) t.pos(s * this.dg.map.gridWid, i * this.dg.map.gridHei);
  }

  A$(t: any, s?: number, i?: number): void {
    this.gameObjectBox.addChild(t);
    if (s !== undefined && i !== undefined) t.pos(s * this.dg.map.gridWid, i * this.dg.map.gridHei);
  }

  E$(t: any, s?: number, i?: number): void {
    this.road.addChild(t);
    if (s !== undefined && i !== undefined) t.pos(s * this.dg.map.gridWid, i * this.dg.map.gridHei);
  }

  B$(t: any, s?: number): void {
    this.refreshBox.addChild(t);
    if (s !== undefined) {
      const i = this.refreshBox.width / this.dg.map.ye;
      t.pos(i * s + (i - t.width) / 2, (this.refreshBox.height - t.height) / 2);
    }
  }

  o$(): void {
    const t = this.refreshBox.width / this.dg.map.ye;
    for (let s = 0; s < this.dg.map.ye; s++) {
      const i =
        s === 0
          ? new Laya.Image("resources/img/map/refresh_" + this.mapIndex + "_0.png")
          : new Laya.Image("resources/img/map/refresh_" + this.mapIndex + "_1.png");
      i.name = "grid";
      this.refreshBox.addChild(i);
      i.size(t, this.refreshBox.height);
      this.dg.map.fe = i.width;
      this.dg.map.ge = i.height;
      i.pos(t * s, 0);
    }
  }

  p$(): void {
    if (Date.now() - this.Oj < this.Yj) return;
    this.Oj = Date.now();
    if (en.instance().yF({ type: 2, qd: true, onComplete: () => {} }).success) this.J$();
  }

  J$(): void {
    if (this.dg.map.we) {
      this.shovelAd.visible = false;
      this.dg.map.we = false;
    }
    this.goldNumTxt.text = this.dg.battleState.yi.toString();
    y.instance.event(u.It);
    q.instance().clearTrails();
    const t = this.refreshBox.width / this.dg.map.ye;
    const s = this.refreshBox.height;
    let i = false;
    const h = this.deckBtn.x;
    const e = this.deckBtn.y;
    $.instance().playSound("open_deck");
    Laya.Tween.create(this.deckBtn)
      .to("scaleX", 1.2)
      .to("scaleY", 0.8)
      .duration(20)
      .chain()
      .to("scaleX", 0.8)
      .to("scaleY", 1.2)
      .duration(10)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(40)
      .parallel(this.roof)
      .to("rotation", -109)
      .duration(40)
      .onStart(() => {
        this.deckLight.scale(0, 0);
        Laya.Tween.create(this.deckLight)
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(100)
          .then(() => {
            const loop = () => {
              if (i) Laya.timer.clear(this, loop);
              else if (this.deckLight.skin === "resources/img/battleUI/refreshLight0.png")
                this.deckLight.skin = "resources/img/battleUI/refreshLight1.png";
              else this.deckLight.skin = "resources/img/battleUI/refreshLight0.png";
            };
            Laya.timer.loop(200, this, loop);
          }, this);
      }, this)
      .then(() => {
        for (let a = 0; a < this.dg.map.ye; a++)
          Laya.timer.once(100 * a, this, () => {
            this.Mo.x = h;
            this.Mo.y = e - this.dg.map.gridHei / 2;
            this.deckBtn.parent.localToGlobal(this.Mo);
            if (this.tN()) return;
            const n = Oi.instance();
            const r = n.A_(true, a);
            if (!r) {
              if (a === this.dg.map.ye - 1) {
                wn.instance().VY();
                Laya.timer.once(100, this, () => {
                  en.instance().wF();
                });
              }
              return;
            }
            const { index: o, token: l } = r;
            this.Po.x = t * o + t / 2;
            this.Po.y = s / 2;
            this.refreshBox.localToGlobal(this.Po);
            const c = wn.instance().NY(a);
            let uColor = "#ffffff";
            if (c !== "铲" && c !== "刀" && c !== "弓" && c !== "枪" && c !== "骑") uColor = "#f8e37d";
            const p = this.dg.generals;
            let yy: string;
            const ff = p.soldierTypes.indexOf(c);
            if (ff === -1) yy = `resources/img/gameObject/soldier/generalParts_${p.nameChars.indexOf(c)}.png`;
            else yy = `resources/img/gameObject/soldier/soldier_${ff}.png`;
            if (c === "铲")
              yy = F.instance().battleState.Gi ? "resources/img/props/shovel_2.png" : "resources/img/props/shovel_1.png";
            if (c === "农") yy = "resources/img/props/farmer_1.png";
            $.instance().playSound("soldier_create");
            q.instance().spawnTrail(
              this.Mo.x,
              this.Mo.y,
              this.Po.x,
              this.Po.y,
              500,
              () => {
                if (this.tN()) n.release(l);
                else
                  try {
                    Pn.instance().refresh(c, o);
                    if (a === this.dg.map.ye - 1) {
                      wn.instance().VY();
                      Laya.timer.once(100, this, () => {
                        en.instance().wF();
                      });
                    }
                  } finally {
                    n.release(l);
                  }
              },
              uColor,
              yy,
            );
            if (a === this.dg.map.ye - 1) {
              i = true;
              Laya.Tween.create(this.roof)
                .to("rotation", 0)
                .duration(300)
                .parallel(this.deckLight)
                .to("scaleX", 0)
                .to("scaleY", 0)
                .duration(100);
            }
          });
      }, this);
  }

  D$(t: boolean, s: number, i: number): void {
    this.dg.map.ue[s][i] = t ? "1_0" : "1_1";
    this.Fj.get(`${s}_${i}`).skin = `resources/img/map/space_${this.mapIndex}.png`;
    q
      .instance()
      .digGrassToRoad(
        this.map,
        t,
        "resources/img/map/grass_" + this.dg.map.mapIndex + "_" + (t ? 0 : 1) + ".png",
        s * this.dg.map.gridWid,
        i * this.dg.map.gridHei,
      );
  }

  T$(t: boolean, s: number, i: number): void {
    this.dg.map.ue[s][i] = t ? "2_0" : "2_1";
    this.Fj.get(`${s}_${i}`).skin = "resources/img/map/grass_" + this.dg.map.mapIndex + "_" + (t ? 0 : 1) + ".png";
    q
      .instance()
      .growGrass(
        this.highGround,
        "resources/img/map/space_" + this.mapIndex + ".png",
        s * this.dg.map.gridWid,
        i * this.dg.map.gridHei,
      );
  }

  R$(t: boolean, s: any): void {
    const i = t ? "1_0" : "1_1";
    const h: any[] = [];
    for (let x = 0; x < this.dg.map.ue.length; x++)
      for (let e = 0; e < this.dg.map.ue[x].length; e++)
        if (this.dg.map.ue[x][e] === i && !Ki.instance().ZS(t, x, e)) h.push({ x, y: e });
    console.log("设置格子");
    if (h.length <= 0) return void s.removeSelf();
    const e = h[f.range(0, h.length, true)];
    const a = new Laya.Image("resources/img/gameObject/enemy/vine2.png");
    a.size(125, 112);
    a.anchor(0.5, 0.5);
    a.pos((e.x + 0.5) * this.dg.map.gridWid, (e.y + 0.5) * this.dg.map.gridHei);
    a.scale(0, 0);
    this.gameObjectBox.addChild(a);
    const n = e.x * this.dg.map.gridWid;
    const r = e.y * this.dg.map.gridHei;
    this.Mo.x = s.x;
    this.Mo.y = s.y;
    this.Po.x = n + this.dg.map.gridWid / 2;
    this.Po.y = r + this.dg.map.gridHei / 2;
    const o = f.distance(this.Mo as any, this.Po as any);
    Laya.Tween.create(s)
      .to("x", this.Po.x)
      .to("y", this.Po.y)
      .duration(o)
      .parallel()
      .to("rotation", o / 2)
      .chain()
      .to("alpha", 0)
      .duration(100)
      .then(() => {
        s.removeSelf();
      })
      .parallel(a)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(300)
      .chain(a)
      .to("alpha", 0)
      .duration(300)
      .then(() => {
        a.removeSelf();
        const tree = new Laya.Image("resources/img/gameObject/enemy/tree_" + (t ? "0" : "1") + "_0.png");
        tree.name = "tree";
        tree.size(this.dg.map.gridWid, this.dg.map.gridHei);
        tree.pos(e.x * this.dg.map.gridWid, e.y * this.dg.map.gridHei);
        tree.alpha = 0.7;
        this.gameObjectBox.addChild(tree);
        q
          .instance()
          .registerImgLoop(
            tree,
            [
              "resources/img/gameObject/enemy/tree_" + (t ? "0" : "1") + "_0.png",
              "resources/img/gameObject/enemy/tree_" + (t ? "0" : "1") + "_1.png",
              "resources/img/gameObject/enemy/tree_" + (t ? "0" : "1") + "_2.png",
            ],
            300,
            0,
            1,
            () => {
              Laya.Tween.create(tree)
                .to("alpha", 0)
                .duration(200)
                .then(() => {
                  tree.removeSelf();
                });
              if (t) {
                this.Fj.get(`${e.x}_${e.y}`).skin = `resources/img/map/grass_${this.mapIndex}_0.png`;
                this.dg.map.ue[e.x][e.y] = "2_0";
              } else {
                this.Fj.get(`${e.x}_${e.y}`).skin = `resources/img/map/grass_${this.mapIndex}_1.png`;
                this.dg.map.ue[e.x][e.y] = "2_1";
              }
            },
          );
      });
  }

  y$(): void {
    if (!Na.instance().pU) {
      K.instance().openDialog("DeckDialog");
      Na.instance().pU = true;
    }
    Laya.Point.TEMP.x = 0;
    Laya.Point.TEMP.y = 500;
  }

  k$(): void {
    const t = this.dg.battleState.gold;
    const s = this.dg.battleState.yi;
    const i = Number(this.goldNum.text) || 0;
    if (t > i && i < s && t >= s)
      Laya.Tween.create(this.refreshBtn)
        .to("scaleX", 1.1)
        .to("scaleY", 1.1)
        .duration(100)
        .chain()
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(100);
    this.refreshBtnMask.graphics.clear();
    const h = s > 0 ? Math.min(1, t / s) : 1;
    this.refreshBtnMask.graphics.drawRect(0, 0, this.maskImg.width * h, this.maskImg.height, "#fff");
    this.goldNum.text = t.toFixed(0);
    const e = t >= s;
    if (e) {
      this.maskImg.alpha = 1;
      if (!this.Nj) $.instance().playSound("soldier_buy_enable");
    } else this.maskImg.alpha = 0.6;
    this.Nj = e;
  }

  U$(_t?: any): void {}
  F$(): void {}

  sN(t: any): void {
    Laya.Tween.create(t)
      .to("scaleX", 0.9)
      .to("scaleY", 0.9)
      .duration(500)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(500)
      .then(() => this.sN(t), this);
  }

  r$(): void {
    this.Qj = f.range(3, 7, true);
    this.Zj = f.range(3, 7, true);
    this.iN = new Laya.Image();
    this.iN.name = "eat";
    this.iN.skin = "resources/img/battleUI/eat1.png";
    this.iN.anchorX = 0.5;
    this.iN.anchorY = 0.5;
    this.end1.addChild(this.iN);
    this.iN.alpha = 0;
    const t = new Laya.Image("resources/img/battleUI/deckBtn2.png");
    t.name = "shadow";
    t.size(44, 22);
    t.anchorX = 0.5;
    t.anchorY = 1;
    t.alpha = 0.5;
    t.pos(this.end1.width / 2, this.end1.height);
    this.end1.addChild(t);
    const s = new Laya.Image("resources/img/battleUI/deckBtn2.png");
    s.name = "shadow";
    s.size(44, 22);
    s.anchorX = 0.5;
    s.anchorY = 1;
    s.alpha = 0.5;
    s.pos(this.end2.width / 2, this.end2.height);
    this.end2.addChild(s);
    this.b$ = Zt.instance().pf("aDou");
    this.M$ = Zt.instance().pf("aDou");
    this.b$.name = "sk";
    this.M$.name = "sk";
    this.b$.anchorX = 0.5;
    this.b$.anchorY = 1;
    this.b$.pos(45, 70);
    this.M$.anchorX = 0.5;
    this.M$.anchorY = 1;
    this.M$.pos(45, 70);
    this.end1.addChild(this.b$);
    this.end2.addChild(this.M$);
    this.end1.visible = false;
    this.end2.visible = false;
    this.end1.addComponent(Xr);
    this.end2.addComponent(Xr);
  }

  hN(t: any, s: boolean): void {
    if (s) {
      this.qj += 1;
      if (this.qj > this.Qj) {
        this.qj = 0;
        this.Qj = f.range(3, 7, true);
        t.play("dou", false);
      } else t.play("zhan", false);
    } else {
      this.Vj += 1;
      if (this.Vj > this.Zj) {
        this.Vj = 0;
        this.Zj = f.range(3, 7, true);
        t.play("dou", false);
      } else t.play("zhan", false);
    }
  }

  g$(): void {
    const t = this.dg.map.ue;
    this.bg.skin = `resources/img/map/bg_${this.mapIndex}.png`;
    this.divide.skin = `resources/img/map/divide_${this.mapIndex}.png`;
    switch (this.mapIndex) {
      case 0:
        this.divide.pos(0, 304);
        this.divide.size(640, 184);
        break;
      case 1:
        this.divide.pos(0, 365);
        this.divide.size(659, 44);
        break;
      case 2:
        this.divide.pos(0, 384);
        this.divide.size(640, 23);
        break;
      case 3:
        this.divide.pos(0, 368);
        this.divide.size(644, 50);
    }
    let s: any = null;
    for (let i = 0; i < t.length; i++)
      for (let h = 0; h < t[i].length; h++) {
        s = this.Uj[i][h];
        if (t[i][h] === "0_0" || t[i][h] === "0_1") {
          s.skin = `resources/img/map/road_${this.mapIndex}.png`;
          this.road.addChild(s);
        } else if (t[i][h] === "1_0" || t[i][h] === "1_1") {
          s.skin = `resources/img/map/space_${this.mapIndex}.png`;
          this.highGround.addChild(s);
        } else if (t[i][h] === "2_0") {
          s.skin = `resources/img/map/grass_${this.mapIndex}_0.png`;
          this.highGround.addChild(s);
        } else if (t[i][h] === "2_1") {
          s.skin = `resources/img/map/grass_${this.mapIndex}_1.png`;
          this.highGround.addChild(s);
        }
      }
  }

  z$(_t: any, s: any, i: number, h: number): void {
    s.pos(i, h);
    this.highGround.addChild(s);
  }

  C$(t: boolean, s: number): void {
    if (s > 0) {
      this.w$(t);
      this.addHp(t, s);
    } else this.eN(t, Math.abs(s));
  }

  w$(t: boolean): void {
    let s: any;
    let i: any;
    let h: any;
    const e = t ? this.dg.battleState.playerLives : this.dg.battleState.enemyLives;
    const a = t ? this.end1.getChildByName("heartBox") : this.end2.getChildByName("heartBox");
    let n = a.numChildren;
    if (e > n)
      for (let k = 0; k < e - n; k++) {
        s = z.instance().getItem("heart", this);
        a.addChild(s);
      }
    else if (e < n)
      for (let k = 0; k < n - e; k++) {
        s = a.getChildAt(a.numChildren - 1);
        s.removeSelf();
        s.skin = "resources/img/battleUI/heart1.png";
        i = s.getChildAt(0);
        h = s.getChildAt(1);
        Laya.Tween.killAll(i);
        i.visible = false;
        i.rotation = 0;
        i.pos(14, 20);
        i.alpha = 1;
        Laya.Tween.killAll(h);
        h.visible = false;
        h.rotation = 0;
        h.pos(11, 20);
        h.alpha = 1;
        z.instance().recover("heart", s);
      }
    const r = Math.ceil(a.numChildren / 3);
    n = a.numChildren;
    for (let k = 0; k < n; k++) {
      s = a.getChildAt(k);
      s.visible = e > k;
      s.x = 10 + (k % 3) * 26;
      s.y = -20 * (r - Math.floor(k / 3) - 1) - 21;
    }
  }

  eN(t: boolean, s: number): void {
    $.instance().playSound("adou_hit");
    const i = t ? this.end1 : this.end2;
    const h = i.getChildByName("sk");
    const e = i.getChildByName("heartBox");
    const a = t ? this.dg.battleState.playerLives : this.dg.battleState.enemyLives;
    Laya.Tween.create(h)
      .to("rotation", -10 * s)
      .duration(100)
      .chain()
      .to("rotation", 10 * s)
      .duration(100)
      .chain()
      .to("rotation", 0)
      .duration(100);
    const l = () => {
      h.off(Laya.Event.STOPPED, l);
      h.play("zhan", true);
    };
    h.on(Laya.Event.STOPPED, this, l);
    if (this.dg.battleState.Xi) h.play("attack", false);
    else h.play("tu", false);
    for (let k = 0; k < s; k++) {
      const n = e.getChildAt(a + k);
      n.skin = "resources/img/battleUI/heart2.png";
      const r = n.getChildAt(0);
      const o = n.getChildAt(1);
      r.visible = true;
      o.visible = true;
      Laya.Tween.create(n)
        .to("scaleX", 1.5)
        .to("scaleY", 1.5)
        .duration(50)
        .chain()
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(50)
        .delay(250);
      Laya.Tween.create(r)
        .to("y", r.y - 10)
        .duration(50)
        .chain()
        .to("rotation", -90)
        .duration(100)
        .chain()
        .to("y", r.y + 50)
        .to("alpha", 0)
        .duration(200);
      Laya.Tween.create(o)
        .to("y", o.y - 10)
        .duration(50)
        .chain()
        .to("rotation", 90)
        .duration(100)
        .chain()
        .to("y", o.y + 50)
        .to("alpha", 0)
        .duration(200)
        .then(() => {
          this.w$(t);
        }, this);
    }
    if (this.dg.battleState.Xi) {
      this.aN(t, s);
      this.dg.battleState.Xi = false;
    }
  }

  aN(t: boolean, _s: number): void {
    if (Math.random() < 0.5) this.X$(t, "快拿去招兵买马");
    else this.X$(t, "我快不行了");
    const i = t ? this.end1 : this.end2;
    this.Mo.x = i.x;
    this.Mo.y = i.y;
    i.parent.localToGlobal(this.Mo);
    for (let s = 0; s < 10; s++)
      Laya.timer.once(100 * s, this, () => {
        q.instance().playGoldUp(this.Mo.x, this.Mo.y);
        if (t) this.dg.battleState.gold += 1;
        else this.dg.battleState.Ki += 1;
      });
  }

  addHp(t: boolean, s: number): void {
    const i = (t ? this.end1 : this.end2).getChildByName("heartBox");
    const h = t ? this.dg.battleState.playerLives : this.dg.battleState.enemyLives;
    for (let k = 0; k < s; k++) {
      const heart = i.getChildAt(h - k - 1);
      heart.skin = "resources/img/battleUI/heart1.png";
      Laya.Tween.to(
        heart,
        { scaleX: 1.5, scaleY: 1.5 },
        200,
        null,
        Laya.Handler.create(this, () => {
          Laya.Tween.to(heart, { scaleX: 1, scaleY: 1 }, 50);
        }),
      );
      this.Mo.x = heart.x;
      this.Mo.y = heart.y;
      this.Mo = heart.parent.localToGlobal(this.Mo);
      this.Mo = this.effectBox.globalToLocal(this.Mo);
      q.instance().redPoint(this.Mo.x, this.Mo.y);
    }
  }

  nN(): void {
    let t: any;
    let s: any;
    let i = this.end1.getChildByName("heartBox");
    Laya.Tween.killAll(this.b$);
    this.b$.offAll();
    this.b$.stop();
    this.b$.rotation = 0;
    for (let h = 0; h < i.numChildren; h++) {
      t = i.getChildAt(h);
      t.skin = "resources/img/battleUI/heart1.png";
      t.scale(1, 1);
      for (let k = 0; k < t.numChildren; k++) {
        s = t.getChildAt(k);
        Laya.Tween.killAll(s);
        s.y = 20;
        s.rotation = 0;
        s.alpha = 1;
        s.visible = false;
      }
    }
    i = this.end2.getChildByName("heartBox");
    Laya.Tween.killAll(this.M$);
    this.M$.offAll();
    this.M$.stop();
    this.M$.rotation = 0;
    for (let h = 0; h < i.numChildren; h++) {
      t = i.getChildAt(h);
      t.skin = "resources/img/battleUI/heart1.png";
      t.scale(1, 1);
      for (let k = 0; k < t.numChildren; k++) {
        s = t.getChildAt(k);
        Laya.Tween.killAll(s);
        s.y = 20;
        s.rotation = 0;
        s.alpha = 1;
        s.visible = false;
      }
    }
    this.iN.skin = "resources/img/battleUI/eat1.png";
    this.iN.alpha = 0;
  }

  O$(t: any, s?: number): void {
    this.effectBox.addChild(t);
    if (s != null) t.zIndex = s;
  }

  uX(_t?: any): void {
    this.round.text = "第" + this.dg.battleState.oi + "波";
  }

  u$(): void {
    if (this.dg.map.we) {
      this.ma.length = 0;
      const t = Oi.instance();
      const s = wi.instance().Mv(3)!.mv;
      for (let i = 0; i < s.length; i++) if (t.M_(true, i)) this.ma.push(i);
      if (this.ma.length <= 0) return void tt.instance().showTip("当前刷新栏无空格");
      const i = this.ma.length >= 2 ? 2 : this.ma.length;
      const h = () => {
        Laya.Point.TEMP.x = this.shovelAd.width / 2;
        Laya.Point.TEMP.y = this.shovelAd.height / 2;
        this.shovelAd.localToGlobal(Laya.Point.TEMP);
        for (let k = 0; k < i; k++) this.rN(Laya.Point.TEMP.x, Laya.Point.TEMP.y, this.ma[k]);
        this.shovelAd.visible = false;
        this.dg.map.we = false;
        this.dg.map.me = true;
        tt.instance().showTip(`恭喜您获得了${i}把铲子`);
      };
      if (this.dg.player.hasUsedFreeShovel) Mt.instance().uu(h, null, gt);
      else {
        this.dg.player.hasUsedFreeShovel = true;
        h();
      }
    }
    if (this.dg.map.ke) {
      const t = () => {
        Laya.Point.TEMP.x = this.shovelAd.width / 2;
        Laya.Point.TEMP.y = this.shovelAd.height / 2;
        this.shovelAd.localToGlobal(Laya.Point.TEMP);
        const tx = Laya.Point.TEMP.x;
        const ty = Laya.Point.TEMP.y;
        const i = this.dg.map.de;
        const h = i.length - 2;
        const e = i[h].x;
        const a = i[h].y;
        Laya.Point.TEMP.x = e * this.dg.map.gridWid + this.dg.map.gridWid / 2;
        Laya.Point.TEMP.y = a * this.dg.map.gridHei + this.dg.map.gridHei / 2;
        this.map.localToGlobal(Laya.Point.TEMP);
        const n = Laya.Point.TEMP.x;
        const r = Laya.Point.TEMP.y;
        q.instance().spawnTrail(
          tx,
          ty,
          n,
          r,
          500,
          () => {
            if (this.tN()) return;
            Zi.instance().Zx(true, 1).tk(null);
          },
          "#ffffff",
          "resources/img/battleUI/ad/bulldozer.png",
        );
        this.shovelAd.visible = false;
        this.dg.map.ke = false;
        this.dg.map.ve = true;
        tt.instance().showTip("阿斗已经高枕无忧了");
      };
      if (this.dg.player.hasUsedFreeBulldozer) Mt.instance().uu(t, null, dt);
      else {
        this.dg.player.hasUsedFreeBulldozer = true;
        t();
      }
    }
  }

  Y$(t: boolean, s: number, i?: number): void {
    if (s === 0) {
      if (this.dg.map.me) return;
      if (this.dg.map.ke) return;
      this.shovelAd.visible = t;
      this.shovelAd.getChildByName("adImg").visible = this.dg.player.hasUsedFreeShovel;
      if (t) {
        this.shovelAdImg.skin = "resources/img/battleUI/ad/shovel.png";
        this.shovelNum.text = `x${i}`;
        this.shovelNum.visible = true;
      }
      this.dg.map.we = t;
    } else {
      if (this.dg.map.ve) return;
      if (t && this.dg.map.ke) return;
      this.shovelAd.visible = t;
      this.shovelAd.getChildByName("adImg").visible = this.dg.player.hasUsedFreeBulldozer;
      if (t) {
        this.shovelAdImg.skin = "resources/img/battleUI/ad/bulldozer.png";
        this.shovelNum.visible = false;
      }
      this.dg.map.ke = t;
      if (this.dg.map.we) this.dg.map.we = false;
    }
  }

  Q$(t: number): void {
    if (this.shovelAdBg.alpha >= 1) this.Kj = -1;
    if (this.shovelAdBg.alpha <= 0) this.Kj = 1;
    this.shovelAdBg.alpha += (this.Kj * t) / 300;
    this.adLight.rotation += 1;
    if (this.adLight.rotation >= 360) this.adLight.rotation = 0;
  }

  l$(): void {
    const t = this.shovelAd.y;
    Laya.Tween.create(this.shovelAd)
      .to("scaleX", 1.2)
      .to("scaleY", 0.8)
      .duration(50)
      .delay(3000)
      .chain()
      .to("scaleX", 0.8)
      .to("scaleY", 1.2)
      .to("y", t - 30)
      .duration(100)
      .chain()
      .to("scaleX", 0.9)
      .to("scaleY", 1.1)
      .to("y", t)
      .duration(80)
      .chain()
      .to("scaleX", 1.1)
      .to("scaleY", 0.9)
      .duration(50)
      .chain()
      .to("scaleX", 0.9)
      .to("scaleY", 1.1)
      .to("y", t - 15)
      .duration(100)
      .chain()
      .to("scaleX", 0.95)
      .to("scaleY", 1.15)
      .to("y", t)
      .duration(60)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(50)
      .then(() => {
        this.l$();
      }, this);
  }

  X$(t: boolean, s: string): void {
    const i = t ? this.end1 : this.end2;
    this.Mo.x = i.x < 320 ? i.width : 0;
    this.Mo.y = 0;
    this.Mo = i.localToGlobal(this.Mo);
    q.instance().showTalkBox(this.Mo.x, this.Mo.y, s, i);
  }

  G$(t: boolean, s: any, i: () => void): void {
    const h = t ? this.end1 : this.end2;
    this.Mo.x = h.x;
    this.Mo.y = h.y;
    this.Mo = h.parent.localToGlobal(this.Mo);
    this.Mo = s.parent.globalToLocal(this.Mo);
    if (t) Laya.Tween.to(this.iN, { alpha: 1 }, 100);
    Laya.Tween.to(
      s,
      { x: this.Mo.x, y: this.Mo.y, rotation: 720 },
      500,
      null,
      Laya.Handler.create(this, () => {
        this.iN.skin = "resources/img/battleUI/eat2.png";
        s.visible = false;
        if (t)
          Laya.Tween.to(
            this.iN,
            { alpha: 0 },
            300,
            null,
            Laya.Handler.create(this, () => {
              this.iN.skin = "resources/img/battleUI/eat1.png";
            }),
          );
        i();
      }),
    );
  }

  pause(): void {
    K.instance().openDialog("PauseDialog");
  }

  _$(t: any, s: number): void {
    for (let i = 0; i < t.numChildren; i++)
      Laya.timer.once(400 * i, this, () => {
        t.getChildAt(i).alpha = 1;
        if (i === t.numChildren - 1)
          Laya.Tween.to(
            t.getChildAt(i),
            { alpha: 0 },
            1200,
            null,
            Laya.Handler.create(this, () => {
              if ((s += 1) <= 5) this._$(t, s);
            }),
          );
        else Laya.Tween.to(t.getChildAt(i), { alpha: 0 }, 1200);
      });
  }

  oN(): void {
    for (let t = 0; t < this.pathTip0.numChildren; t++) this.pathTip0.getChildAt(0).alpha = 0;
    for (let t = 0; t < this.pathTip0.numChildren; t++) this.pathTip1.getChildAt(0).alpha = 0;
  }

  H$(t: boolean): void {
    if (t) {
      this.Y$(true, 1);
      if (this.Jj) return;
      this.Jj = true;
      Laya.timer.once(1000, this, () => {
        this.danger0.scale(1, 1);
        this.danger1.scale(1, 1);
        this.Jj = false;
      });
      $.instance().playSound("danger_tip");
      this.danger0.alpha = 0.8;
      this.danger1.alpha = 0.8;
      Laya.Tween.create(this.danger0)
        .to("scaleX", 1.1)
        .to("scaleY", 1.1)
        .to("alpha", 1)
        .duration(200)
        .chain()
        .to("scaleX", 1.2)
        .to("scaleY", 1.2)
        .duration(200)
        .chain()
        .to("scaleX", 1.3)
        .to("scaleY", 1.3)
        .to("alpha", 0)
        .duration(200);
      Laya.Tween.create(this.danger1)
        .to("scaleX", 1.4)
        .to("scaleY", 1.4)
        .to("alpha", 0.8)
        .duration(200)
        .chain()
        .to("scaleX", 2.2)
        .to("scaleY", 2.2)
        .to("alpha", 0)
        .duration(400);
    } else {
      if (this.t$) return;
      this.t$ = true;
      Laya.timer.once(1000, this, () => {
        this.danger2.scale(1, 1);
        this.danger3.scale(1, 1);
        this.t$ = false;
      });
      $.instance().playSound("danger_tip");
      this.danger2.alpha = 0.8;
      this.danger3.alpha = 0.8;
      Laya.Tween.create(this.danger2)
        .to("scaleX", 1.1)
        .to("scaleY", 1.1)
        .to("alpha", 1)
        .duration(200)
        .chain()
        .to("scaleX", 1.2)
        .to("scaleY", 1.2)
        .duration(200)
        .chain()
        .to("scaleX", 1.3)
        .to("scaleY", 1.3)
        .to("alpha", 0)
        .duration(200);
      Laya.Tween.create(this.danger3)
        .to("scaleX", 1.4)
        .to("scaleY", 1.4)
        .to("alpha", 0.8)
        .duration(200)
        .chain()
        .to("scaleX", 2.2)
        .to("scaleY", 2.2)
        .to("alpha", 0)
        .duration(400);
      if (!wn.instance().CY && !this.s$ && !mn.instance().LY) {
        this.s$ = true;
        if (Math.random() <= this.dg.config.ni[this.dg.battleState.ki]) mn.instance().TY();
      }
    }
  }

  W$(t: boolean, s = false): void {
    const i = t ? this.x$ : this.S$;
    if (s) i.play("boss" + this.mapIndex, false);
    else i.play("mob" + this.mapIndex, false);
  }

  I$(t: boolean, s: boolean, i: any, h: number, e: number): void {
    let a: any;
    const n = t ? this.propsBox.numChildren : this.propsBoxAi.numChildren;
    const r = t ? this.propsBox : this.propsBoxAi;
    const o = e * this.dg.props.Ze + h;
    if (o < n) {
      a = r.getChildAt(o);
      a.skin = s ? "resources/img/props/activePropsBgNew.png" : "resources/img/props/passivePropsBgNew.png";
      console.log("展示道具", t);
      a.visible = true;
      i.pos((a.width - i.width) / 2, (a.height - i.height) / 2);
      a.addChild(i);
    } else {
      console.log("道具已满", t);
      i.visible = false;
      r.addChild(i);
    }
  }

  j$(t: boolean, s: number, i: number): void {
    if (!(t && this.rN(s, i))) this.lN(t, s, i);
  }

  rN(t: number, s: number, i = -1): boolean {
    const h = Oi.instance();
    const e = h.A_(true, i);
    if (!e) {
      console.log("没有可以放置铲子的位置");
      return false;
    }
    const { index: a, token: n } = e;
    const r = this.refreshBox.width / this.dg.map.ye;
    const o = this.refreshBox.height;
    this.Po.x = r * a + r / 2;
    this.Po.y = o / 2;
    this.refreshBox.localToGlobal(this.Po);
    const l = F.instance().battleState.Gi ? "resources/img/props/shovel_2.png" : "resources/img/props/shovel_1.png";
    q.instance().spawnTrail(
      t,
      s,
      this.Po.x,
      this.Po.y,
      500,
      () => {
        if (this.tN()) {
          h.release(n);
          return;
        }
        try {
          Zi.instance().Zx(true, 0, 3, a);
        } finally {
          h.release(n);
        }
      },
      "#ffffff",
      l,
    );
    return true;
  }

  lN(t: boolean, s: number, i: number, h = -1, e = -1): boolean {
    if (h < 0 || e < 0) {
      const target = t ? "2_0" : "2_1";
      const grid = this.dg.map.ue;
      outer: for (let x = grid.length - 1; x >= 0; x--)
        for (let a = grid[0].length - 1; a >= 0; a--)
          if (grid[x][a] === target) {
            h = x;
            e = a;
            break outer;
          }
    }
    if (h < 0 || e < 0) return false;
    Laya.Point.TEMP.x = this.dg.map.gridWid * h + this.dg.map.gridWid / 2;
    Laya.Point.TEMP.y = this.dg.map.gridHei * e + this.dg.map.gridHei / 2;
    this.map.localToGlobal(Laya.Point.TEMP);
    const a = (t ? F.instance().battleState.Gi : F.instance().battleState.Hi)
      ? "resources/img/props/shovel_2.png"
      : "resources/img/props/shovel_1.png";
    q.instance().spawnTrail(
      s,
      i,
      Laya.Point.TEMP.x,
      Laya.Point.TEMP.y,
      500,
      () => {
        if (this.tN()) return;
        this.D$(t, h, e);
      },
      "#ffffff",
      a,
    );
    return true;
  }

  $$(t: boolean, s: number, i: number, h: number): void {
    const e = i * this.dg.props.Ze + s;
    if (i < 1) this.cN(t, e, h);
    else this.uN(t, e, h);
  }

  cN(t: boolean, s: number, i: number): void {
    const h = (t ? this.propsBox : this.propsBoxAi).getChildAt(s).getChildByName("maskSp");
    h.graphics.cmds[0].startAngle = i;
    h.graphics.repaint();
    if (i < 360) return;
    const e = (t ? this.propsBox : this.propsBoxAi).getChildAt(s);
    const a = e.getChildByName("tip1");
    const n = e.getChildByName("tip2");
    const r = e.getChildByName("bgLight");
    e.getChildByName("bg").gray = false;
    a.visible = true;
    n.visible = true;
    r.visible = true;
    if (t) {
      Laya.Point.TEMP.x = e.width / 2;
      Laya.Point.TEMP.y = e.height / 2;
      e.localToGlobal(Laya.Point.TEMP);
      this.pN(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    }
    console.log("主动道具冷却结束", s);
    Laya.Tween.create(a)
      .to("rotation", 360)
      .duration(2000)
      .then(() => {
        a.rotation = 0;
      })
      .repeat(-1);
    Laya.Tween.create(n)
      .to("rotation", 360)
      .duration(2000)
      .then(() => {
        n.rotation = 0;
      })
      .repeat(-1);
    const o = () => {
      Laya.Tween.create(r).to("alpha", 0.5).duration(1000).chain().to("alpha", 1).duration(1000).then(o);
    };
    o();
  }

  uN(_t: boolean, _s: number, _i: number): void {}

  N$(t: boolean, s: number, i: number): void {
    const h = i * this.dg.props.Ze + s;
    if (i < 1) this.yN(t, h);
    else this.fN(t, h);
  }

  yN(t: boolean, s: number): void {
    const i = (t ? this.propsBox : this.propsBoxAi).getChildAt(s);
    const h = i.getChildByName("tip1");
    const e = i.getChildByName("tip2");
    const a = i.getChildByName("bgLight");
    Laya.Tween.killAll(h);
    Laya.Tween.killAll(e);
    Laya.Tween.killAll(a);
    h.visible = false;
    e.visible = false;
    a.visible = false;
    h.rotation = 0;
    e.rotation = 0;
    i.getChildByName("bg").gray = true;
  }

  fN(_t: boolean, _s: number): void {}

  pN(t: number, s: number): void {
    if (this.dg.player.hasPlacedActivePropThisBattle) return;
    if (this.i$) return;
    this.i$ = true;
    if (!this.gN) {
      this.gN = new Laya.Image("resources/img/battleUI/hand.png");
      this.gN.size(75, 87);
      this.effectBox.addChild(this.gN);
      this.gN.zIndex = X.$r;
    }
    this.gN.visible = true;
    Laya.Point.TEMP.x = t;
    Laya.Point.TEMP.y = s;
    this.effectBox.globalToLocal(Laya.Point.TEMP);
    const i = Laya.Point.TEMP.x;
    const h = Laya.Point.TEMP.y;
    this.gN.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    Laya.Point.TEMP.x = this.map.width / 2;
    Laya.Point.TEMP.y = this.map.height * (3 / 4);
    this.map.localToGlobal(Laya.Point.TEMP);
    this.effectBox.globalToLocal(Laya.Point.TEMP);
    const e = Laya.Point.TEMP.x;
    const a = Laya.Point.TEMP.y;
    Laya.Tween.create(this.gN)
      .to("x", e)
      .to("y", a)
      .duration(2000)
      .then(() => {
        this.gN.pos(i, h);
      })
      .repeat(2)
      .then(() => {
        this.gN.visible = false;
        this.i$ = false;
      });
  }

  V$(): void {
    if (this.gN) {
      Laya.Tween.killAll(this.gN);
      this.gN.destroy();
      this.gN = null;
      this.dg.player.hasPlacedActivePropThisBattle = true;
    }
  }

  hP(t: boolean): void {
    let s = t ? this.h$ : this.e$;
    let i = t ? this.se : this.ee;
    const h = this.dg.map;
    if (!s) {
      s = new Laya.Point();
      i = new Laya.Point();
    }
    s.x = (t ? h.te.x : h.he.x) * h.gridWid + this.dg.map.gridWid / 2;
    s.y = (t ? h.te.y : h.he.y) * h.gridWid + this.dg.map.gridHei / 2;
    i.x = (t ? h.se.x : h.ee.x) * h.gridWid + this.dg.map.gridWid / 2;
    i.y = (t ? h.se.y : h.ee.y) * h.gridWid + this.dg.map.gridHei;
  }

  K$(t: any, s: any): void {
    if (t.parent !== s) s.addChild(t);
  }

  dN(t: any): void {
    this.K$(t, this.gameObjectBox);
    this.LN(t);
  }

  LN(t: any): void {
    t.zIndex = X.entityZIndexFromPixelY(t.y + t.height, this.dg.map.gridHei) + 1;
  }

  v$(t: boolean): void {
    const s = t ? this.end1 : this.end2;
    const i = t ? this.b$ : this.M$;
    this.W$(t);
    const h = t ? this.h$ : this.e$;
    const e = t ? this.se : this.ee;
    i.play("attack", true);
    s.anchorX = 0.5;
    s.anchorY = 1;
    s.scale(0, 0);
    s.pos(h.x, h.y);
    s.visible = true;
    Laya.Tween.create(s)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(300)
      .then(() => {
        const i1 = h.y > e.y ? s.y - F.instance().map.gridHei / 4 : s.y + F.instance().map.gridHei * (3 / 4);
        Laya.Tween.create(s)
          .to("y", i1)
          .to("scaleX", 1.2)
          .to("scaleY", 1.2)
          .duration(300)
          .then(() => {
            const i2 = h.y > e.y ? s.y - F.instance().map.gridHei / 4 : s.y + F.instance().map.gridHei * (3 / 4);
            Laya.Tween.create(s)
              .to("y", i2)
              .to("scaleX", 1)
              .to("scaleY", 1)
              .duration(300)
              .then(() => {
                Laya.Tween.create(s)
                  .to("scaleX", 1.1)
                  .to("scaleY", 0.9)
                  .duration(100)
                  .then(() => {
                    Laya.Tween.create(s)
                      .to("scaleX", 1)
                      .to("scaleY", 1)
                      .duration(100)
                      .then(() => {
                        s.anchorX = 0;
                        s.anchorY = 0;
                        s.pos(s.x - s.width / 2, s.y - s.height);
                        this.mN(t);
                      });
                  });
              });
          });
      });
  }

  mN(t: boolean): void {
    const s = t ? this.end1 : this.end2;
    const i = t ? this.b$ : this.M$;
    i.play("pao", true);
    let h = s.getComponent(Xr);
    if (!h) h = s.addComponent(Xr);
    h.Ej(200);
    h.Aj(t);
    h.Pj(null);
    h.Ij(() => {
      this.dN(s);
      i.on(Laya.Event.STOPPED, this, this.hN, [i, t]);
      i.play("attack", false);
    });
    h.enable();
    if (Math.random() < 0.5)
      Laya.timer.once(f.range(1000, 2000, true), this, () => {
        this.X$(t, "护驾！护驾！");
      });
    if (Math.random() < 0.5)
      Laya.timer.once(f.range(2000, 3000, true), this, () => {
        const dir = h.Tj();
        i.stop();
        Laya.Tween.create(i)
          .to("rotation", dir.x > 0 ? 90 : -90)
          .duration(300)
          .then(() => {
            h.disable();
          })
          .chain()
          .to("rotation", 0)
          .duration(300)
          .delay(1000)
          .then(() => {
            h.enable();
            i.play("pao", true);
          });
      });
  }

  q$(t: string): void {
    if (t)
      if (this.jj) {
        const s = this.jj.getChildAt(0);
        if (s) s.text = t;
        Laya.timer.clear(this, this.wN);
        Laya.Tween.killAll(this.jj);
        this.jj.scale(0.85, 0.85);
        Laya.Tween.create(this.jj)
          .to("scaleX", 1.12)
          .to("scaleY", 1.12)
          .duration(100)
          .chain()
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(80)
          .then(() => {
            this.vN();
          }, this);
      } else {
        this.jj = this.kN(t);
        this.addChild(this.jj);
        this.jj.alpha = 0;
        this.jj.scale(0.4, 0.4);
        Laya.Tween.create(this.jj)
          .to("alpha", 1)
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(220)
          .then(() => {
            this.vN();
          }, this);
      }
    else this._N();
  }

  _N(): void {
    if (!this.jj) return;
    Laya.timer.clear(this, this.wN);
    Laya.Tween.killAll(this.jj);
    const t = this.jj;
    this.jj = null;
    Laya.Tween.create(t)
      .to("alpha", 0)
      .to("scaleX", 0.5)
      .to("scaleY", 0.5)
      .duration(180)
      .then(() => {
        t.removeSelf();
      }, this);
  }

  xN(): void {
    Laya.timer.clear(this, this.wN);
    if (this.jj) {
      Laya.Tween.killAll(this.jj);
      this.jj.removeSelf();
      this.jj = null;
    }
  }

  vN(): void {
    this.$j = true;
    Laya.timer.loop(320, this, this.wN);
  }

  wN(): void {
    if (!this.jj) return;
    const t = this.$j ? 1.1 : 1;
    this.$j = !this.$j;
    Laya.Tween.create(this.jj).to("scaleX", t).to("scaleY", t).duration(290);
  }

  kN(t: string): any {
    const s = Laya.stage.width;
    const i = Laya.stage.height;
    const h = s - 40;
    const e = new Laya.Text();
    e.text = t;
    e.color = "#FFD700";
    e.bold = true;
    e.fontSize = 40;
    e.stroke = 5;
    e.strokeColor = "#7B2800";
    e.align = "center";
    e.wordWrap = false;
    e.width = h;
    e.height = 60;
    e.pos(-h / 2, -30);
    const a = new Laya.Sprite();
    a.zIndex = X.qr;
    a.addChild(e);
    const n = new Laya.Point(s / 2, 0.25 * i);
    this.globalToLocal(n);
    a.pos(n.x, n.y);
    return a;
  }

  tN(): boolean {
    return this.gM || this.dg.battleState.Vi;
  }

  gameOver(): void {
    this.gM = true;
    Oi.instance().clear();
    j.instance().unregister("BattleScene");
    Laya.timer.clearAll(this);
    this.nN();
    this.shovelAd.visible = false;
    this.s$ = false;
    Laya.Tween.killAll(this.deckBtn);
    Laya.Tween.killAll(this.roof);
    Laya.Tween.killAll(this.deckLight);
    this.deckBtn.scale(1, 1);
    this.roof.rotation = 0;
    this.deckLight.scale(0, 0);
    this.oN();
    this.Xj = 0;
    q.instance().clearTrails();
    Fh.clearAllDeferredTrails();
    this.Z$.removeSelf();
    for (let t = 0; t < this.propsBox.numChildren; t++)
      if (this.propsBox.getChildAt(t).name === "bg") this.propsBox.getChildAt(t).visible = false;
    for (let t = 0; t < this.propsBoxAi.numChildren; t++)
      if (this.propsBoxAi.getChildAt(t).name === "bg") this.propsBoxAi.getChildAt(t).visible = false;
    K.instance().closeScene("BattleScene", false);
    for (let t = 0; t < this.dg.props.Ze; t++) {
      this.N$(true, t, 0);
      this.N$(false, t, 0);
    }
    for (let t = 0; t < this.dg.props.Ke; t++) {
      this.N$(true, t, 1);
      this.N$(false, t, 1);
    }
    this.Jj = false;
    this.t$ = false;
    if (this.gN) {
      Laya.Tween.killAll(this.gN);
      this.gN.visible = false;
    }
    this.xN();
    this.end1.visible = false;
    this.end2.visible = false;
    this.i$ = false;
  }
}
