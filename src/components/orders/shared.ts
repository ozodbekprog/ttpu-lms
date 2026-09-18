export const ORDER_TYPES = ["TRANSCRIPT", "CERTIFICATE", "RETAKE", "OTHER"] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderStatusTone = "blue" | "amber" | "green" | "rose";

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  TRANSCRIPT: "Transkript",
  CERTIFICATE: "Ma'lumotnoma",
  RETAKE: "Qayta topshirish",
  OTHER: "Boshqa",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Yangi",
  IN_PROGRESS: "Jarayonda",
  DONE: "Bajarildi",
  REJECTED: "Rad etildi",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, OrderStatusTone> = {
  NEW: "blue",
  IN_PROGRESS: "amber",
  DONE: "green",
  REJECTED: "rose",
};

export function isOrderType(value: string): value is OrderType {
  return (ORDER_TYPES as readonly string[]).includes(value);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function toOrderType(value: string): OrderType {
  return isOrderType(value) ? value : "OTHER";
}

export function toOrderStatus(value: string): OrderStatus {
  return isOrderStatus(value) ? value : "NEW";
}
