// Pike weapons (type 1) — archetype `ze` + its 11 concrete pikes.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~21777-22570. `PikeWeaponBase` (ze) supports four attack styles selected by
// the wielding general: 张飞 spin-sweep (GT), normal poke (HT/WT), 赵云 multi-poke,
// and 马超 spear-throw. Concrete pikes add range buffs, ground-spike formations,
// trips, kill-streak speed, pear-blossoms, spirit-snakes and fly-pikes. Opaque
// field names kept verbatim.
//
//   PikeWeaponBase=ze  sweep=GT  poke=WT  throw=throw  perBulletHook=zT

/* eslint-disable @typescript-eslint/no-explicit-any */

import { WeaponComponent } from "./weapon-component";
import { WeaponFactory } from "./weapon-factory";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { BuffMgr } from "./buff-mgr";
import { EffectMgr } from "./effect-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BulletEvent } from "./bullet-movement";
import { PikeBullet } from "./bullets-area";
import { SimpleDynamicArrow } from "./bullet";
import { LiHuaBullet, PikeSnakeBullet, FlyPike } from "./bullet-variants";
import { TargetEnemyBezierMovement, TargetEnemyMovement } from "./movements";

const $ = AudioMgr;
const ai = BulletEvent;
const pi = PikeBullet;
const ri = SimpleDynamicArrow;
const re = LiHuaBullet;
const oe = PikeSnakeBullet;
const ae = FlyPike;
const oi = TargetEnemyBezierMovement;
const Ke = TargetEnemyMovement;

export class PikeWeaponBase extends WeaponComponent {
  protected pm = false;
  protected rD = false;
  protected fv = new Laya.Point(21, 25);
  protected AT = 132;
  protected ET = 132;
  protected Ca = 1;
  protected BT: any = null;
  protected IT: any = null;
  protected DT = 0;
  protected RT = 1.2;
  protected CT = 0.8;
  protected UT = 80;
  protected FT = 40;
  protected OT = 0.1;
  protected Mm = 0;
  protected ZI = "";
  protected XT: any;
  protected hD = -1;
  protected TT: any;
  protected YT: any;
  protected zT?(b: any): void;

  constructor() {
    super();
    this.TT = {
      type: pi,
      bm: undefined,
      Sm: 0,
      xm: "pikeSweep",
      Cw: { pos: new Laya.Point(), bold: 5, length: 10, rotation: 0, Ww: true },
    };
    this.YT = {
      type: pi,
      bm: undefined,
      Sm: 0,
      xm: "pikePoke",
      Cw: { pos: new Laya.Point(), bold: 5, length: 10, rotation: 0, Ww: false },
    };
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

  init(t: number, s: number): void {
    super.init(t, s);
    this.Hn = new Laya.Sprite();
    this.Hn.size(42, 132);
    this.Hn.anchorX = 0.5;
    this.Hn.anchorY = 0.5;
    this.XT = new Laya.Image(this.ZI);
    this.XT.name = "pikeWeaponImage";
    this.XT.size(this.Hn.width, this.Hn.height);
    this.XT.anchor(0.5, 0.5);
    this.Hn.addChild(this.XT);
    this.XT.pos(this.Hn.width / 2, this.Hn.height / 2);
  }
  iD(): void {}
  pos(t: number, s: number): void {
    if (this.general && this.general.SD === "马超") t += 140;
    s += 40;
    this.Hn.pos(t, s);
  }

  protected wI(): void {
    if (this.general.SD === "张飞") {
      this.BT = new Laya.Image("resources/img/effect/sweep.png");
      const t = 1.5 * this.general.Da;
      this.BT.size(t, t);
      this.BT.anchor(0.5, 0.5);
      this.BT.pos(this.Hn.pivotX, this.Hn.pivotY);
      this.BT.rotation = 180;
      this.BT.alpha = 0.5;
      this.BT.visible = false;
      this.Hn.addChild(this.BT);
      this.Ca = 0;
      this.pos(50, 0);
    } else if (this.general.SD === "马超") {
      this.Ca = 3;
    } else {
      this.IT = new Laya.Image("resources/img/gameObject/soldier/pikeEff2.png");
      this.IT.pos(this.fv.x, this.fv.y);
      this.IT.size(30, 76);
      this.IT.anchor(0.5, 0.5);
      this.XT.addChild(this.IT);
      this.IT.visible = false;
      if (this.general.SD === "赵云") {
        this.Hn.pos(50, 40);
        this.Ca = 2;
      } else this.Ca = 1;
    }
    this.DT = this.XT.y;
    if (this.general.SD === "张飞") this.oI = 130;
  }
  protected xI(): void {
    super.xI();
    if (this.general.SD === "赵云" && this.nI) this.nI.y = 0.6 * this.XT.height - this.rI;
  }
  protected bI(): void {
    if (MathE.rand() < 0.1)
      Laya.Tween.create(this.Hn)
        .to("rotation", this.oI + 3)
        .duration(150)
        .chain()
        .to("rotation", this.oI)
        .duration(150)
        .chain()
        .to("rotation", this.oI + 3)
        .duration(150)
        .chain()
        .to("rotation", this.oI)
        .duration(150);
    Laya.Tween.create(this.XT)
      .to("y", this.DT - 2)
      .duration(300)
      .chain()
      .to("y", this.DT)
      .duration(300)
      .then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this.XT);
    if (this.general.SD === "赵云" && this.nI) this.nI.y = 0.8 * this.Hn.height;
  }

