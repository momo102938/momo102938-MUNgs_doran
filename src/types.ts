export const MAX_CHARACTERS = 6;
export const MAX_LINES = 20;
export const DEFAULT_CHARACTER_IMAGE = "./characters/placeholder.png";
export const WORLD_VERSION = 1;
export const STORAGE_KEY = "doran.world.v1";
export const ACTIONS = [
  "기상",
  "식사",
  "출근",
  "등교",
  "귀가",
  "공부",
  "놀이",
  "대화",
  "취침",
] as const;
export type Action = (typeof ACTIONS)[number];
export const RELATION_TYPES = [
  "연인",
  "친구",
  "룸메이트",
  "직장 동료",
  "부모와 자녀",
  "형제자매",
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];
export type FurnitureKind =
  "소파" | "침대" | "테이블" | "책상" | "화분" | "메모";
export interface Furniture {
  id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  label: string;
}
export interface Room {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}
export interface Place {
  id: string;
  name: string;
  floor: string;
  rooms: Room[];
  furniture: Furniture[];
}
export interface Schedule {
  id: string;
  time: string;
  action: Action;
  placeId: string;
}
export interface ChildSettings {
  parentIds: string[];
  schoolId: string;
  schoolTime: string;
  homework: string;
  homeTime: string;
  bedtime: string;
}
export interface Memory {
  id: string;
  text: string;
  at: string;
}
export interface Character {
  id: string;
  name: string;
  image: string;
  age: number;
  personality: string;
  tone: string;
  job: string;
  likes: string;
  dislikes: string;
  habits: string;
  mood: number;
  fatigue: number;
  lines: string[];
  schedule: Schedule[];
  memories: Memory[];
  child: ChildSettings | null;
}
export interface Relationship {
  id: string;
  a: string;
  b: string;
  type: RelationType;
  intimacy: number;
}
export interface Log {
  id: string;
  at: string;
  speakerId: string | null;
  targetId: string | null;
  text: string;
  kind: "대화" | "사건";
}
export interface World {
  version: number;
  name: string;
  characters: Character[];
  places: Place[];
  relationships: Relationship[];
  logs: Log[];
  clock: string;
  pcSync: boolean;
  speed: number;
  randomEvents: boolean;
  lastTalkAt: string;
  lastEventAt: string;
}
export interface Activity {
  action: Action;
  placeId: string;
}
export interface DesktopAPI {
  openPopup: () => Promise<void>;
  toggleTop: () => Promise<boolean>;
  closePopup: () => void;
  isPopup: boolean;
}
declare global {
  interface Window {
    doranDesktop?: DesktopAPI;
  }
}
