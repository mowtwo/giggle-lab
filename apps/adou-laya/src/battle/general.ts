// General — a merged multi-character unit with an equipped weapon + skills.
//
// Faithful reconstruction of the bundle's `wa` (aliased `va`) —
// reconstruction/reference/bundle.pretty.js lines ~23256-23837. Built from 2+
// GeneralParts, it renders the merged portrait (or weapon anim), equips a weapon
// component (`QE`), runs the idle/attack state machine, levels up, and drives any
// attached skills (`PR`). The concrete per-general subclasses (with their `ov`
// attack + skills) extend this and register with GeneralMergeFactory. Opaque
// field / method names kept verbatim.
//
//   members=va  weapon=QE  weaponAnimL/R=bR/MR  skills=PR  bg=XR
//   levelUp=cL  addExp=RS  equipWeapon=BR  attackExec=ov(hook)

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameObject } from "./game-object";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { LayerZ } from "../core/layer-z";
import { UpdateMgr } from "../core/update-mgr";
import { MathE } from "../core/math-e";
import { EffectMgr } from "./effect-mgr";
import { PrefabFactory } from "./prefab-factory";
import { AnimPlayer } from "./anim-player";
import { WeaponMgr } from "./weapon-factory";
import { GeneralMergeFactory } from "./general-merge-factory";

const F = GameMgr;
const $ = AudioMgr;
const y = EventMgr;
const u = GameEvent;
const X = LayerZ;
const j = UpdateMgr;
const f = MathE;
const q = EffectMgr;
const z = PrefabFactory;
const Zt = AnimPlayer;
const ma = WeaponMgr;
const $a = GeneralMergeFactory;

export class General extends GameObject {
  objectType = 2;
  protected mL = true;
  Id = 0;
  addAttPower = 0;
  protected pL = 0;
  protected yL = 0;
  protected fL = 1;
  level = 1;
  maxLevel = 3;
  protected gL = 0;
  tD: any[] = [];
  SD = "";
  qa = 0;
  Ya = false;
  xR = false;
  protected WD = true;
  Fa: any = { Da: 0, Ta: 0, Ra: 10, Oa: 0, Ya: false };
  vL: any = null;
  weaponId = -1;
  SR = false;

  protected dg: any;
  general: any;
  protected root: any;
  va!: any[];
  QE: any;
  protected bR: any;
  protected MR: any;
  protected box: any;
  protected Vd: any;
  protected rightWord: any;
  protected leftWord: any;
  protected XR: any;
  protected jD: any;
  protected type = 0;
  qd: any;
  protected cT: any;
  protected currentState: any;
  PR: any;
  Ew: any;
  protected Hd = 0;
  protected Gd = 0;
  protected Wd = 0;

  static FR = "#cd8831";
  static OR = "#be74de";
  static UR = "#319ef5";
  static YR = "#ffffff";

  update(): void {}

  get jd(): boolean {
    return this.va.every((t) => t.jd);
  }
  set jd(t: boolean) {
    this.va.forEach((s) => {
      s.jd = t;
    });
  }
  get Ta(): number {
    const t = this.Gd + this.addAttPower;
    return this.qd ? t : t * this.dg.battleState.xi;
  }
  get centerX(): number {
    return this.general.x + this.general.width / 2;
  }
  get centerY(): number {
    return this.general.y + this.general.height / 2;
  }
  get Da(): number {
    return this.Hd + this.pL * this.dg.map.gridWid;
  }
  get dL(): number {
    if (this.yL < 0) this.yL = 0;
    this.fL = this.Fa.Ra / (this.Wd / (1 + this.yL));
    if (this.currentState === "UnitAttack" && this.vL) {
      this.bR.playbackRate(this.fL);
      this.MR.playbackRate(this.fL);
    }
    return this.Wd / (1 + this.yL);
  }
  get LL(): number {
    return 1 / this.dL;
  }
  get NP(): any {
    return this.PR;
  }

