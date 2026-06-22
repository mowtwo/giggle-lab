// SkillBagDialog — 自定义"技能背包"界面(改造新增,非原版还原)。
//
// 基于 Laya.Sprite 自建遮罩 + 居中面板(刻意不继承 Laya.Dialog)。技能按
// 主动 / 被动分区,用可滚动列表展示(图标 + 名称 + 描述)。战斗技能栏仅
// 2 个主动槽、6 个被动槽,所以这里主动最多选 2、被动最多选 6,与之一致。
// 选择写入存档 _props;关闭时调用 BattlePropsMgr.reloadFromSave() 把玩家
// 主动/被动技能列表(xx/Sx)同步过去,使选择在下一场战斗真正生效。

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameMgr } from "../core/game-mgr";
import { BattlePropsMgr } from "../battle/battle-props-mgr";
import { TipMgr } from "../core/tip-mgr";

const F = GameMgr;
const Zi = BattlePropsMgr;
const tt = TipMgr;

// props 稀有度配色(稀有/卓越/史诗/传说)。
const RARITY_COLORS = ["#95e45a", "#2dddff", "#D955FF", "#E99431"];
const MAX_ACTIVE = 2;
const MAX_PASSIVE = 6;

export class SkillBagDialog extends Laya.Sprite {
  private _moved = false;
  private activeHeader: any = null;
  private passiveHeader: any = null;

  constructor() {
    super();
    this.initUI();
  }

  /** 该技能是否为主动技能(cd !== -1)。 */
  private isActive(i: number): boolean {
    return F.instance().props.Ue[i].cd !== -1;
  }

  /** 当前已选的主动 / 被动技能数量。 */
  private countSelected(active: boolean): number {
    let n = 0;
    for (const x of F.instance().player.getPropsData()) {
      const type = Array.isArray(x) ? x[0] : x;
      if (this.isActive(type) === active) n++;
    }
    return n;
  }

  private updateHeaders(): void {
    if (this.activeHeader)
      this.activeHeader.text = `主动技能（${this.countSelected(true)}/${MAX_ACTIVE}）`;
    if (this.passiveHeader)
      this.passiveHeader.text = `被动技能（${this.countSelected(false)}/${MAX_PASSIVE}）`;
  }

  private initUI(): void {
    // 清理脏数据:铲子(0)/推土车(1)/行军丹(23)不是技能背包技能,不该留在 _props。
    const player = F.instance().player;
    for (const bad of [0, 1, 23]) if (player.hasProps(bad)) player.removeProps(bad);

    const SW = Laya.stage.width || 640;
    const SH = Laya.stage.height || 1386;
    this.size(SW, SH);
    this.mouseEnabled = true;

    const mask = new Laya.Sprite();
    mask.graphics.drawRect(0, 0, SW, SH, "#000000");
    mask.alpha = 0.6;
    mask.size(SW, SH);
    mask.mouseEnabled = true;
    mask.on(Laya.Event.CLICK, this, () => this.doClose());
    this.addChild(mask);

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

    const title = new Laya.Label("技能背包");
    title.fontSize = 40;
    title.color = "#f7de76";
    title.bold = true;
    (title as any).stroke = 5;
    (title as any).strokeColor = "#5a3a12";
    title.width = W;
    title.align = "center";
    title.y = 22;
    panel.addChild(title);

    const hint = new Laya.Label("主动技能最多 2 个，被动技能最多 6 个");
    hint.fontSize = 21;
    hint.color = "#cbb892";
    hint.width = W;
    hint.align = "center";
    hint.y = 80;
    panel.addChild(hint);

    const closeBtn = new Laya.Label("✕");
    closeBtn.fontSize = 44;
    closeBtn.color = "#f7de76";
    closeBtn.pos(W - 58, 16);
    closeBtn.mouseEnabled = true;
    closeBtn.on(Laya.Event.CLICK, this, () => this.doClose());
    panel.addChild(closeBtn);

    const vx = 20;
    const vy = 120;
    const vw = W - 40;
    const vh = H - 140;
    const viewport = new Laya.Sprite();
    viewport.pos(vx, vy);
    viewport.size(vw, vh);
    viewport.mouseEnabled = true;
    panel.addChild(viewport);
    const content = new Laya.Sprite();
    viewport.addChild(content);

    const props = F.instance().props.Ue;
    const actives: number[] = [];
    const passives: number[] = [];
    for (let i = 0; i < props.length; i++) {
      const def = props[i];
      if (!def || !def.name) continue;
      if (i === 0 || i === 1 || i === 23) continue;
      (this.isActive(i) ? actives : passives).push(i);
    }

    const rowH = 110;
    const hdrH = 48;
    const gap = 6;
    let y = 0;

    const ah = this.makeHeader("#2dddff");
    ah.pos(0, y);
    content.addChild(ah);
    this.activeHeader = ah.getChildByName("lbl");
    y += hdrH;
    for (const i of actives) {
      const r = this.makeRow(i, props[i], vw, rowH);
      r.pos(0, y);
      content.addChild(r);
      y += rowH + gap;
    }

    y += 14;
    const ph = this.makeHeader("#D955FF");
    ph.pos(0, y);
    content.addChild(ph);
    this.passiveHeader = ph.getChildByName("lbl");
    y += hdrH;
    for (const i of passives) {
      const r = this.makeRow(i, props[i], vw, rowH);
      r.pos(0, y);
      content.addChild(r);
      y += rowH + gap;
    }
    const contentH = y;

    this.updateHeaders();
    content.graphics.drawRect(0, 0, vw, Math.max(contentH, vh), "#ffffff01");

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
    const end = (): void => {
      dragging = false;
    };
    viewport.on(Laya.Event.MOUSE_UP, this, end);
    viewport.on(Laya.Event.MOUSE_OUT, this, end);
  }

