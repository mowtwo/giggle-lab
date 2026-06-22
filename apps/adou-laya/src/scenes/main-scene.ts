// MainScene — the main menu (the bundle's `eo`, @regClass dKvUsPTsTBGGfiZxHMSqtg).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~34846-35591. Hosts the Adou/Zhaoyun idle animations, the play button (spends
// stamina, rolls the opponent, opens MatchScene), gold/stamina HUD, rank stars
// (with a GM rank/star picker when `GameController.OH`), the sword/knife collision loop on the
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
import { SkillBagDialog } from "../dialogs/skill-bag-dialog";

const u = GameEvent;
const Zt = AnimPlayer;
const $ = AudioMgr;

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
    PrivacyAgreementMgr.instance().bindAgeBadge(this.ageTip);
    this.k$();
    this.aW();
    this.playBtn.on(Laya.Event.CLICK, this, this.startGame);
    this.settingBtn.on(Laya.Event.CLICK, this, () => {
      SceneMgr.instance().openScene("SettingScene");
    });
    this.shopBtn.on(Laya.Event.CLICK, this, () => {
      SceneMgr.instance().openScene("ShopScene");
    });
    const t = PrivacyAgreementMgr.instance().platformConfig().isShowRank;
    if (typeof t === "boolean" && !t) this.rankBtn.visible = false;
    this.rankBtn.on(Laya.Event.CLICK, this, this.Re);
    this.talkHitArea.on(Laya.Event.CLICK, this, this.X$);
    this.avatarArea.on(Laya.Event.CLICK, this, this.RV);
    this.addStaminaBtn.on(Laya.Event.CLICK, this, this.CV);
    this.weaponBtn.on(Laya.Event.CLICK, this, this.UV);
    this.shopWalk.on(Laya.Event.CLICK, this, this.FV);
    AvatarMgr.instance().FG(() => {
      this.OV();
    });
    this.dySidebarBtn.on(Laya.Event.CLICK, this, this.YV);
    EffectMgr.instance().bindButtons([
      this.playBtn,
      this.settingBtn,
      this.avatarArea,
      this.rankBtn,
      this.weaponBtn,
      this.addStaminaBtn,
      this.dySidebarBtn,
      this.shopWalk,
    ]);
    EventMgr.instance.on(u.qt, this, this.k$);
    EventMgr.instance.on(u.Vt, this, this.aW);
    EventMgr.instance.on(u.Qt, this, this.XV);
    EventMgr.instance.on(u.Zt, this, this.GV);
    this.HV();
    if (GameController.instance().OH) this.WV();
    this.createSkillBagEntry();
    this.createMapSelector();
    this.createSaveIO();
  }

  /** 技能背包入口(左下角,与右下角武器背包对称):打开技能自由分配界面。 */
  private createSkillBagEntry(): void {
    // 复刻武器背包按钮(右下角 weaponBtn)的 sprite 拼接,镜像到左下角。
    const btn = new Laya.Sprite();
    btn.size(114, 110);
    btn.anchorX = 0.5;
    btn.anchorY = 0.5;
    btn.pos(77, 1126); // 与右下角 weaponBtn(x=563)关于屏幕中线(640/2)对称。
    btn.graphics.drawRect(0, 0, 114, 110, "#ffffff01"); // 透明命中区,整块可点。

    const bag = new Laya.Sprite();
    bag.size(114, 110);
    bag.anchorX = 0.5;
    bag.anchorY = 0.5;
    bag.pos(57, 55);
    btn.addChild(bag);

    const mkImg = (
      skin: string,
      x: number,
      y: number,
      w: number,
      hgt: number,
      ax = 0,
      ay = 0,
      rot = 0,
    ): any => {
      const img = new Laya.Image(skin);
      img.size(w, hgt);
      img.pos(x, y);
      img.anchorX = ax;
      img.anchorY = ay;
      if (rot) img.rotation = rot;
      return img;
    };
    bag.addChild(mkImg("resources/img/mainUI/bag2.png", 22, 18, 80, 85));
    bag.addChild(mkImg("resources/img/weapon/weapon_29.png", 65, 81, 28, 66, 0.5, 1, 34));
    bag.addChild(mkImg("resources/img/weapon/weapon_38.png", 43, 84, 31, 76, 0.5, 1, -28));
    bag.addChild(mkImg("resources/img/mainUI/bag3.png", 16, 59, 74, 49));
    bag.addChild(mkImg("resources/img/mainUI/bag1.png", 22, 18, 64, 50));

    const label = new Laya.Label("技能背包");
    label.width = 156;
    label.height = 47;
    label.pos(-22, 107);
    label.fontSize = 26;
    label.color = "#fdbe45";
    label.align = "center";
    label.valign = "middle";
    label.leading = 2;
    (label as any).stroke = 6;
    (label as any).strokeColor = "#000000";
    btn.addChild(label);

    btn.on(Laya.Event.CLICK, this, () => {
      this.addChild(new SkillBagDialog());
    });
    EffectMgr.instance().bindButtons([btn]);
    this.addChild(btn);
  }

  /** 首页地图选择器:玩家自主选择要玩的地图(改造新增,替代按天数自动匹配)。 */
  private createMapSelector(): void {
    const maps = ["巨鹿", "云梦泽", "虎牢关", "赤壁"];
    const box = new Laya.Sprite();
    box.pos(0, 400); // 段位与棋盘之间的空隙,避免与棋盘/对话区重叠。
    this.addChild(box);

    const W = 384;
    const X0 = (640 - W) / 2;
    const bg = new Laya.Sprite();
    bg.pos(X0, -4);
    this.paintPlaque(bg, W, 110);
    box.addChild(bg);

    const tag = new Laya.Label("选择地图");
    tag.fontSize = 22;
    tag.color = "#d8b06a";
    tag.width = 640;
    tag.align = "center";
    tag.y = 8;
    box.addChild(tag);

    const nameLbl = new Laya.Label(maps[this.clampMap(GameMgr.instance().player.selectedMapId)]);
    nameLbl.fontSize = 48;
    nameLbl.color = "#f7de76";
    nameLbl.bold = true;
    (nameLbl as any).stroke = 5;
    (nameLbl as any).strokeColor = "#5a3a12";
    nameLbl.width = 640;
    nameLbl.align = "center";
    nameLbl.y = 42;
    box.addChild(nameLbl);

    const mkArrow = (text: string, x: number, dir: number): void => {
      const a = new Laya.Sprite();
      a.pos(x, 28);
      a.size(56, 56);
      a.mouseEnabled = true;
      this.paintCircleBtn(a, 56);
      const al = new Laya.Label(text);
      al.fontSize = 38;
      al.color = "#f7de76";
      al.bold = true;
      al.width = 56;
      al.height = 56;
      al.align = "center";
      al.valign = "middle";
      a.addChild(al);
      a.on(Laya.Event.CLICK, this, () => {
        const cur = this.clampMap(GameMgr.instance().player.selectedMapId);
        const next = (cur + dir + maps.length) % maps.length;
        GameMgr.instance().player.selectedMapId = next;
        nameLbl.text = maps[next];
      });
      box.addChild(a);
    };
    mkArrow("◀", X0 - 6, -1);
    mkArrow("▶", X0 + W - 50, 1);
  }

  private clampMap(v: number): number {
    return v >= 0 && v <= 3 ? v : 0;
  }

  /** 画一个木牌风格背板(深褐底 + 亮橙边 + 顶部高光),用于自定义按钮。 */
  private paintPlaque(sp: any, w: number, h: number): void {
    const g = sp.graphics;
    g.drawRect(0, 0, w, h, "#3a2a1c", "#c9923e", 3);
    g.drawRect(4, 4, w - 8, (h - 8) * 0.42, "#4d3823");
  }

  /** 画一个圆形按钮底(用于地图切换箭头)。 */
  private paintCircleBtn(sp: any, d: number): void {
    sp.graphics.drawCircle(d / 2, d / 2, d / 2 - 1, "#5a3a1e", "#e0a94a", 3);
  }

  /** 存档导入/导出入口(单机存档备份,改造新增)。放底部,避免与其它元素重叠。 */
  private createSaveIO(): void {
    const mk = (text: string, x: number, onClick: () => void): void => {
      const box = new Laya.Sprite();
      box.pos(x, 1285);
      box.size(230, 56);
      box.mouseEnabled = true;
      this.paintPlaque(box, 230, 56);
      const lbl = new Laya.Label(text);
      lbl.fontSize = 26;
      lbl.color = "#f7de76";
      lbl.bold = true;
      (lbl as any).stroke = 3;
      (lbl as any).strokeColor = "#1a1008";
      lbl.width = 230;
      lbl.height = 56;
      lbl.align = "center";
      lbl.valign = "middle";
      box.addChild(lbl);
      box.on(Laya.Event.CLICK, this, onClick);
      this.addChild(box);
    };
    mk("导出存档", 40, () => this.doExportSave());
    mk("导入存档", 300, () => this.doImportSave());
  }

  private doExportSave(): void {
    try {
      const json = GameMgr.instance().player.exportSave();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "adou-save.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      TipMgr.instance().showTip("存档已导出");
    } catch {
      TipMgr.instance().showTip("导出失败");
    }
  }

  private doImportSave(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = (): void => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (): void => {
        const ok = GameMgr.instance().player.importSave(String(reader.result || ""));
        if (ok) {
          TipMgr.instance().showTip("导入成功，即将刷新…");
          window.setTimeout(() => location.reload(), 900);
        } else {
          TipMgr.instance().showTip("存档格式错误");
        }
      };
      reader.readAsText(f);
    };
    input.click();
  }

  onOpened(_t?: any): void {
    AnalyticsMgr.instance().Ty();
    this.OV();
    this.weaponBtn.visible = true;
    const s = GameMgr.instance().player;
    if (WeaponFragmentMgr.instance().Zb() && !s.weaponFree) {
      WeaponFragmentMgr.instance().tM();
      s.weaponFree = true;
    }
    $.instance().playMusic("bg_mainScene");
    if (!(GameMgr.instance().player.sidebarState !== 2 && PlatformMgr.instance().qy())) this.dySidebarBtn.visible = false;
    this.zV();
    this.jV();
    this.$V();
    this.NV();
    this.qV();
  }

  onClosed(): void {
    if (this.AV > 0) {
      EffectMgr.instance().removeEvent("btnSparkle", this.AV);
      this.AV = 0;
    }
    this.VV();
    this.QV();
    Laya.Tween.killAll(this.dySidebarBtnLight);
  }

  OV(): void {
    this.avatarImg.texture = null;
    AvatarMgr.instance().GG(this.avatarImg);
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
    this.goldTxt.text = GameMgr.instance().player.gold.toString();
  }

  aW(): void {
    // 去除体力限制:始终展示为无穷大,不再读取真实体力值。
    this.staminaTxt.text = "∞";
    this.staminaTxt.color = "#f7de76";
    this.staminaTxt.fontSize = 52;
    this.staminaTxt.width = 90;
    this.staminaTxt.align = "center";
  }

  X$(): void {
    Laya.Point.TEMP.x = this.talkHitArea.width / 4;
    Laya.Point.TEMP.y = this.talkHitArea.height / 3;
    this.talkHitArea.localToGlobal(Laya.Point.TEMP);
    EffectMgr.instance().showTalkBox(
      Laya.Point.TEMP.x,
      Laya.Point.TEMP.y,
      this.yV[MathE.range(0, this.yV.length, true)],
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
    this.KV = EffectMgr
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
    EffectMgr.instance().showTalkBox(
      Laya.Point.TEMP.x,
      Laya.Point.TEMP.y,
      this.EV[MathE.range(0, this.EV.length, true)],
      this.shopWalk,
      false,
    );
  }

  Re(): void {
    SceneMgr.instance().openScene("RankScene");
  }

  async startGame(): Promise<void> {
    if (!StaminaCtrl.instance().EH()) {
      TipMgr.instance().showTip("体力不足，无法开始游戏！");
      return Promise.reject("体力不足");
    }
    if (Date.now() - this.gV < this.fV) return;
    StaminaCtrl.instance().BH();
    this.gV = Date.now();
    await this.JV();
    LeaderboardMgr.instance().eH();
    BattlePropsMgr.instance().tS();
    SceneMgr.instance().openScene("MatchScene");
    Laya.Tween.killAll(this.shopWalk);
    this.shopWalk.visible = false;
    this.shopWalk.x = 320;
    EffectMgr.instance().removeEvent("imgLoop", this.KV);
    this.shopWalk.skin = "resources/img/mainUI/walk0.png";
  }

  YV(): void {
    SceneMgr.instance().openDialog("SidebarDialog");
  }

  UV(): void {
    const t = WeaponFragmentMgr.instance();
    if (t.Zb()) SceneMgr.instance().openScene("WeaponScene");
    else TipMgr.instance().showTip("第" + t.Jb() + "天解锁武器呦~");
  }

  CV(): void {
    SceneMgr.instance().openDialog("GetStaminaDialog");
  }

  RV(): void {
    SceneMgr.instance().openScene("AvatarSettingScene");
  }

  JV(): Promise<void> {
    return new Promise((resolve) => {
      const s = GameMgr.instance().stamina.an;
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
      EffectMgr.instance().explodeAndFlyReward(
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
    const t = GameMgr.instance().rank.currentRank;
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
    const t = GameMgr.instance().rank;
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
    const i = GameMgr.instance().rank.table.get(s);
    if (!i) throw new Error("段位配置不存在: " + s);
    const h = GameMgr.instance().rank.currentRank;
    h.id = i.id;
    h.rank = i.rank;
    h.reward = i.reward;
    const e = Math.max(1, i.level);
    h.level = Math.max(1, Math.min(h.level, e));
    GameMgr.instance().player.curStar = RankScoreMgr.instance().bG(h.id, h.level);
    LeaderboardMgr.instance().sH();
    this.zV();
    this.jV();
  }

  lQ(t: number): void {
    if (this.PV) return;
    const s = GameMgr.instance().rank.currentRank;
    const i = GameMgr.instance().rank.table.get(s.id);
    if (!i) throw new Error("段位配置不存在: " + s.id);
    const h = Math.max(1, i.level);
    s.level = Math.max(1, Math.min(t + 1, h));
    GameMgr.instance().player.curStar = RankScoreMgr.instance().bG(s.id, s.level);
    LeaderboardMgr.instance().sH();
    this.zV();
    this.jV();
  }

  jV(): void {
    if (!this.SV || !this.bV || this.MV.length === 0) return;
    const t = GameMgr.instance().rank.currentRank;
    const s = GameMgr.instance().rank.table.get(t.id);
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
      this.AV = EffectMgr.instance().registerBtnSparkle(this.dySidebarBtn, new so(["resources/img/mainUI/sidebar/star.png"]));
    }
  }
}
