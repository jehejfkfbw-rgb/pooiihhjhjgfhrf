import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

// مراجعة مخرجات الموظف: اعتماد أو رفض مع ملاحظة — حصري للمطور/المدير
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const action = String(body.action ?? "");
  const note = String(body.note ?? "").trim();

  if (action === "approve" || action === "reject") {
    const [row] = await db
      .update(assignments)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        adminNote: note || null,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, taskId))
      .returning({ id: assignments.id });
    if (!row) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await db.delete(assignments).where(eq(assignments.id, taskId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
