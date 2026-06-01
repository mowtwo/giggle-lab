"use client";

import {
  Button,
  Card,
  Checkbox,
  Cursor,
  Divider,
  Icon,
  Input,
  Switch,
  Tabs,
  type CheckboxOption,
  type TabItem,
} from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

type BlockId =
  | "intro"
  | "style"
  | "food"
  | "drink"
  | "birthday"
  | "mbti"
  | "zodiac"
  | "music"
  | "fruit"
  | "season"
  | "weather"
  | "color"
  | "portrait"
  | "role"
  | "place"
  | "animal";

type ThemeKey =
  | "ink"
  | "candy"
  | "island"
  | "sunset"
  | "lavender"
  | "midnight";
type ExportOption = "background" | "shadow";
type BlockShape = "rect" | "cells";

type BlockStyle = {
  fill: string;
  text: string;
  border: string;
  borderWidth: number;
  radius: number;
  shadow: boolean;
};

type StyleKind = "titleBlock" | "block" | "largeBlock" | "imageBlock";

type PosterTheme = {
  key: ThemeKey;
  background: string;
  accent: string;
  posterShadow: string;
  titleBlock: BlockStyle;
  block: BlockStyle;
  largeBlock: BlockStyle;
  imageBlock: BlockStyle;
};

type PosterBlock = {
  id: BlockId;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  type: "text" | "image";
  shape: BlockShape;
  cells: BlockSegment[];
  style: BlockStyle;
  image?: string;
};

type BlockSegment = { x: number; y: number; w: number; h: number };

const POSTER_SIZE = 1000;
const EXPORT_SCALE = 1;
const MIN_ZOOM = 0.3;
const INITIAL_ZOOM = 0.48;
const ZOOM_STEP = 0.16;

const THEME_KEYS: ThemeKey[] = [
  "ink",
  "candy",
  "island",
  "sunset",
  "lavender",
  "midnight",
];

const THEMES: Record<ThemeKey, PosterTheme> = {
  ink: {
    key: "ink",
    background: "#ffffff",
    accent: "#111111",
    posterShadow: "rgba(0, 0, 0, 0.06)",
    titleBlock: {
      fill: "#111111",
      text: "#ffffff",
      border: "#111111",
      borderWidth: 0,
      radius: 0,
      shadow: false,
    },
    block: {
      fill: "#ffffff",
      text: "#111111",
      border: "#111111",
      borderWidth: 2,
      radius: 4,
      shadow: false,
    },
    largeBlock: {
      fill: "#ffffff",
      text: "#111111",
      border: "#111111",
      borderWidth: 2,
      radius: 4,
      shadow: false,
    },
    imageBlock: {
      fill: "#ffffff",
      text: "#111111",
      border: "#111111",
      borderWidth: 2,
      radius: 4,
      shadow: false,
    },
  },
  candy: {
    key: "candy",
    background: "#fff7fb",
    accent: "#fc736d",
    posterShadow: "rgba(252, 115, 109, 0.18)",
    titleBlock: {
      fill: "#fc736d",
      text: "#ffffff",
      border: "#fc736d",
      borderWidth: 0,
      radius: 22,
      shadow: true,
    },
    block: {
      fill: "#fffdf2",
      text: "#794f27",
      border: "#f8a6b2",
      borderWidth: 4,
      radius: 18,
      shadow: true,
    },
    largeBlock: {
      fill: "#fff0a8",
      text: "#794f27",
      border: "#fc736d",
      borderWidth: 4,
      radius: 24,
      shadow: true,
    },
    imageBlock: {
      fill: "#ffffff",
      text: "#794f27",
      border: "#19c8b9",
      borderWidth: 4,
      radius: 24,
      shadow: true,
    },
  },
  island: {
    key: "island",
    background: "#f8f8f0",
    accent: "#19c8b9",
    posterShadow: "rgba(107, 92, 67, 0.16)",
    titleBlock: {
      fill: "#19c8b9",
      text: "#fffdf2",
      border: "#00766d",
      borderWidth: 3,
      radius: 18,
      shadow: true,
    },
    block: {
      fill: "#fffdf2",
      text: "#725d42",
      border: "#9f927d",
      borderWidth: 3,
      radius: 14,
      shadow: true,
    },
    largeBlock: {
      fill: "#f7cd67",
      text: "#794f27",
      border: "#9a835a",
      borderWidth: 3,
      radius: 18,
      shadow: true,
    },
    imageBlock: {
      fill: "#ffffff",
      text: "#794f27",
      border: "#19c8b9",
      borderWidth: 4,
      radius: 18,
      shadow: true,
    },
  },
  sunset: {
    key: "sunset",
    background: "#fff4dc",
    accent: "#e59266",
    posterShadow: "rgba(155, 91, 62, 0.2)",
    titleBlock: {
      fill: "#e59266",
      text: "#fffdf2",
      border: "#9a835a",
      borderWidth: 3,
      radius: 28,
      shadow: true,
    },
    block: {
      fill: "#fffdf2",
      text: "#633f2a",
      border: "#e18c6f",
      borderWidth: 3,
      radius: 22,
      shadow: true,
    },
    largeBlock: {
      fill: "#f7cd67",
      text: "#633f2a",
      border: "#fc736d",
      borderWidth: 4,
      radius: 28,
      shadow: true,
    },
    imageBlock: {
      fill: "#ffe1d8",
      text: "#633f2a",
      border: "#19c8b9",
      borderWidth: 4,
      radius: 30,
      shadow: true,
    },
  },
  lavender: {
    key: "lavender",
    background: "#f6f1ff",
    accent: "#8463c6",
    posterShadow: "rgba(132, 99, 198, 0.18)",
    titleBlock: {
      fill: "#8463c6",
      text: "#fffaf2",
      border: "#5b3fa1",
      borderWidth: 0,
      radius: 20,
      shadow: true,
    },
    block: {
      fill: "#ffffff",
      text: "#4e347a",
      border: "#c4b3e8",
      borderWidth: 3,
      radius: 16,
      shadow: true,
    },
    largeBlock: {
      fill: "#e9e2ff",
      text: "#3a235c",
      border: "#8463c6",
      borderWidth: 3,
      radius: 20,
      shadow: true,
    },
    imageBlock: {
      fill: "#ffffff",
      text: "#3a235c",
      border: "#8463c6",
      borderWidth: 3,
      radius: 20,
      shadow: true,
    },
  },
  midnight: {
    key: "midnight",
    background: "#111111",
    accent: "#f7cd67",
    posterShadow: "rgba(247, 205, 103, 0.14)",
    titleBlock: {
      fill: "#f7cd67",
      text: "#111111",
      border: "#f7cd67",
      borderWidth: 0,
      radius: 4,
      shadow: false,
    },
    block: {
      fill: "#1f1f1f",
      text: "#fffdf2",
      border: "#f7cd67",
      borderWidth: 2,
      radius: 6,
      shadow: false,
    },
    largeBlock: {
      fill: "#2a2a2a",
      text: "#ffffff",
      border: "#19c8b9",
      borderWidth: 3,
      radius: 10,
      shadow: false,
    },
    imageBlock: {
      fill: "#111111",
      text: "#ffffff",
      border: "#fc736d",
      borderWidth: 3,
      radius: 10,
      shadow: false,
    },
  },
};

