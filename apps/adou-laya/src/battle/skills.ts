// Concrete general skills + their bullet hit-behaviours.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js skills
// `ka` (大喝), `Sa` (晕眩), `Ea` (圣剑), `Da` (火箭烈), `Ra` (箭雨) and the on-hit
// behaviours `xa` (stun), `Aa` (trip), `Oa` (slow) — lines ~23838-24430. (The
// intricate `Xe` jump-slash and `Ha` phantom skills are ported separately.)
// Opaque field names kept verbatim.
//
//   BattleShout=ka  StunSkill=Sa  HolyBlade=Ea  FireArrowRain=Da  ArrowRain=Ra
//   StunOnHit=xa  TripOnHit=Aa  SlowOnHit=Oa

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Skill } from "./skill";
import { BulletBehavior } from "./bullet-behavior";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { MathE } from "../core/math-e";
import { EffectMgr } from "./effect-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BulletSpawnMgr } from "./bullet-spawn-mgr";
import { BuffMgr } from "./buff-mgr";
import { HitStrategyFactory, HitStrategy103 } from "./hit-strategy";
import { SimpleDynamicArrow } from "./bullet";
import { FireExplosiveArrow, TrailBehavior, VirtualBullet, ExplosionBehavior } from "./bullet-variants";
import { TargetDirectionWaveMovement, TargetPositionBezierMovement, TargetEnemyBezierMovement, TargetObjectInstantaneous } from "./movements";
import { BulletEvent } from "./bullet-movement";
import { AnimPlayer } from "./anim-player";
import { WeaponMgr } from "./weapon-factory";

const Gh = VirtualBullet;
const jh = ExplosionBehavior;
const ai = BulletEvent;
const fi = TargetObjectInstantaneous;
const Zt = AnimPlayer;
const Ga = Laya.Pool;

const $ = AudioMgr;
const Js = HitStrategy103;
const ri = SimpleDynamicArrow;
const Nh = FireExplosiveArrow;
const Oh = TrailBehavior;
const Xh = TargetDirectionWaveMovement;
const Fe = TargetPositionBezierMovement;
const oi = TargetEnemyBezierMovement;

/** Stun-on-hit behaviour (马超 lightning). (`xa`) */
export class StunOnHitBehavior extends BulletBehavior {
  private QR: boolean;
  private ZR: number;
  private KR: number;
  private JR: number;
  private tC: number;
  constructor(t: number, s = 0, i = 0, h = 0, e = false) {
    super();
    this.QR = e;
    this.ZR = t;
    this.KR = i;
    this.JR = s;
    this.tC = h;
  }
  $m(t: any, s: any): void {
    if (MathE.rand() <= (t.yM ? this.tC : this.JR)) {
      BuffMgr.instance().applyBuff(t.id, 8, 0, false, t.yM ? this.KR : this.ZR);
      if (this.QR) {
        EffectMgr.instance().playElectricEffect(t.enemy.parent, t.enemy.x + t.enemy.width / 2, t.enemy.y + t.enemy.height / 2);
        $.instance().playSound("maChao_attack_lightning");
        t.hit(t.VM * (t.yM ? 0.02 : 0.1), s.bm);
      }
    }
  }
}

/** Trip-on-hit behaviour. (`Aa`) */
export class TripOnHitBehavior extends BulletBehavior {
  private rC: number;
  private oC: number;
  private JR: number;
  private tC: number;
  constructor(t: number, s = 0, i = 0, h = 0) {
    super();
    this.rC = t;
    this.oC = i;
    this.JR = s;
    this.tC = h;
  }
  $m(t: any, _s: any): void {
    if (MathE.rand() <= (t.yM ? this.tC : this.JR)) BuffMgr.instance().applyBuff(t.id, 17, 0, false, t.yM ? this.oC : this.rC);
  }
}

/** Slow-on-hit behaviour (attack-speed debuff). (`Oa`) */
export class SlowOnHitBehavior extends BulletBehavior {
  private mC: number;
  private wC: number;
  constructor(t: number, s: number) {
    super();
    this.mC = t;
    this.wC = -s;
  }
  $m(t: any, _s: any): void {
    BuffMgr.instance().applyBuff(t.id, 3, this.wC, true, this.mC);
  }
}

