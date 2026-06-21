// RankRewardDialog — claim the best-rank season reward (the bundle's `Jn`,
// @regClass E1wtzHmxTJG-Q8D_3rV0oA).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30361-30413. Shows the best rank + level (stars, or emperor big-star) and its
// gold reward; claiming adds the gold. Opaque field / method names kept verbatim;
// node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { SceneMgr } from "../core/scene-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { GameMgr } from "../core/game-mgr";
import { UpdateMgr } from "../core/update-mgr";

const K = SceneMgr;
const q = EffectMgr;
const F = GameMgr;
const j = UpdateMgr;

@regClass("E1wtzHmxTJG-Q8D_3rV0oA")
export class RankRewardDialog extends Laya.Dialog {
  // .ls-bound nodes
  getBtn!: any;
  goldTxt!: any;
  rank!: any;
  stars!: any;
  bigStar!: any;
  starNum!: any;
  light!: any;

  private getTime = 0;
  private bestRank = 0;
  private bestLevel = 0;

  onAwake(): void {
    this.getBtn.on(Laya.Event.CLICK, this, this.TW);
    q.instance().bindButtons([this.getBtn]);
  }

  onEnable(): void {
    const t = K.instance().getDialogData("RankRewardDialog");
    this.bestRank = t.bestRank;
    this.bestLevel = t.bestLevel;
    const s = F.instance().rank.table.get(t.bestRank);
    this.goldTxt.text = s.reward.toString();
    this.rank.text = s.rank;
    this.RW(s.rank, this.bestLevel);
    this.rank.visible = true;
    this.goldTxt.visible = true;
    j.instance().register("getRankReward", this, this.UW);
  }

  RW(t: string, s: number): void {
    if (t === "皇帝") {
      this.stars.visible = false;
      this.bigStar.visible = true;
      this.starNum.text = s.toString();
      return;
    }
    this.stars.visible = true;
    this.bigStar.visible = false;
    for (let k = 0; k < 5; k++)
      this.stars.getChildByName("star" + k).skin =
        k < s ? "resources/img/gameOverUI/star4.png" : "resources/img/gameOverUI/star3.png";
  }

  onOpened(_t?: any): void {}

  UW(): void {
    this.light.rotation += 1;
  }

  TW(): void {
    F.instance().player.gold += F.instance().rank.table.get(this.bestRank).reward;
    K.instance().closeDialog("RankRewardDialog");
  }

  onClosed(_t?: any): void {
    j.instance().unregister("getRankReward");
    this.rank.visible = false;
    this.goldTxt.visible = false;
  }
}
