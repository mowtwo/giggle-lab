// RankScene — the national / province leaderboard (the bundle's `Lo`,
// @regClass z4oz-zSESq64GebLHKczEg).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~36005-36145. Toggles country/province tabs (`jQ`), fetches the list through
// LeaderboardMgr (`getData`/`LH`), and renders pooled `rankItem` rows (`qQ`/`VQ`)
// with rank medals, stars (or emperor big-star), avatar, name, province. On first
// open after a season it shows RankRewardDialog (`TW`). Opaque field / method
// names kept verbatim; node refs bound from RankScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { EffectMgr } from "../battle/effect-mgr";
import { LeaderboardMgr } from "../battle/leaderboard-mgr";
import { RankScoreMgr } from "../battle/rank-score-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { TipMgr } from "../core/tip-mgr";
import { PrefabFactory } from "../battle/prefab-factory";
import { AvatarMgr } from "../battle/avatar-mgr";

const q = EffectMgr;
const Dn = LeaderboardMgr;
const En = RankScoreMgr;
const K = SceneMgr;
const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const tt = TipMgr;
const z = PrefabFactory;
const In = AvatarMgr;
const fo = "resources/img/rank/countryBtn.png";
const go = "resources/img/rank/provinceBtn.png";

@regClass("z4oz-zSESq64GebLHKczEg")
export class RankScene extends Laya.Scene {
  // .ls-bound nodes
  xBtn!: any;
  countryBtn!: any;
  provinceBtn!: any;
  list!: any;
  playerRank!: any;

  private lp = -1;
  private zQ = 0;
  private pH: any[] = [];
  private yH: any = null;

  onAwake(): void {
    this.xBtn.on(Laya.Event.CLICK, this.Bu);
    this.countryBtn.on(Laya.Event.CLICK, this, this.jQ, [0]);
    this.provinceBtn.on(Laya.Event.CLICK, this, this.jQ, [1]);
    q.instance().bindButtons([this.xBtn, this.countryBtn, this.provinceBtn]);
    this.countryBtn.skin = fo;
    this.provinceBtn.skin = go;
  }

  $Q(t: any): void {
    if (this.lp < 0) return;
    Dn.instance().rH(t);
    Laya.timer.callLater(this, this.NQ);
  }

  NQ(): void {
    if (this.lp < 0) return;
    const t = this.lp === 0;
    const s = Dn.instance().dH(t);
    if (s) {
      this.pH = s.pH;
      this.yH = s.yH;
      this.qQ();
      return;
    }
    this.getData();
  }

  onOpened(_t?: any): void {
    y.instance.off(u._s, this, this.$Q);
    y.instance.on(u._s, this, this.$Q);
    this.lp = -1;
    this.jQ(0);
    if (F.instance().player.isGetLastRankReward === 0) {
      this.TW();
      F.instance().player.isGetLastRankReward = 1;
    }
  }

  TW(): void {
    const t = En.instance().SG(F.instance().player.lastStar);
    K.instance().openDialog("RankRewardDialog", false, { bestRank: t.rank, bestLevel: t.level });
  }

  async jQ(t: number): Promise<void> {
    if (t !== this.lp) {
      this.lp = t;
      this.countryBtn.skin = t === 0 ? fo : go;
      this.provinceBtn.skin = t === 1 ? fo : go;
      await Dn.instance().nH();
      this.getData();
    }
  }

  getData(): void {
    const t = ++this.zQ;
    const s = this.lp === 0;
    const i = s ? Dn.instance().fH() : Dn.instance().gH();
    if (i) tt.instance().showLoadingMask();
    Dn.instance().LH(s, {
      success: (resp: any) => {
        if (t === this.zQ) {
          this.pH = resp.pH;
          this.yH = resp.yH;
          this.qQ();
          if (i) tt.instance().hideLoadingMask();
        } else if (i) tt.instance().hideLoadingMask();
      },
      fail: () => {
        if (t === this.zQ) {
          if (i) tt.instance().hideLoadingMask();
          this.pH = [];
          this.yH = Dn.instance().lH(0);
          this.qQ();
          tt.instance().showTip("获取最新排行榜数据失败");
        } else if (i) tt.instance().hideLoadingMask();
      },
    });
  }

  qQ(): void {
    for (let t = this.list.numChildren - 1; t >= 0; t--)
      z.instance().recover("rankItem", this.list.getChildAt(t));
    this.list.removeChildren();
    for (let t = 0; t < this.pH.length; t++) {
      const s = z.instance().getItem("rankItem", this);
      s.pos((this.list.width - s.width) / 2, t * s.height);
      this.list.addChild(s);
      this.VQ(s, this.pH[t], false);
    }
    this.VQ(this.playerRank, this.yH, true);
  }

  VQ(t: any, s: any, i: boolean): void {
    const h = t.getChildByName("rankImg");
    const e = h.getChildByName("rankNum");
    const a = t.getChildByName("name");
    const n = t.getChildByName("province");
    const r = t.getChildByName("rankTxt");
    const o = t.getChildByName("stars");
    const l = t.getChildByName("bigStar");
    const c = t.getChildByName("avatarBg").getChildByName("avatar");
    const u2 = s.ranking;
    if (u2 === 1) {
      t.skin = "resources/img/rank/rankItem0.png";
      h.skin = "resources/img/rank/rankImg0.png";
    } else if (u2 === 2) {
      t.skin = "resources/img/rank/rankItem1.png";
      h.skin = "resources/img/rank/rankImg1.png";
    } else if (u2 === 3) {
      t.skin = "resources/img/rank/rankItem2.png";
      h.skin = "resources/img/rank/rankImg2.png";
    } else if (u2 === -1) {
      t.skin = "resources/img/rank/rankItem3.png";
      h.skin = "";
    } else {
      t.skin = "resources/img/rank/rankItem3.png";
      h.skin = "resources/img/rank/rankImg3.png";
    }
    e.text = u2 === -1 ? "未上榜" : u2.toString();
    if (i) t.skin = "resources/img/rank/rankItem.png";
    a.text = s.nick;
    n.text = this.lp === 0 ? s.province : F.instance().player.province;
    r.text = F.instance().rank.table.get(s.rank).rank;
    this.QQ(o, l, r.text, s.level);
    this.ZQ(c, s.avatar, i);
  }

  QQ(t: any, s: any, i: string, h: number): void {
    if (i === "皇帝") {
      t.visible = false;
      s.visible = true;
      s.getChildAt(0).text = `${h}`;
    } else {
      t.visible = true;
      s.visible = false;
      for (let k = 0; k < t.numChildren; k++)
        t.getChildAt(k).skin =
          k < h ? "resources/img/gameOverUI/star1.png" : "resources/img/gameOverUI/star0.png";
    }
  }

  ZQ(t: any, s: any, i: boolean): void {
    In.instance().zG(t, s, i);
  }

  Bu(): void {
    K.instance().closeScene("RankScene");
  }

  onClosed(): void {
    Laya.timer.clear(this, this.getData);
    Laya.timer.clear(this, this.NQ);
    y.instance.off(u._s, this, this.$Q);
  }
}
