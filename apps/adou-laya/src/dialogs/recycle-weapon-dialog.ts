// RecycleWeaponDialog — recycle low-rarity weapon fragments for gold (the
// bundle's `nr`, @regClass q5V7n3ojRiqC1NpUBDx5hQ).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30421-30637. Three rarity checkboxes (white/green/blue) toggle which unbound
// fragments to recycle; the projected gold animates (`ZW`/`NW`), and confirming
// removes the fragments and flies the gold in (`iz`). Opaque field / method names
// kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { WeaponFragmentMgr } from "../battle/weapon-fragment-mgr";
import { GameMgr } from "../core/game-mgr";
import { TipMgr } from "../core/tip-mgr";
import { SceneMgr } from "../core/scene-mgr";

const q = EffectMgr;
const eh = WeaponFragmentMgr;
const F = GameMgr;
const tt = TipMgr;
const K = SceneMgr;

const ir = 0;
const hr = 1;
const er = 2;
const ar: any = { [ir]: 1, [hr]: 2, [er]: 3 };

@regClass("q5V7n3ojRiqC1NpUBDx5hQ")
export class RecycleWeaponDialog extends Laya.Dialog {
  // .ls-bound nodes
  xBtn!: any;
  bg!: any;
  selectBg0!: any;
  selectBg1!: any;
  selectBg2!: any;
  getBtn!: any;
  goldNum!: any;
  goldTxt!: any;

  private FW = [false, false, false];
  private param: any = null;
  private OW = 0;
  private YW = 0;
  private XW = 0;

  onAwake(): void {
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    this.bg.on(Laya.Event.CLICK, this, this.Uu);
    q.instance().bindButtons([this.xBtn]);
    for (const t of [this.selectBg0, this.selectBg1, this.selectBg2]) {
      const s = t.getChildByName("yes");
      if (s) s.visible = false;
    }
    this.selectBg0.on(Laya.Event.CLICK, this, () => this.GW(0));
    this.selectBg1.on(Laya.Event.CLICK, this, () => this.GW(1));
    this.selectBg2.on(Laya.Event.CLICK, this, () => this.GW(2));
    this.getBtn.on(Laya.Event.CLICK, this, this.HW);
    q.instance().bindButtons([this.selectBg0, this.selectBg1, this.selectBg2, this.getBtn]);
  }

  onOpened(t: any): void {
    this.param = t ?? null;
    this.FW = [false, false, false];
    this.WW();
    this.zW();
    this.jW();
    this.goldNum.text = "0";
  }

  onClosed(_t?: any): void {
    this.jW();
  }

  $W(): any {
    const s = this.goldTxt?.parent;
    return s instanceof Laya.Image ? s : null;
  }

  zW(): void {
    this.goldTxt.text = String(F.instance().player.gold);
  }

  jW(): void {
    Laya.timer.clear(this, this.NW);
  }

  qW(): void {
    const t = this.QW().VW;
    this.ZW(t);
  }

  static KW(t: number): number {
    const s = Math.min(1, Math.max(0, t));
    return 1 - Math.pow(1 - s, 3);
  }

  ZW(t: number): void {
    this.jW();
    const s = Math.max(0, Math.round(Number(this.goldNum.text)) || 0);
    if (s !== t) {
      this.OW = s;
      this.YW = t;
      this.XW = Laya.timer.currTimer;
      Laya.timer.frameLoop(1, this, this.NW);
    } else this.goldNum.text = String(t);
  }

  NW(): void {
    const t = Laya.timer.currTimer - this.XW;
    const s = Math.min(1, t / 280);
    const i = RecycleWeaponDialog.KW(s);
    const h = Math.round(this.OW + (this.YW - this.OW) * i);
    this.goldNum.text = String(h);
    if (s >= 1) {
      this.jW();
      this.goldNum.text = String(this.YW);
    }
  }

  JW(): number[] {
    const t = [0, 0, 0];
    for (const s of eh.instance().Fb()) {
      if (s.Sb) continue;
      const i = s.rarity;
      if (i !== 0 && i !== 1 && i !== 2) continue;
      const h = i;
      if (s.isComplete) {
        const m = s.mb;
        if (m > 0) t[h] += m;
      } else {
        const fn = s.fragmentNum;
        if (fn > 0) t[h] += fn;
      }
    }
    return t;
  }

