// GameObject + DraggableObject — battle-entity base classes.
//
// Faithful reconstruction of the bundle's `Os` and `Ys`/`Xs` classes
// (reconstruction/reference/bundle.pretty.js lines ~10154-10208). GameObject
// delegates events to a subclass-provided dispatcher (`pg()`); DraggableObject
// adds pointer drag detection with a threshold. Concrete entities (soldier,
// enemy, boss) extend DraggableObject.
//
//   GameObject(Os): pg() abstract  gameOver -> "onDestroy"
//   DraggableObject(Ys/Xs): dragStart=bd  onDragStart=Md  onDragEnd=Pd
//     DRAG_THRESHOLD=Bd(5)

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */

import { EventMgr } from "../core/event-mgr";
import { GameEvent } from "../core/game-event";

export abstract class GameObject {
  objectType = 0;
  id = 0;

  /** Subclass-provided event dispatcher (a Laya node / EventDispatcher). */
  protected abstract pg(): any;

  once(type: string, listenerOrCaller: any, listener?: any): any {
    return listener ? this.pg().once(type, listener, listenerOrCaller) : this.pg().once(type, listenerOrCaller);
  }
  on(type: string, listenerOrCaller: any, listener?: any): any {
    return listener ? this.pg().on(type, listener, listenerOrCaller) : this.pg().on(type, listenerOrCaller);
  }
  off(type: string, listener: any): any {
    return this.pg().off(type, listener);
  }
  event(type: string, data?: any): any {
    return this.pg().event(type, data);
  }
  offAllCaller(caller: any): any {
    return this.pg().offAllCaller(caller);
  }
  offAll(type?: string): any {
    return this.pg().offAll(type);
  }

  gameOver(): void {
    this.event("onDestroy");
  }
}

export abstract class DraggableObject extends GameObject {
  static readonly DRAG_THRESHOLD = 5;

  protected dragStart = new Laya.Point();
  protected Ad = false; // pointer down
  protected Ed = false; // drag started

  /** Hook: drag began. (`Md`) */
  protected onDragStart(): void {}
  /** Hook: drag/tap ended. (`Pd`) */
  protected onDragEnd(): void {}

  onMouseDown(): void {
    this.Ad = true;
    this.Ed = false;
    this.dragStart.setTo(Laya.stage.mouseX, Laya.stage.mouseY);
  }

  onMouseMove(): void {
    if (this.Ad && !this.Ed) {
      const dx = Laya.stage.mouseX - this.dragStart.x;
      const dy = Laya.stage.mouseY - this.dragStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > DraggableObject.DRAG_THRESHOLD) {
        this.Ed = true;
        this.onDragStart();
      }
    }
  }

  onMouseUp(_e?: any, _s?: any): void {
    if (this.Ad) {
      this.Ad = false;
      if (!this.Ed) {
        EventMgr.instance.event(GameEvent.st, this.id);
        EventMgr.instance.event(GameEvent.us, this);
      }
      this.Ed = false;
      this.onDragEnd();
      EventMgr.instance.event(GameEvent.Ct);
    }
  }
}
