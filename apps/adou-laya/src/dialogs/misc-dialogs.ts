// Small misc dialogs: ShareLpDialog (`pr`), SidebarDialog (`gr`), TipDialog (`mr`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30714-30817.
//   ShareLpDialog (mbG6BPycS4q-Lgejps0EJQ) — share to get a lucky pack.
//   SidebarDialog (irtwUqZURnaRTWyZp6g4tw) — Douyin sidebar reward flow.
//   TipDialog (CJKmj7QTRLij_2W9UGw0DQ) — the floating toast popup (TipMgr's view).
// Opaque field / method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { SceneMgr } from "../core/scene-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { TipMgr } from "../core/tip-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { AudioMgr } from "../core/audio-mgr";
import { LayerZ } from "../core/layer-z";

const K = SceneMgr;
const Mt = PlatformMgr;
const tt = TipMgr;
const q = EffectMgr;
const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const $ = AudioMgr;
const X = LayerZ;

@regClass("mbG6BPycS4q-Lgejps0EJQ")
export class ShareLpDialog extends Laya.Dialog {
  // .ls-bound nodes
  xBtn!: any;
  shareBtn!: any;
  lpImg!: any;

  onOpened(_t?: any): void {
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    this.shareBtn.on(Laya.Event.CLICK, this, this.gu);
    this.lpImg.on(Laya.Event.CLICK, this, this.gu);
  }

  gu(): void {
    Mt.instance().gu(
      () => {
        tt.instance().showTip("分享成功", 2000);
        this.Uu();
      },
      () => {},
    );
  }

  Uu(): void {
    K.instance().closeDialog("ShareLpDialog");
  }
}

@regClass("irtwUqZURnaRTWyZp6g4tw")
export class SidebarDialog extends Laya.Dialog {
  // .ls-bound nodes
  xBtn!: any;
  getBtn!: any;
  getTxt!: any;

  private sidebarState = 0;

  onAwake(): void {
    y.instance.on(u.Ls, this, this.updateState);
    q.instance().bindButtons([this.xBtn, this.getBtn]);
  }

  onOpened(_t?: any): void {
    this.sidebarState = F.instance().player.sidebarState;
    if (this.sidebarState === 0) this.getTxt.text = "进入侧边栏";
    else if (this.sidebarState === 1) this.getTxt.text = "领取奖励";
    else if (this.sidebarState === 2) this.getTxt.text = "已领取";
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    this.getBtn.on(Laya.Event.CLICK, this, this.lz);
  }

  lz(): void {
    if (this.sidebarState === 0) Mt.instance().du();
    else if (this.sidebarState === 1) {
      F.instance().player.gold += 100;
      F.instance().player.sidebarState = 2;
      this.sidebarState = 2;
      this.Uu();
    }
  }

  updateState(): void {
    F.instance().player.sidebarState = 1;
    this.sidebarState = 1;
    this.getTxt.text = "领取奖励";
  }

  Uu(): void {
    K.instance().closeDialog("SidebarDialog");
  }
}

@regClass("CJKmj7QTRLij_2W9UGw0DQ")
export class TipDialog extends Laya.Dialog {
  // .ls-bound nodes
  box!: any;
  tipTxt!: any;

  private Xu = 0.05;
  private Gu = 30;
  private Hu = 40;
  private Wu = 62;
  private cz = 0;
  popupEffect: any = null;
  private uz = "";
  private duration = 0;

  onEnable(): void {
    const t = K.instance().getDialogData("TipDialog");
    this.y = 0.3 * Laya.stage.height;
    this.uz = t[0].content;
    this.duration = t[0].time;
    Laya.Tween.killAll(this.box);
    this.box.y = this.cz;
    this.box.alpha = 1;
    this.pz();
    this.box.visible = true;
    this.zIndex = X.Zr;
  }

  pz(): void {
    this.tipTxt.wordWrap = true;
    this.tipTxt.text = this.uz;
    this.tipTxt.fontSize = this.Gu;
    if (this.tipTxt.textWidth > this.tipTxt.width)
      this.tipTxt.fontSize = ((this.Gu * this.tipTxt.width) / this.tipTxt.textWidth) | 0;
    const t = Math.max(this.Wu, this.tipTxt.textHeight + this.Hu);
    this.box.height = t;
    this.tipTxt.height = t;
  }

  onOpened(_t?: any): void {
    $.instance().playSound("popup_notification");
    const s = this.box.y - this.Xu * this.duration;
    Laya.Tween.to(
      this.box,
      { y: s, alpha: 0.3 },
      this.duration,
      null,
      Laya.Handler.create(this, () => {
        this.box.visible = false;
        this.close();
      }),
    );
  }
}
