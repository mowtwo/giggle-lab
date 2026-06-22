// The 12 concrete bosses + their skills (the bundle's lh/ch/uh/ph/yh/fh/gh/dh/
// Lh/mh/wh/vh). Faithful reconstruction of reconstruction/reference/
// bundle.pretty.js lines ~16040-16620. Each extends EnemyBoss, builds its spine
// visual, names its run/skill anims, and implements its periodic skill (`oP`).
// Registered with EnemyFactory by character name. Opaque names kept verbatim.
//
//   CaoCao=lh DianWei=ch DiaoChan=uh DongZhuo=ph HuaXiong=yh LvBu=fh
//   SunShangXiang=gh XiaHouDun=dh ZhangBao=Lh ZhangJiao=mh ZhangLiang=wh ZhenFu=vh

/* eslint-disable @typescript-eslint/no-explicit-any */

import { EnemyBoss } from "./enemy-boss";
import { BossAnimSprite } from "./boss-anim-sprite";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { UpdateMgr } from "../core/update-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { SpecialIndex } from "./attr-type";
import { EffectMgr } from "./effect-mgr";
import { EntityRegistry } from "./entity-registry";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { BuffMgr } from "./buff-mgr";
import { EnemyFactory } from "./enemy-factory";

const sh = BossAnimSprite;
const F = GameMgr;
const y = EventMgr;
const u = GameEvent;
const j = UpdateMgr;
const $ = AudioMgr;
const f = MathE;
const L = SpecialIndex;
const q = EffectMgr;
const Ki = EntityRegistry;
const th = BuffMgr;
const ss = EnemyFactory;

/** 曹操 — seals the strongest soldier. (`lh`) */
class CaoCao extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackcao";
    this.FP = "gocao";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss2");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play("gocao", true);
    this.ZM.ub(1.2, 1.2);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("gocao", true);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
      const t = Ki.instance().NS(this.qd);
      if (t) {
        if (t.Xe < 5) th.instance().applyBuff(t.id, 16, 1, false, -1);
        else th.instance().applyBuff(t.id, 16, 1, false, 10000);
      }
    });
    this.ZM.play("attackcao", false);
    $.instance().playSound("caoCao_skill_seal");
    $.instance().playSound("chain_lock");
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("CaoCao", () => Laya.Pool.createByClass(CaoCao));

