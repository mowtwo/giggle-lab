// GMDialog — the developer GM/debug panel (the bundle's `On`, @regClass
// -qW2t8JqR0Kw45kO5UtX4w).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~29027-29808. A grid of one-shot GM commands (add gold, spawn boss, random
// props/weapons, etc.) plus four editor panels (in-battle general weapon, buff
// apply/remove, player+AI props slots, boss select). Only ever opened when the
// GM flag `GameController.OH` is true, so it never runs in the shipped build —
// like the platform SDK adapters it is registered for completeness but its
// gameplay-manager access is intentionally loosely typed (`any`). Opaque field /
// method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { LayerZ } from "../core/layer-z";
import { SceneMgr } from "../core/scene-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { MathE } from "../core/math-e";
import { GameMgr } from "../core/game-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { EntityRegistry } from "../battle/entity-registry";
import { WeaponMgr } from "../battle/weapon-factory";
import { WeaponFragmentMgr } from "../battle/weapon-fragment-mgr";
import { FocusMgr } from "../battle/focus-mgr";
import { BuffMgr } from "../battle/buff-mgr";
import { EnemySpatialMgr } from "../battle/enemy-spatial-mgr";
import { GameController } from "../battle/game-controller";
import { PlatformMgr } from "../platform/platform-mgr";

const X = LayerZ;
const K = SceneMgr;
const q = EffectMgr;
const y = EventMgr;
const u = GameEvent;
const f = MathE;
// Gameplay managers — loosely typed; GMDialog is OH-gated debug code.
const F = GameMgr as any;
const Zi = BattlePropsMgr as any;
const Ki = EntityRegistry as any;
const ma = WeaponMgr as any;
const eh = WeaponFragmentMgr as any;
const Tn = FocusMgr as any;
const th = BuffMgr as any;
const Eh = EnemySpatialMgr as any;
const Cn = GameController as any;
const Mt = PlatformMgr as any;

@regClass("-qW2t8JqR0Kw45kO5UtX4w")
export class GMDialog extends Laya.Dialog {
  // .ls-bound nodes (a large editor surface)
  [k: string]: any;

  private gmCommands = [
    { label: "AI加钱20", execute: () => { F.instance().battleState.Ki += 20; } },
    { label: "玩家加钱20", execute: () => { F.instance().battleState.gold += 20; } },
    { label: "下波必出Boss", execute: () => { F.instance().battleState.gi = true; } },
    { label: "武将升一级", execute: () => { this.levelUpAllGenerals(); } },
    { label: "天数+1", execute: () => { F.instance().player.registerTime -= 86400000; } },
    { label: "处死对手", execute: () => { F.instance().battleState.enemyLives -= 3; } },
    { label: "出Boss", execute: () => { this.spawnBoss(); } },
    { label: "测试场景", execute: () => { this.goToTestScene(); } },
    { label: "直接开始", execute: () => { this.directStart(); } },
    { label: "AI金钱归零", execute: () => { F.instance().battleState.Ki = 0; } },
    { label: "随机道具", execute: () => { this.randomProps(); } },
    { label: "清除武器数据", execute: () => { F.instance().player.clearEquip(); } },
    { label: "加钱", execute: () => { F.instance().player.gold += 1000; } },
    { label: "加体力", execute: () => { F.instance().player.stamina += 10; } },
    { label: "随机武器碎片1-5", execute: () => { this.randomWeaponFragments(); } },
    { label: "退出插屏", execute: () => { Mt.instance().pu("exit"); } },
    { label: "结算插屏", execute: () => { Mt.instance().pu("settlement"); } },
    { label: "激励视频", execute: () => { Mt.instance().uu(); } },
  ];
  private gmItem: any[] = [];
  private currentPlayerGeneralArray: any[] = [];
  private currentAiGeneralArray: any[] = [];
  private mouseOffset = new Laya.Point();
  private originPos = new Laya.Point();
  private userCustomDragPos = new Laya.Point();
  private currentPlayerGeneral: any = null;
  private currentAIGeneral: any = null;
  private Lg = [0, 2, 1, 16, 13, 18];
  private jH = ["攻击力", "攻击范围", "攻击速度", "铁锁链", "混乱", "压制"];
  private $H = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  private NH = ["张梁", "张宝", "张角", "孙尚香", "甄宓", "貂蝉", "华雄", "吕布", "董卓", "典韦", "夏侯惇", "曹操"];
  private playerActivePropsCombo: any[] = [];
  private playerPassivePropsCombo: any[] = [];
  private aiActivePropsCombo: any[] = [];
  private aiPassivePropsCombo: any[] = [];
  private playerActiveLevelCombo: any[] = [];
  private playerPassiveLevelCombo: any[] = [];
  private aiActiveLevelCombo: any[] = [];
  private aiPassiveLevelCombo: any[] = [];

