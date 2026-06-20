// PrivacyAgreementMgr — platform privacy/age config + agreement texts + dialog.
//
// Faithful reconstruction of the original bundle's `Zr` class (aliased `Kr`),
// reconstruction/reference/bundle.pretty.js lines ~34524-34708, including the
// per-platform config table `Qr`. Detects the host platform, gates startup on
// the privacy agreement when required, loads the agreement .txt files from
// data/, binds the MainScene age badge, and drives PrivacyPolicyDialog.
//
// On the 4399h5 (static web) target every privacy flag is false, so the gate
// resolves immediately and the age badge is hidden.
//
// Original member -> name:
//   detectPlatform=Bq  platformConfig=UU  requiresPrivacyAgreement=Iq
//   showAgeBadge=Dq  hasAccepted=Tq  markAccepted=Cq  ensureAgreement=Uq
//   ensureTextsLoaded=Fq  bindAgeBadge=Hq  onAgeClick=Wq  showPrivacy=jq
//   showUser=$q  openViewDetail=zq  openPrivacyDialog=Oq  textsLoaded=Yq
//   readTexts=Xq  hasText=Nq  readText  mainText=Mq privacyText=Pq
//   userText=Aq ageText=Eq  STORAGE_KEY=Rq  agreement files=qq/Vq/Qq/Zq  load=Gq

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";
import { SceneMgr } from "./scene-mgr";
import { PlatformMgr } from "../platform/platform-mgr";

interface PlatformPrivacyConfig {
  requirePrivacyAgreement: boolean;
  exitOnPrivacyReject: boolean;
  privacyDialogPolicyLinks: boolean;
  mainSceneAgeBadge: boolean;
  isShowRank?: boolean;
}

const PLATFORM_CONFIG: Record<string, PlatformPrivacyConfig> = {
  minigamebox: {
    requirePrivacyAgreement: false,
    exitOnPrivacyReject: false,
    privacyDialogPolicyLinks: false,
    mainSceneAgeBadge: true,
    isShowRank: false,
  },
  "4399h5": {
    requirePrivacyAgreement: false,
    exitOnPrivacyReject: false,
    privacyDialogPolicyLinks: false,
    mainSceneAgeBadge: false,
    isShowRank: false,
  },
  oppo: {
    requirePrivacyAgreement: true,
    exitOnPrivacyReject: true,
    privacyDialogPolicyLinks: true,
    mainSceneAgeBadge: true,
  },
  vivo: {
    requirePrivacyAgreement: true,
    exitOnPrivacyReject: true,
    privacyDialogPolicyLinks: true,
    mainSceneAgeBadge: true,
  },
  wx: {
    requirePrivacyAgreement: false,
    exitOnPrivacyReject: false,
    privacyDialogPolicyLinks: false,
    mainSceneAgeBadge: true,
  },
  tt: {
    requirePrivacyAgreement: false,
    exitOnPrivacyReject: false,
    privacyDialogPolicyLinks: false,
    mainSceneAgeBadge: true,
  },
  editor: {
    requirePrivacyAgreement: true,
    exitOnPrivacyReject: false,
    privacyDialogPolicyLinks: true,
    mainSceneAgeBadge: true,
  },
};

export class PrivacyAgreementMgr extends Singleton {
  private static readonly STORAGE_KEY = "privacy_user_agreement_v1";
  private static readonly FILE_MAIN = "data/agreement.txt";
  private static readonly FILE_PRIVACY = "data/agreement-1.txt";
  private static readonly FILE_USER = "data/agreement-2.txt";
  private static readonly FILE_AGE = "data/agreement-3.txt";
  private static readonly LOAD_LIST = [
    { url: PrivacyAgreementMgr.FILE_MAIN, type: Laya.Loader.TEXT },
    { url: PrivacyAgreementMgr.FILE_PRIVACY, type: Laya.Loader.TEXT },
    { url: PrivacyAgreementMgr.FILE_USER, type: Laya.Loader.TEXT },
    { url: PrivacyAgreementMgr.FILE_AGE, type: Laya.Loader.TEXT },
  ];

  private mainText = "";
  private privacyText = "";
  private userText = "";
  private ageText = "";

  /** Detect the host platform key. (`Bq`) */
  detectPlatform(): string {
    if (typeof h5api !== "undefined") return "4399h5";
    if (typeof gamebox !== "undefined") return "minigamebox";
    if (Laya.Browser.onVVMiniGame) return "vivo";
    if (Laya.Browser.onQGMiniGame) return "oppo";
    if (Laya.Browser.onWXMiniGame) return "wx";
    if (Laya.Browser.onTTMiniGame) return "tt";
    return "editor";
  }

  /** Config for the current platform. (`UU`) */
  platformConfig(): PlatformPrivacyConfig {
    return PLATFORM_CONFIG[this.detectPlatform()];
  }

  /** (`Iq`) */
  requiresPrivacyAgreement(): boolean {
    return this.platformConfig().requirePrivacyAgreement;
  }

