import { APP_VERSION } from "../version";
import { KotraHeading, KotraText } from "./KotraText";
import { orderPlaces, schoolAgeHint } from "../schools";
import { defaultPlaces } from "../defaults";
import { useState, useRef, useEffect, type ReactNode } from "react";
import type { MotionMap } from "../motion";
import { MAX_CHARACTERS, type World } from "../types";
import { FloorPlan, CharacterImage } from "./FloorPlan";
import { Meter } from "./Fields";
import { activityAt, timeString, randomEvent } from "../simulation";
export function PlaceTabs({
  world,
  placeId,
  onSelect,
}: {
  world: World;
  placeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="place-tabs">
      {orderPlaces(world.places).map((p, i) => (
        <button
          key={p.id}
          title={schoolAgeHint(p.id) || p.name}
          className={p.id === placeId ? "active" : ""}
          onClick={() => onSelect(p.id)}
        >
          <span>
            {{
              home: "⌂",
              office: "▦",
              school: "▤",
              square: "♧",
              university: "▥",
            }[p.id] || "⌂"}
          </span>
          {p.name}
          {schoolAgeHint(p.id) && (
            <sup className="school-age">
              {p.id === "school" ? "학생 ~19세" : "학생 20세~"}
            </sup>
          )}
          <small>
            {
              world.characters.filter(
                (c) => activityAt(c, world.clock).placeId === p.id,
              ).length
            }
            명
          </small>
        </button>
      ))}
    </div>
  );
}
export function Observation({
  world,
  motion,
  placeId,
  setPlaceId,
  update,
  timeline,
  running,
  onHistory,
}: {
  world: World;
  motion: MotionMap;
  placeId: string;
  setPlaceId: (s: string) => void;
  update: (fn: (w: World) => World) => void;
  timeline: ReactNode;
  running: boolean;
  onHistory: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (edit && !dialog.current?.open) dialog.current?.showModal();
  }, [edit]);
  const [selected, setSelected] = useState(world.characters[0].id);
  const c =
    world.characters.find((c) => c.id === selected) || world.characters[0];
  const place = world.places.find((p) => p.id === placeId) || world.places[0];
  const act = activityAt(c, world.clock);
  const last = world.logs
    .filter((l) => l.speakerId === c.id && l.kind === "대화")
    .at(-1);
  return (
    <section className="observation-shell">
      <div className="section-head observe-title">
        <h1>
          {!world.name || world.name === "도란" ? (
            <img
              className="brand-wordmark"
              src="./doran-wordmark.svg"
              alt="도란"
            />
          ) : (
            world.name
          )}
          <img className="title-mascot" src="./icon.png" alt="도란의 양" />
          <small className="app-version">v{APP_VERSION}</small>
        </h1>
      </div>
      <div className="observation-grid">
        <section className="panel scene">
          <div className="scene-toolbar">
            <PlaceTabs world={world} placeId={place.id} onSelect={setPlaceId} />
            <button
              className={edit ? "active" : ""}
              onClick={() => setEdit(!edit)}
            >
              {edit ? "꾸미기 완료" : "전개도 꾸미기"}
            </button>
            <button
              className="restore-plan"
              title="현재 장소를 기본 전개도로 되돌리기"
              onClick={() => {
                if (
                  confirm(
                    `${place.name}을 기본 전개도로 되돌릴까요? 현재 배치는 바뀌어요.`,
                  )
                ) {
                  const original = defaultPlaces().find(
                    (p) => p.id === place.id,
                  );
                  if (original)
                    update((w) => ({
                      ...w,
                      places: w.places.map((p) =>
                        p.id === place.id
                          ? { ...original, name: place.name }
                          : p,
                      ),
                    }));
                }
              }}
            >
              ↶ 기본 전개도
            </button>
            <span className="scene-state">
              <span className="live-dot" />
              {running ? "재생 중" : "일시 정지"}
            </span>
          </div>
          <div className="scene-stage">
            <div className="scene-location">
              {place.name}{" "}
              <span>
                {
                  world.characters.filter(
                    (c) => activityAt(c, world.clock).placeId === place.id,
                  ).length
                }
                명 머무는 중
              </span>
              {!place.layoutVersion && (
                <small>
                  새 도면은 ‘전개도 꾸미기 → 기본 도면 복원’에서 적용해요.
                </small>
              )}
            </div>
            <FloorPlan
              world={world}
              place={place}
              edit={false}
              motion={motion}
              running={running}
              onCharacter={setSelected}
              onPlace={(p) =>
                update((w) => ({
                  ...w,
                  places: w.places.map((x) => (x.id === p.id ? p : x)),
                }))
              }
            />
            <div className="scene-footer">
              <span>
                {edit
                  ? "가구를 옮겨 나만의 공간으로 꾸며요."
                  : place.rooms.map((r) => r.name).join(" · ") || "나만의 공간"}
              </span>
              <span>
                {edit
                  ? "변경 사항은 자동으로 저장돼요."
                  : "캐릭터를 누르면 상태를 볼 수 있어요."}
              </span>
            </div>
          </div>
          {timeline}
        </section>
        <aside className="panel character-inspector">
          <div className="section-head">
            <KotraHeading level={3}>캐릭터</KotraHeading>
            <small>
              {world.characters.length} / {MAX_CHARACTERS}
            </small>
          </div>
          <div className="avatar-tabs">
            {world.characters.map((x) => (
              <button
                key={x.id}
                className={x.id === c.id ? "active" : ""}
                aria-label={`${x.name} 상태 보기`}
                onClick={() => setSelected(x.id)}
              >
                {x.name.slice(0, 2)}
              </button>
            ))}
          </div>
          <div className="inspector-profile">
            <CharacterImage c={c} />
            <KotraHeading level={2}>{c.name}</KotraHeading>
            <p>
              {c.age}세 · {c.job}
            </p>
            <span>
              ⌂ {world.places.find((p) => p.id === act.placeId)?.name} ·{" "}
              {act.action}
            </span>
          </div>
          <div className="inspector-meters">
            <Meter label="☺ 기분" value={c.mood} />
            <Meter label="☾ 피로도" value={c.fatigue} />
          </div>
          <div className="personality-note">
            <small>성격</small>
            <p>{c.personality}</p>
            <span>♡ {c.likes}</span>
            <small>대화 기억 {c.memories.length}개 · 기억 중</small>
          </div>
          <div className="inspector-relations">
            <KotraHeading level={4}>마음의 거리</KotraHeading>
            {world.relationships
              .filter((r) => r.a === c.id || r.b === c.id)
              .map((r) => (
                <div key={r.id}>
                  <span>
                    {
                      world.characters.find(
                        (x) => x.id === (r.a === c.id ? r.b : r.a),
                      )?.name
                    }{" "}
                    <small>{r.type}</small>
                  </span>
                  <b>♡ {Math.round(r.intimacy)}</b>
                </div>
              ))}
          </div>
          <p className="last-words">
            {last ? `“${last.text}”` : "아직은 조용히 하루를 보내고 있어요."}
          </p>
        </aside>
      </div>
      <section className="panel recent-story" aria-label="최근 기록">
        <div className="recent-story-heading">
          <div className="button-row">
            <button onClick={() => update((w) => randomEvent(w))}>
              ✧ 랜덤 사건
            </button>
            <button onClick={onHistory}>기록 보기</button>
          </div>
        </div>
        <div className="recent-lines">
          {world.logs.length ? (
            world.logs
              .slice(-2)
              .reverse()
              .map((l) => (
                <div key={l.id}>
                  <time>{timeString(l.at)}</time>
                  <b>
                    <KotraText
                      text={
                        (l.kind === "사건"
                          ? "작은 사건"
                          : world.characters.find((c) => c.id === l.speakerId)
                              ?.name) || ""
                      }
                    />
                  </b>

                  <span>{l.text}</span>
                </div>
              ))
          ) : (
            <p>아직은 고요한 하루예요. 시간을 재생하면 일상이 시작돼요.</p>
          )}
        </div>
      </section>
      <dialog
        ref={dialog}
        className="plan-editor-dialog"
        onCancel={() => setEdit(false)}
        onClose={() => setEdit(false)}
      >
        <header>
          <div>
            <small>공간을 내 취향대로</small>
            <KotraHeading level={2}>{place.name} 전개도 편집</KotraHeading>
          </div>
          <button
            autoFocus
            onClick={() => {
              dialog.current?.close();
              setEdit(false);
            }}
          >
            완료 · 닫기
          </button>
        </header>
        {edit && (
          <FloorPlan
            world={world}
            place={place}
            edit
            onPlace={(p) =>
              update((w) => ({
                ...w,
                places: w.places.map((x) => (x.id === p.id ? p : x)),
              }))
            }
          />
        )}
      </dialog>
    </section>
  );
}
export function ConversationLog({
  world,
  clear,
}: {
  world: World;
  clear?: () => void;
}) {
  const [filter, setFilter] = useState("전체");
  const [who, setWho] = useState("전체");
  const logs = world.logs.filter(
    (l) =>
      (filter === "전체" || l.kind === filter) &&
      (who === "전체" || l.speakerId === who || l.targetId === who),
  );
  return (
    <section className="panel log-panel" aria-label="대화 기록">
      <div className="section-head">
        <div className="button-row">
          <select
            aria-label="기록 종류"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["전체", "대화", "사건"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="기록 캐릭터"
            value={who}
            onChange={(e) => setWho(e.target.value)}
          >
            <option>전체</option>
            {world.characters.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {clear && (
            <button
              onClick={() =>
                confirm(
                  "대화 기록을 모두 지울까요? 캐릭터 기억은 편집 화면에서 관리해요.",
                ) && clear()
              }
            >
              기록 비우기
            </button>
          )}
        </div>
      </div>
      <div className="log-list">
        {logs.length ? (
          [...logs].reverse().map((l) => (
            <div
              className={`log-entry ${l.kind === "사건" ? "event" : ""}`}
              key={l.id}
            >
              <time title={new Date(l.at).toLocaleString("ko-KR")}>
                {new Date(l.at).getMonth() + 1}/{new Date(l.at).getDate()}{" "}
                {timeString(l.at)}
              </time>
              <strong>
                <KotraText
                  text={
                    l.kind === "사건"
                      ? "작은 사건"
                      : world.characters.find((c) => c.id === l.speakerId)
                          ?.name || "지난 캐릭터"
                  }
                />
              </strong>

              <p>{l.text}</p>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span>☁</span>
            <p>아직 기록된 이야기가 없어요.</p>
            <small>시간을 재생하면 대화와 사건이 기록돼요.</small>
          </div>
        )}
      </div>
      <p className="muted small">
        최근 400개 기록을 보관해요. 대사는 외부 AI 없이 브라우저 안에서
        만들어요.
      </p>
    </section>
  );
}
