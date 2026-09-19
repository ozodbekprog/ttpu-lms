import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
};

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        meta: input.meta,
      },
    });
  } catch {}
}
