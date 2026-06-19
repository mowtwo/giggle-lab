"use client";

import type {
  Application,
  Container,
  Graphics,
  Text,
  TextStyleOptions,
  Texture,
} from "pixi.js";
import { Button, Cursor } from "animal-island-ui";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import {
  BOARD_COLS,
  BOARD_ROWS,
  BOSS_DEFS,
  DEFAULT_GAME_LOADOUT,
  PROP_DEFS,
  WEAPON_DEFS,
  WEAPON_RARITY_COLORS,
  WEAPON_RARITY_NAMES,
  WEAPON_TYPE_LABELS,
  consumeSongjiangAudioEvents,
  createSongjiangDuelGame,
  createSeededRandom,
  endSongjiangDuelGame,
  formatGameTime,
  getCardTone,
  getCompatibleWeaponsForGeneral,
  getEnemyPoint,
  getGeneralCodex,
  getMapDefs,
  getUnitAt,
  getUnitAttackRange,
  getWeaponRarity,
  getWeaponRarityColor,
  getWeaponCodex,
  moveHandCard,
  moveUnit,
  playHandCard,
  rerollHand,
  returnUnitToHand,
  restartSongjiangDuelGame,
  startSongjiangDuelGame,
  updateSongjiangDuelGame,
  useActiveProp as activateProp,
  useBulldozerAssist as triggerBulldozerAssist,
  type Enemy,
  type GameLoadout,
  type HandCard,
  type MapId,
  type PlayTarget,
  type PropId,
  type Side,
  type SongjiangAudioEvent,
  type SongjiangDuelGameState,
  type Tile,
  type Unit,
  type VisualEffect,
  type WeaponDef,
  type WeaponId,
} from "./game-core";
import {
  loadSongjiangAssetManifest,
  loadSongjiangOriginalAtlasManifest,
  type OriginalAtlasFrame,
  type SongjiangAssetId,
} from "./assets";

type PixiModule = typeof import("pixi.js");

type OriginalTextureFrame = {
  texture: Texture;
  atlasFrame: OriginalAtlasFrame;
};

type LoadedTextures = Partial<Record<SongjiangAssetId, Texture>> & {
  original?: Record<string, OriginalTextureFrame>;
  direct?: Record<string, Texture>;
};
type GamePhase = "title" | "playing";
type TitlePanel = "skills" | "generals" | "weapons";
type DragState =
  | {
      source: "hand";
      index: number;
      text: string;
      x: number;
      y: number;
    }
  | {
      source: "unit";
      unitId: number;
      text: string;
      x: number;
      y: number;
    }
  | {
      source: "activeProp";
      index: number;
      propId: PropId;
      text: string;
      x: number;
      y: number;
    }
  | null;

type HudActiveProp = {
  propId: keyof typeof PROP_DEFS;
  text: string;
  cooldown: number;
  remaining: number;
  rarity: 0 | 1 | 2 | 3;
};

type HudSnapshot = {
  mapId: MapId;
  mapName: string;
  mapSubtitle: string;
  hand: Array<HandCard | null>;
  hp: number;
  maxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  gold: number;
  refreshCost: number;
  round: number;
  roundTimer: number;
  elapsed: number;
  message: string;
  rangeBonus: number;
  attackSpeedBonus: number;
  activeProps: HudActiveProp[];
  passiveProps: Array<keyof typeof PROP_DEFS>;
  status: SongjiangDuelGameState["status"];
  winner: SongjiangDuelGameState["winner"];
};

type HoverTip = {
  text: string;
  x: number;
  y: number;
} | null;

type InspectedUnitSnapshot = Unit & {
  attackRange: number;
  attacksPerSecond: number;
};

const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 1060;
const BOARD_X = 162;
const BOARD_Y = 186;
const CELL = 72;
const FONT = "\"Ma Shan Zheng\", \"Noto Sans SC\", serif";
const ACTIVE_PROP_CHOICES: PropId[] = [
  "inkstone",
  "attSpeedSpell",
  "lifePill",
  "longRange",
  "exorcismSpell",
  "xuMingPill",
  "daBuPill",
  "silt",
  "meteor",
];
const PASSIVE_PROP_CHOICES: PropId[] = [
  "farmer",
  "recruit",
  "promotionOrder",
  "superShovel",
  "goldSeeker",
  "longRange",
  "allAttSpeedSpell",
  "goingHandInHand",
  "silt",
  "meteor",
  "daBuPill",
];
const ORIGINAL_ASSET_BASE = "/songjiang-duel/original/";
const LOADOUT_STORAGE_KEY = "songjiang-duel-loadout-v2";
const ORIGINAL_DIRECT_ASSETS = ["resources/anim/aDou/skeleton.png"] as const;
const ZHAOYUN_VOICE = "zhaoYun_voice_entrance";
const ORIGINAL_GENERAL_PARTS = [
  "赵",
  "云",
  "张",
  "飞",
  "马",
  "超",
  "关",
  "羽",
  "平",
  "兴",
  "黄",
  "忠",
  "苞",
  "翼",
  "盖",
  "祖",
  "甄",
  "宓",
  "刘",
  "备",
] as const;
const ORIGINAL_PROP_ASSETS: Partial<Record<PropId, string>> = {
  shovel: "resources/img/props/shovel_1.png",
  superShovel: "resources/img/props/shovel_2.png",
  bulldozer: "resources/img/props/bulldozer_0.png",
  writingBrush: "resources/img/props/writingBrush_1.png",
  trainingSpell: "resources/img/props/trainingSpell_1.png",
  upLvlSpell: "resources/img/props/upLvlSpell_1.png",
  lifePill: "resources/img/props/lifePill_1.png",
  longRange: "resources/img/props/longRange_1.png",
  inkstone: "resources/img/props/inkstone_1.png",
  trap: "resources/img/props/trap_1.png",
  landmine: "resources/img/props/landmine_1.png",
  attSpeedSpell: "resources/img/props/attSpeedSpell_1.png",
  exorcismSpell: "resources/img/props/exorcismSpell_1.png",
  farmer: "resources/img/props/farmer_1.png",
  recruit: "resources/img/props/recruit_1.png",
  allAttSpeedSpell: "resources/img/props/allAttSpeedSpell_1.png",
  goingHandInHand: "resources/img/props/goingHandInHand_1.png",
  xuMingPill: "resources/img/props/xuMingPill_1.png",
  daBuPill: "resources/img/props/daBuPill_1.png",
  silt: "resources/img/props/silt_1.png",
  meteor: "resources/img/props/meteor_2.png",
  trashCan: "resources/img/props/trashCan_2.png",
  promotionOrder: "resources/img/props/promotionOrder_1.png",
  marchPill: "resources/img/props/marchPill_1.png",
  goldSeeker: "resources/img/props/goldSeeker_1.png",
};
const ORIGINAL_WEAPON_ASSETS: Partial<Record<WeaponId, string>> = {
  longBow: "resources/img/weapon/weapon_1.png",
  ironBow: "resources/img/weapon/weapon_2.png",
  hornBow: "resources/img/weapon/weapon_3.png",
  eagleBow: "resources/img/weapon/weapon_4.png",
  ironFetalBow: "resources/img/weapon/weapon_5.png",
  divineArmBow: "resources/img/weapon/weapon_6.png",
  overlordBow: "resources/img/weapon/weapon_7.png",
  sunsetBow: "resources/img/weapon/weapon_8.png",
  repeatingCrossbow: "resources/img/weapon/weapon_9.png",
  shortPike: "resources/img/weapon/weapon_10.png",
  longPike: "resources/img/weapon/weapon_11.png",
  ironPike: "resources/img/weapon/weapon_12.png",
  greatHalberd: "resources/img/weapon/weapon_13.png",
  hookSicklePike: "resources/img/weapon/weapon_14.png",
  steelPike: "resources/img/weapon/weapon_15.png",
  pearFlowerPike: "resources/img/weapon/weapon_16.png",
  tigerHeadPike: "resources/img/weapon/weapon_17.png",
  serpentPike: "resources/img/weapon/weapon_18.png",
  silverDragonPike: "resources/img/weapon/weapon_19.png",
  woodBlade: "resources/img/weapon/weapon_20.png",
  shortBlade: "resources/img/weapon/weapon_20.png",
  longBlade: "resources/img/weapon/weapon_21.png",
  ironBlade: "resources/img/weapon/weapon_22.png",
  wolfFangClub: "resources/img/weapon/weapon_23.png",
  tridentBlade: "resources/img/weapon/weapon_24.png",
  ironThornClub: "resources/img/weapon/weapon_25.png",
  ancientBlade: "resources/img/weapon/weapon_26.png",
  tigerBlade: "resources/img/weapon/weapon_27.png",
  sevenStarBlade: "resources/img/weapon/weapon_28.png",
  greenDragonBlade: "resources/img/weapon/weapon_29.png",
  skyPiercer: "resources/img/weapon/weapon_30.png",
  shortSword: "resources/img/weapon/weapon_31.png",
  longSword: "resources/img/weapon/weapon_32.png",
  ironSword: "resources/img/weapon/weapon_33.png",
  giantGateSword: "resources/img/weapon/weapon_34.png",
  dragonSpringSword: "resources/img/weapon/weapon_35.png",
  dragonAbyssSword: "resources/img/weapon/weapon_36.png",
  twinSword: "resources/img/weapon/weapon_37.png",
  greenSteelSword: "resources/img/weapon/weapon_38.png",
  sevenStarSword: "resources/img/weapon/weapon_39.png",
  heavenSword: "resources/img/weapon/weapon_40.png",
  moyeSword: "resources/img/weapon/weapon_41.png",
  ganjiangSword: "resources/img/weapon/weapon_42.png",
  xuanyuanSword: "resources/img/weapon/weapon_43.png",
};

function songjiangSoundUrl(name: string) {
  return `${ORIGINAL_ASSET_BASE}resources/sound/${name}.${name === ZHAOYUN_VOICE ? "wav" : "mp3"}`;
}

function songjiangMusicUrl(name: string) {
  return `${ORIGINAL_ASSET_BASE}resources/music/${name}.mp3`;
}

function soundVolume(name: string) {
  if (name.includes("attack") || name === "enemy_hit") return 0.44;
  if (name === "match_drum" || name === "boss_entrance") return 0.62;
  if (name === "adou_hit" || name === "enemy_dead") return 0.58;
  return 0.72;
}

function createSongjiangAudioEngine() {
  const soundCache = new Map<string, HTMLAudioElement>();
  const lastPlayedAt = new Map<string, number>();
  let music: HTMLAudioElement | null = null;
  let musicName = "";

  const soundFor = (name: string) => {
    const cached = soundCache.get(name);
    if (cached) return cached;
    const audio = new Audio(songjiangSoundUrl(name));
    audio.preload = "auto";
    audio.volume = soundVolume(name);
    soundCache.set(name, audio);
    return audio;
  };

  const playSound = (name: string) => {
    const now = performance.now();
    if (now - (lastPlayedAt.get(name) ?? -Infinity) < 50) return;
    lastPlayedAt.set(name, now);

    const audio = soundFor(name).cloneNode(true) as HTMLAudioElement;
    audio.volume = soundVolume(name);
    audio.addEventListener("ended", () => audio.remove(), { once: true });
    void audio.play().catch(() => {});
  };

  const stopMusic = () => {
    if (!music) return;
    music.pause();
    music.currentTime = 0;
    music = null;
    musicName = "";
  };

  const playMusic = (name: string) => {
    if (musicName === name && music && !music.paused) return;
    stopMusic();
    musicName = name;
    music = new Audio(songjiangMusicUrl(name));
    music.loop = true;
    music.volume = 0.26;
    void music.play().catch(() => {});
  };

  const consume = (events: SongjiangAudioEvent[]) => {
    for (const event of events) {
      if (event.kind === "sound") playSound(event.name);
      if (event.kind === "music") playMusic(event.name);
      if (event.kind === "stopMusic") stopMusic();
    }
  };

  const preloadCore = () => {
    for (const name of [
      "soldier_set",
      "merge_general",
      "soldier_merge_upgrade",
      "open_deck",
      "soldier_create",
      "bow_attack",
      "general_bow_attack",
      "general_pike_attack",
      "enemy_dead",
      "adou_hit",
      "game_win",
      "game_lose",
    ]) {
      soundFor(name);
    }
  };

  return { consume, preloadCore, stopMusic };
}

function cloneLoadout(loadout: GameLoadout): GameLoadout {
  return {
    activeProps: [...loadout.activeProps],
    passiveProps: [...loadout.passiveProps],
    weaponAssignments: { ...loadout.weaponAssignments },
  };
}

function normalizeStoredLoadout(value: unknown): GameLoadout {
  if (!value || typeof value !== "object") return cloneLoadout(DEFAULT_GAME_LOADOUT);
  const source = value as Partial<GameLoadout>;
  const activeProps = Array.isArray(source.activeProps)
    ? source.activeProps.filter(
        (propId): propId is PropId =>
          typeof propId === "string" &&
          propId in PROP_DEFS &&
          ACTIVE_PROP_CHOICES.includes(propId as PropId),
      )
    : [];
  const passiveProps = Array.isArray(source.passiveProps)
    ? source.passiveProps.filter(
        (propId): propId is PropId =>
          typeof propId === "string" &&
          propId in PROP_DEFS &&
          PASSIVE_PROP_CHOICES.includes(propId as PropId),
      )
    : [];
  const weaponAssignments: GameLoadout["weaponAssignments"] = {};
  if (source.weaponAssignments && typeof source.weaponAssignments === "object") {
    for (const [general, weaponId] of Object.entries(source.weaponAssignments)) {
      if (typeof weaponId === "string" && weaponId in WEAPON_DEFS) {
        weaponAssignments[general] = weaponId as WeaponId;
      }
    }
  }
  return {
    activeProps: activeProps.length ? activeProps.slice(0, 2) : [...DEFAULT_GAME_LOADOUT.activeProps],
    passiveProps: passiveProps.length ? passiveProps.slice(0, 5) : [...DEFAULT_GAME_LOADOUT.passiveProps],
    weaponAssignments: {
      ...DEFAULT_GAME_LOADOUT.weaponAssignments,
      ...weaponAssignments,
    },
  };
}

function makeHud(state: SongjiangDuelGameState): HudSnapshot {
  return {
    mapId: state.map.id,
    mapName: state.map.name,
    mapSubtitle: state.map.subtitle,
    hand: state.side.player.hand.map((card) => (card ? { ...card } : null)),
    hp: state.side.player.hp,
    maxHp: state.side.player.maxHp,
    enemyHp: state.side.ai.hp,
    enemyMaxHp: state.side.ai.maxHp,
    gold: state.side.player.gold,
    refreshCost: state.side.player.refreshCost,
    round: state.round,
    roundTimer: state.roundTimer,
    elapsed: state.elapsed,
    message: state.message,
    rangeBonus: state.side.player.rangeBonus,
    attackSpeedBonus: state.side.player.attackSpeedBonus,
    activeProps: state.side.player.activeProps.map((slot) => ({
      propId: slot.propId,
      text: PROP_DEFS[slot.propId].text,
      cooldown: slot.cooldown,
      remaining: slot.remaining,
      rarity: PROP_DEFS[slot.propId].rarity,
    })),
    passiveProps: [...state.side.player.passiveProps],
    status: state.status,
    winner: state.winner,
  };
}

