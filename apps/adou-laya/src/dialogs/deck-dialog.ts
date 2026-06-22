// DeckDialog — the spawn-bag deck encyclopedia (the bundle's `Qa`, @regClass
// zavuCnlJRrqJycITCILMqg).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~25012-25301. Two tabs: the character grid (`SU`, greying used-up chars, with
// per-type draw-rate %), and the general grid (`bU`/`MU`/`PU`), where tapping an
// unlocked general previews its parts + skill (`EU` via SpawnQueueMgr.wU). Opaque
// field / method names kept verbatim; node refs bound from the .ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { LayerZ } from "../core/layer-z";
import { EffectMgr } from "../battle/effect-mgr";
import { SpawnQueueMgr } from "../battle/spawn-queue-mgr";
import { GameMgr } from "../core/game-mgr";
import { SceneMgr } from "../core/scene-mgr";

const X = LayerZ;

@regClass("zavuCnlJRrqJycITCILMqg")
export class DeckDialog extends Laya.Dialog {
  // .ls-bound nodes
  xBtn!: any;
  tab1!: any;
  tab2!: any;
  tab1Box!: any;
  tab2Box!: any;
  maskBg!: any;
  wordPanel!: any;
  panelDraw!: any;
  tabArea!: any;
  daoRate!: any;
  gongRate!: any;
  qiangRate!: any;
  qiRate!: any;
  generalRate!: any;
  generalPanel!: any;
  generalPanelDraw!: any;
  leftWord!: any;
  rightWord!: any;
  emptySign!: any;
  skillName!: any;
  skillDesc!: any;
  generalBg!: any;
  generalBgEff!: any;

  private pe = 65;
  private gridHei = 65;
  private vU = 5;
  private kU = 4;
  private _U = 0;
  private xU = new Map<any, any>();
  private AU: any = null;

  onAwake(): void {
    this.zIndex = X.Zr;
    this.xBtn.on(Laya.Event.CLICK, this, this.Uu);
    this.tab1.on(Laya.Event.CLICK, this, () => {
      if (this._U !== 0) {
        this._U = 0;
        this.tab1Box.visible = true;
        this.tab2Box.visible = false;
        this.tab1.skin = "resources/img/battleUI/deckDialog/btn.png";
        this.tab2.skin = "resources/img/battleUI/deckDialog/btnDark.png";
      }
    });
    this.tab2.on(Laya.Event.CLICK, this, () => {
      if (this._U !== 1) {
        this._U = 1;
        this.tab1Box.visible = false;
        this.tab2Box.visible = true;
        this.tab1.skin = "resources/img/battleUI/deckDialog/btnDark.png";
        this.tab2.skin = "resources/img/battleUI/deckDialog/btn.png";
      }
    });
    this.maskBg.on(Laya.Event.CLICK, this, this.Uu);
    EffectMgr.instance().bindButtons([this.tab1, this.tab2]);
  }

  onEnable(): void {
    this.gridHei = this.pe = this.wordPanel.width / 5;
    this.SU();
    this.bU();
    this.tabArea.y = 150;
    this.maskBg.visible = true;
  }

  onOpened(_t?: any): void {
    Laya.Tween.create(this.tabArea).to("y", 0).duration(500).ease(Laya.Ease.bounceOut);
  }

  SU(): void {
    const t = SpawnQueueMgr.instance();
    const s = GameMgr.instance();
    console.log("重新生成武将区域");
    this.xU.forEach((v) => v.destroy(true));
    this.xU.clear();
    let i = 0;
    s.soldierPool.eh.forEach((h: string) => {
      const e = s.generals.nameChars.indexOf(h);
      if (e !== -1 && !this.xU.has(h)) {
        const skin = "resources/img/gameObject/soldier/generalParts_" + e + ".png";
        const a = new Laya.Image(skin);
        const n = Math.floor(i / 5);
        const r = i % 5;
        a.color = "#cd8831";
        this.wordPanel.addChild(a);
        a.size(this.pe, this.gridHei);
        a.pos(this.pe * r, this.gridHei * n);
        this.xU.set(h, a);
        a.alpha = 0;
        Laya.Tween.create(a).to("alpha", 1).duration(500).delay(10 * i).ease(Laya.Ease.bounceOut);
        i++;
        const o = (t.fU as string[]).reduce((acc: number, x: string) => (x === h ? acc + 1 : acc), 0);
        if (o === 0) {
          a.gray = true;
          const mark = new Laya.Image("resources/img/battleUI/deckDialog/usedMark.png");
          this.wordPanel.addChild(mark);
          mark.size(78, 57);
          mark.anchor(0.5, 0.5);
          mark.alpha = 0.8;
          this.xU.set("usedMark_" + h, a);
          mark.pos(this.pe * (r + 0.5), this.gridHei * (n + 0.5));
          if (this.xU.has("num_" + h)) this.xU.get("num_" + h).destroy(true);
        } else if (o > 1) {
          const num = new Laya.Text();
          num.text = "x" + o;
          num.fontSize = 24;
          num.color = "#000000";
          num.valign = "bottom";
          num.align = "right";
          num.size(a.width - 2, a.height - 2);
          num.pos(this.pe * r, this.gridHei * n);
          this.wordPanel.addChild(num);
        }
      }
    });
    this.wordPanel.graphics.drawLine(0, 0, this.pe * this.vU, 0, "#BBB09F", 4);
    const h = Math.ceil(i / this.vU);
    for (let k = 0; k < this.vU; k++) {
      if (k !== 0)
        this.panelDraw.graphics.drawLine(0, this.gridHei * k, this.pe * this.vU, this.gridHei * k, "#BBB09F", 4);
      this.panelDraw.graphics.drawLine(this.pe * k, 0, this.pe * k, this.gridHei * h, "#BBB09F", 4);
    }
    [this.daoRate, this.gongRate, this.qiangRate, this.qiRate].forEach((s2, k) => {
      const rate =
        (t.fU as string[]).reduce((acc: number, x: string) => (x === ["刀", "弓", "枪", "骑"][k] ? acc + 1 : acc), 0) /
        (t.fU as string[]).length;
      s2.text = (100 * rate).toFixed(1) + "%";
    });
    let e = 0;
    (t.fU as string[]).forEach((x: string) => {
      if (s.generals.nameChars.includes(x)) e++;
    });
    this.generalRate.text = ((e / (t.fU as string[]).length) * 100).toFixed(1) + "%";
  }

