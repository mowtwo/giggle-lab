// EffectRelation — status-effect compatibility/conflict tables.
//
// Faithful reconstruction of the original bundle's `w` class
// (reconstruction/reference/bundle.pretty.js lines ~606-625). Plain class held
// by the game hub (F.Wn). The relation maps are keyed by AttrType index and are
// kept verbatim (th/sh/ih) since they encode combat-effect interactions.

export class EffectRelation {
  id = 0;
  // th / sh: paired effect relations; ih: effect -> affected attribute indices.
  readonly th = new Map<number, number[]>([[12, [15]]]);
  readonly sh = new Map<number, number[]>([[15, [12]]]);
  readonly ih = new Map<number, number[]>([
    [8, [1, 0]],
    [11, [1, 0]],
    [12, [5]],
    [13, [1, 0, 2]],
    [14, [4]],
    [16, [1, 2]],
    [9, [0]],
    [10, [0]],
    [17, [1]],
    [18, [3]],
    [19, [2, 3]],
    [15, [6]],
  ]);
}
