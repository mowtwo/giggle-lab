// WeaponIntroDialog — weapon detail popup (the bundle's `br`, @regClass
// HbyZPlGGQuCLkT5uT4N45g).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~31206-31227. Reads the weapon id from its dialog data and shows the weapon's
// name (rarity-coloured), intro text, attack power, and a rarity-marker position.
// Opaque field / method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { SceneMgr } from "../core/scene-mgr";
import { GameMgr } from "../core/game-mgr";


@regClass("HbyZPlGGQuCLkT5uT4N45g")
export class WeaponIntroDialog extends Laya.Dialog {
  // .ls-bound nodes
  xBtn!: any;
  bg!: any;
  weaponName!: any;
  weaponIntroTxt!: any;
  attTxt!: any;
  rarityList!: any;
  rarityIndex!: any;

  onAwake(): void {
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    this.bg.on(Laya.Event.CLICK, this, this.Uu);
  }

  onEnable(): void {
    const t = SceneMgr.instance().getDialogData("WeaponIntroDialog");
    const s = GameMgr.instance().weaponData.getWeapon(t.weaponId);
    const i = s.intro;
    this.weaponName.text = s.txt;
    this.weaponName.color = GameMgr.instance().weaponData.rarityStrokeColors[s.rarity];
    this.weaponIntroTxt.text = i;
    this.attTxt.text = s.addAttPower.toString();
    this.attTxt.color = GameMgr.instance().weaponData.rarityStrokeColors[s.rarity];
    const h = (this.rarityList.width - 10) / 5;
    this.rarityIndex.x = (s.rarity + 0.5) * h + 5;
  }

  Uu(): void {
    SceneMgr.instance().closeDialog("WeaponIntroDialog");
  }
}
