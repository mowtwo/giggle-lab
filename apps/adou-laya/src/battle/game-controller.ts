// GameController — the top-level lifecycle orchestrator (the bundle's `Cn`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~28879-29025. `init` boots every game-system manager in dependency order;
// `startGame` reports + initializes a battle and opens BattleScene, wiring the
// AI/drag/focus controllers in the scene-ready callback; `gameOver` tears the
// battle down across all managers, records the result, and opens GameOverScene.
// The `OH` GM-debug panel is off by default. Opaque method names kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { AudioMgr } from "../core/audio-mgr";
import { TipMgr } from "../core/tip-mgr";
import { PreloadMgr } from "../core/preload-mgr";
import { PrefabPool } from "./prefab-pool";
import { PrefabFactory } from "./prefab-factory";
import { AnimPlayer } from "./anim-player";
import { RankScoreMgr } from "./rank-score-mgr";
import { FocusMgr } from "./focus-mgr";
import { AvatarMgr } from "./avatar-mgr";
import { PlatformMgr } from "../platform/platform-mgr";
import { ServerReportMgr } from "./server-report-mgr";
import { AnalyticsMgr } from "./analytics-mgr";
import { StaminaCtrl } from "./stamina-ctrl";
import { LeaderboardMgr } from "./leaderboard-mgr";
import { SpawnQueueMgr } from "./spawn-queue-mgr";
import { BoardMgr } from "./board-mgr";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";
import { EntityRegistry } from "./entity-registry";
import { BoardInputMgr } from "./board-input-mgr";
import { GeneralAIController } from "./ai-controller";
import { PlacementMgr } from "./placement-mgr";
import { DragVisualMgr } from "./drag-visual-mgr";
import { BuffMgr } from "./buff-mgr";
import { BattleMgr } from "./battle-mgr";
import { BattlePropsMgr } from "./battle-props-mgr";
import { WeaponMgr } from "./weapon-factory";
import { WeaponFragmentMgr } from "./weapon-fragment-mgr";
import { BulletSpawnMgr } from "./bullet-spawn-mgr";
import { EffectMgr } from "./effect-mgr";
import { TutorialMgr } from "./tutorial-mgr";
import { BulletTrailPool } from "./bullet-trail";
import { MathE } from "../core/math-e";

const u = GameEvent;
const $ = AudioMgr;
const Zt = AnimPlayer;
const Fh = BulletTrailPool;

export class GameController extends Singleton {
  OH = false;

  init(): void {
    Laya.InputManager.multiTouchEnabled = false;
    this.addEventListener();
    RankScoreMgr.instance().init();
    PreloadMgr.instance().init();
    TipMgr.instance().init();
    ServerReportMgr.instance().init(PlatformMgr.instance().jy());
    FocusMgr.instance().init();
    Zt.instance().init();
    AvatarMgr.instance().init();
    PrefabPool.instance().init();
    PrefabFactory.instance().init();
    SpawnQueueMgr.instance().init();
    BoardMgr.instance().init();
    EnemySpatialMgr.instance().init();
    EntityRegistry.instance().init();
    BoardInputMgr.instance().init();
    GeneralAIController.instance().init();
    PlacementMgr.instance().init();
    DragVisualMgr.instance().init();
    BuffMgr.instance().init();
    BattleMgr.instance().init();
    LeaderboardMgr.instance().init();
    BattlePropsMgr.instance().init();
    WeaponMgr.instance().init();
    WeaponFragmentMgr.instance().init();
    BulletSpawnMgr.instance().init();
    StaminaCtrl.instance().init();
    $.instance().init(GameMgr.instance().settingData().musicVolume, GameMgr.instance().settingData().soundVolume);
    TutorialMgr.instance().init();
    if (this.OH) {
      const t: any = new Laya.Image("resources/img/commonUI/tipBg.png");
      t.size(50, 50);
      t.pos(590, 300);
      t.alpha = 0.8;
      Laya.stage.addChild(t);
      t.on(Laya.Event.CLICK, this, () => {
        if (t.opened) {
          t.opened = false;
          SceneMgr.instance().closeDialog("GMDialog");
        } else {
          t.opened = true;
          SceneMgr.instance().openDialog("GMDialog", false);
        }
      });
    }
    console.log("当前玩家天数", MathE.daysBetween(GameMgr.instance().player.registerTime, Date.now()) + 1);
  }

