// GetStaminaDialog — watch-ad / share to refill stamina (the bundle's `Gn`,
// @regClass Jalv-8i7TNKXVIuvZLMTWA).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~29812-29943. Drives the ad button (gated by daily cap) and share button
// (gated by cooldown, with a live timer) through StaminaCtrl, flies stamina icons
// in on success (`eW`), and animates the Spine "player" by current stamina tier
// (`iW`). Opaque field / method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { StaminaCtrl } from "../battle/stamina-ctrl";
import { GameMgr } from "../core/game-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { SceneMgr } from "../core/scene-mgr";


@regClass("Jalv-8i7TNKXVIuvZLMTWA")
export class GetStaminaDialog extends Laya.Dialog {
  // .ls-bound nodes
  adBtn!: any;
  shareBtn!: any;
  xBtn!: any;
  bg!: any;
  player!: any;
  curStaminaNum!: any;
  stamina!: any;
  stateTxt!: any;
  shareTimerTxt!: any;

  private QH = 0;
  private ZH = 0;
  private JH!: any;

  onAwake(): void {
    this.adBtn.on(Laya.Event.CLICK, this, this.KH, ["ad"]);
    this.shareBtn.on(Laya.Event.CLICK, this, this.KH, ["share"]);
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    this.bg.on(Laya.Event.CLICK, this, this.Uu);
    this.JH = this.player.getComponent(Laya.Spine2DRenderNode);
    EffectMgr.instance().bindButtons([this.adBtn, this.shareBtn, this.xBtn]);
    UpdateMgr.instance().register("GetStaminaDialog", this, this.update);
  }

  onEnable(): void {
    this.QH = StaminaCtrl.instance().TH() ? 0 : StaminaCtrl.instance().RH();
    if (this.QH > 0) this.tW(true);
    else this.tW(false);
    this.adBtn.gray = !StaminaCtrl.instance().IH();
    this.sW();
    this.curStaminaNum.text = GameMgr.instance().player.stamina.toString();
    this.iW();
  }

  onOpened(_t?: any): void {}

  update(): void {
    if (this.QH <= 0 || Date.now() - this.ZH < 1000) return;
    this.QH = StaminaCtrl.instance().RH();
    if (this.QH === 0) this.tW(false);
    this.hW();
    this.ZH = Date.now();
  }

  KH(t: string): void {
    console.log("getStamina", t === "ad" ? "看视频" : "分享");
    if (t === "ad")
      StaminaCtrl.instance().DH(() => {
        this.adBtn.gray = true;
        this.eW(this.adBtn, GameMgr.instance().stamina.nn);
      });
    else if (t === "share")
      StaminaCtrl.instance().CH(() => {
        this.QH = StaminaCtrl.instance().RH();
        this.ZH = Date.now();
        this.tW(true);
        this.eW(this.shareBtn, GameMgr.instance().stamina.ln);
      });
  }

  aW(): void {
    this.curStaminaNum.text = GameMgr.instance().player.stamina.toString();
    this.iW();
  }

  iW(): void {
    if (GameMgr.instance().player.stamina > 10) {
      this.JH.play("2", true);
      this.player.pos(370, 315);
      this.stateTxt.text = "体力充沛";
      this.stateTxt.color = "#ffa736";
      this.stateTxt.italic = false;
    } else if (GameMgr.instance().player.stamina > 5 && GameMgr.instance().player.stamina <= 10) {
      this.JH.play("1", true);
      this.JH.useFastRender = false;
      this.player.pos(310, 345);
      this.stateTxt.text = "体力不足";
      this.stateTxt.color = "#2797d6";
      this.stateTxt.italic = true;
    } else {
      this.JH.play("1", true);
      this.JH.useFastRender = true;
      this.player.pos(310, 345);
      this.stateTxt.text = "体力不足";
      this.stateTxt.color = "#e95b55";
      this.stateTxt.italic = true;
    }
  }

  eW(t: any, s: number): void {
    Laya.Point.TEMP.x = t.width / 2;
    Laya.Point.TEMP.y = t.height / 2;
    t.localToGlobal(Laya.Point.TEMP);
    this.stamina.globalToLocal(Laya.Point.TEMP);
    let i = GameMgr.instance().player.stamina - s;
    EffectMgr.instance().explodeAndFlyReward(
      this.stamina,
      "resources/img/mainUI/stamina/stamina.png",
      this.stamina.width,
      this.stamina.height,
      new Laya.Point(Laya.Point.TEMP.x, Laya.Point.TEMP.y),
      new Laya.Point(this.stamina.width / 2, this.stamina.height / 2),
      this.stamina.width,
      this.stamina.height,
      () => {
        this.iW();
      },
      () => {
        i++;
        this.curStaminaNum.text = Math.min(i, GameMgr.instance().stamina.hn).toString();
      },
      null,
      1,
      0.7,
      30,
      s,
    );
  }

  sW(): void {
    if (!PlatformMgr.instance().canShare()) {
      const adImg1 = this.adBtn.getChildByName("adImg1");
      const newSkin = adImg1 ? adImg1.skin : "resources/img/mainUI/stamina/adImg.png";
      const h = this.shareBtn.getChildByName("adImg1");
      if (h) h.skin = newSkin;
      if (this.adBtn.skin) this.shareBtn.skin = this.adBtn.skin;
    }
  }

  tW(t: boolean): void {
    this.shareBtn.gray = t;
    this.shareTimerTxt.visible = t;
    if (t) this.hW();
  }

  hW(): void {
    this.shareTimerTxt.text = Math.floor(this.QH / 60) + ":" + (this.QH % 60).toString().padStart(2, "0");
  }

  Uu(): void {
    UpdateMgr.instance().unregister("GetStaminaDialog");
    SceneMgr.instance().closeDialog("GetStaminaDialog");
  }
}
