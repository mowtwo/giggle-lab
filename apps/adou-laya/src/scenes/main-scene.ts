// MainScene — the main menu (the bundle's `eo`, @regClass dKvUsPTsTBGGfiZxHMSqtg).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~34846-35591. Hosts the Adou/Zhaoyun idle animations, the play button (spends
// stamina, rolls the opponent, opens MatchScene), gold/stamina HUD, rank stars
// (with a GM rank/star picker when `Cn.OH`), the sword/knife collision loop on the
// play button, the weapon-bag bounce, the shop walker, talk bubbles, and the nav
// buttons (setting/shop/rank/weapon/avatar/sidebar/get-stamina). Opaque field /
// method names kept verbatim; node refs bound from MainScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { PrivacyAgreementMgr } from "../core/privacy-agreement-mgr";
import { GameController } from "../battle/game-controller";
import { SceneMgr } from "../core/scene-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { AvatarMgr } from "../battle/avatar-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { AnimPlayer } from "../battle/anim-player";
import { GameMgr } from "../core/game-mgr";
import { WeaponFragmentMgr } from "../battle/weapon-fragment-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { StaminaCtrl } from "../battle/stamina-ctrl";
import { LeaderboardMgr } from "../battle/leaderboard-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { TipMgr } from "../core/tip-mgr";
import { MathE } from "../core/math-e";
import { RankScoreMgr } from "../battle/rank-score-mgr";
import { AnalyticsMgr } from "../battle/analytics-mgr";

const Kr = PrivacyAgreementMgr;
const Cn = GameController;
const K = SceneMgr;
const q = EffectMgr;
const In = AvatarMgr;
const y = EventMgr;
const u = GameEvent;
const Zt = AnimPlayer;
const F = GameMgr;
const eh = WeaponFragmentMgr;
const $ = AudioMgr;
const Mt = PlatformMgr;
const Rn = StaminaCtrl;
const Dn = LeaderboardMgr;
const Zi = BattlePropsMgr;
const tt = TipMgr;
const f = MathE;
const En = RankScoreMgr;
const St = AnalyticsMgr;

/** Sparkle-emitter config used by the sidebar button. (`so`) */
export class SparkleConfig {
  Wc = 300;
  Vc = 4;
  Qc = 200;
  zc = 20;
  jc = 40;
  $c = 10;
  Nc = 500;
  qc = 1000;
  skins: string[];
  constructor(t: string[]) {
    this.skins = t;
  }
}
const so = SparkleConfig;

@regClass("dKvUsPTsTBGGfiZxHMSqtg")
export class MainScene extends Laya.Scene {
  // .ls-bound nodes
  ageTip!: any;
  playBtn!: any;
  settingBtn!: any;
  shopBtn!: any;
  rankBtn!: any;
  talkHitArea!: any;
  avatarArea!: any;
  addStaminaBtn!: any;
  weaponBtn!: any;
  shopWalk!: any;
  dySidebarBtn!: any;
  dySidebarBtnLight!: any;
  mat!: any;
  goldTxt!: any;
  staminaTxt!: any;
  avatarImg!: any;
  staminaImg!: any;
  btnStaminaImg!: any;
  rankTxt!: any;
  star0!: any;
  star1!: any;
  star2!: any;
  star3!: any;
  star4!: any;
  star5!: any;
  starNum!: any;
  colEff!: any;
  sword!: any;
  knife!: any;
  swordLight!: any;
  knifeLight!: any;
  colLight!: any;
  bag!: any;

  static fQ = "#ffffff";
  static vQ = "#fff5dc";
  static LQ = -70;
  static mQ = 70;
  static pQ = 45;
  static yQ = -45;
  static dQ = 27;
  static iQ = 0.2;
  static sQ = 0.5;
  static hQ = 30;
  static nQ = 360;

