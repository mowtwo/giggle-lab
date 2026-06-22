// State buffs — visual / behavioural status effects.
//
// Faithful reconstruction of the bundle's state-buff base `ps` and its concrete
// subclasses (reconstruction/reference/bundle.pretty.js lines ~9381-9990):
// stun (ys), chaos (fs), knockback (gs), burn (ds), lock (ms), fall (vs),
// pierce (_s), spin-fall (Ss), suppress (bs), hidden (Ms), charm (Ps) and
// shock (Bs). Each toggles a set of "states" on its target (via the effect
// relation) and spawns/removes its own art. Opaque field names kept verbatim.
//
//   StateBuff=ps  StunBuff=ys  ChaosBuff=fs  KnockbackBuff=gs  BurnBuff=ds
//   LockBuff=ms  FallBuff=vs  PierceBuff=_s  SpinFallBuff=Ss  SuppressBuff=bs
//   HiddenStateBuff=Ms  CharmBuff=Ps  ShockBuff=Bs

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Buff, BuffData } from "./buff";
import { effectStates, applyStates } from "./buffs";
import { GameMgr } from "../core/game-mgr";
import { EffectMgr } from "./effect-mgr";
import { PrefabFactory } from "./prefab-factory";
import { AudioMgr } from "../core/audio-mgr";
import { MathE } from "../core/math-e";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";

const $ = AudioMgr;

/** Base for buffs that toggle "states" on the target + show art. (`ps`) */
export class StateBuff extends Buff {
  protected Fg = true;
  protected Og = false;
  protected Yg = false;
  protected Xg: any[] | undefined;

  describe(..._a: any[]): string | null {
    return "";
  }
  isReduction(..._a: any[]): boolean {
    return true;
  }

  protected mg(t: BuffData): any {
    this.Xg = effectStates(this.dg.effectRelation, this.Lg);
    const s = this.addSubBuffData(t);
    applyStates(this.target, this.Xg, true, t.fg);
    return s;
  }

  hasTimedSubBuff(): boolean {
    return true;
  }

  onUpdate(t: number): void {
    this.Gg(t);
    this.tickSubBuffs(t);
  }

  /** Per-frame hook. (`Gg`) */
  protected Gg(_t?: number): void {}

  protected vg(t: BuffData): any {
    if (this.Fg && this.gg.length > 0) {
      const s = this.gg[0];
      s.num = this.Yg ? t.num : s.num + t.num;
      if (s.time !== -1) {
        s.time = this.Og ? t.time : s.time + t.time;
        s.timer = this.Og ? 0 : s.timer;
      }
      return s.id;
    }
    const id = (this.dg.effectRelation.id += 1);
    this.gg.push({ id, num: t.num, yg: t.yg, time: t.time, timer: 0 });
    return id;
  }

  /** State hook (overridden by subclasses that drive their target). (`setState`) */
  setState(_t: any): void {}

  protected Pg(t: number): boolean {
    this.gg.splice(t, 1);
    return true;
  }

  protected Mg(t: number, num: any, i: any, h: any): boolean {
    const e = this.gg[t];
    e.num = num != null ? num : e.num;
    e.yg = i != null ? i : e.yg;
    e.time = h != null ? h : e.time;
    return true;
  }

  protected Ag(): void {
    const s = (this.Xg?.length ?? 0) > 0 ? this.Xg! : effectStates(this.dg.effectRelation, this.Lg);
    applyStates(this.target, s, false);
  }
}

/** Stun (晕眩). (`ys`) */
export class StunBuff extends StateBuff {
  private Hg: any;
  private Wg = 0;

  describe(): string {
    return "晕眩";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    $.instance().playSound("stun_1s");
    this.Hg = new Laya.Image("resources/img/gameObject/enemy/stun1.png");
    this.Hg.anchorX = 0.5;
    this.Hg.anchorY = 0.5;
    this.target.pg().addChild(this.Hg);
    this.Hg.pos(41, -14);
    this.Wg = EffectMgr
      .instance()
      .registerImgLoop(
        this.Hg,
        [
          "resources/img/gameObject/enemy/stun1.png",
          "resources/img/gameObject/enemy/stun2.png",
          "resources/img/gameObject/enemy/stun3.png",
        ],
        100,
      );
    return s;
  }
  protected Ag(): void {
    super.Ag();
    EffectMgr.instance().removeEvent("imgLoop", this.Wg);
    this.Hg.destroy();
  }
}

/** Chaos (混乱). (`fs`) */
export class ChaosBuff extends StateBuff {
  private zg: any;
  private jg: any;

