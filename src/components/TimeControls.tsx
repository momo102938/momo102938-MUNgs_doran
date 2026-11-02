import type { World } from "../types";
import { timeString } from "../simulation";
export function TimeControls({
  world,
  running,
  onToggle,
  update,
}: {
  world: World;
  running: boolean;
  onToggle: () => void;
  update: (fn: (w: World) => World) => void;
}) {
  const date = new Date(world.clock);
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (
    <div className="day-controls">
      <div className="day-clock">
        <small>
          {date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </small>
        <strong>{timeString(world.clock)}</strong>
      </div>
      <div className="day-progress">
        <span>☀</span>
        <progress max={1440} value={minutes} aria-label="하루의 흐름" />
        <span>☾</span>
      </div>
      <div className="time-controls">
        <button className="play" onClick={onToggle}>
          {running ? "Ⅱ 일시 정지" : "▷ 재생"}
        </button>
        <select
          aria-label="시간 배속"
          value={world.speed}
          disabled={world.pcSync}
          onChange={(e) => update((w) => ({ ...w, speed: +e.target.value }))}
        >
          <option value={1}>1배속</option>
          <option value={10}>10배속</option>
          <option value={60}>60배속</option>
        </select>
      </div>
      <span className="time-note">
        {world.pcSync
          ? "PC 시각과 연동 중"
          : running
            ? "하루가 흐르고 있어요"
            : "잠시 쉬어가는 중"}
      </span>
    </div>
  );
}