  private makeHeader(color: string): any {
    const h = new Laya.Sprite();
    h.size(560, 48);
    const line = new Laya.Sprite();
    line.graphics.drawRect(6, 38, 548, 2, color);
    h.addChild(line);
    const lbl = new Laya.Label("");
    lbl.name = "lbl";
    lbl.fontSize = 26;
    lbl.color = color;
    lbl.bold = true;
    (lbl as any).stroke = 3;
    (lbl as any).strokeColor = "#000000";
    lbl.pos(6, 6);
    h.addChild(lbl);
    return h;
  }

  private makeRow(i: number, def: any, w: number, h: number): any {
    const player = F.instance().player;
    const row = new Laya.Sprite();
    row.size(w, h);
    row.mouseEnabled = true;

    const border = new Laya.Sprite();
    row.addChild(border);

    const icon = new Laya.Image("resources/img/props/" + def.name + "_1.png");
    icon.size(72, 72);
    icon.pos(14, (h - 72) / 2);
    row.addChild(icon);

    const name = new Laya.Label(def.txt || def.name);
    name.fontSize = 26;
    name.color = RARITY_COLORS[def.rarity] || "#ffffff";
    name.bold = true;
    (name as any).stroke = 3;
    (name as any).strokeColor = "#000000";
    name.pos(100, 12);
    row.addChild(name);

    let intro = def.intro || "";
    try {
      intro = F.instance().props.introAtLevel(i, 1);
    } catch {
      /* keep base intro */
    }
    const desc = new Laya.Label(intro);
    desc.fontSize = 18;
    desc.color = "#cbb892";
    desc.pos(100, 48);
    desc.width = w - 150;
    desc.height = h - 52;
    (desc as any).wordWrap = true;
    desc.leading = 3;
    row.addChild(desc);

    const check = new Laya.Label("✓");
    check.fontSize = 34;
    check.color = "#5bd85b";
    (check as any).stroke = 3;
    (check as any).strokeColor = "#000000";
    check.pos(w - 44, (h - 40) / 2);
    row.addChild(check);

    const redraw = (): void => {
      const has = player.hasProps(i);
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
      const active = this.isActive(i);
      if (player.hasProps(i)) {
        player.removeProps(i);
      } else {
        const max = active ? MAX_ACTIVE : MAX_PASSIVE;
        if (this.countSelected(active) >= max) {
          tt.instance().showTip(active ? "主动技能最多 2 个" : "被动技能最多 6 个");
          return;
        }
        player.addProps(i, 1, !!def.Xe);
      }
      redraw();
      this.updateHeaders();
    });
    return row;
  }

  private doClose(): void {
    // 把技能背包的选择同步到战斗用的主动/被动技能列表,使其在下一场战斗生效。
    Zi.instance().reloadFromSave();
    this.removeSelf();
  }
}
