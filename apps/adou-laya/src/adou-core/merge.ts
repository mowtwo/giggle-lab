import {
  ADOU_COMBAT_TOKENS,
  type AdouCardInstance,
  type AdouCardToken,
  type AdouGeneralDefinition,
  type AdouGeneralId,
  type AdouWeaponClass,
  findAdouGeneralById,
  findAdouGeneralByParts,
} from "./cards";

export type AdouCombatToken = (typeof ADOU_COMBAT_TOKENS)[number];

export type AdouPlacedUnit =
  | {
      uid: number;
      kind: "soldier";
      token: AdouCombatToken;
      name: string;
      tier: number;
      width: 1;
      weaponClass: AdouWeaponClass;
    }
  | {
      uid: number;
      kind: "farmer";
      token: "农";
      name: "农";
      tier: number;
      width: 1;
    }
  | {
      uid: number;
      kind: "civilian";
      token: AdouCardToken;
      name: string;
      tier: number;
      width: 1;
    }
  | {
      uid: number;
      kind: "general";
      generalId: AdouGeneralId;
      name: string;
      parts: readonly [AdouCardToken, AdouCardToken];
      tier: number;
      width: 2;
      weaponClass: AdouWeaponClass;
    };

export type AdouMergeResult =
  | {
      ok: true;
      action: "compose-general";
      unit: AdouPlacedUnit;
      consumedCardUids: readonly [number, number];
    }
  | {
      ok: true;
      action: "merge-soldier";
      unit: AdouPlacedUnit;
      consumedCardUids: readonly [number, number];
    }
  | {
      ok: true;
      action: "merge-farmer";
      unit: AdouPlacedUnit;
      consumedCardUids: readonly [number, number];
    }
  | {
      ok: true;
      action: "upgrade-unit";
      unit: AdouPlacedUnit;
      consumedCardUids: readonly [number];
    }
  | {
      ok: false;
      reason:
        | "same-general-part"
        | "farmer-cannot-merge"
        | "not-general-pair"
        | "not-same-soldier"
        | "wrong-upgrade-token"
        | "tool-cannot-merge";
      message: string;
    };

const SOLDIER_WEAPON_CLASS: Record<AdouCombatToken, AdouWeaponClass> = {
  刀: "blade",
  弓: "bow",
  枪: "pike",
  骑: "cavalry",
};

function isCombatToken(token: AdouCardToken): token is AdouCombatToken {
  return (ADOU_COMBAT_TOKENS as readonly AdouCardToken[]).includes(token);
}

function createGeneralUnit(
  general: AdouGeneralDefinition,
  tier: number,
  uid: number,
): AdouPlacedUnit {
  return {
    uid,
    kind: "general",
    generalId: general.id,
    name: general.name,
    parts: general.parts,
    tier,
    width: 2,
    weaponClass: general.weaponClass,
  };
}

function createSoldierUnit(
  token: AdouCombatToken,
  tier: number,
  uid: number,
): AdouPlacedUnit {
  return {
    uid,
    kind: "soldier",
    token,
    name: token,
    tier,
    width: 1,
    weaponClass: SOLDIER_WEAPON_CLASS[token],
  };
}

function createFarmerUnit(tier: number, uid: number): AdouPlacedUnit {
  return {
    uid,
    kind: "farmer",
    token: "农",
    name: "农",
    tier,
    width: 1,
  };
}

function createCivilianUnit(card: AdouCardInstance): AdouPlacedUnit {
  return {
    uid: card.uid,
    kind: "civilian",
    token: card.token,
    name: card.token,
    tier: card.tier,
    width: 1,
  };
}

export function createAdouPlacedUnitFromCard(card: AdouCardInstance): AdouPlacedUnit | null {
  if (card.kind === "tool") return null;
  if (card.kind === "farmer") return createFarmerUnit(card.tier, card.uid);
  if (card.kind === "soldier" && isCombatToken(card.token)) {
    return createSoldierUnit(card.token, card.tier, card.uid);
  }
  return createCivilianUnit(card);
}