function cloneInspectedUnit(
  state: SongjiangDuelGameState,
  unit: Unit | null,
): InspectedUnitSnapshot | null {
  if (!unit) return null;
  const weapon = unit.weaponId ? WEAPON_DEFS[unit.weaponId] : null;
  const attackRange = (unit.range + (weapon?.rangeBonus ?? 0)) * state.side[unit.side].rangeBonus;
  const attacksPerSecond =
    1 / Math.max(0.1, unit.interval / (unit.attackSpeedBoost * state.side[unit.side].attackSpeedBonus));
  return {
    ...unit,
    parts: unit.parts ? [...unit.parts] : null,
    attackRange,
    attacksPerSecond,
  };
}

function colorNumber(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function originalTexture(textures: LoadedTextures, path: string) {
  return textures.original?.[path]?.texture ?? null;
}

function directTexture(textures: LoadedTextures, path: string) {
  return textures.direct?.[path] ?? null;
}

function hasOriginalTexture(textures: LoadedTextures, path: string) {
  return Boolean(originalTexture(textures, path));
}

function addOriginalSprite(
  Pixi: PixiModule,
  layer: Container,
  textures: LoadedTextures,
  path: string,
  x: number,
  y: number,
  options: {
    width?: number;
    height?: number;
    anchorX?: number;
    anchorY?: number;
    alpha?: number;
    rotation?: number;
    tint?: number;
  } = {},
) {
  const texture = originalTexture(textures, path);
  if (!texture) return null;
  const sprite = new Pixi.Sprite(texture);
  sprite.anchor.set(options.anchorX ?? 0.5, options.anchorY ?? 0.5);
  sprite.position.set(x, y);
  if (options.width !== undefined) sprite.width = options.width;
  if (options.height !== undefined) sprite.height = options.height;
  if (options.alpha !== undefined) sprite.alpha = options.alpha;
  if (options.rotation !== undefined) sprite.rotation = options.rotation;
  if (options.tint !== undefined) sprite.tint = options.tint;
  layer.addChild(sprite);
  return sprite;
}

function scaleOriginalSpriteToFit(
  sprite: InstanceType<PixiModule["Sprite"]>,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / sprite.texture.width, maxHeight / sprite.texture.height);
  sprite.scale.set(scale);
}

function generalPartPath(part: string, tier: number) {
  const index = ORIGINAL_GENERAL_PARTS.indexOf(part as (typeof ORIGINAL_GENERAL_PARTS)[number]);
  if (index < 0) return null;
  if (tier >= 5) return `resources/img/gameObject/soldier/generalParts_${index}_5.png`;
  if (tier >= 4) return `resources/img/gameObject/soldier/generalParts_${index}_4.png`;
  return `resources/img/gameObject/soldier/generalParts_${index}.png`;
}

function tileTexturePath(tile: Tile) {
  if (tile.kind === "road") return `resources/img/map/road_${tile.owner === "ai" ? 0 : 1}.png`;
  if (tile.kind === "grass") return `resources/img/map/grass_${tile.tone % 4}_${tile.owner === "ai" ? 0 : 1}.png`;
  if (tile.kind === "plot") return `resources/img/map/space_${tile.owner === "ai" ? 0 : 1}.png`;
  return null;
}

function propAssetPath(propId: PropId) {
  return ORIGINAL_PROP_ASSETS[propId] ?? null;
}

function weaponAssetPath(weaponId: WeaponId) {
  return ORIGINAL_WEAPON_ASSETS[weaponId] ?? null;
}

function cardKindLabel(card: HandCard) {
  if (card.kind === "prop") return "道具";
  if (card.kind === "name") return "好汉字";
  return card.text === "农" ? "农民" : "兵字";
}