  init(t: any[], s: any, i: number): void {
    this.dg = F.instance();
    const h = this.dg.map.gridWid;
    const e = this.dg.map.gridHei;
    this.id = this.dg.incCounter();
    this.type = i;
    this.xR = i === -1;
    if (t[0].Td !== 5) {
      if (this.xR) $.instance().playSound("merge_civilian");
      else $.instance().playSound("merge_general");
    }
    if (this.type === -1) {
      this.SD = "";
      for (let s2 = 0; s2 < t.length; s2++) this.SD += t[s2].Qd;
    } else this.SD = this.dg.generals.generalNames[this.type];
    this.qd = s;
    y.instance.event(u.m, this.id, this);
    if (!this.general) {
      this.general = new Laya.Sprite();
      this.root = this.general;
      this.general.name = "general_" + this.id;
      this.general.size(t.length * h, e);
    }
    this.Fa = this.dg.generals.generalAttackConfig(this.type);
    this.Hd = this.Fa.Da * h;
    this.Gd = this.Fa.Ta;
    this.Wd = this.Fa.Ra;
    this.Ya = this.Fa.Ya;
    this.maxLevel = this.Ya ? 5 : 3;
    this.va = t;
    this.general.zIndex = this.SR
      ? X.Qr
      : X.entityZIndexFromPixelY(this.general.y, F.instance().map.gridHei);
    this.general.pos(t[0].Yn.x, t[0].Yn.y);
    if (t[0].Td === 5) {
      this.SR = true;
      y.instance.event(u.ss, this.general);
    } else y.instance.event(u.bt, this.general);
    this.AR();
    this.box = new Laya.Sprite();
    this.box.size(this.general.width, this.general.height);
    this.box.pos(this.box.width / 2, this.box.height / 2);
    this.box.anchorX = 0.5;
    this.box.anchorY = 0.5;
    this.general.addChild(this.box);
    this.Vd = new Laya.FontClip();
    if (this.xR) this.Vd.skin = "resources/img/gameObject/bitmapFont/number6.png";
    else if (this.Ya) this.Vd.skin = "resources/img/gameObject/bitmapFont/number8.png";
    else this.Vd.skin = "resources/img/gameObject/bitmapFont/number7.png";
    this.Vd.value = this.level.toString();
    this.Vd.size(20, 20);
    this.Vd.sheet = "12345";
    this.Vd.pos(this.general.width - this.Vd.width, 0);
    this.Vd.zIndex = X.Tr;
    this.general.addChild(this.Vd);
    this.rightWord = new Laya.Sprite();
    this.rightWord.size(h, e);
    this.rightWord.anchor(0.5, 1);
    this.box.addChild(this.rightWord);
    this.rightWord.pos((h / 2) * 3, e);
    this.leftWord = new Laya.Sprite();
    this.leftWord.size(h, e);
    this.leftWord.anchor(0.5, 1);
    this.box.addChild(this.leftWord);
    this.leftWord.pos(h / 2, e);
    this.leftWord.addChild(t[0].Yn);
    this.rightWord.addChild(t[1].Yn);
    for (let s2 = 0; s2 < t.length; s2++) {
      t[s2].Yn.pos(0, 0);
      this.qa += t[s2].qa;
      if (this.pL < t[s2].pL) this.pL = t[s2].pL;
      if (this.yL < t[s2].yL) this.yL = t[s2].yL;
      t[s2].Vd.visible = false;
    }
    if (this.vL) {
      this.bR = Zt.instance().pf(this.vL);
      this.MR = Zt.instance().pf(this.vL);
      this.bR.showSkinByName("1");
      this.MR.showSkinByName("1");
      this.bR.pos(40, 80);
      this.MR.pos(40, 80);
      this.leftWord.addChild(this.bR);
      this.rightWord.addChild(this.MR);
      for (let t2 = 0; t2 < this.va.length; t2++) this.va[t2].hL.visible = false;
    } else {
      for (let s2 = 0; s2 < t.length; s2++) {
        const i2 = t[s2].hL;
        const h2 = F.instance().generals.nameChars.indexOf(this.va[s2].Qd);
        if (this.level === 4 || this.level === 5)
          i2.skin = "resources/img/gameObject/soldier/generalParts_" + h2 + "_" + this.level + ".png";
        else i2.skin = "resources/img/gameObject/soldier/generalParts_" + h2 + ".png";
        i2.anchor(0.5, 1);
        i2.pos(40, 80);
      }
      this.ER();
    }
    this.changeState("GeneralIdle");
    j.instance().register("GeneralBase" + this.id, this, this.update);
    if (!this.SR) {
      Laya.Point.TEMP.x = this.general.width / 2;
      Laya.Point.TEMP.y = this.general.height / 2;
      this.general.localToGlobal(Laya.Point.TEMP);
      q.instance().playGeneralMergeTip(Laya.Point.TEMP.x, Laya.Point.TEMP.y, !this.xR);
    }
    this.BR();
    if (this.PR) for (const t2 of this.PR) t2.initialize(this);
    this.on("onSkillStart", this.IR, this);
  }

  protected IR(_t: any): void {}