export function composeAdouCards(
  first: AdouCardInstance,
  second: AdouCardInstance,
  nextUid: () => number,
): AdouMergeResult {
  if (first.kind === "tool" || second.kind === "tool") {
    return {
      ok: false,
      reason: "tool-cannot-merge",
      message: "工具牌不能直接合成单位",
    };
  }

  if (first.kind === "farmer" || second.kind === "farmer") {
    if (first.kind === "farmer" && second.kind === "farmer") {
      return {
        ok: true,
        action: "merge-farmer",
        unit: createFarmerUnit(Math.max(first.tier, second.tier) + 1, nextUid()),
        consumedCardUids: [first.uid, second.uid],
      };
    }

    return {
      ok: false,
      reason: "farmer-cannot-merge",
      message: "农民只能与农民合并",
    };
  }

  if (first.kind === "soldier" || second.kind === "soldier") {
    if (first.token !== second.token || !isCombatToken(first.token) || !isCombatToken(second.token)) {
      return {
        ok: false,
        reason: "not-same-soldier",
        message: "基础兵种只能与相同文字合并",
      };
    }

    return {
      ok: true,
      action: "merge-soldier",
      unit: createSoldierUnit(first.token, Math.max(first.tier, second.tier) + 1, nextUid()),
      consumedCardUids: [first.uid, second.uid],
    };
  }

  if (first.token === second.token) {
    return {
      ok: false,
      reason: "same-general-part",
      message: "武将散卡不能彼此合并",
    };
  }

  const general = findAdouGeneralByParts(first.token, second.token);
  if (!general) {
    return {
      ok: false,
      reason: "not-general-pair",
      message: "这两个字不能组成武将",
    };
  }

  return {
    ok: true,
    action: "compose-general",
    unit: createGeneralUnit(general, Math.max(first.tier, second.tier), nextUid()),
    consumedCardUids: [first.uid, second.uid],
  };
}

export function upgradeAdouUnitWithCard(
  unit: AdouPlacedUnit,
  card: AdouCardInstance,
): AdouMergeResult {
  if (unit.kind === "farmer") {
    if (card.token !== "农") {
      return {
        ok: false,
        reason: "wrong-upgrade-token",
        message: "农民只能吸收农民牌",
      };
    }

    return {
      ok: true,
      action: "upgrade-unit",
      unit: {
        ...unit,
        tier: Math.max(unit.tier, card.tier) + 1,
      },
      consumedCardUids: [card.uid],
    };
  }

  if (unit.kind === "civilian") {
    if (card.token !== unit.token) {
      return {
        ok: false,
        reason: "wrong-upgrade-token",
        message: "散字单位只能吸收相同文字",
      };
    }

    return {
      ok: true,
      action: "upgrade-unit",
      unit: {
        ...unit,
        tier: Math.max(unit.tier, card.tier) + 1,
      },
      consumedCardUids: [card.uid],
    };
  }

  if (unit.kind === "soldier") {
    if (card.token !== unit.token || !isCombatToken(card.token)) {
      return {
        ok: false,
        reason: "wrong-upgrade-token",
        message: "基础兵种只能吸收相同文字",
      };
    }

    return {
      ok: true,
      action: "upgrade-unit",
      unit: {
        ...unit,
        tier: Math.max(unit.tier, card.tier) + 1,
      },
      consumedCardUids: [card.uid],
    };
  }

  if (!unit.parts.includes(card.token)) {
    return {
      ok: false,
      reason: "wrong-upgrade-token",
      message: "武将只能吸收自己名字里的散字",
    };
  }

  return {
    ok: true,
    action: "upgrade-unit",
    unit: {
      ...unit,
      tier: Math.max(unit.tier, card.tier) + 1,
    },
    consumedCardUids: [card.uid],
  };
}

export function splitAdouGeneralUnit(
  unit: AdouPlacedUnit,
  nextUid: () => number,
): readonly [AdouCardInstance, AdouCardInstance] | null {
  if (unit.kind !== "general") return null;
  const general = findAdouGeneralById(unit.generalId);
  if (!general) return null;

  return [
    {
      uid: nextUid(),
      token: general.parts[0],
      kind: "general-part",
      tier: unit.tier,
    },
    {
      uid: nextUid(),
      token: general.parts[1],
      kind: "general-part",
      tier: unit.tier,
    },
  ];
}
