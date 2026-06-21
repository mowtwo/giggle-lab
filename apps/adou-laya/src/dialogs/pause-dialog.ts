// PauseDialog — in-battle pause with quit + weapon-reward preview (the bundle's
// `Nn`, @regClass XxMayroKT9Kz-_jp3ylB1w).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30132-30262. Quitting ends the battle as a loss (`Cn.gameOver`); the two
// reward panels (`vW`) lay out the player's and AI's earned weapon fragments as
// rarity-sorted pooled chips with a scrollbar. Opaque field / method names kept
// verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { LayerZ } from "../core/layer-z";
import { EffectMgr } from "../battle/effect-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { GameController } from "../battle/game-controller";
import { GameMgr } from "../core/game-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { PrefabFactory } from "../battle/prefab-factory";

const X = LayerZ;
const q = EffectMgr;
const j = UpdateMgr;
const Cn = GameController;
const F = GameMgr;
const K = SceneMgr;
const z = PrefabFactory;

@regClass("XxMayroKT9Kz-_jp3ylB1w")
export class PauseDialog extends Laya.Dialog {
  // .ls-bound nodes
  yesBtn!: any;
  noBtn!: any;
  bg!: any;
  rewardPanel!: any;
  nullTxt!: any;
  rewardBg!: any;
  title!: any;
  rewardPanelAI!: any;
  nullTxtAI!: any;
  rewardBgAI!: any;
  enemyRewardTitle!: any;

  onAwake(): void {
    this.zIndex = X.Zr;
    this.yesBtn.on(Laya.Event.CLICK, this, this.pause);
    this.noBtn.on(Laya.Event.CLICK, this, this.cancel);
    this.bg.on(Laya.Event.CLICK, this, this.cancel);
    q.instance().bindButtons([this.yesBtn, this.noBtn]);
  }

  onOpened(_t?: any): void {
    j.instance().pause(false);
    this.mW();
  }

  onClosed(): void {
    this.wW();
  }

  pause(): void {
    Cn.instance().gameOver(false, true, F.instance().battleState.oi < 5);
    j.instance().resume();
    this.wW();
  }

  cancel(): void {
    K.instance().closeDialog("PauseDialog");
    j.instance().resume();
    this.wW();
  }

  mW(): void {
    this.vW(F.instance().battleState.zi, this.rewardPanel, this.nullTxt, this.rewardBg, this.title);
    this.vW(F.instance().battleState.ji, this.rewardPanelAI, this.nullTxtAI, this.rewardBgAI, this.enemyRewardTitle);
  }

  vW(t: any[], s: any, i: any, h: any, e: any): void {
    h.visible = true;
    e.visible = true;
    if (t.length === 0) return void (i.visible = true);
    i.visible = false;
    const n: number[] = [];
    for (let k = 0; k < t.length; k++) {
      const item = t[k];
      const cnt = Math.max(0, item.fragmentNum || 0);
      for (let c = 0; c < cnt; c++) n.push(item.weaponId);
    }
    n.sort((a, b) => {
      const wa = F.instance().weaponData.weapons.get(a);
      const wb = F.instance().weaponData.weapons.get(b);
      const ra = wa ? wa.rarity : -1;
      const rb = wb ? wb.rarity : -1;
      return rb !== ra ? rb - ra : a - b;
    });
    if (n.length === 0) return void (i.visible = true);
    const r = 10;
    const o = Math.max(1, s.width - 20);
    const l = new Laya.Box();
    l.width = s.width;
    l.height = s.height;
    s.addChild(l);
    s.vScrollBarSkin = "";
    let c = r;
    let u = r;
    let p = 0;
    let yv = r;
    for (let k = 0; k < n.length; k++) {
      const id = n[k];
      const wd = F.instance().weaponData.weapons.get(id);
      const h2 = wd.rarity;
      const e2 = z.instance().getItem("weaponFragment", this);
      const ff = e2.getChildByName("bg");
      const g = e2.getChildByName("name");
      ff.skin = "resources/img/weaponBag/rarity" + h2 + ".png";
      g.text = wd.txt;
      g.color = F.instance().weaponData.rarityColors[h2] ?? "#ffffff";
      const d = Math.max(g.textWidth || 0, g.text.length * (g.fontSize || 32));
      const L = Math.max(100, d + 36);
      const m = ff.height;
      ff.width = L;
      g.width = L;
      g.height = m;
      e2.width = L;
      e2.height = m;
      e2.pivotX = L / 2;
      e2.pivotY = m / 2;
      g.pos(0, 0);
      if (c > r && c - r + e2.width > o) {
        c = r;
        u += p + 20;
        p = 0;
      }
      l.addChild(e2);
      e2.pos(c + e2.width / 2, u + e2.height / 2);
      c += e2.width + 20;
      p = Math.max(p, e2.height);
      yv = Math.max(yv, u + e2.height);
    }
    const ff2 = yv + r;
    l.height = ff2;
    if (ff2 > s.height) s.vScrollBar.visible = true;
    else s.vScrollBar.visible = false;
  }

  wW(): void {
    this.kW(this.rewardPanel);
    this.kW(this.rewardPanelAI);
    this.nullTxt.visible = true;
    this.nullTxtAI.visible = true;
  }

  kW(t: any): void {
    for (let s = t.numChildren - 1; s >= 0; s--) {
      const i = t.getChildAt(s);
      if (i instanceof Laya.Box) {
        for (let k = i.numChildren - 1; k >= 0; k--) {
          const c = i.getChildAt(k);
          c.removeSelf();
          z.instance().recover("weaponFragment", c);
        }
        i.removeSelf();
      }
    }
    t.vScrollBar.value = 0;
    t.vScrollBar.visible = false;
  }
}
