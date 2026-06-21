// MatchScene — the matchmaking animation between menu and battle (the bundle's
// `uo`, @regClass dxhrI-d-T2icEkklUGt-kQ).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~35646-36000. Shows the player (red) vs the rolled AI opponent (blue) — ranks,
// avatars, win rates, the two sides' props flying onto four prop lines (`GQ`/the
// `update` drip loop), the flag swoosh and VS-sword clash (`YQ`), then starts the
// battle (`OQ` → GameController.GH/startGame) and slides the scene away. Opaque
// field / method names kept verbatim; node refs bound from MatchScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { LayerZ } from "../core/layer-z";
import { UpdateMgr } from "../core/update-mgr";
import { AvatarMgr } from "../battle/avatar-mgr";
import { GameMgr } from "../core/game-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { GameController } from "../battle/game-controller";
import { AudioMgr } from "../core/audio-mgr";
import { SceneMgr } from "../core/scene-mgr";

const X = LayerZ;
const j = UpdateMgr;
const In = AvatarMgr;
const F = GameMgr;
const Zi = BattlePropsMgr;
const Cn = GameController;
const $ = AudioMgr;
const K = SceneMgr;
const lo = Laya.Ease;

@regClass("dxhrI-d-T2icEkklUGt-kQ")
export class MatchScene extends Laya.Scene {
  // .ls-bound nodes
  placeholder1!: any;
  placeholder2!: any;
  placeholder3!: any;
  placeholder4!: any;
  bluePropEffect!: any;
  redPropEffect!: any;
  xBtn!: any;
  bg_1!: any;
  bg_2!: any;
  redAvatar!: any;
  redRank!: any;
  redWinRate!: any;
  title!: any;
  flagBlue!: any;
  flagRed!: any;
  propBlueLine1!: any;
  propBlueLine2!: any;
  propRedLine1!: any;
  propRedLine2!: any;
  blueRank!: any;
  blueWinRate!: any;
  blueAvatar!: any;
  vs1!: any;
  vs2!: any;
  vsLight!: any;
  bg!: any;

  private Yv = new Laya.Point(0, 0);
  private bQ: any[] = [];
  private MQ = false;
  private PQ: any[][] = [[], [], [], []];
  private AQ = [0, 0];
  private EQ = 118;
  private BQ = 1500;
  private IQ = 6;
  private DQ = 200;
  private TQ = false;
  private RQ = 0;
  private CQ = false;
  private UQ = 0;

  onAwake(): void {
    this.zIndex = X.Hr;
    this.placeholder1.destroy();
    this.placeholder2.destroy();
    this.placeholder3.destroy();
    this.placeholder4.destroy();
    this.bluePropEffect.pivot(40, 40);
    this.redPropEffect.pivot(40, 40);
    this.xBtn.on(Laya.Event.CLICK, this, this.Bu);
    this.bg_1.height = this.bg_2.height = Laya.stage.height;
    this.bg_1.getChildAt(0).height = this.bg_2.getChildAt(0).height = Laya.stage.height;
  }

  onOpened(): void {
    const t = (this.width - 60) / 6;
    this.EQ = Math.min(t, this.EQ);
    this.init();
    this.reset();
    j.instance().register("MatchScene", this, this.update);
  }

  onClosed(_t?: any): void {
    j.instance().unregister("MatchScene");
  }

  init(): void {
    this.redAvatar.texture = null;
    In.instance().GG(this.redAvatar);
    const t = F.instance();
    this.redRank.text = t.rank.currentRank.rank;
    const s = t.player.roundDay - 1;
    this.redWinRate.text = s > 0 ? ((t.player.winDay / s) * 100).toFixed(1) + "%" : "0.0%";
    this.title.text = "匹配中";
    Laya.timer.once(50, this, () => {
      this.FQ();
    });
  }