  SL(): void {
    const t = this.general;
    Laya.Point.TEMP.setTo(this.general.width / 2, this.general.height / 2);
    t.localToGlobal(Laya.Point.TEMP);
    q.instance().toggleTargetCircle(true, this.Da, Laya.Point.TEMP.x, Laya.Point.TEMP.y);
  }
  bL(): void {
    q.instance().toggleTargetCircle(false);
  }

  changeState(t: string): void {
    this.iL();
    this.currentState = t;
    this.sL();
  }
  protected sL(): void {
    switch (this.currentState) {
      case "GeneralIdle":
        this.kL();
        this.QE?.changeState(0);
        break;
      case "UnitAttack":
        this._L();
        this.QE?.changeState(1);
    }
    this.event("onStateChange", this.currentState);
  }
  protected iL(): void {
    switch (this.currentState) {
      case "GeneralIdle":
        this.DR();
        break;
      case "UnitAttack":
        this.xL();
    }
  }
  protected kL(): void {
    if (this.vL) {
      this.bR.playbackRate(1);
      this.MR.playbackRate(1);
      this.bR.play("zhan1", true);
      this.MR.play("zhan2", true);
    } else this.TR();
  }
  protected TR(): void {
    for (let t = 0; t < this.va.length; t++) {
      const s = this.va[t].hL;
      Laya.Tween.to(
        s,
        { scaleX: 1.04, scaleY: 0.92 },
        300,
        null,
        Laya.Handler.create(this, () => {
          Laya.Tween.to(s, { scaleX: 1, scaleY: 1 }, 300);
        }),
      );
    }
    Laya.timer.once(600, this, this.TR);
  }
  protected DR(): void {
    if (this.vL) {
      // weapon anim handled by the weapon component
    } else {
      Laya.timer.clear(this, this.TR);
      for (let t = 0; t < this.va.length; t++) {
        Laya.Tween.killAll(this.va[t].hL);
        this.va[t].hL.scale(1, 1);
      }
    }
  }
  protected _L(): void {
    if (this.vL) {
      this.bR.playbackRate(this.fL);
      this.MR.playbackRate(this.fL);
    }
  }
  protected RR(): void {
    if (this.vL) {
      this.bR.play("attack1", false);
      this.MR.play("attack2", false);
    } else
      for (let t = 0; t < this.va.length; t++)
        Laya.Tween.create(this.va[t].hL)
          .to("rotation", -3)
          .to("scaleX", 1.04)
          .to("scaleY", 0.95)
          .duration(150)
          .timeScale(this.fL)
          .chain()
          .to("rotation", -2)
          .to("scaleX", 0.97)
          .to("scaleY", 1.05)
          .duration(120)
          .timeScale(this.fL)
          .chain()
          .to("rotation", 0)
          .to("scaleX", 1.04)
          .to("scaleY", 0.89)
          .duration(120)
          .timeScale(this.fL)
          .chain()
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(210)
          .timeScale(this.fL);
  }

  attack(): void {
    if (!this.SR || this.weaponId !== -1) {
      if (this.PR) {
        const t: any[] = [];
        let s = false;
        let i = false;
        for (const h of this.PR)
          if ((h.VD(), h.isActive && h.JD)) {
            i = true;
            if (!h.XD) this.event("onSkillInterruptAttack", h.name);
            if (h.tT) s = true;
            const e = h.qD();
            if (e) t.push(e);
          }
        if (i) {
          if (!s)
            Promise.all(t).then(() => {
              this.RR();
              this.event("onAttack");
              this.ov();
            });
          return;
        }
      }
      this.RR();
      this.event("onAttack");
      this.ov();
      if (this.PR) for (const t of this.PR) t.ZD();
    }
  }

  /** Hook: concrete general subclasses execute the weapon attack. (`ov`) */
  protected ov(): void {}

  protected xL(): void {}

  /** Add exp + level up accordingly. (`RS`) */
  RS(t: number, s = true): void {
    if (!this.Ya && this.level === this.dg.generals.Ha.length) return;
    this.Id += t;
    if (this.Id < 0) this.Id = 0;
    for (let k = 0; k < this.va.length; k++) this.va[k].Id = this.Id;
    let i = 1;
    const h = this.Ya ? this.dg.generals.Wa : this.dg.generals.Ha;
    let e = 0;
    for (let k = h.length - 1; k >= 0; k--) {
      if (this.Id >= h[k]) {
        i = k + 1;
        break;
      }
      e = h[k];
    }
    this.event("onExpChange", [this.Id, e]);
    const a = i - this.level;
    if (a) this.cL(a, s);
  }

