// BossTipDialog — the animated boss-warning banner (the bundle's `ts`, @regClass
// 3PtiqZCFQj2dH_DSHFFblw).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~8850-9161. A staged warning sequence: red flash + tip-box grow, scrolling
// warning strips, the boss sprite + skill name/intro (`bf`), the banner expanding
// to reveal two sliding panels (`Wf`..`Qf`), then the confirm button (auto-closes
// after Sf ms). Closing recovers the boss sprite to its pool. Opaque field /
// method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { LayerZ } from "../core/layer-z";
import { EffectMgr } from "../battle/effect-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { GameMgr } from "../core/game-mgr";
import { AnimPlayer } from "../battle/anim-player";

const X = LayerZ;
const q = EffectMgr;
const K = SceneMgr;
const j = UpdateMgr;
const F = GameMgr;
const Zt = AnimPlayer;

@regClass("3PtiqZCFQj2dH_DSHFFblw")
export class BossTipDialog extends Laya.Dialog {
  // .ls-bound nodes
  confirmBtn!: any;
  red!: any;
  tipBox!: any;
  boss!: any;
  banner!: any;
  strip1!: any;
  strip2!: any;
  strip3!: any;
  strip4!: any;
  bg1!: any;
  bg2!: any;
  skillName!: any;
  skillIntro!: any;
  bossBg!: any;

  private df = 197;
  private Lf = 350;
  private mf = -100;
  private wf = 173;
  private vf = -34;
  private kf = 259;
  private _f = 670;
  private xf = 251;
  private Sf = 3000;
  popupEffect: any = null;
  closeEffect: any = null;

  private Pf: any;
  private Ef: any;
  private Cf: any;
  private Of: any;
  private Yf: any;
  private Xf: any;
  private Gf: any;
  private zf: any;
  private Nf: any;
  private qf: any;
  private Jf: any;
  private ph = 0;
  private hg: any;

  onAwake(): void {
    this.zIndex = X.Zr;
    this.confirmBtn.on(Laya.Event.CLICK, this, this.Uu);
    q.instance().bindButtons([this.confirmBtn]);
  }

  onEnable(): void {
    const t = K.instance().getDialogData("BossTipDialog");
    this.red.alpha = 0;
    this.tipBox.scaleY = 0;
    this.boss.alpha = 1;
    this.banner.height = this.df;
    this.confirmBtn.scale(0, 0);
    this.bf(t);
  }

  onOpened(_t?: any): void {
    this.Mf();
  }

  Mf(): void {
    this.Pf = Laya.Tween.create(this.tipBox)
      .to("scaleY", 1)
      .duration(320)
      .ease(Laya.Ease.linearOut)
      .then(() => {
        this.Af();
      });
    this.Ef = Laya.Tween.create(this.red).to("alpha", 1).duration(320).ease(Laya.Ease.linearOut);
  }

  Af(): void {
    this.Bf();
  }

  Bf(): void {
    this.If();
    this.Df();
    this.Tf();
    Laya.timer.once(500, this, () => {
      this.Rf();
    });
  }

  Df(): void {
    const t = () => {
      this.Ef = Laya.Tween.create(this.red)
        .to("alpha", 0)
        .duration(320)
        .ease(Laya.Ease.linearOut)
        .chain()
        .to("alpha", 1)
        .duration(320)
        .ease(Laya.Ease.linearOut)
        .then(() => {
          t();
        });
    };
    t();
  }

  Tf(): void {
    const t = () => {
      this.Cf = Laya.Tween.create(this.boss)
        .to("alpha", 0.5)
        .duration(160)
        .ease(Laya.Ease.linearOut)
        .chain()
        .to("alpha", 1)
        .duration(160)
        .ease(Laya.Ease.linearOut)
        .then(() => {
          t();
        });
    };
    t();
  }

  If(): void {
    this.Uf(this.strip1, -1);
    this.Uf(this.strip2, -1);
    this.Uf(this.strip3, 1);
    this.Uf(this.strip4, 1);
    this.Ff(this.strip1);
    this.Ff(this.strip2);
    this.Ff(this.strip3);
    this.Ff(this.strip4);
  }

  Ff(t: any): void {
    const s = () => {
      Laya.Tween.to(
        t,
        { alpha: 1 },
        500,
        Laya.Ease.linearOut,
        Laya.Handler.create(this, () => {
          Laya.Tween.to(
            t,
            { alpha: 0.7 },
            500,
            Laya.Ease.linearOut,
            Laya.Handler.create(this, () => {
              s();
            }),
          );
        }),
      );
    };
    s();
  }

  Uf(t: any, s: number): void {
    const i = s > 0 ? 640 : -640;
    const h = s > 0 ? -640 : 640;
    const e = t.x;
    const a = (Math.abs(i - e) / 1280) * 20480;
    const n = Laya.Tween.create(t)
      .to("x", i)
      .duration(a)
      .ease(Laya.Ease.linearOut)
      .then(() => {
        t.x = h;
        this.Uf(t, s);
      });
    if (t === this.strip1) this.Of = n;
    else if (t === this.strip2) this.Yf = n;
    else if (t === this.strip3) this.Xf = n;
    else if (t === this.strip4) this.Gf = n;
  }

