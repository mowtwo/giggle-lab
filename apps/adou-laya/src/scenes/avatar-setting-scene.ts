// AvatarSettingScene — the avatar-picker carousel (the bundle's `Fr`, @regClass
// B_zOi-00Tk29O7ykm753NA).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~31338-31644. Builds a horizontally-draggable strip of avatar cells (`hj`,
// locked ones greyed + lock icon + unlock-hint), snaps the nearest to centre
// (`aj`/`mj`), scales the selected up and slides a white highlight under it
// (`wj`), and confirms via AvatarMgr.OG if unlocked. The open/close scroll-banner
// reveal is `oj`. Opaque field / method names kept verbatim; node refs bound from
// the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { AvatarMgr } from "../battle/avatar-mgr";
import { AudioMgr } from "../core/audio-mgr";

const $ = AudioMgr;

@regClass("B_zOi-00Tk29O7ykm753NA")
export class AvatarSettingScene extends Laya.Scene {
  // .ls-bound nodes
  closeBtn!: any;
  confirmBtn!: any;
  bg!: any;
  scroll1!: any;
  scroll2!: any;
  scroll3!: any;
  scroll3Mask!: any;
  avatarPanel!: any;
  whiteBk!: any;
  avatarBox!: any;

  private Gz: any[] = [];
  private Wz = 20;
  private zz = 80;
  private jz = 100;
  private $z = 80;
  private Nz = 0;
  private MX = false;
  private qz = false;
  private Vz = 0;
  private selectedIndex = 0;
  private Qz = 0;
  private Zz = false;
  private Kz = 0;
  private Jz = 0;
  private tj = 0;
  private sj = 0;
  private ij = 0;
  private ej!: any;

  onAwake(): void {
    EffectMgr.instance().bindButtons([this.closeBtn, this.confirmBtn]);
    this.closeBtn.on(Laya.Event.CLICK, this, () => {
      if (!this.Zz) SceneMgr.instance().closeScene("AvatarSettingScene");
    });
    this.confirmBtn.on(Laya.Event.CLICK, this, () => {
      if (!this.Zz && AvatarMgr.instance().isAvatarUnlocked(this.ij)) {
        AvatarMgr.instance().OG(this.ij);
        SceneMgr.instance().closeScene("AvatarSettingScene");
      }
    });
    this.bg.on(Laya.Event.CLICK, this, () => {
      if (!this.Zz) SceneMgr.instance().closeScene("AvatarSettingScene");
    });
    this.hj();
    this.scroll3.mask = this.scroll3Mask;
    this.Kz = this.scroll3Mask.width;
    this.Jz = this.scroll3Mask.x;
    this.tj = this.scroll1.x;
    this.sj = this.scroll2.x;
  }

  onOpened(_t?: any): void {
    const s = AvatarMgr.instance();
    this.ij = s.PG;
    const i = s.BG.indexOf(this.ij);
    this.selectedIndex = i >= 0 ? i : 0;
    this.Nz = this.avatarPanel.width / 2;
    this.Qz = this.Nz;
    const h = 16 * (this.zz + this.Wz);
    this.ej.width = 2 * this.Qz + h;
    this.Gz.forEach((t, s2) => {
      t.box.x = this.Qz + s2 * (this.zz + this.Wz);
    });
    this.whiteBk.visible = false;
    this.aj(this.selectedIndex, false);
    this.nj();
    this.rj();
    this.oj(() => this.lj());
  }

  onClosed(_t?: any): void {
    this.rj();
    this.MX = false;
    this.Vz = 0;
    this.Zz = false;
    this.cj();
  }

