import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { getStaffSessionId } from "@/lib/auth";

// الموظف ينفّذ مهمته فقط: يبدأها ثم يسلّم مخرجاتها.
// لا يستطيع الاعتماد أو رؤية مهام غيره — الاعتماد حصري للوحة المطور.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staffId = await getStaffSessionId();
  if (!staffId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  const body = await req.json();
  const action = String(body.action ?? "");

  const [task] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, taskId), eq(assignments.staffId, staffId)))
    .limit(1);

  if (!task) {
    return NextResponse.json({ error: "المهمة غير موجودة أو ليست مسندة إليك" }, { status: 404 });
  }
  if (task.status === "approved") {
    return NextResponse.json({ error: "تم اعتماد هذه المهمة نهائياً" }, { status: 400 });
  }

  if (action === "start") {
    await db
      .update(assignments)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(assignments.id, taskId));
    return NextResponse.json({ ok: true });
  }

  if (action === "submit") {
    const output = String(body.output ?? "").trim();
    if (output.length < 10) {
      return NextResponse.json(
        { error: "اكتب مخرجات التنفيذ (10 أحرف على الأقل) قبل التسليم" },
        { status: 400 },
      );
    }
    await db
      .update(assignments)
      .set({ output, status: "submitted", updatedAt: new Date() })
      .where(eq(assignments.id, taskId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
