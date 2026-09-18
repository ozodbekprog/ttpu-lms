import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, CardBody, Input, PageHeader, Select } from "@/components/ui";
import UsersManager from "@/components/admin/UsersManager";

const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const admin = await requireRole(["ADMIN"]);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role =
    typeof params.role === "string" && ROLES.includes(params.role as (typeof ROLES)[number])
      ? (params.role as (typeof ROLES)[number])
      : "";

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;

  const [users, groups] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Foydalanuvchilar" subtitle={`${users.length} ta natija`} />

      <form action="/admin/users" method="get" className="mb-4">
        <Card className="overflow-hidden">
          <CardBody className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-80">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <Input name="q" defaultValue={q} placeholder="Ism yoki email..." className="pl-9" />
            </div>
            <Select name="role" defaultValue={role} className="w-full sm:w-48">
              <option value="">Barcha rollar</option>
              <option value="STUDENT">Talaba</option>
              <option value="TEACHER">O&apos;qituvchi</option>
              <option value="ADMIN">Administrator</option>
            </Select>
            <Button type="submit" variant="secondary" className="gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              Qidirish
            </Button>
            {q || role ? (
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Tozalash
              </Link>
            ) : null}
            <span className="ml-auto hidden items-center gap-2 text-xs font-medium text-slate-400 sm:inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {users.length} natija
            </span>
          </CardBody>
        </Card>
      </form>

      <UsersManager users={users} groups={groups} currentUserId={admin.id} />
    </>
  );
}
