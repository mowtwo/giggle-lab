// AnalyticsMgr — the offline-analytics point queue (the bundle's `St`/`xt`)
// plus the event-id tables (`Lt`/`mt`/`wt`/`vt`/`kt`/`_t`) and the ad-scene keys
// (`ut`..`dt`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~8185-8299. Game-flow and ad events are enqueued into a localStorage-backed
// queue and flushed to the server reporter (`st.track`) opportunistically. Each
// event has an `old`/`new` id pair, chosen by whether the player is past their
// first day (`Dy`). Opaque method / field names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { UpdateMgr } from "../core/update-mgr";
import { ServerReportMgr } from "./server-report-mgr";

const j = UpdateMgr;
const st = ServerReportMgr;

/** Ad-scene keys (passed to PlatformMgr.uu / share). (`ut`..`dt`) */
export const ut = "stamina_video";
export const pt = "gameover_double_gold";
export const yt = "shop_props_ad";
export const ft = "shop_lottery_ad";
export const gt = "battle_shovel_ad";
export const dt = "battle_bulldozer_ad";

/** Per-ad-scene click/ok/fail event-id pairs. (`Lt`) */
export const Lt: any = {
  stamina: {
    click: { old: 1, new: 2 },
    ok: { old: 3, new: 4 },
    fail: { old: 5, new: 6 },
  },
  gameoverDouble: {
    click: { old: 7, new: 8 },
    ok: { old: 9, new: 10 },
    fail: { old: 11, new: 12 },
  },
  shopProps: {
    click: { old: 13, new: 14 },
    ok: { old: 15, new: 16 },
    fail: { old: 17, new: 18 },
  },
  shopLottery: {
    click: { old: 19, new: 20 },
    ok: { old: 21, new: 22 },
    fail: { old: 23, new: 24 },
  },
  battleShovel: {
    click: { old: 25, new: 26 },
    ok: { old: 27, new: 28 },
    fail: { old: 29, new: 30 },
  },
  battleBulldozer: {
    click: { old: 31, new: 32 },
    ok: { old: 33, new: 34 },
    fail: { old: 35, new: 36 },
  },
};

/** Game-flow event-id pairs. (`mt`=start `wt`=win `vt`=lose `kt`=draw) */
export const mt = { old: 37, new: 38 };
export const wt = { old: 39, new: 40 };
export const vt = { old: 41, new: 42 };
export const kt = { old: 43, new: 44 };

/** Ad-scene key -> Lt table name. (`_t`) */
export const _t: any = {
  [ut]: "stamina",
  [pt]: "gameoverDouble",
  [yt]: "shopProps",
  [ft]: "shopLottery",
  [gt]: "battleShovel",
  [dt]: "battleBulldozer",
};

export class AnalyticsMgr extends Singleton {
  static Cy = "oaPointQueue";

  private By = false;

  /** Whether the player is on day 1 (uses `old` ids). (`Iy`) */
  Iy(): boolean {
    return j.instance().daysSinceRegister() === 1;
  }

  /** Pick the old/new id for an event by day. (`Dy`) */
  Dy(t: any): number {
    return this.Iy() ? t.new : t.old;
  }

  /** Flush the queue to the server. (`Ty`) */
  Ty(): void {
    if (this.By) return;
    const s = this.Ry();
    if (s.length === 0) return;
    const i = s.slice();
    this.By = true;
    st.instance().track(i, {
      success: () => {
        Laya.LocalStorage.removeItem(AnalyticsMgr.Cy);
        this.By = false;
      },
      fail: () => {
        this.By = false;
      },
    });
  }

  enqueue(t: number): void {
    const s = this.Ry();
    s.push(t);
    this.Uy(s);
  }

  Ry(): number[] {
    const s = Laya.LocalStorage.getItem(AnalyticsMgr.Cy);
    if (!s) return [];
    try {
      const t = JSON.parse(s);
      return Array.isArray(t) ? t : [];
    } catch {
      return [];
    }
  }

  Uy(s: number[]): void {
    Laya.LocalStorage.setItem(AnalyticsMgr.Cy, JSON.stringify(s));
  }

  /** Game start. (`Fy`) */
  Fy(): void {
    this.enqueue(this.Dy(mt));
  }
  /** Win. (`Oy`) */
  Oy(_t?: any): void {
    this.enqueue(this.Dy(wt));
  }
  /** Lose. (`Yy`) */
  Yy(_t?: any): void {
    this.enqueue(this.Dy(vt));
  }
  /** Draw. (`Xy`) */
  Xy(_t?: any): void {
    this.enqueue(this.Dy(kt));
  }
  /** Ad click. (`Gy`) */
  Gy(t: any): void {
    const s = Lt[_t[t]];
    this.enqueue(this.Dy(s.click));
  }
  /** Ad result. (`Hy`) */
  Hy(t: any, s: boolean): void {
    const i = Lt[_t[t]];
    this.enqueue(this.Dy(s ? i.ok : i.fail));
  }
}

/** Alias. (`St`/`xt`) */
export const St = AnalyticsMgr;
