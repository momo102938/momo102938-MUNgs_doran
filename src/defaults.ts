import {
  type World,
  type Place,
  type Furniture,
  type Character,
  WORLD_VERSION,
  DEFAULT_CHARACTER_IMAGE,
} from "./types";
// ID는 인증용이 아니며, HTTP 로컬 미리보기에서도 생성할 수 있어야 한다.
export const uid = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) =>
        n.toString(16).padStart(8, "0"),
      ).join("-");
const f = (
  kind: Furniture["kind"],
  x: number,
  y: number,
  label: string = kind,
): Furniture => ({ id: uid(), kind, x, y, label });
export function defaultPlaces(): Place[] {
  return [
    {
      id: "home",
      name: "집",
      floor: "#e9dfc9",
      rooms: [
        { name: "주방 · 다이닝", x: 0, y: 0, w: 60, h: 40, color: "#eee1c7" },
        { name: "거실", x: 0, y: 40, w: 60, h: 60, color: "#ede0c3" },
        { name: "침실", x: 60, y: 0, w: 40, h: 44, color: "#e8ddc9" },
        { name: "복도", x: 60, y: 44, w: 40, h: 16, color: "#eee1cb" },
        { name: "욕실", x: 60, y: 60, w: 18, h: 40, color: "#dbe5db" },
        { name: "서재", x: 78, y: 60, w: 22, h: 40, color: "#e9ddc5" },
      ],
      furniture: [
        f("소파", 13, 66),
        f("테이블", 32, 66),
        f("테이블", 29, 22, "식탁"),
        f("침대", 80, 22),
        f("책상", 88, 78),
        f("화분", 51, 12),
        f("화분", 8, 91),
        f("화분", 94, 92),
        f("메모", 68, 81, "수건과 비누"),
      ],
    },
    {
      id: "office",
      name: "회사",
      floor: "#d7c3ad",
      rooms: [
        { name: "업무 공간", x: 0, y: 0, w: 68, h: 100, color: "#d7c3ad" },
        { name: "회의실", x: 68, y: 0, w: 32, h: 50, color: "#e6d9c8" },
        { name: "휴게실", x: 68, y: 50, w: 32, h: 50, color: "#e4e8d6" },
      ],
      furniture: [
        f("책상", 18, 28),
        f("책상", 47, 28),
        f("책상", 18, 65),
        f("책상", 47, 65),
        f("테이블", 84, 27),
        f("소파", 84, 70),
        f("화분", 7, 89),
      ],
    },
    {
      id: "school",
      name: "도란 고등학교",
      floor: "#eed4a2",
      rooms: [
        { name: "교실", x: 0, y: 0, w: 78, h: 100, color: "#eed4a2" },
        { name: "복도", x: 78, y: 0, w: 22, h: 100, color: "#eee8d4" },
      ],
      furniture: [
        f("책상", 35, 16, "교탁"),
        ...Array.from({ length: 9 }, (_, i) =>
          f("책상", 17 + (i % 3) * 24, 40 + Math.floor(i / 3) * 23),
        ),
        f("화분", 89, 15),
      ],
    },
    {
      id: "square",
      name: "광장",
      floor: "#b8c6a6",
      rooms: [
        { name: "나무 그늘", x: 0, y: 0, w: 32, h: 100, color: "#a3bc98" },
        { name: "산책길", x: 32, y: 0, w: 36, h: 100, color: "#e8d9bd" },
        { name: "작은 정원", x: 68, y: 0, w: 32, h: 100, color: "#b8c6a6" },
      ],
      furniture: [
        f("소파", 16, 30, "공원 벤치"),
        f("소파", 84, 70, "공원 벤치"),
        f("테이블", 51, 48, "분수대"),
        f("화분", 15, 77),
        f("화분", 85, 22),
        f("메모", 50, 86, "오늘도 좋은 하루"),
      ],
    },
  ];
}
export function newCharacter(index: number): Character {
  return {
    id: uid(),
    name: String.fromCharCode(65 + index),
    image: DEFAULT_CHARACTER_IMAGE,
    age: 25,
    personality: index % 2 ? "다정하고 차분함" : "밝고 호기심이 많음",
    tone: index % 2 ? "차분한 존댓말" : "편안한 반말",
    job: "직장인",
    likes: index % 2 ? "책, 커피" : "산책, 음악",
    dislikes: "큰 소음",
    habits: "아침에 창문 열기",
    mood: 75,
    fatigue: 20,
    lines:
      index % 2
        ? ["오늘은 좀 어땠어요?", "잠깐 쉬었다 할까요?"]
        : ["같이 있으니까 좋다.", "오늘 저녁에는 뭐 먹을까?"],
    schedule: [
      ["07:00", "기상", "home"],
      ["07:30", "식사", "home"],
      ["09:00", "출근", "office"],
      ["12:00", "식사", "office"],
      ["18:00", "귀가", "home"],
      ["19:00", "식사", "home"],
      ["20:00", "대화", "home"],
      ["21:00", "놀이", "square"],
      ["22:00", "귀가", "home"],
      ["23:00", "취침", "home"],
    ].map(([time, action, placeId]) => ({
      id: uid(),
      time,
      action: action as Character["schedule"][number]["action"],
      placeId,
    })),
    memories: [],
    child: null,
  };
}
export function defaultWorld(): World {
  const a = newCharacter(0),
    b = newCharacter(1);
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  return {
    version: WORLD_VERSION,
    name: "도란",
    characters: [a, b],
    places: defaultPlaces(),
    relationships: [
      { id: uid(), a: a.id, b: b.id, type: "룸메이트", intimacy: 65 },
    ],
    logs: [],
    clock: d.toISOString(),
    pcSync: false,
    speed: 10,
    randomEvents: true,
    lastTalkAt: "",
    lastEventAt: "",
  };
}
