import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const cwd = process.cwd();
const outDir = join(tmpdir(), "adou-core-check");
const coreDir = "apps/adou-laya/src/adou-core";
const coreFiles = readdirSync(join(cwd, coreDir))
  .filter((file) => file.endsWith(".ts"))
  .map((file) => join(coreDir, file));

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

execFileSync(
  "pnpm",
  [
    "exec",
    "tsc",
    "--strict",
    "--strictNullChecks",
    "false",
    "--skipLibCheck",
    "--target",
    "es2019",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--outDir",
    outDir,
    ...coreFiles,
  ],
  { cwd, stdio: "inherit" },
);

const require = createRequire(import.meta.url);
const core = require(join(outDir, "index.js"));
const originalGameRoot = join(cwd, "apps/adou-laya/vendor/original/game");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertOriginalAsset(path) {
  assert(existsSync(join(originalGameRoot, path)), `missing original asset: ${path}`);
}

let uid = 1;
const huangZhongHand = [
  core.createAdouHandCardItem({ uid: uid++, token: "黄", kind: "general-part", tier: 3 }),
  core.createAdouHandCardItem({ uid: uid++, token: "忠", kind: "general-part", tier: 3 }),
];
const merged = core.mergeAdouHandSlots(huangZhongHand, 0, 1, () => uid++);
assert(merged.ok && merged.item.unit.name === "黄忠", "黄+忠 should compose 黄忠");
assert(merged.item.unit.width === 2, "composed generals should occupy two cells");
const split = core.splitAdouHandUnitItem(merged.hand[1], () => uid++);
assert(split?.[0].card.tier === 3 && split?.[1].card.tier === 3, "split parts should inherit tier");

const state = core.createAdouBattleState("changban");
core.startAdouBattle(state);
for (let index = 0; index < 40; index += 1) core.updateAdouBattleFlow(state, 1);
assert(state.enemies.length > 0, "battle flow should spawn enemies");
assert(state.round >= 2, "battle flow should advance past wave one");

const normalized = core.normalizeAdouLoadout({
  activeSkills: ["inkstone", "trap", "farmer"],
  passiveSkills: ["farmer", "recruit", "meteor", "goldSeeker", "promotionOrder", "trap"],
  weaponAssignments: { "huang-zhong": 29 },
});
assert(normalized.activeSkills.length === 2, "loadout should keep two active skills");
assert(normalized.passiveSkills.length === 5, "loadout should keep five passive skills");
assert(normalized.weaponAssignments["huang-zhong"] === 5, "invalid 黄忠 weapon should fall back");

assert(core.getAdouSoundPath("bow_attack").endsWith("bow_attack.mp3"), "sound registry should resolve attack sounds");
assert(core.ADOU_SPINE_ASSETS.adou.json === "resources/anim/aDou/skeleton.json", "asset registry should include 阿斗 spine");
for (const path of Object.values(core.ADOU_SOUND_ASSETS)) assertOriginalAsset(path);
for (const path of Object.values(core.ADOU_MUSIC_ASSETS)) assertOriginalAsset(path);
for (const path of Object.values(core.ADOU_PREFAB_ASSETS)) assertOriginalAsset(path);
for (const asset of Object.values(core.ADOU_SPINE_ASSETS)) {
  assertOriginalAsset(asset.json);
  assertOriginalAsset(asset.atlas);
  assertOriginalAsset(asset.image);
}
for (const asset of Object.values(core.ADOU_ATLAS_ASSETS)) {
  assertOriginalAsset(asset.atlas);
  assertOriginalAsset(asset.image);
}
for (const skill of core.ADOU_SKILL_DEFS) {
  const atlasMatch = core.findAdouAtlasForAsset(skill.iconAtlasKey);
  assert(atlasMatch?.atlas.id === "props", `${skill.id} icon should resolve to props atlas`);
}
const codex = core.getAdouCodex();
assert(codex.generals.length === core.ADOU_GENERAL_DEFINITIONS.length, "general codex should include every general");
assert(codex.weapons.length === core.ADOU_WEAPON_DEFS.length, "weapon codex should include every weapon");
assert(codex.skills.length === core.ADOU_SKILL_DEFS.length, "skill codex should include every skill");
const huangZhongCodex = codex.generals.find((entry) => entry.id === "huang-zhong");
assert(huangZhongCodex?.defaultWeapon?.id === 5, "黄忠 codex should use 铁胎弓 by default");
assert(huangZhongCodex.compatibleWeaponIds.every((weaponId) => core.getAdouWeapon(weaponId)?.type === "bow"), "黄忠 compatible weapons should be bows");
const weaponCodex = codex.weapons.find((entry) => entry.id === 5);
assert(weaponCodex?.typeLabel === "弓" && weaponCodex.rarityLabel === "史诗", "weapon codex should expose Chinese labels");
const skillCodex = codex.skills.find((entry) => entry.id === "attSpeedSpell");
assert(skillCodex?.kindLabel === "主动" && skillCodex.cooldownSeconds === 90, "skill codex should expose kind and cooldown");

