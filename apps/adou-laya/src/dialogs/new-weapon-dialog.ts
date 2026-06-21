// NewWeaponDialog — celebrates newly obtained weapons (the bundle's `zn`,
// @regClass J_UH_VTZTxqrZGBtVTiZww).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~29947-30128. Lays out the new-weapon chips in a paged box (`initPanel`/`pW`),
// pulses the title/bg lights, and emits a continuous star burst from the panel
// edges (`starEff`). On claim it reports each chip's screen position back through
// the open param's `LW` callback (so the bag scene can fly them into slots).
// Opaque field / method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { PrefabPool } from "../battle/prefab-pool";
import { GameMgr } from "../core/game-mgr";
import { PrefabFactory } from "../battle/prefab-factory";
import { SceneMgr } from "../core/scene-mgr";
import { MathE } from "../core/math-e";

const q = EffectMgr;
const H = PrefabPool;
const F = GameMgr;
const z = PrefabFactory;
const K = SceneMgr;
const f = MathE;

@regClass("J_UH_VTZTxqrZGBtVTiZww")
export class NewWeaponDialog extends Laya.Dialog {
  // .ls-bound nodes
  getBtn!: any;
  weaponPanel!: any;
  titleLight!: any;
  bgLight1!: any;
  starBox!: any;

  static dW = 59;
  static gW = [96, 115, 141, 169];

  private nW: any[] = [];
  private rW: any[] = [];

  onAwake(): void {
    this.getBtn.on(Laya.Event.CLICK, this, this.oW);
    q.instance().bindButtons([this.getBtn]);
  }

  onOpened(t: any): void {
    const s = t && t.list ? t.list : [];
    this.nW = s.slice();
    this.initPanel(this.nW);
    this.lW();
    this.cW();
    this.uW();
    this.starEff();
  }

  initPanel(t: any[]): void {
    this.weaponPanel.removeChildren();
    this.rW.length = 0;
    const s = 16;
    const i = Math.max(1, this.weaponPanel.width - 32);
    const h = new Laya.Box();
    h.width = this.weaponPanel.width;
    this.weaponPanel.addChild(h);
    let e = s;
    let a = s;
    let n = 0;
    let r = s;
    t.forEach((item) => {
      const o = this.pW(item);
      const l = o.width;
      const c = o.height;
      if (e > s && e - s + l > i) {
        e = s;
        a += n + 16;
        n = 0;
      }
      h.addChild(o);
      o.pos(e + l / 2, a + c / 2);
      this.rW.push(o);
      e += l + 16;
      n = Math.max(n, c);
      r = Math.max(r, a + c);
    });
    const o = r + s;
    h.height = o;
    if (o > this.weaponPanel.height) this.weaponPanel.vScrollBar.visible = true;
    else this.weaponPanel.vScrollBar.visible = false;
    this.weaponPanel.vScrollBar.value = 0;
  }

  yW(t: number): number {
    return t <= 2 ? 1 : t === 3 ? 2 : t === 4 ? 3 : 4;
  }

  fW(t: any, s: boolean): { skin: string; width: number; height: number } {
    const h = this.yW(t.length);
    return {
      skin: `resources/img/weaponBag/${s ? "weaponBg1" : "weaponBg2"}_${h}.png`,
      width: NewWeaponDialog.gW[h - 1] ?? 169,
      height: NewWeaponDialog.dW,
    };
  }

  pW(t: any): any {
    const h = H.instance().so("weaponSceneWeaponItem").create();
    const e = this.fW(t.name, true);
    const a = e.width;
    const n = e.height;
    h.size(a, n);
    const r = h.getChildByName("bg");
    if (r) {
      r.skin = e.skin;
      r.size(a, n);
    }
    const o = h.getChildByName("name");
    const l = h.getChildByName("countBg");
    const c = l?.getChildByName("countTxt");
    const wd = F.instance().weaponData.getWeapon(t.weaponId);
    const p = wd?.rarity ?? 0;
    const yColor = F.instance().weaponData.rarityStrokeColors[p] ?? "#000000";
    if (o) {
      o.anchorX = o.anchorY = 0.5;
      o.x = a / 2;
      o.y = n / 2;
      o.width = a;
      o.height = n;
      o.text = t.name;
      o.color = yColor;
    }
    const ff = h.getChildByName("stateTxt");
    if (ff) ff.visible = false;
    if (l && c) {
      l.visible = true;
      l.x = Math.max(0, a - 26);
      c.text = String(t.count);
      c.visible = true;
      c.color = "#000000";
    }
    const g = h.getChildByName("newTxt");
    if (g) {
      g.visible = false;
      g.x = Math.max(0, a / 2 - 25);
    }
    return h;
  }

  lW(): void {
    this.titleLight.alpha = 1;
    Laya.Tween.create(this.titleLight).to("alpha", 0.7).duration(1000).repeat(-1, true);
  }

  cW(): void {
    Laya.Tween.create(this.bgLight1).to("alpha", 0.5).duration(1000).repeat(-1, true);
  }

  uW(): void {}

  starEff(): void {
    Laya.timer.loop(f.range(200, 500), this, () => {
      const t = z.instance().getItem("starFly", this);
      const s = this.starBox.width;
      const i = this.starBox.height;
      const h = s / 2;
      const e = i / 2;
      const a = f.range(0, 4, true);
      let n: number;
      let r: number;
      if (a === 0) {
        n = f.range(0, s);
        r = 0;
      } else if (a === 1) {
        n = s;
        r = f.range(0, i);
      } else if (a === 2) {
        n = f.range(0, s);
        r = i;
      } else {
        n = 0;
        r = f.range(0, i);
      }
      const o = n - h;
      const l = r - e;
      const c = Math.sqrt(o * o + l * l) || 1;
      const uu = f.range(350, 400);
      const p = n + (o / c) * uu;
      const yv = r + (l / c) * uu;
      const g = n + (o / c) * uu * 0.6;
      const d = r + (l / c) * uu * 0.6;
      t.skin =
        Math.random() < 0.5 ? "resources/img/shop/lottery/yellowStar.png" : "resources/img/weaponBag/cLight3.png";
      t.alpha = 1;
      t.anchorX = t.anchorY = 0.5;
      const L = f.range(30, 60);
      t.size(L, L);
      t.pos(n, r);
      t.rotation = f.range(0, 360);
      this.starBox.addChild(t);
      const m = t.rotation + f.range(60, 110);
      const w = m + f.range(30, 60);
      Laya.Tween.create(t)
        .to("x", g)
        .to("y", d)
        .to("rotation", m)
        .duration(1200)
        .chain()
        .to("x", p)
        .to("y", yv)
        .to("alpha", 0)
        .to("rotation", w)
        .duration(800)
        .then(() => {
          t.removeSelf();
          z.instance().recover("starFly", t);
        });
    });
  }

  oW(): void {
    const t = (K.instance().getDialogData("NewWeaponDialog") || {}).LW;
    if (t) {
      t(
        this.nW.map((item, s) => {
          const i = this.rW[s];
          const h = i
            ? i.localToGlobal(new Laya.Point(0, 0))
            : new Laya.Point(Laya.stage.width / 2, Laya.stage.height / 2);
          return { weaponId: item.weaponId, count: item.count, j_: h.x, N_: h.y };
        }),
      );
    }
    this.Uu();
  }

  Uu(): void {
    Laya.Tween.killAll(this.titleLight);
    K.instance().closeDialog("NewWeaponDialog");
  }
}