/** 典韦 — dashes to a target + knocks it back. (`ch`) */
class DianWei extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackdian";
    this.FP = "godian";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss2");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play("godian", true);
    this.ZM.ub(1.2, 1.2);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("godian", true);
  }
  protected oP(): void {
    const t = Ki.instance().GS(this.centerX, this.centerY, this.dh, this.qd);
    for (let s = t.length - 1; s >= 0; s--) if (th.instance().qS(t[s].id, 17)) t.splice(s, 1);
    const target = t[f.range(0, t.length, true) as number];
    if (!target) {
      this.changeState(1);
      return;
    }
    this.ZM.play("godian2", true);
    let i: number;
    let h: number;
    const e = this.centerX >= target.x + this.dg.map.gridWid / 2 ? 1 : -1;
    const a = this.dg.map.gridWid * (3 / 4);
    if (e > 0) {
      this.YP(true);
      i = target.x + a;
      h = target.y;
    } else {
      this.YP(false);
      i = target.x - a;
      h = target.y;
    }
    let n = f.distance({ x: this.enemy.x, y: this.enemy.y }, { x: i, y: h });
    let r = 0;
    let o = 0;
    if (n < a) {
      r = this.enemy.x;
      o = this.enemy.y;
    } else {
      const v = new Laya.Point(i - this.enemy.x, h - this.enemy.y);
      v.normalize();
      r = this.enemy.x + v.x * (n - a);
      o = this.enemy.y + v.y * (n - a);
    }
    if (n < 0) n = 1;
    Laya.Tween.to(
      this.enemy,
      { x: r, y: o },
      3 * n,
      null,
      Laya.Handler.create(this, () => {
        this.ZM.onStop(() => {
          this.ZM.fb(Laya.Event.STOPPED);
          this.YP(false);
          this.changeState(1);
        });
        this.ZM.play("attackdian", false);
        const t0 = { x: r, y: o };
        const a0 = { x: r + (i - r) / 2, y: t0.y - 200 };
        const n0 = { x: i, y: h };
        let l = 0;
        j.instance().register("dianWei" + this.id, this, (dt: number) => {
          l += dt / 100;
          if (f.quadraticBezierPoint(t0, a0, n0, this.enemy, l)) {
            this.enemy.x = i;
            this.enemy.y = h;
            j.instance().unregister("dianWei" + this.id);
            th.instance().applyBuff(target.id, 17, 0, false, L.Ji, -e);
          }
        });
      }),
    );
  }
  private YP(t: boolean): void {
    if (t) {
      if (this.ZM.scaleX > 0) this.ZM.scaleX *= -1;
    } else if (this.ZM.scaleX < 0) this.ZM.scaleX *= -1;
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("DianWei", () => Laya.Pool.createByClass(DianWei));

/** 貂蝉 — charms units + transforms them into mobs. (`uh`) */
class DiaoChan extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackdiao";
    this.FP = "godiao";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss1");
    this.ZM.name = "sp";
    this.ZM.ub(1.2, 1.2);
    this.enemy.addChild(this.ZM);
    this.ZM.play("godiao", true);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("godiao", true);
  }
  protected LP(): void {
    super.LP();
    y.instance.event(u.yt, this.pk);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
    });
    this.ZM.play("attackdiao", false);
    $.instance().playSound("diaoChan_skill_charm");
    const t = Ki.instance().QS(this.qd);
    for (let s = 0; s < t.length; s++) {
      const i = Ki.instance().Dk(t[s].id);
      if (i) th.instance().applyBuff(i.id, 19, 0, false, L.Ji);
      Laya.timer.once(1000 / t.length, this, () => {
        const target = t[s];
        this.Mo.x = this.enemy.width / 2;
        this.Mo.y = this.enemy.height / 2;
        this.enemy.localToGlobal(this.Mo);
        this.Po.x = target.x + this.dg.map.gridWid / 2;
        this.Po.y = target.y + this.dg.map.gridHei / 2;
        this.enemy.parent.localToGlobal(this.Po);
        q.instance().playLoveHeart({ x: this.Mo.x, y: this.Mo.y }, { x: this.Po.x, y: this.Po.y }, () => {
          if (this.gM) return;
          if (!Ki.instance().Dk(target.id)) return;
          Ki.instance().Lx(target.id);
          const cell = this.XP();
          EnemySpatialMgr.instance().GP(
            this.qd,
            target.type,
            target.Xe,
            Math.floor(target.x / this.dg.map.gridWid),
            Math.floor(target.y / this.dg.map.gridHei),
            cell.x,
            cell.y,
            cell.pk,
          );
        });
      });
    }
  }
  private XP(): { x: number; y: number; pk: number } {
    const t = Math.max(0, this.pk - 1);
    const s = Math.min(this.path.length - 1, this.pk + 1);
    const i = f.range(t, s + 1, true) as number;
    return { x: this.path[i].x, y: this.path[i].y, pk: i };
  }
  gameOver(): void {
    Laya.timer.clearAll(this);
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("DiaoChan", () => Laya.Pool.createByClass(DiaoChan));

/** 董卓 — absorbs nearby mobs to grow + heal. (`ph`) */
class DongZhuo extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackdz";
    this.FP = "godz";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "dongZhuo");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play(this.FP, true);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play(this.FP, true);
  }
  protected oP(): void {
    let t = 1;
    const s = this.dg.enemyHp(this.dg.map.re, this.qd).uh;
    $.instance().playSound("dongZhuo_skill_phase1_suck");
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.ZM.pb(
        "attack2dz",
        t,
        () => {
          this.ZM.fb(Laya.Event.STOPPED);
          this.changeState(1);
        },
        () => {
          this.ZM.scaleX += 0.01;
          this.ZM.scaleY += 0.01;
          this.Qi += 2 * s;
          this.QM += 2 * s;
          $.instance().playSound("dongZhuo_skill_phantom");
        },
      );
    });
    this.ZM.play(this.CP, false);
    Laya.timer.once(500, this, () => {
      const list = EnemySpatialMgr.instance().lv(this.centerX, this.centerY, this.dh, this.qd);
      t = list.length;
      for (let k = list.length - 1; k >= 0; k--) {
        if (list[k].id === this.id) continue;
        EnemySpatialMgr.instance().HP(list[k].id);
        const img = new Laya.Image("resources/img/gameObject/enemy/mob_2.png");
        img.size(this.dg.map.gridWid, this.dg.map.gridHei);
        img.anchorX = 0.5;
        img.anchorY = 0.5;
        img.pos(list[k].x - this.enemy.x + img.width / 2, list[k].y - this.enemy.y + img.height / 2);
        const h = 0.7 / this.ZM.scaleX;
        img.scale(h, h);
        this.ZM.addChild(img);
        Laya.Tween.create(img)
          .to("x", 111)
          .to("y", -17)
          .to("rotation", 360)
          .duration(300)
          .chain()
          .to("scaleX", 0)
          .to("scaleY", 0)
          .duration(200)
          .then(() => img.destroy(), this);
      }
    });
  }
  gameOver(): void {
    Laya.timer.clearAll(this);
    for (let t = this.ZM.numChildren - 1; t >= 0; t--) {
      Laya.Tween.killAll(this.ZM.getChildAt(t));
      this.ZM.getChildAt(t).destroy();
    }
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("DongZhuo", () => Laya.Pool.createByClass(DongZhuo));

/** 华雄 — summons cavalry. (`yh`) */
class HuaXiong extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackhx";
    this.FP = "gohx";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "huaXiong");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play(this.FP, true);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play(this.FP, true);
  }
  protected oP(): void {
    $.instance().playSound("summon_cavalry_skill");
    this.ZM.pb(
      this.CP,
      3,
      () => {
        this.changeState(1);
      },
      () => {
        EnemySpatialMgr.instance().rg(5, this.qd);
      },
    );
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("HuaXiong", () => Laya.Pool.createByClass(HuaXiong));

/** 吕布 — AoE suppress. (`fh`) */
class LvBu extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attacklvbu";
    this.FP = "golvbu";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "lvBu");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play(this.FP, true);
    this.ZM.offset(0, -10);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play(this.FP, true);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
    });
    this.ZM.play(this.CP, false);
    const t = Ki.instance().GS(this.centerX, this.centerY, this.dh, this.qd);
    Laya.timer.once(650, this, () => {
      for (let s = 0; s < t.length; s++) th.instance().applyBuff(t[s].id, 18, 0, false, 5000);
    });
    $.instance().playSound("boss_sweep_skill");
    $.instance().playSound("luBu_skill");
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("LvBu", () => Laya.Pool.createByClass(LvBu));

