// Sword/cavalry weapons (type 3) — archetype `ha` + its 14 concrete swords.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~22570-23256. `SwordWeaponBase` (ha) does an alternating-direction slash
// (gR/GT) and, every 10 hits, triggers either the 君子剑 (junzi, grow + AoE
// stun, self attack buff) or 小人剑 (xiaoRen, shrink + disable) ultimate — 刘备
// only junzi, 曹操 only xiaoRen. Concrete swords add a stat buff + trail colour.
// Opaque field names kept verbatim.
//
//   SwordWeaponBase=ha  slash=gR  trigger=fR  junzi=LR  xiaoRen=mR

/* eslint-disable @typescript-eslint/no-explicit-any */

import { WeaponComponent } from "./weapon-component";
import { WeaponFactory } from "./weapon-factory";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { BuffMgr } from "./buff-mgr";
import { EffectMgr } from "./effect-mgr";
import { HitEnemyStrategy } from "./hit-strategy";
import { SwordBullet, AttachCustomShapeBullet, TrailBehavior } from "./bullet-variants";

const de = WeaponFactory;
const $ = AudioMgr;
const f = MathE;
const th = BuffMgr;
const q = EffectMgr;
const Vs = HitEnemyStrategy;
const le = SwordBullet;
const he = AttachCustomShapeBullet;
const Oh = TrailBehavior;

export class SwordWeaponBase extends WeaponComponent {
  protected pm = false;
  protected rD = false;
  protected JT: any[] = [];
  trailColor = "#fff";
  protected tR = false;
  protected sR = new Laya.Point();
  protected iR = [
    "resources/img/effect/coldSwordEff01.png",
    "resources/img/effect/coldSwordEff02.png",
    "resources/img/effect/coldSwordEff03.png",
    "resources/img/effect/coldSwordEff04.png",
    "resources/img/effect/coldSwordEff05.png",
    "resources/img/effect/coldSwordEff06.png",
    "resources/img/effect/coldSwordEff07.png",
    "resources/img/effect/coldSwordEff08.png",
    "resources/img/effect/coldSwordEff09.png",
  ];
  protected hR: any;
  protected eR = 0;
  protected aR = 0;
  protected nR = 0;
  protected rR = false;
  protected oR = false;
  protected lR: any;
  protected pR: any;
  protected Mm = 0;
  protected ZI = "";
  protected cR: any;
  protected yR: any;
  protected uR: any;
  protected hD = -1;

