// SaveMgr — player save data (LocalStorage-backed).
//
// Faithful reconstruction of the original bundle's `E` class
// (reconstruction/reference/bundle.pretty.js lines ~1947-2347). Holds the whole
// player profile under LocalStorage key "playerData", persisting on every
// mutation (setData), and exposes typed getters/setters that mirror the bundle
// 1:1. Daily reset, login-streak tracking, and the gold/stamina change events
// (GameEvent.qt / GameEvent.Vt) are preserved.
//
// The original `E` was a plain class accessed as a singleton; we extend the
// reconstructed Singleton base so `SaveMgr.instance()` is the single accessor.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";
import { EventMgr } from "./event-mgr";
import { GameEvent } from "./game-event";
import { MathE } from "./math-e";

interface PlayerSetting {
  showDamageNum: boolean;
  musicVolume: number;
  soundVolume: number;
}

interface PlayerData {
  _nick: string;
  _gameAvatar: number;
  _avatarUrl: string;
  _province: string;
  _registerTime: number;
  _saveTime: number;
  _gold: number;
  _win: number;
  _lose: number;
  _weaponFragments: Array<[number, number]>;
  _equip: number[];
  _isGetLastRankReward: number;
  _props: any[];
  _winDay: number;
  _loseDay: number;
  _lastLoseDifficulty: number;
  _setting: PlayerSetting;
  _openProps: boolean;
  _lowPrProps: any[];
  _stamina: number;
  _lastRecoverStaminaTime: number;
  _staminaAdCountToday: number;
  _lastShareStaminaTime: number;
  _staminaShareCountToday: number;
  _winStreak: number;
  _consecutiveLoginDays: number;
  _weaponFree: boolean;
  _hasUsedFreeShovel: boolean;
  _hasUsedFreeBulldozer: boolean;
  _newWeaponIds: number[];
  _avatarUnlocks: number[];
  _sidebarState: number;
  _hasPlacedActivePropThisBattle: boolean;
  _weaponSceneDragGuideDone: boolean;
  _curStar: number;
  _lastStar: number;
  _mergedGenerals: number[];
  _selectedMapId: number;
}

export class SaveMgr extends Singleton {
  private readonly key = "playerData";
  private _data: PlayerData = {
    _nick: "",
    _gameAvatar: 1,
    _avatarUrl: "",
    _province: "",
    _registerTime: 0,
    _saveTime: 0,
    _gold: 0,
    _win: 0,
    _lose: 0,
    _weaponFragments: [],
    _equip: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    _isGetLastRankReward: 0,
    _props: [],
    _winDay: 0,
    _loseDay: 0,
    _lastLoseDifficulty: -1,
    _setting: { showDamageNum: true, musicVolume: 1, soundVolume: 1 },
    _openProps: false,
    _lowPrProps: [],
    _stamina: 0,
    _lastRecoverStaminaTime: 0,
    _staminaAdCountToday: 0,
    _lastShareStaminaTime: 0,
    _staminaShareCountToday: 0,
    _winStreak: 0,
    _consecutiveLoginDays: 0,
    _weaponFree: false,
    _hasUsedFreeShovel: false,
    _hasUsedFreeBulldozer: false,
    _newWeaponIds: [],
    _avatarUnlocks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    _sidebarState: 0,
    _hasPlacedActivePropThisBattle: false,
    _weaponSceneDragGuideDone: false,
    _curStar: 0,
    _lastStar: 0,
    _mergedGenerals: [],
    _selectedMapId: 0,
  };

  init(): void {
    let prevSaveTime = 0;
    try {
      const raw = Laya.LocalStorage.getItem(this.key);
      if (raw) prevSaveTime = JSON.parse(raw)?._saveTime || 0;
    } catch {
      console.error("读取存档失败");
    }
    this.getData();
    this.updateLoginStreak(prevSaveTime);
  }

  updateLoginStreak(prevSaveTime: number): void {
    if (prevSaveTime === 0) {
      this._data._consecutiveLoginDays = 1;
    } else {
      const days = MathE.daysBetween(prevSaveTime, Date.now());
      if (days === 0) {
        // same day: unchanged
      } else if (days === 1) {
        this._data._consecutiveLoginDays += 1;
      } else {
        this._data._consecutiveLoginDays = 1;
      }
    }
    this.setData();
  }