  onAwake(): void {
    this.initPanel();
    this.initRefreshGeneral();
    this.xBtn.on(Laya.Event.CLICK, this, () => {
      K.instance().closeDialog("GMDialog");
    });
    this.yesBtn.on(Laya.Event.CLICK, this, this.yesBtnClick);
    this.zIndex = X.Zr;
    this.bindAllComboDropdownZIndex();
  }

  bindAllComboDropdownZIndex(): void {
    this.qH(this, (t: any) => this.bindComboDropdownZIndex(t));
  }

  qH(t: any, s: (c: any) => void): void {
    if (t instanceof Laya.ComboBox) s(t);
    for (let k = 0; k < t.numChildren; k++) this.qH(t.getChildAt(k), s);
  }

  bindComboDropdownZIndex(t: any): void {
    const s = () => {
      const z2 = X.Kr;
      if (t.list) t.list.zIndex = z2;
      if (t.scrollBar) t.scrollBar.zIndex = z2;
    };
    s();
    t.on(Laya.Event.MOUSE_DOWN, this, () => Laya.timer.callLater(this, s));
  }

  onOpened(_t?: any): void {}

  initPanel(): void {
    this.gmCommands.forEach((t, s) => {
      const i = new Laya.Image("resources/img/commonUI/tipBg.png");
      i.size(190, 106);
      i.anchorX = 0.5;
      i.anchorY = 0.5;
      i.pos((s % 3) * 200 + 5 + 95, 110 * Math.floor(s / 3) + 53);
      this.panel.addChild(i);
      const h = new Laya.Text();
      h.text = t.label;
      h.pos(0, 0);
      h.size(190, 106);
      h.fontSize = 30;
      h.color = "#ffffff";
      h.stroke = 6;
      h.align = "center";
      h.valign = "middle";
      i.addChild(h);
      i.on(Laya.Event.CLICK, this, t.execute);
      this.gmItem.push(i);
      q.instance().bindButtons([i]);
    });
    q.instance().bindButtons([this.yesBtn]);
    this.hideBkCheck.clickHandler = new Laya.Handler(this, () => {
      this.box.visible = !this.hideBkCheck.selected;
      if (this.hideBkCheck.selected) this.extraArea.pos(this.userCustomDragPos.x, this.userCustomDragPos.y);
      else this.extraArea.pos(this.originPos.x, this.originPos.y);
    });
    this.originPos.setTo(this.extraArea.x, this.extraArea.y);
    this.userCustomDragPos.setTo(this.extraArea.x, this.extraArea.y);
    this.extraArea.on(Laya.Event.MOUSE_DOWN, this, (t: any) => {
      if (this.hideBkCheck.selected)
        this.mouseOffset.setTo(t.touchPos.x - this.extraArea.x, t.touchPos.y - this.extraArea.y);
    });
    this.extraArea.on(Laya.Event.MOUSE_DRAG, this, (t: any) => {
      if (this.hideBkCheck.selected)
        this.extraArea.pos(t.touchPos.x - this.mouseOffset.x, t.touchPos.y - this.mouseOffset.y);
    });
    this.extraArea.on(Laya.Event.DRAG_END, this, () => {
      if (this.hideBkCheck.selected) this.userCustomDragPos.setTo(this.extraArea.x, this.extraArea.y);
    });
    this.extraComb.selectedIndex = 0;
    this.extraComb.selectHandler = new Laya.Handler(this, (t: number) => {
      this.generalWeaponBox.visible = t === 0;
      this.buffEditorBox.visible = t === 1;
      this.propsEditorBox.visible = t === 2;
      this.bossEditorBox.visible = t === 3;
    });
    this.initInBattleGeneralPanel();
    this.initBuffPanel();
    this.initPropsEditorPanel();
    this.initBossSelectPanel();
  }

