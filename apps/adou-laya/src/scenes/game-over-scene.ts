// GameOverScene — the win/lose settlement screen (the bundle's `jr`, @regClass
// 36WnNn_bSKilkYpbnYn_9A).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~33556-34490. Two staged animation flows — win (`JN`/`hq`, enum `iq`) and lose
// (`tq`/`dq`, enum `gq`) — animate the rank-up/down with flying / gaining /
// slaking stars (`nq`/`rq`/`oq`/`vq`), the scroll banner, the gold reward fly
// (`ZN`), the weapon-fragment grid (`VN`), the thief dancer orbit (`zN`), and the
// claim button (`TW` → ad or plain), then returns to MainScene (`Bu`). Opaque
// field / method names kept verbatim; node refs bound from GameOverScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { AnimPlayer } from "../battle/anim-player";
import { EffectMgr } from "../battle/effect-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { GameMgr } from "../core/game-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { TipMgr } from "../core/tip-mgr";
import { PrefabFactory } from "../battle/prefab-factory";
import { MathE } from "../core/math-e";
import { pt } from "../battle/analytics-mgr";

const Zt = AnimPlayer;
const $ = AudioMgr;

@regClass("36WnNn_bSKilkYpbnYn_9A")
export class GameOverScene extends Laya.Scene {
  // .ls-bound nodes
  winBg!: any;
  loseBg!: any;
  winBox!: any;
  loseBox!: any;
  getBtn!: any;
  getBtnAd!: any;
  scroll0!: any;
  scroll1!: any;
  scroll2!: any;
  scrollMask!: any;
  weaponBox!: any;
  allGoldNumTxt!: any;
  arrow!: any;
  gold!: any;
  goldLight!: any;
  goldNumTxt!: any;
  getTxt!: any;
  goldBg!: any;
  allGoldImg!: any;
  rankBg0!: any;
  rankBg1!: any;
  rankBg2!: any;
  upTxt!: any;
  lightning!: any;
  cloud!: any;
  rankTxt1!: any;
  rankTxt2!: any;
  star0!: any;
  star1!: any;
  star2!: any;
  star3!: any;
  star4!: any;
  star5!: any;
  starNum!: any;
  flyStars!: any;
  rankPanel!: any;
  starEff!: any;
  starSlakeEff!: any;
  slake0!: any;
  slake1!: any;
  slake2!: any;
  flag!: any;
  loseFloor!: any;
  box!: any;

  static iq = { sq: 0, aq: 1, lq: 2, yq: 3, fq: 4 };
  static gq = { sq: 0, Lq: 1, mq: 2, fq: 3 };

  private isWin = false;
  private HH = false;
  private WH = false;
  private round = 0;
  private goldNum = 0;
  private Yv = new Laya.Point();
  private SN = [
    { x: 0, y: 570 },
    { x: 500, y: 570 },
    { x: 110, y: 670 },
    { x: 410, y: 670 },
  ];
  private bN: any[] = [];
  private WP: any[] = [];
  private MN = 0;
  private PN = 0;
  private AN = 0;
  private EN = 0;
  private BN: any[] = [];
  private IN: any[] = [];
  private DN = 275;
  private TN = 130;
  private RN = 200;
  private CN = 100;
  private UN = [0.4 * Math.PI, 0.8 * Math.PI, 1.2 * Math.PI, 1.6 * Math.PI, 2 * Math.PI];
  private ON!: any;
  private YN!: any;

  FN(t: number): any {
    switch (t) {
      case 0:
        return this.star0;
      case 1:
        return this.star1;
      case 2:
        return this.star2;
      case 3:
        return this.star3;
      case 4:
        return this.star4;
      default:
        throw new Error("GameOverScene.rankStarImageByIndex: invalid index " + t);
    }
  }

