import {
  ADOU_BOARD_COLS,
  ADOU_BOARD_ROWS,
  collectAdouCoreEventFeedback,
  createAdouBattleState,
  endAdouBattle,
  getAdouCodex,
  getAdouEnemyPoint,
  getAdouSkill,
  getAdouSoundPath,
  getAdouUnitCellsForRange,
  moveAdouBattleUnit,
  placeAdouHandItem,
  readAdouLoadout,
  refreshAdouBattleHand,
  resolveAdouUnitStats,
  returnAdouBoardUnitToHand,
  startAdouBattle,
  tickAdouCore,
  useAdouActiveSkillSlot,
  mergeAdouBattleHandSlots,
  type AdouBattleState,
  type AdouBattleUnit,
  type AdouCoreEvent,
  type AdouHandItem,
  type AdouPoint,
  type AdouSide,
  type AdouTile,
} from "../adou-core";

const BASE_WIDTH = 640;
const BASE_HEIGHT = 1386;
const STAGE_BG = "#17110d";
const BOARD_X = 0;
const BOARD_Y = 200;
const CELL = 80;
const HAND_X = 95;
const HAND_Y = 1045;
const HAND_STEP = 90;
const HAND_WIDTH = 80;
const HAND_HEIGHT = 90;
const MAIN_BG_IMAGE = "resources/img/mainUI/bg1.png";
const TITLE_IMAGE = "resources/img/mainUI/title.png";
const START_BUTTON_IMAGE = "resources/img/mainUI/startGameBtn2.png";
const BATTLE_BG_IMAGE = "resources/img/map/bg_0.png";
const MAP_BG_IMAGE = "resources/img/map/mapBg_1.png";
const MAP_DIVIDE_IMAGE = "resources/img/map/divide_0.png";
const TILE_IMAGE = "resources/img/battleUI/bound3.png";
const REFRESH_SLOT_IMAGES = [
  "resources/img/map/refresh_0_0.png",
  "resources/img/map/refresh_1_0.png",
  "resources/img/map/refresh_2_0.png",
  "resources/img/map/refresh_3_0.png",
] as const;
const MAIN_SCENE_URL = "scene/MainScene.ls";
const BATTLE_SCENE_URL = "scene/BattleScene.ls";
const ORIGINAL_SCENE_RUNTIMES = [
  "dKvUsPTsTBGGfiZxHMSqtg",
  "a1VsRozfQfKce35jblVR3w",
] as const;

type BoardRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AdouDragState =
  | {
      kind: "hand";
      index: number;
      startX: number;
      startY: number;
      moved: boolean;
      ghost: Laya.Sprite;
    }
  | {
      kind: "unit";
      uid: number;
      startX: number;
      startY: number;
      moved: boolean;
      ghost: Laya.Sprite;
    }
  | {
      kind: "skill";
      index: number;
      startX: number;
      startY: number;
      moved: boolean;
      ghost: Laya.Sprite;
    };

type AdouCodexTab = "general" | "weapon" | "skill";

