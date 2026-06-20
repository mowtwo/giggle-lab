export type AdouAtlasId =
  | "battleUI"
  | "commonUI"
  | "effect"
  | "gameObject"
  | "map"
  | "props"
  | "weapon"
  | "weaponBag";

export type AdouAtlasAsset = {
  id: AdouAtlasId;
  prefix: string;
  atlas: string;
  image: string;
};

export const ADOU_ATLAS_ASSETS: Record<AdouAtlasId, AdouAtlasAsset> = {
  battleUI: atlas("battleUI", "resources/img/battleUI/"),
  commonUI: atlas("commonUI", "resources/img/commonUI/"),
  effect: atlas("effect", "resources/img/effect/"),
  gameObject: atlas("gameObject", "resources/img/gameObject/"),
  map: atlas("map", "resources/img/map/"),
  props: atlas("props", "resources/img/props/"),
  weapon: atlas("weapon", "resources/img/weapon/"),
  weaponBag: atlas("weaponBag", "resources/img/weaponBag/"),
} as const;

export const ADOU_SOUND_ASSETS = {
  adou_hit: "resources/sound/adou_hit.mp3",
  battle_end_gain_star: "resources/sound/battle_end_gain_star.mp3",
  battle_end_gold_fly: "resources/sound/battle_end_gold_fly.mp3",
  battle_end_lose_star: "resources/sound/battle_end_lose_star.mp3",
  battle_end_star_fly: "resources/sound/battle_end_star_fly.mp3",
  boss_entrance: "resources/sound/boss_entrance.mp3",
  boss_sweep_skill: "resources/sound/boss_sweep_skill.mp3",
  bow_attack: "resources/sound/bow_attack.mp3",
  btn_down: "resources/sound/btn_down.mp3",
  bulldozer_land: "resources/sound/bulldozer_land.mp3",
  bulldozer_push: "resources/sound/bulldozer_push.mp3",
  caoCao_skill_seal: "resources/sound/caoCao_skill_seal.mp3",
  cavalry_attack: "resources/sound/cavalry_attack.mp3",
  chain_lock: "resources/sound/chain_lock.mp3",
  danger_tip: "resources/sound/danger_tip.mp3",
  diaoChan_skill_charm: "resources/sound/diaoChan_skill_charm.mp3",
  dongZhuo_skill_phantom: "resources/sound/dongZhuo_skill_phantom.mp3",
  dongZhuo_skill_phase1_suck: "resources/sound/dongZhuo_skill_phase1_suck.mp3",
  enemy_dead: "resources/sound/enemy_dead.mp3",
  enemy_hit: "resources/sound/enemy_hit.mp3",
  enemy_knife_attack: "resources/sound/enemy_knife_attack.mp3",
  game_lose: "resources/sound/game_lose.mp3",
  game_win: "resources/sound/game_win.mp3",
  general_arrow_rain: "resources/sound/general_arrow_rain.mp3",
  general_bow_attack: "resources/sound/general_bow_attack.mp3",
  general_fire_arrow_rain: "resources/sound/general_fire_arrow_rain.mp3",
  general_ground_slam: "resources/sound/general_ground_slam.mp3",
  general_level_up: "resources/sound/general_level_up.mp3",
  general_pike_attack: "resources/sound/general_pike_attack.mp3",
  holyBlade_skill: "resources/sound/holyBlade_skill.mp3",
  jumpSlash_stomp: "resources/sound/jumpSlash_stomp.mp3",
  knife_attack: "resources/sound/knife_attack.mp3",
  landmine_explode: "resources/sound/landmine_explode.mp3",
  lottery: "resources/sound/lottery.mp3",
  luBu_skill: "resources/sound/luBu_skill.mp3",
  maChao_attack_lightning: "resources/sound/maChao_attack_lightning.mp3",
  maChao_throwSpear: "resources/sound/maChao_throwSpear.mp3",
  mantou_add: "resources/sound/mantou_add.mp3",
  match_drum: "resources/sound/match_drum.mp3",
  merge_civilian: "resources/sound/merge_civilian.mp3",
  merge_general: "resources/sound/merge_general.mp3",
  meteor_fall: "resources/sound/meteor_fall.mp3",
  open_deck: "resources/sound/open_deck.mp3",
  popup_notification: "resources/sound/popup_notification.mp3",
  shovel_treasure_box: "resources/sound/shovel_treasure_box.mp3",
  shovel_use: "resources/sound/shovel_use.mp3",
  skill_ink_splash: "resources/sound/skill_ink_splash.mp3",
  soldier_buy_enable: "resources/sound/soldier_buy_enable.mp3",
  soldier_create: "resources/sound/soldier_create.mp3",
  soldier_merge_upgrade: "resources/sound/soldier_merge_upgrade.mp3",
  soldier_set: "resources/sound/soldier_set.mp3",
  stun_1s: "resources/sound/stun_1s.mp3",
  summon_cavalry_skill: "resources/sound/summon_cavalry_skill.mp3",
  sword_attack: "resources/sound/sword_attack.mp3",
  swords_clash: "resources/sound/swords_clash.mp3",
  talisman_burn: "resources/sound/talisman_burn.mp3",
  trap_trigger: "resources/sound/trap_trigger.mp3",
  xiahouDun_skill_cloud: "resources/sound/xiahouDun_skill_cloud.mp3",
  xiahouDun_skill_lightning: "resources/sound/xiahouDun_skill_lightning.mp3",
  zhangJiao_skill_horn: "resources/sound/zhangJiao_skill_horn.mp3",
  zhaoYun_voice_entrance: "resources/sound/zhaoYun_voice_entrance.wav",
  zhenFu_skill_rain: "resources/sound/zhenFu_skill_rain.mp3",
  zhenFu_skill_rain_cycle: "resources/sound/zhenFu_skill_rain_cycle.mp3",
} as const;