  onAwake(): void {
    this.winBg.centerX = 0;
    this.winBg.centerY = 0;
    this.winBg.height = Laya.stage.height;
    this.loseBg.centerX = 0;
    this.loseBg.centerY = 0;
    this.loseBg.height = Laya.stage.height;
    this.winBox.width = Laya.stage.width;
    this.winBox.height = Laya.stage.height;
    this.loseBox.width = Laya.stage.width;
    this.loseBox.height = Laya.stage.height;
    this.getBtn.on(Laya.Event.CLICK, this, this.TW);
    this.getBtnAd.on(Laya.Event.CLICK, this, this.TW, [true]);
    this.fX();
    this.ON = Zt.instance().pf("aDou");
    this.ON.play("zhan", true);
    this.ON.scale(2.3, 2.3);
    this.ON.pos(290, 530);
    this.winBox.addChild(this.ON);
    this.YN = Zt.instance().pf("aDou");
    this.YN.pos(285, 520);
    this.YN.scale(1.8, 1.8);
    this.YN.play("attack", true);
    this.loseBox.addChild(this.YN);
    this.scroll1.x = 264;
    this.scroll2.x = 324;
    this.scrollMask.width = 72;
    EffectMgr.instance().bindButtons([this.getBtn, this.getBtnAd]);
  }

  onOpened(t: any): void {
    this.isWin = t.isWin;
    this.HH = t.HH;
    this.WH = t.WH;
    this.round = t.round;
    this.winBox.visible = this.winBg.visible = t.isWin;
    this.loseBox.visible = this.loseBg.visible = !t.isWin;
    this.weaponBox.visible = t.isWin;
    this.allGoldNumTxt.text = GameMgr.instance().player.gold.toString();
    this.goldNum = this.isWin ? 20 : 5;
    if (this.HH || this.WH) {
      $.instance().playSound("game_lose");
      this.arrow.skin = "resources/img/gameOverUI/arrow2.png";
    } else if (this.isWin) {
      $.instance().playSound("game_win");
      this.arrow.skin = "resources/img/gameOverUI/arrow1.png";
    } else {
      $.instance().playSound("game_lose");
      this.arrow.skin = "resources/img/gameOverUI/arrow2.png";
    }
    this.arrow.visible = false;
    this.XN();
    if (this.isWin) this.GN();
    else this.HN();
    this.WN();
    UpdateMgr.instance().register("gameOverScene", this, this.update);
    $.instance().stopDrum();
  }

  update(_t: number): void {
    this.zN();
    this.jN();
  }

  XN(): void {
    this.gold.visible = false;
    this.goldLight.visible = false;
    this.getBtn.visible = false;
    this.getBtnAd.visible = false;
    this.$N();
  }

  NN(): void {
    this.getBtn.visible = true;
    if (this.WH) {
      this.gold.visible = false;
      this.goldLight.visible = false;
      this.getBtnAd.visible = false;
      this.getTxt.text = "关闭";
      this.getBtn.y = 960;
    } else {
      this.gold.visible = true;
      this.goldLight.visible = true;
      // 去掉"看广告拿金币":隐藏看广告翻倍按钮,只保留普通领取。
      this.getBtnAd.visible = false;
      this.getTxt.text = "领取";
      this.getBtn.y = 1190;
      if (this.isWin) {
        this.getBtnAd.skin = "resources/img/gameOverUI/btn6.png";
        this.goldNumTxt.text = "X" + this.goldNum;
      } else {
        this.getBtnAd.skin = "resources/img/gameOverUI/btn5.png";
        this.goldNumTxt.text = "X" + this.goldNum;
      }
    }
    this.qN(this.gold);
    this.qN(this.goldLight);
    this.qN(this.getBtn);
    this.qN(this.getBtnAd);
    this.VN();
    if (Laya.Browser.onTTMiniGame && PlatformMgr.instance().Lu()) SceneMgr.instance().openDialog("ShareLpDialog");
  }

  qN(t: any): void {
    if (t.visible) {
      t.scale(0, 0);
      Laya.Tween.create(t).to("scaleX", 1).to("scaleY", 1).duration(150);
    }
  }

  QN(): void {
    for (let t = 0; t < 4; t++) {
      let s = this.bN[t];
      if (!s) {
        s = Zt.instance().pf("dancer");
        s.name = "dancer";
        s.play("wu", true);
        this.winBox.addChild(s);
        this.bN.push(s);
      }
      if (this.SN[t].x < 320) {
        s.pos(-200, this.SN[t].y);
        Laya.Tween.create(s).to("x", this.SN[t].x).duration(10 * (this.SN[t].x - s.x));
      } else {
        s.pos(710, this.SN[t].y);
        Laya.Tween.create(s).to("x", this.SN[t].x).duration(10 * (s.x - this.SN[t].x));
      }
    }
  }

