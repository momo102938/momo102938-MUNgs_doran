import { isUntouchedLegacyHome } from "./layoutUpgrade";
import { orderPlaces, schoolForAge } from "./schools";
import {
  ACTIONS,
  RELATION_TYPES,
  MAX_CHARACTERS,
  MAX_LINES,
  STORAGE_KEY,
  WORLD_VERSION,
  DEFAULT_CHARACTER_IMAGE,
  FURNITURE_KINDS,
  type World,
  type Character,
  type Schedule,
  type Place,
  type FurnitureKind,
} from "./types";
import { FURNITURE_META } from "./planSpec";
import { defaultWorld, newCharacter, uid } from "./defaults";
const obj = (v: unknown): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, any>)
    : {};
const text = (v: unknown, d = "", max = 1000) =>
  typeof v === "string" ? v.slice(0, max) : d;
const list = (v: unknown): any[] =>
  Array.isArray(v) ? v.filter((x) => x != null) : [];
const number = (v: unknown, d: number, min = 0, max = 100) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : d;
export const validTime = (v: unknown, d = "09:00") =>
  typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : d;
const date = (v: unknown, d = "") =>
  typeof v === "string" && Number.isFinite(Date.parse(v))
    ? new Date(v).toISOString()
    : d;
export function safeImage(v: unknown, d = ""): string {
  const s = text(v, "", 3_000_000);
  // 이전 기본 SD만 새 자리표시자로 바꾸고, 직접 업로드한 PNG는 유지한다.
  if (s === "./characters/a.png" || s === "./characters/b.png")
    return DEFAULT_CHARACTER_IMAGE;
  return /^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(s) ||
    s === DEFAULT_CHARACTER_IMAGE
    ? s
    : d;
}
export function normalizeWorld(input: unknown): World {
  const raw = obj(input);
  if (raw.version > WORLD_VERSION)
    throw new Error(
      "더 최신 버전에서 저장한 파일이에요. 프로그램을 업데이트해 주세요.",
    );
  const d = defaultWorld();
  const seen = new Set<string>();
  const places: Place[] = list(raw.places)
    .slice(0, 30)
    .map((p, i) => {
      p = obj(p);
      let id = text(p.id, `place-${i}`, 80);
      if (!id || seen.has(id)) id = uid();
      seen.add(id);
      return {
        id,
        name: text(p.name, `장소 ${i + 1}`, 40),
        layoutVersion: number(p.layoutVersion, 0, 0, 6),
        floor: /^#[a-f\d]{6}$/i.test(p.floor) ? p.floor : "#e7ceaa",
        rooms: list(p.rooms ?? d.places.find((x) => x.id === id)?.rooms)
          .slice(0, 40)
          .map((r) => ({
            id: text(r.id, uid(), 80),
            pattern: ["wood", "tile", "grass", "plain"].includes(r.pattern)
              ? r.pattern
              : "wood",
            border: r.border !== false,
            radius: number(r.radius, 0, 0, 40),
            name: text(r.name, "공간", 40),
            x: number(r.x, 0),
            y: number(r.y, 0),
            w: number(r.w, 50, 1),
            h: number(r.h, 50, 1),
            color: /^#[a-f\d]{6}$/i.test(r.color) ? r.color : "#e7ceaa",
          })),
        furniture: list(
          p.furniture ?? d.places.find((x) => x.id === id)?.furniture,
        )
          .slice(0, 200)
          .map((f) => ({
            id: text(f.id, uid(), 80),
            kind: FURNITURE_KINDS.includes(f.kind) ? f.kind : "메모",
            w: number(
              f.w,
              FURNITURE_META[
                FURNITURE_KINDS.includes(f.kind)
                  ? (f.kind as FurnitureKind)
                  : "메모"
              ].w,
              0.5,
              100,
            ),
            h: number(
              f.h,
              FURNITURE_META[
                FURNITURE_KINDS.includes(f.kind)
                  ? (f.kind as FurnitureKind)
                  : "메모"
              ].h,
              0.5,
              100,
            ),
            rotation:
              (Math.round(number(f.rotation, 0, 0, 359) / 45) * 45) % 360,
            color: /^#[a-f\d]{6}$/i.test(f.color) ? f.color : "",
            label: text(f.label, "가구", 60),
            x: number(f.x, 50),
            y: number(f.y, 50),
          })),
      };
    });
  for (const p of places) {
    if ((p.layoutVersion || 0) >= 3) continue;
    p.furniture = p.furniture.filter(
      (f) =>
        !(
          f.kind === "의자" &&
          f.label === "의자" &&
          (f.rotation || 0) === 0 &&
          ((p.id === "school" &&
            f.x === 49 &&
            f.y === 13 &&
            f.w === 4 &&
            f.h === 5) ||
            (p.id === "university" &&
              f.x === 30 &&
              f.y === 11 &&
              f.w === 4 &&
              f.h === 5))
        ),
    );
    const corrected = d.places.find((d) => d.id === p.id);
    for (const f of p.furniture) {
      if (f.kind !== "의자" && f.kind !== "소파") continue;
      const match = corrected?.furniture.find(
        (d) =>
          d.kind === f.kind &&
          d.x === f.x &&
          d.y === f.y &&
          d.w === f.w &&
          d.h === f.h &&
          d.label === f.label,
      );
      if (
        match &&
        ((f.rotation || 0) === 0 ||
          (p.id === "home" && f.x === 34 && f.y === 27 && f.rotation === 90) ||
          (p.id === "office" && f.x === 94 && f.y === 55 && f.rotation === 90))
      )
        f.rotation = match.rotation;
    }
    p.layoutVersion = 3;
  }
  for (const p of places) {
    if ((p.layoutVersion || 0) >= 4) continue;
    if (isUntouchedLegacyHome(p)) {
      const home = d.places.find((d) => d.id === "home")!;
      p.rooms = home.rooms;
      p.furniture = home.furniture;
    }
    p.layoutVersion = 4;
  }
  for (const p of places) {
    if (p.id !== "home" || (p.layoutVersion || 0) >= 5) continue;
    const balcony = p.rooms.find(
      (r) =>
        r.name === "베란다" &&
        r.x === 1 &&
        r.y === 47 &&
        r.w === 12 &&
        r.h === 52,
    );
    const entry = p.furniture.find(
      (f) =>
        f.kind === "문" &&
        f.x === 13 &&
        f.y === 56 &&
        f.w === 8 &&
        f.h === 12 &&
        f.rotation === 90 &&
        f.label === "문",
    );
    if (balcony && entry) {
      entry.kind = "미닫이창";
      entry.h = 3;
      entry.label = "베란다 미닫이창";
      if (
        !p.furniture.some((f) => f.kind === "벽" && f.y === 47 && f.x === 7)
      ) {
        const wall = d.places
          .find((p) => p.id === "home")!
          .furniture.find((f) => f.kind === "벽" && f.x === 7 && f.y === 47)!;
        p.furniture.push({ ...wall, id: uid() });
      }
    }
    p.layoutVersion = 5;
  }
  for (const p of places) {
    if (p.id !== "home" || (p.layoutVersion || 0) >= 6) continue;
    const moves = [
      ["싱크대", 7, 24, 8, 29, 7, 31],
      ["냉장고", 16, 17, 7, 13, 7, 8],
      ["테이블", 26, 27, 10, 12, 33, 25],
      ["의자", 26, 17, 4, 6, 33, 14],
      ["의자", 26, 38, 4, 6, 33, 36],
      ["의자", 18, 27, 4, 6, 25, 25],
      ["의자", 34, 27, 4, 6, 41, 25],
    ] as const;
    for (const [kind, x, y, w, h, nx, ny] of moves) {
      const f = p.furniture.find(
        (f) =>
          f.kind === kind &&
          f.x === x &&
          f.y === y &&
          f.w === w &&
          f.h === h &&
          f.label === kind,
      );
      if (f) {
        f.x = nx;
        f.y = ny;
      }
    }
    const entry = p.furniture.find(
      (f) =>
        f.kind === "문" &&
        f.x === 59 &&
        f.y === 56 &&
        f.w === 8 &&
        f.h === 12 &&
        f.rotation === 90 &&
        f.label === "문",
    );
    const wall = p.furniture.find(
      (f) =>
        f.kind === "벽" &&
        f.x === 59 &&
        f.y === 50 &&
        f.w === 1.3 &&
        f.h === 98,
    );
    if (entry && wall) {
      p.furniture = p.furniture.filter((f) => f !== entry && f !== wall);
      p.furniture.push(
        { ...wall, id: uid(), y: 25.5, h: 49 },
        { ...wall, id: uid(), y: 80.5, h: 37 },
      );
    }
    p.layoutVersion = 6;
  }
  if (!places.length) places.push(...d.places);
  // 구버전에는 일부 기본 장소가 없을 수 있다. 기존 배치는 그대로 둔다.
  for (const p of d.places)
    if (!places.some((x) => x.id === p.id)) places.push(p);
  const placeId = (v: unknown) =>
    places.some((p) => p.id === v) ? (v as string) : "home";
  seen.clear();
  const characters: Character[] = list(raw.characters)
    .slice(0, MAX_CHARACTERS)
    .map((c, i) => {
      c = obj(c);
      const base = newCharacter(i);
      let id = text(c.id, base.id, 80);
      if (!id || seen.has(id)) id = uid();
      seen.add(id);
      const schedule: Schedule[] = list(c.schedule)
        .slice(0, 60)
        .map((s) => ({
          id: text(s.id, uid(), 80),
          time: validTime(s.time),
          action: ACTIONS.includes(s.action) ? s.action : "놀이",
          placeId: placeId(s.placeId),
        }));
      return {
        ...base,
        id,
        name: text(c.name, base.name, 30),
        image: safeImage(c.image, base.image),
        age: number(c.age, 25, 0, 120),
        personality: text(c.personality, base.personality, 200),
        tone: text(c.tone, base.tone, 200),
        politeToOlder: c.politeToOlder === true,
        job: text(c.job, base.job, 100),
        likes: text(c.likes, "", 200),
        dislikes: text(c.dislikes, "", 200),
        habits: text(c.habits, "", 200),
        mood: number(c.mood, 75),
        fatigue: number(c.fatigue, 20),
        lines: list(c.lines)
          .filter((x) => typeof x === "string" && x.trim())
          .slice(0, MAX_LINES)
          .map((x) => text(x, "", 300)),
        schedule: schedule.length ? schedule : base.schedule,
        memories: list(c.memories)
          .slice(-100)
          .map((m) => ({
            id: text(m.id, uid(), 80),
            text: text(m.text, "", 500),
            at: date(m.at, new Date().toISOString()),
          })),
        child: c.child
          ? {
              parentIds: list(c.child.parentIds)
                .filter((x) => typeof x === "string")
                .slice(0, 2),
              schoolId: placeId(c.child.schoolId),
              schoolTime: validTime(c.child.schoolTime, "08:30"),
              homework: text(c.child.homework, "복습하기", 200),
              homeTime: validTime(c.child.homeTime, "16:00"),
              bedtime: validTime(c.child.bedtime, "22:00"),
            }
          : null,
      };
    });
  while (characters.length < 2)
    characters.push(newCharacter(characters.length));
  for (const c of characters)
    if (c.child)
      c.child.parentIds = c.child.parentIds.filter((id) =>
        characters.some((p) => p.id === id && p.id !== c.id),
      );
  for (const c of characters) {
    c.schedule = c.schedule.map((s) => ({
      ...s,
      placeId: schoolForAge(s.placeId, c.age, c.job),
    }));
    if (c.child) c.child.schoolId = schoolForAge(c.child.schoolId, c.age);
  }
  const pairs = new Set<string>();
  const relationships = list(raw.relationships)
    .filter(
      (r) =>
        characters.some((c) => c.id === r.a) &&
        characters.some((c) => c.id === r.b) &&
        r.a !== r.b,
    )
    .filter((r) => {
      const key = [r.a, r.b].sort().join("|");
      if (pairs.has(key)) return false;
      pairs.add(key);
      return true;
    })
    .map((r) => ({
      id: text(r.id, uid(), 80),
      a: r.a as string,
      b: r.b as string,
      type: RELATION_TYPES.includes(r.type) ? r.type : "친구",
      intimacy: number(r.intimacy, 50),
    }));
  return {
    ...d,
    version: WORLD_VERSION,
    name: text(raw.name, "도란", 40),
    places: orderPlaces(places),
    characters,
    relationships,
    clock: date(raw.clock, d.clock),
    pcSync: true,
    speed: 1,
    randomEvents: raw.randomEvents !== false,
    lastTalkAt: date(raw.lastTalkAt),
    lastEventAt: date(raw.lastEventAt),
    logs: list(raw.logs)
      .slice(-400)
      .map((l) => ({
        id: text(l.id, uid(), 80),
        at: date(l.at, d.clock),
        speakerId: characters.some((c) => c.id === l.speakerId)
          ? l.speakerId
          : null,
        targetId: characters.some((c) => c.id === l.targetId)
          ? l.targetId
          : null,
        text: text(l.text, "", 600),
        kind: l.kind === "사건" ? "사건" : "대화",
      })),
  };
}
export function loadWorld(): { world: World; error: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return {
      world: saved ? normalizeWorld(JSON.parse(saved)) : defaultWorld(),
      error: "",
    };
  } catch {
    return {
      world: defaultWorld(),
      error:
        "저장 데이터를 열지 못했어요. 기존 저장본은 덮어쓰지 않았어요. JSON 백업을 불러오거나 새 세계로 저장을 눌러 주세요.",
    };
  }
}
export function saveWorld(w: World) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
}
export function downloadWorld(w: World) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(w, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `도란_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importWorld(file: File) {
  if (file.size > 15 * 1024 * 1024)
    throw new Error("15MB 이하의 JSON 파일을 선택해 주세요.");
  const v = JSON.parse(await file.text());
  if (!v || !Array.isArray(v.characters) || !Array.isArray(v.places))
    throw new Error("도란 세계 파일이 아니에요.");
  return normalizeWorld(v);
}