  private yV = ["你很会打吗？"];
  private fV = 5000;
  private gV = 0;
  private dV = 0;
  private LV = false;
  private mV: any = { x: 0, y: 0, rotation: 0 };
  private wV: any = { x: 0, y: 0, rotation: 0 };
  private vV = 0;
  private kV = false;
  private _V = 0;
  private xV = 0;
  private SV: any = null;
  private bV: any = null;
  private MV: any[] = [];
  private PV = false;
  private AV = 0;
  private EV = ["下次再见！", "没货了", "没事常联系"];
  private BV: any = null;
  private IV: any = null;
  private DV = 0;
  private ZV!: any;
  private KV = 0;

  onAwake(): void {
    this.TV();
    Kr.instance().bindAgeBadge(this.ageTip);
    this.k$();
    this.aW();
    this.playBtn.on(Laya.Event.CLICK, this, this.startGame);
    this.settingBtn.on(Laya.Event.CLICK, this, () => {
      K.instance().openScene("SettingScene");
    });
    this.shopBtn.on(Laya.Event.CLICK, this, () => {
      K.instance().openScene("ShopScene");
    });
    const t = Kr.instance().platformConfig().isShowRank;
    if (typeof t === "boolean" && !t) this.rankBtn.visible = false;
    this.rankBtn.on(Laya.Event.CLICK, this, this.Re);
    this.talkHitArea.on(Laya.Event.CLICK, this, this.X$);
    this.avatarArea.on(Laya.Event.CLICK, this, this.RV);
    this.addStaminaBtn.on(Laya.Event.CLICK, this, this.CV);
    this.weaponBtn.on(Laya.Event.CLICK, this, this.UV);
    this.shopWalk.on(Laya.Event.CLICK, this, this.FV);
    In.instance().FG(() => {
      this.OV();
    });
    this.dySidebarBtn.on(Laya.Event.CLICK, this, this.YV);
    q.instance().bindButtons([
      this.playBtn,
      this.settingBtn,
      this.avatarArea,
      this.rankBtn,
      this.weaponBtn,
      this.addStaminaBtn,
      this.dySidebarBtn,
      this.shopWalk,
    ]);
    y.instance.on(u.qt, this, this.k$);
    y.instance.on(u.Vt, this, this.aW);
    y.instance.on(u.Qt, this, this.XV);
    y.instance.on(u.Zt, this, this.GV);
    this.HV();
    if (Cn.instance().OH) this.WV();
  }

  onOpened(_t?: any): void {
    St.instance().Ty();
    this.OV();
    this.weaponBtn.visible = true;
    const s = F.instance().player;
    if (eh.instance().Zb() && !s.weaponFree) {
      eh.instance().tM();
      s.weaponFree = true;
    }
    $.instance().playMusic("bg_mainScene");
    if (!(F.instance().player.sidebarState !== 2 && Mt.instance().qy())) this.dySidebarBtn.visible = false;
    this.zV();
    this.jV();
    this.$V();
    this.NV();
    this.qV();
  }

  onClosed(): void {
    if (this.AV > 0) {
      q.instance().removeEvent("btnSparkle", this.AV);
      this.AV = 0;
    }
    this.VV();
    this.QV();
    Laya.Tween.killAll(this.dySidebarBtnLight);
  }

  OV(): void {
    this.avatarImg.texture = null;
    In.instance().GG(this.avatarImg);
  }

  TV(): void {
    this.ZV = Zt.instance().pf("aDou");
    this.ZV.scale(2, 2);
    this.ZV.play("zhan2", true);
    this.ZV.pos(25, -105);
    this.mat.addChild(this.ZV);
    const t = new Laya.Image("resources/img/gameObject/enemy/shadow1.png");
    t.size(200, 60);
    t.pos(-30, 165);
    this.mat.addChild(t);
    const s = Zt.instance().pf("zhaoYun");
    s.pos(30, 195);
    s.scale(2, 2);
    s.play("shouye", true);
    this.mat.addChild(s);
    const i = Zt.instance().pf("zhaoYun");
    i.pos(130, 200);
    i.scale(2, 2);
    i.play("zhan2", true);
    this.mat.addChild(i);
  }

  k$(): void {
    this.goldTxt.text = F.instance().player.gold.toString();
  }