/** 大喝 — slam-shout, ground-stuns a radius. (`ka`) */
export class BattleShout extends Skill {
  private WR = 0;
  private zR = 3;
  private jR: any[] = [];
  private $R = { x: 0, y: 0, radius: 0 };
  private NR = new Set<any>();
  private qR: any;
  private gd = 0;
  constructor(t: number, s: number) {
    super();
    this.YD = true;
    this.QD = 3;
    this.WR = 0;
    this.JD = true;
    this.tT = false;
    this.zR = 3;
    this.jR = [];
    this.$R = { x: 0, y: 0, radius: 0 };
    this.NR = new Set();
    this.QD = t;
    this.WR = s;
  }
  protected zD(): boolean {
    return true;
  }
  qD(): any {
    this.HD.mL = false;
    const t = this.HD.Da / GameMgr.instance().map.gridWid;
    return new Promise<void>((resolve) => {
      const i = this.gT();
      i.parallel()
        .go("y", this.gd, -80)
        .duration(100 / this.YL)
        .chain()
        .go("y", -80, this.gd)
        .duration(100 / this.YL)
        .then(() => {
          let h: any;
          this.OI(i);
          this.fT();
          this.HD.box.addChild(this.qR);
          this.qR.pos(this.HD.box.width / 2, this.HD.box.height / 2);
          for (let s = 0; s < this.jR.length; s++) {
            const img = this.jR[s];
            img.alpha = 0.7;
            img.scale(0, 0);
            h = Laya.Tween.create(img)
              .duration(300 / this.YL)
              .delay((100 * s) / this.YL)
              .to("scaleX", t * (3 / 4))
              .to("scaleY", t * (3 / 4))
              .chain(img)
              .duration(100 / this.YL)
              .go("scaleX", t * (3 / 4), t)
              .go("scaleY", t * (3 / 4), t)
              .to("alpha", 0);
          }
          this.VR();
          h.then(() => {
            this.HD.mL = true;
            this.$D();
            resolve();
            UpdateMgr.instance().unregister("battleShoutSkill" + this.HD.id);
            this.NR.clear();
            this.$R.radius = 0;
          });
          this.$R.x = this.HD.general.x + this.HD.general.width / 4;
          this.$R.y = this.HD.general.y + this.HD.general.height / 2;
          UpdateMgr.instance().register("battleShoutSkill" + this.HD.id, this, this.VR);
        });
    });
  }
  private VR(): void {
    this.$R.radius = (this.jR[0].width * this.jR[0].scaleX) / 2;
    const t = EnemySpatialMgr.instance().lv(this.$R.x, this.$R.y, this.$R.radius, this.HD.qd);
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (!this.NR.has(i.id)) {
        BuffMgr.instance().applyBuff(i.id, 8, 1, false, this.WR);
        this.NR.add(i.id);
      }
    }
  }
  private gT(): any {
    return Laya.Tween.create(this.HD.box)
      .go("scaleY", 1, 0.8)
      .go("scaleX", 1, 1.2)
      .duration(250)
      .ease(Laya.Ease.linear)
      .chain()
      .go("scaleY", 0.8, 1.1)
      .go("scaleX", 1.2, 0.9)
      .duration(250)
      .ease(Laya.Ease.linear);
  }
  private fT(): void {
    Laya.Tween.create(this.HD.box)
      .go("scaleY", 1.1, 0.8)
      .go("scaleX", 0.9, 1.2)
      .duration(150)
      .ease(Laya.Ease.linear)
      .chain()
      .go("scaleY", 0.8, 1)
      .go("scaleX", 1.2, 1)
      .duration(150)
      .ease(Laya.Ease.linear);
  }
  protected Zd(): void {
    this.qR = new Laya.Sprite();
    for (let t = 0; t < this.zR; t++) {
      const img = new Laya.Image("resources/img/effect/soundWave.png");
      img.anchor(0.5, 0.5);
      img.size(153, 157);
      img.scale(0, 0);
      this.qR.addChild(img);
      this.jR.push(img);
    }
    this.gd = this.HD.box.y;
  }
  protected onActive(): void {
    this.HD.jd = true;
    $.instance().playSound("general_ground_slam");
  }
  protected ND(): void {
    this.HD.jd = false;
    this.OI();
    this.XI();
  }
  dT(): void {
    UpdateMgr.instance().unregister("battleShoutSkill" + this.HD.id);
    this.jR = [];
    this.qR.destroy(true);
  }
}
(BattleShout as any).skillName = "大喝";
(BattleShout as any).description = "大喝一声，砸晕一圈敌人，晕眩2秒";

/** 晕眩 — chance-to-stun bullet behaviour attached to attacks. (`Sa`) */
export class StunSkill extends Skill {
  private sC: number;
  private WR: number;
  private iC: number;
  private hC: number;
  private QR: boolean;
  private eC: any = null;
  constructor(t = 0.1, s = 1000, i = 0, h = 0, e = false) {
    super();
    this.sC = t;
    this.WR = s;
    this.iC = i;
    this.hC = h;
    this.QR = e;
    this.QD = 0;
    this.JD = false;
    this.tT = false;
    this.eC = null;
  }
  protected zD(): boolean {
    return true;
  }
  protected Zd(): void {}
  protected onActive(): void {
    this.eC = new StunOnHitBehavior(this.WR, this.sC, this.hC, this.iC, this.QR);
    this.HD.tD.push(this.eC);
  }
  protected ND(): void {
    this.HD.tD.splice(this.HD.tD.indexOf(this.eC), 1);
  }
  dT(): void {}
}
(StunSkill as any).skillName = "晕眩";
(StunSkill as any).description = "每次攻击概率造成敌人眩晕";

