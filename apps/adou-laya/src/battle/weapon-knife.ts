// Knife weapons (type 2) — archetype `Pe` + its 10 concrete blades.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~20307-21077. `KnifeWeaponBase` (Pe) draws the blade, runs a downward slash
// (`bD`) or a wide sweep (`MD`) with a trailing after-image, and the idle bob.
// Concrete blades tune the trail offset + add their on-hit effects (stun, gold,
// wolf/tiger roar speed buffs, meteor rain, blade-qi). Opaque field names kept
// verbatim.
//
//   KnifeWeaponBase=Pe  slash=bD  sweep=MD

/* eslint-disable @typescript-eslint/no-explicit-any */

import { WeaponComponent } from "./weapon-component";
import { WeaponFactory } from "./weapon-factory";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { BuffMgr } from "./buff-mgr";
import { EffectMgr } from "./effect-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { EntityRegistry } from "./entity-registry";
import { BulletEvent } from "./bullet-movement";
import { KnifeBullet } from "./bullets-area";
import { DaoQiBullet, StarBullet, ExplosionBehavior } from "./bullet-variants";
import { TargetPositionBezierMovement, TargetDirectionLineMovement } from "./movements";

const $ = AudioMgr;
const ai = BulletEvent;
const yi = KnifeBullet;
const te = DaoQiBullet;
const se = StarBullet;
const jh = ExplosionBehavior;
const Fe = TargetPositionBezierMovement;
const Kh = TargetDirectionLineMovement;

export class KnifeWeaponBase extends WeaponComponent {
  protected rD = true;
  protected pm = false;
  protected fD: any = undefined;
  protected gD: any = null;
  protected Ca = 0;
  protected dD = 0;
  protected LD = 60;
  protected wD = 60;
  protected Mm = 0;
  protected ZI = "";
  protected _D: any;
  protected xD: any;
  protected hD = -1;
  protected mD: any;
  protected vD: any;
  protected PD?(b: any): void;

  constructor() {
    super();
    this.mD = {
      type: yi,
      bm: undefined,
      Sm: 0,
      xm: "knifeCut",
      Cw: { pos: new Laya.Point(), bold: 20, length: 50, rotation: 0, zw: false },
    };
    this.vD = {
      type: yi,
      bm: undefined,
      Sm: 0,
      xm: "knifeSwept",
      Cw: { pos: new Laya.Point(), bold: 5, length: 10, rotation: 0, zw: true, Gw: true },
    };
  }

  protected set kD(t: boolean) {
    this.general.jd = t;
  }
  get Sm(): number {
    if (!this.pm) {
      if (!this.general) this.Mm = 0;
      this.Mm = this.general.Ta;
    }
    return this.Mm;
  }
  set Sm(t: number) {
    this.pm = true;
    this.Mm = t;
  }

  pos(t: number, s: number): void {
    t += 55;
    s += 38;
    this.Hn.pos(t, s);
  }
  iD(): void {}

  init(t: number, s: number): void {
    super.init(t, s);
    this.Hn = new Laya.Sprite();
    this.Hn.size(42, 118);
    this.Hn.anchorX = 0.5;
    this.Hn.anchorY = 0.8;
    this.Hn.rotation = 0;
    this._D = new Laya.Image(this.ZI);
    this._D.size(42, 118);
    this._D.pos(0, 0);
    this.Hn.addChild(this._D);
    this._D.rotation = 0;
    this.xD = new Laya.Point(this.Hn.width / 2, 0.8 * this.Hn.height);
  }

