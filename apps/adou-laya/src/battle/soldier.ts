// Soldier — player-unit combat base (the bundle's `Ws`).
//
// Faithful reconstruction of `Ws` (reconstruction/reference/bundle.pretty.js
// lines ~10220-10491). The on-board player unit: drag handling, a state machine
// (none/skip/walk/attack), a 3-phase hop ("skip") that arcs the body along a
// quadratic Bezier to a target cell, level changes, and attribute/state setters.
// Concrete unit visuals/attack (sL/iL/Zd/uL/onMoved/update) are implemented by
// the subclass `zs`. Opaque combat fields kept verbatim.
//
//   onDragStart=Md onDragEnd=Pd onEnterState=Jd onExitState=Kd jumpUpdate=tL
//   setCell=aL moveTo=nL moveToCell=lL changeLevel=cL getBaseAttr=Dg addAttr=Tg
//   Yn=sprite Vd=lvlClip hL=body  Td/Dd=cell type  Cd/Rd=cell  Ud=hop phase
//   Od=hop bezier  Nd=isGeneral  qa=weapon/level data

/* eslint-disable @typescript-eslint/no-explicit-any */

import { DraggableObject } from "./game-object";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { LayerZ } from "../core/layer-z";
import { MathE } from "../core/math-e";
import { GameMgr } from "../core/game-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { PrefabFactory } from "./prefab-factory";
import { EffectMgr } from "./effect-mgr";
import { PoolFactory } from "./pool-factory";

const evt = EventMgr.instance;
const u = GameEvent;
const X = LayerZ;

