// Bow weapons (type 0) — archetype `Le` + its 11 concrete bows.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~19754-20307. `BowWeaponBase` (Le) draws the bow + arrow, fires single or
// spread volleys with recoil, and runs the bow idle/draw animation. Each
// concrete bow sets its arrow skin + bullet config and registers with
// WeaponFactory under type 0. Opaque field names kept verbatim.
//
//   BowWeaponBase=Le  fireSingle=KI  fireSpread=sD  recoil=JI

/* eslint-disable @typescript-eslint/no-explicit-any */

import { WeaponComponent } from "./weapon-component";
import { WeaponFactory } from "./weapon-factory";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { UpdateMgr } from "../core/update-mgr";
import { BuffMgr } from "./buff-mgr";
import { SimpleDynamicArrow } from "./bullet";
import {
  EagleArrow,
  FireDragonArrow,
  ShenBiArrow,
  LightningArrow,
  HuoFengHuangArrow,
  FireArrow,
  KnockbackBehavior,
  BurnBehavior,
} from "./bullet-variants";
import { TargetEnemyBezierMovement, TargetDirectionLineMovement, TargetDirectionWaveMovement } from "./movements";

const de = WeaponFactory;
const $ = AudioMgr;
const f = MathE;
const j = UpdateMgr;
const th = BuffMgr;
const ri = SimpleDynamicArrow;
const Ch = EagleArrow;
const zh = FireDragonArrow;
const Jh = ShenBiArrow;
const Zh = LightningArrow;
const qh = HuoFengHuangArrow;
const Yh = FireArrow;
const Th = KnockbackBehavior;
const $h = BurnBehavior;
const oi = TargetEnemyBezierMovement;
const Kh = TargetDirectionLineMovement;

