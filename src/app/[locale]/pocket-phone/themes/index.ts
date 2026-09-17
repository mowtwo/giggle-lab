import { animalIslandTheme } from "./animal-island";
import { harmonyosTheme } from "./harmonyos";
import { hyperosTheme } from "./hyperos";
import { iosTheme } from "./ios";
import type { PhoneTheme, ThemeId } from "./types";

/**
 * 主题注册表。新增一套系统只需要:
 *   1. 新建 themes/<id>.ts 导出一个 PhoneTheme 字面量;
 *   2. 在这里 import + 塞进数组;
 *   3. 在 types.ts 的 ThemeId 联合类型里加上 id;
 *   4. 在 messages/{zh,en}.json 的 PocketPhone.themes 下补一句风格说明。
 * 组件一律不动。
 */
export const PHONE_THEMES: PhoneTheme[] = [
  iosTheme,
  hyperosTheme,
  harmonyosTheme,
  animalIslandTheme,
];

export const DEFAULT_THEME_ID: ThemeId = "ios";

const THEME_BY_ID = new Map<ThemeId, PhoneTheme>(
  PHONE_THEMES.map((theme) => [theme.id, theme]),
);

export function getTheme(id: ThemeId): PhoneTheme {
  return THEME_BY_ID.get(id) ?? iosTheme;
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_BY_ID.has(value as ThemeId);
}

export * from "./tokens";
export * from "./types";