const passiveState = core.createAdouBattleState("changban", () => 0.9, {
  passiveSkills: ["daBuPill", "xuMingPill", "superShovel", "farmer", "recruit"],
});
assert(passiveState.sides.player.maxHp === 11, "大补丸 and 续命丹 should increase player HP");
assert(passiveState.sides.ai.maxHp === 6, "续命丹 should also increase opponent HP");
core.startAdouBattle(passiveState, () => 0.9);
passiveState.sides.player.hand = [null, null, null, null, null];
passiveState.sides.player.superShovelTimer = 0;
const passiveEvents = core.tickAdouCore(passiveState, 0.1, () => 0.9);
assert(passiveEvents.some((event) => event.type === "hand-card-created"), "洛阳铲 should create shovel cards");
assert(passiveState.sides.player.hand[0]?.type === "card" && passiveState.sides.player.hand[0].card.token === "铲", "洛阳铲 should add 铲 to hand");

const aiState = core.createAdouBattleState("changban");
aiState.sides.ai.hand = [
  core.createAdouHandCardItem({ uid: 1, token: "黄", kind: "general-part", tier: 1 }),
  core.createAdouHandCardItem({ uid: 2, token: "忠", kind: "general-part", tier: 1 }),
  null,
  null,
  null,
];
assert(core.chooseAdouAiAction(aiState).type === "merge-hand", "AI should merge valid hand pairs first");
const aiEvents = core.executeAdouAiAction(aiState, () => 0.9);
assert(aiEvents.some((event) => event.type === "hand-merged"), "AI action executor should merge hand cards");
assert(aiState.sides.ai.hand[1]?.type === "unit" && aiState.sides.ai.hand[1].unit.name === "黄忠", "AI merge should create 黄忠");

const blockedAiState = core.createAdouBattleState("changban");
const firstAiTile = blockedAiState.tiles.find((tile) => tile.owner === "ai" && tile.kind === "plot");
assert(firstAiTile, "AI should have a build tile");
blockedAiState.tiles = blockedAiState.tiles.map((tile) =>
  tile.col === firstAiTile.col && tile.row === firstAiTile.row
    ? { ...tile, kind: "blocked" }
    : tile,
);
const blockedTarget = core.chooseAdouBuildTarget(blockedAiState, "ai");
assert(
  blockedTarget.type !== "cell" || blockedTarget.col !== firstAiTile.col || blockedTarget.row !== firstAiTile.row,
  "AI should not choose dynamically blocked tiles",
);

const autoAiState = core.createAdouBattleState("changban", () => 0.9, undefined, { aiDifficulty: 3 });
core.startAdouBattle(autoAiState, () => 0.9);
autoAiState.sides.ai.hand = [
  core.createAdouHandCardItem({ uid: 401, token: "黄", kind: "general-part", tier: 1 }),
  core.createAdouHandCardItem({ uid: 402, token: "忠", kind: "general-part", tier: 1 }),
  null,
  null,
  null,
];
let automaticAiEvents = core.tickAdouCore(autoAiState, 0.5, () => 0.9);
assert(
  automaticAiEvents.some((event) => event.type === "ai-action" || event.type === "hand-merged"),
  "core tick should drive scheduled AI actions",
);
assert(autoAiState.sides.ai.hand[1]?.type === "unit", "scheduled AI should execute chosen action");

autoAiState.round = 3;
const mantouBeforeBonus = autoAiState.sides.ai.mantou;
automaticAiEvents = core.tickAdouCore(autoAiState, 0.1, () => 0.9);
assert(autoAiState.sides.ai.mantou > mantouBeforeBonus, "high difficulty AI should receive round bonuses");
assert(automaticAiEvents.some((event) => event.type === "mantou" && event.side === "ai"), "AI bonus should emit mantou event");

