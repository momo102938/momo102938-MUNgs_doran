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
export function schoolForAge(placeId: string, age: number): string {
  if (placeId === "school" || placeId === "university")
    return age >= 20 ? "university" : "school";
  return placeId;
}
export const schoolAgeHint = (placeId: string) =>
  placeId === "school"
    ? "19세 이하"
    : placeId === "university"
      ? "20세 이상"
      : "";
