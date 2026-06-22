// BaseSoldier — concrete soldier with animation state machine (the bundle's `zs`).
//
// Faithful reconstruction of `zs` (reconstruction/reference/bundle.pretty.js
// lines ~10492-10620). Implements the Soldier hooks: builds an animated body
// (AnimPlayer), drives the idle/attack anim, computes attack power/range/speed,
// shows the range circle, and handles level merges. Per-type soldiers
// (knife/bow/pike/cavalry) extend this and set `vL` + attack specifics.
//
//   attPower=Ta range=Da attackInterval=dL attackRate=LL setupAnim=wL
//   playIdle=kL playAttack=_L showRange=SL hideRange=bL onBoard=mL

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Soldier } from "./soldier";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { AudioMgr } from "../core/audio-mgr";
import { AnimPlayer } from "./anim-player";
import { EffectMgr } from "./effect-mgr";

const evt = EventMgr.instance;
const u = GameEvent;

export class BaseSoldier extends Soldier {
  type = -1;
  /** Current attack target list; filled by the soldier-attack controller. (`Ew`) */
  Ew: any = [];
  protected fL = 1;
  protected gL = 0;
  protected mL = false;
  // 防卡死看门狗:攻击动画期间 mL(在场可行动)被置 false,靠动画 STOPPED 事件恢复;
  // 若动画被打断/替换而 STOPPED 未触发,mL 永久卡 false,BattleMgr.pX 的
  // `if(!t.mL||t.zd)continue` 会永远跳过它 → 士兵卡住不攻击。详见 update()。
  private _mlStuckMs = 0;
  private static MAX_ML_STUCK_MS = 3000; // 远大于士兵最长攻击动画
  protected root: any;
  protected vL: any; // anim id, set by per-type subclasses

  constructor() {
    super();
    this.objectType = 1;
    this.Id = 0;
    this.addAttPower = 0;
    this.pL = 0;
    this.yL = 0;
    this.fL = 1;
    this.level = 1;
    this.gL = 0;
  }

  /** Effective attack power. (`Ta`) */
  get Ta(): number {
    const t = this.Gd + this.addAttPower;
    return this.qd ? t : t * GameMgr.instance().battleState.xi;
  }

  /** Effective attack range (px). (`Da`) */
  get Da(): number {
    return this.Hd + this.pL * GameMgr.instance().map.gridWid;
  }

  /** Attack interval (ms), refreshing the attack playback rate. (`dL`) */
  get dL(): number {
    if (this.yL < 0) this.yL = 0;
    if (this.type === -1) this.fL = 0;
    else this.fL = GameMgr.instance().generals.soldierAttackConfigs[this.type].Ra / (this.Wd / (1 + this.yL));
    if (this.hL && this.currentState === "UnitAttack") this.hL.playbackRate(this.fL);
    return this.Wd / (1 + this.yL);
  }

  /** Attacks per ms. (`LL`) */
  get LL(): number {
    return 1 / this.dL;
  }

  protected onDragStart(): void {}
  protected onDragEnd(): void {}

  protected onMoved(): void {
    this.mL = this.Td === 1;
    this.changeState("UnitIdle");
  }

  protected Zd(type: any): void {
    const F = GameMgr.instance();
    this.type = F.generals.Aa.findIndex((s: any) => type === s);
    this.id = F.incCounter();
    this.root = this.Yn;
    this.Hd = F.generals.soldierAttackConfigs[this.type].Da * F.map.gridWid;
    this.Gd = F.generals.soldierAttackConfigs[this.type].Ta;
    this.Wd = F.generals.soldierAttackConfigs[this.type].Ra;
    this.Yn.name = "soldier_" + this.id;
    this.setupAnim();
    if (this.Td === 1) this.mL = true;
  }

  /** Build/attach the animated body and play idle. (`wL`) */
  protected setupAnim(): void {
    if (!this.hL) {
      this.hL = AnimPlayer.instance().pf(this.vL);
      this.hL.name = "sp";
    }
    this.Yn.addChild(this.hL);
    this.hL.visible = true;
    this.hL.play("zhan", true);
    this.hL.anchorX = 0.5;
    this.hL.anchorY = 0.5;
    this.hL.pos(this.dg.map.gridWid / 2, this.dg.map.gridHei / 2);
  }

  update(delta: number): void {
    // 防卡死兜底:在场士兵(Td===1)若 mL 持续 false 超过最长攻击动画时长,几乎一定是
    // 攻击动画的 STOPPED 恢复回调丢失导致的卡死,强制恢复可行动,避免士兵永久不攻击。
    // 不在场的士兵(手牌/队列,Td!==1)mL 本就为 false,不在此列。
    if (this.Td === 1 && !this.zd) {
      if (!this.mL) {
        this._mlStuckMs += delta;
        if (this._mlStuckMs >= BaseSoldier.MAX_ML_STUCK_MS) {
          this._mlStuckMs = 0;
          this.mL = true;
        }
      } else {
        this._mlStuckMs = 0;
      }
    }
    if (this.currentState === "UnitIdle") this.idle(delta);
  }

  protected sL(): void {
    switch (this.currentState) {
      case "UnitIdle":
        this.playIdle();
        break;
      case "UnitAttack":
        this.playAttack();
    }
  }

  protected iL(state: string): void {
    if (state === "UnitAttack") this.onAttackExit();
  }

  protected playIdle(): void {
    if (this.hL) {
      this.hL.playbackRate(1);
      this.hL.play("zhan", true);
    }
  }

  protected playAttack(): void {
    if (this.hL) this.hL.playbackRate(this.fL);
  }

  protected onAttackExit(): void {}

  /** Per-frame idle behaviour; attack subclasses override. (`idle`) */
  protected idle(_delta: number): void {}

  protected uL(): void {}

  /** Show the attack-range circle. (`SL`) */
  SL(): void {
    Laya.Point.TEMP.setTo(this.Yn.width / 2, this.Yn.height / 2);
    this.Yn.localToGlobal(Laya.Point.TEMP);
    EffectMgr.instance().toggleTargetCircle(true, this.Da, Laya.Point.TEMP.x, Laya.Point.TEMP.y);
  }

  /** Hide the attack-range circle. (`bL`) */
  bL(): void {
    EffectMgr.instance().toggleTargetCircle(false, 0, 0, 0);
  }

  resetData(): void {
    super.resetData();
    this.pL = 0;
    this.yL = 0;
  }

  protected cL(delta = 1, playEffect = true): void {
    super.cL(delta, playEffect);
    const F = GameMgr.instance();
    this.Wd = F.generals.soldierAttackConfigs[this.type].Ra / F.generals.hpMultipliers[this.level - 1];
    this.Gd = F.generals.soldierAttackConfigs[this.type].Ta * F.generals.atkMultipliers[this.level - 1];
    if (delta > 0) {
      evt.event(u.hs, this, 16);
      evt.event(u.hs, this, 17);
      evt.event(u.ns, this.id);
      this.event("onLevelChange", [this.level, true]);
      AudioMgr.instance().playSound("soldier_merge_upgrade");
    } else {
      this.event("onLevelChange", [this.level, false]);
    }
  }

  gameOver(): void {
    super.gameOver();
    this.mL = false;
    this.root = null;
    this.currentState = "UnitIdle";
    if (this.hL) {
      this.hL.rotation = 0;
      this.hL.offAll();
      this.hL.stop();
      this.hL.visible = false;
      AnimPlayer.instance().gf(this.hL, this.vL);
      this.hL.removeSelf();
      this.hL = null;
    }
  }
}