  startGame(): void {}

  gameOver(win: boolean): void {
    if (win) {
      this.win += 1;
      this._data._winStreak += 1;
    } else {
      this.lose += 1;
      this._data._winStreak = 0;
    }
    this.setData();
  }

  getData(): void {
    const initFresh = () => {
      if (!this._data._registerTime) {
        this._data._registerTime = Date.now();
        this._data._stamina = 30;
      }
      this.setData();
    };
    try {
      const raw = Laya.LocalStorage.getItem(this.key);
      if (!raw) {
        initFresh();
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed) this.initData(parsed);
    } catch (e) {
      console.error(e);
    }
    this.setData();
  }

  /** Merge a parsed save into _data field-by-field, honouring each field's type. */
  private initData(saved: any): void {
    for (const k in this._data) {
      const key = k as keyof PlayerData;
      const type = this.getType(this._data[key]);
      if (type === "map") {
        if (saved[key] !== undefined) (this._data[key] as any) = saved[key];
      } else if (type === "array") {
        if (Array.isArray(saved[key])) (this._data[key] as any) = saved[key];
      } else if (type === "object") {
        if (saved[key] && typeof saved[key] === "object") {
          Object.keys(this._data[key] as any).forEach((sub) => {
            if (saved[key][sub] !== undefined) (this._data[key] as any)[sub] = saved[key][sub];
          });
        }
      } else if (saved[key] !== undefined) {
        (this._data[key] as any) = saved[key];
      }
    }
    this.resetData();
    this.setData();
  }

  private getType(v: any): string {
    const s = Object.prototype.toString.call(v).match(/^\[object (.*)\]$/)![1].toLowerCase();
    if (s === "string" && typeof v === "object") return "object";
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    return s;
  }

  setData(): void {
    try {
      this._data._saveTime = Date.now();
      Laya.LocalStorage.setItem(this.key, JSON.stringify(this._data));
    } catch (e) {
      console.error(e);
    }
  }

  /** Daily reset of per-day state if the last save was on an earlier day. */
  private resetData(): void {
    console.log("this._data._saveTime", this._data._saveTime);
    console.log("Date.now()", Date.now());
    if (MathE.daysBetween(this._data._saveTime, Date.now()) >= 1) {
      // 已移除"每日刷新玩家已选技能":不再清空 _props。
      this._data._winDay = 0;
      this._data._loseDay = 0;
      this._data._lastLoseDifficulty = -1;
      this._data._lowPrProps.length = 0;
      this._data._staminaAdCountToday = 0;
      this._data._staminaShareCountToday = 0;
      this._data._lastStar = this._data._curStar;
      this._data._isGetLastRankReward = 0;
    }
  }

  get registerTime(): number {
    return this._data._registerTime;
  }
  set registerTime(v: number) {
    this._data._registerTime = v;
    this.setData();
  }

  get gold(): number {
    // 无限金币:玩家账号金币恒为极大值,所有消费都扣不动。
    return 999999;
  }
  set gold(v: number) {
    this._data._gold = v;
    EventMgr.instance.event(GameEvent.qt);
    this.setData();
  }

  /** 玩家在首页自选的地图索引(0-3)。改造新增。 */
  get selectedMapId(): number {
    return this._data._selectedMapId ?? 0;
  }
  set selectedMapId(v: number) {
    this._data._selectedMapId = v;
    this.setData();
  }

  /** 导出当前存档为 JSON 字符串。改造新增。 */
  exportSave(): string {
    return JSON.stringify(this._data);
  }

