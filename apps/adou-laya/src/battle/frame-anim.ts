// FrameAnimData — soldier sequence-frame animation registry.
//
// Faithful reconstruction of the original bundle's frame-anim helpers
// (reconstruction/reference/bundle.pretty.js lines ~8484-8615): registers the
// four soldier types (knife/bow/pike/cavalry) with their idle/attack frame
// counts and builds the per-frame image URLs. The images live under
// resources/img/gameObject/soldier/anim/soldier_<type>/ and are resolved by Laya
// from img/gameObject/AutoAtlas.atlas at load time.
//
// frame URL: `<basePath>/<filePrefix>-<animName>_<paddedFrame>.png`
// Original names: padFrame=Dt registeredIds=Tt registry=Rt buildFrameUrls=Ct
//   soldierBasePath=Ut ANIM_IDLE=Ft ANIM_ATTACK=Ot framePadDigits=Yt
//   makeAnims=Xt registerFrameAnim=Gt hasFrameAnim=Ht getFrameAnim=Wt
//   frameAnimUrls=zt

/* eslint-disable @typescript-eslint/no-explicit-any */

export const ANIM_IDLE = "zhan";
export const ANIM_ATTACK = "attack";

interface AnimDef {
  frameCount: number;
  durationMs: number;
  loop?: boolean;
}
interface FrameAnimConfig {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  frameUrl: (animName: string, frame: number) => string;
  anims: Record<string, AnimDef>;
}
interface FrameAnimEntry {
  config: FrameAnimConfig;
  frameUrls: Record<string, string[]>;
}

// Pad digits per animation (idle frames unpadded, attack frames padded to 2).
const framePadDigits: Record<string, number> = { [ANIM_IDLE]: 0, [ANIM_ATTACK]: 2 };

const registeredIds = new Set<string>();
const registry: Record<string, FrameAnimEntry> = {};

/** Zero-pad `n` to `width` digits. (`Dt`) */
export function padFrame(n: number, width: number): string {
  let s = String(n);
  if (width <= 0) return s;
  while (s.length < width) s = "0" + s;
  return s;
}

/** Build {animName: [url,...]} for every animation in the config. (`Ct`) */
function buildFrameUrls(config: FrameAnimConfig): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const name of Object.keys(config.anims)) {
    const def = config.anims[name];
    const urls: string[] = [];
    for (let f = 0; f < def.frameCount; f++) urls[f] = config.frameUrl(name, f);
    out[name] = urls;
  }
  return out;
}

/** Base path for a soldier type's frames. (`Ut`) */
function soldierBasePath(type: number | string): string {
  return `resources/img/gameObject/soldier/anim/soldier_${type}`;
}

/** Compose an {idle, attack} animation set. (`Xt`) */
export function makeAnims(idle: AnimDef, attack: AnimDef): Record<string, AnimDef> {
  return { [ANIM_IDLE]: idle, [ANIM_ATTACK]: attack };
}

/** Register a soldier frame animation. (`Gt`) */
export function registerFrameAnim(
  name: string,
  type: number,
  width: number,
  height: number,
  anims: Record<string, AnimDef>,
  offsetX = 0,
  offsetY = 0,
): void {
  const basePath = soldierBasePath(type).replace(/\/$/, "");
  const filePrefix = "skeleton";
  const config: FrameAnimConfig = {
    width,
    height,
    offsetX,
    offsetY,
    frameUrl: (animName: string, frame: number) => {
      const pad = framePadDigits[animName] ?? 2;
      return `${basePath}/${filePrefix}-${animName}_${padFrame(frame, pad)}.png`;
    },
    anims,
  };
  registry[name] = { config, frameUrls: buildFrameUrls(config) };
  registeredIds.add(name);
}

/** (`Ht`) */
export function hasFrameAnim(id: string): boolean {
  return registeredIds.has(String(id));
}

/** (`Wt`) */
export function getFrameAnim(id: string): FrameAnimEntry {
  const entry = registry[String(id)];
  if (!entry) throw new Error(`FrameAnimData: 未注册序列帧 ${id}`);
  return entry;
}

/** All distinct frame image URLs for a registered anim. (`zt`) */
export function frameAnimUrls(id: string): string[] {
  const entry = getFrameAnim(id);
  const urls = new Set<string>();
  for (const name of Object.keys(entry.frameUrls)) {
    const list = entry.frameUrls[name];
    for (let i = 0; i < list.length; i++) urls.add(list[i]);
  }
  return Array.from(urls);
}

/** All registered frame-anim ids (for preloading). */
export function allFrameAnimIds(): string[] {
  return Array.from(registeredIds);
}

// --- Soldier registrations (knife/bow/pike/cavalry), verbatim from the bundle.
registerFrameAnim("knife", 0, 80, 114, makeAnims({ frameCount: 7, durationMs: 667, loop: true }, { frameCount: 19, durationMs: 600 }), -33, -30);
registerFrameAnim("bow", 1, 74, 95, makeAnims({ frameCount: 7, durationMs: 667, loop: true }, { frameCount: 30, durationMs: 1000 }), 5, 13);
registerFrameAnim("pike", 2, 41, 68, makeAnims({ frameCount: 8, durationMs: 667, loop: true }, { frameCount: 21, durationMs: 667 }), 30, 5);
registerFrameAnim("cavalry", 3, 263, 294, makeAnims({ frameCount: 6, durationMs: 600, loop: true }, { frameCount: 19, durationMs: 600 }), -95, -108);
