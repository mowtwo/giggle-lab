// SpineSprite — a Sprite backed by a Laya Spine2DRenderNode.
//
// Faithful reconstruction of the bundle's `Bt`/`It` class
// (reconstruction/reference/bundle.pretty.js lines ~8433-8482). Wraps a spine
// skeleton with play/stop/rate/skin controls and a cached bounds map.
//
//   baseRate=Zy

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */

export class SpineSprite extends Laya.Sprite {
  static boundsMap = new Map<string, any>();

  private baseRate = 1;
  spine: any;

  constructor(source: string) {
    super();
    this.spine = this.addComponent(Laya.Spine2DRenderNode);
    this.spine.source = source;
    const bounds = this.getSpineBounds();
    this.size(bounds.width, bounds.height);
  }

  getSpineBounds(): any {
    let bounds = SpineSprite.boundsMap.get(this.spine.source);
    if (!bounds) {
      bounds = this.getBounds();
      SpineSprite.boundsMap.set(this.spine.source, bounds);
    }
    return bounds;
  }

  play(name: any, loop?: any, force?: any, start?: any, end?: any, freshStart?: any, _g?: any): void {
    this.spine.play(name, loop, force, start, end, freshStart);
  }
  stop(): void {
    this.spine.stop();
  }
  setInitPlaybackRate(r: number): void {
    this.baseRate = r;
  }
  offset(x: number, y: number): void {
    this.spine.offset = new Laya.Vector2(x, y);
  }
  setIsFastMode(fast: boolean): void {
    if (fast) this.spine.changeFast();
    else this.spine.changeNormal();
  }
  setAutoAdjust(v: boolean): void {
    this.spine.autoAdjust = v;
  }
  playbackRate(r: number): void {
    this.spine.playbackRate(this.baseRate * r);
  }
  showSkinByName(name: string): void {
    this.spine.showSkinByName(name);
  }
  // (on/off/offAll inherited from Laya.Sprite unchanged — the bundle's explicit
  // pass-through overrides added no behaviour.)
}