const unit = {
  uid: 99,
  kind: "soldier",
  token: "弓",
  name: "弓",
  tier: 1,
  width: 1,
  weaponClass: "bow",
  side: "player",
  col: 1,
  row: 7,
};
const skillState = core.createAdouBattleState("changban");
skillState.units = [unit];
const skillPlan = core.planAdouSkillUse(skillState, "player", "attSpeedSpell", {
  type: "cell",
  col: 1,
  row: 7,
});
assert(skillPlan.ok && skillPlan.intents[0].type === "speed-up-unit", "攻速符 should target one unit");

const reducerState = core.createAdouBattleState("changban");
core.startAdouBattle(reducerState);
const buildTile = reducerState.tiles.find((tile) => tile.owner === "player" && tile.kind === "plot");
assert(buildTile, "player should have a build tile");
reducerState.sides.player.hand = [
  core.createAdouHandCardItem({ uid: 101, token: "弓", kind: "soldier", tier: 1 }),
  null,
  null,
  null,
  null,
];
let reducerEvents = core.placeAdouHandItem(
  reducerState,
  "player",
  0,
  { col: buildTile.col, row: buildTile.row },
  () => 0.9,
);
assert(reducerEvents.some((event) => event.type === "unit-placed"), "hand card should place a unit");
const placedUnit = reducerState.units[0];
assert(placedUnit?.hp > 0 && reducerState.sides.player.hand[0] === null, "placed unit should have runtime stats");

reducerEvents = core.useAdouActiveSkillSlot(
  reducerState,
  "player",
  1,
  { type: "cell", col: placedUnit.col, row: placedUnit.row },
  () => 0.9,
);
assert(reducerEvents.some((event) => event.type === "skill-used"), "active skill should execute");
assert(reducerState.units[0].attackSpeedMultiplier > 1, "攻速符 should permanently speed one unit");

const route = reducerState.map.routes.player;
const nearestRoute = route
  .map((point, index) => ({
    index,
    distance: Math.abs(point.col + 0.5 - (placedUnit.col + 0.5)) +
      Math.abs(point.row + 0.5 - (placedUnit.row + 0.5)),
  }))
  .sort((a, b) => a.distance - b.distance)[0];
reducerState.enemies = [{
  uid: 202,
  targetSide: "player",
  kind: "mob",
  label: "兵",
  hp: 10,
  maxHp: 10,
  speed: 50,
  damage: 1,
  progress: nearestRoute.index,
  skillTimer: 999,
  stunTimer: 0,
  burnTimer: 0,
  speedMultiplier: 1,
}];
reducerEvents = core.tickAdouCore(reducerState, 0.2, () => 0.9);
assert(reducerEvents.some((event) => event.type === "unit-attack"), "tick should let units attack");
assert(reducerState.enemies[0]?.hp < 10, "unit attack should damage enemies");
const attackEvent = reducerEvents.find((event) => event.type === "unit-attack");
assert(core.isAdouKnownSoundKey(attackEvent.visual.sound), "attack visual sound should be registered");
const attackFeedback = core.collectAdouCoreEventFeedback(reducerEvents);
assert(attackFeedback.some((cue) => cue.animation?.kind === "unit-attack"), "attack event should produce feedback cue");
for (const cue of attackFeedback) {
  if (cue.sound) assert(core.getAdouSoundPath(cue.sound), `${cue.sound} feedback sound should resolve`);
}

reducerEvents = core.returnAdouBoardUnitToHand(reducerState, "player", placedUnit.uid, 0);
assert(reducerEvents.some((event) => event.type === "unit-returned"), "board unit should return to hand");
assert(reducerState.units.length === 0 && reducerState.sides.player.hand[0]?.type === "unit", "returned unit should occupy hand slot");

const digState = core.createAdouBattleState("changban");
core.startAdouBattle(digState);
const grassTile = digState.tiles.find((tile) => tile.owner === "player" && tile.kind === "grass");
assert(grassTile, "player should have a grass tile");
digState.sides.player.hand = [
  core.createAdouHandCardItem({ uid: 303, token: "铲", kind: "tool", tier: 1 }),
  null,
  null,
  null,
  null,
];
reducerEvents = core.placeAdouHandItem(digState, "player", 0, { col: grassTile.col, row: grassTile.row });
assert(reducerEvents.some((event) => event.type === "skill-used"), "shovel card should execute dig skill");
assert(
  digState.tiles.find((tile) => tile.col === grassTile.col && tile.row === grassTile.row)?.kind === "plot",
  "shovel should turn grass into plot",
);
assert(
  core.collectAdouCoreEventFeedback([core.damageAdou(digState, "player", 1)]).some((cue) => cue.animation?.kind === "adou-hurt"),
  "Adou damage should produce hurt feedback",
);

console.log("adou-core checks passed");
