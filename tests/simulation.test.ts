import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultWorld } from "../src/defaults";
import {
  activityAt,
  advance,
  talk,
  conversation,
  randomEvent,
} from "../src/simulation";
import { normalizeWorld, safeImage } from "../src/storage";
const at = (h: number, m = 0) => new Date(2026, 10, 2, h, m).toISOString();
test("자정 이전의 마지막 일정은 다음 날 첫 일정까지 이어진다", () => {
  const c = defaultWorld().characters[0];
  assert.equal(activityAt(c, at(2)).action, "취침");
  assert.equal(activityAt(c, at(7, 20)).action, "기상");
  assert.equal(activityAt(c, at(9)).placeId, "office");
});
test("자녀의 등교 귀가 취침은 같은 시각 일반 일정보다 우선한다", () => {
  const c = defaultWorld().characters[0];
  c.child = {
    parentIds: [],
    schoolId: "school",
    schoolTime: "09:00",
    homeTime: "18:00",
    bedtime: "22:00",
    homework: "복습",
  };
  assert.deepEqual(activityAt(c, at(9)), { action: "등교", placeId: "school" });
  assert.equal(activityAt(c, at(18)).action, "귀가");
  assert.equal(activityAt(c, at(22)).action, "취침");
});
test("다른 장소나 취침 중에는 대화를 생성하지 않는다", () => {
  const w = defaultWorld();
  w.clock = at(10);
  w.characters[1].schedule = [
    { id: "x", time: "00:00", placeId: "school", action: "공부" },
  ];
  assert.equal(talk(w).logs.length, 0);
  w.characters[1].schedule = w.characters[0].schedule;
  w.clock = at(1);
  assert.equal(talk(w).logs.length, 0);
});
test("규칙 대사는 최근 문장을 피하고 대화와 기억을 함께 보관한다", () => {
  let w = defaultWorld();
  w.clock = at(19);
  const rng = () => 0;
  const first = conversation(w, w.characters[0], w.characters[1], rng);
  w.logs.push({
    id: "x",
    at: w.clock,
    speakerId: w.characters[0].id,
    targetId: w.characters[1].id,
    text: first,
    kind: "대화",
  });
  assert.notEqual(
    conversation(w, w.characters[0], w.characters[1], rng),
    first,
  );
  w = talk(w, rng);
  assert.equal(w.logs.length, 2);
  assert.equal(w.characters[0].memories.length, 1);
  assert.equal(w.characters[1].memories.length, 1);
});
test("미성년자 관계에서 연인 전용 대사를 선택하지 않는다", () => {
  const w = defaultWorld();
  w.clock = at(19);
  w.characters[0].age = 16;
  w.relationships[0].type = "연인";
  for (let i = 0; i < 50; i++) {
    const text = conversation(
      w,
      w.characters[0],
      w.characters[1],
      () => i / 50,
    );
    assert.ok(!text.includes("둘이 산책"));
  }
});
test("이전 저장본의 꾸민 공간과 빈 공간을 유지하고 기본 장소만 보충한다", () => {
  const w = defaultWorld();
  w.places = w.places.slice(0, 1);
  w.places[0].furniture = [];
  w.places[0].rooms = [];
  w.places[0].floor = "#123456";
  const n = normalizeWorld(w);
  assert.equal(n.places.length, 5);
  assert.equal(n.places[0].floor, "#123456");
  assert.deepEqual(n.places[0].furniture, []);
  assert.deepEqual(n.places[0].rooms, []);
  assert.equal(n.characters[0].id, w.characters[0].id);
});
test("불완전한 입력을 기본값으로 보정하고 미래 버전을 거절한다", () => {
  const n = normalizeWorld({
    characters: [
      null,
      { mood: 999, fatigue: -4, schedule: [null, {}], memories: [null, {}] },
    ],
    places: [null, { furniture: [null, {}], rooms: [null, {}] }],
    relationships: [null, {}],
    logs: [null, {}],
  });
  assert.ok(n.characters.length >= 2);
  assert.equal(n.characters[0].mood, 100);
  assert.equal(n.characters[0].fatigue, 0);
  assert.throws(() => normalizeWorld({ version: 999 }));
  assert.equal(safeImage("https://tracker.invalid/a.png"), "");
});
test("시간 변경과 사건은 수치를 0~100 범위 안에 유지한다", () => {
  let w = defaultWorld();
  w.clock = at(19);
  w.characters.forEach((c) => {
    c.mood = 100;
    c.fatigue = 100;
  });
  w = advance(w, at(20), () => 0);
  w = randomEvent(w, () => 0);
  for (const c of w.characters) {
    assert.ok(c.mood <= 100 && c.mood >= 0);
    assert.ok(c.fatigue <= 100 && c.fatigue >= 0);
  }
  assert.equal(w.logs.length, 3);
});
test("JSON 왕복으로 이미지, 기억, 일정과 가구 ID를 보존한다", () => {
  const w = talk(defaultWorld(), () => 0);
  const n = normalizeWorld(JSON.parse(JSON.stringify(w)));
  assert.equal(n.characters[0].image, w.characters[0].image);
  assert.deepEqual(n.characters[0].memories, w.characters[0].memories);
  assert.deepEqual(n.places, w.places);
  assert.deepEqual(n.characters[0].schedule, w.characters[0].schedule);
});
test("전개도 항목이 없던 구버전은 기본 도면으로 보완한다", () => {
  const w = normalizeWorld({ places: [{ id: "home", name: "내 집" }] });
  assert.ok(w.places[0].furniture.length > 0);
  assert.ok(w.places[0].rooms.length > 0);
});
test("자녀의 일반 점심 일정은 학교에서 이어진다", () => {
  const c = defaultWorld().characters[0];
  c.child = {
    parentIds: [],
    schoolId: "school",
    schoolTime: "08:30",
    homeTime: "16:00",
    bedtime: "22:00",
    homework: "복습",
  };
  assert.deepEqual(activityAt(c, at(12)), {
    action: "식사",
    placeId: "school",
  });
});
test("구버전 사용자 배치를 유지하면서 대학교와 구조 편집 기본값을 보완한다", () => {
  const w = defaultWorld();
  w.version = 1;
  w.places = w.places.filter((p) => p.id !== "university");
  w.places[0].furniture = [
    {
      id: "my-wall",
      kind: "벽",
      label: "직접 만든 벽",
      x: 12,
      y: 18,
      w: 42,
      h: 0.5,
      rotation: 90,
      color: "#123456",
    },
  ];
  w.places[0].rooms = [];
  const n = normalizeWorld(JSON.parse(JSON.stringify(w)));
  assert.ok(n.places.some((p) => p.id === "university"));
  assert.deepEqual(n.places[0].furniture, w.places[0].furniture);
  assert.deepEqual(n.places[0].rooms, []);
});
test("대학교도 일정 장소로 저장하고 해당 시각에 등교한다", () => {
  const w = defaultWorld();
  w.characters[0].schedule = [
    { id: "uni", time: "09:00", action: "등교", placeId: "university" },
  ];
  const n = normalizeWorld(JSON.parse(JSON.stringify(w)));
  assert.deepEqual(activityAt(n.characters[0], at(10)), {
    action: "등교",
    placeId: "university",
  });
});
test("가구 크기 회전 색상과 방 무늬를 JSON에 유지한다", () => {
  const w = defaultWorld();
  const f = w.places[0].furniture.find((f) => f.kind === "소파")!;
  Object.assign(f, {
    x: 46,
    y: 52,
    w: 19,
    h: 28,
    rotation: 90,
    color: "#aabbcc",
  });
  Object.assign(w.places[0].rooms[0], {
    pattern: "tile",
    radius: 12,
    border: true,
  });
  const n = normalizeWorld(JSON.parse(JSON.stringify(w)));
  assert.deepEqual(n.places[0], w.places[0]);
});
