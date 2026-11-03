import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultWorld } from "../src/defaults";
import { normalizeWorld } from "../src/storage";
import { chooseLifeIntent } from "../src/life";
import { buildWalkGrid, planRoute } from "../src/navigation";
import { schoolForAge } from "../src/schools";
import { isUntouchedLegacyHome } from "../src/layoutUpgrade";
import type { Place } from "../src/types";
const legacyHome = () =>
  JSON.parse(
    readFileSync(new URL("./fixtures/home-v3.json", import.meta.url), "utf8"),
  ) as Place;

test("이전 기본 집에는 베란다를 보충하고 직접 꾸민 집은 그대로 둔다", () => {
  const w = defaultWorld(),
    old = legacyHome();
  w.places[0] = old;
  assert.equal(isUntouchedLegacyHome(old), true);
  const upgraded = normalizeWorld(w).places[0];
  assert.ok(upgraded.rooms.some((r) => r.name === "베란다"));
  const custom = legacyHome();
  custom.furniture.find((f) => f.kind === "소파")!.x += 1;
  w.places[0] = custom;
  const kept = normalizeWorld(w).places[0];
  assert.ok(!kept.rooms.some((r) => r.name === "베란다"));
  assert.equal(kept.furniture.find((f) => f.kind === "소파")!.x, 11);
});
test("베란다 바람 쐬기 위치까지 벽을 피해 문으로 걸어갈 수 있다", () => {
  const w = defaultWorld(),
    home = w.places[0],
    c = w.characters[0];
  const intent = chooseLifeIntent(w, c, home, "바람 쐬기", 0, { x: 40, y: 85 });
  assert.match(intent.label, /베란다/);
  const path = planRoute(
    buildWalkGrid(home),
    { x: 40, y: 85 },
    intent.approach,
  );
  assert.ok(path.at(-1)!.x < 13);
  assert.ok(Math.abs(path.at(-1)!.y - intent.approach.y) < 4);
  const free = Array.from({ length: 25 }, (_, i) =>
    chooseLifeIntent(w, c, home, "놀이", i, { x: 40, y: 85 }),
  );
  assert.ok(free.some((i) => i.label.includes("베란다")));
});
test("교수의 회사와 학교 일정은 대학교로 연결하고 선생님은 고등학교를 선택할 수 있다", () => {
  for (const job of ["교수", "부교수", "초빙 교수"]) {
    assert.equal(schoolForAge("school", 38, job), "university");
    assert.equal(schoolForAge("office", 38, job), "university");
    assert.equal(schoolForAge("home", 38, job), "home");
  }
  for (const job of ["선생님", "교사", "강사"])
    assert.equal(schoolForAge("school", 38, job), "school");
});
test("기본 의자의 등받이는 식탁과 책상에서 바깥 방향을 향한다", () => {
  const places = defaultWorld().places;
  const home = places[0];
  const facing = (x: number, y: number) =>
    home.furniture.find((f) => f.kind === "의자" && f.x === x && f.y === y)!
      .rotation || 0;
  assert.equal(facing(33, 14), 0);
  assert.equal(facing(33, 36), 180);
  assert.equal(facing(25, 25), 90);
  assert.equal(facing(41, 25), 270);
  for (const id of ["school", "university"]) {
    const p = places.find((p) => p.id === id)!;
    for (const desk of p.furniture.filter((f) => f.kind === "강의책상")) {
      const chair = p.furniture.find(
        (f) =>
          f.kind === "의자" &&
          f.x === desk.x &&
          f.y > desk.y &&
          f.y < desk.y + 8,
      )!;
      assert.equal(chair.rotation, 180);
    }
  }
});

test("이전 파일의 수동 시간 모드는 PC 연동으로 바꾸고 팝업의 정지 시각은 유지한다", () => {
  const w = defaultWorld();
  w.pcSync = false;
  w.speed = 60;
  w.clock = "2026-11-03T07:30:00.000Z";
  const loaded = normalizeWorld(w);
  assert.equal(loaded.pcSync, true);
  assert.equal(loaded.speed, 1);
  assert.equal(loaded.clock, w.clock);
  assert.ok(Math.abs(Date.parse(defaultWorld().clock) - Date.now()) < 2000);
});

test("주방에서 베란다 위쪽을 바로 통과하지 않고 거실 미닫이창으로 우회한다", () => {
  const home = defaultWorld().places[0];
  assert.ok(
    home.furniture.some((f) => f.kind === "벽" && f.x === 7 && f.y === 47),
  );
  assert.ok(
    home.furniture.some(
      (f) => f.kind === "미닫이창" && f.x === 13 && f.y === 56,
    ),
  );
  const path = planRoute(buildWalkGrid(home), { x: 7, y: 38 }, { x: 7, y: 64 });
  assert.ok(path.length > 0);
  assert.ok(path.at(-1)!.x < 13);
  const firstBelow = path.find((p) => p.y > 47)!;
  assert.ok(firstBelow.x > 13, "주방과 베란다 사이 벽을 통과해서는 안 된다");
  const crossing = path.filter((p) => p.x <= 13 && p.y > 47 && p.y < 65);
  assert.ok(crossing.length > 0);
});
test("이전 기본 베란다 출입문만 미닫이창으로 보정하고 다른 가구는 유지한다", () => {
  const w = defaultWorld(),
    home = w.places[0];
  home.layoutVersion = 4;
  const window = home.furniture.find((f) => f.kind === "미닫이창")!;
  window.kind = "문";
  window.h = 12;
  window.label = "문";
  home.furniture = home.furniture.filter(
    (f) => !(f.kind === "벽" && f.x === 7 && f.y === 47),
  );
  home.furniture.find((f) => f.kind === "소파")!.x = 23;
  const n = normalizeWorld(w).places[0];
  assert.equal(n.furniture.find((f) => f.id === window.id)!.kind, "미닫이창");
  assert.equal(n.furniture.find((f) => f.kind === "소파")!.x, 23);
  assert.ok(
    n.furniture.some((f) => f.kind === "벽" && f.x === 7 && f.y === 47),
  );
  assert.equal(
    normalizeWorld({
      ...w,
      places: [n, ...w.places.slice(1)],
    }).places[0].furniture.filter((f) => f.kind === "미닫이창").length,
    1,
  );
});
