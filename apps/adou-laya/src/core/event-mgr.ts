// EventMgr — global event bus singleton.
//
// Faithful reconstruction of the original bundle's `p` class (see
// reconstruction/reference/bundle.pretty.js around line 121). It is a thin
// wrapper over Laya.EventDispatcher exposed as a process-wide singleton, with
// `on/off/once/offAll/offAllCaller` returning `this` for chaining and an
// `event()` overload that forwards a single argument as-is but packs multiple
// args into an array.
//
// Method overloads mirror Laya.EventDispatcher exactly so the chainable
// `this`-returning forms type-check.

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */

export class EventMgr extends Laya.EventDispatcher {
  private static _instance: EventMgr = new EventMgr();

  static get instance(): EventMgr {
    return this._instance;
  }

  constructor() {
    super();
  }

  event(type: string, ...args: any[]): boolean {
    if (args.length === 0) return super.event(type);
    if (args.length === 1) {
      const only = args[0];
      return Array.isArray(only) ? super.event(type, [only]) : super.event(type, only);
    }
    return super.event(type, args);
  }

  on(type: string, listener: Function): this;
  on(type: string, caller: any, listener: Function, args?: any[]): this;
  on(type: string, caller: any, listener?: Function, args?: any[]): this {
    super.on(type, caller, listener as Function, args);
    return this;
  }

  off(type: string, listener: Function): this;
  off(type: string, caller: any, listener?: Function, args?: any[]): this;
  off(type: string, caller: any, listener?: Function, args?: any[]): this {
    super.off(type, caller, listener, args);
    return this;
  }

  once(type: string, listener: Function): this;
  once(type: string, caller: any, listener: Function, args?: any[]): this;
  once(type: string, caller: any, listener?: Function, args?: any[]): this {
    super.once(type, caller, listener as Function, args);
    return this;
  }

  offAll(type?: string): this {
    super.offAll(type);
    return this;
  }

  offAllCaller(caller: any): this {
    super.offAllCaller(caller);
    return this;
  }

  hasListener(type: string): boolean {
    return super.hasListener(type);
  }
}
