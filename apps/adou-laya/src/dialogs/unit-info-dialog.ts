// UnitInfoDialog — the tap-a-unit stat/buff popup (the bundle's `_r`, @regClass
// FO3V8791TVqW8hJVO95S4g).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~30821-31202. `MH` populates it for a soldier (1), general (2/3), or farmer (4):
// portrait icon(s), title with level + attack category, attack/speed, the active
// buff icons (`mz`/`Sz`, skipping AttrBuffs which feed the +attack/+range/+speed
// rows), the equipped weapon (generals), and an exp/production bar that live-
// updates via the unit's data events (`Pz`/`Az`). Opaque field / method names
// kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { LayerZ } from "../core/layer-z";
import { UpdateMgr } from "../core/update-mgr";
import { BuffMgr } from "../battle/buff-mgr";
import { General } from "../battle/general";
import { BaseSoldier } from "../battle/base-soldier";
import { Farmer } from "../battle/farmer";
import { AttrBuff } from "../battle/buffs";
import { GameMgr } from "../core/game-mgr";
import { EntityRegistry } from "../battle/entity-registry";

const X = LayerZ;
const va = General;
const zs = BaseSoldier;
const ki = Farmer;
const ls = AttrBuff;
const vr = Laya.Ease;

@regClass("FO3V8791TVqW8hJVO95S4g")
export class UnitInfoDialog extends Laya.Dialog {
  // .ls-bound nodes
  attackBuff!: any;
  attackDebuff!: any;
  rangeBuff!: any;
  rangeDebuff!: any;
  speedBuff!: any;
  speedDebuff!: any;
  lockDebuff!: any;
  chaosDebuff!: any;
  suppressionDebuff!: any;
  charmDebuff!: any;
  knockdownDebuff!: any;
  buffArea!: any;
  buffAreaExtend!: any;
  buffTipBk!: any;
  buffTip!: any;
  power!: any;
  speed!: any;
  buffs!: any;
  expNum!: any;
  expBar!: any;
  expArea!: any;
  expName!: any;
  iconArea!: any;
  title!: any;
  lvlTip!: any;
  weaponBox!: any;
  weaponImg!: any;
  weaponName!: any;
  weaponAttTxt!: any;
  weaponIntroTxt!: any;

  private yz: any[] = [];
  private fz = true;
  private gz = false;
  private dz = false;
  private Lz = 0;
  private wz!: Map<any, string>;
  private type = 0;
  private bz: any = null;

  onEnable(): void {
    this.zIndex = X.Gr;
    this.x = this.stage.width / 2;
    this.y = this.height + 180;
  }

  mz(t: number, s = false): void {
    let i: any;
    switch (t) {
      case 0:
        i = s ? this.attackDebuff : this.attackBuff;
        break;
      case 2:
        i = s ? this.rangeDebuff : this.rangeBuff;
        break;
      case 1:
        i = s ? this.speedDebuff : this.speedBuff;
        break;
      case 16:
        i = this.lockDebuff;
        break;
      case 13:
        i = this.chaosDebuff;
        break;
      case 18:
        i = this.suppressionDebuff;
        break;
      case 19:
        i = this.charmDebuff;
        break;
      case 17:
        i = this.knockdownDebuff;
    }
    if (this.buffArea.numChildren > 3) {
      this.buffAreaExtend.addChild(i);
      this.buffAreaExtend.visible = true;
      this.dz = true;
    } else if (i) this.buffArea.addChild(i);
    else console.error("buffIcon is null", t);
  }

  onAwake(): void {
    this.wz = new Map<any, string>([
      [this.attackBuff, "+攻击力提升"],
      [this.attackDebuff, "-攻击力降低"],
      [this.rangeBuff, "+攻击范围提升"],
      [this.rangeDebuff, "-攻击范围下降"],
      [this.speedBuff, "+攻速提升"],
      [this.speedDebuff, "-攻速降低"],
      [this.lockDebuff, "-锁链封印"],
      [this.chaosDebuff, "-陷入混乱"],
      [this.suppressionDebuff, "-受到压制"],
      [this.charmDebuff, "-魅惑"],
      [this.knockdownDebuff, "-击倒"],
    ]);
    this.buffTipBk.visible = false;
    this.wz.forEach((t, s) => {
      s.on(Laya.Event.CLICK, this, () => {
        const i = Laya.Point.TEMP;
        s.localToGlobal(i.setTo(0, 0));
        this.buffTipBk.parent.globalToLocal(i);
        this.buffTipBk.pos(i.x + s.width / 2, i.y);
        this.buffTipBk.alpha = 0;
        Laya.Tween.create(this.buffTipBk).to("alpha", 1).duration(50);
        this.buffTipBk.visible = true;
        this.buffTip.text = t.substring(1);
        this.buffTip.color = t[0] === "-" ? "#FF0000" : "#FFFFFF";
        this.Lz = UpdateMgr.instance().elapsed;
      });
    });
    this.on(Laya.Event.CLICK, this, () => {
      if (UpdateMgr.instance().elapsed - this.Lz >= 50) this.buffTipBk.visible = false;
    });
  }