  /** (`Dq`) */
  showAgeBadge(): boolean {
    return this.platformConfig().mainSceneAgeBadge;
  }

  /** Whether the user already accepted. (`Tq`) */
  hasAccepted(): boolean {
    return Laya.LocalStorage.getItem(PrivacyAgreementMgr.STORAGE_KEY) === "1";
  }

  /** Persist acceptance. (`Cq`) */
  markAccepted(): void {
    Laya.LocalStorage.setItem(PrivacyAgreementMgr.STORAGE_KEY, "1");
  }

  /** Startup gate: resolve(true) once agreement is satisfied. (`Uq`) */
  ensureAgreement(): Promise<boolean> {
    if (!this.requiresPrivacyAgreement()) return Promise.resolve(true);
    if (this.hasAccepted()) return Promise.resolve(true);
    return this.ensureTextsLoaded().then(() =>
      this.openPrivacyDialog({ viewOnly: false, initialDetail: null }),
    );
  }

  /** Load agreement texts if not already cached. (`Fq`) */
  ensureTextsLoaded(): Promise<void> {
    if (this.textsLoaded()) {
      this.readTexts();
      return Promise.resolve();
    }
    return Laya.loader.load(PrivacyAgreementMgr.LOAD_LIST).then(() => {
      this.readTexts();
    });
  }

  /** Wire the MainScene age badge node: visibility + click-to-view. (`Hq`) */
  bindAgeBadge(node: any): void {
    const show = this.showAgeBadge();
    node.visible = show;
    node.off(Laya.Event.CLICK, this, this.onAgeClick);
    if (show) node.on(Laya.Event.CLICK, this, this.onAgeClick);
  }

  /** (`Wq`) */
  private onAgeClick(): void {
    this.openViewDetail("age");
  }

  /** (`jq`) */
  showPrivacy(): void {
    this.openViewDetail("privacy");
  }

  /** (`$q`) */
  showUser(): void {
    this.openViewDetail("user");
  }

  /** Open the dialog in read-only mode focused on a detail tab. (`zq`) */
  private openViewDetail(detail: string): void {
    this.ensureTextsLoaded().then(() => {
      this.openPrivacyDialog({ viewOnly: true, initialDetail: detail });
    });
  }

  /** Open PrivacyPolicyDialog; resolves true on accept/close. (`Oq`) */
  openPrivacyDialog(opts: { viewOnly: boolean; initialDetail: string | null }): Promise<boolean> {
    const viewOnly = opts.viewOnly;
    const initialDetail = opts.initialDetail ?? null;
    const config = this.platformConfig();
    return new Promise((resolve) => {
      let settled = false;
      const done = (value: boolean) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      const data = {
        mainText: this.mainText,
        privacyText: this.privacyText,
        userText: this.userText,
        ageText: this.ageText,
        showPrivacyLinks: config.privacyDialogPolicyLinks,
        viewOnly,
        initialDetail: viewOnly ? initialDetail : null,
        onAccepted: () => {
          if (!viewOnly) this.markAccepted();
          SceneMgr.instance().closeDialog("PrivacyPolicyDialog");
          done(true);
        },
        onRejected: () => {
          if (config.exitOnPrivacyReject) PlatformMgr.instance().exit();
        },
        onClosed: () => {
          if (viewOnly) done(true);
        },
      };
      SceneMgr.instance().openDialog("PrivacyPolicyDialog", true, data);
    });
  }

  /** Whether all four agreement texts are present in the loader cache. (`Yq`) */
  private textsLoaded(): boolean {
    return (
      PrivacyAgreementMgr.hasText(PrivacyAgreementMgr.FILE_MAIN) &&
      PrivacyAgreementMgr.hasText(PrivacyAgreementMgr.FILE_PRIVACY) &&
      PrivacyAgreementMgr.hasText(PrivacyAgreementMgr.FILE_USER) &&
      PrivacyAgreementMgr.hasText(PrivacyAgreementMgr.FILE_AGE)
    );
  }

  /** Pull the loaded texts out of the loader cache. (`Xq`) */
  private readTexts(): void {
    this.mainText = PrivacyAgreementMgr.readText(PrivacyAgreementMgr.FILE_MAIN);
    this.privacyText = PrivacyAgreementMgr.readText(PrivacyAgreementMgr.FILE_PRIVACY);
    this.userText = PrivacyAgreementMgr.readText(PrivacyAgreementMgr.FILE_USER);
    this.ageText = PrivacyAgreementMgr.readText(PrivacyAgreementMgr.FILE_AGE);
  }

  /** (`Nq`) */
  private static hasText(url: string): boolean {
    return PrivacyAgreementMgr.readText(url).length > 0;
  }

  /** Read a text resource, tolerating string vs {data} shapes. (`readText`) */
  private static readText(url: string): string {
    const res: any = Laya.loader.getRes(url);
    if (typeof res === "string") return res;
    const data = res ? res.data : null;
    if (typeof data === "string") return data;
    if (data != null) return String(data);
    console.warn("[PrivacyAgreementMgr] 协议文本为空", url, res);
    return "";
  }
}
