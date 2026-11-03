import { sceneLines, replyLines, usesPolite } from "./dialogue";
import { schoolForAge } from "./schools";
import {
  type World,
  type Character,
  type Activity,
  type Log,
  type Relationship,
} from "./types";
import { uid } from "./defaults";
export const timeString = (date: string) =>
  new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const minute = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
export function activityAt(c: Character, at: string): Activity {
  const d = new Date(at),
    now = d.getHours() * 60 + d.getMinutes();
  const schedule = c.schedule
    .filter((s) => !c.child || s.action !== "출근")
    .map((s) => ({ ...s }));
  if (c.child) {
    schedule.push(
      {
        id: "child-school",
        time: c.child.schoolTime,
        action: "등교",
        placeId: schoolForAge(c.child.schoolId, c.age),
      },
      {
        id: "child-home",
        time: c.child.homeTime,
        action: "귀가",
        placeId: "home",
      },
      {
        id: "child-bed",
        time: c.child.bedtime,
        action: "취침",
        placeId: "home",
      },
    );
  }
  schedule.sort((a, b) => minute(a.time) - minute(b.time));
  const s =
    schedule.filter((s) => minute(s.time) <= now).at(-1) || schedule.at(-1);
  if (
    s &&
    c.child &&
    now >= minute(c.child.schoolTime) &&
    now < minute(c.child.homeTime)
  )
    return {
      action: s.action === "귀가" ? "공부" : s.action,
      placeId: schoolForAge(c.child.schoolId, c.age),
    };
  return s
    ? { action: s.action, placeId: schoolForAge(s.placeId, c.age, c.job) }
    : { action: "놀이", placeId: "home" };
}
export function relationOf(
  w: World,
  a: string,
  b: string,
): Relationship | undefined {
  return w.relationships.find(
    (r) => (r.a === a && r.b === b) || (r.a === b && r.b === a),
  );
}
const pick = <T>(a: T[], rng: () => number) =>
  a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
export function conversation(
  w: World,
  a: Character,
  b: Character,
  rng = Math.random,
): string {
  const act = activityAt(a, w.clock);
  const rel = relationOf(w, a.id, b.id);
  const polite = usesPolite(a, b);
  const recent = new Set(w.logs.slice(-40).map((l) => l.text));
  const last = w.logs
    .filter(
      (l) => l.kind === "대화" && l.speakerId === b.id && l.targetId === a.id,
    )
    .at(-1);
  const timely =
    last && Math.abs(Date.parse(w.clock) - Date.parse(last.at)) <= 20 * 60000;
  const needsReply =
    timely &&
    /[?？]|미안|보냈|찾았|올게|부탁|봐 줘|먹어 봐|드셔 보세요/.test(last.text);
  const replies = needsReply
    ? replyLines(last.text, a, b, act.action).filter((t) => !recent.has(t))
    : [];
  if (replies.length && (/[?？]/.test(last!.text) || rng() < 0.85))
    return pick(replies, rng);
  const context = sceneLines(act.placeId, act.action, a, b, rel);
  const examples = a.lines
    .map((l) => l.replaceAll("{상대}", b.name).replaceAll("{이름}", a.name))
    .filter(
      (l) =>
        !a.politeToOlder ||
        !polite ||
        /요[.!?？]?$|습니다[.!?]?$|세요[.!?]?$/.test(l),
    );
  const extras: string[] = [...examples];
  const like = b.likes.split(/[,，]/)[0]?.trim();
  if (like && (act.placeId === "home" || act.placeId === "square")) {
    extras.push(
      polite ? `${like} 좋아하신다고 했던가요?` : `${like} 좋아한다고 했었나?`,
    );
    if (
      a.memories.some(
        (m) => m.text.includes(like) && m.text.startsWith(b.name + ":"),
      )
    )
      extras.push(
        polite
          ? `아까 ${like} 얘기하셨잖아요. 저도 좀 궁금해졌어요.`
          : `아까 ${like} 얘기했잖아. 나도 좀 궁금해졌어.`,
      );
  }
  const freshContext = context.filter((t) => !recent.has(t));
  const freshExtras = extras.filter((t) => !recent.has(t));
  if (freshContext.length && (!freshExtras.length || rng() < 0.85))
    return pick(freshContext, rng);
  if (freshExtras.length) return pick(freshExtras, rng);
  // 문장을 억지로 이어 붙이지 않고, 가장 오래 전에 썼던 자연스러운 문장부터 다시 고른다.
  const pool = [...context, ...extras];
  const age = (text: string) => w.logs.map((l) => l.text).lastIndexOf(text);
  return (
    [...pool].sort((x, y) => age(x) - age(y))[0] ||
    (polite ? "오늘 어땠어요?" : "오늘 어땠어?")
  );
}