  protected wI(): void {
    if (this.general.SD === "黄忠") {
      this.dD = this._D.y;
      this.gD = new Laya.Image("resources/img/effect/sweptTrail.png");
      const t = 1.5 * this.general.Da;
      this.gD.size(t, t);
      this.gD.anchor(0.5, 0.5);
      this.gD.pos(this.Hn.width / 2, this.Hn.pivotY);
      this.gD.rotation = 163;
      this.gD.alpha = 0.5;
      this.gD.visible = false;
      this.Hn.addChild(this.gD);
      this.Ca = 1;
    } else {
      this.dD = this._D.y;
      this.gD = new Laya.Image("resources/img/effect/whiteTrail.png");
      this.gD.size(94, 89);
      this.gD.anchor(0, 0.5);
      this.gD.rotation = 0;
      this.gD.alpha = 1;
      this.gD.visible = false;
      this._D.addChild(this.gD);
      this.Ca = 0;
    }
    this.gD.name = "TrailImg";
  }
  protected bI(): void {
    Laya.Tween.create(this.Hn)
      .to("rotation", 18)
      .duration(600)
      .chain()
      .to("rotation", 12)
      .duration(600)
      .delay(100)
      .then(this.bI, this);
    Laya.Tween.create(this._D)
      .to("y", this.dD - 4)
      .duration(300)
      .chain()
      .to("y", this.dD)
      .duration(300)
      .ease(Laya.Ease.quadOut);
  }
  protected xI(): void {
    Laya.Tween.create(this.Hn).to("rotation", 15).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this._D);
  }

  protected AI(t: any): void {
    const s = this.CI(t.id);
    const i = MathE.distance(this.general.general, t);
    switch (this.Ca) {
      case 0:
        $.instance().playSound("knife_attack");
        this.bD(s, -90, i, this.general.fL, false);
        break;
      case 1:
        $.instance().playSound("cavalry_attack");
        this.MD(s, this.general.fL);
    }
  }

  /** Downward slash. (`bD`) */
  protected bD(t: number, s: number, i: number, h: number, e = false): any {
    this.general.mL = false;
    this.mD.Sm = this.Sm;
    this.mD.bm = this.general;
    let a: any;
    this.mD.Cw.pos.setTo(this.xD.x, this.xD.y);
    this.DI(this.mD, 100, undefined);
    Laya.Tween.killAll(this.Hn);
    const n = this._D.y;
    const r = Laya.Tween.create(this.Hn)
      .to("rotation", t)
      .duration(100 / h)
      .chain()
      .go("rotation", t, t - s / 2)
      .duration(50 / h)
      .ease(Laya.Ease.cubicIn)
      .parallel(this._D)
      .to("y", -i + this.LD)
      .duration(180 / h)
      .ease(Laya.Ease.quadOut)
      .chain()
      .go("rotation", t - s / 2, t + s / 2)
      .duration(180 / h)
      .ease(Laya.Ease.quadOut)
      .onStart(() => {
        a = this.xE.Tw(this.mD);
        if (this.general.tD) this.general.tD.forEach((sc: any) => a.Tm(sc));
        if (e) EffectMgr.instance().playShadowTrails(this._D, 4, 40);
        if (this.gD) this.gD.visible = true;
        if (this.PD) this.PD(a);
        this.FI(a);
        a.Xm();
      })
      .then(() => {
        this.OI();
        if (this.gD) this.gD.visible = false;
        this.YI(a);
        a.Am();
      })
      .chain()
      .go("rotation", t + s / 2, t)
      .duration(150 / h)
      .parallel(this._D)
      .to("y", n)
      .duration(150 / h)
      .then(() => {
        this.general.mL = true;
      });
    this.UI(r);
    return a;
  }

  /** Wide cavalry-style sweep. (`MD`) */
  protected MD(t: number, s = 1): any {
    this.vD.Sm = this.Sm;
    this.vD.bm = this.general;
    const i = this.vD.Cw;
    i.pos.setTo(this.xD.x, this.xD.y);
    this.DI(this.vD, 103, undefined);
    this.general.mL = false;
    const h = t;
    const e = h + 45;
    const a = e - 390;
    const n = this._D.y;
    const r = this.general.Da;
    let o: any;
    const l = Laya.Tween.create(this.Hn)
      .to("rotation", t)
      .duration(100 / s)
      .chain()
      .to("rotation", e)
      .duration(300 / s)
      .ease(Laya.Ease.cubicIn)
      .chain()
      .go("rotation", e, a)
      .duration(360 / s)
      .parallel(this._D)
      .to("y", n - this.wD)
      .onStart(() => {
        i.rotation = e;
        i.length = r;
        i.pos = this.dg.toLocal(this.Hn, i.pos);
        i.Uw = 360 / s;
        i.Ow = a;
        o = this.xE.Tw(this.vD);
        if (this.general.tD) this.general.tD.forEach((sc: any) => o.Tm(sc));
        if (this.gD) this.gD.visible = true;
        if (this.PD) this.PD(o);
        this.FI(o);
        o.Xm();
      })
      .then(() => {
        if (this.gD) this.gD.visible = false;
        this.OI();
        this.YI(o);
        o.Am();
      })
      .chain()
      .go("rotation", a, a + MathE.deltaAngle(a, h))
      .duration(250 / s)
      .parallel(this._D)
      .to("y", n)
      .then(() => {
        this.Hn.rotation = h;
        this.general.mL = true;
      });
    this.UI(l);
    return o;
  }
}

