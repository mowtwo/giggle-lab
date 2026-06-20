// PrefabFactory — pooled creation of every battle/effect display object.
//
// Faithful reconstruction of the original bundle's `W`/`z` class
// (reconstruction/reference/bundle.pretty.js lines ~3492-3992). A Singleton that
// builds each effect/entity via Laya.Pool keyed by a `<name>CreateFunc` method.
// The createFunc method NAMES are a contract (getItem resolves them by string),
// so they are kept verbatim; every resource path / size / anchor / zIndex is
// copied exactly so the produced art matches the original pixel-for-pixel.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "../core/singleton";
import { PrefabPool } from "./prefab-pool";
import { GameMgr } from "../core/game-mgr";
import { LayerZ } from "../core/layer-z";
import { TexturedSprite } from "./textured-sprite";
import { MathE } from "../core/math-e";

const F = () => GameMgr.instance();
const H = () => PrefabPool.instance();

export class PrefabFactory extends Singleton {
  static readonly io = "resources/img/effect/hitEffect/";

  init(): void {}

  static hitTex(name: string): string {
    return PrefabFactory.io + name + ".png";
  }

  /** Get a pooled instance, creating via `<type>CreateFunc`. */
  getItem(type: string, _arg?: any): any {
    return Laya.Pool.getItemByCreateFun(type, (this as any)[`${type}CreateFunc`], this);
  }

  recover(type: string, obj: any): void {
    if (obj) Laya.Pool.recover(type, obj);
  }

  mapImgCreateFunc(): any {
    return H().so("mapItem").create();
  }

  mobCreateFunc(): any {
    const t = H().so("mob").create();
    t.size(F().map.gridWid, F().map.gridHei);
    const shadow = t.getChildByName("shadow");
    shadow.pos((t.width - shadow.width) / 2, t.height - shadow.height);
    shadow.zIndex = LayerZ.gr;
    const hpBg = t.getChildByName("hpBgImg");
    hpBg.pos((F().map.gridWid - hpBg.width) / 2, 3);
    hpBg.zIndex = LayerZ.Rr;
    return t;
  }

  bossCreateFunc(): any {
    const t = H().so("boss").create();
    t.getChildByName("hpBgImg").zIndex = LayerZ.Rr;
    return t;
  }

  soldierCreateFunc(): any {
    const t = new Laya.Sprite();
    t.size(F().map.gridWid, F().map.gridHei);
    const shadow = new Laya.Image("resources/img/gameObject/soldier/shadow2.png");
    shadow.name = "shadow";
    shadow.size(44, 22);
    shadow.anchorX = 0.5;
    shadow.anchorY = 0.5;
    shadow.pos(39, 65);
    shadow.alpha = 0.2;
    shadow.zIndex = LayerZ.gr;
    t.addChild(shadow);
    const chaos = new Laya.Image("resources/img/gameObject/enemy/chaos0.png");
    chaos.name = "chaos";
    chaos.size(71, 66);
    chaos.anchorX = 0.5;
    chaos.anchorY = 0.5;
    chaos.pos(40, 40);
    chaos.alpha = 0.5;
    chaos.visible = false;
    t.addChild(chaos);
    const lvl = new Laya.FontClip("resources/img/gameObject/bitmapFont/number5.png");
    lvl.name = "lvl";
    lvl.value = "1";
    lvl.size(20, 20);
    lvl.pos(t.width - lvl.width, 0);
    lvl.zIndex = LayerZ.Tr;
    lvl.interval = 50;
    lvl.sheet = "12345";
    t.addChild(lvl);
    return t;
  }

  bowEffectCreateFunc(): any {
    const t = new Laya.Image("resources/img/gameOverUI/arrow1.png");
    t.size(9, 39);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  damageNumCreateFunc(): any {
    const t = H().so("damageNum").create();
    t.x = F().map.gridWid / 2;
    return t;
  }

  bigFireEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/bigFireUpAround_01.png");
    const s = new Laya.Image("resources/img/effect/bigFireDownAround_01.png");
    const map = F().map;
    t.size(map.gridWid, map.gridHei);
    s.size(map.gridWid, map.gridHei);
    s.name = "downImg";
    t.addChild(s);
    return t;
  }

  mergeEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/gameObject/soldier/mergeEff1.png");
    t.size(160, 80);
    t.pos(80, 40);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    const s = new Laya.Image("resources/img/gameObject/soldier/mergeEff2.png");
    s.name = "mergeEffImg2";
    s.size(186, 112);
    s.pos(80, 37);
    s.anchorX = 0.5;
    s.anchorY = 0.5;
    t.addChild(s);
    const label = new Laya.Label();
    label.name = "label";
    label.color = "#FFF83D";
    label.fontSize = 40;
    label.strokeColor = "#fc1915";
    label.stroke = 10;
    label.size(186, 112);
    label.align = "center";
    label.valign = "middle";
    s.addChild(label);
    return t;
  }

  textEffCreateFunc(): any {
    const t = new Laya.Text();
    t.name = "txt";
    t.fontSize = 28;
    t.align = "center";
    t.valign = "middle";
    t.size(186, 112);
    t.color = "#ffffff";
    t.stroke = 4;
    t.alpha = 0;
    t.anchor(0.5, 0.5);
    return t;
  }

  smokeEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/smoke1.png");
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    t.size(100, 100);
    return t;
  }

  rocketEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/explode0.png");
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    t.size(64, 64);
    return t;
  }

  liHuaEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/hitEffect/lihuahit0.png");
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    t.size(94, 94);
    return t;
  }

  taiChiEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/hitEffect/taiChiEff_01.png");
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    t.size(64, 64);
    return t;
  }

  coldDaoQiEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/iceSlashEff01.png");
    t.size(245, 153);
    t.scale(1, 1);
    t.anchor(0.5, 0.85);
    return t;
  }

  enemyKnifeAttackEffCreateFunc(): any {
    const t = new Laya.Image();
    const s = new Laya.Image("resources/img/gameObject/enemy/knife.png");
    s.name = "knife";
    s.size(24, 72);
    s.anchorX = 0.5;
    s.anchorY = 1;
    const i = new Laya.Image("resources/img/gameObject/enemy/knifeLight.png");
    i.size(27, 81);
    i.anchorX = 0.5;
    i.anchorY = 0.5;
    i.name = "knifeLight";
    t.addChild(s);
    t.addChild(i);
    return t;
  }

  setSoldierEffCreateFunc(): any {
    return H().so("setSoldierEff").create();
  }

  electricEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/electric1.png");
    t.size(100, 100);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  fireEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/props/fire0.png");
    t.size(40, 40);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  groundFireEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/fireGround_01.png");
    t.size(80, 80);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  crackEffCreateFunc(): any {
    return H().so("crackEff").create();
  }

  goldCreateFunc(): any {
    const t = new Laya.Image("resources/img/battleUI/gold.png");
    t.size(30, 30);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  dragLineCreateFunc(): any {
    const t = new Laya.Image("resources/img/battleUI/dragImg3.png");
    t.size(20, 10);
    t.anchorY = 0.5;
    return t;
  }

  shovelGrassCreateFunc(): any {
    return H().so("shovelGrass").create();
  }

  trailCreateFunc(): any {
    return H().so("trail").create();
  }

  talkBoxCreateFunc(): any {
    return H().so("talkBox").create();
  }

  redPointCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/redPoint.png");
    t.size(7, 7);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  flagEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/gameOverUI/flagEff0.png");
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  rankItemCreateFunc(): any {
    return H().so("rankItem").create();
  }

  goldUpCreateFunc(): any {
    return H().so("goldUp").create();
  }

  goldUpImgCreateFunc(): any {
    const t = new TexturedSprite("resources/img/battleUI/goldUpImg.png", 80, 37);
    t.size(80, 37);
    t.anchor(0.5, 0.5);
    return t;
  }

  mobDeadCreateFunc(): any {
    const t = new Laya.Sprite();
    t.size(80, 80);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    const ink = new Laya.Image("resources/img/effect/mobDead0.png");
    ink.name = "ink";
    ink.size(86, 78);
    ink.anchorX = 0.5;
    ink.anchorY = 0.5;
    ink.pos(t.width / 2, t.height / 2);
    t.addChild(ink);
    const img = new Laya.Image("resources/img/effect/mobDead1.png");
    img.name = "img";
    img.size(145, 97);
    img.anchorX = 0.5;
    img.anchorY = 0.5;
    img.pos(t.width / 2, t.height / 2);
    t.addChild(img);
    return t;
  }

  daoQiHitCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/hitEffect/DaoQiHit0.png");
    t.size(48, 44);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  createHitEffectBox(): any {
    const t = new Laya.Box();
    t.size(80, 80);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    t.mouseEnabled = false;
    return t;
  }

  knifeHitCreateFunc(): any {
    const box = this.createHitEffectBox();
    const blood = new TexturedSprite(PrefabFactory.hitTex("blood0"), 78, 81);
    blood.name = "blood";
    blood.pos(40, 50);
    blood.size(78, 81);
    blood.anchorX = 0.5;
    blood.anchorY = 0.5;
    const img = new TexturedSprite(PrefabFactory.hitTex("knife0"), 82, 30, true);
    img.name = "img";
    img.pos(40, 50);
    img.size(82, 30);
    img.anchorX = 0.5;
    img.anchorY = 0.5;
    img.mouseEnabled = false;
    box.addChild(blood);
    box.addChild(img);
    return box;
  }

  bowHitCreateFunc(): any {
    const box = this.createHitEffectBox();
    const img0 = new TexturedSprite(PrefabFactory.hitTex("bow0"), 30, 37, true);
    img0.name = "img0";
    img0.pos(40, 40);
    img0.size(30, 37);
    img0.anchorX = 0.5;
    img0.anchorY = 0.5;
    box.addChild(img0);
    const img1 = new TexturedSprite(PrefabFactory.hitTex("bow1"), 56, 54, true);
    img1.name = "img1";
    img1.pos(40, 40);
    img1.size(56, 54);
    img1.anchorX = 0.5;
    img1.anchorY = 0.5;
    box.addChild(img1);
    const img2 = new TexturedSprite(PrefabFactory.hitTex("bow2"), 62, 63, true);
    img2.name = "img2";
    img2.pos(40, 40);
    img2.size(62, 63);
    img2.anchorX = 0.5;
    img2.anchorY = 0.5;
    box.addChild(img2);
    return box;
  }

  pikeHitCreateFunc(): any {
    const box = this.createHitEffectBox();
    const img1 = new TexturedSprite(PrefabFactory.hitTex("pike0"), 55, 56, true);
    img1.name = "img1";
    img1.pos(42.2, 42.744);
    img1.size(55, 56);
    img1.anchorX = 0.54;
    img1.anchorY = 0.549;
    box.addChild(img1);
    return box;
  }

  cavalryHitCreateFunc(): any {
    const box = this.createHitEffectBox();
    const img1 = new TexturedSprite(PrefabFactory.hitTex("cavalry0"), 36, 35);
    img1.name = "img1";
    img1.pos(33, 34);
    img1.size(36, 35);
    img1.anchorX = 0.7;
    img1.anchorY = 0.7;
    box.addChild(img1);
    const img2 = new TexturedSprite(PrefabFactory.hitTex("cavalry1"), 40, 33);
    img2.name = "img2";
    img2.pos(35, 34);
    img2.size(40, 33);
    img2.anchorX = 0.7;
    img2.anchorY = 0.7;
    box.addChild(img2);
    return box;
  }

  bubbleCreateFunc(): any {
    const t = new Laya.Image(`resources/img/gameObject/enemy/bubble${MathE.range(0, 2, true)}.png`);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  generalMergeTipCreateFunc(): any {
    const t = new Laya.Image("resources/img/battleUI/mergeTip1.png");
    t.size(366, 95);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    const s = new Laya.Image("resources/img/battleUI/mergeTip2.png");
    s.name = "img";
    s.size(227, 78);
    s.anchorX = 0.5;
    s.anchorY = 0.5;
    s.pos(182, 50);
    t.addChild(s);
    return t;
  }

  propsCreateFunc(): any {
    const t = new Laya.Sprite();
    t.size(F().map.gridWid, F().map.gridHei);
    const s = new Laya.Image();
    s.name = "props";
    s.pos(F().map.gridWid / 2, F().map.gridHei / 2);
    s.size(F().map.gridWid, F().map.gridHei);
    s.anchorX = 0.5;
    s.anchorY = 0.5;
    t.addChild(s);
    return t;
  }

  tigerRoarsCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/tiger0.png");
    t.size(87, 81);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  wolfRoarsCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/wolf0.png");
    t.size(85, 94);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  soundWavesCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/soundWave2.png");
    t.size(353, 353);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  bloodEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/hitEffect/blood0.png");
    t.size(78, 81);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  fallEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/fallEff0.png");
    t.size(110, 54);
    t.anchorX = 0.5;
    t.anchorY = 1;
    return t;
  }

  diedaoEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/diedao0.png");
    t.size(94, 54);
    t.anchorX = 0.5;
    t.anchorY = 1;
    return t;
  }

  longDanLiangYinQiangHitEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/hitEffect/longDanLiangYinQiangHitEff_0.png");
    t.size(84, 104);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  dragTipCreateFunc(): any {
    return new Laya.Image("resources/img/battleUI/dragBg2.png");
  }

  heartCreateFunc(): any {
    return H().so("heart").create();
  }

  rainCreateFunc(): any {
    const t = new Laya.Image("resources/img/gameObject/enemy/rain.png");
    t.size(3, 83);
    t.anchorX = 0.5;
    t.anchorY = 1;
    return t;
  }

  footprintCreateFunc(): any {
    const t = new TexturedSprite("resources/img/props/footprint.png", 17, 13);
    t.size(17, 13);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  loveHeartCreateFunc(): any {
    const t = new Laya.Image("resources/img/gameObject/enemy/heart.png");
    t.size(48, 44);
    t.anchor(0.5, 0.5);
    return t;
  }

  starRotateEffCreateFunc(): any {
    return new Laya.Image("resources/img/effect/starRotate0.png");
  }

  generalBgCreateFunc(): any {
    const t = new Laya.Image("resources/img/gameObject/soldier/generalBg1.png");
    t.size(160, 80);
    const s = new Laya.Image("resources/img/gameObject/soldier/generalBg2.png");
    s.size(168, 88);
    s.pos(-4, -4);
    t.addChild(s);
    return t;
  }

  thunderStrikeEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/thunder0.png");
    t.anchorX = 0.5;
    t.anchorY = 1;
    t.size(264, 331);
    return t;
  }

  arrowDownCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/arrowDown.png");
    t.size(20, 33);
    t.anchor(0.5, 0.5);
    return t;
  }

  arrowUpCreateFunc(): any {
    const t = new Laya.Image("resources/img/effect/arrowUp.png");
    t.size(20, 33);
    t.anchor(0.5, 0.5);
    return t;
  }

  meteorCreateFunc(): any {
    const t = new Laya.Image("resources/img/props/meteor_2.png");
    t.size(105, 64);
    t.anchor(0.27, 0.53);
    return t;
  }

  fireParticlCreateFunc(): any {
    const t = new Laya.Image("resources/img/props/fireParticl.png");
    t.size(30, 30);
    t.anchor(0.5, 0.5);
    return t;
  }

  treasureCreateFunc(): any {
    return H().so("treasure").create();
  }

  shopAdLightCreateFunc(): any {
    const t = new Laya.Image("resources/img/shop/light1.png");
    t.size(42, 42);
    t.anchor(0.5, 0.5);
    return t;
  }

  lotteryItemCreateFunc(): any {
    return H().so("lotteryItem").create();
  }

  pointFlashEffCreateFunc(): any {
    const t = new Laya.Image("resources/img/shop/lottery/whiteStar.png");
    t.size(10, 10);
    t.anchor(0.5, 0.5);
    return t;
  }

  weaponFragmentCreateFunc(): any {
    return H().so("weaponFragment").create();
  }

  weaponFragmentRewardCreateFunc(): any {
    const t = new Laya.Image();
    t.size(54, 54);
    t.skin = "resources/img/weaponBag/fragment0.png";
    const icon = new Laya.Image();
    icon.name = "icon";
    icon.size(54, 54);
    icon.anchor(0.5, 0.5);
    icon.pos(t.width / 2, t.height / 2);
    t.addChild(icon);
    const num = new Laya.Text();
    num.name = "num";
    num.fontSize = 35;
    num.size(54, 54);
    num.pos(0, 45);
    num.align = "center";
    num.valign = "middle";
    num.stroke = 5;
    t.addChild(num);
    return t;
  }

  starFlyCreateFunc(): any {
    const t = new Laya.Image("resources/img/shop/lottery/yellowStar.png");
    t.size(20, 20);
    t.anchorX = 0.5;
    t.anchorY = 0.5;
    return t;
  }

  attChangeTipCreateFunc(): any {
    return H().so("attChangeTip").create();
  }
}
