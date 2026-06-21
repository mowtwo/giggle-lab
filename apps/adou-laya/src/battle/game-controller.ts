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
import { PlatformMgr } from "./platform-mgr";
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

const F = GameMgr;
const K = SceneMgr;
const y = EventMgr;
const u = GameEvent;
const $ = AudioMgr;
const tt = TipMgr;
const _n = PreloadMgr;
const H = PrefabPool;
const z = PrefabFactory;
const Zt = AnimPlayer;
const En = RankScoreMgr;
const Tn = FocusMgr;
const In = AvatarMgr;
const Mt = PlatformMgr;
const st = ServerReportMgr;
const St = AnalyticsMgr;
const Rn = StaminaCtrl;
const Dn = LeaderboardMgr;
const Na = SpawnQueueMgr;
const wi = BoardMgr;
const Eh = EnemySpatialMgr;
const Ki = EntityRegistry;
const Pn = BoardInputMgr;
const mn = GeneralAIController;
const en = PlacementMgr;
const An = DragVisualMgr;
const th = BuffMgr;
const vn = BattleMgr;
const Zi = BattlePropsMgr;
const ma = WeaponMgr;
const eh = WeaponFragmentMgr;
const fe = BulletSpawnMgr;
const q = EffectMgr;
const wn = TutorialMgr;
const Fh = BulletTrailPool;

export class GameController extends Singleton {
  private OH = false;

  init(): void {
    Laya.InputManager.multiTouchEnabled = false;
    this.addEventListener();
    En.instance().init();
    _n.instance().init();
    tt.instance().init();
    st.instance().init(Mt.instance().jy());
    Tn.instance().init();
    Zt.instance().init();
    In.instance().init();
    H.instance().init();
    z.instance().init();
    Na.instance().init();
    wi.instance().init();
    Eh.instance().init();
    Ki.instance().init();
    Pn.instance().init();
    mn.instance().init();
    en.instance().init();
    An.instance().init();
    th.instance().init();
    vn.instance().init();
    Dn.instance().init();
    Zi.instance().init();
    ma.instance().init();
    eh.instance().init();
    fe.instance().init();
    Rn.instance().init();
    $.instance().init(F.instance().settingData().musicVolume, F.instance().settingData().soundVolume);
    wn.instance().init();
    if (this.OH) {
      const t: any = new Laya.Image("resources/img/commonUI/tipBg.png");
      t.size(50, 50);
      t.pos(590, 300);
      t.alpha = 0.8;
      Laya.stage.addChild(t);
      t.on(Laya.Event.CLICK, this, () => {
        if (t.opened) {
          t.opened = false;
          K.instance().closeDialog("GMDialog");
        } else {
          t.opened = true;
          K.instance().openDialog("GMDialog", false);
        }
      });
    }
    console.log("当前玩家天数", MathE.daysBetween(F.instance().player.registerTime, Date.now()) + 1);
  }

  addEventListener(): void {
    y.instance.on(u.l, this, this.gameOver);
    y.instance.on(u.ks, this, this.YH);
    y.instance.on(u._s, this, this.XH);
  }

  YH(): void {
    K.instance().openDialog("AuthorizeDialog");
  }

  XH(t: any): void {
    Mt.instance().wu();
    K.instance().closeDialog("AuthorizeDialog");
    Dn.instance().rH(t);
  }

  startGame(): Promise<any> {
    st.instance().pp({
      fail: (t: any) => {
        console.warn("[Server] start game report failed", t);
      },
    });
    F.instance().startGame();
    St.instance().Fy();
    Na.instance().startGame();
    Dn.instance().startGame();
    vn.instance().startGame();
    Eh.instance().startGame();
    Ki.instance().startGame();
    q.instance().startGame();
    th.instance().startGame();
    Mt.instance().startGame();
    return new Promise((resolve) => {
      K.instance().openScene("BattleScene", false, null, (s: any) => {
        mn.instance().startGame();
        An.instance().startGame();
        Tn.instance().startGame();
        resolve(s);
      });
    });
  }

  GH(): Promise<any> {
    wn.instance().jY();
    return this.startGame().then((t) => {
      wn.instance().$Y();
      return t;
    });
  }

  gameOver(t: any, s = false, i = false): void {
    F.instance().battleState.Vi = true;
    const h = F.instance().battleState.oi;
    const e = St.instance();
    if (t) e.Oy(h);
    else if (s) e.Xy(h);
    else e.Yy(h);
    wn.instance().gameOver();
    const a = F.instance().battleState.oi;
    F.instance().gameOver(t);
    vn.instance().gameOver();
    mn.instance().gameOver();
    An.instance().gameOver();
    Pn.instance().gameOver();
    y.instance.event(u.Dt);
    Na.instance().gameOver();
    Eh.instance().gameOver();
    Ki.instance().gameOver();
    q.instance().gameOver();
    Dn.instance().gameOver(t);
    st.instance().yp(t, {
      fail: (err: any) => {
        console.warn("[Server] end game report failed", err);
      },
    });
    y.instance.event(u.o, t);
    eh.instance().gameOver(t);
    K.instance().openScene("GameOverScene", false, { isWin: t, HH: s, round: a, WH: i });
    Zi.instance().gameOver(t);
    en.instance().gameOver();
    ma.instance().gameOver();
    fe.instance().gameOver();
    Fh.clearAllDeferredTrails();
    th.instance().gameOver();
    In.instance().CG();
    Mt.instance().fu();
  }

  test(): void {
    Laya.Scene.open("scene/SoldierRangeScene.ls");
  }

  zH(): void {}
}

/** Alias. (`Cn`) */
export const Cn = GameController;