  describe(): string {
    return "混乱";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    const i = this.target.pg();
    this.zg = i.getChildByName("sp");
    if (!this.zg) this.zg = i.getChildByName("img");
    this.jg = new Laya.Image("resources/img/gameObject/enemy/chaos0.png");
    this.jg.size(75, 69);
    this.jg.pos((i.width - this.jg.width) / 2, (i.height - this.jg.height) / 2);
    i.addChild(this.jg);
    return s;
  }
  protected Gg(): void {
    this.zg.rotation += 5;
  }
  protected Ag(): void {
    super.Ag();
    this.zg.rotation = 0;
    this.zg = null;
    this.jg.destroy();
  }
}

/** Knockback (击退). (`gs`) */
export class KnockbackBuff extends StateBuff {
  describe(): string {
    return "击退";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    this.target.setState(5, true, t.fg);
    return s;
  }
  protected vg(t: BuffData): any {
    const s = super.vg(t);
    this.target.setState(5, true, t.fg);
    return s;
  }
}

/** Fire burn (火焰灼烧). (`ds`) */
export class BurnBuff extends StateBuff {
  private $g = 0;
  private Ng = 0;
  private Vg = 1000;
  private Qg = 1000;
  private Zg: any;

  describe(): string {
    return "火焰灼烧";
  }
  isReduction(): boolean {
    return false;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    this.Fg = false;
    this.Zg = PrefabFactory.instance().getItem("groundFireEff", this);
    const i = this.target.pg();
    i.addChild(this.Zg);
    this.Zg.zIndex = -1;
    this.Zg.anchor(0.5, 1);
    this.Zg.pos(i.width / 2, i.height / 2 + this.Zg.height / 2);
    this.Zg.scale(0, 0);
    this.$g = EffectMgr
      .instance()
      .registerImgLoop(
        this.Zg,
        [
          "resources/img/effect/fireGround_01.png",
          "resources/img/effect/fireGround_02.png",
          "resources/img/effect/fireGround_03.png",
          "resources/img/effect/fireGround_04.png",
        ],
        70,
        MathE.range(0, 4, true),
      );
    Laya.Tween.create(this.Zg).duration(500).to("scaleX", 1).to("scaleY", 1);
    return s;
  }
  protected Gg(t: number): void {
    this.Qg += t;
    if (this.Qg < this.Vg) return;
    this.Qg = 0;
    if (this.gg.length <= 0) return;
    for (const sub of this.gg) this.Ng += sub.num;
    this.target.setState(4, true, this.Ng);
    this.Ng = 0;
  }
  protected Ag(): void {
    super.Ag();
    Laya.Tween.create(this.Zg)
      .duration(500)
      .to("scaleX", 0)
      .to("scaleY", 0)
      .then(() => {
        EffectMgr.instance().removeEvent("imgLoop", this.$g);
        this.Zg.removeSelf();
        PrefabFactory.instance().recover("groundFireEff", this.Zg);
      });
  }
}

/** Lock / chains (封锁). (`ms`) */
export class LockBuff extends StateBuff {
  private Jg: any;

  describe(): string {
    return "封锁";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    this.Jg = new Laya.Panel();
    this.Jg.size(this.dg.map.gridWid, this.dg.map.gridHei);
    for (let i = 0; i < 2; i++) {
      const img = new Laya.Image("resources/img/gameObject/enemy/chain0.png");
      img.size(20, 103);
      img.anchorX = 0.5;
      if (i === 0) {
        img.pos(0, this.Jg.height);
        img.rotation = MathE.range(30, 60);
      } else {
        img.pos(this.Jg.width, this.Jg.height);
        img.rotation = MathE.range(-60, -30);
      }
      this.Jg.addChild(img);
      const dir = MathE.angleToDirection(img.rotation);
      dir.x *= img.height;
      dir.y *= img.height;
      const h = EffectMgr
        .instance()
        .registerImgLoop(
          img,
          [
            "resources/img/gameObject/enemy/chain0.png",
            "resources/img/gameObject/enemy/chain1.png",
          ],
          100,
        );
      Laya.Tween.to(
        img,
        { x: img.x + dir.x, y: img.y + dir.y },
        1000,
        null,
        Laya.Handler.create(this, () => {
          EffectMgr.instance().removeEvent("imgLoop", h);
        }),
      );
    }
    this.target.pg().addChild(this.Jg);
    return s;
  }
  protected Ag(): void {
    super.Ag();
    for (let t = 0; t < this.Jg.numChildren; t++) {
      const img = this.Jg.getChildAt(t);
      Laya.Tween.killAll(img);
      EffectMgr
        .instance()
        .registerImgLoop(
          img,
          [
            "resources/img/gameObject/enemy/chainBreak0.png",
            "resources/img/gameObject/enemy/chainBreak1.png",
          ],
          100,
          0,
          1,
          () => {
            Laya.Tween.to(
              img,
              { alpha: 0 },
              100,
              null,
              Laya.Handler.create(this, () => {
                if (t === this.Jg.numChildren - 1) this.Jg.destroy(true);
              }),
            );
          },
        );
    }
  }
}

