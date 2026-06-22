// Skill — base class for a general's active/charging skill (the bundle's `Ye`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~21063-21141. A skill charges over attacks (`ZD`), activates when its
// threshold (`QD`) is reached (or immediately when 0), runs its effect and emits
// onSkillStart/onSkillEnd on the owning general. Concrete skills override the
// hooks (zD canActivate, onActive, ND deactivate, Zd setup, dT dispose). Opaque
// field names kept verbatim.
//
//   active=OD  autoActivate=YD  noInterrupt=XD  charge=GD  threshold=QD  owner=HD

/* eslint-disable @typescript-eslint/no-explicit-any */

import { EffectMgr } from "./effect-mgr";


export abstract class Skill {
  protected OD = false;
  protected YD = false;
  protected XD = false;
  protected GD = 0;
  protected QD = 0;
  protected uI: any[] = [];
  protected pI: any[] = [];
  protected HD: any;
  protected GI: any;
  /** Whether the skill is currently executing (read by General.attack). */
  JD?: boolean;
  /** Whether the skill takes over the attack frame (read by General.attack). */
  tT?: boolean;

  get name(): string {
    return (this.constructor as any).skillName;
  }
  get description(): string {
    return (this.constructor as any).description;
  }
  get isActive(): boolean {
    return this.OD;
  }
  get YL(): number {
    return 1 + 0.2 * this.HD.level;
  }

  activate(): void {
    if (!this.OD && this.HD.WD && this.zD()) {
      this.GD = 0;
      this.OD = true;
      this.onActive();
      EffectMgr.instance().playMergeEffect(this.HD.general, this.name);
      EffectMgr.instance().playAlertRings(this.HD.jD);
      this.HD.event("onSkillStart", this.name);
    }
  }
  $D(): void {
    if (this.OD) {
      this.OD = false;
      this.ND();
      this.HD.event("onSkillEnd", this.name);
    }
  }
  qD(): any {}
  VD(): void {
    if (this.YD && this.GD >= this.QD) this.activate();
  }
  ZD(): void {
    if (!this.OD) {
      this.GD++;
      if (!this.YD && this.GD >= this.QD) this.activate();
    }
  }
  initialize(t: any): void {
    this.HD = t;
    this.Zd();
    if (this.QD === 0) this.activate();
  }

  UI(t: any): any {
    this.uI.push(t);
    return t;
  }
  FI(t: any): void {
    this.pI.push(t);
  }
  OI(t?: any): void {
    if (t) {
      const s = this.uI.indexOf(t);
      if (s >= 0) this.uI.splice(s, 1);
    } else this.uI.length = 0;
  }
  YI(t?: any): void {
    if (t) {
      const s = this.pI.indexOf(t);
      if (s >= 0) this.pI.splice(s, 1);
    } else this.pI.length = 0;
  }
  XI(): void {
    this.GI = null;
  }
  HI(t: any): void {
    this.GI = t;
  }
  removeSelf(): void {
    this.GI?.call(this);
    this.uI.forEach((t) => t.kill(true));
    this.pI.forEach((t) => t.Am());
  }

  // Subclass hooks.
  protected zD(): boolean {
    return true;
  }
  protected onActive(): void {}
  protected ND(): void {}
  protected Zd(): void {}
  /** Dispose hook (called on general game-over). (`dT`) */
  dT(): void {}
}