export class BowWeaponBase extends WeaponComponent {
  protected $I = new Laya.Point(62, 28);
  protected NI = 1;
  protected qI = 10;
  protected pm = false;
  protected VI = 0;
  protected Mm = 0;
  protected QI: any;
  protected ZI = "";
  protected config: any;

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
    s += this.dg.map.gridHei / 2;
    t += this.dg.map.gridWid / 2;
    this.Hn.pos(t, s);
  }

  init(t: number, s: number): void {
    super.init(t, s);
    this.Hn = new Laya.Sprite();
    this.Hn.size(this.dg.map.gridWid, this.dg.map.gridHei);
    this.Hn.anchor(0.5, 0.5);
    this.QI = new Laya.Image(this.ZI);
    this.QI.size(124, 56);
    this.QI.anchor(0.5, 0.5);
    this.QI.pos(this.Hn.pivotX, this.Hn.pivotY - 30);
    this.Hn.addChild(this.QI);
  }

  /** Fire a single arrow with draw + release. (`KI`) */
  protected KI(t: any, s: number, i: number, h?: () => void): void {
    if (this.Hn.parent) {
      if (t.Bm) return;
      this.QI.addChild(t.Pm);
      if (t.fm) t.Pm.rotation = 0;
      t.pos(this.$I.x, this.$I.y);
      this.JI(s, i);
      Laya.Tween.create(t.Pm)
        .to("y", this.$I.y + 40)
        .duration(570 / i)
        .then(() => {
          if (this.general.tD) this.general.tD.forEach((sc: any) => t.Tm(sc));
          if (t.Bm) return;
          const lp = this.dg.toLocal(t.Pm, true);
          this.dg.Qn.addChild(t.Pm);
          t.pos(lp.x, lp.y);
          if (t.fm) t.Pm.rotation = this.Hn.rotation;
          t.Xm();
          $.instance().playSound("general_bow_attack");
          if (h) h();
        });
    } else t.Am();
  }

  /** Fire a spread of `NI` arrows. (`sD`) */
  protected sD(t: any, s: number, i: number, h?: () => void): void {
    if (!this.Hn.parent) return;
    if (this.general.tD) {
      if (t.VA == null) t.VA = [];
      this.general.tD.forEach((sc: any) => {
        t.VA.push(sc);
      });
    }
    const e = Math.floor(this.NI / 2);
    const a = t.Om;
    const n = -e * this.qI;
    for (let r = 0; r < this.NI; r++) {
      const o = n + r * this.qI;
      const l = r === e;
      t.Om = l ? a : Kh.create().QL(o + s);
      const c = this.xE.Tw(t, this.$I);
      if (c.Bm) return;
      this.QI.addChild(c.Pm);
      if (c.fm) c.Pm.rotation = o;
      Laya.Tween.create(c.Pm)
        .to("y", this.$I.y + 40)
        .duration(450 / i)
        .then(() => {
          if (c.Bm) return;
          $.instance().playSound(l ? "bow_attack" : "general_bow_attack");
          const lp = this.dg.toLocal(c.Pm, true);
          this.dg.Qn.addChild(c.Pm);
          c.pos(lp.x, lp.y);
          c.Xm();
          if (l && h) h();
        });
    }
    if (t.Om instanceof oi) s = t.Om.bw(this.dg.toLocal(this.Hn, true));
    this.JI(s, i);
    t.Om = a;
  }

  /** Recoil + bow flex animation. (`JI`) */
  protected JI(t: number, s: number): void {
    Laya.Tween.create(this.Hn).to("rotation", t).duration(200 / s);
    Laya.Tween.create(this.QI)
      .to("scaleX", 0.87)
      .to("scaleY", 1.29)
      .duration(450 / s)
      .chain()
      .to("scaleX", 1.1)
      .to("scaleY", 0.82)
      .duration(120 / s)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(60 / s)
      .chain()
      .to("scaleX", 1.06)
      .to("scaleY", 0.91)
      .duration(60 / s)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(60 / s);
  }

  protected wI(): void {
    super.wI();
    this.VI = this.QI.y;
  }
  protected bI(): void {
    Laya.Tween.create(this.Hn)
      .to("rotation", -33)
      .duration(600)
      .chain()
      .to("rotation", -27)
      .duration(600)
      .delay(100)
      .then(this.bI, this);
  }
  protected xI(): void {
    Laya.Tween.create(this.QI).to("scaleY", -1).duration(150).parallel().to("y", 50).duration(150);
    Laya.Tween.create(this.Hn).to("rotation", -30).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this.QI);
    Laya.Tween.create(this.QI).to("y", this.VI).duration(50);
    this.QI.scaleY = 1;
  }
  gameOver(): void {
    super.gameOver();
  }
}

/** Default bow (-1) — no real weapon equipped. */
class DefaultBowWeapon extends BowWeaponBase {
  constructor() {
    super();
    this.ZI = "resources/img/weapon/default_0.png";
    this.config = {
      type: ri,
      bm: undefined,
      Om: undefined,
      Um: undefined,
      ow: { xm: "长弓普通弓箭", ew: "resources/img/weapon/default_arrow_1.png" },
      Sm: 0,
      Fm: 3,
    };
  }
  iD(): void {}
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.config.bm = this.general;
    this.config.Sm = this.Sm;
    this.II(s, undefined);
    this.DI(this.config, 100, undefined);
    this.TI(this.config, () => oi.create());
    this.sD(this.config, s, 1);
  }
}
de.register(0, -1, DefaultBowWeapon);

/** Default bow (0). */
class BowWeapon0 extends BowWeaponBase {
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_0.png";
    this.config = {
      type: ri,
      bm: undefined,
      Om: undefined,
      Um: undefined,
      ow: { xm: "长弓普通弓箭", ew: "resources/img/weapon/arrow_0.png" },
      Fm: 3,
    };
  }
  iD(): void {}
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.config.bm = this.general;
    this.II(s, undefined);
    this.DI(this.config, 100, undefined);
    this.TI(this.config, () => oi.create());
    this.config.Sm = this.Sm;
    this.sD(this.config, s, 1);
  }
}
de.register(0, 0, BowWeapon0);

