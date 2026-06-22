// Special knife weapons He (青龙偃月刀) + We (方天画戟) — type 2, ids 29/30.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~21407-21777. They depend on the jump-slash skill (`Xe`) + the dao-qi / lift
// bullets, so they live apart from the base knife set. He releases sweeping
// dao-qi on every kill (关羽's jump-slash releases them too); We juggles an
// enemy into the air and slams it for 5x + instant-kills low-HP targets. Opaque
// names kept verbatim.
//
//   QingLongBlade=He  FangTianHalberd=We

/* eslint-disable @typescript-eslint/no-explicit-any */

import { KnifeWeaponBase } from "./weapon-knife";
import { WeaponFactory } from "./weapon-factory";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { BuffMgr } from "./buff-mgr";
import { EffectMgr } from "./effect-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { HitStrategyFactory } from "./hit-strategy";
import { DaoQiBullet, TiaoQiBullet, VirtualBullet } from "./bullet-variants";
import { ForwardMovement, TargetEnemyBezierMovement, TargetObjectInstantaneous } from "./movements";
import { JumpSlash } from "./skills";

const $ = AudioMgr;
const te = DaoQiBullet;
const ee = TiaoQiBullet;
const Gh = VirtualBullet;
const Ge = ForwardMovement;
const oi = TargetEnemyBezierMovement;
const fi = TargetObjectInstantaneous;
const Xe = JumpSlash;

/** 青龙偃月刀 (29) — releases dao-qi on kills. (`He`) */
class QingLongBlade extends KnifeWeaponBase {
  static weaponName = "青龙偃月刀";
  static weaponDesc =
    "武将每斩杀一个敌人,会释放数团刀气无差别伤害所有敌人(从刀上释放出来，攻击所有敌人，有拖尾，伤害为单词伤害值)关羽每次跳劈都会无差别释放";
  private vT: any;
  private wT = false;
  private LT = (t: any): void => {
    if (t === (Xe as any).skillName) this.mT();
  };
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_29.png";
    this.wD = 100;
    this.wT = false;
  }
  iD(): void {
    super.iD();
    this._D.y += 20;
  }
  protected wI(): void {
    super.wI();
    this.dD = this._D.y;
    this.vT = new Laya.Image("resources/img/effect/loongTrail.png");
    const t = 1.6 * this.general.Da;
    this.vT.size(t, t);
    this.vT.anchor(0.5, 0.5);
    this.vT.pos(this.Hn.width / 2, this.Hn.pivotY);
    this.vT.rotation = 163;
    this.vT.alpha = 1;
    this.vT.visible = false;
    this.vT.name = "loong";
    this.Hn.addChild(this.vT);
    this.dg.toLocal(this.Hn, true, false);
    if (this.Ca === 0) this.gD.pos(30, 50);
    if (this.general.SD === "关羽") this.general.on("onSkillInterruptAttack", this.LT, this);
  }
  MI(): void {
    super.MI();
    this.vT.removeSelf();
    this.general.off("onSkillInterruptAttack", this.LT);
  }
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.II(s, undefined);
    this.dg.toLocal(this.Hn, true);
    if (this.wT) {
      this.NP(390, 1);
      this.wT = false;
    } else super.AI(t);
    this.xw.kw.get(t.id).once("onDead", () => {
      this.wT = true;
    }, this);
  }
  private kT(t: any): any {
    const s = {
      type: te,
      bm: this.general,
      Om: this.RI(Ge.create()),
      Um: this.dI(103, undefined),
      Sm: this.general.Ta,
      Fm: 1,
      Cw: { width: 91, height: 45 },
    };
    return this.xE.Tw(s, t);
  }
  private _T(): any {
    const t = this.dg.toLocal(this.Hn, new Laya.Point(this.Hn.x, this.Hn.y - 60), false);
    const s = this.kT(t);
    if (s.fm) s.Pm.rotation = this.Hn.rotation;
    s.Xm();
    return s;
  }
  private xT(t: any, s: any): any {
    const i = this.CI(t.id);
    const h = {
      type: te,
      bm: this.general,
      Om: oi.create(250, true).qL(t.id),
      Um: HitStrategyFactory.produce(100, { FL: t.id, IL: "requestRemove", BL: true }),
      Sm: this.general.Ta,
      Fm: 6,
      Cw: { width: 91, height: 45 },
    };
    const e = this.xE.Tw(h, s);
    if (e.fm) e.Pm.rotation = i;
    e.Xm();
    return e;
  }
  private mT(): void {
    const t = this.dg.toLocal(this.Hn, new Laya.Point(this.Hn.x - 10, this.Hn.y - 40), false);
    this.xw.RA(this.general.qd).forEach((s: any) => {
      this.xT(s, t);
    });
  }
  private NP(t: number, s: number): void {
    (this as any).kD = true;
    const i = this.vT.alpha;
    const h = this.Hn.rotation;
    const e = h + 90;
    const a = e - t;
    const n = this._D.y;
    let o = e - 10;
    const l = Laya.Tween.create(this.Hn)
      .to("rotation", e)
      .duration(300 / s)
      .ease(Laya.Ease.cubicIn)
      .parallel(this._D)
      .to("y", n - 40)
      .chain()
      .go("rotation", e, a)
      .duration(500 / s)
      .onStart(() => {
        if (this.vT) this.vT.visible = true;
      })
      .onUpdate(() => {
        if (this.Hn.rotation <= o) {
          this._T();
          o -= 10;
        }
      })
      .parallel(this._D)
      .to("y", n - 80)
      .then(() => {
        if (this.vT)
          Laya.Tween.to(
            this.vT,
            { alpha: 0.3 },
            250 / s,
            null,
            Laya.Handler.create(this, () => {
              this.vT.visible = false;
              Laya.Tween.killAll(this.vT);
            }),
          );
        this.OI();
      })
      .chain()
      .go("rotation", a, a + MathE.deltaAngle(a, h))
      .duration(250 / s)
      .parallel(this._D)
      .to("y", n - 40)
      .chain()
      .parallel(this._D)
      .to("y", n)
      .duration(200 / s)
      .then(() => {
        this.Hn.rotation = h;
        this.vT.alpha = i;
        this.general.mL = true;
        (this as any).kD = false;
      });
    this.UI(l);
  }
  protected bI(): void {
    const t = this._D.y;
    Laya.Tween.create(this._D).to("y", t - 3).duration(300).chain().to("y", t).duration(300).then(this.bI, this);
  }
  protected onAttackExit(): void {
    Laya.Tween.create(this.Hn).to("rotation", 0).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this._D);
  }
}
WeaponFactory.register(2, 29, () => Laya.Pool.createByClass(QingLongBlade));

