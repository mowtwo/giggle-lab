// AttrType — unit attribute / status-effect type enum.
//
// Faithful reconstruction of the original bundle's `m` enum
// (reconstruction/reference/bundle.pretty.js lines ~593-614). Indices are used
// across combat code and must not change.

export enum AttrType {
  attPower = 0,
  attSpeed = 1,
  attRange = 2,
  moveSpeed = 3,
  maxHp = 4,
  hp = 5,
  scale = 6,
  custom = 7,
  stun = 8,
  fall = 9,
  pierce = 10,
  electrocute = 11,
  knockback = 12,
  chaos = 13,
  burnStatic = 14,
  limit = 15,
  lock = 16,
  knockdown = 17,
  suppression = 18,
  charm = 19,
}

// `L` constants (special target indices): Ji = -1, round = -2.
export const SpecialIndex = { Ji: -1, round: -2 } as const;