/** 圣剑 — launches a holy blade for AoE knockdown. (`Ea`) */
export class HolyBlade extends Skill {
  private lC: any;
  constructor(t: number) {
    super();
    this.QD = t;
    this.tT = false;
    this.JD = false;
    this.lC = {
      type: ri,
      Sm: 0,
      Um: Js.AL,
      Om: undefined,
      ow: {
        xm: "holyBlade",
        ew: "resources/img/weapon/weapon_40.png",
        aw: { x: 40, y: 110 },
        rw: { x: 0.5, y: 0.5 },
      },
      Fm: 3,
      bm: undefined,
    };
  }
  get name(): string {
    return "圣剑";
  }
  protected zD(): boolean {
    return true;
  }
  protected onActive(): void {
    const t = this.HD.uT();
    if (!t) {
      this.$D();
      return;
    }
    this.lC.bm = this.HD;
    this.lC.Sm = 5 * this.HD.QE.Sm;
    this.lC.VA = [new TripOnHitBehavior(2000, 1), new Oh("arrowTrail", { uE: 40 })];
    this.lC.Om = Xh.create(0.5, 50, 0).QL(MathE.angle(this.HD.general, t));
    const s = BulletSpawnMgr.instance().Tw(this.lC, this.HD.general);
    s.Pm.alpha = 0.5;
    s.Xm();
    this.$D();
  }
  protected ND(): void {}
  dT(): void {}
  protected Zd(): void {}
}
(HolyBlade as any).skillName = "圣剑";
(HolyBlade as any).description = "释放一柄圣剑，造成范围伤害，并击倒敌人";

/** 火箭烈 — barrages the lane with fire-explosive arrows. (`Da`) */
export class FireArrowRain extends Skill {
  private cC = 10;
  private UE = 150;
  constructor(t = 3) {
    super();
    this.QD = 3;
    this.YD = true;
    this.JD = true;
    this.tT = false;
    this.cC = 10;
    this.UE = 150;
    this.QD = t;
  }
  protected zD(): boolean {
    return this.HD.cT === 0;
  }
  qD(): any {
    this.HD.mL = false;
    return this.uC();
  }
  protected Zd(): void {}
  protected onActive(): void {
    this.HD.jd = true;
    $.instance().playSound("general_fire_arrow_rain");
  }
  protected ND(): void {
    this.HD.jd = false;
    this.HD.mL = true;
  }
  private async uC(): Promise<void> {
    const t = this.pC();
    for (let s = 0; s < t.length; s++) await this.sD(t[s]);
    this.$D();
  }
  private sD(t: any): Promise<void> {
    const s: any = {
      type: Nh,
      xm: "fireArrowRain",
      Om: Fe.create(500 + (MathE.range(0, 250) as number)).KL(t),
      Sm: 2 * this.HD.Ta,
      Um: HitStrategyFactory.produce(100, { FL: -1, IL: "requestRemove" }),
      bm: this.HD,
      rm: { um: 0.5 },
    };
    const i = BulletSpawnMgr.instance().Tw(s);
    i.Jm = true;
    i.UE = this.UE;
    const h = this.HD.QE;
    return new Promise<void>((resolve) => {
      h.KI(i, s.Om.bw(GameMgr.instance().toLocal(this.HD.QE.Hn, true)), (this.cC / 5) * this.YL, () => {
        this.HD.event("onSkillInterruptAttack", this.name);
        resolve();
      });
    });
  }
  private pC(): any[] {
    const t = GameMgr.instance();
    const s = t.map.gridWid;
    const i = t.map.gridHei;
    const h = this.HD.qd ? t.map.de : t.map.Le;
    if (!h) return [];
    const e = h;
    const a: any[] = [];
    this.cC = 10;
    for (let k = 0; k < e.length; k++) {
      const cell = e[k];
      const n = Math.floor(Math.max(1, (this.HD.level - 1) / 2));
      const r = (MathE.range(1, 3, true) as number) * n;
      this.cC += r;
      for (let m = 0; m < r; m++) {
        const dx = MathE.range(0.3 * -s, 0.3 * s, true) as number;
        const dy = MathE.range(0.3 * -i, 0.3 * i, true) as number;
        const px = cell.x * s + s / 2 + dx;
        const py = cell.y * i + i / 2 + dy;
        a.push(new Laya.Vector2(px, py));
      }
    }
    MathE.shuffle(a);
    return a;
  }
  dT(): void {}
}
(FireArrowRain as any).skillName = "火箭烈";
(FireArrowRain as any).description = "射出大量火箭轰炸敌人";

