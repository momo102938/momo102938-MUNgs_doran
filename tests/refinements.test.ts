import { schoolForAge } from "../src/schools";
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultWorld } from "../src/defaults";
import { chooseLifeIntent } from "../src/life";
import { conversation, talk } from "../src/simulation";
import { usesPolite, sceneLines } from "../src/dialogue";
import { normalizeWorld } from "../src/storage";
const at = (hour: number) => new Date(2026, 10, 3, hour).toISOString();
test("식사 업무 휴식의 기본 이미지 배율은 걷기와 같은 1이다", () => {
  const w = defaultWorld(),
    home = w.places[0];
  w.clock = at(19);
  for (const action of ["식사", "공부", "놀이"] as const)
    assert.equal(
      chooseLifeIntent(w, w.characters[0], home, action, 0, { x: 30, y: 70 })
        .scale,
      1,
    );
});
test("침대를 0 90 180 270도 돌려도 머리 위치는 같은 베개 쪽이다", () => {
  const w = defaultWorld(),
    home = w.places[0],
    bed = home.furniture.find((f) => f.kind === "침대")!;
  w.clock = at(23);
  for (const rotation of [0, 90, 180, 270]) {
    bed.rotation = rotation;
    const intent = chooseLifeIntent(w, w.characters[0], home, "취침", 0, {
      x: 30,
      y: 70,
    });
    assert.equal(intent.rotation, rotation);
    const dx = (intent.anchor!.x - bed.x) * 9,
      dy = (intent.anchor!.y - bed.y) * 6,
      r = (-rotation * Math.PI) / 180;
    const localY = dx * Math.sin(r) + dy * Math.cos(r);
    assert.ok(localY < 0, "몸의 중심도 베개 가까이에 배치한다");
    assert.ok(Math.abs(localY - (-bed.h! * 0.32 + 3) * 6) < 0.001);
  }
});
test("연상 존댓말은 선택형이며 저장 왕복과 나이 변경에 반영된다", () => {
  const w = defaultWorld(),
    [a, b] = w.characters;
  a.age = 20;
  b.age = 25;
  a.tone = "편안한 반말";
  assert.equal(usesPolite(a, b), false);
  a.politeToOlder = true;
  assert.equal(usesPolite(a, b), true);
  assert.equal(normalizeWorld(w).characters[0].politeToOlder, true);
  b.age = 19;
  assert.equal(usesPolite(a, b), false);
});
test("회사 학교 대학교 대사는 각 장소의 일을 다룬다", () => {
  const w = defaultWorld(),
    [a, b] = w.characters;
  assert.ok(sceneLines("office", "출근", a, b).some((t) => /보고서/.test(t)));
  assert.ok(sceneLines("school", "등교", a, b).some((t) => /숙제/.test(t)));
  assert.ok(sceneLines("university", "등교", a, b).some((t) => /과제/.test(t)));
  a.schedule = [{ id: "x", time: "00:00", action: "출근", placeId: "office" }];
  b.schedule = [...a.schedule];
  w.logs = [
    {
      id: "q",
      at: w.clock,
      speakerId: b.id,
      targetId: a.id,
      text: "이 보고서 좀 봐 줄래?",
      kind: "대화",
    },
  ];
  assert.match(
    conversation(w, a, b, () => 0),
    /열어|고치/,
  );
  const next = talk(w, () => 0);
  assert.equal(next.logs.at(-1)!.speakerId, a.id);
});
test("씻기 일정은 욕실 가구를 찾아 거품 자세로 전달된다", () => {
  const w = defaultWorld(),
    home = w.places[0];
  const intent = chooseLifeIntent(w, w.characters[0], home, "씻기", 0, {
    x: 30,
    y: 70,
  });
  assert.equal(intent.pose, "wash");
  assert.equal(
    home.furniture.find((f) => f.id === intent.furnitureId)!.kind,
    "욕조",
  );
  assert.equal(
    normalizeWorld(w).characters[0].schedule.some((s) => s.action === "씻기"),
    true,
  );
});
test("구버전 기본 배치의 교탁 의자만 제거하고 사용자 가구는 보존한다", () => {
  const w = defaultWorld(),
    school = w.places.find((p) => p.id === "school")!;
  school.layoutVersion = 2;
  school.furniture.push(
    {
      id: "old",
      kind: "의자",
      label: "의자",
      x: 49,
      y: 13,
      w: 4,
      h: 5,
      rotation: 0,
    },
    {
      id: "mine",
      kind: "의자",
      label: "내 의자",
      x: 20,
      y: 20,
      w: 7,
      h: 7,
      rotation: 45,
    },
  );
  const p = normalizeWorld(w).places.find((p) => p.id === "school")!;
  assert.ok(!p.furniture.some((f) => f.id === "old"));
  assert.ok(p.furniture.some((f) => f.id === "mine" && f.rotation === 45));
});

test("직업 키워드에 따라 회사 대사가 구분되고 업무와 휴식을 번갈아 한다", () => {
  const w = defaultWorld(),
    [a, b] = w.characters;
  w.clock = at(10);
  a.job = "형사";
  const police = sceneLines("office", "출근", a, b);
  assert.ok(police.some((t) => t.includes("캡틴")));
  assert.ok(!police.some((t) => t.includes("코드 리뷰")));
  a.job = "디자이너";
  assert.ok(sceneLines("office", "출근", a, b).some((t) => t.includes("시안")));
  a.job = "개발자";
  assert.ok(
    sceneLines("office", "출근", a, b).some((t) => t.includes("코드 리뷰")),
  );
  a.job = "회사원";
  assert.ok(sceneLines("office", "출근", a, b).some((t) => t.includes("정리")));
  const office = w.places.find((p) => p.id === "office")!;
  const intents = Array.from({ length: 12 }, (_, turn) =>
    chooseLifeIntent(w, a, office, "출근", turn, { x: 30, y: 70 }),
  );
  assert.ok(intents.some((i) => i.pose === "work"));
  assert.ok(intents.some((i) => i.pose !== "work"));
  assert.ok(intents.every((i) => i.hold < 60));
});

test("성인 교사는 고등학교 출근과 교탁 수업을 할 수 있고 학생 나이 규칙은 유지한다", () => {
  const w = defaultWorld(),
    c = w.characters[0];
  for (const job of ["선생님", "선생", "교사", "강사", "교원"])
    assert.equal(schoolForAge("school", 38, job), "school");
  c.age = 38;
  c.job = "고등학교 교사";
  c.schedule = [
    { id: "teacher", time: "00:00", action: "수업", placeId: "school" },
  ];
  const n = normalizeWorld(w),
    teacher = n.characters[0],
    school = n.places.find((p) => p.id === "school")!;
  assert.equal(teacher.schedule[0].placeId, "school");
  assert.equal(
    chooseLifeIntent(n, teacher, school, "수업", 0, { x: 30, y: 70 }).label,
    "교탁에서 수업하는 중",
  );
  c.job = "대학생";
  assert.equal(
    normalizeWorld(w).characters[0].schedule[0].placeId,
    "university",
  );
});

test("보정된 새 도면의 사용자 회전은 다시 불러와도 바뀌지 않는다", () => {
  const w = defaultWorld(),
    p = w.places[0],
    chair = p.furniture.find((f) => f.kind === "의자" && f.rotation === 180)!;
  chair.rotation = 0;
  const n = normalizeWorld(w);
  assert.equal(
    n.places[0].furniture.find((f) => f.id === chair.id)!.rotation,
    0,
  );
});