  constructor() {
    super();
    this.hR = {
      type: le,
      bm: undefined,
      Sm: undefined,
      xm: "swordSweep",
      Cw: { pos: new Laya.Point(), bold: 10, length: 10, rotation: 0 },
    };
    this.lR = {
      Kg: "xiaoRenBuff",
      onStart: () => {
        this.general.mL = false;
        Laya.Tween.create(this.Hn)
          .to("rotation", 0)
          .duration(250)
          .chain()
          .go("scaleX", 1, 3)
          .go("scaleY", 1, 3)
          .duration(550)
          .ease(Laya.Ease.sineIn)
          .chain(this.cR)
          .go("y", 0, -10)
          .duration(200)
          .ease(Laya.Ease.sineInOut)
          .then(() => {
            Laya.Tween.create(this.uR)
              .go("alpha", 0, 1)
              .onStart(() => {
                this.uR.visible = true;
                const t = q.instance().registerImgLoop(this.uR, this.iR, 100, 0, 1);
                this.HI(() => {
                  q.instance().removeEvent("imgLoop", t);
                });
              })
              .chain()
              .delay(1000)
              .duration(500)
              .go("alpha", 1, 0);
            q.instance().playAlertRings(this.cR);
          })
          .chain()
          .go("y", -10, 0)
          .duration(200)
          .delay(750)
          .then(() => {
            this.general.mL = true;
            th.instance().applyBuff(this.general.id, 0, 2, true, 5000);
          });
      },
      onEnd: () => {
        Laya.Tween.create(this.Hn).duration(250).go("scaleX", 3, 1).go("scaleY", 3, 1).to("rotation", 0);
        this.rR = false;
        th.instance().nb(this.general.id, 5000, this.pR);
      },
    };
    this.pR = {
      Kg: "xiaoRenDebuff",
      onStart: () => {
        this.HI(() => {
          [this.general.rightWord, this.general.leftWord].forEach((t: any) => {
            Laya.Tween.killAll(t);
            t.scale(1, 1);
            t.rotation = 0;
          });
        });
        this.general.mL = false;
        this.oR = true;
        [this.general.rightWord, this.general.leftWord].forEach((t: any) => {
          Laya.Tween.killAll(t);
          Laya.Tween.create(t)
            .duration(5000)
            .to("x", 0)
            .to("y", 0)
            .to("rotation", 0)
            .interp(Laya.Tween.shake, 0.5)
            .onStart(() => {
              this.general.WD = false;
            })
            .parallel()
            .to("scaleX", 0.5)
            .to("scaleY", 0.5)
            .duration(1000)
            .then(() => {
              this.general.mL = true;
            });
        });
      },
      onEnd: () => {
        [this.general.rightWord, this.general.leftWord].forEach((t: any) => {
          Laya.Tween.killAll(t);
          Laya.Tween.create(t)
            .duration(1000)
            .go("scaleX", 0.5, 1)
            .go("scaleY", 0.5, 1)
            .to("rotation", 0)
            .then(this.XI, this);
        });
        this.oR = false;
      },
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
    this.Hn.size(33.6, 105.6);
    this.Hn.anchorX = 0.5;
    this.Hn.anchorY = 0.8;
    this.cR = new Laya.Image(this.ZI);
    this.cR.size(this.Hn.width, this.Hn.height);
    this.Hn.addChild(this.cR);
    this.cR.pos(0, 0);
    this.cR.zIndex = 10;
    this.yR = new Laya.Image("resources/img/effect/junZiWord.png");
    this.yR.size(this.Hn.width, this.Hn.height);
    this.yR.anchor(0.5, 0.5);
    this.cR.addChild(this.yR);
    this.uR = new Laya.Image("resources/img/effect/coldSwordEff01.png");
    this.uR.anchor(0.5, 0.5);
    this.uR.size(1.5 * this.Hn.width, 1.2 * this.Hn.height);
    this.uR.pos(this.Hn.width / 2, this.Hn.height / 2);
    this.cR.addChild(this.uR);
    this.uR.visible = false;
    this.yR.pos(this.Hn.width / 2, this.Hn.height / 2);
    this.yR.visible = false;
  }
  pos(t: number, s: number): void {
    s += 40;
    this.Hn.pos(t, s);
  }

  /** Alternating-direction slash beam. (`GT`) */
  protected GT(t: number, s: number, i: number, h: number, e: () => void): any {
    s *= this.tR ? 1 : -1;
    this.tR = !this.tR;
    this.hR.Sm = this.Sm;
    this.hR.bm = this.general;
    const a = this.hR.Cw;
    a.pos.setTo(this.Hn.pivotX, this.Hn.pivotY);
    this.dg.toLocal(this.Hn, a.pos);
    a.length = this.general.Da * (this.rR ? 3 : 1);
    a.Uw = 150 / h;
    a.rotation = t + s;
    a.Ow = t - s;
    this.DI(this.hR, 103, undefined);
    const n = this.hR.Um;
    if (n instanceof Vs) {
      n.DL = 100 * h;
      n.IL = "hitEnable";
      n.KB = true;
    }
    const r = this.xE.Tw(this.hR);
    this.FI(r);
    if (this.general.tD) this.general.tD.forEach((tc: any) => r.Tm(tc));
    Laya.Tween.create(this.Hn)
      .go("rotation", t + s, t - s)
      .duration(200 / h)
      .ease(Laya.Ease.quadOut)
      .onStart(() => {
        if (this.rR)
          Laya.timer.once(75 / h, this, () => {
            if (this.Hn.parent)
              q.instance().playColdDaoQiEffect(
                this.Hn.parent,
                this.Hn.x,
                this.Hn.y,
                t,
                Math.min(2, this.Hn.scaleX) * (this.tR ? 1 : -1),
              );
          });
        r.Xm();
      })
      .then(() => {
        this.YI(r);
        r.Am();
        e();
      });
    if (!this.rR)
      Laya.Tween.create(this.cR)
        .go("y", 0, -i)
        .duration(100 / h)
        .chain()
        .go("y", -i, 0)
        .duration(50 / h);
    return r;
  }

  /** Trigger gate: basic slash until 9 hits, then 君子/小人. (`fR`) */
  protected fR(t: any, s: number, i: number, h = 0.5): void {
    if (this.eR < 9) {
      this.gR(t, s, i);
      if (!this.oR && !this.rR) this.eR++;
    } else {
      if (Math.random() < (this.aR !== 0 ? this.aR : h)) this.dR();
      else this.LR();
      this.eR = 0;
    }
  }

  /** Basic slash toward a target. (`gR`) */
  protected gR(t: any, s: number, i: number): any {
    this.general.mL = false;
    Laya.Point.TEMP.setTo(this.Hn.pivotX, this.Hn.pivotY);
    this.dg.toLocal(this.Hn, Laya.Point.TEMP);
    this.sR.setTo(t.x + this.dg.map.gridWid / 2, t.y + this.dg.map.gridHei / 2);
    const h = f.distance(this.sR, Laya.Point.TEMP) - this.cR.pivotY;
    const e = this.CI(t.id);
    if (this.rR) {
      s = 120;
      i = 0.5;
    }
    $.instance().playSound("sword_attack");
    return this.GT(e, s, h, i, () => {
      this.general.mL = true;
    });
  }

  protected wI(): void {
    super.wI();
    if (this.general.SD === "刘备") this.aR = -Infinity;
    else if (this.general.SD === "曹操") this.aR = Infinity;
    else this.aR = 0;
    this.nR = this.cR.y;
  }
  protected bI(): void {
    if (!this.rR && Math.random() > 0.9)
      Laya.Tween.create(this.Hn)
        .to("rotation", 90)
        .duration(250)
        .chain()
        .to("rotation", -372)
        .duration(600)
        .ease(Laya.Ease.quadIn)
        .chain()
        .to("rotation", -348)
        .duration(150)
        .chain()
        .delay(250)
        .then(() => {
          this.Hn.rotation = 12;
          this.bI();
        }, this);
    else
      Laya.Tween.create(this.Hn)
        .to("rotation", 18)
        .duration(600)
        .chain()
        .to("rotation", 12)
        .duration(600)
        .delay(100)
        .then(this.bI, this);
    Laya.Tween.create(this.cR)
      .to("y", this.nR - 4)
      .duration(300)
      .chain()
      .to("y", this.nR)
      .duration(300)
      .ease(Laya.Ease.quadOut);
  }
  protected xI(): void {
    Laya.Tween.create(this.Hn).to("rotation", 15).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this.cR);
  }