/** 箭雨 — repeated waves of homing arrows. (`Ra`) */
export class ArrowRain extends Skill {
  private fC = 10;
  private gC = 5;
  private dC = 0;
  constructor(t: number) {
    super();
    this.YD = true;
    this.QD = 5;
    this.JD = true;
    this.tT = false;
    this.XD = true;
    this.fC = 10;
    this.gC = 5;
    this.dC = 0;
    this.QD = t;
  }
  protected zD(): boolean {
    return this.HD.cT === 0;
  }
  protected Zd(): void {}
  protected onActive(): void {
    this.HD.jd = true;
    $.instance().playSound("general_arrow_rain");
  }
  protected ND(): void {
    this.dC = 0;
    this.HD.jd = false;
    this.HD.mL = true;
  }
  qD(): any {
    this.HD.mL = false;
    return this.LC();
  }
  private LC(): Promise<void> {
    if (this.dC >= this.gC) return Promise.resolve();
    const t = this.HD.QE;
    const s = this.HD.Ew;
    const i = EnemySpatialMgr.instance();
    const h: any[] = [];
    for (let k = 1; k <= this.fC; k++) {
      let e = this.fC > s.length ? s[k % s.length].id : s[MathE.range(0, s.length - 1, true) as number].id;
      if (!e) e = i.XA(this.HD.qd).id;
      if (e === -1 || e == null) continue;
      const a = BulletSpawnMgr.instance().Tw({
        type: ri,
        ow: { xm: "arrowRain", ew: "resources/img/weapon/arrow_2.png" },
        Om: oi.create(1000 + (MathE.range(0, 200) as number)).qL(e),
        Sm: this.HD.Ta,
        Um: HitStrategyFactory.produce(100, { FL: e, IL: "requestRemove" }),
        bm: this.HD,
      });
      a.rm.um = 0.5;
      a.Jm = true;
      a.Pm.visible = false;
      h.push(a);
    }
    for (let k = h.length - 1; k >= 0; k--) if (h[k].Bm) h.splice(k, 1);
    if (h.length === 0) return Promise.resolve();
    h[0].Pm.visible = true;
    return new Promise<void>((resolve) => {
      t.KI(h[0], 0, (this.gC / 2) * this.YL, () => {
        this.HD.event("onSkillInterruptAttack", this.name);
        for (let k = 1; k < h.length; k++) {
          h[k].Pm.pos(h[0].Pm.x, h[0].Pm.y);
          h[k].Pm.visible = true;
          h[k].Xm();
        }
        this.dC++;
        this.LC().then(() => {
          this.$D();
          this.HD.mL = true;
          resolve();
        });
      });
    });
  }
  dT(): void {}
}
(ArrowRain as any).skillName = "箭雨";
(ArrowRain as any).description = "射出大量箭雨";

