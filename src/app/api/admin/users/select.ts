import type { Prisma } from "@prisma/client";

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  group: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;