  initInBattleGeneralPanel(): void {
    q.instance().bindButtons([this.writeToConfig]);
    this.writeToConfig.clickHandler = Laya.Handler.create(this, () => {
      if (this.currentPlayerGeneral)
        F.instance().player.setEquip(this.currentPlayerGeneral.type, this.currentPlayerGeneral.weaponId);
      else console.warn("GM: 请先选择玩家武将");
    });
    const t = Ki.instance();
    this.playerGeneral.selectHandler = new Laya.Handler(this, (s: number) => {
      this.currentPlayerGeneral = s === -1 ? null : t.Qk.get(this.currentPlayerGeneralArray[s]) ?? null;
      this.updateWeaponCombo(true);
    });
    this.aiGeneral.selectHandler = new Laya.Handler(this, (s: number) => {
      this.currentAIGeneral = s === -1 ? null : t.Qk.get(this.currentAiGeneralArray[s]) ?? null;
      this.updateWeaponCombo(false);
    });
    this.playerGeneralWeapon.selectHandler = new Laya.Handler(this, (idx: number) => {
      if (idx === -1 || !this.currentPlayerGeneral) return;
      const s = this.playerGeneralWeapon.weaponIdMapper;
      if (s && s[idx] && s[idx].weaponId != this.currentPlayerGeneral.weaponId)
        this.currentPlayerGeneral.BR(undefined, s[idx].weaponId);
    });
    this.aiGeneralWeapon.selectHandler = new Laya.Handler(this, (idx: number) => {
      if (idx === -1 || !this.currentAIGeneral) return;
      const s = this.aiGeneralWeapon.weaponIdMapper;
      if (s && s[idx] && s[idx].weaponId != this.currentAIGeneral.weaponId)
        this.currentAIGeneral.BR(undefined, s[idx].weaponId);
    });
    Laya.timer.frameLoop(30, this, () => {
      let s = false;
      let i = false;
      this.currentPlayerGeneralArray.forEach((id) => {
        if (!t.Qk.has(id)) {
          s = true;
          this.currentPlayerGeneralArray.splice(this.currentPlayerGeneralArray.indexOf(id), 1);
        }
      });
      this.currentAiGeneralArray.forEach((id) => {
        if (!t.Qk.has(id)) {
          i = true;
          this.currentAiGeneralArray.splice(this.currentAiGeneralArray.indexOf(id), 1);
        }
      });
      t.Qk.forEach((g: any, id: number) => {
        if (g.qd && this.currentPlayerGeneralArray.indexOf(id) === -1) {
          s = true;
          this.currentPlayerGeneralArray.push(id);
        }
      });
      t.Qk.forEach((g: any, id: number) => {
        if (!g.qd && this.currentAiGeneralArray.indexOf(id) === -1) {
          i = true;
          this.currentAiGeneralArray.push(id);
        }
      });
      if (s) {
        this.playerGeneral.labels = this.currentPlayerGeneralArray.map((id) => t.Qk.get(id)?.SD).join(",");
        if (this.playerGeneral.labels) this.playerGeneral.selectedIndex = 0;
      }
      if (i) {
        this.aiGeneral.labels = this.currentAiGeneralArray.map((id) => t.Qk.get(id)?.SD).join(",");
        if (this.aiGeneral.labels) this.aiGeneral.selectedIndex = 0;
      }
    });
  }