const RANDOM_PALETTES = [
  { fill: "#fffdf2", text: "#794f27", border: "#19c8b9" },
  { fill: "#ffe1e8", text: "#633f2a", border: "#fc736d" },
  { fill: "#fff0a8", text: "#794f27", border: "#e59266" },
  { fill: "#ddf5e9", text: "#245c4f", border: "#19c8b9" },
  { fill: "#e9e2ff", text: "#4e347a", border: "#b77dee" },
  { fill: "#1f1f1f", text: "#fffdf2", border: "#f7cd67" },
];

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

type LayoutItem = Omit<PosterBlock, "text" | "style"> & {
  styleKind: StyleKind;
};

type RectSpec = {
  id: BlockId;
  fontSize: number;
  type: "text" | "image";
  cells: Array<{ col: number; row: number }>;
  styleKind: StyleKind;
};

// Heart grid: each unit cell is TILE px wide, blocks are placed at integer (col, row).
// Adjacent cells inside a multi-cell block are visually joined by connectors
// (the TILE_STEP - TILE gap between them is filled at draw time).
// 9 cols × 6 rows tile under the title and centre horizontally on the 1000px canvas.
const TILE = 86;
const TILE_STEP = 96;
const TILE_ORIGIN_X = 73;
const TILE_ORIGIN_Y = 180;

function tileX(col: number, originX: number = TILE_ORIGIN_X) {
  return originX + col * TILE_STEP;
}

function tileY(row: number, originY: number = TILE_ORIGIN_Y) {
  return originY + row * TILE_STEP;
}

function tileSpan(size: number) {
  return size * TILE + (size - 1) * (TILE_STEP - TILE);
}

function makeCells(points: Array<[number, number]>) {
  return points.map(([col, row]) => ({ col, row }));
}

function getCellBounds(
  cells: RectSpec["cells"],
  originX: number = TILE_ORIGIN_X,
  originY: number = TILE_ORIGIN_Y,
) {
  const minCol = Math.min(...cells.map((cell) => cell.col));
  const maxCol = Math.max(...cells.map((cell) => cell.col));
  const minRow = Math.min(...cells.map((cell) => cell.row));
  const maxRow = Math.max(...cells.map((cell) => cell.row));

  return {
    x: tileX(minCol, originX),
    y: tileY(minRow, originY),
    w: tileSpan(maxCol - minCol + 1),
    h: tileSpan(maxRow - minRow + 1),
    minCol,
    minRow,
  };
}

function createCellSegments(
  cells: RectSpec["cells"],
  originX: number = TILE_ORIGIN_X,
  originY: number = TILE_ORIGIN_Y,
) {
  const bounds = getCellBounds(cells, originX, originY);

  return cells.map((cell) => ({
    x: tileX(cell.col, originX) - bounds.x,
    y: tileY(cell.row, originY) - bounds.y,
    w: TILE,
    h: TILE,
  }));
}

function makeSpec(
  id: BlockId,
  cells: Array<[number, number]>,
  fontSize: number,
  type: "text" | "image",
  styleKind: StyleKind,
): RectSpec {
  return {
    id,
    fontSize,
    type,
    cells: makeCells(cells),
    styleKind,
  };
}

const BLOCK_ORDER: BlockId[] = [
  "intro",
  "style",
  "food",
  "music",
  "drink",
  "birthday",
  "zodiac",
  "fruit",
  "season",
  "portrait",
  "mbti",
  "role",
  "weather",
  "color",
  "place",
  "animal",
];

type LayoutKey = "balanced" | "mirrored" | "tall" | "compact";
const LAYOUT_KEYS: LayoutKey[] = ["balanced", "mirrored", "tall", "compact"];