  update(t: number): void {
    if (this.TQ) {
      this.RQ += (t / 1000) * Math.PI;
      this.flagBlue.skewX = 2 * Math.sin(this.RQ);
      this.flagRed.skewX = 2 * Math.sin(this.RQ + Math.PI);
    }
    if (this.MQ) {
      const now = Laya.timer.currTimer;
      let s = true;
      this.PQ.forEach((line, h) => {
        if (line.length > 0) {
          s = false;
          const e = h <= 1;
          const a = e ? 0 : 1;
          if (now - this.AQ[a] > this.DQ) {
            const item = line.shift();
            let n: any;
            this.bQ.push(item);
            if (h === 0) n = this.propBlueLine1;
            else if (h === 1) n = this.propBlueLine2;
            else if (h === 2) n = this.propRedLine1;
            else if (h === 3) n = this.propRedLine2;
            n.addChild(item);
            const r = e ? this.bluePropEffect : this.redPropEffect;
            item.addChild(r);
            r.size(this.EQ, this.EQ);
            r.pos(40, 40);
            r.scale(1.5, 1.5);
            r.alpha = 0.8;
            Laya.Tween.create(r)
              .to("scaleX", 1)
              .to("scaleY", 1)
              .to("alpha", 0)
              .duration(this.DQ - 100)
              .then(() => {
                this.addChild(r);
              }, this);
            this.AQ[a] = now;
          }
        }
      });
      if (s) {
        this.MQ = false;
        this.CQ = true;
        this.UQ = 0;
      }
    }
    if (this.CQ) {
      this.UQ += t;
      if (this.UQ > this.BQ) {
        this.OQ();
        this.CQ = false;
      }
    }
  }

  FQ(): void {
    this.title.text = "匹配完成";
    this.blueRank.visible = true;
    this.blueWinRate.visible = true;
    const t = F.instance().battleState.Pi;
    this.blueRank.text = t.rank;
    In.instance()
      .YG(t.rank)
      .then((tex: any) => {
        this.blueAvatar.texture = tex;
      });
    this.blueWinRate.text = t.Bi.toFixed(1) + "%";
    this.YQ();
    this.XQ(this.flagRed);
    this.XQ(this.flagBlue, false).then(() => {
      this.TQ = true;
    });
    let s = true;
    const i = Zi.instance();
    i.xx.forEach((p, idx) => {
      if (idx < this.IQ) {
        this.GQ(p, true, false);
        s = false;
      }
    });
    i.Sx.forEach((p, idx) => {
      if (idx < this.IQ) {
        this.GQ(p, true, true);
        s = false;
      }
    });
    i.Mx.forEach((p, idx) => {
      if (idx < this.IQ) {
        this.GQ(p, false, false);
        s = false;
      }
    });
    i.Px.forEach((p, idx) => {
      if (idx < this.IQ) {
        this.GQ(p, false, true);
        s = false;
      }
    });
    if (s) {
      this.UQ = -1000;
      this.CQ = true;
    }
  }

  OQ(): void {
    this.title.visible = false;
    this.xBtn.visible = false;
    j.instance().pause(false);
    (F.instance().player.round === 0 ? Cn.instance().GH() : Cn.instance().startGame()).then((t: any) => {
      t.addChild(this);
      t.scale(1.03, 1.03);
      Laya.Tween.create(t).to("scaleX", 1).to("scaleY", 1).duration(800).ease(lo.sineOut);
      Laya.Tween.create(this.bg)
        .to("alpha", 0)
        .delay(100)
        .duration(200)
        .parallel(this.propBlueLine1)
        .to("alpha", 0)
        .duration(100)
        .parallel(this.propBlueLine2)
        .to("alpha", 0)
        .duration(100)
        .parallel(this.propRedLine1)
        .to("alpha", 0)
        .duration(100)
        .parallel(this.propRedLine2)
        .to("alpha", 0)
        .duration(100);
      this.HQ();
      this.WQ(this.flagRed, false);
      this.WQ(this.flagBlue).then(() => {
        this.Bu();
        j.instance().resume();
      });
    });
  }

  GQ(t: number, s: boolean, i: boolean): void {
    const h = s ? "resources/img/matchUI/propBoxRed.png" : "resources/img/matchUI/propBoxBlue.png";
    const e = s ? Zi.instance().Nx(t) : Zi.instance().Qx(t);
    const a = "resources/img/props/" + F.instance().props.Ue[t].name + "_" + e + ".png";
    const n = new Laya.Image(h);
    n.size(this.EQ, this.EQ);
    const r = new Laya.Image(a);
    const o = Math.min(80, this.EQ);
    r.size(o, o);
    r.pivot(o / 2, o / 2);
    n.addChild(r);
    r.pos(this.EQ / 2, this.EQ / 2);
    let l = 0;
    l += s ? 2 : 0;
    l += i ? 1 : 0;
    this.PQ[l].push(n);
    this.AQ[l] = Laya.timer.currTimer;
    this.MQ = true;
  }

