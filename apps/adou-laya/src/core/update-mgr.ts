// UpdateMgr — central frame-loop ticker.
//
// Faithful reconstruction of the original bundle's `j` class
// (reconstruction/reference/bundle.pretty.js lines ~3995-4030). Runs one
// Laya frame loop and fans a capped delta (<=80ms) out to every registered
// system's update callback. Systems register/unregister by name (EffectMgr,
// loadMask, ...). Supports global pause/resume.
//
// Original member -> name:
//   paused=ho  callbacks=ao  lastTime=no  elapsed=eo  register=ro
//   unregister=co  daysSinceRegister=uo

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";
import { MathE } from "./math-e";
import { SaveMgr } from "./save-mgr";

interface UpdateEntry {
  fn: (delta: number) => void;
  caller: any;
}

export class UpdateMgr extends Singleton {
  private paused = false;
  delta = 0;
  private elapsed = 0;
  private callbacks = new Map<string, UpdateEntry>();
  private lastTime = 0;
  serverTime = 0;

  init(): void {
    Laya.timer.frameLoop(1, this, this.update);
    this.lastTime = 0;
  }

  /** Register (replacing any existing) a named per-frame update callback. (`ro`) */
  register(name: string, caller: any, fn: (delta: number) => void): void {
    if (this.callbacks.has(name)) this.callbacks.delete(name);
    this.callbacks.set(name, { fn, caller });
  }

  /** Unregister a named callback. (`co`) */
  unregister(name: string): void {
    this.callbacks.delete(name);
  }

  update(): void {
    if (this.paused) return;
    const now = Laya.timer.currTimer;
    this.delta = Math.min(80, now - this.lastTime);
    for (const [, entry] of this.callbacks) entry.fn.call(entry.caller, this.delta);
    this.lastTime = now;
    this.elapsed += this.delta;
  }

  resume(): void {
    Laya.timer.resume();
    this.paused = false;
  }

  pause(pauseTimer = true): void {
    this.paused = true;
    if (pauseTimer) Laya.timer.pause();
  }

  /**
   * Days since the player registered, +1. The original read
   * `F.instance().player.registerTime`; `F.player` is the SaveMgr instance. (`uo`)
   */
  daysSinceRegister(): number {
    return MathE.daysBetween(SaveMgr.instance().registerTime, Date.now()) + 1;
  }
}
