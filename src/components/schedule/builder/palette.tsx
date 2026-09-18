"use client";

import type { DragEvent } from "react";
import { Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { LegoSurface } from "./lego";
import type { BuilderCourse, DragPayload } from "./types";

function chipClass(active: boolean) {
  return cn(
    "rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150",
    active
      ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-300"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50/60",
  );
}

export function BuilderPalette({
  courses,
  selectedSubject,
  onSelectSubject,
  onDragStart,
  onDragEnd,
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
  courses: BuilderCourse[];
  selectedSubject: string | null;
  onSelectSubject: (subject: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, payload: DragPayload) => void;
  onDragEnd: () => void;
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Fanlar" subtitle={`${courses.length} ta fan — sudrab tashlang`} />
        <CardBody className="max-h-80 space-y-2 overflow-y-auto pr-2">
          {courses.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
              {"Fan topilmadi. Kurslar bo'limida kurs yarating."}
            </p>
          ) : (
            courses.map((course) => (
              <button
                key={course.id}
                type="button"
                draggable
                onDragStart={(event) => onDragStart(event, { kind: "new", subject: course.title })}
                onDragEnd={onDragEnd}
                onClick={() => onSelectSubject(course.title)}
                className="block w-full cursor-grab text-left active:cursor-grabbing"
              >
                <LegoSurface seed={course.title} selected={selectedSubject === course.title} className="px-3 py-2.5">
                  <p className="pr-8 text-sm font-semibold leading-snug">{course.title}</p>
                  <p className="mt-0.5 text-[11px] opacity-70">
                    {[room || "Xonasiz", teacherLabel].filter(Boolean).join(" · ")}
                  </p>
                </LegoSurface>
              </button>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Xonalar" subtitle="Yangi dars uchun xona tanlang" />
        <CardBody className="space-y-4">
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