  /** 君子剑 ultimate: grow + radiant rings + AoE stun. (`LR`) */
  protected LR(): void {
    if (this.JT.length === 0)
      for (let t = 5; t >= 1; t--) {
        const s = new Laya.Image("resources/img/mainUI/light1.png");
        s.anchor(0.5, 0.5);
        s.pos(this.Hn.width / 2, this.Hn.height / 2);
        s.size(100 * t, 100 * t);
        s.visible = false;
        this.Hn.addChild(s);
        this.JT.push(s);
      }
    this.general.mL = false;
    Laya.Tween.create(this.Hn)
      .to("rotation", 0)
      .duration(250)
      .chain(this.cR)
      .to("y", -40)
      .duration(250)
      .ease(Laya.Ease.sineIn)
      .onStart(() => {
        this.yR.alpha = 0;
        this.yR.visible = true;
        for (let t = 0; t < this.JT.length; t++) {
          const s = this.JT[t];
          s.scale(0, 0);
          s.visible = true;
          Laya.Tween.create(s)
            .go("alpha", 0, 1)
            .go("scaleX", 0, 1)
            .go("scaleY", 0, 1)
            .duration(250)
            .parallel()
            .duration(250 * (this.JT.length - t + 1))
            .go("rotation", 0, 25 * (this.JT.length - t + 1))
            .go("color", "#fff", "#ffff78")
            .ease(Laya.Ease.sineOut);
        }
      })
      .chain(this.yR)
      .duration(250)
      .go("alpha", 0, 1)
      .go("scaleX", 1.5, 1)
      .go("scaleY", 1.5, 1)
      .then(() => {
        q.instance().playAlertRings(this.yR);
        const t: any[] = [];
        this.xw.CA(this.general.general.x, this.general.general.y, this.general.Da, this.general.qd, t);
        t.forEach((e: any) => {
          th.instance().applyBuff(e.id, 8, 0, false, 3000);
        });
        this.xw.sd(this.Sm / 2, t, this.general);
      })
      .chain(this.cR)
      .delay(1500)
      .go("y", -40, 0)
      .duration(250)
      .onStart(() => {
        for (let t = 0; t < this.JT.length; t++) {
          const s = this.JT[t];
          s.scale(1, 1);
          Laya.Tween.create(s)
            .go("alpha", 1, 0)
            .go("scaleX", 1, 0)
            .go("scaleY", 1, 0)
            .go("rotation", 100 * (t + 1), 0)
            .duration(250)
            .then(() => {
              s.visible = false;
            });
        }
      })
      .chain(this.yR)
      .duration(100)
      .go("alpha", 1, 0)
      .then(() => {
        this.yR.visible = false;
        this.general.mL = true;
      });
  }

