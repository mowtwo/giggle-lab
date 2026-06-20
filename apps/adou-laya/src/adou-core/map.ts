import type { AdouSide } from "./cards";

export type AdouMapId = "changban" | "jingzhou" | "hulao" | "chibi";
export type AdouCellKind = "plot" | "road" | "grass" | "blocked";
export type AdouRawTile = "0_0" | "0_1" | "1_0" | "1_1" | "2_0" | "2_1";

export type AdouPoint = {
  col: number;
  row: number;
};

export type AdouTile = AdouPoint & {
  kind: AdouCellKind;
  owner: AdouSide;
  tone: number;
};

export type AdouMapPalette = {
  paper: number;
  plot: number;
  road: number;
  grass: number;
  blocked: number;
  player: number;
  ai: number;
};

export type AdouMapDefinition = {
  id: AdouMapId;
  name: string;
  subtitle: string;
  palette: AdouMapPalette;
  matrix: readonly (readonly AdouRawTile[])[];
  routes: Record<AdouSide, readonly AdouPoint[]>;
};

type RawAdouMapDefinition = Omit<AdouMapDefinition, "routes"> & {
  playerStart: AdouPoint;
  playerEnd: AdouPoint;
  aiStart: AdouPoint;
  aiEnd: AdouPoint;
};

export const ADOU_BOARD_COLS = 8;
export const ADOU_BOARD_ROWS = 10;

