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
};

// Expose ported modules for in-browser verification during reconstruction.
(window as unknown as Record<string, unknown>).__ADOU_REBUILT__ = {
  ported: Object.keys(ported),
  modules: ported,
};

console.log("[adou-rebuilt] loaded; ported modules:", Object.keys(ported));
