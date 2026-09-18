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

export const ROOM_TYPE_ICONS: Record<RoomType, string[]> = {
  AUDITORIUM: [
    "M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    "M8 20h8",
    "M12 16v4",
  ],
  LAB: [
    "M9 3h6",
    "M10 3v5.5L4.7 17a2.6 2.6 0 0 0 2.2 4h10.2a2.6 2.6 0 0 0 2.2-4L14 8.5V3",
    "M7.8 15h8.4",
  ],
  HALL: [
    "M3 21h18",
    "M12 3 4 10h16Z",
    "M6 10v8",
    "M10 10v8",
    "M14 10v8",
    "M18 10v8",
  ],
};

export const ROOM_TYPE_META: Record<RoomType, { tile: string; stripe: string }> = {
  AUDITORIUM: {
    tile: "bg-slate-100 text-slate-600 ring-slate-200",
    stripe: "from-slate-300 via-slate-400 to-slate-500",
  },
  LAB: {
    tile: "bg-brand-50 text-brand-700 ring-brand-100",
    stripe: "from-brand-400 via-brand-500 to-brand-700",
  },
  HALL: {
    tile: "bg-purple-50 text-purple-700 ring-purple-100",
    stripe: "from-purple-400 via-purple-500 to-purple-700",
  },
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
