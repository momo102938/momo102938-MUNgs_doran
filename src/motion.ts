import { useEffect, useRef, useState } from "react";
import type { World, Action, Place } from "./types";
import { activityAt } from "./simulation";
import {
  buildWalkGrid,
  gridPoint,
  nearestOpen,
  nearFurniture,
  planRoute,
  type Point,
  type WalkGrid,
} from "./navigation";
export interface MotionPose extends Point {
  placeId: string;
  walking: boolean;
  facing: 1 | -1;
}
export type MotionMap = Record<string, MotionPose>;
interface RouteState {
  key: string;
  place: Place;
  path: Point[];
  wait: number;
  turn: number;
}
const targets: Record<Action, string[]> = {
  기상: ["침대"],
  식사: ["테이블", "카페"],
  출근: ["책상"],
  등교: ["강의책상", "책상"],
  귀가: ["소파", "벤치"],
  공부: ["강의책상", "책상", "교탁"],
  놀이: ["분수", "벤치", "소파"],
  대화: ["소파", "벤치", "테이블"],
  취침: ["침대"],
};
const gridCache = new WeakMap<Place, WalkGrid>();
function gridFor(p: Place) {
  let g = gridCache.get(p);
  if (!g) {
    g = buildWalkGrid(p);
    gridCache.set(p, g);
  }
  return g;
}
function spawn(place: Place, index: number): MotionPose {
  const grid = gridFor(place);
  const door = place.furniture
    .filter((f) => f.kind === "문")
    .sort(
      (a, b) =>
        Math.min(a.x, 100 - a.x, a.y, 100 - a.y) -
        Math.min(b.x, 100 - b.x, b.y, 100 - b.y),
    )[0];
  const point = door
    ? { x: door.x + (index % 2) * 4, y: door.y - 5 }
    : { x: 20 + (index % 3) * 17, y: 68 - Math.floor(index / 3) * 20 };
  const node = nearestOpen(grid, point);
  return {
    ...(node >= 0 ? gridPoint(grid, node) : point),
    placeId: place.id,
    walking: false,
    facing: 1,
  };
}
const hash = (s: string) =>
  Array.from(s).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
function target(
  place: Place,
  action: Action,
  index: number,
  turn: number,
  id: string,
  current: Point,
): Point {
  const objects = place.furniture.filter((o) =>
    targets[action].includes(o.kind),
  );
  const seed = hash(id) + turn * 37;
  if (objects.length) {
    const o = objects[index % objects.length];
    const base = nearFurniture(o, index);
    if (turn === 0 || !["놀이", "대화", "귀가", "기상"].includes(action))
      return base;
    return { x: base.x + Math.sin(seed) * 9, y: base.y + Math.cos(seed) * 9 };
  }
  return {
    x: Math.max(8, Math.min(92, current.x + Math.sin(seed) * 18)),
    y: Math.max(8, Math.min(92, current.y + Math.cos(seed) * 18)),
  };
}
export function sanitizeMotion(input: unknown): MotionMap {
  const out: MotionMap = {};
  if (!input || typeof input !== "object") return out;
  for (const [id, v] of Object.entries(input).slice(0, 20)) {
    if (!v || typeof v !== "object") continue;
    const p = v as MotionPose;
    if (
      typeof p.placeId === "string" &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y)
    )
      out[id] = {
        x: Math.max(0, Math.min(100, p.x)),
        y: Math.max(0, Math.min(100, p.y)),
        placeId: p.placeId.slice(0, 80),
        walking: p.walking === true,
        facing: p.facing === -1 ? -1 : 1,
      };
  }
  return out;
}
export function useWorldMotion(world: World, running: boolean) {
  const latest = useRef(world);
  latest.current = world;
  const routes = useRef<Record<string, RouteState>>({});
  const poses = useRef<MotionMap>({});
  const [motion, setMotion] = useState<MotionMap>({});
  useEffect(() => {
    const next: MotionMap = {};
    let changed = false;
    world.characters.forEach((c, i) => {
      const a = activityAt(c, world.clock),
        place = world.places.find((p) => p.id === a.placeId)!;
      const old = poses.current[c.id];
      if (!old || old.placeId !== place.id) {
        let initial = spawn(place, i);
        if (!running && a.action === "취침") {
          const g = gridFor(place);
          const node = nearestOpen(
            g,
            target(place, a.action, i, 0, c.id, initial),
          );
          if (node >= 0) initial = { ...initial, ...gridPoint(g, node) };
        }
        next[c.id] = initial;
        delete routes.current[c.id];
        changed = true;
      } else next[c.id] = old;
    });
    if (Object.keys(next).length !== Object.keys(poses.current).length)
      changed = true;
    if (changed) {
      poses.current = next;
      setMotion(next);
    }
  }, [world.clock, world.characters, world.places]);
  useEffect(() => {
    if (!running) {
      const frozen = Object.fromEntries(
        Object.entries(poses.current).map(([id, p]) => [
          id,
          { ...p, walking: false },
        ]),
      );
      poses.current = frozen;
      setMotion(frozen);
      return;
    }
    let previous = performance.now();
    const tick = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.25, (now - previous) / 1000);
      previous = now;
      const w = latest.current;
      const next: MotionMap = {};
      w.characters.forEach((c, i) => {
        const a = activityAt(c, w.clock),
          place = w.places.find((p) => p.id === a.placeId)!;
        let pose = poses.current[c.id];
        if (!pose || pose.placeId !== place.id) pose = spawn(place, i);
        const key = `${place.id}:${a.action}`;
        let route = routes.current[c.id];
        if (!route || route.key !== key || route.place !== place) {
          route = {
            key,
            place,
            path: planRoute(
              gridFor(place),
              pose,
              target(place, a.action, i, 0, c.id, pose),
            ),
            wait: 0,
            turn: 0,
          };
          routes.current[c.id] = route;
        }
        if (!route.path.length) {
          route.wait += dt;
          const wander = ["놀이", "대화", "귀가", "기상"].includes(a.action);
          if (wander && route.wait > 3 + i * 0.7) {
            route.turn++;
            route.wait = 0;
            route.path = planRoute(
              gridFor(place),
              pose,
              target(place, a.action, i, route.turn, c.id, pose),
            );
          }
          next[c.id] = { ...pose, walking: false };
          return;
        }
        let remaining = dt * 5.4;
        let x = pose.x,
          y = pose.y,
          facing = pose.facing;
        while (remaining > 0 && route.path.length) {
          const point = route.path[0],
            dx = point.x - x,
            dy = ((point.y - y) * 2) / 3,
            distance = Math.hypot(dx, dy);
          if (Math.abs(dx) > 0.03) facing = dx < 0 ? -1 : 1;
          if (distance <= remaining) {
            x = point.x;
            y = point.y;
            remaining -= distance;
            route.path.shift();
          } else {
            x += (dx / distance) * remaining;
            y += (dy / distance) * remaining * 1.5;
            remaining = 0;
          }
        }
        next[c.id] = {
          placeId: place.id,
          x,
          y,
          facing,
          walking: route.path.length > 0,
        };
      });
      poses.current = next;
      setMotion(next);
    }, 100);
    return () => clearInterval(tick);
  }, [running]);
  return motion;
}
