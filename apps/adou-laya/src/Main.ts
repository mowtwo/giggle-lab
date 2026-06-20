// Reconstructed Adou business bundle entry.
//
// Build model (see apps/adou-laya/README.md and reconstruction/CLASS-MAP.md):
// during reconstruction this bundle is loaded AFTER the original js/bundle.js in
// "hybrid-override" mode. Each module we port re-registers its class under the
// SAME @regClass UUID, so the engine binds the original resources to OUR code.
// Once every class + system is ported, the original bundle is dropped and this
// becomes the sole js/bundle.js.
//
// Source of truth is vendor/original/game/js/bundle.js (beautified at
// reconstruction/reference/bundle.pretty.js). Behaviour is recovered from it,
// never invented.

import { EventMgr } from "./core/event-mgr";
import { MathE } from "./core/math-e";
import { Singleton } from "./core/singleton";
import { SceneMgr } from "./core/scene-mgr";
import { AudioMgr } from "./core/audio-mgr";
import { PrivacyAgreementMgr } from "./core/privacy-agreement-mgr";
import { PlatformMgr } from "./platform/platform-mgr";
import { LayerZ } from "./core/layer-z";
import { GameEvent } from "./core/game-event";
import { SaveMgr } from "./core/save-mgr";
import { UpdateMgr } from "./core/update-mgr";
import { RankMgr } from "./data/rank-mgr";
import { WeaponDataMgr } from "./data/weapon-data-mgr";
import { PropsMgr } from "./data/props-mgr";
import { GeneralMgr } from "./data/general-mgr";
import { StaminaMgr } from "./data/stamina-mgr";
import { OnMgr } from "./data/on-mgr";
import { MapId } from "./data/map-id";
import { AStar, Grid, GridNode } from "./battle/pathfinding";
import { MapMgr } from "./battle/map-mgr";
import { EnemyMgr } from "./battle/enemy-mgr";
import { SoldierPool } from "./battle/soldier-pool";
import { BattleState } from "./battle/battle-state";
import { GameConfig } from "./battle/game-config";
import { EffectRelation } from "./battle/effect-relation";
import { AttrType, SpecialIndex } from "./battle/attr-type";
import { GameMgr } from "./core/game-mgr";
import { PreloadMgr } from "./core/preload-mgr";
import { TipMgr } from "./core/tip-mgr";
import * as FrameAnim from "./battle/frame-anim";
import { PrefabName, PrefabPool } from "./battle/prefab-pool";
import { TexturedSprite } from "./battle/textured-sprite";
import { PrefabFactory } from "./battle/prefab-factory";
import { EffectMgr } from "./battle/effect-mgr";
import { BulletBehavior } from "./battle/bullet-behavior";
import { EnemyFactory, EnemyTypes } from "./battle/enemy-factory";
import { Buff, makeBuffData } from "./battle/buff";
import { AttrBuff, CallbackBuff } from "./battle/buffs";
import { GameObject, DraggableObject } from "./battle/game-object";
import { PoolFactory } from "./battle/pool-factory";
import { Soldier } from "./battle/soldier";
import { SpineSprite } from "./battle/spine-sprite";
import { FrameAnimSprite } from "./battle/frame-anim-sprite";
import { AnimPlayer } from "./battle/anim-player";
import { BaseSoldier } from "./battle/base-soldier";
import { HitStrategy, HitEnemyStrategy, HitStrategyFactory } from "./battle/hit-strategy";

// Foundation modules ported so far. As scenes/dialogs are added they import
// these and register themselves via @regClass on import side-effect.
const ported = {
  EventMgr,
  MathE,
  Singleton,
  SceneMgr,
  AudioMgr,
  PrivacyAgreementMgr,
  PlatformMgr,
  LayerZ,
  GameEvent,
  SaveMgr,
  UpdateMgr,
  RankMgr,
  WeaponDataMgr,
  PropsMgr,
  GeneralMgr,
  StaminaMgr,
  OnMgr,
  MapId,
  AStar,
  Grid,
  GridNode,
  MapMgr,
  EnemyMgr,
  SoldierPool,
  BattleState,
  GameConfig,
  EffectRelation,
  AttrType,
  SpecialIndex,
  GameMgr,
  PreloadMgr,
  TipMgr,
  FrameAnim,
  PrefabName,
  PrefabPool,
  TexturedSprite,
  PrefabFactory,
  EffectMgr,
  BulletBehavior,
  EnemyFactory,
  EnemyTypes,
  Buff,
  makeBuffData,
  AttrBuff,
  CallbackBuff,
  GameObject,
  DraggableObject,
  PoolFactory,
  Soldier,
  SpineSprite,
  FrameAnimSprite,
  AnimPlayer,
  BaseSoldier,
  HitStrategy,
  HitEnemyStrategy,
  HitStrategyFactory,
};

// Expose ported modules for in-browser verification during reconstruction.
(window as unknown as Record<string, unknown>).__ADOU_REBUILT__ = {
  ported: Object.keys(ported),
  modules: ported,
};

console.log("[adou-rebuilt] loaded; ported modules:", Object.keys(ported));
