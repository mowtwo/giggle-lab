// FrameAnimSprite — frame-by-frame animated sprite (the bundle's `Vt`/`Qt`).
//
// Faithful reconstruction of `Vt` (reconstruction/reference/bundle.pretty.js
// lines ~8617-8804). Plays sequence-frame animations registered in the
// frame-anim registry (knife/bow/pike/cavalry soldiers), with optional skin
// override, segment playback, looping, playback rate, and auto-adjust scaling.
// A single shared frame loop ticks all active sprites.
//
//   skinName=Ky currentAnim=Jy initRate=Zy rate=sf startMs=if elapsed=hf
//   stoppedEmitted=ef startFrame=nf endFrame=rf frameSpan=lf durationSpan=af
//   loadingUrl=cf

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getFrameAnim, padFrame } from "./frame-anim";

// Shared tick loop over all playing sprites (`jt`/`$t`/`Nt`/`qt`).
const activeSprites: FrameAnimSprite[] = [];
let looping = false;

function removeActive(sprite: FrameAnimSprite): void {
  const i = activeSprites.indexOf(sprite);
  if (i < 0) return;
  activeSprites.splice(i, 1);
  if (activeSprites.length === 0 && looping) {
    Laya.timer.clear(null, tickAll);
    looping = false;
  }
}

function tickAll(): void {
  const delta = Laya.timer.delta;
  for (let s = activeSprites.length - 1; s >= 0; s--) activeSprites[s].tickAnim(delta);
}

export class FrameAnimSprite extends Laya.Sprite {
  static boundsMap = new Map<string, any>();

  private skinName = "";
  private currentAnim = "";
  private playing = false;
  loop = true;
  private initRate = 1;
  private rate = 1;
  private startMs = 0;
  private segmentEndMs = -1;
  private elapsed = 0;
  private frameIndex = -1;
  private stoppedEmitted = false;
  private autoAdjust = false;
  private activeClip: any = null;
  private durationSpan = 1;
  private startFrame = 0;
  private endFrame = 0;
  private frameSpan = 1;
  private loadingUrl = "";
  private animId: string;
  private unitCfg: any;
  private frameUrlsByAnim: any;
  private frameImg: any;

  constructor(animId: string | number) {
    super();
    this.animId = String(animId);
    const entry = getFrameAnim(this.animId);
    this.unitCfg = entry.config;
    this.frameUrlsByAnim = entry.frameUrls;
    this.size(80, 80);
    this.frameImg = new Laya.Image();
    this.frameImg.anchorX = 0.5;
    this.frameImg.anchorY = 0.5;
    this.applyFramePos();
    this.addChild(this.frameImg);
  }

  private applyFramePos(): void {
    this.frameImg.pos(this.unitCfg.offsetX ?? 0, this.unitCfg.offsetY ?? 0);
  }

  getSpineBounds(): any {
    let bounds = FrameAnimSprite.boundsMap.get(this.animId);
    if (!bounds) {
      bounds = new Laya.Rectangle(0, 0, 80, 80);
      FrameAnimSprite.boundsMap.set(this.animId, bounds);
    }
    return bounds;
  }

  play(name: any, loop: boolean, force?: any, startMs?: number, endMs?: number, _n?: any, _r?: any): void {
    const anim = String(name);
    const clip = this.unitCfg.anims[anim];
    if (!clip) {
      console.warn(`FrameSkeleton[${this.animId}]: 未知动作 ${anim}`);
      return;
    }
    if (this.currentAnim === anim && this.playing && !force) return;
    this.currentAnim = anim;
    this.activeClip = clip;
    this.loop = loop;
    this.startMs = startMs != null ? startMs : 0;
    this.segmentEndMs = endMs != null ? endMs : clip.durationMs;
    const end = this.segmentEndMs >= 0 ? this.segmentEndMs : clip.durationMs;
    this.durationSpan = Math.max(1, end - this.startMs);
    this.startFrame = FrameAnimSprite.msToFrameIndex(clip, this.startMs);
    this.endFrame = FrameAnimSprite.msToFrameIndex(clip, this.segmentEndMs);
    this.frameSpan = Math.max(1, this.endFrame - this.startFrame + 1);
    this.elapsed = 0;
    this.stoppedEmitted = false;
    this.playing = true;
    this.setFrame(this.startFrame);
    if (activeSprites.indexOf(this) < 0) {
      activeSprites.push(this);
      if (!looping) {
        looping = true;
        Laya.timer.frameLoop(1, null, tickAll);
      }
    }
  }

