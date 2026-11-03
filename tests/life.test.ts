import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultWorld } from "../src/defaults";
import { activityAt } from "../src/simulation";
import { normalizeWorld } from "../src/storage";
import { chooseLifeIntent } from "../src/life";
import { sanitizeMotion } from "../src/motion";
const at = (hour: number) => new Date(2026, 10, 3, hour, 0).toISOString();
test("19세와 20세의 학교 경계를 일반 일정과 자녀 일정에 적용한다", () => {
  const w = defaultWorld(),
    c = w.characters[0];
  c.schedule = [
    { id: "s", time: "09:00", action: "등교", placeId: "university" },
  ];
  c.age = 19;
  assert.equal(activityAt(c, at(10)).placeId, "school");
  c.age = 20;
  c.schedule[0].placeId = "school";
  assert.equal(activityAt(c, at(10)).placeId, "university");
  c.child = {
    parentIds: [],
    schoolId: "school",
    schoolTime: "09:00",
    homeTime: "16:00",
    bedtime: "23:00",
    homework: "복습",
  };
  assert.equal(activityAt(c, at(10)).placeId, "university");
});
test("구버전 세계를 불러와도 장소 순서는 집 회사 고등학교 대학교 광장이다", () => {
  const w = defaultWorld();
  w.places.reverse();
  assert.deepEqual(
    normalizeWorld(w).places.map((p) => p.id),
    ["home", "office", "school", "university", "square"],
  );
});
test("함께 식사하는 캐릭터가 같은 식탁의 서로 다른 자리에 앉는다", () => {
  const w = defaultWorld();
  w.clock = at(19);
  const home = w.places.find((p) => p.id === "home")!;
  const a = chooseLifeIntent(w, w.characters[0], home, "식사", 0, {
      x: 30,
      y: 90,
    }),
    b = chooseLifeIntent(w, w.characters[1], home, "식사", 0, { x: 35, y: 90 });
  assert.equal(a.pose, "eat");
  assert.equal(a.furnitureId, b.furnitureId);
  assert.ok(a.anchor && b.anchor);
  assert.notDeepEqual(a.anchor, b.anchor);
  assert.equal(
    home.furniture.find((f) => f.id === a.furnitureId)!.label,
    "테이블",
  );
  const table = home.furniture.find((f) => f.id === a.furnitureId)!;
  assert.ok(table.y < 40);
});
test("취침 좌표는 침대 안이며 동작은 누운 자세다", () => {
  const w = defaultWorld();
  w.clock = at(23);
  const home = w.places.find((p) => p.id === "home")!;
  const intent = chooseLifeIntent(w, w.characters[0], home, "취침", 0, {
    x: 30,
    y: 90,
  });
  const bed = home.furniture.find((f) => f.id === intent.furnitureId)!;
  assert.equal(intent.pose, "sleep");
  assert.ok(intent.anchor);
  assert.ok(Math.abs(intent.anchor!.x - bed.x) < (bed.w ?? 18) / 2);
  assert.ok(Math.abs(intent.anchor!.y - bed.y) < (bed.h ?? 31) / 2);
  assert.equal(intent.rotation, bed.rotation || 0);
});
test("집 안의 자유 행동은 여러 목적지로 나뉜다", () => {
  const w = defaultWorld();
  w.clock = at(20);
  const home = w.places.find((p) => p.id === "home")!;
  const goals = Array.from({ length: 12 }, (_, i) =>
    chooseLifeIntent(w, w.characters[0], home, "놀이", i, { x: 30, y: 60 }),
  );
  assert.ok(new Set(goals.map((g) => JSON.stringify(g.approach))).size > 3);
  assert.ok(goals.some((g) => g.pose === "sit"));
});
test("누운 자세와 식탁 연결을 팝업으로 전달하면서 잘못된 자세는 제거한다", () => {
  const result = sanitizeMotion({
    a: {
      placeId: "home",
      x: 70,
      y: 22,
      facing: 1,
      walking: false,
      pose: "sleep",
      furnitureId: "bed",
      rotation: 270,
      scale: 0.85,
      label: "새근새근",
    },
    b: { placeId: "home", x: 30, y: 20, pose: "invalid" },
  });
  assert.equal(result.a.pose, "sleep");
  assert.equal(result.a.furnitureId, "bed");
  assert.equal(result.a.rotation, 270);
  assert.equal(result.b.pose, undefined);
});
