// WeaponScene — the weapon bag: fragment grid + general equip panel + drag-equip
// (the bundle's `Ao`, @regClass 2W4HBomWSJ6oNhdw0SDA8A).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~37340-38577. The left panel (`zJ`/`i0`/`a0`) lays out completed-weapon groups
// and incomplete fragments in a paged grid; the right panel (`jJ`/`j0`) shows the
// generals and their equipped weapons. Dragging a weapon onto a general equips it
// (`b1`/`A1` via WeaponFragmentMgr), with attribute-change tooltips (`Z0`), a
// replace preview (`V0`), and a first-time drag tutorial (`f0`..`x0`). A Spine2D
// "mihuan" idle plays between bouts. Opaque field / method names + the `Ao.*`
// layout constants kept verbatim; node refs bound from WeaponScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { GameMgr } from "../core/game-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { WeaponFragmentMgr } from "../battle/weapon-fragment-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { PrefabFactory } from "../battle/prefab-factory";
import { PrefabPool } from "../battle/prefab-pool";
import { TipMgr } from "../core/tip-mgr";
import { MathE } from "../core/math-e";


@regClass("2W4HBomWSJ6oNhdw0SDA8A")
export class WeaponScene extends Laya.Scene {
  // .ls-bound nodes
  xBtn!: any;
  recycleBtn!: any;
  switchBtn1!: any;
  switchBtn2!: any;
  mihuan!: any;
  bg2!: any;
  weaponPanel!: any;
  generalPanel!: any;
  pageTxt!: any;

  // layout constants (`Ao.*`)
  static KJ: any = { 1: 0, 0: 1, 2: 2, 3: 3 };
  static P0 = 6;
  static A0 = 2 * WeaponScene.P0;
  static JJ = 30;
  static t0 = 649;
  static h0 = 640;
  static s0 = 169;
  static dW = 59;
  static e0 = 7 * (WeaponScene.dW + WeaponScene.A0);
  static E0 = 16;
  static B0 = 16;
  static gW = [96, 115, 141, 169];
  static H0 = 280;
  static K0 = "resources/img/effect/arrowDown.png";
  static J0 = "resources/img/effect/arrowUp.png";
  static t1 = -90;
  static s1 = 90;
  static i1 = 100;
  static e1 = 100;
  static h1 = 60;
  static a1 = 1000;
  static n1 = 600;
  static S0 = 0;
  static _0 = 5;
  static I1 = 18;
  static S1 = WeaponScene.I1 * WeaponScene.I1;
  static c0 = 220;
  static u0 = 9;
  static u1 = 52;

  private bX: any = null;
  private qK: any = null;
  private VK: any = null;
  private QK = -1;
  private ZK = new Laya.Point();
  private dragging = false;
  private KK = "none";
  private JK = -1;
  private tJ = -1;
  private sJ: any[] = [];
  private iJ: any[] = [];
  private hJ = false;
  private eJ: any = null;
  private aJ = 0;
  private nJ: any = null;
  private rJ = 0;
  private oJ = 0;
  private lJ = 0;
  private cJ = 0;
  private uJ = 1;
  private pJ = 0;
  private yJ = false;
  private fJ = 0;
  private gJ = new Map<number, number>();
  private dJ: any[] = [];
  private LJ: any[] = [];
  private mJ: any[] = [];
  private wJ: any[] = [];
  private vJ = new Set<any>();
  private kJ = -1;
  private _J = -1;
  private xJ: any = null;
  private SJ: any[] = [];
  private bJ = false;
  private MJ: any = null;
  private PJ: any = null;
  private AJ: any = null;
  private EJ = true;
  private BJ = 0;
  private IJ = -1;
  private DJ = 0;
  private TJ = 0;
  private RJ = false;
  private CJ = -1;
  private UJ = false;
  private FJ: any = null;
  private OJ = "";
  private YJ = 0;
  private HJ!: any;

  onAwake(): void {
    this.xBtn.on(Laya.Event.CLICK, this, this.Bu);
    this.recycleBtn.on(Laya.Event.CLICK, this, this.XJ);
    this.switchBtn1.on(Laya.Event.CLICK, this, () => this.GJ(-1));
    this.switchBtn2.on(Laya.Event.CLICK, this, () => this.GJ(1));
    EffectMgr.instance().bindButtons([this.xBtn, this.recycleBtn, this.switchBtn1, this.switchBtn2]);
  }

  onOpened(_t?: any): void {
    this.HJ = this.mihuan.getComponent(Laya.Spine2DRenderNode);
    this.WJ();
    WeaponFragmentMgr.instance().refresh();
    this.gJ.clear();
    const i = GameMgr.instance().player.getNewWeaponIds();
    if (i.length > 0) for (const t of i) this.gJ.set(t, (this.gJ.get(t) ?? 0) + 1);
    this.zJ(this.gJ);
    this.jJ();
    if (i.length > 0) {
      const t = this.gJ;
      const s = GameMgr.instance().weaponData;
      const list = Array.from(t.entries()).map(([id, count]) => {
        const w = s.getWeapon(id);
        return { weaponId: id, name: w ? w.txt : "", count };
      });
      SceneMgr.instance().openDialog("NewWeaponDialog", false, { list, LW: () => this.$J() });
    }
    this.on(Laya.Event.MOUSE_DOWN, this, this.NJ);
    this.on(Laya.Event.MOUSE_MOVE, this, this.qJ);
    this.on(Laya.Event.MOUSE_UP, this, this.VJ);
    this.QJ();
  }

  WJ(): void {
    const t = Laya.stage.height < 1386 ? 1386 / Laya.stage.height : 1;
    this.bg2.width = this.bg2.width * t;
    for (let k = 0; k < this.bg2.children.length; k++) {
      const s = this.bg2.children[k];
      s.x = (this.bg2.width - s.width) / 2;
    }
    this.bg2.y = Laya.stage.height * t - this.bg2.height;
  }

