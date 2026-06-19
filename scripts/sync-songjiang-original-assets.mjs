import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const sourceBase =
  process.env.SONGJIANG_SOURCE_BASE ??
  "https://sda.4399.com/4399swf/upload_swf/ftp54/huangcijin/20260610/01/";
const outputRoot = process.argv[2] ?? "public/songjiang-duel/original";
const bundleAssetReport =
  process.argv[3] ?? "public/songjiang-duel/original-assets.generated.json";

const headers = {
  Referer: "https://www.4399.com/flash/262277_1.htm",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
};

const fileConfigs = [
  "fileconfig.json",
  "resources/img/fileconfig.json",
  "resources/anim/fileconfig.json",
  "resources/music/fileconfig.json",
  "resources/sound/fileconfig.json",
];

const soundNames = [
  "adou_hit",
  "battle_end_gain_star",
  "battle_end_lose_star",
  "battle_end_star_fly",
  "boss_entrance",
  "boss_sweep_skill",
  "bow_attack",
  "btn_down",
  "bulldozer_land",
  "bulldozer_push",
  "caoCao_skill_seal",
  "cavalry_attack",
  "chain_lock",
  "danger_tip",
  "diaoChan_skill_charm",
  "dongZhuo_skill_phantom",
  "dongZhuo_skill_phase1_suck",
  "enemy_dead",
  "enemy_hit",
  "enemy_knife_attack",
  "game_lose",
  "game_win",
  "general_arrow_rain",
  "general_bow_attack",
  "general_fire_arrow_rain",
  "general_ground_slam",
  "general_level_up",
  "general_pike_attack",
  "guanYu_skill_roar",
  "holyBlade_skill",
  "jumpSlash_stomp",
  "knife_attack",
  "landmine_explode",
  "lottery",
  "luBu_skill",
  "maChao_attack_lightning",
  "maChao_throwSpear",
  "mantou_add",
  "match_drum",
  "merge_civilian",
  "merge_general",
  "meteor_fall",
  "open_deck",
  "popup_notification",
  "shovel_treasure_box",
  "shovel_use",
  "skill_ink_splash",
  "soldier_buy_enable",
  "soldier_create",
  "soldier_merge_upgrade",
  "soldier_set",
  "stun_1s",
  "summon_cavalry_skill",
  "sword_attack",
  "swords_clash",
  "talisman_burn",
  "trap_trigger",
  "xiahouDun_skill_cloud",
  "xiahouDun_skill_lightning",
  "zhangJiao_skill_horn",
  "zhaoYun_voice_entrance",
  "zhenFu_skill_rain",
  "zhenFu_skill_rain_cycle",
];

const musicNames = [
  "bg_battleScene_0",
  "bg_battleScene_3",
  "bg_mainScene",
];

function audioAssetPath(name) {
  const ext = name === "zhaoYun_voice_entrance" ? "wav" : "mp3";
  return `resources/sound/${name}.${ext}`;
}

function normalizePath(path) {
  return path.replace(/^\/+/, "").replaceAll("\\", "/");
}

