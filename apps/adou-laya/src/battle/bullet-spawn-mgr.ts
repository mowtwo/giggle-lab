// BulletSpawnMgr — owns every live bullet, drives movement + hit detection.
//
// Faithful reconstruction of the bundle's `fe` (reconstruction/reference/
// bundle.pretty.js lines ~19286-19460). Each frame it advances every bullet's
// movement, runs SAT collision against in-range enemies (respecting the bullet's
// hit strategy: pierce, single, delayed, request-remove), applies hits, and
// recycles bullets that leave the stage or finish. Opaque field / method names
// kept verbatim (cross-module bullet contract).
//
//   bullets=HB  spatial=WB  hub=zB  spawn=Tw  removeById=jB  recycle=$B
//   delayedHit=QB  finalHit=ZB

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { GameMgr } from "../core/game-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { SatCollision } from "./collision";
import { Ih } from "./bullet-factory";
import { HitEnemyStrategy } from "./hit-strategy";
import { EnemySpatialMgr } from "./enemy-spatial-mgr";

const F = GameMgr;
const j = UpdateMgr;
const ye = SatCollision;
const Vs = HitEnemyStrategy;
const Eh = EnemySpatialMgr;

export class BulletSpawnMgr extends Singleton {
  private FB = 100;
  private OB: any = { x: 0, y: 0, bB: 0, MB: 0, r: 0 };
  private YB: any[] = [];
  private XB = new Laya.Point();
  private GB = new Laya.Point();
  private HB!: any[];
  private WB!: any;
  private zB!: any;
  private yd = 0;
  private fd = 0;
  private Qn: any;
  private NB = false;
  private Bm = false;
  private qB = false;

  init(): void {
    this.HB = [];
    this.WB = Eh.instance();
    this.zB = F.instance();
    this.yd = this.zB.map.gridWid;
    this.fd = this.zB.map.gridHei;
    j.instance().register("bulletMgr", this, this.update);
  }

  /** Spawn (pool) a bullet from a spec at position `s`. (`Tw`) */
  Tw(t: any, s: { x: number; y: number } = { x: 0, y: 0 }): any {
    if (!this.Qn) this.Qn = this.zB.Qn;
    const i = Ih.produce(t);
    if (t.Um) i.Um = t.Um;
    const h = t.rm;
    if (h) {
      const rm = i.rm;
      if (h.um != null) rm.um = h.um;
      if (h.lm != null) rm.lm = h.lm;
      if (h.om != null) rm.om = h.om;
    }
    i.pos(s.x, s.y);
    i.resetData(t);
    this.HB.push(i);
    return i;
  }

  /** Remove a bullet by id. (`jB`) */
  jB(t: number): void {
    const s = this.HB.findIndex((b) => b.id === t);
    if (s >= 0) this.$B(s);
  }

  Am(t: any): void {
    const s = this.HB.indexOf(t);
    if (s >= 0) this.$B(s);
  }

  /** Recycle the bullet at index `t`. (`$B`) */
  private $B(t: number): void {
    const s = this.HB[t];
    s.Om.WL();
    Ih.recover(s);
    this.HB.splice(t, 1);
  }

