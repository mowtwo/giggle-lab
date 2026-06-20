// GameConfig — battle tuning constants.
//
// Faithful reconstruction of the original bundle's `g` class
// (reconstruction/reference/bundle.pretty.js lines ~451-465). Plain class held
// by the game hub (F.Gn). Opaque tuning tables kept verbatim (their consumers
// are battle code not yet ported).
//
//   si = gold reward table (4 x 6)   ii = 10   hi = thresholds [3,5,8,11,14,17]
//   ei = [5,2,1]   ai = [0.001 x4]   ni = [0.1,0.2,0.5,0.8]   ri = [0,0,0,5]

export class GameConfig {
  readonly si = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10],
    [20, 20, 20, 20, 20, 20],
  ];
  readonly ii = 10;
  readonly hi = [3, 5, 8, 11, 14, 17];
  readonly ei = [5, 2, 1];
  readonly ai = [0.001, 0.001, 0.001, 0.001];
  readonly ni = [0.1, 0.2, 0.5, 0.8];
  readonly ri = [0, 0, 0, 5];
}
