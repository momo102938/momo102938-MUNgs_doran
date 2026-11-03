export const MAX_CHARACTERS = 6;
export const MAX_LINES = 20;
export const DEFAULT_CHARACTER_IMAGE = "./characters/placeholder.png";
export const WORLD_VERSION = 2;
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
  "씻기",
  "수업",
  "바람 쐬기",
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
export const FURNITURE_KINDS = [
  "소파",
  "침대",
  "1인 침대",
  "테이블",
  "책상",
  "화분",
  "메모",
  "의자",
  "러그",
  "싱크대",
  "냉장고",
  "욕조",
  "변기",
  "세면대",
  "책장",
  "수납장",
  "텔레비전",
  "벽",
  "문",
  "창문",
  "미닫이창",
  "칠판",
  "교탁",
  "강의책상",
  "시계",
  "벤치",
  "나무",
  "분수",
  "카페",
  "조명",
] as const;
export type FurnitureKind = (typeof FURNITURE_KINDS)[number];
export interface Furniture {
  id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  label: string;
  w?: number;
  h?: number;
  rotation?: number;
  color?: string;
}
export interface Room {
  id?: string;
  pattern?: "wood" | "tile" | "plain" | "grass";
  border?: boolean;
  radius?: number;
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
  layoutVersion?: number;
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
  politeToOlder: boolean;
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