  update(t: number): void {
    const WB = this.WB;
    for (let e = this.HB.length - 1; e >= 0; e--) {
      const a = this.HB[e];
      const n = a.Um;
      const r = a.PL;
      const o = a.vm;
      const l = a.bm;
      if (!l) continue;
      this.NB = false;
      this.Bm = false;
      if (
        !o &&
        !a.Jm &&
        (a.x > Laya.stage.width + this.FB ||
          a.y > Laya.stage.height + this.FB ||
          a.x < -this.FB ||
          a.y < -this.FB)
      )
        this.Bm = true;
      const c = a.rm;
      if (a.Gm) {
        a.Om.tm(t, c.um != null ? c.um : a.um);
        a.update(t);
      }
      this.Bm = this.Bm || a.Bm || a.Lm;
      if (a.Gm) {
        this.qB = n.PL && r && !this.Bm;
        if (this.qB) {
          const useWorld = !(!c.om && !a.om);
          const s = useWorld ? (c.om != null ? c.om : a.om) : a.Pm;
          this.YB = [];
          if (o) {
            const t2 = this.zB.toLocal(s, true);
            this.XB.copy(t2);
          } else {
            let i;
            Laya.Point.TEMP.setTo(s.width / 2, s.height / 2);
            i = useWorld ? this.zB.toLocal(s, Laya.Point.TEMP) : s.toParentPoint(Laya.Point.TEMP);
            this.XB.copy(i);
          }
          const h = this.XB.x;
          const en = this.XB.y;
          this.GB.setTo(1, 1);
          const r2 =
            (Math.max(this.GB.x, this.GB.y) * Math.sqrt(s.width * s.width + s.height * s.height)) / 2;
          WB.CA(h, en, r2, l.qd, this.YB);
          for (let i = this.YB.length - 1; i >= 0; i--) {
            const { enemy: hh, id: ee } = this.YB[i];
            if (o) {
              this.XB.setTo(hh.x, hh.y);
              hh.parent.localToGlobal(this.XB);
              s.parent.globalToLocal(this.XB);
              this.OB.x = this.XB.x;
              this.OB.y = this.XB.y;
              this.OB.bB = this.yd / this.GB.x;
              this.OB.MB = this.fd / this.GB.y;
            } else {
              this.OB.x = hh.x;
              this.OB.y = hh.y;
              this.OB.bB = this.yd;
              this.OB.MB = this.fd;
            }
            this.OB.r = 0;
            if (a.dm.has(ee)) this.YB.splice(i, 1);
            else if (useWorld) {
              if (!ye.AB(s, this.OB)) this.YB.splice(i, 1);
            } else if (!ye.EB(s, this.OB)) this.YB.splice(i, 1);
          }
          if (this.YB.length > 1 && !n.ML && a.VB) this.YB.sort(a.VB);
          for (let t2 = 0; t2 < this.YB.length; t2++) {
            const { id: s2 } = this.YB[t2];
            const i = WB.kw.get(s2);
            if (i && a.Wm(i)) {
              if ((a.hit(i), (this.NB = true), !n.ML)) {
                this.Bm = true;
                break;
              }
              if (a.Bm) {
                this.Bm = true;
                break;
              }
              a.dm.add(s2);
            }
          }
          if (this.NB) a.Nm();
        }
        if (n instanceof Vs && !n.RL) {
          if (n.TL) {
            if (a.hitDelayTimer <= 0) {
              this.QB(a, n);
              if (n.BL) this.Bm = true;
            }
            a.hitDelayTimer -= t;
          } else if (
            (this.Bm && ("requestRemove" === n.IL || "both" === n.IL)) ||
            (r && ("hitEnable" === n.IL || "both" === n.IL))
          ) {
            if (n.DL > 0) {
              n.TL = true;
              a.hitDelayTimer = n.DL;
            } else {
              this.QB(a, n);
              if (n.BL) this.Bm = true;
            }
          }
        }
      }
      if (this.Bm) {
        a.Vm();
        const s = c.lm != null ? c.lm : a.lm;
        if (s === 0 || a.Em) {
          this.ZB(a, n);
          this.$B(e);
        } else if (a.Lm) {
          a.timer -= t;
          if (a.timer <= 0) {
            this.ZB(a, n);
            this.$B(e);
            delete a.timer;
          }
        } else {
          a.Lm = true;
          a.timer = s;
        }
      }
    }
  }

  /** Final on-remove hit pass for delayed strategies. (`ZB`) */
  private ZB(t: any, s: any): void {
    if (s instanceof Vs && !s.RL && s.KB) this.QB(t, s);
  }

  /** Apply a hit strategy's queued target list. (`QB`) */
  private QB(t: any, s: any): void {
    let i = false;
    for (const h of s.EL) {
      const enemy = t.xw.kw.get(h);
      if (enemy) {
        t.hit(enemy);
        i = true;
      }
    }
    if (i) t.Nm();
    s.RL = true;
  }

  gameOver(): void {
    for (let t = this.HB.length - 1; t >= 0; t--) {
      const s = this.HB[t];
      s.Pm.offAll();
      this.jB(s.id);
    }
    this.HB = [];
  }
}
