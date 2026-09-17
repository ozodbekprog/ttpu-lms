import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { Avatar, Badge, Card, CardBody, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";

const ROLE_META: Record<Role, { label: string; tone: "brand" | "purple" | "slate" }> = {
  ADMIN: { label: "Administrator", tone: "brand" },
  TEACHER: { label: "O'qituvchi", tone: "purple" },
  STUDENT: { label: "Talaba", tone: "slate" },
};

export default async function ProfilePage() {
  const user = await requireUser();
  const role = ROLE_META[user.role];

  return (
    <>
      <PageHeader eyebrow="Hisob" title="Profil" subtitle="Shaxsiy ma'lumotlar va xavfsizlik" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit overflow-hidden lg:col-span-1">
          <div className="h-20 bg-gradient-to-r from-brand-900 via-brand-700 to-brand-900" />
          <CardBody className="-mt-12 flex flex-col items-center gap-3 text-center">
            {user.avatarUrl ? (
              <span
                role="img"
                aria-label={user.name}
                className="inline-block size-20 shrink-0 rounded-full bg-slate-200 bg-cover bg-center ring-4 ring-white"
                style={{ backgroundImage: `url(${user.avatarUrl})` }}
              />
            ) : (
              <Avatar name={user.name} className="size-20 text-2xl ring-4 ring-white" />
            )}
            <div>
              <p className="text-lg font-semibold tracking-tight text-brand-950">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge tone={role.tone}>{role.label}</Badge>
              {user.group ? <Badge tone="gold">{user.group.name}</Badge> : null}
            </div>
            <dl className="mt-1 w-full space-y-2 border-t border-slate-100 pt-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Ro&apos;yxatdan o&apos;tgan</dt>
                <dd className="font-medium text-slate-900">{fmtDate(user.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Holat</dt>
                <dd>
                  <Badge tone="green">Faol</Badge>
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <ProfileForm initialName={user.name} initialAvatarUrl={user.avatarUrl} />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}
