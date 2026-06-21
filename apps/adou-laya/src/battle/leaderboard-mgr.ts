// LeaderboardMgr — player rank progression + AI-opponent generation + the
// national/province leaderboards (the bundle's `Dn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~28416-28702. On game over it nudges the player's rank up/down (`tH`) and
// re-derives the star score; `eH` rolls the next opponent's rank, difficulty,
// weapon loadout, and win/lose record; `nH`/`rH` sync the player's profile; and
// the `LH`/`mH`/`cH` chain fetches + normalizes the server leaderboards (no-op on
// web). Opaque method / field names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { MathE } from "../core/math-e";
import { UpdateMgr } from "../core/update-mgr";
import { RankScoreMgr } from "./rank-score-mgr";
import { PlatformMgr } from "./platform-mgr";
import { ServerReportMgr } from "./server-report-mgr";
import { AvatarMgr } from "./avatar-mgr";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const f = MathE;
const j = UpdateMgr;
const En = RankScoreMgr;
const Mt = PlatformMgr;
const st = ServerReportMgr;
const In = AvatarMgr;

export class LeaderboardMgr extends Singleton {
  private isOpen = false;
  private jG: any = null;
  private $G: any = null;
  private NG = false;
  private qG = false;
  private playerRank: any = null;
  private Pi: any = { id: 0, rank: "军士.壹", level: 0, Ai: [], Ei: 0, win: 0, lose: 0, Bi: 0 };
  private VG = false;
  private da: any;
  private QG: any;

  init(): void {
    this.da = F.instance().rank.table;
    this.playerRank = F.instance().rank.currentRank;
    this.QG = F.instance().rank.lastRank;
    this.Pi = F.instance().battleState.Pi;
    this.ZG();
    this.KG();
    y.instance.off(u.xs, this, this.JG);
    y.instance.on(u.xs, this, this.JG);
  }

  startGame(): void {}

  gameOver(t: any): void {
    if (t) {
      this.tH(1);
      F.instance().player.lastLoseDifficulty = -1;
    } else {
      this.tH(-1);
      F.instance().player.lastLoseDifficulty = this.Pi.Ei;
    }
    this.sH();
  }

  sH(): void {
    this.NG = true;
    this.qG = true;
  }

  JG(_t: any): void {
    this.sH();
  }

  ZG(): void {
    this.iH();
  }

  iH(): void {
    const t = En.instance().SG(F.instance().player.curStar);
    this.playerRank.id = t.rank;
    this.playerRank.level = t.level;
    this.hH();
  }

  KG(): void {
    this.QG.id = this.playerRank.id;
    this.QG.rank = this.playerRank.rank;
    this.QG.level = this.playerRank.level;
  }

  tH(t: number): void {
    this.KG();
    this.playerRank.level += t;
    if (t > 0) {
      if (this.playerRank.level > F.instance().rank.table.get(this.playerRank.id).level) {
        if (this.playerRank.id !== 53) {
          this.playerRank.id += 1;
          this.hH();
        }
        if (this.playerRank.id <= 50) this.playerRank.level = 1;
      }
    } else if (this.playerRank.id > 50) {
      if (this.playerRank.level <= this.da.get(this.playerRank.id - 1).level) {
        this.playerRank.level = this.da.get(this.playerRank.id - 1).level;
        this.playerRank.id -= 1;
        this.hH();
      }
    } else if (this.playerRank.id > 0) {
      if (this.playerRank.level <= 0) {
        const prev = this.playerRank.id - 1;
        if (prev >= 0) this.playerRank.level = this.da.get(prev).level;
        this.playerRank.id -= 1;
        this.hH();
      }
    } else if (this.playerRank.level <= 0) this.playerRank.level = 1;
    F.instance().player.curStar = En.instance().bG(this.playerRank.id, this.playerRank.level);
  }

  hH(): void {
    this.playerRank.rank = this.da.get(this.playerRank.id).rank;
    this.playerRank.reward = this.da.get(this.playerRank.id).reward;
  }

  eH(): void {
    const t = this.playerRank.id;
    const s = this.playerRank.level;
    let i = 0;
    for (let k = 0; k < F.instance().rank.ya.length && t >= F.instance().rank.ya[k]; k++) i = k;
    const h = F.instance().rank.scoreRanges[f.weightedIndex(F.instance().rank.rewardTables[i])];
    let e = t < 50 ? 5 * t + s : 250 + s;
    const a = f.range(Math.max(e + h[0], 0), e + h[1] + 1, true);
    let n = 0;
    let r = 0;
    if (a > 250) {
      n = Math.min(53, 50 + Math.floor((a - 250) / 25));
      r = a - 250 - 25 * (n - 50);
    } else {
      n = Math.floor(a / 5);
      r = a - 5 * n;
    }
    const o = this.da.get(n);
    this.Pi.id = o.id;
    this.Pi.rank = o.rank;
    this.Pi.level = r;
    console.log("打印ai数据", this.Pi.rank, this.Pi.level);
    this.Pi.Ai.length = 0;
    this.aH(o.weapon0, o.weapon1, o.weapon2, o.weapon3, o.weapon4);
    if (j.instance().daysSinceRegister() >= 2 && F.instance().player.roundDay === 1) this.Pi.Ei = 1;
    else if (F.instance().player.lastLoseDifficulty !== -1 && Math.random() < 0)
      this.Pi.Ei = F.instance().player.lastLoseDifficulty;
    else this.Pi.Ei = f.weightedIndex(this.da.get(t).Ei);
    console.error("本局对手强度预估", this.Pi.Ei);
    this.Pi.Bi = f.range(30 + this.Pi.id + this.Pi.Ei, 40 + this.Pi.id + this.Pi.Ei);
    this.Pi.win = f.range(10 * this.Pi.id + 10, 15 * this.Pi.id + 10, true);
    this.Pi.lose = Math.floor((this.Pi.win - this.Pi.Bi * this.Pi.win) / this.Pi.Bi);
    F.instance().battleState.ki = this.Pi.Ei;
  }

