// Concrete generals — one per character, registered with GeneralMergeFactory.
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~23838-24880. Each extends General (`wa`/`va`), wires its skill list (`PR`),
// any passive on-hit behaviour (`tD`), the weapon anim id (`vL`), and overrides
// `ov` (the per-frame weapon attack) with its targeting + skill quirks. Opaque
// field names kept verbatim.
//
//   ZhaoYun=za  ZhangFei=Ya  MaChao=Ua  GuanYu=Ma  HuangZhong=Ta  GuanPing=_a
//   GuanXing=ba  ZhangBao=Fa  ZhangYi=Xa  HuangGai=Pa  LiuBei=Ba  HuangZu=Ca
//   Civilian=ja

/* eslint-disable @typescript-eslint/no-explicit-any */

import { General } from "./general";
import { GeneralMergeFactory } from "./general-merge-factory";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { BuffMgr } from "./buff-mgr";
import {
  BattleShout,
  StunSkill,
  HolyBlade,
  FireArrowRain,
  ArrowRain,
  JumpSlash,
  PhantomSkill,
  SlowOnHitBehavior,
} from "./skills";
import { KnifeWeaponBase } from "./weapon-knife";
import { BowWeaponBase } from "./weapon-bow";
import { TargetDirectionLineMovement } from "./movements";

const Kh = TargetDirectionLineMovement;

const $ = AudioMgr;

/** 赵云 (0) — phantom dash skill. (`za`) */
class ZhaoYun extends General {
  private nI: any = null;
  constructor() {
    super();
    this.PR = [new PhantomSkill(30)];
    this.nI = null;
  }
  init(t: any[], s: any, i: number): void {
    this.vL = "zhaoYun";
    super.init(t, s, i);
    this.uU();
    this.QE.WI(this.nI);
    $.instance().playSound("zhaoYun_voice_entrance");
  }
  private uU(): void {
    this.nI = new Laya.Image("resources/img/gameObject/soldier/x0.png");
    this.nI.size(36, 36);
    this.nI.anchor(0.5, 0.5);
    this.nI.pos(this.QE.Hn.width / 2, 0.6 * this.QE.Hn.height - (this.QE as any).rI);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.attack(this.GR());
  }
  protected IR(_t: any): void {}
  cL(t = 1, s = true): void {
    super.cL(t, s);
    if (this.level === 4) this.nI.skin = "resources/img/gameObject/soldier/x1.png";
    else if (this.level === 5) this.nI.skin = "resources/img/gameObject/soldier/x2.png";
    else this.nI.skin = "resources/img/gameObject/soldier/x0.png";
  }
  BR(t?: any, s?: any): void {
    super.BR(t, s);
    if (this.nI && this.QE) this.QE.WI(this.nI);
  }
  gameOver(): void {
    (this as any).bR?.offAll();
    super.gameOver();
  }
}
GeneralMergeFactory.register(0, ZhaoYun);

/** 张飞 (1) — battle-shout + slow-on-hit. (`Ya`) */
class ZhangFei extends General {
  constructor() {
    super();
    this.PR = [new BattleShout(15, 2000)];
    this.tD = [new SlowOnHitBehavior(2000, 0.1)];
  }
  init(t: any[], s: any, i: number): void {
    this.vL = "zhangFei";
    super.init(t, s, i);
  }
  protected ov(): void {
    (this as any).bR.play("attack1", false);
    (this as any).MR.play("attack2", false);
    Laya.timer.once(100 / (this as any).fL, this, () => {
      this.QE.attack(this.uT());
    });
  }
}
GeneralMergeFactory.register(1, ZhangFei);

/** 马超 (2) — chance stun + lightning. (`Ua`) */
class MaChao extends General {
  constructor() {
    super();
    this.PR = [new StunSkill(0.3, 500, 0.1, 200, true)];
  }
  init(t: any[], s: any, i: number): void {
    this.vL = "maChao";
    super.init(t, s, i);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.attack(this.uT());
  }
}
GeneralMergeFactory.register(2, MaChao);

/** 关羽 (3) — jump-slash; same-target attack speed ramp. (`Ma`) */
class GuanYu extends General {
  private aC = -1;
  private aD = 0;
  private nD = 5;
  private hD = 0;
  private nC: any;
  constructor() {
    super();
    this.PR = [new JumpSlash(20, 5)];
    this.aC = -1;
    this.aD = 0;
    this.nD = 5;
    this.hD = 0;
  }
  init(t: any[], s: any, i: number): void {
    super.init(t, s, i);
    this.hD = BuffMgr.instance().applyBuff(this.id, 1, 0, true);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.nC = this.uT();
    this.QE.attack(this.nC);
    if (this.aC === this.nC.id) {
      this.aD = Math.min(this.aD + 0.05, this.nD);
      BuffMgr.instance().modify(this.id, 1, this.hD, this.aD, true, undefined);
    } else {
      BuffMgr.instance().modify(this.id, 1, this.hD, 0, true, undefined);
      this.aD = 0;
      this.aC = this.nC.id;
    }
  }
  protected IR(t: any): void {
    if (t === "跳斩") $.instance().playSound("guanYu_skill_roar");
  }
  gameOver(): void {
    super.gameOver();
  }
}
GeneralMergeFactory.register(3, GuanYu);