  XQ(t: any, s = true): any {
    const i = s ? -1 : 1;
    t.skewX = -50 * i;
    return Laya.Tween.create(t)
      .to("x", 0)
      .duration(500)
      .ease(lo.backOut)
      .parallel()
      .to("skewX", 10 * i)
      .duration(400)
      .ease(lo.linear)
      .chain()
      .to("skewX", -5 * i)
      .duration(200)
      .ease(lo.linear)
      .chain()
      .to("skewX", 0)
      .duration(200)
      .ease(lo.linear);
  }

  WQ(t: any, s = true): any {
    this.TQ = false;
    const i = s ? -1 : 1;
    return Laya.Tween.create(t)
      .to("x", (t.width + 100) * i)
      .duration(500)
      .ease(lo.backIn)
      .parallel()
      .to("skewX", -20 * i)
      .duration(400)
      .ease(lo.backIn)
      .chain()
      .to("skewX", -5 * i)
      .duration(200)
      .ease(lo.linear)
      .chain()
      .to("skewX", 0)
      .duration(200)
      .ease(lo.linear);
  }

  YQ(): void {
    $.instance().playSound("match_drum");
    this.vs1.visible = true;
    this.vs2.visible = true;
    Laya.Tween.create(this.vs1).to("x", 285).to("rotation", 50).duration(150).ease(lo.cubicOut);
    Laya.Tween.create(this.vs2)
      .to("x", 375)
      .to("rotation", -50)
      .duration(150)
      .ease(lo.cubicOut)
      .then(() => {
        $.instance().playSound("swords_clash");
        Laya.Tween.create(this.vs1).to("scaleX", 1.1).to("scaleY", 1.1).duration(10);
        Laya.Tween.create(this.vs2)
          .to("scaleX", 1.1)
          .to("scaleY", 1.1)
          .duration(10)
          .then(() => {
            Laya.Tween.create(this.vs1).to("x", 295).to("scaleX", 0.8).to("scaleY", 0.8).duration(10);
            Laya.Tween.create(this.vs2).to("x", 365).to("scaleX", 0.8).to("scaleY", 0.8).duration(10);
          });
        Laya.Tween.create(this.vsLight)
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(50)
          .then(() => {
            this.vsLight.scale(0.5, 0.5);
            this.vsLight.skin = "resources/img/matchUI/vsLight1.png";
            Laya.Tween.create(this.vsLight)
              .to("scaleX", 0.6)
              .to("scaleY", 0.6)
              .duration(30)
              .chain()
              .to("scaleX", 1)
              .to("scaleY", 1)
              .to("alpha", 0)
              .duration(20);
          });
      });
  }

  HQ(): void {
    Laya.Tween.create(this.vs1).to("x", -100).to("rotation", -40).duration(400);
    Laya.Tween.create(this.vs2).to("x", 740).to("rotation", 40).duration(400);
  }

  reset(): void {
    Laya.Tween.killAll(this.flagBlue);
    Laya.Tween.killAll(this.flagRed);
    this.TQ = false;
    this.addChild(this.bluePropEffect);
    this.addChild(this.redPropEffect);
    this.MQ = false;
    this.PQ.forEach((line) => {
      line.forEach((p: any) => {
        p.destroy(true);
      });
      line.length = 0;
    });
    this.bQ.forEach((p) => {
      p.destroy(true);
    });
    this.bQ.length = 0;
    this.CQ = false;
    this.UQ = 0;
    this.title.text = "开始匹配";
    this.blueAvatar.skin = "";
    this.blueRank.text = "";
    this.blueWinRate.text = "";
    this.blueRank.visible = false;
    this.blueWinRate.visible = false;
    this.flagBlue.x = -this.flagBlue.width;
    this.flagRed.x = this.flagRed.width;
    this.vs1.visible = false;
    this.vs1.x = -100;
    this.vs1.rotation = -40;
    this.vs2.visible = false;
    this.vs2.x = Laya.stage.width + 100;
    this.vs2.rotation = 40;
    this.vsLight.skin = "resources/img/matchUI/vsLight0.png";
    this.vsLight.scale(0, 0);
    this.vsLight.alpha = 1;
    this.propBlueLine1.alpha = 1;
    this.propBlueLine2.alpha = 1;
    this.propRedLine1.alpha = 1;
    this.propRedLine2.alpha = 1;
    this.title.visible = true;
    this.bg.alpha = 1;
  }

  Bu(): void {
    j.instance().unregister("match");
    this.reset();
    K.instance().closeScene("MatchScene");
  }
}