// Four heart silhouettes, each a complete tiling with all 15 semantic blocks.
// Total cell count varies (25–32) so the heart looks denser or sparser.
const HEART_LAYOUTS: Record<LayoutKey, RectSpec[]> = {
  // A. Balanced (30 cells): music top-right, birthday center-left, portrait center-right.
  balanced: [
    makeSpec("style",    [[2, 0]],                                       22, "text",  "block"),
    makeSpec("food",     [[3, 0]],                                       22, "text",  "block"),
    makeSpec("music",    [[5, 0], [6, 0], [5, 1], [6, 1]],               44, "text",  "largeBlock"),
    makeSpec("drink",    [[1, 1], [1, 2]],                               20, "text",  "block"),
    makeSpec("birthday", [[2, 1], [3, 1], [2, 2], [3, 2]],               56, "text",  "largeBlock"),
    makeSpec("zodiac",   [[4, 1]],                                       20, "text",  "block"),
    makeSpec("weather",  [[7, 1]],                                       20, "text",  "block"),
    makeSpec("fruit",    [[8, 1], [8, 2]],                               18, "text",  "block"),
    makeSpec("season",   [[4, 2]],                                       18, "text",  "block"),
    makeSpec("portrait", [[5, 2], [6, 2], [5, 3], [6, 3]],               44, "image", "imageBlock"),
    makeSpec("role",     [[7, 2], [7, 3]],                               18, "text",  "block"),
    makeSpec("mbti",     [[2, 3]],                                       24, "text",  "block"),
    makeSpec("color",    [[3, 3], [4, 3], [3, 4], [4, 4]],               44, "text",  "largeBlock"),
    makeSpec("place",    [[5, 4]],                                       20, "text",  "block"),
    makeSpec("animal",   [[4, 5]],                                       18, "text",  "block"),
  ],
  // B. Mirrored (30 cells): music top-left, birthday center-right, portrait center-left.
  mirrored: [
    makeSpec("music",    [[2, 0], [3, 0], [2, 1], [3, 1]],               44, "text",  "largeBlock"),
    makeSpec("style",    [[5, 0]],                                       22, "text",  "block"),
    makeSpec("food",     [[6, 0]],                                       22, "text",  "block"),
    makeSpec("drink",    [[1, 1], [1, 2]],                               20, "text",  "block"),
    makeSpec("zodiac",   [[4, 1]],                                       20, "text",  "block"),
    makeSpec("birthday", [[5, 1], [6, 1], [5, 2], [6, 2]],               56, "text",  "largeBlock"),
    makeSpec("weather",  [[7, 1]],                                       20, "text",  "block"),
    makeSpec("fruit",    [[8, 1], [8, 2]],                               18, "text",  "block"),
    makeSpec("portrait", [[2, 2], [3, 2], [2, 3], [3, 3]],               44, "image", "imageBlock"),
    makeSpec("season",   [[4, 2]],                                       18, "text",  "block"),
    makeSpec("role",     [[7, 2], [7, 3]],                               18, "text",  "block"),
    makeSpec("color",    [[4, 3], [5, 3], [4, 4], [5, 4]],               44, "text",  "largeBlock"),
    makeSpec("mbti",     [[6, 3]],                                       24, "text",  "block"),
    makeSpec("place",    [[3, 4]],                                       20, "text",  "block"),
    makeSpec("animal",   [[4, 5]],                                       18, "text",  "block"),
  ],
  // C. Tall (32 cells): birthday is 2×3 and drink/fruit are 1×3, elongating the heart body.
  //
  //   Col:   0  1  2  3  4  5  6  7  8
  //   Row 0:       X  X        X  X
  //   Row 1:    X  X  X  X  X  X  X  X
  //   Row 2:    X  X  X  X  X  X  X  X
  //   Row 3:    X  X  X  X  X  X  X  X
  //   Row 4:       X  X  X
  //   Row 5:          X
  tall: [
    makeSpec("style",    [[2, 0]],                                       22, "text",  "block"),
    makeSpec("food",     [[3, 0]],                                       22, "text",  "block"),
    makeSpec("music",    [[5, 0], [6, 0], [5, 1], [6, 1]],               44, "text",  "largeBlock"),
    makeSpec("drink",    [[1, 1], [1, 2], [1, 3]],                       18, "text",  "block"),
    makeSpec("birthday", [[2, 1], [3, 1], [2, 2], [3, 2], [2, 3], [3, 3]], 56, "text", "largeBlock"),
    makeSpec("zodiac",   [[4, 1]],                                       20, "text",  "block"),
    makeSpec("weather",  [[7, 1]],                                       20, "text",  "block"),
    makeSpec("fruit",    [[8, 1], [8, 2], [8, 3]],                       18, "text",  "block"),
    makeSpec("season",   [[4, 2]],                                       18, "text",  "block"),
    makeSpec("portrait", [[5, 2], [6, 2], [5, 3], [6, 3]],               44, "image", "imageBlock"),
    makeSpec("role",     [[7, 2], [7, 3]],                               18, "text",  "block"),
    makeSpec("mbti",     [[4, 3]],                                       24, "text",  "block"),
    makeSpec("color",    [[3, 4], [4, 4]],                               24, "text",  "block"),
    makeSpec("place",    [[2, 4]],                                       18, "text",  "block"),
    makeSpec("animal",   [[4, 5]],                                       18, "text",  "block"),
  ],
  // D. Compact (25 cells): smaller heart in the centre. Portrait + color shrink to 2×1.
  //
  //   Col:   0  1  2  3  4  5  6  7  8
  //   Row 0:       X  X        X  X
  //   Row 1:    X  X  X  X  X  X  X
  //   Row 2:    X  X  X  X  X  X  X
  //   Row 3:       X  X  X  X  X
  //   Row 4:          X  X
  compact: [
    makeSpec("style",    [[2, 0]],                                       22, "text",  "block"),
    makeSpec("food",     [[3, 0]],                                       22, "text",  "block"),
    makeSpec("music",    [[5, 0], [6, 0], [5, 1], [6, 1]],               44, "text",  "largeBlock"),
    makeSpec("drink",    [[1, 1], [1, 2]],                               20, "text",  "block"),
    makeSpec("birthday", [[2, 1], [3, 1], [2, 2], [3, 2]],               56, "text",  "largeBlock"),
    makeSpec("zodiac",   [[4, 1]],                                       20, "text",  "block"),
    makeSpec("fruit",    [[7, 1], [7, 2]],                               18, "text",  "block"),
    makeSpec("season",   [[4, 2]],                                       18, "text",  "block"),
    makeSpec("portrait", [[5, 2], [6, 2]],                               24, "image", "imageBlock"),
    makeSpec("mbti",     [[2, 3]],                                       24, "text",  "block"),
    makeSpec("color",    [[3, 3], [4, 3]],                               24, "text",  "block"),
    makeSpec("weather",  [[5, 3]],                                       18, "text",  "block"),
    makeSpec("role",     [[6, 3]],                                       18, "text",  "block"),
    makeSpec("place",    [[3, 4]],                                       18, "text",  "block"),
    makeSpec("animal",   [[4, 4]],                                       18, "text",  "block"),
  ],
};

