// TutorialMgr — drives the first-time tutorial flow (the bundle's `wn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~27121-27219. When active it forces an easy AI (difficulty 0, 70% attack, no
// waves, no boss), feeds a scripted draw bag, and posts guidance tips. Opaque
// field / method names kept verbatim.
//
//   active=CY  scriptedBag=UY  nextUnit=NY  firstRefresh=VY  placeGuide=QY

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { SpawnQueueMgr } from "./spawn-queue-mgr";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const Na = SpawnQueueMgr;

export class TutorialMgr extends Singleton {
  private RY = 0.7;
  CY = false;
  private UY = ["刀", "弓", "黄", "忠", "铲"];
  private FY = new Set(["黄", "忠"]);
  private OY = false;
  private YY = false;
  private XY = false;
  private GY = false;
  private HY = "把文字拖到上边  排兵布阵";
  private WY = 5000;
  private zY = false;

  init(): void {}
  jY(): void {
    this.CY = true;
    this.OY = false;
    this.YY = false;
    this.XY = false;
    const t = F.instance().battleState;
    this.GY = t.li;
    t.li = true;
    t.ki = 0;
    t.Pi.Ei = 0;
    t.xi = this.RY;
    console.log("[TutorialMgr] 新手教程已启动，AI 难度 0，AI 攻击力 70%，无波数限制，不出现 Boss");
  }
  $Y(): void {
    if (!this.CY) return;
    const t = F.instance().battleState;
    t.delayTime = 999999999;
    t.Yi = true;
    console.log("[TutorialMgr] 游戏已加载，等待玩家完成第一次随机刷新");
    Laya.timer.once(600, this, () => {
      y.instance.event(u.ds, "点击下方红色按钮  征召士兵");
    });
  }
  NY(t: number): string {
    if (!this.CY || this.YY) return Na.instance().LU(true);
    if (this.OY) return t >= 0 && t < this.UY.length ? this.UY[t] : Na.instance().LU(true);
    return this.qY();
  }
  private qY(): string {
    const t = this.FY;
    let s = Na.instance().LU(true);
    let i = 0;
    while (t.has(s) && i < 30) {
      s = Na.instance().LU(true);
      i += 1;
    }
    if (t.has(s)) {
      console.warn("[TutorialMgr] 牌库连续刷到黄忠字，回退为基础兵种");
      return "刀";
    }
    return s;
  }
  VY(): void {
    if (this.CY && !this.YY) {
      if (!this.OY) {
        this.OY = true;
        console.log("[TutorialMgr] 第一次随机刷新完成，显示放置指引");
        this.QY();
        return;
      }
      this.YY = true;
      console.log("[TutorialMgr] 第二次固定刷新完成");
    }
  }
  gameOver(): void {
    if (this.CY) {
      this.ZY();
      y.instance.event(u.ds, null);
      F.instance().battleState.li = this.GY;
      this.CY = false;
      this.OY = false;
      this.YY = false;
      this.XY = false;
      console.log("[TutorialMgr] 新手教程已结束");
    }
  }
  KY(): void {
    this.XY = true;
    F.instance().battleState.Oi = true;
    console.log("[TutorialMgr] 放置指引结束，开始出怪！");
  }
  private QY(): void {
    this.ZY();
    y.instance.event(u.ds, this.HY);
    this.zY = true;
    Laya.timer.once(this.WY, this, this.JY);
  }
  private JY(): void {
    if (this.zY) {
      this.zY = false;
      y.instance.event(u.ds, null);
      if (!this.XY) this.KY();
    }
  }
  private ZY(): void {
    if (this.zY) {
      Laya.timer.clear(this, this.JY);
      this.zY = false;
    }
  }
}
