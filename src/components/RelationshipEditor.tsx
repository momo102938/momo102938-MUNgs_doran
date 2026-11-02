import { RELATION_TYPES, type World, type Relationship } from "../types";
import { uid } from "../defaults";
import { Field } from "./Fields";
export function RelationshipEditor({
  world,
  update,
}: {
  world: World;
  update: (fn: (w: World) => World) => void;
}) {
  const pairs = world.characters.flatMap((a, i) =>
    world.characters.slice(i + 1).map((b) => ({ a, b })),
  );
  function set(a: string, b: string, p: Partial<Relationship>) {
    update((w) => {
      const r = w.relationships.find(
        (r) => (r.a === a && r.b === b) || (r.b === a && r.a === b),
      );
      return {
        ...w,
        relationships: r
          ? w.relationships.map((x) => (x.id === r.id ? { ...x, ...p } : x))
          : [
              ...w.relationships,
              { id: uid(), a, b, type: "친구", intimacy: 50, ...p },
            ],
      };
    });
  }
  return (
    <section className="panel editor">
      <p className="eyebrow">조금씩 가까워지는 사이</p>
      <h2>캐릭터 관계 설정</h2>
      <p className="muted">
        같은 장소에서 대화하고 작은 사건을 겪으며 관계가 달라져요. 친밀도가
        낮으면 조심스럽게 대화를 시작해요.
      </p>
      <div className="relationship-grid">
        {pairs.map(({ a, b }) => {
          const r = world.relationships.find(
            (r) =>
              (r.a === a.id && r.b === b.id) || (r.b === a.id && r.a === b.id),
          );
          return (
            <div className="relation-card" key={`${a.id}:${b.id}`}>
              <h3>
                {a.name} <span>↔</span> {b.name}
              </h3>
              <Field label="관계">
                <select
                  value={r?.type || ""}
                  onChange={(e) =>
                    set(a.id, b.id, {
                      type: e.target.value as Relationship["type"],
                    })
                  }
                >
                  <option disabled value="">
                    아직 설정하지 않았어요
                  </option>
                  {RELATION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label={`친밀도 ${Math.round(r?.intimacy || 0)}`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={r?.intimacy || 0}
                  onChange={(e) =>
                    set(a.id, b.id, { intimacy: +e.target.value })
                  }
                />
              </Field>
              {r && (
                <button
                  onClick={() =>
                    update((w) => ({
                      ...w,
                      relationships: w.relationships.filter(
                        (x) => x.id !== r.id,
                      ),
                    }))
                  }
                >
                  관계 지우기
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