/** Fall over (跌倒). (`vs`) */
export class FallBuff extends StateBuff {
  private td = 0;
  private originPos = new Laya.Point();

  constructor() {
    super();
    this.Fg = true;
    this.Og = true;
  }
  describe(): string {
    return "跌倒";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    const i = this.target.pg();
    const h = i.getChildByName("sp");
    this.originPos.setTo(h.x, h.y);
    this.td = h.scaleY;
    Laya.Tween.killAll(h, true);
    Laya.Tween.create(h)
      .to("scaleY", 0.6)
      .duration(50)
      .chain()
      .to("scaleY", this.td + 0.1)
      .duration(50)
      .parallel()
      .to("rotation", -90)
      .duration(100)
      .parallel()
      .to("x", this.originPos.x + 40)
      .duration(100)
      .parallel()
      .to("y", this.originPos.y - 20)
      .duration(100);
    console.log(this.originPos.x + 40, h.x);
    EffectMgr.instance().playDiedaoEff(i, 0, h.height);
    EnemySpatialMgr.instance().sd(t.num, [{ id: this.target.id }], t.fg);
    return s;
  }
  protected Ag(): void {
    const t = this.target.pg().getChildByName("sp");
    Laya.Tween.killAll(t, true);
    Laya.Tween.create(t)
      .to("scaleY", this.td)
      .duration(100)
      .parallel()
      .to("rotation", 0)
      .duration(200)
      .parallel()
      .to("x", this.originPos.x)
      .duration(200)
      .parallel()
      .to("y", this.originPos.y)
      .duration(200);
    super.Ag();
  }
}

/** Pierce / pike-field (穿刺). (`_s`) */
export class PierceBuff extends StateBuff {
  private hd = 5;
  private ed = "resources/img/weapon/weapon_11.png";
  private ad: any[] = [];
  private nd = new Laya.Point();
  private ud: any;
  private pd: any;
  private yd = 0;
  private fd = 0;
  private gd = 0;

  constructor() {
    super();
    this.Fg = true;
  }
  describe(): string {
    return "穿刺";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    const i = t.fg;
    const h = this.target.pg();
    const e = h.getChildByName("sp");
    this.hd = i.hd || 5;
    this.rd(h, e);
    this.od(i.ed);
    this.ld(h, e, t.time);
    return s;
  }
  private rd(t: any, s: any): void {
    this.ud = new Laya.Sprite();
    this.pd = new Laya.Sprite();
    const i = GameMgr.instance().map;
    this.yd = i.gridWid;
    this.fd = i.gridHei;
    this.ud.size(this.yd, this.fd);
    t.addChild(this.ud);
    this.ud.zIndex = s.zIndex - 1;
    for (let j = 0; j < this.hd; j++) {
      const img = new Laya.Image(this.ed);
      img.visible = false;
      this.ad.push(img);
      this.ud.addChild(img);
    }
    this.ud.mask = this.pd;
    this.pd.graphics.drawRect(0, -150, this.yd, this.fd + 150, "#fff");
  }
  private ld(t: any, s: any, i: number): void {
    for (const img of this.ad) {
      const y = MathE.range(this.fd - 20, this.fd);
      img.anchor(0.5, 0.5);
      img.visible = true;
      img.alpha = 1;
      img.pos(MathE.range(20, this.yd - 20), y);
      img.rotation = MathE.range(-5, 5);
      Laya.Tween.create(img)
        .go("scaleY", 0, 1)
        .duration(150)
        .ease(Laya.Ease.cubicOut)
        .go("y", y, -40 + y)
        .duration(150)
        .ease(Laya.Ease.cubicOut);
    }
    EffectMgr.instance().playCrackEffect(t, 40, 80, i);
    this.gd = s.y;
    this.nd.setTo(s.scaleX, s.scaleY);
    Laya.Tween.create(s)
      .go("y", this.gd, this.gd - 60)
      .duration(150)
      .ease(Laya.Ease.cubicOut)
      .parallel()
      .go("rotation", 0, 20);
  }
  protected Ag(): void {
    for (const img of this.ad) Laya.Tween.create(img).go("alpha", 1, 0).duration(500);
    const t = this.target.pg().getChildByName("sp");
    Laya.Tween.create(t)
      .go("y", this.gd - 60, this.gd)
      .duration(250)
      .ease(Laya.Ease.cubicIn)
      .parallel()
      .go("rotation", 20, 0)
      .chain()
      .to("scaleY", 0.2)
      .duration(100)
      .parallel()
      .to("scaleX", 1.5)
      .chain()
      .go("scaleY", 0.2, this.nd.y)
      .duration(100)
      .parallel()
      .go("scaleX", 1.5, this.nd.x);
    super.Ag();
  }
  private od(t: string): void {
    this.ed = t;
    for (const img of this.ad) img.skin = this.ed;
  }
}

