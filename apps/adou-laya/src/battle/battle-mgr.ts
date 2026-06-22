// BattleMgr — the per-frame battle driver (the bundle's `vn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~27219-27360. Runs the wave loop (delay → spawn N pairs → cooldown → next
// wave / lose) and, each frame, scans every soldier + general: assigns its
// target list (`Ew`) via the spatial mgr and flips it into UnitAttack when a
// target is in range + its cooldown elapsed. Opaque field names kept verbatim.
//
//   phase=tX  waveCount=aX  spawned=eX  startWave=yX  spawnTick=fX  attackTick=pX

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { MathE } from "../core/math-e";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { EntityRegistry } from "./entity-registry";
import { WeaponFragmentMgr } from "./weapon-fragment-mgr";
import { TutorialMgr } from "./tutorial-mgr";
import { CellReservationMgr } from "./cell-reservation-mgr";

const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const f = MathE;
const Ki = EntityRegistry;
const eh = WeaponFragmentMgr;
const wn = TutorialMgr;
const Oi = CellReservationMgr;

export class BattleMgr extends Singleton {
  private tX = 0;
  private sX = 5000;
  private iX = 1500;
  private hX = 0;
  private eX = 0;
  private aX = 0;
  private nX = -1;
  private rX = -1;
  private dg: any;
  private xw: any;
  private oX: any;
  private lX: any;
  private hS!: Map<number, any>;
  private Qk!: Map<number, any>;

  init(): void {
    this.dg = F.instance();
    this.xw = EnemySpatialMgr.instance();
    this.oX = y.instance;
    this.lX = this.dg.battleState;
  }
  startGame(): void {
    Oi.instance().clear();
    this.lX.gold += this.lX.pi;
    this.tX = 1;
    this.dg.battleState.ui = this.dg.enemy.wh[f.weightedIndex(this.dg.enemy.mh) as number];
    console.log("当前对局的敌人出兵策略", this.dg.battleState.ui);
    j.instance().register("BattleMgr", this, this.update);
    this.cX();
  }
  update(t: number): void {
    this.uX(t);
    this.pX(t);
  }
  private uX(t: number): void {
    this.hX += t;
    if (this.tX === 1) {
      if (this.hX >= this.lX.delayTime || (this.lX.Oi && this.lX.Yi)) {
        this.hX = 0;
        this.tX = 2;
        this.yX();
      }
    } else if (this.tX === 2) this.fX();
    else if (this.tX === 3 && this.hX >= this.sX) {
      this.hX = 0;
      if (this.lX.li) {
        this.tX = 2;
        this.yX();
      } else if (this.lX.oi >= this.lX.ci) {
        this.tX = 0;
        this.oX.event(u.l, true);
      } else {
        this.tX = 2;
        this.yX();
      }
    }
  }
  private yX(): void {
    this.hX = 0;
    this.lX.oi += 1;
    this.oX.event(u.Ft, true);
    this.oX.event(u.Jt);
    if (!wn.instance().CY) this.xw.WA();
    if (this.lX.li) {
      if (this.lX.oi <= this.dg.enemy.nh.length) this.aX = this.dg.enemy.nh[this.lX.oi - 1];
      else this.aX = this.dg.enemy.nh[this.dg.enemy.nh.length - 1] + 2 * (this.lX.oi - this.dg.enemy.nh.length);
    } else this.aX = this.dg.enemy.nh[this.lX.oi - 1];
    this.nX = this.gX();
    this.rX = this.gX();
  }
  private fX(): void {
    if (this.hX < this.iX) return;
    this.hX = 0;
    this.xw.rg(this.dg.map.re, true, this.nX === this.eX);
    this.xw.rg(this.dg.map.re, false, this.rX === this.eX);
    this.eX += 1;
    if (this.eX >= this.aX) {
      this.eX = 0;
      this.tX = 3;
    }
  }
  private gX(): number {
    return eh.instance().iM() ? (f.range(0, this.aX, true) as number) : -1;
  }
  private cX(): void {
    this.hS = Ki.instance().hS;
    this.Qk = Ki.instance().Qk;
  }
  private pX(_t: number): void {
    const s = Date.now();
    for (const t of this.hS.values()) {
      if (!t.mL || t.zd) continue;
      const i = t.Yn.x + t.Yn.width / 2;
      const h = t.Yn.y + t.Yn.height / 2;
      if (t.currentState !== "UnitAttack") {
        t.Ew = this.xw.lv(i, h, t.Da, t.qd);
        if (t.Ew && t.Ew.length > 0 && s - t.gL >= 1000 * t.dL) t.changeState("UnitAttack");
      } else if (t.currentState === "UnitAttack") {
        if (t.zd) {
          t.changeState("UnitIdle");
          continue;
        }
        if (s - t.gL >= 1000 * t.dL) {
          t.gL = s;
          t.Ew = this.xw.lv(i, h, t.Da, t.qd);
          if (!t.Ew || t.Ew.length <= 0) {
            t.changeState("UnitIdle");
            return;
          }
          t.attack();
        }
      }
    }
    for (const t of this.Qk.values()) {
      if (!t.mL) continue;
      const i = t.general.x + t.general.width / 2;
      const h = t.general.y + t.general.height / 2;
      if (t.currentState !== "UnitAttack") {
        t.Ew = this.xw.lv(i, h, t.Da, t.qd);
        if (t.Ew && t.Ew.length > 0 && s - t.gL >= 1000 * t.dL) t.changeState("UnitAttack");
      } else if (t.currentState === "UnitAttack" && s - t.gL >= 1000 * t.dL) {
        t.gL = s;
        t.Ew = this.xw.lv(i, h, t.Da, t.qd);
        if (!t.Ew || t.Ew.length <= 0) {
          t.changeState("GeneralIdle");
          return;
        }
        t.attack();
      }
    }
  }
  gameOver(): void {
    Laya.timer.clearAll(this);
    j.instance().unregister("BattleMgr");
    this.lX.oi = 0;
    this.hX = 0;
    this.eX = 0;
    this.aX = 0;
  }
}
