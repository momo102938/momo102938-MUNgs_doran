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
        placeId: c.child.schoolId,
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
      placeId: c.child.schoolId,
    };
  return s
    ? { action: s.action, placeId: s.placeId }
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
  const act = activityAt(a, w.clock),
    p = w.places.find((p) => p.id === act.placeId)?.name || "여기";
  const rel = relationOf(w, a.id, b.id);
  const formal = /존댓말|정중|차분/.test(a.tone);
  const warm = /다정|밝|외향|활발/.test(a.personality);
  const shy = /조용|내향|수줍/.test(a.personality);
  const pool: string[] = [];
  const add = (casual: string, polite: string) =>
    pool.push(formal ? polite : casual);
  if (a.fatigue > 65)
    add(
      "나 조금 지쳤나 봐. 잠깐 같이 쉬자.",
      "오늘은 조금 피곤하네요. 잠깐 쉬었다 할까요?",
    );
  if (a.mood < 35)
    add(
      "아까는 좀 예민했어. 네 탓은 아니야.",
      "오늘은 마음이 복잡하네요. 조금만 곁에 있어 줄래요?",
    );
  if (rel && rel.intimacy < 35)
    add(
      "아까 내 말이 신경 쓰였어? 이야기하고 싶어.",
      "우리 조금 어색해진 것 같아요. 천천히 얘기해 볼까요?",
    );
  if (rel?.type === "연인" && a.age >= 18 && b.age >= 18) {
    add("오늘도 네 얼굴 보니까 좋네.", "오늘도 같이 시간을 보내서 좋아요.");
    add("다음에 둘이 산책하러 갈래?", "다음에는 둘이 산책하러 가요.");
  }
  if (rel?.type === "부모와 자녀") {
    if (a.child?.parentIds.includes(b.id))
      add(
        "오늘 학교에서 있었던 일, 들려줄까?",
        "오늘 학교에서 있었던 일, 얘기해 드릴까요?",
      );
    else
      add(
        "오늘 하루 어땠어? 힘든 일은 없었고?",
        "오늘 하루는 어땠어요? 하고 싶은 이야기가 있나요?",
      );
  }
  if (rel?.type === "형제자매")
    add(
      "이따 간식 나눠 먹자. 내 몫도 남겨 줘.",
      "이따 간식 같이 먹어요. 제 몫도 남겨 줘요.",
    );
  if (rel?.type === "직장 동료")
    add(
      "오늘 일은 잘 풀려? 필요하면 같이 보자.",
      "오늘 업무는 잘 풀려요? 같이 확인해 볼까요?",
    );
  if (rel?.type === "룸메이트")
    add("집에 가면 같이 저녁 준비하자.", "오늘 집안일은 나눠서 할까요?");
  if (rel?.type === "친구")
    add("너랑 이러고 있으니까 편하다.", "편하게 얘기할 사람이 있어서 좋아요.");
  if (act.action === "식사")
    add("천천히 먹자. 오늘 밥 괜찮네.", "오늘 식사는 어때요? 천천히 드세요.");
  if (act.action === "공부" || act.action === "등교")
    add(
      "이 부분 같이 볼래? 혼자 보니 잘 모르겠어.",
      "이 부분 같이 볼까요? 설명을 한 번 더 읽어 봐야겠어요.",
    );
  if (act.action === "출근")
    add(
      "조금만 더 하면 끝나겠다. 이따 쉬자.",
      "이것만 마무리하면 잠깐 쉴 수 있겠네요.",
    );
  if (act.action === "귀가")
    add("다녀왔어. 오늘 별일 없었어?", "다녀왔어요. 오늘은 어떻게 보냈어요?");
  if (act.placeId === "square")
    add("바람 좋다. 한 바퀴 더 걸을까?", "바람이 좋네요. 조금 더 걸을까요?");
  if (act.placeId === "home")
    add(
      "오늘은 그냥 집에서 느긋하게 보내자.",
      "오늘은 집에서 조금 느긋하게 보내고 싶어요.",
    );
  if (warm)
    add("너는 오늘 뭐 할 때 제일 즐거웠어?", "오늘 가장 즐거웠던 일은 뭐예요?");
  if (shy) add("…먼저 말 걸어 줘서 고마워.", "…같이 있어 줘서 고마워요.");
  const like = a.likes.split(/[,，]/)[0]?.trim();
  if (like)
    add(
      `나중에 ${like} 얘기도 같이 하자.`,
      `다음에는 ${like} 이야기도 같이 나눠요.`,
    );
  const dislike = a.dislikes.split(/[,，]/)[0]?.trim();
  if (dislike)
    add(
      `오늘은 ${dislike} 없이 조용히 보내고 싶네.`,
      `오늘은 ${dislike} 없이 편안히 보내고 싶어요.`,
    );
  if (a.habits)
    add(
      `요즘은 ‘${a.habits}’에 꽤 익숙해졌어. 너는 요즘 어때?`,
      `요즘은 ‘${a.habits}’에 꽤 익숙해졌어요. 요즘은 어떻게 지내요?`,
    );
  if (a.child?.homework)
    add(
      `오늘 숙제는 ‘${a.child.homework}’야. 잠깐 같이 있어 줄래?`,
      `오늘 숙제는 ‘${a.child.homework}’예요. 옆에 있어 줄래요?`,
    );
  // 사용자가 쓴 예문은 그대로 존중하며, 호칭 치환을 지원한다.
  pool.push(
    ...a.lines.map((l) =>
      l.replaceAll("{상대}", b.name).replaceAll("{이름}", a.name),
    ),
  );
  const last = w.logs
    .filter(
      (l) => l.speakerId === b.id && l.targetId === a.id && l.kind === "대화",
    )
    .at(-1);
  if (last?.text.includes("?"))
    add("응, 나는 괜찮아. 너는 어때?", "저는 괜찮아요. 그쪽은 어때요?");
  // 이전 질문을 다시 인용하거나 인용문을 중첩하지 않는다.
  const memories = a.memories.filter(
    (m) =>
      !/[?？“”]|전에|그 뒤|괜찮/.test(m.text) &&
      m.text.length > 8 &&
      (!m.text.includes(": ") || m.text.startsWith(b.name + ": ")),
  );
  if (memories.length) {
    const memory = pick(memories, rng)
      .text.replace(b.name + ": ", "")
      .slice(0, 45);
    add(
      `전에 이야기했던 ‘${memory}’ 말이야. 그 얘기 좀 더 해 줄래?`,
      `전에 이야기했던 ‘${memory}’ 말이에요. 그 이야기 조금 더 듣고 싶어요.`,
    );
  }
  const recent = new Set(w.logs.slice(-40).map((l) => l.text));
  const available = pool.filter((s) => !recent.has(s));
  if (available.length) return pick(available, rng);
  // 선택지가 모두 소진되면 조합형 문장을 만들되 전체 최근 기록과 비교한다.
  const starts = formal
    ? ["문득 궁금해졌는데,", "잠깐 쉬면서,", "이따 시간이 되면,", "괜찮다면,"]
    : ["문득 생각났는데,", "잠깐 쉬면서,", "이따 시간 나면,", "괜찮으면,"];
  const ends = formal
    ? [
        "오늘 있었던 일 들려주실래요?",
        "같이 뭘 할지 정해 볼까요?",
        "재밌는 이야기 하나 해 줄래요?",
        "요즘 즐겨 하는 걸 알려 주세요.",
      ]
    : [
        "오늘 있었던 일 좀 들려줄래?",
        "같이 뭘 할지 정해 볼까?",
        "재밌는 이야기 하나 해 줘.",
        "요즘 즐겨 하는 거 있어?",
      ];
  const variants = starts.flatMap((s) =>
    ends.map((e) => `${b.name}, ${s} ${p}에서 ${e}`),
  );
  return pick(
    variants.filter((s) => !recent.has(s)).length
      ? variants.filter((s) => !recent.has(s))
      : pool,
    rng,
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
  const [a, b] = rng() < 0.5 ? pair : [pair[1], pair[0]];
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
