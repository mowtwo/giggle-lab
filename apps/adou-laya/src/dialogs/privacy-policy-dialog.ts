// PrivacyPolicyDialog — agreement viewer with privacy/user/age sub-views (the
// bundle's `Qn`, @regClass dw3oSzA5R1aHXjnmpzT31A).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30263-30357. Driven entirely by its open param (texts + callbacks): shows the
// main agreement with accept/reject, or a single detail view (privacy/user/age)
// in view-only mode. Opaque field / method names kept verbatim; node refs bound
// from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { SceneMgr } from "../core/scene-mgr";
import { EffectMgr } from "../battle/effect-mgr";

const K = SceneMgr;
const q = EffectMgr;

@regClass("dw3oSzA5R1aHXjnmpzT31A")
export class PrivacyPolicyDialog extends Laya.Dialog {
  // .ls-bound nodes
  privacyBtn!: any;
  userBtn!: any;
  yesBtn!: any;
  noBtn!: any;
  returnBtn!: any;
  panel!: any;
  content!: any;
  viewTxt!: any;

  private param: any = null;
  private _W = "main";

  onAwake(): void {
    this.privacyBtn.on(Laya.Event.CLICK, this, this.xW);
    this.userBtn.on(Laya.Event.CLICK, this, this.SW);
    this.yesBtn.on(Laya.Event.CLICK, this, this.bW);
    this.noBtn.on(Laya.Event.CLICK, this, this.MW);
    this.returnBtn.on(Laya.Event.CLICK, this, this.PW);
    this.panel.scrollType = Laya.ScrollType.Vertical;
    this.panel.vScrollBarSkin = "";
    this.panel.elasticEnabled = true;
    this.content.wordWrap = true;
    this.content.mouseEnabled = false;
    this.content.color = "#333333";
    this.returnBtn.visible = false;
  }

  AW(t: string): void {
    this.content.text = t;
    Laya.timer.callLater(this, this.EW);
  }

  EW(): void {
    const t = this.panel.height;
    const s = this.panel.width;
    this.content.width = s;
    const i = this.content.textHeight;
    this.content.height = Math.max(i, 1);
    const h = i > t;
    const e = this.panel.vScrollBar;
    if (e) {
      e.visible = h;
      e.value = 0;
    }
    this.panel.refresh();
    this.panel.scrollTo(0, 0);
  }

  onEnable(): void {
    this.param = K.instance().getDialogData("PrivacyPolicyDialog");
    if (!this.param) throw new Error("PrivacyPolicyDialog: 缺少打开参数");
    const t = [this.returnBtn];
    if (!this.param.viewOnly) t.push(this.privacyBtn, this.userBtn, this.yesBtn, this.noBtn);
    q.instance().bindButtons(t);
    if (this.param.initialDetail) this.BW(this.IW(this.param.initialDetail));
    else this.DW();
  }

  onDisable(): void {
    if (this.param) this.param.onClosed();
  }

  DW(): void {
    this._W = "main";
    this.AW(this.param.mainText);
    this.viewTxt.visible = this.param.showPrivacyLinks;
    this.privacyBtn.visible = this.param.showPrivacyLinks;
    this.userBtn.visible = this.param.showPrivacyLinks;
    const t = !this.param.viewOnly;
    this.yesBtn.visible = t;
    this.noBtn.visible = t;
    this.returnBtn.visible = false;
  }

  BW(t: string): void {
    this._W = t;
    if (t === "privacy") this.AW(this.param.privacyText);
    else if (t === "user") this.AW(this.param.userText);
    else this.AW(this.param.ageText);
    this.viewTxt.visible = false;
    this.privacyBtn.visible = false;
    this.userBtn.visible = false;
    this.yesBtn.visible = false;
    this.noBtn.visible = false;
    this.returnBtn.visible = true;
  }

  xW(): void {
    this.BW("privacy");
  }

  SW(): void {
    this.BW("user");
  }

  PW(): void {
    if (this.param.viewOnly) K.instance().closeDialog("PrivacyPolicyDialog");
    else this.DW();
  }

  bW(): void {
    this.param.onAccepted();
  }

  MW(): void {
    this.param.onRejected();
  }

  IW(t: string): string {
    return t === "privacy" ? "privacy" : t === "user" ? "user" : "age";
  }
}
