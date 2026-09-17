import AdminNav from "@/components/admin/AdminNav";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN"]);

  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