  fX(): void {
    for (let t = 0; t < 5; t++) {
      const s = new Laya.Sprite();
      s.size(GameMgr.instance().map.gridWid, GameMgr.instance().map.gridHei);
      s.anchorX = 0.5;
      s.anchorY = 0.5;
      s.name = "thiefRoot";
      const i = new Laya.Image("resources/img/gameObject/soldier/shadow2.png");
      i.size(50, 22);
      i.pos(17, 58);
      i.alpha = 0.5;
      const h = Zt.instance().pf("thief");
      h.size(GameMgr.instance().map.gridWid, GameMgr.instance().map.gridHei);
      h.pos(51, 52);
      h.anchorX = 0.5;
      h.anchorY = 0.5;
      h.play("animation", true);
      s.addChild(i);
      s.addChild(h);
      this.loseFloor.addChild(s);
      this.WP.push({ root: s, sk: h, iP: i, dir: t % 2 ? 1 : -1 });
    }
  }

  zN(): void {
    for (let t = 0; t < this.WP.length; t++) {
      const s = this.WP[t];
      const i = s.root;
      const h = s.sk;
      i.pos(this.DN + this.RN * Math.cos(this.UN[t]), this.TN + this.CN * Math.sin(this.UN[t]));
      if (i.y < this.TN && i.scaleX >= -1) i.scaleX -= 0.1;
      if (i.y > this.TN && i.scaleX <= 1) i.scaleX += 0.1;
      if (h.scaleY > 1.3) s.dir = -1;
      if (h.scaleY < 0.7) s.dir = 1;
      h.scaleY += 0.02 * s.dir;
      this.UN[t] -= 0.01;
      if (this.UN[t] === 0) this.UN[t] = 2 * Math.PI;
    }
  }

  TW(t?: any, s = false): void {
    if (this.WH) this.Bu();
    else if (s)
      PlatformMgr.instance().uu(
        () => {
          const reward = 2 * this.goldNum;
          TipMgr.instance().showTip("恭喜您获得了" + reward + "蜜獾币", 1000);
          this.ZN(this.getBtnAd, reward, () => {
            this.Bu(true);
          });
          this.getBtn.mouseEnabled = false;
          this.getBtnAd.mouseEnabled = false;
        },
        () => {
          TipMgr.instance().showTip("观看完整广告才可获得奖励呦~");
          this.getBtn.mouseEnabled = true;
          this.getBtnAd.mouseEnabled = true;
        },
        pt,
      );
    else {
      const reward = this.goldNum;
      TipMgr.instance().showTip("恭喜您获得了" + reward + "蜜獾币", 1000);
      this.ZN(this.getBtn, reward, () => {
        this.Bu(false);
      });
      this.getBtn.mouseEnabled = false;
      this.getBtnAd.mouseEnabled = false;
    }
  }

  ZN(t: any, s: number, i: () => void): void {
    const h = new Laya.Point(t.width / 2, t.height / 2);
    const e = t.localToGlobal(h);
    this.goldBg.scale(1, 1);
    const a = this.allGoldImg.localToGlobal(new Laya.Point(this.allGoldImg.width / 2, this.allGoldImg.height / 2));
    const n = { width: this.allGoldImg.width, height: this.allGoldImg.height };
    this.goldBg.scale(0, 0);
    this.globalToLocal(e);
    this.globalToLocal(a);
    const r = GameMgr.instance().player.gold;
    const o = r + s;
    const l = s > 0 ? Math.floor(s / 8) : 0;
    const c = s > 0 ? s % 8 : 0;
    let u = 0;
    let p = 0;
    let y = r;
    let fDone = s <= 0;
    const g = () => {
      if (fDone)
        Laya.timer.once(300, this, () => {
          this.allGoldNumTxt.text = o.toString();
          GameMgr.instance().player.gold = o;
          if (i) i();
        });
    };
    const d = () => {
      if (u < s) {
        let cnt = l + (p < c ? 1 : 0);
        cnt = Math.min(cnt, s - u);
        u += cnt;
        y += cnt;
        p++;
        this.allGoldNumTxt.text = y.toString();
        GameMgr.instance().player.gold = y;
      }
    };
    if (s > 0)
      EffectMgr.instance().explodeAndFlyReward(
        this,
        this.gold.skin,
        this.gold.width,
        this.gold.height,
        e,
        a,
        n.width,
        n.height,
        () => {
          fDone = true;
          g();
        },
        d,
      );
    else g();
    Laya.Tween.create(this.goldBg).to("scaleX", 1).to("scaleY", 1).duration(100);
  }