/** 长弓 — attack distance +0.5. (`me`) */
class LongBow extends BowWeaponBase {
  static weaponName = "长弓";
  static weaponDesc = "攻击距离+0.5";
  private hD = -1;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_1.png";
    this.config = {
      type: ri,
      bm: undefined,
      Om: undefined,
      Um: undefined,
      ow: { xm: "长弓普通弓箭", ew: "resources/img/weapon/arrow_1.png" },
      Fm: 3,
    };
    this.hD = -1;
  }
  protected wI(): void {
    this.hD = th.instance().applyBuff(this.general.id, 2, 0.5);
  }
  MI(): void {
    super.MI();
    if (this.hD >= 0) th.instance().kg(this.general.id, 2, this.hD);
    this.hD = -1;
  }
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.config.bm = this.general;
    this.II(s, undefined);
    this.DI(this.config, 100, undefined);
    this.TI(this.config, () => oi.create());
    this.config.Sm = this.Sm;
    this.sD(this.config, s, 1);
  }
  iD(): void {}
}
de.register(0, 1, LongBow);

/** 铁弓 — 10% knockback. (`we`) */
class IronBow extends BowWeaponBase {
  static weaponName = "铁弓";
  static weaponDesc = "10%概率击退";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_2.png";
    this.config = {
      type: ri,
      bm: undefined,
      ow: { xm: "铁弓普通弓箭", ew: "resources/img/weapon/arrow_2.png" },
      Fm: 3,
    };
  }
  iD(): void {}
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.config.bm = this.general;
    this.II(s, undefined);
    this.DI(this.config, 100, undefined);
    this.TI(this.config, () => oi.create());
    this.config.Sm = this.Sm;
    if (this.config.VA) this.config.VA.length = 0;
    else this.config.VA = [];
    if (Math.random() < 0.1) this.config.VA.push(new Th(1));
    this.sD(this.config, s, 1);
  }
}
de.register(0, 2, IronBow);

/** 角弓 — repeated hits on one target raise attack speed +5%. (`ve`) */
class HornBow extends BowWeaponBase {
  static weaponName = "角弓";
  static weaponDesc = "攻击同一个单位时，每攻击一次，攻速+5%(加法)";
  private eD = -1;
  private aD = 0;
  private nD = 20;
  private hD = -1;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_3.png";
    this.config = {
      type: ri,
      ow: { xm: "角弓普通弓箭", ew: "resources/img/weapon/arrow_3.png" },
      bm: undefined,
      Fm: 3,
      rm: { um: undefined },
    };
    this.eD = -1;
    this.aD = 0;
    this.nD = 20;
    this.hD = -1;
  }
  protected wI(): void {
    this.hD = th.instance().applyBuff(this.general.id, 1, 0, true);
  }
  MI(): void {
    super.MI();
    this.aD = 0;
    if (this.hD >= 0) th.instance().kg(this.general.id, 1, this.hD);
    this.hD = -1;
  }
  protected AI(t: any): void {
    this.config.bm = this.general;
    const s = this.CI(t.id);
    this.II(s, undefined);
    this.DI(this.config, 100, undefined);
    this.TI(this.config, () => oi.create());
    this.config.Sm = this.Sm;
    if (this.eD === t.id) {
      this.aD = Math.min(this.aD + 0.05, this.nD);
      th.instance().modify(this.general.id, 1, this.hD, this.aD, true, undefined);
    } else {
      th.instance().modify(this.general.id, 1, this.hD, 0, true, undefined);
      this.aD = 0;
      this.eD = t.id;
    }
    this.config.rm.um = 1 + this.general.yL;
    this.sD(this.config, s, 1 + this.general.yL);
  }
  iD(): void {}
}
de.register(0, 3, HornBow);