async function fetchBytes(path) {
  const url = new URL(normalizePath(path), sourceBase);
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${path}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function fetchText(path) {
  return (await fetchBytes(path)).toString("utf8");
}

function writeAsset(path, bytes) {
  const target = join(outputRoot, normalizePath(path));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}

function readBundleAssetReport() {
  if (!existsSync(bundleAssetReport)) return [];
  const payload = JSON.parse(readFileSync(bundleAssetReport, "utf8"));
  return Array.isArray(payload.assets) ? payload.assets : [];
}

function collectConfigFiles(config, configPath) {
  const files = new Set();
  for (const [folder, names] of Object.entries(config.files ?? {})) {
    for (const name of names) {
      files.add(`${folder}/${name}`);
    }
  }

  const atlases = [];
  for (const entry of config.config ?? []) {
    if (entry?.t !== 1 || !entry.prefix || !Array.isArray(entry.frames)) continue;
    const folder = entry.prefix.replace(/\/$/, "");
    const image =
      typeof entry.image === "string"
        ? `${folder}/${entry.image}`
        : `${folder}/AutoAtlas.png`;
    const atlas =
      typeof entry.atlas === "string"
        ? `${folder}/${entry.atlas}`
        : `${folder}/AutoAtlas.atlas`;
    files.add(image);
    files.add(atlas);
    atlases.push({
      configPath,
      prefix: entry.prefix,
      image,
      atlas,
      frames: entry.frames,
    });
  }

  return { files, atlases };
}

function shouldFetchBundleAsset(path) {
  return (
    path.startsWith("data/") ||
    path.startsWith("prefab/") ||
    path.startsWith("resources/loading/") ||
    path.startsWith("resources/anim/")
  );
}

function loadAtlasFrameMap(atlasPath, prefix) {
  const localAtlas = join(outputRoot, atlasPath);
  if (!existsSync(localAtlas)) return {};
  const atlas = JSON.parse(readFileSync(localAtlas, "utf8"));
  const frameMap = {};
  for (const [frameName, frame] of Object.entries(atlas.frames ?? {})) {
    frameMap[`${prefix}${frameName}`] = {
      frameName,
      ...frame,
    };
  }
  return frameMap;
}

function extractAtlasFrame(atlasImage, framePath, atlasFrame) {
  const source = join(outputRoot, atlasImage);
  const target = join(outputRoot, framePath);
  if (!existsSync(source) || existsSync(target)) return false;
  mkdirSync(dirname(target), { recursive: true });

  const result = spawnSync(
    "sips",
    [
      "-c",
      String(atlasFrame.frame.h),
      String(atlasFrame.frame.w),
      "--cropOffset",
      String(atlasFrame.frame.y),
      String(atlasFrame.frame.x),
      source,
      "-o",
      target,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `sips failed for ${framePath}`);
  }
  return true;
}

async function main() {
  mkdirSync(outputRoot, { recursive: true });

  const downloadSet = new Set();
  const atlasEntries = [];
  const failed = [];

  for (const configPath of fileConfigs) {
    try {
      const text = await fetchText(configPath);
      writeAsset(configPath, Buffer.from(text));
      const config = JSON.parse(text);
      const { files, atlases } = collectConfigFiles(config, configPath);
      for (const file of files) downloadSet.add(file);
      atlasEntries.push(...atlases);
    } catch (error) {
      failed.push({ path: configPath, error: String(error) });
    }
  }

  for (const asset of readBundleAssetReport()) {
    if (shouldFetchBundleAsset(asset)) downloadSet.add(asset);
  }
  for (const name of soundNames) downloadSet.add(audioAssetPath(name));
  for (const name of musicNames) downloadSet.add(`resources/music/${name}.mp3`);

  const downloaded = [];
  for (const asset of [...downloadSet].sort((a, b) => a.localeCompare(b))) {
    try {
      const bytes = await fetchBytes(asset);
      writeAsset(asset, bytes);
      downloaded.push(asset);
    } catch (error) {
      failed.push({ path: asset, error: String(error) });
    }
  }

  const atlases = atlasEntries
    .map((entry) => ({
      ...entry,
      frameMap: loadAtlasFrameMap(entry.atlas, entry.prefix),
    }))
    .filter((entry) => Object.keys(entry.frameMap).length > 0);

  const framePaths = Object.keys(
    Object.assign({}, ...atlases.map((entry) => entry.frameMap)),
  ).sort((a, b) => a.localeCompare(b));

  let extractedFrames = 0;
  for (const atlas of atlases) {
    for (const [framePath, atlasFrame] of Object.entries(atlas.frameMap)) {
      try {
        if (extractAtlasFrame(atlas.image, framePath, atlasFrame)) extractedFrames += 1;
      } catch (error) {
        failed.push({ path: framePath, error: String(error) });
      }
    }
  }

  const atlasManifest = {
    generatedAt: new Date().toISOString(),
    sourceBase,
    atlases: atlases.map((entry) => ({
      configPath: entry.configPath,
      prefix: entry.prefix,
      image: entry.image,
      atlas: entry.atlas,
      frameCount: Object.keys(entry.frameMap).length,
      frames: entry.frameMap,
    })),
    framePaths,
  };
  writeAsset("atlases.generated.json", Buffer.from(`${JSON.stringify(atlasManifest, null, 2)}\n`));

  const report = {
    generatedAt: atlasManifest.generatedAt,
    sourceBase,
    outputRoot,
    downloaded: downloaded.length,
    atlasFrames: framePaths.length,
    extractedFrames,
    failed,
  };
  writeAsset("sync-report.generated.json", Buffer.from(`${JSON.stringify(report, null, 2)}\n`));

  console.log(
    `Synced ${downloaded.length} original files, ${framePaths.length} atlas frames, and ${extractedFrames} extracted frame PNGs to ${outputRoot}.`,
  );
  if (failed.length > 0) {
    console.warn(`Failed ${failed.length} files; see sync-report.generated.json.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
