import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloorPlan } from "../src/components/FloorPlan";
import { defaultWorld } from "../src/defaults";
import { buildWalkGrid, planRoute } from "../src/navigation";

test("벽과 방 테두리는 같은 문틈 마스크를 사용하고 바닥은 유지한다", () => {
  const world = defaultWorld();
  const place = world.places[0];
  place.rooms[0].border = true;
  const markup = renderToStaticMarkup(
    createElement(FloorPlan, { world, place }),
  );
  const maskId = markup.match(/<mask id="([^"]+)"/)![1];
  assert.equal(
    (markup.match(/fill="black"/g) || []).length,
    place.furniture.filter((f) => f.kind === "문").length,
  );
  assert.equal(
    (markup.match(new RegExp(`mask="url\\(#${maskId}\\)"`, "g")) || []).length,
    place.furniture.filter((f) => f.kind === "벽").length + 1,
  );
  assert.ok(markup.includes("translate(531 336) rotate(90)"));
  assert.ok(markup.includes(`fill="${place.rooms[0].color}"`));
});

test("회전한 문의 문턱으로만 벽을 건너고 나머지 벽은 막힌다", () => {
  const world = defaultWorld();
  const place = {
    ...world.places[0],
    rooms: [],
    furniture: [
      { id: "w", kind: "벽" as const, label: "벽", x: 50, y: 50, w: 2, h: 100 },
      {
        id: "d",
        kind: "문" as const,
        label: "문",
        x: 50,
        y: 50,
        w: 8,
        h: 12,
        rotation: 90,
      },
    ],
  };
  const grid = buildWalkGrid(place);
  const path = planRoute(grid, { x: 20, y: 30 }, { x: 80, y: 30 });
  assert.ok(path.at(-1)!.x > 75);
  assert.ok(
    path
      .filter((p) => Math.abs(p.x - 50) < 3)
      .every((p) => Math.abs(p.y - 50) < 8),
  );
});