/** 木刀 (-1). (`Ae`) */
class WoodKnife extends KnifeWeaponBase {
  static weaponName = "木刀";
  static weaponDesc = "";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/default_2.png";
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(25, 80);
      this.gD.scaleY = 0.8;
    }
  }
}
WeaponFactory.register(2, -1, () => Laya.Pool.createByClass(WoodKnife));

/** 短刀 (20). (`Ee`) */
class ShortKnife extends KnifeWeaponBase {
  static weaponName = "短刀";
  static weaponDesc = "";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_20.png";
    this.LD = 30;
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(23, 82);
      this.gD.scaleY = 0.8;
    }
  }
}
WeaponFactory.register(2, 20, () => Laya.Pool.createByClass(ShortKnife));

/** 长刀 (21) — +0.5 range. (`Be`) */
class LongKnife extends KnifeWeaponBase {
  static weaponName = "长刀";
  static weaponDesc = "攻击距离+0.5";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_21.png";
    this.LD = 40;
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) this.gD.pos(27, 76);
    this.hD = BuffMgr.instance().applyBuff(this.general.id, 2, 0.5);
  }
  MI(): void {
    super.MI();
    if (this.hD >= 0) BuffMgr.instance().kg(this.general.id, 2, this.hD);
    this.hD = -1;
  }
}
WeaponFactory.register(2, 21, () => Laya.Pool.createByClass(LongKnife));

/** 铁刀 (22) — same-target attack speed +5%. (`Ie`) */
class IronKnife extends KnifeWeaponBase {
  static weaponName = "铁刀";
  static weaponDesc = "攻击同一个单位时，每攻击一次，攻速+5%";
  private nD = 20;
  private AD = 0;
  private eD = -1;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_22.png";
    this.nD = 20;
    this.AD = 0;
    this.LD = 30;
    this.eD = -1;
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(25, 79);
      this.gD.scaleY = 0.95;
    }
    this.hD = BuffMgr.instance().applyBuff(this.general.id, 1, 0, true);
  }
  MI(): void {
    super.MI();
    if (this.hD >= 0) BuffMgr.instance().kg(this.general.id, 1, this.hD);
    this.hD = -1;
  }
  protected AI(t: any): void {
    super.AI(t);
    if (this.eD === t.id) {
      this.AD = Math.min(this.AD + 0.05, this.nD);
      BuffMgr.instance().modify(this.general.id, 1, this.hD, this.AD, undefined, undefined);
    } else {
      BuffMgr.instance().modify(this.general.id, 1, this.hD, 0, undefined, undefined);
      this.AD = 0;
      this.eD = t.id;
    }
  }
}
WeaponFactory.register(2, 22, () => Laya.Pool.createByClass(IronKnife));