function append(w: World, log: Log): World {
  return { ...w, logs: [...w.logs, log].slice(-400) };
}
export function talk(w: World, rng = Math.random): World {
  const pairs = w.characters.flatMap((a, i) =>
    w.characters
      .slice(i + 1)
      .filter((b) => {
        const x = activityAt(a, w.clock),
          y = activityAt(b, w.clock);
        return (
          x.placeId === y.placeId && x.action !== "취침" && y.action !== "취침"
        );
      })
      .map((b) => [a, b] as const),
  );
  if (!pairs.length) return { ...w, lastTalkAt: w.clock };
  const pair = pick(pairs, rng);
  const latest = w.logs
    .filter(
      (l) =>
        l.kind === "대화" &&
        pair.some((c) => c.id === l.speakerId) &&
        pair.some((c) => c.id === l.targetId),
    )
    .at(-1);
  const [a, b] = latest
    ? latest.speakerId === pair[0].id
      ? [pair[1], pair[0]]
      : pair
    : rng() < 0.5
      ? pair
      : [pair[1], pair[0]];
  const text = conversation(w, a, b, rng);
  let n = append(w, {
    id: uid(),
    at: w.clock,
    speakerId: a.id,
    targetId: b.id,
    text,
    kind: "대화",
  });
  n = {
    ...n,
    lastTalkAt: w.clock,
    characters: n.characters.map((c) =>
      c.id === a.id || c.id === b.id
        ? {
            ...c,
            mood: Math.min(100, c.mood + 0.5),
            memories: [
              ...c.memories,
              { id: uid(), at: w.clock, text: `${a.name}: ${text}` },
            ].slice(-100),
          }
        : c,
    ),
  };
  return n;
}
export function randomEvent(w: World, rng = Math.random): World {
  const awake = w.characters.filter(
    (c) => activityAt(c, w.clock).action !== "취침",
  );
  if (!awake.length) return { ...w, lastEventAt: w.clock };
  const a = pick(awake, rng);
  const others = awake.filter(
    (c) =>
      c.id !== a.id &&
      activityAt(c, w.clock).placeId === activityAt(a, w.clock).placeId,
  );
  const b = others.length ? pick(others, rng) : null;
  const rel = b ? relationOf(w, a.id, b.id) : undefined;
  const options = b
    ? [
        {
          text: `${a.name}와 ${b.name}가 간식을 나누며 웃었어요.`,
          delta: 3,
          mood: 4,
        },
        {
          text: `${a.name}와 ${b.name}의 사소한 의견이 엇갈렸어요. 잠시 각자 쉬기로 했어요.`,
          delta: -2,
          mood: -3,
        },
        {
          text: `${a.name}가 먼저 말을 걸었어요. ${b.name}도 웃으며 마음을 풀었어요.`,
          delta: 4,
          mood: 5,
        },
        {
          text:
            rel?.type === "연인" && a.age >= 18 && b.age >= 18
              ? `${a.name}와 ${b.name}가 다음 산책 약속을 잡았어요.`
              : `${a.name}와 ${b.name}가 함께 보낼 주말 계획을 세웠어요.`,
          delta: 3,
          mood: 4,
        },
      ]
    : [
        {
          text: `${a.name}가 창밖을 바라보며 잠깐 쉬었어요.`,
          delta: 0,
          mood: 3,
        },
        {
          text: `${a.name}가 좋아하는 ${a.likes.split(",")[0] || "것"}을 떠올리며 미소 지었어요.`,
          delta: 0,
          mood: 4,
        },
      ];
  const e = pick(options, rng);
  return {
    ...append(w, {
      id: uid(),
      at: w.clock,
      speakerId: a.id,
      targetId: b?.id || null,
      text: e.text,
      kind: "사건",
    }),
    lastEventAt: w.clock,
    relationships: w.relationships.map((r) =>
      r.id === rel?.id
        ? { ...r, intimacy: Math.max(0, Math.min(100, r.intimacy + e.delta)) }
        : r,
    ),
    characters: w.characters.map((c) =>
      c.id === a.id || c.id === b?.id
        ? { ...c, mood: Math.max(0, Math.min(100, c.mood + e.mood)) }
        : c,
    ),
  };
}
export function advance(w: World, at: string, rng = Math.random): World {
  const elapsed = Math.max(
    0,
    Math.min(60, (Date.parse(at) - Date.parse(w.clock)) / 60000),
  );
  let n = {
    ...w,
    clock: at,
    characters: w.characters.map((c) => {
      const a = activityAt(c, at);
      return {
        ...c,
        fatigue: Math.max(
          0,
          Math.min(
            100,
            c.fatigue +
              (a.action === "취침"
                ? -0.4
                : a.action === "놀이"
                  ? -0.025
                  : 0.045) *
                elapsed,
          ),
        ),
      };
    }),
  };
  const due = (last: string, minutes: number) =>
    !last ||
    Date.parse(at) < Date.parse(last) ||
    Date.parse(at) - Date.parse(last) >= minutes * 60000;
  if (due(n.lastTalkAt, w.pcSync ? 1 : 8)) n = talk(n, rng);
  if (n.randomEvents && due(n.lastEventAt, w.pcSync ? 20 : 90))
    n = randomEvent(n, rng);
  return n;
}
