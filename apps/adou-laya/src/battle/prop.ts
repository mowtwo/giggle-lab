// Prop — draggable battle-item entity base (the bundle's `xi`).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~12044-12149. A prop (shovel / spell / bulldozer …) shown on the board: pops
// in, can be dragged to a container, shows its info tooltip on tap, and tracks
// level. Concrete prop types (`Si` and its subclasses) override start/update/Nv.
// Opaque fields kept verbatim.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { DraggableObject } from "./game-object";
import { GameMgr } from "../core/game-mgr";
import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";
import { PrefabFactory } from "./prefab-factory";
import { UpdateMgr } from "../core/update-mgr";
import { EffectMgr } from "./effect-mgr";

const evt = EventMgr.instance;
const u = GameEvent;

export class Prop extends DraggableObject {
  protected Yv = new Laya.Point();
  level = 1;
  protected Xv = 0;
  protected Gv = 0;
  protected Hv = { containerType: 0, x: -1, y: -1 };
  protected props: any;
  Wv: any;
  type = 0;
  qd: any;
  protected zv: any;

  protected pg(): any {
    return this.props;
  }

  init(qd: any, type: number): void {
    const F = GameMgr.instance();
    this.id = (F.props.Ce += 1);
    this.type = type;
    this.qd = qd;
    this.props = PrefabFactory.instance().getItem("props", this);
    this.props.zIndex = 900;
    this.Wv = this.props.getChildByName("props");
    this.Wv.scale(0, 0);
    this.Wv.skin = `resources/img/props/${F.props.Ue[type].name}_${this.level}.png`;
    Laya.Tween.create(this.Wv)
      .to("scaleX", 1.2)
      .to("scaleY", 1.2)
      .duration(200)
      .chain()
      .to("scaleX", 0.9)
      .to("scaleY", 0.9)
      .duration(100)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(50)
      .then(() => {
        this.start();
      });
    UpdateMgr.instance().register("props" + this.id, this, this.update);
  }

  setParent(containerType: number, x: number, y: number): void {
    this.Xv = x;
    this.Gv = y;
    if ((containerType === 2 || containerType === 1) && this.qd) {
      evt.event(u.bt, this.props, x, y);
    } else if (containerType === 3 && this.qd) {
      evt.event(u.Mt, this.props, x);
    } else if (containerType === 4) {
      evt.event(u.Pt, this.qd, this.zv, this.props, x, y);
    }
    this.Hv.containerType = containerType;
    this.Hv.x = x;
    this.Hv.y = y;
  }

  start(): void {}
  update(_delta: number): void {}

  /** Set the prop's level (updates skin). (`jv`) */
  jv(level: number): void {
    this.level = level;
    this.Wv.skin = `resources/img/props/${GameMgr.instance().props.Ue[this.type].name}_${level}.png`;
  }

  onMouseUp(): void {
    if (!this.Ed) this.$v(true);
    this.Ed = false;
  }

  protected Nv(_t: any, _s: any): void {}

  /** Show/hide the prop info tooltip. (`$v`) */
  protected $v(show: boolean): void {
    if (!show) {
      EffectMgr.instance().showUnitInfo(false, null, "", "", 0);
      return;
    }
    this.Yv.x = 0;
    this.Yv.y = 0;
    this.props.localToGlobal(this.Yv);
    const bounds = {
      x: this.Yv.x,
      y: this.Yv.y,
      width: this.props.width * this.props.globalScaleX,
      height: this.props.height * this.props.globalScaleY,
    };
    EffectMgr.instance().showUnitInfo(
      true,
      bounds,
      this.qv(false),
      GameMgr.instance().props.Ue[this.type].txt,
      this.Vv(false),
    );
  }

  /** Rarity at (next) level. (`Vv`) */
  protected Vv(next: boolean): number {
    return GameMgr.instance().props.rarityAtLevel(this.type, next ? this.level + 1 : this.level);
  }

  /** Intro at (next) level. (`qv`) */
  protected qv(next: boolean): string {
    return GameMgr.instance().props.introAtLevel(this.type, next ? this.level + 1 : this.level);
  }

  reset(): void {
    evt.event(u.Pt, this.qd, this.zv, this.props, this.Xv, this.Gv);
    this.props.pos(0, 0);
  }

  gameOver(): void {
    super.gameOver();
    UpdateMgr.instance().unregister(`props${this.id}`);
    this.props.scale(1, 1);
    this.props.removeSelf();
    for (let t = this.props.numChildren - 1; t >= 0; t--) {
      const child = this.props.getChildAt(t);
      if (child.name !== "props" && child.name !== "cd") child.removeSelf();
    }
    this.Wv.removeChildren();
    PrefabFactory.instance().recover("props", this.props);
  }
}