  protected AI(t: any): void {
    this.II(this.CI(t.id), undefined);
    MathE.distance(this.general.general, t);
    switch (this.Ca) {
      case 0:
        $.instance().playSound("cavalry_attack");
        this.GT(0.5);
        break;
      case 1:
        $.instance().playSound("general_pike_attack");
        this.HT(this.general.fL);
        break;
      case 2:
        this.WT(5, this.general.fL);
        break;
      case 3:
        this.throw(this.general.fL);
    }
  }

  /** 马超 spear throw. (`throw`) */
  protected throw(t: number): any {
    if (this.general.SD === "马超") $.instance().playSound("maChao_throwSpear");
    const s: any = {
      type: ri,
      bm: this.general,
      ow: {
        xm: `${this.ZI}_Throw`,
        ew: `${this.ZI}`,
        aw: { x: this.XT.width, y: this.XT.height },
        rw: { x: 0, y: 0.5 },
      },
      Sm: this.Sm,
      Fm: 1,
    };
    s.Um = this.dI(100, undefined);
    const i = this.xw.kw.get(this.hI[0]);
    const h = this.dg.toLocal(this.Hn, true);
    const e = Laya.Point.create().setTo(
      h.x + (i.centerX - h.x) / 2,
      h.y + (i.centerY - h.y) / 2 - 250,
    );
    let a: number;
    let n: any;
    if (Math.abs(e.x - i.centerX) <= 30) {
      a = 0;
      s.Fm = 5;
      Laya.Tween.create(this.Hn).to("rotation", this.eI).duration(200 / t);
    } else {
      a = 350 + Math.abs(i.centerY - h.y);
      MathE.quadraticBezierPoint(h, e, i, h, 0.1);
      const ang = MathE.angle(h, h);
      Laya.Tween.create(this.Hn).to("rotation", ang).duration(200 / t);
    }
    s.Om = this.RI(oi.create(a));
    e.recover();
    this.general.mL = false;
    Laya.Tween.create(this.XT)
      .to("y", 40)
      .duration(200 / t)
      .chain()
      .duration(1000 / t)
      .onStart(() => {
        Laya.Point.TEMP.setTo(0, this.XT.height / 2);
        n = this.xE.Tw(s, GameMgr.instance().Qn.globalToLocal(this.XT.localToGlobal(Laya.Point.TEMP)));
        if (this.general.tD) this.general.tD.forEach((tc: any) => n.Tm(tc));
        if (this.zT) this.zT(n);
        this.Hn.visible = false;
        n.Pm.rotation = this.Hn.rotation;
        n.Xm();
        this.XT.y = 0;
      })
      .chain(this.Hn)
      .onStart(() => {
        this.Hn.visible = true;
      })
      .go("scaleX", 0, 1)
      .go("scaleY", 0, 1)
      .duration(200 / t)
      .then(() => {
        this.general.mL = true;
      });
    return n;
  }

