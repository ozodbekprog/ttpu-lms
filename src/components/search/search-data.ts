import "server-only";
import type { MaterialType, Prisma, Role } from "@prisma/client";
import { isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_TAKE = 10;

export type SearchCourseRef = {
  id: string;
  slug: string;
  title: string;
};

export type SearchCourseItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverColor: string;
};

export type SearchMaterialItem = {
  id: string;
  title: string;
  type: MaterialType;
  content: string | null;
  course: SearchCourseRef;
};

export type SearchAssignmentItem = {
  id: string;
  title: string;
  dueAt: Date | null;
  course: SearchCourseRef;
};

export type SearchQuizItem = {
  id: string;
  title: string;
  dueAt: Date | null;
  course: SearchCourseRef;
};

export type SearchUserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
};

export type SearchResults = {
  courses: SearchCourseItem[];
  materials: SearchMaterialItem[];
  assignments: SearchAssignmentItem[];
  quizzes: SearchQuizItem[];
  users: SearchUserItem[];
};

export const EMPTY_SEARCH_RESULTS: SearchResults = {
  courses: [],
  materials: [],
  assignments: [],
  quizzes: [],
  users: [],
};

type SearchUser = {
  id: string;
  role: Role;
};

function courseScope(user: SearchUser): Prisma.CourseWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "TEACHER") return { teacherId: user.id };
  return { enrollments: { some: { userId: user.id } } };
}

export async function searchAll(user: SearchUser, rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (q.length < SEARCH_MIN_LENGTH) return EMPTY_SEARCH_RESULTS;

  const scope = courseScope(user);

  const [courses, materials, assignments, quizzes, users] = await Promise.all([
    prisma.course.findMany({
      where: {
        ...scope,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { title: "asc" },
      take: SEARCH_TAKE,
      select: { id: true, slug: true, title: true, description: true, coverColor: true },
    }),
    prisma.material.findMany({
      where: {
        section: { course: scope },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_TAKE,
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        section: { select: { course: { select: { id: true, slug: true, title: true } } } },
      },
    }),
    prisma.assignment.findMany({
      where: {
        course: scope,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_TAKE,
      select: {
        id: true,
        title: true,
        dueAt: true,
        course: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.quiz.findMany({
      where: {
        ...(user.role === "STUDENT" ? { isPublished: true } : {}),
        course: scope,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_TAKE,
      select: {
        id: true,
        title: true,
        dueAt: true,
        course: { select: { id: true, slug: true, title: true } },
      },
    }),
    isStaff(user.role)
      ? prisma.user.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { name: "asc" },
          take: SEARCH_TAKE,
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        })
      : Promise.resolve([] as SearchUserItem[]),
  ]);

  return {
    courses,
    materials: materials.map((material) => ({
      id: material.id,
      title: material.title,
      type: material.type,
      content: material.content,
      course: material.section.course,
    })),
    assignments,
    quizzes,
    users,
  };
}
