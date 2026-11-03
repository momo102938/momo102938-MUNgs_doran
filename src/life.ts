import { isTeacher } from "./schools";
import type { Action, Character, Furniture, Place, World } from "./types";
import type { MotionMap } from "./motion";
import { activityAt } from "./simulation";
import { nearFurniture, type Point } from "./navigation";
import { FURNITURE_META } from "./planSpec";
export type LifePose =
  "stand" | "sit" | "eat" | "work" | "sleep" | "talk" | "wash";
export interface LifeIntent {
  approach: Point;
  anchor?: Point;
  pose: LifePose;
  furnitureId?: string;
  rotation: number;
  scale: number;
  label: string;
  hold: number;
  facing: 1 | -1;
}
export const freeActions: Action[] = [
  "놀이",
  "대화",
  "귀가",
  "기상",
  "바람 쐬기",
];
export const seedOf = (s: string) =>
  Array.from(s).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
const distance = (a: Point, b: Point) =>
  Math.hypot((a.x - b.x) * 9, (a.y - b.y) * 6);
function localPoint(o: Furniture, dx: number, dy: number): Point {
  const r = ((o.rotation || 0) * Math.PI) / 180;
  return {
    x: o.x + (dx * 9 * Math.cos(r) - dy * 6 * Math.sin(r)) / 9,
    y: o.y + (dx * 9 * Math.sin(r) + dy * 6 * Math.cos(r)) / 6,
  };
}
const empty = (approach: Point, label: string, hold: number): LifeIntent => ({
  approach,
  pose: "stand",
  rotation: 0,
  scale: 1,
  label,
  hold,
  facing: 1,
});
function seatAt(place: Place, table: Furniture, index: number): Point {
  const meta = FURNITURE_META[table.kind];
  const chairs = place.furniture
    .filter(
      (o) =>
        o.kind === "의자" &&
        distance(o, table) <
          Math.max((table.w ?? meta.w) * 9, (table.h ?? meta.h) * 6) * 0.65 +
            65,
    )
    .sort(
      (a, b) =>
        Math.atan2(a.y - table.y, a.x - table.x) -
        Math.atan2(b.y - table.y, b.x - table.x),
    );
  if (chairs[index]) return { x: chairs[index].x, y: chairs[index].y };
  const w = table.w ?? meta.w,
    h = table.h ?? meta.h;
  const seats = [
    [0, -h / 2 - 4],
    [0, h / 2 + 4],
    [-w / 2 - 4, 0],
    [w / 2 + 4, 0],
    [-w * 0.25, h / 2 + 4],
    [w * 0.25, -h / 2 - 4],
  ];
  const [dx, dy] = seats[index % seats.length];
  return localPoint(table, dx, dy);
}
function diningTable(place: Place) {
  return place.furniture
    .filter((o) => o.kind === "테이블" || o.kind === "카페")
    .sort((a, b) => score(b) - score(a))[0];
  function score(o: Furniture) {
    const kitchen = place.rooms.some(
      (r) =>
        /주방|식당|다이닝|라운지|탕비/.test(r.name) &&
        o.x >= r.x &&
        o.x <= r.x + r.w &&
        o.y >= r.y &&
        o.y <= r.y + r.h,
    );
    return (
      (/식탁|밥상|식사/.test(o.label) ? 100 : 0) +
      (kitchen ? 60 : 0) +
      (o.kind === "테이블" ? 10 : 0)
    );
  }
}
export function chooseLifeIntent(
  w: World,
  c: Character,
  place: Place,
  action: Action,
  turn: number,
  current: Point,
  poses: MotionMap = {},
): LifeIntent {
  const people = w.characters.filter((x) => {
    const a = activityAt(x, w.clock);
    return a.placeId === place.id && a.action === action;
  });
  const index = Math.max(
    0,
    people.findIndex((x) => x.id === c.id),
  );
  const seed = seedOf(c.id) + turn * 977,
    hold = 3 + (seed % 6);
  const balcony = place.rooms.find((r) => /베란다/.test(r.name));
  if (
    balcony &&
    (action === "바람 쐬기" ||
      (freeActions.includes(action) && turn > 0 && seed % 5 === 0))
  ) {
    const point = {
      x: balcony.x + balcony.w * 0.5,
      y: balcony.y + balcony.h * 0.33,
    };
    return {
      ...empty(point, "베란다에서 바람 쐬는 중", 8 + (seed % 7)),
      anchor: point,
    };
  }
  if (action === "취침") {
    const beds = place.furniture.filter(
      (o) => o.kind === "침대" || o.kind === "1인 침대",
    );
    if (beds.length) {
      let slots = beds.flatMap((b) =>
        Array.from(
          { length: b.kind === "1인 침대" ? 1 : (b.w ?? 18) >= 12 ? 2 : 1 },
          (_, i) => ({
            bed: b,
            slot: i,
            capacity: b.kind === "1인 침대" ? 1 : (b.w ?? 18) >= 12 ? 2 : 1,
          }),
        ),
      );
      if (index >= slots.length)
        return empty(nearFurniture(beds[0], index), "잠잘 자리를 찾는 중", 15);
      const { bed, slot, capacity } = slots[index];
      const anchor = localPoint(
        bed,
        capacity === 2 ? (slot === 0 ? -1 : 1) * (bed.w ?? 18) * 0.19 : 0,
        -(bed.h ?? 31) * 0.32 + 3,
      );
      return {
        ...empty(nearFurniture(bed, index), "새근새근", 9999),
        anchor,
        pose: "sleep",
        furnitureId: bed.id,
        rotation: bed.rotation || 0,
        scale: 1,
      };
    }
  }
  if (action === "씻기") {
    const bath =
      place.furniture.find((o) => o.kind === "욕조") ||
      place.furniture.find((o) => o.kind === "세면대");
    if (bath) {
      const point = nearFurniture(bath, index);
      return {
        ...empty(point, "뽀득뽀득 씻는 중", 9999),
        anchor: point,
        pose: "wash",
        furnitureId: bath.id,
      };
    }
    return { ...empty(current, "뽀득뽀득 씻는 중", 9999), pose: "wash" };
  }
  if (action === "식사") {
    const table = diningTable(place);
    if (table) {
      const seat = seatAt(place, table, index);
      return {
        ...empty(seat, "냠냠, 식사 중", 9999),
        anchor: seat,
        pose: "eat",
        furnitureId: table.id,
        scale: 1,
        facing: seat.x > table.x ? -1 : 1,
      };
    }
  }
  const teachingPlace =
    (place.id === "school" || place.id === "university") && isTeacher(c.job);
  if (
    teachingPlace &&
    (action === "수업" ||
      ((action === "출근" || action === "등교") && turn % 3 === 0))
  ) {
    const podium = place.furniture.find((f) => f.kind === "교탁");
    if (podium) {
      const point = localPoint(podium, 0, -(podium.h ?? 9) / 2 - 3);
      return {
        ...empty(point, "교탁에서 수업하는 중", 22 + (seed % 12)),
        anchor: point,
        pose: "talk",
        furnitureId: podium.id,
      };
    }
  }
  const working = ["출근", "등교", "공부", "수업"].includes(action);
  const takingBreak =
    working && turn > 0 && (turn + (seedOf(c.id) % 3)) % 4 === 3;
  if (working && !takingBreak) {
    const desks = place.furniture.filter((o) =>
      ["책상", "강의책상"].includes(o.kind),
    );
    if (desks.length) {
      const desk = teachingPlace
          ? desks[(index + turn) % desks.length]
          : desks[index % desks.length],
        seat = seatAt(place, desk, 0);
      return {
        ...empty(
          seat,
          action === "출근" || teachingPlace
            ? /경찰|형사|수사|보안관|FBI/i.test(c.job)
              ? "수사 기록을 정리하는 중"
              : /디자인|디자이너|일러스트|아트/.test(c.job)
                ? "시안을 다듬는 중"
                : /개발|프로그래머/.test(c.job)
                  ? "코드를 확인하는 중"
                  : /교사|선생|교수|강사|교원/.test(c.job)
                    ? "수업 자료를 준비하는 중"
                    : "업무를 차근차근 처리하는 중"
            : "집중해서 공부 중",
          18 + (seed % 15),
        ),
        anchor: seat,
        pose: "work",
        furnitureId: desk.id,
        scale: 1,
      };
    }
  }
  if (freeActions.includes(action) || takingBreak) {
    if (takingBreak && seed % 3 === 0) {
      const water = place.furniture.find(
        (f) => f.kind === "세면대" || /커피|탕비/.test(f.label),
      );
      if (water)
        return empty(
          nearFurniture(water, index),
          "잠깐 물 한 잔 마시는 중",
          hold + 3,
        );
    }
    const peers = w.characters.filter(
      (x) =>
        x.id !== c.id &&
        activityAt(x, w.clock).placeId === place.id &&
        activityAt(x, w.clock).action !== "취침",
    );
    // 서로 다른 주기로 걷고, 가끔 가까운 사람에게 다가간다. 항상 같은 경로를 따라가지는 않는다.
    if (
      turn > 0 &&
      peers.length &&
      (seed % 5 === 0 || (action === "대화" && turn % 3 === 1))
    ) {
      const peer = peers[seed % peers.length],
        p = poses[peer.id];
      if (p?.placeId === place.id) {
        return {
          ...empty(
            { x: p.x + (seed % 2 ? 7 : -7), y: p.y + 3 },
            `${peer.name}와 잠깐 이야기`,
            hold + 3,
          ),
          pose: "talk",
          facing: p.x > current.x ? 1 : -1,
        };
      }
    }
    if (turn === 0 || seed % 4 === 0) {
      const sofas = place.furniture.filter(
        (o) => o.kind === "소파" || o.kind === "벤치",
      );
      if (sofas.length) {
        const sofa = sofas[(seed + index) % sofas.length],
          meta = FURNITURE_META[sofa.kind];
        const seat = localPoint(
          sofa,
          0,
          sofa.kind === "소파"
            ? ((index % 2) - 0.5) * (sofa.h ?? meta.h) * 0.36
            : 0,
        );
        return {
          ...empty(nearFurniture(sofa, index), "잠깐 앉아서 쉬는 중", hold + 4),
          anchor: seat,
          pose: "sit",
          furnitureId: sofa.id,
          scale: 1,
        };
      }
    }
    const kinds =
      seed % 3 === 0
        ? ["책장", "화분"]
        : seed % 3 === 1
          ? ["창문", "나무"]
          : ["러그", "분수"];
    const props = place.furniture.filter((o) => kinds.includes(o.kind));
    if (props.length && seed % 2) {
      const o = props[seed % props.length];
      return empty(
        nearFurniture(o, index),
        o.kind === "책장"
          ? "책을 고르는 중"
          : o.kind === "화분"
            ? "화분을 살펴보는 중"
            : o.kind === "창문"
              ? "창밖을 바라보는 중"
              : "느긋하게 구경 중",
        hold,
      );
    }
    const rooms = place.rooms.filter(
      (r) => r.w > 12 && r.h > 12 && !/욕실|화장실/.test(r.name),
    );
    const room = rooms[seed % Math.max(1, rooms.length)];
    const point = room
      ? {
          x: room.x + room.w * (0.25 + (seed % 51) / 100),
          y: room.y + room.h * (0.25 + ((seed >>> 6) % 51) / 100),
        }
      : { x: 10 + (seed % 80), y: 10 + ((seed >>> 8) % 80) };
    return empty(
      point,
      takingBreak
        ? "잠깐 몸을 푸는 중"
        : place.id === "home"
          ? "집 안을 느긋하게 걷는 중"
          : "주변을 느긋하게 걷는 중",
      hold,
    );
  }
  return empty(current, action, hold);
}
export function intentIsReachable(end: Point, intent: LifeIntent) {
  return distance(end, intent.approach) < 75;
}