  updateWeaponCombo(t: boolean): void {
    const s = ma.instance();
    const i = F.instance();
    const h = t ? this.playerGeneralWeapon : this.aiGeneralWeapon;
    const e = t ? this.playerGeneral : this.aiGeneral;
    const a = t ? this.currentPlayerGeneral : this.currentAIGeneral;
    if (a)
      if (e.selectedLabel) {
        let type = 2;
        if (a.type !== -1) type = i.generals.generalTypes[a.type].type;
        const list = s.kR(type);
        h.labels = list.map((w: any) => w.weaponName).join(",");
        h.weaponIdMapper = list;
        h.selectedIndex = list.findIndex((w: any) => w.weaponId == a.weaponId);
      } else h.labels = "";
    else h.labels = "";
  }

  levelUpAllGenerals(): void {
    for (const t of Ki.instance().Qk)
      t[1].RS(F.instance().generals.Wa[t[1].level] - F.instance().generals.Wa[t[1].level - 1]);
  }

  spawnBoss(): void {
    const t = this.$H[this.bossTypeComb.selectedIndex];
    Eh.instance().TA(t, true);
    Eh.instance().TA(t, false);
    this.close();
  }

  goToTestScene(): void {
    try {
      Cn.instance().gameOver(false, true);
    } catch {
      console.log("toTestScene");
    }
  }

  directStart(): void {
    Cn.instance().startGame();
    F.instance().battleState.gold += 999999;
    F.instance().battleState.Ki = 0;
  }

  randomProps(): void {
    const h = F.instance().props;
    const e = f.sample(h.$e, h.Ze);
    const a = f.sample(h.Ne, h.Ke);
    const n: any[] = [];
    const r: any[] = [];
    for (let s = 0; s < h.Ze; s++) n.push({ type: e[s] ?? null, level: 1 });
    for (let t = 0; t < h.Ke; t++) r.push({ type: a[t] ?? null, level: 1 });
    Zi.instance().Vx(n, r);
    if (this.playerActivePropsCombo?.length) this.loadPlayerBattleSlotsToCombos();
    console.log("GM 随机道具", e, a);
  }

  randomWeaponFragments(): void {
    const s = F.instance().weaponData.weapons;
    const i: number[] = [];
    s.forEach((w: any, id: number) => {
      if (w.fragmentNum != null && w.fragmentNum >= 1) i.push(id);
    });
    if (i.length === 0) return void console.log("GM 随机武器碎片：无可合成武器");
    const h = i[Math.floor(Math.random() * i.length)];
    const e = 1 + Math.floor(5 * Math.random());
    eh.instance().setWeaponFragments(h, e);
    const a = s.get(h);
    console.log("GM 随机武器碎片：", a?.txt ?? h, "+", e);
  }

  initRefreshGeneral(): void {
    let t: any[] = [];
    t.push("无");
    t = t.concat(F.instance().generals.generalNames);
    for (let s = 0; s < t.length; s++) if (!(t[s] !== "无" && t[s].length <= 1)) this.general.labels += t[s] + ",";
    this.general.scrollType = Laya.ScrollType.Vertical;
    this.general.labelSize = 30;
    this.general.selectHandler = new Laya.Handler(this, () => {
      F.instance().battleState.di = this.general.selectedLabel;
    });
  }

  yesBtnClick(): void {
    const s = this.command.text;
    if (s.includes("gw-")) {
      const t = s.split("-");
      F.instance().player.setEquip(Number(t[1]), Number(t[2]));
      console.log("设置武器", t);
    }
  }