function cloneStyle(style: BlockStyle): BlockStyle {
  return { ...style };
}

function specToLayoutItem(
  spec: RectSpec,
  originX: number,
  originY: number,
): LayoutItem {
  const bounds = getCellBounds(spec.cells, originX, originY);
  return {
    id: spec.id,
    x: bounds.x,
    y: bounds.y,
    w: bounds.w,
    h: bounds.h,
    fontSize: spec.fontSize,
    type: spec.type,
    shape: spec.cells.length === 1 ? "rect" : "cells",
    cells: createCellSegments(spec.cells, originX, originY),
    styleKind: spec.styleKind,
  };
}

const TITLE_W = 320;
const TITLE_H = 110;
const TITLE_GAP = 30;

function createHeartLayout(layoutKey: LayoutKey = "balanced"): LayoutItem[] {
  const specs = HEART_LAYOUTS[layoutKey];
  const cellRows = specs.flatMap((spec) => spec.cells.map((c) => c.row));
  const minRow = Math.min(...cellRows);
  const maxRow = Math.max(...cellRows);
  const rowSpan = maxRow - minRow + 1;
  const heartHeight = rowSpan * TILE + (rowSpan - 1) * (TILE_STEP - TILE);

  // Vertically centre title + gap + heart on the poster.
  const totalStackH = TITLE_H + TITLE_GAP + heartHeight;
  const titleY = Math.round((POSTER_SIZE - totalStackH) / 2);
  const heartOriginY = titleY + TITLE_H + TITLE_GAP - minRow * TILE_STEP;

  const title: LayoutItem = {
    id: "intro",
    x: Math.round((POSTER_SIZE - TITLE_W) / 2),
    y: titleY,
    w: TITLE_W,
    h: TITLE_H,
    fontSize: 56,
    type: "text",
    shape: "rect",
    cells: [{ x: 0, y: 0, w: TITLE_W, h: TITLE_H }],
    styleKind: "titleBlock",
  };
  const placed = specs.map((spec) =>
    specToLayoutItem(spec, TILE_ORIGIN_X, heartOriginY),
  );
  return [title, ...placed].sort(
    (a, b) => BLOCK_ORDER.indexOf(a.id) - BLOCK_ORDER.indexOf(b.id),
  );
}

function getLayoutItem(layout: LayoutItem[], id: BlockId) {
  return layout.find((item) => item.id === id) ?? layout[0];
}

function getTextLines(text: string) {
  return text.split("\n").filter((line) => line.length > 0);
}

function getShapeTextArea(shape: BlockShape) {
  return shape === "cells"
    ? { x: 0.04, y: 0.04, w: 0.92, h: 0.92 }
    : { x: 0, y: 0, w: 1, h: 1 };
}

function getBlockFillSegments(block: Pick<PosterBlock, "cells" | "shape">) {
  if (block.shape === "rect") {
    return block.cells;
  }

  const connectors: BlockSegment[] = [];
  const gap = TILE_STEP - TILE;

  block.cells.forEach((cell) => {
    const hasRight = block.cells.some(
      (other) => other.x === cell.x + TILE_STEP && other.y === cell.y,
    );
    const hasDown = block.cells.some(
      (other) => other.y === cell.y + TILE_STEP && other.x === cell.x,
    );
    const hasDiagonal = block.cells.some(
      (other) => other.x === cell.x + TILE_STEP && other.y === cell.y + TILE_STEP,
    );

    if (hasRight) {
      connectors.push({ x: cell.x + TILE, y: cell.y, w: gap, h: TILE });
    }
    if (hasDown) {
      connectors.push({ x: cell.x, y: cell.y + TILE, w: TILE, h: gap });
    }
    if (hasRight && hasDown && hasDiagonal) {
      connectors.push({ x: cell.x + TILE, y: cell.y + TILE, w: gap, h: gap });
    }
  });

  return [...block.cells, ...connectors];
}