  WN(): void {
    this.rankBg0.visible = this.isWin;
    this.rankBg1.visible = this.isWin;
    this.rankBg2.visible = this.isWin;
    this.upTxt.visible = this.isWin;
    this.lightning.visible = false;
    this.cloud.visible = !this.isWin;
    this.rankTxt1.text = GameMgr.instance().rank.lastRank.rank;
    this.KN(GameMgr.instance().rank.lastRank.rank, GameMgr.instance().rank.lastRank.level);
    if (this.isWin) this.JN();
    else this.tq();
  }

  JN(): void {
    this.PN = GameOverScene.iq.sq;
    this.hq();
  }

  hq(): void {
    switch (this.PN) {
      case GameOverScene.iq.sq:
        this.ON.play("dakai", false);
        this.ON.on(Laya.Event.STOPPED, this, () => {
          this.ON.offAll();
          this.ON.play("hejiu", true);
        });
        Laya.timer.once(500, this, () => {
          this.eq(() => {
            this.PN = GameOverScene.iq.aq;
            this.hq();
          });
        });
        break;
      case GameOverScene.iq.aq: {
        const t = GameMgr.instance().rank.currentRank.level - 1;
        const s = GameMgr.instance().rank.currentRank.rank === "皇帝";
        if (t === 0) {
          this.rankTxt2.text = GameMgr.instance().rank.currentRank.rank;
          this.rankTxt2.y = -this.rankTxt2.height;
          this.nq(() => {
            this.rq(t, s, () => {
              if (s) this.KN(GameMgr.instance().rank.currentRank.rank, GameMgr.instance().rank.currentRank.level);
              this.oq(t, s);
              this.PN = GameOverScene.iq.lq;
              this.hq();
              this.arrow.visible = true;
              this.cq();
            });
          });
        } else
          this.rq(t, s, () => {
            this.oq(t, s);
            this.PN = GameOverScene.iq.lq;
            this.hq();
            this.arrow.visible = true;
            this.cq();
          });
        break;
      }
      case GameOverScene.iq.lq:
        this.uq();
        this.pq();
        Laya.timer.once(600, this, () => {
          this.PN = GameOverScene.iq.yq;
          this.hq();
        });
        break;
      case GameOverScene.iq.yq:
        this.QN();
        this.PN = GameOverScene.iq.fq;
        this.hq();
        break;
      case GameOverScene.iq.fq:
        this.NN();
    }
  }

  tq(): void {
    this.AN = GameOverScene.gq.sq;
    this.dq();
  }