  initBuffPanel(): void {
    this.removeBuff.visible = false;
    this.applyBuff.visible = false;
    y.instance.on(u.ys, this, () => {
      this.removeBuff.visible = true;
      this.applyBuff.visible = true;
      const t = Tn.instance().kH;
      if (t && t.objectType === 1) this.targetName.text = t.soldierText + " (" + t.id + ")";
      else if (t && t.objectType === 2) this.targetName.text = t.generalName + " (" + t.id + ")";
      else {
        this.removeBuff.visible = false;
        this.applyBuff.visible = false;
      }
    });
    this.buffTypeComb.labels = this.jH.join(",");
    this.buffTypeComb.selectedIndex = 0;
    this.removeBuff.clickHandler = new Laya.Handler(this, () => {
      const t = Tn.instance().kH;
      if (!t) return;
      const s = this.Lg[this.buffTypeComb.selectedIndex];
      y.instance.event(u.hs, t, s);
    });
    this.applyBuff.clickHandler = new Laya.Handler(this, () => {
      const t = Tn.instance().kH;
      if (!t) return;
      const s = this.Lg[this.buffTypeComb.selectedIndex];
      th.instance().applyBuff(
        t.id,
        s,
        Number.parseFloat(this.buffValue.text),
        this.buffValueIsMutil.selected,
        Number.parseFloat(this.buffTime.text),
      );
    });
  }

  initPropsEditorPanel(): void {
    const t = F.instance().props;
    const s = ["无", ...t.$e.map((x: number) => t.Ue[x].txt)];
    const i = ["无", ...t.Ne.map((x: number) => t.Ue[x].txt)];
    this.initPlayerPropsCombos(s, i);
    this.initAiPropsCombos(s, i);
    this.loadPlayerBattleSlotsToCombos();
    this.initCustomPropsCheckbox();
  }

  getLevelLabelsForType(t: any): string[] {
    const i = F.instance().props;
    if (t == null || !i.isUpgradeable(t)) return ["1"];
    const h = i.Ue[t].Xe?.length || 1;
    return Array.from({ length: h }, (_v, s) => String(s + 1));
  }

  initPlayerPropsCombos(t: string[], s: string[]): void {
    const i = F.instance().props;
    for (let k = 0; k < 2; k++) {
      const h: any = new Laya.ComboBox();
      h.labels = t.join(",");
      h.selectedIndex = 0;
      h.width = 150;
      h.height = 30;
      h.scrollType = Laya.ScrollType.Vertical;
      h.itemSize = 18;
      h.pos(10 + 160 * k, 80);
      this.propsEditorBox.addChild(h);
      this.playerActivePropsCombo.push(h);
      h.propsTypeMap = [null, ...i.$e];
      const e = this.VH(10 + 160 * k + 135, 80, 48, () => {
        this.syncPlayerCombosToPlayerData();
      });
      this.propsEditorBox.addChild(e);
      this.playerActiveLevelCombo.push(e);
      h.selectHandler = Laya.Handler.create(this, (idx: number) => {
        const type = h.propsTypeMap[idx];
        const labels = this.getLevelLabelsForType(type);
        e.labels = labels.join(",");
        e.selectedIndex = 0;
        this.syncPlayerCombosToPlayerData();
      });
    }
    for (let k = 0; k < 6; k++) {
      const h: any = new Laya.ComboBox();
      h.labels = s.join(",");
      h.selectedIndex = 0;
      h.width = 150;
      h.height = 30;
      h.scrollType = Laya.ScrollType.Vertical;
      h.itemSize = 18;
      h.pos(10 + (k % 3) * 160, 120 + 40 * Math.floor(k / 3));
      this.propsEditorBox.addChild(h);
      this.playerPassivePropsCombo.push(h);
      h.propsTypeMap = [null, ...i.Ne];
      const e = this.VH(10 + (k % 3) * 160 + 135, 120 + 40 * Math.floor(k / 3), 48, () => {
        this.syncPlayerCombosToPlayerData();
      });
      this.propsEditorBox.addChild(e);
      this.playerPassiveLevelCombo.push(e);
      h.selectHandler = Laya.Handler.create(this, (idx: number) => {
        const type = h.propsTypeMap[idx];
        const labels = this.getLevelLabelsForType(type);
        e.labels = labels.join(",");
        e.selectedIndex = 0;
        this.syncPlayerCombosToPlayerData();
      });
    }
  }

