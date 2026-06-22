// SkillBagDialog — 自定义"技能背包"界面(改造新增,非原版还原)。
//
// 基于 Laya.Sprite 自建遮罩 + 居中面板(刻意不继承 Laya.Dialog,避免其内置
// 的点击/遮罩自动关闭行为干扰技能选择)。用可滚动的**列表**展示所有技能
// (props),每行含图标 + 名称 + 描述;点击任意一行即可选中/取消,没有数量
// 限制,自由分配,选择直接写入存档(SaveMgr 的 _props)。

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";

const F = GameMgr;

// props 稀有度配色(稀有/卓越/史诗/传说)。
const RARITY_COLORS = ["#95e45a", "#2dddff", "#D955FF", "#E99431"];

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
    const W = 600;
    const H = 980;
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

    const rowH = 112;
    const gap = 6;
    const props = F.instance().props.Ue;
    let idx = 0;
    for (let i = 0; i < props.length; i++) {
      const def = props[i];
      if (!def || !def.name) continue;
      // 铲子(0)/推土车(1)是 shovelAd 看广告救场道具,不兼容常规技能栏;
      // 行军丹(23)加体力,无限体力下无用。三者都不在技能背包展示。
      if (i === 0 || i === 1 || i === 23) continue;
      const row = this.makeRow(i, def, vw, rowH);
      row.pos(0, idx * (rowH + gap));
      content.addChild(row);
      idx++;
    }
    const contentH = idx * (rowH + gap);

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

  private makeRow(propIndex: number, def: any, w: number, h: number): any {
    const player = F.instance().player;
    const row = new Laya.Sprite();
    row.size(w, h);
    row.mouseEnabled = true;

    const border = new Laya.Sprite();
    row.addChild(border);

    const icon = new Laya.Image("resources/img/props/" + def.name + "_1.png");
    icon.size(78, 78);
    icon.pos(16, (h - 78) / 2);
    row.addChild(icon);

    const name = new Laya.Label(def.txt || def.name);
    name.fontSize = 28;
    name.color = RARITY_COLORS[def.rarity] || "#ffffff";
    name.bold = true;
    (name as any).stroke = 3;
    (name as any).strokeColor = "#000000";
    name.pos(110, 14);
    row.addChild(name);

    let intro = def.intro || "";
    try {
      intro = F.instance().props.introAtLevel(propIndex, 1);
    } catch {
      /* keep base intro */
    }
    const desc = new Laya.Label(intro);
    desc.fontSize = 19;
    desc.color = "#cbb892";
    desc.pos(110, 52);
    desc.width = w - 150;
    desc.height = h - 56;
    (desc as any).wordWrap = true;
    desc.leading = 3;
    row.addChild(desc);

    const check = new Laya.Label("✓");
    check.fontSize = 36;
    check.color = "#5bd85b";
    (check as any).stroke = 3;
    (check as any).strokeColor = "#000000";
    check.pos(w - 46, (h - 40) / 2);
    row.addChild(check);

    const redraw = (): void => {
      const has = player.hasProps(propIndex);
      border.graphics.clear();
      border.graphics.drawRect(
        0,
        0,
        w,
        h,
        has ? "#3a5a2a" : "#241a12",
        has ? "#5bd85b" : "#5a4a36",
        2,
      );
      check.visible = has;
      icon.alpha = has ? 1 : 0.7;
    };
    redraw();

    row.on(Laya.Event.CLICK, this, () => {
      if (this._moved) return;
      if (player.hasProps(propIndex)) player.removeProps(propIndex);
      else player.addProps(propIndex, 1, !!def.Xe);
      redraw();
    });
    return row;
  }
}