/** 黄忠 (4) — fire-arrow-rain; custom level scaling. (`Ta`) */
class HuangZhong extends General {
  private yC = [0, 6, 6, 7, 7, 8];
  private fC = [0, 1, 1, 2, 2, 3];
  constructor() {
    super();
    this.PR = [new FireArrowRain(30)];
    this.yC = [0, 6, 6, 7, 7, 8];
    this.fC = [0, 1, 1, 2, 2, 3];
  }
  init(t: any[], s: any, i: number): void {
    super.init(t, s, i);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.EI(103, undefined);
    this.QE.BI(() => Kh.create());
    this.QE.attack(this.uT());
  }
  protected xL(): void {}
  cL(t = 1, s = true): void {
    const i = this.level;
    this.level += t;
    if (this.level <= 0) this.level = 1;
    if (this.level > 5) this.level = 5;
    if (i === this.level) return;
    if (this.level !== 3 && this.level !== 5) {
      let off = 0;
      if (this.level > 3) off = 1;
      const g = GameMgr.instance().generals as any;
      (this as any).Wd = g.generalAttackConfigs[(this as any).type].Ra / g.multC[this.level - off - 1];
      (this as any).Gd = (g.generalAttackConfigs[(this as any).type].Ta + this.QE.aI) * g.multD[this.level - off - 1];
    }
    if (this.QE instanceof BowWeaponBase) (this.QE as any).NI = this.fC[this.level];
    this.PR[0].cC = this.yC[this.level];
    (this as any).Vd.value = this.level.toString();
    for (let k = 0; k < this.va.length; k++) this.va[k].cL(this.level - this.va[k].level);
    for (let k = 0; k < this.va.length; k++) {
      const sp = this.va[k].hL;
      const idx = GameMgr.instance().generals.nameChars.indexOf(this.va[k].Qd);
      sp.skin =
        this.level === 4 || this.level === 5
          ? "resources/img/gameObject/soldier/generalParts_" + idx + "_" + this.level + ".png"
          : "resources/img/gameObject/soldier/generalParts_" + idx + ".png";
    }
    (this as any).ER();
  }
}
GeneralMergeFactory.register(4, HuangZhong);

/** 关平 (5) — battle-shout; knife switches to sweep mode. (`_a`) */
class GuanPing extends General {
  constructor() {
    super();
    this.PR = [new BattleShout(15, 1000)];
  }
  init(t: any[], s: any, i: number): void {
    super.init(t, s, i);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    const t = this.uT();
    if (t) {
      if (this.QE instanceof KnifeWeaponBase) (this.QE as any).Ca = 1;
      this.QE.attack(t);
    }
  }
}
GeneralMergeFactory.register(5, GuanPing);

/** 关兴 (6) — chance stun. (`ba`) */
class GuanXing extends General {
  constructor() {
    super();
    this.PR = [new StunSkill(0.1, 300)];
  }
  init(t: any[], s: any, i: number): void {
    super.init(t, s, i);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.attack(this.GR());
  }
}
GeneralMergeFactory.register(6, GuanXing);

/** 张苞 (7) — same as 关兴. (`Fa`) */
class ZhangBao extends GuanXing {}
GeneralMergeFactory.register(7, ZhangBao);

/** 张翼 (8) — jump-slash (single). (`Xa`) */
class ZhangYi extends General {
  constructor() {
    super();
    this.PR = [new JumpSlash(20, 1)];
  }
  protected ov(): void {
    this.QE.EI(100, undefined);
    this.QE.attack(this.GR());
  }
  protected IR(_t: any): void {}
}
GeneralMergeFactory.register(8, ZhangYi);

/** 黄盖 (9) — bounce strategy. (`Pa`) */
class HuangGai extends General {
  init(t: any[], s: any, i: number): void {
    super.init(t, s, i);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.EI(102, undefined);
    this.QE.attack(this.uT());
  }
}
GeneralMergeFactory.register(9, HuangGai);

/** 刘备 (10) — holy blade. (`Ba`) */
class LiuBei extends General {
  constructor() {
    super();
    this.PR = [new HolyBlade(20)];
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.EI(100, undefined);
    this.QE.attack(this.uT());
  }
  protected IR(t: any): void {
    if (t === "圣剑") $.instance().playSound("holyBlade_skill");
  }
}
GeneralMergeFactory.register(10, LiuBei);

/** 黄祖 (11) — arrow rain. (`Ca`) */
class HuangZu extends General {
  constructor() {
    super();
    this.PR = [new ArrowRain(30)];
  }
  init(t: any[], s: any, i: number): void {
    super.init(t, s, i);
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.attack(this.GR());
  }
}
GeneralMergeFactory.register(11, HuangZu);

/** 平民 (-1) — civilian (no skill). (`ja`) */
class Civilian extends General {
  constructor() {
    super();
    this.xR = true;
  }
  protected ov(): void {
    if (this.Ew.length <= 0) return;
    this.QE.attack(this.uT());
  }
}
GeneralMergeFactory.register(-1, Civilian);