  /**
   * 用 JSON 覆盖本地存档。存档只在启动时读入内存,所以写入后必须刷新页面
   * (location.reload)才能让新存档生效——由调用方负责刷新。返回是否成功。
   */
  importSave(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (!data || typeof data !== "object" || data._registerTime === undefined) return false;
      Laya.LocalStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  get round(): number {
    return this._data._win + this._data._lose;
  }

  get win(): number {
    return this._data._win;
  }
  set win(v: number) {
    this._data._win = v;
    this._data._winDay += 1;
    this.setData();
  }

  get lose(): number {
    return this._data._lose;
  }
  set lose(v: number) {
    this._data._lose = v;
    this._data._loseDay += 1;
    this.setData();
  }

  get weaponFragments(): Array<[number, number]> {
    return this._data._weaponFragments;
  }
  set weaponFragments(v: Array<[number, number]>) {
    this._data._weaponFragments = v;
    this.setData();
  }
  getWeaponFragmentCount(id: number): number {
    const entry = this._data._weaponFragments.find((e) => e[0] === id);
    return entry ? entry[1] : 0;
  }
  setWeaponFragments(id: number, delta: number): void {
    const entry = this._data._weaponFragments.find((e) => e[0] === id);
    if (entry) entry[1] += delta;
    else this._data._weaponFragments.push([id, delta]);
    this.setData();
  }

  addNewWeaponId(id: number): void {
    if (!this._data._newWeaponIds) this._data._newWeaponIds = [];
    this._data._newWeaponIds.push(id);
    this.setData();
  }
  getNewWeaponIds(): number[] {
    return this._data._newWeaponIds || [];
  }
  clearNewWeapons(): void {
    this._data._newWeaponIds = [];
    this.setData();
  }

  get equip(): number[] {
    return this._data._equip;
  }
  setEquip(slot: number, id: number): void {
    this._data._equip[slot] = id;
    this.setData();
  }
  clearEquip(): void {
    this._data._equip = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    this.setData();
  }

  get isGetLastRankReward(): number {
    return this._data._isGetLastRankReward;
  }
  set isGetLastRankReward(v: number) {
    this._data._isGetLastRankReward = v;
    this.setData();
  }

  set gameAvatar(v: number) {
    this._data._gameAvatar = v;
    this.setData();
  }
  get gameAvatar(): number {
    return this._data._gameAvatar;
  }

  get avatarUrl(): string {
    return this._data._avatarUrl;
  }
  set avatarUrl(v: string) {
    this._data._avatarUrl = v;
    this.setData();
  }

  private getPropsType(p: any): any {
    return Array.isArray(p) ? p[0] : p;
  }
  getPropsData(): any[] {
    return this._data._props;
  }
  setPropsData(v: any[]): void {
    this._data._props = v.slice();
    this.setData();
  }
  hasProps(type: any): boolean {
    return this._data._props.some((p) => this.getPropsType(p) === type);
  }
  getPropsLevel(type: any): number {
    const p = this._data._props.find((x) => this.getPropsType(x) === type);
    return p ? (Array.isArray(p) ? p[1] : 1) : 0;
  }
  addProps(type: any, level = 1, leveled = false): void {
    this._data._props.push(leveled ? [type, level] : type);
    this.setData();
  }
  removeProps(type: any): void {
    const i = this._data._props.findIndex((p) => this.getPropsType(p) === type);
    if (i !== -1) {
      this._data._props.splice(i, 1);
      this.setData();
    }
  }
  upgradeProps(type: any, maxLevel: number): boolean {
    const i = this._data._props.findIndex((p) => this.getPropsType(p) === type);
    if (i === -1) return false;
    const p = this._data._props[i];
    if (!Array.isArray(p) || p[1] >= maxLevel) return false;
    p[1]++;
    this.setData();
    return true;
  }

  get roundDay(): number {
    return this._data._winDay + this._data._loseDay + 1;
  }
  get winDay(): number {
    return this._data._winDay;
  }
  get loseDay(): number {
    return this._data._loseDay;
  }
  get lastLoseDifficulty(): number {
    return this._data._lastLoseDifficulty;
  }
  set lastLoseDifficulty(v: number) {
    this._data._lastLoseDifficulty = v;
    this.setData();
  }

  get settingData(): PlayerSetting {
    return this._data._setting;
  }
  setSettingData(v: PlayerSetting): void {
    this._data._setting = v;
    this.setData();
  }

  get openProps(): boolean {
    // 改造:技能系统对玩家恒开,使其能在"技能背包"里自由分配并生效。
    return true;
  }
  set openProps(v: boolean) {
    this._data._openProps = v;
    this.setData();
  }

  get lowPrProps(): any[] {
    return this._data._lowPrProps;
  }
  set lowPrProps(v: any[]) {
    this._data._lowPrProps = v;
    this.setData();
  }

  get stamina(): number {
    return this._data._stamina;
  }
  set stamina(v: number) {
    this._data._stamina = v;
    EventMgr.instance.event(GameEvent.Vt);
    this.setData();
  }

  get lastRecoverTime(): number {
    return this._data._lastRecoverStaminaTime;
  }
  set lastRecoverTime(v: number) {
    this._data._lastRecoverStaminaTime = v;
    this.setData();
  }

  get videoCountToday(): number {
    return this._data._staminaAdCountToday;
  }
  set videoCountToday(v: number) {
    this._data._staminaAdCountToday = v;
    this.setData();
  }

  get lastShareStaminaTime(): number {
    return this._data._lastShareStaminaTime;
  }
  set lastShareStaminaTime(v: number) {
    this._data._lastShareStaminaTime = v;
    this.setData();
  }

  get staminaShareCountToday(): number {
    return this._data._staminaShareCountToday;
  }
  set staminaShareCountToday(v: number) {
    this._data._staminaShareCountToday = v;
    this.setData();
  }

  get winStreak(): number {
    return this._data._winStreak;
  }
  get consecutiveLoginDays(): number {
    return this._data._consecutiveLoginDays;
  }

  get weaponFree(): boolean {
    return this._data._weaponFree;
  }
  set weaponFree(v: boolean) {
    this._data._weaponFree = v;
    this.setData();
  }

  get hasUsedFreeShovel(): boolean {
    return this._data._hasUsedFreeShovel;
  }
  set hasUsedFreeShovel(v: boolean) {
    this._data._hasUsedFreeShovel = v;
    this.setData();
  }

  get hasUsedFreeBulldozer(): boolean {
    return this._data._hasUsedFreeBulldozer;
  }
  set hasUsedFreeBulldozer(v: boolean) {
    this._data._hasUsedFreeBulldozer = v;
    this.setData();
  }

  isAvatarUnlocked(id: number): boolean {
    // 解锁所有头像。
    void id;
    return true;
  }
  setAvatarUnlocked(id: number): void {
    if (this._data._avatarUnlocks[id - 1] !== 1) {
      this._data._avatarUnlocks[id - 1] = 1;
      this.setData();
    }
  }

  get sidebarState(): number {
    return this._data._sidebarState;
  }
  set sidebarState(v: number) {
    this._data._sidebarState = v;
    this.setData();
  }

  get hasPlacedActivePropThisBattle(): boolean {
    return this._data._hasPlacedActivePropThisBattle;
  }
  set hasPlacedActivePropThisBattle(v: boolean) {
    this._data._hasPlacedActivePropThisBattle = v;
    this.setData();
  }

  get weaponSceneDragGuideDone(): boolean {
    return this._data._weaponSceneDragGuideDone;
  }
  set weaponSceneDragGuideDone(v: boolean) {
    this._data._weaponSceneDragGuideDone = v;
    this.setData();
  }

  get nick(): string {
    return this._data._nick;
  }
  set nick(v: string) {
    this._data._nick = v;
    this.setData();
  }

  get province(): string {
    return this._data._province.length > 0 ? this._data._province : "未知";
  }
  set province(v: string) {
    this._data._province = v;
    this.setData();
  }

  get curStar(): number {
    return this._data._curStar;
  }
  set curStar(v: number) {
    this._data._curStar = v;
    this.setData();
  }

  get lastStar(): number {
    return this._data._lastStar;
  }
  set lastStar(v: number) {
    this._data._lastStar = v;
    this.setData();
  }

  get mergedGenerals(): number[] {
    return this._data._mergedGenerals;
  }
  addMergedGeneral(id: number): void {
    if (this._data._mergedGenerals.indexOf(id) === -1) {
      this._data._mergedGenerals.push(id);
      this.setData();
    }
  }
}
