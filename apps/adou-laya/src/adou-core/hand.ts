import {
  type AdouCardInstance,
  type AdouCardPool,
  type AdouCardToken,
  drawAdouCard,
  returnAdouTokenToPool,
} from "./cards";
import {
  composeAdouCards,
  splitAdouGeneralUnit,
  upgradeAdouUnitWithCard,
  type AdouPlacedUnit,
} from "./merge";

export type AdouHandCardItem = {
  uid: number;
  type: "card";
  card: AdouCardInstance;
};

export type AdouHandUnitItem = {
  uid: number;
  type: "unit";
  unit: AdouPlacedUnit;
};

export type AdouHandItem = AdouHandCardItem | AdouHandUnitItem;

export type AdouHandMergeResult =
  | {
      ok: true;
      action: "compose-unit" | "upgrade-unit" | "merge-units";
      item: AdouHandItem;
      consumedUids: readonly number[];
    }
  | {
      ok: false;
      reason: "empty-slot" | "same-slot" | "invalid-merge";
      message: string;
    };

export function createAdouHandCardItem(card: AdouCardInstance): AdouHandCardItem {
  return { uid: card.uid, type: "card", card };
}

export function createAdouHandUnitItem(unit: AdouPlacedUnit): AdouHandUnitItem {
  return { uid: unit.uid, type: "unit", unit };
}

export function drawAdouHandItem(
  pool: AdouCardPool,
  rng: () => number,
  nextUid: () => number,
) {
  const card = drawAdouCard(pool, rng, nextUid);
  return card ? createAdouHandCardItem(card) : null;
}

function returnAdouUnitToPool(pool: AdouCardPool, unit: AdouPlacedUnit) {
  if (unit.kind === "general") {
    returnAdouTokenToPool(pool, unit.parts[0]);
    returnAdouTokenToPool(pool, unit.parts[1]);
    return;
  }
  returnAdouTokenToPool(pool, unit.token as AdouCardToken);
}

export function returnAdouHandItemToPool(pool: AdouCardPool, item: AdouHandItem | null) {
  if (!item) return;
  if (item.type === "card") {
    returnAdouTokenToPool(pool, item.card.token);
    return;
  }
  returnAdouUnitToPool(pool, item.unit);
}

export function refreshAdouHandItems(
  pool: AdouCardPool,
  currentHand: readonly (AdouHandItem | null)[],
  rng: () => number,
  nextUid: () => number,
  handSize = 5,
) {
  for (const item of currentHand) returnAdouHandItemToPool(pool, item);
  return Array.from({ length: handSize }, () => drawAdouHandItem(pool, rng, nextUid));
}

function mergeAdouUnitWithUnit(
  source: AdouPlacedUnit,
  target: AdouPlacedUnit,
): AdouHandMergeResult {
  if (source.kind !== target.kind || source.name !== target.name) {
    return {
      ok: false,
      reason: "invalid-merge",
      message: "只有相同的已合成单位可以继续合并",
    };
  }

  const unit: AdouPlacedUnit = {
    ...target,
    tier: Math.max(source.tier, target.tier) + 1,
  };

  return {
    ok: true,
    action: "merge-units",
    item: createAdouHandUnitItem(unit),
    consumedUids: [source.uid, target.uid],
  };
}

export function mergeAdouHandItems(
  source: AdouHandItem | null,
  target: AdouHandItem | null,
  nextUid: () => number,
): AdouHandMergeResult {
  if (!source || !target) {
    return { ok: false, reason: "empty-slot", message: "待选区格子为空" };
  }
  if (source.uid === target.uid) {
    return { ok: false, reason: "same-slot", message: "不能和自己合并" };
  }

  if (source.type === "card" && target.type === "card") {
    const result = composeAdouCards(source.card, target.card, nextUid);
    if (result.ok === false) {
      return { ok: false, reason: "invalid-merge", message: result.message };
    }
    return {
      ok: true,
      action: "compose-unit",
      item: createAdouHandUnitItem(result.unit),
      consumedUids: [...result.consumedCardUids],
    };
  }

  if (source.type === "card" && target.type === "unit") {
    const result = upgradeAdouUnitWithCard(target.unit, source.card);
    if (result.ok === false) {
      return { ok: false, reason: "invalid-merge", message: result.message };
    }
    return {
      ok: true,
      action: "upgrade-unit",
      item: createAdouHandUnitItem(result.unit),
      consumedUids: [source.uid, target.uid],
    };
  }

  if (source.type === "unit" && target.type === "card") {
    const result = upgradeAdouUnitWithCard(source.unit, target.card);
    if (result.ok === false) {
      return { ok: false, reason: "invalid-merge", message: result.message };
    }
    return {
      ok: true,
      action: "upgrade-unit",
      item: createAdouHandUnitItem(result.unit),
      consumedUids: [source.uid, target.uid],
    };
  }

  if (source.type === "unit" && target.type === "unit") {
    return mergeAdouUnitWithUnit(source.unit, target.unit);
  }

  return { ok: false, reason: "invalid-merge", message: "无法合并这些待选项" };
}

export function mergeAdouHandSlots(
  hand: readonly (AdouHandItem | null)[],
  sourceIndex: number,
  targetIndex: number,
  nextUid: () => number,
) {
  if (sourceIndex === targetIndex) {
    return {
      ok: false,
      reason: "same-slot",
      message: "不能和自己合并",
    } as const;
  }

  const result = mergeAdouHandItems(hand[sourceIndex] ?? null, hand[targetIndex] ?? null, nextUid);
  if (!result.ok) return result;

  const nextHand = [...hand];
  nextHand[sourceIndex] = null;
  nextHand[targetIndex] = result.item;
  return { ...result, hand: nextHand };
}

export function splitAdouHandUnitItem(
  item: AdouHandItem,
  nextUid: () => number,
): readonly [AdouHandCardItem, AdouHandCardItem] | null {
  if (item.type !== "unit" || item.unit.kind !== "general") return null;
  const cards = splitAdouGeneralUnit(item.unit, nextUid);
  return cards ? [createAdouHandCardItem(cards[0]), createAdouHandCardItem(cards[1])] : null;
}