  dq(): void {
    switch (this.AN) {
      case GameOverScene.gq.sq:
        this.YN.play("dakai", false);
        this.YN.on(Laya.Event.STOPPED, this, () => {
          this.YN.offAll();
          this.YN.play("attack", true);
        });
        Laya.timer.once(500, this, () => {
          this.eq(() => {
            this.AN = GameOverScene.gq.Lq;
            this.dq();
          });
        });
        break;
      case GameOverScene.gq.Lq: {
        if (GameMgr.instance().rank.lastRank.id === 0 && GameMgr.instance().rank.lastRank.level === 1) {
          this.AN = GameOverScene.gq.mq;
          return void this.dq();
        }
        const t = GameMgr.instance().rank.currentRank.id < GameMgr.instance().rank.lastRank.id;
        const s = GameMgr.instance().rank.currentRank.rank;
        const i = GameMgr.instance().rank.currentRank.level;
        const h = s === "皇帝";
        const e = GameMgr.instance().rank.lastRank.rank === "皇帝";
        if (t)
          if (e && !h) {
            const lvl = GameMgr.instance().rank.lastRank.level;
            this.vq(lvl - 1, true, () => {
              this.kq(() => {
                this.eq(() => {
                  this.KN(s, i);
                  this.rankTxt2.text = s;
                  this.rankTxt2.y = this.rankTxt2.height;
                  Laya.Tween.to(this.rankTxt1, { y: this.rankTxt1.y - this.rankTxt1.height }, 500, Laya.Ease.cubicIn);
                  Laya.Tween.to(this.rankTxt2, { y: this.rankTxt2.y - this.rankTxt2.height }, 500, Laya.Ease.cubicIn);
                  Laya.timer.once(300, this, () => {
                    this.AN = GameOverScene.gq.mq;
                    this.dq();
                    this.arrow.visible = true;
                    this.cq();
                  });
                });
              });
            });
          } else
            this.vq(0, h, () => {
              this.kq(() => {
                this.eq(() => {
                  this.KN(s, i);
                  this.rankTxt2.text = s;
                  this.rankTxt2.y = this.rankTxt2.height;
                  Laya.Tween.to(this.rankTxt1, { y: this.rankTxt1.y - this.rankTxt1.height }, 500, Laya.Ease.cubicIn);
                  Laya.Tween.to(this.rankTxt2, { y: this.rankTxt2.y - this.rankTxt2.height }, 500, Laya.Ease.cubicIn);
                  Laya.timer.once(300, this, () => {
                    this.AN = GameOverScene.gq.mq;
                    this.dq();
                    this.arrow.visible = true;
                    this.cq();
                  });
                });
              });
            });
        else {
          if (GameMgr.instance().rank.currentRank.id === 0 && GameMgr.instance().rank.lastRank.level === 1) {
            this.AN = GameOverScene.gq.mq;
            return void this.dq();
          }
          this.wq();
          const lvl = GameMgr.instance().rank.lastRank.level;
          const e2 = GameMgr.instance().rank.lastRank.rank === "皇帝";
          const a = e2 ? lvl - 1 : Math.min(lvl - 1, 4);
          this.vq(a, e2, () => {
            if (h) this.KN(s, i);
            Laya.timer.once(300, this, () => {
              this.AN = GameOverScene.gq.mq;
              this.dq();
              this.arrow.visible = true;
              this.cq();
            });
          });
        }
        break;
      }
      case GameOverScene.gq.mq:
        this._q();
        this.AN = GameOverScene.gq.fq;
        this.dq();
        break;
      case GameOverScene.gq.fq:
        this.NN();
    }
  }

  _q(): void {
    for (let t = 0; t < this.WP.length; t++) {
      const s = this.WP[t].sk;
      s.scaleY = 0;
      s.alpha = 0;
      Laya.timer.once(200 * t, this, () => {
        Laya.Tween.to(s, { scaleY: 1, alpha: 1 }, 300, Laya.Ease.backOut);
      });
    }
  }

  eq(t: () => void): void {
    this.scroll1.x = 264;
    this.scroll2.x = 324;
    this.scrollMask.width = 72;
    Laya.Tween.to(this.scroll1, { x: 70 }, 800);
    Laya.Tween.to(this.scroll2, { x: 530 }, 800);
    Laya.Tween.to(
      this.scrollMask,
      { width: 510 },
      800,
      null,
      Laya.Handler.create(this, () => {
        if (t) t();
      }),
    );
  }

  kq(t: () => void): void {
    this.scroll1.x = 70;
    this.scroll2.x = 530;
    this.scrollMask.width = 510;
    Laya.Tween.to(this.scroll1, { x: 264 }, 500);
    Laya.Tween.to(this.scroll2, { x: 324 }, 500);
    Laya.Tween.to(
      this.scrollMask,
      { width: 72 },
      500,
      null,
      Laya.Handler.create(this, () => {
        if (t) t();
      }),
    );
  }

  nq(t: () => void): void {
    const s = [0, 4, 1, 3, 2];
    const i = {
      x: this.rankPanel.x + this.rankPanel.width / 2,
      y: this.rankPanel.y + this.rankPanel.height / 2,
    };
    this.flyStars.visible = true;
    for (let t2 = 0; t2 < 5; t2++) this.FN(t2).alpha = 0.3;
    for (let h = 0; h < s.length; h++) {
      const e = this.flyStars.getChildAt(s[h]);
      Laya.timer.once(200 * h, this, () => {
        this.FN(s[h]).skin = "resources/img/gameOverUI/star0.png";
        let a = 0;
        UpdateMgr.instance().register("flyStar" + h, this, (delta: number) => {
          a += delta / 500;
          if (
            MathE.quadraticBezierPoint(
              { x: e.x, y: e.y } as any,
              { x: e.x, y: e.y - 100 } as any,
              { x: i.x, y: i.y } as any,
              e,
              a,
            )
          ) {
            UpdateMgr.instance().unregister("flyStar" + h);
            Laya.Tween.to(e, { scaleX: 0, scaleY: 0, alpha: 0 }, 100);
            Laya.Tween.to(this.rankTxt1, { y: this.rankTxt1.y + this.rankTxt1.height / 5 }, 100, Laya.Ease.cubicIn);
            Laya.Tween.to(this.rankTxt2, { y: this.rankTxt2.y + this.rankTxt2.height / 5 }, 100, Laya.Ease.cubicIn);
            if (h === 4 && t) t();
            $.instance().playSound("battle_end_star_fly");
          }
        });
      });
    }
  }

