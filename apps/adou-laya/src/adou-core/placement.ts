import type { AdouSide } from "./cards";
import {
  ADOU_BOARD_COLS,
  ADOU_BOARD_ROWS,
  getAdouTile,
  isAdouBuildTileForSide,
  isAdouFarmTileForSide,
  type AdouMapDefinition,
  type AdouPoint,
  type AdouTile,
} from "./map";
import {
  type AdouMergeResult,
  type AdouPlacedUnit,
  upgradeAdouUnitWithCard,
} from "./merge";
import type { AdouCardInstance } from "./cards";

export type AdouBoardUnit = AdouPlacedUnit & {
  side: AdouSide;
  col: number;
  row: number;
  locked?: boolean;
  knockdown?: boolean;
};

export type AdouUnplacedBoardUnit = AdouPlacedUnit & {
  side: AdouSide;
  locked?: boolean;
  knockdown?: boolean;
};

export type AdouPlacementBoard = {
  map: Pick<AdouMapDefinition, "matrix">;
  tiles?: readonly AdouTile[];
  units: readonly AdouBoardUnit[];
};

export type AdouPlacementResult =
  | { ok: true; action: "place"; unit: AdouBoardUnit }
  | { ok: true; action: "move"; unit: AdouBoardUnit; from: AdouPoint }
  | { ok: true; action: "swap"; first: AdouBoardUnit; second: AdouBoardUnit }
  | { ok: true; action: "upgrade"; merge: Extract<AdouMergeResult, { ok: true }> }
  | {
      ok: false;
      reason:
        | "out-of-bounds"
        | "wrong-side"
        | "wrong-tile"
        | "occupied"
        | "locked"
        | "invalid-card";
      message: string;
    };

export function adouUnitCells(unit: Pick<AdouBoardUnit, "col" | "row" | "width">) {
  return Array.from({ length: unit.width }, (_, offset) => ({
    col: unit.col + offset,
    row: unit.row,
  }));
}

export function adouUnitOccupies(
  unit: Pick<AdouBoardUnit, "col" | "row" | "width">,
  point: AdouPoint,
) {
  return unit.row === point.row && point.col >= unit.col && point.col < unit.col + unit.width;
}

export function getAdouUnitAt(
  units: readonly AdouBoardUnit[],
  point: AdouPoint,
  ignoredIds = new Set<number>(),
) {
  return (
    units.find((unit) => !ignoredIds.has(unit.uid) && adouUnitOccupies(unit, point)) ?? null
  );
}

export function getAdouBlockingUnit(
  board: AdouPlacementBoard,
  unit: Pick<AdouBoardUnit, "uid" | "width">,
  point: AdouPoint,
  ignoredIds = new Set<number>(),
) {
  const ignored = new Set(ignoredIds);
  ignored.add(unit.uid);

  if (
    point.col < 0 ||
    point.row < 0 ||
    point.col + unit.width > ADOU_BOARD_COLS ||
    point.row >= ADOU_BOARD_ROWS
  ) {
    return null;
  }

  for (let offset = 0; offset < unit.width; offset += 1) {
    const blocker = getAdouUnitAt(board.units, { col: point.col + offset, row: point.row }, ignored);
    if (blocker) return blocker;
  }

  return null;
}

function getAdouBoardTile(
  board: Pick<AdouPlacementBoard, "map" | "tiles">,
  point: AdouPoint,
) {
  return board.tiles?.find((tile) => tile.col === point.col && tile.row === point.row) ??
    getAdouTile(board.map, point.col, point.row);
}

export function canAdouUnitStandOnTile(
  boardOrMap: Pick<AdouPlacementBoard, "map" | "tiles"> | Pick<AdouMapDefinition, "matrix">,
  unit: Pick<AdouBoardUnit, "kind" | "name" | "side">,
  point: AdouPoint,
) {
  const board = "map" in boardOrMap ? boardOrMap : { map: boardOrMap };
  const tile = getAdouBoardTile(board, point);
  if (unit.kind === "farmer") {
    return isAdouFarmTileForSide(tile, unit.side);
  }
  return isAdouBuildTileForSide(tile, unit.side);
}

