// ShopScene — the between-battle props shop + lottery wheel (the bundle's `bo`,
// @regClass NsqY3ju_Tc-HfHc8t5EVgA).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~36420-37337. Left: three rolled shop items bought with gold or an ad (`sK`/
// `uK`/`dK`); right: an 8-cell lottery wheel spun by ad/share (`lK`/`xK` state
// machine) with glow borders (`xo`); owned active/passive props with delete
// buttons; a chatty shopkeeper. Acquiring a prop flies it into its slot (`_K`).
// Opaque field / method names kept verbatim; node refs bound from ShopScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { GameMgr } from "../core/game-mgr";
import { PrefabPool } from "../battle/prefab-pool";
import { PrefabFactory } from "../battle/prefab-factory";
import { EffectMgr } from "../battle/effect-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { TipMgr } from "../core/tip-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { SceneMgr } from "../core/scene-mgr";
import { GlowBorderEffect } from "../battle/glow-border-effect";
import { SparkleConfig } from "./main-scene";
import { yt, ft } from "../battle/analytics-mgr";

const F = GameMgr;
const H = PrefabPool;
const z = PrefabFactory;
const q = EffectMgr;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const Zi = BattlePropsMgr;
const Mt = PlatformMgr;
const tt = TipMgr;
const $ = AudioMgr;
const f = MathE;
const K = SceneMgr;
const xo = GlowBorderEffect;
const so = SparkleConfig;

@regClass("NsqY3ju_Tc-HfHc8t5EVgA")
export class ShopScene extends Laya.Scene {
  // .ls-bound nodes
  box!: any;
  bg!: any;
  shopBox!: any;
  xBtn!: any;
  shopLabel!: any;
  lotteryLabel!: any;
  lotteryLabelRect!: any;
  lotteryLabelLight!: any;
  luckyBtn!: any;
  luckyBtnShare!: any;
  luckyBtnAd!: any;
  activePropsBox!: any;
  passivePropsBox!: any;
  luckyBox!: any;
  list!: any;
  goldTxt!: any;
  staminaTxt!: any;
  staminaImg!: any;
  shopMan!: any;
  shopBg!: any;
  lotteryBox!: any;
  redPoint!: any;

  itemNum = 3;
  private _Z = 0;
  private xZ: any[] = [];
  private SZ: any[] = [];
  private bZ = ["#95e45a", "#2dddff", "#D955FF", "#E99431"];
  private MZ: any[] = [];
  private PZ: any[] = [];
  private AZ = 8;
  private EZ: any[] = [];
  private BZ: any[] = [];
  private IZ = false;
  private DZ: any = null;
  private TZ = true;
  private RZ = 0;
  private CZ = ["童叟无欺", "诚信为本", "走过路过别错过"];
  private UZ = 0;
  private FZ = 0;
  private OZ = 0;
  private YZ = 0;
  private XZ = 0;
  private GZ: any = null;
  private HZ = 0;
  private WZ = 0;
  private zZ = 0;
  private jZ = 5;
  private Ue: any;
  private $Z: any;
  private JZ: any;
  private WK: any;

  static NK = 50;
  static TK = 50;
  static FK = 10;

  onAwake(): void {
    this.Ue = F.instance().props;
    this.$Z = H.instance().so("shopItem");
    this.initItems();
    this.NZ();
    this.qZ();
    this.VZ();
    this.QZ();
    this.ZZ();
    this._Z = this.shopBox.y;
    y.instance.on(u.Kt, this, this.KZ);
    y.instance.on(u.Vt, this, this.aW);
  }

  onOpened(t: any): void {
    Laya.Tween.to(
      this.box,
      { scaleX: Laya.stage.height / 1386, scaleY: Laya.stage.height / 1386 },
      300,
      Laya.Ease.backOut,
    );
    Laya.Tween.to(this.bg, { alpha: 0.8 }, 100);
    this.JZ = t;
    this.tK();
    this.sK();
    this.KZ();
    this.iK();
    this.hK();
    y.instance.event(u.Qt);
    this.eK();
    j.instance().register("ShopScene", this, this.update);
    this.aK();
    this.nK();
    this.rK();
    this.aW();
    if (Math.random() < 0.5) {
      this.shopLabel.visible = false;
      this.lotteryLabel.visible = false;
      this.lotteryLabelRect.visible = false;
      this.shopBox.y = this._Z - this.shopLabel.height / 2;
    } else this.shopBox.y = this._Z;
  }

