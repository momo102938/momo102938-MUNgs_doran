import { useEffect, useRef, useState } from "react";
import { useWorldMotion } from "./motion";
import type { World } from "./types";
import { loadWorld, saveWorld, downloadWorld } from "./storage";
import { advance, talk, randomEvent } from "./simulation";
import { Observation, ConversationLog } from "./components/Observation";
import { CharacterEditor } from "./components/CharacterEditor";
import { RelationshipEditor } from "./components/RelationshipEditor";
import { WorldSettings } from "./components/WorldSettings";
import { TimeControls } from "./components/TimeControls";
import { PopupView } from "./components/PopupView";
const tabs = [
  "관찰 화면",
  "캐릭터 편집",
  "관계 설정",
  "세계 설정",
  "대화 기록",
];
export default function App() {
  return new URLSearchParams(location.search).has("popup") ? (
    <PopupView />
  ) : (
    <Main />
  );
}
function Main() {
  const [loaded] = useState(loadWorld);
  const [world, setWorld] = useState(loaded.world);
  const [running, setRunning] = useState(false);
  const motion = useWorldMotion(world, running);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const runningRef = useRef(running);
  runningRef.current = running;
  const [tab, setTab] = useState(tabs[0]);
  const [place, setPlace] = useState("home");
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState(loaded.error);
  const [canSave, setCanSave] = useState(!loaded.error);
  const worldRef = useRef(world);
  const channel = useRef<BroadcastChannel | null>(null);
  worldRef.current = world;
  const update = (fn: (w: World) => World) => setWorld(fn);
  useEffect(() => {
    const c = new BroadcastChannel("doran.live");
    channel.current = c;
    c.onmessage = (e) => {
      if (e.data?.type === "hello")
        c.postMessage({
          type: "world",
          world: worldRef.current,
          motion: motionRef.current,
          running: runningRef.current,
        });
    };
    return () => c.close();
  }, []);
  useEffect(() => {
    channel.current?.postMessage({
      type: "world",
      world,
      motion: motionRef.current,
      running,
    });
    if (canSave) {
      try {
        saveWorld(world);
        setSaveError("");
      } catch {
        setSaveError("SAVE_FAILED");
      }
    }
  }, [world, canSave, running]);
  useEffect(() => {
    channel.current?.postMessage({ type: "motion", motion, running });
  }, [motion, running]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () =>
        setWorld((w) =>
          advance(
            w,
            w.pcSync
              ? new Date().toISOString()
              : new Date(Date.parse(w.clock) + w.speed * 60000).toISOString(),
          ),
        ),
      1000,
    );
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && world.pcSync)
      setWorld((w) => advance(w, new Date().toISOString()));
  }, [world.pcSync, running]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    const listener = () => {
      if (canSave)
        try {
          saveWorld(worldRef.current);
        } catch {
          /* 저장 실패 안내는 화면에 유지한다 */
        }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [canSave]);
  async function popup() {
    try {
      if (window.doranDesktop) {
        await window.doranDesktop.openPopup();
        return;
      }
      const url = new URL(location.href);
      url.search = "?popup=1";
      const p = window.open(
        url.toString(),
        "doran-popup",
        "popup,width=720,height=480",
      );
      if (!p)
        setNotice(
          "팝업이 차단됐어요. 주소창에서 팝업을 허용한 뒤 다시 눌러 주세요.",
        );
    } catch {
      setNotice("작은 창을 열지 못했어요. 다시 시도해 주세요.");
    }
  }
  const status = saveError
    ? saveError === "SAVE_FAILED"
      ? "저장 공간이 부족하거나 사용할 수 없어요. JSON으로 내보내거나 이미지 크기를 줄여 주세요."
      : saveError
    : "";
  return (
    <div className={`app ${tab === tabs[0] ? "observe-mode" : ""}`}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab(tabs[0]);
          }}
        >
          <span className="brand-mark">⌂</span>도란
          <span className="brand-dot">.</span>
        </a>
        <p className="brand-note">함께 살아가는 작은 세계</p>
        <nav>
          {tabs.map((t, i) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              <span>{["◉", "♧", "♡", "⚙", "☷"][i]}</span>
              {t}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="live-dot" /> 나의 기기에 저장되는 하루
          <p>
            온라인 공유 링크와
            <br />
            서버 저장은 제공하지 않아요.
          </p>
          <button onClick={() => downloadWorld(world)}>
            ↓ 도란 파일 내보내기
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="topbar-label">생활 시뮬레이션</span>
          <div className="topbar-actions">
            <small>
              <span className="live-dot" />
              {saveError ? "저장 확인 필요" : "이 기기에 자동 저장"}
            </small>
            <button
              disabled={!canSave}
              onClick={() => {
                try {
                  saveWorld(world);
                  setNotice("현재 세계를 저장했어요.");
                  setSaveError("");
                } catch {
                  setSaveError("SAVE_FAILED");
                }
              }}
            >
              ▣ 저장
            </button>
            <button onClick={() => void popup()}>팝업 보기</button>
            <button
              className="export-button"
              onClick={() => downloadWorld(world)}
            >
              ↓ 파일 내보내기
            </button>
          </div>
        </header>
        <main className="main-content">
          {status && (
            <div className="error-banner" role="alert">
              {status}
              <div className="button-row">
                <button onClick={() => downloadWorld(world)}>
                  현재 세계 JSON 백업
                </button>
                {!canSave && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "기존 저장본을 새 세계로 바꾸고 자동 저장을 시작할까요?",
                        )
                      )
                        setCanSave(true);
                    }}
                  >
                    새 세계로 저장
                  </button>
                )}
              </div>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              {notice}
              <button onClick={() => setNotice("")} aria-label="알림 닫기">
                ×
              </button>
            </div>
          )}
          {tab === tabs[0] && (
            <>
              <Observation
                world={world}
                motion={motion}
                placeId={place}
                setPlaceId={setPlace}
                update={update}
                running={running}
                onHistory={() => setTab(tabs[4])}
                timeline={
                  <TimeControls
                    world={world}
                    running={running}
                    onToggle={() => setRunning(!running)}
                    update={update}
                  />
                }
              />
            </>
          )}
          {tab !== tabs[0] && (
            <div className="panel secondary-time">
              <TimeControls
                world={world}
                running={running}
                onToggle={() => setRunning(!running)}
                update={update}
              />
              <div className="button-row">
                <button onClick={() => update((w) => talk(w))}>말 걸기</button>
                <button onClick={() => update((w) => randomEvent(w))}>
                  랜덤 사건
                </button>
              </div>
            </div>
          )}
          {tab === tabs[1] && (
            <CharacterEditor world={world} update={update} report={setNotice} />
          )}
          {tab === tabs[2] && (
            <RelationshipEditor world={world} update={update} />
          )}
          {tab === tabs[3] && (
            <WorldSettings
              world={world}
              update={update}
              report={setNotice}
              replace={(w) => {
                setRunning(false);
                setWorld(w);
                setCanSave(true);
              }}
            />
          )}
          {tab === tabs[4] && (
            <ConversationLog
              world={world}
              clear={() => update((w) => ({ ...w, logs: [] }))}
            />
          )}
          <footer className="main-footer">
            도란 · 작은 일상이 쌓이는 곳{" "}
            <span>
              {world.pcSync
                ? "컴퓨터의 시각을 따라가요."
                : "1배속은 실제 1초에 게임 속 1분이에요."}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
