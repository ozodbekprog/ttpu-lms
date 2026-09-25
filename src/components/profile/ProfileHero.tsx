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

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200/70">
      {children}
    </span>
  );
}

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
    <Card className="group/hero overflow-hidden">
      <div className="relative h-44 sm:h-52">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/hero:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600">
            <span className="absolute inset-0" style={COVER_PATTERN} />
            <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-gold-400/15 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-brand-400/25 blur-3xl" />
            <span className="pointer-events-none absolute left-8 top-8 hidden size-24 rounded-2xl border border-white/10 sm:block" />
            <span className="pointer-events-none absolute left-16 top-16 hidden size-24 rounded-2xl border border-white/5 sm:block" />
          </div>
        )}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/65 via-brand-950/10 to-transparent" />
      </div>

      <div className="relative flex flex-col items-center px-6 pb-7 text-center">
        <div className="-mt-16">
          {avatar ?? (
            <span className="inline-flex rounded-full bg-gradient-to-br from-brand-500 via-brand-300 to-gold-400 p-[3px] shadow-xl">
              <span className="inline-flex rounded-full bg-white p-[3px]">
                <Avatar name={name} src={avatarUrl} size={98} />
              </span>
            </span>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          {name}
        </h2>

        {email ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Icon className="text-slate-600">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </Icon>
            {email}
          </p>
        ) : null}

        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {groupName ? <Badge tone="gold">{groupName}</Badge> : null}
          <MetaChip>
            <Icon className="text-slate-600">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </Icon>
            Ro&apos;yxatdan o&apos;tgan: {fmtDate(createdAt)}
          </MetaChip>
        </div>

        <div
          className={cn(
            "mt-5 w-full max-w-2xl rounded-2xl px-5 py-4 text-sm ring-1 ring-inset",
            bio
              ? "bg-slate-50/80 text-slate-700 ring-slate-200/60"
              : "bg-slate-50/50 italic text-slate-600 ring-slate-200/50",
          )}
        >
          <p className="whitespace-pre-wrap">{bio ?? "Bio hali qo'shilmagan"}</p>
        </div>

        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </Card>
  );
}
