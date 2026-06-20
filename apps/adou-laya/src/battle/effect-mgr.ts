// EffectMgr — battle visual-effects engine (the bundle's `N`/`q` class).
//
// WORK IN PROGRESS: this is a large class (~99 methods, bundle.pretty.js lines
// ~4091-6641) ported in faithful batches. The instance fields are shared across
// many methods and kept VERBATIM (documented) to avoid drift; method names are
// de-mangled. `init`/`update`/`startGame`/`gameOver` (which reference the
// per-frame sub-update methods) are added only once every referenced method
// exists, so this file typechecks at each step. It is not imported into Main
// until complete.
//
// Deps: Singleton, AudioMgr, PrefabFactory(z), EventMgr(y)+GameEvent(u),
// LayerZ(X), GameMgr(F), UpdateMgr(j), MathE(f).
//
// Method name map (this batch):
//   onBtnDown=nl onBtnUp=rl onBtnOut=ol bindButtons=ll unbindButtons=cl
//   playStarRotate=ul showFloatingText=pl removeFloatingText=fl
//   updateFloatingTexts=al playMergeEffect=dl playSmokeEffect=Ll
//   playRocketEffect=ml

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { AudioMgr } from "../core/audio-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { LayerZ } from "../core/layer-z";
import { MathE } from "../core/math-e";
import { PrefabFactory } from "./prefab-factory";
import { PrefabPool } from "./prefab-pool";
import { UpdateMgr } from "../core/update-mgr";
import { GameMgr } from "../core/game-mgr";

const z = () => PrefabFactory.instance();
const H = () => PrefabPool.instance();
const evt = EventMgr.instance;
const u = GameEvent;
const X = LayerZ;
const $ = () => AudioMgr.instance();
const j = () => UpdateMgr.instance();
const F = () => GameMgr.instance();

export class EffectMgr extends Singleton {
  // Static keys/tables (verbatim).
  static readonly Jl = "$trailFadeRecover";
  static readonly nu = [
    "resources/img/shop/light1.png",
    "resources/img/shop/light2.png",
    "resources/img/shop/light3.png",
  ];

  // Battle layer / overlay references (assigned by BattleScene).
  No: any = null;
  Vo: any = null;
  hc: any = null; // reusable battle-smoke sprite
  dc: any = null; // reusable unit-info tooltip box
  Yc: any = null; // reusable spotlight box (bundle field `Yc`)

  // Shared effect-tracking state (verbatim from the bundle constructor).
  So = 0;
  bo = 0;
  Mo = new Laya.Point();
  Po = new Laya.Point();
  Ao = new Set<any>();
  Eo = false;
  Bo = new Map<any, number>();
  Io = 0;
  Do = new Map<number, { text: any; parent: any; yl: number }>();
  To: any[] = [];
  Ro = 0;
  Co = 0;
  Uo: any[] = [];
  Fo = new Set<any>();
  Oo = new Map<any, any>();
  Yo = new Map<any, any>();
  Xo = false;
  Go = { x: 0, y: 0 };
  Ho = 0;
  Wo = new Map<any, any>();
  zo = new Map<any, any>();
  jo = new Map<any, any>();
  $o: any[] = [];

  // --- Button press feedback ---

  /** (`nl`) */
  onBtnDown(btn: any): void {
    $().playSound("btn_down");
    Laya.Tween.to(btn, { scaleX: 0.9, scaleY: 0.9 }, 50, null, null, 0, false);
  }

  /** (`rl`) */
  onBtnUp(btn: any): void {
    Laya.Tween.to(btn, { scaleX: 1, scaleY: 1 }, 50, null, null, 0, false);
  }

  /** (`ol`) */
  onBtnOut(btn: any): void {
    Laya.Tween.to(btn, { scaleX: 1, scaleY: 1 }, 50, null, null, 0, false);
  }