  aW(): void {
    // 去除体力限制:始终展示为无穷大,不再读取真实体力值。
    this.staminaTxt.text = "∞";
    this.staminaTxt.color = "#f7de76";
  }

  X$(): void {
    Laya.Point.TEMP.x = this.talkHitArea.width / 4;
    Laya.Point.TEMP.y = this.talkHitArea.height / 3;
    this.talkHitArea.localToGlobal(Laya.Point.TEMP);
    q.instance().showTalkBox(
      Laya.Point.TEMP.x,
      Laya.Point.TEMP.y,
      this.yV[f.range(0, this.yV.length, true)],
      this.talkHitArea,
      false,
    );
  }

  XV(): void {
    this.shopBtn.visible = true;
    this.shopWalk.visible = false;
  }

  GV(): void {
    this.shopBtn.visible = false;
    this.shopWalk.visible = true;
    this.shopWalk.x = 320;
    const t = (1386 * (640 + this.shopWalk.width)) / Laya.stage.height;
    Laya.Tween.to(this.shopWalk, { x: t }, 5000);
    this.KV = q
      .instance()
      .registerImgLoop(
        this.shopWalk,
        ["resources/img/mainUI/walk0.png", "resources/img/mainUI/walk1.png", "resources/img/mainUI/walk2.png"],
        200,
      );
  }

  FV(): void {
    Laya.Point.TEMP.x = this.shopWalk.width / 2 - 20;
    Laya.Point.TEMP.y = 30;
    this.shopWalk.localToGlobal(Laya.Point.TEMP);
    q.instance().showTalkBox(
      Laya.Point.TEMP.x,
      Laya.Point.TEMP.y,
      this.EV[f.range(0, this.EV.length, true)],
      this.shopWalk,
      false,
    );
  }

  Re(): void {
    K.instance().openScene("RankScene");
  }

  async startGame(): Promise<void> {
    if (!Rn.instance().EH()) {
      tt.instance().showTip("体力不足，无法开始游戏！");
      return Promise.reject("体力不足");
    }
    if (Date.now() - this.gV < this.fV) return;
    Rn.instance().BH();
    this.gV = Date.now();
    await this.JV();
    Dn.instance().eH();
    Zi.instance().tS();
    K.instance().openScene("MatchScene");
    Laya.Tween.killAll(this.shopWalk);
    this.shopWalk.visible = false;
    this.shopWalk.x = 320;
    q.instance().removeEvent("imgLoop", this.KV);
    this.shopWalk.skin = "resources/img/mainUI/walk0.png";
  }

  YV(): void {
    K.instance().openDialog("SidebarDialog");
  }

  UV(): void {
    const t = eh.instance();
    if (t.Zb()) K.instance().openScene("WeaponScene");
    else tt.instance().showTip("第" + t.Jb() + "天解锁武器呦~");
  }

  CV(): void {
    K.instance().openDialog("GetStaminaDialog");
  }

  RV(): void {
    K.instance().openScene("AvatarSettingScene");
  }