  onOpened(): void {
    this.visible = false;
  }

  vz(): any {
    this.alpha = 0;
    Laya.Tween.killAll(this);
    return Laya.Tween.create(this)
      .parallel()
      .to("alpha", 1)
      .duration(100)
      .ease(vr.linear)
      .parallel()
      .to("skewX", 10)
      .duration(50)
      .ease(vr.linear)
      .chain()
      .to("skewX", -5)
      .duration(25)
      .ease(vr.linear)
      .chain()
      .to("skewX", 0)
      .duration(25)
      .ease(vr.linear);
  }

  kz(): any {
    this.alpha = 1;
    Laya.Tween.killAll(this);
    return Laya.Tween.create(this)
      .parallel()
      .to("alpha", 0)
      .duration(50)
      .delay(50)
      .ease(vr.linear)
      .parallel()
      .to("skewX", -20)
      .duration(50)
      .ease(vr.backIn)
      .chain()
      .to("skewX", -5)
      .duration(25)
      .ease(vr.linear)
      .chain()
      .to("skewX", 0)
      .duration(25)
      .ease(vr.linear);
  }

  _z(): any {
    Laya.Tween.killAll(this);
    return Laya.Tween.create(this)
      .parallel()
      .to("scaleY", 1.1)
      .duration(50)
      .ease(vr.backIn)
      .chain()
      .to("scaleY", 0.95)
      .duration(25)
      .ease(vr.linear)
      .chain()
      .to("scaleY", 1)
      .duration(25)
      .ease(vr.linear);
  }

  xz(_t: number): void {}

  Sz(): void {
    const t = this.bz;
    if (t && ((this.buffTipBk.visible = false), t instanceof va || t instanceof zs)) {
      this.power.text = "攻击力: " + t.Ta.toFixed(2);
      this.speed.text = "攻速: " + t.LL.toFixed(2);
      this.buffs.text = "状态: ";
      this.buffArea.visible = false;
      let s = false;
      this.dz = false;
      this.wz.forEach((_v, node) => node.removeSelf());
      const i = BuffMgr.instance().ob(t.id);
      if (i) {
        i.forEach((b: any) => {
          if (!(b instanceof ls)) {
            s = true;
            this.mz(b.Lg, b.Rg());
          }
        });
        if (t.addAttPower > 0) {
          this.mz(0);
          s = true;
        } else if (t.addAttPower < 0) {
          this.mz(0, true);
          s = true;
        }
        if (t.pL > 0) {
          this.mz(2);
          s = true;
        } else if (t.pL < 0) {
          this.mz(2, true);
          s = true;
        }
        if (t.yL > 0) {
          this.mz(1);
          s = true;
        } else if (t.yL < 0) {
          this.mz(1, true);
          s = true;
        }
        if (s) this.buffArea.visible = true;
      }
      if (t instanceof va) {
        const inst = GameMgr.instance();
        const h = t.Ya ? inst.generals.Wa : inst.generals.Ha;
        let e = 0;
        if (t.level < h.length) {
          this.expNum.text = "(" + t.Id.toFixed(1) + "/" + h[t.level] + ")";
          e = Math.min(1, t.Id / h[t.level]) * this.expBar.parent.width - 8;
        } else {
          this.expNum.text = "(" + t.Id.toFixed(1) + "/ 已满级 )";
          e = this.expBar.parent.width - 8;
        }
        this.expBar.width = Math.max(e, 0);
        if (s) this.xz(210);
        else this.xz(135);
        if (t.weaponId !== -1) this.xz(400);
      } else if (s) this.xz(155);
      else this.xz(105);
      if (this.dz) this.height += 70;
      else this.buffAreaExtend.visible = false;
    }
  }

  Mz(): void {
    const t = this.bz;
    if (t && t instanceof ki) {
      if (t.currentState === "FarmerCrazy") {
        this.power.text = "耕作速率: 狂暴状态";
        this.power.color = "#FF0000";
      } else {
        this.power.text = "耕作速率: " + t.Av / 1000 + "s / 馒头";
        this.power.color = "#FFFFFF";
      }
      this.xz(135);
    }
  }

  Pz(): void {
    if (this.type === 1 || this.type === 2) {
      this.Sz();
      this.bz.on("onBuffDataChanged", this.Sz, this);
      this.bz.on("onLevelChange", this.Sz, this);
      if (this.type === 2) this.bz.on("onExpChange", this.Sz, this);
    } else if (this.type === 4) {
      this.Mz();
      this.bz.on("onLevelChange", this.Mz, this);
      this.bz.on("onStateChange", this.Mz, this);
      UpdateMgr.instance().register("farmerDataUpdate", this, () => {
        const t = this.bz;
        const s = Math.min(1, t.Bv / (t.currentState === "FarmerCrazy" ? t.Ev : t.Av));
        this.expBar.width = Math.max(s * this.expBar.parent.width - 8, 0);
        this.expNum.text = (100 * s).toFixed(0) + "%";
      });
    }
  }

