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

const z = () => PrefabFactory.instance();
const y = EventMgr.instance;
const u = GameEvent;
const X = LayerZ;
const $ = () => AudioMgr.instance();

export class EffectMgr extends Singleton {
  // Battle layer / overlay references (assigned by BattleScene).
  No: any = null;
  Vo: any = null;

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
    y.event(u.Ut, e, X.Cr);
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
}