export const ADOU_MUSIC_ASSETS = {
  bg_battleScene_0: "resources/music/bg_battleScene_0.mp3",
  bg_battleScene_3: "resources/music/bg_battleScene_3.mp3",
  bg_mainScene: "resources/music/bg_mainScene.mp3",
} as const;

export const ADOU_SPINE_ASSETS = {
  adou: spine("aDou"),
  boss0: spine("boss0"),
  boss1: spine("boss1"),
  boss2: spine("boss2"),
  bow: spine("bow"),
  cavalry: spine("cavalry"),
  dancer: spine("dancer"),
  dongZhuo: spine("dongZhuo"),
  flag: spine("flag"),
  grass: spine("grass"),
  huaXiong: spine("huaXiong"),
  knife: spine("knife"),
  lvBu: spine("lvBu"),
  maChao: spine("maChao"),
  mihuan: spine("mihuan"),
  pike: spine("pike"),
  stamina: spine("stamina"),
  thief: spine("thief"),
  zhangFei: spine("zhangFei"),
  zhaoYun: spine("zhaoYun"),
} as const;

export const ADOU_PREFAB_ASSETS = {
  arrowTrail: "prefab/bulletTrail/arrowTrail.lh",
  daoqiTrail: "prefab/bulletTrail/daoqiTrail.lh",
  fireArrowTrail: "prefab/bulletTrail/fireArrowTrail.lh",
  fireDragonTrail: "prefab/bulletTrail/fireDragonTrail.lh",
  knifeTrail: "prefab/bulletTrail/knifeTrail.lh",
  attChangeTip: "prefab/attChangeTip.lh",
  boss: "prefab/boss.lh",
  crackEff: "prefab/crackEff.lh",
  damageNum: "prefab/damageNum.lh",
  goldUp: "prefab/goldUp.lh",
  heart: "prefab/heart.lh",
  loveHeart: "prefab/loveHeart.lh",
  lvlDownEff: "prefab/lvlDownEff.lh",
  lvlUpEff: "prefab/lvlUpEff.lh",
  mapItem: "prefab/mapItem.lh",
  maChaoPike: "prefab/maChaoPike.lh",
  mob: "prefab/mob.lh",
  setSoldierEff: "prefab/setSoldierEff.lh",
  shovelGrass: "prefab/shovelGrass.lh",
  talkBox: "prefab/talkBox.lh",
  trail: "prefab/trail.lh",
  treasure: "prefab/treasure.lh",
} as const;

export type AdouSoundKey = keyof typeof ADOU_SOUND_ASSETS;
export type AdouMusicKey = keyof typeof ADOU_MUSIC_ASSETS;
export type AdouSpineKey = keyof typeof ADOU_SPINE_ASSETS;
export type AdouPrefabKey = keyof typeof ADOU_PREFAB_ASSETS;

export function getAdouSoundPath(sound: AdouSoundKey) {
  return ADOU_SOUND_ASSETS[sound];
}

export function getAdouMusicPath(music: AdouMusicKey) {
  return ADOU_MUSIC_ASSETS[music];
}

export function isAdouKnownSoundKey(sound: string): sound is AdouSoundKey {
  return sound in ADOU_SOUND_ASSETS;
}

export function findAdouAtlasForAsset(assetPath: string) {
  for (const atlasAsset of Object.values(ADOU_ATLAS_ASSETS)) {
    if (!assetPath.startsWith(atlasAsset.prefix)) continue;
    return {
      atlas: atlasAsset,
      frame: assetPath.slice(atlasAsset.prefix.length),
    };
  }
  return null;
}

function atlas(id: AdouAtlasId, prefix: string): AdouAtlasAsset {
  return {
    id,
    prefix,
    atlas: `${prefix}AutoAtlas.atlas`,
    image: `${prefix}AutoAtlas.png`,
  };
}

function spine(name: string) {
  return {
    json: `resources/anim/${name}/skeleton.json`,
    atlas: `resources/anim/${name}/skeleton.atlas`,
    image: `resources/anim/${name}/skeleton.png`,
  };
}
