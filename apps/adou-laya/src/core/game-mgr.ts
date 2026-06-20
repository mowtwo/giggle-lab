// GameMgr — the central game-state hub.
//
// Faithful reconstruction of the original bundle's `U` class (aliased `F`),
// reconstruction/reference/bundle.pretty.js lines ~3179-3348. A singleton that
// lazily owns every game-state sub-manager and exposes init/startGame/gameOver
// plus the enemy/boss HP calculations and a coordinate helper.
//
// Getter -> sub-manager (original minified getter name):
//   onMgr=On  map  enemy  generals=Yn  soldierPool=hh  battleState=Xn  props
//   player  config=Gn  weaponData=Hn  rank  effectRelation=Wn  stamina
// Methods: init  startGame  gameOver  mapIndexForDay=zn  enemyHp=Nn  bossHp=qn
//   toLocal=Vn  settingData=Zn  nerfLowPrProp=Kn  incCounter=Fn

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";
import { MathE } from "./math-e";
import { SaveMgr } from "./save-mgr";
import { RankMgr } from "../data/rank-mgr";
import { WeaponDataMgr } from "../data/weapon-data-mgr";
import { PropsMgr } from "../data/props-mgr";
import { GeneralMgr } from "../data/general-mgr";
import { StaminaMgr } from "../data/stamina-mgr";
import { OnMgr } from "../data/on-mgr";
import { MapMgr } from "../battle/map-mgr";
import { EnemyMgr } from "../battle/enemy-mgr";
import { SoldierPool } from "../battle/soldier-pool";
import { BattleState } from "../battle/battle-state";
import { GameConfig } from "../battle/game-config";
import { EffectRelation } from "../battle/effect-relation";

export class GameMgr extends Singleton {
  // Map-index rotation tables (`jn`/`$n`).
  private static readonly jn = [0, 1, 2];
  private static readonly $n = [0, 1, 2, 3, 0, 1, 2];

  // Shared enemy-stat scratch buffer (`bn`).
  private bn = { uh: 0, speed: 0, dh: 0, Lh: 0 };
  // Frame/spawn counter (`Mn`).
  private Mn = 0;
  // Battle root container for coordinate transforms (`Qn`); set by BattleScene.
  Qn: any = null;

  private _onMgr: OnMgr | null = null;
  private _map: MapMgr | null = null;
  private _enemy: EnemyMgr | null = null;
  private _generals: GeneralMgr | null = null;
  private _soldierPool: SoldierPool | null = null;
  private _battleState: BattleState | null = null;
  private _props: PropsMgr | null = null;
  private _player: SaveMgr | null = null;
  private _config: GameConfig | null = null;
  private _weaponData: WeaponDataMgr | null = null;
  private _rank: RankMgr | null = null;
  private _effectRelation: EffectRelation | null = null;
  private _stamina: StaminaMgr | null = null;

  /** (`Fn`) */
  incCounter(): number {
    return (this.Mn += 1);
  }

  get onMgr(): OnMgr {
    return this._onMgr || (this._onMgr = new OnMgr());
  }
  get map(): MapMgr {
    return this._map || (this._map = new MapMgr());
  }
  get enemy(): EnemyMgr {
    return this._enemy || (this._enemy = new EnemyMgr());
  }
  get generals(): GeneralMgr {
    return this._generals || (this._generals = new GeneralMgr());
  }
  get soldierPool(): SoldierPool {
    return this._soldierPool || (this._soldierPool = new SoldierPool());
  }
  get battleState(): BattleState {
    return this._battleState || (this._battleState = new BattleState());
  }
  get props(): PropsMgr {
    return this._props || (this._props = new PropsMgr());
  }
  get player(): SaveMgr {
    return this._player || (this._player = SaveMgr.instance());
  }
  get config(): GameConfig {
    return this._config || (this._config = new GameConfig());
  }
  get weaponData(): WeaponDataMgr {
    return this._weaponData || (this._weaponData = new WeaponDataMgr());
  }
  get rank(): RankMgr {
    return this._rank || (this._rank = new RankMgr());
  }
  get effectRelation(): EffectRelation {
    return this._effectRelation || (this._effectRelation = new EffectRelation());
  }
  get stamina(): StaminaMgr {
    return this._stamina || (this._stamina = new StaminaMgr());
  }

  init(): void {
    this.player.init();
    this.props.init(this.player.lowPrProps);
    this.rank.init();
    this.map.init(this.mapIndexForDay());
    this.weaponData.init();
    this.generals.init();
    this.onMgr.init();
  }

