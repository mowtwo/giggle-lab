import { AdouBattleScene } from "./laya-adapter/adou-battle-scene";

declare global {
    interface Window {
        $_main_?: () => void | Promise<void>;
    }
}

const PRELOAD_ASSETS = [
    "resources/img/mainUI/AutoAtlas.atlas",
    "resources/img/battleUI/AutoAtlas.atlas",
    "resources/img/map/AutoAtlas.atlas",
    "resources/img/gameObject/AutoAtlas.atlas",
    "resources/img/props/AutoAtlas.atlas",
    "resources/img/weapon/AutoAtlas.atlas",
    "resources/sound/btn_down.mp3",
    "resources/sound/soldier_set.mp3",
    "resources/sound/soldier_merge_upgrade.mp3",
    "resources/sound/bow_attack.mp3",
    "resources/sound/adou_hit.mp3",
];

window.$_main_ = async () => {
    Laya.stage.bgColor = "#17110d";

    try {
        await Laya.loader.load(PRELOAD_ASSETS);
    } catch (error) {
        console.warn("Adou preload did not complete.", error);
    }

    const scene = new AdouBattleScene();
    scene.mount();
};

export {};