  syncPlayerCombosToPlayerData(): void {
    const t = Zi.instance();
    const s: any[] = [];
    const i: any[] = [];
    for (let k = 0; k < 2; k++) {
      const type = this.playerActivePropsCombo[k].propsTypeMap[this.playerActivePropsCombo[k].selectedIndex];
      s.push({ type, level: this.playerActiveLevelCombo[k].selectedIndex + 1 });
    }
    for (let k = 0; k < 6; k++) {
      const type = this.playerPassivePropsCombo[k].propsTypeMap[this.playerPassivePropsCombo[k].selectedIndex];
      i.push({ type, level: this.playerPassiveLevelCombo[k].selectedIndex + 1 });
    }
    t.Vx(s, i);
  }

  VH(t: number, s: number, i: number, h: (v: number) => void): any {
    const e: any = new Laya.ComboBox();
    e.labels = "1";
    e.selectedIndex = 0;
    e.width = i;
    e.height = 30;
    e.scrollType = Laya.ScrollType.Vertical;
    e.itemSize = 18;
    e.pos(t, s);
    e.selectHandler = Laya.Handler.create(this, (v: number) => {
      h(v + 1);
    });
    return e;
  }

  initAiPropsCombos(t: string[], s: string[]): void {
    const i = Zi.instance();
    const h = F.instance().props;
    for (let k = 0; k < 2; k++) {
      const e: any = new Laya.ComboBox();
      e.labels = t.join(",");
      e.selectedIndex = 0;
      e.width = 150;
      e.height = 30;
      e.scrollType = Laya.ScrollType.Vertical;
      e.itemSize = 18;
      e.pos(10 + 160 * k, 260);
      this.propsEditorBox.addChild(e);
      this.aiActivePropsCombo.push(e);
      e.propsTypeMap = [null, ...h.$e];
      const a = this.VH(10 + 160 * k + 135, 260, 48, (v: number) => {
        if (i.Ex) i.Ux[k] = v;
      });
      this.propsEditorBox.addChild(a);
      this.aiActiveLevelCombo.push(a);
      e.selectHandler = Laya.Handler.create(this, (idx: number) => {
        const type = e.propsTypeMap[idx];
        if (i.Ex) i.Dx[k] = type;
        const n = this.getLevelLabelsForType(type);
        a.labels = n.join(",");
        const r = n.length;
        const o = Math.min(i.Ux[k] || 1, r);
        i.Ux[k] = o;
        a.selectedIndex = o - 1;
      });
    }
    for (let k = 0; k < 6; k++) {
      const e: any = new Laya.ComboBox();
      e.labels = s.join(",");
      e.selectedIndex = 0;
      e.width = 150;
      e.height = 30;
      e.scrollType = Laya.ScrollType.Vertical;
      e.itemSize = 18;
      e.pos(10 + (k % 3) * 160, 300 + 40 * Math.floor(k / 3));
      this.propsEditorBox.addChild(e);
      this.aiPassivePropsCombo.push(e);
      e.propsTypeMap = [null, ...h.Ne];
      const a = this.VH(10 + (k % 3) * 160 + 135, 300 + 40 * Math.floor(k / 3), 48, (v: number) => {
        if (i.Ex) i.Fx[k] = v;
      });
      this.propsEditorBox.addChild(a);
      this.aiPassiveLevelCombo.push(a);
      e.selectHandler = Laya.Handler.create(this, (idx: number) => {
        const type = e.propsTypeMap[idx];
        if (i.Ex) i.Tx[k] = type;
        const n = this.getLevelLabelsForType(type);
        a.labels = n.join(",");
        const r = n.length;
        const o = Math.min(i.Fx[k] || 1, r);
        i.Fx[k] = o;
        a.selectedIndex = o - 1;
      });
    }
  }

