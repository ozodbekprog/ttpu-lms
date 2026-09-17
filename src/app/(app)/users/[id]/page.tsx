import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, PageHeader } from "@/components/ui";
import { ProfileHero, ROLE_META } from "@/components/profile/ProfileHero";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const current = await requireUser();
  const { id } = await params;

  const profile = await prisma.user.findUnique({ where: { id }, include: { group: true } });
  if (!profile || !profile.isActive) notFound();

  const isOwn = profile.id === current.id;

  return (
    <>
      <PageHeader
        eyebrow="Foydalanuvchi"
        title={profile.name}
        subtitle={ROLE_META[profile.role].label}
      />
      <ProfileHero
        name={profile.name}
        role={profile.role}
        avatarUrl={profile.avatarUrl}
        coverUrl={profile.coverUrl}
        bio={profile.bio}
        createdAt={profile.createdAt}
        groupName={profile.group?.name ?? null}
        action={
          isOwn ? (
            <ButtonLink href="/profile" variant="secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Profilni tahrirlash
            </ButtonLink>
          ) : (
            <ButtonLink href={`/messages?user=${profile.id}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
              </svg>
              Xabar yozish
            </ButtonLink>
          )
        }
      />
    </>
  );
}
