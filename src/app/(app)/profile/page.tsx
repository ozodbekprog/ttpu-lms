import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { Avatar, Badge, Card, CardBody, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";

const ROLE_META: Record<Role, { label: string; tone: "purple" | "blue" | "green" }> = {
  ADMIN: { label: "Administrator", tone: "purple" },
  TEACHER: { label: "O'qituvchi", tone: "blue" },
  STUDENT: { label: "Talaba", tone: "green" },
};

export default async function ProfilePage() {
  const user = await requireUser();
  const role = ROLE_META[user.role];

  return (
    <>
      <PageHeader title="Profil" subtitle="Shaxsiy ma'lumotlar va xavfsizlik" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center gap-3 text-center">
            {user.avatarUrl ? (
              <span
                role="img"
                aria-label={user.name}
                className="inline-block size-16 shrink-0 rounded-full bg-slate-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${user.avatarUrl})` }}
              />
            ) : (
              <Avatar name={user.name} className="size-16 text-xl" />
            )}
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <Badge tone={role.tone}>{role.label}</Badge>
            <dl className="w-full space-y-2 border-t border-slate-100 pt-4 text-left text-sm">
              {user.group ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Guruh</dt>
                  <dd className="font-medium text-slate-900">{user.group.name}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Ro&apos;yxatdan o&apos;tgan</dt>
                <dd className="font-medium text-slate-900">{fmtDate(user.createdAt)}</dd>
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
