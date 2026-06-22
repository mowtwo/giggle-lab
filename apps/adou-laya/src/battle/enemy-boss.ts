// EnemyBoss — base for the 12 boss generals (the bundle's `oh`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~15875-16040. A boss: bigger HP/speed pulled from the boss table, a periodic
// skill timer (fires `OP`/the skill event), an enrage hit on contact (`EP`/`BP`),
// a death ink-burst, and the `m_` enrage animation. Concrete bosses set their
// skill-anim names (`CP`/`FP`) + build the spine visual. Opaque names kept verbatim.
//
//   skillTimer=DP  skillInterval=Lh  enrageAnim=CP/FP  skill=OP  enrage=m_

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Enemy } from "./enemy";
import { GameMgr } from "../core/game-mgr";
import { PrefabFactory } from "./prefab-factory";
import { UpdateMgr } from "../core/update-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { EffectMgr } from "./effect-mgr";
import { MathE } from "../core/math-e";

const u = GameEvent;

export class EnemyBoss extends Enemy {
  protected dh = 0;
  protected DP = 0;
  protected Lh = 0;
  protected TP = 0;
  protected RP = 0;
  protected CP = "";
  protected FP = "";

  init(t: any): void {
    this.enemy = PrefabFactory.instance().getItem("boss", this);
    this.yM = true;
    super.init(t);
    const s = GameMgr.instance().bossHp(this.type, this.qd);
    this.Qi = s.uh;
    this.QM = s.uh;
    this.SM = s.speed;
    this.dh = s.dh * GameMgr.instance().map.gridWid;
    this.Lh = 1000 * s.Lh;
    this.qM.text = this.Qi.toFixed(0);
    this.KM.visible = false;
    this.enemy.visible = false;
    this.IP(() => {
      this.yP();
      UpdateMgr.instance().register("Enemy" + this.id, this, this.update);
      this.changeState(1);
      this.KM.visible = true;
    });
    if (Math.random() < 0.3) this.YM = true;
  }
  changeState(t: number): void {
    super.changeState(t);
  }
  update(t: number): void {
    super.update(t);
    if (this.curState !== 4 && this.curState !== 2) {
      this.DP += t;
      if (this.curState === 3) return;
      if (this.DP >= this.Lh) {
        this.DP = 0;
        Laya.Point.TEMP.x = 0;
        Laya.Point.TEMP.y = 0;
        this.enemy.localToGlobal(Laya.Point.TEMP);
        if (!EventMgr.instance.event(u.cs, this.id, this.qd, Laya.Point.TEMP.x, Laya.Point.TEMP.y)) this.OP();
      }
    }
  }
  protected cP(): void {
    if (this.IM) return;
    super.cP();
    let t = "#000000";
    if (this.type === 2) t = "#00aaff";
    else if (this.type === 1) t = "#00b500";
    else if (this.type === 0) t = "#bd1c01";
    EffectMgr.instance().playMobDead(this.enemy.parent, this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height / 2, t, 2);
    Laya.Tween.to(
      this.enemy,
      { alpha: 0 },
      100,
      null,
      Laya.Handler.create(this, () => {
        this.enemy.alpha = 1;
        this.enemy.visible = false;
        this.gameOver();
      }),
    );
  }
  EP(_t: any, _s: any, _i: any): void {
    this.BP();
  }
  BP(): void {
    this.hit(0.1 * this.VM, null);
    if (this.Qi > 0) this.changeState(1);
  }
  /** Enter the periodic skill state. (`OP`) */
  OP(): void {
    this.changeState(2);
  }
  /** Enrage animation + self-hit. (`m_`) */
  m_(): void {
    this.ZM.play(this.CP, false);
    Laya.timer.once(300, this, () => {
      this.ZM.stop();
      Laya.timer.once(200, this, () => {
        Laya.Point.TEMP.x = this.enemy.width / 2;
        Laya.Point.TEMP.y = this.enemy.height + 30;
        this.enemy.localToGlobal(Laya.Point.TEMP);
        EffectMgr.instance().playThunderStrike(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
        Laya.Tween.create(this.enemy)
          .to("rotation", -30)
          .duration(50)
          .chain()
          .to("rotation", 30)
          .duration(50)
          .chain()
          .to("rotation", 0)
          .duration(50)
          .delay(100)
          .then(() => {
            this.hit(this.VM * (MathE.range(0.1, 0.2) as number), null);
          }, this);
        this.ZM.play(this.FP, true);
      });
    });
  }
  gameOver(): void {
    UpdateMgr.instance().unregister("blownUp");
    Laya.timer.clearAll(this);
    super.gameOver();
    this.ZM.fb(Laya.Event.STOPPED);
    this.DP = 0;
    this.TP = 0;
    this.RP = 0;
    this.ZM.recover();
    this.ZM.removeSelf();
    this.ZM = null;
    PrefabFactory.instance().recover("boss", this.enemy);
  }
}
