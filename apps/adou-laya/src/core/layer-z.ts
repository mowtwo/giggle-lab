// LayerZ — z-index / draw-order layer constants.
//
// Faithful reconstruction of the original bundle's `Y` class (aliased `X`),
// reconstruction/reference/bundle.pretty.js lines ~3396-3445. The layer NAMES
// were mangled away in the published bundle, so the original short keys are kept
// verbatim (callers reference them as e.g. `LayerZ.qr`, `LayerZ.nr`). The values
// are the meaningful part — they define stacking order. Known usages are noted.

export class LayerZ {
  static readonly rr = 0;
  static readonly lr = 10;
  static readonly cr = 20;
  static readonly ur = 100;
  static readonly pr = 150;
  static readonly yr = 200; // EffectMgr.startGame layer
  static readonly gr = 1000;
  static readonly dr = 1100;
  static readonly nr = 2000; // base entity layer (see helpers below)
  static readonly Lr = 3000;
  static readonly mr = 30000;
  static readonly wr = 31000;
  static readonly vr = 40000;
  static readonly kr = 40100;
  static readonly _r = 40200;
  static readonly Sr = 40300;
  static readonly Mr = 40400;
  static readonly Pr = 40500;
  static readonly Ar = 40600;
  static readonly Er = 40700;
  static readonly Br = 40800;
  static readonly Ir = 40900;
  static readonly Dr = 41000;
  static readonly Tr = 50000;
  static readonly Rr = 51000;
  static readonly Cr = 52000;
  static readonly Ur = 53000;
  static readonly Fr = 54000;
  static readonly Or = 55000;
  static readonly Yr = 56000;
  static readonly Xr = 57000;
  static readonly Gr = 57100;
  static readonly Hr = 58000;
  static readonly Wr = 58100;
  static readonly zr = 60000;
  static readonly jr = 60100;
  static readonly $r = 60200;
  static readonly Nr = 60300;
  static readonly qr = 60400; // tip container layer
  static readonly Vr = 99999;
  static readonly Qr = 70000;
  static readonly Zr = 100000;
  static readonly Kr = 100001;

  /** Entity z-index from a pixel-Y position bucketed by cell height. */
  static entityZIndexFromPixelY(pixelY: number, cellHeight: number): number {
    const row = Math.floor(pixelY / cellHeight);
    return this.nr + 2 * row;
  }

  /** Entity z-index from a grid row index. */
  static entityZIndexFromGridRow(row: number): number {
    return this.nr + 2 * row;
  }
}
