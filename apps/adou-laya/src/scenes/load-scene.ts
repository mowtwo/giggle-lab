// LoadScene — the boot scene (the bundle's `to`, @regClass nFCDlT3GRD-9N62vwVVE4Q).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~34711-34832. `onAwake` boots the leaf managers, starts the Zhao loading
// animation, then runs the load flow (`nV`): platform preload tasks → the
// PreloadMgr resource list → the privacy gate (`PrivacyAgreementMgr`) → GameMgr.init → platform
// startup tasks → `onComplete`, which inits the GameController and opens
// MainScene. The progress bar blends sub-package (15%) and asset (85%) progress.
// Opaque field / method names kept verbatim.
//
// NOTE: node references (`progressBar`/`zhao`/`loadingTxt`) are bound by Laya
// from LoadScene.ls at scene-creation; the generated view base (`Vr`) is an
// empty `Laya.Scene`, so we extend Laya.Scene directly and declare them here.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { PlatformMgr } from "../platform/platform-mgr";
import { UpdateMgr } from "../core/update-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { SceneMgr } from "../core/scene-mgr";
import { PreloadMgr } from "../core/preload-mgr";
import { PrivacyAgreementMgr } from "../core/privacy-agreement-mgr";
import { GameMgr } from "../core/game-mgr";
import { GameController } from "../battle/game-controller";


@regClass("nFCDlT3GRD-9N62vwVVE4Q")
export class LoadScene extends Laya.Scene {
  // .ls-bound nodes
  progressBar!: any;
  zhao!: any;
  loadingTxt!: any;

  private Kq = "";
  private Jq = 0;
  private tV = 0;
  private sV = "资源加载中";
  private iV = 0;
  private hV: any;

  onAwake(): void {
    PlatformMgr.instance().init();
    UpdateMgr.instance().init();
    EffectMgr.instance().init();
    SceneMgr.instance().init();
    this.hV = new Laya.Sprite();
    this.progressBar.mask = this.hV;
    this.hV.graphics.drawRect(0, 0, 0, this.progressBar.height, "#fff");
    EffectMgr.instance().registerImgLoop(
      this.zhao,
      ["resources/loading/zhao0.png", "resources/loading/zhao1.png", "resources/loading/zhao2.png"],
      100,
    );
    this.eV();
    this.sV = "分包加载中";
    this.iV = 0;
    this.eV();
    this.aV();
    this.nV();
  }

  async nV(): Promise<void> {
    console.log("启动主流程");
    this.tV = 0;
    this.rV();
    try {
      console.log("[LoadScene] startLoadFlow1");
      await PlatformMgr.instance().ou((t: number, s: number) => {
        this.oV(t, s);
      });
      console.log("[LoadScene] startLoadFlow2");
    } catch (t) {
      console.warn("[LoadScene] preload platform tasks failed", t);
    }
    this.tV = 1;
    this.rV();
    this.sV = "资源加载中";
    this.iV = 0;
    this.eV();
    this.Jq = 0;
    this.tV = 0;
    this.rV();
    Laya.loader.load(
      PreloadMgr.instance().dX,
      Laya.Handler.create(this, this.lV),
      Laya.Handler.create(this, this.cV, null, false),
    );
  }

  cV(t: number): void {
    this.Jq = t;
    this.rV();
  }

  rV(): void {
    const t = 0.85 * this.Jq + 0.15 * this.tV;
    this.hV.graphics.clear();
    this.hV.graphics.drawRect(0, 0, this.progressBar.width * t, this.progressBar.height, "#fff");
    this.zhao.x = this.progressBar.width * t;
  }

  uV(): void {}

  eV(): void {
    this.loadingTxt.text = this.sV + ".".repeat(this.iV);
  }

  aV(): void {
    Laya.timer.loop(500, this, () => {
      this.iV = (this.iV + 1) % 4;
      this.eV();
    });
  }

  oV(t: number, s: number): void {
    this.tV = s <= 0 ? 1 : Math.min(1, t / s);
    this.rV();
  }

  pV(): void {
    this.tV = Math.min(0.95, this.tV + 0.02);
    this.rV();
  }

  async lV(): Promise<void> {
    this.Jq = 1;
    this.tV = 0;
    this.rV();
    await PrivacyAgreementMgr.instance().ensureTextsLoaded();
    if (await PrivacyAgreementMgr.instance().ensureAgreement()) {
      this.sV = "平台初始化中";
      this.iV = 0;
      this.eV();
      this.rV();
      GameMgr.instance().init();
      Laya.timer.loop(80, this, this.pV);
      try {
        await PlatformMgr.instance().lu();
      } catch (t) {
        console.warn("[LoadScene] startup platform tasks failed", t);
      } finally {
        Laya.timer.clear(this, this.pV);
      }
      this.tV = 1;
      this.rV();
      this.onComplete();
    }
  }

  onComplete(): void {
    GameController.instance().init();
    SceneMgr.instance().openScene("MainScene", true, null, () => {
      SceneMgr.instance().destroyScene("LoadScene");
    });
  }
}
