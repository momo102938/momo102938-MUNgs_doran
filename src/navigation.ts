import type { Furniture, Place } from "./types";
import { FURNITURE_META } from "./planSpec";
export interface Point {
  x: number;
  y: number;
}
export interface WalkGrid {
  cols: number;
  rows: number;
  open: Uint8Array;
}
const COLS = 50,
  ROWS = 34;
function inside(o: Furniture, p: Point, padding = 0) {
  const angle = (-(o.rotation || 0) * Math.PI) / 180,
    dx = (p.x - o.x) * 9,
    dy = (p.y - o.y) * 6;
  const x = dx * Math.cos(angle) - dy * Math.sin(angle),
    y = dx * Math.sin(angle) + dy * Math.cos(angle);
  const meta = FURNITURE_META[o.kind];
  return (
    Math.abs(x) < (o.w ?? meta.w) * 4.5 + padding &&
    Math.abs(y) < (o.h ?? meta.h) * 3 + padding
  );
}
const solid = new Set([
  "소파",
  "침대",
  "1인 침대",
  "테이블",
  "책상",
  "교탁",
  "강의책상",
  "화분",
  "나무",
  "분수",
  "카페",
  "싱크대",
  "냉장고",
  "욕조",
  "변기",
  "세면대",
  "책장",
  "수납장",
  "텔레비전",
]);
export function buildWalkGrid(place: Place): WalkGrid {
  const open = new Uint8Array(COLS * ROWS);
  const doors = place.furniture.filter(
    (f) => f.kind === "문" || f.kind === "미닫이창",
  );
  const walls = place.furniture.filter(
    (f) => f.kind === "벽" && (f.w ?? 30) >= 1 && (f.h ?? 1.7) >= 1,
  );
  const obstacles = place.furniture.filter((f) => solid.has(f.kind));
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const p = { x: ((x + 0.5) / COLS) * 100, y: ((y + 0.5) / ROWS) * 100 };
      const doorway = doors.some((d) =>
        inside(
          { ...d, h: Math.min(d.h ?? FURNITURE_META[d.kind].h, 28 / 6) },
          p,
          8,
        ),
      );
      const roomEdge = place.rooms.some(
        (r) =>
          r.border &&
          p.x >= r.x - 0.9 &&
          p.x <= r.x + r.w + 0.9 &&
          p.y >= r.y - 1.3 &&
          p.y <= r.y + r.h + 1.3 &&
          (Math.abs(p.x - r.x) < 0.9 ||
            Math.abs(p.x - r.x - r.w) < 0.9 ||
            Math.abs(p.y - r.y) < 1.3 ||
            Math.abs(p.y - r.y - r.h) < 1.3),
      );
      const blockedWall = walls.some((w) => inside(w, p, 8)) || roomEdge;
      open[y * COLS + x] =
        (!blockedWall || doorway) && !obstacles.some((o) => inside(o, p, 3))
          ? 1
          : 0;
    }
  return { cols: COLS, rows: ROWS, open };
}
export function gridPoint(grid: WalkGrid, index: number): Point {
  return {
    x: (((index % grid.cols) + 0.5) / grid.cols) * 100,
    y: ((Math.floor(index / grid.cols) + 0.5) / grid.rows) * 100,
  };
}
export function nearestOpen(grid: WalkGrid, p: Point): number {
  let best = -1,
    d = Infinity;
  for (let i = 0; i < grid.open.length; i++) {
    if (!grid.open[i]) continue;
    const q = gridPoint(grid, i),
      dist = (q.x - p.x) ** 2 + (((q.y - p.y) * 2) / 3) ** 2;
    if (dist < d) {
      d = dist;
      best = i;
    }
  }
  return best;
}
// 벽을 피하고 문을 통과하는 네 방향 경로 탐색. 갈 수 없다면 같은 구역의 가장 가까운 지점까지 이동한다.
export function planRoute(
  grid: WalkGrid,
  start: Point,
  target: Point,
): Point[] {
  const from = nearestOpen(grid, start),
    to = nearestOpen(grid, target);
  if (from < 0 || to < 0) return [];
  const previous = new Int32Array(grid.open.length).fill(-1),
    queue = [from];
  previous[from] = from;
  let best = from,
    bestDistance = Infinity;
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head],
      p = gridPoint(grid, at),
      d = (p.x - target.x) ** 2 + (((p.y - target.y) * 2) / 3) ** 2;
    if (d < bestDistance) {
      best = at;
      bestDistance = d;
    }
    if (at === to) {
      best = to;
      break;
    }
    const x = at % grid.cols,
      y = Math.floor(at / grid.cols);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= grid.cols || ny < 0 || ny >= grid.rows) continue;
      const next = ny * grid.cols + nx;
      if (grid.open[next] && previous[next] === -1) {
        previous[next] = at;
        queue.push(next);
      }
    }
  }
  const path: Point[] = [];
  for (let at = best; at !== from; at = previous[at])
    path.push(gridPoint(grid, at));
  path.reverse();
  return path;
}
export function nearFurniture(f: Furniture, index: number): Point {
  const meta = FURNITURE_META[f.kind];
  const offset = ((index % 3) - 1) * 5;
  const a = ((f.rotation || 0) * Math.PI) / 180;
  const dx = offset * 9,
    dy = ((f.h ?? meta.h) / 2 + 5) * 6;
  return {
    x: Math.max(
      3,
      Math.min(97, f.x + (dx * Math.cos(a) - dy * Math.sin(a)) / 9),
    ),
    y: Math.max(
      4,
      Math.min(96, f.y + (dx * Math.sin(a) + dy * Math.cos(a)) / 6),
    ),
  };
}
