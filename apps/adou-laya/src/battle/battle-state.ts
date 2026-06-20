// BattleState — per-battle mutable state (lives, gold, flags, special props).
//
// Faithful reconstruction of the original bundle's `d` class (game hub F.Xn),
// reconstruction/reference/bundle.pretty.js lines ~467-590. This is dense battle
// bookkeeping: most fields are opaque flags/counters kept VERBATIM (consumed by
// battle code not yet ported; renaming risks drift). The clear accessors are
// de-mangled and keep the original change events.
//
//   playerLives=Li (accessor Qi)  enemyLives=Si (accessor Zi)  gold=_gold
//   initialPlayerLives=mi  initialEnemyLives=bi  enemyLivesEnabled=wi
//   rankInfo=Pi  Ki=Mi accessor

/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";

export class BattleState {
  oi = 0;
  li = false;
  ci = 20;
  ui: any[] = [];
  pi = 20;
  yi = 10;
  fi = 10;
  gi = false;
  di = "无";
  Li = 3; // player lives
  mi = 3; // initial player lives
  _gold = 0;
  props: any = null;
  wi = true; // enemy lives enabled
  ki = 0;
  xi = 1;
  Si = 3; // enemy lives
  bi = 3; // initial enemy lives
  Mi = 0;
  Pi = { id: 0, rank: "军士.壹", level: 0, Ai: [] as any[], Ei: 0, win: 0, lose: 0, Bi: 0 };
  Ii = { Di: false, num: 0, range: 0, pos: { x: 0, y: 0 } };
  Ti = { Di: false, num: 0, range: 0, pos: { x: 0, y: 0 } };
  Ri = false;
  Ci = false;
  Ui = false;
  Fi = false;
  delayTime = 10000;
  Oi = false;
  Yi = false;
  Xi = false;
  Gi = false;
  Hi = false;
  Wi: any[] = [];
  zi: any[] = [];
  ji: any[] = [];
  $i: any[] = [];
  Ni: Record<string, any> = {};
  qi: Record<string, any> = {};
  Vi = false;

  /** Player lives. Setter fires the life-change event and the lose event at 0. (`Qi`) */
  get playerLives(): number {
    return this.Li;
  }
  set playerLives(t: number) {
    const diff = t - this.Li;
    this.Li = t;
    EventMgr.instance.event(GameEvent.Tt, true, diff);
    if (this.Li <= 0) EventMgr.instance.event(GameEvent.l, false);
  }

  get gold(): number {
    return this._gold;
  }
  set gold(t: number) {
    this._gold = t;
    EventMgr.instance.event(GameEvent.It);
  }

  /** Enemy lives. Guarded by enemyLivesEnabled; fires life-change + win at 0. (`Zi`) */
  get enemyLives(): number {
    return this.Si;
  }
  set enemyLives(t: number) {
    if (!this.wi) return;
    const diff = t - this.Si;
    this.Si = t;
    EventMgr.instance.event(GameEvent.Tt, false, diff);
    if (this.Si <= 0) EventMgr.instance.event(GameEvent.l, true);
  }

  get Ki(): number {
    return this.Mi;
  }
  set Ki(t: number) {
    this.Mi = t;
  }

  startGame(): void {
    this.Vi = false;
    this.delayTime = this.wi ? 10000 : 0;
  }

  gameOver(): void {
    this.yi = 10;
    this.fi = 10;
    this.oi = 0;
    this.Li = this.mi;
    this._gold = 0;
    this.props = null;
    this.Si = this.bi;
    this.Mi = 0;
    this.Ii.Di = false;
    this.Ti.Di = false;
    this.Ri = false;
    this.Ci = false;
    this.Ui = false;
    this.Fi = false;
    this.Oi = false;
    this.Yi = false;
    this.xi = 1;
    this.Xi = false;
    this.Gi = false;
    this.Hi = false;
    this.zi.length = 0;
    this.ji.length = 0;
    this.$i.length = 0;
    this.Ni = {};
    this.qi = {};
  }
}