/** 跳斩 — leaps between enemies, AoE splash each landing. (`Xe`) */
export class JumpSlash extends Skill {
  private KD = 5;
  private sT = 0;
  private iT = 0;
  private hT = new Laya.Point();
  private eT = new Laya.Vector2();
  private aT = new Laya.Vector2();
  private nT = new Laya.Vector2();
  private rT = new Laya.Point();
  private oT = 0;
  private lT = 1;
  constructor(t: number, s: number, i = 0) {
    super();
    this.QD = 3;
    this.KD = 5;
    this.JD = true;
    this.tT = true;
    this.YD = true;
    this.XD = true;
    this.sT = 0;
    this.iT = 0;
    this.QD = t;
    this.KD = s;
    this.iT = i;
  }
  protected zD(): boolean {
    const t = this.HD.cT;
    return t === 3 || t === 2 || t === 1;
  }
  qD(): any {
    this.HD.mL = false;
    const t = EnemySpatialMgr.instance();
    let s: any;
    if (this.iT === 0) s = t.GA(this.HD.qd);
    else if (this.iT === 1) s = t.XA(this.HD.qd);
    else if (this.iT === 2) s = this.HD.uT();
    const i = t.kw.get(s.id);
    let h: any;
    this.oT = 0;
    switch (this.sT) {
      case 0:
        h = this.HD.leftWord;
        break;
      case 1:
        h = this.HD.rightWord;
        break;
      case 2:
        h = this.HD.box;
    }
    const e = this.HD.QE.Hn;
    this.rT.setTo(e.x, e.y);
    e.x = 0;
    e.y = 40;
    this.nT.setValue(h.x, h.y);
    this.hT.setTo(0, 0);
    GameMgr.instance().toLocal(h, this.hT);
    this.eT.setValue(this.hT.x, this.hT.y);
    this.pT(i);
  }
  private pT(t: any): void {
    if (!t || !t.Bw) {
      this.yT();
      return;
    }
    let s: any;
    this.oT++;
    switch (this.sT) {
      case 0:
        s = this.HD.leftWord;
        break;
      case 1:
        s = this.HD.rightWord;
        break;
      case 2:
        s = this.HD.box;
    }
    const i = GameMgr.instance();
    const h = i.toLocal(s, true);
    const e = this.HD.QE.Hn;
    const a = e.y;
    const n = e.anchorY;
    const r = h.x < t.centerX;
    this.aT.setValue(t.centerX + (r ? -i.map.gridWid : i.map.gridWid), t.enemy.y + i.map.gridHei);
    const o = BulletSpawnMgr.instance().Tw(
      {
        type: Gh,
        bm: this.HD,
        xm: "jumpSlashVirtual",
        Om: Fe.create(500).KL(this.aT),
        Um: HitStrategyFactory.produce(100, { FL: t.id, IL: "requestRemove" }),
        Sm: this.HD.Ta,
        Fm: this.YL,
        VA: [new jh({ radius: 200, Sm: this.HD.Ta / 2, force: 1, RE: false, BE: false })],
      },
      h,
    );
    let l: any;
    o.Pm.scaleX = this.lT;
    this.lT = r ? -1 : 1;
    Laya.Tween.create(o.Pm).to("scaleX", this.lT).duration(200 / this.YL);
    o.Jm = true;
    o.Pm.size(s.width, s.height);
    o.rm.lm = 500 / this.YL;
    o.Pm.addChild(s);
    o.once(ai.sm, () => {
      e.anchorY = 0.8;
      l = Laya.Tween.create(e);
      l.to("rotation", 48)
        .go("y", a, a - 20)
        .ease(Laya.Ease.sineOut)
        .duration(250 / this.YL)
        .then(() => {
          o.rm.um = 2 * this.YL;
        })
        .chain()
        .delay(150 / this.YL)
        .go("rotation", 24, -128)
        .go("y", a - 20, a)
        .ease(Laya.Ease.sineIn)
        .duration(100 / this.YL)
        .then(() => {
          this.HD.event("onSkillInterruptAttack", this.name);
        });
    });
    o.once(ai.am, () => {
      l.chain()
        .go("rotation", -128, -89)
        .go("anchorY", 0.8, n)
        .duration(100 / this.YL)
        .chain()
        .go("rotation", -89, 0)
        .duration(120 / this.YL);
      this.fT(s);
      const map = i.map;
      if (t.Bw) {
        t.hit(this.HD.Ta, this.HD);
        EffectMgr.instance().playCrackEffect(i.Qn, t.centerX, t.y + map.gridHei, 300);
        $.instance().playSound("jumpSlash_stomp");
      }
    });
    o.once(ai.hm, () => {
      if (this.oT >= this.KD) {
        this.oT = 0;
        this.yT();
        return;
      }
      if (this.oT >= 0) {
        const tt = EnemySpatialMgr.instance();
        const ss = tt.GA(this.HD.qd);
        if (!ss) {
          this.oT = 0;
          this.yT();
          return;
        }
        const ii = tt.kw.get(ss.id);
        this.pT(ii);
      }
    });
    this.gT(s, o);
  }
  private yT(): void {
    let t: any;
    switch (this.sT) {
      case 0:
        t = this.HD.leftWord;
        break;
      case 1:
        t = this.HD.rightWord;
        break;
      case 2:
        t = this.HD.box;
    }
    this.eT.setValue(this.eT.x + t.width / 2, this.eT.y + t.height / 2);
    const s = GameMgr.instance().toLocal(t, true);
    const i = BulletSpawnMgr.instance().Tw(
      { type: Gh, bm: this.HD, Om: Fe.create(500).KL(this.eT), Fm: 0.8 * this.YL, xm: "jumpBackVirtual" },
      s,
    );
    i.Pm.scaleX = this.lT;
    Laya.Tween.create(i.Pm).to("scaleX", 1).duration(200 / this.YL);
    const h = this.HD.QE.Hn;
    Laya.Tween.create(h).to("x", this.rT.x).to("y", this.rT.y).duration(200 / this.YL);
    i.Jm = true;
    i.Pm.size(t.width, t.height);
    i.Pm.addChild(t);
    i.once(ai.hm, () => {
      this.HD.mL = true;
      this.$D();
      if (this.sT === 2) this.HD.general.addChild(t);
      else this.HD.box.addChild(t);
      t.pos(this.nT.x, this.nT.y);
      this.fT(t);
    });
    this.gT(t, i);
  }
  private gT(t: any, s: any): void {
    Laya.timer.once(250, s, s.Xm);
    Laya.Tween.create(t)
      .go("scaleY", 1, 0.8)
      .go("scaleX", 1, 1.2)
      .duration(250 / this.YL)
      .ease(Laya.Ease.linear)
      .chain()
      .go("scaleY", 0.8, 1.1)
      .go("scaleX", 1.2, 0.9)
      .duration(250 / this.YL)
      .ease(Laya.Ease.linear);
  }
  private fT(t: any): void {
    Laya.Tween.create(t)
      .go("scaleY", 1.1, 0.8)
      .go("scaleX", 0.9, 1.2)
      .duration(150 / this.YL)
      .ease(Laya.Ease.linear)
      .chain()
      .go("scaleY", 0.8, 1)
      .go("scaleX", 1.2, 1)
      .duration(150 / this.YL)
      .ease(Laya.Ease.linear);
  }
  protected Zd(): void {}
  protected onActive(): void {
    this.HD.gL = 0;
    this.HD.jd = true;
  }
  protected ND(): void {
    this.oT = 0;
    this.HD.jd = false;
  }
  dT(): void {
    Laya.Tween.killAll(this.HD.QE.Hn);
  }
}
(JumpSlash as any).skillName = "跳斩";
(JumpSlash as any).description = "接下来数次攻击为跳斩，每次攻击对周围造成50％溅射伤害";