  rq(t: number, s: boolean, i: () => void): void {
    const h = new Laya.Image("resources/img/gameOverUI/star1.png");
    h.size(80, 80);
    h.anchor(0.5, 0.5);
    let e = this.FN(t).x;
    let a = this.FN(t).y;
    if (s) {
      e = this.star5.x;
      a = this.star5.y;
    }
    this.scroll0.addChild(h);
    Laya.Point.TEMP.x = 800;
    Laya.Point.TEMP.y = -300;
    this.scroll0.globalToLocal(Laya.Point.TEMP);
    h.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    Laya.Tween.create(h)
      .to("x", e)
      .to("y", a)
      .duration(1000)
      .then(() => {
        Laya.Tween.killAll(h);
        h.rotation = 0;
        if (i) i();
        h.destroy();
      });
    h.rotation = 80;
    Laya.Tween.create(h)
      .to("rotation", 360)
      .duration(360)
      .then(() => {
        h.rotation = 0;
      })
      .repeat(-1);
  }

  oq(t: number, s: boolean): void {
    let i: any;
    if (s) {
      t += 1;
      i = this.star5;
      i.visible = true;
      this.starNum.text = "X" + t;
    } else {
      i = this.FN(t);
      i.alpha = 1;
    }
    Laya.Tween.to(i, { alpha: 1 }, 100);
    i.skin = "resources/img/gameOverUI/star1.png";
    this.Yv.x = i.x - 5;
    this.Yv.y = i.y - 5;
    i.parent.localToGlobal(this.Yv);
    this.starEff.parent.globalToLocal(this.Yv);
    this.starEff.pos(this.Yv.x, this.Yv.y);
    this.starEff.scale(0.5, 0.5);
    this.starEff.alpha = 1;
    Laya.Tween.create(this.starEff)
      .to("scaleX", 0.8)
      .to("scaleY", 0.8)
      .to("alpha", 1)
      .duration(300)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .to("alpha", 0)
      .duration(500);
    $.instance().playSound("battle_end_gain_star");
  }

  vq(t: number, s: boolean, i: () => void): void {
    let h: any;
    if (s) {
      h = this.star5;
      this.starNum.text = "X" + t;
    } else h = this.FN(t);
    this.Yv.x = h.x - 5;
    this.Yv.y = h.y - 5;
    h.parent.localToGlobal(this.Yv);
    this.starSlakeEff.parent.globalToLocal(this.Yv);
    this.starSlakeEff.pos(this.Yv.x, this.Yv.y);
    this.starSlakeEff.alpha = 0;
    this.slake1.x = 49;
    this.slake1.y = 75;
    this.slake1.rotation = 0;
    this.slake1.alpha = 1;
    this.slake2.x = 36;
    this.slake2.y = 77;
    this.slake2.rotation = 0;
    this.slake2.alpha = 1;
    this.slake0.visible = true;
    Laya.Tween.create(this.starSlakeEff)
      .to("alpha", 1)
      .duration(100)
      .then(() => {
        h.alpha = 0.3;
        h.skin = "resources/img/gameOverUI/star0.png";
        this.slake0.visible = false;
        Laya.Tween.create(this.slake1)
          .to("rotation", -30)
          .duration(100)
          .chain()
          .delay(100)
          .to("x", this.slake1.x - 20)
          .to("y", this.slake1.y + 50)
          .to("alpha", 0)
          .duration(200);
        Laya.Tween.create(this.slake2)
          .to("rotation", 30)
          .duration(100)
          .chain()
          .delay(100)
          .to("x", this.slake2.x + 20)
          .to("y", this.slake2.y + 50)
          .to("alpha", 0)
          .duration(200)
          .then(() => {
            if (i) i();
          }, this);
      });
    $.instance().playSound("battle_end_lose_star");
  }

