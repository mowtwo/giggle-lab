export type AdouSide = "player" | "ai";

export type AdouCardToken =
  | "刀"
  | "弓"
  | "枪"
  | "骑"
  | "铲"
  | "农"
  | "刘"
  | "赵"
  | "云"
  | "关"
  | "羽"
  | "平"
  | "兴"
  | "马"
  | "超"
  | "张"
  | "飞"
  | "苞"
  | "翼"
  | "黄"
  | "忠"
  | "盖"
  | "祖"
  | "备";

export type AdouCardKind = "soldier" | "tool" | "farmer" | "general-part";

export type AdouGeneralId =
  | "liu-bei"
  | "zhao-yun"
  | "guan-yu"
  | "guan-ping"
  | "guan-xing"
  | "ma-chao"
  | "zhang-fei"
  | "zhang-bao"
  | "zhang-yi"
  | "huang-zhong"
  | "huang-gai"
  | "huang-zu";

export type AdouWeaponClass = "blade" | "bow" | "pike" | "sword" | "cavalry";

export type AdouGeneralDefinition = {
  id: AdouGeneralId;
  name: string;
  parts: readonly [AdouCardToken, AdouCardToken];
  weaponClass: AdouWeaponClass;
  width: 2;
};

export type AdouCardInstance = {
  uid: number;
  token: AdouCardToken;
  kind: AdouCardKind;
  tier: number;
};

export type AdouCardPool = {
  remaining: Record<AdouCardToken, number>;
};

export const ADOU_COMBAT_TOKENS = ["刀", "弓", "枪", "骑"] as const;
export const ADOU_TOOL_TOKENS = ["铲"] as const;
export const ADOU_FARMER_TOKENS = ["农"] as const;

export const ADOU_GENERAL_DEFINITIONS: readonly AdouGeneralDefinition[] = [
  { id: "liu-bei", name: "刘备", parts: ["刘", "备"], weaponClass: "sword", width: 2 },
  { id: "zhao-yun", name: "赵云", parts: ["赵", "云"], weaponClass: "pike", width: 2 },
  { id: "guan-yu", name: "关羽", parts: ["关", "羽"], weaponClass: "blade", width: 2 },
  { id: "guan-ping", name: "关平", parts: ["关", "平"], weaponClass: "blade", width: 2 },
  { id: "guan-xing", name: "关兴", parts: ["关", "兴"], weaponClass: "blade", width: 2 },
  { id: "ma-chao", name: "马超", parts: ["马", "超"], weaponClass: "pike", width: 2 },
  { id: "zhang-fei", name: "张飞", parts: ["张", "飞"], weaponClass: "pike", width: 2 },
  { id: "zhang-bao", name: "张苞", parts: ["张", "苞"], weaponClass: "pike", width: 2 },
  { id: "zhang-yi", name: "张翼", parts: ["张", "翼"], weaponClass: "sword", width: 2 },
  { id: "huang-zhong", name: "黄忠", parts: ["黄", "忠"], weaponClass: "bow", width: 2 },
  { id: "huang-gai", name: "黄盖", parts: ["黄", "盖"], weaponClass: "sword", width: 2 },
  { id: "huang-zu", name: "黄祖", parts: ["黄", "祖"], weaponClass: "bow", width: 2 },
] as const;

export const ADOU_INITIAL_TOKEN_COUNTS: Record<AdouCardToken, number> = {
  刀: 21,
  弓: 19,
  枪: 18,
  骑: 17,
  铲: 11,
  农: 0,
  刘: 1,
  赵: 2,
  云: 1,
  关: 1,
  羽: 1,
  平: 1,
  兴: 1,
  马: 2,
  超: 1,
  张: 2,
  飞: 1,
  苞: 1,
  翼: 1,
  黄: 2,
  忠: 1,
  盖: 1,
  祖: 1,
  备: 1,
};

const COMBAT_TOKEN_SET = new Set<AdouCardToken>(ADOU_COMBAT_TOKENS);
const TOOL_TOKEN_SET = new Set<AdouCardToken>(ADOU_TOOL_TOKENS);
const FARMER_TOKEN_SET = new Set<AdouCardToken>(ADOU_FARMER_TOKENS);

export function createAdouCardPool(
  counts: Record<AdouCardToken, number> = ADOU_INITIAL_TOKEN_COUNTS,
): AdouCardPool {
  return { remaining: { ...counts } };
}

export function adouCardKind(token: AdouCardToken): AdouCardKind {
  if (COMBAT_TOKEN_SET.has(token)) return "soldier";
  if (TOOL_TOKEN_SET.has(token)) return "tool";
  if (FARMER_TOKEN_SET.has(token)) return "farmer";
  return "general-part";
}

export function adouPoolSize(pool: AdouCardPool) {
  return Object.values(pool.remaining).reduce((sum, count) => sum + count, 0);
}

export function returnAdouTokenToPool(pool: AdouCardPool, token: AdouCardToken) {
  pool.remaining[token] += 1;
}

export function consumeAdouToken(pool: AdouCardPool, token: AdouCardToken) {
  if (pool.remaining[token] <= 0) return false;
  pool.remaining[token] -= 1;
  return true;
}

export function drawAdouCard(
  pool: AdouCardPool,
  rng: () => number,
  nextUid: () => number,
): AdouCardInstance | null {
  const total = adouPoolSize(pool);
  if (total <= 0) return null;

  let roll = Math.floor(rng() * total);
  for (const token of Object.keys(pool.remaining) as AdouCardToken[]) {
    const count = pool.remaining[token];
    if (roll < count) {
      pool.remaining[token] -= 1;
      return {
        uid: nextUid(),
        token,
        kind: adouCardKind(token),
        tier: 1,
      };
    }
    roll -= count;
  }

  return null;
}

export function refreshAdouHand(
  pool: AdouCardPool,
  currentHand: readonly (AdouCardInstance | null)[],
  rng: () => number,
  nextUid: () => number,
  handSize = 5,
) {
  for (const card of currentHand) {
    if (card) returnAdouTokenToPool(pool, card.token);
  }

  return Array.from({ length: handSize }, () => drawAdouCard(pool, rng, nextUid));
}

export function findAdouGeneralByParts(
  a: AdouCardToken,
  b: AdouCardToken,
): AdouGeneralDefinition | null {
  return (
    ADOU_GENERAL_DEFINITIONS.find(
      (general) =>
        (general.parts[0] === a && general.parts[1] === b) ||
        (general.parts[0] === b && general.parts[1] === a),
    ) ?? null
  );
}

export function findAdouGeneralById(id: AdouGeneralId) {
  return ADOU_GENERAL_DEFINITIONS.find((general) => general.id === id) ?? null;
}