  /** Bind press-scale feedback to a list of buttons. (`ll`) */
  bindButtons(btns: any[]): void {
    if (btns.length > 0) {
      for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        b.on(Laya.Event.MOUSE_DOWN, this, this.onBtnDown, [b]);
        b.on(Laya.Event.MOUSE_UP, this, this.onBtnUp, [b]);
        b.on(Laya.Event.MOUSE_OUT, this, this.onBtnOut, [b]);
      }
    }
  }

  /** (`cl`) */
  unbindButtons(btns: any[]): void {
    if (btns.length > 0) {
      for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        b.off(Laya.Event.MOUSE_DOWN, this, this.onBtnDown);
        b.off(Laya.Event.MOUSE_UP, this, this.onBtnUp);
        b.off(Laya.Event.MOUSE_OUT, this, this.onBtnOut);
      }
    }
  }

  /** Spinning star effect at (x,y) for `duration` ms. (`ul`) */
  playStarRotate(parent: any, x: number, y: number, duration = 1000): void {
    const e = z().getItem("starRotateEff", this);
    e.pos(x, y);
    e.scale(1, 1);
    e.name = "aaa";
    parent.addChild(e);
    let frame = 0;
    let elapsed = 0;
    const step = () => {
      e.skin = `resources/img/effect/starRotate${frame}.png`;
      frame = (frame + 1) % 2;
      elapsed += 75;
      if (elapsed < duration) Laya.timer.once(75, this, step);
      else e.removeSelf();
    };
    step();
  }

  /** Floating combat text above a target. (`pl`) */
  showFloatingText(target: any, text: string, blue: boolean): void {
    if (!this.Bo.has(target)) this.Bo.set(target, 0);
    const offset = this.Bo.get(target)!;
    this.Bo.set(target, offset + 20);
    const e = z().getItem("textEff", this);
    e.text = text;
    e.color = blue ? "#2083EA" : "#FFF83D";
    evt.event(u.Ut, e, X.Cr);
    target.localToGlobal(Laya.Point.TEMP.setTo(target.width / 2, 0));
    if (e.parent) e.parent.globalToLocal(Laya.Point.TEMP);
    e.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    const baseY = Laya.Point.TEMP.y;
    const midY = e.y + offset;
    const startY = midY + 20;
    e.y = startY;
    e.alpha = 0;
    const id = ++this.Io;
    this.Do.set(id, { text: e, parent: target, yl: baseY });
    Laya.Tween.create(e)
      .to("y", midY)
      .to("alpha", 1)
      .duration(100)
      .chain()
      .delay(600)
      .to("alpha", 0)
      .duration(600)
      .then(() => {
        this.removeFloatingText(id);
        e.removeSelf();
        e.alpha = 0;
        z().recover("textEff", e);
        const cur = this.Bo.get(target)!;
        if (cur >= 20) this.Bo.set(target, cur - 20);
        else this.Bo.set(target, 0);
      });
  }

  /** (`fl`) */
  removeFloatingText(id: number): void {
    this.Do.delete(id);
  }

  /** Reposition active floating texts to follow their targets. (`al`) */
  updateFloatingTexts(): void {
    if (this.Do.size === 0) return;
    const t = Laya.Point.TEMP;
    this.Do.forEach((entry, id) => {
      const text = entry.text;
      const parent = entry.parent;
      if (!parent || !parent.parent) {
        this.Do.delete(id);
        return;
      }
      parent.localToGlobal(t.setTo(parent.width / 2, 0));
      if (text.parent) text.parent.globalToLocal(t);
      const dy = text.y - entry.yl;
      text.pos(t.x, t.y + dy);
      entry.yl = t.y;
    });
  }

  /** Merge "burst" effect with a label. (`dl`) */
  playMergeEffect(parent: any, label: string): void {
    const eff = z().getItem("mergeEff", this);
    const img2 = eff.getChildByName("mergeEffImg2");
    img2.getChildByName("label").text = label;
    parent.addChild(eff);
    eff.alpha = 0;
    eff.scale(0, 0);
    img2.scale(0.5, 0.5);
    Laya.Tween.create(eff)
      .to("alpha", 1)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(100)
      .chain(eff)
      .to("alpha", 0)
      .duration(200)
      .parallel(img2)
      .to("scaleX", 1.3)
      .to("scaleY", 1.3)
      .duration(200)
      .then(() => {
        eff.removeSelf();
        z().recover("mergeEff", eff);
      });
    Laya.Point.TEMP.setTo(parent.x + parent.width / 2, parent.y + parent.height / 2);
    parent.parent.localToGlobal(Laya.Point.TEMP);
  }

  /** Smoke puff animation (frames 1..4 then fade). (`Ll`) */
  playSmokeEffect(parent: any, x: number, y: number): void {
    const h = z().getItem("smokeEff", this);
    let frame = 1;
    parent.addChild(h);
    h.pos(x, y);
    const step = () => {
      frame += 1;
      if (frame > 4) {
        Laya.Tween.to(
          h,
          { alpha: 0 },
          100,
          null,
          Laya.Handler.create(this, () => {
            h.removeSelf();
            h.alpha = 1;
            z().recover("smokeEff", h);
          }),
        );
      } else {
        h.skin = `resources/img/effect/smoke${frame}.png`;
        if (frame === 3) h.alpha = 0.8;
        if (frame === 4) h.alpha = 0.6;
        Laya.timer.once(60, this, step);
      }
    };
    Laya.timer.once(60, this, step);
  }

  /** Rocket explosion animation (frames 0..5 then fade). (`ml`) */
  playRocketEffect(parent: any, x: number, y: number, scale = 1): void {
    const e = z().getItem("rocketEff", this);
    let frame = 0;
    e.zIndex = X.vr;
    parent.addChild(e);
    e.pos(x, y);
    e.scale(scale, scale);
    const step = () => {
      frame += 1;
      if (frame >= 6) {
        Laya.Tween.create(e)
          .to("alpha", 0)
          .duration(100)
          .then(() => {
            e.removeSelf();
            e.alpha = 1;
            e.skin = "resources/img/effect/explode0.png";
            z().recover("rocketEff", e);
          });
      } else {
        e.skin = `resources/img/effect/explode${frame}.png`;
        Laya.timer.once(50, this, step);
      }
    };
    Laya.timer.once(50, this, step);
  }

  /** Set-soldier placement effect (variant 1 vs other; `dir` mirrors X). (`wl`) */
  playSetSoldierEffect(parent: any, x: number, y: number, variant: number, dir = 1): void {
    const a = z().getItem("setSoldierEff", this);
    parent.addChild(a);
    a.pos(x, y);
    const n = a.getChildByName("img1");
    const r = a.getChildByName("img2");
    if (variant === 1) {
      n.skin = "resources/img/effect/setSoldierEff1.png";
      r.skin = "resources/img/effect/setSoldierEff2.png";
    } else {
      n.skin = "resources/img/effect/setSoldierEff3.png";
      r.skin = "resources/img/effect/setSoldierEff4.png";
    }
    n.scale(0.7 * dir, 0.7);
    r.scale(0, 0);
    Laya.Tween.create(n)
      .to("scaleX", 1 * dir)
      .to("scaleY", 1)
      .duration(200)
      .chain()
      .to("alpha", 0)
      .duration(100)
      .then(() => {
        n.alpha = 1;
      }, this);
    Laya.Tween.create(r)
      .to("scaleX", 1 * dir)
      .to("scaleY", 1)
      .duration(200)
      .chain()
      .to("scaleX", 1.2 * dir)
      .to("scaleY", 1.2)
      .to("alpha", 0)
      .duration(100)
      .then(() => {
        r.alpha = 1;
        a.removeSelf();
        z().recover("setSoldierEff", a);
      }, this);
  }

  /** Tai-chi hit effect (frames 1..4 then fade). (`vl`) */
  playTaiChiEffect(parent: any, x: number, y: number): void {
    const h = z().getItem("taiChiEff", this);
    let e = 1;
    h.zIndex = X.vr;
    parent.addChild(h);
    h.pos(x, y);
    const step = () => {
      e += 1;
      if (e > 4) {
        Laya.Tween.to(h, { alpha: 0 }, 100, null, Laya.Handler.create(this, () => {
          h.removeSelf();
          h.alpha = 1;
          z().recover("taiChiEff", h);
        }));
      } else {
        h.skin = `resources/img/effect/hitEffect/taiChiEff_0${e}.png`;
        if (e === 3) h.alpha = 0.8;
        if (e === 4) h.alpha = 0.5;
        Laya.timer.once(50, this, step);
      }
    };
    Laya.timer.once(50, this, step);
  }

  /** Li-hua (pear blossom) hit effect (frames 0..3 then fade). (`kl`) */
  playLiHuaEffect(parent: any, x: number, y: number): void {
    const h = z().getItem("liHuaEff", this);
    let e = 0;
    h.zIndex = X.vr;
    parent.addChild(h);
    h.pos(x, y);
    h.skin = `resources/img/effect/hitEffect/lihuahit${e}.png`;
    const step = () => {
      e += 1;
      if (e > 3) {
        Laya.Tween.to(h, { alpha: 0 }, 300, null, Laya.Handler.create(this, () => {
          h.removeSelf();
          h.alpha = 1;
          z().recover("liHuaEff", h);
        }));
      } else {
        h.skin = `resources/img/effect/hitEffect/lihuahit${e}.png`;
        Laya.timer.once(150, this, step);
      }
    };
    Laya.timer.once(150, this, step);
  }

  /** Long-dan-liang-yin-qiang hit effect (frames 0..3 then fade). (`_l`) */
  playLongDanHitEffect(parent: any, x: number, y: number): void {
    const h = z().getItem("longDanLiangYinQiangHitEff", this);
    let e = 0;
    h.zIndex = X.vr;
    parent.addChild(h);
    h.pos(x, y);
    h.skin = `resources/img/effect/hitEffect/longDanLiangYinQiangHitEff_${e}.png`;
    const step = () => {
      e += 1;
      if (e > 3) {
        Laya.Tween.to(h, { alpha: 0 }, 300, null, Laya.Handler.create(this, () => {
          h.removeSelf();
          h.alpha = 1;
          z().recover("longDanLiangYinQiangHitEff", h);
        }));
      } else {
        h.skin = `resources/img/effect/hitEffect/longDanLiangYinQiangHitEff_${e}.png`;
        Laya.timer.once(150, this, step);
      }
    };
    Laya.timer.once(150, this, step);
  }

  /** Cold dao-qi (ice slash) effect (rotation + scale, frames 1..7 then fade). (`xl`) */
  playColdDaoQiEffect(parent: any, x: number, y: number, rotation: number, scale: number): void {
    const a = z().getItem("coldDaoQiEff", this);
    a.rotation = rotation;
    a.scale(scale, Math.abs(scale));
    let n = 1;
    a.pos(x, y);
    parent.addChild(a);
    const step = () => {
      n += 1;
      if (n > 7) {
        Laya.Tween.to(a, { alpha: 0 }, 100, null, Laya.Handler.create(this, () => {
          a.removeSelf();
          a.alpha = 1;
          z().recover("coldDaoQiEff", a);
        }));
      } else {
        a.skin = `resources/img/effect/iceSlashEff0${n}.png`;
        if (n === 6) a.alpha = 0.8;
        if (n === 7) a.alpha = 0.5;
        Laya.timer.once(50, this, step);
      }
    };
    Laya.timer.once(50, this, step);
  }

  /** Allocate an electric effect (the bundle's `Sl` only pools it). (`Sl`) */
  playElectricEffectAlloc(_parent: any, _x: number, _y: number): void {
    z().getItem("electricEff", this);
  }

  /** Electric hit effect (3 random frames then fade). (`bl`) */
  playElectricEffect(parent: any, x: number, y: number): void {
    const h = z().getItem("electricEff", this);
    let e = 1;
    parent.addChild(h);
    h.pos(x, y);
    const order = MathE.shuffle([1, 2, 3]);
    const step = () => {
      e += 1;
      if (e > 3) {
        Laya.Tween.to(h, { alpha: 0 }, 100, null, Laya.Handler.create(this, () => {
          h.removeSelf();
          h.alpha = 1;
          z().recover("electricEff", h);
        }));
      } else {
        h.skin = `resources/img/effect/electric${order[e - 1]}.png`;
        Laya.timer.once(50, this, step);
      }
    };
    Laya.timer.once(50, this, step);
  }

  /** Enemy knife swipe with a light streak. (`Ml`) */
  playEnemyKnifeAttack(parent: any, x: number, y: number, angle: number): void {
    const e = z().getItem("enemyKnifeAttackEff", this);
    const knife = e.getChildByName("knife");
    const light = e.getChildByName("knifeLight");
    light.rotation = knife.rotation + (angle - knife.rotation) / 2 - 90;
    const rad = light.rotation * (Math.PI / 180);
    const lx = knife.x + Math.cos(rad) * knife.height;
    const ly = knife.y + Math.sin(rad) * knife.height;
    parent.addChild(e);
    knife.pos(x, y);
    knife.rotation = angle - 130;
    light.alpha = 0;
    light.pos(lx, ly);
    Laya.Tween.to(knife, { rotation: angle }, 200, null);
    Laya.Tween.to(
      light,
      { alpha: 1 },
      100,
      null,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(
          light,
          { alpha: 0 },
          50,
          null,
          Laya.Handler.create(this, () => {
            e.removeSelf();
            z().recover("enemyKnifeAttackEff", e);
          }),
          100,
        );
      }),
      100,
    );
  }

  /** Fire flicker effect (4 random frames then fade). (`Il`) */
  playFireEffect(parent: any, x: number, y: number, scale = 1): void {
    const e = z().getItem("fireEff", this);
    let a = 1;
    parent.addChild(e);
    e.pos(x, y);
    e.scale(scale, scale);
    const order = MathE.shuffle([0, 1, 2, 3]);
    const step = () => {
      a += 1;
      if (a > 4) {
        Laya.Tween.to(e, { alpha: 0 }, 100, null, Laya.Handler.create(this, () => {
          e.removeSelf();
          e.alpha = 1;
          z().recover("fireEff", e);
        }));
      } else {
        e.skin = `resources/img/props/fire${order[a - 1]}.png`;
        Laya.timer.once(50, this, step);
      }
    };
    Laya.timer.once(50, this, step);
  }

  /** Scatter `count` fires within a target's bounds. (`Bl`) */
  spawnFires(target: any, count: number, margin = 20): void {
    for (let i = 0; i < count; i++) {
      const x = MathE.range(margin, target.width - margin, true) as number;
      const y = MathE.range(margin, target.height - margin, true) as number;
      this.playFireEffect(target, x, y, 0.5);
    }
  }

  /** Expanding alert ring (scale 1 -> `scale`, fading). (`Rl`) */
  playAlertRing(target: any, delay: number, dur: number, scale: number): void {
    const e = Laya.Pool.getItemByCreateFun("alertImage", () => new Laya.Image());
    e.size(target.width, target.height);
    e.anchor(0.5, 0.5);
    e.skin = target.skin;
    target.addChild(e);
    e.pos(target.width / 2, target.height / 2);
    Laya.Tween.create(e, target)
      .duration(dur)
      .delay(delay)
      .ease(Laya.Ease.quadOut)
      .go("scaleX", 1, scale)
      .go("scaleY", 1, scale)
      .go("alpha", 0.5, 0)
      .then(() => {
        e.removeSelf();
        Laya.Pool.recover("alertImage", e);
      });
  }

  /** N staggered expanding alert rings. (`Tl`) */
  playAlertRings(target: any, count = 3, dur = 750, scale = 1.75): void {
    for (let e = 0; e < count; e++) this.playAlertRing(target, 150 * e, dur, scale);
  }

  /** Rotating shadow after-image. (`Ul`) */
  playShadowTrail(target: any, dur: number, rotation: number): void {
    const h = Laya.Pool.getItemByClass("shadowImage", Laya.Image);
    h.size(target.width, target.height);
    h.skin = target.skin;
    target.addChild(h);
    h.anchor(1, 0.95);
    h.pos(target.width, target.height);
    h.alpha = 0.5;
    h.rotation = rotation;
    Laya.Tween.create(h)
      .delay(dur / 2)
      .to("rotation", target.rotation)
      .duration(dur / 2)
      .then(() => {
        h.removeSelf();
        Laya.Pool.recover("shadowImage", h);
      });
  }

  /** A fan of shadow after-images. (`Cl`) */
  playShadowTrails(target: any, count = 3, step = 30, rots = [20, 40, 60, 80]): void {
    Array.from({ length: count }, (_v, s) => 20 * (s + 1)).forEach((delay, a) => {
      setTimeout(() => {
        this.playShadowTrail(target, step * (count - a), rots[a] || 0);
      }, delay);
    });
  }

  /** Contracting alert ring (scale `scale` -> 1, fading). (`Ol`) */
  playAlertRingIn(target: any, delay: number, dur: number, scale: number): void {
    const e = Laya.Pool.getItemByCreateFun("alertImage", () => new Laya.Image());
    e.size(target.width, target.height);
    e.anchor(0.5, 0.5);
    e.skin = target.skin;
    target.addChild(e);
    e.pos(target.width / 2, target.height / 2);
    Laya.Tween.create(e, target)
      .duration(dur)
      .delay(delay)
      .ease(Laya.Ease.quadOut)
      .go("scaleX", scale, 1)
      .go("scaleY", scale, 1)
      .go("alpha", 0.5, 0)
      .then(() => {
        e.removeSelf();
        Laya.Pool.recover("alertImage", e);
      });
  }

  /** N staggered contracting alert rings. (`Fl`) */
  playAlertRingsIn(target: any, count = 3, dur = 750, scale = 1.75): void {
    for (let e = 0; e < count; e++) this.playAlertRingIn(target, 150 * e, dur, scale);
  }

  /** Ground-crack burst: scatter the prefab's child shards. (`Yl`) */
  playCrackEffect(parent: any, x: number, y: number, fadeDur = 100): void {
    const e = z().getItem("crackEff", this);
    parent.addChild(e);
    e.pos(x, y);
    e.scaleX = 0.8;
    e.scaleY = 0.5;
    Laya.Tween.to(
      e,
      { scaleX: 1, scaleY: 1 },
      100,
      null,
      Laya.Handler.create(this, () => {
        for (let i = 0; i < e.numChildren; i++) {
          const a = e.getChildAt(i);
          a.visible = true;
          a.scale(MathE.range(0.5, 1) as number, MathE.range(0.5, 1) as number);
          const tx = MathE.range(-20, 100) as number;
          const ty = MathE.range(-80, -30) as number;
          Laya.Tween.to(
            a,
            { x: tx, y: ty },
            200,
            null,
            Laya.Handler.create(this, () => {
              a.visible = false;
              a.alpha = 1;
              a.pos(38, 9);
              if (i === e.numChildren - 1) {
                Laya.Tween.to(
                  e,
                  { alpha: 0 },
                  fadeDur,
                  null,
                  Laya.Handler.create(this, () => {
                    e.removeSelf();
                    e.alpha = 1;
                    z().recover("crackEff", e);
                  }),
                );
              }
            }),
          );
        }
      }),
    );
  }

  /** Spawn a coin that arcs (quadratic Bezier) toward (targetX,targetY). (`Xl`) */
  spawnGold(parent: any, x: number, y: number, targetX: number, targetY: number): void {
    const gold = z().getItem("gold", this);
    gold.pos(x, y);
    parent.addChild(gold);
    const n = MathE.range(-20, 20) as number;
    this.To.push({
      gold,
      Gl: { x, y },
      p1: { x: x + n, y: y - 100 },
      p2: { x: x + 2 * n, y: y + 20 },
      Hl: { x: targetX, y: targetY },
      time: 0,
    });
  }

  /** Per-frame: advance flying coins along their arc; flip on arrival. (`Ko`) */
  updateGoldFly(delta: number): void {
    if (this.To.length <= 0) return;
    for (let i = this.To.length - 1; i >= 0; i--) {
      const s = this.To[i];
      s.time += delta / 600;
      if (MathE.quadraticBezierPoint(s.Gl, s.p1, s.p2, s.gold, s.time)) {
        this.goldFlip(s.gold, 0);
        this.To.splice(i, 1);
      }
    }
  }

  /** Coin flip animation on arrival (up to 3 flips, then recover). (`Wl`) */
  goldFlip(gold: any, step: number): void {
    Laya.Tween.to(
      gold,
      { scaleX: -1 },
      200,
      null,
      Laya.Handler.create(this, () => {
        if (step === 2) Laya.Tween.to(gold, { alpha: 0 }, 250);
        Laya.Tween.to(
          gold,
          { scaleX: 1 },
          200,
          null,
          Laya.Handler.create(this, () => {
            if (step + 1 <= 3) {
              this.goldFlip(gold, step + 1);
            } else {
              gold.alpha = 1;
              gold.removeSelf();
              z().recover("gold", gold);
            }
          }),
        );
      }),
    );
  }

  /** Floating "+gold" popup (image when amount===1, else with +N text). (`zl`) */
  playGoldUp(x: number, y: number, amount = 1, scale = 1): void {
    const imageOnly = amount === 1;
    const poolName = imageOnly ? "goldUpImg" : "goldUp";
    const n = z().getItem(poolName, this);
    n.alpha = 1;
    n.scale(scale, scale);
    evt.event(u.Ut, n, X.Fr);
    this.Mo.x = x;
    this.Mo.y = y;
    n.parent.globalToLocal(this.Mo);
    n.pos(this.Mo.x, this.Mo.y);
    const baseY = n.y;
    if (!imageOnly) n.getChildByName("txt").text = "+" + amount;
    const now = j().elapsed;
    if (now - this.bo > 100) this.bo = now;
    Laya.Tween.create(n)
      .to("y", baseY - 30)
      .duration(400)
      .chain()
      .to("y", baseY - 20)
      .to("alpha", 0)
      .duration(300)
      .then(() => this.recoverEffect(n, poolName, scale));
  }

  /** Reset + recover a pooled effect node. (`jl`) */
  recoverEffect(node: any, poolName: string, scale: number): void {
    node.alpha = 1;
    node.scale(scale, scale);
    node.removeSelf();
    z().recover(poolName, node);
  }

  /** Grow grass back over a tile via an animated mask reveal (~10s). (`ql`) */
  growGrass(parent: any, grassSkin: string, x: number, y: number): void {
    const id = (this.So += 1);
    const a = z().getItem("shovelGrass", this);
    a.zIndex = X.lr;
    const grass = a.getChildByName("grass");
    grass.skin = grassSkin;
    const mask = grass.getChildByName("maskSp");
    const shovel = a.getChildByName("shovel");
    mask.graphics.clear();
    mask.graphics.drawRect(0, 0, 0, 0, "#fff");
    parent.addChild(a);
    a.pos(x, y);
    shovel.visible = false;
    let elapsed = 0;
    j().register("growGrass" + id, this, (delta: number) => {
      elapsed += delta;
      mask.graphics.clear();
      mask.graphics.drawRect(0, 0, F().map.gridWid * ((10000 - elapsed) / 10000), F().map.gridHei, "#fff");
      if (elapsed >= 10000) {
        j().unregister("growGrass" + id);
        mask.graphics.clear();
        mask.graphics.drawRect(0, 0, F().map.gridWid, F().map.gridHei, "#fff");
        a.removeSelf();
        shovel.visible = true;
        z().recover("shovelGrass", a);
      }
    });
  }

  /** Toggle the drag target-range circle indicator. (`Vl`) */
  toggleTargetCircle(show: boolean | null, radius: number, x: number, y: number): void {
    if (!this.No) {
      this.No = new Laya.Sprite();
      this.No.alpha = 0.2;
      this.No.visible = false;
      evt.event(u.Ut, this.No, X.yr);
    }
    if (show == null) show = !this.No.visible;
    if (show) {
      if (this.No.visible && x === this.Ro && y === this.Co) {
        this.No.visible = false;
        return;
      }
      this.Ro = x;
      this.Co = y;
      this.No.graphics.clear();
      this.No.graphics.drawCircle(0, 0, radius, "#fff", "#000", 3);
      this.Mo.x = x;
      this.Mo.y = y;
      this.No.parent.globalToLocal(this.Mo);
      this.No.pos(this.Mo.x, this.Mo.y);
      this.No.visible = true;
    } else {
      this.No.visible = false;
    }
  }

  /** Spawn a 2D trail that arcs from (x1,y1) to (x2,y2). (`Ql`) */
  spawnTrail(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    arcHeight: number,
    onDone: any,
    skin = "",
    color = "#ffffff",
    parent: any = null,
  ): void {
    const l = z().getItem("trail", this);
    const head = l.getChildAt(0);
    head.skin = skin;
    head.skin.includes("generalParts") ? (head.color = "#cd8831") : (head.color = "#ffffff");
    const trail = l.getComponent(Laya.Trail2DRender);
    trail.clear();
    trail.enabled = true;
    trail.widthMultiplier = l.getChildAt(0).width / 2;
    trail.time = 0.3;
    const c = new Laya.ColorUtils(color).arrColor;
    trail.color = new Laya.Color(c[0], c[1], c[2], 0.5);
    if (parent) parent.addChild(l);
    else evt.event(u.Ut, l, X.kr);
    this.Mo.x = x1;
    this.Mo.y = y1;
    l.parent.globalToLocal(this.Mo);
    l.pos(this.Mo.x, this.Mo.y);
    const start = { x: this.Mo.x, y: this.Mo.y };
    this.Mo.x = x2;
    this.Mo.y = y2;
    l.parent.globalToLocal(this.Mo);
    const end = { x: this.Mo.x, y: this.Mo.y };
    const ctrl = { x: start.x + (end.x - start.x) / 2, y: start.y - arcHeight };
    this.Uo.push({ Zl: l, Gl: start, p1: ctrl, p2: end, time: 0, Kl: onDone });
  }

  /** Per-frame: advance trails along their arc; on arrival, fade + recover. (`Jo`) */
  updateTrails(delta: number): void {
    if (this.Uo.length <= 0) return;
    for (let h = this.Uo.length - 1; h >= 0; h--) {
      const i = this.Uo[h];
      i.time += delta / 300;
      if (MathE.quadraticBezierPoint(i.Gl, i.p1, i.p2, i.Zl, i.time)) {
        const s = i.Zl;
        s.pos(i.p2.x, i.p2.y);
        const render = s.getComponent(Laya.Trail2DRender);
        const fadeDelay = 1000 * render.time + 200;
        const recover = () => {
          s[EffectMgr.Jl] = null;
          if (this.Fo.delete(s)) {
            render.clear();
            render.enabled = false;
            s.removeSelf();
            s.getChildAt(0).skin = "";
            z().recover("trail", s);
          }
        };
        s[EffectMgr.Jl] = recover;
        this.Fo.add(s);
        Laya.timer.once(fadeDelay, this, recover);
        s.getChildAt(0).skin = "";
        this.Uo.splice(h, 1);
        if (i.Kl) i.Kl();
      }
    }
  }

  /** Immediately clear all active + pending trails (e.g. battle end). (`qo`) */
  clearTrails(): void {
    for (const s of this.Fo) {
      const cb = s[EffectMgr.Jl];
      if (cb) Laya.timer.clear(this, cb);
      s[EffectMgr.Jl] = null;
      const render = s.getComponent(Laya.Trail2DRender);
      if (render) {
        render.clear();
        render.enabled = false;
      }
      s.removeSelf();
      s.getChildAt(0).skin = "";
      z().recover("trail", s);
    }
    this.Fo.clear();
    if (this.Uo.length <= 0) return;
    const skipCallbacks = F().battleState.Vi;
    for (let t = this.Uo.length - 1; t >= 0; t--) {
      const i = this.Uo[t];
      i.time = 1;
      if (!skipCallbacks && i.Kl) i.Kl();
      const render = i.Zl.getComponent(Laya.Trail2DRender);
      if (render) {
        render.clear();
        render.enabled = false;
      }
      i.Zl.removeSelf();
      i.Zl.getChildAt(0).skin = "";
      z().recover("trail", i.Zl);
      this.Uo.splice(t, 1);
    }
  }

  /** Pop a talk-box bubble at (x,y) that auto-hides after 3s. (`tc`) */
  showTalkBox(x: number, y: number, text: string, parent: any = null, autoFlip = true, forceDir: number | null = null): void {
    const n = z().getItem("talkBox", this);
    const r = n.getChildByName("txt");
    const baseW = n.width;
    const baseH = n.height;
    const txtW = r.width;
    const txtH = r.height;
    n.zIndex = X.Yr;
    r.text = text;
    const len = text.length;
    if (len >= 5) {
      const grow = Math.min(1.2 + 0.3 * Math.floor((len - 5) / 4), 2.5);
      n.width = baseW * grow;
      n.height = baseH * grow;
      r.width = txtW * grow;
      r.height = txtH * grow;
      r.pos(n.width / 2, n.height / 2);
      r.typeset();
    } else {
      n.width = baseW;
      n.height = baseH;
      r.width = txtW;
      r.height = txtH;
    }
    n.pos(x, y);
    n.scale(0, 0);
    if (parent) parent.addChild(n);
    else evt.event(u.Ut, n, X.Yr);
    this.Mo.x = x;
    this.Mo.y = y;
    n.parent.globalToLocal(this.Mo);
    n.pos(this.Mo.x, this.Mo.y);
    let dir = 1;
    if (autoFlip && forceDir == null) dir = x < 320 ? -1 : 1;
    else if (forceDir === 1) dir = -1;
    else if (forceDir === 2) dir = 1;
    r.scaleX = dir;
    Laya.Tween.to(
      n,
      { scaleX: 1 * dir, scaleY: 1 },
      100,
      null,
      Laya.Handler.create(this, () => {
        Laya.timer.once(3000, this, () => {
          Laya.Tween.to(
            n,
            { scaleX: 0, scaleY: 0 },
            100,
            null,
            Laya.Handler.create(this, () => {
              n.width = baseW;
              n.height = baseH;
              r.width = txtW;
              r.height = txtH;
              r.pos(baseW / 2, baseH / 2);
              n.removeSelf();
              z().recover("talkBox", n);
            }),
          );
        });
      }),
    );
  }

  /** 12-point red burst that scatters then converges. (`redPoint`) */
  redPoint(x: number, y: number): void {
    let scale = 1;
    for (let h = 0; h < 12; h++) {
      const e = z().getItem("redPoint", this);
      e.pos(
        x + 30 * Math.cos((h / 12) * 360 * (Math.PI / 180)),
        y + 30 * Math.sin((h / 12) * 360 * (Math.PI / 180)),
      );
      evt.event(u.Ut, e, X._r);
      e.scale(0, 0);
      scale = MathE.range(0.5, 1) as number;
      Laya.Tween.to(
        e,
        { scaleX: scale, scaleY: scale },
        100,
        null,
        Laya.Handler.create(this, () => {
          Laya.Tween.to(
            e,
            { x, y, scaleX: 0, scaleY: 0 },
            200,
            null,
            Laya.Handler.create(this, () => {
              e.removeSelf();
              z().recover("redPoint", e);
            }),
          );
        }),
      );
    }
  }

  /** Looping battle-smoke animation at (x,y); calls onDone after the cycle. (`sc`) */
  playBattleSmoke(parent: any, x: number, y: number, onDone: any): void {
    if (!this.hc) {
      this.hc = new Laya.Image("resources/img/effect/battleSmoke0.png");
      this.hc.size(236, 214);
      this.hc.anchorX = 0.5;
      this.hc.anchorY = 0.5;
    }
    this.hc.pos(x, y);
    parent.addChild(this.hc);
    let e = 0;
    const step = () => {
      if (e === 3) {
        Laya.timer.clear(this, step);
        this.hc.removeSelf();
        if (onDone) onDone();
      }
      e += 1;
      this.hc.skin = `resources/img/effect/battleSmoke${e % 4}.png`;
    };
    Laya.timer.loop(100, this, step);
  }

  /** Mob death: ink splat that scales + fades, then a 1..3 frame puff. (`ec`) */
  playMobDead(parent: any, x: number, y: number, color: string, scale: number, onDone: any = null): void {
    const n = z().getItem("mobDead", this);
    const ink = n.getChildByName("ink");
    const img = n.getChildByName("img");
    parent.addChild(n);
    n.pos(x, y);
    ink.color = color;
    ink.scale(0, 0);
    ink.skin = "resources/img/effect/mobDead0.png";
    ink.alpha = 1;
    Laya.Tween.create(ink)
      .to("scaleX", scale)
      .to("scaleY", scale)
      .duration(100)
      .chain()
      .to("alpha", 0)
      .duration(500)
      .then(() => {
        ink.alpha = 1;
        ink.scale(0, 0);
        img.alpha = 1;
        n.removeSelf();
        z().recover("mobDead", n);
      });
    img.skin = "resources/img/effect/mobDead1.png";
    img.color = color;
    img.alpha = 1;
    let l = 1;
    const step = () => {
      if (l !== 3) {
        l += 1;
        img.skin = "resources/img/effect/mobDead" + l + ".png";
      } else {
        Laya.Tween.create(img)
          .to("alpha", 0)
          .duration(50)
          .then(() => {
            Laya.timer.clear(this, step);
            if (onDone) onDone();
          });
      }
    };
    Laya.timer.loop(50, this, step);
  }

  /** Dao-qi hit (3 frames). (`ac`) */
  playDaoQiHit(parent: any, x: number, y: number): void {
    const h = z().getItem("daoQiHit", this);
    h.pos(x, y);
    h.scale(1, 1);
    let e = 0;
    const step = () => {
      h.skin = `resources/img/effect/hitEffect/daoqiHitEff${e}.png`;
      e += 1;
      if (e === 3) {
        Laya.timer.clear(this, step);
        h.removeSelf();
        return;
      }
      Laya.timer.once(100, this, step);
    };
    step();
    parent.addChild(h);
  }

  /** Set alpha on a bow-hit's three layered images. (`nc`) */
  setBowHitAlpha(node: any, alpha: number): void {
    for (let i = 0; i < 3; i++) node.getChildByName(`img${i}`).alpha = alpha;
  }

  /** Knife hit: rotating slash + cycling blood splat. (`rc`) */
  playKnifeHit(parent: any, x: number, y: number, rotation: number): void {
    const e = z().getItem("knifeHit", this);
    e.pos(x, y);
    const img = e.getChildByName("img");
    img.alpha = 0;
    img.scale(0, 0);
    img.rotation = rotation;
    Laya.Tween.to(
      img,
      { alpha: 1, scaleX: 1, scaleY: 1 },
      100,
      null,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(img, { alpha: 0 }, 100);
      }),
    );
    const blood = e.getChildByName("blood");
    let r = 0;
    const step = () => {
      r += 1;
      if (r === 3) {
        Laya.timer.clear(this, step);
        Laya.Tween.to(
          blood,
          { alpha: 0 },
          50,
          Laya.Ease.expoIn,
          Laya.Handler.create(this, () => {
            blood.alpha = 1;
            blood.setTexture(PrefabFactory.hitTex("blood0"));
            e.removeSelf();
            z().recover("knifeHit", e);
          }),
        );
        return;
      }
      blood.setTexture(PrefabFactory.hitTex("blood" + (r % 3)));
    };
    Laya.timer.loop(50, this, step);
    e.zIndex = X.vr;
    parent.addChild(e);
  }

  /** Bow hit: scale-in then fade the 3 layered images. (`oc`) */
  playBowHit(parent: any, x: number, y: number): void {
    const h = z().getItem("bowHit", this);
    h.pos(x, y);
    h.scale(0, 0);
    this.setBowHitAlpha(h, 1);
    Laya.Tween.to(
      h,
      { scaleX: 1, scaleY: 1 },
      100,
      null,
      Laya.Handler.create(this, () => {
        const t = { alpha: 1 };
        Laya.Tween.to(
          t,
          {
            alpha: 0,
            update: Laya.Handler.create(null, () => {
              this.setBowHitAlpha(h, t.alpha);
            }),
          },
          100,
          null,
          Laya.Handler.create(this, () => {
            h.removeSelf();
            z().recover("bowHit", h);
          }),
        );
      }),
    );
    h.zIndex = X.vr;
    parent.addChild(h);
  }

  /** Pike hit: scale-in + fade. (`lc`) */
  playPikeHit(parent: any, x: number, y: number): void {
    const h = z().getItem("pikeHit", this);
    h.pos(x, y);
    const img = h.getChildByName("img1");
    img.alpha = 0;
    img.scale(0, 0);
    Laya.Tween.to(
      img,
      { scaleX: 1, scaleY: 1, alpha: 1 },
      200,
      null,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(
          img,
          { alpha: 0 },
          200,
          null,
          Laya.Handler.create(this, () => {
            h.removeSelf();
            z().recover("pikeHit", h);
          }),
        );
      }),
    );
    h.zIndex = X.vr;
    parent.addChild(h);
  }

  /** Cavalry hit: two-image swipe sequence. (`cc`) */
  playCavalryHit(parent: any, x: number, y: number, angle: number): void {
    const e = z().getItem("cavalryHit", this);
    e.rotation = angle + 45;
    e.pos(x, y);
    const img1 = e.getChildByName("img1");
    img1.alpha = 1;
    img1.scale(0, 0);
    const img2 = e.getChildByName("img2");
    img2.alpha = 0;
    img2.scale(1, 1);
    img2.pos(40, 40);
    Laya.Tween.to(
      img1,
      { scaleX: 1, scaleY: 1 },
      50,
      null,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(img1, { scaleX: 1.2, scaleY: 1.2, alpha: 0 }, 100);
        Laya.Tween.to(
          img2,
          { alpha: 1 },
          50,
          null,
          Laya.Handler.create(this, () => {
            Laya.Tween.to(
              img2,
              {
                x: 30,
                y: 30,
                scaleX: 1.2,
                scaleY: 1.2,
                update: Laya.Handler.create(null, () => {
                  img2.repaint();
                }),
              },
              100,
              null,
              Laya.Handler.create(this, () => {
                e.removeSelf();
                z().recover("cavalryHit", e);
              }),
            );
          }),
        );
      }),
    );
    e.zIndex = X.vr;
    parent.addChild(e);
  }

  /** Arrow-rain falling onto a target (count staggered arrows). (`uc`) */
  playArrowRainDown(parent: any, count = 4): void {
    const slots = Array.from({ length: count }, (_v, idx) => idx);
    for (let h = 0; h < count; h++) {
      const e = slots.splice(MathE.range(0, slots.length, true) as number, 1)[0];
      const a = z().getItem("arrowDown", this);
      const x = ((parent.width - a.width) / count) * e;
      a.alpha = 0;
      a.pos(x, 0);
      parent.addChild(a);
      const targetY = parent.height - a.height;
      Laya.Tween.create(a)
        .to("y", targetY)
        .to("alpha", 0.75)
        .duration(300)
        .delay(100 * h)
        .parallel()
        .to("alpha", 0)
        .duration(300)
        .delay(100 * h + 350)
        .then(() => {
          a.removeSelf();
          z().recover("arrowDown", a);
        });
    }
  }

  /** Arrow-rain rising from a target (count staggered arrows). (`yc`) */
  playArrowRainUp(parent: any, count = 4): void {
    const slots = Array.from({ length: count }, (_v, idx) => idx);
    for (let h = 0; h < count; h++) {
      const e = slots.splice(MathE.range(0, slots.length, true) as number, 1)[0];
      const a = z().getItem("arrowUp", this);
      const x = ((parent.width - a.width) / count) * (e + 1);
      a.alpha = 0;
      a.pos(x, parent.height);
      parent.addChild(a);
      const targetY = (a.height / 3) * 2;
      Laya.Tween.create(a)
        .to("y", targetY)
        .to("alpha", 0.75)
        .duration(400)
        .delay(50 * h)
        .parallel()
        .to("alpha", 0)
        .duration(600)
        .delay(50 * h + 400)
        .then(() => {
          a.removeSelf();
          z().recover("arrowUp", a);
        });
    }
  }

  /** "Merge available" tip floating up at (x,y). (`fc`) */
  playGeneralMergeTip(x: number, y: number, success = true): void {
    const h = z().getItem("generalMergeTip", this);
    h.scaleX = 0;
    const img = h.getChildByName("img");
    img.skin = success
      ? "resources/img/battleUI/mergeTip2.png"
      : "resources/img/battleUI/mergeTip3.png";
    evt.event(u.Ut, h, X.Or);
    this.Mo.x = x;
    this.Mo.y = y;
    h.parent.globalToLocal(this.Mo);
    h.pos(this.Mo.x, this.Mo.y);
    Laya.Tween.to(
      h,
      { scaleX: 1 },
      100,
      null,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(
          h,
          { y: h.y - 100, alpha: 0 },
          1000,
          null,
          Laya.Handler.create(this, () => {
            h.scaleX = 1;
            h.alpha = 1;
            h.removeSelf();
            z().recover("generalMergeTip", h);
          }),
          100,
        );
      }),
    );
  }

  /** Unit-info tooltip (lazy box) anchored to a target, flipping by position. (`Qo`) */
  showUnitInfo(show: boolean, target: any, descText: string, nameText: string, rarityIndex: number, parent: any = null): void {
    if (!this.dc) {
      this.dc = new Laya.Box();
      this.dc.size(250, 168);
      this.dc.anchorX = 0.5;
      this.dc.anchorY = 1;
      this.dc.zIndex = X.Xr;
      const bg = new Laya.Image("resources/img/commonUI/intro1.png");
      bg.name = "img";
      bg.pos(this.dc.width / 2, this.dc.height / 2);
      bg.size(this.dc.width, 145);
      bg.sizeGrid = "20,20,20,20,0";
      bg.anchorX = 0.5;
      bg.anchorY = 0.5;
      this.dc.addChild(bg);
      const triangle = new Laya.Image("resources/img/commonUI/intro2.png");
      triangle.name = "triangle";
      triangle.pos(this.dc.width / 2, 132);
      triangle.size(34, 30);
      triangle.anchorX = 0.5;
      bg.addChild(triangle);
      const nameTxt = new Laya.Text();
      nameTxt.name = "name";
      nameTxt.pos(bg.width / 2, bg.height / 2);
      nameTxt.size(bg.width - 30, bg.height - 20);
      nameTxt.anchorX = 0.5;
      nameTxt.anchorY = 0.5;
      nameTxt.fontSize = 30;
      nameTxt.stroke = 4;
      nameTxt.strokeColor = "#000";
      nameTxt.wordWrap = true;
      nameTxt.align = "center";
      nameTxt.valign = "top";
      nameTxt.color = "#000000";
      bg.addChild(nameTxt);
      const descTxt = new Laya.Text();
      descTxt.name = "txt";
      descTxt.pos(bg.width / 2, bg.height / 2 + 35);
      descTxt.size(bg.width - 30, bg.height - 20);
      descTxt.anchorX = 0.5;
      descTxt.anchorY = 0.5;
      descTxt.fontSize = 22;
      descTxt.wordWrap = true;
      descTxt.align = "center";
      descTxt.valign = "top";
      descTxt.color = "#000000";
      bg.addChild(descTxt);
    }
    const n = this.dc.getChildByName("img");
    const r = n.getChildByName("triangle");
    const o = n.getChildByName("name");
    const l = n.getChildByName("txt");
    if (!show) {
      this.dc.visible = false;
      return;
    }
    this.dc.removeSelf();
    if (parent) parent.addChild(this.dc);
    else evt.event(u.Ut, this.dc, X.Xr);
    const cx = target.x + target.width / 2;
    const cy = target.y + target.height / 2;
    let f = 1;
    this.dc.scaleY = 1;
    if (target.y < this.dc.height * this.dc.scaleY + 100) f = -1;
    o.scaleY = f;
    l.scaleY = f;
    l.y = n.height / 2 + 42 * f;
    this.Mo.x = cx;
    this.Mo.y = target.y + (f > 0 ? 0 : target.height);
    this.dc.parent.globalToLocal(this.Mo);
    this.dc.pos(this.Mo.x, this.Mo.y);
    if (cx - this.dc.width / 2 < 0) {
      this.dc.x = this.dc.width / 2;
      Laya.Point.TEMP.x = cx;
      Laya.Point.TEMP.y = cy;
      r.x = r.parent.globalToLocal(Laya.Point.TEMP).x;
    } else if (cx + this.dc.width / 2 > 640) {
      Laya.Point.TEMP.x = 640 - this.dc.width / 2;
      Laya.Point.TEMP.y = 0;
      this.dc.x = this.dc.parent.globalToLocal(Laya.Point.TEMP).x;
      Laya.Point.TEMP.x = cx;
      Laya.Point.TEMP.y = cy;
      r.x = r.parent.globalToLocal(Laya.Point.TEMP).x;
    } else {
      Laya.Point.TEMP.x = cx;
      Laya.Point.TEMP.y = cy;
      r.x = r.parent.globalToLocal(Laya.Point.TEMP).x;
    }
    this.dc.visible = true;
    this.dc.scale(0, 0);
    Laya.Tween.create(this.dc).to("scaleX", 1.1).to("scaleY", 1.1 * f).duration(100);
    l.text = descText;
    o.text = nameText;
    o.color = F().props.ia[rarityIndex];
  }

  /** Anger puff (frames 0..3). (`Lc`) */
  playAnger(x: number, y: number): void {
    const i = new Laya.Image("resources/img/effect/anger0.png");
    i.size(80, 80);
    evt.event(u.Ut, i, X.Sr);
    this.Mo.x = x;
    this.Mo.y = y;
    i.parent.globalToLocal(this.Mo);
    i.pos(this.Mo.x, this.Mo.y);
    let h = 0;
    const step = () => {
      i.skin = `resources/img/effect/anger${h}.png`;
      h += 1;
      if (h === 4) {
        Laya.timer.clear(this, step);
        i.removeSelf();
        return;
      }
      Laya.timer.once(100, this, step);
    };
    step();
  }

  /** Boom-star burst (frames 0..3). (`wc`) */
  playBoomStar(x: number, y: number): void {
    const i = new Laya.Image("resources/img/effect/hitEffect/boomStar0.png");
    i.size(80, 80);
    i.scale(1.5, 1.5);
    evt.event(u.Ut, i, X.Mr);
    this.Mo.x = x;
    this.Mo.y = y;
    i.parent.globalToLocal(this.Mo);
    i.pos(this.Mo.x, this.Mo.y);
    let h = 0;
    const step = () => {
      i.skin = `resources/img/effect/hitEffect/boomStar${h}.png`;
      h += 1;
      if (h === 4) {
        Laya.timer.clear(this, step);
        i.removeSelf();
        return;
      }
      Laya.timer.once(100, this, step);
    };
    step();
  }

  /** Tiger roar sweep + alert rings. (`vc`) */
  playTigerRoars(parent: any, x: number, y: number): void {
    const h = z().getItem("tigerRoars", this);
    evt.event(u.Ut, h, X.Pr);
    h.rotation = -45;
    h.alpha = 0;
    parent.addChild(h);
    h.pos(x, y);
    Laya.Tween.to(
      h,
      { alpha: 1, scaleX: 1.1, scaleY: 1.1 },
      300,
      Laya.Ease.sineIn,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(
          h,
          { rotation: -70, scaleX: 1, scaleY: 1 },
          500,
          Laya.Ease.sineInOut,
          Laya.Handler.create(this, () => {
            Laya.Tween.to(
              h,
              { alpha: 0, scaleX: 0.8, scaleY: 0.8, rotation: -90 },
              300,
              Laya.Ease.sineOut,
              Laya.Handler.create(this, () => {
                h.removeSelf();
                z().recover("tigerRoars", h);
              }),
            );
          }),
        );
      }),
    );
    this.playAlertRings(h);
  }

  /** Wolf roar sweep + alert rings. (`kc`) */
  playWolfRoars(parent: any, x: number, y: number): void {
    const h = z().getItem("wolfRoars", this);
    evt.event(u.Ut, h, X.Pr);
    h.rotation = 0;
    h.alpha = 0;
    h.scale(0.8, 0.8);
    parent.addChild(h);
    h.pos(x, y);
    Laya.Tween.to(
      h,
      { alpha: 1, scaleX: 1.1, scaleY: 1.1 },
      200,
      Laya.Ease.sineIn,
      Laya.Handler.create(this, () => {
        Laya.Tween.to(
          h,
          { rotation: -25, scaleX: 1, scaleY: 1 },
          400,
          Laya.Ease.sineInOut,
          Laya.Handler.create(this, () => {
            Laya.Tween.to(
              h,
              { alpha: 0, scaleX: 0.8, scaleY: 0.8, rotation: -35 },
              200,
              Laya.Ease.sineOut,
              Laya.Handler.create(this, () => {
                h.removeSelf();
                z().recover("wolfRoars", h);
              }),
            );
          }),
        );
      }),
    );
    this.playAlertRings(h);
  }

  /** Persistent tiger-roar buff icon (long-lived pulse). (`_c`) */
  playTigerRoarBuff(parent: any, x: number, y: number, _duration = 10000): void {
    let e = parent.getChildByName("tigeraaa");
    if (e) {
      Laya.Tween.killAll(e);
      e.alpha = 0;
      e.scale(0.2, 0.2);
      e.pos(x, y);
    } else {
      e = Laya.Pool.getItemByClass("tigerRoarBuff", Laya.Image);
      e.skin = "resources/img/effect/tiger2.png";
      e.name = "tigeraaa";
      e.alpha = 0;
      e.scale(0.2, 0.2);
      e.pos(x, y);
      parent.addChild(e);
    }
    Laya.Tween.to(e, { scaleX: 0.2, scaleY: 0.2, alpha: 0.5 }, 120, Laya.Ease.backOut, Laya.Handler.create(this, () => {
      Laya.Tween.to(e, { scaleX: 0.2, scaleY: 0.2, alpha: 1 }, 220, Laya.Ease.sineInOut, Laya.Handler.create(this, () => {
        Laya.Tween.to(e, { scaleX: 0.4, scaleY: 0.4, alpha: 1 }, 120, Laya.Ease.sineInOut, Laya.Handler.create(this, () => {
          Laya.Tween.to(e, { scaleX: 0.3, scaleY: 0.3, alpha: 1 }, 120, Laya.Ease.sineInOut, Laya.Handler.create(this, () => {
            Laya.Tween.to(e, { scaleX: 0.3, scaleY: 0.3, alpha: 1 }, 9420, null, Laya.Handler.create(this, () => {
              if (e) {
                e.removeSelf();
                Laya.Pool.recover("wolfRoarBuff", e);
              }
            }));
          }));
        }));
      }));
    }));
  }

  /** Persistent wolf-roar buff icon (long-lived pulse). (`xc`) */
  playWolfRoarBuff(parent: any, x: number, y: number, _duration = 10000): void {
    let e = parent.getChildByName("wolfaaa");
    if (e) {
      Laya.Tween.killAll(e);
      e.alpha = 0;
      e.scale(0.2, 0.2);
      e.pos(x, y);
    } else {
      e = Laya.Pool.getItemByClass("wolfRoarBuff", Laya.Image);
      e.skin = "resources/img/effect/wolf0.png";
      e.name = "wolfaaa";
      e.alpha = 0;
      e.scale(0.2, 0.2);
      e.pos(x, y);
      e.alpha = 0;
      parent.addChild(e);
    }
    Laya.Tween.to(e, { scaleX: 0.2, scaleY: 0.2, alpha: 0.5 }, 120, Laya.Ease.backOut, Laya.Handler.create(this, () => {
      Laya.Tween.to(e, { scaleX: 0.2, scaleY: 0.2, alpha: 1 }, 220, Laya.Ease.sineInOut, Laya.Handler.create(this, () => {
        Laya.Tween.to(e, { scaleX: 0.4, scaleY: 0.4, alpha: 1 }, 120, Laya.Ease.sineInOut, Laya.Handler.create(this, () => {
          Laya.Tween.to(e, { scaleX: 0.3, scaleY: 0.3, alpha: 1 }, 120, Laya.Ease.sineInOut, Laya.Handler.create(this, () => {
            Laya.Tween.to(e, { scaleX: 0.3, scaleY: 0.3, alpha: 1 }, 9420, null, Laya.Handler.create(this, () => {
              if (e) {
                e.removeSelf();
                Laya.Pool.recover("wolfRoarBuff", e);
              }
            }));
          }));
        }));
      }));
    }));
  }

  /** Expanding sound-wave ring. (`Sc`) */
  playSoundWaves(parent: any, x: number, y: number): void {
    const h = z().getItem("soundWaves", this);
    h.scaleX = 0;
    h.scaleY = 0;
    h.alpha = 1;
    parent.addChild(h);
    h.pos(x, y);
    Laya.Tween.to(
      h,
      { scaleX: 1.5, scaleY: 1.5, alpha: 0.7 },
      800,
      null,
      Laya.Handler.create(this, () => {
        h.removeSelf();
        z().recover("soundWaves", h);
      }),
    );
  }

  /** Knockdown ("diedao") effect (frames 0..2 then fade). (`bc`) */
  playDiedaoEff(parent: any, x: number, y: number): void {
    const h = z().getItem("diedaoEff", this);
    parent.addChild(h);
    h.pos(x, y);
    let e = 0;
    const step = () => {
      e += 1;
      if (e === 3) {
        Laya.timer.clear(this, step);
        Laya.Tween.to(h, { alpha: 0 }, 150, Laya.Ease.expoIn, Laya.Handler.create(this, () => {
          h.alpha = 1;
          h.skin = "resources/img/effect/diedao0.png";
          h.removeSelf();
          z().recover("diedaoEff", h);
        }));
        return;
      }
      h.skin = `resources/img/effect/diedao${e % 3}.png`;
    };
    Laya.timer.loop(100, this, step);
  }

  /** Blood spurt (frames 0..2 then fade). (`Mc`) */
  playBloodEff(parent: any, x: number, y: number): void {
    const h = z().getItem("bloodEff", this);
    parent.addChild(h);
    h.pos(x, y);
    let e = 0;
    const step = () => {
      e += 1;
      if (e === 3) {
        Laya.timer.clear(this, step);
        Laya.Tween.to(h, { alpha: 0 }, 50, Laya.Ease.expoIn, Laya.Handler.create(this, () => {
          h.alpha = 1;
          h.skin = "resources/img/effect/hitEffect/blood0.png";
          h.removeSelf();
          z().recover("bloodEff", h);
        }));
        return;
      }
      h.skin = `resources/img/effect/hitEffect/blood${e % 3}.png`;
    };
    Laya.timer.loop(50, this, step);
  }

  /** Fall/landing dust (frames 0..4 then fade). (`Pc`) */
  playFallEff(parent: any, x: number, y: number): void {
    const h = z().getItem("fallEff", this);
    parent.addChild(h);
    h.pos(x, y);
    let e = 0;
    const step = () => {
      e += 1;
      if (e === 5) {
        Laya.timer.clear(this, step);
        Laya.Tween.to(h, { alpha: 0 }, 50, Laya.Ease.expoIn, Laya.Handler.create(this, () => {
          h.alpha = 1;
          h.skin = "resources/img/effect/fallEff0.png";
          h.removeSelf();
          z().recover("fallEff", h);
        }));
        return;
      }
      h.skin = `resources/img/effect/fallEff${e % 5}.png`;
    };
    Laya.timer.loop(50, this, step);
  }

  /** Per-frame: drive registered shake oscillations. (`shake`) */
  updateShake(delta: number): void {
    for (const s of this.Yo.values()) {
      s.timer += delta;
      if (s.timer > s.time) {
        this.Yo.delete(s.id);
        if (s.onComplete) s.onComplete();
        return;
      }
      if (s.img.rotation > s.amplitude) s.Dc = -1;
      if (s.img.rotation < -s.amplitude) s.Dc = 1;
      s.img.rotation += 8 * s.Dc;
    }
  }

  /** Level-up effect at (x,y). (`Tc`) */
  playLvlUp(x: number, y: number): void {
    const i = H().so("lvlUpEff").create();
    const h = i.getChildAt(0);
    const e = i.getChildAt(1);
    h.pos(40, 100);
    h.scale(0, 0);
    h.alpha = 0;
    e.scale(0, 0);
    e.alpha = 0;
    evt.event(u.Ut, i, X.Ir);
    Laya.Point.TEMP.x = x;
    Laya.Point.TEMP.y = y;
    i.parent.globalToLocal(Laya.Point.TEMP);
    i.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    Laya.Tween.to(h, { scaleX: 1, scaleY: 0.5, alpha: 1 }, 100, null, Laya.Handler.create(this, () => {
      Laya.Tween.to(h, { scaleY: 1 }, 30, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(h, { alpha: 0, y: h.y - 30 }, 300);
      }));
      Laya.Tween.to(e, { scaleX: 1, scaleY: 1, alpha: 1 }, 100, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(e, { alpha: 0, y: e.y - 30 }, 500, null, Laya.Handler.create(this, () => {
          i.destroy();
        }));
      }));
    }));
  }

  /** Level-down effect at (x,y). (`Rc`) */
  playLvlDown(x: number, y: number): void {
    const i = H().so("lvlDownEff").create();
    const h = i.getChildAt(1);
    const e = i.getChildAt(0);
    evt.event(u.Ut, i, X.Dr);
    Laya.Point.TEMP.x = x;
    Laya.Point.TEMP.y = y;
    i.parent.globalToLocal(Laya.Point.TEMP);
    i.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    h.alpha = 0;
    e.alpha = 0;
    Laya.Tween.to(h, { alpha: 1 }, 100, null, Laya.Handler.create(this, () => {
      Laya.Tween.to(h, { alpha: 0, y: e.y + 30 }, 300, null, Laya.Handler.create(this, () => {
        i.destroy();
      }));
      Laya.Tween.to(e, { scaleX: 1, scaleY: 1, alpha: 1 }, 100, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(e, { alpha: 0, y: e.y + 30 }, 500, null, Laya.Handler.create(this, () => {
          i.destroy();
        }));
      }));
    }));
  }

  /** Roll in the black-cloud overlay (one half). (`Cc`) */
  showBlackCloud(bottomHalf: boolean): void {
    if (!this.Vo) {
      this.Vo = new Laya.Box();
      this.Vo.pos(0, 200);
      this.Vo.size(640, 800);
      for (let t = 0; t < 40; t++) {
        const cloud = new Laya.Image("resources/img/gameObject/enemy/blackCloud0.png");
        cloud.size(502, 149);
        this.Vo.addChild(cloud);
      }
      evt.event(u.Ut, this.Vo, X.zr);
    }
    const start = bottomHalf ? Math.floor(this.Vo.numChildren / 2) : 0;
    const end = bottomHalf ? this.Vo.numChildren : Math.floor(this.Vo.numChildren / 2);
    for (let h = start; h < end; h++) {
      const s = this.Vo.getChildAt(h);
      s.alpha = MathE.range(0.7, 1) as number;
      s.pos(
        MathE.range(-200, 500) as number,
        MathE.range(bottomHalf ? 400 : -100, bottomHalf ? 700 : 300) as number,
      );
      if (s.x < 150) {
        s.x -= 700;
        Laya.Tween.to(s, { x: s.x + 700 }, 1000, Laya.Ease.cubicOut);
      } else {
        s.x += 700;
        Laya.Tween.to(s, { x: s.x - 700 }, 1000, Laya.Ease.cubicOut);
      }
    }
    this.Vo.visible = true;
  }

  /** Roll out the black-cloud overlay (one half). (`Uc`) */
  hideBlackCloud(bottomHalf: boolean): void {
    if (!this.Vo) return;
    const start = bottomHalf ? Math.floor(this.Vo.numChildren / 2) : 0;
    const end = bottomHalf ? this.Vo.numChildren : Math.floor(this.Vo.numChildren / 2);
    for (let t = start; t < end; t++) {
      const s = this.Vo.getChildAt(t);
      if (s.x < 150) Laya.Tween.to(s, { x: s.x - 700 }, 1000, Laya.Ease.cubicOut);
      else Laya.Tween.to(s, { x: s.x + 700 }, 1000, Laya.Ease.cubicOut);
    }
    this.Vo.visible = false;
  }

  /** A love-heart that flies from `from` to `to`, then bursts. (`Fc`) */
  playLoveHeart(from: any, to: any, onDone: any): void {
    const h = H().so("loveHeart").create();
    const light = h.getChildByName("heartLight");
    const heart = h.getChildByName("heart");
    const trail = heart.getChildByName("heartTrail");
    evt.event(u.Ut, h, X.Ar);
    this.Mo.x = from.x;
    this.Mo.y = from.y;
    h.parent.globalToLocal(this.Mo);
    this.Po.x = to.x;
    this.Po.y = to.y;
    h.parent.globalToLocal(this.Po);
    h.pos(this.Mo.x, this.Mo.y);
    trail.rotation = MathE.angle(this.Mo, this.Po);
    const dist = MathE.distance(this.Mo, this.Po);
    Laya.Tween.to(h, { x: this.Po.x, y: this.Po.y }, 2 * dist, null, Laya.Handler.create(this, () => {
      Laya.Tween.to(trail, { alpha: 0 }, 100);
      Laya.Tween.to(heart, { scaleX: 1.5, scaleY: 1.5 }, 100, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(heart, { scaleX: 1.6, scaleY: 1.6, alpha: 0 }, 200);
      }));
      Laya.Tween.to(light, { scaleX: 2, scaleY: 2 }, 100, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(light, { scaleX: 2.3, scaleY: 2.3, alpha: 0 }, 200, null, Laya.Handler.create(this, () => {
          h.destroy(true);
          if (onDone) onDone();
        }));
      }));
    }));
  }

  /** Register a frame-loop animation; returns its id. (`Al`) */
  registerImgLoop(img: any, skins: string[], time: number, skinIndex = 0, loopCount = 0, onComplete: any = null): number {
    const id = (this.So += 1);
    this.Oo.set(id, { id, img, skins, skinIndex, time, timer: 0, Ac: loopCount, Ec: 0, Kl: onComplete });
    return id;
  }

  /** Enable/disable the rain area (used by `updateRain`). (`Oc`) */
  setRainArea(enabled: boolean, x: number, y: number, w: number, h: number): void {
    this.Xo = enabled;
    if (this.Xo) {
      if (!this.Yc) {
        this.Yc = new Laya.Box();
        evt.event(u.Ut, this.Yc, X.jr);
      }
      this.Yc.pos(x, y);
      this.Yc.width = w;
      this.Yc.height = h;
    }
  }

  /** Per-frame: spawn diagonal rain streaks inside the rain area. (`sl`) */
  updateRain(delta: number): void {
    if (!this.Xo) return;
    this.Ho += delta;
    if (this.Ho < 20) return;
    this.Ho = 0;
    const s = z().getItem("rain", this);
    this.Yc.addChild(s);
    this.Mo.x = MathE.range(0, 800) as number;
    this.Mo.y = -900;
    s.pos(this.Mo.x, this.Mo.y);
    this.Go.x = this.Po.x = MathE.range(this.Mo.x - 300, this.Mo.x - 200) as number;
    this.Go.y = this.Po.y = MathE.range(0, this.Yc.height) as number;
    s.rotation = MathE.angle(this.Mo, this.Po);
    const dist = MathE.distance(this.Mo, this.Po);
    Laya.Tween.to(s, { x: this.Po.x, y: this.Po.y }, dist, null, Laya.Handler.create(this, () => {
      s.removeSelf();
      z().recover("rain", s);
    }));
  }

  /** Thunder strike at (x,y) (5-frame loop then fade). (`Xc`) */
  playThunderStrike(x: number, y: number): void {
    const i = z().getItem("thunderStrikeEff", this);
    i.scale(1, 1);
    evt.event(u.Ut, i, X.Br);
    Laya.Point.TEMP.x = x;
    Laya.Point.TEMP.y = y;
    i.parent.globalToLocal(Laya.Point.TEMP);
    i.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
    this.registerImgLoop(
      i,
      [
        "resources/img/effect/thunder0.png",
        "resources/img/effect/thunder1.png",
        "resources/img/effect/thunder2.png",
        "resources/img/effect/thunder1.png",
        "resources/img/effect/thunder0.png",
      ],
      50,
      0,
      1,
      () => {
        Laya.Tween.create(i)
          .to("alpha", 0)
          .duration(100)
          .then(() => {
            i.alpha = 1;
            i.removeSelf();
            z().recover("thunderStrikeEff", i);
          });
      },
    );
  }

  /** Register a quadratic-Bezier move; returns its id. (`Gc`) */
  registerBezier(p0: any, p1: any, p2: any, obj: any, time: number, onComplete: any): number {
    const id = (this.So += 1);
    this.Wo.set(id, { id, Gl: p0, p1, p2, obj, time, timer: 0, Kl: onComplete });
    return id;
  }

  /** Per-frame: advance registered Bezier moves. (`il`) */
  updateBezier(delta: number): void {
    if (this.Wo.size <= 0) return;
    for (const key of this.Wo.keys()) {
      const s = this.Wo.get(key);
      s.timer += delta / s.time;
      if (MathE.quadraticBezierPoint(s.Gl, s.p1, s.p2, s.obj, s.timer)) {
        if (s.Kl) s.Kl();
        this.Wo.delete(key);
      }
    }
  }

  /** Remove a registered effect by type + id. (`El`) */
  removeEvent(type: string, id: number): void {
    let map: Map<number, any>;
    switch (type) {
      case "imgLoop":
        map = this.Oo;
        break;
      case "shake":
        map = this.Yo;
        break;
      case "bezierCurve":
        map = this.Wo;
        break;
      case "pointFlash":
        map = this.jo;
        break;
      case "btnSparkle":
        this.clearBtnSparkle(id);
        return;
      default:
        throw new Error("EffectMgr.removeEvent: unknown EffectType " + type);
    }
    map.delete(id);
  }

  /** Per-frame: advance registered frame-loop animations. (`tl`) */
  updateImgLoops(delta: number): void {
    for (const s of this.Oo.values()) {
      s.timer += delta;
      if (s.timer > s.time) {
        s.skinIndex += 1;
        if (s.skinIndex >= s.skins.length) {
          s.Ec += 1;
          if (s.Ac > 0 && s.Ec >= s.Ac) {
            Laya.timer.callLater(this, this.removeEvent, ["imgLoop", s.id]);
            if (s.Kl) s.Kl(s.id);
            continue;
          }
          s.skinIndex = 0;
        }
        s.img.skin = s.skins[s.skinIndex];
        s.timer = 0;
      }
    }
  }

  /** Register a button-sparkle emitter; returns its id. (`Hc`) */
  registerBtnSparkle(btn: any, config: any): number {
    const id = (this.So += 1);
    const entry = {
      id,
      btn,
      timer: 0,
      Wc: config.Wc,
      skins: config.skins,
      zc: config.zc,
      jc: config.jc,
      $c: config.$c,
      Nc: config.Nc,
      qc: config.qc,
      Vc: config.Vc,
      Qc: config.Qc,
      Zc: [] as any[],
    };
    this.zo.set(id, entry);
    for (let t = 0; t < entry.Vc; t++) {
      Laya.timer.once(t * entry.Qc, this, this.btnSparkleSpawn, [id], false);
    }
    return id;
  }

  /** Initial staggered sparkle spawn. (`Kc`) */
  btnSparkleSpawn(id: number): void {
    const entry = this.zo.get(id);
    if (entry) this.spawnBtnSparkle(entry);
  }

  /** Per-frame: re-emit button sparkles on their interval. (`el`) */
  updateBtnSparkle(delta: number): void {
    for (const s of this.zo.values()) {
      if (s.btn && !s.btn.destroyed) {
        s.timer += delta;
        if (s.timer >= s.Wc) {
          s.timer = 0;
          this.spawnBtnSparkle(s);
        }
      }
    }
  }

  /** Spawn a single sparkle light for a button emitter. (`Jc`) */
  spawnBtnSparkle(entry: any): void {
    const btn = entry.btn;
    const i = z().getItem("shopAdLight", this);
    entry.Zc.push(i);
    i.alpha = 0;
    i.scale(0, 0);
    const skinIdx = MathE.range(0, entry.skins.length - 1, true) as number;
    i.skin = entry.skins[skinIdx];
    const size = MathE.range(entry.zc, entry.jc) as number;
    i.size(size, size);
    i.pos(
      MathE.range(-entry.$c, btn.width + entry.$c) as number,
      MathE.range(-entry.$c, btn.height + entry.$c) as number,
    );
    Laya.Tween.create(i)
      .to("scaleX", 1)
      .to("scaleY", 1)
      .to("alpha", 1)
      .duration(entry.Nc)
      .chain()
      .to("scaleX", 0)
      .to("scaleY", 0)
      .to("alpha", 0)
      .duration(entry.qc)
      .then(() => {
        const idx = entry.Zc.indexOf(i);
        if (idx >= 0) entry.Zc.splice(idx, 1);
        i.removeSelf();
        z().recover("shopAdLight", i);
      });
    btn.addChild(i);
  }

  /** Stop a button-sparkle emitter and clear its lights. (`Bc`) */
  clearBtnSparkle(id: number): void {
    const entry = this.zo.get(id);
    if (entry) {
      this.zo.delete(id);
      for (let t = entry.Zc.length - 1; t >= 0; t--) {
        const i = entry.Zc[t];
        Laya.Tween.killAll(i);
        i.removeSelf();
        z().recover("shopAdLight", i);
      }
      entry.Zc.length = 0;
    }
  }

  /** Register a point-flash sparkle area; returns its id. (`tu`) */
  registerPointFlash(parent: any, color: string, x: number, y: number, width: number, height: number): number {
    const id = (this.So += 1);
    this.jo.set(id, { id, parent, color, x, y, width, height, su: [] as any[], timer: 0 });
    return id;
  }

  /** Per-frame: emit point-flash sparkles in their areas. (`hl`) */
  updatePointFlash(delta: number): void {
    for (const entry of this.jo.values()) {
      const i = entry;
      i.timer += delta;
      if (i.timer >= 500) {
        i.timer = 0;
        const t = z().getItem("pointFlashEff", this);
        t.size(20, 20);
        t.pos(
          MathE.range(i.x + t.width / 2, i.x + i.width - t.width / 2) as number,
          MathE.range(i.y + t.height / 2, i.y + i.height - t.height / 2) as number,
        );
        t.color = i.color;
        i.parent.addChild(t);
        i.su.push(t);
        t.alpha = 0;
        t.scale(0, 0);
        Laya.Tween.create(t)
          .to("alpha", 1)
          .to("scaleX", 1)
          .to("scaleY", 1)
          .duration(100)
          .chain()
          .to("alpha", 0)
          .to("scaleX", 0)
          .to("scaleY", 0)
          .duration(MathE.range(1500, 2500) as number)
          .then(() => {
            t.removeSelf();
            i.su.splice(i.su.indexOf(t), 1);
            z().recover("pointFlashEff", t);
          });
      }
    }
  }

  /** Recover all in-flight weapon-fragment effects. (`Zo`) */
  clearWeaponFragments(): void {
    this.Ao.forEach((t) => {
      if (t && !t.destroyed) {
        Laya.Tween.killAll(t);
        t.offAll();
        t.removeSelf();
        t.alpha = 1;
        t.scale(1, 1);
        t.rotation = 0;
        z().recover("weaponFragment", t);
      }
    });
    this.Ao.clear();
  }
}