  initCustomPropsCheckbox(): void {
    const t = Zi.instance();
    this.customPropsCheckbox = new Laya.CheckBox();
    this.customPropsCheckbox.skin = this.hideBkCheck.skin;
    this.customPropsCheckbox.label = "启用自定义道具";
    this.customPropsCheckbox.labelSize = 30;
    this.customPropsCheckbox.labelColors = "#000000";
    this.customPropsCheckbox.selected = t.Ex;
    this.customPropsCheckbox.width = 200;
    this.customPropsCheckbox.height = 40;
    this.customPropsCheckbox.pos(300, 10);
    this.customPropsCheckbox.stateNum = 1;
    this.propsEditorBox.addChild(this.customPropsCheckbox);
    this.customPropsCheckbox.clickHandler = Laya.Handler.create(this, () => {
      t.Ex = this.customPropsCheckbox.selected;
      if (t.Ex) {
        this.syncComboToPropsMgr();
        console.log("启用自定义道具", { player: t.qx(), aiActive: t.Dx, aiPassive: t.Tx });
      } else console.log("禁用自定义道具");
    });
  }

  loadPlayerBattleSlotsToCombos(): void {
    const p = Zi.instance();
    const { active: y2, passive: f2 } = p.qx();
    const g = (t: any, s: any[]) => {
      if (t == null) return 0;
      const i = s.indexOf(t);
      return i >= 0 ? i : 0;
    };
    for (let n = 0; n < 2; n++) {
      const r = this.playerActivePropsCombo[n].propsTypeMap;
      this.playerActivePropsCombo[n].selectedIndex = g(y2[n]?.type ?? null, r);
      const o = this.getLevelLabelsForType(y2[n]?.type ?? null);
      this.playerActiveLevelCombo[n].labels = o.join(",");
      this.playerActiveLevelCombo[n].selectedIndex = Math.min((y2[n]?.level ?? 1) - 1, o.length - 1);
    }
    for (let t = 0; t < 6; t++) {
      const s = this.playerPassivePropsCombo[t].propsTypeMap;
      this.playerPassivePropsCombo[t].selectedIndex = g(f2[t]?.type ?? null, s);
      const i = this.getLevelLabelsForType(f2[t]?.type ?? null);
      this.playerPassiveLevelCombo[t].labels = i.join(",");
      this.playerPassiveLevelCombo[t].selectedIndex = Math.min((f2[t]?.level ?? 1) - 1, i.length - 1);
    }
  }

  syncComboToPropsMgr(): void {
    const t = Zi.instance();
    const s: any[] = [];
    const i: any[] = [];
    for (let k = 0; k < 2; k++) {
      const c = this.playerActivePropsCombo[k];
      s.push({ type: c.propsTypeMap[c.selectedIndex], level: this.playerActiveLevelCombo[k].selectedIndex + 1 });
    }
    for (let k = 0; k < 6; k++) {
      const c = this.playerPassivePropsCombo[k];
      i.push({ type: c.propsTypeMap[c.selectedIndex], level: this.playerPassiveLevelCombo[k].selectedIndex + 1 });
    }
    t.Vx(s, i);
    for (let k = 0; k < 2; k++) {
      const c = this.aiActivePropsCombo[k];
      t.Dx[k] = c.propsTypeMap[c.selectedIndex];
      t.Ux[k] = this.aiActiveLevelCombo[k].selectedIndex + 1;
    }
    for (let k = 0; k < 6; k++) {
      const c = this.aiPassivePropsCombo[k];
      t.Tx[k] = c.propsTypeMap[c.selectedIndex];
      t.Fx[k] = this.aiPassiveLevelCombo[k].selectedIndex + 1;
    }
  }

  initBossSelectPanel(): void {
    this.bossTypeComb.labels = this.NH.join(",");
    this.bossTypeComb.selectedIndex = 0;
    this.bossTypeComb.scrollType = Laya.ScrollType.Vertical;
    this.bossTypeComb.itemSize = 18;
    this.bossTypeComb.scrollBarSkin = "";
  }
}