  stop(): void {
    if (this.playing) {
      this.playing = false;
      removeActive(this);
    }
  }

  setInitPlaybackRate(r: number): void {
    this.initRate = r;
  }
  offset(x: number, y: number): void {
    this.frameImg.pos(x, y);
  }
  setIsFastMode(_v: boolean): void {}
  setAutoAdjust(v: boolean): void {
    this.autoAdjust = v;
    this.applyAutoAdjust();
  }
  playbackRate(r: number): void {
    this.rate = r;
  }
  showSkinByName(name: string): void {
    if (this.unitCfg.skins) {
      this.skinName = name ? `skins/${name}` : "";
      if (this.currentAnim) this.setFrame(this.frameIndex >= 0 ? this.frameIndex : 0);
    }
  }

  resetForPool(): void {
    this.stop();
    this.offAll();
    this.skinName = "";
    this.currentAnim = "";
    this.activeClip = null;
    this.initRate = 1;
    this.rate = 1;
    this.startMs = 0;
    this.segmentEndMs = -1;
    this.loadingUrl = "";
    this.applyFramePos();
    this.rotation = 0;
    this.scale(1, 1);
    this.visible = true;
    this.frameImg.scale(1, 1);
    this.frameImg.texture = null;
    this.frameIndex = -1;
  }

  tickAnim(delta: number): void {
    if (!this.playing || !this.activeClip || !this.visible) return;
    const rate = this.initRate * this.rate;
    this.elapsed += delta * rate;
    const progress = this.elapsed / this.durationSpan;
    const frame = this.startFrame + Math.min(Math.floor(progress * this.frameSpan), this.frameSpan - 1);
    if (frame !== this.frameIndex) this.setFrame(frame);
    if (!(progress < 1)) {
      if (this.loop) {
        this.elapsed = 0;
        this.setFrame(this.startFrame);
        return;
      }
      this.playing = false;
      removeActive(this);
      if (!this.stoppedEmitted) {
        this.stoppedEmitted = true;
        this.event(Laya.Event.STOPPED);
      }
    }
  }

  static msToFrameIndex(clip: any, ms: number): number {
    const t = Math.max(0, Math.min(ms, clip.durationMs));
    const ratio = clip.durationMs > 0 ? t / clip.durationMs : 0;
    const idx = Math.floor(ratio * clip.frameCount);
    return Math.max(0, Math.min(idx, clip.frameCount - 1));
  }

  private resolveFrameUrl(anim: string, frame: number): string {
    const url = this.frameUrlsByAnim[anim][frame];
    if (!this.skinName) return url;
    const marker = `/${anim}/`;
    const at = url.indexOf(marker);
    if (at < 0) return url;
    return `${url.substring(0, at)}/${this.skinName}/${anim}/${padFrame(frame, 2)}.png`;
  }

  private setFrame(frame: number): void {
    this.frameIndex = frame;
    const url = this.resolveFrameUrl(this.currentAnim, frame);
    const cached = Laya.loader.getRes(url);
    if (cached) {
      this.frameImg.texture = cached;
      this.applyAutoAdjust();
      return;
    }
    if (this.loadingUrl !== url) {
      this.loadingUrl = url;
      Laya.loader.load(
        url,
        Laya.Handler.create(this, (tex: any) => {
          this.loadingUrl = "";
          if (tex && !this.destroyed && this.frameIndex === frame && this.currentAnim !== "") {
            this.frameImg.texture = tex;
            this.applyAutoAdjust();
          }
        }),
      );
    }
  }

  private applyAutoAdjust(): void {
    if (!this.autoAdjust || !this.frameImg.texture) return;
    const w = this.frameImg.texture.width;
    const h = this.frameImg.texture.height;
    if (w <= 0 || h <= 0) return;
    const scale = Math.min(this.unitCfg.width / w, this.unitCfg.height / h);
    this.frameImg.scale(scale, scale);
  }

  destroy(destroyChild?: boolean): void {
    removeActive(this);
    super.destroy(destroyChild);
  }
}
