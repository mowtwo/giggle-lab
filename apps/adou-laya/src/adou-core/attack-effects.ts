import type { AdouAttackPlan } from "./combat";
import type { AdouSoundKey } from "./assets";

export type AdouAttackVisualKind =
  | "melee-hit"
  | "slash"
  | "ink-arrow"
  | "pike-thrust"
  | "pike-array"
  | "cavalry-sweep"
  | "sword-qi"
  | "eagle"
  | "fire-dragon"
  | "fire-arrow-volley"
  | "snake"
  | "pear-flower"
  | "meteor";

export type AdouAttackVisualSpec = {
  sound: AdouSoundKey;
  cast?: {
    text?: string;
    atlasKey?: string;
  };
  projectile?: {
    kind: AdouAttackVisualKind;
    text?: string;
    atlasKey?: string;
    trailAtlasKey?: string;
  };
  impact: {
    kind: AdouAttackVisualKind;
    text?: string;
    atlasKey?: string;
  };
  special?: {
    kind: AdouAttackVisualKind;
    chance?: number;
    everyAttack?: number;
    atlasKey?: string;
    sound?: AdouSoundKey;
  };
};

const BOW_ARROW_ATLAS_BY_WEAPON_ID: Record<number, string> = {
  0: "resources/img/weapon/arrow_0.png",
  1: "resources/img/weapon/arrow_1.png",
  2: "resources/img/weapon/arrow_2.png",
  3: "resources/img/weapon/arrow_3.png",
  4: "resources/img/weapon/arrow_4.png",
  5: "resources/img/weapon/arrow_5.png",
  6: "resources/img/weapon/arrow_6.png",
  7: "resources/img/weapon/arrow_8.png",
  8: "resources/img/weapon/arrow_8.png",
  9: "resources/img/weapon/arrow_9.png",
};

const WEAPON_SPECIALS: Record<number, NonNullable<AdouAttackVisualSpec["special"]>> = {
  4: { kind: "eagle", chance: 0.1, atlasKey: "resources/img/weapon/bullet/eagleArrow_01.png" },
  5: { kind: "fire-dragon", chance: 0.1, atlasKey: "resources/img/weapon/bullet/dragonPartHead.png" },
  9: { kind: "fire-arrow-volley", everyAttack: 10, atlasKey: "resources/img/weapon/bullet/fireArrowEff_01.jpg" },
  12: { kind: "pike-array", chance: 0.2, atlasKey: "resources/img/weapon/maChaoPike.png" },
  16: { kind: "pear-flower", atlasKey: "resources/img/weapon/bullet/lihua.png" },
  18: { kind: "snake", atlasKey: "resources/img/weapon/bullet/lingShe_1.png" },
  19: { kind: "pike-array", chance: 0.1, atlasKey: "resources/img/weapon/maChaoPike.png" },
  28: { kind: "meteor", chance: 0.1, atlasKey: "resources/img/props/meteor_1.png" },
  37: { kind: "sword-qi", everyAttack: 10, atlasKey: "resources/img/weapon/bullet/newDQ.png", sound: "swords_clash" },
};

function soundForAdouAttack(plan: AdouAttackPlan): AdouSoundKey {
  const weapon = plan.stats.weapon;
  if (weapon?.id === 37) return "sword_attack";
  if (plan.stats.archetype === "bow" || weapon?.type === "bow") {
    return plan.unit.width === 2 || weapon ? "general_bow_attack" : "bow_attack";
  }
  if (plan.stats.archetype === "pike" || weapon?.type === "pike") return "general_pike_attack";
  if (plan.stats.archetype === "cavalry") return "cavalry_attack";
  if (plan.stats.archetype === "blade" || weapon?.type === "blade") return "knife_attack";
  if (weapon?.type === "sword" || plan.stats.archetype === "sword") return "sword_attack";
  return "knife_attack";
}

function bowProjectile(plan: AdouAttackPlan): AdouAttackVisualSpec["projectile"] {
  const weaponId = plan.stats.weapon?.id;
  return {
    kind: "ink-arrow",
    text: "弓",
    atlasKey:
      weaponId === undefined
        ? "resources/img/weapon/default_arrow_1.png"
        : BOW_ARROW_ATLAS_BY_WEAPON_ID[weaponId] ?? "resources/img/weapon/default_arrow_1.png",
    trailAtlasKey: "prefab/bulletTrail/arrowTrail.lh",
  };
}

export function getAdouAttackVisualSpec(
  plan: AdouAttackPlan,
  attackCount = 1,
): AdouAttackVisualSpec {
  const weapon = plan.stats.weapon;
  const special = weapon ? WEAPON_SPECIALS[weapon.id] : undefined;
  const sound = special?.everyAttack && attackCount % special.everyAttack === 0 && special.sound
    ? special.sound
    : soundForAdouAttack(plan);

  if (plan.stats.archetype === "bow" || weapon?.type === "bow") {
    return {
      sound,
      cast: { text: "弓" },
      projectile: bowProjectile(plan),
      impact: { kind: "melee-hit" },
      special,
    };
  }

  if (plan.stats.archetype === "pike" || weapon?.type === "pike") {
    return {
      sound,
      cast: { text: plan.unit.name },
      projectile: {
        kind: "pike-thrust",
        atlasKey: weapon?.atlasKey ?? "resources/img/weapon/default_1.png",
      },
      impact: { kind: "pike-thrust" },
      special,
    };
  }

  if (plan.stats.attackStyle === "area" || plan.stats.archetype === "cavalry") {
    return {
      sound,
      cast: { text: plan.unit.name },
      impact: {
        kind: plan.stats.archetype === "cavalry" ? "cavalry-sweep" : "slash",
        text: weapon?.displayText ?? plan.unit.name,
        atlasKey: weapon?.atlasKey,
      },
      special,
    };
  }

  if (weapon?.type === "sword") {
    return {
      sound,
      cast: { text: weapon.displayText },
      projectile: special?.kind === "sword-qi"
        ? { kind: "sword-qi", atlasKey: special.atlasKey, text: weapon.displayText }
        : undefined,
      impact: { kind: "sword-qi", text: weapon.displayText, atlasKey: weapon.atlasKey },
      special,
    };
  }

  return {
    sound,
    cast: { text: plan.unit.name },
    impact: {
      kind: weapon?.type === "blade" || plan.stats.archetype === "blade" ? "slash" : "melee-hit",
      text: weapon?.displayText ?? plan.unit.name,
      atlasKey: weapon?.atlasKey,
    },
    special,
  };
}
