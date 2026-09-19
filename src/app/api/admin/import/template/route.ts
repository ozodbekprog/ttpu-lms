import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const IMPORT_TYPES = ["students", "groups", "subjects"] as const;

type ImportType = (typeof IMPORT_TYPES)[number];

const TEMPLATES: Record<ImportType, { filename: string; body: string }> = {
  students: {
    filename: "talabalar-namuna.csv",
    body: "ism,email,guruh,subGroup,telefon\nAziz Karimov,aziz.karimov@student.ttpu.uz,AI2-27,A,+998901234567\n",
  },
  groups: {
    filename: "guruhlar-namuna.csv",
    body: "nomi,yil,fakultet\nAI2-27,2027,Kompyuter injiniringi\n",
  },
  subjects: {
    filename: "fanlar-namuna.csv",
    body: "nomi,kod,rang\nDasturlash asoslari,CS101,#3f5a9d\n",
  },
};

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const parsed = z.enum(IMPORT_TYPES).safeParse(searchParams.get("type"));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Import turi noto'g'ri" }, { status: 400 });
  }

  const template = TEMPLATES[parsed.data];
  return new Response(`\uFEFF${template.body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