  gameOver(): void {
    super.gameOver();
    for (let t = 0; t < this.JT.length; t++) this.JT[t].destroy();
    this.yR.destroy();
    this.uR.destroy();
  }

  /** Trigger 小人剑 (xiaoRen). (`dR`) */
  protected dR(): void {
    if (!this.rR) {
      this.rR = true;
      th.instance().nb(this.general.id, 6500, this.lR);
    }
  }

  /** 小人剑 sweep (enlarged blade). (`mR`) */
  protected mR(t: number, s: number, i: () => void): any {
    const h = this.tR ? 120 : -120;
    this.tR = !this.tR;
    const e: any = {
      type: he,
      bm: this.general,
      Sm: this.Sm,
      xm: "swordSweep",
      Cw: {
        parent: this.cR,
        iB: { x: 0.5, y: 0.5 },
        sB: { x: 0.5, y: 1 },
        width: 20,
        height: this.Hn.height / 2,
      },
    };
    const a = e.Um;
    if (a instanceof Vs) {
      a.DL = 100 * s;
      a.IL = "hitEnable";
    }
    const n = this.xE.Tw(e);
    if (this.general.tD) this.general.tD.forEach((tc: any) => n.Tm(tc));
    const r = n.Cm(Oh);
    const o = { trailColor: "#6de8f855", uE: (this.Hn.height / 2) * this.Hn.scaleY };
    if (r) r.rE(o);
    else n.Tm(new Oh("arrowTrail", o));
    Laya.Tween.create(this.Hn)
      .go("rotation", t + h, t - h)
      .duration(300 / s)
      .ease(Laya.Ease.quadOut)
      .onStart(() => {
        if (this.rR)
          Laya.timer.once(100 / s, this, () => {
            q.instance().playColdDaoQiEffect(
              this.Hn.parent,
              this.Hn.x,
              this.Hn.y,
              t,
              Math.min(2, this.Hn.scaleX) * (this.tR ? 1 : -1),
            );
          });
        n.Xm();
      })
      .then(() => {
        n.Am();
        i();
      });
    return n;
  }
}

const SWORD_DESC =
  "每十次攻击,触发君子或小人两种技能，概率各50%。刘备只触发君子剑，曹操只触发小人剑。";

