// PlatformMgr — the mini-game platform abstraction (the bundle's `Mt`/`bt`) and
// its adapters.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~6643-8413. `init` picks a platform adapter by environment; in a browser
// iframe none of the mini-game globals exist, so the default `WebAdapter` (`V`)
// — all no-ops — is selected. Per the web-only build decision, the WeChat /
// TikTok / Vivo / QG / h5api adapters are thin stubs that inherit `V`'s no-ops,
// keeping `init`'s dispatch 1:1 while never shipping dead SDK code.
//
// `exit`/`preloadTasks`/`startupTasks` are semantic aliases over `ku`/`ou`/`lu`
// kept for the foundation callers (Main bootstrap + privacy gate). Other opaque
// method names are kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { UpdateMgr } from "../core/update-mgr";
import { AnalyticsMgr } from "../battle/analytics-mgr";

const j = UpdateMgr;
const St = AnalyticsMgr;

/** Default web adapter — every platform hook is a no-op. (`V`) */
export class WebAdapter {
  channelAppId = 0;
  ru = false;
  canShare = true;

  init(): void {
    if ((Laya.Stat as any)._statUI) (Laya.Stat as any)._statUI._sp.scale(2, 2);
  }
  async ou(t?: any): Promise<void> {
    if (t) t(1, 1);
  }
  async lu(): Promise<void> {}
  async cu(_t?: any): Promise<boolean> {
    return false;
  }
  uu(t?: any, _s?: any): void {
    if (t) t();
  }
  pu(_t?: any, _s?: any): void {}
  share(t?: any, _s?: any): void {
    if (t) t();
  }
  yu(): void {}
  fu(): void {}
  gu(t?: any, _s?: any): void {
    if (t) t();
  }
  du(): void {}
  Lu(): boolean {
    return false;
  }
  async getUserInfo(): Promise<any> {
    return null;
  }
  mu(): void {}
  wu(): void {}
  vu(): void {}
  createImage(): any {
    return null;
  }
  ku(): void {}
}

// Platform-specific adapters. On the web build these never instantiate; they
// inherit the no-op surface so the dispatch in `PlatformMgr.init` stays faithful.
/** h5api adapter. (`Q`) */
export class H5ApiAdapter extends WebAdapter {}
/** TikTok mini-game adapter. (`et`) */
export class TTAdapter extends WebAdapter {}
/** WeChat mini-game adapter. (`ht`) */
export class WXAdapter extends WebAdapter {}
/** Vivo mini-game adapter. (`ct`) */
export class VVAdapter extends WebAdapter {}
/** QG mini-game adapter. (`rt`) */
export class QGAdapter extends WebAdapter {}
/** Gamebox adapter. */
export class GameboxAdapter extends WebAdapter {}

export class PlatformMgr extends Singleton {
  static Ny = 120000;

  private Wy = 0;
  private zy!: any;

  init(): void {
    const g: any = globalThis as any;
    const b: any = Laya.Browser as any;
    if (typeof g.h5api !== "undefined") this.zy = new H5ApiAdapter();
    else if (typeof g.gamebox !== "undefined") this.zy = new GameboxAdapter();
    else if (b.onTTMiniGame) this.zy = new TTAdapter();
    else if (b.onWXMiniGame) this.zy = new WXAdapter();
    else if (b.onVVMiniGame) this.zy = new VVAdapter();
    else if (b.onQGMiniGame) this.zy = new QGAdapter();
    else this.zy = new WebAdapter();
    this.zy.init();
  }

  jy(): number {
    return this.zy.channelAppId;
  }

  canShare(): boolean {
    return this.zy.canShare;
  }

  async ou(t?: any): Promise<void> {
    console.log("[PlatMgr] runLoadScenePreloadTasks", this.zy);
    await this.zy.ou(t);
  }

  async lu(): Promise<void> {
    await this.zy.lu();
  }

  async cu(t?: any): Promise<boolean> {
    return await this.zy.cu(t);
  }

  pu(t?: any): void {
    this.zy.pu(t);
  }

  $y(s?: any): void {
    if (Date.now() - this.Wy < PlatformMgr.Ny) return;
    this.zy.pu(s, () => {
      this.Wy = Date.now();
    });
  }

  uu(t?: any, s?: any, i?: any): void {
    console.log("当前平台", this.zy);
    if (i) St.instance().Gy(i);
    j.instance().pause();
    this.zy.uu(
      () => {
        j.instance().resume();
        if (i) St.instance().Hy(i, true);
        if (t) t();
      },
      () => {
        j.instance().resume();
        if (i) St.instance().Hy(i, false);
        if (s) s();
      },
    );
  }

  yu(): void {
    this.zy.yu();
  }
  fu(): void {
    this.zy.fu();
  }
  gu(t?: any, s?: any): void {
    this.zy.gu(t, s);
  }
  Lu(): boolean {
    return this.zy.Lu();
  }
  qy(): boolean {
    return this.zy.ru;
  }
  du(): void {
    this.zy.du();
  }
  startGame(): void {
    this.yu();
  }
  gameOver(): void {
    this.fu();
  }
  async getUserInfo(): Promise<any> {
    return await this.zy.getUserInfo();
  }
  mu(): void {
    this.zy.mu();
  }
  wu(): void {
    this.zy.wu();
  }
  share(t?: any, s?: any, i?: any): void {
    if (this.canShare()) this.zy.share(t, s);
    else this.uu(t, s, i);
  }
  Vy(): void {
    this.zy.vu();
  }
  createImage(): any {
    return this.zy.createImage();
  }
  ku(): void {
    this.zy.ku();
  }

  // --- semantic aliases for the foundation callers ---
  /** Exit the container (`ku`). No-op in a web page. */
  exit(): void {
    this.ku();
  }
  /** LoadScene preload tasks (`ou`). */
  preloadTasks(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    return this.ou(onProgress);
  }
  /** Post-privacy startup tasks (`lu`). */
  startupTasks(): Promise<void> {
    return this.lu();
  }
}

/** Alias. (`Mt`/`bt`) */
export const Mt = PlatformMgr;
