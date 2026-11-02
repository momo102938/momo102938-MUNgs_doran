import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWalkGrid,
  planRoute,
  nearestOpen,
  gridPoint,
} from "../src/navigation";
import { defaultPlaces } from "../src/defaults";
import { normalizeWorld } from "../src/storage";
import { defaultWorld } from "../src/defaults";
import { sanitizeMotion } from "../src/motion";
import type { Place } from "../src/types";
const partition: Place = {
  id: "test",
  name: "경로 검사",
  floor: "#ffffff",
  rooms: [],
  furniture: [
    { id: "wall", kind: "벽", label: "벽", x: 50, y: 50, w: 2, h: 100 },
  ],
};
test("문이 없는 벽은 통과하지 않는다", () => {
  const g = buildWalkGrid(partition);
  const path = planRoute(g, { x: 20, y: 50 }, { x: 80, y: 50 });
  assert.ok(path.length);
  assert.ok(path.every((p) => p.x < 50));
});
test("벽에 문을 만들면 그 틈으로 반대편까지 걷는다", () => {
  const p = {
    ...partition,
    furniture: [
      ...partition.furniture,
      {
        id: "door",
        kind: "문" as const,
        label: "문",
        x: 50,
        y: 50,
        w: 10,
        h: 15,
      },
    ],
  };
  const g = buildWalkGrid(p),
    path = planRoute(g, { x: 20, y: 50 }, { x: 80, y: 50 });
  assert.ok(path.at(-1)!.x > 75);
  assert.ok(
    path
      .filter((point) => Math.abs(point.x - 50) < 4)
      .every((point) => Math.abs(point.y - 50) < 13),
  );
});
test("완전히 막힌 공간에서도 경로 탐색이 끝난다", () => {
  const p = {
    ...partition,
    furniture: [
      {
        id: "blocked",
        kind: "벽" as const,
        label: "막힘",
        x: 50,
        y: 50,
        w: 100,
        h: 100,
      },
    ],
  };
  const g = buildWalkGrid(p);
  assert.equal(nearestOpen(g, { x: 50, y: 50 }), -1);
  assert.deepEqual(planRoute(g, { x: 10, y: 10 }, { x: 90, y: 90 }), []);
});
test("대학교 기본 도면은 가구와 벽을 피해 이동할 빈 공간이 있다", () => {
  const p = defaultPlaces().find((p) => p.id === "university")!;
  const g = buildWalkGrid(p),
    start = nearestOpen(g, { x: 43, y: 94 }),
    goal = nearestOpen(g, { x: 30, y: 45 });
  const path = planRoute(g, gridPoint(g, start), gridPoint(g, goal));
  assert.ok(path.length > 10);
  assert.ok(path.every((point) => g.open[nearestOpen(g, point)]));
});
test("보행 위치는 저장 데이터와 분리하고 팝업에는 검증한 위치만 전달한다", () => {
  assert.deepEqual(
    sanitizeMotion({
      a: { placeId: "home", x: Infinity, y: 3 },
      b: { placeId: "home", x: 120, y: -3, walking: true, facing: -1 },
    }),
    { b: { placeId: "home", x: 100, y: 0, walking: true, facing: -1 } },
  );
  const n = normalizeWorld(defaultWorld());
  assert.equal("motion" in n, false);
});
