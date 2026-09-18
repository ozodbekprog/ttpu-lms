export const ROOM_TYPES = ["AUDITORIUM", "LAB", "HALL"] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  AUDITORIUM: "Auditoriya",
  LAB: "Laboratoriya",
  HALL: "Zal",
};

export const ROOM_TYPE_TONES: Record<RoomType, "slate" | "blue" | "purple"> = {
  AUDITORIUM: "slate",
  LAB: "blue",
  HALL: "purple",
};

const LAB_KEYWORDS = ["lab", "laborator"];
const HALL_KEYWORDS = ["zal", "hall"];

export type RoomLike = {
  name: string;
  building: string | null;
  equipment: string | null;
};

export function isRoomType(value: string): value is RoomType {
  return (ROOM_TYPES as readonly string[]).includes(value);
}

export function roomType(room: RoomLike): RoomType {
  const haystack = `${room.name} ${room.building ?? ""} ${room.equipment ?? ""}`.toLowerCase();
  if (LAB_KEYWORDS.some((keyword) => haystack.includes(keyword))) return "LAB";
  if (HALL_KEYWORDS.some((keyword) => haystack.includes(keyword))) return "HALL";
  return "AUDITORIUM";
}

export function matchesRoomType(room: RoomLike, type: string): boolean {
  if (!isRoomType(type)) return true;
  return roomType(room) === type;
}