  aH(t: number, s: number, i: number, h: number, e: number): void {
    const a: any[] = [];
    const n = (rarity: number, count: number) => {
      for (let k = 0; k < count; k++) {
        const idx = f.range(0, 5, true);
        const list = F.instance().weaponData.byRarityType[rarity][idx];
        const id = list[f.range(0, list.length, true)];
        if (id) a.push(id);
      }
    };
    n(4, e);
    n(3, h);
    n(2, i);
    n(1, s);
    n(0, t);
    const r: any[] = [];
    for (let k = 0; k < F.instance().generals.generalTypes.length; k++)
      r.push({ general: F.instance().generals.generalTypes[k].general, type: F.instance().generals.generalTypes[k].type });
    const o: any[] = [];
    for (let k = 0; k < a.length; k++) {
      o.length = 0;
      for (let s2 = 0; s2 < r.length; s2++)
        if (F.instance().weaponData.weapons.get(a[k]).type === r[s2].type)
          o.push({ general: r[s2].general, index: s2 });
      if (o.length > 0) {
        const pick = f.range(0, o.length, true);
        this.Pi.Ai.push({ general: o[pick].general, Hn: a[k] });
        r.splice(o[pick].index, 1);
      }
    }
  }

  async nH(): Promise<void> {
    const t = await Mt.instance().getUserInfo();
    if (t) this.rH(t);
    else this.oH();
  }

  rH(t: any): void {
    const s = F.instance().player;
    const i = t.nickName.length > 0 ? t.nickName : "无名";
    const h = In.instance().HG();
    const e = t.province.length > 0 ? t.province : s.province;
    const a = i !== s.nick || h !== s.avatarUrl || e !== s.province;
    s.nick = i;
    s.avatarUrl = h;
    s.province = e;
    if (!(!a && this.VG)) {
      st.instance().mp({ nk: i, av: h });
      this.VG = true;
    }
  }

  oH(): void {
    const t = F.instance().player;
    if (t.nick.length === 0) t.nick = "无名";
    if (t.avatarUrl.length === 0) t.avatarUrl = In.instance().HG();
  }

  lH(t: any): any {
    const s = En.instance().SG(F.instance().player.curStar);
    return {
      nick: F.instance().player.nick,
      avatar: In.instance().HG(),
      province: F.instance().player.province,
      ranking: t,
      rank: s.rank,
      level: s.level,
    };
  }

  cH(t: any): any {
    const s = this.lH(t.uH);
    const i = st.instance().cp();
    const h = t.pH.map((x: any) => ({ ...x }));
    if (i)
      for (let k = 0; k < h.length; k++)
        if (h[k].userId === i) {
          h[k].nick = s.nick;
          h[k].avatar = s.avatar;
          h[k].province = s.province;
          h[k].rank = s.rank;
          h[k].level = s.level;
        }
    return { pH: h, yH: s };
  }

  fH(): boolean {
    return this.NG || !this.jG;
  }

  gH(): boolean {
    return this.qG || !this.$G;
  }

  dH(t: boolean): any {
    const s = t ? this.jG : this.$G;
    return s ? this.cH(s) : null;
  }

  LH(t: boolean, s: any): void {
    const i = t ? this.NG : this.qG;
    const h = t ? this.jG : this.$G;
    if (!i && h) return void (s.success && s.success(this.cH(h)));
    const fetch: (cb: any) => void = t
      ? st.instance().fp.bind(st.instance())
      : st.instance().gp.bind(st.instance());
    fetch({
      success: (resp: any): void => {
        console.log(t ? "打印服务端全国榜数据" : "打印服务端省榜数据", resp);
        if (!resp || !resp.data) {
          if (s.fail) s.fail(resp);
          return;
        }
        const norm = this.mH(resp.data, t);
        if (t) {
          this.jG = norm;
          this.NG = false;
        } else {
          this.$G = norm;
          this.qG = false;
        }
        if (s.success) s.success(this.cH(norm));
      },
      fail: (err: any) => {
        if (s.fail) s.fail(err);
      },
    });
  }

  fp(t: any): void {
    this.LH(true, t);
  }

  gp(t: any): void {
    this.LH(false, t);
  }

  mH(t: any, s: boolean): any {
    const i: any[] = [];
    for (let h = 0; h < t.rankList.length; h++) {
      const e = t.rankList[h];
      const a = typeof e.star !== "number" || isNaN(e.star) ? 0 : e.star;
      const n = En.instance().SG(a);
      const r = e.info;
      const o = r && r.nk ? r.nk : "无名";
      const l = In.instance().WG(r && r.av ? r.av : "");
      const c = s ? (e.p ? e.p : e.province ? e.province : "未知") : F.instance().player.province;
      i.push({
        userId: e.userId,
        nick: o,
        avatar: l,
        province: c,
        ranking: typeof e.rank === "number" ? e.rank : h + 1,
        rank: n.rank,
        level: n.level,
      });
    }
    return { pH: i, uH: typeof t.rank === "number" ? t.rank : 0 };
  }
}

/** Alias. (`Dn`) */
export const Dn = LeaderboardMgr;
