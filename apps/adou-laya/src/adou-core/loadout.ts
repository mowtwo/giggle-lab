import {
  ADOU_GENERAL_DEFINITIONS,
  findAdouGeneralById,
  type AdouGeneralId,
} from "./cards";
import {
  ADOU_DEFAULT_ACTIVE_SKILLS,
  ADOU_DEFAULT_PASSIVE_SKILLS,
  getAdouSkill,
  type AdouSkillId,
} from "./skills";
import {
  ADOU_DEFAULT_GENERAL_WEAPONS,
  getAdouWeapon,
  isAdouWeaponCompatibleWithGeneral,
} from "./weapons";

export type AdouLoadout = {
  activeSkills?: readonly AdouSkillId[];
  passiveSkills?: readonly AdouSkillId[];
  weaponAssignments?: Partial<Record<AdouGeneralId, number>>;
};

export type AdouStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const ADOU_LOADOUT_STORAGE_KEY = "adou-duel:loadout:v1";
export const ADOU_ACTIVE_SKILL_SLOTS = 2;
export const ADOU_PASSIVE_SKILL_SLOTS = 5;

function isAdouSkillId(value: unknown): value is AdouSkillId {
  return typeof value === "string" && !!getAdouSkill(value as AdouSkillId);
}

function normalizeAdouSkillList(
  source: unknown,
  fallback: readonly AdouSkillId[],
  kind: "active" | "passive",
  size: number,
) {
  const values = Array.isArray(source) ? source : [];
  const picked: AdouSkillId[] = [];
  for (const value of [...values, ...fallback]) {
    if (!isAdouSkillId(value) || picked.includes(value)) continue;
    const skillDef = getAdouSkill(value);
    if (!skillDef || skillDef.kind !== kind) continue;
    picked.push(value);
    if (picked.length >= size) break;
  }
  return picked;
}

export function getDefaultAdouWeaponAssignments(): Partial<Record<AdouGeneralId, number>> {
  return Object.fromEntries(
    ADOU_GENERAL_DEFINITIONS.map((general) => [
      general.id,
      ADOU_DEFAULT_GENERAL_WEAPONS[general.name],
    ]),
  ) as Partial<Record<AdouGeneralId, number>>;
}

function normalizeAdouWeaponAssignments(source: unknown) {
  const assignments = getDefaultAdouWeaponAssignments();
  if (!source || typeof source !== "object") return assignments;

  for (const [generalId, weaponId] of Object.entries(source)) {
    const general = findAdouGeneralById(generalId as AdouGeneralId);
    const weapon = typeof weaponId === "number" ? getAdouWeapon(weaponId) : null;
    if (!general || !weapon || !isAdouWeaponCompatibleWithGeneral(general, weapon)) continue;
    assignments[general.id] = weapon.id;
  }

  return assignments;
}

export function normalizeAdouLoadout(input: unknown): Required<AdouLoadout> {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    activeSkills: normalizeAdouSkillList(
      raw.activeSkills,
      ADOU_DEFAULT_ACTIVE_SKILLS,
      "active",
      ADOU_ACTIVE_SKILL_SLOTS,
    ),
    passiveSkills: normalizeAdouSkillList(
      raw.passiveSkills,
      ADOU_DEFAULT_PASSIVE_SKILLS,
      "passive",
      ADOU_PASSIVE_SKILL_SLOTS,
    ),
    weaponAssignments: normalizeAdouWeaponAssignments(raw.weaponAssignments),
  };
}

export function readAdouLoadout(storage: AdouStorageLike | null | undefined) {
  if (!storage) return normalizeAdouLoadout(null);
  try {
    const value = storage.getItem(ADOU_LOADOUT_STORAGE_KEY);
    return normalizeAdouLoadout(value ? JSON.parse(value) : null);
  } catch {
    return normalizeAdouLoadout(null);
  }
}

export function writeAdouLoadout(
  storage: AdouStorageLike | null | undefined,
  loadout: AdouLoadout,
) {
  if (!storage) return normalizeAdouLoadout(loadout);
  const normalized = normalizeAdouLoadout(loadout);
  storage.setItem(ADOU_LOADOUT_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearAdouLoadout(storage: AdouStorageLike | null | undefined) {
  storage?.removeItem(ADOU_LOADOUT_STORAGE_KEY);
}