/** 射雕弓 — 10% chance to loose a slow eagle (3x). (`ke`) */
class EagleBow extends BowWeaponBase {
  static weaponName = "射雕弓";
  static weaponDesc = "10%概率打出一只缓慢飞行的老鹰，对沿途敌人造成伤害(3倍),鹰在击中敌人时会有所减速";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_4.png";
  }
  iD(): void {}
  protected AI(t: any): void {
    const s = this.CI(t.id);
    let i: any;
    if ((f.range(0, 100, true) as number) < 10) {
      i = { type: Ch, bm: this.general, Om: Kh.create().QL(s), Sm: 3 * this.Sm, Fm: 0.35 };
    } else {
      i = {
        type: ri,
        bm: this.general,
        ow: { xm: "射雕弓普通弓箭", ew: "resources/img/weapon/arrow_4.png" },
        Sm: this.Sm,
        Fm: 3,
      };
      this.II(s, undefined);
      this.DI(i, 100, undefined);
      this.TI(i, () => oi.create());
    }
    this.sD(i, s, 1);
  }
}
de.register(0, 4, EagleBow);

/** 铁胎弓 — 10% chance to loose a fire dragon. (`_e`) */
class FireDragonBow extends BowWeaponBase {
  static weaponName = "铁胎弓";
  static weaponDesc = "10%概率打出一道火龙，点燃路径(造成每秒攻击力的伤害，持续5秒，可以叠加)";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_5.png";
  }
  iD(): void {}
  protected AI(t: any): void {
    const s = this.CI(t.id);
    let i: any;
    this.II(s, undefined);
    if ((f.range(0, 100, true) as number) < 10) {
      i = { type: zh, bm: this.general, Om: this.RI(TargetDirectionWaveMovement.create(0.5, 15, f.range(0, 100) as number)), Fm: 5 };
      i.Um = undefined;
    } else {
      i = {
        type: ri,
        bm: this.general,
        ow: { xm: "铁胎弓普通弓箭", ew: "resources/img/weapon/arrow_5.png" },
        Sm: this.Sm,
        Fm: 3,
      };
      this.DI(i, 100, undefined);
      this.TI(i, () => oi.create());
    }
    this.sD(i, s, 1);
  }
}
de.register(0, 5, FireDragonBow);

/** 神臂弓 — repeated hits on one target raise attack speed +15%. (`xe`) */
class ShenBiBow extends BowWeaponBase {
  static weaponName = "神臂弓";
  static weaponDesc = "攻击同一个单位时，每攻击一次，攻速+15%";
  private aD = 0;
  private nD = 20;
  private eD = -1;
  private hD = -1;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_6.png";
    this.config = { type: Jh, bm: undefined, rm: { um: undefined } };
    this.aD = 0;
    this.nD = 20;
    this.eD = -1;
  }
  protected wI(): void {
    this.hD = th.instance().applyBuff(this.general.id, 1, 0, true);
  }
  MI(): void {
    super.MI();
    th.instance().kg(this.general.id, 1, this.hD);
  }
  protected AI(t: any): void {
    this.config.bm = this.general;
    const s = this.CI(t.id);
    this.II(s, undefined);
    this.DI(this.config, 100, undefined);
    this.TI(this.config, () => oi.create());
    this.config.Sm = this.Sm;
    if (this.eD === t.id) {
      this.aD = Math.min(this.aD + 0.15, this.nD);
      th.instance().modify(this.general.id, 1, this.hD, this.aD, true, undefined);
    } else {
      th.instance().modify(this.general.id, 1, this.hD, 0, true, undefined);
      this.aD = 0;
      this.eD = t.id;
    }
    this.config.rm.um = 1 + this.general.yL;
    this.sD(this.config, s, 1 + this.general.yL);
  }
  iD(): void {}
}
de.register(0, 6, ShenBiBow);

