// ServerReportMgr — backend reporting / login / leaderboard fetch (the bundle's
// `st`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~6953-7096. On the web target there is no backend, so `path` stays "" (and
// `url` resolves to ""), making every `request` hit a relative URL that simply
// fails into its `fail` callback — i.e. all reporting is a harmless no-op, while
// the call surface stays 1:1 with the bundle. Opaque method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { MathE } from "../core/math-e";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const f = MathE;

export class ServerReportMgr extends Singleton {
  static wp = 1201;
  static kp = 1203;

  private path = "";
  private rp = false;
  private authentication = "";
  private op = 0;
  private lp = 3;
  private channelAppId = 0;

  get url(): string {
    return this.rp ? "" : this.path;
  }

  init(t: number): void {
    this.channelAppId = t;
  }

  cp(): number {
    return this.op;
  }

  request(t: string, s: any, i: any, h = "get"): void {
    const e = new Laya.HttpRequest();
    const a = ["Content-Type", "application/json", "authentication", this.authentication];
    e.http.timeout = 8000;
    e.send(this.url + t, s, h as any, "json", a);
    e.once(Laya.Event.COMPLETE, this, () => {
      const data = e.data;
      if (i.success) i.success(data);
    });
    e.once(Laya.Event.ERROR, this, (err: any) => {
      if (i.fail) i.fail(err);
    });
  }

  up(t: any, s: any, i: any): void {
    if (t)
      this.request(
        "sys/user/login",
        s,
        {
          success: (r: any) => {
            const auth = r && r.data && r.data.authentication;
            if (auth) this.authentication = auth;
            const e = r && r.data && typeof r.data.userId === "number" ? r.data.userId : 0;
            this.op = e;
            let n = "";
            if (r && r.data && r.data.attach) {
              const prov = r.data.attach.province;
              if (typeof prov === "string") n = prov;
            }
            F.instance().player.province = n.length > 0 ? n : "未知";
            if (i?.success) i.success(r);
            if (e > 0) y.instance.event(u.xs, e);
          },
          fail: (err: any) => {
            if (i?.fail) i.fail(err);
          },
        },
        "post",
      );
    else if (i?.fail) i.fail("login code is empty");
  }

  pp(t: any): void {
    this.request("zyyad/game/start", null, t, "get");
  }

  yp(t: boolean, s?: any): void {
    const i = F.instance().player.curStar;
    this.request("zyyad/game/end?star=" + i + "&win=" + (t ? 1 : 0), { skin: 1 }, s || {}, "get");
  }

  fp(t: any): void {
    this.request("zyyad/game/country/list?type=" + this.lp, null, t, "get");
  }

  gp(t: any): void {
    this.request("zyyad/game/province/detail/list?type=" + this.lp, null, t, "get");
  }

  dp(t: any): void {
    this.fp(t);
  }

  getTime(t: any): void {
    this.request("sys/server/time", null, t);
  }

  Lp(t: any): void {
    this.getTime({
      success: (s: any) => {
        const h = s && typeof s.data === "number" ? s.data : 0;
        if (f.daysBetween(h, F.instance().player.isGetLastRankReward) >= 1) this.request("bestRank", null, t);
      },
    });
  }

  mp(t: any): void {
    this.request(
      "sys/user/info",
      t,
      {
        success: (r: any) => {
          console.log("上传用户数据成功", r);
        },
        fail: (err: any) => {
          console.log("上传用户数据失败", err);
        },
      },
      "post",
    );
  }

  track(t: any[], s?: any): void {
    if (t && t.length !== 0)
      this.request(
        "sys/oa/point/add/new",
        t,
        {
          success: () => {
            if (s?.success) s.success();
          },
          fail: (err: any) => {
            if (s?.fail) s.fail(err);
          },
        },
        "post",
      );
  }
}

/** Alias. (`st`) */
export const st = ServerReportMgr;
