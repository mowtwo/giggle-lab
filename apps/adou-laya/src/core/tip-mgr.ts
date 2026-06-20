// TipMgr — toast tips + loading-mask helper.
//
// Faithful reconstruction of the original bundle's `J` (a single toast) and `tt`
// (the toast manager) classes, reconstruction/reference/bundle.pretty.js lines
// ~6841-6958. Toasts rise + fade in a stacked container; the loading mask is
// driven through SceneMgr (LoadMaskScene). Deps: AudioMgr, LayerZ, SceneMgr.
//
// Tip(J):   baseY=Yu riseRatio=Xu fontSize=Gu padding=Hu minHeight=Wu height=zu
//           setY=$u layout=ju
// TipMgr(tt): gap=Nu topRatio=qu width=Vu container=Qu tips=Zu
//           onTipClosed=Ju reflow=tp ensureContainer=Ku
//           showLoadingMask=hp hideLoadingMask=np

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";
import { AudioMgr } from "./audio-mgr";
import { LayerZ } from "./layer-z";
import { SceneMgr } from "./scene-mgr";

class Tip {
  private baseY = 0;
  private readonly riseRatio = 0.05;
  private readonly fontSize = 30;
  private readonly padding = 40;
  private readonly minHeight = 62;
  private height = 62;
  private duration: number;
  private onClosed: (tip: Tip) => void;
  root: any;
  private box: any;
  private tipTxt: any;

  constructor(text: string, duration: number, onClosed: (tip: Tip) => void) {
    this.duration = duration;
    this.onClosed = onClosed;
    this.root = new Laya.Box();
    this.root.width = 540;
    this.root.mouseEnabled = false;
    this.box = new Laya.Image("resources/img/commonUI/tipBg.png");
    this.box.sizeGrid = "20,20,20,20,0";
    this.box.width = 541;
    this.root.addChild(this.box);
    this.tipTxt = new Laya.Text();
    this.tipTxt.width = 540;
    this.tipTxt.align = "center";
    this.tipTxt.valign = "middle";
    this.tipTxt.color = "#FFFFFF";
    this.tipTxt.leading = 2;
    this.box.addChild(this.tipTxt);
    this.layout(text);
  }

  getHeight(): number {
    return this.height;
  }

  setY(y: number): void {
    const delta = y - this.baseY;
    if (delta !== 0) {
      this.baseY = y;
      this.root.y += delta;
    }
  }

  play(): void {
    Laya.Tween.killAll(this.root);
    this.root.alpha = 1;
    this.root.y = this.baseY;
    const targetY = this.baseY - this.riseRatio * this.duration;
    Laya.Tween.to(
      this.root,
      { y: targetY, alpha: 0.3 },
      this.duration,
      null,
      Laya.Handler.create(this, () => {
        this.dispose();
        this.onClosed(this);
      }),
    );
  }

  private layout(text: string): void {
    this.tipTxt.wordWrap = true;
    this.tipTxt.text = text;
    this.tipTxt.fontSize = this.fontSize;
    if (this.tipTxt.textWidth > this.tipTxt.width) {
      this.tipTxt.fontSize = ((this.fontSize * this.tipTxt.width) / this.tipTxt.textWidth) | 0;
    }
    this.height = Math.max(this.minHeight, this.tipTxt.textHeight + this.padding);
    this.box.height = this.height;
    this.tipTxt.height = this.height;
    this.root.height = this.height;
  }

  dispose(): void {
    Laya.Tween.killAll(this.root);
    this.root.removeSelf();
    this.root.destroy(true);
  }
}

export class TipMgr extends Singleton {
  private readonly gap = 10;
  private readonly topRatio = 0.3;
  private readonly width = 540;
  private container: any = null;
  private tips: Tip[] = [];

  init(): void {
    this.tips = [];
    this.ensureContainer();
  }

  showTip(text: string, duration = 2000): void {
    this.ensureContainer();
    AudioMgr.instance().playSound("popup_notification");
    const tip = new Tip(text, duration, (t) => this.onTipClosed(t));
    this.tips.push(tip);
    tip.root.x = (Laya.stage.width - this.width) / 2;
    this.container.addChild(tip.root);
    this.reflow();
    tip.play();
  }

  private onTipClosed(tip: Tip): void {
    const i = this.tips.indexOf(tip);
    if (i >= 0) this.tips.splice(i, 1);
    this.reflow();
  }

  private reflow(): void {
    let y = Laya.stage.height * this.topRatio;
    for (let i = 0; i < this.tips.length; i++) {
      this.tips[i].setY(y);
      y += this.tips[i].getHeight() + this.gap;
    }
  }

  private ensureContainer(): void {
    if (this.container && this.container.parent) return;
    this.container = new Laya.Sprite();
    this.container.name = "tipContainer";
    this.container.mouseEnabled = false;
    this.container.zIndex = LayerZ.qr;
    Laya.stage.addChild(this.container);
  }

  /** Show the loading mask (`hp`). */
  showLoadingMask(text = "正在加载中...", timeout = 5000): void {
    SceneMgr.instance().openScene("LoadMaskScene", false, { ep: text, ap: timeout });
  }

  /** Hide the loading mask (`np`). */
  hideLoadingMask(): void {
    SceneMgr.instance().closeScene("LoadMaskScene");
  }
}