  startGame(): void {
    this.map.startGame(this.mapIndexForDay());
    this.enemy.startGame();
    this.generals.startGame();
    this.soldierPool.startGame();
    this.battleState.startGame();
    this.player.startGame();
  }

  /** Map index for the current day / progression. (`zn`) */
  mapIndexForDay(): number {
    const player = this.player;
    if (MathE.daysBetween(player.registerTime, Date.now()) < 1) {
      const idx = Math.floor((player.roundDay - 1) / 7) % GameMgr.jn.length;
      return GameMgr.jn[idx];
    }
    const day = (new Date().getDay() + 6) % 7;
    return GameMgr.$n[day] ?? 0;
  }

  gameOver(win: boolean): void {
    this.map.gameOver();
    this.enemy.gameOver();
    this.generals.gameOver();
    this.soldierPool.gameOver();
    this.battleState.gameOver();
    this.player.gameOver(win);
    this.Mn = 0;
  }

  /** Enemy HP for type `type` at the current difficulty. (`Nn`) */
  enemyHp(type: number, _arg?: any): { uh: number; speed: number; dh: number; Lh: number } {
    if (type >= this.enemy.oh.length) type = this.map.re;
    let e = this.battleState.oi;
    e = Math.max(1, e);
    if (this.battleState.li && e > this.battleState.ci) {
      this.bn.uh = this.enemy.oh[type].uh[0] * Math.pow(1.5, e - 1);
    } else {
      const hpArr = this.enemy.oh[type].uh;
      const a = this.battleState.ui;
      const n = Math.min(e, hpArr.length) - 1;
      const r = Math.max(0, Math.min(e - 1, a.length - 1));
      if (this.player.round < 10 && e <= 10) {
        this.bn.uh = hpArr[n] * (a[r] ?? 1) * this.enemy.rh[this.player.round];
      } else {
        this.bn.uh = hpArr[n] * (a[r] ?? 1);
      }
      if (e > 10) {
        this.bn.uh += this.bn.uh * this.rank.table.get(this.rank.currentRank.id)!.addHp;
      }
    }
    this.bn.speed = this.enemy.oh[type].speed;
    return this.bn;
  }

  /** Boss HP for boss `type`. (`qn`) */
  bossHp(type: number, arg?: any): { uh: number; speed: number; dh: number; Lh: number } {
    this.bn.uh = this.enemy.gh[type].uh * this.enemyHp(this.map.re, arg).uh;
    this.bn.speed = this.enemy.gh[type].speed;
    this.bn.dh = this.enemy.gh[type].dh;
    this.bn.Lh = this.enemy.gh[type].Lh;
    return this.bn;
  }

  /** Convert a display object's point into the battle root's local space. (`Vn`) */
  toLocal(target: any, anchor?: any, useTemp = true): any {
    if (!this.Qn) {
      const p = useTemp ? Laya.Point.TEMP : new Laya.Point();
      if (anchor && typeof anchor === "boolean" && anchor) {
        p.setTo(target.width / 2, target.height / 2);
      } else if (anchor && typeof anchor !== "boolean") {
        p.setTo(anchor.x, anchor.y);
      } else {
        p.setTo(0, 0);
      }
      return p;
    }
    let p: any;
    if (anchor) {
      if (typeof anchor === "boolean") {
        p = Laya.Point.TEMP;
        p.setTo(target.width / 2, target.height / 2);
      } else {
        p = anchor;
      }
    } else {
      p = Laya.Point.TEMP;
      p.setTo(0, 0);
    }
    return this.Qn.globalToLocal(target.localToGlobal(p, !useTemp));
  }

  /** Current player settings. (`Zn`) */
  settingData(): any {
    return this.player.settingData;
  }

  /** Permanently nerf a low-priority prop's drop weights. (`Kn`) */
  nerfLowPrProp(index: number): void {
    if (
      this.player.lowPrProps.indexOf(index) === -1 &&
      (this.player.lowPrProps.push(index),
      (this.props.Ue[index].Oe = 0.5 * (this.props.Ue[index].Oe as number)),
      (this.props.Ue[index].Ye = 0.2 * (this.props.Ue[index].Ye as number)),
      this.props.isUpgradeable(index))
    ) {
      const ze = this.props.Ue[index].ze;
      if (ze) this.props.Ue[index].ze = ze.map((v) => 0.5 * v);
      const je = this.props.Ue[index].je;
      if (je) this.props.Ue[index].je = je.map((v) => 0.2 * v);
    }
  }
}