function getMergedBounds(block: Pick<PosterBlock, "cells" | "shape">) {
  const segments = getBlockFillSegments({ ...block, shape: "cells" });
  const minX = Math.min(...segments.map((segment) => segment.x));
  const minY = Math.min(...segments.map((segment) => segment.y));
  const maxX = Math.max(...segments.map((segment) => segment.x + segment.w));
  const maxY = Math.max(...segments.map((segment) => segment.y + segment.h));

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function getPreviewFontSize(block: PosterBlock) {
  const lines = getTextLines(block.text);
  const textArea = getShapeTextArea(block.shape);
  // px-3 = 12px each side, plus an extra safety margin so multi-byte glyphs
  // don't graze the rounded inner border.
  const PAD_X = 32;
  const PAD_Y = 22;
  const textWidth = Math.max(block.w * textArea.w - PAD_X, 16);
  const textHeight = Math.max(block.h * textArea.h - PAD_Y, 16);
  const longestLine = Math.max(...lines.map((line) => line.length), 1);
  // Chinese glyphs render slightly wider than 1em; divide a bit more.
  const widthSize = textWidth / (longestLine + 0.15);
  // Line height ≈ 1.18 with breathing room.
  const heightSize = textHeight / Math.max(lines.length, 1) / 1.22;
  const minSize = block.w > 150 || block.h > 150 ? 18 : 12;
  return Math.max(minSize, Math.min(block.fontSize, widthSize, heightSize));
}

function getExportFontSize(context: CanvasRenderingContext2D, block: PosterBlock) {
  let fontSize = getPreviewFontSize(block);
  const textArea = getShapeTextArea(block.shape);
  const maxWidth = block.w * textArea.w - 22;
  const maxHeight = block.h * textArea.h - 18;
  const lines = getTextLines(block.text);

  while (fontSize > 12) {
    context.font = `900 ${fontSize}px "Noto Sans SC", sans-serif`;
    const widest = Math.max(
      ...lines.map((line) => context.measureText(line).width),
      1,
    );
    const totalHeight = lines.length * fontSize * 1.12;

    if (widest <= maxWidth && totalHeight <= maxHeight) {
      return fontSize;
    }

    fontSize -= 1;
  }

  return fontSize;
}

function createBlocks(
  t: ReturnType<typeof useTranslations>,
  theme: PosterTheme,
  layoutKey: LayoutKey = "balanced",
  layout = createHeartLayout(layoutKey),
): PosterBlock[] {
  return layout.map((block) => ({
    id: block.id,
    x: block.x,
    y: block.y,
    w: block.w,
    h: block.h,
    fontSize: block.fontSize,
    type: block.type,
    shape: block.shape,
    cells: block.cells,
    style: cloneStyle(theme[block.styleKind] as BlockStyle),
    text:
      block.id === "intro"
        ? t("eyebrow")
        : t(`defaultBlocks.${block.id}`),
  }));
}

function updateBlock(
  blocks: PosterBlock[],
  id: BlockId,
  update: Partial<PosterBlock>,
) {
  return blocks.map((block) =>
    block.id === id ? { ...block, ...update } : block,
  );
}

function updateBlockStyle(
  blocks: PosterBlock[],
  id: BlockId,
  update: Partial<BlockStyle>,
) {
  return blocks.map((block) =>
    block.id === id
      ? { ...block, style: { ...block.style, ...update } }
      : block,
  );
}

function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawBlockShape(
  context: CanvasRenderingContext2D,
  block: PosterBlock,
  style: BlockStyle,
) {
  const segments = getBlockFillSegments(block);
  const bounds = getMergedBounds(block);
  const ox = block.x + bounds.x;
  const oy = block.y + bounds.y;

  context.save();
  context.beginPath();
  segments.forEach((segment) => {
    context.rect(block.x + segment.x, block.y + segment.y, segment.w, segment.h);
  });
  context.clip();

  if (style.borderWidth > 0) {
    drawRoundRect(context, ox, oy, bounds.w, bounds.h, style.radius);
    context.fillStyle = style.border;
    context.fill();

    const innerRadius = Math.max(style.radius - style.borderWidth, 0);
    drawRoundRect(
      context,
      ox + style.borderWidth,
      oy + style.borderWidth,
      bounds.w - 2 * style.borderWidth,
      bounds.h - 2 * style.borderWidth,
      innerRadius,
    );
    context.fillStyle = style.fill;
    context.fill();
  } else {
    drawRoundRect(context, ox, oy, bounds.w, bounds.h, style.radius);
    context.fillStyle = style.fill;
    context.fill();
  }

  context.restore();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = text.split("\n").flatMap((rawLine) => {
    const useWords = rawLine.includes(" ");
    const words = useWords ? rawLine.split(" ") : rawLine.split("");
    const wrapped: string[] = [];
    let line = "";

    words.forEach((word) => {
      const joiner = useWords && line ? " " : "";
      const testLine = `${line}${joiner}${word}`;
      if (context.measureText(testLine).width > maxWidth && line) {
        wrapped.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    wrapped.push(line);
    return wrapped;
  });
  const totalHeight = (lines.length - 1) * lineHeight;

  lines.forEach((line, index) => {
    context.fillText(line, x, y - totalHeight / 2 + index * lineHeight);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function exportPoster(
  blocks: PosterBlock[],
  theme: PosterTheme,
  options: ExportOption[],
) {
  const canvas = document.createElement("canvas");
  const size = POSTER_SIZE * EXPORT_SCALE;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.scale(EXPORT_SCALE, EXPORT_SCALE);
  if (options.includes("background")) {
    context.fillStyle = theme.background;
    context.fillRect(0, 0, POSTER_SIZE, POSTER_SIZE);
  } else {
    context.clearRect(0, 0, POSTER_SIZE, POSTER_SIZE);
  }

  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const block of blocks) {
    const { style } = block;
    context.save();
    if (options.includes("shadow") && style.shadow) {
      context.shadowColor = theme.posterShadow;
      context.shadowBlur = 18;
      context.shadowOffsetX = 8;
      context.shadowOffsetY = 10;
    }

    drawBlockShape(context, block, style);

    context.shadowColor = "transparent";

    if (block.type === "image" && block.image) {
      try {
        const image = await loadImage(block.image);
        const ratio = Math.max(block.w / image.width, block.h / image.height);
        const width = image.width * ratio;
        const height = image.height * ratio;
        drawRoundRect(context, block.x, block.y, block.w, block.h, style.radius);
        context.clip();
        context.drawImage(
          image,
          block.x + (block.w - width) / 2,
          block.y + (block.h - height) / 2,
          width,
          height,
        );
      } catch {
        const textArea = getShapeTextArea(block.shape);
        context.fillStyle = style.text;
        const fontSize = getExportFontSize(context, block);
        context.font = `900 ${fontSize}px "Noto Sans SC", sans-serif`;
        drawWrappedText(
          context,
          block.text,
          block.x + (textArea.x + textArea.w / 2) * block.w,
          block.y + (textArea.y + textArea.h / 2) * block.h,
          block.w * textArea.w - 24,
          fontSize * 1.12,
        );
      }
    } else {
      const textArea = getShapeTextArea(block.shape);
      context.fillStyle = style.text;
      const fontSize = getExportFontSize(context, block);
      context.font = `900 ${fontSize}px "Noto Sans SC", sans-serif`;
      drawWrappedText(
        context,
        block.text,
        block.x + (textArea.x + textArea.w / 2) * block.w,
        block.y + (textArea.y + textArea.h / 2) * block.h,
        block.w * textArea.w - 24,
        fontSize * 1.12,
      );
    }

    context.restore();
  }

  const link = document.createElement("a");
  link.download = "heart-block-card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#725d42]">
      {label}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          className="h-11 w-14 rounded-xl border-2 border-[#9f927d] bg-[#fffdf2] p-1"
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function ChoiceGrid<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: Array<{ key: TValue; label: string }>;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-black text-[#725d42]">
      <p>{label}</p>
      <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-2xl bg-[#fffdf2] p-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={[
              "min-h-10 rounded-xl border-2 px-3 py-2 text-left text-sm font-black transition",
              option.key === value
                ? "border-[#19c8b9] bg-[#e6f9f6] text-[#00766d]"
                : "border-[#e8dcc8] bg-white text-[#725d42] hover:border-[#f7cd67]",
            ].join(" ")}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HeartCardEditor() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const tHeart = useTranslations("HeartCard");
  const [themeKey, setThemeKey] = useState<ThemeKey>("island");
  const [layoutKey, setLayoutKey] = useState<LayoutKey>("balanced");
  const theme = THEMES[themeKey];
  const defaultBlocks = useMemo(
    () => createBlocks(tHeart, theme, layoutKey),
    [tHeart, theme, layoutKey],
  );
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [selectedId, setSelectedId] = useState<BlockId>("birthday");
  const [activeTab, setActiveTab] = useState("content");
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    "background",
    "shadow",
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedBlock =
    blocks.find((block) => block.id === selectedId) ?? blocks[0];
  const blockOptions = blocks.map((block) => ({
    key: block.id,
    label: tHeart(`blockLabels.${block.id}`),
  }));
  const themeOptions = THEME_KEYS.map(
    (key) => ({
      key,
      label: tHeart(`themes.${key}`),
    }),
  );
  const exportOptionItems: CheckboxOption[] = [
    { value: "background", label: tHeart("exportBackground") },
    { value: "shadow", label: tHeart("exportShadow") },
  ];

  function applyTheme(nextThemeKey: string) {
    const nextTheme = THEMES[nextThemeKey as ThemeKey] ?? THEMES.island;
    const layout = createHeartLayout(layoutKey);
    setThemeKey(nextTheme.key);
    setBlocks((current) =>
      current.map((block) => {
        const item = getLayoutItem(layout, block.id);
        const styleKind = item?.styleKind ?? "block";
        return {
          ...block,
          style: cloneStyle(nextTheme[styleKind] as BlockStyle),
        };
      }),
    );
  }

  function applyLayoutChange(nextLayoutKey: string) {
    const key = (LAYOUT_KEYS as readonly string[]).includes(nextLayoutKey)
      ? (nextLayoutKey as LayoutKey)
      : "balanced";
    const nextLayout = createHeartLayout(key);
    setLayoutKey(key);
    setBlocks((current) =>
      current.map((block) => {
        const item = getLayoutItem(nextLayout, block.id);
        if (!item) {
          return block;
        }
        return {
          ...block,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          fontSize: item.fontSize,
          type: block.image ? "image" : item.type,
          shape: item.shape,
          cells: item.cells,
        };
      }),
    );
  }

  function randomizeConfiguration() {
    const nextThemeKey = pickRandom(THEME_KEYS);
    const nextTheme = THEMES[nextThemeKey];
    const layout = createHeartLayout(layoutKey);

    setThemeKey(nextThemeKey);
    setBlocks((current) =>
      current.map((block) => {
        const item = getLayoutItem(layout, block.id);
        const baseStyle = cloneStyle(nextTheme[item.styleKind] as BlockStyle);
        const palette = pickRandom(RANDOM_PALETTES);
        const shouldUsePalette = block.id !== "intro" && Math.random() > 0.24;

        return {
          ...block,
          style: {
            ...baseStyle,
            ...(shouldUsePalette ? palette : {}),
            borderWidth:
              block.id === "intro"
                ? baseStyle.borderWidth
                : pickRandom([2, 3, 4, 5]),
            radius:
              block.id === "intro"
                ? pickRandom([18, 22, 28])
                : pickRandom([8, 14, 18, 24, 30]),
            shadow: Math.random() > 0.2,
          },
        };
      }),
    );
  }

  function handleImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const image = reader.result;
        setBlocks((current) =>
          updateBlock(current, selectedId, {
            image,
            type: "image",
          }),
        );
      }
    };
    reader.readAsDataURL(file);
  }

  const contentPanel = (
    <div className="space-y-4">
      <ChoiceGrid
        label={tHeart("blockLabel")}
        value={selectedId}
        options={blockOptions}
        onChange={setSelectedId}
      />

      <label className="grid gap-2 text-sm font-black text-[#725d42]">
        {tHeart("contentLabel")}
        <textarea
          className="min-h-28 resize-none rounded-2xl border-2 border-[#9f927d] bg-[#fffdf2] p-4 text-lg font-black leading-7 text-[#111] shadow-[0_4px_0_#d4c9b4] outline-none focus:border-[#19c8b9]"
          value={selectedBlock.text}
          onChange={(event) =>
            setBlocks((current) =>
              updateBlock(current, selectedId, {
                text: event.target.value,
              }),
            )
          }
        />
      </label>

      <label className="grid gap-2 text-sm font-black text-[#725d42]">
        {tHeart("sizeLabel")}
        <Input
          type="number"
          min={16}
          max={100}
          value={selectedBlock.fontSize}
          onChange={(event) =>
            setBlocks((current) =>
              updateBlock(current, selectedId, {
                fontSize: Number(event.target.value),
              }),
            )
          }
        />
      </label>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffdf2] p-3">
        <span className="text-sm font-black text-[#725d42]">
          {tHeart("imageMode")}
        </span>
        <Switch
          checked={selectedBlock.type === "image"}
          checkedChildren={tHeart("on")}
          unCheckedChildren={tHeart("off")}
          onChange={(checked) =>
            setBlocks((current) =>
              updateBlock(current, selectedId, {
                type: checked ? "image" : "text",
              }),
            )
          }
        />
      </div>

      {selectedBlock.type === "image" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleImageUpload(event.currentTarget.files?.[0])
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="default"
              block
              onClick={() => fileInputRef.current?.click()}
            >
              {tHeart("uploadImage")}
            </Button>
            <Button
              type="dashed"
              block
              onClick={() =>
                setBlocks((current) =>
                  updateBlock(current, selectedId, { image: undefined }),
                )
              }
            >
              {tHeart("removeImage")}
            </Button>
          </div>
          {!selectedBlock.image && (
            <p className="text-sm font-bold text-[#8a7b66]">
              {tHeart("emptyImage")}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const layoutOptions = LAYOUT_KEYS.map((key) => ({
    key,
    label: tHeart(`layouts.${key}`),
  }));

  const stylePanel = (
    <div className="space-y-4">
      <ChoiceGrid
        label={tHeart("layoutLabel")}
        value={layoutKey}
        options={layoutOptions}
        onChange={applyLayoutChange}
      />

      <ChoiceGrid
        label={tHeart("themeLabel")}
        value={themeKey}
        options={themeOptions}
        onChange={applyTheme}
      />

      <ColorField
        label={tHeart("fillLabel")}
        value={selectedBlock.style.fill}
        onChange={(fill) =>
          setBlocks((current) =>
            updateBlockStyle(current, selectedId, { fill }),
          )
        }
      />
      <ColorField
        label={tHeart("textColorLabel")}
        value={selectedBlock.style.text}
        onChange={(text) =>
          setBlocks((current) =>
            updateBlockStyle(current, selectedId, { text }),
          )
        }
      />
      <ColorField
        label={tHeart("borderColorLabel")}
        value={selectedBlock.style.border}
        onChange={(border) =>
          setBlocks((current) =>
            updateBlockStyle(current, selectedId, { border }),
          )
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-sm font-black text-[#725d42]">
          {tHeart("borderWidthLabel")}
          <Input
            type="number"
            min={0}
            max={12}
            value={selectedBlock.style.borderWidth}
            onChange={(event) =>
              setBlocks((current) =>
                updateBlockStyle(current, selectedId, {
                  borderWidth: Number(event.target.value),
                }),
              )
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-[#725d42]">
          {tHeart("radiusLabel")}
          <Input
            type="number"
            min={0}
            max={40}
            value={selectedBlock.style.radius}
            onChange={(event) =>
              setBlocks((current) =>
                updateBlockStyle(current, selectedId, {
                  radius: Number(event.target.value),
                }),
              )
            }
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffdf2] p-3">
        <span className="text-sm font-black text-[#725d42]">
          {tHeart("blockShadow")}
        </span>
        <Switch
          checked={selectedBlock.style.shadow}
          checkedChildren={tHeart("on")}
          unCheckedChildren={tHeart("off")}
          onChange={(shadow) =>
            setBlocks((current) =>
              updateBlockStyle(current, selectedId, { shadow }),
            )
          }
        />
      </div>
    </div>
  );

  const exportPanel = (
    <div className="space-y-4">
      <Checkbox
        value={exportOptions}
        options={exportOptionItems}
        direction="vertical"
        onChange={(values) => setExportOptions(values as ExportOption[])}
      />
      <Button
        type="primary"
        block
        onClick={() => void exportPoster(blocks, theme, exportOptions)}
      >
        {tHeart("download")}
      </Button>
      <Button
        type="dashed"
        block
        onClick={randomizeConfiguration}
      >
        {tHeart("randomize")}
      </Button>
      <Button
        type="default"
        block
        onClick={() => {
          setThemeKey("island");
          setLayoutKey("balanced");
          setBlocks(createBlocks(tHeart, THEMES.island, "balanced"));
          setSelectedId("birthday");
        }}
      >
        {tHeart("reset")}
      </Button>
    </div>
  );

  const tabs: TabItem[] = [
    { key: "content", label: tHeart("contentTab"), children: contentPanel },
    { key: "style", label: tHeart("styleTab"), children: stylePanel },
    { key: "export", label: tHeart("exportTab"), children: exportPanel },
  ];

  return (
    <Cursor>
      <main className="flex h-svh min-h-[720px] flex-col overflow-hidden px-4 py-4">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button type="default" onClick={() => navigate("/")}>
              {tCommon("backToShelf")}
            </Button>
            <div className="hidden sm:block">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#19c8b9]">
                {tHeart("eyebrow")}
              </p>
              <h1 className="text-2xl font-black leading-none text-[#794f27]">
                {tHeart("title")}
              </h1>
            </div>
          </div>
          <LocaleSwitch />
        </div>

        <section className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card color="app-pink" className="flex min-h-0 flex-col p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Icon name="icon-camera" size={38} bounce />
                <div>
                  <p className="text-xl font-black text-[#794f27]">
                    {tHeart("canvasLabel")}
                  </p>
                  <p className="hidden text-sm font-bold text-[#725d42] md:block">
                    {tHeart("description")}
                  </p>
                </div>
              </div>
              <Button
                type="primary"
                onClick={() => void exportPoster(blocks, theme, exportOptions)}
              >
                {tHeart("download")}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#fffdf2] p-3 shadow-[inset_0_0_0_2px_rgba(159,146,125,0.45)]">
              <TransformWrapper
                initialScale={INITIAL_ZOOM}
                minScale={MIN_ZOOM}
                maxScale={2.8}
                centerOnInit
                smooth={false}
                wheel={{
                  step: 0.06,
                  touchPadDisabled: false,
                }}
                pinch={{
                  step: 0.08,
                }}
                velocityAnimation={{
                  disabled: true,
                }}
                onTransform={(ref, state) => {
                  if (state.scale < MIN_ZOOM) {
                    ref.setTransform(
                      state.positionX,
                      state.positionY,
                      MIN_ZOOM,
                      0,
                    );
                  }
                }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <div className="relative h-full min-h-0">
                    <div className="absolute right-3 top-3 z-20 flex gap-2">
                      <Button
                        type="default"
                        onClick={() => zoomOut(ZOOM_STEP, 120)}
                      >
                        -
                      </Button>
                      <Button
                        type="default"
                        onClick={() => resetTransform(120)}
                      >
                        {tHeart("fitView")}
                      </Button>
                      <Button
                        type="default"
                        onClick={() => zoomIn(ZOOM_STEP, 120)}
                      >
                        +
                      </Button>
                    </div>
                    <TransformComponent
                      wrapperStyle={{
                        width: "100%",
                        height: "100%",
                      }}
                      contentStyle={{
                        width: POSTER_SIZE,
                        height: POSTER_SIZE,
                      }}
                    >
                      <div
                        className="relative bg-white [container-type:size]"
                        style={{
                          width: POSTER_SIZE,
                          height: POSTER_SIZE,
                          background: theme.background,
                          boxShadow: `0 18px 40px ${theme.posterShadow}`,
                        }}
                      >
                        {blocks.map((block) => (
                          <button
	                            key={block.id}
	                            type="button"
	                            className={[
	                              "absolute grid place-items-center overflow-visible whitespace-pre-line text-center font-black leading-[1.08] transition",
	                              selectedId === block.id
	                                ? "outline outline-5 outline-[#19c8b9]"
	                                : "hover:outline hover:outline-5 hover:outline-[#f7cd67]",
	                            ].join(" ")}
	                            style={{
                              left: `${(block.x / POSTER_SIZE) * 100}%`,
                              top: `${(block.y / POSTER_SIZE) * 100}%`,
	                              width: `${(block.w / POSTER_SIZE) * 100}%`,
	                              height: `${(block.h / POSTER_SIZE) * 100}%`,
	                              color: block.style.text,
	                              fontSize: `${getPreviewFontSize(block)}px`,
	                            }}
	                            onClick={() => setSelectedId(block.id)}
	                          >
	                            <svg
	                              className="absolute inset-0 h-full w-full overflow-visible"
	                              viewBox={`0 0 ${block.w} ${block.h}`}
	                              aria-hidden="true"
	                            >
	                              <defs>
	                                <clipPath id={`clip-${block.id}`}>
	                                  {getBlockFillSegments(block).map((segment, index) => (
	                                    <rect
	                                      key={index}
	                                      x={segment.x}
	                                      y={segment.y}
	                                      width={segment.w}
	                                      height={segment.h}
	                                    />
	                                  ))}
	                                </clipPath>
	                              </defs>
	                              <g
	                                clipPath={`url(#clip-${block.id})`}
	                                filter={
	                                  block.style.shadow
	                                    ? "drop-shadow(8px 10px 0 rgba(107, 92, 67, 0.16))"
	                                    : undefined
	                                }
	                              >
	                                {block.style.borderWidth > 0 ? (
	                                  <>
	                                    <rect
	                                      x={0}
	                                      y={0}
	                                      width={block.w}
	                                      height={block.h}
	                                      rx={block.style.radius}
	                                      fill={block.style.border}
	                                    />
	                                    <rect
	                                      x={block.style.borderWidth}
	                                      y={block.style.borderWidth}
	                                      width={block.w - 2 * block.style.borderWidth}
	                                      height={block.h - 2 * block.style.borderWidth}
	                                      rx={Math.max(block.style.radius - block.style.borderWidth, 0)}
	                                      fill={block.style.fill}
	                                    />
	                                  </>
	                                ) : (
	                                  <rect
	                                    x={0}
	                                    y={0}
	                                    width={block.w}
	                                    height={block.h}
	                                    rx={block.style.radius}
	                                    fill={block.style.fill}
	                                  />
	                                )}
	                              </g>
	                            </svg>
	                            {block.type === "image" && block.image ? (
	                              // eslint-disable-next-line @next/next/no-img-element
	                              <img
	                                src={block.image}
	                                alt=""
	                                className="absolute inset-0 h-full w-full object-cover"
	                                style={{ borderRadius: block.style.radius }}
	                              />
	                            ) : (
	                              <span
	                                className="absolute z-10 grid place-items-center px-3"
	                                style={{
	                                  left: `${getShapeTextArea(block.shape).x * 100}%`,
	                                  top: `${getShapeTextArea(block.shape).y * 100}%`,
	                                  width: `${getShapeTextArea(block.shape).w * 100}%`,
	                                  height: `${getShapeTextArea(block.shape).h * 100}%`,
	                                }}
	                              >
	                                {block.text}
	                              </span>
	                            )}
	                          </button>
                        ))}
                      </div>
                    </TransformComponent>
                  </div>
                )}
              </TransformWrapper>
            </div>
          </Card>

          <Card
            type="default"
            color="app-yellow"
            className="flex min-h-0 flex-col p-5"
          >
            <div className="mb-4">
              <p className="text-sm font-black text-[#00766d]">
                {tHeart("editorTitle")}
              </p>
              <h2 className="mt-1 whitespace-pre-line text-2xl font-black leading-tight text-[#794f27]">
                {selectedBlock.text}
              </h2>
            </div>
            <Divider type="wave-yellow" />
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <Tabs
                activeKey={activeTab}
                items={tabs}
                shadow={false}
                leafAnimation
                onChange={setActiveTab}
              />
            </div>
          </Card>
        </section>
      </main>
    </Cursor>
  );
}
