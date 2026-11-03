import type { World } from "../types";
import { timeString } from "../simulation";
export function TimeControls({
  world,
  running,
  onToggle,
}: {
  world: World;
  running: boolean;
  onToggle: () => void;
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
      </div>
      <span className="time-note">
        {running ? "PC 시각과 함께 흐르고 있어요" : "시간이 잠시 멈춰 있어요"}
      </span>
    </div>
  );
}