  KN(t: string, s: number): void {
    if (t === "皇帝") {
      this.star5.visible = true;
      this.star5.alpha = s > 0 ? 1 : 0.3;
      this.star5.skin = s > 0 ? "resources/img/gameOverUI/star1.png" : "resources/img/gameOverUI/star0.png";
      for (let k = 0; k < 5; k++) this.FN(k).visible = false;
      this.starNum.text = "X" + s;
    } else {
      this.star5.visible = false;
      for (let k = 0; k < 5; k++) {
        const i = this.FN(k);
        i.visible = true;
        if (k < s) {
          i.alpha = 1;
          i.skin = "resources/img/gameOverUI/star1.png";
        } else {
          i.alpha = 0.3;
          i.skin = "resources/img/gameOverUI/star0.png";
        }
      }
    }
  }

  xq(): void {
    const t = PrefabFactory.instance().getItem("flagEff", this);
    t.pos(640, MathE.range(-300, 300));
    t.alpha = MathE.range(0.5, 1);
    const s = MathE.range(0, 5, true);
    t.skin = "resources/img/rank/flagEff" + s + ".png";
    this.winBox.addChild(t);
    Laya.Tween.to(
      t,
      { x: -100, y: MathE.range(t.y + 200, t.y + 400) },
      8000,
      null,
      Laya.Handler.create(this, () => {
        t.removeSelf();
        PrefabFactory.instance().recover("flagEff", t);
      }),
    );
  }

  GN(): void {
    this.PN = GameOverScene.iq.sq;
    this.rankBg0.visible = true;
    this.rankBg1.visible = true;
    this.rankBg2.visible = true;
    this.flag.anchorY = 1;
    this.flag.rotation = 90;
    this.flag.skewX = 0;
    this.flag.visible = false;
    this.rankBg0.width = 0;
    this.rankBg0.height = 0;
    this.rankBg1.width = 0;
    this.rankBg1.height = 0;
    this.rankBg2.width = 0;
    this.rankBg2.height = 0;
  }

  HN(): void {
    this.AN = GameOverScene.gq.sq;
    this.flag.visible = false;
    this.rankBg0.visible = false;
    this.rankBg1.visible = false;
    this.rankBg2.visible = false;
    for (let t = 0; t < this.WP.length; t++) {
      const s = this.WP[t].sk;
      s.scaleY = 0;
      s.alpha = 0;
      s.scaleX = 1;
    }
    this.UN = [0.4 * Math.PI, 0.8 * Math.PI, 1.2 * Math.PI, 1.6 * Math.PI, 2 * Math.PI];
  }

  uq(): void {
    this.flag.anchorY = 1;
    this.flag.rotation = 90;
    this.flag.skewX = 0;
    this.flag.visible = true;
    Laya.Tween.to(this.flag, { rotation: 0 }, 600, Laya.Ease.backOut);
  }

  pq(): void {
    Laya.Tween.to(this.rankBg0, { width: 491, height: 251 }, 491);
    Laya.Tween.to(this.rankBg1, { width: 435, height: 200 }, 435);
    Laya.Tween.to(this.rankBg2, { width: 341, height: 145 }, 341);
  }

  cq(): void {
    this.EN = this.arrow.y;
    const t = this.isWin ? -10 : 10;
    const s = this.EN + t;
    const i = () => {
      Laya.Tween.create(this.arrow)
        .to("y", s)
        .duration(300)
        .then(() => {
          Laya.Tween.create(this.arrow)
            .to("y", this.EN)
            .duration(300)
            .then(() => {
              i();
            });
        });
    };
    i();
  }

  wq(): void {
    this.lightning.scaleX = 0;
    this.lightning.scaleY = 0;
    this.lightning.alpha = 1;
    this.lightning.visible = true;
    Laya.Tween.create(this.lightning)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(100)
      .chain()
      .to("alpha", 0)
      .duration(300);
  }

  jN(): void {
    this.goldLight.rotation += 1;
    if (this.goldLight.rotation >= 360) this.goldLight.rotation = 0;
  }

