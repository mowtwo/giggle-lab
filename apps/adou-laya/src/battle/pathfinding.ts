// Pathfinding — A* over a rectangular grid.
//
// Faithful reconstruction of the original bundle's `S` (A*), `b` (grid node) and
// `M` (grid) classes (reconstruction/reference/bundle.pretty.js lines ~1146-1278).
// Used by the map manager for enemy/unit routing. Only identifiers are
// de-mangled; the search, heuristics and costs are copied verbatim.
//
// AStar:   straightCost=Sh  diagonalCost=bh  heuristic=Mh
//   octileHeuristic=Ph  euclideanHeuristic=Eh  manhattanHeuristic=Bh
//   openSet=Ih  closedSet=Th  startNode=Rh  endNode=Ah  pathNodes=Gh
//   isClosed=Dh  tracePath=Xh  findPath=Hh
// GridNode (b): walkable=Oh  cost=Yh  x  y  (+ f/g/h/parentNode during search)
// Grid (M): cols=jh/Ch  rows=$h/Uh  nodes=Nh  getNode=Fh  setStart=qh
//   setEnd=Qh  setWalkable=Kh  start=Wh/Vh  end=zh/Zh

/* eslint-disable @typescript-eslint/no-explicit-any */

export class GridNode {
  Oh = true; // walkable
  Yh = 1; // movement cost
  x: number;
  y: number;
  // Assigned during A* search:
  f = 0;
  g = 0;
  h = 0;
  parentNode: GridNode | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Grid {
  private jh: number;
  private $h: number;
  private Nh: GridNode[][] = [];
  private Vh!: GridNode; // start
  private Zh!: GridNode; // end

  constructor(cols: number, rows: number) {
    this.jh = cols;
    this.$h = rows;
    for (let t = 0; t < this.jh; t++) {
      this.Nh[t] = [];
      for (let s = 0; s < this.$h; s++) this.Nh[t][s] = new GridNode(t, s);
    }
  }

  /** getNode (`Fh`) */
  Fh(x: number, y: number): GridNode {
    return this.Nh[x][y];
  }

  /** setStart (`qh`) */
  qh(x: number, y: number): void {
    this.Vh = this.Nh[x][y];
  }

  /** setEnd (`Qh`) */
  Qh(x: number, y: number): void {
    this.Zh = this.Nh[x][y];
  }

  /** setWalkable (`Kh`) */
  Kh(x: number, y: number, walkable: boolean): void {
    this.Nh[x][y].Oh = walkable;
  }

  get Ch(): number {
    return this.jh;
  }
  get Uh(): number {
    return this.$h;
  }
  get Wh(): GridNode {
    return this.Vh;
  }
  get zh(): GridNode {
    return this.Zh;
  }
}

export class AStar {
  private Sh = 1; // straight (orthogonal) step cost
  private bh = 1.4; // diagonal step cost
  private Mh: (node: GridNode) => number = this.Ph;

  private Ah!: GridNode; // end
  private Rh!: GridNode; // start
  private Ih!: GridNode[]; // open set
  private Th!: GridNode[]; // closed set
  private Gh!: GridNode[]; // resulting path
  private grid!: Grid;

  /** Octile/diagonal heuristic (default). (`Ph`) */
  private Ph(t: GridNode): number {
    const s = Math.abs(t.x - this.Ah.x);
    const i = Math.abs(t.y - this.Ah.y);
    const h = Math.min(s, i);
    const e = s + i;
    return this.bh * h + this.Sh * (e - 2 * h);
  }

  /** Euclidean heuristic. (`Eh`) */
  private Eh(t: GridNode): number {
    const s = Math.abs(t.x - this.Ah.x);
    const i = Math.abs(t.y - this.Ah.y);
    return Math.sqrt(s * s + i * i) * this.bh;
  }

  /** Manhattan heuristic. (`Bh`) */
  private Bh(t: GridNode): number {
    return (Math.abs(t.x - this.Ah.x) + Math.abs(t.y - this.Ah.y)) * this.Sh;
  }

  private isOpen(t: GridNode): boolean {
    for (let s = 0; s < this.Ih.length; s++) if (this.Ih[s] === t) return true;
    return false;
  }

  /** isClosed (`Dh`) */
  private Dh(t: GridNode): boolean {
    for (let s = 0; s < this.Th.length; s++) if (this.Th[s] === t) return true;
    return false;
  }

  private search(): boolean {
    let t = this.Rh;
    while (t !== this.Ah) {
      const s = Math.max(0, t.x - 1);
      const i = Math.min(this.grid.Ch - 1, t.x + 1);
      const h = Math.max(0, t.y - 1);
      const e = Math.min(this.grid.Uh - 1, t.y + 1);
      for (let a = s; a <= i; a++) {
        for (let s2 = h; s2 <= e; s2++) {
          if (a !== t.x && s2 !== t.y) continue;
          const node = this.grid.Fh(a, s2);
          if (
            node === t ||
            !node.Oh ||
            !this.grid.Fh(t.x, node.y).Oh ||
            !this.grid.Fh(node.x, t.y).Oh
          )
            continue;
          let stepCost = this.Sh;
          if (t.x !== node.x && t.y !== node.y) stepCost = this.bh;
          const g = t.g + stepCost * node.Yh;
          const hCost = this.Mh(node);
          const f = g + hCost;
          if (this.isOpen(node) || this.Dh(node)) {
            if (node.f > f) {
              node.f = f;
              node.g = g;
              node.h = hCost;
              node.parentNode = t;
            }
          } else {
            node.f = f;
            node.g = g;
            node.h = hCost;
            node.parentNode = t;
            this.Ih.push(node);
          }
        }
      }
      this.Th.push(t);
      if (this.Ih.length <= 0) {
        console.error("AStar can`t find path");
        return false;
      }
      for (let p = 0; p < this.Ih.length; p++) {
        for (let q = p + 1; q < this.Ih.length; q++) {
          if (this.Ih[p].f > this.Ih[q].f) {
            const tmp = this.Ih[p];
            this.Ih[p] = this.Ih[q];
            this.Ih[q] = tmp;
          }
        }
      }
      t = this.Ih.shift() as GridNode;
    }
    this.Xh();
    return true;
  }

  /** Trace the path back from end to start. (`Xh`) */
  private Xh(): void {
    this.Gh = [];
    let t = this.Ah;
    this.Gh.push(t);
    while (t !== this.Rh) {
      t = t.parentNode as GridNode;
      this.Gh.unshift(t);
    }
  }

  /** Find a path on `grid` from its start to its end. (`Hh`) */
  Hh(grid: Grid): boolean {
    this.grid = grid;
    this.Ih = [];
    this.Th = [];
    this.Rh = this.grid.Wh;
    this.Ah = this.grid.zh;
    this.Rh.g = 0;
    this.Rh.h = this.Mh(this.Rh);
    this.Rh.f = this.Rh.g + this.Rh.h;
    return this.search();
  }

  get path(): GridNode[] {
    return this.Gh;
  }
}
