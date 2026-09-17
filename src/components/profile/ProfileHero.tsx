import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { Avatar, Badge, Card } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

export const ROLE_META: Record<Role, { label: string; tone: "brand" | "purple" | "slate" }> = {
  ADMIN: { label: "Administrator", tone: "brand" },
  TEACHER: { label: "O'qituvchi", tone: "purple" },
  STUDENT: { label: "Talaba", tone: "slate" },
};

const COVER_PATTERN = {
  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
  backgroundSize: "18px 18px",
};

export function ProfileHero({
  name,
  email,
  role,
  avatarUrl,
  coverUrl,
  bio,
  createdAt,
  groupName,
  avatar,
  action,
}: {
  name: string;
  email?: string;
  role: Role;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  createdAt: Date;
  groupName: string | null;
  avatar?: ReactNode;
  action?: ReactNode;
}) {
  const meta = ROLE_META[role];

  return (
    <Card className="overflow-hidden">
      <div className="h-40">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-r from-brand-900 via-brand-700 to-brand-600">
            <div className="h-full w-full" style={COVER_PATTERN} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center px-6 pb-6 text-center">
        <div className="-mt-14">
          {avatar ?? <Avatar name={name} src={avatarUrl} size={112} className="ring-4 ring-white" />}
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-950">{name}</h2>
        {email ? <p className="mt-0.5 text-sm text-slate-500">{email}</p> : null}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {groupName ? <Badge tone="gold">{groupName}</Badge> : null}
        </div>
        <p className="mt-3 text-sm text-slate-500">Ro&apos;yxatdan o&apos;tgan: {fmtDate(createdAt)}</p>
        <p
          className={cn(
            "mt-4 max-w-2xl whitespace-pre-wrap text-sm",
            bio ? "text-slate-700" : "italic text-slate-400",
          )}
        >
          {bio ?? "Bio qo'shilmagan"}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </Card>
  );
}