  oj(t: () => void): void {
    this.Zz = true;
    this.avatarPanel.mouseEnabled = false;
    this.closeBtn.mouseEnabled = false;
    this.confirmBtn.mouseEnabled = false;
    this.bg.mouseEnabled = false;
    const s = 0.5 * (this.tj + this.sj);
    this.scroll1.x = s;
    this.scroll2.x = s;
    this.scroll3Mask.width = 0;
    this.scroll3Mask.x = this.Jz + 0.5 * this.Kz;
    Laya.Tween.clearAll(this.scroll1);
    Laya.Tween.clearAll(this.scroll2);
    Laya.Tween.clearAll(this.scroll3Mask);
    let i = 0;
    const h = () => {
      i++;
      if (i >= 3) {
        this.Zz = false;
        this.avatarPanel.mouseEnabled = true;
        this.closeBtn.mouseEnabled = true;
        this.confirmBtn.mouseEnabled = true;
        this.bg.mouseEnabled = true;
        if (t) t();
      }
    };
    Laya.Tween.to(this.scroll1, { x: this.tj }, 320, Laya.Ease.backOut, Laya.Handler.create(this, h), 80);
    Laya.Tween.to(this.scroll2, { x: this.sj }, 320, Laya.Ease.backOut, Laya.Handler.create(this, h), 80);
    Laya.Tween.to(
      this.scroll3Mask,
      { width: this.Kz, x: this.Jz },
      320,
      Laya.Ease.backOut,
      Laya.Handler.create(this, h),
      80,
    );
  }

  lj(): void {
    this.avatarPanel.on(Laya.Event.MOUSE_DOWN, this, this.onPanelMouseDown);
    this.avatarPanel.on(Laya.Event.MOUSE_DRAG, this, this.uj);
    this.avatarPanel.on(Laya.Event.MOUSE_DRAG_END, this, this.pj);
    this.avatarPanel.on(Laya.Event.MOUSE_UP, this, this.yj);
    this.avatarPanel.on(Laya.Event.CLICK, this, this.fj);
  }

  rj(): void {
    this.avatarPanel.off(Laya.Event.MOUSE_DOWN, this, this.onPanelMouseDown);
    this.avatarPanel.off(Laya.Event.MOUSE_DRAG, this, this.uj);
    this.avatarPanel.off(Laya.Event.MOUSE_DRAG_END, this, this.pj);
    this.avatarPanel.off(Laya.Event.MOUSE_UP, this, this.yj);
    this.avatarPanel.off(Laya.Event.CLICK, this, this.fj);
  }

  hj(): void {
    const t = AvatarMgr.instance();
    const s = 16 * (this.zz + this.Wz);
    this.ej = new Laya.Box();
    this.ej.width = s;
    this.ej.height = this.avatarPanel.height;
    this.avatarPanel.addChild(this.ej);
    this.avatarPanel.scrollRect = new Laya.Rectangle(0, 0, this.avatarPanel.width, this.avatarPanel.height);
    for (let s2 = 0; s2 < t.BG.length; s2++) {
      const i = t.BG[s2];
      const h = new Laya.Box();
      h.size(this.zz, this.avatarPanel.height);
      h.pos(s2 * (this.zz + this.Wz), 0);
      this.ej.addChild(h);
      const e = new Laya.Image();
      e.size(this.zz, this.zz);
      e.anchorX = 0.5;
      e.anchorY = 0.5;
      e.pos(h.width / 2, this.zz / 2);
      h.addChild(e);
      t.XG(i).then((tex: any) => (e.texture = tex));
      const a = t.isAvatarUnlocked(i);
      const n = new Laya.Sprite();
      n.size(this.zz, this.zz);
      n.pos(h.width / 2 - this.zz / 2, 10);
      n.visible = !a;
      h.addChild(n);
      const r = new Laya.Text();
      r.fontSize = 20;
      r.color = a ? "#000000" : "#888888";
      r.bold = true;
      r.align = "center";
      r.width = h.width + 20;
      r.x = -10;
      r.height = 34;
      r.pos(-10, this.zz + 10);
      r.text = a ? t.AG.get(i) || "" : t.UG(i);
      h.addChild(r);
      if (!a) {
        const lock = new Laya.Image("resources/img/mainUI/setting/lock.png");
        lock.anchorX = 0.5;
        lock.anchorY = 0.5;
        lock.pos(this.zz / 2, this.zz / 2);
        n.addChild(lock);
        r.fontSize = 14;
        r.overflow = "shrink";
      }
      this.Gz.push({ avatarEnum: i, box: h, image: e, gj: r, dj: n });
    }
  }