  /** Spin sweep (张飞). (`GT`) */
  protected GT(t: number): any {
    this.TT.Sm = this.Sm;
    this.TT.bm = this.general;
    const s = this.TT.Cw;
    s.pos.setTo(this.fv.x, this.fv.y);
    this.DI(this.TT, 103, undefined);
    this.general.mL = false;
    const i = this.oI;
    const h = i;
    const a = this.XT.y;
    const n = this.general.Da;
    const r = n / this.Hn.height;
    let o: any;
    const l = Laya.Tween.create(this.Hn)
      .to("rotation", h)
      .duration(50 / t)
      .ease(Laya.Ease.cubicIn)
      .parallel(this.XT)
      .go("y", a, r)
      .duration(25 / t)
      .ease(Laya.Ease.quadOut)
      .chain()
      .go("rotation", h, h - 360)
      .duration(150 / t)
      .onStart(() => {
        s.rotation = h;
        s.length = n;
        s.pos = this.dg.toLocal(this.Hn, s.pos);
        s.Uw = 150 / t;
        s.Ow = h - 360;
        o = this.xE.Tw(this.TT);
        this.FI(o);
        if (this.general.tD) this.general.tD.forEach((tc: any) => o.Tm(tc));
        if (this.BT) this.BT.visible = true;
        if (this.zT) this.zT(o);
        o.Xm();
      })
      .then(() => {
        if (this.BT) this.BT.visible = false;
        this.OI();
        this.YI(o);
        o.Am();
      })
      .chain()
      .go("rotation", h - 360, h - 360 + MathE.deltaAngle(h - 360, i))
      .duration(150 / t)
      .then(() => {
        this.Hn.rotation = i;
        this.general.mL = true;
      })
      .parallel(this.XT)
      .go("y", r, a)
      .duration(100 / t);
    this.UI(l);
    return o;
  }

  /** Single poke. (`HT`) */
  protected HT(t: number): void {
    this.WT(1, t);
  }

  /** `t` consecutive pokes. (`WT`) */
  protected WT(t: number, s: number): void {
    this.YT.bm = this.general;
    this.YT.Sm = this.Sm;
    const i = this.general.Da;
    const h = i - (this.Hn.height * (this.RT - 0.5) - this.fv.y * this.RT);
    const e = Math.max(0, h - this.UT);
    const a = h - e;
    this.DI(this.YT, 103, undefined);
    const n = this.eI;
    const r = this.XT.y;
    this.general.mL = false;
    let o: any[] = [];
    const l = r - a;
    const c = Laya.Tween.create(this.Hn).to("rotation", n).duration(50 / s);
    this.UI(c);
    c.chain(this.XT)
      .to("y", r + 20)
      .go("scaleY", 1, this.CT)
      .duration(100 / s)
      .chain()
      .to("y", l)
      .go("scaleY", 1, this.RT)
      .duration(100 / s)
      .onStart(() => {
        $.instance().playSound("general_pike_attack");
        const cw = this.YT.Cw;
        cw.pos.setTo(this.fv.x, this.fv.y);
        cw.rotation = this.Hn.rotation;
        cw.pos = this.dg.toLocal(this.XT, cw.pos);
        if (t < 3) {
          cw.Uw = 150 / s;
          cw.Fw = i;
        } else {
          cw.Uw = 0;
          cw.length = i;
          cw.BL = true;
        }
        const bullet = this.xE.Tw(this.YT);
        if (this.general.tD) this.general.tD.forEach((tc: any) => bullet.Tm(tc));
        this.FI(bullet);
        o.push(bullet);
        if (this.zT) this.zT(o[0]);
        if (this.IT) {
          this.IT.y = this.fv.y + 50;
          Laya.Tween.create(this.IT)
            .to("y", this.fv.y - Math.min(this.FT, e))
            .duration(200 / s / t);
          this.IT.visible = true;
        }
        o[0].Xm();
      });
    for (let k = 1; k < t; k++) {
      const hY = r - a * this.OT;
      c.chain()
        .go("y", l, hY)
        .duration(200 / s / t)
        .onStart(() => {
          const prev = o[k - 1];
          if (prev) {
            this.YI(prev);
            prev.Am();
          }
          if (this.IT) {
            this.IT.y = this.fv.y;
            this.IT.visible = false;
          }
        })
        .chain()
        .go("y", hY, l)
        .duration(200 / s / t)
        .onStart(() => {
          $.instance().playSound("general_pike_attack");
          this.Hn.rotation = n + (MathE.range(-10, 10) as number);
          const bullet = this.xE.Tw(this.YT);
          if (this.general.tD) this.general.tD.forEach((tc: any) => bullet.Tm(tc));
          this.FI(bullet);
          const idx = o.push(bullet) - 1;
          if (this.zT) this.zT(o[idx]);
          if (this.IT) {
            if (e > 5)
              Laya.Tween.create(this.IT)
                .go("y", this.fv.y, this.fv.y - Math.min(this.FT, e))
                .duration(200 / s / t);
            this.IT.visible = true;
          }
          o[idx].Xm();
        });
    }
    c.chain()
      .go("y", l, r)
      .go("scaleY", this.RT, 1)
      .duration(100 / s)
      .onStart(() => {
        if (this.IT) this.IT.visible = false;
        const last = o[t - 1];
        if (last) {
          this.YI(last);
          last.Am();
        }
        o = [];
      })
      .then(() => {
        this.OI(c);
        this.general.mL = true;
      });
  }
}

