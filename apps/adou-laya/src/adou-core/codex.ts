import {
  ADOU_GENERAL_DEFINITIONS,
  type AdouGeneralId,
  type AdouWeaponClass,
} from "./cards";
import {
  ADOU_SKILL_DEFS,
  type AdouSkillDefinition,
  type AdouSkillKind,
} from "./skills";
import {
  ADOU_GENERAL_COMBAT_STATS,
  type AdouBaseUnitStats,
} from "./units";
import {
  ADOU_WEAPON_DEFS,
  ADOU_WEAPON_RARITY_COLORS,
  ADOU_WEAPON_RARITY_LABELS,
  ADOU_WEAPON_TYPE_LABELS,
  getDefaultAdouWeaponForGeneralName,
  isAdouWeaponCompatibleWithGeneral,
  type AdouWeaponDefinition,
} from "./weapons";

export type AdouCodexGeneralEntry = {
  entryKind: "general";
  id: AdouGeneralId;
  name: string;
  parts: readonly [string, string];
  weaponClass: AdouWeaponClass;
  weaponTypeLabel: string | null;
  width: 2;
  stats: AdouBaseUnitStats;
  defaultWeapon: AdouWeaponDefinition | null;
  compatibleWeaponIds: readonly number[];
  description: string;
};

export type AdouCodexWeaponEntry = AdouWeaponDefinition & {
  entryKind: "weapon";
  typeLabel: string;
  rarityLabel: string;
  rarityColor: string;
  compatibleGeneralIds: readonly AdouGeneralId[];
};

export type AdouCodexSkillEntry = AdouSkillDefinition & {
  entryKind: "skill";
  kindLabel: string;
  cooldownSeconds: number | null;
};

export type AdouCodex = {
  generals: readonly AdouCodexGeneralEntry[];
  weapons: readonly AdouCodexWeaponEntry[];
  skills: readonly AdouCodexSkillEntry[];
};

export const ADOU_SKILL_KIND_LABELS: Record<AdouSkillKind, string> = {
  active: "主动",
  passive: "被动",
  special: "特殊",
  instant: "即时",
};

function weaponTypeLabel(weaponClass: AdouWeaponClass) {
  if (weaponClass === "cavalry") return null;
  return ADOU_WEAPON_TYPE_LABELS[weaponClass];
}

export function getAdouGeneralCodex(): readonly AdouCodexGeneralEntry[] {
  return ADOU_GENERAL_DEFINITIONS.map((general) => {
    const stats = ADOU_GENERAL_COMBAT_STATS[general.id];
    return {
      entryKind: "general",
      id: general.id,
      name: general.name,
      parts: general.parts,
      weaponClass: general.weaponClass,
      weaponTypeLabel: weaponTypeLabel(general.weaponClass),
      width: general.width,
      stats,
      defaultWeapon: getDefaultAdouWeaponForGeneralName(general.name),
      compatibleWeaponIds: ADOU_WEAPON_DEFS
        .filter((weapon) => isAdouWeaponCompatibleWithGeneral(general, weapon))
        .map((weapon) => weapon.id),
      description: stats.description,
    };
  });
}

export function getAdouWeaponCodex(): readonly AdouCodexWeaponEntry[] {
  return ADOU_WEAPON_DEFS.map((weapon) => ({
    ...weapon,
    entryKind: "weapon",
    typeLabel: ADOU_WEAPON_TYPE_LABELS[weapon.type],
    rarityLabel: ADOU_WEAPON_RARITY_LABELS[weapon.rarity],
    rarityColor: ADOU_WEAPON_RARITY_COLORS[weapon.rarity],
    compatibleGeneralIds: ADOU_GENERAL_DEFINITIONS
      .filter((general) => isAdouWeaponCompatibleWithGeneral(general, weapon))
      .map((general) => general.id),
  }));
}

export function getAdouSkillCodex(): readonly AdouCodexSkillEntry[] {
  return ADOU_SKILL_DEFS.map((skill) => ({
    ...skill,
    entryKind: "skill",
    kindLabel: ADOU_SKILL_KIND_LABELS[skill.kind],
    cooldownSeconds: skill.cooldownMs < 0 ? null : skill.cooldownMs / 1000,
  }));
}

export function getAdouCodex(): AdouCodex {
  return {
    generals: getAdouGeneralCodex(),
    weapons: getAdouWeaponCodex(),
    skills: getAdouSkillCodex(),
  };
}