  Lj(t: number): void {
    if (t < 0 || t >= this.Gz.length || (t === this.selectedIndex && !this.qz)) return;
    $.instance().playSound("btn_down");
    this.cj();
    this.selectedIndex = t;
    this.ij = this.Gz[t].avatarEnum;
    this.aj(t, true);
    this.nj();
  }

  nj(): void {
    const t = AvatarMgr.instance().isAvatarUnlocked(this.ij);
    this.confirmBtn.alpha = t ? 1 : 0.4;
  }

  aj(t: number, s = true): void {
    const i = (t = Math.max(0, Math.min(this.Gz.length - 1, t)));
    const h = this.Gz[t];
    const e = this.Nz - (h.box.x + h.box.width / 2);
    const a = this.avatarPanel.width - this.ej.width;
    const n = Math.max(a, Math.min(0, e));
    if (s) {
      this.qz = true;
      Laya.Tween.to(
        this.ej,
        { x: n },
        300,
        Laya.Ease.cubicOut,
        Laya.Handler.create(this, () => {
          if (this.selectedIndex === i) {
            this.mj();
            this.wj();
          }
          this.qz = false;
        }),
      );
    } else {
      this.ej.x = n;
      this.mj();
      this.wj();
      this.qz = false;
    }
  }

  wj(): void {
    if (!this.ej) return;
    const t = this.Gz[this.selectedIndex];
    if (t) {
      const s = new Laya.Point(t.box.x + this.ej.x + t.box.width / 2, t.box.y + t.image.y);
      this.avatarPanel.localToGlobal(s);
      this.avatarBox.globalToLocal(s);
      this.whiteBk.visible = true;
      Laya.Tween.to(this.whiteBk, { x: s.x }, this.$z);
    } else this.whiteBk.visible = false;
    const scale = this.jz / this.zz;
    this.Gz.forEach((t2, i) => {
      const h = i === this.selectedIndex ? scale : 1;
      Laya.Tween.to(t2.image, { scaleX: h, scaleY: h }, this.$z);
    });
  }

  onPanelMouseDown(t: any): void {
    if (!this.Zz) {
      this.MX = false;
      this.Vz = t.stageX;
      Laya.Tween.clearAll(this.ej);
    }
  }

  uj(t: any): void {
    if (this.Zz) return;
    const s = t.stageX - this.Vz;
    if (Math.abs(s) > 5) this.MX = true;
    if (this.MX) {
      const x = this.ej.x + s;
      const i = this.avatarPanel.width - this.ej.width;
      this.ej.x = Math.max(i, Math.min(0, x));
      this.mj();
      this.wj();
    }
    this.Vz = t.stageX;
  }

  pj(_t: any): void {
    if (!this.Zz && this.MX) {
      this.vj();
      this.MX = false;
    }
  }

  yj(_t: any): void {
    if (this.Zz) return;
    if (this.MX) {
      this.vj();
      this.MX = false;
      this.Vz = 0;
    } else this.Vz = 0;
  }

  fj(_t: any): void {
    if (!this.Zz && !this.MX) {
      const t = this.avatarPanel.mouseX;
      this.kj(t);
    }
  }

  kj(t: number): void {
    let s = 0;
    let i = Infinity;
    this.Gz.forEach((h, e) => {
      const a = h.box.x + this.ej.x + h.box.width / 2;
      const n = Math.abs(t - a);
      if (n < i) {
        i = n;
        s = e;
      }
    });
    this.Lj(s);
  }

  mj(): void {
    let t = 0;
    let s = Infinity;
    const i = this.ej.x;
    this.Gz.forEach((h, e) => {
      const a = h.box.x + i + h.box.width / 2;
      const n = Math.abs(a - this.Nz);
      if (n < s) {
        s = n;
        t = e;
      }
    });
    this.selectedIndex = t;
    this.ij = this.Gz[t].avatarEnum;
    this.nj();
  }

  vj(): void {
    this.mj();
    this.aj(this.selectedIndex, true);
  }

  cj(): void {
    if (this.ej) Laya.Tween.clearAll(this.ej);
    Laya.Tween.clearAll(this.whiteBk);
    this.Gz.forEach((t) => Laya.Tween.clearAll(t.image));
  }
}
