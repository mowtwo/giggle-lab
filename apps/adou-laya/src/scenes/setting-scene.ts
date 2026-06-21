// SettingScene — music / sound volume + damage-number toggle + agreement links
// (the bundle's `vo`, @regClass 6DGqZNBLRhuPudJfulUNKw).
//
// Faithful reconstruction of reconstruction/reference/bundle.pretty.js lines
// ~36148-36298. Drag handlers on the two slider buttons (`sZ`) live-adjust music
// (mute below 0.001) and sound (mute/low/full thresholds) volume via AudioMgr and
// persist on release (`iZ`); the checkbox toggles showDamageNum; privacy/user
// links open the agreement views. Opaque field / method names kept verbatim; node
// refs bound from SettingScene.ls.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { regClass } from "../laya/engine";
import { SceneMgr } from "../core/scene-mgr";
import { EffectMgr } from "../battle/effect-mgr";
import { GameMgr } from "../core/game-mgr";
import { AudioMgr } from "../core/audio-mgr";
import { PrivacyAgreementMgr } from "../core/privacy-agreement-mgr";

const K = SceneMgr;
const q = EffectMgr;
const F = GameMgr;
const $ = AudioMgr;
const Kr = PrivacyAgreementMgr;

@regClass("6DGqZNBLRhuPudJfulUNKw")
export class SettingScene extends Laya.Scene {
  // .ls-bound nodes
  musicSliderButton!: any;
  soundSliderButton!: any;
  checkBox!: any;
  bg!: any;
  privacyBtn!: any;
  userBtn!: any;
  closeBtn!: any;
  viewTxt!: any;
  musicSliderBar!: any;
  soundSliderBar!: any;
  musicSliderContent!: any;
  soundSliderContent!: any;
  music!: any;
  musicNo!: any;
  sound!: any;
  soundNo!: any;
  soundLow!: any;
  checkOK!: any;

  private KQ = false;
  private JQ = false;
  private tZ = 0;
  private eZ = 0;
  private aZ = 0;
  private yH: any;
  private settingData: any;

  onAwake(): void {
    this.musicSliderButton.on(Laya.Event.MOUSE_DOWN, this, (t: any) => {
      this.tZ = t.stageX;
      this.JQ = true;
      this.musicSliderButton.color = "#c1c1c1";
      Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.sZ);
      Laya.stage.once(Laya.Event.MOUSE_UP, this, () => {
        this.musicSliderButton.color = "#FFFFFF";
        this.iZ();
        this.JQ = false;
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.sZ);
      });
    });
    this.soundSliderButton.on(Laya.Event.MOUSE_DOWN, this, (t: any) => {
      this.tZ = t.stageX;
      this.KQ = true;
      this.soundSliderButton.color = "#c1c1c1";
      Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.sZ);
      Laya.stage.once(Laya.Event.MOUSE_UP, this, () => {
        this.soundSliderButton.color = "#FFFFFF";
        this.iZ();
        this.KQ = false;
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.sZ);
      });
    });
    this.checkBox.on(Laya.Event.CLICK, this, () => {
      this.settingData.showDamageNum = !this.settingData.showDamageNum;
      this.hZ(this.settingData.showDamageNum);
      this.iZ();
    });
    this.bg.on(Laya.Event.CLICK, this, () => {
      K.instance().closeScene("SettingScene");
    });
    this.privacyBtn.on(Laya.Event.CLICK, this, this.xW);
    this.userBtn.on(Laya.Event.CLICK, this, this.SW);
    q.instance().bindButtons([this.closeBtn, this.checkBox, this.privacyBtn, this.userBtn]);
    this.closeBtn.on(Laya.Event.CLICK, this, () => {
      K.instance().closeScene("SettingScene");
    });
  }

  onOpened(_t?: any): void {
    this.yH = F.instance().player;
    this.settingData = this.yH.settingData;
    this.viewTxt.visible = Kr.instance().platformConfig().privacyDialogPolicyLinks;
    this.eZ = this.musicSliderBar.width - 8;
    this.aZ = this.soundSliderBar.width - 8;
    this.nZ(this.settingData.musicVolume);
    this.rZ(this.settingData.soundVolume);
    this.hZ(this.settingData.showDamageNum);
  }

  sZ(t: any): void {
    const s = t.stageX - this.tZ;
    if (this.JQ) {
      this.musicSliderContent.width = Math.min(this.eZ, Math.max(0, this.musicSliderContent.width + s));
      const v = this.musicSliderContent.width / this.eZ;
      this.settingData.musicVolume = v;
      $.instance().setMusicVolume(v);
      if (v > 0.001) {
        this.musicSliderButton.skin = "resources/img/mainUI/setting/sliderButton.png";
        this.music.visible = true;
        this.musicNo.visible = false;
      } else {
        this.musicSliderButton.skin = "resources/img/mainUI/setting/sliderButtonGray.png";
        this.music.visible = false;
        this.musicNo.visible = true;
      }
    } else if (this.KQ) {
      this.soundSliderContent.width = Math.min(this.aZ, Math.max(0, this.soundSliderContent.width + s));
      const v = this.soundSliderContent.width / this.aZ;
      this.settingData.soundVolume = v;
      $.instance().setSoundVolume(v);
      if (v > 0.5) {
        this.soundSliderButton.skin = "resources/img/mainUI/setting/sliderButton.png";
        this.soundNo.visible = false;
        this.soundLow.visible = false;
        this.sound.visible = true;
      } else if (v <= 0.001) {
        this.soundSliderButton.skin = "resources/img/mainUI/setting/sliderButtonGray.png";
        this.soundNo.visible = true;
        this.soundLow.visible = false;
        this.sound.visible = false;
      } else {
        this.soundSliderButton.skin = "resources/img/mainUI/setting/sliderButton.png";
        this.soundNo.visible = false;
        this.soundLow.visible = true;
        this.sound.visible = false;
      }
    }
    this.tZ = t.stageX;
  }

  iZ(): void {
    this.yH.setSettingData(this.settingData);
  }

  hZ(t: boolean): void {
    this.checkOK.visible = t;
  }

  nZ(t: number): void {
    const s = this.eZ;
    this.musicSliderContent.width = t * s;
    if (t > 0.001) {
      this.musicSliderButton.skin = "resources/img/mainUI/setting/sliderButton.png";
      this.music.visible = true;
      this.musicNo.visible = false;
    } else {
      this.musicSliderButton.skin = "resources/img/mainUI/setting/sliderButtonGray.png";
      this.music.visible = false;
      this.musicNo.visible = true;
    }
  }

  xW(t: any): void {
    t.stopPropagation();
    Kr.instance().showPrivacy();
  }

  SW(t: any): void {
    t.stopPropagation();
    Kr.instance().showUser();
  }

  rZ(t: number): void {
    const s = this.aZ;
    this.soundSliderContent.width = t * s;
    if (t > 0.5) {
      this.soundSliderButton.skin = "resources/img/mainUI/setting/sliderButton.png";
      this.soundNo.visible = false;
      this.soundLow.visible = false;
      this.sound.visible = true;
    } else if (t <= 0.001) {
      this.soundSliderButton.skin = "resources/img/mainUI/setting/sliderButtonGray.png";
      this.soundNo.visible = true;
      this.soundLow.visible = false;
      this.sound.visible = false;
    } else {
      this.soundSliderButton.skin = "resources/img/mainUI/setting/sliderButton.png";
      this.soundNo.visible = false;
      this.soundLow.visible = true;
      this.sound.visible = false;
    }
  }
}