/** 默认枪 (-1). (`je`) */
class DefaultPike extends PikeWeaponBase {
  constructor() {
    super();
    this.ZI = "resources/img/weapon/default_1.png";
    this.rI = -25;
  }
  iD(): void {
    this.XT.y += this.rI;
  }
}
WeaponFactory.register(1, -1, () => Laya.Pool.createByClass(DefaultPike));

/** 短枪 (10). (`$e`) */
class ShortPike extends PikeWeaponBase {
  static weaponName = "短枪";
  static weaponDesc = "";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_10.png";
    this.fv = new Laya.Point(21, 50);
    this.rI = -25;
  }
  iD(): void {
    this.XT.y += this.rI;
  }
}
WeaponFactory.register(1, 10, () => Laya.Pool.createByClass(ShortPike));

/** 长枪 (11) — +0.5 range. (`Ne`) */
class LongPike extends PikeWeaponBase {
  static weaponName = "长枪";
  static weaponDesc = "攻击距离+0.5";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_11.png";
  }
  protected wI(): void {
    super.wI();
    this.hD = BuffMgr.instance().applyBuff(this.general.id, 2, 0.5);
  }
  MI(): void {
    super.MI();
    if (this.hD >= 0) BuffMgr.instance().kg(this.general.id, 2, this.hD);
    this.hD = -1;
  }
}
WeaponFactory.register(1, 11, () => Laya.Pool.createByClass(LongPike));

/** 铁枪 (12) — first hit: 20% ground-spike (3x dmg + stun). (`qe`) */
class IronPike extends PikeWeaponBase {
  static weaponName = "铁枪";
  static weaponDesc = "首次攻击某个单位时，20%几率从地下戳出1个枪阵（将敌人顶起来又落下，造成3倍伤害，0.5秒晕眩）";
  private TD = new Set<any>();
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_12.png";
    this.TD = new Set();
  }
  protected zT(t: any): void {
    const s = EnemySpatialMgr.instance();
    t.once(
      ai.im,
      (id: any) => {
        if (!this.TD.has(id)) {
          if (MathE.rand() <= 0.2) {
            BuffMgr.instance().applyBuff(id, 10, 0, false, 500, { ed: this.ZI, hd: 1 });
            s.sd(2 * this.Sm, [{ id }], this.general);
          }
          this.TD.add(id);
        }
      },
      this,
    );
  }
}
WeaponFactory.register(1, 12, () => Laya.Pool.createByClass(IronPike));

/** 大戟 (13) — +1 range. (`Ve`) */
class GreatHalberd extends PikeWeaponBase {
  static weaponName = "大戟";
  static weaponDesc = "攻击距离+1";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_13.png";
  }
  protected wI(): void {
    super.wI();
    this.hD = BuffMgr.instance().applyBuff(this.general.id, 2, 1);
  }
  MI(): void {
    super.MI();
    if (this.hD >= 0) BuffMgr.instance().kg(this.general.id, 2, this.hD);
    this.hD = -1;
  }
}
WeaponFactory.register(1, 13, () => Laya.Pool.createByClass(GreatHalberd));

/** 钩镰枪 (14) — first hit: 20% trip (2s). (`Qe`) */
class HookSickle extends PikeWeaponBase {
  static weaponName = "钩镰枪";
  static weaponDesc = "首次攻击某个单位时，20%几率使之跌倒。（持续2秒）";
  private TD = new Set<any>();
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_14.png";
    this.TD = new Set();
  }
  protected zT(t: any): void {
    t.on(ai.im, (id: any) => {
      if (!this.TD.has(id)) {
        if (MathE.rand() <= 0.2) BuffMgr.instance().applyBuff(id, 9, 0, false, 2000);
        this.TD.add(id);
      }
    });
  }
}
WeaponFactory.register(1, 14, () => Laya.Pool.createByClass(HookSickle));

