import { sanitizeMotion, type MotionMap } from "../motion";
import { useEffect, useState } from "react";
import { type World, STORAGE_KEY } from "../types";
import { loadWorld, normalizeWorld } from "../storage";
import { PlaceTabs } from "./Observation";
import { FloorPlan } from "./FloorPlan";
import { activityAt, timeString } from "../simulation";
export function PopupView() {
  const [world, setWorld] = useState<World>(() => loadWorld().world);
  const [placeId, setPlaceId] = useState("home");
  const [motion, setMotion] = useState<MotionMap>({});
  const [running, setRunning] = useState(false);
  const [top, setTop] = useState(true);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    document.body.classList.add("popup-body");
    document.documentElement.classList.add("popup-document");
    const channel = new BroadcastChannel("doran.live");
    channel.onmessage = (e) => {
      if (e.data?.type === "motion") {
        setMotion(sanitizeMotion(e.data.motion));
        setRunning(e.data.running === true);
        return;
      }
      if (e.data?.type === "world") {
        try {
          setWorld(normalizeWorld(e.data.world));
          setMotion(sanitizeMotion(e.data.motion));
          setRunning(e.data.running === true);
          setConnected(true);
        } catch {
          /* 잘못된 다른 창 메시지는 무시한다. */
        }
      }
    };
    channel.postMessage({ type: "hello" });
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue)
        try {
          setWorld(normalizeWorld(JSON.parse(e.newValue)));
        } catch {
          /* 기존 화면 유지 */
        }
    };
    window.addEventListener("storage", listener);
    return () => {
      channel.close();
      window.removeEventListener("storage", listener);
      document.body.classList.remove("popup-body");
      document.documentElement.classList.remove("popup-document");
    };
  }, []);
  const place = world.places.find((p) => p.id === placeId) || world.places[0];
  return (
    <main className="popup-shell">
      <header className="popup-header">
        <b>
          도란{" "}
          <span>
            {new Date(world.clock).toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })}{" "}
            · {timeString(world.clock)}
          </span>
        </b>
        <div>
          {window.doranDesktop && (
            <button
              onClick={async () =>
                setTop(await window.doranDesktop!.toggleTop())
              }
            >
              {top ? "고정 해제" : "항상 위"}
            </button>
          )}
          <button
            onClick={() => window.doranDesktop?.closePopup() || window.close()}
          >
            닫기
          </button>
        </div>
      </header>
      <PlaceTabs world={world} placeId={place.id} onSelect={setPlaceId} />
      <FloorPlan
        world={world}
        place={place}
        motion={motion}
        running={running}
      />
      <div className="popup-actions">
        {world.characters
          .filter((c) => activityAt(c, world.clock).placeId === place.id)
          .map((c) => (
            <span key={c.id}>
              {c.name} · {activityAt(c, world.clock).action}
            </span>
          ))}
      </div>
      <p className="muted small">
        {connected
          ? "메인 화면과 함께 흐르는 하루"
          : "메인 화면을 열고 시간을 재생해 주세요."}
      </p>
    </main>
  );
}