function SkillIconArt({ propId }: { propId: PropId }) {
  const stroke = "#2a1a12";
  const accent = "#9a3a2e";
  const blue = "#2c7da0";
  const green = "#4f7d42";
  const gold = "#b17623";

  switch (propId) {
    case "shovel":
    case "superShovel":
      return (
        <>
          <path d="M29 8l10 10-8 8-10-10z" fill="#d9a45c" stroke={stroke} strokeWidth="3" />
          <path d="M23 22L10 35" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 37c6 3 13 1 17-4" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "bulldozer":
      return (
        <>
          <path d="M9 28h23l7 7H12z" fill="#d18b61" stroke={stroke} strokeWidth="3" />
          <path d="M30 18c-6-3-13-2-20 2" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="16" cy="36" r="4" fill={accent} stroke={stroke} strokeWidth="2" />
          <circle cx="31" cy="36" r="4" fill={accent} stroke={stroke} strokeWidth="2" />
        </>
      );
    case "writingBrush":
      return (
        <>
          <path d="M33 7l8 8-20 20-8-8z" fill="#f1d38f" stroke={stroke} strokeWidth="3" />
          <path d="M14 28c-5 3-7 7-6 12 5 0 9-2 12-7" fill={accent} stroke={stroke} strokeWidth="2" />
          <path d="M28 13l7 7" stroke="#fff3bf" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "trainingSpell":
      return (
        <>
          <path d="M12 36c8-13 16-21 25-25" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
          <path d="M25 14l9 9M19 24l8 8" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="13" cy="36" r="5" fill="#f8e9bf" stroke={stroke} strokeWidth="3" />
        </>
      );
    case "upLvlSpell":
    case "promotionOrder":
      return (
        <>
          <path d="M24 8l12 14h-7v17H19V22h-7z" fill="#f0cf59" stroke={stroke} strokeWidth="3" />
          <path d="M18 35h12" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "lifePill":
    case "daBuPill":
      return (
        <>
          <path d="M14 24c-6-8 5-18 10-8 5-10 16 0 10 8L24 38z" fill="#d95d4e" stroke={stroke} strokeWidth="3" />
          <path d="M18 25h12M24 19v12" stroke="#fff3bf" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "longRange":
      return (
        <>
          <circle cx="24" cy="24" r="15" fill="none" stroke={blue} strokeWidth="3" />
          <circle cx="24" cy="24" r="7" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M24 8v8M24 32v8M8 24h8M32 24h8" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "inkstone":
      return (
        <>
          <path d="M12 30c4-13 17-18 25-8 4 8-5 18-18 15-7-2-10-2-12 0 2-3 3-5 5-7z" fill="#1d1714" stroke={stroke} strokeWidth="2" />
          <circle cx="28" cy="18" r="5" fill={blue} opacity=".8" />
          <circle cx="15" cy="22" r="3" fill={accent} opacity=".8" />
        </>
      );
    case "trap":
      return (
        <>
          <ellipse cx="24" cy="30" rx="15" ry="8" fill="#21140d" stroke={stroke} strokeWidth="3" />
          <path d="M13 25c7 5 15 5 23 0" stroke="#f2dfb8" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "landmine":
      return (
        <>
          <circle cx="24" cy="28" r="12" fill="#802c25" stroke={stroke} strokeWidth="3" />
          <path d="M24 9v8M10 16l6 6M38 16l-6 6" stroke={gold} strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="28" r="4" fill="#ffd45b" />
        </>
      );
    case "attSpeedSpell":
      return (
        <>
          <path d="M10 17h18l-7 8h17L18 41l6-12H10z" fill="#f0cf59" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 9l5 5M40 8l-5 5" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "exorcismSpell":
      return (
        <>
          <path d="M24 7l15 8v10c0 9-6 14-15 17-9-3-15-8-15-17V15z" fill="#c7d8ef" stroke={stroke} strokeWidth="3" />
          <path d="M17 28l14-14M18 16l13 13" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "farmer":
      return (
        <>
          <path d="M24 39V22" stroke={green} strokeWidth="5" strokeLinecap="round" />
          <path d="M24 24c-9-1-13-7-12-14 8 1 13 5 12 14zM24 27c9-2 14-7 13-15-8 1-13 6-13 15z" fill="#8db96f" stroke={stroke} strokeWidth="2" />
          <path d="M12 39h24" stroke={gold} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "recruit":
      return (
        <>
          <path d="M13 12h22v28H13z" fill="#f7df9d" stroke={stroke} strokeWidth="3" />
          <path d="M17 19h14M17 25h11M17 31h14" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="34" cy="13" r="5" fill="#85de85" stroke={stroke} strokeWidth="2" />
        </>
      );
    case "allAttSpeedSpell":
    case "goingHandInHand":
      return (
        <>
          <path d="M11 18h18l-5-6M29 12l7 6-7 6M37 30H19l5 6M19 36l-7-6 7-6" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="5" fill={accent} />
        </>
      );
    case "xuMingPill":
      return (
        <>
          <path d="M24 9c9 0 15 6 15 15s-6 15-15 15S9 33 9 24" fill="none" stroke={green} strokeWidth="5" strokeLinecap="round" />
          <path d="M9 24l-4-1 3 8 6-6z" fill={green} stroke={stroke} strokeWidth="2" />
          <path d="M19 24h10" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "silt":
      return (
        <>
          <path d="M8 31c8-7 15 6 23-1 4-3 7-4 10-2" fill="none" stroke="#7b6245" strokeWidth="5" strokeLinecap="round" />
          <path d="M10 21c7-5 13 4 20 0 4-2 7-3 10-1" fill="none" stroke={blue} strokeWidth="3" strokeLinecap="round" />
          <circle cx="17" cy="36" r="3" fill="#7b6245" />
        </>
      );
    case "meteor":
      return (
        <>
          <path d="M12 13c8 6 14 9 24 10" stroke="#ff9b42" strokeWidth="5" strokeLinecap="round" />
          <circle cx="30" cy="30" r="9" fill="#ffcf44" stroke={stroke} strokeWidth="3" />
          <path d="M24 31l9-7" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "trashCan":
      return (
        <>
          <path d="M15 16h18l-2 23H17z" fill="#cfc3a6" stroke={stroke} strokeWidth="3" />
          <path d="M13 16h22M20 11h8M20 22v11M28 22v11" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "marchPill":
      return (
        <>
          <path d="M12 33c7-2 12-6 15-13l4 4 5-13-14 3 4 4c-4 7-9 11-16 13z" fill="#f0cf59" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="36" cy="35" r="4" fill={gold} stroke={stroke} strokeWidth="2" />
        </>
      );
    case "goldSeeker":
      return (
        <>
          <circle cx="20" cy="28" r="10" fill="#ffcf44" stroke={stroke} strokeWidth="3" />
          <circle cx="31" cy="23" r="8" fill="#f4b23d" stroke={stroke} strokeWidth="3" />
          <path d="M13 13c7 2 11 6 12 12" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    default:
      return <circle cx="24" cy="24" r="14" fill="#f2dfb8" stroke={stroke} strokeWidth="3" />;
  }
}

function SkillIcon({ propId, compact = false }: { propId: PropId; compact?: boolean }) {
  const prop = PROP_DEFS[propId];
  const originalIcon = propAssetPath(propId);
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-[8px] border-[2px] border-[#2a1a12] shadow-[0_2px_0_rgba(42,26,18,0.18)] ${
        compact ? "h-10 w-10" : "h-14 w-14"
      }`}
      style={{
        background: `radial-gradient(circle at 35% 25%, #fff8d5 0 18%, ${colorNumber(getCardTone({
          uid: 0,
          kind: "prop",
          text: prop.text,
          cost: 0,
          rarity: prop.rarity,
          tier: 1,
          parts: null,
          propId,
        }))} 45%, #caa167 100%)`,
      }}
      aria-hidden="true"
    >
      <span className="absolute inset-[5px] rounded-[6px] border border-[#2a1a12]/25" />
      {originalIcon ? (
        <Image
          src={`${ORIGINAL_ASSET_BASE}${originalIcon}`}
          alt=""
          fill
          sizes={compact ? "40px" : "56px"}
          unoptimized
          className="object-contain p-1"
        />
      ) : (
        <svg viewBox="0 0 48 48" className={compact ? "h-8 w-8" : "h-11 w-11"}>
          <SkillIconArt propId={propId} />
        </svg>
      )}
      <span className={`absolute bottom-0.5 right-1 rounded-[4px] bg-[#fff4c7]/90 px-0.5 font-['Ma_Shan_Zheng'] leading-none text-[#2a1a12] ${compact ? "text-sm" : "text-lg"}`}>
        {prop.text}
      </span>
    </span>
  );
}

function weaponRarityStyle(weaponId: WeaponId) {
  const color = getWeaponRarityColor(weaponId);
  const isCommon = color === "#ffffff";
  return {
    backgroundColor: isCommon ? "#fff7dc" : `${color}28`,
    borderColor: isCommon ? "#6d4a2c" : color,
    color: "#2a1a12",
    boxShadow: `0 3px 0 rgba(42,26,18,0.16), inset 0 0 0 2px ${isCommon ? "#2a1a1222" : `${color}66`}`,
  };
}

function weaponRarityBadgeStyle(rarity: number) {
  const color = WEAPON_RARITY_COLORS[rarity] ?? WEAPON_RARITY_COLORS[0];
  const isCommon = color === "#ffffff";
  return {
    backgroundColor: isCommon ? "#fff7dc" : color,
    borderColor: isCommon ? "#6d4a2c" : "#2a1a12",
    color: "#2a1a12",
  };
}

type WeaponIconWeapon = Pick<WeaponDef, "id" | "type" | "text" | "color">;

function WeaponIconArt({
  weapon,
  rarity,
}: {
  weapon: WeaponIconWeapon;
  rarity: number;
}) {
  const stroke = "#2a1a12";
  const metal = colorNumber(weapon.color);
  const gold = rarity >= 4 ? "#ffdc5c" : rarity >= 3 ? "#c6a1ff" : "#fff2bd";
  const wood = "#8c4f2c";

  return (
    <>
      {rarity >= 4 ? (
        <path
          d="M12 12c9-7 19-7 28 0M10 40c10 5 20 5 30 0"
          fill="none"
          stroke={gold}
          strokeLinecap="round"
          strokeWidth="2"
          opacity=".8"
        />
      ) : null}
      {weapon.type === "bow" ? (
        <>
          <path
            d="M17 7c16 9 16 25 0 34"
            fill="none"
            stroke={wood}
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path d="M18 8c8 9 8 24 0 33" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2" />
          <path d="M16 8v33" stroke="#f8e9bf" strokeLinecap="round" strokeWidth="2" />
          <path d="M22 25h18" stroke={metal} strokeLinecap="round" strokeWidth="4" />
          <path d="M40 25l-8-5 3 5-3 5z" fill={metal} stroke={stroke} strokeLinejoin="round" strokeWidth="2" />
          <path d="M24 21l-6 4 6 4" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2" />
        </>
      ) : null}
      {weapon.type === "pike" ? (
        <>
          <path d="M13 39L35 11" stroke={wood} strokeLinecap="round" strokeWidth="5" />
          <path d="M29 9l10-3-3 10z" fill={metal} stroke={stroke} strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M25 19c5 1 8 3 10 7" stroke="#cc3f31" strokeLinecap="round" strokeWidth="3" />
          <path d="M17 33l9-9" stroke="#fff4c7" strokeLinecap="round" strokeWidth="2" />
          {weapon.text === "戟" || weapon.text === "矛" ? (
            <path d="M34 11c-1 7-5 11-11 12" fill="none" stroke={metal} strokeLinecap="round" strokeWidth="3" />
          ) : null}
        </>
      ) : null}
      {weapon.type === "blade" ? (
        <>
          <path
            d="M17 39c12-5 21-17 20-30-10 6-17 14-22 25z"
            fill={metal}
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path d="M18 37l-7 5" stroke={wood} strokeLinecap="round" strokeWidth="5" />
          <path d="M19 32c8-5 13-12 16-20" fill="none" stroke="#fff8d5" strokeLinecap="round" strokeWidth="2" />
          {weapon.text === "棒" ? (
            <path d="M17 35l18-23" stroke={metal} strokeLinecap="round" strokeWidth="7" />
          ) : null}
          {weapon.text === "戟" ? (
            <path d="M28 14c5 1 9 4 10 9" fill="none" stroke={gold} strokeLinecap="round" strokeWidth="3" />
          ) : null}
        </>
      ) : null}
      {weapon.type === "sword" ? (
        <>
          <path d="M24 6l8 24-8 12-8-12z" fill={metal} stroke={stroke} strokeLinejoin="round" strokeWidth="3" />
          <path d="M24 9v28" stroke="#fff8d5" strokeLinecap="round" strokeWidth="2" opacity=".75" />
          <path d="M14 30h20" stroke={gold} strokeLinecap="round" strokeWidth="5" />
          <path d="M21 34h6l2 8H19z" fill={wood} stroke={stroke} strokeLinejoin="round" strokeWidth="2" />
          {rarity >= 3 ? (
            <path d="M11 15l3 2 3-2-2 4 2 4-3-2-3 2 2-4z" fill={gold} stroke={stroke} strokeWidth="1" />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function WeaponIcon({
  weapon,
  compact = false,
}: {
  weapon: WeaponIconWeapon;
  compact?: boolean;
}) {
  const rarity = getWeaponRarity(weapon.id);
  const originalIcon = weaponAssetPath(weapon.id);
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-[8px] border-[2px] border-[#2a1a12] ${
        compact ? "h-10 w-10" : "h-16 w-16"
      }`}
      style={weaponRarityStyle(weapon.id)}
      aria-hidden="true"
    >
      <span className="absolute inset-[4px] rounded-[6px] border border-[#2a1a12]/25" />
      {originalIcon ? (
        <Image
          src={`${ORIGINAL_ASSET_BASE}${originalIcon}`}
          alt=""
          fill
          sizes={compact ? "40px" : "64px"}
          unoptimized
          className="object-contain p-1"
        />
      ) : (
        <svg viewBox="0 0 48 48" className={compact ? "h-8 w-8" : "h-12 w-12"}>
          <WeaponIconArt weapon={weapon} rarity={rarity} />
        </svg>
      )}
      <span
        className={`absolute bottom-0.5 right-1 rounded-[4px] bg-[#fff4c7]/95 px-0.5 font-['Ma_Shan_Zheng'] leading-none text-[#2a1a12] ${
          compact ? "text-sm" : "text-lg"
        }`}
      >
        {weapon.text}
      </span>
    </span>
  );
}

function sideColor(side: Side) {
  return side === "player" ? 0x237c8a : 0xb94835;
}

function fitStage(app: Application, root: Container) {
  const scale = Math.min(app.screen.width / VIEW_WIDTH, app.screen.height / VIEW_HEIGHT);
  const x = (app.screen.width - VIEW_WIDTH * scale) / 2;
  let y = (app.screen.height - VIEW_HEIGHT * scale) / 2;
  if (app.screen.width < 640) {
    y = Math.max(88, y - 76);
  }
  root.position.set(x, y);
  root.scale.set(scale);
  return { x, y, scale };
}

function addText(
  Pixi: PixiModule,
  layer: Container,
  text: string,
  x: number,
  y: number,
  style: Partial<TextStyleOptions>,
  anchorX = 0.5,
  anchorY = 0.5,
) {
  const label = new Pixi.Text({
    text,
    style: {
      fontFamily: FONT,
      fill: 0x2a1a12,
      fontSize: 32,
      fontWeight: "700",
      ...style,
    },
  }) as Text;
  label.anchor.set(anchorX, anchorY);
  label.position.set(x, y);
  layer.addChild(label);
  return label;
}

function drawRoughLine(
  g: Graphics,
  points: Array<{ x: number; y: number }>,
  color: number,
  width: number,
  alpha = 1,
) {
  if (points.length === 0) return;
  g.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) g.lineTo(point.x, point.y);
  g.stroke({ color, width, alpha, cap: "round", join: "round" });
}

function drawTile(
  Pixi: PixiModule,
  layer: Container,
  tile: Tile,
  selectedCard: HandCard | null,
  textures: LoadedTextures,
) {
  const x = BOARD_X + tile.col * CELL;
  const y = BOARD_Y + tile.row * CELL;
  const tones = [0, 5, -4, 7, -6];
  const adjust = tones[tile.tone] ?? 0;
  const base =
    tile.kind === "road"
      ? 0xae8b68
      : tile.kind === "grass"
        ? 0xa7ad72
        : tile.kind === "blocked"
          ? 0x74675d
          : tile.owner === "player"
            ? 0xe1c78f
            : tile.owner === "ai"
              ? 0xd8b184
              : 0xd7c39f;
  const fill = Math.max(0, Math.min(0xffffff, base + adjust * 0x010101));
  const canHint =
    selectedCard &&
    tile.owner === "player" &&
    (((selectedCard.kind === "unit" || selectedCard.kind === "name") &&
        (selectedCard.text === "农"
          ? tile.kind === "plot" || tile.kind === "grass"
          : tile.kind === "plot")) ||
      (selectedCard.propId === "shovel" && tile.kind === "grass") ||
      (selectedCard.propId === "farmer" &&
        (tile.kind === "plot" || tile.kind === "grass")) ||
      ((selectedCard.propId === "trap" || selectedCard.propId === "landmine") &&
        tile.kind === "road") ||
      ((selectedCard.propId === "trainingSpell" || selectedCard.propId === "upLvlSpell") &&
        tile.kind === "plot"));

  const tilePath = tileTexturePath(tile);
  const tileSprite = tilePath
    ? addOriginalSprite(Pixi, layer, textures, tilePath, x + CELL / 2, y + CELL / 2, {
        width: CELL - 5,
        height: CELL - 5,
        alpha: tile.owner === "ai" ? 0.86 : 0.98,
      })
    : null;
  if (tileSprite) {
    tileSprite.tint = tile.kind === "grass" ? 0xf8fff0 : tile.owner === "ai" ? 0xffe5d2 : 0xffffff;
  }

  const g = new Pixi.Graphics();
  if (!tileSprite) {
    g.roundRect(x + 4, y + 4, CELL - 8, CELL - 8, 10).fill({
      color: fill,
      alpha: tile.owner === "ai" ? 0.82 : 0.95,
    });
  }
  g.roundRect(x + 4, y + 4, CELL - 8, CELL - 8, 10).stroke({
    color: canHint ? 0xffde5a : 0x3b2418,
    width: canHint ? 4 : 2,
    alpha: canHint ? 0.9 : tileSprite ? 0.18 : 0.34,
  });

  if (!tileSprite && tile.kind === "road") {
    g.moveTo(x + 18, y + 38);
    g.lineTo(x + 54, y + 34);
    g.stroke({ color: 0x5f432e, width: 5, alpha: 0.3, cap: "round" });
  }
  if (!tileSprite && tile.kind === "grass") {
    for (let i = 0; i < 3; i += 1) {
      const px = x + 22 + i * 14;
      g.moveTo(px, y + 50);
      g.lineTo(px + 8, y + 24 + i * 3);
      g.stroke({ color: 0x526d39, width: 4, alpha: 0.45, cap: "round" });
    }
  }
  if (tile.kind === "blocked") {
    g.moveTo(x + 20, y + 22);
    g.lineTo(x + 52, y + 52);
    g.moveTo(x + 52, y + 22);
    g.lineTo(x + 20, y + 52);
    g.stroke({ color: 0x241812, width: 5, alpha: 0.4, cap: "round" });
  }
  layer.addChild(g);
}

function drawUnit(Pixi: PixiModule, layer: Container, unit: Unit, textures: LoadedTextures) {
  const width = CELL * unit.width;
  const x = BOARD_X + unit.col * CELL + width / 2;
  const y = BOARD_Y + unit.row * CELL + CELL / 2;
  const pulse = Math.sin(unit.pulse) * 2;
  const hasOriginalBg =
    (unit.width === 2 &&
      hasOriginalTexture(
        textures,
        `resources/img/gameObject/soldier/generalBg${Math.min(4, Math.max(1, unit.tier))}.png`,
      )) ||
    (unit.width === 1 &&
      (unit.text === "农"
        ? hasOriginalTexture(textures, "resources/img/props/farmer_1.png")
        : hasOriginalTexture(textures, `resources/img/gameObject/soldier/soldier_${unit.archetype === "bow" ? 1 : unit.archetype === "pike" ? 2 : unit.archetype === "cavalry" ? 3 : 0}.png`)));

  addOriginalSprite(Pixi, layer, textures, "resources/img/gameObject/soldier/shadow2.png", x, y + 34, {
    width: width * 0.82,
    height: 28,
    alpha: unit.side === "player" ? 0.36 : 0.28,
  });

  const plate = new Pixi.Graphics();
  if (!hasOriginalBg) {
    plate.roundRect(x - width / 2 + 6, y - 31 + pulse, width - 12, 62, 10).fill({
      color: unit.side === "player" ? 0xf2d99c : 0xe2b28c,
      alpha: 0.95,
    });
  }
  plate.roundRect(x - width / 2 + 6, y - 31 + pulse, width - 12, 62, 10).stroke({
    color: sideColor(unit.side),
    width: unit.width === 2 ? 4 : 3,
    alpha: unit.lockTimer > 0 ? 0.45 : hasOriginalBg ? 0.32 : 0.9,
  });
  if (!hasOriginalBg && unit.width === 2) {
    plate.moveTo(x, y - 28 + pulse);
    plate.lineTo(x, y + 28 + pulse);
    plate.stroke({ color: 0x7c552f, width: 2, alpha: 0.35 });
  }
  if (unit.chaosTimer > 0 || unit.knockdownTimer > 0 || unit.lockTimer > 0) {
    plate.circle(x + width / 2 - 20, y - 21 + pulse, 9).fill({
      color: unit.lockTimer > 0 ? 0x4d8ed6 : 0xd94b2f,
      alpha: 0.9,
    });
  }
  layer.addChild(plate);

  if (unit.width === 2 && unit.parts) {
    const bgPath = `resources/img/gameObject/soldier/generalBg${Math.min(4, Math.max(1, unit.tier))}.png`;
    addOriginalSprite(Pixi, layer, textures, bgPath, x, y + pulse, {
      width: width - 6,
      height: CELL - 8,
      alpha: unit.side === "player" ? 1 : 0.8,
    });
    for (let i = 0; i < 2; i += 1) {
      const partPath = generalPartPath(unit.parts[i], unit.tier);
      const part = partPath
        ? addOriginalSprite(Pixi, layer, textures, partPath, x - CELL / 2 + i * CELL, y + 4 + pulse, {
            width: 58,
            height: 58,
            tint: unit.side === "player" ? 0xcd8831 : 0x7c2e24,
          })
        : null;
      if (!part) {
        addText(
          Pixi,
          layer,
          unit.parts[i],
          x - CELL / 2 + i * CELL,
          y - 2 + pulse,
          {
            fill: unit.side === "player" ? 0x1f1a14 : 0x3b1b14,
            fontSize: 48,
            stroke: { color: 0xffedbd, width: 3 },
            align: "center",
          },
        );
      }
    }
    if (unit.weaponId) {
      const weapon = WEAPON_DEFS[unit.weaponId];
      const weaponPath = weaponAssetPath(unit.weaponId);
      const weaponSprite = weaponPath
        ? addOriginalSprite(Pixi, layer, textures, weaponPath, x, y - 36 + pulse, {
            alpha: 0.96,
            rotation: weapon.type === "bow" ? Math.PI / 2 : weapon.type === "pike" ? -0.45 : 0.2,
          })
        : null;
      if (weaponSprite) {
        scaleOriginalSpriteToFit(weaponSprite, 54, 34);
      } else {
        addText(Pixi, layer, weapon.text, x, y - 32 + pulse, {
          fill: weapon.color,
          fontSize: 21,
          stroke: { color: 0x2a1a12, width: 3 },
        });
      }
    }
  } else {
    const soldierPath =
      unit.text === "农"
        ? "resources/img/props/farmer_1.png"
        : `resources/img/gameObject/soldier/soldier_${
            unit.archetype === "bow" ? 1 : unit.archetype === "pike" ? 2 : unit.archetype === "cavalry" ? 3 : 0
          }.png`;
    const soldier = addOriginalSprite(Pixi, layer, textures, soldierPath, x, y + 2 + pulse, {
      alpha: unit.side === "player" ? 1 : 0.78,
      tint: unit.side === "player" ? 0xffffff : 0xffd3c7,
    });
    if (soldier) scaleOriginalSpriteToFit(soldier, 58, 58);
    if (unit.archetype === "pike") {
      const pike = addOriginalSprite(Pixi, layer, textures, "resources/img/gameObject/soldier/pike.png", x + 16, y + 4 + pulse, {
        alpha: 0.92,
        rotation: -0.35,
      });
      if (pike) scaleOriginalSpriteToFit(pike, 22, 54);
    }
    const fontSize = unit.text.length >= 3 ? 28 : unit.text.length === 2 ? 35 : 44;
    addText(
      Pixi,
      layer,
      unit.text,
      x - (soldier ? 1 : 0),
      y - 1 + pulse,
      {
        fill: soldier ? 0x050403 : unit.side === "player" ? 0x1f1a14 : 0x3b1b14,
        fontSize: soldier ? Math.min(fontSize, 34) : fontSize,
        stroke: { color: soldier ? 0xfff3cd : 0xffedbd, width: unit.text.length >= 3 ? 2 : 3 },
        align: "center",
      },
    );
    if (unit.archetype === "civilian" && unit.damage <= 0) {
      addText(Pixi, layer, "z", x + 20, y - 22 + pulse, {
        fill: 0x5e4930,
        fontFamily: "system-ui",
        fontSize: 13,
        fontWeight: "900",
      });
    }
  }
  addText(Pixi, layer, `${unit.tier}`, x + width / 2 - 18, y + 23 + pulse, {
    fill: 0xffffff,
    fontFamily: "system-ui",
    fontSize: 13,
    fontWeight: "900",
    stroke: { color: 0x2b1a12, width: 3 },
  });
}

function drawEnemy(
  Pixi: PixiModule,
  layer: Container,
  state: SongjiangDuelGameState,
  enemy: Enemy,
  textures: LoadedTextures,
) {
  const pos = getEnemyPoint(state, enemy);
  const x = BOARD_X + pos.x * CELL;
  const y = BOARD_Y + pos.y * CELL;
  const isBoss = enemy.bossId !== undefined;
  const mobPath = isBoss
    ? `resources/img/gameObject/enemy/mob_${(enemy.bossId ?? 0) % 4}.png`
    : `resources/img/gameObject/enemy/mob_${enemy.id % 4}.png`;

  if (isBoss && textures.bossSymbols) {
    const stamp = new Pixi.Sprite(textures.bossSymbols);
    stamp.anchor.set(0.5);
    stamp.alpha = 0.28;
    stamp.width = 88;
    stamp.height = 44;
    stamp.position.set(x, y - 5);
    layer.addChild(stamp);
  }

  addOriginalSprite(Pixi, layer, textures, "resources/img/gameObject/enemy/shadow1.png", x, y + 24, {
    width: isBoss ? 74 : 52,
    height: isBoss ? 30 : 22,
    alpha: 0.42,
  });
  const mob = addOriginalSprite(Pixi, layer, textures, mobPath, x, y + (isBoss ? 2 : 5), {
    alpha: isBoss ? 0.92 : 1,
    tint: enemy.targetSide === "player" ? 0xffffff : 0xffd0cc,
  });
  if (mob) scaleOriginalSpriteToFit(mob, isBoss ? 76 : 52, isBoss ? 76 : 52);

  const g = new Pixi.Graphics();
  const radius = isBoss ? 31 + Math.sin(enemy.pulse) * 2 : 20;
  if (!mob || isBoss) {
    g.circle(x, y, radius).fill({
      color: isBoss ? BOSS_DEFS[enemy.bossId ?? 0].color : 0xead094,
      alpha: isBoss ? 0.68 : 0.32,
    });
    g.circle(x, y, radius).stroke({
      color: 0x23140d,
      width: isBoss ? 5 : 3,
      alpha: isBoss ? 0.82 : 0.45,
    });
  }
  const hpRate = Math.max(0, enemy.hp / enemy.maxHp);
  g.roundRect(x - radius, y - radius - 11, radius * 2, 6, 3).fill({
    color: 0x2a1a12,
    alpha: 0.24,
  });
  g.roundRect(x - radius, y - radius - 11, radius * 2 * hpRate, 6, 3).fill({
    color: isBoss ? 0xffe05b : 0xd94b2f,
    alpha: 0.95,
  });
  layer.addChild(g);

  addText(Pixi, layer, enemy.label, x, y, {
    fill: isBoss ? 0x2a130c : 0x3a2418,
    fontSize: isBoss ? 27 : mob ? 20 : 30,
    stroke: { color: mob ? 0xffffff : 0xffedbd, width: mob ? 3 : 2 },
  });
}

function drawTrap(
  Pixi: PixiModule,
  layer: Container,
  trap: SongjiangDuelGameState["traps"][number],
  textures: LoadedTextures,
) {
  const x = BOARD_X + trap.col * CELL + CELL / 2;
  const y = BOARD_Y + trap.row * CELL + CELL / 2;
  const assetPath =
    trap.kind === "landmine"
      ? "resources/img/props/landmine_1.png"
      : "resources/img/props/trap_1.png";
  const sprite = addOriginalSprite(Pixi, layer, textures, assetPath, x, y + 2, {
    alpha: 0.96,
  });
  if (sprite) {
    scaleOriginalSpriteToFit(sprite, 54, 54);
    return;
  }
  const g = new Pixi.Graphics();
  g.circle(x, y, 17).fill({
    color: trap.kind === "landmine" ? 0x9d2f24 : 0x21140d,
    alpha: 0.8,
  });
  g.circle(x, y, 17).stroke({ color: 0xffe2a1, width: 3, alpha: 0.68 });
  layer.addChild(g);
  addText(Pixi, layer, trap.kind === "landmine" ? "雷" : "坑", x, y + 1, {
    fill: 0xfff3c6,
    fontSize: 24,
  });
}

function drawEffect(
  Pixi: PixiModule,
  layer: Container,
  effect: VisualEffect,
  textures: LoadedTextures,
) {
  const x = BOARD_X + effect.x * CELL;
  const y = BOARD_Y + effect.y * CELL;
  const rate = effect.ttl / effect.maxTtl;
  const g = new Pixi.Graphics();
  const radius = (1 - rate) * 42 + 12;
  const color = effect.color;

  if (effect.type === "arrow") {
    if (effect.fromX !== undefined && effect.fromY !== undefined) {
      const fromX = BOARD_X + effect.fromX * CELL;
      const fromY = BOARD_Y + effect.fromY * CELL;
      const progress = 1 - rate;
      const eased = 1 - Math.pow(1 - progress, 2);
      const px = fromX + (x - fromX) * eased;
      const py = fromY + (y - fromY) * eased;
      const angle = Math.atan2(y - fromY, x - fromX);
      const trailX = fromX + (px - fromX) * 0.42;
      const trailY = fromY + (py - fromY) * 0.42;
      const wing = 15;
      const projectileText = effect.text ?? "弓";
      const isInkArrow = projectileText === "弓" || projectileText === "弩";
      const projectilePath =
        projectileText === "pike"
          ? "resources/img/weapon/weapon_10.png"
          : projectileText === "sword"
            ? "resources/img/weapon/weapon_31.png"
            : "resources/img/weapon/arrow_0.png";
      const originalProjectile = addOriginalSprite(Pixi, layer, textures, projectilePath, px, py, {
        alpha: Math.min(0.96, rate + 0.18),
        rotation: angle + Math.PI / 2,
      });
      if (originalProjectile) {
        const fitWidth = projectileText === "pike" ? 74 : projectileText === "sword" ? 54 : 42;
        const fitHeight = projectileText === "pike" ? 88 : projectileText === "sword" ? 70 : 82;
        scaleOriginalSpriteToFit(originalProjectile, fitWidth, fitHeight);

        const trailPath = projectileText === "pike"
          ? "resources/img/effect/hitEffect/pike0.png"
          : projectileText === "sword"
            ? "resources/img/effect/hitEffect/knife0.png"
            : "resources/img/effect/whiteTrail.png";
        const trail = addOriginalSprite(Pixi, layer, textures, trailPath, trailX, trailY, {
          alpha: rate * 0.42,
          rotation: angle + Math.PI / 2,
        });
        if (trail) scaleOriginalSpriteToFit(trail, 64, 46);

        if (isInkArrow) {
          const glyph = addOriginalSprite(
            Pixi,
            layer,
            textures,
            "resources/img/gameObject/soldier/soldier_1.png",
            fromX - Math.cos(angle) * 16,
            fromY - Math.sin(angle) * 16,
            {
              alpha: Math.min(0.9, rate + 0.16),
              rotation: -0.16 + Math.sin(progress * Math.PI) * 0.28,
            },
          );
          if (glyph) scaleOriginalSpriteToFit(glyph, 46, 46);
        }
        return;
      }

      if (isInkArrow) {
        const shaft = 46 + progress * 14;
        const tailX = px - Math.cos(angle) * shaft;
        const tailY = py - Math.sin(angle) * shaft;
        const perpX = Math.cos(angle + Math.PI / 2);
        const perpY = Math.sin(angle + Math.PI / 2);
        const alpha = Math.min(0.95, rate + 0.18);

        g.moveTo(tailX, tailY);
        g.lineTo(px, py);
        g.stroke({ color: 0x15100d, width: 9, alpha: alpha * 0.72, cap: "round" });
        g.moveTo(tailX + perpX * 2.5, tailY + perpY * 2.5);
        g.lineTo(px - Math.cos(angle) * 4, py - Math.sin(angle) * 4);
        g.stroke({ color, width: 3, alpha: alpha * 0.85, cap: "round" });

        g.moveTo(px, py);
        g.lineTo(px - Math.cos(angle - 0.46) * 20, py - Math.sin(angle - 0.46) * 20);
        g.moveTo(px, py);
        g.lineTo(px - Math.cos(angle + 0.46) * 20, py - Math.sin(angle + 0.46) * 20);
        g.stroke({ color: 0x15100d, width: 7, alpha: alpha * 0.8, cap: "round" });
        g.moveTo(tailX, tailY);
        g.lineTo(tailX - Math.cos(angle - 0.7) * 18, tailY - Math.sin(angle - 0.7) * 18);
        g.moveTo(tailX, tailY);
        g.lineTo(tailX - Math.cos(angle + 0.7) * 18, tailY - Math.sin(angle + 0.7) * 18);
        g.stroke({ color: 0x15100d, width: 4, alpha: alpha * 0.54, cap: "round" });

        for (let i = 0; i < 6; i += 1) {
          const seed = effect.id * 0.37 + i * 1.9;
          const along = i * 8 - progress * 10;
          const spread = 3 + (i % 3) * 2;
          g.circle(
            tailX + Math.cos(angle) * along + Math.cos(seed) * spread,
            tailY + Math.sin(angle) * along + Math.sin(seed) * spread,
            1.8 + (i % 2) * 1.2,
          ).fill({ color: 0x15100d, alpha: rate * 0.35 });
        }
        layer.addChild(g);

        const glyph = new Pixi.Text({
          text: projectileText,
          style: {
            fontFamily: FONT,
            fill: color,
            fontSize: 38,
            fontWeight: "900",
            stroke: { color: 0x2a1a12, width: 3 },
          },
        }) as Text;
        glyph.anchor.set(0.5);
        glyph.position.set(fromX - Math.cos(angle) * 16, fromY - Math.sin(angle) * 16);
        glyph.rotation = -0.16 + Math.sin(progress * Math.PI) * 0.28;
        glyph.scale.set(1 + Math.sin(progress * Math.PI) * 0.15);
        glyph.alpha = Math.min(0.9, rate + 0.16);
        layer.addChild(glyph);
        return;
      }

      const alpha = Math.min(0.9, rate + 0.2);
      if (projectileText === "pike") {
        const shaft = 62;
        const tailX = px - Math.cos(angle) * shaft;
        const tailY = py - Math.sin(angle) * shaft;
        const perpX = Math.cos(angle + Math.PI / 2);
        const perpY = Math.sin(angle + Math.PI / 2);

        g.moveTo(tailX, tailY);
        g.lineTo(px, py);
        g.stroke({ color: 0x5b321f, width: 8, alpha: alpha * 0.82, cap: "round" });
        g.moveTo(tailX + perpX * 2, tailY + perpY * 2);
        g.lineTo(px - Math.cos(angle) * 10, py - Math.sin(angle) * 10);
        g.stroke({ color, width: 3, alpha, cap: "round" });
        g.moveTo(px, py);
        g.lineTo(px - Math.cos(angle - 0.36) * 22, py - Math.sin(angle - 0.36) * 22);
        g.lineTo(px - Math.cos(angle) * 12, py - Math.sin(angle) * 12);
        g.lineTo(px - Math.cos(angle + 0.36) * 22, py - Math.sin(angle + 0.36) * 22);
        g.lineTo(px, py);
        g.fill({ color, alpha });
        g.moveTo(tailX + perpX * 12, tailY + perpY * 12);
        g.lineTo(tailX - perpX * 12, tailY - perpY * 12);
        g.stroke({ color: 0x2a1a12, width: 4, alpha: alpha * 0.75, cap: "round" });
      } else if (projectileText === "sword") {
        const tailX = px - Math.cos(angle) * 46;
        const tailY = py - Math.sin(angle) * 46;
        const perpX = Math.cos(angle + Math.PI / 2);
        const perpY = Math.sin(angle + Math.PI / 2);

        g.moveTo(trailX, trailY);
        g.lineTo(px, py);
        g.stroke({ color, width: 6, alpha: alpha * 0.45, cap: "round" });
        g.moveTo(px, py);
        g.lineTo(tailX + perpX * 8, tailY + perpY * 8);
        g.lineTo(tailX - perpX * 8, tailY - perpY * 8);
        g.lineTo(px, py);
        g.fill({ color: 0xfff4c7, alpha });
        g.stroke({ color, width: 3, alpha, join: "round" });
        g.moveTo(tailX + perpX * 14, tailY + perpY * 14);
        g.lineTo(tailX - perpX * 14, tailY - perpY * 14);
        g.stroke({ color: 0x2a1a12, width: 4, alpha: alpha * 0.82, cap: "round" });
      } else {
        g.moveTo(trailX, trailY);
        g.lineTo(px, py);
        g.stroke({ color, width: 6, alpha, cap: "round" });
        g.moveTo(px, py);
        g.lineTo(px - Math.cos(angle - 0.55) * wing, py - Math.sin(angle - 0.55) * wing);
        g.moveTo(px, py);
        g.lineTo(px - Math.cos(angle + 0.55) * wing, py - Math.sin(angle + 0.55) * wing);
        g.stroke({ color: 0xfff0aa, width: 4, alpha: Math.min(1, rate + 0.25), cap: "round" });
      }
      layer.addChild(g);
      return;
    }
    g.moveTo(x - 28 * rate, y + 8 * rate);
    g.lineTo(x + 24, y - 6);
    g.stroke({ color, width: 5, alpha: rate, cap: "round" });
  } else if (effect.type === "dig") {
    const progress = 1 - rate;
    const swing = Math.sin(progress * Math.PI * 3) * 0.55 - 0.35;
    const crack = 10 + progress * 25;

    for (let i = 0; i < 5; i += 1) {
      const angle = -1.6 + i * 0.78;
      g.moveTo(x, y + 8);
      g.lineTo(x + Math.cos(angle) * crack, y + 8 + Math.sin(angle) * crack * 0.45);
    }
    g.stroke({ color: 0x6c4b2e, width: 4, alpha: rate * 0.8, cap: "round" });
    for (let i = 0; i < 6; i += 1) {
      const angle = i * 1.05 + progress * 2;
      g.circle(
        x + Math.cos(angle) * (14 + progress * 18),
        y + 18 + Math.sin(angle) * (8 + progress * 10),
        3 + (i % 2),
      ).fill({ color: 0x8a6740, alpha: rate * 0.75 });
    }
    layer.addChild(g);

    const shovelSprite = addOriginalSprite(
      Pixi,
      layer,
      textures,
      "resources/img/props/shovel_1.png",
      x - 8 + Math.sin(progress * Math.PI) * 18,
      y - 12 + progress * 18,
      {
        anchorY: 0.8,
        rotation: swing,
        alpha: Math.min(1, rate + 0.25),
      },
    );
    if (shovelSprite) {
      scaleOriginalSpriteToFit(shovelSprite, 48, 62);
      return;
    }

    const shovel = new Pixi.Text({
      text: effect.text ?? "铲",
      style: {
        fontFamily: FONT,
        fill: 0x2a1a12,
        fontSize: 44,
        fontWeight: "900",
        stroke: { color: 0xffecad, width: 3 },
      },
    }) as Text;
    shovel.anchor.set(0.5, 0.8);
    shovel.position.set(x - 8 + Math.sin(progress * Math.PI) * 18, y - 12 + progress * 18);
    shovel.rotation = swing;
    shovel.alpha = Math.min(1, rate + 0.25);
    layer.addChild(shovel);
    return;
  } else if (effect.type === "gold") {
    const progress = 1 - rate;
    const gold = addOriginalSprite(
      Pixi,
      layer,
      textures,
      "resources/img/battleUI/gold.png",
      x,
      y - progress * 28,
      {
        alpha: Math.min(1, rate + 0.2),
      },
    );
    if (gold) {
      scaleOriginalSpriteToFit(gold, 34 + progress * 10, 34 + progress * 10);
    } else {
      g.circle(x, y - progress * 28, 15 + progress * 8).fill({
        color: 0xffd85a,
        alpha: rate * 0.28,
      });
      g.circle(x, y - progress * 28, 15 + progress * 8).stroke({
        color: 0x8a5524,
        width: 3,
        alpha: rate * 0.7,
      });
      layer.addChild(g);
    }
    addText(Pixi, layer, effect.text ?? "+1", x, y - progress * 44, {
      fill: 0xffd85a,
      fontFamily: "system-ui",
      fontSize: 26 + progress * 8,
      fontWeight: "900",
      stroke: { color: 0x2a1a12, width: 4 },
    }).alpha = rate;
    return;
  } else if (effect.type === "slash") {
    const slashPath =
      effect.text === "剑气"
        ? "resources/img/effect/hitEffect/DaoQiHit0.png"
        : effect.text === "枪" || effect.text === "戟" || effect.text === "矛"
          ? "resources/img/effect/hitEffect/pike0.png"
          : "resources/img/effect/hitEffect/knife0.png";
    const slash = addOriginalSprite(Pixi, layer, textures, slashPath, x, y, {
      alpha: rate,
      rotation: Math.sin(effect.id) * 0.35,
      tint: effect.text === "枪" || effect.text === "戟" || effect.text === "矛" ? 0xffffff : undefined,
    });
    if (slash) {
      slash.scale.set((0.48 + (1 - rate) * 0.32) * (effect.text === "剑气" ? 1.2 : 1));
      return;
    }
    g.arc(x, y, radius, -0.8, 0.75).stroke({
      color,
      width: 7,
      alpha: rate,
      cap: "round",
    });
  } else {
    const hitPath =
      effect.type === "fire"
        ? "resources/img/effect/explode0.png"
        : effect.type === "ice"
          ? "resources/img/effect/iceSlashEff01.png"
          : effect.type === "smoke"
            ? "resources/img/effect/smoke1.png"
            : effect.type === "hit"
              ? "resources/img/effect/hitEffect/blood0.png"
              : effect.type === "ink"
                ? "resources/img/props/ink.png"
                : null;
    if (hitPath) {
      const hit = addOriginalSprite(Pixi, layer, textures, hitPath, x, y, {
        alpha: Math.min(0.95, rate + 0.1),
      });
      if (hit) {
        scaleOriginalSpriteToFit(hit, 72 + (1 - rate) * 24, 72 + (1 - rate) * 24);
        return;
      }
    }
    g.circle(x, y, radius).stroke({ color, width: 5, alpha: rate });
    g.circle(x, y, radius * 0.45).fill({ color, alpha: rate * 0.18 });
  }
  layer.addChild(g);

  if (effect.text) {
    addText(Pixi, layer, effect.text, x, y - 4 - (1 - rate) * 20, {
      fill: color,
      fontSize: effect.text.length > 2 ? 28 : 34,
      stroke: { color: 0x2a1a12, width: 3 },
    });
  }
}

function drawAdouEndpoint(
  Pixi: PixiModule,
  layer: Container,
  state: SongjiangDuelGameState,
  textures: LoadedTextures,
  side: Side,
) {
  const route = state.map.routes[side];
  const end = route[route.length - 1];
  if (!end) return;

  const runtime = state.side[side];
  const entryRate = 1 - Math.min(1, runtime.entryTimer / 1.25);
  const hurtRate = Math.min(1, runtime.hurtTimer / 0.55);
  const baseX = BOARD_X + end.col * CELL + CELL * 0.62;
  const baseY = BOARD_Y + end.row * CELL + CELL * 0.96;
  const sidePhase = side === "player" ? 0 : Math.PI;
  const idleLift = Math.sin(state.elapsed * 3.2 + sidePhase) * 2.2;
  const shake = hurtRate > 0 ? Math.sin(runtime.hurtTimer * 72) * 8 * hurtRate : 0;
  const container = new Pixi.Container();
  container.position.set(baseX + shake, baseY + idleLift - (1 - entryRate) * 42);
  container.scale.set(0.88 + entryRate * 0.12 + hurtRate * 0.05);
  container.rotation =
    hurtRate > 0
      ? Math.sin(runtime.hurtTimer * 52) * 0.08
      : Math.sin(state.elapsed * 1.7 + sidePhase) * 0.015;
  container.alpha = 0.35 + entryRate * 0.65;
  layer.addChild(container);

  const shadow = new Pixi.Graphics();
  shadow.ellipse(0, 6, 42, 12).fill({ color: 0x1b100a, alpha: 0.2 });
  container.addChild(shadow);

  const robeTexture = directTexture(textures, "adou:robe");
  if (robeTexture) {
    const robe = new Pixi.Sprite(robeTexture);
    robe.anchor.set(0.5, 0.85);
    robe.position.set(8, -9);
    robe.width = 54;
    robe.height = 64;
    robe.alpha = 0.92;
    container.addChild(robe);
  }

  const inkTexture = directTexture(textures, "adou:ink");
  if (inkTexture) {
    const ink = new Pixi.Sprite(inkTexture);
    ink.anchor.set(0.48, 0.84);
    ink.position.set(-5, -14);
    ink.width = 72;
    ink.height = 104;
    ink.alpha = 0.96;
    container.addChild(ink);
  }

  addText(Pixi, container, "阿斗", 0, -48 + Math.sin(state.elapsed * 5) * 2, {
    fill: hurtRate > 0 ? 0xd83b2f : 0x2a1a12,
    fontSize: 30,
    stroke: { color: 0xffefbd, width: 4 },
  });

  const maxHearts = Math.min(9, Math.max(1, Math.ceil(runtime.maxHp)));
  const fullHearts = Math.max(0, Math.ceil(runtime.hp));
  const heartFull = originalTexture(textures, "resources/img/battleUI/heart1.png");
  const heartEmpty = originalTexture(textures, "resources/img/battleUI/heart4.png") ?? heartFull;
  for (let index = 0; index < maxHearts; index += 1) {
    const texture = index < fullHearts ? heartFull : heartEmpty;
    const columns = Math.min(3, maxHearts);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const visibleColumns = row === Math.floor((maxHearts - 1) / 3) ? ((maxHearts - 1) % 3) + 1 : columns;
    const x = (col - (visibleColumns - 1) / 2) * 22;
    const y = -92 - row * 19;
    if (texture) {
      const heart = new Pixi.Sprite(texture);
      heart.anchor.set(0.5);
      heart.position.set(x, y);
      heart.width = 20;
      heart.height = 18;
      heart.alpha = index < fullHearts ? 0.98 : 0.36;
      container.addChild(heart);
    } else {
      addText(Pixi, container, index < fullHearts ? "♥" : "♡", x, y, {
        fill: index < fullHearts ? 0xd83b2f : 0x6d4a2c,
        fontSize: 18,
      });
    }
  }

  if (hurtRate > 0) {
    const flash = new Pixi.Graphics();
    flash.circle(0, -40, 58 + hurtRate * 12).fill({ color: 0xe23f2d, alpha: 0.12 * hurtRate });
    flash.circle(0, -40, 58 + hurtRate * 12).stroke({ color: 0xffe3a5, width: 4, alpha: 0.45 * hurtRate });
    container.addChildAt(flash, 1);
  }
}

function drawScene(
  Pixi: PixiModule,
  app: Application,
  root: Container,
  state: SongjiangDuelGameState,
  textures: LoadedTextures,
  selectedCard: HandCard | null,
  selectedUnitId: number | null,
) {
  for (const child of root.removeChildren()) {
    child.destroy({ children: true });
  }
  fitStage(app, root);

  if (textures.paperFrame) {
    const paper = new Pixi.Sprite(textures.paperFrame);
    paper.width = VIEW_WIDTH;
    paper.height = VIEW_HEIGHT;
    paper.alpha = 0.96;
    root.addChild(paper);
  } else {
    const bg = new Pixi.Graphics();
    bg.roundRect(18, 18, VIEW_WIDTH - 36, VIEW_HEIGHT - 36, 36).fill(0xf0dfbd);
    root.addChild(bg);
  }

  const routeLayer = new Pixi.Graphics();
  const playerRoute = state.map.routes.player.map((p) => ({
    x: BOARD_X + (p.col + 0.5) * CELL,
    y: BOARD_Y + (p.row + 0.5) * CELL,
  }));
  const aiRoute = state.map.routes.ai.map((p) => ({
    x: BOARD_X + (p.col + 0.5) * CELL,
    y: BOARD_Y + (p.row + 0.5) * CELL,
  }));
  drawRoughLine(routeLayer, playerRoute, 0x287f9b, 13, 0.22);
  drawRoughLine(routeLayer, aiRoute, 0xaf5034, 13, 0.18);
  root.addChild(routeLayer);

  const board = new Pixi.Container();
  const boardBg = new Pixi.Graphics();
  boardBg.roundRect(BOARD_X - 18, BOARD_Y - 18, BOARD_COLS * CELL + 36, BOARD_ROWS * CELL + 36, 22).fill({
    color: 0x2a1a12,
    alpha: 0.12,
  });
  board.addChild(boardBg);
  for (const tile of state.tiles) drawTile(Pixi, board, tile, selectedCard, textures);
  root.addChild(board);

  if (selectedUnitId !== null) {
    const unit = state.units.find((candidate) => candidate.id === selectedUnitId && candidate.side === "player");
    if (unit) {
      const range = getUnitAttackRange(state, unit);
      const x = BOARD_X + (unit.col + unit.width / 2) * CELL;
      const y = BOARD_Y + (unit.row + 0.5) * CELL;
      const g = new Pixi.Graphics();
      if (range > 0) {
        g.circle(x, y, range * CELL).fill({ color: 0x66d7ff, alpha: 0.11 });
        g.circle(x, y, range * CELL).stroke({ color: 0x2a9fbd, width: 5, alpha: 0.5 });
      }
      g.roundRect(
        BOARD_X + unit.col * CELL + 4,
        BOARD_Y + unit.row * CELL + 4,
        unit.width * CELL - 8,
        CELL - 8,
        10,
      ).stroke({ color: 0xffe05b, width: 6, alpha: 0.92 });
      root.addChild(g);
    }
  }

  const title = new Pixi.Graphics();
  title.roundRect(80, 70, 740, 72, 18).fill({ color: 0xfff0c2, alpha: 0.58 });
  title.roundRect(80, 70, 740, 72, 18).stroke({ color: 0x2b1a12, width: 4, alpha: 0.38 });
  root.addChild(title);
  addText(Pixi, root, "脚软的阿斗", 172, 106, {
    fill: 0xa6372e,
    fontSize: 38,
    stroke: { color: 0xffefbd, width: 3 },
  }, 0, 0.5);
  addText(Pixi, root, `${state.map.name} · 第 ${state.round} 波`, 728, 106, {
    fill: 0x2a1a12,
    fontSize: 30,
  });

  drawAdouEndpoint(Pixi, root, state, textures, "player");
  drawAdouEndpoint(Pixi, root, state, textures, "ai");

  for (const trap of state.traps) drawTrap(Pixi, root, trap, textures);
  for (const unit of state.units) drawUnit(Pixi, root, unit, textures);
  for (const enemy of state.enemies) drawEnemy(Pixi, root, state, enemy, textures);
  for (const effect of state.effects) drawEffect(Pixi, root, effect, textures);

  for (const text of state.floatTexts) {
    const rate = text.ttl / text.maxTtl;
    addText(Pixi, root, text.text, BOARD_X + text.x * CELL, BOARD_Y + text.y * CELL - (1 - rate) * 36, {
      fill: text.color,
      fontSize: 28,
      stroke: { color: 0x2a1a12, width: 3 },
    }).alpha = rate;
  }

  if (state.side.player.blindTimer > 0) {
    const blind = new Pixi.Graphics();
    blind.rect(BOARD_X - 18, BOARD_Y - 18, BOARD_COLS * CELL + 36, BOARD_ROWS * CELL + 36).fill({
      color: 0x1b1714,
      alpha: 0.28,
    });
    root.addChild(blind);
    addText(Pixi, root, "花石纲遮眼", VIEW_WIDTH / 2, BOARD_Y + 42, {
      fill: 0xffe27a,
      fontSize: 36,
      stroke: { color: 0x2a1a12, width: 4 },
    });
  }
}

function getCanvasCell(
  event: MouseEvent | PointerEvent,
  app: Application,
  root: Container,
) {
  const rect = app.canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * (app.screen.width / rect.width);
  const py = (event.clientY - rect.top) * (app.screen.height / rect.height);
  const vx = (px - root.position.x) / root.scale.x;
  const vy = (py - root.position.y) / root.scale.y;
  const col = Math.floor((vx - BOARD_X) / CELL);
  const row = Math.floor((vy - BOARD_Y) / CELL);
  if (col < 0 || col >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return null;
  return { col, row };
}

async function loadTextures(Pixi: PixiModule) {
  const manifest = await loadSongjiangAssetManifest();
  const sources = manifest.assets.map((asset) => asset.src);
  const loaded = (await Pixi.Assets.load(sources)) as Record<string, Texture>;
  const textures: LoadedTextures = {};
  for (const asset of manifest.assets) {
    textures[asset.id] = loaded[asset.src] ?? Pixi.Texture.from(asset.src);
  }
  try {
    const originalManifest = await loadSongjiangOriginalAtlasManifest();
    const atlasImages = originalManifest.atlases.map(
      (atlas) => `${ORIGINAL_ASSET_BASE}${atlas.image}`,
    );
    const loadedAtlases = (await Pixi.Assets.load(atlasImages)) as Record<string, Texture>;
    const original: Record<string, OriginalTextureFrame> = {};

    for (const atlas of originalManifest.atlases) {
      const imageSrc = `${ORIGINAL_ASSET_BASE}${atlas.image}`;
      const sourceTexture = loadedAtlases[imageSrc] ?? Pixi.Texture.from(imageSrc);
      for (const [path, atlasFrame] of Object.entries(atlas.frames)) {
        const frame = new Pixi.Rectangle(
          atlasFrame.frame.x,
          atlasFrame.frame.y,
          atlasFrame.frame.w,
          atlasFrame.frame.h,
        );
        const orig = new Pixi.Rectangle(0, 0, atlasFrame.sourceSize.w, atlasFrame.sourceSize.h);
        const trim = new Pixi.Rectangle(
          atlasFrame.spriteSourceSize.x,
          atlasFrame.spriteSourceSize.y,
          atlasFrame.frame.w,
          atlasFrame.frame.h,
        );
        original[path] = {
          texture: new Pixi.Texture({
            source: sourceTexture.source,
            frame,
            orig,
            trim,
            label: path,
          }),
          atlasFrame,
        };
      }
    }
    textures.original = original;
  } catch (error) {
    console.warn("Unable to load original Songjiang atlas textures.", error);
  }
  try {
    const directSources = ORIGINAL_DIRECT_ASSETS.map((path) => `${ORIGINAL_ASSET_BASE}${path}`);
    const loadedDirect = (await Pixi.Assets.load(directSources)) as Record<string, Texture>;
    const direct: Record<string, Texture> = {};
    for (const path of ORIGINAL_DIRECT_ASSETS) {
      const src = `${ORIGINAL_ASSET_BASE}${path}`;
      direct[path] = loadedDirect[src] ?? Pixi.Texture.from(src);
    }
    const adouSheet = direct["resources/anim/aDou/skeleton.png"];
    if (adouSheet) {
      direct["adou:ink"] = new Pixi.Texture({
        source: adouSheet.source,
        frame: new Pixi.Rectangle(0, 0, 78, 116),
        label: "adou:ink",
      });
      direct["adou:robe"] = new Pixi.Texture({
        source: adouSheet.source,
        frame: new Pixi.Rectangle(142, 50, 66, 78),
        label: "adou:robe",
      });
    }
    textures.direct = direct;
  } catch (error) {
    console.warn("Unable to load original Adou direct textures.", error);
  }
  return textures;
}

export function SongjiangDuel() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const t = useTranslations("SongjiangDuel");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const rootRef = useRef<Container | null>(null);
  const texturesRef = useRef<LoadedTextures>({});
  const audioRef = useRef<ReturnType<typeof createSongjiangAudioEngine> | null>(null);
  const phaseRef = useRef<GamePhase>("title");
  const loadoutRef = useRef<GameLoadout>(cloneLoadout(DEFAULT_GAME_LOADOUT));
  const initialGame = useMemo(
    () => createSongjiangDuelGame("yuncheng", createSeededRandom(20260618), cloneLoadout(DEFAULT_GAME_LOADOUT)),
    [],
  );
  const stateRef = useRef<SongjiangDuelGameState>(initialGame);
  const selectedRef = useRef<number | null>(null);
  const selectedUnitRef = useRef<number | null>(null);
  const hudTimerRef = useRef(0);
  const renderTimerRef = useRef(0);
  const noticeTimerRef = useRef<number | null>(null);
  const costTimerRef = useRef<number | null>(null);
  const [hud, setHud] = useState(() => makeHud(initialGame));
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedUnitText, setSelectedUnitText] = useState("");
  const [inspectedUnit, setInspectedUnit] = useState<InspectedUnitSnapshot | null>(null);
  const [phase, setPhase] = useState<GamePhase>("title");
  const [assetStatus, setAssetStatus] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState<DragState>(null);
  const [refreshAnimId, setRefreshAnimId] = useState(0);
  const [costPop, setCostPop] = useState<{ id: number; text: string } | null>(null);
  const [loadout, setLoadout] = useState<GameLoadout>(() => cloneLoadout(DEFAULT_GAME_LOADOUT));
  const [titlePanel, setTitlePanel] = useState<TitlePanel>("skills");
  const [selectedGeneralId, setSelectedGeneralId] = useState("赵云");
  const [activeConfigSlot, setActiveConfigSlot] = useState(0);
  const [hoverTip, setHoverTip] = useState<HoverTip>(null);

  const maps = useMemo(() => getMapDefs(), []);
  const generalCodex = useMemo(() => getGeneralCodex(), []);
  const weaponCodex = useMemo(() => getWeaponCodex(), []);
  const selectedCard = selected === null ? null : hud.hand[selected] ?? null;
  const selectedGeneral =
    generalCodex.find((general) => general.id === selectedGeneralId) ?? generalCodex[0]!;
  const selectedGeneralWeaponId =
    loadout.weaponAssignments[selectedGeneral.display] ?? selectedGeneral.defaultWeaponId;
  const selectedGeneralWeapon = WEAPON_DEFS[selectedGeneralWeaponId];
  const compatibleWeapons = getCompatibleWeaponsForGeneral(selectedGeneral.display);

  const showHoverTipForElement = useCallback((text: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const margin = 12;
    const gap = 18;
    const width = Math.min(280, window.innerWidth - margin * 2);
    const reservedHeight = 150;
    let x = rect.right + gap;
    if (x + width > window.innerWidth - margin) x = rect.left - width - gap;
    x = Math.max(margin, Math.min(x, window.innerWidth - width - margin));

    let y = rect.top + rect.height / 2 - 44;
    if (y + reservedHeight > window.innerHeight - margin) y = rect.top - reservedHeight - gap;
    if (y < margin) y = rect.bottom + gap;
    y = Math.max(margin, Math.min(y, window.innerHeight - reservedHeight - margin));

    setHoverTip({ text, x, y });
  }, []);

  const hideHoverTip = useCallback(() => {
    setHoverTip(null);
  }, []);

  const tooltipProps = useCallback(
    (text: string) => ({
      "data-songjiang-tooltip": text,
      onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
        showHoverTipForElement(text, event.currentTarget);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        showHoverTipForElement(text, event.currentTarget);
      },
      onPointerLeave: hideHoverTip,
      onPointerCancel: hideHoverTip,
      onFocus: (event: ReactFocusEvent<HTMLElement>) => {
        showHoverTipForElement(text, event.currentTarget);
      },
      onBlur: hideHoverTip,
    }),
    [hideHoverTip, showHoverTipForElement],
  );

  useEffect(() => {
    const updateTipFromPoint = (event: PointerEvent | MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const host =
        target instanceof HTMLElement
          ? target.closest<HTMLElement>("[data-songjiang-tooltip]")
          : null;
      const text = host?.dataset.songjiangTooltip;
      if (text) {
        showHoverTipForElement(text, host);
      } else {
        setHoverTip(null);
      }
    };

    const updateTipFromFocus = (event: FocusEvent) => {
      const target = event.target;
      const host =
        target instanceof HTMLElement
          ? target.closest<HTMLElement>("[data-songjiang-tooltip]")
          : null;
      const text = host?.dataset.songjiangTooltip;
      if (!text || !host) return;
      showHoverTipForElement(text, host);
    };

    window.addEventListener("pointermove", updateTipFromPoint, { passive: true });
    window.addEventListener("mousemove", updateTipFromPoint, { passive: true });
    window.addEventListener("pointerdown", updateTipFromPoint, { passive: true });
    document.addEventListener("focusin", updateTipFromFocus);
    document.addEventListener("focusout", hideHoverTip);
    return () => {
      window.removeEventListener("pointermove", updateTipFromPoint);
      window.removeEventListener("mousemove", updateTipFromPoint);
      window.removeEventListener("pointerdown", updateTipFromPoint);
      document.removeEventListener("focusin", updateTipFromFocus);
      document.removeEventListener("focusout", hideHoverTip);
    };
  }, [hideHoverTip, showHoverTipForElement]);

  const setGamePhase = useCallback((nextPhase: GamePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const syncHud = useCallback(() => {
    const state = stateRef.current;
    setHud(makeHud(state));
    const unitId = selectedUnitRef.current;
    const unit = unitId === null ? null : state.units.find((candidate) => candidate.id === unitId && candidate.side === "player") ?? null;
    setInspectedUnit(cloneInspectedUnit(state, unit));
  }, []);

  const setSelectedUnit = useCallback((unitId: number | null) => {
    selectedUnitRef.current = unitId;
    const state = stateRef.current;
    const unit = unitId === null ? null : state.units.find((candidate) => candidate.id === unitId);
    setSelectedUnitId(unitId);
    setSelectedUnitText(unit?.text ?? "");
    setInspectedUnit(cloneInspectedUnit(state, unit ?? null));
  }, []);

  const setSelectedCard = useCallback((index: number | null) => {
    selectedRef.current = index;
    setSelected(index);
    if (index !== null) setSelectedUnit(null);
  }, [setSelectedUnit]);

  const updateLoadout = useCallback((recipe: (current: GameLoadout) => GameLoadout) => {
    setLoadout((current) => {
      const next = recipe(cloneLoadout(current));
      loadoutRef.current = cloneLoadout(next);
      window.localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(LOADOUT_STORAGE_KEY);
        if (!raw) return;
        const stored = normalizeStoredLoadout(JSON.parse(raw));
        loadoutRef.current = cloneLoadout(stored);
        setLoadout(stored);
        restartSongjiangDuelGame(stateRef.current, stateRef.current.map.id, stored);
        syncHud();
      } catch {
        window.localStorage.removeItem(LOADOUT_STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [syncHud]);

  const getAudio = useCallback(() => {
    audioRef.current ??= createSongjiangAudioEngine();
    return audioRef.current;
  }, []);

  const flushAudio = useCallback(() => {
    const events = consumeSongjiangAudioEvents(stateRef.current);
    if (events.length > 0) getAudio().consume(events);
  }, [getAudio]);

  useEffect(() => {
    return () => {
      audioRef.current?.stopMusic();
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setNotice(message);
    if (message) {
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice("");
        noticeTimerRef.current = null;
      }, 1800);
    }
  }, []);

  const playCard = useCallback(
    (index: number, target: PlayTarget) => {
      if (phaseRef.current !== "playing") return;
      const result = playHandCard(stateRef.current, "player", index, target);
      showNotice(result.message ?? "");
      flushAudio();
      if (result.ok) {
        setSelectedCard(null);
        setSelectedUnit(null);
      }
      syncHud();
    },
    [flushAudio, setSelectedCard, setSelectedUnit, showNotice, syncHud],
  );

  const playSelected = useCallback(
    (target: PlayTarget) => {
      const index = selectedRef.current;
      if (index === null) return;
      playCard(index, target);
    },
    [playCard],
  );

  const playActiveProp = useCallback(
    (index: number, target: PlayTarget) => {
      if (phaseRef.current !== "playing") return;
      const result = activateProp(stateRef.current, "player", index, target);
      showNotice(result.message ?? "");
      flushAudio();
      if (result.ok) {
        setSelectedCard(null);
        setSelectedUnit(null);
      }
      syncHud();
    },
    [flushAudio, setSelectedCard, setSelectedUnit, showNotice, syncHud],
  );

  const dropUnitAtPoint = useCallback(
    (unitId: number, clientX: number, clientY: number) => {
      const element = document.elementFromPoint(clientX, clientY);
      const slot = element?.closest<HTMLElement>("[data-songjiang-hand-index]");
      const targetIndex = Number(slot?.dataset.songjiangHandIndex);
      if (slot && Number.isInteger(targetIndex)) {
        const result = returnUnitToHand(stateRef.current, "player", unitId, targetIndex);
        showNotice(result.message ?? "");
        flushAudio();
        if (result.ok) setSelectedUnit(null);
        syncHud();
        return;
      }

      const currentApp = appRef.current;
      const currentRoot = rootRef.current;
      if (!currentApp || !currentRoot) return;
      const cell = getCanvasCell({ clientX, clientY } as PointerEvent, currentApp, currentRoot);
      if (!cell) return;
      const result = moveUnit(stateRef.current, "player", unitId, cell);
      showNotice(result.message ?? "");
      flushAudio();
      const stillThere = stateRef.current.units.some((unit) => unit.id === unitId);
      setSelectedUnit(result.ok && stillThere ? unitId : null);
      syncHud();
    },
    [flushAudio, setSelectedUnit, showNotice, syncHud],
  );

  const restart = useCallback((mapId = stateRef.current.map.id) => {
    restartSongjiangDuelGame(stateRef.current, mapId, loadoutRef.current);
    audioRef.current?.stopMusic();
    setSelectedCard(null);
    setSelectedUnit(null);
    showNotice("");
    setDragging(null);
    syncHud();
  }, [setSelectedCard, setSelectedUnit, showNotice, syncHud]);

  const startGame = useCallback(() => {
    getAudio().preloadCore();
    startSongjiangDuelGame(stateRef.current, stateRef.current.map.id, loadoutRef.current);
    flushAudio();
    setSelectedCard(null);
    setSelectedUnit(null);
    showNotice("");
    setDragging(null);
    syncHud();
    setGamePhase("playing");
  }, [flushAudio, getAudio, setGamePhase, setSelectedCard, setSelectedUnit, showNotice, syncHud]);

  const returnToTitle = useCallback(() => {
    audioRef.current?.stopMusic();
    setGamePhase("title");
    setSelectedCard(null);
    setSelectedUnit(null);
    showNotice("");
    setDragging(null);
    syncHud();
  }, [setGamePhase, setSelectedCard, setSelectedUnit, showNotice, syncHud]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
      if (costTimerRef.current !== null) window.clearTimeout(costTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanupCanvas: (() => void) | null = null;

    async function startPixi() {
      const host = stageRef.current;
      if (!host) return;
      const Pixi = await import("pixi.js");
      await document.fonts?.load(`48px ${FONT}`);
      await document.fonts?.ready;

      const app = new Pixi.Application();
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        preference: "webgl",
        preserveDrawingBuffer: true,
      });
      if (disposed) {
        app.destroy();
        return;
      }

      appRef.current = app;
      app.canvas.className = "h-full w-full touch-none";
      host.appendChild(app.canvas);

      const root = new Pixi.Container();
      rootRef.current = root;
      app.stage.addChild(root);

      try {
        texturesRef.current = await loadTextures(Pixi);
        if (!disposed) setAssetStatus("ready");
      } catch {
        if (!disposed) setAssetStatus("error");
      }

      const startUnitDrag = (event: PointerEvent, unit: Unit) => {
        event.preventDefault();
        setSelectedCard(null);
        setSelectedUnit(unit.id);
        showNotice("显示攻击范围");
        setDragging({ source: "unit", unitId: unit.id, text: unit.text, x: event.clientX, y: event.clientY });

        const move = (moveEvent: PointerEvent) => {
          setDragging((current) =>
            current?.source === "unit" && current.unitId === unit.id
              ? { ...current, x: moveEvent.clientX, y: moveEvent.clientY }
              : current,
          );
        };
        const finish = (upEvent: PointerEvent) => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", cancel);
          setDragging(null);
          dropUnitAtPoint(unit.id, upEvent.clientX, upEvent.clientY);
        };
        const cancel = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", cancel);
          setDragging(null);
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", cancel);
      };

      const handlePointer = (event: PointerEvent) => {
        const currentApp = appRef.current;
        const currentRoot = rootRef.current;
        if (!currentApp || !currentRoot) return;
        const cell = getCanvasCell(event, currentApp, currentRoot);
        if (!cell) return;
        if (selectedRef.current !== null) {
          playSelected({ type: "cell", col: cell.col, row: cell.row });
          return;
        }
        const unit = getUnitAt(stateRef.current, cell.col, cell.row);
        if (unit?.side === "player") {
          startUnitDrag(event, unit);
          return;
        }
        setSelectedUnit(null);
      };
      app.canvas.addEventListener("pointerdown", handlePointer);

      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        if (phaseRef.current === "playing") {
          updateSongjiangDuelGame(stateRef.current, dt);
          flushAudio();
        }
        renderTimerRef.current += dt;
        if (renderTimerRef.current >= 1 / 20) {
          renderTimerRef.current = 0;
          drawScene(
            Pixi,
            app,
            root,
            stateRef.current,
            texturesRef.current,
            selectedRef.current === null
              ? null
              : stateRef.current.side.player.hand[selectedRef.current] ?? null,
            selectedUnitRef.current,
          );
        }
        hudTimerRef.current += dt;
        if (hudTimerRef.current > 0.12) {
          hudTimerRef.current = 0;
          syncHud();
        }
      });

      cleanupCanvas = () => {
        app.canvas.removeEventListener("pointerdown", handlePointer);
        app.destroy(true, { children: true });
      };
    }

    void startPixi();

    return () => {
      disposed = true;
      cleanupCanvas?.();
      appRef.current = null;
      rootRef.current = null;
    };
  }, [dropUnitAtPoint, flushAudio, playSelected, setSelectedCard, setSelectedUnit, showNotice, syncHud]);

  const chooseCard = (index: number) => {
    if (phase !== "playing") return;
    const active = selectedRef.current;
    const activeCard = active === null ? null : stateRef.current.side.player.hand[active];
    const nextCard = stateRef.current.side.player.hand[index];
    if (active !== null && activeCard?.kind === "prop") {
      const target = activeCard.propId ? PROP_DEFS[activeCard.propId].target : "none";
      if (target === "hand") {
        playSelected({ type: "hand", index });
        return;
      }
    }
    if (active !== null && active !== index && activeCard && activeCard.kind !== "prop") {
      const result = moveHandCard(stateRef.current, "player", active, index);
      showNotice(result.message ?? "");
      flushAudio();
      if (result.ok) {
        setSelectedCard(null);
        setSelectedUnit(null);
      }
      syncHud();
      return;
    }
    if (!nextCard) {
      setSelectedCard(null);
      setSelectedUnit(null);
      showNotice(t("emptySlot"));
      return;
    }
    setSelectedCard(active === index ? null : index);
    showNotice("");
  };

  const dropCardAtPoint = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const card = stateRef.current.side.player.hand[index];
      if (!card) return;

      const element = document.elementFromPoint(clientX, clientY);
      const slot = element?.closest<HTMLElement>("[data-songjiang-hand-index]");
      const targetIndex = Number(slot?.dataset.songjiangHandIndex);
      if (slot && Number.isInteger(targetIndex)) {
        if (card.kind === "prop" && card.propId && PROP_DEFS[card.propId].target === "hand") {
          playCard(index, { type: "hand", index: targetIndex });
          return;
        }
        if (targetIndex !== index) {
          const result = moveHandCard(stateRef.current, "player", index, targetIndex);
          showNotice(result.message ?? "");
          flushAudio();
          if (result.ok) {
            setSelectedCard(null);
            setSelectedUnit(null);
          }
          syncHud();
        }
        return;
      }

      const currentApp = appRef.current;
      const currentRoot = rootRef.current;
      if (!currentApp || !currentRoot) return;
      const cell = getCanvasCell({ clientX, clientY } as PointerEvent, currentApp, currentRoot);
      if (!cell) return;
      playCard(index, { type: "cell", col: cell.col, row: cell.row });
    },
    [flushAudio, playCard, setSelectedCard, setSelectedUnit, showNotice, syncHud],
  );

  const dropActivePropAtPoint = useCallback(
    (index: number, propId: PropId, clientX: number, clientY: number) => {
      const target = PROP_DEFS[propId].target;
      if (target === "none") {
        playActiveProp(index, { type: "none" });
        return;
      }

      if (target === "hand") {
        const element = document.elementFromPoint(clientX, clientY);
        const slot = element?.closest<HTMLElement>("[data-songjiang-hand-index]");
        const targetIndex = Number(slot?.dataset.songjiangHandIndex);
        if (slot && Number.isInteger(targetIndex)) {
          playActiveProp(index, { type: "hand", index: targetIndex });
          return;
        }
        showNotice(PROP_DEFS[propId].description);
        return;
      }

      const currentApp = appRef.current;
      const currentRoot = rootRef.current;
      if (!currentApp || !currentRoot) return;
      const cell = getCanvasCell({ clientX, clientY } as PointerEvent, currentApp, currentRoot);
      if (!cell) {
        showNotice(PROP_DEFS[propId].description);
        return;
      }
      playActiveProp(index, { type: "cell", col: cell.col, row: cell.row });
    },
    [playActiveProp, showNotice],
  );

  const startCardDrag = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    if (phase !== "playing") return;
    const card = stateRef.current.side.player.hand[index];
    if (!card) return;
    const active = selectedRef.current;
    const activeCard = active === null ? null : stateRef.current.side.player.hand[active];

    if (active !== null && active !== index && activeCard?.kind === "prop") {
      const target = activeCard.propId ? PROP_DEFS[activeCard.propId].target : "none";
      if (target === "hand") {
        playSelected({ type: "hand", index });
        return;
      }
    }

    event.preventDefault();
    setSelectedCard(index);
    showNotice("");
    setDragging({ source: "hand", index, text: card.text, x: event.clientX, y: event.clientY });

    const move = (moveEvent: PointerEvent) => {
      setDragging((current) =>
        current?.source === "hand" && current.index === index
          ? { ...current, x: moveEvent.clientX, y: moveEvent.clientY }
          : current,
      );
    };
    const finish = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      setDragging(null);
      dropCardAtPoint(index, upEvent.clientX, upEvent.clientY);
    };
    const cancel = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      setDragging(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
  };

  const startActivePropDrag = (event: ReactPointerEvent<HTMLButtonElement>, slot: HudActiveProp, index: number) => {
    if (phase !== "playing") return;
    if (slot.remaining > 0) return;
    const target = PROP_DEFS[slot.propId].target;
    if (target === "none") return;

    event.preventDefault();
    hideHoverTip();
    setSelectedCard(null);
    setSelectedUnit(null);
    showNotice(PROP_DEFS[slot.propId].description);
    setDragging({
      source: "activeProp",
      index,
      propId: slot.propId,
      text: slot.text,
      x: event.clientX,
      y: event.clientY,
    });

    const move = (moveEvent: PointerEvent) => {
      setDragging((current) =>
        current?.source === "activeProp" && current.index === index
          ? { ...current, x: moveEvent.clientX, y: moveEvent.clientY }
          : current,
      );
    };
    const finish = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      setDragging(null);
      dropActivePropAtPoint(index, slot.propId, upEvent.clientX, upEvent.clientY);
    };
    const cancel = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      setDragging(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
  };

  const useInstantCard = () => {
    if (phase !== "playing") return;
    if (!selectedCard?.propId) return;
    if (PROP_DEFS[selectedCard.propId].target === "none") {
      playSelected({ type: "none" });
    }
  };

  const onReroll = () => {
    if (phase !== "playing") return;
    const beforeCost = stateRef.current.side.player.refreshCost;
    const result = rerollHand(stateRef.current, "player");
    showNotice(result.message ?? "");
    flushAudio();
    if (result.ok) {
      setSelectedCard(null);
      setSelectedUnit(null);
      setRefreshAnimId((value) => value + 1);
      setCostPop({ id: Date.now(), text: `+${stateRef.current.side.player.refreshCost - beforeCost}` });
      if (costTimerRef.current !== null) window.clearTimeout(costTimerRef.current);
      costTimerRef.current = window.setTimeout(() => {
        setCostPop(null);
        costTimerRef.current = null;
      }, 850);
    }
    syncHud();
  };

  const onUseActiveProp = (index: number) => {
    if (phase !== "playing") return;
    const slot = stateRef.current.side.player.activeProps[index];
    if (!slot) return;
    const target = PROP_DEFS[slot.propId].target;
    if (target !== "none") {
      showNotice(PROP_DEFS[slot.propId].description);
      return;
    }
    playActiveProp(index, { type: "none" });
  };

  const onBulldozer = () => {
    if (phase !== "playing") return;
    const result = triggerBulldozerAssist(stateRef.current, "player");
    showNotice(result.message ?? "");
    flushAudio();
    syncHud();
  };

  const onEndMatch = () => {
    if (phase !== "playing") return;
    const result = endSongjiangDuelGame(stateRef.current, "ai");
    showNotice(result.message ?? "");
    flushAudio();
    setSelectedCard(null);
    setSelectedUnit(null);
    syncHud();
  };

  const setActivePropSlot = (slotIndex: number, propId: PropId) => {
    updateLoadout((current) => {
      const activeProps = [...current.activeProps];
      const duplicateIndex = activeProps.indexOf(propId);
      if (duplicateIndex >= 0) {
        activeProps[duplicateIndex] = activeProps[slotIndex];
      }
      activeProps[slotIndex] = propId;
      return { ...current, activeProps: activeProps.slice(0, 2) };
    });
  };

  const togglePassiveProp = (propId: PropId) => {
    updateLoadout((current) => {
      const exists = current.passiveProps.includes(propId);
      const passiveProps = exists
        ? current.passiveProps.filter((item) => item !== propId)
        : [...current.passiveProps, propId].slice(-5);
      return { ...current, passiveProps };
    });
  };

  const assignGeneralWeapon = (weaponId: WeaponId) => {
    updateLoadout((current) => ({
      ...current,
      weaponAssignments: {
        ...current.weaponAssignments,
        [selectedGeneral.display]: weaponId,
      },
    }));
  };

  const enemyHpPercent = Math.max(0, Math.min(100, (hud.enemyHp / hud.enemyMaxHp) * 100));
  const inspectedWeapon = inspectedUnit?.weaponId ? WEAPON_DEFS[inspectedUnit.weaponId] : null;
  const inspectorRows = inspectedUnit
    ? [
        ["等级", `Lv.${inspectedUnit.tier}`],
        ["血量", `${Math.ceil(inspectedUnit.hp)} / ${Math.ceil(inspectedUnit.maxHp)}`],
        ["攻击", inspectedUnit.damage > 0 ? inspectedUnit.damage.toFixed(1) : "产馒头"],
        ["范围", inspectedUnit.attackRange.toFixed(1)],
        ["攻速", `${inspectedUnit.attacksPerSecond.toFixed(2)}/s`],
        ["武器", inspectedWeapon?.name ?? "无"],
      ]
    : selectedCard
      ? [
          ["类型", cardKindLabel(selectedCard)],
          ["等级", `Lv.${selectedCard.tier}`],
          ["组合", selectedCard.parts ? selectedCard.parts.join(" + ") : selectedCard.text],
          ["说明", selectedCard.propId ? PROP_DEFS[selectedCard.propId].description : selectedCard.parts ? "完整武将，占两个格子" : "拖到棋盘或待选区合成"],
        ]
      : [
          ["查看", "点击卡片"],
          ["拖拽", "可整理待选区"],
          ["阿斗", `${Math.ceil(hud.hp)} / ${hud.maxHp}`],
        ];
  const renderActivePropButton = (slot: HudActiveProp | undefined, index: number) => {
    if (!slot) return <div />;
    const disabled = slot.remaining > 0;
    const prop = PROP_DEFS[slot.propId];
    return (
      <button
        key={slot.propId}
        type="button"
        disabled={disabled}
        onClick={() => onUseActiveProp(index)}
        onPointerDown={(event) => startActivePropDrag(event, slot, index)}
        {...tooltipProps(prop.description)}
        className="flex h-[68px] flex-col items-center justify-center rounded-[8px] border-[4px] border-[#2a1a12] bg-[#fff4c7] text-center shadow-[0_4px_0_rgba(42,26,18,0.22)] disabled:grayscale"
        style={{
          backgroundColor: colorNumber(getCardTone({
            uid: 0,
            kind: "prop",
            text: slot.text,
            cost: 0,
            rarity: slot.rarity,
            tier: 1,
            parts: null,
            propId: slot.propId,
          })),
        }}
      >
        <SkillIcon propId={slot.propId} compact />
        <span className="block text-[10px] font-black text-[#6d4a2c]">
          {disabled ? `${Math.ceil(slot.remaining)}s` : t("activeSkill")}
        </span>
      </button>
    );
  };

  return (
    <Cursor>
      <main className="relative h-svh overflow-hidden bg-[#17100d] text-[#2a1a12]">
        <div
          ref={stageRef}
          className="absolute inset-0 bg-[#d8bd88]"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#17100d]/80 via-[#17100d]/34 to-transparent px-3 py-3 sm:px-5">
          <div className="pointer-events-auto flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-[8px] border-[3px] border-[#2a1a12] bg-[#fff4c7]/95 px-3 py-2 text-sm font-black text-[#6d3c20] shadow-[0_3px_0_rgba(0,0,0,0.18)]"
            >
              {tCommon("backToShelf")}
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-[8px] border-2 border-[#2a1a12] bg-[#fff4c7]/95 px-3 py-2 text-xs font-black text-[#8c372c] sm:inline">
                {assetStatus === "ready"
                  ? t("assetReady")
                  : assetStatus === "error"
                    ? t("assetError")
                    : t("assetLoading")}
              </span>
              <LocaleSwitch />
            </div>
          </div>

          {phase === "playing" ? (
            <div className="pointer-events-auto mx-auto mt-2 grid max-w-5xl grid-cols-[1fr_1fr_72px] gap-2 rounded-[8px] border-[4px] border-[#2a1a12] bg-[#f2dfb8]/88 p-2 shadow-[0_4px_0_rgba(0,0,0,0.18)] sm:mt-3 sm:grid-cols-[1fr_1fr_120px] sm:gap-3 sm:bg-[#f2dfb8]/94 sm:p-3 lg:absolute lg:left-4 lg:top-16 lg:mt-0 lg:w-72 lg:max-w-none lg:grid-cols-1 lg:gap-3">
              <div className="min-w-0">
                <p className="truncate font-['Ma_Shan_Zheng'] text-2xl leading-none text-[#9a3a2e] sm:text-3xl">
                  {hud.mapName}
                </p>
                <p className="mt-1 text-xs font-black text-[#6d4a2c]">
                  {t("round")} {hud.round} · {formatGameTime(hud.elapsed)}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs font-black text-[#7a5a33]">
                  <span>{t("opponentHp")}</span>
                  <span>{Math.ceil(hud.enemyHp)} / {hud.enemyMaxHp}</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-[#2a1a12]/20">
                  <div
                    className="h-3 rounded-full bg-[#b94835]"
                    style={{ width: `${enemyHpPercent}%` }}
                  />
                </div>
              </div>
              <div className="rounded-[8px] bg-[#fff4c7] px-2 py-1 text-right font-black lg:text-left">
                <p className="text-[10px] text-[#8a6b44]">{t("grain")}</p>
                <p className="text-xl">{Math.floor(hud.gold)}</p>
              </div>
              <div className="hidden sm:col-span-3 sm:block lg:col-span-1">
                <p className="text-xs font-black text-[#8a4932]">{t("inspector")}</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {inspectorRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="min-w-0 rounded-[6px] bg-[#fff4c7] px-2 py-1 text-xs font-black text-[#2a1a12]"
                    >
                      <span className="block text-[10px] text-[#8a6b44]">{label}</span>
                      <span className="block truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {phase === "title" ? (
          <section className="absolute inset-0 z-30 flex items-center justify-center bg-[#17100d]/58 px-3 py-5 sm:px-4">
            <div className="max-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-y-auto rounded-[8px] border-[6px] border-[#2a1a12] bg-[#f2dfb8]/96 p-4 shadow-[0_12px_0_rgba(0,0,0,0.26)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-[#9a3a2e]">{t("eyebrow")}</p>
                  <h1 className="font-['Ma_Shan_Zheng'] text-5xl leading-none text-[#2a1a12] sm:text-7xl">
                    {t("title")}
                  </h1>
                </div>
                <Image
                  src="/songjiang-duel/original/resources/loading/title.png"
                  alt=""
                  width={160}
                  height={64}
                  unoptimized
                  className="h-16 w-40 shrink-0 rounded-[8px] border-[3px] border-[#2a1a12] bg-[#fff4c7] object-contain p-1 shadow-[0_4px_0_rgba(42,26,18,0.18)]"
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-normal text-[#7a5a33]">
                    {t("map")}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    {maps.map((map) => (
                      <button
                        key={map.id}
                        type="button"
                        onClick={() => restart(map.id)}
                        className={`rounded-[8px] border-[3px] px-4 py-3 text-left font-black shadow-[0_3px_0_rgba(42,26,18,0.16)] transition active:translate-y-[1px] ${
                          hud.mapId === map.id
                            ? "border-[#9a3a2e] bg-[#fff4c7] text-[#9a3a2e]"
                            : "border-[#c9a86c] bg-[#f8e9bf] text-[#6d4a2c] hover:border-[#2a1a12]"
                        }`}
                      >
                        <span className="block text-xl">{map.name}</span>
                        <span className="block text-sm opacity-75">{map.subtitle}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["skills", "generals", "weapons"] as TitlePanel[]).map((panel) => (
                      <button
                        key={panel}
                        type="button"
                        onClick={() => setTitlePanel(panel)}
                        className={`rounded-[8px] border-[3px] px-3 py-2 text-sm font-black shadow-[0_3px_0_rgba(42,26,18,0.16)] ${
                          titlePanel === panel
                            ? "border-[#9a3a2e] bg-[#fff4c7] text-[#9a3a2e]"
                            : "border-[#c9a86c] bg-[#f8e9bf] text-[#6d4a2c]"
                        }`}
                      >
                        {panel === "skills"
                          ? t("skillsTab")
                          : panel === "generals"
                            ? t("generalsTab")
                            : t("weaponsTab")}
                      </button>
                    ))}
                  </div>

                  {titlePanel === "skills" ? (
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[8px] border-[3px] border-[#2a1a12] bg-[#fff4c7] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black text-[#7a4c2f]">{t("activeSlots")}</p>
                          <p className="text-xs font-black text-[#9a3a2e]">2 / 2</p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {loadout.activeProps.slice(0, 2).map((propId, index) => {
                            const prop = PROP_DEFS[propId];
                            return (
                              <button
                                key={`${propId}-${index}`}
                                type="button"
                                onClick={() => setActiveConfigSlot(index)}
                                className="flex min-h-[88px] items-center gap-3 rounded-[8px] border-[3px] border-[#2a1a12] bg-[#f8e9bf] px-3 py-2 text-left shadow-[0_3px_0_rgba(42,26,18,0.14)]"
                                style={{
                                  borderColor: activeConfigSlot === index ? "#9a3a2e" : "#2a1a12",
                                }}
                                {...tooltipProps(prop.description)}
                              >
                                <SkillIcon propId={propId} />
                                <span className="min-w-0">
                                  <span className="block text-xs font-black text-[#9a3a2e]">{t("activeSkill")} {index + 1}</span>
                                  <span className="mt-1 block text-xs font-black leading-snug text-[#6d4a2c]">{prop.description}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {ACTIVE_PROP_CHOICES.map((propId) => {
                            const prop = PROP_DEFS[propId];
                            const activeIndex = loadout.activeProps.indexOf(propId);
                            return (
                              <button
                                key={propId}
                                type="button"
                                onClick={() => setActivePropSlot(activeConfigSlot, propId)}
                                {...tooltipProps(prop.description)}
                                className={`min-h-[86px] rounded-[8px] border-[2px] px-1 py-2 text-center font-black ${
                                  activeIndex >= 0
                                    ? "border-[#9a3a2e] bg-[#ffe8a3] text-[#9a3a2e]"
                                    : "border-[#c9a86c] bg-[#f8e9bf] text-[#6d4a2c]"
                                }`}
                              >
                                <SkillIcon propId={propId} compact />
                                <span className="mt-1 block h-8 overflow-hidden text-[10px] leading-4">{prop.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-[8px] border-[3px] border-[#2a1a12] bg-[#eef1d1] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black text-[#5f5139]">{t("passiveSlots")}</p>
                          <p className="text-xs font-black text-[#9a3a2e]">
                            {loadout.passiveProps.length} / 5
                          </p>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {loadout.passiveProps.slice(0, 5).map((propId) => {
                            const prop = PROP_DEFS[propId];
                            return (
                              <div
                                key={propId}
                                className="rounded-[8px] border-[2px] border-[#2a1a12] bg-[#f8e9bf] px-2 py-2 text-center"
                                {...tooltipProps(prop.description)}
                              >
                                <SkillIcon propId={propId} compact />
                                <span className="mt-1 block h-8 overflow-hidden text-[10px] font-black leading-4 text-[#6d4a2c]">{prop.description}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {PASSIVE_PROP_CHOICES.map((propId) => {
                            const prop = PROP_DEFS[propId];
                            const active = loadout.passiveProps.includes(propId);
                            return (
                              <button
                                key={propId}
                                type="button"
                                onClick={() => togglePassiveProp(propId)}
                                {...tooltipProps(prop.description)}
                                className={`min-h-[86px] rounded-[8px] border-[2px] px-1 py-2 text-center font-black ${
                                  active
                                    ? "border-[#4e7b43] bg-[#d7e9b4] text-[#355c31]"
                                    : "border-[#c9a86c] bg-[#f8e9bf] text-[#6d4a2c]"
                                }`}
                              >
                                <SkillIcon propId={propId} compact />
                                <span className="mt-1 block h-8 overflow-hidden text-[10px] leading-4">{prop.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {titlePanel === "generals" ? (
                    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_300px]">
                      <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                        {generalCodex.map((general) => {
                          const weapon = WEAPON_DEFS[loadout.weaponAssignments[general.display] ?? general.defaultWeaponId];
                          return (
                            <button
                              key={general.id}
                              type="button"
                              onClick={() => setSelectedGeneralId(general.id)}
                              className={`rounded-[8px] border-[3px] px-3 py-3 text-left font-black shadow-[0_3px_0_rgba(42,26,18,0.14)] ${
                                selectedGeneral.id === general.id
                                  ? "border-[#9a3a2e] bg-[#fff4c7] text-[#9a3a2e]"
                                  : "border-[#c9a86c] bg-[#f8e9bf] text-[#6d4a2c]"
                              }`}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="font-['Ma_Shan_Zheng'] text-3xl leading-none">{general.display}</span>
                                <WeaponIcon weapon={weapon} compact />
                              </span>
                              <span className="mt-1 block text-xs">{general.parts.join(" + ")} · {weapon.name}</span>
                              <span className="mt-1 block truncate text-[10px] opacity-80">{general.description}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-[8px] border-[3px] border-[#2a1a12] bg-[#fff4c7] p-4">
                        <p className="font-['Ma_Shan_Zheng'] text-5xl leading-none text-[#2a1a12]">
                          {selectedGeneral.display}
                        </p>
                        <p className="mt-2 text-sm font-black text-[#7a5a33]">
                          {t("parts")} {selectedGeneral.parts.join(" + ")}
                        </p>
                        <p className="mt-1 text-sm font-black text-[#7a5a33]">
                          {t("stats")} Lv.{selectedGeneral.maxLevel} · {WEAPON_TYPE_LABELS[selectedGeneralWeapon.type]} · {selectedGeneralWeapon.name}
                        </p>
                        <p className="mt-2 text-sm font-black leading-snug text-[#6d4a2c]">
                          {selectedGeneral.description}
                        </p>
                        <div className="mt-4 grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1">
                          {compatibleWeapons.map((weapon) => (
                            <button
                              key={weapon.id}
                              type="button"
                              onClick={() => assignGeneralWeapon(weapon.id)}
                              {...tooltipProps(weapon.description)}
                              className={`rounded-[8px] border-[2px] px-2 py-2 text-center font-black ${
                                selectedGeneralWeaponId === weapon.id
                                  ? "border-[#9a3a2e] bg-[#ffe8a3] text-[#9a3a2e]"
                                  : "border-[#c9a86c] bg-[#f8e9bf] text-[#6d4a2c]"
                              }`}
                              style={weaponRarityStyle(weapon.id)}
                            >
                              <WeaponIcon weapon={weapon} />
                              <span className="block truncate text-xs">{weapon.name}</span>
                              <span className="block truncate text-[10px]">{weapon.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {titlePanel === "weapons" ? (
                    <div className="mt-4 grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                      {weaponCodex.map((weapon) => (
                        <div
                          key={weapon.id}
                          className="rounded-[8px] border-[3px] border-[#2a1a12] bg-[#f8e9bf] px-2 py-2 shadow-[0_3px_0_rgba(42,26,18,0.14)]"
                          {...tooltipProps(weapon.description)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <WeaponIcon weapon={weapon} compact />
                            <span
                              className="rounded-[6px] border px-2 py-1 text-[10px] font-black"
                              style={weaponRarityBadgeStyle(weapon.rarity)}
                            >
                              {WEAPON_TYPE_LABELS[weapon.type]} · {WEAPON_RARITY_NAMES[weapon.rarity]}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm font-black text-[#2a1a12]">{weapon.name}</p>
                          <p className="mt-1 h-10 overflow-hidden text-xs font-black leading-5 text-[#7a5a33]">{weapon.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="sticky bottom-0 z-10 mt-5 flex flex-col gap-3 border-t-[3px] border-[#2a1a12]/20 bg-[#f2dfb8] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="rounded-[8px] bg-[#fff4c7] px-4 py-3 text-lg font-black text-[#6d4a2c]">
                  {hud.mapName} · {t("ready")}
                </p>
                <Button type="primary" size="large" onClick={startGame}>
                  {t("startGame")}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {phase === "playing" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#17100d]/76 via-[#17100d]/30 to-transparent px-2 pb-2 pt-12 sm:px-5 sm:pb-3 sm:pt-20 lg:bottom-3 lg:left-auto lg:right-4 lg:top-16 lg:w-80 lg:bg-none lg:px-0 lg:pb-0 lg:pt-0">
            <div
              key={`refresh-panel-${refreshAnimId}`}
              className={`pointer-events-auto relative mx-auto max-h-[38svh] max-w-4xl overflow-y-auto rounded-[8px] border-[4px] border-[#2a1a12] bg-[#f2dfb8]/88 p-2 shadow-[0_5px_0_rgba(0,0,0,0.22)] sm:bg-[#f2dfb8]/95 sm:p-3 lg:max-h-full lg:max-w-none lg:overflow-hidden ${refreshAnimId > 0 ? "songjiang-refresh-flash" : ""}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3 sm:gap-3 lg:flex-col lg:items-stretch">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#2a1a12]">
                    {notice || hud.message}
                  </p>
                  <p className="hidden text-xs font-black text-[#7a5a33] sm:block">
                    {selectedCard
                      ? `${cardKindLabel(selectedCard)} · ${selectedCard.text} Lv.${selectedCard.tier} · ${t("dragToBoard")}`
                      : selectedUnitId !== null
                        ? `${selectedUnitText} · ${t("unitSelected")}`
                      : t("noSelection")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2 lg:grid lg:grid-cols-2">
                  <Button
                    type="primary"
                    onClick={useInstantCard}
                    disabled={!selectedCard?.propId || PROP_DEFS[selectedCard.propId].target !== "none"}
                  >
                    {t("use")}
                  </Button>
                  <Button type="default" onClick={onBulldozer}>
                    {t("bulldozer")}
                  </Button>
                  <Button type="dashed" onClick={onEndMatch}>
                    {t("endMatch")}
                  </Button>
                  <Button type="dashed" onClick={returnToTitle}>
                    {t("returnTitle")}
                  </Button>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-[76px_1fr_76px] items-center gap-2 lg:grid-cols-[62px_1fr_62px]">
                {renderActivePropButton(hud.activeProps[0], 0)}
                <div
                  key={`refresh-button-${costPop?.id ?? 0}`}
                  className={`relative ${costPop ? "songjiang-refresh-squash" : ""}`}
                >
                  <button
                    type="button"
                    onClick={onReroll}
                    className="h-[72px] w-full rounded-[8px] border-[4px] border-[#2a1a12] bg-[#b97966] text-center text-2xl font-black text-white shadow-[0_4px_0_rgba(42,26,18,0.24)] lg:h-[58px] lg:text-xl"
                  >
                    <span className="block">{t("reroll")}</span>
                    <span className="mt-0.5 block text-sm text-[#fff4c7]">● {hud.refreshCost}</span>
                  </button>
                  {costPop ? (
                    <span className="songjiang-cost-pop pointer-events-none absolute -top-8 right-2 rounded-[8px] border-2 border-[#2a1a12] bg-[#fff4c7] px-2 py-0.5 text-sm font-black text-[#9a3a2e]">
                      {costPop.text}
                    </span>
                  ) : null}
                </div>
                {renderActivePropButton(hud.activeProps[1], 1)}
              </div>

              <div className="grid grid-cols-5 gap-2 lg:grid-cols-1">
                {hud.hand.map((card, index) => {
                  const isActive = selected === index;
                  const tone = colorNumber(getCardTone(card));
                  return (
                    <button
                      key={card?.uid ?? `empty-${index}`}
                      type="button"
                      data-songjiang-hand-index={index}
                      disabled={!card}
                      onPointerDown={(event) => startCardDrag(event, index)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") chooseCard(index);
                      }}
                      {...(card ? tooltipProps(card.propId ? PROP_DEFS[card.propId].description : card.parts ? `${card.text} Lv.${card.tier} · ${card.parts.join(" + ")}` : `${card.text} Lv.${card.tier}`) : {})}
                      className={`relative h-[76px] min-w-0 rounded-[8px] border-[3px] px-1 py-2 text-center shadow-[0_3px_0_rgba(42,26,18,0.18)] transition active:translate-y-[1px] disabled:cursor-default disabled:opacity-60 sm:h-[92px] lg:h-[58px] lg:py-1 ${card ? "songjiang-card-deal" : ""} ${
                        isActive
                          ? "border-[#9a3a2e] bg-[#fff2c8]"
                          : "border-[#2a1a12] bg-[#f9e7b6]"
                      }`}
                      style={{
                        animationDelay: card ? `${index * 85}ms` : undefined,
                        backgroundColor: tone,
                      }}
                    >
                      <span className="block font-['Ma_Shan_Zheng'] text-4xl leading-none text-[#2a1a12] sm:text-5xl lg:text-4xl">
                        {card?.text ?? "空"}
                      </span>
                      {card && card.tier > 1 ? (
                        <span className="absolute right-1 top-1 rounded-[6px] border border-[#2a1a12] bg-[#fff4c7] px-1 text-[10px] font-black text-[#9a3a2e]">
                          Lv.{card.tier}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[10px] font-black text-[#6d4a2c]">
                        {card ? cardKindLabel(card) : t("emptySlot")}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-5 gap-2">
                {hud.passiveProps.slice(0, 5).map((propId) => {
                  const prop = PROP_DEFS[propId];
                  return (
                    <div
                      key={propId}
                      className="h-[58px] rounded-[8px] border-[3px] border-[#2a1a12] bg-[#d7ddbd] px-1 py-1 text-center shadow-[0_3px_0_rgba(42,26,18,0.18)]"
                      {...tooltipProps(prop.description)}
                    >
                      <SkillIcon propId={propId} compact />
                      <span className="block text-[9px] font-black text-[#5f5139] lg:text-[8px]">
                        {t("passiveSkill")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {dragging ? (
          <div
            className="pointer-events-none fixed z-50 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-[8px] border-[4px] border-[#2a1a12] bg-[#fff2c8]/95 text-center font-['Ma_Shan_Zheng'] text-5xl leading-[4.5rem] text-[#2a1a12] shadow-[0_8px_0_rgba(0,0,0,0.22)]"
            style={{ left: dragging.x, top: dragging.y }}
          >
            {dragging.text}
          </div>
        ) : null}

        {hoverTip ? (
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[2147483647] max-w-[280px] rounded-[8px] border-[3px] border-[#2a1a12] bg-[#fff4c7] px-3 py-2 text-xs font-black leading-5 text-[#2a1a12] shadow-[0_5px_0_rgba(42,26,18,0.2)]"
            style={{
              left: hoverTip.x,
              top: hoverTip.y,
            }}
          >
            {hoverTip.text}
          </div>
        ) : null}

        {hud.status === "ended" && phase === "playing" ? (
          <section className="absolute inset-0 z-40 flex items-center justify-center bg-[#17100d]/62 px-4">
            <div className="max-w-xl rounded-[8px] border-[6px] border-[#2a1a12] bg-[#f2dfb8] p-6 text-center shadow-[0_12px_0_rgba(0,0,0,0.24)]">
              <p className="font-['Ma_Shan_Zheng'] text-5xl text-[#9a3a2e]">
                {hud.winner === "player"
                  ? t("victory")
                  : hud.winner === "ai"
                    ? t("defeat")
                    : t("draw")}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button type="primary" onClick={startGame}>
                  {t("restart")}
                </Button>
                <Button type="default" onClick={returnToTitle}>
                  {t("returnTitle")}
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </Cursor>
  );
}
