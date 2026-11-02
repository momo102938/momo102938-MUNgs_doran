import { useRef } from "react";
import type { World } from "../types";
import { downloadWorld, importWorld } from "../storage";
import { Field } from "./Fields";
export function WorldSettings({
  world,
  update,
  replace,
  report,
}: {
  world: World;
  update: (fn: (w: World) => World) => void;
  replace: (w: World) => void;
  report: (s: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="panel editor">
      <p className="eyebrow">이곳에서 이어지는 하루</p>
      <h2>세계 설정</h2>
      <div className="form-grid">
        <Field label="세계 이름">
          <input
            value={world.name}
            maxLength={40}
            onChange={(e) => update((w) => ({ ...w, name: e.target.value }))}
          />
        </Field>
        <Field label="시뮬레이션 날짜 · 시각">
          <input
            type="datetime-local"
            disabled={world.pcSync}
            value={localDateTime(world.clock)}
            onChange={(e) => {
              const n = new Date(e.target.value);
              if (Number.isFinite(n.getTime()))
                update((w) => ({
                  ...w,
                  clock: n.toISOString(),
                  lastTalkAt: "",
                  lastEventAt: "",
                }));
            }}
          />
        </Field>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={world.pcSync}
          onChange={(e) => update((w) => ({ ...w, pcSync: e.target.checked }))}
        />{" "}
        PC 시각과 연동
      </label>
      <p className="muted">
        켜고 재생하면 컴퓨터의 날짜와 시각에 맞춰요. 일시 정지하면 시간이
        멈추고, 다시 재생하면 현재 PC 시각으로 돌아가요. 연동 중에는 배속을
        사용할 수 없어요.
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={world.randomEvents}
          onChange={(e) =>
            update((w) => ({ ...w, randomEvents: e.target.checked }))
          }
        />{" "}
        작은 랜덤 사건 자동 발생
      </label>
      <h3>장소 이름</h3>
      <div className="form-grid">
        {world.places.map((p) => (
          <Field key={p.id} label={`장소 · ${p.id}`}>
            <input
              maxLength={40}
              value={p.name}
              onChange={(e) =>
                update((w) => ({
                  ...w,
                  places: w.places.map((x) =>
                    x.id === p.id ? { ...x, name: e.target.value } : x,
                  ),
                }))
              }
            />
          </Field>
        ))}
      </div>
      <div className="notice">
        <h3>이 브라우저에 자동 저장해요</h3>
        <p>
          캐릭터·관계·일정·기억·대화·전개도는 이 기기의 브라우저에 저장돼요.
          온라인 공유 링크와 서버 저장은 제공하지 않아요. 브라우저 데이터 삭제
          전에는 JSON으로 백업해 주세요. 웹과 Windows 앱의 저장 공간은 서로
          달라요.
        </p>
      </div>
      <div className="button-row">
        <button className="primary" onClick={() => downloadWorld(world)}>
          도란 파일 내보내기
        </button>
        <button onClick={() => input.current?.click()}>
          JSON 파일 불러오기
        </button>
        <input
          ref={input}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (
              !confirm(
                "현재 세계를 파일의 내용으로 바꿀까요? 현재 세계가 필요하면 먼저 내보내 주세요.",
              )
            ) {
              e.target.value = "";
              return;
            }
            try {
              replace(await importWorld(file));
              report("세계를 불러왔어요. 시간은 잠시 멈춰 두었어요.");
            } catch (err) {
              report(`불러오지 못했어요. ${(err as Error).message}`);
            }
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
function localDateTime(iso: string) {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