/** 默认剑 (-1). (`ea`) */
class DefaultSword extends SwordWeaponBase {
  constructor() {
    super();
    this.ZI = "resources/img/weapon/default_3.png";
  }
  protected AI(t: any): void {
    this.gR(t, 60, this.general.fL);
  }
  iD(): void {}
}
de.register(3, -1, () => Laya.Pool.createByClass(DefaultSword));

/** 短剑 (31). (`aa`) */
class ShortSword extends SwordWeaponBase {
  static weaponName = "短剑";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_31.png";
    this.trailColor = "#fff";
  }
  protected AI(t: any): void {
    this.gR(t, 60, this.general.fL);
  }
  iD(): void {}
}
de.register(3, 31, () => Laya.Pool.createByClass(ShortSword));

/** 长剑 (32) — +0.5 range. (`na`) */
class LongSword extends SwordWeaponBase {
  static weaponName = "长剑";
  static weaponDesc = "攻击距离+0.5";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_32.png";
    this.trailColor = "#7FDB81";
  }
  protected wI(): void {
    super.wI();
    this.hD = th.instance().applyBuff(this.general.id, 2, 0.5);
  }
  MI(): void {
    super.MI();
    th.instance().kg(this.general.id, 2, this.hD);
  }
  protected AI(t: any): void {
    this.gR(t, 60, this.general.fL);
  }
  iD(): void {}
}
de.register(3, 32, () => Laya.Pool.createByClass(LongSword));

/** 铁剑 (33) — +3 attack. (`ra`) */
class IronSword extends SwordWeaponBase {
  static weaponName = "铁剑";
  static weaponDesc = "攻击力+3";
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_33.png";
    this.trailColor = "#7FDB81";
  }
  protected wI(): void {
    super.wI();
    this.hD = th.instance().applyBuff(this.general.id, 0, 3);
  }
  MI(): void {
    super.MI();
    th.instance().kg(this.general.id, 0, this.hD);
  }
  protected AI(t: any): void {
    this.gR(t, 60, this.general.fL);
  }
  iD(): void {}
}
de.register(3, 33, () => Laya.Pool.createByClass(IronSword));

/** Junzi/xiaoRen-capable sword (every 10 hits triggers an ultimate). */
function makeUltimateSword(id: number, skin: string, color: string, name: string, forceProb?: number): void {
  const cls = class extends SwordWeaponBase {
    static weaponName = name;
    static weaponDesc = SWORD_DESC;
    constructor() {
      super();
      this.ZI = skin;
      this.trailColor = color;
    }
    protected AI(t: any): void {
      if (forceProb === undefined) this.fR(t, 60, this.general.fL);
      else this.fR(t, 60, this.general.fL, forceProb);
    }
    iD(): void {}
  };
  de.register(3, id, () => Laya.Pool.createByClass(cls));
}

makeUltimateSword(34, "resources/img/weapon/weapon_34.png", "#0061F0", "巨阙剑");
makeUltimateSword(35, "resources/img/weapon/weapon_35.png", "#0061F0", "龙泉剑");
makeUltimateSword(36, "resources/img/weapon/weapon_36.png", "#9270E8", "龙渊剑", 0);
makeUltimateSword(37, "resources/img/weapon/weapon_37.png", "#9270E8", "双股剑", 1);
makeUltimateSword(38, "resources/img/weapon/weapon_38.png", "#9270E8", "青钢剑");
makeUltimateSword(39, "resources/img/weapon/weapon_39.png", "#9270E8", "七星剑");
makeUltimateSword(40, "resources/img/weapon/weapon_40.png", "#FF6C2E", "倚天剑");
makeUltimateSword(41, "resources/img/weapon/weapon_41.png", "#FF6C2E", "莫邪");
makeUltimateSword(42, "resources/img/weapon/weapon_42.png", "#FF6C2E", "干将");
makeUltimateSword(43, "resources/img/weapon/weapon_43.png", "#FF6C2E", "轩辕剑");

console.log("武器注册文件已加载，所有武器类已注册到WeaponFactory");
