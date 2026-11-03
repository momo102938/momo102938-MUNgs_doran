import { schoolForAge } from "../schools";
import { useState } from "react";
import {
  MAX_CHARACTERS,
  DEFAULT_CHARACTER_IMAGE,
  MAX_LINES,
  ACTIONS,
  type Character,
  type World,
  type Schedule,
} from "../types";
import { uid, newCharacter } from "../defaults";
import { Field, Meter } from "./Fields";
import { CharacterImage } from "./FloorPlan";
type Props = {
  world: World;
  update: (fn: (w: World) => World) => void;
  report: (message: string) => void;
};
export function CharacterEditor({ world, update, report }: Props) {
  const [selected, setSelected] = useState(world.characters[0].id);
  const c =
    world.characters.find((c) => c.id === selected) || world.characters[0];
  const patch = (p: Partial<Character>) =>
    update((w) => ({
      ...w,
      characters: w.characters.map((x) => {
        if (x.id !== c.id) return x;
        const next = { ...x, ...p };
        return {
          ...next,
          schedule: next.schedule.map((s) => ({
            ...s,
            placeId: schoolForAge(s.placeId, next.age),
          })),
          child: next.child
            ? {
                ...next.child,
                schoolId: schoolForAge(next.child.schoolId, next.age),
              }
            : null,
        };
      }),
    }));
  const changeSchedule = (id: string, p: Partial<Schedule>) =>
    patch({
      schedule: c.schedule.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });
  async function image(file?: File) {
    if (!file) return;
    try {
      if (file.type !== "image/png")
        throw new Error("투명 배경 PNG 파일을 선택해 주세요.");
      if (file.size > 8 * 1024 * 1024)
        throw new Error("8MB 이하의 PNG를 사용해 주세요.");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 400 / bitmap.height, 400 / bitmap.width);
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      patch({ image: canvas.toDataURL("image/png") });
      report("전신 이미지를 적용했어요.");
    } catch (e) {
      report((e as Error).message);
    }
  }
  return (
    <section className="panel editor">
      <div className="section-head">
        <div>
          <p className="eyebrow">함께 살아가는 사람들</p>
          <h2>캐릭터 편집</h2>
        </div>
        <button
          disabled={world.characters.length >= MAX_CHARACTERS}
          onClick={() => {
            const n = newCharacter(world.characters.length);
            update((w) => ({ ...w, characters: [...w.characters, n] }));
            setSelected(n.id);
          }}
        >
          ＋ 캐릭터 추가 ({world.characters.length}/{MAX_CHARACTERS})
        </button>
      </div>
      <div className="pill-row">
        {world.characters.map((x) => (
          <button
            className={x.id === c.id ? "active" : ""}
            key={x.id}
            onClick={() => setSelected(x.id)}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className="character-form">
        <div className="portrait">
          <CharacterImage c={c} />
          <label className="upload">
            내 캐릭터 PNG 넣기
            <input
              type="file"
              accept="image/png"
              onChange={(e) => void image(e.target.files?.[0])}
            />
          </label>
          <button onClick={() => patch({ image: DEFAULT_CHARACTER_IMAGE })}>
            기본 자리표시자로 되돌리기
          </button>
          <p className="muted">
            투명 배경 SD 캐릭터를 올려 주세요.
            <br />
            전신 비율을 유지하며 표시해요.
          </p>
          <button
            disabled={world.characters.length <= 2}
            className="danger"
            onClick={() => {
              if (!confirm(`${c.name} 캐릭터와 관련 관계를 삭제할까요?`))
                return;
              update((w) => ({
                ...w,
                characters: w.characters
                  .filter((x) => x.id !== c.id)
                  .map((x) => ({
                    ...x,
                    child: x.child
                      ? {
                          ...x.child,
                          parentIds: x.child.parentIds.filter(
                            (id) => id !== c.id,
                          ),
                        }
                      : null,
                  })),
                relationships: w.relationships.filter(
                  (r) => r.a !== c.id && r.b !== c.id,
                ),
              }));
            }}
          >
            캐릭터 삭제
          </button>
        </div>
        <div className="form-grid">
          <Field label="이름">
            <input
              value={c.name}
              maxLength={30}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Field>
          <Field label="나이">
            <input
              type="number"
              min={0}
              max={120}
              value={c.age}
              onChange={(e) =>
                patch({ age: Math.max(0, Math.min(120, +e.target.value)) })
              }
            />
          </Field>
          {(
            [
              "personality",
              "tone",
              "job",
              "likes",
              "dislikes",
              "habits",
            ] as const
          ).map((key, i) => (
            <Field
              key={key}
              label={
                [
                  "성격",
                  "말투",
                  "직업",
                  "좋아하는 것",
                  "싫어하는 것",
                  "생활 습관",
                ][i]
              }
            >
              <input
                maxLength={200}
                value={c[key]}
                onChange={(e) => patch({ [key]: e.target.value })}
              />
            </Field>
          ))}
          <Field label={`기분 ${Math.round(c.mood)}`}>
            <input
              type="range"
              min={0}
              max={100}
              value={c.mood}
              onChange={(e) => patch({ mood: +e.target.value })}
            />
          </Field>
          <Field label={`피로도 ${Math.round(c.fatigue)}`}>
            <input
              type="range"
              min={0}
              max={100}
              value={c.fatigue}
              onChange={(e) => patch({ fatigue: +e.target.value })}
            />
          </Field>
        </div>
      </div>
      <details open>
        <summary>하루 일정</summary>
        <p className="muted">
          학교는 19세까지 고등학교, 20세부터 대학교로 자동 연결해요. 시간순으로
          적용돼요. 자정을 지나면 전날 마지막 일정이 다음 일정까지 이어져요.
        </p>
        <div className="schedule">
          {c.schedule.map((s) => (
            <div key={s.id}>
              <input
                aria-label="일정 시각"
                type="time"
                value={s.time}
                onChange={(e) =>
                  changeSchedule(s.id, { time: e.target.value || "09:00" })
                }
              />
              <select
                aria-label="일정 행동"
                value={s.action}
                onChange={(e) =>
                  changeSchedule(s.id, {
                    action: e.target.value as Schedule["action"],
                  })
                }
              >
                {ACTIONS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <select
                aria-label="일정 장소"
                value={s.placeId}
                onChange={(e) =>
                  changeSchedule(s.id, { placeId: e.target.value })
                }
              >
                {world.places.map((p) => (
                  <option
                    value={p.id}
                    key={p.id}
                    disabled={
                      (p.id === "school" && c.age >= 20) ||
                      (p.id === "university" && c.age < 20)
                    }
                  >
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                aria-label="일정 삭제"
                disabled={c.schedule.length <= 1}
                onClick={() =>
                  patch({ schedule: c.schedule.filter((x) => x.id !== s.id) })
                }
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            patch({
              schedule: [
                ...c.schedule,
                { id: uid(), time: "15:00", action: "놀이", placeId: "home" },
              ],
            })
          }
        >
          ＋ 일정 추가
        </button>
      </details>
      <details>
        <summary>자녀 설정</summary>
        <label className="check">
          <input
            type="checkbox"
            checked={!!c.child}
            onChange={(e) =>
              patch({
                child: e.target.checked
                  ? {
                      parentIds: [],
                      schoolId: "school",
                      schoolTime: "08:30",
                      homework: "오늘 배운 내용 복습하기",
                      homeTime: "16:00",
                      bedtime: "22:00",
                    }
                  : null,
              })
            }
          />{" "}
          자녀 일정 사용
        </label>
        {c.child && (
          <>
            <p className="muted">
              등교·귀가·취침 시각이 일반 일정과 겹치면 자녀 일정이 우선해요.
              숙제 시간은 하루 일정에 ‘공부’를 추가해 주세요.
            </p>
            <div className="form-grid">
              <Field label="부모 (최대 2명)">
                <div>
                  {world.characters
                    .filter((x) => x.id !== c.id)
                    .map((x) => (
                      <label className="check" key={x.id}>
                        <input
                          type="checkbox"
                          checked={c.child!.parentIds.includes(x.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...c.child!.parentIds, x.id].slice(-2)
                              : c.child!.parentIds.filter((id) => id !== x.id);
                            const missing = ids.filter(
                              (id) =>
                                !world.relationships.some(
                                  (r) =>
                                    (r.a === id && r.b === c.id) ||
                                    (r.b === id && r.a === c.id),
                                ),
                            );
                            update((w) => ({
                              ...w,
                              characters: w.characters.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      child: { ...c.child!, parentIds: ids },
                                    }
                                  : x,
                              ),
                              relationships: [
                                ...w.relationships.map((r) =>
                                  (ids.includes(r.a) && r.b === c.id) ||
                                  (ids.includes(r.b) && r.a === c.id)
                                    ? { ...r, type: "부모와 자녀" as const }
                                    : r,
                                ),
                                ...missing.map((id) => ({
                                  id: uid(),
                                  a: id,
                                  b: c.id,
                                  type: "부모와 자녀" as const,
                                  intimacy: 70,
                                })),
                              ],
                            }));
                          }}
                        />
                        {x.name}
                      </label>
                    ))}
                </div>
              </Field>
              <Field label="학교">
                <select
                  value={c.child.schoolId}
                  onChange={(e) =>
                    patch({ child: { ...c.child!, schoolId: e.target.value } })
                  }
                >
                  {world.places.map((p) => (
                    <option
                      value={p.id}
                      key={p.id}
                      disabled={
                        (p.id === "school" && c.age >= 20) ||
                        (p.id === "university" && c.age < 20)
                      }
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              {(["schoolTime", "homeTime", "bedtime"] as const).map(
                (key, i) => (
                  <Field
                    key={key}
                    label={["등교 시간", "귀가 시간", "취침 시간"][i]}
                  >
                    <input
                      type="time"
                      value={c.child![key]}
                      onChange={(e) =>
                        patch({
                          child: {
                            ...c.child!,
                            [key]: e.target.value || "09:00",
                          },
                        })
                      }
                    />
                  </Field>
                ),
              )}
              <Field label="숙제">
                <input
                  maxLength={200}
                  value={c.child.homework}
                  onChange={(e) =>
                    patch({ child: { ...c.child!, homework: e.target.value } })
                  }
                />
              </Field>
            </div>
          </>
        )}
      </details>
      <details>
        <summary>기본 대사와 대화 기억</summary>
        <p className="muted">
          기본 대사는 한 줄에 하나씩, 최대 {MAX_LINES}개예요. {"{상대}"}와{" "}
          {"{이름}"}을 호칭으로 바꿔 줘요. 기억은 모델 재학습이 아니라, 이
          브라우저에 저장된 대화 내용을 대사 선택에 참고하는 기능이에요.
        </p>
        <Field label={`기본 대사 (${c.lines.length}/${MAX_LINES})`}>
          <textarea
            rows={6}
            value={c.lines.join("\n")}
            onChange={(e) =>
              patch({
                lines: e.target.value
                  .split("\n")
                  .slice(0, MAX_LINES)
                  .map((s) => s.slice(0, 300)),
              })
            }
          />
        </Field>
        <div className="section-head">
          <h3>대화 기억</h3>
          <div>
            <button
              onClick={() =>
                patch({
                  memories: [
                    ...c.memories,
                    { id: uid(), text: "새로운 기억", at: world.clock },
                  ].slice(-100),
                })
              }
            >
              ＋ 기억 추가
            </button>
            <button onClick={() => patch({ memories: [] })}>모두 삭제</button>
          </div>
        </div>
        {c.memories.length ? (
          c.memories.map((m) => (
            <div className="memory" key={m.id}>
              <input
                aria-label="대화 기억"
                maxLength={500}
                value={m.text}
                onChange={(e) =>
                  patch({
                    memories: c.memories.map((x) =>
                      x.id === m.id ? { ...x, text: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                onClick={() =>
                  patch({ memories: c.memories.filter((x) => x.id !== m.id) })
                }
              >
                삭제
              </button>
            </div>
          ))
        ) : (
          <p className="muted">대화를 나누면 최근 기억이 여기에 쌓여요.</p>
        )}
      </details>
    </section>
  );
}