  qZ(): void {
    this.box.on(Laya.Event.CLICK, this, this.Qo, [null, null]);
    this.xBtn.on(Laya.Event.CLICK, this, this.Bu);
    this.shopLabel.on(Laya.Event.CLICK, this, () => this.oK("shop"));
    this.lotteryLabel.on(Laya.Event.CLICK, this, () => this.oK("lottery"));
    this.luckyBtn.on(Laya.Event.CLICK, this, this.lK);
    const t = [this.xBtn, this.shopLabel, this.lotteryLabel, this.luckyBtn];
    for (let s = 0; s < this.activePropsBox.numChildren; s++) {
      const i = this.activePropsBox.getChildAt(s);
      i.on(Laya.Event.CLICK, this, (e: any) => {
        this.Qo(Zi.instance().xx[s], false, i, e);
      });
      t.push(i.getChildByName("deleteBtn"));
      t.push(i);
    }
    for (let s = 0; s < this.passivePropsBox.numChildren; s++) {
      const i = this.passivePropsBox.getChildAt(s);
      i.on(Laya.Event.CLICK, this, (e: any) => {
        this.Qo(Zi.instance().Sx[s], false, i, e);
      });
      t.push(i.getChildByName("deleteBtn"));
      t.push(i);
    }
    for (let s = 0; s < this.luckyBox.numChildren; s++) t.push(this.luckyBox.getChildAt(s));
    q.instance().bindButtons(t);
  }

  QZ(): void {
    this.bg.alpha = 0;
    this.box.scale(0, 0);
  }

  tK(): void {
    this.goldTxt.text = F.instance().player.gold.toString();
  }

  initItems(): void {
    for (let t = 0; t < this.itemNum; t++) {
      const s = this.$Z.create();
      this.xZ.push(s);
      s.x = (this.list.width - s.width) / 2;
      s.y = (s.height + 10) * t;
      this.list.addChild(s);
    }
  }

  sK(): void {
    for (let t = 1; t <= this.itemNum; t++)
      this.xZ[t - 1].visible = !(t > this.JZ.length);
    const t: any[] = [];
    const s = Math.min(this.JZ.length, this.itemNum);
    for (let i = 0; i < s; i++) {
      let pick;
      do {
        pick = this.JZ[f.range(0, this.JZ.length, true)];
      } while (this.cK(pick, t));
      t.push(pick);
      this.uK(this.xZ[i], pick);
    }
    this.pK();
  }

  pK(): void {
    const t = this.list.width / 2;
    const s = this.list.height / 2;
    for (let i = 0; i < this.xZ.length; i++) {
      const h = this.xZ[i];
      if (!h.visible) continue;
      Laya.Tween.killAll(h);
      const e = (this.list.width - h.width) / 2;
      const a = (h.height + 10) * i;
      h.x = t - h.width / 2;
      h.y = s - h.height / 2;
      h.scale(0, 0);
      h.alpha = 0;
      Laya.timer.once(100 * i, this, () => {
        Laya.Tween.create(h)
          .to("x", e)
          .to("y", a)
          .to("scaleX", 1)
          .to("scaleY", 1)
          .to("alpha", 1)
          .duration(400)
          .ease(Laya.Ease.backOut);
      });
    }
  }

