import type { Place } from "./types";
// ID를 제외한 배치 전체가 이전 기본 집과 같을 때만 새 베란다 배치로 바꾼다.
// 가구를 하나라도 옮기거나 추가한 사용자의 전개도는 그대로 둔다.
export function isUntouchedLegacyHome(p: Place): boolean {
  const blueprint = JSON.stringify([
    p.floor,
    p.rooms.map((r) => [
      r.name,
      r.x,
      r.y,
      r.w,
      r.h,
      r.color,
      r.pattern || "plain",
      r.radius || 0,
      r.border || false,
    ]),
    p.furniture.map((f) => [
      f.kind,
      f.x,
      f.y,
      f.w,
      f.h,
      f.rotation || 0,
      f.label,
      f.color || "",
    ]),
  ]);
  let hash = 2166136261;
  for (const c of blueprint)
    hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  return p.id === "home" && hash === 4283685465;
}
