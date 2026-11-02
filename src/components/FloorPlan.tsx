import { useRef, useState } from "react";
import {
  DEFAULT_CHARACTER_IMAGE,
  type World,
  type Place,
  type Furniture,
  type Character,
} from "../types";
import { activityAt } from "../simulation";
import { uid, defaultPlaces } from "../defaults";
const kinds: Furniture["kind"][] = [
  "소파",
  "침대",
  "테이블",
  "책상",
  "화분",
  "메모",
];
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
export function FloorPlan({
  world,
  place,
  edit = false,
  onPlace,
  onCharacter,
}: {
  world: World;
  place: Place;
  edit?: boolean;
  onPlace?: (p: Place) => void;
  onCharacter?: (id: string) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("작은 메모");
  const current = place.furniture.find((f) => f.id === selected);
  function move(e: React.PointerEvent, id: string) {
    if (!edit) return;
    e.preventDefault();
    setSelected(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function drag(e: React.PointerEvent, id: string) {
    if (
      !edit ||
      !(e.buttons & 1) ||
      !e.currentTarget.hasPointerCapture(e.pointerId)
    )
      return;
    const r = board.current!.getBoundingClientRect();
    onPlace?.({
      ...place,
      furniture: place.furniture.map((f) =>
        f.id === id
          ? {
              ...f,
              x: Math.max(
                6,
                Math.min(94, ((e.clientX - r.left) / r.width) * 100),
              ),
              y: Math.max(
                10,
                Math.min(90, ((e.clientY - r.top) / r.height) * 100),
              ),
            }
          : f,
      ),
    });
  }
  const here = world.characters.filter(
    (c) => activityAt(c, world.clock).placeId === place.id,
  );
  return (
    <div className="floor-wrap">
      {edit && (
        <div className="decorate">
          <label>
            바닥색{" "}
            <input
              aria-label="바닥색"
              type="color"
              value={place.floor}
              onChange={(e) =>
                onPlace?.({
                  ...place,
                  floor: e.target.value,
                  rooms: place.rooms.map((r) => ({
                    ...r,
                    color: e.target.value,
                  })),
                })
              }
            />
          </label>
          <button
            onClick={() => onPlace?.({ ...place, rooms: [], furniture: [] })}
          >
            빈 공간으로
          </button>
          <button
            onClick={() => {
              const p = defaultPlaces().find((p) => p.id === place.id);
              if (p) onPlace?.(p);
            }}
          >
            기본 도면 복원
          </button>
          <span className="muted">가구를 끌어서 옮겨요.</span>
        </div>
      )}
      <div
        ref={board}
        className={`floor ${edit ? "editing" : ""}`}
        style={{ backgroundColor: place.floor }}
        aria-label={`${place.name} 전개도`}
      >
        {place.rooms.map((r, i) => (
          <div
            className="room"
            key={i}
            style={{
              left: r.x + "%",
              top: r.y + "%",
              width: r.w + "%",
              height: r.h + "%",
              backgroundColor: r.color,
            }}
          >
            <span>{r.name}</span>
          </div>
        ))}
        {place.rooms.length > 0 && place.id === "home" && (
          <div className="home-fixtures" aria-hidden="true">
            <div className="living-rug" />
            <div className="kitchen-counter">
              <i />
              <i />
              <i />
            </div>
            <div className="hall-rug" />
          </div>
        )}
        {place.furniture.map((f) => (
          <button
            key={f.id}
            aria-label={`${f.kind}: ${f.label}`}
            className={`furniture ${f.kind} ${selected === f.id && edit ? "selected" : ""}`}
            style={{ left: f.x + "%", top: f.y + "%" }}
            onPointerDown={(e) => move(e, f.id)}
            onPointerMove={(e) => drag(e, f.id)}
            onClick={() => edit && setSelected(f.id)}
            disabled={!edit}
            title={f.label}
          >
            <span className="furniture-art">
              {f.kind === "화분" ? "🌿" : f.kind === "메모" ? "✎" : ""}
            </span>
            <small>{f.label}</small>
          </button>
        ))}
        {!edit &&
          here.map((c, i) => {
            const act = activityAt(c, world.clock);
            return (
              <div
                key={c.id}
                role={onCharacter ? "button" : undefined}
                tabIndex={onCharacter ? 0 : undefined}
                aria-label={`${c.name} 상태 보기`}
                onClick={() => onCharacter?.(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCharacter?.(c.id);
                  }
                }}
                className={`resident ${onCharacter ? "clickable" : ""} ${act.action === "취침" ? "asleep" : ""}`}
                style={{
                  left: `${20 + (i % 3) * 27}%`,
                  top: `${66 - Math.floor(i / 3) * 38}%`,
                }}
              >
                <span className="activity-tag">
                  {act.action === "취침"
                    ? "💤"
                    : act.action === "식사"
                      ? "🍚"
                      : act.action === "공부" || act.action === "등교"
                        ? "✏️"
                        : act.action === "출근"
                          ? "💼"
                          : "☀️"}{" "}
                  {act.action}
                </span>
                <CharacterImage c={c} />
                <span className="name-tag">{c.name}</span>
              </div>
            );
          })}
        {!here.length && !edit && (
          <div className="empty-room">지금은 조용한 공간이에요.</div>
        )}
      </div>
      {edit && (
        <>
          <div className="decorate">
            {kinds.map((kind) => (
              <button
                key={kind}
                onClick={() => {
                  const id = uid();
                  onPlace?.({
                    ...place,
                    furniture: [
                      ...place.furniture,
                      {
                        id,
                        kind,
                        x: 50,
                        y: 50,
                        label: kind === "메모" ? note : kind,
                      },
                    ],
                  });
                  setSelected(id);
                }}
              >
                ＋ {kind}
              </button>
            ))}
            <input
              aria-label="새 메모 내용"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 60))}
              placeholder="메모 내용"
            />
          </div>
          {current && (
            <div className="decorate">
              <label>
                선택한 가구{" "}
                <input
                  value={current.label}
                  onChange={(e) =>
                    onPlace?.({
                      ...place,
                      furniture: place.furniture.map((f) =>
                        f.id === current.id
                          ? { ...f, label: e.target.value.slice(0, 60) }
                          : f,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="danger"
                onClick={() => {
                  onPlace?.({
                    ...place,
                    furniture: place.furniture.filter(
                      (f) => f.id !== current.id,
                    ),
                  });
                  setSelected("");
                }}
              >
                선택 가구 삭제
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
