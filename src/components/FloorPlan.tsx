import type { MotionMap } from "../motion";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  DEFAULT_CHARACTER_IMAGE,
  FURNITURE_KINDS,
  type World,
  type Place,
  type Furniture,
  type Character,
  type Room,
} from "../types";
import { activityAt } from "../simulation";
import { uid, defaultPlaces } from "../defaults";
import { FURNITURE_META } from "../planSpec";
import { FurnitureArt } from "./FurnitureArt";
import { Field } from "./Fields";
export function CharacterImage({ c }: { c: Character }) {
  return (
    <img
      src={c.image || DEFAULT_CHARACTER_IMAGE}
      alt={`${c.name} 전신`}
      draggable={false}
      onError={(e) => {
        const fallback = new URL(DEFAULT_CHARACTER_IMAGE, location.href).href;
        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
      }}
    />
  );
}
type Selection = { type: "room" | "object"; id: string };
type Drag = {
  selection: Selection;
  pointerId: number;
  startX: number;
  startY: number;
  before: Place;
  resize: boolean;
};
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));
export function FloorPlan({
  world,
  place,
  edit = false,
  onPlace,
  onCharacter,
  motion,
  running = false,
}: {
  world: World;
  place: Place;
  edit?: boolean;
  onPlace?: (p: Place) => void;
  onCharacter?: (id: string) => void;
  motion?: MotionMap;
  running?: boolean;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [mode, setMode] = useState<"object" | "room">("object");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [category, setCategory] = useState("생활");
  const [history, setHistory] = useState<Place[]>([]);
  useEffect(() => {
    setSelection(null);
    setHistory([]);
  }, [place.id]);
  const object =
    selection?.type === "object"
      ? place.furniture.find((o) => o.id === selection.id)
      : undefined;
  const roomIndex =
    selection?.type === "room"
      ? place.rooms.findIndex((r, i) => (r.id || String(i)) === selection.id)
      : -1;
  const room = roomIndex >= 0 ? place.rooms[roomIndex] : undefined;
  function commit(next: Place) {
    setHistory((h) => [...h, structuredClone(place)].slice(-20));
    onPlace?.(next);
  }
  function patchObject(p: Partial<Furniture>) {
    if (object)
      commit({
        ...place,
        furniture: place.furniture.map((o) =>
          o.id === object.id ? { ...o, ...p } : o,
        ),
      });
  }
  function patchRoom(p: Partial<Room>) {
    if (room)
      commit({
        ...place,
        rooms: place.rooms.map((r, i) =>
          i === roomIndex ? { ...r, ...p } : r,
        ),
      });
  }
  function start(e: PointerEvent<SVGElement>, s: Selection, resize = false) {
    if (!edit) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelection(s);
    setHistory((h) => [...h, structuredClone(place)].slice(-20));
    drag.current = {
      selection: s,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      before: place,
      resize,
    };
  }
  function move(e: PointerEvent<SVGElement>) {
    const d = drag.current;
    if (!edit || !d || d.pointerId !== e.pointerId) return;
    const box = svg.current!.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / box.width) * 100,
      dy = ((e.clientY - d.startY) / box.height) * 100;
    if (d.selection.type === "object") {
      onPlace?.({
        ...place,
        furniture: place.furniture.map((o) => {
          if (o.id !== d.selection.id) return o;
          const before = d.before.furniture.find((x) => x.id === o.id)!;
          const meta = FURNITURE_META[o.kind];
          const angle = ((before.rotation || 0) * Math.PI) / 180;
          const localX =
            dx * Math.cos(angle) + ((dy * 2) / 3) * Math.sin(angle);
          const localY = -dx * 1.5 * Math.sin(angle) + dy * Math.cos(angle);
          return d.resize
            ? {
                ...o,
                w: clamp((before.w ?? meta.w) + localX * 2, 0.5, 100),
                h: clamp((before.h ?? meta.h) + localY * 2, 0.5, 100),
              }
            : { ...o, x: clamp(before.x + dx), y: clamp(before.y + dy) };
        }),
      });
    } else {
      const i = d.before.rooms.findIndex(
        (r, i) => (r.id || String(i)) === d.selection.id,
      );
      const b = d.before.rooms[i];
      onPlace?.({
        ...place,
        rooms: place.rooms.map((r, k) =>
          k !== i
            ? r
            : d.resize
              ? {
                  ...r,
                  w: clamp(b.w + dx, 2, 100 - b.x),
                  h: clamp(b.h + dy, 2, 100 - b.y),
                }
              : {
                  ...r,
                  x: clamp(b.x + dx, 0, 100 - b.w),
                  y: clamp(b.y + dy, 0, 100 - b.h),
                },
        ),
      });
    }
  }
  function stop() {
    drag.current = null;
  }
  function remove() {
    if (object) {
      commit({
        ...place,
        furniture: place.furniture.filter((o) => o.id !== object.id),
      });
    }
    if (room) {
      commit({
        ...place,
        rooms: place.rooms.filter((_, i) => i !== roomIndex),
      });
    }
    setSelection(null);
  }
  function add(kind: Furniture["kind"]) {
    if (place.furniture.length >= 200) return;
    const id = uid();
    commit({
      ...place,
      furniture: [
        ...place.furniture,
        {
          id,
          kind,
          x: 50,
          y: 50,
          ...FURNITURE_META[kind],
          rotation: 0,
          label: kind,
          color: "",
        },
      ],
    });
    setMode("object");
    setSelection({ type: "object", id });
  }
  const here = world.characters.filter(
    (c) => activityAt(c, world.clock).placeId === place.id,
  );
  const board = (
    <div className={`plan-canvas ${edit ? "plan-editing" : ""}`}>
      <svg
        ref={svg}
        viewBox="0 0 900 600"
        role="img"
        aria-label={`${place.name} 전개도`}
        onPointerDown={() => setSelection(null)}
      >
        <defs>
          <pattern
            id="wood-grain"
            width="85"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 27H85M45 0v27M5 12h26M57 16h20"
              stroke="#baa57c"
              strokeOpacity=".13"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="tile-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M36 0H0V36"
              fill="none"
              stroke="#b3bda5"
              strokeOpacity=".3"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="grass-speck"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="5" cy="7" r=".8" fill="#9eaf89" opacity=".25" />
          </pattern>
        </defs>
        <rect
          width="900"
          height="600"
          rx={place.id === "square" ? 35 : 4}
          fill={place.floor}
          stroke={place.id === "square" ? "#b1c49e" : undefined}
          strokeWidth="8"
        />
        {place.rooms.map((r, i) => {
          const id = r.id || String(i);
          return (
            <g
              key={id}
              className={edit && mode === "room" ? "plan-draggable" : ""}
              onPointerDown={
                edit && mode === "room"
                  ? (e) => start(e, { type: "room", id })
                  : undefined
              }
              onPointerMove={move}
              onPointerUp={stop}
              onPointerCancel={stop}
              style={{
                pointerEvents: edit && mode !== "room" ? "none" : undefined,
              }}
            >
              <rect
                x={r.x * 9}
                y={r.y * 6}
                width={r.w * 9}
                height={r.h * 6}
                rx={(r.radius || 0) * 3}
                fill={r.color}
                stroke={r.border ? "#b7a98d" : undefined}
                strokeWidth="5"
              />
              {r.pattern && r.pattern !== "plain" && (
                <rect
                  x={r.x * 9}
                  y={r.y * 6}
                  width={r.w * 9}
                  height={r.h * 6}
                  rx={(r.radius || 0) * 3}
                  fill={`url(#${r.pattern === "wood" ? "wood-grain" : r.pattern === "tile" ? "tile-grid" : "grass-speck"})`}
                />
              )}
              <text
                className="plan-room-label"
                x={(r.x + r.w / 2) * 9}
                y={(r.y + r.h - 4) * 6}
                textAnchor="middle"
              >
                {r.name}
              </text>
              {selection?.type === "room" && selection.id === id && edit && (
                <>
                  <rect
                    className="plan-selection"
                    x={r.x * 9}
                    y={r.y * 6}
                    width={r.w * 9}
                    height={r.h * 6}
                  />
                  <rect
                    className="plan-handle"
                    x={(r.x + r.w) * 9 - 6}
                    y={(r.y + r.h) * 6 - 6}
                    width="12"
                    height="12"
                    onPointerDown={(e) => start(e, { type: "room", id }, true)}
                  />
                </>
              )}
            </g>
          );
        })}
        {place.furniture.map((o) => {
          const meta = FURNITURE_META[o.kind];
          const w = (o.w ?? meta.w) * 9,
            h = (o.h ?? meta.h) * 6;
          const selected =
            selection?.type === "object" && selection.id === o.id;
          return (
            <g
              key={o.id}
              data-object-id={o.id}
              data-object-kind={o.kind}
              className={edit && mode === "object" ? "plan-draggable" : ""}
              transform={`translate(${o.x * 9} ${o.y * 6}) rotate(${o.rotation || 0}) translate(${-w / 2} ${-h / 2})`}
              onPointerDown={
                edit && mode === "object"
                  ? (e) => start(e, { type: "object", id: o.id })
                  : undefined
              }
              onPointerMove={move}
              onPointerUp={stop}
              onPointerCancel={stop}
              style={{
                pointerEvents:
                  edit && mode !== "object" ? "none" : edit ? "auto" : "none",
              }}
            >
              <title>{o.label}</title>
              <svg
                width={w}
                height={h}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                overflow="visible"
              >
                <FurnitureArt kind={o.kind} color={o.color} />
              </svg>
              {o.kind === "메모" && (
                <text
                  x={w / 2}
                  y={h * 0.65}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#887659"
                >
                  {o.label.slice(0, 16)}
                </text>
              )}
              {selected && edit && (
                <>
                  <rect className="plan-selection" width={w} height={h} />
                  <rect
                    className="plan-handle"
                    x={w - 6}
                    y={h - 6}
                    width="12"
                    height="12"
                    onPointerDown={(e) =>
                      start(e, { type: "object", id: o.id }, true)
                    }
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
      {!edit &&
        here.map((c, i) => {
          const a = activityAt(c, world.clock);
          const pose = motion?.[c.id];
          const x = pose?.placeId === place.id ? pose.x : 24 + (i % 3) * 17;
          const y =
            pose?.placeId === place.id ? pose.y : 68 - Math.floor(i / 3) * 25;
          const walking = running && pose?.walking;
          return (
            <button
              key={c.id}
              className={`plan-resident ${walking ? "is-walking" : "is-resting"} ${running ? "motion-playing" : "motion-paused"} ${a.action === "취침" && !walking ? "is-sleeping" : ""}`}
              style={{ left: x + "%", top: y + "%" }}
              aria-label={`${c.name} 상태 보기`}
              onClick={() => onCharacter?.(c.id)}
            >
              <span className="plan-action">
                {a.action === "취침" ? "💤" : a.action}
              </span>
              <span
                className="motion-figure"
                style={{ transform: `scaleX(${pose?.facing || 1})` }}
              >
                <CharacterImage c={c} />
              </span>
              <span className="plan-name">{c.name}</span>
            </button>
          );
        })}
      {!edit && !here.length && (
        <span className="plan-empty">지금은 조용한 공간이에요.</span>
      )}
    </div>
  );
  if (!edit) return <div className="plan-viewport">{board}</div>;
  return (
    <div className="plan-editor-layout">
      <div className="plan-editor-preview">
        <div className="plan-editor-tools">
          <button
            className={mode === "object" ? "active" : ""}
            onClick={() => setMode("object")}
          >
            가구·벽·문
          </button>
          <button
            className={mode === "room" ? "active" : ""}
            onClick={() => setMode("room")}
          >
            방·바닥 구역
          </button>
          <button
            disabled={!history.length}
            onClick={() => {
              onPlace?.(history.at(-1)!);
              setHistory((h) => h.slice(0, -1));
              setSelection(null);
            }}
          >
            ↶ 실행 취소
          </button>
        </div>
        <div className="plan-editor-viewport">{board}</div>
        <p>
          요소를 끌어 이동하고, 선택 테두리의 작은 사각형을 끌어 크기를 바꿔요.
        </p>
      </div>
      <aside className="plan-properties">
        <div className="plan-property-section">
          <h3>전개도 전체</h3>
          <Field label="빈 바닥색">
            <input
              aria-label="빈 바닥색"
              type="color"
              value={place.floor}
              onChange={(e) => commit({ ...place, floor: e.target.value })}
            />
          </Field>
          <div className="button-row">
            <button
              onClick={() => {
                if (
                  confirm(
                    "현재 장소의 모든 방과 가구를 비울까요? 실행 취소할 수 있어요.",
                  )
                ) {
                  commit({ ...place, rooms: [], furniture: [] });
                  setSelection(null);
                }
              }}
            >
              모두 비우기
            </button>
            <button
              onClick={() => {
                if (confirm("현재 장소를 새 기본 도면으로 바꿀까요?")) {
                  const p = defaultPlaces().find((p) => p.id === place.id);
                  if (p) commit({ ...p, name: place.name });
                  setSelection(null);
                }
              }}
            >
              기본 도면 복원
            </button>
          </div>
        </div>
        <div className="plan-property-section">
          <h3>추가하기</h3>
          <div className="object-categories">
            {["생활", "구조", "학교", "야외"].map((g) => (
              <button
                key={g}
                className={category === g ? "active" : ""}
                onClick={() => setCategory(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="object-palette">
            {FURNITURE_KINDS.filter(
              (k) => FURNITURE_META[k].group === category,
            ).map((kind) => (
              <button
                key={kind}
                disabled={place.furniture.length >= 200}
                onClick={() => add(kind)}
              >
                <svg
                  viewBox="0 0 100 100"
                  width="27"
                  height="27"
                  aria-hidden="true"
                >
                  <FurnitureArt kind={kind} />
                </svg>
                <span>{kind}</span>
              </button>
            ))}
          </div>
          <button
            disabled={place.rooms.length >= 40}
            onClick={() => {
              const id = uid();
              commit({
                ...place,
                rooms: [
                  ...place.rooms,
                  {
                    id,
                    name: "새 공간",
                    x: 20,
                    y: 20,
                    w: 35,
                    h: 35,
                    color: "#eee2c8",
                    pattern: "wood",
                    border: false,
                    radius: 0,
                  },
                ],
              });
              setMode("room");
              setSelection({ type: "room", id });
            }}
          >
            ＋ 방·바닥 구역 추가
          </button>
        </div>
        <div className="plan-property-section">
          <h3>선택한 요소</h3>
          <select
            aria-label="요소 선택"
            value={selection ? `${selection.type}:${selection.id}` : ""}
            onChange={(e) => {
              const [type, ...ids] = e.target.value.split(":");
              if (!type) {
                setSelection(null);
                return;
              }
              setSelection({
                type: type as Selection["type"],
                id: ids.join(":"),
              });
              setMode(type === "room" ? "room" : "object");
            }}
          >
            <option value="">선택해 주세요</option>
            <optgroup label="방·바닥">
              {place.rooms.map((r, i) => (
                <option value={`room:${r.id || i}`} key={r.id || i}>
                  {r.name || "이름 없는 바닥"}
                </option>
              ))}
            </optgroup>
            <optgroup label="가구·구조">
              {place.furniture.map((o, i) => (
                <option value={`object:${o.id}`} key={o.id}>
                  {i + 1}. {o.label}
                </option>
              ))}
            </optgroup>
          </select>
          {(object || room) && (
            <>
              <Field label="이름">
                <input
                  maxLength={60}
                  aria-label="선택 요소 이름"
                  value={object?.label ?? room!.name}
                  onChange={(e) =>
                    object
                      ? patchObject({ label: e.target.value })
                      : patchRoom({ name: e.target.value })
                  }
                />
              </Field>
              <div className="property-grid">
                {(["x", "y", "w", "h"] as const).map((key, i) => (
                  <Field
                    key={key}
                    label={
                      ["가로 위치 %", "세로 위치 %", "너비 %", "높이 %"][i]
                    }
                  >
                    <input
                      aria-label={
                        ["가로 위치", "세로 위치", "요소 너비", "요소 높이"][i]
                      }
                      type="number"
                      step=".5"
                      min={key === "w" || key === "h" ? 0.5 : 0}
                      max={100}
                      value={
                        Math.round(
                          (object
                            ? (object[key] ??
                              FURNITURE_META[object.kind][key as "w" | "h"])
                            : room![key]) * 10,
                        ) / 10
                      }
                      onChange={(e) => {
                        const val = clamp(
                          +e.target.value,
                          key === "w" || key === "h" ? 0.5 : 0,
                        );
                        object
                          ? patchObject({ [key]: val })
                          : patchRoom({
                              [key]:
                                key === "x"
                                  ? Math.min(val, 100 - room!.w)
                                  : key === "y"
                                    ? Math.min(val, 100 - room!.h)
                                    : key === "w"
                                      ? Math.min(val, 100 - room!.x)
                                      : Math.min(val, 100 - room!.y),
                            });
                      }}
                    />
                  </Field>
                ))}
              </div>
              {object && (
                <>
                  <Field label="회전">
                    <select
                      aria-label="회전"
                      value={object.rotation || 0}
                      onChange={(e) =>
                        patchObject({ rotation: +e.target.value })
                      }
                    >
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((n) => (
                        <option value={n} key={n}>
                          {n}°
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="요소 색상">
                    <input
                      aria-label="요소 색상"
                      type="color"
                      value={object.color || "#c5a77d"}
                      onChange={(e) => patchObject({ color: e.target.value })}
                    />
                  </Field>
                  <button onClick={() => patchObject({ color: "" })}>
                    원래 색상으로
                  </button>
                </>
              )}
              {room && (
                <>
                  <Field label="방 바닥색">
                    <input
                      aria-label="방 바닥색"
                      type="color"
                      value={room.color}
                      onChange={(e) => patchRoom({ color: e.target.value })}
                    />
                  </Field>
                  <Field label="바닥 무늬">
                    <select
                      value={room.pattern || "plain"}
                      onChange={(e) =>
                        patchRoom({
                          pattern: e.target.value as Room["pattern"],
                        })
                      }
                    >
                      <option value="wood">나무 바닥</option>
                      <option value="tile">타일</option>
                      <option value="grass">잔디</option>
                      <option value="plain">단색</option>
                    </select>
                  </Field>
                  <Field label="모서리 둥글기">
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={room.radius || 0}
                      onChange={(e) => patchRoom({ radius: +e.target.value })}
                    />
                  </Field>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={room.border || false}
                      onChange={(e) => patchRoom({ border: e.target.checked })}
                    />
                    방 테두리 표시
                  </label>
                </>
              )}
              <div className="button-row">
                <button
                  onClick={() => {
                    if (object) {
                      const id = uid();
                      commit({
                        ...place,
                        furniture: [
                          ...place.furniture,
                          {
                            ...object,
                            id,
                            x: clamp(object.x + 4),
                            y: clamp(object.y + 4),
                          },
                        ],
                      });
                      setSelection({ type: "object", id });
                    } else if (room) {
                      const id = uid();
                      commit({
                        ...place,
                        rooms: [
                          ...place.rooms,
                          {
                            ...room,
                            id,
                            x: clamp(room.x + 3, 0, 100 - room.w),
                            y: clamp(room.y + 3, 0, 100 - room.h),
                          },
                        ],
                      });
                      setSelection({ type: "room", id });
                    }
                  }}
                >
                  복제
                </button>
                <button className="danger" onClick={remove}>
                  선택 삭제
                </button>
                {object && (
                  <button
                    onClick={() =>
                      commit({
                        ...place,
                        furniture: [
                          ...place.furniture.filter((o) => o.id !== object.id),
                          object,
                        ],
                      })
                    }
                  >
                    맨 앞으로
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
