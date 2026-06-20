// Engine bindings.
//
// The LayaAir runtime (libs/laya.*.js) is loaded as globals BEFORE this business
// bundle. We never import the engine — we reference the global `Laya`, exactly
// like the original game's esbuild output did (`const { regClass } = Laya`).
// `Laya` is an ambient global declared by engine/types/LayaAir.d.ts.
//
// `regClass` / `property` / `runtime` are the engine's own class-registration
// decorators. Reusing them is what lets our reconstructed TS classes bind to the
// ORIGINAL `scene/*.ls`, `dialog/*.lh` and `prefab/*.lh` resources by UUID, with
// the resources left completely unchanged.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const L = Laya as unknown as any;

export const regClass = L.regClass as (assetId?: string) => ClassDecorator;
export const property = L.property as (info: unknown) => PropertyDecorator;
export const runtime = L.runtime as (cls: unknown) => ClassDecorator;
