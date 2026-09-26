import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { ROLE_META } from "@/components/profile/ProfileHero";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function ProfileDetails({
  email,
  role,
  groupName,
  createdAt,
}: {
  email: string;
  role: Role;
  groupName: string | null;
  createdAt: Date;
}) {
  const rows = [
    {
      label: "Email",
      value: email,
      icon: (
        <Icon>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </Icon>
      ),
    },
    {
      label: "Rol",
      value: ROLE_META[role].label,
      icon: (
        <Icon>
          <path d="M12 3 5 6v6c0 4.4 3 8.4 7 9 4-0.6 7-4.6 7-9V6z" />
        </Icon>
      ),
    },
    {
      label: "Guruh",
      value: groupName ?? "—",
      icon: (
        <Icon>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </Icon>
      ),
    },
    {
      label: "Ro'yxatdan o'tgan",
      value: fmtDate(createdAt),
      icon: (
        <Icon>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </Icon>
      ),
    },
  ];

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader title="Hisob ma'lumotlari" subtitle="Ochiq profil ma'lumotlari" />
      <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start gap-3 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-inset ring-slate-200/60 transition-colors duration-200 hover:bg-white hover:ring-brand-100"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-inset ring-slate-200/70">
              {row.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {row.label}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-slate-800">{row.value}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