  JV(): Promise<void> {
    return new Promise((resolve) => {
      const s = F.instance().stamina.an;
      Laya.Point.TEMP.x = this.staminaImg.width / 2;
      Laya.Point.TEMP.y = this.staminaImg.height / 2;
      this.staminaImg.localToGlobal(Laya.Point.TEMP);
      this.globalToLocal(Laya.Point.TEMP);
      const i = new Laya.Point(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
      Laya.Point.TEMP.x = this.btnStaminaImg.width / 2;
      Laya.Point.TEMP.y = this.btnStaminaImg.height / 2;
      this.btnStaminaImg.localToGlobal(Laya.Point.TEMP);
      this.globalToLocal(Laya.Point.TEMP);
      const h = new Laya.Point(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
      q.instance().explodeAndFlyReward(
        this,
        "resources/img/mainUI/stamina/stamina.png",
        this.staminaImg.width / 2,
        this.staminaImg.height / 2,
        i,
        h,
        this.btnStaminaImg.width,
        this.btnStaminaImg.height,
        () => {
          resolve();
        },
        undefined,
        null,
        1,
        1,
        20,
        s,
      );
    });
  }

  tQ(): boolean {
    if (!this.playBtn || this.playBtn.destroyed) return false;
    const t = Math.max(1, this.playBtn.width);
    const s = Math.max(1, this.playBtn.height - 10);
    if (!this.BV || this.BV.destroyed) {
      const i = new Laya.Sprite();
      i.mouseEnabled = false;
      i.size(t, s);
      i.graphics.drawRect(0, 0, t, s, "#ffffff");
      i.alpha = MainScene.sQ;
      i.visible = false;
      this.playBtn.addChild(i);
      this.BV = i;
    }
    if (!this.IV || this.IV.destroyed) {
      const t2 = new Laya.Sprite();
      t2.mouseEnabled = false;
      this.IV = t2;
      this.BV.mask = t2;
      this.BV.addChild(t2);
    }
    const i = Math.max(8, t * MainScene.iQ);
    const h = 2 * s;
    this.IV.graphics.clear();
    this.IV.graphics.drawRect(0.5 * -i, 0.5 * -h, i, h, "#ffffff");
    this.IV.pivot(0, 0);
    this.IV.rotation = MainScene.hQ;
    this.IV.y = 0.5 * s;
    this.BV.size(t, s);
    this.BV.graphics.clear();
    this.BV.graphics.drawRect(0, 0, t, s, "#ffffff");
    return true;
  }

  eQ(): void {
    this.DV++;
    if (this.IV && !this.IV.destroyed) Laya.Tween.killAll(this.IV);
    if (this.BV && !this.BV.destroyed) this.BV.visible = false;
  }

  aQ(): void {
    if (!this.tQ()) return;
    const t = this.BV;
    const s = this.IV;
    if (!t || !s || t.destroyed || s.destroyed) return;
    this.eQ();
    const i = ++this.DV;
    const h = Math.max(1, this.playBtn.width);
    t.visible = true;
    s.x = 0.5 * -h;
    Laya.Tween.create(s)
      .to("x", 1.5 * h)
      .duration(MainScene.nQ)
      .ease(Laya.Ease.linearNone)
      .then(() => {
        if (i === this.DV && this.BV && !this.BV.destroyed) this.BV.visible = false;
      }, this);
  }

  rQ(t: number): any {
    switch (t) {
      case 0:
        return this.star0;
      case 1:
        return this.star1;
      case 2:
        return this.star2;
      case 3:
        return this.star3;
      case 4:
        return this.star4;
      default:
        throw new Error("MainScene.mainRankStarImage: invalid index " + t);
    }
  }

  zV(): void {
    const t = F.instance().rank.currentRank;
    this.rankTxt.text = t.rank;
    if (t.rank !== "皇帝") {
      for (let s = 0; s < 5; s++) {
        const i = this.rQ(s);
        i.skin = s <= t.level - 1 ? "resources/img/gameOverUI/star4.png" : "resources/img/gameOverUI/star3.png";
        i.visible = true;
      }
      this.star5.visible = false;
    } else {
      for (let s = 0; s < 5; s++) this.rQ(s).visible = false;
      this.star5.visible = true;
      this.starNum.text = "x" + t.level;
    }
  }

  WV(): void {
    if (this.SV || this.bV) return;
    const t = F.instance().rank;
    const s = Array.from(t.table.keys()).sort((a: any, b: any) => a - b);
    this.MV = s;
    const i = "#ffffff";
    const h = "#000000";
    const e = Math.max(0, 0.5 * (Laya.stage.width - 336));
    const a = e;
    const n = e + 180 + 36;
    const r = new Laya.Text();
    r.text = "段位";
    r.fontSize = 20;
    r.bold = true;
    r.color = i;
    r.stroke = 3;
    r.strokeColor = h;
    r.pos(a, 1150);
    this.addChild(r);
    const o = new Laya.ComboBox();
    o.labels = s.map((x: any) => t.table.get(x).rank).join(",");
    o.width = 180;
    o.height = 42;
    o.itemSize = 24;
    o.scrollType = Laya.ScrollType.Vertical;
    o.pos(a, 1158);
    o.selectHandler = Laya.Handler.create(this, (idx: number) => this.oQ(idx), null, false);
    this.addChild(o);
    this.SV = o;
    const l = new Laya.Text();
    l.text = "星级";
    l.fontSize = 20;
    l.bold = true;
    l.color = i;
    l.stroke = 3;
    l.strokeColor = h;
    l.pos(n, 1150);
    this.addChild(l);
    const c = new Laya.ComboBox();
    c.labels = "1";
    c.width = 120;
    c.height = 42;
    c.itemSize = 24;
    c.scrollType = Laya.ScrollType.Vertical;
    c.pos(n, 1158);
    c.selectHandler = Laya.Handler.create(this, (idx: number) => this.lQ(idx), null, false);
    this.addChild(c);
    this.bV = c;
  }

  oQ(t: number): void {
    if (this.PV) return;
    const s = this.MV[t];
    if (s == null) return;
    const i = F.instance().rank.table.get(s);
    if (!i) throw new Error("段位配置不存在: " + s);
    const h = F.instance().rank.currentRank;
    h.id = i.id;
    h.rank = i.rank;
    h.reward = i.reward;
    const e = Math.max(1, i.level);
    h.level = Math.max(1, Math.min(h.level, e));
    F.instance().player.curStar = En.instance().bG(h.id, h.level);
    Dn.instance().sH();
    this.zV();
    this.jV();
  }

  lQ(t: number): void {
    if (this.PV) return;
    const s = F.instance().rank.currentRank;
    const i = F.instance().rank.table.get(s.id);
    if (!i) throw new Error("段位配置不存在: " + s.id);
    const h = Math.max(1, i.level);
    s.level = Math.max(1, Math.min(t + 1, h));
    F.instance().player.curStar = En.instance().bG(s.id, s.level);
    Dn.instance().sH();
    this.zV();
    this.jV();
  }

  jV(): void {
    if (!this.SV || !this.bV || this.MV.length === 0) return;
    const t = F.instance().rank.currentRank;
    const s = F.instance().rank.table.get(t.id);
    if (!s) throw new Error("段位配置不存在: " + t.id);
    this.PV = true;
    const i = Math.max(0, this.MV.indexOf(t.id));
    this.SV.selectedIndex = i;
    const h = Math.max(1, s.level);
    this.bV.labels = Array.from({ length: h }, (_v, k) => String(k + 1)).join(",");
    this.bV.selectedIndex = Math.max(0, Math.min(t.level - 1, h - 1));
    this.PV = false;
  }

  $V(): void {
    if (this.colEff && !this.colEff.destroyed && this.sword && this.knife) {
      this.cQ();
      this.uQ(this.dV);
    }
  }

  cQ(): void {
    if (this.LV) return;
    this.colEff.mouseEnabled = false;
    this.colEff.visible = true;
    this.mV = { x: this.sword.x, y: this.sword.y, rotation: MainScene.pQ };
    this.wV = { x: this.knife.x, y: this.knife.y, rotation: MainScene.yQ };
    this.sword.rotation = MainScene.pQ;
    this.knife.rotation = MainScene.yQ;
    this.swordLight.alpha = 0;
    this.knifeLight.alpha = 0;
    if (this.colLight && !this.colLight.destroyed) this.colLight.alpha = 0;
    this.LV = true;
  }

  VV(): void {
    this.dV++;
    Laya.Tween.killAll(this.sword);
    Laya.Tween.killAll(this.knife);
    Laya.Tween.killAll(this.playBtn);
    Laya.Tween.killAll(this.swordLight);
    Laya.Tween.killAll(this.knifeLight);
    if (this.colLight && !this.colLight.destroyed) {
      Laya.Tween.killAll(this.colLight);
      this.colLight.alpha = 0;
    }
    this.eQ();
    if (
      this.LV &&
      this.sword &&
      !this.sword.destroyed &&
      this.knife &&
      !this.knife.destroyed
    ) {
      this.sword.pos(this.mV.x, this.mV.y);
      this.sword.rotation = this.mV.rotation;
      this.knife.pos(this.wV.x, this.wV.y);
      this.knife.rotation = this.wV.rotation;
    }
    if (this.swordLight && !this.swordLight.destroyed) this.swordLight.alpha = 0;
    if (this.knifeLight && !this.knifeLight.destroyed) this.knifeLight.alpha = 0;
    if (this.playBtn && !this.playBtn.destroyed) {
      this.playBtn.color = MainScene.fQ;
      this.playBtn.scale(1, 1);
    }
  }

  gQ(t: number, s: any, i: any, h: number, e: any, a: () => void): void {
    let n = 2;
    const r = () => {
      n--;
      if (n <= 0 && t === this.dV) a();
    };
    Laya.Tween.create(this.sword)
      .to("x", s.x)
      .to("y", s.y)
      .to("rotation", s.rotation)
      .duration(h)
      .ease(e)
      .then(r, this);
    Laya.Tween.create(this.knife)
      .to("x", i.x)
      .to("y", i.y)
      .to("rotation", i.rotation)
      .duration(h)
      .ease(e)
      .then(r, this);
  }

  uQ(t: number): void {
    if (t !== this.dV || !this.colEff || this.colEff.destroyed) return;
    const s = this.mV;
    const i = this.wV;
    const h = MainScene.dQ;
    const e = { x: s.x + h, y: s.y, rotation: MainScene.LQ };
    const a = { x: i.x - h, y: i.y, rotation: MainScene.mQ };
    const n = { x: e.x - 3, y: e.y + 5, rotation: e.rotation + 12 };
    const r = { x: a.x + 3, y: a.y + 5, rotation: a.rotation - 12 };
    const o = { x: e.x - 2, y: e.y - 4, rotation: e.rotation - 7 };
    const l = { x: a.x + 2, y: a.y - 4, rotation: a.rotation + 7 };
    this.gQ(t, e, a, 180, Laya.Ease.sineInOut, () => {
      this.gQ(t, n, r, 200, Laya.Ease.sineOut, () => {
        this.gQ(t, o, l, 220, Laya.Ease.sineInOut, () => {
          const h2 = { x: s.x, y: s.y, rotation: s.rotation };
          const e2 = { x: i.x, y: i.y, rotation: i.rotation };
          this.gQ(t, h2, e2, 160, Laya.Ease.quadIn, () => {
            if (t === this.dV)
              this.wQ(t, () => {
                if (t === this.dV)
                  Laya.timer.once(780, this, () => {
                    if (t === this.dV) this.uQ(t);
                  });
              });
          });
        });
      });
    });
  }

  wQ(t: number, s: () => void): void {
    if (t !== this.dV) return;
    this.aQ();
    Laya.Tween.killAll(this.swordLight);
    Laya.Tween.killAll(this.knifeLight);
    Laya.Tween.killAll(this.playBtn);
    if (this.colLight && !this.colLight.destroyed) Laya.Tween.killAll(this.colLight);
    this.swordLight.alpha = 0;
    this.knifeLight.alpha = 0;
    if (this.colLight && !this.colLight.destroyed) {
      this.colLight.alpha = 0;
      this.colLight.visible = true;
      Laya.Tween.create(this.colLight)
        .to("alpha", 0.75)
        .duration(38)
        .ease(Laya.Ease.quadOut)
        .chain()
        .to("alpha", 0)
        .duration(95)
        .ease(Laya.Ease.quadIn);
    }
    Laya.Tween.create(this.swordLight).to("alpha", 0.72).duration(48).ease(Laya.Ease.quadOut);
    Laya.Tween.create(this.knifeLight).to("alpha", 0.78).delay(36).duration(48).ease(Laya.Ease.quadOut);
    Laya.Tween.create(this.playBtn)
      .to("color", MainScene.vQ)
      .to("scaleX", 1.028)
      .to("scaleY", 1.028)
      .duration(90)
      .ease(Laya.Ease.quadOut);
    Laya.timer.once(100, this, () => {
      if (t === this.dV) {
        Laya.Tween.create(this.swordLight).to("alpha", 0).duration(130).ease(Laya.Ease.quadIn);
        Laya.Tween.create(this.knifeLight).to("alpha", 0).duration(140).ease(Laya.Ease.quadIn);
        Laya.Tween.create(this.playBtn)
          .to("color", MainScene.fQ)
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(200)
          .ease(Laya.Ease.sineOut);
      }
    });
    Laya.timer.once(340, this, () => {
      if (t === this.dV) s();
    });
  }

  NV(): void {
    this.QV();
    if (!this.bag || this.bag.destroyed || !this.bag.visible) return;
    const t = ++this.vV;
    const s = this.bag.y;
    this.kQ(t);
    Laya.Tween.create(this.bag)
      .to("scaleX", 1.2)
      .to("scaleY", 0.8)
      .duration(50)
      .delay(3000)
      .chain()
      .to("scaleX", 0.8)
      .to("scaleY", 1.2)
      .to("y", s - 30)
      .duration(100)
      .chain()
      .to("scaleX", 0.9)
      .to("scaleY", 1.1)
      .to("y", s)
      .duration(80)
      .chain()
      .to("scaleX", 1.1)
      .to("scaleY", 0.9)
      .duration(50)
      .chain()
      .to("scaleX", 0.9)
      .to("scaleY", 1.1)
      .to("y", s - 15)
      .duration(100)
      .chain()
      .to("scaleX", 0.95)
      .to("scaleY", 1.15)
      .to("y", s)
      .duration(60)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(50)
      .then(() => {
        if (t === this.vV && this.bag && !this.bag.destroyed && this.bag.visible) this.NV();
      }, this);
  }

  kQ(t: number): void {
    if (t !== this.vV || !this.bag || this.bag.destroyed || !this.bag.visible) return;
    const s = this.bag.getChildByName("weapon1");
    const i = this.bag.getChildByName("weapon2");
    if (s && i) {
      if (!this.kV) {
        this.kV = true;
        this._V = s.rotation;
        this.xV = i.rotation;
      }
      Laya.Tween.killAll(s);
      Laya.Tween.killAll(i);
      s.rotation = this._V;
      i.rotation = this.xV;
      Laya.Tween.create(s)
        .to("rotation", this._V)
        .duration(50)
        .delay(3000)
        .chain()
        .to("rotation", this._V - 15)
        .duration(100)
        .chain()
        .to("rotation", this._V + 10)
        .duration(80)
        .chain()
        .to("rotation", this._V + 6)
        .duration(50)
        .chain()
        .to("rotation", this._V - 12)
        .duration(100)
        .chain()
        .to("rotation", this._V + 8)
        .duration(60)
        .chain()
        .to("rotation", this._V)
        .duration(50);
      Laya.Tween.create(i)
        .to("rotation", this.xV)
        .duration(50)
        .delay(3000)
        .chain()
        .to("rotation", this.xV + 15)
        .duration(100)
        .chain()
        .to("rotation", this.xV - 10)
        .duration(80)
        .chain()
        .to("rotation", this.xV - 6)
        .duration(50)
        .chain()
        .to("rotation", this.xV + 12)
        .duration(100)
        .chain()
        .to("rotation", this.xV - 8)
        .duration(60)
        .chain()
        .to("rotation", this.xV)
        .duration(50);
    }
  }

  QV(): void {
    this.vV++;
    if (!this.bag || this.bag.destroyed) return;
    Laya.Tween.killAll(this.bag);
    this.bag.scale(1, 1);
    const t = this.bag.getChildByName("weapon1");
    const s = this.bag.getChildByName("weapon2");
    if (t) {
      Laya.Tween.killAll(t);
      if (this.kV) t.rotation = this._V;
    }
    if (s) {
      Laya.Tween.killAll(s);
      if (this.kV) s.rotation = this.xV;
    }
  }

  HV(): void {}

  qV(): void {
    if (this.dySidebarBtn.visible) {
      Laya.Tween.create(this.dySidebarBtnLight).to("alpha", 0.7).duration(1000).repeat(-1, true);
      this.AV = q.instance().registerBtnSparkle(this.dySidebarBtn, new so(["resources/img/mainUI/sidebar/star.png"]));
    }
  }
}