/** 七进七出 — spawns a phantom that dashes the lane attacking, seven times. (`Ha`) */
export class PhantomSkill extends Skill {
  static aU = 25;
  static hU = 100;
  static OC = new WeakMap<any, any>();

  private vC = new Map<string, number>();
  private kC = false;
  private _C = new Set<any>();
  private xC = new Set<any>();
  private SC = false;
  private bC = false;
  private MC = new Laya.Vector2();
  private Xu = 300;
  private PC = 7;
  private AC = 0.8;
  private TC = "";
  private IC = "";
  private dg: any;
  private xw: any;
  private RC: any;

  constructor(t: number) {
    super();
    this.QD = 3;
    this.JD = false;
    this.tT = false;
    this.QD = t;
  }
  protected zD(): boolean {
    const t = this.HD.cT;
    return (t === 3 || t === 2 || t === 1) && this.EC() !== null;
  }
  protected Zd(): void {
    this.bC = false;
    this.BC();
    if (this.kC && this.IC) {
      UpdateMgr.instance().unregister(this.IC);
      this.kC = false;
    }
    for (const t of [...this.xC, ...this._C]) this.DC(t);
    this.TC = `Phantom${this.HD.id}${this.HD.weaponId}_${this.HD.qd}`;
    this.IC = this.HD.id + "_PhantomAttackSkill";
    this.dg = GameMgr.instance();
    this.xw = EnemySpatialMgr.instance();
    this.RC = this.HD.qd ? this.dg.map.de : this.dg.map.Le;
    this.vC.clear();
    const t = this.RC;
    if (t) for (let s = 0; s < t.length; s++) this.vC.set(t[s].x + "_" + t[s].y, s);
  }
  protected onActive(): void {
    this.CC(this.UC());
    this.$D();
  }
  protected ND(): void {}
  dT(): void {
    this.bC = true;
    for (const t of [...this.xC, ...this._C]) this.DC(t);
    if (this.kC) {
      UpdateMgr.instance().unregister(this.IC);
      this.kC = false;
    }
    this.BC();
  }
  private FC(s: any): any {
    const i = PhantomSkill.OC.get(s);
    if (!i) throw new Error("PhantomAttackSkill.phantomRt: 幻影缺少运行时状态");
    return i;
  }
  private UC(): any {
    const t = Ga.getItemByCreateFun(this.TC, () => this.YC(), this);
    t.scale(this.AC, this.AC);
    t.zIndex = 100;
    const s = this.FC(t);
    s.pk = 0;
    s.XC = 0;
    s.Ec = 0;
    s.dir = -1;
    s.HC = -1;
    s.WC = -1;
    s.zC = false;
    if (s.Pm) {
      s.Pm.Am();
      s.Pm = null;
    }
    return t;
  }
  private YC(): any {
    const s = new Laya.Sprite();
    const i = this.HD.box;
    s.size(i.width / 2, i.height);
    s.anchor(0.5, 0.5);
    let h: any = null;
    if (this.HD.vL) {
      h = [];
      const t = Zt.instance().pf(this.HD.vL);
      s.addChild(t);
      t.pos(40, 80);
      t.play("zhan1", true);
      h.push(t);
    } else {
      const t = this.HD.va[0];
      const img = new Laya.Image(t.hL.skin);
      s.addChild(img);
      img.pos(t.Yn.x, t.Yn.y);
    }
    const e = WeaponMgr.instance().vR(this.HD.cT, this.HD.weaponId);
    s.addChild(e.Hn);
    e.pos(0, 0);
    PhantomSkill.OC.set(s, {
      Hn: e,
      Pm: null,
      pk: 0,
      XC: 0,
      Ec: 0,
      dir: -1,
      HC: -1,
      jC: h,
      zC: false,
      WC: -1,
    });
    return s;
  }
  private DC(s: any): void {
    this.$C(s);
    this._C.delete(s);
    this.xC.delete(s);
    const i = PhantomSkill.OC.get(s);
    if (i) {
      i.zC = false;
      if (i.Pm) {
        i.Pm.Am();
        i.Pm = null;
      }
      Laya.Tween.killAll(i.Hn.Hn);
    }
    Laya.Tween.killAll(s);
    s.removeSelf();
    s.rotation = 0;
    s.scale(this.AC, this.AC);
    Ga.recover(this.TC, s);
    if (this.kC && this._C.size === 0) {
      UpdateMgr.instance().unregister(this.IC);
      this.kC = false;
    }
  }
  private CC(t: any): void {
    const s = this.FC(t);
    const i = this.EC();
    if (i) {
      s.HC = this.NC(i);
      if (s.HC < 0) this.DC(t);
      else {
        this.xC.add(t);
        this.HD.general.addChild(t);
        this.qC(s.HC, this.MC);
        this.VC(t, this.MC);
      }
    } else this.DC(t);
  }
  private VC(t: any, s: any): void {
    const i = this.dg.toLocal(this.HD.general, true);
    const h = BulletSpawnMgr.instance().Tw(
      {
        type: Gh,
        bm: this.HD,
        xm: "jumpPhantomVirtual",
        Om: Fe.create(500).KL(s),
        Fm: 1,
        VA: [new Oh("arrowTrail", { uE: t.width, trailColor: "#7adff6" })],
      },
      i,
    );
    h.Jm = true;
    h.Pm.size(t.width, t.height);
    h.rm.lm = 50;
    h.Pm.addChild(t);
    t.pos(t.width / 2, t.height / 2);
    h.once(ai.hm, () => this.QC(t, h));
    const e = this.AC;
    Laya.timer.once(250, h, h.Xm);
    Laya.Tween.create(t)
      .go("scaleY", 1.25 * e, e)
      .go("scaleX", 1.25 * e, 1.5 * e)
      .duration(250)
      .ease(Laya.Ease.linear)
      .chain()
      .go("scaleY", e, 1.375 * e)
      .go("scaleX", 1.5 * e, 1.125 * e)
      .duration(250)
      .ease(Laya.Ease.linear);
  }
  private QC(t: any, s: any): void {
    this.xC.delete(t);
    const i = this.FC(t);
    if (this.bC) {
      this.DC(t);
      return;
    }
    const h = this.AC;
    Laya.Tween.create(t)
      .go("scaleY", 1.375 * h, h)
      .go("scaleX", 1.125 * h, 1.5 * h)
      .duration(150)
      .ease(Laya.Ease.linear)
      .chain()
      .go("scaleY", h, h)
      .go("scaleX", 1.5 * h, h)
      .duration(150)
      .ease(Laya.Ease.linear);
    this.dg.Qn.addChild(t);
    t.zIndex = 9999;
    if (i.HC >= 0 && this.RC && i.HC < this.RC.length) {
      this.qC(i.HC, this.MC);
      t.pos(this.MC.x, this.MC.y);
    } else {
      const lp = this.dg.toLocal(s.Pm, true);
      t.pos(lp.x, lp.y);
    }
    this.ZC(t);
  }
  private ZC(t: any): void {
    if (!t.parent || this.bC) {
      if (this.bC) this.DC(t);
      return;
    }
    const s = this.FC(t);
    this.xC.delete(t);
    s.Pm = BulletSpawnMgr.instance().Tw({
      type: ri,
      ow: { xm: "phantomBullet", ew: "", aw: { x: this.dg.map.gridWid, y: this.dg.map.gridHei }, iw: true },
      Om: fi.create(t, 0, 40, false, false, false),
      Um: HitStrategyFactory.produce(103),
      bm: this.HD,
      Sm: this.HD.Ta,
    });
    s.Pm.Xm();
    if (this.KC(t)) {
      this._C.add(t);
      if (!this.kC) {
        UpdateMgr.instance().register(this.IC, this, this.JC);
        this.kC = true;
      }
      this.tU(t);
      this.sU(s, "attack", 5);
    } else this.DC(t);
  }
  private tU(s: any): void {
    if (!this._C.has(s)) return;
    const i = this.FC(s);
    if (!i.zC) {
      i.zC = true;
      this.iU(s);
      if (!this.SC) {
        this.SC = true;
        Laya.timer.loop(PhantomSkill.hU, this, this.eU);
      }
    }
  }
  private eU(): void {
    let s = false;
    for (const i of this._C) {
      const h = PhantomSkill.OC.get(i);
      if (h?.zC) {
        s = true;
        this.iU(i);
      }
    }
    if (!s) this.BC();
  }
  private BC(): void {
    if (this.SC) {
      Laya.timer.clear(this, this.eU);
      this.SC = false;
    }
  }
  private iU(t: any): void {
    if (!this._C.has(t)) return;
    const i = this.FC(t);
    i.Pm?.dm.clear();
    const h = i.Hn.Hn;
    Laya.Tween.create(h)
      .to("rotation", -80 - 40 * Math.random())
      .duration(50)
      .parallel()
      .go("x", 0, 60)
      .duration(50)
      .chain()
      .go("x", 60, 0)
      .duration(50);
  }
  private $C(s: any): void {
    const i = PhantomSkill.OC.get(s);
    if (i) {
      i.zC = false;
      Laya.Tween.killAll(i.Hn.Hn);
      if (i.Pm) {
        i.Pm.Am();
        i.Pm = null;
      }
      this.sU(i, "zhan", 5);
    }
  }
  private sU(t: any, s: string, i: number): void {
    if (t.jC)
      for (let h = 0; h < t.jC.length; h++) {
        const e = t.jC[h];
        e.playbackRate(i);
        e.play(`${s}${h + 1}`, true);
      }
  }
  private JC(s: number): void {
    if (this._C.size === 0) return;
    const i = this.dg.map.gridWid;
    const h = this.dg.map.gridHei;
    const e = (this.Xu * s) / 1000;
    for (const sp of this._C) {
      const a = this.FC(sp);
      const n = a.pk;
      if (!this.RC || n < 0 || n >= this.RC.length) {
        this.DC(sp);
        continue;
      }
      const r = this.RC[n];
      const o = r.x * i + i / 2 - sp.x;
      const l = r.y * h + h / 2 - sp.y;
      const c = o * o + l * l;
      if (c <= PhantomSkill.aU) {
        this.nU(sp, a);
        this.rU(sp, a);
        continue;
      }
      const u = Math.sqrt(c);
      sp.x += e * (o / u);
      sp.y += e * (l / u);
      this.rU(sp, a);
    }
  }
  private nU(t: any, s: any): void {
    if (s.dir < 0) {
      if (s.pk <= s.XC) this.oU(t, false, undefined, true);
      else {
        s.pk += s.dir;
        if (s.pk <= s.XC) this.oU(t, false, undefined, true);
      }
    } else if (s.pk === s.XC) {
      s.Ec++;
      if (s.Ec >= this.PC) this.DC(t);
      else this.oU(t, true, undefined, true);
    } else s.pk += s.dir;
  }
  private rU(t: any, s: any): void {
    const i = 2 * s.pk + (s.dir > 0 ? 1 : 0);
    if (s.WC === i) return;
    s.WC = i;
    const h = this.RC[s.pk];
    const e = this.RC[s.pk - s.dir];
    if (!h || !e) return;
    const a = this.AC;
    if (h.x < e.x) {
      t.rotation = 0;
      t.scale(a, a);
    } else if (h.x > e.x) {
      t.rotation = 0;
      t.scale(-a, a);
    } else if (h.y > e.y) {
      t.rotation = -90;
      t.scale(-a, a);
    } else {
      t.rotation = 90;
      t.scale(-a, -a);
    }
  }
  private KC(t: any): boolean {
    const s = this.FC(t);
    const i = s.HC;
    s.HC = -1;
    return i >= 0 && this.RC && i < this.RC.length ? this.oU(t, true, i, false) : this.oU(t, true, undefined, false);
  }
  private oU(t: any, s: boolean, i: number | undefined, h = false): boolean {
    const e = this.RC;
    if (!e?.length) {
      if (h) this.DC(t);
      return false;
    }
    let a = i;
    if (a === undefined) {
      const target = this.EC();
      if (target) a = this.NC(target);
      if (a === undefined || a < 0 || a >= e.length) a = this.lU(t);
    }
    if (a < 0 || a >= e.length) {
      if (h) this.DC(t);
      return false;
    }
    const n = this.FC(t);
    n.WC = -1;
    if (s) {
      n.dir = -1;
      n.XC = 0;
      n.pk = a;
    } else {
      n.dir = 1;
      n.pk = 0;
      let k = a;
      if (k <= 0 && e.length > 1) k = 1;
      n.XC = k;
    }
    return true;
  }
  private EC(): any {
    const t = this.HD.qd;
    let s: any = null;
    let i = -1;
    for (const [, h] of this.xw.kw) {
      if (!h.aP(t) || h.curState === 4) continue;
      const e = this.NC(h);
      if (e < 0 || e >= this.RC.length) continue;
      if (e > i) {
        i = e;
        s = h;
      }
    }
    return s;
  }
  private NC(t: any): number {
    const s = this.dg.toLocal(t.enemy, true);
    const i = this.dg.map.gridWid;
    const h = this.dg.map.gridHei;
    return this.cU(Math.floor(s.x / i), Math.floor(s.y / h));
  }
  private lU(t: any): number {
    const s = this.dg.map.gridWid;
    const i = this.dg.map.gridHei;
    return this.cU(Math.floor(t.x / s), Math.floor(t.y / i));
  }
  private cU(t: number, s: number): number {
    const i = this.RC;
    if (!i?.length) return -1;
    const h = this.vC.get(t + "_" + s);
    if (h !== undefined) return h;
    let e = 0;
    let a = 1e9;
    for (let k = 0; k < i.length; k++) {
      const n = Math.abs(i[k].x - t) + Math.abs(i[k].y - s);
      if (n < a) {
        a = n;
        e = k;
      }
    }
    return e;
  }
  private qC(t: number, s: any): any {
    const i = this.RC[t];
    const h = this.dg.map.gridWid;
    const e = this.dg.map.gridHei;
    s.x = i.x * h + h / 2;
    s.y = i.y * e + e / 2;
    return s;
  }
}
(PhantomSkill as any).skillName = "七进七出";
(PhantomSkill as any).description = "释放一个幻象冲进敌群，以乱刺状态来回突进七次";
