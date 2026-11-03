import { useEffect, useRef, useState } from "react";
import type { World, Place, Action } from "./types";
import { activityAt } from "./simulation";
import {
  buildWalkGrid,
  gridPoint,
  nearestOpen,
  planRoute,
  type Point,
  type WalkGrid,
} from "./navigation";
import {
  chooseLifeIntent,
  freeActions,
  intentIsReachable,
  seedOf,
  type LifeIntent,
  type LifePose,
} from "./life";
export interface MotionPose extends Point {
  placeId: string;
  walking: boolean;
  facing: 1 | -1;
  pose?: LifePose;
  furnitureId?: string;
  rotation?: number;
  scale?: number;
  label?: string;
  action?: Action;
}
export type MotionMap = Record<string, MotionPose>;
interface RouteState {
  key: string;
  place: Place;
  path: Point[];
  wait: number;
  turn: number;
  intent: LifeIntent;
  settled: boolean;
  canSettle: boolean;
}
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
    pose: "stand",
    rotation: 0,
    scale: 1,
  };
}
function rest(p: MotionPose, intent: LifeIntent, action: Action): MotionPose {
  return {
    ...p,
    walking: false,
    pose: intent.pose,
    rotation: intent.rotation,
    scale: intent.scale,
    label: intent.label,
    furnitureId: intent.furnitureId,
    facing: intent.facing,
    action,
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
    ) {
      out[id] = {
        x: Math.max(0, Math.min(100, p.x)),
        y: Math.max(0, Math.min(100, p.y)),
        placeId: p.placeId.slice(0, 80),
        walking: p.walking === true,
        facing: p.facing === -1 ? -1 : 1,
      };
      if (
        ["stand", "sit", "eat", "work", "sleep", "talk"].includes(p.pose || "")
      )
        out[id].pose = p.pose;
      if (typeof p.furnitureId === "string")
        out[id].furnitureId = p.furnitureId.slice(0, 80);
      if (Number.isFinite(p.rotation)) out[id].rotation = p.rotation;
      if (Number.isFinite(p.scale))
        out[id].scale = Math.max(0.4, Math.min(1.4, p.scale!));
      if (typeof p.label === "string") out[id].label = p.label.slice(0, 60);
      if (typeof p.action === "string") out[id].action = p.action;
    }
  }
  return out;
}
export function useWorldMotion(world: World, running: boolean) {
  const latest = useRef(world);
  latest.current = world;
  const routes = useRef<Record<string, RouteState>>({});
  const observedPlaces = useRef(world.places);
  const poses = useRef<MotionMap>({});
  const [motion, setMotion] = useState<MotionMap>({});
  useEffect(() => {
    const next: MotionMap = {};
    let changed = false;
    world.characters.forEach((c, i) => {
      const a = activityAt(c, world.clock),
        place = world.places.find((p) => p.id === a.placeId)!;
      const old = poses.current[c.id];
      if (
        !old ||
        old.placeId !== place.id ||
        (!running && old.action !== a.action) ||
        (!running &&
          !!old.furnitureId &&
          observedPlaces.current.find((p) => p.id === place.id) !== place)
      ) {
        let initial = spawn(place, i);
        if (
          !running &&
          ["취침", "식사", "공부", "등교", "출근"].includes(a.action)
        ) {
          const intent = chooseLifeIntent(
            world,
            c,
            place,
            a.action,
            0,
            initial,
            poses.current,
          );
          if (intent.anchor)
            initial = rest({ ...initial, ...intent.anchor }, intent, a.action);
        }
        next[c.id] = { ...initial, action: a.action };
        delete routes.current[c.id];
        changed = true;
      } else next[c.id] = old;
    });
    observedPlaces.current = world.places;
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
      const w = latest.current,
        next: MotionMap = {};
      w.characters.forEach((c, i) => {
        const a = activityAt(c, w.clock),
          place = w.places.find((p) => p.id === a.placeId)!;
        let pose = poses.current[c.id];
        if (!pose || pose.placeId !== place.id) pose = spawn(place, i);
        const key = `${place.id}:${a.action}`;
        let route = routes.current[c.id];
        const makeRoute = (turn: number): RouteState => {
          const intent = chooseLifeIntent(
            w,
            c,
            place,
            a.action,
            turn,
            pose,
            poses.current,
          );
          const path = planRoute(gridFor(place), pose, intent.approach);
          const end = path.at(-1) || pose;
          return {
            key,
            place,
            path,
            wait: 0,
            turn,
            intent,
            settled: false,
            canSettle: intentIsReachable(end, intent),
          };
        };
        if (!route || route.key !== key || route.place !== place) {
          route = makeRoute(0);
          routes.current[c.id] = route;
        }
        if (!route.path.length) {
          if (!route.settled) {
            if (route.canSettle && route.intent.anchor) {
              const anchor = route.intent.anchor,
                dx = anchor.x - pose.x,
                dy = ((anchor.y - pose.y) * 2) / 3,
                dist = Math.hypot(dx, dy),
                step = dt * 12;
              if (dist > step) {
                const p = {
                  ...pose,
                  x: pose.x + (dx / dist) * step,
                  y: pose.y + (dy / dist) * step * 1.5,
                };
                next[c.id] = rest(p, route.intent, a.action);
                return;
              }
              pose = { ...pose, ...anchor };
            }
            route.settled = true;
          }
          route.wait += dt;
          if (
            freeActions.includes(a.action) &&
            route.wait > route.intent.hold
          ) {
            route = makeRoute(route.turn + 1);
            routes.current[c.id] = route;
          }
          next[c.id] = route.canSettle
            ? rest(pose, route.intent, a.action)
            : {
                ...pose,
                walking: false,
                pose: "stand",
                furnitureId: undefined,
                rotation: 0,
                scale: 1,
                label: "이곳에서 잠깐 쉬는 중",
                action: a.action,
              };
          return;
        }
        let remaining = dt * (4.6 + (seedOf(c.id) % 17) / 10),
          x = pose.x,
          y = pose.y,
          facing = pose.facing;
        while (remaining > 0 && route.path.length) {
          const p = route.path[0],
            dx = p.x - x,
            dy = ((p.y - y) * 2) / 3,
            dist = Math.hypot(dx, dy);
          if (Math.abs(dx) > 0.03) facing = dx < 0 ? -1 : 1;
          if (dist <= remaining) {
            x = p.x;
            y = p.y;
            remaining -= dist;
            route.path.shift();
          } else {
            x += (dx / dist) * remaining;
            y += (dy / dist) * remaining * 1.5;
            remaining = 0;
          }
        }
        next[c.id] = {
          placeId: place.id,
          x,
          y,
          facing,
          walking: true,
          pose: "stand",
          rotation: 0,
          scale: 1,
          label:
            a.action === "취침"
              ? "침대로 가는 중"
              : a.action === "식사"
                ? "식탁으로 가는 중"
                : "천천히 걷는 중",
          action: a.action,
        };
      });
      poses.current = next;
      setMotion(next);
    }, 100);
    return () => clearInterval(tick);
  }, [running]);
  return motion;
}