  Rf(): void {
    if (this.Ef) this.Ef.clear();
    if (this.Cf) this.Cf.clear();
    this.Hf();
    this.Wf();
  }

  Hf(): void {
    this.strip1.alpha = 1;
    this.strip2.alpha = 1;
    this.strip3.alpha = 1;
    this.strip4.alpha = 1;
  }

  Wf(): void {
    this.zf = Laya.Tween.create(this.banner)
      .to("height", this.Lf)
      .duration(300)
      .ease(Laya.Ease.linearOut)
      .then(() => {
        this.jf();
      });
    this.Cf = Laya.Tween.create(this.boss).to("alpha", 0).duration(300).ease(Laya.Ease.linearOut);
  }

  jf(): void {
    this.bg1.x = this.vf;
    this.bg2.x = this._f;
    this.bg1.scaleX = 1;
    this.bg2.scaleX = 1;
    this.bg1.visible = true;
    this.bg2.visible = true;
    this.$f();
    j.instance().pause(false);
  }

  $f(): void {
    if (this.Nf) this.Nf.clear();
    if (this.qf) this.qf.clear();
    this.Nf = Laya.Tween.create(this.bg1)
      .to("x", this.kf)
      .duration(300)
      .then(() => {
        this.Vf();
      });
    this.qf = Laya.Tween.create(this.bg2).to("x", this.xf).duration(300);
  }

  Vf(): void {
    if (this.Nf) this.Nf.clear();
    if (this.qf) this.qf.clear();
    this.Nf = Laya.Tween.create(this.bg1)
      .to("scaleX", 0.9)
      .to("x", this.kf + 10)
      .duration(150)
      .then(() => {
        this.Qf();
      });
    this.qf = Laya.Tween.create(this.bg2)
      .to("scaleX", 0.9)
      .to("x", this.xf - 10)
      .duration(150);
    Laya.Tween.create(this.confirmBtn)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(150)
      .then(() => {
        this.Zf();
        this.Kf();
      });
  }

  Zf(): void {
    const t = () => {
      this.Jf = Laya.Tween.create(this.confirmBtn)
        .to("scaleX", 1.1)
        .to("scaleY", 1.1)
        .duration(300)
        .ease(Laya.Ease.linearOut)
        .chain()
        .to("scaleX", 1)
        .to("scaleY", 1)
        .duration(300)
        .ease(Laya.Ease.linearOut)
        .then(() => {
          t();
        });
    };
    t();
  }

  Kf(): void {
    Laya.timer.once(this.Sf, this, this.Uu);
  }

  tg(): void {
    if (this.Jf) {
      this.Jf.clear();
      this.Jf = null;
    }
    Laya.Tween.killAll(this.confirmBtn);
    this.confirmBtn.scale(1, 1);
  }

  Qf(): void {
    this.sg();
    this.red.on(Laya.Event.CLICK, this, this.Uu);
  }

  sg(): void {
    if (this.Nf) this.Nf.clear();
    if (this.qf) this.qf.clear();
    this.Nf = Laya.Tween.create(this.bg1)
      .to("scaleX", 1.1)
      .to("x", this.kf - 5)
      .duration(100)
      .chain()
      .to("scaleX", 1)
      .to("x", this.kf)
      .duration(200)
      .then(() => {
        this.ig();
      });
    this.qf = Laya.Tween.create(this.bg2)
      .to("scaleX", 1.1)
      .to("x", this.xf + 5)
      .duration(100)
      .chain()
      .to("scaleX", 1)
      .to("x", this.xf)
      .duration(200);
  }

  ig(): void {
    if (this.Nf) {
      this.Nf.clear();
      this.Nf = null;
    }
    if (this.qf) {
      this.qf.clear();
      this.qf = null;
    }
  }

  bf(t: number): void {
    this.ph = t;
    const s = F.instance().enemy.gh[t];
    this.skillName.text = s.skillName + "：";
    this.skillName.color = s.color;
    this.skillIntro.text = s.skillIntro;
    const i = [
      "goliang",
      "gobao",
      "gojiao",
      "goxiang",
      "gozhen",
      "godiao",
      "gohx",
      "golvbu",
      "godz",
      "godian2",
      "goxia",
      "gocao",
    ];
    this.hg = Zt.instance().yf(t);
    if (i[t]) this.hg.play(i[t], true);
    this.bossBg.addChild(this.hg);
    this.hg.pos(82, 147);
    this.hg.setAutoAdjust(true);
    this.hg.scale(1.2, 1.2);
    if (t === 7) this.hg.pos(82, 130);
  }

  Uu(): void {
    Laya.Tween.killAll(this);
    Laya.timer.clearAll(this);
    this.Hf();
    this.tg();
    j.instance().resume();
    this.zf = Laya.Tween.create(this.banner)
      .to("scaleY", 0)
      .duration(300)
      .ease(Laya.Ease.linearOut)
      .then(() => {
        this.eg();
      });
  }

  eg(): void {
    this.hg.removeSelf();
    Zt.instance().gf(this.hg, Zt.instance().ff(this.ph));
    j.instance().resume();
    K.instance().closeDialog("BossTipDialog");
  }
}