  uK(t: any, s: number): void {
    const i = t.getChildByName("itemBg");
    const h = t.getChildByName("name");
    const e = i.getChildByName("rarity");
    const a = t.getChildByName("introduce");
    const n = t.getChildByName("btn");
    const r = i.getChildByName("itemImg");
    const o = n.getChildByName("goldBox");
    const l = o.getChildByName("price");
    const c = n.getChildByName("adBox");
    const u2 = this.Ue.Ue[s];
    const p = this.Vv(s, true);
    const y2 = Zi.instance().Nx(s);
    const ff = this.Ue.ea(s) ? y2 + 1 : 1;
    const g = this.Ue.ra(s, ff);
    const d = Math.random() < this.Ue.ha[p];
    const L = Zi.instance().Yx(s);
    i.skin = "resources/img/shop/itemBg" + (L ? "0" : "1") + "_" + p + ".png";
    h.text = u2.txt;
    e.text = this.Ue.sa[p];
    e.color = this.bZ[p];
    const m = this.qv(s, true);
    a.text = (L ? "主动:" : "被动:") + m;
    r.skin = this.yK(s);
    if (d) {
      c.visible = true;
      o.visible = false;
      n.skin = "resources/img/shop/btn2.png";
      this.fK(n);
    } else {
      c.visible = false;
      o.visible = true;
      l.text = g.toString();
      n.skin = g > F.instance().player.gold ? "resources/img/shop/btn3.png" : "resources/img/shop/btn1.png";
    }
    n.offAll();
    this.gK(true);
    n.on(Laya.Event.CLICK, this, () => this.dK(s, h, d, g, r));
    q.instance().bindButtons([n]);
  }

  dK(t: number, s: any, i: boolean, h: number, e: any): void {
    if (this.IZ) tt.instance().showTip("已售完");
    else if (this.LK(t)) {
      if (i)
        Mt.instance().uu(
          () => this.mK(t, s, e),
          () => tt.instance().showTip("观看完整广告才能获取奖励呦~"),
          yt,
        );
      else if (this.wK(h)) this.mK(t, s, e);
      else {
        tt.instance().showTip("金币不足");
        $.instance().playSound("popup_notification");
      }
    } else tt.instance().showTip("当前可装备道具已达上限,\n请在下方删除道具后再购买");
  }

  wK(t: number): boolean {
    if (F.instance().player.gold < t) return false;
    F.instance().player.gold -= t;
    this.tK();
    return true;
  }

  LK(t: number): boolean {
    if (t === 23) return true;
    if (this.Ue.ea(t) && Zi.instance().iS(true, t)) return true;
    const s = Zi.instance().Yx(t);
    const i = Zi.instance().xx.length;
    const h = Zi.instance().Sx.length;
    return !(s && i >= this.Ue.Ze) && !(!s && h >= this.Ue.Ke);
  }

  mK(t: number, s: any, i: any): void {
    this.vK();
    if (t === 23) {
      const btn = i.parent.parent.getChildByName("btn");
      return void this.kK(btn);
    }
    tt.instance().showTip("恭喜你，成功获得" + s.text);
    this.DZ = i;
    this._K(t);
  }

  gK(t: boolean): void {
    this.xZ.forEach((s) => {
      s.getChildByName("btn").mouseEnabled = t;
    });
  }

  cK(t: any, s: any[]): boolean {
    if (!s || s.length === 0) return false;
    for (let i = 0; i < s.length; i++) if (s[i] === t) return true;
    return false;
  }

  update(t: number): void {
    this.xK(t);
    this.SK(t);
  }

  fK(t: any): void {
    const s = q.instance().registerBtnSparkle(t, new so((q as any).nu));
    this.SZ.push(s);
  }

  bK(): void {
    for (let t = 0; t < this.SZ.length; t++) q.instance().removeEvent("btnSparkle", this.SZ[t]);
    this.SZ.length = 0;
  }

  eK(): void {
    this.UZ = q
      .instance()
      .registerImgLoop(this.shopMan, ["resources/img/shop/shopMan1.png", "resources/img/shop/shopMan2.png"], 200);
  }

  MK(): void {
    if (this.UZ !== 0) {
      q.instance().removeEvent("imgLoop", this.UZ);
      this.UZ = 0;
    }
  }

  rK(): void {
    this.RZ = f.range(2000, 4000);
  }

  PK(): void {
    this.RZ = 0;
  }

  SK(t: number): void {
    if (this.RZ <= 0) return;
    this.RZ -= t;
    if (this.RZ <= 0) {
      const txt = this.CZ[f.range(0, this.CZ.length, true)];
      const s = new Laya.Point(this.shopMan.width, this.shopMan.height / 4);
      this.shopMan.localToGlobal(s);
      q.instance().showTalkBox(s.x, s.y, txt, this.shopMan.parent, true, 1);
      this.RZ = f.range(4000, 6000);
    }
  }

