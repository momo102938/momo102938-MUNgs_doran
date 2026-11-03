import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultWorld } from "../src/defaults";
import { normalizeWorld } from "../src/storage";
import { FURNITURE_KINDS } from "../src/types";
import { FurnitureArt } from "../src/components/FurnitureArt";
import { chooseLifeIntent } from "../src/life";
import { buildWalkGrid, planRoute } from "../src/navigation";

test("거실과 복도 사이는 문 없이 지나가고 양쪽 벽은 유지한다", () => {
  const home = defaultWorld().places[0];
  assert.ok(
    !home.furniture.some((f) => f.kind === "문" && f.x === 59 && f.y === 56),
  );
  const path = planRoute(
    buildWalkGrid(home),
    { x: 48, y: 55 },
    { x: 68, y: 55 },
  );
  assert.ok(path.at(-1)!.x > 65);
  assert.ok(
    path
      .filter((p) => Math.abs(p.x - 59) < 3)
      .every((p) => p.y >= 49 && p.y <= 63),
  );
});
test("일반 문은 여닫는 곡선 없이 얇은 선 하나로 표시한다", () => {
  const art = renderToStaticMarkup(createElement(FurnitureArt, { kind: "문" }));
  assert.ok(art.includes('data-door-threshold="true"'));
  assert.equal((art.match(/<path /g) || []).length, 1);
  assert.ok(!art.includes("strokeDasharray") && !art.includes("<circle"));
});
test("1인 침대는 꾸미기에만 있으며 넓혀도 한 명만 베개 쪽에 눕는다", () => {
  const w = defaultWorld(),
    home = w.places[0];
  assert.ok(FURNITURE_KINDS.includes("1인 침대"));
  assert.ok(!home.furniture.some((f) => f.kind === "1인 침대"));
  const bed = home.furniture.find((f) => f.kind === "침대")!;
  bed.kind = "1인 침대";
  bed.rotation = 90;
  w.clock = new Date(2026, 10, 3, 23, 30).toISOString();
  for (const c of w.characters)
    c.schedule = [
      { id: "sleep", time: "00:00", action: "취침", placeId: "home" },
    ];
  const first = chooseLifeIntent(w, w.characters[0], home, "취침", 0, {
    x: 40,
    y: 55,
  });
  const second = chooseLifeIntent(w, w.characters[1], home, "취침", 0, {
    x: 40,
    y: 55,
  });
  assert.equal(first.pose, "sleep");
  assert.equal(first.rotation, 90);
  assert.notEqual(second.pose, "sleep");
  assert.equal(
    normalizeWorld(w).places[0].furniture.find((f) => f.id === bed.id)!.kind,
    "1인 침대",
  );
});
test("이전 기본 문은 열린 통로로 바꾸고 직접 이동한 가구는 보존한다", () => {
  const w = defaultWorld(),
    home = w.places[0];
  home.layoutVersion = 5;
  home.furniture = home.furniture.filter(
    (f) => !(f.kind === "벽" && f.x === 59),
  );
  home.furniture.push(
    { id: "old-wall", kind: "벽", label: "벽", x: 59, y: 50, w: 1.3, h: 98 },
    {
      id: "old-door",
      kind: "문",
      label: "문",
      x: 59,
      y: 56,
      w: 8,
      h: 12,
      rotation: 90,
    },
  );
  const fridge = home.furniture.find((f) => f.kind === "냉장고")!;
  fridge.x = 20;
  const updated = normalizeWorld(w).places[0];
  assert.ok(!updated.furniture.some((f) => f.id === "old-door"));
  assert.equal(updated.furniture.find((f) => f.id === fridge.id)!.x, 20);
  assert.ok(
    planRoute(buildWalkGrid(updated), { x: 48, y: 55 }, { x: 68, y: 55 }).at(
      -1,
    )!.x > 65,
  );
});