/** 狼牙棒 (23) — 10% wolf-roar: +20% speed to nearby allies. (`De`) */
class WolfMace extends KnifeWeaponBase {
  static weaponName = "狼牙棒";
  static weaponDesc = "每次攻击有10%概率获得狼啸,提升周围单位20%攻速,持续10秒";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_23.png";
    this.LD = 30;
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) this.gD.pos(21, 84);
  }
  protected AI(t: any): void {
    super.AI(t);
    if (MathE.rand() < 0.1) {
      EffectMgr.instance().playWolfRoars(
        this.general.general,
        this.general.general.width / 4,
        this.general.general.height / 4,
      );
      const reg = EntityRegistry.instance();
      const s = reg.GS(this.general.general.x, this.general.general.y, this.general.Da, this.general.qd);
      for (const i of s) {
        const sol = reg.hS.get(i.id);
        BuffMgr.instance().applyBuff(i.id, 1, 0.2, true, 10000);
        EffectMgr.instance().playWolfRoarBuff(sol.Yn, sol.Yn.width / 2, 0);
      }
      const gen = reg.XS(this.general.general.x, this.general.general.y, this.general.Da, this.general.qd);
      for (const s2 of gen) {
        const g = reg.Qk.get(s2.id);
        if (s2.id !== this.general.id) {
          BuffMgr.instance().applyBuff(s2.id, 1, 0.2, true, 10000);
          EffectMgr.instance().playWolfRoarBuff(g.general, g.general.width / 2, 0);
        }
      }
    }
  }
  protected bI(): void {
    const t = this._D.y;
    Laya.Tween.create(this.Hn)
      .to("rotation", -60)
      .duration(600)
      .chain()
      .to("rotation", -90)
      .duration(600)
      .ease(Laya.Ease.quadIn)
      .delay(50)
      .then(this.bI, this);
    Laya.Tween.create(this._D).to("y", t - 2).duration(300).chain().to("y", t).duration(300);
  }
  protected xI(): void {
    Laya.Tween.create(this.Hn).to("rotation", -90).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this._D);
  }
}
WeaponFactory.register(2, 23, () => Laya.Pool.createByClass(WolfMace));

/** 三尖刀 (24) — every 10 hits a 2x AoE blade-qi. (`Te`) */
class TriPointKnife extends KnifeWeaponBase {
  static weaponName = "三尖刀";
  static weaponDesc = "每攻击10次释放刀气(两倍伤害，群体)";
  private ED = 0;
  private BD: any;
  constructor() {
    super();
    this.ED = 0;
    this.ZI = "resources/img/weapon/weapon_24.png";
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(20, 62);
      this.gD.scaleY = 0.9;
    }
    this.BD = new Laya.Image("resources/img/effect/blueTrail.png");
    this.BD.size(94, 89);
    this.BD.pos(22, 65);
    this.BD.anchor(0, 0.5);
    this.BD.rotation = 0;
    this.BD.scaleX = -1;
    this.BD.scaleY = 0.9;
    this.BD.alpha = 1;
    this.BD.visible = false;
    this._D.addChild(this.BD);
  }
  MI(): void {
    super.MI();
    if (this.BD) this.BD.removeSelf();
  }
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.II(s, undefined);
    this.ED += 1;
    if (this.ED === 10) {
      const cfg = {
        type: te,
        bm: this.general,
        Om: this.RI(Kh.create()),
        Sm: 2 * this.Sm,
        Fm: 1,
        Cw: { width: 91, height: 45 },
        Um: this.dI(103, undefined),
      };
      this.DD(cfg, s, this.general.fL);
      this.ED = 0;
    } else super.AI(t);
  }
  private DD(t: any, s: number, i: number): any {
    this.general.mL = false;
    (this as any).kD = true;
    const h = this._D.y;
    let e: any;
    const a = Laya.Tween.create(this.Hn)
      .to("rotation", s)
      .duration(100 / i)
      .chain()
      .to("rotation", s - 90)
      .duration(400 / i)
      .ease(Laya.Ease.quadIn)
      .parallel(this._D)
      .to("y", h - 60)
      .onStart(() => {
        Laya.timer.once(150 / i, this, () => {
          EffectMgr.instance().playAlertRingsIn(this._D, 2, 400, 2);
        });
      })
      .chain()
      .delay(100 / i)
      .chain()
      .go("rotation", s - 90, s)
      .duration(80 / i)
      .onStart(() => {
        if (this.BD) this.BD.visible = true;
      })
      .then(() => {
        const lp = this.dg.toLocal(this.Hn, true, false);
        e = this.xE.Tw(t, lp);
        if (e.fm) e.Pm.rotation = s;
        e.Xm();
      })
      .chain()
      .go("rotation", s, s + 45)
      .duration(40 / i)
      .then(() => {
        if (this.BD) this.BD.visible = false;
        this.OI();
      })
      .chain()
      .parallel(this._D)
      .go("y", h - 60, h)
      .duration(100 / i)
      .then(() => {
        Laya.timer.clearAll(this);
        (this as any).kD = false;
        this.general.mL = true;
      });
    this.UI(a);
    return e;
  }
  iD(): void {
    super.iD();
  }
}
WeaponFactory.register(2, 24, () => Laya.Pool.createByClass(TriPointKnife));

