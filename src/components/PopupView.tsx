import { sanitizeMotion, type MotionMap } from "../motion";
import { useEffect, useState } from "react";
import { type World, STORAGE_KEY } from "../types";
import { loadWorld, normalizeWorld } from "../storage";
import { FloorPlan } from "./FloorPlan";
export function PopupView() {
  const [world, setWorld] = useState<World>(() => loadWorld().world);
  const [placeId, setPlaceId] = useState("home");
  const [motion, setMotion] = useState<MotionMap>({});
  const [running, setRunning] = useState(false);
  const [top, setTop] = useState(true);
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
      <div className="popup-drag-handle" aria-hidden="true" />
      <nav className="popup-overlay-controls" aria-label="팝업 조작">
        <select
          aria-label="팝업 장소 선택"
          value={place.id}
          onChange={(e) => setPlaceId(e.target.value)}
        >
          {world.places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {window.doranDesktop && (
          <button
            onClick={async () => setTop(await window.doranDesktop!.toggleTop())}
          >
            {top ? "고정 해제" : "항상 위"}
          </button>
        )}
        <button
          onClick={() => {
            if (window.doranDesktop) window.doranDesktop.closePopup();
            else window.close();
          }}
        >
          닫기
        </button>
      </nav>
      <FloorPlan
        world={world}
        place={place}
        motion={motion}
        running={running}
      />
    </main>
  );
}
