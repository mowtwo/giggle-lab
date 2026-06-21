// BossAnimSprite — spine-or-image visual wrapper for bosses (the bundle's `sh`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~14821-14905. Wraps either a spine animation (via AnimPlayer) or a static
// image, exposing play/stop/scale/playback-rate + a STOPPED-callback helper.
// Opaque field / method names kept verbatim.
//
//   isSpine=cb  spine=sk  image=img  playOnce-loop=pb  onStop=onStop

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { AnimPlayer } from "./anim-player";

const F = GameMgr;
const Zt = AnimPlayer;

export class BossAnimSprite extends Laya.Sprite {
  private cb = false;
  skin: any = null;
  private sk: any;
  private img: any;

  constructor(t = false, s?: any) {
    super();
    this.cb = false;
    this.skin = null;
    this.cb = t;
    this.skin = s;
    this.size(F.instance().map.gridWid, F.instance().map.gridHei);
    if (t) {
      this.sk = Zt.instance().pf(s);
      this.sk.scale(1, 1);
      this.sk.setAutoAdjust(true);
      this.sk.pos(F.instance().map.gridWid / 2, F.instance().map.gridHei - 15);
      this.addChild(this.sk);
    } else {
      this.img = new Laya.Image(s);
      this.img.size(F.instance().map.gridWid, F.instance().map.gridHei);
      this.img.anchorX = 0.5;
      this.img.anchorY = 1;
      this.img.scale(1, 1);
      this.addChild(this.img);
    }
  }
  ub(t: number, s: number): void {
    if (this.cb) this.sk.scale(t, s);
  }
  offset(t: number, s: number): void {
    if (this.cb) this.sk.offset(t, s);
  }
  play(t: string, s?: boolean): void {
    if (this.cb) this.sk.play(t, s);
  }
  /** Play `t` for `s` loops, calling `h` each stop, then `i` at the end. (`pb`) */
  pb(t: string, s: number, i: () => void, h?: () => void): void {
    if (!this.cb) return;
    let e = 0;
    this.sk.on(Laya.Event.STOPPED, this, () => {
      if (h) h();
      e += 1;
      if (e >= s) {
        this.sk.offAll(Laya.Event.STOPPED);
        i();
        return;
      }
      this.sk.play(t, false);
    });
    this.sk.play(t, false);
  }
  stop(): void {
    if (this.cb) this.sk.stop();
  }
  yb(t: number): void {
    if (this.cb) this.sk.playbackRate(t);
  }
  onStop(t: () => void): void {
    if (this.cb)
      this.sk.on(Laya.Event.STOPPED, this, () => {
        if (t) t();
      });
  }
  fb(t: any): void {
    if (this.sk) this.sk.offAll(t);
  }
  recover(): void {
    if (this.cb) Zt.instance().gf(this.sk, this.skin);
    else this.img.destroy();
  }
}
