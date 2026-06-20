// SceneMgr — scene & dialog navigation manager.
//
// Faithful reconstruction of the original bundle's `Z` class (aliased `K`),
// reconstruction/reference/bundle.pretty.js lines ~6740-6839. Drives every
// scene transition and dialog open/close in the game. Loads the ORIGINAL
// scene/*.ls and dialog/*.lh resources unchanged via Laya.Scene/Laya.Dialog.
//
// Original minified member -> name:
//   scenes=bu  dialogs=Mu  dialogData=xu  sceneDialogs=Su  exclusiveScenes=Eu
//   openScene=Au  destroyScene=Ou  closeScene=Bu  getScene=Du
//   openDialog=Tu  closeDialog=Uu  getDialogData=Ru  deleteDialogData=Cu
//   closeSceneDialogs=Iu  closeOtherScenes=Pu  shakeBattleScene=Fu

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";

export class SceneMgr extends Singleton {
  // Scenes that may not coexist: opening one closes the others.
  private static readonly exclusiveScenes = new Set<string>([
    "BattleScene",
    "MainScene",
    "GameOverScene",
    "MatchScene",
  ]);

  private scenes = new Map<string, any>();
  private dialogs = new Map<string, any>();
  private dialogData = new Map<string, any>();

  // Dialogs that belong to a scene and must be closed when the scene closes.
  private readonly sceneDialogs = new Map<string, string[]>([
    ["MainScene", ["GetStaminaDialog", "SidebarDialog"]],
    ["BattleScene", ["DeckDialog", "PauseDialog", "BossTipDialog"]],
    ["RankScene", ["RankRewardDialog"]],
    ["ShopScene", ["DeletePropsTipDialog", "ReplacePropsTipDialog"]],
    ["GameOverScene", ["ShareLpDialog"]],
    ["WeaponScene", ["NewWeaponDialog", "WeaponIntroDialog", "RecycleWeaponDialog"]],
  ]);

  init(): void {
    this.scenes = new Map();
    this.dialogs = new Map();
    this.dialogData = new Map();
  }

  /** Close every cached scene except `keep`. */
  private closeOtherScenes(keep: string): void {
    this.scenes.forEach((scene, name) => {
      if (name !== keep && scene.parent) scene.close();
    });
  }

  /** Apply the original bg/box centering + downscale to a freshly opened scene. */
  private layoutScene(scene: any): void {
    const bg = scene.getChildByName("bg");
    if (bg) {
      bg.centerX = 0;
      bg.centerY = 0;
      bg.height = Laya.stage.height;
    }
    const box = scene.getChildByName("box");
    if (box) {
      box.centerX = 0;
      box.centerY = 0;
      if (Laya.stage.height < 1386) {
        box.scaleX = box.scaleY = Laya.stage.height / 1386;
      }
    }
  }

  /** Open (or re-open a cached) scene by name. (`Au`) */
  openScene(name: string, closeOther = false, param?: any, onOpened?: (scene: any) => void): void {
    const exclusive = SceneMgr.exclusiveScenes.has(name);
    const cached = this.scenes.get(name);
    if (cached) {
      if (exclusive) this.closeOtherScenes(name);
      cached.open(closeOther, param);
      if (onOpened) onOpened(cached);
      return;
    }
    Laya.Scene.open(`scene/${name}.ls`, closeOther, param).then((scene: any) => {
      this.scenes.set(name, scene);
      this.layoutScene(scene);
      if (exclusive) this.closeOtherScenes(name);
      if (onOpened) onOpened(scene);
    });
  }

  /** Close a scene's registered dialogs and (optionally) the scene itself. (`Bu`) */
  closeScene(name: string, close = true): void {
    this.closeSceneDialogs(name);
    if (close && this.scenes.get(name)) this.scenes.get(name).close();
  }

  /** Get a cached scene instance. (`Du`) */
  getScene(name: string): any {
    return this.scenes.get(name);
  }

  /** Open a dialog by name; resolves with the dialog instance. (`Tu`) */
  openDialog(name: string, modal = true, data?: any): Promise<any> {
    return new Promise((resolve) => {
      if (data !== undefined) this.dialogData.set(name, data);
      Laya.Dialog.open(`dialog/${name}.lh`, modal, data).then((dialog: any) => {
        this.dialogs.set(name, dialog);
        const bg = dialog.getChildByName("bg");
        if (bg) {
          bg.centerX = 0;
          bg.centerY = 0;
          bg.height = Laya.stage.height;
        }
        resolve(dialog);
      });
    });
  }

  /** Get the data passed to a dialog. (`Ru`) */
  getDialogData(name: string): any {
    return this.dialogData.get(name);
  }

  /** Forget a dialog's data. (`Cu`) */
  deleteDialogData(name: string): void {
    this.dialogData.delete(name);
  }

  /** Close all dialogs registered for a scene. (`Iu`) */
  private closeSceneDialogs(name: string): void {
    const list = this.sceneDialogs.get(name);
    if (list) for (let i = 0; i < list.length; i++) this.closeDialog(list[i]);
  }

  /** Shake the battle scene over `duration` ms. (`Fu`) */
  shakeBattleScene(duration: number): void {
    const scene = this.scenes.get("BattleScene");
    if (!scene) return;
    Laya.Tween.create(scene)
      .duration(duration)
      .to("x", 0)
      .to("y", 0)
      .delay(100)
      .interp(Laya.Tween.shake, 3)
      .then(() => {
        scene.x = 0;
        scene.y = 0;
      });
  }

  /** Destroy a cached scene and drop it from the cache. (`Ou`) */
  destroyScene(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.destroy(true);
      this.scenes.delete(name);
    }
  }

  /** Close a dialog and forget its data. (`Uu`) */
  closeDialog(name: string): void {
    if (this.dialogs.get(name)) {
      this.dialogs.get(name).close();
      this.deleteDialogData(name);
    }
  }
}
