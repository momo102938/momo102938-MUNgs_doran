import {
  type World,
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
export { makeDefaultPlaces as defaultPlaces } from "./plans";
import { makeDefaultPlaces as defaultPlaces } from "./plans";
export function newCharacter(index: number): Character {
  return {
    id: uid(),
    name: String.fromCharCode(65 + index),
    image: DEFAULT_CHARACTER_IMAGE,
    age: 25,
    personality: index % 2 ? "다정하고 차분함" : "밝고 호기심이 많음",
    tone: index % 2 ? "차분한 존댓말" : "편안한 반말",
    politeToOlder: false,
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
      ["22:30", "씻기", "home"],
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
    pcSync: true,
    speed: 1,
    randomEvents: true,
    lastTalkAt: "",
    lastEventAt: "",
  };
}
