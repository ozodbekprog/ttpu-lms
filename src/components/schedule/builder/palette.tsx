"use client";

import type { DragEvent } from "react";
import { Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { findCourseForSubject } from "./dictionaries";
import { LegoSurface } from "./lego";
import type { BuilderCourse, BuilderLessonType, BuilderSubject, DragPayload } from "./types";

const GRIP_DOTS = [0, 1, 2, 3, 4, 5];

function chipClass(active: boolean) {
  return cn(
    "rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150",
    active
      ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-300"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50/60",
  );
}

export function BuilderPalette({
  subjects,
  courses,
  selectedSubject,
  onSelectSubject,
  onDragStart,
  onDragEnd,
  lessonTypes,
  lessonType,
  onLessonType,
  rooms,
  room,
  onRoom,
  role,
  fixedTeacher,
  teacherValue,
  onTeacher,
  teacherOptions,
  parity,
  onParity,
}: {
  subjects: BuilderSubject[];
  courses: BuilderCourse[];
  selectedSubject: string | null;
  onSelectSubject: (subject: BuilderSubject) => void;
  onDragStart: (event: DragEvent<HTMLElement>, payload: DragPayload) => void;
  onDragEnd: () => void;
  lessonTypes: BuilderLessonType[];
  lessonType: string;
  onLessonType: (value: string) => void;
  rooms: string[];
  room: string;
  onRoom: (room: string) => void;
  role: "TEACHER" | "ADMIN";
  fixedTeacher: string;
  teacherValue: string;
  onTeacher: (value: string) => void;
  teacherOptions: string[];
  parity: "" | "odd" | "even";
  onParity: (value: "" | "odd" | "even") => void;
}) {
  const teacherLabel = role === "TEACHER" ? fixedTeacher : teacherValue.trim() || "Tanlanmagan";
  const hasLessonType = lessonTypes.some((item) => item.name === lessonType);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Fanlar" subtitle={`${subjects.length} ta fan — sudrab tashlang`} />
        <CardBody className="max-h-80 space-y-2 overflow-y-auto pr-2">
          {subjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
              {"Fan topilmadi. Kurslar bo'limida kurs yarating."}
            </p>
          ) : (
            subjects.map((subject) => {
              const linked = findCourseForSubject(subject, courses);
              return (
                <button
                  key={subject.id ?? subject.name}
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    onDragStart(event, { kind: "new", subject: subject.name, subjectId: subject.id })
                  }
                  onDragEnd={onDragEnd}
                  onClick={() => onSelectSubject(subject)}
                  className="group relative block w-full cursor-grab text-left active:cursor-grabbing"
                >
                  <LegoSurface
                    seed={subject.name}
                    color={subject.color}
                    selected={selectedSubject === subject.name}
                    className="px-3 py-2.5"
                  >
                    <p className="pr-9 text-sm font-semibold leading-snug">{subject.name}</p>
                    <p className="mt-0.5 text-[11px] opacity-70">
                      {[room || "Xonasiz", linked?.teacherName ?? teacherLabel].filter(Boolean).join(" · ")}
                    </p>
                  </LegoSurface>
                  <span className="pointer-events-none absolute right-2 top-1/2 grid -translate-y-1/2 grid-cols-2 gap-0.5 opacity-30 transition-opacity duration-150 group-hover:opacity-80">
                    {GRIP_DOTS.map((dot) => (
                      <span key={dot} className="size-1 rounded-full bg-slate-600" />
                    ))}
                  </span>
                </button>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Dars sozlamalari" subtitle="Turi, xona, hafta va o'qituvchi" />
        <CardBody className="space-y-4">
          <div>
            <Label>Dars turi</Label>
            <Select value={lessonType} onChange={(event) => onLessonType(event.target.value)}>
              {hasLessonType ? null : <option value={lessonType}>{lessonType}</option>}
              {lessonTypes.map((item) => (
                <option key={item.id ?? item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Xona</Label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => onRoom("")} className={chipClass(room === "")}>
                Xonasiz
              </button>
              {rooms.map((item) => (
                <button key={item} type="button" onClick={() => onRoom(item)} className={chipClass(room === item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Hafta turi</Label>
            <Select
              value={parity}
              onChange={(event) => {
                const value = event.target.value;
                onParity(value === "odd" || value === "even" ? value : "");
              }}
            >
              <option value="">Har hafta</option>
              <option value="odd">Toq hafta</option>
              <option value="even">Juft hafta</option>
            </Select>
          </div>

          {role === "ADMIN" ? (
            <div>
              <Label>{"O'qituvchi"}</Label>
              <Input
                list="builder-teachers"
                value={teacherValue}
                onChange={(event) => onTeacher(event.target.value)}
                placeholder="Masalan: A.MAMANAZAROV"
              />
              <datalist id="builder-teachers">
                {teacherOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          ) : (
            <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
              <span className="font-semibold">{fixedTeacher}</span>
              {" sifatida qo'shiladi"}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