function hex(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function clearLayer(layer: Laya.Sprite) {
  layer.destroyChildren();
  layer.graphics.clear();
}

function makeText(
  text: string,
  size: number,
  color: string,
  width: number,
  height: number,
  align: "left" | "center" | "right" = "center",
) {
  const label = new Laya.Text();
  label.text = text;
  label.font = "Arial";
  label.fontSize = size;
  label.color = color;
  label.align = align;
  label.valign = "middle";
  label.width = width;
  label.height = height;
  label.mouseEnabled = false;
  return label;
}

function makeImage(skin: string, rect: BoardRect) {
  const image = new Laya.Image(skin);
  image.pos(rect.x, rect.y);
  image.size(rect.width, rect.height);
  image.mouseEnabled = false;
  return image;
}

function makeButton(
  text: string,
  rect: BoardRect,
  onClick: () => void,
  options: { fill?: string; stroke?: string; color?: string; size?: number } = {},
) {
  const button = new Laya.Sprite();
  button.graphics.drawRect(0, 0, rect.width, rect.height, options.fill ?? "#5e3b20", options.stroke ?? "#d0a35d", 2);
  button.pos(rect.x, rect.y);
  button.mouseEnabled = true;
  const label = makeText(text, options.size ?? 26, options.color ?? "#f8e7bc", rect.width, rect.height);
  button.addChild(label);
  button.on(Laya.Event.CLICK, null, onClick);
  return button;
}

function registerOriginalSceneRuntimes() {
  const classUtils = (Laya as any).ClassUtils;
  if (!classUtils?.regClass) return;
  for (const runtimeId of ORIGINAL_SCENE_RUNTIMES) {
    class OriginalSceneRuntime extends Laya.Scene {}
    classUtils.regClass(runtimeId, OriginalSceneRuntime);
  }
}

function findChildByName<T extends Laya.Node = Laya.Node>(node: Laya.Node, name: string): T | null {
  if (node.name === name) return node as T;
  for (let index = 0; index < node.numChildren; index += 1) {
    const child = node.getChildAt(index);
    const result = findChildByName<T>(child, name);
    if (result) return result;
  }
  return null;
}

async function openOriginalScene(url: string) {
  registerOriginalSceneRuntimes();
  return Laya.Scene.open(url, false);
}

function itemTitle(item: AdouHandItem | null) {
  if (!item) return "";
  if (item.type === "unit") return item.unit.name;
  return item.card.token;
}

function itemSubTitle(item: AdouHandItem | null) {
  if (!item) return "";
  if (item.type === "unit") return `Lv.${item.unit.tier}`;
  if (item.card.kind === "tool") return "工具";
  if (item.card.kind === "general-part") return "散字";
  if (item.card.kind === "farmer") return "农";
  return `Lv.${item.card.tier}`;
}

function sideLabel(side: AdouSide) {
  return side === "player" ? "阿斗" : "敌阵";
}

function skillTargetLabel(target: string) {
  const labels: Record<string, string> = {
    none: "立即",
    cell: "地块",
    unit: "单位",
    road: "道路",
    hand: "手牌",
  };
  return labels[target] ?? target;
}

function compactText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

export class AdouBattleScene {
  private root = new Laya.Sprite();
  private startLayer = new Laya.Sprite();
  private boardLayer = new Laya.Sprite();
  private rangeLayer = new Laya.Sprite();
  private unitLayer = new Laya.Sprite();
  private enemyLayer = new Laya.Sprite();
  private avatarLayer = new Laya.Sprite();
  private effectLayer = new Laya.Sprite();
  private uiLayer = new Laya.Sprite();
  private state: AdouBattleState | null = null;
  private selectedHandIndex: number | null = null;
  private selectedUnitUid: number | null = null;
  private selectedSkillSlot: number | null = null;
  private dragState: AdouDragState | null = null;
  private activePointerId: number | null = null;
  private lastPointerEventAt = 0;
  private codexOverlay: Laya.Sprite | null = null;
  private codexTab: AdouCodexTab = "general";
  private suppressNextClick = false;
  private infoText: Laya.Text | null = null;
  private messageText: Laya.Text | null = null;
  private lastRenderSecond = -1;
  private currentOriginalScene: Laya.Scene | null = null;
  private battleOriginalScene: Laya.Scene | null = null;
  private openingScene = false;
  private readonly handleDomPointerDown = (event: PointerEvent) => {
    this.lastPointerEventAt = Date.now();
    if (event.button !== 0 || this.activePointerId !== null) return;
    const point = this.clientToBasePoint(event.clientX, event.clientY);
    if (!point || !this.beginDomDragAt(point.x, point.y)) return;
    this.activePointerId = event.pointerId;
    event.preventDefault();
    event.stopPropagation();
  };
  private readonly handleDomPointerMove = (event: PointerEvent) => {
    this.lastPointerEventAt = Date.now();
    if (this.activePointerId !== event.pointerId || !this.dragState) return;
    const point = this.clientToBasePoint(event.clientX, event.clientY);
    if (!point) return;
    this.updateDragAt(point.x, point.y);
    event.preventDefault();
    event.stopPropagation();
  };
  private readonly handleDomPointerUp = (event: PointerEvent) => {
    this.lastPointerEventAt = Date.now();
    const point = this.clientToBasePoint(event.clientX, event.clientY);
    if (!point) return;
    const hadDrag = this.activePointerId === event.pointerId && this.dragState !== null;
    const dragHandled = hadDrag ? this.finishDragAt(point.x, point.y) : false;
    this.activePointerId = null;
    if (dragHandled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.handleBaseTap(point.x, point.y)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  private readonly handleDomPointerCancel = (event: PointerEvent) => {
    this.lastPointerEventAt = Date.now();
    if (this.activePointerId !== event.pointerId) return;
    this.cancelDrag();
    this.activePointerId = null;
  };
  private readonly handleDomMouseDown = (event: MouseEvent) => {
    if (Date.now() - this.lastPointerEventAt < 500) return;
    if (event.button !== 0 || this.activePointerId !== null) return;
    const point = this.clientToBasePoint(event.clientX, event.clientY);
    if (!point || !this.beginDomDragAt(point.x, point.y)) return;
    this.activePointerId = -1;
    event.preventDefault();
    event.stopPropagation();
  };
  private readonly handleDomMouseMove = (event: MouseEvent) => {
    if (this.activePointerId === null || !this.dragState) return;
    const point = this.clientToBasePoint(event.clientX, event.clientY);
    if (!point) return;
    this.updateDragAt(point.x, point.y);
    event.preventDefault();
    event.stopPropagation();
  };
  private readonly handleDomMouseUp = (event: MouseEvent) => {
    if (!this.dragState && Date.now() - this.lastPointerEventAt < 500) return;
    const point = this.clientToBasePoint(event.clientX, event.clientY);
    if (!point) return;
    const hadDrag = this.activePointerId !== null && this.dragState !== null;
    const dragHandled = hadDrag ? this.finishDragAt(point.x, point.y) : false;
    this.activePointerId = null;
    if (dragHandled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.handleBaseTap(point.x, point.y)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  mount() {
    Laya.stage.bgColor = STAGE_BG;
    this.root.mouseEnabled = true;
    this.startLayer.mouseEnabled = true;
    this.boardLayer.mouseEnabled = true;
    this.rangeLayer.mouseEnabled = false;
    this.unitLayer.mouseEnabled = true;
    this.enemyLayer.mouseEnabled = false;
    this.avatarLayer.mouseEnabled = false;
    this.effectLayer.mouseEnabled = true;
    this.uiLayer.mouseEnabled = true;
    Laya.stage.addChild(this.root);
    this.root.addChild(this.boardLayer);
    this.root.addChild(this.rangeLayer);
    this.root.addChild(this.unitLayer);
    this.root.addChild(this.enemyLayer);
    this.root.addChild(this.avatarLayer);
    this.root.addChild(this.effectLayer);
    this.root.addChild(this.uiLayer);
    this.root.addChild(this.startLayer);
    this.fit();
    Laya.stage.on(Laya.Event.RESIZE, this, this.fit);
    window.addEventListener("pointerdown", this.handleDomPointerDown, { passive: false });
    window.addEventListener("pointermove", this.handleDomPointerMove, { passive: false });
    window.addEventListener("pointerup", this.handleDomPointerUp, { passive: false });
    window.addEventListener("pointercancel", this.handleDomPointerCancel, { passive: false });
    window.addEventListener("mousedown", this.handleDomMouseDown, { passive: false });
    window.addEventListener("mousemove", this.handleDomMouseMove, { passive: false });
    window.addEventListener("mouseup", this.handleDomMouseUp, { passive: false });
    void this.showStart();
  }

  destroy() {
    Laya.timer.clear(this, this.tick);
    Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
    Laya.stage.off(Laya.Event.RESIZE, this, this.fit);
    window.removeEventListener("pointerdown", this.handleDomPointerDown);
    window.removeEventListener("pointermove", this.handleDomPointerMove);
    window.removeEventListener("pointerup", this.handleDomPointerUp);
    window.removeEventListener("pointercancel", this.handleDomPointerCancel);
    window.removeEventListener("mousedown", this.handleDomMouseDown);
    window.removeEventListener("mousemove", this.handleDomMouseMove);
    window.removeEventListener("mouseup", this.handleDomMouseUp);
    this.currentOriginalScene?.close();
    this.currentOriginalScene = null;
    this.battleOriginalScene = null;
    this.root.destroy(true);
  }

  private fit() {
    const scale = Math.min(Laya.stage.width / BASE_WIDTH, Laya.stage.height / BASE_HEIGHT);
    this.root.scale(scale, scale);
    this.root.pos(
      (Laya.stage.width - BASE_WIDTH * scale) / 2,
      (Laya.stage.height - BASE_HEIGHT * scale) / 2,
    );
  }

  private async showStart() {
    if (this.openingScene) return;
    this.openingScene = true;
    Laya.timer.clear(this, this.tick);
    this.state = null;
    this.battleOriginalScene = null;
    clearLayer(this.startLayer);
    clearLayer(this.boardLayer);
    clearLayer(this.rangeLayer);
    clearLayer(this.unitLayer);
    clearLayer(this.enemyLayer);
    clearLayer(this.avatarLayer);
    clearLayer(this.effectLayer);
    clearLayer(this.uiLayer);
    this.codexOverlay = null;

    try {
      const previous = this.currentOriginalScene;
      const scene = await openOriginalScene(MAIN_SCENE_URL);
      previous?.close();
      this.currentOriginalScene = scene;
      Laya.stage.addChild(this.root);

      const playBtn = findChildByName<Laya.Sprite>(scene, "playBtn");
      playBtn?.offAll(Laya.Event.CLICK);
      playBtn?.on(Laya.Event.CLICK, this, this.startGame);

      const weaponBtn = findChildByName<Laya.Sprite>(scene, "weaponBtn");
      weaponBtn?.offAll(Laya.Event.CLICK);
      weaponBtn?.on(Laya.Event.CLICK, this, this.showCodexOverlay);
    } catch (error) {
      console.error("Unable to open original MainScene.", error);
      this.startLayer.addChild(makeImage(MAIN_BG_IMAGE, { x: 0, y: 0, width: 640, height: 1386 }));
      this.startLayer.addChild(makeImage(TITLE_IMAGE, { x: 127, y: 217, width: 391, height: 104 }));
      const start = makeButton("开始游戏", { x: 143, y: 985, width: 354, height: 145 }, () => this.startGame(), {
        fill: "rgba(0,0,0,0)",
        stroke: "rgba(0,0,0,0)",
        size: 34,
      });
      start.addChildAt(makeImage(START_BUTTON_IMAGE, { x: 0, y: 0, width: 354, height: 145 }), 0);
      this.startLayer.addChild(start);
    } finally {
      this.openingScene = false;
    }
  }

  private startGame() {
    if (this.openingScene) return;
    void this.openBattleSceneAndStart();
  }

  private async openBattleSceneAndStart() {
    this.openingScene = true;
    const storage = typeof window === "undefined" ? null : window.localStorage;
    this.state = createAdouBattleState("changban", Math.random, readAdouLoadout(storage), { aiDifficulty: 2 });
    const events = startAdouBattle(this.state, Math.random);
    this.selectedHandIndex = null;
    this.selectedUnitUid = null;
    this.selectedSkillSlot = null;
    this.codexOverlay = null;
    clearLayer(this.startLayer);
    clearLayer(this.boardLayer);
    clearLayer(this.rangeLayer);
    clearLayer(this.unitLayer);
    clearLayer(this.enemyLayer);
    clearLayer(this.avatarLayer);
    clearLayer(this.effectLayer);
    clearLayer(this.uiLayer);
    try {
      const previous = this.currentOriginalScene;
      const scene = await openOriginalScene(BATTLE_SCENE_URL);
      previous?.close();
      this.currentOriginalScene = scene;
      this.battleOriginalScene = scene;
      Laya.stage.addChild(this.root);
      this.bindOriginalBattleScene(scene);
    } catch (error) {
      console.error("Unable to open original BattleScene.", error);
      this.battleOriginalScene = null;
    } finally {
      this.openingScene = false;
    }
    this.renderStaticBoard();
    this.renderHud();
    this.renderDynamic();
    this.spawnFeedback("adou-entry");
    this.applyFeedback(events);
    Laya.timer.clear(this, this.tick);
    Laya.timer.frameLoop(1, this, this.tick);
  }

  private bindOriginalBattleScene(scene: Laya.Scene) {
    const pauseButton = findChildByName<Laya.Sprite>(scene, "xBtn");
    pauseButton?.offAll(Laya.Event.CLICK);
    pauseButton?.on(Laya.Event.CLICK, this, this.endBattle);

    const refreshButton = findChildByName<Laya.Sprite>(scene, "refreshBtn");
    refreshButton?.offAll(Laya.Event.CLICK);
    refreshButton?.on(Laya.Event.CLICK, this, this.refreshHand);

    const map = findChildByName<Laya.Sprite>(scene, "map");
    map?.offAll(Laya.Event.CLICK);
    map?.on(Laya.Event.CLICK, this, this.onBoardClick);
  }

  private tick() {
    if (!this.state || this.state.status !== "playing") return;
    const dt = Math.min(0.05, Math.max(0.001, Laya.timer.delta / 1000));
    const events = tickAdouCore(this.state, dt, Math.random);
    if (events.length > 0) this.applyFeedback(events);
    const renderSecond = Math.floor(this.state.elapsedSeconds * 10);
    if (events.length > 0 || renderSecond !== this.lastRenderSecond) {
      this.lastRenderSecond = renderSecond;
      this.renderHud();
      this.renderDynamic();
    }
  }

  private renderStaticBoard() {
    if (!this.state) return;
    clearLayer(this.boardLayer);
    this.boardLayer.offAll();
    this.boardLayer.graphics.loadImage(BATTLE_BG_IMAGE, 0, 0, 640, 1500);
    this.boardLayer.graphics.loadImage(MAP_BG_IMAGE, -76, 114, 791, 1130);

    for (const tile of this.state.tiles) this.drawTile(tile);
    this.drawRoute(this.state.map.routes.player, "#2d72bb");
    this.drawRoute(this.state.map.routes.ai, "#b84635");
    this.boardLayer.graphics.loadImage(MAP_DIVIDE_IMAGE, 0, BOARD_Y + 252, 640, 184);
    this.boardLayer.on(Laya.Event.CLICK, this, this.onBoardClick);
  }

  private drawTile(tile: AdouTile) {
    if (!this.state) return;
    const x = BOARD_X + tile.col * CELL;
    const y = BOARD_Y + tile.row * CELL;
    const fill = tile.kind === "plot"
      ? this.state.map.palette.plot
      : tile.kind === "road"
        ? this.state.map.palette.road
        : tile.kind === "grass"
          ? this.state.map.palette.grass
          : this.state.map.palette.blocked;
    const stroke = tile.owner === "player" ? "#315f8d" : "#8d4638";
    this.boardLayer.graphics.drawRect(x + 4, y + 4, CELL - 8, CELL - 8, hex(fill), stroke, tile.kind === "road" ? 2 : 1);
    this.boardLayer.graphics.loadImage(TILE_IMAGE, x, y, CELL, CELL);
    if (tile.kind === "blocked") {
      this.boardLayer.graphics.drawLine(x + 12, y + 12, x + CELL - 12, y + CELL - 12, "#2a201c", 4);
      this.boardLayer.graphics.drawLine(x + CELL - 12, y + 12, x + 12, y + CELL - 12, "#2a201c", 4);
    }
  }

  private drawRoute(route: readonly AdouPoint[], color: string) {
    for (let index = 0; index < route.length - 1; index += 1) {
      const from = route[index];
      const to = route[index + 1];
      if (!from || !to) continue;
      this.boardLayer.graphics.drawLine(
        BOARD_X + (from.col + 0.5) * CELL,
        BOARD_Y + (from.row + 0.5) * CELL,
        BOARD_X + (to.col + 0.5) * CELL,
        BOARD_Y + (to.row + 0.5) * CELL,
        color,
        5,
      );
    }
  }

  private renderHud() {
    if (!this.state) return;
    clearLayer(this.uiLayer);

    const title = makeText("阿斗守阵", 30, "#f0d59a", 180, 48, "left");
    title.pos(32, 48);
    this.uiLayer.addChild(title);

    const aiHp = makeText(`${this.state.sides.ai.hp}/${this.state.sides.ai.maxHp} ♥`, 26, "#d98374", 130, 42, "right");
    aiHp.pos(478, 58);
    this.uiLayer.addChild(aiHp);

    const wave = makeText(`第 ${this.state.round} 波`, 30, "#f0d59a", 162, 46);
    wave.pos(239, 99);
    this.uiLayer.addChild(wave);

    this.uiLayer.addChild(makeImage("resources/img/battleUI/goldBg.png", { x: 32, y: 104, width: 150, height: 50 }));
    this.uiLayer.addChild(makeImage("resources/img/battleUI/gold.png", { x: 19, y: 98, width: 60, height: 51 }));
    const mantou = makeText(`${this.state.sides.player.mantou}`, 28, "#f5d27a", 76, 42, "left");
    mantou.pos(94, 110);
    this.uiLayer.addChild(mantou);

    this.messageText = makeText(this.state.message || `${Math.ceil(this.state.roundTimer)}s`, 22, "#cba978", 320, 36);
    this.messageText.pos(160, 148);
    this.uiLayer.addChild(this.messageText);

    const refreshButton = makeButton(
      `刷新 ${this.state.sides.player.refreshCost}`,
      { x: 190, y: 1217, width: 260, height: 82 },
      () => this.refreshHand(),
      { fill: "rgba(0,0,0,0)", stroke: "rgba(0,0,0,0)", size: 24 },
    );
    refreshButton.addChildAt(makeImage("resources/img/battleUI/btn3.png", { x: 0, y: -14, width: 260, height: 131 }), 0);
    this.uiLayer.addChild(refreshButton);

    this.renderSkillButtons();
    this.renderInfoPanel();
    this.renderHand();

    const end = makeButton("结束", { x: 500, y: 56, width: 90, height: 48 }, () => this.endBattle(), {
      fill: "#3d3027",
      stroke: "#8a6142",
      size: 22,
    });
    this.uiLayer.addChild(end);
  }

  private renderSkillButtons() {
    if (!this.state) return;
    const slots = this.state.sides.player.activeSkills;
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (!slot) continue;
      const skill = getAdouSkill(slot.skillId);
      const ready = slot.remainingSeconds <= 0;
      const label = skill
        ? `${skill.battleText} ${ready ? "" : Math.ceil(slot.remainingSeconds)}`
        : "?";
      const x = index === 0 ? 50 : 470;
      const button = makeButton(
        label,
        { x, y: 1174, width: 80, height: 80 },
        () => this.useSkillSlot(index),
        {
          fill: "rgba(0,0,0,0)",
          stroke: this.selectedSkillSlot === index ? "#f2c36b" : "rgba(0,0,0,0)",
          size: 21,
        },
      );
      button.addChildAt(makeImage("resources/img/props/activePropsBgNew.png", { x: -14, y: -14, width: 108, height: 108 }), 0);
      if (ready) button.addChildAt(makeImage("resources/img/props/activePropsBgLight.png", { x: -29, y: -29, width: 138, height: 138 }), 0);
      this.uiLayer.addChild(button);
    }
  }

  private renderInfoPanel() {
    if (!this.state) return;
    const panel = new Laya.Sprite();
    panel.graphics.drawRect(40, 956, 560, 76, "#241914", "#765433", 2);
    this.uiLayer.addChild(panel);

    const selected = this.state.units.find((unit) => unit.uid === this.selectedUnitUid) ?? null;
    const text = selected ? this.unitInfo(selected) : "阿斗守阵";
    this.infoText = makeText(text, 20, "#f0d9ad", 388, 56, "left");
    this.infoText.pos(58, 966);
    this.uiLayer.addChild(this.infoText);

    if (selected && selected.side === "player") {
      this.uiLayer.addChild(makeButton("收回", { x: 468, y: 968, width: 94, height: 46 }, () => this.returnSelectedUnit(), {
        fill: "#4a2f1e",
        size: 22,
      }));
    }
  }

  private renderHand() {
    if (!this.state) return;
    const hand = this.state.sides.player.hand;
    for (let index = 0; index < hand.length; index += 1) {
      const item = hand[index] ?? null;
      const x = HAND_X + index * HAND_STEP;
      const slot = new Laya.Sprite();
      const selected = this.selectedHandIndex === index;
      slot.graphics.loadImage(REFRESH_SLOT_IMAGES[index % REFRESH_SLOT_IMAGES.length], 0, 0, HAND_WIDTH, HAND_HEIGHT);
      if (selected) slot.graphics.drawRect(-3, -3, HAND_WIDTH + 6, HAND_HEIGHT + 6, "rgba(0,0,0,0)", "#f2c36b", 4);
      slot.pos(x, HAND_Y);
      slot.mouseEnabled = true;
      slot.on(Laya.Event.MOUSE_DOWN, null, () => this.startHandDrag(index));
      slot.on(Laya.Event.CLICK, null, () => this.onHandClick(index));
      const title = makeText(itemTitle(item), item?.type === "unit" && item.unit.width === 2 ? 28 : 34, "#f8e8c4", HAND_WIDTH, 44);
      title.pos(0, 10);
      slot.addChild(title);
      const sub = makeText(itemSubTitle(item), 16, "#3c2a1e", HAND_WIDTH, 24);
      sub.pos(0, 58);
      slot.addChild(sub);
      this.uiLayer.addChild(slot);
    }
  }

  private renderDynamic() {
    if (!this.state) return;
    clearLayer(this.rangeLayer);
    clearLayer(this.unitLayer);
    clearLayer(this.enemyLayer);
    clearLayer(this.avatarLayer);
    this.renderRange();
    for (const unit of this.state.units) this.drawUnit(unit);
    for (const enemy of this.state.enemies) this.drawEnemy(enemy.uid);
    this.drawSideAvatar("player");
    this.drawSideAvatar("ai");
  }

  private renderRange() {
    if (!this.state || this.selectedUnitUid === null) return;
    const unit = this.state.units.find((candidate) => candidate.uid === this.selectedUnitUid);
    if (!unit) return;
    const stats = resolveAdouUnitStats(unit, {
      weaponId: unit.weaponId,
      rangeMultiplier: this.state.sides[unit.side].rangeBonus,
      attackSpeedMultiplier: this.state.sides[unit.side].attackSpeedBonus,
      unitAttackSpeedMultiplier: unit.attackSpeedMultiplier,
    });
    for (const cell of getAdouUnitCellsForRange(unit, stats.attackRange)) {
      if (cell.col < 0 || cell.col >= ADOU_BOARD_COLS || cell.row < 0 || cell.row >= ADOU_BOARD_ROWS) continue;
      this.rangeLayer.graphics.drawRect(
        BOARD_X + cell.col * CELL + 9,
        BOARD_Y + cell.row * CELL + 9,
        CELL - 18,
        CELL - 18,
        "rgba(255, 225, 126, 0.18)",
        "#e5bd63",
        1,
      );
    }
  }

  private drawUnit(unit: AdouBattleUnit) {
    const x = BOARD_X + unit.col * CELL + 5;
    const y = BOARD_Y + unit.row * CELL + 5;
    const w = unit.width * CELL - 10;
    const sprite = new Laya.Sprite();
    const selected = this.selectedUnitUid === unit.uid;
    const bgSkin = unit.kind === "general"
      ? `resources/img/gameObject/soldier/generalBg${Math.max(1, Math.min(4, unit.tier))}.png`
      : unit.kind === "farmer"
        ? "resources/img/gameObject/soldier/farmer.png"
        : `resources/img/gameObject/soldier/civilianBg${unit.tier >= 2 ? 2 : 1}.png`;
    sprite.graphics.loadImage(bgSkin, 0, 0, w, CELL - 10);
    if (selected) sprite.graphics.drawRect(0, 0, w, CELL - 10, "rgba(0,0,0,0)", "#f6f063", 4);
    sprite.pos(x, y);
    sprite.mouseEnabled = true;
    sprite.on(Laya.Event.MOUSE_DOWN, null, () => this.startUnitDrag(unit.uid));
    sprite.on(Laya.Event.CLICK, null, () => {
      if (this.consumeSuppressedClick()) return;
      this.selectedHandIndex = null;
      this.selectedUnitUid = unit.uid;
      this.selectedSkillSlot = null;
      this.renderHud();
      this.renderDynamic();
    });

    const name = makeText(unit.name, unit.width === 2 ? 28 : 34, "#302217", w, 42);
    name.pos(0, 6);
    sprite.addChild(name);
    const level = makeText(`Lv.${unit.tier}`, 16, "#fff1c9", w, 22);
    level.pos(0, 45);
    sprite.addChild(level);
    this.unitLayer.addChild(sprite);
  }

  private drawEnemy(enemyUid: number) {
    if (!this.state) return;
    const enemy = this.state.enemies.find((candidate) => candidate.uid === enemyUid);
    if (!enemy) return;
    const point = getAdouEnemyPoint(this.state, enemy);
    const x = BOARD_X + point.x * CELL;
    const y = BOARD_Y + point.y * CELL;
    const sprite = new Laya.Sprite();
    const boss = enemy.kind === "boss";
    sprite.graphics.loadImage("resources/img/gameObject/enemy/shadow1.png", boss ? -32 : -24, boss ? 20 : 16, boss ? 64 : 48, boss ? 26 : 20);
    sprite.graphics.loadImage(boss ? "resources/img/gameObject/enemy/mob_3.png" : "resources/img/gameObject/enemy/mob_0.png", boss ? -34 : -24, boss ? -46 : -34, boss ? 68 : 48, boss ? 68 : 48);
    sprite.pos(x, y);
    const label = makeText(enemy.label, boss ? 20 : 16, "#f6e0bb", boss ? 54 : 42, boss ? 28 : 24);
    label.pos(boss ? -27 : -21, boss ? -17 : -15);
    sprite.addChild(label);
    const hpWidth = boss ? 62 : 42;
    sprite.graphics.drawRect(-hpWidth / 2, boss ? 31 : 23, hpWidth, 5, "#2b1612");
    sprite.graphics.drawRect(-hpWidth / 2, boss ? 31 : 23, hpWidth * Math.max(0, enemy.hp / enemy.maxHp), 5, "#dd4b40");
    this.enemyLayer.addChild(sprite);
  }

  private drawSideAvatar(side: AdouSide) {
    if (!this.state) return;
    const point = this.sideAvatarBasePoint(side);
    if (!point) return;

    const runtime = this.state.sides[side];
    const sprite = new Laya.Sprite();
    const isPlayer = side === "player";
    sprite.graphics.drawCircle(0, 0, isPlayer ? 28 : 22, isPlayer ? "#f0d39d" : "#7a3127", isPlayer ? "#8f5c32" : "#f0b46a", 3);
    sprite.graphics.drawCircle(-8, -5, 3, isPlayer ? "#322117" : "#f6dcc0");
    sprite.graphics.drawCircle(8, -5, 3, isPlayer ? "#322117" : "#f6dcc0");
    sprite.graphics.drawLine(-9, 9, 9, 9, isPlayer ? "#8b3328" : "#f6dcc0", 3);
    sprite.pos(point.x, point.y);

    const name = makeText(isPlayer ? "阿斗" : "敌", isPlayer ? 18 : 16, isPlayer ? "#392416" : "#f8e2bd", 70, 28);
    name.pos(-35, isPlayer ? 23 : 19);
    sprite.addChild(name);

    if (isPlayer) {
      const heartCount = Math.min(runtime.maxHp, 6);
      const startX = -((heartCount - 1) * 18) / 2;
      for (let index = 0; index < heartCount; index += 1) {
        sprite.graphics.loadImage(
          index < runtime.hp ? "resources/img/battleUI/heart1.png" : "resources/img/battleUI/heart4.png",
          startX + index * 18 - 9,
          -50,
          18,
          18,
        );
      }
      const hearts = Array.from({ length: heartCount }, (_, index) => index < runtime.hp ? "♥" : "♡").join("");
      const heartText = makeText(hearts, 22, "#ff6f64", Math.max(84, runtime.maxHp * 22), 28);
      heartText.pos(-heartText.width / 2, -58);
      sprite.addChild(heartText);
    } else {
      const hpText = makeText(`${runtime.hp}/${runtime.maxHp}`, 15, "#f0b46a", 76, 24);
      hpText.pos(-38, -42);
      sprite.addChild(hpText);
    }

    this.avatarLayer.addChild(sprite);
  }

  private sideAvatarBasePoint(side: AdouSide) {
    if (!this.state) return null;
    const route = this.state.map.routes[side];
    const point = route[route.length - 1];
    if (!point) return null;
    return {
      x: BOARD_X + (point.col + 0.5) * CELL,
      y: BOARD_Y + (point.row + 0.5) * CELL,
    };
  }

  private onBoardClick() {
    if (!this.state) return;
    if (this.consumeSuppressedClick()) return;
    const point = this.stagePointToBoard();
    if (!point) return;
    this.handleBoardPoint(point);
  }

  private handleBoardPoint(point: AdouPoint) {
    if (!this.state) return;
    let events: AdouCoreEvent[] = [];
    if (this.selectedSkillSlot !== null) {
      events = useAdouActiveSkillSlot(this.state, "player", this.selectedSkillSlot, { type: "cell", ...point }, Math.random);
      this.selectedSkillSlot = null;
    } else if (this.selectedHandIndex !== null) {
      events = placeAdouHandItem(this.state, "player", this.selectedHandIndex, point, Math.random);
      if (!events.some((event) => event.type === "action-failed")) this.selectedHandIndex = null;
    } else if (this.selectedUnitUid !== null) {
      events = moveAdouBattleUnit(this.state, "player", this.selectedUnitUid, point);
    } else {
      const unit = this.state.units.find((candidate) =>
        candidate.row === point.row && point.col >= candidate.col && point.col < candidate.col + candidate.width,
      );
      this.selectedUnitUid = unit?.uid ?? null;
    }

    this.applyFeedback(events);
    this.renderHud();
    this.renderDynamic();
  }

  private handleBaseTap(x: number, y: number) {
    if (this.consumeSuppressedClick()) return true;

    if (this.codexOverlay) {
      if (this.contains({ x: 220, y: 780, width: 200, height: 68 }, x, y)) {
        this.closeCodexOverlay();
      } else {
        const tab = this.codexTabAt(x, y);
        if (tab) this.renderCodexOverlay(tab);
      }
      return true;
    }

    if (!this.state) {
      if (this.contains({ x: 143, y: 985, width: 354, height: 145 }, x, y)) {
        this.startGame();
        return true;
      }
      if (this.contains({ x: 224, y: 1144, width: 192, height: 72 }, x, y)) {
        this.showCodexOverlay();
        return true;
      }
      return false;
    }

    if (this.state.status === "ended") {
      if (this.contains({ x: 280, y: 624, width: 190, height: 74 }, x, y)) {
        this.startGame();
      }
      return true;
    }

    if (this.contains({ x: 190, y: 1217, width: 260, height: 82 }, x, y)) {
      this.refreshHand();
      return true;
    }
    if (this.contains({ x: 500, y: 56, width: 90, height: 48 }, x, y)) {
      this.endBattle();
      return true;
    }
    if (this.selectedUnitUid !== null && this.contains({ x: 468, y: 968, width: 94, height: 46 }, x, y)) {
      this.returnSelectedUnit();
      return true;
    }

    for (let index = 0; index < this.state.sides.player.activeSkills.length; index += 1) {
      if (!this.contains({ x: index === 0 ? 50 : 470, y: 1174, width: 80, height: 80 }, x, y)) continue;
      this.useSkillSlot(index);
      return true;
    }

    const handIndex = this.handIndexAt(x, y);
    if (handIndex !== null) {
      this.onHandClick(handIndex);
      return true;
    }

    const boardPoint = this.boardPointFromBase(x, y);
    if (boardPoint) {
      this.handleBoardPoint(boardPoint);
      return true;
    }

    return false;
  }

  private contains(rect: BoardRect, x: number, y: number) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  private clientToBasePoint(clientX: number, clientY: number) {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const stageX = ((clientX - rect.left) / rect.width) * Laya.stage.width;
    const stageY = ((clientY - rect.top) / rect.height) * Laya.stage.height;
    const scale = this.root.scaleX || 1;
    return {
      x: (stageX - this.root.x) / scale,
      y: (stageY - this.root.y) / scale,
    };
  }

  private boardPointFromBase(x: number, y: number): AdouPoint | null {
    const col = Math.floor((x - BOARD_X) / CELL);
    const row = Math.floor((y - BOARD_Y) / CELL);
    if (col < 0 || col >= ADOU_BOARD_COLS || row < 0 || row >= ADOU_BOARD_ROWS) return null;
    return { col, row };
  }

  private stagePointToBoard(): AdouPoint | null {
    const localX = this.root.mouseX;
    const localY = this.root.mouseY;
    return this.boardPointFromBase(localX, localY);
  }

  private playerUnitAtBase(x: number, y: number) {
    if (!this.state) return null;
    const point = this.boardPointFromBase(x, y);
    if (!point) return null;
    return this.state.units.find((candidate) =>
      candidate.side === "player"
      && candidate.row === point.row
      && point.col >= candidate.col
      && point.col < candidate.col + candidate.width,
    ) ?? null;
  }

  private beginDomDragAt(x: number, y: number) {
    if (!this.state || this.state.status !== "playing") return false;

    const skillIndex = this.skillSlotAt(x, y);
    if (skillIndex !== null && this.canDragSkill(skillIndex)) {
      this.startSkillDragAt(skillIndex, x, y);
      return true;
    }

    const handIndex = this.handIndexAt(x, y);
    if (handIndex !== null && this.state.sides.player.hand[handIndex]) {
      this.startHandDragAt(handIndex, x, y);
      return true;
    }

    const unit = this.playerUnitAtBase(x, y);
    if (unit) {
      this.startUnitDragAt(unit.uid, x, y);
      return true;
    }

    return false;
  }

  private onHandClick(index: number) {
    if (!this.state) return;
    if (this.consumeSuppressedClick()) return;
    if (this.selectedHandIndex === null) {
      this.selectedHandIndex = index;
      this.selectedUnitUid = null;
      this.selectedSkillSlot = null;
      this.renderHud();
      this.renderDynamic();
      return;
    }
    if (this.selectedHandIndex === index) {
      this.selectedHandIndex = null;
      this.renderHud();
      return;
    }
    const events = mergeAdouBattleHandSlots(this.state, "player", this.selectedHandIndex, index);
    if (events.some((event) => event.type === "action-failed")) {
      this.selectedHandIndex = index;
    } else {
      this.selectedHandIndex = null;
    }
    this.applyFeedback(events);
    this.renderHud();
    this.renderDynamic();
  }

  private refreshHand() {
    if (!this.state) return;
    const event = refreshAdouBattleHand(this.state, "player", Math.random);
    this.selectedHandIndex = null;
    this.selectedSkillSlot = null;
    this.applyFeedback(event ? [event] : [{ type: "action-failed", side: "player", message: "馒头不足" }]);
    this.renderHud();
  }

  private startHandDrag(index: number) {
    if (!this.state || !this.state.sides.player.hand[index]) return;
    this.startHandDragAt(index, this.root.mouseX, this.root.mouseY);
  }

  private startHandDragAt(index: number, x: number, y: number) {
    if (!this.state || !this.state.sides.player.hand[index]) return;
    this.beginDrag({
      kind: "hand",
      index,
      startX: x,
      startY: y,
      moved: false,
      ghost: this.makeDragGhost(itemTitle(this.state.sides.player.hand[index] ?? null)),
    });
  }

  private startUnitDrag(uid: number) {
    if (!this.state) return;
    this.startUnitDragAt(uid, this.root.mouseX, this.root.mouseY);
  }

  private startUnitDragAt(uid: number, x: number, y: number) {
    if (!this.state) return;
    const unit = this.state.units.find((candidate) => candidate.uid === uid && candidate.side === "player");
    if (!unit) return;
    this.selectedUnitUid = uid;
    this.beginDrag({
      kind: "unit",
      uid,
      startX: x,
      startY: y,
      moved: false,
      ghost: this.makeDragGhost(unit.name, unit.width === 2 ? 136 : 76),
    });
  }

  private startSkillDragAt(index: number, x: number, y: number) {
    const slot = this.state?.sides.player.activeSkills[index];
    const skill = slot ? getAdouSkill(slot.skillId) : null;
    if (!slot || !skill) return;
    this.beginDrag({
      kind: "skill",
      index,
      startX: x,
      startY: y,
      moved: false,
      ghost: this.makeDragGhost(skill.battleText, 92),
    });
  }

  private beginDrag(state: AdouDragState) {
    this.dragState?.ghost.destroy(true);
    this.dragState = state;
    state.ghost.visible = false;
    this.effectLayer.addChild(state.ghost);
    Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
    Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onDragEnd);
  }

  private makeDragGhost(text: string, width = 86) {
    const ghost = new Laya.Sprite();
    ghost.graphics.drawRect(0, 0, width, 66, "rgba(122, 63, 29, 0.86)", "#f2c36b", 3);
    ghost.size(width, 66);
    const label = makeText(text, text.length > 1 ? 25 : 34, "#fff3cf", width, 66);
    ghost.addChild(label);
    ghost.mouseEnabled = false;
    return ghost;
  }

  private onDragMove() {
    this.updateDragAt(this.root.mouseX, this.root.mouseY);
  }

  private updateDragAt(x: number, y: number) {
    const drag = this.dragState;
    if (!drag) return;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 8) drag.moved = true;
    if (!drag.moved) return;
    drag.ghost.visible = true;
    drag.ghost.pos(x - drag.ghost.width / 2, y - 34);
  }

  private onDragEnd() {
    this.finishDragAt(this.root.mouseX, this.root.mouseY);
  }

  private finishDragAt(x: number, y: number) {
    const drag = this.dragState;
    if (!drag || !this.state) return false;
    Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
    this.dragState = null;
    drag.ghost.destroy(true);

    if (!drag.moved) return false;
    this.suppressNextClick = true;

    let events: AdouCoreEvent[] = [];
    const boardPoint = this.boardPointFromBase(x, y);
    const handIndex = this.handIndexAt(x, y);

    if (drag.kind === "hand") {
      if (boardPoint) {
        events = placeAdouHandItem(this.state, "player", drag.index, boardPoint, Math.random);
        if (!events.some((event) => event.type === "action-failed")) this.selectedHandIndex = null;
      } else if (handIndex !== null && handIndex !== drag.index) {
        events = mergeAdouBattleHandSlots(this.state, "player", drag.index, handIndex);
      }
    } else if (drag.kind === "unit") {
      if (handIndex !== null) {
        events = returnAdouBoardUnitToHand(this.state, "player", drag.uid, handIndex);
        if (!events.some((event) => event.type === "action-failed")) this.selectedUnitUid = null;
      } else if (boardPoint) {
        events = moveAdouBattleUnit(this.state, "player", drag.uid, boardPoint);
      }
    } else if (drag.kind === "skill" && boardPoint) {
      events = useAdouActiveSkillSlot(this.state, "player", drag.index, { type: "cell", ...boardPoint }, Math.random);
      if (!events.some((event) => event.type === "action-failed")) this.selectedSkillSlot = null;
    }

    if (events.length > 0) this.applyFeedback(events);
    this.renderHud();
    this.renderDynamic();
    return true;
  }

  private cancelDrag() {
    const drag = this.dragState;
    if (!drag) return;
    Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
    this.dragState = null;
    drag.ghost.destroy(true);
  }

  private handIndexAt(x: number, y: number) {
    if (y < HAND_Y || y > HAND_Y + HAND_HEIGHT) return null;
    for (let index = 0; index < 5; index += 1) {
      const left = HAND_X + index * HAND_STEP;
      if (x >= left && x <= left + HAND_WIDTH) return index;
    }
    return null;
  }

  private skillSlotAt(x: number, y: number) {
    if (!this.state) return null;
    for (let index = 0; index < this.state.sides.player.activeSkills.length; index += 1) {
      if (this.contains({ x: index === 0 ? 50 : 470, y: 1174, width: 80, height: 80 }, x, y)) return index;
    }
    return null;
  }

  private canDragSkill(index: number) {
    const slot = this.state?.sides.player.activeSkills[index];
    const skill = slot ? getAdouSkill(slot.skillId) : null;
    return Boolean(slot && skill && slot.remainingSeconds <= 0 && skill.target !== "none");
  }

  private consumeSuppressedClick() {
    if (!this.suppressNextClick) return false;
    this.suppressNextClick = false;
    return true;
  }

  private useSkillSlot(index: number) {
    if (!this.state) return;
    const slot = this.state.sides.player.activeSkills[index];
    const skill = slot ? getAdouSkill(slot.skillId) : null;
    if (!slot || !skill) return;
    if (slot.remainingSeconds > 0) {
      this.applyFeedback([{ type: "action-failed", side: "player", message: `冷却中 ${Math.ceil(slot.remainingSeconds)} 秒` }]);
      return;
    }
    if (skill.target === "none") {
      const events = useAdouActiveSkillSlot(this.state, "player", index, { type: "none" }, Math.random);
      this.applyFeedback(events);
      this.renderHud();
      this.renderDynamic();
      return;
    }
    if (skill.target === "unit" && this.selectedUnitUid !== null) {
      const unit = this.state.units.find((candidate) => candidate.uid === this.selectedUnitUid);
      if (unit) {
        const events = useAdouActiveSkillSlot(this.state, "player", index, { type: "cell", col: unit.col, row: unit.row }, Math.random);
        this.applyFeedback(events);
        this.renderHud();
        this.renderDynamic();
        return;
      }
    }
    this.selectedSkillSlot = index;
    this.selectedHandIndex = null;
    this.renderHud();
  }

  private returnSelectedUnit() {
    if (!this.state || this.selectedUnitUid === null) return;
    const events = returnAdouBoardUnitToHand(this.state, "player", this.selectedUnitUid);
    if (!events.some((event) => event.type === "action-failed")) this.selectedUnitUid = null;
    this.applyFeedback(events);
    this.renderHud();
    this.renderDynamic();
  }

  private endBattle() {
    if (!this.state) return;
    const events = endAdouBattle(this.state, "ai");
    Laya.timer.clear(this, this.tick);
    this.applyFeedback(events);
    this.renderHud();
    this.renderDynamic();
    const back = makeButton("再来", { x: 280, y: 624, width: 190, height: 74 }, () => this.startGame(), {
      fill: "#7a3f1d",
      stroke: "#f2c36b",
      size: 30,
    });
    this.effectLayer.addChild(back);
  }

  private applyFeedback(events: readonly AdouCoreEvent[]) {
    for (const event of events) {
      if (event.type === "unit-attack") this.spawnAttackVisual(event);
    }

    for (const cue of collectAdouCoreEventFeedback(events)) {
      if (cue.sound) {
        try {
          Laya.SoundManager.playSound(getAdouSoundPath(cue.sound), 1);
        } catch (error) {
          console.warn("Unable to play sound", cue.sound, error);
        }
      }
      if (cue.message && this.messageText) this.messageText.text = cue.message;
      if (cue.animation && cue.animation.kind !== "unit-attack") this.spawnFeedback(cue.animation.kind, cue.animation.point);
    }
  }

  private spawnAttackVisual(event: Extract<AdouCoreEvent, { type: "unit-attack" }>) {
    const origin = this.worldToBase(event.plan.origin);
    const primary = this.worldToBase(event.plan.primary.position);
    if (event.visual.cast?.text) this.spawnCastText(event.visual.cast.text, origin.x, origin.y);

    if (event.visual.projectile) {
      this.spawnProjectile(
        event.visual.projectile.atlasKey,
        event.visual.projectile.text,
        event.visual.projectile.kind,
        origin,
        primary,
      );
    } else {
      this.spawnImpact(event.visual.impact.kind, primary, event.visual.impact.text, event.visual.impact.atlasKey);
    }

    for (const target of event.plan.targets) {
      this.spawnImpact(
        event.visual.impact.kind,
        this.worldToBase(target.position),
        event.visual.impact.text,
        event.visual.impact.atlasKey,
      );
    }

    const special = event.visual.special;
    if (special?.atlasKey && !special.chance && !special.everyAttack) {
      this.spawnImpact(special.kind, primary, undefined, special.atlasKey);
    }
  }

  private worldToBase(point: { x: number; y: number }) {
    return {
      x: BOARD_X + point.x * CELL,
      y: BOARD_Y + point.y * CELL,
    };
  }

  private spawnCastText(text: string, x: number, y: number) {
    const sprite = new Laya.Sprite();
    const label = makeText(text, text.length > 1 ? 26 : 36, "#fff1c9", 64, 64);
    label.pos(-32, -32);
    sprite.addChild(label);
    sprite.pos(x, y - 18);
    sprite.scale(0.76, 0.76);
    this.effectLayer.addChild(sprite);
    Laya.Tween.to(
      sprite,
      { y: y - 46, alpha: 0, scaleX: 1.12, scaleY: 1.12 },
      260,
      null,
      Laya.Handler.create(null, () => sprite.destroy(true)),
    );
  }

  private spawnProjectile(
    atlasKey: string | undefined,
    text: string | undefined,
    kind: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const sprite = new Laya.Sprite();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const long = kind === "pike-thrust" || kind === "pike-array";
    const width = long ? 86 : 64;
    const height = long ? 18 : 24;

    if (atlasKey) {
      sprite.graphics.loadImage(atlasKey, -width / 2, -height / 2, width, height);
    } else if (long) {
      sprite.graphics.drawLine(-42, 0, 42, 0, "#f5dfab", 5);
      sprite.graphics.drawLine(28, -9, 42, 0, "#f5dfab", 4);
      sprite.graphics.drawLine(28, 9, 42, 0, "#f5dfab", 4);
    } else {
      sprite.graphics.drawLine(-28, 0, 28, 0, "#2b2019", 4);
      sprite.graphics.drawLine(10, -10, 28, 0, "#2b2019", 3);
      sprite.graphics.drawLine(10, 10, 28, 0, "#2b2019", 3);
    }

    if (text && !atlasKey && !long) {
      const label = makeText(text, 22, "#fff1c9", 48, 24);
      label.pos(-24, -12);
      sprite.addChild(label);
    }

    sprite.pos(from.x, from.y);
    sprite.rotation = angle;
    this.effectLayer.addChild(sprite);
    Laya.Tween.to(
      sprite,
      { x: to.x, y: to.y, alpha: 0.2 },
      long ? 150 : 230,
      null,
      Laya.Handler.create(null, () => sprite.destroy(true)),
    );
  }

  private spawnImpact(kind: string, point: { x: number; y: number }, text?: string, atlasKey?: string) {
    const sprite = new Laya.Sprite();
    if (atlasKey) {
      sprite.graphics.loadImage(atlasKey, -32, -32, 64, 64);
    } else if (kind === "slash" || kind === "cavalry-sweep") {
      sprite.graphics.drawLine(-25, 20, 25, -20, "#ffe29b", 7);
      sprite.graphics.drawLine(-14, -20, 22, 15, "#f0a857", 4);
    } else if (kind === "pike-thrust") {
      sprite.graphics.drawCircle(0, 0, 15, "rgba(255, 226, 155, 0.42)", "#f7d27d", 3);
      sprite.graphics.drawLine(-28, 0, 28, 0, "#f7d27d", 4);
    } else {
      sprite.graphics.drawCircle(0, 0, 18, "rgba(255, 226, 155, 0.35)", "#f7d27d", 3);
    }

    if (text && !atlasKey && kind !== "pike-thrust") {
      const label = makeText(text, 18, "#fff4cf", 60, 30);
      label.pos(-30, -15);
      sprite.addChild(label);
    }

    sprite.pos(point.x, point.y);
    this.effectLayer.addChild(sprite);
    Laya.Tween.to(
      sprite,
      { scaleX: 1.45, scaleY: 1.45, alpha: 0 },
      260,
      null,
      Laya.Handler.create(null, () => sprite.destroy(true)),
    );
  }

  private spawnFeedback(kind: string, point?: AdouPoint) {
    const sprite = new Laya.Sprite();
    const avatarPoint = kind === "adou-entry" || kind === "adou-hurt" || kind === "heart"
      ? this.sideAvatarBasePoint("player")
      : null;
    const x = avatarPoint?.x ?? (point ? BOARD_X + (point.col + 0.5) * CELL : BASE_WIDTH / 2);
    const y = avatarPoint?.y ?? (point ? BOARD_Y + (point.row + 0.5) * CELL : 208);
    const color = kind === "adou-hurt" ? "#ff5f56" : kind === "unit-attack" ? "#f5dc7b" : "#f2c36b";
    if (kind === "heart") {
      const heart = makeText("♥", 38, "#ff6f64", 54, 54);
      heart.pos(-27, -27);
      sprite.addChild(heart);
    } else {
      sprite.graphics.drawCircle(0, 0, kind === "unit-attack" ? 14 : 22, color);
    }
    sprite.alpha = 0.72;
    sprite.pos(x, y);
    this.effectLayer.addChild(sprite);
    Laya.Tween.to(sprite, { y: y - 34, alpha: 0 }, 420, null, Laya.Handler.create(null, () => sprite.destroy(true)));
  }

  private unitInfo(unit: AdouBattleUnit) {
    if (!this.state) return "";
    const stats = resolveAdouUnitStats(unit, {
      weaponId: unit.weaponId,
      rangeMultiplier: this.state.sides[unit.side].rangeBonus,
      attackSpeedMultiplier: this.state.sides[unit.side].attackSpeedBonus,
      unitAttackSpeedMultiplier: unit.attackSpeedMultiplier,
    });
    return [
      `${sideLabel(unit.side)} ${unit.name}  Lv.${unit.tier}`,
      `伤害 ${Math.round(stats.damage)}  范围 ${stats.attackRange.toFixed(1)}  攻速 ${(1 / stats.attackInterval).toFixed(1)}/s`,
    ].join("\n");
  }

  private showCodexOverlay() {
    this.renderCodexOverlay(this.codexTab);
  }

  private renderCodexOverlay(tab: AdouCodexTab) {
    this.codexTab = tab;
    this.codexOverlay?.destroy(true);
    if (this.state) clearLayer(this.effectLayer);
    const overlay = new Laya.Sprite();
    this.codexOverlay = overlay;
    overlay.graphics.drawRect(34, 214, 572, 858, "#241914", "#d0a35d", 3);

    const title = makeText("图鉴", 38, "#f4deb1", 560, 60);
    title.pos(95, 242);
    overlay.addChild(title);

    this.drawCodexTab(overlay, "general", "武将", 78, tab === "general");
    this.drawCodexTab(overlay, "weapon", "武器", 252, tab === "weapon");
    this.drawCodexTab(overlay, "skill", "技能", 426, tab === "skill");
    this.drawCodexEntries(overlay, tab);

    const close = makeButton("返回", { x: 220, y: 780, width: 200, height: 68 }, () => this.closeCodexOverlay(), {
      fill: "#5a3821",
      size: 28,
    });
    overlay.addChild(close);
    (this.state ? this.effectLayer : this.startLayer).addChild(overlay);
  }

  private drawCodexTab(parent: Laya.Sprite, tab: AdouCodexTab, label: string, x: number, active: boolean) {
    const button = new Laya.Sprite();
    button.graphics.drawRect(0, 0, 132, 50, active ? "#7a3f1d" : "#3a2a20", active ? "#f2c36b" : "#7c5b3a", 2);
    button.pos(x, 318);
    button.mouseEnabled = true;
    button.on(Laya.Event.CLICK, null, () => this.renderCodexOverlay(tab));
    button.addChild(makeText(label, 24, active ? "#fff0c5" : "#d8bd88", 132, 50));
    parent.addChild(button);
  }

  private drawCodexEntries(parent: Laya.Sprite, tab: AdouCodexTab) {
    const codex = getAdouCodex();
    const y = 394;
    if (tab === "general") {
      codex.generals.slice(0, 7).forEach((entry, index) => {
        this.drawCodexRow(
          parent,
          index,
          entry.name,
          `${entry.weaponTypeLabel ?? "骑"}  伤害${entry.stats.damage}  范围${entry.stats.range}  攻速${(1 / entry.stats.interval).toFixed(1)}/s`,
          entry.description,
          hex(entry.stats.color),
          y,
        );
      });
      return;
    }

    if (tab === "weapon") {
      codex.weapons.slice(0, 7).forEach((entry, index) => {
        this.drawCodexRow(
          parent,
          index,
          entry.name,
          `${entry.typeLabel} · ${entry.rarityLabel}  攻击+${entry.addAttackPower}`,
          entry.description,
          entry.rarityColor,
          y,
        );
      });
      return;
    }

    codex.skills.slice(0, 7).forEach((entry, index) => {
      this.drawCodexRow(
        parent,
        index,
        entry.title,
        `${entry.kindLabel}${entry.cooldownSeconds === null ? "" : ` · 冷却${entry.cooldownSeconds}s`}  目标${skillTargetLabel(entry.target)}`,
        entry.description,
        ["#7a5a2a", "#2f7a45", "#2d64b8", "#8b45bf"][entry.rarity] ?? "#7a5a2a",
        y,
      );
    });
  }

  private drawCodexRow(
    parent: Laya.Sprite,
    index: number,
    title: string,
    meta: string,
    description: string,
    color: string,
    startY: number,
  ) {
    const row = new Laya.Sprite();
    const rowY = startY + index * 52;
    row.graphics.drawRect(0, 0, 500, 44, index % 2 === 0 ? "#2f2119" : "#281c16", "#5b432e", 1);
    row.graphics.drawRect(0, 0, 6, 44, color);
    row.pos(70, rowY);
    const titleText = makeText(title, 22, "#f7e2b8", 118, 42, "left");
    titleText.pos(16, 1);
    row.addChild(titleText);
    const metaText = makeText(compactText(meta, 22), 17, "#d2b17c", 210, 21, "left");
    metaText.pos(142, 3);
    row.addChild(metaText);
    const descText = makeText(compactText(description, 28), 16, "#c6aa7a", 340, 21, "left");
    descText.pos(142, 22);
    row.addChild(descText);
    parent.addChild(row);
  }

  private codexTabAt(x: number, y: number): AdouCodexTab | null {
    if (this.contains({ x: 78, y: 318, width: 132, height: 50 }, x, y)) return "general";
    if (this.contains({ x: 252, y: 318, width: 132, height: 50 }, x, y)) return "weapon";
    if (this.contains({ x: 426, y: 318, width: 132, height: 50 }, x, y)) return "skill";
    return null;
  }

  private closeCodexOverlay() {
    this.codexOverlay?.destroy(true);
    this.codexOverlay = null;
  }
}
