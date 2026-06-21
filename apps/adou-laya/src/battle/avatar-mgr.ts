// AvatarMgr — the player's game-avatar selection + unlock rules (the bundle's
// `Bn`/`In`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~28257-28415. Holds the 16 avatar names (`AG`) and their unlock predicates
// (`IG`: win streaks, login days, rank tiers, owned weapons), re-evaluates them
// on init (`CG`), and provides skin-path helpers for UI. Opaque method / field
// names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { WeaponFragmentMgr } from "./weapon-fragment-mgr";

const F = GameMgr;
const eh = WeaponFragmentMgr;

export class AvatarMgr extends Singleton {
  static DG = ["军士", "校尉", "少将", "中将", "上将", "大将", "元帅", "诸侯", "霸主", "君主", "皇帝"];

  private MG = true;
  PG = 1;
  AG = new Map<number, string>([
    [1, "射雕老汉"],
    [2, "老朽"],
    [3, "和尚"],
    [4, "书生"],
    [5, "采花女"],
    [6, "钓鱼老翁"],
    [7, "琵琶女"],
    [8, "诗人"],
    [9, "提灯老头"],
    [10, "布衣丁诗人"],
    [11, "将军"],
    [12, "女娃"],
    [13, "老射手"],
    [14, "张飞"],
    [15, "神赵云"],
    [16, "红面刘备"],
  ]);
  private EG: Array<(t: number) => void> = [];
  BG = [1, 2, 4, 8, 12, 3, 5, 9, 10, 7, 11, 6, 13, 14, 15, 16];
  private player!: any;

  get IG(): Map<number, { check: () => boolean; TG: string }> {
    const s = this.player;
    const i = F.instance().rank;
    const h = eh.instance();
    const e = F.instance().weaponData;
    const a = (x: string) => AvatarMgr.DG.indexOf(x.split(".")[0]);
    return new Map<number, { check: () => boolean; TG: string }>([
      [9, { check: () => s.winStreak >= 5, TG: "连胜5局解锁" }],
      [3, { check: () => s.consecutiveLoginDays >= 3, TG: "连续登录3天解锁" }],
      [5, { check: () => s.consecutiveLoginDays >= 7, TG: "连续登录7天解锁" }],
      [6, { check: () => a(i.currentRank.rank) >= AvatarMgr.DG.indexOf("皇帝"), TG: "军衔达到皇帝解锁" }],
      [7, { check: () => s.getPropsData().length >= 8, TG: "集齐8个道具解锁" }],
      [10, { check: () => s.winStreak >= 9, TG: "连胜9局解锁" }],
      [11, { check: () => a(i.currentRank.rank) >= AvatarMgr.DG.indexOf("少将"), TG: "军衔达到少将解锁" }],
      [13, { check: () => h.$b(e.findIdByTxt("铁胎弓")), TG: "获得铁胎弓解锁" }],
      [14, { check: () => h.$b(e.findIdByTxt("丈八蛇矛")), TG: "获得丈八蛇矛解锁" }],
      [15, { check: () => h.$b(e.findIdByTxt("龙胆亮银枪")), TG: "获得龙胆枪解锁" }],
      [16, { check: () => h.$b(e.findIdByTxt("青龙偃月刀")), TG: "获得青龙偃月刀解锁" }],
    ]);
  }

  CG(): void {
    const t = this.IG;
    for (let s = 1; s <= 16; s++) {
      const i = s;
      if (this.player.isAvatarUnlocked(i)) continue;
      const h = t.get(i);
      if (!(h && !h.check())) this.player.setAvatarUnlocked(i);
    }
  }

  isAvatarUnlocked(t: number): boolean {
    return this.player.isAvatarUnlocked(t);
  }

  UG(t: number): string {
    return this.isAvatarUnlocked(t) ? "" : (this.IG.get(t)?.TG ?? "");
  }

  init(): void {
    this.player = F.instance().player;
    this.PG = this.player.gameAvatar ?? 1;
    this.CG();
  }

  FG(t: (x: number) => void): void {
    this.EG.push(t);
  }

  OG(t: number): void {
    this.PG = t;
    this.player.gameAvatar = t;
    this.EG.forEach((s) => s(t));
  }

  YG(s: string): any {
    const i = AvatarMgr.DG.indexOf(s.split(".")[0]);
    const h: Array<[number, number]> = [
      [11, AvatarMgr.DG.indexOf("少将")],
      [6, AvatarMgr.DG.indexOf("皇帝")],
    ];
    const e = new Set(h.filter(([, t]) => i < t).map(([t]) => t));
    const a = this.BG.filter((t) => !e.has(t));
    const n = a[Math.floor(Math.random() * a.length)];
    return this.XG(n);
  }

  XG(t: number): any {
    return Laya.loader.load("resources/img/mainUI/avatar/avatar" + t + ".png", Laya.Loader.IMAGE);
  }

  GG(t: any): void {
    t.skin = "resources/img/mainUI/avatar/avatar" + this.player.gameAvatar + ".png";
  }

  HG(t?: number): string {
    return "resources/img/mainUI/avatar/avatar" + (t != null ? t : this.player.gameAvatar) + ".png";
  }

  WG(t: string): string {
    const s = t.match(/avatar(\d+)\.png$/);
    return s ? this.HG(Number(s[1])) : this.HG(1);
  }

  zG(t: any, s: string, i: boolean): void {
    t.skin = i ? this.HG() : this.WG(s);
  }
}

/** Aliases. (`Bn`/`In`) */
export const Bn = AvatarMgr;
export const In = AvatarMgr;