  addEventListener(): void {
    EventMgr.instance.on(u.l, this, this.gameOver);
    EventMgr.instance.on(u.ks, this, this.YH);
    EventMgr.instance.on(u._s, this, this.XH);
  }

  YH(): void {
    SceneMgr.instance().openDialog("AuthorizeDialog");
  }

  XH(t: any): void {
    PlatformMgr.instance().wu();
    SceneMgr.instance().closeDialog("AuthorizeDialog");
    LeaderboardMgr.instance().rH(t);
  }

  startGame(): Promise<any> {
    ServerReportMgr.instance().pp({
      fail: (t: any) => {
        console.warn("[Server] start game report failed", t);
      },
    });
    GameMgr.instance().startGame();
    AnalyticsMgr.instance().Fy();
    SpawnQueueMgr.instance().startGame();
    LeaderboardMgr.instance().startGame();
    BattleMgr.instance().startGame();
    EnemySpatialMgr.instance().startGame();
    EntityRegistry.instance().startGame();
    EffectMgr.instance().startGame();
    BuffMgr.instance().startGame();
    PlatformMgr.instance().startGame();
    return new Promise((resolve) => {
      SceneMgr.instance().openScene("BattleScene", false, null, (s: any) => {
        GeneralAIController.instance().startGame();
        DragVisualMgr.instance().startGame();
        FocusMgr.instance().startGame();
        resolve(s);
      });
    });
  }

  GH(): Promise<any> {
    TutorialMgr.instance().jY();
    return this.startGame().then((t) => {
      TutorialMgr.instance().$Y();
      return t;
    });
  }

  gameOver(t: any, s = false, i = false): void {
    GameMgr.instance().battleState.Vi = true;
    const h = GameMgr.instance().battleState.oi;
    const e = AnalyticsMgr.instance();
    if (t) e.Oy(h);
    else if (s) e.Xy(h);
    else e.Yy(h);
    TutorialMgr.instance().gameOver();
    const a = GameMgr.instance().battleState.oi;
    GameMgr.instance().gameOver(t);
    BattleMgr.instance().gameOver();
    GeneralAIController.instance().gameOver();
    DragVisualMgr.instance().gameOver();
    BoardInputMgr.instance().gameOver();
    EventMgr.instance.event(u.Dt);
    SpawnQueueMgr.instance().gameOver();
    EnemySpatialMgr.instance().gameOver();
    EntityRegistry.instance().gameOver();
    EffectMgr.instance().gameOver();
    LeaderboardMgr.instance().gameOver(t);
    ServerReportMgr.instance().yp(t, {
      fail: (err: any) => {
        console.warn("[Server] end game report failed", err);
      },
    });
    EventMgr.instance.event(u.o, t);
    WeaponFragmentMgr.instance().gameOver(t);
    SceneMgr.instance().openScene("GameOverScene", false, { isWin: t, HH: s, round: a, WH: i });
    BattlePropsMgr.instance().gameOver(t);
    PlacementMgr.instance().gameOver();
    WeaponMgr.instance().gameOver();
    BulletSpawnMgr.instance().gameOver();
    Fh.clearAllDeferredTrails();
    BuffMgr.instance().gameOver();
    AvatarMgr.instance().CG();
    PlatformMgr.instance().fu();
  }

  test(): void {
    Laya.Scene.open("scene/SoldierRangeScene.ls");
  }

  zH(): void {}
}

/** Alias. (`Cn`) */
export const Cn = GameController;