const RAW_ADOU_MAPS: readonly RawAdouMapDefinition[] = [
  {
    id: "changban",
    name: "长坂坡",
    subtitle: "乱军阵式",
    palette: {
      paper: 0xf1dfbf,
      plot: 0xe8d2a8,
      road: 0xb78c62,
      grass: 0xc3c38d,
      blocked: 0x6e6259,
      player: 0x2f74c0,
      ai: 0xb64b3d,
    },
    matrix: [
      ["0_1", "0_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0"],
      ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_0", "0_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
      ["0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "0_0", "0_0"],
    ],
    playerStart: { col: 0, row: 8 },
    playerEnd: { col: 7, row: 9 },
    aiStart: { col: 7, row: 1 },
    aiEnd: { col: 0, row: 0 },
  },
  {
    id: "jingzhou",
    name: "荆州渡",
    subtitle: "水岸阵式",
    palette: {
      paper: 0xe7dec3,
      plot: 0xd6c497,
      road: 0xa38364,
      grass: 0x9ea666,
      blocked: 0x75685c,
      player: 0x2f766c,
      ai: 0xa4523a,
    },
    matrix: [
      ["0_1", "0_1", "0_1", "0_1", "0_1", "2_0", "0_0", "0_0", "0_0", "0_0"],
      ["2_1", "2_1", "2_1", "2_1", "0_1", "2_0", "0_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "2_1", "0_1", "2_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "0_1", "2_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "2_1", "0_0", "0_0", "1_0", "1_0", "2_0"],
      ["2_1", "1_1", "1_1", "0_1", "2_1", "0_0", "2_0", "2_0", "2_0", "2_0"],
      ["2_1", "2_1", "2_1", "0_1", "2_1", "0_0", "2_0", "2_0", "2_0", "2_0"],
      ["0_1", "0_1", "0_1", "0_1", "2_1", "0_0", "0_0", "0_0", "0_0", "0_0"],
    ],
    playerStart: { col: 0, row: 8 },
    playerEnd: { col: 7, row: 9 },
    aiStart: { col: 7, row: 1 },
    aiEnd: { col: 0, row: 0 },
  },
  {
    id: "hulao",
    name: "虎牢关",
    subtitle: "夹道阵式",
    palette: {
      paper: 0xdfe4cf,
      plot: 0xc8d5b6,
      road: 0x8fae9f,
      grass: 0x86aa79,
      blocked: 0x627373,
      player: 0x287f9b,
      ai: 0xaf5034,
    },
    matrix: [
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["0_1", "0_1", "2_1", "2_1", "2_1", "2_0", "1_0", "1_0", "0_0", "2_0"],
      ["0_1", "2_1", "1_1", "1_1", "2_1", "2_0", "1_0", "1_0", "0_0", "0_0"],
      ["0_1", "0_1", "1_1", "1_1", "2_1", "2_0", "1_0", "1_0", "2_0", "0_0"],
      ["2_1", "0_1", "1_1", "1_1", "2_1", "2_0", "2_0", "2_0", "0_0", "0_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
    ],
    playerStart: { col: 0, row: 6 },
    playerEnd: { col: 7, row: 5 },
    aiStart: { col: 7, row: 3 },
    aiEnd: { col: 0, row: 4 },
  },
  {
    id: "chibi",
    name: "赤壁",
    subtitle: "火攻阵式",
    palette: {
      paper: 0xe4ccc4,
      plot: 0xd6b49e,
      road: 0x9b7162,
      grass: 0x9aa071,
      blocked: 0x6d5550,
      player: 0x2d7090,
      ai: 0xbf3e31,
    },
    matrix: [
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["1_1", "1_1", "1_1", "2_1", "0_1", "0_0", "2_0", "1_0", "1_0", "1_0"],
      ["1_1", "1_1", "1_1", "2_1", "0_1", "0_0", "2_0", "1_0", "1_0", "1_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
      ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
      ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
    ],
    playerStart: { col: 0, row: 6 },
    playerEnd: { col: 7, row: 5 },
    aiStart: { col: 7, row: 3 },
    aiEnd: { col: 0, row: 4 },
  },
] as const;

export function adouPointKey(point: AdouPoint) {
  return `${point.col}:${point.row}`;
}

export function adouRawTileAt(
  matrix: readonly (readonly AdouRawTile[])[],
  point: AdouPoint,
) {
  return matrix[point.col]?.[point.row] ?? null;
}

export function decodeAdouTile(raw: AdouRawTile, col: number, row: number): AdouTile {
  return {
    col,
    row,
    kind: raw.startsWith("0") ? "road" : raw.startsWith("1") ? "plot" : "grass",
    owner: raw.endsWith("_0") ? "player" : "ai",
    tone: (col * 17 + row * 31) % 5,
  };
}

export function findAdouRoute(
  matrix: readonly (readonly AdouRawTile[])[],
  code: "0_0" | "0_1",
  start: AdouPoint,
  end: AdouPoint,
) {
  const queue: AdouPoint[] = [start];
  const previous = new Map<string, string | null>([[adouPointKey(start), null]]);
  const points = new Map<string, AdouPoint>([[adouPointKey(start), start]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current.col === end.col && current.row === end.row) break;

    const next: AdouPoint[] = [
      { col: current.col + 1, row: current.row },
      { col: current.col - 1, row: current.row },
      { col: current.col, row: current.row + 1 },
      { col: current.col, row: current.row - 1 },
    ];

    for (const point of next) {
      if (
        point.col < 0 ||
        point.col >= ADOU_BOARD_COLS ||
        point.row < 0 ||
        point.row >= ADOU_BOARD_ROWS
      ) {
        continue;
      }
      if (adouRawTileAt(matrix, point) !== code) continue;

      const key = adouPointKey(point);
      if (previous.has(key)) continue;

      previous.set(key, adouPointKey(current));
      points.set(key, point);
      queue.push(point);
    }
  }

  const endKey = adouPointKey(end);
  if (!previous.has(endKey)) return [start, end] as const;

  const route: AdouPoint[] = [];
  let key: string | null = endKey;
  while (key) {
    const point = points.get(key);
    if (point) route.push(point);
    key = previous.get(key) ?? null;
  }

  return route.reverse();
}

export function makeAdouTiles(map: Pick<AdouMapDefinition, "matrix">) {
  const tiles: AdouTile[] = [];
  for (let row = 0; row < ADOU_BOARD_ROWS; row += 1) {
    for (let col = 0; col < ADOU_BOARD_COLS; col += 1) {
      const raw = map.matrix[col]?.[row];
      if (raw) tiles.push(decodeAdouTile(raw, col, row));
    }
  }
  return tiles;
}

function buildAdouMap(raw: RawAdouMapDefinition): AdouMapDefinition {
  return {
    id: raw.id,
    name: raw.name,
    subtitle: raw.subtitle,
    palette: raw.palette,
    matrix: raw.matrix,
    routes: {
      player: findAdouRoute(raw.matrix, "0_0", raw.playerStart, raw.playerEnd),
      ai: findAdouRoute(raw.matrix, "0_1", raw.aiStart, raw.aiEnd),
    },
  };
}

export const ADOU_MAPS = Object.fromEntries(
  RAW_ADOU_MAPS.map((map) => [map.id, buildAdouMap(map)]),
) as Record<AdouMapId, AdouMapDefinition>;

export function getAdouMapDefs() {
  return Object.values(ADOU_MAPS);
}

export function getAdouTile(
  map: Pick<AdouMapDefinition, "matrix">,
  col: number,
  row: number,
) {
  const raw = map.matrix[col]?.[row];
  return raw ? decodeAdouTile(raw, col, row) : null;
}

export function isAdouBuildTileForSide(tile: AdouTile | null, side: AdouSide) {
  return !!tile && tile.owner === side && tile.kind === "plot";
}

export function isAdouFarmTileForSide(tile: AdouTile | null, side: AdouSide) {
  return !!tile && tile.owner === side && (tile.kind === "plot" || tile.kind === "grass");
}

export function isAdouRoadTileForSide(tile: AdouTile | null, side: AdouSide) {
  return !!tile && tile.owner === side && tile.kind === "road";
}
