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
}
