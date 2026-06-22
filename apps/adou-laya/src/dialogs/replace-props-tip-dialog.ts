// ReplacePropsTipDialog — choose which owned prop to replace (the bundle's `lr`,
// @regClass z_0pDWBpS5eRL3Ag4IUahQ).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30641-30710. Shows the incoming prop + the side's current props; picking one
// and confirming removes it and adds the new prop. Opaque field / method names
// kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { GameMgr } from "../core/game-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";

const u = GameEvent;

@regClass("z_0pDWBpS5eRL3Ag4IUahQ")
export class ReplacePropsTipDialog extends Laya.Dialog {
  // .ls-bound nodes
  replaceBtn!: any;
  giveUpBtn!: any;
  oldPropsBox!: any;
  newPropsItem!: any;
  newPropsImg!: any;
  newIntro!: any;
  oldIntro!: any;

  private ez = 0;
  private oz = 0;

  onAwake(): void {
    this.replaceBtn.on(Laya.Event.CLICK, this, this.hz);
    this.giveUpBtn.on(Laya.Event.CLICK, this, this.Uu);
    const t = [this.replaceBtn, this.giveUpBtn];
    for (let s = 0; s < this.oldPropsBox.numChildren; s++) t.push(this.oldPropsBox.getChildAt(s));
    EffectMgr.instance().bindButtons(t);
  }

  onEnable(): void {
    const t = SceneMgr.instance().getDialogData("ReplacePropsTipDialog");
    this.ez = t;
    this.az();
    this.nz();
  }

  onOpened(_t?: any): void {}

  az(): void {
    this.newPropsItem.skin =
      "resources/img/shop/itemBg" +
      (BattlePropsMgr.instance().Yx(this.ez) ? "0" : "1") +
      "_" +
      GameMgr.instance().props.Ue[this.ez].rarity +
      ".png";
    this.newPropsImg.skin = "resources/img/props/" + GameMgr.instance().props.Ue[this.ez].name + "_1.png";
    this.newIntro.text = GameMgr.instance().props.Ue[this.ez].intro;
  }

  nz(): void {
    const t = BattlePropsMgr.instance().Yx(this.ez);
    const s = t ? BattlePropsMgr.instance().xx : BattlePropsMgr.instance().Sx;
    this.rz(s[0]);
    for (let k = 0; k < 6; k++)
      if (k < s.length) {
        this.oldPropsBox.getChildAt(k).visible = true;
        const i = this.oldPropsBox.getChildAt(k);
        i.skin =
          "resources/img/shop/itemBg" +
          (BattlePropsMgr.instance().Yx(s[k]) ? "0" : "1") +
          "_" +
          GameMgr.instance().props.Ue[s[k]].rarity +
          ".png";
        i.getChildByName("img").skin = "resources/img/props/" + GameMgr.instance().props.Ue[s[k]].name + "_1.png";
        const h = (this.oldPropsBox.width - i.width * s.length - 5 * (s.length - 1)) / 2;
        i.x = h + i.width * k + 5 * k + i.width / 2;
        i.on(Laya.Event.CLICK, this, () => {
          this.oz = s[k];
          this.rz(s[k]);
        });
      } else this.oldPropsBox.getChildAt(k).visible = false;
  }

  rz(t: number): void {
    this.oz = t;
    this.oldIntro.text = GameMgr.instance().props.Ue[t].intro;
  }

  hz(): void {
    BattlePropsMgr.instance().sS(this.oz);
    BattlePropsMgr.instance().addProps(this.ez);
    BattlePropsMgr.instance().Kn(this.oz);
    EventMgr.instance.event(u.Kt, this.ez);
    this.Uu();
  }

  Uu(): void {
    BattlePropsMgr.instance().Kn(this.ez);
    SceneMgr.instance().closeDialog("ReplacePropsTipDialog");
  }
}