/** 霸王弓 — 50% bounce per hit. (`Se`) */
class OverlordBow extends BowWeaponBase {
  static weaponName = "霸王弓";
  static weaponDesc = "每击中一个单位，有50%概率弹射一次";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_7.png";
    this.JB = false;
    this.config = { type: Zh, Om: undefined, bm: undefined, Fm: 3 };
  }
  protected AI(t: any): void {
    this.config.bm = this.general;
    const s = this.CI(t.id);
    this.II(s, undefined);
    this.DI(this.config, 102, undefined);
    this.config.Om = this.RI(Kh.create());
    this.config.Sm = this.Sm;
    this.sD(this.config, s, 1);
  }
  iD(): void {}
}
de.register(0, 7, OverlordBow);

/** 落日弓 — fire phoenix (bigger + harder the farther it flies). (`be`) */
class SunsetBow extends BowWeaponBase {
  static weaponName = "落日弓";
  static weaponDesc = "打出火凤凰(打的越远，凤凰越大) 攻击距离越远，伤害越高";
  private hD = -1;
  private rD = false;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_8.png";
    this.sI = false;
    this.rD = false;
    this.config = { type: qh, bm: undefined };
  }
  protected wI(): void {
    super.wI();
    this.hD = th.instance().applyBuff(this.general.id, 2, 1, true);
  }
  MI(): void {
    super.MI();
    th.instance().kg(this.general.id, 2, this.hD);
  }
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.II(s, undefined);
    this.config.Om = this.RI(Kh.create());
    this.config.bm = this.general;
    this.sD(this.config, s, 1);
  }
  iD(): void {}
}
de.register(0, 8, SunsetBow);

/** 诸葛连弩 — every 10 shots looses 10 fire bolts. (`Me`) */
class RepeatingCrossbow extends BowWeaponBase {
  static weaponName = "诸葛连弩";
  static weaponDesc = "每射击10次，会射出10支火箭";
  private oD = 10;
  private lD = 10;
  private cD = 100;
  private uD = 0;
  private pD = 0;
  private yD = 0;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_9.png";
    this.oD = 10;
    this.lD = 10;
    this.cD = 100;
    this.config = {
      type: ri,
      ow: { xm: "在下文中设置此属性", ew: "resources/img/weapon/arrow_9.png" },
      bm: undefined,
      Fm: 3,
      rm: { um: undefined },
    };
    this.uD = 0;
    this.pD = 0;
    this.yD = 0;
  }
  protected AI(t: any): void {
    this.config.bm = this.general;
    const s = this.CI(t.id);
    this.II(s, undefined);
    if (this.uD >= this.oD) {
      this.config.type = Yh;
      this.config.Um = this.gI;
      this.general.mL = false;
      j.instance().register(this.id + "_A", this, (dt: number) => {
        this.pD += dt / 2000;
        if (this.pD <= 1) {
          if (this.pD >= this.yD / this.lD) {
            let tt = s;
            if (this.yD < this.lD / 2) tt += ((this.yD - this.lD / 4) * this.cD * 2) / this.lD;
            else tt -= ((this.yD - (this.lD / 4) * 3) * this.cD * 2) / this.lD;
            this.config.Om = Kh.create().QL(tt);
            this.config.ow.xm = "诸葛连弩火焰弩箭";
            if (this.config.VA == null) this.config.VA = [];
            this.config.VA.push(new $h(5000, 1));
            this.sD(this.config, tt, this.lD);
            this.config.VA.pop();
            this.yD++;
          }
        } else {
          this.general.mL = true;
          this.pD = 0;
          this.yD = 0;
          j.instance().unregister(this.id + "_A");
        }
      });
      this.uD = 0;
    } else {
      this.config.ow.xm = "诸葛连弩普通弩箭";
      this.config.type = ri;
      this.DI(this.config, 100, undefined);
      this.TI(this.config, () => oi.create());
      this.config.rm.um = 3;
      this.sD(this.config, s, 1);
      this.config.rm.um = undefined;
      this.uD++;
    }
  }
  iD(): void {}
}
de.register(0, 9, RepeatingCrossbow);
