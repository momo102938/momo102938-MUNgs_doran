import type { Place } from "./types";
export const PLACE_ORDER = [
  "home",
  "office",
  "school",
  "university",
  "square",
] as const;
export function orderPlaces(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    const ai = PLACE_ORDER.indexOf(a.id as (typeof PLACE_ORDER)[number]),
      bi = PLACE_ORDER.indexOf(b.id as (typeof PLACE_ORDER)[number]);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
}
export const isProfessor = (job: string) => /교수/.test(job);
export const isTeacher = (job: string) => /교사|선생|교수|강사|교원/.test(job);
export function schoolForAge(placeId: string, age: number, job = ""): string {
  if (isProfessor(job) && ["office", "school", "university"].includes(placeId))
    return "university";
  if (isTeacher(job)) return placeId;
  if (placeId === "school" || placeId === "university")
    return age >= 20 ? "university" : "school";
  return placeId;
}
export const schoolAgeHint = (placeId: string) =>
  placeId === "school"
    ? "학생은 19세 이하 · 선생님·교사는 나이 제한 없이 방문"
    : placeId === "university"
      ? "학생은 20세 이상 · 교수의 근무 장소"
      : "";
