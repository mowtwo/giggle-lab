// MapMgr — battle map layouts, grid, and path computation.
//
// Faithful reconstruction of the original bundle's `P` class (aliased `A`),
// reconstruction/reference/bundle.pretty.js lines ~1279-1944. Holds the four
// battle-map tile layouts (8x10 "terrain_side" codes) + anchor points, builds an
// A* path for each side, and implements the formation tap-sequence check.
//
// Tile code "T_S": T = terrain (0 = road/walkable), S = side (0 = right/enemy,
// 1 = left/player). computePath marks anything other than "0_0"/"0_1" as blocked.
//
// Anchor points te/se/ie/he/ee/ae are map geometry kept verbatim (used across
// battle code; renaming risks drift): player route = se -> ie, enemy route =
// ee -> ae. Other members -> name:
//   map0..3=Jh/oe/le/ce  working=ue  playerPath=de  enemyPath=Le
//   gridWid=pe  gridHei  boundaryPath=_e  pathCache=Ie  checkpoints=ne
//   mapBlockByIndex=be  mapGridByIndex=Me  pathPointsInRange=Pe
//   computeWorkingPath=Ae  cachedPath=Be  computePath=Ee(static)
//   checkFormationTap=De  resetFormationTap=Te

/* eslint-disable @typescript-eslint/no-explicit-any */

import { MathE } from "../core/math-e";
import { AStar, Grid, GridNode } from "./pathfinding";

interface Pt {
  x: number;
  y: number;
}
interface MapBlock {
  map: string[][];
  te: Pt;
  se: Pt;
  ie: Pt;
  he: Pt;
  ee: Pt;
  ae: Pt;
  ne: Pt[];
  re: number;
}

