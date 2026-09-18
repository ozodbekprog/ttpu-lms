export type RoomOption = {
  id: string;
  name: string;
  building: string | null;
  capacity: number | null;
};

export type BookingUser = {
  id: string;
  name: string;
  email: string;
  group: { name: string } | null;
};

export type BookingItem = {
  id: string;
  roomName: string;
  date: string;
  slot: number;
  purpose: string | null;
  status: string;
  createdAt: string;
  userId: string;
  user: BookingUser;
};