  bU(): void {
    const t: any[] = [];
    const s = SpawnQueueMgr.instance();
    const i = s.yU;
    console.log("重新生成武将区域");
    const h = this.generalPanel.width / this.kU;
    this.generalPanel.graphics.drawLine(0, 0, h * this.kU, 0, "#BBB09F", 2);
    const e = Math.min(Math.ceil(i.length / this.kU), 4);
    for (let k = 0; k < this.kU; k++) {
      if (k !== 0)
        this.generalPanelDraw.graphics.drawLine(0, this.gridHei * k, h * this.kU, this.gridHei * k, "#BBB09F", 2);
      this.generalPanelDraw.graphics.drawLine(h * k, 0, h * k, this.gridHei * e, "#BBB09F", 2);
      for (let m = 0; m < e; m++) t.push(Laya.Point.create().setTo(h * k, this.gridHei * m));
    }
    i.forEach((idx: number) => {
      const e2 = t.shift();
      if (s.mU(idx)) this.MU(idx, e2);
      else this.PU(e2);
      e2.recover();
    });
  }

  MU(t: number, s: any): void {
    const i = GameMgr.instance();
    const h = new Laya.Sprite();
    const e = Math.min(this.generalPanel.width / this.kU, this.pe);
    const a = i.generals.generalNames[t];
    for (let k = 0; k < a.length; k++) {
      const skin = "resources/img/gameObject/soldier/generalParts_" + i.generals.nameChars.indexOf(a[k]) + ".png";
      const n = new Laya.Image(skin);
      n.color = "#cd8831";
      h.addChild(n);
      n.x += 50 * k - 10;
      n.size(e - 10, e - 10);
    }
    this.generalPanel.addChild(h);
    h.pos(s.x, s.y);
    h.size(this.generalPanel.width / this.kU, this.gridHei);
    h.on(Laya.Event.CLICK, this, () => {
      if (this.AU) this.AU.graphics.clear();
      h.graphics.drawRect(0, 0, 1, 1, "#BBB09F", undefined, 0, true);
      this.EU(t);
      this.AU = h;
    });
  }

  PU(t: any): void {
    const s = new Laya.Text();
    this.generalPanel.addChild(s);
    s.pos(t.x, t.y);
    s.align = "center";
    s.valign = "middle";
    s.fontSize = 30;
    s.bold = true;
    s.text = "???";
    s.size(this.generalPanel.width / this.kU, this.gridHei);
    s.on(Laya.Event.CLICK, this, () => {
      if (this.AU) this.AU.graphics.clear();
      this.emptySign.visible = true;
      this.leftWord.visible = false;
      this.rightWord.visible = false;
      this.skillName.text = "无技能";
      this.skillDesc.text = "";
      for (let k = 0; k < 2; k++) Laya.Tween.killAll([this.leftWord, this.rightWord][k]);
      this.AU = null;
    });
  }

  TR(): void {
    for (let k = 0; k < 2; k++) {
      const s = [this.leftWord, this.rightWord][k];
      Laya.Tween.to(
        s,
        { scaleX: 1.04, scaleY: 0.92 },
        300,
        null,
        Laya.Handler.create(this, () => {
          Laya.Tween.to(s, { scaleX: 1, scaleY: 1 }, 300);
        }),
      );
    }
    Laya.timer.once(600, this, this.TR);
  }

  EU(t: number): void {
    const s = GameMgr.instance();
    const i = s.generals.generalNames[t];
    for (let k = 0; k < i.length; k++) {
      const h = s.generals.nameChars.indexOf(i[k]);
      const node = k === 0 ? this.leftWord : this.rightWord;
      node.skin = "resources/img/gameObject/soldier/generalParts_" + h + ".png";
      node.color = "#cd8831";
    }
    this.emptySign.visible = false;
    this.leftWord.visible = true;
    this.rightWord.visible = true;
    this.generalBgEff.visible = true;
    this.generalBgEff.alpha = 1;
    this.generalBgEff.scale(1, 1);
    Laya.Tween.create(this.generalBgEff)
      .to("alpha", 0)
      .to("scaleX", 1.5)
      .to("scaleY", 1.5)
      .duration(150)
      .then(() => {
        this.generalBgEff.visible = false;
      });
    Laya.Tween.create(this.generalBg)
      .to("scaleX", 1.02)
      .to("scaleY", 1.02)
      .duration(50)
      .ease(Laya.Ease.backOut)
      .chain()
      .to("scaleX", 1)
      .to("scaleY", 1)
      .duration(50);
    const h = SpawnQueueMgr.instance().wU(t);
    if (h) {
      this.skillName.text = h.skillName;
      this.skillDesc.text = h.description;
    } else {
      this.skillName.text = "无技能";
      this.skillDesc.text = "";
    }
    if (this.AU == null) this.TR();
  }

  Uu(): void {
    SceneMgr.instance().closeDialog("DeckDialog");
    this.maskBg.visible = false;
  }

  onClosed(_t?: any): void {
    SpawnQueueMgr.instance().pU = false;
  }
}
