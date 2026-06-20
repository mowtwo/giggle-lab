// StaminaMgr — stamina config constants.
//
// Faithful reconstruction of the original bundle's `T` class
// (reconstruction/reference/bundle.pretty.js lines ~3097-3108). Plain class held
// by the game hub (F.stamina). Pure config; behaviour lives in callers.
//
// hn (30) = max stamina; en (300000ms) = recover interval. The remaining fields
// are kept verbatim — their exact roles live in stamina/ad/share callers not yet
// ported, so they are left un-renamed to avoid guessing (annotate when ported).

export class StaminaMgr {
  readonly hn = 30; // max stamina
  readonly en = 300000; // recover interval (ms)
  readonly an = 5;
  readonly nn = 10;
  readonly rn = 1;
  readonly ln = 5;
  readonly cn = 3;
  readonly un = 1800000;
}
