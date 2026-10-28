import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiEmployees } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const rows = await db.select().from(aiEmployees).orderBy(aiEmployees.id);
  return NextResponse.json({
    employees: rows.map((e) => ({
      id: e.id,
      roleKey: e.roleKey,
      name: e.name,
      roleTitle: e.roleTitle,
      team: e.team,
      description: e.description,
      systemPrompt: e.systemPrompt,
      model: e.model,
      active: e.active,
    })),
  });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.systemPrompt === "string" && body.systemPrompt.trim().length > 10) {
    patch.systemPrompt = body.systemPrompt.trim().slice(0, 4000);
  }
  if (typeof body.model === "string") patch.model = body.model.trim().slice(0, 80) || null;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "لا توجد تغييرات" }, { status: 400 });
  }
  const [row] = await db.update(aiEmployees).set(patch).where(eq(aiEmployees.id, id)).returning({ id: aiEmployees.id });
  if (!row) {
    return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