  cL(t = 1, s = true): void {
    const i = t > 0;
    const h = Math.min(5, Math.max(this.level + t, 1));
    if (h === this.level) return;
    this.level = h;
    const e = this.dg.generals;
    this.Wd = this.Fa.Ra / e.multC[this.level - 1];
    this.Gd = (this.Fa.Ta + this.QE.aI) * e.multD[this.level - 1];
    this.Vd.value = this.level.toString();
    for (const t2 of this.va) t2.cL(this.level - t2.level, s);
    if (i) {
      y.instance.event(u.ns, this.id);
      this.event("onLevelChange", [h, true]);
      $.instance().playSound("general_level_up");
    } else this.event("onLevelChange", [h, false]);
    if (this.Ya) {
      if (this.vL) {
        if (h === 4) {
          this.bR.showSkinByName("2");
          this.MR.showSkinByName("2");
        } else if (h === 5) {
          this.bR.showSkinByName("3");
          this.MR.showSkinByName("3");
        } else {
          this.bR.showSkinByName("1");
          this.MR.showSkinByName("1");
        }
      } else
        for (let t2 = 0; t2 < this.va.length; t2++) {
          const sp = this.va[t2].hL;
          const idx = F.instance().generals.nameChars.indexOf(this.va[t2].Qd);
          sp.skin =
            h === 4 || h === 5
              ? "resources/img/gameObject/soldier/generalParts_" + idx + "_" + h + ".png"
              : "resources/img/gameObject/soldier/generalParts_" + idx + ".png";
        }
      this.ER();
    }
  }

  protected ER(): void {
    const t = this.CR();
    for (let s = 0; s < this.va.length; s++) {
      const i = this.va[s].hL;
      if (i && "color" in i) i.color = t;
    }
  }
  protected CR(): string {
    return !this.Ya || (this.level !== 4 && this.level !== 5)
      ? this.xR
        ? General.UR
        : this.Ya
          ? General.FR
          : General.OR
      : General.YR;
  }

  protected AR(): void {
    this.XR = z.instance().getItem("generalBg", this);
    this.jD = this.XR.getChildAt(0);
    this.XR.zIndex = X.dr;
    this.jD.zIndex = X.dr;
    if (this.xR) {
      this.XR.skin = "resources/img/gameObject/soldier/civilianBg1.png";
      this.jD.skin = "resources/img/gameObject/soldier/civilianBg2.png";
    } else if (this.Ya) {
      this.XR.skin = "resources/img/gameObject/soldier/generalBg1.png";
      this.jD.skin = "resources/img/gameObject/soldier/generalBg2.png";
    } else {
      this.XR.skin = "resources/img/gameObject/soldier/generalBg3.png";
      this.jD.skin = "resources/img/gameObject/soldier/generalBg4.png";
    }
    y.instance.event(u.Wt, this.id, this.XR, this.general.x, this.general.y);
  }

  /** Equip / swap the weapon component. (`BR`) */
  BR(t?: any, s?: any): void {
    let i = 0;
    if (this.QE) {
      i = this.QE.aI;
      this.QE.MI();
      ma.instance()._R(this.QE);
      this.QE = null;
    }
    if (this.type === -1) this.cT = 2;
    else this.cT = t != null ? t : this.dg.generals.generalTypes[this.type].type;
    const h = s != null ? s : this.weaponId;
    this.QE = ma.instance().vR(this.cT, h);
    this.weaponId = this.SR ? h : this.QE.weaponId;
    this.QE.mI(this);
    const e = this.QE.aI;
    if (e > i) {
      q.instance().playArrowRainUp(this.general);
      q.instance().showFloatingText(this.general, "攻击提升", false);
    } else if (e < i) {
      q.instance().playArrowRainDown(this.general);
      q.instance().showFloatingText(this.general, "攻击降低", true);
    }
    this.Gd += this.QE.aI;
    if (this.SR) this.mL = this.weaponId !== -1;
  }

  /** Target with the smallest Aw. (`GR`) */
  GR(): any {
    let t = this.Ew[0];
    if (!t) {
      console.error("敌人消失了,可能被打死了这会");
      return null;
    }
    let s = t.Aw;
    for (let i = 1; i < this.Ew.length; i++) if (this.Ew[i].Aw < s) ((t = this.Ew[i]), (s = t.Aw));
    return t;
  }