  Az(): void {
    if (this.bz) {
      if (this.bz.pg()) {
        if (this.type === 2 || this.type === 1) {
          this.bz.off("onBuffDataChanged", this.Sz);
          this.bz.off("onLevelChange", this.Sz);
          if (this.type === 2) this.bz.off("onExpChange", this.Sz);
        } else if (this.type === 4) {
          this.bz.off("onLevelChange", this.Mz);
          this.bz.off("onStateChange", this.Mz);
          UpdateMgr.instance().unregister("farmerDataUpdate");
        }
      } else this.bz = null;
    }
  }

  MH(t: any): void {
    if (!this.fz) this.Ez();
    this.buffTipBk.visible = false;
    const s = EntityRegistry.instance();
    this.type = t.objectType;
    this.height = 230;
    this.weaponBox.visible = false;
    switch (t.objectType) {
      case 2:
      case 3: {
        this.type = 2;
        const i = t.objectType === 2 ? t.vH : s.uS(t.vH);
        this.expArea.visible = true;
        const h = (this.bz = s.Qk.get(i));
        h.va.forEach((part: any, idx: number) => {
          this.yz.push(EntityRegistry.instance().C_(0, part.Qd, true, 0));
          const icon = this.yz[idx].pg();
          this.iconArea.addChild(icon);
          icon.pos(
            this.iconArea.width / 2 - (Math.sign(0.5 - idx) * icon.width) / 3 - icon.width / 2,
            (this.iconArea.height - icon.height) / 2,
          );
          this.yz[idx].Vd.visible = false;
        });
        this.title.text =
          h.SD + "Lv." + h.level + "(" + (h.xR ? "单体" : GameMgr.instance().generals.generalAttackConfigs[h.type].Ca) + ")";
        this.expName.text = "经验值:";
        this.lvlTip.text = h.Ya ? "满级5级" : "满级3级";
        if (h.QE.weaponId !== -1) {
          this.height = 400;
          this.weaponBox.visible = true;
          this.weaponImg.skin = "resources/img/weapon/weapon_" + h.QE.weaponId + ".png";
          if (h.QE.type === 0) this.weaponImg.size(136, 64);
          else if (h.QE.type === 1) this.weaponImg.size(42, 132);
          else if (h.QE.type === 2) this.weaponImg.size(42, 118);
          else if (h.QE.type === 3) this.weaponImg.size(40, 110);
          this.weaponName.text = h.QE.name;
          this.weaponName.color = GameMgr.instance().weaponData.rarityColors[h.QE.rarity];
          this.weaponAttTxt.text = "攻击力：" + h.QE.aI;
          this.weaponIntroTxt.text = h.QE.intro;
        }
        break;
      }
      case 1: {
        this.expArea.visible = false;
        const e = (this.bz = s.hS.get(t.vH));
        this.yz.push(EntityRegistry.instance().C_(0, e.Qd, true, 0));
        const a = this.yz[0].pg();
        this.yz[0].Vd.visible = false;
        this.iconArea.addChild(a);
        a.pos((this.iconArea.width - a.width) / 2, (this.iconArea.height - a.height) / 2);
        this.title.text = e.Qd + "Lv." + e.level + "(" + GameMgr.instance().generals.soldierAttackConfigs[e.type].Ca + ")";
        this.lvlTip.text = "满级5级";
        break;
      }
      case 4: {
        this.expArea.visible = true;
        const n = (this.bz = s.aS.get(t.vH));
        this.yz.push(EntityRegistry.instance().C_(0, n.Qd, true, 0));
        const r = this.yz[0].pg();
        this.yz[0].Vd.visible = false;
        this.iconArea.addChild(r);
        r.pos((this.iconArea.width - r.width) / 2, (this.iconArea.height - r.height) / 2);
        this.title.text = "农民 (生产粮食)";
        this.speed.text = "";
        this.buffs.text = "";
        this.expName.text = "生产进度:";
        this.expNum.text = "";
        this.lvlTip.text = "满级5级";
      }
    }
    this.fz = false;
    this.Pz();
    this.bz.once("onDestroy", this.hide, this);
    if (this.gz && this.visible) this._z();
    else {
      Laya.Tween.killAll(this);
      this.vz();
      this.gz = true;
      this.visible = true;
    }
  }

  hide(): void {
    if (this.gz)
      this.kz().then(() => {
        this.Ez();
        this.visible = false;
        this.gz = false;
      });
  }

  Ez(): void {
    this.Az();
    for (let t = 1; t < this.buffArea.numChildren; t++) this.buffArea.getChildAt(t).removeSelf();
    const t = EntityRegistry.instance();
    this.yz.forEach((s) => {
      switch (this.type) {
        case 2:
          t.gx(s.id);
          break;
        case 1:
          t.Lx(s.id);
          break;
        case 4:
          t.uk(s.id);
      }
    });
    this.bz = null;
    this.type = 0;
    this.yz = [];
    this.fz = true;
  }

  onClosed(_t?: any): void {
    this.Ez();
  }
}
