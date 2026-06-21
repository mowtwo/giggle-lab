// StaminaCtrl — drives stamina regeneration + the ad/share refill flows (the
// bundle's `Rn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~28758-28879. A per-frame tick (`AH`) accrues stamina by the recover interval;
// `DH` watches an ad and `CH` shares (or watches an ad if sharing is unavailable)
// to refill, both gated by daily caps and a share cooldown. The actual ad/share
// calls go through the platform mgr (`Mt`). Opaque method / field names kept
// verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { TipMgr } from "../core/tip-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { PlatformMgr } from "./platform-mgr";
import { ut } from "./analytics-mgr";

const F = GameMgr;
const j = UpdateMgr;
const tt = TipMgr;
const y = EventMgr;
const u = GameEvent;
const Mt = PlatformMgr;

export class StaminaCtrl extends Singleton {
  private yH!: any;
  private PH!: any;

  init(): void {
    this.yH = F.instance().player;
    this.PH = F.instance().stamina;
    this.AH();
    j.instance().register("StaminaMgr", this, this.update);
  }

  update(_t: number): void {
    this.AH();
  }

  /** Accrue stamina by elapsed recover intervals. (`AH`) */
  AH(): void {
    if (this.yH.stamina > this.PH.hn) this.yH.stamina = this.PH.hn;
    if (this.yH.stamina >= this.PH.hn) return;
    if (this.yH.lastRecoverTime === 0) {
      this.yH.lastRecoverTime = Date.now();
      return;
    }
    const t = Date.now() - this.yH.lastRecoverTime;
    if (t < this.PH.en) return;
    const s = Math.floor(t / this.PH.en);
    this.yH.stamina = Math.min(this.yH.stamina + s, this.PH.hn);
    const i = t % this.PH.en;
    this.yH.lastRecoverTime = Date.now() - i;
  }

  /** Whether the player can afford one battle. (`EH`) */
  EH(): boolean {
    return this.yH.stamina >= this.PH.an;
  }

  /** Spend one battle's stamina. (`BH`) */
  BH(): void {
    const t = this.yH.stamina >= this.PH.hn;
    this.yH.stamina -= this.PH.an;
    if (t) this.yH.lastRecoverTime = Date.now();
  }

  /** Whether an ad refill is still available today. (`IH`) */
  IH(): boolean {
    return this.yH.videoCountToday < this.PH.rn;
  }

  /** Watch an ad to refill stamina. (`DH`) */
  DH(t?: () => void): void {
    if (this.yH.stamina >= this.PH.hn) tt.instance().showTip("当前体力已满~");
    else if (this.IH())
      Mt.instance().uu(
        () => {
          this.yH.stamina = Math.min(this.yH.stamina + this.PH.nn, this.PH.hn);
          this.yH.videoCountToday += 1;
          if (t) t();
        },
        () => {
          tt.instance().showTip("观看完整广告才能获得体力呦~");
        },
        ut,
      );
    else tt.instance().showTip("今天已经看过视频了，明天再来吧~");
  }

  /** Whether a share refill is available (cap + cooldown). (`TH`) */
  TH(): boolean {
    return this.yH.staminaShareCountToday < this.PH.cn && this.RH() <= 0;
  }

  /** Remaining share cooldown in seconds. (`RH`) */
  RH(): number {
    const t = Date.now();
    const s = this.PH.un - (t - this.yH.lastShareStaminaTime);
    return Math.max(0, Math.ceil(s / 1000));
  }

  /** Share (or watch an ad) to refill stamina. (`CH`) */
  CH(t?: () => void): void {
    const s = Date.now();
    if (this.yH.stamina >= this.PH.hn) return void tt.instance().showTip("当前体力已满~");
    if (this.yH.staminaShareCountToday >= this.PH.cn) {
      const msg = Mt.instance().canShare()
        ? "今天已经分享3次了，明天再来吧~"
        : "今天已通过该方式领取3次，明天再来吧~";
      return void tt.instance().showTip(msg);
    }
    const i = this.RH();
    if (i > 0) {
      const msg = Mt.instance().canShare()
        ? "分享冷却中，还需等待" + Math.floor(i / 60) + "分" + (i % 60) + "秒"
        : "冷却中，还需等待" + Math.floor(i / 60) + "分" + (i % 60) + "秒";
      return void tt.instance().showTip(msg);
    }
    const h = () => {
      this.yH.stamina = Math.min(this.yH.stamina + this.PH.ln, this.PH.hn);
      this.yH.staminaShareCountToday += 1;
      this.yH.lastShareStaminaTime = s;
      const msg = Mt.instance().canShare()
        ? `分享成功！获得${this.PH.ln}点体力`
        : `观看成功！获得${this.PH.ln}点体力`;
      tt.instance().showTip(msg);
      if (t) t();
      y.instance.event(u.Vt);
    };
    if (Mt.instance().canShare())
      Mt.instance().share(h, () => {
        tt.instance().showTip("分享失败，请重试~");
      });
    else
      Mt.instance().uu(
        h,
        () => {
          tt.instance().showTip("观看完整广告才能获得体力呦~");
        },
        ut,
      );
  }

  /** Add stamina directly. (`UH`) */
  UH(t: number): void {
    this.yH.stamina = Math.min(this.yH.stamina + t, this.PH.hn);
    y.instance.event(u.Vt);
  }

  /** Seconds until the next stamina point. (`FH`) */
  FH(): number {
    if (this.yH.stamina >= this.PH.hn) return 0;
    const t = Date.now();
    const s = t - (this.yH.lastRecoverTime || t);
    const i = this.PH.en - (s % this.PH.en);
    return Math.ceil(i / 1000);
  }
}

/** Alias. (`Rn`) */
export const Rn = StaminaCtrl;
