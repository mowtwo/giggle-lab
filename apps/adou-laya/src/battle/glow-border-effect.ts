// GlowBorderEffect — an animated shader glow border applied to a sprite (the
// bundle's `_o`/`xo`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~36302-36417. `addEffect` lazily loads the `buttonShapeGlow` shader, builds a
// Material, binds it to the sprite's graphics, and drives `u_Time`/`u_GlowColor`
// each frame (one shared UpdateMgr callback while any effect is live). Used by the
// shop lottery items. Opaque field / method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { UpdateMgr } from "../core/update-mgr";

const j = UpdateMgr;

export class GlowBorderEffect {
  static yZ = "shader/buttonShapeGlow.shader";
  static fZ = "buttonShapeGlow";
  static pZ = false;
  static uZ = new Map<any, GlowBorderEffect>();

  private oZ = 0;
  isActive = false;
  speed = 1;
  borderWidth = 2;
  lZ = new Laya.Color(1, 0.8, 0.2, 1);
  cZ = 1.5;
  private sprite: any;
  private material: any;

  constructor(t: any) {
    this.sprite = t;
  }

  static async addEffect(s: any, i: any): Promise<GlowBorderEffect | null> {
    if (this.uZ.has(s)) this.removeEffect(s);
    if (!this.pZ)
      try {
        await Laya.loader.load(this.yZ);
        if (!Laya.Shader3D.find(this.fZ)) {
          console.error("Shader未找到，名称:", this.fZ);
          return null;
        }
        this.pZ = true;
      } catch (t) {
        console.error("Shader加载失败:", t);
        return null;
      }
    const h = new GlowBorderEffect(s);
    if (i) {
      if (i.speed !== undefined) h.speed = i.speed;
      if (i.borderWidth !== undefined) h.borderWidth = i.borderWidth;
      if (i.lZ !== undefined) h.lZ = i.lZ;
      if (i.cZ !== undefined) h.cZ = i.cZ;
    }
    h.material = new Laya.Material();
    h.material.setShaderName(this.fZ);
    h.gZ();
    if (s instanceof Laya.Image && !s.graphics && s.skin) {
      const tex = Laya.loader.getRes(s.skin);
      if (tex) {
        s.graphics.clear();
        s.graphics.drawTexture(tex, 0, 0, s.width || tex.width, s.height || tex.height);
      }
    }
    if (!s.graphics) {
      console.error("Sprite的graphics未初始化");
      return null;
    }
    s.graphics.material = h.material;
    s.repaint();
    h.isActive = true;
    this.uZ.set(s, h);
    if (this.uZ.size === 1) j.instance().register("GlowBorderEffect", GlowBorderEffect, GlowBorderEffect.dZ);
    return h;
  }

  static removeEffect(t: any): void {
    const s = this.uZ.get(t);
    if (s) {
      s.isActive = false;
      s.material = null;
      if (t && !t.destroyed && t.graphics) t.graphics.material = null;
      this.uZ.delete(t);
      if (this.uZ.size === 0) j.instance().unregister("GlowBorderEffect");
    }
  }

  static dZ(t: number): void {
    const s: any[] = [];
    GlowBorderEffect.uZ.forEach((i, h) => {
      if (h && !h.destroyed && h.graphics) {
        if (i.isActive) i.update(t);
      } else s.push(h);
    });
    s.forEach((x) => {
      GlowBorderEffect.removeEffect(x);
    });
  }

  update(t: number): void {
    if (this.isActive && this.material && this.sprite && !this.sprite.destroyed && this.sprite.graphics) {
      this.oZ += 0.001 * t;
      if (this.oZ > 1000) this.oZ = 0;
      this.gZ();
    }
  }

  gZ(): void {
    if (!this.material) return;
    const t = this.material.shaderData;
    const s = Laya.Shader3D.propertyNameToID("u_GlowColor");
    const i = Laya.Shader3D.propertyNameToID("u_Time");
    const h = new Laya.Vector4(this.lZ.r, this.lZ.g, this.lZ.b, this.lZ.a);
    t.setVector(s, h);
    t.setNumber(i, this.oZ);
  }

  LZ(t: number): void {
    this.speed = t;
    this.gZ();
  }
  mZ(t: number): void {
    this.borderWidth = t;
    this.gZ();
  }
  wZ(t: any): void {
    this.lZ = t;
    this.gZ();
  }
  vZ(t: number): void {
    this.cZ = t;
    this.gZ();
  }

  setActive(t: boolean): void {
    this.isActive = t;
    if (this.sprite && !this.sprite.destroyed && this.sprite.graphics)
      this.sprite.graphics.material = t ? this.material : null;
  }

  static kZ(): void {
    this.pZ = false;
  }
}

/** Alias. (`xo`/`_o`) */
export const xo = GlowBorderEffect;
