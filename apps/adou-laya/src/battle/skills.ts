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
import { FireExplosiveArrow, TrailBehavior } from "./bullet-variants";
import { TargetDirectionWaveMovement, TargetPositionBezierMovement, TargetEnemyBezierMovement } from "./movements";

const F = GameMgr;
const $ = AudioMgr;
const j = UpdateMgr;
const f = MathE;
const q = EffectMgr;
const Eh = EnemySpatialMgr;
const fe = BulletSpawnMgr;
const th = BuffMgr;
const si = HitStrategyFactory;
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
    if (Math.random() <= (t.yM ? this.tC : this.JR)) {
      th.instance().applyBuff(t.id, 8, 0, false, t.yM ? this.KR : this.ZR);
      if (this.QR) {
        q.instance().playElectricEffect(t.enemy.parent, t.enemy.x + t.enemy.width / 2, t.enemy.y + t.enemy.height / 2);
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
    if (Math.random() <= (t.yM ? this.tC : this.JR)) th.instance().applyBuff(t.id, 17, 0, false, t.yM ? this.oC : this.rC);
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
    th.instance().applyBuff(t.id, 3, this.wC, true, this.mC);
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
    const t = this.HD.Da / F.instance().map.gridWid;
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
            j.instance().unregister("battleShoutSkill" + this.HD.id);
            this.NR.clear();
            this.$R.radius = 0;
          });
          this.$R.x = this.HD.general.x + this.HD.general.width / 4;
          this.$R.y = this.HD.general.y + this.HD.general.height / 2;
          j.instance().register("battleShoutSkill" + this.HD.id, this, this.VR);
        });
    });
  }
  private VR(): void {
    this.$R.radius = (this.jR[0].width * this.jR[0].scaleX) / 2;
    const t = Eh.instance().lv(this.$R.x, this.$R.y, this.$R.radius, this.HD.qd);
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (!this.NR.has(i.id)) {
        th.instance().applyBuff(i.id, 8, 1, false, this.WR);
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
    j.instance().unregister("battleShoutSkill" + this.HD.id);
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
    this.lC.Om = Xh.create(0.5, 50, 0).QL(f.angle(this.HD.general, t));
    const s = fe.instance().Tw(this.lC, this.HD.general);
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
      Om: Fe.create(500 + (f.range(0, 250) as number)).KL(t),
      Sm: 2 * this.HD.Ta,
      Um: si.produce(100, { FL: -1, IL: "requestRemove" }),
      bm: this.HD,
      rm: { um: 0.5 },
    };
    const i = fe.instance().Tw(s);
    i.Jm = true;
    i.UE = this.UE;
    const h = this.HD.QE;
    return new Promise<void>((resolve) => {
      h.KI(i, s.Om.bw(F.instance().toLocal(this.HD.QE.Hn, true)), (this.cC / 5) * this.YL, () => {
        this.HD.event("onSkillInterruptAttack", this.name);
        resolve();
      });
    });
  }
  private pC(): any[] {
    const t = F.instance();
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
      const r = (f.range(1, 3, true) as number) * n;
      this.cC += r;
      for (let m = 0; m < r; m++) {
        const dx = f.range(0.3 * -s, 0.3 * s, true) as number;
        const dy = f.range(0.3 * -i, 0.3 * i, true) as number;
        const px = cell.x * s + s / 2 + dx;
        const py = cell.y * i + i / 2 + dy;
        a.push(new Laya.Vector2(px, py));
      }
    }
    f.shuffle(a);
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
    const i = Eh.instance();
    const h: any[] = [];
    for (let k = 1; k <= this.fC; k++) {
      let e = this.fC > s.length ? s[k % s.length].id : s[f.range(0, s.length - 1, true) as number].id;
      if (!e) e = i.XA(this.HD.qd).id;
      if (e === -1 || e == null) continue;
      const a = fe.instance().Tw({
        type: ri,
        ow: { xm: "arrowRain", ew: "resources/img/weapon/arrow_2.png" },
        Om: oi.create(1000 + (f.range(0, 200) as number)).qL(e),
        Sm: this.HD.Ta,
        Um: si.produce(100, { FL: e, IL: "requestRemove" }),
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