/** 孙尚香 — drops a flower trap. (`gh`) */
class SunShangXiang extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackxiang";
    this.FP = "goxiang";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss1");
    this.ZM.name = "sp";
    this.ZM.scale(1, 1);
    this.enemy.addChild(this.ZM);
    this.ZM.play("goxiang", true);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("goxiang", true);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
    });
    this.ZM.play("attackxiang", false);
    Laya.timer.once(500, this, () => {
      const t = new Laya.Image("resources/img/gameObject/enemy/flower.png");
      t.size(60, 60);
      t.anchor(0.5, 0.5);
      t.pos(this.enemy.x + this.enemy.width, this.enemy.y);
      this.enemy.parent.addChild(t);
      y.instance.event(u.Bt, this.qd, t);
    });
  }
  gameOver(): void {
    Laya.timer.clearAll(this);
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("SunShangXiang", () => Laya.Pool.createByClass(SunShangXiang));

/** 夏侯惇 — rolls in a darkness cloud. (`dh`) */
class XiaHouDun extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackdun";
    this.FP = "goxia";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss2");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play("goxia", true);
    this.ZM.ub(1.2, 1.2);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("goxia", true);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
    });
    this.ZM.play("attackdun", false);
    $.instance().playSound("xiahouDun_skill_cloud");
    Laya.timer.once(1000, this, () => {
      q.instance().showBlackCloud(this.qd);
      $.instance().playSound("xiahouDun_skill_lightning");
      Laya.timer.once(5000, this, () => {
        q.instance().hideBlackCloud(this.qd);
      });
    });
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
    Laya.timer.clearAll(this);
    q.instance().hideBlackCloud(this.qd);
  }
}
ss.instance().register("XiaHouDun", () => Laya.Pool.createByClass(XiaHouDun));

/** 张苞 — raises a damage-reflect shield. (`Lh`) */
class ZhangBao extends EnemyBoss {
  constructor() {
    super();
    this.CP = "attackbao";
    this.FP = "gobao";
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss0");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.ub(1.2, 1.2);
    this.ZM.play("gobao", true);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("gobao", true);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
      if (this.qd) F.instance().battleState.Ii.Di = false;
      else F.instance().battleState.Ti.Di = false;
    });
    this.ZM.yb(1);
    this.ZM.play("attackbao", false);
    const slot = this.qd ? F.instance().battleState.Ii : F.instance().battleState.Ti;
    slot.Di = true;
    slot.num = 0;
    slot.range = this.dh * F.instance().map.gridWid;
    slot.pos.x = this.enemy.x + this.enemy.width / 2;
    slot.pos.y = this.enemy.y + this.enemy.height / 2;
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("ZhangBao", () => Laya.Pool.createByClass(ZhangBao));