  VN(): void {
    this.$N();
    const s = GameMgr.instance().battleState.Wi;
    if (!s || s.length === 0) return;
    const i: number[] = [];
    for (let t = 0; t < s.length; t++) {
      const h = s[t];
      const e = Math.max(0, h.fragmentNum || 0);
      for (let k = 0; k < e; k++) i.push(h.weaponId);
    }
    i.sort((a, b) => {
      const wa = GameMgr.instance().weaponData.weapons.get(a);
      const wb = GameMgr.instance().weaponData.weapons.get(b);
      const ra = wa ? wa.rarity : -1;
      const rb = wb ? wb.rarity : -1;
      return rb !== ra ? rb - ra : a - b;
    });
    if (i.length === 0) return;
    const h = this.weaponBox;
    const e = Math.max(1, h.width - 16);
    let a = 8;
    let n = 8;
    let r = 0;
    for (let s2 = 0; s2 < i.length; s2++) {
      const o = i[s2];
      const l = GameMgr.instance().weaponData.weapons.get(o);
      if (!l) continue;
      const c = l.rarity;
      const u = PrefabFactory.instance().getItem("weaponFragment", this);
      const p = u.getChildByName("bg");
      const y = u.getChildByName("name");
      p.skin = "resources/img/weaponBag/rarity" + c + ".png";
      y.text = l.txt;
      y.color = GameMgr.instance().weaponData.rarityColors[c] ?? "#ffffff";
      const fw = Math.max(y.textWidth || 0, y.text.length * (y.fontSize || 32));
      const g = Math.max(100, fw + 36);
      const d = p.height;
      p.width = g;
      y.width = g;
      y.height = d;
      u.width = g;
      u.height = d;
      u.pivotX = g / 2;
      u.pivotY = d / 2;
      y.pos(0, 0);
      if (a > 8 && a - 8 + u.width > e) {
        a = 8;
        n += r + 16;
        r = 0;
      }
      h.addChild(u);
      u.pos(a + u.width / 2, n + u.height / 2);
      this.IN.push(u);
      u.alpha = 0;
      u.scale(0.6, 0.6);
      const L = u.y;
      u.y = L + 16;
      Laya.timer.once(70 * s2, this, () => {
        if (u.parent)
          Laya.Tween.create(u).to("alpha", 1).to("scaleX", 1).to("scaleY", 1).to("y", L).duration(220);
      });
      a += u.width + 16;
      r = Math.max(r, u.height);
    }
  }

  $N(): void {
    for (let t = this.IN.length - 1; t >= 0; t--) {
      const s = this.IN[t];
      Laya.Tween.killAll(s);
      if (s.parent) s.removeSelf();
      PrefabFactory.instance().recover("weaponFragment", s);
    }
    this.IN.length = 0;
  }

  Bu(t = false): void {
    if (!t || this.HH) {
      const scene = this.HH ? "exit" : "settlement";
      PlatformMgr.instance().$y(scene);
    }
    UpdateMgr.instance().unregister("gameOverScene");
    this.$N();
    this.getBtn.mouseEnabled = true;
    this.getBtnAd.mouseEnabled = true;
    EffectMgr.instance().clearFlyRewards();
    if (this.box) {
      const t2 = this.box._children ? this.box._children.slice() : [];
      for (let s = t2.length - 1; s >= 0; s--) {
        const i = t2[s];
        if (i instanceof Laya.Image && i.name === "flyRewardParticle") {
          if (i.parent) i.removeSelf();
          i.destroy();
        }
      }
    }
    Laya.timer.clearAll(this);
    this.YN.offAll();
    this.ON.offAll();
    this.scroll1.x = 264;
    this.scroll2.x = 324;
    this.scrollMask.width = 72;
    this.starEff.alpha = 0;
    this.rankTxt1.y = 0;
    this.rankTxt2.y = -this.rankTxt2.height;
    for (let t2 = 0; t2 < this.flyStars.numChildren; t2++) {
      const s = this.flyStars.getChildAt(t2);
      s.pos(this.FN(t2).x, this.FN(t2).y);
      s.scaleX = 1;
      s.scaleY = 1;
      s.alpha = 1;
    }
    this.flyStars.visible = false;
    for (let t2 = 0; t2 < this.bN.length; t2++) if (this.bN[t2] && this.bN[t2].parent) this.bN[t2].removeSelf();
    this.bN = [];
    Laya.Tween.killAll(this.goldBg);
    this.goldBg.scale(0, 0);
    console.log("关闭结算场景");
    SceneMgr.instance().closeScene("GameOverScene");
    SceneMgr.instance().openScene("MainScene");
    // 去掉"结束后提示选技能":不再自动打开技能选择(ShopScene)。
    GameMgr.instance().battleState.Wi.length = 0;
    this.BN.length = 0;
    Laya.Tween.killAll(this.arrow);
  }
}