/** 铁蒺藜骨朵 (25) — 10% stun. (`Re`) */
class MorningStar extends KnifeWeaponBase {
  static weaponName = "铁蒺藜骨朵";
  static weaponDesc = "有10%概率造成眩晕";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_25.png";
    this.LD = 50;
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(20, 65);
      this.gD.scaleY = 0.8;
    }
  }
  protected AI(t: any): void {
    super.AI(t);
    const s = this.xw.kw.get(t.id);
    s.once("onHit", () => {
      if (MathE.rand() < 0.1) BuffMgr.instance().applyBuff(s.id, 8, 0, false, 500);
    });
  }
  protected bI(): void {
    const t = this._D.y;
    Laya.Tween.create(this.Hn)
      .to("rotation", -60)
      .duration(600)
      .chain()
      .to("rotation", -90)
      .duration(600)
      .ease(Laya.Ease.quadIn)
      .delay(50)
      .then(this.bI, this);
    Laya.Tween.create(this._D).to("y", t - 2).duration(300).chain().to("y", t).duration(300);
  }
  protected xI(): void {
    Laya.Tween.create(this.Hn).to("rotation", -90).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this._D);
  }
}
WeaponFactory.register(2, 25, () => Laya.Pool.createByClass(MorningStar));

/** 古锭刀 (26) — first hit on a unit grants 1 gold. (`Ce`) */
class AncientKnife extends KnifeWeaponBase {
  static weaponName = "古锭刀";
  static weaponDesc = "首次攻击某单位可获得1金币";
  private TD = new Set<any>();
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_26.png";
    this.TD = new Set();
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(26, 69);
      this.gD.scaleY = 1.1;
    }
  }
  MI(): void {
    super.MI();
    this.TD.clear();
  }
  protected PD(t: any): void {
    this.RD(t);
  }
  private RD(t: any): void {
    t.on(
      ai.im,
      (id: any) => {
        if (!this.TD.has(id)) {
          const s = this.xw.kw.get(id);
          const i = s.enemy.localToGlobal(this.Yv.setTo(0, s.enemy.height / 4));
          EffectMgr.instance().playGoldUp(i.x + s.enemy.width / 4, i.y);
          if (this.general.qd) this.dg.battleState.gold += 1;
          else this.dg.battleState.Ki += 1;
          this.TD.add(id);
        }
      },
      this,
    );
    console.log("length:" + this.TD.size);
  }
}
WeaponFactory.register(2, 26, () => Laya.Pool.createByClass(AncientKnife));

