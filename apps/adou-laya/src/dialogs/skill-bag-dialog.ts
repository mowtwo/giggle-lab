// SkillBagDialog — 自定义"技能背包"界面(改造新增,非原版还原)。
//
// 基于 Laya.Sprite 自建遮罩 + 居中面板(刻意不继承 Laya.Dialog,避免其内置
// 的点击/遮罩自动关闭行为干扰格子的选择)。用可滚动列表展示所有技能(props),
// 玩家点击任意技能即可选中/取消,没有数量限制,自由分配,选择直接写入存档
// (SaveMgr 的 _props)。技能图标取自 resources/img/props/<name>_1.png。

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";

const F = GameMgr;

export class SkillBagDialog extends Laya.Sprite {
  private _moved = false;

  constructor() {
    super();
    this.initUI();
  }

  private initUI(): void {
    const SW = Laya.stage.width || 640;
    const SH = Laya.stage.height || 1386;
    this.size(SW, SH);
    this.mouseEnabled = true;

    // 全屏遮罩(点击空白处关闭)。
    const mask = new Laya.Sprite();
    mask.graphics.drawRect(0, 0, SW, SH, "#000000");
    mask.alpha = 0.6;
    mask.size(SW, SH);
    mask.mouseEnabled = true;
    mask.on(Laya.Event.CLICK, this, () => this.removeSelf());
    this.addChild(mask);

    // 居中面板。
    const W = 560;
    const H = 940;
    const px = Math.floor((SW - W) / 2);
    const py = Math.floor((SH - H) / 2);
    const panel = new Laya.Sprite();
    panel.pos(px, py);
    panel.size(W, H);
    panel.mouseEnabled = true;
    panel.graphics.drawRect(0, 0, W, H, "#2b2018");
    panel.graphics.drawRect(0, 0, W, H, null as any, "#a3702a", 4);
    this.addChild(panel);

    // 标题。
    const title = new Laya.Label("技能背包");
    title.fontSize = 40;
    title.color = "#f7de76";
    title.bold = true;
    (title as any).stroke = 5;
    (title as any).strokeColor = "#5a3a12";
    title.width = W;
    title.align = "center";
    title.y = 26;
    panel.addChild(title);

    // 提示。
    const hint = new Laya.Label("点击技能即可选择 / 取消，数量不限");
    hint.fontSize = 22;
    hint.color = "#cbb892";
    hint.width = W;
    hint.align = "center";
    hint.y = 86;
    panel.addChild(hint);

    // 关闭按钮。
    const closeBtn = new Laya.Label("✕");
    closeBtn.fontSize = 44;
    closeBtn.color = "#f7de76";
    closeBtn.pos(W - 60, 18);
    closeBtn.mouseEnabled = true;
    closeBtn.on(Laya.Event.CLICK, this, () => this.removeSelf());
    panel.addChild(closeBtn);

    // 可滚动视口 + 内容层。
    const vx = 20;
    const vy = 130;
    const vw = W - 40;
    const vh = H - 150;
    const viewport = new Laya.Sprite();
    viewport.pos(vx, vy);
    viewport.size(vw, vh);
    viewport.mouseEnabled = true;
    panel.addChild(viewport);

    const content = new Laya.Sprite();
    viewport.addChild(content);

    const cols = 4;
    const cw = 125;
    const ch = 142;
    const gap = 6;
    const props = F.instance().props.Ue;
    let idx = 0;
    for (let i = 0; i < props.length; i++) {
      const def = props[i];
      if (!def || !def.name) continue;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cell = this.makeCell(i, def, cw, ch);
      cell.pos(col * (cw + gap), row * (ch + gap));
      content.addChild(cell);
      idx++;
    }
    const rows = Math.ceil(idx / cols);
    const contentH = rows * (ch + gap);

    // 透明底,保证空隙处也能拖动滚动。
    content.graphics.drawRect(0, 0, vw, Math.max(contentH, vh), "#ffffff01");

    // 用 scrollRect 实现裁剪 + 垂直滚动(手动拖动)。
    const rect = new Laya.Rectangle(0, 0, vw, vh);
    viewport.scrollRect = rect;
    const maxScroll = Math.max(0, contentH - vh);

    let dragging = false;
    let startY = 0;
    let startScroll = 0;
    viewport.on(Laya.Event.MOUSE_DOWN, this, () => {
      dragging = true;
      startY = Laya.stage.mouseY;
      startScroll = rect.y;
      this._moved = false;
    });
    viewport.on(Laya.Event.MOUSE_MOVE, this, () => {
      if (!dragging) return;
      const dy = Laya.stage.mouseY - startY;
      if (Math.abs(dy) > 6) this._moved = true;
      let ny = startScroll - dy;
      if (ny < 0) ny = 0;
      if (ny > maxScroll) ny = maxScroll;
      rect.y = ny;
      viewport.scrollRect = rect;
    });
    const endDrag = (): void => {
      dragging = false;
    };
    viewport.on(Laya.Event.MOUSE_UP, this, endDrag);
    viewport.on(Laya.Event.MOUSE_OUT, this, endDrag);
  }

  private makeCell(propIndex: number, def: any, w: number, h: number): any {
    const player = F.instance().player;
    const cell = new Laya.Sprite();
    cell.size(w, h);
    cell.mouseEnabled = true;

    const border = new Laya.Sprite();
    cell.addChild(border);

    const icon = new Laya.Image("resources/img/props/" + def.name + "_1.png");
    icon.size(74, 74);
    icon.pos((w - 74) / 2, 16);
    cell.addChild(icon);

    const name = new Laya.Label(def.txt || def.name);
    name.fontSize = 20;
    name.color = "#ffffff";
    (name as any).stroke = 3;
    (name as any).strokeColor = "#000000";
    name.width = w;
    name.align = "center";
    name.y = 98;
    cell.addChild(name);

    const check = new Laya.Label("✓");
    check.fontSize = 30;
    check.color = "#5bd85b";
    (check as any).stroke = 3;
    (check as any).strokeColor = "#000000";
    check.pos(w - 28, 6);
    cell.addChild(check);

    const redraw = (): void => {
      const has = player.hasProps(propIndex);
      border.graphics.clear();
      border.graphics.drawRect(
        0,
        0,
        w,
        h,
        has ? "#3a5a2a" : "#1c1510",
        has ? "#5bd85b" : "#5a4a36",
        3,
      );
      check.visible = has;
      icon.alpha = has ? 1 : 0.65;
    };
    redraw();

    cell.on(Laya.Event.CLICK, this, () => {
      if (this._moved) return;
      if (player.hasProps(propIndex)) player.removeProps(propIndex);
      else player.addProps(propIndex, 1, !!def.Xe);
      redraw();
    });
    return cell;
  }
}