/** 点钢枪 (15) — kill grants +50% attack speed for 2s. (`Ze`) */
class SteelPike extends PikeWeaponBase {
  static weaponName = "点钢枪";
  static weaponDesc = "每击杀一个敌人，攻速+50%，持续2秒。";
  private jT = -1;
  private NT = false;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_15.png";
    this.jT = -1;
  }
  protected zT(t: any): void {
    this.$T(t);
  }
  private $T(t: any): void {
    t.once(ai.im, (id: any) => {
      const s = this.xw.kw.get(id);
      if (!s) {
        this.jT = -1;
        this.NT = true;
        return;
      }
      if (!this.NT) {
        const prev = this.xw.kw.get(this.jT);
        if (prev) prev.offAll("onDead");
      }
      this.NT = false;
      this.jT = id;
      s.once("onDead", () => {
        this.NT = true;
        BuffMgr.instance().applyBuff(this.general.id, 1, 0.5, true, 2000);
      });
    });
  }
}
WeaponFactory.register(1, 15, () => Laya.Pool.createByClass(SteelPike));

/** 梨花枪 (16) — kill looses 8 pear-blossoms at random enemies. (`Je`) */
class PearBlossomPike extends PikeWeaponBase {
  static weaponName = "梨花枪";
  static weaponDesc =
    "每击杀一个敌人，飞出8朵旋转的梨花随机打击8个敌人（可能重复），沿途敌人也会受到伤害，受击特效为破碎的花瓣";
  private jT = -1;
  private NT = false;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_16.png";
    this.jT = -1;
  }
  protected zT(t: any): void {
    this.$T(t);
  }
  private $T(t: any): void {
    t.on(ai.im, (id: any) => {
      const s = this.xw.kw.get(id);
      if (!s) {
        this.jT = -1;
        this.NT = true;
        return;
      }
      if (!this.NT) {
        const prev = this.xw.kw.get(this.jT);
        if (prev) prev.offAll("onDead");
      }
      this.NT = false;
      this.jT = id;
      s.once("onDead", () => {
        this.NT = true;
        const list = this.xw.RA(this.general.qd);
        if (list.length <= 1) return;
        const idx = list.indexOf(s);
        if (idx !== -1) list.splice(idx, 1);
        for (let k = 0; k < 8; k++) {
          list[MathE.range(0, list.length, true) as number];
          this.xE
            .Tw(
              {
                type: re,
                Sm: this.Sm,
                Um: this.dI(103, undefined),
                Om: this.RI(Ke.create()),
                bm: this.general,
                Fm: MathE.range(0.5, 1.5),
              },
              { x: s.centerX, y: s.centerY },
            )
            .Xm();
        }
      });
    });
  }
}
WeaponFactory.register(1, 16, () => Laya.Pool.createByClass(PearBlossomPike));

/** 虎头湛金枪 (17) — first hit: 20% multi ground-spike (马超: 5). (`ta`) */
class TigerHeadPike extends PikeWeaponBase {
  static weaponName = "虎头湛金枪";
  static weaponDesc =
    "首次攻击某个单位时，20%几率从地下戳出3个枪阵（将前三个有敌人的格子上的敌人顶起来又落下，造成3倍伤害，0.5秒晕眩） 专属：马超可触发5个枪阵";
  private TD = new Set<any>();
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_17.png";
    this.TD = new Set();
  }
  protected zT(t: any): void {
    this.$T(t);
  }
  private $T(t: any): void {
    const s = EnemySpatialMgr.instance();
    t.on(
      ai.im,
      (id: any) => {
        if (!this.TD.has(id)) {
          if (MathE.rand() <= 0.2) {
            const list = s.RA(this.general.qd);
            const count = this.general.SD === "马超" ? 5 : 3;
            for (let i = 0; i < count && !(list.length <= 0); i++) {
              const k = MathE.range(0, list.length, true) as number;
              const h = list[k];
              BuffMgr.instance().applyBuff(h.id, 10, 0, false, 500, { ed: this.ZI });
              s.sd(3 * this.Sm, [{ id: h.id }], this.general);
              list.splice(k, 1);
            }
          }
          this.TD.add(id);
        }
      },
      this,
    );
  }
}
WeaponFactory.register(1, 17, () => Laya.Pool.createByClass(TigerHeadPike));