/** 虎啸战刀 (27) — 10% tiger-roar: +30% speed to nearby allies. (`Ue`) */
class TigerKnife extends KnifeWeaponBase {
  static weaponName = "虎啸战刀";
  static weaponDesc = "每次攻击有10%概率获得虎啸,提升周围单位30%攻速,持续10秒";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_27.png";
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) this.gD.pos(29, 64);
  }
  protected AI(t: any): void {
    super.AI(t);
    if (MathE.rand() < 0.1) {
      EffectMgr.instance().playTigerRoars(
        this.general.general,
        this.general.general.width / 4,
        this.general.general.height / 4,
      );
      const reg = EntityRegistry.instance();
      const s = reg.GS(this.general.general.x, this.general.general.y, this.general.Da, this.general.qd);
      for (const i of s) {
        const sol = reg.hS.get(i.id);
        BuffMgr.instance().applyBuff(i.id, 1, 0.3, true, 10000);
        EffectMgr.instance().playTigerRoarBuff(sol.Yn, sol.Yn.width / 2, 0);
      }
      const gen = reg.XS(this.general.general.x, this.general.general.y, this.general.Da, this.general.qd);
      for (const s2 of gen) {
        const g = reg.Qk.get(s2.id);
        if (s2.id !== this.general.id) {
          BuffMgr.instance().applyBuff(s2.id, 1, 0.3, true, 10000);
          EffectMgr.instance().playTigerRoarBuff(g.general, g.general.width / 2, 0);
        }
      }
    }
  }
}
WeaponFactory.register(2, 27, () => Laya.Pool.createByClass(TigerKnife));

/** 七星刀 (28) — 10% meteor rain (5 falling 2x AoE strikes). (`Oe`) */
class SevenStarKnife extends KnifeWeaponBase {
  static weaponName = "七星刀";
  static weaponDesc = "每次攻击有10%几率触发流星雨（五枚流星从天而降随机轰击敌人，造成范围伤害，2倍伤害）";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_28.png";
    this.fD = { trailColor: "#7edcf1ff", uE: undefined, pE: undefined };
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(27, 72);
      this.gD.scaleY = 1.1;
    }
  }
  MI(): void {
    super.MI();
  }
  protected AI(t: any): void {
    const s = this.general.level;
    const i = [0, 70, 140];
    const h = this.CI(t.id);
    if (MathE.rand() < 0.1) {
      const baseY = this._D.y;
      const e = EnemySpatialMgr.instance().RA(this.general.qd);
      const a = this.UD(e, s);
      this.general.mL = false;
      (this as any).kD = true;
      Laya.Tween.create(this._D)
        .to("y", -60)
        .duration(250)
        .onStart(() => {
          i.forEach((tt, si2) => {
            Laya.timer.once(tt, this, () => {
              EffectMgr.instance().playStarRotate(this._D, this._D.x - this._D.width / 4, this._D.y + 60, 1000 - i[si2]);
            });
          });
        })
        .then(() => {
          const arr: number[] = [];
          for (let k = 0; k < s; ++k) arr.push(1000 * Math.random());
          arr.sort();
          arr.forEach((tt, si2) => {
            Laya.timer.once(tt, this, () => {
              const idx = si2 % e.length;
              const rot = Math.floor(171 * Math.random());
              this.FD(h, a[idx], rot);
            });
          });
        })
        .chain()
        .delay(600)
        .chain()
        .go("y", -60, baseY)
        .duration(150)
        .then(() => {
          this.general.mL = true;
          (this as any).kD = false;
        });
    } else super.AI(t);
  }
  private FD(t: number, s: any, i = 20): any {
    this.II(0, s.id);
    Laya.Vector2.TEMP.setValue(s.x, s.y);
    const h = {
      type: se,
      bm: this.general,
      Um: this.dI(100, { FL: s.id }),
      Om: Fe.create(0).KL(Laya.Vector2.TEMP),
      Sm: 2 * this.general.Ta,
      Fm: 1,
      VA: [new jh({ radius: 2 * this.dg.map.gridWid, Sm: 2 * this.Sm, force: 1, RE: false, BE: false })],
    };
    const e = new Laya.Point(i, -40);
    const a = this.xE.Tw(h, e);
    if (a.fm) a.Pm.rotation = t;
    a.Xm();
    return a;
  }
  private UD(t: any[], s: number): any[] {
    if (t.length === 0) return [];
    const i = Math.min(s, t.length);
    const h = [...t];
    let e = h.length;
    while (e > 0) {
      const k = Math.floor(MathE.rand() * e);
      e--;
      [h[e], h[k]] = [h[k], h[e]];
    }
    return h.slice(0, i);
  }
}
WeaponFactory.register(2, 28, () => Laya.Pool.createByClass(SevenStarKnife));