  AK(t: number): void {
    switch (this.Vv(t, true)) {
      case 0:
        this.shopMan.skin = "resources/img/shop/shopMan3.png";
        break;
      case 1:
        this.shopMan.skin = "resources/img/shop/shopMan1.png";
        break;
      case 2:
        this.shopMan.skin = "resources/img/shop/shopMan4.png";
        break;
      case 3:
        this.shopMan.skin = "resources/img/shop/shopMan5.png";
    }
  }

  oK(t: string): void {
    if (t === "shop") {
      this.shopBox.visible = true;
      this.lotteryBox.visible = false;
      this.shopBg.skin = "resources/img/shop/shopBg1.png";
      this.EK();
    } else {
      this.shopBox.visible = false;
      this.lotteryBox.visible = true;
      this.redPoint.visible = false;
      this.shopBg.skin = "resources/img/shop/shopBg2.png";
      this.BK();
    }
  }

  NZ(): void {
    const t = [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2],
      [0, 2],
      [0, 1],
    ];
    for (let s = 0; s < t.length; s++) {
      const i = z.instance().getItem("lotteryItem", this);
      this.luckyBox.addChild(i);
      i.pos(
        i.width * t[s][0] + t[s][0] * ((this.luckyBox.width - 3 * i.width) / 2) + i.width / 2,
        i.height * t[s][1] + t[s][1] * ((this.luckyBox.height - 3 * i.height) / 2) + i.height / 2,
      );
      i.scale(1, 1);
    }
  }

  iK(): void {
    if (this.JZ.length < this.AZ) {
      this.shopLabel.visible = false;
      this.lotteryLabel.visible = false;
      this.lotteryLabelRect.visible = false;
      return;
    }
    this.IK();
    this.EK();
    let t: any;
    const s: number[] = [];
    this.JZ.forEach((x: number) => {
      const i = Zi.instance().Nx(x);
      const h = this.Ue.ea(x) ? i + 1 : 1;
      s.push(this.Ue.oa(x, h));
    });
    for (let i = 0; i < this.AZ; i++) {
      const h = f.weightedIndex(s);
      s[h] = 0;
      const e = this.JZ[h];
      this.EZ.push(e);
      const a = Zi.instance().Nx(e);
      const n = this.Ue.ea(e) ? a + 1 : 1;
      this.BZ.push(this.Ue.la(e, n));
      t = this.luckyBox.getChildAt(i);
      t.getChildByName("img").skin = this.yK(e);
      const r = this.Vv(e, true);
      t.skin = "resources/img/shop/lottery/rarityBg" + r + ".png";
      t.getChildByName("name").text = this.Ue.Ue[e].txt;
      t.offAll(Laya.Event.CLICK);
      t.on(Laya.Event.CLICK, this, this.Qo, [this.EZ[i], true, t]);
      this.DK(t);
    }
    if (Mt.instance().canShare() && Math.random() < 0.2) {
      this.luckyBtnShare.visible = true;
      this.luckyBtnAd.visible = false;
      this.TZ = false;
    } else {
      this.luckyBtnShare.visible = false;
      this.luckyBtnAd.visible = true;
      this.TZ = true;
    }
  }

  lK(): void {
    if (this.JZ.length === 0) return void tt.instance().showTip("所有道具都已获得！");
    if (this.IZ) return void tt.instance().showTip("活动已结束");
    const t = () => {
      this.FZ = 1;
      this.vK();
    };
    const s = () => {
      if (this.TZ) tt.instance().showTip("观看完整广告才可抽奖呦~");
      else tt.instance().showTip("分享才能抽奖呦~");
    };
    if (this.TZ) Mt.instance().uu(t, s, ft);
    else Mt.instance().share(t, s, ft);
  }

  xK(t: number): void {
    if (this.FZ === 1) {
      $.instance().playSound("lottery");
      this.XZ = f.weightedIndex(this.BZ);
      this.GZ = this.EZ[this.XZ];
      this.zZ = 0;
      this.YZ = ShopScene.TK;
      this.WZ = this.AZ * this.jZ + this.XZ;
      for (let k = 0; k < this.luckyBox.numChildren; k++) this.luckyBox.getChildAt(k).mouseEnabled = false;
      this.RK();
      this.FZ = 2;
    } else if (this.FZ === 2) {
      this.CK(this.HZ);
      this.HZ = (this.HZ + 1) % this.AZ;
      this.zZ += 1;
      if (this.zZ >= this.WZ) {
        this.FZ = 0;
        this.UK(this.HZ, true);
        for (let k = 0; k < this.luckyBox.numChildren; k++) this.luckyBox.getChildAt(k).mouseEnabled = true;
      } else {
        this.YZ = this.WZ - this.zZ < ShopScene.FK ? ShopScene.TK * (ShopScene.FK - (this.WZ - this.zZ)) : ShopScene.TK;
        this.FZ = 3;
        this.UK(this.HZ);
      }
      if (this.WZ - this.zZ < 5) {
        this.MK();
        this.AK(this.EZ[this.HZ]);
      }
    } else if (this.FZ === 3) {
      this.OZ += t;
      if (this.OZ < this.YZ) return;
      this.OZ = 0;
      this.FZ = 2;
      $.instance().playSound("lottery");
    }
  }

  UK(t: number, s = false): void {
    const i = this.luckyBox.getChildAt(t);
    if (!i) return;
    if (s) {
      let count = 0;
      const step = () => {
        if (count < 3)
          Laya.Tween.create(i)
            .to("scaleX", 1.2)
            .to("scaleY", 1.2)
            .duration(200)
            .then(() => {
              Laya.Tween.create(i)
                .to("scaleX", 1)
                .to("scaleY", 1)
                .duration(200)
                .then(() => {
                  count++;
                  step();
                });
            });
        else {
          this.DZ = i.getChildByName("img");
          this.YK(this.GZ, i);
        }
      };
      step();
    } else i.scale(1.1, 1.1);
  }

  CK(t: number): void {
    const s = this.luckyBox.getChildAt(t);
    if (s) s.scale(1, 1);
  }

  YK(t: number, s: any): void {
    if (t === 23) return void this.kK(s);
    const i = Zi.instance().xx.length;
    const h = Zi.instance().Sx.length;
    const e = Zi.instance().Yx(t);
    if (!this.Ue.ea(t)) {
      if (e && i >= this.Ue.Ze) return void K.instance().openDialog("ReplacePropsTipDialog", false, t);
      if (!e && h >= this.Ue.Ke) return void K.instance().openDialog("ReplacePropsTipDialog", false, t);
    }
    const a = this.Ue.Ue[t].txt;
    tt.instance().showTip("恭喜你，抽中了" + a + "！");
    this._K(t);
  }

  hK(): void {
    this.luckyBtn.mouseEnabled = this.JZ.length !== 0;
  }

  XK(): void {
    this.FZ = 0;
    this.OZ = 0;
    this.YZ = 0;
    this.XZ = 0;
    this.GZ = null;
    this.HZ = 0;
    this.WZ = 0;
    this.zZ = 0;
    this.EZ = [];
    this.BZ = [];
    this.aK();
    for (let t = 0; t < this.luckyBox.numChildren; t++) this.luckyBox.getChildAt(t).offAll();
  }

  KZ(): void {
    let t = Zi.instance().xx;
    for (let s = 0; s < this.activePropsBox.numChildren; s++)
      if (s < t.length) this.GK(true, s, t[s]);
      else this.activePropsBox.getChildAt(s).visible = false;
    t = Zi.instance().Sx;
    for (let s = 0; s < this.passivePropsBox.numChildren; s++)
      if (s < t.length) this.GK(false, s, t[s]);
      else this.passivePropsBox.getChildAt(s).visible = false;
  }

  GK(t: boolean, s: number, i: number): void {
    const h = t ? this.activePropsBox.getChildAt(s) : this.passivePropsBox.getChildAt(s);
    const e = h.getChildByName("img");
    const a = h.getChildByName("rarity");
    a.skin = "resources/img/shop/itemBg" + (Zi.instance().Yx(i) ? "0" : "1") + "_" + this.Vv(i, false) + ".png";
    e.skin = this.yK(i, false);
    h.skin = t ? "resources/img/props/activePropsBg.png" : "resources/img/props/passivePropsBg.png";
    h.visible = true;
  }

  _K(t: number): void {
    const s = Zi.instance().Yx(t);
    const i = this.Ue.ea(t);
    const h = this.HK(s, t);
    Laya.Point.TEMP.x = this.DZ.width / 2;
    Laya.Point.TEMP.y = this.DZ.height / 2;
    h.parent.getChildByName("rarity").visible = false;
    h.parent.getChildByName("deleteBtn").visible = false;
    h.skin = "";
    this.DZ.localToGlobal(Laya.Point.TEMP);
    h.globalToLocal(Laya.Point.TEMP);
    console.log("打印起始位置", Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    const e = new Laya.Box();
    e.size(2 * this.DZ.width, 2 * this.DZ.height);
    e.anchor(0.5, 0.5);
    e.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    h.addChild(e);
    const a = new Laya.Image("resources/img/shop/lottery/propsLight.png");
    a.size(2 * this.DZ.width, 2 * this.DZ.height);
    a.anchor(0.5, 0.5);
    a.pos(e.width / 2, e.height / 2);
    e.addChild(a);
    const n = new Laya.Image(this.yK(t));
    n.size(this.DZ.width, this.DZ.height);
    n.anchor(0.5, 0.5);
    n.pos(e.width / 2, e.height / 2);
    e.addChild(n);
    const r = h.width / n.width;
    Laya.Tween.create(e)
      .to("x", h.width / 2)
      .to("y", h.height / 2)
      .to("scaleX", r)
      .to("scaleY", r)
      .duration(500)
      .chain(a)
      .to("alpha", 0)
      .duration(300)
      .then(() => {
        e.destroy();
        h.parent.getChildByName("rarity").visible = true;
        h.parent.getChildByName("deleteBtn").visible = true;
        const a2 = s ? Zi.instance().xx.length : Zi.instance().Sx.length;
        Zi.instance().addProps(t);
        if (i) {
          if (Zi.instance().Nx(t) === 1) this.GK(s, a2, t);
          else {
            h.parent.getChildByName("rarity").skin =
              "resources/img/shop/itemBg" + (Zi.instance().Yx(t) ? "0" : "1") + "_" + this.Vv(t, false) + ".png";
            h.skin = this.yK(t, false);
          }
        } else this.GK(s, a2, t);
      });
  }

  HK(t: boolean, s: number): any {
    const i = t ? this.activePropsBox : this.passivePropsBox;
    let h: number;
    if (this.Ue.ea(s)) {
      h = (t ? Zi.instance().xx : Zi.instance().Sx).indexOf(s);
      if (h === -1) h = (t ? Zi.instance().xx : Zi.instance().Sx).length;
    } else h = t ? Zi.instance().xx.length : Zi.instance().Sx.length;
    if (h < 0) h = 0;
    i.getChildAt(h).visible = true;
    return i.getChildAt(h).getChildByName("img");
  }

  VZ(): void {
    let t: any;
    for (let s = 0; s < this.activePropsBox.numChildren; s++) {
      t = this.activePropsBox.getChildAt(s).getChildByName("deleteBtn");
      t.on(Laya.Event.CLICK, this, (e: any) => {
        e.stopPropagation();
        K.instance().openDialog("DeletePropsTipDialog", false, Zi.instance().xx[s]);
      });
    }
    for (let s = 0; s < this.passivePropsBox.numChildren; s++) {
      t = this.passivePropsBox.getChildAt(s).getChildByName("deleteBtn");
      t.on(Laya.Event.CLICK, this, (e: any) => {
        e.stopPropagation();
        K.instance().openDialog("DeletePropsTipDialog", false, Zi.instance().Sx[s]);
      });
    }
  }

  async aK(): Promise<void> {
    this.RK();
    xo.kZ();
    for (let t = 0; t < this.AZ; t++) {
      const s = this.luckyBox.getChildAt(t);
      if (s) {
        const eff = await xo.addEffect(s, {
          speed: 0.3 + 0.4 * Math.random(),
          borderWidth: 2,
          lZ: new Laya.Color(0.2 + 0.8 * Math.random(), 0.5 + 0.5 * Math.random(), 1, 1),
          cZ: 1.5 + 0.5 * Math.random(),
        });
        if (eff) this.PZ.push(eff);
      }
    }
  }

  RK(): void {
    for (let t = 0; t < this.AZ; t++) {
      const s = this.luckyBox.getChildAt(t);
      if (s) xo.removeEffect(s);
    }
    this.PZ = [];
  }

  vK(): void {
    let t: any;
    this.IZ = true;
    for (let s = 0; s < this.xZ.length; s++) {
      t = this.xZ[s].getChildByName("btn");
      t.skin = "resources/img/shop/btn3.png";
      t.getChildByName("soldOutTxt").visible = true;
      t.getChildByName("goldBox").visible = false;
      t.getChildByName("adBox").visible = false;
    }
    this.luckyBtn.gray = true;
    this.luckyBtn.scale(1, 1);
    Laya.Tween.killAll(this.luckyBtn);
    this.bK();
  }

  Qo(t: number, s: boolean, i: any, h: any): void {
    if (!t || !i) return void q.instance().showUnitInfo(false);
    h.stopPropagation();
    const e = this.Ue.Ue[t];
    const a = this.qv(t, s);
    const n = this.Vv(t, s);
    Laya.Point.TEMP.x = 0;
    Laya.Point.TEMP.y = 0;
    i.localToGlobal(Laya.Point.TEMP);
    const r = {
      x: Laya.Point.TEMP.x,
      y: Laya.Point.TEMP.y,
      width: i.width * i.globalScaleX,
      height: i.height * i.globalScaleY,
    };
    q.instance().showUnitInfo(true, r, a, e.txt, n, i);
  }

  nK(): void {
    const t = () => {
      Laya.Tween.create(this.luckyBtn)
        .to("scaleX", 1.1)
        .to("scaleY", 1.1)
        .duration(300)
        .chain()
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(300)
        .then(t);
    };
    t();
  }

  ZZ(): void {
    this.WK = new Laya.Sprite();
    this.lotteryLabel.addChild(this.WK);
    this.WK.pos(3, 3);
    this.WK.size(132, 54);
    this.WK.graphics.drawRect(0, 0, 132, 54, "#ffffff");
    this.lotteryLabelLight.mask = this.WK;
    this.WK.visible = false;
  }

  EK(): void {
    const t = () => {
      this.lotteryLabelRect.alpha = 0;
      this.lotteryLabelRect.scale(0.8, 0.8);
      this.lotteryLabelLight.scale(0, 0);
      this.WK.visible = false;
      Laya.Tween.create(this.lotteryLabel)
        .delay(1000)
        .to("scaleX", 1.05)
        .to("scaleY", 1.05)
        .duration(100)
        .chain()
        .to("scaleX", 0.8)
        .to("scaleY", 0.8)
        .duration(300)
        .then(() => {
          this.WK.visible = true;
          this.zK();
        })
        .chain(this.lotteryLabelRect)
        .to("alpha", 1)
        .duration(100)
        .to("scaleX", 1.2)
        .to("scaleY", 1.2)
        .duration(300)
        .parallel(this.lotteryLabel)
        .to("scaleX", 1.05)
        .to("scaleY", 1.05)
        .duration(200)
        .parallel(this.lotteryLabelLight)
        .to("scaleX", 1.8)
        .to("scaleY", 1.8)
        .duration(200)
        .chain(this.lotteryLabel)
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(300)
        .parallel(this.lotteryLabelRect)
        .to("alpha", 0)
        .to("scaleX", 1.4)
        .to("scaleY", 1.4)
        .duration(300)
        .then(t);
    };
    t();
  }

  zK(): void {
    const t = f.range(2, 4, true);
    for (let s = 0; s < t; s++) {
      const star = new Laya.Image(
        Math.random() < 0.5
          ? "resources/img/shop/lottery/whiteStar.png"
          : "resources/img/shop/lottery/yellowStar.png",
      );
      this.lotteryLabel.addChild(star);
      star.size(20, 20);
      star.anchor(0.5, 0.5);
      star.scale(0, 0);
      star.alpha = 0.5;
      star.pos(f.range(20, this.lotteryLabel.width - 20), f.range(20, this.lotteryLabel.height - 20));
      Laya.Tween.create(star)
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(50)
        .chain()
        .to("scaleX", 0)
        .to("scaleY", 0)
        .duration(200)
        .delay(300)
        .then(() => {
          star.destroy();
        });
    }
  }

  BK(): void {
    Laya.Tween.killAll(this.lotteryLabel);
    Laya.Tween.killAll(this.lotteryLabelRect);
    this.lotteryLabel.scale(1, 1);
    this.lotteryLabelRect.alpha = 0;
    this.lotteryLabelRect.scale(1, 1);
  }

  DK(t: any): void {
    if (t.getChildByName("glow")) return;
    const s = new Laya.Image("resources/img/shop/lottery/propsLight.png");
    s.name = "glow";
    s.size(1.3 * t.width, 1.3 * t.width);
    s.anchor(0.5, 0.5);
    s.pos(t.width / 2, t.height / 2);
    s.zIndex = -1;
    t.addChild(s);
    this.jK(s);
    this.$K(s);
  }

  jK(t: any): void {
    Laya.Tween.create(t)
      .to("rotation", 360)
      .duration(6000)
      .then(() => {
        t.rotation = 0;
        this.jK(t);
      }, this);
  }

  $K(t: any): void {
    t.alpha = 0.4;
    const s = () => {
      Laya.Tween.create(t).to("alpha", 0.8).duration(1500).then(i, this);
    };
    const i = () => {
      Laya.Tween.create(t).to("alpha", 0.4).duration(1500).then(s, this);
    };
    s();
  }

  IK(): void {
    for (let t = 0; t < this.luckyBox.numChildren; t++) {
      const s = this.luckyBox.getChildAt(t).getChildByName("glow");
      if (s) {
        Laya.Tween.killAll(s);
        s.removeSelf();
      }
    }
  }

  kK(t: any): void {
    const s = new Laya.Point(t.width / 2, t.height / 2);
    t.localToGlobal(s);
    this.globalToLocal(s);
    const i = new Laya.Point(this.staminaImg.width / 2, this.staminaImg.height / 2);
    this.staminaImg.localToGlobal(i);
    this.globalToLocal(i);
    q.instance().explodeAndFlyReward(
      this,
      "resources/img/mainUI/stamina/stamina.png",
      this.staminaImg.width / 2,
      this.staminaImg.height / 2,
      s,
      i,
      this.staminaImg.width / 2,
      this.staminaImg.height / 2,
      null,
      () => {
        F.instance().player.stamina = Math.min(F.instance().player.stamina + 1, F.instance().stamina.hn);
      },
      null,
      1,
      1,
      60,
      10,
    );
    tt.instance().showTip("恭喜你，获得行军丹，体力+10！");
    $.instance().playSound("popup_notification");
  }

  aW(): void {
    const t = F.instance().player.stamina;
    this.staminaTxt.text = t.toString();
    if (t < F.instance().stamina.an) this.staminaTxt.color = "#e95b55";
    else this.staminaTxt.color = "#f7de76";
  }

  yK(t: number, s = true): string {
    let i = 1;
    const h = this.Ue.Ue[t];
    if (this.Ue.ea(t) && Zi.instance().iS(true, t)) {
      const lvl = Zi.instance().Nx(t);
      i = s ? lvl + 1 : lvl;
    }
    return `resources/img/props/${h.name}_${i}.png`;
  }

  Vv(t: number, s: boolean): number {
    const i = Zi.instance().Nx(t);
    return this.Ue.aa(t, s ? i + 1 : i);
  }

  qv(t: number, s: boolean): string {
    const i = Zi.instance().Nx(t);
    return this.Ue.na(t, s ? i + 1 : i);
  }

  Bu(): void {
    j.instance().unregister("ShopScene");
    this.shopLabel.visible = true;
    this.lotteryLabel.visible = true;
    this.lotteryLabelRect.visible = true;
    this.RK();
    this.IZ = false;
    for (let t = 0; t < this.xZ.length; t++)
      this.xZ[t].getChildByName("btn").getChildByName("soldOutTxt").visible = false;
    this.luckyBtn.scale(1, 1);
    Laya.Tween.killAll(this.luckyBtn);
    this.luckyBtn.gray = false;
    this.MK();
    this.PK();
    Laya.Tween.to(this.bg, { alpha: 0 }, 100);
    Laya.Tween.to(
      this.box,
      { scaleX: 0, scaleY: 0 },
      300,
      Laya.Ease.strongOut,
      Laya.Handler.create(this, () => {
        K.instance().closeScene("ShopScene");
        y.instance.event(u.Zt);
      }),
    );
    this.bK();
    this.XK();
    q.instance().showUnitInfo(false);
    this.oK("shop");
    this.BK();
    this.redPoint.visible = true;
  }
}