export function canAdouUnitOccupy(
  board: AdouPlacementBoard,
  unit: Pick<AdouBoardUnit, "uid" | "kind" | "name" | "side" | "width">,
  point: AdouPoint,
  ignoredIds = new Set<number>(),
) {
  if (
    point.col < 0 ||
    point.row < 0 ||
    point.col + unit.width > ADOU_BOARD_COLS ||
    point.row >= ADOU_BOARD_ROWS
  ) {
    return false;
  }

  for (let offset = 0; offset < unit.width; offset += 1) {
    if (!canAdouUnitStandOnTile(board, unit, { col: point.col + offset, row: point.row })) {
      return false;
    }
  }

  return !getAdouBlockingUnit(board, unit, point, ignoredIds);
}

export function placeAdouUnit(
  board: AdouPlacementBoard,
  unit: AdouUnplacedBoardUnit,
  point: AdouPoint,
): AdouPlacementResult {
  const candidate: AdouBoardUnit = { ...unit, col: point.col, row: point.row };
  if (!canAdouUnitOccupy(board, candidate, point)) {
    const tile = getAdouBoardTile(board, point);
    if (!tile) {
      return { ok: false, reason: "out-of-bounds", message: "目标格子不在棋盘内" };
    }
    if (tile.owner !== unit.side) {
      return { ok: false, reason: "wrong-side", message: "只能放到己方区域" };
    }
    if (getAdouBlockingUnit(board, candidate, point)) {
      return { ok: false, reason: "occupied", message: "目标格子已有单位" };
    }
    return { ok: false, reason: "wrong-tile", message: "这个单位不能放到该地形" };
  }
  return { ok: true, action: "place", unit: candidate };
}

export function moveAdouUnit(
  board: AdouPlacementBoard,
  unit: AdouBoardUnit,
  point: AdouPoint,
): AdouPlacementResult {
  if (unit.locked || unit.knockdown) {
    return { ok: false, reason: "locked", message: "单位暂时无法移动" };
  }

  if (adouUnitOccupies(unit, point)) {
    return { ok: true, action: "move", unit, from: { col: unit.col, row: unit.row } };
  }

  const ignored = new Set<number>([unit.uid]);
  const blocker = getAdouBlockingUnit(board, unit, point, ignored);
  if (!blocker) {
    if (!canAdouUnitOccupy(board, unit, point, ignored)) {
      return { ok: false, reason: "wrong-tile", message: "单位不能移动到这里" };
    }
    return {
      ok: true,
      action: "move",
      unit: { ...unit, col: point.col, row: point.row },
      from: { col: unit.col, row: unit.row },
    };
  }

  if (blocker.side !== unit.side) {
    return { ok: false, reason: "occupied", message: "不能移动到敌方单位上" };
  }

  if (blocker.locked) {
    return { ok: false, reason: "locked", message: "目标单位暂时无法交互" };
  }

  const canSwap =
    unit.width === 1 &&
    blocker.width === 1 &&
    canAdouUnitOccupy(board, unit, { col: blocker.col, row: blocker.row }, new Set([unit.uid, blocker.uid])) &&
    canAdouUnitOccupy(board, blocker, { col: unit.col, row: unit.row }, new Set([unit.uid, blocker.uid]));

  if (canSwap) {
    return {
      ok: true,
      action: "swap",
      first: { ...unit, col: blocker.col, row: blocker.row },
      second: { ...blocker, col: unit.col, row: unit.row },
    };
  }

  return { ok: false, reason: "occupied", message: "这里已有单位" };
}

export function upgradeAdouBoardUnitWithCard(
  unit: AdouBoardUnit,
  card: AdouCardInstance,
): AdouPlacementResult {
  const merge = upgradeAdouUnitWithCard(unit, card);
  if (merge.ok === false) {
    return { ok: false, reason: "invalid-card", message: merge.message };
  }
  return { ok: true, action: "upgrade", merge };
}