const MAP0: string[][] = [
  ["0_1", "0_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0"],
  ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0"],
  ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_0", "0_0", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
  ["2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
  ["0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "0_0", "0_0"],
];
const MAP1: string[][] = [
  ["0_1", "0_1", "0_1", "0_1", "0_1", "2_0", "0_0", "0_0", "0_0", "0_0"],
  ["2_1", "2_1", "2_1", "2_1", "0_1", "2_0", "0_0", "2_0", "2_0", "2_0"],
  ["2_1", "2_1", "2_1", "2_1", "0_1", "2_0", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_1", "2_0", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "2_1", "0_0", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "2_1", "0_0", "2_0", "2_0", "2_0", "2_0"],
  ["2_1", "2_1", "2_1", "0_1", "2_1", "0_0", "2_0", "2_0", "2_0", "2_0"],
  ["0_1", "0_1", "0_1", "0_1", "2_1", "0_0", "0_0", "0_0", "0_0", "0_0"],
];
const MAP2: string[][] = [
  ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
  ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
  ["0_1", "0_1", "2_1", "2_1", "2_1", "2_0", "1_0", "1_0", "0_0", "2_0"],
  ["0_1", "2_1", "1_1", "1_1", "2_1", "2_0", "1_0", "1_0", "0_0", "0_0"],
  ["0_1", "0_1", "1_1", "1_1", "2_1", "2_0", "1_0", "1_0", "2_0", "0_0"],
  ["2_1", "0_1", "1_1", "1_1", "2_1", "2_0", "2_0", "2_0", "0_0", "0_0"],
  ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
  ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
];
const MAP3: string[][] = [
  ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
  ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
  ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
  ["1_1", "1_1", "1_1", "2_1", "0_1", "0_0", "2_0", "1_0", "1_0", "1_0"],
  ["1_1", "1_1", "1_1", "2_1", "0_1", "0_0", "2_0", "1_0", "1_0", "1_0"],
  ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
  ["2_1", "0_1", "2_1", "2_1", "2_1", "2_0", "2_0", "2_0", "0_0", "2_0"],
  ["2_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "2_0"],
];
const UE_TEMPLATE: string[][] = [
  ["0_1", "0_1", "0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0"],
  ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0"],
  ["2_1", "2_1", "2_1", "2_1", "2_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_1", "0_1", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_0", "0_0", "0_0", "1_0", "1_0", "2_0"],
  ["2_1", "1_1", "1_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
  ["2_1", "2_1", "2_1", "0_1", "0_0", "2_0", "2_0", "2_0", "2_0", "2_0"],
  ["0_1", "0_1", "0_1", "0_1", "0_0", "0_0", "0_0", "0_0", "0_0", "0_0"],
];

export class MapMgr {
  static readonly Ie = new Map<number, GridNode[] | null>();

  mapIndex = 0;

  private readonly Jh: MapBlock = {
    map: MAP0,
    te: { x: 0, y: 9 }, se: { x: 0, y: 8 }, ie: { x: 7, y: 9 },
    he: { x: 7, y: 0 }, ee: { x: 7, y: 1 }, ae: { x: 0, y: 0 },
    ne: [{ x: 0, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 4 }, { x: 8, y: 4 }],
    re: 0,
  };
  private readonly oe: MapBlock = {
    map: MAP1,
    te: { x: 0, y: 9 }, se: { x: 0, y: 8 }, ie: { x: 7, y: 9 },
    he: { x: 7, y: 0 }, ee: { x: 7, y: 1 }, ae: { x: 0, y: 0 },
    ne: [{ x: 0, y: 5 }, { x: 8, y: 5 }],
    re: 1,
  };
  private readonly le: MapBlock = {
    map: MAP2,
    te: { x: 0, y: 5 }, se: { x: 0, y: 6 }, ie: { x: 7, y: 5 },
    he: { x: 7, y: 4 }, ee: { x: 7, y: 3 }, ae: { x: 0, y: 4 },
    ne: [{ x: 0, y: 5 }, { x: 8, y: 5 }],
    re: 2,
  };
  private readonly ce: MapBlock = {
    map: MAP3,
    te: { x: 0, y: 5 }, se: { x: 0, y: 6 }, ie: { x: 7, y: 5 },
    he: { x: 7, y: 4 }, ee: { x: 7, y: 3 }, ae: { x: 0, y: 4 },
    ne: [{ x: 0, y: 5 }, { x: 8, y: 5 }],
    re: 3,
  };

  // Working grid (mutated to the active map by changeMap).
  private readonly ue: string[][] = UE_TEMPLATE.map((row) => row.slice());

  te: Pt | null = null;
  se: Pt | null = null;
  ie: Pt | null = null;
  he: Pt | null = null;
  ee: Pt | null = null;
  ae: Pt | null = null;
  ne: Pt[] | null = null;

  readonly gridWid = 80;
  readonly gridHei = 80;
  readonly ye = 5;
  readonly fe = 80;
  readonly ge = 80;
  re = 0;

  de: GridNode[] | null = null; // player path
  private Le: GridNode[] | null = null; // enemy path

  me = false;
  we = false;
  ve = false;
  ke = false;

  readonly boundaryPath: Pt[] = [
    { x: 0, y: 10 }, { x: 0, y: 6 }, { x: 4, y: 6 },
    { x: 4, y: 4 }, { x: 8, y: 4 }, { x: 8, y: 10 },
  ];

  private xe = 0; // formation tap step
  private Se = 0; // formation tap window deadline

  init(mapIndex: number): void {
    this.changeMap(mapIndex);
  }

  startGame(mapIndex: number): void {
    this.changeMap(mapIndex);
  }

  gameOver(): void {
    this.me = false;
    this.we = false;
    this.ve = false;
    this.ke = false;
  }

  /** mapBlockByIndex (`be`) */
  private be(index: number): MapBlock {
    switch (index) {
      case 0: return this.Jh;
      case 1: return this.oe;
      case 2: return this.le;
      case 3: return this.ce;
      default:
        throw new Error("MapData.mapDataBlockByIndex: invalid mapIndex " + index);
    }
  }

  /** mapGridByIndex (`Me`) */
  Me(index: number): string[][] {
    return this.be(index).map;
  }

  /** Path points within `radius` of `point`, on the player or enemy path. (`Pe`) */
  Pe(point: Pt, radius: number, isPlayer: boolean): GridNode[] {
    const path = (isPlayer ? this.de : this.Le) as GridNode[];
    return path.filter((node) => {
      Laya.Point.TEMP.setTo(node.x * this.gridWid, node.y * this.gridHei);
      return MathE.distanceSq(Laya.Point.TEMP as any, point) <= radius * radius;
    });
  }

  /** Compute a path on the working grid for the player/enemy side. (`Ae`) */
  private Ae(isPlayer: boolean): GridNode[] | null {
    return MapMgr.Ee(this.ue, isPlayer ? (this.se as Pt) : (this.ee as Pt), isPlayer ? (this.ie as Pt) : (this.ae as Pt));
  }

  /** Cached path for a map+side (enemy paths are cached). (`Be`) */
  Be(index: number, isPlayer: boolean): GridNode[] {
    if (!isPlayer) {
      const cached = MapMgr.Ie.get(index);
      if (cached) return cached;
    }
    const block = this.be(index);
    const start = isPlayer ? block.se : block.ee;
    const end = isPlayer ? block.ie : block.ae;
    const path = MapMgr.Ee(block.map, start, end) ?? [];
    if (!isPlayer) MapMgr.Ie.set(index, path);
    return path;
  }

  /** Build a grid from tile codes and A*-path from start to end. (`Ee`) */
  static Ee(map: string[][], start: Pt, end: Pt): GridNode[] | null {
    const grid = new Grid(map.length, map[0].length);
    grid.qh(start.x, start.y);
    grid.Qh(end.x, end.y);
    for (let s = 0; s < map.length; s++) {
      for (let i = 0; i < map[s].length; i++) {
        if (map[s][i] !== "0_0" && map[s][i] !== "0_1") grid.Kh(s, i, false);
      }
    }
    const astar = new AStar();
    return astar.Hh(grid) ? astar.path : null;
  }

  changeMap(index: number): void {
    this.mapIndex = index;
    const block = this.be(this.mapIndex);
    for (let t = 0; t < block.map.length; t++) {
      for (let i = 0; i < block.map[t].length; i++) this.ue[t][i] = block.map[t][i];
    }
    this.te = block.te;
    this.se = block.se;
    this.ie = block.ie;
    this.he = block.he;
    this.ee = block.ee;
    this.ae = block.ae;
    this.ne = block.ne;
    this.re = block.re;
    this.de = this.Ae(true);
    this.Le = this.Ae(false);
  }

  /** Formation tap-sequence check: 11 correct cells in order within 8s. (`De`) */
  De(x: number, y: number): boolean {
    const now = Date.now();
    if (now > this.Se) this.xe = 0;
    this.Se = now + 8000;
    const digit = MathE.lookupZs(this.xe);
    const cell = MathE.formationGridCell(digit);
    if (x !== cell.x || y !== cell.y) {
      this.xe = 0;
      return false;
    }
    this.xe++;
    if (this.xe >= 11) {
      this.xe = 0;
      this.Se = 0;
      return true;
    }
    return false;
  }

  /** resetFormationTap (`Te`) */
  Te(): void {
    this.xe = 0;
    this.Se = 0;
  }
}