/** 方天画戟 (30) — juggles + slams an enemy. (`We`) */
class FangTianHalberd extends KnifeWeaponBase {
  static weaponName = "方天画戟";
  static weaponDesc =
    "每次攻击有概率将敌人挑起扔在地上,造成5倍伤害,并瞬杀血量低于20%的敌人,武将等级越高,挑起概率越高(1级10% 2级15% 3级20% 4级25% 5级30%)";
  private ST = new Laya.Point(21, 23);
  private bT = [0.1, 0.15, 0.2, 0.25, 0.3];
  private MT = 0.1;
  constructor() {
    super();
    this.ZI = "resources/img/weapon/weapon_30.png";
    this.ST = new Laya.Point(21, 23);
    this.bT = [0.1, 0.15, 0.2, 0.25, 0.3];
    this.wD = 100;
  }
  iD(): void {
    super.iD();
    this._D.y += 20;
  }
  protected wI(): void {
    super.wI();
    if (this.Ca === 0) {
      this.gD.pos(21, 52);
      this.gD.scaleY = 1.2;
      this.gD.scaleX = 1.2;
    }
  }
  MI(): void {
    super.MI();
  }
  protected AI(t: any): void {
    const s = this.CI(t.id);
    this.MT = this.bT[this.general.level - 1];
    if (Math.random() <= this.MT)
      this.NP(
        {
          type: ee,
          bm: this.general,
          Sm: this.Sm,
          Cw: { parent: this._D, iB: { x: 0.5, y: 0 }, sB: { x: 0.5, y: 0 }, width: 35, height: 62 },
          Um: this.dI(100, { FL: t.id }),
          xm: "TiaoQiCut",
        },
        s,
        this.xw.kw.get(t.id),
        MathE.distance(this.general.general, t),
        this.general.fL,
      );
    else super.AI(t);
  }
  private NP(t: any, s: number, i: any, _h: number, e: number): any {
    (this as any).kD = true;
    t.Um = this.dI(100, { BL: false, IL: "hitEnable" });
    const a = this.xE.Tw(t);
    a.Um.DL = 980;
    this.general.mL = false;
    const n = Laya.Tween.create(this.Hn)
      .to("rotation", s)
      .duration(150 / e)
      .then(() => {
        this.OI();
        this.YI(a);
        const baseY = this._D.y;
        const r = this.xw.kw.get(this.xw.XA(this.general.qd).id);
        const o = this.dg.toLocal(r.enemy, true, false);
        const l = new Laya.Point(o.x - r.enemy.width / 2, o.y - r.enemy.height / 2);
        const c = this.CI(r.id);
        const p = c > 0 && c <= 180;
        const uu = this.general.qd === true ? (p ? -120 : 120) : p ? 120 : -120;
        n
          .parallel(this._D)
          .to("y", baseY + 40)
          .duration(260 / e)
          .ease(Laya.Ease.backIn)
          .then(a.Xm, a)
          .chain()
          .delay(200)
          .parallel(this._D)
          .to("y", 50 - _h)
          .duration(100 / e)
          .ease(Laya.Ease.cubicOut)
          .then(() => {
            BuffMgr.instance().applyBuff(i.id, 8, 0, false, 1000);
            EffectMgr.instance().playBloodEff(i.enemy, i.enemy.width / 2, i.enemy.height / 2);
            this.PT(i);
          })
          .chain()
          .parallel(this._D)
          .to("y", baseY)
          .duration(250 / e)
          .chain()
          .to("rotation", s + uu)
          .duration(400 / e)
          .parallel(this._D)
          .to("y", 65 - _h)
          .chain()
          .to("rotation", s)
          .duration(200 / e)
          .ease(Laya.Ease.backOut)
          .onStart(() => {
            Laya.timer.once(50, this, () => {
              Laya.timer.clearAll(this.Hn);
              const enemy = i.enemy;
              const rot = i.enemy.rotation;
              Laya.Tween.create(enemy)
                .to("y", l.y)
                .duration(190 / e)
                .ease(Laya.Ease.quadIn)
                .parallel()
                .to("x", l.x)
                .duration(190 / e)
                .parallel()
                .to("rotation", rot + 360)
                .duration(190 / e)
                .onStart(() => {
                  enemy.anchor(0.5, 0.5);
                })
                .chain()
                .to("rotation", rot)
                .duration(1)
                .then(() => {
                  enemy.anchor(0, 0);
                  EffectMgr.instance().playFallEff(enemy, enemy.width / 2, enemy.height);
                  i.Bw = true;
                  if (i.Qi >= 0.2 * i.VM) i.hit(5 * this.Sm, this.general);
                  else i.hit(i.Qi, this.general);
                  const list: any[] = [];
                  this.xw.CA(o.x, o.y, 50, this.general.qd, list);
                  list.forEach((en: any) => {
                    BuffMgr.instance().applyBuff(en.id, 9, this.Sm, false, 1000, this.general);
                  });
                });
            });
          })
          .chain()
          .parallel(this._D)
          .to("y", baseY)
          .duration(200 / e)
          .then(() => {
            Laya.timer.clearAll(this);
            (this as any).kD = false;
            this.general.mL = true;
          });
      });
    this.UI(n);
    return a;
  }
  private PT(t: any): any {
    const s = {
      type: Gh,
      bm: this.general,
      Sm: this.Sm,
      xm: "TiaoQi",
      Om: fi.create(this._D, this.ST.x, this.ST.y, false, false),
    };
    this.DI(s, 103, undefined);
    const i = this.xE.Tw(s);
    i.Xm();
    Laya.timer.frameLoop(1, this.Hn, () => {
      t.enemy.pos(i.Pm.x - t.enemy.width / 2, i.Pm.y - t.enemy.height / 2);
    });
    return i;
  }
  protected bI(): void {
    const t = this._D.y;
    Laya.Tween.create(this._D).to("y", t - 3).duration(300).chain().to("y", t).duration(300).then(this.bI, this);
  }
  protected onAttackExit(): void {
    Laya.Tween.create(this.Hn).to("rotation", 0).duration(300).then(this.bI, this);
  }
  protected vI(): void {
    super.vI();
    Laya.Tween.killAll(this._D);
  }
}
WeaponFactory.register(2, 30, () => Laya.Pool.createByClass(FangTianHalberd));