  QJ(): void {
    const t = MathE.range(5000, 8000, true);
    Laya.timer.once(t, this, () => {
      this.mihuan.once(Laya.Event.STOPPED, this, this.ZJ);
      this.HJ.play("ci", false);
    });
  }

  ZJ(): void {
    this.mihuan.off(Laya.Event.STOPPED, this, this.ZJ);
    this.HJ.play("zhan", true);
    this.QJ();
  }

  zJ(t: any, s = false, i?: any): void {
    this.fJ++;
    this.yJ = false;
    if (this.nJ && !this.nJ.destroyed) Laya.Tween.killAll(this.nJ);
    this.weaponPanel.removeChildren();
    this.iJ.length = 0;
    this.rJ = 0;
    const e = WeaponFragmentMgr
      .instance()
      .Fb()
      .filter((x: any) => !x.Sb)
      .slice();
    e.sort((a: any, b: any) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      const ea = WeaponScene.KJ[a.type] ?? 99;
      const eb = WeaponScene.KJ[b.type] ?? 99;
      return ea !== eb ? ea - eb : a.weaponId !== b.weaponId ? a.weaponId - b.weaponId : a.id - b.id;
    });
    const a = e.filter((x: any) => x.isComplete);
    const n = e.filter((x: any) => !x.isComplete);
    const r = new Map<number, any[]>();
    for (const x of a) {
      const arr = r.get(x.weaponId) ?? [];
      arr.push(x);
      r.set(x.weaponId, arr);
    }
    const o: number[] = [];
    for (const x of a) if (o.indexOf(x.weaponId) === -1) o.push(x.weaponId);
    const l = o.map((id) => ({ type: "group", weaponId: id, Ai: r.get(id) }));
    const c = n.map((x: any) => ({ type: "fragment", Hn: x }));
    this.sJ = l.concat(c as any);
    const u = WeaponScene.JJ;
    this.oJ = WeaponScene.t0;
    this.lJ = WeaponScene.s0;
    this.cJ = WeaponScene.dW;
    const p = this.i0(this.sJ);
    const y = this.uJ;
    const ff = WeaponScene.h0;
    const g = this.oJ;
    const d = ff * (y - 1) + g;
    const L = WeaponScene.e0;
    const m = Math.max(L, this.pJ);
    const w = new Laya.Box();
    w.size(d, m);
    const v = (this.weaponPanel.width - g) / 2;
    w.pos(v, u);
    this.nJ = w;
    this.weaponPanel.addChild(w);
    for (let k = 0; k < this.sJ.length; k++) {
      const h = this.sJ[k];
      const e2 = p[k];
      const a2 = e2 ? e2.x : 0;
      const n2 = e2 ? e2.y : 0;
      const item = this.a0(h, WeaponScene.s0, WeaponScene.dW);
      const o2 = this.n0(h);
      const l2 = s && i ? i.get(o2) : null;
      if (l2) {
        item.x = l2.x;
        item.y = l2.y;
      } else {
        item.x = a2;
        item.y = n2;
      }
      w.addChild(item);
      this.iJ.push(item);
    }
    this.r0(t);
    this.o0(y);
    if (s) this.l0();
  }

  l0(): void {
    if (!this.nJ) return;
    const t = WeaponScene.c0;
    const s = WeaponScene.u0;
    const i = this.i0(this.sJ);
    this.iJ.forEach((h, e) => {
      if (!h || h.destroyed) return;
      if (h === this.qK) return;
      const a = i[e];
      const n = a ? a.x : h.x;
      const r = a ? a.y : h.y;
      if (h.parent !== this.nJ) this.nJ.addChild(h);
      Laya.Tween.killAll(h);
      const o = n;
      const l = r;
      Laya.timer.once(e * s, this, () => {
        if (h && !h.destroyed) Laya.Tween.create(h).to("x", o).to("y", l).duration(t).ease(Laya.Ease.quadOut);
      });
    });
  }

  n0(t: any): string {
    return t.type === "group" ? `group:${t.weaponId}` : `fragment:${t.Hn.weaponId}`;
  }

  p0(): Map<string, any> {
    const t = new Map<string, any>();
    const s = Math.min(this.sJ.length, this.iJ.length);
    for (let i = 0; i < s; i++) {
      const ss = this.sJ[i];
      const h = this.iJ[i];
      if (ss && h && !h.destroyed && h.parent === this.nJ) t.set(this.n0(ss), new Laya.Point(h.x, h.y));
    }
    return t;
  }

  r0(t: any): void {
    if (t && t.size !== 0)
      for (let i = 0; i < this.sJ.length && i < this.iJ.length; i++) {
        const h = this.sJ[i];
        const e = this.iJ[i];
        if (!h || !e) continue;
        const a = e.getChildByName("newTxt");
        if (!a) continue;
        if (h.type !== "group") {
          a.visible = false;
          continue;
        }
        const n = t.get(h.weaponId) ?? 0;
        a.visible = n > 0;
      }
  }

  $J(): void {
    GameMgr.instance().player.clearNewWeapons();
    this.gJ.clear();
    this.y0();
  }

  y0(): void {
    if (!GameMgr.instance().player.weaponSceneDragGuideDone) this.f0();
  }

  f0(): void {
    if (GameMgr.instance().player.weaponSceneDragGuideDone || this.bJ) return;
    const t = this.g0();
    if (t < 0) return;
    this.IJ = t;
    this.BJ = 0;
    this.bJ = true;
    this.d0();
    this.L0();
  }

  g0(): number {
    for (let t = 0; t < this.sJ.length; t++) {
      const s = this.sJ[t];
      if (s.type !== "group") continue;
      const i = s.Ai[0];
      if (i && i.type === 1) return t;
    }
    return -1;
  }

  d0(): void {
    this.m0();
    const t = new Laya.Box();
    t.mouseEnabled = false;
    t.zIndex = 100000;
    const s = new Laya.Image("resources/img/battleUI/hand.png");
    s.size(75, 87);
    s.visible = true;
    t.addChild(s);
    const i = this.w0();
    this.AJ = i;
    t.addChild(i);
    i.alpha = 0;
    i.scale(0.4, 0.4);
    Laya.Tween.create(i)
      .to("alpha", 1)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(220)
      .then(() => {
        if (this.bJ) this.v0();
      });
    this.addChild(t);
    this.MJ = t;
    this.PJ = s;
  }

  w0(): any {
    const t = Laya.stage.width;
    const s = Laya.stage.height;
    const i = new Laya.Text();
    i.text = "请将武器拖到赵云身上";
    i.color = "#FFD700";
    i.bold = true;
    i.fontSize = 40;
    i.stroke = 5;
    i.strokeColor = "#7B2800";
    i.align = "center";
    i.valign = "middle";
    i.width = 500;
    i.height = 60;
    const h = new Laya.Sprite();
    h.size(500, 60);
    h.anchor(0.5, 0.5);
    h.addChild(i);
    const e = new Laya.Point(t / 2, 0.4 * s);
    this.globalToLocal(e);
    h.pos(e.x, e.y);
    return h;
  }

  v0(): void {
    if (this.bJ && this.AJ) {
      this.EJ = true;
      Laya.timer.loop(320, this, this.k0);
    }
  }

  k0(): void {
    if (!this.bJ || !this.AJ || this.AJ.destroyed) return;
    const t = this.EJ ? 1.1 : 1;
    this.EJ = !this.EJ;
    Laya.Tween.create(this.AJ).to("scaleX", t).to("scaleY", t).duration(290);
  }

  L0(): void {
    if (!this.bJ || !this.PJ || !this.MJ) return;
    if (this.BJ >= WeaponScene._0) return void this.x0(true);
    const t = this.IJ;
    const s = this.iJ[t];
    const i = this.LJ[WeaponScene.S0];
    if (!s || !i || s.destroyed || i.destroyed) return void this.x0(false);
    const h = s.localToGlobal(new Laya.Point(0.5 * s.width, 0.5 * s.height));
    const e = i.localToGlobal(new Laya.Point(0.5 * i.width, 0.5 * i.height));
    const a = this.MJ.globalToLocal(h);
    const n = this.MJ.globalToLocal(e);
    this.PJ.visible = true;
    this.PJ.pos(a.x, a.y);
    Laya.Tween.killAll(this.PJ);
    Laya.Tween.create(this.PJ)
      .to("x", n.x)
      .to("y", n.y)
      .duration(2000)
      .ease(Laya.Ease.quadOut)
      .then(() => {
        if (this.bJ && this.PJ) {
          this.BJ++;
          if (this.BJ >= WeaponScene._0) this.x0(true);
          else {
            this.PJ.pos(a.x, a.y);
            this.L0();
          }
        }
      });
  }

  x0(t: boolean): void {
    if (t) GameMgr.instance().player.weaponSceneDragGuideDone = true;
    this.bJ = false;
    this.IJ = -1;
    this.BJ = 0;
    this.m0();
  }

  m0(): void {
    Laya.timer.clear(this, this.k0);
    if (this.AJ && !this.AJ.destroyed) Laya.Tween.killAll(this.AJ);
    this.AJ = null;
    if (this.PJ && !this.PJ.destroyed) Laya.Tween.killAll(this.PJ);
    if (this.MJ && !this.MJ.destroyed) {
      this.MJ.removeSelf();
      this.MJ.destroy();
    }
    this.MJ = null;
    this.PJ = null;
  }

  b0(t: number): string {
    return GameMgr.instance().weaponData.rarityStrokeColors[t] ?? "#000000";
  }

  M0(t: number): string {
    const s = this.b0(t);
    if (!/^#[0-9a-fA-F]{6}$/.test(s)) return "#1f1f1f";
    const i = parseInt(s.slice(1, 3), 16);
    const h = parseInt(s.slice(3, 5), 16);
    const e = parseInt(s.slice(5, 7), 16);
    const a = 0.62;
    const n = Math.max(0, Math.min(255, Math.round(i * a)));
    const r = Math.max(0, Math.min(255, Math.round(h * a)));
    const o = Math.max(0, Math.min(255, Math.round(e * a)));
    return "#" + n.toString(16).padStart(2, "0") + r.toString(16).padStart(2, "0") + o.toString(16).padStart(2, "0");
  }

  yW(t: number): number {
    return t <= 2 ? 1 : t === 3 ? 2 : t === 4 ? 3 : 4;
  }

  fW(t: any, s: boolean): { skin: string; width: number; height: number } {
    const h = this.yW(t.length);
    return {
      skin: `resources/img/weaponBag/${s ? "weaponBg1" : "weaponBg2"}_${h}.png`,
      width: WeaponScene.gW[h - 1] ?? 169,
      height: WeaponScene.dW,
    };
  }

  i0(t: any[]): any[] {
    const s = WeaponScene.P0;
    const i = WeaponScene.A0;
    const h = this.oJ;
    const e = WeaponScene.h0;
    const a = WeaponScene.E0;
    const n = WeaponScene.B0;
    const r = Math.max(1, h - a - n);
    const o = WeaponScene.e0;
    const l: any[] = [];
    let c = 0;
    let u = a;
    let p = 0;
    let y = 0;
    let ff = 0;
    for (let k = 0; k < t.length; k++) {
      const node = t[k];
      const g = node.type === "group";
      const d = g ? node.Ai[0].name : node.Hn.name;
      const L = this.fW(d, g);
      const m = L.width;
      const w = L.height;
      for (; (u > a && u + m > a + r && ((p += y + i), (u = a), (y = 0)), p + w > o && p > 0); ) {
        c++;
        p = 0;
        u = a;
        y = 0;
      }
      const v = c * e + u + m / 2;
      const kk = p + w / 2;
      l.push(new Laya.Point(v, kk));
      ff = Math.max(ff, p + w);
      u += m + s;
      y = Math.max(y, w);
    }
    this.uJ = Math.max(1, c + 1);
    this.pJ = ff;
    return l;
  }

  I0(t: string, s: number, i: number, h: number): void {
    if (t !== "weaponPanel" || !this.yJ) {
      if (t === "weaponPanel" && s >= 0) {
        const node = this.sJ[s];
        if (!node) return;
        return void (node.type === "group" ? this.D0(node.Ai[0]) : this.D0(node.Hn));
      }
      if (t === "generalPanel" && i >= 0 && h >= 0) {
        const node = WeaponFragmentMgr.instance().Yb(h);
        if (!node) return;
        this.D0(node);
      }
    }
  }

  D0(t: any): void {
    if (!t) return;
    const s = t.weaponId;
    SceneMgr.instance().openDialog("WeaponIntroDialog", false, {
      weaponId: s,
      isComplete: t.isComplete,
      fragmentNum: t.fragmentNum,
      mb: t.mb,
    });
  }

  T0(): void {
    if (this.JK < 0) return;
    const t = WeaponFragmentMgr.instance();
    const s = GameMgr.instance().generals.generalNames.length;
    for (let i = 0; i < this.dJ.length && i < s; i++) {
      const node = this.dJ[i];
      if (!node) continue;
      const h = t.jb(this.JK, i, 0);
      node.skin = h ? "resources/img/weaponBag/generalBg2.png" : "resources/img/weaponBag/generalBg3.png";
      const e = node.parent.getChildByName("light");
      if (h) {
        if (!e.visible) {
          e.visible = true;
          e.alpha = 1;
          this.R0(e);
        }
      } else if (e.visible) {
        this.C0(e);
        e.visible = false;
        e.alpha = 1;
      }
    }
  }

  R0(t: any): void {
    if (!t || t.destroyed || this.vJ.has(t)) return;
    this.vJ.add(t);
    this.U0(t, false);
  }

  U0(t: any, s: boolean): void {
    if (!this.vJ.has(t) || t.destroyed) return;
    const i = s ? 1 : 0.32;
    Laya.Tween.create(t)
      .to("alpha", i)
      .duration(420)
      .ease(Laya.Ease.sineInOut)
      .then(() => {
        this.U0(t, !s);
      });
  }

  C0(t: any): void {
    if (t) {
      this.vJ.delete(t);
      Laya.Tween.killAll(t);
    }
  }

  F0(): void {
    for (let s = 0; s < this.dJ.length; s++) {
      const i = this.dJ[s];
      if (!i) continue;
      i.skin = "resources/img/weaponBag/generalBg2.png";
      const h = i.parent?.getChildByName("light");
      if (h) {
        this.C0(h);
        h.visible = false;
        h.alpha = 1;
      }
    }
    this.vJ.clear();
  }

  O0(t: number, s: number): void {
    if (!this.UJ) {
      this.UJ = true;
      if (this.KK === "weaponPanel")
        if (this.hJ) {
          this.Y0(this.OJ, t, s, this.YJ);
          const e = this.eJ?.getChildByName("countBg")?.getChildByName("countTxt");
          if (e) {
            e.text = String(this.aJ - 1);
            e.color = "#000000";
          }
        } else {
          if (!this.FJ || this.CJ < 0) return;
          this.X0(this.FJ, this.CJ, t, s);
        }
      else if (this.KK === "generalPanel") this.Y0(this.OJ, t, s, this.YJ);
      if (this.JK >= 0 && this.dJ.length > 0) this.T0();
    }
  }

  o0(t: number): void {
    this.G0(t);
  }

  GJ(t: number): void {
    const s = Math.max(1, this.uJ);
    let i = this.rJ + t;
    i = Math.max(0, Math.min(i, s - 1));
    if (i === this.rJ) return;
    this.rJ = i;
    if (!this.nJ) return;
    const h = (this.weaponPanel.width - this.oJ) / 2 - this.rJ * WeaponScene.h0;
    const e = ++this.fJ;
    this.yJ = true;
    this.nJ.mouseEnabled = false;
    Laya.Tween.killAll(this.nJ);
    Laya.Tween.create(this.nJ)
      .to("x", h)
      .duration(WeaponScene.H0)
      .ease(Laya.Ease.cubicOut)
      .then(() => {
        this.W0(e);
      });
    this.G0(s);
  }

  W0(t: number): void {
    if (t === this.fJ) {
      this.yJ = false;
      if (this.nJ && !this.nJ.destroyed) this.nJ.mouseEnabled = true;
    }
  }

  G0(t: number): void {
    const s = "resources/img/weaponBag/switch0.png";
    const i = "resources/img/weaponBag/switch1.png";
    const h = t > 1 && this.rJ > 0;
    const e = t > 1 && this.rJ < t - 1;
    this.switchBtn1.skin = h ? i : s;
    this.switchBtn2.skin = e ? i : s;
    if (this.pageTxt && !this.pageTxt.destroyed) this.pageTxt.text = `${this.rJ + 1}/${Math.max(1, t)}`;
  }

  jJ(): void {
    const t = GameMgr.instance().generals.generalNames;
    const s = (this.generalPanel.width - 24) / 4;
    this.generalPanel.removeChildren();
    this.dJ.length = 0;
    this.LJ.length = 0;
    this.mJ.length = 0;
    this.wJ.length = 0;
    this.vJ.clear();
    this.kJ = -1;
    this._J = -1;
    this.z0();
    t.forEach((name: string, i: number) => {
      const h = i % 4;
      const e = Math.floor(i / 4);
      const a = this.j0(name, i, s, 90);
      a.anchorX = a.anchorY = 0.5;
      a.x = h * (s + 8) + s / 2;
      a.y = 98 * e + 45;
      this.generalPanel.addChild(a);
      const n = a.getChildByName("bg");
      if (n) {
        n.skin = "resources/img/weaponBag/generalBg2.png";
        this.dJ.push(n);
      }
      this.LJ.push(a);
      const r = a.getChildByName("weaponTxt");
      this.mJ.push(r);
      this.wJ.push(r ? r.x : 0);
    });
  }

  $0(t: number, s: number): void {
    if (!this.UJ || this.JK < 0) return void this.N0(true);
    if (this.KK !== "weaponPanel" && this.KK !== "generalPanel") return void this.N0(true);
    if (!this.generalPanel.hitTestPoint(t, s)) return void this.N0(true);
    const h = this.q0(t, s);
    if (h < 0) return void this.N0(true);
    if (this.KK === "generalPanel" && h === this.tJ) return void this.N0(true);
    if (!WeaponFragmentMgr.instance().jb(this.JK, h, 0)) return void this.N0(true);
    const e = GameMgr.instance().player.equip[h];
    if (e < 0) return void this.N0(true);
    const a = this.LJ[h];
    if (!a) return void this.N0(true);
    if (!(this.kJ !== h || this._J !== e)) return;
    this.N0(false);
    const n = this.mJ[h];
    if (!n) return;
    const r = this.wJ[h] ?? n.x;
    const o = 0.5 * a.width;
    Laya.Tween.killAll(n);
    Laya.Tween.create(n).to("x", r - o).duration(140).ease(Laya.Ease.quadOut);
    this.V0(a, e);
    this.kJ = h;
    this._J = e;
  }

  Q0(t: number): number {
    if (t < 0) return 0;
    const i = GameMgr.instance().weaponData.getWeapon(t);
    return i?.addAttPower ?? 0;
  }

  Z0(t: number, s: number, i: number): void {
    if (s === i) return;
    const h = this.LJ[t];
    if (!h || h.destroyed) return;
    const e = PrefabFactory.instance().getItem("attChangeTip", this);
    Laya.Tween.killAll(e);
    const a = e.getChildByName("oldNum");
    const n = e.getChildByName("newNum");
    const r = e.getChildByName("arrow");
    if (!a || !n || !r) return void PrefabFactory.instance().recover("attChangeTip", e);
    a.text = String(s);
    n.text = String(i);
    const o = i > s;
    r.skin = o ? WeaponScene.K0 : WeaponScene.J0;
    r.rotation = o ? WeaponScene.t1 : WeaponScene.s1;
    a.color = "#000000";
    n.color = "#000000";
    const l = h.getChildByName("name");
    let c = 0;
    let u = 0;
    if (l) {
      const t2 = l.localToGlobal(new Laya.Point(l.width / 2, l.height / 2));
      c = t2.x;
      u = t2.y;
    } else {
      const t2 = h.localToGlobal(new Laya.Point(h.width / 2, 0.35 * h.height));
      c = t2.x;
      u = t2.y;
    }
    e.pivot(e.width / 2, e.height / 2);
    e.alpha = 1;
    e.scale(0.32, 0.32);
    e.zIndex = 50000;
    e.removeSelf();
    Laya.stage.addChild(e);
    e.pos(c, u);
    this.SJ.push(e);
    Laya.Tween.create(e)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(WeaponScene.i1)
      .ease(Laya.Ease.backOut)
      .then(() => {
        if (e && !e.destroyed)
          Laya.Tween.create(e)
            .to("y", e.y - WeaponScene.h1)
            .duration(WeaponScene.e1)
            .ease(Laya.Ease.quadInOut)
            .then(() => {
              if (e && !e.destroyed)
                Laya.timer.once(WeaponScene.a1, this, () => {
                  if (e && !e.destroyed)
                    Laya.Tween.create(e)
                      .to("alpha", 0)
                      .duration(WeaponScene.n1)
                      .ease(Laya.Ease.quadOut)
                      .then(() => {
                        if (e && !e.destroyed) this.o1(e);
                      });
                });
            });
      });
  }

  l1(): any {
    if (this.xJ && !this.xJ.destroyed) return this.xJ;
    const t = new Laya.Text();
    t.text = "替换";
    t.align = "center";
    t.valign = "middle";
    t.anchorX = t.anchorY = 0.5;
    t.visible = false;
    Laya.stage.addChild(t);
    this.xJ = t;
    return t;
  }

  V0(t: any, s: number): void {
    const i = t.getChildByName("name");
    if (!i) return;
    const h = WeaponFragmentMgr.instance().Yb(this.JK);
    if (!h) return;
    const e = this.Q0(h.weaponId);
    const a = this.Q0(s);
    const n = this.l1();
    n.fontSize = i.fontSize;
    n.bold = i.bold;
    n.leading = i.leading;
    n.width = i.width;
    n.height = i.height;
    if (i.font) n.font = i.font;
    n.color = e > a ? "#f49d40" : "#c9d67c";
    n.stroke = i.stroke > 0 ? i.stroke : 3;
    n.strokeColor = i.strokeColor;
    n.visible = true;
    n.alpha = 1;
    const r = i.localToGlobal(new Laya.Point(i.width / 2, i.height / 2));
    Laya.Tween.killAll(n);
    n.pos(r.x, r.y);
    Laya.Tween.create(n).to("y", r.y - WeaponScene.u1).duration(140).ease(Laya.Ease.quadOut);
  }

  z0(): void {
    if (this.xJ && !this.xJ.destroyed) {
      Laya.Tween.killAll(this.xJ);
      this.xJ.visible = false;
    }
  }

  N0(t: boolean): void {
    this.z0();
    if (this.kJ < 0) return;
    const s = this.kJ;
    const i = this.mJ[s];
    const h = this.wJ[s];
    if (i && !i.destroyed) {
      Laya.Tween.killAll(i);
      if (t) Laya.Tween.create(i).to("x", h).duration(140).ease(Laya.Ease.quadOut);
      else i.x = h;
    }
    this.kJ = -1;
    this._J = -1;
  }

  f1(): any {
    if (this.kJ < 0 || this._J < 0) return null;
    const t = this.mJ[this.kJ];
    let s;
    if (t && !t.destroyed) s = t.localToGlobal(new Laya.Point(t.width / 2, t.height / 2));
    else {
      const node = this.LJ[this.kJ];
      if (!node) return null;
      s = node.localToGlobal(new Laya.Point(node.width / 2, node.height / 2));
    }
    return { g1: this.kJ, weaponId: this._J, d1: s.x, L1: s.y };
  }

  m1(t: number, s: number, i: number): void {
    const h = this.sJ.findIndex((x: any) => x.type === "group" && x.weaponId === t);
    if (h < 0) return;
    const e = this.iJ[h];
    if (!e || e.destroyed || !e.parent) return;
    const a = GameMgr.instance().weaponData.getWeapon(t);
    if (!a) return;
    const n = this.w1(a.txt, a.rarity, s, i);
    const r = e.parent.localToGlobal(new Laya.Point(e.x, e.y));
    Laya.Tween.create(n)
      .to("x", r.x)
      .to("y", r.y)
      .to("alpha", 0.8)
      .to("scaleX", 0.9)
      .to("scaleY", 0.9)
      .duration(260)
      .ease(Laya.Ease.cubicInOut)
      .then(() => {
        if (n && !n.destroyed) {
          n.removeSelf();
          n.destroy();
        }
      });
  }

  w1(t: string, s: number, i: number, h: number): any {
    const e = PrefabPool.instance().so("weaponSceneWeaponItem").create();
    const a = this.fW(t, true);
    e.size(a.width, a.height);
    const n = e.getChildByName("bg");
    const r = e.getChildByName("name");
    const o = e.getChildByName("stateTxt");
    const l = e.getChildByName("countBg");
    n.skin = a.skin;
    n.size(a.width, a.height);
    r.anchorX = r.anchorY = 0.5;
    r.x = a.width / 2;
    r.y = a.height / 2;
    r.width = a.width;
    r.height = a.height;
    r.text = t;
    r.color = this.b0(s);
    o.visible = false;
    if (l) l.visible = false;
    e.pos(i, h);
    e.alpha = 0.92;
    Laya.stage.addChild(e);
    return e;
  }

  a0(t: any, _s: number, _i: number): any {
    const h = PrefabPool.instance().so("weaponSceneWeaponItem").create();
    const e = t.type === "group";
    const a = e ? t.Ai[0] : t.Hn;
    const n = this.fW(a.name, e);
    const r = n.width;
    const o = n.height;
    h.size(r, o);
    const l = h.getChildByName("bg");
    l.skin = n.skin;
    l.size(r, o);
    const c = h.getChildByName("name");
    c.anchorX = c.anchorY = 0.5;
    c.x = r / 2;
    c.y = o / 2;
    c.width = r;
    c.height = o;
    const u = h.getChildByName("stateTxt");
    const p = h.getChildByName("countBg");
    const y = p.getChildByName("countTxt");
    const ff = h.getChildByName("newTxt");
    if (ff) ff.x = Math.max(0, r / 2 - 25);
    if (t.type === "group") {
      const s = t.Ai[0];
      const i = this.b0(s.rarity);
      c.text = s.name;
      c.color = i;
      c.y = o / 2;
      u.visible = false;
      p.visible = true;
      p.x = Math.max(0, r - 26);
      y.text = String(t.Ai.length);
      y.color = "#000000";
      y.visible = true;
    } else {
      const s = t.Hn;
      c.text = s.name;
      c.color = this.M0(s.rarity);
      c.y = o / 2 - 8;
      u.visible = true;
      u.text = s.fragmentNum + "/" + s.mb;
      const i = Math.max(36, r - 16);
      u.width = i;
      u.x = (r - i) / 2;
      u.y = Math.min(31, o - 18);
      p.visible = false;
    }
    return h;
  }

  j0(t: string, s: number, i: number, h: number): any {
    const e = PrefabPool.instance().so("weaponSceneGeneralItem").create();
    e.size(i, h);
    e.mouseEnabled = true;
    e.getChildByName("bg").size(i, h);
    const a = e.getChildByName("light");
    a.visible = false;
    a.alpha = 1;
    e.getChildByName("name").text = t;
    const n = GameMgr.instance().player.equip[s];
    const r = e.getChildByName("weaponTxt");
    if (n >= 0) {
      const w = GameMgr.instance().weaponData.getWeapon(n);
      r.text = w.txt;
      r.color = this.b0(w.rarity);
    } else {
      r.text = "";
      r.color = "#000000";
    }
    return e;
  }

  NJ(t: any): void {
    const s = t.stageX;
    const i = t.stageY;
    this.v1();
    this.DJ = s;
    this.TJ = i;
    this.RJ = false;
    this.UJ = false;
    this.CJ = -1;
    this.FJ = null;
    this.OJ = "";
    this.YJ = 0;
    if (this.weaponPanel.hitTestPoint(s, i)) {
      if (this.yJ) return;
      const h = this._1(s, i);
      if (h < 0) return;
      const e = this.sJ[h];
      if (!e) return;
      if (e.type === "fragment") {
        this.D0(e.Hn);
        return void t.stopPropagation();
      }
      const a = this.iJ[h];
      if (!a) return;
      this.dragging = true;
      this.KK = "weaponPanel";
      this.tJ = -1;
      this.CJ = h;
      if (e.Ai.length > 1) {
        this.JK = e.Ai[0].id;
        this.hJ = true;
        this.eJ = a;
        this.aJ = e.Ai.length;
        this.OJ = e.Ai[0].name;
        this.YJ = e.Ai[0].rarity;
      } else {
        this.JK = e.Ai[0].id;
        this.FJ = a;
      }
      return void t.stopPropagation();
    }
    if (this.generalPanel.hitTestPoint(s, i)) {
      const h = this.q0(s, i);
      if (h < 0) return;
      const e = GameMgr.instance().player.equip[h];
      if (e < 0) return;
      const a = WeaponFragmentMgr
        .instance()
        .Ub(e)
        .find((x: any) => x.Sb && x._b === h);
      if (!a) return;
      this.dragging = true;
      this.KK = "generalPanel";
      this.tJ = h;
      this.JK = a.id;
      this.OJ = a.name;
      this.YJ = a.rarity;
      return void t.stopPropagation();
    }
  }

  qJ(t: any): void {
    if (this.dragging) {
      if (!this.RJ) {
        const s = t.stageX - this.DJ;
        const i = t.stageY - this.TJ;
        if (s * s + i * i >= WeaponScene.S1) {
          this.RJ = true;
          if (!this.UJ) this.O0(t.stageX, t.stageY);
        }
      }
      if (this.qK) this.qK.pos(t.stageX, t.stageY);
      else if (this.bX) this.bX.pos(t.stageX, t.stageY);
      if (this.UJ && this.JK >= 0 && this.dJ.length > 0) {
        this.T0();
        this.$0(t.stageX, t.stageY);
      }
      t.stopPropagation();
    }
  }

  VJ(t: any): void {
    if (!this.dragging) return void this.v1();
    t.stopPropagation();
    const s = t.stageX;
    const i = t.stageY;
    const h = s - this.DJ;
    const e = i - this.TJ;
    const a = h * h + e * e >= WeaponScene.S1;
    const n = this.RJ || a;
    let r = "none";
    let o = -1;
    if (this.weaponPanel.hitTestPoint(s, i) && !this.yJ) {
      r = "weaponPanel";
      o = this._1(s, i);
    } else if (this.generalPanel.hitTestPoint(s, i)) {
      r = "generalPanel";
      o = this.q0(s, i);
    }
    const l = this.KK;
    const c = this.CJ;
    const u = this.tJ;
    const p = this.JK;
    if (n) {
      if (!this.UJ) this.O0(s, i);
      this.b1(r, o);
    } else this.I0(l, c, u, p);
    this.v1();
  }

  _1(t: number, s: number): number {
    if (!this.nJ) return -1;
    const i = new Laya.Point(t, s);
    this.nJ.globalToLocal(i);
    const h = i.x;
    const e = i.y;
    for (let k = this.iJ.length - 1; k >= 0; k--) {
      if (k >= this.sJ.length) continue;
      const node = this.iJ[k];
      if (!node || node.destroyed || node.parent !== this.nJ) continue;
      const iw = (node.width * node.scaleX) / 2;
      const ih = (node.height * node.scaleY) / 2;
      if (h >= node.x - iw && h < node.x + iw && e >= node.y - ih && e < node.y + ih) return k;
    }
    return -1;
  }

  q0(t: number, s: number): number {
    const i = (this.generalPanel.width - 24) / 4;
    const h = GameMgr.instance().generals.generalNames.length;
    const e = new Laya.Point(t, s);
    this.generalPanel.globalToLocal(e);
    const a = Math.floor(e.x / (i + 8));
    const n = Math.floor(e.y / 98);
    if (a < 0 || a >= 4 || n < 0) return -1;
    const r = a * (i + 8);
    const o = 98 * n;
    if (e.x < r || e.x >= r + i || e.y < o || e.y >= o + 90) return -1;
    const l = 4 * n + a;
    return l < h ? l : -1;
  }

  b1(t: string, s: number): void {
    const i = this.KK;
    const h = this.tJ;
    const e = this.JK;
    const a = WeaponFragmentMgr.instance();
    const n = this.p0();
    const r = this.f1();
    if (i === "none" || e < 0) return;
    let o = false;
    const l: any[] = [];
    const c = GameMgr.instance().player.equip;
    if (i === "weaponPanel" && t === "generalPanel" && s >= 0)
      if (a.jb(e, s, 0)) {
        const tt2 = a.Yb(e);
        const isGuide = this.bJ && tt2 != null && tt2.type === 1 && s === WeaponScene.S0;
        const h2 = this.Q0(c[s]);
        const n2 = tt2 ? this.Q0(tt2.weaponId) : h2;
        a.Vb(e, s);
        o = true;
        l.push({ g1: s, M1: h2, P1: n2 });
        if (isGuide) this.x0(true);
      } else TipMgr.instance().showTip("该武将无法装备此武器", 1500);
    else if (i === "generalPanel" && t === "generalPanel" && s >= 0) {
      if (s === h) {
        // same slot — no-op
      } else if (a.jb(e, s, 0)) {
        const t2 = c[h];
        const i2 = c[s];
        const a2 = this.Q0(t2);
        const n2 = this.Q0(i2);
        const r2 = i2 >= 0 ? this.Q0(i2) : 0;
        const u2 = a2;
        if (this.A1(h, s, e)) {
          o = true;
          l.push({ g1: h, M1: a2, P1: r2 });
          l.push({ g1: s, M1: n2, P1: u2 });
        }
      } else TipMgr.instance().showTip("该武将无法装备此武器", 1500);
    } else if (i === "generalPanel" && t === "weaponPanel") {
      const t2 = this.Q0(c[h]);
      a.Qb(h, e);
      o = true;
      l.push({ g1: h, M1: t2, P1: 0 });
    }
    if (i !== "weaponPanel" || o) {
      if (o) {
        if (this.qK && !this.qK.destroyed) {
          this.qK.removeSelf();
          this.qK.destroy();
        }
        this.qK = null;
        this.zJ(this.gJ, true, n);
        this.jJ();
        for (let k = 0; k < l.length; k++) {
          const x = l[k];
          this.Z0(x.g1, x.M1, x.P1);
        }
        if (i === "weaponPanel" && t === "generalPanel" && s >= 0 && r && r.g1 === s) this.m1(r.weaponId, r.d1, r.L1);
      }
    } else if (this.hJ && this.eJ && !this.eJ.destroyed) {
      const t2 = this.eJ.getChildByName("countTxt");
      if (t2) {
        t2.text = String(this.aJ);
        t2.color = "#000000";
      }
    } else this.E1();
  }

  A1(t: number, s: number, i: number): boolean {
    const h = WeaponFragmentMgr.instance();
    const e = GameMgr.instance().player.equip[s];
    let a = -1;
    if (e >= 0) {
      const x = h.Ub(e).find((y: any) => y.Sb && y._b === s);
      if (x) a = x.id;
    }
    return a >= 0 ? !!h.jb(a, t, 0) && (h.Vb(a, t), h.Vb(i, s), true) : (h.Vb(i, s), true);
  }

  X0(t: any, s: number, _i: number, _h: number): void {
    this.qK = t;
    this.VK = t.parent;
    this.QK = s;
    this.ZK.setTo(t.x, t.y);
    Laya.Point.TEMP.x = t.x;
    Laya.Point.TEMP.y = t.y;
    t.parent.localToGlobal(Laya.Point.TEMP);
    t.removeSelf();
    this.addChild(t);
    t.parent.globalToLocal(Laya.Point.TEMP);
    t.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
  }

  Y0(t: string, s: number, i: number, h: number): void {
    const e = PrefabPool.instance().so("weaponSceneWeaponItem").create();
    const a = this.fW(t, true);
    const n = a.width;
    const r = a.height;
    e.size(n, r);
    const o = e.getChildByName("bg");
    const l = e.getChildByName("name");
    const c = e.getChildByName("stateTxt");
    const u = e.getChildByName("countBg");
    o.skin = a.skin;
    o.size(n, r);
    l.anchorX = l.anchorY = 0.5;
    l.x = n / 2;
    l.y = r / 2;
    l.width = n;
    l.height = r;
    l.text = t;
    if (h != null) l.color = this.b0(h);
    c.visible = false;
    if (u) u.visible = false;
    e.pos(s, i);
    e.alpha = 0.9;
    Laya.stage.addChild(e);
    this.bX = e;
  }

  E1(): void {
    if (!this.qK || !this.VK) return void this.v1();
    const t = this.qK;
    const s = this.VK;
    const i = this.QK;
    const h = this.ZK;
    const e = t.localToGlobal(new Laya.Point(0, 0));
    if (i >= 0 && i <= s.numChildren) s.addChildAt(t, i);
    else s.addChild(t);
    const a = s.globalToLocal(e);
    t.pos(a.x, a.y);
    Laya.Tween.killAll(t);
    Laya.Tween.create(t).to("x", h.x).to("y", h.y).duration(200);
    this.v1();
  }

  XJ(): void {
    SceneMgr.instance().openDialog("RecycleWeaponDialog", false, {
      sz: () => {
        const t = this.p0();
        this.zJ(this.gJ, true, t);
        this.jJ();
      },
    });
  }

  v1(): void {
    this.N0(true);
    if (this.bX && !this.bX.destroyed) {
      this.bX.removeSelf();
      this.bX.destroy();
    }
    this.bX = null;
    this.qK = null;
    this.VK = null;
    this.QK = -1;
    this.dragging = false;
    this.KK = "none";
    this.JK = -1;
    this.tJ = -1;
    this.hJ = false;
    this.eJ = null;
    this.aJ = 0;
    this.UJ = false;
    this.FJ = null;
    this.OJ = "";
    this.YJ = 0;
    this.F0();
  }

  o1(t: any): void {
    if (!t) return;
    const s = this.SJ.indexOf(t);
    if (s < 0) return;
    this.SJ.splice(s, 1);
    Laya.Tween.killAll(t);
    t.removeSelf();
    t.scale(1, 1);
    t.alpha = 1;
    PrefabFactory.instance().recover("attChangeTip", t);
  }

  B1(): void {
    const t = this.SJ.slice();
    for (const s of t) this.o1(s);
    this.SJ.length = 0;
  }

  Bu(): void {
    this.x0(false);
    this.v1();
    this.B1();
    if (this.xJ && !this.xJ.destroyed) {
      this.xJ.removeSelf();
      this.xJ.destroy();
      this.xJ = null;
    }
    this.fJ++;
    this.yJ = false;
    if (this.nJ && !this.nJ.destroyed) {
      Laya.Tween.killAll(this.nJ);
      this.nJ.mouseEnabled = true;
    }
    this.HJ.stop();
    Laya.timer.clearAll(this);
    this.mihuan.off(Laya.Event.STOPPED, this, this.ZJ);
    this.off(Laya.Event.MOUSE_DOWN, this, this.NJ);
    this.off(Laya.Event.MOUSE_MOVE, this, this.qJ);
    this.off(Laya.Event.MOUSE_UP, this, this.VJ);
    SceneMgr.instance().closeScene("WeaponScene");
  }
}