export abstract class Soldier extends DraggableObject {
  level = 1;
  Id = 0;
  Dd = 0;
  Td = 0;
  Rd = new Laya.Point();
  Cd = new Laya.Point();
  Ud = 1;
  Fd = false;
  Od = { Gl: { x: 0, y: 0 }, p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 }, time: 0 };
  Yd = 1;
  Xd: any[] = [];
  Gd = 0;
  Hd = 0;
  Wd = 1;
  zd = false;
  jd = false;
  $d = false;
  dd = 1;
  Nd = false;

  protected dg: any;
  qd: any;
  Yn: any; // soldier sprite (also the event dispatcher)
  protected qa: any;
  protected Vd: any; // level FontClip
  Qd: any; // type key
  protected hL: any; // body sprite (set up in setupVisual)
  currentState = "none";
  protected eL: any; // arrival callback
  protected rL: any;
  protected oL: any;
  targetX = 0;
  targetY = 0;
  addAttPower = 0;
  pL = 0;
  yL = 0;

  protected pg(): any {
    return this.Yn;
  }

  /** Drag begins: raise to top and broadcast drag state. (`Md`) */
  protected onDragStart(): void {
    this.Yn.zIndex = X.Vr;
    evt.event(u.Rt, this.currentState !== "none" ? false : true);
  }

  /** Drag/tap ends: restore z by row. (`Pd`) */
  protected onDragEnd(): void {
    this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
    evt.event(u.Ct);
  }

  init(type: any, qd: any): void {
    this.dg = GameMgr.instance();
    this.qd = qd;
    this.Yn = PrefabFactory.instance().getItem("soldier", this);
    this.qa = this.dg.generals.charWeaponIds.get(type)[0];
    this.Nd = !(this.dg.generals.Aa.indexOf(type) >= 0);
    this.Vd = this.Yn.getChildByName("lvl");
    this.Vd.value = "1";
    this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
    this.Qd = type;
    if (this.Td === 3 || this.Td === 1) this.changeState("none");
    this.Zd(type);
    UpdateMgr.instance().register(this.Yn.name, this, this.update);
  }

  changeState(state: string): void {
    this.onExitState();
    this.currentState = state;
    this.onEnterState();
  }

  /** (`Jd`) */
  protected onEnterState(): void {
    switch (this.currentState) {
      case "none":
        break;
      case "skip":
        UpdateMgr.instance().unregister(this.id + "_jump");
        UpdateMgr.instance().register(this.id + "_jump", this, this.jumpUpdate);
        break;
      default:
        this.sL(this.currentState);
    }
    this.event("onStateChange", this.currentState);
  }

  /** (`Kd`) */
  protected onExitState(): void {
    this.iL(this.currentState);
  }

  /** 3-phase hop: crouch, arc along a Bezier to the target cell, land. (`tL`) */
  protected jumpUpdate(delta: number): void {
    if (this.Ud === 1) {
      this.hL.scaleX = this.Yn.x < this.targetX ? -1 : 1;
      if (this.Fd) return;
      this.Yn.zIndex = X.nr + 9999;
      this.Fd = true;
      Laya.Tween.create(this.hL)
        .to("scaleY", 0.7)
        .duration(30)
        .chain()
        .to("scaleY", 1)
        .duration(30)
        .then(() => {
          this.Ud = 2;
          this.Fd = false;
          this.Od.Gl.x = this.Yn.x;
          this.Od.Gl.y = this.Yn.y;
          this.Od.p1.x = this.Yn.x + (this.targetX - this.Yn.x) / 2;
          this.Od.p1.y = Math.min(this.targetY, this.Yn.y) - 100;
          this.Od.p2.x = this.targetX;
          this.Od.p2.y = this.targetY;
        }, this);
    } else if (this.Ud === 2) {
      this.Od.time += delta / (100 * this.Yd);
      if (MathE.quadraticBezierPoint(this.Od.Gl, this.Od.p1, this.Od.p2, this.Yn, this.Od.time)) {
        this.Yn.x = this.targetX;
        this.Yn.y = this.targetY;
        this.Ud = 3;
      } else {
        if (this.Od.time < 0.5) {
          this.hL.scaleX += 0.02;
          this.hL.scaleY += 0.02;
        }
        if (this.hL.scaleX > 1) {
          this.hL.scaleX -= 0.02;
          this.hL.scaleY -= 0.02;
        }
      }
    } else if (this.Ud === 3) {
      this.Ud = 1;
      this.Yd = 1;
      this.Od.time = 0;
      this.hL.scale(1, 1);
      AudioMgr.instance().playSound("soldier_set");
      if (this.eL) this.eL();
      UpdateMgr.instance().unregister(this.id + "_jump");
      this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
    }
  }

  /** Record the unit's cell type + grid cell. (`aL`) */
  protected aL(cellType = 0, x = -1, y = -1): void {
    this.Dd = this.Td;
    this.Td = cellType;
    this.Rd.copy(this.Cd);
    this.Cd.setTo(x, y);
  }

  /** Place/move the unit (mode 1 = to grid cell, 3 = active prop, else to node). (`nL`) */
  protected nL(cellType: number, x: number, y: number, onArrive: any, _e = false, node?: any): void {
    this.aL(cellType, x, y);
    Laya.Point.TEMP.setTo(0, 0);
    this.Yn.localToGlobal(Laya.Point.TEMP);
    if (cellType === 1) {
      evt.event(u.bt, this.Yn);
      this.Yn.zIndex = X.entityZIndexFromGridRow(y);
      this.Yn.parent.globalToLocal(Laya.Point.TEMP);
      this.Yn.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
      this.eL = onArrive;
      this.rL = x;
      this.oL = y;
      this.targetX = x * this.dg.map.gridWid;
      this.targetY = y * this.dg.map.gridHei;
    } else if (cellType === 3) {
      if (this.qd) {
        evt.event(u.Mt, this.Yn, x);
        this.Yn.parent.globalToLocal(Laya.Point.TEMP);
        this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
        this.eL = onArrive;
        this.rL = x;
        this.oL = y;
        this.targetX = this.Yn.x;
        this.targetY = this.Yn.y;
        this.Yn.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
      } else {
        x = 4;
        y = -5;
        this.Yn.zIndex = X.entityZIndexFromPixelY(this.Yn.y, this.dg.map.gridHei);
        this.eL = onArrive;
        this.targetX = this.Yn.x * this.dg.map.gridWid;
        this.targetY = this.Yn.y * this.dg.map.gridHei;
      }
    } else if (node) {
      node.parent.addChild(this.Yn);
      this.Yn.parent.globalToLocal(Laya.Point.TEMP);
      this.Yn.pos(Laya.Point.TEMP.x, Laya.Point.TEMP.y);
      this.eL = onArrive;
      this.targetX = node.x;
      this.targetY = node.y;
    }
    this.changeState("skip");
  }

  /** Move to a grid cell with a set-down effect on arrival. (`lL`) */
  protected lL(cellType: number, x: number, y: number): void {
    if (this.Td === 1) evt.event(u.j, this.id);
    this.nL(cellType, x, y, () => {
      if (this.Yn.parent) {
        this.onMoved();
        EffectMgr.instance().playSetSoldierEffect(
          this.Yn.parent,
          this.Yn.x + this.Yn.width / 2,
          this.Yn.y + this.Yn.height / 2,
          1,
        );
      }
    });
  }

  /** Change the unit's level (clamped 1..5), refresh data + level-up visual. (`cL`) */
  protected cL(delta = 1, playEffect = true): void {
    const leveledUp = delta > 0;
    this.level = Math.min(5, Math.max(this.level + delta, 1));
    this.Id = this.dg.generals.Wa[this.level - 1];
    this.Vd.value = this.level.toString();
    if (!this.Nd) this.qa = this.dg.generals.charWeaponIds.get(this.Qd)[this.level - 1];
    if (leveledUp) {
      if (playEffect) EffectMgr.instance().playSmokeEffect(this.Yn, 40, 40);
      this.uL();
    }
  }

  resetData(): void {
    this.level = 1;
    this.Id = 0;
    this.Vd.visible = true;
    this.Dd = 0;
    this.Td = 0;
    this.Rd.setTo(-1, -1);
    this.Cd.setTo(-1, -1);
  }

  /** Base attribute value by type (0=power, 2=range/cell, 1=speed). (`Dg`) */
  Dg(type: number): number | undefined {
    if (type === 0) return this.Gd;
    if (type === 2) return this.Hd / this.dg.map.gridWid;
    if (type === 1) return 1;
    return undefined;
  }

  /** Add an attribute delta by type. (`Tg`) */
  Tg(type: number, delta: number): void {
    if (type === 0) this.addAttPower += delta;
    else if (type === 2) this.pL += delta;
    else if (type === 1) this.yL += delta;
  }

  /** Set a state flag (1=chaos, 2=frozen, 3=charm). (`setState`) */
  setState(type: number, on: boolean, _val?: any): void {
    if (type === 1) this.zd = on;
    else if (type === 2) this.jd = on;
    else if (type === 3) {
      this.$d = on;
      if (on) {
        this.dd = this.level;
        this.cL(1 - this.level);
      } else {
        this.cL(this.dd - 1);
      }
    }
  }

  gameOver(): void {
    super.gameOver();
    this.aL();
    UpdateMgr.instance().unregister(this.Yn.name);
    UpdateMgr.instance().unregister(this.id + "_jump");
    Laya.timer.clearAll(this);
    evt.event(u.es, this.id);
    this.Ud = 1;
    this.Od.time = 0;
    this.Yn.x = 0;
    this.Yn.y = 0;
    this.Yn.anchorX = 0;
    this.Yn.anchorY = 0;
    this.Yn.scale(1, 1);
    this.Yn.removeSelf();
    this.Yn.filters = null;
    Laya.Tween.killAll(this.Yn);
    this.hL.visible = true;
    this.hL.rotation = 0;
    this.hL.removeSelf();
    this.hL.scale(1, 1);
    this.Yn.offAll();
    PrefabFactory.instance().recover("soldier", this.Yn);
    this.resetData();
    PoolFactory.instance().recover(this);
    this.Xd.length = 0;
    this.Fd = false;
    this.Yd = 1;
  }

  // Subclass hooks (visuals / attack / weapon — implemented by `zs`).
  protected abstract sL(state: string): void;
  protected abstract iL(state: string): void;
  protected abstract Zd(type: any): void;
  protected abstract uL(): void;
  protected abstract onMoved(): void;
  abstract update(delta: number): void;
}