  GW(t: number): void {
    this.FW[t] = !this.FW[t];
    this.WW();
    this.qW();
  }

  WW(): void {
    const s = [this.selectBg0, this.selectBg1, this.selectBg2];
    const i = this.JW();
    for (let h = 0; h < 3; h++) {
      const e = s[h].getChildByName("yes");
      if (e) e.visible = this.FW[h];
      const a = s[h].getChildByName("num");
      if (a) {
        a.visible = this.FW[h];
        a.text = String(i[h] ?? 0);
      }
    }
  }

  QW(): { tz: number; VW: number; rows: any[] } {
    const s: any[] = [];
    let i = 0;
    let h = 0;
    for (const e of eh.instance().Fb()) {
      if (e.Sb) continue;
      const a = e.rarity;
      if (a !== 0 && a !== 1 && a !== 2) continue;
      const n = a;
      if (!this.FW[n]) continue;
      const r = ar[a] ?? 0;
      if (e.isComplete) {
        const m = e.mb;
        if (m <= 0) continue;
        i += m;
        h += m * r;
        s.push({ weaponId: e.weaponId, fragments: m, rarity: a });
      } else {
        const fn = e.fragmentNum;
        if (fn <= 0) continue;
        i += fn;
        h += fn * r;
        s.push({ weaponId: e.weaponId, fragments: fn, rarity: a });
      }
    }
    return { tz: i, VW: h, rows: s };
  }

  HW(): void {
    const i = this.QW();
    if (!i.rows.length || i.VW <= 0) return void tt.instance().showTip("请先勾选品级，或当前没有可回收碎片", 1800);
    const h = F.instance().player;
    for (const r of i.rows) h.setWeaponFragments(r.weaponId, -r.fragments);
    eh.instance().refresh();
    this.param?.sz?.call(this.param);
    this.qW();
    this.getBtn.mouseEnabled = false;
    this.iz(i.VW, () => {
      this.getBtn.mouseEnabled = true;
    });
  }

  iz(t: number, s: () => void): void {
    const i = F.instance().player;
    const h = this.$W();
    const e = h?.getChildByName("Image");
    const a = this.getBtn.localToGlobal(new Laya.Point(this.getBtn.width / 2, this.getBtn.height / 2));
    let n: any;
    let r: number;
    let o: number;
    this.globalToLocal(a);
    if (e) {
      n = e.localToGlobal(new Laya.Point(e.width / 2, e.height / 2));
      r = e.width;
      o = e.height;
    } else {
      if (!h) {
        i.gold = i.gold + t;
        this.zW();
        return void s();
      }
      n = h.localToGlobal(new Laya.Point(h.width / 2, h.height / 2));
      r = h.width;
      o = h.height;
    }
    this.globalToLocal(n);
    if (h) {
      h.scale(0, 0);
      Laya.Tween.create(h).to("scaleX", 1).to("scaleY", 1).duration(100);
    }
    const l = i.gold;
    const c = l + t;
    const u = t > 0 ? Math.floor(t / 8) : 0;
    const p = t > 0 ? t % 8 : 0;
    let yv = 0;
    let fv = 0;
    const g = () => {
      if (yv >= t) return;
      let cnt = u + (fv < p ? 1 : 0);
      cnt = Math.min(cnt, t - yv);
      yv += cnt;
      i.gold = Math.min(c, l + yv);
      this.goldTxt.text = String(i.gold);
      fv++;
    };
    if (t > 0)
      q.instance().explodeAndFlyReward(
        this,
        "resources/img/commonUI/gold.png",
        36,
        36,
        a,
        n,
        r,
        o,
        () => {
          i.gold = c;
          this.goldTxt.text = String(c);
          s();
        },
        g,
        undefined,
        1,
        1,
        60,
        8,
      );
    else s();
  }

  Uu(): void {
    K.instance().closeDialog("RecycleWeaponDialog");
  }
}
