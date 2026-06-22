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

const u = GameEvent;
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
  // 性能:非攻击单位的"找目标"扫描降频(累计 delta,达到间隔才扫描一次)。
  private scanAccum = 0;
  private static SCAN_INTERVAL = 120; // ms
  private static ENEMY_LIMIT = 120; // 同屏敌方单位上限(节流刷怪,防卡死)

  init(): void {
    this.dg = GameMgr.instance();
    this.xw = EnemySpatialMgr.instance();
    this.oX = EventMgr.instance;
    this.lX = this.dg.battleState;
  }
  startGame(): void {
    Oi.instance().clear();
    this.lX.gold += this.lX.pi;
    this.tX = 1;
    this.dg.battleState.ui = this.dg.enemy.wh[MathE.weightedIndex(this.dg.enemy.mh) as number];
    console.log("当前对局的敌人出兵策略", this.dg.battleState.ui);
    UpdateMgr.instance().register("BattleMgr", this, this.update);
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
    if (!TutorialMgr.instance().CY) this.xw.WA();
    if (this.lX.li) {
      if (this.lX.oi <= this.dg.enemy.nh.length) this.aX = this.dg.enemy.nh[this.lX.oi - 1];
      else this.aX = this.dg.enemy.nh[this.dg.enemy.nh.length - 1] + 2 * (this.lX.oi - this.dg.enemy.nh.length);
    } else this.aX = this.dg.enemy.nh[this.lX.oi - 1];
    this.nX = this.gX();
    this.rX = this.gX();
  }
  private fX(): void {
    if (this.hX < this.iX) return;
    // 性能:同屏单位过多时本波暂缓生成(节流),等场上单位消耗后再刷,避免卡死。
    if (this.xw.kw && this.xw.kw.size >= BattleMgr.ENEMY_LIMIT) {
      this.hX = 0;
      return;
    }
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
    return WeaponFragmentMgr.instance().iM() ? (MathE.range(0, this.aX, true) as number) : -1;
  }
  private cX(): void {
    this.hS = EntityRegistry.instance().hS;
    this.Qk = EntityRegistry.instance().Qk;
  }
  private pX(dt: number): void {
    const s = Date.now();
    // 性能:非攻击单位的找目标扫描降频到每 SCAN_INTERVAL 毫秒一次(而非每帧),
    // 大幅减少 lv() 空间查询次数;攻击中的查询已受攻击冷却控制,保持原样。
    this.scanAccum += dt;
    const doScan = this.scanAccum >= BattleMgr.SCAN_INTERVAL;
    if (doScan) this.scanAccum = 0;
    for (const t of this.hS.values()) {
      if (!t.mL || t.zd) continue;
      const i = t.Yn.x + t.Yn.width / 2;
      const h = t.Yn.y + t.Yn.height / 2;
      if (t.currentState !== "UnitAttack") {
        if (!doScan) continue;
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
    UpdateMgr.instance().unregister("BattleMgr");
    this.lX.oi = 0;
    this.hX = 0;
    this.eX = 0;
    this.aX = 0;
  }
}
