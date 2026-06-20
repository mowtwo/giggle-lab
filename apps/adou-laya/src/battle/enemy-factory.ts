// EnemyFactory + EnemyTypes.
//
// Faithful reconstruction of the original bundle's `ss` (enemy/boss factory) and
// `is` (enemy-type registry) classes (reconstruction/reference/bundle.pretty.js
// lines ~9163-9222). EnemyFactory is an auto-init singleton; concrete enemy/boss
// classes register their pooled creators with it (those registrations live with
// the entity classes and are ported alongside them).

/* eslint-disable @typescript-eslint/no-explicit-any */

export class EnemyFactory {
  private ag = new Map<string, () => any>();
  private static _instance: EnemyFactory;

  static instance(): EnemyFactory {
    if (!EnemyFactory._instance) {
      EnemyFactory._instance = new EnemyFactory();
      EnemyFactory._instance.init();
    }
    return EnemyFactory._instance;
  }

  init(): void {}

  register(type: string, factory: () => any): void {
    this.ag.set(type, factory);
  }

  /** Create a registered enemy/boss by type. (`ng`) */
  ng(type: string): any {
    const factory = this.ag.get(type);
    if (!factory) throw new Error(`EnemyFactory: 未为类型 ${type} 注册创建器`);
    return factory();
  }

  produce(cls: any): any {
    return Laya.Pool.createByClass(cls);
  }

  recover(obj: any): void {
    Laya.Pool.recoverByClass(obj);
  }
}

export class EnemyTypes {
  // Mob types (`lg`) and boss types (`ug`).
  static lg = ["Mob0", "Mob1", "Mob2", "Mob3", "Zombie", "Cavalry", "Puppet"];
  static ug = [
    "ZhangLiang", "ZhangBao", "ZhangJiao", "SunShangXiang", "ZhenFu", "DiaoChan",
    "HuaXiong", "LvBu", "DongZhuo", "DianWei", "XiaHouDun", "CaoCao",
  ];

  /** Create an enemy by type via the factory. (`rg`) */
  static rg(type: string): any {
    return EnemyFactory.instance().ng(type);
  }

  /** Copy of the mob-type list. (`og`) */
  static og(): string[] {
    return [...EnemyTypes.lg];
  }

  /** Copy of the boss-type list. (`cg`) */
  static cg(): string[] {
    return [...EnemyTypes.ug];
  }
}