  /** Closest target by squared distance to the weapon. (`uT`) */
  uT(): any {
    const t = this.QE.Hn;
    const s = Laya.Point.TEMP.setTo(t.pivotX, t.pivotY);
    this.dg.toLocal(t, s);
    let i = this.Ew[0];
    if (!i) {
      console.error("敌人消失了, 可能被打死了这会");
      return null;
    }
    const h = this.dg.map.gridWid / 2;
    const e = this.dg.map.gridHei / 2;
    let a = f.distanceSq(s, { x: i.x + h, y: i.y + e });
    for (let t2 = 1; t2 < this.Ew.length; t2++) {
      const n = f.distanceSq(s, { x: this.Ew[t2].x + h, y: this.Ew[t2].y + e });
      if (n < a) {
        i = this.Ew[t2];
        a = n;
      }
    }
    return i;
  }

  /** Base attribute by type (att/range/speed). (`Dg`) */
  Dg(t: number): any {
    return t === 0 ? this.Gd : t === 2 ? this.Hd / this.dg.map.gridWid : t === 1 ? 1 : undefined;
  }
  /** Apply an attribute delta. (`Tg`) */
  Tg(t: number, s: number): void {
    if (t === 0) this.addAttPower += s;
    else if (t === 2) this.pL += s;
    else if (t === 1) this.yL += s;
  }
  setState(_t: any, _s: any, _i: any): void {}

  protected pg(): any {
    return this.general;
  }

  gameOver(): void {
    super.gameOver();
    if (this.PR) for (const t of this.PR) ((t.removeSelf(), t.dT()));
    let t: any;
    this.QE.MI();
    j.instance().unregister("GeneralBase" + this.id);
    y.instance.event(u.es, this.id);
    Laya.timer.clearAll(this);
    y.instance.event(u._, this.id);
    Laya.Tween.killAll(this.box, true);
    Laya.Tween.killAll(this.general, true);
    this.DR();
    this.va.forEach((t2) => {
      t2.jd = false;
    });
    for (let s = this.va.length - 1; s >= 0; s--) {
      t = this.va[s];
      const i = F.instance().generals.nameChars.indexOf(this.va[s].Qd);
      t.hL.skin = "resources/img/gameObject/soldier/generalParts_" + i + ".png";
      t.hL.alpha = 1;
      t.hL.visible = true;
      t.hL.color = "#cd8831";
      if (t.Yn.parent !== this.general.parent) {
        Laya.Point.TEMP.x = t.Yn.x;
        Laya.Point.TEMP.y = t.Yn.y;
        t.Yn.parent.localToGlobal(Laya.Point.TEMP);
        t.Yn.removeSelf();
        if (this.SR) y.instance.event(u.ss, t.Yn, t.Cd.x, t.Cd.y);
        else y.instance.event(u.bt, t.Yn);
        t.Yn.parent.globalToLocal(Laya.Point.TEMP);
        t.Yn.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
        t.Vd.visible = true;
      }
    }
    if (this.vL) {
      this.bR.playbackRate(1);
      this.MR.playbackRate(1);
      this.bR.removeSelf();
      this.MR.removeSelf();
      Zt.instance().gf(this.bR, this.vL);
      Zt.instance().gf(this.MR, this.vL);
    } else
      for (let t2 = 0; t2 < this.va.length; t2++) {
        this.va[t2].hL.anchorY = 0.5;
        this.va[t2].hL.y -= 40;
        Laya.Tween.killAll(this.va[t2]);
      }
    this.vL = null;
    this.root = null;
    this.general.removeSelf();
    this.yL = 0;
    this.pL = 0;
    this.addAttPower = 0;
    ma.instance()._R(this.QE);
    this.XR.removeSelf();
    z.instance().recover("generalBg", this.XR);
    this.resetForPool();
    $a.HR(this);
  }

  protected resetForPool(): void {
    this.va = null as any;
    this.general = null;
    this.QE = null;
    this.weaponId = -1;
    this.SR = false;
    this.xR = false;
    this.Ya = false;
    this.level = 1;
    this.Id = 0;
    this.mL = true;
    this.currentState = null;
    this.vL = null;
    this.bR = null;
    this.MR = null;
    this.root = null;
    this.box = null;
    this.leftWord = null;
    this.rightWord = null;
    this.Vd = null;
    this.XR = null;
    this.jD = null;
    this.Fa = { Da: 0, Ta: 0, Ra: 10, Oa: 0, Ya: false };
    this.SD = "";
    this.qa = 0;
    this.Hd = 0;
    this.Gd = 0;
    this.Wd = 0;
    this.yL = 0;
    this.pL = 0;
    this.addAttPower = 0;
    this.fL = 1;
    this.maxLevel = 3;
    this.gL = 0;
    this.Ew = null;
    this.tD = [];
  }
}
