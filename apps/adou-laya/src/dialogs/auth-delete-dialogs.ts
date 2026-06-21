// AuthorizeDialog (`Et`) + DeletePropsTipDialog (`Ja`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~8414-8432 and ~25303-25324.
//   AuthorizeDialog (3eZSn-DMTuy8MOPQB13plA) — platform login/authorize prompt.
//   DeletePropsTipDialog (2xXyn9S9TgW7FJIlQLz9sA) — confirm removing an owned prop.
// Opaque field / method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { GameMgr } from "../core/game-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";

const q = EffectMgr;
const Mt = PlatformMgr;
const K = SceneMgr;
const F = GameMgr;
const Zi = BattlePropsMgr;
const y = EventMgr;
const u = GameEvent;

@regClass("3eZSn-DMTuy8MOPQB13plA")
export class AuthorizeDialog extends Laya.Dialog {
  // .ls-bound nodes
  okBtn!: any;
  xBtn!: any;

  onAwake(): void {
    this.okBtn.on(Laya.Event.CLICK, this, this.Qy);
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    q.instance().bindButtons([this.okBtn, this.xBtn]);
  }

  onOpened(_t?: any): void {
    Mt.instance().mu();
  }

  Qy(): void {
    Mt.instance().Vy();
  }

  Uu(): void {
    Mt.instance().wu();
    K.instance().closeDialog("AuthorizeDialog");
  }
}

@regClass("2xXyn9S9TgW7FJIlQLz9sA")
export class DeletePropsTipDialog extends Laya.Dialog {
  // .ls-bound nodes
  confirmBtn!: any;
  cancelBtn!: any;
  tipTxt!: any;

  private sS = 0;

  onAwake(): void {
    this.confirmBtn.on(Laya.Event.CLICK, this, this.BU);
    this.cancelBtn.on(Laya.Event.CLICK, this, this.Uu);
  }

  onEnable(): void {
    const t = K.instance().getDialogData("DeletePropsTipDialog");
    this.sS = t;
    this.tipTxt.text = "您确定要删除" + F.instance().props.Ue[t].txt + "道具吗";
  }

  onOpened(_t?: any): void {}

  BU(): void {
    this.Uu();
    Zi.instance().sS(this.sS);
    y.instance.event(u.Kt, this.sS);
  }

  Uu(): void {
    K.instance().closeDialog("DeletePropsTipDialog");
  }
}