/** 张角 — AoE multi-debuff horn. (`mh`) */
class ZhangJiao extends EnemyBoss {
  private WP: any = null;
  constructor() {
    super();
    this.CP = "attackjiao";
    this.FP = "gojiao";
    this.WP = null;
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss0");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play("gojiao", true);
    this.ZM.ub(1.2, 1.2);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("gojiao", true);
  }
  protected oP(): void {
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
    });
    this.ZM.yb(1);
    this.ZM.play("attackjiao", false);
    Laya.timer.once(500, this, () => {
      this.WP = EnemySpatialMgr.instance().lv(this.enemy.x, this.enemy.y, this.dh, this.qd);
      for (let t = 0; t < this.WP.length; t++) {
        th.instance().applyBuff(this.WP[t].id, 6, 0.2, true, 5000);
        th.instance().applyBuff(this.WP[t].id, 4, 0.5, true, 5000);
        th.instance().applyBuff(this.WP[t].id, 3, 0.3, true, 5000);
      }
    });
    $.instance().playSound("zhangJiao_skill_horn");
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
  }
}
ss.instance().register("ZhangJiao", () => Laya.Pool.createByClass(ZhangJiao));

/** 张梁 — expanding chaos wave. (`wh`) */
class ZhangLiang extends EnemyBoss {
  private wa: any[] = [];
  private zP = 0;
  private jP = 0;
  private $P = 0;
  constructor() {
    super();
    this.CP = "attackliang";
    this.FP = "goliang";
    this.wa = [];
    this.zP = 0;
    this.jP = 0;
    this.$P = 0;
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.ZM = new sh(true, "boss0");
    this.ZM.name = "sp";
    this.enemy.addChild(this.ZM);
    this.ZM.play("goliang", true);
    this.ZM.ub(1.2, 1.2);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("goliang", true);
  }
  protected oP(): void {
    this.wa.length = 0;
    this.jP = 0;
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
    });
    this.ZM.yb(1);
    this.ZM.play("attackliang", false);
    this.$P = 0;
    j.instance().unregister(this.id + "_ZhangLiang");
    j.instance().register(this.id + "_ZhangLiang", this, this.NP);
    $.instance().playSound("boss_sweep_skill");
  }
  protected pP(): void {
    j.instance().unregister(this.id + "_ZhangLiang");
  }
  NP(t: number): void {
    this.$P += t;
    if (this.$P <= 500 || this.$P >= 1400) return;
    this.jP += 6;
    this.zP += t;
    if (this.zP < 100) return;
    this.zP = 0;
    const s = Ki.instance().GS(this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height / 2, this.jP / 2, this.qd);
    for (let t2 = 0; t2 < s.length; t2++) {
      let i = 0;
      for (let h = 0; h < this.wa.length; h++) if (s[t2].id !== this.wa[h].id) i += 1;
      if (i === this.wa.length) {
        th.instance().applyBuff(s[t2].id, 13, 0, false, 2000);
        this.wa.push({ id: s[t2].id, x: s[t2].x, y: s[t2].y });
      }
    }
  }
  gameOver(): void {
    j.instance().unregister(this.id + "_ZhangLiang");
    super.gameOver();
    this.uP();
    this.wa.length = 0;
  }
}
ss.instance().register("ZhangLiang", () => Laya.Pool.createByClass(ZhangLiang));

/** 甄宓 — calls down a healing/buff rain over allied enemies. (`vh`) */
class ZhenFu extends EnemyBoss {
  private qP = false;
  private VP = "rain";
  private QP: any = null;
  constructor() {
    super();
    this.CP = "attackzhen";
    this.FP = "gozhen";
    this.qP = false;
    this.VP = "rain";
    this.QP = null;
  }
  init(t: any): void {
    this.cb = true;
    super.init(t);
    this.VP += this.id;
    this.ZM = new sh(true, "boss1");
    this.ZM.name = "sp";
    this.ZM.scale(1, 1);
    this.enemy.addChild(this.ZM);
    this.ZM.play("gozhen", true);
  }
  protected rP(): void {
    super.rP();
    this.ZM.play("gozhen", true);
  }
  protected oP(): void {
    if (this.qP) {
      this.changeState(1);
      return;
    }
    this.ZM.onStop(() => {
      this.ZM.fb(Laya.Event.STOPPED);
      this.changeState(1);
      const t = this.enemy.parent;
      this.Mo.x = t.x;
      this.Mo.y = t.y + t.height / 2;
      t.parent.localToGlobal(this.Mo);
      q.instance().setRainArea(true, this.Mo.x, this.Mo.y, t.width, t.height / 2);
      Ki.instance().F_(this.VP, this.qd, 1, -0.2, true, -1);
    });
    this.ZM.play("attackzhen", false);
    this.qP = true;
    $.instance().playSound("zhenFu_skill_rain");
    this.QP = $.instance().playSound("zhenFu_skill_rain_cycle", true);
  }
  gameOver(): void {
    super.gameOver();
    this.uP();
    this.qP = false;
    q.instance().setRainArea(false, 0, 0, 0, 0);
    Ki.instance().O_(this.VP);
    if (this.QP) {
      $.instance().stopSound(this.QP);
      this.QP = null;
    }
  }
}
ss.instance().register("ZhenFu", () => Laya.Pool.createByClass(ZhenFu));
