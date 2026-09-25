"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody, Label, Select } from "@/components/ui";

export function JournalCourseSelect({
  courses,
  value,
}: {
  courses: { slug: string; title: string }[];
  value: string;
}) {
  const router = useRouter();

  return (
    <Card>
      <CardBody className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-80">
          <Label>Kurs</Label>
          <Select
            value={value}
            onChange={(event) => {
              router.push(`/journal?course=${encodeURIComponent(event.target.value)}`);
            }}
          >
            {courses.map((course) => (
              <option key={course.slug} value={course.slug}>
                {course.title}
              </option>
            ))}
          </Select>
        </div>
        <p className="pb-2 text-xs text-slate-400">
          Guruhni jurnal ichida tanlaysiz · katakka bosib belgilashni o&apos;zgartirasiz
        </p>
      </CardBody>
    </Card>
  );
}