/** Spin-fall (跌倒, rotation variant). (`Ss`) */
export class SpinFallBuff extends StateBuff {
  private td = 0;
  private originPos = new Laya.Point();

  constructor() {
    super();
    this.Fg = true;
    this.Og = true;
  }
  describe(): string {
    return "跌倒";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    const i = this.target.pg();
    const h = i.getChildByName("sp");
    this.originPos.setTo(h.x, h.y);
    this.td = h.scaleY;
    Laya.Tween.killAll(h, true);
    Laya.Tween.create(h)
      .to("rotation", 90 * t.fg)
      .duration(200)
      .parallel()
      .to("y", this.originPos.y - 50)
      .duration(100)
      .chain()
      .to("y", this.originPos.y)
      .duration(100);
    console.log(this.originPos.x + 40, h.x);
    EffectMgr.instance().playDiedaoEff(i, 0, h.height);
    return s;
  }
  protected Ag(): void {
    const t = this.target.pg().getChildByName("sp");
    Laya.Tween.killAll(t, true);
    Laya.Tween.create(t).to("rotation", 0).duration(100);
    super.Ag();
  }
}

/** Suppress / level-down (压制). (`bs`) */
export class SuppressBuff extends StateBuff {
  private dd = 1;
  private Ld = 0;
  private md: any;
  private wd: any;

  describe(): string {
    return "压制";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = this.target.pg();
    this.md = s.getChildByName("lvl");
    this.dd = Number(this.md.value);
    const i = super.mg(t);
    if (!this.wd) {
      this.wd = new Laya.Image("resources/img/gameObject/enemy/lvlDown" + this.dd + ".png");
      this.wd.size(30, 30);
      this.wd.pos(this.md.x + this.wd.width / 2, this.md.y + this.wd.height / 2);
      this.wd.anchorX = 0.5;
      this.wd.anchorY = 0.5;
    }
    s.addChild(this.wd);
    const h: string[] = [];
    for (let t = this.dd; t > 0; t--) h.push("resources/img/gameObject/enemy/lvlDown" + t + ".png");
    this.Ld = EffectMgr.instance().registerImgLoop(this.wd, h, 100, 0, 1);
    return i;
  }
  protected Ag(): void {
    super.Ag();
    EffectMgr.instance().removeEvent("imgLoop", this.Ld);
    this.wd.removeSelf();
  }
}

/** Hidden / inert state (no art). (`Ms`) */
export class HiddenStateBuff extends StateBuff {
  describe(): string {
    return "";
  }
  isReduction(): boolean {
    return false;
  }
  protected mg(t: BuffData): any {
    return super.mg(t);
  }
  protected Ag(): void {
    super.Ag();
  }
}

/** Charm (魅惑). (`Ps`) */
export class CharmBuff extends StateBuff {
  describe(): string {
    return "魅惑";
  }
  isReduction(): boolean {
    return true;
  }
}

/** Shock / lightning (电击). (`Bs`) */
export class ShockBuff extends StateBuff {
  private vd: any = null;
  private kd = 0;

  describe(): string {
    return "电击";
  }
  isReduction(): boolean {
    return true;
  }
  protected mg(t: BuffData): any {
    const s = super.mg(t);
    $.instance().playSound("maChao_attack_lightning");
    this.vd = new Laya.Image("resources/img/effect/electric1.png");
    this.vd.anchorX = 0.5;
    this.vd.anchorY = 0.5;
    this.target.pg().addChild(this.vd);
    this.vd.pos(41, -14);
    this.kd = EffectMgr
      .instance()
      .registerImgLoop(
        this.vd,
        [
          "resources/img/effect/electric1.png",
          "resources/img/effect/electric2.png",
          "resources/img/effect/electric3.png",
        ],
        80,
      );
    return s;
  }
  protected Ag(): void {
    super.Ag();
    if (this.vd != null) {
      EffectMgr.instance().removeEvent("imgLoop", this.kd);
      this.vd.destroy();
      this.vd = null;
    }
  }
}
