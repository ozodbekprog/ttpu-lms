import { Avatar, Card, CardHeader, EmptyState, Table } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export type CourseStudent = {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    group: { name: string } | null;
  };
};

export function CourseStudents({ enrollments }: { enrollments: CourseStudent[] }) {
  if (enrollments.length === 0) {
    return <EmptyState title="Talabalar yo'q" description="Bu kursga hali talaba yozilmagan." />;
  }

  return (
    <Card>
      <CardHeader title="Talabalar" subtitle={`${enrollments.length} ta yozilgan`} />
      <Table>
        <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3 font-medium">#</th>
            <th className="px-5 py-3 font-medium">Talaba</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Guruh</th>
            <th className="px-5 py-3 font-medium">Yozilgan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {enrollments.map((enrollment, index) => (
            <tr key={enrollment.id}>
              <td className="px-5 py-3 text-slate-400">{index + 1}</td>
              <td className="px-5 py-3">
                <span className="flex items-center gap-2">
                  <Avatar name={enrollment.user.name} className="size-7 text-[10px]" />
                  <span className="font-medium text-slate-800">{enrollment.user.name}</span>
                </span>
              </td>
              <td className="px-5 py-3 text-slate-500">{enrollment.user.email}</td>
              <td className="px-5 py-3 text-slate-500">{enrollment.user.group?.name ?? "—"}</td>
              <td className="px-5 py-3 text-slate-500">{fmtDate(enrollment.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