/** 丈八蛇矛 (18) — spirit-snake roadblocks, one per general level. (`sa`) */
class SerpentSpear extends PikeWeaponBase {
  static weaponName = "丈八蛇矛";
  static weaponDesc =
    "初始释放一条灵蛇拦路攻击敌人，英雄每升一级，会释放一条新的灵蛇。专属：张飞释放大招后，所有灵蛇攻速翻倍，持续6秒。";
  private qT: any[] = [];
  private QT: any;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_18.png";
    this.qT = [];
  }
  protected wI(): void {
    super.wI();
    this.general.on("onLevelChange", this.VT, this);
    this.QT = EffectMgr.instance();
    this.VT(0, true);
  }
  MI(): void {
    super.MI();
    this.general.off("onLevelChange", this.VT);
    this.qT.forEach((t) => t.Am());
    this.qT = [];
  }
  private VT(_t: any, s: boolean): void {
    if (!s) return;
    const i = GameMgr.instance();
    const h = i.map;
    const e = this.general.qd ? h.de : h.Le;
    if (!e || e.length < 2) return;
    const a = h.Pe(this.general.general, this.general.Da, this.general.qd);
    const n: any[] = [];
    for (let t = 1; t < e.length; t++) {
      const seg = e[t];
      if (a.some((p: any) => p.x === seg.x && p.y === seg.y)) n.push({ ZT: seg, prev: e[t - 1] });
    }
    if (n.length === 0) return;
    const r = n[MathE.range(0, n.length - 1, true) as number];
    const o = r.ZT;
    const l = r.prev;
    const c = Laya.Point.create();
    c.setTo((o.x + 0.5) * h.gridWid, (o.y + 0.5) * h.gridHei);
    const uu = i.Qn.localToGlobal(c, true);
    const p = i.Qn.localToGlobal(
      new Laya.Point(this.general.general.x + this.Hn.x, this.general.general.y + this.Hn.y),
    );
    this.QT.Ql(
      p.x,
      p.y,
      uu.x,
      uu.y,
      33,
      () => {
        if (!this.general) {
          c.recover();
          uu.recover();
          p.recover();
          return;
        }
        const node = this.general.pg();
        if (!node || node.destroyed) {
          c.recover();
          uu.recover();
          p.recover();
          return;
        }
        const snake = this.xE.Tw(
          { type: oe, bm: this.general, Sm: this.Sm, Cw: { flip: MathE.angle(o, l) < 180 } },
          c,
        );
        snake.level = this.general.level;
        this.qT.push(snake);
        snake.Xm();
        c.recover();
        uu.recover();
        p.recover();
      },
      "#ccaeec",
      "resources/img/weapon/bullet/lingShe_1.png",
    );
  }
}
WeaponFactory.register(1, 18, () => Laya.Pool.createByClass(SerpentSpear));

/** 龙胆亮银枪 (19) — 10% (赵云 5%) summon fly-pikes at every enemy. (`ia`) */
class DragonSilverPike extends PikeWeaponBase {
  static weaponName = "龙胆亮银枪";
  static weaponDesc =
    "每次攻击有10%概率召唤飞枪，对所有敌人无差别打击。(每个敌人被一柄枪扎中，受到5倍伤害）专属：赵云操纵飞枪技术高超（有5%概率召唤飞枪）";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_19.png";
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 1 || this.Ca === 2) this.IT.skin = "resources/img/effect/LongDanLiangYinQiangEff.png";
  }
  protected zT(_t: any): void {
    if (this.general.SD === "赵云") {
      if (MathE.rand() <= 0.05) this.KT();
    } else if (MathE.rand() <= 0.1) this.KT();
  }
  private KT(): void {
    let t = 0;
    this.xw.kw.forEach((s: any) => {
      t++;
      this.II(0, s.id);
      if (s.Bw && s.qd === this.general.qd) {
        const i = this.xE.Tw(
          {
            type: ae,
            Om: Ke.create().qL(s.id),
            Um: this.dI(100, { FL: s.id }),
            bm: this.general,
            Sm: 5 * this.Sm,
            Fm: 2,
          },
          { x: this.general.general.x + this.general.general.width / 2, y: this.general.general.y + 10 },
        );
        const h = i.Pm;
        h.alpha = 0;
        h.scaleY = 0;
        Laya.Tween.create(h)
          .duration(200)
          .delay(100 * t)
          .go("alpha", 0, 1)
          .go("scaleY", 0, 1)
          .parallel()
          .duration(1000)
          .onUpdate(() => {
            h.rotation = MathE.angle(h, s);
          })
          .then(() => {
            if (s.Bw) i.Xm();
            else i.Am();
          });
      }
    });
  }
}
WeaponFactory.register(1, 19, () => Laya.Pool.createByClass(DragonSilverPike));
